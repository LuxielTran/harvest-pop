// Game state and the services that mutate it: wallet, inventory, storage,
// farm objects, orders, match stars and storage upgrades. Every mutation
// follows validate → debit/credit → save; nothing here touches the DOM.

import FalconSDK from '@falcongames/game-client-sdk';
import {
  ANIMALS, BOOSTERS, CHICKEN_COST, COOP_CAPACITY, COOP_COST, CROPS, ITEMS, MACHINES, MATERIAL_PRICE, ORDER_BONUS,
  ORDER_COUNT, ORDER_TEMPLATES, PLOT_COST, PLOT_COUNT, RECIPES, REPLAY_COINS, REVIVE_PRICE, STORAGE_START,
  MATCH_LEVELS, STORAGE_UPGRADES, TUTORIAL_START, farmLevelForXp, winCoins, type StorageType, type StorageUpgrade,
} from './config';

export type PlotStatus = 'locked' | 'empty' | 'growing' | 'ready';
export interface PlotState { status: PlotStatus; crop: string | null; readyAt: number; }
export type ChickenStatus = 'hungry' | 'producing' | 'ready';
export interface ChickenState { status: ChickenStatus; readyAt: number; }
export type MachineStatus = 'idle' | 'processing' | 'output';
export interface MachineState { owned: boolean; status: MachineStatus; recipe: string | null; readyAt: number; }
export interface StorageState { tier: number; cap: number; items: Record<string, number>; }
export interface OrderState { id: number; items: { item: string; qty: number }[]; coin: number; exp: number; }

