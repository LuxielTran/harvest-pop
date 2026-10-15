// Farm Home: the 2.5D farm map (farmhouse, barn, silo, fields, and every pen,
// machine and tree the player bought), the HUD, the bottom bar and every farm
// popup (shop, inventory/storage upgrade, upgrade shop, truck orders, visitor,
// achievements, match map, settings).
//
// Everything on the map is played by hand, Hay Day style: tap a field / a pen /
// a machine to open a tray, then hold a tool and sweep it (seeds and the sickle
// over fields, feed and the basket over animals) or drop a product into its
// machine. Trees are tapped to pick. Buildings and fields can be moved (long
// press → drag → ✓ / ✕). The map is generic over farm-data.ts.

import FalconSDK from '@falcongames/game-client-sdk';
import * as A from '../art';
import { svg } from '../art-core';
import {
  ACHIEVEMENTS, ACHIEVEMENTS_UNLOCK, ANIMALS, BOOSTERS, BOOST_SPEED, CROPS, CROP_GEM_PRICE, FOOTPRINT, LEVEL_REWARDS, MACHINES, MACHINE_SLOTS_MAX, MATCH_LEVELS,
  MATERIALS, MATERIAL_PRICE, MOVE_HOLD_MS, PENS, RECIPES, TREES, TRUCK_UNLOCK, WORLD_SCALE, XP_THRESHOLDS, maxPlots, plotCost, slotPrice,
  unlocksAt, xpForNextLevel, type StorageType, type Unlock,
} from '../config';
import { t } from '../i18n';
import * as St from '../state';
import { S } from '../state';
import { tutorial } from '../tutorial';
import { openBoostOffer } from './boost';
import { objectHit, preloadObject } from './hitmask';
import { centerOf, closePopup, currentPopup, el, floatLabel, fmtTime, img, onPopupChange, openPopup, rerenderPopup, setPopupRenderer, stage, toast, toStage } from './common';

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
const VIEW_H = 704;
const WORLD_W = VIEW_W * WORLD_SCALE;
const WORLD_H = VIEW_H * WORLD_SCALE;
const OFF_X = (WORLD_W - VIEW_W) / 2;
const OFF_Y = (WORLD_H - VIEW_H) / 2;
// Isometric grid: cell (a, b) has its centre at (X0 + 26(a − b), Y0 − 13(a + b)) in world px.
const X0 = 200 + OFF_X;
const Y0 = 612 + OFF_Y;

let world: HTMLElement | null = null;
const cam = { x: OFF_X, y: OFF_Y };

// Tools: a file in src/assets/ (grass_sickle.png, basket.png) wins over the drawn icon.
const SICKLE = A.ASSET.grass_sickle ?? A.ICON_SHOVEL;
const BASKET = A.ASSET.basket ?? A.ICON_BASKET;

