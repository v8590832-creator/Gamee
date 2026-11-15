import * as THREE from 'three';

const MAX_PARTICLES = 220;

interface ParticleSlot {
  active: boolean;
  px: number;
  py: number;
  pz: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  life: number;
  size: number;
  color: THREE.Color;
}

const _dummy = new THREE.Object3D();
const _tempColor = new THREE.Color();

/**
 * Zero-GC pooled InstancedMesh particle ring buffer for bounce sparks,
 * dash trails, portal warps, and shard bursts.
 */
export class ParticlePool {
  public readonly mesh: THREE.InstancedMesh;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly slots: ParticleSlot[];
  private cursor = 0;

  constructor() {
    this.geometry = new THREE.OctahedronGeometry(0.12, 0);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    this.slots = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.slots.push({
        active: false,
        px: 0,
        py: -999,
        pz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        life: 0.5,
        size: 1,
        color: new THREE.Color('#e59a3c'),
      });
      _dummy.position.set(0, -999, 0);
      _dummy.scale.set(0, 0, 0);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, _tempColor.set('#e59a3c'));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public spawnBurst(
    x: number,
    y: number,
    z: number,
    count: number,
    colorHex: string,
    speed = 6,
    life = 0.55,
    size = 1.0,
    upBias = 2.5
  ): void {
    _tempColor.set(colorHex);
    for (let i = 0; i < count; i++) {
      const slot = this.slots[this.cursor];
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.7;
      const sp = speed * (0.45 + Math.random() * 0.75);

      slot.active = true;
      slot.px = x + (Math.random() - 0.5) * 0.35;
      slot.py = y + (Math.random() - 0.5) * 0.35;
      slot.pz = z + (Math.random() - 0.5) * 0.35;
      slot.vx = Math.cos(theta) * Math.sin(phi) * sp;
      slot.vy = Math.cos(phi) * sp * 0.6 + upBias;
      slot.vz = Math.sin(theta) * Math.sin(phi) * sp;
      slot.age = 0;
      slot.life = life * (0.75 + Math.random() * 0.5);
      slot.size = size * (0.7 + Math.random() * 0.6);
      slot.color.copy(_tempColor);
    }
  }

  public spawnTrailPoint(x: number, y: number, z: number, colorHex: string, size = 0.75): void {
    const slot = this.slots[this.cursor];
    this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    slot.active = true;
    slot.px = x + (Math.random() - 0.5) * 0.16;
    slot.py = y + (Math.random() - 0.5) * 0.16;
    slot.pz = z + (Math.random() - 0.5) * 0.16;
    slot.vx = (Math.random() - 0.5) * 0.4;
    slot.vy = 0.3;
    slot.vz = (Math.random() - 0.5) * 0.4;
    slot.age = 0;
    slot.life = 0.35;
    slot.size = size;
    slot.color.set(colorHex);
  }

  public update(dt: number): void {
    let matrixDirty = false;
    let colorDirty = false;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const s = this.slots[i];
      if (!s.active) continue;

      matrixDirty = true;
      s.age += dt;
      if (s.age >= s.life) {
        s.active = false;
        _dummy.position.set(0, -999, 0);
        _dummy.scale.set(0, 0, 0);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      s.vy -= 9.5 * dt;
      s.px += s.vx * dt;
      s.py += s.vy * dt;
      s.pz += s.vz * dt;

      const t = 1 - s.age / s.life;
      const sc = s.size * t;
      _dummy.position.set(s.px, s.py, s.pz);
      _dummy.rotation.set(s.age * 4, s.age * 3, 0);
      _dummy.scale.set(sc, sc, sc);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, s.color);
      colorDirty = true;
    }

    if (matrixDirty) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    if (colorDirty && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.dispose();
  }
}
