import * as THREE from 'three';
import type { Vec3, VehicleKind } from '../types';
import type { ProceduralTextureSet } from './ProceduralTextures';

export interface VehicleBuildResult {
  group: THREE.Group;
  size: Vec3;
  wheels: THREE.Mesh[];
}

export class VehicleAssetPool {
  private readonly disposables: { dispose: () => void }[] = [];
  private readonly matRubber: THREE.MeshStandardMaterial;
  private readonly matRim: THREE.MeshStandardMaterial;
  private readonly matGlass: THREE.MeshStandardMaterial;
  private readonly matChrome: THREE.MeshStandardMaterial;
  private readonly matHeadlight: THREE.MeshStandardMaterial;
  private readonly matTaillight: THREE.MeshStandardMaterial;
  private readonly matAutoGreen: THREE.MeshStandardMaterial;
  private readonly matAutoYellow: THREE.MeshStandardMaterial;
  private readonly matTruckCab: THREE.MeshStandardMaterial;
  private readonly matTruckCargo: THREE.MeshStandardMaterial;
  private readonly matTruckArt: THREE.MeshStandardMaterial;
  private readonly matBusRed: THREE.MeshStandardMaterial;
  private readonly matBusCream: THREE.MeshStandardMaterial;
  private readonly matCarBody: THREE.MeshStandardMaterial;
  private readonly matDarkTrim: THREE.MeshStandardMaterial;

  private readonly wheelGeo: THREE.CylinderGeometry;
  private readonly wheelHubGeo: THREE.CylinderGeometry;

  constructor(textures: ProceduralTextureSet) {
    const track = <T extends { dispose: () => void }>(item: T): T => {
      this.disposables.push(item);
      return item;
    };

    this.matRubber = track(
      new THREE.MeshStandardMaterial({ color: '#1b1d22', roughness: 0.92, metalness: 0.04 })
    );
    this.matRim = track(
      new THREE.MeshStandardMaterial({ color: '#aeb7c4', roughness: 0.3, metalness: 0.8 })
    );
    this.matGlass = track(
      new THREE.MeshStandardMaterial({
        color: '#223548',
        roughness: 0.1,
        metalness: 0.35,
        transparent: true,
        opacity: 0.85,
      })
    );
    this.matChrome = track(
      new THREE.MeshStandardMaterial({ color: '#d8e0ea', roughness: 0.18, metalness: 0.9 })
    );
    this.matHeadlight = track(
      new THREE.MeshStandardMaterial({
        color: '#fff6d6',
        emissive: '#ffe699',
        emissiveIntensity: 0.9,
        roughness: 0.2,
      })
    );
    this.matTaillight = track(
      new THREE.MeshStandardMaterial({
        color: '#e63939',
        emissive: '#c82020',
        emissiveIntensity: 0.8,
        roughness: 0.25,
      })
    );
    this.matDarkTrim = track(
      new THREE.MeshStandardMaterial({ color: '#242931', roughness: 0.78, metalness: 0.22 })
    );

    this.matAutoGreen = track(
      new THREE.MeshStandardMaterial({ color: '#1d7842', roughness: 0.48, metalness: 0.12 })
    );
    this.matAutoYellow = track(
      new THREE.MeshStandardMaterial({ color: '#efb622', roughness: 0.7, metalness: 0.04 })
    );
    this.matTruckCab = track(
      new THREE.MeshStandardMaterial({ color: '#d44824', roughness: 0.42, metalness: 0.22 })
    );
    this.matTruckCargo = track(
      new THREE.MeshStandardMaterial({ color: '#c4832d', roughness: 0.72, metalness: 0.06 })
    );
    this.matTruckArt = track(
      new THREE.MeshStandardMaterial({
        map: textures.truckArtAlbedo,
        roughness: 0.62,
        metalness: 0.05,
      })
    );
    this.matBusRed = track(
      new THREE.MeshStandardMaterial({ color: '#b42b2b', roughness: 0.44, metalness: 0.18 })
    );
    this.matBusCream = track(
      new THREE.MeshStandardMaterial({ color: '#ede6d8', roughness: 0.56, metalness: 0.06 })
    );
    this.matCarBody = track(
      new THREE.MeshStandardMaterial({ color: '#d5dde7', roughness: 0.28, metalness: 0.42 })
    );

    this.wheelGeo = track(new THREE.CylinderGeometry(0.36, 0.36, 0.25, 14));
    this.wheelHubGeo = track(new THREE.CylinderGeometry(0.18, 0.18, 0.27, 10));
  }

