// Original vector art in a bright, rounded farm-cartoon style. The farm is drawn
// in 2.5D: every building, plot and prop is projected with the same 2:1
// isometric helper (light from the upper left), the way Hay Day-style farms
// read from a top-down angle. Items, icons and the five "cropsie" match tiles
// stay flat. Everything is an inline SVG string so the single-file build stays
// one file.

import { svg, isoAt, n1, pg, ln, SHADOW_FILTER, isoBox, isoShadow, isoRoof, rightQuad, leftQuad, baseTrim, feedSack, CHICKEN_FACE, face, MESH, fenceSide, type Pt, type Proj } from './art-core';
import { ITEM_ART } from './art-items';
import { ANIMAL_ART, FEED_ART } from './art-animals';
import { CROP_ART, TREE_ART } from './art-crops';
import { BUILDING_ART, VISITOR_ART as VISITORS, penArt as penArtOf, type PenArt } from './art-pens';

// ---------------------------------------------------------------------------
// Currency & materials

export const ICON_COIN = svg(64, 64, `
<defs><radialGradient id="cg" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe77a"/><stop offset="1" stop-color="#f2a900"/></radialGradient></defs>
<circle cx="32" cy="32" r="29" fill="#c77d00"/><circle cx="32" cy="30" r="27" fill="url(#cg)"/>
<circle cx="32" cy="30" r="19" fill="none" stroke="#c77d00" stroke-width="3" opacity=".6"/>
<text x="32" y="39" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="26" text-anchor="middle" fill="#b36b00">$</text>
<ellipse cx="22" cy="18" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-30 22 18)"/>`);

export const ICON_STAR = svg(64, 64, `
<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#ffb000"/></linearGradient></defs>
<path d="M32 4l8.6 18.6 20.4 2.4-15 14 4 20.2L32 49.4 13.9 59.2l4-20.2-15-14 20.4-2.4z" fill="#c97a00"/>
<path d="M32 7l7.6 16.4 18 2.1-13.3 12.3 3.6 17.8L32 46.9l-15.9 8.7 3.6-17.8L6.4 25.5l18-2.1z" fill="url(#sg)"/>
<path d="M24 20l6-11 2 9z" fill="#fff" opacity=".55"/>`);

// A faceted green gem: the premium currency.
export const ICON_GEM = svg(64, 64, `
<path d="M18 10h28l14 16L32 58 4 26z" fill="#0f8a52"/>
<path d="M20 12h24l12 14H8z" fill="#5ff0a8"/><path d="M8 26h48L32 55z" fill="#1fc47a"/>
<path d="M20 12l6 14h12l6-14z" fill="#9dffd0"/><path d="M26 26h12L32 55z" fill="#3ee08f"/>
<path d="M8 26l18 0 6 29z" fill="#18a866"/>
<path d="M22 15l3 7" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`);

export const ICON_XP = svg(64, 64, `
<circle cx="32" cy="32" r="28" fill="#2f8fe0"/><circle cx="32" cy="30" r="25" fill="#5ab4ff"/>
<text x="32" y="40" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="24" text-anchor="middle" fill="#fff">XP</text>`);

export const ICON_NAIL = svg(64, 64, `
<rect x="12" y="10" width="40" height="10" rx="4" fill="#8f9aa8"/><rect x="26" y="18" width="12" height="40" rx="3" fill="#b8c2cf"/>
<path d="M26 54l6 8 6-8z" fill="#7d8794"/><rect x="28" y="20" width="3" height="34" fill="#fff" opacity=".45"/>`);

export const ICON_SCREW = svg(64, 64, `
<circle cx="32" cy="18" r="13" fill="#9aa5b3"/><circle cx="32" cy="17" r="11" fill="#c3ccd8"/><path d="M24 17h16M32 9v16" stroke="#6b7684" stroke-width="3" stroke-linecap="round"/>
<path d="M26 28h12l-3 30h-6z" fill="#aab4c2"/><path d="M27 34h10M27.5 40h9M28 46h8M28.5 52h7" stroke="#6b7684" stroke-width="2"/>`);

export const ICON_BOLT = svg(64, 64, `
<path d="M20 10h24l6 10-6 10H20l-6-10z" fill="#8a94a2"/><path d="M22 12h20l5 8-5 8H22l-5-8z" fill="#b5bfcc"/>
<rect x="26" y="30" width="12" height="26" rx="2" fill="#a2acba"/><path d="M26 36h12M26 42h12M26 48h12" stroke="#6b7684" stroke-width="2"/>`);

export const ICON_TAPE = svg(64, 64, `
<circle cx="32" cy="32" r="26" fill="#3b7fd9"/><circle cx="32" cy="32" r="22" fill="#5ea3ff"/><circle cx="32" cy="32" r="10" fill="#e8f1ff"/>
<path d="M50 40l12 6-2 10-14-4z" fill="#5ea3ff"/><path d="M52 42l8 4" stroke="#fff" stroke-width="2" opacity=".5"/>`);

// ---------------------------------------------------------------------------
// Produce

export const ICON_WHEAT = svg(64, 64, `
<path d="M32 60V22" stroke="#b88a2a" stroke-width="4" stroke-linecap="round"/>
<g fill="#f3c54a" stroke="#c9961f" stroke-width="1.5">
<ellipse cx="32" cy="10" rx="5" ry="8"/><ellipse cx="24" cy="18" rx="5" ry="8" transform="rotate(-30 24 18)"/><ellipse cx="40" cy="18" rx="5" ry="8" transform="rotate(30 40 18)"/>
<ellipse cx="22" cy="30" rx="5" ry="8" transform="rotate(-30 22 30)"/><ellipse cx="42" cy="30" rx="5" ry="8" transform="rotate(30 42 30)"/>
<ellipse cx="24" cy="42" rx="5" ry="8" transform="rotate(-30 24 42)"/><ellipse cx="40" cy="42" rx="5" ry="8" transform="rotate(30 40 42)"/></g>
<path d="M28 14c-6-4-10-3-14-1M36 14c6-4 10-3 14-1" stroke="#d8a93a" stroke-width="2" fill="none" stroke-linecap="round"/>`);

export const ICON_CORN = svg(64, 64, `
<path d="M26 58c-10-6-12-20-6-34l10-14 10 14c6 14 4 28-6 34z" fill="#3e9a3c"/>
<path d="M32 10c8 6 10 22 6 38-2 6-6 10-6 10s-4-4-6-10c-4-16-2-32 6-38z" fill="#f7cf3a"/>
<g fill="#e4a914"><circle cx="32" cy="22" r="2.5"/><circle cx="27" cy="30" r="2.5"/><circle cx="37" cy="30" r="2.5"/><circle cx="32" cy="38" r="2.5"/><circle cx="27" cy="46" r="2.5"/><circle cx="37" cy="46" r="2.5"/></g>
<path d="M22 20c-6 2-8 8-6 12M42 20c6 2 8 8 6 12" fill="none" stroke="#5fb85c" stroke-width="4" stroke-linecap="round"/>`);

export const ICON_EGG = svg(64, 64, `
<defs><radialGradient id="eg" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f1dcb3"/></radialGradient></defs>
<path d="M32 6c12 0 20 16 20 32a20 20 0 0 1-40 0C12 22 20 6 32 6z" fill="#d9bf8f"/>
<path d="M32 8c11 0 18 15 18 30a18 18 0 0 1-36 0C14 23 21 8 32 8z" fill="url(#eg)"/>
<ellipse cx="24" cy="22" rx="4" ry="7" fill="#fff" opacity=".7" transform="rotate(15 24 22)"/>`);



export const ICON_FEED = feedSack(CHICKEN_FACE, '#e8413c');

export const ICON_BREAD = svg(64, 64, `
<path d="M10 40c0-12 10-22 22-22s22 10 22 22v8a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#b97a2c"/>
<path d="M12 40c0-11 9-20 20-20s20 9 20 20v6H12z" fill="#e6a94c"/>
<path d="M20 30c4-4 8-4 12 0M34 30c4-4 8-4 12 0" stroke="#fde3b0" stroke-width="3" fill="none" stroke-linecap="round"/>`);

// ---------------------------------------------------------------------------
// Booster: the Golden Shovel digs up any one tile without spending a move.

