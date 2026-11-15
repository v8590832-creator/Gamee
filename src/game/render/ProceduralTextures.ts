import * as THREE from 'three';

export interface ProceduralTextureSet {
  asphaltAlbedo: THREE.CanvasTexture;
  asphaltBump: THREE.CanvasTexture;
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
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createHighwaySignTexture(label: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#146b3a';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#f2f5f7';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 140);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 256, 62);

  ctx.fillStyle = '#f2b830';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('BHARAT HIGHWAY AUTHORITY  ▲  SPEED & BOUNCE', 256, 114);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeCanvas(size = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  repeat = 2
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.max(1, Math.min(8, maxAnisotropy));

  // 1. Weathered Board-Formed Concrete (Albedo + Bump + Roughness)
  const [cCanvas, cCtx] = makeCanvas(512);
  cCtx.fillStyle = '#7c828a';
  cCtx.fillRect(0, 0, 512, 512);

  // Subtle aggregate speckle & weathering variation
  for (let i = 0; i < 6500; i++) {
    const x = (i * 97) % 512;
    const y = (i * 193) % 512;
    const v = 104 + ((i * 29) % 44);
    cCtx.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
    cCtx.fillRect(x, y, 2 + (i % 3), 2 + ((i + 1) % 2));
  }
  // Slab expansion seams
  cCtx.strokeStyle = 'rgba(20, 24, 30, 0.45)';
  cCtx.lineWidth = 3;
  cCtx.strokeRect(2, 2, 508, 508);
  cCtx.beginPath();
  cCtx.moveTo(0, 256);
  cCtx.lineTo(512, 256);
  cCtx.moveTo(256, 0);
  cCtx.lineTo(256, 512);
  cCtx.stroke();

  // Formwork tie-rod recesses in corners of each tile
  const tiePoints = [
    [48, 48], [208, 48], [48, 208], [208, 208],
    [304, 48], [464, 48], [304, 208], [464, 208],
    [48, 304], [208, 304], [48, 464], [208, 464],
    [304, 304], [464, 304], [304, 464], [464, 464],
  ];
  for (const [tx, ty] of tiePoints) {
    cCtx.fillStyle = 'rgba(24, 28, 34, 0.55)';
    cCtx.beginPath();
    cCtx.arc(tx, ty, 5, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.strokeStyle = 'rgba(195, 200, 208, 0.2)';
    cCtx.lineWidth = 1.5;
    cCtx.stroke();
  }

  // Subtle hairline fracture crack
  cCtx.strokeStyle = 'rgba(28, 30, 35, 0.32)';
  cCtx.lineWidth = 1.5;
  cCtx.beginPath();
  cCtx.moveTo(110, 0);
  cCtx.lineTo(132, 68);
  cCtx.lineTo(124, 140);
  cCtx.lineTo(155, 210);
  cCtx.stroke();

  const concreteAlbedo = finalizeTexture(cCanvas, true, aniso, 2);

  // Concrete Bump
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
  cbCtx.beginPath();
  cbCtx.moveTo(0, 256);
  cbCtx.lineTo(512, 256);
  cbCtx.moveTo(256, 0);
  cbCtx.lineTo(256, 512);
  cbCtx.stroke();
  const concreteBump = finalizeTexture(cbCanvas, false, aniso, 2);

  // Concrete Roughness (worn smoother traffic lanes vs rougher outer concrete)
  const [crCanvas, crCtx] = makeCanvas(256);
  crCtx.fillStyle = '#dcdcdc';
  crCtx.fillRect(0, 0, 256, 256);
  const laneGrad = crCtx.createLinearGradient(0, 0, 256, 0);
  laneGrad.addColorStop(0, 'rgba(230,230,230,0.9)');
  laneGrad.addColorStop(0.5, 'rgba(170,170,170,0.8)');
  laneGrad.addColorStop(1, 'rgba(230,230,230,0.9)');
  crCtx.fillStyle = laneGrad;
  crCtx.fillRect(0, 0, 256, 256);
  const concreteRoughness = finalizeTexture(crCanvas, false, aniso, 2);

  // 2. Brushed & Scratched Industrial Steel Plate (Albedo + Bump + Roughness)
  const [sCanvas, sCtx] = makeCanvas(512);
  sCtx.fillStyle = '#48505a';
  sCtx.fillRect(0, 0, 512, 512);
  // Brushed grain
  for (let i = 0; i < 900; i++) {
    const y = (i * 41) % 512;
    const x = (i * 113) % 440;
    const w = 24 + (i % 64);
    const v = 64 + (i % 24);
    sCtx.fillStyle = `rgba(${v + 8},${v + 12},${v + 18},0.28)`;
    sCtx.fillRect(x, y, w, 1);
  }
  // Panel grid seams + edge wear highlights
  sCtx.strokeStyle = '#252a30';
  sCtx.lineWidth = 4;
  for (let p = 0; p <= 512; p += 128) {
    sCtx.beginPath();
    sCtx.moveTo(p, 0);
    sCtx.lineTo(p, 512);
    sCtx.moveTo(0, p);
    sCtx.lineTo(512, p);
    sCtx.stroke();
  }
  // Rivets at panel corners
  sCtx.fillStyle = '#6f7985';
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

  // 3. Weathered Industrial Caution / Hazard Edge Stripe
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
  // Scuffing/wear so it doesn't look brand-new plastic
  for (let i = 0; i < 900; i++) {
    const x = (i * 71) % 256;
    const y = (i * 113) % 256;
    hCtx.fillStyle = 'rgba(28, 30, 34, 0.35)';
    hCtx.fillRect(x, y, 3, 2);
  }
  const hazardStripeAlbedo = finalizeTexture(hCanvas, true, aniso, 3);

  // 4. Handcrafted Copper Pneumatic Bounce Plate
  const [pCanvas, pCtx] = makeCanvas(256);
  pCtx.fillStyle = '#754120';
  pCtx.fillRect(0, 0, 256, 256);
  // Radial brushed tooling
  pCtx.strokeStyle = 'rgba(218, 148, 78, 0.25)';
  pCtx.lineWidth = 2;
  for (let r = 18; r < 120; r += 8) {
    pCtx.beginPath();
    pCtx.arc(128, 128, r, 0, Math.PI * 2);
    pCtx.stroke();
  }
  // Concentric pneumatic pressure rings
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

  // 5. Weathered Stratified Stone / Limestone (Albedo + Bump)
  const [stCanvas, stCtx] = makeCanvas(512);
  stCtx.fillStyle = '#7a756d';
  stCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 32) {
    const shade = 110 + ((y * 7) % 18);
    stCtx.fillStyle = `rgba(${shade + 4}, ${shade}, ${shade - 5}, 0.35)`;
    stCtx.fillRect(0, y, 512, 30);
    stCtx.fillStyle = 'rgba(32, 28, 24, 0.22)';
    stCtx.fillRect(0, y + 30, 512, 2);
  }
  for (let i = 0; i < 3800; i++) {
    const x = (i * 89) % 512;
    const y = (i * 193) % 512;
    const v = 90 + ((i * 23) % 48);
    stCtx.fillStyle = `rgb(${v + 4},${v + 1},${v - 3})`;
    stCtx.fillRect(x, y, 3, 3);
  }
  const stoneAlbedo = finalizeTexture(stCanvas, true, aniso, 2);

  const [stbCanvas, stbCtx] = makeCanvas(256);
  stbCtx.fillStyle = '#808080';
  stbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2400; i++) {
    const x = (i * 67) % 256;
    const y = (i * 149) % 256;
    const v = 96 + ((i * 37) % 68);
    stbCtx.fillStyle = `rgb(${v},${v},${v})`;
    stbCtx.fillRect(x, y, 3, 2);
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

  // 7. Indian Highway Asphalt Tarmac (Albedo + Bump)
  const [asCanvas, asCtx] = makeCanvas(512);
  asCtx.fillStyle = '#33363d';
  asCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8500; i++) {
    const x = (i * 101) % 512;
    const y = (i * 199) % 512;
    const v = 38 + ((i * 23) % 34);
    asCtx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    asCtx.fillRect(x, y, 2, 2);
  }
  // Subtle darker wheel-track wear lanes
  asCtx.fillStyle = 'rgba(18, 20, 24, 0.25)';
  asCtx.fillRect(104, 0, 80, 512);
  asCtx.fillRect(328, 0, 80, 512);
  // Crisp white shoulder lines
  asCtx.fillStyle = '#d9dde3';
  asCtx.fillRect(18, 0, 10, 512);
  asCtx.fillRect(484, 0, 10, 512);
  // Broken yellow/white center highway dashes
  asCtx.fillStyle = '#e6b83a';
  for (let y = 16; y < 512; y += 96) {
    asCtx.fillRect(250, y, 12, 52);
  }
  const asphaltAlbedo = finalizeTexture(asCanvas, true, aniso, 1);

  const [abCanvas, abCtx] = makeCanvas(256);
  abCtx.fillStyle = '#808080';
  abCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const x = (i * 73) % 256;
    const y = (i * 139) % 256;
    const v = 96 + ((i * 29) % 68);
    abCtx.fillStyle = `rgb(${v},${v},${v})`;
    abCtx.fillRect(x, y, 2, 2);
  }
  const asphaltBump = finalizeTexture(abCanvas, false, aniso, 2);

  // 8. Red & White Indian Roadside Jersey Barrier Stripes
  const [rwCanvas, rwCtx] = makeCanvas(256);
  rwCtx.fillStyle = '#e8e4dc';
  rwCtx.fillRect(0, 0, 256, 256);
  rwCtx.fillStyle = '#c9342c';
  for (let x = 0; x < 256; x += 64) {
    rwCtx.fillRect(x, 0, 32, 256);
  }
  for (let i = 0; i < 500; i++) {
    rwCtx.fillStyle = 'rgba(30, 24, 20, 0.22)';
    rwCtx.fillRect((i * 83) % 256, (i * 127) % 256, 3, 2);
  }
  const redWhiteBarrierAlbedo = finalizeTexture(rwCanvas, true, aniso, 2);

  return {
    asphaltAlbedo,
    asphaltBump,
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
    contactShadow,
    dispose: () => {
      asphaltAlbedo.dispose();
      asphaltBump.dispose();
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
      contactShadow.dispose();
    },
  };
}
