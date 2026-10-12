// Match-3 engine (pure logic, no DOM). Boards up to 9×9 of any shape, with
//   • cropsies (3–5 kinds per level), swap-only-if-match, cascades;
//   • power-ups: 4 in a line → Tractor Cropsy (clears a row or a column),
//     5 in a line → Rainbow Seed (swap it with a cropsy to clear every one of
//     that kind); they also appear from cascades and, rarely, from the drop;
//   • blockers: Mud (1 layer), Wooden Crate (2 layers) — hit by matches next to
//     them, by blasts through them and by boosters;
//   • Soil under cells, plowed when a cropsy on it is cleared;
//   • farm animals that fall like cropsies and leave the board on the bottom row;
//   • CC-style gravity: straight down, then diagonal slides around blockers and holes.
// The UI animates what each call returns; the level-tuning bot plays the same calls.

import { goalNeed, type GoalDef, type MatchLevelConfig, type TileKind } from './config';

export type Special = 'row' | 'col' | 'rainbow' | null;
export interface Tile { id: number; kind: string; special: Special; animal: boolean; }
export interface Pos { r: number; c: number; }
export interface Move { a: Pos; b: Pos; }
export interface Blocker { type: 'mud' | 'crate'; hp: number; }
export interface Hit { pos: Pos; power?: 'all'; }
export interface Blast { type: 'row' | 'col' | 'rainbow' | 'cross'; pos: Pos; targets?: Pos[]; }
export interface StepCtx { swap?: [Pos, Pos]; hits?: Hit[]; consumed?: Pos[]; blasts?: Blast[]; }
export interface StepResult {
  cleared: { pos: Pos; tile: Tile }[];
  created: { pos: Pos; tile: Tile; from: Tile }[];
  blasts: Blast[];
  blockers: { pos: Pos; type: 'mud' | 'crate'; hp: number }[];
  plowed: Pos[];
}
export interface Fall { tile: Tile; path: Pos[]; spawned: boolean; }
interface Run { dir: 'h' | 'v'; kind: string; cells: Pos[]; }

export class Rng {
  s: number;
  constructor(seed: number) { this.s = seed >>> 0; }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** A cropsy that can take part in a line (Tractor Cropsies keep their kind). */
export const matchable = (t: Tile | null | undefined): t is Tile => !!t && !t.animal && t.special !== 'rainbow';

export class Board {
  rows: number;
  cols: number;
  mask: boolean[][];
  block: (Blocker | null)[][];
  soil: boolean[][];
  grid: (Tile | null)[][];
  /** Spawn points: the top cell of every column. */
  spawners: Pos[];
  rng: Rng;
  nextId = 1;
  kinds: TileKind[];
  weights: number[];
  powerChance: number;
  animalKind: string | null;
  animalsPending: number;
  exitDist: number[][];
  animalSpawnDist = 0;

