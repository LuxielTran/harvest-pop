// Game state and the services that mutate it: wallet, inventory, storage,
// farm objects (fields, pens, machines, trees), truck orders, visitors,
// achievements, match stars and storage upgrades. Every mutation follows
// validate → debit/credit → save; nothing here touches the DOM.
//
// The farm is generic over farm-data.ts: a pen holds animals of its type, a
// machine runs the recipes of its type, a tree regrows its produce.

import FalconSDK from '@falcongames/game-client-sdk';
import {
  ACHIEVEMENTS, ACHIEVEMENTS_UNLOCK, ANIMALS, BOOST_SECONDS, BOOST_SPEED, BOOST_UNLOCK, BOOSTERS, CROPS, CROP_GEM_PRICE, DEFAULT_LAYOUT, GEM_START, ITEMS, LEVEL_GIFTS, LEVEL_REWARDS, MACHINES,
  MACHINE_SLOTS_MAX, MATCH_LEVELS, MATERIAL_PRICE, ORDER_BONUS, ORDER_EXP_BONUS, PENS, PLOTS_MAX, PLOTS_START, RECIPES, REPLAY_COINS, REVIVE_PRICE,
  STORAGE_START, STORAGE_UPGRADES, TREES, TRUCK_UNLOCK, TUTORIAL_SECONDS, TUTORIAL_START, VISITOR_BONUS, VISITOR_EXP, VISITOR_INTERVAL_SEC, VISITOR_UNLOCK,
  XP_THRESHOLDS, farmLevelForXp, gemsFor, itemUnlockLevel, maxPlots, orderResetSec, orderShape, orderSlots, plotCost, slotPrice, winCoins,
  type StatKey, type StorageType, type StorageUpgrade,
} from './config';

export type PlotStatus = 'empty' | 'growing' | 'ready';
export interface PlotState { status: PlotStatus; crop: string | null; readyAt: number; }
/** An animal waits for feed (hungry), eats while it produces (feeding), then has produce (ready). A pet naps instead and wakes up hungry. */
export type AnimalStatus = 'hungry' | 'feeding' | 'ready';
export interface AnimalState { status: AnimalStatus; readyAt: number; }
export interface PenState { type: string; animals: AnimalState[]; }
/** One batch in a machine. Batches run one after another in queue order; a finished one waits to be collected. */
export interface MachineJob { recipe: string; readyAt: number; }
/** `slots` = how many batches (running, waiting or finished) the machine can hold. */
export interface MachineState { type: string; slots: number; queue: MachineJob[]; }
/** A tree is ready once `readyAt` has passed; harvesting starts the next growth. */
export interface TreeState { type: string; readyAt: number; }
export interface StorageState { tier: number; cap: number; items: Record<string, number>; }
export interface OrderState { id: number; items: { item: string; qty: number }[]; coin: number; exp: number; }
/** A deleted order's slot: refills at `at`, back in position `pos` on the board. */
export interface OrderCooldown { at: number; pos: number; }
/** The visitor at the gate: one item, paid above value, +VISITOR_EXP. `look` picks the character art. */
export interface VisitorState { id: number; look: number; item: string; qty: number; coin: number; exp: number; }

export interface SaveData {
  v: number;
  wallet: { coin: number; star: number; gem: number };
  progress: { xp: number };
  storage: Record<StorageType, StorageState>;
  upgradeWallet: Record<string, number>;
  match: { bestStars: Record<string, number> };
  /** Booster units owned, by booster key. */
  boosters: Record<string, number>;
  /** First-time match tutorials already shown (key → 1). */
  tips: Record<string, number>;
  /** `stepId` = the running lesson step ('IDLE' when none); `lessons` = guided lessons already finished. */
  tutorial: { stepId: string; seedsGranted: boolean; levelGranted: boolean; bonusStars: number; lessons: Record<string, number> };
  farm: {
    plots: PlotState[];
    pens: PenState[];
    machines: MachineState[];
    trees: TreeState[];
    orders: OrderState[];
    /** Slots emptied by a delete: when each one refills, and where on the board it sits. */
    orderCooldowns: OrderCooldown[];
    orderSeq: number;
    visitor: VisitorState | null;
    nextVisitorAt: number;
    /** Where the player moved buildings / plots (front grid cell); missing keys use DEFAULT_LAYOUT. */
    layout: Record<string, { a: number; b: number }>;
  };
  /** Lifetime counters behind the achievements. */
  stats: Record<string, number>;
  /** Achievement id → tiers already claimed. */
  achievements: Record<string, number>;
  /** Shop offers the player has looked at (offer key → 1); unseen unlocked ones carry a "new" badge. */
  shopSeen: Record<string, number>;
  settings: { sound: number; music: number; haptic: number };
  /** The rewarded-ad farm boost: on until `until`; farm timers have been sped up through `at`. */
  boost: { until: number; at: number };
  lastSeen: number;
}

const SAVE_VERSION = 2;

export type Listener = () => void;
const listeners = new Set<Listener>();
export function onChange(fn: Listener): () => void { listeners.add(fn); return () => listeners.delete(fn); }
function notify(): void { for (const fn of [...listeners]) fn(); }

export type GameEvent =
  | { type: 'toast'; text: string; kind?: 'ok' | 'warn' }
  | { type: 'collectBlocked'; storage: StorageType }
  | { type: 'harvested'; item: string; qty: number }
  | { type: 'collected'; item: string; qty: number }
  | { type: 'coin'; delta: number }
  | { type: 'xp'; delta: number }
  | { type: 'levelUp'; level: number }
  | { type: 'star'; delta: number }
  | { type: 'gem'; delta: number }
  | { type: 'storageUpgraded'; storage: StorageType }
  | { type: 'visitor' }
  | { type: 'action'; action: string; target?: string };
const eventListeners = new Set<(e: GameEvent) => void>();
export function onEvent(fn: (e: GameEvent) => void): () => void { eventListeners.add(fn); return () => eventListeners.delete(fn); }
export function emit(e: GameEvent): void { for (const fn of [...eventListeners]) fn(e); }

export const now = (): number => Date.now();

function freshSave(): SaveData {
  return {
    v: SAVE_VERSION,
    wallet: { coin: TUTORIAL_START.coin, star: 0, gem: GEM_START },
    progress: { xp: 0 },
    storage: {
      silo: { tier: 1, cap: STORAGE_START.silo, items: {} },
      barn: { tier: 1, cap: STORAGE_START.barn, items: {} },
    },
    upgradeWallet: {},
    match: { bestStars: {} },
    boosters: {},
    tips: {},
    tutorial: { stepId: 'L1:PAN', seedsGranted: false, levelGranted: false, bonusStars: 0, lessons: {} },
    farm: {
      plots: Array.from({ length: PLOTS_START }, () => ({ status: 'empty' as PlotStatus, crop: null, readyAt: 0 })),
      pens: [],
      machines: [],
      trees: [],
      orders: [],
      orderCooldowns: [],
      orderSeq: 1,
      visitor: null,
      nextVisitorAt: 0,
      layout: {},
    },
    stats: {},
    achievements: {},
    shopSeen: {},
    settings: { sound: 1, music: 1, haptic: 1 },
    boost: { until: 0, at: 0 },
    lastSeen: now(),
  };
}