export const ICON_SHOVEL = svg(64, 64, `
<defs><linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffd23a"/><stop offset="1" stop-color="#d79a12"/></linearGradient></defs>
<ellipse cx="34" cy="58" rx="22" ry="4" fill="#000" opacity=".15"/>
<circle cx="13" cy="13" r="6" fill="none" stroke="#8a5a2b" stroke-width="4.5"/>
<path d="M17 17L37 37" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/>
<path d="M19 15L37 33" stroke="#c0884a" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<g transform="translate(45 29) rotate(-45)">
<rect x="-4" y="-10" width="8" height="12" rx="2" fill="#b57a0a"/>
<path d="M-12 0H12V14Q12 30 0 38Q-12 30 -12 14Z" fill="url(#gs)" stroke="#b57a0a" stroke-width="2" stroke-linejoin="round"/>
<path d="M-7 4V16Q-7 24 -2 30" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
</g>
<path d="M54 9l1.6 4.4L60 15l-4.4 1.6L54 21l-1.6-4.4L48 15l4.4-1.6z" fill="#fff"/>`);

// ---------------------------------------------------------------------------
// Animals & buildings (2.5D)

export const ICON_CHICKEN = svg(64, 64, `
<ellipse cx="34" cy="59" rx="16" ry="4" fill="#000" opacity=".16"/>
<path d="M14 36c0-12 9-20 20-20s18 8 18 20-8 20-18 20-20-8-20-20z" fill="#fff6e8"/>
<path d="M20 40c0-8 6-14 14-14s12 6 12 14-5 12-12 12-14-4-14-12z" fill="#fff"/>
<circle cx="40" cy="28" r="12" fill="#fff6e8"/><circle cx="40" cy="27" r="10" fill="#fff"/>
<path d="M38 14c-2-4 1-7 4-5 2-4 7-3 6 1 4-2 6 2 3 5z" fill="#e8413c"/>
<path d="M50 30l8 2-8 3z" fill="#f7a823"/><path d="M46 36c0 3-3 5-5 3" fill="#e8413c"/>
<circle cx="44" cy="26" r="2.2" fill="#2b2b2b"/><circle cx="44.8" cy="25.3" r=".7" fill="#fff"/>
<path d="M14 34c-6-2-10-1-9 4 0-2 3-3 9-1z" fill="#f2cf98"/>
<path d="M30 54v6M36 54v6M27 60h6M33 60h6" stroke="#f7a823" stroke-width="2.5" stroke-linecap="round"/>`);

export const ICON_BARN = ((): string => {
  const p = isoAt(66, 124);
  const wi = 52, wj = 36, h = 38, rh = 24, o = 4;
  let s = `<defs>${SHADOW_FILTER}</defs>` + isoShadow(p, wi, wj, 8);
  s += isoBox(p, 0, 0, 0, wi, wj, h, { l: '#d94a3f', r: '#ab2f28', t: '#e8574b' });
  s += isoRoof(p, wi, wj, h, rh, o, { far: '#9aa7b7', near: '#5d6b7c', ridge: '#cfd7e1', gable: '#d94a3f' });
  // Big door on the right face, with the classic white cross braces.
  s += pg(rightQuad(p, 15, 37, 0, 26), '#5a2616');
  s += pg(rightQuad(p, 15, 37, 0, 26), 'none', 'stroke="#fff" stroke-width="2.5" stroke-linejoin="round"');
  s += ln(p(15, 0, 0), p(37, 0, 26), '#fff', 2.5) + ln(p(37, 0, 0), p(15, 0, 26), '#fff', 2.5);
  // Hayloft window on the gable.
  s += pg(leftQuad(p, 12, 24, 16, 28), '#fff') + ln(p(0, 18, 16), p(0, 18, 28), '#ab2f28', 1.5) + ln(p(0, 24, 22), p(0, 12, 22), '#ab2f28', 1.5);
  s += ln(p(0, 0, 0), p(0, 0, h - 1), '#fff', 2, 'opacity=".55"') + baseTrim(p, wi, wj);
  // A hay bale by the door.
  s += isoBox(p, 42, -16, 0, 12, 9, 9, { l: '#e6c45a', r: '#c49a35', t: '#f3d775' });
  s += ln(p(42, -7, 4.5), p(42, -16, 4.5), '#b8912f', 1.5) + ln(p(42, -16, 4.5), p(54, -16, 4.5), '#a9822a', 1.5);
  return svg(140, 140, s);
})();

export const ICON_SILO = svg(100, 140, `<defs>${SHADOW_FILTER}
<linearGradient id="sb" x1="0" x2="1"><stop offset="0" stop-color="#f1f4f8"/><stop offset=".45" stop-color="#c9d2dd"/><stop offset="1" stop-color="#7f8a99"/></linearGradient>
<linearGradient id="sd" x1="0" x2="1"><stop offset="0" stop-color="#c4cdd9"/><stop offset="1" stop-color="#6f7a88"/></linearGradient></defs>
<ellipse cx="56" cy="124" rx="32" ry="12" fill="#000" opacity=".2" filter="url(#sh)"/>
<path d="M29,120 A21,10.5 0 0 0 71,120 L71,46 A21,10.5 0 0 1 29,46 Z" fill="url(#sb)"/>
<g fill="none" stroke="#8d98a6" stroke-width="2" opacity=".7"><path d="M29,64 A21,10.5 0 0 0 71,64"/><path d="M29,82 A21,10.5 0 0 0 71,82"/><path d="M29,100 A21,10.5 0 0 0 71,100"/></g>
<ellipse cx="50" cy="46" rx="21" ry="10.5" fill="#d4dbe5"/>
<path d="M29,46 A21,20 0 0 1 71,46 A21,10.5 0 0 1 29,46 Z" fill="url(#sd)"/>
<path d="M36,38 A14,10 0 0 1 56,30" stroke="#fff" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/>
<rect x="47" y="20" width="6" height="8" fill="#5f6a78"/><ellipse cx="50" cy="20" rx="7" ry="3" fill="#7d8896"/>
<g stroke="#5f6a78" stroke-width="2" stroke-linecap="round"><path d="M62,52v66M68,52v66"/><path d="M62,58h6M62,66h6M62,74h6M62,82h6M62,90h6M62,98h6M62,106h6M62,114h6"/></g>
<path d="M29,120 A21,10.5 0 0 0 71,120" stroke="#6f7a88" stroke-width="2" fill="none"/>
<path d="M30,116 L18,124 L18,128 L30,122Z" fill="#8d98a6"/>`);

export const ICON_MILL = ((): string => {
  const p = isoAt(58, 108);
  const wi = 40, wj = 28, h = 30, rh = 14, o = 3;
  let s = `<defs>${SHADOW_FILTER}</defs>` + isoShadow(p, wi, wj, 7);
  s += isoBox(p, 0, 0, 0, wi, wj, h, { l: '#d9a060', r: '#a8743c', t: '#e9b874' });
  for (let z = 7; z < h - 4; z += 7) s += ln(p(0, wj, z), p(0, 0, z), '#8a5a2b', 1, 'opacity=".35"') + ln(p(0, 0, z), p(wi, 0, z), '#5e3a16', 1, 'opacity=".4"');
  s += isoRoof(p, wi, wj, h, rh, o, { far: '#9c6436', near: '#5e3a16', ridge: '#b9834a', gable: '#d9a060' });
  s += pg(rightQuad(p, 14, 28, 0, 19), '#4a2a0e') + pg(rightQuad(p, 16, 26, 0, 17), '#6b3f17');
  const [sx, sy] = p(36, -7, 7);
  s += `<ellipse cx="${n1(sx)}" cy="${n1(sy)}" rx="7" ry="8" fill="#e8c88a" stroke="#b58d4c" stroke-width="1.5"/><path d="M${n1(sx - 3)} ${n1(sy - 7)}h6" stroke="#b58d4c" stroke-width="2" stroke-linecap="round"/>`;
  const [hx, hy] = p(0, wj / 2, h + 3);
  for (const a of [20, 110, 200, 290]) {
    const r = (a * Math.PI) / 180;
    s += ln([hx, hy], [hx + Math.cos(r) * 22, hy + Math.sin(r) * 22], '#efe6d2', 5) + ln([hx, hy], [hx + Math.cos(r) * 22, hy + Math.sin(r) * 22], '#c9b99a', 1.5);
  }
  s += `<circle cx="${n1(hx)}" cy="${n1(hy)}" r="4.5" fill="#d64a3a" stroke="#fff" stroke-width="1.5"/>`;
  s += baseTrim(p, wi, wj, '#f3d9a8');
  return svg(120, 120, s);
})();

