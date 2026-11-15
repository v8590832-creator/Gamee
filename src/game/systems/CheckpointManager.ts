import type { Vec3 } from '../types';
import type { CheckpointMeshHandle } from '../render/WorldBuilder';

export class CheckpointManager {
  public activeSpawn: Vec3 = { x: 0, y: 1, z: 0 };
  public activeLabel = 'Launch Deck';
  public activeGravityInverted = false;
  private activeIndex = 0;

  public reset(initialSpawn: Vec3): void {
    this.activeSpawn = { ...initialSpawn };
    this.activeLabel = 'Launch Deck';
    this.activeGravityInverted = false;
    this.activeIndex = 0;
  }

  public checkTriggers(
    playerPos: Vec3,
    gravityInverted: boolean,
    checkpoints: CheckpointMeshHandle[],
    accentColor: string
  ): string | null {
    for (const cp of checkpoints) {
      if (cp.activated) continue;
      const dx = playerPos.x - cp.def.position.x;
      const dy = playerPos.y - (cp.def.position.y + 0.8);
      const dz = playerPos.z - cp.def.position.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 2.2) {
        cp.activated = true;
        cp.beaconMat.color.set(accentColor);
        cp.beaconMat.emissive.set(accentColor);
        cp.beaconMat.emissiveIntensity = 0.9;
        if (cp.def.index >= this.activeIndex) {
          this.activeIndex = cp.def.index;
          this.activeSpawn = {
            x: cp.def.position.x,
            y: cp.def.position.y + (gravityInverted ? -1.1 : 1.1),
            z: cp.def.position.z,
          };
          this.activeLabel = cp.def.label;
          this.activeGravityInverted = gravityInverted;
        }
        return cp.def.label;
      }
    }
    return null;
  }
}
