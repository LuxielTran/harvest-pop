// Farm Home: the 2.5D farm map (barn, silo, fields, and the coop / machines once
// bought), the HUD, the bottom bar and every farm popup (shop, inventory/storage
// upgrade, upgrade shop, orders, match map, settings).
//
// Everything on the map is played by hand, Hay Day style: tap a field / the coop /
// a machine to open a tray, then hold a tool and sweep it (seeds and the sickle
// over fields, feed and the basket over chickens) or drop a product into its
// machine. Buildings and fields can be moved (long press → drag → ✓ / ✕).

import FalconSDK from '@falcongames/game-client-sdk';
import * as A from '../art';
import {
  ANIMALS, BOOSTERS, CHICKEN_COST, COOP_CAPACITY, COOP_COST, COOP_UNLOCK, CROP_GEM_PRICE, CROP_GIFT, CROPS, FOOTPRINT, LEVEL_UNLOCKS, MACHINES,
  MACHINE_SLOTS_MAX, MATCH_LEVELS, MATERIALS, MATERIAL_PRICE, MOVE_HOLD_MS, PLOT_COST, RECIPES, WORLD_SCALE, XP_THRESHOLDS, maxPlots,
  slotPrice, xpForNextLevel, type StorageType,
} from '../config';
import { t } from '../i18n';
import * as St from '../state';
import { S } from '../state';
import { tutorial } from '../tutorial';
import { centerOf, closePopup, currentPopup, el, floatLabel, fmtTime, img, openPopup, rerenderPopup, setPopupRenderer, stage, toast, toStage } from './common';

export interface FarmHandlers { playLevel(index: number): void; }
let handlers: FarmHandlers = { playLevel: () => {} };
export function setFarmHandlers(h: FarmHandlers): void { handlers = h; }

let root: HTMLElement | null = null;
let scene: HTMLElement | null = null;
const sigs = new Map<string, string>();
let timerHandle = 0;

// The farm map: a WORLD_SCALE× lawn the camera pans over. The original farm area (the
// view's 400×632) sits in its middle, so the starting camera shows the same farm as before.
const VIEW_W = 400;
const VIEW_H = 632;
const WORLD_W = VIEW_W * WORLD_SCALE;
const WORLD_H = VIEW_H * WORLD_SCALE;
const OFF_X = (WORLD_W - VIEW_W) / 2;
const OFF_Y = (WORLD_H - VIEW_H) / 2;
// Isometric grid: cell (a, b) has its centre at (X0 + 26(a − b), Y0 − 13(a + b)) in world px.
const X0 = 200 + OFF_X;
const Y0 = 540 + OFF_Y;
const MACHINE_IDS = ['feedmill', 'bakery'];
const MACHINE_ICON: Record<string, string> = { feedmill: A.ICON_MILL, bakery: A.ICON_BAKERY };

let world: HTMLElement | null = null;
const cam = { x: OFF_X, y: OFF_Y };

// Tools: a file in src/assets/ (grass_sickle.png, chicken_feed.png, basket.png) wins over the drawn icon.
const SICKLE = A.ASSET.grass_sickle ?? A.ICON_SHOVEL;
const FEED = A.ASSET.chicken_feed ?? A.ICON_FEED;
const BASKET = A.ASSET.basket ?? A.ICON_BASKET;

function gate(action: string, target?: string | number): boolean {
  if (tutorial.allows(action, target)) return true;
  toast(t('err_tutorial'), 'warn');
  return false;
}

function report(err: string): boolean {
  if (!err) return true;
  toast(t(err), 'warn');
  return false;
}

