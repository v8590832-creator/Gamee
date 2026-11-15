import { isPointInsideBox } from '../physics/math';
import type { Vec3 } from '../types';
import type { PlatformMeshHandle } from '../render/WorldBuilder';

export class GravityController {
  public playerInverted = false;
  public cooldown = 0;
  public readonly maxCooldown = 0.65;
  public currentGravity: Vec3 = { x: 0, y: -24, z: 0 };
  public targetGravity: Vec3 = { x: 0, y: -24, z: 0 };
  public inZone = false;

  public reset(): void {
    this.playerInverted = false;
    this.cooldown = 0;
    this.currentGravity = { x: 0, y: -24, z: 0 };
    this.targetGravity = { x: 0, y: -24, z: 0 };
    this.inZone = false;
  }

  public tryToggle(allowed: boolean): boolean {
    if (!allowed || this.cooldown > 0) return false;
    this.playerInverted = !this.playerInverted;
    this.cooldown = this.maxCooldown;
    return true;
  }

  public update(dt: number, playerPos: Vec3, platforms: PlatformMeshHandle[]): void {
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }

    let zoneOverride: Vec3 | null = null;
    for (const p of platforms) {
      if (p.def.kind === 'gravityZone' && p.def.zoneGravity) {
        if (isPointInsideBox(playerPos, p.currentPos, p.def.size, p.def.rotation)) {
          zoneOverride = p.def.zoneGravity;
          break;
        }
      }
    }

    this.inZone = zoneOverride !== null;
    if (zoneOverride) {
      // Zone flips relative to player toggle so Q inside a zone can still reverse if desired
      this.targetGravity = this.playerInverted
        ? { x: -zoneOverride.x, y: -zoneOverride.y, z: -zoneOverride.z }
        : { ...zoneOverride };
    } else {
      this.targetGravity = { x: 0, y: this.playerInverted ? 22 : -24, z: 0 };
    }

    const alpha = 1 - Math.exp(-14 * dt);
    this.currentGravity.x += (this.targetGravity.x - this.currentGravity.x) * alpha;
    this.currentGravity.y += (this.targetGravity.y - this.currentGravity.y) * alpha;
    this.currentGravity.z += (this.targetGravity.z - this.currentGravity.z) * alpha;
  }

  public getUpDirection(): Vec3 {
    const len = Math.hypot(this.currentGravity.x, this.currentGravity.y, this.currentGravity.z);
    if (len < 1e-4) return { x: 0, y: 1, z: 0 };
    return {
      x: -this.currentGravity.x / len,
      y: -this.currentGravity.y / len,
      z: -this.currentGravity.z / len,
    };
  }
}
