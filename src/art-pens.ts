// Harvest Pop — 2.5D art for the animal pens, the crafting buildings unlocked after the
// bakery, the farmhouse, the mine and the three visitors. Same bright, rounded farm-cartoon
// style and the same 2:1 isometric helper as art.ts (light from the upper left: left face lit,
// right face shaded, tops brightest). Imports only art-core and farm-data — never art.ts —
// so there is no import cycle; the chicken-coop code is copied from there on purpose.

import { svg, isoAt, n1, pg, ln, SHADOW_FILTER, isoBox, isoShadow, isoRoof, rightQuad, leftQuad, baseTrim, MESH, fenceSide, type Pt, type Proj, type FaceColors } from './art-core';
import { PENS, MACHINES } from './farm-data';

export interface PenArt { back: string; front: string; slots: { x: number; y: number }[]; w: number; h: number }

// ---------------------------------------------------------------------------
// Small helpers

/** Iso units per grid cell side (a cell is a 52×26 px diamond). */
const CELL = 26;
/** Fence inset from the footprint edge. */
const E = 4;

/** Make every <defs> id (filter, pattern, gradient) unique to this picture. */
const scopeIds = (s: string, t: string): string =>
  s.replace(/\bid="([\w-]+)"/g, (_, id: string) => `id="${id}-${t}"`).replace(/url\(#([\w-]+)\)/g, (_, id: string) => `url(#${id}-${t})`);

const circ = (c: Pt, r: number, fill: string, extra = ''): string => `<circle cx="${n1(c[0])}" cy="${n1(c[1])}" r="${r}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
const ell = (c: Pt, rx: number, ry: number, fill: string, extra = ''): string => `<ellipse cx="${n1(c[0])}" cy="${n1(c[1])}" rx="${rx}" ry="${ry}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
const at = (c: Pt, inner: string, extra = ''): string => `<g transform="translate(${n1(c[0])} ${n1(c[1])})"${extra ? ` ${extra}` : ''}>${inner}</g>`;
/** Deterministic pseudo-random in [0, 1) for scattering props. */
const rnd = (k: number, salt = 0): number => { const x = Math.sin(k * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); };
const toSlots = (p: Proj, pts: [number, number][]): { x: number; y: number }[] =>
  pts.map(([i, j]) => { const [x, y] = p(i, j); return { x: n1(x), y: n1(y) }; });

const WOOD: FaceColors = { l: '#d9a060', r: '#a8743c', t: '#e9b874' };
const WOOD_DARK: FaceColors = { l: '#a86a3a', r: '#7d4a22', t: '#c98a52' };
const WOOD_ROOF = { far: '#9c6436', near: '#5e3a16', ridge: '#b9834a' };

/** Plank / brick lines on both faces of a box. */
const planks = (p: Proj, wi: number, wj: number, h: number, l: string, r: string, step = 7, from = 7): string => {
  let s = '';
  for (let z = from; z < h - 3; z += step) s += ln(p(0, wj, z), p(0, 0, z), l, 1, 'opacity=".35"') + ln(p(0, 0, z), p(wi, 0, z), r, 1, 'opacity=".4"');
  return s;
};
const windowL = (p: Proj, a: number, b: number, z1: number, z2: number, frame: string, i = 0, glass = '#8fd3ff'): string =>
  pg(leftQuad(p, a, b, z1, z2, i), glass) + pg(leftQuad(p, a, b, z1, z2, i), 'none', `stroke="${frame}" stroke-width="2" stroke-linejoin="round"`)
  + ln(p(i, (a + b) / 2, z1), p(i, (a + b) / 2, z2), frame, 1.3) + ln(p(i, a, (z1 + z2) / 2), p(i, b, (z1 + z2) / 2), frame, 1.3);
const windowR = (p: Proj, a: number, b: number, z1: number, z2: number, frame: string, j = 0, glass = '#8fd3ff'): string =>
  pg(rightQuad(p, a, b, z1, z2, j), glass) + pg(rightQuad(p, a, b, z1, z2, j), 'none', `stroke="${frame}" stroke-width="2" stroke-linejoin="round"`)
  + ln(p((a + b) / 2, j, z1), p((a + b) / 2, j, z2), frame, 1.3) + ln(p(a, j, (z1 + z2) / 2), p(b, j, (z1 + z2) / 2), frame, 1.3);
const doorL = (p: Proj, a: number, b: number, h: number, color: string, i = 0): string =>
  pg(leftQuad(p, a, b, 0, h, i), color) + circ(p(i, a + (b - a) * 0.25, h * 0.5), 1.6, '#ffe9a8');
const doorR = (p: Proj, a: number, b: number, h: number, color: string, j = 0): string =>
  pg(rightQuad(p, a, b, 0, h, j), color) + circ(p(a + (b - a) * 0.75, j, h * 0.5), 1.6, '#ffe9a8');
/** Striped awning hanging off the right face over i∈[a,b] at height z. */
const awningR = (p: Proj, a: number, b: number, z: number, c1: string, c2: string, edge: string, out = 8, drop = 5, j = 0): string => {
  let s = '';
  const n = Math.round((b - a) / 4);
  for (let k = 0; k < n; k++) { const x = a + ((b - a) * k) / n, x2 = a + ((b - a) * (k + 1)) / n; s += pg([p(x, j, z), p(x2, j, z), p(x2, j - out, z - drop), p(x, j - out, z - drop)], k % 2 ? c2 : c1); }
  return s + ln(p(a, j - out, z - drop), p(b, j - out, z - drop), edge, 1.5);
};
const smoke = (c: Pt, o = 1): string =>
  circ([c[0] + 1, c[1] - 3], 4.5, '#fff', `opacity="${0.6 * o}"`) + circ([c[0] + 6, c[1] - 10], 6, '#fff', `opacity="${0.45 * o}"`) + circ([c[0] + 12, c[1] - 18], 7, '#fff', `opacity="${0.3 * o}"`);
const chimney = (p: Proj, i: number, j: number, z: number, h: number, c: FaceColors): string => isoBox(p, i, j, z, 8, 7, h, c) + smoke(p(i + 4, j + 3.5, z + h));
/** A round hanging sign with an emblem drawn in screen space. */
const sign = (c: Pt, r: number, bg: string, border: string, emblem: string): string => circ(c, r, bg, `stroke="${border}" stroke-width="2"`) + at(c, emblem);
const tuft = (c: Pt, color = '#5f9e3a'): string => at(c, `<path d="M-3 0q0-5-1.5-7M0 0q0-6 0-8M3 0q0-5 1.5-7" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`);
const daisy = (c: Pt, petal = '#fff'): string => circ(c, 2.4, petal) + circ(c, 1.1, '#ffd54a');
const rock = (c: Pt, rx: number, ry: number): string => ell(c, rx, ry, '#9b9a94', 'stroke="#6e6d66" stroke-width="1"') + ell([c[0] - rx * 0.3, c[1] - ry * 0.35], rx * 0.45, ry * 0.4, '#c4c3bc');

// ---------------------------------------------------------------------------
// Fences

/** Wooden post-and-rail fence from a to b. */
function railFence(p: Proj, a: [number, number], b: [number, number]): string {
  const H = 18;
  const posts = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 26));
  let s = '';
  for (const z of [7, 15]) s += ln(p(a[0], a[1], z), p(b[0], b[1], z), '#b5713f', 3.5) + ln(p(a[0], a[1], z + 1), p(b[0], b[1], z + 1), '#dca06a', 1, 'opacity=".6"');
  for (let k = 0; k <= posts; k++) {
    const i = a[0] + ((b[0] - a[0]) * k) / posts, j = a[1] + ((b[1] - a[1]) * k) / posts;
    s += ln(p(i, j, 0), p(i, j, H + 4), '#7a3d16', 4) + ln(p(i, j, 1), p(i, j, H + 3), '#c97a48', 1.3);
  }
  return s;
}

// ---------------------------------------------------------------------------
// Pens. A pen's footprint is n×n grid cells = 26·n iso units a side; its frame is
// (52n + 8) × (26n + 90) with the footprint's front corner at (w/2, h − 4). Every pen
// is TWO layers so the animals drawn between them appear inside: `back` (ground, back
// fences, shelter) under them and `front` (the two front fences) over them.

interface Frame { N: number; w: number; h: number; p: Proj }
const frame = (cells: number): Frame => { const N = CELL * cells, w = 52 * cells + 8, h = 26 * cells + 90; return { N, w, h, p: isoAt(w / 2, h - 4) }; };

const ground = (id: string, c: [string, string, string]): string =>
  `<radialGradient id="${id}" cx="50%" cy="55%" r="62%"><stop offset="0" stop-color="${c[0]}"/><stop offset=".75" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient>`;
const DIRT: [string, string, string] = ['#ddb05c', '#bf8f40', '#8f8a36'];
const GRASS: [string, string, string] = ['#b4e58a', '#8ccd5e', '#6fae45'];
const MUD: [string, string, string] = ['#c09060', '#8f6238', '#6b4a2a'];
const PATCH: [string, string, string] = ['#bdeb95', '#9ddb70', '#7cc257'];

/** Animal spots inside a 104-unit yard by capacity (scaled to the pen): two staggered rows ≥ 34 px apart on screen, clear of the shelter and trough. */
const YARD_SLOTS: Record<number, [number, number][]> = {
  6: [[12, 14], [46, 14], [80, 14], [28, 48], [62, 48], [44, 82]],
  5: [[12, 14], [46, 14], [80, 14], [28, 48], [62, 48]],
  4: [[14, 14], [52, 14], [20, 52], [58, 52]],
};

interface YardSpec {
  ground: [string, string, string];
  fence: 'mesh' | 'rail';
  /** Props on the yard, drawn under the fences. */
  extras?: (p: Proj, N: number) => string;
  /** The shelter, drawn with a projection whose origin is its front corner in the back corner of the yard. */
  shelter: (q: Proj) => string;
  shelterW: number;
}

function yardPen(type: string, cells: number, capacity: number, y: YardSpec): PenArt {
  const { N, w, h, p } = frame(cells);
  const fence = y.fence === 'mesh' ? fenceSide : railFence;
  let s = `<defs>${SHADOW_FILTER}${y.fence === 'mesh' ? MESH : ''}${ground('ground', y.ground)}</defs>`;
  s += isoShadow(p, N, N, 3);
  s += pg([p(E, E), p(N - E, E), p(N - E, N - E), p(E, N - E)], 'url(#ground)');
  s += y.extras?.(p, N) ?? '';
  s += fence(p, [E, N - E], [N - E, N - E]) + fence(p, [N - E, N - E], [N - E, E]);
  // Feed trough along the left fence.
  const tj = Math.round(N * 0.56), tl = Math.round(N * 0.31);
  s += isoBox(p, 12, tj, 0, 12, tl, 8, WOOD_DARK);
  s += pg([p(14, tj + 2, 8), p(22, tj + 2, 8), p(22, tj + tl - 2, 8), p(14, tj + tl - 2, 8)], '#5e3517');
  // Shelter in the back corner.
  const o = N - 10 - y.shelterW;
  s += y.shelter((i, j, z = 0) => p(i + o, j + o, z));
  const front = `<defs>${y.fence === 'mesh' ? MESH : ''}</defs>` + fence(p, [E, N - E], [E, E]) + fence(p, [E, E], [N - E, E]);
  const k = N / 104;
  const slots = (YARD_SLOTS[capacity] ?? YARD_SLOTS[4]).slice(0, capacity).map(([i, j]): [number, number] => [i * k, j * k]);
  return { back: scopeIds(svg(w, h, s), type), front: scopeIds(svg(w, h, front), type + 'f'), slots: toSlots(p, slots), w, h };
}

/** Red hen house on stilts (the original coop house). */
const henHouse = (q0: Proj): string => {
  const w = 30, lift = 10;
  let s = '';
  for (const [i, j] of [[0, 0], [w, 0], [0, w]]) s += ln(q0(i + 2, j + 2, 0), q0(i + 2, j + 2, lift), '#6b3a1a', 3.5);
  s += isoBox(q0, 0, 0, lift, w, w, 3, { l: '#9c6436', r: '#7a4a22', t: '#b9834a' });
  const q: Proj = (i, j, z = 0) => q0(i + 3, j + 3, z + lift + 3);
  const hw = 24, hh = 20;
  s += isoBox(q, 0, 0, 0, hw, hw, hh, { l: '#d9322b', r: '#a8221d', t: '#e8453c' });
  for (let z = 5; z < hh; z += 5) s += ln(q(0, hw, z), q(0, 0, z), '#a8221d', 1, 'opacity=".5"') + ln(q(0, 0, z), q(hw, 0, z), '#7d1612', 1, 'opacity=".5"');
  s += isoRoof(q, hw, hw, hh, 13, 3, { far: '#3a3a3a', near: '#1d1d1d', ridge: '#fff', gable: '#d9322b' });
  s += ln(q(0, 0, 0), q(0, 0, hh), '#fff', 2) + ln(q(0, hw, 0), q(0, hw, hh), '#fff', 2) + ln(q(hw, 0, 0), q(hw, 0, hh), '#fff', 2);
  // Door on the left face, a window on the right, and the ramp down to the yard.
  s += pg(leftQuad(q, 8, 17, 0, 12), '#fff') + pg(leftQuad(q, 9.5, 15.5, 0, 10.5), '#3a1a0a');
  s += pg(rightQuad(q, 8, 16, 8, 15), '#fff') + pg(rightQuad(q, 9.5, 14.5, 9, 14), '#2b2b2b');
  s += pg([q(0, 8.5, 0), q(0, 16.5, 0), q(-20, 16.5, -lift - 3), q(-20, 8.5, -lift - 3)], '#a0633a');
  for (let k = 1; k <= 4; k++) s += ln(q(-4 * k, 8.5, -((lift + 3) * k) / 5), q(-4 * k, 16.5, -((lift + 3) * k) / 5), '#6b3a1a', 1.5);
  return s;
};

