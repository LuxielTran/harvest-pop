// Game data for Harvest Pop (Farm × Match-3). Numbers follow the MVP GDD and
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
}

/** Sowing a plot uses one unit of the crop from the silo. */
export const CROPS: Record<string, CropConfig> = {
  wheat: { id: 'wheat', unlockLevel: 1, growSeconds: 60, tutorialSeconds: 8, yieldQty: 2, exp: 1 },
  corn: { id: 'corn', unlockLevel: 2, growSeconds: 180, tutorialSeconds: 180, yieldQty: 2, exp: 2 },
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
  feed: { id: 'feed', machine: 'feedmill', inputs: [{ item: 'wheat', qty: 2 }, { item: 'corn', qty: 1 }], output: 'feed', outputQty: 3, seconds: 45, tutorialSeconds: 5, exp: 2, unlockLevel: 2 },
  bread: { id: 'bread', machine: 'bakery', inputs: [{ item: 'wheat', qty: 3 }], output: 'bread', outputQty: 1, seconds: 120, tutorialSeconds: 8, exp: 4, unlockLevel: 2 },
};

export interface MachineConfig {
  id: string;
  unlockLevel: number;
  cost: number;
  recipes: string[];
}

export const MACHINES: Record<string, MachineConfig> = {
  feedmill: { id: 'feedmill', unlockLevel: 2, cost: 20, recipes: ['feed'] },
  bakery: { id: 'bakery', unlockLevel: 2, cost: 50, recipes: ['bread'] },
};

/** Production slots: a machine is bought with 1; each extra slot costs MACHINE_SLOT_BASE × 3^(bought so far). */
export const MACHINE_SLOT_BASE = 50;
export const MACHINE_SLOTS_MAX = 6;
export const slotPrice = (slots: number): number => MACHINE_SLOT_BASE * 3 ** (slots - 1);

/** What each farm level unlocks (shown on the level-up popup). Crops among them come with CROP_GIFT seeds. */
export const LEVEL_UNLOCKS: Record<number, string[]> = {
  2: ['corn', 'coop', 'chicken', 'egg', 'feedmill', 'bakery'],
};
export const CROP_GIFT = 3;

/** The first six fields are free and open from the start. */
export const PLOTS_START = 6;
/** Fields the player may own: 6 at farm level 1, +3 from level 2 (extra ones are bought in the Shop). */
export const maxPlots = (level: number): number => (level >= 2 ? 9 : 6);
export const PLOTS_MAX = 9;
export const PLOT_COST = 15;

// ---------------------------------------------------------------------------
// Farm map. The 2.5D lawn is WORLD_SCALE× the on-screen farm area in each direction;
// the player pans it by dragging. Buildings and plots sit on an isometric grid of
// 52×26 px diamond cells and can be moved by the player (long press → drag → ✓ / ✕).

export const WORLD_SCALE = 5;
/** Long press that lifts a building / plot, in ms. */
export const MOVE_HOLD_MS = 500;
/** Footprint of each movable object: an n×n block of grid cells. Two footprints may not overlap. */
export const FOOTPRINT: Record<string, number> = { barn: 3, silo: 2, feedmill: 2, bakery: 2, coop: 4, plot: 2 };
/** Starting layout: the front cell (a, b) of each footprint (a runs right/back, b left/back).
 *  Coop and machines are placed by the player when bought; their entries only serve older saves. */
export const DEFAULT_LAYOUT: Record<string, { a: number; b: number }> = {
  barn: { a: 12, b: 15 }, silo: { a: 16, b: 12 },
  feedmill: { a: 6, b: 11 }, bakery: { a: 9, b: 9 }, coop: { a: 11, b: 6 },
  plot0: { a: 0, b: 0 }, plot1: { a: 2, b: 0 }, plot2: { a: 4, b: 0 },
  plot3: { a: 0, b: 2 }, plot4: { a: 2, b: 2 }, plot5: { a: 4, b: 2 },
};
export const COOP_COST = 25;
export const COOP_UNLOCK = 2;
export const COOP_CAPACITY = 6;
/** Chickens the tutorial has the player buy. */
export const TUTORIAL_CHICKENS = 3;
export const CHICKEN_COST = 10;

