// Animal sprites and feed sacks for every pen animal except the chicken (which lives in
// art.ts next to the coop). Same language as ICON_CHICKEN: 64×64, side view with the head
// on the right, soft overlapping shapes, no outlines, flat colour + a darker tone + a white
// glint in the eye, standing on a soft ellipse shadow. They are shown on a pen yard at about
// 38 px, so silhouettes stay bold and faces big.
// Imports only from art-core (never from art.ts: that would be an import cycle).

import { svg, feedSack } from './art-core';
import { ANIMALS } from './farm-data';

// ---------------------------------------------------------------------------
// Shared bits

const SHADOW = '<ellipse cx="34" cy="59" rx="16" ry="4" fill="#000" opacity=".16"/>';
/** A round dark eye with the white glint, radius r. */
const eye = (x: number, y: number, r = 2.2): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2b2b"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.33}" fill="#fff"/>`;
/** Four legs (the back pair a shade darker), feet on the ground at y = 58. */
const legs = (xs: number[], top: number, w: number, fill: string, dark: string, hoof?: string): string => {
  let s = '';
  xs.forEach((x, k) => {
    const c = k % 2 === 0 ? dark : fill;
    s += `<rect x="${x}" y="${top}" width="${w}" height="${58 - top}" rx="${w / 2.2}" fill="${c}"/>`;
    if (hoof) s += `<rect x="${x}" y="54" width="${w}" height="4.5" rx="${w / 3}" fill="${hoof}"/>`;
  });
  return s;
};
/** Soft water ripple for the pond animals (gradient id suffixed per animal). */
const ripple = (id: string): string => `<defs><radialGradient id="rp-${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9fdcf5"/><stop offset="1" stop-color="#5db5e6"/></radialGradient></defs>
<ellipse cx="32" cy="52" rx="27" ry="8" fill="url(#rp-${id})"/>
<path d="M12 50c6-3 12-3 18 0M34 54c5-3 10-3 15 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7"/>`;

// ---------------------------------------------------------------------------
// Animals

const COW = svg(64, 64, `${SHADOW}
${legs([13, 21, 31, 39], 44, 7, '#fff', '#e3dcd1', '#3a3a3a')}
<rect x="8" y="25" width="40" height="27" rx="13" fill="#fff"/>
<path d="M13 30c7-4 12 1 10 8-3 5-10 4-12-1-1-3 0-6 2-7z" fill="#2b2b2b"/>
<path d="M30 42c6-4 12-1 11 5-2 5-9 5-11 1-1-2-1-4 0-6z" fill="#2b2b2b"/>
<ellipse cx="29" cy="51" rx="6" ry="3.5" fill="#f6a9b8"/>
<path d="M9 30c-4 4-5 10-3 16" stroke="#e3dcd1" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="6" cy="47" r="2.6" fill="#2b2b2b"/>
<path d="M38 17c-3-4-2-8 2-8M52 17c3-4 2-8-2-8" stroke="#dcc49c" stroke-width="3.2" fill="none" stroke-linecap="round"/>
<ellipse cx="35" cy="22" rx="5.5" ry="3.2" fill="#fff" transform="rotate(-25 35 22)"/><ellipse cx="35" cy="22" rx="3.5" ry="1.8" fill="#f6a9b8" transform="rotate(-25 35 22)"/>
<circle cx="45" cy="25" r="11.5" fill="#fff"/>
<path d="M36 20c4-5 9-5 11 0 1 4-2 7-6 7-4-1-6-4-5-7z" fill="#2b2b2b"/>
<ellipse cx="51" cy="31" rx="8" ry="5.5" fill="#f6a9b8"/>
<circle cx="49" cy="31" r="1.2" fill="#c7748a"/><circle cx="54" cy="31" r="1.2" fill="#c7748a"/>
${eye(42, 23, 2.3)}${eye(51, 23, 2.0)}`);

const PIG = svg(64, 64, `${SHADOW}
${legs([14, 22, 32, 40], 46, 7, '#f7a6b9', '#e68aa2', '#c9748c')}
<ellipse cx="28" cy="39" rx="20" ry="14" fill="#f7a6b9"/>
<ellipse cx="26" cy="36" rx="14" ry="9" fill="#fbbbca"/>
<path d="M9 34c-5-3-8 1-5 5 3 3 7 0 4-3-2-2-5 0-3 2" stroke="#d9728f" stroke-width="2.8" fill="none" stroke-linecap="round"/>
<path d="M36 22c-3-8 2-14 9-9zM54 21c3-8-2-14-9-9z" fill="#e68aa2"/><path d="M38 20c-1-5 2-8 6-6zM52 19c1-5-2-8-6-6z" fill="#f7a6b9"/>
<circle cx="45" cy="28" r="12" fill="#f7a6b9"/>
<ellipse cx="53" cy="32" rx="6.5" ry="5" fill="#e68aa2"/>
<circle cx="51" cy="32" r="1.4" fill="#b85d78"/><circle cx="55.5" cy="32" r="1.4" fill="#b85d78"/>
<circle cx="40" cy="31" r="2.6" fill="#f58ea6" opacity=".7"/>
${eye(42, 25, 2.3)}${eye(50, 25, 2.0)}`);

const SHEEP = svg(64, 64, `${SHADOW}
${legs([15, 22, 33, 40], 46, 6, '#3a3a3a', '#2b2b2b')}
<g fill="#fdfdfd"><circle cx="16" cy="36" r="9"/><circle cx="25" cy="30" r="10"/><circle cx="36" cy="30" r="10"/><circle cx="22" cy="43" r="9"/><circle cx="34" cy="43" r="9"/><circle cx="44" cy="40" r="8"/><circle cx="29" cy="37" r="11"/></g>
<g fill="#ebe7e0"><circle cx="17" cy="45" r="5"/><circle cx="28" cy="48" r="5"/><circle cx="40" cy="47" r="4.5"/></g>
<path d="M11 40c-4 2-5 5-3 7" stroke="#fdfdfd" stroke-width="4" fill="none" stroke-linecap="round"/>
<ellipse cx="37" cy="22" rx="5" ry="2.8" fill="#3a3a3a" transform="rotate(-20 37 22)"/>
<circle cx="47" cy="27" r="10.5" fill="#3a3a3a"/>
<ellipse cx="57" cy="29" rx="4" ry="2.6" fill="#2b2b2b" transform="rotate(20 57 29)"/>
<g fill="#fdfdfd"><circle cx="42" cy="17" r="5"/><circle cx="48" cy="15" r="5.5"/><circle cx="53" cy="18" r="4.5"/></g>
<circle cx="42.5" cy="26" r="2.5" fill="#fff"/><circle cx="43" cy="26.3" r="1.6" fill="#2b2b2b"/><circle cx="43.5" cy="25.6" r=".6" fill="#fff"/>
<circle cx="51.5" cy="26" r="2.5" fill="#fff"/><circle cx="52" cy="26.3" r="1.6" fill="#2b2b2b"/><circle cx="52.5" cy="25.6" r=".6" fill="#fff"/>
<path d="M50 32c0 2-3 3-4 1" stroke="#777" stroke-width="1.3" fill="none" stroke-linecap="round"/>`);

const LAMB = svg(64, 64, `${SHADOW}
${legs([18, 24, 34, 40], 48, 5.5, '#e9c9a5', '#d4ad86')}
<g fill="#fff5dd"><circle cx="19" cy="41" r="8"/><circle cx="27" cy="36" r="9"/><circle cx="36" cy="36" r="9"/><circle cx="24" cy="46" r="8"/><circle cx="35" cy="46" r="7.5"/><circle cx="30" cy="41" r="10"/></g>
<g fill="#f2e2c4"><circle cx="20" cy="48" r="4"/><circle cx="30" cy="50" r="4"/></g>
<path d="M13 44c-3 1-4 4-2 6" stroke="#fff5dd" stroke-width="4" fill="none" stroke-linecap="round"/>
<ellipse cx="36" cy="25" rx="5" ry="3" fill="#e9c9a5" transform="rotate(-25 36 25)"/><ellipse cx="36" cy="25" rx="3" ry="1.6" fill="#f7a6b9" transform="rotate(-25 36 25)"/>
<circle cx="46" cy="30" r="11.5" fill="#e9c9a5"/>
<ellipse cx="56" cy="30" rx="4.5" ry="3" fill="#e9c9a5" transform="rotate(25 56 30)"/><ellipse cx="56.5" cy="30" rx="2.6" ry="1.6" fill="#f7a6b9" transform="rotate(25 56 30)"/>
<g fill="#fff5dd"><circle cx="40" cy="20" r="5"/><circle cx="46" cy="17" r="6"/><circle cx="52" cy="20" r="4.5"/></g>
<circle cx="42" cy="29" r="3" fill="#fff"/><circle cx="42.5" cy="29.3" r="2" fill="#2b2b2b"/><circle cx="43.2" cy="28.5" r=".7" fill="#fff"/>
<circle cx="51" cy="29" r="3" fill="#fff"/><circle cx="51.5" cy="29.3" r="2" fill="#2b2b2b"/><circle cx="52.2" cy="28.5" r=".7" fill="#fff"/>
<circle cx="39" cy="34" r="2.2" fill="#f58ea6" opacity=".6"/><circle cx="54" cy="34" r="2.2" fill="#f58ea6" opacity=".6"/>
<path d="M44 35q3 2.5 6 0" stroke="#b07c58" stroke-width="1.3" fill="none" stroke-linecap="round"/>`);

const GOAT = svg(64, 64, `${SHADOW}
${legs([14, 21, 33, 40], 45, 6, '#f1f1f1', '#cfd2d6', '#5a5a5a')}
<path d="M9 42c0-10 7-17 19-17h10c7 0 12 6 12 13v4c0 6-5 10-11 10H18c-6 0-9-4-9-10z" fill="#f1f1f1"/>
<path d="M12 36c4 6 20 8 34 4v6c0 4-4 7-9 7H18c-6 0-9-4-9-10z" fill="#d9dde2"/>
<path d="M10 31c-3-4-3-8 1-9" stroke="#cfd2d6" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M40 14c-4-7-1-12 5-12M48 13c-1-7 3-11 9-10" stroke="#7d6b5a" stroke-width="4.2" fill="none" stroke-linecap="round"/>
<ellipse cx="33" cy="20" rx="7" ry="3.2" fill="#cfd2d6" transform="rotate(-10 33 20)"/>
<path d="M38 18h10c6 0 11 5 11 11v8c0 2-2 4-4 4H40c-4 0-7-3-7-7v-8c0-4 2-8 5-8z" fill="#f1f1f1"/>
<path d="M44 30h12c2 0 3 2 3 4v5c0 1-1 2-2 2H45c-2 0-4-2-4-4v-3c0-2 1-4 3-4z" fill="#d9dde2"/>
<ellipse cx="57" cy="18" rx="7" ry="3.2" fill="#cfd2d6" transform="rotate(15 57 18)"/>
<path d="M49 41c-2 7 0 12 4 13 3-3 5-8 3-13z" fill="#c3c8ce"/>
<path d="M55 36c0 1-2 2-4 1" stroke="#777" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<circle cx="52.5" cy="35.5" r="1.2" fill="#9a8c7d"/><circle cx="57" cy="35.5" r="1.2" fill="#9a8c7d"/>
${eye(44, 25, 2.3)}${eye(53, 25, 2.0)}`);

const BEES = svg(64, 64, `<ellipse cx="34" cy="57" rx="18" ry="4" fill="#000" opacity=".12"/>
<path d="M12 33l-7 1 7 3z" fill="#2b2b2b"/>
<ellipse cx="32" cy="36" rx="19" ry="13" fill="#f7c92e"/>
<path d="M22 24c-1 8-1 16 0 24-2-1-4-2-6-4-1-5-1-11 0-16 2-2 4-3 6-4zM34 23c-1 9-1 17 0 26h-6c-1-9-1-17 0-26zM46 25c1 5 1 12 0 18-2 3-4 4-6 5 1-9 1-18 0-26 2 1 4 2 6 3z" fill="#2b2b2b"/>
<ellipse cx="22" cy="18" rx="9" ry="6" fill="#e9f6ff" opacity=".85" transform="rotate(-25 22 18)"/>
<ellipse cx="36" cy="16" rx="9" ry="6" fill="#e9f6ff" opacity=".85" transform="rotate(-10 36 16)"/>
<ellipse cx="24" cy="19" rx="5" ry="3" fill="#fff" opacity=".7" transform="rotate(-25 24 19)"/><ellipse cx="38" cy="17" rx="5" ry="3" fill="#fff" opacity=".7" transform="rotate(-10 38 17)"/>
<circle cx="48" cy="34" r="10" fill="#2b2b2b"/>
<path d="M46 25c-2-5 1-9 4-9M53 26c0-5 4-7 7-6" stroke="#2b2b2b" stroke-width="2" fill="none" stroke-linecap="round"/>
<circle cx="50" cy="16" r="2" fill="#2b2b2b"/><circle cx="60" cy="20" r="2" fill="#2b2b2b"/>
<circle cx="47" cy="33" r="3" fill="#fff"/><circle cx="47.5" cy="33.3" r="2" fill="#2b2b2b"/><circle cx="48.2" cy="32.5" r=".7" fill="#fff"/>
<circle cx="54" cy="33" r="2.5" fill="#fff"/><circle cx="54.5" cy="33.3" r="1.6" fill="#2b2b2b"/><circle cx="55" cy="32.6" r=".6" fill="#fff"/>
<path d="M49 39q3 2 6 0" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".8"/>
<circle cx="43" cy="39" r="2.2" fill="#f58ea6" opacity=".6"/>
<path d="M28 50v4M36 50v4M44 46v4" stroke="#2b2b2b" stroke-width="2.2" stroke-linecap="round"/>`);

const FISH = svg(64, 64, `${ripple('fish')}
<path d="M14 36l-10-10c-1 5-1 10 0 14l10-4z" fill="#ff8a3d"/><path d="M14 36l-10 10c-1-4-1-9 0-14z" fill="#e8702a"/>
<path d="M30 24c-4-6-2-11 1-13 3 3 5 8 5 13z" fill="#4aa8e8"/>
<ellipse cx="34" cy="36" rx="20" ry="12.5" fill="#ff9a45"/>
<path d="M18 40c4 4 10 6 18 6 6 0 10-1 14-4-4 6-12 8-20 6-6-1-10-4-12-8z" fill="#e8702a"/>
<path d="M27 25c-3 7-3 14 0 21M36 24c-3 8-3 16 0 24" stroke="#ffbe66" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9"/>
<path d="M30 40c2 4 5 6 10 4" stroke="#4aa8e8" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M26 28c-5-2-8 1-8 5 4-1 7-3 8-5z" fill="#4aa8e8"/>
<circle cx="45" cy="33" r="4.5" fill="#fff"/><circle cx="46" cy="33.3" r="2.8" fill="#2b2b2b"/><circle cx="47" cy="32.2" r="1" fill="#fff"/>
<path d="M52 40c-2 1-4 0-5-1" stroke="#b4461c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<circle cx="41" cy="40" r="2.3" fill="#ff6a6a" opacity=".55"/>`);