/** A small gabled shed: walls, plank lines, roof, corner trims and a door on the gable (left) face. */
const shed = (q: Proj, w: number, d: number, h: number, wall: FaceColors, roof: { far: string; near: string; ridge: string }, door: string, open = false): string => {
  let s = isoBox(q, 0, 0, 0, w, d, h, wall) + planks(q, w, d, h, roof.near, roof.near, 6, 6);
  s += isoRoof(q, w, d, h, Math.round(h * 0.55), 3, { ...roof, gable: wall.l });
  s += ln(q(0, 0, 0), q(0, 0, h), '#fff', 1.5, 'opacity=".5"');
  s += open ? pg(leftQuad(q, d * 0.2, d * 0.8, 0, h * 0.72), door) : doorL(q, d * 0.3, d * 0.68, h * 0.65, door);
  return s;
};
const hayBale = (q: Proj, i: number, j: number): string =>
  isoBox(q, i, j, 0, 10, 8, 8, { l: '#e6c45a', r: '#c49a35', t: '#f3d775' }) + ln(q(i, j + 4, 4), q(i, j, 4), '#b8912f', 1.3) + ln(q(i, j, 4), q(i + 10, j, 4), '#a9822a', 1.3);

const coopGrain = (p: Proj, N: number): string => {
  let s = '';
  const m = N - 20, count = Math.round(46 * (N / 104) ** 2);
  for (let k = 0; k < count; k++) s += ell(p(10 + ((k * 37) % m), 10 + ((k * 53) % m)), 1.6, 1, '#f6dc7a', 'opacity=".85"');
  return s;
};
const meadow = (p: Proj, N: number, flowers: string): string => {
  let s = '';
  for (let k = 0; k < 14; k++) s += tuft(p(10 + rnd(k, 1) * (N - 20), 10 + rnd(k, 2) * (N - 20)));
  for (let k = 0; k < 7; k++) s += daisy(p(12 + rnd(k, 3) * (N - 24), 12 + rnd(k, 4) * (N - 24)), flowers);
  return s;
};
const puddles = (p: Proj, N: number): string => {
  let s = '';
  for (const [i, j, r] of [[0.26, 0.34, 11], [0.62, 0.2, 9], [0.44, 0.62, 10], [0.74, 0.5, 7]]) {
    const c = p(i * N, j * N);
    s += ell(c, r, r / 2, '#5e4026') + ell([c[0] - 1, c[1] - 0.5], r * 0.7, r * 0.3, '#8ea7b5', 'opacity=".55"') + ell([c[0] - r * 0.3, c[1] - r * 0.2], r * 0.22, r * 0.1, '#fff', 'opacity=".6"');
  }
  return s;
};
const rocky = (p: Proj, N: number): string => {
  let s = '';
  for (const [i, j, r] of [[0.18, 0.36, 4], [0.7, 0.2, 3.5], [0.84, 0.46, 3], [0.3, 0.84, 3.5], [0.6, 0.72, 2.6]]) s += rock(p(i * N, j * N), r, r * 0.65);
  // A climbing pile by the right fence.
  const c = p(N * 0.5, N * 0.8);
  s += rock([c[0] + 6, c[1]], 9, 5.5) + rock([c[0] - 7, c[1] + 1], 8, 5) + rock([c[0] - 1, c[1] - 7], 7, 4.5);
  for (let k = 0; k < 8; k++) s += tuft(p(10 + rnd(k, 5) * (N - 20), 10 + rnd(k, 6) * (N - 20)), '#7a9a3a');
  return s;
};

const YARDS: Record<string, YardSpec> = {
  coop: { ground: DIRT, fence: 'mesh', extras: coopGrain, shelter: henHouse, shelterW: 30 },
  cowpasture: { ground: GRASS, fence: 'rail', extras: (p, N) => meadow(p, N, '#fff'), shelterW: 40, shelter: (q) =>
    shed(q, 40, 40, 22, { l: '#b07a48', r: '#80522a', t: '#c48d58' }, { far: '#a8362d', near: '#7d241e', ridge: '#c9524a' }, '#4a2a12', true)
    + ln(q(0, 8, 0), q(0, 32, 15.8), '#fff', 2, 'opacity=".8"') + ln(q(0, 32, 0), q(0, 8, 15.8), '#fff', 2, 'opacity=".8"') + hayBale(q, 44, 6) },
  pigpen: { ground: MUD, fence: 'rail', extras: puddles, shelterW: 28, shelter: (q) =>
    shed(q, 28, 28, 18, { l: '#e0b887', r: '#b88a55', t: '#ecc99e' }, { far: '#f28fb0', near: '#d5648c', ridge: '#ffc0d6' }, '#4a2a12')
    + circ(q(0, 14, 15), 3, '#fff') + circ(q(0, 14, 15), 1.8, '#f28fb0') },
  sheeppasture: { ground: GRASS, fence: 'rail', extras: (p, N) => meadow(p, N, '#ffe9a8'), shelterW: 36, shelter: (q) =>
    shed(q, 36, 36, 20, { l: '#f3e6c8', r: '#d6c39e', t: '#f9f0dc' }, { far: '#8d7b66', near: '#5f5042', ridge: '#a8957e' }, '#3b2d20', true) + hayBale(q, -12, 12) },
  lambpasture: { ground: GRASS, fence: 'rail', extras: (p, N) => meadow(p, N, '#ffd1e0'), shelterW: 24, shelter: (q) =>
    shed(q, 24, 24, 16, { l: '#ffffff', r: '#d9dee5', t: '#ffffff' }, { far: '#c0675a', near: '#8e463c', ridge: '#dd8a7c' }, '#6b3f2a')
    + windowR(q, 8, 16, 7, 13, '#c0675a') },
  goatyard: { ground: DIRT, fence: 'rail', extras: rocky, shelterW: 28, shelter: (q) =>
    shed(q, 28, 28, 18, { l: '#9ca3ad', r: '#6f7680', t: '#b4bac3' }, { far: '#4b5059', near: '#2f333a', ridge: '#6a7079' }, '#5a3a1a')
    + windowR(q, 9, 19, 8, 14, '#4b5059') },
};

// --- 'house' look: a kennel / hutch / stable on a grass patch, no fences. -----------------

function housePen(type: string, cells: number, slots: [number, number][], draw: (p: Proj, N: number) => string): PenArt {
  const { N, w, h, p } = frame(cells);
  let s = `<defs>${SHADOW_FILTER}${ground('ground', PATCH)}</defs>` + isoShadow(p, N, N, 3);
  s += pg([p(2, 2), p(N - 2, 2), p(N - 2, N - 2), p(2, N - 2)], 'url(#ground)');
  s += draw(p, N);
  return { back: scopeIds(svg(w, h, s), type), front: svg(w, h, ''), slots: toSlots(p, slots), w, h };
}

/** A kennel with an arched door on its gable, in the back corner of a 2-cell patch. */
const kennel = (p: Proj, wall: FaceColors, roof: { far: string; near: string; ridge: string }, deco: (q: Proj) => string): string => {
  const w = 26, o = 52 - 8 - w;
  const q: Proj = (i, j, z = 0) => p(i + o, j + o, z);
  let s = isoBox(q, 0, 0, 0, w, w, 18, wall) + planks(q, w, w, 18, roof.near, roof.near, 6, 6);
  s += isoRoof(q, w, w, 18, 12, 3, { ...roof, gable: wall.l });
  s += ln(q(0, 0, 0), q(0, 0, 18), '#fff', 1.5, 'opacity=".5"');
  // Arched doorway on the gable face.
  s += pg(leftQuad(q, 8, 18, 0, 8), '#3a1a0a') + ell(q(0, 13, 8), 5.4, 5, '#3a1a0a');
  s += deco(q);
  // Bowl in front.
  s += ell(p(12, 30), 5, 2.6, '#c7352c') + ell(p(12, 30, 1.5), 3.6, 1.8, '#7a3d16');
  return s + daisy(p(40, 8), '#fff') + tuft(p(8, 12)) + tuft(p(46, 38)) + daisy(p(12, 46), '#fff');
};

/** Horse / donkey stable: a wooden stable with a half door on the right face and a hitching rail. */
const stable = (p: Proj, N: number, roof: { far: string; near: string; ridge: string }, door: string, extra: (q: Proj) => string): string => {
  const wi = 48, wj = 34, h = 26, i0 = 24, j0 = N - 4 - wj;
  const q: Proj = (i, j, z = 0) => p(i + i0, j + j0, z);
  const wall: FaceColors = { l: '#c48a52', r: '#91602f', t: '#d9a468' };
  let s = isoBox(q, 0, 0, 0, wi, wj, h, wall) + planks(q, wi, wj, h, '#7a4a22', '#5e3a16', 6, 6);
  s += isoRoof(q, wi, wj, h, 13, 4, { ...roof, gable: wall.l });
  // Hay-loft window on the gable, a window on the left wall.
  s += pg(leftQuad(q, 12, 22, 15, 23), '#3b2d20') + hayBaleGable(q, 17, 15);
  s += windowL(q, 4, 10, 10, 18, '#5e3a16');
  // Half door: bottom closed, top open and dark with a horseshoe above.
  s += pg(rightQuad(q, 16, 32, 0, 22), '#3b2d20') + pg(rightQuad(q, 16, 32, 0, 11), door);
  s += ln(q(16, 0, 11), q(32, 0, 11), '#f3d9a8', 1.5) + ln(q(16, 0, 0), q(32, 0, 11), '#f3d9a8', 1.3, 'opacity=".6"') + ln(q(24, 0, 0), q(24, 0, 22), '#5e3a16', 1);
  s += at(q(24, 0, 24), `<path d="M-3 1a3 3 0 0 1 6 0" stroke="#d9dee5" stroke-width="1.8" fill="none" stroke-linecap="round"/>`);
  s += ln(q(0, 0, 0), q(0, 0, h), '#fff', 1.5, 'opacity=".5"');
  s += extra(q);
  // A hitching rail at the front-left and a water bucket.
  s += ln(p(6, 30, 0), p(6, 30, 12), '#7a3d16', 3) + ln(p(6, 10, 0), p(6, 10, 12), '#7a3d16', 3) + ln(p(6, 30, 10), p(6, 10, 10), '#b5713f', 3);
  s += at(p(14, 8), `<path d="M-4 0v-6h8v6a4 2 0 0 1-8 0z" fill="#8d98a6"/><ellipse cx="0" cy="-6" rx="4" ry="1.8" fill="#6fb8e6"/>`);
  return s + tuft(p(50, 8)) + tuft(p(10, 48)) + daisy(p(60, 14), '#fff');
};
const hayBaleGable = (q: Proj, j: number, z: number): string => at(q(0, j, z), `<ellipse cx="0" cy="2" rx="4.5" ry="3" fill="#e6c45a"/><path d="M-4 2h8" stroke="#b8912f" stroke-width="1"/>`);

