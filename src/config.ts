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

export function starsFor(movesLeft: number): number {
  if (movesLeft >= STAR_MOVES_3) return 3;
  if (movesLeft >= STAR_MOVES_2) return 2;
  return 1;
}

/** Tutorial opening state (T00). */
export const TUTORIAL_START = { coin: 100, starterFeed: 3 };