const LOBSTER = svg(64, 64, `${ripple('lobster')}
<path d="M4 44c0-4 3-7 7-7h2v8h-2c-3 0-5-1-7-1z" fill="#c9302c"/><path d="M4 44l-2 7c3-1 6-2 9-2z" fill="#e8413c"/>
<g fill="#e8413c"><ellipse cx="14" cy="40" rx="5" ry="6"/><ellipse cx="19" cy="40" rx="5" ry="6.5"/><ellipse cx="24" cy="40" rx="5" ry="7"/></g>
<path d="M13 46a1 1 0 0 0 6 0M18 46a1 1 0 0 0 6 0" fill="#c9302c"/>
<path d="M24 46l-4 6M28 47l-3 7M34 47l-1 7M40 46l2 7" stroke="#c9302c" stroke-width="2.6" stroke-linecap="round"/>
<ellipse cx="33" cy="38" rx="12" ry="10" fill="#e8413c"/>
<ellipse cx="33" cy="35" rx="8" ry="5" fill="#f26b5b"/>
<path d="M43 30c-3 1-5 3-5 6M43 36c-2 2-2 4-1 6" stroke="#c9302c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M42 36l7-6M42 41l4 2" stroke="#e8413c" stroke-width="5" stroke-linecap="round"/>
<path d="M46 43c4-4 10-4 14 0l-2 3c-3-1-6-1-9 1z" fill="#e8413c"/><path d="M46 43c2 6 7 10 13 10l1-3c-5-1-9-4-11-9z" fill="#c9302c"/><circle cx="46" cy="43" r="4" fill="#e8413c"/>
<path d="M49 30c2-8 8-11 14-8l-2 4c-3-1-6 0-8 3z" fill="#e8413c"/><path d="M49 30c6 4 12 5 15 2l-1 4c-5 2-11 0-14-6z" fill="#c9302c"/><circle cx="49" cy="30" r="4" fill="#e8413c"/>
<path d="M52 27c2-3 5-4 8-3" stroke="#f26b5b" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M38 26c0-8 3-13 7-16M42 26c3-7 7-11 12-12" stroke="#c9302c" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M38 30l-1-5M43 31l2-6" stroke="#c9302c" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="37" cy="24" r="3.2" fill="#fff"/><circle cx="37.4" cy="24.3" r="2" fill="#2b2b2b"/><circle cx="38" cy="23.5" r=".7" fill="#fff"/>
<circle cx="45.5" cy="24" r="3.2" fill="#fff"/><circle cx="45.9" cy="24.3" r="2" fill="#2b2b2b"/><circle cx="46.5" cy="23.5" r=".7" fill="#fff"/>
<path d="M39 34q3 2 6 0" stroke="#8c1f1b" stroke-width="1.3" fill="none" stroke-linecap="round"/>`);

