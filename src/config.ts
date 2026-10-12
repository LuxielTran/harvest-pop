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
// Match-3 levels

export type TileKind = 'wheat' | 'carrot' | 'apple' | 'berry' | 'sunflower';
export const TILE_KINDS: TileKind[] = ['wheat', 'carrot', 'apple', 'berry', 'sunflower'];

export interface MatchLevelConfig {
  id: number;
  seed: number;
  goal: { tile: TileKind; qty: number };
  moves: number;
  /** Spawn weight multiplier of the goal tile (1 = fair). */
  goalWeight: number;
  /** Which level (1-based) must be cleared first; 0 = always open. */
  unlockAfter: number;
}

function makeLevels(): MatchLevelConfig[] {
  const out: MatchLevelConfig[] = [];
  // Level 1 is the tutorial board: fixed seed, generous goal tile.
  out.push({ id: 1, seed: 20261009, goal: { tile: 'wheat', qty: 12 }, moves: 12, goalWeight: 1.5, unlockAfter: 0 });
  const goals: TileKind[] = ['carrot', 'apple', 'berry', 'sunflower', 'wheat'];
  for (let i = 2; i <= 30; i++) {
    const t = i - 2;
    out.push({
      id: i,
      seed: 1000 + i * 7919,
      goal: { tile: goals[t % goals.length], qty: 14 + t * 2 },
      moves: 14 + Math.floor(t / 4),
      goalWeight: t < 4 ? 1.3 : 1.1,
      unlockAfter: i - 1,
    });
  }
  return out;
}
export const MATCH_LEVELS: MatchLevelConfig[] = makeLevels();

export const BOARD_SIZE = 8;
export const STAR_MOVES_2 = 3; // moves left for 2★
export const STAR_MOVES_3 = 6; // moves left for 3★
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
}
/** Golden Shovel: dig up any one tile on the board without spending a move. */
export const BOOSTERS: BoosterConfig[] = [{ key: 'shovel', price: 300, qty: 1, unlock: 2 }];

export function starsFor(movesLeft: number): number {
  if (movesLeft >= STAR_MOVES_3) return 3;
  if (movesLeft >= STAR_MOVES_2) return 2;
  return 1;
}

/** Tutorial opening state (T00). */
/** 6 wheat sow all six fields; their 12-wheat harvest overflows the 10-slot silo on purpose (→ Match-3 → upgrade). */
export const TUTORIAL_START = { coin: 100, starterWheat: 6 };

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
