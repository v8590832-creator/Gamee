import * as THREE from 'three';
import { ORB_SKINS } from '../data/catalog';
import type { OrbSkinId } from '../types';

export interface PlayerOrbRig {
  root: THREE.Group;
  rollGroup: THREE.Group;
  coreMesh: THREE.Mesh;
  innerRing: THREE.Mesh;
  outerRing: THREE.Mesh;
  orbLight: THREE.PointLight | null;
  contactShadow: THREE.Mesh;
  triggerImpactShockwave: (x: number, y: number, z: number, colorHex: string, scale?: number) => void;
  applySkin: (skinId: OrbSkinId) => void;
  updateVisuals: (elapsed: number, dt: number, speed: number, dashActive: boolean) => void;
  dispose: () => void;
}

export function createPlayerOrb(
  initialSkin: OrbSkinId,
  contactShadowTex: THREE.Texture,
  enablePointLight: boolean
): PlayerOrbRig {
  const root = new THREE.Group();
  const rollGroup = new THREE.Group();
  root.add(rollGroup);

  const skin = ORB_SKINS[initialSkin] ?? ORB_SKINS.copper;

  // 1. Layered Internal Energy Nucleus (Swirling custom GLSL shader)
  const coreGeo = new THREE.IcosahedronGeometry(0.28, 3);
  const coreUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(skin.coreColor) },
    uBoost: { value: 0 },
  };
  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec3 vLocalPos;
      void main() {
        vLocalPos = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uBoost;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec3 vLocalPos;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float fresnel = pow(1.0 - max(0.0, dot(n, v)), 2.1);
        float swirl = sin(vLocalPos.x * 16.0 + uTime * 3.2) * cos(vLocalPos.y * 14.0 - uTime * 2.4) * 0.5 + 0.5;
        float vein = smoothstep(0.55, 0.92, swirl);
        vec3 deepCore = uColor * 0.42;
        vec3 brightVein = mix(uColor, vec3(1.0, 0.96, 0.88), 0.35 + uBoost * 0.3);
        vec3 col = mix(deepCore, brightVein, vein * 0.65 + fresnel * 0.65);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  rollGroup.add(coreMesh);

  // 2. Optical Glass Containment Shell around Core
  const glassGeo = new THREE.SphereGeometry(0.36, 24, 18);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#dce8f2',
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const glassShell = new THREE.Mesh(glassGeo, glassMat);
  glassShell.renderOrder = 2;
  rollGroup.add(glassShell);

  // 3. Split Ceramic & Brushed Metal Armored Caps + Equatorial Collar (Distinctive Character Silhouette)
  const shellMat = new THREE.MeshStandardMaterial({
    color: skin.shellColor,
    metalness: skin.metalness,
    roughness: skin.roughness,
  });

  const capGeoNorth = new THREE.SphereGeometry(0.455, 24, 12, 0, Math.PI * 2, 0.28, 0.72);
  const capNorth = new THREE.Mesh(capGeoNorth, shellMat);
  capNorth.castShadow = true;
  const capGeoSouth = new THREE.SphereGeometry(0.455, 24, 12, 0, Math.PI * 2, Math.PI - 1.0, 0.72);
  const capSouth = new THREE.Mesh(capGeoSouth, shellMat);
  capSouth.castShadow = true;
  rollGroup.add(capNorth, capSouth);

  // Ceramic matte insulator band + beveled geodesic ribs
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: '#d8d3c8',
    metalness: 0.06,
    roughness: 0.72,
  });

  const ribGeo = new THREE.TorusGeometry(0.47, 0.038, 10, 32);
  const rib1 = new THREE.Mesh(ribGeo, shellMat);
  rib1.castShadow = true;
  const rib2 = new THREE.Mesh(ribGeo, ceramicMat);
  rib2.rotation.x = Math.PI / 2;
  rib2.castShadow = true;
  const rib3 = new THREE.Mesh(ribGeo, shellMat);
  rib3.rotation.y = Math.PI / 2;
  rib3.castShadow = true;
  rollGroup.add(rib1, rib2, rib3);

  // 6 machined bronze retaining lugs for crystal-clear rolling feedback
  const nodeGeo = new THREE.CylinderGeometry(0.08, 0.095, 0.07, 8);
  const ringMat = new THREE.MeshStandardMaterial({
    color: skin.ringColor,
    metalness: 0.86,
    roughness: 0.24,
  });
  const nodeOffsets: [number, number, number, number, number, number][] = [
    [0, 0.47, 0, 0, 0, 0],
    [0, -0.47, 0, Math.PI, 0, 0],
    [0.47, 0, 0, 0, 0, -Math.PI / 2],
    [-0.47, 0, 0, 0, 0, Math.PI / 2],
    [0, 0, 0.47, Math.PI / 2, 0, 0],
    [0, 0, -0.47, -Math.PI / 2, 0, 0],
  ];
  for (const [x, y, z, rx, ry, rz] of nodeOffsets) {
    const node = new THREE.Mesh(nodeGeo, ringMat);
    node.position.set(x, y, z);
    node.rotation.set(rx, ry, rz);
    node.castShadow = true;
    rollGroup.add(node);
  }

  // 4. Dual Gimbal Stabilizer Rings
  const innerRingGeo = new THREE.TorusGeometry(0.39, 0.016, 8, 28);
  const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
  root.add(innerRing);

  const outerRingGeo = new THREE.TorusGeometry(0.56, 0.014, 8, 36);
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: skin.coreColor,
    emissive: skin.coreColor,
    emissiveIntensity: 0.35,
    metalness: 0.35,
    roughness: 0.4,
    transparent: true,
    opacity: 0.55,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  root.add(outerRing);

  // 5. Optional subtle dynamic point light
  let orbLight: THREE.PointLight | null = null;
  if (enablePointLight) {
    orbLight = new THREE.PointLight(skin.coreColor, 1.2, 8.5, 2);
    root.add(orbLight);
  }

  // 6. Contact Shadow Disc + Bounce Impact Shockwave Ring
  const shadowGeo = new THREE.CircleGeometry(0.68, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.rotation.x = -Math.PI / 2;

  const waveGeo = new THREE.RingGeometry(0.42, 0.62, 32);
  const waveMat = new THREE.MeshBasicMaterial({
    color: skin.coreColor,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const shockwaveRing = new THREE.Mesh(waveGeo, waveMat);
  shockwaveRing.position.z = 0.02;
  shockwaveRing.visible = false;
  contactShadow.add(shockwaveRing);

  let waveTimer = 0;
  const waveDuration = 0.35;
  let waveMaxScale = 2.2;

  const triggerImpactShockwave = (
    _x: number,
    _y: number,
    _z: number,
    colorHex: string,
    scale = 2.2
  ) => {
    waveTimer = waveDuration;
    waveMaxScale = scale;
    waveMat.color.set(colorHex);
    shockwaveRing.visible = true;
    shockwaveRing.scale.set(0.6, 0.6, 1);
  };

  const applySkin = (skinId: OrbSkinId) => {
    const next = ORB_SKINS[skinId] ?? ORB_SKINS.copper;
    shellMat.color.set(next.shellColor);
    shellMat.metalness = next.metalness;
    shellMat.roughness = next.roughness;
    ringMat.color.set(next.ringColor);
    coreUniforms.uColor.value.set(next.coreColor);
    outerRingMat.color.set(next.coreColor);
    outerRingMat.emissive.set(next.coreColor);
    if (orbLight) orbLight.color.set(next.coreColor);
  };

  const updateVisuals = (elapsed: number, dt: number, speed: number, dashActive: boolean) => {
    coreUniforms.uTime.value = elapsed;
    coreUniforms.uBoost.value = dashActive ? 1.0 : Math.min(0.6, speed / 24);
    innerRing.rotation.y = elapsed * 1.35;
    innerRing.rotation.x = Math.sin(elapsed * 0.9) * 0.45;
    outerRing.rotation.z = -elapsed * (0.9 + speed * 0.12);
    outerRingMat.opacity = dashActive ? 0.85 : 0.35 + Math.min(0.32, speed * 0.018);

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

  const dispose = () => {
    coreGeo.dispose();
    coreMat.dispose();
    glassGeo.dispose();
    glassMat.dispose();
    capGeoNorth.dispose();
    capGeoSouth.dispose();
    ceramicMat.dispose();
    ribGeo.dispose();
    shellMat.dispose();
    nodeGeo.dispose();
    ringMat.dispose();
    innerRingGeo.dispose();
    outerRingGeo.dispose();
    outerRingMat.dispose();
    shadowGeo.dispose();
    shadowMat.dispose();
    waveGeo.dispose();
    waveMat.dispose();
  };

  return {
    root,
    rollGroup,
    coreMesh,
    innerRing,
    outerRing,
    orbLight,
    contactShadow,
    triggerImpactShockwave,
    applySkin,
    updateVisuals,
    dispose,
  };
}
