import { ACHIEVEMENTS } from '../data/catalog';
import type { AchievementDef, AchievementId } from '../types';
import type { SaveManager } from './SaveManager';

export class AchievementManager {
  private saveManager: SaveManager;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
  }

  public grant(id: AchievementId): AchievementDef | null {
    const wasNew = this.saveManager.unlockAchievement(id);
    if (!wasNew) return null;
    const def = ACHIEVEMENTS.find((a) => a.id === id) ?? null;
    if (def?.rewardSkin) {
      this.saveManager.unlockSkin(def.rewardSkin);
    }
    return def;
  }

  public evaluateCompletion(params: {
    levelId: string;
    elapsedTime: number;
    parTime: number;
    collectiblesFound: number;
    collectiblesTotal: number;
    fallsCount: number;
  }): AchievementDef[] {
    const unlocked: AchievementDef[] = [];
    const tryGrant = (id: AchievementId) => {
      const def = this.grant(id);
      if (def) unlocked.push(def);
    };

    if (params.levelId === 'w1-l1') {
      tryGrant('first_awakening');
    }
    if (params.levelId === 'w1-l2') {
      this.saveManager.unlockSkin('obsidian');
    }
    if (params.elapsedTime <= params.parTime) {
      tryGrant('speedrunner');
    }
    if (params.collectiblesTotal > 0 && params.collectiblesFound >= params.collectiblesTotal) {
      tryGrant('shard_collector');
    }
    if (params.fallsCount === 0) {
      tryGrant('no_fall_run');
    }
    if (params.levelId === 'w10-l1') {
      tryGrant('zenith_reached');
    }

    const prog = this.saveManager.getData().levelProgress;
    const w1Levels = ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4', 'w1-l5'];
    if (w1Levels.every((id) => prog[id]?.completed)) {
      tryGrant('world1_cleared');
    }

    if (this.saveManager.getTotalUniqueShards() >= 20) {
      this.saveManager.unlockSkin('void');
    }

    return unlocked;
  }

  public evaluateAction(action: 'bounce' | 'gravity' | 'timeSlow' | 'portal'): AchievementDef | null {
    if (action === 'bounce') {
      const total = this.saveManager.incrementStat('totalBounces', 1);
      if (total >= 15) return this.grant('kinetic_surge');
      return null;
    }
    if (action === 'gravity') {
      return this.grant('gravity_defier');
    }
    if (action === 'timeSlow') {
      this.saveManager.unlockSkin('cryo');
      return this.grant('temporal_master');
    }
    if (action === 'portal') {
      this.saveManager.incrementStat('totalPortalJumps', 1);
      return this.grant('portal_hopper');
    }
    return null;
  }
}
