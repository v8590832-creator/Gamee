import { computePortalExitVelocity, normalizeVec3 } from '../physics/math';
import type { Vec3 } from '../types';
import type { PortalMeshHandle } from '../render/WorldBuilder';

export class PortalSystem {
  private cooldown = 0;

  public reset(): void {
    this.cooldown = 0;
  }

  public update(
    dt: number,
    playerPos: Vec3,
    playerVel: Vec3,
    portals: PortalMeshHandle[]
  ): { teleported: boolean; newPos: Vec3; newVel: Vec3 } {
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
      return { teleported: false, newPos: playerPos, newVel: playerVel };
    }

    const triggerRadius = 1.65;

    for (const pt of portals) {
      const da = Math.hypot(
        playerPos.x - pt.def.aPos.x,
        playerPos.y - pt.def.aPos.y,
        playerPos.z - pt.def.aPos.z
      );
      if (da < triggerRadius) {
        const outNormal = normalizeVec3(pt.def.bNormal);
        const newPos = {
          x: pt.def.bPos.x + outNormal.x * 2.1,
          y: pt.def.bPos.y + outNormal.y * 2.1,
          z: pt.def.bPos.z + outNormal.z * 2.1,
        };
        const newVel = computePortalExitVelocity(playerVel, outNormal, pt.def.boost ?? 1.1, 11.5);
        this.cooldown = 0.55;
        return { teleported: true, newPos, newVel };
      }

      const db = Math.hypot(
        playerPos.x - pt.def.bPos.x,
        playerPos.y - pt.def.bPos.y,
        playerPos.z - pt.def.bPos.z
      );
      if (db < triggerRadius) {
        const outNormal = normalizeVec3(pt.def.aNormal);
        const newPos = {
          x: pt.def.aPos.x + outNormal.x * 2.1,
          y: pt.def.aPos.y + outNormal.y * 2.1,
          z: pt.def.aPos.z + outNormal.z * 2.1,
        };
        const newVel = computePortalExitVelocity(playerVel, outNormal, pt.def.boost ?? 1.1, 11.5);
        this.cooldown = 0.55;
        return { teleported: true, newPos, newVel };
      }
    }

    return { teleported: false, newPos: playerPos, newVel: playerVel };
  }
}
