// Item icons: everything the farm grows, raises, digs up and crafts, drawn flat
// in the same bright rounded cartoon style as the icons in art.ts (chunky
// silhouettes, flat colours plus one highlight, a soft shadow ellipse under the
// item). Most icons are instances of a parametric template so a family (juices,
// jams, bars, cakes, soups...) shares one shape and differs by colour and a small
// decal. Gradient / clip ids carry the item id so many icons can sit inline on
// one page. Items never get a face (that is for animals and tiles).

import { svg, isoAt, isoBox } from './art-core';

// ---------------------------------------------------------------------------
// Small building blocks

const ic = (body: string): string => svg(64, 64, body);
const sh = (rx = 18, cx = 32, cy = 59): string => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="3.5" fill="#000" opacity=".15"/>`;
const hl = (cx: number, cy: number, rx: number, ry: number, rot = -30, op = 0.5): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
const grad = (id: string, c1: string, c2: string): string =>
  `<defs><radialGradient id="g-${id}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient></defs>`;
/** Place markup drawn around (0,0) at (x, y), optionally scaled. */
const at = (x: number, y: number, body: string, s = 1): string => `<g transform="translate(${x} ${y})${s !== 1 ? ` scale(${s})` : ''}">${body}</g>`;
const leaf = (cx: number, cy: number, rot: number, color = '#3e9a3c', s = 7): string =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${s}" ry="${s * 0.45}" fill="${color}" transform="rotate(${rot} ${cx} ${cy})"/>`;
/** Pointy leaves radiating from (cx, cy); angle 0 points up. */
const calyx = (cx: number, cy: number, len: number, angles: number[], color = '#3e9a3c'): string =>
  `<g fill="${color}">${angles.map((a) => `<path d="M${cx} ${cy}q${-len * 0.4} ${-len * 0.5} 0 ${-len}q${len * 0.4} ${len * 0.5} 0 ${len}z" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}</g>`;
/** n petals around (cx, cy), each an ellipse rIn away from the centre. */
const petals = (cx: number, cy: number, n: number, rIn: number, rx: number, ry: number, color: string, stroke = ''): string =>
  Array.from({ length: n }, (_, k) => `<ellipse cx="${cx}" cy="${cy - rIn}" rx="${rx}" ry="${ry}" fill="${color}"${stroke} transform="rotate(${(k * 360) / n} ${cx} ${cy})"/>`).join('');
const dots = (fill: string, p: [number, number, number?][]): string =>
  `<g fill="${fill}">${p.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r ?? 2.5}"/>`).join('')}</g>`;
const hexPts = (cx: number, cy: number, r: number): string =>
  Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 180) * (30 + 60 * k); return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
const steam = (x: number): string => `<path d="M${x} 22c-2-4 2-6 0-10" stroke="#9aa5b3" stroke-width="2" fill="none" stroke-linecap="round" opacity=".5"/>`;
/** A white plate seen from the front. */
const plate = (cy = 42, rx = 27, ry = 10): string => `<ellipse cx="32" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" stroke="#dfe3e8" stroke-width="1.5"/>`;
/** A whipped-cream swirl standing on (cx, baseY). */
const swirl = (cx: number, baseY: number, color = '#fff', edge = '#e6dcc0', s = 1): string =>
  at(cx, baseY, `<g fill="${color}" stroke="${edge}" stroke-width="1.2"><ellipse cx="0" cy="0" rx="13" ry="5"/><ellipse cx="0" cy="-5" rx="9" ry="4.5"/><ellipse cx="0" cy="-10" rx="5.5" ry="3.5"/><circle cx="0" cy="-14" r="2.5"/></g>`, s);

// ---------------------------------------------------------------------------
// Decals: little fruit / drop motifs drawn around (0,0), ~16 units across. They
// go on labels, pie tops, cakes and pizzas so each family member reads at once.

const dCarrot = '<path d="M-4 -6c0-3 8-3 8 0l-3 12c0 2-2 2-2 0z" fill="#ff8a3d"/><path d="M-4 -7c-2-3-5-4-7-3M0 -7c0-3 1-5 3-7M4 -7c2-3 4-4 7-3" stroke="#3e9a3c" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
const dApple = '<circle r="6.5" fill="#e8413c"/><path d="M0 -6v-4" stroke="#6b4423" stroke-width="2" stroke-linecap="round"/><ellipse cx="3" cy="-8" rx="3" ry="1.5" fill="#3e9a3c" transform="rotate(-30 3 -8)"/><circle cx="-2.5" cy="-2.5" r="1.6" fill="#fff" opacity=".6"/>';
const dCherry = '<path d="M-3 -1c0-6 4-9 7-11M4 1c-2-6 0-9 3-11" stroke="#5a8a2a" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="-3.5" cy="3" r="4.5" fill="#b8102f"/><circle cx="4" cy="4" r="4.5" fill="#e8213f"/><circle cx="-4.5" cy="1.5" r="1.2" fill="#fff" opacity=".7"/>';
const dTomato = '<circle r="6.5" fill="#e8413c"/><g fill="#3e9a3c"><path d="M0 -3l-6-4 3 5-6 1 6 1-2 4 5-3 5 3-2-4 6-1-6-1 3-5z"/></g>';
const dBerries = '<circle cx="-5" cy="2" r="4" fill="#e8366e"/><circle cx="5" cy="2" r="4" fill="#4a6fe0"/><circle cx="0" cy="-4" r="4" fill="#3b2152"/>';
const dBerryCluster = (c: string): string => `<g fill="${c}"><circle cx="-3.5" cy="-2" r="3.2"/><circle cx="3.5" cy="-2" r="3.2"/><circle cx="0" cy="2" r="3.2"/><circle cx="-3" cy="5.5" r="2.8"/><circle cx="3" cy="5.5" r="2.8"/><circle cx="0" cy="-6" r="2.8"/></g><path d="M-4 -8l4 3 4-3-1 4h-6z" fill="#3e9a3c"/><circle cx="-3.5" cy="-3" r="1" fill="#fff" opacity=".7"/>`;
const dStrawberry = '<path d="M0 9C-5 6-8 2-8-2c0-4 3-6 6-5l2 1 2-1c3-1 6 1 6 5 0 4-3 8-8 11z" fill="#e8413c"/><path d="M-6 -7l6 2 6-2-2 4h-8z" fill="#3e9a3c"/><g fill="#ffe08a"><circle cx="-3" cy="0" r="1"/><circle cx="3" cy="0" r="1"/><circle cx="0" cy="4" r="1"/><circle cx="0" cy="-2" r="1"/></g>';
const dBlueberry = '<circle r="6" fill="#4a6fe0"/><circle cy="-2.5" r="2.2" fill="#2f4fb8"/><circle cx="-2.5" cy="-1" r="1.3" fill="#fff" opacity=".6"/>';
const dDrop = (c: string): string => `<path d="M0 -9c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="${c}"/><ellipse cx="-2" cy="2" rx="1.2" ry="2" fill="#fff" opacity=".6"/>`;
const dChili = '<path d="M-5 -8C-7 -2 -4 6 3 10c2 1 4 0 5-1-5-3-7-8-7-13 0-2-3-4-6-4z" fill="#e8413c"/><path d="M-5 -8c-1-3 1-5 4-4" stroke="#3e9a3c" stroke-width="2" fill="none" stroke-linecap="round"/>';
const dHorns = '<path d="M-6 6c-3-5-2-10 2-13M6 6c3-5 2-10-2-13" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round"/>';
const dFishTail = '<path d="M-9 0c4-7 12-7 16 0-4 7-12 7-16 0z" fill="#e0a04a"/><path d="M7 0l6-5-1 5 1 5z" fill="#e0a04a"/>';
const dLeafPair = '<path d="M-7 4c0-6 4-9 8-9-1 5-4 8-8 9zM1 2c0-6 4-9 8-9-1 5-4 8-8 9z" fill="#3e9a3c"/>';

// ---------------------------------------------------------------------------
// Templates

// --- crops & fruit ---------------------------------------------------------

const apple = (id: string, c1: string, c2: string): string => ic(`${grad(id, c1, c2)}${sh(18)}
<path d="M32 22c-5-6-13-6-18 0-6 7-5 19 1 27 4 6 10 9 17 7 7 2 13-1 17-7 6-8 7-20 1-27-5-6-13-6-18 0z" fill="url(#g-${id})"/>
<path d="M32 22c0-6 2-10 5-13" stroke="#6b4423" stroke-width="3.5" fill="none" stroke-linecap="round"/>
${leaf(40, 12, -30, '#5fb85c', 8)}${hl(23, 31, 4, 7)}`);

const tomato = (id: string): string => ic(`${grad(id, '#ff7a5c', '#d9342b')}${sh(20)}
<ellipse cx="32" cy="38" rx="22" ry="18" fill="url(#g-${id})"/>
${calyx(32, 23, 12, [0, 62, -62, 124, -124])}<path d="M32 24v-9" stroke="#3e9a3c" stroke-width="3.5" stroke-linecap="round"/>
${hl(21, 33, 4, 7)}`);

const cherry = (): string => ic(`${sh(20)}
<path d="M24 42c0-14 8-26 18-32M44 44c-4-12-4-24-2-34" stroke="#5a8a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
${leaf(50, 12, 25, '#5fb85c', 9)}
<circle cx="23" cy="45" r="12" fill="#b8102f"/><circle cx="43" cy="47" r="12" fill="#e8213f"/>
${hl(19, 40, 3, 5)}${hl(39, 42, 3, 5)}`);