const HOUSES: Record<string, () => PenArt> = {
  doghouse: () => housePen('doghouse', 2, [[14, 12]], (p) => kennel(p, { l: '#c7643a', r: '#94452a', t: '#d8784e' }, { far: '#4a3b33', near: '#2f2520', ridge: '#6b5a50' },
    (q) => at(q(0, 20, 14), `<path d="M-4 -1a1.6 1.6 0 1 1 1 -2.4h6a1.6 1.6 0 1 1 1 2.4a1.6 1.6 0 1 1 -1 2.4h-6a1.6 1.6 0 1 1 -1 -2.4z" fill="#fff6e8"/>`))),
  cathouse: () => housePen('cathouse', 2, [[14, 12]], (p) => kennel(p, { l: '#b9a0d8', r: '#8a6fb0', t: '#cdb8e6' }, { far: '#f28fb0', near: '#d5648c', ridge: '#ffc0d6' },
    (q) => circ(q(0, 20, 14), 3, '#fff') + circ(q(0, 20, 14), 1.8, '#8fd3ff') + at(q(18, 0, 6), `<circle r="3.5" fill="#f26b8a"/><path d="M-3 -1q3 -1 6 1M-3 1.5q3 -1 6 1" stroke="#c93f62" stroke-width="1" fill="none"/>`))),
  puppyhouse: () => housePen('puppyhouse', 2, [[14, 12]], (p) => kennel(p, { l: '#5aa0d8', r: '#3a72a8', t: '#74b6e8' }, { far: '#f3f6fa', near: '#c9d2dd', ridge: '#fff' },
    (q) => at(q(0, 20, 14), `<path d="M-4 -1a1.6 1.6 0 1 1 1 -2.4h6a1.6 1.6 0 1 1 1 2.4a1.6 1.6 0 1 1 -1 2.4h-6a1.6 1.6 0 1 1 -1 -2.4z" fill="#fff6e8"/>`) + at(q(16, -2, 3), `<circle r="3.5" fill="#e8413c"/><path d="M-3.5 0h7" stroke="#fff" stroke-width="1.5"/>`))),
  kittenhouse: () => housePen('kittenhouse', 2, [[14, 12]], (p) => kennel(p, { l: '#f6c9a0', r: '#d49c6e', t: '#fbdcbd' }, { far: '#e07a52', near: '#b2522f', ridge: '#f0a07c' },
    (q) => at(q(0, 20, 14), `<path d="M0 3L-4 -1a2.3 2.3 0 0 1 4 -2.5a2.3 2.3 0 0 1 4 2.5z" fill="#f26b8a"/>`) + at(q(16, -2, 3), `<circle r="3.5" fill="#8fd3ff"/><path d="M-3 -1q3 -1 6 1M-3 1.5q3 -1 6 1" stroke="#4a84cc" stroke-width="1" fill="none"/>`))),
  bunnyhouse: () => housePen('bunnyhouse', 2, [[10, 12], [36, 6]], (p) => {
    const w = 30, o = 52 - 6 - w, lift = 9;
    const q: Proj = (i, j, z = 0) => p(i + o, j + o, z);
    let s = '';
    for (const [i, j] of [[2, 2], [w - 2, 2], [2, w - 2]]) s += ln(q(i, j, 0), q(i, j, lift), '#6b3a1a', 3.5);
    s += isoBox(q, 0, 0, lift, w, w, 14, { l: '#d9a060', r: '#a8743c', t: '#e9b874' }) + planks((i, j, z = 0) => q(i, j, z + lift), w, w, 14, '#8a5a2b', '#5e3a16', 5, 5);
    s += `<defs>${MESH}</defs>` + pg(leftQuad(q, 4, 26, lift + 2, lift + 11), '#3a2a1a') + pg(leftQuad(q, 4, 26, lift + 2, lift + 11), 'url(#mesh)');
    s += isoRoof((i, j, z = 0) => q(i, j, z + lift), w, w, 14, 9, 3, { far: '#6a9a4a', near: '#44682d', ridge: '#8fbb6b', gable: '#d9a060' });
    s += at(q(w, 6, lift + 10), `<path d="M-2 4l2-9 2 9z" fill="#f7a823"/><path d="M0 -5q-2-3 1-4M0 -5q2-3 3-2" stroke="#5f9e3a" stroke-width="1.3" fill="none"/>`);
    s += ell(p(26, 18), 4, 2, '#f7a823') + tuft(p(44, 14)) + tuft(p(8, 44)) + daisy(p(14, 40), '#fff') + daisy(p(46, 36), '#ffd1e0');
    return s;
  }),
  horsestable: () => housePen('horsestable', 3, [[20, 16], [50, 12]], (p, N) => stable(p, N, { far: '#6b4a2a', near: '#46301a', ridge: '#8a6a4a' }, '#8a3c33', (q) =>
    at(q(30, 0, 20), `<path d="M0 -3v-3M-2 -4l4 0" stroke="#e6c45a" stroke-width="1.2"/>`) + hayBale(q, 52, 4))),
  donkeystable: () => housePen('donkeystable', 3, [[20, 16], [50, 12]], (p, N) => stable(p, N, { far: '#7f8a99', near: '#55606e', ridge: '#a3aeba' }, '#5f8f4a', (q) =>
    hayBale(q, 52, 4) + hayBale(q, 52, 13) + at(q(14, -4, 0), `<path d="M-4 0l1-5h6l1 5z" fill="#e8413c"/><ellipse cx="0" cy="-5" rx="3" ry="1.3" fill="#f7a823"/>`))),
};

// --- 'pond' look: water on a grass bank; the animals sit ON the water. ---------------------

const WATER: [string, string, string] = ['#9ae4fb', '#4db4e8', '#2b86c4'];
const ripple = (c: Pt): string => at(c, `<path d="M-5 0q2.5-2.5 5 0t5 0" stroke="#fff" stroke-width="1.3" fill="none" opacity=".6" stroke-linecap="round"/>`);
const reeds = (c: Pt, flip = 1): string => at(c, `<g transform="scale(${flip} 1)"><path d="M0 0q-1-9-4-16M3 0q1-9-1-18M6 0q3-8 6-13" stroke="#4e8f3a" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="2.2" cy="-17" rx="1.5" ry="3.5" fill="#6b3f17"/><ellipse cx="-3.6" cy="-15" rx="1.4" ry="3" fill="#6b3f17"/></g>`);
const lilyPad = (c: Pt): string => at(c, `<path d="M0 0L5 -1.5A5 2.6 0 1 1 5 1.5z" fill="#5fae4a" stroke="#3f8a30" stroke-width=".7"/>`);

function pondPen(type: string, cells: number, slots: [number, number][], inset: number, draw: (p: Proj, N: number, w: [number, number]) => string): PenArt {
  const { N, w, h, p } = frame(cells);
  let s = `<defs>${SHADOW_FILTER}${ground('bank', PATCH)}${ground('water', WATER)}</defs>` + isoShadow(p, N, N, 3);
  s += pg([p(2, 2), p(N - 2, 2), p(N - 2, N - 2), p(2, N - 2)], 'url(#bank)');
  const a = inset, b = N - inset;
  s += pg([p(a - 3, a - 3), p(b + 3, a - 3), p(b + 3, b + 3), p(a - 3, b + 3)], '#cdb17a');
  s += pg([p(a, a), p(b, a), p(b, b), p(a, b)], 'url(#water)');
  for (let k = 0; k < 9; k++) s += ripple(p(a + 8 + rnd(k, 7) * (b - a - 16), a + 8 + rnd(k, 8) * (b - a - 16)));
  s += draw(p, N, [a, b]);
  return { back: scopeIds(svg(w, h, s), type), front: svg(w, h, ''), slots: toSlots(p, slots), w, h };
}

const PONDS: Record<string, () => PenArt> = {
  lake: () => pondPen('lake', 4, [[28, 32], [62, 26], [50, 64]], 10, (p, N, [a, b]) => {
    let s = lilyPad(p(70, 76)) + lilyPad(p(80, 62)) + lilyPad(p(24, 84)) + daisy(p(74, 80), '#f8b8d0');
    // Wooden pier from the left bank.
    for (const [i, j] of [[8, 60], [8, 70], [18, 60], [18, 70], [28, 60], [28, 70]]) s += ln(p(i, j, -4), p(i, j, 4), '#6b3a1a', 3);
    s += isoBox(p, 0, 58, 2, 30, 12, 2.5, { l: '#b98b5c', r: '#8a6138', t: '#cda075' });
    for (let i = 4; i < 30; i += 4) s += ln(p(i, 58, 4.5), p(i, 70, 4.5), '#8a6138', 0.8, 'opacity=".6"');
    s += reeds(p(b - 2, b - 6)) + reeds(p(b - 14, b + 2), -1) + reeds(p(a + 2, b - 2), -1) + reeds(p(b, a + 12));
    return s + tuft(p(6, 20)) + tuft(p(N - 8, 30)) + daisy(p(8, 40), '#fff');
  }),
  lobsterpool: () => pondPen('lobsterpool', 3, [[18, 20], [50, 16], [26, 50]], 11, (p, N, [a, b]) => {
    let s = '';
    const edges: [Pt, Pt][] = [[[a, a], [b, a]], [[b, a], [b, b]], [[a, a], [a, b]], [[a, b], [b, b]]];
    const n = Math.round((b - a) / 6);
    for (let e = 0; e < 4; e++) for (let k = 0; k <= n; k++) {
      const [[i1, j1], [i2, j2]] = edges[e], t = k / n;
      s += rock(p(i1 + (i2 - i1) * t - 2 + (e === 1 ? 4 : 0), j1 + (j2 - j1) * t - 2 + (e === 3 ? 4 : 0)), 3.6 + rnd(k, e), 2.4 + rnd(k, e + 9) * 0.6);
    }
    // Buoy and a coil of rope on the bank.
    s += at(p(b - 6, a + 8), `<ellipse cx="0" cy="0" rx="4" ry="2" fill="#2b86c4" opacity=".5"/><path d="M-3 -1a3 4 0 0 1 6 0v1h-6z" fill="#e8413c"/><path d="M-3 -1h6" stroke="#fff" stroke-width="1.5"/>`);
    s += at(p(10, N - 10), `<ellipse rx="6" ry="3" fill="#d9b27a" stroke="#a8804a" stroke-width="1.2"/><ellipse rx="3" ry="1.4" fill="#a8804a"/>`);
    return s + tuft(p(N - 6, N - 12)) + tuft(p(6, 14));
  }),
  ducksalon: () => pondPen('ducksalon', 3, [[16, 18], [46, 14], [22, 46], [50, 40]], 8, (p, N, [a, b]) => {
    // The salon: a small pink hut on a deck in the back corner.
    const w = 22, o = N - 6 - w;
    const q: Proj = (i, j, z = 0) => p(i + o, j + o, z);
    let s = isoBox(q, -6, -6, 0, w + 10, w + 10, 2.5, { l: '#b98b5c', r: '#8a6138', t: '#cda075' });
    const q2: Proj = (i, j, z = 0) => q(i, j, z + 2.5);
    s += shed(q2, w, w, 16, { l: '#f6a5c0', r: '#d97c9c', t: '#fbc3d6' }, { far: '#ffffff', near: '#e3dde6', ridge: '#fff' }, '#7a3e5a');
    s += at(q2(0, 18, 13), `<path d="M0 3L-4 -1a2.3 2.3 0 0 1 4 -2.5a2.3 2.3 0 0 1 4 2.5z" fill="#fff"/>`);
    s += windowR(q2, 7, 15, 6, 12, '#d97c9c', 0, '#fff6fa');
    s += reeds(p(a + 2, b - 4), -1) + reeds(p(b - 4, a + 6)) + lilyPad(p(30, 60)) + daisy(p(N - 8, 14), '#f8b8d0') + tuft(p(8, 10));
    return s;
  }),
};

// --- 'hive' look: a tree with beehive boxes under it on a grass patch. ---------------------

function hivePen(type: string): PenArt {
  const { N, w, h, p } = frame(2);
  let s = `<defs>${SHADOW_FILTER}${ground('ground', PATCH)}</defs>` + isoShadow(p, N, N, 3);
  s += pg([p(2, 2), p(N - 2, 2), p(N - 2, N - 2), p(2, N - 2)], 'url(#ground)');
  for (let k = 0; k < 8; k++) s += daisy(p(6 + rnd(k, 11) * (N - 12), 6 + rnd(k, 12) * (N - 12)), k % 2 ? '#f8b8d0' : '#fff');
  // The tree in the back corner: trunk, then three canopy blobs.
  const t = p(44, 44);
  s += ell(t, 9, 4, '#000', 'opacity=".15"') + at(t, `<path d="M-4 0q-1-10 0-22h8q1 12 0 22z" fill="#8a5a2b"/><path d="M-1 -4q0-8 0-16" stroke="#a8743c" stroke-width="1.5" opacity=".7"/>`);
  for (const [dx, dy, r, c] of [[-10, -28, 15, '#4e9a3a'], [12, -30, 14, '#3f8a30'], [0, -40, 16, '#5fae4a'], [-6, -44, 8, '#7cc257']] as [number, number, number, string][]) s += circ([t[0] + dx, t[1] + dy], r, c);
  // Hive boxes: stacked white boxes with a yellow lid and a dark entrance.
  const hive = (i: number, j: number): string => {
    const c: FaceColors = { l: '#fff8e8', r: '#e3cf9c', t: '#fffdf4' };
    let b = isoBox(p, i, j, 0, 11, 11, 6, c) + isoBox(p, i, j, 6, 11, 11, 5, c) + isoBox(p, i - 0.8, j - 0.8, 11, 12.6, 12.6, 2.5, { l: '#f7d774', r: '#d9ab3b', t: '#fde9a2' });
    b += ln(p(i, j + 11, 6), p(i, j, 6), '#c9b48e', 1) + ln(p(i, j, 6), p(i + 11, j, 6), '#b89e74', 1) + pg(rightQuad(p, i + 3, i + 8, 1, 2.6, j), '#3a2a1a');
    return b;
  };
  s += hive(22, 34) + hive(38, 34) + hive(38, 20);
  // A few bees around the canopy.
  for (const [dx, dy] of [[-24, -36], [20, -16], [-14, -12]]) s += at([t[0] + dx, t[1] + dy], `<ellipse rx="2.6" ry="1.8" fill="#f7c948"/><path d="M-1 -1.5v3M1 -1.5v3" stroke="#2b2b2b" stroke-width=".8"/><ellipse cx="-.5" cy="-2.2" rx="1.6" ry="1" fill="#fff" opacity=".8"/>`);
  return { back: scopeIds(svg(w, h, s), type), front: svg(w, h, ''), slots: toSlots(p, [[8, 8], [34, 6], [6, 32]]), w, h };
}

