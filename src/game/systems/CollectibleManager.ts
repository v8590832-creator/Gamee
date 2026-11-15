import type { Vec3 } from '../types';
import type { CollectibleMeshHandle } from '../render/WorldBuilder';

export class CollectibleManager {
  public collectedIds: string[] = [];

  public reset(): void {
    this.collectedIds = [];
  }

  public checkPickups(
    playerPos: Vec3,
    collectibles: CollectibleMeshHandle[]
  ): { picked: CollectibleMeshHandle | null } {
    for (const col of collectibles) {
      if (col.collected) continue;
      const dist = Math.hypot(
        playerPos.x - col.def.position.x,
        playerPos.y - col.def.position.y,
        playerPos.z - col.def.position.z
      );
      if (dist < 1.35) {
        col.collected = true;
        this.collectedIds.push(col.def.id);
        return { picked: col };
      }
    }
    return { picked: null };
  }
}