export const ICON_BAKERY = ((): string => {
  const p = isoAt(58, 108);
  const wi = 44, wj = 30, h = 32, rh = 12, o = 3;
  let s = `<defs>${SHADOW_FILTER}</defs>` + isoShadow(p, wi, wj, 7);
  s += isoBox(p, 0, 0, 0, wi, wj, h, { l: '#f6dcb8', r: '#dcb58b', t: '#fbe7cc' });
  s += isoRoof(p, wi, wj, h, rh, o, { far: '#e07a52', near: '#b2522f', ridge: '#f0a07c', gable: '#f6dcb8' });
  // Chimney on the far slope, with a puff of smoke.
  s += isoBox(p, 30, 20, h + 4, 8, 7, 16, { l: '#c0665a', r: '#8e4538', t: '#5a2a24' });
  const [cx, cy] = p(34, 23.5, h + 24);
  s += `<circle cx="${n1(cx + 1)}" cy="${n1(cy - 2)}" r="5" fill="#fff" opacity=".55"/><circle cx="${n1(cx + 6)}" cy="${n1(cy - 9)}" r="6.5" fill="#fff" opacity=".4"/>`;
  // Shop window with a striped awning on the right face.
  s += pg(rightQuad(p, 8, 24, 6, 18), '#8fd3ff') + pg(rightQuad(p, 8, 24, 6, 18), 'none', 'stroke="#b57a4a" stroke-width="2" stroke-linejoin="round"');
  s += ln(p(16, 0, 6), p(16, 0, 18), '#b57a4a', 1.5) + ln(p(8, 0, 12), p(24, 0, 12), '#b57a4a', 1.5);
  for (let k = 0; k < 5; k++) s += pg([p(6 + 4 * k, 0, 24), p(10 + 4 * k, 0, 24), p(10 + 4 * k, -8, 19), p(6 + 4 * k, -8, 19)], k % 2 ? '#fff' : '#e8413c');
  s += ln(p(6, -8, 19), p(26, -8, 19), '#b2522f', 1.5);
  // Door and the bread sign on the left face.
  s += pg(leftQuad(p, 9, 21, 0, 22), '#7a3e1f');
  const [dx, dy] = p(0, 15, 15);
  s += `<circle cx="${n1(dx)}" cy="${n1(dy)}" r="3.5" fill="#ffe9a8"/>`;
  const [bx, by] = p(0, 24, 27);
  s += `<circle cx="${n1(bx)}" cy="${n1(by)}" r="6.5" fill="#ffe9a8" stroke="#b57a4a" stroke-width="2"/><ellipse cx="${n1(bx)}" cy="${n1(by)}" rx="4" ry="2.5" fill="#d99b4a"/>`;
  s += baseTrim(p, wi, wj, '#b57a4a');
  return svg(120, 120, s);
})();

// The chicken coop is a fenced pen (a 4×4-cell footprint = 104 iso units a side) with a
// red hen house on stilts in the back corner, a feed trough and a dirt yard. It comes in
// two layers so the chickens walk INSIDE it: COOP_BACK (yard, back fences, house) under
// them and COOP_FRONT (the two front fences) over them. Both share one 216×194 frame.
const COOP_W = 216;
const COOP_H = 194;
const COOP_N = 104;
const COOP_E = 4; // fence inset from the footprint edge
const coopP = isoAt(108, 190);


export const COOP_BACK = ((): string => {
  const p = coopP;
  const n = COOP_N, e = COOP_E;
  let s = `<defs>${SHADOW_FILTER}${MESH}<radialGradient id="dirt" cx="50%" cy="55%" r="62%"><stop offset="0" stop-color="#ddb05c"/><stop offset=".75" stop-color="#bf8f40"/><stop offset="1" stop-color="#8f8a36"/></radialGradient></defs>`;
  s += isoShadow(p, n, n, 3);
  s += pg([p(e, e), p(n - e, e), p(n - e, n - e), p(e, n - e)], 'url(#dirt)');
  // Scattered grain on the yard.
  for (let k = 0; k < 46; k++) {
    const [x, y] = p(10 + ((k * 37) % 84), 10 + ((k * 53) % 84));
    s += `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="1.6" ry="1" fill="#f6dc7a" opacity=".85"/>`;
  }
  s += fenceSide(p, [e, n - e], [n - e, n - e]) + fenceSide(p, [n - e, n - e], [n - e, e]);
  // Feed trough along the left fence.
  s += isoBox(p, 12, 58, 0, 12, 32, 8, { l: '#a86a3a', r: '#7d4a22', t: '#c98a52' });
  s += pg([p(14, 60, 8), p(22, 60, 8), p(22, 88, 8), p(14, 88, 8)], '#5e3517');
  // Hen house on stilts in the back corner.
  const hi = 64, hj = 64, w = 30, lift = 10;
  for (const [i, j] of [[hi, hj], [hi + w, hj], [hi, hj + w]]) s += ln(p(i + 2, j + 2, 0), p(i + 2, j + 2, lift), '#6b3a1a', 3.5);
  s += isoBox(p, hi, hj, lift, w, w, 3, { l: '#9c6436', r: '#7a4a22', t: '#b9834a' });
  const q: Proj = (i, j, z = 0) => p(i + hi + 3, j + hj + 3, z + lift + 3);
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
  return svg(COOP_W, COOP_H, s);
})();

export const COOP_FRONT = svg(COOP_W, COOP_H, `<defs>${MESH}</defs>`
  + fenceSide(coopP, [COOP_E, COOP_N - COOP_E], [COOP_E, COOP_E]) + fenceSide(coopP, [COOP_E, COOP_E], [COOP_N - COOP_E, COOP_E]));

/** Where each chicken stands inside the pen (feet), in COOP_BACK's 216×194 frame; up to 6. */
export const COOP_SLOTS: { x: number; y: number }[] = [[30, 30], [58, 24], [24, 54], [50, 48], [80, 38], [40, 76]]
  .map(([i, j]) => { const [x, y] = coopP(i, j); return { x: n1(x), y: n1(y) }; });
export const COOP_SIZE = { w: COOP_W, h: COOP_H };

/** The whole pen in one picture (Shop icon). */
export const ICON_COOP = COOP_BACK.replace(/<\/svg>$/, '') + COOP_FRONT.replace(/^<svg[^>]*>/, '');

// An empty wicker basket (the eggs go into it as it sweeps over the chickens).
export const ICON_BASKET = svg(64, 64, `
<ellipse cx="32" cy="58" rx="22" ry="4" fill="#000" opacity=".15"/>
<path d="M14 30C14 12 50 12 50 30" fill="none" stroke="#8b5a2b" stroke-width="5" stroke-linecap="round"/>
<path d="M14 30C14 12 50 12 50 30" fill="none" stroke="#c98a4a" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="32" cy="31" rx="23" ry="5" fill="#6b3f1c"/>
<path d="M8 30h48l-6 24a4 4 0 0 1-4 3H18a4 4 0 0 1-4-3z" fill="#c98a4a"/>
<path d="M10 37h44M12 45h40M14 52h36" stroke="#8b5a2b" stroke-width="2"/>
<path d="M18 30l4 26M28 30l1 27M36 30l-1 27M46 30l-4 26" stroke="#a86a3a" stroke-width="2"/>
<path d="M8 30h48v4H8z" fill="#a86a3a"/>`);

// ---------------------------------------------------------------------------
// Plots: an isometric soil tile with side faces, and the grass tile of a plot
// that is still for sale. Crops are planted on the tile in three iso rows.

