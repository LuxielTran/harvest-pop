// Game data for Harvest Pop (Farm Ã— Match-3). Numbers follow the MVP GDD and
// are the first thing to tune after a playtest.

export type StorageType = 'silo' | 'barn';

export interface ItemDef {
  id: string;
  storage: StorageType | 'upgrade';
  /** Coins a farm order pays per unit (orders are the Coin source). */
  value: number;
}

export const ITEMS: Record<string, ItemDef> = {
  wheat: { id: 'wheat', storage: 'silo', value: 3 },
  corn: { id: 'corn', storage: 'silo', value: 5 },
  feed: { id: 'feed', storage: 'barn', value: 6 },
  egg: { id: 'egg', storage: 'barn', value: 10 },
  bread: { id: 'bread', storage: 'barn', value: 24 },
  nail: { id: 'nail', storage: 'upgrade', value: 0 },
  screw: { id: 'screw', storage: 'upgrade', value: 0 },
  bolt: { id: 'bolt', storage: 'upgrade', value: 0 },
  tape: { id: 'tape', storage: 'upgrade', value: 0 },
};

export interface CropConfig {
  id: string;
  unlockLevel: number;
  growSeconds: number;
  tutorialSeconds: number;
  yieldQty: number;
  exp: number;
  seedCost: number;
}

export const CROPS: Record<string, CropConfig> = {
  wheat: { id: 'wheat', unlockLevel: 1, growSeconds: 60, tutorialSeconds: 8, yieldQty: 2, exp: 1, seedCost: 0 },
  corn: { id: 'corn', unlockLevel: 2, growSeconds: 180, tutorialSeconds: 180, yieldQty: 2, exp: 2, seedCost: 0 },
};

export interface AnimalConfig {
  id: string;
  feedItem: string;
  feedQty: number;
  produceItem: string;
  produceQty: number;
  produceSeconds: number;
  tutorialSeconds: number;
  exp: number;
}

export const ANIMALS: Record<string, AnimalConfig> = {
  chicken: { id: 'chicken', feedItem: 'feed', feedQty: 1, produceItem: 'egg', produceQty: 2, produceSeconds: 90, tutorialSeconds: 10, exp: 2 },
};

export interface RecipeConfig {
  id: string;
  machine: string;
  inputs: { item: string; qty: number }[];
  output: string;
  outputQty: number;
  seconds: number;
  tutorialSeconds: number;
  exp: number;
  unlockLevel: number;
}

export const RECIPES: Record<string, RecipeConfig> = {
  feed: { id: 'feed', machine: 'feedmill', inputs: [{ item: 'wheat', qty: 2 }], output: 'feed', outputQty: 1, seconds: 45, tutorialSeconds: 5, exp: 2, unlockLevel: 1 },
  bread: { id: 'bread', machine: 'bakery', inputs: [{ item: 'wheat', qty: 2 }, { item: 'egg', qty: 1 }], output: 'bread', outputQty: 1, seconds: 120, tutorialSeconds: 120, exp: 4, unlockLevel: 3 },
};

export interface MachineConfig {
  id: string;
  unlockLevel: number;
  cost: number;
  recipes: string[];
}

export const MACHINES: Record<string, MachineConfig> = {
  feedmill: { id: 'feedmill', unlockLevel: 1, cost: 0, recipes: ['feed'] },
  bakery: { id: 'bakery', unlockLevel: 3, cost: 100, recipes: ['bread'] },
};

export const PLOT_COST = 10;
export const PLOT_COUNT = 6;
export const COOP_COST = 25;
export const COOP_CAPACITY = 2;
export const CHICKEN_COST = 10;

export interface StorageUpgrade {
  tier: number;
  required: { item: string; qty: number }[];
  capacityAfter: number;
}

