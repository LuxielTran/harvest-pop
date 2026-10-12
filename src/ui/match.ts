// Match Board screen: a 2.5D wooden tray drawn on the canvas with swap / clear /
// fall animations, the moves & goal HUD, hints, reshuffle, the Golden Shovel
// booster (dig up any one tile without spending a move) and the result card
// with its coin reward and the paid revive.

import FalconSDK from '@falcongames/game-client-sdk';
import * as A from '../art';
import { BOARD_SIZE, BOOSTERS, MATCH_LEVELS, REVIVE_MOVES, REVIVE_PRICE, starsFor, type BoosterConfig, type MatchLevelConfig, type TileKind } from '../config';
import { t } from '../i18n';
import { Board, type Move, type Pos, type Tile } from '../match3';
import * as St from '../state';
import { closePopup, el, getScale, img, openPopup, stage, toStage, toast } from './common';

export interface MatchCallbacks {
  onWin(levelIndex: number, stars: number, movesLeft: number): void;
  onLose(levelIndex: number): void;
  onQuit(levelIndex: number): void;
}

const CELL = 47;
const BX = 12;
const BY = 166;
const PAD = 3;
const W = CELL * BOARD_SIZE;
/** Height of the tray's front face: the board reads as a wooden crate seen from slightly above. */
const TRAY_DEPTH = 16;

interface View { tile: Tile; x: number; y: number; s: number; a: number; }
interface Tween { obj: View; prop: 'x' | 'y' | 's' | 'a'; from: number; to: number; t: number; dur: number; ease: (x: number) => number; resolve?: () => void; }
interface Flyer { kind: TileKind; x: number; y: number; tx: number; ty: number; t: number; }
/** The shovel swing played over a dug tile. */
interface Fx { x: number; y: number; t: number; }

const easeOut = (x: number): number => 1 - (1 - x) * (1 - x);
const easeInOut = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeBounce = (x: number): number => (x < 0.85 ? easeOut(x / 0.85) : 1 - Math.sin(((x - 0.85) / 0.15) * Math.PI) * 0.06);
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

let root: HTMLElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const sprites = new Map<string, HTMLImageElement>();

let cfg: MatchLevelConfig = MATCH_LEVELS[0];
let levelIndex = 0;
let board: Board | null = null;
let views = new Map<number, View>();
let tweens: Tween[] = [];
let flyers: Flyer[] = [];
let fxs: Fx[] = [];
let fading: View[] = [];
let moves = 0;
let collected = 0;
let locked = false;
let paused = false;
let over = false;
let tutorialMode = false;
let selected: Pos | null = null;
let hint: Move | null = null;
let idleSince = 0;
let hintDelay = 4000;
let raf = 0;
let last = 0;
let cb: MatchCallbacks | null = null;
let clock = 0;
let shakeT = 0;
let hudSig = '';
/** The booster waiting for a tile pick. `external` = armed through the FalconGame contract (the studio layer's unit). */
let armed: { key: string; external: boolean } | null = null;

function sprite(kind: string): HTMLImageElement {
  let s = sprites.get(kind);
  if (!s) { s = new Image(); s.src = A.svgUrl(A.TILE_ART[kind] ?? A.ITEM_ICON[kind]); sprites.set(kind, s); }
  return s;
}

function build(): void {
  if (root) return;
  root = el(`<div id="match" class="screen">
    <div class="lawn"></div>
    <canvas id="board"></canvas>
    <div class="mhud">
      <div class="top"><button class="iconbtn" id="m-home">${img(A.ICON_HOME)}</button><span class="lvl" id="m-lvl"></span>
        <div class="pill">${img(A.ICON_CLOCK)}<span id="m-moves">0</span></div></div>
      <div class="goalbox"><div class="gbox" id="m-goal"><img alt=""><div><small>${t('goal')}</small><span id="m-goalv"></span></div></div>
        <div class="gbox"><div class="starrow" id="m-stars" style="transform:scale(.55);margin:-12px -14px"></div></div></div>
    </div>
    <div class="mfoot">
      <div class="btip" id="m-btip" style="display:none"></div>
      <div class="brow" id="m-boosters"></div>
      <button class="btn blue small" id="m-hint">💡 ${t('hint_tap')}</button>
    </div>
  </div>`);
  canvas = root.querySelector<HTMLCanvasElement>('#board')!;
  ctx = canvas.getContext('2d')!;
  root.querySelector<HTMLElement>('.lawn')!.style.backgroundImage = `url("${A.svgUrl(A.LAWN_TILE)}")`;
  root.querySelector('#m-home')!.addEventListener('click', () => { if (!over) quit(); });
  root.querySelector('#m-hint')!.addEventListener('click', () => { if (!locked && !over) { setArmed(null); showHint(); } });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { drag = null; });
  window.addEventListener('resize', fitCanvas);
  for (const k of Object.keys(A.TILE_ART)) sprite(k);
  sprite('shovel');
  stage().appendChild(root);
}

