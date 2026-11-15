import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceStridePhase, getWorldSceneryProfile } from './sceneryProfile';

test('getWorldSceneryProfile activates river water & cable pylons for World 3 bridge', () => {
  const p = getWorldSceneryProfile(3, 'bridge');
  assert.equal(p.hasRiverWater, true);
  assert.equal(p.hasCablePylons, true);
  assert.equal(p.hasTunnelVault, false);
  assert.equal(p.hasPalms, true);
  assert.equal(p.hasStreetlights, true);
});

test('getWorldSceneryProfile configures World 6 tunnel vault without outdoor streetlights', () => {
  const p = getWorldSceneryProfile(6, 'tunnel');
  assert.equal(p.hasTunnelVault, true);
  assert.equal(p.hasStreetlights, false);
  assert.equal(p.hasCitySkyline, false);
  assert.equal(p.hasMountainRidges, false);
});

test('getWorldSceneryProfile activates toll plazas and chai stalls for World 2 highway', () => {
  const p = getWorldSceneryProfile(2, 'highway');
  assert.equal(p.hasTollPlaza, true);
  assert.equal(p.hasChaiStalls, true);
  assert.equal(p.hasDustHaze, true);
  assert.equal(p.hasMountainRidges, true);
});

test('getWorldSceneryProfile activates monsoon river, ridges, and palms for World 8', () => {
  const p = getWorldSceneryProfile(8, 'monsoon');
  assert.equal(p.hasRiverWater, true);
  assert.equal(p.hasMountainRidges, true);
  assert.equal(p.hasPalms, true);
});

test('advanceStridePhase advances proportional to speed when grounded and freezes when airborne or idle', () => {
  const start = 1.25;
  const idle = advanceStridePhase(start, 0.1, 0.016, true);
  assert.equal(idle, start);

  const airborne = advanceStridePhase(start, 14.0, 0.016, false);
  assert.equal(airborne, start);

  const running = advanceStridePhase(start, 10.0, 0.05, true);
  assert.ok(running > start);

  const sprinting = advanceStridePhase(start, 18.0, 0.05, true);
  assert.ok(sprinting > running);
});