  constructor(cfg: MatchLevelConfig, seedOffset = 0) {
    this.rng = new Rng(cfg.seed + seedOffset);
    this.rows = cfg.map.length;
    this.cols = Math.max(...cfg.map.map((r) => r.length));
    this.kinds = cfg.colors.slice();
    this.weights = this.kinds.map((k) => cfg.weights?.[k] ?? 1);
    this.powerChance = cfg.powerChance;
    const R = this.rows, C = this.cols;
    this.mask = Array.from({ length: R }, () => Array<boolean>(C).fill(false));
    this.block = Array.from({ length: R }, () => Array<Blocker | null>(C).fill(null));
    this.soil = Array.from({ length: R }, () => Array<boolean>(C).fill(false));
    this.grid = Array.from({ length: R }, () => Array<Tile | null>(C).fill(null));
    const animalAt: Pos[] = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const ch = cfg.map[r][c] ?? 'x';
      this.mask[r][c] = ch !== 'x';
      if (ch === 'm' || ch === 'M') this.block[r][c] = { type: 'mud', hp: 1 };
      if (ch === 'c' || ch === 'C') this.block[r][c] = { type: 'crate', hp: 2 };
      this.soil[r][c] = ch === 's' || ch === 'M' || ch === 'C';
      if (ch === 'a') animalAt.push({ r, c });
    }
    this.spawners = [];
    for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) if (this.mask[r][c]) { this.spawners.push({ r, c }); break; }
    // Steps from each cell to the nearest exit (the hint uses it to walk animals out).
    this.exitDist = Array.from({ length: R }, () => Array<number>(C).fill(99));
    const queue: Pos[] = [];
    for (let c = 0; c < C; c++) if (this.mask[R - 1][c]) { this.exitDist[R - 1][c] = 0; queue.push({ r: R - 1, c }); }
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i];
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const r = p.r + dr, c = p.c + dc;
        if (this.inBounds(r, c) && this.mask[r][c] && this.exitDist[r][c] > this.exitDist[p.r][p.c] + 1) {
          this.exitDist[r][c] = this.exitDist[p.r][p.c] + 1;
          queue.push({ r, c });
        }
      }
    }
    this.animalSpawnDist = Math.min(...this.spawners.map((s) => this.exitDist[s.r][s.c]));
    const animalGoal = cfg.goals.find((g): g is Extract<GoalDef, { type: 'animal' }> => g.type === 'animal');
    this.animalKind = animalGoal ? cfg.animal ?? 'chick' : null;
    this.animalsPending = animalGoal ? Math.max(0, animalGoal.qty - animalAt.length) : 0;
    this.fillInitial(animalGoal ? animalAt : []);
  }

  /**
   * A copy that can be played forward without touching this board (hints, the tuning bot).
   * Its random stream is independent, so what drops in next is a guess, never the real future.
   */
  clone(): Board {
    const b = Object.create(Board.prototype) as Board;
    Object.assign(b, this);
    b.block = this.block.map((row) => row.map((x) => (x ? { ...x } : null)));
    b.soil = this.soil.map((row) => row.slice());
    b.grid = this.grid.map((row) => row.slice());
    b.rng = new Rng((this.rng.s ^ 0x9e3779b9) + this.nextId);
    return b;
  }

  // -------------------------------------------------------------------------
  // Cells

  inBounds(r: number, c: number): boolean { return r >= 0 && c >= 0 && r < this.rows && c < this.cols; }
  /** A cell that can hold a cropsy right now (exists, not blocked). */
  open(r: number, c: number): boolean { return this.inBounds(r, c) && this.mask[r][c] && !this.block[r][c]; }
  at(r: number, c: number): Tile | null { return this.open(r, c) ? this.grid[r][c] : null; }
  /** Animals leave the board from the bottom row. */
  isExit(r: number, c: number): boolean { return r === this.rows - 1 && this.mask[r][c]; }

  private newTile(kind: string, special: Special = null, animal = false): Tile {
    return { id: this.nextId++, kind, special, animal };
  }

  private randomKind(exclude?: Set<string>): TileKind {
    let total = 0;
    for (let i = 0; i < this.kinds.length; i++) if (!exclude?.has(this.kinds[i])) total += this.weights[i];
    if (total <= 0) return this.kinds[Math.floor(this.rng.next() * this.kinds.length)];
    let x = this.rng.next() * total;
    for (let i = 0; i < this.kinds.length; i++) {
      if (exclude?.has(this.kinds[i])) continue;
      x -= this.weights[i];
      if (x <= 0) return this.kinds[i];
    }
    return this.kinds[this.kinds.length - 1];
  }

  countAnimals(): number {
    let n = 0;
    for (const row of this.grid) for (const t of row) if (t?.animal) n++;
    return n;
  }

  /** What falls in from the top: an animal when one is due, otherwise a cropsy (rarely a Tractor Cropsy). */
  private spawnTile(allowAnimal: boolean): Tile {
    if (allowAnimal && this.animalKind && this.animalsPending > 0) {
      const on = this.countAnimals();
      if (on === 0 || (on < 2 && this.rng.next() < 0.12)) {
        this.animalsPending--;
        return this.newTile(this.animalKind, null, true);
      }
    }
    const kind = this.randomKind();
    if (this.powerChance > 0 && this.rng.next() < this.powerChance) return this.newTile(kind, this.rng.next() < 0.5 ? 'row' : 'col');
    return this.newTile(kind);
  }

  /** Fill with no initial lines, then make sure a legal move exists. */
  private fillInitial(animalAt: Pos[]): void {
    const isAnimal = (r: number, c: number): boolean => animalAt.some((p) => p.r === r && p.c === c);
    for (let attempt = 0; attempt < 100; attempt++) {
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        this.grid[r][c] = null;
        if (!this.open(r, c)) continue;
        if (isAnimal(r, c)) { this.grid[r][c] = this.newTile(this.animalKind!, null, true); continue; }
        const ex = new Set<string>();
        const l1 = this.at(r, c - 1), l2 = this.at(r, c - 2);
        if (matchable(l1) && matchable(l2) && l1.kind === l2.kind) ex.add(l1.kind);
        const u1 = this.at(r - 1, c), u2 = this.at(r - 2, c);
        if (matchable(u1) && matchable(u2) && u1.kind === u2.kind) ex.add(u1.kind);
        this.grid[r][c] = this.newTile(this.randomKind(ex));
      }
      if (this.legalMoves().length > 0) return;
    }
  }

  // -------------------------------------------------------------------------
  // Lines and moves

  private findRuns(): Run[] {
    const runs: Run[] = [];
    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const t = this.at(r, c);
        if (!matchable(t)) { c++; continue; }
        let e = c + 1;
        while (e < this.cols) { const u = this.at(r, e); if (!matchable(u) || u.kind !== t.kind) break; e++; }
        if (e - c >= 3) runs.push({ dir: 'h', kind: t.kind, cells: Array.from({ length: e - c }, (_, k) => ({ r, c: c + k })) });
        c = e;
      }
    }
    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const t = this.at(r, c);
        if (!matchable(t)) { r++; continue; }
        let e = r + 1;
        while (e < this.rows) { const u = this.at(e, c); if (!matchable(u) || u.kind !== t.kind) break; e++; }
        if (e - r >= 3) runs.push({ dir: 'v', kind: t.kind, cells: Array.from({ length: e - r }, (_, k) => ({ r: r + k, c })) });
        r = e;
      }
    }
    return runs;
  }

  hasMatches(): boolean { return this.findRuns().length > 0; }

  private matchAt(r: number, c: number): boolean {
    const t = this.at(r, c);
    if (!matchable(t)) return false;
    const same = (rr: number, cc: number): boolean => { const u = this.at(rr, cc); return matchable(u) && u.kind === t.kind; };
    let h = 1;
    for (let k = c - 1; same(r, k); k--) h++;
    for (let k = c + 1; same(r, k); k++) h++;
    if (h >= 3) return true;
    let v = 1;
    for (let k = r - 1; same(k, c); k--) v++;
    for (let k = r + 1; same(k, c); k++) v++;
    return v >= 3;
  }

  static adjacent(a: Pos, b: Pos): boolean { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1; }

  swap(a: Pos, b: Pos): void {
    const t = this.grid[a.r][a.c];
    this.grid[a.r][a.c] = this.grid[b.r][b.c];
    this.grid[b.r][b.c] = t;
  }

  /** Both cells hold something that can move. */
  canSwap(a: Pos, b: Pos): boolean {
    return Board.adjacent(a, b) && !!this.at(a.r, a.c) && !!this.at(b.r, b.c);
  }

  /** A swap that counts as a move: it makes a line, or it fires a power-up combo. */
  validSwap(a: Pos, b: Pos): boolean {
    if (!this.canSwap(a, b)) return false;
    const ta = this.grid[a.r][a.c]!, tb = this.grid[b.r][b.c]!;
    if (ta.special === 'rainbow' || tb.special === 'rainbow') return !ta.animal && !tb.animal;
    if (ta.special && tb.special) return true;
    this.swap(a, b);
    const ok = this.matchAt(a.r, a.c) || this.matchAt(b.r, b.c);
    this.swap(a, b);
    return ok;
  }

  legalMoves(): Move[] {
    const out: Move[] = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      if (this.validSwap({ r, c }, { r, c: c + 1 })) out.push({ a: { r, c }, b: { r, c: c + 1 } });
      if (this.validSwap({ r, c }, { r: r + 1, c })) out.push({ a: { r, c }, b: { r: r + 1, c } });
    }
    return out;
  }

  private tilesOfKind(kind: string): Pos[] {
    const out: Pos[] = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const t = this.at(r, c);
      if (matchable(t) && t.kind === kind) out.push({ r, c });
    }
    return out;
  }

  private commonKind(): string {
    const n = new Map<string, number>();
    for (const row of this.grid) for (const t of row) if (matchable(t)) n.set(t.kind, (n.get(t.kind) ?? 0) + 1);
    let best: string = this.kinds[0], bestN = -1;
    for (const [k, v] of n) if (v > bestN) { best = k; bestN = v; }
    return best;
  }

  /** Do the swap and work out a power-up combo, if the pair makes one. Returns what `step` should resolve. */
  beginSwap(a: Pos, b: Pos): StepCtx {
    this.swap(a, b);
    const ta = this.grid[a.r][a.c]!, tb = this.grid[b.r][b.c]!;
    const rbA = ta.special === 'rainbow', rbB = tb.special === 'rainbow';
    const swapPair: [Pos, Pos] = [a, b];
    if (rbA && rbB) {
      const hits: Hit[] = [];
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.mask[r][c]) hits.push({ pos: { r, c } });
      return { swap: swapPair, hits, consumed: [a, b], blasts: [{ type: 'rainbow', pos: b, targets: hits.map((h) => h.pos) }] };
    }
    if (rbA || rbB) {
      const seed = rbA ? a : b, other = rbA ? tb : ta;
      const targets = this.tilesOfKind(other.kind);
      return { swap: swapPair, hits: targets.map((pos) => ({ pos })), consumed: [seed], blasts: [{ type: 'rainbow', pos: seed, targets }] };
    }
    if (ta.special && tb.special) {
      const hits: Hit[] = [];
      for (let c = 0; c < this.cols; c++) hits.push({ pos: { r: b.r, c } });
      for (let r = 0; r < this.rows; r++) hits.push({ pos: { r, c: b.c } });
      return { swap: swapPair, hits, consumed: [a, b], blasts: [{ type: 'cross', pos: b }] };
    }
    return { swap: swapPair };
  }

  // -------------------------------------------------------------------------
  // One clear step: lines → power-ups made → blasts chained → blockers hit → soil plowed

  step(ctx: StepCtx = {}): StepResult | null {
    const res: StepResult = { cleared: [], created: [], blasts: [...(ctx.blasts ?? [])], blockers: [], plowed: [] };
    const C = this.cols;
    const key = (p: Pos): number => p.r * C + p.c;
    const pos = (k: number): Pos => ({ r: Math.floor(k / C), c: k % C });
    const clear = new Set<number>();
    const fired = new Set<number>();
    const blockHit = new Map<number, 'one' | 'all'>();
    const creations = new Map<number, { pos: Pos; tile: Tile; from: Tile }>();

    for (const p of ctx.consumed ?? []) {
      const t = this.grid[p.r][p.c];
      if (t) { fired.add(t.id); clear.add(key(p)); }
    }

    // Lines, and the power-ups the long ones grow.
    const runs = this.findRuns().sort((x, y) => y.cells.length - x.cells.length);
    const claimed = new Set<number>();
    for (const run of runs) {
      if (run.cells.length < 4 || run.cells.some((p) => claimed.has(key(p)))) continue;
      const inRun = (s: Pos): boolean => run.cells.some((p) => p.r === s.r && p.c === s.c);
      const plain = (p: Pos): boolean => !this.grid[p.r][p.c]!.special;
      let at = (ctx.swap ?? []).slice().reverse().find((s) => inRun(s) && plain(s));
      if (!at) {
        const free = run.cells.filter(plain);
        if (!free.length) continue;
        at = free[Math.floor(this.rng.next() * free.length)];
      }
      const special: Special = run.cells.length >= 5 ? 'rainbow' : run.dir === 'h' ? 'col' : 'row';
      const tile = this.newTile(special === 'rainbow' ? 'rainbow' : run.kind, special);
      creations.set(key(at), { pos: at, tile, from: this.grid[at.r][at.c]! });
      for (const p of run.cells) claimed.add(key(p));
    }
    for (const run of runs) for (const p of run.cells) if (!creations.has(key(p))) clear.add(key(p));

    const hit = (p: Pos, power?: 'all'): void => {
      if (!this.inBounds(p.r, p.c) || !this.mask[p.r][p.c]) return;
      const k = key(p);
      if (this.block[p.r][p.c]) {
        if (power === 'all') blockHit.set(k, 'all');
        else if (!blockHit.has(k)) blockHit.set(k, 'one');
        return;
      }
      const t = this.grid[p.r][p.c];
      if (!t || t.animal || creations.has(k)) return;
      clear.add(k);
    };
    for (const h of ctx.hits ?? []) hit(h.pos, h.power);

    // Every power-up caught in the clear fires, and may catch more.
    for (let grew = true; grew;) {
      grew = false;
      for (const k of [...clear]) {
        const p = pos(k);
        const t = this.grid[p.r][p.c];
        if (!t?.special || fired.has(t.id)) continue;
        fired.add(t.id);
        grew = true;
        if (t.special === 'row') { res.blasts.push({ type: 'row', pos: p }); for (let c = 0; c < C; c++) hit({ r: p.r, c }); }
        else if (t.special === 'col') { res.blasts.push({ type: 'col', pos: p }); for (let r = 0; r < this.rows; r++) hit({ r, c: p.c }); }
        else {
          const targets = this.tilesOfKind(this.commonKind());
          res.blasts.push({ type: 'rainbow', pos: p, targets });
          for (const q of targets) hit(q);
        }
      }
    }

    const touched: Pos[] = [];
    for (const k of clear) {
      const p = pos(k);
      const t = this.grid[p.r][p.c];
      if (!t) continue;
      res.cleared.push({ pos: p, tile: t });
      this.grid[p.r][p.c] = null;
      touched.push(p);
    }
    for (const cr of creations.values()) {
      this.grid[cr.pos.r][cr.pos.c] = cr.tile;
      res.created.push(cr);
      touched.push(cr.pos);
    }
    for (const p of touched) {
      if (this.soil[p.r][p.c]) { this.soil[p.r][p.c] = false; res.plowed.push(p); }
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = { r: p.r + dr, c: p.c + dc };
        if (this.inBounds(q.r, q.c) && this.block[q.r][q.c] && !blockHit.has(key(q))) blockHit.set(key(q), 'one');
      }
    }
    for (const [k, power] of blockHit) {
      const p = pos(k);
      const b = this.block[p.r][p.c];
      if (!b) continue;
      const hp = power === 'all' ? 0 : b.hp - 1;
      res.blockers.push({ pos: p, type: b.type, hp });
      this.block[p.r][p.c] = hp > 0 ? { type: b.type, hp } : null;
    }
    if (!res.cleared.length && !res.created.length && !res.blockers.length && !res.blasts.length) return null;
    return res;
  }

  /** Animals standing on the bottom row leave the board. */
  collectAnimals(): { pos: Pos; tile: Tile }[] {
    const out: { pos: Pos; tile: Tile }[] = [];
    const r = this.rows - 1;
    for (let c = 0; c < this.cols; c++) {
      const t = this.at(r, c);
      if (t?.animal) { out.push({ pos: { r, c }, tile: t }); this.grid[r][c] = null; }
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // Gravity: fall straight, refill from the top, then slide diagonally into
  // cells nothing can fall into (under blockers, beside holes).

  applyGravity(): Fall[] {
    const falls = new Map<number, Fall>();
    const rec = (t: Tile, from: Pos, to: Pos, spawned = false): void => {
      let f = falls.get(t.id);
      if (!f) { f = { tile: t, path: [from], spawned }; falls.set(t.id, f); }
      f.path.push(to);
    };
    const spawnedIn = new Array<number>(this.cols).fill(0);
    for (let guard = 0; guard < 4000; guard++) {
      let moved = false;
      for (let c = 0; c < this.cols; c++) {
        for (let r = this.rows - 2; r >= 0; r--) {
          const t = this.grid[r][c];
          if (!t || !this.open(r, c)) continue;
          let rr = r;
          while (this.open(rr + 1, c) && !this.grid[rr + 1][c]) {
            this.grid[rr + 1][c] = t;
            this.grid[rr][c] = null;
            rec(t, { r: rr, c }, { r: rr + 1, c });
            rr++;
            moved = true;
          }
        }
      }
      for (const s of this.spawners) {
        if (!this.open(s.r, s.c) || this.grid[s.r][s.c]) continue;
        // Animals drop in only from the columns nearest an exit (like Candy Crush's ingredient spawners).
        const t = this.spawnTile(this.exitDist[s.r][s.c] <= this.animalSpawnDist);
        this.grid[s.r][s.c] = t;
        const n = spawnedIn[s.c]++;
        rec(t, { r: s.r - 1 - n, c: s.c }, s, true);
        moved = true;
      }
      if (moved) continue;
      slide: for (let r = this.rows - 1; r >= 1; r--) {
        for (let c = 0; c < this.cols; c++) {
          if (!this.open(r, c) || this.grid[r][c]) continue;
          for (const dc of (r + c + guard) % 2 ? [-1, 1] : [1, -1]) {
            const sc = c + dc;
            if (!this.open(r - 1, sc)) continue;
            const t = this.grid[r - 1][sc];
            if (!t) continue;
            if (this.open(r, sc) && !this.grid[r][sc]) continue; // it would rather fall straight
            this.grid[r][c] = t;
            this.grid[r - 1][sc] = null;
            rec(t, { r: r - 1, c: sc }, { r, c });
            moved = true;
            break slide;
          }
        }
      }
      if (!moved) break;
    }
    return [...falls.values()];
  }

  /** Dead board: redeal the cropsies (animals stay) until a legal move exists and no line is on the board. */
  reshuffle(): boolean {
    const cells: Pos[] = [];
    const tiles: Tile[] = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const t = this.at(r, c);
      if (t && !t.animal) { cells.push({ r, c }); tiles.push(t); }
    }
    const ok = (): boolean => this.findRuns().length === 0 && this.legalMoves().length > 0;
    for (let attempt = 0; attempt < 200; attempt++) {
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(this.rng.next() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }
      cells.forEach((p, i) => { this.grid[p.r][p.c] = tiles[i]; });
      if (ok()) return true;
    }
    for (let attempt = 0; attempt < 200; attempt++) {
      for (const p of cells) this.grid[p.r][p.c] = this.newTile(this.randomKind());
      if (ok()) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Whole turns (used by the hint, the tuning bot and the tests)

  /** Resolve until the board is still: clear steps, animals out, gravity. */
  resolveAll(ctx: StepCtx): { steps: StepResult[]; animals: number } {
    const steps: StepResult[] = [];
    let animals = 0;
    for (let i = 0; i < 80; i++) {
      const res = this.step(ctx);
      ctx = {};
      const out = this.collectAnimals();
      if (!res && !out.length) break;
      if (res) steps.push(res);
      animals += out.length;
      this.applyGravity();
    }
    return { steps, animals };
  }

  /** The hint: the legal move that helps the goals most, judged on a copy of the board. */
  bestMove(goals: GoalProgress[]): Move | null {
    const moves = this.legalMoves();
    let best: Move | null = null;
    let bestScore = -Infinity;
    for (const m of moves) {
      const b = this.clone();
      const out = b.resolveAll(b.beginSwap(m.a, m.b));
      const s = scoreTurn(b, goals, out.steps, out.animals);
      if (s > bestScore) { bestScore = s; best = m; }
    }
    return best;
  }
}

// ---------------------------------------------------------------------------
// Goals

export interface GoalProgress { def: GoalDef; key: string; need: number; got: number; }

export function goalKey(g: GoalDef): string { return g.type === 'collect' ? `collect:${g.tile}` : g.type; }

export function makeGoals(cfg: MatchLevelConfig): GoalProgress[] {
  return cfg.goals.map((def) => ({ def, key: goalKey(def), need: goalNeed(cfg, def), got: 0 }));
}

/** Which goal (if any) a cleared tile, a broken blocker or a plowed cell counts toward. */
export function goalFor(goals: GoalProgress[], what: { tile?: Tile; blocker?: 'mud' | 'crate'; soil?: boolean; animal?: boolean }): GoalProgress | null {
  for (const g of goals) {
    if (g.got >= g.need) continue;
    const d = g.def;
    if (what.tile && d.type === 'collect' && matchable(what.tile) && (d.tile === 'any' || d.tile === what.tile.kind)) return g;
    if (what.blocker && d.type === what.blocker) return g;
    if (what.soil && d.type === 'soil') return g;
    if (what.animal && d.type === 'animal') return g;
  }
  return null;
}

/** Count one clear step into the goals. */
export function applyStep(goals: GoalProgress[], res: StepResult): void {
  for (const { tile } of res.cleared) { const g = goalFor(goals, { tile }); if (g) g.got++; }
  for (const b of res.blockers) if (b.hp <= 0) { const g = goalFor(goals, { blocker: b.type }); if (g) g.got++; }
  for (let i = 0; i < res.plowed.length; i++) { const g = goalFor(goals, { soil: true }); if (g) g.got++; }
}
export function applyAnimals(goals: GoalProgress[], n: number): void {
  for (let i = 0; i < n; i++) { const g = goalFor(goals, { animal: true }); if (g) g.got++; }
}
export const goalsDone = (goals: GoalProgress[]): boolean => goals.every((g) => g.got >= g.need);
export const goalsProgress = (goals: GoalProgress[]): number =>
  goals.length ? goals.reduce((n, g) => n + Math.min(1, g.got / Math.max(1, g.need)), 0) / goals.length : 0;

/** How much a resolved turn helps (for the hint and the tuning bot). */
export function scoreTurn(after: Board, goals: GoalProgress[], steps: StepResult[], animalsOut: number): number {
  const open = (type: string, tile?: string): boolean =>
    goals.some((g) => g.got < g.need && g.def.type === type && (tile === undefined || g.def.type !== 'collect' || g.def.tile === 'any' || g.def.tile === tile));
  let s = 0;
  for (const res of steps) {
    for (const { tile } of res.cleared) {
      if (matchable(tile) && open('collect', tile.kind)) s += 1;
      s += 0.08;
    }
    for (const b of res.blockers) s += open(b.type) ? (b.hp <= 0 ? 4 : 2.5) : 0.6;
    if (open('soil')) s += res.plowed.length * 3;
    for (const c of res.created) s += c.tile.special === 'rainbow' ? 4 : 2;
  }
  if (open('animal')) {
    s += animalsOut * 25;
    for (let r = 0; r < after.rows; r++) for (let c = 0; c < after.cols; c++) if (after.grid[r][c]?.animal) s -= after.exitDist[r][c] * 0.8;
  }
  return s;
}