export const STORAGE_UPGRADES: Record<StorageType, StorageUpgrade[]> = {
  barn: [
    { tier: 2, required: [{ item: 'nail', qty: 1 }, { item: 'screw', qty: 1 }], capacityAfter: 10 },
    { tier: 3, required: [{ item: 'nail', qty: 2 }, { item: 'screw', qty: 2 }], capacityAfter: 20 },
    { tier: 4, required: [{ item: 'nail', qty: 3 }, { item: 'screw', qty: 3 }], capacityAfter: 35 },
    { tier: 5, required: [{ item: 'nail', qty: 4 }, { item: 'screw', qty: 4 }], capacityAfter: 55 },
  ],
  silo: [
    { tier: 2, required: [{ item: 'bolt', qty: 1 }, { item: 'tape', qty: 1 }], capacityAfter: 20 },
    { tier: 3, required: [{ item: 'bolt', qty: 2 }, { item: 'tape', qty: 2 }], capacityAfter: 35 },
    { tier: 4, required: [{ item: 'bolt', qty: 3 }, { item: 'tape', qty: 3 }], capacityAfter: 55 },
    { tier: 5, required: [{ item: 'bolt', qty: 4 }, { item: 'tape', qty: 4 }], capacityAfter: 80 },
  ],
};

export const STORAGE_START: Record<StorageType, number> = { silo: 10, barn: 4 };

/** Upgrade Shop: every material costs stars (MVP: 1 star each). */
export const MATERIAL_PRICE: Record<string, number> = { nail: 1, screw: 1, bolt: 1, tape: 1 };
export const MATERIALS: string[] = ['nail', 'screw', 'bolt', 'tape'];

/** Cumulative XP needed to reach farm level n (index = level). */
export const XP_THRESHOLDS = [0, 0, 8, 20, 40, 70, 110, 160, 220, 300, 400];
export function farmLevelForXp(xp: number): number {
  let lvl = 1;
  for (let i = 2; i < XP_THRESHOLDS.length; i++) if (xp >= XP_THRESHOLDS[i]) lvl = i;
  return lvl;
}
export function xpForNextLevel(level: number): number | null {
  return level + 1 < XP_THRESHOLDS.length ? XP_THRESHOLDS[level + 1] : null;
}

// ---------------------------------------------------------------------------
// Farm orders: a rotating board of 3 orders, the main Coin source.
export interface OrderTemplate {
  items: { item: string; qty: number }[];
  unlockLevel: number;
}
export const ORDER_TEMPLATES: OrderTemplate[] = [
  { items: [{ item: 'wheat', qty: 2 }], unlockLevel: 1 },
  { items: [{ item: 'wheat', qty: 4 }], unlockLevel: 1 },
  { items: [{ item: 'egg', qty: 2 }], unlockLevel: 1 },
  { items: [{ item: 'feed', qty: 1 }, { item: 'wheat', qty: 2 }], unlockLevel: 1 },
  { items: [{ item: 'egg', qty: 3 }, { item: 'wheat', qty: 3 }], unlockLevel: 2 },
  { items: [{ item: 'corn', qty: 2 }], unlockLevel: 2 },
  { items: [{ item: 'corn', qty: 2 }, { item: 'egg', qty: 2 }], unlockLevel: 2 },
  { items: [{ item: 'bread', qty: 1 }], unlockLevel: 3 },
  { items: [{ item: 'bread', qty: 2 }, { item: 'corn', qty: 2 }], unlockLevel: 3 },
];
export const ORDER_BONUS = 1.3; // orders pay value Ã— bonus, rounded
export const ORDER_COUNT = 3;

// ---------------------------------------------------------------------------
// Match-3 levels â€” the 50-level blueprint of "level harvest pop.md".
//
// A level is an ASCII map plus goals. Map legend (one char per cell):
//   .  playable cell            x  no cell (the board's shape)
//   m  Mud (1 layer)            c  Wooden Crate (2 layers)
//   s  Soil to plow             M  Mud on Soil        C  Crate on Soil
//   a  a farm animal starts here (Chick or Piglet, per level)
// Blockers clear from matches next to them, power-up blasts and boosters.
// Soil plows when a cropsy on top of it is cleared. Animals are collected
// when they reach the bottom row. Mud / Crate / Soil goal counts come from the map.

export type TileKind = 'wheat' | 'carrot' | 'apple' | 'berry' | 'sunflower' | 'corn' | 'blueberry';
export const TILE_KINDS: TileKind[] = ['wheat', 'carrot', 'apple', 'berry', 'sunflower', 'corn', 'blueberry'];
export type AnimalKind = 'chick' | 'piglet';