function fitCanvas(): void {
  if (!canvas || !ctx) return;
  const k = (window.devicePixelRatio || 1) * getScale();
  canvas.width = Math.round(400 * k);
  canvas.height = Math.round(800 * k);
  canvas.style.width = '400px';
  canvas.style.height = '800px';
  ctx.setTransform(k, 0, 0, k, 0, 0);
}

export function openMatch(index: number, callbacks: MatchCallbacks, opts: { tutorial?: boolean } = {}): void {
  build();
  closePopup();
  cb = callbacks;
  levelIndex = Math.max(0, Math.min(MATCH_LEVELS.length - 1, index));
  cfg = MATCH_LEVELS[levelIndex];
  board = new Board(cfg, opts.tutorial ? 0 : Math.floor(Math.random() * 1e6));
  views = new Map();
  tweens = [];
  flyers = [];
  fxs = [];
  fading = [];
  moves = cfg.moves;
  collected = 0;
  locked = false;
  paused = false;
  over = false;
  tutorialMode = !!opts.tutorial;
  selected = null;
  hint = null;
  armed = null;
  hintDelay = opts.tutorial ? 1500 : 4000;
  idleSince = performance.now();
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
    const tile = board.grid[r][c]!;
    views.set(tile.id, { tile, x: cx(c), y: cy(r) - 500 - r * 20, s: 1, a: 1 });
    tweenTo(views.get(tile.id)!, 'y', cy(r), 420 + r * 40, easeBounce);
  }
  root!.classList.add('on');
  root!.querySelector('#m-lvl')!.textContent = `${t('lvl')} ${cfg.id}`;
  (root!.querySelector('#m-goal img') as HTMLImageElement).src = A.svgUrl(A.TILE_ART[cfg.goal.tile]);
  hudSig = '';
  updateHud();
  renderBoosterBar();
  fitCanvas();
  cancelAnimationFrame(raf);
  last = performance.now();
  raf = requestAnimationFrame(frame);
}

export function closeMatch(): void {
  cancelAnimationFrame(raf);
  root?.classList.remove('on');
  board = null;
  cb = null;
  armed = null;
}

export function isMatchOpen(): boolean { return !!root?.classList.contains('on'); }
export function pauseMatch(on: boolean): void { paused = on; }
export function matchProgress(): number { return board ? Math.min(100, Math.round((collected / cfg.goal.qty) * 100)) : 0; }

/** Continue a lost board with a few more moves (the caller has already paid, if paying was needed). */
export function reviveMatch(): boolean {
  if (!board || !over) return false;
  closePopup();
  over = false;
  locked = false;
  moves += REVIVE_MOVES;
  toast(t('revive_moves', { n: REVIVE_MOVES }));
  updateHud();
  ensureMoves();
  idleSince = performance.now();
  return true;
}

function quit(): void {
  const i = levelIndex;
  const callbacks = cb;
  closeMatch();
  callbacks?.onQuit(i);
}

const cx = (c: number): number => BX + c * CELL + CELL / 2;
const cy = (r: number): number => BY + r * CELL + CELL / 2;

function cellAt(x: number, y: number): Pos | null {
  const c = Math.floor((x - BX) / CELL);
  const r = Math.floor((y - BY) / CELL);
  return c >= 0 && c < BOARD_SIZE && r >= 0 && r < BOARD_SIZE ? { r, c } : null;
}

