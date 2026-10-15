// Farm content for levels 1–50, after the "Harvest Pop Unlock Levels" sheet.
// Everything the farm sells, grows, raises and crafts is DATA here; the engine
// (state.ts) and the UI (ui/farm.ts) are generic over it. Numbers are the first
// thing to tune after a playtest.
//
// Reading of the sheet:
//   - "Experience points to next level" is read as the CUMULATIVE XP at which a
//     level is reached (Hay Day's table): lvl 2 at 15 XP, lvl 3 at 20 … lvl 50 at 54 800.
//   - "(xN)" after a crop is the seed gift the unlock comes with; "(xN)" after a
//     feed is a feed gift; "(xN in shop)" after an animal is the pen's capacity.
//   - Levels 10+ were marked PROPOSAL in the sheet. Products that need a machine
//     the sheet never lists get one here (BBQ Grill 11, Sugar Mill 13, Popcorn
//     Pot 16), Carrot (needed by carrot pie / cake / juice) is a level-9 crop, and
//     the meta systems marked optional (social, farm pass, helper, boat, derby,
//     town, farm helpers…) are not built. See LEVELS-FARM.md.

export type StorageType = 'silo' | 'barn';

export interface ItemDef {
  id: string;
  storage: StorageType | 'upgrade';
  /** Coins a farm order pays per unit (orders are the Coin source). */
  value: number;
  /** XP for making / harvesting / collecting one unit. */
  exp: number;
}

const expFor = (value: number): number => Math.max(1, Math.round(value / 10));

// ---------------------------------------------------------------------------
// Crops (sown on fields from the silo; one unit of the crop is the seed)

export interface CropConfig {
  id: string;
  unlockLevel: number;
  growSeconds: number;
  yieldQty: number;
  value: number;
  /** Seeds given when the crop unlocks. */
  gift: number;
}

const crop = (id: string, unlockLevel: number, growSeconds: number, value: number, gift = 3, yieldQty = 2): CropConfig =>
  ({ id, unlockLevel, growSeconds, yieldQty, value, gift });

