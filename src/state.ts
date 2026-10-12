// Game state and the services that mutate it: wallet, inventory, storage,
// farm objects, orders, match stars and storage upgrades. Every mutation
// follows validate → debit/credit → save; nothing here touches the DOM.

import FalconSDK from '@falcongames/game-client-sdk';
import {
  ANIMALS, BOOSTERS, CHICKEN_COST, COOP_UNLOCK, CROP_GIFT, COOP_CAPACITY, COOP_COST, CROPS, DEFAULT_LAYOUT, ITEMS, MACHINES, MACHINE_SLOTS_MAX, MATERIAL_PRICE, ORDER_BONUS,
  ORDER_COUNT, ORDER_TEMPLATES, PLOT_COST, PLOTS_MAX, PLOTS_START, RECIPES, REPLAY_COINS, REVIVE_PRICE, STORAGE_START,
  CROP_GEM_PRICE, GEM_START, STORAGE_UPGRADES, TUTORIAL_START, WIN_COINS, gemsFor, XP_THRESHOLDS, farmLevelForXp, maxPlots, slotPrice, type StorageType, type StorageUpgrade,
} from './config';

export type PlotStatus = 'empty' | 'growing' | 'ready';
export interface PlotState { status: PlotStatus; crop: string | null; readyAt: number; }
/** A chicken waits for feed (hungry), eats while it lays (feeding), then has eggs (ready). */
export type ChickenStatus = 'hungry' | 'feeding' | 'ready';
export interface ChickenState { status: ChickenStatus; readyAt: number; }
/** One batch in a machine. Batches run one after another in queue order; a finished one waits to be collected. */
export interface MachineJob { recipe: string; readyAt: number; }
/** `slots` = how many batches (running, waiting or finished) the machine can hold. */
export interface MachineState { owned: boolean; slots: number; queue: MachineJob[]; }
export interface StorageState { tier: number; cap: number; items: Record<string, number>; }
export interface OrderState { id: number; items: { item: string; qty: number }[]; coin: number; exp: number; }

export interface SaveData {
  wallet: { coin: number; star: number; gem: number };
  progress: { xp: number };
  storage: Record<StorageType, StorageState>;
  upgradeWallet: Record<string, number>;
  match: { bestStars: Record<string, number> };
  /** Booster units owned, by booster key. */
  boosters: Record<string, number>;
  tutorial: { stepId: string; seedsGranted: boolean; levelGranted: boolean; bonusStars: number };
  farm: {
    plots: PlotState[];
    coopBuilt: boolean;
    chickens: ChickenState[];
    machines: Record<string, MachineState>;
    orders: OrderState[];
    /** Where the player moved buildings / plots (front grid cell); missing keys use DEFAULT_LAYOUT. */
    layout: Record<string, { a: number; b: number }>;
    orderSeq: number;
  };
  settings: { sound: number; music: number; haptic: number };
  lastSeen: number;
}

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
  | { type: 'action'; action: string; target?: string };
const eventListeners = new Set<(e: GameEvent) => void>();
export function onEvent(fn: (e: GameEvent) => void): () => void { eventListeners.add(fn); return () => eventListeners.delete(fn); }
export function emit(e: GameEvent): void { for (const fn of [...eventListeners]) fn(e); }

export const now = (): number => Date.now();

function freshSave(): SaveData {
  return {
    wallet: { coin: TUTORIAL_START.coin, star: 0, gem: GEM_START },
    progress: { xp: 0 },
    storage: {
      silo: { tier: 1, cap: STORAGE_START.silo, items: {} },
      barn: { tier: 1, cap: STORAGE_START.barn, items: {} },
    },
    upgradeWallet: {},
    match: { bestStars: {} },
    boosters: {},
    tutorial: { stepId: 'T00', seedsGranted: false, levelGranted: false, bonusStars: 0 },
    farm: {
      plots: Array.from({ length: PLOTS_START }, () => ({ status: 'empty' as PlotStatus, crop: null, readyAt: 0 })),
      coopBuilt: false,
      chickens: [],
      machines: {
        feedmill: { owned: false, slots: 1, queue: [] },
        bakery: { owned: false, slots: 1, queue: [] },
      },
      orders: [],
      orderSeq: 1,
      layout: {},
    },
    settings: { sound: 1, music: 1, haptic: 1 },
    lastSeen: now(),
  };
}

export let S: SaveData = freshSave();

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const obj = (v: unknown): Record<string, any> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});

function numMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v))) if (typeof n === 'number' && n > 0) out[k] = Math.floor(n);
  return out;
}

