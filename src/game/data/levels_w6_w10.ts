import type {
  CollectibleDef,
  LevelDefinition,
} from '../types';

function makeCoinsRow(prefix: string, x: number, y: number, zStart: number, zStep: number, count: number): CollectibleDef[] {
  const list: CollectibleDef[] = [];
  for (let i = 0; i < count; i++) {
    list.push({ id: `${prefix}-c${i + 1}`, kind: 'coin', position: { x, y, z: zStart + i * zStep }, value: 10 });
  }
  return list;
}

export const LEVELS_W6_W10: LevelDefinition[] = [
  // -----------------------------------------------------------------------
  // WORLD 6: TUNNEL TROUBLE (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => ({
    id: `w6-l${lvl}`,
    worldId: 6,
    levelNumber: lvl,
    name: [
      'Subway Bore',
      'Sodium Corridor',
      'Convoy Tunnel',
      'Ventilation Shafts',
      'Deep Core Exit',
    ][lvl - 1],
    subtitle: `World 6 · Stage ${lvl}`,
    hint: 'Dodge tunnel convoy trucks and ride ventilation updrafts through the underground bore.',
    parTime: 44 + lvl * 3,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -15,
    finishPosition: { x: 0, y: 3.5, z: -98 },
    allowGravityShift: lvl >= 3,
    allowTimeControl: true,
    allowDash: true,
    highwayLabel: `ROHTANG BORE · TUBE ${lvl}`,
    trafficLanes: [
      { id: `w6l${lvl}-t1`, z: -32, y: 0.6, xMin: -8, xMax: 8, direction: 1, speed: 6 + lvl * 1.1, vehicleKind: 'truck', count: 2, bounceTop: true },
      { id: `w6l${lvl}-t2`, z: -68, y: 2.0, xMin: -8, xMax: 8, direction: -1, speed: 7 + lvl * 1.2, vehicleKind: 'bus', count: 2, bounceTop: true },
    ],
    platforms: [
      { id: `w6l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -8 }, size: { x: 8, y: 1.2, z: 22 }, materialStyle: 'concrete' },
      { id: `w6l${lvl}-p2`, kind: 'solid', position: { x: 0, y: 0.0, z: -32 }, size: { x: 14, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
      { id: `w6l${lvl}-wind`, kind: 'windZone', position: { x: 0, y: 3.5, z: -50 }, size: { x: 7, y: 6, z: 10 }, zoneForce: { x: 0, y: 18, z: -3 } },
      { id: `w6l${lvl}-p3`, kind: 'solid', position: { x: 0, y: 1.5, z: -68 }, size: { x: 14, y: 1.2, z: 20 }, materialStyle: 'asphalt' },
      { id: `w6l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 3.0, z: -94 }, size: { x: 9.5, y: 1.2, z: 18 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [{ id: `w6l${lvl}-cp1`, index: 1, position: { x: 0, y: 2.1, z: -59 }, label: 'Shaft Bay' }],
    collectibles: [
      ...makeCoinsRow(`w6l${lvl}`, 0, 1.5, -18, -14, 3),
      { id: `w6l${lvl}-h1`, kind: 'helmet', position: { x: 0, y: 6.2, z: -50 }, value: 50 },
      { id: `w6l${lvl}-bp1`, kind: 'blueprint', position: { x: -4.5, y: 3.2, z: -72 }, value: 75 },
    ],
    switches: [],
  })),

  // -----------------------------------------------------------------------
  // WORLD 7: FLYOVER FRENZY (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => ({
    id: `w7-l${lvl}`,
    worldId: 7,
    levelNumber: lvl,
    name: [
      'Lower Deck',
      'Spiral Entry Ramp',
      'Double-Decker Drop',
      'Skyline Cloverleaf',
      'Apex Flyover',
    ][lvl - 1],
    subtitle: `World 7 · Stage ${lvl}`,
    hint: 'Climb multi-tier elevated flyovers, hit booster ramps, and bounce across skyway gaps.',
    parTime: 46 + lvl * 3,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -18,
    finishPosition: { x: 0, y: 9.5, z: -102 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    timeChallengeSec: lvl >= 2 ? 48 : undefined,
    highwayLabel: `METRO FLYOVER · TIER ${lvl}`,
    trafficLanes: [
      { id: `w7l${lvl}-t1`, z: -38, y: 3.5, xMin: -9, xMax: 9, direction: 1, speed: 7 + lvl * 1.1, vehicleKind: 'car', count: 3, bounceTop: true },
    ],
    platforms: [
      { id: `w7l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7.5, y: 1.2, z: 18 }, materialStyle: 'concrete' },
      { id: `w7l${lvl}-r1`, kind: 'ramp', position: { x: 0, y: 1.5, z: -20 }, size: { x: 5.5, y: 0.8, z: 12 }, rotation: { x: 0.25, y: 0, z: 0 }, materialStyle: 'asphalt' },
      { id: `w7l${lvl}-p2`, kind: 'solid', position: { x: 0, y: 3.0, z: -38 }, size: { x: 16, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
      { id: `w7l${lvl}-b1`, kind: 'bounce', position: { x: 0, y: 3.75, z: -45 }, size: { x: 3.5, y: 0.4, z: 3.5 }, bounceForce: 23 },
      { id: `w7l${lvl}-m1`, kind: 'moving', position: { x: 0, y: 6.5, z: -64 }, size: { x: 6.5, y: 1.0, z: 8.5 }, materialStyle: 'steel', moveOffset: { x: 0, y: 2.0, z: 4 }, moveSpeed: 1.3 },
      { id: `w7l${lvl}-p3`, kind: 'solid', position: { x: 0, y: 8.5, z: -83 }, size: { x: 8.0, y: 1.2, z: 12 }, materialStyle: 'concrete' },
      { id: `w7l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 9.0, z: -100 }, size: { x: 10, y: 1.2, z: 16 }, materialStyle: 'asphalt' },
    ],
    portals: [],
    checkpoints: [{ id: `w7l${lvl}-cp1`, index: 1, position: { x: 0, y: 3.6, z: -31 }, label: 'Upper Deck' }],
    collectibles: [
      ...makeCoinsRow(`w7l${lvl}`, 0, 3.0, -16, -5, 3),
      { id: `w7l${lvl}-h1`, kind: 'helmet', position: { x: 0, y: 9.2, z: -64 }, value: 50 },
      { id: `w7l${lvl}-s1`, kind: 'sign', position: { x: 3.2, y: 10.5, z: -83 }, value: 100 },
    ],
    switches: [],
  })),

  // -----------------------------------------------------------------------
  // WORLD 8: THE MONSOON MISSION (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => ({
    id: `w8-l${lvl}`,
    worldId: 8,
    levelNumber: lvl,
    name: [
      'First Monsoon Drizzle',
      'Coastal Splashway',
      'Thunder Viaduct',
      'Flooded Underpass',
      'Stormbreaker Bridge',
    ][lvl - 1],
    subtitle: `World 8 · Stage ${lvl}`,
    hint: 'Wet tarmac and water puddles are slippery! Use Double Jump and Super Bounce [Q] for crisp control.',
    parTime: 46 + lvl * 3,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -16,
    finishPosition: { x: 0, y: 3.0, z: -98 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    highwayLabel: `KONKAN COAST · RAIN ZONE`,
    platforms: [
      { id: `w8l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7.5, y: 1.2, z: 18 }, materialStyle: 'wet' },
      { id: `w8l${lvl}-pud1`, kind: 'puddle', position: { x: 0, y: 0.15, z: -12 }, size: { x: 6.5, y: 0.25, z: 6.0 } },
      { id: `w8l${lvl}-p2`, kind: 'solid', position: { x: -2.0, y: 0.5, z: -28 }, size: { x: 7.0, y: 1.2, z: 16 }, materialStyle: 'wet' },
      { id: `w8l${lvl}-pud2`, kind: 'puddle', position: { x: -2.0, y: 1.15, z: -29 }, size: { x: 5.5, y: 0.25, z: 6.0 } },
      { id: `w8l${lvl}-b1`, kind: 'bounce', position: { x: -2.0, y: 1.25, z: -34 }, size: { x: 3.4, y: 0.4, z: 3.4 }, bounceForce: 21 },
      { id: `w8l${lvl}-fl`, kind: 'fluidZone', position: { x: 0, y: 2.5, z: -54 }, size: { x: 8, y: 5, z: 16 }, zoneDrag: 1.4 },
      { id: `w8l${lvl}-p3`, kind: 'solid', position: { x: 2.0, y: 1.8, z: -72 }, size: { x: 7.5, y: 1.2, z: 16 }, materialStyle: 'wet' },
      { id: `w8l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 2.5, z: -94 }, size: { x: 10, y: 1.2, z: 16 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [{ id: `w8l${lvl}-cp1`, index: 1, position: { x: -2.0, y: 1.1, z: -24 }, label: 'Storm Shelter' }],
    collectibles: [
      ...makeCoinsRow(`w8l${lvl}`, 0, 1.5, -10, -14, 3),
      { id: `w8l${lvl}-e1`, kind: 'energy', position: { x: 0, y: 3.6, z: -54 }, value: 25 },
      { id: `w8l${lvl}-bp1`, kind: 'blueprint', position: { x: 2.0, y: 3.6, z: -72 }, value: 75 },
    ],
    switches: [],
  })),

  // -----------------------------------------------------------------------
  // WORLD 9: MEGA CONSTRUCTION (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => {
    const isBoss = lvl === 5;
    return {
      id: `w9-l${lvl}`,
      worldId: 9,
      levelNumber: lvl,
      name: [
        'Steel Foundry',
        'Crane Canopy',
        'Roller Conveyor',
        'Gravity Testbed',
        'Mega Rig Ascent',
      ][lvl - 1],
      subtitle: `World 9 · ${isBoss ? 'Boss Stage' : `Stage ${lvl}`}`,
      hint: isBoss
        ? 'BOSS ENCOUNTER: Outmaneuver the Mega Construction Rig across synchronized rollers and gravity bays!'
        : 'Combine Gravity Zones, rotating gears, and dual Road Rollers in the BHA Super-Corridor.',
      parTime: 48 + lvl * 4,
      spawn: { x: 0, y: 1.2, z: 0 },
      fallLimitY: -18,
      ceilingLimitY: 34,
      finishPosition: { x: 0, y: 5.5, z: -102 },
      allowGravityShift: true,
      allowTimeControl: true,
      allowDash: true,
      highwayLabel: `BHA MEGA SITE · BAY ${lvl}`,
      boss: isBoss
        ? {
            id: 'boss-w9',
            kind: 'mega_crane',
            name: 'SUPER-CORRIDOR RIG',
            subtitle: 'Dual-Arm Demolition Crane',
            position: { x: 0, y: 5.5, z: -76 },
            patrolWidth: 9,
            speed: 4.2,
          }
        : undefined,
      platforms: [
        { id: `w9l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7.5, y: 1.2, z: 18 }, materialStyle: 'steel' },
        { id: `w9l${lvl}-rol`, kind: 'roller', position: { x: 0, y: 0.4, z: -22 }, size: { x: 5.0, y: 1.4, z: 7.0 }, moveOffset: { x: 4.2, y: 0, z: 0 }, moveSpeed: 1.4 },
        { id: `w9l${lvl}-gz`, kind: 'gravityZone', position: { x: 0, y: 6.0, z: -40 }, size: { x: 9, y: 11, z: 18 }, zoneGravity: { x: 0, y: 14, z: 0 } },
        { id: `w9l${lvl}-ceil`, kind: 'solid', position: { x: 0, y: 11.5, z: -40 }, size: { x: 8.5, y: 1.0, z: 18 }, materialStyle: 'steel' },
        { id: `w9l${lvl}-gear`, kind: 'gear', position: { x: 0, y: 2.0, z: -59 }, size: { x: 10, y: 1.2, z: 10 }, materialStyle: 'copper', spinSpeed: 0.85 },
        { id: `w9l${lvl}-p2`, kind: 'solid', position: { x: 0, y: 4.0, z: -76 }, size: { x: 12, y: 1.2, z: 16 }, materialStyle: 'concrete' },
        { id: `w9l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 5.0, z: -98 }, size: { x: 10, y: 1.2, z: 16 }, materialStyle: 'steel' },
      ],
      portals: [],
      checkpoints: [{ id: `w9l${lvl}-cp1`, index: 1, position: { x: 0, y: 2.8, z: -59 }, label: 'Turntable Gear' }],
      collectibles: [
        ...makeCoinsRow(`w9l${lvl}`, 0, 9.6, -34, -6, 3),
        { id: `w9l${lvl}-h1`, kind: 'helmet', position: { x: 0, y: 4.4, z: -59 }, value: 50 },
        { id: `w9l${lvl}-bp1`, kind: 'blueprint', position: { x: 3.8, y: 5.8, z: -76 }, value: 75 },
      ],
      switches: [],
    };
  }),

  // -----------------------------------------------------------------------
  // WORLD 10: THE ULTIMATE BOUNCEBACK (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => {
    const isCollapsingBoss = lvl === 4 || lvl === 5;
    return {
      id: `w10-l${lvl}`,
      worldId: 10,
      levelNumber: lvl,
      name: [
        'Golden Kilometer',
        'Expressway Gauntlet',
        'Skybridge Convergence',
        'The Collapsing Bridge',
        'The Grand Finale',
      ][lvl - 1],
      subtitle: `World 10 · ${lvl === 5 ? 'Grand Finale' : `Stage ${lvl}`}`,
      hint:
        lvl === 5
          ? 'FINAL RUN: Chain Super Bounce, Double Jump, Portals, and Road Dash to cut the Golden Ribbon!'
          : 'The Golden Quadrilateral Zenith tests every road-building skill at peak velocity.',
      parTime: 52 + lvl * 4,
      spawn: { x: 0, y: 1.2, z: 0 },
      fallLimitY: -20,
      ceilingLimitY: 38,
      finishPosition: { x: 0, y: 8.5, z: -112 },
      allowGravityShift: true,
      allowTimeControl: true,
      allowDash: true,
      timeChallengeSec: lvl === 5 ? 65 : undefined,
      highwayLabel: `GOLDEN QUADRILATERAL · ZENITH`,
      trafficLanes: [
        { id: `w10l${lvl}-t1`, z: -32, y: 1.6, xMin: -9, xMax: 9, direction: 1, speed: 9.0, vehicleKind: 'truck', count: 2, bounceTop: true },
      ],
      boss: isCollapsingBoss
        ? {
            id: `boss-w10-${lvl}`,
            kind: 'collapsing_bridge',
            name: lvl === 5 ? 'ZENITH OVERLORD ROLLER' : 'THE COLLAPSING BRIDGE',
            subtitle: 'Final Expressway Challenge',
            position: { x: 0, y: 7.5, z: -86 },
            patrolWidth: 8.5,
            speed: 4.8,
          }
        : undefined,
      platforms: [
        { id: `w10l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 8, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
        { id: `w10l${lvl}-b1`, kind: 'bounce', position: { x: 0, y: 0.25, z: -13 }, size: { x: 3.4, y: 0.4, z: 3.4 }, bounceForce: 22 },
        { id: `w10l${lvl}-p2`, kind: 'solid', position: { x: 0, y: 1.0, z: -32 }, size: { x: 16, y: 1.2, z: 20 }, materialStyle: 'asphalt' },
        { id: `w10l${lvl}-cr1`, kind: 'crumbling', position: { x: 0, y: 3.2, z: -50 }, size: { x: 5.5, y: 0.9, z: 7 }, materialStyle: 'stone', crumbleDelay: 0.8, respawnDelay: 2.6 },
        { id: `w10l${lvl}-p3`, kind: 'solid', position: { x: 0, y: 5.5, z: -82 }, size: { x: 11, y: 1.2, z: 24 }, materialStyle: 'concrete' },
        { id: `w10l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 8.0, z: -108 }, size: { x: 12, y: 1.2, z: 20 }, materialStyle: 'asphalt' },
      ],
      portals: [
        {
          id: `w10l${lvl}-pt`,
          aPos: { x: 0, y: 5.4, z: -52 },
          aNormal: { x: 0, y: 0, z: 1 },
          bPos: { x: 0, y: 8.0, z: -69 },
          bNormal: { x: 0, y: 0, z: -1 },
          boost: 1.2,
        },
      ],
      checkpoints: [{ id: `w10l${lvl}-cp1`, index: 1, position: { x: 0, y: 6.1, z: -72 }, label: 'Zenith Approach' }],
      collectibles: [
        ...makeCoinsRow(`w10l${lvl}`, 0, 2.8, -24, -8, 3),
        { id: `w10l${lvl}-h1`, kind: 'helmet', position: { x: 0, y: 9.8, z: -90 }, value: 50 },
        { id: `w10l${lvl}-s1`, kind: 'sign', position: { x: 4.0, y: 9.6, z: -102 }, value: 100 },
      ],
      switches: [],
    };
  }),
];
