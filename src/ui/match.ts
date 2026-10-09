// Match Board screen: canvas board with swap / clear / fall animations,
// the moves & goal HUD, hints, reshuffle and the result card.

import * as A from '../art';
import { BOARD_SIZE, MATCH_LEVELS, REVIVE_MOVES, starsFor, type MatchLevelConfig, type TileKind } from '../config';
import { t } from '../i18n';
import { Board, type Move, type Pos, type Tile } from '../match3';
import { closePopup, el, getScale, img, openPopup, stage, toStage, toast } from './common';

export interface MatchCallbacks {
  onWin(levelIndex: number, stars: number, movesLeft: number): void;
  onLose(levelIndex: number): void;
  onQuit(levelIndex: number): void;
}

const CELL = 47;
const BX = 12;
const BY = 180;
const PAD = 3;

interface View { tile: Tile; x: number; y: number; s: number; a: number; }
interface Tween { obj: View; prop: 'x' | 'y' | 's' | 'a'; from: number; to: number; t: number; dur: number; ease: (x: number) => number; resolve?: () => void; }
interface Flyer { kind: TileKind; x: number; y: number; tx: number; ty: number; t: number; }

const easeOut = (x: number): number => 1 - (1 - x) * (1 - x);
const easeInOut = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeBounce = (x: number): number => (x < 0.85 ? easeOut(x / 0.85) : 1 - Math.sin(((x - 0.85) / 0.15) * Math.PI) * 0.06);

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
let moves = 0;
let collected = 0;
let locked = false;
let paused = false;
let over = false;
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

function sprite(kind: string): HTMLImageElement {
  let s = sprites.get(kind);
  if (!s) { s = new Image(); s.src = A.svgUrl(A.TILE_ART[kind]); sprites.set(kind, s); }
  return s;
}

function build(): void {
  if (root) return;
  root = el(`<div id="match" class="screen">
    <canvas id="board"></canvas>
    <div class="mhud">
      <div class="top"><button class="iconbtn" id="m-home">${img(A.ICON_HOME)}</button><span class="lvl" id="m-lvl"></span>
        <div class="pill">${img(A.ICON_CLOCK)}<span id="m-moves">0</span></div></div>
      <div class="goalbox"><div class="gbox" id="m-goal"><img alt=""><div><small>${t('goal')}</small><span id="m-goalv"></span></div></div>
        <div class="gbox"><div class="starrow" id="m-stars" style="transform:scale(.55);margin:-12px -14px"></div></div></div>
    </div>
    <div class="mfoot"><button class="btn blue small" id="m-hint">💡 ${t('hint_tap')}</button></div>
  </div>`);
  canvas = root.querySelector<HTMLCanvasElement>('#board')!;
  ctx = canvas.getContext('2d')!;
  root.querySelector('#m-home')!.addEventListener('click', () => { if (!over) quit(); });
  root.querySelector('#m-hint')!.addEventListener('click', () => { if (!locked && !over) showHint(); });
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { drag = null; });
  window.addEventListener('resize', fitCanvas);
  for (const k of Object.keys(A.TILE_ART)) sprite(k);
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
  moves = cfg.moves;
  collected = 0;
  locked = false;
  paused = false;
  over = false;
  selected = null;
  hint = null;
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
}

export function isMatchOpen(): boolean { return !!root?.classList.contains('on'); }
export function pauseMatch(on: boolean): void { paused = on; }
export function matchProgress(): number { return board ? Math.min(100, Math.round((collected / cfg.goal.qty) * 100)) : 0; }