export function buildFarm(): HTMLElement {
  if (root) return root;
  root = el(`<div id="farm" class="screen">
    <div class="hud">
      <button class="pill coin" id="hud-coinbtn" style="border:0">${img(A.ICON_COIN)}<span id="hud-coin">0</span></button>
      <button class="pill gem" id="hud-gembtn" style="border:0">${img(A.ICON_GEM)}<span id="hud-gem">0</span></button>
      <div class="pill lvl">${img(A.ICON_XP)}<b id="hud-lvl">Lv 1</b><div class="bar"><i id="hud-xp"></i></div></div>
      <div class="pill star">${img(A.ICON_STAR)}<span id="hud-star">0</span></div>
      <button class="iconbtn" id="btn-settings">${img(A.ICON_SETTINGS)}</button>
    </div>
    <div class="scene"><div class="world" style="width:${WORLD_W}px;height:${WORLD_H}px"><div class="ground"></div>${img(A.SCENE_DECOR, 'decor')}</div></div>
    <div class="bottombar">
      <button class="bbtn" data-tut="shop" id="bb-shop">${img(A.ICON_SHOP)}<span>${t('shop')}</span></button>
      <button class="bbtn" data-tut="orders" id="bb-orders">${img(A.ICON_ORDERS)}<span>${t('orders')}</span><b class="badge" id="orders-badge" style="display:none"></b></button>
      <button class="bbtn match" data-tut="match" id="bb-match">${img(A.ICON_MATCH)}<span>${t('match')}</span></button>
      <button class="bbtn" data-tut="upgrades" id="bb-upgrades">${img(A.ICON_HAMMER)}<span>${t('upgrade')}</span></button>
    </div>
  </div>`);
  scene = root.querySelector<HTMLElement>('.scene')!;
  world = scene.querySelector<HTMLElement>('.world')!;
  world.querySelector<HTMLElement>('.ground')!.style.backgroundImage = `url("${A.svgUrl(A.LAWN_TILE)}")`;
  const decor = world.querySelector<HTMLElement>('.decor')!;
  decor.style.left = `${OFF_X}px`;
  decor.style.top = `${OFF_Y}px`;
  setCamera(cam.x, cam.y);
  root.querySelector('#bb-shop')!.addEventListener('click', () => gate('openShop') && openShop());
  root.querySelector('#bb-orders')!.addEventListener('click', () => gate('openOrders') && openOrders());
  root.querySelector('#bb-match')!.addEventListener('click', () => gate('openMatch') && openMatchMap());
  root.querySelector('#bb-upgrades')!.addEventListener('click', () => gate('openUpgrades') && openUpgradeShop());
  root.querySelector('#btn-settings')!.addEventListener('click', () => gate('openSettings') && openSettings());
  // The coin pill opens the studio's coin shop when that module is on; otherwise it is just the counter.
  root.querySelector('#hud-coinbtn')!.addEventListener('click', () => { if (!St.tutorialActive()) FalconSDK.shop.open('header_coin'); });
  root.querySelector('#hud-gembtn')!.addEventListener('click', () => { if (!St.tutorialActive()) FalconSDK.shop.open('header_gem'); });
  scene.addEventListener('pointerdown', onScenePress);
  // A pan, a long press or a move in progress swallows the click that ends it (✓ / ✕ excepted).
  scene.addEventListener('click', (e) => {
    if ((e.target as Element).closest('.movectl')) return;
    if (swallowClick || moving) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  // A press anywhere outside the tray / time panel closes them (the press itself still goes through).
  root.addEventListener('pointerdown', (e) => {
    const target = e.target as Element;
    if (tray && !tray.el.contains(target)) closeTray();
    if (info && !info.el.contains(target)) closeInfo();
  }, true);
  St.onChange(() => { if (root?.classList.contains('on')) { updateFarm(); rerenderPopup(); tutorial.render(); } });
  St.onEvent(onGameEvent);
  stage().appendChild(root);
  return root;
}

export function showFarm(): void {
  buildFarm();
  root!.classList.add('on');
  updateFarm();
  clearInterval(timerHandle);
  timerHandle = window.setInterval(() => { St.tick(); updateTimers(); }, 500);
  tutorial.setFarmVisible(true);
  tutorial.render();
}

export function hideFarm(): void {
  stopInteractions();
  closePopup();
  root?.classList.remove('on');
  clearInterval(timerHandle);
  tutorial.setFarmVisible(false);
}

/** Drop whatever the finger is doing (pan, carry, a tool in hand, an open tray). */
function stopInteractions(): void {
  endPress();
  if (moving) cancelMove();
  endDrag();
  closeTray();
  closeInfo();
}

/** "Reset all game": wipe the save, rebuild the map from scratch and restart the walkthrough. */
function resetGame(): void {
  stopInteractions();
  closePopup();
  St.resetAll();
  for (const e of world!.querySelectorAll(':scope > [data-key]')) e.remove();
  sigs.clear();
  cells.clear();
  setCamera(OFF_X, OFF_Y);
  updateFarm();
  tutorial.restart();
  toast(t('reset_done'));
}

// ---------------------------------------------------------------------------
// Map objects: which exist, where they stand, how they are drawn

/** Everything the player owns on the map. A start save has the barn, the silo and six fields. */
function ownedKeys(): string[] {
  const keys = ['barn', 'silo', ...S.farm.plots.map((_, i) => `plot${i}`)];
  if (S.farm.coopBuilt) keys.push('coop');
  for (const id of MACHINE_IDS) if (S.farm.machines[id].owned) keys.push(id);
  return keys;
}
/** Owned objects plus a just-bought one that is still being placed. */
const presentKeys = (): string[] => (moving?.buy ? [...ownedKeys(), moving.key] : ownedKeys());

const objEl = (key: string): HTMLElement | null => world!.querySelector<HTMLElement>(`:scope > [data-key="${key}"]`);
const plotEl = (i: number): HTMLElement => objEl(`plot${i}`)!;

/** Current grid cell of every object on the map (the lifted one: its candidate cell). */
const cells = new Map<string, { a: number; b: number }>();

function makeObj(key: string): HTMLElement {
  let html: string;
  let onTap: () => void;
  if (key.startsWith('plot')) {
    const i = Number(key.slice(4));
    html = `<button class="plot" data-tut="${key}"></button>`;
    onTap = () => tapPlot(i);
  } else if (key === 'barn' || key === 'silo') {
    html = `<button class="obj" data-tut="${key}"></button>`;
    onTap = () => { if (gate(key === 'barn' ? 'openBarn' : 'openSilo')) openInventory(key); };
  } else if (key === 'coop') {
    html = `<button class="obj coop" data-tut="coop"></button>`;
    onTap = tapCoop;
  } else {
    html = `<button class="obj" data-tut="${key === 'feedmill' ? 'mill' : key}"></button>`;
    onTap = () => tapMachine(key);
  }
  const e = el(html);
  e.dataset.key = key;
  e.addEventListener('click', onTap);
  world!.appendChild(e);
  return e;
}

/** Create / remove map elements so they match what the player owns. */
function syncObjects(): void {
  const want = presentKeys();
  for (const e of [...world!.querySelectorAll<HTMLElement>(':scope > [data-key]')]) {
    const key = e.dataset.key!;
    if (want.includes(key)) continue;
    e.remove();
    sigs.delete(key);
    cells.delete(key);
  }
  for (const key of want) {
    if (objEl(key)) continue;
    makeObj(key);
    const at = moving?.key === key ? moving.at : St.layoutOf(key) ?? findFree(key, X0, Y0);
    placeObj(key, at.a, at.b);
  }
}

function setObj(key: string, sig: string, html: string, cls = ''): void {
  const e = objEl(key);
  if (!e || sigs.get(key) === sig) return;
  sigs.set(key, sig);
  e.innerHTML = html;
  const keep = ['moving', 'blocked', 'pressing', 'tut-hl', 'coop'].filter((c) => e.classList.contains(c));
  e.className = [e.classList.contains('plot') ? 'plot' : 'obj', cls, ...keep].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Camera & grid placement

function setCamera(x: number, y: number): void {
  cam.x = Math.max(0, Math.min(WORLD_W - VIEW_W, x));
  cam.y = Math.max(0, Math.min(WORLD_H - VIEW_H, y));
  world!.style.transform = `translate(${-cam.x}px, ${-cam.y}px)`;
  placeMoveCtl();
}

const sizeOf = (key: string): number => FOOTPRINT[key.startsWith('plot') ? 'plot' : key];

/** World-px centre of the footprint whose front cell is (a, b). */
function footCenter(key: string, a: number, b: number): { x: number; y: number } {
  const n = sizeOf(key);
  return { x: X0 + 26 * (a - b), y: Y0 - 13 * (a + b + n - 1) };
}

/** Snap a footprint centre (world px) to the nearest grid placement. */
function snap(key: string, x: number, y: number): { a: number; b: number } {
  const n = sizeOf(key);
  const u = Math.round((x - X0) / 26);
  const par = ((u % 2) + 2) % 2;
  const v = 2 * Math.round(((Y0 - y) / 13 - (n - 1) - par) / 2) + par; // a + b shares u's parity
  return { a: (u + v) / 2, b: (v - u) / 2 };
}

/** Put an object on the map: fields are centred on their tile, buildings stand on the footprint's front tip. */
function placeObj(key: string, a: number, b: number): void {
  const e = objEl(key);
  if (!e) return;
  cells.set(key, { a, b });
  const c = footCenter(key, a, b);
  const y = key.startsWith('plot') ? c.y + 7 : c.y + 13 * sizeOf(key);
  e.style.left = `${c.x}px`;
  e.style.top = `${y}px`;
  // Objects nearer the camera (lower on the map) draw on top; a lifted one floats above all.
  e.style.zIndex = String(moving?.key === key ? 100000 : Math.round(y));
}

/** True when the footprint stays on the map and overlaps no other object on it. */
function canPlace(key: string, a: number, b: number): boolean {
  const n = sizeOf(key);
  const c = footCenter(key, a, b);
  if (c.x - 26 * n < 0 || c.x + 26 * n > WORLD_W || c.y - 13 * n - 150 < 0 || c.y + 13 * n > WORLD_H) return false;
  for (const [other, o] of cells) {
    if (other === key) continue;
    const m = sizeOf(other);
    if (!(a + n <= o.a || o.a + m <= a || b + n <= o.b || o.b + m <= b)) return false;
  }
  return true;
}

/** The free placement nearest to a world point (spiralling out over the grid). */
function findFree(key: string, x: number, y: number): { a: number; b: number } {
  const s = snap(key, x, y);
  for (let r = 0; r < 60; r++) {
    for (let da = -r; da <= r; da++) {
      for (let db = -r; db <= r; db++) {
        if (Math.max(Math.abs(da), Math.abs(db)) !== r) continue;
        if (canPlace(key, s.a + da, s.b + db)) return { a: s.a + da, b: s.b + db };
      }
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Pan & move. One press on the map: a drag pans the camera; holding still on a building
// or field for MOVE_HOLD_MS lifts it; a press on the lifted object drags it on the grid.

let press: { x: number; y: number; camX: number; camY: number; key: string | null; timer: number; mode: 'wait' | 'pan' | 'carry'; dx: number; dy: number } | null = null;
/** The lifted object. `buy` is set while placing a just-bought one: ✓ pays, ✕ cancels the purchase. */
let moving: { key: string; from: { a: number; b: number } | null; at: { a: number; b: number }; ctl: HTMLElement; foot: HTMLElement; buy?: () => string } | null = null;
let swallowClick = false;

function worldPoint(clientX: number, clientY: number): { x: number; y: number } {
  const r = scene!.getBoundingClientRect();
  const k = r.width / VIEW_W;
  return { x: (clientX - r.left) / k + cam.x, y: (clientY - r.top) / k + cam.y };
}

function onScenePress(ev: PointerEvent): void {
  if (press || ev.button > 0 || (ev.target as Element).closest('.movectl')) return;
  const hit = (ev.target as Element).closest<HTMLElement>('[data-key]')?.dataset.key ?? null;
  const key = hit && presentKeys().includes(hit) ? hit : null;
  press = { x: ev.clientX, y: ev.clientY, camX: cam.x, camY: cam.y, key, timer: 0, mode: 'wait', dx: 0, dy: 0 };
  if (moving && key === moving.key) startCarry(ev);
  else if (key && !moving) {
    objEl(key)!.classList.add('pressing');
    press.timer = window.setTimeout(() => {
      if (!press) return;
      const at = cells.get(key)!;
      liftObj(key, { ...at }, { ...at });
      startCarry(ev);
    }, MOVE_HOLD_MS);
  }
  window.addEventListener('pointermove', onPressMove);
  window.addEventListener('pointerup', onPressUp);
  window.addEventListener('pointercancel', onPressUp);
}

/** Grab the lifted object: remember where on its footprint the finger holds it. */
function startCarry(ev: PointerEvent): void {
  if (!press || !moving) return;
  const p = worldPoint(ev.clientX, ev.clientY);
  const c = footCenter(moving.key, moving.at.a, moving.at.b);
  press.mode = 'carry';
  press.dx = p.x - c.x;
  press.dy = p.y - c.y;
  swallowClick = true;
}

function onPressMove(ev: PointerEvent): void {
  if (!press) return;
  if (press.mode === 'wait' && Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > 8) {
    clearTimeout(press.timer);
    if (press.key) objEl(press.key)?.classList.remove('pressing');
    press.mode = 'pan';
    swallowClick = true;
    closeTray();
    closeInfo();
  }
  if (press.mode === 'pan') {
    const k = scene!.getBoundingClientRect().width / VIEW_W;
    setCamera(press.camX - (ev.clientX - press.x) / k, press.camY - (ev.clientY - press.y) / k);
    tutorial.render();
  } else if (press.mode === 'carry' && moving) {
    const p = worldPoint(ev.clientX, ev.clientY);
    const at = snap(moving.key, p.x - press.dx, p.y - press.dy);
    if (at.a !== moving.at.a || at.b !== moving.at.b) { moving.at = at; showMove(); }
  }
}

function onPressUp(): void {
  endPress();
  // The click that follows this pointerup is swallowed; later ones go through.
  setTimeout(() => { swallowClick = false; }, 0);
}

function endPress(): void {
  window.removeEventListener('pointermove', onPressMove);
  window.removeEventListener('pointerup', onPressUp);
  window.removeEventListener('pointercancel', onPressUp);
  if (!press) return;
  clearTimeout(press.timer);
  if (press.key) objEl(press.key)?.classList.remove('pressing');
  press = null;
}

function liftObj(key: string, from: { a: number; b: number } | null, at: { a: number; b: number }, buy?: () => string): void {
  closeTray();
  closeInfo();
  closePopup();
  const ctl = el(`<div class="movectl"><button class="mv-ok" data-tut="place:ok">${OK_SVG}</button><button class="mv-no">${NO_SVG}</button></div>`);
  ctl.querySelector('.mv-ok')!.addEventListener('click', confirmMove);
  ctl.querySelector('.mv-no')!.addEventListener('click', cancelMove);
  const n = sizeOf(key);
  const foot = el(`<div class="footprint"><svg viewBox="0 0 ${52 * n} ${26 * n}" width="${52 * n}" height="${26 * n}"><polygon points="${26 * n},0 ${52 * n},${13 * n} ${26 * n},${26 * n} 0,${13 * n}"/></svg></div>`);
  world!.append(foot, ctl);
  moving = { key, from, at, ctl, foot, buy };
  syncObjects();
  updateFarm();
  const e = objEl(key)!;
  e.classList.remove('pressing');
  e.classList.add('moving');
  if (press) swallowClick = true; // lifted by a long press: its release is not a tap
  showMove();
  tutorial.render();
}

/** A just-bought building / field appears lifted at a free spot in view; ✓ pays and places it. */
function startPlacing(key: string, buy: () => string): void {
  stopInteractions();
  const at = findFree(key, cam.x + VIEW_W / 2, cam.y + VIEW_H / 2);
  liftObj(key, null, at, buy);
}

/** Redraw the lifted object at its candidate cell: green footprint and ✓ when free, red and grey ✓ when not. */
function showMove(): void {
  if (!moving) return;
  const { key, at, foot } = moving;
  placeObj(key, at.a, at.b);
  const ok = canPlace(key, at.a, at.b);
  const c = footCenter(key, at.a, at.b);
  objEl(key)?.classList.toggle('blocked', !ok);
  foot.classList.toggle('blocked', !ok);
  foot.style.left = `${c.x}px`;
  foot.style.top = `${c.y}px`;
  placeMoveCtl();
  moving.ctl.querySelector<HTMLButtonElement>('.mv-ok')!.disabled = !ok;
}

/** ✓ / ✕ sit under the lifted object, but always inside the view so they can be pressed. */
function placeMoveCtl(): void {
  if (!moving) return;
  const { key, at, ctl } = moving;
  const c = footCenter(key, at.a, at.b);
  const y = c.y + 13 * sizeOf(key) + 14;
  ctl.style.left = `${Math.max(cam.x + 62, Math.min(cam.x + VIEW_W - 62, c.x))}px`;
  ctl.style.top = `${Math.max(cam.y + 8, Math.min(cam.y + VIEW_H - 60, y))}px`;
}

function confirmMove(): void {
  if (!moving || !canPlace(moving.key, moving.at.a, moving.at.b)) return;
  const { key, at, buy } = moving;
  if (buy && !report(buy())) return;
  St.setLayout(key, at.a, at.b);
  finishMove(at);
}

function cancelMove(): void {
  if (!moving) return;
  if (moving.buy || !moving.from) { finishMove(null); return; }
  finishMove(moving.from);
}

/** Put the lifted object down at `at`; null drops a building that was never bought. */
function finishMove(at: { a: number; b: number } | null): void {
  const m = moving!;
  moving = null;
  m.ctl.remove();
  m.foot.remove();
  objEl(m.key)?.classList.remove('moving', 'blocked');
  if (at) placeObj(m.key, at.a, at.b);
  syncObjects();
  updateFarm();
  tutorial.render();
}

const OK_SVG = '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NO_SVG = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';

// ---------------------------------------------------------------------------
// Drawing. No name labels under buildings: the barn / silo show their fill only when tapped.

export function updateFarm(): void {
  if (!root) return;
  syncObjects();
  root.querySelector('#hud-coin')!.textContent = String(S.wallet.coin);
  root.querySelector('#hud-gem')!.textContent = String(S.wallet.gem);
  root.querySelector('#hud-star')!.textContent = String(S.wallet.star);
  const lvl = St.farmLevel();
  root.querySelector('#hud-lvl')!.textContent = `${t('level')} ${lvl}`;
  const next = xpForNextLevel(lvl);
  const base = XP_THRESHOLDS[lvl] ?? 0;
  const pct = next === null ? 100 : Math.min(100, ((S.progress.xp - base) / (next - base)) * 100);
  (root.querySelector('#hud-xp') as HTMLElement).style.width = `${pct}%`;
  const ready = S.farm.orders.filter(St.canFulfil).length;
  const badge = root.querySelector<HTMLElement>('#orders-badge')!;
  badge.style.display = ready ? '' : 'none';
  badge.textContent = String(ready);

  setObj('barn', 'barn', img(A.ICON_BARN, 'bld', 140));
  setObj('silo', 'silo', img(A.ICON_SILO, 'bld', 130));
  // Machines: the building, a bubble while finished batches wait, a gentle bob while working.
  for (const id of MACHINE_IDS) {
    const { done, running } = St.machineJobs(id);
    const out = done.length ? `<span class="bubble">${img(A.ITEM_ICON[RECIPES[done[0].recipe].output])}${done.length > 1 ? `<b>${done.length}</b>` : ''}</span>` : '';
    setObj(id, `${done.length}:${!!running}`, `${img(MACHINE_ICON[id], 'bld', 120)}${out}`, running ? 'working' : '');
  }
  if (tray && 'machine' in tray.origin) renderSlots(tray.origin.machine);
  // The coop: yard + back fences, the chickens inside, then the front fences over them.
  const chickSig = S.farm.chickens.map((c) => c.status).join(',');
  setObj('coop', chickSig, `${img(A.COOP_BACK, 'pen')}${S.farm.chickens.map((c, i) => chickHtml(c, i)).join('')}${img(A.COOP_FRONT, 'pen')}`);
  // Fields: an iso soil tile with the crop standing on it. No timers on the field; tapping a
  // growing field shows its time left.
  const soil = img(A.PLOT_SOIL, 'soil');
  S.farm.plots.forEach((p, i) => {
    if (p.status === 'empty') { setObj(`plot${i}`, 'empty', soil); return; }
    const stages = A.CROP_STAGE[p.crop!];
    if (p.status === 'ready') { setObj(`plot${i}`, `ready:${p.crop}`, `${soil}${img(stages[2], 'crop')}`, 'ready'); return; }
    const stage = growFraction(p) < 0.5 ? 0 : 1;
    setObj(`plot${i}`, `growing:${p.crop}:${stage}`, `${soil}${img(stages[stage], 'crop')}`, 'growing');
  });
  if (info && !info.alive()) closeInfo();
  refreshCounts();
}

/** A chicken in its pen slot: hungry (asks for feed) → feeding (eats, a bar fills) → ready (an egg). */
function chickHtml(c: St.ChickenState, i: number): string {
  const s = A.COOP_SLOTS[i];
  const badge = c.status === 'hungry' ? `<span class="cb">${img(FEED)}</span>`
    : c.status === 'ready' ? `<span class="cb egg">${img(A.ICON_EGG)}</span>`
      : `<span class="cbar"><i data-chickbar="${i}"></i></span>`;
  return `<span class="chick ${c.status}" data-chick="${i}" data-tut="chick${i}" style="left:${s.x}px;top:${s.y}px">${img(A.ICON_CHICKEN)}${badge}</span>`;
}

const growMs = (crop: string): number => (St.tutorialActive() ? CROPS[crop].tutorialSeconds : CROPS[crop].growSeconds) * 1000;
const layMs = (): number => (St.tutorialActive() ? ANIMALS.chicken.tutorialSeconds : ANIMALS.chicken.produceSeconds) * 1000;
const recipeMs = (r: string): number => (St.tutorialActive() ? RECIPES[r].tutorialSeconds : RECIPES[r].seconds) * 1000;
/** 0 → just started, 1 → done. */
const fraction = (readyAt: number, total: number): number => Math.max(0, Math.min(1, 1 - (readyAt - St.now()) / total));
const growFraction = (p: St.PlotState): number => fraction(p.readyAt, growMs(p.crop!));

function updateTimers(): void {
  const now = St.now();
  for (const e of stage().querySelectorAll<HTMLElement>('[data-timer]')) e.textContent = fmtTime(Number(e.dataset.timer) - now);
  info?.update();
  for (const e of world?.querySelectorAll<HTMLElement>('[data-chickbar]') ?? []) {
    const c = S.farm.chickens[Number(e.dataset.chickbar)];
    if (c?.status === 'feeding') e.style.width = `${fraction(c.readyAt, layMs()) * 100}%`;
  }
  // Growth stage flips at half time without a state change.
  if (S.farm.plots.some((p) => p.status === 'growing')) updateFarm();
}

// ---------------------------------------------------------------------------
// Taps on the map

function tapPlot(i: number): void {
  const p = S.farm.plots[i];
  if (p.status === 'growing') {
    showInfo(plotEl(i), t(p.crop!), p.readyAt, growMs(p.crop!), true, () => S.farm.plots[i]?.status === 'growing',
      { cost: () => St.plotSkipCost(i), run: () => St.skipPlot(i) });
    return;
  }
  if (!gate('openPlot', i)) return;
  if (p.status === 'empty') {
    openTray(plotEl(i), { plot: i }, Object.values(CROPS).map((c) => ({
      tut: `seed:${c.id}`,
      html: `${img(A.ITEM_ICON[c.id])}<b class="qty" data-count="${c.id}"></b>${gemBtn(CROP_GEM_PRICE, `data-gembuy="${c.id}"`, 'corner')}`,
      tool: c.unlockLevel <= St.farmLevel() ? { kind: 'seed', crop: c.id } as Tool : null,
    })));
  } else openTray(plotEl(i), { plot: i }, [{ tut: 'sickle', html: img(SICKLE), tool: { kind: 'sickle' } }]);
}

function tapCoop(): void {
  if (!gate('openCoop')) return;
  openTray(objEl('coop')!, { coop: true }, [
    { tut: 'tool:feed', html: `${img(FEED)}<b class="qty" data-count="feed"></b>`, tool: { kind: 'feed' } },
    { tut: 'tool:basket', html: img(BASKET), tool: { kind: 'basket' } },
  ]);
}

/** Tap a machine: finished batches are collected first; otherwise the tray opens with its
 *  products (hold one for the recipe, drop it into the machine) and its production slots. */
function tapMachine(id: string): void {
  if (St.machineJobs(id).done.length) {
    if (!gate('collectOutput', id)) return;
    const { err, got } = St.collectOutput(id);
    if (got.length) popAt(objEl(id)!, got.map((g) => `${img(A.ITEM_ICON[g.item])}+${g.qty}`).join(' '));
    else report(err);
    return;
  }
  if (!gate('openMachine', id)) return;
  openTray(objEl(id)!, { machine: id }, MACHINES[id].recipes.map((rid) => ({
    tut: `prod:${rid}`,
    html: `${img(A.ITEM_ICON[RECIPES[rid].output])}<b class="qty" data-count="${RECIPES[rid].output}"></b>`,
    tool: RECIPES[rid].unlockLevel <= St.farmLevel() ? { kind: 'product', machine: id, recipe: rid } as Tool : null,
  })));
}

/** The machine tray's slot row: running (time left), waiting, finished, empty, then "+" to buy a slot. */
function renderSlots(id: string): void {
  if (!tray) return;
  let row = tray.el.querySelector<HTMLElement>('.slotrow');
  if (!row) {
    row = el('<div class="slotrow"></div>');
    row.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (target.closest('.buyslot')) buySlot(id);
      else if (target.closest('[data-skip]') && gemReport(St.skipMachine(id))) popAt(objEl(id)!, `${img(A.ICON_GEM)}-`);
    });
    tray.el.appendChild(row);
  }
  const m = S.farm.machines[id];
  const { done, running, waiting } = St.machineJobs(id);
  const box = (j: St.MachineJob, cls: string, extra: string): string => `<div class="slot ${cls}">${img(A.ITEM_ICON[RECIPES[j.recipe].output])}${extra}</div>`;
  let html = done.map((j) => box(j, 'done', '<i class="ok">✓</i>')).join('');
  if (running) html += box(running, 'run', `<b data-timer="${running.readyAt}">${fmtTime(running.readyAt - St.now())}</b>${gemBtn(St.machineSkipCost(id), 'data-skip', 'corner')}`);
  html += waiting.map((j) => box(j, 'wait', `<b>${t('waiting')}</b>`)).join('');
  for (let k = m.queue.length; k < m.slots; k++) html += '<div class="slot empty"></div>';
  if (m.slots < MACHINE_SLOTS_MAX) html += `<button class="slot buyslot" data-tut="slot:buy"><span>+</span><b class="price">${img(A.ICON_COIN)}${slotPrice(m.slots)}</b></button>`;
  const sig = `${html.replace(/data-timer="\d+">[^<]*/g, '')}`;
  if (row.dataset.sig === sig) return;
  row.dataset.sig = sig;
  row.innerHTML = html;
}

function buySlot(id: string): void {
  const price = slotPrice(S.farm.machines[id].slots);
  const err = St.buySlot(id);
  if (err === 'err_coin') { if (!FalconSDK.shop.open(`buy_slot_${id}`)) toast(t('err_coin'), 'warn'); return; }
  if (report(err)) toast(t('slot_bought', { n: S.farm.machines[id].slots, price }));
}

function popAt(e: Element, html: string): void {
  const c = centerOf(e);
  floatLabel(c.x, c.y - 30, html);
}

function onGameEvent(e: St.GameEvent): void {
  if (!root?.classList.contains('on')) return;
  if (e.type === 'collectBlocked') toast(t(e.storage === 'barn' ? 'barn_full' : 'silo_full'), 'warn');
  if (e.type === 'levelUp') showLevelUp(e.level);
  if (e.type === 'xp' && e.delta > 0) { const c = centerOf(root.querySelector('.pill.lvl')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_XP)}+${e.delta}`); }
}

// ---------------------------------------------------------------------------
// Trays and tools. A tray opens above what was tapped; its tools are held and swept
// (seed / sickle over fields, feed / basket over chickens) or dropped (a product into its machine).

type Tool =
  | { kind: 'seed'; crop: string }
  | { kind: 'sickle' }
  | { kind: 'feed' }
  | { kind: 'basket' }
  | { kind: 'product'; machine: string; recipe: string };
type Origin = { plot: number } | { coop: true } | { machine: string };
interface TrayItem { tut: string; html: string; tool: Tool | null }

let tray: { el: HTMLElement; origin: Origin } | null = null;
let info: { el: HTMLElement; timer: number; update: () => void; alive: () => boolean } | null = null;
let tip: HTMLElement | null = null;
let drag: { tool: Tool; ghost: HTMLElement; origin: Origin; x: number; y: number; moved: boolean; done: Set<string>; stopped: boolean } | null = null;

/** Place a floating panel above `anchor` (for a field: above the fields around it, so it hides none). */
function placePanel(e: HTMLElement, anchor: Element, gap: number, aroundFields: boolean): void {
  const c = centerOf(anchor);
  let top = toStage(0, anchor.getBoundingClientRect().top).y;
  if (aroundFields) {
    const near = S.farm.plots.map((_, j) => centerOf(plotEl(j))).filter((q) => Math.abs(q.x - c.x) < 160 && q.y <= c.y && c.y - q.y < 140);
    top = Math.min(...near.map((q) => q.y)) - 30;
  }
  root!.appendChild(e);
  const w = e.offsetWidth;
  e.style.left = `${Math.max(8, Math.min(VIEW_W - 8 - w, c.x - w / 2))}px`;
  e.style.top = `${Math.max(80, top - gap - e.offsetHeight)}px`;
}

function openTray(anchor: HTMLElement, origin: Origin, items: TrayItem[]): void {
  closeTray();
  closeInfo();
  const e = el('<div class="tooltray"></div>');
  for (const it of items) {
    const b = el(`<div class="tool${it.tool ? '' : ' locked'}" data-tut="${it.tut}">${it.html}</div>`);
    // The gem button buys one unit; it must not pick the tool up.
    b.querySelector<HTMLElement>('[data-gembuy]')?.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const crop = (ev.currentTarget as HTMLElement).dataset.gembuy!;
      if (gemReport(St.buyCropWithGems(crop))) popAt(b, `${img(A.ITEM_ICON[crop])}+1`);
    });
    if (it.tool) { const tool = it.tool; b.addEventListener('pointerdown', (ev) => startDrag(ev, tool, origin)); }
    else b.addEventListener('pointerdown', () => toast(t('err_level'), 'warn'));
    e.appendChild(b);
  }
  if ('coop' in origin) e.appendChild(el('<div class="skiprow"></div>'));
  tray = { el: e, origin };
  if ('machine' in origin) renderSlots(origin.machine);
  placePanel(e, anchor, 'plot' in origin ? 34 : 6, 'plot' in origin);
  refreshCounts();
  tutorial.render();
}

function closeTray(): void {
  if (!tray) return;
  tray.el.remove();
  tray = null;
  tutorial.render();
}

/** What a counter badge shows: the stock (a crop not yet unlocked shows its level). */
function countBadge(item: string): string {
  const crop = CROPS[item];
  if (crop && crop.unlockLevel > St.farmLevel()) return `${img(A.ICON_LOCK)}${crop.unlockLevel}`;
  return String(St.count(item));
}

/** Keep every counter (tray + the tool in hand) on the live stock; a consumable at 0 greys out in hand. */
function refreshCounts(): void {
  for (const q of stage().querySelectorAll<HTMLElement>('[data-count]')) {
    q.innerHTML = countBadge(q.dataset.count!);
    if (q.parentElement?.classList.contains('dragtool')) q.parentElement.classList.toggle('empty', St.count(q.dataset.count!) <= 0);
  }
  // Out of a crop (and it is unlocked): its gem button shows.
  for (const g of stage().querySelectorAll<HTMLElement>('[data-gembuy]')) {
    const c = CROPS[g.dataset.gembuy!];
    g.style.display = St.count(c.id) <= 0 && c.unlockLevel <= St.farmLevel() ? '' : 'none';
  }
  if (tray && 'coop' in tray.origin) renderCoopSkip();
}

/** Time left on a growing field or a working machine (only shown when tapped). */
function showInfo(anchor: HTMLElement, title: string, readyAt: number, total: number, aroundFields: boolean, alive: () => boolean,
  skip?: { cost: () => number; run: () => string }): void {
  closeTray();
  closeInfo();
  const e = el(`<div class="plotinfo"><b>${title}</b><div class="bar"><i style="width:${fraction(readyAt, total) * 100}%"></i></div>
    <span>${t('time_left')} <b data-timer="${readyAt}">${fmtTime(readyAt - St.now())}</b></span>${skip ? gemBtn(skip.cost(), 'data-skip', 'wide', t('finish_now')) : ''}</div>`);
  const bar = e.querySelector<HTMLElement>('.bar i')!;
  const cost = e.querySelector<HTMLElement>('[data-skip] b');
  e.querySelector('[data-skip]')?.addEventListener('click', () => {
    if (!skip || !gemReport(skip.run())) return;
    closeInfo();
    popAt(anchor, `${img(A.ICON_GEM)}-`);
  });
  info = {
    el: e,
    timer: window.setTimeout(closeInfo, skip ? 5000 : 3000),
    update: () => { bar.style.width = `${fraction(readyAt, total) * 100}%`; if (cost && skip) cost.textContent = String(skip.cost()); },
    alive,
  };
  placePanel(e, anchor, 30, aroundFields);
}

/** A gem price button. `corner` sits on a tray icon's lower-right corner; `wide` carries a label. */
function gemBtn(cost: number, attr: string, cls: string, label = ''): string {
  return `<button class="gembtn ${cls}" ${attr}>${label ? `<span>${label}</span>` : ''}${img(A.ICON_GEM)}<b>${cost}</b></button>`;
}

/** Toast a gem action's error; short of gems, the studio shop gets a chance first. */
function gemReport(err: string): boolean {
  if (!err) return true;
  if (err === 'err_gem' && FalconSDK.shop.open('buy_gems')) return false;
  toast(t(err), 'warn');
  return false;
}

/** The coop tray's "lay now" row while any chicken is eating. */
function renderCoopSkip(): void {
  const row = tray?.el.querySelector<HTMLElement>('.skiprow');
  if (!row) return;
  const cost = St.chickensSkipCost();
  const sig = String(cost);
  if (row.dataset.sig === sig) return;
  row.dataset.sig = sig;
  row.innerHTML = cost ? gemBtn(cost, 'data-skip', 'wide', t('lay_now')) : '';
  row.style.display = cost ? '' : 'none';
  row.querySelector('[data-skip]')?.addEventListener('click', () => { if (gemReport(St.skipChickens())) popAt(objEl('coop')!, `${img(A.ICON_EGG)}!`); });
}

function closeInfo(): void {
  if (!info) return;
  clearTimeout(info.timer);
  info.el.remove();
  info = null;
}

/** The recipe of a product, shown while it is held: inputs (have / need), time, output. */
function showTip(machine: string, rid: string): void {
  closeTip();
  const r = RECIPES[rid];
  const inputs = r.inputs.map((x) => `<div class="cell ${St.count(x.item) >= x.qty ? 'ok' : 'no'}">${img(A.ITEM_ICON[x.item])}<b>${St.count(x.item)}/${x.qty}</b></div>`).join('');
  tip = el(`<div class="recipetip"><b>${t(r.output)} ×${r.outputQty}</b><small>${t(machine)} · ${fmtTime(recipeMs(rid))}</small><div class="need">${inputs}</div></div>`);
  placePanel(tip, tray?.el ?? objEl(machine)!, 8, false);
}

function closeTip(): void {
  tip?.remove();
  tip = null;
}

/** Index of the field whose diamond top face contains the client point, or -1. */
function plotAt(x: number, y: number): number {
  for (let i = 0; i < S.farm.plots.length; i++) {
    const r = plotEl(i).getBoundingClientRect();
    // The top face is the upper 46 of the tile's 60 px: a 2:1 diamond.
    const hw = r.width / 2;
    const hh = (r.height * 23) / 60;
    if (Math.abs(x - (r.left + hw)) / hw + Math.abs(y - (r.top + hh)) / hh <= 1) return i;
  }
  return -1;
}

/** Index of the chicken under the client point, or -1. */
function chickAt(x: number, y: number): number {
  for (const e of objEl('coop')?.querySelectorAll<HTMLElement>('.chick') ?? []) {
    const r = e.getBoundingClientRect();
    if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return Number(e.dataset.chick);
  }
  return -1;
}

function overMachine(id: string, x: number, y: number): boolean {
  const e = objEl(id)?.querySelector('.bld');
  if (!e) return false;
  const r = e.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function startDrag(ev: PointerEvent, tool: Tool, origin: Origin): void {
  ev.preventDefault();
  endDrag();
  // A seed / the feed in hand carries its stock counter; at 0 it can still be swept around but does nothing.
  const icon = tool.kind === 'seed' ? A.ITEM_ICON[tool.crop] : tool.kind === 'sickle' ? SICKLE : tool.kind === 'feed' ? FEED
    : tool.kind === 'basket' ? BASKET : A.ITEM_ICON[RECIPES[tool.recipe].output];
  const counter = tool.kind === 'seed' ? `<b class="qty" data-count="${tool.crop}"></b>` : tool.kind === 'feed' ? '<b class="qty" data-count="feed"></b>' : '';
  const ghost = el(`<div class="dragtool">${img(icon)}${counter}</div>`);
  stage().appendChild(ghost);
  drag = { tool, ghost, origin, x: ev.clientX, y: ev.clientY, moved: false, done: new Set(), stopped: false };
  if (tool.kind === 'product') showTip(tool.machine, tool.recipe);
  refreshCounts();
  tray?.el.classList.add('dragging');
  moveGhost(ev.clientX, ev.clientY);
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragUp);
  window.addEventListener('pointercancel', onDragUp);
}

function moveGhost(x: number, y: number): void {
  const p = toStage(x, y);
  drag!.ghost.style.left = `${p.x}px`;
  drag!.ghost.style.top = `${p.y}px`;
}

function onDragMove(ev: PointerEvent): void {
  if (!drag) return;
  const { x: x0, y: y0, tool } = drag;
  const dist = Math.hypot(ev.clientX - x0, ev.clientY - y0);
  if (dist > 6) drag.moved = true;
  if (tool.kind === 'product') {
    objEl(tool.machine)?.classList.toggle('drop', overMachine(tool.machine, ev.clientX, ev.clientY));
  } else {
    // Sample the segment so a fast swipe cannot skip a field or a chicken.
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let s = 1; s <= steps; s++) {
      const x = x0 + ((ev.clientX - x0) * s) / steps;
      const y = y0 + ((ev.clientY - y0) * s) / steps;
      if (tool.kind === 'seed' || tool.kind === 'sickle') { const i = plotAt(x, y); if (i >= 0) applyTool(`plot${i}`); }
      else { const i = chickAt(x, y); if (i >= 0) applyTool(`chick${i}`); }
    }
  }
  drag.x = ev.clientX;
  drag.y = ev.clientY;
  moveGhost(ev.clientX, ev.clientY);
}

function onDragUp(): void {
  if (!drag) return;
  const { tool, origin, moved, done, x, y } = drag;
  let keepTray = false;
  if (tool.kind === 'product') {
    objEl(tool.machine)?.classList.remove('drop');
    // Dropped on the machine → start a batch; anywhere else → the tray stays for another try.
    if (overMachine(tool.machine, x, y)) startBatch(tool.machine, tool.recipe);
    else keepTray = true;
  } else if (!moved && !done.size && 'plot' in origin) applyTool(`plot${origin.plot}`); // a plain tap works on the tapped field
  endDrag();
  if (keepTray) tray?.el.classList.remove('dragging');
  else closeTray();
}

function endDrag(): void {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragUp);
  window.removeEventListener('pointercancel', onDragUp);
  drag?.ghost.remove();
  drag = null;
  closeTip();
  if (pendingLevelUp) { const lvl = pendingLevelUp; pendingLevelUp = 0; setTimeout(() => showLevelUp(lvl), 0); }
}

/** Use the tool in hand on a field / chicken, once per sweep. Out of seeds or feed does nothing
 *  more (the tool stays in hand); a full barn / silo stops the sweep with one toast. */
function applyTool(key: string): void {
  if (!drag || drag.stopped || drag.done.has(key)) return;
  const tool = drag.tool;
  let target: HTMLElement | null = null;
  if (key.startsWith('plot')) {
    const i = Number(key.slice(4));
    const p = S.farm.plots[i];
    if (tool.kind === 'seed') {
      if (p.status !== 'empty' || St.count(tool.crop) <= 0 || !tutorial.allows('plant', i) || St.plantCrop(i, tool.crop)) return;
    } else if (tool.kind === 'sickle') {
      if (p.status !== 'ready' || !tutorial.allows('harvest', i)) return;
      const crop = CROPS[p.crop!];
      if (St.harvest(i)) { drag.stopped = true; return; } // silo full: the collectBlocked event toasts it
      popAt(plotEl(i), `${img(A.ITEM_ICON[crop.id])}+${crop.yieldQty}`);
    } else return;
    target = plotEl(i);
  } else {
    const i = Number(key.slice(5));
    const c = S.farm.chickens[i];
    const e = objEl('coop')?.querySelector<HTMLElement>(`[data-chick="${i}"]`);
    if (!c || !e) return;
    if (tool.kind === 'feed') {
      if (c.status !== 'hungry' || St.count('feed') <= 0 || !tutorial.allows('feed', i) || St.feedChicken(i)) return;
      popAt(e, `${img(FEED)}-1`);
    } else if (tool.kind === 'basket') {
      if (c.status !== 'ready' || !tutorial.allows('collectEgg', i)) return;
      if (St.collectEgg(i)) { drag.stopped = true; return; } // barn full: the collectBlocked event toasts it
      popAt(e, `${img(A.ICON_EGG)}+${ANIMALS.chicken.produceQty}`);
    } else return;
    target = objEl('coop')?.querySelector<HTMLElement>(`[data-chick="${i}"]`) ?? null;
  }
  drag.done.add(key);
  if (target) {
    target.classList.remove('hit');
    void target.offsetWidth;
    target.classList.add('hit');
  }
}

/** A product dropped into its machine: start it, or list what is missing. */
function startBatch(machine: string, rid: string): void {
  if (!gate('startRecipe', machine)) return;
  const m = S.farm.machines[machine];
  if (m.queue.length >= m.slots) { toast(t('err_slots'), 'warn'); return; }
  const r = RECIPES[rid];
  const missing = r.inputs.filter((x) => St.count(x.item) < x.qty);
  if (missing.length) { showMissing(rid); return; }
  if (report(St.startRecipe(machine, rid))) popAt(objEl(machine)!, r.inputs.map((x) => `${img(A.ITEM_ICON[x.item])}-${x.qty}`).join(' '));
}

/** The level-up popup: the new level and everything it unlocks (a crop shows the seeds it comes with). */
let pendingLevelUp = 0;
function showLevelUp(level: number): void {
  // A level reached mid-sweep (a harvest gives XP) waits until the finger lifts.
  if (drag) { pendingLevelUp = Math.max(pendingLevelUp, level); return; }
  stopInteractions();
  const p = openPopup('levelup', t('level_up', { n: level }));
  setPopupRenderer(null);
  const unlocks = LEVEL_UNLOCKS[level] ?? [];
  const icon = (k: string): string => (k === 'coop' ? A.ICON_COOP : MACHINE_ICON[k] ?? A.ITEM_ICON[k]);
  p.body.appendChild(el(`<div class="lvlup-badge">${img(A.ICON_XP)}<b>${level}</b></div>`));
  if (unlocks.length) {
    p.body.appendChild(el(`<div class="center muted">${t('level_unlocks')}</div>`));
    p.body.appendChild(el(`<div class="grid unlocks">${unlocks.map((k) => `<div class="cell">${img(icon(k))}${CROPS[k] ? `<b class="gift">+${CROP_GIFT}</b>` : ''}<small>${t(k)}</small></div>`).join('')}</div>`));
  } else p.body.appendChild(el(`<div class="center muted" style="margin:6px 0 12px">${t('level_keep')}</div>`));
  const ok = el(`<div class="center"><button class="btn green">${t('ok')}</button></div>`);
  ok.querySelector('button')!.addEventListener('click', closePopup);
  p.body.appendChild(ok);
  tutorial.render();
}

function showMissing(rid: string): void {
  const r = RECIPES[rid];
  const p = openPopup('missing', t('missing_title'));
  const cells = r.inputs.filter((x) => St.count(x.item) < x.qty)
    .map((x) => `<div class="cell no">${img(A.ITEM_ICON[x.item])}<b>${St.count(x.item)}/${x.qty}</b><small>${t(x.item)} · ${t('missing_n', { n: x.qty - St.count(x.item) })}</small></div>`).join('');
  p.body.appendChild(el(`<div class="center muted">${t('missing_text', { name: t(r.output) })}</div>`));
  p.body.appendChild(el(`<div class="need">${cells}</div>`));
  const ok = el(`<div class="center"><button class="btn green">${t('ok')}</button></div>`);
  ok.querySelector('button')!.addEventListener('click', closePopup);
  p.body.appendChild(ok);
  setPopupRenderer(null);
}

// ---------------------------------------------------------------------------
// Popups

/** Buy a building / field from the Shop: it appears lifted on the map; ✓ pays and places it, ✕ cancels. */
function buyAndPlace(key: string, price: number, buy: () => string): void {
  if (!gate('buy', key.startsWith('plot') ? 'plot' : key)) return;
  if (S.wallet.coin < price) { if (!FalconSDK.shop.open(`buy_${key}`)) toast(t('err_coin'), 'warn'); return; }
  closePopup();
  startPlacing(key, buy);
}

export function openShop(): void {
  const p = openPopup('shop', t('shop'));
  const render = (): void => {
    p.body.innerHTML = '';
    const lvl = St.farmLevel();
    const addRow = (icon: string, name: string, desc: string, price: number, key: string, enabled: boolean, onBuy: () => void): void => {
      const row = el(`<div class="row${enabled ? '' : ' dim'}">${img(icon, 'ic')}<div class="info"><b>${name}</b><small>${desc}</small></div>
        <button class="btn orange small" data-tut="shop:${key}" ${enabled ? '' : 'disabled'}><span class="price">${img(A.ICON_COIN)}${price}</span></button></div>`);
      row.querySelector('button')!.addEventListener('click', onBuy);
      p.body.appendChild(row);
    };
    const fields = S.farm.plots.length;
    const maxF = maxPlots(lvl);
    addRow(A.PLOT_SOIL, t('plot'), fields >= maxF && lvl < 2 ? t('unlock_at', { n: 2 }) : `${fields}/${maxF}`, PLOT_COST, 'plot', fields < maxF,
      () => buyAndPlace(`plot${fields}`, PLOT_COST, () => St.buyPlot()));
    if (!S.farm.coopBuilt) {
      const open = lvl >= COOP_UNLOCK;
      addRow(A.ICON_COOP, t('coop'), open ? t('coop_desc', { n: COOP_CAPACITY }) : t('unlock_at', { n: COOP_UNLOCK }), COOP_COST, 'coop', open,
        () => buyAndPlace('coop', COOP_COST, () => St.buyCoop()));
    }
    addRow(A.ICON_CHICKEN, t('chicken'), S.farm.coopBuilt ? `${S.farm.chickens.length}/${COOP_CAPACITY} · ${t('feed')} → ${t('egg')}` : t('need_coop'), CHICKEN_COST, 'chicken',
      S.farm.coopBuilt && S.farm.chickens.length < COOP_CAPACITY, () => {
        if (!gate('buy', 'chicken')) return;
        if (report(St.buyChicken())) toast(t('chicken_in'));
      });
    for (const m of Object.values(MACHINES)) {
      if (S.farm.machines[m.id].owned) continue;
      const ok = m.unlockLevel <= lvl;
      addRow(MACHINE_ICON[m.id], t(m.id), ok ? m.recipes.map((r) => t(RECIPES[r].output)).join(', ') : t('unlock_at', { n: m.unlockLevel }), m.cost, m.id, ok,
        () => buyAndPlace(m.id, m.cost, () => St.buyMachine(m.id)));
    }
    // Boosters for the match game, bought with the same coins (hidden during the tutorial).
    if (!St.tutorialActive()) {
      p.body.appendChild(el(`<div class="section">${t('boosters')}</div>`));
      for (const b of BOOSTERS) {
        addRow(A.ITEM_ICON[b.key], t(`booster_${b.key}`), `${t(`booster_${b.key}_desc`)} ${t('booster_owned', { n: St.boosterCount(b.key) })}`, b.price, `booster_${b.key}`, true, () => {
          const err = St.buyBooster(b.key);
          if (err === 'err_coin') { if (!FalconSDK.shop.open(`buy_booster_${b.key}`)) toast(t('err_coin'), 'warn'); return; }
          if (report(err)) toast(t('booster_bought', { name: t(`booster_${b.key}`) }));
        });
      }
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

export function openInventory(type: StorageType): void {
  const p = openPopup('inventory', t('inventory'));
  let tab: StorageType = type;
  const render = (): void => {
    p.body.innerHTML = '';
    const tabs = el(`<div class="tabs"><button class="tab ${tab === 'silo' ? 'on' : ''}">${t('silo')}</button><button class="tab ${tab === 'barn' ? 'on' : ''}">${t('barn')}</button></div>`);
    tabs.querySelectorAll('button').forEach((b, i) => b.addEventListener('click', () => { tab = i === 0 ? 'silo' : 'barn'; render(); }));
    p.body.appendChild(tabs);
    const st = S.storage[tab];
    const used = St.used(tab);
    p.body.appendChild(el(`<div class="meter${used >= st.cap ? ' full' : ''}"><i style="width:${Math.min(100, (used / st.cap) * 100)}%"></i><b>${used} / ${st.cap}</b></div>`));
    const items = Object.entries(st.items).filter(([, q]) => q > 0);
    const grid = el('<div class="grid"></div>');
    for (const [item, q] of items) grid.appendChild(el(`<div class="cell">${img(A.ITEM_ICON[item])}<b>${q}</b><small>${t(item)}</small></div>`));
    if (!items.length) grid.appendChild(el(`<div class="cell" style="grid-column:span 4"><small>—</small></div>`));
    p.body.appendChild(grid);
    // Upgrade section
    const up = St.nextUpgrade(tab);
    if (!up) { p.body.appendChild(el(`<div class="center muted">${t('maxed')}</div>`)); return; }
    const need = up.required.map((r) => `<div class="cell ${St.count(r.item) >= r.qty ? 'ok' : 'no'}">${img(A.ITEM_ICON[r.item])}<b>${St.count(r.item)}/${r.qty}</b><small>${t(r.item)}</small></div>`).join('');
    const box = el(`<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><b class="center">${t('upgrade_to', { name: t(tab), n: up.tier })}</b>
      <div class="center muted">${t('cap_now', { a: st.cap, b: up.capacityAfter })}</div><div class="need">${need}</div>
      <div class="center"><button class="btn green" data-tut="${tab}:upgrade" ${St.canAffordUpgrade(tab) ? '' : 'disabled'}>${img(A.ICON_HAMMER)}${t('upgrade')}</button></div></div>`);
    box.querySelector('button')!.addEventListener('click', () => {
      if (!gate('upgrade', tab)) return;
      const before = st.cap;
      if (report(St.upgradeStorage(tab))) toast(t('cap_now', { a: before, b: S.storage[tab].cap }));
    });
    p.body.appendChild(box);
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

export function openUpgradeShop(): void {
  const p = openPopup('upgrades', t('upgrades'));
  const render = (): void => {
    p.body.innerHTML = '';
    p.body.appendChild(el(`<div class="center" style="font-weight:900;font-size:18px;display:flex;justify-content:center;align-items:center;gap:6px">${img(A.ICON_STAR, '', 28)} ${S.wallet.star} ${t('star')}</div>`));
    p.body.appendChild(el(`<div class="muted center">${t('shop_materials')}</div>`));
    for (const m of MATERIALS) {
      const price = MATERIAL_PRICE[m];
      const row = el(`<div class="row">${img(A.ITEM_ICON[m], 'ic')}<div class="info"><b>${t(m)}</b><small>${t('owned')}: ${St.count(m)} · ${m === 'nail' || m === 'screw' ? t('barn') : t('silo')}</small></div>
        <button class="btn blue small" data-tut="upgrades:${m}" ${S.wallet.star >= price ? '' : 'disabled'}><span class="price">${img(A.ICON_STAR)}${price}</span></button></div>`);
      let busy = false; // ST-04: a double tap buys once
      row.querySelector('button')!.addEventListener('click', () => {
        if (busy || !gate('buyMaterial', m)) return;
        busy = true;
        report(St.buyMaterial(m));
        setTimeout(() => { busy = false; }, 250);
      });
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

function openOrders(): void {
  const p = openPopup('orders', t('orders'));
  const render = (): void => {
    p.body.innerHTML = '';
    St.refillOrders();
    if (!S.farm.orders.length) { p.body.appendChild(el(`<div class="center muted">${t('order_empty')}</div>`)); return; }
    for (const o of S.farm.orders) {
      const can = St.canFulfil(o);
      const items = o.items.map((x) => `<div class="cell ${St.count(x.item) >= x.qty ? 'ok' : 'no'}">${img(A.ITEM_ICON[x.item])}<b>${St.count(x.item)}/${x.qty}</b><small>${t(x.item)}</small></div>`).join('');
      const row = el(`<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><div class="need" style="justify-content:flex-start">${items}</div>
        <div style="display:flex;align-items:center;gap:8px"><span class="price" style="flex:1">${img(A.ICON_COIN)}${o.coin} &nbsp; ${img(A.ICON_XP)}${o.exp}</span>
        <button class="btn grey small skip">${t('skip')}</button><button class="btn green small go" ${can ? '' : 'disabled'}>${t('deliver')}</button></div></div>`);
      row.querySelector('.go')!.addEventListener('click', () => { if (report(St.fulfilOrder(o.id))) { const c = centerOf(root!.querySelector('.pill.coin')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_COIN)}+${o.coin}`); } });
      row.querySelector('.skip')!.addEventListener('click', () => St.skipOrder(o.id));
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
}

