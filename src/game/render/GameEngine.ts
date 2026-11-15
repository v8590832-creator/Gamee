import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TRAIL_CATALOG } from '../data/catalog';
import { getLevelById, getNextLevelId } from '../data/levels';
import { WORLD_THEMES } from '../data/worlds';
import {
  computeLevelScore,
  computeStarRating,
  intersectVehicleCollision,
} from '../physics/math';
import type {
  CharacterLoadout,
  GameSettings,
  GameState,
  HudSnapshot,
  LevelDefinition,
  RunSummary,
  WorldTheme,
} from '../types';
import { AchievementManager } from '../systems/AchievementManager';
import { AudioManager } from '../systems/AudioManager';
import { BounceSystem } from '../systems/BounceSystem';
import { ChallengeManager } from '../systems/ChallengeManager';
import { CheckpointManager } from '../systems/CheckpointManager';
import { CollectibleManager } from '../systems/CollectibleManager';
import { GravityController } from '../systems/GravityController';
import { PhysicsManager } from '../systems/PhysicsManager';
import { PlayerController, type TouchInputState } from '../systems/PlayerController';
import { PortalSystem } from '../systems/PortalSystem';
import { SaveManager } from '../systems/SaveManager';
import { CharacterAnimationController } from './CharacterAnimationController';
import { createCharacterRig, type CharacterRig } from './CharacterBuilder';
import { ParticlePool } from './ParticlePool';
import { createProceduralTextures, type ProceduralTextureSet } from './ProceduralTextures';
import { buildLevelScene, type BuiltLevelScene } from './WorldBuilder';

const _upVec = new THREE.Vector3(0, 1, 0);
const _camGoalPos = new THREE.Vector3();
const _camLookPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onStateChange: (state: GameState) => void;
  onLevelComplete: (summary: RunSummary) => void;
  onContextStatusChange?: (lost: boolean) => void;
}

