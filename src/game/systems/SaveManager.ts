import type { AchievementId, LeaderboardEntry, OrbSkinId, SaveData } from '../types';

const SAVE_KEY = 'bounceback_save_v1';

export function createDefaultSaveData(): SaveData {
  return {
    unlockedLevelIds: ['w1-l1'],
    unlockAllShowcase: false,
    lastPlayedLevelId: 'w1-l1',
    levelProgress: {},
    unlockedSkins: ['copper'],
    equippedSkin: 'copper',
    unlockedAchievements: [],
    leaderboard: [],
    totalBounces: 0,
    totalDashes: 0,
    totalPortalJumps: 0,
  };
}

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  public getData(): SaveData {
    return this.data;
  }

  public load(): SaveData {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return createDefaultSaveData();
      }
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return createDefaultSaveData();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      const base = createDefaultSaveData();
      return {
        ...base,
        ...parsed,
        unlockedLevelIds: Array.isArray(parsed.unlockedLevelIds) && parsed.unlockedLevelIds.length > 0
          ? Array.from(new Set(['w1-l1', ...parsed.unlockedLevelIds]))
          : base.unlockedLevelIds,
        unlockedSkins: Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.length > 0
          ? Array.from(new Set<OrbSkinId>(['copper', ...parsed.unlockedSkins]))
          : base.unlockedSkins,
        unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
          ? parsed.unlockedAchievements
          : [],
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
        levelProgress: parsed.levelProgress ?? {},
      };
    } catch {
      return createDefaultSaveData();
    }
  }

  public save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      }
    } catch {
      // Ignore storage quota issues
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

  public recordLevelCompletion(params: {
    levelId: string;
    levelName: string;
    score: number;
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
      dateIso: new Date().toISOString(),
    };

    this.data.leaderboard = [entry, ...this.data.leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);

    this.save();
    return { isNewBest, previousBest };
  }

  public unlockSkin(skinId: OrbSkinId): boolean {
    if (!this.data.unlockedSkins.includes(skinId)) {
      this.data.unlockedSkins.push(skinId);
      this.save();
      return true;
    }
    return false;
  }

  public equipSkin(skinId: OrbSkinId): boolean {
    if (!this.data.unlockedSkins.includes(skinId)) return false;
    this.data.equippedSkin = skinId;
    this.save();
    return true;
  }

  public unlockAchievement(id: AchievementId): boolean {
    if (!this.data.unlockedAchievements.includes(id)) {
      this.data.unlockedAchievements.push(id);
      this.save();
      return true;
    }
    return false;
  }

  public incrementStat(key: 'totalBounces' | 'totalDashes' | 'totalPortalJumps', delta = 1): number {
    this.data[key] += delta;
    this.save();
    return this.data[key];
  }

  public getTotalUniqueShards(): number {
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
