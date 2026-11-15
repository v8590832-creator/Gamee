import { ACHIEVEMENTS } from '../data/catalog';
import type { AchievementDef, AchievementId, WorldId } from '../types';
import type { SaveManager } from './SaveManager';

export class AchievementManager {
  private saveManager: SaveManager;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
  }

  public grant(id: AchievementId): AchievementDef | null {
    const def = ACHIEVEMENTS.find((a) => a.id === id) ?? null;
    if (!def) return null;
    const wasNew = this.saveManager.unlockAchievement(id, def.rewardCoins);
    if (!wasNew) return null;
    return def;
  }

  public evaluateCompletion(params: {
    levelId: string;
    worldId: WorldId;
    elapsedTime: number;
    parTime: number;
    collectiblesFound: number;
    collectiblesTotal: number;
    fallsCount: number;
    damageTaken: number;
  }): AchievementDef[] {
    const unlocked: AchievementDef[] = [];
    const tryGrant = (id: AchievementId) => {
      const def = this.grant(id);
      if (def) unlocked.push(def);
    };

    if (params.levelId === 'w1-l1') {
      tryGrant('first_road');
    }
    if (params.elapsedTime <= params.parTime) {
      tryGrant('speedrunner');
    }
    if (params.fallsCount === 0 && params.damageTaken === 0) {
      tryGrant('no_fall_run');
    }
    if (params.worldId === 8) {
      tryGrant('monsoon_survivor');
    }
    if (params.levelId === 'w10-l5') {
      tryGrant('ultimate_bounceback');
    }

    const prog = this.saveManager.getData().levelProgress;
    const w1Levels = ['w1-l1', 'w1-l2', 'w1-l3', 'w1-l4', 'w1-l5'];
    if (w1Levels.every((id) => prog[id]?.completed)) {
      tryGrant('world1_cleared');
    }

    if (this.saveManager.getData().blueprintsCollected >= 3) {
      tryGrant('blueprint_hunter');
    }

    return unlocked;
  }

  public evaluateAction(
    action: 'bounce' | 'vehicleBounce' | 'rollerRide' | 'blueprint'
  ): AchievementDef | null {
    if (action === 'bounce') {
      const total = this.saveManager.incrementStat('totalBounces', 1);
      if (total >= 20) return this.grant('super_bouncer');
      return null;
    }
    if (action === 'vehicleBounce') {
      return this.grant('traffic_acrobat');
    }
    if (action === 'rollerRide') {
      this.saveManager.incrementStat('totalRollerRides', 1);
      return this.grant('roller_rider');
    }
    if (action === 'blueprint') {
      if (this.saveManager.getData().blueprintsCollected >= 3) {
        return this.grant('blueprint_hunter');
      }
      return null;
    }
    return null;
  }
}
