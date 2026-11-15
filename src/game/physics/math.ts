import type { Vec3 } from '../types';

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scaleVec3(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function dotVec3(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function lengthVec3(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function normalizeVec3(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len < 1e-6) return { x: 0, y: 1, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function dampScalar(current: number, target: number, lambda: number, dt: number): number {
  const t = 1 - Math.exp(-lambda * dt);
  return current + (target - current) * t;
}

export function rotateVec3ByEuler(v: Vec3, rot: Vec3): Vec3 {
  // Intrinsic XYZ rotation (matching Three.js default Euler 'XYZ')
  const cx = Math.cos(rot.x), sx = Math.sin(rot.x);
  const cy = Math.cos(rot.y), sy = Math.sin(rot.y);
  const cz = Math.cos(rot.z), sz = Math.sin(rot.z);

  // Rotate around X
  const y1 = v.y * cx - v.z * sx;
  const z1 = v.y * sx + v.z * cx;
  const x1 = v.x;

  // Rotate around Y
  const x2 = x1 * cy + z1 * sy;
  const z2 = -x1 * sy + z1 * cy;
  const y2 = y1;

  // Rotate around Z
  const x3 = x2 * cz - y2 * sz;
  const y3 = x2 * sz + y2 * cz;
  const z3 = z2;

  return { x: x3, y: y3, z: z3 };
}

export function inverseRotateVec3ByEuler(v: Vec3, rot: Vec3): Vec3 {
  // Inverse of XYZ = Z(-z) -> Y(-y) -> X(-x)
  const cx = Math.cos(-rot.x), sx = Math.sin(-rot.x);
  const cy = Math.cos(-rot.y), sy = Math.sin(-rot.y);
  const cz = Math.cos(-rot.z), sz = Math.sin(-rot.z);

  // Inverse Z
  const x1 = v.x * cz - v.y * sz;
  const y1 = v.x * sz + v.y * cz;
  const z1 = v.z;

  // Inverse Y
  const x2 = x1 * cy + z1 * sy;
  const z2 = -x1 * sy + z1 * cy;
  const y2 = y1;

  // Inverse X
  const y3 = y2 * cx - z2 * sx;
  const z3 = y2 * sx + z2 * cx;
  const x3 = x2;

  return { x: x3, y: y3, z: z3 };
}

export interface SphereBoxHit {
  hit: boolean;
  normal: Vec3; // points outward from box surface toward sphere
  penetration: number;
  closestPoint: Vec3;
}

/**
 * Computes collision between a sphere (center, radius) and an oriented box
 * (boxCenter, boxSize = full extents, boxRot = Euler XYZ radians).
 */
export function intersectSphereOBB(
  sphereCenter: Vec3,
  radius: number,
  boxCenter: Vec3,
  boxSize: Vec3,
  boxRot?: Vec3
): SphereBoxHit {
  const rel = subVec3(sphereCenter, boxCenter);
  const local = boxRot && (boxRot.x !== 0 || boxRot.y !== 0 || boxRot.z !== 0)
    ? inverseRotateVec3ByEuler(rel, boxRot)
    : rel;

  const hx = boxSize.x * 0.5;
  const hy = boxSize.y * 0.5;
  const hz = boxSize.z * 0.5;

  const clampedX = clamp(local.x, -hx, hx);
  const clampedY = clamp(local.y, -hy, hy);
  const clampedZ = clamp(local.z, -hz, hz);

  const dx = local.x - clampedX;
  const dy = local.y - clampedY;
  const dz = local.z - clampedZ;
  const distSq = dx * dx + dy * dy + dz * dz;

  if (distSq > radius * radius) {
    return {
      hit: false,
      normal: { x: 0, y: 1, z: 0 },
      penetration: 0,
      closestPoint: boxCenter,
    };
  }

  let localNormal: Vec3;
  let penetration: number;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    localNormal = { x: dx / dist, y: dy / dist, z: dz / dist };
    penetration = radius - dist;
  } else {
    // Center is inside the box; push out along minimum penetration axis
    const penX = hx - Math.abs(local.x);
    const penY = hy - Math.abs(local.y);
    const penZ = hz - Math.abs(local.z);
    if (penY <= penX && penY <= penZ) {
      localNormal = { x: 0, y: local.y >= 0 ? 1 : -1, z: 0 };
      penetration = radius + penY;
    } else if (penX <= penZ) {
      localNormal = { x: local.x >= 0 ? 1 : -1, y: 0, z: 0 };
      penetration = radius + penX;
    } else {
      localNormal = { x: 0, y: 0, z: local.z >= 0 ? 1 : -1 };
      penetration = radius + penZ;
    }
  }

  const hasRot = boxRot && (boxRot.x !== 0 || boxRot.y !== 0 || boxRot.z !== 0);
  const worldNormal = hasRot ? normalizeVec3(rotateVec3ByEuler(localNormal, boxRot!)) : localNormal;
  const worldClosest = addVec3(
    boxCenter,
    hasRot ? rotateVec3ByEuler({ x: clampedX, y: clampedY, z: clampedZ }, boxRot!) : { x: clampedX, y: clampedY, z: clampedZ }
  );

  return {
    hit: true,
    normal: worldNormal,
    penetration,
    closestPoint: worldClosest,
  };
}

export function isPointInsideBox(
  point: Vec3,
  boxCenter: Vec3,
  boxSize: Vec3,
  boxRot?: Vec3
): boolean {
  const rel = subVec3(point, boxCenter);
  const local = boxRot && (boxRot.x !== 0 || boxRot.y !== 0 || boxRot.z !== 0)
    ? inverseRotateVec3ByEuler(rel, boxRot)
    : rel;
  return (
    Math.abs(local.x) <= boxSize.x * 0.5 &&
    Math.abs(local.y) <= boxSize.y * 0.5 &&
    Math.abs(local.z) <= boxSize.z * 0.5
  );
}

/**
 * Calculates bounce response velocity given current velocity, surface normal,
 * surface restitution, and optional active pad launch force.
 */
export function computeBounceVelocity(
  velocity: Vec3,
  surfaceNormal: Vec3,
  restitution: number,
  padBounceForce = 0,
  padDirection?: Vec3
): { nextVelocity: Vec3; impactSpeed: number } {
  const n = normalizeVec3(surfaceNormal);
  const vn = dotVec3(velocity, n);
  const impactSpeed = vn < 0 ? -vn : 0;

  // Tangent component preserved with slight surface grip
  const normalVel = scaleVec3(n, vn);
  const tangentVel = subVec3(velocity, normalVel);

  if (padBounceForce > 0) {
    const launchDir = padDirection ? normalizeVec3(padDirection) : n;
    // Scale bounce force smoothly with impact speed while guaranteeing minimum pad pop
    const dynamicImpulse = Math.max(padBounceForce, padBounceForce * 0.85 + impactSpeed * (0.45 + restitution * 0.35));
    const launchVel = scaleVec3(launchDir, dynamicImpulse);
    // Preserve horizontal/tangential momentum unless launchDir explicitly redirects
    const tangentKeep = dotVec3(launchDir, n) > 0.85 ? scaleVec3(tangentVel, 0.92) : scaleVec3(tangentVel, 0.4);
    return {
      nextVelocity: addVec3(tangentKeep, launchVel),
      impactSpeed,
    };
  }

  if (vn >= 0) {
    return { nextVelocity: velocity, impactSpeed: 0 };
  }

  // Natural restitution bounce only triggers noticeably above micro-threshold
  const bounceFactor = impactSpeed > 3.2 ? restitution : 0;
  const reflectedNormal = scaleVec3(n, -vn * bounceFactor);
  return {
    nextVelocity: addVec3(tangentVel, reflectedNormal),
    impactSpeed,
  };
}

/**
 * Transforms incoming velocity through a paired portal, preserving speed (plus optional boost)
 * and projecting along the exit portal's outward normal.
 */
export function computePortalExitVelocity(
  inVelocity: Vec3,
  exitNormal: Vec3,
  boost = 1.08,
  minExitSpeed = 9.5
): Vec3 {
  const speed = lengthVec3(inVelocity);
  const outSpeed = Math.max(minExitSpeed, speed * boost);
  const dir = normalizeVec3(exitNormal);
  return scaleVec3(dir, outSpeed);
}

export function computeLevelScore(params: {
  elapsedTime: number;
  parTime: number;
  collectiblesFound: number;
  collectiblesTotal: number;
  fallsCount: number;
  comboBounces: number;
}): number {
  const baseCompletion = 1000;
  const shardBonus = params.collectiblesFound * 250;
  const allShardsBonus = params.collectiblesTotal > 0 && params.collectiblesFound >= params.collectiblesTotal ? 500 : 0;
  const timeDelta = Math.max(0, params.parTime - params.elapsedTime);
  const speedBonus = Math.round(timeDelta * 35);
  const fallPenalty = params.fallsCount * 120;
  const noFallBonus = params.fallsCount === 0 ? 400 : 0;
  const bounceSkillBonus = Math.min(600, params.comboBounces * 25);

  return Math.max(
    100,
    baseCompletion + shardBonus + allShardsBonus + speedBonus + noFallBonus + bounceSkillBonus - fallPenalty
  );
}

export function computeStarRating(params: {
  elapsedTime: number;
  parTime: number;
  collectiblesFound: number;
  collectiblesTotal: number;
  fallsCount: number;
}): 1 | 2 | 3 {
  let stars = 1;
  const shardRatio =
    params.collectiblesTotal > 0 ? params.collectiblesFound / params.collectiblesTotal : 1;
  if (params.elapsedTime <= params.parTime * 1.15 || shardRatio >= 0.6) {
    stars = 2;
  }
  if (
    params.elapsedTime <= params.parTime * 1.05 &&
    params.fallsCount <= 1 &&
    shardRatio >= 0.75
  ) {
    stars = 3;
  }
  return stars as 1 | 2 | 3;
}

export function intersectVehicleCollision(
  playerPos: Vec3,
  radius: number,
  vCenter: Vec3,
  vSize: Vec3
): { hit: boolean; isTopLanding: boolean; pushOut: Vec3 } {
  const hx = vSize.x * 0.5 + radius;
  const hy = vSize.y * 0.5 + radius;
  const hz = vSize.z * 0.5 + radius;
  const dx = playerPos.x - vCenter.x;
  const dy = playerPos.y - vCenter.y;
  const dz = playerPos.z - vCenter.z;

  if (Math.abs(dx) > hx || Math.abs(dy) > hy || Math.abs(dz) > hz) {
    return { hit: false, isTopLanding: false, pushOut: { x: 0, y: 0, z: 0 } };
  }

  // Landing cleanly on roof of vehicle grants a super bounce rather than damage!
  const isTopLanding = dy > vSize.y * 0.25;
  if (isTopLanding) {
    return { hit: true, isTopLanding: true, pushOut: { x: 0, y: hy - dy, z: 0 } };
  }

  const pushZ = dz >= 0 ? hz - dz : -(hz + dz);
  return { hit: true, isTopLanding: false, pushOut: { x: 0, y: 0.4, z: pushZ } };
}