const DUCK = svg(64, 64, `${SHADOW}
<path d="M14 30c-4-5-9-6-11-2 2 1 5 1 8 4z" fill="#f3ecd8"/>
<path d="M12 40c0-10 8-16 20-16h4c10 0 16 6 16 15 0 9-8 15-18 15-13 0-22-5-22-14z" fill="#fffaf0"/>
<path d="M18 36c4 10 20 12 32 6-1 8-8 12-16 12-10 0-16-5-16-18z" fill="#efe6d2"/>
<path d="M16 38c-2-7 3-12 10-12 6 0 10 4 9 10-5 1-13 2-19 2z" fill="#fff"/>
<path d="M18 34c-1-5 3-9 9-8" stroke="#e6ddc8" stroke-width="2" fill="none" stroke-linecap="round"/>
<circle cx="44" cy="24" r="11" fill="#fffaf0"/>
<circle cx="43" cy="22" r="8" fill="#fff"/>
<path d="M50 24c8-3 14-1 14 4 0 2-2 3-5 3l-10-1c-2 0-3-2-2-4 0-1 1-2 3-2z" fill="#f7b32b"/>
<path d="M48 29c5 2 11 2 16 0-1 3-4 5-9 5-4 0-7-2-7-5z" fill="#e4951c"/>
<circle cx="57" cy="26.5" r="1" fill="#c47d12"/>
${eye(46, 22, 2.4)}
<circle cx="52" cy="22" r="2.2" fill="#f58ea6" opacity=".5"/>
<path d="M30 54v5M38 54v5M25 60h9M33 60h9" stroke="#f08a1c" stroke-width="2.6" stroke-linecap="round"/>`);

