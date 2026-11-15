import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager } from './SaveManager';
import { SettingsManager } from './SettingsManager';
import { AchievementManager } from './AchievementManager';

test('SaveManager initializes with World 1 Level 1 unlocked and Copper skin equipped', () => {
  const sm = new SaveManager();
  const data = sm.getData();
  assert.equal(sm.isLevelUnlocked('w1-l1'), true);
  assert.equal(sm.isLevelUnlocked('w1-l2'), false);
  assert.equal(data.equippedSkin, 'copper');
  assert.deepEqual(data.unlockedSkins, ['copper']);
});

test('SaveManager unlocks next level, records best scores, and populates leaderboard', () => {
  const sm = new SaveManager();
  const res = sm.recordLevelCompletion({
    levelId: 'w1-l1',
    levelName: 'Conduit Crossing',
    score: 2650,
    time: 31.4,
    collectedIds: ['w1l1-c1', 'w1l1-c2'],
    nextLevelId: 'w1-l2',
  });
  assert.equal(res.isNewBest, true);
  assert.equal(sm.isLevelUnlocked('w1-l2'), true);
  assert.equal(sm.getData().leaderboard.length, 1);
  assert.equal(sm.getTotalUniqueShards(), 2);
});

test('AchievementManager unlocks achievements and rewards skins', () => {
  const sm = new SaveManager();
  const am = new AchievementManager(sm);

  const unlocked = am.evaluateCompletion({
    levelId: 'w1-l1',
    elapsedTime: 29,
    parTime: 38,
    collectiblesFound: 5,
    collectiblesTotal: 5,
    fallsCount: 0,
  });

  const ids = unlocked.map((a) => a.id);
  assert.ok(ids.includes('first_awakening'));
  assert.ok(ids.includes('speedrunner'));
  assert.ok(ids.includes('shard_collector'));
  assert.ok(ids.includes('no_fall_run'));

  const gravAch = am.evaluateAction('gravity');
  assert.equal(gravAch?.id, 'gravity_defier');
  assert.ok(sm.getData().unlockedSkins.includes('cryo'));
  assert.equal(sm.equipSkin('cryo'), true);
  assert.equal(sm.getData().equippedSkin, 'cryo');
});

test('SettingsManager updates sensitivity and keybindings cleanly', () => {
  const setMgr = new SettingsManager();
  setMgr.update({ mouseSensitivity: 1.6, masterVolume: 0.4 });
  setMgr.updateBinding('dash', 'KeyF');
  const s = setMgr.getSettings();
  assert.equal(s.mouseSensitivity, 1.6);
  assert.equal(s.masterVolume, 0.4);
  assert.equal(s.bindings.dash, 'KeyF');
});
