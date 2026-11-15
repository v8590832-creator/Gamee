import { intersectSphereOBB, isPointInsideBox } from '../physics/math';
import type { Vec3 } from '../types';
import type { PlatformMeshHandle } from '../render/WorldBuilder';
import type { BounceEvent, BounceSystem } from './BounceSystem';
import type { GravityController } from './GravityController';

export interface PhysicsStepOutput {
  grounded: boolean;
  groundY: number;
  hasGroundBelow: boolean;
  bounceEvents: BounceEvent[];
  landedImpact: number;
  inFluid: boolean;
  onSlippery: boolean;
  ridingRoller: boolean;
}

export class PhysicsManager {
  public readonly radius = 0.55;
  private prevPlatformPos = new Map<string, Vec3>();
  private prevPlatformRot = new Map<string, number>();

  public reset(platforms: PlatformMeshHandle[]): void {
    this.prevPlatformPos.clear();
    this.prevPlatformRot.clear();
    for (const p of platforms) {
      this.prevPlatformPos.set(p.def.id, { ...p.currentPos });
      this.prevPlatformRot.set(p.def.id, p.currentRotY);
    }
  }

  public step(
    playerDt: number,
    worldDt: number,
    pos: Vec3,
    vel: Vec3,
    platforms: PlatformMeshHandle[],
    gravity: GravityController,
    bounceSystem: BounceSystem,
    wasGrounded: boolean,
    isSliding: boolean
  ): PhysicsStepOutput {
    const bounceEvents: BounceEvent[] = [];
    let grounded = false;
    let landedImpact = 0;
    let inFluid = false;
    let onSlippery = false;
    let ridingRoller = false;
    const upDir = gravity.getUpDirection();
    const effRadius = isSliding ? 0.36 : this.radius;

    // 1. Update crumbling platform timers
    for (const p of platforms) {
      if (p.def.kind === 'crumbling') {
        if (p.crumbleState === 'shaking') {
          p.crumbleTimer -= worldDt;
          if (p.crumbleTimer <= 0) {
            p.crumbleState = 'fallen';
            p.crumbleTimer = p.def.respawnDelay ?? 3.0;
          }
        } else if (p.crumbleState === 'fallen') {
          p.crumbleTimer -= worldDt;
          if (p.crumbleTimer <= 0) {
            p.crumbleState = 'intact';
          }
        }
      }
    }

    // 2. Apply gravity + zone forces (wind / fluid / puddles)
    vel.x += gravity.currentGravity.x * playerDt;
    vel.y += gravity.currentGravity.y * playerDt;
    vel.z += gravity.currentGravity.z * playerDt;

    for (const p of platforms) {
      if (p.def.kind === 'windZone' || p.def.kind === 'fluidZone') {
        if (isPointInsideBox(pos, p.currentPos, p.def.size, p.def.rotation)) {
          if (p.def.zoneForce) {
            vel.x += p.def.zoneForce.x * playerDt;
            vel.y += p.def.zoneForce.y * playerDt;
            vel.z += p.def.zoneForce.z * playerDt;
          }
          if (p.def.kind === 'fluidZone') {
            inFluid = true;
            const drag = p.def.zoneDrag ?? 1.8;
            const factor = Math.exp(-drag * playerDt);
            vel.x *= factor;
            vel.y *= Math.max(0.75, factor);
            vel.z *= factor;
          }
        }
      } else if (p.def.kind === 'puddle') {
        if (
          Math.abs(pos.x - p.currentPos.x) <= p.def.size.x * 0.5 &&
          Math.abs(pos.z - p.currentPos.z) <= p.def.size.z * 0.5 &&
          Math.abs(pos.y - p.currentPos.y) <= 1.2
        ) {
          onSlippery = true;
        }
      }
    }

    // 3. Substepped collision
    const substeps = 2;
    const subDt = playerDt / substeps;

    for (let s = 0; s < substeps; s++) {
      pos.x += vel.x * subDt;
      pos.y += vel.y * subDt;
      pos.z += vel.z * subDt;

      for (const p of platforms) {
        if (
          p.def.kind === 'gravityZone' ||
          p.def.kind === 'windZone' ||
          p.def.kind === 'fluidZone' ||
          p.def.kind === 'puddle'
        ) {
          continue;
        }
        if (p.def.kind === 'bridge' && !p.active) continue;
        if (p.def.kind === 'crumbling' && p.crumbleState === 'fallen') continue;

        const rot = p.def.kind === 'gear'
          ? { x: 0, y: p.currentRotY, z: 0 }
          : p.def.rotation;

        const hit = intersectSphereOBB(pos, effRadius, p.currentPos, p.def.size, rot);
        if (!hit.hit) continue;

        pos.x += hit.normal.x * hit.penetration;
        pos.y += hit.normal.y * hit.penetration;
        pos.z += hit.normal.z * hit.penetration;

        const alignmentWithUp =
          hit.normal.x * upDir.x + hit.normal.y * upDir.y + hit.normal.z * upDir.z;
        if (alignmentWithUp > 0.48) {
          grounded = true;
          if (p.def.materialStyle === 'wet') onSlippery = true;
          if (p.def.kind === 'roller') ridingRoller = true;

          if (p.def.kind === 'crumbling' && p.crumbleState === 'intact') {
            p.crumbleState = 'shaking';
            p.crumbleTimer = p.def.crumbleDelay ?? 0.85;
          }

          if (s === 0) {
            const prevPos = this.prevPlatformPos.get(p.def.id);
            if (prevPos) {
              pos.x += p.currentPos.x - prevPos.x;
              pos.y += p.currentPos.y - prevPos.y;
              pos.z += p.currentPos.z - prevPos.z;
            }
            if (p.def.kind === 'gear') {
              const prevRot = this.prevPlatformRot.get(p.def.id) ?? p.currentRotY;
              const dTheta = p.currentRotY - prevRot;
              if (Math.abs(dTheta) > 1e-6) {
                const rx = pos.x - p.currentPos.x;
                const rz = pos.z - p.currentPos.z;
                const cos = Math.cos(dTheta);
                const sin = Math.sin(dTheta);
                pos.x = p.currentPos.x + (rx * cos - rz * sin);
                pos.z = p.currentPos.z + (rx * sin + rz * cos);
              }
            }
          }
        }

        const { nextVelocity, event } = bounceSystem.resolveSurfaceBounce(
          vel,
          hit.normal,
          p,
          hit.closestPoint
        );

        const vnBefore = vel.x * hit.normal.x + vel.y * hit.normal.y + vel.z * hit.normal.z;
        if (!wasGrounded && vnBefore < -3.5 && alignmentWithUp > 0.48) {
          landedImpact = Math.max(landedImpact, -vnBefore);
        }

        vel.x = nextVelocity.x;
        vel.y = nextVelocity.y;
        vel.z = nextVelocity.z;

        if (event) {
          bounceEvents.push(event);
          if (event.padHit) grounded = false;
        }
      }
    }

    for (const p of platforms) {
      this.prevPlatformPos.set(p.def.id, { ...p.currentPos });
      this.prevPlatformRot.set(p.def.id, p.currentRotY);
    }

    // Ground shadow ray
    let groundY = pos.y - 20;
    let hasGroundBelow = false;
    let bestDist = Infinity;
    for (const p of platforms) {
      if (
        p.def.kind === 'gravityZone' ||
        p.def.kind === 'windZone' ||
        p.def.kind === 'fluidZone' ||
        p.def.kind === 'puddle'
      ) {
        continue;
      }
      if (p.def.kind === 'bridge' && !p.active) continue;
      if (p.def.kind === 'crumbling' && p.crumbleState === 'fallen') continue;

      const hx = p.def.size.x * 0.5;
      const hz = p.def.size.z * 0.5;
      if (Math.abs(pos.x - p.currentPos.x) <= hx && Math.abs(pos.z - p.currentPos.z) <= hz) {
        const surfY = gravity.playerInverted
          ? p.currentPos.y - p.def.size.y * 0.5
          : p.currentPos.y + p.def.size.y * 0.5;
        const dist = gravity.playerInverted ? surfY - pos.y : pos.y - surfY;
        if (dist >= -0.6 && dist < 16 && dist < bestDist) {
          bestDist = dist;
          groundY = surfY;
          hasGroundBelow = true;
        }
      }
    }

    return {
      grounded,
      groundY,
      hasGroundBelow,
      bounceEvents,
      landedImpact,
      inFluid,
      onSlippery,
      ridingRoller,
    };
  }
}
