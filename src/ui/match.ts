// Match Board screen: a 2.5D wooden tray drawn on the canvas. Boards of any
// shape up to 9×9 with Mud, Wooden Crates, Soil and farm animals; Tractor
// Cropsies and Rainbow Seeds with their blasts; the moves / goals / stars HUD;
// hints and reshuffle; the booster bar (Golden Shovel, Lucky Horseshoe, Witch
// Fruit); and the result card with its coin reward and the paid revive.

import FalconSDK from '@falcongames/game-client-sdk';
import * as A from '../art';
import { BOOSTERS, BOOSTER_GIFT, EXTRA_MOVES, MATCH_LEVELS, REVIVE_MOVES, REVIVE_PRICE, SCORE, STAR_SCORES, starsForScore, type BoosterConfig, type MatchLevelConfig, type TutorialKey } from '../config';
import { t } from '../i18n';
import {
  Board, goalFor, goalsDone, goalsProgress, makeGoals, scoreTurn, stepScore, type Special,
  type Fall, type GoalProgress, type Hit, type Move, type Pos, type StepCtx, type StepResult, type Tile,
} from '../match3';
import * as St from '../state';
import { closePopup, el, getScale, img, openPopup, stage, toStage, toast } from './common';

export interface MatchCallbacks {
  onWin(levelIndex: number, stars: number, movesLeft: number): void;
  onLose(levelIndex: number): void;
  onQuit(levelIndex: number): void;
}

/** Board area on the 400×800 stage. */
const AREA = { x: 12, y: 168, w: 376, h: 376 };
const PAD = 3;
/** Height of the tray's front face: the board reads as a wooden crate seen from slightly above. */
const TRAY_DEPTH = 16;

interface View { tile: Tile; x: number; y: number; s: number; a: number; }
interface Tween { obj: View; prop: 'x' | 'y' | 's' | 'a'; from: number; to: number; t: number; dur: number; ease: (x: number) => number; resolve?: () => void; }
interface Mover { view: View; pts: { x: number; y: number }[]; t: number; dur: number; resolve: () => void; }
interface Flyer { key: string; x: number; y: number; tx: number; ty: number; t: number; }
interface Fx { kind: 'shovel' | 'witch' | 'row' | 'col' | 'cross' | 'rainbow' | 'puff' | 'sparkle' | 'wrap' | 'bee'; x: number; y: number; t: number; dur: number; targets?: { x: number; y: number }[]; size?: number; }

const easeOut = (x: number): number => 1 - (1 - x) * (1 - x);
const easeInOut = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeBounce = (x: number): number => (x < 0.85 ? easeOut(x / 0.85) : 1 - Math.sin(((x - 0.85) / 0.15) * Math.PI) * 0.06);
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const SPRITES: Record<string, string> = {
  ...A.TILE_ART, rainbow: A.RAINBOW_SEED, chick: A.CHICK_TILE, piglet: A.PIGLET_TILE,
  stripe_row: A.STRIPE_ROW, stripe_col: A.STRIPE_COL, mud: A.MUD_TILE, crate2: A.CRATE_TILE, crate1: A.CRATE_CRACKED,
  soil: A.SOIL_TILE, soilicon: A.ICON_SOIL, tractor: A.ICON_TRACTOR, shovel: A.ICON_SHOVEL, witch: A.ICON_WITCH, basket: A.ICON_ANY_GOAL,
  haybale: A.HAYBALE_WRAP, beebadge: A.BEE_BADGE, bee: A.BEE, hive: A.ICON_BEEHIVE, hand: A.ICON_HAND,
};

let root: HTMLElement | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
const sprites = new Map<string, HTMLImageElement>();

let cfg: MatchLevelConfig = MATCH_LEVELS[0];
let levelIndex = 0;
let board: Board | null = null;
let goals: GoalProgress[] = [];
let views = new Map<number, View>();
let tweens: Tween[] = [];
let movers: Mover[] = [];
let flyers: Flyer[] = [];
let fxs: Fx[] = [];
let fading: View[] = [];
let moves = 0;
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
let introText = '';
let CELL = 47, BX = 12, BY = 168, W = 376, H = 376;
/** The booster waiting for a tile pick. `external` = armed through the FalconGame contract (the studio layer's unit). */
let armed: { key: string; external: boolean } | null = null;