function tweenTo(obj: View, prop: 'x' | 'y' | 's' | 'a', to: number, dur: number, ease = easeOut): Promise<void> {
  return new Promise((resolve) => {
    tweens = tweens.filter((tw) => !(tw.obj === obj && tw.prop === prop));
    tweens.push({ obj, prop, from: obj[prop], to, t: 0, dur, ease, resolve });
  });
}

function goalTarget(): { x: number; y: number } {
  const goalBox = root!.querySelector('#m-goal')!.getBoundingClientRect();
  return toStage(goalBox.left + 26, goalBox.top + goalBox.height / 2);
}

function updateHud(): void {
  if (!root) return;
  const stars = over ? 0 : collected >= cfg.goal.qty ? starsFor(moves) : starsFor(moves - 1);
  const sig = `${moves}:${collected}:${stars}`;
  if (sig === hudSig) return;
  hudSig = sig;
  root.querySelector('#m-moves')!.textContent = String(moves);
  root.querySelector('#m-goalv')!.textContent = `${Math.min(collected, cfg.goal.qty)}/${cfg.goal.qty}`;
  root.querySelector('#m-goal')!.classList.toggle('done', collected >= cfg.goal.qty);
  const sr = root.querySelector('#m-stars')!;
  sr.innerHTML = [1, 2, 3].map((s) => img(A.ICON_STAR, stars >= s ? 'on' : '')).join('');
}

// ---------------------------------------------------------------------------
// Boosters: the bar under the board, arming, buying and digging

function renderBoosterBar(): void {
  if (!root) return;
  const row = root.querySelector<HTMLElement>('#m-boosters')!;
  const tip = root.querySelector<HTMLElement>('#m-btip')!;
  row.innerHTML = '';
  // Hidden on the tutorial board, so the first level stays focused on matching.
  row.style.display = tutorialMode ? 'none' : '';
  if (!tutorialMode) {
    for (const b of BOOSTERS) {
      if (cfg.id < b.unlock) continue;
      const n = St.boosterCount(b.key);
      const plate = el(`<button class="bplate${armed?.key === b.key ? ' armed' : ''}" data-key="${b.key}" data-tut="booster:${b.key}">${img(A.ITEM_ICON[b.key])}<b class="cnt${n ? '' : ' plus'}">${n || '+'}</b></button>`);
      plate.addEventListener('click', () => tapPlate(b));
      row.appendChild(plate);
    }
  }
  tip.style.display = armed ? '' : 'none';
  if (armed) tip.textContent = t('booster_tip');
}

function setArmed(a: { key: string; external: boolean } | null): void {
  armed = a;
  if (a) { hint = null; selected = null; drag = null; }
  renderBoosterBar();
}

/** Arm `key` so the next tap on a tile digs it. `external` units belong to the studio layer. */
export function armBooster(key: string, external = false): boolean {
  if (!board || over || locked || paused) return false;
  if (!BOOSTERS.some((b) => b.key === key)) return false;
  if (!external && St.boosterCount(key) <= 0) return false;
  setArmed({ key, external });
  return true;
}
export function isBoosterArmed(key: string): boolean { return armed?.key === key; }
export function cancelBooster(): void { if (armed) setArmed(null); }

function tapPlate(b: BoosterConfig): void {
  if (locked || over || paused) return;
  if (armed?.key === b.key) { cancelBooster(); return; }
  if (St.boosterCount(b.key) > 0) armBooster(b.key);
  else openBoosterBuy(b);
}

function openBoosterBuy(b: BoosterConfig): void {
  const p = openPopup('booster', t(`booster_${b.key}`));
  p.body.innerHTML = `<div class="bbuy">${img(A.ITEM_ICON[b.key], 'big')}<p>${t(`booster_${b.key}_desc`)}</p>
    <div class="muted">${t('booster_owned', { n: St.boosterCount(b.key) })} · ${t('coin_balance', { n: St.S.wallet.coin })}</div></div>`;
  p.foot.style.display = '';
  const buy = el(`<button class="btn orange"><span class="price">${img(A.ICON_COIN)}${b.price}</span> ${t('buy')}</button>`);
  buy.addEventListener('click', () => {
    const err = St.buyBooster(b.key);
    // Every coin-short path opens the SDK shop when the studio layer turned it on.
    if (err === 'err_coin') { if (!FalconSDK.shop.open(`buy_booster_${b.key}`)) toast(t('err_coin'), 'warn'); return; }
    if (err) { toast(t(err), 'warn'); return; }
    closePopup();
    toast(t('booster_bought', { name: t(`booster_${b.key}`) }));
    armBooster(b.key);
  });
  p.foot.appendChild(buy);
}