const DOG = svg(64, 64, `${SHADOW}
${legs([12, 20, 32, 40], 44, 7, '#b07a44', '#8f5f31')}
<path d="M9 42c0-9 7-16 17-16h12c8 0 13 6 13 14v4c0 5-4 9-9 9H18c-6 0-9-4-9-10z" fill="#b07a44"/>
<path d="M22 44c6 2 12 2 18 0 1 4-1 7-5 7H27c-4 0-6-3-5-7z" fill="#e3c69c"/>
<path d="M9 36c-4-4-5-10-1-13" stroke="#8f5f31" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M36 25h10c6 0 11 5 11 11v4c0 2-2 4-4 4H38c-4 0-7-3-7-7v-7c0-3 2-5 5-5z" fill="#b07a44"/>
<circle cx="47" cy="22" r="11" fill="#b07a44"/>
<path d="M35 18c-2 4-4 10-2 16 2-1 4-5 4-11 0-2-1-4-2-5z" fill="#6f4624"/>
<path d="M57 20c3 4 4 10 2 16-2-2-4-6-4-11 0-2 1-4 2-5z" fill="#6f4624"/>
<path d="M33 43c5 4 15 4 21 0" stroke="#e8413c" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="44" cy="46.5" r="2" fill="#f3c54a"/>
<ellipse cx="51" cy="34" rx="8" ry="5.5" fill="#e3c69c"/>
<ellipse cx="55.5" cy="32" rx="3.4" ry="2.7" fill="#2b2b2b"/>
<path d="M53 36c-1 2-3 3-5 2" stroke="#6f4624" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M49 38c0 3 2 5 4 4 0-2-1-4-4-4z" fill="#f05a7a"/>
${eye(45, 24, 2.4)}${eye(53, 24, 2.1)}`);

