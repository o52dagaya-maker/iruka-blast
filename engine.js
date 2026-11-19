/* イルカのブラスト - game engine (pure logic, no DOM). Works in browser and Node. */
(function (root) {
'use strict';
const COLORS = ['r', 'y', 'b', 'g', 'p', 'o']; // プラグ, ヘルメット, 電波, スパナ, ナット, コーン
const SPECIAL = { rocket: 1, bomb: 1, disco: 1 };
const MOVABLE = { b: 1, rocket: 1, bomb: 1, disco: 1, drum: 1, router: 1, lamp: 1 };
const mv = p => !!(p && MOVABLE[p.t] && !p.lock);

function mulberry(seed) { return { s: seed >>> 0 }; }
function rnd(st) { let t = (st.s = (st.s + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

class Game {
  constructor(level, seed) {
    if (!level) return; // for clone
    this.L = level; this.W = level.layout[0].length; this.H = level.layout.length;
    this.rs = mulberry(seed == null ? (Date.now() & 0xffffffff) : seed);
    this.nc = level.colors; this.moves = level.moves; this.used = 0; this.nextId = 1;
    this.hole = []; this.grid = [];
    let boxes = 0, drums = 0, routers = 0, lamps = 0, ties = 0, muds = 0; this.mud = [];
    for (let r = 0; r < this.H; r++) {
      this.hole.push([]); this.grid.push([]); this.mud.push([]);
      for (let c = 0; c < this.W; c++) {
        const ch = level.layout[r][c] || ' ';
        const h = ch === ' ' || ch === '#';
        this.hole[r].push(h);
        let p = null;
        if (!h) {
          if (ch === 'x') { p = this.mk('box', { hp: 1, mx: 1 }); boxes++; }
          else if (ch === 'X') { p = this.mk('box', { hp: 2, mx: 2 }); boxes++; }
          else if (ch === 'K') { p = this.mk('box', { hp: 3, mx: 3 }); boxes++; }
          else if (ch === 'd') { p = this.mk('drum'); drums++; }
          else if (ch === 'L') { p = this.mk('lamp', { c: this.rc() }); lamps++; }
          else if (ch === 'T') { p = this.mk('b', { c: this.rc(), lock: 1 }); ties++; }
          else if (ch === 'R') { p = this.mk('router'); routers++; }
          else if (ch === '-') p = this.mk('rocket', { dir: 'h' });
          else if (ch === '|') p = this.mk('rocket', { dir: 'v' });
          else if (ch === '*') p = this.mk('bomb');
          else if ('0123456'.includes(ch)) p = this.mk('b', { c: +ch });
          else p = this.mk('b', { c: this.rc() });
        }
        this.grid[r].push(p);
        const m = !h && (ch === 'm' || (level.mud && level.mud[r] && level.mud[r][c] === 'm')) ? 1 : 0; this.mud[r].push(m); muds += m;
      }
    }
    this.goals = {};
    for (const k in level.goals) {
      let v = level.goals[k];
      if (v === 'all') v = ({ box: boxes, drum: drums, lamp: lamps, tie: ties, mud: muds })[k] || 0;
      this.goals[k] = v;
    }
    this.goalStart = Object.assign({}, this.goals);
    this.routerPending = (this.goals.router || 0) - routers;
    this.bottom = [];
    for (let c = 0; c < this.W; c++) { let b = -1; for (let r = 0; r < this.H; r++) if (!this.hole[r][c]) b = r; this.bottom.push(b); }
    this.status = 'play';
    // avoid opening with a dead board, and keep openings from being trivially huge
    let tries = 0;
    while ((!this.hasMove() || this.maxGroup() > 9) && tries++ < 200) this.rerollBlocks();
  }
  rc() { return Math.floor(rnd(this.rs) * this.nc); }
  rand() { return rnd(this.rs); }
  mk(t, o) { return Object.assign({ id: this.nextId++, t }, o || {}); }
  clone() {
    const g = new Game(); Object.assign(g, this);
    g.rs = { s: this.rs.s }; g.goals = Object.assign({}, this.goals);
    g.grid = this.grid.map(row => row.map(p => p && Object.assign({}, p))); g.mud = this.mud.map(row => row.slice());
    return g;
  }
  inb(r, c) { return r >= 0 && c >= 0 && r < this.H && c < this.W && !this.hole[r][c]; }
  at(r, c) { return this.inb(r, c) ? this.grid[r][c] : null; }
  rerollBlocks() { for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) { const p = this.grid[r][c]; if (p && (p.t === 'b' || p.t === 'lamp') && !this.L.layout[r][c].match(/[0-6]/)) p.c = this.rc(); } }
  group(r, c) {
    const p = this.at(r, c); if (!p || p.t !== 'b') return [];
    const out = [], seen = new Set([r * 64 + c]), st = [[r, c]];
    while (st.length) {
      const [y, x] = st.pop(); out.push([y, x]);
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ny = y + dy, nx = x + dx, k = ny * 64 + nx; if (seen.has(k)) continue;
        const q = this.at(ny, nx); if (q && q.t === 'b' && q.c === p.c) { seen.add(k); st.push([ny, nx]); }
      }
    }
    return out;
  }
  specialCluster(r, c) {
    const out = [], seen = new Set([r * 64 + c]), st = [[r, c]];
    while (st.length) {
      const [y, x] = st.pop(); out.push([y, x]);
      for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ny = y + dy, nx = x + dx, k = ny * 64 + nx; if (seen.has(k)) continue;
        const q = this.at(ny, nx); if (q && SPECIAL[q.t]) { seen.add(k); st.push([ny, nx]); }
      }
    }
    return out;
  }
  // all tappable options: [{r,c,kind,size}]
  options() {
    const seen = new Set(), out = [];
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) {
      const p = this.grid[r][c]; if (!p || this.hole[r][c] || seen.has(r * 64 + c)) continue;
      if (p.t === 'b') { const g = this.group(r, c); g.forEach(([y, x]) => seen.add(y * 64 + x)); if (g.length >= 2) out.push({ r, c, kind: 'group', size: g.length, cells: g }); }
      else if (SPECIAL[p.t]) out.push({ r, c, kind: p.t, size: this.specialCluster(r, c).length });
    }
    return out;
  }
  maxGroup() { let m = 0; for (const o of this.options()) if (o.kind === 'group') m = Math.max(m, o.size); return m; }
  hasMove() {
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) {
      const p = this.at(r, c); if (!p) continue;
      if (SPECIAL[p.t]) return true;
      if (p.t === 'b') { const a = this.at(r + 1, c), b = this.at(r, c + 1); if ((a && a.t === 'b' && a.c === p.c) || (b && b.t === 'b' && b.c === p.c)) return true; }
    }
    return false;
  }
  goalKey(p) { return p.t === 'b' ? COLORS[p.c] : p.t; }
  credit(key) { if (this.goals[key] > 0) this.goals[key]--; }
  // ---- core: hit a cell during a wave
  hit(r, c, ph, ctx) {
    if (!this.inb(r, c)) return; const k = r * 64 + c; if (ctx.hitSet.has(k)) return; ctx.hitSet.add(k);
    const p = this.grid[r][c]; if (!p) { this.clearMud(r, c, ph); return; }
    if (p.t === 'b' && p.lock) { p.lock = 0; (ph.unlocked || (ph.unlocked = [])).push({ id: p.id, r, c }); this.credit('tie'); return; }
    this.hitPiece(r, c, p, ph, ctx);
    if (!this.grid[r][c]) this.clearMud(r, c, ph);
  }
  clearMud(r, c, ph) { if (this.mud[r][c]) { this.mud[r][c] = 0; (ph.mud || (ph.mud = [])).push([r, c]); this.credit('mud'); } }
  hitPiece(r, c, p, ph, ctx) {
    if (p.t === 'b') { this.grid[r][c] = null; ph.removed.push({ id: p.id, r, c, p }); this.credit(COLORS[p.c]); }
    else if (p.t === 'lamp') { this.grid[r][c] = null; ph.removed.push({ id: p.id, r, c, p }); this.credit('lamp'); }
    else if (SPECIAL[p.t]) { if (!p.trig) { p.trig = 1; ctx.next.push({ r, c, p }); } }
    else if (p.t === 'box') { p.hp--; if (p.hp <= 0) { this.grid[r][c] = null; ph.removed.push({ id: p.id, r, c, p }); this.credit('box'); } else ph.damaged.push({ id: p.id, r, c, hp: p.hp }); }
    else if (p.t === 'drum') { this.grid[r][c] = null; ph.removed.push({ id: p.id, r, c, p }); this.credit('drum'); }
    else if (p.t === 'router') { // pushed one cell down (swaps with the piece below)
      const b = this.at(r + 1, c);
      if (mv(b) && b.t !== 'router' && !(SPECIAL[b.t] && b.trig)) {
        this.grid[r + 1][c] = p; this.grid[r][c] = b; ctx.hitSet.add((r + 1) * 64 + c);
        (ph.swaps || (ph.swaps = [])).push({ a: p.id, b: b.id, ar: r + 1, ac: c, br: r, bc: c });
      }
    }
  }
  bombCells(r, c, rad) { const out = []; for (let y = r - rad; y <= r + rad; y++) for (let x = c - rad; x <= c + rad; x++) if (Math.abs(y - r) + Math.abs(x - c) <= rad + 1) out.push([y, x]); return out; }
  // effect of activating a single special (returns cells to hit + fx descriptor)
  effect(r, c, p) {
    const cells = [];
    if (p.t === 'rocket') {
      if (p.dir === 'h') for (let x = 0; x < this.W; x++) cells.push([r, x]); else for (let y = 0; y < this.H; y++) cells.push([y, c]);
      return { cells, fx: { type: 'rocket', r, c, dir: p.dir } };
    }
    if (p.t === 'bomb') { const rad = p.rad || 2; return { cells: this.bombCells(r, c, rad), fx: { type: 'bomb', r, c, rad } }; }
    if (p.t === 'disco') {
      const col = p.c != null ? p.c : this.mostColor();
      for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) { const q = this.at(y, x); if (q && q.t === 'b' && q.c === col) cells.push([y, x]); }
      return { cells, fx: { type: 'disco', r, c, col, targets: cells.slice() } };
    }
    if (p.t === 'cross') { // rocket+rocket or rocket+bomb (w = half width)
      const w = p.w || 0;
      for (let d = -w; d <= w; d++) { for (let x = 0; x < this.W; x++) cells.push([r + d, x]); for (let y = 0; y < this.H; y++) cells.push([y, c + d]); }
      return { cells, fx: { type: 'cross', r, c, w } };
    }
    if (p.t === 'all') { for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) cells.push([y, x]); return { cells, fx: { type: 'all', r, c } }; }
    return { cells, fx: null };
  }
  mostColor() { const n = new Array(6).fill(0); for (const row of this.grid) for (const q of row) if (q && q.t === 'b') n[q.c]++; let b = 0; for (let i = 1; i < 6; i++) if (n[i] > n[b]) b = i; return b; }
  // run activation waves starting from list [{r,c,p}] ; pushes phases
  runWaves(first, phases, preRemoved) {
    let wave = first, n = 0;
    while (wave.length && n++ < 60) {
      const ph = { kind: 'wave', fx: [], removed: preRemoved || [], damaged: [], created: [] }; preRemoved = null;
      const ctx = { hitSet: new Set(), next: [] };
      for (const a of wave) {
        // remove the special itself
        const cur = this.grid[a.r][a.c];
        if (cur && cur.id === a.p.id) { this.grid[a.r][a.c] = null; ph.removed.push({ id: a.p.id, r: a.r, c: a.c, p: a.p, self: 1 }); }
        ctx.hitSet.add(a.r * 64 + a.c);
        if (a.p.t === 'disco' && a.p.into) {
          // disco + rocket/bomb: turn color blocks into specials, then fire them next wave
          const col = a.p.c != null ? a.p.c : this.mostColor();
          const tg = [];
          for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) { const q = this.at(y, x); if (q && q.t === 'b' && q.c === col && !q.lock) {
            const np = this.mk(a.p.into === 'rocket' ? 'rocket' : 'bomb', a.p.into === 'rocket' ? { dir: this.rand() < 0.5 ? 'h' : 'v' } : {}); np.trig = 1;
            this.grid[y][x] = np; ph.removed.push({ id: q.id, r: y, c: x, p: q, morph: 1 }); this.credit(COLORS[col]); ph.created.push({ id: np.id, r: y, c: x, p: Object.assign({}, np) }); ctx.next.push({ r: y, c: x, p: np }); tg.push([y, x]);
          } }
          ph.fx.push({ type: 'disco', r: a.r, c: a.c, col, targets: tg });
          continue;
        }
        const e = this.effect(a.r, a.c, a.p);
        if (e.fx) ph.fx.push(e.fx);
        for (const [y, x] of e.cells) this.hit(y, x, ph, ctx);
      }
      phases.push(ph);
      wave = ctx.next;
    }
  }
  // ---- player action
  tap(r, c) {
    if (this.status !== 'play') return null;
    const p = this.at(r, c); if (!p) return null;
    const phases = [];
    if (p.t === 'b') {
      const g = this.group(r, c); if (g.length < 2) return null;
      const ph = { kind: 'blast', origin: [r, c], removed: [], damaged: [], created: [], fx: [] };
      const ctx = { hitSet: new Set(), next: [] };
      for (const [y, x] of g) { const q = this.grid[y][x]; ctx.hitSet.add(y * 64 + x);
        if (q.lock) { q.lock = 0; (ph.unlocked || (ph.unlocked = [])).push({ id: q.id, r: y, c: x }); this.credit('tie'); continue; }
        this.grid[y][x] = null; ph.removed.push({ id: q.id, r: y, c: x, p: q }); this.credit(COLORS[q.c]); this.clearMud(y, x, ph); }
      const adj = new Set();
      for (const [y, x] of g) for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = this.at(y + dy, x + dx); if (q && (q.t === 'box' || q.t === 'drum' || q.t === 'router' || (q.t === 'lamp' && q.c === p.c))) adj.add((y + dy) * 64 + x + dx); }
      for (const k of adj) this.hit(k >> 6, k & 63, ph, ctx);
      let sp = null; const n = g.length;
      if (n >= 9) sp = this.mk('disco', { c: p.c }); else if (n >= 7) sp = this.mk('bomb'); else if (n >= 5) sp = this.mk('rocket', { dir: this.rand() < 0.5 ? 'h' : 'v' });
      if (sp && this.grid[r][c]) { const fr = ph.removed.find(rm => rm.p.t === 'b' && !this.grid[rm.r][rm.c]); if (fr) { r = fr.r; c = fr.c; ph.origin = [r, c]; } else sp = null; }
      if (sp) { this.grid[r][c] = sp; ph.created.push({ id: sp.id, r, c, p: Object.assign({}, sp) }); ph.merge = 1; }
      phases.push(ph);
    } else if (SPECIAL[p.t]) {
      const cl = this.specialCluster(r, c);
      if (cl.length === 1) { p.trig = 1; this.runWaves([{ r, c, p }], phases); }
      else {
        const ps = cl.map(([y, x]) => this.grid[y][x]);
        const nD = ps.filter(q => q.t === 'disco').length, nB = ps.filter(q => q.t === 'bomb').length, nR = ps.filter(q => q.t === 'rocket').length;
        const removed = [];
        for (const [y, x] of cl) { const q = this.grid[y][x]; this.grid[y][x] = null; removed.push({ id: q.id, r: y, c: x, p: q, merge: 1 }); }
        let combo;
        if (nD >= 2) combo = this.mk('all');
        else if (nD === 1) { const d = ps.find(q => q.t === 'disco'); combo = this.mk('disco', { c: d.c, into: nB ? 'bomb' : 'rocket' }); }
        else if (nB >= 2) combo = this.mk('bomb', { rad: nB >= 3 ? 4 : 3 });
        else if (nB === 1) combo = this.mk('cross', { w: 1 });
        else combo = this.mk('cross', { w: nR >= 3 ? 1 : 0 });
        combo.trig = 1; this.grid[r][c] = combo;
        phases.push({ kind: 'combo', origin: [r, c], removed, damaged: [], created: [{ id: combo.id, r, c, p: Object.assign({}, combo) }], fx: [{ type: 'combo', r, c, combo: combo.t }] });
        this.runWaves([{ r, c, p: combo }], phases);
      }
    } else return null;
    this.used++; this.moves--;
    this.settle(phases);
    return phases;
  }
  // fire one rocket at a random block (end-of-level bonus); returns phases
  // leftover moves become drills; n at once (all fire in the same wave)
  bonusRocket(n = 1) {
    const cand = [];
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) { const p = this.at(r, c); if (p && p.t === 'b' && !p.lock) cand.push([r, c]); }
    if (!cand.length || this.moves <= 0) return null;
    n = Math.min(n, this.moves, cand.length);
    const morph = { kind: 'morph', removed: [], damaged: [], created: [], fx: [] }, starts = [];
    for (let i = 0; i < n; i++) {
      const [r, c] = cand.splice(Math.floor(this.rand() * cand.length), 1)[0];
      const old = this.grid[r][c]; const sp = this.mk('rocket', { dir: this.rand() < 0.5 ? 'h' : 'v' }); sp.trig = 1; this.grid[r][c] = sp;
      morph.removed.push({ id: old.id, r, c, p: old, morph: 1 }); morph.created.push({ id: sp.id, r, c, p: Object.assign({}, sp) }); starts.push({ r, c, p: sp });
    }
    const phases = [morph]; this.moves -= n; this.runWaves(starts, phases);
    const st = this.status; this.status = 'bonus'; this.settle(phases, true); this.status = st;
    phases.rockets = n; return phases;
  }
  spawnPiece(col) {
    if (this.routerPending > 0 && this.goals.router > 0 && this.clearCol(col)) {
      let onBoard = 0; for (const row of this.grid) for (const q of row) if (q && q.t === 'router') onBoard++;
      if (onBoard < (this.L.routerMax || 2) && this.rand() < (this.L.routerRate || 0.2)) { this.routerPending--; return this.mk('router'); }
    }
    if (this.L.drumRate && this.goals.drum > 0) {
      let onBoard = 0; for (const row of this.grid) for (const q of row) if (q && q.t === 'drum') onBoard++;
      if (onBoard < this.goals.drum && this.rand() < this.L.drumRate) return this.mk('drum');
    }
    return this.mk('b', { c: this.rc() });
  }
  clearCol(c) { if (this._cc == null) { this._cc = []; for (let x = 0; x < this.W; x++) { let ok = true; for (let y = 0; y < this.H; y++) if (this.hole[y][x]) ok = false; this._cc.push(ok); } } return this._cc[c]; }

  // gravity with spawning and diagonal slides; returns fall phase or null
  gravity() {
    const paths = new Map(); let tick = 0, moved = true;
    const note = (p, from, to, spawn) => {
      let e = paths.get(p.id); if (!e) { e = { id: p.id, p, path: [from], start: tick, spawn }; paths.set(p.id, e); }
      // keep timing: pad path with waits so index = tick-start
      while (e.path.length < tick - e.start + 1) e.path.push(e.path[e.path.length - 1]);
      e.path.push(to);
    };
    const topRow = []; for (let c = 0; c < this.W; c++) { let t = -1; for (let r = 0; r < this.H; r++) if (!this.hole[r][c]) { t = r; break; } topRow.push(t); }
    while (moved && tick < 200) {
      moved = false; const done = new Set();
      for (let r = this.H - 1; r >= 0; r--) for (let c = 0; c < this.W; c++) {
        if (this.hole[r][c] || this.grid[r][c] || done.has(r * 64 + c)) continue;
        const ab = r > 0 ? this.grid[r - 1][c] : null;
        if (r - 1 >= 0 && !this.hole[r - 1][c] && mv(ab) && !done.has((r - 1) * 64 + c)) {
          this.grid[r][c] = ab; this.grid[r - 1][c] = null; note(ab, [r - 1, c], [r, c]); done.add(r * 64 + c); moved = true; continue;
        }
        if (r === topRow[c] && (r === 0 || this.L.spawnBelowHoles)) { const np = this.spawnPiece(c); this.grid[r][c] = np; note(np, [r - 1, c], [r, c], 1); done.add(r * 64 + c); moved = true; continue; }
        // the cell above is open (empty, or a piece that just moved): it will feed us straight down later
        if (r - 1 >= 0 && !this.hole[r - 1][c] && (!ab || mv(ab))) continue;
        for (const dx of (this.rand() < 0.5 ? [-1, 1] : [1, -1])) {
          const y = r - 1, x = c + dx; if (!this.inb(y, x) || done.has(y * 64 + x)) continue;
          const q = this.grid[y][x]; if (!mv(q)) continue;
          // only slide if that piece can't simply fall in its own column
          if (this.inb(y + 1, x) && !this.grid[y + 1][x]) continue;
          this.grid[r][c] = q; this.grid[y][x] = null; note(q, [y, x], [r, c]); done.add(r * 64 + c); moved = true; break;
        }
      }
      tick++;
    }
    if (!paths.size) return null;
    return { kind: 'fall', paths: [...paths.values()].map(e => ({ id: e.id, p: Object.assign({}, e.p), path: e.path, start: e.start, spawn: !!e.spawn })) };
  }
  collectRouters() {
    const removed = [];
    for (let c = 0; c < this.W; c++) for (let r = 0; r < this.H; r++) { const p = this.grid[r][c]; if (p && p.t === 'router' && (r === this.H - 1 || this.hole[r + 1][c])) { this.grid[r][c] = null; removed.push({ id: p.id, r, c, p }); this.credit('router'); } }
    return removed.length ? { kind: 'collect', removed, damaged: [], created: [], fx: [] } : null;
  }
  goalsDone() { for (const k in this.goals) if (this.goals[k] > 0) return false; return true; }
  settle(phases, bonus) {
    for (let i = 0; i < 20; i++) { const f = this.gravity(); if (f) phases.push(f); const col = this.collectRouters(); if (col) phases.push(col); else break; }
    for (const ph of phases) if (!ph.goals) ph.goals = null;
    phases.goals = Object.assign({}, this.goals);
    if (bonus) return;
    if (this.goalsDone()) { this.status = 'win'; return; }
    if (this.moves <= 0) { this.status = 'lose'; return; }
    if (!this.hasMove()) { const s = this.shuffle(); if (s) phases.push(s); }
  }
  shuffle() {
    const pos = [], ps = [];
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) { const p = this.at(r, c); if (p && p.t === 'b' && !p.lock) { pos.push([r, c]); ps.push(p); } }
    if (pos.length < 2) return null;
    for (let t = 0; t < 60; t++) {
      for (let i = ps.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [ps[i], ps[j]] = [ps[j], ps[i]]; }
      pos.forEach(([r, c], i) => { this.grid[r][c] = ps[i]; });
      if (this.hasMove()) break;
    }
    const recolor = [];
    if (!this.hasMove()) { // force a pair
      for (const [r, c] of pos) { for (const [dy, dx] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) { const q = this.at(r + dy, c + dx); if (q && q.t === 'b' && !q.lock) { q.c = this.grid[r][c].c; recolor.push({ id: q.id, c: q.c }); break; } } if (recolor.length) break; }
    }
    const moves = []; pos.forEach(([r, c]) => { const p = this.grid[r][c]; moves.push({ id: p.id, r, c, p: Object.assign({}, p) }); });
    return { kind: 'shuffle', moves, recolor };
  }
  // ---- swipe: swap two neighbours, then blast/activate at the destination. Returns null if the swap does nothing.
  canSwap(p) { return !!p && ((p.t === 'b' && !p.lock) || SPECIAL[p.t]); }
  swap(r1, c1, r2, c2) {
    if (this.status !== 'play' || Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return null;
    const a = this.at(r1, c1), b = this.at(r2, c2); if (!this.canSwap(a) || !this.canSwap(b)) return null;
    this.grid[r1][c1] = b; this.grid[r2][c2] = a;
    let tr = null;
    if (SPECIAL[a.t]) tr = [r2, c2];
    else if (SPECIAL[b.t]) tr = [r1, c1];
    else { const ga = this.group(r2, c2), gb = a.c === b.c ? [] : this.group(r1, c1); if (ga.length >= 2 && ga.length >= gb.length) tr = [r2, c2]; else if (gb.length >= 2) tr = [r1, c1]; }
    if (!tr) { this.grid[r1][c1] = a; this.grid[r2][c2] = b; return null; }
    const sw = { kind: 'swap', a: { id: a.id, r: r2, c: c2 }, b: { id: b.id, r: r1, c: c1 }, removed: [], damaged: [], created: [], fx: [] };
    const ph = this.tap(tr[0], tr[1]);
    if (!ph) { this.grid[r1][c1] = a; this.grid[r2][c2] = b; return null; }
    const out = [sw].concat(ph); out.goals = ph.goals; return out;
  }
  // ---- boosters (free, earned in game; do not use a move)
  boosterWave(cells, fx) {
    const phases = [], ph = { kind: 'wave', fx: [fx], removed: [], damaged: [], created: [] }, ctx = { hitSet: new Set(), next: [] };
    for (const [y, x] of cells) this.hit(y, x, ph, ctx);
    phases.push(ph); if (ctx.next.length) this.runWaves(ctx.next, phases);
    this.settle(phases); return phases;
  }
  hammer(r, c) { if (this.status !== 'play' || !this.inb(r, c)) return null; const p = this.grid[r][c]; if ((!p || p.t === 'router') && !this.mud[r][c]) return null; return this.boosterWave([[r, c]], { type: 'hammer', r, c }); }
  shovel(r) { if (this.status !== 'play' || r < 0 || r >= this.H) return null; const cells = []; for (let x = 0; x < this.W; x++) cells.push([r, x]); return this.boosterWave(cells, { type: 'shovel', r, c: 0 }); }
  mix() { if (this.status !== 'play') return null; const s = this.shuffle(); return s ? [s] : null; }
  // pre-level boosters: put specials on random plain blocks
  placeStart(kinds) {
    const out = [];
    for (const k of kinds) {
      const cand = []; for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) { const p = this.at(r, c); if (p && p.t === 'b' && !p.lock) cand.push([r, c]); }
      if (!cand.length) break; const [r, c] = cand[Math.floor(this.rand() * cand.length)];
      const np = this.mk(k, k === 'rocket' ? { dir: this.rand() < 0.5 ? 'h' : 'v' } : k === 'disco' ? { c: this.rc() } : {});
      this.grid[r][c] = np; out.push({ r, c, p: np });
    }
    return out;
  }
  stars() { const f = this.moves / this.L.moves; return f >= (this.L.s3 || 0.25) ? 3 : f >= (this.L.s2 || 0.1) ? 2 : 1; }
  // greedy bot used by tests/sim
  botMove() {
    const opts = this.options(); if (!opts.length) return null;
    let best = null, bs = -1e9;
    const gsum = g => { let s = 0; for (const k in g) s += Math.max(0, g[k]); return s; };
    const before = gsum(this.goals);
    const tg = []; // obstacles still needed: routers / boxes / drums
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) { const q = this.grid[y][x]; if (q && ((q.t === 'router' && this.goals.router > 0) || (q.t === 'box' && this.goals.box > 0) || (q.t === 'drum' && this.goals.drum > 0))) tg.push([y, x]); }
    const cand = [];
    for (const o of opts) {
      cand.push(o);
      if (o.kind === 'group' && o.size >= 5 && this.goals.router > 0) { let lo = o.cells[0]; for (const cc of o.cells) if (cc[0] > lo[0]) lo = cc; cand.push(Object.assign({}, o, { r: lo[0], c: lo[1], low: 1 })); }
    }
    for (const o of cand) {
      const g2 = this.clone(); const ph = g2.tap(o.r, o.c); if (!ph) continue;
      let s = (before - gsum(g2.goals)) * 10;
      if (tg.length) for (const ph2 of ph) for (const rm of (ph2.removed || [])) { let d = 9; for (const [ty, tx] of tg) d = Math.min(d, Math.abs(ty - rm.r) + Math.abs(tx - rm.c)); if (d <= 2) s += d === 1 ? 2.5 : 1.2; }
      if (g2.status === 'win') s += 10000;
      const k = COLORS;
      if (o.kind === 'group') { if (o.size >= 9) s += 60; else if (o.size >= 7) s += 40; else if (o.size >= 5) s += 25; s += o.size * 0.5; }
      else s -= 5; // keep specials for combos/later unless they score
      // prefer leaving bigger groups
      s += g2.maxGroup() * 0.8;
      if (this.goals.router > 0) {
        const rc = new Set(); for (let y = 0; y < g2.H; y++) g2.grid[y].forEach((q, x) => { if (q && q.t === 'router') { s += y * 3; rc.add(x); } });
        // specials sitting low or in a router's column help free routers later
        for (let y = 0; y < g2.H; y++) g2.grid[y].forEach((q, x) => { if (q && (q.t === 'rocket' || q.t === 'bomb')) s += (q.t === 'bomb' ? 3 : (q.dir === 'v' ? (rc.has(x) ? 6 : 0) : y >= g2.H - 2 ? 6 : 0)); });
      }
      s += this.rand() * 2;
      if (s > bs) { bs = s; best = o; }
    }
    return best;
  }
}
const api = { Game, COLORS, SPECIAL };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BlastEngine = api;
})(this);
