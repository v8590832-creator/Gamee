import type { LevelDefinition } from '../types';

export const LEVELS: LevelDefinition[] = [
  // =========================================================================
  // WORLD 01: THE AWAKENING (5 Handcrafted Levels)
  // =========================================================================
  {
    id: 'w1-l1',
    worldId: 1,
    levelNumber: 1,
    name: 'Conduit Crossing',
    subtitle: 'Foundry Approach',
    hint: 'Roll with WASD, Space to Jump, and ride the copper pneumatic pads.',
    parTime: 38,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -12,
    finishPosition: { x: 0, y: 6.5, z: -86 },
    allowGravityShift: false,
    allowTimeControl: false,
    allowDash: true,
    platforms: [
      // Starting gantry
      { id: 'w1l1-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 7, y: 1, z: 16 }, materialStyle: 'concrete' },
      // First clean jump gap (z: -13 -> -17.5, gap 4.5m)
      { id: 'w1l1-p2', kind: 'solid', position: { x: 0, y: -0.5, z: -26 }, size: { x: 6.5, y: 1, z: 17 }, materialStyle: 'concrete' },
      // Optional side reward ledge
      { id: 'w1l1-side1', kind: 'solid', position: { x: 7.5, y: 0.2, z: -26 }, size: { x: 4, y: 0.8, z: 5 }, materialStyle: 'steel' },
      // Pneumatic bounce pad at end of p2
      {
        id: 'w1l1-b1',
        kind: 'bounce',
        position: { x: 0, y: 0.15, z: -32 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 19.5,
        restitution: 0.7,
      },
      // Upper catwalk (y=6.0 top at y=6.5? Let's make top surface y=6.0: pos.y = 5.5, size.y = 1.0)
      { id: 'w1l1-p3', kind: 'solid', position: { x: 0, y: 5.5, z: -46 }, size: { x: 7, y: 1, z: 18 }, materialStyle: 'steel' },
      // Gentle downward ramp to mid terrace
      {
        id: 'w1l1-ramp',
        kind: 'ramp',
        position: { x: 0, y: 4.3, z: -59 },
        size: { x: 5.2, y: 0.8, z: 9 },
        rotation: { x: 0.24, y: 0, z: 0 },
        materialStyle: 'concrete',
      },
      // Mid terrace with second bounce pad
      { id: 'w1l1-p4', kind: 'solid', position: { x: 0, y: 2.8, z: -68 }, size: { x: 6.5, y: 1, z: 10 }, materialStyle: 'concrete' },
      {
        id: 'w1l1-b2',
        kind: 'bounce',
        position: { x: 0, y: 3.45, z: -71 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 17.5,
        bounceDirection: { x: 0, y: 0.92, z: -0.39 },
        restitution: 0.75,
      },
      // Finish Spire Platform (top surface y=6.5 -> pos.y=6.0, size.y=1)
      { id: 'w1l1-fin', kind: 'solid', position: { x: 0, y: 6.0, z: -85 }, size: { x: 8, y: 1, z: 11 }, materialStyle: 'steel' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w1l1-cp1', index: 1, position: { x: 0, y: 6.0, z: -41 }, label: 'Upper Crane Gantry' },
    ],
    collectibles: [
      { id: 'w1l1-c1', position: { x: 0, y: 1.2, z: -15 } },
      { id: 'w1l1-c2', position: { x: 7.5, y: 1.8, z: -26 } },
      { id: 'w1l1-c3', position: { x: 0, y: 6.8, z: -36 } },
      { id: 'w1l1-c4', position: { x: 0, y: 4.5, z: -68 } },
      { id: 'w1l1-c5', position: { x: 0, y: 9.0, z: -77 } },
    ],
    switches: [],
  },

  {
    id: 'w1-l2',
    worldId: 1,
    levelNumber: 2,
    name: 'Pneumatic Foundry',
    subtitle: 'Piston Hall & Wall Rebounds',
    hint: 'Use Time Control [T] to slow reciprocating piston bridges, and bounce off angled deflectors.',
    parTime: 48,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -14,
    finishPosition: { x: 14, y: 9.5, z: -82 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w1l2-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -4 }, size: { x: 7, y: 1, z: 14 }, materialStyle: 'concrete' },
      // Moving lateral piston bridge 1
      {
        id: 'w1l2-m1',
        kind: 'moving',
        position: { x: 0, y: -0.5, z: -17 },
        size: { x: 5, y: 0.9, z: 7 },
        materialStyle: 'steel',
        moveOffset: { x: 4.5, y: 0, z: 0 },
        moveSpeed: 1.35,
        movePhase: 0,
      },
      // Landing deck + angled wall rebound corner
      { id: 'w1l2-p2', kind: 'solid', position: { x: 0, y: -0.5, z: -29 }, size: { x: 8, y: 1, z: 11 }, materialStyle: 'concrete' },
      // Angled bounce wall that kicks player right (+X) toward side terrace
      {
        id: 'w1l2-wb1',
        kind: 'bounce',
        position: { x: -3.2, y: 1.8, z: -32 },
        size: { x: 1.0, y: 3.6, z: 6.5 },
        rotation: { x: 0, y: 0.35, z: 0 },
        materialStyle: 'copper',
        bounceForce: 16,
        bounceDirection: { x: 0.85, y: 0.45, z: -0.25 },
        restitution: 0.9,
      },
      // Right-shifted bridge deck
      { id: 'w1l2-p3', kind: 'solid', position: { x: 11, y: 0.5, z: -35 }, size: { x: 7, y: 1, z: 13 }, materialStyle: 'steel' },
      // Double bounce cascade up
      {
        id: 'w1l2-b1',
        kind: 'bounce',
        position: { x: 11, y: 1.15, z: -40 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 18.5,
      },
      { id: 'w1l2-p4', kind: 'solid', position: { x: 11, y: 5.0, z: -51 }, size: { x: 6.5, y: 1, z: 11 }, materialStyle: 'concrete' },
      // Second moving lift (vertical + forward)
      {
        id: 'w1l2-m2',
        kind: 'moving',
        position: { x: 12.5, y: 6.5, z: -64 },
        size: { x: 5.2, y: 0.9, z: 8 },
        materialStyle: 'steel',
        moveOffset: { x: 0, y: 2.2, z: 3.5 },
        moveSpeed: 1.5,
        movePhase: 1.2,
      },
      // High smelter terrace & finish
      { id: 'w1l2-fin', kind: 'solid', position: { x: 14, y: 9.0, z: -80 }, size: { x: 8.5, y: 1, z: 12 }, materialStyle: 'steel' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w1l2-cp1', index: 1, position: { x: 11, y: 1.0, z: -32 }, label: 'East Deflector Bay' },
      { id: 'w1l2-cp2', index: 2, position: { x: 11, y: 5.5, z: -49 }, label: 'Upper Piston Terrace' },
    ],
    collectibles: [
      { id: 'w1l2-c1', position: { x: 0, y: 1.2, z: -17 } },
      { id: 'w1l2-c2', position: { x: 4.5, y: 2.8, z: -33 } },
      { id: 'w1l2-c3', position: { x: 11, y: 7.5, z: -44 } },
      { id: 'w1l2-c4', position: { x: 12.5, y: 10.0, z: -64 } },
      { id: 'w1l2-c5', position: { x: 18, y: 10.6, z: -79 } },
    ],
    switches: [],
  },

  {
    id: 'w1-l3',
    worldId: 1,
    levelNumber: 3,
    name: 'The Counterweight',
    subtitle: 'Relay Span & Surge Gap',
    hint: 'Press [E] near the relay console to extend the bridge, and [Shift] for a Momentum Dash.',
    parTime: 50,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -14,
    finishPosition: { x: 0, y: 4.5, z: -94 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w1l3-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 7, y: 1, z: 16 }, materialStyle: 'concrete' },
      // Switch-activated bridge across chasm
      {
        id: 'w1l3-br1',
        kind: 'bridge',
        position: { x: 0, y: -0.5, z: -20 },
        size: { x: 4.8, y: 0.7, z: 12 },
        materialStyle: 'copper',
        startsActive: false,
        switchId: 'w1l3-sw1',
      },
      // Mid platform after bridge
      { id: 'w1l3-p2', kind: 'solid', position: { x: 0, y: -0.5, z: -33 }, size: { x: 7.5, y: 1, z: 12 }, materialStyle: 'steel' },
      // Wide 14m Momentum Dash Chasm! (z: -39 to -53)
      { id: 'w1l3-p3', kind: 'solid', position: { x: 0, y: -0.5, z: -59 }, size: { x: 7.5, y: 1, z: 12 }, materialStyle: 'concrete' },
      // Counterweight bounce lift
      {
        id: 'w1l3-b1',
        kind: 'bounce',
        position: { x: 0, y: 0.15, z: -63 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 19,
      },
      // Twin counterweight moving platforms
      {
        id: 'w1l3-m1',
        kind: 'moving',
        position: { x: -3.5, y: 4.0, z: -73 },
        size: { x: 4.5, y: 0.9, z: 7 },
        materialStyle: 'steel',
        moveOffset: { x: 0, y: 2.5, z: 0 },
        moveSpeed: 1.4,
        movePhase: 0,
      },
      {
        id: 'w1l3-m2',
        kind: 'moving',
        position: { x: 3.5, y: 4.0, z: -78 },
        size: { x: 4.5, y: 0.9, z: 7 },
        materialStyle: 'steel',
        moveOffset: { x: 0, y: 2.5, z: 0 },
        moveSpeed: 1.4,
        movePhase: Math.PI,
      },
      // Finish deck
      { id: 'w1l3-fin', kind: 'solid', position: { x: 0, y: 4.0, z: -93 }, size: { x: 8.5, y: 1, z: 12 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w1l3-cp1', index: 1, position: { x: 0, y: 0.0, z: -31 }, label: 'Relay Control Deck' },
      { id: 'w1l3-cp2', index: 2, position: { x: 0, y: 0.0, z: -57 }, label: 'Surge Landing' },
    ],
    collectibles: [
      { id: 'w1l3-c1', position: { x: 0, y: 1.3, z: -20 } },
      { id: 'w1l3-c2', position: { x: 0, y: 2.2, z: -46 } },
      { id: 'w1l3-c3', position: { x: -3.5, y: 7.5, z: -73 } },
      { id: 'w1l3-c4', position: { x: 3.5, y: 7.5, z: -78 } },
      { id: 'w1l3-c5', position: { x: 0, y: 5.8, z: -87 } },
    ],
    switches: [
      { id: 'w1l3-sw1', position: { x: -2.2, y: 0.0, z: -11 }, label: 'Extend Conduit Bridge' },
    ],
  },

  {
    id: 'w1-l4',
    worldId: 1,
    levelNumber: 4,
    name: 'Aperture Vault',
    subtitle: 'Portals & Inversion Bay',
    hint: 'Enter paired portals to carry momentum across chasms. Press [Q] inside the blue bay to invert gravity.',
    parTime: 52,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -15,
    ceilingLimitY: 28,
    finishPosition: { x: 0, y: 1.5, z: -96 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w1l4-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7, y: 1, z: 18 }, materialStyle: 'concrete' },
      // Landing deck after Portal 1
      { id: 'w1l4-p2', kind: 'solid', position: { x: 0, y: 5.5, z: -32 }, size: { x: 7.5, y: 1, z: 14 }, materialStyle: 'steel' },
      // Gravity Inversion Bay: Ceiling bridge above z: -42 to -68 at y=13.5, floor gap below!
      { id: 'w1l4-ceil', kind: 'solid', position: { x: 0, y: 13.5, z: -55 }, size: { x: 7, y: 1, z: 26 }, materialStyle: 'steel' },
      {
        id: 'w1l4-gz1',
        kind: 'gravityZone',
        position: { x: 0, y: 9.0, z: -55 },
        size: { x: 7.5, y: 8, z: 24 },
        materialStyle: 'glass',
        zoneGravity: { x: 0, y: 22, z: 0 },
      },
      // Re-entry bounce pad at lower deck after exiting inversion bay
      { id: 'w1l4-p3', kind: 'solid', position: { x: 0, y: 1.0, z: -76 }, size: { x: 7.5, y: 1, z: 14 }, materialStyle: 'concrete' },
      {
        id: 'w1l4-b1',
        kind: 'bounce',
        position: { x: 0, y: 1.65, z: -80 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 17,
        bounceDirection: { x: 0, y: 0.85, z: -0.52 },
      },
      { id: 'w1l4-fin', kind: 'solid', position: { x: 0, y: 1.0, z: -95 }, size: { x: 8.5, y: 1, z: 12 }, materialStyle: 'steel' },
    ],
    portals: [
      {
        id: 'w1l4-port1',
        aPos: { x: 0, y: 1.6, z: -13 },
        aNormal: { x: 0, y: 0, z: 1 },
        bPos: { x: 0, y: 8.2, z: -26.5 },
        bNormal: { x: 0, y: 0, z: -1 },
        colorA: '#e59a3c',
        colorB: '#48b8d0',
        boost: 1.15,
      },
    ],
    checkpoints: [
      { id: 'w1l4-cp1', index: 1, position: { x: 0, y: 6.0, z: -31 }, label: 'Portal Exit Gantry' },
      { id: 'w1l4-cp2', index: 2, position: { x: 0, y: 1.5, z: -73 }, label: 'Post-Inversion Deck' },
    ],
    collectibles: [
      { id: 'w1l4-c1', position: { x: 0, y: 1.4, z: -7 } },
      { id: 'w1l4-c2', position: { x: 0, y: 7.5, z: -35 } },
      { id: 'w1l4-c3', position: { x: 0, y: 11.4, z: -50 } },
      { id: 'w1l4-c4', position: { x: 0, y: 11.4, z: -60 } },
      { id: 'w1l4-c5', position: { x: 0, y: 6.2, z: -87 } },
    ],
    switches: [],
  },

  {
    id: 'w1-l5',
    worldId: 1,
    levelNumber: 5,
    name: 'Core Ascent',
    subtitle: 'World 01 Finale',
    hint: 'Combine Time Control [T], Momentum Dash [Shift], Gravity Shift [Q], and Portals to reach the Spire.',
    parTime: 62,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -16,
    ceilingLimitY: 36,
    finishPosition: { x: 0, y: 12.5, z: -112 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w1l5-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 7, y: 1, z: 16 }, materialStyle: 'concrete' },
      // Dual alternating moving beams (slow with Time Control)
      {
        id: 'w1l5-m1',
        kind: 'moving',
        position: { x: -2.2, y: 0, z: -18 },
        size: { x: 4, y: 0.9, z: 6.5 },
        materialStyle: 'steel',
        moveOffset: { x: 4.4, y: 0, z: 0 },
        moveSpeed: 1.8,
        movePhase: 0,
      },
      {
        id: 'w1l5-m2',
        kind: 'moving',
        position: { x: 2.2, y: 0.5, z: -27 },
        size: { x: 4, y: 0.9, z: 6.5 },
        materialStyle: 'steel',
        moveOffset: { x: -4.4, y: 0, z: 0 },
        moveSpeed: 1.8,
        movePhase: 0.8,
      },
      // Central Reactor Platform + Vertical Bounce Spire
      { id: 'w1l5-p2', kind: 'solid', position: { x: 0, y: 0.5, z: -38 }, size: { x: 8, y: 1, z: 11 }, materialStyle: 'concrete' },
      {
        id: 'w1l5-b1',
        kind: 'bounce',
        position: { x: 0, y: 1.15, z: -41 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 22,
      },
      // High upper bridge (y=9.0)
      { id: 'w1l5-p3', kind: 'solid', position: { x: 0, y: 9.0, z: -54 }, size: { x: 6.5, y: 1, z: 14 }, materialStyle: 'steel' },
      // Dash gap into Portal A (z: -61 -> -73, 12m gap)
      { id: 'w1l5-p4', kind: 'solid', position: { x: 0, y: 8.5, z: -77 }, size: { x: 6.5, y: 1, z: 10 }, materialStyle: 'concrete' },
      // Final Ascent Pad after Portal B
      { id: 'w1l5-p5', kind: 'solid', position: { x: 0, y: 12.0, z: -108 }, size: { x: 9, y: 1, z: 16 }, materialStyle: 'steel' },
    ],
    portals: [
      {
        id: 'w1l5-port1',
        aPos: { x: 0, y: 10.6, z: -80 },
        aNormal: { x: 0, y: 0, z: 1 },
        bPos: { x: 0, y: 14.5, z: -101 },
        bNormal: { x: 0, y: 0, z: -1 },
        colorA: '#e59a3c',
        colorB: '#48b8d0',
        boost: 1.2,
      },
    ],
    checkpoints: [
      { id: 'w1l5-cp1', index: 1, position: { x: 0, y: 1.0, z: -36 }, label: 'Reactor Core Base' },
      { id: 'w1l5-cp2', index: 2, position: { x: 0, y: 9.5, z: -51 }, label: 'Upper Conduit Span' },
    ],
    collectibles: [
      { id: 'w1l5-c1', position: { x: 0, y: 1.7, z: -18 } },
      { id: 'w1l5-c2', position: { x: 0, y: 2.2, z: -27 } },
      { id: 'w1l5-c3', position: { x: 0, y: 10.5, z: -46 } },
      { id: 'w1l5-c4', position: { x: 0, y: 10.8, z: -67 } },
      { id: 'w1l5-c5', position: { x: 0, y: 14.0, z: -104 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 02: SKYFALL
  // =========================================================================
  {
    id: 'w2-l1',
    worldId: 2,
    levelNumber: 1,
    name: 'Gust Spire',
    subtitle: 'World 02 · Skyfall',
    hint: 'Plunge from high limestone spires onto bounce pads and ride vertical wind drafts.',
    parTime: 48,
    spawn: { x: 0, y: 18.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -20,
    finishPosition: { x: 0, y: 14.5, z: -96 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      // High starting sky-platform (y=17.5)
      { id: 'w2-p1', kind: 'solid', position: { x: 0, y: 17.0, z: -5 }, size: { x: 7, y: 1.2, z: 16 }, materialStyle: 'stone' },
      // Deep drop terrace (y=0) with cushioned rebound
      { id: 'w2-p2', kind: 'solid', position: { x: 0, y: -0.5, z: -26 }, size: { x: 10, y: 1.5, z: 16 }, materialStyle: 'stone' },
      {
        id: 'w2-b1',
        kind: 'bounce',
        position: { x: 0, y: 0.4, z: -29 },
        size: { x: 4.5, y: 0.35, z: 4.5 },
        materialStyle: 'copper',
        bounceForce: 24,
        bounceDirection: { x: 0, y: 0.9, z: -0.44 },
      },
      // Mid cloud bridge
      { id: 'w2-p3', kind: 'solid', position: { x: 0, y: 9.0, z: -48 }, size: { x: 7, y: 1.2, z: 16 }, materialStyle: 'stone' },
      // Wind updraft shaft (lifts player upward cleanly)
      {
        id: 'w2-wind1',
        kind: 'windZone',
        position: { x: 0, y: 12.0, z: -64 },
        size: { x: 7, y: 16, z: 12 },
        materialStyle: 'glass',
        zoneForce: { x: 0, y: 34, z: -4 },
      },
      { id: 'w2-p4', kind: 'solid', position: { x: 0, y: 14.0, z: -88 }, size: { x: 8.5, y: 1.2, z: 22 }, materialStyle: 'stone' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w2-cp1', index: 1, position: { x: 0, y: 9.6, z: -46 }, label: 'Windward Arch' },
    ],
    collectibles: [
      { id: 'w2-c1', position: { x: 0, y: 11.0, z: -17 } },
      { id: 'w2-c2', position: { x: 0, y: 2.0, z: -24 } },
      { id: 'w2-c3', position: { x: 0, y: 12.5, z: -39 } },
      { id: 'w2-c4', position: { x: 0, y: 16.5, z: -64 } },
      { id: 'w2-c5', position: { x: 0, y: 16.0, z: -82 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 03: THE LOST MACHINE
  // =========================================================================
  {
    id: 'w3-l1',
    worldId: 3,
    levelNumber: 1,
    name: 'Brass Escapement',
    subtitle: 'World 03 · The Lost Machine',
    hint: 'Traverse colossal rotating gears. Time Control [T] slows the clockwork.',
    parTime: 52,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -14,
    finishPosition: { x: 0, y: 4.5, z: -86 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w3-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -4 }, size: { x: 7, y: 1, z: 14 }, materialStyle: 'copper' },
      // Three interlocking rotating gear platforms
      {
        id: 'w3-g1',
        kind: 'gear',
        position: { x: 0, y: -0.5, z: -19 },
        size: { x: 11, y: 1.0, z: 11 },
        materialStyle: 'copper',
        spinSpeed: 0.75,
      },
      {
        id: 'w3-g2',
        kind: 'gear',
        position: { x: 0, y: 0.5, z: -33 },
        size: { x: 11, y: 1.0, z: 11 },
        materialStyle: 'steel',
        spinSpeed: -0.9,
      },
      { id: 'w3-p2', kind: 'solid', position: { x: 0, y: 0.5, z: -47 }, size: { x: 7, y: 1, z: 10 }, materialStyle: 'copper' },
      {
        id: 'w3-g3',
        kind: 'gear',
        position: { x: 0, y: 2.0, z: -63 },
        size: { x: 13, y: 1.0, z: 13 },
        materialStyle: 'copper',
        spinSpeed: 1.05,
      },
      { id: 'w3-fin', kind: 'solid', position: { x: 0, y: 4.0, z: -83 }, size: { x: 8.5, y: 1, z: 14 }, materialStyle: 'steel' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w3-cp1', index: 1, position: { x: 0, y: 1.0, z: -46 }, label: 'Escapement Hub' },
    ],
    collectibles: [
      { id: 'w3-c1', position: { x: -3.2, y: 1.5, z: -19 } },
      { id: 'w3-c2', position: { x: 3.2, y: 2.5, z: -33 } },
      { id: 'w3-c3', position: { x: 0, y: 2.3, z: -47 } },
      { id: 'w3-c4', position: { x: -4.0, y: 4.0, z: -63 } },
      { id: 'w3-c5', position: { x: 4.0, y: 4.0, z: -63 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 04: GRAVITY ZERO
  // =========================================================================
  {
    id: 'w4-l1',
    worldId: 4,
    levelNumber: 1,
    name: 'Inverted Observatory',
    subtitle: 'World 04 · Gravity Zero',
    hint: 'Press [Q] to flip gravity at will and walk on ceiling catwalks.',
    parTime: 50,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -15,
    ceilingLimitY: 28,
    finishPosition: { x: 0, y: 1.5, z: -90 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w4-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7, y: 1, z: 18 }, materialStyle: 'steel' },
      // Overhead ceiling deck 1
      { id: 'w4-c1', kind: 'solid', position: { x: 0, y: 11.5, z: -26 }, size: { x: 7.5, y: 1, z: 24 }, materialStyle: 'steel' },
      // Floor deck 2
      { id: 'w4-p2', kind: 'solid', position: { x: 0, y: -0.5, z: -48 }, size: { x: 7.5, y: 1, z: 22 }, materialStyle: 'concrete' },
      // Overhead ceiling deck 2
      { id: 'w4-c2', kind: 'solid', position: { x: 0, y: 12.5, z: -68 }, size: { x: 7.5, y: 1, z: 20 }, materialStyle: 'steel' },
      // Finish floor deck
      { id: 'w4-fin', kind: 'solid', position: { x: 0, y: 1.0, z: -88 }, size: { x: 9, y: 1, z: 16 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w4-cp1', index: 1, position: { x: 0, y: 0.0, z: -46 }, label: 'Meridian Deck' },
    ],
    collectibles: [
      { id: 'w4-c1', position: { x: 0, y: 9.5, z: -20 } },
      { id: 'w4-c2', position: { x: 0, y: 9.5, z: -32 } },
      { id: 'w4-c3', position: { x: 0, y: 1.5, z: -50 } },
      { id: 'w4-c4', position: { x: 0, y: 10.5, z: -68 } },
      { id: 'w4-c5', position: { x: 0, y: 3.0, z: -83 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 05: THE FRACTURE
  // =========================================================================
  {
    id: 'w5-l1',
    worldId: 5,
    levelNumber: 1,
    name: 'Shattered Span',
    subtitle: 'World 05 · The Fracture',
    hint: 'Fractured slate tiles collapse shortly after contact. Link momentum through paired portals.',
    parTime: 48,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -16,
    finishPosition: { x: 0, y: 3.5, z: -92 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w5-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -4 }, size: { x: 7, y: 1, z: 14 }, materialStyle: 'obsidian' },
      // Sequence of 4 crumbling tiles
      { id: 'w5-cr1', kind: 'crumbling', position: { x: 0, y: -0.5, z: -15 }, size: { x: 4.5, y: 0.8, z: 5.5 }, materialStyle: 'stone', crumbleDelay: 0.85, respawnDelay: 3.0 },
      { id: 'w5-cr2', kind: 'crumbling', position: { x: -2.2, y: 0.0, z: -23 }, size: { x: 4.5, y: 0.8, z: 5.5 }, materialStyle: 'stone', crumbleDelay: 0.85, respawnDelay: 3.0 },
      { id: 'w5-cr3', kind: 'crumbling', position: { x: 2.0, y: 0.5, z: -31 }, size: { x: 4.5, y: 0.8, z: 5.5 }, materialStyle: 'stone', crumbleDelay: 0.85, respawnDelay: 3.0 },
      { id: 'w5-p2', kind: 'solid', position: { x: 0, y: 0.5, z: -42 }, size: { x: 7.5, y: 1, z: 11 }, materialStyle: 'obsidian' },
      { id: 'w5-cr4', kind: 'crumbling', position: { x: 0, y: 3.0, z: -64 }, size: { x: 5.5, y: 0.8, z: 7 }, materialStyle: 'stone', crumbleDelay: 1.0, respawnDelay: 3.0 },
      { id: 'w5-fin', kind: 'solid', position: { x: 0, y: 3.0, z: -88 }, size: { x: 8.5, y: 1, z: 16 }, materialStyle: 'obsidian' },
    ],
    portals: [
      {
        id: 'w5-port1',
        aPos: { x: 0, y: 2.6, z: -46 },
        aNormal: { x: 0, y: 0, z: 1 },
        bPos: { x: 0, y: 5.5, z: -58 },
        bNormal: { x: 0, y: 0, z: -1 },
        colorA: '#e06d53',
        colorB: '#f0b24d',
        boost: 1.15,
      },
    ],
    checkpoints: [
      { id: 'w5-cp1', index: 1, position: { x: 0, y: 1.0, z: -40 }, label: 'Fault Anchor' },
    ],
    collectibles: [
      { id: 'w5-c1', position: { x: 0, y: 1.4, z: -15 } },
      { id: 'w5-c2', position: { x: -2.2, y: 1.9, z: -23 } },
      { id: 'w5-c3', position: { x: 2.0, y: 2.4, z: -31 } },
      { id: 'w5-c4', position: { x: 0, y: 5.0, z: -64 } },
      { id: 'w5-c5', position: { x: 0, y: 5.0, z: -76 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 06: DEEP CURRENT
  // =========================================================================
  {
    id: 'w6-l1',
    worldId: 6,
    levelNumber: 1,
    name: 'Abyssal Conduit',
    subtitle: 'World 06 · Deep Current',
    hint: 'Buoyant fluid chambers slow your descent and amplify upward leaps.',
    parTime: 50,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -18,
    finishPosition: { x: 0, y: 6.5, z: -88 },
    allowGravityShift: false,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w6-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 7, y: 1, z: 16 }, materialStyle: 'steel' },
      // Deep fluid tank zone (buoyancy + viscous drag)
      {
        id: 'w6-fl1',
        kind: 'fluidZone',
        position: { x: 0, y: 3.5, z: -32 },
        size: { x: 11, y: 11, z: 34 },
        materialStyle: 'glass',
        zoneForce: { x: 0, y: 15.5, z: -1.5 },
        zoneDrag: 2.4,
      },
      // Submerged stepping plinths inside fluid
      { id: 'w6-p2', kind: 'solid', position: { x: 0, y: -2.0, z: -26 }, size: { x: 6, y: 1, z: 10 }, materialStyle: 'steel' },
      {
        id: 'w6-b1',
        kind: 'bounce',
        position: { x: 0, y: -1.35, z: -40 },
        size: { x: 4, y: 0.3, z: 4 },
        materialStyle: 'copper',
        bounceForce: 20,
      },
      { id: 'w6-p3', kind: 'solid', position: { x: 0, y: 4.5, z: -58 }, size: { x: 7.5, y: 1, z: 14 }, materialStyle: 'steel' },
      { id: 'w6-fin', kind: 'solid', position: { x: 0, y: 6.0, z: -84 }, size: { x: 8.5, y: 1, z: 16 }, materialStyle: 'concrete' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w6-cp1', index: 1, position: { x: 0, y: 5.0, z: -55 }, label: 'Airlock Deck' },
    ],
    collectibles: [
      { id: 'w6-c1', position: { x: 0, y: 1.5, z: -20 } },
      { id: 'w6-c2', position: { x: 0, y: 0.0, z: -29 } },
      { id: 'w6-c3', position: { x: 0, y: 5.0, z: -40 } },
      { id: 'w6-c4', position: { x: 0, y: 7.5, z: -69 } },
      { id: 'w6-c5', position: { x: 0, y: 8.0, z: -80 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 07: THE OVERGROWN
  // =========================================================================
  {
    id: 'w7-l1',
    worldId: 7,
    levelNumber: 1,
    name: 'Moss Aqueduct',
    subtitle: 'World 07 · The Overgrown',
    hint: 'Navigate ancient stone viaducts reclaimed by moss and stepped bounce terraces.',
    parTime: 46,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -15,
    finishPosition: { x: 0, y: 7.5, z: -90 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w7-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -6 }, size: { x: 7, y: 1.2, z: 18 }, materialStyle: 'moss' },
      { id: 'w7-p2', kind: 'solid', position: { x: -3.5, y: 0.5, z: -24 }, size: { x: 5.5, y: 1.2, z: 12 }, materialStyle: 'stone' },
      { id: 'w7-p3', kind: 'solid', position: { x: 3.5, y: 1.8, z: -38 }, size: { x: 5.5, y: 1.2, z: 12 }, materialStyle: 'moss' },
      {
        id: 'w7-b1',
        kind: 'bounce',
        position: { x: 3.5, y: 2.55, z: -42 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 19,
      },
      { id: 'w7-p4', kind: 'solid', position: { x: 0, y: 7.0, z: -58 }, size: { x: 7, y: 1.2, z: 16 }, materialStyle: 'moss' },
      { id: 'w7-fin', kind: 'solid', position: { x: 0, y: 7.0, z: -85 }, size: { x: 8.5, y: 1.2, z: 18 }, materialStyle: 'stone' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w7-cp1', index: 1, position: { x: 0, y: 7.6, z: -54 }, label: 'Canopy Viaduct' },
    ],
    collectibles: [
      { id: 'w7-c1', position: { x: -3.5, y: 2.5, z: -24 } },
      { id: 'w7-c2', position: { x: 3.5, y: 3.8, z: -36 } },
      { id: 'w7-c3', position: { x: 2.0, y: 8.5, z: -49 } },
      { id: 'w7-c4', position: { x: 0, y: 9.2, z: -71 } },
      { id: 'w7-c5', position: { x: 0, y: 9.2, z: -82 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 08: THE VOID
  // =========================================================================
  {
    id: 'w8-l1',
    worldId: 8,
    levelNumber: 1,
    name: 'Silent Monolith',
    subtitle: 'World 08 · The Void',
    hint: 'Narrow charcoal beams demand clean line-up, controlled jumps, and timed dashes.',
    parTime: 48,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -16,
    finishPosition: { x: 0, y: 2.5, z: -96 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w8-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 6.5, y: 1, z: 16 }, materialStyle: 'void' },
      // Narrow precision beams
      { id: 'w8-beam1', kind: 'solid', position: { x: 0, y: -0.5, z: -24 }, size: { x: 2.6, y: 1, z: 16 }, materialStyle: 'void' },
      { id: 'w8-p2', kind: 'solid', position: { x: 0, y: -0.5, z: -42 }, size: { x: 6, y: 1, z: 10 }, materialStyle: 'void' },
      // Dash span to narrow beam 2
      { id: 'w8-beam2', kind: 'solid', position: { x: 0, y: 0.5, z: -64 }, size: { x: 3.0, y: 1, z: 14 }, materialStyle: 'void' },
      { id: 'w8-fin', kind: 'solid', position: { x: 0, y: 2.0, z: -92 }, size: { x: 8, y: 1, z: 16 }, materialStyle: 'void' },
    ],
    portals: [
      {
        id: 'w8-port1',
        aPos: { x: 0, y: 2.6, z: -69 },
        aNormal: { x: 0, y: 0, z: 1 },
        bPos: { x: 0, y: 4.5, z: -83 },
        bNormal: { x: 0, y: 0, z: -1 },
        colorA: '#d9d9e3',
        colorB: '#7a9ec2',
        boost: 1.15,
      },
    ],
    checkpoints: [
      { id: 'w8-cp1', index: 1, position: { x: 0, y: 0.0, z: -41 }, label: 'Monolith Node' },
    ],
    collectibles: [
      { id: 'w8-c1', position: { x: 0, y: 1.5, z: -24 } },
      { id: 'w8-c2', position: { x: 0, y: 2.5, z: -52 } },
      { id: 'w8-c3', position: { x: 0, y: 2.5, z: -64 } },
      { id: 'w8-c4', position: { x: 0, y: 4.5, z: -86 } },
      { id: 'w8-c5', position: { x: 0, y: 4.5, z: -90 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 09: THE COLLAPSE
  // =========================================================================
  {
    id: 'w9-l1',
    worldId: 9,
    levelNumber: 1,
    name: 'Thermal Runway',
    subtitle: 'World 09 · The Collapse',
    hint: 'Every thermal plate gives way under load. Keep rolling forward and commit to the dash.',
    parTime: 44,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -16,
    finishPosition: { x: 0, y: 5.5, z: -94 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w9-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -4 }, size: { x: 7, y: 1, z: 14 }, materialStyle: 'obsidian' },
      { id: 'w9-cr1', kind: 'crumbling', position: { x: 0, y: -0.5, z: -16 }, size: { x: 5, y: 0.9, z: 8 }, materialStyle: 'copper', crumbleDelay: 0.7, respawnDelay: 2.5 },
      { id: 'w9-cr2', kind: 'crumbling', position: { x: 0, y: 0.2, z: -27 }, size: { x: 5, y: 0.9, z: 8 }, materialStyle: 'copper', crumbleDelay: 0.7, respawnDelay: 2.5 },
      { id: 'w9-p2', kind: 'solid', position: { x: 0, y: 0.5, z: -40 }, size: { x: 7, y: 1, z: 11 }, materialStyle: 'obsidian' },
      {
        id: 'w9-b1',
        kind: 'bounce',
        position: { x: 0, y: 1.15, z: -43 },
        size: { x: 3.4, y: 0.3, z: 3.4 },
        materialStyle: 'copper',
        bounceForce: 20,
      },
      { id: 'w9-cr3', kind: 'crumbling', position: { x: 0, y: 4.5, z: -57 }, size: { x: 5.5, y: 0.9, z: 9 }, materialStyle: 'copper', crumbleDelay: 0.75, respawnDelay: 2.5 },
      { id: 'w9-cr4', kind: 'crumbling', position: { x: 0, y: 4.8, z: -70 }, size: { x: 5.5, y: 0.9, z: 9 }, materialStyle: 'copper', crumbleDelay: 0.75, respawnDelay: 2.5 },
      { id: 'w9-fin', kind: 'solid', position: { x: 0, y: 5.0, z: -90 }, size: { x: 8.5, y: 1, z: 16 }, materialStyle: 'obsidian' },
    ],
    portals: [],
    checkpoints: [
      { id: 'w9-cp1', index: 1, position: { x: 0, y: 1.0, z: -38 }, label: 'Thermal Anchor' },
    ],
    collectibles: [
      { id: 'w9-c1', position: { x: 0, y: 1.4, z: -16 } },
      { id: 'w9-c2', position: { x: 0, y: 2.0, z: -27 } },
      { id: 'w9-c3', position: { x: 0, y: 6.5, z: -50 } },
      { id: 'w9-c4', position: { x: 0, y: 6.8, z: -70 } },
      { id: 'w9-c5', position: { x: 0, y: 7.0, z: -83 } },
    ],
    switches: [],
  },

  // =========================================================================
  // WORLD 10: THE FINAL BOUNCE
  // =========================================================================
  {
    id: 'w10-l1',
    worldId: 10,
    levelNumber: 1,
    name: 'Zenith Convergence',
    subtitle: 'World 10 · The Final Bounce',
    hint: 'Every skill forged across the worlds converges here. Fall. Adapt. Bounce Back.',
    parTime: 65,
    spawn: { x: 0, y: 1.0, z: 0 },
    spawnYaw: 0,
    fallLimitY: -18,
    ceilingLimitY: 36,
    finishPosition: { x: 0, y: 14.5, z: -124 },
    allowGravityShift: true,
    allowTimeControl: true,
    allowDash: true,
    platforms: [
      { id: 'w10-p1', kind: 'solid', position: { x: 0, y: -0.5, z: -5 }, size: { x: 7, y: 1, z: 16 }, materialStyle: 'steel' },
      // Rotating gear + crumbling bridge
      {
        id: 'w10-g1',
        kind: 'gear',
        position: { x: 0, y: -0.5, z: -21 },
        size: { x: 11, y: 1, z: 11 },
        materialStyle: 'copper',
        spinSpeed: 0.9,
      },
      { id: 'w10-cr1', kind: 'crumbling', position: { x: 0, y: 0.0, z: -34 }, size: { x: 5, y: 0.9, z: 8 }, materialStyle: 'obsidian', crumbleDelay: 0.8, respawnDelay: 2.8 },
      // Checkpoint 1 + Gravity Inversion Vault
      { id: 'w10-p2', kind: 'solid', position: { x: 0, y: 0.0, z: -47 }, size: { x: 7.5, y: 1, z: 12 }, materialStyle: 'steel' },
      { id: 'w10-c1', kind: 'solid', position: { x: 0, y: 12.0, z: -68 }, size: { x: 7.5, y: 1, z: 22 }, materialStyle: 'steel' },
      // Return platform + Bounce + Portal to Zenith
      { id: 'w10-p3', kind: 'solid', position: { x: 0, y: 1.0, z: -87 }, size: { x: 7.5, y: 1, z: 12 }, materialStyle: 'concrete' },
      {
        id: 'w10-b1',
        kind: 'bounce',
        position: { x: 0, y: 1.65, z: -90 },
        size: { x: 3.6, y: 0.3, z: 3.6 },
        materialStyle: 'copper',
        bounceForce: 22,
      },
      // Zenith Finale Platform
      { id: 'w10-fin', kind: 'solid', position: { x: 0, y: 14.0, z: -119 }, size: { x: 10, y: 1.2, z: 20 }, materialStyle: 'steel' },
    ],
    portals: [
      {
        id: 'w10-port1',
        aPos: { x: 0, y: 11.0, z: -96 },
        aNormal: { x: 0, y: 0, z: 1 },
        bPos: { x: 0, y: 16.5, z: -109 },
        bNormal: { x: 0, y: 0, z: -1 },
        colorA: '#f0b24d',
        colorB: '#eef4ff',
        boost: 1.2,
      },
    ],
    checkpoints: [
      { id: 'w10-cp1', index: 1, position: { x: 0, y: 0.5, z: -45 }, label: 'Inversion Threshold' },
      { id: 'w10-cp2', index: 2, position: { x: 0, y: 1.5, z: -85 }, label: 'Zenith Launch Pad' },
    ],
    collectibles: [
      { id: 'w10-c1', position: { x: 0, y: 1.8, z: -21 } },
      { id: 'w10-c2', position: { x: 0, y: 2.0, z: -34 } },
      { id: 'w10-c3', position: { x: 0, y: 10.0, z: -68 } },
      { id: 'w10-c4', position: { x: 0, y: 11.5, z: -93 } },
      { id: 'w10-c5', position: { x: 0, y: 16.5, z: -114 } },
    ],
    switches: [],
  },
];

export function getLevelById(id: string): LevelDefinition {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

export function getNextLevelId(currentId: string): string | null {
  const idx = LEVELS.findIndex((l) => l.id === currentId);
  if (idx === -1 || idx + 1 >= LEVELS.length) return null;
  return LEVELS[idx + 1].id;
}

export function getLevelsForWorld(worldId: number): LevelDefinition[] {
  return LEVELS.filter((l) => l.worldId === worldId);
}
