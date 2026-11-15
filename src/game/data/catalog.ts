import type { AchievementDef, ControlBindings, GameSettings, OrbSkinDef, OrbSkinId } from '../types';

export const ORB_SKINS: Record<OrbSkinId, OrbSkinDef> = {
  copper: {
    id: 'copper',
    name: 'Forged Copper Core',
    description: 'Brushed foundry copper cage housing a warm amber-kinetic nucleus.',
    shellColor: '#b87344',
    coreColor: '#f0a341',
    ringColor: '#d9c4a9',
    metalness: 0.78,
    roughness: 0.34,
    unlockRequirement: 'Default chassis',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Slate',
    description: 'Matte carbon-basalt armor with precision gold-leaf gyro bands.',
    shellColor: '#262b33',
    coreColor: '#e59a3c',
    ringColor: '#c9a054',
    metalness: 0.45,
    roughness: 0.62,
    unlockRequirement: 'Complete Level 1-2: Pneumatic Foundry',
  },
  cryo: {
    id: 'cryo',
    name: 'Cryo Titanium',
    description: 'Bead-blasted titanium frame radiating cool cerulean condenser light.',
    shellColor: '#8d9aa6',
    coreColor: '#48c2d9',
    ringColor: '#d8e3eb',
    metalness: 0.85,
    roughness: 0.28,
    unlockRequirement: 'Use Gravity Shift or Time Control in-game',
  },
  solar: {
    id: 'solar',
    name: 'Helios Brass',
    description: 'Satin-finished architectural bronze engineered for high-velocity runs.',
    shellColor: '#c49645',
    coreColor: '#ffe082',
    ringColor: '#3d3326',
    metalness: 0.82,
    roughness: 0.25,
    unlockRequirement: 'Complete World 01: The Awakening',
  },
  void: {
    id: 'void',
    name: 'Zenith Resonator',
    description: 'Anodized slate shell with a pristine ivory-white harmonic core.',
    shellColor: '#1b1f29',
    coreColor: '#eef4ff',
    ringColor: '#7a9ec2',
    metalness: 0.7,
    roughness: 0.38,
    unlockRequirement: 'Collect 20+ Shards or reach The Final Bounce',
  },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_awakening',
    name: 'First Awakening',
    description: 'Complete Conduit Crossing (W1-L1) and step into the foundry.',
  },
  {
    id: 'kinetic_surge',
    name: 'Kinetic Surge',
    description: 'Chain 15 pneumatic bounces across your runs.',
    rewardSkin: 'obsidian',
  },
  {
    id: 'gravity_defier',
    name: 'Gravity Defier',
    description: 'Reverse gravity using Gravity Shift [Q] or an inversion bay.',
    rewardSkin: 'cryo',
  },
  {
    id: 'temporal_master',
    name: 'Temporal Discipline',
    description: 'Activate Time Control [E/T] to slow world machinery.',
  },
  {
    id: 'portal_hopper',
    name: 'Aperture Transit',
    description: 'Traverse a paired spatial portal while preserving momentum.',
  },
  {
    id: 'shard_collector',
    name: 'Relic Surveyor',
    description: 'Recover every energy shard in any single level.',
  },
  {
    id: 'world1_cleared',
    name: 'Foundry Mastered',
    description: 'Complete all 5 levels of World 01: The Awakening.',
    rewardSkin: 'solar',
  },
  {
    id: 'speedrunner',
    name: 'Against the Clock',
    description: 'Finish any level under its par target time.',
  },
  {
    id: 'no_fall_run',
    name: 'Unbroken Line',
    description: 'Complete a level with zero abyss falls.',
  },
  {
    id: 'zenith_reached',
    name: 'Fall. Adapt. Bounce Back.',
    description: 'Conquer World 10: The Final Bounce.',
    rewardSkin: 'void',
  },
];

export const DEFAULT_BINDINGS: ControlBindings = {
  moveForward: 'KeyW',
  moveBackward: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  dash: 'ShiftLeft',
  gravityShift: 'KeyQ',
  interact: 'KeyE',
  timeSlow: 'KeyT',
  pause: 'Escape',
  restart: 'KeyR',
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  resolutionScale: 1.0,
  fullscreen: false,
  masterVolume: 0.75,
  musicVolume: 0.55,
  sfxVolume: 0.85,
  mouseSensitivity: 1.0,
  cameraSensitivity: 1.0,
  bindings: { ...DEFAULT_BINDINGS },
};
