import { CHALLENGES } from '../data/catalog';
import type { ChallengeDef, ChallengeId, WorldId } from '../types';
import type { SaveManager } from './SaveManager';

export class ChallengeManager {
  private saveManager: SaveManager;

  constructor(saveManager: SaveManager) {
    this.saveManager = saveManager;
  }

  private bump(id: ChallengeId, delta = 1): ChallengeDef | null {
    const def = CHALLENGES.find((c) => c.id === id);
    if (!def) return null;
    const completedNow = this.saveManager.incrementChallenge(id, def.targetCount, def.rewardCoins, delta);
    return completedNow ? def : null;
  }

  private bumpMax(id: ChallengeId, val: number): ChallengeDef | null {
    const def = CHALLENGES.find((c) => c.id === id);
    if (!def) return null;
    const completedNow = this.saveManager.setChallengeProgressMax(id, def.targetCount, def.rewardCoins, val);
    return completedNow ? def : null;
  }

  public evaluateAction(
    action:
      | 'doubleJump'
      | 'slide'
      | 'rollerRide'
      | 'gravityZone'
      | 'special'
      | 'blueprint'
      | 'helmet'
      | 'sign'
      | 'longJump'
  ): ChallengeDef | null {
    switch (action) {
      case 'doubleJump':
        return this.bump('ch_double_jump_5', 1);
      case 'slide':
        return this.bump('ch_slide_master', 1);
      case 'rollerRide':
        return this.bump('ch_roller_ride', 1);
      case 'gravityZone':
        return this.bump('ch_gravity_zone', 1);
      case 'special':
        return this.bump('ch_special_surge', 1);
      case 'blueprint':
        return this.bump('ch_find_blueprint', 1);
      case 'helmet':
        return this.bump('ch_helmet_hunter', 1);
      case 'sign':
        return this.bump('ch_secret_sign', 1);
      case 'longJump':
        return this.bump('ch_long_jump', 1);
    }
  }

  public evaluateCompletion(params: {
    worldId: WorldId;
    elapsedTime: number;
    parTime: number;
    collectiblesFound: number;
    collectiblesTotal: number;
    fallsCount: number;
    dashesUsed: number;
    bouncesInRun: number;
    trafficHits: number;
    hasTraffic: boolean;
    hasBoss: boolean;
    stars: number;
  }): ChallengeDef[] {
    const done: ChallengeDef[] = [];
    const pushIf = (c: ChallengeDef | null) => {
      if (c) done.push(c);
    };

    if (params.fallsCount === 0) pushIf(this.bump('ch_no_fall', 1));
    if (params.collectiblesTotal > 0 && params.collectiblesFound >= params.collectiblesTotal) {
      pushIf(this.bump('ch_all_coins', 1));
    }
    if (params.elapsedTime <= params.parTime) pushIf(this.bump('ch_under_par', 1));
    if (params.dashesUsed === 0) pushIf(this.bump('ch_no_dash', 1));
    if (params.bouncesInRun >= 10) pushIf(this.bump('ch_ten_bounces', 1));
    if (params.hasTraffic && params.trafficHits === 0) pushIf(this.bump('ch_no_traffic_hit', 1));
    if (params.stars === 3) pushIf(this.bump('ch_perfect_score', 1));
    if (params.worldId === 8) pushIf(this.bump('ch_monsoon_clear', 1));
    if (params.worldId === 6) pushIf(this.bump('ch_tunnel_clear', 1));
    if (params.hasBoss) pushIf(this.bump('ch_boss_conquer', 1));
    pushIf(this.bumpMax('ch_3_stars', this.saveManager.getTotalStars()));

    return done;
  }
}
