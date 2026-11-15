import * as THREE from 'three';
import { WORLD_THEMES } from '../data/worlds';
import type {
  BossEncounterDef,
  CheckpointDef,
  CollectibleDef,
  LevelDefinition,
  PlatformDef,
  PortalPairDef,
  SwitchDef,
  TrafficLaneDef,
  Vec3,
  WorldTheme,
} from '../types';
import { createHighwaySignTexture, type ProceduralTextureSet } from './ProceduralTextures';
import { buildWorldScenery } from './SceneryBuilder';
import { VehicleAssetPool } from './VehicleBuilder';

export interface PlatformMeshHandle {
  def: PlatformDef;
  group: THREE.Group;
  strikerPlate?: THREE.Mesh;
  padPulse: number;
  currentPos: Vec3;
  currentRotY: number;
  crumbleState: 'intact' | 'shaking' | 'fallen';
  crumbleTimer: number;
  active: boolean;
}

export interface TrafficVehicleHandle {
  lane: TrafficLaneDef;
  group: THREE.Group;
  wheels: THREE.Mesh[];
  pos: Vec3;
  size: Vec3;
  bounceTop: boolean;
  honkedCooldown: number;
}

export interface BossHandle {
  def: BossEncounterDef;
  group: THREE.Group;
  pos: Vec3;
  size: Vec3;
  phase: number;
}

export interface PortalMeshHandle {
  def: PortalPairDef;
  groupA: THREE.Group;
  groupB: THREE.Group;
  shaderMats: THREE.ShaderMaterial[];
}

export interface CheckpointMeshHandle {
  def: CheckpointDef;
  group: THREE.Group;
  beaconMat: THREE.MeshStandardMaterial;
  activated: boolean;
}

export interface CollectibleMeshHandle {
  def: CollectibleDef;
  group: THREE.Group;
  collected: boolean;
}

export interface SwitchMeshHandle {
  def: SwitchDef;
  group: THREE.Group;
  crystalMat: THREE.MeshStandardMaterial;
  activated: boolean;
}

export interface BuiltLevelScene {
  root: THREE.Group;
  platforms: PlatformMeshHandle[];
  traffic: TrafficVehicleHandle[];
  boss: BossHandle | null;
  portals: PortalMeshHandle[];
  checkpoints: CheckpointMeshHandle[];
  collectibles: CollectibleMeshHandle[];
  switches: SwitchMeshHandle[];
  collidableMeshes: THREE.Object3D[];
  updateAnimations: (worldTime: number, realTime: number, dt: number, playerPos: Vec3) => void;
  dispose: () => void;
}

