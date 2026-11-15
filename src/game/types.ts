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
  | 'roller'
  | 'gravityZone'
  | 'windZone'
  | 'fluidZone'
  | 'puddle'
  | 'pothole'
  | 'ramp'
  | 'wall'
  | 'bridge'
  | 'bossHazard';

export interface PlatformDef {
  id: string;
  kind: PlatformKind;
  position: Vec3;
  size: Vec3;
  rotation?: Vec3;
  color?: string;
  materialStyle?:
    | 'asphalt'
    | 'concrete'
    | 'steel'
    | 'copper'
    | 'stone'
    | 'moss'
    | 'obsidian'
    | 'glass'
    | 'void'
    | 'wet';
  bounceForce?: number;
  bounceDirection?: Vec3;
  restitution?: number;
  moveOffset?: Vec3;
  moveSpeed?: number;
  movePhase?: number;
  spinSpeed?: number;
  crumbleDelay?: number;
  respawnDelay?: number;
  zoneGravity?: Vec3;
  zoneForce?: Vec3;
  zoneDrag?: number;
  startsActive?: boolean;
  switchId?: string;
}

export type VehicleKind = 'auto' | 'car' | 'truck' | 'bus' | 'roller';

export interface TrafficLaneDef {
  id: string;
  z: number;
  y: number;
  xMin: number;
  xMax: number;
  direction: 1 | -1;
  speed: number;
  vehicleKind: VehicleKind;
  count: number;
  bounceTop?: boolean;
}

export type BossKind =
  | 'giant_roller'
  | 'traffic_machine'
  | 'mega_crane'
  | 'collapsing_bridge';

export interface BossEncounterDef {
  id: string;
  kind: BossKind;
  name: string;
  subtitle: string;
  position: Vec3;
  patrolWidth: number;
  speed: number;
}