/** The Golden Shovel: remove one tile for free, then let the board settle and cascade. */
async function dig(pos: Pos): Promise<void> {
  if (!board || !armed || locked || over) return;
  const tile = board.grid[pos.r][pos.c];
  if (!tile) return;
  const a = armed;
  if (!a.external && !St.useBooster(a.key)) { setArmed(null); return; }
  setArmed(null);
  locked = true;
  if (FalconSDK.analytics.turn.isActive()) FalconSDK.analytics.turn.useBooster(a.key);
  const v = views.get(tile.id)!;
  fxs.push({ x: v.x, y: v.y, t: 0 });
  await wait(230);
  if (!board) return;
  shakeT = 0.12;
  board.grid[pos.r][pos.c] = null;
  views.delete(tile.id);
  if (tile.kind === cfg.goal.tile) {
    collected++;
    const tg = goalTarget();
    flyers.push({ kind: tile.kind, x: v.x, y: v.y, tx: tg.x, ty: tg.y, t: 0 });
  } else {
    fading.push(v);
    await tweenTo(v, 's', 0, 180);
    fading = [];
  }
  updateHud();
  await dropTiles();
  await resolve();
  afterTurn();
}

// ---------------------------------------------------------------------------
// Input

let drag: { pos: Pos; x: number; y: number } | null = null;

function onDown(e: PointerEvent): void {
  if (locked || over || paused || !board) return;
  const p = toStage(e.clientX, e.clientY);
  const pos = cellAt(p.x, p.y);
  if (!pos) return;
  if (armed) { void dig(pos); return; }
  drag = { pos, x: p.x, y: p.y };
  idleSince = performance.now();
  hint = null;
}

function onMove(e: PointerEvent): void {
  if (!drag || locked || over || paused || !board) return;
  const p = toStage(e.clientX, e.clientY);
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.hypot(dx, dy) < CELL * 0.35) return;
  const from = drag.pos;
  const to: Pos = Math.abs(dx) > Math.abs(dy) ? { r: from.r, c: from.c + Math.sign(dx) } : { r: from.r + Math.sign(dy), c: from.c };
  drag = null;
  if (to.r < 0 || to.c < 0 || to.r >= BOARD_SIZE || to.c >= BOARD_SIZE) return;
  selected = null;
  void trySwap(from, to);
}

function onUp(): void {
  if (!drag || locked || over || paused || !board) { drag = null; return; }
  const pos = drag.pos;
  drag = null;
  if (selected && Board.adjacent(selected, pos)) {
    const from = selected;
    selected = null;
    void trySwap(from, pos);
    return;
  }
  selected = selected && selected.r === pos.r && selected.c === pos.c ? null : pos;
}

async function trySwap(a: Pos, b: Pos): Promise<void> {
  if (!board) return;
  locked = true;
  hint = null;
  const va = views.get(board.grid[a.r][a.c]!.id)!;
  const vb = views.get(board.grid[b.r][b.c]!.id)!;
  const ok = board.wouldMatch(a, b);
  await Promise.all([tweenTo(va, 'x', cx(b.c), 150, easeInOut), tweenTo(va, 'y', cy(b.r), 150, easeInOut), tweenTo(vb, 'x', cx(a.c), 150, easeInOut), tweenTo(vb, 'y', cy(a.r), 150, easeInOut)]);
  if (!ok) {
    shakeT = 0.25;
    await Promise.all([tweenTo(va, 'x', cx(a.c), 150, easeInOut), tweenTo(va, 'y', cy(a.r), 150, easeInOut), tweenTo(vb, 'x', cx(b.c), 150, easeInOut), tweenTo(vb, 'y', cy(b.r), 150, easeInOut)]);
    locked = false;
    idleSince = performance.now();
    return;
  }
  board.swap(a, b);
  moves--;
  updateHud();
  await resolve();
  afterTurn();
}