function createPortalDiscShader(colorHex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        if (r > 1.0) discard;
        float a = atan(p.y, p.x);
        float spiral = sin(a * 4.0 + r * 10.0 - uTime * 4.2) * 0.5 + 0.5;
        float edge = smoothstep(1.0, 0.72, r);
        float center = smoothstep(0.0, 0.5, r);
        vec3 col = mix(uColor * 0.55, vec3(0.95, 0.98, 1.0), spiral * 0.45 + (1.0 - center) * 0.35);
        gl_FragColor = vec4(col, edge * (0.55 + spiral * 0.35));
      }
    `,
  });
}

export function buildLevelScene(
  level: LevelDefinition,
  theme: WorldTheme,
  textures: ProceduralTextureSet
): BuiltLevelScene {
  const root = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // Deliberate Indian Road PBR Material Library (calibrated roughness & albedo contrast)
  const matAsphalt = track(
    new THREE.MeshStandardMaterial({
      map: textures.asphaltAlbedo,
      bumpMap: textures.asphaltBump,
      bumpScale: 0.035,
      roughness: 0.88,
      metalness: 0.03,
    })
  );

  const matWetAsphalt = track(
    new THREE.MeshStandardMaterial({
      map: textures.wetAsphaltAlbedo,
      bumpMap: textures.asphaltBump,
      bumpScale: 0.025,
      color: '#cfdbe8',
      roughness: 0.2,
      metalness: 0.16,
    })
  );

  const matConcrete = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfacePrimary,
      map: textures.concreteAlbedo,
      bumpMap: textures.concreteBump,
      bumpScale: 0.045,
      roughnessMap: textures.concreteRoughness,
      roughness: 0.9,
      metalness: 0.04,
    })
  );

  const matSteel = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfaceSecondary,
      map: textures.steelAlbedo,
      bumpMap: textures.steelBump,
      bumpScale: 0.035,
      roughnessMap: textures.steelRoughness,
      roughness: 0.46,
      metalness: 0.74,
    })
  );

  const matWeatheredFrame = track(
    new THREE.MeshStandardMaterial({
      color: '#2c3138',
      roughness: 0.72,
      metalness: 0.35,
    })
  );

  const matBarrier = track(
    new THREE.MeshStandardMaterial({
      map: textures.redWhiteBarrierAlbedo,
      roughness: 0.74,
      metalness: 0.05,
    })
  );

  const matConeOrange = track(
    new THREE.MeshStandardMaterial({
      color: '#ea5c1f',
      roughness: 0.58,
      metalness: 0.04,
    })
  );

  const matCopper = track(
    new THREE.MeshStandardMaterial({
      color: '#cc823b',
      map: textures.copperPadAlbedo,
      roughness: 0.32,
      metalness: 0.76,
    })
  );

  const matStone = track(
    new THREE.MeshStandardMaterial({
      color: theme.sceneryStyle === 'mountain' ? '#7a7568' : '#736c63',
      map: textures.stoneAlbedo,
      bumpMap: textures.stoneBump,
      bumpScale: 0.05,
      roughness: 0.94,
      metalness: 0.02,
    })
  );

  const matRollerYellow = track(
    new THREE.MeshStandardMaterial({
      color: '#e8a220',
      roughness: 0.38,
      metalness: 0.36,
    })
  );

  const matPuddle = track(
    new THREE.MeshStandardMaterial({
      color: '#4e8ea8',
      roughness: 0.07,
      metalness: 0.3,
      transparent: true,
      opacity: 0.78,
    })
  );

  const pickMaterial = (style?: PlatformDef['materialStyle']) => {
    if (style === 'asphalt') return matAsphalt;
    if (style === 'wet') return matWetAsphalt;
    if (style === 'steel') return matSteel;
    if (style === 'copper') return matCopper;
    if (style === 'stone') return matStone;
    return matConcrete;
  };

  const coneGeo = track(new THREE.ConeGeometry(0.24, 0.65, 10));
  const coneCollarGeo = track(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 10));
  const whiteMat = track(new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.6 }));
  const pierColGeo = track(new THREE.BoxGeometry(0.95, 28, 0.95));
  const pierCapGeo = track(new THREE.BoxGeometry(1.5, 0.75, 1.5));

  // =========================================================================
  // 1. ROAD PLATFORMS, POTHOLES, ROAD ROLLERS & BARRIERS
  // =========================================================================
  const platforms: PlatformMeshHandle[] = [];
  const collidableMeshes: THREE.Object3D[] = [];

  for (let pIdx = 0; pIdx < level.platforms.length; pIdx++) {
    const def = level.platforms[pIdx];
    const group = new THREE.Group();
    group.position.set(def.position.x, def.position.y, def.position.z);
    if (def.rotation) {
      group.rotation.set(def.rotation.x, def.rotation.y, def.rotation.z);
    }

    let strikerPlate: THREE.Mesh | undefined;

    if (def.kind === 'bounce' || def.kind === 'pothole') {
      const baseGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const baseMesh = new THREE.Mesh(
        baseGeo,
        def.kind === 'pothole' ? matAsphalt : matWeatheredFrame
      );
      baseMesh.receiveShadow = true;
      group.add(baseMesh);
      collidableMeshes.push(baseMesh);

      const plateGeo = track(
        new THREE.CylinderGeometry(def.size.x * 0.42, def.size.x * 0.46, 0.22, 18)
      );
      strikerPlate = new THREE.Mesh(plateGeo, matCopper);
      strikerPlate.position.y = def.size.y * 0.5 + 0.08;
      group.add(strikerPlate);

      if (def.kind === 'pothole') {
        const cx = def.size.x * 0.42;
        const cz = def.size.z * 0.42;
        for (const [ox, oz] of [[-cx, -cz], [cx, -cz], [-cx, cz], [cx, cz]]) {
          const cone = new THREE.Mesh(coneGeo, matConeOrange);
          cone.position.set(ox, def.size.y * 0.5 + 0.32, oz);
          const collar = new THREE.Mesh(coneCollarGeo, whiteMat);
          collar.position.set(ox, def.size.y * 0.5 + 0.36, oz);
          group.add(cone, collar);
        }
      }
    } else if (def.kind === 'roller') {
      const bodyGeo = track(
        new THREE.BoxGeometry(def.size.x * 0.86, def.size.y * 0.56, def.size.z * 0.72)
      );
      const bodyMesh = new THREE.Mesh(bodyGeo, matRollerYellow);
      bodyMesh.position.y = 0.16;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);
      collidableMeshes.push(bodyMesh);

      const drumGeo = track(
        new THREE.CylinderGeometry(def.size.y * 0.54, def.size.y * 0.54, def.size.x * 0.98, 18)
      );
      const drum = new THREE.Mesh(drumGeo, matSteel);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, -0.1, -def.size.z * 0.34);
      const rearDrum = drum.clone();
      rearDrum.position.z = def.size.z * 0.32;
      rearDrum.scale.set(0.85, 0.85, 0.85);

      const cabGeo = track(new THREE.BoxGeometry(def.size.x * 0.54, 1.05, def.size.z * 0.26));
      const cab = new THREE.Mesh(cabGeo, matWeatheredFrame);
      cab.position.set(0, 0.88, def.size.z * 0.14);
      const roof = new THREE.Mesh(
        track(new THREE.BoxGeometry(def.size.x * 0.62, 0.12, def.size.z * 0.34)),
        matRollerYellow
      );
      roof.position.set(0, 1.46, def.size.z * 0.14);
      const exhaust = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.06, 0.07, 0.7, 8)),
        matWeatheredFrame
      );
      exhaust.position.set(def.size.x * 0.28, 0.72, -def.size.z * 0.08);
      group.add(drum, rearDrum, cab, roof, exhaust);
    } else if (def.kind === 'puddle') {
      const pudGeo = track(
        new THREE.CylinderGeometry(def.size.x * 0.5, def.size.x * 0.52, 0.08, 18)
      );
      const pud = new THREE.Mesh(pudGeo, matPuddle);
      pud.scale.set(1, 1, def.size.z / Math.max(0.1, def.size.x));
      group.add(pud);
    } else if (def.kind === 'gear') {
      const radius = def.size.x * 0.5;
      const gearBody = new THREE.Mesh(
        track(new THREE.CylinderGeometry(radius, radius, def.size.y, 24)),
        matCopper
      );
      gearBody.castShadow = true;
      gearBody.receiveShadow = true;
      group.add(gearBody);
      collidableMeshes.push(gearBody);

      const hub = new THREE.Mesh(
        track(new THREE.CylinderGeometry(radius * 0.35, radius * 0.38, def.size.y + 0.18, 14)),
        matSteel
      );
      group.add(hub);

      const toothGeo = track(new THREE.BoxGeometry(0.95, def.size.y * 0.92, 0.85));
      for (let t = 0; t < 10; t++) {
        const angle = (t / 10) * Math.PI * 2;
        const tooth = new THREE.Mesh(toothGeo, matSteel);
        tooth.position.set(Math.cos(angle) * (radius + 0.3), 0, Math.sin(angle) * (radius + 0.3));
        tooth.rotation.y = -angle;
        group.add(tooth);
      }
    } else if (def.kind === 'gravityZone' || def.kind === 'windZone' || def.kind === 'fluidZone') {
      const zoneColor =
        def.kind === 'gravityZone' ? '#48b8d0' : def.kind === 'windZone' ? '#95d4c2' : '#2ea6b5';
      const zoneMat = track(
        new THREE.MeshStandardMaterial({
          color: zoneColor,
          emissive: zoneColor,
          emissiveIntensity: 0.25,
          transparent: true,
          opacity: 0.22,
          roughness: 0.3,
          depthWrite: false,
        })
      );
      const zoneMesh = new THREE.Mesh(
        track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z)),
        zoneMat
      );
      group.add(zoneMesh);
    } else if (def.kind === 'wall') {
      const barGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const bar = new THREE.Mesh(barGeo, matBarrier);
      bar.castShadow = true;
      bar.receiveShadow = true;
      group.add(bar);
      collidableMeshes.push(bar);

      if (def.position.y > 1.2) {
        const legGeo = track(new THREE.BoxGeometry(0.28, 3.0, 0.28));
        const legL = new THREE.Mesh(legGeo, matWeatheredFrame);
        legL.position.set(-def.size.x * 0.48, -1.2, 0);
        const legR = new THREE.Mesh(legGeo, matWeatheredFrame);
        legR.position.set(def.size.x * 0.48, -1.2, 0);
        group.add(legL, legR);
      }
    } else {
      const mainMat = pickMaterial(def.materialStyle);
      const deckGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const deckMesh = new THREE.Mesh(deckGeo, mainMat);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      group.add(deckMesh);
      collidableMeshes.push(deckMesh);

      if (def.size.x >= 4.0 && def.size.z >= 6.0 && def.kind === 'solid') {
        // Painted Concrete Jersey Barriers
        const curbGeo = track(new THREE.BoxGeometry(0.36, 0.48, def.size.z * 0.9));
        const curbL = new THREE.Mesh(curbGeo, matBarrier);
        curbL.position.set(-def.size.x * 0.5 + 0.2, def.size.y * 0.5 + 0.24, 0);
        const curbR = new THREE.Mesh(curbGeo, matBarrier);
        curbR.position.set(def.size.x * 0.5 - 0.2, def.size.y * 0.5 + 0.24, 0);
        group.add(curbL, curbR);

        // Construction Cones on site stages
        if (
          theme.sceneryStyle === 'city_site' ||
          theme.sceneryStyle === 'pothole' ||
          theme.sceneryStyle === 'mega_site'
        ) {
          const cone = new THREE.Mesh(coneGeo, matConeOrange);
          cone.position.set(-def.size.x * 0.36, def.size.y * 0.5 + 0.32, -def.size.z * 0.3);
          const collar = new THREE.Mesh(coneCollarGeo, whiteMat);
          collar.position.set(-def.size.x * 0.36, def.size.y * 0.5 + 0.38, -def.size.z * 0.3);
          group.add(cone, collar);
        }

        // Grounded Concrete Viaduct Support Piers with Pier Caps
        const pierOffsetX = Math.max(1.4, def.size.x * 0.35);
        for (const sx of [-pierOffsetX, pierOffsetX]) {
          const pier = new THREE.Mesh(pierColGeo, matConcrete);
          pier.position.set(sx, -14.5, 0);
          const cap = new THREE.Mesh(pierCapGeo, matConcrete);
          cap.position.set(sx, -0.75, 0);
          group.add(pier, cap);
        }
      }

      if (def.kind === 'crumbling') {
        const crackMat = track(new THREE.MeshBasicMaterial({ color: theme.accentColor }));
        const crackGeo = track(new THREE.BoxGeometry(def.size.x * 0.9, 0.05, 0.14));
        const c1 = new THREE.Mesh(crackGeo, crackMat);
        c1.position.y = def.size.y * 0.5 + 0.02;
        c1.rotation.y = 0.42;
        const c2 = c1.clone();
        c2.rotation.y = -0.5;
        group.add(c1, c2);
      }

      if (def.kind === 'bridge' && def.startsActive === false) {
        group.visible = false;
      }
    }

    root.add(group);
    platforms.push({
      def,
      group,
      strikerPlate,
      padPulse: 0,
      currentPos: { ...def.position },
      currentRotY: def.rotation?.y ?? 0,
      crumbleState: 'intact',
      crumbleTimer: 0,
      active: def.kind === 'bridge' ? def.startsActive !== false : true,
    });
  }

  // =========================================================================
  // 2. LIVING INDIAN TRAFFIC SYSTEM (Multi-Part Composite Vehicles)
  // =========================================================================
  const vehiclePool = new VehicleAssetPool(textures);
  disposables.push(vehiclePool);
  const traffic: TrafficVehicleHandle[] = [];

  for (const lane of level.trafficLanes ?? []) {
    const span = lane.xMax - lane.xMin;
    for (let i = 0; i < lane.count; i++) {
      const { group, size, wheels } = vehiclePool.build(lane.vehicleKind);
      group.rotation.y = lane.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      const startX = lane.xMin + (i / lane.count) * span;
      group.position.set(startX, lane.y, lane.z);
      root.add(group);
      traffic.push({
        lane,
        group,
        wheels,
        pos: { x: startX, y: lane.y + size.y * 0.5, z: lane.z },
        size: { x: size.z, y: size.y, z: size.x },
        bounceTop: lane.bounceTop !== false,
        honkedCooldown: 0,
      });
    }
  }

  // =========================================================================
  // 3. BOSS / SPECIAL ENCOUNTER RIGS
  // =========================================================================
  let boss: BossHandle | null = null;
  if (level.boss) {
    const bDef = level.boss;
    const bGroup = new THREE.Group();
    bGroup.position.set(bDef.position.x, bDef.position.y, bDef.position.z);

    let bSize: Vec3 = { x: 4.5, y: 3.2, z: 4.5 };
    if (bDef.kind === 'mega_crane') {
      const mast = new THREE.Mesh(track(new THREE.BoxGeometry(1.4, 14, 1.4)), matConeOrange);
      mast.position.y = 4;
      const boom = new THREE.Mesh(track(new THREE.BoxGeometry(14, 1.0, 1.2)), matRollerYellow);
      boom.position.set(0, 2.0, 0);
      const cab = new THREE.Mesh(track(new THREE.BoxGeometry(2.0, 1.6, 1.8)), matWeatheredFrame);
      cab.position.set(1.2, 3.0, 0);
      bGroup.add(mast, boom, cab);
      bSize = { x: 13.5, y: 2.2, z: 2.0 };
    } else {
      const chassis = new THREE.Mesh(track(new THREE.BoxGeometry(4.4, 2.2, 4.4)), matRollerYellow);
      chassis.position.y = 0.6;
      const frontDrum = new THREE.Mesh(
        track(new THREE.CylinderGeometry(1.5, 1.5, 5.2, 20)),
        matSteel
      );
      frontDrum.rotation.z = Math.PI / 2;
      frontDrum.position.set(0, 0.1, 1.8);
      const cab = new THREE.Mesh(track(new THREE.BoxGeometry(2.8, 1.4, 2.2)), matWeatheredFrame);
      cab.position.set(0, 2.1, -0.4);
      const beacon = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.45, 12, 10)),
        track(
          new THREE.MeshStandardMaterial({
            color: '#ef4444',
            emissive: '#ef4444',
            emissiveIntensity: 0.95,
          })
        )
      );
      beacon.position.y = 3.05;
      bGroup.add(chassis, frontDrum, cab, beacon);
      bSize = { x: 5.0, y: 2.8, z: 4.8 };
    }
    root.add(bGroup);
    boss = { def: bDef, group: bGroup, pos: { ...bDef.position }, size: bSize, phase: 0 };
  }

  // =========================================================================
  // 4. PORTALS, CHECKPOINTS, SWITCHES & 5 COLLECTIBLE TYPES
  // =========================================================================
  const portals: PortalMeshHandle[] = [];
  const portalRingGeo = track(new THREE.TorusGeometry(1.75, 0.16, 12, 36));
  const portalDiscGeo = track(new THREE.CircleGeometry(1.62, 32));
  for (const pDef of level.portals) {
    const shaderMats: THREE.ShaderMaterial[] = [];
    const buildGate = (pos: Vec3, normal: Vec3, colorHex: string) => {
      const gate = new THREE.Group();
      gate.position.set(pos.x, pos.y, pos.z);
      gate.lookAt(pos.x + normal.x, pos.y + normal.y, pos.z + normal.z);
      gate.add(new THREE.Mesh(portalRingGeo, matWeatheredFrame));
      const swirlMat = track(createPortalDiscShader(colorHex));
      shaderMats.push(swirlMat);
      gate.add(new THREE.Mesh(portalDiscGeo, swirlMat));
      return gate;
    };
    const groupA = buildGate(pDef.aPos, pDef.aNormal, pDef.colorA ?? '#e59a3c');
    const groupB = buildGate(pDef.bPos, pDef.bNormal, pDef.colorB ?? '#48b8d0');
    root.add(groupA, groupB);
    portals.push({ def: pDef, groupA, groupB, shaderMats });
  }

  const checkpoints: CheckpointMeshHandle[] = [];
  const cpBaseGeo = track(new THREE.CylinderGeometry(0.85, 1.05, 0.22, 12));
  const cpPillarGeo = track(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 8));
  const cpOrbGeo = track(new THREE.SphereGeometry(0.2, 12, 10));
  for (const cp of level.checkpoints) {
    const group = new THREE.Group();
    group.position.set(cp.position.x, cp.position.y + 0.03, cp.position.z);
    group.add(new THREE.Mesh(cpBaseGeo, matSteel));
    const beaconMat = track(
      new THREE.MeshStandardMaterial({
        color: '#6b7785',
        emissive: '#384654',
        emissiveIntensity: 0.4,
      })
    );
    const pillar = new THREE.Mesh(cpPillarGeo, beaconMat);
    pillar.position.y = 1.1;
    const orb = new THREE.Mesh(cpOrbGeo, beaconMat);
    orb.position.y = 2.3;
    group.add(pillar, orb);
    root.add(group);
    checkpoints.push({ def: cp, group, beaconMat, activated: false });
  }

  const switches: SwitchMeshHandle[] = [];
  for (const sw of level.switches) {
    const group = new THREE.Group();
    group.position.set(sw.position.x, sw.position.y, sw.position.z);
    const ped = new THREE.Mesh(track(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 10)), matSteel);
    ped.position.y = 0.45;
    const crystalMat = track(
      new THREE.MeshStandardMaterial({
        color: '#d96b38',
        emissive: '#b5461b',
        emissiveIntensity: 0.7,
      })
    );
    const lever = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.32, 0)), crystalMat);
    lever.position.y = 1.25;
    group.add(ped, lever);
    root.add(group);
    switches.push({ def: sw, group, crystalMat, activated: false });
  }

  const collectibles: CollectibleMeshHandle[] = [];
  const coinGeo = track(new THREE.CylinderGeometry(0.42, 0.42, 0.11, 18));
  const coinRimGeo = track(new THREE.TorusGeometry(0.41, 0.045, 8, 20));
  const helmetGeo = track(
    new THREE.SphereGeometry(0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58)
  );
  const blueprintGeo = track(new THREE.CylinderGeometry(0.14, 0.14, 0.78, 12));
  const energyGeo = track(new THREE.OctahedronGeometry(0.4, 0));
  const signGeo = track(new THREE.BoxGeometry(0.68, 0.54, 0.1));

  const coinMat = track(
    new THREE.MeshStandardMaterial({
      color: '#f5b832',
      emissive: '#a86b14',
      emissiveIntensity: 0.38,
      metalness: 0.85,
      roughness: 0.22,
    })
  );
  const bpMat = track(
    new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.45,
      roughness: 0.35,
    })
  );
  const energyMat = track(
    new THREE.MeshStandardMaterial({
      color: '#4ade80',
      emissive: '#16a34a',
      emissiveIntensity: 0.55,
      roughness: 0.25,
    })
  );
  const signMat = track(
    new THREE.MeshStandardMaterial({
      color: '#16803c',
      emissive: '#0f5c2b',
      emissiveIntensity: 0.35,
      roughness: 0.45,
    })
  );

  for (const col of level.collectibles) {
    const group = new THREE.Group();
    group.position.set(col.position.x, col.position.y, col.position.z);
    const kind = col.kind ?? 'coin';
    if (kind === 'helmet') {
      const dome = new THREE.Mesh(helmetGeo, coinMat);
      const brim = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.42, 0.44, 0.06, 14)),
        coinMat
      );
      const ridge = new THREE.Mesh(track(new THREE.BoxGeometry(0.1, 0.14, 0.58)), matRollerYellow);
      ridge.position.y = 0.34;
      group.add(dome, brim, ridge);
    } else if (kind === 'blueprint') {
      const scroll = new THREE.Mesh(blueprintGeo, bpMat);
      scroll.rotation.z = 0.65;
      const band = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 12)),
        coinMat
      );
      band.rotation.z = 0.65;
      group.add(scroll, band);
    } else if (kind === 'energy') {
      group.add(new THREE.Mesh(energyGeo, energyMat));
    } else if (kind === 'sign') {
      const plate = new THREE.Mesh(signGeo, signMat);
      const post = new THREE.Mesh(
        track(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8)),
        matSteel
      );
      post.position.y = -0.5;
      group.add(plate, post);
    } else {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      const rim = new THREE.Mesh(coinRimGeo, coinMat);
      group.add(coin, rim);
    }
    root.add(group);
    collectibles.push({ def: col, group, collected: false });
  }

  // =========================================================================
  // 5. FINISH GATE (INDIAN EXPRESSWAY RIBBON INAUGURATION ARCH)
  // =========================================================================
  const finishGroup = new THREE.Group();
  finishGroup.position.set(
    level.finishPosition.x,
    level.finishPosition.y,
    level.finishPosition.z
  );
  const archPillar = track(new THREE.BoxGeometry(0.62, 5.9, 0.78));
  const finArchL = new THREE.Mesh(archPillar, matBarrier);
  finArchL.position.set(-2.9, 2.95, 0);
  const finArchR = new THREE.Mesh(archPillar, matBarrier);
  finArchR.position.set(2.9, 2.95, 0);
  const finishSignTex = track(
    createHighwaySignTexture(
      level.highwayLabel ?? 'NH-BOUNCE · FINISH',
      `${theme.name} · STAGE ${level.worldId}-${level.levelNumber} FINISH`
    )
  );
  const finBanner = new THREE.Mesh(
    track(new THREE.BoxGeometry(6.6, 1.8, 0.35)),
    track(new THREE.MeshBasicMaterial({ map: finishSignTex }))
  );
  finBanner.position.set(0, 5.7, 0);
  const finRibbon = new THREE.Mesh(
    track(new THREE.BoxGeometry(5.3, 0.25, 0.08)),
    track(
      new THREE.MeshStandardMaterial({
        color: '#e59a3c',
        emissive: '#e59a3c',
        emissiveIntensity: 0.45,
      })
    )
  );
  finRibbon.position.set(0, 1.4, 0);
  const finishRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.4, 0.09, 10, 32)), coinMat);
  finishRing.position.set(0, 2.5, 0);
  finishGroup.add(finArchL, finArchR, finBanner, finRibbon, finishRing);
  root.add(finishGroup);

  // =========================================================================
  // 6. OVERHEAD HIGHWAY GANTRY SIGN & WORLD SCENERY
  // =========================================================================
  const firstDeck =
    level.platforms.find((p) => p.kind === 'solid' && p.size.x >= 4 && p.size.z >= 5) ??
    level.platforms[0];
  const gantryX = firstDeck ? firstDeck.position.x : 0;
  const gantryDeckTopY = firstDeck
    ? firstDeck.position.y + firstDeck.size.y * 0.5
    : 0;
  const gantrySpanHalf = firstDeck ? Math.max(4.4, firstDeck.size.x * 0.5 - 0.2) : 5.4;
  const gantryZ = firstDeck
    ? firstDeck.position.z - Math.min(4.0, firstDeck.size.z * 0.25)
    : -12;
  const postHeight = 7.4;

  const startSignGroup = new THREE.Group();
  startSignGroup.position.set(gantryX, gantryDeckTopY + postHeight - 0.65, gantryZ);
  const gPostGeo = track(new THREE.CylinderGeometry(0.16, 0.2, postHeight, 8));
  const gFlangeGeo = track(new THREE.BoxGeometry(0.62, 0.22, 0.62));

  const gL = new THREE.Mesh(gPostGeo, matSteel);
  gL.position.set(-gantrySpanHalf, -postHeight * 0.5 + 0.65, 0);
  const flangeL = new THREE.Mesh(gFlangeGeo, matConcrete);
  flangeL.position.set(-gantrySpanHalf, -postHeight + 0.76, 0);

  const gR = new THREE.Mesh(gPostGeo, matSteel);
  gR.position.set(gantrySpanHalf, -postHeight * 0.5 + 0.65, 0);
  const flangeR = new THREE.Mesh(gFlangeGeo, matConcrete);
  flangeR.position.set(gantrySpanHalf, -postHeight + 0.76, 0);

  const beamWidth = gantrySpanHalf * 2 + 0.6;
  const gBeam = new THREE.Mesh(track(new THREE.BoxGeometry(beamWidth, 0.34, 0.3)), matSteel);
  gBeam.position.set(0, 0.65, -0.22);
  const gBeamLow = new THREE.Mesh(track(new THREE.BoxGeometry(beamWidth, 0.22, 0.24)), matSteel);
  gBeamLow.position.set(0, -0.55, -0.22);
  const startSignTex = track(
    createHighwaySignTexture(
      level.name,
      `WORLD ${level.worldId} · ${WORLD_THEMES[level.worldId].subtitle}`
    )
  );
  const gBoard = new THREE.Mesh(
    track(new THREE.BoxGeometry(Math.min(7.8, beamWidth - 1.2), 2.1, 0.2)),
    track(new THREE.MeshBasicMaterial({ map: startSignTex }))
  );
  gBoard.position.set(0, 0.05, 0.14);
  startSignGroup.add(gL, flangeL, gR, flangeR, gBeam, gBeamLow, gBoard);
  root.add(startSignGroup);

  // World-specific handcrafted Indian road scenery (buildings, chai stalls, trees, bridges, tunnels, mountains, rain, dust)
  const scenery = buildWorldScenery(level, theme, textures, {
    matConcrete,
    matSteel,
    matWeatheredFrame,
    matBarrier,
    matStone,
    matRollerYellow,
  });
  root.add(scenery.group);
  disposables.push(scenery);

  // =========================================================================
  // ANIMATION UPDATE LOOP
  // =========================================================================
  const updateAnimations = (
    worldTime: number,
    realTime: number,
    dt: number,
    playerPos: Vec3
  ) => {
    for (const p of platforms) {
      if ((p.def.kind === 'moving' || p.def.kind === 'roller') && p.def.moveOffset) {
        const speed = p.def.moveSpeed ?? 1.2;
        const phase = p.def.movePhase ?? 0;
        const s = Math.sin(worldTime * speed + phase);
        p.currentPos.x = p.def.position.x + p.def.moveOffset.x * s;
        p.currentPos.y = p.def.position.y + p.def.moveOffset.y * s;
        p.currentPos.z = p.def.position.z + p.def.moveOffset.z * s;
        p.group.position.set(p.currentPos.x, p.currentPos.y, p.currentPos.z);
      }
      if (p.def.kind === 'gear') {
        p.currentRotY += (p.def.spinSpeed ?? 0.65) * dt;
        p.group.rotation.y = p.currentRotY;
      }
      if (p.def.kind === 'crumbling') {
        if (p.crumbleState === 'shaking') {
          p.group.position.set(
            p.currentPos.x + Math.sin(realTime * 48) * 0.08,
            p.currentPos.y,
            p.currentPos.z + Math.cos(realTime * 44) * 0.08
          );
          p.group.visible = true;
        } else if (p.crumbleState === 'fallen') {
          p.group.visible = false;
        } else {
          p.group.position.set(p.currentPos.x, p.currentPos.y, p.currentPos.z);
          p.group.visible = true;
        }
      }
      if (p.def.kind === 'bridge') {
        p.group.visible = p.active;
      }
      if (p.strikerPlate) {
        if (p.padPulse > 0) p.padPulse = Math.max(0, p.padPulse - dt * 3.8);
        p.strikerPlate.position.y =
          p.def.size.y * 0.5 + 0.08 + Math.sin(p.padPulse * Math.PI) * 0.25;
      }
    }

    for (const tv of traffic) {
      const span = tv.lane.xMax - tv.lane.xMin;
      tv.pos.x += tv.lane.direction * tv.lane.speed * dt;
      if (tv.lane.direction > 0 && tv.pos.x > tv.lane.xMax) {
        tv.pos.x -= span;
      } else if (tv.lane.direction < 0 && tv.pos.x < tv.lane.xMin) {
        tv.pos.x += span;
      }
      tv.group.position.x = tv.pos.x;
      for (const w of tv.wheels) {
        w.rotation.x += tv.lane.speed * dt * 2.4;
      }
      if (tv.honkedCooldown > 0) tv.honkedCooldown = Math.max(0, tv.honkedCooldown - dt);
    }

    if (boss) {
      boss.phase += boss.def.speed * dt * 0.45;
      boss.pos.x = boss.def.position.x + Math.sin(boss.phase) * boss.def.patrolWidth;
      boss.group.position.x = boss.pos.x;
      if (boss.def.kind === 'mega_crane') {
        boss.group.rotation.y = Math.sin(boss.phase * 0.8) * 1.1;
      }
    }

    for (const pt of portals) {
      for (const m of pt.shaderMats) m.uniforms.uTime.value = realTime;
    }
    for (const col of collectibles) {
      if (col.collected) {
        col.group.visible = false;
        continue;
      }
      col.group.rotation.y = realTime * 2.2;
      col.group.position.y =
        col.def.position.y + Math.sin(realTime * 3.0 + col.def.position.z) * 0.16;
    }
    finishRing.rotation.z = realTime * 1.1;

    scenery.update(realTime, dt, playerPos);
  };

  return {
    root,
    platforms,
    traffic,
    boss,
    portals,
    checkpoints,
    collectibles,
    switches,
    collidableMeshes,
    updateAnimations,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
