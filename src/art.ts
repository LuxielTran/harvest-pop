// Original vector art in a bright, rounded farm-cartoon style: items,
// buildings, crop stages and the five "cropsie" match tiles with faces.
// Everything is an inline SVG string so the single-file build stays one file.

const svg = (w: number, h: number, body: string, extra = ''): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${extra}>${body}</svg>`;

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

export const ICON_FEED = svg(64, 64, `
<path d="M14 24h36l-3 32H17z" fill="#b5763a"/><path d="M12 16h40v10H12z" fill="#d79553"/><path d="M14 18h36v3H14z" fill="#f0b574"/>
<g fill="#f3c54a"><circle cx="24" cy="34" r="3"/><circle cx="34" cy="38" r="3"/><circle cx="42" cy="32" r="3"/><circle cx="28" cy="46" r="3"/><circle cx="40" cy="46" r="3"/></g>
<text x="32" y="60" font-family="Arial,sans-serif" font-weight="700" font-size="9" text-anchor="middle" fill="#fff">FEED</text>`);

export const ICON_BREAD = svg(64, 64, `
<path d="M10 40c0-12 10-22 22-22s22 10 22 22v8a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="#b97a2c"/>
<path d="M12 40c0-11 9-20 20-20s20 9 20 20v6H12z" fill="#e6a94c"/>
<path d="M20 30c4-4 8-4 12 0M34 30c4-4 8-4 12 0" stroke="#fde3b0" stroke-width="3" fill="none" stroke-linecap="round"/>`);

// ---------------------------------------------------------------------------
// Animals & buildings

export const ICON_CHICKEN = svg(64, 64, `
<ellipse cx="32" cy="58" rx="14" ry="3" fill="#000" opacity=".12"/>
<path d="M14 36c0-12 9-20 20-20s18 8 18 20-8 20-18 20-20-8-20-20z" fill="#fff6e8"/>
<path d="M20 40c0-8 6-14 14-14s12 6 12 14-5 12-12 12-14-4-14-12z" fill="#fff"/>
<circle cx="40" cy="28" r="12" fill="#fff6e8"/><circle cx="40" cy="27" r="10" fill="#fff"/>
<path d="M38 14c-2-4 1-7 4-5 2-4 7-3 6 1 4-2 6 2 3 5z" fill="#e8413c"/>
<path d="M50 30l8 2-8 3z" fill="#f7a823"/><path d="M46 36c0 3-3 5-5 3" fill="#e8413c"/>
<circle cx="44" cy="26" r="2.2" fill="#2b2b2b"/><circle cx="44.8" cy="25.3" r=".7" fill="#fff"/>
<path d="M14 34c-6-2-10-1-9 4 0-2 3-3 9-1z" fill="#f2cf98"/>
<path d="M30 54v6M36 54v6M27 60h6M33 60h6" stroke="#f7a823" stroke-width="2.5" stroke-linecap="round"/>`);

export const ICON_COOP = svg(96, 96, `
<path d="M8 50L48 14l40 36v34H8z" fill="#c8552c"/><path d="M12 52L48 20l36 32v30H12z" fill="#e76a3a"/>
<path d="M4 52L48 12l44 40-4 4L48 20 8 56z" fill="#8b3a1c"/>
<rect x="36" y="56" width="24" height="30" rx="3" fill="#5d2c12"/><rect x="39" y="59" width="18" height="24" rx="2" fill="#2e1608"/>
<rect x="14" y="60" width="14" height="12" rx="2" fill="#ffe9a8"/><rect x="68" y="60" width="14" height="12" rx="2" fill="#ffe9a8"/>
<path d="M14 66h14M21 60v12M68 66h14M75 60v12" stroke="#8b3a1c" stroke-width="2"/>
<rect x="0" y="86" width="96" height="6" rx="2" fill="#9b6b3c"/>`);

export const ICON_BARN = svg(96, 96, `
<path d="M10 44L48 12l38 32v44H10z" fill="#a8302a"/><path d="M14 46L48 18l34 28v38H14z" fill="#d6413a"/>
<path d="M6 46L48 10l42 36-4 5L48 18 10 51z" fill="#6f1f1a"/>
<path d="M30 54h36v34H30z" fill="#7c2d26"/><path d="M33 57h30v28H33z" fill="#f2f0e4"/>
<path d="M33 57l30 28M63 57L33 85" stroke="#d6413a" stroke-width="4"/><path d="M48 57v28" stroke="#d6413a" stroke-width="3"/>
<rect x="40" y="26" width="16" height="16" rx="2" fill="#fff" opacity=".9"/><path d="M40 34h16M48 26v16" stroke="#a8302a" stroke-width="2"/>
<rect x="0" y="86" width="96" height="6" rx="2" fill="#9b6b3c"/>`);

export const ICON_SILO = svg(96, 96, `
<path d="M26 30c0-14 44-14 44 0v56H26z" fill="#9aa5b3"/><path d="M30 30c0-10 36-10 36 0v54H30z" fill="#d4dbe5"/>
<path d="M26 22l22-14 22 14-6 4-16-10-16 10z" fill="#6f7a88"/><path d="M28 20l20-12 20 12v4H28z" fill="#8d98a6"/>
<path d="M30 44h36M30 58h36M30 72h36" stroke="#9aa5b3" stroke-width="2"/>
<path d="M40 28c0-4 16-4 16 0" stroke="#fff" stroke-width="2" fill="none" opacity=".5"/>
<rect x="62" y="30" width="6" height="54" fill="#8d98a6"/><path d="M60 36h10M60 46h10M60 56h10M60 66h10M60 76h10" stroke="#6f7a88" stroke-width="2"/>
<rect x="0" y="86" width="96" height="6" rx="2" fill="#9b6b3c"/>`);

export const ICON_MILL = svg(96, 96, `
<path d="M28 44h40v42H28z" fill="#8a5a2b"/><path d="M32 46h32v38H32z" fill="#c98b4a"/>
<path d="M24 46l24-18 24 18z" fill="#6b3f17"/><path d="M28 44l20-14 20 14z" fill="#9f6531"/>
<rect x="42" y="60" width="12" height="24" rx="2" fill="#4a2a0e"/>
<g stroke="#e9e2cf" stroke-width="5" stroke-linecap="round"><path d="M48 30L28 12M48 30l20-18M48 30l-20 18M48 30l20 18"/></g>
<circle cx="48" cy="30" r="5" fill="#d64a3a"/>
<path d="M32 50h32" stroke="#e7b06a" stroke-width="2"/>
<rect x="0" y="86" width="96" height="6" rx="2" fill="#9b6b3c"/>`);

export const ICON_BAKERY = svg(96, 96, `
<path d="M12 40h72v46H12z" fill="#b76a4a"/><path d="M16 44h64v38H16z" fill="#f0c7a0"/>
<path d="M8 40l40-24 40 24-4 6L48 24 12 46z" fill="#7c3e2a"/>
<rect x="36" y="56" width="24" height="26" rx="12" fill="#4a2a0e"/><path d="M40 70h16" stroke="#f7a23b" stroke-width="4" stroke-linecap="round"/>
<rect x="62" y="12" width="10" height="20" fill="#7c3e2a"/>
<rect x="0" y="86" width="96" height="6" rx="2" fill="#9b6b3c"/>`);

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
// Crop stages on a plot (used by the farm scene)

export const CROP_STAGE: Record<string, string[]> = {
  wheat: [
    svg(64, 64, `<g stroke="#5fb85c" stroke-width="3" stroke-linecap="round"><path d="M20 56v-10M32 56v-14M44 56v-10"/></g>`),
    svg(64, 64, `<g stroke="#8dc63f" stroke-width="3.5" stroke-linecap="round"><path d="M16 58V30M26 58V22M36 58V26M46 58V30"/></g><g fill="#c7d85a"><ellipse cx="26" cy="20" rx="3" ry="6"/><ellipse cx="36" cy="24" rx="3" ry="6"/></g>`),
    svg(64, 64, `<g stroke="#c9a227" stroke-width="3.5" stroke-linecap="round"><path d="M14 60V28M24 60V18M34 60V22M44 60V16M52 60V26"/></g><g fill="#f3c54a" stroke="#c9961f"><ellipse cx="14" cy="22" rx="4" ry="8"/><ellipse cx="24" cy="12" rx="4" ry="8"/><ellipse cx="34" cy="16" rx="4" ry="8"/><ellipse cx="44" cy="10" rx="4" ry="8"/><ellipse cx="52" cy="20" rx="4" ry="8"/></g>`),
  ],
  corn: [
    svg(64, 64, `<g stroke="#5fb85c" stroke-width="3" stroke-linecap="round"><path d="M22 56v-12M42 56v-12"/></g>`),
    svg(64, 64, `<g stroke="#3e9a3c" stroke-width="4" stroke-linecap="round"><path d="M22 58V24M42 58V20"/><path d="M22 40c-8-2-12-8-12-12M42 36c8-2 12-8 12-12" fill="none"/></g>`),
    svg(64, 64, `<g stroke="#3e9a3c" stroke-width="4" stroke-linecap="round"><path d="M20 60V14M44 60V10"/><path d="M20 40c-8-2-12-8-12-12M44 36c8-2 12-8 12-12M20 28c-6-2-8-6-8-8M44 24c6-2 8-6 8-8" fill="none"/></g><g fill="#f7cf3a"><ellipse cx="26" cy="34" rx="5" ry="10" transform="rotate(-20 26 34)"/><ellipse cx="38" cy="30" rx="5" ry="10" transform="rotate(20 38 30)"/></g>`),
  ],
};

// ---------------------------------------------------------------------------
// Match tiles: five cropsies with faces (goal tiles pulse in the UI)

const face = (cx: number, cy: number, s: number, mouthColor = '#5a2d0c'): string => `
<g fill="#2b2b2b"><ellipse cx="${cx - s * 0.22}" cy="${cy}" rx="${s * 0.075}" ry="${s * 0.1}"/><ellipse cx="${cx + s * 0.22}" cy="${cy}" rx="${s * 0.075}" ry="${s * 0.1}"/></g>
<g fill="#fff"><circle cx="${cx - s * 0.19}" cy="${cy - s * 0.04}" r="${s * 0.03}"/><circle cx="${cx + s * 0.25}" cy="${cy - s * 0.04}" r="${s * 0.03}"/></g>
<path d="M${cx - s * 0.14} ${cy + s * 0.14}q${s * 0.14} ${s * 0.14} ${s * 0.28} 0" stroke="${mouthColor}" stroke-width="${s * 0.05}" fill="none" stroke-linecap="round"/>
<g fill="#ff8a8a" opacity=".55"><circle cx="${cx - s * 0.36}" cy="${cy + s * 0.1}" r="${s * 0.07}"/><circle cx="${cx + s * 0.36}" cy="${cy + s * 0.1}" r="${s * 0.07}"/></g>`;

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
<defs><radialGradient id="tb" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ff6b9a"/><stop offset="1" stop-color="#d9144e"/></radialGradient></defs>
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
};

export const TILE_COLORS: Record<string, string> = {
  wheat: '#f3c54a', carrot: '#ff8a3d', apple: '#e8413c', berry: '#ff4d8a', sunflower: '#ffd23a',
};

export const ITEM_ICON: Record<string, string> = {
  wheat: ICON_WHEAT, corn: ICON_CORN, egg: ICON_EGG, feed: ICON_FEED, bread: ICON_BREAD,
  nail: ICON_NAIL, screw: ICON_SCREW, bolt: ICON_BOLT, tape: ICON_TAPE,
  coin: ICON_COIN, star: ICON_STAR, xp: ICON_XP, chicken: ICON_CHICKEN,
};

export const svgUrl = (s: string): string => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;