export let S: SaveData = freshSave();

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function numMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v))) if (typeof n === 'number' && n > 0) out[k] = Math.floor(n);
  return out;
}

const animalState = (c: unknown): AnimalState => {
  const o = obj(c);
  const status = ['hungry', 'feeding', 'ready'].includes(o.status) ? (o.status as AnimalStatus) : 'hungry';
  return { status, readyAt: num(o.readyAt, 0) };
};

/**
 * Merge a (possibly partial) save into a fresh one, type-checking every field.
 * Saves from before the 50-level farm (no `v`) restart at the walkthrough: their
 * objects, levels and tutorial steps no longer exist.
 */
export function loadFromSave(raw: Record<string, any>): void {
  const f = freshSave();
  const d = obj(raw);
  const hp = obj(d.hp);
  if (!d.hp || num(hp.v, 0) !== SAVE_VERSION) { S = f; return; }
  const w = obj(hp.wallet);
  f.wallet.coin = Math.max(0, num(w.coin, f.wallet.coin));
  f.wallet.star = Math.max(0, num(w.star, 0));
  f.wallet.gem = Math.max(0, num(w.gem, GEM_START));
  f.progress.xp = Math.max(0, num(obj(hp.progress).xp, 0));
  for (const t of ['silo', 'barn'] as StorageType[]) {
    const st = obj(obj(hp.storage)[t]);
    f.storage[t].tier = Math.max(1, num(st.tier, 1));
    f.storage[t].items = numMap(st.items);
    for (const k of Object.keys(f.storage[t].items)) if (!ITEMS[k] || ITEMS[k].storage !== t) delete f.storage[t].items[k];
    f.storage[t].cap = Math.max(num(st.cap, STORAGE_START[t]), usedOf(f.storage[t]));
  }
  f.upgradeWallet = numMap(hp.upgradeWallet);
  f.match.bestStars = numMap(obj(hp.match).bestStars);
  f.boosters = numMap(hp.boosters);
  f.tips = numMap(hp.tips);
  const tut = obj(hp.tutorial);
  f.tutorial.stepId = typeof tut.stepId === 'string' ? tut.stepId : 'L1:PAN';
  f.tutorial.levelGranted = tut.levelGranted === true;
  f.tutorial.seedsGranted = tut.seedsGranted === true;
  f.tutorial.bonusStars = num(tut.bonusStars, 0);
  f.tutorial.lessons = numMap(tut.lessons);
  const farm = obj(hp.farm);
  arr(farm.plots).slice(0, PLOTS_MAX).forEach((p, i) => {
    const o = obj(p);
    const status = ['growing', 'ready'].includes(o.status) ? (o.status as PlotStatus) : 'empty';
    const crop = typeof o.crop === 'string' && CROPS[o.crop] ? o.crop : null;
    f.farm.plots[i] = status !== 'empty' && crop ? { status, crop, readyAt: num(o.readyAt, 0) } : { status: 'empty', crop: null, readyAt: 0 };
  });
  for (const p of arr(farm.pens)) {
    const o = obj(p);
    const cfg = PENS[o.type];
    if (!cfg) continue;
    f.farm.pens.push({ type: cfg.id, animals: arr(o.animals).slice(0, cfg.capacity).map(animalState) });
  }
  for (const m of arr(farm.machines)) {
    const o = obj(m);
    const cfg = MACHINES[o.type];
    if (!cfg) continue;
    const queue: MachineJob[] = arr(o.queue).map((j) => obj(j)).filter((j) => RECIPES[j.recipe]?.machine === cfg.id).map((j) => ({ recipe: j.recipe as string, readyAt: num(j.readyAt, 0) }));
    const slots = Math.max(1, Math.min(MACHINE_SLOTS_MAX, Math.floor(num(o.slots, 1))));
    f.farm.machines.push({ type: cfg.id, slots: Math.max(slots, queue.length), queue });
  }
  for (const tr of arr(farm.trees)) {
    const o = obj(tr);
    if (TREES[o.type]) f.farm.trees.push({ type: o.type, readyAt: num(o.readyAt, 0) });
  }
  f.farm.orders = arr(farm.orders).map((o) => {
    const x = obj(o);
    const items = arr(x.items).map((it) => ({ item: String(obj(it).item), qty: Math.max(1, num(obj(it).qty, 1)) })).filter((it) => ITEMS[it.item]);
    return { id: num(x.id, 0), items, coin: Math.max(0, num(x.coin, 0)), exp: Math.max(0, num(x.exp, 0)) };
  }).filter((o) => o.items.length > 0);
  f.farm.orderCooldowns = arr(farm.orderCooldowns).map((x, i) => (typeof x === 'number' ? { at: x, pos: i } : { at: num(obj(x).at, 0), pos: num(obj(x).pos, i) })).filter((x) => x.at > 0);
  // The board never holds more than the level's slots (older builds could leave extras behind).
  const slotsNow = orderSlots(farmLevelForXp(f.progress.xp));
  f.farm.orders = f.farm.orders.slice(0, slotsNow);
  f.farm.orderCooldowns = f.farm.orderCooldowns.slice(0, Math.max(0, slotsNow - f.farm.orders.length));
  f.farm.orderSeq = Math.max(1, num(farm.orderSeq, 1));
  const v = obj(farm.visitor);
  if (typeof v.item === 'string' && ITEMS[v.item]) f.farm.visitor = { id: num(v.id, 1), look: num(v.look, 0), item: v.item, qty: Math.max(1, num(v.qty, 1)), coin: num(v.coin, 0), exp: num(v.exp, VISITOR_EXP) };
  f.farm.nextVisitorAt = num(farm.nextVisitorAt, 0);
  for (const [key, val] of Object.entries(obj(farm.layout))) {
    const o = obj(val);
    if (/^(barn|silo|house|plot\d+|pen\d+|mach\d+|tree\d+)$/.test(key) && Number.isInteger(o.a) && Number.isInteger(o.b)) f.farm.layout[key] = { a: o.a, b: o.b };
  }
  f.stats = numMap(hp.stats);
  f.achievements = numMap(hp.achievements);
  f.shopSeen = numMap(hp.shopSeen);
  const set = obj(hp.settings);
  f.settings = { sound: num(set.sound, 1), music: num(set.music, 1), haptic: num(set.haptic, 1) };
  const boost = obj(hp.boost);
  f.boost = { until: num(boost.until, 0), at: num(boost.at, 0) };
  f.lastSeen = num(hp.lastSeen, now());
  S = f;
  guardClock();
}