  private createWheel(radiusScale = 1): THREE.Mesh {
    const tire = new THREE.Mesh(this.wheelGeo, this.matRubber);
    tire.rotation.z = Math.PI / 2;
    tire.scale.set(radiusScale, 1, radiusScale);
    const hub = new THREE.Mesh(this.wheelHubGeo, this.matRim);
    tire.add(hub);
    return tire;
  }

  public build(kind: VehicleKind): VehicleBuildResult {
    const g = new THREE.Group();
    const wheels: THREE.Mesh[] = [];
    const trackGeo = <T extends THREE.BufferGeometry>(geo: T): T => {
      this.disposables.push(geo);
      return geo;
    };

    if (kind === 'auto') {
      // Iconic 3-Wheeler Indian Auto-Rickshaw
      const lowerTub = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.42, 0.62, 2.05)), this.matAutoGreen);
      lowerTub.position.set(0, 0.52, -0.05);
      lowerTub.castShadow = true;

      const frontCowling = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.45, 0.68, 0.72, 10, 1, false, -Math.PI * 0.5, Math.PI)),
        this.matAutoGreen
      );
      frontCowling.position.set(0, 0.54, 0.85);

      const canopy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.46, 0.72, 1.75)), this.matAutoYellow);
      canopy.position.set(0, 1.18, -0.18);
      canopy.castShadow = true;

      const windshield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.16, 0.52, 0.08)), this.matGlass);
      windshield.position.set(0, 1.15, 0.75);
      windshield.rotation.x = -0.22;

      const bumper = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.48, 0.12, 0.14)), this.matChrome);
      bumper.position.set(0, 0.34, 1.24);

      const headlamp = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 12)), this.matHeadlight);
      headlamp.rotation.x = Math.PI / 2;
      headlamp.position.set(0, 0.66, 1.28);

      const tailL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.22, 0.12, 0.06)), this.matTaillight);
      tailL.position.set(-0.48, 0.58, -1.09);
      const tailR = tailL.clone();
      tailR.position.x = 0.48;

      const frontWheel = this.createWheel(0.75);
      frontWheel.position.set(0, 0.27, 1.0);
      const rearL = this.createWheel(0.78);
      rearL.position.set(-0.66, 0.28, -0.68);
      const rearR = this.createWheel(0.78);
      rearR.position.set(0.66, 0.28, -0.68);
      wheels.push(frontWheel, rearL, rearR);

      g.add(lowerTub, frontCowling, canopy, windshield, bumper, headlamp, tailL, tailR, frontWheel, rearL, rearR);
      return { group: g, size: { x: 1.55, y: 1.65, z: 2.35 }, wheels };
    }

    if (kind === 'truck') {
      // Authentic Indian Highway Cargo Lorry with painted cab, visor, tarpaulin bed & "HORN OK PLEASE" rear
      const chassis = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.15, 0.26, 5.3)), this.matDarkTrim);
      chassis.position.set(0, 0.52, -0.1);

      const cabBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.26, 1.55, 1.65)), this.matTruckCab);
      cabBody.position.set(0, 1.38, 1.55);
      cabBody.castShadow = true;

      const engineNose = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.1, 0.92, 0.65)), this.matTruckCab);
      engineNose.position.set(0, 1.06, 2.52);

      const grille = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.5, 0.48, 0.08)), this.matChrome);
      grille.position.set(0, 1.02, 2.86);

      const windshield = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.98, 0.58, 0.08)), this.matGlass);
      windshield.position.set(0, 1.72, 2.38);

      const sunVisor = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.3, 0.16, 0.42)), this.matAutoYellow);
      sunVisor.position.set(0, 2.15, 2.42);
      sunVisor.rotation.x = 0.2;

      const cargoBox = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.42, 1.98, 3.5)), this.matTruckCargo);
      cargoBox.position.set(0, 1.62, -1.08);
      cargoBox.castShadow = true;

      const rearArt = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(2.24, 1.5)), this.matTruckArt);
      rearArt.position.set(0, 1.62, -2.84);
      rearArt.rotation.y = Math.PI;

      const tarpTop = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(1.18, 1.18, 3.48, 12, 1, false, 0, Math.PI)),
        this.matDarkTrim
      );
      tarpTop.rotation.z = Math.PI / 2;
      tarpTop.rotation.y = Math.PI / 2;
      tarpTop.scale.set(1, 0.35, 1);
      tarpTop.position.set(0, 2.6, -1.08);

      const lampL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.18, 0.08)), this.matHeadlight);
      lampL.position.set(-0.78, 0.85, 2.86);
      const lampR = lampL.clone();
      lampR.position.x = 0.78;

      for (const [wx, wz] of [[-1.08, 1.9], [1.08, 1.9], [-1.08, -1.85], [1.08, -1.85], [-1.08, -0.75], [1.08, -0.75]]) {
        const w = this.createWheel(1.18);
        w.position.set(wx, 0.42, wz);
        wheels.push(w);
        g.add(w);
      }

      g.add(chassis, cabBody, engineNose, grille, windshield, sunVisor, cargoBox, rearArt, tarpTop, lampL, lampR);
      return { group: g, size: { x: 2.5, y: 2.8, z: 5.7 }, wheels };
    }

    if (kind === 'bus') {
      // State Highway Express Bus
      const hull = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.38, 2.15, 6.2)), this.matBusRed);
      hull.position.y = 1.52;
      hull.castShadow = true;

      const creamBand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.42, 0.56, 6.24)), this.matBusCream);
      creamBand.position.y = 1.52;

      const windowBand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.41, 0.62, 5.6)), this.matGlass);
      windowBand.position.set(0, 2.02, -0.05);

      const frontGlass = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.05, 0.75, 0.1)), this.matGlass);
      frontGlass.position.set(0, 1.95, 3.11);

      const roofRack = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.0, 0.18, 4.6)), this.matDarkTrim);
      roofRack.position.set(0, 2.68, -0.2);

      const bumperF = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.42, 0.24, 0.18)), this.matDarkTrim);
      bumperF.position.set(0, 0.55, 3.12);

      const lampL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.36, 0.18, 0.08)), this.matHeadlight);
      lampL.position.set(-0.82, 0.85, 3.13);
      const lampR = lampL.clone();
      lampR.position.x = 0.82;

      const tailL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.18, 0.08)), this.matTaillight);
      tailL.position.set(-0.82, 0.85, -3.12);
      const tailR = tailL.clone();
      tailR.position.x = 0.82;

      for (const [wx, wz] of [[-1.12, 2.0], [1.12, 2.0], [-1.12, -1.95], [1.12, -1.95]]) {
        const w = this.createWheel(1.12);
        w.position.set(wx, 0.4, wz);
        wheels.push(w);
        g.add(w);
      }

      g.add(hull, creamBand, windowBand, frontGlass, roofRack, bumperF, lampL, lampR, tailL, tailR);
      return { group: g, size: { x: 2.45, y: 2.75, z: 6.25 }, wheels };
    }

    // Highway Sedan / Cruiser
    const bodyLower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.88, 0.64, 3.65)), this.matCarBody);
    bodyLower.position.set(0, 0.58, 0);
    bodyLower.castShadow = true;

    const cabin = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.6, 0.56, 1.85)), this.matCarBody);
    cabin.position.set(0, 1.15, -0.18);
    cabin.castShadow = true;

    const glassBand = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.63, 0.42, 1.78)), this.matGlass);
    glassBand.position.set(0, 1.14, -0.18);

    const grille = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.1, 0.24, 0.08)), this.matDarkTrim);
    grille.position.set(0, 0.56, 1.84);

    const bumperF = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.9, 0.18, 0.16)), this.matDarkTrim);
    bumperF.position.set(0, 0.36, 1.82);

    const lampL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.32, 0.15, 0.08)), this.matHeadlight);
    lampL.position.set(-0.68, 0.66, 1.84);
    const lampR = lampL.clone();
    lampR.position.x = 0.68;

    const tailL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.34, 0.14, 0.08)), this.matTaillight);
    tailL.position.set(-0.68, 0.68, -1.84);
    const tailR = tailL.clone();
    tailR.position.x = 0.68;

    for (const [wx, wz] of [[-0.9, 1.12], [0.9, 1.12], [-0.9, -1.12], [0.9, -1.12]]) {
      const w = this.createWheel(0.95);
      w.position.set(wx, 0.34, wz);
      wheels.push(w);
      g.add(w);
    }

    g.add(bodyLower, cabin, glassBand, grille, bumperF, lampL, lampR, tailL, tailR);
    return { group: g, size: { x: 1.95, y: 1.48, z: 3.7 }, wheels };
  }

  public dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}