export interface StorageUpgrade {
  tier: number;
  required: { item: string; qty: number }[];
  capacityAfter: number;
}

export const STORAGE_UPGRADES: Record<StorageType, StorageUpgrade[]> = {
  barn: [
    { tier: 2, required: [{ item: 'nail', qty: 1 }, { item: 'screw', qty: 1 }], capacityAfter: 20 },
    { tier: 3, required: [{ item: 'nail', qty: 2 }, { item: 'screw', qty: 2 }], capacityAfter: 35 },
    { tier: 4, required: [{ item: 'nail', qty: 3 }, { item: 'screw', qty: 3 }], capacityAfter: 55 },
    { tier: 5, required: [{ item: 'nail', qty: 4 }, { item: 'screw', qty: 4 }], capacityAfter: 80 },
  ],
  silo: [
    { tier: 2, required: [{ item: 'bolt', qty: 1 }, { item: 'tape', qty: 1 }], capacityAfter: 20 },
    { tier: 3, required: [{ item: 'bolt', qty: 2 }, { item: 'tape', qty: 2 }], capacityAfter: 35 },
    { tier: 4, required: [{ item: 'bolt', qty: 3 }, { item: 'tape', qty: 3 }], capacityAfter: 55 },
    { tier: 5, required: [{ item: 'bolt', qty: 4 }, { item: 'tape', qty: 4 }], capacityAfter: 80 },
  ],
};

export const STORAGE_START: Record<StorageType, number> = { silo: 10, barn: 10 };

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
export const ORDER_BONUS = 1.3; // orders pay value × bonus, rounded
export const ORDER_COUNT = 3;

// ---------------------------------------------------------------------------
// Match-3 levels — the 50-level blueprint of "level harvest pop.md".
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

/**
 * First-time tutorials. A level lists the ones it introduces; each shows once
 * per player (a card, then a guided first use on the board).
 */
export type TutorialKey =
  | 'tractor' | 'haybale' | 'bee' | 'rainbow'          // power-ups
  | 'mud' | 'crate' | 'soil' | 'soilcrate'              // obstacles / soil
  | 'chick' | 'piglet' | 'any'                          // goals
  | 'shovel' | 'moves' | 'witch';                       // boosters

export interface MatchLevelConfig {
  id: number;
  difficulty: Difficulty;
  /** The cropsy pool: 3 to 5 kinds. */
  colors: TileKind[];
  /** 20 to 50, by how much the level asks for. */
  moves: number;
  map: string[];
  /** 1 to 3 goals, all needed to win. */
  goals: GoalDef[];
  animal?: AnimalKind;
  /** Spawn weight per kind (default 1). */
  weights?: Partial<Record<TileKind, number>>;
  /** Chance that a freshly dropped cropsy arrives as a Tractor Cropsy (randomised power-ups). */
  powerChance: number;
  /** Columns topped by a beehive, which sometimes drops a Busy Bee. */
  hives?: number[];
  /** Tutorials this level introduces (shown once each). */
  tutorial?: TutorialKey[];
  seed: number;
  /** Which level (1-based) must be cleared first; 0 = always open. */
  unlockAfter: number;
  /** i18n key of the tip shown when the level opens (a layout idea, a hard level). */
  intro?: string;
}

const AP: TileKind = 'apple', CA: TileKind = 'carrot', CO: TileKind = 'corn', ST: TileKind = 'berry';
const BL: TileKind = 'blueberry', SU: TileKind = 'sunflower', WH: TileKind = 'wheat';

/** A rows × cols rectangle of plain cells, with some rows replaced. */
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

