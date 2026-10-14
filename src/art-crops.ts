// Crops on a field (three growth stages) and the trees / bushes the player buys,
// drawn in the same bright, rounded farm-cartoon style as art.ts. Imports only
// from art-core (and the id lists from farm-data) so there is no import cycle.

import { svg, isoAt, isoShadow, n1, ln, SHADOW_FILTER, type Pt } from './art-core';
import { CROPS, TREES } from './farm-data';

// ---------------------------------------------------------------------------
// Small drawing helpers (plain SVG strings, round caps like the wheat / corn).

const circle = (x: number, y: number, r: number, fill: string, extra = ''): string =>
  `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
const ellipse = (x: number, y: number, rx: number, ry: number, fill: string, rot = 0, extra = ''): string =>
  `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${fill}"${rot ? ` transform="rotate(${rot} ${n1(x)} ${n1(y)})"` : ''}${extra ? ` ${extra}` : ''}/>`;
const stroke = (d: string, color: string, w: number, extra = ''): string =>
  `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ''}/>`;
const shape = (d: string, fill: string, extra = ''): string => `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
const outline = (c: string, w = 0.8): string => `stroke="${c}" stroke-width="${w}"`;

// ---------------------------------------------------------------------------
// Crops. Every stage is a 92×72 frame that the farm draws 26 px above the 92×60
// soil tile: nine plants on a 3×3 iso grid (same spots as cropArt in art.ts),
// nearer plants drawn last. Stage 0 is one shared sprout in the crop's tint.

const SPOTS: Pt[] = ((): Pt[] => {
  const s: Pt[] = [];
  for (const u of [0.22, 0.5, 0.78]) for (const v of [0.22, 0.5, 0.78]) s.push([46 + 46 * (u - v), 72 - 23 * (u + v)]);
  return s.sort((a, b) => a[1] - b[1]);
})();

/** Draws one plant whose base (where it meets the soil) is at (x, y). */
type Plant = (x: number, y: number) => string;
const sheet = (plant: Plant): string => svg(92, 72, SPOTS.map(([x, y]) => plant(n1(x), n1(y))).join(''));
const sprout = (tint: string): Plant => (x, y) =>
  stroke(`M${x},${y} v-7 M${x},${y - 4} l-4,-3 M${x},${y - 4} l4,-3`, tint, 2);

interface CropLook { tint: string; half: Plant; ripe: Plant }

// A small flower (five petals round a yellow heart), centred on (x, y).
const flower = (x: number, y: number, r: number, petal: string, heart = '#f3c54a'): string => {
  let s = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    s += circle(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.72, petal);
  }
  return s + circle(x, y, r * 0.55, heart);
};

const CROP_LOOKS: Record<string, CropLook> = {
  soybean: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x},${y} v-10`, '#4f9a3c', 2.4)
      + ellipse(x - 5, y - 7, 4.5, 2.8, '#5fbf4f', -30) + ellipse(x + 5, y - 7, 4.5, 2.8, '#5fbf4f', 30) + ellipse(x, y - 12, 3, 4, '#6fcf5c'),
    ripe: (x, y) => stroke(`M${x},${y} v-16`, '#3e8a35', 2.6)
      + ellipse(x - 6, y - 9, 4.8, 3, '#4aa63e', -30) + ellipse(x + 6, y - 9, 4.8, 3, '#4aa63e', 30)
      + ellipse(x - 5, y - 15, 4.2, 2.8, '#5fbf4f', -35) + ellipse(x + 5, y - 15, 4.2, 2.8, '#5fbf4f', 35) + ellipse(x, y - 19, 3, 4, '#6fcf5c')
      + ellipse(x - 3.2, y - 5, 1.7, 4, '#d6cf5a', -20, outline('#8a8a2a', 0.7)) + ellipse(x + 3.2, y - 4, 1.7, 4, '#d6cf5a', 20, outline('#8a8a2a', 0.7)) + ellipse(x, y - 11, 1.7, 4, '#d6cf5a', 0, outline('#8a8a2a', 0.7))
      + stroke(`M${x - 3.6},${y - 7.5} l.3,3 M${x + 2.8},${y - 6.5} l.3,3 M${x - .5},${y - 13.5} v3`, '#fff', 0.8, 'opacity=".6"'),
  },
  carrot: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x},${y} q-3,-6 -7,-9 M${x},${y} v-12 M${x},${y} q3,-6 7,-9`, '#4fb84a', 2.2)
      + stroke(`M${x - 3},${y - 5} l-3,-1 M${x + 3},${y - 5} l3,-1 M${x},${y - 8} l-2,-2 M${x},${y - 8} l2,-2`, '#8fd47a', 1.6),
    ripe: (x, y) => ellipse(x, y + 1, 6, 2.2, '#7a4a22', 0, 'opacity=".7"')
      + stroke(`M${x},${y - 2} q-4,-8 -9,-13 M${x},${y - 2} v-18 M${x},${y - 2} q4,-8 9,-13`, '#3e9a3c', 2.4)
      + stroke(`M${x - 4},${y - 8} l-4,-1 M${x + 4},${y - 8} l4,-1 M${x - 6},${y - 12} l-3,-2 M${x + 6},${y - 12} l3,-2 M${x},${y - 11} l-3,-2 M${x},${y - 14} l3,-2`, '#8fd47a', 1.6)
      + shape(`M${x - 4.5},${y + 1} q0,-5 4.5,-5 q4.5,0 4.5,5 z`, '#f58a1f', outline('#d2691e', 1))
      + stroke(`M${x - 2.5},${y - 2} h5 M${x - 1.5},${y - 0.5} h3`, '#d2691e', 1, 'opacity=".7"'),
  },
  indigo: {
    tint: '#6fb0c9',
    half: (x, y) => stroke(`M${x},${y} v-11`, '#4f7f8a', 2.2)
      + ellipse(x - 3.5, y - 4, 3, 1.8, '#5a86c9', -25) + ellipse(x + 3.5, y - 6, 3, 1.8, '#5a86c9', 25) + ellipse(x - 3.5, y - 8, 3, 1.8, '#6f9ad8', -25) + ellipse(x + 3, y - 10, 2.6, 1.6, '#6f9ad8', 25) + ellipse(x, y - 13, 1.8, 2.6, '#6f9ad8'),
    ripe: (x, y) => stroke(`M${x},${y} v-17 M${x},${y - 6} l-5,-6 M${x},${y - 8} l5,-7`, '#3f5fae', 2.4)
      + ellipse(x - 4, y - 4, 3.4, 2, '#4a73bf', -25) + ellipse(x + 4, y - 5, 3.4, 2, '#4a73bf', 25) + ellipse(x - 6, y - 10, 3.2, 1.9, '#5a86c9', -30) + ellipse(x + 6, y - 12, 3.2, 1.9, '#5a86c9', 30)
      + ellipse(x - 3, y - 14, 2.8, 1.7, '#6f9ad8', -25) + ellipse(x + 3, y - 15, 2.8, 1.7, '#6f9ad8', 25)
      + circle(x - 6, y - 15, 1.8, '#c47fe0') + circle(x + 7, y - 17, 1.8, '#c47fe0') + circle(x, y - 20, 2.1, '#d59bf0') + circle(x - 1, y - 21, 0.8, '#fbe8ff') + circle(x + 1, y - 16, 1.6, '#c47fe0'),
  },
  pumpkin: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x - 9},${y + 1} q4,-3 9,-2 q5,1 9,-2`, '#4fa83c', 2.2)
      + circle(x - 5, y - 5, 4.2, '#5fbf4f') + circle(x + 5, y - 4, 4.2, '#5fbf4f') + stroke(`M${x - 5},${y - 2} v-5 M${x + 5},${y - 1} v-5`, '#3e8a35', 1.2)
      + stroke(`M${x + 1},${y - 3} q3,-4 0,-7`, '#8fd47a', 1.4),
    ripe: (x, y) => stroke(`M${x - 11},${y + 1} q6,-4 11,-3 q5,1 11,-3`, '#4fa83c', 2.2)
      + circle(x - 7, y - 7, 5, '#4fa83c') + circle(x + 7, y - 6, 5, '#5fbf4f') + stroke(`M${x - 7},${y - 3} v-6 M${x + 7},${y - 2} v-6`, '#3e8a35', 1.2)
      + ellipse(x, y - 4, 7, 5.6, '#f0891f', 0, outline('#c9651a', 1.2))
      + stroke(`M${x - 3},${y - 9.2} q-1,5.2 0,10.4 M${x + 3},${y - 9.2} q1,5.2 0,10.4`, '#d9701e', 1.2)
      + ellipse(x - 2.6, y - 7, 2, 1.1, '#ffd27a', -20, 'opacity=".75"')
      + stroke(`M${x},${y - 9.6} q1,-2.4 2.4,-3.4`, '#5a8a2a', 2.2),
  },
  cotton: {
    tint: '#8fd47a',
    half: (x, y) => stroke(`M${x},${y} v-12`, '#5a8a3a', 2.4)
      + ellipse(x - 5, y - 6, 4.2, 3, '#5fae4f', -25) + ellipse(x + 5, y - 8, 4.2, 3, '#5fae4f', 25) + ellipse(x, y - 13, 3.4, 3.8, '#6fcf5c'),
    ripe: (x, y) => stroke(`M${x},${y} v-18 M${x},${y - 8} l-7,-5 M${x},${y - 12} l7,-5 M${x},${y - 15} l-5,-6`, '#7a5a3a', 2.4)
      + ellipse(x - 4, y - 4, 3.6, 2.4, '#5fae4f', -25) + ellipse(x + 4, y - 5, 3.6, 2.4, '#5fae4f', 25)
      + [[x - 7, y - 13], [x + 7, y - 17], [x - 5, y - 21], [x + 1, y - 20]].map(([bx, by]) =>
        shape(`M${bx - 2.6},${by + 1.6} l2.6,2.2 l2.6,-2.2 z`, '#8a6a3a')
        + circle(bx - 1.8, by + 0.3, 2.2, '#f7f5ef', outline('#d9d3c7', 0.6)) + circle(bx + 1.8, by + 0.3, 2.2, '#f7f5ef', outline('#d9d3c7', 0.6)) + circle(bx, by - 1.8, 2.3, '#fff', outline('#d9d3c7', 0.6))).join(''),
  },
  chili: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x},${y} v-12`, '#3e8a35', 2.4)
      + ellipse(x - 4, y - 7, 2.2, 5, '#4faa45', -45) + ellipse(x + 4, y - 9, 2.2, 5, '#4faa45', 45) + ellipse(x, y - 14, 2, 4.4, '#5fbf4f'),
    ripe: (x, y) => stroke(`M${x},${y} v-18 M${x},${y - 7} l-6,-4 M${x},${y - 11} l6,-4`, '#3e8a35', 2.4)
      + ellipse(x - 7, y - 14, 2.2, 5, '#4faa45', -50) + ellipse(x + 7, y - 18, 2.2, 5, '#4faa45', 50) + ellipse(x - 3, y - 19, 2, 4.4, '#5fbf4f', -20) + ellipse(x + 3, y - 20, 2, 4.4, '#5fbf4f', 20)
      + [[x - 6, y - 6, 12], [x + 6, y - 9, -12], [x + 1, y - 3, 4]].map(([cx, cy, r]) =>
        shape(`M${cx - 1.8},${cy - 4} q-.6,4.6 1.6,8.8 q2.4,-4 1.9,-8.8 z`, '#e23b2e', `transform="rotate(${r} ${cx} ${cy})" ${outline('#b52a20', 0.6)}`)
        + stroke(`M${cx - 1.4},${cy - 4} h3`, '#3e8a35', 1.8, `transform="rotate(${r} ${cx} ${cy})"`)).join(''),
  },
  blackbean: {
    tint: '#5fbf4f',
    half: (x, y) => stroke(`M${x},${y} v-10`, '#2f7a3a', 2.4)
      + circle(x - 4.5, y - 6, 3.2, '#3f9a4a') + circle(x + 4.5, y - 7, 3.2, '#3f9a4a') + circle(x, y - 12, 3, '#4faa55'),
    ripe: (x, y) => stroke(`M${x},${y} v-17 M${x},${y - 7} l-6,-4 M${x},${y - 11} l6,-4`, '#2f7a3a', 2.6)
      + circle(x - 6, y - 12, 3.6, '#3f9a4a') + circle(x + 6, y - 16, 3.6, '#3f9a4a') + circle(x - 2, y - 19, 3.2, '#4faa55') + circle(x + 3, y - 18, 3, '#4faa55')
      + ellipse(x - 4, y - 5, 1.7, 4.6, '#4a3560', -14, outline('#2a1a3a', 0.6)) + ellipse(x + 4, y - 8, 1.7, 4.6, '#4a3560', 14, outline('#2a1a3a', 0.6)) + ellipse(x + 0.5, y - 4, 1.7, 4.6, '#4a3560', 3, outline('#2a1a3a', 0.6))
      + stroke(`M${x - 4.6},${y - 8} l.5,3 M${x + 3.4},${y - 11} l.5,3 M${x - .1},${y - 7} l.1,3`, '#a090b8', 0.9, 'opacity=".9"'),
  },
  tomato: {
    tint: '#6fcf5c',
    half: (x, y) => ln([x + 2, y + 1], [x + 2, y - 20], '#8a5a2b', 2.2)
      + stroke(`M${x},${y} v-12 M${x},${y - 5} l-5,-3 M${x},${y - 9} l5,-3`, '#4fa83c', 2.4)
      + ellipse(x - 5, y - 9, 2.6, 1.8, '#5fbf4f', -30) + ellipse(x + 5, y - 13, 2.6, 1.8, '#5fbf4f', 30) + ellipse(x, y - 14, 1.8, 2.6, '#5fbf4f')
      + stroke(`M${x - 1},${y - 7} h5`, '#e6cf7a', 1.3),
    ripe: (x, y) => ln([x + 2, y + 1], [x + 2, y - 26], '#8a5a2b', 2.2)
      + stroke(`M${x},${y} v-22 M${x},${y - 6} l-7,-4 M${x},${y - 11} l7,-4 M${x},${y - 16} l-6,-4`, '#4fa83c', 2.4)
      + ellipse(x - 8, y - 11, 2.8, 1.9, '#5fbf4f', -30) + ellipse(x + 8, y - 16, 2.8, 1.9, '#5fbf4f', 30) + ellipse(x - 7, y - 21, 2.8, 1.9, '#5fbf4f', -30) + ellipse(x + 3, y - 24, 2.4, 1.8, '#5fbf4f', 30) + ellipse(x, y - 25, 1.8, 2.6, '#5fbf4f')
      + stroke(`M${x - 1},${y - 13} h5`, '#e6cf7a', 1.3)
      + [[x - 5, y - 6], [x + 5, y - 10], [x - 3, y - 15]].map(([cx, cy]) =>
        circle(cx, cy, 3.4, '#e8413c', outline('#b52a20', 0.6)) + circle(cx - 1.2, cy - 1.2, 1, '#fff', 'opacity=".55"')
        + stroke(`M${cx},${cy - 3.2} l-2,-1.2 M${cx},${cy - 3.2} l2,-1.2 M${cx},${cy - 3.2} v-1.8`, '#3e8a35', 1.1)).join(''),
  },
  strawberry: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x},${y} l-5,-3 M${x},${y} l5,-4 M${x},${y} l0,-6`, '#4f9a3c', 1.8)
      + ellipse(x - 6, y - 4, 3, 2.1, '#4fb84a', -20) + ellipse(x + 6, y - 5, 3, 2.1, '#4fb84a', 20) + ellipse(x, y - 7, 2.6, 2.4, '#5fbf4f'),
    ripe: (x, y) => stroke(`M${x},${y} l-7,-4 M${x},${y} l7,-5 M${x},${y} l-2,-8 M${x},${y} l3,-7`, '#3e9a3c', 1.8)
      + ellipse(x - 8, y - 5, 3.4, 2.4, '#3e9a3c', -20) + ellipse(x + 8, y - 6, 3.4, 2.4, '#3e9a3c', 20) + ellipse(x - 2, y - 9, 3, 2.6, '#4fb84a') + ellipse(x + 4, y - 8, 2.6, 2.2, '#4fb84a', 20)
      + flower(x + 7, y - 11, 1.5, '#fff')
      + [[x - 5, y - 1], [x + 5, y - 2], [x, y + 1.5]].map(([cx, cy]) =>
        shape(`M${cx},${cy + 3.6} q-3.6,-2 -3.2,-5.4 q1.4,-2 3.2,-1 q1.8,-1 3.2,1 q.4,3.4 -3.2,5.4 z`, '#e8413c', outline('#b52a20', 0.6))
        + circle(cx - 1.2, cy, 0.5, '#f7e07a') + circle(cx + 1, cy + 1.2, 0.5, '#f7e07a') + circle(cx + 0.2, cy - 1.1, 0.5, '#f7e07a')
        + stroke(`M${cx - 2.2},${cy - 3} l2.2,1.2 l2.2,-1.2 M${cx},${cy - 1.8} v-1.8`, '#3e9a3c', 1.1)).join(''),
  },
  potato: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x},${y} v-11 M${x},${y - 4} l-5,-2 M${x},${y - 7} l5,-3`, '#4f9a3c', 2.2)
      + ellipse(x - 6, y - 7, 3.2, 2.2, '#5fae4f', -30) + ellipse(x + 6, y - 11, 3.2, 2.2, '#5fae4f', 30) + ellipse(x - 2, y - 11, 2.6, 2, '#6fcf5c', -20) + ellipse(x + 1, y - 13, 2.4, 2.8, '#6fcf5c'),
    ripe: (x, y) => ellipse(x + 1, y + 1, 7, 2.4, '#7a4a22', 0, 'opacity=".7"')
      + stroke(`M${x},${y - 1} v-16 M${x},${y - 5} l-7,-3 M${x},${y - 9} l7,-4 M${x},${y - 12} l-6,-4`, '#4f9a3c', 2.3)
      + ellipse(x - 8, y - 9, 3.4, 2.3, '#4fa83c', -30) + ellipse(x + 8, y - 14, 3.4, 2.3, '#4fa83c', 30) + ellipse(x - 7, y - 17, 3, 2.1, '#5fbf4f', -30) + ellipse(x + 3, y - 18, 2.8, 2, '#5fbf4f', 20) + ellipse(x - 1, y - 19, 2.2, 2.8, '#6fcf5c')
      + flower(x - 4, y - 21, 1.6, '#fff') + flower(x + 6, y - 20, 1.5, '#fff')
      + ellipse(x + 3, y + 1, 4.2, 2.7, '#d4ab74', 0, outline('#a8814f', 0.8)) + circle(x + 1.5, y + 0.2, 0.55, '#a8814f') + circle(x + 4.5, y + 1.4, 0.55, '#a8814f'),
  },
  chamomile: {
    tint: '#8fd47a',
    half: (x, y) => stroke(`M${x},${y} v-11 M${x - 3},${y} l-3,-8 M${x + 3},${y} l3,-8`, '#6fbf5c', 2)
      + stroke(`M${x},${y - 5} l-2,-2 M${x},${y - 8} l2,-2 M${x - 4.5},${y - 4} l-2,-1 M${x + 4.5},${y - 4} l2,-1`, '#8fd47a', 1.3),
    ripe: (x, y) => stroke(`M${x},${y} v-17 M${x - 3},${y} l-4,-11 M${x + 3},${y} l4,-12`, '#6fbf5c', 2)
      + stroke(`M${x},${y - 6} l-3,-2 M${x},${y - 10} l3,-2 M${x - 4.5},${y - 5} l-2.5,-1 M${x + 4.5},${y - 5} l2.5,-1 M${x - 5.5},${y - 8} l-2.5,-1 M${x + 5.5},${y - 9} l2.5,-1`, '#8fd47a', 1.3)
      + [[x, y - 19, 2.5], [x - 7, y - 12, 2.1], [x + 7, y - 13, 2.1]].map(([cx, cy, r]) => flower(cx, cy, r, '#fff', '#f3c54a') + circle(cx, cy, r * 0.55, 'none', outline('#e0a020', 0.5))).join(''),
  },
  asparagus: {
    tint: '#7cc25a',
    half: (x, y) => [[x - 5, 6], [x + 1, 9], [x + 6, 5]].map(([cx, h]) =>
      shape(`M${cx - 1.8},${y + 0.5} v-${h} q1.8,-3.4 3.6,0 v${h} z`, '#7cc25a', outline('#4f9a3c', 0.8))
      + circle(cx, y - h - 1.4, 1.5, '#9a7bbf', 'opacity=".85"')).join(''),
    ripe: (x, y) => [[x - 6, 15], [x + 1, 21], [x + 7, 17]].map(([cx, h]) =>
      shape(`M${cx - 2.2},${y + 0.5} v-${h} q2.2,-4 4.4,0 v${h} z`, '#7cc25a', outline('#4f9a3c', 0.9))
      + stroke(`M${cx - 1.4},${n1(y - h * 0.45)} l1.4,-1.4 l1.4,1.4 M${cx - 1.4},${n1(y - h * 0.72)} l1.4,-1.4 l1.4,1.4`, '#4f9a3c', 1)
      + stroke(`M${cx - 1.2},${y - 2} v-${n1(h * 0.3)}`, '#a9dc8a', 1, 'opacity=".8"')
      + ellipse(cx, y - h - 1.6, 1.9, 2.2, '#9a7bbf', 0, 'opacity=".9"')).join(''),
  },
  sesame: {
    tint: '#6fcf5c',
    half: (x, y) => stroke(`M${x},${y} v-12`, '#5fae4f', 2.4)
      + ellipse(x - 4, y - 4, 3.6, 2, '#5fbf4f', -20) + ellipse(x + 4, y - 4, 3.6, 2, '#5fbf4f', 20) + ellipse(x - 3.5, y - 9, 3.2, 1.8, '#6fcf5c', -20) + ellipse(x + 3.5, y - 9, 3.2, 1.8, '#6fcf5c', 20) + ellipse(x, y - 13, 1.6, 2.4, '#8fd47a'),
    ripe: (x, y) => stroke(`M${x},${y} v-21`, '#4f9a3c', 2.4)
      + ellipse(x - 5, y - 3, 4, 2.2, '#5fbf4f', -20) + ellipse(x + 5, y - 3, 4, 2.2, '#5fbf4f', 20)
      + [[x - 2.6, y - 8], [x + 2.6, y - 8], [x - 2.6, y - 13.5], [x + 2.6, y - 13.5]].map(([cx, cy]) =>
        `<rect x="${n1(cx - 1.3)}" y="${n1(cy - 3)}" width="2.6" height="6" rx="1.3" fill="#a9cf5a" ${outline('#6a8f32', 0.7)}/>`).join('')
      + ellipse(x - 2.5, y - 18.5, 1.6, 2.4, '#f7d4e8', -15, outline('#e0a0c0', 0.6)) + ellipse(x + 2.5, y - 18.5, 1.6, 2.4, '#f7d4e8', 15, outline('#e0a0c0', 0.6)) + circle(x, y - 22, 1.6, '#8fd47a'),
  },
};

export const CROP_ART: Record<string, string[]> = Object.fromEntries(
  Object.entries(CROP_LOOKS).map(([id, c]) => [id, [sheet(sprout(c.tint)), sheet(c.half), sheet(c.ripe)]]),
);

// ---------------------------------------------------------------------------
// Trees and bushes: 120×140 frames; the plant stands on a 2×2-cell iso footprint
// (52 iso units a side, front corner at 60,128) so it drops onto the farm grid
// like the buildings. `grow` is the bare plant, `ready` wears its fruit.

interface Pal { dark: string; mid: string; light: string }
const G: Pt = [60, 102]; // centre of the footprint, where the plant grows

/** A round layered canopy centred on (cx, cy): a darker base, two mid lumps, a lighter top and a highlight. */
function canopy(cx: number, cy: number, r: number, pal: Pal): string {
  return circle(cx, cy + r * 0.25, r, pal.dark)
    + circle(cx - r * 0.55, cy + r * 0.05, r * 0.7, pal.mid) + circle(cx + r * 0.55, cy + r * 0.05, r * 0.7, pal.mid)
    + circle(cx, cy - r * 0.3, r * 0.75, pal.light)
    + ellipse(cx - r * 0.3, cy - r * 0.62, r * 0.32, r * 0.16, '#fff', -25, 'opacity=".4"');
}

/** A trunk rising h from (cx, by), w wide, with a lit left edge and a root flare. */
function trunk(cx: number, by: number, h: number, w: number, dark: string, light: string): string {
  return ellipse(cx, by, w * 0.9, w * 0.32, dark)
    + shape(`M${n1(cx - w / 2 - 2)},${by} q2,-${n1(h * 0.35)} 1,-${h} h${w + 2} q-1,${n1(h * 0.65)} 2,${h} z`, dark)
    + ln([cx - w / 2 + 1, by - 3], [cx - w / 2 + 1, by - h + 4], light, 1.6, 'opacity=".5"');
}

/** A bush body: a row of overlapping lumps hugging the ground, lighter towards the top. */
function bushBody(cx: number, by: number, w: number, h: number, pal: Pal): string {
  const r = h * 0.62;
  return ellipse(cx, by - 2, w * 0.5, h * 0.4, pal.dark)
    + circle(cx - w * 0.32, by - h * 0.42, r * 0.85, pal.dark) + circle(cx + w * 0.32, by - h * 0.42, r * 0.85, pal.dark)
    + circle(cx - w * 0.18, by - h * 0.6, r * 0.9, pal.mid) + circle(cx + w * 0.2, by - h * 0.58, r * 0.9, pal.mid)
    + circle(cx, by - h * 0.78, r * 0.95, pal.light)
    + ellipse(cx - w * 0.14, by - h * 1.05, w * 0.14, h * 0.1, '#fff', -20, 'opacity=".4"');
}

const base = (): string => `<defs>${SHADOW_FILTER}</defs>` + isoShadow(isoAt(60, 128), 52, 52);
const frame = (body: string): string => svg(120, 140, base() + body);

/** Fruits are scattered at these offsets from the canopy centre (for a round canopy). */
const ROUND_FRUIT: Pt[] = [[-16, -4], [12, -10], [-3, 8], [18, 6], [-20, 12], [4, -20], [8, 16]];

const TREE_LOOKS: Record<string, { grow: string; fruit: string }> = (() => {
  const [gx, gy] = G;
  // Apple: the classic round tree.
  const applePal: Pal = { dark: '#3f8f36', mid: '#55b04a', light: '#7fd36a' };
  const appleTree = trunk(gx, gy, 36, 10, '#7a4e2a', '#b98a5c') + canopy(gx, gy - 52, 30, applePal);
  const apples = ROUND_FRUIT.map(([dx, dy]) => circle(gx + dx, gy - 52 + dy, 4.6, '#e8413c', outline('#b52a20', 0.8))
    + circle(gx + dx - 1.6, gy - 52 + dy - 1.6, 1.4, '#fff', 'opacity=".6"') + stroke(`M${gx + dx},${gy - 52 + dy - 4.4} v-2.4`, '#5a3a1a', 1.3)).join('');
  // Cherry: taller and narrower, three lumps stacked, with a pink blush.
  const cherryPal: Pal = { dark: '#4a9a48', mid: '#6cba62', light: '#98d68a' };
  const blossoms = [[-14, -22], [10, -40], [-6, -58], [16, -12], [4, -8], [-18, -44], [14, -62]].map(([dx, dy]) => circle(gx + dx, gy + dy, 2.2, '#f6c3d6')).join('');
  const cherryTree = trunk(gx, gy, 40, 9, '#6f4423', '#b98a5c')
    + circle(gx, gy - 46, 24, cherryPal.dark) + circle(gx - 6, gy - 60, 21, cherryPal.mid) + circle(gx + 7, gy - 64, 19, cherryPal.mid) + circle(gx, gy - 80, 18, cherryPal.light)
    + ellipse(gx - 7, gy - 90, 7, 3.4, '#fff', -25, 'opacity=".45"') + blossoms;
  const cherries = [[-12, -36], [10, -30], [-4, -56], [16, -60], [-16, -70], [6, -84], [-2, -20]].map(([dx, dy]) => {
    const x = gx + dx, y = gy + dy;
    return stroke(`M${x},${y - 9} l-3.5,8 M${x},${y - 9} l3.5,8`, '#5a3a1a', 1.3)
      + circle(x - 3.8, y + 0.5, 3.2, '#d6262a', outline('#9c1a1e', 0.7)) + circle(x + 3.8, y + 0.5, 3.2, '#e8413c', outline('#9c1a1e', 0.7))
      + circle(x - 5, y - 0.8, 0.9, '#fff', 'opacity=".7"') + circle(x + 2.6, y - 0.8, 0.9, '#fff', 'opacity=".7"');
  }).join('');
  // Cacao: a slim tall trunk with a sparse crown of big pointed leaves; the pods grow on the trunk.
  const cacaoLeaf = (x: number, y: number, rot: number, fill: string): string =>
    shape('M0,0 q-12,-12 0,-38 q12,26 0,38 z', fill, `transform="translate(${n1(x)} ${n1(y)}) rotate(${rot})"`)
    + stroke('M0,-4 v-28', '#9ad48a', 1, `transform="translate(${n1(x)} ${n1(y)}) rotate(${rot})" opacity=".5"`);
  const cacaoTree = trunk(gx, gy, 48, 7, '#6f4423', '#b98a5c')
    + stroke(`M${gx},${gy - 40} l-16,-12 M${gx},${gy - 42} l17,-11 M${gx},${gy - 46} l-7,-16 M${gx},${gy - 46} l7,-16`, '#6f4423', 3)
    + cacaoLeaf(gx - 16, gy - 50, -95, '#2f7a3a') + cacaoLeaf(gx + 17, gy - 51, 95, '#2f7a3a') + cacaoLeaf(gx - 14, gy - 54, -62, '#3a8a40') + cacaoLeaf(gx + 15, gy - 55, 62, '#3a8a40')
    + cacaoLeaf(gx - 9, gy - 60, -36, '#3f9a45') + cacaoLeaf(gx + 10, gy - 60, 36, '#3f9a45') + cacaoLeaf(gx - 5, gy - 62, -16, '#55b04a') + cacaoLeaf(gx + 5, gy - 62, 16, '#6cc060') + cacaoLeaf(gx, gy - 62, 0, '#7fd36a');
  const cacaoPods = [[-6, -16, -20], [7, -26, 20], [-7, -34, -25], [6, -42, 18], [-4, -6, -10], [8, -8, 15]].map(([dx, dy, rot]) =>
    ellipse(gx + dx, gy + dy, 3.6, 6.4, '#e08a2a', rot, outline('#b4571a', 0.9))
    + stroke(`M${gx + dx - 1.4},${gy + dy - 5} v10 M${gx + dx + 1.4},${gy + dy - 5} v10`, '#c9711f', 0.9, `transform="rotate(${rot} ${gx + dx} ${gy + dy})" opacity=".8"`)).join('');
  // Raspberry: a soft green mound with arching canes.
  const raspPal: Pal = { dark: '#3e8f3a', mid: '#58b04f', light: '#7fd36a' };
  // Arching canes rising out of the mound, each ending in a trio of leaflets.
  const canes = (color: string, leafFill: string, thorns = false): string => {
    let s = '';
    for (const [dx, k] of [[-34, -1], [-13, -0.4], [9, 0.4], [30, 1]] as [number, number][]) {
      const tx = gx + dx, ty = gy - 40;
      s += stroke(`M${n1(gx + dx * 0.25)},${gy - 8} q${n1(dx * 0.2)},-22 ${n1(dx * 0.75)},-32`, color, 2.2);
      if (thorns) s += stroke(`M${n1(gx + dx * 0.45)},${gy - 22} l${n1(-k * 2.5)},-2 M${n1(gx + dx * 0.6)},${gy - 30} l${n1(-k * 2.5)},-2`, color, 1.2);
      s += ellipse(tx - 5, ty + 2, 4.4, 2.6, leafFill, -40) + ellipse(tx + 5, ty + 2, 4.4, 2.6, leafFill, 40) + ellipse(tx, ty - 3, 2.8, 4.4, leafFill);
    }
    return s;
  };
  const raspberryBush = bushBody(gx, gy - 2, 84, 40, raspPal) + canes('#7a5a3a', '#7fd36a')
    + [[-22, -30], [16, -28], [-4, -36]].map(([dx, dy]) => ellipse(gx + dx, gy + dy, 4.6, 2.8, '#7fd36a', dx < 0 ? -35 : 35)).join('');
  const cluster = (x: number, y: number, fill: string, hi: string, r = 1.9): string =>
    circle(x - 2, y, r, fill) + circle(x + 2, y, r, fill) + circle(x, y - 2.2, r, fill) + circle(x, y + 2.2, r, fill) + circle(x, y, r, fill) + circle(x - 0.8, y - 2.6, 0.7, hi);
  const raspberries = [[-34, -32], [-13, -33], [9, -33], [30, -32], [-24, -20], [18, -18], [0, -26]].map(([dx, dy]) =>
    stroke(`M${gx + dx},${gy + dy - 4} v-4`, '#5a8a2a', 1.3) + cluster(gx + dx, gy + dy, '#e0407a', '#ffb3cc')).join('');
  // Blackberry: wider, darker, with thorny canes.
  const blackPal: Pal = { dark: '#2f6f36', mid: '#45964a', light: '#66b85e' };
  const blackberryBush = bushBody(gx, gy - 2, 92, 36, blackPal) + canes('#5a3a22', '#66b85e', true)
    + [[-20, -28], [14, -30], [-2, -34]].map(([dx, dy]) => ellipse(gx + dx, gy + dy, 4.4, 2.6, '#66b85e', dx < 0 ? -35 : 35)).join('');
  const blackberries = [[-34, -32], [-13, -33], [9, -33], [30, -32], [-24, -20], [18, -18], [-2, -26], [36, -20]].map(([dx, dy]) =>
    stroke(`M${gx + dx},${gy + dy - 4} v-4`, '#5a8a2a', 1.3) + cluster(gx + dx, gy + dy, '#3b1f5e', '#9a7bbf', 2)).join('');
  // Blueberry: a tidy upright bush of small blue-green lumps.
  const bluePal: Pal = { dark: '#3f7f5a', mid: '#5aa072', light: '#86c494' };
  const blueberryBush = stroke(`M${gx - 14},${gy - 4} l-10,-28 M${gx - 4},${gy - 4} l-2,-40 M${gx + 6},${gy - 4} l4,-38 M${gx + 16},${gy - 4} l10,-28`, '#6f4a2a', 2.2)
    + bushBody(gx, gy - 4, 70, 46, bluePal)
    + [[-28, -30], [-18, -46], [0, -54], [18, -48], [28, -32], [-8, -22], [10, -24]].map(([dx, dy]) => ellipse(gx + dx, gy + dy, 3.6, 2.2, '#a6d9b0', dx < 0 ? -30 : 30)).join('');
  const blueberries = [[-26, -24], [-16, -38], [-4, -46], [10, -42], [24, -28], [-10, -16], [14, -16], [2, -30]].map(([dx, dy]) =>
    circle(gx + dx, gy + dy, 3.3, '#3b6fd6', outline('#2a4fa8', 0.8)) + circle(gx + dx - 1.1, gy + dy - 1.1, 1, '#cfe0ff', 'opacity=".8"') + circle(gx + dx, gy + dy + 1.4, 0.9, '#1f3a80')).join('');
  // Nectar bush: a rounded flowering shrub.
  const nectarPal: Pal = { dark: '#3f8a3c', mid: '#5aae4e', light: '#82cf70' };
  const nectarBush = bushBody(gx, gy - 2, 80, 44, nectarPal)
    + [[-30, -36], [-10, -48], [12, -50], [30, -36], [-20, -22], [18, -20], [0, -60]].map(([dx, dy]) => ellipse(gx + dx, gy + dy, 4.6, 2.8, '#b3e6a0', dx < 0 ? -30 : 30)).join('');
  const nectarFlowers = ([[-30, -30, '#f48fb1'], [-12, -44, '#fff'], [10, -48, '#f48fb1'], [28, -32, '#fff'], [-20, -16, '#fff'], [18, -16, '#f48fb1'], [0, -58, '#f48fb1'], [-2, -30, '#fff']] as [number, number, string][]).map(([dx, dy, c]) =>
    flower(gx + dx, gy + dy, 3.2, c, '#f7c21a')).join('');
  // Coffee: a dense, dark, glossy bush with the berries along its branches.
  const coffeePal: Pal = { dark: '#246b2f', mid: '#35903f', light: '#4fae50' };
  const coffeeBranches = `M${gx - 6},${gy - 6} q-14,-12 -26,-14 M${gx - 2},${gy - 8} q-6,-20 -18,-34 M${gx + 2},${gy - 8} q6,-20 16,-36 M${gx + 6},${gy - 6} q14,-12 28,-16 M${gx},${gy - 10} v-44`;
  const coffeeBush = bushBody(gx, gy - 2, 82, 46, coffeePal) + stroke(coffeeBranches, '#4a2e16', 2, 'opacity=".75"')
    + [[-30, -26], [-20, -40], [-8, -52], [8, -54], [22, -40], [32, -26], [-14, -18], [14, -18], [0, -36], [-24, -14], [26, -12]].map(([dx, dy]) =>
      ellipse(gx + dx, gy + dy, 5.2, 2.8, '#4fae50', dx < 0 ? -30 : 30, outline('#1d5a27', 0.7)) + ellipse(gx + dx - 1, gy + dy - 0.8, 2.2, 0.7, '#9ee09a', dx < 0 ? -30 : 30, 'opacity=".8"')).join('');
  const coffeeBerries = [[-26, -20], [-18, -32], [-10, -44], [6, -46], [18, -34], [28, -20], [-6, -24], [10, -24], [0, -12], [22, -10]].map(([dx, dy]) =>
    circle(gx + dx - 2.6, gy + dy, 2.7, '#d8322a', outline('#9c1a1e', 0.6)) + circle(gx + dx + 2.6, gy + dy - 1, 2.7, '#e8413c', outline('#9c1a1e', 0.6)) + circle(gx + dx + 1.6, gy + dy - 2.2, 0.8, '#fff', 'opacity=".7"')).join('');

  return {
    appletree: { grow: appleTree, fruit: apples },
    raspberrybush: { grow: raspberryBush, fruit: raspberries },
    cherrytree: { grow: cherryTree, fruit: cherries },
    blackberrybush: { grow: blackberryBush, fruit: blackberries },
    blueberrybush: { grow: blueberryBush, fruit: blueberries },
    cacaotree: { grow: cacaoTree, fruit: cacaoPods },
    nectarbush: { grow: nectarBush, fruit: nectarFlowers },
    coffeebush: { grow: coffeeBush, fruit: coffeeBerries },
  };
})();

export const TREE_ART: Record<string, { grow: string; ready: string }> = Object.fromEntries(
  Object.entries(TREE_LOOKS).map(([id, t]) => [id, { grow: frame(t.grow), ready: frame(t.grow + t.fruit) }]),
);

// Every crop the farm grows (wheat and corn live in art.ts) and every tree but the Mine must have art.
for (const id of Object.keys(CROPS)) if (id !== 'wheat' && id !== 'corn' && CROP_ART[id]?.length !== 3) throw new Error(`art-crops: no art for crop ${id}`);
for (const id of Object.keys(TREES)) if (id !== 'mine' && !TREE_ART[id]) throw new Error(`art-crops: no art for tree ${id}`);
