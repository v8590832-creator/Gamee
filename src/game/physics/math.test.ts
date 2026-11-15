import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeBounceVelocity,
  computeLevelScore,
  computePortalExitVelocity,
  computeStarRating,
  intersectSphereOBB,
  intersectVehicleCollision,
  isPointInsideBox,
} from './math.ts';

test('intersectSphereOBB detects resting contact on top of flat platform', () => {
  const hit = intersectSphereOBB(
    { x: 0, y: 0.45, z: 0 },
    0.5,
    { x: 0, y: -0.5, z: 0 },
    { x: 6, y: 1, z: 6 }
  );
  assert.equal(hit.hit, true);
  assert.ok(hit.normal.y > 0.99);
  assert.ok(Math.abs(hit.penetration - 0.05) < 1e-4);
});

test('intersectSphereOBB returns false when sphere is clear of platform', () => {
  const hit = intersectSphereOBB(
    { x: 0, y: 2.0, z: 0 },
    0.5,
    { x: 0, y: -0.5, z: 0 },
    { x: 6, y: 1, z: 6 }
  );
  assert.equal(hit.hit, false);
});

test('intersectSphereOBB handles rotated ramp collision normal accurately', () => {
  const hit = intersectSphereOBB(
    { x: 0, y: 0.72, z: 0 },
    0.5,
    { x: 0, y: 0, z: 0 },
    { x: 4, y: 0.6, z: 6 },
    { x: 0.25, y: 0, z: 0 }
  );
  assert.equal(hit.hit, true);
  assert.ok(hit.normal.y > 0.8);
  assert.ok(hit.normal.z > 0.1);
});

test('computeBounceVelocity scales upward launch with impact speed on bounce pads', () => {
  const slowHit = computeBounceVelocity({ x: 0, y: -4, z: -5 }, { x: 0, y: 1, z: 0 }, 0.75, 19);
  const fastHit = computeBounceVelocity({ x: 0, y: -16, z: -5 }, { x: 0, y: 1, z: 0 }, 0.75, 19);
  assert.ok(slowHit.nextVelocity.y >= 19);
  assert.ok(fastHit.nextVelocity.y > slowHit.nextVelocity.y);
});

test('computePortalExitVelocity preserves and boosts speed along exit normal', () => {
  const out = computePortalExitVelocity({ x: 0, y: -6, z: -12 }, { x: 1, y: 0, z: 0 }, 1.15);
  assert.ok(out.x > 13);
  assert.ok(Math.abs(out.y) < 1e-4);
});

test('isPointInsideBox detects gravity zone bounds accurately', () => {
  assert.equal(isPointInsideBox({ x: 1, y: 4, z: -30 }, { x: 0, y: 5, z: -30 }, { x: 8, y: 10, z: 16 }), true);
  assert.equal(isPointInsideBox({ x: 9, y: 4, z: -30 }, { x: 0, y: 5, z: -30 }, { x: 8, y: 10, z: 16 }), false);
});

test('computeLevelScore and computeStarRating reward fast clean collectible runs', () => {
  const perfectScore = computeLevelScore({
    elapsedTime: 25,
    parTime: 40,
    collectiblesFound: 5,
    collectiblesTotal: 5,
    fallsCount: 0,
    comboBounces: 4,
  });
  const stars = computeStarRating({
    elapsedTime: 25,
    parTime: 40,
    collectiblesFound: 5,
    collectiblesTotal: 5,
    fallsCount: 0,
  });
  assert.ok(perfectScore > 2500);
  assert.equal(stars, 3);
});

test('intersectVehicleCollision distinguishes roof-top bounce from side collision', () => {
  const topHit = intersectVehicleCollision(
    { x: 0, y: 1.9, z: -32 },
    0.55,
    { x: 0, y: 1.0, z: -32 },
    { x: 2.6, y: 1.8, z: 4.8 }
  );
  assert.equal(topHit.hit, true);
  assert.equal(topHit.isTopLanding, true);

  const sideHit = intersectVehicleCollision(
    { x: 0, y: 0.9, z: -30 },
    0.55,
    { x: 0, y: 1.0, z: -32 },
    { x: 2.6, y: 1.8, z: 4.8 }
  );
  assert.equal(sideHit.hit, true);
  assert.equal(sideHit.isTopLanding, false);
});
