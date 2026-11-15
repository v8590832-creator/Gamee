import assert from 'node:assert/strict';
import test from 'node:test';
import { AchievementManager } from './AchievementManager.ts';
import { ChallengeManager } from './ChallengeManager.ts';
import { SaveManager } from './SaveManager.ts';
import { SettingsManager } from './SettingsManager.ts';

test('SaveManager initializes with w1-l1 unlocked and default Indian kurta loadout', () => {
  const save = new SaveManager();
  const data = save.getData();
  assert.equal(data.unlockedLevelIds.includes('w1-l1'), true);
  assert.equal(data.loadout.kurta, 'ivory');
  assert.equal(data.loadout.headwear, 'wire_glasses');
  assert.equal(data.coins, 50);
});

test('SaveManager unlocks cosmetics, equips kurta, and records stars & progress', () => {
  const save = new SaveManager();
  save.addCoins(100);
  const unlockRes = save.unlockCosmetic('saffron');
  assert.equal(unlockRes.ok, true);
  assert.equal(save.equipCosmetic('kurta', 'saffron'), true);
  assert.equal(save.getData().loadout.kurta, 'saffron');

  save.recordLevelCompletion({
    levelId: 'w1-l1',
    levelName: 'Site Induction',
    score: 2950,
    stars: 3,
    time: 24.5,
    collectedIds: ['c1', 'c2'],
    nextLevelId: 'w1-l2',
  });
  assert.equal(save.getData().unlockedLevelIds.includes('w1-l2'), true);
  assert.equal(save.getData().levelProgress['w1-l1']?.stars, 3);
});

test('AchievementManager & ChallengeManager grant rewards on actions and completion', () => {
  const save = new SaveManager();
  const ach = new AchievementManager(save);
  const chal = new ChallengeManager(save);

  const first = ach.evaluateCompletion({
    levelId: 'w1-l1',
    worldId: 1,
    elapsedTime: 25,
    parTime: 32,
    collectiblesFound: 5,
    collectiblesTotal: 5,
    fallsCount: 0,
    damageTaken: 0,
  });
  assert.ok(first.some((a) => a.id === 'first_road'));
  assert.ok(first.some((a) => a.id === 'speedrunner'));

  const completedCh = chal.evaluateCompletion({
    worldId: 1,
    elapsedTime: 25,
    parTime: 32,
    collectiblesFound: 5,
    collectiblesTotal: 5,
    fallsCount: 0,
    dashesUsed: 0,
    bouncesInRun: 12,
    trafficHits: 0,
    hasTraffic: false,
    hasBoss: false,
    stars: 3,
  });
  assert.ok(completedCh.some((c) => c.id === 'ch_no_fall'));
  assert.ok(completedCh.some((c) => c.id === 'ch_ten_bounces'));
});

test('SettingsManager updates camera distance and keybindings cleanly', () => {
  const mgr = new SettingsManager();
  mgr.update({ cameraDistance: 10.5, invertY: true });
  mgr.updateBinding('bounce', 'KeyB');
  const next = mgr.getSettings();
  assert.equal(next.cameraDistance, 10.5);
  assert.equal(next.invertY, true);
  assert.equal(next.bindings.bounce, 'KeyB');
});