export type Difficulty = 'tutorial' | 'supereasy' | 'easy' | 'normal' | 'hard' | 'superhard' | 'boss';
export type GoalDef =
  | { type: 'collect'; tile: TileKind | 'any'; qty: number }
  | { type: 'mud' } | { type: 'crate' } | { type: 'soil' }
  | { type: 'animal'; qty: number };

export interface MatchLevelConfig {
  id: number;
  difficulty: Difficulty;
  /** The cropsy pool: 3 to 5 kinds. */
  colors: TileKind[];
  moves: number;
  map: string[];
  /** 1 to 3 goals, all needed to win. */
  goals: GoalDef[];
  animal?: AnimalKind;
  /** Spawn weight per kind (default 1). */
  weights?: Partial<Record<TileKind, number>>;
  /** Chance that a freshly dropped cropsy arrives as a Tractor Cropsy (randomised power-ups). */
  powerChance: number;
  seed: number;
  /** Which level (1-based) must be cleared first; 0 = always open. */
  unlockAfter: number;
  /** i18n key of the tip shown when the level opens (a new mechanic, a hard level). */
  intro?: string;
}

const AP: TileKind = 'apple', CA: TileKind = 'carrot', CO: TileKind = 'corn', ST: TileKind = 'berry';
const BL: TileKind = 'blueberry', SU: TileKind = 'sunflower', WH: TileKind = 'wheat';

/** A rows Ã— cols rectangle of plain cells, with some rows replaced. */
function grid(rows: number, cols: number, over: Record<number, string> = {}): string[] {
  return Array.from({ length: rows }, (_, r) => over[r] ?? '.'.repeat(cols));
}
const collect = (tile: TileKind | 'any', qty: number): GoalDef => ({ type: 'collect', tile, qty });
const MUD: GoalDef = { type: 'mud' };
const CRATE: GoalDef = { type: 'crate' };
const SOIL: GoalDef = { type: 'soil' };
const animals = (qty: number): GoalDef => ({ type: 'animal', qty });

/** Default random power-up rate by difficulty: generous early, rare in hard levels. */
const POWER: Record<Difficulty, number> = { tutorial: 0.02, supereasy: 0.02, easy: 0.015, normal: 0.01, hard: 0.006, superhard: 0.004, boss: 0.006 };

type LevelInput = Omit<MatchLevelConfig, 'id' | 'seed' | 'unlockAfter' | 'powerChance'> & { seed?: number; powerChance?: number };

const SPLIT = (rows: number, top = '....x....'): string[] => [top, ...Array.from({ length: rows - 1 }, () => '....x....')];
const PEN = (r6: string, r7: string): string[] => ['..a...a..', ...grid(5, 9), r6, r7];