export function levelUnlocked(i: number): boolean {
  const cfg = MATCH_LEVELS[i];
  return cfg.unlockAfter === 0 || (S.match.bestStars[String(cfg.unlockAfter)] ?? 0) >= 1;
}

export function openMatchMap(): void {
  // In the tutorial the Match button goes straight to level 1.
  if (St.tutorialActive()) { handlers.playLevel(0); return; }
  const p = openPopup('map', t('match'));
  const render = (): void => {
    p.body.innerHTML = '';
    const grid = el('<div class="maplist"></div>');
    let current = -1;
    MATCH_LEVELS.forEach((cfg, i) => {
      const best = S.match.bestStars[String(cfg.id)] ?? 0;
      const unlocked = levelUnlocked(i);
      if (current < 0 && unlocked && best === 0) current = i;
      // Hard, Super Hard and Boss levels wear a coloured frame and tag, the way the saga map flags them.
      const diff = cfg.difficulty === 'hard' || cfg.difficulty === 'superhard' || cfg.difficulty === 'boss' ? cfg.difficulty : '';
      const b = el(`<button class="lvlbtn${unlocked ? '' : ' locked'}${current === i ? ' current' : ''}${diff ? ` ${diff}` : ''}"><b>${cfg.id}</b>
        ${diff ? `<em class="diff ${diff}">${t(`diff_${diff}`)}</em>` : ''}
        <div class="st">${[1, 2, 3].map((s) => img(A.ICON_STAR, best >= s ? 'on' : '')).join('')}</div>
        <div class="g">${cfg.goals.map((g) => img(A.goalIcon(g, cfg.animal))).join('')} ${img(A.ICON_CLOCK)}${cfg.moves}${unlocked ? '' : ' 🔒'}</div></button>`);
      b.addEventListener('click', () => { if (unlocked) handlers.playLevel(i); else toast(t('locked'), 'warn'); });
      grid.appendChild(b);
    });
    p.body.appendChild(grid);
  };
  render();
  setPopupRenderer(render);
}

