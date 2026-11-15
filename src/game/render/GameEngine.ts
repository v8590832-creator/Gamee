import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getLevelById, getNextLevelId } from '../data/levels';
import { WORLD_THEMES } from '../data/worlds';
import { computeLevelScore } from '../physics/math';
import type {
  GameSettings,
  GameState,
  HudSnapshot,
  LevelDefinition,
  OrbSkinId,
  RunSummary,
  WorldTheme,
} from '../types';
import { AchievementManager } from '../systems/AchievementManager';
import { AudioManager } from '../systems/AudioManager';
import { BounceSystem } from '../systems/BounceSystem';
import { CheckpointManager } from '../systems/CheckpointManager';
import { CollectibleManager } from '../systems/CollectibleManager';
import { GravityController } from '../systems/GravityController';
import { PhysicsManager } from '../systems/PhysicsManager';
import { PlayerController } from '../systems/PlayerController';
import { PortalSystem } from '../systems/PortalSystem';
import { SaveManager } from '../systems/SaveManager';
import { createPlayerOrb, type PlayerOrbRig } from './OrbBuilder';
import { ParticlePool } from './ParticlePool';
import { createProceduralTextures, type ProceduralTextureSet } from './ProceduralTextures';
import { buildLevelScene, type BuiltLevelScene } from './WorldBuilder';

// Pre-allocated scratch math helpers (zero GC inside render loop)
const _upVec = new THREE.Vector3(0, 1, 0);
const _rollAxis = new THREE.Vector3();
const _velVec = new THREE.Vector3();
const _deltaQuat = new THREE.Quaternion();
const _camGoalPos = new THREE.Vector3();
const _camLookPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onStateChange: (state: GameState) => void;
  onLevelComplete: (summary: RunSummary) => void;
}