/** After a swap or a dig has settled: win, lose, or hand the board back. */
function afterTurn(): void {
  if (over || !board) return;
  if (collected >= cfg.goal.qty) { finish(true); return; }
  if (moves <= 0) { finish(false); return; }
  ensureMoves();
  locked = false;
  idleSince = performance.now();
}

/** Clear → fall → spawn, repeated while cascades keep matching. */
async function resolve(): Promise<void> {
  if (!board) return;
  for (let cascade = 0; cascade < 40; cascade++) {
    const cleared = board.clearMatches();
    if (!cleared.length) break;
    const target = goalTarget();
    const anims: Promise<void>[] = [];
    for (const { kind, id } of cleared) {
      const v = views.get(id);
      if (!v) continue;
      views.delete(v.tile.id);
      if (kind === cfg.goal.tile) { collected++; flyers.push({ kind, x: v.x, y: v.y, tx: target.x, ty: target.y, t: 0 }); }
      else { anims.push(tweenTo(v, 's', 0, 180)); fading.push(v); }
    }
    await Promise.all(anims);
    fading = [];
    updateHud();
    await dropTiles();
  }
}

/** Drop tiles into the holes and spawn new ones from above. */
async function dropTiles(): Promise<void> {
  if (!board) return;
  const g = board.applyGravity();
  const falls: Promise<void>[] = [];
  for (const f of g.falls) {
    const v = views.get(f.tile.id)!;
    falls.push(tweenTo(v, 'y', cy(f.toR), 90 + (f.toR - f.fromR) * 55, easeBounce));
  }
  for (const f of g.spawned) {
    const v: View = { tile: f.tile, x: cx(f.c), y: cy(f.fromR), s: 1, a: 1 };
    views.set(f.tile.id, v);
    falls.push(tweenTo(v, 'y', cy(f.toR), 90 + (f.toR - f.fromR) * 55, easeBounce));
  }
  await Promise.all(falls);
}

function ensureMoves(): void {
  if (!board) return;
  if (board.legalMoves().length > 0) return;
  board.reshuffle();
  toast('🔀');
  views = new Map();
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
    const tile = board.grid[r][c]!;
    const v: View = { tile, x: cx(c), y: cy(r), s: 0, a: 1 };
    views.set(tile.id, v);
    void tweenTo(v, 's', 1, 300);
  }
}

function showHint(): void {
  if (!board) return;
  hint = board.bestHint(cfg.goal.tile);
  idleSince = performance.now();
}

function finish(won: boolean): void {
  over = true;
  locked = true;
  selected = null;
  hint = null;
  setArmed(null);
  updateHud();
  const i = levelIndex;
  setTimeout(() => {
    if (!cb) return;
    if (won) cb.onWin(i, starsFor(moves), moves);
    else cb.onLose(i);
  }, 350);
}

/**
 * The result card. A win shows the stars and the coin reward; a loss offers the
 * paid revive (`onRevive` returns true when the round continues). `onNext` is
 * omitted when there is no next level or during the tutorial.
 */