const itemIcon = (id: string): string => A.ITEM_ICON[id] ?? A.ICON_LOCK;
const animalIcon = (type: string): string => A.ANIMAL_ICON[type] ?? A.ICON_CHICKEN;
const buildingIcon = (type: string): string => A.BUILDING_ICON[type] ?? A.ICON_MILL;
const treeIcon = (type: string, ready: boolean): string => (type === 'mine' ? buildingIcon('mine') : ready ? A.TREE_ICON[type]?.ready ?? A.ICON_LOCK : A.TREE_ICON[type]?.grow ?? A.ICON_LOCK);
const feedIcon = (animal: string): string => itemIcon(ANIMALS[animal].feedItem);

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
      <div class="pill lvl">${img(A.ICON_XP)}<b id="hud-lvl">Lv 1</b><div class="bar"><i id="hud-xp"></i><small id="hud-xpnum"></small></div></div>
      <div class="pill star">${img(A.ICON_STAR)}<span id="hud-star">0</span></div>
      <button class="iconbtn" id="btn-settings">${img(A.ICON_SETTINGS)}</button>
    </div>
    <button class="boostbtn" id="hud-boost" data-tut="boost" style="display:none">${img(A.ICON_CLOCK)}<b>×${BOOST_SPEED}</b><span></span></button>
    <div class="scene"><div class="world" style="width:${WORLD_W}px;height:${WORLD_H}px"><div class="ground"></div></div></div>
    <div class="bottombar">
      <button class="bbtn" data-tut="shop" id="bb-shop">${img(A.ICON_SHOP)}<span>${t('shop')}</span><b class="badge" id="shop-badge" style="display:none"></b></button>
      <button class="bbtn match" data-tut="match" id="bb-match">${img(A.ICON_MATCH)}<span>${t('match')}</span></button>
      <button class="bbtn" data-tut="upgrades" id="bb-upgrades">${img(A.ICON_HAMMER)}<span>${t('upgrade')}</span></button>
    </div>
  </div>`);
  scene = root.querySelector<HTMLElement>('.scene')!;
  world = scene.querySelector<HTMLElement>('.world')!;
  world.querySelector<HTMLElement>('.ground')!.style.backgroundImage = `url("${A.svgUrl(A.LAWN_TILE)}")`;
  setCamera(cam.x, cam.y);
  root.querySelector('#bb-shop')!.addEventListener('click', () => gate('openShop') && openShop());
  root.querySelector('#bb-match')!.addEventListener('click', () => gate('openMatch') && openMatchMap());
  root.querySelector('#bb-upgrades')!.addEventListener('click', () => gate('openUpgrades') && openUpgradeShop());
  root.querySelector('#btn-settings')!.addEventListener('click', () => gate('openSettings') && openSettings());
  root.querySelector('#hud-boost')!.addEventListener('click', () => { if (St.boostOffered() && gate('openBoost')) openBoostOffer(); });
  // The coin pill opens the studio's coin shop when that module is on; otherwise it is just the counter.
  root.querySelector('#hud-coinbtn')!.addEventListener('click', () => { if (!St.tutorialActive()) FalconSDK.shop.open('header_coin'); });
  root.querySelector('#hud-gembtn')!.addEventListener('click', () => { if (!St.tutorialActive()) FalconSDK.shop.open('header_gem'); });
  scene.addEventListener('pointerdown', onScenePress);
  // A pan, a long press or a move in progress swallows the click that ends it (✓ / ✕ excepted).
  scene.addEventListener('click', (e) => {
    if ((e.target as Element).closest('.movectl')) return;
    if (swallowClick || moving) { e.stopPropagation(); e.preventDefault(); return; }
    // A tap on the empty part of a building's box goes to whatever is drawn under it (or nowhere).
    const boxed = (e.target as Element).closest<HTMLElement>('[data-key]');
    if (!boxed || !e.isTrusted) return;
    const real = objectAt(e.clientX, e.clientY);
    if (real === boxed) return;
    e.stopPropagation();
    e.preventDefault();
    real?.click();
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
  tutorial.refresh();
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

/** Everything the player owns on the map. A start save has the farmhouse, the barn, the silo and six fields. */
function ownedKeys(): string[] {
  return [
    'house', 'barn', 'silo',
    ...S.farm.plots.map((_, i) => `plot${i}`),
    ...S.farm.pens.map((_, i) => `pen${i}`),
    ...S.farm.machines.map((_, i) => `mach${i}`),
    ...S.farm.trees.map((_, i) => `tree${i}`),
  ];
}
/** Owned objects plus a just-bought one that is still being placed. */
const presentKeys = (): string[] => (moving?.buy ? [...ownedKeys(), moving.key] : ownedKeys());

const objEl = (key: string): HTMLElement | null => world!.querySelector<HTMLElement>(`:scope > [data-key="${key}"]`);
const plotEl = (i: number): HTMLElement => objEl(`plot${i}`)!;
const indexOf = (key: string): number => Number(key.replace(/^\D+/, ''));

/** Current grid cell of every object on the map (the lifted one: its candidate cell). */
const cells = new Map<string, { a: number; b: number }>();

/** The type behind a key: a pen / machine / tree being placed is not in the save yet, so the move state names it. */
function typeOf(key: string): string {
  if (moving?.key === key && moving.type) return moving.type;
  if (key.startsWith('pen')) return S.farm.pens[indexOf(key)]?.type ?? '';
  if (key.startsWith('mach')) return S.farm.machines[indexOf(key)]?.type ?? '';
  if (key.startsWith('tree')) return S.farm.trees[indexOf(key)]?.type ?? '';
  return key;
}

function makeObj(key: string): HTMLElement {
  let html: string;
  let onTap: () => void;
  if (key.startsWith('plot')) {
    html = `<button class="plot" data-tut="${key}"></button>`;
    onTap = () => tapPlot(indexOf(key));
  } else if (key === 'barn' || key === 'silo') {
    html = `<button class="obj" data-tut="${key}"></button>`;
    onTap = () => { if (gate(key === 'barn' ? 'openBarn' : 'openSilo')) openInventory(key); };
  } else if (key === 'house') {
    html = `<button class="obj house" data-tut="house"></button>`;
    onTap = tapHouse;
  } else if (key.startsWith('pen')) {
    const art = A.penArt(typeOf(key));
    html = `<button class="obj pen" data-tut="${key}" style="width:${art.w}px;height:${art.h}px"></button>`;
    onTap = () => tapPen(indexOf(key));
  } else if (key.startsWith('tree')) {
    html = `<button class="obj tree" data-tut="${key}"></button>`;
    onTap = () => tapTree(indexOf(key));
  } else {
    html = `<button class="obj" data-tut="${key}"></button>`;
    onTap = () => tapMachine(indexOf(key));
  }
  const e = el(html);
  e.dataset.key = key;
  e.addEventListener('click', onTap);
  world!.appendChild(e);
  return e;
}

/** The map object really under a client point: the topmost one whose art (not just its box) is there. */
function objectAt(x: number, y: number): HTMLElement | null {
  const off: HTMLElement[] = [];
  let found: HTMLElement | null = null;
  for (let i = 0; i < 8; i++) {
    const e = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-key]') ?? null;
    if (!e || !world?.contains(e)) break;
    if (objectHit(e, x, y)) { found = e; break; }
    e.style.pointerEvents = 'none';
    off.push(e);
  }
  for (const e of off) e.style.pointerEvents = '';
  return found;
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
  syncVisitor();
}

function setObj(key: string, sig: string, html: string, cls = ''): void {
  const e = objEl(key);
  if (!e || sigs.get(key) === sig) return;
  sigs.set(key, sig);
  e.innerHTML = html;
  preloadObject(e);
  const keep = ['moving', 'blocked', 'pressing', 'tut-hl', 'pen', 'house', 'tree'].filter((c) => e.classList.contains(c));
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

function sizeOf(key: string): number {
  if (key.startsWith('plot')) return FOOTPRINT.plot;
  if (key.startsWith('pen')) return PENS[typeOf(key)]?.footprint ?? 2;
  if (key.startsWith('mach')) return MACHINES[typeOf(key)]?.footprint ?? 2;
  if (key.startsWith('tree')) return FOOTPRINT.tree;
  if (key === 'truck' || key === 'board') return 3;
  return FOOTPRINT[key] ?? 2;
}

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
  if (key === 'house') placeVisitor();
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
let moving: { key: string; type?: string; from: { a: number; b: number } | null; at: { a: number; b: number }; ctl: HTMLElement; foot: HTMLElement; buy?: () => string } | null = null;
let swallowClick = false;

function worldPoint(clientX: number, clientY: number): { x: number; y: number } {
  const r = scene!.getBoundingClientRect();
  const k = r.width / VIEW_W;
  return { x: (clientX - r.left) / k + cam.x, y: (clientY - r.top) / k + cam.y };
}

function onScenePress(ev: PointerEvent): void {
  if (press || ev.button > 0 || (ev.target as Element).closest('.movectl, .visitor, .truck, .orderboard')) return;
  const boxed = (ev.target as Element).closest<HTMLElement>('[data-key]');
  // The object being moved is grabbed anywhere on its box; others only on their drawn art.
  const hit = (boxed && boxed.dataset.key === moving?.key ? boxed : objectAt(ev.clientX, ev.clientY))?.dataset.key ?? null;
  const key = hit && presentKeys().includes(hit) ? hit : null;
  press = { x: ev.clientX, y: ev.clientY, camX: cam.x, camY: cam.y, key, timer: 0, mode: 'wait', dx: 0, dy: 0 };
  if (moving && key === moving.key) startCarry(ev);
  else if (key && !moving && key !== 'house') {
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
    if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) > 40) tutorial.onPan();
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

function liftObj(key: string, from: { a: number; b: number } | null, at: { a: number; b: number }, buy?: () => string, type?: string): void {
  closeTray();
  closeInfo();
  closePopup();
  const ctl = el(`<div class="movectl"><button class="mv-ok" data-tut="place:ok">${OK_SVG}</button><button class="mv-no">${NO_SVG}</button></div>`);
  ctl.querySelector('.mv-ok')!.addEventListener('click', confirmMove);
  ctl.querySelector('.mv-no')!.addEventListener('click', cancelMove);
  moving = { key, type, from, at, ctl, foot: el('<div class="footprint"></div>'), buy };
  const n = sizeOf(key);
  moving.foot.innerHTML = `<svg viewBox="0 0 ${52 * n} ${26 * n}" width="${52 * n}" height="${26 * n}"><polygon points="${26 * n},0 ${52 * n},${13 * n} ${26 * n},${26 * n} 0,${13 * n}"/></svg>`;
  world!.append(moving.foot, ctl);
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
function startPlacing(key: string, type: string | undefined, buy: () => string): void {
  stopInteractions();
  moving = null;
  const probe = { key, type, from: null, at: { a: 0, b: 0 }, ctl: el('<i></i>'), foot: el('<i></i>'), buy };
  moving = probe; // so sizeOf() knows the type while looking for room
  const at = findFree(key, cam.x + VIEW_W / 2, cam.y + VIEW_H / 2);
  moving = null;
  liftObj(key, null, at, buy, type);
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
  tutorial.refresh();
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
  root.querySelector('#hud-xpnum')!.textContent = next === null ? t('max_level') : `${S.progress.xp - base}/${next - base}`;
  const fresh = St.newOffers();
  const badge = root.querySelector<HTMLElement>('#shop-badge')!;
  badge.style.display = fresh ? '' : 'none';
  badge.textContent = String(fresh);
  syncBoost();

  setObj('barn', 'barn', img(A.ICON_BARN, 'bld', 140));
  setObj('silo', 'silo', img(A.ICON_SILO, 'bld', 130));
  setObj('house', `house:${St.anyClaimable()}`, `${img(buildingIcon('house'), 'pen')}${St.anyClaimable() ? `<span class="bubble">${img(A.ICON_GEM)}</span>` : ''}`);
  // Machines: the building, a bubble while finished batches wait, a gentle bob while working.
  S.farm.machines.forEach((m, i) => {
    const { done, running } = St.machineJobs(i);
    const out = done.length ? `<span class="bubble">${img(itemIcon(RECIPES[done[0].recipe].output))}${done.length > 1 ? `<b>${done.length}</b>` : ''}</span>` : '';
    setObj(`mach${i}`, `${m.type}:${done.length}:${!!running}`, `${img(buildingIcon(m.type), 'bld', 120)}${out}`, running ? 'working' : '');
  });
  if (tray && 'machine' in tray.origin) renderSlots(tray.origin.machine);
  // Pens: yard + back fences, the animals inside, then the front fences over them.
  S.farm.pens.forEach((pen, i) => {
    const art = A.penArt(pen.type);
    const a = ANIMALS[PENS[pen.type].animal];
    const sig = `${pen.type}:${pen.animals.map((c) => c.status).join(',')}`;
    setObj(`pen${i}`, sig, `${img(art.back, 'pen')}${pen.animals.map((c, k) => animalHtml(a.id, c, k, art.slots[k] ?? art.slots[0])).join('')}${img(art.front, 'pen')}`);
  });
  // Trees: growing or ready to pick (a glow); the mine shows its lantern lit when ready.
  S.farm.trees.forEach((tr, i) => {
    const ready = St.treeReady(i);
    setObj(`tree${i}`, `${tr.type}:${ready}`, `${img(treeIcon(tr.type, ready), 'bld', 120)}${ready && tr.type === 'mine' ? `<span class="bubble">${img(A.ICON_PICK)}</span>` : ''}`, ready ? 'ready' : '');
  });
  // Fields: an iso soil tile with the crop standing on it. No timers on the field; tapping a
  // growing field shows its time left.
  const soil = img(A.PLOT_SOIL, 'soil');
  S.farm.plots.forEach((p, i) => {
    if (p.status === 'empty') { setObj(`plot${i}`, 'empty', soil); return; }
    const stages = A.CROP_STAGE[p.crop!] ?? A.CROP_STAGE.wheat;
    if (p.status === 'ready') { setObj(`plot${i}`, `ready:${p.crop}`, `${soil}${img(stages[2], 'crop')}`, 'ready'); return; }
    const stage = growFraction(p) < 0.5 ? 0 : 1;
    setObj(`plot${i}`, `growing:${p.crop}:${stage}`, `${soil}${img(stages[stage], 'crop')}`, 'growing');
  });
  if (moving?.buy && moving.type) {
    const k = moving.key;
    const ty = moving.type;
    if (k.startsWith('pen')) { const art = A.penArt(ty); setObj(k, `new:${ty}`, `${img(art.back, 'pen')}${img(art.front, 'pen')}`); }
    else if (k.startsWith('mach')) setObj(k, `new:${ty}`, img(buildingIcon(ty), 'bld', 120));
    else if (k.startsWith('tree')) setObj(k, `new:${ty}`, img(treeIcon(ty, false), 'bld', 120));
  }
  renderVisitor();
  renderBoard();
  if (info && !info.alive()) closeInfo();
  refreshCounts();
}

/** An animal in its pen slot: hungry (asks for feed) → feeding (eats, a bar fills) → ready (its produce). Pets nap after eating. */
function animalHtml(type: string, c: St.AnimalState, i: number, s: { x: number; y: number }): string {
  const a = ANIMALS[type];
  const badge = c.status === 'hungry' ? `<span class="cb">${img(feedIcon(type))}</span>`
    : c.status === 'ready' ? `<span class="cb egg">${img(itemIcon(a.produceItem!))}</span>`
      : a.produceItem ? `<span class="cbar"><i data-animalbar="${i}"></i></span>` : '<span class="cb zz">💤</span>';
  return `<span class="chick ${c.status}" data-animal="${i}" data-tut="animal${i}" style="left:${s.x}px;top:${s.y}px">${img(animalIcon(type))}${badge}</span>`;
}

/** The Farm Boost button: from BOOST_UNLOCK while the ads module is on; shows the time left while a boost runs. */
function syncBoost(): void {
  const b = root?.querySelector<HTMLElement>('#hud-boost');
  if (!b) return;
  b.style.display = St.boostOffered() ? '' : 'none';
  const left = St.boostLeft();
  b.classList.toggle('on', left > 0);
  b.querySelector('span')!.textContent = left > 0 ? fmtTime(left) : t('boost_btn');
}

/** 0 → just started, 1 → done. */
const fraction = (readyAt: number, total: number): number => Math.max(0, Math.min(1, 1 - (readyAt - St.now()) / total));
const growFraction = (p: St.PlotState): number => fraction(p.readyAt, St.cropMs(p.crop!));

function updateTimers(): void {
  const now = St.now();
  if (tray && 'machine' in tray.origin) renderSlots(tray.origin.machine);
  syncBoost();
  for (const e of stage().querySelectorAll<HTMLElement>('[data-timer]')) e.textContent = fmtTime(Number(e.dataset.timer) - now);
  info?.update();
  for (const e of world?.querySelectorAll<HTMLElement>('[data-animalbar]') ?? []) {
    const penEl = e.closest<HTMLElement>('[data-key]');
    const pen = penEl ? S.farm.pens[indexOf(penEl.dataset.key!)] : null;
    const c = pen?.animals[Number(e.dataset.animalbar)];
    if (pen && c?.status === 'feeding') e.style.width = `${fraction(c.readyAt, St.animalMs(PENS[pen.type].animal)) * 100}%`;
  }
  // Growth stage flips at half time without a state change.
  if (S.farm.plots.some((p) => p.status === 'growing')) updateFarm();
}

// ---------------------------------------------------------------------------
// The visitor: a character beside the farmhouse with a bubble of what they want.

let visitorEl: HTMLElement | null = null;
let truckEl: HTMLElement | null = null;
let boardEl: HTMLElement | null = null;

function syncVisitor(): void {
  if (!visitorEl) {
    visitorEl = el('<button class="visitor" data-tut="visitor"><span class="say"></span><img alt=""></button>');
    visitorEl.addEventListener('click', tapVisitor);
    truckEl = el(`<button class="truck" data-tut="orders">${img(A.ICON_TRUCK)}</button>`);
    truckEl.addEventListener('click', tapTruck);
    boardEl = el('<div class="orderboard"><img alt=""></div>');
    boardEl.addEventListener('click', tapTruck);
    world!.append(visitorEl, truckEl, boardEl);
  }
  placeVisitor();
}

/** The visitor stands at the house's right, the truck and its board at its left. */
function placeVisitor(): void {
  const at = cells.get('house');
  if (!visitorEl || !truckEl || !boardEl || !at) return;
  const c = footCenter('house', at.a, at.b);
  visitorEl.style.left = `${c.x + 70}px`;
  visitorEl.style.top = `${c.y + 66}px`;
  visitorEl.style.zIndex = String(Math.round(c.y + 66));
  // The truck and the board keep their ground free: nothing can be placed over them.
  cells.set('truck', { a: at.a - 6, b: at.b + 1 });
  cells.set('board', { a: at.a - 3, b: at.b + 3 });
  truckEl.style.left = `${c.x - 120}px`;
  truckEl.style.top = `${c.y + 90}px`;
  truckEl.style.zIndex = String(Math.round(c.y + 90));
  boardEl.style.left = `${c.x - 128}px`;
  boardEl.style.top = `${c.y + 44}px`;
  boardEl.style.zIndex = String(Math.round(c.y + 44));
}

function tapTruck(): void {
  if (swallowClick || moving) return;
  if (gate('openOrders')) openOrders();
}

/**
 * The order board, drawn in 2.5D (its face is the left, lit face of the iso world): a wooden
 * frame on two posts with one paper slip per order, a green ✓ on the slips the barn can fill
 * right now. Deleted slots show as bare pins until they refill. No order details here.
 */
function boardSvg(slips: ('ok' | 'wait' | 'empty')[]): string {
  // A square face (W × W) sheared onto the lit iso plane: y drops by x / 2, so the right edge sits W/2 higher.
  const W = 108, P = 31, S = 24; // 3 × 3 slips of S px at pitch P: 12 + 2P + S = 98 ≤ the inner panel (5..103)
  const ox = 12, oy = 200; // the left post's foot (the sheared face rises W/2 above its top-left, so the frame is tall)
  let s = '<defs><filter id="bsh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>';
  // Ground shadow: a parallelogram along the board (dx W, dy −W/2) with depth along the other iso axis (1, 0.5).
  const d: [number, number] = [16, 8];
  s += `<polygon points="${ox - d[0]},${oy - d[1]} ${ox + d[0]},${oy + d[1]} ${ox + W + d[0]},${oy - W / 2 + d[1]} ${ox + W - d[0]},${oy - W / 2 - d[1]}" fill="#000" opacity=".22" filter="url(#bsh)"/>`;
  // Posts (the right one stands W/2 higher on the ground plane).
  const post = (x: number, foot: number): string => `<rect x="${x}" y="${foot - 46}" width="9" height="46" rx="2" fill="#7a4a1f"/><rect x="${x + 1.5}" y="${foot - 46}" width="2.5" height="44" rx="1" fill="#a86a3a"/>`;
  s += post(ox - 4, oy) + post(ox + W - 5, oy - W / 2);
  // The face, hanging between the posts.
  s += `<g transform="translate(${ox} ${oy - 30 - W}) matrix(1 -0.5 0 1 0 0)">`;
  s += `<rect x="0" y="0" width="${W}" height="${W}" rx="5" fill="#6b3f17"/><rect x="5" y="5" width="${W - 10}" height="${W - 10}" rx="3" fill="#c9965a"/>`;
  s += `<rect x="7" y="7" width="${W - 14}" height="${W - 14}" rx="2" fill="none" stroke="#e8c48c" stroke-width="1.5" opacity=".6"/>`;
  for (let i = 0; i < 9; i++) {
    const k = slips[i] ?? 'empty';
    const x = 12 + (i % 3) * P, y = 12 + Math.floor(i / 3) * P;
    if (k !== 'empty') {
      s += `<rect x="${x + 1.5}" y="${y + 2}" width="${S}" height="${S}" rx="2" fill="#000" opacity=".15"/>`;
      s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="2" fill="#fff8e1" stroke="#d9c39a" stroke-width="1"/>`;
      s += `<path d="M${x + 4} ${y + 8}h15M${x + 4} ${y + 13}h11M${x + 4} ${y + 18}h8" stroke="#cdbfa0" stroke-width="1.6" stroke-linecap="round"/>`;
      if (k === 'ok') s += `<circle cx="${x + 17}" cy="${y + 16}" r="6.5" fill="#5cc24a"/><path d="M${x + 13.5} ${y + 16}l3 3 4.5-5.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    s += `<circle cx="${x + S / 2}" cy="${y + 1}" r="2.6" fill="${k === 'empty' ? '#8a5a2b' : '#e8413c'}"/>`;
  }
  s += '</g>';
  return svg(140, 216, s);
}

function renderBoard(): void {
  if (!truckEl || !boardEl) return;
  const open = St.farmLevel() >= TRUCK_UNLOCK;
  truckEl.style.display = open ? '' : 'none';
  boardEl.style.display = open ? '' : 'none';
  if (!open) return;
  const slips: ('ok' | 'wait' | 'empty')[] = St.orderSlotsView().map((s) => ('order' in s ? (St.canFulfil(s.order) ? 'ok' : 'wait') : 'empty'));
  const sig = slips.join(',');
  if (boardEl.dataset.sig === sig) return;
  boardEl.dataset.sig = sig;
  boardEl.querySelector('img')!.src = A.svgUrl(boardSvg(slips));
}

function renderVisitor(): void {
  if (!visitorEl) return;
  const v = S.farm.visitor;
  const sig = v ? `${v.id}:${v.item}:${v.qty}:${St.count(v.item) >= v.qty}` : '';
  if (visitorEl.dataset.sig === sig) return;
  visitorEl.dataset.sig = sig;
  visitorEl.style.display = v ? '' : 'none';
  if (!v) return;
  visitorEl.querySelector('img')!.src = A.svgUrl(A.VISITOR_ART[v.look % A.VISITOR_ART.length] ?? A.VISITOR_ART[0]);
  visitorEl.querySelector('.say')!.innerHTML = `${img(itemIcon(v.item))}<b>${v.qty}</b>`;
  visitorEl.classList.toggle('can', St.count(v.item) >= v.qty);
}

function tapVisitor(): void {
  if (swallowClick || moving || !S.farm.visitor || !gate('openVisitor')) return;
  const p = openPopup('visitor', t('visitor'));
  const render = (): void => {
    const v = S.farm.visitor;
    p.body.innerHTML = '';
    if (!v) { closePopup(); return; }
    const can = St.count(v.item) >= v.qty;
    p.body.appendChild(el(`<div class="visitor-card">${img(A.VISITOR_ART[v.look % A.VISITOR_ART.length] ?? A.VISITOR_ART[0], 'who')}
      <div class="say">${t('visitor_wants', { n: v.qty, item: t(v.item) })}</div></div>`));
    p.body.appendChild(el(`<div class="need"><div class="cell ${can ? 'ok' : 'no'}">${img(itemIcon(v.item))}<b>${St.count(v.item)}/${v.qty}</b><small>${t(v.item)}</small></div></div>`));
    p.body.appendChild(el(`<div class="center"><span class="price">${t('reward')}: ${img(A.ICON_COIN)}${v.coin} &nbsp; ${img(A.ICON_XP)}${v.exp}</span></div>`));
    const row = el(`<div class="center" style="display:flex;gap:10px;justify-content:center"><button class="btn grey small">${t('decline')}</button><button class="btn green" data-tut="visitor:serve" ${can ? '' : 'disabled'}>${t('serve')}</button></div>`);
    row.querySelector('.grey')!.addEventListener('click', () => { St.dismissVisitor(); closePopup(); });
    row.querySelector('.green')!.addEventListener('click', () => {
      if (!gate('serveVisitor')) return;
      const coin = v.coin;
      // The visit's XP can open the level-up popup; only the visitor's own popup closes.
      if (report(St.serveVisitor())) { if (currentPopup() === 'visitor') closePopup(); const c = centerOf(root!.querySelector('.pill.coin')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_COIN)}+${coin}`); }
    });
    p.body.appendChild(row);
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