const DEFS: LevelInput[] = [
  // ---- Levels 1â€“10: Onboarding (uniformly easy, one new element at a time) ----
  /* 1 */ { difficulty: 'tutorial', colors: [AP, CA, SU], moves: 22, map: grid(6, 6), goals: [collect(AP, 40)], seed: 20261009, powerChance: 0 },
  /* 2 */ { difficulty: 'tutorial', colors: [CA, CO, AP, ST], moves: 25, map: grid(7, 7), goals: [collect(CA, 45), collect(CO, 45)], intro: 'intro_tractor', powerChance: 0.03 },
  /* 3 */ { difficulty: 'easy', colors: [ST, AP, CA, SU], moves: 25, map: grid(8, 8), goals: [collect(ST, 150)], intro: 'intro_rainbow' },
  /* 4 */ { difficulty: 'easy', colors: [BL, AP, CO, CA], moves: 25, map: grid(8, 8, { 7: '..mmmm..' }), goals: [collect(BL, 150), MUD], intro: 'intro_mud' },
  /* 5 */ { difficulty: 'easy', colors: [AP, CA, CO, SU], moves: 25,
    map: ['xx....xx', 'x......x', 'm......m', '...mm...', '..m..m..', '...mm...', 'x......x', 'xx....xx'], goals: [MUD, collect(CO, 80)], intro: 'intro_shape' },
  /* 6 */ { difficulty: 'normal', colors: [ST, BL, AP, WH], moves: 22, map: grid(8, 8, { 0: '...a....' }), goals: [animals(1), collect(BL, 180)], animal: 'chick', intro: 'intro_chick' },
  /* 7 */ { difficulty: 'easy', colors: [AP, CO, CA, ST], moves: 28, map: SPLIT(7), goals: [collect(AP, 55), collect(CO, 55)], intro: 'intro_split' },
  /* 8 */ { difficulty: 'normal', colors: [CO, CA, SU, BL], moves: 28,
    map: ['xx.a.a.xx', 'xx.....xx', ...grid(4, 9), 'mm.....mm', 'xx.....xx', 'xx.m.m.xx'], goals: [MUD, animals(2), collect(CA, 240)], animal: 'chick' },
  /* 9 */ { difficulty: 'easy', colors: [ST, AP, CO], moves: 25,
    map: ['.......', '.......', '.m...m.', '..m.m..', '.m...m.', '..m.m..', '.m...m.'], goals: [collect(ST, 450)] },
  // First gatekeeper: 5 kinds, and two mud patches sealed in the bottom corners (power-up or booster needed).
  /* 10 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, SU], moves: 22,
    map: grid(8, 8, { 2: '.m....m.', 3: '..m..m..', 4: '..m..m..', 5: '.m....m.', 6: 'x..mm..x', 7: 'mx....xm' }), goals: [MUD, collect(SU, 60)], intro: 'tip_hard' },

  // ---- Levels 11â€“25: Hook phase (sawtooth: stress, then relief) ----
  /* 11 */ { difficulty: 'supereasy', colors: [CA, AP, CO, BL], moves: 30, map: grid(9, 9), goals: [collect(CA, 280)], weights: { carrot: 1.3 } },
  /* 12 */ { difficulty: 'normal', colors: [ST, BL, AP, CO, SU], moves: 25, map: grid(8, 8, { 3: '..c..c..', 5: '..c..c..' }), goals: [CRATE, collect(AP, 70)], intro: 'intro_crate' },
  /* 13 */ { difficulty: 'normal', colors: [CA, CO, AP, ST, WH], moves: 30,
    map: ['...a.a...', 'x.......x', 'xx.....xx', 'xxx...xxx', 'xxx...xxx', 'xxm...mxx', 'xm.....mx', 'mm.....mm'], goals: [animals(2), collect(CO, 45)], animal: 'piglet', intro: 'intro_piglet' },
  /* 14 */ { difficulty: 'easy', colors: [BL, SU, AP, CA], moves: 25, map: grid(8, 8, { 3: '..ssss..', 4: '.s....s.', 5: '..ssss..' }), goals: [SOIL, collect(BL, 140)], intro: 'intro_soil' },
  /* 15 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, BL], moves: 28,
    map: ['xxx...xxx', 'xx.sss.xx', 'x.s...s.x', 'ss.ccc.ss', 's..csc..s', 'ss.ccc.ss', 'x.s...s.x', 'xx.s.s.xx', 'xxx...xxx'], goals: [SOIL, collect(ST, 75)], intro: 'tip_hard' },
  /* 16 */ { difficulty: 'supereasy', colors: [BL, CO, AP, CA], moves: 30, map: grid(5, 9), goals: [collect(BL, 80)], weights: { blueberry: 1.3 } },
  /* 17 */ { difficulty: 'normal', colors: [ST, SU, CA, CO, AP], moves: 28,
    map: grid(8, 8, { 2: '.m....m.', 3: '..mccm..', 4: '..mccm..', 5: '.m....m.', 7: 'm......m' }), goals: [MUD, CRATE, collect(SU, 75)] },
  /* 18 */ { difficulty: 'normal', colors: [AP, BL, CO, WH, CA], moves: 35, map: SPLIT(8, '.a..x..a.'), goals: [animals(3)], animal: 'chick' },
  /* 19 */ { difficulty: 'easy', colors: [CO, CA, ST, SU], moves: 25, map: ['.......', '..ssss.', '.s.m.s.', '.smmms.', '.s.m.s.', '.sssss.', '...m...'], goals: [SOIL, collect(CO, 100)] },
  // Monetization checkpoint: the two top corners hang off 1-wide columns (only vertical lines, blasts or boosters reach them).
  /* 20 */ { difficulty: 'superhard', colors: [AP, CA, CO, ST, BL], moves: 22,
    map: ['mx.....xm', '.x.....x.', '.........', '..c...c..', '..cc.cc..', '..c...c..', '...ccc...', '....c....', 'xx.....xx'], goals: [CRATE, MUD], intro: 'tip_superhard' },
  /* 21 */ { difficulty: 'supereasy', colors: [CO, AP, CA, ST, SU], moves: 30, map: grid(6, 6), goals: [collect(CO, 30), collect(AP, 30)], weights: { corn: 1.5, apple: 1.5 } },
  /* 22 */ { difficulty: 'normal', colors: [BL, AP, CO, CA, SU], moves: 28, map: grid(8, 8, { 2: '..C..C..', 3: '.C....C.', 4: '.C....C.', 5: '..C..C..' }), goals: [SOIL, collect(BL, 85)], intro: 'intro_soilcrate' },
  /* 23 */ { difficulty: 'normal', colors: [CA, ST, AP, CO, WH], moves: 30,
    map: ['...a.a...', '.........', 'mm.....mm', 'xx.....xx', 'xx.....xx', 'xx.....xx', 'xx.....xx', 'xx.....xx', 'xxm...mxx'], goals: [animals(2), collect(WH, 70)], animal: 'piglet' },
  /* 24 */ { difficulty: 'easy', colors: [ST, AP, CA, CO, BL], moves: 30, map: grid(9, 9, { 4: '.c.c.c.c.' }), goals: [collect(ST, 105)], weights: { berry: 1.3 } },
  /* 25 */ { difficulty: 'hard', colors: [CA, AP, CO, ST, SU], moves: 25,
    map: ['........', '.m.mm.m.', '..m..m..', 'm......m', 'm......m', '..m..m..', 'x.m..m.x', 'mx....xm'], goals: [MUD, collect(CA, 60)], intro: 'tip_hard' },

  // ---- Levels 26â€“50: Mastery (super easy â†’ normal â†’ normal â†’ hard loops) ----
  // 26â€“29 Crate Walls
  /* 26 */ { difficulty: 'supereasy', colors: [AP, CO, CA, BL], moves: 28, map: grid(8, 8, { 4: 'cc.cc.cc' }), goals: [collect(AP, 140)], intro: 'intro_wall' },
  /* 27 */ { difficulty: 'normal', colors: [ST, AP, SU, CA], moves: 26, map: grid(8, 8, { 3: 'cccccccc' }), goals: [CRATE, collect(ST, 215)] },
  /* 28 */ { difficulty: 'normal', colors: [CO, BL, AP, WH], moves: 30, map: grid(8, 9, { 3: 'ccccccccc', 6: 'sssssssss', 7: 'sssssssss' }), goals: [SOIL, collect(CO, 280)] },
  /* 29 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, SU], moves: 28, map: grid(8, 8, { 3: 'cccccccc', 6: 'xssssssx', 7: 'sxssssxs' }), goals: [CRATE, SOIL, collect(SU, 35)], intro: 'tip_hard' },
  // 30â€“33 The Swamp
  /* 30 */ { difficulty: 'supereasy', colors: [CA, AP, CO, ST], moves: 30, map: grid(8, 8, { 6: 'mmmmmmmm', 7: 'mmmmmmmm' }), goals: [MUD, collect(CA, 135)], intro: 'intro_swamp' },
  /* 31 */ { difficulty: 'normal', colors: [BL, SU, AP, CA], moves: 28, map: grid(8, 8, { 6: 'mmmmmmmm', 7: 'cccccccc' }), goals: [MUD, CRATE, collect(BL, 235)] },
  /* 32 */ { difficulty: 'normal', colors: [CO, ST, AP, WH], moves: 30, map: grid(9, 9, { 7: 'mcmcmcmcm', 8: 'ccccccccc' }), goals: [CRATE, collect(CO, 360)] },
  /* 33 */ { difficulty: 'superhard', colors: [AP, CA, CO, ST, BL], moves: 26, map: grid(9, 9, { 6: 'mmmmmmmmm', 7: 'ccccccccc', 8: 'CCCCCCCCC' }), goals: [CRATE, SOIL, collect(AP, 95)], intro: 'tip_superhard' },
  // 34â€“37 Animal Pen
  /* 34 */ { difficulty: 'supereasy', colors: [AP, CO, CA, SU], moves: 30, map: PEN('xx..x..xx', 'xx..x..xx'), goals: [animals(2)], animal: 'chick', intro: 'intro_pen' },
  /* 35 */ { difficulty: 'normal', colors: [ST, BL, AP, CO], moves: 28, map: PEN('xx..x..xx', 'xxmmxmmxx'), goals: [animals(2), MUD, collect(ST, 170)], animal: 'chick' },
  /* 36 */ { difficulty: 'normal', colors: [CA, CO, SU, WH], moves: 30, map: PEN('xx..x..xx', 'xxccxccxx'), goals: [animals(2), collect(CA, 175)], animal: 'piglet' },
  // Deep pens: mud, then crates seal the bottom of each 2-wide pen; pen cells cannot make a line on their own.
  /* 37 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, SU], moves: 35,
    map: ['...a.a...', ...grid(5, 9), 'xx..x..xx', 'xxmmxmmxx', 'xxccxccxx'], goals: [animals(3), CRATE], animal: 'piglet', intro: 'tip_hard' },
  // 38â€“41 Checkerboard Soil
  /* 38 */ { difficulty: 'supereasy', colors: [AP, CO, ST, BL], moves: 28, map: grid(8, 8, { 2: 's.s.s.s.', 3: '.s.s.s.s', 4: 's.s.s.s.', 5: '.s.s.s.s' }), goals: [SOIL, collect(AP, 150)], intro: 'intro_checker' },
  /* 39 */ { difficulty: 'normal', colors: [CA, AP, SU, CO], moves: 28, map: grid(8, 8, { 5: 'scscscsc', 6: 'cscscscs' }), goals: [SOIL, collect(CA, 220)] },
  /* 40 */ { difficulty: 'normal', colors: [ST, CO, WH, BL], moves: 30, map: grid(8, 8, { 4: 'scscscsc', 5: 'cscscscs', 6: 'scscscsc' }), goals: [SOIL, collect(BL, 225)] },
  // Interior soil tiles are boxed in by crates on all four sides.
  /* 41 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, BL], moves: 30, map: grid(8, 8, { 3: 'scscscsc', 4: 'cscscscs', 5: 'scscscsc', 6: 'cscscscs' }), goals: [SOIL, collect(CO, 90)], intro: 'tip_hard' },
  // 42â€“45 The Choke Point
  /* 42 */ { difficulty: 'supereasy', colors: [AP, CO, CA, SU], moves: 28, map: grid(9, 9, { 4: 'xxx...xxx' }), goals: [collect(AP, 120)], intro: 'intro_choke' },
  /* 43 */ { difficulty: 'normal', colors: [ST, BL, AP, CO], moves: 30, map: grid(9, 9, { 4: 'xxxx.xxxx', 7: 'sssssssss', 8: 'sssssssss' }), goals: [SOIL, collect(ST, 30)] },
  /* 44 */ { difficulty: 'normal', colors: [CA, CO, WH, SU], moves: 30, map: grid(9, 9, { 0: '....a....', 1: '....a....', 4: 'xxxx.xxxx', 5: 'm.......m', 8: 'mm.....mm' }), goals: [animals(2), MUD], animal: 'chick' },
  // Mud sits on the choke tile itself: the bottom half gets no refills until it is cleared.
  /* 45 */ { difficulty: 'superhard', colors: [AP, CA, CO, ST, SU], moves: 26, map: grid(9, 9, { 4: 'xxxxmxxxx', 6: '.c.....c.', 7: 'c.c...c.c', 8: '..c...c..' }), goals: [CRATE, MUD, collect(SU, 80)], intro: 'tip_superhard' },
  // 46â€“50 The Mega Farm
  /* 46 */ { difficulty: 'supereasy', colors: [AP, CO, ST, CA], moves: 30,
    map: ['.........', '.........', '.sssssss.', '.s.....s.', '.s.mmm.s.', '.s.....s.', '.sssssss.', '.........', '....m....'], goals: [SOIL, collect(AP, 230)], intro: 'intro_mega' },
  /* 47 */ { difficulty: 'normal', colors: [BL, SU, CO, AP], moves: 32,
    map: ['.........', '.m..c..m.', '.sssssss.', '.s.m.m.s.', '.sMsCsMs.', '.s.m.m.s.', '.sssssss.', '.m..c..m.', '.........'], goals: [SOIL, MUD, collect(BL, 430)] },
  /* 48 */ { difficulty: 'normal', colors: [CA, ST, WH, CO], moves: 30,
    map: ['..a...a..', '.........', '..c...c..', '.........', 'sss.c.sss', '.........', '..c...c..', '.........', 'sssssssss'], goals: [animals(2), SOIL, collect(CA, 400)], animal: 'chick' },
  // Two mud-on-soil cells sealed in the bottom corners.
  /* 49 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, BL], moves: 25,
    map: ['.........', '.mm...mm.', '.ms.c.sm.', '..s...s..', 'ccsCcCscc', '..s...s..', '.ms.c.sm.', 'x.......x', 'Mx.....xM'], goals: [SOIL, CRATE, MUD], intro: 'tip_hard' },
  /* 50 */ { difficulty: 'boss', colors: [AP, CA, CO, ST, SU], moves: 23,
    map: ['.a.....a.', 'sssssssss', 's.m.c.m.s', 'sssssssss', 'c.s.m.s.c', 'sssssssss', 's.m.c.m.s', 'sss...sss', '....s....'], goals: [collect('any', 240), SOIL, animals(4)], animal: 'piglet', intro: 'tip_boss' },
];

