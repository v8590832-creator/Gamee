import { ALL_COSMETICS } from '../data/catalog';
import type {
  AchievementId,
  ChallengeId,
  CharacterLoadout,
  CosmeticItemDef,
  FootwearId,
  HeadwearId,
  KurtaColorId,
  LeaderboardEntry,
  SaveData,
  TrailStyleId,
} from '../types';

const SAVE_KEY = 'bounceback_road_adventure_save_v1';
const BACKUP_KEY = 'bounceback_road_adventure_save_backup_v1';

export function createDefaultSaveData(): SaveData {
  return {
    unlockedLevelIds: ['w1-l1'],
    unlockAllShowcase: false,
    lastPlayedLevelId: 'w1-l1',
    levelProgress: {},
    coins: 50,
    helmetsCollected: 0,
    blueprintsCollected: 0,
    signsCollected: 0,
    unlockedCosmetics: ['ivory', 'mojari', 'wire_glasses', 'amber_dust'],
    loadout: {
      kurta: 'ivory',
      footwear: 'mojari',
      headwear: 'wire_glasses',
      trail: 'amber_dust',
    },
    unlockedAchievements: [],
    completedChallenges: [],
    challengeProgress: {},
    leaderboard: [],
    totalBounces: 0,
    totalDashes: 0,
    totalSlides: 0,
    totalDoubleJumps: 0,
    totalRollerRides: 0,
    bossesCleared: 0,
  };
}

export class SaveManager {
  private data: SaveData;
  public storageAvailable = true;
  public lastError: string | null = null;

  constructor() {
    this.data = this.load();
  }

  public getData(): SaveData {
    return this.data;
  }