/** The diamond top face with rounded corners (r = corner cut), lowered by dy. */
function roundDiamond(dy = 0, r = 7): string {
  const c: Pt[] = [[46, 0 + dy], [92, 23 + dy], [46, 46 + dy], [0, 23 + dy]];
  let d = '';
  for (let k = 0; k < 4; k++) {
    const prev = c[(k + 3) % 4], cur = c[k], next = c[(k + 1) % 4];
    const len = Math.hypot(next[0] - cur[0], next[1] - cur[1]);
    const a: Pt = [cur[0] + ((prev[0] - cur[0]) * r) / len, cur[1] + ((prev[1] - cur[1]) * r) / len];
    const b: Pt = [cur[0] + ((next[0] - cur[0]) * r) / len, cur[1] + ((next[1] - cur[1]) * r) / len];
    d += (k ? 'L' : 'M') + `${n1(a[0])} ${n1(a[1])}Q${n1(cur[0])} ${n1(cur[1])} ${n1(b[0])} ${n1(b[1])}`;
  }
  return d + 'Z';
}

export const PLOT_SOIL = ((): string => {
  const TH = 5; // side thickness (was 7)
  let furrows = '';
  let light = '';
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    const a: Pt = [46 * t, 23 + 23 * t];
    const b: Pt = [46 + 46 * t, 23 * t];
    const a2: Pt = [a[0] + (b[0] - a[0]) * 0.12, a[1] + (b[1] - a[1]) * 0.12];
    const b2: Pt = [b[0] - (b[0] - a[0]) * 0.12, b[1] - (b[1] - a[1]) * 0.12];
    furrows += ln(a2, b2, '#7a4f28', 4.5);
    light += ln([a2[0], a2[1] + 2.5], [b2[0], b2[1] + 2.5], '#b88a5a', 1.5);
  }
  return svg(92, 60, `
<path d="${roundDiamond(TH, 7)}" fill="#5e3b1d"/><path d="M46 ${46 + TH}L92 ${23 + TH}L92 23L46 46Z" fill="#4b2d12" opacity=".6"/>
<path d="${roundDiamond(0, 7)}" fill="#9a6a3c"/>${furrows}<g opacity=".7">${light}</g>
<path d="${roundDiamond(0, 7)}" fill="none" stroke="#c49a6a" stroke-width="1.5" opacity=".9"/>`);
})();

export const ICON_TRASH = svg(64, 64, `
<path d="M14 20h36l-3 36a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4z" fill="#fff"/><path d="M10 14h44v8H10z" fill="#fff"/><path d="M26 8h12l2 6H24z" fill="#fff"/>
<path d="M24 28v24M32 28v24M40 28v24" stroke="#e04434" stroke-width="3" stroke-linecap="round"/>`);

/** The delivery truck parked by the farmhouse (2.5D, facing left-front). */
export const ICON_TRUCK = ((): string => {
  const p = isoAt(60, 78);
  let s = `<defs>${SHADOW_FILTER}</defs>` + isoShadow(p, 50, 24, 5);
  // Cargo box, then the cab in front of it.
  s += isoBox(p, 18, 0, 6, 32, 24, 26, { l: '#f3f6f9', r: '#c9d2dd', t: '#ffffff' });
  s += pg(rightQuad(p, 22, 46, 10, 26), '#2f8fe0') + pg(rightQuad(p, 22, 46, 10, 14), '#1f6fb5');
  s += ln(p(18, 0, 6), p(18, 0, 32), '#9aa7b7', 1.5) + ln(p(18, 24, 6), p(18, 0, 6), '#9aa7b7', 1.5, 'opacity=".5"');
  s += isoBox(p, 0, 0, 6, 18, 24, 16, { l: '#ff9a2e', r: '#d26d0a', t: '#ffb04d' });
  s += isoBox(p, 2, 2, 22, 14, 20, 10, { l: '#ff9a2e', r: '#d26d0a', t: '#ffb04d' });
  s += pg(leftQuad(p, 4, 18, 23, 31, 2), '#bfe6ff') + pg(rightQuad(p, 4, 14, 23, 31, 2), '#9fd4f5');
  s += pg(leftQuad(p, 2, 8, 9, 14, 0), '#ffe680');
  // Wheels: dark ellipses under the body on the lit (left) side.
  for (const [i, j] of [[8, -1], [40, -1]] as [number, number][]) { const [x, y] = p(i, j, 2); s += `<ellipse cx="${n1(x)}" cy="${n1(y + 3)}" rx="7" ry="7.5" fill="#2f2f2f"/><ellipse cx="${n1(x)}" cy="${n1(y + 3)}" rx="3" ry="3.2" fill="#9aa7b7"/>`; }
  return svg(120, 100, s);
})();

export const PLOT_GRASS = svg(92, 60, `
<polygon points="0,23 46,46 46,50 0,27" fill="#4f9a3c"/><polygon points="46,46 92,23 92,27 46,50" fill="#3f7f30"/>
<polygon points="46,0 92,23 46,46 0,23" fill="#8ddc6e"/>
<polygon points="46,5 82,23 46,41 10,23" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 5" opacity=".8"/>
<g fill="#fff"><circle cx="22" cy="21" r="2"/><circle cx="70" cy="26" r="2"/></g><g fill="#ffd23a"><circle cx="22" cy="21" r=".9"/><circle cx="70" cy="26" r=".9"/></g>`);

export function cropArt(kind: 'wheat' | 'corn', stage: 0 | 1 | 2): string {
  const spots: Pt[] = [];
  for (const u of [0.22, 0.5, 0.78]) for (const v of [0.22, 0.5, 0.78]) spots.push([46 + 46 * (u - v), 72 - 23 * (u + v)]);
  spots.sort((a, b) => a[1] - b[1]);
  const plant = (x: number, y: number): string => {
    if (stage === 0) return `<path d="M${x},${y} v-7 M${x},${y - 4} l-4,-3 M${x},${y - 4} l4,-3" stroke="${kind === 'wheat' ? '#6fcf5c' : '#4fb84a'}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (kind === 'wheat') {
      if (stage === 1) return `<path d="M${x},${y} v-14 M${x - 3},${y} l-2,-11 M${x + 3},${y} l2,-11" stroke="#8dc63f" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      return `<path d="M${x},${y} v-18 M${x - 3},${y} l-3,-13 M${x + 3},${y} l3,-13" stroke="#c9a227" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="${x}" cy="${y - 21}" rx="3" ry="6" fill="#f3c54a" stroke="#c9961f"/><ellipse cx="${x - 6}" cy="${y - 15}" rx="2.4" ry="4.5" fill="#f3c54a" stroke="#c9961f" transform="rotate(-20 ${x - 6} ${y - 15})"/><ellipse cx="${x + 6}" cy="${y - 15}" rx="2.4" ry="4.5" fill="#f3c54a" stroke="#c9961f" transform="rotate(20 ${x + 6} ${y - 15})"/>`;
    }
    if (stage === 1) return `<path d="M${x},${y} v-16" stroke="#3e9a3c" stroke-width="2.6" stroke-linecap="round"/><path d="M${x},${y - 8} q-6,-1 -9,-7 M${x},${y - 11} q6,-1 9,-7" stroke="#4fb84a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    return `<path d="M${x},${y} v-26" stroke="#3e9a3c" stroke-width="2.8" stroke-linecap="round"/><path d="M${x},${y - 10} q-7,-1 -10,-8 M${x},${y - 17} q7,-1 10,-8 M${x},${y - 6} q6,0 9,-5" stroke="#4fb84a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<ellipse cx="${x + 4}" cy="${y - 14}" rx="3" ry="6" fill="#f7cf3a" stroke="#c9961f" transform="rotate(15 ${x + 4} ${y - 14})"/><path d="M${x + 5},${y - 20} l2,-5" stroke="#4fb84a" stroke-width="2" stroke-linecap="round"/>`;
  };
  return svg(92, 72, spots.map(([x, y]) => plant(n1(x), n1(y))).join(''));
}

export const CROP_STAGE: Record<string, string[]> = {
  wheat: [cropArt('wheat', 0), cropArt('wheat', 1), cropArt('wheat', 2)],
  corn: [cropArt('corn', 0), cropArt('corn', 1), cropArt('corn', 2)],
};

// ---------------------------------------------------------------------------
// Scene: the lawn tile (plain grass; the farm has no decor layer).

export const LAWN_TILE = svg(64, 32, `<rect width="64" height="32" fill="#7fcf63"/><polygon points="32,0 64,16 32,32 0,16" fill="#78c65c"/>`);


// ---------------------------------------------------------------------------
// UI icons

