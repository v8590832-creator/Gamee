import * as THREE from 'three';
import { FOOTWEAR_CATALOG, HEADWEAR_CATALOG, KURTA_CATALOG } from '../data/catalog';
import type { CharacterLoadout } from '../types';

export interface CharacterRig {
  root: THREE.Group;
  rigBody: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  eyelidL: THREE.Mesh;
  eyelidR: THREE.Mesh;
  mouth: THREE.Mesh;
  armL: THREE.Group;
  forearmL: THREE.Group;
  armR: THREE.Group;
  forearmR: THREE.Group;
  legL: THREE.Group;
  shinL: THREE.Group;
  legR: THREE.Group;
  shinR: THREE.Group;
  kurtaSkirt: THREE.Mesh;
  surgeAura: THREE.Mesh;
  contactShadow: THREE.Mesh;
  applyLoadout: (loadout: CharacterLoadout) => void;
  triggerImpactShockwave: (colorHex: string, scale?: number) => void;
  updateShockwave: (dt: number) => void;
  dispose: () => void;
}

export function createCharacterRig(
  initialLoadout: CharacterLoadout,
  contactShadowTex: THREE.Texture
): CharacterRig {
  const root = new THREE.Group();
  const rigBody = new THREE.Group();
  // Physics sphere radius is 0.55; rig feet sit at y = -0.55 relative to root
  rigBody.position.y = 0.245;
  root.add(rigBody);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const kurtaDef = KURTA_CATALOG[initialLoadout.kurta] ?? KURTA_CATALOG.ivory;
  const footDef = FOOTWEAR_CATALOG[initialLoadout.footwear] ?? FOOTWEAR_CATALOG.mojari;

  // Materials
  const skinMat = track(
    new THREE.MeshStandardMaterial({
      color: '#d49d76',
      roughness: 0.62,
      metalness: 0.02,
    })
  );
  const hairMat = track(
    new THREE.MeshStandardMaterial({
      color: '#b9c0c9',
      roughness: 0.78,
      metalness: 0.05,
    })
  );
  const kurtaMat = track(
    new THREE.MeshStandardMaterial({
      color: kurtaDef.primaryColor,
      roughness: 0.76,
      metalness: 0.04,
    })
  );
  const trouserMat = track(
    new THREE.MeshStandardMaterial({
      color: kurtaDef.secondaryColor ?? '#252932',
      roughness: 0.72,
      metalness: 0.05,
    })
  );
  const shoeMat = track(
    new THREE.MeshStandardMaterial({
      color: footDef.primaryColor,
      roughness: 0.48,
      metalness: 0.12,
    })
  );
  const frameMat = track(
    new THREE.MeshStandardMaterial({
      color: '#c8d0db',
      metalness: 0.85,
      roughness: 0.22,
    })
  );
  const shadeLensMat = track(
    new THREE.MeshStandardMaterial({
      color: '#1b222c',
      metalness: 0.4,
      roughness: 0.15,
      transparent: true,
      opacity: 0.22,
    })
  );
  const eyeWhiteMat = track(new THREE.MeshBasicMaterial({ color: '#f8fafc' }));
  const pupilMat = track(new THREE.MeshBasicMaterial({ color: '#1b1d21' }));

  // -------------------------------------------------------------------------
  // HIPS & TORSO (Traditional Indian Kurta Tunic)
  // -------------------------------------------------------------------------
  const hips = new THREE.Group();
  rigBody.add(hips);

  const pelvisMesh = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 0.18, 0.26)), trouserMat);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  // Main Kurta Chest & Waist
  const chestMesh = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.24, 0.26, 0.56, 12)),
    kurtaMat
  );
  chestMesh.scale.set(1.08, 1, 0.76);
  chestMesh.position.y = 0.28;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Kurta Lower Skirt Flare
  const kurtaSkirt = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.26, 0.30, 0.28, 12)),
    kurtaMat
  );
  kurtaSkirt.scale.set(1.08, 1, 0.78);
  kurtaSkirt.position.y = -0.05;
  kurtaSkirt.castShadow = true;
  torso.add(kurtaSkirt);

  // Nehru Collar & Front Button Placket
  const collar = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.115, 0.125, 0.07, 12)),
    kurtaMat
  );
  collar.position.y = 0.58;
  torso.add(collar);

  const placket = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.055, 0.24, 0.025)),
    kurtaMat
  );
  placket.position.set(0, 0.44, 0.19);
  torso.add(placket);

  const btnGeo = track(new THREE.SphereGeometry(0.012, 6, 6));
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(btnGeo, frameMat);
    btn.position.set(0, 0.51 - i * 0.065, 0.205);
    torso.add(btn);
  }

  // -------------------------------------------------------------------------
  // HEAD, FACE, GLASSES, HAIR & HEADWEAR ACCESSORIES
  // -------------------------------------------------------------------------
  const head = new THREE.Group();
  head.position.y = 0.62;
  torso.add(head);

  const neck = new THREE.Mesh(track(new THREE.CylinderGeometry(0.08, 0.095, 0.1, 10)), skinMat);
  neck.position.y = 0.02;
  head.add(neck);

  // Sculpted stylized head
  const cranium = new THREE.Mesh(track(new THREE.SphereGeometry(0.22, 18, 16)), skinMat);
  cranium.scale.set(0.95, 1.08, 0.98);
  cranium.position.y = 0.22;
  cranium.castShadow = true;
  head.add(cranium);

  // Ears
  const earGeo = track(new THREE.SphereGeometry(0.045, 8, 8));
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.scale.set(0.5, 1.1, 0.8);
  earL.position.set(-0.21, 0.21, 0);
  const earR = earL.clone();
  earR.position.x = 0.21;
  head.add(earL, earR);

  // Nose
  const nose = new THREE.Mesh(track(new THREE.BoxGeometry(0.045, 0.08, 0.06)), skinMat);
  nose.position.set(0, 0.21, 0.21);
  head.add(nose);

  // Eyes + Pupils + Blinking Eyelids
  const eyeGeo = track(new THREE.SphereGeometry(0.032, 8, 8));
  const pupilGeo = track(new THREE.SphereGeometry(0.017, 8, 8));
  const lidGeo = track(new THREE.BoxGeometry(0.068, 0.015, 0.04));

  const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeL.position.set(-0.075, 0.25, 0.185);
  const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
  pupilL.position.set(-0.075, 0.25, 0.21);
  const eyelidL = new THREE.Mesh(lidGeo, skinMat);
  eyelidL.position.set(-0.075, 0.275, 0.195);

  const eyeR = eyeL.clone();
  eyeR.position.x = 0.075;
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.075;
  const eyelidR = eyelidL.clone();
  eyelidR.position.x = 0.075;

  // Eyebrows (silver-grey expressive)
  const browGeo = track(new THREE.BoxGeometry(0.075, 0.02, 0.025));
  const browL = new THREE.Mesh(browGeo, hairMat);
  browL.position.set(-0.078, 0.305, 0.195);
  browL.rotation.z = 0.06;
  const browR = browL.clone();
  browR.position.x = 0.078;
  browR.rotation.z = -0.06;

  // Smile / Expression Mouth
  const mouth = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.085, 0.02, 0.02)),
    track(new THREE.MeshBasicMaterial({ color: '#7a3f32' }))
  );
  mouth.position.set(0, 0.135, 0.198);

  head.add(eyeL, pupilL, eyelidL, eyeR, pupilR, eyelidR, browL, browR, mouth);

  // Signature Swept Silver-Grey Hair
  const hairTop = new THREE.Mesh(track(new THREE.SphereGeometry(0.225, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56)), hairMat);
  hairTop.scale.set(0.98, 1.06, 1.02);
  hairTop.position.set(0, 0.245, -0.015);
  hairTop.rotation.x = -0.22;
  const hairBack = new THREE.Mesh(track(new THREE.BoxGeometry(0.36, 0.18, 0.18)), hairMat);
  hairBack.position.set(0, 0.21, -0.14);
  const sideburnL = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, 0.12, 0.07)), hairMat);
  sideburnL.position.set(-0.195, 0.22, 0.03);
  const sideburnR = sideburnL.clone();
  sideburnR.position.x = 0.195;
  head.add(hairTop, hairBack, sideburnL, sideburnR);

  // Signature Rectangular Glasses
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.25, 0.222);
  const rimGeo = track(new THREE.BoxGeometry(0.095, 0.058, 0.014));
  const rimFrameGeo = track(new THREE.TorusGeometry(0.048, 0.006, 6, 16));
  const lensL = new THREE.Mesh(rimGeo, shadeLensMat);
  lensL.position.x = -0.075;
  const lensR = new THREE.Mesh(rimGeo, shadeLensMat);
  lensR.position.x = 0.075;
  const frameL = new THREE.Mesh(rimFrameGeo, frameMat);
  frameL.scale.set(1.1, 0.72, 1);
  frameL.position.x = -0.075;
  const frameR = frameL.clone();
  frameR.position.x = 0.075;
  const bridge = new THREE.Mesh(track(new THREE.BoxGeometry(0.05, 0.01, 0.012)), frameMat);
  glassesGroup.add(lensL, lensR, frameL, frameR, bridge);
  head.add(glassesGroup);

  // Optional Headwear Meshes (toggled by loadout)
  const hardHatGroup = new THREE.Group();
  const hatDome = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.245, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.52)),
    track(new THREE.MeshStandardMaterial({ color: '#f2b824', roughness: 0.35, metalness: 0.1 }))
  );
  hatDome.position.y = 0.28;
  const hatBrim = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.26, 0.27, 0.03, 16)),
    hatDome.material
  );
  hatBrim.position.set(0, 0.28, 0.04);
  hardHatGroup.add(hatDome, hatBrim);
  hardHatGroup.visible = false;
  head.add(hardHatGroup);

  const gandhiCap = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.22, 0.12, 0.36)),
    track(new THREE.MeshStandardMaterial({ color: '#f5f2eb', roughness: 0.8 }))
  );
  gandhiCap.position.set(0, 0.42, 0);
  gandhiCap.visible = false;
  head.add(gandhiCap);

  const turbanGroup = new THREE.Group();
  const turbanMat = track(new THREE.MeshStandardMaterial({ color: '#e87722', roughness: 0.65 }));
  const turbanRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.22, 0.075, 10, 20)), turbanMat);
  turbanRing.rotation.x = Math.PI / 2;
  turbanRing.position.y = 0.35;
  const turbanCrest = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.08, 0.16, 8)),
    track(new THREE.MeshStandardMaterial({ color: '#f5c249', roughness: 0.4, metalness: 0.3 }))
  );
  turbanCrest.position.set(0.04, 0.45, 0.16);
  turbanGroup.add(turbanRing, turbanCrest);
  turbanGroup.visible = false;
  head.add(turbanGroup);

  // -------------------------------------------------------------------------
  // ARMS & HANDS (Kurta Sleeves + Forearms + Sculpted Hands)
  // -------------------------------------------------------------------------
  const upperArmGeo = track(new THREE.CylinderGeometry(0.068, 0.062, 0.26, 8));
  const forearmGeo = track(new THREE.CylinderGeometry(0.056, 0.048, 0.24, 8));
  const handGeo = track(new THREE.SphereGeometry(0.055, 8, 8));

  const buildArm = (side: -1 | 1): [THREE.Group, THREE.Group] => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.3, 0.50, 0);
    const upper = new THREE.Mesh(upperArmGeo, kurtaMat);
    upper.position.y = -0.12;
    upper.castShadow = true;
    arm.add(upper);

    const forearm = new THREE.Group();
    forearm.position.y = -0.25;
    const foreMesh = new THREE.Mesh(forearmGeo, kurtaMat);
    foreMesh.position.y = -0.11;
    foreMesh.castShadow = true;
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.scale.set(0.9, 1.15, 0.7);
    hand.position.y = -0.24;
    forearm.add(foreMesh, hand);
    arm.add(forearm);

    torso.add(arm);
    return [arm, forearm];
  };

  const [armL, forearmL] = buildArm(-1);
  const [armR, forearmR] = buildArm(1);

  // -------------------------------------------------------------------------
  // LEGS & FOOTWEAR (Trousers + Shoes)
  // -------------------------------------------------------------------------
  const thighGeo = track(new THREE.CylinderGeometry(0.085, 0.072, 0.34, 8));
  const shinGeo = track(new THREE.CylinderGeometry(0.07, 0.058, 0.34, 8));
  const shoeGeo = track(new THREE.BoxGeometry(0.12, 0.09, 0.24));

  const buildLeg = (side: -1 | 1): [THREE.Group, THREE.Group] => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.12, -0.05, 0);
    const thigh = new THREE.Mesh(thighGeo, trouserMat);
    thigh.position.y = -0.16;
    thigh.castShadow = true;
    leg.add(thigh);

    const shin = new THREE.Group();
    shin.position.y = -0.34;
    const shinMesh = new THREE.Mesh(shinGeo, trouserMat);
    shinMesh.position.y = -0.16;
    shinMesh.castShadow = true;
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.36, 0.045);
    shoe.castShadow = true;
    shin.add(shinMesh, shoe);
    leg.add(shin);

    hips.add(leg);
    return [leg, shin];
  };

  const [legL, shinL] = buildLeg(-1);
  const [legR, shinR] = buildLeg(1);

  // -------------------------------------------------------------------------
  // SPECIAL SURGE AURA & GROUND SHADOW / SHOCKWAVE
  // -------------------------------------------------------------------------
  const surgeMat = track(
    new THREE.MeshBasicMaterial({
      color: '#f5b841',
      transparent: true,
      opacity: 0,
      wireframe: true,
    })
  );
  const surgeAura = new THREE.Mesh(track(new THREE.TorusGeometry(0.72, 0.04, 8, 24)), surgeMat);
  surgeAura.rotation.x = Math.PI / 2;
  surgeAura.position.y = -0.35;
  root.add(surgeAura);

  const shadowMat = track(
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    })
  );
  const contactShadow = new THREE.Mesh(track(new THREE.CircleGeometry(0.75, 24)), shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;

  const waveMat = track(
    new THREE.MeshBasicMaterial({
      color: '#f28c28',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  const shockwaveRing = new THREE.Mesh(track(new THREE.RingGeometry(0.45, 0.65, 32)), waveMat);
  shockwaveRing.position.z = 0.02;
  shockwaveRing.visible = false;
  contactShadow.add(shockwaveRing);

  let waveTimer = 0;
  const waveDuration = 0.35;
  let waveMaxScale = 2.4;

  const triggerImpactShockwave = (colorHex: string, scale = 2.4) => {
    waveTimer = waveDuration;
    waveMaxScale = scale;
    waveMat.color.set(colorHex);
    shockwaveRing.visible = true;
    shockwaveRing.scale.set(0.6, 0.6, 1);
  };

  const updateShockwave = (dt: number) => {
    if (waveTimer > 0) {
      waveTimer = Math.max(0, waveTimer - dt);
      const t = 1 - waveTimer / waveDuration;
      const sc = 0.6 + t * waveMaxScale;
      shockwaveRing.scale.set(sc, sc, 1);
      waveMat.opacity = (1 - t) * 0.72;
      if (waveTimer <= 0) {
        shockwaveRing.visible = false;
      }
    }
  };

  const applyLoadout = (loadout: CharacterLoadout) => {
    const k = KURTA_CATALOG[loadout.kurta] ?? KURTA_CATALOG.ivory;
    kurtaMat.color.set(k.primaryColor);
    trouserMat.color.set(k.secondaryColor ?? '#252932');

    const f = FOOTWEAR_CATALOG[loadout.footwear] ?? FOOTWEAR_CATALOG.mojari;
    shoeMat.color.set(f.primaryColor);

    const h = HEADWEAR_CATALOG[loadout.headwear] ?? HEADWEAR_CATALOG.wire_glasses;
    frameMat.color.set(h.primaryColor);
    shadeLensMat.opacity = loadout.headwear === 'aviators' ? 0.85 : 0.22;
    hardHatGroup.visible = loadout.headwear === 'hard_hat';
    gandhiCap.visible = loadout.headwear === 'gandhi_cap';
    turbanGroup.visible = loadout.headwear === 'royal_turban';
  };

  applyLoadout(initialLoadout);

  return {
    root,
    rigBody,
    hips,
    torso,
    head,
    eyelidL,
    eyelidR,
    mouth,
    armL,
    forearmL,
    armR,
    forearmR,
    legL,
    shinL,
    legR,
    shinR,
    kurtaSkirt,
    surgeAura,
    contactShadow,
    applyLoadout,
    triggerImpactShockwave,
    updateShockwave,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