export interface PortalPairDef {
  id: string;
  aPos: Vec3;
  aNormal: Vec3;
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

export type CollectibleKind = 'coin' | 'helmet' | 'blueprint' | 'energy' | 'sign';

export interface CollectibleDef {
  id: string;
  kind?: CollectibleKind;
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
  rainIntensity: number; // 0 = dry, 1 = heavy monsoon
  sceneryStyle:
    | 'city_site'
    | 'highway'
    | 'bridge'
    | 'mountain'
    | 'pothole'
    | 'tunnel'
    | 'flyover'
    | 'monsoon'
    | 'mega_site'
    | 'ultimate';
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
  spawnYaw?: number;
  fallLimitY: number;
  ceilingLimitY?: number;
  finishPosition: Vec3;
  allowGravityShift: boolean;
  allowTimeControl: boolean;
  allowDash: boolean;
  timeChallengeSec?: number;
  highwayLabel?: string;
  platforms: PlatformDef[];
  trafficLanes?: TrafficLaneDef[];
  boss?: BossEncounterDef;
  portals: PortalPairDef[];
  checkpoints: CheckpointDef[];
  collectibles: CollectibleDef[];
  switches: SwitchDef[];
}

export type KurtaColorId = 'ivory' | 'saffron' | 'indigo' | 'emerald' | 'crimson';
export type FootwearId = 'mojari' | 'runner' | 'safety_boot' | 'gold_sandal';
export type HeadwearId = 'wire_glasses' | 'aviators' | 'hard_hat' | 'gandhi_cap' | 'royal_turban';
export type TrailStyleId = 'amber_dust' | 'tricolor' | 'monsoon_mist' | 'blueprint_sparks';

export interface CosmeticItemDef<T extends string = string> {
  id: T;
  category: 'kurta' | 'footwear' | 'headwear' | 'trail';
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor?: string;
  costCoins: number;
  requiresBlueprints?: number;
  unlockHint: string;
}

export type OrbSkinId = KurtaColorId; // Legacy alias for compatibility

export interface CharacterLoadout {
  kurta: KurtaColorId;
  footwear: FootwearId;
  headwear: HeadwearId;
  trail: TrailStyleId;
}

export type AchievementId =
  | 'first_road'
  | 'super_bouncer'
  | 'traffic_acrobat'
  | 'roller_rider'
  | 'blueprint_hunter'
  | 'monsoon_survivor'
  | 'world1_cleared'
  | 'speedrunner'
  | 'no_fall_run'
  | 'ultimate_bounceback';

export interface AchievementDef {
  id: AchievementId;
  name: string;
  description: string;
  rewardCoins: number;
}

export type ChallengeId =
  | 'ch_no_fall'
  | 'ch_all_coins'
  | 'ch_under_par'
  | 'ch_no_dash'
  | 'ch_ten_bounces'
  | 'ch_find_blueprint'
  | 'ch_no_traffic_hit'
  | 'ch_secret_sign'
  | 'ch_long_jump'
  | 'ch_perfect_score'
  | 'ch_double_jump_5'
  | 'ch_slide_master'
  | 'ch_roller_ride'
  | 'ch_gravity_zone'
  | 'ch_monsoon_clear'
  | 'ch_tunnel_clear'
  | 'ch_boss_conquer'
  | 'ch_helmet_hunter'
  | 'ch_special_surge'
  | 'ch_3_stars';

export interface ChallengeDef {
  id: ChallengeId;
  title: string;
  description: string;
  rewardCoins: number;
  targetCount: number;
}

export interface ControlBindings {
  moveForward: string;
  moveBackward: string;
  moveLeft: string;
  moveRight: string;
  jump: string;
  sprint: string;
  slide: string;
  bounce: string;
  dash: string;
  interact: string;
  special: string;
  pause: string;
  restart: string;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  resolutionScale: number;
  fullscreen: boolean;
  vsync: boolean;
  shadowsEnabled: boolean;
  effectsQuality: GraphicsQuality;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  cameraSensitivity: number;
  cameraDistance: number;
  cameraSmoothing: number;
  invertY: boolean;
  bindings: ControlBindings;
}

export interface LevelProgress {
  completed: boolean;
  bestScore: number;
  bestTime: number | null;
  stars: number; // 1..3
  collectedIds: string[];
}

export interface LeaderboardEntry {
  levelId: string;
  levelName: string;
  score: number;
  time: number;
  stars: number;
  dateIso: string;
}

export interface SaveData {
  unlockedLevelIds: string[];
  unlockAllShowcase: boolean;
  lastPlayedLevelId: string;
  levelProgress: Record<string, LevelProgress>;
  coins: number;
  helmetsCollected: number;
  blueprintsCollected: number;
  signsCollected: number;
  unlockedCosmetics: string[];
  loadout: CharacterLoadout;
  unlockedAchievements: AchievementId[];
  completedChallenges: ChallengeId[];
  challengeProgress: Record<string, number>;
  leaderboard: LeaderboardEntry[];
  totalBounces: number;
  totalDashes: number;
  totalSlides: number;
  totalDoubleJumps: number;
  totalRollerRides: number;
  bossesCleared: number;
}

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'jump'
  | 'doubleJump'
  | 'bounce'
  | 'land'
  | 'slide'
  | 'fall'
  | 'dash'
  | 'victory'
  | 'damage'
  | 'pickup'
  | 'special'
  | 'levelComplete';

export interface HudSnapshot {
  levelId: string;
  levelName: string;
  worldName: string;
  score: number;
  coinsRun: number;
  totalCoins: number;
  collectiblesFound: number;
  collectiblesTotal: number;
  health: number;
  maxHealth: number;
  elapsedTime: number;
  timeChallengeRemaining: number | null;
  speed: number;
  isSprinting: boolean;
  isSliding: boolean;
  bounceCooldownRatio: number;
  dashCooldownRatio: number;
  dashCharge: number;
  specialCooldownRatio: number;
  specialActive: boolean;
  specialEnergy: number;
  gravityInverted: boolean;
  checkpointLabel: string;
  checkpointNotice: string | null;
  achievementNotice: string | null;
  bossName: string | null;
  interactPrompt: string | null;
  levelHint: string | null;
  fallsCount: number;
  canDash: boolean;
}

export interface RunSummary {
  levelId: string;
  levelName: string;
  worldName: string;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  stars: number;
  time: number;
  parTime: number;
  coinsEarned: number;
  collectiblesFound: number;
  collectiblesTotal: number;
  fallsCount: number;
  nextLevelId: string | null;
  newlyUnlockedAchievements: AchievementDef[];
  newlyCompletedChallenges: ChallengeDef[];
}