const strawberry = (): string => ic(`${sh(16)}
<path d="M32 58C21 52 12 42 12 30c0-9 6-14 13-13 3 0 5 2 7 4 2-2 4-4 7-4 7-1 13 4 13 13 0 12-9 22-20 28z" fill="#e8413c"/>
<g fill="#ffe08a">${[[24, 30], [32, 28], [40, 30], [20, 38], [28, 38], [36, 38], [44, 38], [26, 46], [36, 46], [32, 53]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.2"/>`).join('')}</g>
${calyx(32, 20, 11, [-90, -55, -20, 20, 55, 90])}<path d="M32 20v-9" stroke="#3e9a3c" stroke-width="3.5" stroke-linecap="round"/>
${hl(21, 30, 2.5, 5, -15)}`);

const potatoShape = (fill: string): string => `<path d="M14 36c-2-10 8-18 20-17 12 1 20 8 18 18-2 10-10 14-20 13-10-1-16-6-18-14z" fill="${fill}"/>`;
const potato = (id: string): string => ic(`${grad(id, '#d9a86a', '#a8743c')}${sh(20)}${potatoShape(`url(#g-${id})`)}
${dots('#8a5a2b', [[22, 30, 1.8], [38, 27, 1.8], [30, 42, 1.8], [46, 40, 1.8], [19, 42, 1.5]])}${hl(24, 28, 5, 3, -20, 0.35)}`);

const pumpkin = (): string => ic(`${sh(24)}
<ellipse cx="32" cy="38" rx="26" ry="18" fill="#c9561a"/>
<ellipse cx="17" cy="38" rx="9" ry="16" fill="#ff8a3d"/><ellipse cx="47" cy="38" rx="9" ry="16" fill="#ff8a3d"/>
<ellipse cx="24" cy="38" rx="9" ry="17.5" fill="#ff9b4d"/><ellipse cx="40" cy="38" rx="9" ry="17.5" fill="#ff9b4d"/>
<ellipse cx="32" cy="38" rx="9" ry="18.5" fill="#ffa85c"/>
<path d="M32 20c0-6 2-10 7-12" stroke="#5a8a2a" stroke-width="5" fill="none" stroke-linecap="round"/>
${hl(28, 28, 3, 6, -10)}`);

const carrot = (): string => ic(`${sh(10, 30)}
<path d="M20 24c0-7 24-7 24 0l-9 32c-1 4-5 4-6 0z" fill="#ff8a3d"/>
<path d="M22 32h18M24 40h14M27 48h8" stroke="#e06a1e" stroke-width="2" stroke-linecap="round"/>
<path d="M32 22c-3-9-9-13-16-12M32 22c0-9 3-15 8-19M32 22c4-8 10-11 16-10" stroke="#3e9a3c" stroke-width="4.5" fill="none" stroke-linecap="round"/>
${hl(26, 34, 2.5, 8, -8)}`);

const chili = (): string => ic(`${sh(16, 36)}
<path d="M22 14C26 10 34 12 36 18C40 28 42 36 46 44C49 50 52 54 55 59C48 55 40 50 34 44C26 36 20 26 22 14Z" fill="#e8413c"/>
<path d="M27 20c-1 8 2 16 8 24" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>
<path d="M24 14c-3-6 0-10 6-9" stroke="#3e9a3c" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M18 17c3-5 10-6 16-3-2 3-10 5-16 3z" fill="#5fb85c"/>`);

const pod = (x: number, y: number, rot: number, c: string, cb: string): string => `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 21}" y="${y - 8}" width="42" height="16" rx="8" fill="${c}"/><g fill="${cb}"><circle cx="${x - 12}" cy="${y}" r="5"/><circle cx="${x}" cy="${y}" r="5"/><circle cx="${x + 12}" cy="${y}" r="5"/></g><path d="M${x - 17} ${y - 3}q17-4 34 0" stroke="#fff" stroke-width="1.5" fill="none" opacity=".45"/></g>`;
const soybean = (): string => ic(`${sh(20)}${pod(30, 26, -35, '#4f8f2a', '#7cc244')}${pod(34, 40, -35, '#6fb33a', '#9ad85a')}`);

