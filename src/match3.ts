// Match-3 engine: a seeded 8×8 board of 5 tile kinds, swap-only-if-match,
// clear → gravity → spawn → cascade, legal-move detection and free reshuffle.
// Pure logic: the UI animates whatever each step returns.

import { BOARD_SIZE, TILE_KINDS, type MatchLevelConfig, type TileKind } from './config';

export interface Tile { id: number; kind: TileKind; }
export interface Pos { r: number; c: number; }
export interface Fall { tile: Tile; fromR: number; toR: number; c: number; }
export interface GravityResult { falls: Fall[]; spawned: Fall[]; }
export interface Move { a: Pos; b: Pos; }

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Board {
  readonly n = BOARD_SIZE;
  grid: (Tile | null)[][];
  private rng: () => number;
  private nextId = 1;
  private weights: number[];

  constructor(cfg: MatchLevelConfig, seedOffset = 0) {
    this.rng = mulberry32(cfg.seed + seedOffset);
    this.weights = TILE_KINDS.map((k) => (k === cfg.goal.tile ? cfg.goalWeight : 1));
    this.grid = Array.from({ length: this.n }, () => Array<Tile | null>(this.n).fill(null));
    this.fillInitial();
  }

  private randomKind(exclude?: Set<TileKind>): TileKind {
    let total = 0;
    for (let i = 0; i < TILE_KINDS.length; i++) if (!exclude?.has(TILE_KINDS[i])) total += this.weights[i];
    let x = this.rng() * total;
    for (let i = 0; i < TILE_KINDS.length; i++) {
      if (exclude?.has(TILE_KINDS[i])) continue;
      x -= this.weights[i];
      if (x <= 0) return TILE_KINDS[i];
    }
    return TILE_KINDS[TILE_KINDS.length - 1];
  }

  private newTile(kind: TileKind): Tile { return { id: this.nextId++, kind }; }

  at(r: number, c: number): Tile | null {
    return r >= 0 && r < this.n && c >= 0 && c < this.n ? this.grid[r][c] : null;
  }

  /** Fill with no initial matches, then make sure a legal move exists. */
  private fillInitial(): void {
    for (let attempt = 0; attempt < 50; attempt++) {
      for (let r = 0; r < this.n; r++) {
        for (let c = 0; c < this.n; c++) {
          const ex = new Set<TileKind>();
          const l1 = this.at(r, c - 1), l2 = this.at(r, c - 2);
          if (l1 && l2 && l1.kind === l2.kind) ex.add(l1.kind);
          const u1 = this.at(r - 1, c), u2 = this.at(r - 2, c);
          if (u1 && u2 && u1.kind === u2.kind) ex.add(u1.kind);
          this.grid[r][c] = this.newTile(this.randomKind(ex));
        }
      }
      if (this.legalMoves().length > 0) return;
    }
  }

  /** Every cell that is part of a horizontal or vertical run of ≥3. */
  findMatches(): Pos[] {
    const hit = new Set<number>();
    for (let r = 0; r < this.n; r++) {
      let run = 1;
      for (let c = 1; c <= this.n; c++) {
        const same = c < this.n && this.grid[r][c] && this.grid[r][c - 1] && this.grid[r][c]!.kind === this.grid[r][c - 1]!.kind;
        if (same) run++;
        else { if (run >= 3) for (let k = c - run; k < c; k++) hit.add(r * this.n + k); run = 1; }
      }
    }
    for (let c = 0; c < this.n; c++) {
      let run = 1;
      for (let r = 1; r <= this.n; r++) {
        const same = r < this.n && this.grid[r][c] && this.grid[r - 1][c] && this.grid[r][c]!.kind === this.grid[r - 1][c]!.kind;
        if (same) run++;
        else { if (run >= 3) for (let k = r - run; k < r; k++) hit.add(k * this.n + c); run = 1; }
      }
    }
    return [...hit].map((i) => ({ r: Math.floor(i / this.n), c: i % this.n }));
  }

  private matchAt(r: number, c: number): boolean {
    const t = this.grid[r][c];
    if (!t) return false;
    let h = 1;
    for (let k = c - 1; k >= 0 && this.grid[r][k]?.kind === t.kind; k--) h++;
    for (let k = c + 1; k < this.n && this.grid[r][k]?.kind === t.kind; k++) h++;
    if (h >= 3) return true;
    let v = 1;
    for (let k = r - 1; k >= 0 && this.grid[k][c]?.kind === t.kind; k--) v++;
    for (let k = r + 1; k < this.n && this.grid[k][c]?.kind === t.kind; k++) v++;
    return v >= 3;
  }

  static adjacent(a: Pos, b: Pos): boolean { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1; }

  swap(a: Pos, b: Pos): void {
    const t = this.grid[a.r][a.c];
    this.grid[a.r][a.c] = this.grid[b.r][b.c];
    this.grid[b.r][b.c] = t;
  }

  /** True when swapping a and b makes a match (the board is left unchanged). */
  wouldMatch(a: Pos, b: Pos): boolean {
    if (!Board.adjacent(a, b) || !this.grid[a.r][a.c] || !this.grid[b.r][b.c]) return false;
    this.swap(a, b);
    const ok = this.matchAt(a.r, a.c) || this.matchAt(b.r, b.c);
    this.swap(a, b);
    return ok;
  }

  legalMoves(): Move[] {
    const out: Move[] = [];
    for (let r = 0; r < this.n; r++) {
      for (let c = 0; c < this.n; c++) {
        if (c + 1 < this.n && this.wouldMatch({ r, c }, { r, c: c + 1 })) out.push({ a: { r, c }, b: { r, c: c + 1 } });
        if (r + 1 < this.n && this.wouldMatch({ r, c }, { r: r + 1, c })) out.push({ a: { r, c }, b: { r: r + 1, c } });
      }
    }
    return out;
  }

  /** A legal move whose cleared tiles include the most goal tiles (used for hints). */
  bestHint(goal: TileKind): Move | null {
    const moves = this.legalMoves();
    if (!moves.length) return null;
    let best = moves[0];
    let bestScore = -1;
    for (const m of moves) {
      this.swap(m.a, m.b);
      const cleared = this.findMatches();
      this.swap(m.a, m.b);
      const score = cleared.reduce((n, p) => n + (this.grid[p.r][p.c]?.kind === goal ? 3 : 1), 0);
      if (score > bestScore) { bestScore = score; best = m; }
    }
    return best;
  }

  /** Remove every matched tile; returns what was cleared (kinds counted by the caller). */
  clearMatches(): { pos: Pos; kind: TileKind; id: number }[] {
    const out: { pos: Pos; kind: TileKind; id: number }[] = [];
    for (const p of this.findMatches()) {
      const t = this.grid[p.r][p.c];
      if (!t) continue;
      out.push({ pos: p, kind: t.kind, id: t.id });
      this.grid[p.r][p.c] = null;
    }
    return out;
  }

  /** Drop tiles into holes and spawn new ones above; returns the motions to animate. */
  applyGravity(): GravityResult {
    const falls: Fall[] = [];
    const spawned: Fall[] = [];
    for (let c = 0; c < this.n; c++) {
      let write = this.n - 1;
      for (let r = this.n - 1; r >= 0; r--) {
        const t = this.grid[r][c];
        if (!t) continue;
        if (write !== r) {
          this.grid[write][c] = t;
          this.grid[r][c] = null;
          falls.push({ tile: t, fromR: r, toR: write, c });
        }
        write--;
      }
      let above = -1;
      for (let r = write; r >= 0; r--) {
        const t = this.newTile(this.randomKind());
        this.grid[r][c] = t;
        spawned.push({ tile: t, fromR: above--, toR: r, c });
      }
    }
    return { falls, spawned };
  }

  /** Dead board: redeal the same tiles until a legal move exists and no match is on the board. */
  reshuffle(): void {
    const tiles: Tile[] = [];
    for (const row of this.grid) for (const t of row) if (t) tiles.push(t);
    for (let attempt = 0; attempt < 200; attempt++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      let k = 0;
      for (let r = 0; r < this.n; r++) for (let c = 0; c < this.n; c++) this.grid[r][c] = tiles[k++];
      if (this.findMatches().length === 0 && this.legalMoves().length > 0) return;
    }
    // Pathological: deal a fresh board.
    this.fillInitial();
  }
}