const PEN_BUILDERS: Record<string, () => PenArt> = { ...HOUSES, ...PONDS, beehive: () => hivePen('beehive') };
for (const [id, y] of Object.entries(YARDS)) PEN_BUILDERS[id] = () => yardPen(id, PENS[id].footprint, PENS[id].capacity, y);

const penCache = new Map<string, PenArt>();
/** The two layers, frame size and animal spots of a pen type (memoized). */
export function penArt(type: string): PenArt {
  let a = penCache.get(type);
  if (!a) {
    const build = PEN_BUILDERS[type];
    if (!build) throw new Error(`art-pens: no art for pen "${type}"`);
    a = build();
    penCache.set(type, a);
  }
  return a;
}

// ---------------------------------------------------------------------------
// Crafting buildings: 120×120 pictures on a 2×2-cell footprint, drawn like ICON_MILL with
// isoAt(58, 108). Each starts with its own soft shadow and ends with a base trim.

const building = (t: string, draw: (p: Proj) => string, w = 120, h = 120, ox = 58, oy = 108): string =>
  scopeIds(svg(w, h, `<defs>${SHADOW_FILTER}</defs>` + draw(isoAt(ox, oy))), t);

/** Shadow + walls + plank lines + gable roof: the common shop body. */
const shop = (p: Proj, wi: number, wj: number, h: number, rh: number, wall: FaceColors, roof: { far: string; near: string; ridge: string }, lines?: [string, string]): string =>
  isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, h, wall) + (lines ? planks(p, wi, wj, h, lines[0], lines[1]) : '')
  + isoRoof(p, wi, wj, h, rh, 3, { ...roof, gable: wall.l });

/** Sign emblems, drawn in a ~16 px box centred on (0, 0). */
const EMB = {
  milkcan: `<path d="M-4 -3h8v9a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1-4 6z" fill="#cfd8e3" stroke="#6f7a88" stroke-width="1"/><rect x="-5" y="-5" width="10" height="2.5" rx="1" fill="#8d98a6"/><rect x="-2" y="-7.5" width="4" height="3" rx="1" fill="#8d98a6"/>`,
  sugar: `<polygon points="-6,-2 0,-5 6,-2 0,1" fill="#fff"/><polygon points="-6,-2 0,1 0,8 -6,5" fill="#dfe6ee"/><polygon points="6,-2 0,1 0,8 6,5" fill="#b8c2cc"/>`,
  popcorn: `<path d="M-5 -1h10l-1.5 8h-7z" fill="#e8413c"/><path d="M-2.5 -1l.8 8M2.5 -1l-.8 8" stroke="#fff" stroke-width="1.2"/><circle cx="-3" cy="-3" r="2.4" fill="#fff6e8"/><circle cx="3" cy="-3" r="2.4" fill="#fff6e8"/><circle cx="0" cy="-5.5" r="2.6" fill="#ffe9a8"/>`,
  yarn: `<circle r="6.5" fill="#f26b8a"/><path d="M-5.5 -3q6-2 11 1M-5.5 2q6-2 11 1M-2.5 -6q-2 6 1 12" stroke="#c93f62" stroke-width="1.2" fill="none"/>`,
  shirt: `<path d="M-7 -4l4-2.5 3 2 3-2 4 2.5-2 3.5-2-1v7h-6v-7l-2 1z" fill="#4fb0e8"/>`,
  cake: `<rect x="-7" y="-1" width="14" height="7" rx="1.5" fill="#f7a8c4"/><rect x="-5" y="-6" width="10" height="5" rx="1.5" fill="#fff0f6"/><path d="M-5 -2q2.5 2 5 0t5 0" stroke="#f7a8c4" stroke-width="1.2" fill="none"/><circle cy="-8" r="1.8" fill="#e8413c"/>`,
  fruit: `<circle cx="-3" cy="1" r="4.5" fill="#f7902b"/><circle cx="4" cy="-1" r="4.2" fill="#e8413c"/><path d="M4 -5v-2.5" stroke="#5e3a16" stroke-width="1.2"/><path d="M4.5 -6q3-2 3 1z" fill="#5fae4a"/>`,
  hook: `<path d="M-1 -7v8a4 4 0 0 0 8 0" stroke="#6f7a88" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7 1l-2.5-3" stroke="#6f7a88" stroke-width="2" stroke-linecap="round"/><circle cx="-1" cy="-7" r="2" fill="#e8413c"/>`,
  cone: `<path d="M-5 0l5 11 5-11z" fill="#e2a85a"/><path d="M-3 1l3 2 3-2M-4 3l4 2 4-2" stroke="#b8762f" stroke-width=".8" fill="none"/><circle cx="-3" cy="-3" r="4.5" fill="#f8b8d0"/><circle cx="3" cy="-3" r="4.5" fill="#fff6e8"/><circle cy="-7.5" r="4.5" fill="#8bd4b8"/>`,
  net: `<circle r="6.5" fill="none" stroke="#8a6138" stroke-width="2"/><path d="M-5 -3h10M-6 0h12M-5 3h10M-3 -5.5v11M0 -6.5v13M3 -5.5v11" stroke="#8a6138" stroke-width=".8"/>`,
  kebab: `<path d="M0 -8v16" stroke="#8d98a6" stroke-width="1.5"/><path d="M-4 -5h8l-1.5 11h-5z" fill="#b5602f"/><path d="M-3.5 -2h7M-3 1.5h6M-2.5 4.5h5" stroke="#7a3d16" stroke-width="1"/>`,
  jam: `<rect x="-5" y="-4" width="10" height="11" rx="2" fill="#d6324a"/><rect x="-6" y="-7.5" width="12" height="4" rx="1.5" fill="#f1e3c8"/><path d="M-4 -7.5v4M0 -7.5v4M4 -7.5v4" stroke="#c9b48e" stroke-width="1"/><rect x="-3" y="-1" width="6" height="4" fill="#fff" opacity=".7"/>`,
  ring: `<circle cy="1" r="5.5" fill="none" stroke="#f3d77c" stroke-width="2.2"/><polygon points="0,-9.5 3.5,-6 0,-2.5 -3.5,-6" fill="#8fd3ff" stroke="#fff" stroke-width=".8"/>`,
  cup: `<path d="M-5 -3h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4z" fill="#fff"/><path d="M5 -1h2a2 2 0 0 1 0 4h-2" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M-2 -5q1-2 0-4M2 -5q1-2 0-4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>`,
  pot: `<path d="M-6 -2h12v6a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="#5f6a78"/><rect x="-7.5" y="-4" width="15" height="2.5" rx="1" fill="#8d98a6"/><path d="M-3 -6q1-2 0-4M2 -6q1-2 0-4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".9"/>`,
  candle: `<rect x="-3" y="-3" width="6" height="10" rx="1" fill="#fff6e8" stroke="#d9c9a8" stroke-width="1"/><path d="M0 -3v-2" stroke="#333" stroke-width="1"/><path d="M0 -10q3 3 0 5.5q-3-2.5 0-5.5z" fill="#ff9f2b"/><circle cy="-6.5" r="1.1" fill="#ffe07a"/>`,
  flower: `<g fill="#f26b8a"><circle cx="0" cy="-4.5" r="2.6"/><circle cx="4.3" cy="-1.4" r="2.6"/><circle cx="2.6" cy="3.6" r="2.6"/><circle cx="-2.6" cy="3.6" r="2.6"/><circle cx="-4.3" cy="-1.4" r="2.6"/></g><circle r="2.3" fill="#ffd54a"/>`,
  pie: `<ellipse cy="1" rx="8" ry="4.5" fill="#e2a85a" stroke="#b8762f" stroke-width="1.3"/><path d="M-5 -1l10 4M-5 3l10-4M-1 -3v8M3 -3v8" stroke="#b8762f" stroke-width="1" opacity=".8"/>`,
};