export const ICON_SHOP = svg(64, 64, `
<path d="M8 26h48v30a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#d0894a"/>
<path d="M6 14h52l6 12H0z" fill="#e94f3d"/><path d="M12 14h8v12h-8zM28 14h8v12h-8zM44 14h8v12h-8z" fill="#fff"/>
<rect x="26" y="40" width="12" height="20" rx="2" fill="#6b3a16"/><rect x="12" y="36" width="10" height="10" rx="2" fill="#ffe9a8"/>`);

export const ICON_ORDERS = svg(64, 64, `
<rect x="8" y="16" width="48" height="40" rx="4" fill="#8f6440"/><rect x="12" y="20" width="40" height="32" rx="3" fill="#f7e9c7"/>
<path d="M18 30h28M18 38h20M18 46h24" stroke="#c9a66a" stroke-width="3" stroke-linecap="round"/>
<rect x="22" y="8" width="20" height="12" rx="3" fill="#5c3a1c"/>`);

export const ICON_MATCH = svg(64, 64, `
<rect x="6" y="6" width="24" height="24" rx="6" fill="#ff8a3d"/><rect x="34" y="6" width="24" height="24" rx="6" fill="#ff5a7a"/>
<rect x="6" y="34" width="24" height="24" rx="6" fill="#7bd84a"/><rect x="34" y="34" width="24" height="24" rx="6" fill="#ffd23a"/>
<g fill="#fff"><circle cx="14" cy="16" r="2.5"/><circle cx="22" cy="16" r="2.5"/><circle cx="42" cy="16" r="2.5"/><circle cx="50" cy="16" r="2.5"/><circle cx="14" cy="44" r="2.5"/><circle cx="22" cy="44" r="2.5"/><circle cx="42" cy="44" r="2.5"/><circle cx="50" cy="44" r="2.5"/></g>
<g stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"><path d="M14 22q4 3 8 0M42 22q4 3 8 0M14 50q4 3 8 0M42 50q4 3 8 0"/></g>`);

export const ICON_HAMMER = svg(64, 64, `
<path d="M14 50l22-22 8 8-22 22z" fill="#b98046"/><path d="M34 10h18l6 8-8 14-12-4-10-10z" fill="#6b7684"/><path d="M36 12h14l4 6-6 10-9-3-8-8z" fill="#98a3b1"/>`);

export const ICON_LOCK = svg(64, 64, `
<rect x="14" y="28" width="36" height="28" rx="6" fill="#6f7a88"/><path d="M22 28v-8a10 10 0 0 1 20 0v8h-6v-8a4 4 0 0 0-8 0v8z" fill="#8d98a6"/><circle cx="32" cy="42" r="4" fill="#2b2b2b"/>`);

export const ICON_PLUS = svg(64, 64, `
<circle cx="32" cy="32" r="26" fill="#3fa63a"/><circle cx="32" cy="30" r="23" fill="#62c75c"/><path d="M32 18v24M20 30h24" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`);

export const ICON_CLOCK = svg(64, 64, `
<circle cx="32" cy="32" r="26" fill="#3c4a5c"/><circle cx="32" cy="32" r="22" fill="#fff"/><path d="M32 18v15l9 6" stroke="#3c4a5c" stroke-width="4" stroke-linecap="round" fill="none"/>`);

export const ICON_SETTINGS = svg(64, 64, `
<path d="M27 6h10l2 8 6 3 8-3 5 9-6 5v7l6 5-5 9-8-3-6 3-2 8H27l-2-8-6-3-8 3-5-9 6-5v-7l-6-5 5-9 8 3 6-3z" fill="#fff"/><circle cx="32" cy="32" r="9" fill="#3c4a5c"/>`);

export const ICON_HOME = svg(64, 64, `
<path d="M8 32L32 10l24 22-4 4-20-18L12 36z" fill="#fff"/><path d="M14 32l18-16 18 16v22H14z" fill="#fff"/><rect x="27" y="40" width="10" height="14" fill="#3c4a5c"/>`);

// ---------------------------------------------------------------------------
// Match tiles: five cropsies with faces (goal tiles pulse in the UI)


