import { LEVELS_W1_W5 } from './levels_w1_w5';
import { LEVELS_W6_W10 } from './levels_w6_w10';
import type { LevelDefinition, WorldId } from '../types';

export const LEVELS: LevelDefinition[] = [...LEVELS_W1_W5, ...LEVELS_W6_W10];

export function getLevelById(id: string): LevelDefinition {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function getLevelsForWorld(worldId: WorldId): LevelDefinition[] {
  return LEVELS.filter((l) => l.worldId === worldId).sort(
    (a, b) => a.levelNumber - b.levelNumber
  );
}

export function getNextLevelId(currentId: string): string | null {
  const idx = LEVELS.findIndex((l) => l.id === currentId);
  if (idx < 0 || idx + 1 >= LEVELS.length) return null;
  return LEVELS[idx + 1].id;
}
