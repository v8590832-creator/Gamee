import * as THREE from 'three';

export interface ProceduralTextureSet {
  asphaltAlbedo: THREE.CanvasTexture;
  asphaltBump: THREE.CanvasTexture;
  wetAsphaltAlbedo: THREE.CanvasTexture;
  redWhiteBarrierAlbedo: THREE.CanvasTexture;
  concreteAlbedo: THREE.CanvasTexture;
  concreteBump: THREE.CanvasTexture;
  concreteRoughness: THREE.CanvasTexture;
  steelAlbedo: THREE.CanvasTexture;
  steelBump: THREE.CanvasTexture;
  steelRoughness: THREE.CanvasTexture;
  hazardStripeAlbedo: THREE.CanvasTexture;
  copperPadAlbedo: THREE.CanvasTexture;
  stoneAlbedo: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  chaiSignAlbedo: THREE.CanvasTexture;
  milestoneAlbedo: THREE.CanvasTexture;
  truckArtAlbedo: THREE.CanvasTexture;
  buildingFacadeAlbedo: THREE.CanvasTexture;
  waterAlbedo: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createHighwaySignTexture(
  label: string,
  sublabel = 'BHARAT HIGHWAY AUTHORITY  ·  NH-BOUNCE'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 176;
  const ctx = canvas.getContext('2d')!;

  // Deep reflective Indian NH green enamel
  const bg = ctx.createLinearGradient(0, 0, 0, 176);
  bg.addColorStop(0, '#126436');
  bg.addColorStop(1, '#0d4e29');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 176);

  // Subtle weathered highway dust along bottom edge
  const dust = ctx.createLinearGradient(0, 130, 0, 176);
  dust.addColorStop(0, 'rgba(200, 180, 145, 0)');
  dust.addColorStop(1, 'rgba(180, 160, 130, 0.16)');
  ctx.fillStyle = dust;
  ctx.fillRect(0, 130, 512, 46);

  // Crisp inner white border + corner rivets
  ctx.strokeStyle = '#f2f5f7';
  ctx.lineWidth = 7;
  ctx.strokeRect(10, 10, 492, 156);

  // NH Shield badge on left
  ctx.fillStyle = '#f2b830';
  ctx.beginPath();
  ctx.roundRect(24, 30, 56, 42, 8);
  ctx.fill();
  ctx.fillStyle = '#11161d';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NH', 52, 52);

  // Primary Destination / Stage Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 31px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label.toUpperCase(), 282, 56);

  // Directional divider & Sublabel
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(28, 92, 456, 2);