// ---------------------------------------------------------------------------
// Taps on the map

function tapPlot(i: number): void {
  const p = S.farm.plots[i];
  if (p.status === 'growing') {
    showInfo(plotEl(i), t(p.crop!), () => S.farm.plots[i]?.readyAt ?? 0, St.cropMs(p.crop!), true, () => S.farm.plots[i]?.status === 'growing',
      { cost: () => St.plotSkipCost(i), run: () => St.skipPlot(i) });
    return;
  }
  if (!gate('openPlot', i)) return;
  if (p.status === 'empty') {
    const lvl = St.farmLevel();
    // Unlocked crops, then the next few locked ones as a tease.
    const crops = Object.values(CROPS).filter((c) => c.unlockLevel <= lvl + 4).sort((a, b) => a.unlockLevel - b.unlockLevel);
    openTray(plotEl(i), { plot: i }, crops.map((c) => ({
      tut: `seed:${c.id}`,
      html: `${img(itemIcon(c.id))}<b class="qty" data-count="${c.id}"></b>${gemBtn(CROP_GEM_PRICE, `data-gembuy="${c.id}"`, 'corner')}`,
      tool: c.unlockLevel <= lvl ? { kind: 'seed', crop: c.id } as Tool : null,
    })));
  } else openTray(plotEl(i), { plot: i }, [{ tut: 'sickle', html: img(SICKLE), tool: { kind: 'sickle' } }]);
}