/** Timers use wall-clock timestamps; if the clock went backwards, keep remaining times the same. */
function guardClock(): void {
  const t = now();
  if (t < S.lastSeen - 5000) {
    const shift = t - S.lastSeen;
    for (const p of S.farm.plots) if (p.readyAt) p.readyAt += shift;
    for (const pen of S.farm.pens) for (const c of pen.animals) if (c.readyAt) c.readyAt += shift;
    for (const m of S.farm.machines) for (const j of m.queue) j.readyAt += shift;
    for (const tr of S.farm.trees) if (tr.readyAt) tr.readyAt += shift;
    if (S.farm.nextVisitorAt) S.farm.nextVisitorAt += shift;
    for (const c of S.farm.orderCooldowns) c.at += shift;
    if (S.boost.until) { S.boost.until += shift; S.boost.at += shift; }
  }
  S.lastSeen = t;
}

export function save(): void {
  S.lastSeen = now();
  try {
    // `coins` mirrors the wallet at the top level, the SDK's convention for the studio header.
    FalconSDK.userData.set({ hp: S, coins: S.wallet.coin, sound: S.settings.sound, music: S.settings.music, haptic: S.settings.haptic });
  } catch { /* the SDK never throws in practice; the next save resends everything */ }
  notify();
}

/** Reset to the tutorial start. Used by `?reset=1` and "Reset all game". */
export function resetAll(): void { S = freshSave(); save(); }

// ---------------------------------------------------------------------------
// Derived values

export const farmLevel = (): number => farmLevelForXp(S.progress.xp);
export function usedOf(st: StorageState): number { let n = 0; for (const q of Object.values(st.items)) n += q; return n; }
export const used = (t: StorageType): number => usedOf(S.storage[t]);
export const free = (t: StorageType): number => Math.max(0, S.storage[t].cap - used(t));
export const isFull = (t: StorageType): boolean => used(t) >= S.storage[t].cap;
export const count = (item: string): number => {
  const def = ITEMS[item];
  if (!def) return 0;
  if (def.storage === 'upgrade') return S.upgradeWallet[item] ?? 0;
  return S.storage[def.storage].items[item] ?? 0;
};
/** A guided lesson is running: actions outside it are refused and every timer runs fast. */
export const tutorialActive = (): boolean => S.tutorial.stepId !== 'IDLE' && S.tutorial.stepId !== 'COMPLETE';
export const isTutorialStep = (id: string): boolean => S.tutorial.stepId === id;
export const lessonDone = (id: string): boolean => S.tutorial.lessons[id] === 1;
export function nextUpgrade(t: StorageType): StorageUpgrade | null {
  return STORAGE_UPGRADES[t].find((u) => u.tier === S.storage[t].tier + 1) ?? null;
}
export function canAffordUpgrade(t: StorageType): boolean {
  const u = nextUpgrade(t);
  return !!u && u.required.every((r) => (S.upgradeWallet[r.item] ?? 0) >= r.qty);
}
export const stat = (key: StatKey): number => S.stats[key] ?? 0;
function bump(key: StatKey, n = 1): void { S.stats[key] = stat(key) + n; }

/** How many of a pen / machine type the player owns, and how many the farm level allows. */
export const pensOf = (type: string): number => S.farm.pens.filter((p) => p.type === type).length;
export const machinesOf = (type: string): number => S.farm.machines.filter((m) => m.type === type).length;
export const treesOf = (type: string): number => S.farm.trees.filter((t) => t.type === type).length;
export const allowedCount = (unlockLevels: number[], level = farmLevel()): number => unlockLevels.filter((l) => l <= level).length;

// ---------------------------------------------------------------------------
// Wallet & inventory primitives (no save; callers save once per transaction)

function addCoin(delta: number): void {
  S.wallet.coin = Math.max(0, S.wallet.coin + delta);
  emit({ type: 'coin', delta });
}
function addGems(delta: number): void {
  S.wallet.gem = Math.max(0, S.wallet.gem + delta);
  emit({ type: 'gem', delta });
}
function spendGems(n: number): boolean {
  if (S.wallet.gem < n) return false;
  addGems(-n);
  return true;
}
function addXp(delta: number): void {
  const before = farmLevel();
  S.progress.xp += delta;
  emit({ type: 'xp', delta });
  const after = farmLevel();
  for (let lvl = before + 1; lvl <= after; lvl++) {
    // A new level hands out its gems / coins, the seeds of the crops it unlocks and any listed gift.
    const r = LEVEL_REWARDS[lvl];
    if (r) { if (r.coin) addCoin(r.coin); if (r.gem) addGems(r.gem); }
    for (const c of Object.values(CROPS)) if (c.unlockLevel === lvl) addItem(c.id, c.gift);
    for (const g of LEVEL_GIFTS[lvl] ?? []) addItem(g.item, g.qty);
    emit({ type: 'levelUp', level: lvl });
  }
}
function addItem(item: string, qty: number): void {
  const def = ITEMS[item];
  if (def.storage === 'upgrade') { S.upgradeWallet[item] = (S.upgradeWallet[item] ?? 0) + qty; return; }
  const st = S.storage[def.storage];
  st.items[item] = (st.items[item] ?? 0) + qty;
  if (st.items[item] <= 0) delete st.items[item];
}
function roomFor(item: string, qty: number): boolean {
  const def = ITEMS[item];
  if (def.storage === 'upgrade') return true;
  return free(def.storage) >= qty;
}

// ---------------------------------------------------------------------------
// Timers

const secondsFor = (normal: number): number => (tutorialActive() ? Math.min(normal, TUTORIAL_SECONDS) : normal);
export const animalMs = (type: string): number => secondsFor(ANIMALS[type].produceSeconds) * 1000;
export const cropMs = (crop: string): number => secondsFor(CROPS[crop].growSeconds) * 1000;
export const recipeMs = (rid: string): number => secondsFor(RECIPES[rid].seconds) * 1000;
export const treeMs = (type: string): number => secondsFor(TREES[type].seconds) * 1000;

// ---------------------------------------------------------------------------
// Farm boost (rewarded ad): every farm timer runs ×BOOST_SPEED while it lasts.

/** The Boost button shows from BOOST_UNLOCK while the ads module is on; in a lesson, only in the steps that teach it. */
export const boostOffered = (): boolean =>
  FalconSDK.ads.enabled && farmLevel() >= BOOST_UNLOCK && (!tutorialActive() || S.tutorial.stepId.startsWith('L3:BOOST'));
export const boostLeft = (): number => Math.max(0, S.boost.until - now());

/** Start the boost after a watched ad; a boost still running is extended. */
export function startBoost(): void {
  catchUpBoost();
  const t = now();
  S.boost = { until: Math.max(t, S.boost.until) + BOOST_SECONDS * 1000, at: t };
  save();
}