export const TILE_ART: Record<string, string> = {
  wheat: svg(100, 100, `
<defs><radialGradient id="tw" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e9a826"/></radialGradient></defs>
<path d="M50 96c-6-4-8-12-6-22" stroke="#b88a2a" stroke-width="5" stroke-linecap="round" fill="none"/>
<g fill="url(#tw)" stroke="#c9961f" stroke-width="2"><ellipse cx="50" cy="20" rx="12" ry="16"/><ellipse cx="34" cy="40" rx="12" ry="16" transform="rotate(-28 34 40)"/><ellipse cx="66" cy="40" rx="12" ry="16" transform="rotate(28 66 40)"/><ellipse cx="38" cy="64" rx="12" ry="16" transform="rotate(-28 38 64)"/><ellipse cx="62" cy="64" rx="12" ry="16" transform="rotate(28 62 64)"/></g>
<circle cx="50" cy="50" r="22" fill="#ffd95a" stroke="#c9961f" stroke-width="2"/>
${face(50, 48, 44)}`),
  carrot: svg(100, 100, `
<defs><linearGradient id="tc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa14a"/><stop offset="1" stop-color="#f26b1d"/></linearGradient></defs>
<path d="M36 6c6 10 10 4 14 10 4-6 8 0 14-10l-8 24H44z" fill="#4fb84a"/>
<path d="M30 30c0-10 40-10 40 0 0 28-10 54-20 66C40 84 30 58 30 30z" fill="url(#tc)"/>
<path d="M36 44q14-3 28 0M38 56q12-3 24 0M42 68q8-2 16 0" stroke="#d85a12" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
<ellipse cx="40" cy="36" rx="4" ry="8" fill="#fff" opacity=".35"/>
${face(50, 46, 42)}`),
  apple: svg(100, 100, `
<defs><radialGradient id="ta" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff7b7b"/><stop offset="1" stop-color="#d81f2a"/></radialGradient></defs>
<path d="M50 26c-10-16-30-14-36 4-6 20 8 52 24 60 6 3 10 0 12 0s6 3 12 0c16-8 30-40 24-60-6-18-26-20-36-4z" fill="url(#ta)"/>
<path d="M50 28c0-10 4-16 10-20" stroke="#6b3f17" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M54 16c8-8 20-6 22 2-8 6-18 4-22-2z" fill="#4fb84a"/>
<ellipse cx="30" cy="40" rx="6" ry="10" fill="#fff" opacity=".35" transform="rotate(-15 30 40)"/>
${face(50, 54, 46)}`),
  berry: svg(100, 100, `
<defs><radialGradient id="tb" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff6a55"/><stop offset=".6" stop-color="#e8261e"/><stop offset="1" stop-color="#b10d14"/></radialGradient></defs>
<path d="M50 94C26 84 12 60 16 40c4-16 20-18 34-10 14-8 30-6 34 10 4 20-10 44-34 54z" fill="url(#tb)"/>
<path d="M30 20c10-8 14 0 20 4 6-4 10-12 20-4-4 10-14 12-20 10-6 2-16 0-20-10z" fill="#4fb84a"/>
<g fill="#ffe57a"><circle cx="30" cy="48" r="2.5"/><circle cx="70" cy="48" r="2.5"/><circle cx="26" cy="62" r="2.5"/><circle cx="74" cy="62" r="2.5"/><circle cx="36" cy="76" r="2.5"/><circle cx="64" cy="76" r="2.5"/><circle cx="50" cy="84" r="2.5"/></g>
${face(50, 56, 44)}`),
  sunflower: svg(100, 100, `
<g fill="#ffd23a" stroke="#e5a800" stroke-width="1.5">
<ellipse cx="50" cy="12" rx="8" ry="14"/><ellipse cx="50" cy="88" rx="8" ry="14"/><ellipse cx="12" cy="50" rx="14" ry="8"/><ellipse cx="88" cy="50" rx="14" ry="8"/>
<ellipse cx="23" cy="23" rx="8" ry="14" transform="rotate(-45 23 23)"/><ellipse cx="77" cy="23" rx="8" ry="14" transform="rotate(45 77 23)"/><ellipse cx="23" cy="77" rx="8" ry="14" transform="rotate(45 23 77)"/><ellipse cx="77" cy="77" rx="8" ry="14" transform="rotate(-45 77 77)"/>
<ellipse cx="36" cy="14" rx="7" ry="12" transform="rotate(-22 36 14)"/><ellipse cx="64" cy="14" rx="7" ry="12" transform="rotate(22 64 14)"/><ellipse cx="36" cy="86" rx="7" ry="12" transform="rotate(22 36 86)"/><ellipse cx="64" cy="86" rx="7" ry="12" transform="rotate(-22 64 86)"/>
<ellipse cx="14" cy="36" rx="12" ry="7" transform="rotate(22 14 36)"/><ellipse cx="14" cy="64" rx="12" ry="7" transform="rotate(-22 14 64)"/><ellipse cx="86" cy="36" rx="12" ry="7" transform="rotate(-22 86 36)"/><ellipse cx="86" cy="64" rx="12" ry="7" transform="rotate(22 86 64)"/></g>
<circle cx="50" cy="50" r="27" fill="#7a4a1c"/><circle cx="50" cy="50" r="23" fill="#9a6230"/>
${face(50, 48, 46, '#3a1f08')}`),
  eggplant: svg(100, 100, `
<defs><linearGradient id="tep" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b98cff"/><stop offset=".5" stop-color="#7b3fd0"/><stop offset="1" stop-color="#43157a"/></linearGradient></defs>
<path d="M44 24c-16 6-28 24-28 44 0 16 12 26 28 26 22 0 40-16 40-38 0-18-12-30-24-34-6-2-11 0-16 2z" fill="url(#tep)"/>
<path d="M38 26c6-12 22-14 28-4-6 2-8 8-6 12-8-6-16-6-22-8z" fill="#4fb84a"/><path d="M52 14c0-6 4-10 8-10" stroke="#3e9a3c" stroke-width="5" stroke-linecap="round" fill="none"/>
<ellipse cx="30" cy="56" rx="5" ry="12" fill="#fff" opacity=".35" transform="rotate(20 30 56)"/>
${face(50, 60, 44, '#2a0b4a')}`),
  cabbage: svg(100, 100, `
<defs><radialGradient id="tcb" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d4fbf6"/><stop offset=".55" stop-color="#5fd6d0"/><stop offset="1" stop-color="#1f8fa8"/></radialGradient></defs>
<path d="M14 54c-6-16 4-34 16-38 6-10 34-10 40 0 14 4 22 22 16 38-2 22-18 36-36 36S16 76 14 54z" fill="#2a9fb8"/>
<circle cx="50" cy="54" r="34" fill="url(#tcb)"/>
<path d="M50 22v64M50 40c-10-4-18-2-24 6M50 40c10-4 18-2 24 6M50 60c-12-4-20 0-26 8M50 60c12-4 20 0 26 8" stroke="#1f8fa8" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".55"/>
<path d="M18 46c4-10 12-16 20-18M82 46c-4-10-12-16-20-18" stroke="#fff" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>
${face(50, 56, 42, '#0b4a55')}`),
  corn: svg(100, 100, `
<defs><linearGradient id="tco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#f2b01c"/></linearGradient></defs>
<path d="M50 6c17 0 25 22 25 44s-9 40-25 42c-16-2-25-20-25-42S33 6 50 6z" fill="url(#tco)" stroke="#d99a12" stroke-width="2"/>
<g fill="#ffd24a" stroke="#e0a312" stroke-width="1"><circle cx="40" cy="20" r="4"/><circle cx="50" cy="16" r="4"/><circle cx="60" cy="20" r="4"/><circle cx="34" cy="30" r="4"/><circle cx="66" cy="30" r="4"/><circle cx="32" cy="66" r="4"/><circle cx="68" cy="66" r="4"/></g>
<path d="M22 56c-8 12-6 32 12 38 8 3 14 0 16-2C38 86 28 74 22 56z" fill="#5fc256"/><path d="M78 56c8 12 6 32-12 38-8 3-14 0-16-2 12-6 22-18 28-36z" fill="#3e9a3c"/>
<ellipse cx="40" cy="30" rx="4" ry="9" fill="#fff" opacity=".4"/>
${face(50, 46, 42)}`),
  blueberry: svg(100, 100, `
<defs><radialGradient id="tbl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#8fb4ff"/><stop offset="1" stop-color="#2f4fc4"/></radialGradient></defs>
<circle cx="50" cy="54" r="40" fill="url(#tbl)"/>
<path d="M38 18l5 9 7-9 7 9 5-9 2 13H36z" fill="#22388f"/>
<ellipse cx="32" cy="40" rx="8" ry="13" fill="#fff" opacity=".3" transform="rotate(-25 32 40)"/>
${face(50, 58, 46, '#1a2560')}`),
};

// ---------------------------------------------------------------------------
// Match board: power-ups, blockers, soil and animals

/** Rainbow Seed (5 in a line): swap it with a cropsy to clear every one of that kind. */
export const RAINBOW_SEED = svg(100, 100, `
<defs><radialGradient id="rgw" cx="50%" cy="50%" r="50%"><stop offset=".55" stop-color="#fff7c0" stop-opacity=".9"/><stop offset="1" stop-color="#fff7c0" stop-opacity="0"/></radialGradient>
<linearGradient id="rgs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset=".2" stop-color="#ff9a2e"/><stop offset=".4" stop-color="#ffd23a"/><stop offset=".6" stop-color="#5cc24a"/><stop offset=".8" stop-color="#4aa8ff"/><stop offset="1" stop-color="#a45cff"/></linearGradient></defs>
<circle cx="50" cy="54" r="46" fill="url(#rgw)"/>
<path d="M50 12C72 28 80 46 80 62a30 30 0 0 1-60 0c0-16 8-34 30-50z" fill="#6b3f17"/>
<path d="M50 17C69 31 75 47 75 62a25 25 0 0 1-50 0c0-15 6-31 25-45z" fill="url(#rgs)"/>
<path d="M34 52q16-7 32 0M30 66q20-7 40 0M34 80q16-6 32 0" stroke="#fff" stroke-width="3" opacity=".45" fill="none" stroke-linecap="round"/>
<ellipse cx="40" cy="44" rx="5" ry="10" fill="#fff" opacity=".55" transform="rotate(-20 40 44)"/>
<path d="M50 14c-3-9 4-13 12-11-2 7-7 10-12 11z" fill="#4fb84a"/>
<g fill="#fff"><path d="M84 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M14 30l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/></g>`);

/** The tire-track band laid over a Tractor Cropsy (4 in a line); the column version is the same band turned upright. */
const stripe = (rot: number): string => svg(100, 100, `<g transform="rotate(${rot} 50 50)">
<rect x="3" y="35" width="94" height="30" rx="15" fill="#fff" opacity=".88" stroke="#ff7a1e" stroke-width="3"/>
<g fill="#7a4a1f"><path d="M20 41l8 9-8 9h7l8-9-8-9z"/><path d="M40 41l8 9-8 9h7l8-9-8-9z"/><path d="M60 41l8 9-8 9h7l8-9-8-9z"/></g>
<path d="M2 50l11-11v22zM98 50l-11-11v22z" fill="#ff7a1e"/></g>`);
export const STRIPE_ROW = stripe(0);
export const STRIPE_COL = stripe(90);

/** Hay Bale Cropsy (T / L shape): the cropsy bundled in a ring of straw, tied with red twine. */
export const HAYBALE_WRAP = svg(100, 100, `
<circle cx="50" cy="52" r="42" fill="none" stroke="#c9961f" stroke-width="15"/>
<circle cx="50" cy="52" r="42" fill="none" stroke="#f3d775" stroke-width="10"/>
<g stroke="#d8a93a" stroke-width="2" stroke-linecap="round">${Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2;
  const x1 = 50 + Math.cos(a) * 37, y1 = 52 + Math.sin(a) * 37, x2 = 50 + Math.cos(a + 0.18) * 47, y2 = 52 + Math.sin(a + 0.18) * 47;
  return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
}).join('')}</g>
<path d="M50 6v14M50 84v14" stroke="#d63a2a" stroke-width="5"/>
<path d="M50 10c-10-10-20-4-14 4 4 4 10 2 14-4zM50 10c10-10 20-4 14 4-4 4-10 2-14-4z" fill="#e8413c" stroke="#a52a2a" stroke-width="1.5"/>
<circle cx="50" cy="10" r="3.5" fill="#a52a2a"/>`);