export function showResult(o: {
  won: boolean; stars: number; delta: number; coins: number;
  onFarm: () => void; onNext?: () => void; onRetry?: () => void; onRevive?: () => boolean;
}): void {
  const p = openPopup('result', o.won ? t('win_title') : t('lose_title'), { closable: false });
  const starsHtml = `<div class="starrow">${[1, 2, 3].map((s) => img(A.ICON_STAR, o.won && o.stars >= s ? 'on' : '')).join('')}</div>`;
  const rows = o.won
    ? `<div class="bigstar">${img(A.ICON_STAR)} ${o.delta > 0 ? t('stars_earned', { n: o.delta }) : t('stars_none')}</div><div class="muted center">${t('star_delta')}</div>
       <div class="reward">${img(A.ICON_COIN)} ${t('coins_earned', { n: o.coins })}</div>`
    : `<div class="center muted">${t('goal')}: ${Math.min(collected, cfg.goal.qty)}/${cfg.goal.qty}</div>`;
  p.body.innerHTML = `<div class="center muted">${t('lvl')} ${cfg.id}</div>${starsHtml}${rows}`;
  if (!o.won && o.onRevive) {
    const box = el(`<div class="revive"><div class="info"><b>${t('continue_')}</b><small>${t('revive_offer', { n: REVIVE_MOVES })}</small></div>
      <button class="btn green"><span class="price">${img(A.ICON_COIN)}${REVIVE_PRICE}</span></button></div>`);
    box.querySelector('button')!.addEventListener('click', () => { if (o.onRevive!()) closePopup(); });
    p.body.appendChild(box);
    p.body.appendChild(el(`<div class="center muted">${t('coin_balance', { n: St.S.wallet.coin })}</div>`));
  }
  p.foot.style.display = '';
  const farm = el(`<button class="btn grey">${img(A.ICON_HOME)}${t('farm')}</button>`);
  farm.addEventListener('click', () => { closePopup(); o.onFarm(); });
  p.foot.appendChild(farm);
  if (o.onRetry) { const b = el(`<button class="btn orange">${t('retry')}</button>`); b.addEventListener('click', () => { closePopup(); o.onRetry!(); }); p.foot.appendChild(b); }
  if (o.onNext) { const b = el(`<button class="btn green">${t('next')} ▶</button>`); b.addEventListener('click', () => { closePopup(); o.onNext!(); }); p.foot.appendChild(b); }
}

// ---------------------------------------------------------------------------
// Render loop

function frame(ts: number): void {
  raf = requestAnimationFrame(frame);
  const dt = Math.min((ts - last) / 1000, 1 / 20);
  last = ts;
  if (paused) return;
  clock += dt;
  if (shakeT > 0) shakeT -= dt;
  for (const tw of tweens) {
    tw.t += dt * 1000;
    const k = Math.min(1, tw.t / tw.dur);
    tw.obj[tw.prop] = tw.from + (tw.to - tw.from) * tw.ease(k);
  }
  const done = tweens.filter((tw) => tw.t >= tw.dur);
  tweens = tweens.filter((tw) => tw.t < tw.dur);
  for (const tw of done) tw.resolve?.();
  for (const f of flyers) f.t += dt / 0.45;
  flyers = flyers.filter((f) => f.t < 1);
  for (const f of fxs) f.t += dt / 0.5;
  fxs = fxs.filter((f) => f.t < 1);
  if (!locked && !over && !hint && !armed && performance.now() - idleSince > hintDelay) showHint();
  draw();
}