/**
 * Credit the boosted time since the last call: pulling every running timer
 * (BOOST_SPEED − 1) × that span closer makes it run BOOST_SPEED× fast. A
 * machine queue moves as a whole, so its batches stay back to back. Time spent
 * away from the game inside the boost window counts too.
 */
function catchUpBoost(): void {
  const t = now();
  const end = Math.min(t, S.boost.until);
  const span = end - S.boost.at;
  if (span <= 0) return;
  S.boost.at = end;
  const pull = span * (BOOST_SPEED - 1);
  // A timer pulled past `end` just finishes at `end`, never in the past.
  const sooner = (readyAt: number): number => Math.max(end, readyAt - pull);
  for (const p of S.farm.plots) if (p.status === 'growing' && p.readyAt > end) p.readyAt = sooner(p.readyAt);
  for (const pen of S.farm.pens) for (const c of pen.animals) if (c.status === 'feeding' && c.readyAt > end) c.readyAt = sooner(c.readyAt);
  for (const m of S.farm.machines) for (const j of m.queue) if (j.readyAt > end) j.readyAt = sooner(j.readyAt);
  for (const tr of S.farm.trees) if (tr.readyAt > end) tr.readyAt = sooner(tr.readyAt);
}

/** Advance every timer to `now()`: growing → ready, feeding → ready (a pet wakes up hungry), a batch or a tree finishing, a visitor arriving. */
let lastTick = 0;
export function tick(): boolean {
  catchUpBoost();
  const t = now();
  let changed = false;
  for (const p of S.farm.plots) if (p.status === 'growing' && t >= p.readyAt) { p.status = 'ready'; changed = true; }
  for (const pen of S.farm.pens) {
    const pet = !ANIMALS[PENS[pen.type].animal].produceItem;
    for (const c of pen.animals) if (c.status === 'feeding' && t >= c.readyAt) { c.status = pet ? 'hungry' : 'ready'; c.readyAt = 0; changed = true; }
  }
  for (const m of S.farm.machines) for (const j of m.queue) if (j.readyAt > lastTick && j.readyAt <= t) changed = true;
  for (const tr of S.farm.trees) if (tr.readyAt > lastTick && tr.readyAt <= t) changed = true;
  lastTick = t;
  if (!S.farm.visitor && !tutorialActive() && farmLevel() >= VISITOR_UNLOCK && t >= S.farm.nextVisitorAt) { spawnVisitor(); changed = true; }
  // A cooldown that ran out, or a new slot from a level-up, gets its order right away.
  if (!tutorialActive() && (S.farm.orderCooldowns.some((x) => x.at <= t) || S.farm.orders.length + S.farm.orderCooldowns.length < orderSlots(farmLevel()))) { refillOrders(); changed = true; }
  if (changed) save();
  return changed;
}

// ---------------------------------------------------------------------------
// Farm actions. Each returns an error key ('' = ok) so the UI can toast it.

/** Front grid cell of a movable farm object (the player's layout, else the default; undefined if neither). */
export const layoutOf = (key: string): { a: number; b: number } | undefined => S.farm.layout[key] ?? DEFAULT_LAYOUT[key];

/** One more field; the UI places it first, then calls this on ✓. */
export function buyPlot(): string {
  if (S.farm.plots.length >= maxPlots(farmLevel())) return 'err_level';
  const price = plotCost(S.farm.plots.length);
  if (S.wallet.coin < price) return 'err_coin';
  addCoin(-price);
  S.farm.plots.push({ status: 'empty', crop: null, readyAt: 0 });
  emit({ type: 'action', action: 'buyPlot', target: String(S.farm.plots.length - 1) });
  save();
  return '';
}

/** Store a moved object's place (the UI has checked it is free). */
export function setLayout(key: string, a: number, b: number): void {
  S.farm.layout[key] = { a, b };
  emit({ type: 'action', action: 'move', target: key });
  save();
}

/** Sowing takes one unit of the crop from the silo; with none left nothing can be sown. */
export function plantCrop(i: number, crop: string): string {
  const p = S.farm.plots[i];
  const c = CROPS[crop];
  if (!p || !c || p.status !== 'empty') return 'err_state';
  if (c.unlockLevel > farmLevel()) return 'err_level';
  if (count(crop) <= 0) return 'err_seed';
  addItem(crop, -1);
  p.status = 'growing';
  p.crop = crop;
  p.readyAt = now() + cropMs(crop);
  emit({ type: 'action', action: 'plant', target: String(i) });
  save();
  return '';
}

export function harvest(i: number): string {
  const p = S.farm.plots[i];
  if (!p || p.status !== 'ready' || !p.crop) return 'err_state';
  const c = CROPS[p.crop];
  if (!roomFor(c.id, c.yieldQty)) { emit({ type: 'collectBlocked', storage: 'silo' }); return 'err_silo_full'; }
  addItem(c.id, c.yieldQty);
  addXp(ITEMS[c.id].exp);
  bump('harvests');
  p.status = 'empty';
  p.crop = null;
  p.readyAt = 0;
  emit({ type: 'harvested', item: c.id, qty: c.yieldQty });
  emit({ type: 'action', action: 'harvest', target: String(i) });
  save();
  return '';
}

// ---- Pens & animals ----

export function buyPen(type: string): string {
  const cfg = PENS[type];
  if (!cfg) return 'err_state';
  if (pensOf(type) >= allowedCount(cfg.unlockLevels)) return 'err_level';
  if (S.wallet.coin < cfg.cost) return 'err_coin';
  addCoin(-cfg.cost);
  const animals: AnimalState[] = cfg.autoFill ? Array.from({ length: cfg.capacity }, () => ({ status: 'hungry' as AnimalStatus, readyAt: 0 })) : [];
  S.farm.pens.push({ type, animals });
  emit({ type: 'action', action: 'buyPen', target: type });
  save();
  return '';
}

/** A pen of the animal's type with room, preferring the one asked for. */
export function penWithRoom(animal: string, prefer = -1): number {
  const ok = (i: number): boolean => { const p = S.farm.pens[i]; return !!p && PENS[p.type].animal === animal && p.animals.length < PENS[p.type].capacity; };
  if (ok(prefer)) return prefer;
  return S.farm.pens.findIndex((_, i) => ok(i));
}

export function buyAnimal(animal: string, penIndex = -1): string {
  const a = ANIMALS[animal];
  if (!a) return 'err_state';
  const idx = penWithRoom(animal, penIndex);
  if (idx < 0) return pensOf(penOfAnimal(animal)) ? 'err_pen_full' : 'err_need_pen';
  if (S.wallet.coin < a.cost) return 'err_coin';
  addCoin(-a.cost);
  S.farm.pens[idx].animals.push({ status: 'hungry', readyAt: 0 });
  emit({ type: 'action', action: 'buyAnimal', target: animal });
  save();
  return '';
}
export const penOfAnimal = (animal: string): string => Object.values(PENS).find((p) => p.animal === animal)?.id ?? '';