export const CROPS: Record<string, CropConfig> = Object.fromEntries([
  crop('wheat', 1, 30, 3, 6),
  crop('corn', 2, 60, 5, 4),
  crop('soybean', 5, 300, 9),
  crop('carrot', 9, 180, 7),
  crop('indigo', 13, 1200, 20),
  crop('pumpkin', 15, 1800, 27),
  crop('cotton', 18, 1500, 24),
  crop('chili', 25, 2400, 30),
  crop('blackbean', 25, 2100, 28),
  crop('tomato', 30, 3000, 36),
  crop('strawberry', 34, 3600, 45),
  crop('potato', 35, 4200, 42),
  crop('chamomile', 45, 5400, 55),
  crop('asparagus', 49, 6000, 60),
  crop('sesame', 50, 6600, 65),
].map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Trees & bushes (bought in the shop, placed on the map, harvested again and again)
// and the Mine, which works the same way but digs up a random ore.

export interface TreeConfig {
  id: string;
  unlockLevel: number;
  cost: number;
  /** What a harvest gives: one item, or a weighted pick (the Mine). */
  produce: { item: string; weight: number; unlockLevel?: number }[];
  produceQty: number;
  seconds: number;
  /** How many the player may own. */
  max: number;
}

const tree = (id: string, unlockLevel: number, item: string, seconds: number, cost: number): TreeConfig =>
  ({ id, unlockLevel, cost, produce: [{ item, weight: 1 }], produceQty: 2, seconds, max: 6 });

export const TREES: Record<string, TreeConfig> = Object.fromEntries([
  tree('appletree', 15, 'apple', 2700, 300),
  tree('raspberrybush', 19, 'raspberry', 3000, 400),
  tree('cherrytree', 22, 'cherry', 3600, 500),
  { id: 'mine', unlockLevel: 24, cost: 1500, produceQty: 2, seconds: 1800, max: 2,
    produce: [{ item: 'silverore', weight: 5 }, { item: 'goldore', weight: 3 }, { item: 'platinumore', weight: 2 }, { item: 'coal', weight: 4, unlockLevel: 33 }, { item: 'ironore', weight: 4, unlockLevel: 34 }] },
  tree('blackberrybush', 26, 'blackberry', 3300, 600),
  tree('blueberrybush', 30, 'blueberry', 3900, 800),
  tree('cacaotree', 36, 'cacao', 4800, 1100),
  tree('nectarbush', 39, 'nectar', 4200, 1200),
  tree('coffeebush', 42, 'coffeebean', 5100, 1500),
].map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Animals and their pens. A pen type can be built more than once ("2nd Chicken
// Coop"): `unlockLevels[k]` is the farm level that opens the (k+1)-th one.
// Pets (no produce) are fed for XP and then doze for a while.

export interface AnimalConfig {
  id: string;
  cost: number;
  feedItem: string;
  feedQty: number;
  /** null for pets: feeding gives `exp` and nothing else. */
  produceItem: string | null;
  produceQty: number;
  produceSeconds: number;
  exp: number;
}

export interface PenConfig {
  id: string;
  animal: string;
  capacity: number;
  unlockLevels: number[];
  cost: number;
  /** n×n grid cells. */
  footprint: number;
  /** The pen comes with its animals (a fishing lake's spots), nothing to buy. */
  autoFill?: boolean;
  /** Drawn as: a fenced yard, a small house, a pond, a hive tree. */
  look: 'yard' | 'house' | 'pond' | 'hive';
}

const animal = (id: string, cost: number, feedItem: string, feedQty: number, produceItem: string | null, produceQty: number, produceSeconds: number, exp: number): AnimalConfig =>
  ({ id, cost, feedItem, feedQty, produceItem, produceQty, produceSeconds, exp });

export const ANIMALS: Record<string, AnimalConfig> = Object.fromEntries([
  animal('chicken', 10, 'feed', 1, 'egg', 2, 90, 2),
  animal('cow', 50, 'cowfeed', 1, 'milk', 1, 300, 4),
  animal('pig', 70, 'pigfeed', 1, 'bacon', 1, 600, 6),
  animal('sheep', 100, 'sheepfeed', 1, 'wool', 1, 720, 6),
  animal('lamb', 160, 'lambfeed', 1, 'lambskewer', 1, 1200, 10),
  animal('goat', 200, 'goatfeed', 1, 'goatmilk', 1, 900, 9),
  animal('bees', 250, 'nectar', 1, 'honeycomb', 1, 1500, 10),
  animal('fish', 0, 'fishinglure', 1, 'fishfillet', 1, 480, 8),
  animal('lobster', 0, 'fishingnet', 1, 'lobstertail', 1, 1800, 14),
  animal('duck', 150, 'feed', 2, 'duckfeather', 1, 1500, 12),
  // Pets: a treat → XP, then a nap.
  animal('dog', 220, 'bacon', 1, null, 0, 900, 20),
  animal('cat', 220, 'milk', 1, null, 0, 900, 20),
  animal('horse', 400, 'carrot', 2, null, 0, 1200, 30),
  animal('bunny', 200, 'carrot', 1, null, 0, 600, 15),
  animal('puppy', 260, 'bacon', 1, null, 0, 900, 25),
  animal('kitten', 260, 'milk', 1, null, 0, 900, 25),
  animal('donkey', 500, 'carrot', 2, null, 0, 1200, 35),
].map((a) => [a.id, a]));

const pen = (id: string, animal: string, capacity: number, unlockLevels: number[], cost: number, footprint: number, look: PenConfig['look'], autoFill = false): PenConfig =>
  ({ id, animal, capacity, unlockLevels, cost, footprint, look, autoFill });

export const PENS: Record<string, PenConfig> = Object.fromEntries([
  pen('coop', 'chicken', 6, [1, 12, 23], 25, 4, 'yard'),
  pen('cowpasture', 'cow', 5, [6, 15, 27], 120, 5, 'yard'),
  pen('pigpen', 'pig', 5, [10, 18, 32], 250, 4, 'yard'),
  pen('sheeppasture', 'sheep', 5, [16, 26, 42], 500, 5, 'yard'),
  pen('doghouse', 'dog', 1, [20, 28], 600, 2, 'house'),
  pen('cathouse', 'cat', 1, [21, 29], 600, 2, 'house'),
  pen('lambpasture', 'lamb', 4, [25, 30], 900, 4, 'yard'),
  pen('lake', 'fish', 3, [27], 1200, 4, 'pond', true),
  pen('horsestable', 'horse', 2, [27, 37, 40, 47], 1400, 3, 'house'),
  pen('bunnyhouse', 'bunny', 2, [31, 41], 1000, 2, 'house'),
  pen('goatyard', 'goat', 4, [32, 37, 50], 1600, 4, 'yard'),
  pen('puppyhouse', 'puppy', 1, [35, 50], 1200, 2, 'house'),
  pen('beehive', 'bees', 3, [39], 2000, 2, 'hive'),
  pen('donkeystable', 'donkey', 2, [43], 2600, 3, 'house'),
  pen('lobsterpool', 'lobster', 3, [44], 2800, 3, 'pond', true),
  pen('kittenhouse', 'kitten', 1, [49], 2000, 2, 'house'),
  pen('ducksalon', 'duck', 4, [50], 3500, 3, 'pond'),
].map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// Machines and recipes. A machine type can be bought more than once ("2nd Feed Mill").

export interface MachineConfig {
  id: string;
  unlockLevels: number[];
  cost: number;
  recipes: string[];
  /** n×n grid cells. */
  footprint: number;
}

export interface RecipeConfig {
  id: string;
  machine: string;
  inputs: { item: string; qty: number }[];
  output: string;
  outputQty: number;
  seconds: number;
  unlockLevel: number;
}

/** Recipe time by the level it unlocks at: a minute early on, ~45 min for the last ones. */
const recipeSeconds = (lvl: number): number => Math.round(45 + lvl * lvl * 1.1);

type RecipeIn = [output: string, unlockLevel: number, inputs: Record<string, number>, seconds?: number, outputQty?: number];
const MACHINE_DEFS: { id: string; unlockLevels: number[]; cost?: number; footprint?: number; recipes: RecipeIn[] }[] = [
  { id: 'feedmill', unlockLevels: [2, 12], cost: 20, recipes: [
    ['feed', 2, { wheat: 2, corn: 1 }, 45, 3], ['cowfeed', 6, { corn: 2, soybean: 1 }, 120, 3], ['pigfeed', 10, { carrot: 2, soybean: 1 }, 180, 3],
    ['sheepfeed', 16, { wheat: 3, soybean: 1 }, 240, 3], ['lambfeed', 25, { wheat: 2, corn: 2 }, 300, 3], ['goatfeed', 32, { corn: 2, carrot: 2 }, 300, 3],
  ] },
  { id: 'bakery', unlockLevels: [3], cost: 50, recipes: [
    ['bread', 3, { wheat: 3 }, 120], ['cookie', 10, { wheat: 2, egg: 1, milk: 1 }], ['raspberrymuffin', 19, { wheat: 2, egg: 1, raspberry: 2 }],
    ['blackberrymuffin', 26, { wheat: 2, egg: 1, blackberry: 2 }], ['blueberrymuffin', 33, { wheat: 2, egg: 1, blueberry: 2 }], ['potatobread', 39, { wheat: 2, potato: 2, egg: 1 }],
  ] },
  { id: 'dairy', unlockLevels: [6], recipes: [['cream', 6, { milk: 1 }, 90], ['cheese', 12, { milk: 3 }], ['goatcheese', 33, { goatmilk: 2 }]] },
  { id: 'grill', unlockLevels: [11], recipes: [
    ['baconeggs', 11, { bacon: 2, egg: 4 }], ['hamburger', 18, { bread: 1, bacon: 2 }], ['fishburger', 27, { bread: 1, fishfillet: 1 }],
    ['roastedtomatoes', 30, { tomato: 3, chili: 1 }], ['fishchips', 41, { fishfillet: 2, potato: 2 }], ['lobsterskewer', 48, { lobstertail: 1, chili: 1 }],
  ] },
  { id: 'sugarmill', unlockLevels: [13], recipes: [['whitesugar', 13, { corn: 3 }], ['syrup', 18, { whitesugar: 2 }]] },
  { id: 'pieoven', unlockLevels: [14], recipes: [
    ['carrotpie', 14, { carrot: 3, wheat: 2, egg: 1 }], ['pumpkinpie', 15, { pumpkin: 2, wheat: 2, egg: 1 }], ['baconpie', 18, { bacon: 2, wheat: 2, egg: 1 }],
    ['applepie', 28, { apple: 3, wheat: 2, egg: 1 }], ['fishpie', 28, { fishfillet: 2, wheat: 2, egg: 1 }], ['pizza', 33, { wheat: 2, cheese: 1, tomato: 1 }],
    ['fetapie', 34, { goatcheese: 1, wheat: 2, egg: 1 }], ['bakedpotato', 35, { potato: 2, cream: 1 }], ['casserole', 36, { potato: 2, bacon: 1, cheese: 1, egg: 1 }],
    ['spicypizza', 37, { wheat: 2, cheese: 1, tomato: 1, chili: 1 }], ['fruttidimare', 45, { wheat: 2, cheese: 1, tomato: 1, fishfillet: 1, lobstertail: 1 }],
    ['asparagusquiche', 49, { asparagus: 2, egg: 2, cream: 1, wheat: 1 }],
  ] },
  { id: 'popcornpot', unlockLevels: [16], recipes: [
    ['butteredpopcorn', 16, { corn: 2, cream: 1 }], ['chilipopcorn', 25, { corn: 2, chili: 1, cream: 1 }], ['honeypopcorn', 40, { corn: 2, honey: 1 }], ['chocolatepopcorn', 44, { corn: 2, cacao: 1, whitesugar: 1 }],
  ] },
  { id: 'loom', unlockLevels: [17], recipes: [
    ['sweater', 17, { wool: 2 }], ['cottonfabric', 18, { cotton: 3 }], ['bluewoollyhat', 19, { wool: 1, indigo: 1 }], ['bluesweater', 20, { wool: 2, indigo: 1 }], ['woolychaps', 21, { wool: 3, cottonfabric: 1 }],
  ] },
  { id: 'sewing', unlockLevels: [19], recipes: [['cottonshirt', 19, { cottonfabric: 2 }], ['violetdress', 25, { cottonfabric: 2, indigo: 2 }], ['soothingpad', 45, { cottonfabric: 1, chamomile: 2 }]] },
  { id: 'cakeoven', unlockLevels: [21], recipes: [
    ['carrotcake', 21, { carrot: 2, wheat: 2, egg: 1, whitesugar: 1 }], ['creamcake', 23, { cream: 2, wheat: 2, egg: 1, whitesugar: 1 }], ['redberrycake', 23, { raspberry: 2, cream: 1, wheat: 2, egg: 1 }],
    ['cheesecake', 24, { cheese: 2, wheat: 2, egg: 1 }], ['blueberrycheesecake', 31, { cheese: 2, blueberry: 2, wheat: 2 }], ['strawberrycake', 35, { strawberry: 2, cream: 1, wheat: 2, egg: 1 }],
    ['chocolatecake', 36, { cacao: 2, cream: 1, wheat: 2, egg: 1 }], ['potatofetacake', 38, { potato: 2, goatcheese: 1, egg: 1 }], ['honeyapplecake', 42, { honey: 1, apple: 2, wheat: 2, egg: 1 }],
  ] },
  { id: 'smelter', unlockLevels: [24], recipes: [['silverbar', 24, { silverore: 2 }], ['goldbar', 25, { goldore: 2 }], ['platinumbar', 25, { platinumore: 2 }], ['refinedcoal', 33, { coal: 3 }], ['ironbar', 34, { ironore: 2 }]] },
  { id: 'juicepress', unlockLevels: [26], recipes: [
    ['carrotjuice', 26, { carrot: 3 }], ['applejuice', 28, { apple: 3 }], ['cherryjuice', 30, { cherry: 3 }], ['tomatojuice', 31, { tomato: 3 }], ['berryjuice', 31, { raspberry: 1, blackberry: 1, blueberry: 1 }],
  ] },
  { id: 'lureworkbench', unlockLevels: [27], recipes: [['fishinglure', 27, { wool: 1, wheat: 2 }, 300]] },
  { id: 'icecream', unlockLevels: [29], recipes: [
    ['vanillaicecream', 29, { milk: 2, cream: 1, egg: 1 }], ['cherrypopsicle', 33, { cherry: 2, whitesugar: 1 }], ['strawberryicecream', 34, { milk: 2, cream: 1, strawberry: 2 }],
    ['chocolateicecream', 39, { milk: 2, cream: 1, cacao: 1 }], ['sesameicecream', 50, { milk: 2, cream: 1, sesame: 2 }],
  ] },
  { id: 'netmaker', unlockLevels: [30], recipes: [['fishingnet', 30, { wool: 2, cottonfabric: 1 }, 600]] },
  { id: 'kebab', unlockLevels: [32], recipes: [['lambdonerwrap', 32, { lambskewer: 1, bread: 1, tomato: 1 }]] },
  { id: 'jammaker', unlockLevels: [35], recipes: [
    ['applejam', 35, { apple: 3, whitesugar: 1 }], ['raspberryjam', 36, { raspberry: 3, whitesugar: 1 }], ['blackberryjam', 37, { blackberry: 3, whitesugar: 1 }], ['cherryjam', 38, { cherry: 3, whitesugar: 1 }], ['strawberryjam', 50, { strawberry: 3, whitesugar: 1 }],
  ] },
  { id: 'jeweler', unlockLevels: [38], recipes: [['bracelet', 38, { silverbar: 1, goldbar: 1 }], ['necklace', 39, { goldbar: 2, platinumbar: 1 }], ['diamondring', 40, { platinumbar: 2, goldbar: 1 }], ['ironbracelet', 41, { ironbar: 2 }]] },
  { id: 'honeyextractor', unlockLevels: [39], recipes: [['honey', 39, { honeycomb: 2 }], ['beeswax', 48, { honeycomb: 2 }]] },
  { id: 'coffeekiosk', unlockLevels: [42], recipes: [
    ['espresso', 42, { coffeebean: 2 }], ['caffelatte', 43, { coffeebean: 2, milk: 1 }], ['caffemocha', 45, { coffeebean: 2, milk: 1, cacao: 1 }],
    ['raspberrymocha', 46, { coffeebean: 2, milk: 1, cacao: 1, raspberry: 2 }], ['hotchocolate', 47, { cacao: 2, milk: 2, whitesugar: 1 }],
  ] },
  { id: 'soupkitchen', unlockLevels: [46], recipes: [['lobstersoup', 46, { lobstertail: 1, cream: 1, tomato: 1 }], ['lambsoup', 46, { lambskewer: 1, carrot: 2, potato: 1 }], ['tomatosoup', 47, { tomato: 3, cream: 1 }], ['pumpkinsoup', 49, { pumpkin: 2, cream: 1 }]] },
  { id: 'candlemaker', unlockLevels: [48], recipes: [['strawberrycandle', 48, { beeswax: 2, strawberry: 2 }]] },
  { id: 'flowershop', unlockLevels: [49], recipes: [['rusticbouquet', 49, { chamomile: 2, nectar: 1 }]] },
];

/** Building price by unlock level (the first three keep their playtested prices). */
const buildingCost = (lvl: number): number => Math.round(20 + 1.8 * lvl * lvl);

export const MACHINES: Record<string, MachineConfig> = {};
export const RECIPES: Record<string, RecipeConfig> = {};
for (const m of MACHINE_DEFS) {
  MACHINES[m.id] = { id: m.id, unlockLevels: m.unlockLevels, cost: m.cost ?? buildingCost(m.unlockLevels[0]), recipes: m.recipes.map((r) => r[0]), footprint: m.footprint ?? 2 };
  for (const [output, unlockLevel, inputs, seconds, outputQty] of m.recipes) {
    RECIPES[output] = { id: output, machine: m.id, inputs: Object.entries(inputs).map(([item, qty]) => ({ item, qty })), output, outputQty: outputQty ?? 1, seconds: seconds ?? recipeSeconds(unlockLevel), unlockLevel };
  }
}

/** Production slots: a machine is bought with 1; each extra slot costs MACHINE_SLOT_BASE × 3^(bought so far). */
export const MACHINE_SLOT_BASE = 50;
export const MACHINE_SLOTS_MAX = 6;
export const slotPrice = (slots: number): number => MACHINE_SLOT_BASE * 3 ** (slots - 1);

// ---------------------------------------------------------------------------
// Items: raw ones are listed with a value; crafted ones are worth their inputs × 1.5 (+ a little per level).

export const ITEMS: Record<string, ItemDef> = {};
const raw = (id: string, storage: ItemDef['storage'], value: number): void => { ITEMS[id] = { id, storage, value, exp: expFor(value) }; };
for (const c of Object.values(CROPS)) raw(c.id, 'silo', c.value);
raw('apple', 'barn', 33); raw('raspberry', 'barn', 36); raw('cherry', 'barn', 39); raw('blackberry', 'barn', 40); raw('blueberry', 'barn', 45);
raw('cacao', 'barn', 50); raw('nectar', 'barn', 45); raw('coffeebean', 'barn', 55);
raw('silverore', 'barn', 40); raw('goldore', 'barn', 60); raw('platinumore', 'barn', 90); raw('coal', 'barn', 25); raw('ironore', 'barn', 30);
raw('egg', 'barn', 10); raw('milk', 'barn', 27); raw('bacon', 'barn', 45); raw('wool', 'barn', 36); raw('lambskewer', 'barn', 75); raw('goatmilk', 'barn', 69);
raw('honeycomb', 'barn', 60); raw('fishfillet', 'barn', 50); raw('lobstertail', 'barn', 110); raw('duckfeather', 'barn', 90);
for (const m of ['nail', 'screw', 'bolt', 'tape']) raw(m, 'upgrade', 0);
// Crafted items, in recipe order (inputs are always earlier in the list or raw).
for (const m of MACHINE_DEFS) for (const [output, lvl, , , outQty] of m.recipes) {
  const r = RECIPES[output];
  const inputVal = r.inputs.reduce((n, x) => n + (ITEMS[x.item]?.value ?? 0) * x.qty, 0);
  const value = Math.ceil((inputVal * 1.5 + 2 * lvl) / (outQty ?? 1));
  ITEMS[output] = { id: output, storage: 'barn', value, exp: expFor(value) };
}
for (const r of Object.values(RECIPES)) for (const x of r.inputs) if (!ITEMS[x.item]) throw new Error(`recipe ${r.id}: unknown input ${x.item}`);
for (const a of Object.values(ANIMALS)) if (!ITEMS[a.feedItem] || (a.produceItem && !ITEMS[a.produceItem])) throw new Error(`animal ${a.id}: unknown item`);
for (const tr of Object.values(TREES)) for (const p of tr.produce) if (!ITEMS[p.item]) throw new Error(`tree ${tr.id}: unknown item ${p.item}`);

/** Is the item made / grown / collected somewhere the player has reached? (orders and visitors only ask for these) */
export function itemUnlockLevel(item: string): number {
  const c = CROPS[item];
  if (c) return c.unlockLevel;
  const r = RECIPES[item];
  if (r) return r.unlockLevel;
  for (const p of Object.values(PENS)) { const a = ANIMALS[p.animal]; if (a.produceItem === item) return p.unlockLevels[0]; }
  for (const tr of Object.values(TREES)) for (const p of tr.produce) if (p.item === item) return Math.max(tr.unlockLevel, p.unlockLevel ?? 0);
  return 999;
}

// ---------------------------------------------------------------------------
// Fields, storage, XP, level rewards

/** Six fields at the start, +3 at every odd level from 3 (sheet: 3, 5, 7 … 49) → 78 at level 49. */
export const PLOTS_START = 6;
export const maxPlots = (level: number): number => PLOTS_START + 3 * Math.max(0, Math.floor((Math.min(level, 50) - 1) / 2));
export const PLOTS_MAX = maxPlots(50);
export const plotCost = (owned: number): number => 15 + 5 * Math.max(0, owned - PLOTS_START);

export interface StorageUpgrade {
  tier: number;
  required: { item: string; qty: number }[];
  capacityAfter: number;
}

/** 12 upgrades each: materials cost 1 star apiece, the whole ladder of both storages ≈ 120 stars (50 levels × 3★). */
const STORAGE_CAPS = [10, 25, 40, 60, 80, 100, 125, 150, 180, 210, 250, 300, 350];
const ladder = (a: string, b: string): StorageUpgrade[] =>
  STORAGE_CAPS.slice(1).map((cap, i) => ({ tier: i + 2, required: [{ item: a, qty: Math.ceil((i + 1) / 3) }, { item: b, qty: Math.ceil((i + 1) / 3) }], capacityAfter: cap }));
export const STORAGE_UPGRADES: Record<StorageType, StorageUpgrade[]> = { barn: ladder('nail', 'screw'), silo: ladder('bolt', 'tape') };
export const STORAGE_START: Record<StorageType, number> = { silo: STORAGE_CAPS[0], barn: STORAGE_CAPS[0] };

/** Upgrade Shop: every material costs stars (1 star each). */
export const MATERIAL_PRICE: Record<string, number> = { nail: 1, screw: 1, bolt: 1, tape: 1 };
export const MATERIALS: string[] = ['nail', 'screw', 'bolt', 'tape'];

/** Cumulative XP needed to reach farm level n (index = level), from the sheet; 58 000 would be level 51. */
export const XP_THRESHOLDS = [0, 0, 15, 25, 40, 50, 200, 370, 500, 790, 1000, 1240, 1480, 1720, 1960, 2200, 2600, 3000, 3400, 3800, 4200,
  4860, 5520, 6180, 6840, 7500, 8400, 9300, 10200, 11100, 12000, 13400, 14800, 16200, 17600, 19000, 21000, 23000, 25000, 27000, 29000,
  31600, 34200, 36800, 39400, 42000, 45200, 48400, 51600, 54800, 58000];
export const MAX_LEVEL = 50;
export function farmLevelForXp(xp: number): number {
  let lvl = 1;
  for (let i = 2; i <= MAX_LEVEL; i++) if (xp >= XP_THRESHOLDS[i]) lvl = i;
  return lvl;
}
export function xpForNextLevel(level: number): number | null {
  return level < MAX_LEVEL ? XP_THRESHOLDS[level + 1] : null;
}

/** Gems and coins handed out on reaching a level (sheet column "Currency addition"). */
export const LEVEL_REWARDS: Record<number, { gem: number; coin: number }> = {
  2: { gem: 1, coin: 100 }, 4: { gem: 1, coin: 100 }, 6: { gem: 1, coin: 100 }, 8: { gem: 1, coin: 100 }, 10: { gem: 5, coin: 500 },
  12: { gem: 2, coin: 1000 }, 14: { gem: 2, coin: 1000 }, 16: { gem: 2, coin: 1000 }, 18: { gem: 2, coin: 1000 }, 20: { gem: 10, coin: 2000 },
  22: { gem: 3, coin: 2000 }, 24: { gem: 3, coin: 2000 }, 26: { gem: 3, coin: 2000 }, 28: { gem: 3, coin: 2000 }, 30: { gem: 10, coin: 0 },
  32: { gem: 4, coin: 0 }, 34: { gem: 4, coin: 0 }, 36: { gem: 4, coin: 0 }, 38: { gem: 4, coin: 0 }, 40: { gem: 10, coin: 0 },
};

/** Item gifts that come with a level (feeds the sheet lists with "(xN)"; crop seeds come from CROPS.gift). */
export const LEVEL_GIFTS: Record<number, { item: string; qty: number }[]> = {
  1: [{ item: 'feed', qty: 3 }],
  6: [{ item: 'cowfeed', qty: 5 }],
};

/** Features that open at a level (i18n key `feat_<id>`); `lesson` names the guided tutorial that starts there. */
export type FeatureId = 'visitor' | 'truck' | 'achievements' | 'truck_slot' | 'mine' | 'fishing' | 'beekeeping' | 'ducks';
export const LEVEL_FEATURES: Record<number, FeatureId[]> = {
  2: ['visitor'], 4: ['truck'], 6: ['achievements'], 8: ['truck_slot'], 12: ['truck_slot'], 17: ['truck_slot'], 22: ['truck_slot'],
  24: ['mine'], 27: ['fishing', 'truck_slot'], 32: ['truck_slot'], 39: ['beekeeping'], 50: ['ducks'],
};
export const LEVEL_LESSONS: Record<number, string> = { 2: 'L2', 3: 'L3', 4: 'L4', 6: 'L6' };

// ---------------------------------------------------------------------------
// Truck orders (a board of several orders) and visitors (one request at a time).

export const TRUCK_UNLOCK = 4;
/** Order slots on the truck board: 3 at level 4, one more at each `truck_slot` feature → 9 at level 32. */
export function orderSlots(level: number): number {
  if (level < TRUCK_UNLOCK) return 0;
  let n = 3;
  for (const [lvl, feats] of Object.entries(LEVEL_FEATURES)) if (Number(lvl) <= level && feats.includes('truck_slot')) n++;
  return n;
}
/** A deleted order's slot refills after this long: 5 min, 10 from level 10, 20 from 20, 30 from 30. */
export const orderResetSec = (level: number): number => (level < 10 ? 300 : level < 20 ? 600 : level < 30 ? 1200 : 1800);
export const ORDER_BONUS = 1.3; // orders pay value × bonus, rounded
export const ORDER_EXP_BONUS = 1.5; // and XP = items' XP × bonus
/** Items per order and units per item grow with the level. */
export const orderShape = (level: number): { items: number; maxQty: number } => ({ items: level < 8 ? 2 : level < 20 ? 3 : 4, maxQty: level < 6 ? 3 : level < 15 ? 4 : level < 30 ? 5 : 6 });

export const VISITOR_UNLOCK = 2;
/** A new visitor walks up this long after the last one left (fast during the lesson). */
export const VISITOR_INTERVAL_SEC = 150;
export const VISITOR_BONUS = 1.5;
export const VISITOR_EXP = 10; // the sheet: "+10 experience points"

// ---------------------------------------------------------------------------
// Achievements (level 6): cumulative stats, three tiers each, claimed at the farmhouse.

export type StatKey = 'visitors' | 'orders' | 'harvests' | 'animals' | 'crafted' | 'trees' | 'matches' | 'stars';
export interface AchievementDef { id: string; stat: StatKey; tiers: { need: number; gem: number; exp: number }[] }
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'visitors', stat: 'visitors', tiers: [{ need: 10, gem: 5, exp: 30 }, { need: 50, gem: 10, exp: 100 }, { need: 500, gem: 35, exp: 1000 }] },
  { id: 'orders', stat: 'orders', tiers: [{ need: 20, gem: 5, exp: 50 }, { need: 100, gem: 15, exp: 300 }, { need: 1000, gem: 50, exp: 2000 }] },
  { id: 'harvests', stat: 'harvests', tiers: [{ need: 50, gem: 3, exp: 30 }, { need: 500, gem: 10, exp: 300 }, { need: 5000, gem: 40, exp: 3000 }] },
  { id: 'animals', stat: 'animals', tiers: [{ need: 50, gem: 3, exp: 40 }, { need: 500, gem: 10, exp: 400 }, { need: 5000, gem: 40, exp: 4000 }] },
  { id: 'crafted', stat: 'crafted', tiers: [{ need: 50, gem: 5, exp: 60 }, { need: 500, gem: 15, exp: 600 }, { need: 5000, gem: 50, exp: 6000 }] },
  { id: 'trees', stat: 'trees', tiers: [{ need: 20, gem: 3, exp: 50 }, { need: 200, gem: 10, exp: 500 }, { need: 2000, gem: 40, exp: 5000 }] },
  { id: 'matches', stat: 'matches', tiers: [{ need: 10, gem: 5, exp: 50 }, { need: 25, gem: 15, exp: 300 }, { need: 50, gem: 50, exp: 2000 }] },
  { id: 'stars', stat: 'stars', tiers: [{ need: 30, gem: 5, exp: 50 }, { need: 90, gem: 15, exp: 300 }, { need: 150, gem: 50, exp: 2000 }] },
];
export const ACHIEVEMENTS_UNLOCK = 6;

// ---------------------------------------------------------------------------
// Farm map. The 2.5D lawn is WORLD_SCALE× the on-screen farm area in each direction;
// the player pans it by dragging. Buildings and plots sit on an isometric grid of
// 52×26 px diamond cells and can be moved by the player (long press → drag → ✓ / ✕).

export const WORLD_SCALE = 5;
/** Long press that lifts a building / plot, in ms. */
export const MOVE_HOLD_MS = 500;
/** Footprint (n×n grid cells) of the fixed objects; pens, machines and trees carry their own. */
export const FOOTPRINT: Record<string, number> = { barn: 3, silo: 2, house: 4, plot: 2, tree: 2 };
/** Starting layout: the front cell (a, b) of each footprint (a runs right/back, b left/back). Bought things are placed by the player. */
export const DEFAULT_LAYOUT: Record<string, { a: number; b: number }> = {
  house: { a: 15, b: 15 }, barn: { a: 12, b: 8 }, silo: { a: 16, b: 11 },
  plot0: { a: 0, b: 0 }, plot1: { a: 2, b: 0 }, plot2: { a: 4, b: 0 },
  plot3: { a: 0, b: 2 }, plot4: { a: 2, b: 2 }, plot5: { a: 4, b: 2 },
};

/** Chickens the level-1 walkthrough has the player buy. */
export const TUTORIAL_CHICKENS = 3;

/** 6 wheat sow all six fields; their 12-wheat harvest overflows the 10-slot silo on purpose (→ Match-3 → upgrade). */
export const TUTORIAL_START = { coin: 500, starterWheat: 6 };
/** Every timer runs this fast while a guided lesson is on. */
export const TUTORIAL_SECONDS = 8;

// Gems: the premium currency. They buy a crop the player is out of, and finish
// any timer (a growing field, a laying chicken, a machine batch) at once.
export const GEM_START = 20;
/** Gems for one unit of a crop when the silo has none. */
export const CROP_GEM_PRICE = 1;
/** Seconds of waiting one gem skips. */
export const GEM_SECONDS = 120;
/** Gems to skip `ms` of waiting: 1 per GEM_SECONDS, rounded up, at least 1. */
export const gemsFor = (ms: number): number => Math.max(1, Math.ceil(ms / 1000 / GEM_SECONDS));

// ---------------------------------------------------------------------------
// What a level unlocks, derived from the data above (for the level-up popup and LEVELS-FARM.md).

export interface Unlock { kind: 'crop' | 'tree' | 'pen' | 'animal' | 'machine' | 'product' | 'feature' | 'fields'; id: string; qty?: number }
export function unlocksAt(level: number): Unlock[] {
  const out: Unlock[] = [];
  for (const f of LEVEL_FEATURES[level] ?? []) out.push({ kind: 'feature', id: f });
  const fields = maxPlots(level) - maxPlots(level - 1);
  if (level > 1 && fields > 0) out.push({ kind: 'fields', id: 'plot', qty: fields });
  for (const c of Object.values(CROPS)) if (c.unlockLevel === level) out.push({ kind: 'crop', id: c.id, qty: c.gift });
  for (const tr of Object.values(TREES)) if (tr.unlockLevel === level) out.push({ kind: 'tree', id: tr.id });
  for (const p of Object.values(PENS)) {
    const k = p.unlockLevels.indexOf(level);
    if (k === 0) { out.push({ kind: 'pen', id: p.id }); if (!p.autoFill) out.push({ kind: 'animal', id: p.animal }); }
    else if (k > 0) out.push({ kind: 'pen', id: p.id, qty: k + 1 });
  }
  for (const m of Object.values(MACHINES)) {
    const k = m.unlockLevels.indexOf(level);
    if (k >= 0) out.push({ kind: 'machine', id: m.id, qty: k > 0 ? k + 1 : undefined });
  }
  for (const r of Object.values(RECIPES)) if (r.unlockLevel === level) out.push({ kind: 'product', id: r.output });
  for (const p of Object.values(PENS)) if (p.unlockLevels[0] === level) { const a = ANIMALS[p.animal]; if (a.produceItem) out.push({ kind: 'product', id: a.produceItem }); }
  // A gifted item that is also unlocked here shows once, with its gift count.
  for (const g of LEVEL_GIFTS[level] ?? []) {
    const dup = out.find((u) => u.kind === 'product' && u.id === g.item);
    if (dup) dup.qty = g.qty; else out.push({ kind: 'product', id: g.item, qty: g.qty });
  }
  return out;
}