export interface SaveData {
  wallet: { coin: number; star: number };
  progress: { xp: number };
  storage: Record<StorageType, StorageState>;
  upgradeWallet: Record<string, number>;
  match: { bestStars: Record<string, number> };
  /** Booster units owned, by booster key. */
  boosters: Record<string, number>;
  /** First-time match tutorials already shown (key → 1). */
  tips: Record<string, number>;
  tutorial: { stepId: string; feedGranted: boolean; bonusStars: number };
  farm: {
    plots: PlotState[];
    coopBuilt: boolean;
    chickens: ChickenState[];
    machines: Record<string, MachineState>;
    orders: OrderState[];
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
  | { type: 'storageUpgraded'; storage: StorageType }
  | { type: 'action'; action: string; target?: string };
const eventListeners = new Set<(e: GameEvent) => void>();
export function onEvent(fn: (e: GameEvent) => void): () => void { eventListeners.add(fn); return () => eventListeners.delete(fn); }
export function emit(e: GameEvent): void { for (const fn of [...eventListeners]) fn(e); }

export const now = (): number => Date.now();

function freshSave(): SaveData {
  return {
    wallet: { coin: TUTORIAL_START.coin, star: 0 },
    progress: { xp: 0 },
    storage: {
      silo: { tier: 1, cap: STORAGE_START.silo, items: {} },
      barn: { tier: 1, cap: STORAGE_START.barn, items: { feed: TUTORIAL_START.starterFeed } },
    },
    upgradeWallet: {},
    match: { bestStars: {} },
    boosters: {},
    tips: {},
    tutorial: { stepId: 'T00', feedGranted: false, bonusStars: 0 },
    farm: {
      plots: Array.from({ length: PLOT_COUNT }, () => ({ status: 'locked' as PlotStatus, crop: null, readyAt: 0 })),
      coopBuilt: false,
      chickens: [],
      machines: {
        feedmill: { owned: true, status: 'idle', recipe: null, readyAt: 0 },
        bakery: { owned: false, status: 'idle', recipe: null, readyAt: 0 },
      },
      orders: [],
      orderSeq: 1,
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
  f.tips = numMap(hp.tips);
  const tut = obj(hp.tutorial);
  f.tutorial.stepId = typeof tut.stepId === 'string' ? tut.stepId : 'T00';
  f.tutorial.feedGranted = tut.feedGranted === true;
  f.tutorial.bonusStars = num(tut.bonusStars, 0);
  const farm = obj(hp.farm);
  if (Array.isArray(farm.plots)) {
    farm.plots.slice(0, PLOT_COUNT).forEach((p: unknown, i: number) => {
      const o = obj(p);
      const status = ['locked', 'empty', 'growing', 'ready'].includes(o.status) ? (o.status as PlotStatus) : 'locked';
      f.farm.plots[i] = { status, crop: typeof o.crop === 'string' && CROPS[o.crop] ? o.crop : null, readyAt: num(o.readyAt, 0) };
      if ((status === 'growing' || status === 'ready') && !f.farm.plots[i].crop) f.farm.plots[i] = { status: 'empty', crop: null, readyAt: 0 };
    });
  }
  f.farm.coopBuilt = farm.coopBuilt === true;
  if (Array.isArray(farm.chickens)) {
    f.farm.chickens = farm.chickens.slice(0, COOP_CAPACITY).map((c: unknown) => {
      const o = obj(c);
      const status = ['hungry', 'producing', 'ready'].includes(o.status) ? (o.status as ChickenStatus) : 'hungry';
      return { status, readyAt: num(o.readyAt, 0) };
    });
  }
  for (const id of Object.keys(f.farm.machines)) {
    const m = obj(obj(farm.machines)[id]);
    if (!Object.keys(m).length) continue;
    const status = ['idle', 'processing', 'output'].includes(m.status) ? (m.status as MachineStatus) : 'idle';
    const recipe = typeof m.recipe === 'string' && RECIPES[m.recipe] ? m.recipe : null;
    f.farm.machines[id] = { owned: m.owned === true || id === 'feedmill', status: recipe ? status : 'idle', recipe, readyAt: num(m.readyAt, 0) };
  }
  if (Array.isArray(farm.orders)) {
    f.farm.orders = farm.orders.slice(0, ORDER_COUNT).map((o: unknown) => {
      const x = obj(o);
      const items = Array.isArray(x.items) ? x.items.map((it: unknown) => ({ item: String(obj(it).item), qty: Math.max(1, num(obj(it).qty, 1)) })).filter((it: { item: string }) => ITEMS[it.item]) : [];
      return { id: num(x.id, 0), items, coin: Math.max(0, num(x.coin, 0)), exp: Math.max(0, num(x.exp, 0)) };
    }).filter((o: OrderState) => o.items.length > 0);
  }
  f.farm.orderSeq = Math.max(1, num(farm.orderSeq, 1));
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
    for (const m of Object.values(S.farm.machines)) if (m.readyAt) m.readyAt += shift;
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
function addXp(delta: number): void {
  const before = farmLevel();
  S.progress.xp += delta;
  emit({ type: 'xp', delta });
  const after = farmLevel();
  if (after > before) emit({ type: 'levelUp', level: after });
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

/** Advance every timer to `now()`: growing → ready, producing → ready, processing → output. */
export function tick(): boolean {
  const t = now();
  let changed = false;
  for (const p of S.farm.plots) if (p.status === 'growing' && t >= p.readyAt) { p.status = 'ready'; changed = true; }
  for (const c of S.farm.chickens) if (c.status === 'producing' && t >= c.readyAt) { c.status = 'ready'; changed = true; }
  for (const m of Object.values(S.farm.machines)) if (m.status === 'processing' && t >= m.readyAt) { m.status = 'output'; changed = true; }
  if (changed) save();
  return changed;
}

// ---------------------------------------------------------------------------
// Farm actions. Each returns an error key ('' = ok) so the UI can toast it.

export function buyPlot(i: number): string {
  const p = S.farm.plots[i];
  if (!p || p.status !== 'locked') return 'err_state';
  if (S.wallet.coin < PLOT_COST) return 'err_coin';
  addCoin(-PLOT_COST);
  p.status = 'empty';
  emit({ type: 'action', action: 'buyPlot', target: String(i) });
  save();
  return '';
}

export function plantCrop(i: number, crop: string): string {
  const p = S.farm.plots[i];
  const c = CROPS[crop];
  if (!p || !c || p.status !== 'empty') return 'err_state';
  if (c.unlockLevel > farmLevel()) return 'err_level';
  if (S.wallet.coin < c.seedCost) return 'err_coin';
  addCoin(-c.seedCost);
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
  c.status = 'producing';
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

export function startRecipe(machineId: string, recipeId: string): string {
  const m = S.farm.machines[machineId];
  const r = RECIPES[recipeId];
  if (!m || !r || !m.owned || m.status !== 'idle' || r.machine !== machineId) return 'err_state';
  if (r.unlockLevel > farmLevel()) return 'err_level';
  for (const inp of r.inputs) if (count(inp.item) < inp.qty) return 'err_inputs';
  for (const inp of r.inputs) addItem(inp.item, -inp.qty); // inputs are consumed atomically at start
  m.status = 'processing';
  m.recipe = recipeId;
  m.readyAt = now() + secondsFor(r.seconds, r.tutorialSeconds) * 1000;
  emit({ type: 'action', action: 'startRecipe', target: machineId });
  save();
  return '';
}

export function collectOutput(machineId: string): string {
  const m = S.farm.machines[machineId];
  if (!m || m.status !== 'output' || !m.recipe) return 'err_state';
  const r = RECIPES[m.recipe];
  if (!roomFor(r.output, r.outputQty)) { emit({ type: 'collectBlocked', storage: 'barn' }); return 'err_barn_full'; }
  addItem(r.output, r.outputQty);
  addXp(r.exp);
  m.status = 'idle';
  m.recipe = null;
  m.readyAt = 0;
  emit({ type: 'collected', item: r.output, qty: r.outputQty });
  emit({ type: 'action', action: 'collectOutput', target: machineId });
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
  if (delta > 0) emit({ type: 'star', delta });
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

export function tutorialGrantFeed(): void {
  if (S.tutorial.feedGranted) return;
  S.tutorial.feedGranted = true;
  if (roomFor('feed', 1)) addItem('feed', 1);
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
