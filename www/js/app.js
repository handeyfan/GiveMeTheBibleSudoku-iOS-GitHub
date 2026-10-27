/* Give Me the Bible Sudoku — main application */
(function () {
  'use strict';
  const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi', 'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'];
  const CATS = window.THEME_CATS, SDT = window.SD_THEMES || [], SDP = window.SD_PUZZLES || {};
  const E = window.SDEngine;
  const LEVELS = {
    easy: { name: 'Easy', n: 1, help: 'Plenty of numbers to start. Each square can be worked out by looking for the only place a number fits.' },
    medium: { name: 'Medium', n: 2, help: 'Fewer numbers to start. Pencil marks help: look for pairs and numbers locked into one row or box.' },
    hard: { name: 'Hard', n: 3, help: 'Needs careful pencil marks: triples and the X-wing pattern.' },
    expert: { name: 'Expert', n: 4, help: 'The toughest: quads, swordfish and XY-wings.' }
  };
  const LV = ['easy', 'medium', 'hard', 'expert'];
  const lvKey = (k) => LV[k - 1];
  const TYPES = {
    classic: { name: 'Classic', short: 'Classic 9×9', help: 'Fill every row, column and 3×3 box with the numbers 1 to 9.' },
    mini: { name: 'Little Sudoku', short: '6×6', help: 'A smaller grid: every row, column and 2×3 box holds 1 to 6. A gentle place to begin.' },
    diagonal: { name: 'Diagonal', short: 'Diagonal', help: 'Classic rules, and both shaded diagonals must also hold 1 to 9.' },
    windows: { name: 'Windows', short: 'Windows', help: 'Classic rules, plus the four shaded windows must each hold 1 to 9.' },
    jigsaw: { name: 'Jigsaw', short: 'Jigsaw', help: 'The boxes are irregular shapes. Every row, column and shape holds 1 to 9.' },
    killer: { name: 'Killer', short: 'Killer', help: 'The dotted cages show sums. The numbers in a cage add up to its small total and never repeat. Every row, column and box adds up to 45.' },
    word: { name: 'Word Sudoku', short: 'Word', help: 'Letters instead of numbers. Fill every row, column and box with the letters of a Bible word. The gold row spells the word.' }
  };
  const TYPE_KEYS = Object.keys(TYPES);
  const $ = (s, el) => (el || document).querySelector(s);
  const screen = $('#screen');
  const modalRoot = $('#modal-root');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- icons ----------
  const sv = (d, w) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const I = {
    exit: sv('<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4"/><path d="M5 12h11"/>'),
    back: sv('<path d="M15 18l-6-6 6-6"/>'),
    hint: sv('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>'),
    save: sv('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h8V3"/><path d="M8 21v-7h8v7"/>'),
    more: sv('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', 2.6),
    plus: sv('<path d="M12 5v14M5 12h14"/>', 2.4), minus: sv('<path d="M5 12h14"/>', 2.4),
    prev: sv('<path d="M15 18l-6-6 6-6"/>', 2.4), next: sv('<path d="M9 18l6-6-6-6"/>', 2.4),
    book: sv('<path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h6M8 13h4"/>'),
    close: sv('<path d="M6 6l12 12M18 6 6 18"/>', 2.4),
    user: sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    marker: sv('<path d="m9 11 6-6 4 4-6 6"/><path d="M9 11 5 15v4h4l4-4"/><path d="M3 21h18"/>'),
    undo: sv('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
    redo: sv('<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'),
    erase: sv('<path d="M20 20H8l-5-5 10-10 8 8-6 6"/><path d="M6 12l7 7"/>'),
    pen: sv('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>'),
    pencil: sv('<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/><path d="M4 20l5-1"/>'),
    cross: sv('<path d="M5 19 19 5"/><circle cx="12" cy="12" r="8"/>'),
    grid: sv('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
    check: sv('<path d="M5 12l4 4 10-10"/>', 2.4)
  };

  // ---------- storage & profiles ----------
  const G = {
    get(k, d) { try { const v = localStorage.getItem('sd.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('sd.' + k, JSON.stringify(v)); return true; } catch (e) { toast('Could not save: storage is full or unavailable.'); return false; } },
    del(k) { try { localStorage.removeItem('sd.' + k); } catch (e) { /* ignore */ } }
  };
  const PER_PROFILE = ['seenRules', 'settings', 'saves', 'done', 'randomOpts', 'randomCount', 'readerPos', 'libtype', 'libcat', 'liblv', 'hl', 'hlLast'];
  if (!G.get('profiles')) { const id = 'u' + Date.now().toString(36); G.set('profiles', [{ id, name: 'Player 1', created: Date.now() }]); G.set('profile', id); }
  let pid = G.get('profile');
  if (!G.get('profiles').some((p) => p.id === pid)) { pid = G.get('profiles')[0].id; G.set('profile', pid); }
  const profiles = () => G.get('profiles', []);
  const profileName = () => (profiles().find((p) => p.id === pid) || { name: 'Player' }).name;
  const store = {
    get(k, d) { return G.get('u.' + pid + '.' + k, d); },
    set(k, v) { return G.set('u.' + pid + '.' + k, v); },
    del(k) { G.del('u.' + pid + '.' + k); }
  };

  const defaults = { theme: 'light', size: 'normal', mistakes: 'instant', same: true, peers: true, autoNotes: true, timer: true, reveal: true, numNotes: true, v: 1 };
  let settings = {};
  function loadSettings() { settings = Object.assign({}, defaults, store.get('settings', {})); }
  loadSettings();
  function saveSettings() { store.set('settings', settings); }
  function applyLook() {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.size = settings.size;
  }
  applyLook();

  const saves = () => store.get('saves', {});
  function putSave(s) { const all = saves(); all[s.key] = s; store.set('saves', all); }
  function dropSave(key) { const all = saves(); delete all[key]; store.set('saves', all); }
  const records = () => store.get('done', []);
  const sig = (p) => { let h = 2166136261; const s = p.g + (p.r || '') + JSON.stringify(p.k || '') + (p.w || ''); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

  // ---------- KJV (lazy) ----------
  let kjvReady = null, bible = null;
  function loadKJV() {
    if (kjvReady) return kjvReady;
    kjvReady = new Promise((res, rej) => {
      if (window.KJV) return res();
      const s = document.createElement('script'); s.src = 'data/kjv.js'; s.onload = () => res(); s.onerror = () => rej(new Error('KJV failed to load'));
      document.head.appendChild(s);
    }).then(() => { bible = bible || new CWEngine.Bible(window.KJV_BOOKS, window.KJV); return bible; });
    return kjvReady;
  }
  const refStr = (r) => BOOKS[r[0]] + ' ' + r[1] + ':' + r[2];
  const passStr = (p) => BOOKS[p[0]] + ' ' + p[1] + (p[2] !== p[1] ? '–' + p[2] : '');
  const vref = (id) => BOOKS[bible.vb[id]] + ' ' + bible.vc[id] + ':' + bible.vv[id];

  // ---------- platform ----------
  function exitApp() {
    confirmBox('Exit Give Me the Bible Sudoku?', 'Your puzzle progress is saved automatically.', 'Exit', () => {
      if (game) game.persist();
      if (window.desktop && window.desktop.exit) window.desktop.exit();
      else if (window.Android && window.Android.exit) window.Android.exit();
      else if (window.iOS) { home(); toast('Progress saved. Swipe up from the bottom of the screen to close the app.'); }
      else { window.close(); setTimeout(() => toast('Close this browser tab to exit.'), 300); }
    });
  }
  function doPrint() {
    if (window.desktop && window.desktop.print) window.desktop.print();
    else if (window.Android && window.Android.print) window.Android.print();
    else if (window.iOS) window.iOS.print();
    else window.print();
  }

  // ---------- UI helpers ----------
  function bar(title, sub, opts) {
    opts = opts || {};
    return '<header class="bar">' +
      (opts.back ? '<button class="btn icon" data-act="back" aria-label="Back">' + I.back + '</button>' : '') +
      '<div style="flex:1;min-width:0"><h1>' + esc(title) + '</h1>' + (opts.subHtml ? '<div class="sub">' + opts.subHtml + '</div>' : sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>' +
      (opts.extra || '') +
      '<button class="btn" data-act="exit" aria-label="Exit app">' + I.exit + '<span class="lbl">Exit</span></button>' +
      '</header>';
  }
  function wireBar(onBack) {
    screen.querySelectorAll('[data-act="exit"]').forEach((b) => (b.onclick = exitApp));
    const bb = screen.querySelector('[data-act="back"]'); if (bb) bb.onclick = onBack;
  }
  function toast(msg, long) {
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), long ? 4200 : 2600);
  }
  function modal(html, onMount) {
    const sc = document.createElement('div'); sc.className = 'scrim';
    sc.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    modalRoot.appendChild(sc);
    const close = () => sc.remove();
    sc.addEventListener('click', (e) => { if (e.target === sc) close(); });
    sc.querySelectorAll('[data-close]').forEach((b) => (b.onclick = close));
    if (onMount) onMount(sc, close);
    const f = sc.querySelector('input[type="text"]') || sc.querySelector('.actions .btn.primary') || sc.querySelector('button'); if (f) f.focus();
    return close;
  }
  function confirmBox(title, text, okLabel, onOk) {
    modal('<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>' + esc(okLabel) + '</button></div>',
      (sc, close) => { sc.querySelector('[data-ok]').onclick = () => { close(); onOk(); }; });
  }
  function promptBox(title, label, value, okLabel, onOk) {
    modal('<h2>' + esc(title) + '</h2><div class="field"><label for="pb">' + esc(label) + '</label><input type="text" id="pb" maxlength="40" value="' + esc(value || '') + '"></div>' +
      '<div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>' + esc(okLabel) + '</button></div>',
    (sc, close) => {
      const inp = sc.querySelector('#pb'); const ok = () => { const v = inp.value.trim(); if (!v) { inp.focus(); return; } close(); onOk(v); };
      sc.querySelector('[data-ok]').onclick = ok; inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); };
      setTimeout(() => { inp.focus(); inp.select(); }, 30);
    });
  }
  function busy(msg) {
    const d = document.createElement('div'); d.className = 'loading';
    d.innerHTML = '<div>' + esc(msg) + '</div>';
    document.body.appendChild(d);
    return () => d.remove();
  }
  function menu(anchor, items) {
    closePops();
    const m = document.createElement('div'); m.className = 'pop'; m.setAttribute('role', 'menu');
    m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : '<button role="menuitem" data-i="' + i + '">' + esc(it[0]) + (it[2] ? '<small>' + esc(it[2]) + '</small>' : '') + '</button>').join('');
    document.body.appendChild(m);
    const r = anchor.getBoundingClientRect();
    m.style.top = Math.max(8, Math.min(r.bottom + 6, window.innerHeight - m.offsetHeight - 8)) + 'px';
    m.style.left = Math.max(8, Math.min(window.innerWidth - m.offsetWidth - 8, r.right - m.offsetWidth)) + 'px';
    m.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; m.remove(); items[+b.dataset.i][1](); };
    setTimeout(() => document.addEventListener('pointerdown', closePopsOutside, { capture: true }), 0);
  }
  function closePops() { document.querySelectorAll('.pop').forEach((p) => p.remove()); document.removeEventListener('pointerdown', closePopsOutside, { capture: true }); }
  function closePopsOutside(e) { if (!e.target.closest('.pop')) closePops(); }
  const fmtTime = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
  const segHtml = (id, val, opts) => '<div class="seg" id="' + id + '">' + opts.map((o) => '<button data-v="' + o[0] + '" aria-pressed="' + (String(val) === String(o[0])) + '">' + o[1] + '</button>').join('') + '</div>';
  const lvBadge = (k) => '<span class="lvb lv-' + k + '">' + LEVELS[k].name + '</span>';

  // ---------- navigation ----------
  let current = null; const history = [];
  function go(view, args, replace) {
    if (game && view !== 'puzzle') { game.stop(); }
    if (current && !replace) history.push(current);
    current = { view, args };
    closePops();
    VIEWS[view](args || {});
  }
  function back() {
    const prev = history.pop();
    if (!prev) return go('title', {}, true);
    if (game && prev.view !== 'puzzle') game.stop();
    current = prev; VIEWS[prev.view](prev.args || {});
  }
  function home() { history.length = 0; current = null; go('title', {}, true); }

  // ---------- views ----------
  const VERSES = [['Psalms', 119, 105, 'Thy word is a lamp unto my feet, and a light unto my path.'], ['1 Corinthians', 14, 40, 'Let all things be done decently and in order.'], ['Proverbs', 3, 5, 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.'], ['Isaiah', 1, 18, 'Come now, and let us reason together, saith the LORD.'], ['James', 1, 5, 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally.'], ['Psalms', 90, 12, 'So teach us to number our days, that we may apply our hearts unto wisdom.'], ['Proverbs', 25, 2, 'It is the glory of God to conceal a thing: but the honour of kings is to search out a matter.'], ['Ecclesiastes', 3, 1, 'To every thing there is a season, and a time to every purpose under the heaven.']];
  const VIEWS = {};

  VIEWS.title = function () {
    const svs = Object.values(saves()).filter((s) => !s.done).sort((a, b) => b.updated - a.updated);
    const recent = svs[0];
    const done = records().filter((r) => !r.auto).length;
    const hl = store.get('hl', { folders: [], items: [] });
    const vd = VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];
    const mark = [7, 0, 9, 0, 3, 0, 1, 0, 5]; // a little sudoku box with one gold square
    const markHtml = '<div class="sbox">' + mark.map((d, i) => '<span class="st' + (i === 4 ? ' gold' : d ? '' : ' blank') + '">' + (d || '') + '</span>').join('') + '</div>' +
      '<div class="sword"><span class="st">J</span><span class="st">O</span><span class="st">Y</span></div>';
    screen.innerHTML =
      '<div class="title-screen"><div class="title-card">' +
      '<div class="title-mark sd" aria-hidden="true">' + markHtml + '</div>' +
      '<h1><small>Give Me the Bible</small>Sudoku</h1><p class="tag">King James Version</p>' +
      '<div class="who">' + I.user + '<span>Playing as <b>' + esc(profileName()) + '</b></span><button class="btn quiet" data-go="profiles">Switch player</button></div>' +
      '<nav class="menu-list">' +
      (recent ? '<button class="btn primary" data-go="continue"><span>Continue puzzle<small>' + esc(recent.title) + ' – ' + Math.round((recent.pct || 0) * 100) + '% filled</small></span></button>' : '') +
      '<button class="btn ' + (recent ? '' : 'primary') + '" data-go="library"><span>Puzzle library<small>1,400 puzzles: 7 kinds of sudoku, each with 200 Bible themes</small></span></button>' +
      '<button class="btn" data-go="random"><span>New random puzzle<small>Pick the kind and difficulty – a fresh puzzle every time</small></span></button>' +
      '<button class="btn" data-go="howto"><span>How to play<small>The rules of each kind, pencil marks and hints</small></span></button>' +
      '<button class="btn" data-go="saved"><span>Saved puzzles<small>' + plural(svs.length, 'puzzle') + ' in progress</small></span></button>' +
      '<button class="btn" data-go="record"><span>Completed puzzles<small>' + done + ' solved</small></span></button>' +
      '<button class="btn" data-go="bible"><span>Read the Bible<small>The complete King James Bible</small></span></button>' +
      '<button class="btn" data-go="highlights"><span>My highlights<small>' + plural(hl.items.length, 'verse') + ' saved in ' + plural(hl.folders.length, 'folder') + '</small></span></button>' +
      '<button class="btn" data-go="settings"><span>Settings<small>Mistakes in red, helpers, text size, reset</small></span></button>' +
      '</nav>' +
      '<div class="title-foot"><button class="btn" data-act="exit">' + I.exit + '<span class="lbl">Exit</span></button></div>' +
      '<div class="verse-of-day">“' + esc(vd[3]) + '”<cite>' + vd[0] + ' ' + vd[1] + ':' + vd[2] + '</cite></div>' +
      '</div></div>';
    wireBar();
    screen.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => {
      const g = b.dataset.go;
      if (g === 'continue') openSave(recent.key); else go(g);
    }));
  };

  // ----- profiles -----
  VIEWS.profiles = function () {
    const list = profiles();
    const stat = (id) => { const d = G.get('u.' + id + '.done', []); const s = Object.keys(G.get('u.' + id + '.saves', {})).length; return plural(d.length, 'puzzle') + ' completed, ' + s + ' in progress'; };
    screen.innerHTML = bar('Players', plural(list.length, 'player') + ' on this device', { back: true }) +
      '<div class="scroll"><div class="wrap" style="max-width:720px">' +
      '<p class="cat-sub">Each player has their own saved puzzles, completed record, highlights and settings.</p>' +
      '<div class="plist" style="grid-template-columns:1fr">' + list.map((p) =>
        '<div class="pitem" style="grid-template-columns:40px 1fr auto">' + '<span class="pnum">' + I.user + '</span>' +
        '<span><b>' + esc(p.name) + (p.id === pid ? ' <span class="badge">Playing now</span>' : '') + '</b><span class="d">' + stat(p.id) + '</span></span>' +
        '<span class="row-actions">' + (p.id !== pid ? '<button class="btn primary" data-play="' + p.id + '">Play as ' + esc(p.name) + '</button>' : '') +
        '<button class="btn icon" data-menu="' + p.id + '" aria-label="More for ' + esc(p.name) + '">' + I.more + '</button></span></div>').join('') + '</div>' +
      '<p style="margin-top:16px"><button class="btn primary" id="addp">' + I.plus + '<span>Add a player</span></button></p>' +
      '</div></div>';
    wireBar(back);
    $('#addp').onclick = () => promptBox('Add a player', 'Name', '', 'Add player', (name) => {
      const id = 'u' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      const l = profiles(); l.push({ id, name, created: Date.now() }); G.set('profiles', l);
      switchProfile(id); toast('Welcome, ' + name + '!');
    });
    screen.querySelectorAll('[data-play]').forEach((b) => (b.onclick = () => { switchProfile(b.dataset.play); toast('Now playing as ' + profileName()); }));
    screen.querySelectorAll('[data-menu]').forEach((b) => (b.onclick = () => {
      const id = b.dataset.menu; const p = profiles().find((x) => x.id === id);
      menu(b, [
        ['Rename', () => promptBox('Rename player', 'Name', p.name, 'Save', (name) => { const l = profiles(); l.find((x) => x.id === id).name = name; G.set('profiles', l); VIEWS.profiles(); })],
        ['Delete player', () => {
          if (profiles().length === 1) { toast('Add another player before deleting the only one.'); return; }
          confirmBox('Delete ' + p.name + '?', 'This removes their saved puzzles, completed record, highlights and settings from this device.', 'Delete player', () => {
            const l = profiles().filter((x) => x.id !== id); G.set('profiles', l);
            PER_PROFILE.forEach((k) => G.del('u.' + id + '.' + k));
            if (id === pid) switchProfile(l[0].id); else VIEWS.profiles();
          });
        }]
      ]);
    }));
  };
  function switchProfile(id) {
    if (game) { game.persist(); game.stop(); game = null; }
    pid = id; G.set('profile', id); loadSettings(); applyLook();
    history.length = 0; current = null; go('title', {}, true);
  }

  // ----- library -----
  const premadeKey = (type, id) => type + '-' + id;
  const themeOf = (id) => SDT.find((t) => t.id === id);
  VIEWS.library = function (args) {
    const type = args.type || store.get('libtype', 'classic');
    const cat = args.cat || store.get('libcat', 'all');
    const lvf = args.lv || store.get('liblv', 'all');
    const svs = saves(); const doneSet = new Set(records().filter((r) => !r.auto).map((r) => r.key));
    const all = SDP[type] || [];
    const list = all.filter((p) => (cat === 'all' || themeOf(p.t).cat === cat) && (lvf === 'all' || lvKey(p.lv) === lvf));
    const nDone = all.filter((p) => doneSet.has(premadeKey(type, p.id))).length;
    const counts = LV.map((k) => all.filter((p) => lvKey(p.lv) === k).length);
    screen.innerHTML = bar('Puzzle library', TYPES[type].name + ' – ' + nDone + ' of ' + all.length + ' solved', { back: true }) +
      '<div class="tabs" role="tablist" aria-label="Kind of sudoku">' + TYPE_KEYS.map((k) => '<button class="tab" role="tab" aria-selected="' + (k === type) + '" data-type="' + k + '">' + esc(TYPES[k].name) + '</button>').join('') + '</div>' +
      '<div class="scroll"><div class="wrap">' +
      '<div class="stylebar"><span class="lab">' + esc(TYPES[type].name) + '</span><span class="help" style="margin-top:-4px">' + esc(TYPES[type].help) + ' <button class="ref" id="howtype">How to play ' + esc(TYPES[type].name) + '</button></span>' +
      '<span class="lab" style="margin-top:8px">Difficulty</span>' + segHtml('lvl', lvf, [['all', 'All']].concat(LV.map((k, i) => [k, LEVELS[k].name + ' <small>' + counts[i] + '</small>']))) +
      '<label class="lab" for="lcat" style="margin-top:8px">Part of the Bible</label><select id="lcat"><option value="all">All 200 themes</option>' + CATS.map((c) => '<option value="' + c.id + '">' + esc(c.name) + ' (' + esc(c.sub) + ')</option>').join('') + '</select></div>' +
      (list.length ? '<div class="plist">' + list.map((p) => {
        const th = themeOf(p.t); const key = premadeKey(type, p.id); const s = svs[key];
        const st = doneSet.has(key) ? '<span class="pstat done">' + I.check + 'Solved</span>' : s ? '<span class="pstat prog">' + Math.round((s.pct || 0) * 100) + '%</span>' : '';
        return '<button class="pitem" data-id="' + p.id + '"><span class="pnum">' + p.id + '</span><span><b>' + esc(th.title) + '</b><span class="d">' + lvBadge(lvKey(p.lv)) +
          (p.w ? ' <span class="wtag">' + p.w.length + ' letters</span>' : '') + ' ' + esc(th.desc) + '</span></span>' + st + '</button>';
      }).join('') + '</div>' : '<p class="empty">No puzzles match. Choose another difficulty or part of the Bible.</p>') +
      '</div></div>';
    wireBar(back);
    $('#lcat').value = cat;
    const re = (o) => { const a = Object.assign({ type, cat, lv: lvf }, o); store.set('libtype', a.type); store.set('libcat', a.cat); store.set('liblv', a.lv); current.args = a; VIEWS.library(a); };
    screen.querySelectorAll('[data-type]').forEach((b) => (b.onclick = () => re({ type: b.dataset.type })));
    $('#lvl').onclick = (e) => { const b = e.target.closest('button'); if (b) re({ lv: b.dataset.v }); };
    $('#lcat').onchange = (e) => re({ cat: e.target.value });
    screen.querySelectorAll('[data-id]').forEach((b) => (b.onclick = () => openPremade(type, +b.dataset.id)));
    $('#howtype').onclick = () => rulesModal(type, false);
    const sel = screen.querySelector('.tab[aria-selected="true"]'); if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  };

  // ----- random -----
  VIEWS.random = function () {
    const last = Object.assign({ type: 'classic', level: 'easy', wlen: 6, src: 'any' }, store.get('randomOpts', {}));
    const groups = CATS.map((c) => '<optgroup label="' + esc(c.name) + '">' + SDT.filter((t) => t.cat === c.id).map((t) => '<option value="' + t.id + '">' + esc(t.title) + '</option>').join('') + '</optgroup>').join('');
    screen.innerHTML = bar('New random puzzle', 'A fresh puzzle every time', { back: true }) +
      '<div class="scroll"><div class="wrap" style="max-width:680px"><div class="panel">' +
      '<div class="field"><span class="lab">Kind of sudoku</span>' + segHtml('rtype', last.type, TYPE_KEYS.map((k) => [k, TYPES[k].name])) + '<span class="help" id="rtypeh"></span></div>' +
      '<div class="field"><span class="lab">Difficulty</span>' + segHtml('rlvl', last.level, LV.map((k) => [k, LEVELS[k].name])) + '<span class="help" id="rlvlh"></span></div>' +
      '<div class="field" id="wordopts"><span class="lab">Word length</span>' + segHtml('rwlen', last.wlen, [[6, '6 letters (6×6 grid)'], [8, '8 letters (8×8)'], [9, '9 letters (9×9)']]) +
      '<label for="rsrc" class="lab" style="margin-top:6px">Take the word from</label><select id="rsrc"><option value="any">Any theme (surprise me)</option>' + groups + '</select></div>' +
      '<div class="field"><label for="rtheme" class="lab">Verse to go with the puzzle</label><select id="rtheme"><option value="any">A surprise theme</option>' + groups + '</select><span class="help">The theme’s key verse is shown beside the puzzle and when you finish.</span></div>' +
      '<button class="btn primary" id="rgo" style="width:100%;min-height:52px">Make my puzzle</button></div></div></div>';
    wireBar(back);
    let type = last.type, level = last.level, wlen = last.wlen;
    $('#rsrc').value = last.src; $('#rtheme').value = last.theme || 'any';
    const paint = () => {
      $('#rtypeh').textContent = TYPES[type].help; $('#rlvlh').textContent = LEVELS[level].help;
      $('#wordopts').hidden = type !== 'word'; $('#rtheme').closest('.field').hidden = type === 'word';
    };
    const segWire = (id, set) => ($('#' + id).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; set(b.dataset.v); $('#' + id).querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); });
    segWire('rtype', (v) => (type = v)); segWire('rlvl', (v) => (level = v)); segWire('rwlen', (v) => (wlen = +v));
    paint();
    $('#rgo').onclick = () => { const o = { type, level, wlen, src: $('#rsrc').value, theme: $('#rtheme').value }; store.set('randomOpts', o); makeRandom(o); };
  };

  // ----- how to play -----
  // Rules and a starting tip for each kind of sudoku, with a sample board from the library.
  const GUIDE = {
    classic: { rules: ['Every <b>row</b> holds the numbers 1 to 9, each once.', 'Every <b>column</b> holds 1 to 9, each once.', 'Every <b>3×3 box</b> (marked by the thick lines) holds 1 to 9, each once.'],
      tip: 'Pick one number and one box. Cross out the squares in that box that share a row or column with the same number somewhere else. If only one square is left, that is where the number goes.' },
    mini: { rules: ['A smaller grid, 6 squares across and 6 down.', 'Every <b>row</b> and every <b>column</b> holds the numbers 1 to 6, each once.', 'Every <b>box</b> (2 rows tall and 3 squares wide) holds 1 to 6, each once.'],
      tip: 'The same thinking as Classic with fewer numbers to keep track of – a good place to learn. Look for a row, column or box with only one or two empty squares first.' },
    diagonal: { rules: ['All the Classic rules: every row, column and 3×3 box holds 1 to 9.', 'The two <b>shaded diagonals</b>, corner to corner, must also each hold 1 to 9, each once.'],
      tip: 'Squares on a diagonal have to fit more rules, so they often have fewer choices – start there. The centre square sits on both diagonals.' },
    windows: { rules: ['All the Classic rules: every row, column and 3×3 box holds 1 to 9.', 'The four <b>shaded windows</b> (extra 3×3 areas) must also each hold 1 to 9, each once.'],
      tip: 'Each window overlaps four boxes. A number already in a window cannot appear anywhere else in it, which rules out squares in the boxes around it.' },
    jigsaw: { rules: ['Every <b>row</b> and every <b>column</b> holds 1 to 9, each once.', 'Instead of 3×3 boxes there are nine <b>irregular shapes</b>, outlined with thick lines. Each shape holds 1 to 9, each once.'],
      tip: 'Follow the thick lines carefully. When a shape reaches into a row or column by just one or two squares, those squares often decide where a number must go.' },
    killer: { rules: ['Every <b>row</b>, <b>column</b> and <b>3×3 box</b> holds 1 to 9, each once.', 'The dotted outlines are <b>cages</b>. The numbers in a cage add up to the small total in its corner.', 'A number never repeats inside a cage.', 'Few or no numbers are given at the start – the totals are your clues.'],
      tip: 'Start with cages that can only be made one way. Two squares that add to 3 must be 1 and 2; two that add to 17 must be 8 and 9; three that add to 6 must be 1, 2 and 3; three that add to 24 must be 7, 8 and 9. Also remember every row, column and box adds up to 45: take away the cages that sit wholly inside it, and what is left tells you the missing squares.' },
    word: { rules: ['Letters take the place of numbers. They are the letters of one Bible word, and no letter repeats in the word.', 'Every <b>row</b>, <b>column</b> and <b>box</b> holds each letter once.', 'The grid is as wide as the word: 6 letters (boxes 2 rows tall and 3 wide), 8 letters (boxes 2 tall and 4 wide) or 9 letters (3×3 boxes).', 'The <b>gold row</b> spells the word, reading left to right.'],
      tip: 'Solve it just like a number sudoku. Once you can guess the word from the letters in the gold row, you can fill that whole row in – and it helps everywhere else.' }
  };
  function sampleBoard(type) {
    const p = (SDP[type] || [])[0]; if (!p) return '';
    const puz = normalize(Object.assign({ key: 'sample', type }, p));
    const L = layoutFor(puz), sym = symbolsFor(puz), n = puz.n, lab = cageLabels(L);
    let cells = '';
    for (let i = 0; i < n * n; i++) {
      const d = puz.g[i] !== '.' ? +puz.g[i] : 0;
      cells += '<div class="c' + (L.extra[i] ? ' xt' : '') + (puz.w && Math.floor(i / n) === puz.wr ? ' wrow' : '') + ' given">' + (lab[i] ? '<span class="csum">' + lab[i] + '</span>' : '') + (d ? '<span class="v">' + sym[d] + '</span>' : '') + '</div>';
    }
    return '<div class="sboard sample' + (L.cages.length ? ' killer' : '') + (puz.w ? ' wordsd' : '') + '" style="--n:' + n + ';--cs:' + Math.round(234 / n) + 'px" aria-hidden="true"><div class="cells">' + cells + '</div>' + linesSvg(puz, L) + '</div>';
  }
  const guideHtml = (t) => '<div class="guide"><div class="guide-board">' + sampleBoard(t) + '</div><div class="guide-text"><ul class="rules-list">' + GUIDE[t].rules.map((r) => '<li>' + r + '</li>').join('') + '</ul>' +
    '<p class="tip"><b>Getting started:</b> ' + esc(GUIDE[t].tip) + '</p></div></div>';
  function rulesModal(type, first) {
    modal('<h2>How to play ' + esc(TYPES[type].name) + '</h2>' + guideHtml(type) +
      '<div class="actions">' + (first ? '<label class="opt" style="margin-right:auto"><input type="checkbox" id="noshow"> Don’t show this again</label>' : '') + '<button class="btn primary" data-close>' + (first ? 'Start playing' : 'Close') + '</button></div>',
    (sc) => { const cb = sc.querySelector('#noshow'); if (cb) cb.onchange = () => { const seen = store.get('seenRules', {}); seen[type] = cb.checked ? 2 : 1; store.set('seenRules', seen); }; });
  }
  VIEWS.howto = function (args) {
    screen.innerHTML = bar('How to play', 'Sudoku the Give Me the Bible way', { back: true }) +
      '<div class="tabs" role="tablist" aria-label="Jump to">' + ['basics'].concat(TYPE_KEYS).map((k) => '<button class="tab" data-jump="' + k + '">' + (k === 'basics' ? 'The basics' : esc(TYPES[k].name)) + '</button>').join('') + '</div>' +
      '<div class="scroll" id="hscroll"><div class="wrap" style="max-width:820px">' +
      '<div class="panel" id="h-basics"><h2>Filling in squares</h2><p>Tap a square, then tap a number on the number pad below the puzzle. There is no typing needed (a keyboard works too).</p>' +
      '<ul class="howlist"><li><b>' + I.pen + ' Answer</b> puts a number in the square.</li>' +
      '<li><b>' + I.pencil + ' Pencil</b> writes small guesses in the square. Tap several numbers to pencil in several guesses.</li>' +
      '<li><b>' + I.cross + ' Cross out</b> strikes through a guess you have ruled out. Tap it again to bring it back.</li>' +
      '<li><b>' + I.erase + ' Erase</b> clears the square. <b>Undo</b> and <b>Redo</b> step back and forward.</li></ul>' +
      '<p>Mistakes show in <span style="color:var(--bad);font-weight:700">red</span>. You can change this in Settings to show only clashes, or nothing at all.</p></div>' +
      '<div class="panel"><h2>Hints</h2><p>The <b>Hints</b> button can show the next logical step and explain it, check your answers, reveal one square or fill in all the pencil marks for you. Hints never guess: every puzzle can be solved by reasoning alone.</p></div>' +
      '<div class="panel"><h2>The Bible in every puzzle</h2><p>Each puzzle has a key verse from its theme. It starts hidden: every row, column and box you finish uncovers more of its words. When you solve the puzzle, try the <b>memory verse</b>: tap the missing words back in to earn a ★ on your record.</p><p>When you fill in every square of a number, a note shows where that number appears in Scripture – such as seven, the day God rested.</p><p>In Word Sudoku, the gold row spells a word from the theme. Finish the puzzle to see the verse it comes from.</p></div>' +
      '<div class="panel"><h2>Difficulty</h2>' + LV.map((k) => '<p>' + lvBadge(k) + ' ' + esc(LEVELS[k].help) + '</p>').join('') + '</div>' +
      TYPE_KEYS.map((t) => '<div class="panel" id="h-' + t + '"><h2>' + esc(TYPES[t].name) + '</h2>' + guideHtml(t) + '<div class="btnrow" style="margin-top:12px"><button class="btn" data-play="' + t + '">Play ' + esc(TYPES[t].name) + ' puzzles</button></div></div>').join('') +
      '</div></div>';
    wireBar(back);
    screen.querySelectorAll('[data-jump]').forEach((b) => (b.onclick = () => { const el = $('#h-' + b.dataset.jump); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }));
    screen.querySelectorAll('[data-play]').forEach((b) => (b.onclick = () => { store.set('libtype', b.dataset.play); go('library', { type: b.dataset.play, cat: 'all', lv: 'all' }); }));
    if (args && args.type) { const el = $('#h-' + args.type); if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 30); }
  };

  // ----- saved -----
  VIEWS.saved = function () {
    const svs = Object.values(saves()).filter((s) => !s.done).sort((a, b) => b.updated - a.updated);
    screen.innerHTML = bar('Saved puzzles', plural(svs.length, 'puzzle') + ' in progress', { back: true }) +
      '<div class="scroll"><div class="wrap">' + (svs.length ? '<div class="plist">' + svs.map((s) =>
        '<div class="pitem" style="grid-template-columns:1fr auto auto"><button class="btn quiet" style="justify-content:flex-start;text-align:left" data-open="' + esc(s.key) + '"><span><b>' + esc(s.title) + '</b><span class="d">' + esc(s.sub || '') + ' – saved ' + fmtDate(s.updated) + ', ' + fmtTime(s.secs) + ' played</span></span></button>' +
        '<span class="pstat prog">' + Math.round((s.pct || 0) * 100) + '%</span><button class="btn icon quiet" aria-label="Delete save" data-del="' + esc(s.key) + '">' + I.close + '</button></div>').join('') + '</div>'
        : '<p class="empty">No puzzles in progress. Start one from the library or make a random puzzle; progress saves automatically.</p><button class="btn primary" data-go="library">Open the puzzle library</button>') +
      '</div></div>';
    wireBar(back);
    screen.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => openSave(b.dataset.open)));
    screen.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => confirmBox('Delete this saved puzzle?', 'Your progress on it will be lost.', 'Delete', () => { dropSave(b.dataset.del); VIEWS.saved(); })));
    const lg = screen.querySelector('[data-go]'); if (lg) lg.onclick = () => go('library');
  };

  // ----- record -----
  VIEWS.record = function () {
    const rec = records().slice().sort((a, b) => b.date - a.date);
    const solved = rec.filter((r) => !r.auto);
    const noHint = solved.filter((r) => !r.hints).length;
    const perfect = solved.filter((r) => !r.hints && !r.mistakes).length;
    const stars = solved.filter((r) => r.star).length;
    const lib = solved.filter((r) => !/^r/.test(r.key)).length;
    const best = (t) => { const a = solved.filter((r) => r.type === t).map((r) => r.secs); return a.length ? fmtTime(Math.min.apply(null, a)) : '–'; };
    screen.innerHTML = bar('Completed puzzles', profileName() + '’s record', { back: true }) +
      '<div class="scroll"><div class="wrap">' +
      '<div class="stats"><div class="stat"><b>' + solved.length + '</b>puzzles solved</div><div class="stat"><b>' + lib + '/1400</b>library puzzles solved</div><div class="stat"><b>' + noHint + '</b>solved without hints</div><div class="stat"><b>' + perfect + '</b>with no hints or mistakes</div><div class="stat"><b>★ ' + stars + '</b>memory verse stars</div>' +
      LV.map((k) => '<div class="stat"><b>' + solved.filter((r) => r.level === k).length + '</b>' + LEVELS[k].name + ' solved</div>').join('') + '</div>' +
      '<div class="panel"><h2>Fastest times</h2><div class="stats" style="margin:0">' + TYPE_KEYS.map((t) => '<div class="stat"><b>' + best(t) + '</b>' + TYPES[t].name + '</div>').join('') + '</div></div>' +
      (rec.length ? '<div style="overflow:auto"><table class="rec"><thead><tr><th>Puzzle</th><th>Result</th><th>Date</th><th>Time</th><th>Hints</th><th>Mistakes</th><th>Verse</th></tr></thead><tbody>' +
        rec.map((r) => '<tr><td>' + esc(r.title) + '<div class="d">' + esc([TYPES[r.type] ? TYPES[r.type].name : '', r.level ? LEVELS[r.level].name : ''].filter(Boolean).join(' – ')) + '</div></td><td>' + (r.auto ? '<span class="tag-auto">Auto-completed</span>' : '<span class="tag-solved">Solved</span>') + '</td><td>' + fmtDate(r.date) + '</td><td>' + fmtTime(r.secs) + '</td><td>' + (r.auto ? '–' : (r.hints || 0)) + '</td><td>' + (r.auto ? '–' : (r.mistakes || 0)) + '</td><td>' + (r.star ? '<span class="starmsg" aria-label="Memory verse star">★</span>' : '') + '</td></tr>').join('') + '</tbody></table></div>'
        : '<p class="empty">Finished puzzles will be listed here with the date, your time, hints and mistakes.</p>') +
      (rec.length ? '<p style="margin-top:20px"><button class="btn" id="clr">Clear record</button></p>' : '') +
      '</div></div>';
    wireBar(back);
    const c = $('#clr'); if (c) c.onclick = () => confirmBox('Clear your completed record?', 'This removes the history of finished puzzles for ' + profileName() + '. Saved puzzles are kept.', 'Clear record', () => { store.set('done', []); VIEWS.record(); });
  };

  // ----- settings -----
  VIEWS.settings = function () {
    const seg = (id, val, opts) => '<div class="seg" data-key="' + id + '">' + opts.map((o) => '<button data-v="' + o[0] + '" aria-pressed="' + (String(val) === String(o[0])) + '">' + o[1] + '</button>').join('') + '</div>';
    const onoff = [[true, 'On'], [false, 'Off']];
    screen.innerHTML = bar('Settings', 'For ' + profileName(), { back: true }) +
      '<div class="scroll"><div class="wrap" style="max-width:720px">' +
      '<div class="panel"><h2>Playing</h2>' +
      '<div class="field"><span class="lab">Show mistakes in red</span>' + seg('mistakes', settings.mistakes, [['instant', 'Right away'], ['conflict', 'Only clashes'], ['off', 'Never']]) +
      '<span class="help">Right away: any wrong answer turns red. Only clashes: red only when a number repeats in a row, column, box or cage. Never: you can still use Hints → Check my answers.</span></div>' +
      '<div class="field"><span class="lab">Highlight the same number</span>' + seg('same', settings.same, onoff) + '<span class="help">Tapping a square shades every square with the same number.</span></div>' +
      '<div class="field"><span class="lab">Shade the row, column and box</span>' + seg('peers', settings.peers, onoff) + '</div>' +
      '<div class="field"><span class="lab">Tidy pencil marks automatically</span>' + seg('autoNotes', settings.autoNotes, onoff) + '<span class="help">When you place an answer, that guess is removed from the pencil marks in the same row, column and box.</span></div>' +
      '<div class="field"><span class="lab">Show the timer</span>' + seg('timer', settings.timer, onoff) + '</div></div>' +
      '<div class="panel"><h2>Scripture</h2>' +
      '<div class="field"><span class="lab">Uncover the key verse as you solve</span>' + seg('reveal', settings.reveal, onoff) + '<span class="help">On: the verse starts hidden, and each row, column and box you finish uncovers more words. Off: the whole verse shows from the start.</span></div>' +
      '<div class="field"><span class="lab">Numbers in Scripture</span>' + seg('numNotes', settings.numNotes, onoff) + '<span class="help">When every square of a number is filled in, a short note shows where that number appears in the Bible.</span></div></div>' +
      '<div class="panel"><h2>Display</h2>' +
      '<div class="field"><span class="lab">Colours</span>' + seg('theme', settings.theme, [['light', 'Daylight'], ['dark', 'Evening']]) + '</div>' +
      '<div class="field"><span class="lab">Text size</span>' + seg('size', settings.size, [['normal', 'Normal'], ['large', 'Large'], ['xlarge', 'Extra large']]) + '</div></div>' +
      '<div class="panel"><h2>Reset</h2><p class="help" style="margin-top:0">These affect only ' + esc(profileName()) + '. Other players are not changed.</p>' +
      '<div class="btnrow"><button class="btn" id="resetGame">Reset the entire game</button><button class="btn" id="resetHl">Delete all highlights</button><button class="btn" id="players">' + I.user + '<span>Manage players</span></button></div></div>' +
      '<div class="panel"><h2>About</h2><p>Give Me the Bible Sudoku 1.0. Scripture: King James Version, the 66 books of the Old and New Testaments. Fonts: Atkinson Hyperlegible and EB Garamond (SIL Open Font License).</p></div>' +
      '</div></div>';
    wireBar(back);
    screen.querySelectorAll('.seg[data-key]').forEach((sg) => (sg.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const k = sg.dataset.key; let v = b.dataset.v;
      if (v === 'true') v = true; else if (v === 'false') v = false;
      sg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      settings[k] = v; saveSettings(); applyLook();
    }));
    $('#resetGame').onclick = () => confirmBox('Reset the entire game?', 'This erases every saved puzzle, your completed record and your random-puzzle count for ' + profileName() + '. Highlights and settings are kept.', 'Reset game', () => { store.set('saves', {}); store.set('done', []); store.set('randomCount', 0); toast('Game reset. Every puzzle is new again.'); });
    $('#resetHl').onclick = () => confirmBox('Delete all highlights?', 'Every highlighted verse and folder for ' + profileName() + ' will be removed.', 'Delete highlights', () => { store.set('hl', { folders: [], items: [] }); toast('Highlights deleted'); });
    $('#players').onclick = () => go('profiles');
  };

  // ---------- highlights ----------
  // The 10 highlighter colours for Bible verses.
  const HL_COLORS = [['yellow', 'Yellow', [255, 226, 102]], ['green', 'Green', [140, 214, 140]], ['blue', 'Blue', [140, 186, 240]], ['pink', 'Pink', [244, 164, 196]], ['orange', 'Orange', [255, 178, 102]],
    ['purple', 'Purple', [190, 160, 235]], ['teal', 'Teal', [110, 210, 200]], ['red', 'Red', [240, 130, 120]], ['lavender', 'Lavender', [215, 200, 245]], ['gray', 'Gray', [190, 192, 198]]];
  const rgbOf = (c) => (HL_COLORS.find((x) => x[0] === c) || HL_COLORS[0])[2];
  const colorName = (c) => (HL_COLORS.find((x) => x[0] === c) || [c, c])[1];
  function hlData() { const d = store.get('hl', null) || { folders: [], items: [] }; return d; }
  function hlSave(d) { store.set('hl', d); }
  function hlColorOf(d) { const m = {}; d.items.forEach((it) => { if (!m[it.v] || m[it.v].t < it.t) m[it.v] = it; }); return m; }

  // ---------- Bible reader ----------
  VIEWS.bible = function (args) {
    const stop = busy('Opening the Bible…');
    loadKJV().then(() => { stop(); renderBible(args); }).catch(() => { stop(); toast('The Bible text could not be loaded.'); });
  };
  let selected = new Set();
  function renderBible(args) {
    const pos = Object.assign({ b: 0, c: 1, hl: null }, store.get('readerPos', {}), args);
    const fromPuzzle = !!args.fromPuzzle;
    const nCh = window.KJV[pos.b].length;
    selected = new Set();
    screen.innerHTML = bar('Holy Bible', 'King James Version', { back: true, extra: (fromPuzzle ? '<button class="btn" data-act="topuzzle">' + I.back + '<span class="lbl">Back to puzzle</span></button>' : '') + '<button class="btn" data-act="hls">' + I.marker + '<span class="lbl">My highlights</span></button>' }) +
      '<div class="reader-tools"><select id="rb" aria-label="Book"><optgroup label="Old Testament">' + BOOKS.slice(0, 39).map((n, i) => '<option value="' + i + '">' + n + '</option>').join('') +
      '</optgroup><optgroup label="New Testament">' + BOOKS.slice(39).map((n, i) => '<option value="' + (i + 39) + '">' + n + '</option>').join('') + '</optgroup></select>' +
      '<select id="rc" aria-label="Chapter">' + Array.from({ length: nCh }, (_, i) => '<option value="' + (i + 1) + '">Chapter ' + (i + 1) + '</option>').join('') + '</select>' +
      '<input class="grow" type="search" id="rs" placeholder="Search the Bible (e.g. still waters)" aria-label="Search the Bible"></div>' +
      '<div class="scroll" id="rbody"></div><div class="selbar" id="selbar" hidden></div>';
    wireBar(back);
    const tp = screen.querySelector('[data-act="topuzzle"]'); if (tp) tp.onclick = back;
    screen.querySelector('[data-act="hls"]').onclick = () => go('highlights');
    $('#rb').value = pos.b; $('#rc').value = pos.c;
    $('#rb').onchange = (e) => { current.args = { b: +e.target.value, c: 1, fromPuzzle }; renderBible(current.args); };
    $('#rc').onchange = (e) => { current.args = { b: pos.b, c: +e.target.value, fromPuzzle }; renderBible(current.args); };
    $('#rs').onkeydown = (e) => { if (e.key === 'Enter') searchBible(e.target.value, fromPuzzle); };
    store.set('readerPos', { b: pos.b, c: pos.c });
    const verses = window.KJV[pos.b][pos.c - 1];
    const base = bible.id(pos.b, pos.c, 1);
    const colors = hlColorOf(hlData());
    const body = $('#rbody');
    body.innerHTML = '<article class="chapter"><h2>' + BOOKS[pos.b] + ' ' + pos.c + '</h2><p class="help reader-help">Tap verses to select them, then highlight and save them to a folder.</p>' +
      verses.map((t, i) => { const id = base + i; const col = colors[id]; return '<p class="v' + (pos.hl && i + 1 >= pos.hl[0] && i + 1 <= pos.hl[1] ? ' hl' : '') + (col ? ' mark-' + col.c : '') + '" id="v' + (i + 1) + '" data-id="' + id + '"><sup>' + (i + 1) + '</sup>' + esc(t) + '</p>'; }).join('') +
      '<div class="chapter-nav"><button class="btn" id="pc">' + I.prev + '<span>Previous chapter</span></button><button class="btn" id="nc"><span>Next chapter</span>' + I.next + '</button></div></article>';
    body.onclick = (e) => {
      const p = e.target.closest('p.v'); if (!p) return;
      const id = +p.dataset.id;
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      p.classList.toggle('sel', selected.has(id));
      updateSelBar();
    };
    const step = (d) => {
      let b = pos.b, c = pos.c + d;
      if (c < 1) { b--; if (b < 0) return; c = window.KJV[b].length; }
      if (c > window.KJV[b].length) { b++; if (b >= 66) return; c = 1; }
      current.args = { b, c, fromPuzzle }; renderBible(current.args);
    };
    $('#pc').onclick = () => step(-1); $('#nc').onclick = () => step(1);
    if (pos.hl) { const el = $('#v' + pos.hl[0]); if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 30); } else body.scrollTop = 0;
  }
  function updateSelBar() {
    const sb = $('#selbar'); if (!sb) return;
    if (!selected.size) { sb.hidden = true; return; }
    const colors = hlColorOf(hlData()); const anyMarked = Array.from(selected).some((id) => colors[id]);
    sb.hidden = false;
    sb.innerHTML = '<span><b>' + plural(selected.size, 'verse') + '</b> selected</span>' +
      '<button class="btn primary" id="hlsave">' + I.marker + '<span>Highlight and save</span></button>' +
      (anyMarked ? '<button class="btn" id="hlrem">Remove highlight</button>' : '') +
      '<button class="btn" id="hlcancel">Cancel</button>';
    $('#hlsave').onclick = () => highlightDialog(Array.from(selected), () => { const a = current.args; renderBible(Object.assign({}, a, { hl: null })); });
    const rm = $('#hlrem'); if (rm) rm.onclick = () => { const d = hlData(); d.items = d.items.filter((it) => !selected.has(it.v)); hlSave(d); toast('Highlight removed'); renderBible(Object.assign({}, current.args, { hl: null })); };
    $('#hlcancel').onclick = () => { selected.clear(); document.querySelectorAll('p.v.sel').forEach((p) => p.classList.remove('sel')); updateSelBar(); };
  }
  function highlightDialog(ids, done) {
    const d = hlData();
    const last = store.get('hlLast', { c: 'yellow', f: d.folders.length ? d.folders[0].id : '' });
    modal('<h2>Highlight ' + plural(ids.length, 'verse') + '</h2>' +
      '<div class="field"><span class="lab">Colour</span><div class="seg swatches" id="hlc">' + HL_COLORS.map((c) => '<button data-v="' + c[0] + '" aria-pressed="' + (c[0] === last.c) + '"><i class="chip-' + c[0] + '"></i>' + c[1] + '</button>').join('') + '</div></div>' +
      '<div class="field"><label for="hlf">Save in folder</label><select id="hlf">' + d.folders.map((f) => '<option value="' + f.id + '">' + esc(f.name) + '</option>').join('') + '<option value="__new">New folder…</option></select></div>' +
      '<div class="field" id="newf" hidden><label for="hln">New folder name</label><input type="text" id="hln" maxlength="40" placeholder="e.g. Promises of God"></div>' +
      '<div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>Save highlight</button></div>',
    (sc, close) => {
      let color = last.c;
      const fsel = sc.querySelector('#hlf'); fsel.value = d.folders.some((f) => f.id === last.f) ? last.f : (d.folders.length ? d.folders[0].id : '__new');
      const showNew = () => { sc.querySelector('#newf').hidden = fsel.value !== '__new'; if (fsel.value === '__new') sc.querySelector('#hln').focus(); };
      showNew(); fsel.onchange = showNew;
      sc.querySelector('#hlc').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; color = b.dataset.v; sc.querySelectorAll('#hlc button').forEach((x) => x.setAttribute('aria-pressed', x === b)); };
      sc.querySelector('[data-ok]').onclick = () => {
        let fid = fsel.value;
        if (fid === '__new') {
          const name = sc.querySelector('#hln').value.trim(); if (!name) { sc.querySelector('#hln').focus(); return; }
          fid = 'f' + Date.now().toString(36); d.folders.push({ id: fid, name, created: Date.now() });
        }
        const t = Date.now();
        ids.forEach((v) => {
          const ex = d.items.find((it) => it.v === v && it.f === fid);
          if (ex) { ex.c = color; ex.t = t; } else d.items.push({ v, f: fid, c: color, t });
        });
        hlSave(d); store.set('hlLast', { c: color, f: fid });
        close(); toast(plural(ids.length, 'verse') + ' saved to “' + d.folders.find((f) => f.id === fid).name + '”'); done();
      };
    });
  }
  function searchBible(q, fromPuzzle) {
    q = q.trim(); if (q.length < 2) return;
    const words = q.toLowerCase().split(/\s+/);
    const res = [];
    for (let i = 0; i < bible.N && res.length < 300; i++) {
      const t = bible.text[i].toLowerCase();
      if (words.every((w) => t.indexOf(w) >= 0)) res.push(i);
    }
    const body = $('#rbody'); selected.clear(); updateSelBar();
    body.onclick = null;
    body.innerHTML = '<div class="results"><p><b>' + res.length + (res.length >= 300 ? '+' : '') + '</b> ' + (res.length === 1 ? 'verse contains' : 'verses contain') + ' “' + esc(q) + '”.</p>' +
      res.map((id) => '<button class="result" data-id="' + id + '"><b>' + vref(id) + '</b><br><span>' + esc(bible.text[id]) + '</span></button>').join('') + '</div>';
    body.scrollTop = 0;
    body.querySelectorAll('[data-id]').forEach((b) => (b.onclick = () => {
      const id = +b.dataset.id; current.args = { b: bible.vb[id], c: bible.vc[id], hl: [bible.vv[id], bible.vv[id]], fromPuzzle }; renderBible(current.args);
    }));
  }

  // ----- highlights screens -----
  VIEWS.highlights = function () {
    loadKJV().then(() => {
      const d = hlData();
      const count = (fid) => d.items.filter((it) => it.f === fid).length;
      screen.innerHTML = bar('My highlights', plural(d.items.length, 'highlighted verse'), { back: true }) +
        '<div class="scroll"><div class="wrap" style="max-width:820px">' +
        (d.folders.length ? '<div class="plist">' + d.folders.map((f) =>
          '<button class="pitem" data-f="' + f.id + '"><span class="pnum">' + I.marker + '</span><span><b>' + esc(f.name) + '</b><span class="d">' + plural(count(f.id), 'verse') + '</span></span><span class="pstat">Open</span></button>').join('') + '</div>' +
          '<div class="btnrow" style="margin-top:16px"><button class="btn primary" id="allpz">Make a Word Sudoku from my highlights</button><button class="btn" id="exportall">' + I.save + '<span>Export highlights</span></button><button class="btn" id="newfold">' + I.plus + '<span>New folder</span></button></div>'
          : '<p class="empty">You have no highlights yet. Open the Bible, tap one or more verses, then choose “Highlight and save” to keep them in a folder.</p><div class="btnrow"><button class="btn primary" id="openb">' + I.book + '<span>Open the Bible</span></button><button class="btn" id="newfold">' + I.plus + '<span>New folder</span></button></div>') +
        '</div></div>';
      wireBar(back);
      screen.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => go('folder', { f: b.dataset.f })));
      const nf = $('#newfold'); if (nf) nf.onclick = () => promptBox('New folder', 'Folder name', '', 'Create folder', (name) => { const dd = hlData(); dd.folders.push({ id: 'f' + Date.now().toString(36), name, created: Date.now() }); hlSave(dd); VIEWS.highlights(); });
      const ob = $('#openb'); if (ob) ob.onclick = () => go('bible');
      const ap = $('#allpz'); if (ap) ap.onclick = () => makeHighlightPuzzle(Array.from(new Set(d.items.map((it) => it.v))), 'All my highlights');
      const ex = $('#exportall'); if (ex) ex.onclick = () => exportDialog(null);
    });
  };
  VIEWS.folder = function (args) {
    loadKJV().then(() => {
      const d = hlData(); const f = d.folders.find((x) => x.id === args.f);
      if (!f) { back(); return; }
      const items = d.items.filter((it) => it.f === f.id).sort((a, b) => a.v - b.v);
      screen.innerHTML = bar(f.name, plural(items.length, 'highlighted verse'), { back: true, extra: '<button class="btn icon" id="fmenu" aria-label="Folder options">' + I.more + '</button>' }) +
        '<div class="scroll"><div class="wrap" style="max-width:820px">' +
        (items.length ? '<div class="btnrow" style="margin-bottom:14px"><button class="btn primary" id="mkpz">Make a Word Sudoku from these verses</button><button class="btn" id="exportf">' + I.save + '<span>Export this folder</span></button></div>' +
          items.map((it) => '<div class="hlv mark-' + it.c + '"><div class="hlv-top"><button class="ref" data-open="' + it.v + '">' + vref(it.v) + '</button><span class="row-actions"><button class="btn quiet colorbtn" data-col="' + it.v + '" aria-label="Change colour"><i class="chip-' + it.c + '"></i>' + colorName(it.c) + '</button><button class="btn icon quiet" data-rm="' + it.v + '" aria-label="Remove from folder">' + I.close + '</button></span></div><p class="scripture">' + esc(bible.text[it.v]) + '</p></div>').join('')
          : '<p class="empty">This folder is empty. Highlight verses in the Bible and choose this folder to add them.</p><button class="btn primary" id="openb">' + I.book + '<span>Open the Bible</span></button>') +
        '</div></div>';
      wireBar(back);
      const ob = $('#openb'); if (ob) ob.onclick = () => go('bible');
      screen.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => { const id = +b.dataset.open; go('bible', { b: bible.vb[id], c: bible.vc[id], hl: [bible.vv[id], bible.vv[id]] }); }));
      screen.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => { const dd = hlData(); dd.items = dd.items.filter((it) => !(it.f === f.id && it.v === +b.dataset.rm)); hlSave(dd); VIEWS.folder(args); }));
      const mk = $('#mkpz'); if (mk) mk.onclick = () => makeHighlightPuzzle(items.map((it) => it.v), f.name);
      const exf = $('#exportf'); if (exf) exf.onclick = () => exportDialog(f.id);
      screen.querySelectorAll('[data-col]').forEach((b) => (b.onclick = () => menu(b, HL_COLORS.map((c) => [c[1], () => {
        const dd = hlData(); const it = dd.items.find((x) => x.f === f.id && x.v === +b.dataset.col); if (it) { it.c = c[0]; it.t = Date.now(); hlSave(dd); } VIEWS.folder(args);
      }]))));
      $('#fmenu').onclick = (e) => menu(e.currentTarget, [
        ['Rename folder', () => promptBox('Rename folder', 'Folder name', f.name, 'Save', (name) => { const dd = hlData(); dd.folders.find((x) => x.id === f.id).name = name; hlSave(dd); VIEWS.folder(args); })],
        ['Delete folder', () => confirmBox('Delete “' + f.name + '”?', 'The folder and its highlights will be removed.', 'Delete folder', () => { const dd = hlData(); dd.folders = dd.folders.filter((x) => x.id !== f.id); dd.items = dd.items.filter((it) => it.f !== f.id); hlSave(dd); back(); })]
      ]);
    });
  };
  // ----- exporting highlights -----
  function exportDialog(folderId) {
    const d = hlData();
    const folders = folderId ? d.folders.filter((f) => f.id === folderId) : d.folders;
    const count = d.items.filter((it) => folders.some((f) => f.id === it.f)).length;
    const canShare = !!((window.Android && window.Android.shareText) || window.iOS);
    modal('<h2>Export highlights</h2><p>' + plural(count, 'verse') + ' from ' + (folderId ? '\u201C' + esc(folders[0].name) + '\u201D' : plural(folders.length, 'folder')) + '.</p>' +
      '<div class="field"><span class="lab">Format</span><div class="seg" id="exfmt"><button data-v="txt" aria-pressed="true">Text document (.txt)</button><button data-v="csv" aria-pressed="false">Spreadsheet (.csv)</button></div>' +
      '<span class="help">Text is easy to read, print or paste into notes. The spreadsheet opens in Excel, Google Sheets or Numbers.</span></div>' +
      '<div class="actions"><button class="btn" data-close>Cancel</button><button class="btn" id="excopy">Copy to clipboard</button>' + (canShare ? '<button class="btn" id="exshare">Share\u2026</button>' : '') + '<button class="btn primary" id="exsave">' + I.save + 'Save file</button></div>',
    (sc, close) => {
      let fmt = 'txt';
      sc.querySelector('#exfmt').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; fmt = b.dataset.v; sc.querySelectorAll('#exfmt button').forEach((x) => x.setAttribute('aria-pressed', x === b)); };
      const build = () => buildExport(folders, fmt);
      const fname = () => 'Bible-highlights' + (folderId ? '-' + folders[0].name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') : '') + '.' + fmt;
      sc.querySelector('#exsave').onclick = () => { saveTextFile(fname(), build(), fmt === 'csv' ? 'text/csv' : 'text/plain'); close(); };
      sc.querySelector('#excopy').onclick = () => { copyText(build()); close(); };
      const sh = sc.querySelector('#exshare'); if (sh) sh.onclick = () => { (window.iOS || window.Android).shareText(folderId ? folders[0].name : 'My Bible highlights', build()); close(); };
    });
  }
  function buildExport(folders, fmt) {
    const d = hlData();
    if (fmt === 'csv') {
      const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
      const rows = [['Folder', 'Reference', 'Book', 'Chapter', 'Verse', 'Colour', 'Highlighted on', 'Text']];
      folders.forEach((f) => d.items.filter((it) => it.f === f.id).sort((a, b) => a.v - b.v).forEach((it) => rows.push([f.name, vref(it.v), BOOKS[bible.vb[it.v]], bible.vc[it.v], bible.vv[it.v], colorName(it.c), new Date(it.t).toISOString().slice(0, 10), bible.text[it.v]])));
      return '\ufeff' + rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n';
    }
    let out = 'My Bible Highlights \u2013 King James Version\r\n' + profileName() + ' \u2013 exported ' + fmtDate(Date.now()) + '\r\n';
    folders.forEach((f) => {
      const items = d.items.filter((it) => it.f === f.id).sort((a, b) => a.v - b.v);
      out += '\r\n' + f.name.toUpperCase() + ' (' + plural(items.length, 'verse') + ')\r\n' + '-'.repeat(Math.min(60, f.name.length + 12)) + '\r\n';
      items.forEach((it) => { out += '\r\n' + vref(it.v) + '  [' + colorName(it.c) + ']\r\n' + bible.text[it.v] + '\r\n'; });
    });
    return out;
  }
  function saveTextFile(name, text, mime) {
    if (window.desktop && window.desktop.saveFile) {
      window.desktop.saveFile(name, text).then((p) => { if (p) toast('Saved to ' + p); }).catch(() => toast('The file could not be saved.'));
    } else if (window.Android && window.Android.saveText) {
      window.Android.saveText(name, mime, text); // opens Android's "save to" picker
    } else if (window.iOS) {
      window.iOS.saveText(name, mime, text); // opens the iOS "Save to Files" picker
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Downloaded ' + name);
    }
  }
  function copyText(text) {
    const fallback = () => { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } t.remove(); toast(ok ? 'Copied to the clipboard' : 'Copying is not available here.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('Copied to the clipboard'), fallback); else fallback();
  }
  window.onAndroidSaved = function (ok) { toast(ok ? 'Highlights saved' : 'The file was not saved.'); };


  // ---------- making puzzles ----------
  // Word lists for Word Sudoku (letters all different): SD_WORDS[len] = [[WORD, book, chapter, verse, themeId], ...]
  const WORDS = window.SD_WORDS || { 6: [], 8: [], 9: [] };
  let worker = null;
  function generateAsync(opts) {
    return new Promise((res, rej) => {
      const local = () => setTimeout(() => { try { res(E.generate(opts)); } catch (e) { rej(e); } }, 30);
      try {
        if (!worker) worker = new Worker('js/sdworker.js');
        const w = worker; let doneFlag = false;
        const to = setTimeout(() => { if (!doneFlag) { doneFlag = true; try { w.terminate(); } catch (e) { /* ignore */ } worker = null; local(); } }, 60000);
        w.onmessage = (e) => { if (doneFlag) return; doneFlag = true; clearTimeout(to); res(e.data); };
        w.onerror = (e) => { if (doneFlag) return; doneFlag = true; clearTimeout(to); e.preventDefault && e.preventDefault(); worker = null; local(); };
        w.postMessage(opts);
      } catch (e) { worker = null; local(); }
    });
  }
  function keyVerseOf(theme) {
    const p = (SDP.classic || []).find((x) => x.t === theme.id); return p ? p.v : [18, 119, 105];
  }
  function makeRandom(o) {
    const n0 = store.get('randomCount', 0) + 1;
    let theme, word = null;
    if (o.type === 'word') {
      let pool = WORDS[o.wlen] || [];
      if (o.src !== 'any') { const f = pool.filter((w) => String(w[4]) === String(o.src)); if (f.length) pool = f; else toast('That theme has no ' + o.wlen + '-letter word, so here is one from another theme.'); }
      word = pool[Math.floor(Math.random() * pool.length)];
      theme = themeOf(word[4]);
    } else theme = o.theme && o.theme !== 'any' ? themeOf(+o.theme) : SDT[Math.floor(Math.random() * SDT.length)];
    const stop = busy('Making your ' + TYPES[o.type].name + ' puzzle…');
    const n = o.type === 'word' ? word[0].length : 0;
    generateAsync({ type: o.type, n: n || undefined, level: LEVELS[o.level].n, timeBudget: o.type === 'killer' ? 25000 : 12000 }).then((res) => {
      stop();
      if (!res) { toast('That puzzle could not be made. Please try again.'); return; }
      store.set('randomCount', n0);
      const p = { key: 'r' + Date.now().toString(36), type: o.type, n: res.n, lv: LEVELS[o.level].n, g: res.givens, s: res.solution, r: res.regions || undefined, k: res.cages || undefined, t: theme.id, v: keyVerseOf(theme) };
      if (word) { p.w = word[0]; p.wv = [word[1], word[2], word[3]]; p.wr = Math.floor(Math.random() * p.n); }
      const puz = normalize(p, { title: 'Random: ' + theme.title, sub: 'Random puzzle no. ' + n0 + ' – ' + TYPES[o.type].name + ' – ' + LEVELS[lvKey(p.lv)].name, random: true });
      if (res.nearMiss) toast('This one came out a little easier than ' + LEVELS[o.level].name + '.', true);
      go('puzzle', { puz });
    }).catch((e) => { stop(); toast('Could not make a puzzle: ' + e.message); });
  }
  // Word Sudoku from highlighted verses: the longest suitable word with all-different letters.
  function makeHighlightPuzzle(ids, name) {
    if (ids.length < 1) { toast('Highlight a verse or two first.'); return; }
    loadKJV().then(() => {
      const found = {};
      ids.forEach((id) => (bible.text[id].toUpperCase().match(/[A-Z]+/g) || []).forEach((w) => {
        if ((w.length === 6 || w.length === 8 || w.length === 9) && new Set(w).size === w.length && !CWEngine.STOP.has(w.toLowerCase()) && !found[w]) found[w] = id;
      }));
      const list = Object.keys(found);
      if (!list.length) { toast('These verses have no word with 6, 8 or 9 different letters. Add a few more verses.', true); return; }
      const choose = (w) => {
        const id = found[w]; const n = w.length;
        const stop = busy('Making a Word Sudoku from “' + w + '”…');
        generateAsync({ type: 'word', n, level: n === 6 ? 2 : 2, timeBudget: 12000 }).then((res) => {
          stop(); if (!res) { toast('That puzzle could not be made. Please try again.'); return; }
          const p = { key: 'r' + Date.now().toString(36), type: 'word', n, lv: res.grade > 4 ? 2 : Math.max(1, res.level), g: res.givens, s: res.solution, w, wv: [bible.vb[id], bible.vc[id], bible.vv[id]], wr: Math.floor(Math.random() * n), v: [bible.vb[ids[0]], bible.vc[ids[0]], bible.vv[ids[0]]] };
          go('puzzle', { puz: normalize(p, { title: 'Highlights: ' + name, sub: 'Word Sudoku from your highlights – ' + w.length + ' letters', random: true }) });
        });
      };
      list.sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
      modal('<h2>Make a Word Sudoku</h2><p>Choose a word from your highlighted verses. Its letters fill the grid, and one row spells the word.</p>' +
        '<div class="seg" id="hw" style="max-height:40vh;overflow:auto">' + list.slice(0, 40).map((w) => '<button data-w="' + w + '">' + w + ' <small>' + w.length + '</small></button>').join('') + '</div>' +
        '<div class="actions"><button class="btn" data-close>Cancel</button></div>',
      (sc, close) => { sc.querySelector('#hw').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; close(); choose(b.dataset.w); }; });
    });
  }

  // ---------- Numbers in Scripture: [note, verse] for each number ----------
  const NUMS = {
    1: ['One: there is one God.', [4, 6, 4]],
    2: ['Two: the animals went into the ark two by two.', [0, 7, 9]],
    3: ['Three: Jesus rose again the third day.', [45, 15, 4]],
    4: ['Four: the river of Eden parted into four heads.', [0, 2, 10]],
    5: ['Five: five loaves fed the five thousand.', [39, 14, 17]],
    6: ['Six: six days of labour.', [1, 20, 9]],
    7: ['Seven: God rested on the seventh day.', [0, 2, 2]],
    8: ['Eight: eight souls were saved in the ark.', [59, 3, 20]],
    9: ['Nine: of the ten lepers cleansed, nine did not return to give thanks.', [41, 17, 17]]
  };

  // ---------- puzzle objects ----------
  function normalize(p, extra) {
    const th = p.t ? themeOf(p.t) : null;
    const puz = Object.assign({
      key: p.key, type: p.type, n: p.n, level: lvKey(p.lv), lv: p.lv, g: p.g, s: p.s, r: p.r, k: p.k, w: p.w, wr: p.wr, wv: p.wv, v: p.v, t: p.t,
      title: th ? th.title : 'Sudoku', sub: '', passages: th ? th.passages : []
    }, extra || {});
    return puz;
  }
  function puzzleFromPremade(type, id) {
    const p = (SDP[type] || []).find((x) => x.id === id); if (!p) return null;
    return normalize(Object.assign({ key: premadeKey(type, id), type }, p), { sub: TYPES[type].name + ' ' + id + ' of 200 – ' + LEVELS[lvKey(p.lv)].name });
  }
  function validSave(puz, s) { return s && typeof s.v === 'string' && s.sig === sig(puz) && s.v.length === puz.n * puz.n; }
  function openPremade(type, id) {
    const puz = puzzleFromPremade(type, id); if (!puz) return;
    let s = saves()[puz.key];
    if (s && !validSave(puz, s)) { dropSave(puz.key); s = null; }
    const isDone = records().some((r) => r.key === puz.key && !r.auto);
    if (isDone && !s) {
      modal('<h2>' + esc(puz.title) + '</h2><p>You have solved this ' + esc(TYPES[type].name) + ' puzzle. Would you like to solve it again?</p><div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>Solve again</button></div>',
        (sc, close) => { sc.querySelector('[data-ok]').onclick = () => { close(); go('puzzle', { puz }); }; });
      return;
    }
    go('puzzle', { puz, save: s });
  }
  function openSave(key) {
    const s = saves()[key]; if (!s) return;
    const m = /^([a-z]+)-(\d+)$/.exec(key);
    const puz = m ? puzzleFromPremade(m[1], +m[2]) : s.puz;
    if (!puz || !validSave(puz, s)) { dropSave(key); toast('That puzzle was updated, so it starts fresh.'); if (puz) go('puzzle', { puz }); return; }
    go('puzzle', { puz, save: s });
  }

  // ---------- board drawing (shared by the game and printing) ----------
  const NOTE_COLS = { 4: 2, 6: 3, 8: 4, 9: 3 };
  function symbolsFor(puz) {
    const sym = ['']; for (let d = 1; d <= puz.n; d++) sym.push(String(d));
    if (puz.w) { for (let c = 0; c < puz.n; c++) sym[+puz.s[puz.wr * puz.n + c]] = puz.w[c]; }
    return sym;
  }
  function layoutFor(puz) {
    const cages = puz.k || null;
    return new E.Layout(puz.type === 'word' ? 'classic' : puz.type, puz.n, puz.r || null, cages);
  }
  // SVG with all the lines: thin grid lines, thick box/shape borders, dotted killer cages.
  function linesSvg(puz, L) {
    const n = puz.n; let thin = '', thick = '', cage = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      if (c < n - 1) { const seg = 'M' + (c + 1) + ' ' + r + 'V' + (r + 1); if (L.regionOf[i] !== L.regionOf[i + 1]) thick += seg; else thin += seg; }
      if (r < n - 1) { const seg = 'M' + c + ' ' + (r + 1) + 'H' + (c + 1); if (L.regionOf[i] !== L.regionOf[i + n]) thick += seg; else thin += seg; }
    }
    if (L.cages.length) {
      const d = 0.09, cg = (i) => (i < 0 ? -2 : L.cageOf[i]);
      const at = (r, c) => (r < 0 || c < 0 || r >= n || c >= n ? -2 : L.cageOf[r * n + c]);
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const k = at(r, c); void cg;
        const same = (dr, dc) => at(r + dr, c + dc) === k;
        // top edge
        if (!same(-1, 0)) cage += 'M' + (c + (same(0, -1) && !same(-1, -1) ? -d : d)) + ' ' + (r + d) + 'H' + (c + 1 + (same(0, 1) && !same(-1, 1) ? d : -d));
        if (!same(1, 0)) cage += 'M' + (c + (same(0, -1) && !same(1, -1) ? -d : d)) + ' ' + (r + 1 - d) + 'H' + (c + 1 + (same(0, 1) && !same(1, 1) ? d : -d));
        if (!same(0, -1)) cage += 'M' + (c + d) + ' ' + (r + (same(-1, 0) && !same(-1, -1) ? -d : d)) + 'V' + (r + 1 + (same(1, 0) && !same(1, -1) ? d : -d));
        if (!same(0, 1)) cage += 'M' + (c + 1 - d) + ' ' + (r + (same(-1, 0) && !same(-1, 1) ? -d : d)) + 'V' + (r + 1 + (same(1, 0) && !same(1, 1) ? d : -d));
      }
    }
    return '<svg class="blines" viewBox="0 0 ' + n + ' ' + n + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="thin" d="' + thin + '"/>' + (cage ? '<path class="cage" d="' + cage + '"/>' : '') + '<path class="thick" d="' + thick + '"/>' +
      '<rect class="outer" x="0" y="0" width="' + n + '" height="' + n + '"/></svg>';
  }
  function cageLabels(L) {
    const lab = {}; L.cages.forEach((cg) => { lab[cg.cells[0]] = cg.sum; }); return lab; // first cell = top-left (cells are sorted)
  }

  // ---------- printing ----------
  function printPuzzle(puz, withAnswers) {
    let root = document.getElementById('print-root');
    if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.appendChild(root); }
    const L = layoutFor(puz), sym = symbolsFor(puz), n = puz.n, lab = cageLabels(L);
    let cells = '';
    for (let i = 0; i < n * n; i++) {
      const g = puz.g[i] !== '.'; const d = withAnswers ? +puz.s[i] : g ? +puz.g[i] : 0;
      cells += '<div class="c' + (L.extra[i] ? ' xt' : '') + (puz.w && Math.floor(i / n) === puz.wr ? ' wrow' : '') + (g ? ' given' : ' user') + '">' + (lab[i] ? '<span class="csum">' + lab[i] + '</span>' : '') + (d ? '<span class="v">' + sym[d] + '</span>' : '') + '</div>';
    }
    const v = puz.v ? '<p class="psub">' + esc(refStr(puz.v)) + (bible ? ' – “' + esc(window.KJV[puz.v[0]][puz.v[1] - 1][puz.v[2] - 1]) + '”' : '') + '</p>' : '';
    root.innerHTML = '<h1>' + esc(puz.title) + (withAnswers ? ' – Answer key' : '') + '</h1><p class="psub">Give Me the Bible Sudoku – ' + esc(TYPES[puz.type].name) + ' – ' + esc(LEVELS[puz.level].name) + '</p>' +
      '<p class="psub">' + esc(TYPES[puz.type].help) + (puz.w ? ' Letters: ' + sym.slice(1).slice().sort().join(' ') + '.' : '') + '</p>' +
      '<div class="sboard pboard' + (L.cages.length ? ' killer' : '') + '" style="--n:' + n + '"><div class="cells">' + cells + '</div>' + linesSvg(puz, L) + '</div>' + v;
    setTimeout(doPrint, 60);
  }

  // ---------- verse popup ----------
  function showVerseRef(ref, mark) {
    loadKJV().then(() => {
      const [b, c, v] = ref;
      let text = esc(window.KJV[b][c - 1][v - 1]);
      if (mark) text = text.replace(new RegExp('(^|[^A-Za-z])(' + mark + ')(?![A-Za-z])', 'gi'), (all, p1, w) => p1 + '<mark class="wmark">' + w + '</mark>');
      modal('<h2>' + esc(refStr(ref)) + '</h2><div class="scripture"><sup>' + v + '</sup>' + text + '</div>' +
        '<div class="actions"><button class="btn" data-close>Close</button><button class="btn primary" data-open>' + I.book + 'Open chapter</button></div>',
      (sc, close) => { sc.querySelector('[data-open]').onclick = () => { close(); if (game) game.persist(); go('bible', { b, c, hl: [v, v], fromPuzzle: !!game }); }; });
    }).catch(() => toast('The Bible text could not be loaded.'));
  }
  function openPassage(p) { loadKJV().then(() => { if (game) game.persist(); go('bible', { b: p[0], c: p[1], fromPuzzle: !!game }); }); }

  // ---------- the game ----------
  let game = null;
  VIEWS.puzzle = function (args) {
    if (game && game.puz.key === args.puz.key) { game.mount(); return; }
    if (game) game.stop();
    game = new Game(args.puz, args.save);
    game.mount();
  };

  function Game(puz, save) {
    this.puz = puz; const n = this.n = puz.n; this.N2 = n * n;
    this.L = layoutFor(puz); this.sym = symbolsFor(puz);
    this.sol = Int8Array.from(puz.s, (ch) => +ch);
    this.given = Uint8Array.from(puz.g, (ch) => (ch === '.' ? 0 : 1));
    this.mode = 'ans'; this.sel = -1; this.hint = null; this.flashBad = null;
    if (save) {
      this.vals = Int8Array.from(save.v, (ch) => (ch === '.' ? 0 : +ch));
      this.pen = Int32Array.from(save.p || new Array(this.N2).fill(0)); this.crs = Int32Array.from(save.x || new Array(this.N2).fill(0));
      this.secs = save.secs || 0; this.hints = save.hints || 0; this.mistakes = save.mistakes || 0; this.mode = save.mode || 'ans';
    } else this.reset();
    this.undoS = []; this.redoS = [];
    this.done = this.isSolved();
    this.timer = null;
  }
  Game.prototype.reset = function () {
    this.vals = Int8Array.from(this.puz.g, (ch) => (ch === '.' ? 0 : +ch));
    this.pen = new Int32Array(this.N2); this.crs = new Int32Array(this.N2);
    this.secs = 0; this.hints = 0; this.mistakes = 0; this.done = false; this.autoDone = false; this.hint = null; this.undoS = []; this.redoS = [];
  };
  Game.prototype.countOf = function (d) { let k = 0; for (let i = 0; i < this.N2; i++) if (this.vals[i] === d && this.sol[i] === d) k++; return k; };
  Game.prototype.isSolved = function () { for (let i = 0; i < this.N2; i++) if (this.vals[i] !== this.sol[i]) return false; return true; };
  Game.prototype.filled = function () { let k = 0, g = 0; for (let i = 0; i < this.N2; i++) { if (!this.given[i]) { g++; if (this.vals[i]) k++; } } return g ? k / g : 1; };

  Game.prototype.mount = function () {
    const p = this.puz, n = this.n;
    const pass = p.passages && p.passages.length ? '<div class="passages"><span class="lab">Theme passages</span> ' + p.passages.map((x, i) => '<button class="ref" data-pass="' + i + '">' + esc(passStr(x)) + '</button>').join(' ') + '</div>' : '';
    screen.innerHTML = bar(p.title, p.sub, {
      back: true,
      subHtml: (settings.timer ? '<span id="timer" aria-label="Time played" style="font-variant-numeric:tabular-nums">' + fmtTime(this.secs) + '</span><span class="hide-narrow"> – </span>' : '') + '<span class="hide-narrow">' + esc(p.sub) + '</span>',
      extra: '<button class="btn" data-act="hints" aria-haspopup="menu">' + I.hint + '<span class="lbl">Hints</span></button>' +
        '<button class="btn" data-act="more" aria-haspopup="menu" aria-label="Restart, auto-complete or print">' + I.more + '<span class="lbl">Puzzle</span></button>' +
        '<button class="btn" data-act="save" aria-label="Save for later">' + I.save + '<span class="lbl">Save for later</span></button>'
    }) +
      '<div class="sd">' +
      '<div class="sdwrap" id="bw"><div class="sboard' + (this.L.cages.length ? ' killer' : '') + (p.w ? ' wordsd' : '') + '" id="board" style="--n:' + n + '"><div class="cells" id="cells" role="grid" aria-label="Sudoku grid, ' + n + ' by ' + n + '"></div>' + linesSvg(p, this.L) + '</div></div>' +
      '<div class="sdside">' +
      '<div class="controls" id="controls">' +
      '<div class="modes" role="radiogroup" aria-label="What a tap does">' +
      '<button class="mode" role="radio" data-mode="ans">' + I.pen + '<span>Answer</span></button>' +
      '<button class="mode" role="radio" data-mode="pen">' + I.pencil + '<span>Pencil</span></button>' +
      '<button class="mode" role="radio" data-mode="crs">' + I.cross + '<span>Cross out</span></button></div>' +
      '<div class="tools"><button class="btn" id="erase" aria-label="Erase">' + I.erase + '<span>Erase</span></button><button class="btn" id="undo" aria-label="Undo">' + I.undo + '<span>Undo</span></button><button class="btn" id="redo" aria-label="Redo">' + I.redo + '<span>Redo</span></button></div>' +
      '<div class="pad n' + n + '" id="pad"></div>' +
      '<div class="hintbox" id="hintbox" hidden></div></div>' +
      '<div class="info" id="info">' +
      '<div class="rules"><b>' + esc(TYPES[p.type].name) + '</b> ' + lvBadge(p.level) + '<p>' + esc(TYPES[p.type].help) + ' <button class="ref" id="rulesbtn">How to play</button></p></div>' +
      '<div class="keyverse" id="kv"></div>' + pass +
      '</div></div></div>';
    wireBar(() => { this.persist(); back(); });
    $('[data-act="hints"]').onclick = (e) => this.hintMenu(e.currentTarget);
    $('[data-act="more"]').onclick = (e) => this.moreMenu(e.currentTarget);
    $('[data-act="save"]').onclick = () => { this.persist(true); toast('Saved. Find it under Saved puzzles.'); home(); };
    screen.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => this.setMode(b.dataset.mode)));
    $('#erase').onclick = () => this.erase(); $('#undo').onclick = () => this.undo(); $('#redo').onclick = () => this.redo();
    $('#pad').onclick = (e) => { const b = e.target.closest('[data-d]'); if (b) this.press(+b.dataset.d); };
    screen.querySelectorAll('[data-pass]').forEach((b) => (b.onclick = () => openPassage(p.passages[+b.dataset.pass])));
    $('#rulesbtn').onclick = () => rulesModal(p.type, false);
    $('#cells').addEventListener('pointerdown', (e) => { const c = e.target.closest('[data-i]'); if (!c) return; e.preventDefault(); this.select(+c.dataset.i); });
    this.renderVerse(); this.setMode(this.mode, true); this.render(); this.fit();
    this.start();
    if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = (e) => this.onKey(e);
    document.addEventListener('keydown', this.keyHandler);
    if (this.done) this.showDoneBanner();
    // The first time a player opens each kind of sudoku, show its rules.
    const seen = store.get('seenRules', {});
    if (!seen[p.type] && !this.done) { seen[p.type] = 1; store.set('seenRules', seen); setTimeout(() => rulesModal(p.type, true), 250); }
  };
  // ----- the key verse, uncovered a few words at a time as rows, columns and boxes are finished -----
  Game.prototype.renderVerse = function () {
    const p = this.puz; const kv = $('#kv'); if (!kv || !p.v) return;
    loadKJV().then(() => {
      if (!document.getElementById('kv')) return;
      if (!this.vtoks) {
        const t = window.KJV[p.v[0]][p.v[1] - 1][p.v[2] - 1];
        this.vtoks = t.split(/(\s+)/);
        const words = []; this.vtoks.forEach((w, i) => { if (/[A-Za-z]/.test(w)) words.push(i); });
        let h = 2166136261; for (const ch of p.key + p.g) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
        this.vorder = E.shuffle(words.slice(), E.RNG(h >>> 0)); this.vshown = -1;
      }
      this.drawVerse();
    }).catch(() => {});
  };
  Game.prototype.unitsDone = function () {
    let k = 0, t = 0;
    for (const u of this.L.units) {
      if (!/^(row|col|box|shape)$/.test(u.kind)) continue;
      t++; if (u.cells.every((c) => this.vals[c] === this.sol[c])) k++;
    }
    return [k, t];
  };
  Game.prototype.drawVerse = function () {
    const kv = $('#kv'); if (!kv || !this.vtoks) return;
    const p = this.puz, all = this.done || !settings.reveal;
    const [k, t] = this.unitsDone();
    const n = all ? this.vorder.length : Math.floor(this.vorder.length * k / t);
    const shown = new Set(this.vorder.slice(0, n)), fresh = new Set(this.vshown >= 0 && n > this.vshown ? this.vorder.slice(this.vshown, n) : []);
    this.vshown = n;
    const body = this.vtoks.map((w, i) => {
      if (!/[A-Za-z]/.test(w)) return esc(w);
      const m = /^([^A-Za-z]*)(.*?)([^A-Za-z]*)$/.exec(w);
      if (shown.has(i)) return esc(m[1]) + '<span class="vw' + (fresh.has(i) ? ' fresh' : '') + '">' + esc(m[2]) + '</span>' + esc(m[3]);
      return esc(m[1]) + '<span class="vb" style="--l:' + m[2].length + '" aria-label="hidden word"></span>' + esc(m[3]);
    }).join('');
    kv.innerHTML = '<span class="lab">Key verse' + (all ? '' : ' <span class="vcount">' + n + ' of ' + this.vorder.length + ' words</span>') + '</span>' +
      '<p class="scripture">“' + body + '”</p><button class="ref" id="kvref">' + esc(refStr(p.v)) + '</button>' +
      (!all ? '<p class="help wordnote">Each row, column and box you finish uncovers more of the verse.</p>' : '') +
      (p.w ? '<p class="help wordnote">' + (this.done ? 'The word was <b>' + esc(p.w) + '</b> – <button class="ref" id="wvref">' + esc(refStr(p.wv)) + '</button>' : 'The gold row spells a word from Scripture. Can you find it?') + '</p>' : '');
    $('#kvref').onclick = () => { if (all) showVerseRef(p.v); else confirmBox('Show the whole verse?', 'The verse uncovers itself as you solve. You can read it now in ' + refStr(p.v) + ' if you like.', 'Show the verse', () => showVerseRef(p.v)); };
    const wv = $('#wvref'); if (wv) wv.onclick = () => showVerseRef(p.wv, p.w);
  };
  // Size the board to the space available, keeping every square the same whole number of pixels.
  Game.prototype.fit = function () {
    const bw = $('#bw'), board = $('#board'); if (!bw || !board) return;
    const narrow = window.matchMedia('(max-width: 860px)').matches;
    let avail = Math.min(bw.clientWidth - (narrow ? 12 : 32), narrow ? Math.min(bw.clientWidth, window.innerHeight * 0.56) : bw.clientHeight - 32);
    const cell = Math.max(24, Math.floor(avail / this.n));
    board.style.width = board.style.height = (cell * this.n) + 'px';
    board.style.setProperty('--cs', cell + 'px');
  };
  Game.prototype.setMode = function (m, quiet) {
    this.mode = m;
    screen.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === m));
    const pad = $('#pad'); if (pad) pad.dataset.mode = m;
    if (!quiet) this.renderPad();
  };

  // ----- checking -----
  Game.prototype.wrongAt = function (i) { return !this.given[i] && this.vals[i] && this.vals[i] !== this.sol[i]; };
  Game.prototype.clashes = function () {
    const bad = new Uint8Array(this.N2), L = this.L, v = this.vals;
    for (let i = 0; i < this.N2; i++) if (v[i]) for (const p of L.peers[i]) if (v[p] === v[i]) { bad[i] = 1; break; }
    for (const cg of L.cages) { let s = 0, full = true; cg.cells.forEach((c) => { if (v[c]) s += v[c]; else full = false; }); if (s > cg.sum || (full && s !== cg.sum)) cg.cells.forEach((c) => { if (!this.given[c]) bad[c] = 1; }); }
    return bad;
  };

  // ----- drawing -----
  Game.prototype.render = function () {
    const cells = $('#cells'); if (!cells) return;
    const n = this.n, L = this.L, sym = this.sym, v = this.vals, sel = this.sel, lab = cageLabels(L);
    const peers = new Set(sel >= 0 && settings.peers ? L.peers[sel] : []);
    const sameD = sel >= 0 && settings.same ? v[sel] : 0;
    const clash = settings.mistakes === 'conflict' ? this.clashes() : null;
    const hint = this.hint, hU = new Set(hint ? hint.unitCells : []), hF = new Set(hint ? hint.cells : []), hE = {};
    if (hint && hint.elims) hint.elims.forEach(([c, m]) => (hE[c] = m));
    const cols = NOTE_COLS[n];
    let h = '';
    for (let i = 0; i < this.N2; i++) {
      const r = Math.floor(i / n);
      let cls = 'c';
      if (L.extra[i]) cls += ' xt';
      if (this.puz.w && r === this.puz.wr) cls += ' wrow';
      if (this.given[i]) cls += ' given'; else if (v[i]) cls += ' user';
      if (i === sel) cls += ' sel'; else if (peers.has(i)) cls += ' peer';
      if (sameD && v[i] === sameD && i !== sel) cls += ' same';
      if (v[i] && !this.given[i] && ((settings.mistakes === 'instant' && this.wrongAt(i)) || (clash && clash[i]) || (this.flashBad && this.flashBad.has(i)))) cls += ' bad';
      if (hU.has(i)) cls += ' hu'; if (hF.has(i)) cls += ' hf';
      let inner = lab[i] ? '<span class="csum">' + lab[i] + '</span>' : '';
      if (v[i]) inner += '<span class="v">' + sym[v[i]] + '</span>';
      else {
        const m = this.pen[i] | this.crs[i];
        if (m || hE[i]) {
          inner += '<span class="notes" style="--nc:' + cols + '">';
          for (let d = 1; d <= n; d++) {
            const b = 1 << (d - 1); const show = m & b;
            const x = this.crs[i] & b, he = hE[i] & b;
            inner += '<i class="' + (show ? '' : 'off') + (x ? ' x' : '') + (he ? ' he' : '') + (sameD === d && show && !x ? ' sn' : '') + '">' + (show || he ? sym[d] : '') + '</i>';
          }
          inner += '</span>';
        }
      }
      const label = 'Row ' + (r + 1) + ', column ' + (i % n + 1) + (v[i] ? ', ' + sym[v[i]] : ', empty') + (this.given[i] ? ', given' : '');
      h += '<div class="' + cls + '" data-i="' + i + '" role="gridcell" aria-label="' + label + '"' + (i === sel ? ' aria-selected="true"' : '') + '>' + inner + '</div>';
    }
    cells.innerHTML = h;
    this.renderPad();
    const u = $('#undo'), rd = $('#redo'); if (u) u.disabled = !this.undoS.length; if (rd) rd.disabled = !this.redoS.length;
  };
  Game.prototype.renderPad = function () {
    const pad = $('#pad'); if (!pad) return;
    const n = this.n, cnt = new Array(n + 1).fill(0);
    for (let i = 0; i < this.N2; i++) if (this.vals[i]) cnt[this.vals[i]]++;
    const sel = this.sel, mark = sel >= 0 && !this.vals[sel] ? (this.pen[sel] | this.crs[sel]) : 0;
    let h = '';
    for (let d = 1; d <= n; d++) {
      const b = 1 << (d - 1); const left = n - cnt[d];
      const on = this.mode !== 'ans' && (mark & b);
      const x = this.mode === 'crs' && sel >= 0 && (this.crs[sel] & b);
      h += '<button class="key' + (left <= 0 ? ' used' : '') + (on ? ' on' : '') + (x ? ' xon' : '') + '" data-d="' + d + '" aria-label="' + this.sym[d] + (left > 0 ? ', ' + left + ' left' : ', all placed') + '"><b>' + this.sym[d] + '</b><small>' + (left > 0 ? left : '✓') + '</small></button>';
    }
    pad.innerHTML = h;
  };

  // ----- entering -----
  Game.prototype.select = function (i) {
    this.sel = i; if (this.hint && !this.hint.keep) this.clearHint(); this.render();
  };
  // Record changes so they can be undone: [cell, old value, old pencil, old crossed]
  Game.prototype.change = function (list) {
    const before = list.map((i) => [i, this.vals[i], this.pen[i], this.crs[i]]);
    return () => { this.undoS.push(before.map((b) => b.concat([this.vals[b[0]], this.pen[b[0]], this.crs[b[0]]]))); if (this.undoS.length > 300) this.undoS.shift(); this.redoS = []; };
  };
  Game.prototype.press = function (d) {
    if (this.done) return;
    const i = this.sel;
    if (i < 0) { toast('Tap a square first.'); return; }
    if (this.given[i]) { toast('That number was given at the start.'); return; }
    const b = 1 << (d - 1); let note = 0;
    if (this.mode === 'ans') {
      if (this.vals[i] === d) { const fin = this.change([i]); this.vals[i] = 0; fin(); }
      else {
        const touched = [i]; if (settings.autoNotes) for (const p of this.L.peers[i]) if (!this.vals[p] && (this.pen[p] & b)) touched.push(p);
        const fin = this.change(touched);
        this.vals[i] = d;
        if (settings.autoNotes) touched.slice(1).forEach((p) => (this.pen[p] &= ~b));
        fin();
        if (d !== this.sol[i]) { this.mistakes++; if (settings.mistakes === 'instant') toast(this.sym[d] + ' doesn’t go there.'); }
        else if (this.countOf(d) === this.n && !this.isSolved()) { if (!this.puz.w && settings.numNotes && NUMS[d]) note = d; else toast('All the ' + this.sym[d] + 's are placed.'); }
      }
    } else {
      if (this.vals[i]) { toast('Erase the answer first to add pencil marks.'); return; }
      const fin = this.change([i]);
      if (this.mode === 'pen') { if (this.crs[i] & b) { this.crs[i] &= ~b; this.pen[i] |= b; } else this.pen[i] ^= b; }
      else { this.crs[i] ^= b; if (this.crs[i] & b) this.pen[i] |= b; }
      fin();
    }
    this.afterChange();
    if (note && !this.done) this.numberNote(note);
  };
  // A short note from Scripture when every square of a number is filled in.
  Game.prototype.numberNote = function (d) {
    const nn = NUMS[d]; const box = $('#hintbox'); if (!box) return;
    loadKJV().catch(() => {}).then(() => {
      if (!document.getElementById('hintbox') || this.done) return;
      this.hint = { cells: [], unitCells: [], keep: false, note: true };
      box.hidden = false; box.classList.add('numnote');
      box.innerHTML = '<div class="hb-top"><b><span class="nnum">' + d + '</span>All the ' + d + 's are placed</b><button class="btn icon quiet" id="hbx" aria-label="Close">' + I.close + '</button></div>' +
        '<p>' + esc(nn[0]) + '</p>' + (window.KJV ? '<p class="scripture nnv">“' + esc(window.KJV[nn[1][0]][nn[1][1] - 1][nn[1][2] - 1]) + '” <button class="ref" id="nnref">' + esc(refStr(nn[1])) + '</button></p>' : '');
      $('#hbx').onclick = () => { this.clearHint(); this.render(); };
      const r = $('#nnref'); if (r) r.onclick = () => showVerseRef(nn[1]);
    });
  };
  Game.prototype.erase = function () {
    const i = this.sel; if (i < 0 || this.done) return;
    if (this.given[i]) { toast('Given numbers can’t be erased.'); return; }
    if (!this.vals[i] && !this.pen[i] && !this.crs[i]) return;
    const fin = this.change([i]);
    if (this.vals[i]) this.vals[i] = 0; else { this.pen[i] = 0; this.crs[i] = 0; }
    fin(); this.afterChange();
  };
  Game.prototype.undo = function () {
    const s = this.undoS.pop(); if (!s || this.done) return;
    s.forEach(([i, v, p, x]) => { this.vals[i] = v; this.pen[i] = p; this.crs[i] = x; });
    this.redoS.push(s); this.sel = s[0][0]; this.afterChange(true);
  };
  Game.prototype.redo = function () {
    const s = this.redoS.pop(); if (!s || this.done) return;
    s.forEach((c) => { this.vals[c[0]] = c[4]; this.pen[c[0]] = c[5]; this.crs[c[0]] = c[6]; });
    this.undoS.push(s); this.sel = s[0][0]; this.afterChange(true);
  };
  Game.prototype.afterChange = function () {
    if (this.hint && !this.hint.keep) this.clearHint();
    this.render(); this.persist(); this.drawVerse();
    if (this.isSolved()) this.finish();
  };
  Game.prototype.onKey = function (e) {
    if (modalRoot.children.length || !document.getElementById('cells')) return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const n = this.n, k = e.key;
    if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) this.redo(); else this.undo(); return; }
    if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { e.preventDefault(); this.redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const mv = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[k];
    if (mv) {
      e.preventDefault(); const s = this.sel < 0 ? 0 : this.sel;
      const r = (Math.floor(s / n) + mv[0] + n) % n, c = (s % n + mv[1] + n) % n; this.select(r * n + c); return;
    }
    if (k === 'Backspace' || k === 'Delete' || k === '0') { e.preventDefault(); this.erase(); return; }
    if (k === 'Escape') { this.sel = -1; this.clearHint(); closePops(); this.render(); return; }
    if (k === ' ') { e.preventDefault(); this.setMode({ ans: 'pen', pen: 'crs', crs: 'ans' }[this.mode]); return; }
    // digits, or letters in Word Sudoku; Shift + digit pencils it in
    let d = -1; const up = k.length === 1 ? k.toUpperCase() : '';
    if (this.puz.w) d = this.sym.indexOf(up);
    else { const code = e.code && /^(Digit|Numpad)(\d)$/.exec(e.code); const num = code ? +code[2] : +k; if (num >= 1 && num <= n) d = num; }
    if (d >= 1) {
      e.preventDefault();
      if (e.shiftKey && !this.puz.w) { const m = this.mode; this.mode = 'pen'; this.press(d); this.mode = m; this.renderPad(); } else this.press(d);
    }
  };

  // ----- hints -----
  const unitName = (g, u) => {
    if (!u) return 'this area';
    if (u.kind === 'row') return 'row ' + (u.i + 1);
    if (u.kind === 'col') return 'column ' + (u.i + 1);
    if (u.kind === 'box') return 'box ' + (u.i + 1);
    if (u.kind === 'shape') return 'this shape';
    if (u.kind === 'diag') return 'the shaded diagonal';
    if (u.kind === 'window') return 'this window';
    if (u.kind === 'cage') return 'this cage (' + u.sum + ')';
    return 'this area';
  };
  const listOf = (a) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  Game.prototype.explain = function (s) {
    const S = (d) => this.sym[d]; const ds = (m) => listOf(E.digits(m).map(S)); const un = (u) => unitName(this, u);
    const boxWord = this.puz.r ? 'shape' : 'box';
    switch (s.t) {
      case 'hiddenSingle': return 'Look at ' + un(s.unit) + '. The ' + S(s.place[1]) + ' can only go in one square there – the gold one.';
      case 'nakedSingle': return 'Look at the gold square. Its row, column and ' + boxWord + ' already use every other ' + (this.puz.w ? 'letter' : 'number') + ', so only ' + S(s.place[1]) + ' is left.';
      case 'cage': return 'This cage adds up to ' + s.unit.sum + ' in ' + s.unit.cells.length + ' squares, with no repeats. Only some ' + (this.puz.w ? 'letters' : 'numbers') + ' can make that total here, so the ones shown in red can be crossed out.';
      case 'locked': return 'In ' + un(s.unit) + ', the ' + S(s.digit) + ' must go in one of the gold squares, and they all lie in ' + un(s.unit2) + '. So no other square in ' + un(s.unit2) + ' can be ' + S(s.digit) + '.';
      case 'nakedPair': case 'nakedTriple': case 'nakedQuad':
        return 'In ' + un(s.unit) + ', the ' + s.cells.length + ' gold squares can only hold ' + ds(s.mask) + '. Those must fill these squares, so cross ' + ds(s.mask) + ' out of every other square in ' + un(s.unit) + '.';
      case 'hiddenPair': case 'hiddenTriple': case 'hiddenQuad':
        return 'In ' + un(s.unit) + ', ' + ds(s.mask) + ' can only go in the ' + s.cells.length + ' gold squares. So those squares can’t hold anything else.';
      case 'innie': return 'The 45 rule: ' + un(s.unit) + ' adds up to 45. The cages that sit wholly inside it leave the gold squares, which must add up to ' + s.innie.sum + '. That rules out the ' + (this.puz.w ? 'letters' : 'numbers') + ' shown in red.';
      case 'xwing': case 'swordfish': {
        const lines = s.lines.map((x) => x + 1); const w = s.dir === 'row' ? 'rows' : 'columns', o = s.dir === 'row' ? 'columns' : 'rows';
        return (s.t === 'xwing' ? 'X-wing: ' : 'Swordfish: ') + 'in ' + w + ' ' + listOf(lines.map(String)) + ', the ' + S(s.digit) + ' can only go in the gold squares, which share the same ' + s.lines.length + ' ' + o + '. So no other square in those ' + o + ' can be ' + S(s.digit) + '.';
      }
      case 'xywing': return 'XY-wing: the three gold squares each have two choices. Whichever the middle one turns out to be, one of the two end squares must be ' + S(s.digit) + ' – so any square that sees both ends can’t be ' + S(s.digit) + '.';
    }
    return 'Here is a step you can take.';
  };
  Game.prototype.showHint = function (h) {
    this.hint = h; this.render();
    const box = $('#hintbox'); if (!box) return;
    box.hidden = false;
    box.innerHTML = '<div class="hb-top"><b>' + I.hint + esc(h.title) + '</b><button class="btn icon quiet" id="hbx" aria-label="Close hint">' + I.close + '</button></div><p>' + esc(h.text) + '</p>' +
      (h.action ? '<div class="btnrow"><button class="btn primary" id="hbdo">' + esc(h.actionLabel) + '</button></div>' : '');
    $('#hbx').onclick = () => { this.clearHint(); this.render(); };
    const d = $('#hbdo'); if (d) d.onclick = () => { const a = h.action; this.clearHint(); a(); };
    box.scrollIntoView({ block: 'nearest' });
  };
  Game.prototype.clearHint = function () { this.hint = null; const b = $('#hintbox'); if (b) { b.hidden = true; b.innerHTML = ''; b.classList.remove('numnote'); } };
  Game.prototype.nextStep = function () {
    if (this.done) return;
    const wrong = []; for (let i = 0; i < this.N2; i++) if (this.wrongAt(i)) wrong.push(i);
    this.hints++; this.persist();
    if (wrong.length) {
      this.sel = wrong[0];
      this.showHint({ title: 'Check this square', text: 'The ' + this.sym[this.vals[wrong[0]]] + ' in the gold square isn’t right' + (wrong.length > 1 ? ' (and ' + plural(wrong.length - 1, 'other answer') + ' also need fixing)' : '') + '. Fix it first, then ask for the next step.', cells: [wrong[0]], unitCells: [], keep: true,
        action: () => { this.sel = wrong[0]; const fin = this.change([wrong[0]]); this.vals[wrong[0]] = 0; fin(); this.afterChange(); }, actionLabel: 'Erase it' });
      return;
    }
    const lg = new E.Logic(this.L, this.vals);
    // Let the hint respect numbers the player has crossed out only when they are truly impossible.
    const s = lg.next(4);
    if (!s) { this.revealOne(); return; }
    const unitCells = [].concat(s.unit ? s.unit.cells : [], s.unit2 ? s.unit2.cells : []);
    const h = { title: this.puz.w ? E.TECH[s.t].name.replace('number', 'letter') : E.TECH[s.t].name, text: this.explain(s), cells: s.cells || [], unitCells, elims: s.elims, keep: true };
    if (s.place) {
      this.sel = s.place[0];
      h.action = () => { const i = s.place[0]; const fin = this.change([i]); this.vals[i] = s.place[1]; fin(); this.sel = i; this.afterChange(); }; h.actionLabel = 'Fill it in';
    } else {
      h.action = () => { const cs = s.elims.map((e) => e[0]); const fin = this.change(cs); s.elims.forEach(([c, m]) => { this.crs[c] |= m; this.pen[c] |= m; }); fin(); this.afterChange(); toast('Crossed out in your pencil marks.'); };
      h.actionLabel = 'Cross them out for me';
    }
    this.showHint(h);
  };
  Game.prototype.revealOne = function () {
    if (this.done) return;
    let i = this.sel;
    if (i < 0 || this.given[i] || this.vals[i] === this.sol[i]) {
      const lg = new E.Logic(this.L, this.vals.map((v, k) => (this.wrongAt(k) ? 0 : v)));
      let s = null; for (let g = 0; g < 200; g++) { s = lg.next(4); if (!s || s.place) break; lg.apply(s); }
      i = s && s.place ? s.place[0] : -1;
      if (i < 0) for (let k = 0; k < this.N2; k++) if (this.vals[k] !== this.sol[k]) { i = k; break; }
    }
    if (i < 0) return;
    this.hints++; const fin = this.change([i]); this.vals[i] = this.sol[i]; fin(); this.sel = i;
    toast('Revealed: ' + this.sym[this.sol[i]]); this.afterChange();
  };
  Game.prototype.checkAll = function () {
    const bad = new Set(); for (let i = 0; i < this.N2; i++) if (this.wrongAt(i)) bad.add(i);
    this.hints++; this.persist();
    if (!bad.size) { toast('Everything you have filled in is correct.'); return; }
    this.flashBad = bad; this.render(); toast(plural(bad.size, 'answer') + ' ' + (bad.size === 1 ? 'is' : 'are') + ' wrong – shown in red.', true);
    clearTimeout(this.flashT); this.flashT = setTimeout(() => { this.flashBad = null; this.render(); }, 5000);
  };
  Game.prototype.fillNotes = function () {
    const lg = new E.Logic(this.L, this.vals.map((v, k) => (this.wrongAt(k) ? 0 : v)));
    // cage sums narrow the choices too
    if (this.L.cages.length) for (const cg of this.L.cages) { const o = E.cageOptions(cg, lg.vals, lg.cand, true); if (o) o.free.forEach((c, j) => (lg.cand[c] &= o.masks[j])); }
    const cs = []; for (let i = 0; i < this.N2; i++) if (!this.vals[i]) cs.push(i);
    const fin = this.change(cs);
    cs.forEach((i) => { this.pen[i] = lg.cand[i]; this.crs[i] &= lg.cand[i]; });
    fin(); this.hints++; this.afterChange(); toast('Pencil marks filled in for every empty square.');
  };
  Game.prototype.hintMenu = function (anchor) {
    menu(anchor, [
      ['Show me the next step', () => this.nextStep(), 'Explains a step you can take'],
      ['Reveal this square', () => this.revealOne(), 'Or a square you could fill next'],
      ['Check my answers', () => this.checkAll(), 'Wrong answers turn red for a moment'],
      '-',
      ['Fill in all pencil marks', () => this.fillNotes(), 'Every possible guess, in every empty square'],
      ['Clear all pencil marks', () => { const cs = []; for (let i = 0; i < this.N2; i++) if (this.pen[i] || this.crs[i]) cs.push(i); if (!cs.length) return; const fin = this.change(cs); cs.forEach((i) => { this.pen[i] = 0; this.crs[i] = 0; }); fin(); this.afterChange(); }]
    ]);
  };
  Game.prototype.moreMenu = function (anchor) {
    menu(anchor, [
      ['Restart this puzzle', () => confirmBox('Restart this puzzle?', 'Your answers, pencil marks, hints and the timer start over.', 'Restart puzzle', () => { this.reset(); this.mount(); this.persist(); toast('Puzzle restarted'); })],
      ['Auto-complete this puzzle', () => confirmBox('Auto-complete this puzzle?', 'Every square will be filled in. It is added to your completed record marked “Auto-completed”.', 'Auto-complete', () => {
        this.autoDone = true; for (let i = 0; i < this.N2; i++) this.vals[i] = this.sol[i]; this.render(); this.finish(); })],
      ['How to play ' + TYPES[this.puz.type].name, () => rulesModal(this.puz.type, false)],
      '-',
      ['Print this puzzle', () => printPuzzle(this.puz, false)],
      ['Print the answer key', () => printPuzzle(this.puz, true)]
    ]);
  };

  // ----- saving & finishing -----
  Game.prototype.persist = function () {
    if (this.done) return;
    const s = { key: this.puz.key, title: this.puz.title, sub: this.puz.sub, sig: sig(this.puz), v: Array.from(this.vals).join('').replace(/0/g, '.'), p: Array.from(this.pen), x: Array.from(this.crs),
      secs: this.secs, hints: this.hints, mistakes: this.mistakes, mode: this.mode, pct: this.filled(), updated: Date.now() };
    if (this.puz.random) s.puz = this.puz;
    putSave(s);
  };
  Game.prototype.start = function () {
    this.stop();
    if (this.done) return;
    this.timer = setInterval(() => {
      if (document.hidden || modalRoot.children.length) return;
      this.secs++; const t = $('#timer'); if (t) t.textContent = fmtTime(this.secs);
      if (this.secs % 15 === 0) this.persist();
    }, 1000);
  };
  Game.prototype.stop = function () { if (this.timer) clearInterval(this.timer); this.timer = null; };
  Game.prototype.showDoneBanner = function () {
    const hb = $('#hintbox'); if (!hb) return;
    hb.hidden = false; hb.innerHTML = '<div class="hb-top"><b>' + I.check + 'Solved</b></div><p>This puzzle is complete. Restart it from the Puzzle menu to play again.</p>';
  };
  Game.prototype.finish = function () {
    if (this.done) return;
    this.done = true; this.stop(); this.sel = -1; this.clearHint();
    dropSave(this.puz.key);
    const rec = records();
    const recKey = this.puz.key; rec.push({ key: this.puz.key, title: this.puz.title, type: this.puz.type, level: this.puz.level, date: Date.now(), secs: this.secs, hints: this.hints, mistakes: this.mistakes, auto: !!this.autoDone });
    store.set('done', rec);
    this.render(); this.renderVerse(); this.showDoneBanner();
    const p = this.puz; const m = /^([a-z]+)-(\d+)$/.exec(p.key);
    const nextP = m ? (SDP[m[1]] || []).find((x) => x.id === +m[2] + 1) : null;
    loadKJV().catch(() => {}).then(() => {
      const vt = p.v && window.KJV ? '<p class="scripture" style="font-size:1.12em">“' + esc(window.KJV[p.v[0]][p.v[1] - 1][p.v[2] - 1]) + '” <span style="font-family:var(--sans);font-size:.75em;color:var(--rubric)">' + esc(refStr(p.v)) + '</span></p>' : '';
      const wt = p.w && window.KJV ? '<p>The gold row spells <b class="bigword">' + esc(p.w) + '</b>, from ' + esc(refStr(p.wv)) + ':</p><p class="scripture" style="font-size:1.05em">' + esc(window.KJV[p.wv[0]][p.wv[1] - 1][p.wv[2] - 1]).replace(new RegExp('(^|[^A-Za-z])(' + p.w + ')(?![A-Za-z])', 'gi'), (a, p1, w) => p1 + '<mark class="wmark">' + w + '</mark>') + '</p>' : '';
      modal('<h2>' + (this.autoDone ? 'Puzzle auto-completed' : 'Well done!') + '</h2>' +
        (this.autoDone ? '<p><b>' + esc(p.title) + '</b> is in your completed record, marked “Auto-completed”.</p>' :
          '<p>You solved <b>' + esc(p.title) + '</b> (' + esc(TYPES[p.type].name) + ', ' + LEVELS[p.level].name + ') in ' + fmtTime(this.secs) + (this.hints ? ' using ' + plural(this.hints, 'hint') : ' without any hints') + (this.mistakes ? ' and ' + plural(this.mistakes, 'mistake') : this.hints ? '' : ' or mistakes') + '.</p>') +
        wt + vt +
        (!this.autoDone && window.KJV ? '<div class="memo"><span><b>Memory verse</b> Fill in the missing words of ' + esc(refStr(p.v)) + ' to earn a star.</span><button class="btn" data-memo>★ Try it</button></div>' : '') +
        '<div class="actions"><button class="btn" data-close>Look at the grid</button><button class="btn" data-lib>Puzzle library</button>' +
        (nextP ? '<button class="btn primary" data-next>Next puzzle</button>' : '<button class="btn primary" data-rand>Another random puzzle</button>') + '</div>',
      (sc, close) => {
        sc.querySelector('[data-lib]').onclick = () => { close(); home(); go('library', { type: p.type }); };
        const nx = sc.querySelector('[data-next]'); if (nx) nx.onclick = () => { close(); openPremade(m[1], nextP.id); };
        const r = sc.querySelector('[data-rand]'); if (r) r.onclick = () => { close(); go('random'); };
        const mm = sc.querySelector('[data-memo]'); if (mm) mm.onclick = () => { close(); memoryVerse(p, recKey); };
      });
    });
  };

  // ----- memory verse: tap the missing words back into the key verse -----
  const DECOYS = ['mercy', 'glory', 'heaven', 'righteousness', 'spirit', 'kingdom', 'truth', 'light', 'peace', 'grace', 'faith', 'wisdom', 'strength', 'salvation', 'covenant', 'servant', 'shepherd', 'blessed', 'holy', 'earth', 'mountain', 'praise', 'father', 'children', 'commandments', 'mighty'];
  function memoryVerse(p, recKey) {
    const text = window.KJV[p.v[0]][p.v[1] - 1][p.v[2] - 1];
    const toks = text.split(/(\s+)/);
    const cand = [];
    toks.forEach((w, i) => { const m = /^([^A-Za-z]*)([A-Za-z’']+)([^A-Za-z]*)$/.exec(w); if (m && m[2].length >= 4 && !CWEngine.STOP.has(m[2].toLowerCase())) cand.push({ i, pre: m[1], word: m[2], post: m[3] }); });
    const nWords = toks.filter((w) => /[A-Za-z]/.test(w)).length;
    const want = Math.min(cand.length, nWords < 12 ? 2 : nWords < 24 ? 3 : 4);
    const seen = new Set(); const picks = cand.slice().sort((a, b) => b.word.length - a.word.length).filter((c) => { const k = c.word.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, want).sort((a, b) => a.i - b.i);
    if (!picks.length) { toast('This verse is too short for a memory check.'); return; }
    const inVerse = new Set(cand.map((c) => c.word.toLowerCase()));
    const decoys = E.shuffle(DECOYS.filter((d) => !inVerse.has(d)), E.RNG(p.v[0] * 1e6 + p.v[1] * 1000 + p.v[2])).slice(0, 2);
    const chips = E.shuffle(picks.map((c) => c.word).concat(decoys), E.RNG(Date.now() >>> 0));
    let at = 0, misses = 0;
    const slotOf = new Map(picks.map((c, k) => [c.i, k]));
    const verseHtml = () => toks.map((w, i) => {
      if (!slotOf.has(i)) return esc(w);
      const k = slotOf.get(i), c = picks[k];
      return esc(c.pre) + (k < at ? '<span class="mslot ok">' + esc(c.word) + '</span>' : '<span class="mslot' + (k === at ? ' cur' : '') + '" style="--l:' + c.word.length + '">' + (k + 1) + '</span>') + esc(c.post);
    }).join('');
    modal('<h2>Memory verse</h2><p class="help" style="margin-top:-4px">Tap the words in order to fill the blanks. Get it with no more than one wrong tap for a star.</p>' +
      '<p class="scripture" id="mv">“' + verseHtml() + '”</p><p class="help"><b>' + esc(refStr(p.v)) + '</b></p>' +
      '<div class="chips" id="mchips">' + chips.map((w, k) => '<button class="btn chip" data-k="' + k + '">' + esc(w) + '</button>').join('') + '</div>' +
      '<p id="mmsg" class="help" aria-live="polite"></p><div class="actions"><button class="btn" data-close>Close</button></div>',
    (sc) => {
      sc.querySelector('#mchips').onclick = (e) => {
        const b = e.target.closest('[data-k]'); if (!b || at >= picks.length) return;
        const w = chips[+b.dataset.k];
        if (w.toLowerCase() === picks[at].word.toLowerCase()) {
          at++; b.disabled = true; b.classList.add('used');
          sc.querySelector('#mv').innerHTML = '“' + verseHtml() + '”';
          if (at === picks.length) {
            const star = misses <= 1;
            if (star) { const rec = records(); for (let k = rec.length - 1; k >= 0; k--) if (rec[k].key === recKey) { rec[k].star = 1; break; } store.set('done', rec); }
            sc.querySelector('#mmsg').innerHTML = star ? '<span class="starmsg">★ Well done! A star is added to your record.</span>' : 'You finished the verse. Try for a star next time with fewer wrong taps.';
            sc.querySelectorAll('.chip').forEach((x) => (x.disabled = true));
          }
        } else {
          misses++; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 600);
          sc.querySelector('#mmsg').textContent = '“' + w + '” isn’t the next word.' + (misses === 2 ? ' (No star this time, but keep going.)' : '');
        }
      };
    });
  }

  // Android hardware back button support
  window.onAndroidBack = function () {
    if (document.querySelector('.pop')) { closePops(); return true; }
    if (modalRoot.children.length) { modalRoot.lastChild.remove(); return true; }
    if (current && current.view !== 'title') { if (game && current.view === 'puzzle') game.persist(); back(); return true; }
    exitApp(); return true;
  };
  window.onAndroidPause = function () { if (game && !game.done) game.persist(); };
  window.onAndroidResume = function () {};
  window.addEventListener('beforeunload', () => { if (game && !game.done) game.persist(); });
  window.addEventListener('resize', () => { if (game && current && current.view === 'puzzle') game.fit(); });

  // boot
  go('title', {}, true);
  setTimeout(() => loadKJV().catch(() => {}), 600);
  window.__sd = { go, get settings() { return settings; }, get game() { return game; }, switchProfile, printPuzzle, openPremade, makeRandom };
})();