function sprite(key: string): HTMLImageElement {
  let s = sprites.get(key);
  if (!s) { s = new Image(); s.src = A.svgUrl(SPRITES[key]); sprites.set(key, s); }
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
      <div class="goalbox"><div class="goals" id="m-goals"></div></div>
      <div class="sbar" id="m-sbar"><div class="track"><i class="fill"></i></div>${[0, 1, 2].map((k) => `<span class="mk" data-k="${k}">${img(A.ICON_STAR)}</span>`).join("")}</div>
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
  for (const k of Object.keys(SPRITES)) sprite(k);
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

/** Fit the board's grid into the board area, centred. */
function layout(): void {
  CELL = Math.floor(Math.min(47, AREA.w / board!.cols, AREA.h / board!.rows));
  W = CELL * board!.cols;
  H = CELL * board!.rows;
  BX = Math.round(AREA.x + (AREA.w - W) / 2);
  BY = Math.round(AREA.y + (AREA.h - H) / 2);
}

export function openMatch(index: number, callbacks: MatchCallbacks, opts: { tutorial?: boolean } = {}): void {
  build();
  closePopup();
  cb = callbacks;
  levelIndex = Math.max(0, Math.min(MATCH_LEVELS.length - 1, index));
  cfg = MATCH_LEVELS[levelIndex];
  board = new Board(cfg, opts.tutorial ? 0 : Math.floor(Math.random() * 1e6));
  goals = makeGoals(cfg);
  layout();
  views = new Map();
  tweens = [];
  movers = [];
  flyers = [];
  fxs = [];
  fading = [];
  moves = cfg.moves;
  locked = false;
  paused = false;
  over = false;
  tutorialMode = !!opts.tutorial;
  selected = null;
  hint = null;
  armed = null;
  hintDelay = opts.tutorial ? 1500 : 4000;
  idleSince = performance.now();
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
    const tile = board.grid[r][c];
    if (!tile) continue;
    const v: View = { tile, x: cx(c), y: cy(r) - 500 - r * 20, s: 1, a: 1 };
    views.set(tile.id, v);
    void tweenTo(v, 'y', cy(r), 420 + r * 40, easeBounce);
  }
  root!.classList.add('on');
  const lvl = root!.querySelector<HTMLElement>('#m-lvl')!;
  const hard = cfg.difficulty === 'hard' || cfg.difficulty === 'superhard' || cfg.difficulty === 'boss';
  lvl.innerHTML = `${t('lvl')} ${cfg.id}${hard ? ` <em class="diff ${cfg.difficulty}">${t(`diff_${cfg.difficulty}`)}</em>` : ''}`;
  buildGoalChips();
  score = 0;
  layoutStarBar();
  updateStarBar();
  introText = !tutorialMode && cfg.intro ? t(cfg.intro) : '';
  closeTipCard();
  guide = null;
  pendingTips = tutorialMode || NO_TIPS ? [] : (cfg.tutorial ?? []).filter((k) => !St.tipSeen(k));
  if (pendingTips.length) {
    const b = board;
    setTimeout(() => { if (board === b && !over) showNextTip(); }, 800);
  }
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
export function matchProgress(): number { return board ? Math.round(goalsProgress(goals) * 100) : 0; }

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
  renderBoosterBar();
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

/** The grid cell under a stage point (any cell of the bounding grid, holes included). */
function cellAt(x: number, y: number): Pos | null {
  const c = Math.floor((x - BX) / CELL);
  const r = Math.floor((y - BY) / CELL);
  return board && board.inBounds(r, c) ? { r, c } : null;
}

function tweenTo(obj: View, prop: 'x' | 'y' | 's' | 'a', to: number, dur: number, ease = easeOut): Promise<void> {
  return new Promise((resolve) => {
    tweens = tweens.filter((tw) => !(tw.obj === obj && tw.prop === prop));
    tweens.push({ obj, prop, from: obj[prop], to, t: 0, dur, ease, resolve });
  });
}

/** Move a view along a path of cell centres (falls, diagonal slides). */
function moveAlong(view: View, pts: { x: number; y: number }[], dur: number): Promise<void> {
  return new Promise((resolve) => {
    movers = movers.filter((m) => m.view !== view);
    movers.push({ view, pts, t: 0, dur, resolve });
  });
}

// ---------------------------------------------------------------------------
// HUD

function buildGoalChips(): void {
  const box = root!.querySelector<HTMLElement>('#m-goals')!;
  box.innerHTML = goals.map((g) => `<div class="gchip" data-g="${g.key}">${img(A.goalIcon(g.def, cfg.animal))}<b></b></div>`).join('');
}

function chipCenter(key: string): { x: number; y: number } {
  const e = root!.querySelector(`.gchip[data-g="${key}"] img`) ?? root!.querySelector('#m-goals')!;
  const r = e.getBoundingClientRect();
  return toStage(r.left + r.width / 2, r.top + r.height / 2);
}

// ---------------------------------------------------------------------------
// The star bar: fills with the background score; each marker lights its star.

let score = 0;
let starT: [number, number, number] = [1000, 4000, 7000];
const barMax = (): number => starT[2] * 1.12;

function layoutStarBar(): void {
  if (!root) return;
  starT = STAR_SCORES[cfg.id] ?? [1000, 4000, 7000];
  root.querySelectorAll<HTMLElement>('#m-sbar .mk').forEach((mk, k) => {
    mk.style.left = `${(starT[k] / barMax()) * 100}%`;
    mk.classList.remove('on');
  });
}

function addScore(points: number): void {
  if (points <= 0) return;
  score += points;
  updateStarBar();
}

function updateStarBar(): void {
  if (!root) return;
  root.querySelector<HTMLElement>('#m-sbar .fill')!.style.width = `${Math.min(100, (score / barMax()) * 100)}%`;
  root.querySelectorAll<HTMLElement>('#m-sbar .mk').forEach((mk, k) => mk.classList.toggle('on', score >= starT[k]));
}

function updateHud(): void {
  if (!root) return;
  const sig = `${moves}:${goals.map((g) => g.got).join(',')}`;
  if (sig === hudSig) return;
  hudSig = sig;
  root.querySelector('#m-moves')!.textContent = String(moves);
  root.querySelector('.mhud .pill')!.classList.toggle('low', moves <= 5);
  for (const g of goals) {
    const chip = root.querySelector<HTMLElement>(`.gchip[data-g="${g.key}"]`);
    if (!chip) continue;
    const ok = g.got >= g.need;
    chip.classList.toggle('done', ok);
    chip.querySelector('b')!.textContent = ok ? '✓' : String(g.need - g.got);
  }
}

// ---------------------------------------------------------------------------
// Boosters: the bar under the board, arming, buying and using them

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
  for (const p of row.querySelectorAll<HTMLElement>('.bplate')) {
    const on = !!guide?.plate && p.dataset.key === guide.plate && !armed;
    p.classList.toggle('guide', on);
    if (on) p.insertAdjacentHTML('beforeend', `<img class="ghand" src="${A.svgUrl(A.ICON_HAND)}" alt="">`);
  }
  const text = guide?.text || (armed ? t(`booster_tip_${armed.key}`) : introText);
  tip.style.display = text ? '' : 'none';
  tip.classList.toggle('intro', !armed || !!guide);
  tip.classList.toggle('guide', !!guide);
  tip.textContent = text;
}

// ---------------------------------------------------------------------------
// First-time tutorials: a card that explains, then a guided first use on the board.

const NO_TIPS = new URLSearchParams(location.search).has('notips');
const BOOSTER_TIPS: TutorialKey[] = ['shovel', 'moves', 'witch'];
const POWER_TIPS: Partial<Record<TutorialKey, Special[]>> = { tractor: ['row', 'col'], haybale: ['wrap'], bee: ['bee'], rainbow: ['rainbow'] };

interface Guide {
  key: TutorialKey;
  text: string;
  /** A swap to show with the hand. */
  move?: Move | null;
  /** Cells to ring (the obstacles, or the power-up to use). */
  cells?: Pos[];
  /** A booster button to point at. */
  plate?: string;
  /** Where to use the armed booster. */
  target?: Pos | null;
  /** The power-up this guide teaches, and whether one has been made yet. */
  follow?: Special[];
  made?: boolean;
}
let guide: Guide | null = null;
let pendingTips: TutorialKey[] = [];
let cardOpen = false;