export function feedAnimal(penIndex: number, i: number): string {
  const pen = S.farm.pens[penIndex];
  const c = pen?.animals[i];
  if (!pen || !c || c.status !== 'hungry') return 'err_state';
  const a = ANIMALS[PENS[pen.type].animal];
  if (count(a.feedItem) < a.feedQty) return 'err_no_feed';
  addItem(a.feedItem, -a.feedQty);
  c.status = 'feeding';
  c.readyAt = now() + animalMs(a.id);
  if (!a.produceItem) { addXp(a.exp); bump('animals'); } // a pet: the treat is the reward
  emit({ type: 'action', action: 'feed', target: `${penIndex}:${i}` });
  save();
  return '';
}

export function collectAnimal(penIndex: number, i: number): string {
  const pen = S.farm.pens[penIndex];
  const c = pen?.animals[i];
  if (!pen || !c || c.status !== 'ready') return 'err_state';
  const a = ANIMALS[PENS[pen.type].animal];
  if (!a.produceItem) return 'err_state';
  if (!roomFor(a.produceItem, a.produceQty)) { emit({ type: 'collectBlocked', storage: 'barn' }); return 'err_barn_full'; }
  addItem(a.produceItem, a.produceQty);
  addXp(a.exp);
  bump('animals');
  c.status = 'hungry';
  c.readyAt = 0;
  emit({ type: 'collected', item: a.produceItem, qty: a.produceQty });
  emit({ type: 'action', action: 'collect', target: `${penIndex}:${i}` });
  save();
  return '';
}

// ---- Machines ----

export function buyMachine(type: string): string {
  const cfg = MACHINES[type];
  if (!cfg) return 'err_state';
  if (machinesOf(type) >= allowedCount(cfg.unlockLevels)) return 'err_level';
  if (S.wallet.coin < cfg.cost) return 'err_coin';
  addCoin(-cfg.cost);
  S.farm.machines.push({ type, slots: 1, queue: [] });
  emit({ type: 'action', action: 'buyMachine', target: type });
  save();
  return '';
}

/** Finished batches (front of the queue) and the one now running, if any. */
export function machineJobs(index: number): { done: MachineJob[]; running: MachineJob | null; waiting: MachineJob[] } {
  const q = S.farm.machines[index]?.queue ?? [];
  const t = now();
  const done = q.filter((j) => j.readyAt <= t);
  const pending = q.filter((j) => j.readyAt > t);
  return { done, running: pending[0] ?? null, waiting: pending.slice(1) };
}

/** Queue a batch: inputs are consumed now, it starts when the batch before it ends. */
export function startRecipe(index: number, recipeId: string): string {
  const m = S.farm.machines[index];
  const r = RECIPES[recipeId];
  if (!m || !r || r.machine !== m.type) return 'err_state';
  if (r.unlockLevel > farmLevel()) return 'err_level';
  if (m.queue.length >= m.slots) return 'err_slots';
  for (const inp of r.inputs) if (count(inp.item) < inp.qty) return 'err_inputs';
  for (const inp of r.inputs) addItem(inp.item, -inp.qty); // inputs are consumed atomically at start
  const last = m.queue[m.queue.length - 1];
  const start = Math.max(now(), last?.readyAt ?? 0);
  m.queue.push({ recipe: recipeId, readyAt: start + recipeMs(recipeId) });
  emit({ type: 'action', action: 'startRecipe', target: m.type });
  save();
  return '';
}

/** Collect every finished batch (in order) the barn has room for. Returns the items collected. */
export function collectOutput(index: number): { err: string; got: { item: string; qty: number }[] } {
  const m = S.farm.machines[index];
  const got: { item: string; qty: number }[] = [];
  if (!m) return { err: 'err_state', got };
  let err = '';
  while (m.queue.length && m.queue[0].readyAt <= now()) {
    const r = RECIPES[m.queue[0].recipe];
    if (!roomFor(r.output, r.outputQty)) { emit({ type: 'collectBlocked', storage: ITEMS[r.output].storage as StorageType }); err = 'err_barn_full'; break; }
    m.queue.shift();
    addItem(r.output, r.outputQty);
    addXp(ITEMS[r.output].exp * r.outputQty);
    bump('crafted');
    got.push({ item: r.output, qty: r.outputQty });
    emit({ type: 'collected', item: r.output, qty: r.outputQty });
  }
  if (!got.length) return { err: err || 'err_state', got };
  emit({ type: 'action', action: 'collectOutput', target: m.type });
  save();
  return { err: '', got };
}

/** Buy one more production slot: MACHINE_SLOT_BASE × 3^(slots − 1) coins. */
export function buySlot(index: number): string {
  const m = S.farm.machines[index];
  if (!m) return 'err_state';
  if (m.slots >= MACHINE_SLOTS_MAX) return 'err_max';
  const price = slotPrice(m.slots);
  if (S.wallet.coin < price) return 'err_coin';
  addCoin(-price);
  m.slots += 1;
  emit({ type: 'action', action: 'buySlot', target: m.type });
  save();
  return '';
}

// ---- Trees, bushes and the mine ----

export function buyTree(type: string): string {
  const cfg = TREES[type];
  if (!cfg) return 'err_state';
  if (cfg.unlockLevel > farmLevel()) return 'err_level';
  if (treesOf(type) >= cfg.max) return 'err_max';
  if (S.wallet.coin < cfg.cost) return 'err_coin';
  addCoin(-cfg.cost);
  S.farm.trees.push({ type, readyAt: now() + treeMs(type) });
  emit({ type: 'action', action: 'buyTree', target: type });
  save();
  return '';
}

export const treeReady = (i: number): boolean => !!S.farm.trees[i] && S.farm.trees[i].readyAt <= now();

let treeRng = 12345;
/** What this harvest gives: the tree's produce, or one of the mine's ores (weighted, level-gated). */
export function treeProduce(i: number): string {
  const cfg = TREES[S.farm.trees[i].type];
  const pool = cfg.produce.filter((p) => (p.unlockLevel ?? 0) <= farmLevel());
  const total = pool.reduce((n, p) => n + p.weight, 0);
  treeRng = (treeRng * 1664525 + 1013904223) >>> 0;
  let r = (treeRng / 4294967296) * total;
  for (const p of pool) { r -= p.weight; if (r <= 0) return p.item; }
  return pool[pool.length - 1].item;
}