const BUILDERS: Record<string, (p: Proj) => string> = {
  dairy: (p) => {
    const wi = 42, wj = 30, h = 30;
    let s = shop(p, wi, wj, h, 12, { l: '#f8fbff', r: '#d3dde8', t: '#ffffff' }, { far: '#6fa6e6', near: '#3a6fb5', ridge: '#9cc4f3' });
    s += pg(leftQuad(p, 0, wj, 21, 25), '#5c9be0') + pg(rightQuad(p, 0, wi, 21, 25), '#3d78bd');
    s += windowR(p, 6, 16, 8, 17, '#3d78bd') + windowR(p, 24, 34, 8, 17, '#3d78bd') + doorL(p, 9, 19, 20, '#4a84cc');
    s += sign(p(0, 24, 27), 6.5, '#fff', '#3d78bd', EMB.milkcan);
    s += at(p(-5, 8), `<ellipse rx="4" ry="1.8" fill="#8d98a6"/><path d="M-4 0v-9a4 2 0 0 1 8 0v9z" fill="#cfd8e3"/><ellipse cy="-9" rx="4" ry="1.8" fill="#aeb9c6"/><rect x="-2" y="-12" width="4" height="3" fill="#8d98a6"/>`);
    return s + baseTrim(p, wi, wj, '#9cc4f3');
  },
  grill: (p) => {
    const wi = 40, wj = 28, H = 30;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, 12, { l: '#c98a58', r: '#9a6238', t: '#d9a06c' }) + planks(p, wi, wj, 12, '#8a5a2b', '#5e3a16', 4, 4);
    for (const [i, j] of [[1, 1], [wi - 1, 1], [1, wj - 1], [wi - 1, wj - 1]]) s += ln(p(i, j, 12), p(i, j, H), '#7a4a22', 3);
    // The grill drum on the counter: coals, the grate and a flame.
    s += at(p(22, 13, 12), `<ellipse cx="2" cy="4" rx="16" ry="6" fill="#000" opacity=".2"/><path d="M-15 -4a15 7 0 0 0 30 0v6a15 9 0 0 1-30 0z" fill="#2b2b2b"/><ellipse cy="-4" rx="15" ry="7" fill="#4a4a4a"/><ellipse cy="-4" rx="12" ry="5" fill="#8a2d1a"/><g stroke="#2b2b2b" stroke-width="1.2"><path d="M-11 -4h22M-10 -6.5h20M-10 -1.5h20M-6 -8.5v9M0 -9v10M6 -8.5v9"/></g><path d="M-4 -7q1-4 3-3q0-3 3-2q-1 3 1 4q-2 3-7 1z" fill="#ff9f2b"/>`);
    // Red-white striped awning on the posts, with scalloped front edges.
    const o = 4, n = 12;
    for (let k = 0; k < n; k++) { const a = -o + ((wi + 2 * o) * k) / n, b = -o + ((wi + 2 * o) * (k + 1)) / n; s += pg([p(a, -o, H), p(b, -o, H), p(b, wj + o, H + 2), p(a, wj + o, H + 2)], k % 2 ? '#fff' : '#e8413c'); }
    for (let k = 0; k <= 8; k++) s += circ(p(-o + ((wi + 2 * o) * k) / 8, -o, H - 1), 2.4, k % 2 ? '#e8413c' : '#fff') + circ(p(-o, -o + ((wj + 2 * o) * k) / 8, H - 1), 2.2, k % 2 ? '#e8413c' : '#fff');
    s += smoke(p(22, 13, H + 2), 0.9);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  sugarmill: (p) => {
    const wi = 40, wj = 28, h = 30;
    let s = shop(p, wi, wj, h, 14, { l: '#d9b27a', r: '#a8804a', t: '#e8c48f' }, { far: '#6a9a4a', near: '#44682d', ridge: '#8fbb6b' }, ['#8a5a2b', '#5e3a16']);
    s += doorR(p, 14, 26, 19, '#4a2a0e') + at(p(0, 10, 16), `<circle r="8" fill="#8a5a2b"/><circle r="6" fill="#d9b27a"/><g stroke="#5e3a16" stroke-width="1.5"><path d="M-6 0h12M0 -6v12M-4.2 -4.2l8.4 8.4M-4.2 4.2l8.4-8.4"/></g><circle r="1.6" fill="#5e3a16"/>`);
    s += isoBox(p, 28, 18, h + 4, 7, 7, 14, { l: '#9ca3ad', r: '#6f7680', t: '#b4bac3' }) + ell(p(31.5, 21.5, h + 18), 5, 2.4, '#4b5059');
    s += sign(p(0, 23, 26), 6.5, '#fff', '#44682d', EMB.sugar);
    s += at(p(46, 4), `<path d="M-6 0c-1-6-1-10 1-14h10c2 4 2 8 1 14z" fill="#fff8e8" stroke="#c9b48e" stroke-width="1"/><path d="M-5 -14q5 2 10 0" stroke="#c9b48e" stroke-width="1.2" fill="none"/><g transform="translate(0 -6) scale(.6)">${EMB.sugar}</g>`);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  pieoven: (p) => {
    const wi = 38, wj = 28, h = 22;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, h, { l: '#c86b4f', r: '#9a4a33', t: '#d8795c' }) + planks(p, wi, wj, h, '#8a3c2a', '#5e2418', 5, 5);
    for (let z = 0; z < h - 5; z += 5) for (let k = 0; k < 4; k++) { const j = wj - 3 - 7 * k - ((z / 5) % 2 ? 3.5 : 0); s += ln(p(0, j, z), p(0, j, z + 5), '#8a3c2a', 1, 'opacity=".35"') + ln(p(3 + 8 * k + ((z / 5) % 2 ? 4 : 0), 0, z), p(3 + 8 * k + ((z / 5) % 2 ? 4 : 0), 0, z + 5), '#5e2418', 1, 'opacity=".4"'); }
    s += at(p(19, 14, h), `<path d="M-17 0a17 15 0 0 1 34 0z" fill="#c86b4f"/><path d="M-12 -2a12 10 0 0 1 10-10q-9 4-10 10z" fill="#e39b84" opacity=".7"/><path d="M-17 0a17 15 0 0 1 34 0" stroke="#8a3c2a" stroke-width="1" fill="none"/>`);
    s += chimney(p, 28, 21, h + 6, 12, { l: '#8a3c2a', r: '#5e2418', t: '#b25a44' });
    s += at(p(19, 0, 0), `<path d="M-8 0v-7a8 7 0 0 1 16 0v7z" fill="#3a1a0a"/><path d="M-5.5 0v-5a5.5 4.5 0 0 1 11 0v5z" fill="#ff8a2b"/><path d="M-3 0v-3a3 2.5 0 0 1 6 0v3z" fill="#ffd166"/>`);
    s += isoBox(p, 10, -7, 0, 18, 7, 7, WOOD_DARK) + at(p(19, -3.5, 7), `<g transform="scale(1.2)">${EMB.pie}</g>`) + smoke(p(19, -3.5, 10), 0.6);
    return s + baseTrim(p, wi, wj, '#e39b84');
  },
  popcornpot: (p) => {
    const wi = 36, wj = 26, h = 28;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, h, { l: '#fff', r: '#e8e8ee', t: '#fff' });
    for (let k = 0; k < 6; k += 2) s += pg(leftQuad(p, k * (wj / 6), (k + 1) * (wj / 6), 0, h), '#e8413c');
    for (let k = 1; k < 9; k += 2) s += pg(rightQuad(p, k * 4, (k + 1) * 4, 0, h), '#c9332e');
    s += windowR(p, 10, 28, 9, 19, '#7d1612', 0, '#3a1a0a') + isoBox(p, 9, -3, 7, 20, 3, 2, { l: '#f3d9a8', r: '#d4b47f', t: '#f9e8c4' });
    s += at(p(19, 0, 14), `<g transform="scale(.9)">${EMB.popcorn}</g>`);
    s += isoBox(p, -2, -2, h, wi + 4, wj + 4, 3.5, { l: '#f3d9a8', r: '#d4b47f', t: '#f9e8c4' });
    s += at(p(18, 13, h + 3.5), `<ellipse cx="1" cy="2" rx="14" ry="5" fill="#000" opacity=".2"/><path d="M-11 -2h22l-3 6h-16z" fill="#2b2b2b"/><ellipse cy="-9" rx="13" ry="9" fill="#333"/><ellipse cy="-14" rx="12" ry="4.5" fill="#555"/><g fill="#fff6e8"><circle cx="-7" cy="-15" r="3.2"/><circle cx="7" cy="-15" r="3.2"/><circle cx="0" cy="-16" r="3.6"/><circle cx="-3.5" cy="-19.5" r="3.2"/><circle cx="3.5" cy="-19.5" r="3.2"/><circle cx="0" cy="-23" r="3"/></g><g fill="#ffe9a8"><circle cx="-5" cy="-17.5" r="1.4"/><circle cx="4" cy="-17.5" r="1.4"/><circle cx="0" cy="-21" r="1.3"/></g><path d="M-13 -14q0-9 13-9t13 9" stroke="#8d98a6" stroke-width="1.5" fill="none"/>`);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  loom: (p) => {
    const wi = 42, wj = 28, h = 28;
    let s = shop(p, wi, wj, h, 12, { l: '#b98b5c', r: '#8a6138', t: '#cda075' }, { far: '#4f8f8f', near: '#336666', ridge: '#7ab3b3' }, ['#7a5230', '#5e3a16']);
    s += pg(rightQuad(p, 8, 32, 6, 20), '#f3e6c8') + pg(rightQuad(p, 8, 32, 6, 20), 'none', 'stroke="#5e3a16" stroke-width="2" stroke-linejoin="round"');
    for (let k = 0; k < 7; k++) s += ln(p(11 + k * 3, 0, 8), p(11 + k * 3, 0, 18), ['#f26b8a', '#4fb0e8', '#ffd54a'][k % 3], 1.5);
    s += ln(p(9, 0, 12), p(31, 0, 12), '#5e3a16', 1.2) + doorL(p, 8, 18, 20, '#5e3a16');
    s += sign(p(0, 23, 25), 6.5, '#fff', '#336666', EMB.yarn);
    s += at(p(44, 4), `<ellipse rx="5" ry="2.4" fill="#000" opacity=".15"/><circle cy="-4" r="4.5" fill="#4fb0e8"/><path d="M-4 -5q4-2 8 1M-4 -2q4-2 8 1" stroke="#2f8fc9" stroke-width="1" fill="none"/>`);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  sewing: (p) => {
    const wi = 42, wj = 30, h = 30;
    let s = shop(p, wi, wj, h, 12, { l: '#c9b3e6', r: '#9d82c2', t: '#dccbf0' }, { far: '#7a4fb0', near: '#553478', ridge: '#a07fd0' });
    s += windowR(p, 8, 26, 6, 18, '#553478') + awningR(p, 6, 28, 24, '#7a4fb0', '#fff', '#553478');
    s += doorL(p, 9, 19, 20, '#553478') + sign(p(0, 24, 26), 6.5, '#fff', '#553478', EMB.shirt);
    s += at(p(34, 0, 22), `<path d="M0 0l-3 -12" stroke="#8d98a6" stroke-width="1.5" stroke-linecap="round"/><circle cx="-3" cy="-12" r="1.3" fill="#8d98a6"/><path d="M-3 -12q6 2 9 8" stroke="#e8413c" stroke-width="1" fill="none"/>`);
    return s + baseTrim(p, wi, wj, '#dccbf0');
  },
  cakeoven: (p) => {
    const wi = 42, wj = 30, h = 30;
    let s = shop(p, wi, wj, h, 12, { l: '#f8b8d0', r: '#d98ba8', t: '#fbd0e0' }, { far: '#ffffff', near: '#dcd3dd', ridge: '#fff' });
    s += chimney(p, 30, 20, h + 4, 14, { l: '#c0665a', r: '#8e4538', t: '#5a2a24' });
    s += windowR(p, 8, 24, 6, 18, '#b2527a') + awningR(p, 6, 26, 24, '#f26b8a', '#fff', '#b2527a');
    s += at(p(16, 0, 13), `<g transform="scale(.8)">${EMB.cake}</g>`);
    s += doorL(p, 9, 21, 22, '#b2527a') + sign(p(0, 24, 27), 7, '#fff', '#b2527a', EMB.cake);
    s += at(p(0, 15, 29), `<path d="M0 3L-4 -1a2.3 2.3 0 0 1 4 -2.5a2.3 2.3 0 0 1 4 2.5z" fill="#fff"/>`);
    return s + baseTrim(p, wi, wj, '#fbd0e0');
  },
  smelter: (p) => {
    const wi = 36, wj = 28, h = 30;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, h, { l: '#8f9199', r: '#5f6168', t: '#a5a7ae' });
    for (let k = 0; k < 14; k++) {
      s += ell(p(0, 3 + rnd(k, 21) * (wj - 6), 3 + rnd(k, 22) * (h - 6)), 3.5, 2.2, k % 2 ? '#9fa1a8' : '#7f8189', 'opacity=".8"');
      s += ell(p(3 + rnd(k, 23) * (wi - 6), 0, 3 + rnd(k, 24) * (h - 6)), 3.5, 2.2, k % 2 ? '#6b6d75' : '#54565d', 'opacity=".8"');
    }
    s += isoBox(p, -1, -1, h, wi + 2, wj + 2, 3, { l: '#6b6d75', r: '#45474e', t: '#7c7e86' });
    s += isoBox(p, 22, 16, h + 3, 9, 8, 22, { l: '#5a5a62', r: '#3c3c44', t: '#70707a' }) + ln(p(22, 24, h + 20), p(22, 16, h + 20), '#8a8a92', 1.5) + ln(p(22, 16, h + 20), p(31, 16, h + 20), '#2b2b30', 1.5);
    s += smoke(p(26.5, 20, h + 25), 0.8);
    s += circ(p(18, 0, 6), 11, '#ff8a2b', 'opacity=".25"');
    s += at(p(18, 0, 0), `<path d="M-8 0v-8a8 7 0 0 1 16 0v8z" fill="#2a1a12"/><path d="M-5.5 0v-6a5.5 4.5 0 0 1 11 0v6z" fill="#ff7a1f"/><path d="M-3 0v-3.5a3 2.5 0 0 1 6 0v3.5z" fill="#ffd166"/><path d="M-8 0h16" stroke="#3c3c44" stroke-width="2"/>`);
    s += isoBox(p, 30, -8, 0, 9, 5, 3, { l: '#f3d77c', r: '#c9a23a', t: '#ffe9a8' }) + isoBox(p, 31, -7, 3, 7, 4, 3, { l: '#f3d77c', r: '#c9a23a', t: '#ffe9a8' });
    s += at(p(-4, 6, 0), `<path d="M-5 0h10v-2h-3l1-3h3l1-2h-9l1 2h-2z" fill="#3c3c44"/>`);
    return s + baseTrim(p, wi, wj, '#a5a7ae');
  },
  juicepress: (p) => {
    const wi = 40, wj = 28, H = 26;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, 3, WOOD_DARK);
    for (let i = 4; i < wi; i += 4) s += ln(p(i, wj, 3), p(i, 0, 3), '#7d4a22', 0.8, 'opacity=".5"');
    // Barrel under the press, the press frame, crates of fruit.
    s += at(p(20, 11, 3), `<ellipse cx="1" cy="1" rx="9" ry="4" fill="#000" opacity=".2"/><path d="M-8 0v-14a8 3 0 0 1 16 0v14a8 3 0 0 1-16 0z" fill="#a8743c"/><path d="M-8 -14a8 3 0 0 1 16 0" fill="#c98a52"/><path d="M-8 -11a8 3 0 0 0 16 0M-8 -3a8 3 0 0 0 16 0" stroke="#5e3a16" stroke-width="1.5" fill="none"/><path d="M-4 -12v12M2 -12v12" stroke="#8a5a2b" stroke-width="1" opacity=".6"/>`);
    s += ln(p(12, 11, 3), p(12, 11, 24), '#6b3a1a', 4) + ln(p(28, 11, 3), p(28, 11, 24), '#6b3a1a', 4) + ln(p(10, 11, 23), p(30, 11, 23), '#8a5a2b', 4);
    s += ln(p(20, 11, 17), p(20, 11, 30), '#8d98a6', 2.5) + ln(p(16, 11, 29), p(24, 11, 29), '#5f6a78', 2.5) + ln(p(20, 11, 17), p(20, 11, 20), '#8d98a6', 6);
    for (const [i, j] of [[-2, 16], [-2, 2], [34, -4]]) {
      s += isoBox(p, i, j, 0, 9, 9, 5, WOOD) + ln(p(i, j + 9, 2.5), p(i, j, 2.5), '#8a5a2b', 0.8) + ln(p(i, j, 2.5), p(i + 9, j, 2.5), '#5e3a16', 0.8);
      for (let k = 0; k < 3; k++) s += circ(p(i + 2 + k * 2.5, j + 3 + (k % 2) * 3, 6), 2.2, j > 10 ? '#f7902b' : '#e8413c');
    }
    for (const [i, j] of [[1, 1], [wi - 1, 1], [1, wj - 1], [wi - 1, wj - 1]]) s += ln(p(i, j, 3), p(i, j, H), '#7a4a22', 3.5);
    s += isoRoof(p, wi, wj, H, 12, 4, { ...WOOD_ROOF, gable: '#d9a060' });
    s += sign(p(0, 14, H + 4), 6.5, '#fff', '#5e3a16', EMB.fruit);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  lureworkbench: (p) => {
    const wi = 36, wj = 26, h = 24;
    let s = shop(p, wi, wj, h, 11, { l: '#86aec2', r: '#5b8498', t: '#9dc2d4' }, { far: '#8a6a4c', near: '#5e4631', ridge: '#a8875f' }, ['#5b8498', '#3f6477']);
    s += doorR(p, 20, 30, 18, '#3f6477') + at(p(0, 15, 14), `<circle r="5" fill="#fff"/><circle r="3.5" fill="#8fd3ff"/><path d="M-2 -1q2 -2 4 0" stroke="#fff" stroke-width="1" fill="none"/>`);
    s += at(p(10, 0, 18), `<circle r="4.5" fill="#e8413c"/><circle r="2.3" fill="#86aec2"/><path d="M-4.5 0h2M2.5 0h2M0 -4.5v2M0 2.5v2" stroke="#fff" stroke-width="1.5"/>`);
    s += sign(p(0, 22, 22), 6.5, '#fff', '#5e4631', EMB.hook);
    s += isoBox(p, -10, 2, 0, 8, 14, 7, WOOD_DARK) + circ(p(-6, 6, 7), 2, '#e8413c') + circ(p(-6, 11, 7), 2, '#ffd54a');
    s += ln(p(wi + 2, -3, 0), p(wi + 7, -3, 34), '#5e3a16', 2) + ln(p(wi + 7, -3, 34), p(wi + 9, -3, 14), '#f3f6fa', 0.8) + circ(p(wi + 9, -3, 14), 1.5, '#e8413c');
    return s + baseTrim(p, wi, wj, '#9dc2d4');
  },
  icecream: (p) => {
    const wi = 34, wj = 24, h = 26;
    let s = shop(p, wi, wj, h, 11, { l: '#bfeee0', r: '#8fd3c0', t: '#d9f6ee' }, { far: '#f6a5c0', near: '#e07c9d', ridge: '#fff' });
    s += ln(p(-3, wj / 2, h + 12), p(wi + 3, wj / 2, h + 12), '#fff', 2.5);
    s += windowR(p, 6, 24, 6, 17, '#c96b8a', 0, '#fff6fa') + awningR(p, 4, 26, 22, '#f26b8a', '#fff', '#c96b8a');
    s += isoBox(p, 5, -3, 5, 20, 3, 1.5, { l: '#fff', r: '#dcd3dd', t: '#fff' });
    s += at(p(15, 0, 12), `<g transform="scale(.7)">${EMB.cone}</g>`) + doorL(p, 7, 17, 19, '#3fa58a');
    s += at(p(wi, wj / 2, h + 14), `<g transform="scale(1.6)">${EMB.cone}</g>`);
    s += at(p(-6, 8, 0), `<path d="M-5 -14h10l-1 14h-8z" fill="#fff"/><path d="M-4 -14h8l-.8 14" fill="none" stroke="#f26b8a" stroke-width="1.2"/><path d="M-5 -14h10" stroke="#f26b8a" stroke-width="2"/>`);
    return s + baseTrim(p, wi, wj, '#d9f6ee');
  },
  netmaker: (p) => {
    const wi = 38, wj = 26, h = 24;
    let s = shop(p, wi, wj, h, 10, { l: '#b89164', r: '#87673f', t: '#cba57a' }, { far: '#8d98a6', near: '#5f6a78', ridge: '#c0cad6' }, ['#7a5230', '#5e3a16']);
    for (let k = 1; k < 8; k++) s += ln(p(-3 + k * 5.5, -3, h - 2), p(-3 + k * 5.5, wj / 2, h + 11), '#4f5a68', 0.8, 'opacity=".5"');
    s += doorL(p, 8, 18, 18, '#5e3a16');
    s += `<defs><pattern id="netp" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3L3 0L6 3L3 6z" fill="none" stroke="#f1e3c8" stroke-width=".9"/></pattern></defs>`;
    s += ln(p(6, 0, 21), p(34, 0, 21), '#5e3a16', 1.5);
    const a = p(6, 0, 21), b = p(34, 0, 21), c1 = p(34, 0, 4), c2 = p(6, 0, 4);
    s += `<path d="M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}L${n1(c1[0])} ${n1(c1[1])}Q${n1((c1[0] + c2[0]) / 2)} ${n1((c1[1] + c2[1]) / 2 + 8)} ${n1(c2[0])} ${n1(c2[1])}z" fill="#3b2d20" opacity=".35"/>`;
    s += `<path d="M${n1(a[0])} ${n1(a[1])}L${n1(b[0])} ${n1(b[1])}L${n1(c1[0])} ${n1(c1[1])}Q${n1((c1[0] + c2[0]) / 2)} ${n1((c1[1] + c2[1]) / 2 + 8)} ${n1(c2[0])} ${n1(c2[1])}z" fill="url(#netp)"/>`;
    for (let k = 0; k < 5; k++) s += circ(p(8 + k * 6.5, 0, 21), 2, '#f7902b', 'stroke="#b8762f" stroke-width=".8"');
    s += sign(p(0, 22, 22), 6.5, '#fff', '#5e3a16', EMB.net);
    s += at(p(wi + 4, 6, 0), `<ellipse rx="6" ry="3" fill="#d9b27a" stroke="#a8804a" stroke-width="1.2"/><ellipse rx="3" ry="1.4" fill="#a8804a"/>`);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  kebab: (p) => {
    const wi = 38, wj = 26, h = 26;
    let s = shop(p, wi, wj, h, 10, { l: '#f5e6c8', r: '#d6c29c', t: '#faefdb' }, { far: '#c0392b', near: '#8e2a20', ridge: '#e07060' });
    s += pg(rightQuad(p, 7, 31, 6, 20), '#3a1a0a') + pg(rightQuad(p, 7, 31, 6, 20), 'none', 'stroke="#8e2a20" stroke-width="2" stroke-linejoin="round"');
    s += at(p(19, 0, 6), `<path d="M0 0v-14" stroke="#8d98a6" stroke-width="1.5"/><path d="M-5 -12h10l-2 11h-6z" fill="#b5602f"/><path d="M-4.5 -9h9M-4 -6h8M-3.5 -3h7" stroke="#7a3d16" stroke-width="1"/><path d="M-3 0q1-3 3-2q0-2 2-1q-1 2 1 3z" fill="#ff9f2b"/>`);
    s += isoBox(p, 6, -3, 5, 26, 3, 1.5, { l: '#8e2a20', r: '#6b1f18', t: '#c0392b' }) + awningR(p, 5, 33, 24, '#e8413c', '#ffd54a', '#8e2a20');
    s += doorL(p, 8, 18, 19, '#8e2a20') + sign(p(0, 22, 23), 6.5, '#fff', '#8e2a20', EMB.kebab);
    s += at(p(40, 2, 0), `<path d="M-4 0l1-9h6l1 9z" fill="#2b2b2b"/><rect x="-3" y="-8" width="6" height="5" fill="#fff"/><path d="M-2 -6h4M-2 -4.5h3" stroke="#e8413c" stroke-width="1"/>`);
    return s + baseTrim(p, wi, wj, '#faefdb');
  },
  jammaker: (p) => {
    const wi = 40, wj = 28, h = 28;
    let s = shop(p, wi, wj, h, 14, { l: '#f3e2c7', r: '#d4bb97', t: '#f8ecd8' }, { far: '#c7584a', near: '#93392f', ridge: '#e07a6b' });
    for (const j of [7, 14, 21]) s += ln(p(0, j, 0), p(0, j, h), '#8a5a2b', 1.5, 'opacity=".7"');
    for (const i of [10, 20, 30]) s += ln(p(i, 0, 0), p(i, 0, h), '#6b4a2a', 1.5, 'opacity=".7"');
    s += ln(p(0, wj, 15), p(0, 0, 15), '#8a5a2b', 1.5, 'opacity=".7"') + ln(p(0, 0, 15), p(wi, 0, 15), '#6b4a2a', 1.5, 'opacity=".7"');
    s += chimney(p, 28, 18, h + 5, 12, { l: '#c0665a', r: '#8e4538', t: '#5a2a24' });
    s += windowR(p, 22, 32, 8, 16, '#93392f') + isoBox(p, 21, -3, 6, 12, 3, 2.5, WOOD_DARK) + circ(p(24, -1.5, 9), 1.8, '#f26b8a') + circ(p(27, -1.5, 9.5), 1.8, '#ffd54a') + circ(p(30, -1.5, 9), 1.8, '#f26b8a');
    s += doorR(p, 4, 14, 19, '#6b3f17') + sign(p(0, 23, 24), 6.5, '#fff', '#93392f', EMB.jam);
    s += at(p(-4, 6, 0), `<circle cy="-4" r="6" fill="#4e9a3a"/><circle cx="-3" cy="-5" r="1.3" fill="#e8413c"/><circle cx="2" cy="-7" r="1.3" fill="#e8413c"/><circle cx="2" cy="-2" r="1.3" fill="#e8413c"/>`);
    return s + baseTrim(p, wi, wj, '#f8ecd8');
  },
  jeweler: (p) => {
    const wi = 40, wj = 28, h = 32;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, h, { l: '#3d4b70', r: '#26304d', t: '#4a5a85' });
    s += ln(p(0, wj, 2), p(0, 0, 2), '#e7c25a', 1.5) + ln(p(0, 0, 2), p(wi, 0, 2), '#b8923a', 1.5);
    s += isoBox(p, -2, -2, h, wi + 4, wj + 4, 3, { l: '#e7c25a', r: '#b8923a', t: '#f3d77c' });
    s += pg(rightQuad(p, 10, 30, 6, 20), '#9fd7ff') + pg(rightQuad(p, 10, 30, 6, 20), 'none', 'stroke="#e7c25a" stroke-width="2" stroke-linejoin="round"') + ell(p(20, 0, 20), 10, 5, '#9fd7ff', 'stroke="#e7c25a" stroke-width="2"');
    s += at(p(20, 0, 12), `<polygon points="0,-7 5,-2 0,6 -5,-2" fill="#8fd3ff" stroke="#fff" stroke-width="1"/><path d="M-5 -2h10" stroke="#fff" stroke-width="1"/><path d="M-6 -9l1.5 1.5M6 -9l-1.5 1.5" stroke="#fff" stroke-width="1.2"/>`);
    s += doorL(p, 9, 19, 22, '#1f2842') + pg(leftQuad(p, 9, 19, 0, 22), 'none', 'stroke="#e7c25a" stroke-width="1.5"');
    s += sign(p(0, 24, 27), 7, '#26304d', '#e7c25a', EMB.ring);
    s += ln(p(0, 5, 0), p(0, 5, 24), '#26304d', 2) + at(p(0, 5, 24), `<path d="M-3 0h6l-1 -6h-4z" fill="#ffd166" stroke="#b8923a" stroke-width="1"/>`);
    return s + baseTrim(p, wi, wj, '#f3d77c');
  },
  honeyextractor: (p) => {
    const wi = 40, wj = 30;
    let s = isoShadow(p, wi, wj, 7) + isoBox(p, 0, 0, 0, wi, wj, 4, WOOD_DARK);
    for (let i = 5; i < wi; i += 5) s += ln(p(i, wj, 4), p(i, 0, 4), '#7d4a22', 0.8, 'opacity=".5"');
    let hive = '';
    for (let k = 5; k >= 0; k--) hive += `<ellipse cy="${-k * 6}" rx="${17.5 - k * 2.2}" ry="7" fill="${k % 2 ? '#f0b63c' : '#f8cc5a'}" stroke="#c98d1e" stroke-width="1"/>`;
    hive += `<circle cy="-34" r="3" fill="#c98d1e"/><path d="M-10 -24q-4 2-10 1" stroke="#c98d1e" stroke-width="1" fill="none"/>`;
    hive += `<path d="M-4.5 2v-7a4.5 4.5 0 0 1 9 0v7z" fill="#6b3f12"/><circle cx="8" cy="-14" r="3" fill="#fff"/><path d="M5 -14h6M8 -17v6" stroke="#c98d1e" stroke-width="1"/>`;
    hive += `<g fill="#f7c948" stroke="#2b2b2b" stroke-width=".7"><ellipse cx="-20" cy="-20" rx="2.6" ry="1.8"/><ellipse cx="22" cy="-30" rx="2.6" ry="1.8"/><ellipse cx="-14" cy="-40" rx="2.6" ry="1.8"/></g><g fill="#fff" opacity=".8"><ellipse cx="-20.5" cy="-22.2" rx="1.6" ry="1"/><ellipse cx="21.5" cy="-32.2" rx="1.6" ry="1"/><ellipse cx="-14.5" cy="-42.2" rx="1.6" ry="1"/></g>`;
    s += at(p(21, 16, 4), hive);
    s += at(p(36, 3, 4), `<path d="M-4 0v-8h8v8z" fill="#f7902b"/><ellipse cy="-8" rx="4" ry="1.8" fill="#ffd166"/><path d="M-4 -3h8" stroke="#c98d1e" stroke-width="1"/>`);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  coffeekiosk: (p) => {
    const wi = 40, wj = 26;
    let s = isoShadow(p, wi, wj, 7);
    for (const i of [10, 32]) s += at(p(i, 0, 6), `<circle r="6.5" fill="#3b2d20"/><circle r="4.5" fill="#d9a060"/><path d="M-4.5 0h9M0 -4.5v9" stroke="#3b2d20" stroke-width="1.2"/><circle r="1.5" fill="#3b2d20"/>`);
    s += isoBox(p, 6, 2, 6, 30, 20, 18, { l: '#7a5240', r: '#55382b', t: '#8f6350' }) + planks((i, j, z = 0) => p(i + 6, j + 2, z + 6), 30, 20, 18, '#55382b', '#3b2d20', 5, 5);
    s += isoBox(p, 4, 0, 24, 34, 24, 2.5, { l: '#f3e6c8', r: '#d6c29c', t: '#faefdb' });
    s += ln(p(6, 2, 6), p(0, 2, 10), '#5f6a78', 2.5) + ln(p(36, 2, 6), p(42, 2, 10), '#5f6a78', 2.5);
    s += isoBox(p, 24, 10, 26.5, 8, 8, 9, { l: '#c9d2dd', r: '#8d98a6', t: '#e6ebf1' }) + circ(p(28, 10, 32), 1.5, '#e8413c');
    s += at(p(12, 4, 26.5), `<path d="M-3 0h6v-4h-6z" fill="#fff"/><path d="M-1 -5q1-2 0-3" stroke="#fff" stroke-width="1" fill="none"/>`);
    s += sign(p(6, 12, 15), 6.5, '#c0392b', '#f3e6c8', EMB.cup);
    s += pg(rightQuad(p, 12, 30, 10, 20, 2), '#2b2b2b') + at(p(21, 2, 15), `<path d="M-6 -2h12M-5 1h8" stroke="#fff" stroke-width="1" opacity=".8"/>`);
    s += ln(p(21, 12, 26), p(21, 12, 46), '#5f6a78', 2);
    const c = p(21, 12, 46);
    let um = '';
    for (let k = 0; k < 8; k++) {
      const a1 = (k / 8) * Math.PI * 2, a2 = ((k + 1) / 8) * Math.PI * 2;
      um += `<path d="M0 0L${n1(Math.cos(a1) * 26)} ${n1(Math.sin(a1) * 11)}A26 11 0 0 1 ${n1(Math.cos(a2) * 26)} ${n1(Math.sin(a2) * 11)}z" fill="${k % 2 ? '#fff' : '#c0392b'}"/>`;
    }
    s += at(c, `<ellipse cy="1" rx="26" ry="11" fill="#8e2a20"/>${um}<circle r="2" fill="#5f6a78"/>`);
    return s + baseTrim(p, wi, wj, '#f3d9a8');
  },
  soupkitchen: (p) => {
    const wi = 40, wj = 28, h = 28;
    let s = shop(p, wi, wj, h, 12, { l: '#f0b46a', r: '#c98a42', t: '#f6c88b' }, { far: '#6a9a4a', near: '#44682d', ridge: '#8fbb6b' });
    s += chimney(p, 28, 18, h + 4, 12, { l: '#9ca3ad', r: '#6f7680', t: '#b4bac3' });
    s += pg(rightQuad(p, 8, 30, 7, 19), '#3a1a0a') + pg(rightQuad(p, 8, 30, 7, 19), 'none', 'stroke="#44682d" stroke-width="2" stroke-linejoin="round"') + isoBox(p, 7, -3, 6, 24, 3, 1.5, WOOD_DARK);
    s += at(p(19, 0, 10), `<g transform="scale(1.1)">${EMB.pot}</g>`) + smoke(p(19, -2, 18), 0.5);
    s += doorL(p, 8, 18, 20, '#6b3f17') + sign(p(0, 23, 25), 6.5, '#fff', '#44682d', EMB.pot);
    s += at(p(-4, 8, 0), `<path d="M-5 0l1-7h8l1 7z" fill="#d9a060"/><path d="M-3 -7l1-4h4l1 4z" fill="#f7902b"/><circle cx="-1.5" cy="-9" r="1.6" fill="#f7902b"/><circle cx="2" cy="-9.5" r="1.6" fill="#5fae4a"/>`);
    return s + baseTrim(p, wi, wj, '#f6c88b');
  },
  candlemaker: (p) => {
    const wi = 40, wj = 28, h = 30;
    let s = shop(p, wi, wj, h, 12, { l: '#9a6a8d', r: '#6f4663', t: '#ad7ea0' }, { far: '#4a3a4a', near: '#2f2430', ridge: '#6b566b' });
    s += circ(p(19, 0, 13), 12, '#ffd98a', 'opacity=".3"') + windowR(p, 10, 28, 7, 19, '#2f2430', 0, '#ffd98a');
    for (const i of [14, 19, 24]) s += at(p(i, 0, 10), `<g transform="scale(.55)">${EMB.candle}</g>`);
    s += doorL(p, 9, 19, 21, '#2f2430') + sign(p(0, 24, 27), 6.5, '#fff8e8', '#2f2430', EMB.candle);
    s += at(p(wi, wj / 2, h + 13), `<g transform="scale(1.3)">${EMB.candle}</g>`);
    return s + baseTrim(p, wi, wj, '#ad7ea0');
  },
  flowershop: (p) => {
    const wi = 42, wj = 28, h = 26;
    let s = isoShadow(p, wi, wj, 7);
    for (let k = 0; k < 10; k++) s += circ(p(4 + rnd(k, 31) * (wi - 8), 4 + rnd(k, 32) * (wj - 8), 5 + rnd(k, 33) * 10), 3, ['#f26b8a', '#ffd54a', '#e8413c', '#b9a0d8'][k % 4], 'opacity=".55"');
    s += isoBox(p, 0, 0, 0, wi, wj, h, { l: '#cdeefa', r: '#9fd3ea', t: '#e2f6fd' });
    for (let k = 0; k < 10; k++) s += circ(p(k < 5 ? 0 : 4 + (k - 5) * 8, k < 5 ? 4 + k * 5 : 0, 6 + rnd(k, 34) * 10), 2.8, ['#f26b8a', '#ffd54a', '#e8413c', '#b9a0d8'][k % 4], 'opacity=".75"') + circ(p(k < 5 ? 0 : 4 + (k - 5) * 8, k < 5 ? 4 + k * 5 : 0, 1 + rnd(k, 34) * 10), 1.6, '#4e9a3a', 'opacity=".7"');
    for (const j of [7, 14, 21]) s += ln(p(0, j, 0), p(0, j, h), '#fff', 1.5, 'opacity=".9"');
    for (const i of [10.5, 21, 31.5]) s += ln(p(i, 0, 0), p(i, 0, h), '#e6f4fa', 1.5, 'opacity=".9"');
    s += ln(p(0, wj, 13), p(0, 0, 13), '#fff', 1.5) + ln(p(0, 0, 13), p(wi, 0, 13), '#e6f4fa', 1.5);
    s += isoRoof(p, wi, wj, h, 12, 3, { far: '#b7e2f3', near: '#8ec6de', ridge: '#fff', gable: '#cdeefa' });
    for (let k = 1; k < 6; k++) s += ln(p(-3 + k * 8, -3, h - 2), p(-3 + k * 8, wj / 2, h + 11), '#fff', 1.2, 'opacity=".8"');
    s += doorL(p, 9, 19, 20, '#5fae4a') + isoBox(p, 2, -5, 0, 38, 5, 5, WOOD_DARK);
    for (let k = 0; k < 7; k++) s += circ(p(5 + k * 5.2, -2.5, 7), 2.4, ['#f26b8a', '#ffd54a', '#e8413c'][k % 3]) + circ(p(5 + k * 5.2, -2.5, 7), 1, '#fff');
    s += sign(p(0, 23, 26), 6.5, '#fff', '#5fae4a', EMB.flower);
    return s + baseTrim(p, wi, wj, '#fff');
  },
};

// --- The farmhouse (4×4 cells → 216×194, isoAt(108, 190)) and the mine (2×2 → 120×140). ---

const farmhouse = (p: Proj): string => {
  const wi = 60, wj = 46, i0 = 24, j0 = 40, h = 40, rh = 20, o = 4, porch = 14;
  const q: Proj = (i, j, z = 0) => p(i + i0, j + j0, z);
  const wall: FaceColors = { l: '#f7e9c9', r: '#d9c29a', t: '#fbf1dc' };
  let s = isoShadow((i, j, z = 0) => q(i, j - porch, z), wi, wj + porch, 8);
  // Garden path from the footprint's front corner to the porch steps.
  s += pg([p(i0 + 22, j0 - porch - 4), p(i0 + 34, j0 - porch - 4), p(14, 2), p(2, 2)], '#e5cf9b') + pg([p(i0 + 24, j0 - porch - 4), p(i0 + 32, j0 - porch - 4), p(12, 2), p(4, 2)], '#f0dfb3', 'opacity=".6"');
  s += isoBox(q, 0, 0, 0, wi, wj, h, wall);
  s += pg(leftQuad(q, 0, wj, 19, 22), '#c7584a') + pg(rightQuad(q, 0, wi, 19, 22), '#93392f');
  // Windows: two storeys on both faces, green shutters and flower boxes on the lit face.
  for (const j of [8, 28]) for (const z of [6, 26]) {
    s += windowL(q, j, j + 10, z, z + 10, '#8a5a2b');
    s += pg(leftQuad(q, j - 3, j, z, z + 10), '#5fae4a') + pg(leftQuad(q, j + 10, j + 13, z, z + 10), '#5fae4a');
    s += isoBox(q, -3, j - 1, z - 3, 3, 12, 3, WOOD_DARK);
    for (let k = 0; k < 4; k++) s += circ(q(-1.5, j + 1 + k * 3.2, z + 1), 2, k % 2 ? '#f26b8a' : '#ffd54a');
  }
  for (const i of [8, 44]) s += windowR(q, i, i + 10, 26, 36, '#8a5a2b');
  s += windowR(q, 44, 54, 6, 16, '#8a5a2b') + doorR(q, 22, 34, 22, '#7a3e1f') + pg(rightQuad(q, 24, 32, 13, 19), '#ffe9a8');
  s += isoRoof(q, wi, wj, h, rh, o, { far: '#b7564a', near: '#8a3c33', ridge: '#d9796b', gable: wall.l });
  s += circ(q(0, wj / 2, h + 9), 4.5, '#8fd3ff', 'stroke="#8a5a2b" stroke-width="2"');
  // Porch: deck, posts, railing and its own little roof.
  s += isoBox(q, 0, -porch, 0, wi, porch, 3, { l: '#c48a52', r: '#91602f', t: '#d9a468' });
  for (let i = 4; i < wi; i += 4) s += ln(q(i, 0, 3), q(i, -porch, 3), '#91602f', 0.8, 'opacity=".5"');
  s += isoBox(q, 22, -porch - 4, 0, 12, 4, 1.5, { l: '#c48a52', r: '#91602f', t: '#d9a468' });
  for (const [a, b] of [[2, 18], [38, wi - 2]]) {
    s += ln(q(a, -porch + 1, 3), q(b, -porch + 1, 3), '#f7e9c9', 1) + ln(q(a, -porch + 1, 9), q(b, -porch + 1, 9), '#f7e9c9', 2.5);
    for (let i = a + 2; i < b; i += 4) s += ln(q(i, -porch + 1, 3), q(i, -porch + 1, 9), '#f7e9c9', 1.2);
  }
  for (const i of [2, 20, 38, wi - 2]) s += ln(q(i, -porch + 1, 3), q(i, -porch + 1, 24), '#f7e9c9', 3);
  s += pg([q(-2, 0, 27), q(wi + 2, 0, 27), q(wi + 2, -porch - 3, 21), q(-2, -porch - 3, 21)], '#8a3c33') + ln(q(-2, -porch - 3, 21), q(wi + 2, -porch - 3, 21), '#d9796b', 1.5, 'opacity=".7"');
  s += chimney(q, 44, 30, h + 8, 16, { l: '#c0665a', r: '#8e4538', t: '#5a2a24' });
  // Mailbox on the lawn and a few flowers.
  s += ln(p(10, 22, 0), p(10, 22, 14), '#6b3a1a', 3) + isoBox(p, 7, 20, 14, 8, 5, 5, { l: '#4f8fd8', r: '#2f68a8', t: '#6fa6e6' }) + ln(p(7, 20, 16), p(7, 20, 24), '#e8413c', 2) + circ(p(7, 20, 24), 1.5, '#e8413c');
  for (const [i, j] of [[18, 8], [8, 36], [30, 10], [6, 50], [90, 20], [96, 8]]) s += daisy(p(i, j), [0, 2, 4].includes(i % 6) ? '#fff' : '#f8b8d0');
  for (const [i, j] of [[40, 6], [14, 60], [92, 32], [98, 16]]) s += tuft(p(i, j));
  return s + baseTrim(q, wi, wj + porch, '#f3d9a8');
};

const mine = (p: Proj): string => {
  const N = 52;
  let s = isoShadow(p, N, N, 4) + pg([p(2, 2), p(N - 2, 2), p(N - 2, N - 2), p(2, N - 2)], '#b08a5a');
  // A rounded rocky hill over the back of the footprint: lit left flank, shaded right flank.
  const bi = 42, bj = 40, j0 = 12;
  const q: Proj = (i, j, z = 0) => p(i, j + j0, z);
  const L = q(0, bj), R = q(bi, 0), F = q(0, 0), P = q(bi / 2, bj / 2, 36), T = q(bi / 2 + 4, bj / 2 + 8, 30);
  const d = (c: Pt): string => `${n1(c[0])} ${n1(c[1])}`;
  s += `<path d="M${d(F)}L${d(R)}Q${n1(R[0] + 2)} ${n1(P[1] + 14)} ${d(P)}Q${n1(F[0] + 16)} ${n1((P[1] + F[1]) / 2 + 4)} ${d(F)}z" fill="#75746d"/>`;
  s += `<path d="M${d(F)}L${d(L)}Q${n1(L[0] - 2)} ${n1(P[1] + 14)} ${d(P)}Q${n1(F[0] - 14)} ${n1((P[1] + F[1]) / 2 + 4)} ${d(F)}z" fill="#a3a29b"/>`;
  s += `<path d="M${d(L)}Q${n1(L[0] - 2)} ${n1(P[1] + 14)} ${d(P)}Q${n1(R[0] + 2)} ${n1(P[1] + 14)} ${d(R)}" stroke="#5f5e58" stroke-width="1" fill="none" opacity=".6"/>`;
  s += `<path d="M${n1(L[0] + 10)} ${n1(L[1] - 4)}Q${n1(P[0] - 14)} ${n1(P[1] + 2)} ${n1(P[0] - 2)} ${n1(P[1] + 6)}Q${n1(P[0] - 8)} ${n1(P[1] + 20)} ${n1(L[0] + 10)} ${n1(L[1] - 4)}z" fill="#bcbbb3" opacity=".7"/>`;
  s += `<path d="M${d(T)}q6 -8 14 -2q-4 6-14 2z" fill="#8c8b84"/>`;
  for (const [i, j, z, r] of [[6, 30, 6, 4.5], [30, 8, 12, 4], [34, 30, 10, 5], [10, 12, 10, 3.5], [20, 36, 18, 4.5]]) s += rock(q(i, j, z), r, r * 0.65);
  for (const [i, j, z] of [[14, 30, 20], [30, 32, 24], [8, 20, 14], [36, 16, 18], [22, 22, 32]]) s += tuft(q(i, j, z), '#7a9a3a');
  // Timber-framed entrance on the right face, with a lantern on the lintel.
  s += pg([q(10, 0, 0), q(32, 0, 0), q(32, 0, 20), q(21, 0, 24), q(10, 0, 20)], '#8c8b84') + pg([q(10, 0, 0), q(10, 0, 20), q(21, 0, 24), q(21, 0, 0)], '#a3a29b');
  s += pg(rightQuad(q, 15, 27, 0, 16), '#1a1410') + pg(rightQuad(q, 17, 25, 0, 10), '#0c0a08');
  s += pg(rightQuad(q, 12, 15, 0, 18), '#8a5a2b') + pg(rightQuad(q, 27, 30, 0, 18), '#8a5a2b') + pg(rightQuad(q, 11, 31, 16, 19.5), '#a8743c');
  s += ln(q(12, 0, 18), q(30, 0, 18), '#c98a52', 1, 'opacity=".6"') + ln(q(30, 0, 16), q(30, 0, 0), '#5e3a16', 1);
  s += ln(q(21, 0, 16), q(21, 0, 13), '#2b2b2b', 1) + at(q(21, 0, 13), `<circle r="5" fill="#ffd166" opacity=".35"/><path d="M-2.5 0v-4h5v4z" fill="#ffd166" stroke="#5f6a78" stroke-width="1"/><rect x="-3" y="-5" width="6" height="1.5" fill="#5f6a78"/>`);
  // Rails from the mouth to the front edge, a cart with ore on them.
  for (const j of [j0, 8, 4, 0]) s += ln(p(17, j, 0), p(25, j, 0), '#6b3a1a', 2);
  for (const i of [18.5, 23.5]) s += ln(p(i, j0 + 1, 0.5), p(i, -2, 0.5), '#8d98a6', 1.5);
  s += isoBox(p, 17, 2, 2, 8, 7, 6, { l: '#6b4a2a', r: '#46301a', t: '#8a6a4a' }) + circ(p(19, 2, 1.5), 1.8, '#2b2b2b') + circ(p(24, 2, 1.5), 1.8, '#2b2b2b');
  s += ell(p(21, 5.5, 8), 4.5, 2.5, '#7f8189') + circ(p(20, 5, 9), 1.8, '#9fa1a8') + circ(p(23, 6, 9.5), 1.5, '#ffd166') + circ(p(21, 7.5, 9), 1.3, '#c9d2dd');
  return s + baseTrim(p, N, N, '#d9c29a');
};

export const BUILDING_ART: Record<string, string> = Object.fromEntries(Object.entries(BUILDERS).map(([id, draw]) => [id, building(id, draw)]));
BUILDING_ART.house = building('house', farmhouse, 216, 194, 108, 190);
BUILDING_ART.mine = building('mine', mine, 120, 140, 60, 128);

// ---------------------------------------------------------------------------
// Visitors: three customers who stand on the lawn by the farmhouse (64×88, front view).

interface Visitor { skin: string; shirt: string; pants: string; shoes: string; hair: string; legs?: string; extra: string; behind?: string }
function visitor(v: Visitor): string {
  const skin = v.skin;
  let s = `<ellipse cx="32" cy="84" rx="15" ry="3.5" fill="#000" opacity=".15"/>` + (v.behind ?? '');
  // Legs and shoes, then the body, arms and the head.
  s += `<rect x="23" y="60" width="8" height="20" rx="3" fill="${v.legs ?? v.pants}"/><rect x="33" y="60" width="8" height="20" rx="3" fill="${v.legs ?? v.pants}"/>`;
  s += `<ellipse cx="26.5" cy="81" rx="5.5" ry="3" fill="${v.shoes}"/><ellipse cx="37.5" cy="81" rx="5.5" ry="3" fill="${v.shoes}"/>`;
  s += `<path d="M20 44q12-4 24 0l3 20q-15 3-30 0z" fill="${v.shirt}"/>`;
  s += `<path d="M21 46l-7 16" stroke="${v.shirt}" stroke-width="6" stroke-linecap="round"/><path d="M43 46l7 16" stroke="${v.shirt}" stroke-width="6" stroke-linecap="round"/>`;
  s += `<circle cx="13.5" cy="64" r="3.6" fill="${skin}"/><circle cx="50.5" cy="64" r="3.6" fill="${skin}"/>`;
  s += `<rect x="28" y="38" width="8" height="8" fill="${skin}"/>`;
  s += `<circle cx="32" cy="28" r="15" fill="${skin}"/>` + v.hair;
  s += `<g fill="#2b2b2b"><ellipse cx="26.5" cy="30" rx="1.8" ry="2.4"/><ellipse cx="37.5" cy="30" rx="1.8" ry="2.4"/></g><g fill="#fff"><circle cx="27.2" cy="29" r=".7"/><circle cx="38.2" cy="29" r=".7"/></g>`;
  s += `<path d="M28 36q4 3.5 8 0" stroke="#5a2d0c" stroke-width="1.6" fill="none" stroke-linecap="round"/><g fill="#ff8a8a" opacity=".5"><circle cx="22" cy="34" r="2.2"/><circle cx="42" cy="34" r="2.2"/></g>`;
  return svg(64, 88, s + v.extra);
}

export const VISITOR_ART: string[] = [
  // A girl with a basket: brown pigtails, pink top, yellow skirt.
  visitor({
    skin: '#f7d2b0', shirt: '#f26b8a', pants: '#ffd54a', shoes: '#c7352c', legs: '#f7d2b0',
    hair: `<path d="M17 28q0-17 15-17t15 17q-4-7-15-7t-15 7z" fill="#7a4a22"/><circle cx="15" cy="34" r="5.5" fill="#7a4a22"/><circle cx="49" cy="34" r="5.5" fill="#7a4a22"/><path d="M40 14l5-3-1 6z" fill="#e8413c"/>`,
    extra: `<path d="M16 58h32l-3 10h-26z" fill="#ffd54a"/><path d="M16 58h32" stroke="#f26b8a" stroke-width="2"/><ellipse cx="9" cy="70" rx="8" ry="5" fill="#b98b5c"/><path d="M1 70q8 5 16 0v-4q-8 3-16 0z" fill="#8a6138"/><path d="M3 68q6-10 12 0" stroke="#8a6138" stroke-width="2" fill="none"/><circle cx="6" cy="66" r="2" fill="#e8413c"/><circle cx="11" cy="65" r="2" fill="#e8413c"/>`,
  }),
  // A boy in a cap: blue cap over orange hair, green shirt, jeans.
  visitor({
    skin: '#f3c8a0', shirt: '#5bbf5a', pants: '#3a6fb5', shoes: '#fff',
    hair: `<path d="M18 24q2-6 7-6l24 6q-2-10-14-12t-17 12z" fill="#e8762b"/><path d="M16 23a16 10 0 0 1 32 0z" fill="#3a7bd5"/><path d="M30 22h24q2 0 1 3l-26 1z" fill="#2f68a8"/><circle cx="32" cy="13" r="2" fill="#2f68a8"/>`,
    extra: `<path d="M24 80h6M34 80h6" stroke="#3a7bd5" stroke-width="1.5"/><circle cx="32" cy="52" r="4" fill="#fff"/><path d="M30 52l2-3 2 3-2 3z" fill="#ffd54a"/>`,
  }),
  // An old man with a hat: grey hair and beard, glasses, blue cardigan, a cane.
  visitor({
    skin: '#f0cfae', shirt: '#4f8fd8', pants: '#6b4a2a', shoes: '#3b2d20',
    hair: `<path d="M17 30q-1-7 3-9 5-1 7 2M47 30q1-7-3-9-5-1-7 2" fill="#c9d2dd"/><path d="M22 36q10 12 20 0q-2 10-10 10t-10-10z" fill="#c9d2dd"/><path d="M28 36q4 3 8 0" stroke="#5a2d0c" stroke-width="1.4" fill="none"/><ellipse cx="32" cy="16" rx="18" ry="4" fill="#8a5a2b"/><path d="M20 16q0-10 12-10t12 10z" fill="#a8743c"/><path d="M20 15h24" stroke="#5e3a16" stroke-width="2.5"/><g fill="none" stroke="#2b2b2b" stroke-width="1.2"><circle cx="26.5" cy="30" r="3.6"/><circle cx="37.5" cy="30" r="3.6"/><path d="M30 30h4"/></g>`,
    extra: `<path d="M32 46v16" stroke="#2f68a8" stroke-width="1.2"/><circle cx="32" cy="50" r="1.2" fill="#fff"/><circle cx="32" cy="56" r="1.2" fill="#fff"/><path d="M52 64v18" stroke="#5e3a16" stroke-width="2.5" stroke-linecap="round"/><path d="M50 64a3 3 0 0 1 5 0" stroke="#5e3a16" stroke-width="2.5" fill="none"/>`,
  }),
];

// ---------------------------------------------------------------------------
// Every pen type and every machine type (bar the two drawn in art.ts) must have art.
for (const id of Object.keys(PENS)) if (!PEN_BUILDERS[id]) throw new Error(`art-pens: no pen art for "${id}"`);
for (const id of Object.keys(MACHINES)) if (id !== 'feedmill' && id !== 'bakery' && !BUILDING_ART[id]) throw new Error(`art-pens: no building art for "${id}"`);