const sp = (key: string, cls = ''): string => `<img src="${A.svgUrl(SPRITES[key])}" class="${cls}" alt="">`;
function tileHtml(kind: string, special?: Special): string {
  if (special === 'rainbow') return `<span class="tc-tile">${sp('rainbow')}</span>`;
  const over = special === 'row' ? sp('stripe_row') : special === 'col' ? sp('stripe_col') : special === 'wrap' ? sp('haybale') : special === 'bee' ? sp('beebadge') : '';
  return `<span class="tc-tile">${sp(kind)}${over}</span>`;
}
function mini(pattern: string[], kind: string): string {
  const cells = pattern.join('').split('').map((ch) => (ch === 'x' ? sp(kind) : '<i></i>')).join('');
  return `<span class="tc-mini" style="grid-template-columns:repeat(${pattern[0].length},22px)">${cells}</span>`;
}
const ARROW = '<b class="tc-arrow">➜</b>';
function illustration(key: TutorialKey): string {
  switch (key) {
    case 'tractor': return mini(['xxxx'], 'carrot') + ARROW + tileHtml('carrot', 'row');
    case 'haybale': return mini(['xxx', '.x.', '.x.'], 'apple') + ARROW + tileHtml('apple', 'wrap');
    case 'bee': return mini(['xx', 'xx'], 'corn') + ARROW + tileHtml('corn', 'bee') + `<span class="tc-tile">${sp('hive')}</span>`;
    case 'rainbow': return mini(['xxxxx'], 'berry') + ARROW + tileHtml('', 'rainbow');
    case 'mud': return `<span class="tc-tile">${sp('mud')}</span>${ARROW}<b class="tc-arrow">✓</b>`;
    case 'crate': return `<span class="tc-tile">${sp('crate2')}</span>${ARROW}<span class="tc-tile">${sp('crate1')}</span>${ARROW}<b class="tc-arrow">✓</b>`;
    case 'soil': return `<span class="tc-tile">${sp('soil')}</span>${ARROW}<span class="tc-tile">${sp('soilicon')}</span>`;
    case 'soilcrate': return `<span class="tc-tile">${sp('crate2')}</span>${ARROW}<span class="tc-tile">${sp('soil')}</span>`;
    case 'chick': case 'piglet': return `<span class="tc-tile">${sp(key)}</span><b class="tc-arrow">⬇</b>`;
    case 'any': return `<span class="tc-tile">${sp('basket')}</span>`;
    default: return `<img class="tc-big" src="${A.svgUrl(A.ITEM_ICON[key])}" alt="">`;
  }
}

function closeTipCard(): void {
  root?.querySelector('.tcard-wrap')?.remove();
  cardOpen = false;
}

function showNextTip(): void {
  const key = pendingTips.shift();
  if (!key || !root) return;
  cardOpen = true;
  hint = null;
  const free = BOOSTER_TIPS.includes(key) ? `<div class="tc-free">${t('tut_free', { n: BOOSTER_GIFT })}</div>` : '';
  const card = el(`<div class="tcard-wrap"><div class="tcard"><div class="tc-head">${t(`tut_${key}_title`)}</div>
    <div class="tc-illus">${illustration(key)}</div><p>${t(`tut_${key}_text`)}</p>${free}
    <button class="btn green">${t('got_it')}</button></div></div>`);
  card.querySelector('button')!.addEventListener('click', () => {
    closeTipCard();
    St.markTip(key);
    startGuide(key);
    if (pendingTips.length) showNextTip();
  });
  root.appendChild(card);
}

/** A swap that makes one of `specials` on its first step, judged on a copy of the board. */
function findCreatingMove(specials: Special[]): Move | null {
  if (!board) return null;
  for (const m of board.legalMoves()) {
    const b = board.clone();
    const res = b.step(b.beginSwap(m.a, m.b));
    if (res?.created.some((c) => specials.includes(c.tile.special))) return m;
  }
  return null;
}

/**
 * Shapes a taught power-up needs: the cells it fills after the swap, the hole in
 * them, and the cropsy that slides into the hole (offsets from an anchor cell).
 */
const DEMO: Partial<Record<TutorialKey, { shape: [number, number][]; hole: [number, number]; mover: [number, number] }>> = {
  tractor: { shape: [[0, 0], [0, 1], [0, 2], [0, 3]], hole: [0, 2], mover: [1, 2] },
  rainbow: { shape: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], hole: [0, 2], mover: [1, 2] },
  haybale: { shape: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]], hole: [0, 1], mover: [-1, 1] },
  bee: { shape: [[0, 0], [0, 1], [1, 0], [1, 1]], hole: [0, 1], mover: [0, 2] },
};

/** No swap makes the taught power-up yet: recolour a few cropsies so one does (the tutorial's scripted board). */
function plantDemo(key: TutorialKey): Move | null {
  const b = board;
  const demo = DEMO[key];
  if (!b || !demo) return null;
  const plain = (r: number, c: number): boolean => { const t = b.at(r, c); return !!t && !t.animal && !t.special; };
  const anchors: Pos[] = [];
  for (let r = 1; r < b.rows - 1; r++) for (let c = 0; c < b.cols; c++) anchors.push({ r, c });
  anchors.sort((p, q) => Math.abs(p.r - b.rows / 2) + Math.abs(p.c - b.cols / 2) - (Math.abs(q.r - b.rows / 2) + Math.abs(q.c - b.cols / 2)));
  for (const at of anchors) {
    const cell = ([dr, dc]: [number, number]): Pos => ({ r: at.r + dr, c: at.c + dc });
    const fill = [...demo.shape.filter(([dr, dc]) => dr !== demo.hole[0] || dc !== demo.hole[1]), demo.mover].map(cell);
    const hole = cell(demo.hole);
    if (![...fill, hole].every((p) => plain(p.r, p.c))) continue;
    for (const kind of b.kinds) {
      if (b.grid[hole.r][hole.c]!.kind === kind) continue;
      const saved = fill.map((p) => b.grid[p.r][p.c]!);
      fill.forEach((p, i) => { b.grid[p.r][p.c] = { ...saved[i], kind }; });
      const mover = cell(demo.mover);
      const ok = !b.hasMatches() && b.validSwap(mover, hole);
      const check = b.clone();
      const made = ok && check.step(check.beginSwap(mover, hole))?.created.some((c) => POWER_TIPS[key]!.includes(c.tile.special));
      if (made) {
        for (const p of fill) { const v = views.get(b.grid[p.r][p.c]!.id); if (v) v.tile = b.grid[p.r][p.c]!; }
        return { a: mover, b: hole };
      }
      fill.forEach((p, i) => { b.grid[p.r][p.c] = saved[i]; });
    }
  }
  return null;
}