function draw(): void {
  if (!ctx || !board) return;
  const g = ctx;
  g.clearRect(0, 0, 400, 800);
  g.save();
  if (shakeT > 0) g.translate(Math.sin(clock * 90) * 3, 0);
  // The tray: ground shadow, the dark front face, the wooden rim, then the field.
  const fx0 = BX - 10, fy0 = BY - 10, fw = W + 20, fh = W + 20;
  g.fillStyle = 'rgba(0,0,0,.18)';
  roundRect(g, fx0 + 6, fy0 + TRAY_DEPTH + 8, fw, fh, 18);
  g.fill();
  g.fillStyle = '#5a3512';
  roundRect(g, fx0, fy0 + TRAY_DEPTH, fw, fh, 18);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,.28)';
  g.lineWidth = 1.5;
  for (let x = fx0 + 46; x < fx0 + fw - 12; x += 48) { g.beginPath(); g.moveTo(x, fy0 + fh - 4); g.lineTo(x, fy0 + fh + TRAY_DEPTH - 5); g.stroke(); }
  g.fillStyle = '#7a4a1f';
  roundRect(g, fx0, fy0, fw, fh, 18);
  g.fill();
  g.fillStyle = '#b5733a';
  roundRect(g, fx0 + 4, fy0 + 4, fw - 8, fh - 8, 14);
  g.fill();
  g.fillStyle = '#c98b4a';
  roundRect(g, fx0 + 4, fy0 + 4, fw - 8, 5, 4);
  g.fill();
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
    g.fillStyle = (r + c) % 2 === 0 ? '#9ad97a' : '#86c968';
    g.fillRect(BX + c * CELL, BY + r * CELL, CELL, CELL);
  }
  // Inner shade along the top and left edges makes the field sit inside the tray.
  const shadeTop = g.createLinearGradient(0, BY, 0, BY + 16);
  shadeTop.addColorStop(0, 'rgba(0,0,0,.24)');
  shadeTop.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = shadeTop;
  g.fillRect(BX, BY, W, 16);
  const shadeLeft = g.createLinearGradient(BX, 0, BX + 10, 0);
  shadeLeft.addColorStop(0, 'rgba(0,0,0,.16)');
  shadeLeft.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = shadeLeft;
  g.fillRect(BX, BY, 10, W);
  // Selection / hint
  const ring = (p: Pos, color: string, w: number): void => {
    g.strokeStyle = color;
    g.lineWidth = w;
    roundRect(g, BX + p.c * CELL + 2, BY + p.r * CELL + 2, CELL - 4, CELL - 4, 10);
    g.stroke();
  };
  if (selected) ring(selected, '#fff', 4);
  if (hint) { const k = 3 + Math.sin(clock * 8) * 1.5; ring(hint.a, '#ffe16b', k); ring(hint.b, '#ffe16b', k); }
  if (armed) {
    // A soft pulse over the whole field says "pick a tile".
    g.fillStyle = `rgba(255,225,107,${0.08 + Math.sin(clock * 5) * 0.05})`;
    g.fillRect(BX, BY, W, W);
  }
  // Tiles, with a ground shadow each so they sit on the field
  const pulse = 1 + Math.sin(clock * 4) * 0.03;
  const ordered = [...views.values()].sort((a, b) => a.y - b.y);
  for (const v of ordered) drawTile(g, v.tile.kind, v.x, v.y, v.s * (v.tile.kind === cfg.goal.tile ? pulse : 1), v.a);
  for (const v of fading) drawTile(g, v.tile.kind, v.x, v.y, v.s, v.a);
  // The shovel swing over a dug tile
  for (const f of fxs) {
    const k = f.t;
    const angle = -0.9 + easeOut(Math.min(1, k / 0.5)) * 1.3;
    g.save();
    g.globalAlpha = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
    g.translate(f.x + 8, f.y - 10);
    g.rotate(angle);
    g.drawImage(sprite('shovel'), -12, -36, 46, 46);
    g.restore();
  }
  g.restore();
  // Flyers to the goal box
  for (const f of flyers) {
    const k = easeInOut(f.t);
    const x = f.x + (f.tx - f.x) * k;
    const y = f.y + (f.ty - f.y) * k - Math.sin(k * Math.PI) * 60;
    drawTile(g, f.kind, x, y, 1 - k * 0.5, 1, false);
  }
}

function drawTile(g: CanvasRenderingContext2D, kind: TileKind, x: number, y: number, s: number, a: number, shadow = true): void {
  if (s <= 0.01 || a <= 0.01) return;
  const size = (CELL - PAD * 2) * s;
  g.globalAlpha = a;
  if (shadow) {
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.beginPath();
    g.ellipse(x + 1, y + size * 0.44, size * 0.36, size * 0.11, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.drawImage(sprite(kind), x - size / 2, y - size / 2 - 2, size, size);
  g.globalAlpha = 1;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// QA hook (`?debug=1`): lets an automated test read the hint, tap cells and drive the booster.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __hp: unknown }).__hp = {
    hint: () => (board ? board.bestHint(cfg.goal.tile) : null),
    moves: () => (board ? board.legalMoves() : []),
    cell: (p: Pos) => ({ x: cx(p.c), y: cy(p.r) }),
    state: () => ({ moves, collected, locked, over, goal: cfg.goal.qty, armed: armed?.key ?? null, coins: St.S.wallet.coin, boosters: { ...St.S.boosters } }),
    arm: (key: string) => armBooster(key),
    dig: (p: Pos) => dig(p),
    buy: (key: string) => St.buyBooster(key),
    tileAt: (p: Pos) => board?.grid[p.r][p.c]?.kind ?? null,
    swap: (a: Pos, b: Pos) => trySwap(a, b),
    setMoves: (n: number) => { moves = n; hudSig = ''; updateHud(); },
    setCollected: (n: number) => { collected = n; hudSig = ''; updateHud(); },
  };
}