function tapPen(i: number): void {
  if (!gate('openPen', i)) return;
  const pen = S.farm.pens[i];
  const a = ANIMALS[PENS[pen.type].animal];
  const items: TrayItem[] = [{ tut: 'tool:feed', html: `${img(feedIcon(a.id))}<b class="qty" data-count="${a.feedItem}"></b>`, tool: { kind: 'feed', pen: i } }];
  if (a.produceItem) items.push({ tut: 'tool:basket', html: img(BASKET), tool: { kind: 'basket', pen: i } });
  openTray(objEl(`pen${i}`)!, { pen: i }, items);
}

/** Tap a machine: finished batches are collected first; otherwise the tray opens with its
 *  products (hold one for the recipe, drop it into the machine) and its production slots. */
function tapMachine(i: number): void {
  const m = S.farm.machines[i];
  if (St.machineJobs(i).done.length) {
    if (!gate('collectOutput', m.type)) return;
    const { err, got } = St.collectOutput(i);
    if (got.length) popAt(objEl(`mach${i}`)!, got.map((g) => `${img(itemIcon(g.item))}+${g.qty}`).join(' '));
    else report(err);
    return;
  }
  if (!gate('openMachine', m.type)) return;
  const lvl = St.farmLevel();
  openTray(objEl(`mach${i}`)!, { machine: i }, MACHINES[m.type].recipes.map((rid) => ({
    tut: `prod:${rid}`,
    html: `${img(itemIcon(RECIPES[rid].output))}<b class="qty" data-count="${RECIPES[rid].output}" data-lock="${RECIPES[rid].unlockLevel}"></b>`,
    tool: RECIPES[rid].unlockLevel <= lvl ? { kind: 'product', machine: i, recipe: rid } as Tool : null,
  })));
}