export function detectWebGLSupport(): { supported: boolean; reason?: string } {
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
      return { supported: false, reason: 'WebGL is not supported by this browser.' };
    }
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      return {
        supported: false,
        reason: 'Hardware or software WebGL acceleration is disabled in your browser settings.',
      };
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { supported: true };
  } catch {
    return { supported: false, reason: 'Unable to initialize WebGL graphics context.' };
  }
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
  private character: CharacterRig;
  private animController = new CharacterAnimationController();
  private skyDome: THREE.Mesh;
  private skyUniforms: {
    uTopColor: { value: THREE.Color };
    uHorizonColor: { value: THREE.Color };
    uBottomColor: { value: THREE.Color };
  };

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;

  public readonly saveManager: SaveManager;
  public readonly audioManager: AudioManager;
  public readonly achievementManager: AchievementManager;
  public readonly challengeManager: ChallengeManager;
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
  private contextLost = false;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;
  private lastTimestamp = 0;
  private realTime = 0;
  private worldTime = 0;
  private elapsedRunTime = 0;
  private hudSyncAccum = 0;
  private trailAccum = 0;
  private thunderTimer = 7.0;

  // Per-run stats for scoring & challenges
  private fallsCount = 0;
  private damageTakenRun = 0;
  private dashesUsedRun = 0;
  private trafficHitsRun = 0;
  private coinsRun = 0;
  private helmetsRun = 0;
  private blueprintsRun = 0;
  private signsRun = 0;
  private rollerRideTriggered = false;
  private gravityZoneTriggered = false;

  private hitstopTimer = 0;
  private cameraTrauma = 0;

  // Camera
  private camYaw = 0;
  private camPitch = 0.28;
  private airPitchOffset = 0;
  private camDistance = 8.5;
  private currentCamPos = new THREE.Vector3(0, 5, 9);
  private currentCamLook = new THREE.Vector3(0, 1.5, -4);
  private currentCamUp = new THREE.Vector3(0, 1, 0);

  private checkpointNotice: string | null = null;
  private checkpointNoticeTimer = 0;
  private achievementNotice: string | null = null;
  private achievementNoticeTimer = 0;
  private nearbySwitchId: string | null = null;

  private keysPressed = new Set<string>();
  private touchInput: TouchInputState = {
    moveForward: 0,
    moveRight: 0,
    jump: false,
    sprint: false,
    slide: false,
    bounce: false,
    dash: false,
    special: false,
    interact: false,
  };
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
    this.challengeManager = new ChallengeManager(saveManager);
    this.settings = settings;
    this.callbacks = callbacks;
    this.camDistance = settings.cameraDistance;

    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.applyQualitySettings(settings);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // Gradient Atmospheric Sky Dome
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color('#2d6ea3') },
      uHorizonColor: { value: new THREE.Color('#e8c49a') },
      uBottomColor: { value: new THREE.Color('#d9bfa1') },
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

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const roomEnv = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(roomEnv, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(62, Math.max(1, w) / Math.max(1, h), 0.1, 420);

    this.hemiLight = new THREE.HemisphereLight('#90c2eb', '#5c4b3b', 1.15);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#fff0d1', 2.5);
    this.keyLight.position.set(22, 36, 18);
    this.keyLight.castShadow = !this.isSoftwareGl && settings.shadowsEnabled && settings.graphicsQuality !== 'low';
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

    this.character = createCharacterRig(
      saveManager.getData().loadout,
      this.textures.contactShadow
    );
    this.scene.add(this.character.root);
    this.scene.add(this.character.contactShadow);

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
    this.camDistance = settings.cameraDistance;
    this.audioManager.updateSettings(settings);
    this.applyQualitySettings(settings);
  }

  public setLoadout(loadout: CharacterLoadout): void {
    this.character.applyLoadout(loadout);
    if (!this.contextLost) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public setTouchMove(moveForward: number, moveRight: number): void {
    this.touchInput.moveForward = Math.max(-1, Math.min(1, moveForward));
    this.touchInput.moveRight = Math.max(-1, Math.min(1, moveRight));
  }

  public setTouchAction(
    action: 'jump' | 'sprint' | 'slide' | 'bounce' | 'dash' | 'special' | 'interact',
    pressed: boolean
  ): void {
    if (pressed) this.audioManager.unlock();
    this.touchInput[action] = pressed;
  }

  public orbitCamera(deltaX: number, deltaY: number): void {
    if (this.gameState !== 'playing') return;
    const sens = 0.004 * this.settings.cameraSensitivity;
    const ySign = this.settings.invertY ? -1 : 1;
    this.camYaw -= deltaX * sens;
    this.camPitch = Math.max(-0.25, Math.min(1.1, this.camPitch + deltaY * sens * ySign));
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
    const shadowsOn = settings.shadowsEnabled && settings.graphicsQuality !== 'low';
    this.renderer.shadowMap.enabled = shadowsOn;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (this.keyLight) {
      this.keyLight.castShadow = shadowsOn;
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
    this.playerController.reset(level.spawn, level.spawnYaw ?? 0);

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
    this.damageTakenRun = 0;
    this.dashesUsedRun = 0;
    this.trafficHitsRun = 0;
    this.coinsRun = 0;
    this.helmetsRun = 0;
    this.blueprintsRun = 0;
    this.signsRun = 0;
    this.rollerRideTriggered = false;
    this.gravityZoneTriggered = false;

    this.hitstopTimer = 0;
    this.cameraTrauma = 0;
    this.checkpointNotice = null;
    this.achievementNotice = null;
    this.nearbySwitchId = null;

    this.camYaw = level.spawnYaw ?? 0;
    this.camPitch = 0.28;
    this.airPitchOffset = 0;
    this.currentCamUp.set(0, 1, 0);

    this.character.root.position.set(level.spawn.x, level.spawn.y, level.spawn.z);
    this.character.contactShadow.position.set(level.spawn.x, 0.12, level.spawn.z);

    this.currentCamPos.set(
      level.spawn.x + Math.sin(this.camYaw) * this.camDistance,
      level.spawn.y + 3.6,
      level.spawn.z + Math.cos(this.camYaw) * this.camDistance
    );
    this.currentCamLook.set(level.spawn.x, level.spawn.y + 1.1, level.spawn.z - 5);
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
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
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
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
  }

  private onContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    this.keysPressed.clear();
    this.pointerDown = false;
    this.audioManager.silenceLoops();
    this.callbacks.onContextStatusChange?.(true);
  };

  private onContextRestored = (): void => {
    this.contextLost = false;
    this.lastTimestamp = performance.now();
    this.applyQualitySettings(this.settings);
    this.onResize();
    this.callbacks.onContextStatusChange?.(false);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNext();
  };

  private onResize = (): void => {
    const w = Math.max(1, this.container.clientWidth || window.innerWidth);
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
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
    const ySign = this.settings.invertY ? -1 : 1;
    this.camYaw -= e.movementX * sens;
    this.camPitch = Math.max(-0.25, Math.min(1.1, this.camPitch + e.movementY * sens * ySign));
  };

  private onWheel = (e: WheelEvent): void => {
    if (this.gameState !== 'playing') return;
    this.camDistance = Math.max(5.5, Math.min(15.0, this.camDistance + e.deltaY * 0.004));
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
    if (this.disposed || this.contextLost) return;
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
      this.particles.update(0);
    }

    this.skyDome.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNext();
  };

  private updateTitleFlyover(dt: number): void {
    this.worldTime += dt;
    this.builtLevel?.updateAnimations(this.worldTime, this.realTime, dt, this.playerController.position);

    // Character stands proudly on starting road deck waving slightly
    const roadTopY = this.currentLevel.spawn.y - 1.0;
    this.character.root.position.set(this.currentLevel.spawn.x + 1.5, roadTopY + 0.55, this.currentLevel.spawn.z - 2.6);
    this.character.contactShadow.position.set(this.currentLevel.spawn.x + 1.5, roadTopY + 0.02, this.currentLevel.spawn.z - 2.6);
    this.animController.update(this.character, dt, {
      horizSpeed: 0,
      velY: 0,
      grounded: true,
      isSprinting: false,
      isSliding: false,
      dashActive: false,
      specialActive: false,
      facingYaw: 0.35,
      victory: false,
    });

    // Showcase character in right half of screen with Indian road site sweeping behind!
    const sway = Math.sin(this.realTime * 0.25) * 1.4;
    this.camera.position.set(-1.5 + sway, 3.2, 4.8);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0.2, 1.8, -14);
  }

  private updatePlaying(dt: number): void {
    const level = this.currentLevel;
    const input = this.playerController.sampleInput(
      this.keysPressed,
      this.settings.bindings,
      this.touchInput
    );

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.particles.update(dt);
      this.updateCamera(dt, false);
      return;
    }

    const specialActive = this.playerController.specialActiveTimer > 0;
    const worldScale = specialActive ? 0.55 : 1.0;
    const playerDt = dt;
    const worldDt = dt * worldScale;
    this.worldTime += worldDt;
    this.elapsedRunTime += dt;

    // Monsoon thunder ambience
    if (this.currentTheme.rainIntensity > 0.5) {
      this.thunderTimer -= dt;
      if (this.thunderTimer <= 0) {
        this.thunderTimer = 9 + Math.random() * 8;
        this.audioManager.playThunder();
      }
    }

    if (this.builtLevel) {
      this.builtLevel.updateAnimations(this.worldTime, this.realTime, worldDt, this.playerController.position);
      const prevInv = this.gravityController.playerInverted;
      this.gravityController.update(playerDt, this.playerController.position, this.builtLevel.platforms);
      if (!prevInv && this.gravityController.playerInverted && !this.gravityZoneTriggered) {
        this.gravityZoneTriggered = true;
        const ch = this.challengeManager.evaluateAction('gravityZone');
        if (ch) this.showNotice(`Challenge · ${ch.title}`);
      }
    }

    const upDir = this.gravityController.getUpDirection();
    const trailColor =
      TRAIL_CATALOG[this.saveManager.getData().loadout.trail]?.primaryColor ??
      this.currentTheme.accentColor;

    // 1. Player Movement & Abilities
    const moveRes = this.playerController.applyMovementAndAbilities(
      playerDt,
      input,
      this.camYaw,
      upDir,
      level.allowDash,
      false
    );

    if (moveRes.jumped) {
      this.audioManager.playJump(false);
      this.animController.triggerOneShot('jump', 0.25);
    }
    if (moveRes.doubleJumped) {
      this.audioManager.playJump(true);
      this.animController.triggerOneShot('doubleJump', 0.42);
      this.saveManager.incrementStat('totalDoubleJumps', 1);
      const ch = this.challengeManager.evaluateAction('doubleJump');
      if (ch) this.showNotice(`Challenge · ${ch.title}`);
      this.particles.spawnBurst(
        this.playerController.position.x,
        this.playerController.position.y - 0.3,
        this.playerController.position.z,
        10,
        trailColor,
        5.0,
        0.4,
        0.8,
        -0.5
      );
    }
    if (moveRes.superBounced) {
      this.audioManager.playBounce(1.2);
      this.animController.triggerOneShot('bounce', 0.42);
      this.character.triggerImpactShockwave(trailColor, 2.3);
      const ach = this.achievementManager.evaluateAction('bounce');
      if (ach) this.showNotice(`Achievement · ${ach.name}`);
    }
    if (moveRes.slid) {
      this.audioManager.playSlide();
      this.saveManager.incrementStat('totalSlides', 1);
      const ch = this.challengeManager.evaluateAction('slide');
      if (ch) this.showNotice(`Challenge · ${ch.title}`);
    }
    if (moveRes.dashed) {
      this.dashesUsedRun++;
      this.saveManager.incrementStat('totalDashes', 1);
      this.audioManager.playDash();
      this.animController.triggerOneShot('dash', 0.28);
      this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.3);
      this.particles.spawnBurst(
        this.playerController.position.x,
        this.playerController.position.y,
        this.playerController.position.z,
        14,
        trailColor,
        8.0,
        0.45,
        1.0,
        0.5
      );
    }
    if (moveRes.specialActivated) {
      this.audioManager.playSpecial();
      this.animController.triggerOneShot('special', 0.45);
      const ch = this.challengeManager.evaluateAction('special');
      if (ch) this.showNotice(`Challenge · ${ch.title}`);
    }

    // 2. Physics Step
    if (this.builtLevel) {
      const phys = this.physicsManager.step(
        playerDt,
        worldDt,
        this.playerController.position,
        this.playerController.velocity,
        this.builtLevel.platforms,
        this.gravityController,
        this.bounceSystem,
        this.playerController.grounded,
        this.playerController.isSliding
      );

      this.playerController.grounded = phys.grounded;

      if (phys.ridingRoller && !this.rollerRideTriggered) {
        this.rollerRideTriggered = true;
        const ach = this.achievementManager.evaluateAction('rollerRide');
        if (ach) this.showNotice(`Achievement · ${ach.name}`);
        const ch = this.challengeManager.evaluateAction('rollerRide');
        if (ch) this.showNotice(`Challenge · ${ch.title}`);
      }

      if (phys.landedImpact > 5.0) {
        this.playerController.triggerLandSquash(phys.landedImpact);
        this.animController.triggerOneShot('land', 0.16);
        this.character.triggerImpactShockwave(trailColor, 1.4);
        if (phys.landedImpact > 16.5) {
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.28);
          this.audioManager.playFahh('hardLand', 35);
        }
      }

      for (const b of phys.bounceEvents) {
        if (b.padHit) {
          this.audioManager.playBounce(b.impactSpeed / 14);
          this.hitstopTimer = 0.03;
          this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.4);
          this.animController.triggerOneShot('bounce', 0.4);
          this.character.triggerImpactShockwave(trailColor, 2.5);
          this.particles.spawnBurst(b.position.x, b.position.y, b.position.z, 16, trailColor, 7.5, 0.55, 1.1, 3.5);
          const ach = this.achievementManager.evaluateAction('bounce');
          if (ach) this.showNotice(`Achievement · ${ach.name}`);
          const ch = this.challengeManager.evaluateAction('longJump');
          if (ch) this.showNotice(`Challenge · ${ch.title}`);
        }
      }

      // Ground Contact Shadow
      if (phys.hasGroundBelow) {
        this.character.contactShadow.visible = true;
        this.character.contactShadow.position.set(
          this.playerController.position.x,
          phys.groundY + (this.gravityController.playerInverted ? -0.02 : 0.02),
          this.playerController.position.z
        );
        const hDist = Math.abs(this.playerController.position.y - phys.groundY);
        const sScale = Math.max(0.4, 1.1 - hDist * 0.06);
        this.character.contactShadow.scale.set(sScale, sScale, 1);
      } else {
        this.character.contactShadow.visible = false;
      }

      // 3. Moving Traffic Vehicle Collisions (Bounce on Roof OR Side Knockback!)
      for (const tv of this.builtLevel.traffic) {
        const distNear = Math.hypot(
          this.playerController.position.x - tv.pos.x,
          this.playerController.position.z - tv.pos.z
        );
        if (distNear < 6.0 && tv.honkedCooldown <= 0) {
          tv.honkedCooldown = 3.5;
          this.audioManager.playHorn();
        }
        const hit = intersectVehicleCollision(
          this.playerController.position,
          this.physicsManager.radius,
          tv.pos,
          tv.size
        );
        if (hit.hit) {
          this.playerController.position.x += hit.pushOut.x;
          this.playerController.position.y += hit.pushOut.y;
          this.playerController.position.z += hit.pushOut.z;
          if (hit.isTopLanding && tv.bounceTop) {
            this.playerController.velocity.y = 20.5;
            this.playerController.doubleJumpAvailable = true;
            this.audioManager.playBounce(1.3);
            this.animController.triggerOneShot('bounce', 0.4);
            this.character.triggerImpactShockwave('#f5b832', 2.4);
            const ach = this.achievementManager.evaluateAction('vehicleBounce');
            if (ach) this.showNotice(`Achievement · ${ach.name}`);
          } else if (this.playerController.invulnTimer <= 0) {
            this.applyPlayerDamage(tv.lane.direction * 6.5, 6.5, 6.0, 'trafficHit');
            this.trafficHitsRun++;
          }
        }
      }

      // 4. Boss Encounter Collisions
      if (this.builtLevel.boss) {
        const boss = this.builtLevel.boss;
        const hit = intersectVehicleCollision(
          this.playerController.position,
          this.physicsManager.radius,
          boss.pos,
          boss.size
        );
        if (hit.hit) {
          this.playerController.position.y += hit.pushOut.y;
          this.playerController.position.z += hit.pushOut.z;
          if (hit.isTopLanding) {
            this.playerController.velocity.y = 22.0;
            this.playerController.doubleJumpAvailable = true;
            this.audioManager.playBounce(1.4);
            this.character.triggerImpactShockwave('#ef4444', 2.8);
          } else if (this.playerController.invulnTimer <= 0) {
            this.applyPlayerDamage(0, 7.0, 9.0, 'bossHit');
          }
        }
      }

      // 5. Portals
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
        this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.35);
      }

      // 6. Switches ([E])
      this.nearbySwitchId = null;
      for (const sw of this.builtLevel.switches) {
        if (sw.activated) continue;
        const d = Math.hypot(
          this.playerController.position.x - sw.def.position.x,
          this.playerController.position.y - (sw.def.position.y + 0.8),
          this.playerController.position.z - sw.def.position.z
        );
        if (d < 3.2) {
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
        this.playerController.health = Math.min(this.playerController.maxHealth, this.playerController.health + 1);
        this.showNotice(`Checkpoint · ${cpTriggered}`);
      }

      // 8. Collectibles (Coins, Helmets, Blueprints, Energy, Secret Signs)
      const colRes = this.collectibleManager.checkPickups(
        this.playerController.position,
        this.builtLevel.collectibles
      );
      if (colRes.picked) {
        const kind = colRes.picked.def.kind ?? 'coin';
        const isRare = kind !== 'coin';
        this.audioManager.playCollectible(this.collectibleManager.collectedIds.length - 1, isRare);
        this.animController.triggerOneShot('pickup', 0.25);

        if (kind === 'helmet') {
          this.helmetsRun++;
          this.coinsRun += colRes.picked.def.value ?? 50;
          const ch = this.challengeManager.evaluateAction('helmet');
          if (ch) this.showNotice(`Challenge · ${ch.title}`);
        } else if (kind === 'blueprint') {
          this.blueprintsRun++;
          this.coinsRun += colRes.picked.def.value ?? 75;
          const ch = this.challengeManager.evaluateAction('blueprint');
          if (ch) this.showNotice(`Challenge · ${ch.title}`);
          this.showNotice('Blueprint Recovered!');
        } else if (kind === 'energy') {
          this.playerController.specialEnergy = 1.0;
          this.playerController.health = Math.min(this.playerController.maxHealth, this.playerController.health + 1);
          this.coinsRun += colRes.picked.def.value ?? 25;
        } else if (kind === 'sign') {
          this.signsRun++;
          this.coinsRun += colRes.picked.def.value ?? 100;
          const ch = this.challengeManager.evaluateAction('sign');
          if (ch) this.showNotice(`Challenge · ${ch.title}`);
          this.showNotice('Secret Road Sign Found!');
        } else {
          this.coinsRun += colRes.picked.def.value ?? 10;
        }

        this.particles.spawnBurst(
          colRes.picked.def.position.x,
          colRes.picked.def.position.y,
          colRes.picked.def.position.z,
          14,
          isRare ? '#38bdf8' : '#f5b832',
          6.0,
          0.5,
          0.95,
          2.0
        );
      }
    }

    // 9. Abyss / Time Challenge Out-of-Bounds Respawn
    const ceilY = level.ceilingLimitY ?? 45;
    if (this.playerController.position.y < level.fallLimitY || this.playerController.position.y > ceilY) {
      this.fallsCount += 1;
      this.audioManager.playFall();
      this.audioManager.playFahh('fall', 45);
      this.respawnAtCheckpoint();
    }
    if (level.timeChallengeSec && this.elapsedRunTime > level.timeChallengeSec) {
      this.fallsCount += 1;
      this.audioManager.playFall();
      this.audioManager.playFahh('timeout', 45);
      this.restartLevel();
      return;
    }

    // 10. Finish Gate Check
    const distToFinish = Math.hypot(
      this.playerController.position.x - level.finishPosition.x,
      this.playerController.position.y - (level.finishPosition.y + 1.5),
      this.playerController.position.z - level.finishPosition.z
    );
    if (distToFinish < 2.6) {
      this.handleLevelComplete();
      return;
    }

    // 11. Update 3D Character Rig, Animation Controller & Trails
    const pos = this.playerController.position;
    const vel = this.playerController.velocity;
    const horizSpeed = Math.hypot(vel.x, vel.z);
    const speed = Math.hypot(vel.x, vel.y, vel.z);

    this.character.root.position.set(pos.x, pos.y, pos.z);
    this.character.root.scale.set(
      this.playerController.squashXZ,
      this.playerController.squashY,
      this.playerController.squashXZ
    );
    this.character.updateShockwave(dt);

    this.animController.update(this.character, dt, {
      horizSpeed,
      velY: vel.y,
      grounded: this.playerController.grounded,
      isSprinting: this.playerController.isSprinting,
      isSliding: this.playerController.isSliding,
      dashActive: this.playerController.dashActiveTimer > 0,
      specialActive,
      facingYaw: this.playerController.facingYaw,
      victory: false,
    });

    this.audioManager.updateMovementAudio(
      dt,
      horizSpeed,
      this.playerController.grounded,
      this.playerController.isSliding,
      specialActive
    );

    this.trailAccum += playerDt;
    if (
      this.trailAccum >= (this.playerController.dashActiveTimer > 0 ? 0.025 : 0.06) &&
      (speed > 7.5 || this.playerController.isSliding || this.playerController.dashActiveTimer > 0)
    ) {
      this.trailAccum = 0;
      this.particles.spawnTrailPoint(pos.x, pos.y - 0.25, pos.z, trailColor, this.playerController.dashActiveTimer > 0 ? 1.15 : 0.75);
    }

    this.particles.update(playerDt);
    this.updateCamera(dt, this.playerController.dashActiveTimer > 0);

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
      this.emitHud();
    }
  }

  private applyPlayerDamage(
    kx: number,
    ky: number,
    kz: number,
    reason: 'trafficHit' | 'bossHit' = 'trafficHit'
  ): void {
    this.playerController.health -= 1;
    this.playerController.invulnTimer = 1.4;
    this.damageTakenRun++;
    this.playerController.velocity.x = kx;
    this.playerController.velocity.y = ky;
    this.playerController.velocity.z = kz;
    this.audioManager.playDamage();
    this.audioManager.playFahh(reason, 65);
    this.animController.triggerOneShot('damage', 0.4);
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.55);
    this.particles.spawnBurst(
      this.playerController.position.x,
      this.playerController.position.y + 0.4,
      this.playerController.position.z,
      14,
      '#ef4444',
      7.0,
      0.45,
      1.0,
      2.5
    );

    if (this.playerController.health <= 0) {
      this.fallsCount += 1;
      this.respawnAtCheckpoint();
    }
  }

  private respawnAtCheckpoint(): void {
    const cp = this.checkpointManager;
    this.playerController.position = { ...cp.activeSpawn };
    this.playerController.velocity = { x: 0, y: 0, z: 0 };
    this.playerController.health = this.playerController.maxHealth;
    this.gravityController.playerInverted = cp.activeGravityInverted;
    this.gravityController.cooldown = 0;
    this.cameraTrauma = Math.min(1, this.cameraTrauma + 0.3);

    if (this.builtLevel) {
      for (const p of this.builtLevel.platforms) {
        if (p.def.kind === 'crumbling') {
          p.crumbleState = 'intact';
          p.crumbleTimer = 0;
        }
      }
    }
    this.emitHud();
  }

  private handleLevelComplete(): void {
    this.audioManager.silenceLoops();
    this.audioManager.playVictory();
    this.animController.triggerOneShot('levelComplete', 1.5);

    this.particles.spawnBurst(
      this.currentLevel.finishPosition.x,
      this.currentLevel.finishPosition.y + 1.5,
      this.currentLevel.finishPosition.z,
      36,
      '#f5b832',
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
    const stars = computeStarRating({
      elapsedTime: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
    });

    const stageCompletionCoins = 20 + stars * 10;
    const totalCoinsEarned = this.coinsRun + stageCompletionCoins;
    this.saveManager.recordCollectibleTotals({
      coins: totalCoinsEarned,
      helmets: this.helmetsRun,
      blueprints: this.blueprintsRun,
      signs: this.signsRun,
    });

    const nextLevelId = getNextLevelId(this.currentLevel.id);
    const { isNewBest, previousBest } = this.saveManager.recordLevelCompletion({
      levelId: this.currentLevel.id,
      levelName: this.currentLevel.name,
      score,
      stars,
      time: this.elapsedRunTime,
      collectedIds: this.collectibleManager.collectedIds,
      nextLevelId,
    });

    const newlyUnlockedAchievements = this.achievementManager.evaluateCompletion({
      levelId: this.currentLevel.id,
      worldId: this.currentLevel.worldId,
      elapsedTime: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
      damageTaken: this.damageTakenRun,
    });

    const newlyCompletedChallenges = this.challengeManager.evaluateCompletion({
      worldId: this.currentLevel.worldId,
      elapsedTime: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
      dashesUsed: this.dashesUsedRun,
      bouncesInRun: this.bounceSystem.comboBounces,
      trafficHits: this.trafficHitsRun,
      hasTraffic: (this.currentLevel.trafficLanes?.length ?? 0) > 0,
      hasBoss: Boolean(this.currentLevel.boss),
      stars,
    });

    if (this.currentLevel.boss) {
      this.saveManager.incrementStat('bossesCleared', 1);
    }

    this.setGameState('gameover');
    this.callbacks.onLevelComplete({
      levelId: this.currentLevel.id,
      levelName: this.currentLevel.name,
      worldName: this.currentTheme.name,
      score,
      bestScore: Math.max(previousBest, score),
      isNewBest,
      stars,
      time: this.elapsedRunTime,
      parTime: this.currentLevel.parTime,
      coinsEarned: totalCoinsEarned,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: this.currentLevel.collectibles.length,
      fallsCount: this.fallsCount,
      nextLevelId,
      newlyUnlockedAchievements,
      newlyCompletedChallenges,
    });
  }

  private updateCamera(dt: number, dashActive: boolean): void {
    const pos = this.playerController.position;
    const vel = this.playerController.velocity;
    const upDir = this.gravityController.getUpDirection();
    const upSign = upDir.y >= 0 ? 1 : -1;

    const targetAirPitch = !this.playerController.grounded ? 0.14 : 0;
    this.airPitchOffset += (targetAirPitch - this.airPitchOffset) * (1 - Math.exp(-5 * dt));
    const effectivePitch = Math.max(-0.25, Math.min(1.2, this.camPitch + this.airPitchOffset));

    const horizDist = Math.cos(effectivePitch) * this.camDistance;
    const vertDist = Math.sin(effectivePitch) * this.camDistance * upSign;

    const lookAheadX = Math.max(-2.2, Math.min(2.2, vel.x * 0.14));
    const lookAheadZ = Math.max(-2.2, Math.min(2.2, vel.z * 0.14));

    _camGoalPos.set(
      pos.x + Math.sin(this.camYaw) * horizDist + lookAheadX * 0.35,
      pos.y + vertDist + 1.35 * upSign,
      pos.z + Math.cos(this.camYaw) * horizDist + lookAheadZ * 0.35
    );

    _camLookPos.set(
      pos.x - Math.sin(this.camYaw) * 2.4 + lookAheadX,
      pos.y + 1.0 * upSign - (this.airPitchOffset / 0.14) * 0.3 * upSign,
      pos.z - Math.cos(this.camYaw) * 2.4 + lookAheadZ
    );

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

    const smooth = this.settings.cameraSmoothing;
    const posAlpha = 1 - Math.exp(-10 * smooth * dt);
    const lookAlpha = 1 - Math.exp(-14 * smooth * dt);
    this.currentCamPos.lerp(_camGoalPos, posAlpha);
    this.currentCamLook.lerp(_camLookPos, lookAlpha);

    _upVec.set(upDir.x, upDir.y, upDir.z);
    this.currentCamUp.lerp(_upVec, 1 - Math.exp(-7 * dt)).normalize();

    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraTrauma > 0) {
      const mag = this.cameraTrauma * this.cameraTrauma * 0.25;
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
      this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.5);
    }

    this.camera.position.set(
      this.currentCamPos.x + shakeX,
      this.currentCamPos.y + shakeY,
      this.currentCamPos.z
    );
    this.camera.up.copy(this.currentCamUp);
    this.camera.lookAt(this.currentCamLook);

    const speed = Math.hypot(vel.x, vel.z);
    const targetFov = dashActive ? 74 : 62 + Math.min(8, Math.max(0, (speed - 11) * 0.7));
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-10 * dt));
      this.camera.updateProjectionMatrix();
    }

    this.keyLight.position.set(pos.x + 22, pos.y + 34, pos.z + 18);
    this.keyLight.target.position.set(pos.x, pos.y, pos.z);
    this.keyLight.target.updateMatrixWorld();
  }

  private showNotice(msg: string): void {
    this.checkpointNotice = msg;
    this.checkpointNoticeTimer = 2.8;
  }

  private emitHud(): void {
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
      coinsRun: this.coinsRun,
      totalCoins: this.saveManager.getData().coins + this.coinsRun,
      collectiblesFound: this.collectibleManager.collectedIds.length,
      collectiblesTotal: level.collectibles.length,
      health: this.playerController.health,
      maxHealth: this.playerController.maxHealth,
      elapsedTime: this.elapsedRunTime,
      timeChallengeRemaining: level.timeChallengeSec
        ? Math.max(0, level.timeChallengeSec - this.elapsedRunTime)
        : null,
      speed,
      isSprinting: this.playerController.isSprinting,
      isSliding: this.playerController.isSliding,
      bounceCooldownRatio: this.playerController.bounceCooldown / this.playerController.maxBounceCooldown,
      dashCooldownRatio: this.playerController.dashCooldown / this.playerController.maxDashCooldown,
      dashCharge: this.playerController.dashCharge,
      specialCooldownRatio: this.playerController.specialCooldown / this.playerController.maxSpecialCooldown,
      specialActive: this.playerController.specialActiveTimer > 0,
      specialEnergy: this.playerController.specialEnergy,
      gravityInverted: this.gravityController.playerInverted,
      checkpointLabel: this.checkpointManager.activeLabel,
      checkpointNotice: this.checkpointNotice,
      achievementNotice: this.achievementNotice,
      bossName: level.boss?.name ?? null,
      interactPrompt: this.nearbySwitchId,
      levelHint: this.elapsedRunTime < 6.5 ? level.hint ?? null : null,
      fallsCount: this.fallsCount,
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
    this.envRenderTarget?.dispose();
    this.character.dispose();
    this.particles.dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