  ctx.fillStyle = '#f6c445';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(sublabel.toUpperCase(), 256, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeCanvas(w = 256, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  repeatX = 2,
  repeatY = repeatX
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.max(1, Math.min(8, maxAnisotropy));

  // 1. Weathered Board-Formed Concrete (Albedo + Bump + Roughness)
  const [cCanvas, cCtx] = makeCanvas(512);
  cCtx.fillStyle = '#848991';
  cCtx.fillRect(0, 0, 512, 512);

  // Subtle formwork plank banding
  for (let y = 0; y < 512; y += 64) {
    cCtx.fillStyle = y % 128 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    cCtx.fillRect(0, y, 512, 64);
  }
  for (let i = 0; i < 6500; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    const v = 112 + ((i * 29) % 44);
    cCtx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
    cCtx.fillRect(x, y, 2 + (i % 3), 2 + ((i + 1) % 2));
  }
  cCtx.strokeStyle = 'rgba(24, 28, 34, 0.42)';
  cCtx.lineWidth = 3;
  cCtx.strokeRect(2, 2, 508, 508);
  cCtx.beginPath();
  cCtx.moveTo(0, 256);
  cCtx.lineTo(512, 256);
  cCtx.moveTo(256, 0);
  cCtx.lineTo(256, 512);
  cCtx.stroke();

  const tiePoints = [
    [48, 48], [208, 48], [48, 208], [208, 208],
    [304, 48], [464, 48], [304, 208], [464, 208],
    [48, 304], [208, 304], [48, 464], [208, 464],
    [304, 304], [464, 304], [304, 464], [464, 464],
  ];
  for (const [tx, ty] of tiePoints) {
    cCtx.fillStyle = 'rgba(24, 28, 34, 0.5)';
    cCtx.beginPath();
    cCtx.arc(tx, ty, 5, 0, Math.PI * 2);
    cCtx.fill();
  }

  // Hairline weathering crack
  cCtx.strokeStyle = 'rgba(28, 30, 35, 0.28)';
  cCtx.lineWidth = 1.5;
  cCtx.beginPath();
  cCtx.moveTo(110, 0);
  cCtx.lineTo(132, 68);
  cCtx.lineTo(124, 140);
  cCtx.lineTo(155, 210);
  cCtx.stroke();

  const concreteAlbedo = finalizeTexture(cCanvas, true, aniso, 2);

  const [cbCanvas, cbCtx] = makeCanvas(512);
  cbCtx.fillStyle = '#888888';
  cbCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const x = (i * 83) % 512;
    const y = (i * 157) % 512;
    const v = 110 + ((i * 31) % 60);
    cbCtx.fillStyle = `rgb(${v},${v},${v})`;
    cbCtx.fillRect(x, y, 2, 2);
  }
  cbCtx.strokeStyle = '#303030';
  cbCtx.lineWidth = 4;
  cbCtx.strokeRect(2, 2, 508, 508);
  const concreteBump = finalizeTexture(cbCanvas, false, aniso, 2);

  const [crCanvas, crCtx] = makeCanvas(256);
  crCtx.fillStyle = '#dcdcdc';
  crCtx.fillRect(0, 0, 256, 256);
  const laneGrad = crCtx.createLinearGradient(0, 0, 256, 0);
  laneGrad.addColorStop(0, 'rgba(235,235,235,0.92)');
  laneGrad.addColorStop(0.5, 'rgba(175,175,175,0.82)');
  laneGrad.addColorStop(1, 'rgba(235,235,235,0.92)');
  crCtx.fillStyle = laneGrad;
  crCtx.fillRect(0, 0, 256, 256);
  const concreteRoughness = finalizeTexture(crCanvas, false, aniso, 2);

  // 2. Brushed & Scratched Industrial Steel Plate
  const [sCanvas, sCtx] = makeCanvas(512);
  sCtx.fillStyle = '#4c545f';
  sCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const y = (i * 41) % 512;
    const x = (i * 113) % 440;
    const w = 24 + (i % 64);
    const v = 64 + (i % 24);
    sCtx.fillStyle = `rgba(${v + 8},${v + 12},${v + 18},0.28)`;
    sCtx.fillRect(x, y, w, 1);
  }
  sCtx.strokeStyle = '#262b32';
  sCtx.lineWidth = 4;
  for (let p = 0; p <= 512; p += 128) {
    sCtx.beginPath();
    sCtx.moveTo(p, 0);
    sCtx.lineTo(p, 512);
    sCtx.moveTo(0, p);
    sCtx.lineTo(512, p);
    sCtx.stroke();
  }
  sCtx.fillStyle = '#798391';
  for (let x = 16; x < 512; x += 128) {
    for (let y = 16; y < 512; y += 128) {
      for (const [ox, oy] of [[0, 0], [96, 0], [0, 96], [96, 96]]) {
        sCtx.beginPath();
        sCtx.arc(x + ox, y + oy, 3.2, 0, Math.PI * 2);
        sCtx.fill();
      }
    }
  }
  const steelAlbedo = finalizeTexture(sCanvas, true, aniso, 2);

  const [sbCanvas, sbCtx] = makeCanvas(256);
  sbCtx.fillStyle = '#8e8e8e';
  sbCtx.fillRect(0, 0, 256, 256);
  sbCtx.strokeStyle = '#383838';
  sbCtx.lineWidth = 3;
  for (let p = 0; p <= 256; p += 64) {
    sbCtx.beginPath();
    sbCtx.moveTo(p, 0);
    sbCtx.lineTo(p, 256);
    sbCtx.moveTo(0, p);
    sbCtx.lineTo(256, p);
    sbCtx.stroke();
  }
  const steelBump = finalizeTexture(sbCanvas, false, aniso, 2);

