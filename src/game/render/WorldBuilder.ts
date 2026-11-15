import * as THREE from 'three';
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
  VehicleKind,
  WorldTheme,
} from '../types';
import { createHighwaySignTexture, type ProceduralTextureSet } from './ProceduralTextures';

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

  // Deliberate Indian Road Material Library
  const matAsphalt = track(
    new THREE.MeshStandardMaterial({
      map: textures.asphaltAlbedo,
      bumpMap: textures.asphaltBump,
      bumpScale: 0.035,
      roughness: 0.86,
      metalness: 0.04,
    })
  );

  const matWetAsphalt = track(
    new THREE.MeshStandardMaterial({
      map: textures.asphaltAlbedo,
      bumpMap: textures.asphaltBump,
      bumpScale: 0.025,
      color: '#6b7a8a',
      roughness: 0.24,
      metalness: 0.18,
    })
  );

  const matConcrete = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfacePrimary,
      map: textures.concreteAlbedo,
      bumpMap: textures.concreteBump,
      bumpScale: 0.045,
      roughnessMap: textures.concreteRoughness,
      roughness: 0.88,
      metalness: 0.05,
    })
  );

  const matSteel = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfaceSecondary,
      map: textures.steelAlbedo,
      bumpMap: textures.steelBump,
      bumpScale: 0.035,
      roughnessMap: textures.steelRoughness,
      roughness: 0.48,
      metalness: 0.72,
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
      roughness: 0.72,
      metalness: 0.06,
    })
  );

  const matConeOrange = track(
    new THREE.MeshStandardMaterial({
      color: '#ea5c1f',
      roughness: 0.55,
      metalness: 0.05,
    })
  );

  const matRubber = track(
    new THREE.MeshStandardMaterial({
      color: '#1b1d22',
      roughness: 0.94,
      metalness: 0.03,
    })
  );

  const matCopper = track(
    new THREE.MeshStandardMaterial({
      color: '#cc823b',
      map: textures.copperPadAlbedo,
      roughness: 0.34,
      metalness: 0.75,
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

  const matHazardCurb = track(
    new THREE.MeshStandardMaterial({
      map: textures.hazardStripeAlbedo,
      roughness: 0.7,
      metalness: 0.25,
    })
  );

  const matRollerYellow = track(
    new THREE.MeshStandardMaterial({
      color: '#e8a220',
      roughness: 0.42,
      metalness: 0.35,
    })
  );

  const matPuddle = track(
    new THREE.MeshStandardMaterial({
      color: '#4f8ea8',
      roughness: 0.08,
      metalness: 0.25,
      transparent: true,
      opacity: 0.75,
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

  // Shared props geometries
  const coneGeo = track(new THREE.ConeGeometry(0.24, 0.65, 10));
  const coneCollarGeo = track(new THREE.CylinderGeometry(0.12, 0.16, 0.12, 10));
  const whiteMat = track(new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.6 }));
  const pierColGeo = track(new THREE.BoxGeometry(0.95, 28, 0.95));

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

      const plateGeo = track(new THREE.CylinderGeometry(def.size.x * 0.42, def.size.x * 0.46, 0.22, 16));
      strikerPlate = new THREE.Mesh(plateGeo, matCopper);
      strikerPlate.position.y = def.size.y * 0.5 + 0.08;
      group.add(strikerPlate);

      if (def.kind === 'pothole') {
        // Surround pothole spring with 4 warning cones
        const cx = def.size.x * 0.42;
        const cz = def.size.z * 0.42;
        for (const [ox, oz] of [[-cx, -cz], [cx, -cz], [-cx, cz], [cx, cz]]) {
          const cone = new THREE.Mesh(coneGeo, matConeOrange);
          cone.position.set(ox, def.size.y * 0.5 + 0.32, oz);
          group.add(cone);
        }
      }
    } else if (def.kind === 'roller') {
      // Drivable Yellow Indian Construction Road Roller Platform
      const bodyGeo = track(new THREE.BoxGeometry(def.size.x * 0.85, def.size.y * 0.55, def.size.z * 0.72));
      const bodyMesh = new THREE.Mesh(bodyGeo, matRollerYellow);
      bodyMesh.position.y = 0.15;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      group.add(bodyMesh);
      collidableMeshes.push(bodyMesh);

      const drumGeo = track(new THREE.CylinderGeometry(def.size.y * 0.52, def.size.y * 0.52, def.size.x * 0.96, 16));
      const drum = new THREE.Mesh(drumGeo, matSteel);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, -0.1, -def.size.z * 0.34);
      group.add(drum);

      const cabGeo = track(new THREE.BoxGeometry(def.size.x * 0.55, 1.1, def.size.z * 0.26));
      const cab = new THREE.Mesh(cabGeo, matWeatheredFrame);
      cab.position.set(0, 0.9, def.size.z * 0.18);
      group.add(cab);
    } else if (def.kind === 'puddle') {
      const pudGeo = track(new THREE.CylinderGeometry(def.size.x * 0.5, def.size.x * 0.52, 0.08, 16));
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
      const zoneMesh = new THREE.Mesh(track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z)), zoneMat);
      group.add(zoneMesh);
    } else if (def.kind === 'wall') {
      // Red & White Indian Construction Overhead/Road Barrier
      const barGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const bar = new THREE.Mesh(barGeo, matBarrier);
      bar.castShadow = true;
      bar.receiveShadow = true;
      group.add(bar);
      collidableMeshes.push(bar);

      // Leg posts if raised overhead so player can slide underneath!
      if (def.position.y > 1.2) {
        const legGeo = track(new THREE.BoxGeometry(0.28, 3.0, 0.28));
        const legL = new THREE.Mesh(legGeo, matWeatheredFrame);
        legL.position.set(-def.size.x * 0.48, -1.2, 0);
        const legR = new THREE.Mesh(legGeo, matWeatheredFrame);
        legR.position.set(def.size.x * 0.48, -1.2, 0);
        group.add(legL, legR);
      }
    } else {
      // Solid, Moving, Ramp, Bridge, Crumbling Road Decks
      const mainMat = pickMaterial(def.materialStyle);
      const deckGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const deckMesh = new THREE.Mesh(deckGeo, mainMat);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      group.add(deckMesh);
      collidableMeshes.push(deckMesh);

      if (def.size.x >= 4.0 && def.size.z >= 6.0 && def.kind === 'solid') {
        // Roadside Indian Jersey Barriers along deck edges
        const curbGeo = track(new THREE.BoxGeometry(0.36, 0.48, def.size.z * 0.88));
        const curbL = new THREE.Mesh(curbGeo, matBarrier);
        curbL.position.set(-def.size.x * 0.5 + 0.2, def.size.y * 0.5 + 0.24, 0);
        const curbR = new THREE.Mesh(curbGeo, matBarrier);
        curbR.position.set(def.size.x * 0.5 - 0.2, def.size.y * 0.5 + 0.24, 0);
        group.add(curbL, curbR);

        // Construction Traffic Cones on site stages
        if (theme.sceneryStyle === 'city_site' || theme.sceneryStyle === 'pothole' || theme.sceneryStyle === 'mega_site') {
          const cone = new THREE.Mesh(coneGeo, matConeOrange);
          cone.position.set(-def.size.x * 0.36, def.size.y * 0.5 + 0.32, -def.size.z * 0.3);
          const collar = new THREE.Mesh(coneCollarGeo, whiteMat);
          collar.position.set(-def.size.x * 0.36, def.size.y * 0.5 + 0.38, -def.size.z * 0.3);
          group.add(cone, collar);
        }

        // Grounded Concrete Viaduct Support Piers descending cleanly
        const pierOffsetX = Math.max(1.4, def.size.x * 0.35);
        for (const sx of [-pierOffsetX, pierOffsetX]) {
          const pier = new THREE.Mesh(pierColGeo, matConcrete);
          pier.position.set(sx, -14.5, 0);
          group.add(pier);
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
  // 2. LIVING INDIAN TRAFFIC SYSTEM (Auto-Rickshaws, Cars, Trucks, Buses)
  // =========================================================================
  const traffic: TrafficVehicleHandle[] = [];
  const wheelGeo = track(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 10));
  const headlightMat = track(new THREE.MeshBasicMaterial({ color: '#fff3c4' }));

  const buildVehicleMesh = (kind: VehicleKind): { group: THREE.Group; size: Vec3 } => {
    const g = new THREE.Group();
    if (kind === 'auto') {
      // Iconic Yellow-Green Indian Auto-Rickshaw
      const body = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.5, 0.75, 2.2)),
        track(new THREE.MeshStandardMaterial({ color: '#1f7a44', roughness: 0.55 }))
      );
      body.position.y = 0.55;
      const canopy = new THREE.Mesh(
        track(new THREE.BoxGeometry(1.45, 0.75, 1.85)),
        track(new THREE.MeshStandardMaterial({ color: '#f2b824', roughness: 0.65 }))
      );
      canopy.position.set(0, 1.25, -0.05);
      g.add(body, canopy);
      return { group: g, size: { x: 1.6, y: 1.7, z: 2.3 } };
    }
    if (kind === 'truck') {
      // Colorful Indian Cargo Truck
      const cab = new THREE.Mesh(
        track(new THREE.BoxGeometry(2.3, 1.85, 1.9)),
        track(new THREE.MeshStandardMaterial({ color: '#d94826', roughness: 0.5 }))
      );
      cab.position.set(0, 1.25, 1.5);
      const cargo = new THREE.Mesh(
        track(new THREE.BoxGeometry(2.45, 2.2, 3.6)),
        track(new THREE.MeshStandardMaterial({ color: '#c4832d', roughness: 0.65 }))
      );
      cargo.position.set(0, 1.45, -1.2);
      g.add(cab, cargo);
      return { group: g, size: { x: 2.5, y: 2.6, z: 5.5 } };
    }
    if (kind === 'bus') {
      const busBody = new THREE.Mesh(
        track(new THREE.BoxGeometry(2.4, 2.3, 6.2)),
        track(new THREE.MeshStandardMaterial({ color: '#b82e2e', roughness: 0.52 }))
      );
      busBody.position.y = 1.45;
      const stripe = new THREE.Mesh(
        track(new THREE.BoxGeometry(2.45, 0.55, 6.22)),
        whiteMat
      );
      stripe.position.y = 1.55;
      g.add(busBody, stripe);
      return { group: g, size: { x: 2.45, y: 2.6, z: 6.2 } };
    }
    // Sedan Car
    const carBody = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.9, 0.75, 3.6)),
      track(new THREE.MeshStandardMaterial({ color: '#d8dee6', roughness: 0.38, metalness: 0.25 }))
    );
    carBody.position.y = 0.6;
    const cabin = new THREE.Mesh(
      track(new THREE.BoxGeometry(1.65, 0.6, 1.8)),
      matWeatheredFrame
    );
    cabin.position.set(0, 1.22, -0.15);
    g.add(carBody, cabin);
    return { group: g, size: { x: 1.95, y: 1.5, z: 3.6 } };
  };

  for (const lane of level.trafficLanes ?? []) {
    const span = lane.xMax - lane.xMin;
    for (let i = 0; i < lane.count; i++) {
      const { group, size } = buildVehicleMesh(lane.vehicleKind);
      // Add 4 wheels + headlights
      for (const [wx, wz] of [[-size.x * 0.45, size.z * 0.3], [size.x * 0.45, size.z * 0.3], [-size.x * 0.45, -size.z * 0.3], [size.x * 0.45, -size.z * 0.3]]) {
        const w = new THREE.Mesh(wheelGeo, matRubber);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.36, wz);
        group.add(w);
      }
      const lamp = new THREE.Mesh(track(new THREE.BoxGeometry(0.4, 0.2, 0.1)), headlightMat);
      lamp.position.set(0, 0.65, size.z * 0.51);
      group.add(lamp);

      group.rotation.y = lane.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      const startX = lane.xMin + (i / lane.count) * span;
      group.position.set(startX, lane.y, lane.z);
      root.add(group);
      traffic.push({
        lane,
        group,
        pos: { x: startX, y: lane.y + size.y * 0.5, z: lane.z },
        size: { x: size.z, y: size.y, z: size.x }, // Rotated 90 deg around Y!
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
      bGroup.add(mast, boom);
      bSize = { x: 13.5, y: 2.2, z: 2.0 };
    } else {
      // Giant Armored Road Roller / Traffic Machine / Overlord
      const chassis = new THREE.Mesh(track(new THREE.BoxGeometry(4.4, 2.2, 4.4)), matRollerYellow);
      chassis.position.y = 0.6;
      const frontDrum = new THREE.Mesh(track(new THREE.CylinderGeometry(1.5, 1.5, 5.2, 20)), matSteel);
      frontDrum.rotation.z = Math.PI / 2;
      frontDrum.position.set(0, 0.1, 1.8);
      const beacon = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.45, 12, 10)),
        track(new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 0.9 }))
      );
      beacon.position.y = 2.1;
      bGroup.add(chassis, frontDrum, beacon);
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
    group.add(pillar);
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
  const coinGeo = track(new THREE.CylinderGeometry(0.44, 0.44, 0.12, 16));
  const helmetGeo = track(new THREE.SphereGeometry(0.38, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58));
  const blueprintGeo = track(new THREE.CylinderGeometry(0.14, 0.14, 0.75, 10));
  const energyGeo = track(new THREE.OctahedronGeometry(0.4, 0));
  const signGeo = track(new THREE.BoxGeometry(0.65, 0.55, 0.1));

  const coinMat = track(new THREE.MeshStandardMaterial({ color: '#f5b832', emissive: '#a86b14', emissiveIntensity: 0.4, metalness: 0.85, roughness: 0.22 }));
  const bpMat = track(new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.45, roughness: 0.35 }));
  const energyMat = track(new THREE.MeshStandardMaterial({ color: '#4ade80', emissive: '#16a34a', emissiveIntensity: 0.55, roughness: 0.25 }));
  const signMat = track(new THREE.MeshStandardMaterial({ color: '#16803c', emissive: '#0f5c2b', emissiveIntensity: 0.35, roughness: 0.45 }));

  for (const col of level.collectibles) {
    const group = new THREE.Group();
    group.position.set(col.position.x, col.position.y, col.position.z);
    const kind = col.kind ?? 'coin';
    if (kind === 'helmet') {
      const dome = new THREE.Mesh(helmetGeo, coinMat);
      const brim = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.44, 0.06, 14)), coinMat);
      group.add(dome, brim);
    } else if (kind === 'blueprint') {
      const scroll = new THREE.Mesh(blueprintGeo, bpMat);
      scroll.rotation.z = 0.65;
      group.add(scroll);
    } else if (kind === 'energy') {
      group.add(new THREE.Mesh(energyGeo, energyMat));
    } else if (kind === 'sign') {
      const plate = new THREE.Mesh(signGeo, signMat);
      const post = new THREE.Mesh(track(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8)), matSteel);
      post.position.y = -0.5;
      group.add(plate, post);
    } else {
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      group.add(coin);
    }
    root.add(group);
    collectibles.push({ def: col, group, collected: false });
  }

  // =========================================================================
  // 5. FINISH GATE (INDIAN EXPRESSWAY RIBBON INAUGURATION ARCH)
  // =========================================================================
  const finishGroup = new THREE.Group();
  finishGroup.position.set(level.finishPosition.x, level.finishPosition.y, level.finishPosition.z);
  const archPillar = track(new THREE.BoxGeometry(0.55, 5.8, 0.7));
  const finArchL = new THREE.Mesh(archPillar, matBarrier);
  finArchL.position.set(-2.8, 2.9, 0);
  const finArchR = new THREE.Mesh(archPillar, matBarrier);
  finArchR.position.set(2.8, 2.9, 0);
  const signTex = track(createHighwaySignTexture(level.highwayLabel ?? 'NH-BOUNCE · FINISH'));
  const finBanner = new THREE.Mesh(
    track(new THREE.BoxGeometry(6.4, 1.7, 0.35)),
    track(new THREE.MeshBasicMaterial({ map: signTex }))
  );
  finBanner.position.set(0, 5.6, 0);
  const finRibbon = new THREE.Mesh(
    track(new THREE.BoxGeometry(5.2, 0.25, 0.08)),
    track(new THREE.MeshStandardMaterial({ color: '#e59a3c', emissive: '#e59a3c', emissiveIntensity: 0.45 }))
  );
  finRibbon.position.set(0, 1.4, 0);
  const finishRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.4, 0.09, 10, 32)), coinMat);
  finishRing.position.set(0, 2.5, 0);
  finishGroup.add(finArchL, finArchR, finBanner, finRibbon, finishRing);
  root.add(finishGroup);

  // =========================================================================
  // 6. INDIAN HIGHWAY SIGNBOARDS, TREES, WORKER NPCs, TUNNEL ARCHES & RAIN
  // =========================================================================
  // Overhead Highway Signboard at start (high clearance, sign mounted cleanly in front of beam)
  const startSignGroup = new THREE.Group();
  startSignGroup.position.set(0, 7.6, -16);
  const gPostGeo = track(new THREE.CylinderGeometry(0.18, 0.22, 11.2, 8));
  const gL = new THREE.Mesh(gPostGeo, matSteel);
  gL.position.set(-6.5, -2.9, 0);
  const gR = new THREE.Mesh(gPostGeo, matSteel);
  gR.position.set(6.5, -2.9, 0);
  const gBeam = new THREE.Mesh(track(new THREE.BoxGeometry(13.6, 0.34, 0.3)), matSteel);
  gBeam.position.set(0, 0.65, -0.22);
  const gBeamLow = new THREE.Mesh(track(new THREE.BoxGeometry(13.6, 0.22, 0.24)), matSteel);
  gBeamLow.position.set(0, -0.55, -0.22);
  const gBoard = new THREE.Mesh(
    track(new THREE.BoxGeometry(7.6, 2.0, 0.2)),
    track(new THREE.MeshBasicMaterial({ map: signTex }))
  );
  gBoard.position.set(0, 0.05, 0.14);
  startSignGroup.add(gL, gR, gBeam, gBeamLow, gBoard);
  root.add(startSignGroup);

  // Stylized Roadside Banyan/Neem Trees + Construction Worker NPCs safely outside main path
  const trunkGeo = track(new THREE.CylinderGeometry(0.28, 0.42, 3.2, 8));
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: '#5c422c', roughness: 0.9 }));
  const canopyGeo = track(new THREE.DodecahedronGeometry(1.9, 1));
  const canopyMat = track(
    new THREE.MeshStandardMaterial({
      color: theme.sceneryStyle === 'mountain' ? '#3d6945' : '#4a7a3e',
      roughness: 0.85,
    })
  );

  const workerNPCs: THREE.Group[] = [];
  const vestMat = track(new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.6 }));
  const hatMat = track(new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 }));
  const npcSkinMat = track(new THREE.MeshStandardMaterial({ color: '#c98e68', roughness: 0.7 }));

  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = -10 - i * 16;
    if (theme.sceneryStyle !== 'tunnel') {
      const tree = new THREE.Group();
      tree.position.set(side * 12.5, -1.5, zPos);
      const tMesh = new THREE.Mesh(trunkGeo, trunkMat);
      tMesh.position.y = 1.6;
      const cMesh = new THREE.Mesh(canopyGeo, canopyMat);
      cMesh.position.y = 3.8;
      tree.add(tMesh, cMesh);
      root.add(tree);
    } else {
      // Tunnel Bore Rib Arches + Sodium Lamps
      const arch = new THREE.Mesh(
        track(new THREE.TorusGeometry(11.5, 0.75, 8, 20, Math.PI)),
        matConcrete
      );
      arch.position.set(0, 0, zPos);
      const lamp = new THREE.Mesh(
        track(new THREE.BoxGeometry(2.2, 0.25, 0.4)),
        track(new THREE.MeshStandardMaterial({ color: '#ffbb55', emissive: '#ffaa33', emissiveIntensity: 0.9 }))
      );
      lamp.position.set(0, 10.6, zPos);
      root.add(arch, lamp);
    }

    // Background Construction Worker NPC on safe side catwalk
    if (i < 4) {
      const npc = new THREE.Group();
      npc.position.set(-side * 10.5, 0, zPos - 4);
      const stand = new THREE.Mesh(track(new THREE.BoxGeometry(2.4, 8, 2.4)), matConcrete);
      stand.position.y = -4;
      const body = new THREE.Mesh(track(new THREE.BoxGeometry(0.55, 0.85, 0.35)), vestMat);
      body.position.y = 0.95;
      const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.22, 10, 10)), npcSkinMat);
      head.position.y = 1.62;
      const hat = new THREE.Mesh(track(new THREE.SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55)), hatMat);
      hat.position.y = 1.68;
      npc.add(stand, body, head, hat);
      root.add(npc);
      workerNPCs.push(npc);
    }
  }

  // Monsoon Rain Streak Particle Pool (World 8 & Mountain mist)
  let rainMesh: THREE.InstancedMesh | null = null;
  const rainCount = theme.rainIntensity > 0 ? Math.round(140 * theme.rainIntensity) : 0;
  const rainOffsets: Vec3[] = [];
  if (rainCount > 0) {
    const rainGeo = track(new THREE.BoxGeometry(0.03, 1.35, 0.03));
    const rainMat = track(new THREE.MeshBasicMaterial({ color: '#b8d8f0', transparent: true, opacity: 0.48 }));
    rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
    rainMesh.frustumCulled = false;
    for (let i = 0; i < rainCount; i++) {
      rainOffsets.push({
        x: ((i * 37) % 36) - 18,
        y: ((i * 53) % 24),
        z: ((i * 71) % 36) - 18,
      });
    }
    root.add(rainMesh);
  }

  // Deep atmospheric ground haze plane
  const abyssPlane = new THREE.Mesh(
    track(new THREE.PlaneGeometry(680, 680)),
    track(new THREE.MeshBasicMaterial({ color: theme.fogColor, transparent: true, opacity: 0.4 }))
  );
  abyssPlane.rotation.x = -Math.PI / 2;
  abyssPlane.position.set(0, level.fallLimitY - 14, -55);
  root.add(abyssPlane);

  const dummy = new THREE.Object3D();

  // =========================================================================
  // ANIMATION UPDATE LOOP
  // =========================================================================
  const updateAnimations = (worldTime: number, realTime: number, dt: number, playerPos: Vec3) => {
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
        p.strikerPlate.position.y = p.def.size.y * 0.5 + 0.08 + Math.sin(p.padPulse * Math.PI) * 0.25;
      }
    }

    // Update Moving Traffic Vehicles
    for (const tv of traffic) {
      const span = tv.lane.xMax - tv.lane.xMin;
      tv.pos.x += tv.lane.direction * tv.lane.speed * dt;
      if (tv.lane.direction > 0 && tv.pos.x > tv.lane.xMax) {
        tv.pos.x -= span;
      } else if (tv.lane.direction < 0 && tv.pos.x < tv.lane.xMin) {
        tv.pos.x += span;
      }
      tv.group.position.x = tv.pos.x;
      if (tv.honkedCooldown > 0) tv.honkedCooldown = Math.max(0, tv.honkedCooldown - dt);
    }

    // Update Boss Encounter Patrol
    if (boss) {
      boss.phase += boss.def.speed * dt * 0.45;
      boss.pos.x = boss.def.position.x + Math.sin(boss.phase) * boss.def.patrolWidth;
      boss.group.position.x = boss.pos.x;
      if (boss.def.kind === 'mega_crane') {
        boss.group.rotation.y = Math.sin(boss.phase * 0.8) * 1.1;
      }
    }

    // Portals, Collectibles, NPCs, Finish Arch
    for (const pt of portals) {
      for (const m of pt.shaderMats) m.uniforms.uTime.value = realTime;
    }
    for (const col of collectibles) {
      if (col.collected) {
        col.group.visible = false;
        continue;
      }
      col.group.rotation.y = realTime * 2.2;
      col.group.position.y = col.def.position.y + Math.sin(realTime * 3.0 + col.def.position.z) * 0.16;
    }
    for (let i = 0; i < workerNPCs.length; i++) {
      workerNPCs[i].position.y = Math.abs(Math.sin(realTime * 3.2 + i)) * 0.08;
    }
    finishRing.rotation.z = realTime * 1.1;

    // Monsoon Rain streaks centered around player
    if (rainMesh) {
      for (let i = 0; i < rainOffsets.length; i++) {
        const ro = rainOffsets[i];
        ro.y -= 26 * dt;
        if (ro.y < -4) ro.y += 24;
        dummy.position.set(playerPos.x + ro.x, playerPos.y + ro.y, playerPos.z + ro.z);
        dummy.rotation.set(0, 0, 0.08);
        dummy.updateMatrix();
        rainMesh.setMatrixAt(i, dummy.matrix);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
    }
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