/** Busy Bee (2×2 square): a cropsy carrying a little bee. Also the flying bee of the effect. */
export const BEE = svg(64, 64, `
<ellipse cx="22" cy="18" rx="12" ry="9" fill="#e8f6ff" stroke="#9cc8e8" stroke-width="2" transform="rotate(-20 22 18)" opacity=".95"/>
<ellipse cx="40" cy="16" rx="12" ry="9" fill="#e8f6ff" stroke="#9cc8e8" stroke-width="2" transform="rotate(20 40 16)" opacity=".95"/>
<ellipse cx="32" cy="38" rx="20" ry="16" fill="#ffd23a" stroke="#3b2a14" stroke-width="2.5"/>
<path d="M24 24c-4 8-4 22 0 29M36 23c-3 9-3 22 0 30" stroke="#3b2a14" stroke-width="6" fill="none"/>
<circle cx="46" cy="34" r="9" fill="#3b2a14"/><circle cx="48" cy="32" r="2.4" fill="#fff"/>
<path d="M12 38l-8 2 8 2z" fill="#3b2a14"/>
<path d="M48 26c2-6 6-8 9-7M44 25c0-6 2-9 5-10" stroke="#3b2a14" stroke-width="2" fill="none" stroke-linecap="round"/>`);
export const BEE_BADGE = svg(100, 100, `<g transform="translate(46 2) scale(.82)">${BEE.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`);

/** The beehive spawner sitting on the tray rim above a column. */
export const ICON_BEEHIVE = svg(64, 64, `
<path d="M32 4v6" stroke="#7a4a1f" stroke-width="4"/>
<ellipse cx="32" cy="15" rx="12" ry="6" fill="#f2b81c" stroke="#b57a0a" stroke-width="2"/>
<ellipse cx="32" cy="26" rx="18" ry="7" fill="#ffd23a" stroke="#b57a0a" stroke-width="2"/>
<ellipse cx="32" cy="38" rx="22" ry="8" fill="#f2b81c" stroke="#b57a0a" stroke-width="2"/>
<ellipse cx="32" cy="50" rx="18" ry="7" fill="#ffd23a" stroke="#b57a0a" stroke-width="2"/>
<ellipse cx="32" cy="42" rx="5" ry="4" fill="#5a3512"/>`);

/** The tutorial's pointing hand. */
export const ICON_HAND = svg(64, 64, `<path d="M22 60c-8-6-14-16-14-24 0-4 4-6 8-2l4 6V12a5 5 0 0 1 10 0v18l2-2a5 5 0 0 1 8 2l2 2a5 5 0 0 1 8 2v16c0 6-6 10-10 10z" fill="#ffd9b3" stroke="#3b2a14" stroke-width="3" stroke-linejoin="round"/>`);

export const ICON_TRACTOR = svg(72, 56, `
<ellipse cx="36" cy="52" rx="30" ry="3.5" fill="#000" opacity=".18"/>
<path d="M8 26h40l8 8v8H8z" fill="#e8413c"/><path d="M8 26h40l3 3H8z" fill="#ff6b5a"/>
<rect x="22" y="8" width="22" height="20" rx="3" fill="#c8302a"/><rect x="25" y="11" width="15" height="11" rx="2" fill="#bfe6ff"/>
<rect x="50" y="10" width="4" height="16" rx="1.5" fill="#4a4a4a"/>
<circle cx="20" cy="40" r="13" fill="#2f2f2f"/><circle cx="20" cy="40" r="6" fill="#ffd23a"/>
<circle cx="54" cy="44" r="8" fill="#2f2f2f"/><circle cx="54" cy="44" r="3.5" fill="#ffd23a"/>`);

export const MUD_TILE = svg(100, 100, `
<path d="M8 62C2 44 16 28 30 28c4-12 22-16 32-6 14-4 30 8 28 24 10 8 6 32-10 34-8 12-30 14-40 6-14 6-36-4-32-24z" fill="#6e4524"/>
<path d="M14 58C10 44 22 34 34 34c4-9 18-12 26-4 12-3 24 6 22 18 8 6 4 24-8 26-6 9-24 10-32 4-11 4-30-4-28-20z" fill="#8d5d32"/>
<g fill="#5a3518"><ellipse cx="36" cy="60" rx="7" ry="4"/><ellipse cx="62" cy="70" rx="9" ry="4.5"/><ellipse cx="66" cy="48" rx="5" ry="3"/></g>
<ellipse cx="40" cy="44" rx="10" ry="4" fill="#b98a5a" opacity=".55"/>
<g stroke="#4aa842" stroke-width="4" stroke-linecap="round" fill="none"><path d="M28 32l-4-14M28 32l5-12"/><path d="M72 30l-2-15M72 30l7-11"/></g>`);

const crate = (cracked: boolean): string => svg(100, 100, `
<rect x="5" y="5" width="90" height="90" rx="9" fill="#7a4a1f"/>
<rect x="11" y="11" width="78" height="78" rx="5" fill="${cracked ? '#b8823f' : '#cf9150'}"/>
<path d="M11 37h78M11 63h78" stroke="#8a5a2b" stroke-width="3"/>
<rect x="11" y="11" width="78" height="5" fill="#e9b371" opacity=".8"/>
<path d="M16 84L84 16" stroke="#7a4a1f" stroke-width="11" stroke-linecap="round"/><path d="M16 84L84 16" stroke="${cracked ? '#d4a062' : '#e6ab6a'}" stroke-width="5" stroke-linecap="round"/>
<g fill="#4a2a0e"><circle cx="16" cy="16" r="3"/><circle cx="84" cy="16" r="3"/><circle cx="16" cy="84" r="3"/><circle cx="84" cy="84" r="3"/></g>
${cracked ? '<path d="M30 11l6 16-9 10 12 14-5 18M70 89l-5-14 9-9-6-12" stroke="#3a2008" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M76 11h13v13z" fill="#7a4a1f"/>' : ''}`);
export const CRATE_TILE = crate(false);
export const CRATE_CRACKED = crate(true);

export const SOIL_TILE = svg(100, 100, `
<rect width="100" height="100" fill="#8a5a30"/>
<path d="M0 14h100M0 38h100M0 62h100M0 86h100" stroke="#6b4421" stroke-width="11"/>
<path d="M0 22h100M0 46h100M0 70h100M0 94h100" stroke="#b07c4a" stroke-width="3" opacity=".75"/>`);
export const ICON_SOIL = svg(64, 64, `
<path d="M4 40L32 26l28 14-28 14z" fill="#8a5a30"/><path d="M4 40v6l28 14v-6zM60 40v6L32 60v-6z" fill="#5a371a"/>
<path d="M14 38l24 12M22 34l24 12M30 30l24 12" stroke="#6b4421" stroke-width="3"/>
<path d="M32 30v-14M32 22c-6-6-12-4-12 0 6 2 10 2 12 0zM32 18c4-8 12-8 12-3-5 3-9 4-12 3z" stroke="#4aa842" stroke-width="3" fill="#62c457" stroke-linejoin="round"/>`);

export const CHICK_TILE = svg(100, 100, `
<ellipse cx="50" cy="93" rx="26" ry="5" fill="#000" opacity=".15"/>
<ellipse cx="17" cy="62" rx="8" ry="13" fill="#f7c62a" transform="rotate(25 17 62)"/><ellipse cx="83" cy="62" rx="8" ry="13" fill="#f7c62a" transform="rotate(-25 83 62)"/>
<circle cx="50" cy="56" r="35" fill="#ffd23a"/><circle cx="50" cy="52" r="29" fill="#ffe680"/>
<path d="M44 21c-3-9 4-11 7-5 2-7 9-5 7 2" stroke="#f2b01c" stroke-width="4" fill="none" stroke-linecap="round"/>
<g fill="#2b2b2b"><ellipse cx="38" cy="50" rx="4" ry="5"/><ellipse cx="62" cy="50" rx="4" ry="5"/></g><g fill="#fff"><circle cx="39.5" cy="48" r="1.4"/><circle cx="63.5" cy="48" r="1.4"/></g>
<path d="M43 60l7 7 7-7z" fill="#ff8a1e"/><g fill="#ff8a8a" opacity=".6"><circle cx="30" cy="62" r="5"/><circle cx="70" cy="62" r="5"/></g>`);