export function harvestTree(i: number): { err: string; item: string; qty: number } {
  const tr = S.farm.trees[i];
  if (!tr || !treeReady(i)) return { err: 'err_state', item: '', qty: 0 };
  const cfg = TREES[tr.type];
  const item = treeProduce(i);
  if (!roomFor(item, cfg.produceQty)) { emit({ type: 'collectBlocked', storage: ITEMS[item].storage as StorageType }); return { err: 'err_barn_full', item, qty: 0 }; }
  addItem(item, cfg.produceQty);
  addXp(ITEMS[item].exp * cfg.produceQty);
  bump('trees');
  tr.readyAt = now() + treeMs(tr.type);
  emit({ type: 'collected', item, qty: cfg.produceQty });
  emit({ type: 'action', action: 'harvestTree', target: tr.type });
  save();
  return { err: '', item, qty: cfg.produceQty };
}

// ---------------------------------------------------------------------------
// Truck orders: a board of `orderSlots(level)` orders, the main Coin source.

let orderRng = 0;
function rand(): number { orderRng = (orderRng * 1664525 + 1013904223) >>> 0; return orderRng / 4294967296; }
const pick = <T>(list: T[]): T => list[Math.floor(rand() * list.length)];

/** Items a visitor or the truck may ask for: sellable things the farm can already produce. */
function askable(): string[] {
  const lvl = farmLevel();
  return Object.values(ITEMS).filter((it) => it.value > 0 && it.storage !== 'upgrade' && itemUnlockLevel(it.id) <= lvl).map((it) => it.id);
}

function makeOrder(items: { item: string; qty: number }[], bonus: number, expBonus: number): OrderState {
  const value = items.reduce((n, x) => n + ITEMS[x.item].value * x.qty, 0);
  const exp = items.reduce((n, x) => n + ITEMS[x.item].exp * x.qty, 0);
  return { id: S.farm.orderSeq++, items, coin: Math.max(1, Math.round(value * bonus)), exp: Math.max(1, Math.round(exp * expBonus)) };
}

/** A fresh random order for the current level. */
function randomOrder(): OrderState {
  const shape = orderShape(farmLevel());
  const pool = askable();
  const n = Math.min(pool.length, 1 + Math.floor(rand() * shape.items));
  const chosen = new Set<string>();
  while (chosen.size < n) chosen.add(pick(pool));
  return makeOrder([...chosen].map((item) => ({ item, qty: 1 + Math.floor(rand() * shape.maxQty) })), ORDER_BONUS, ORDER_EXP_BONUS);
}

/**
 * Refill the truck board: the level has orderSlots(level) slots. A delivered order is replaced
 * at once in the same position (`at`); a deleted one comes back in its position when its wait is
 * over; a slot gained by a level-up is added at the end. `fromStock` (the lesson) builds the
 * first order from what the player already has. Nothing beyond the slot count ever shows.
 */
export function refillOrders(fromStock = false, at = -1): void {
  const lvl = farmLevel();
  const slots = orderSlots(lvl);
  if (!slots || (tutorialActive() && !fromStock)) return;
  orderRng = (S.farm.orderSeq * 2654435761 + S.progress.xp * 97) >>> 0;
  const t = now();
  let changed = false;
  const insert = (o: OrderState, pos: number): void => { S.farm.orders.splice(Math.max(0, Math.min(pos, S.farm.orders.length)), 0, o); changed = true; };
  if (fromStock && !S.farm.orders.length) {
    const have = askable().filter((id) => count(id) > 0).sort((a, b) => count(b) - count(a)).slice(0, 2);
    if (have.length) insert(makeOrder(have.map((id) => ({ item: id, qty: Math.min(count(id), 2) })), ORDER_BONUS, ORDER_EXP_BONUS), 0);
  }
  if (at >= 0 && S.farm.orders.length + S.farm.orderCooldowns.length < slots) insert(randomOrder(), at);
  // Waits that are over: the order returns to the slot it was deleted from.
  for (const c of [...S.farm.orderCooldowns].sort((a, b) => a.pos - b.pos)) {
    if (c.at > t) continue;
    S.farm.orderCooldowns.splice(S.farm.orderCooldowns.indexOf(c), 1);
    insert(randomOrder(), c.pos);
  }
  while (S.farm.orders.length + S.farm.orderCooldowns.length < slots) insert(randomOrder(), S.farm.orders.length);
  while (S.farm.orders.length > slots) { S.farm.orders.pop(); changed = true; }
  if (changed) save();
}

/** The board's slots in order: an order, or the wait of a deleted one, per position. */
export function orderSlotsView(): ({ order: OrderState } | { cooldown: OrderCooldown })[] {
  const out: ({ order: OrderState } | { cooldown: OrderCooldown })[] = [];
  const cds = [...S.farm.orderCooldowns].sort((a, b) => a.pos - b.pos);
  let oi = 0;
  const total = S.farm.orders.length + cds.length;
  for (let p = 0; p < total; p++) {
    const cd = cds.find((c) => c.pos === p);
    if (cd && oi < S.farm.orders.length + 1) { out.push({ cooldown: cd }); cds.splice(cds.indexOf(cd), 1); continue; }
    if (oi < S.farm.orders.length) out.push({ order: S.farm.orders[oi++] });
    else if (cds.length) out.push({ cooldown: cds.shift()! });
  }
  return out;
}

export function canFulfil(o: OrderState): boolean { return o.items.every((x) => count(x.item) >= x.qty); }

export function fulfilOrder(id: number): string {
  const idx = S.farm.orders.findIndex((o) => o.id === id);
  if (idx < 0) return 'err_state';
  const o = S.farm.orders[idx];
  if (!canFulfil(o)) return 'err_inputs';
  for (const x of o.items) addItem(x.item, -x.qty);
  addCoin(o.coin);
  addXp(o.exp);
  bump('orders');
  S.farm.orders.splice(idx, 1);
  emit({ type: 'action', action: 'order' });
  save();
  refillOrders(false, idx); // the new order takes the delivered one's place
  return '';
}

/** Delete an order the player does not want: its slot stays empty for orderResetSec(level), then refills (a delivered order is replaced at once). */
export function deleteOrder(id: number): void {
  const idx = S.farm.orders.findIndex((o) => o.id === id);
  if (idx < 0) return;
  S.farm.orders.splice(idx, 1);
  S.farm.orderCooldowns.push({ at: now() + orderResetSec(farmLevel()) * 1000, pos: idx });
  emit({ type: 'action', action: 'deleteOrder' });
  save();
  refillOrders();
}

// ---------------------------------------------------------------------------
// Visitors: one at a time at the gate, asking for a single item.