function openSettings(): void {
  const p = openPopup('settings', t('settings'));
  const render = (): void => {
    p.body.innerHTML = '';
    for (const key of ['sound', 'music', 'haptic'] as const) {
      const row = el(`<div class="switch"><span>${t(key)}</span><button class="${S.settings[key] ? 'on' : ''}"></button></div>`);
      row.querySelector('button')!.addEventListener('click', () => St.setSetting(key, !S.settings[key]));
      p.body.appendChild(row);
    }
    const reset = el(`<div class="center"><button class="btn red">${t('reset_all')}</button></div>`);
    reset.querySelector('button')!.addEventListener('click', openResetConfirm);
    p.body.appendChild(reset);
  };
  render();
  setPopupRenderer(render);
}

/** "Reset all game" asks the player to type the confirmation word before anything is wiped. */
const RESET_WORD = 'Confirm';

function openResetConfirm(): void {
  const p = openPopup('reset', t('reset_title'));
  setPopupRenderer(null);
  p.body.appendChild(el(`<div class="center">${t('reset_text', { word: RESET_WORD })}</div>`));
  const input = el<HTMLInputElement>(`<input class="confirm-input" type="text" placeholder="${RESET_WORD}" autocomplete="off" autocapitalize="off" spellcheck="false">`);
  p.body.appendChild(input);
  const row = el(`<div class="center"><button class="btn red" disabled>${t('reset_btn')}</button></div>`);
  const go = row.querySelector<HTMLButtonElement>('button')!;
  input.addEventListener('input', () => { go.disabled = input.value.trim() !== RESET_WORD; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !go.disabled) resetGame(); });
  go.addEventListener('click', () => { if (input.value.trim() === RESET_WORD) resetGame(); });
  p.body.appendChild(row);
  input.focus();
}

export function isPopupOpen(): boolean { return currentPopup() !== null; }