export const PIGLET_TILE = svg(100, 100, `
<ellipse cx="50" cy="93" rx="28" ry="5" fill="#000" opacity=".15"/>
<path d="M18 22l6 26 18-16z" fill="#ff8fab"/><path d="M82 22l-6 26-18-16z" fill="#ff8fab"/>
<circle cx="50" cy="56" r="37" fill="#ffadc0"/><circle cx="50" cy="53" r="32" fill="#ffc4d2"/>
<ellipse cx="50" cy="64" rx="15" ry="11" fill="#ff8fab"/><g fill="#c4506e"><ellipse cx="45" cy="64" rx="3" ry="4.5"/><ellipse cx="55" cy="64" rx="3" ry="4.5"/></g>
<g fill="#2b2b2b"><ellipse cx="36" cy="46" rx="4" ry="5"/><ellipse cx="64" cy="46" rx="4" ry="5"/></g><g fill="#fff"><circle cx="37.5" cy="44" r="1.4"/><circle cx="65.5" cy="44" r="1.4"/></g>
<g fill="#ff6f8f" opacity=".55"><circle cx="26" cy="60" r="5"/><circle cx="74" cy="60" r="5"/></g>`);

// Boosters 2 and 3
/** Lucky Horseshoe: +5 moves. */
export const ICON_HORSESHOE = svg(64, 64, `
<defs><linearGradient id="hsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a0"/><stop offset="1" stop-color="#e0a412"/></linearGradient></defs>
<ellipse cx="30" cy="59" rx="20" ry="4" fill="#000" opacity=".15"/>
<path d="M12 56V32a18 18 0 0 1 36 0v24H37V32a7 7 0 0 0-14 0v24z" fill="url(#hsg)" stroke="#b57a0a" stroke-width="2.5" stroke-linejoin="round"/>
<g fill="#8a5a0a"><circle cx="17.5" cy="48" r="1.8"/><circle cx="16.5" cy="38" r="1.8"/><circle cx="42.5" cy="48" r="1.8"/><circle cx="43.5" cy="38" r="1.8"/></g>
<path d="M16 30a14 14 0 0 1 10-12" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7" stroke-linecap="round"/>
<circle cx="48" cy="15" r="13" fill="#3fa63a" stroke="#fff" stroke-width="3"/>
<text x="48" y="20" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="13" text-anchor="middle" fill="#fff">+5</text>`);

/** Witch Fruit: a bewitched plum in a pointy hat; clears a 3×3 patch. */
export const ICON_WITCH = svg(64, 64, `
<defs><radialGradient id="wfg" cx="38%" cy="35%" r="70%"><stop offset="0" stop-color="#d9a2ff"/><stop offset="1" stop-color="#6a1fb8"/></radialGradient></defs>
<ellipse cx="32" cy="60" rx="18" ry="3.5" fill="#000" opacity=".15"/>
<circle cx="32" cy="40" r="23" fill="#c77dff" opacity=".25"/>
<circle cx="32" cy="40" r="19" fill="url(#wfg)"/>
<ellipse cx="24" cy="34" rx="4" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 24 34)"/>
<path d="M12 24h40l-4 4H16z" fill="#2b1a3a"/><path d="M19 24c4-2 7-13 17-21 1 7 5 15 9 21z" fill="#3a2350"/><path d="M21 21h21" stroke="#ffd23a" stroke-width="3"/>
<g fill="#1a0a2a"><circle cx="25" cy="40" r="2.6"/><circle cx="39" cy="40" r="2.6"/></g>
<path d="M24 47q8 6 16 0" stroke="#1a0a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<g fill="#b6ff6b"><path d="M54 12l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/><path d="M8 44l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z"/></g>`);

/** The goal icon for "collect any cropsies" (a basket of fruit; the farm's egg basket is ICON_BASKET). */
export const ICON_ANY_GOAL = svg(64, 64, `
<path d="M14 28c0-14 36-14 36 0" stroke="#8a5a2b" stroke-width="4" fill="none"/>
<circle cx="22" cy="30" r="8" fill="#e8413c"/><circle cx="34" cy="27" r="8" fill="#ffd23a"/><circle cx="44" cy="31" r="7" fill="#ff8a3d"/>
<path d="M8 32h48l-6 24H14z" fill="#c98b4a" stroke="#8a5a2b" stroke-width="2.5" stroke-linejoin="round"/>
<path d="M12 40h40M14 48h36M22 32l2 24M32 32v24M42 32l-2 24" stroke="#8a5a2b" stroke-width="2"/>`);

export const TILE_COLORS: Record<string, string> = {
  wheat: '#f3c54a', carrot: '#ff8a3d', apple: '#e8413c', berry: '#ff4d8a', sunflower: '#ffd23a', corn: '#f7cf3a', blueberry: '#4a6fe0',
  eggplant: '#7b3fd0', cabbage: '#3fc4cc',
};

export const ITEM_ICON: Record<string, string> = {
  wheat: ICON_WHEAT, corn: ICON_CORN, egg: ICON_EGG, feed: ICON_FEED, bread: ICON_BREAD,
  nail: ICON_NAIL, screw: ICON_SCREW, bolt: ICON_BOLT, tape: ICON_TAPE,
  coin: ICON_COIN, star: ICON_STAR, gem: ICON_GEM, xp: ICON_XP, chicken: ICON_CHICKEN,
  shovel: ICON_SHOVEL, moves: ICON_HORSESHOE, witch: ICON_WITCH,
};

/** The HUD icon of a match goal. */
export function goalIcon(g: { type: string; tile?: string }, animal?: string): string {
  if (g.type === 'collect') return g.tile === 'any' ? ICON_ANY_GOAL : TILE_ART[g.tile!];
  if (g.type === 'mud') return MUD_TILE;
  if (g.type === 'crate') return CRATE_TILE;
  if (g.type === 'soil') return ICON_SOIL;
  return animal === 'piglet' ? PIGLET_TILE : CHICK_TILE;
}

// Accepts either inline SVG markup (drawn above) or an image URL from ASSET below,
// so any art constant can be swapped for a file without touching its call sites.
export const svgUrl = (s: string): string =>
  s.trimStart().startsWith('<') ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}` : s;

// ---------------------------------------------------------------------------
// Image/sound files dropped into src/assets/ are picked up automatically, keyed by
// file name without extension: src/assets/grass_sickle.png -> ASSET.grass_sickle.
// Vite inlines them as data: URLs, so the build stays one dist/index.html.
const files = import.meta.glob<string>('./assets/*.{png,webp,jpg,jpeg,gif,svg,mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
});
export const ASSET: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace(/^.*\/|\.[^.]+$/g, ''), url]),
);

// ---------------------------------------------------------------------------
// The 50-level farm content: icons for every item, animal, building, pen and
// tree, merged from the art-*.ts modules (which import only art-core).


for (const [k, v] of Object.entries({ ...ITEM_ART, ...FEED_ART })) if (!ITEM_ICON[k]) ITEM_ICON[k] = v;
for (const [k, v] of Object.entries(CROP_ART)) CROP_STAGE[k] = v;

export const ANIMAL_ICON: Record<string, string> = { chicken: ICON_CHICKEN, ...ANIMAL_ART };
export const BUILDING_ICON: Record<string, string> = { feedmill: ICON_MILL, bakery: ICON_BAKERY, ...BUILDING_ART };
export const TREE_ICON: Record<string, { grow: string; ready: string }> = TREE_ART;
export const VISITOR_ART: string[] = VISITORS;
export const penArt = (type: string): PenArt => penArtOf(type);

/** A pickaxe: the mine has ore ready. */
export const ICON_PICK = svg(64, 64, `
<path d="M14 52L40 26" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/><path d="M16 50L40 26" stroke="#c0884a" stroke-width="2" stroke-linecap="round" opacity=".8"/>
<path d="M26 14c10-4 22-2 30 8-6-2-12-2-18 0-4-6-8-7-12-8z" fill="#8d98a6"/><path d="M28 16c8-2 18 0 24 6-5-1-10-1-15 1-3-4-6-6-9-7z" fill="#c3ccd8"/>`);