export const MATCH_LEVELS: MatchLevelConfig[] = DEFS.map((d, i) => ({
  ...d,
  id: i + 1,
  seed: d.seed ?? 1000 + (i + 1) * 7919,
  powerChance: d.powerChance ?? POWER[d.difficulty],
  unlockAfter: i,
}));

/** How many of a goal the level needs (Mud / Crate / Soil are counted on the map). */
export function goalNeed(cfg: MatchLevelConfig, g: GoalDef): number {
  if (g.type === 'collect' || g.type === 'animal') return g.qty;
  const chars = g.type === 'mud' ? 'mM' : g.type === 'crate' ? 'cC' : 'sMC';
  let n = 0;
  for (const row of cfg.map) for (const ch of row) if (chars.includes(ch)) n++;
  return n;
}

export const STAR_MOVES_2 = 3; // moves left for 2â˜…
export const STAR_MOVES_3 = 6; // moves left for 3â˜…
export const REVIVE_MOVES = 5;

// ---------------------------------------------------------------------------
// Coins in the match game: a reward for clearing a level, the price of a
// booster, and the price of a revive. (`.falcon/sdk-config.json` mirrors
// winCoins / revivePrice for the studio layer.)

/** Coins for the first clear of a level. */
export const WIN_COINS = 40;
/** Coins for clearing a level again (keeps replay farming modest). */
export const REPLAY_COINS = 10;
/** Coins to keep playing a lost round (+REVIVE_MOVES moves). */
export const REVIVE_PRICE = 900;

export interface BoosterConfig {
  key: string;
  /** Coins for `qty` units. */
  price: number;
  qty: number;
  /** First level (1-based) the booster shows on the board. */
  unlock: number;
  /** 'target' = arm it, then tap the board; 'instant' = applies on tap. */
  use: 'target' | 'instant';
}
/**
 * Golden Shovel: dig up any one cropsy or blocker without spending a move.
 * Lucky Horseshoe: +5 moves. Witch Fruit: clears a 3Ã—3 patch around where it lands.
 */
export const BOOSTERS: BoosterConfig[] = [
  { key: 'shovel', price: 300, qty: 1, unlock: 2, use: 'target' },
  { key: 'moves', price: 300, qty: 1, unlock: 5, use: 'instant' },
  { key: 'witch', price: 300, qty: 1, unlock: 8, use: 'target' },
];
export const EXTRA_MOVES = 5;

export function starsFor(movesLeft: number): number {
  if (movesLeft >= STAR_MOVES_3) return 3;
  if (movesLeft >= STAR_MOVES_2) return 2;
  return 1;
}

/** Tutorial opening state (T00). */
export const TUTORIAL_START = { coin: 100, starterFeed: 3 };
