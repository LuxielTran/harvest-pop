// Shared drawing helpers for every art module (art.ts and the art-*.ts files
// import from here, never from each other, so there are no import cycles).
// The farm is drawn in 2.5D: every building, plot and prop is projected with
// the same 2:1 isometric helper (light from the upper left).

export const svg = (w: number, h: number, body: string, extra = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${extra}>${body}</svg>`;

// ---------------------------------------------------------------------------
// 2.5D helpers. World axes: i runs right/back, j runs left/back, z up; (0,0,0)
// is the front corner of a footprint. The left (j) face is lit, the right (i)
// face is shaded, tops are brightest.

export type Pt = [number, number];
export type Proj = (i: number, j: number, z?: number) => Pt;
export const isoAt = (ox: number, oy: number): Proj => (i, j, z = 0) => [ox + i - j, oy - (i + j) / 2 - z];
export const n1 = (v: number): number => Math.round(v * 10) / 10;
export const pts = (a: Pt[]): string => a.map(([x, y]) => `${n1(x)},${n1(y)}`).join(' ');
export const pg = (a: Pt[], fill: string, extra = ''): string => `<polygon points="${pts(a)}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
export const ln = (a: Pt, b: Pt, stroke: string, w: number, extra = ''): string =>
  `<line x1="${n1(a[0])}" y1="${n1(a[1])}" x2="${n1(b[0])}" y2="${n1(b[1])}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${extra ? ` ${extra}` : ''}/>`;
export const SHADOW_FILTER = '<filter id="sh" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.5"/></filter>';

export interface FaceColors { l: string; r: string; t: string }
/** A box standing at (i0, j0, z0) with footprint wi × wj and height h. */
export function isoBox(p: Proj, i0: number, j0: number, z0: number, wi: number, wj: number, h: number, c: FaceColors): string {
  return pg([p(i0, j0 + wj, z0), p(i0, j0, z0), p(i0, j0, z0 + h), p(i0, j0 + wj, z0 + h)], c.l)
    + pg([p(i0, j0, z0), p(i0 + wi, j0, z0), p(i0 + wi, j0, z0 + h), p(i0, j0, z0 + h)], c.r)
    + pg([p(i0, j0 + wj, z0 + h), p(i0, j0, z0 + h), p(i0 + wi, j0, z0 + h), p(i0 + wi, j0 + wj, z0 + h)], c.t);
}
/** Soft ground shadow under a footprint. */
export const isoShadow = (p: Proj, wi: number, wj: number, pad = 6): string =>
  pg([p(-pad, wj + pad), p(-pad, -pad), p(wi + pad, -pad), p(wi + pad, wj + pad)], '#000', 'opacity=".2" filter="url(#sh)"');
/** Gable roof, ridge along i, overhanging by o. The gable triangle sits on the left face. */
export function isoRoof(p: Proj, wi: number, wj: number, h: number, rh: number, o: number, c: { near: string; far: string; ridge: string; gable: string }): string {
  const top = h + rh;
  return pg([p(-o, wj + o, h - 2), p(wi + o, wj + o, h - 2), p(wi + o, wj / 2, top + 1), p(-o, wj / 2, top + 1)], c.far)
    + pg([p(0, wj, h), p(0, 0, h), p(0, wj / 2, top)], c.gable)
    + pg([p(-o, -o, h - 2), p(wi + o, -o, h - 2), p(wi + o, wj / 2, top + 1), p(-o, wj / 2, top + 1)], c.near)
    + ln(p(-o, wj / 2, top + 1), p(wi + o, wj / 2, top + 1), c.ridge, 2.5)
    + ln(p(-o, -o, h - 2), p(wi + o, -o, h - 2), c.ridge, 1.5, 'opacity=".55"');
}
/** A quad on the right (i) face: i∈[a,b], z∈[z1,z2]. */
export const rightQuad = (p: Proj, a: number, b: number, z1: number, z2: number, j = 0): Pt[] => [p(a, j, z1), p(b, j, z1), p(b, j, z2), p(a, j, z2)];
/** A quad on the left (j) face: j∈[a,b], z∈[z1,z2]. */
export const leftQuad = (p: Proj, a: number, b: number, z1: number, z2: number, i = 0): Pt[] => [p(i, b, z1), p(i, a, z1), p(i, a, z2), p(i, b, z2)];
export const baseTrim = (p: Proj, wi: number, wj: number, color = '#fff'): string =>
  ln(p(0, wj, 0), p(0, 0, 0), color, 2, 'opacity=".45"') + ln(p(0, 0, 0), p(wi, 0, 0), color, 2, 'opacity=".45"');

// Animal feed: a burlap sack printed with the face of the animal it is for. Each animal's
// feed reuses feedSack() with its own face (drawn in a 24×24 box centred on 0,0).
export const feedSack = (face: string, tint: string): string => svg(64, 64, `
<ellipse cx="32" cy="60" rx="20" ry="3.5" fill="#000" opacity=".15"/>
<path d="M14 20c-2 12-3 26-1 36 1 3 3 4 6 4h26c3 0 5-1 6-4 2-10 1-24-1-36z" fill="#c9965a"/>
<path d="M18 22c-1 10-2 22 0 32" stroke="#e0b47c" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
<path d="M12 16c6 4 34 4 40 0l-2 7c-6 3-30 3-36 0z" fill="#a8743c"/>
<path d="M22 10c3 4 17 4 20 0l-1 6c-4 2-14 2-18 0z" fill="#8a5a2b"/>
<g fill="#f3c54a"><circle cx="27" cy="12" r="2.2"/><circle cx="32" cy="10.5" r="2.2"/><circle cx="37" cy="12" r="2.2"/></g>
<circle cx="32" cy="39" r="14" fill="#fff8e8" stroke="${tint}" stroke-width="2.5"/>
<g transform="translate(32 39)">${face}</g>`);

export const CHICKEN_FACE = `<path d="M-4 -12c-2-4 1-6 3-4 2-4 6-3 5 1 4-2 5 2 2 4z" fill="#e8413c"/>
<circle cx="0" cy="0" r="9" fill="#fff"/><path d="M-1 1l8 2-8 3z" fill="#f7a823"/><path d="M0 6c0 3-3 4-4 2" fill="#e8413c"/>
<circle cx="-3.5" cy="-2" r="1.8" fill="#2b2b2b"/><circle cx="3.5" cy="-2.5" r="1.8" fill="#2b2b2b"/>`;

/** A cartoon face (eyes, blush, smile) centred on (cx, cy) for a tile of size s. */
export const face = (cx: number, cy: number, s: number, mouthColor = '#5a2d0c'): string => `
<g fill="#2b2b2b"><ellipse cx="${cx - s * 0.22}" cy="${cy}" rx="${s * 0.075}" ry="${s * 0.1}"/><ellipse cx="${cx + s * 0.22}" cy="${cy}" rx="${s * 0.075}" ry="${s * 0.1}"/></g>
<g fill="#fff"><circle cx="${cx - s * 0.19}" cy="${cy - s * 0.04}" r="${s * 0.03}"/><circle cx="${cx + s * 0.25}" cy="${cy - s * 0.04}" r="${s * 0.03}"/></g>
<path d="M${cx - s * 0.14} ${cy + s * 0.14}q${s * 0.14} ${s * 0.14} ${s * 0.28} 0" stroke="${mouthColor}" stroke-width="${s * 0.05}" fill="none" stroke-linecap="round"/>
<g fill="#ff8a8a" opacity=".55"><circle cx="${cx - s * 0.36}" cy="${cy + s * 0.1}" r="${s * 0.07}"/><circle cx="${cx + s * 0.36}" cy="${cy + s * 0.1}" r="${s * 0.07}"/></g>`;

export const MESH = '<pattern id="mesh" width="8" height="7" patternUnits="userSpaceOnUse"><path d="M0 3.5L2 0h4l2 3.5L6 7H2z" fill="none" stroke="#fff" stroke-width=".9" opacity=".9"/></pattern>';

/** One side of chicken-wire fence from (i, j) a to b: mesh panel, rails, wooden posts. */
export function fenceSide(p: Proj, a: [number, number], b: [number, number]): string {
  const H = 22;
  let s = pg([p(a[0], a[1], 0), p(b[0], b[1], 0), p(b[0], b[1], H), p(a[0], a[1], H)], 'url(#mesh)');
  s += ln(p(a[0], a[1], H), p(b[0], b[1], H), '#a0522d', 2.5) + ln(p(a[0], a[1], 2), p(b[0], b[1], 2), '#a0522d', 2);
  for (let k = 0; k <= 4; k++) {
    const i = a[0] + ((b[0] - a[0]) * k) / 4;
    const j = a[1] + ((b[1] - a[1]) * k) / 4;
    s += ln(p(i, j, 0), p(i, j, H + 5), '#7a3d16', 4) + ln(p(i, j, 1), p(i, j, H + 4), '#c97a48', 1.3);
  }
  return s;
}