function cellsOf(test: (r: number, c: number) => boolean): Pos[] {
  const out: Pos[] = [];
  if (!board) return out;
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) if (board.mask[r][c] && test(r, c)) out.push({ r, c });
  return out;
}

function startGuide(key: TutorialKey): void {
  if (!board) return;
  const b = board;
  if (BOOSTER_TIPS.includes(key)) {
    St.grantBooster(key);
    guide = { key, text: t(`tut_${key}_do`), plate: key };
  } else if (POWER_TIPS[key]) {
    const move = findCreatingMove(POWER_TIPS[key]!) ?? plantDemo(key);
    guide = { key, text: move ? t(`tut_${key}_do`) : '', move, follow: POWER_TIPS[key] };
  } else {
    const cells = key === 'mud' ? cellsOf((r, c) => b.block[r][c]?.type === 'mud')
      : key === 'crate' || key === 'soilcrate' ? cellsOf((r, c) => b.block[r][c]?.type === 'crate')
      : key === 'soil' ? cellsOf((r, c) => b.soil[r][c])
      : key === 'chick' || key === 'piglet' ? cellsOf((r, c) => !!b.grid[r][c]?.animal) : [];
    guide = { key, text: t(`tut_${key}_do`), cells, move: b.bestMove(goals) };
  }
  renderBoosterBar();
}

/** Move the guide on after a turn: a taught power-up gets its "now use it" step. */
function advanceGuide(): void {
  if (!guide || !board) return;
  if (guide.plate || guide.target !== undefined) return;
  if (!guide.follow) { guide = null; renderBoosterBar(); return; }
  const mine = cellsOf((r, c) => guide!.follow!.includes(board!.grid[r][c]?.special ?? null) && !board!.block[r][c]);
  if (mine.length) {
    guide.made = true;
    guide.move = null;
    guide.cells = mine.slice(0, 1);
    guide.text = t(`tut_${guide.key}_use`);
  } else if (guide.made) {
    guide = null;
  } else {
    guide.move = findCreatingMove(guide.follow);
    guide.text = guide.move ? t(`tut_${guide.key}_do`) : '';
    if (!guide.move) guide = null;
  }
  renderBoosterBar();
}

/** The best spot for a target booster, judged like the hint. */
function bestTarget(key: string): Pos | null {
  if (!board) return null;
  let best: Pos | null = null, bestScore = 0;
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
    const hits: Hit[] = [];
    if (key === 'shovel') {
      const tl = board.grid[r][c];
      if (!board.mask[r][c] || (!board.block[r][c] && (!tl || tl.animal))) continue;
      hits.push({ pos: { r, c }, power: 'all' });
    } else for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) hits.push({ pos: { r: r + dr, c: c + dc } });
    const cl = board.clone();
    const out = cl.resolveAll({ hits });
    const s = scoreTurn(cl, goals, out.steps, out.animals);
    if (s > bestScore) { bestScore = s; best = { r, c }; }
  }
  return best;
}

/** The booster tutorial is over (the free unit used): the player gets BOOSTER_GIFT to keep. */
function giftBooster(key: string): void {
  St.grantBooster(key, BOOSTER_GIFT);
  toast(t('booster_gift', { n: BOOSTER_GIFT, name: t(`booster_${key}`) }));
  renderBoosterBar();
}

function setArmed(a: { key: string; external: boolean } | null): void {
  armed = a;
  if (a) { hint = null; selected = null; drag = null; }
  renderBoosterBar();
}

/** Arm a target booster so the next tap on the board uses it. `external` units belong to the studio layer. */
export function armBooster(key: string, external = false): boolean {
  const def = BOOSTERS.find((b) => b.key === key);
  if (!board || over || locked || paused || !def) return false;
  if (def.use === 'instant') return addMovesBooster(external);
  if (!external && St.boosterCount(key) <= 0) return false;
  if (guide?.plate === key) {
    // Booster tutorial, step 2: point at the best spot to use it.
    guide.plate = undefined;
    guide.target = bestTarget(key);
    guide.text = t(`tut_${key}_tap`);
  }
  setArmed({ key, external });
  return true;
}
export function isBoosterArmed(key: string): boolean { return armed?.key === key; }
export function cancelBooster(): void {
  if (!armed) return;
  if (guide && guide.target !== undefined && guide.key === armed.key) { guide.plate = armed.key; guide.target = undefined; guide.text = t(`tut_${guide.key}_do`); }
  setArmed(null);
}

/** Lucky Horseshoe: +5 moves, right away. */
export function addMovesBooster(external = false): boolean {
  if (!board || over || locked || paused) return false;
  if (!external && !St.useBooster('moves')) return false;
  moves += EXTRA_MOVES;
  const taught = guide?.key === 'moves';
  if (taught) guide = null;
  if (FalconSDK.analytics.turn.isActive()) FalconSDK.analytics.turn.useBooster('moves');
  toast(t('moves_added', { n: EXTRA_MOVES }));
  if (taught) setTimeout(() => giftBooster('moves'), 1200);
  updateHud();
  renderBoosterBar();
  return true;
}

function tapPlate(b: BoosterConfig): void {
  if (locked || over || paused || cardOpen) return;
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

/** Use the armed target booster on `pos`: the Golden Shovel digs one cell, the Witch Fruit clears 3×3. */
async function useArmedAt(pos: Pos): Promise<void> {
  const b = board;
  const a = armed;
  if (!b || !a || locked || over) return;
  if (a.key === 'shovel') {
    const tile = b.grid[pos.r][pos.c];
    if (!b.mask[pos.r][pos.c] || (!b.block[pos.r][pos.c] && (!tile || tile.animal))) return;
  }
  if (!a.external && !St.useBooster(a.key)) { setArmed(null); return; }
  setArmed(null);
  locked = true;
  hint = null;
  introText = '';
  if (FalconSDK.analytics.turn.isActive()) FalconSDK.analytics.turn.useBooster(a.key);
  const hits: Hit[] = [];
  if (a.key === 'shovel') {
    fxs.push({ kind: 'shovel', x: cx(pos.c), y: cy(pos.r), t: 0, dur: 500 });
    await wait(230);
    hits.push({ pos, power: 'all' });
  } else {
    fxs.push({ kind: 'witch', x: cx(pos.c), y: cy(pos.r), t: 0, dur: 750 });
    await wait(330);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) hits.push({ pos: { r: pos.r + dr, c: pos.c + dc } });
  }
  if (board !== b) return;
  shakeT = 0.15;
  await runResolve({ hits });
  if (guide && guide.target !== undefined) {
    if (guide.key === a.key) giftBooster(a.key);
    guide = null;
    renderBoosterBar();
  }
  afterTurn();
}

