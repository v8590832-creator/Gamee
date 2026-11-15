export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type WorldId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type PlatformKind =
  | 'solid'
  | 'bounce'
  | 'moving'
  | 'crumbling'
  | 'gear'
  | 'gravityZone'
  | 'windZone'
  | 'fluidZone'
  | 'ramp'
  | 'wall'
  | 'bridge';

export interface PlatformDef {
  id: string;
  kind: PlatformKind;
  position: Vec3;
  size: Vec3; // full width, height, depth (for gear: x=radius*2, y=thickness, z=radius*2)
  rotation?: Vec3; // Euler radians
  color?: string;
  materialStyle?: 'concrete' | 'steel' | 'copper' | 'stone' | 'moss' | 'obsidian' | 'glass' | 'void';
  // Bounce properties
  bounceForce?: number;
  bounceDirection?: Vec3; // default {x:0, y:1, z:0}
  restitution?: number;
  // Moving / Gear properties
  moveOffset?: Vec3;
  moveSpeed?: number;
  movePhase?: number;
  spinSpeed?: number; // rad/s around Y for gears
  // Crumbling properties
  crumbleDelay?: number; // seconds after touch before falling
  respawnDelay?: number; // seconds before reforming
  // Zone properties
  zoneGravity?: Vec3; // overrides gravity while inside
  zoneForce?: Vec3; // continuous acceleration (wind/current)
  zoneDrag?: number; // fluid damping
  // Switch-controlled bridge
  startsActive?: boolean;
  switchId?: string;
}

export interface PortalPairDef {
  id: string;
  aPos: Vec3;
  aNormal: Vec3; // exit direction
  bPos: Vec3;
  bNormal: Vec3;
  colorA?: string;
  colorB?: string;
  boost?: number;
}

export interface CheckpointDef {
  id: string;
  index: number;
  position: Vec3;
  label: string;
}

export interface CollectibleDef {
  id: string;
  position: Vec3;
  value?: number;
}

export interface SwitchDef {
  id: string;
  position: Vec3;
  label: string;
}

export interface WorldTheme {
  id: WorldId;
  name: string;
  subtitle: string;
  description: string;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  fogDensity: number;
  keyLightColor: string;
  keyLightIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  hemiIntensity: number;
  accentColor: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  ambientBaseHz: number;
  sceneryStyle: 'industrial' | 'skyfall' | 'clockwork' | 'gravity' | 'fracture' | 'deep' | 'overgrown' | 'void' | 'collapse' | 'zenith';
}

export interface LevelDefinition {
  id: string; // e.g. 'w1-l1'
  worldId: WorldId;
  levelNumber: number;
  name: string;
  subtitle: string;
  hint?: string;
  parTime: number;
  spawn: Vec3;
  spawnYaw?: number; // radians, 0 = -Z forward
  fallLimitY: number;
  ceilingLimitY?: number;
  finishPosition: Vec3;
  allowGravityShift: boolean;
  allowTimeControl: boolean;
  allowDash: boolean;
  platforms: PlatformDef[];
  portals: PortalPairDef[];
  checkpoints: CheckpointDef[];
  collectibles: CollectibleDef[];
  switches: SwitchDef[];
}

export type OrbSkinId = 'copper' | 'obsidian' | 'cryo' | 'solar' | 'void';

export interface OrbSkinDef {
  id: OrbSkinId;
  name: string;
  description: string;
  shellColor: string;
  coreColor: string;
  ringColor: string;
  metalness: number;
  roughness: number;
  unlockRequirement: string;
}

export type AchievementId =
  | 'first_awakening'
  | 'kinetic_surge'
  | 'gravity_defier'
  | 'temporal_master'
  | 'portal_hopper'
  | 'shard_collector'
  | 'world1_cleared'
  | 'speedrunner'
  | 'no_fall_run'
  | 'zenith_reached';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  rewardSkin?: OrbSkinId;
}

export interface ControlBindings {
  moveForward: string;
  moveBackward: string;
  moveLeft: string;
  moveRight: string;
  jump: string;
  dash: string;
  gravityShift: string;
  interact: string;
  timeSlow: string;
  pause: string;
  restart: string;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  resolutionScale: number; // 0.65 - 1.0
  fullscreen: boolean;
  masterVolume: number; // 0 - 1
  musicVolume: number; // 0 - 1
  sfxVolume: number; // 0 - 1
  mouseSensitivity: number; // 0.2 - 2.5
  cameraSensitivity: number; // 0.2 - 2.5
  bindings: ControlBindings;
}

export interface LevelProgress {
  completed: boolean;
  bestScore: number;
  bestTime: number | null;
  collectedIds: string[];
}

export interface LeaderboardEntry {
  levelId: string;
  levelName: string;
  score: number;
  time: number;
  dateIso: string;
}

export interface SaveData {
  unlockedLevelIds: string[];
  unlockAllShowcase: boolean;
  lastPlayedLevelId: string;
  levelProgress: Record<string, LevelProgress>;
  unlockedSkins: OrbSkinId[];
  equippedSkin: OrbSkinId;
  unlockedAchievements: AchievementId[];
  leaderboard: LeaderboardEntry[];
  totalBounces: number;
  totalDashes: number;
  totalPortalJumps: number;
}

export interface HudSnapshot {
  levelId: string;
  levelName: string;
  worldName: string;
  score: number;
  collectiblesFound: number;
  collectiblesTotal: number;
  elapsedTime: number;
  speed: number;
  dashCooldownRatio: number; // 0 = ready, 1 = full cooldown
  dashCharge: number; // 0 - 1 momentum charge
  gravityInverted: boolean;
  gravityCooldownRatio: number;
  timeSlowActive: boolean;
  timeSlowEnergy: number; // 0 - 1
  checkpointLabel: string;
  checkpointNotice: string | null;
  achievementNotice: string | null;
  interactPrompt: string | null;
  levelHint: string | null;
  fallsCount: number;
  canGravityShift: boolean;
  canTimeControl: boolean;
  canDash: boolean;
}

export interface RunSummary {
  levelId: string;
  levelName: string;
  worldName: string;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  time: number;
  parTime: number;
  collectiblesFound: number;
  collectiblesTotal: number;
  fallsCount: number;
  nextLevelId: string | null;
  newlyUnlockedAchievements: AchievementDef[];
}