/** Merge a (possibly older or partial) save into a fresh one, type-checking every field. */
export function loadFromSave(raw: Record<string, any>): void {
  const f = freshSave();
  const d = obj(raw);
  if (!d.hp) { S = f; return; } // no Harvest Pop save yet → tutorial start
  const hp = obj(d.hp);
  const w = obj(hp.wallet);
  f.wallet.coin = Math.max(0, num(w.coin, f.wallet.coin));
  f.wallet.star = Math.max(0, num(w.star, 0));
  f.wallet.gem = Math.max(0, num(w.gem, GEM_START)); // saves from before gems start with the opening amount
  f.progress.xp = Math.max(0, num(obj(hp.progress).xp, 0));
  for (const t of ['silo', 'barn'] as StorageType[]) {
    const st = obj(obj(hp.storage)[t]);
    f.storage[t].tier = Math.max(1, num(st.tier, 1));
    f.storage[t].items = numMap(st.items);
    f.storage[t].cap = Math.max(num(st.cap, STORAGE_START[t]), usedOf(f.storage[t]));
  }
  f.upgradeWallet = numMap(hp.upgradeWallet);
  f.match.bestStars = numMap(obj(hp.match).bestStars);
  f.boosters = numMap(hp.boosters);
  const tut = obj(hp.tutorial);
  f.tutorial.stepId = typeof tut.stepId === 'string' ? tut.stepId : 'T00';
  f.tutorial.levelGranted = tut.levelGranted === true;
  f.tutorial.seedsGranted = tut.seedsGranted === true;
  f.tutorial.bonusStars = num(tut.bonusStars, 0);
  const farm = obj(hp.farm);
  if (Array.isArray(farm.plots)) {
    // The first PLOTS_START fields always exist; bought ones (up to PLOTS_MAX) follow.
    farm.plots.slice(0, PLOTS_MAX).forEach((p: unknown, i: number) => {
      const o = obj(p);
      // Older saves had plots for sale ('locked'); every saved plot is open now.
      const status = ['growing', 'ready'].includes(o.status) ? (o.status as PlotStatus) : 'empty';
      f.farm.plots[i] = { status, crop: typeof o.crop === 'string' && CROPS[o.crop] ? o.crop : null, readyAt: num(o.readyAt, 0) };
      if ((status === 'growing' || status === 'ready') && !f.farm.plots[i].crop) f.farm.plots[i] = { status: 'empty', crop: null, readyAt: 0 };
    });
  }
  f.farm.coopBuilt = farm.coopBuilt === true;
  if (Array.isArray(farm.chickens)) {
    f.farm.chickens = farm.chickens.slice(0, COOP_CAPACITY).map((c: unknown) => {
      const o = obj(c);
      // Older saves called the eating state 'producing'.
      const raw = o.status === 'producing' ? 'feeding' : o.status;
      const status = ['hungry', 'feeding', 'ready'].includes(raw) ? (raw as ChickenStatus) : 'hungry';
      return { status, readyAt: num(o.readyAt, 0) };
    });
  }
  for (const id of Object.keys(f.farm.machines)) {
    const m = obj(obj(farm.machines)[id]);
    if (!Object.keys(m).length) continue;
    const queue: MachineJob[] = Array.isArray(m.queue)
      ? m.queue.map((j: unknown) => obj(j)).filter((j: Record<string, any>) => RECIPES[j.recipe]?.machine === id).map((j: Record<string, any>) => ({ recipe: j.recipe as string, readyAt: num(j.readyAt, 0) }))
      : []; // older saves held one batch as status / recipe / readyAt
    if (!Array.isArray(m.queue) && typeof m.recipe === 'string' && RECIPES[m.recipe] && m.status !== 'idle') queue.push({ recipe: m.recipe, readyAt: num(m.readyAt, 0) });
    const slots = Math.max(1, Math.min(MACHINE_SLOTS_MAX, Math.floor(num(m.slots, 1))));
    f.farm.machines[id] = { owned: m.owned === true, slots: Math.max(slots, queue.length), queue };
  }
  if (Array.isArray(farm.orders)) {
    f.farm.orders = farm.orders.slice(0, ORDER_COUNT).map((o: unknown) => {
      const x = obj(o);
      const items = Array.isArray(x.items) ? x.items.map((it: unknown) => ({ item: String(obj(it).item), qty: Math.max(1, num(obj(it).qty, 1)) })).filter((it: { item: string }) => ITEMS[it.item]) : [];
      return { id: num(x.id, 0), items, coin: Math.max(0, num(x.coin, 0)), exp: Math.max(0, num(x.exp, 0)) };
    }).filter((o: OrderState) => o.items.length > 0);
  }
  f.farm.orderSeq = Math.max(1, num(farm.orderSeq, 1));
  for (const [key, v] of Object.entries(obj(farm.layout))) {
    const o = obj(v);
    if (/^(barn|silo|feedmill|bakery|coop|plot\d)$/.test(key) && Number.isInteger(o.a) && Number.isInteger(o.b)) f.farm.layout[key] = { a: o.a, b: o.b };
  }
  const set = obj(hp.settings);
  f.settings = { sound: num(set.sound, 1), music: num(set.music, 1), haptic: num(set.haptic, 1) };
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
    for (const c of S.farm.chickens) if (c.readyAt) c.readyAt += shift;
    for (const m of Object.values(S.farm.machines)) for (const j of m.queue) j.readyAt += shift;
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

/** Reset to the tutorial start. Used by `?reset=1` for QA. */
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
export const tutorialActive = (): boolean => S.tutorial.stepId !== 'COMPLETE';
export const isTutorialStep = (id: string): boolean => S.tutorial.stepId === id;
export function nextUpgrade(t: StorageType): StorageUpgrade | null {
  return STORAGE_UPGRADES[t].find((u) => u.tier === S.storage[t].tier + 1) ?? null;
}
export function canAffordUpgrade(t: StorageType): boolean {
  const u = nextUpgrade(t);
  return !!u && u.required.every((r) => (S.upgradeWallet[r.item] ?? 0) >= r.qty);
}

// ---------------------------------------------------------------------------
// Wallet & inventory primitives (no save; callers save once per transaction)

function addCoin(delta: number): void {
  S.wallet.coin = Math.max(0, S.wallet.coin + delta);
  emit({ type: 'coin', delta });
}
function spendGems(n: number): boolean {
  if (S.wallet.gem < n) return false;
  S.wallet.gem -= n;
  emit({ type: 'gem', delta: -n });
  return true;
}
function addXp(delta: number): void {
  const before = farmLevel();
  S.progress.xp += delta;
  emit({ type: 'xp', delta });
  const after = farmLevel();
  for (let lvl = before + 1; lvl <= after; lvl++) {
    // A level that unlocks a crop gives CROP_GIFT of it to sow.
    for (const c of Object.values(CROPS)) if (c.unlockLevel === lvl) addItem(c.id, CROP_GIFT);
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

const secondsFor = (normal: number, tutorial: number): number => (tutorialActive() ? tutorial : normal);

/** Advance every timer to `now()`: growing → ready, feeding → ready, a batch finishing. */
let lastTick = 0;
export function tick(): boolean {
  const t = now();
  let changed = false;
  for (const p of S.farm.plots) if (p.status === 'growing' && t >= p.readyAt) { p.status = 'ready'; changed = true; }
  for (const c of S.farm.chickens) if (c.status === 'feeding' && t >= c.readyAt) { c.status = 'ready'; changed = true; }
  for (const m of Object.values(S.farm.machines)) for (const j of m.queue) if (j.readyAt > lastTick && j.readyAt <= t) changed = true;
  lastTick = t;
  if (changed) save();
  return changed;
}

// ---------------------------------------------------------------------------
// Farm actions. Each returns an error key ('' = ok) so the UI can toast it.

/** Front grid cell of a movable farm object (the player's layout, else the default; undefined if neither). */
export const layoutOf = (key: string): { a: number; b: number } | undefined => S.farm.layout[key] ?? DEFAULT_LAYOUT[key];

/** One more field (from farm level 2); the UI places it first, then calls this on ✓. */
export function buyPlot(): string {
  if (S.farm.plots.length >= maxPlots(farmLevel())) return farmLevel() < 2 ? 'err_level' : 'err_max';
  if (S.wallet.coin < PLOT_COST) return 'err_coin';
  addCoin(-PLOT_COST);
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
  p.readyAt = now() + secondsFor(c.growSeconds, c.tutorialSeconds) * 1000;
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
  addXp(c.exp);
  p.status = 'empty';
  p.crop = null;
  p.readyAt = 0;
  emit({ type: 'harvested', item: c.id, qty: c.yieldQty });
  emit({ type: 'action', action: 'harvest', target: String(i) });
  save();
  return '';
}

export function buyCoop(): string {
  if (S.farm.coopBuilt) return 'err_state';
  if (farmLevel() < COOP_UNLOCK) return 'err_level';
  if (S.wallet.coin < COOP_COST) return 'err_coin';
  addCoin(-COOP_COST);
  S.farm.coopBuilt = true;
  emit({ type: 'action', action: 'buyCoop' });
  save();
  return '';
}

export function buyChicken(): string {
  if (!S.farm.coopBuilt) return 'err_state';
  if (S.farm.chickens.length >= COOP_CAPACITY) return 'err_coop_full';
  if (S.wallet.coin < CHICKEN_COST) return 'err_coin';
  addCoin(-CHICKEN_COST);
  S.farm.chickens.push({ status: 'hungry', readyAt: 0 });
  emit({ type: 'action', action: 'buyChicken' });
  save();
  return '';
}

export function feedChicken(i: number): string {
  const c = S.farm.chickens[i];
  const a = ANIMALS.chicken;
  if (!c || c.status !== 'hungry') return 'err_state';
  if (count(a.feedItem) < a.feedQty) return 'err_no_feed';
  addItem(a.feedItem, -a.feedQty);
  c.status = 'feeding';
  c.readyAt = now() + secondsFor(a.produceSeconds, a.tutorialSeconds) * 1000;
  emit({ type: 'action', action: 'feed', target: String(i) });
  save();
  return '';
}

export function collectEgg(i: number): string {
  const c = S.farm.chickens[i];
  const a = ANIMALS.chicken;
  if (!c || c.status !== 'ready') return 'err_state';
  if (!roomFor(a.produceItem, a.produceQty)) { emit({ type: 'collectBlocked', storage: 'barn' }); return 'err_barn_full'; }
  addItem(a.produceItem, a.produceQty);
  addXp(a.exp);
  c.status = 'hungry';
  c.readyAt = 0;
  emit({ type: 'collected', item: a.produceItem, qty: a.produceQty });
  emit({ type: 'action', action: 'collectEgg', target: String(i) });
  save();
  return '';
}

export function buyMachine(id: string): string {
  const m = S.farm.machines[id];
  const cfg = MACHINES[id];
  if (!m || !cfg || m.owned) return 'err_state';
  if (cfg.unlockLevel > farmLevel()) return 'err_level';
  if (S.wallet.coin < cfg.cost) return 'err_coin';
  addCoin(-cfg.cost);
  m.owned = true;
  emit({ type: 'action', action: 'buyMachine', target: id });
  save();
  return '';
}

/** Finished batches (front of the queue) and the one now running, if any. */
export function machineJobs(machineId: string): { done: MachineJob[]; running: MachineJob | null; waiting: MachineJob[] } {
  const q = S.farm.machines[machineId]?.queue ?? [];
  const t = now();
  const done = q.filter((j) => j.readyAt <= t);
  const pending = q.filter((j) => j.readyAt > t);
  return { done, running: pending[0] ?? null, waiting: pending.slice(1) };
}

/** Queue a batch: inputs are consumed now, it starts when the batch before it ends. */
export function startRecipe(machineId: string, recipeId: string): string {
  const m = S.farm.machines[machineId];
  const r = RECIPES[recipeId];
  if (!m || !r || !m.owned || r.machine !== machineId) return 'err_state';
  if (r.unlockLevel > farmLevel()) return 'err_level';
  if (m.queue.length >= m.slots) return 'err_slots';
  for (const inp of r.inputs) if (count(inp.item) < inp.qty) return 'err_inputs';
  for (const inp of r.inputs) addItem(inp.item, -inp.qty); // inputs are consumed atomically at start
  const last = m.queue[m.queue.length - 1];
  const start = Math.max(now(), last?.readyAt ?? 0);
  m.queue.push({ recipe: recipeId, readyAt: start + secondsFor(r.seconds, r.tutorialSeconds) * 1000 });
  emit({ type: 'action', action: 'startRecipe', target: machineId });
  save();
  return '';
}

/** Collect every finished batch (in order) the barn has room for. Returns the items collected. */
export function collectOutput(machineId: string): { err: string; got: { item: string; qty: number }[] } {
  const m = S.farm.machines[machineId];
  const got: { item: string; qty: number }[] = [];
  if (!m) return { err: 'err_state', got };
  let err = '';
  while (m.queue.length && m.queue[0].readyAt <= now()) {
    const r = RECIPES[m.queue[0].recipe];
    if (!roomFor(r.output, r.outputQty)) { emit({ type: 'collectBlocked', storage: ITEMS[r.output].storage as StorageType }); err = 'err_barn_full'; break; }
    m.queue.shift();
    addItem(r.output, r.outputQty);
    addXp(r.exp);
    got.push({ item: r.output, qty: r.outputQty });
    emit({ type: 'collected', item: r.output, qty: r.outputQty });
  }
  if (!got.length) return { err: err || 'err_state', got };
  emit({ type: 'action', action: 'collectOutput', target: machineId });
  save();
  return { err: '', got };
}

/** Buy one more production slot: MACHINE_SLOT_BASE × 3^(slots − 1) coins. */
export function buySlot(machineId: string): string {
  const m = S.farm.machines[machineId];
  if (!m || !m.owned) return 'err_state';
  if (m.slots >= MACHINE_SLOTS_MAX) return 'err_max';
  const price = slotPrice(m.slots);
  if (S.wallet.coin < price) return 'err_coin';
  addCoin(-price);
  m.slots += 1;
  emit({ type: 'action', action: 'buySlot', target: machineId });
  save();
  return '';
}

// ---------------------------------------------------------------------------
// Orders

let orderRng = 0;
function rand(): number { orderRng = (orderRng * 1664525 + 1013904223) >>> 0; return orderRng / 4294967296; }

export function refillOrders(): void {
  if (tutorialActive()) return;
  orderRng = (S.farm.orderSeq * 2654435761 + S.progress.xp * 97) >>> 0;
  let changed = false;
  while (S.farm.orders.length < ORDER_COUNT) {
    const pool = ORDER_TEMPLATES.filter((t) => t.unlockLevel <= farmLevel());
    const t = pool[Math.floor(rand() * pool.length)];
    const items = t.items.map((x) => ({ ...x }));
    const value = items.reduce((n, x) => n + ITEMS[x.item].value * x.qty, 0);
    S.farm.orders.push({ id: S.farm.orderSeq++, items, coin: Math.round(value * ORDER_BONUS), exp: Math.max(1, Math.round(value / 6)) });
    changed = true;
  }
  if (changed) save();
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
  S.farm.orders.splice(idx, 1);
  emit({ type: 'action', action: 'order' });
  save();
  refillOrders();
  return '';
}

export function skipOrder(id: number): void {
  const idx = S.farm.orders.findIndex((o) => o.id === id);
  if (idx < 0) return;
  S.farm.orders.splice(idx, 1);
  save();
  refillOrders();
}

// ---------------------------------------------------------------------------
// Match-3 stars, Upgrade Shop and storage upgrades

/**
 * CompleteMatch: credit only the improvement over the best stars of that level,
 * plus the coin reward (WIN_COINS on a first clear, REPLAY_COINS after that).
 */
export function completeMatch(levelId: number, stars: number): { stars: number; coins: number } {
  const key = String(levelId);
  const old = S.match.bestStars[key] ?? 0;
  const delta = Math.max(0, stars - old);
  S.match.bestStars[key] = Math.max(old, stars);
  S.wallet.star += delta;
  if (delta > 0) emit({ type: 'star', delta });
  const coins = old === 0 ? WIN_COINS : REPLAY_COINS;
  addCoin(coins);
  save();
  return { stars: delta, coins };
}

// ---------------------------------------------------------------------------
// Boosters and the paid revive (coins are the game's own wallet)

export const boosterCount = (key: string): number => S.boosters[key] ?? 0;

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

/** After the first harvest → Match-3 → upgrade lesson the farm reaches level 2 (corn, +3 fields). */
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
  save();
}

export function setTutorialStep(id: string): void {
  if (S.tutorial.stepId === id) return;
  S.tutorial.stepId = id;
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

/** Gems to have every eating chicken lay now (each chicken priced on its own time left). */
export const chickensSkipCost = (): number =>
  S.farm.chickens.filter((c) => c.status === 'feeding').reduce((n, c) => n + gemsFor(c.readyAt - now()), 0);
export function skipChickens(): string {
  const eating = S.farm.chickens.filter((c) => c.status === 'feeding');
  if (!eating.length) return 'err_state';
  if (!spendGems(chickensSkipCost())) return 'err_gem';
  for (const c of eating) { c.readyAt = now(); c.status = 'ready'; }
  emit({ type: 'action', action: 'gemSkip', target: 'chickens' });
  save();
  return '';
}

/** Gems to finish a machine's running batch now; the batches queued after it move up. */
export function machineSkipCost(machineId: string): number {
  const run = machineJobs(machineId).running;
  return run ? gemsFor(run.readyAt - now()) : 0;
}
export function skipMachine(machineId: string): string {
  const m = S.farm.machines[machineId];
  const run = machineJobs(machineId).running;
  if (!m || !run) return 'err_state';
  if (!spendGems(machineSkipCost(machineId))) return 'err_gem';
  const saved = run.readyAt - now();
  for (const j of m.queue) if (j.readyAt >= run.readyAt) j.readyAt -= saved;
  emit({ type: 'action', action: 'gemSkip', target: machineId });
  save();
  return '';
}