// ---------------------------------------------------------------------------
// Input

let drag: { pos: Pos; x: number; y: number } | null = null;

function onDown(e: PointerEvent): void {
  if (locked || over || paused || !board || cardOpen) return;
  const p = toStage(e.clientX, e.clientY);
  const pos = cellAt(p.x, p.y);
  if (!pos) return;
  if (armed) { void useArmedAt(pos); return; }
  if (!board.at(pos.r, pos.c)) return;
  drag = { pos, x: p.x, y: p.y };
  // Keep receiving the move when the finger leaves the cell (or the canvas) mid-swipe.
  try { canvas?.setPointerCapture(e.pointerId); } catch { /* the pointer is already gone */ }
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
  const bd = board;
  if (!bd || !bd.canSwap(a, b)) return;
  locked = true;
  hint = null;
  const va = views.get(bd.grid[a.r][a.c]!.id)!;
  const vb = views.get(bd.grid[b.r][b.c]!.id)!;
  const ok = bd.validSwap(a, b);
  await Promise.all([tweenTo(va, 'x', cx(b.c), 150, easeInOut), tweenTo(va, 'y', cy(b.r), 150, easeInOut), tweenTo(vb, 'x', cx(a.c), 150, easeInOut), tweenTo(vb, 'y', cy(a.r), 150, easeInOut)]);
  if (!ok) {
    shakeT = 0.25;
    await Promise.all([tweenTo(va, 'x', cx(a.c), 150, easeInOut), tweenTo(va, 'y', cy(a.r), 150, easeInOut), tweenTo(vb, 'x', cx(b.c), 150, easeInOut), tweenTo(vb, 'y', cy(b.r), 150, easeInOut)]);
    locked = false;
    idleSince = performance.now();
    return;
  }
  if (board !== bd) return;
  const turn = bd.beginSwap(a, b);
  moves--;
  if (introText) { introText = ''; renderBoosterBar(); }
  updateHud();
  await runResolve(turn);
  afterTurn();
}

/** After a swap or a booster has settled: win, lose, or hand the board back. */
function afterTurn(): void {
  if (over || !board) return;
  if (goalsDone(goals)) { finish(true); return; }
  if (moves <= 0) { finish(false); return; }
  ensureMoves();
  advanceGuide();
  locked = false;
  idleSince = performance.now();
}

// ---------------------------------------------------------------------------
// Resolving a turn: clear steps, animals out, gravity — animated

async function runResolve(turn: StepCtx): Promise<void> {
  const b = board;
  if (!b) return;
  let cascade = 0;
  for (let i = 0; i < 80; i++) {
    const res = b.step(turn);
    turn = {};
    const out = b.collectAnimals();
    if (!res && !out.length) break;
    if (res) addScore(stepScore(res, cascade++));
    addScore(out.length * SCORE.animal);
    if (res) await animateStep(res);
    if (board !== b) return;
    if (out.length) await animateAnimals(out);
    if (board !== b) return;
    await animateFalls(b.applyGravity());
    if (board !== b) return;
  }
}

function fly(key: string, from: { x: number; y: number }, goal: GoalProgress): void {
  const to = chipCenter(goal.key);
  flyers.push({ key, x: from.x, y: from.y, tx: to.x, ty: to.y, t: 0 });
}

async function animateStep(res: StepResult): Promise<void> {
  for (const bl of res.blasts) {
    const at = { x: cx(bl.pos.c), y: cy(bl.pos.r) };
    const targets = (bl.targets ?? []).map((p) => ({ x: cx(p.c), y: cy(p.r) }));
    if (bl.type === 'rainbow') fxs.push({ kind: 'rainbow', ...at, t: 0, dur: 520, targets });
    else if (bl.type === 'bee') fxs.push({ kind: 'bee', ...at, t: 0, dur: 620, targets });
    else if (bl.type === 'wrap' || bl.type === 'bigwrap') fxs.push({ kind: 'wrap', ...at, t: 0, dur: 520, size: bl.type === 'wrap' ? 3 : 5 });
    else if (bl.type === 'bigcross') {
      for (const d of [-1, 0, 1]) {
        fxs.push({ kind: 'row', x: at.x, y: at.y + d * CELL, t: 0, dur: 480 });
        fxs.push({ kind: 'col', x: at.x + d * CELL, y: at.y, t: 0, dur: 480 });
      }
    } else fxs.push({ kind: bl.type, ...at, t: 0, dur: 480 });
  }
  if (res.blasts.length) {
    shakeT = Math.max(shakeT, 0.12);
    // Bees need a moment to reach their targets.
    await wait(res.blasts.some((b) => b.type === 'bee') ? 420 : 140);
  }
  for (const cr of res.created) {
    views.delete(cr.from.id);
    const v: View = { tile: cr.tile, x: cx(cr.pos.c), y: cy(cr.pos.r), s: 0.4, a: 1 };
    views.set(cr.tile.id, v);
    void tweenTo(v, 's', 1, 260, easeBounce);
    fxs.push({ kind: 'sparkle', x: v.x, y: v.y, t: 0, dur: 450 });
  }
  const shrink: Promise<void>[] = [];
  for (const { tile, pos } of res.cleared) {
    const v = views.get(tile.id);
    if (!v) continue;
    views.delete(tile.id);
    const g = goalFor(goals, { tile });
    if (g) { g.got++; fly(tile.kind, { x: v.x, y: v.y }, g); }
    else { fading.push(v); shrink.push(tweenTo(v, 's', 0, 180)); }
    if (!g && tile.special) fxs.push({ kind: 'sparkle', x: cx(pos.c), y: cy(pos.r), t: 0, dur: 350 });
  }
  for (const bk of res.blockers) {
    const at = { x: cx(bk.pos.c), y: cy(bk.pos.r) };
    fxs.push({ kind: 'puff', ...at, t: 0, dur: 380 });
    if (bk.hp > 0) continue;
    const g = goalFor(goals, { blocker: bk.type });
    if (g) { g.got++; fly(bk.type === 'mud' ? 'mud' : 'crate2', at, g); }
  }
  for (const p of res.plowed) {
    const at = { x: cx(p.c), y: cy(p.r) };
    fxs.push({ kind: 'sparkle', ...at, t: 0, dur: 400 });
    const g = goalFor(goals, { soil: true });
    if (g) { g.got++; fly('soilicon', at, g); }
  }
  updateHud();
  await Promise.all(shrink);
  fading = [];
}

