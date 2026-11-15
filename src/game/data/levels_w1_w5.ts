import type {
  CollectibleDef,
  LevelDefinition,
  TrafficLaneDef,
} from '../types';

function makeCoinsRow(prefix: string, x: number, y: number, zStart: number, zStep: number, count: number): CollectibleDef[] {
  const list: CollectibleDef[] = [];
  for (let i = 0; i < count; i++) {
    list.push({ id: `${prefix}-c${i + 1}`, kind: 'coin', position: { x, y, z: zStart + i * zStep }, value: 10 });
  }
  return list;
}

// =========================================================================
// WORLDS 1 TO 5 (25 HANDCRAFTED PLAYABLE LEVELS)
// =========================================================================

export const LEVELS_W1_W5: LevelDefinition[] = [
  // -----------------------------------------------------------------------
  // WORLD 1: THE GREAT START (5 Levels)
  // -----------------------------------------------------------------------
  {
    id: 'w1-l1',
    worldId: 1,
    levelNumber: 1,
    name: 'Site Induction',
    subtitle: 'World 1 · Stage 1',
    hint: 'WASD to Move, SPACE to Jump (twice for Double Jump), Q for Super Bounce, SHIFT to Sprint.',
    parTime: 32,
    spawn: { x: 0, y: 1.2, z: 0 },
    spawnYaw: 0,
    fallLimitY: -12,
    finishPosition: { x: 0, y: 2.0, z: -78 },
    allowGravityShift: false,
    allowTimeControl: false,
    allowDash: true,
    highwayLabel: 'NH-01 · SITE ALPHA',
    platforms: [
      { id: 'w1l1-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -8 }, size: { x: 7.5, y: 1.2, z: 24 }, materialStyle: 'asphalt' },
      { id: 'w1l1-b1', kind: 'bounce', position: { x: 0, y: 0.25, z: -17 }, size: { x: 3.4, y: 0.4, z: 3.4 }, bounceForce: 19 },
      { id: 'w1l1-p2', kind: 'solid', position: { x: 0, y: 2.0, z: -31 }, size: { x: 7.0, y: 1.2, z: 16 }, materialStyle: 'concrete' },
      { id: 'w1l1-lowbar', kind: 'wall', position: { x: 0, y: 4.1, z: -33 }, size: { x: 6.4, y: 1.4, z: 1.0 }, materialStyle: 'steel' },
      { id: 'w1l1-p3', kind: 'solid', position: { x: 0, y: 1.5, z: -50 }, size: { x: 7.0, y: 1.2, z: 16 }, materialStyle: 'asphalt' },
      { id: 'w1l1-side', kind: 'solid', position: { x: 7.0, y: 2.2, z: -49 }, size: { x: 4.2, y: 1.0, z: 6 }, materialStyle: 'concrete' },
      { id: 'w1l1-fin', kind: 'solid', position: { x: 0, y: 1.5, z: -72 }, size: { x: 9.0, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
    ],
    portals: [],
    checkpoints: [{ id: 'w1l1-cp1', index: 1, position: { x: 0, y: 2.6, z: -26 }, label: 'Barrier Gate' }],
    collectibles: [
      ...makeCoinsRow('w1l1', 0, 1.2, -5, -4, 3),
      { id: 'w1l1-h1', kind: 'helmet', position: { x: 7.0, y: 3.8, z: -49 }, value: 50 },
      { id: 'w1l1-bp1', kind: 'blueprint', position: { x: 0, y: 4.2, z: -33 }, value: 75 },
      { id: 'w1l1-e1', kind: 'energy', position: { x: 0, y: 3.2, z: -52 }, value: 25 },
    ],
    switches: [],
  },
  {
    id: 'w1-l2',
    worldId: 1,
    levelNumber: 2,
    name: 'Cone Alley',
    subtitle: 'World 1 · Stage 2',
    hint: 'Use CTRL to Slide under high steel barriers and SPACE twice to Double Jump wide gaps.',
    parTime: 36,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -12,
    finishPosition: { x: 0, y: 2.5, z: -86 },
    allowGravityShift: false,
    allowTimeControl: false,
    allowDash: true,
    highwayLabel: 'NH-01 · CONE LANE',
    platforms: [
      { id: 'w1l2-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -8 }, size: { x: 7, y: 1.2, z: 22 }, materialStyle: 'asphalt' },
      { id: 'w1l2-bar1', kind: 'wall', position: { x: 0, y: 1.9, z: -11 }, size: { x: 6.5, y: 1.2, z: 0.9 }, materialStyle: 'steel' },
      { id: 'w1l2-p2', kind: 'solid', position: { x: -2.2, y: 0.2, z: -28 }, size: { x: 5.5, y: 1.2, z: 12 }, materialStyle: 'concrete' },
      { id: 'w1l2-p3', kind: 'solid', position: { x: 2.2, y: 1.0, z: -45 }, size: { x: 5.5, y: 1.2, z: 12 }, materialStyle: 'asphalt' },
      { id: 'w1l2-b1', kind: 'bounce', position: { x: 2.2, y: 1.75, z: -49 }, size: { x: 3.2, y: 0.4, z: 3.2 }, bounceForce: 20 },
      { id: 'w1l2-p4', kind: 'solid', position: { x: 0, y: 2.0, z: -66 }, size: { x: 6.5, y: 1.2, z: 16 }, materialStyle: 'asphalt' },
      { id: 'w1l2-bar2', kind: 'wall', position: { x: 0, y: 4.4, z: -66 }, size: { x: 6.0, y: 1.2, z: 0.9 }, materialStyle: 'steel' },
      { id: 'w1l2-fin', kind: 'solid', position: { x: 0, y: 2.0, z: -83 }, size: { x: 9.0, y: 1.2, z: 14 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [{ id: 'w1l2-cp1', index: 1, position: { x: 2.2, y: 1.6, z: -42 }, label: 'Depot Bend' }],
    collectibles: [
      ...makeCoinsRow('w1l2', 0, 1.2, -6, -4, 3),
      { id: 'w1l2-c4', kind: 'coin', position: { x: -2.2, y: 1.8, z: -28 } },
      { id: 'w1l2-h1', kind: 'helmet', position: { x: 0, y: 5.8, z: -57 }, value: 50 },
      { id: 'w1l2-s1', kind: 'sign', position: { x: -3.2, y: 2.2, z: -64 }, value: 100 },
    ],
    switches: [],
  },
  {
    id: 'w1-l3',
    worldId: 1,
    levelNumber: 3,
    name: 'Roller Ridge',
    subtitle: 'World 1 · Stage 3',
    hint: 'Ride moving yellow Road Rollers across construction trenches! Press [E] at switches to deploy bridges.',
    parTime: 40,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -12,
    finishPosition: { x: 0, y: 2.5, z: -92 },
    allowGravityShift: false,
    allowTimeControl: false,
    allowDash: true,
    highwayLabel: 'NH-01 · COMPACTOR',
    platforms: [
      { id: 'w1l3-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
      { id: 'w1l3-rol1', kind: 'roller', position: { x: 0, y: 0.2, z: -23 }, size: { x: 4.5, y: 1.4, z: 6.5 }, moveOffset: { x: 0, y: 0, z: 6 }, moveSpeed: 1.1 },
      { id: 'w1l3-p2', kind: 'solid', position: { x: 0, y: 0.5, z: -41 }, size: { x: 7.5, y: 1.2, z: 14 }, materialStyle: 'concrete' },
      { id: 'w1l3-br1', kind: 'bridge', position: { x: 0, y: 1.0, z: -56 }, size: { x: 4.5, y: 0.8, z: 12 }, materialStyle: 'steel', startsActive: false, switchId: 'w1l3-sw1' },
      { id: 'w1l3-p3', kind: 'solid', position: { x: 0, y: 1.5, z: -70 }, size: { x: 7.0, y: 1.2, z: 12 }, materialStyle: 'asphalt' },
      { id: 'w1l3-fin', kind: 'solid', position: { x: 0, y: 2.0, z: -88 }, size: { x: 9.0, y: 1.2, z: 14 }, materialStyle: 'asphalt' },
    ],
    portals: [],
    checkpoints: [{ id: 'w1l3-cp1', index: 1, position: { x: 0, y: 1.1, z: -38 }, label: 'Compactor Yard' }],
    collectibles: [
      ...makeCoinsRow('w1l3', 0, 2.2, -19, -4, 3),
      { id: 'w1l3-bp1', kind: 'blueprint', position: { x: 0, y: 2.8, z: -56 }, value: 75 },
      { id: 'w1l3-h1', kind: 'helmet', position: { x: 0, y: 3.4, z: -70 }, value: 50 },
    ],
    switches: [{ id: 'w1l3-sw1', position: { x: 2.4, y: 1.1, z: -44 }, label: 'Deploy Steel Span' }],
  },
  {
    id: 'w1-l4',
    worldId: 1,
    levelNumber: 4,
    name: 'Barrier Hop',
    subtitle: 'World 1 · Stage 4',
    hint: 'Chain Super Bounce [Q] and Road Dash [V] across staggered construction islands.',
    parTime: 42,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -12,
    finishPosition: { x: 0, y: 4.0, z: -96 },
    allowGravityShift: false,
    allowTimeControl: false,
    allowDash: true,
    highwayLabel: 'NH-01 · INTERCHANGE',
    platforms: [
      { id: 'w1l4-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 7, y: 1.2, z: 16 }, materialStyle: 'asphalt' },
      { id: 'w1l4-b1', kind: 'bounce', position: { x: 0, y: 0.25, z: -11 }, size: { x: 3.4, y: 0.4, z: 3.4 }, bounceForce: 20 },
      { id: 'w1l4-m1', kind: 'moving', position: { x: 0, y: 2.0, z: -27 }, size: { x: 5.5, y: 1.0, z: 7 }, materialStyle: 'steel', moveOffset: { x: 4.5, y: 0, z: 0 }, moveSpeed: 1.4 },
      { id: 'w1l4-p2', kind: 'solid', position: { x: 0, y: 2.5, z: -45 }, size: { x: 7.5, y: 1.2, z: 14 }, materialStyle: 'concrete' },
      { id: 'w1l4-r1', kind: 'ramp', position: { x: 0, y: 3.6, z: -57 }, size: { x: 4.6, y: 0.8, z: 10 }, rotation: { x: 0.2, y: 0, z: 0 }, materialStyle: 'asphalt' },
      { id: 'w1l4-p3', kind: 'solid', position: { x: 0, y: 3.5, z: -74 }, size: { x: 6.5, y: 1.2, z: 12 }, materialStyle: 'asphalt' },
      { id: 'w1l4-fin', kind: 'solid', position: { x: 0, y: 3.5, z: -93 }, size: { x: 9.0, y: 1.2, z: 14 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [{ id: 'w1l4-cp1', index: 1, position: { x: 0, y: 3.1, z: -43 }, label: 'Ramp Approach' }],
    collectibles: [
      ...makeCoinsRow('w1l4', 0, 5.2, -54, -3, 3),
      { id: 'w1l4-e1', kind: 'energy', position: { x: 0, y: 4.2, z: -27 }, value: 25 },
      { id: 'w1l4-h1', kind: 'helmet', position: { x: 0, y: 5.4, z: -74 }, value: 50 },
    ],
    switches: [],
  },
  {
    id: 'w1-l5',
    worldId: 1,
    levelNumber: 5,
    name: "Foreman's Giant Roller",
    subtitle: 'World 1 · Boss Stage',
    hint: 'BOSS ENCOUNTER: Leap over the Giant Road Roller shockwaves and hit the finish plaza!',
    parTime: 45,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -12,
    finishPosition: { x: 0, y: 2.0, z: -102 },
    allowGravityShift: false,
    allowTimeControl: false,
    allowDash: true,
    highwayLabel: 'NH-01 · BOSS ARENA',
    boss: {
      id: 'boss-w1',
      kind: 'giant_roller',
      name: 'THE GIANT ROAD ROLLER',
      subtitle: 'Heavy Compactor Mk-I',
      position: { x: 0, y: 2.2, z: -56 },
      patrolWidth: 8,
      speed: 3.6,
    },
    platforms: [
      { id: 'w1l5-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -10 }, size: { x: 8, y: 1.2, z: 26 }, materialStyle: 'asphalt' },
      { id: 'w1l5-b1', kind: 'bounce', position: { x: -2.2, y: 0.25, z: -21 }, size: { x: 3.0, y: 0.4, z: 3.0 }, bounceForce: 21 },
      { id: 'w1l5-arena', kind: 'solid', position: { x: 0, y: 0.0, z: -56 }, size: { x: 14, y: 1.4, z: 54 }, materialStyle: 'concrete' },
      { id: 'w1l5-b2', kind: 'bounce', position: { x: 4.2, y: 0.85, z: -48 }, size: { x: 3.2, y: 0.4, z: 3.2 }, bounceForce: 22 },
      { id: 'w1l5-b3', kind: 'bounce', position: { x: -4.2, y: 0.85, z: -64 }, size: { x: 3.2, y: 0.4, z: 3.2 }, bounceForce: 22 },
      { id: 'w1l5-fin', kind: 'solid', position: { x: 0, y: 1.5, z: -98 }, size: { x: 10, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
    ],
    portals: [],
    checkpoints: [{ id: 'w1l5-cp1', index: 1, position: { x: 0, y: 0.7, z: -33 }, label: 'Arena Threshold' }],
    collectibles: [
      ...makeCoinsRow('w1l5', 0, 2.0, -38, -8, 4),
      { id: 'w1l5-bp1', kind: 'blueprint', position: { x: 4.2, y: 5.0, z: -48 }, value: 75 },
      { id: 'w1l5-h1', kind: 'helmet', position: { x: -4.2, y: 5.0, z: -64 }, value: 50 },
    ],
    switches: [],
  },

  // -----------------------------------------------------------------------
  // WORLD 2: HIGHWAY HUSTLE (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => {
    const isBoss = lvl === 5;
    const lanes: TrafficLaneDef[] = [
      { id: `w2l${lvl}-t1`, z: -26, y: 0.5, xMin: -10, xMax: 10, direction: 1, speed: 6 + lvl * 1.1, vehicleKind: 'auto', count: 2, bounceTop: true },
      { id: `w2l${lvl}-t2`, z: -38, y: 0.5, xMin: -10, xMax: 10, direction: -1, speed: 7 + lvl * 1.2, vehicleKind: lvl % 2 === 0 ? 'truck' : 'car', count: 2, bounceTop: true },
      { id: `w2l${lvl}-t3`, z: -62, y: 1.5, xMin: -10, xMax: 10, direction: 1, speed: 8 + lvl * 1.1, vehicleKind: 'bus', count: 2, bounceTop: true },
    ];
    return {
      id: `w2-l${lvl}`,
      worldId: 2,
      levelNumber: lvl,
      name: [
        'Toll Plaza Dash',
        'Six-Lane Sprint',
        'Truck Surfing',
        'Expressway Interchange',
        'The Highway Traffic Machine',
      ][lvl - 1],
      subtitle: `World 2 · ${isBoss ? 'Boss Stage' : `Stage ${lvl}`}`,
      hint: isBoss
        ? 'BOSS ENCOUNTER: Bounce over the Highway Traffic Machine lanes to reach the Toll Finish!'
        : 'Dodge oncoming expressway traffic OR land squarely on vehicle roofs for a Super Bounce!',
      parTime: 38 + lvl * 3,
      spawn: { x: 0, y: 1.2, z: 0 },
      fallLimitY: -14,
      finishPosition: { x: 0, y: 2.5, z: -96 },
      allowGravityShift: false,
      allowTimeControl: true,
      allowDash: true,
      timeChallengeSec: lvl >= 3 ? 42 : undefined,
      highwayLabel: `NH-48 · KM ${lvl * 14}`,
      trafficLanes: lanes,
      boss: isBoss
        ? {
            id: 'boss-w2',
            kind: 'traffic_machine',
            name: 'HIGHWAY TRAFFIC MACHINE',
            subtitle: 'Automated Multi-Lane Convoy',
            position: { x: 0, y: 2.0, z: -76 },
            patrolWidth: 9,
            speed: 4.5,
          }
        : undefined,
      platforms: [
        { id: `w2l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 9, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
        { id: `w2l${lvl}-hwy1`, kind: 'solid', position: { x: 0, y: 0.0, z: -32 }, size: { x: 18, y: 1.2, z: 26 }, materialStyle: 'asphalt' },
        { id: `w2l${lvl}-b1`, kind: 'bounce', position: { x: lvl % 2 === 0 ? -3 : 3, y: 0.75, z: -43 }, size: { x: 3.4, y: 0.4, z: 3.4 }, bounceForce: 21 },
        { id: `w2l${lvl}-hwy2`, kind: 'solid', position: { x: 0, y: 1.0, z: -64 }, size: { x: 18, y: 1.2, z: 26 }, materialStyle: 'asphalt' },
        { id: `w2l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 2.0, z: -93 }, size: { x: 11, y: 1.2, z: 18 }, materialStyle: 'concrete' },
      ],
      portals: [],
      checkpoints: [{ id: `w2l${lvl}-cp1`, index: 1, position: { x: 0, y: 1.7, z: -53 }, label: 'Toll Booth' }],
      collectibles: [
        ...makeCoinsRow(`w2l${lvl}`, 0, 1.5, -20, -10, 3),
        { id: `w2l${lvl}-h1`, kind: 'helmet', position: { x: lvl % 2 === 0 ? -4 : 4, y: 4.5, z: -48 }, value: 50 },
        { id: `w2l${lvl}-bp1`, kind: 'blueprint', position: { x: 0, y: 3.2, z: -66 }, value: 75 },
        ...(lvl === 4 ? [{ id: `w2l${lvl}-s1`, kind: 'sign' as const, position: { x: -7, y: 2.6, z: -64 }, value: 100 }] : []),
      ],
      switches: [],
    };
  }),

  // -----------------------------------------------------------------------
  // WORLD 3: BRIDGE BREAKER (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => {
    const isBoss = lvl === 5;
    return {
      id: `w3-l${lvl}`,
      worldId: 3,
      levelNumber: lvl,
      name: [
        'Girder Walk',
        'Crane Swing',
        'Elevator Hoist',
        'Broken Cable Span',
        'Mega Construction Crane',
      ][lvl - 1],
      subtitle: `World 3 · ${isBoss ? 'Boss Stage' : `Stage ${lvl}`}`,
      hint: isBoss
        ? 'BOSS ENCOUNTER: Time your leaps past the Mega Construction Crane counterweight!'
        : 'Use suspended construction hoists and steel girders to cross the river gorge.',
      parTime: 40 + lvl * 3,
      spawn: { x: 0, y: 1.2, z: 0 },
      fallLimitY: -18,
      finishPosition: { x: 0, y: 6.5, z: -98 },
      allowGravityShift: false,
      allowTimeControl: true,
      allowDash: true,
      highwayLabel: `RIVER BRIDGE · PIER ${lvl}`,
      boss: isBoss
        ? {
            id: 'boss-w3',
            kind: 'mega_crane',
            name: 'MEGA CONSTRUCTION CRANE',
            subtitle: 'Heavy Girder Sweeper',
            position: { x: 0, y: 6.5, z: -68 },
            patrolWidth: 9,
            speed: 3.2,
          }
        : undefined,
      platforms: [
        { id: `w3l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7, y: 1.2, z: 18 }, materialStyle: 'concrete' },
        { id: `w3l${lvl}-m1`, kind: 'moving', position: { x: 0, y: 0.8, z: -23 }, size: { x: 5.5, y: 1.0, z: 8 }, materialStyle: 'steel', moveOffset: { x: 3.8, y: 1.5, z: 0 }, moveSpeed: 1.2 + lvl * 0.15 },
        { id: `w3l${lvl}-p2`, kind: 'solid', position: { x: 0, y: 2.5, z: -40 }, size: { x: 6.5, y: 1.2, z: 14 }, materialStyle: 'concrete' },
        { id: `w3l${lvl}-b1`, kind: 'bounce', position: { x: 0, y: 3.25, z: -45 }, size: { x: 3.4, y: 0.4, z: 3.4 }, bounceForce: 22 },
        { id: `w3l${lvl}-cr1`, kind: 'crumbling', position: { x: lvl % 2 === 0 ? 2 : -2, y: 4.5, z: -59 }, size: { x: 5.5, y: 0.9, z: 8 }, materialStyle: 'stone', crumbleDelay: 1.0, respawnDelay: 3.0 },
        { id: `w3l${lvl}-p3`, kind: 'solid', position: { x: 0, y: 5.5, z: -74 }, size: { x: 10, y: 1.2, z: 16 }, materialStyle: 'steel' },
        { id: `w3l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 6.0, z: -95 }, size: { x: 9.5, y: 1.2, z: 16 }, materialStyle: 'concrete' },
      ],
      portals: [],
      checkpoints: [{ id: `w3l${lvl}-cp1`, index: 1, position: { x: 0, y: 3.1, z: -38 }, label: 'Cable Pylon' }],
      collectibles: [
        ...makeCoinsRow(`w3l${lvl}`, 0, 2.5, -18, -10, 3),
        { id: `w3l${lvl}-h1`, kind: 'helmet', position: { x: 0, y: 8.2, z: -52 }, value: 50 },
        { id: `w3l${lvl}-bp1`, kind: 'blueprint', position: { x: 3.2, y: 7.5, z: -74 }, value: 75 },
      ],
      switches: [],
    };
  }),

  // -----------------------------------------------------------------------
  // WORLD 4: MOUNTAIN EXPRESS (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => ({
    id: `w4-l${lvl}`,
    worldId: 4,
    levelNumber: lvl,
    name: [
      'Ghat Switchbacks',
      'Foggy Gorge',
      'Landslide Pass',
      'Hill Tunnel Mouth',
      'Summit Viaduct',
    ][lvl - 1],
    subtitle: `World 4 · Stage ${lvl}`,
    hint: 'Navigate winding mountain hairpins, stone ramps, and misty gorge wind currents.',
    parTime: 44 + lvl * 3,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -18,
    finishPosition: { x: 0, y: 7.5, z: -98 },
    allowGravityShift: lvl >= 4,
    allowTimeControl: true,
    allowDash: true,
    highwayLabel: `GHAT NH-66 · ELEV ${1200 + lvl * 180}M`,
    platforms: [
      { id: `w4l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7, y: 1.2, z: 18 }, materialStyle: 'stone' },
      { id: `w4l${lvl}-r1`, kind: 'ramp', position: { x: -3.0, y: 1.2, z: -22 }, size: { x: 5.0, y: 0.9, z: 13 }, rotation: { x: 0.22, y: 0.18, z: 0 }, materialStyle: 'asphalt' },
      { id: `w4l${lvl}-p2`, kind: 'solid', position: { x: -4.5, y: 3.0, z: -38 }, size: { x: 6.5, y: 1.2, z: 14 }, materialStyle: 'stone' },
      { id: `w4l${lvl}-wind`, kind: 'windZone', position: { x: 0, y: 5.5, z: -54 }, size: { x: 8, y: 6, z: 10 }, zoneForce: { x: 0, y: 16, z: -4 } },
      { id: `w4l${lvl}-p3`, kind: 'solid', position: { x: 3.5, y: 5.0, z: -68 }, size: { x: 7.0, y: 1.2, z: 16 }, materialStyle: 'asphalt' },
      { id: `w4l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 7.0, z: -93 }, size: { x: 9.5, y: 1.2, z: 18 }, materialStyle: 'stone' },
    ],
    portals: [],
    checkpoints: [{ id: `w4l${lvl}-cp1`, index: 1, position: { x: -4.5, y: 3.6, z: -36 }, label: 'Valley Outlook' }],
    collectibles: [
      ...makeCoinsRow(`w4l${lvl}`, -3.0, 3.2, -19, -5, 3),
      { id: `w4l${lvl}-e1`, kind: 'energy', position: { x: 0, y: 6.5, z: -54 }, value: 25 },
      { id: `w4l${lvl}-h1`, kind: 'helmet', position: { x: 3.5, y: 7.0, z: -68 }, value: 50 },
      ...(lvl === 3 ? [{ id: `w4l${lvl}-s1`, kind: 'sign' as const, position: { x: 5.8, y: 6.8, z: -72 }, value: 100 }] : []),
    ],
    switches: [],
  })),

  // -----------------------------------------------------------------------
  // WORLD 5: THE POTHOLE KINGDOM (5 Levels)
  // -----------------------------------------------------------------------
  ...([1, 2, 3, 4, 5] as const).map((lvl): LevelDefinition => ({
    id: `w5-l${lvl}`,
    worldId: 5,
    levelNumber: lvl,
    name: [
      'Crater Crossing',
      'Asphalt Collapse',
      'Spring Potholes',
      'Detour Maze',
      'Grand Crater Leap',
    ][lvl - 1],
    subtitle: `World 5 · Stage ${lvl}`,
    hint: 'Watch out for crumbling asphalt tiles and bouncing pothole springs!',
    parTime: 42 + lvl * 3,
    spawn: { x: 0, y: 1.2, z: 0 },
    fallLimitY: -16,
    finishPosition: { x: 0, y: 3.5, z: -96 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    highwayLabel: `CRATER ZONE · SECTOR ${lvl}`,
    platforms: [
      { id: `w5l${lvl}-p1`, kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7.5, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
      { id: `w5l${lvl}-cr1`, kind: 'crumbling', position: { x: 0, y: -0.4, z: -19 }, size: { x: 5.2, y: 0.9, z: 6.5 }, materialStyle: 'asphalt', crumbleDelay: 0.85, respawnDelay: 2.8 },
      { id: `w5l${lvl}-pot1`, kind: 'pothole', position: { x: -2.5, y: 0.0, z: -29 }, size: { x: 4.5, y: 0.8, z: 5.0 }, bounceForce: 21 },
      { id: `w5l${lvl}-cr2`, kind: 'crumbling', position: { x: 2.2, y: 1.0, z: -39 }, size: { x: 5.2, y: 0.9, z: 6.5 }, materialStyle: 'asphalt', crumbleDelay: 0.85, respawnDelay: 2.8 },
      { id: `w5l${lvl}-p2`, kind: 'solid', position: { x: 0, y: 1.2, z: -53 }, size: { x: 8.5, y: 1.2, z: 14 }, materialStyle: 'concrete' },
      { id: `w5l${lvl}-b1`, kind: 'bounce', position: { x: 0, y: 2.0, z: -69 }, size: { x: 4.2, y: 0.5, z: 4.2 }, bounceForce: 23 },
      { id: `w5l${lvl}-fin`, kind: 'solid', position: { x: 0, y: 3.0, z: -91 }, size: { x: 9.5, y: 1.2, z: 18 }, materialStyle: 'asphalt' },
    ],
    portals: lvl >= 4
      ? [{
          id: `w5l${lvl}-pt`,
          aPos: { x: 0, y: 3.3, z: -58 },
          aNormal: { x: 0, y: 0, z: 1 },
          bPos: { x: 0, y: 5.0, z: -78 },
          bNormal: { x: 0, y: 0, z: -1 },
          boost: 1.15,
        }]
      : [],
    checkpoints: [{ id: `w5l${lvl}-cp1`, index: 1, position: { x: 0, y: 1.8, z: -51 }, label: 'Repair Patch' }],
    collectibles: [
      ...makeCoinsRow(`w5l${lvl}`, 0, 1.5, -19, -10, 3),
      { id: `w5l${lvl}-bp1`, kind: 'blueprint', position: { x: 2.2, y: 3.0, z: -39 }, value: 75 },
      { id: `w5l${lvl}-h1`, kind: 'helmet', position: { x: 0, y: 6.8, z: -73 }, value: 50 },
    ],
    switches: [],
  })),
];