const CAT = svg(64, 64, `${SHADOW}
${legs([14, 21, 31, 38], 45, 6.5, '#f5a142', '#d9842c')}
<path d="M10 40c0-8 6-14 15-14h10c8 0 13 5 13 13v4c0 5-4 9-9 9H18c-5 0-8-4-8-9z" fill="#f5a142"/>
<path d="M16 28c0 6 2 10 2 15M24 26c0 6 2 10 2 15M32 27c0 6 2 10 2 14" stroke="#d9842c" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M22 44c6 3 12 3 18 0 1 4-2 7-6 7h-6c-4 0-7-3-6-7z" fill="#fff0d6"/>
<path d="M10 40c-6-3-8-10-4-16" stroke="#f5a142" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M6 24c1 2 1 4 0 6" stroke="#d9842c" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<path d="M36 22l1-10 8 6zM56 22l-1-10-8 6z" fill="#f5a142"/><path d="M38 20l1-5 4 3zM54 20l-1-5-4 3z" fill="#f7a6b9"/>
<circle cx="46" cy="27" r="11.5" fill="#f5a142"/>
<path d="M40 18c2 4 1 8-1 11M46 17c1 4 0 8 0 10M52 18c-2 4-1 8 1 11" stroke="#d9842c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<ellipse cx="47" cy="33" rx="7" ry="4.5" fill="#fff0d6"/>
<path d="M45 31h4l-2 2.5z" fill="#f58ea6"/>
<path d="M47 33.5c0 2-2 3-3 2M47 33.5c0 2 2 3 3 2" stroke="#b86f28" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<path d="M36 32l6 1M36 36l6-1M58 32l-6 1M58 36l-6-1" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>
<circle cx="42" cy="26" r="2.6" fill="#5fb86a"/><circle cx="42.3" cy="26" r="1.3" fill="#2b2b2b"/><circle cx="43" cy="25.2" r=".7" fill="#fff"/>
<circle cx="51" cy="26" r="2.6" fill="#5fb86a"/><circle cx="51.3" cy="26" r="1.3" fill="#2b2b2b"/><circle cx="52" cy="25.2" r=".7" fill="#fff"/>`);

const HORSE = svg(64, 64, `${SHADOW}
${legs([11, 18, 31, 38], 42, 6.5, '#a8642e', '#84491f', '#3a2a1e')}
<path d="M9 32c-5 4-6 12-3 20" stroke="#4a2c14" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M7 38c0-10 7-16 17-16h8c6 0 10 2 13 6l4 6c2 3 0 8-4 10-4 2-7 4-13 4H16c-6 0-9-4-9-10z" fill="#a8642e"/>
<path d="M12 40c4 5 14 6 28 2l-2 4c-5 3-9 2-13 2H16c-3 0-5-3-4-8z" fill="#84491f"/>
<path d="M33 22c4-10 9-14 16-14l6 2 5 10c-6 1-10 4-12 9l-5 4c-4 2-8 0-10-5z" fill="#a8642e"/>
<path d="M36 18c3-6 8-10 13-10 3 0 5 1 6 2-3 1-6 4-7 8-2 4-5 6-8 7-2-2-4-4-4-7z" fill="#4a2c14"/>
<path d="M48 10c-1-5 2-7 4-6 1 2 1 4 0 6zM55 11c1-5 4-5 5-3 0 2-1 4-3 5z" fill="#84491f"/>
<path d="M49 20h8c4 0 7 3 7 7v6c0 3-2 5-5 5h-9c-3 0-5-2-5-5v-8c0-3 2-5 4-5z" fill="#84491f"/>
<path d="M53 30h6c3 0 5 2 5 4v1c0 2-2 3-4 3h-7c-2 0-4-2-4-4v-1c0-2 2-3 4-3z" fill="#e3c69c"/>
<circle cx="57" cy="34" r="1.3" fill="#84491f"/><circle cx="62" cy="34" r="1.1" fill="#84491f"/>
${eye(51, 22, 2.4)}`);

