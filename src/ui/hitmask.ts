// Pixel hit-testing for the farm map: a tap lands on a building only where its
// art is drawn, not on the transparent corners of its box. Each art image gets
// a small alpha mask, read once; until it is ready (or if the browser will not
// let it be read) the whole box counts, as before.

interface Mask { w: number; h: number; alpha: Uint8ClampedArray; svg: boolean; }

const MAX_SIDE = 160;
/** Alpha (0–255) a pixel needs to count as drawn. */
const SOLID = 40;
/** Slack around the drawn shape, as a fraction of the art's longer side. */
const SLACK = 0.03;

const masks = new Map<string, Mask | null>();

function viewBox(src: string): { w: number; h: number } | null {
  const m = /viewBox=(?:"|')\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/.exec(decodeURIComponent(src));
  return m ? { w: Number(m[1]), h: Number(m[2]) } : null;
}

/** Start reading an image's alpha mask (once per src). */
export function preloadMask(src: string): void {
  if (!src || masks.has(src)) return;
  masks.set(src, null);
  const svg = src.startsWith('data:image/svg');
  const im = new Image();
  im.onload = () => {
    const vb = svg ? viewBox(src) : null;
    const nw = vb?.w || im.naturalWidth || 100;
    const nh = vb?.h || im.naturalHeight || 100;
    const k = Math.min(1, MAX_SIDE / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * k));
    const h = Math.max(1, Math.round(nh * k));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return;
    try {
      g.drawImage(im, 0, 0, w, h);
      masks.set(src, { w, h, alpha: g.getImageData(0, 0, w, h).data, svg });
    } catch { /* unreadable (tainted): the whole box keeps counting */ }
  };
  im.src = src;
}

/** Is the art of `img` drawn at client point (x, y)? True while its mask is not ready. */
function drawnAt(img: HTMLImageElement, x: number, y: number): boolean {
  const src = img.getAttribute('src') ?? '';
  const m = masks.get(src);
  if (m === undefined) preloadMask(src);
  if (!m) return true;
  const r = img.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  // An SVG keeps its aspect inside the box (centred); a bitmap fills it.
  let sx = r.width / m.w, sy = r.height / m.h, ox = r.left, oy = r.top;
  if (m.svg) {
    const s = Math.min(sx, sy);
    ox += (r.width - m.w * s) / 2;
    oy += (r.height - m.h * s) / 2;
    sx = sy = s;
  }
  const u = (x - ox) / sx;
  const v = (y - oy) / sy;
  const tol = Math.max(1, Math.round(Math.max(m.w, m.h) * SLACK));
  for (let dy = -tol; dy <= tol; dy += tol) {
    for (let dx = -tol; dx <= tol; dx += tol) {
      const px = Math.floor(u + dx), py = Math.floor(v + dy);
      if (px < 0 || py < 0 || px >= m.w || py >= m.h) continue;
      if (m.alpha[(py * m.w + px) * 4 + 3] >= SOLID) return true;
    }
  }
  return false;
}

const inside = (e: Element, x: number, y: number): boolean => {
  const r = e.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
};

/**
 * Does a tap at client (x, y) hit map object `obj`? Fields are their whole
 * shape already; a building / pen / tree counts on its drawn art, and on any
 * badge it carries (bubbles, animals, lock marks, timers).
 */
export function objectHit(obj: HTMLElement, x: number, y: number): boolean {
  if (obj.classList.contains('plot')) return true;
  const art = [...obj.querySelectorAll<HTMLImageElement>(':scope > img.bld, :scope > img.pen')];
  if (!art.length) return true;
  for (const child of obj.children) if (!art.includes(child as HTMLImageElement) && inside(child, x, y)) return true;
  return art.some((img) => drawnAt(img, x, y));
}

/** Read the masks of an object's art ahead of the first tap. */
export function preloadObject(obj: HTMLElement): void {
  for (const img of obj.querySelectorAll<HTMLImageElement>(':scope > img.bld, :scope > img.pen')) preloadMask(img.getAttribute('src') ?? '');
}
