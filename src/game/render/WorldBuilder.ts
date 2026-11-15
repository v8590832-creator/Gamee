import * as THREE from 'three';
import type {
  CheckpointDef,
  CollectibleDef,
  LevelDefinition,
  PlatformDef,
  PortalPairDef,
  SwitchDef,
  WorldTheme,
} from '../types';
import type { ProceduralTextureSet } from './ProceduralTextures';

export interface PlatformMeshHandle {
  def: PlatformDef;
  group: THREE.Group;
  strikerPlate?: THREE.Mesh;
  padPulse: number;
  currentPos: { x: number; y: number; z: number };
  currentRotY: number;
  crumbleState: 'intact' | 'shaking' | 'fallen';
  crumbleTimer: number;
  active: boolean;
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
  ring: THREE.Mesh;
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
  portals: PortalMeshHandle[];
  checkpoints: CheckpointMeshHandle[];
  collectibles: CollectibleMeshHandle[];
  switches: SwitchMeshHandle[];
  finishGroup: THREE.Group;
  finishRing: THREE.Mesh;
  collidableMeshes: THREE.Object3D[];
  updateAnimations: (worldTime: number, realTime: number, dt: number) => void;
  dispose: () => void;
}

function createGearGeometry(outerRadius: number, thickness: number, teethCount = 16): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const innerR = outerRadius * 0.88;
  const step = (Math.PI * 2) / teethCount;

  for (let i = 0; i < teethCount; i++) {
    const a0 = i * step;
    const a1 = a0 + step * 0.22;
    const a2 = a0 + step * 0.45;
    const a3 = a0 + step * 0.68;
    const a4 = a0 + step;

    const p0x = Math.cos(a0) * innerR;
    const p0y = Math.sin(a0) * innerR;
    if (i === 0) shape.moveTo(p0x, p0y);
    else shape.lineTo(p0x, p0y);

    shape.lineTo(Math.cos(a1) * outerRadius, Math.sin(a1) * outerRadius);
    shape.lineTo(Math.cos(a2) * outerRadius, Math.sin(a2) * outerRadius);
    shape.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
    shape.lineTo(Math.cos(a4) * innerR, Math.sin(a4) * innerR);
  }
  shape.closePath();

  const hole = new THREE.Path();
  hole.absarc(0, 0, outerRadius * 0.2, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.08,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  return geo;
}