const BUNNY = svg(64, 64, `${SHADOW}
<path d="M12 50c0-8 7-14 16-14h10c8 0 14 6 14 13v1c0 4-3 7-7 7H18c-4 0-6-3-6-7z" fill="#f4f4f4"/>
<path d="M20 50c6 3 14 3 24 0-2 5-6 7-12 7s-11-2-12-7z" fill="#dfe0e4"/>
<circle cx="10" cy="46" r="5" fill="#fff"/>
<rect x="24" y="50" width="12" height="8" rx="4" fill="#dfe0e4"/><rect x="38" y="50" width="12" height="8" rx="4" fill="#dfe0e4"/>
<ellipse cx="37" cy="14" rx="5" ry="12" fill="#f4f4f4" transform="rotate(-12 37 14)"/><ellipse cx="37" cy="15" rx="2.6" ry="9" fill="#f7a6b9" transform="rotate(-12 37 15)"/>
<ellipse cx="50" cy="14" rx="5" ry="12" fill="#dfe0e4" transform="rotate(12 50 14)"/><ellipse cx="50" cy="15" rx="2.6" ry="9" fill="#f7a6b9" transform="rotate(12 50 15)"/>
<circle cx="44" cy="31" r="12.5" fill="#f4f4f4"/>
<ellipse cx="45" cy="37" rx="7" ry="4.5" fill="#fff"/>
<path d="M43 35h4l-2 2.5z" fill="#f58ea6"/>
<path d="M45 37.5c0 2-2 3-3 2M45 37.5c0 2 2 3 3 2" stroke="#9a9ca3" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<path d="M44 40h3v3h-3z" fill="#fff"/>
<circle cx="37" cy="36" r="2.4" fill="#f58ea6" opacity=".55"/><circle cx="53" cy="36" r="2.4" fill="#f58ea6" opacity=".55"/>
${eye(39, 29, 2.5)}${eye(50, 29, 2.4)}`);

const PUPPY = svg(64, 64, `${SHADOW}
${legs([16, 23, 33, 40], 47, 6.5, '#f1b55a', '#d8983f')}
<path d="M12 44c0-7 6-13 14-13h10c7 0 11 5 11 11v3c0 4-3 7-7 7H19c-4 0-7-3-7-8z" fill="#f1b55a"/>
<path d="M22 46c5 2 10 2 15 0 1 3-1 6-4 6h-7c-3 0-5-3-4-6z" fill="#fde7bd"/>
<path d="M12 40c-5-2-7-7-4-12" stroke="#f1b55a" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<circle cx="44" cy="25" r="14.5" fill="#f1b55a"/>
<path d="M31 17c-4 3-6 10-3 18 3-1 6-6 6-13 0-2-1-4-3-5z" fill="#c47f2c"/>
<path d="M57 17c4 3 6 10 3 18-3-1-6-6-6-13 0-2 1-4 3-5z" fill="#c47f2c"/>
<ellipse cx="46" cy="33" rx="8" ry="5.5" fill="#fde7bd"/>
<ellipse cx="47" cy="31" rx="3" ry="2.4" fill="#2b2b2b"/>
<path d="M47 33.5c0 2-2 3-3.5 2M47 33.5c0 2 2 3 3.5 2" stroke="#b07a2c" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<path d="M45 37c0 3 2 5 4 4 0-2-1-4-4-4z" fill="#f05a7a"/>
<circle cx="36" cy="30" r="2.6" fill="#f58ea6" opacity=".5"/><circle cx="57" cy="30" r="2.6" fill="#f58ea6" opacity=".5"/>
${eye(39, 24, 3)}${eye(52, 24, 3)}`);

const KITTEN = svg(64, 64, `${SHADOW}
${legs([16, 23, 33, 40], 47, 6.5, '#b7bcc6', '#9499a5')}
<path d="M12 44c0-7 6-13 14-13h10c7 0 11 5 11 11v3c0 4-3 7-7 7H19c-4 0-7-3-7-8z" fill="#b7bcc6"/>
<path d="M22 46c5 2 10 2 15 0 1 3-1 6-4 6h-7c-3 0-5-3-4-6z" fill="#f0f2f6"/>
<path d="M12 40c-7-1-10-8-6-14" stroke="#b7bcc6" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M6 26c2 2 2 4 1 6" stroke="#9499a5" stroke-width="4.5" fill="none" stroke-linecap="round"/>
<path d="M32 18l0-12 10 7zM58 18l0-12-10 7z" fill="#b7bcc6"/><path d="M35 15l0-6 5 4zM55 15l0-6-5 4z" fill="#f7a6b9"/>
<circle cx="45" cy="25" r="14.5" fill="#b7bcc6"/>
<path d="M38 14c2 4 1 8-1 11M45 13c1 4 0 8 0 10M52 14c-2 4-1 8 1 11" stroke="#9499a5" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<ellipse cx="46" cy="33" rx="8" ry="5.5" fill="#f0f2f6"/>
<path d="M44 30.5h4.5l-2.25 3z" fill="#f58ea6"/>
<path d="M46.2 33.5c0 2-2 3-3.5 2M46.2 33.5c0 2 2 3 3.5 2" stroke="#6c717c" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<path d="M33 32l7 1M33 36l7-1M59 32l-7 1M59 36l-7-1" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".9"/>
<circle cx="39" cy="24" r="3.4" fill="#6cc3e8"/><circle cx="39.4" cy="24.2" r="1.9" fill="#2b2b2b"/><circle cx="40.2" cy="23.2" r=".9" fill="#fff"/>
<circle cx="52" cy="24" r="3.4" fill="#6cc3e8"/><circle cx="52.4" cy="24.2" r="1.9" fill="#2b2b2b"/><circle cx="53.2" cy="23.2" r=".9" fill="#fff"/>
<circle cx="36" cy="31" r="2.4" fill="#f58ea6" opacity=".5"/><circle cx="56" cy="31" r="2.4" fill="#f58ea6" opacity=".5"/>`);