/** Tap a tree: pick it when ready, else show the time left (and a gem skip). */
function tapTree(i: number): void {
  const tr = S.farm.trees[i];
  if (!St.treeReady(i)) {
    showInfo(objEl(`tree${i}`)!, t(tr.type), () => S.farm.trees[i]?.readyAt ?? 0, St.treeMs(tr.type), false, () => !St.treeReady(i), { cost: () => St.treeSkipCost(i), run: () => St.skipTree(i) });
    return;
  }
  if (!gate('harvestTree')) return;
  const { err, item, qty } = St.harvestTree(i);
  if (report(err)) popAt(objEl(`tree${i}`)!, `${img(itemIcon(item))}+${qty}`);
}

function tapHouse(): void {
  if (swallowClick || moving) return;
  if (!St.achievementsOpen()) { toast(t('house_locked', { n: ACHIEVEMENTS_UNLOCK }), 'warn'); return; }
  if (gate('openHouse')) openAchievements();
}

/** The machine tray's slot row: running (time left), waiting, finished, empty, then "+" to buy a slot. */
function renderSlots(i: number): void {
  if (!tray) return;
  let row = tray.el.querySelector<HTMLElement>('.slotrow');
  if (!row) {
    row = el('<div class="slotrow"></div>');
    row.addEventListener('click', (e) => {
      const target = e.target as Element;
      if (target.closest('.buyslot')) buySlot(i);
      else if (target.closest('[data-skip]') && gemReport(St.skipMachine(i))) popAt(objEl(`mach${i}`)!, `${img(A.ICON_GEM)}-`);
    });
    tray.el.appendChild(row);
  }
  const m = S.farm.machines[i];
  const { done, running, waiting } = St.machineJobs(i);
  const box = (j: St.MachineJob, cls: string, extra: string): string => `<div class="slot ${cls}">${img(itemIcon(RECIPES[j.recipe].output))}${extra}</div>`;
  let html = done.map((j) => box(j, 'done', '<i class="ok">✓</i>')).join('');
  if (running) html += box(running, 'run', `<b data-timer="${running.readyAt}">${fmtTime(running.readyAt - St.now())}</b>${gemBtn(St.machineSkipCost(i), 'data-skip', 'corner')}`);
  html += waiting.map((j) => box(j, 'wait', `<b>${t('waiting')}</b>`)).join('');
  for (let k = m.queue.length; k < m.slots; k++) html += '<div class="slot empty"></div>';
  if (m.slots < MACHINE_SLOTS_MAX) html += `<button class="slot buyslot" data-tut="slot:buy"><span>+</span><b class="price">${img(A.ICON_COIN)}${slotPrice(m.slots)}</b></button>`;
  const sig = `${html.replace(/data-timer="\d+">[^<]*/g, '')}`;
  if (row.dataset.sig === sig) {
    // Same slots; the running batch's end may still have moved (farm boost).
    const timer = row.querySelector<HTMLElement>('[data-timer]');
    if (timer && running) timer.dataset.timer = String(running.readyAt);
    return;
  }
  row.dataset.sig = sig;
  row.innerHTML = html;
}

