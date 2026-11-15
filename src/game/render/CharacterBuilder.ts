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
  browL: THREE.Mesh;
  browR: THREE.Mesh;
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

  // Materials — natural cloth weave, warm skin, subtle sheen
  const skinMat = track(
    new THREE.MeshStandardMaterial({
      color: '#d49a73',
      roughness: 0.58,
      metalness: 0.02,
    })
  );
  const hairMat = track(
    new THREE.MeshStandardMaterial({
      color: '#b8c0ca',
      roughness: 0.68,
      metalness: 0.06,
    })
  );
  const kurtaMat = track(
    new THREE.MeshStandardMaterial({
      color: kurtaDef.primaryColor,
      roughness: 0.78,
      metalness: 0.03,
    })
  );
  const kurtaTrimMat = track(
    new THREE.MeshStandardMaterial({
      color: '#e59a3c',
      roughness: 0.52,
      metalness: 0.18,
    })
  );
  const trouserMat = track(
    new THREE.MeshStandardMaterial({
      color: kurtaDef.secondaryColor ?? '#252932',
      roughness: 0.74,
      metalness: 0.04,
    })
  );
  const shoeMat = track(
    new THREE.MeshStandardMaterial({
      color: footDef.primaryColor,
      roughness: 0.44,
      metalness: 0.14,
    })
  );
  const soleMat = track(
    new THREE.MeshStandardMaterial({
      color: '#1b1e24',
      roughness: 0.85,
    })
  );
  const frameMat = track(
    new THREE.MeshStandardMaterial({
      color: '#cfd7e3',
      metalness: 0.88,
      roughness: 0.2,
    })
  );
  const shadeLensMat = track(
    new THREE.MeshStandardMaterial({
      color: '#18202b',
      metalness: 0.45,
      roughness: 0.12,
      transparent: true,
      opacity: 0.22,
    })
  );
  const eyeWhiteMat = track(new THREE.MeshBasicMaterial({ color: '#f8fafc' }));
  const irisMat = track(new THREE.MeshBasicMaterial({ color: '#27201c' }));
  const glintMat = track(new THREE.MeshBasicMaterial({ color: '#ffffff' }));

  // -------------------------------------------------------------------------
  // HIPS & TORSO (Sculpted Indian Kurta Tunic with Lathe Silhouette)
  // -------------------------------------------------------------------------
  const hips = new THREE.Group();
  rigBody.add(hips);

  const pelvisMesh = new THREE.Mesh(
    track(new THREE.CapsuleGeometry(0.16, 0.18, 6, 12)),
    trouserMat
  );
  pelvisMesh.rotation.z = Math.PI / 2;
  pelvisMesh.scale.set(0.75, 1.0, 0.72);
  pelvisMesh.castShadow = true;
  hips.add(pelvisMesh);

  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  // Sculpted Lathe upper kurta chest & waist taper
  const chestProfile = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.24, 0.01),
    new THREE.Vector2(0.23, 0.14),
    new THREE.Vector2(0.255, 0.34),
    new THREE.Vector2(0.245, 0.49),
    new THREE.Vector2(0.155, 0.56),
    new THREE.Vector2(0.01, 0.57),
  ];
  const chestMesh = new THREE.Mesh(
    track(new THREE.LatheGeometry(chestProfile, 16)),
    kurtaMat
  );
  chestMesh.scale.set(1.06, 1, 0.76);
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Kurta Lower Tunic Skirt with gentle drape
  const skirtProfile = [
    new THREE.Vector2(0.29, -0.17),
    new THREE.Vector2(0.275, -0.05),
    new THREE.Vector2(0.242, 0.09),
  ];
  const kurtaSkirt = new THREE.Mesh(
    track(new THREE.LatheGeometry(skirtProfile, 16)),
    kurtaMat
  );
  kurtaSkirt.scale.set(1.06, 1, 0.78);
  kurtaSkirt.position.y = 0.01;
  kurtaSkirt.castShadow = true;
  torso.add(kurtaSkirt);

  // Nehru Collar + Stitched Placket + Pocket & Highway Pen Clip
  const collar = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.118, 0.132, 0.075, 16)),
    kurtaMat
  );
  collar.position.y = 0.575;
  torso.add(collar);

  const collarBand = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.122, 0.012, 6, 16)),
    kurtaTrimMat
  );
  collarBand.rotation.x = Math.PI / 2;
  collarBand.position.y = 0.595;
  torso.add(collarBand);

  const placket = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.052, 0.25, 0.022)),
    kurtaMat
  );
  placket.position.set(0, 0.435, 0.19);
  torso.add(placket);

  const btnGeo = track(new THREE.SphereGeometry(0.012, 8, 8));
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(btnGeo, frameMat);
    btn.position.set(0, 0.51 - i * 0.065, 0.205);
    torso.add(btn);
  }

  // Left chest kurta pocket + brass pen detail
  const pocket = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.075, 0.085, 0.016)),
    kurtaMat
  );
  pocket.position.set(-0.11, 0.40, 0.184);
  const pen = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.007, 0.007, 0.095, 6)),
    kurtaTrimMat
  );
  pen.position.set(-0.095, 0.435, 0.194);
  pen.rotation.z = -0.08;
  torso.add(pocket, pen);

  // -------------------------------------------------------------------------
  // HEAD, SCULPTED FEATURES, GLASSES, SWEPT HAIR & HEADWEAR
  // -------------------------------------------------------------------------
  const head = new THREE.Group();
  head.position.y = 0.625;
  torso.add(head);

  const neck = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.078, 0.096, 0.1, 12)),
    skinMat
  );
  neck.position.y = 0.02;
  head.add(neck);

  // Sculpted Cranium + Softer Jaw/Cheeks
  const cranium = new THREE.Mesh(track(new THREE.SphereGeometry(0.215, 20, 18)), skinMat);
  cranium.scale.set(0.94, 1.06, 0.96);
  cranium.position.y = 0.235;
  cranium.castShadow = true;
  head.add(cranium);

  const jaw = new THREE.Mesh(track(new THREE.SphereGeometry(0.165, 16, 12)), skinMat);
  jaw.scale.set(0.95, 0.78, 0.92);
  jaw.position.set(0, 0.155, 0.025);
  head.add(jaw);

  // Ears
  const earGeo = track(new THREE.SphereGeometry(0.042, 10, 10));
  const earL = new THREE.Mesh(earGeo, skinMat);
  earL.scale.set(0.45, 1.1, 0.75);
  earL.position.set(-0.205, 0.215, -0.01);
  const earR = earL.clone();
  earR.position.x = 0.205;
  head.add(earL, earR);

  // Rounded Nose Bridge
  const nose = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.024, 0.042, 4, 8)), skinMat);
  nose.position.set(0, 0.21, 0.21);
  nose.rotation.x = -0.18;
  head.add(nose);

  // Expressive Eyes (Sclera + Dark Iris + Specular Glint + Blinking Eyelids)
  const eyeGeo = track(new THREE.SphereGeometry(0.032, 10, 10));
  const pupilGeo = track(new THREE.SphereGeometry(0.018, 10, 10));
  const glintGeo = track(new THREE.SphereGeometry(0.007, 6, 6));
  const lidGeo = track(new THREE.BoxGeometry(0.07, 0.016, 0.042));

  const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
  eyeL.position.set(-0.074, 0.252, 0.182);
  const pupilL = new THREE.Mesh(pupilGeo, irisMat);
  pupilL.position.set(-0.074, 0.252, 0.206);
  const glintL = new THREE.Mesh(glintGeo, glintMat);
  glintL.position.set(-0.066, 0.26, 0.22);
  const eyelidL = new THREE.Mesh(lidGeo, skinMat);
  eyelidL.position.set(-0.074, 0.278, 0.192);

  const eyeR = eyeL.clone();
  eyeR.position.x = 0.074;
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.074;
  const glintR = glintL.clone();
  glintR.position.x = 0.082;
  const eyelidR = eyelidL.clone();
  eyelidR.position.x = 0.074;

  // Expressive Silver-Grey Eyebrows
  const browGeo = track(new THREE.CapsuleGeometry(0.011, 0.056, 4, 8));
  const browL = new THREE.Mesh(browGeo, hairMat);
  browL.rotation.z = Math.PI / 2 + 0.08;
  browL.position.set(-0.076, 0.308, 0.194);

  const browR = new THREE.Mesh(browGeo, hairMat);
  browR.rotation.z = Math.PI / 2 - 0.08;
  browR.position.set(0.076, 0.308, 0.194);

  // Warm Smile Curve
  const mouth = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.036, 0.01, 6, 12, Math.PI * 0.85)),
    track(new THREE.MeshBasicMaterial({ color: '#7a3c2f' }))
  );
  mouth.position.set(0, 0.15, 0.196);
  mouth.rotation.z = Math.PI * 1.075;

  head.add(
    eyeL,
    pupilL,
    glintL,
    eyelidL,
    eyeR,
    pupilR,
    glintR,
    eyelidR,
    browL,
    browR,
    mouth
  );

  // Signature Swept Silver-Grey Hair (Sculpted Crown + Swept Wave + Tapered Temples)
  const hairTop = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.222, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)),
    hairMat
  );
  hairTop.scale.set(0.97, 1.05, 1.03);
  hairTop.position.set(0, 0.252, -0.018);
  hairTop.rotation.x = -0.24;

  const hairCrest = new THREE.Mesh(
    track(new THREE.CapsuleGeometry(0.068, 0.18, 6, 12)),
    hairMat
  );
  hairCrest.rotation.z = Math.PI / 2;
  hairCrest.scale.set(0.85, 1.0, 1.15);
  hairCrest.position.set(0, 0.42, 0.055);
  hairCrest.rotation.x = -0.2;

  const hairBack = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.19, 14, 12)),
    hairMat
  );
  hairBack.scale.set(1.0, 0.85, 0.65);
  hairBack.position.set(0, 0.215, -0.145);

  const sideburnGeo = track(new THREE.CapsuleGeometry(0.022, 0.08, 4, 8));
  const sideburnL = new THREE.Mesh(sideburnGeo, hairMat);
  sideburnL.position.set(-0.195, 0.23, 0.03);
  const sideburnR = sideburnL.clone();
  sideburnR.position.x = 0.195;

  head.add(hairTop, hairCrest, hairBack, sideburnL, sideburnR);

  // Signature Rectangular Glasses with Temple Arms
  const glassesGroup = new THREE.Group();
  glassesGroup.position.set(0, 0.252, 0.22);
  const rimGeo = track(new THREE.BoxGeometry(0.092, 0.056, 0.012));
  const rimFrameGeo = track(new THREE.TorusGeometry(0.047, 0.0055, 6, 18));
  const lensL = new THREE.Mesh(rimGeo, shadeLensMat);
  lensL.position.x = -0.074;
  const lensR = new THREE.Mesh(rimGeo, shadeLensMat);
  lensR.position.x = 0.074;
  const frameL = new THREE.Mesh(rimFrameGeo, frameMat);
  frameL.scale.set(1.08, 0.72, 1);
  frameL.position.x = -0.074;
  const frameR = frameL.clone();
  frameR.position.x = 0.074;
  const bridge = new THREE.Mesh(track(new THREE.BoxGeometry(0.052, 0.009, 0.01)), frameMat);
  const templeGeo = track(new THREE.BoxGeometry(0.008, 0.01, 0.19));
  const templeL = new THREE.Mesh(templeGeo, frameMat);
  templeL.position.set(-0.125, 0.005, -0.095);
  const templeR = templeL.clone();
  templeR.position.x = 0.125;
  glassesGroup.add(lensL, lensR, frameL, frameR, bridge, templeL, templeR);
  head.add(glassesGroup);

  // Optional Headwear Meshes (toggled by loadout)
  const hardHatGroup = new THREE.Group();
  const hardHatMat = track(
    new THREE.MeshStandardMaterial({ color: '#f2b824', roughness: 0.34, metalness: 0.12 })
  );
  const hatDome = new THREE.Mesh(
    track(new THREE.SphereGeometry(0.242, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)),
    hardHatMat
  );
  hatDome.position.y = 0.288;
  const hatRidge = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.05, 0.05, 0.38)),
    hardHatMat
  );
  hatRidge.position.set(0, 0.495, -0.01);
  const hatBrim = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.258, 0.27, 0.026, 18)),
    hardHatMat
  );
  hatBrim.position.set(0, 0.288, 0.045);
  const hatLamp = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.032, 0.036, 0.03, 10)),
    track(
      new THREE.MeshStandardMaterial({
        color: '#fef3c7',
        emissive: '#fbbf24',
        emissiveIntensity: 0.65,
      })
    )
  );
  hatLamp.rotation.x = Math.PI / 2;
  hatLamp.position.set(0, 0.35, 0.24);
  hardHatGroup.add(hatDome, hatRidge, hatBrim, hatLamp);
  hardHatGroup.visible = false;
  head.add(hardHatGroup);

  const gandhiCapGroup = new THREE.Group();
  const capMat = track(new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: 0.82 }));
  const gandhiCapBody = new THREE.Mesh(
    track(new THREE.CylinderGeometry(0.11, 0.15, 0.13, 12)),
    capMat
  );
  gandhiCapBody.scale.set(0.75, 1, 1.55);
  gandhiCapBody.position.set(0, 0.42, 0.01);
  gandhiCapGroup.add(gandhiCapBody);
  gandhiCapGroup.visible = false;
  head.add(gandhiCapGroup);

  const turbanGroup = new THREE.Group();
  const turbanMat = track(new THREE.MeshStandardMaterial({ color: '#e87722', roughness: 0.65 }));
  const turbanRing = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.222, 0.072, 10, 22)),
    turbanMat
  );
  turbanRing.rotation.x = Math.PI / 2;
  turbanRing.position.y = 0.355;
  const turbanFold = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.185, 0.056, 8, 18)),
    turbanMat
  );
  turbanFold.rotation.x = Math.PI / 2 + 0.18;
  turbanFold.position.set(0, 0.415, -0.01);
  const turbanCrest = new THREE.Mesh(
    track(new THREE.ConeGeometry(0.065, 0.16, 10)),
    track(new THREE.MeshStandardMaterial({ color: '#f5c249', roughness: 0.35, metalness: 0.45 }))
  );
  turbanCrest.position.set(0.045, 0.48, 0.165);
  turbanCrest.rotation.z = -0.15;
  turbanGroup.add(turbanRing, turbanFold, turbanCrest);
  turbanGroup.visible = false;
  head.add(turbanGroup);

  // -------------------------------------------------------------------------
  // ARMS & HANDS (Tapered Kurta Sleeves + Cuffs + Sculpted Hands)
  // -------------------------------------------------------------------------
  const upperArmGeo = track(new THREE.CylinderGeometry(0.068, 0.058, 0.26, 10));
  const forearmGeo = track(new THREE.CylinderGeometry(0.056, 0.046, 0.24, 10));
  const cuffGeo = track(new THREE.CylinderGeometry(0.052, 0.052, 0.032, 10));
  const handGeo = track(new THREE.SphereGeometry(0.05, 10, 10));

  const buildArm = (side: -1 | 1): [THREE.Group, THREE.Group] => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.295, 0.495, 0);
    const shoulder = new THREE.Mesh(track(new THREE.SphereGeometry(0.068, 10, 10)), kurtaMat);
    const upper = new THREE.Mesh(upperArmGeo, kurtaMat);
    upper.position.y = -0.125;
    upper.castShadow = true;
    arm.add(shoulder, upper);

    const forearm = new THREE.Group();
    forearm.position.y = -0.25;
    const foreMesh = new THREE.Mesh(forearmGeo, kurtaMat);
    foreMesh.position.y = -0.11;
    foreMesh.castShadow = true;
    const cuff = new THREE.Mesh(cuffGeo, kurtaTrimMat);
    cuff.position.y = -0.215;
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.scale.set(0.88, 1.15, 0.68);
    hand.position.y = -0.255;
    forearm.add(foreMesh, cuff, hand);
    arm.add(forearm);

    torso.add(arm);
    return [arm, forearm];
  };

  const [armL, forearmL] = buildArm(-1);
  const [armR, forearmR] = buildArm(1);

  // -------------------------------------------------------------------------
  // LEGS & SCULPTED INDIAN MOJARI FOOTWEAR
  // -------------------------------------------------------------------------
  const thighGeo = track(new THREE.CylinderGeometry(0.086, 0.072, 0.34, 10));
  const shinGeo = track(new THREE.CylinderGeometry(0.07, 0.054, 0.34, 10));
  const shoeBodyGeo = track(new THREE.CapsuleGeometry(0.055, 0.14, 6, 10));
  const shoeTipGeo = track(new THREE.ConeGeometry(0.042, 0.08, 8));
  const soleGeo = track(new THREE.BoxGeometry(0.112, 0.024, 0.24));

  const buildLeg = (side: -1 | 1): [THREE.Group, THREE.Group] => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.125, -0.05, 0);
    const thigh = new THREE.Mesh(thighGeo, trouserMat);
    thigh.position.y = -0.165;
    thigh.castShadow = true;
    leg.add(thigh);

    const shin = new THREE.Group();
    shin.position.y = -0.34;
    const shinMesh = new THREE.Mesh(shinGeo, trouserMat);
    shinMesh.position.y = -0.165;
    shinMesh.castShadow = true;

    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -0.355, 0.045);

    const shoeUpper = new THREE.Mesh(shoeBodyGeo, shoeMat);
    shoeUpper.rotation.x = Math.PI / 2;
    shoeUpper.scale.set(1.05, 1, 0.72);
    shoeUpper.castShadow = true;

    const mojariTip = new THREE.Mesh(shoeTipGeo, shoeMat);
    mojariTip.position.set(0, 0.024, 0.115);
    mojariTip.rotation.x = 0.55;

    const sole = new THREE.Mesh(soleGeo, soleMat);
    sole.position.set(0, -0.032, 0);

    shoeGroup.add(shoeUpper, mojariTip, sole);
    shin.add(shinMesh, shoeGroup);
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
    gandhiCapGroup.visible = loadout.headwear === 'gandhi_cap';
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
    browL,
    browR,
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