const DONKEY = svg(64, 64, `${SHADOW}
${legs([11, 18, 31, 38], 42, 6.5, '#a9adb5', '#878b94', '#4a4a4a')}
<path d="M9 34c-4 4-5 10-3 16" stroke="#878b94" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="7" cy="51" r="3" fill="#4a4a4a"/>
<path d="M7 38c0-10 7-16 17-16h8c6 0 10 2 13 6l4 6c2 3 0 8-4 10-4 2-7 4-13 4H16c-6 0-9-4-9-10z" fill="#a9adb5"/>
<path d="M12 40c4 5 14 6 28 2l-2 4c-5 3-9 2-13 2H16c-3 0-5-3-4-8z" fill="#878b94"/>
<path d="M22 24c6-2 14-2 20 1" stroke="#4a4a4a" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
<path d="M33 24c4-9 9-13 16-13l6 2 5 10c-6 1-10 4-12 9l-5 4c-4 2-8 0-10-5z" fill="#a9adb5"/>
<path d="M40 18c3-5 7-7 12-7-2 2-4 5-5 8-2 3-4 5-6 5-1-2-1-4-1-6z" fill="#4a4a4a"/>
<path d="M44 14c-3-8-2-13 1-14 3 1 5 6 4 13zM54 14c2-8 6-12 9-11 1 3-1 8-5 12z" fill="#a9adb5"/>
<path d="M45.5 12c-2-6-1-10 1-11 1 2 2 6 1 10zM54.5 12c1-6 4-9 6-9 0 3-2 6-4 9z" fill="#f7c6d0"/>
<path d="M49 21h8c4 0 7 3 7 7v6c0 3-2 5-5 5h-9c-3 0-5-2-5-5v-8c0-3 2-5 4-5z" fill="#a9adb5"/>
<path d="M53 30h6c3 0 5 2 5 4v1c0 2-2 3-4 3h-7c-2 0-4-2-4-4v-1c0-2 2-3 4-3z" fill="#eef0f4"/>
<circle cx="57" cy="34" r="1.3" fill="#878b94"/><circle cx="62" cy="34" r="1.1" fill="#878b94"/>
${eye(51, 23, 2.4)}`);

export const ANIMAL_ART: Record<string, string> = {
  cow: COW, pig: PIG, sheep: SHEEP, lamb: LAMB, goat: GOAT, bees: BEES, fish: FISH, lobster: LOBSTER,
  duck: DUCK, dog: DOG, cat: CAT, horse: HORSE, bunny: BUNNY, puppy: PUPPY, kitten: KITTEN, donkey: DONKEY,
};

// ---------------------------------------------------------------------------
// Faces printed on the feed sacks (24×24, centred on 0,0 — see CHICKEN_FACE).

const COW_FACE = `<path d="M-8 -7c-2-3-1-6 2-6M8 -7c2-3 1-6-2-6" stroke="#dcc49c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<ellipse cx="-9" cy="-3" rx="3.5" ry="2" fill="#fff" transform="rotate(-20 -9 -3)"/><ellipse cx="9" cy="-3" rx="3.5" ry="2" fill="#fff" transform="rotate(20 9 -3)"/>
<circle cx="0" cy="0" r="9" fill="#fff"/>
<path d="M-7 -5c3-4 8-4 9 0 0 3-3 5-6 4-3-1-4-3-3-4z" fill="#2b2b2b"/>
<ellipse cx="0" cy="5" rx="6.5" ry="4" fill="#f6a9b8"/>
<circle cx="-2.3" cy="5" r="1" fill="#c7748a"/><circle cx="2.3" cy="5" r="1" fill="#c7748a"/>
<circle cx="-3.5" cy="-2" r="1.8" fill="#2b2b2b"/><circle cx="3.5" cy="-2" r="1.8" fill="#2b2b2b"/>
<circle cx="-2.9" cy="-2.6" r=".6" fill="#fff"/><circle cx="4.1" cy="-2.6" r=".6" fill="#fff"/>`;

const PIG_FACE = `<path d="M-9 -4c-3-5 1-9 4-5zM9 -4c3-5-1-9-4-5z" fill="#e68aa2"/>
<circle cx="0" cy="0" r="9.5" fill="#f7a6b9"/>
<ellipse cx="0" cy="3.5" rx="5.5" ry="4" fill="#e68aa2"/>
<circle cx="-2" cy="3.5" r="1.2" fill="#b85d78"/><circle cx="2" cy="3.5" r="1.2" fill="#b85d78"/>
<circle cx="-3.5" cy="-2.5" r="1.8" fill="#2b2b2b"/><circle cx="3.5" cy="-2.5" r="1.8" fill="#2b2b2b"/>
<circle cx="-2.9" cy="-3.1" r=".6" fill="#fff"/><circle cx="4.1" cy="-3.1" r=".6" fill="#fff"/>`;

