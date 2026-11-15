import { computeBounceVelocity } from '../physics/math';
import type { Vec3 } from '../types';
import type { PlatformMeshHandle } from '../render/WorldBuilder';

export interface BounceEvent {
  padHit: boolean;
  impactSpeed: number;
  position: Vec3;
}

export class BounceSystem {
  public comboBounces = 0;

  public reset(): void {
    this.comboBounces = 0;
  }

  public resolveSurfaceBounce(
    velocity: Vec3,
    normal: Vec3,
    platform: PlatformMeshHandle,
    contactPoint: Vec3
  ): { nextVelocity: Vec3; event: BounceEvent | null } {
    if (platform.def.kind === 'bounce') {
      const padForce = platform.def.bounceForce ?? 19;
      const restitution = platform.def.restitution ?? 0.72;
      const res = computeBounceVelocity(
        velocity,
        normal,
        restitution,
        padForce,
        platform.def.bounceDirection
      );
      platform.padPulse = 1.0;
      this.comboBounces += 1;
      return {
        nextVelocity: res.nextVelocity,
        event: {
          padHit: true,
          impactSpeed: Math.max(res.impactSpeed, padForce * 0.5),
          position: contactPoint,
        },
      };
    }

    // Standard material surface bounce
    const matRestitution =
      platform.def.materialStyle === 'steel'
        ? 0.28
        : platform.def.materialStyle === 'copper'
        ? 0.35
        : 0.16;

    const res = computeBounceVelocity(velocity, normal, matRestitution, 0);
    if (res.impactSpeed > 4.5) {
      return {
        nextVelocity: res.nextVelocity,
        event: {
          padHit: false,
          impactSpeed: res.impactSpeed,
          position: contactPoint,
        },
      };
    }

    return {
      nextVelocity: res.nextVelocity,
      event: null,
    };
  }
}