const bean = (x: number, y: number, rot: number, c: string): string => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="8" ry="5.5" fill="${c}"/><ellipse cx="${x}" cy="${y - 4}" rx="2.5" ry="1" fill="#fff" opacity=".8"/></g>`;
const blackbean = (): string => ic(`${sh(20)}${bean(24, 26, -20, '#2d2436')}${bean(40, 28, 15, '#2d2436')}${bean(18, 40, 10, '#3a2d45')}${bean(32, 38, -10, '#3a2d45')}${bean(46, 42, 20, '#3a2d45')}${bean(25, 50, -15, '#2d2436')}${bean(40, 52, 10, '#2d2436')}`);

const cacao = (id: string): string => ic(`${grad(id, '#f0a048', '#c45f1a')}${sh(16)}
<g transform="rotate(22 32 36)"><ellipse cx="32" cy="36" rx="14" ry="23" fill="url(#g-${id})"/><path d="M24 17c-4 13-4 26 0 38M32 13v46M40 17c4 13 4 26 0 38" stroke="#a24e14" stroke-width="2" fill="none" opacity=".5"/></g>
<path d="M40 14c0-5 3-8 7-9" stroke="#6b4423" stroke-width="3.5" fill="none" stroke-linecap="round"/>${hl(25, 26, 3, 7, 15)}`);

const cbean = (x: number, y: number, rot: number): string => `<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="11" ry="15" fill="#6b3e1e"/><path d="M${x} ${y - 13}q-5 13 0 26" stroke="#3d2210" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="${x - 5}" cy="${y - 7}" rx="2" ry="4" fill="#fff" opacity=".3"/></g>`;
const coffeebean = (): string => ic(`${sh(20)}${cbean(23, 34, -25)}${cbean(43, 38, 15)}`);

const sesame = (): string => ic(`${sh(22)}
<path d="M8 30h48c0 14-9 24-24 24S8 44 8 30z" fill="#8a5a2b"/><path d="M12 36h40c-2 8-9 14-20 14S14 44 12 36z" fill="#a86a3a" opacity=".6"/>
<ellipse cx="32" cy="30" rx="24" ry="7" fill="#6b4423"/>
<path d="M12 30c4-10 36-10 40 0 0 4-10 6-20 6S12 34 12 30z" fill="#f1dfae"/>
<g fill="#fff8e0" stroke="#c9b27a" stroke-width=".8">${[[16, 30, -20], [22, 26, 10], [28, 24, -30], [34, 23, 20], [40, 25, -10], [46, 29, 25], [20, 32, 30], [26, 30, -15], [32, 29, 10], [38, 30, -25], [44, 32, 15], [24, 34, 20], [30, 34, -20], [36, 34, 10], [42, 35, -15]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.5" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`);

const indigo = (): string => ic(`${sh(12)}
<path d="M32 58c-1-12 0-22 0-32" stroke="#3e9a3c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
${leaf(24, 46, -40, '#5fb85c', 8)}${leaf(40, 42, 40, '#5fb85c', 8)}
${dots('#4b3fd6', [[32, 9, 5], [26, 15, 5], [31, 21, 5.5], [25, 26, 5], [40, 29, 4.5], [28, 33, 5]])}${dots('#6f63ff', [[38, 14, 5], [37, 22, 5], [33, 28, 5.5], [36, 35, 4.5]])}
${dots('#c9c4ff', [[30, 8, 1.5], [24, 14, 1.5], [29, 20, 1.5], [36, 13, 1.5], [23, 25, 1.5], [35, 21, 1.5]])}`);

const boll = (x: number, y: number): string => at(x, y, '<path d="M-11 0l5 12 6-4 6 4 5-12-11 4z" fill="#6b4423"/><g fill="#fff" stroke="#c9d1da" stroke-width="1.4"><circle cx="-5.5" cy="-2" r="6.5"/><circle cx="5.5" cy="-2" r="6.5"/><circle cx="0" cy="-7" r="6.5"/><circle cx="0" cy="3" r="6.5"/></g><circle cx="0" cy="-2" r="5" fill="#fff"/>');
const cotton = (): string => ic(`${sh(16)}<path d="M32 58c0-12 1-22 0-34M32 40c-6-4-10-10-12-16M32 36c6-4 10-8 12-14" stroke="#6b4423" stroke-width="3.5" fill="none" stroke-linecap="round"/>${boll(20, 22)}${boll(44, 20)}${boll(32, 40)}`);

const chamomile = (): string => ic(`${sh(12)}
<path d="M32 58c-2-12-1-22 0-32" stroke="#3e9a3c" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M31 46c-5-1-9-5-10-10M33 40c5-1 8-4 10-9" stroke="#5fb85c" stroke-width="3" fill="none" stroke-linecap="round"/>
${petals(32, 22, 12, 10, 4, 8.5, '#fff', ' stroke="#dcdcdc" stroke-width="1"')}
<circle cx="32" cy="22" r="8" fill="#ffd23a"/><circle cx="32" cy="22" r="5" fill="#f2a900" opacity=".6"/>`);

const spear = (x: number, top: number, color: string): string => `<path d="M${x - 4.5} 52V${top + 12}c0-5 3-9 4.5-12 1.5 3 4.5 7 4.5 12V52z" fill="${color}"/><path d="M${x - 3} ${top + 10}l3-4 3 4M${x - 3.5} ${top + 15}l3.5-4 3.5 4" stroke="#7a4f9a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>`;
const asparagus = (): string => ic(`${sh(14)}${spear(22, 10, '#5a9e3a')}${spear(42, 12, '#5a9e3a')}${spear(32, 6, '#6db44a')}<path d="M14 36h36v8H14z" fill="#c98a4a"/><path d="M14 36h36v2H14z" fill="#8a5a2b" opacity=".4"/>`);

const nectar = (): string => ic(`${sh(16, 30)}<path d="M26 58c-2-10 0-18 2-26" stroke="#3e9a3c" stroke-width="3.5" fill="none" stroke-linecap="round"/>${leaf(18, 48, -30, '#5fb85c', 8)}
${petals(28, 26, 5, 11, 6.5, 10, '#ff6fa8')}<circle cx="28" cy="26" r="7" fill="#ffd23a"/>
<path d="M50 34c-5 7-8 11-8 15a8 8 0 0 0 16 0c0-4-3-8-8-15z" fill="#f7b733"/>${hl(47, 47, 2, 4, -10, 0.6)}`);

const berryCluster = (c: string, cd: string): string => {
  const p: [number, number][] = [[26, 27], [38, 27], [20, 35], [32, 34], [44, 35], [24, 43], [40, 43], [32, 50]];
  return ic(`${sh(16)}<g fill="${cd}">${p.map(([x, y]) => `<circle cx="${x}" cy="${y + 1.5}" r="7"/>`).join('')}</g><g fill="${c}">${p.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join('')}</g>
<g fill="#fff" opacity=".6">${p.map(([x, y]) => `<circle cx="${x - 2.5}" cy="${y - 2.5}" r="1.7"/>`).join('')}</g>
${calyx(32, 21, 9, [-80, -40, 0, 40, 80])}<path d="M32 22v-8" stroke="#3e9a3c" stroke-width="3" stroke-linecap="round"/>`);
};

const blueberry = (): string => {
  const b = (x: number, y: number, r: number, c: string): string => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/><circle cx="${x}" cy="${y - r * 0.6}" r="${r * 0.28}" fill="#2a44a8"/>${hl(x - r * 0.4, y - r * 0.3, r * 0.2, r * 0.35)}`;
  return ic(`${sh(20)}<path d="M38 20c-2-4-5-7-9-9" stroke="#6b4423" stroke-width="3" fill="none" stroke-linecap="round"/>${leaf(46, 14, 30, '#5fb85c', 9)}
${b(33, 26, 11, '#5a7ff0')}${b(21, 41, 12, '#3f5fd0')}${b(43, 43, 12, '#4a6fe0')}`);
};

// --- mine ------------------------------------------------------------------

const nugget = '<path d="M-6 -2l4-5 7 1 3 5-3 5h-8z"/>';
const ore = (nug: string, nugLight: string): string => ic(`${sh(22)}
<path d="M8 50l6-22 16-12 20 4 8 20-6 16H14z" fill="#8f9aa8"/><path d="M14 28l16-12 20 4-14 6-10 12-16 2z" fill="#b8c2cf"/><path d="M36 26l14 4-6 14-8 12H14z" fill="#7d8794" opacity=".5"/>
<g fill="${nug}">${at(22, 40, nugget)}${at(40, 33, nugget, 1.1)}${at(42, 48, nugget, 0.8)}${at(27, 52, nugget, 0.7)}</g>
<g fill="${nugLight}">${at(22, 40, '<path d="M-6 -2l4-5 7 1-5 4z"/>')}${at(40, 33, '<path d="M-6 -2l4-5 7 1-5 4z"/>', 1.1)}${at(42, 48, '<path d="M-6 -2l4-5 7 1-5 4z"/>', 0.8)}</g>`);

const coal = (): string => ic(`${sh(22)}
<path d="M8 50l6-22 16-12 20 4 8 20-6 16H14z" fill="#2b2b33"/><path d="M14 28l16-12 20 4-14 6-10 12-16 2z" fill="#45454f"/><path d="M30 36l14-6 6 12-8 10z" fill="#1a1a20"/>
<path d="M20 25l8-6M38 23l6 3" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>`);

/** A 2:1 isometric ingot (top lightest, left lit, right shaded). */
const bar = (top: string, left: string, right: string, stamp: string): string => ic(`${sh(22, 34, 48)}
<polygon points="12,36 28,44 28,28 20,24" fill="${left}"/><polygon points="28,44 56,30 48,18 28,28" fill="${right}"/><polygon points="28,28 48,18 40,14 20,24" fill="${top}"/>
<ellipse cx="34" cy="21" rx="6" ry="2.5" fill="${stamp}" opacity=".4" transform="rotate(-27 34 21)"/>
<path d="M22 25l16-8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`);

// --- bottles & jars --------------------------------------------------------

const bottle = (glass: string, liquid: string, cap: string, label: string, decal: string): string => ic(`${sh(14)}
<path d="M23 6h18v10l6 10v30a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V26l6-10z" fill="${glass}"/>
<path d="M19 30h26v26a2 2 0 0 1-2 2H21a2 2 0 0 1-2-2z" fill="${liquid}"/>
<rect x="22" y="4" width="20" height="8" rx="3" fill="${cap}"/>
<rect x="19" y="34" width="26" height="14" rx="2" fill="${label}"/>${at(32, 41, decal, 0.8)}
<path d="M22 28v26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`);

const juice = (liquid: string, light: string, decal: string, cap = '#6b4423'): string => ic(`${sh(12)}
<rect x="25" y="4" width="14" height="8" rx="2" fill="${cap}"/>
<path d="M26 10h12v8l6 8v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V26l6-8z" fill="${light}"/>
<path d="M20 28h24v28a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="${liquid}"/>
<rect x="20" y="34" width="24" height="16" rx="2" fill="#fff8e8"/>${at(32, 42, decal, 0.85)}
<path d="M23 24v30" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>`);

const jar = (content: string, lid: string, decal: string, extra = '', label = '#fff8e8'): string => ic(`${sh(16)}
<path d="M16 20h32v32a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="${content}"/>
<rect x="13" y="10" width="38" height="12" rx="4" fill="${lid}"/><path d="M20 10v12M28 10v12M36 10v12M44 10v12" stroke="#fff" stroke-width="2.5" opacity=".45"/>
<rect x="16" y="22" width="32" height="4" fill="#000" opacity=".15"/>
<rect x="20" y="31" width="24" height="20" rx="3" fill="${label}"/>${at(32, 41, decal)}
<path d="M19 28v24" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>${extra}`);

// --- bakery & dairy --------------------------------------------------------

const muffin = (top: string, dot: string): string => ic(`${sh(18)}
<path d="M17 36l4 20h22l4-20z" fill="#c98a4a"/><path d="M23 38l2 17M32 38v17M41 38l-2 17" stroke="#a86a3a" stroke-width="2.5"/>
<path d="M12 36c0-14 9-22 20-22s20 8 20 22c0 2-1 3-3 3H15c-2 0-3-1-3-3z" fill="${top}"/>
${dots(dot, [[24, 26, 3], [35, 20, 3], [43, 30, 3], [30, 33, 2.6], [20, 34, 2.4], [38, 36, 2.4]])}${hl(23, 22, 3, 5)}`);

const pie = (fill: string, topping: string, lattice = false): string => {
  const scallops = Array.from({ length: 14 }, (_, k) => { const a = (k / 14) * Math.PI * 2; return `<circle cx="${(32 + 23 * Math.cos(a)).toFixed(1)}" cy="${(30 + 8.5 * Math.sin(a)).toFixed(1)}" r="3"/>`; }).join('');
  return ic(`${sh(26, 32, 58)}
<path d="M6 36v4c0 8 12 14 26 14s26-6 26-14v-4z" fill="#b05a2a"/><ellipse cx="32" cy="36" rx="26" ry="9" fill="#d16d33"/>
<ellipse cx="32" cy="33" rx="23" ry="8.5" fill="#c47a2e"/><ellipse cx="32" cy="30" rx="23" ry="8.5" fill="#e6a94c"/>
<ellipse cx="32" cy="30" rx="17" ry="5.5" fill="${fill}"/>
${lattice ? '<path d="M21 26l5 9M28 25l4 11M36 25l4 11M44 26l3 7M15 30h34M18 33h28" stroke="#e6a94c" stroke-width="2.8" stroke-linecap="round"/>' : ''}
<g fill="#f3c06a">${scallops}</g>${at(32, 29, topping, 0.8)}`);
};

const cake = (body: string, frost: string, topping: string, band = '#fff'): string => ic(`${sh(26, 32, 58)}
<ellipse cx="32" cy="50" rx="27" ry="7" fill="#fff" stroke="#dfe3e8" stroke-width="1.5"/>
<path d="M10 28v18c0 5 10 8 22 8s22-3 22-8V28z" fill="${body}"/>
<path d="M10 38c0 5 10 8 22 8s22-3 22-8" stroke="${band}" stroke-width="3" fill="none" opacity=".8"/>
<ellipse cx="32" cy="28" rx="22" ry="8" fill="${frost}"/>
<g fill="${frost}"><rect x="12" y="30" width="6" height="12" rx="3"/><rect x="24" y="33" width="6" height="9" rx="3"/><rect x="38" y="33" width="6" height="11" rx="3"/><rect x="48" y="30" width="6" height="8" rx="3"/></g>
${at(32, 25, topping)}`);

const pizza = (toppings: string): string => ic(`${sh(26, 32, 58)}
<circle cx="32" cy="33" r="26" fill="#c98a4a"/><circle cx="32" cy="31" r="26" fill="#e6a94c"/>
<circle cx="32" cy="31" r="21" fill="#d9342b"/><circle cx="32" cy="31" r="19" fill="#ffd23a"/>
${dots('#ffe680', [[24, 24, 4], [40, 38, 5], [38, 22, 3], [22, 38, 3.5]])}
<path d="M32 12v38M13 31h38M18.5 17.5l27 27M45.5 17.5l-27 27" stroke="#e6a94c" stroke-width="1.5" opacity=".6"/>${toppings}`);

const puff = (x: number, y: number, s = 1): string => at(x, y, '<circle cx="-4" cy="1" r="5"/><circle cx="4" cy="1" r="5"/><circle cx="0" cy="-4" r="5"/><circle cx="0" cy="3" r="4"/>', s);
const popcorn = (kernel: string, tint: string, extra: string): string => ic(`${sh(18)}
<path d="M15 30l4 28h26l4-28z" fill="#fff"/><path d="M15 30h6.8L24.2 58H19zM28.6 30h6.8L34.6 58h-5.2zM42.2 30H49l-4 28h-5.2z" fill="#e8413c"/>
<g fill="${kernel}" stroke="${tint}" stroke-width="1.2">${puff(18, 22, 0.9)}${puff(29, 17)}${puff(41, 16)}${puff(50, 24, 0.85)}${puff(23, 30, 0.9)}${puff(35, 27, 1.05)}${puff(46, 31, 0.9)}</g>
<path d="M13 28h38l-1 5H14z" fill="#e8413c"/>${extra}`);

// --- clothes ---------------------------------------------------------------

const sweater = (color: string, dark: string, stripes = ''): string => ic(`${sh(22)}
<path d="M22 12l10-5 10 5 14 10-6 8-6-3v29H20V27l-6 3-6-8z" fill="${color}"/>${stripes}
<path d="M14 30l6-3M50 30l-6-3" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/>
<path d="M20 50h24" stroke="${dark}" stroke-width="2" opacity=".5"/><path d="M22 53v3M26 53v3M30 53v3M34 53v3M38 53v3M42 53v3" stroke="${dark}" stroke-width="1.5" opacity=".5"/>
<ellipse cx="32" cy="12" rx="8" ry="4" fill="${dark}"/>`);

const mugShape = (mug: string, dark: string, liquid: string, edge: string): string => `<path d="M46 30h4a7 7 0 0 1 0 14h-4" fill="none" stroke="${edge}" stroke-width="7"/><path d="M46 30h4a7 7 0 0 1 0 14h-4" fill="none" stroke="${mug}" stroke-width="4"/>
<path d="M14 24h32v26a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" fill="${mug}" stroke="${edge}" stroke-width="1.8"/>
<ellipse cx="30" cy="24" rx="16" ry="5" fill="${dark}"/><ellipse cx="30" cy="24" rx="13" ry="3.8" fill="${liquid}"/>`;
const mug = (mugColor: string, dark: string, liquid: string, topping: string, edge = '#b8c4d0'): string => ic(`${sh(20)}${mugShape(mugColor, dark, liquid, edge)}${topping}${hl(19, 38, 2, 8, 0, 0.35)}`);

const soup = (liquid: string, stripe: string, garnish: string): string => ic(`${sh(24, 32, 58)}
<path d="M8 32h48c0 12-9 22-24 22S8 44 8 32z" fill="#fff" stroke="#dfe3e8" stroke-width="1.5"/><path d="M10 40q22 6 44 0" stroke="${stripe}" stroke-width="3.5" fill="none"/>
<ellipse cx="32" cy="32" rx="24" ry="7" fill="#e8edf2"/><ellipse cx="32" cy="32" rx="20" ry="5.5" fill="${liquid}"/>
${garnish}${steam(24)}${steam(36)}`);

const cone = (scoop: string, bits: string): string => ic(`${sh(10, 32)}
<path d="M18 32l14 28 14-28z" fill="#d9a05b"/><path d="M20 38h24M24 46h16M28 54h8M22 34l10 24M42 34L32 58" stroke="#b97a2c" stroke-width="1.5" opacity=".7"/>
<ellipse cx="32" cy="32" rx="15" ry="4" fill="#c48a44"/>
<path d="M19 28c-1 5 0 9 2 10s3-4 2-10M41 29c0 5 1 8 3 8s2-4 1-9" fill="${scoop}"/><circle cx="32" cy="22" r="15" fill="${scoop}"/>
${bits}${hl(25, 15, 3, 5)}`);

const chunk = (x: number, y: number, c: string, cd: string, w = 16, h = 14): string => `<g transform="rotate(-45 ${x} ${y})"><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="3" fill="${c}"/><rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="5" rx="2" fill="${cd}" opacity=".45"/></g>`;
const skewer = (chunks: string): string => ic(`${sh(22)}<path d="M8 58L56 10" stroke="#c98a4a" stroke-width="3.5" stroke-linecap="round"/>${chunks}<path d="M50 16l6-6" stroke="#8a5a2b" stroke-width="3.5" stroke-linecap="round"/>`);

const burger = (patty: string, sauce: string): string => ic(`${sh(24, 32, 58)}
<path d="M12 46h40v4a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" fill="#e6a94c"/>${patty}
${sauce}
<path d="M9 35q4-5 8 0t8 0 8 0 8 0 8 0 6 0v4H9z" fill="#5fb85c"/><rect x="13" y="30" width="38" height="6" rx="3" fill="#e8413c"/>
<path d="M11 32c0-13 9-20 21-20s21 7 21 20z" fill="#e6a94c"/>
<g fill="#fff8e0"><ellipse cx="22" cy="22" rx="2" ry="1.3"/><ellipse cx="32" cy="18" rx="2" ry="1.3"/><ellipse cx="42" cy="22" rx="2" ry="1.3"/><ellipse cx="27" cy="27" rx="2" ry="1.3"/><ellipse cx="38" cy="27" rx="2" ry="1.3"/></g>${hl(22, 20, 4, 6)}`);

// ---------------------------------------------------------------------------
// One-off icons

const milk = bottle('#e9f1f8', '#fff', '#e8413c', '#3b7fd9', dDrop('#fff'));
const goatmilk = bottle('#f3efe3', '#fff5dc', '#5a9e3a', '#5a9e3a', dHorns);

const bacon = (): string => {
  const strip = (y: number): string => `<path d="M12 ${y}q8-8 16 0t16 0 8 0" stroke="#c0392b" stroke-width="9"/><path d="M12 ${y}q8-8 16 0t16 0 8 0" stroke="#f5b8a0" stroke-width="2.5"/>`;
  return ic(`${sh(22)}<g transform="rotate(-20 32 34)" fill="none" stroke-linecap="round">${strip(20)}${strip(34)}${strip(48)}</g>`);
};

const wool = (): string => ic(`${sh(22)}
<g fill="#f8f1e2" stroke="#d2c4a4" stroke-width="2"><circle cx="18" cy="30" r="8"/><circle cx="46" cy="30" r="8"/><circle cx="24" cy="18" r="8"/><circle cx="40" cy="18" r="8"/><circle cx="32" cy="14" r="7"/><circle cx="20" cy="44" r="8"/><circle cx="44" cy="44" r="8"/><circle cx="32" cy="50" r="7"/><circle cx="32" cy="34" r="20"/></g>
<circle cx="32" cy="34" r="19" fill="#f8f1e2"/>
<g stroke="#cdbf9e" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M16 28c10-6 22-6 32 0M14 36c12-8 24-8 36 0M18 44c10-6 18-6 28 0"/></g>
<path d="M44 46c6 4 10 8 12 12" stroke="#cdbf9e" stroke-width="3" fill="none" stroke-linecap="round"/>${hl(24, 24, 3, 5, -30, 0.8)}`);

const lambskewer = skewer(`${chunk(18, 48, '#a0522d', '#5a2a10')}${chunk(28, 38, '#fff4e0', '#d8c8a8', 14, 12)}${chunk(38, 28, '#b85c32', '#5a2a10')}${chunk(47, 19, '#5fb85c', '#2e7a2a', 12, 12)}`);
const lobsterskewer = skewer(`${chunk(18, 48, '#ff6b3d', '#c9342a')}${chunk(28, 38, '#ffd23a', '#e0a04a', 12, 12)}${chunk(38, 28, '#ff6b3d', '#c9342a')}${chunk(47, 19, '#e8413c', '#a8201a', 10, 12)}<path d="M14 50l6-6M34 30l6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`);

const honeycomb = (): string => {
  const c: [number, number][] = [[32, 32], [45.9, 32], [18.1, 32], [38.9, 20], [25.1, 20], [38.9, 44], [25.1, 44]];
  return ic(`${sh(22)}<g fill="#e0921a">${c.map(([x, y]) => `<polygon points="${hexPts(x, y, 7.8)}"/>`).join('')}</g><g fill="#ffd23a">${c.map(([x, y]) => `<polygon points="${hexPts(x, y, 4.8)}"/>`).join('')}</g>
<path d="M20 50c0 4-2 7 0 9s3-4 0-9M44 50c0 4-2 8 0 10s3-5 0-10" fill="#f2a900"/>${hl(24, 16, 2, 3, -30, 0.7)}`);
};

const fishfillet = (): string => ic(`${sh(24, 32, 58)}
<path d="M6 38c4-14 20-24 46-20 4 8 0 20-10 26C30 51 12 50 6 38z" fill="#d9775a"/>
<path d="M8 38c4-12 18-22 42-18 3 7-1 18-10 23C30 48 14 48 8 38z" fill="#ff9a78"/>
<g stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"><path d="M18 30c4 4 5 10 3 14M28 25c4 5 5 11 3 16M38 22c4 5 5 10 3 15"/></g>`);

const lobstertail = (): string => ic(`${sh(24, 32, 58)}<g fill="#ff5a3c" stroke="#c9342a" stroke-width="1.5">
<rect x="6" y="22" width="16" height="26" rx="8"/><rect x="16" y="23" width="15" height="24" rx="7"/><rect x="25" y="24" width="13" height="22" rx="6.5"/><rect x="32" y="25" width="11" height="20" rx="5.5"/>
<g transform="translate(42 35)"><ellipse cx="9" cy="0" rx="9" ry="4" transform="rotate(-50)"/><ellipse cx="9" cy="0" rx="9" ry="4" transform="rotate(50)"/><ellipse cx="9" cy="0" rx="9" ry="4" transform="rotate(-25)"/><ellipse cx="9" cy="0" rx="9" ry="4" transform="rotate(25)"/><ellipse cx="10" cy="0" rx="10" ry="4"/></g></g>
<path d="M10 28c4-2 8-2 10 0M20 29c3-2 7-2 9 0M29 30c3-2 5-2 7 0" stroke="#fff" stroke-width="2" opacity=".55" fill="none" stroke-linecap="round"/>`);

const duckfeather = (): string => ic(`${sh(18, 34)}
<path d="M14 54C18 38 30 22 52 8c0 18-12 36-36 48z" fill="#fff" stroke="#cfd6de" stroke-width="1.5"/>
<path d="M30 36C36 26 44 18 50 12c-2 12-8 22-18 30z" fill="#dbe6f0" opacity=".8"/>
<path d="M16 52C22 40 34 26 50 12" stroke="#b8c2cf" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M14 54l-5 6" stroke="#d9bf8f" stroke-width="3" stroke-linecap="round"/>
<g stroke="#e3e9ef" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M22 46l7 2M28 38l8 2M35 30l7 1M41 23l6-1"/></g>`);

const cookie = (): string => ic(`${sh(22)}<circle cx="32" cy="34" r="22" fill="#c98a4a"/><circle cx="32" cy="32" r="21" fill="#e0a862"/>
<g fill="#5a2d0c"><ellipse cx="22" cy="26" rx="3.5" ry="2.8"/><ellipse cx="38" cy="22" rx="3.5" ry="2.8"/><ellipse cx="44" cy="36" rx="3.5" ry="2.8"/><ellipse cx="28" cy="40" rx="3.5" ry="2.8"/><ellipse cx="34" cy="31" rx="3" ry="2.4"/><ellipse cx="18" cy="38" rx="3" ry="2.4"/><ellipse cx="38" cy="45" rx="2.6" ry="2"/></g>${hl(22, 20, 5, 3, -30, 0.35)}`);

const potatobread = (): string => ic(`${sh(22)}<path d="M8 40c0-13 11-22 24-22s24 9 24 22v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#b97a2c"/>
<path d="M10 40c0-12 10-20 22-20s22 8 22 20v6H10z" fill="#d8a35a"/>
<path d="M18 31c6-5 10-5 14-1M31 27c5-4 10-4 14 0" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".55"/>
<g transform="rotate(-20 47 50)"><ellipse cx="47" cy="50" rx="11" ry="7.5" fill="#b8864b"/>${dots('#8a5a2b', [[43, 48, 1.6], [51, 51, 1.6]])}</g>`);

const cream = (): string => ic(`${sh(20)}<path d="M14 32h36l-3 20a6 6 0 0 1-6 4H23a6 6 0 0 1-6-4z" fill="#fff" stroke="#b8c4d0" stroke-width="2"/>
<path d="M15 41h34" stroke="#5ea3ff" stroke-width="3.5"/><ellipse cx="32" cy="32" rx="18" ry="5" fill="#dfe6ee"/>${swirl(32, 31, '#fffdf5', '#d8ccb0', 1.1)}`);

const cheese = (): string => ic(`${sh(24, 32, 58)}<polygon points="6,34 38,14 58,28 58,48 6,52" fill="#f2b705"/><polygon points="6,34 38,14 58,28" fill="#ffe066"/>
<polygon points="6,34 58,28 58,48 6,52" fill="#f2b705"/><path d="M6 34L58 28" stroke="#e0960a" stroke-width="1.5"/>
${dots('#e0960a', [[20, 44, 3.5], [34, 40, 3], [48, 38, 3.5], [40, 46, 2.2], [26, 36, 2]])}${dots('#fff3b0', [[30, 22, 2.5], [44, 26, 2]])}`);

const goatcheese = (): string => ic(`${sh(22)}<path d="M10 30v14c0 5 10 9 22 9s22-4 22-9V30z" fill="#ebe2c8" stroke="#cfc3a2" stroke-width="1.8"/><ellipse cx="32" cy="30" rx="22" ry="8" fill="#fffaec" stroke="#cfc3a2" stroke-width="1.8"/>
<path d="M12 40c6 3 34 3 40 0" stroke="#5a9e3a" stroke-width="3" fill="none" opacity=".7"/>
${dots('#5fb85c', [[22, 28, 1.6], [34, 26, 1.6], [42, 31, 1.6], [28, 33, 1.4], [38, 34, 1.4]])}<path d="M40 24c3-5 8-7 13-6" stroke="#3e9a3c" stroke-width="2.5" fill="none" stroke-linecap="round"/>${hl(22, 28, 5, 2, -10, 0.6)}`);

const whitesugar = (): string => {
  const p = isoAt(38, 50);
  const c = { l: '#eef2f7', r: '#c9d2dc', t: '#fff' };
  return ic(`${sh(24, 34, 54)}<ellipse cx="34" cy="47" rx="26" ry="8" fill="#cfe0f5" stroke="#a9bdd6" stroke-width="1.5"/>
<g stroke="#a9b6c4" stroke-width="1" stroke-linejoin="round">${isoBox(p, 0, 16, 0, 14, 14, 14, c)}${isoBox(p, 0, 0, 0, 14, 14, 14, c)}${isoBox(p, 0, 8, 14, 14, 14, 14, c)}</g>
<g fill="#fff"><path d="M14 20l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/><path d="M54 30l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/></g>`);
};

const syrup = juice('#e08a1e', '#f5c66b', dDrop('#f2a900'), '#8a5a2b');

const casserole = (): string => ic(`${sh(24, 32, 58)}<ellipse cx="10" cy="40" rx="6" ry="4" fill="#a8301f"/><ellipse cx="54" cy="40" rx="6" ry="4" fill="#a8301f"/>
<path d="M10 34h44v14a6 6 0 0 1-6 6H16a6 6 0 0 1-6-6z" fill="#c0392b"/><ellipse cx="32" cy="34" rx="22" ry="7" fill="#a8301f"/>
<ellipse cx="32" cy="32" rx="19" ry="6" fill="#f2b705"/><ellipse cx="32" cy="32" rx="19" ry="6" fill="none" stroke="#d9772b" stroke-width="2"/>
<g fill="#f5d9a0"><ellipse cx="22" cy="30" rx="5" ry="2"/><ellipse cx="40" cy="29" rx="5" ry="2"/></g>${dots('#e08a1e', [[27, 33, 2.2], [36, 34, 1.8], [44, 31, 2]])}${steam(22)}${steam(40)}`);

const bakedpotato = (): string => ic(`${sh(22)}${potatoShape('#b8864b')}${dots('#8a5a2b', [[20, 38, 1.6], [46, 30, 1.6], [44, 46, 1.4]])}
<path d="M19 33c3-8 23-8 26 0 0 7-6 11-13 11s-13-4-13-11z" fill="#fff5dc"/><ellipse cx="32" cy="35" rx="7" ry="4" fill="#fff"/>
<rect x="29" y="30" width="7" height="5" rx="1" fill="#ffd23a"/>
<g stroke="#3e9a3c" stroke-width="1.8" stroke-linecap="round"><path d="M23 35l3-3M39 34l3-2M30 41l2 2M36 40l3 1"/></g>`);

const roastedtomatoes = (): string => {
  const half = (x: number, y: number): string => at(x, y, `<circle r="9" fill="#d9342b"/><circle r="6" fill="#ff7a5c"/>${dots('#ffd23a', [[-2.5, -1.5, 1.2], [2.5, -1.5, 1.2], [0, 3, 1.2]])}<path d="M-5 -5l10 10" stroke="#8a2a1a" stroke-width="1.6" opacity=".6"/>`);
  return ic(`${sh(26, 32, 58)}${plate(42)}${half(20, 36)}${half(44, 38)}${half(32, 28)}<path d="M48 22c2-5 6-7 10-5" stroke="#3e9a3c" stroke-width="3" fill="none" stroke-linecap="round"/>`);
};

const fishchips = (): string => ic(`${sh(22)}
<g fill="#ffd23a" stroke="#e0a04a" stroke-width="1"><rect x="16" y="12" width="6" height="26" rx="2" transform="rotate(-14 19 25)"/><rect x="24" y="8" width="6" height="30" rx="2" transform="rotate(-4 27 23)"/><rect x="32" y="10" width="6" height="28" rx="2" transform="rotate(8 35 24)"/><rect x="40" y="14" width="6" height="24" rx="2" transform="rotate(18 43 26)"/></g>
<path d="M12 34h40l-4 22H16z" fill="#e8d8b0"/><path d="M12 34h40v4H12z" fill="#d4c196"/>
<g transform="rotate(-10 32 46)"><path d="M46 46l9-5-2 5 2 5z" fill="#e0a04a"/><ellipse cx="32" cy="46" rx="15" ry="7" fill="#e0a04a"/><ellipse cx="32" cy="46" rx="11" ry="4.5" fill="#f0c070" opacity=".6"/></g>`);

const baconeggs = (): string => {
  const strip = (x: number, y: number, rot: number): string => `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - 14} ${y}q7-6 14 0t14 0" stroke="#c0392b" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x - 14} ${y}q7-6 14 0t14 0" stroke="#f5b8a0" stroke-width="2" fill="none"/></g>`;
  return ic(`${sh(26, 32, 58)}${plate(42, 28, 12)}${strip(20, 34, -30)}${strip(24, 44, -30)}
<path d="M28 30c8-7 20-5 22 3 2 8-6 13-14 11s-14-7-8-14z" fill="#fff" stroke="#e8e0d0" stroke-width="1.5"/><circle cx="39" cy="36" r="6" fill="#ffd23a"/>${hl(37, 34, 1.5, 2.5, -30, 0.9)}`);
};

const hamburger = burger('<rect x="10" y="40" width="44" height="8" rx="4" fill="#7a3d16"/>', '<path d="M11 36h42l-3 7H14z" fill="#ffd23a"/>');
const fishburger = burger('<rect x="10" y="40" width="44" height="8" rx="4" fill="#e0a04a"/><path d="M53 44l8-5-1 5 1 5z" fill="#e0a04a"/>', '<path d="M11 36h42l-3 7H14z" fill="#fffdf0"/>');

const lambdonerwrap = (): string => ic(`${sh(16)}
<g><circle cx="22" cy="24" r="7" fill="#5fb85c"/><circle cx="42" cy="24" r="7" fill="#5fb85c"/><rect x="18" y="16" width="12" height="7" rx="3" fill="#8a4a2a" transform="rotate(-20 24 20)"/><rect x="34" y="14" width="12" height="7" rx="3" fill="#a0522d" transform="rotate(15 40 18)"/><circle cx="32" cy="21" r="6" fill="#e8413c"/><circle cx="32" cy="21" r="3" fill="#ff7a5c"/></g>
<path d="M14 26l10 32h16l10-32z" fill="#e6c98a"/><path d="M14 26h36l-2 6H16z" fill="#d4b06a"/>
<path d="M18 42l5 16h18l5-16z" fill="#fff"/><path d="M19 46h26" stroke="#e8413c" stroke-width="3"/>`);

const espresso = (): string => ic(`${sh(22, 30, 58)}<ellipse cx="30" cy="51" rx="24" ry="6" fill="#fff" stroke="#dfe3e8" stroke-width="1.5"/>
<path d="M44 32h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#dfe3e8" stroke-width="5"/><path d="M44 32h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#fff" stroke-width="2.5"/>
<path d="M16 28h28v12a9 9 0 0 1-9 9H25a9 9 0 0 1-9-9z" fill="#fff" stroke="#dfe3e8" stroke-width="1.5"/>
<ellipse cx="30" cy="28" rx="14" ry="4.5" fill="#c98a4a"/><ellipse cx="30" cy="28" rx="11" ry="3.2" fill="#3d2210"/>${steam(26)}${steam(34)}`);

const caffelatte = (): string => ic(`${sh(18, 31)}
<path d="M46 26h3a7 7 0 0 1 0 14h-4" fill="none" stroke="#cfd6de" stroke-width="5"/>
<path d="M17 14h30l-3 42a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#e9f1f8"/>
<path d="M19 40h26l-2 16a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="#6b3e1e"/><path d="M18 26h28l-1 14H19z" fill="#c99a6b"/>
<path d="M17 14h30l-1 12H18z" fill="#fff5e0"/><ellipse cx="32" cy="14" rx="15" ry="4.5" fill="#fff8ec"/>
<path d="M32 10c-3 2-3 5 0 7 3-2 3-5 0-7z" fill="#c98a4a"/>${hl(22, 36, 1.8, 14, 0, 0.5)}`);

const caffemocha = mug('#fff', '#5a2d0c', '#3d2210', `${swirl(30, 22, '#fff', '#e6dcc0', 1.1)}<path d="M22 16c4-3 12-3 16 0M24 11c3-2 9-2 12 0" stroke="#5a2d0c" stroke-width="2" fill="none" stroke-linecap="round"/>`);
const raspberrymocha = mug('#fff', '#5a2d0c', '#3d2210', `${swirl(30, 22, '#ffd0de', '#f2a7bf', 1.1)}${at(30, 8, dBerryCluster('#e8366e'), 0.9)}`);
const hotchocolate = mug('#e8413c', '#4a2210', '#6b3e1e', `<g fill="#fff" stroke="#e8e0d0" stroke-width="1"><rect x="18" y="18" width="10" height="7" rx="2"/><rect x="30" y="16" width="10" height="7" rx="2"/><rect x="24" y="12" width="10" height="7" rx="2"/></g>${steam(42)}`, '#b8281e');

const cherrypopsicle = (): string => ic(`${sh(12)}<rect x="29" y="42" width="6" height="18" rx="3" fill="#d9a05b"/>
<rect x="17" y="4" width="30" height="42" rx="13" fill="#b8102f"/><rect x="17" y="4" width="30" height="36" rx="13" fill="#e8213f"/>
<path d="M17 28h30v6H17z" fill="#b8102f" opacity=".3"/>${at(32, 22, dCherry, 1.1)}${hl(22, 14, 2, 6, 0, 0.55)}`);

const fishinglure = (): string => ic(`${sh(14, 30)}
<path d="M30 10v32a9 9 0 0 1-18 0" fill="none" stroke="#8f9aa8" stroke-width="4" stroke-linecap="round"/><path d="M12 42l-4 5h7z" fill="#8f9aa8"/>
<circle cx="30" cy="7" r="3.5" fill="none" stroke="#8f9aa8" stroke-width="2.5"/>
<g stroke-width="3" stroke-linecap="round" fill="none"><path d="M34 38c-2 8 0 12-4 18" stroke="#ffd23a"/><path d="M36 38c2 8 2 12 6 18" stroke="#e8413c"/><path d="M34 38c0 8-1 12-1 19" stroke="#5ea3ff"/></g>
<ellipse cx="34" cy="26" rx="8" ry="15" fill="#e8413c"/><path d="M26 26h16" stroke="#ffd23a" stroke-width="5"/><path d="M27 20h14" stroke="#fff" stroke-width="2" opacity=".5"/>${hl(31, 16, 2, 4)}`);

const fishingnet = (): string => ic(`<defs><clipPath id="c-fishingnet"><circle cx="26" cy="28" r="19"/></clipPath></defs>${sh(22)}
<path d="M40 40L58 58" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M42 42L56 56" stroke="#c98a4a" stroke-width="2" stroke-linecap="round"/>
<circle cx="26" cy="28" r="20" fill="#cfe9ff" opacity=".7"/>
<g clip-path="url(#c-fishingnet)" stroke="#4a7fb8" stroke-width="1.5" fill="none" opacity=".8"><path d="M0 10l40 40M0 20l40 40M0 0l40 40M10 0l40 40M20 0l30 30M-10 10l40 40M0 30l30 30"/><path d="M50 10L10 50M50 20L10 60M50 0L10 40M40 0L0 40M30 0L0 30M60 10L20 50M50 30L20 60"/></g>
<circle cx="26" cy="28" r="20" fill="none" stroke="#8f9aa8" stroke-width="4"/>`);

const beeswax = (): string => ic(`${sh(24, 32, 58)}<polygon points="8,24 18,14 56,14 46,24" fill="#ffe08a"/><polygon points="46,24 56,14 56,44 46,54" fill="#d9a21a"/><rect x="8" y="24" width="38" height="30" fill="#f5c542"/>
<g fill="none" stroke="#d9a21a" stroke-width="1.6"><polygon points="${hexPts(20, 34, 6)}"/><polygon points="${hexPts(31, 40, 6)}"/><polygon points="${hexPts(20, 46, 6)}"/><polygon points="${hexPts(34, 28, 6)}"/></g>${hl(14, 20, 4, 1.6, -25, 0.7)}`);

const bracelet = (): string => ic(`${sh(24, 32, 56)}<ellipse cx="32" cy="36" rx="22" ry="13" fill="none" stroke="#c77d00" stroke-width="9"/>
<ellipse cx="32" cy="36" rx="22" ry="13" fill="none" stroke="#ffd23a" stroke-width="5"/><ellipse cx="32" cy="36" rx="22" ry="13" fill="none" stroke="#e3eaf2" stroke-width="5" stroke-dasharray="9 9"/>
<ellipse cx="32" cy="36" rx="22" ry="13" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/><path d="M14 10l1.4 3.6L19 15l-3.6 1.4L14 20l-1.4-3.6L9 15l3.6-1.4z" fill="#fff"/>`);

const necklace = (): string => ic(`${sh(16, 32, 60)}<path d="M12 6c0 22 8 34 20 36 12-2 20-14 20-36" fill="none" stroke="#c77d00" stroke-width="4.5" stroke-linecap="round"/><path d="M12 6c0 22 8 34 20 36 12-2 20-14 20-36" fill="none" stroke="#ffd23a" stroke-width="2.5" stroke-dasharray="3 2.5" stroke-linecap="round"/>
<path d="M32 40l-8 9a8 8 0 0 0 16 0z" fill="#b8c7d9"/><path d="M32 40l-8 9h16z" fill="#eef3f8"/><circle cx="32" cy="50" r="3" fill="#ffd23a"/>`);

const diamondring = (): string => ic(`${sh(18, 32, 60)}<circle cx="32" cy="40" r="15" fill="none" stroke="#c77d00" stroke-width="7"/><circle cx="32" cy="40" r="15" fill="none" stroke="#ffd23a" stroke-width="4"/>
<path d="M26 26l-3-3h18l-3 3z" fill="#c77d00"/>
<path d="M22 20l5-9h10l5 9-10 14z" fill="#9fd8ff"/><path d="M22 20h20l-10 14z" fill="#cfefff"/><path d="M27 11l5 9 5-9z" fill="#e8f8ff"/><path d="M22 20l5-9 5 9z" fill="#b6e2ff"/>
<path d="M50 8l1.4 3.6L55 13l-3.6 1.4L50 18l-1.4-3.6L45 13l3.6-1.4z" fill="#fff"/>`);

const ironbracelet = (): string => ic(`${sh(22, 32, 56)}<path d="M12 46A20 20 0 1 1 52 46" fill="none" stroke="#6b7684" stroke-width="10" stroke-linecap="round"/><path d="M12 46A20 20 0 1 1 52 46" fill="none" stroke="#9aa5b3" stroke-width="5" stroke-linecap="round"/>
${dots('#4f5862', [[14, 38, 2], [20, 25, 2], [32, 19, 2], [44, 25, 2], [50, 38, 2]])}<path d="M18 30a16 16 0 0 1 10-10" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`);

const honey = jar('#f2a900', '#c98a4a', dDrop('#f2a900'), '<path d="M44 24L58 6" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/><g fill="#c98a4a" transform="rotate(-52 53 12)"><ellipse cx="53" cy="7" rx="5" ry="2.2"/><ellipse cx="53" cy="12" rx="6" ry="2.4"/><ellipse cx="53" cy="17" rx="5" ry="2.2"/></g><path d="M42 24c0 6-3 9 0 12s3-5 0-12z" fill="#f2a900"/>', '#fff3c4');

const strawberrycandle = (): string => ic(`${sh(16)}<path d="M18 24h28v28a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="#ff8fb0"/>
<ellipse cx="32" cy="24" rx="14" ry="4.5" fill="#ffc6d9"/><path d="M32 22v-6" stroke="#2b2b2b" stroke-width="2"/>
<path d="M32 3c-5 6-6 9-6 12a6 6 0 0 0 12 0c0-3-1-6-6-12z" fill="#ff8a3d"/><path d="M32 9c-2 3-3 5-3 7a3 3 0 0 0 6 0c0-2-1-4-3-7z" fill="#ffd23a"/>
<rect x="21" y="32" width="22" height="16" rx="3" fill="#fff8e8"/>${at(32, 39, dStrawberry, 0.8)}
<path d="M21 28v24" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".5"/>`);

const rusticbouquet = (): string => {
  const daisy = (x: number, y: number, s: number): string => at(x, y, `${petals(0, 0, 9, 6, 2.6, 5.5, '#fff', ' stroke="#dcdcdc" stroke-width=".8"')}<circle r="4" fill="#ffd23a"/>`, s);
  return ic(`${sh(16)}<path d="M22 20c-4 6-8 8-12 10M32 26v10M44 20c4 6 6 8 10 12" stroke="#3e9a3c" stroke-width="3" fill="none" stroke-linecap="round"/>
${leaf(14, 30, -50, '#5fb85c', 6)}${leaf(50, 32, 50, '#5fb85c', 6)}
${petals(32, 24, 5, 7, 4.5, 7, '#ff6fa8')}<circle cx="32" cy="24" r="5" fill="#ffd23a"/>${daisy(19, 18, 1)}${daisy(45, 18, 1)}${daisy(32, 10, 0.9)}
<path d="M14 32h36l-10 26H24z" fill="#c98a4a"/><path d="M14 32h36l-3 8H17z" fill="#a86a3a"/>
<path d="M18 46h28" stroke="#8a5a2b" stroke-width="3"/><path d="M32 46l-5-4 5 2 5-2z" fill="#8a5a2b"/>`);
};

// ---------------------------------------------------------------------------
// The table

const pizzaPlain = `${at(24, 23, '<circle r="4.5" fill="#e8413c"/><circle r="2.5" fill="#ff7a5c"/>')}${at(42, 29, '<circle r="4.5" fill="#e8413c"/><circle r="2.5" fill="#ff7a5c"/>')}${at(28, 41, '<circle r="4.5" fill="#e8413c"/><circle r="2.5" fill="#ff7a5c"/>')}${leaf(35, 33, -30, '#3e9a3c', 4.5)}${leaf(21, 33, 20, '#3e9a3c', 4)}${leaf(40, 43, 40, '#3e9a3c', 4)}`;
const pizzaSpicy = `${at(24, 24, dChili, 0.65)}${at(42, 28, dChili, 0.65)}${at(30, 42, dChili, 0.65)}${dots('#c0392b', [[36, 20, 1.3], [20, 34, 1.3], [40, 40, 1.3], [32, 32, 1.3], [26, 34, 1.1]])}`;
const shrimp = '<path d="M-5 -4c6-2 9 3 5 7-3 3-7 2-8-1" stroke="#ff8a8a" stroke-width="4" fill="none" stroke-linecap="round"/>';
const pizzaSea = `${at(24, 23, shrimp)}${at(40, 40, shrimp)}${at(42, 25, '<ellipse rx="5" ry="3" fill="#2b2b33" transform="rotate(-30)"/><ellipse rx="3" ry="1.5" fill="#f5b8a0" transform="rotate(-30)"/>')}${at(24, 40, '<ellipse rx="5" ry="3" fill="#2b2b33" transform="rotate(20)"/><ellipse rx="3" ry="1.5" fill="#f5b8a0" transform="rotate(20)"/>')}${at(33, 32, '<rect x="-5" y="-3" width="10" height="6" rx="3" fill="#ff5a3c"/>')}`;

const dollop = (x: number, y: number): string => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" stroke="#e6dcc0" stroke-width="1"/>`;
const appleSlices = '<g fill="none" stroke="#e8413c" stroke-width="3" stroke-linecap="round"><path d="M-9 -2a8 8 0 0 1 8-6M-1 -2a8 8 0 0 1 8-6M-4 6a8 8 0 0 1 8-6"/></g>';

export const ITEM_ART: Record<string, string> = {
  // crops
  soybean: soybean(), carrot: carrot(), indigo: indigo(), pumpkin: pumpkin(), cotton: cotton(), chili: chili(), blackbean: blackbean(),
  tomato: tomato('tomato'), strawberry: strawberry(), potato: potato('potato'), chamomile: chamomile(), asparagus: asparagus(), sesame: sesame(),
  // trees & bushes
  apple: apple('apple', '#ff6b5c', '#c9201e'), raspberry: berryCluster('#e8366e', '#b81e52'), cherry: cherry(), blackberry: berryCluster('#4b2a6b', '#2a1640'),
  blueberry: blueberry(), cacao: cacao('cacao'), nectar: nectar(), coffeebean: coffeebean(),
  // mine
  silverore: ore('#e3e9ef', '#fff'), goldore: ore('#f2b705', '#ffe36b'), platinumore: ore('#9fb9dc', '#dbe9fb'), coal: coal(), ironore: ore('#b86a3a', '#d98b55'),
  // animals
  milk, bacon: bacon(), wool: wool(), lambskewer, goatmilk, honeycomb: honeycomb(), fishfillet: fishfillet(), lobstertail: lobstertail(), duckfeather: duckfeather(),
  // bakery
  cookie: cookie(), raspberrymuffin: muffin('#e0a04a', '#e8366e'), blackberrymuffin: muffin('#d9944a', '#3b2152'), blueberrymuffin: muffin('#e0a04a', '#4a6fe0'), potatobread: potatobread(),
  // dairy
  cream: cream(), cheese: cheese(), goatcheese: goatcheese(),
  // grill
  baconeggs: baconeggs(), hamburger, fishburger, roastedtomatoes: roastedtomatoes(), fishchips: fishchips(), lobsterskewer,
  // sugar mill
  whitesugar: whitesugar(), syrup,
  // pie oven
  carrotpie: pie('#ff9b4d', dCarrot), pumpkinpie: pie('#d9772b', dLeafPair), baconpie: pie('#e58a80', '', true), applepie: pie('#f0c070', appleSlices),
  fishpie: pie('#f5e4b0', dFishTail, true), pizza: pizza(pizzaPlain), fetapie: pie('#fff5e0', dots('#5fb85c', [[-5, -2, 1.5], [4, -3, 1.5], [0, 3, 1.5], [7, 2, 1.3], [-7, 3, 1.3]])),
  bakedpotato: bakedpotato(), casserole: casserole(), spicypizza: pizza(pizzaSpicy), fruttidimare: pizza(pizzaSea),
  asparagusquiche: pie('#f5cf5a', '<g stroke="#5a9e3a" stroke-width="3.5" stroke-linecap="round"><path d="M-12 -3h24M-10 3h20"/></g><g fill="#7a4f9a"><circle cx="12" cy="-3" r="2"/><circle cx="10" cy="3" r="2"/></g>'),
  // popcorn pot
  butteredpopcorn: popcorn('#fff8e0', '#f0c070', dots('#ffd23a', [[26, 20, 1.6], [38, 16, 1.6], [45, 26, 1.6], [31, 28, 1.6]])),
  chilipopcorn: popcorn('#fff0e0', '#f0c070', dots('#e8413c', [[22, 20, 1.5], [36, 14, 1.5], [45, 22, 1.5], [30, 27, 1.5], [40, 30, 1.5], [18, 28, 1.3]])),
  honeypopcorn: popcorn('#ffe9a8', '#e0a04a', '<path d="M27 26c-1 4-3 8 0 10s3-6 0-10M44 30c-1 3-2 6 0 8s2-5 0-8" fill="#f2a900"/>'),
  chocolatepopcorn: popcorn('#f3e4d0', '#d9b28a', '<path d="M16 24c8-6 16 4 24-2s8-4 12 0M20 14c6 4 12-4 18 2s8-2 12 2" stroke="#5a2d0c" stroke-width="2.2" fill="none" stroke-linecap="round"/>'),
  // loom & sewing
  sweater: sweater('#f0dcc0', '#b89a78', '<path d="M22 34h20M22 40h20" stroke="#c98a4a" stroke-width="2" stroke-dasharray="3 2"/>'),
  cottonfabric: ic(`${sh(26, 32, 60)}<path d="M8 44c0-4 4-6 8-6h32c4 0 8 2 8 6v8a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#dfe6ee" stroke="#a9b6c4" stroke-width="1.8"/><path d="M10 50h44" stroke="#b8c4d0" stroke-width="1.5"/>
<path d="M10 32c0-4 4-6 8-6h28c4 0 8 2 8 6v8H10z" fill="#fff" stroke="#a9b6c4" stroke-width="1.8"/><path d="M12 36h40" stroke="#c9d1da" stroke-width="1.5"/>
<path d="M12 22c0-4 4-6 8-6h24c4 0 8 2 8 6v6H12z" fill="#eef3f8" stroke="#a9b6c4" stroke-width="1.8"/><path d="M14 24h36" stroke="#b8c4d0" stroke-width="1.5"/>
<path d="M14 18c4-1 8-1 10 2M40 18c4-1 8-1 10 2" stroke="#5ea3ff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>`),
  bluewoollyhat: ic(`${sh(20)}<path d="M14 44c0-20 8-30 18-30s18 10 18 30z" fill="#3b7fd9"/>
<path d="M22 20c-4 6-5 14-5 24M32 16v28M42 20c4 6 5 14 5 24" stroke="#2a5fb0" stroke-width="2" fill="none" opacity=".5"/>
<rect x="11" y="42" width="42" height="13" rx="4" fill="#2f6fc8"/><path d="M17 44v9M23 44v9M29 44v9M35 44v9M41 44v9M47 44v9" stroke="#1f4f98" stroke-width="2" opacity=".5"/>
<circle cx="32" cy="13" r="7" fill="#fff"/>${hl(29, 11, 2, 3, -30, 0.9)}`),
  bluesweater: sweater('#3b7fd9', '#2a5fb0', '<path d="M20 36h24M20 43h24" stroke="#fff" stroke-width="4"/><path d="M11 25l5 4M53 25l-5 4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'),
  woolychaps: ic(`${sh(22)}<path d="M16 10h32v12l-5 34H34l-2-22-2 22H21l-5-34z" fill="#8a5a2b"/>
<g fill="#fff6e8" stroke="#e6dcc8" stroke-width="1"><circle cx="15" cy="26" r="4.5"/><circle cx="14" cy="34" r="4.5"/><circle cx="15" cy="42" r="4.5"/><circle cx="17" cy="50" r="4.5"/><circle cx="49" cy="26" r="4.5"/><circle cx="50" cy="34" r="4.5"/><circle cx="49" cy="42" r="4.5"/><circle cx="47" cy="50" r="4.5"/></g>
<rect x="14" y="8" width="36" height="7" rx="2" fill="#6b4423"/><rect x="29" y="9" width="6" height="5" rx="1" fill="#ffd23a"/>
<path d="M24 28v26M40 28v26" stroke="#6b4423" stroke-width="1.5" opacity=".5"/>`),
  cottonshirt: ic(`${sh(22)}<path d="M10 20l12-9c2 4 18 4 20 0l12 9-5 10-5-3v30H20V27l-5 3z" fill="#fff" stroke="#a9b6c4" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M22 11c2 4 18 4 20 0" stroke="#a9b6c4" stroke-width="2.5" fill="none"/><path d="M26 13c2 2 10 2 12 0" stroke="#c9d1da" stroke-width="1.5" fill="none"/>
<path d="M15 30l5-3M49 30l-5-3" stroke="#c9d1da" stroke-width="2" stroke-linecap="round"/><path d="M20 48h24" stroke="#dfe6ee" stroke-width="1.5"/>${at(32, 36, boll(0, 0), 0.6)}`),
  violetdress: ic(`${sh(22)}<path d="M22 10h20l4 10-6 4 2 10 12 24H10l12-24 2-10-6-4z" fill="#8a4fd0"/>
<path d="M24 34h16" stroke="#6a35b0" stroke-width="4" stroke-linecap="round"/><path d="M26 10c2 4 10 4 12 0" stroke="#6a35b0" stroke-width="2" fill="none"/>
<path d="M26 40l-6 16M38 40l6 16" stroke="#6a35b0" stroke-width="1.5" opacity=".5"/><path d="M12 56h40" stroke="#b58cf0" stroke-width="2" opacity=".7"/>${hl(27, 22, 1.5, 5, 0, 0.35)}`),
  soothingpad: ic(`${sh(24, 32, 56)}<rect x="10" y="14" width="44" height="36" rx="8" fill="#fff3c4"/><rect x="14" y="18" width="36" height="28" rx="6" fill="none" stroke="#e0b870" stroke-width="1.5" stroke-dasharray="3 3"/>
${petals(32, 32, 10, 7, 3, 6, '#fff', ' stroke="#e6dcc0" stroke-width=".8"')}<circle cx="32" cy="32" r="5" fill="#ffd23a"/>${leaf(44, 40, 30, '#5fb85c', 6)}`),
  // cake oven
  carrotcake: cake('#d9833a', '#fff', at(0, 2, dCarrot, 0.9), '#fff'),
  creamcake: cake('#f5d98a', '#fff', `${dollop(-12, 0)}${dollop(12, 0)}${dollop(0, -2)}${at(0, -8, dCherry, 0.7)}`, '#e8413c'),
  redberrycake: cake('#f8e3b0', '#ff6b8f', `${at(-10, -1, dBerryCluster('#e8366e'), 0.7)}${at(9, 0, dBerryCluster('#e8366e'), 0.7)}${at(0, -6, dBerryCluster('#e8366e'), 0.7)}`, '#fff'),
  cheesecake: cake('#f5cf5a', '#fbe3a0', `${dollop(0, -3)}${at(9, 1, dStrawberry, 0.7)}`, '#b97a2c'),
  blueberrycheesecake: cake('#f5cf5a', '#6a4fc0', `${at(-9, 0, dBlueberry, 0.8)}${at(8, -1, dBlueberry, 0.8)}${at(0, -6, dBlueberry, 0.7)}`, '#b97a2c'),
  strawberrycake: cake('#ffe5ef', '#ff8fb0', `${at(-10, -1, dStrawberry, 0.7)}${at(10, -1, dStrawberry, 0.7)}${at(0, -6, dStrawberry, 0.7)}`, '#fff'),
  chocolatecake: cake('#5a2d0c', '#3d1c06', `${dollop(0, -3)}<g fill="#7a3d16"><ellipse cx="-11" cy="0" rx="4" ry="2" transform="rotate(-20 -11 0)"/><ellipse cx="11" cy="0" rx="4" ry="2" transform="rotate(20 11 0)"/></g>`, '#f0c070'),
  potatofetacake: cake('#e0a04a', '#fff5e0', `<g fill="#fff" stroke="#e6dcc0" stroke-width=".8"><rect x="-12" y="-3" width="6" height="5" rx="1"/><rect x="-3" y="-5" width="6" height="5" rx="1"/><rect x="7" y="-3" width="6" height="5" rx="1"/></g>${dots('#5fb85c', [[-7, 2, 1.4], [3, 1, 1.4], [10, 3, 1.4], [0, -8, 1.4]])}<ellipse cx="0" cy="3" rx="6" ry="3" fill="#c4935a"/>`, '#c98a4a'),
  honeyapplecake: cake('#e8b35a', '#f2a900', `${appleSlices}${at(10, 2, dDrop('#f7b733'), 0.6)}`, '#fff'),
  // smelter
  silverbar: bar('#f4f7fa', '#c3ccd8', '#8f9aa8', '#6b7684'), goldbar: bar('#ffe66b', '#f2b705', '#c77d00', '#8a5a0a'), platinumbar: bar('#e9f2ff', '#b9cce6', '#7f98b8', '#4f6a8c'),
  refinedcoal: ic(`${sh(22, 34, 48)}<polygon points="12,36 28,44 28,28 20,24" fill="#3a3a44"/><polygon points="28,44 56,30 48,18 28,28" fill="#1c1c22"/><polygon points="28,28 48,18 40,14 20,24" fill="#50505c"/>
<path d="M22 25l16-8" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/><g fill="#fff"><path d="M50 8l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/><path d="M12 14l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"/></g>`),
  ironbar: bar('#b8c2cf', '#7d8794', '#4f5862', '#2f363e'),
  // juice press
  carrotjuice: juice('#ff8a3d', '#ffb07a', dCarrot), applejuice: juice('#f2c45a', '#f8dc96', dApple), cherryjuice: juice('#c9183a', '#e8657e', dCherry),
  tomatojuice: juice('#e8413c', '#f28a80', dTomato), berryjuice: juice('#8a3fa0', '#b57ad0', dBerries),
  // workbenches
  fishinglure: fishinglure(), fishingnet: fishingnet(),
  // ice cream
  vanillaicecream: cone('#fff8e0', dots('#5a2d0c', [[26, 22, 1], [34, 16, 1], [38, 26, 1], [30, 29, 1], [22, 28, 0.9]])),
  cherrypopsicle: cherrypopsicle(),
  strawberryicecream: cone('#ff9ab8', dots('#e8413c', [[25, 20, 2.2], [36, 14, 2], [40, 26, 2.2], [30, 30, 2], [22, 28, 1.8]])),
  chocolateicecream: cone('#6b3e1e', dots('#3d2210', [[25, 20, 2.4], [36, 14, 2.2], [40, 26, 2.4], [30, 30, 2.2], [22, 29, 2]])),
  sesameicecream: cone('#f0e8d8', `<g fill="#2b2b33">${[[24, 20, -30], [35, 13, 20], [40, 26, -10], [29, 30, 40], [21, 28, 10], [33, 22, -20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.3" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`),
  // kebab
  lambdonerwrap: lambdonerwrap(),
  // jam maker
  applejam: jar('#d9a03a', '#5a9e3a', dApple), raspberryjam: jar('#e8366e', '#c01f55', dBerryCluster('#e8366e')), blackberryjam: jar('#3b2152', '#6a3fa0', dBerryCluster('#4b2a6b')),
  cherryjam: jar('#b8102f', '#6b1a2e', dCherry), strawberryjam: jar('#e8413c', '#3e9a3c', dStrawberry),
  // jeweler
  bracelet: bracelet(), necklace: necklace(), diamondring: diamondring(), ironbracelet: ironbracelet(),
  // honey extractor
  honey, beeswax: beeswax(),
  // coffee kiosk
  espresso: espresso(), caffelatte: caffelatte(), caffemocha, raspberrymocha, hotchocolate,
  // soup kitchen
  lobstersoup: soup('#ff7a4d', '#e8413c', `${at(26, 31, '<path d="M-6 3l4-9c2-3 6-3 8 0l-4 5 5 1z" fill="#e8413c"/>')}<path d="M34 30c4-2 8-1 10 1" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/>`),
  lambsoup: soup('#b8732f', '#8a5a2b', `${dots('#ff8a3d', [[22, 31, 2.5], [40, 33, 2.5]])}${dots('#7a3d16', [[30, 30, 3], [36, 34, 2.5]])}${dots('#f5d9a0', [[44, 30, 2.2], [26, 35, 2]])}`),
  tomatosoup: soup('#e8413c', '#3e9a3c', `<path d="M24 32c4-3 12-3 16 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>${leaf(40, 29, -20, '#3e9a3c', 4)}`),
  pumpkinsoup: soup('#ff9b4d', '#d9772b', `<path d="M22 32c6-3 14-3 20 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/><g fill="#fff3c4"><ellipse cx="26" cy="30" rx="2.5" ry="1.4" transform="rotate(-20 26 30)"/><ellipse cx="38" cy="34" rx="2.5" ry="1.4" transform="rotate(20 38 34)"/></g>`),
  // candle maker & flower shop
  strawberrycandle: strawberrycandle(), rusticbouquet: rusticbouquet(),
};