// Collect goals stay within reach of the move count (never "200 carrots in 20 moves").
const DEFS: LevelInput[] = [
  // ---- Levels 1–10: Onboarding — winnable, coin-friendly, each one teaches one thing ----
  /* 1 */ { difficulty: 'tutorial', colors: [AP, CA, SU], moves: 20, map: grid(6, 6), goals: [collect(AP, 35)], seed: 20261009, powerChance: 0 },
  /* 2 */ { difficulty: 'tutorial', colors: [CA, CO, AP, ST], moves: 20, map: grid(7, 7), goals: [collect(CA, 35), collect(CO, 35)], tutorial: ['tractor'], powerChance: 0.02 },
  /* 3 */ { difficulty: 'easy', colors: [ST, AP, CA, SU, BL], moves: 22, map: grid(8, 8), goals: [collect(ST, 35)], tutorial: ['haybale'] },
  /* 4 */ { difficulty: 'easy', colors: [BL, AP, CO, CA, SU], moves: 22, map: grid(8, 8, { 7: '..mmmm..' }), goals: [collect(BL, 40), MUD], tutorial: ['mud'] },
  /* 5 */ { difficulty: 'easy', colors: [AP, CA, CO, SU, ST], moves: 24,
    map: ['xx....xx', 'x......x', 'm......m', '...mm...', '..m..m..', '...mm...', 'x......x', 'xx....xx'], goals: [MUD, collect(CO, 35)], tutorial: ['shovel'], intro: 'intro_shape' },
  /* 6 */ { difficulty: 'normal', colors: [ST, BL, AP, WH, CA], moves: 24, map: grid(8, 8, { 0: '...a....' }), goals: [animals(1), collect(BL, 35)], animal: 'chick', tutorial: ['chick'] },
  /* 7 */ { difficulty: 'easy', colors: [AP, CO, CA, ST, BL], moves: 25, map: SPLIT(7), goals: [collect(AP, 30), collect(CO, 30)], hives: [1, 7], tutorial: ['bee'], intro: 'intro_split' },
  /* 8 */ { difficulty: 'normal', colors: [CO, CA, SU, BL, AP], moves: 28,
    map: ['xx.a.a.xx', 'xx.....xx', ...grid(4, 9), 'mm.....mm', 'xx.....xx', 'xx.m.m.xx'], goals: [MUD, animals(2), collect(CA, 45)], animal: 'chick', tutorial: ['moves'] },
  /* 9 */ { difficulty: 'easy', colors: [ST, AP, CO, CA, SU], moves: 24,
    map: ['.......', '.......', '.m...m.', '..m.m..', '.m...m.', '..m.m..', '.m...m.'], goals: [MUD, collect(ST, 40)], tutorial: ['rainbow'] },
  // First gatekeeper: 5 kinds, and two mud patches sealed in the bottom corners (power-up or booster needed).
  /* 10 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, SU], moves: 23,
    map: grid(8, 8, { 2: '.m....m.', 3: '..m..m..', 4: '..m..m..', 5: '.m....m.', 6: 'x..mm..x', 7: 'mx....xm' }), goals: [MUD, collect(SU, 50)], tutorial: ['witch'], intro: 'tip_hard' },

  // ---- Levels 11–25: Hook phase (sawtooth: stress, then relief) ----
  /* 11 */ { difficulty: 'supereasy', colors: [CA, AP, CO, BL], moves: 20, map: grid(9, 9), goals: [collect(CA, 50)], weights: { carrot: 1.2 } },
  /* 12 */ { difficulty: 'normal', colors: [ST, BL, AP, CO, SU], moves: 20, map: grid(8, 8, { 3: '..c..c..', 5: '..c..c..' }), goals: [CRATE, collect(AP, 50)], tutorial: ['crate'] },
  /* 13 */ { difficulty: 'normal', colors: [CA, CO, AP, ST, WH], moves: 30,
    map: ['...a.a...', 'x.......x', 'xx.....xx', 'xxx...xxx', 'xxx...xxx', 'xxm...mxx', 'xm.....mx', 'mm.....mm'], goals: [animals(2), collect(CO, 40)], animal: 'piglet', tutorial: ['piglet'] },
  /* 14 */ { difficulty: 'easy', colors: [BL, SU, AP, CA, CO], moves: 24, map: grid(8, 8, { 3: '..ssss..', 4: '.s....s.', 5: '..ssss..' }), goals: [SOIL, collect(BL, 40)], tutorial: ['soil'] },
  /* 15 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, BL], moves: 27,
    map: ['xxx...xxx', 'xx.sss.xx', 'x.s...s.x', 'ss.ccc.ss', 's..csc..s', 'ss.ccc.ss', 'x.s...s.x', 'xx.s.s.xx', 'xxx...xxx'], goals: [SOIL, collect(ST, 65)], intro: 'tip_hard' },
  /* 16 */ { difficulty: 'supereasy', colors: [BL, CO, AP, CA], moves: 20, map: grid(5, 9), goals: [collect(BL, 50)], weights: { blueberry: 1.2 } },
  /* 17 */ { difficulty: 'normal', colors: [ST, SU, CA, CO, AP], moves: 28,
    map: grid(8, 8, { 2: '.m....m.', 3: '..mccm..', 4: '..mccm..', 5: '.m....m.', 7: 'm......m' }), goals: [MUD, CRATE, collect(SU, 65)] },
  /* 18 */ { difficulty: 'normal', colors: [AP, BL, CO, WH, CA], moves: 44, map: SPLIT(8, '.a..x..a.'), goals: [animals(3)], animal: 'chick', hives: [1, 6] },
  /* 19 */ { difficulty: 'easy', colors: [CO, CA, ST, SU, AP], moves: 24, map: ['.......', '..ssss.', '.s.m.s.', '.smmms.', '.s.m.s.', '.sssss.', '...m...'], goals: [SOIL, collect(CO, 25)] },
  // Monetization checkpoint: the two top corners hang off 1-wide columns (only vertical lines, blasts or boosters reach them).
  /* 20 */ { difficulty: 'superhard', colors: [AP, CA, CO, ST, BL], moves: 20,
    map: ['cx.....xc', '.x.....x.', '.c.....c.', '..c...c..', '..cc.cc..', '..c...c..', '.c.ccc.c.', '..c.c.c..', 'xx.....xx'], goals: [CRATE, collect(BL, 50)], intro: 'tip_superhard' },
  /* 21 */ { difficulty: 'supereasy', colors: [CO, AP, CA, ST, SU], moves: 25, map: grid(6, 6), goals: [collect(CO, 25), collect(AP, 25)], weights: { corn: 1.5, apple: 1.5 } },
  /* 22 */ { difficulty: 'normal', colors: [BL, AP, CO, CA, SU], moves: 20, map: grid(8, 8, { 2: '..C..C..', 3: '.C....C.', 4: '.C....C.', 5: '..C..C..' }), goals: [SOIL, collect(BL, 45)], hives: [2, 5], tutorial: ['soilcrate'] },
  /* 23 */ { difficulty: 'normal', colors: [CA, ST, AP, CO, WH], moves: 30,
    map: ['...a.a...', '.........', 'mm.....mm', 'xx.....xx', 'xx.....xx', 'xx.....xx', 'xx.....xx', 'xx.....xx', 'xxm...mxx'], goals: [animals(2), collect(WH, 60)], animal: 'piglet' },
  /* 24 */ { difficulty: 'easy', colors: [ST, AP, CA, CO, BL], moves: 22, map: grid(9, 9, { 4: '.c.c.c.c.' }), goals: [collect(ST, 50), CRATE], weights: { berry: 1.2 } },
  /* 25 */ { difficulty: 'hard', colors: [CA, AP, CO, ST, SU], moves: 22,
    map: ['........', '.m.mm.m.', '..m..m..', 'm......m', 'm......m', '..m..m..', 'x.m..m.x', 'mx....xm'], goals: [MUD, collect(CA, 55)], intro: 'tip_hard' },

  // ---- Levels 26–50: Mastery (super easy → normal → normal → hard loops) ----
  // 26–29 Crate Walls
  /* 26 */ { difficulty: 'supereasy', colors: [AP, CO, CA, BL], moves: 20, map: grid(8, 8, { 4: 'cc.cc.cc' }), goals: [collect(AP, 50)], intro: 'intro_wall' },
  /* 27 */ { difficulty: 'normal', colors: [ST, AP, SU, CA, BL], moves: 26, map: grid(8, 8, { 3: 'cccccccc' }), goals: [CRATE, collect(ST, 60)] },
  /* 28 */ { difficulty: 'normal', colors: [CO, BL, AP, WH, CA], moves: 24, map: grid(8, 9, { 3: 'ccccccccc', 6: 'sssssssss', 7: 'sssssssss' }), goals: [SOIL, collect(CO, 50)], hives: [4] },
  /* 29 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, SU], moves: 20, map: grid(8, 8, { 3: 'cccccccc', 6: 'xssssssx', 7: 'sxssssxs' }), goals: [CRATE, SOIL, collect(SU, 45)], intro: 'tip_hard' },
  // 30–33 The Swamp
  /* 30 */ { difficulty: 'supereasy', colors: [CA, AP, CO, ST], moves: 20, map: grid(8, 8, { 6: 'mmmmmmmm', 7: 'mmmmmmmm' }), goals: [MUD, collect(CA, 50)], intro: 'intro_swamp' },
  /* 31 */ { difficulty: 'normal', colors: [BL, SU, AP, CA, CO], moves: 28, map: grid(8, 8, { 6: 'mmmmmmmm', 7: 'cccccccc' }), goals: [MUD, CRATE, collect(BL, 60)] },
  /* 32 */ { difficulty: 'normal', colors: [CO, ST, AP, WH, BL], moves: 21, map: grid(9, 9, { 7: 'mcmcmcmcm', 8: 'ccccccccc' }), goals: [CRATE, collect(CO, 45)] },
  /* 33 */ { difficulty: 'superhard', colors: [AP, CA, CO, ST, BL], moves: 20, map: grid(9, 9, { 5: 'm.m.m.m.m', 6: 'mmmmmmmmm', 7: 'ccccccccc', 8: 'CCCCCCCCC' }), goals: [CRATE, SOIL, collect(AP, 45)], intro: 'tip_superhard' },
  // 34–37 Animal Pen
  /* 34 */ { difficulty: 'supereasy', colors: [AP, CO, CA, SU], moves: 22, map: PEN('xx..x..xx', 'xx..x..xx'), goals: [animals(2), collect(AP, 25)], animal: 'chick', intro: 'intro_pen' },
  /* 35 */ { difficulty: 'normal', colors: [ST, BL, AP, CO, WH], moves: 28, map: PEN('xx..x..xx', 'xxmmxmmxx'), goals: [animals(2), MUD, collect(ST, 30)], animal: 'chick', hives: [3, 5] },
  /* 36 */ { difficulty: 'normal', colors: [CA, CO, SU, WH, ST], moves: 42, map: PEN('xx..x..xx', 'xxccxccxx'), goals: [animals(2), collect(CA, 35)], animal: 'piglet' },
  // Deep pens: mud, then crates seal the bottom of each 2-wide pen; pen cells cannot make a line on their own.
  /* 37 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, SU], moves: 26,
    map: ['...a.a...', ...grid(5, 9), 'xx..x..xx', 'xxmmxmmxx', 'xxccxccxx'], goals: [animals(3), CRATE], animal: 'piglet', intro: 'tip_hard' },
  // 38–41 Checkerboard Soil
  /* 38 */ { difficulty: 'supereasy', colors: [AP, CO, ST, BL], moves: 20, map: grid(8, 8, { 2: 's.s.s.s.', 3: '.s.s.s.s', 4: 's.s.s.s.', 5: '.s.s.s.s' }), goals: [SOIL, collect(AP, 50)], intro: 'intro_checker' },
  /* 39 */ { difficulty: 'normal', colors: [CA, AP, SU, CO, BL], moves: 26, map: grid(8, 8, { 5: 'scscscsc', 6: 'cscscscs' }), goals: [SOIL, collect(CA, 60)] },
  /* 40 */ { difficulty: 'normal', colors: [ST, CO, WH, BL, AP], moves: 20, map: grid(8, 8, { 4: 'scscscsc', 5: 'cscscscs', 6: 'scscscsc' }), goals: [SOIL, collect(BL, 45)] },
  // Interior soil tiles are boxed in by crates on all four sides.
  /* 41 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, BL], moves: 20, map: grid(8, 8, { 2: 'cscscscs', 3: 'scscscsc', 4: 'cscscscs', 5: 'scscscsc', 6: 'cscscscs' }), goals: [SOIL, collect(CO, 50)], hives: [1, 6], intro: 'tip_hard' },
  // 42–45 The Choke Point
  /* 42 */ { difficulty: 'supereasy', colors: [AP, CO, CA, SU], moves: 20, map: grid(9, 9, { 4: 'xxx...xxx' }), goals: [collect(AP, 50)], intro: 'intro_choke' },
  /* 43 */ { difficulty: 'normal', colors: [ST, BL, AP, CO, WH], moves: 26, map: grid(9, 9, { 4: 'xxxx.xxxx', 7: 'sssssssss', 8: 'sssssssss' }), goals: [SOIL, collect(ST, 45)] },
  /* 44 */ { difficulty: 'normal', colors: [CA, CO, WH, SU, AP], moves: 22, map: grid(9, 9, { 0: '....a....', 1: '....a....', 4: 'xxxx.xxxx', 5: 'm.......m', 8: 'mm.....mm' }), goals: [animals(2), MUD], animal: 'chick' },
  // Mud sits on the choke tile itself: the bottom half gets no refills until it is cleared.
  /* 45 */ { difficulty: 'superhard', colors: [AP, CA, CO, ST, SU], moves: 25, map: grid(9, 9, { 4: 'xxxxmxxxx', 6: '.c.....c.', 7: 'c.c...c.c', 8: '..c...c..' }), goals: [CRATE, MUD, collect(SU, 60)], intro: 'tip_superhard' },
  // 46–50 The Mega Farm
  /* 46 */ { difficulty: 'supereasy', colors: [AP, CO, ST, CA], moves: 20,
    map: ['.........', '.........', '.sssssss.', '.s.....s.', '.s.mmm.s.', '.s.....s.', '.sssssss.', '.........', '....m....'], goals: [SOIL, collect(AP, 50)], intro: 'intro_mega' },
  /* 47 */ { difficulty: 'normal', colors: [BL, SU, CO, AP, CA], moves: 20,
    map: ['..m...m..', '.m..c..m.', '.sssssss.', '.smm.mms.', '.sMsCsMs.', '.smm.mms.', '.sssssss.', '.m..c..m.', '..m...m..'], goals: [SOIL, MUD, collect(BL, 50)], hives: [2, 6] },
  /* 48 */ { difficulty: 'normal', colors: [CA, ST, WH, CO, BL], moves: 23,
    map: ['..a...a..', '.........', '..c...c..', '.........', 'sss.c.sss', '.........', '..c...c..', '.........', 'sssssssss'], goals: [animals(2), SOIL, collect(CA, 35)], animal: 'chick' },
  // Two mud-on-soil cells sealed in the bottom corners.
  /* 49 */ { difficulty: 'hard', colors: [AP, CA, CO, ST, BL], moves: 20,
    map: ['..c...c..', '.mm.c.mm.', '.ms.c.sm.', '.cs...sc.', 'ccsCcCscc', '.cs...sc.', '.ms.c.sm.', 'x.......x', 'Mx.....xM'], goals: [SOIL, CRATE, collect(ST, 50)], intro: 'tip_hard' },
  /* 50 */ { difficulty: 'boss', colors: [AP, CA, CO, ST, SU], moves: 22,
    map: ['.a.....a.', 'sssssssss', 's.m.c.m.s', 'sssssssss', 'c.s.m.s.c', 'sssssssss', 's.m.c.m.s', 'sss...sss', '....s....'], goals: [collect('any', 130), SOIL, animals(4)], animal: 'piglet', hives: [3, 5], tutorial: ['any'], intro: 'tip_boss' },
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

export const STAR_MOVES_2 = 3; // moves left for 2★
export const STAR_MOVES_3 = 6; // moves left for 3★
export const REVIVE_MOVES = 5;

// ---------------------------------------------------------------------------
// Coins in the match game: a reward for clearing a level (by stars and
// difficulty), the price of a booster, and the price of a revive.

/** Coins for 1★ / 2★ / 3★. Super easy, easy, normal (and tutorial) levels pay the first row; hard, super hard and boss the second. */
export const WIN_COINS_REGULAR = [20, 40, 80];
export const WIN_COINS_HARD = [40, 80, 160];
export function winCoins(difficulty: Difficulty, stars: number): number {
  if (stars <= 0) return 0;
  const table = difficulty === 'hard' || difficulty === 'superhard' || difficulty === 'boss' ? WIN_COINS_HARD : WIN_COINS_REGULAR;
  return table[Math.min(3, stars) - 1];
}
/** Coins for clearing a level again without beating its best stars (keeps replay farming modest). */
export const REPLAY_COINS = 10;
/** Coins to keep playing a lost round (+REVIVE_MOVES moves). */
export const REVIVE_PRICE = 900;

export interface BoosterConfig {
  key: 'shovel' | 'moves' | 'witch';
  /** Coins for `qty` units. */
  price: number;
  qty: number;
  /** First level (1-based) the booster shows on the board; that level teaches it and gives 1 free. */
  unlock: number;
  /** 'target' = arm it, then tap the board; 'instant' = applies on tap. */
  use: 'target' | 'instant';
}
/**
 * Golden Shovel: dig up any one cropsy or blocker without spending a move.
 * Lucky Horseshoe: +5 moves. Witch Fruit: clears a 3×3 patch around where it lands.
 */
export const BOOSTERS: BoosterConfig[] = [
  { key: 'shovel', price: 300, qty: 1, unlock: 5, use: 'target' },
  { key: 'moves', price: 300, qty: 1, unlock: 8, use: 'instant' },
  { key: 'witch', price: 300, qty: 1, unlock: 10, use: 'target' },
];
export const EXTRA_MOVES = 5;

export function starsFor(movesLeft: number): number {
  if (movesLeft >= STAR_MOVES_3) return 3;
  if (movesLeft >= STAR_MOVES_2) return 2;
  return 1;
}

/** 6 wheat sow all six fields; their 12-wheat harvest overflows the 10-slot silo on purpose (→ Match-3 → upgrade). */
export const TUTORIAL_START = { coin: 500, starterWheat: 6 };

// ---------------------------------------------------------------------------
// Gems: the premium currency. They buy a crop the player is out of, and finish
// any timer (a growing field, a laying chicken, a machine batch) at once.

export const GEM_START = 20;
/** Gems for one unit of a crop when the silo has none. */
export const CROP_GEM_PRICE = 1;
/** Seconds of waiting one gem skips. */
export const GEM_SECONDS = 120;
/** Gems to skip `ms` of waiting: 1 per GEM_SECONDS, rounded up, at least 1. */
export const gemsFor = (ms: number): number => Math.max(1, Math.ceil(ms / 1000 / GEM_SECONDS));