function buySlot(i: number): void {
  const price = slotPrice(S.farm.machines[i].slots);
  const err = St.buySlot(i);
  if (err === 'err_coin') { if (!FalconSDK.shop.open(`buy_slot_${S.farm.machines[i].type}`)) toast(t('err_coin'), 'warn'); return; }
  if (report(err)) toast(t('slot_bought', { n: S.farm.machines[i].slots, price }));
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
  if (e.type === 'gem' && e.delta > 0) { const c = centerOf(root.querySelector('.pill.gem')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_GEM)}+${e.delta}`); }
}

// ---------------------------------------------------------------------------
// Trays and tools. A tray opens above what was tapped; its tools are held and swept
// (seed / sickle over fields, feed / basket over animals) or dropped (a product into its machine).

type Tool =
  | { kind: 'seed'; crop: string }
  | { kind: 'sickle' }
  | { kind: 'feed'; pen: number }
  | { kind: 'basket'; pen: number }
  | { kind: 'product'; machine: number; recipe: string };
type Origin = { plot: number } | { pen: number } | { machine: number };
interface TrayItem { tut: string; html: string; tool: Tool | null }

let tray: { el: HTMLElement; origin: Origin } | null = null;
let info: { el: HTMLElement; timer: number; update: () => void; alive: () => boolean } | null = null;
let tip: HTMLElement | null = null;
let drag: { tool: Tool; ghost: HTMLElement; origin: Origin; x: number; y: number; moved: boolean; done: Set<string>; stopped: boolean } | null = null;

const originKey = (o: Origin): string => ('plot' in o ? 'plot' : 'pen' in o ? `pen:${S.farm.pens[o.pen]?.type}` : `mach:${S.farm.machines[o.machine]?.type}`);

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
      if (gemReport(St.buyCropWithGems(crop))) popAt(b, `${img(itemIcon(crop))}+1`);
    });
    if (it.tool) { const tool = it.tool; b.addEventListener('pointerdown', (ev) => startDrag(ev, tool, origin)); }
    else b.addEventListener('pointerdown', () => toast(t('err_level'), 'warn'));
    e.appendChild(b);
  }
  if ('pen' in origin) e.appendChild(el('<div class="skiprow"></div>'));
  tray = { el: e, origin };
  if ('machine' in origin) renderSlots(origin.machine);
  placePanel(e, anchor, 'plot' in origin ? 34 : 6, 'plot' in origin);
  refreshCounts();
  tutorial.onTray(originKey(origin));
}

function closeTray(): void {
  if (!tray) return;
  tray.el.remove();
  tray = null;
  tutorial.onTray(null);
}

/** What a counter badge shows: the stock (a crop / product not yet unlocked shows its level). */
function countBadge(item: string, lock?: string): string {
  const lvl = lock ? Number(lock) : CROPS[item]?.unlockLevel ?? 0;
  if (lvl > St.farmLevel()) return `${img(A.ICON_LOCK)}${lvl}`;
  return String(St.count(item));
}

/** Keep every counter (tray + the tool in hand) on the live stock; a consumable at 0 greys out in hand. */
function refreshCounts(): void {
  for (const q of stage().querySelectorAll<HTMLElement>('[data-count]')) {
    q.innerHTML = countBadge(q.dataset.count!, q.dataset.lock);
    if (q.parentElement?.classList.contains('dragtool')) q.parentElement.classList.toggle('empty', St.count(q.dataset.count!) <= 0);
  }
  // Out of a crop (and it is unlocked): its gem button shows.
  for (const g of stage().querySelectorAll<HTMLElement>('[data-gembuy]')) {
    const c = CROPS[g.dataset.gembuy!];
    g.style.display = St.count(c.id) <= 0 && c.unlockLevel <= St.farmLevel() ? '' : 'none';
  }
  if (tray && 'pen' in tray.origin) renderPenSkip(tray.origin.pen);
}

/** Time left on a growing field / tree or a working machine (only shown when tapped). */
// `readyAt` is read live: the farm boost pulls timers closer while the panel is open.
function showInfo(anchor: HTMLElement, title: string, readyAt: () => number, total: number, aroundFields: boolean, alive: () => boolean,
  skip?: { cost: () => number; run: () => string }): void {
  closeTray();
  closeInfo();
  const e = el(`<div class="plotinfo"><b>${title}</b><div class="bar"><i style="width:${fraction(readyAt(), total) * 100}%"></i></div>
    <span>${t('time_left')} <b data-timer="${readyAt()}">${fmtTime(readyAt() - St.now())}</b></span>${skip ? gemBtn(skip.cost(), 'data-skip', 'wide', t('finish_now')) : ''}</div>`);
  const bar = e.querySelector<HTMLElement>('.bar i')!;
  const left = e.querySelector<HTMLElement>('[data-timer]')!;
  const cost = e.querySelector<HTMLElement>('[data-skip] b');
  e.querySelector('[data-skip]')?.addEventListener('click', () => {
    if (!skip || !gemReport(skip.run())) return;
    closeInfo();
    popAt(anchor, `${img(A.ICON_GEM)}-`);
  });
  info = {
    el: e,
    timer: window.setTimeout(closeInfo, skip ? 5000 : 3000),
    update: () => {
      left.dataset.timer = String(readyAt());
      left.textContent = fmtTime(readyAt() - St.now());
      bar.style.width = `${fraction(readyAt(), total) * 100}%`;
      if (cost && skip) cost.textContent = String(skip.cost());
    },
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

/** The pen tray's "finish now" row while any animal is eating. */
function renderPenSkip(i: number): void {
  const row = tray?.el.querySelector<HTMLElement>('.skiprow');
  if (!row) return;
  const cost = St.penSkipCost(i);
  const sig = String(cost);
  if (row.dataset.sig === sig) return;
  row.dataset.sig = sig;
  row.innerHTML = cost ? gemBtn(cost, 'data-skip', 'wide', t('lay_now')) : '';
  row.style.display = cost ? '' : 'none';
  row.querySelector('[data-skip]')?.addEventListener('click', () => { if (gemReport(St.skipPen(i))) popAt(objEl(`pen${i}`)!, `${img(A.ICON_GEM)}-`); });
}

function closeInfo(): void {
  if (!info) return;
  clearTimeout(info.timer);
  info.el.remove();
  info = null;
}

/** The recipe of a product, shown while it is held: inputs (have / need), time, output. */
function showTip(machine: number, rid: string): void {
  closeTip();
  const r = RECIPES[rid];
  const inputs = r.inputs.map((x) => `<div class="cell ${St.count(x.item) >= x.qty ? 'ok' : 'no'}">${img(itemIcon(x.item))}<b>${St.count(x.item)}/${x.qty}</b></div>`).join('');
  tip = el(`<div class="recipetip"><b>${t(r.output)} ×${r.outputQty}</b><small>${t(r.machine)} · ${fmtTime(St.recipeMs(rid))}</small><div class="need">${inputs}</div></div>`);
  placePanel(tip, tray?.el ?? objEl(`mach${machine}`)!, 8, false);
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

/** Index of the animal of pen `pen` under the client point, or -1. */
function animalAt(pen: number, x: number, y: number): number {
  for (const e of objEl(`pen${pen}`)?.querySelectorAll<HTMLElement>('.chick') ?? []) {
    const r = e.getBoundingClientRect();
    if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return Number(e.dataset.animal);
  }
  return -1;
}

function overMachine(i: number, x: number, y: number): boolean {
  const e = objEl(`mach${i}`)?.querySelector('.bld');
  if (!e) return false;
  const r = e.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

function startDrag(ev: PointerEvent, tool: Tool, origin: Origin): void {
  ev.preventDefault();
  endDrag();
  // A seed / the feed in hand carries its stock counter; at 0 it can still be swept around but does nothing.
  const feedItem = tool.kind === 'feed' ? ANIMALS[PENS[S.farm.pens[tool.pen].type].animal].feedItem : '';
  const icon = tool.kind === 'seed' ? itemIcon(tool.crop) : tool.kind === 'sickle' ? SICKLE : tool.kind === 'feed' ? itemIcon(feedItem)
    : tool.kind === 'basket' ? BASKET : itemIcon(RECIPES[tool.recipe].output);
  const counter = tool.kind === 'seed' ? `<b class="qty" data-count="${tool.crop}"></b>` : tool.kind === 'feed' ? `<b class="qty" data-count="${feedItem}"></b>` : '';
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
    objEl(`mach${tool.machine}`)?.classList.toggle('drop', overMachine(tool.machine, ev.clientX, ev.clientY));
  } else {
    // Sample the segment so a fast swipe cannot skip a field or an animal.
    const steps = Math.max(1, Math.ceil(dist / 8));
    for (let s = 1; s <= steps; s++) {
      const x = x0 + ((ev.clientX - x0) * s) / steps;
      const y = y0 + ((ev.clientY - y0) * s) / steps;
      if (tool.kind === 'seed' || tool.kind === 'sickle') { const i = plotAt(x, y); if (i >= 0) applyTool(`plot${i}`); }
      else { const i = animalAt(tool.pen, x, y); if (i >= 0) applyTool(`animal${i}`); }
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
    objEl(`mach${tool.machine}`)?.classList.remove('drop');
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

/** Use the tool in hand on a field / animal, once per sweep. Out of seeds or feed does nothing
 *  more (the tool stays in hand); a full barn / silo stops the sweep with one toast. */
function applyTool(key: string): void {
  if (!drag || drag.stopped || drag.done.has(key)) return;
  const tool = drag.tool;
  let target: HTMLElement | null = null;
  if (key.startsWith('plot')) {
    const i = indexOf(key);
    const p = S.farm.plots[i];
    if (tool.kind === 'seed') {
      if (p.status !== 'empty' || St.count(tool.crop) <= 0 || !tutorial.allows('plant', i) || St.plantCrop(i, tool.crop)) return;
    } else if (tool.kind === 'sickle') {
      if (p.status !== 'ready' || !tutorial.allows('harvest', i)) return;
      const crop = CROPS[p.crop!];
      if (St.harvest(i)) { drag.stopped = true; return; } // silo full: the collectBlocked event toasts it
      popAt(plotEl(i), `${img(itemIcon(crop.id))}+${crop.yieldQty}`);
    } else return;
    target = plotEl(i);
  } else if (tool.kind === 'feed' || tool.kind === 'basket') {
    const i = indexOf(key);
    const pen = S.farm.pens[tool.pen];
    const c = pen?.animals[i];
    const e = objEl(`pen${tool.pen}`)?.querySelector<HTMLElement>(`[data-animal="${i}"]`);
    if (!pen || !c || !e) return;
    const a = ANIMALS[PENS[pen.type].animal];
    if (tool.kind === 'feed') {
      if (c.status !== 'hungry' || St.count(a.feedItem) < a.feedQty || !tutorial.allows('feed', i) || St.feedAnimal(tool.pen, i)) return;
      popAt(e, a.produceItem ? `${img(itemIcon(a.feedItem))}-${a.feedQty}` : `${t('pet_fed')} ${img(A.ICON_XP)}+${a.exp}`);
    } else {
      if (c.status !== 'ready' || !tutorial.allows('collect', i)) return;
      if (St.collectAnimal(tool.pen, i)) { drag.stopped = true; return; } // barn full: the collectBlocked event toasts it
      popAt(e, `${img(itemIcon(a.produceItem!))}+${a.produceQty}`);
    }
    target = objEl(`pen${tool.pen}`)?.querySelector<HTMLElement>(`[data-animal="${i}"]`) ?? null;
  } else return;
  drag.done.add(key);
  if (target) {
    target.classList.remove('hit');
    void target.offsetWidth;
    target.classList.add('hit');
  }
}

/** A product dropped into its machine: start it, or list what is missing. */
function startBatch(machine: number, rid: string): void {
  const m = S.farm.machines[machine];
  if (!gate('startRecipe', m.type)) return;
  if (m.queue.length >= m.slots) { toast(t('err_slots'), 'warn'); return; }
  const r = RECIPES[rid];
  const missing = r.inputs.filter((x) => St.count(x.item) < x.qty);
  if (missing.length) { showMissing(rid); return; }
  if (report(St.startRecipe(machine, rid))) popAt(objEl(`mach${machine}`)!, r.inputs.map((x) => `${img(itemIcon(x.item))}-${x.qty}`).join(' '));
}

// ---------------------------------------------------------------------------
// Level-up popup: the new level, its gem / coin reward and everything it unlocks.

let pendingLevelUp = 0;
function unlockCell(u: Unlock): string {
  const icon = u.kind === 'pen' ? A.penArt(u.id).back : u.kind === 'machine' ? buildingIcon(u.id) : u.kind === 'tree' ? treeIcon(u.id, true)
    : u.kind === 'animal' ? animalIcon(u.id) : u.kind === 'fields' ? A.PLOT_SOIL : u.kind === 'feature' ? A.ICON_PLUS : itemIcon(u.id);
  const name = u.kind === 'feature' ? t(`feat_${u.id}`) : u.kind === 'fields' ? t('fields_plus', { n: u.qty ?? 0 }) : t(u.id);
  const tag = u.kind === 'crop' || (u.kind === 'product' && u.qty) ? `<b class="gift">+${u.qty}</b>` : u.qty && u.kind !== 'fields' ? `<b class="gift">×${u.qty}</b>` : '';
  return `<div class="cell">${img(icon)}${tag}<small>${name}</small></div>`;
}

function showLevelUp(level: number): void {
  // A level reached mid-sweep (a harvest gives XP) waits until the finger lifts.
  if (drag) { pendingLevelUp = Math.max(pendingLevelUp, level); return; }
  stopInteractions();
  const p = openPopup('levelup', t('level_up', { n: level }));
  setPopupRenderer(null);
  const unlocks = unlocksAt(level);
  const reward = LEVEL_REWARDS[level];
  p.body.appendChild(el(`<div class="lvlup-badge">${img(A.ICON_XP)}<b>${level}</b></div>`));
  if (reward) p.body.appendChild(el(`<div class="reward">${reward.coin ? `${img(A.ICON_COIN)}+${reward.coin}` : ''}${reward.gem ? `${img(A.ICON_GEM)}+${reward.gem}` : ''}</div>`));
  if (unlocks.length) {
    p.body.appendChild(el(`<div class="center muted">${t('level_unlocks')}</div>`));
    p.body.appendChild(el(`<div class="grid unlocks">${unlocks.map(unlockCell).join('')}</div>`));
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
    .map((x) => `<div class="cell no">${img(itemIcon(x.item))}<b>${St.count(x.item)}/${x.qty}</b><small>${t(x.item)} · ${t('missing_n', { n: x.qty - St.count(x.item) })}</small></div>`).join('');
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
function buyAndPlace(key: string, type: string | undefined, price: number, buy: () => string): void {
  if (S.wallet.coin < price) { if (!FalconSDK.shop.open(`buy_${type ?? key}`)) toast(t('err_coin'), 'warn'); return; }
  closePopup();
  startPlacing(key, type, buy);
}

type ShopTab = St.ShopTab;
let shopTab: ShopTab = 'build';

export function openShop(): void {
  const p = openPopup('shop', t('shop'));
  const render = (): void => {
    p.body.innerHTML = '';
    const lvl = St.farmLevel();
    // A lesson that points at a shop row switches to that row's tab.
    const want = tutorial.targets().find((k) => k.startsWith('shop:'))?.slice(5);
    if (want) shopTab = ANIMALS[want] ? 'animals' : want === 'plot' || TREES[want] ? 'nature' : 'build';
    const tabs = el(`<div class="tabs">${(['build', 'animals', 'nature'] as ShopTab[]).map((k) => `<button class="tab ${shopTab === k ? 'on' : ''}" data-tab="${k}">${t(`tab_${k}`)}${St.newOffers(k) && k !== shopTab ? `<b class="badge">${St.newOffers(k)}</b>` : ''}</button>`).join('')}</div>`);
    tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { shopTab = b.dataset.tab as ShopTab; seenTabs.add(shopTab); render(); }));
    p.body.appendChild(tabs);
    const fresh = new Set(St.shopOffers().filter((o) => !St.offerSeen(o.key)).map((o) => o.key));
    const addRow = (icon: string, name: string, desc: string, price: number, key: string, enabled: boolean, onBuy: () => void, offer = ''): void => {
      const row = el(`<div class="row${enabled ? '' : ' dim'}">${img(icon, 'ic', 52)}<div class="info"><b>${name}${fresh.has(offer) ? `<span class="tag-new">${t('new_tag')}</span>` : ''}</b><small>${desc}</small></div>
        <button class="btn orange small" data-tut="shop:${key}" ${enabled ? '' : 'disabled'}><span class="price">${img(A.ICON_COIN)}${price}</span></button></div>`);
      row.querySelector('button')!.addEventListener('click', onBuy);
      p.body.appendChild(row);
    };
    const tease = (unlock: number): boolean => unlock <= lvl + 3;
    if (shopTab === 'build') {
      // Pens, then machines, each ordered by the level they open at; a type with more copies to come shows "next at".
      for (const pen of Object.values(PENS).sort((a, b) => a.unlockLevels[0] - b.unlockLevels[0])) {
        const owned = St.pensOf(pen.id);
        const allowed = St.allowedCount(pen.unlockLevels);
        if (owned >= pen.unlockLevels.length) continue;
        const nextLvl = pen.unlockLevels[owned];
        if (owned >= allowed && !tease(nextLvl)) continue;
        const desc = owned < allowed ? `${t('pen_desc', { n: pen.capacity, animal: t(pen.animal) })}${owned ? ` · ${t('built_n', { a: owned, b: pen.unlockLevels.length })}` : ''}` : t('unlock_at', { n: nextLvl });
        addRow(A.penArt(pen.id).back, t(pen.id), desc, pen.cost, pen.id, owned < allowed, () => {
          if (!gate('buy', pen.id)) return;
          buyAndPlace(`pen${S.farm.pens.length}`, pen.id, pen.cost, () => St.buyPen(pen.id));
        }, `pen:${pen.id}:${allowed}`);
      }
      for (const m of Object.values(MACHINES).sort((a, b) => a.unlockLevels[0] - b.unlockLevels[0])) {
        const owned = St.machinesOf(m.id);
        const allowed = St.allowedCount(m.unlockLevels);
        if (owned >= m.unlockLevels.length) continue;
        const nextLvl = m.unlockLevels[owned];
        if (owned >= allowed && !tease(nextLvl)) continue;
        const open = m.recipes.filter((r) => RECIPES[r].unlockLevel <= lvl).map((r) => t(RECIPES[r].output));
        const desc = owned < allowed ? `${open.length ? open.slice(0, 4).join(', ') : t(RECIPES[m.recipes[0]].output)}${owned ? ` · ${t('built_n', { a: owned, b: m.unlockLevels.length })}` : ''}` : t('unlock_at', { n: nextLvl });
        addRow(buildingIcon(m.id), t(m.id), desc, m.cost, m.id, owned < allowed, () => {
          if (!gate('buy', m.id)) return;
          buyAndPlace(`mach${S.farm.machines.length}`, m.id, m.cost, () => St.buyMachine(m.id));
        }, `mach:${m.id}:${allowed}`);
      }
    } else if (shopTab === 'animals') {
      for (const pen of Object.values(PENS).sort((a, b) => a.unlockLevels[0] - b.unlockLevels[0])) {
        if (pen.autoFill) continue;
        const a = ANIMALS[pen.animal];
        const open = pen.unlockLevels[0] <= lvl;
        if (!open && !tease(pen.unlockLevels[0])) continue;
        const room = St.penWithRoom(pen.animal) >= 0;
        const total = S.farm.pens.filter((x) => x.type === pen.id).reduce((n, x) => n + x.animals.length, 0);
        const cap = St.pensOf(pen.id) * pen.capacity;
        const what = a.produceItem ? `${t(a.feedItem)} → ${t(a.produceItem)}` : `${t(a.feedItem)} → ${img(A.ICON_XP)}+${a.exp}`;
        const desc = !open ? t('unlock_at', { n: pen.unlockLevels[0] }) : !St.pensOf(pen.id) ? t('err_need_pen', { name: t(pen.id) }) : `${total}/${cap} · ${what}`;
        addRow(animalIcon(a.id), t(a.id), desc, a.cost, a.id, open && room, () => {
          if (!gate('buy', a.id)) return;
          if (report(St.buyAnimal(a.id))) toast(t('animal_in', { name: t(a.id) }));
        }, `animal:${a.id}`);
      }
    } else {
      const fields = S.farm.plots.length;
      const maxF = maxPlots(lvl);
      const nextF = fields >= maxF ? [3, 5, 7, 9].map((d) => lvl + d).find((l) => maxPlots(l) > maxF) ?? 0 : 0;
      addRow(A.PLOT_SOIL, t('plot'), fields >= maxF ? (nextF ? t('next_at', { n: lvl + 1 + ((lvl + 1) % 2) }) : t('maxed')) : `${fields}/${maxF}`, plotCost(fields), 'plot', fields < maxF,
        () => { if (gate('buy', 'plot')) buyAndPlace(`plot${fields}`, undefined, plotCost(fields), () => St.buyPlot()); }, `plot:${maxF}`);
      for (const tr of Object.values(TREES).sort((a, b) => a.unlockLevel - b.unlockLevel)) {
        const open = tr.unlockLevel <= lvl;
        if (!open && !tease(tr.unlockLevel)) continue;
        const owned = St.treesOf(tr.id);
        const gives = tr.produce.filter((x) => (x.unlockLevel ?? 0) <= lvl).map((x) => t(x.item)).join(', ');
        const desc = !open ? t('unlock_at', { n: tr.unlockLevel }) : `${gives} · ${t('every', { t: fmtTime(tr.seconds * 1000) })} · ${t('owned_n', { a: owned, b: tr.max })}`;
        addRow(treeIcon(tr.id, true), t(tr.id), desc, tr.cost, tr.id, open && owned < tr.max, () => {
          if (!gate('buy', tr.id)) return;
          buyAndPlace(`tree${S.farm.trees.length}`, tr.id, tr.cost, () => St.buyTree(tr.id));
        }, `tree:${tr.id}`);
      }
    }
    // Boosters for the match game, bought with the same coins (hidden during a lesson).
    if (shopTab === 'build' && !St.tutorialActive()) {
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
  seenTabs.clear();
  seenTabs.add(shopTab);
}
/** Tabs looked at in the open shop; their offers stop being "new" when it closes. */
const seenTabs = new Set<ShopTab>();
onPopupChange((id) => { if (id === null) for (const tab of seenTabs) St.markOffersSeen(tab); if (id !== 'shop') seenTabs.clear(); });

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
    for (const [item, q] of items) grid.appendChild(el(`<div class="cell">${img(itemIcon(item))}<b>${q}</b><small>${t(item)}</small></div>`));
    if (!items.length) grid.appendChild(el(`<div class="cell" style="grid-column:span 4"><small>—</small></div>`));
    p.body.appendChild(grid);
    // Upgrade section
    const up = St.nextUpgrade(tab);
    if (!up) { p.body.appendChild(el(`<div class="center muted">${t('maxed')}</div>`)); return; }
    const need = up.required.map((r) => `<div class="cell ${St.count(r.item) >= r.qty ? 'ok' : 'no'}">${img(itemIcon(r.item))}<b>${St.count(r.item)}/${r.qty}</b><small>${t(r.item)}</small></div>`).join('');
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
      const row = el(`<div class="row">${img(itemIcon(m), 'ic')}<div class="info"><b>${t(m)}</b><small>${t('owned')}: ${St.count(m)} · ${m === 'nail' || m === 'screw' ? t('barn') : t('silo')}</small></div>
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

/** The truck board. */
function openOrders(): void {
  St.refillOrders(); // before the popup exists, so its render stays pure
  const p = openPopup('orders', t('truck'));
  const render = (): void => {
    p.body.innerHTML = '';
    if (St.farmLevel() < TRUCK_UNLOCK) { p.body.appendChild(el(`<div class="center muted">${t('orders_locked', { n: TRUCK_UNLOCK })}</div>`)); return; }
    // No state changes while rendering: a save here would re-enter render() and duplicate the rows.
    if (!S.farm.orders.length && !S.farm.orderCooldowns.length) { p.body.appendChild(el(`<div class="center muted">${t('order_empty')}</div>`)); return; }
    for (const slot of St.orderSlotsView()) {
      if ('cooldown' in slot) { // a deleted slot: a countdown to the next order, in its place
        p.body.appendChild(el(`<div class="order-empty">${img(A.ICON_CLOCK)}${t('new_order_in')} <b data-timer="${slot.cooldown.at}">${fmtTime(slot.cooldown.at - St.now())}</b></div>`));
        continue;
      }
      const o = slot.order;
      const can = St.canFulfil(o);
      const items = o.items.map((x) => `<div class="cell ${St.count(x.item) >= x.qty ? 'ok' : 'no'}">${img(itemIcon(x.item))}<b>${St.count(x.item)}/${x.qty}</b><small>${t(x.item)}</small></div>`).join('');
      const row = el(`<div class="row" style="flex-direction:column;align-items:stretch;gap:8px"><div class="need" style="justify-content:flex-start">${items}</div>
        <div style="display:flex;align-items:center;gap:8px"><span class="price" style="flex:1">${img(A.ICON_COIN)}${o.coin} &nbsp; ${img(A.ICON_XP)}${o.exp}</span>
        <button class="btn del small skip" title="${t('delete_')}">${img(A.ICON_TRASH)}</button><button class="btn green small go" ${can ? 'data-tut="orders:deliver"' : ''} ${can ? '' : 'disabled'}>${t('deliver')}</button></div></div>`);
      row.querySelector('.go')!.addEventListener('click', () => {
        if (!gate('deliver')) return;
        if (report(St.fulfilOrder(o.id))) { const c = centerOf(root!.querySelector('.pill.coin')!); floatLabel(c.x, c.y + 10, `${img(A.ICON_COIN)}+${o.coin}`); }
      });
      row.querySelector('.skip')!.addEventListener('click', () => { if (!St.tutorialActive()) St.deleteOrder(o.id); });
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

/** The farmhouse: achievements, three tiers each, claimed one at a time. */
function openAchievements(): void {
  const p = openPopup('achievements', t('achievements'));
  const render = (): void => {
    p.body.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const k = St.claimedTiers(a.id);
      const tier = a.tiers[Math.min(k, a.tiers.length - 1)];
      const have = St.stat(a.stat);
      const doneAll = k >= a.tiers.length;
      const claimable = St.claimableTier(a.id) >= 0;
      const pct = doneAll ? 100 : Math.min(100, (have / tier.need) * 100);
      const row = el(`<div class="row ach${doneAll ? ' dim' : ''}"><div class="info"><b>${t(`ach_${a.id}`)} <small class="tiers">${img(A.ICON_STAR)}${Math.min(k + 1, a.tiers.length)}/${a.tiers.length}</small></b>
        <small>${t(`ach_${a.id}_desc`, { n: tier.need })}</small><div class="meter"><i style="width:${pct}%"></i><b>${Math.min(have, tier.need)} / ${tier.need}</b></div></div>
        <div class="achr"><span class="price">${img(A.ICON_GEM)}${tier.gem}</span><span class="price">${img(A.ICON_XP)}${tier.exp}</span>
        <button class="btn ${claimable ? 'green' : 'grey'} small" ${claimable ? 'data-tut="ach:claim"' : ''} ${claimable ? '' : 'disabled'}>${doneAll ? t('claimed') : t('claim')}</button></div></div>`);
      row.querySelector('button')!.addEventListener('click', () => { if (gate('claim') && report(St.claimAchievement(a.id))) toast(`${t('reward')}: +${tier.gem} ${t('gem')}`); });
      p.body.appendChild(row);
    }
  };
  render();
  setPopupRenderer(render);
  tutorial.render();
}

export function levelUnlocked(i: number): boolean {
  const cfg = MATCH_LEVELS[i];
  return cfg.unlockAfter === 0 || (S.match.bestStars[String(cfg.unlockAfter)] ?? 0) >= 1;
}

export function openMatchMap(): void {
  // In the walkthrough the Match button goes straight to level 1.
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