function createPortalDiscShader(colorHex: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
    },
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
        float angle = atan(p.y, p.x);
        float swirl = sin(angle * 4.0 - r * 10.0 + uTime * 3.5) * 0.5 + 0.5;
        float rings = smoothstep(0.08, 0.92, sin(r * 13.0 - uTime * 3.6) * 0.5 + 0.5);
        float edge = smoothstep(1.0, 0.72, r);
        vec3 col = mix(uColor * 0.42, vec3(0.92, 0.95, 0.98), swirl * 0.3 + (1.0 - r) * 0.35);
        col += uColor * rings * 0.25;
        gl_FragColor = vec4(col, edge * (0.72 + 0.2 * swirl));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function buildLevelScene(
  level: LevelDefinition,
  theme: WorldTheme,
  textures: ProceduralTextureSet
): BuiltLevelScene {
  const root = new THREE.Group();
  const disposables: Array<{ dispose: () => void }> = [];
  const collidableMeshes: THREE.Object3D[] = [];

  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  // =========================================================================
  // DELIBERATE MATERIAL LIBRARY (Calibrated Roughness, Metalness & Imperfections)
  // =========================================================================
  const matConcrete = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfacePrimary,
      map: textures.concreteAlbedo,
      bumpMap: textures.concreteBump,
      bumpScale: 0.04,
      roughnessMap: textures.concreteRoughness,
      roughness: 0.88,
      metalness: 0.06,
    })
  );

  const matSteel = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfaceSecondary,
      map: textures.steelAlbedo,
      bumpMap: textures.steelBump,
      bumpScale: 0.032,
      roughnessMap: textures.steelRoughness,
      roughness: 0.48,
      metalness: 0.74,
    })
  );

  const matWeatheredFrame = track(
    new THREE.MeshStandardMaterial({
      color: '#252a32',
      roughness: 0.62,
      metalness: 0.68,
    })
  );

  const matRubber = track(
    new THREE.MeshStandardMaterial({
      color: '#1f2226',
      roughness: 0.92,
      metalness: 0.03,
    })
  );

  const matCeramic = track(
    new THREE.MeshStandardMaterial({
      color: '#d4cfc4',
      roughness: 0.26,
      metalness: 0.06,
    })
  );

  const matCopper = track(
    new THREE.MeshStandardMaterial({
      color: '#b86f39',
      roughness: 0.36,
      metalness: 0.82,
    })
  );

  const matStone = track(
    new THREE.MeshStandardMaterial({
      color: theme.surfacePrimary,
      map: textures.stoneAlbedo,
      bumpMap: textures.stoneBump,
      bumpScale: 0.06,
      roughness: 0.92,
      metalness: 0.04,
    })
  );

  const matMoss = track(
    new THREE.MeshStandardMaterial({
      color: '#4f6b46',
      map: textures.stoneAlbedo,
      bumpMap: textures.stoneBump,
      bumpScale: 0.05,
      roughness: 0.94,
      metalness: 0.02,
    })
  );

  const matObsidian = track(
    new THREE.MeshStandardMaterial({
      color: '#28252d',
      map: textures.stoneAlbedo,
      bumpMap: textures.stoneBump,
      bumpScale: 0.04,
      roughness: 0.58,
      metalness: 0.28,
    })
  );

  const matVoid = track(
    new THREE.MeshStandardMaterial({
      color: '#2c303a',
      roughness: 0.52,
      metalness: 0.4,
    })
  );

  const matHazardCurb = track(
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: textures.hazardStripeAlbedo,
      roughness: 0.72,
      metalness: 0.22,
    })
  );

  const matPadPlate = track(
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: textures.copperPadAlbedo,
      emissive: theme.accentColor,
      emissiveIntensity: 0.22,
      roughness: 0.36,
      metalness: 0.68,
    })
  );

  const matGravityZone = track(
    new THREE.MeshStandardMaterial({
      color: '#48b8d0',
      emissive: '#21677a',
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      roughness: 0.2,
      metalness: 0.1,
    })
  );

  const matFluidZone = track(
    new THREE.MeshStandardMaterial({
      color: '#299aa8',
      emissive: '#144d59',
      emissiveIntensity: 0.24,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      roughness: 0.16,
      metalness: 0.05,
    })
  );

  const matWindZone = track(
    new THREE.MeshStandardMaterial({
      color: '#d4e6f5',
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      roughness: 0.3,
    })
  );

  const pickMaterial = (style?: PlatformDef['materialStyle']) => {
    switch (style) {
      case 'steel':
        return matSteel;
      case 'copper':
        return matCopper;
      case 'stone':
        return matStone;
      case 'moss':
        return matMoss;
      case 'obsidian':
        return matObsidian;
      case 'void':
        return matVoid;
      default:
        return matConcrete;
    }
  };

  const platforms: PlatformMeshHandle[] = [];
  const pipeGeoUnit = track(new THREE.CylinderGeometry(0.14, 0.14, 1, 10));
  const flangeGeo = track(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10));
  const boltGeo = track(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 6));
  const pierColGeo = track(new THREE.BoxGeometry(0.95, 26, 0.95));
  const taperedRockGeo = track(new THREE.ConeGeometry(1.0, 1.0, 7));

  // =========================================================================
  // 1. HANDCRAFTED PLATFORMS, SUPPORTS, PIPES & MECHANISMS
  // =========================================================================
  for (let pIdx = 0; pIdx < level.platforms.length; pIdx++) {
    const def = level.platforms[pIdx];
    const group = new THREE.Group();
    group.position.set(def.position.x, def.position.y, def.position.z);
    if (def.rotation) {
      group.rotation.set(def.rotation.x, def.rotation.y, def.rotation.z);
    }

    let strikerPlate: THREE.Mesh | undefined;

    if (def.kind === 'bounce') {
      // Handcrafted pneumatic rebound assembly: rubberized base collar, 4 hydraulic dampers, copper piston plate
      const baseGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y * 0.55, def.size.z));
      const baseMesh = new THREE.Mesh(baseGeo, matRubber);
      baseMesh.position.y = -def.size.y * 0.22;
      baseMesh.receiveShadow = true;
      baseMesh.castShadow = true;
      group.add(baseMesh);

      const springGeo = track(new THREE.CylinderGeometry(def.size.x * 0.24, def.size.x * 0.28, def.size.y * 0.55, 14));
      const springMesh = new THREE.Mesh(springGeo, matCopper);
      group.add(springMesh);

      // 4 corner hydraulic damper bolts
      const hx = def.size.x * 0.42;
      const hz = def.size.z * 0.42;
      for (const sx of [-hx, hx]) {
        for (const sz of [-hz, hz]) {
          const bolt = new THREE.Mesh(boltGeo, matCeramic);
          bolt.position.set(sx, def.size.y * 0.08, sz);
          group.add(bolt);
        }
      }

      const plateGeo = track(new THREE.BoxGeometry(def.size.x * 0.86, def.size.y * 0.44, def.size.z * 0.86));
      strikerPlate = new THREE.Mesh(plateGeo, matPadPlate);
      strikerPlate.position.y = def.size.y * 0.24;
      strikerPlate.castShadow = true;
      strikerPlate.receiveShadow = true;
      group.add(strikerPlate);
      collidableMeshes.push(baseMesh, strikerPlate);
    } else if (def.kind === 'gear') {
      // Custom ExtrudeGeometry toothed clockwork gear + stationary lower bearing pedestal
      const radius = def.size.x * 0.5;
      const gearGeo = track(createGearGeometry(radius, def.size.y * 0.85, 18));
      const gearMesh = new THREE.Mesh(gearGeo, pickMaterial(def.materialStyle));
      gearMesh.castShadow = true;
      gearMesh.receiveShadow = true;
      group.add(gearMesh);

      const hubGeo = track(new THREE.CylinderGeometry(radius * 0.22, radius * 0.26, def.size.y * 1.2, 16));
      const hubMesh = new THREE.Mesh(hubGeo, matWeatheredFrame);
      hubMesh.castShadow = true;
      group.add(hubMesh);

      const rimGeo = track(new THREE.TorusGeometry(radius * 0.62, 0.14, 8, 28));
      const rimMesh = new THREE.Mesh(rimGeo, matWeatheredFrame);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.y = def.size.y * 0.46;
      group.add(rimMesh);

      // Stationary central axle shaft descending into abyss so gear isn't floating magically
      const shaftGeo = track(new THREE.CylinderGeometry(0.65, 0.85, 26, 12));
      const shaft = new THREE.Mesh(shaftGeo, matWeatheredFrame);
      shaft.position.y = -13.5;
      group.add(shaft);

      collidableMeshes.push(gearMesh);
    } else if (def.kind === 'gravityZone' || def.kind === 'windZone' || def.kind === 'fluidZone') {
      const zoneGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const zoneMat =
        def.kind === 'gravityZone'
          ? matGravityZone
          : def.kind === 'fluidZone'
          ? matFluidZone
          : matWindZone;
      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      group.add(zoneMesh);

      // Structural framing rails + emitter rings at corners
      const railGeo = track(new THREE.BoxGeometry(0.22, def.size.y, 0.22));
      const hx = def.size.x * 0.5 - 0.12;
      const hz = def.size.z * 0.5 - 0.12;
      for (const sx of [-hx, hx]) {
        for (const sz of [-hz, hz]) {
          const rail = new THREE.Mesh(railGeo, matWeatheredFrame);
          rail.position.set(sx, 0, sz);
          group.add(rail);
        }
      }
    } else {
      // Solid, Moving, Ramp, Bridge, Crumbling
      const mainMat = pickMaterial(def.materialStyle);
      const deckGeo = track(new THREE.BoxGeometry(def.size.x, def.size.y, def.size.z));
      const deckMesh = new THREE.Mesh(deckGeo, mainMat);
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      group.add(deckMesh);
      collidableMeshes.push(deckMesh);

      if (def.size.x >= 2.5 && def.size.z >= 3 && def.kind !== 'crumbling') {
        // Architectural side curbs + ceramic/steel trim
        const beamH = 0.2;
        const beamGeo = track(new THREE.BoxGeometry(0.24, beamH, def.size.z + 0.06));
        const leftRail = new THREE.Mesh(beamGeo, matWeatheredFrame);
        leftRail.position.set(-def.size.x * 0.5 + 0.1, def.size.y * 0.5 - beamH * 0.35, 0);
        const rightRail = new THREE.Mesh(beamGeo, matWeatheredFrame);
        rightRail.position.set(def.size.x * 0.5 - 0.1, def.size.y * 0.5 - beamH * 0.35, 0);
        group.add(leftRail, rightRail);

        // Underside structural I-beam belly rib
        const bellyGeo = track(new THREE.BoxGeometry(def.size.x * 0.72, def.size.y * 0.72, def.size.z * 0.88));
        const bellyMesh = new THREE.Mesh(bellyGeo, matWeatheredFrame);
        bellyMesh.position.y = -def.size.y * 0.8;
        group.add(bellyMesh);

        // Industrial utility pipe & flange joints running along one flank
        if (def.kind === 'solid' && def.size.z >= 8) {
          const pipeSide = pIdx % 2 === 0 ? 1 : -1;
          const pipe = new THREE.Mesh(pipeGeoUnit, matCopper);
          pipe.rotation.x = Math.PI / 2;
          pipe.scale.set(1, def.size.z * 0.92, 1);
          pipe.position.set(pipeSide * (def.size.x * 0.5 + 0.18), -def.size.y * 0.15, 0);
          group.add(pipe);

          for (const fz of [-def.size.z * 0.32, 0, def.size.z * 0.32]) {
            const fl = new THREE.Mesh(flangeGeo, matWeatheredFrame);
            fl.rotation.x = Math.PI / 2;
            fl.position.set(pipeSide * (def.size.x * 0.5 + 0.18), -def.size.y * 0.15, fz);
            group.add(fl);
          }
        }

        // Weathered caution hazard curb at front/back jump edges on solid decks
        if (def.kind === 'solid' && theme.sceneryStyle === 'industrial') {
          const curbGeo = track(new THREE.BoxGeometry(def.size.x * 0.92, 0.04, 0.45));
          const frontCurb = new THREE.Mesh(curbGeo, matHazardCurb);
          frontCurb.position.set(0, def.size.y * 0.5 + 0.02, -def.size.z * 0.5 + 0.25);
          group.add(frontCurb);
        }

        // Grounded Support Structures so solid platforms never appear inexplicably floating!
        if (def.kind === 'solid' && def.position.y < 10) {
          if (theme.sceneryStyle === 'skyfall' || theme.sceneryStyle === 'overgrown') {
            // Sculpted tapered rock / masonry underside spire
            const rock = new THREE.Mesh(taperedRockGeo, matStone);
            rock.rotation.x = Math.PI;
            rock.scale.set(def.size.x * 0.48, 8.5, def.size.z * 0.42);
            rock.position.y = -def.size.y * 0.5 - 4.2;
            group.add(rock);
          } else {
            // Twin structural support piers descending into mist
            const pierOffsetX = Math.max(1.2, def.size.x * 0.34);
            const pierOffsetZ = Math.max(1.5, def.size.z * 0.32);
            for (const sx of [-pierOffsetX, pierOffsetX]) {
              const pier = new THREE.Mesh(pierColGeo, matWeatheredFrame);
              pier.position.set(sx, -13.5, -pierOffsetZ);
              group.add(pier);
              if (def.size.z >= 14) {
                const pierBack = new THREE.Mesh(pierColGeo, matWeatheredFrame);
                pierBack.position.set(sx, -13.5, pierOffsetZ);
                group.add(pierBack);
              }
            }
          }
        } else if (def.kind === 'solid' && def.position.y >= 10) {
          // High elevated catwalks get overhead suspension cables anchored upward to trusses
          const cableGeo = track(new THREE.CylinderGeometry(0.05, 0.05, 16, 6));
          const cx = def.size.x * 0.45;
          const cz = def.size.z * 0.35;
          for (const sx of [-cx, cx]) {
            for (const sz of [-cz, cz]) {
              const cable = new THREE.Mesh(cableGeo, matWeatheredFrame);
              cable.position.set(sx, 8.0, sz);
              group.add(cable);
            }
          }
        }
      }

      if (def.kind === 'crumbling') {
        // Fracture seam accent bars + underside jagged rubble spike
        const seamMat = track(
          new THREE.MeshStandardMaterial({
            color: theme.accentColor,
            emissive: theme.accentColor,
            emissiveIntensity: 0.25,
            roughness: 0.65,
          })
        );
        const seamGeo = track(new THREE.BoxGeometry(def.size.x * 0.94, 0.06, 0.12));
        const s1 = new THREE.Mesh(seamGeo, seamMat);
        s1.position.set(0, def.size.y * 0.5 + 0.02, 0);
        s1.rotation.y = 0.45;
        const s2 = new THREE.Mesh(seamGeo, seamMat);
        s2.position.set(0, def.size.y * 0.5 + 0.02, 0);
        s2.rotation.y = -0.55;
        group.add(s1, s2);

        const spike = new THREE.Mesh(taperedRockGeo, matObsidian);
        spike.rotation.x = Math.PI;
        spike.scale.set(def.size.x * 0.35, 2.2, def.size.z * 0.35);
        spike.position.y = -def.size.y * 0.5 - 1.05;
        group.add(spike);
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
  // 2. PAIRED SPATIAL PORTALS
  // =========================================================================
  const portals: PortalMeshHandle[] = [];
  const portalRingGeo = track(new THREE.TorusGeometry(1.75, 0.16, 12, 36));
  const portalDiscGeo = track(new THREE.CircleGeometry(1.62, 32));
  const portalPylonGeo = track(new THREE.BoxGeometry(0.38, 3.2, 0.58));

  for (const pDef of level.portals) {
    const shaderMats: THREE.ShaderMaterial[] = [];

    const buildGate = (pos: { x: number; y: number; z: number }, normal: { x: number; y: number; z: number }, colorHex: string) => {
      const gate = new THREE.Group();
      gate.position.set(pos.x, pos.y, pos.z);
      const target = new THREE.Vector3(pos.x + normal.x, pos.y + normal.y, pos.z + normal.z);
      gate.lookAt(target);

      const ring = new THREE.Mesh(portalRingGeo, matWeatheredFrame);
      ring.castShadow = true;
      gate.add(ring);

      const pLeft = new THREE.Mesh(portalPylonGeo, matSteel);
      pLeft.position.set(-1.85, -0.4, 0);
      const pRight = new THREE.Mesh(portalPylonGeo, matSteel);
      pRight.position.set(1.85, -0.4, 0);
      gate.add(pLeft, pRight);

      const swirlMat = track(createPortalDiscShader(colorHex));
      shaderMats.push(swirlMat);
      const disc = new THREE.Mesh(portalDiscGeo, swirlMat);
      gate.add(disc);

      return gate;
    };

    const groupA = buildGate(pDef.aPos, pDef.aNormal, pDef.colorA ?? '#e59a3c');
    const groupB = buildGate(pDef.bPos, pDef.bNormal, pDef.colorB ?? '#48b8d0');
    root.add(groupA, groupB);
    portals.push({ def: pDef, groupA, groupB, shaderMats });
  }

  // =========================================================================
  // 3. CHECKPOINT BEACONS
  // =========================================================================
  const checkpoints: CheckpointMeshHandle[] = [];
  const cpBaseGeo = track(new THREE.CylinderGeometry(0.85, 1.05, 0.22, 12));
  const cpRingGeo = track(new THREE.TorusGeometry(0.7, 0.05, 8, 24));
  const cpPillarGeo = track(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 8));

  for (const cp of level.checkpoints) {
    const group = new THREE.Group();
    group.position.set(cp.position.x, cp.position.y + 0.03, cp.position.z);

    const baseMesh = new THREE.Mesh(cpBaseGeo, matWeatheredFrame);
    baseMesh.position.y = 0.11;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    const beaconMat = track(
      new THREE.MeshStandardMaterial({
        color: '#6b7785',
        emissive: '#384654',
        emissiveIntensity: 0.35,
        metalness: 0.5,
        roughness: 0.35,
      })
    );

    const pillar = new THREE.Mesh(cpPillarGeo, beaconMat);
    pillar.position.set(-1.1, 1.1, 0);
    group.add(pillar);

    const ring = new THREE.Mesh(cpRingGeo, beaconMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.45;
    group.add(ring);

    root.add(group);
    checkpoints.push({ def: cp, group, beaconMat, ring, activated: false });
  }

  // =========================================================================
  // 4. COLLECTIBLE ENERGY SHARDS
  // =========================================================================
  const collectibles: CollectibleMeshHandle[] = [];
  const shardGeo = track(new THREE.OctahedronGeometry(0.36, 0));
  const shardHaloGeo = track(new THREE.TorusGeometry(0.52, 0.032, 8, 24));
  const shardMat = track(
    new THREE.MeshStandardMaterial({
      color: theme.accentColor,
      emissive: theme.accentColor,
      emissiveIntensity: 0.5,
      metalness: 0.45,
      roughness: 0.22,
    })
  );

  for (const col of level.collectibles) {
    const group = new THREE.Group();
    group.position.set(col.position.x, col.position.y, col.position.z);

    const core = new THREE.Mesh(shardGeo, shardMat);
    core.castShadow = true;
    const halo = new THREE.Mesh(shardHaloGeo, matCopper);
    halo.rotation.x = Math.PI / 3;
    group.add(core, halo);

    root.add(group);
    collectibles.push({ def: col, group, collected: false });
  }

  // =========================================================================
  // 5. INTERACTIVE RELAY SWITCHES & SAGGING POWER CABLES
  // =========================================================================
  const switches: SwitchMeshHandle[] = [];
  const swPedestalGeo = track(new THREE.BoxGeometry(0.9, 1.1, 0.9));
  const swCrystalGeo = track(new THREE.OctahedronGeometry(0.28, 0));

  for (const sw of level.switches) {
    const group = new THREE.Group();
    group.position.set(sw.position.x, sw.position.y + 0.02, sw.position.z);

    const ped = new THREE.Mesh(swPedestalGeo, matWeatheredFrame);
    ped.position.y = 0.55;
    ped.castShadow = true;
    group.add(ped);

    const crystalMat = track(
      new THREE.MeshStandardMaterial({
        color: '#d96b38',
        emissive: '#b5461b',
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.5,
      })
    );
    const crystal = new THREE.Mesh(swCrystalGeo, crystalMat);
    crystal.position.y = 1.45;
    group.add(crystal);

    // Connect switch to its target bridge with a physical power cable conduit!
    const targetBridge = level.platforms.find((p) => p.switchId === sw.id);
    if (targetBridge) {
      const start = new THREE.Vector3(sw.position.x, sw.position.y + 0.2, sw.position.z);
      const mid = new THREE.Vector3(
        (sw.position.x + targetBridge.position.x) * 0.5,
        Math.min(sw.position.y, targetBridge.position.y) - 0.8,
        (sw.position.z + targetBridge.position.z) * 0.5
      );
      const end = new THREE.Vector3(
        targetBridge.position.x,
        targetBridge.position.y,
        targetBridge.position.z + targetBridge.size.z * 0.5
      );
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const cableGeo = track(new THREE.TubeGeometry(curve, 16, 0.08, 6, false));
      const cableMesh = new THREE.Mesh(cableGeo, matCopper);
      root.add(cableMesh);
    }

    root.add(group);
    switches.push({ def: sw, group, crystalMat, activated: false });
  }

  // =========================================================================
  // 6. FINISH SPIRE BEACON (Architectural Gateway Landmark)
  // =========================================================================
  const finishGroup = new THREE.Group();
  finishGroup.position.set(level.finishPosition.x, level.finishPosition.y + 0.03, level.finishPosition.z);

  const finPlinthGeo = track(new THREE.CylinderGeometry(1.7, 2.1, 0.35, 16));
  const finPlinth = new THREE.Mesh(finPlinthGeo, matWeatheredFrame);
  finPlinth.position.y = 0.17;
  finPlinth.receiveShadow = true;
  finishGroup.add(finPlinth);

  const finMat = track(
    new THREE.MeshStandardMaterial({
      color: theme.accentColor,
      emissive: theme.accentColor,
      emissiveIntensity: 0.55,
      metalness: 0.5,
      roughness: 0.22,
    })
  );

  const finCoreGeo = track(new THREE.OctahedronGeometry(0.7, 0));
  const finCore = new THREE.Mesh(finCoreGeo, finMat);
  finCore.position.y = 2.0;
  finishGroup.add(finCore);

  const finRingGeo = track(new THREE.TorusGeometry(1.45, 0.09, 10, 32));
  const finishRing = new THREE.Mesh(finRingGeo, finMat);
  finishRing.position.y = 2.0;
  finishGroup.add(finishRing);

  const archGeo = track(new THREE.BoxGeometry(0.5, 5.4, 0.65));
  const archL = new THREE.Mesh(archGeo, matSteel);
  archL.position.set(-2.35, 2.7, 0);
  const archR = new THREE.Mesh(archGeo, matSteel);
  archR.position.set(2.35, 2.7, 0);
  const lintelGeo = track(new THREE.BoxGeometry(5.5, 0.55, 0.8));
  const lintel = new THREE.Mesh(lintelGeo, matWeatheredFrame);
  lintel.position.set(0, 5.4, 0);
  finishGroup.add(archL, archR, lintel);

  root.add(finishGroup);

  // =========================================================================
  // 7. WORLD-SPECIFIC ENVIRONMENTAL STORYTELLING & VISTAS
  // =========================================================================
  // Outer Structural Buttresses (Varied Asymmetric Placement, Never Uniform Box Grid)
  const buttressCount = 14;
  const buttressGeo = track(new THREE.BoxGeometry(2.4, 56, 2.4));
  const buttressInst = new THREE.InstancedMesh(buttressGeo, matWeatheredFrame, buttressCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < buttressCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const zPos = 6 - Math.floor(i / 2) * 19 - (i % 3) * 2.5;
    const xPos = side * (18 + ((i * 3) % 7));
    const yPos = -14 + ((i * 5) % 8);
    dummy.position.set(xPos, yPos, zPos);
    dummy.rotation.set(0, (i * 0.22) % Math.PI, 0);
    const s = 0.8 + (i % 4) * 0.2;
    dummy.scale.set(s, 1 + (i % 3) * 0.2, s);
    dummy.updateMatrix();
    buttressInst.setMatrixAt(i, dummy.matrix);
  }
  buttressInst.computeBoundingSphere();
  root.add(buttressInst);

  // Overhead Architectural Cross-Gantries & Caged Work-Lamps
  const lampMat = track(
    new THREE.MeshStandardMaterial({
      color: theme.accentColor,
      emissive: theme.accentColor,
      emissiveIntensity: 0.65,
      roughness: 0.35,
    })
  );
  const gantryGeo = track(new THREE.BoxGeometry(48, 0.95, 1.15));
  const lampGeo = track(new THREE.BoxGeometry(4.2, 0.22, 0.32));
  for (let i = 0; i < 4; i++) {
    const zPos = -14 - i * 26;
    const yPos = 19 + (i % 2) * 3.5;
    const gantry = new THREE.Mesh(gantryGeo, matSteel);
    gantry.position.set(0, yPos, zPos);
    root.add(gantry);

    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(0, yPos - 0.56, zPos);
    root.add(lamp);
  }

  // Sagging Overhead Conduit Cables spanning across the chamber
  for (let i = 0; i < 3; i++) {
    const zA = -12 - i * 32;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-18, 16, zA),
      new THREE.Vector3(0, 12.5, zA - 4),
      new THREE.Vector3(18, 16, zA - 2),
    ]);
    const cableGeo = track(new THREE.TubeGeometry(curve, 18, 0.1, 6, false));
    const cable = new THREE.Mesh(cableGeo, matRubber);
    root.add(cable);
  }

  // World-Specific Mega-Landmarks & Foliage
  const vistaRings: THREE.Mesh[] = [];
  if (
    theme.sceneryStyle === 'clockwork' ||
    theme.sceneryStyle === 'gravity' ||
    theme.sceneryStyle === 'zenith'
  ) {
    const vistaRingGeo = track(new THREE.TorusGeometry(26, 0.48, 8, 48));
    const r1 = new THREE.Mesh(vistaRingGeo, matCopper);
    r1.position.set(0, 6, -65);
    const r2 = new THREE.Mesh(vistaRingGeo, matSteel);
    r2.position.set(0, 8, -95);
    r2.rotation.y = Math.PI / 4;
    root.add(r1, r2);
    vistaRings.push(r1, r2);
  } else {
    const archPillarGeo = track(new THREE.BoxGeometry(3.6, 40, 3.6));
    const archSpanGeo = track(new THREE.BoxGeometry(36, 2.4, 3.6));
    const frameL = new THREE.Mesh(archPillarGeo, matWeatheredFrame);
    frameL.position.set(-17, 4, -108);
    const frameR = new THREE.Mesh(archPillarGeo, matWeatheredFrame);
    frameR.position.set(17, 4, -108);
    const frameTop = new THREE.Mesh(archSpanGeo, matWeatheredFrame);
    frameTop.position.set(0, 23, -108);
    root.add(frameL, frameR, frameTop);
  }

  if (theme.sceneryStyle === 'overgrown') {
    // Grounded moss/foliage clusters seated flush on platform corners
    const leafGeo = track(new THREE.DodecahedronGeometry(0.65, 0));
    const leafMat = track(
      new THREE.MeshStandardMaterial({
        color: '#5b8248',
        roughness: 0.9,
        metalness: 0.02,
      })
    );
    const leafCount = 24;
    const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
    const col = new THREE.Color();
    let idx = 0;
    for (const p of level.platforms) {
      if (p.kind !== 'solid') continue;
      for (const side of [-1, 1]) {
        if (idx >= leafCount) break;
        dummy.position.set(
          p.position.x + side * (p.size.x * 0.42),
          p.position.y + p.size.y * 0.5 + 0.25,
          p.position.z - p.size.z * 0.25
        );
        const sc = 0.8 + (idx % 3) * 0.25;
        dummy.scale.set(sc, sc * 0.65, sc);
        dummy.rotation.set(0, idx * 0.9, 0);
        dummy.updateMatrix();
        leafInst.setMatrixAt(idx, dummy.matrix);
        col.set(idx % 2 === 0 ? '#5b8248' : '#4a6b3e');
        leafInst.setColorAt(idx, col);
        idx++;
      }
    }
    leafInst.count = idx;
    leafInst.computeBoundingSphere();
    root.add(leafInst);
  }

  // Deep atmospheric abyss floor well below fallLimitY
  const abyssGeo = track(new THREE.PlaneGeometry(680, 680));
  const abyssMat = track(
    new THREE.MeshBasicMaterial({
      color: theme.fogColor,
      transparent: true,
      opacity: 0.42,
    })
  );
  const abyssPlane = new THREE.Mesh(abyssGeo, abyssMat);
  abyssPlane.rotation.x = -Math.PI / 2;
  abyssPlane.position.set(0, level.fallLimitY - 14, -55);
  root.add(abyssPlane);

  // =========================================================================
  // ANIMATION UPDATE
  // =========================================================================
  const updateAnimations = (worldTime: number, realTime: number, dt: number) => {
    for (const p of platforms) {
      if (p.def.kind === 'moving' && p.def.moveOffset) {
        const speed = p.def.moveSpeed ?? 1.2;
        const phase = p.def.movePhase ?? 0;
        const s = Math.sin(worldTime * speed + phase);
        p.currentPos.x = p.def.position.x + p.def.moveOffset.x * s;
        p.currentPos.y = p.def.position.y + p.def.moveOffset.y * s;
        p.currentPos.z = p.def.position.z + p.def.moveOffset.z * s;
        p.group.position.set(p.currentPos.x, p.currentPos.y, p.currentPos.z);
      }

      if (p.def.kind === 'gear') {
        const spin = p.def.spinSpeed ?? 0.8;
        p.currentRotY = worldTime * spin;
        p.group.rotation.y = p.currentRotY;
      }

      if (p.strikerPlate) {
        p.padPulse = Math.max(0, p.padPulse - dt * 4.5);
        const lift = p.padPulse * 0.22;
        p.strikerPlate.position.y = p.def.size.y * 0.24 + lift;
      }

      if (p.def.kind === 'crumbling') {
        if (p.crumbleState === 'shaking') {
          p.group.visible = true;
          p.group.position.set(
            p.currentPos.x + Math.sin(realTime * 55) * 0.08,
            p.currentPos.y,
            p.currentPos.z + Math.cos(realTime * 48) * 0.08
          );
        } else if (p.crumbleState === 'fallen') {
          p.group.visible = false;
        } else {
          p.group.visible = true;
          p.group.position.set(p.currentPos.x, p.currentPos.y, p.currentPos.z);
        }
      }

      if (p.def.kind === 'bridge') {
        p.group.visible = p.active;
      }
    }

    for (const pt of portals) {
      for (const sm of pt.shaderMats) {
        sm.uniforms.uTime.value = worldTime;
      }
    }

    for (const col of collectibles) {
      if (col.collected) {
        col.group.visible = false;
        continue;
      }
      col.group.visible = true;
      col.group.rotation.y = realTime * 1.8;
      col.group.position.y = col.def.position.y + Math.sin(realTime * 2.6 + col.def.position.z) * 0.16;
    }

    for (const cp of checkpoints) {
      cp.ring.rotation.z = realTime * (cp.activated ? 2.4 : 0.7);
      cp.ring.position.y = 0.45 + Math.sin(realTime * 2.2) * 0.08;
    }

    for (const sw of switches) {
      const crystal = sw.group.children[1];
      if (crystal) crystal.rotation.y = realTime * 1.6;
    }

    finCore.rotation.y = realTime * 1.1;
    finCore.position.y = 2.0 + Math.sin(realTime * 2.0) * 0.18;
    finishRing.rotation.y = -realTime * 0.9;
    finishRing.rotation.x = Math.sin(realTime * 0.7) * 0.35;

    for (let i = 0; i < vistaRings.length; i++) {
      vistaRings[i].rotation.z = worldTime * (i % 2 === 0 ? 0.12 : -0.15);
    }
  };

  const dispose = () => {
    for (const d of disposables) {
      d.dispose();
    }
  };

  return {
    root,
    platforms,
    portals,
    checkpoints,
    collectibles,
    switches,
    finishGroup,
    finishRing,
    collidableMeshes,
    updateAnimations,
    dispose,
  };
}
