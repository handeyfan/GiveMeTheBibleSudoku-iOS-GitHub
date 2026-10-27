/* Give Me the Bible Sudoku engine: layouts, solver, logical grader (also used for hints) and puzzle generator.
   Runs in the browser (window.SDEngine) and in Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SDEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------- small helpers ----------
  function RNG(seed) {
    let a = seed >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  const pc = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  const bit = (d) => 1 << (d - 1);
  const dig = (m) => 32 - Math.clz32(m);            // single-bit mask -> digit
  const digits = (m) => { const o = []; for (let d = 1; m; d++, m >>= 1) if (m & 1) o.push(d); return o; };
  function combos(arr, k) { const out = []; const rec = (s, cur) => { if (cur.length === k) { out.push(cur.slice()); return; } for (let i = s; i < arr.length; i++) { cur.push(arr[i]); rec(i + 1, cur); cur.pop(); } }; rec(0, []); return out; }

  // Box shape (rows x columns) for each grid size
  const BOX = { 4: [2, 2], 6: [2, 3], 8: [2, 4], 9: [3, 3] };
  const TYPES = {
    classic: { name: 'Classic', n: 9 },
    mini: { name: 'Little Sudoku', n: 6 },
    diagonal: { name: 'Diagonal', n: 9 },
    windows: { name: 'Windows', n: 9 },
    jigsaw: { name: 'Jigsaw', n: 9 },
    killer: { name: 'Killer', n: 9 },
    word: { name: 'Word Sudoku', n: 0 }
  };
  const WINDOWS = [[1, 1], [1, 5], [5, 1], [5, 5]];

  // Every combination of k different digits (1..n) adding up to sum, as bit masks.
  const comboCache = {};
  function sumCombos(n, k, sum) {
    const key = n + ',' + k + ',' + sum; if (comboCache[key]) return comboCache[key];
    const out = [];
    const rec = (d, left, s, m) => { if (!left) { if (s === sum) out.push(m); return; } for (let x = d; x <= n; x++) { if (s + x > sum) break; rec(x + 1, left - 1, s + x, m | bit(x)); } };
    rec(1, k, 0, 0);
    return (comboCache[key] = out);
  }

  // ---------- layout: the units (rows, columns, boxes, shapes, diagonals, windows, cages) ----------
  // regions: string of n*n letters naming each cell's shape (jigsaw) or null for boxes.
  // cages: [[sum, cell, cell, ...], ...] for killer.
  function Layout(type, n, regions, cages) {
    this.type = type; this.n = n; this.N2 = n * n; this.all = (1 << n) - 1;
    const units = []; const N2 = n * n;
    const add = (kind, i, cells, extra) => units.push(Object.assign({ kind, i, cells, full: cells.length === n }, extra || {}));
    for (let r = 0; r < n; r++) add('row', r, Array.from({ length: n }, (_, c) => r * n + c));
    for (let c = 0; c < n; c++) add('col', c, Array.from({ length: n }, (_, r) => r * n + c));
    this.regionOf = new Int8Array(N2);
    if (regions) {
      const ids = {}; let k = 0;
      for (let i = 0; i < N2; i++) { const ch = regions[i]; if (!(ch in ids)) ids[ch] = k++; this.regionOf[i] = ids[ch]; }
      for (let g = 0; g < k; g++) add('shape', g, [...Array(N2).keys()].filter((i) => this.regionOf[i] === g));
    } else {
      const [br, bc] = BOX[n]; let g = 0;
      for (let R = 0; R < n; R += br) for (let C = 0; C < n; C += bc) {
        const cells = []; for (let r = R; r < R + br; r++) for (let c = C; c < C + bc; c++) { cells.push(r * n + c); this.regionOf[r * n + c] = g; }
        add('box', g++, cells);
      }
    }
    this.extra = new Uint8Array(N2); // 1 = shaded (diagonal or window)
    if (type === 'diagonal') {
      add('diag', 0, Array.from({ length: n }, (_, r) => r * n + r));
      add('diag', 1, Array.from({ length: n }, (_, r) => r * n + (n - 1 - r)));
      units.slice(-2).forEach((u) => u.cells.forEach((i) => (this.extra[i] = 1)));
    }
    if (type === 'windows') {
      WINDOWS.forEach((w, k) => { const cells = []; for (let r = w[0]; r < w[0] + 3; r++) for (let c = w[1]; c < w[1] + 3; c++) { cells.push(r * n + c); this.extra[r * n + c] = 1; } add('window', k, cells); });
    }
    this.cages = [];
    this.cageOf = new Int16Array(N2).fill(-1);
    if (cages) {
      cages.forEach((cg, k) => {
        const cells = cg.slice(1).sort((a, b) => a - b); const sum = cg[0];
        const u = { kind: 'cage', i: k, cells, full: cells.length === n, sum, combos: sumCombos(n, cells.length, sum) };
        units.push(u); this.cages.push(u); cells.forEach((i) => (this.cageOf[i] = k));
      });
      // "Innies" (the 45 rule): in a full row, column or box, the cells not covered by cages lying wholly inside it
      // must add up to the rest of the total. They are all different, so they act like an extra cage.
      const total = n * (n + 1) / 2; this.innies = [];
      units.filter((u) => u.full && (u.kind === 'row' || u.kind === 'col' || u.kind === 'box')).forEach((u) => {
        const inside = new Set(u.cells); let s = 0; const covered = new Set();
        this.cages.forEach((cg) => { if (cg.cells.every((i) => inside.has(i))) { s += cg.sum; cg.cells.forEach((i) => covered.add(i)); } });
        const rest = u.cells.filter((i) => !covered.has(i));
        if (rest.length >= 1 && rest.length <= 4) this.innies.push({ kind: 'innie', of: u, cells: rest, sum: total - s, combos: sumCombos(n, rest.length, total - s) });
      });
    } else this.innies = [];
    this.units = units;
    this.unitsOf = Array.from({ length: N2 }, () => []);
    units.forEach((u, k) => u.cells.forEach((i) => this.unitsOf[i].push(k)));
    this.peers = Array.from({ length: N2 }, (_, i) => { const s = new Set(); this.unitsOf[i].forEach((k) => units[k].cells.forEach((j) => { if (j !== i) s.add(j); })); return Int16Array.from(s); });
    this.fullUnits = units.filter((u) => u.full);
  }

  // Cage reasoning: given current values and candidates, which digits can each empty cell of the cage still hold?
  // Returns { free: [cells], masks: [mask per free cell], required: digits every possible fill uses } or null if impossible.
  function cageOptions(cg, vals, cand, distinct) {
    let placed = 0, placedSum = 0; const free = [];
    for (const c of cg.cells) { if (vals[c]) { if (distinct && (placed & bit(vals[c]))) return null; placed |= bit(vals[c]); placedSum += vals[c]; } else free.push(c); }
    const masks = new Array(free.length).fill(0); let required = -1, any = false;
    if (!free.length) return placedSum === cg.sum ? { free, masks, required: 0 } : null;
    for (const combo of cg.combos) {
      if ((combo & placed) !== placed) continue;
      const rem = combo & ~placed; if (pc(rem) !== free.length) continue;
      let ok = false; const got = new Array(free.length).fill(0); const pick = new Array(free.length);
      const rec = (k, used) => {
        if (k === free.length) { ok = true; for (let j = 0; j < k; j++) got[j] |= pick[j]; return; }
        let m = cand[free[k]] & rem & ~used;
        while (m) { const b = m & -m; m ^= b; pick[k] = b; rec(k + 1, used | b); }
      };
      rec(0, 0);
      if (ok) { any = true; for (let j = 0; j < free.length; j++) masks[j] |= got[j]; required &= rem; }
    }
    if (!any) return null;
    return { free, masks, required: required < 0 ? 0 : required };
  }

  // ---------- backtracking solver (counts solutions) ----------
  function solve(L, vals0, limit, rng, nodeLimit) {
    limit = limit || 2; nodeLimit = nodeLimit || 200000;
    const N2 = L.N2; let count = 0, sol = null, nodes = 0, aborted = false;
    const assign = (vals, cand, i, d) => {
      const b = bit(d); vals[i] = d; cand[i] = b;
      const pe = L.peers[i];
      for (let k = 0; k < pe.length; k++) { const p = pe[k]; if (vals[p] === d) return false; if (!vals[p] && (cand[p] & b)) { cand[p] &= ~b; if (!cand[p]) return false; } }
      return true;
    };
    const vals = Int8Array.from(vals0); const cand = new Int32Array(N2).fill(L.all);
    for (let i = 0; i < N2; i++) if (vals[i]) { const d = vals[i]; vals[i] = 0; if (!(cand[i] & bit(d)) || !assign(vals, cand, i, d)) return { count: 0, sol: null }; }
    const propagate = (vals, cand) => {
      for (let loop = 0; loop < 100; loop++) {
        let changed = false;
        for (let i = 0; i < N2; i++) if (!vals[i]) { const m = cand[i]; if (!m) return false; if (!(m & (m - 1))) { if (!assign(vals, cand, i, dig(m))) return false; changed = true; } }
        for (const u of L.fullUnits) {
          for (let d = 1, b = 1; d <= L.n; d++, b <<= 1) {
            let pos = -1, cnt = 0, have = false;
            for (const c of u.cells) { if (vals[c] === d) { have = true; break; } if (!vals[c] && (cand[c] & b)) { cnt++; pos = c; } }
            if (have) continue; if (!cnt) return false;
            if (cnt === 1) { if (!assign(vals, cand, pos, d)) return false; changed = true; }
          }
        }
        for (const cg of L.cages) {
          const o = cageOptions(cg, vals, cand, true); if (!o) return false;
          for (let j = 0; j < o.free.length; j++) { const c = o.free[j]; const m = cand[c] & o.masks[j]; if (!m) return false; if (m !== cand[c]) { cand[c] = m; changed = true; } }
        }
        if (!changed) return true;
      }
      return true;
    };
    const rec = (vals, cand) => {
      if (++nodes > nodeLimit) { aborted = true; return; }
      if (!propagate(vals, cand)) return;
      let best = -1, bc = 99;
      for (let i = 0; i < N2; i++) if (!vals[i]) { const c = pc(cand[i]); if (c < bc) { bc = c; best = i; if (c === 2) break; } }
      if (best < 0) { count++; if (!sol) sol = Array.from(vals); return; }
      const ds = digits(cand[best]); if (rng) shuffle(ds, rng);
      for (const d of ds) {
        const v2 = vals.slice(), c2 = cand.slice();
        if (assign(v2, c2, best, d)) rec(v2, c2);
        if (count >= limit || aborted) return;
      }
    };
    rec(vals, cand);
    return { count, sol, aborted };
  }

  // ---------- logical solver: finds the simplest next step a person could take ----------
  // Levels: 1 Easy (singles, cage sums) · 2 Medium (locked candidates, pairs, 45 rule) · 3 Hard (triples, X-wing) · 4 Expert (quads, swordfish, XY-wing)
  const TECH = {
    hiddenSingle: { lv: 1, name: 'Only place for this number' },
    nakedSingle: { lv: 1, name: 'Only number for this square' },
    cage: { lv: 1, name: 'Cage sum' },
    locked: { lv: 2, name: 'Locked numbers' },
    nakedPair: { lv: 2, name: 'Pair' },
    hiddenPair: { lv: 2, name: 'Hidden pair' },
    innie: { lv: 2, name: 'The 45 rule' },
    nakedTriple: { lv: 3, name: 'Triple' },
    hiddenTriple: { lv: 3, name: 'Hidden triple' },
    xwing: { lv: 3, name: 'X-wing' },
    nakedQuad: { lv: 4, name: 'Quad' },
    hiddenQuad: { lv: 4, name: 'Hidden quad' },
    swordfish: { lv: 4, name: 'Swordfish' },
    xywing: { lv: 4, name: 'XY-wing' }
  };

  function Logic(L, vals) {
    this.L = L; this.vals = Int8Array.from(vals); this.cand = new Int32Array(L.N2);
    for (let i = 0; i < L.N2; i++) this.cand[i] = this.vals[i] ? bit(this.vals[i]) : L.all;
    for (let i = 0; i < L.N2; i++) if (this.vals[i]) { const b = bit(this.vals[i]); for (const p of L.peers[i]) if (!this.vals[p]) this.cand[p] &= ~b; }
  }
  Logic.prototype.empty = function () { let k = 0; for (let i = 0; i < this.L.N2; i++) if (!this.vals[i]) k++; return k; };
  Logic.prototype.apply = function (s) {
    if (s.place) { const [i, d] = s.place; const b = bit(d); this.vals[i] = d; this.cand[i] = b; for (const p of this.L.peers[i]) if (!this.vals[p]) this.cand[p] &= ~b; }
    if (s.elims) for (const [c, m] of s.elims) this.cand[c] &= ~m;
  };
  Logic.prototype.broken = function () { for (let i = 0; i < this.L.N2; i++) if (!this.vals[i] && !this.cand[i]) return true; return false; };
  // Gather eliminations of mask from cells (only where they have an effect).
  const elimList = (cand, vals, cells, mask) => { const o = []; for (const c of cells) if (!vals[c] && (cand[c] & mask)) o.push([c, cand[c] & mask]); return o; };

  Logic.prototype.next = function (maxLv) {
    maxLv = maxLv || 4;
    const L = this.L, vals = this.vals, cand = this.cand, n = L.n, units = L.units;
    // Hidden single (boxes first, then rows, columns and the rest)
    const order = L.fullUnits.slice().sort((a, b) => (a.kind === 'box' || a.kind === 'shape' ? 0 : 1) - (b.kind === 'box' || b.kind === 'shape' ? 0 : 1));
    for (const u of order) for (let d = 1; d <= n; d++) {
      const b = bit(d); let pos = -1, cnt = 0, have = false;
      for (const c of u.cells) { if (vals[c] === d) { have = true; break; } if (!vals[c] && (cand[c] & b)) { cnt++; pos = c; } }
      if (!have && cnt === 1) return { t: 'hiddenSingle', place: [pos, d], unit: u, cells: [pos] };
    }
    for (let i = 0; i < L.N2; i++) if (!vals[i] && cand[i] && !(cand[i] & (cand[i] - 1))) return { t: 'nakedSingle', place: [i, dig(cand[i])], cells: [i] };
    // Cage sums
    for (const cg of L.cages) {
      const o = cageOptions(cg, vals, cand, true); if (!o) continue;
      const el = []; o.free.forEach((c, j) => { const m = cand[c] & ~o.masks[j]; if (m) el.push([c, m]); });
      if (el.length) return { t: 'cage', unit: cg, elims: el, cells: cg.cells };
    }
    if (maxLv < 2) return null;
    // Locked candidates: a number's places in one unit all lie inside another unit.
    for (const u of L.fullUnits) for (let d = 1; d <= n; d++) {
      const b = bit(d); const P = u.cells.filter((c) => !vals[c] && (cand[c] & b)); if (P.length < 2) continue;
      for (const k of L.unitsOf[P[0]]) {
        const v = units[k]; if (v === u) continue;
        if (!P.every((c) => L.unitsOf[c].includes(k))) continue;
        const inU = new Set(u.cells); const el = elimList(cand, vals, v.cells.filter((c) => !inU.has(c)), b);
        if (el.length) return { t: 'locked', unit: u, unit2: v, digit: d, cells: P, elims: el };
      }
    }
    for (const cg of L.cages) {          // a digit every fill of a cage needs, sitting in one row/column/box
      const o = cageOptions(cg, vals, cand, true); if (!o || !o.required) continue;
      for (const d of digits(o.required)) {
        const b = bit(d); const P = o.free.filter((c) => cand[c] & b); if (!P.length) continue;
        for (const k of L.unitsOf[P[0]]) {
          const v = units[k]; if (v === cg || !P.every((c) => L.unitsOf[c].includes(k))) continue;
          const inC = new Set(cg.cells); const el = elimList(cand, vals, v.cells.filter((c) => !inC.has(c)), b);
          if (el.length) return { t: 'locked', unit: cg, unit2: v, digit: d, cells: P, elims: el };
        }
      }
    }
    let s = this.subsets(2); if (s) return s;
    for (const ir of L.innies) {
      const o = cageOptions(ir, vals, cand, true); if (!o) continue;
      const el = []; o.free.forEach((c, j) => { const m = cand[c] & ~o.masks[j]; if (m) el.push([c, m]); });
      if (el.length) return { t: 'innie', unit: ir.of, innie: ir, elims: el, cells: ir.cells };
    }
    if (maxLv < 3) return null;
    s = this.subsets(3); if (s) return s;
    s = this.fish(2); if (s) return s;
    if (maxLv < 4) return null;
    s = this.subsets(4); if (s) return s;
    s = this.fish(3); if (s) return s;
    s = this.xywing(); if (s) return s;
    return null;
  };
  Logic.prototype.subsets = function (k) {
    const L = this.L, vals = this.vals, cand = this.cand;
    const nk = ['', '', 'nakedPair', 'nakedTriple', 'nakedQuad'][k], hk = ['', '', 'hiddenPair', 'hiddenTriple', 'hiddenQuad'][k];
    for (const u of L.units) {
      const E = u.cells.filter((c) => !vals[c] && pc(cand[c]) >= 2 && pc(cand[c]) <= k);
      if (E.length < k) continue;
      for (const S of combos(E, k)) {
        let m = 0; for (const c of S) m |= cand[c];
        if (pc(m) !== k) continue;
        const inS = new Set(S); const el = elimList(cand, vals, u.cells.filter((c) => !inS.has(c)), m);
        if (el.length) return { t: nk, unit: u, cells: S, mask: m, elims: el };
      }
    }
    for (const u of L.fullUnits) {
      const free = u.cells.filter((c) => !vals[c]); if (free.length <= k) continue;
      let have = 0; for (const c of u.cells) if (vals[c]) have |= bit(vals[c]);
      const ds = digits(L.all & ~have).filter((d) => { const p = free.filter((c) => cand[c] & bit(d)).length; return p >= 2 && p <= k; });
      for (const D of combos(ds, k)) {
        let m = 0; D.forEach((d) => (m |= bit(d)));
        const cells = free.filter((c) => cand[c] & m); if (cells.length !== k) continue;
        const el = []; cells.forEach((c) => { const x = cand[c] & ~m; if (x) el.push([c, x]); });
        if (el.length) return { t: hk, unit: u, cells, mask: m, elims: el };
      }
    }
    return null;
  };
  Logic.prototype.fish = function (k) {
    const L = this.L, n = L.n, vals = this.vals, cand = this.cand;
    for (let d = 1; d <= n; d++) {
      const b = bit(d);
      for (const dir of ['row', 'col']) {
        const base = []; // [line, positions mask]
        for (let a = 0; a < n; a++) {
          let pos = 0, cnt = 0, have = false;
          for (let x = 0; x < n; x++) { const c = dir === 'row' ? a * n + x : x * n + a; if (vals[c] === d) { have = true; break; } if (!vals[c] && (cand[c] & b)) { pos |= 1 << x; cnt++; } }
          if (!have && cnt >= 2 && cnt <= k) base.push([a, pos]);
        }
        if (base.length < k) continue;
        for (const S of combos(base, k)) {
          let m = 0; S.forEach((s) => (m |= s[1])); if (pc(m) !== k) continue;
          const lines = new Set(S.map((s) => s[0])); const el = []; const cells = [];
          for (let x = 0; x < n; x++) if (m & (1 << x)) for (let a = 0; a < n; a++) {
            const c = dir === 'row' ? a * n + x : x * n + a;
            if (lines.has(a)) { if (!vals[c] && (cand[c] & b)) cells.push(c); } else if (!vals[c] && (cand[c] & b)) el.push([c, b]);
          }
          if (el.length) return { t: k === 2 ? 'xwing' : 'swordfish', digit: d, dir, lines: [...lines], cells, elims: el };
        }
      }
    }
    return null;
  };
  Logic.prototype.xywing = function () {
    const L = this.L, vals = this.vals, cand = this.cand;
    const bi = []; for (let i = 0; i < L.N2; i++) if (!vals[i] && pc(cand[i]) === 2) bi.push(i);
    const isPeer = (a, b) => L.peers[a].includes(b);
    for (const p of bi) {
      const [x, y] = digits(cand[p]);
      const ws = bi.filter((w) => w !== p && isPeer(p, w));
      for (const w1 of ws) for (const w2 of ws) {
        if (w1 >= w2) continue;
        const m1 = cand[w1], m2 = cand[w2];
        for (const [a, b2] of [[x, y], [y, x]]) {
          if (!(m1 & bit(a)) || (m1 & bit(b2))) continue;
          const z = m1 & ~bit(a); if (pc(z) !== 1) continue;
          if (m2 !== (bit(b2) | z)) continue;
          const el = []; for (const c of L.peers[w1]) if (c !== w2 && c !== p && !vals[c] && (cand[c] & z) && isPeer(c, w2)) el.push([c, z]);
          if (el.length) return { t: 'xywing', cells: [p, w1, w2], digit: dig(z), elims: el };
        }
      }
    }
    return null;
  };
  // Solve by logic only. Returns { level, solved, uses }
  function grade(L, vals, maxLv) {
    const lg = new Logic(L, vals); let level = 0; const uses = {}; let guard = 0;
    while (lg.empty() && guard++ < 2000) {
      const s = lg.next(maxLv || 4);
      if (!s) return { level: 9, solved: false, uses, logic: lg };
      const lv = TECH[s.t].lv; if (lv > level) level = lv; uses[s.t] = (uses[s.t] || 0) + 1;
      lg.apply(s);
      if (lg.broken()) return { level: 9, solved: false, uses, logic: lg };
    }
    return { level: Math.max(1, level), solved: true, uses };
  }

  // ---------- generation ----------
  function jigsawRegions(n, rng) {
    const [br, bc] = BOX[n]; const reg = new Int8Array(n * n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) reg[r * n + c] = Math.floor(r / br) * (n / bc) + Math.floor(c / bc);
    const nb = (i) => { const r = Math.floor(i / n), c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; };
    const connected = (g) => {
      const cells = []; for (let i = 0; i < n * n; i++) if (reg[i] === g) cells.push(i);
      const seen = new Set([cells[0]]); const st = [cells[0]];
      while (st.length) { const x = st.pop(); for (const y of nb(x)) if (reg[y] === g && !seen.has(y)) { seen.add(y); st.push(y); } }
      return seen.size === cells.length;
    };
    let done = 0;
    for (let tries = 0; tries < 6000 && done < 60; tries++) {
      const a = Math.floor(rng() * n * n); const A = reg[a];
      const nbB = nb(a).filter((x) => reg[x] !== A); if (!nbB.length) continue;
      const B = reg[nbB[Math.floor(rng() * nbB.length)]];
      const cand = []; for (let i = 0; i < n * n; i++) if (reg[i] === B && i !== a && nb(i).some((x) => reg[x] === A && x !== a)) cand.push(i);
      if (!cand.length) continue;
      const b = cand[Math.floor(rng() * cand.length)];
      reg[a] = B; reg[b] = A;
      if (connected(A) && connected(B)) done++; else { reg[a] = A; reg[b] = B; }
    }
    return Array.from(reg, (g) => String.fromCharCode(97 + g)).join('');
  }
  function fullGrid(L, rng) {
    for (let t = 0; t < 30; t++) {
      const r = solve(L, new Int8Array(L.N2), 1, rng, 20000);
      if (r.sol) return r.sol;
    }
    return null;
  }
  // Split a solved grid into killer cages (digits inside a cage are all different).
  function makeCages(n, sol, rng, maxSize, pSingle) {
    const N2 = n * n; const cageOf = new Int16Array(N2).fill(-1); const cages = [];
    const nb = (i) => { const r = Math.floor(i / n), c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; };
    const order = shuffle([...Array(N2).keys()], rng);
    for (const s of order) {
      if (cageOf[s] >= 0) continue;
      const target = rng() < pSingle ? 1 : 2 + Math.floor(rng() * (maxSize - 1));
      const cells = [s]; let used = bit(sol[s]); cageOf[s] = cages.length;
      while (cells.length < target) {
        const opts = []; cells.forEach((c) => nb(c).forEach((x) => { if (cageOf[x] < 0 && !(used & bit(sol[x]))) opts.push(x); }));
        if (!opts.length) break;
        const x = opts[Math.floor(rng() * opts.length)]; cells.push(x); used |= bit(sol[x]); cageOf[x] = cages.length;
      }
      cages.push(cells);
    }
    // Fold leftover single cells into a neighbouring cage when possible, so singles stay rare.
    for (let k = 0; k < cages.length; k++) {
      const cg = cages[k]; if (cg.length !== 1 || rng() < pSingle) continue;
      const c = cg[0]; const opts = nb(c).map((x) => cageOf[x]).filter((g) => g !== k && cages[g].length < maxSize + 1 && !cages[g].some((y) => sol[y] === sol[c]));
      if (!opts.length) continue;
      const g = opts[Math.floor(rng() * opts.length)]; cages[g].push(c); cageOf[c] = g; cages[k] = [];
    }
    return cages.filter((c) => c.length).map((c) => [c.reduce((s, i) => s + sol[i], 0)].concat(c.sort((a, b) => a - b)));
  }

  // Givens kept for Easy and Medium so they feel welcoming.
  const MIN_GIVENS = { 4: [8, 6, 4, 4], 6: [18, 13, 0, 0], 8: [30, 22, 0, 0], 9: [36, 27, 0, 0] };
  // Logic level each difficulty must need: [lowest, highest]. Small grids rarely need advanced steps.
  const GRADE_FOR = { std: [[1, 1], [2, 2], [3, 3], [4, 4]], small: [[1, 1], [1, 2], [2, 2], [3, 4]] };
  const KILLER_GIVENS = [16, 6, 0, 0];

  // opts: { type, n, level (1-4), seed, timeBudget(ms) }
  // Returns { type, n, level, givens, solution, regions?, cages?, grade, attempts } or the best near-miss.
  function generate(opts) {
    const type = opts.type, level = opts.level, n = opts.n || TYPES[type].n || 9;
    const rng = RNG(opts.seed == null ? (Math.random() * 4294967295) >>> 0 : opts.seed);
    const t0 = Date.now(), budget = opts.timeBudget || 20000; let best = null;
    for (let attempt = 1; attempt < 4000; attempt++) {
      if (attempt > 1 && Date.now() - t0 > budget) break;
      const regions = type === 'jigsaw' ? jigsawRegions(n, rng) : null;
      let L = new Layout(type, n, regions, null);
      const sol = fullGrid(L, rng); if (!sol) continue;
      let cages = null;
      if (type === 'killer') {
        cages = makeCages(n, sol, rng, level === 1 ? 3 : level === 2 ? 4 : 5, level === 1 ? 0.12 : 0.04);
        L = new Layout(type, n, null, cages);
      }
      const vals = Int8Array.from(sol);
      const minG = type === 'killer' ? KILLER_GIVENS[level - 1] : (MIN_GIVENS[n] || [0, 0, 0, 0])[level - 1];
      let givens = L.N2;
      let want = GRADE_FOR.std[level - 1]; if (n < 9) want = GRADE_FOR.small[level - 1]; if (type === 'killer' && level === 4) want = [3, 4];
      const ok = () => { const r = solve(L, vals, 2, null, 60000); return r.count === 1 && !r.aborted && grade(L, vals, want[1]).solved; };
      if (type === 'killer') {
        // Start from no givens; add givens until the cages have one answer that logic can reach.
        vals.fill(0); givens = 0;
        for (let g = 0; g < 40 && !ok(); g++) {
          let pick = -1;
          const lg = new Logic(L, vals); while (lg.empty()) { const s = lg.next(want[1]); if (!s) break; lg.apply(s); }
          const opts2 = []; for (let i = 0; i < L.N2; i++) if (!lg.vals[i]) opts2.push(i);
          if (!opts2.length) break;
          // choose the empty square with the most candidates left
          let bc = -1; for (const i of opts2) { const c = pc(lg.cand[i]); if (c > bc || (c === bc && rng() < 0.3)) { bc = c; pick = i; } }
          vals[pick] = sol[pick]; givens++;
        }
        if (!ok()) continue;
      }
      // Remove givens (in symmetric pairs for the regular shapes) while the puzzle keeps one answer and stays within the level.
      const sym = type !== 'killer';
      const cells = shuffle([...Array(L.N2).keys()].filter((i) => vals[i]), rng);
      const tried = new Set();
      for (const i of cells) {
        if (tried.has(i) || !vals[i]) continue;
        const j = L.N2 - 1 - i; const pair = sym && j !== i && vals[j] ? [i, j] : [i]; pair.forEach((x) => tried.add(x));
        if (givens - pair.length < minG) continue;
        const keep = pair.map((x) => vals[x]); pair.forEach((x) => (vals[x] = 0));
        if (ok()) givens -= pair.length; else pair.forEach((x, k) => (vals[x] = keep[k]));
      }
      const g = grade(L, vals, 4);
      const res = { type, n, level, givens: Array.from(vals).join('').replace(/0/g, '.'), solution: sol.join(''), regions, cages, grade: g.level, uses: g.uses, count: givens, attempts: attempt };
      if (g.level >= want[0] && g.level <= want[1]) return res;
      if (g.level <= want[1] && (!best || g.level > best.grade)) best = res;
    }
    if (best) best.nearMiss = true;
    return best;
  }

  return { RNG, shuffle, pc, bit, dig, digits, BOX, TYPES, WINDOWS, TECH, Layout, solve, Logic, grade, generate, jigsawRegions, sumCombos, cageOptions };
});