async function animateAnimals(out: { pos: Pos; tile: Tile }[]): Promise<void> {
  for (const { tile } of out) {
    const v = views.get(tile.id);
    views.delete(tile.id);
    const g = goalFor(goals, { animal: true });
    if (g) g.got++;
    if (v && g) fly(tile.kind, { x: v.x, y: v.y }, g);
  }
  updateHud();
  await wait(260);
}

async function animateFalls(falls: Fall[]): Promise<void> {
  const all: Promise<void>[] = [];
  for (const f of falls) {
    let v = views.get(f.tile.id);
    const start = f.path[0];
    if (!v) { v = { tile: f.tile, x: cx(start.c), y: cy(start.r), s: 1, a: 1 }; views.set(f.tile.id, v); }
    const pts = f.path.map((p) => ({ x: cx(p.c), y: cy(p.r) }));
    all.push(moveAlong(v, pts, 90 + (f.path.length - 1) * 55));
  }
  await Promise.all(all);
}

function ensureMoves(): void {
  if (!board || board.legalMoves().length > 0) return;
  board.reshuffle();
  toast('🔀');
  views = new Map();
  for (let r = 0; r < board.rows; r++) for (let c = 0; c < board.cols; c++) {
    const tile = board.grid[r][c];
    if (!tile) continue;
    const v: View = { tile, x: cx(c), y: cy(r), s: 0, a: 1 };
    views.set(tile.id, v);
    void tweenTo(v, 's', 1, 300);
  }
}

function showHint(): void {
  if (!board) return;
  hint = board.bestMove(goals);
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
  const b = board;
  void (async () => {
    await wait(450);
    if (won && moves > 0 && board === b) await harvestRush();
    if (!cb || board !== b) return;
    if (won) cb.onWin(i, starsForScore(cfg.id, score, true), moves);
    else cb.onLose(i);
  })();
}

/** Harvest Rush: every move left on a win turns into bonus points, one sparkle at a time. */
async function harvestRush(): Promise<void> {
  const b = board!;
  toast(t('harvest_rush'));
  const left = moves;
  const step = Math.max(40, Math.min(110, 1400 / left));
  // Each move left is worth moveLeftGrowth× the one before it, so a big finish fills the star bar fast.
  let points = SCORE.moveLeft;
  for (let k = 0; k < left && board === b; k++) {
    moves--;
    addScore(Math.round(points));
    points *= SCORE.moveLeftGrowth;
    const r = Math.floor(Math.random() * b.rows), c = Math.floor(Math.random() * b.cols);
    if (b.mask[r][c]) fxs.push({ kind: 'sparkle', x: cx(c), y: cy(r), t: 0, dur: 420 });
    hudSig = '';
    updateHud();
    await wait(step);
  }
  await wait(300);
}

/**
 * The result card. A win shows the stars and the coin reward; a loss shows what
 * was left and offers the paid revive (`onRevive` returns true when the round
 * continues). `onNext` is omitted when there is no next level or during the tutorial.
 */
export function showResult(o: {
  won: boolean; stars: number; delta: number; coins: number;
  onFarm: () => void; onNext?: () => void; onRetry?: () => void; onRevive?: () => boolean;
}): void {
  const p = openPopup('result', o.won ? t('win_title') : t('lose_title'), { closable: false });
  const starsHtml = `<div class="starrow">${[1, 2, 3].map((s) => img(A.ICON_STAR, o.won && o.stars >= s ? 'on' : '')).join('')}</div>`;
  const left = goals.map((g) => `<div class="gchip${g.got >= g.need ? ' done' : ''}">${img(A.goalIcon(g.def, cfg.animal))}<b>${g.got >= g.need ? '✓' : g.need - g.got}</b></div>`).join('');
  const rows = o.won
    ? `<div class="bigstar">${img(A.ICON_STAR)} ${o.delta > 0 ? t('stars_earned', { n: o.delta }) : t('stars_none')}</div><div class="muted center">${t('star_delta')}</div>
       <div class="reward">${img(A.ICON_COIN)} ${t('coins_earned', { n: o.coins })}</div>`
    : `<div class="goals result">${left}</div>`;
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
  for (const m of movers) {
    m.t += dt * 1000;
    placeOnPath(m.view, m.pts, easeBounce(Math.min(1, m.t / m.dur)));
  }
  const arrived = movers.filter((m) => m.t >= m.dur);
  movers = movers.filter((m) => m.t < m.dur);
  for (const m of arrived) m.resolve();
  for (const f of flyers) f.t += dt / 0.5;
  flyers = flyers.filter((f) => f.t < 1);
  for (const f of fxs) f.t += (dt * 1000) / f.dur;
  fxs = fxs.filter((f) => f.t < 1);
  if (!locked && !over && !hint && !armed && !cardOpen && !guide?.move && performance.now() - idleSince > hintDelay) showHint();
  draw();
}

function placeOnPath(v: View, pts: { x: number; y: number }[], k: number): void {
  if (pts.length < 2) { v.x = pts[0].x; v.y = pts[0].y; return; }
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  let d = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (d <= seg || i === pts.length - 1) {
      const f = seg ? Math.min(1, d / seg) : 1;
      v.x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f;
      v.y = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f;
      return;
    }
    d -= seg;
  }
}