  const [srCanvas, srCtx] = makeCanvas(256);
  srCtx.fillStyle = '#7a7a7a';
  srCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    srCtx.fillStyle = i % 2 === 0 ? 'rgba(180,180,180,0.3)' : 'rgba(65,65,65,0.3)';
    srCtx.fillRect(x, y, 18, 2);
  }
  const steelRoughness = finalizeTexture(srCanvas, false, aniso, 2);

  // 3. Weathered Caution Stripe
  const [hCanvas, hCtx] = makeCanvas(256);
  hCtx.fillStyle = '#2d3138';
  hCtx.fillRect(0, 0, 256, 256);
  hCtx.fillStyle = '#b97e33';
  for (let x = -256; x < 512; x += 64) {
    hCtx.beginPath();
    hCtx.moveTo(x, 0);
    hCtx.lineTo(x + 32, 0);
    hCtx.lineTo(x + 160, 256);
    hCtx.lineTo(x + 128, 256);
    hCtx.closePath();
    hCtx.fill();
  }
  for (let i = 0; i < 900; i++) {
    hCtx.fillStyle = 'rgba(28, 30, 34, 0.35)';
    hCtx.fillRect((i * 71) % 256, (i * 113) % 256, 3, 2);
  }
  const hazardStripeAlbedo = finalizeTexture(hCanvas, true, aniso, 3);

  // 4. Handcrafted Copper Pneumatic Bounce Plate
  const [pCanvas, pCtx] = makeCanvas(256);
  pCtx.fillStyle = '#784321';
  pCtx.fillRect(0, 0, 256, 256);
  pCtx.strokeStyle = 'rgba(222, 154, 84, 0.25)';
  pCtx.lineWidth = 2;
  for (let r = 18; r < 120; r += 8) {
    pCtx.beginPath();
    pCtx.arc(128, 128, r, 0, Math.PI * 2);
    pCtx.stroke();
  }
  pCtx.strokeStyle = '#e5a44c';
  pCtx.lineWidth = 8;
  for (const r of [38, 76]) {
    pCtx.beginPath();
    pCtx.arc(128, 128, r, 0, Math.PI * 2);
    pCtx.stroke();
  }
  pCtx.strokeStyle = '#29170d';
  pCtx.lineWidth = 10;
  pCtx.strokeRect(5, 5, 246, 246);
  const copperPadAlbedo = finalizeTexture(pCanvas, true, aniso, 1);

  // 5. Stratified Stone / Mountain Rock
  const [stCanvas, stCtx] = makeCanvas(512);
  stCtx.fillStyle = '#7b746b';
  stCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    const shade = 110 + ((y * 7) % 18);
    stCtx.fillStyle = `rgba(${shade + 5}, ${shade}, ${shade - 6}, 0.38)`;
    stCtx.fillRect(0, y, 512, 30);
    stCtx.fillStyle = 'rgba(32, 28, 24, 0.24)';
    stCtx.fillRect(0, y + 30, 512, 2);
  }
  for (let i = 0; i < 3800; i++) {
    const v = 90 + ((i * 23) % 48);
    stCtx.fillStyle = `rgb(${v + 4},${v + 1},${v - 3})`;
    stCtx.fillRect((i * 89) % 512, (i * 193) % 512, 3, 3);
  }
  const stoneAlbedo = finalizeTexture(stCanvas, true, aniso, 2);

  const [stbCanvas, stbCtx] = makeCanvas(256);
  stbCtx.fillStyle = '#808080';
  stbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const v = 96 + ((i * 37) % 68);
    stbCtx.fillStyle = `rgb(${v},${v},${v})`;
    stbCtx.fillRect((i * 67) % 256, (i * 149) % 256, 3, 2);
  }
  const stoneBump = finalizeTexture(stbCanvas, false, aniso, 2);

  // 6. Soft Radial Contact Shadow Disc
  const [shCanvas, shCtx] = makeCanvas(128);
  const grad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shCtx.fillStyle = grad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  // 7. Indian Highway Asphalt Tarmac (Albedo + Wet Albedo + Bump)
  const paintAsphalt = (wet: boolean) => {
    const [asCanvas, asCtx] = makeCanvas(512);
    asCtx.fillStyle = wet ? '#282d35' : '#353941';
    asCtx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const x = (i * 101) % 512;
      const y = (i * 199) % 512;
      const v = (wet ? 28 : 40) + ((i * 23) % 32);
      asCtx.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
      asCtx.fillRect(x, y, 2, 2);
    }
    // Tire-track polish lanes + warm roadside dust edges
    asCtx.fillStyle = 'rgba(18, 20, 24, 0.28)';
    asCtx.fillRect(102, 0, 82, 512);
    asCtx.fillRect(326, 0, 82, 512);

    const dustLeft = asCtx.createLinearGradient(0, 0, 44, 0);
    dustLeft.addColorStop(0, wet ? 'rgba(40,52,60,0.45)' : 'rgba(125,105,82,0.28)');
    dustLeft.addColorStop(1, 'rgba(0,0,0,0)');
    asCtx.fillStyle = dustLeft;
    asCtx.fillRect(0, 0, 44, 512);

    const dustRight = asCtx.createLinearGradient(512, 0, 468, 0);
    dustRight.addColorStop(0, wet ? 'rgba(40,52,60,0.45)' : 'rgba(125,105,82,0.28)');
    dustRight.addColorStop(1, 'rgba(0,0,0,0)');
    asCtx.fillStyle = dustRight;
    asCtx.fillRect(468, 0, 44, 512);

    // Subtle sealed tar cracks
    asCtx.strokeStyle = 'rgba(15, 17, 20, 0.42)';
    asCtx.lineWidth = 2;
    asCtx.beginPath();
    asCtx.moveTo(85, 60);
    asCtx.lineTo(118, 124);
    asCtx.lineTo(106, 180);
    asCtx.moveTo(395, 290);
    asCtx.lineTo(368, 355);
    asCtx.lineTo(380, 430);
    asCtx.stroke();

    // Shoulder lines (slightly scuffed)
    asCtx.fillStyle = '#dde1e6';
    asCtx.fillRect(22, 0, 10, 512);
    asCtx.fillRect(480, 0, 10, 512);

    // Broken yellow highway dashes
    asCtx.fillStyle = '#eab93b';
    for (let y = 18; y < 512; y += 96) {
      asCtx.fillRect(250, y, 12, 54);
    }
    return asCanvas;
  };

  const asphaltAlbedo = finalizeTexture(paintAsphalt(false), true, aniso, 1);
  const wetAsphaltAlbedo = finalizeTexture(paintAsphalt(true), true, aniso, 1);

  const [abCanvas, abCtx] = makeCanvas(256);
  abCtx.fillStyle = '#808080';
  abCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    const v = 96 + ((i * 29) % 68);
    abCtx.fillStyle = `rgb(${v},${v},${v})`;
    abCtx.fillRect((i * 73) % 256, (i * 139) % 256, 2, 2);
  }
  const asphaltBump = finalizeTexture(abCanvas, false, aniso, 2);

  // 8. Red & White Indian Roadside Jersey Barrier Stripes
  const [rwCanvas, rwCtx] = makeCanvas(256);
  rwCtx.fillStyle = '#eae5dc';
  rwCtx.fillRect(0, 0, 256, 256);
  rwCtx.fillStyle = '#c8342b';
  for (let x = 0; x < 256; x += 64) {
    rwCtx.fillRect(x, 0, 32, 256);
  }
  for (let i = 0; i < 650; i++) {
    rwCtx.fillStyle = 'rgba(30, 24, 20, 0.24)';
    rwCtx.fillRect((i * 83) % 256, (i * 127) % 256, 3, 2);
  }
  const redWhiteBarrierAlbedo = finalizeTexture(rwCanvas, true, aniso, 2);

  // 9. Hand-Painted Indian Roadside Chai Stall Sign
  const [chCanvas, chCtx] = makeCanvas(256, 96);
  chCtx.fillStyle = '#f2b830';
  chCtx.fillRect(0, 0, 256, 96);
  chCtx.strokeStyle = '#7c2416';
  chCtx.lineWidth = 6;
  chCtx.strokeRect(5, 5, 246, 86);
  chCtx.fillStyle = '#6b1810';
  chCtx.font = 'bold 26px system-ui, sans-serif';
  chCtx.textAlign = 'center';
  chCtx.textBaseline = 'middle';
  chCtx.fillText('CHAI · NASHTA', 128, 36);
  chCtx.fillStyle = '#1b5e34';
  chCtx.font = 'bold 14px system-ui, sans-serif';
  chCtx.fillText('HIGHWAY DHABA & TEA', 128, 68);
  const chaiSignAlbedo = finalizeTexture(chCanvas, true, aniso, 1, 1);

  // 10. Indian Yellow & White National Highway Milestone Plaque
  const [msCanvas, msCtx] = makeCanvas(128, 192);
  msCtx.fillStyle = '#efece4';
  msCtx.fillRect(0, 0, 128, 192);
  msCtx.fillStyle = '#ebb022';
  msCtx.fillRect(0, 0, 128, 68);
  msCtx.fillStyle = '#1d222b';
  msCtx.font = 'bold 24px system-ui, sans-serif';
  msCtx.textAlign = 'center';
  msCtx.textBaseline = 'middle';
  msCtx.fillText('NH-48', 64, 36);
  msCtx.fillStyle = '#181c22';
  msCtx.font = 'bold 34px system-ui, sans-serif';
  msCtx.fillText('42', 64, 118);
  msCtx.font = 'bold 16px system-ui, sans-serif';
  msCtx.fillText('KM', 64, 156);
  const milestoneAlbedo = finalizeTexture(msCanvas, true, aniso, 1, 1);

  // 11. Indian Truck Rear Panel Art ("HORN OK PLEASE")
  const [trCanvas, trCtx] = makeCanvas(256, 160);
  trCtx.fillStyle = '#b93822';
  trCtx.fillRect(0, 0, 256, 160);
  trCtx.strokeStyle = '#f5c038';
  trCtx.lineWidth = 8;
  trCtx.strokeRect(8, 8, 240, 144);
  trCtx.fillStyle = '#1a6b3d';
  trCtx.fillRect(16, 18, 224, 42);
  trCtx.fillStyle = '#fff5d6';
  trCtx.font = 'bold 22px system-ui, sans-serif';
  trCtx.textAlign = 'center';
  trCtx.textBaseline = 'middle';
  trCtx.fillText('HORN  OK  PLEASE', 128, 40);
  trCtx.fillStyle = '#f7c948';
  trCtx.font = 'bold 18px system-ui, sans-serif';
  trCtx.fillText('BHARAT CARRIER', 128, 96);
  trCtx.fillStyle = '#48b8d0';
  trCtx.fillRect(32, 122, 192, 12);
  const truckArtAlbedo = finalizeTexture(trCanvas, true, aniso, 1, 1);

  // 12. Urban Building Stucco + Lit Apartment Windows
  const [bfCanvas, bfCtx] = makeCanvas(256, 512);
  bfCtx.fillStyle = '#454b54';
  bfCtx.fillRect(0, 0, 256, 512);
  for (let row = 0; row < 12; row++) {
    const y = 18 + row * 40;
    bfCtx.fillStyle = 'rgba(0,0,0,0.18)';
    bfCtx.fillRect(0, y + 32, 256, 4);
    for (let col = 0; col < 5; col++) {
      const x = 18 + col * 48;
      const lit = (row * 7 + col * 11) % 5 === 0 || (row * 3 + col) % 7 === 0;
      bfCtx.fillStyle = lit ? '#e8b968' : '#252a33';
      bfCtx.fillRect(x, y, 28, 22);
      bfCtx.strokeStyle = '#606875';
      bfCtx.lineWidth = 1.5;
      bfCtx.strokeRect(x, y, 28, 22);
    }
  }
  const buildingFacadeAlbedo = finalizeTexture(bfCanvas, true, aniso, 1, 1);

  // 13. River / Coastal Water Ripple Albedo
  const [wtCanvas, wtCtx] = makeCanvas(256);
  wtCtx.fillStyle = '#255268';
  wtCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 180; i++) {
    const x = (i * 59) % 256;
    const y = (i * 89) % 256;
    wtCtx.fillStyle = i % 3 === 0 ? 'rgba(130, 195, 220, 0.22)' : 'rgba(20, 45, 58, 0.28)';
    wtCtx.fillRect(x, y, 26 + (i % 24), 3);
  }
  const waterAlbedo = finalizeTexture(wtCanvas, true, aniso, 8, 8);

  return {
    asphaltAlbedo,
    asphaltBump,
    wetAsphaltAlbedo,
    redWhiteBarrierAlbedo,
    concreteAlbedo,
    concreteBump,
    concreteRoughness,
    steelAlbedo,
    steelBump,
    steelRoughness,
    hazardStripeAlbedo,
    copperPadAlbedo,
    stoneAlbedo,
    stoneBump,
    chaiSignAlbedo,
    milestoneAlbedo,
    truckArtAlbedo,
    buildingFacadeAlbedo,
    waterAlbedo,
    contactShadow,
    dispose: () => {
      asphaltAlbedo.dispose();
      asphaltBump.dispose();
      wetAsphaltAlbedo.dispose();
      redWhiteBarrierAlbedo.dispose();
      concreteAlbedo.dispose();
      concreteBump.dispose();
      concreteRoughness.dispose();
      steelAlbedo.dispose();
      steelBump.dispose();
      steelRoughness.dispose();
      hazardStripeAlbedo.dispose();
      copperPadAlbedo.dispose();
      stoneAlbedo.dispose();
      stoneBump.dispose();
      chaiSignAlbedo.dispose();
      milestoneAlbedo.dispose();
      truckArtAlbedo.dispose();
      buildingFacadeAlbedo.dispose();
      waterAlbedo.dispose();
      contactShadow.dispose();
    },
  };
}