function detectSoftwareGl(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private textures: ProceduralTextureSet;
  private particles: ParticlePool;
  private orb: PlayerOrbRig;
  private skyDome: THREE.Mesh;
  private skyUniforms: {
    uTopColor: { value: THREE.Color };
    uHorizonColor: { value: THREE.Color };
    uBottomColor: { value: THREE.Color };
  };

  // Lighting
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  // Systems
  public readonly saveManager: SaveManager;
  public readonly audioManager: AudioManager;
  public readonly achievementManager: AchievementManager;
  private readonly bounceSystem = new BounceSystem();
  private readonly gravityController = new GravityController();
  private readonly portalSystem = new PortalSystem();
  private readonly checkpointManager = new CheckpointManager();
  private readonly collectibleManager = new CollectibleManager();
  private readonly physicsManager = new PhysicsManager();
  private readonly playerController = new PlayerController();

  private settings: GameSettings;
  private callbacks: EngineCallbacks;

  private currentLevel: LevelDefinition;
  private currentTheme: WorldTheme;
  private builtLevel: BuiltLevelScene | null = null;

  private gameState: GameState = 'title';
  private frameId = 0;
  private disposed = false;
  private lastTimestamp = 0;
  private realTime = 0;
  private worldTime = 0;
  private elapsedRunTime = 0;
  private hudSyncAccum = 0;
  private trailAccum = 0;
  private fallsCount = 0;
  private hitstopTimer = 0;
  private cameraTrauma = 0;

  // Camera state
  private camYaw = 0;
  private camPitch = 0.34;
  private airPitchOffset = 0;
  private camDistance = 8.8;
  private currentCamPos = new THREE.Vector3(0, 6, 10);
  private currentCamLook = new THREE.Vector3(0, 1, -6);
  private currentCamUp = new THREE.Vector3(0, 1, 0);

  // Notices
  private checkpointNotice: string | null = null;
  private checkpointNoticeTimer = 0;
  private achievementNotice: string | null = null;
  private achievementNoticeTimer = 0;
  private nearbySwitchId: string | null = null;

  // Input state
  private keysPressed = new Set<string>();
  private pointerDown = false;
  private prevPauseKey = false;
  private prevRestartKey = false;

  constructor(
    container: HTMLElement,
    saveManager: SaveManager,
    audioManager: AudioManager,
    settings: GameSettings,
    callbacks: EngineCallbacks
  ) {
    this.container = container;
    this.saveManager = saveManager;
    this.audioManager = audioManager;
    this.achievementManager = new AchievementManager(saveManager);
    this.settings = settings;
    this.callbacks = callbacks;

    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.applyQualitySettings(settings);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // Atmospheric gradient sky dome (BackSide, follows camera)
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color('#161f2b') },
      uHorizonColor: { value: new THREE.Color('#384654') },
      uBottomColor: { value: new THREE.Color('#2c3744') },
    };
    const skyGeo = new THREE.SphereGeometry(280, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `
        varying vec3 vLocalDir;
        void main() {
          vLocalDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uBottomColor;
        varying vec3 vLocalDir;
        void main() {
          float h = vLocalDir.y;
          vec3 col = h >= 0.0
            ? mix(uHorizonColor, uTopColor, pow(clamp(h, 0.0, 1.0), 0.58))
            : mix(uHorizonColor, uBottomColor, pow(clamp(-h * 1.6, 0.0, 1.0), 0.72));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.frustumCulled = false;
    this.scene.add(this.skyDome);

    // Studio PBR environment map on every device
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 420);

    // 3-Point Warm/Cool Studio Rig
    this.hemiLight = new THREE.HemisphereLight('#7b9bbf', '#3a2d24', 1.05);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#ffdfb0', 2.35);
    this.keyLight.position.set(22, 36, 18);
    this.keyLight.castShadow = !this.isSoftwareGl && settings.graphicsQuality !== 'low';
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 140;
    const d = 48;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    this.rimLight = new THREE.DirectionalLight('#8ab4e8', 0.65);
    this.rimLight.position.set(-18, 14, -30);
    this.scene.add(this.rimLight);

    this.textures = createProceduralTextures(this.renderer.capabilities.getMaxAnisotropy());
    this.particles = new ParticlePool();
    this.scene.add(this.particles.mesh);

    const equippedSkin = saveManager.getData().equippedSkin;
    this.orb = createPlayerOrb(
      equippedSkin,
      this.textures.contactShadow,
      !this.isSoftwareGl
    );
    this.scene.add(this.orb.root);
    this.scene.add(this.orb.contactShadow);

    this.currentLevel = getLevelById(saveManager.getData().lastPlayedLevelId);
    this.currentTheme = WORLD_THEMES[this.currentLevel.worldId];
    this.loadLevel(this.currentLevel.id, false);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.startLoop();
  }

  public updateCallbacks(callbacks: EngineCallbacks): void {
    this.callbacks = callbacks;
  }

  public updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.audioManager.updateSettings(settings);
    this.applyQualitySettings(settings);
  }

  public setSkin(skinId: OrbSkinId): void {
    this.orb.applySkin(skinId);
  }

  private applyQualitySettings(settings: GameSettings): void {
    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      return;
    }
    const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
    const qualMul =
      settings.graphicsQuality === 'low' ? 0.75 : settings.graphicsQuality === 'medium' ? 0.9 : 1.0;
    this.renderer.setPixelRatio(Math.max(0.6, baseDpr * settings.resolutionScale * qualMul));
    this.renderer.shadowMap.enabled = settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (this.keyLight) {
      this.keyLight.castShadow = settings.graphicsQuality !== 'low';
    }
  }

  public loadLevel(levelId: string, startPlaying = true): void {
    const level = getLevelById(levelId);
    const theme = WORLD_THEMES[level.worldId];
    this.currentLevel = level;
    this.currentTheme = theme;

    if (this.builtLevel) {
      this.scene.remove(this.builtLevel.root);
      this.builtLevel.dispose();
      this.builtLevel = null;
    }

    this.scene.background = new THREE.Color(theme.skyHorizon);
    this.scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);
    this.skyUniforms.uTopColor.value.set(theme.skyTop);
    this.skyUniforms.uHorizonColor.value.set(theme.skyHorizon);
    this.skyUniforms.uBottomColor.value.set(theme.fogColor);

    this.keyLight.color.set(theme.keyLightColor);
    this.keyLight.intensity = theme.keyLightIntensity;
    this.hemiLight.color.set(theme.hemiSkyColor);
    this.hemiLight.groundColor.set(theme.hemiGroundColor);
    this.hemiLight.intensity = theme.hemiIntensity;

    this.builtLevel = buildLevelScene(level, theme, this.textures);
    this.scene.add(this.builtLevel.root);

    this.audioManager.setWorldProfile(theme.ambientBaseHz);
    this.resetRunState();

    if (startPlaying) {
      this.setGameState('playing');
      this.skyDome.position.copy(this.camera.position);
      this.renderer.render(this.scene, this.camera);
    } else {
      this.emitHud();
    }
  }

  private resetRunState(): void {
    const level = this.currentLevel;
    this.bounceSystem.reset();
    this.gravityController.reset();
    this.portalSystem.reset();
    this.checkpointManager.reset(level.spawn);
    this.collectibleManager.reset();
    this.playerController.reset(level.spawn);
    if (this.builtLevel) {
      for (const p of this.builtLevel.platforms) {
        p.crumbleState = 'intact';
        p.crumbleTimer = 0;
        p.padPulse = 0;
        p.active = p.def.kind === 'bridge' ? p.def.startsActive !== false : true;
        p.currentPos = { ...p.def.position };
        p.group.position.set(p.currentPos.x, p.currentPos.y, p.currentPos.z);
        p.group.visible = p.active;
      }
      for (const cp of this.builtLevel.checkpoints) {
        cp.activated = false;
        cp.beaconMat.color.set('#6b7785');
        cp.beaconMat.emissive.set('#384654');
        cp.beaconMat.emissiveIntensity = 0.4;
      }
      for (const col of this.builtLevel.collectibles) {
        col.collected = false;
        col.group.visible = true;
      }
      for (const sw of this.builtLevel.switches) {
        sw.activated = false;
        sw.crystalMat.color.set('#d96b38');
        sw.crystalMat.emissive.set('#b5461b');
      }
      this.physicsManager.reset(this.builtLevel.platforms);
    }

    this.elapsedRunTime = 0;
    this.fallsCount = 0;
    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.checkpointNotice = null;
    this.achievementNotice = null;
    this.nearbySwitchId = null;

    this.camYaw = level.spawnYaw ?? 0;
    this.camPitch = 0.34;
    this.airPitchOffset = 0;
    this.currentCamUp.set(0, 1, 0);
    this.orb.root.position.set(level.spawn.x, level.spawn.y, level.spawn.z);
    this.orb.rollGroup.quaternion.identity();

    // Immediately position gameplay camera behind spawn facing -Z landmark
    this.currentCamPos.set(
      level.spawn.x + Math.sin(this.camYaw) * this.camDistance,
      level.spawn.y + 4.2,
      level.spawn.z + Math.cos(this.camYaw) * this.camDistance
    );
    this.currentCamLook.set(level.spawn.x, level.spawn.y + 0.5, level.spawn.z - 6);
    this.camera.position.copy(this.currentCamPos);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(this.currentCamLook);
  }

  public restartLevel(): void {
    this.loadLevel(this.currentLevel.id, true);
  }

  public setGameState(next: GameState): void {
    this.gameState = next;
    document.body.dataset.state = next;
    if (next !== 'playing') {
      this.keysPressed.clear();
      this.pointerDown = false;
      this.audioManager.silenceLoops();
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
    } else {
      this.audioManager.unlock();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
    this.callbacks.onStateChange(next);
    this.emitHud();
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public getCurrentLevel(): LevelDefinition {
    return this.currentLevel;
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.onCanvasMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('wheel', this.onWheel, { passive: true });
    canvas.addEventListener('webglcontextlost', this.onContextLost);
  }

  private unbindEvents(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onCanvasMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
  }

  private onContextLost = (e: Event): void => {
    e.preventDefault();
  };

  private onResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    // Allow Escape / Pause key to toggle pause immediately
    if (e.code === this.settings.bindings.pause || e.code === 'KeyP') {
      if (!this.prevPauseKey) {
        this.prevPauseKey = true;
        if (this.gameState === 'playing') {
          this.setGameState('paused');
        } else if (this.gameState === 'paused') {
          this.setGameState('playing');
        }
      }
      return;
    }

    if (e.code === this.settings.bindings.restart && this.gameState === 'playing') {
      if (!this.prevRestartKey) {
        this.prevRestartKey = true;
        this.respawnAtCheckpoint();
      }
    }

    if (
      this.gameState === 'playing' &&
      (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight')
    ) {
      e.preventDefault();
    }
    this.keysPressed.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === this.settings.bindings.pause || e.code === 'KeyP') {
      this.prevPauseKey = false;
    }
    if (e.code === this.settings.bindings.restart) {
      this.prevRestartKey = false;
    }
    this.keysPressed.delete(e.code);
  };

  private onBlur = (): void => {
    this.keysPressed.clear();
    this.pointerDown = false;
  };

  private onVisibilityChange = (): void => {
    if (document.hidden) {
      this.keysPressed.clear();
      this.pointerDown = false;
    }
  };

  private onCanvasMouseDown = (e: MouseEvent): void => {
    if (this.gameState !== 'playing') return;
    this.audioManager.unlock();
    this.pointerDown = true;
    // Request pointer lock on user canvas click for seamless mouse camera orbit
    if (e.button === 0 && !document.pointerLockElement && !this.isSoftwareGl) {
      this.renderer.domElement.requestPointerLock?.();
    }
  };

  private onMouseUp = (): void => {
    this.pointerDown = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.gameState !== 'playing') return;
    if (!document.pointerLockElement && !this.pointerDown) return;
    const sens = 0.0026 * this.settings.mouseSensitivity * this.settings.cameraSensitivity;
    this.camYaw -= e.movementX * sens;
    this.camPitch = Math.max(-0.35, Math.min(1.15, this.camPitch + e.movementY * sens));
  };

  private onWheel = (e: WheelEvent): void => {
    if (this.gameState !== 'playing') return;
    this.camDistance = Math.max(5.5, Math.min(14.5, this.camDistance + e.deltaY * 0.004));
  };

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    this.scheduleNext();
  }

  private scheduleNext(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        if (sync) {
          const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            this.frameId = window.setTimeout(poll, 5);
            return;
          }
          gl.deleteSync(sync);
        }
        this.frameId = window.setTimeout(this.tick, 80);
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private tick = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = Math.max(0.001, (now - this.lastTimestamp) / 1000);
    this.lastTimestamp = now;
    const dt = Math.min(rawDt, 0.05);

    this.realTime += dt;

    if (this.gameState === 'title') {
      this.updateTitleFlyover(dt);
    } else if (this.gameState === 'playing') {
      this.updatePlaying(dt);
    } else {
      // Paused or GameOver: freeze gameplay simulation, keep subtle visual polish
      this.particles.update(0);
    }

    this.skyDome.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNext();
  };

  private updateTitleFlyover(dt: number): void {
    this.worldTime += dt;
    this.builtLevel?.updateAnimations(this.worldTime, this.realTime, dt);
    this.orb.updateVisuals(this.realTime, dt, 2, false);

    // Smooth cinematic orbit around World 01 approach & distant landmark
    const angle = this.realTime * 0.14;
    const focusZ = -32;
    const radius = 26;
    this.camera.position.set(
      Math.sin(angle) * radius,
      14 + Math.sin(this.realTime * 0.25) * 3,
      focusZ + Math.cos(angle) * radius
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 3, -38);
  }

  private updatePlaying(dt: number): void {
    const level = this.currentLevel;
    const input = this.playerController.sampleInput(this.keysPressed, this.settings.bindings);

    // 1. Time Control ([T] hold or toggle energy)
    let timeSlowActive = false;
    if (level.allowTimeControl && input.timeSlowHeld && this.playerController.timeSlowEnergy > 0.04) {
      timeSlowActive = true;
      this.playerController.timeSlowEnergy = Math.max(0, this.playerController.timeSlowEnergy - dt * 0.34);
      const ach = this.achievementManager.evaluateAction('timeSlow');
      if (ach) this.showAchievementNotice(ach.name);
    } else {
      this.playerController.timeSlowEnergy = Math.min(1, this.playerController.timeSlowEnergy + dt * 0.22);
    }

    const worldScale = timeSlowActive ? 0.28 : 1.0;

    // Hitstop freeze on heavy bounce impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.particles.update(dt);
      this.updateCamera(dt, false);
      return;
    }

    const playerDt = dt;
    const worldDt = dt * worldScale;
    this.worldTime += worldDt;
    this.elapsedRunTime += dt;

    // 2. Gravity Shift ([Q])
    if (input.gravityPressed) {
      const toggled = this.gravityController.tryToggle(level.allowGravityShift);
      if (toggled) {
        this.audioManager.playGravityShift(this.gravityController.playerInverted);
        this.particles.spawnBurst(
          this.playerController.position.x,
          this.playerController.position.y,
          this.playerController.position.z,
          12,
          '#48b8d0',
          5.5,
          0.45,
          0.9,
          0
        );
        const ach = this.achievementManager.evaluateAction('gravity');
        if (ach) this.showAchievementNotice(ach.name);
      }
    }

    if (this.builtLevel) {
      this.builtLevel.updateAnimations(this.worldTime, this.realTime, worldDt);
      this.gravityController.update(playerDt, this.playerController.position, this.builtLevel.platforms);
    }

    const upDir = this.gravityController.getUpDirection();

    // 3. Player Movement, Jump & Momentum Dash
    const moveRes = this.playerController.applyMovementAndAbilities(
      playerDt,
      input,
      this.camYaw,
      upDir,
      level.allowDash
    );

    if (moveRes.jumped) {
      this.audioManager.playJump();
      this.particles.spawnBurst(
        this.playerController.position.x,
        this.playerController.position.y - 0.4 * upDir.y,
        this.playerController.position.z,
        6,
        this.currentTheme.accentColor,
        4.2,
        0.35,
        0.7,
        1.2 * upDir.y
      );
    }

    if (moveRes.dashed) {
      this.audioManager.playDash();
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
      this.particles.spawnBurst(
        this.playerController.position.x,
        this.playerController.position.y,
        this.playerController.position.z,
        14,
        this.currentTheme.accentColor,
        8.0,
        0.45,
        1.0,
        0.5
      );
    }

    // 4. Physics Step
    if (this.builtLevel) {
      const phys = this.physicsManager.step(
        playerDt,
        worldDt,
        this.playerController.position,
        this.playerController.velocity,
        this.builtLevel.platforms,
        this.gravityController,
        this.bounceSystem,
        this.playerController.grounded
      );

      this.playerController.grounded = phys.grounded;

      if (phys.landedImpact > 4.5) {
        this.playerController.triggerLandSquash(phys.landedImpact);
        this.orb.triggerImpactShockwave(
          this.playerController.position.x,
          this.playerController.position.y,
          this.playerController.position.z,
          this.currentTheme.accentColor,
          1.35
        );
      }

      for (const b of phys.bounceEvents) {
        if (b.padHit) {
          this.audioManager.playBounce(b.impactSpeed / 14);
          this.hitstopTimer = 0.032;
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.45);
          this.playerController.squashY = 1.28;
          this.playerController.squashXZ = 0.8;
          this.orb.triggerImpactShockwave(
            b.position.x,
            b.position.y,
            b.position.z,
            this.currentTheme.accentColor,
            2.4
          );
          this.particles.spawnBurst(
            b.position.x,
            b.position.y,
            b.position.z,
            16,
            this.currentTheme.accentColor,
            7.5,
            0.55,
            1.1,
            3.5
          );
          const ach = this.achievementManager.evaluateAction('bounce');
          if (ach) this.showAchievementNotice(ach.name);
        } else {
          this.audioManager.playBounce(0.45);
          if (b.impactSpeed > 6.0) {
            this.orb.triggerImpactShockwave(
              b.position.x,
              b.position.y,
              b.position.z,
              '#cbd5e1',
              1.25
            );
          }
          this.particles.spawnBurst(
            b.position.x,
            b.position.y,
            b.position.z,
            5,
            '#cbd5e1',
            3.5,
            0.3,
            0.6,
            1.2
          );
        }
      }

      // Position grounded contact shadow
      if (phys.hasGroundBelow) {
        this.orb.contactShadow.visible = true;
        this.orb.contactShadow.position.set(
          this.playerController.position.x,
          phys.groundY + (this.gravityController.playerInverted ? -0.02 : 0.02),
          this.playerController.position.z
        );
        const heightDist = Math.abs(this.playerController.position.y - phys.groundY);
        const shadowScale = Math.max(0.45, 1.15 - heightDist * 0.07);
        this.orb.contactShadow.scale.set(shadowScale, shadowScale, 1);
      } else {
        this.orb.contactShadow.visible = false;
      }

      // 5. Spatial Portals
      const portalRes = this.portalSystem.update(
        playerDt,
        this.playerController.position,
        this.playerController.velocity,
        this.builtLevel.portals
      );
      if (portalRes.teleported) {
        this.playerController.position = portalRes.newPos;
        this.playerController.velocity = portalRes.newVel;
        this.audioManager.playPortal();
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.4);
        this.particles.spawnBurst(
          portalRes.newPos.x,
          portalRes.newPos.y,
          portalRes.newPos.z,
          18,
          '#48b8d0',
          8.5,
          0.5,
          1.0,
          0.5
        );
        const ach = this.achievementManager.evaluateAction('portal');
        if (ach) this.showAchievementNotice(ach.name);
      }

      // 6. Interactive Switches ([E])
      this.nearbySwitchId = null;
      for (const sw of this.builtLevel.switches) {
        if (sw.activated) continue;
        const d = Math.hypot(
          this.playerController.position.x - sw.def.position.x,
          this.playerController.position.y - (sw.def.position.y + 0.8),
          this.playerController.position.z - sw.def.position.z
        );
        if (d < 3.0) {
          this.nearbySwitchId = sw.def.label;
          if (input.interactPressed) {
            sw.activated = true;
            sw.crystalMat.color.set('#58c477');
            sw.crystalMat.emissive.set('#2d8a4b');
            this.audioManager.playSwitch();
            for (const p of this.builtLevel.platforms) {
              if (p.def.kind === 'bridge' && p.def.switchId === sw.def.id) {
                p.active = true;
              }
            }
            this.particles.spawnBurst(
              sw.def.position.x,
              sw.def.position.y + 1.4,
              sw.def.position.z,
              14,
              '#58c477',
              5.5,
              0.5,
              0.9,
              2.0
            );
          }
        }
      }

      // 7. Checkpoints
      const cpTriggered = this.checkpointManager.checkTriggers(
        this.playerController.position,
        this.gravityController.playerInverted,
        this.builtLevel.checkpoints,
        this.currentTheme.accentColor
      );
      if (cpTriggered) {
        this.audioManager.playCheckpoint();
        this.checkpointNotice = `Checkpoint · ${cpTriggered}`;
        this.checkpointNoticeTimer = 2.6;
        this.particles.spawnBurst(
          this.playerController.position.x,
          this.playerController.position.y,
          this.playerController.position.z,
          14,
          this.currentTheme.accentColor,
          5.0,
          0.5,
          0.9,
          2.8
        );
      }

      // 8. Collectibles
      const colRes = this.collectibleManager.checkPickups(
        this.playerController.position,
        this.builtLevel.collectibles
      );
      if (colRes.picked) {
        this.audioManager.playCollectible(this.collectibleManager.collectedIds.length - 1);
        this.particles.spawnBurst(
          colRes.picked.def.position.x,
          colRes.picked.def.position.y,
          colRes.picked.def.position.z,
          14,
          this.currentTheme.accentColor,
          6.0,
          0.5,
          0.95,
          2.0
        );
      }
    }

    // 9. Abyss / Ceiling Out-of-Bounds Respawn
    const ceilY = level.ceilingLimitY ?? 45;
    if (this.playerController.position.y < level.fallLimitY || this.playerController.position.y > ceilY) {
      this.fallsCount += 1;
      this.audioManager.playFall();
      this.respawnAtCheckpoint();
    }

    // 10. Finish Beacon Check
    const distToFinish = Math.hypot(
      this.playerController.position.x - level.finishPosition.x,
      this.playerController.position.y - (level.finishPosition.y + 1.2),
      this.playerController.position.z - level.finishPosition.z
    );
    if (distToFinish < 2.35) {
      this.handleLevelComplete();
      return;
    }

    // 11. Update Orb Mesh Transform, Rolling Rotation & Trail Particles
    const pos = this.playerController.position;
    const vel = this.playerController.velocity;
    const speed = Math.hypot(vel.x, vel.y, vel.z);

    this.orb.root.position.set(pos.x, pos.y, pos.z);
    this.orb.root.scale.set(
      this.playerController.squashXZ,
      this.playerController.squashY,
      this.playerController.squashXZ
    );

    const horizSpeed = Math.hypot(vel.x, vel.z);
    if (horizSpeed > 0.1) {
      _velVec.set(vel.x, 0, vel.z);
      _upVec.set(upDir.x, upDir.y, upDir.z);
      _rollAxis.crossVectors(_upVec, _velVec).normalize();
      if (_rollAxis.lengthSq() > 0.1) {
        const angle = (horizSpeed * playerDt) / this.physicsManager.radius;
        _deltaQuat.setFromAxisAngle(_rollAxis, angle);
        this.orb.rollGroup.quaternion.premultiply(_deltaQuat);
      }
    }

    this.orb.updateVisuals(this.realTime, playerDt, speed, this.playerController.dashActiveTimer > 0);
    this.audioManager.updateRolling(horizSpeed, this.playerController.grounded, timeSlowActive);

    this.trailAccum += playerDt;
    if (this.trailAccum >= (this.playerController.dashActiveTimer > 0 ? 0.02 : 0.055) && speed > 3.5) {
      this.trailAccum = 0;
      this.particles.spawnTrailPoint(
        pos.x,
        pos.y,
        pos.z,
        this.playerController.dashActiveTimer > 0 ? '#fff3d1' : this.currentTheme.accentColor,
        this.playerController.dashActiveTimer > 0 ? 1.1 : 0.7
      );
    }

    this.particles.update(playerDt);
    this.updateCamera(dt, this.playerController.dashActiveTimer > 0);

    // 12. Notice timers & throttled HUD sync (<= 10Hz)
    if (this.checkpointNoticeTimer > 0) {
      this.checkpointNoticeTimer -= dt;
      if (this.checkpointNoticeTimer <= 0) this.checkpointNotice = null;
    }
    if (this.achievementNoticeTimer > 0) {
      this.achievementNoticeTimer -= dt;
      if (this.achievementNoticeTimer <= 0) this.achievementNotice = null;
    }

    this.hudSyncAccum += dt;
    if (this.hudSyncAccum >= 0.1) {
      this.hudSyncAccum = 0;
      this.emitHud(timeSlowActive);
    }
  }

  private respawnAtCheckpoint(): void {
    const cp = this.checkpointManager;
    this.playerController.position = { ...cp.activeSpawn };
    this.playerController.velocity = { x: 0, y: 0, z: 0 };
    this.gravityController.playerInverted = cp.activeGravityInverted;
    this.gravityController.cooldown = 0;
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);

    if (this.builtLevel) {
      for (const p of this.builtLevel.platforms) {
        if (p.def.kind === 'crumbling') {
          p.crumbleState = 'intact';
          p.crumbleTimer = 0;
        }
      }
    }

    this.particles.spawnBurst(
      cp.activeSpawn.x,
      cp.activeSpawn.y,
      cp.activeSpawn.z,
      14,
      this.currentTheme.accentColor,
      5.0,
      0.45,
      0.85,
      1.0
    );
    this.emitHud();
  }

  private handleLevelComplete(): void {
    this.audioManager.silenceLoops();
    this.audioManager.playVictory();
    this.particles.spawnBurst(
      this.currentLevel.finishPosition.x,
      this.currentLevel.finishPosition.y + 1.5,
      this.currentLevel.finishPosition.z,
      36,
      this.currentTheme.accentColor,
      9.0,
      0.85,
      1.2,
      4.0
    );

    const score = computeLevelScore({
      elapsedTime: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
      comboBounces: this.bounceSystem.comboBounces,
    });

    const nextLevelId = getNextLevelId(this.currentLevel.id);
    const { isNewBest, previousBest } = this.saveManager.recordLevelCompletion({
      levelId: this.currentLevel.id,
      levelName: this.currentLevel.name,
      score,
      time: this.elapsedRunTime,
      collectedIds: this.collectibleManager.collectedIds,
      nextLevelId,
    });

    const newlyUnlockedAchievements = this.achievementManager.evaluateCompletion({
      levelId: this.currentLevel.id,
      elapsedTime: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
    });

    this.setGameState('gameover');
    this.callbacks.onLevelComplete({
      levelId: this.currentLevel.id,
      levelName: this.currentLevel.name,
      worldName: this.currentTheme.name,
      score,
      bestScore: Math.max(previousBest, score),
      isNewBest,
      time: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
      nextLevelId,
      newlyUnlockedAchievements,
    });
  }

  private updateCamera(dt: number, dashActive: boolean): void {
    const pos = this.playerController.position;
    const vel = this.playerController.velocity;
    const upDir = this.gravityController.getUpDirection();
    const upSign = upDir.y >= 0 ? 1 : -1;

    // Gentle airborne downward framing so landing platforms remain clear during jumps/drops
    const targetAirPitch = !this.playerController.grounded ? 0.14 : 0;
    this.airPitchOffset += (targetAirPitch - this.airPitchOffset) * (1 - Math.exp(-5 * dt));
    const effectivePitch = Math.max(-0.35, Math.min(1.25, this.camPitch + this.airPitchOffset));

    // Desired orbit camera position behind player
    const horizDist = Math.cos(effectivePitch) * this.camDistance;
    const vertDist = Math.sin(effectivePitch) * this.camDistance * upSign;

    const lookAheadX = Math.max(-2.2, Math.min(2.2, vel.x * 0.14));
    const lookAheadZ = Math.max(-2.2, Math.min(2.2, vel.z * 0.14));

    _camGoalPos.set(
      pos.x + Math.sin(this.camYaw) * horizDist + lookAheadX * 0.35,
      pos.y + vertDist + 0.9 * upSign,
      pos.z + Math.cos(this.camYaw) * horizDist + lookAheadZ * 0.35
    );

    _camLookPos.set(
      pos.x - Math.sin(this.camYaw) * 2.4 + lookAheadX,
      pos.y + 0.55 * upSign - (this.airPitchOffset / 0.14) * 0.35 * upSign,
      pos.z - Math.cos(this.camYaw) * 2.4 + lookAheadZ
    );

    // Wall pull-in raycast from player toward desired camera position
    if (this.builtLevel && this.builtLevel.collidableMeshes.length > 0) {
      _camDir.subVectors(_camGoalPos, _camLookPos);
      const dist = _camDir.length();
      if (dist > 0.2) {
        _camDir.divideScalar(dist);
        _raycaster.set(_camLookPos, _camDir);
        _raycaster.far = dist;
        const hits = _raycaster.intersectObjects(this.builtLevel.collidableMeshes, false);
        if (hits.length > 0 && hits[0].distance < dist - 0.5) {
          _camGoalPos.copy(_camLookPos).addScaledVector(_camDir, Math.max(2.2, hits[0].distance - 0.5));
        }
      }
    }

    const posAlpha = 1 - Math.exp(-10 * dt);
    const lookAlpha = 1 - Math.exp(-14 * dt);
    this.currentCamPos.lerp(_camGoalPos, posAlpha);
    this.currentCamLook.lerp(_camLookPos, lookAlpha);

    // Smooth camera up vector flip during Gravity Shift
    _upVec.set(upDir.x, upDir.y, upDir.z);
    this.currentCamUp.lerp(_upVec, 1 - Math.exp(-7 * dt)).normalize();

    // Decaying trauma shake
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraTrauma > 0) {
      const mag = this.cameraTrauma * this.cameraTrauma * 0.28;
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.4);
    }

    this.camera.position.set(
      this.currentCamPos.x + shakeX,
      this.currentCamPos.y + shakeY,
      this.currentCamPos.z
    );
    this.camera.up.copy(this.currentCamUp);
    this.camera.lookAt(this.currentCamLook);

    // Subtle FOV kick on Momentum Dash / high velocity
    const speed = Math.hypot(
      this.playerController.velocity.x,
      this.playerController.velocity.z
    );
    const targetFov = dashActive ? 74 : 62 + Math.min(8, Math.max(0, (speed - 10) * 0.7));
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-10 * dt));
      this.camera.updateProjectionMatrix();
    }

    // Keep shadow frustum centered near player
    this.keyLight.position.set(pos.x + 22, pos.y + 34, pos.z + 18);
    this.keyLight.target.position.set(pos.x, pos.y, pos.z);
    this.keyLight.target.updateMatrixWorld();
  }

  private showAchievementNotice(name: string): void {
    this.achievementNotice = `Achievement Unlocked · ${name}`;
    this.achievementNoticeTimer = 3.2;
  }

  private emitHud(timeSlowActive = false): void {
    const level = this.currentLevel;
    const liveScore = computeLevelScore({
      elapsedTime: this.elapsedRunTime,
      parTime: level.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: level.collectibles.length,
      fallsCount: this.fallsCount,
      comboBounces: this.bounceSystem.comboBounces,
    });

    const vel = this.playerController.velocity;
    const speed = Math.hypot(vel.x, vel.y, vel.z);

    this.callbacks.onHudUpdate({
      levelId: level.id,
      levelName: level.name,
      worldName: this.currentTheme.name,
      score: liveScore,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: level.collectibles.length,
      elapsedTime: this.elapsedRunTime,
      speed,
      dashCooldownRatio: this.playerController.dashCooldown / this.playerController.maxDashCooldown,
      dashCharge: this.playerController.dashCharge,
      gravityInverted: this.gravityController.playerInverted,
      gravityCooldownRatio: this.gravityController.cooldown / this.gravityController.maxCooldown,
      timeSlowActive,
      timeSlowEnergy: this.playerController.timeSlowEnergy,
      checkpointLabel: this.checkpointManager.activeLabel,
      checkpointNotice: this.checkpointNotice,
      achievementNotice: this.achievementNotice,
      interactPrompt: this.nearbySwitchId,
      levelHint: this.elapsedRunTime < 5.5 ? level.hint ?? null : null,
      fallsCount: this.fallsCount,
      canGravityShift: level.allowGravityShift,
      canTimeControl: level.allowTimeControl,
      canDash: level.allowDash,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    this.builtLevel?.dispose();
    this.skyDome.geometry.dispose();
    (this.skyDome.material as THREE.Material).dispose();
    this.orb.dispose();
    this.particles.dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