/** A visitor walks up. `fromStock` (the lesson) asks for something the player has. */
export function spawnVisitor(fromStock = false): void {
  if (S.farm.visitor) return;
  orderRng = (S.farm.orderSeq * 2246822519 + S.progress.xp * 31 + 7) >>> 0;
  const lvl = farmLevel();
  let item = '';
  let qty = 1;
  if (fromStock) {
    const have = askable().filter((id) => count(id) > 0).sort((a, b) => count(b) - count(a));
    item = have[0] ?? 'wheat';
    if (!have.length) addItem('wheat', 1);
  } else {
    const pool = askable();
    item = pick(pool);
    qty = 1 + Math.floor(rand() * (lvl < 6 ? 2 : lvl < 20 ? 3 : 4));
  }
  const value = ITEMS[item].value * qty;
  S.farm.visitor = { id: S.farm.orderSeq++, look: Math.floor(rand() * 3), item, qty, coin: Math.max(1, Math.round(value * VISITOR_BONUS)), exp: VISITOR_EXP + ITEMS[item].exp * qty };
  emit({ type: 'visitor' });
  save();
}

export function serveVisitor(): string {
  const v = S.farm.visitor;
  if (!v) return 'err_state';
  if (count(v.item) < v.qty) return 'err_inputs';
  addItem(v.item, -v.qty);
  addCoin(v.coin);
  addXp(v.exp);
  bump('visitors');
  S.farm.visitor = null;
  S.farm.nextVisitorAt = now() + VISITOR_INTERVAL_SEC * 1000;
  emit({ type: 'action', action: 'serveVisitor' });
  save();
  return '';
}

export function dismissVisitor(): void {
  if (!S.farm.visitor) return;
  S.farm.visitor = null;
  S.farm.nextVisitorAt = now() + VISITOR_INTERVAL_SEC * 1000;
  save();
}

// ---------------------------------------------------------------------------
// Shop offers: everything the farm level lets the player buy right now, keyed so a
// second copy of a pen / machine counts as a new offer. Unseen ones show a badge.

export type ShopTab = 'build' | 'animals' | 'nature';
export function shopOffers(): { key: string; tab: ShopTab }[] {
  const lvl = farmLevel();
  const out: { key: string; tab: ShopTab }[] = [];
  for (const pen of Object.values(PENS)) {
    const n = allowedCount(pen.unlockLevels, lvl);
    for (let k = 1; k <= n; k++) out.push({ key: `pen:${pen.id}:${k}`, tab: 'build' });
    if (n > 0 && !pen.autoFill) out.push({ key: `animal:${pen.animal}`, tab: 'animals' });
  }
  for (const m of Object.values(MACHINES)) for (let k = 1; k <= allowedCount(m.unlockLevels, lvl); k++) out.push({ key: `mach:${m.id}:${k}`, tab: 'build' });
  for (const tr of Object.values(TREES)) if (tr.unlockLevel <= lvl) out.push({ key: `tree:${tr.id}`, tab: 'nature' });
  // New fields the level opened (keyed by the new maximum), while some are still unbought.
  const fields = maxPlots(lvl);
  if (fields > PLOTS_START && S.farm.plots.length < fields) out.push({ key: `plot:${fields}`, tab: 'nature' });
  return out;
}
export const offerSeen = (key: string): boolean => S.shopSeen[key] === 1;
export const newOffers = (tab?: ShopTab): number => shopOffers().filter((o) => !offerSeen(o.key) && (!tab || o.tab === tab)).length;
/** The player looked at a shop tab: its offers stop being new. */
export function markOffersSeen(tab: ShopTab): void {
  let changed = false;
  for (const o of shopOffers()) if (o.tab === tab && !offerSeen(o.key)) { S.shopSeen[o.key] = 1; changed = true; }
  if (changed) save();
}

// ---------------------------------------------------------------------------
// Achievements: cumulative stats, claimed tier by tier at the farmhouse.

export const achievementsOpen = (): boolean => farmLevel() >= ACHIEVEMENTS_UNLOCK;
export const claimedTiers = (id: string): number => S.achievements[id] ?? 0;
/** The next tier of an achievement that can be claimed now, or -1. */
export function claimableTier(id: string): number {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return -1;
  const k = claimedTiers(id);
  return k < def.tiers.length && stat(def.stat) >= def.tiers[k].need ? k : -1;
}
export const anyClaimable = (): boolean => achievementsOpen() && ACHIEVEMENTS.some((a) => claimableTier(a.id) >= 0);

export function claimAchievement(id: string): string {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  const k = claimableTier(id);
  if (!def || k < 0) return 'err_state';
  const tier = def.tiers[k];
  S.achievements[id] = k + 1;
  if (tier.gem) addGems(tier.gem);
  addXp(tier.exp);
  emit({ type: 'action', action: 'claim', target: id });
  save();
  return '';
}

// ---------------------------------------------------------------------------
// Match-3 stars, Upgrade Shop and storage upgrades

/**
 * CompleteMatch: credit only the improvement over the best stars of that level.
 * Coins follow the star table of the level's difficulty (20/40/80, or 40/80/160 on
 * hard levels); a replay pays the difference when it beats the best stars, else REPLAY_COINS.
 */
export function completeMatch(levelId: number, stars: number): { stars: number; coins: number } {
  const key = String(levelId);
  const old = S.match.bestStars[key] ?? 0;
  const delta = Math.max(0, stars - old);
  S.match.bestStars[key] = Math.max(old, stars);
  S.wallet.star += delta;
  if (delta > 0) { emit({ type: 'star', delta }); bump('stars', delta); }
  if (old === 0) bump('matches');
  const diff = MATCH_LEVELS.find((l) => l.id === levelId)?.difficulty ?? 'normal';
  const coins = stars > old ? winCoins(diff, stars) - winCoins(diff, old) : REPLAY_COINS;
  addCoin(coins);
  save();
  return { stars: delta, coins };
}

// ---------------------------------------------------------------------------
// Boosters and the paid revive (coins are the game's own wallet)

export const boosterCount = (key: string): number => S.boosters[key] ?? 0;

/** A free unit, given when a booster is first taught. */
export function grantBooster(key: string, n = 1): void {
  S.boosters[key] = boosterCount(key) + n;
  save();
}

/** First-time tutorials the player has already seen. */
export const tipSeen = (key: string): boolean => S.tips[key] === 1;
export function markTip(key: string): void {
  if (tipSeen(key)) return;
  S.tips[key] = 1;
  save();
}

export function buyBooster(key: string): string {
  const def = BOOSTERS.find((b) => b.key === key);
  if (!def) return 'err_state';
  if (S.wallet.coin < def.price) return 'err_coin';
  addCoin(-def.price);
  S.boosters[key] = boosterCount(key) + def.qty;
  emit({ type: 'action', action: 'buyBooster', target: key });
  save();
  return '';
}

/** Spend one unit; false when none is owned. */
export function useBooster(key: string): boolean {
  if (boosterCount(key) <= 0) return false;
  S.boosters[key] -= 1;
  if (S.boosters[key] <= 0) delete S.boosters[key];
  emit({ type: 'action', action: 'useBooster', target: key });
  save();
  return true;
}

export const canPayRevive = (): boolean => S.wallet.coin >= REVIVE_PRICE;