function draw(): void {
  if (!ctx || !board) return;
  const g = ctx;
  const b = board;
  g.clearRect(0, 0, 400, 800);
  g.save();
  if (shakeT > 0) g.translate(Math.sin(clock * 90) * 3, 0);
  // The tray: ground shadow, the dark front face, the wooden rim, then the field.
  const fx0 = BX - 10, fy0 = BY - 10, fw = W + 20, fh = H + 20;
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
  g.fillStyle = '#9c6230';
  roundRect(g, fx0 + 4, fy0 + 4, fw - 8, fh - 8, 14);
  g.fill();
  g.fillStyle = '#c98b4a';
  roundRect(g, fx0 + 4, fy0 + 4, fw - 8, 5, 4);
  g.fill();
  // Field cells: grass checker, or plowable soil. Holes show the tray's wood.
  for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
    if (!b.mask[r][c]) continue;
    const x0 = BX + c * CELL, y0 = BY + r * CELL;
    if (b.soil[r][c]) g.drawImage(sprite('soil'), x0, y0, CELL, CELL);
    else { g.fillStyle = (r + c) % 2 === 0 ? '#9ad97a' : '#86c968'; g.fillRect(x0, y0, CELL, CELL); }
  }
  // Inner shade on the top edge of the field.
  const shade = g.createLinearGradient(0, BY, 0, BY + 14);
  shade.addColorStop(0, 'rgba(0,0,0,.22)');
  shade.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = shade;
  for (let c = 0; c < b.cols; c++) if (b.mask[0][c]) g.fillRect(BX + c * CELL, BY, CELL, 14);
  // Beehives on the rim above their columns.
  for (const s of b.spawners) {
    if (!b.hives.has(s.c)) continue;
    const k = CELL * 0.62;
    g.drawImage(sprite('hive'), cx(s.c) - k / 2, BY + s.r * CELL - k * 0.82 + Math.sin(clock * 3 + s.c) * 1.2, k, k);
  }
  // Exits for animals: green arrows under the bottom row.
  if (b.animalKind) {
    g.fillStyle = '#3fa63a';
    for (let c = 0; c < b.cols; c++) {
      if (!b.isExit(b.rows - 1, c)) continue;
      const x = cx(c), y = BY + H + 3 + Math.sin(clock * 5) * 1.5;
      g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.lineTo(x, y + 8); g.closePath(); g.fill();
    }
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
  if (armed) {
    // A soft pulse over the whole field says "pick a spot".
    g.fillStyle = `rgba(255,225,107,${0.08 + Math.sin(clock * 5) * 0.05})`;
    for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) if (b.mask[r][c]) g.fillRect(BX + c * CELL, BY + r * CELL, CELL, CELL);
  }
  // Blockers
  for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
    const bk = b.block[r][c];
    if (!bk) continue;
    const key = bk.type === 'mud' ? 'mud' : bk.hp >= 2 ? 'crate2' : 'crate1';
    g.drawImage(sprite(key), BX + c * CELL + 1, BY + r * CELL + 1, CELL - 2, CELL - 2);
  }
  // Tiles, clipped to the board so new ones slide in from under the rim.
  g.save();
  g.beginPath();
  g.rect(BX, BY, W, H);
  g.clip();
  const pulse = 1 + Math.sin(clock * 4) * 0.03;
  const ordered = [...views.values()].sort((p, q) => p.y - q.y);
  for (const v of ordered) {
    const goalish = goals.some((gl) => gl.got < gl.need && ((gl.def.type === 'collect' && gl.def.tile === v.tile.kind) || (gl.def.type === 'animal' && v.tile.animal)));
    drawTile(g, v.tile, v.x, v.y, v.s * (goalish ? pulse : 1), v.a);
  }
  for (const v of fading) drawTile(g, v.tile, v.x, v.y, v.s, v.a);
  g.restore();
  drawFx(g);
  drawGuide(g);
  g.restore();
  // Flyers to the goal chips
  for (const f of flyers) {
    const k = easeInOut(f.t);
    const x = f.x + (f.tx - f.x) * k;
    const y = f.y + (f.ty - f.y) * k - Math.sin(k * Math.PI) * 60;
    const size = (CELL - PAD * 2) * (1 - k * 0.45);
    g.drawImage(sprite(f.key), x - size / 2, y - size / 2, size, size);
  }
}

/** The tutorial guide: green rings on cells, and a hand showing the swap or the spot. */
function drawGuide(g: CanvasRenderingContext2D): void {
  if (!guide || cardOpen || over) return;
  const pulse = 3 + Math.sin(clock * 7) * 1.5;
  const ring = (p: Pos): void => {
    g.strokeStyle = '#5cff6a';
    g.lineWidth = pulse;
    roundRect(g, BX + p.c * CELL + 2, BY + p.r * CELL + 2, CELL - 4, CELL - 4, 10);
    g.stroke();
  };
  for (const p of guide.cells ?? []) ring(p);
  const hand = (x: number, y: number): void => { const s = CELL * 0.95; g.drawImage(sprite('hand'), x - s * 0.3, y - s * 0.05, s, s); };
  if (guide.move && !locked) {
    ring(guide.move.a);
    ring(guide.move.b);
    const k = (Math.sin(clock * 3) + 1) / 2;
    hand(cx(guide.move.a.c) + (cx(guide.move.b.c) - cx(guide.move.a.c)) * k, cy(guide.move.a.r) + (cy(guide.move.b.r) - cy(guide.move.a.r)) * k);
  }
  if (guide.target && armed) {
    ring(guide.target);
    hand(cx(guide.target.c), cy(guide.target.r) + Math.sin(clock * 6) * 4);
  }
}