  public load(): SaveData {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.storageAvailable = false;
        return createDefaultSaveData();
      }
      const raw = window.localStorage.getItem(SAVE_KEY) || window.localStorage.getItem(BACKUP_KEY);
      if (!raw) return createDefaultSaveData();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      const base = createDefaultSaveData();
      return {
        ...base,
        ...parsed,
        unlockedLevelIds:
          Array.isArray(parsed.unlockedLevelIds) && parsed.unlockedLevelIds.length > 0
            ? Array.from(new Set(['w1-l1', ...parsed.unlockedLevelIds]))
            : base.unlockedLevelIds,
        unlockedCosmetics:
          Array.isArray(parsed.unlockedCosmetics) && parsed.unlockedCosmetics.length > 0
            ? Array.from(new Set([...base.unlockedCosmetics, ...parsed.unlockedCosmetics]))
            : base.unlockedCosmetics,
        loadout: {
          ...base.loadout,
          ...(parsed.loadout ?? {}),
        },
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
          ? parsed.unlockedAchievements
          : [],
        completedChallenges: Array.isArray(parsed.completedChallenges)
          ? parsed.completedChallenges
          : [],
        challengeProgress: parsed.challengeProgress ?? {},
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
        levelProgress: parsed.levelProgress ?? {},
      };
    } catch {
      this.lastError = 'Saved data could not be read; starting with a fresh local profile.';
      return createDefaultSaveData();
    }
  }

  public save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = JSON.stringify(this.data);
        window.localStorage.setItem(SAVE_KEY, serialized);
        window.localStorage.setItem(BACKUP_KEY, serialized);
        this.storageAvailable = true;
        this.lastError = null;
      }
    } catch {
      this.storageAvailable = false;
      this.lastError =
        'Browser storage is unavailable or full. Progress will stay active for this session only.';
    }
  }

  public isLevelUnlocked(levelId: string): boolean {
    if (this.data.unlockAllShowcase) return true;
    return this.data.unlockedLevelIds.includes(levelId);
  }

  public toggleUnlockAllShowcase(enabled: boolean): void {
    this.data.unlockAllShowcase = enabled;
    this.save();
  }

  public setLastPlayedLevel(levelId: string): void {
    this.data.lastPlayedLevelId = levelId;
    this.save();
  }

  public hasContinueProgress(): boolean {
    return Object.keys(this.data.levelProgress).length > 0 || this.data.unlockedLevelIds.length > 1;
  }

  public unlockLevel(levelId: string): void {
    if (!this.data.unlockedLevelIds.includes(levelId)) {
      this.data.unlockedLevelIds.push(levelId);
      this.save();
    }
  }

  public addCoins(amount: number): void {
    this.data.coins += Math.max(0, Math.round(amount));
    this.save();
  }

  public recordCollectibleTotals(params: {
    coins: number;
    helmets: number;
    blueprints: number;
    signs: number;
  }): void {
    this.data.coins += params.coins;
    this.data.helmetsCollected += params.helmets;
    this.data.blueprintsCollected += params.blueprints;
    this.data.signsCollected += params.signs;
    this.save();
  }

  public recordLevelCompletion(params: {
    levelId: string;
    levelName: string;
    score: number;
    stars: 1 | 2 | 3;
    time: number;
    collectedIds: string[];
    nextLevelId: string | null;
  }): { isNewBest: boolean; previousBest: number } {
    const existing = this.data.levelProgress[params.levelId];
    const previousBest = existing?.bestScore ?? 0;
    const isNewBest = params.score > previousBest;

    const mergedCollected = Array.from(
      new Set([...(existing?.collectedIds ?? []), ...params.collectedIds])
    );

    const bestTime =
      existing?.bestTime == null ? params.time : Math.min(existing.bestTime, params.time);

    this.data.levelProgress[params.levelId] = {
      completed: true,
      bestScore: Math.max(previousBest, params.score),
      bestTime,
      stars: Math.max(existing?.stars ?? 0, params.stars),
      collectedIds: mergedCollected,
    };

    if (params.nextLevelId) {
      this.unlockLevel(params.nextLevelId);
      this.data.lastPlayedLevelId = params.nextLevelId;
    } else {
      this.data.lastPlayedLevelId = params.levelId;
    }

    const entry: LeaderboardEntry = {
      levelId: params.levelId,
      levelName: params.levelName,
      score: params.score,
      time: Number(params.time.toFixed(2)),
      stars: params.stars,
      dateIso: new Date().toISOString(),
    };

    this.data.leaderboard = [entry, ...this.data.leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);

    this.save();
    return { isNewBest, previousBest };
  }

  public unlockCosmetic(itemId: string): { ok: boolean; reason?: string } {
    if (this.data.unlockedCosmetics.includes(itemId)) {
      return { ok: true };
    }
    const def: CosmeticItemDef | undefined = ALL_COSMETICS.find((c) => c.id === itemId);
    if (!def) return { ok: false, reason: 'Item not found' };
    if (def.requiresBlueprints && this.data.blueprintsCollected < def.requiresBlueprints) {
      return { ok: false, reason: `Needs ${def.requiresBlueprints} Blueprint(s)` };
    }
    if (this.data.coins < def.costCoins) {
      return { ok: false, reason: `Needs ${def.costCoins} Road Coins` };
    }
    this.data.coins -= def.costCoins;
    this.data.unlockedCosmetics.push(itemId);
    this.save();
    return { ok: true };
  }

  public equipCosmetic(category: keyof CharacterLoadout, itemId: string): boolean {
    if (!this.data.unlockedCosmetics.includes(itemId)) return false;
    if (category === 'kurta') this.data.loadout.kurta = itemId as KurtaColorId;
    if (category === 'footwear') this.data.loadout.footwear = itemId as FootwearId;
    if (category === 'headwear') this.data.loadout.headwear = itemId as HeadwearId;
    if (category === 'trail') this.data.loadout.trail = itemId as TrailStyleId;
    this.save();
    return true;
  }

  public unlockAchievement(id: AchievementId, rewardCoins = 0): boolean {
    if (!this.data.unlockedAchievements.includes(id)) {
      this.data.unlockedAchievements.push(id);
      this.data.coins += rewardCoins;
      this.save();
      return true;
    }
    return false;
  }

  public incrementChallenge(id: ChallengeId, target: number, rewardCoins: number, delta = 1): boolean {
    if (this.data.completedChallenges.includes(id)) return false;
    const next = (this.data.challengeProgress[id] ?? 0) + delta;
    this.data.challengeProgress[id] = next;
    if (next >= target) {
      this.data.completedChallenges.push(id);
      this.data.coins += rewardCoins;
      this.save();
      return true;
    }
    this.save();
    return false;
  }

  public setChallengeProgressMax(id: ChallengeId, target: number, rewardCoins: number, value: number): boolean {
    if (this.data.completedChallenges.includes(id)) return false;
    const next = Math.max(this.data.challengeProgress[id] ?? 0, value);
    this.data.challengeProgress[id] = next;
    if (next >= target) {
      this.data.completedChallenges.push(id);
      this.data.coins += rewardCoins;
      this.save();
      return true;
    }
    this.save();
    return false;
  }

  public incrementStat(
    key: 'totalBounces' | 'totalDashes' | 'totalSlides' | 'totalDoubleJumps' | 'totalRollerRides' | 'bossesCleared',
    delta = 1
  ): number {
    this.data[key] += delta;
    this.save();
    return this.data[key];
  }

  public getTotalStars(): number {
    let total = 0;
    for (const p of Object.values(this.data.levelProgress)) {
      total += p.stars ?? 0;
    }
    return total;
  }

  public getTotalUniqueCollectibles(): number {
    let count = 0;
    for (const prog of Object.values(this.data.levelProgress)) {
      count += prog.collectedIds.length;
    }
    return count;
  }

  public resetProgress(): void {
    this.data = createDefaultSaveData();
    this.save();
  }
}