/** Debit the revive price; the caller continues the round. */
export function payRevive(): string {
  if (!canPayRevive()) return 'err_coin';
  addCoin(-REVIVE_PRICE);
  emit({ type: 'action', action: 'revive' });
  save();
  return '';
}

/** Tutorial fail-safe: a first clear that fell short of 2★ still gets 2 stars. */
export function grantTutorialBonusStars(target: number): number {
  const delta = Math.max(0, target - S.wallet.star);
  if (delta > 0) { S.wallet.star += delta; S.tutorial.bonusStars += delta; emit({ type: 'star', delta }); save(); }
  return delta;
}

export function buyMaterial(item: string): string {
  const price = MATERIAL_PRICE[item];
  if (price === undefined) return 'err_state';
  if (S.wallet.star < price) return 'err_star';
  S.wallet.star -= price;
  addItem(item, 1);
  emit({ type: 'action', action: 'buyMaterial', target: item });
  save();
  return '';
}

export function upgradeStorage(t: StorageType): string {
  const u = nextUpgrade(t);
  if (!u) return 'err_max';
  if (!canAffordUpgrade(t)) return 'err_materials';
  for (const r of u.required) {
    S.upgradeWallet[r.item] -= r.qty;
    if (S.upgradeWallet[r.item] <= 0) delete S.upgradeWallet[r.item];
  }
  S.storage[t].tier = u.tier;
  S.storage[t].cap = Math.max(u.capacityAfter, used(t));
  emit({ type: 'storageUpgraded', storage: t });
  emit({ type: 'action', action: 'upgrade', target: t });
  save();
  return '';
}

// ---------------------------------------------------------------------------
// Tutorial-only grants

/** The end of the level-1 walkthrough always lands on level 2 (corn, the feed mill). */
export function tutorialGrantLevel(level: number): void {
  if (S.tutorial.levelGranted) return;
  S.tutorial.levelGranted = true;
  const need = XP_THRESHOLDS[level] ?? 0;
  if (S.progress.xp < need) addXp(need - S.progress.xp);
  save();
}

/** The first sowing lesson: a few wheat to drag onto the plots (once per save). */
export function tutorialGrantSeeds(): void {
  if (S.tutorial.seedsGranted) return;
  S.tutorial.seedsGranted = true;
  addItem('wheat', Math.min(TUTORIAL_START.starterWheat, free('silo')));
  for (const g of LEVEL_GIFTS[1] ?? []) addItem(g.item, g.qty);
  save();
}

/** A lesson needs `qty` of an item on hand: top it up (storage limits ignored, it is a gift). */
export function tutorialEnsure(item: string, qty: number): void {
  const missing = qty - count(item);
  if (missing <= 0) return;
  addItem(item, missing);
  save();
}

export function setTutorialStep(id: string): void {
  if (S.tutorial.stepId === id) return;
  S.tutorial.stepId = id;
  save();
}

export function markLessonDone(id: string): void {
  S.tutorial.lessons[id] = 1;
  save();
}

export function setSetting(key: 'sound' | 'music' | 'haptic', on: boolean): void {
  S.settings[key] = on ? 1 : 0;
  save();
}

// ---------------------------------------------------------------------------
// Gems: buy a crop the silo is out of, or finish a timer at once.

/** +1 of a crop for CROP_GEM_PRICE gems (only when the silo has none of it). */
export function buyCropWithGems(crop: string): string {
  const c = CROPS[crop];
  if (!c || count(crop) > 0) return 'err_state';
  if (c.unlockLevel > farmLevel()) return 'err_level';
  if (!roomFor(crop, 1)) { emit({ type: 'collectBlocked', storage: 'silo' }); return 'err_silo_full'; }
  if (!spendGems(CROP_GEM_PRICE)) return 'err_gem';
  addItem(crop, 1);
  emit({ type: 'action', action: 'gemCrop', target: crop });
  save();
  return '';
}

/** Gems to finish a growing field now. */
export const plotSkipCost = (i: number): number => gemsFor(S.farm.plots[i].readyAt - now());
export function skipPlot(i: number): string {
  const p = S.farm.plots[i];
  if (!p || p.status !== 'growing') return 'err_state';
  if (!spendGems(plotSkipCost(i))) return 'err_gem';
  p.readyAt = now();
  p.status = 'ready';
  emit({ type: 'action', action: 'gemSkip', target: `plot${i}` });
  save();
  return '';
}

/** Gems to have every eating animal of a pen finish now (each priced on its own time left). */
export const penSkipCost = (penIndex: number): number =>
  (S.farm.pens[penIndex]?.animals ?? []).filter((c) => c.status === 'feeding').reduce((n, c) => n + gemsFor(c.readyAt - now()), 0);
export function skipPen(penIndex: number): string {
  const pen = S.farm.pens[penIndex];
  const eating = pen?.animals.filter((c) => c.status === 'feeding') ?? [];
  if (!pen || !eating.length) return 'err_state';
  if (!spendGems(penSkipCost(penIndex))) return 'err_gem';
  const pet = !ANIMALS[PENS[pen.type].animal].produceItem;
  for (const c of eating) { c.readyAt = 0; c.status = pet ? 'hungry' : 'ready'; }
  emit({ type: 'action', action: 'gemSkip', target: `pen${penIndex}` });
  save();
  return '';
}

/** Gems to finish a machine's running batch now; the batches queued after it move up. */
export function machineSkipCost(index: number): number {
  const run = machineJobs(index).running;
  return run ? gemsFor(run.readyAt - now()) : 0;
}
export function skipMachine(index: number): string {
  const m = S.farm.machines[index];
  const run = machineJobs(index).running;
  if (!m || !run) return 'err_state';
  if (!spendGems(machineSkipCost(index))) return 'err_gem';
  const saved = run.readyAt - now();
  for (const j of m.queue) if (j.readyAt >= run.readyAt) j.readyAt -= saved;
  emit({ type: 'action', action: 'gemSkip', target: `mach${index}` });
  save();
  return '';
}

/** Gems to ripen a tree now. */
export const treeSkipCost = (i: number): number => gemsFor(S.farm.trees[i].readyAt - now());
export function skipTree(i: number): string {
  const tr = S.farm.trees[i];
  if (!tr || treeReady(i)) return 'err_state';
  if (!spendGems(treeSkipCost(i))) return 'err_gem';
  tr.readyAt = now();
  emit({ type: 'action', action: 'gemSkip', target: `tree${i}` });
  save();
  return '';
}

/** QA (`?skiptut=1`): every guided lesson counts as done; the farm starts free at level 2 with the walkthrough's goods. */
export function skipTutorial(): void {
  for (const id of ['L1', 'L2', 'L3', 'L4', 'L6']) S.tutorial.lessons[id] = 1;
  S.tutorial.stepId = 'IDLE';
  tutorialGrantSeeds();
  tutorialGrantLevel(2);
  refillOrders();
  save();
}
