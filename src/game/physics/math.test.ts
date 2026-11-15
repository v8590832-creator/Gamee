import test from 'node:test';
import assert from 'node:assert/strict';
import {
  intersectSphereOBB,
  computeBounceVelocity,
  computePortalExitVelocity,
  computeLevelScore,
  isPointInsideBox,
} from './math';

test('intersectSphereOBB detects resting contact on top of flat platform', () => {
  const hit = intersectSphereOBB(
    { x: 0, y: 0.45, z: 0 },
    0.5,
    { x: 0, y: -0.5, z: 0 },
    { x: 6, y: 1, z: 6 }
  );
  assert.equal(hit.hit, true);
  assert.ok(Math.abs(hit.normal.y - 1) < 1e-5);
  assert.ok(Math.abs(hit.penetration - 0.05) < 1e-5);
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
  const angle = Math.PI / 6; // 30 deg slope tilted around X
  const hit = intersectSphereOBB(
    { x: 0, y: 0.9, z: 0 },
    0.5,
    { x: 0, y: 0, z: 0 },
    { x: 4, y: 1, z: 6 },
    { x: angle, y: 0, z: 0 }
  );
  assert.equal(hit.hit, true);
  assert.ok(hit.normal.y > 0.7 && hit.normal.y < 0.95);
  assert.ok(Math.abs(hit.normal.z) > 0.3);
});

test('computeBounceVelocity scales upward launch with impact speed on bounce pads', () => {
  const slowHit = computeBounceVelocity(
    { x: 2, y: -3, z: 0 },
    { x: 0, y: 1, z: 0 },
    0.4,
    14
  );
  const fastHit = computeBounceVelocity(
    { x: 2, y: -20, z: 0 },
    { x: 0, y: 1, z: 0 },
    0.4,
    14
  );
  assert.ok(slowHit.nextVelocity.y >= 14);
  assert.ok(fastHit.nextVelocity.y > slowHit.nextVelocity.y);
  assert.ok(Math.abs(fastHit.nextVelocity.x - 2 * 0.92) < 1e-5);
});

test('computePortalExitVelocity preserves and boosts speed along exit normal', () => {
  const out = computePortalExitVelocity(
    { x: 0, y: -12, z: 9 },
    { x: 0, y: 0, z: -1 },
    1.1,
    10
  );
  assert.ok(out.z < -15);
  assert.ok(Math.abs(out.x) < 1e-5);
  assert.ok(Math.abs(out.y) < 1e-5);
});

test('isPointInsideBox detects gravity zone bounds accurately', () => {
  assert.equal(
    isPointInsideBox({ x: 1, y: 3, z: -2 }, { x: 0, y: 3, z: 0 }, { x: 6, y: 6, z: 6 }),
    true
  );
  assert.equal(
    isPointInsideBox({ x: 4, y: 3, z: -2 }, { x: 0, y: 3, z: 0 }, { x: 6, y: 6, z: 6 }),
    false
  );
});

test('computeLevelScore rewards fast clean collectible runs', () => {
  const perfect = computeLevelScore({
    elapsedTime: 25,
    parTime: 45,
    collectiblesFound: 5,
    collectiblesTotal: 5,
    fallsCount: 0,
    comboBounces: 10,
  });
  const sloppy = computeLevelScore({
    elapsedTime: 60,
    parTime: 45,
    collectiblesFound: 2,
    collectiblesTotal: 5,
    fallsCount: 3,
    comboBounces: 2,
  });
  assert.ok(perfect > sloppy);
  assert.ok(perfect >= 3500);
});