function drawFx(g: CanvasRenderingContext2D): void {
  for (const f of fxs) {
    const k = f.t;
    const fade = 1 - k;
    if (f.kind === 'row' || f.kind === 'col' || f.kind === 'cross') {
      // A tractor drives the line, plowing a bright furrow behind it.
      for (const dir of f.kind === 'cross' ? ['row', 'col'] : [f.kind]) {
        g.save();
        g.globalAlpha = fade;
        g.fillStyle = '#fff6c8';
        if (dir === 'row') g.fillRect(BX, f.y - CELL * 0.32, W, CELL * 0.64);
        else g.fillRect(f.x - CELL * 0.32, BY, CELL * 0.64, H);
        g.globalAlpha = 1;
        const s = CELL * 1.15;
        if (dir === 'row') {
          const x = BX - s / 2 + (W + s) * easeInOut(k);
          g.drawImage(sprite('tractor'), x - s / 2, f.y - s * 0.55, s, s * 0.78);
        } else {
          const y = BY - s / 2 + (H + s) * easeInOut(k);
          g.translate(f.x, y);
          g.rotate(Math.PI / 2);
          g.drawImage(sprite('tractor'), -s / 2, -s * 0.4, s, s * 0.78);
        }
        g.restore();
      }
    } else if (f.kind === 'rainbow') {
      g.save();
      g.lineWidth = 3;
      g.globalAlpha = fade;
      (f.targets ?? []).forEach((p, i) => {
        g.strokeStyle = `hsl(${(i * 47 + clock * 240) % 360} 90% 60%)`;
        g.beginPath();
        g.moveTo(f.x, f.y);
        g.lineTo(f.x + (p.x - f.x) * Math.min(1, k * 2.2), f.y + (p.y - f.y) * Math.min(1, k * 2.2));
        g.stroke();
      });
      g.restore();
    } else if (f.kind === 'wrap') {
      // The hay bale bursts: a golden square shock and flying straw.
      const half = (CELL * (f.size ?? 3)) / 2;
      g.save();
      g.globalAlpha = fade;
      g.fillStyle = 'rgba(255,214,90,.35)';
      g.fillRect(f.x - half, f.y - half, half * 2, half * 2);
      g.strokeStyle = '#f3c54a';
      g.lineWidth = 4;
      g.strokeRect(f.x - half * (0.4 + k * 0.6), f.y - half * (0.4 + k * 0.6), half * 2 * (0.4 + k * 0.6), half * 2 * (0.4 + k * 0.6));
      g.strokeStyle = '#c9961f';
      g.lineWidth = 2.5;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const r0 = half * 0.3 + half * 0.9 * k;
        g.beginPath();
        g.moveTo(f.x + Math.cos(a) * r0, f.y + Math.sin(a) * r0);
        g.lineTo(f.x + Math.cos(a + 0.25) * (r0 + 9), f.y + Math.sin(a + 0.25) * (r0 + 9));
        g.stroke();
      }
      g.restore();
    } else if (f.kind === 'bee') {
      // Busy Bees fly out on wobbly paths to their targets.
      const s = CELL * 0.8;
      (f.targets ?? []).forEach((p, i) => {
        const e = easeInOut(Math.min(1, k * 1.25));
        const wob = Math.sin(e * Math.PI * 3 + i) * 14 * (1 - e);
        const x = f.x + (p.x - f.x) * e + wob, y = f.y + (p.y - f.y) * e - Math.sin(e * Math.PI) * 30;
        g.save();
        g.globalAlpha = k > 0.85 ? (1 - k) / 0.15 : 1;
        g.drawImage(sprite('bee'), x - s / 2, y - s / 2, s, s);
        g.restore();
      });
    } else if (f.kind === 'witch') {
      g.save();
      if (k < 0.4) {
        const d = k / 0.4;
        const s = CELL * 1.3;
        g.drawImage(sprite('witch'), f.x - s / 2, f.y - s / 2 - (1 - easeOut(d)) * 90, s, s);
      } else {
        const d = (k - 0.4) / 0.6;
        g.globalAlpha = 1 - d;
        g.fillStyle = 'rgba(164,92,255,.35)';
        g.fillRect(f.x - CELL * 1.5, f.y - CELL * 1.5, CELL * 3, CELL * 3);
        g.strokeStyle = '#c77dff';
        g.lineWidth = 4;
        g.beginPath();
        g.arc(f.x, f.y, CELL * (0.5 + d * 1.6), 0, Math.PI * 2);
        g.stroke();
      }
      g.restore();
    } else if (f.kind === 'shovel') {
      const angle = -0.9 + easeOut(Math.min(1, k / 0.5)) * 1.3;
      g.save();
      g.globalAlpha = k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35;
      g.translate(f.x + 8, f.y - 10);
      g.rotate(angle);
      g.drawImage(sprite('shovel'), -12, -36, 46, 46);
      g.restore();
    } else if (f.kind === 'puff') {
      g.save();
      g.globalAlpha = fade;
      g.fillStyle = '#8a5a30';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        g.beginPath();
        g.arc(f.x + Math.cos(a) * CELL * 0.55 * k, f.y + Math.sin(a) * CELL * 0.55 * k, 3.5 * fade + 1, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    } else {
      g.save();
      g.globalAlpha = fade;
      g.fillStyle = '#fff3a0';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.beginPath();
        g.arc(f.x + Math.cos(a) * CELL * 0.45 * k, f.y + Math.sin(a) * CELL * 0.45 * k, 2.5, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  }
}

function drawTile(g: CanvasRenderingContext2D, tile: Tile, x: number, y: number, s: number, a: number): void {
  if (s <= 0.01 || a <= 0.01) return;
  const size = (CELL - PAD * 2) * s;
  g.globalAlpha = a;
  g.fillStyle = 'rgba(0,0,0,.2)';
  g.beginPath();
  g.ellipse(x + 1, y + size * 0.44, size * 0.36, size * 0.11, 0, 0, Math.PI * 2);
  g.fill();
  const key = tile.animal ? tile.kind : tile.special === 'rainbow' ? 'rainbow' : tile.kind;
  if (tile.special === 'rainbow') {
    const k = size * (1.05 + Math.sin(clock * 6) * 0.04);
    g.drawImage(sprite(key), x - k / 2, y - k / 2 - 2, k, k);
  } else {
    g.drawImage(sprite(key), x - size / 2, y - size / 2 - 2, size, size);
  }
  if (tile.special === 'row' || tile.special === 'col') {
    g.globalAlpha = a * (0.85 + Math.sin(clock * 6) * 0.15);
    g.drawImage(sprite(tile.special === 'row' ? 'stripe_row' : 'stripe_col'), x - size / 2, y - size / 2 - 2, size, size);
  } else if (tile.special === 'wrap') {
    const k = size * (1.08 + Math.sin(clock * 5) * 0.03);
    g.drawImage(sprite('haybale'), x - k / 2, y - k / 2 - 2, k, k);
  } else if (tile.special === 'bee') {
    g.drawImage(sprite('beebadge'), x - size / 2 + Math.sin(clock * 9) * 1.5, y - size / 2 - 2 + Math.cos(clock * 11) * 1.5, size, size);
  }
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

// QA hook (`?debug=1`): lets an automated test read the board, tap cells and drive the boosters.
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __hp: unknown }).__hp = {
    hint: () => (board ? board.bestMove(goals) : null),
    moves: () => (board ? board.legalMoves() : []),
    cell: (p: Pos) => ({ x: cx(p.c), y: cy(p.r) }),
    state: () => ({
      level: cfg.id, moves, locked, over, armed: armed?.key ?? null, coins: St.S.wallet.coin, boosters: { ...St.S.boosters }, score, starT,
      goals: goals.map((g) => ({ key: g.key, got: g.got, need: g.need })),
    }),
    board: () => board,
    arm: (key: string) => armBooster(key),
    use: (p: Pos) => useArmedAt(p),
    buy: (key: string) => St.buyBooster(key),
    tileAt: (p: Pos) => board?.grid[p.r][p.c] ?? null,
    swap: (a: Pos, b: Pos) => trySwap(a, b),
    play: async () => { const m = board?.bestMove(goals); if (m) await trySwap(m.a, m.b); return m; },
    setMoves: (n: number) => { moves = n; hudSig = ''; updateHud(); },
    nearWin: () => { for (const g of goals) g.got = Math.max(g.got, g.need - 1); hudSig = ''; updateHud(); },
  };
}
