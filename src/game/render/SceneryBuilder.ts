import * as THREE from 'three';
import type { LevelDefinition, Vec3, WorldTheme } from '../types';
import type { ProceduralTextureSet } from './ProceduralTextures';
import { getWorldSceneryProfile } from './sceneryProfile';

export interface SceneryHandle {
  group: THREE.Group;
  update: (realTime: number, dt: number, playerPos: Vec3) => void;
  dispose: () => void;
}

function seededRand(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashLevelId(id: string): number {
  let h = 1337;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 1000003;
  }
  return h;
}

export function buildWorldScenery(
  level: LevelDefinition,
  theme: WorldTheme,
  textures: ProceduralTextureSet,
  shared: {
    matConcrete: THREE.MeshStandardMaterial;
    matSteel: THREE.MeshStandardMaterial;
    matWeatheredFrame: THREE.MeshStandardMaterial;
    matBarrier: THREE.MeshStandardMaterial;
    matStone: THREE.MeshStandardMaterial;
    matRollerYellow: THREE.MeshStandardMaterial;
  }
): SceneryHandle {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const rand = seededRand(hashLevelId(level.id));
  const profile = getWorldSceneryProfile(level.worldId, theme.sceneryStyle);
  const minZ = Math.min(-90, level.finishPosition.z - 45);
  const maxZ = 30;
  const spanZ = maxZ - minZ;

  // Compute safe ground corridor bounds from platforms so scenery never collides with playable decks
  const solidDecks = level.platforms.filter(
    (p) => p.kind === 'solid' && p.size.x >= 4 && p.size.z >= 5
  );

  // =========================================================================
  // 1. VALLEY / COASTAL / URBAN GROUND PLANE & MOUNTAIN RIDGES
  // =========================================================================
  const floorY = level.fallLimitY - 11;

  if (profile.hasRiverWater) {
    const waterMat = track(
      new THREE.MeshStandardMaterial({
        map: textures.waterAlbedo,
        color: theme.sceneryStyle === 'monsoon' ? '#36586b' : '#2f6c82',
        roughness: 0.18,
        metalness: 0.32,
      })
    );
    const water = new THREE.Mesh(track(new THREE.PlaneGeometry(760, 760)), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, floorY + 1.5, -55);
    group.add(water);
  } else {
    const terrainColor =
      theme.sceneryStyle === 'mountain'
        ? '#39473a'
        : theme.sceneryStyle === 'tunnel'
        ? '#1d1a17'
        : theme.sceneryStyle === 'pothole'
        ? '#4a3d33'
        : '#353a3d';
    const terrainMat = track(
      new THREE.MeshStandardMaterial({
        color: terrainColor,
        roughness: 0.95,
        metalness: 0.02,
      })
    );
    const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(760, 760)), terrainMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, floorY, -55);
    group.add(ground);
  }

  // Sculpted Mountain Ridges flanking the corridor (broad rolling Ghats/Aravalli silhouette)
  if (profile.hasMountainRidges) {
    const ridgeGeo = track(new THREE.CylinderGeometry(8.5, 42, 32, 12));
    const ridgeMat = track(
      new THREE.MeshStandardMaterial({
        map: textures.stoneAlbedo,
        bumpMap: textures.stoneBump,
        bumpScale: 0.05,
        color: theme.sceneryStyle === 'mountain' ? '#58695a' : '#665e56',
        roughness: 0.96,
      })
    );
    const count = 26;
    const ridgeInst = new THREE.InstancedMesh(ridgeGeo, ridgeMat, count);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const dist = 68 + rand() * 75;
      const z = maxZ + 12 - (i / count) * (spanZ + 90);
      const sx = 0.85 + rand() * 1.15;
      const sy = 0.55 + rand() * 0.95;
      dummy.position.set(side * dist, floorY + 13 * sy, z);
      dummy.rotation.set(0, rand() * Math.PI, 0);
      dummy.scale.set(sx, sy, sx * (0.95 + rand() * 0.45));
      dummy.updateMatrix();
      ridgeInst.setMatrixAt(i, dummy.matrix);
      tint.setHSL(0.28 + (rand() - 0.5) * 0.06, 0.12, 0.42 + rand() * 0.14);
      ridgeInst.setColorAt(i, tint);
    }
    ridgeInst.computeBoundingSphere();
    group.add(ridgeInst);
  }

  // Urban Indian City Skyline (apartments, water tanks, sunlit stucco)
  if (profile.hasCitySkyline) {
    const bldgGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const bldgMat = track(
      new THREE.MeshStandardMaterial({
        map: textures.buildingFacadeAlbedo,
        roughness: 0.82,
        metalness: 0.06,
      })
    );
    const bldgCount = 34;
    const cityInst = new THREE.InstancedMesh(bldgGeo, bldgMat, bldgCount);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    for (let i = 0; i < bldgCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (36 + rand() * 56);
      const z = maxZ + 8 - (i / bldgCount) * (spanZ + 65);
      const w = 7 + rand() * 8;
      const h = 18 + rand() * 34;
      const d = 7 + rand() * 8;
      dummy.position.set(x, floorY + h * 0.5, z);
      dummy.rotation.set(0, (rand() - 0.5) * 0.25, 0);
      dummy.scale.set(w, h, d);
      dummy.updateMatrix();
      cityInst.setMatrixAt(i, dummy.matrix);
      const v = 0.72 + rand() * 0.28;
      tint.setRGB(v, v * (0.96 + rand() * 0.04), v * 0.93);
      cityInst.setColorAt(i, tint);
    }
    cityInst.computeBoundingSphere();
    group.add(cityInst);
  }

  // =========================================================================
  // 2. ROADSIDE CHAI & DHABA STALLS, MILESTONES & STREETLIGHTS
  // =========================================================================
  const chaiMat = track(
    new THREE.MeshStandardMaterial({ map: textures.chaiSignAlbedo, roughness: 0.55 })
  );
  const milestoneMat = track(
    new THREE.MeshStandardMaterial({ map: textures.milestoneAlbedo, roughness: 0.75 })
  );
  const woodMat = track(
    new THREE.MeshStandardMaterial({ color: '#6b492b', roughness: 0.88 })
  );
  const tinRoofMat = track(
    new THREE.MeshStandardMaterial({ color: '#5b6673', roughness: 0.52, metalness: 0.62 })
  );
  const lampBulbMat = track(
    new THREE.MeshStandardMaterial({
      color: '#ffdf9a',
      emissive: '#ffba52',
      emissiveIntensity: 1.1,
    })
  );

  // Place roadside Chai Stalls & Yellow/White KM Milestones anchored safely on wide solid decks
  const milestoneGeo = track(new THREE.BoxGeometry(0.45, 0.85, 0.24));
  const poleGeo = track(new THREE.CylinderGeometry(0.08, 0.11, 5.4, 8));
  const armGeo = track(new THREE.BoxGeometry(1.6, 0.1, 0.1));
  const lampHeadGeo = track(new THREE.BoxGeometry(0.48, 0.12, 0.26));

  let chaiPlaced = 0;
  for (let i = 0; i < solidDecks.length; i++) {
    const deck = solidDecks[i];
    const topY = deck.position.y + deck.size.y * 0.5;
    const edgeSide = i % 2 === 0 ? -1 : 1;

    // Yellow-white NH Kilometer Milestone every 2nd wide deck
    if (deck.size.x >= 5.5 && i % 2 === 0) {
      const ms = new THREE.Mesh(milestoneGeo, milestoneMat);
      ms.position.set(
        deck.position.x + edgeSide * (deck.size.x * 0.5 - 0.55),
        topY + 0.42,
        deck.position.z - deck.size.z * 0.25
      );
      group.add(ms);
    }

    // Highway Streetlight Pole on deck shoulders
    if (profile.hasStreetlights && deck.size.x >= 5.5 && i % 2 === 1) {
      const poleGroup = new THREE.Group();
      const px = deck.position.x + edgeSide * (deck.size.x * 0.5 - 0.42);
      poleGroup.position.set(px, topY, deck.position.z);
      const pole = new THREE.Mesh(poleGeo, shared.matSteel);
      pole.position.y = 2.7;
      const arm = new THREE.Mesh(armGeo, shared.matSteel);
      arm.position.set(-edgeSide * 0.72, 5.35, 0);
      const lamp = new THREE.Mesh(lampHeadGeo, lampBulbMat);
      lamp.position.set(-edgeSide * 1.35, 5.26, 0);
      poleGroup.add(pole, arm, lamp);
      group.add(poleGroup);
    }

    // Hero Roadside Chai / Dhaba Stall on an extra-wide urban/highway shoulder
    if (profile.hasChaiStalls && deck.size.x >= 7.5 && chaiPlaced < 2 && i > 0) {
      chaiPlaced++;
      const stall = new THREE.Group();
      const sx = deck.position.x + edgeSide * (deck.size.x * 0.5 + 1.65);
      stall.position.set(sx, topY - 0.25, deck.position.z);
      stall.rotation.y = edgeSide > 0 ? -Math.PI / 2 : Math.PI / 2;

      const plinth = new THREE.Mesh(track(new THREE.BoxGeometry(3.4, 0.5, 2.2)), shared.matConcrete);
      plinth.position.y = 0.25;
      const counter = new THREE.Mesh(track(new THREE.BoxGeometry(3.0, 0.95, 0.85)), woodMat);
      counter.position.set(0, 0.95, 0.55);
      const backWall = new THREE.Mesh(track(new THREE.BoxGeometry(3.1, 2.2, 0.16)), shared.matConcrete);
      backWall.position.set(0, 1.6, -0.92);
      const awning = new THREE.Mesh(track(new THREE.BoxGeometry(3.55, 0.12, 2.65)), tinRoofMat);
      awning.position.set(0, 2.75, 0.15);
      awning.rotation.x = 0.16;
      const fascia = new THREE.Mesh(track(new THREE.BoxGeometry(3.1, 0.72, 0.12)), chaiMat);
      fascia.position.set(0, 2.95, 1.15);
      // Support pier underneath so stall never floats over open space
      const stallPier = new THREE.Mesh(track(new THREE.BoxGeometry(3.2, 26, 2.0)), shared.matConcrete);
      stallPier.position.y = -13;

      stall.add(plinth, counter, backWall, awning, fascia, stallPier);
      group.add(stall);
    }
  }

  // =========================================================================
  // 3. ORGANIC MULTI-CLUSTER TREES / COASTAL PALMS GROUNDED ON HILLS & TERRAIN
  // =========================================================================
  const trunkMat = track(new THREE.MeshStandardMaterial({ color: '#583d26', roughness: 0.92 }));
  const earthHillMat = track(
    new THREE.MeshStandardMaterial({
      color: theme.sceneryStyle === 'monsoon' ? '#364d36' : '#4a543c',
      roughness: 0.95,
    })
  );
  const leafColorA =
    theme.sceneryStyle === 'mountain'
      ? '#345e3d'
      : theme.sceneryStyle === 'monsoon'
      ? '#2d6844'
      : '#426f36';
  const leafColorB =
    theme.sceneryStyle === 'mountain'
      ? '#447249'
      : theme.sceneryStyle === 'monsoon'
      ? '#3b7d54'
      : '#558442';
  const leafMatA = track(new THREE.MeshStandardMaterial({ color: leafColorA, roughness: 0.88 }));
  const leafMatB = track(new THREE.MeshStandardMaterial({ color: leafColorB, roughness: 0.86 }));

  if (!profile.hasTunnelVault) {
    const treeCount = 14;
    const trunkGeo = track(new THREE.CylinderGeometry(0.24, 0.48, 5.2, 8));
    const branchGeo = track(new THREE.CylinderGeometry(0.12, 0.2, 2.2, 6));
    const foliageGeo = track(new THREE.IcosahedronGeometry(1.75, 1));
    const hillGeo = track(new THREE.ConeGeometry(8.5, 9.0, 9));

    for (let i = 0; i < treeCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const zPos = 4 - (i / treeCount) * (spanZ + 28);
      const xPos = side * (17.5 + (i % 3) * 4.5 + rand() * 3.0);
      const hillHeightScale = 0.75 + rand() * 0.65;
      const treeBaseY = floorY + 5.2 * hillHeightScale;

      const tree = new THREE.Group();
      tree.position.set(xPos, floorY, zPos);

      // Broad sloping earthen hillock rising naturally from valley ground
      const hill = new THREE.Mesh(hillGeo, earthHillMat);
      hill.position.y = 4.2 * hillHeightScale;
      hill.scale.set(1.0 + rand() * 0.35, hillHeightScale, 1.0 + rand() * 0.35);
      hill.rotation.y = rand() * Math.PI;
      tree.add(hill);

      const canopyRoot = new THREE.Group();
      canopyRoot.position.y = treeBaseY - floorY;

      if (profile.hasPalms) {
        const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.18, 0.32, 7.6, 8)), trunkMat);
        trunk.position.y = 3.7;
        trunk.rotation.z = side * -0.15;
        canopyRoot.add(trunk);

        const frondGeo = track(new THREE.BoxGeometry(3.1, 0.08, 0.72));
        for (let f = 0; f < 7; f++) {
          const ang = (f / 7) * Math.PI * 2;
          const frond = new THREE.Mesh(frondGeo, f % 2 === 0 ? leafMatA : leafMatB);
          frond.position.set(
            side * 0.56 + Math.cos(ang) * 1.3,
            7.35,
            Math.sin(ang) * 1.3
          );
          frond.rotation.y = -ang;
          frond.rotation.z = -0.32;
          canopyRoot.add(frond);
        }
      } else {
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.y = 2.4;
        const b1 = new THREE.Mesh(branchGeo, trunkMat);
        b1.position.set(0.65, 4.3, 0.25);
        b1.rotation.z = -0.58;
        const b2 = new THREE.Mesh(branchGeo, trunkMat);
        b2.position.set(-0.6, 4.1, -0.3);
        b2.rotation.z = 0.55;

        const cMain = new THREE.Mesh(foliageGeo, leafMatA);
        cMain.position.set(0, 5.6, 0);
        cMain.scale.set(1.35, 0.95, 1.25);
        const cSideA = new THREE.Mesh(foliageGeo, leafMatB);
        cSideA.position.set(1.35, 5.0, 0.65);
        cSideA.scale.set(0.9, 0.78, 0.88);
        const cSideB = new THREE.Mesh(foliageGeo, leafMatA);
        cSideB.position.set(-1.25, 5.1, -0.55);
        cSideB.scale.set(0.92, 0.8, 0.9);
        const cTop = new THREE.Mesh(foliageGeo, leafMatB);
        cTop.position.set(0.15, 6.75, -0.15);
        cTop.scale.set(0.85, 0.75, 0.85);
        canopyRoot.add(trunk, b1, b2, cMain, cSideA, cSideB, cTop);
      }

      tree.add(canopyRoot);
      group.add(tree);
    }
  }

  // =========================================================================
  // 4. WORLD-SPECIFIC HERO ARCHITECTURE (Toll Plaza, Cable Bridge, Tunnel, Flyovers, Cranes)
  // =========================================================================
  const fanRotors: THREE.Group[] = [];

  if (profile.hasTollPlaza) {
    // NHAI Toll Plaza Overhead Canopy midway through Highway Hustle
    const tollZ = Math.round((level.spawn.z + level.finishPosition.z) * 0.5);
    const toll = new THREE.Group();
    toll.position.set(0, 0, tollZ);
    const canopyMat = track(
      new THREE.MeshStandardMaterial({ color: '#135a32', roughness: 0.48, metalness: 0.15 })
    );
    const roof = new THREE.Mesh(track(new THREE.BoxGeometry(19, 1.15, 5.2)), canopyMat);
    roof.position.y = 8.4;
    const fasciaTrim = new THREE.Mesh(track(new THREE.BoxGeometry(19.2, 0.28, 5.35)), shared.matRollerYellow);
    fasciaTrim.position.y = 7.78;
    const colGeo = track(new THREE.BoxGeometry(0.9, 18, 1.4));
    for (const cx of [-8.4, 8.4]) {
      const col = new THREE.Mesh(colGeo, shared.matConcrete);
      col.position.set(cx, -0.5, 0);
      toll.add(col);
    }
    toll.add(roof, fasciaTrim);
    group.add(toll);
  }

  if (profile.hasCablePylons) {
    // Towering Red/White Cable-Stayed Bridge Pylons with Diagonal Tension Cables
    const pylonMat = track(
      new THREE.MeshStandardMaterial({ color: '#c43b2c', roughness: 0.55, metalness: 0.25 })
    );
    const cableMat = track(
      new THREE.MeshStandardMaterial({ color: '#cfd6e0', roughness: 0.35, metalness: 0.75 })
    );
    for (const pz of [-22, -62]) {
      const pylon = new THREE.Group();
      pylon.position.set(0, 0, pz);
      const legGeo = track(new THREE.BoxGeometry(1.1, 36, 1.3));
      const legL = new THREE.Mesh(legGeo, pylonMat);
      legL.position.set(-8.5, 6, 0);
      const legR = new THREE.Mesh(legGeo, pylonMat);
      legR.position.set(8.5, 6, 0);
      const crossTop = new THREE.Mesh(track(new THREE.BoxGeometry(18.2, 1.2, 1.3)), shared.matConcrete);
      crossTop.position.set(0, 22, 0);
      pylon.add(legL, legR, crossTop);

      // Diagonal stay cables
      const cableGeo = track(new THREE.CylinderGeometry(0.055, 0.055, 22, 6));
      for (const sx of [-8.2, 8.2]) {
        for (const dz of [-1, 1]) {
          const cable = new THREE.Mesh(cableGeo, cableMat);
          cable.position.set(sx * 0.92, 12.5, dz * 7.5);
          cable.rotation.x = dz * 0.65;
          pylon.add(cable);
        }
      }
      group.add(pylon);
    }
  }

  if (profile.hasTunnelVault) {
    // Subterranean Tunnel Ribbed Arch Vaults, Wall Sconces & Spinning Jet Fans
    const vaultMat = track(
      new THREE.MeshStandardMaterial({
        map: textures.concreteAlbedo,
        color: '#46433f',
        roughness: 0.92,
      })
    );
    const fanBladeGeo = track(new THREE.BoxGeometry(1.4, 0.12, 0.28));
    for (let z = 6; z >= minZ; z -= 14) {
      const arch = new THREE.Mesh(
        track(new THREE.TorusGeometry(12.2, 0.85, 8, 22, Math.PI)),
        vaultMat
      );
      arch.position.set(0, -0.5, z);
      group.add(arch);

      for (const sx of [-10.8, 10.8]) {
        const sconce = new THREE.Mesh(
          track(new THREE.BoxGeometry(0.45, 0.35, 1.1)),
          lampBulbMat
        );
        sconce.position.set(sx, 5.2, z);
        group.add(sconce);
      }

      if (Math.abs(z) % 28 === 6) {
        const fanHousing = new THREE.Group();
        fanHousing.position.set(0, 10.6, z);
        const shroud = new THREE.Mesh(
          track(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 14, 1, true)),
          shared.matSteel
        );
        shroud.rotation.x = Math.PI / 2;
        const rotor = new THREE.Group();
        const b1 = new THREE.Mesh(fanBladeGeo, shared.matRollerYellow);
        const b2 = new THREE.Mesh(fanBladeGeo, shared.matRollerYellow);
        b2.rotation.z = Math.PI / 2;
        rotor.add(b1, b2);
        fanHousing.add(shroud, rotor);
        group.add(fanHousing);
        fanRotors.push(rotor);
      }
    }
  }

  if (profile.hasCrossFlyovers) {
    // Multi-tier Crossing Concrete Flyover Decks high above & below main track
    for (const [fy, fz, rotY] of [[15, -34, 0.24], [-9, -58, -0.22]]) {
      const span = new THREE.Group();
      span.position.set(0, fy, fz);
      span.rotation.y = rotY;
      const deck = new THREE.Mesh(track(new THREE.BoxGeometry(92, 1.3, 6.2)), shared.matConcrete);
      const curbA = new THREE.Mesh(track(new THREE.BoxGeometry(92, 0.65, 0.35)), shared.matBarrier);
      curbA.position.set(0, 0.95, 2.9);
      const curbB = curbA.clone();
      curbB.position.z = -2.9;
      const pierA = new THREE.Mesh(track(new THREE.BoxGeometry(2.0, 34, 2.0)), shared.matConcrete);
      pierA.position.set(-28, -17, 0);
      const pierB = pierA.clone();
      pierB.position.x = 28;
      span.add(deck, curbA, curbB, pierA, pierB);
      group.add(span);
    }
  }

  if (profile.hasMegaCranes) {
    // Detailed Lattice Construction Tower Cranes (4-chord mast, cab, cathead, cables, trolley & hook)
    const craneMat = track(
      new THREE.MeshStandardMaterial({ color: '#d87a1c', roughness: 0.45, metalness: 0.35 })
    );
    const cabGlassMat = track(
      new THREE.MeshStandardMaterial({ color: '#1b2634', roughness: 0.15, metalness: 0.45 })
    );
    const cableGeo = track(new THREE.CylinderGeometry(0.04, 0.04, 15.2, 5));
    const chordGeo = track(new THREE.BoxGeometry(0.22, 34, 0.22));
    const braceGeo = track(new THREE.BoxGeometry(1.45, 0.14, 1.45));

    for (const [cx, cz, yaw] of [[-19, -28, 0.45], [21, -68, -2.5]]) {
      const crane = new THREE.Group();
      crane.position.set(cx, floorY, cz);
      crane.rotation.y = yaw;

      // Grounded concrete footing
      const plinth = new THREE.Mesh(track(new THREE.BoxGeometry(3.4, 2.2, 3.4)), shared.matConcrete);
      plinth.position.y = 1.1;
      crane.add(plinth);

      // 4-Chord open lattice mast
      for (const mx of [-0.62, 0.62]) {
        for (const mz of [-0.62, 0.62]) {
          const chord = new THREE.Mesh(chordGeo, craneMat);
          chord.position.set(mx, 19, mz);
          crane.add(chord);
        }
      }
      for (let by = 5; by <= 33; by += 4) {
        const brace = new THREE.Mesh(braceGeo, craneMat);
        brace.position.y = by;
        crane.add(brace);
      }

      // Operator Cabin + Apex Cathead + Jib + Counterweight + Stay Cables
      const cab = new THREE.Mesh(track(new THREE.BoxGeometry(1.8, 2.0, 1.8)), cabGlassMat);
      cab.position.set(1.2, 34.4, 0.8);
      const jib = new THREE.Mesh(track(new THREE.BoxGeometry(27, 0.95, 1.1)), craneMat);
      jib.position.set(6.2, 36.2, 0);
      const cathead = new THREE.Mesh(track(new THREE.ConeGeometry(0.9, 4.2, 4)), craneMat);
      cathead.position.set(0, 38.4, 0);
      cathead.rotation.y = Math.PI / 4;
      const counterweight = new THREE.Mesh(track(new THREE.BoxGeometry(4.2, 2.1, 1.9)), shared.matConcrete);
      counterweight.position.set(-5.8, 36.0, 0);

      const frontStay = new THREE.Mesh(cableGeo, shared.matSteel);
      frontStay.position.set(7.5, 38.2, 0);
      frontStay.rotation.z = 1.32;
      const backStay = new THREE.Mesh(track(new THREE.CylinderGeometry(0.04, 0.04, 8.2, 5)), shared.matSteel);
      backStay.position.set(-3.4, 38.2, 0);
      backStay.rotation.z = -1.05;

      // Trolley, hoist cable & hook block
      const trolley = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.55, 1.2)), shared.matSteel);
      trolley.position.set(13.5, 35.4, 0);
      const hoistWire = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.03, 7.5, 5)), shared.matSteel);
      hoistWire.position.set(13.5, 31.6, 0);
      const hookBlock = new THREE.Mesh(track(new THREE.BoxGeometry(0.65, 0.75, 0.45)), shared.matRollerYellow);
      hookBlock.position.set(13.5, 27.8, 0);

      crane.add(
        cab,
        jib,
        cathead,
        counterweight,
        frontStay,
        backStay,
        trolley,
        hoistWire,
        hookBlock
      );
      group.add(crane);
    }
  }

  if (profile.hasFestiveBunting) {
    // Ceremonial Marigold & Tricolor Pennant String over Finish Arch
    const flagColors = ['#e87a24', '#f2efe9', '#2b8a4b', '#f5b832'];
    const flagGeo = track(new THREE.ConeGeometry(0.18, 0.42, 4));
    for (let f = -6; f <= 6; f++) {
      const mat = track(
        new THREE.MeshStandardMaterial({
          color: flagColors[Math.abs(f) % flagColors.length],
          roughness: 0.65,
        })
      );
      const flag = new THREE.Mesh(flagGeo, mat);
      const sag = Math.cos((f / 6) * (Math.PI * 0.5)) * 0.45;
      flag.position.set(
        level.finishPosition.x + f * 0.45,
        level.finishPosition.y + 4.35 - (0.45 - sag),
        level.finishPosition.z + 0.25
      );
      flag.rotation.x = Math.PI;
      group.add(flag);
    }
  }

  // =========================================================================
  // 5. ATMOSPHERIC RAIN & GOLDEN CONSTRUCTION DUST MOTES
  // =========================================================================
  let rainMesh: THREE.InstancedMesh | null = null;
  const rainCount = theme.rainIntensity > 0 ? Math.round(160 * theme.rainIntensity) : 0;
  const rainOffsets: Vec3[] = [];
  if (rainCount > 0) {
    const rainGeo = track(new THREE.BoxGeometry(0.03, 1.45, 0.03));
    const rainMat = track(
      new THREE.MeshBasicMaterial({ color: '#b8d8f0', transparent: true, opacity: 0.48 })
    );
    rainMesh = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
    rainMesh.frustumCulled = false;
    for (let i = 0; i < rainCount; i++) {
      rainOffsets.push({
        x: ((i * 37) % 36) - 18,
        y: (i * 53) % 24,
        z: ((i * 71) % 36) - 18,
      });
    }
    group.add(rainMesh);
  }

  let dustMesh: THREE.InstancedMesh | null = null;
  const dustCount = profile.hasDustHaze ? 55 : 0;
  const dustOffsets: Vec3[] = [];
  if (dustCount > 0) {
    const dustGeo = track(new THREE.SphereGeometry(0.055, 5, 5));
    const dustMat = track(
      new THREE.MeshBasicMaterial({
        color: '#f5d298',
        transparent: true,
        opacity: 0.36,
      })
    );
    dustMesh = new THREE.InstancedMesh(dustGeo, dustMat, dustCount);
    dustMesh.frustumCulled = false;
    for (let i = 0; i < dustCount; i++) {
      dustOffsets.push({
        x: ((i * 43) % 30) - 15,
        y: ((i * 29) % 10) - 2,
        z: ((i * 61) % 30) - 15,
      });
    }
    group.add(dustMesh);
  }

  const dummy = new THREE.Object3D();

  const update = (realTime: number, dt: number, playerPos: Vec3) => {
    for (const r of fanRotors) {
      r.rotation.z += dt * 7.5;
    }

    if (rainMesh) {
      for (let i = 0; i < rainOffsets.length; i++) {
        const ro = rainOffsets[i];
        ro.y -= 28 * dt;
        ro.x -= 2.2 * dt;
        if (ro.y < -4) ro.y += 24;
        if (ro.x < -18) ro.x += 36;
        dummy.position.set(playerPos.x + ro.x, playerPos.y + ro.y, playerPos.z + ro.z);
        dummy.rotation.set(0, 0, 0.12);
        dummy.updateMatrix();
        rainMesh.setMatrixAt(i, dummy.matrix);
      }
      rainMesh.instanceMatrix.needsUpdate = true;
    }

    if (dustMesh) {
      for (let i = 0; i < dustOffsets.length; i++) {
        const d = dustOffsets[i];
        const driftX = Math.sin(realTime * 0.7 + i) * 0.8;
        const driftY = Math.cos(realTime * 0.55 + i * 0.6) * 0.4;
        dummy.position.set(playerPos.x + d.x + driftX, playerPos.y + d.y + driftY, playerPos.z + d.z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        dustMesh.setMatrixAt(i, dummy.matrix);
      }
      dustMesh.instanceMatrix.needsUpdate = true;
    }
  };

  return {
    group,
    update,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