const SHEEP_FACE = `<g fill="#fdfdfd"><circle cx="-6" cy="-7" r="4.5"/><circle cx="0" cy="-9" r="5"/><circle cx="6" cy="-7" r="4.5"/></g>
<ellipse cx="-9.5" cy="-1" rx="3.5" ry="2" fill="#3a3a3a" transform="rotate(-20 -9.5 -1)"/><ellipse cx="9.5" cy="-1" rx="3.5" ry="2" fill="#3a3a3a" transform="rotate(20 9.5 -1)"/>
<circle cx="0" cy="1" r="8" fill="#3a3a3a"/>
<circle cx="-3.5" cy="0" r="2.4" fill="#fff"/><circle cx="-3.2" cy=".2" r="1.5" fill="#2b2b2b"/><circle cx="-2.7" cy="-.4" r=".5" fill="#fff"/>
<circle cx="3.5" cy="0" r="2.4" fill="#fff"/><circle cx="3.8" cy=".2" r="1.5" fill="#2b2b2b"/><circle cx="4.3" cy="-.4" r=".5" fill="#fff"/>
<path d="M-2 5q2 2 4 0" stroke="#999" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

const LAMB_FACE = `<g fill="#fff5dd"><circle cx="-6" cy="-7" r="4.5"/><circle cx="0" cy="-9" r="5"/><circle cx="6" cy="-7" r="4.5"/></g>
<ellipse cx="-9.5" cy="-1" rx="4" ry="2.2" fill="#e9c9a5" transform="rotate(-25 -9.5 -1)"/><ellipse cx="-9.5" cy="-1" rx="2.4" ry="1.2" fill="#f7a6b9" transform="rotate(-25 -9.5 -1)"/>
<ellipse cx="9.5" cy="-1" rx="4" ry="2.2" fill="#e9c9a5" transform="rotate(25 9.5 -1)"/><ellipse cx="9.5" cy="-1" rx="2.4" ry="1.2" fill="#f7a6b9" transform="rotate(25 9.5 -1)"/>
<circle cx="0" cy="1" r="8" fill="#e9c9a5"/>
<circle cx="-3.5" cy="0" r="2.6" fill="#fff"/><circle cx="-3.2" cy=".2" r="1.7" fill="#2b2b2b"/><circle cx="-2.6" cy="-.5" r=".6" fill="#fff"/>
<circle cx="3.5" cy="0" r="2.6" fill="#fff"/><circle cx="3.8" cy=".2" r="1.7" fill="#2b2b2b"/><circle cx="4.4" cy="-.5" r=".6" fill="#fff"/>
<circle cx="-5.5" cy="4" r="1.6" fill="#f58ea6" opacity=".6"/><circle cx="5.5" cy="4" r="1.6" fill="#f58ea6" opacity=".6"/>
<path d="M-2 5q2 2 4 0" stroke="#b07c58" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;

const GOAT_FACE = `<path d="M-5 -8c-1-5 1-8 4-8M5 -8c1-5-1-8-4-8" stroke="#8c7b6a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<ellipse cx="-10" cy="-2" rx="4.5" ry="2" fill="#cfd2d6" transform="rotate(-10 -10 -2)"/><ellipse cx="10" cy="-2" rx="4.5" ry="2" fill="#cfd2d6" transform="rotate(10 10 -2)"/>
<path d="M-7 -8h14c2 0 3 1 3 3v8c0 4-4 7-8 7h-4c-4 0-8-3-8-7v-8c0-2 1-3 3-3z" fill="#f1f1f1"/>
<path d="M-4 6c1 5 3 7 4 7 1 0 3-2 4-7z" fill="#d9dde2"/>
<ellipse cx="0" cy="4.5" rx="4.5" ry="2.5" fill="#d9dde2"/>
<circle cx="-1.8" cy="4.5" r=".9" fill="#9a8c7d"/><circle cx="1.8" cy="4.5" r=".9" fill="#9a8c7d"/>
<circle cx="-3.8" cy="-2" r="1.8" fill="#2b2b2b"/><circle cx="3.8" cy="-2" r="1.8" fill="#2b2b2b"/>
<circle cx="-3.2" cy="-2.6" r=".6" fill="#fff"/><circle cx="4.4" cy="-2.6" r=".6" fill="#fff"/>`;

export const ANIMAL_FACE: Record<string, string> = { cow: COW_FACE, pig: PIG_FACE, sheep: SHEEP_FACE, lamb: LAMB_FACE, goat: GOAT_FACE };

export const FEED_ART: Record<string, string> = {
  cowfeed: feedSack(COW_FACE, '#2b2b2b'),
  pigfeed: feedSack(PIG_FACE, '#f28aa8'),
  sheepfeed: feedSack(SHEEP_FACE, '#5db5e6'),
  lambfeed: feedSack(LAMB_FACE, '#f2b56b'),
  goatfeed: feedSack(GOAT_FACE, '#8fa88a'),
};

// Every animal in the data (except the chicken, drawn in art.ts) must have a sprite, and
// every bespoke feed item must have a sack.
for (const a of Object.values(ANIMALS)) {
  if (a.id !== 'chicken' && !ANIMAL_ART[a.id]) throw new Error(`art-animals: no sprite for animal ${a.id}`);
}
for (const id of ['cowfeed', 'pigfeed', 'sheepfeed', 'lambfeed', 'goatfeed']) {
  if (!FEED_ART[id]) throw new Error(`art-animals: no sack for ${id}`);
}