/** Studio revive: a few more moves on a lost board. */
export function reviveMatch(): boolean {
  if (!board || !over) return false;
  closePopup();
  over = false;
  locked = false;
  moves += REVIVE_MOVES;
  toast(t('revive_moves', { n: REVIVE_MOVES }));
  updateHud();
  ensureMoves();
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
// Input

let drag: { pos: Pos; x: number; y: number } | null = null;

function onDown(e: PointerEvent): void {
  if (locked || over || paused || !board) return;
  const p = toStage(e.clientX, e.clientY);
  const pos = cellAt(p.x, p.y);
  if (!pos) return;
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
  if (over || !board) return;
  if (collected >= cfg.goal.qty) { finish(true); return; }
  if (moves <= 0) { finish(false); return; }
  ensureMoves();
  locked = false;
  idleSince = performance.now();
}

async function resolve(): Promise<void> {
  if (!board) return;
  for (let cascade = 0; cascade < 40; cascade++) {
    const cleared = board.clearMatches();
    if (!cleared.length) break;
    const goalBox = root!.querySelector('#m-goal')!.getBoundingClientRect();
    const target = toStage(goalBox.left + 26, goalBox.top + goalBox.height / 2);
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
}

let fading: View[] = [];

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
  updateHud();
  const i = levelIndex;
  setTimeout(() => {
    if (!cb) return;
    if (won) cb.onWin(i, starsFor(moves), moves);
    else cb.onLose(i);
  }, 350);
}

/** The result card. `onNext` is omitted when there is no next level or during the tutorial. */
export function showResult(o: { won: boolean; stars: number; delta: number; onFarm: () => void; onNext?: () => void; onRetry?: () => void }): void {
  const p = openPopup('result', o.won ? t('win_title') : t('lose_title'), { closable: false });
  const starsHtml = `<div class="starrow">${[1, 2, 3].map((s) => img(A.ICON_STAR, o.won && o.stars >= s ? 'on' : '')).join('')}</div>`;
  const row = o.won
    ? `<div class="bigstar">${img(A.ICON_STAR)} ${o.delta > 0 ? t('stars_earned', { n: o.delta }) : t('stars_none')}</div><div class="muted center">${t('star_delta')}</div>`
    : `<div class="center muted">${t('goal')}: ${Math.min(collected, cfg.goal.qty)}/${cfg.goal.qty}</div>`;
  p.body.innerHTML = `<div class="center muted">${t('lvl')} ${cfg.id}</div>${starsHtml}${row}`;
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
  if (!locked && !over && !hint && performance.now() - idleSince > hintDelay) showHint();
  draw();
}

function draw(): void {
  if (!ctx || !board) return;
  const g = ctx;
  g.clearRect(0, 0, 400, 800);
  // Board frame
  g.save();
  if (shakeT > 0) g.translate(Math.sin(clock * 90) * 3, 0);
  roundRect(g, BX - 8, BY - 8, CELL * BOARD_SIZE + 16, CELL * BOARD_SIZE + 16, 18);
  g.fillStyle = '#7a4a1f';
  g.fill();
  roundRect(g, BX - 4, BY - 4, CELL * BOARD_SIZE + 8, CELL * BOARD_SIZE + 8, 14);
  g.fillStyle = '#b5733a';
  g.fill();
  for (let r = 0; r < BOARD_SIZE; r++) for (let c = 0; c < BOARD_SIZE; c++) {
    g.fillStyle = (r + c) % 2 === 0 ? '#9ad97a' : '#86c968';
    g.fillRect(BX + c * CELL, BY + r * CELL, CELL, CELL);
  }
  // Selection / hint
  const ring = (p: Pos, color: string, w: number): void => {
    g.strokeStyle = color;
    g.lineWidth = w;
    roundRect(g, BX + p.c * CELL + 2, BY + p.r * CELL + 2, CELL - 4, CELL - 4, 10);
    g.stroke();
  };
  if (selected) ring(selected, '#fff', 4);
  if (hint) { const k = 3 + Math.sin(clock * 8) * 1.5; ring(hint.a, '#ffe16b', k); ring(hint.b, '#ffe16b', k); }
  // Tiles
  const pulse = 1 + Math.sin(clock * 4) * 0.03;
  const ordered = [...views.values()].sort((a, b) => a.y - b.y);
  for (const v of ordered) drawTile(g, v.tile.kind, v.x, v.y, v.s * (v.tile.kind === cfg.goal.tile ? pulse : 1), v.a);
  for (const v of fading) drawTile(g, v.tile.kind, v.x, v.y, v.s, v.a);
  g.restore();
  // Flyers to the goal box
  for (const f of flyers) {
    const k = easeInOut(f.t);
    const x = f.x + (f.tx - f.x) * k;
    const y = f.y + (f.ty - f.y) * k - Math.sin(k * Math.PI) * 60;
    drawTile(g, f.kind, x, y, 1 - k * 0.5, 1);
  }
}

function drawTile(g: CanvasRenderingContext2D, kind: TileKind, x: number, y: number, s: number, a: number): void {
  if (s <= 0.01 || a <= 0.01) return;
  const size = (CELL - PAD * 2) * s;
  g.globalAlpha = a;
  g.drawImage(sprite(kind), x - size / 2, y - size / 2, size, size);
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

// QA hook (`?debug=1`): lets an automated test read the hint and tap cells.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __hp: unknown }).__hp = {
    hint: () => (board ? board.bestHint(cfg.goal.tile) : null),
    moves: () => (board ? board.legalMoves() : []),
    cell: (p: Pos) => ({ x: cx(p.c), y: cy(p.r) }),
    state: () => ({ moves, collected, locked, over, goal: cfg.goal.qty }),
  };
}
