/* イルカのブラスト 〜通信工事するイルカ〜  UI + rendering */
(() => {
'use strict';
const { Game, COLORS } = window.BlastEngine; const LV = window.BLAST_LEVELS; const Art = window.Art;
const $ = id => document.getElementById(id);
const STAMP_DATA = null; // replaced by inline data URIs in single-file builds
const stampSrc = n => (STAMP_DATA && STAMP_DATA[n]) || 'img/st/' + n + '.webp';
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const ease = { lin: k => k, out: k => 1 - (1 - k) * (1 - k), inq: k => k * k, back: k => { const s = 1.70158; k -= 1; return k * k * ((s + 1) * k + s) + 1; } };

// ---------------------------------------------------------------- save
const SAVE_KEY = 'irukaBlast.v1';
const DEF = () => ({ stars: {}, best: {}, sound: true, bgm: true, bgmVol: 0.6, vib: true, fx: 'full', fast: false, inv: {}, got: {}, chest: 0 });
const VERSION = '1.1.5', IS_APP = location.protocol === 'file:';
if (IS_APP) document.documentElement.classList.add('app');
function loadSave() { try { const v = Object.assign(DEF(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); v.inv = v.inv || {}; v.got = v.got || {}; return v; } catch (e) { return DEF(); } }
let SV = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SV)); } catch (e) {} }
const unlocked = () => { let n = 1; while (SV.stars[n] && n < LV.length) n++; return n; };
const starTotal = () => Object.values(SV.stars).reduce((a, b) => a + b, 0);

// ---------------------------------------------------------------- audio (synthesized, no files)
let AC = null, MG = null, NB = null;
// iPhone/iPad: Web Audio is "ambient" by default, so the hardware silent (ring/mute) switch mutes ALL game sound
// and BGM. Safari 16.4+/17: ask for a "playback" audio session. Older real iOS WebKit only: fall back to a tiny silent
// looping <audio> element started inside a tap. Web only (the APK is file:// and never runs this); every step is guarded.
const IOS = location.protocol !== 'file:' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const IOS_REAL = IOS && typeof navigator.standalone === 'boolean'; // real iOS/iPadOS WebKit (Safari, home-screen app, in-app browsers); emulators lack it
let iosEl = null, iosElFailed = false;
function iosSession() {
  if (!IOS) return;
  try { if (navigator.audioSession) { if (navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; return; } } catch (e) {}
  if (!IOS_REAL || iosElFailed || document.hidden) return;
  try {
    if (!iosEl) { // created lazily on the first tap: 0.25 s of 8 kHz 8-bit silence (2 KB in-memory WAV, no file, no network)
      const n = 2000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
      let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      const el = document.createElement('audio'); el.setAttribute('playsinline', ''); el.setAttribute('x-webkit-airplay', 'deny');
      el.preload = 'none'; el.loop = true; el.muted = false; el.onerror = () => { iosElFailed = true; };
      el.src = 'data:audio/wav;base64,' + btoa(s); iosEl = el;
    }
    if (iosEl.paused) { const p = iosEl.play(); if (p && p.catch) p.catch(() => {}); }
  } catch (e) { iosElFailed = true; }
}
function iosSessionSleep() { try { if (iosEl && !iosEl.paused) iosEl.pause(); } catch (e) {} }
function unlockAudio() {
  iosSession();
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); MG = AC.createGain(); MG.gain.value = 0.55; MG.connect(AC.destination);
      NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    if (AC.state !== 'running') { const pr = AC.resume(); if (pr && pr.catch) pr.catch(() => {}); }
    const b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0);
  } catch (e) {}
}
const bgmWake = () => { if (BGM && AC) { bgmApply(); BGM.kick(); bgmFor(screen); } };
['touchend', 'pointerdown', 'keydown', 'click'].forEach(t => document.addEventListener(t, () => { if (!AC || AC.state !== 'running') { unlockAudio(); bgmWake(); if (AC && AC.resume) { const pr = AC.resume(); if (pr && pr.then) pr.then(bgmWake, () => {}); } } else if (IOS_REAL && !navigator.audioSession && !iosElFailed && (!iosEl || iosEl.paused)) iosSession(); }, { passive: true, capture: true }));
const sOK = () => SV.sound && AC && AC.state === 'running';
const BGM = window.IrukaMusic ? IrukaMusic.Player(() => AC) : null;
function bgmFor(name) { if (!BGM) return; if (name === 'game' && G) { const k = LV[LVN - 1].kind; BGM.play(k === 'boss' || k === 'bigboss' ? 'boss' : k === 'breather' ? 'rest' : 'level'); } else if (name === 'title' || name === 'map') BGM.play('map'); }
function bgmApply() { if (!BGM) return; BGM.setVolume(SV.bgmVol); BGM.setOn(SV.bgm); }
function buzz(p) { if (!SV.vib || IS_APP || !navigator.vibrate) return; try { navigator.vibrate(p); } catch (e) {} }
function tone(f, dur, type = 'sine', vol = 0.3, when = 0, f2 = null) {
  if (!sOK()) return; const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(MG); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, type = 'lowpass', f = 1200, when = 0, f2 = null) {
  if (!sOK()) return; const t = AC.currentTime + when, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NB; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(MG); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
const SFX = {
  pop(n) { const b = 520 + Math.min(n, 12) * 45; tone(b, 0.12, 'sine', 0.35, 0, b * 1.6); tone(b * 1.5, 0.08, 'triangle', 0.15, 0.03); noise(0.05, 0.12, 'highpass', 3000); },
  bonk() { tone(160, 0.12, 'square', 0.12, 0, 110); },
  make() { tone(400, 0.25, 'sawtooth', 0.12, 0, 1200); tone(800, 0.2, 'sine', 0.2, 0.08, 1600); },
  drill() { noise(0.45, 0.25, 'bandpass', 900, 0, 3500); tone(140, 0.4, 'sawtooth', 0.08, 0, 260); },
  boom() { noise(0.6, 0.5, 'lowpass', 900, 0, 80); tone(90, 0.5, 'sine', 0.45, 0, 35); },
  disco() { [880, 1175, 1480, 1760, 2350].forEach((f, i) => tone(f, 0.18, 'triangle', 0.13, i * 0.05)); noise(0.5, 0.08, 'highpass', 6000); },
  box() { noise(0.12, 0.3, 'bandpass', 700); tone(220, 0.08, 'square', 0.06); },
  drum() { tone(300, 0.15, 'triangle', 0.25, 0, 180); noise(0.08, 0.1, 'bandpass', 1500); },
  router() { tone(1047, 0.12, 'square', 0.12); tone(1568, 0.25, 'square', 0.12, 0.1); tone(2093, 0.3, 'sine', 0.15, 0.2); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.16, 'triangle', 0.25, i * 0.12)); },
  lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.28, 'triangle', 0.22, i * 0.2)); },
  star(i) { tone(880 * Math.pow(1.26, i), 0.3, 'triangle', 0.25); tone(1760 * Math.pow(1.26, i), 0.2, 'sine', 0.1, 0.05); },
  tick() { tone(1200, 0.04, 'sine', 0.12); },
  shuffle() { for (let i = 0; i < 6; i++) tone(500 + i * 120, 0.08, 'triangle', 0.1, i * 0.04); },
};
// iOS: block page pinch zoom
['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
// only block pinch here; single-finger scrolling is stopped by CSS touch-action on the game screen
// (a page-wide touchmove preventDefault could swallow taps on buttons in some Android WebViews)
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault());

// ---------------------------------------------------------------- screens
let screen = 'title';
function show(name) {
  screen = name;
  for (const [n, id] of [['title', 'scTitle'], ['map', 'scMap'], ['game', 'scGame']]) $(id).hidden = n !== name;
  if (name === 'map') buildMap();
  if (name === 'game') resize();
  bgmFor(name);
}
const overlays = ['ovStart', 'ovPause', 'ovWin', 'ovLose', 'ovMenu'];
const closeOverlays = () => overlays.forEach(o => $(o).hidden = true);
function pal(name, ms = 1600) {
  const p = $('pal'); p.querySelector('img').src = stampSrc(name); p.classList.add('show');
  clearTimeout(pal.t); pal.t = setTimeout(() => p.classList.remove('show'), ms);
}
function banner(html, ms) { const b = $('banner'); b.innerHTML = html; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('show'), ms || 1400); }

// ---------------------------------------------------------------- title
(function titleRain() {
  const r = $('rain'); const kinds = [0, 1, 2, 3, 4, 5];
  for (let i = 0; i < 14; i++) {
    const c = Art.sprite({ t: 'b', c: kinds[i % 6] }, 96), im = new Image(); im.src = c.toDataURL();
    im.style.left = (i * 7.3 % 100) + '%'; im.style.animationDuration = (6 + (i * 1.7) % 6) + 's'; im.style.animationDelay = (-i * 0.9) + 's'; r.appendChild(im);
  }
})();
$('tPlay').onclick = () => { SFX.tick(); show('map'); };

// ---------------------------------------------------------------- map
const AREAS = window.BLAST_AREAS;
const MAP = { ROW: 100, TOP: 170, BOT: 130, CH: 25, chunks: new Map(), W: 0, H: 0, cur: 1 };
const mapPos = i => { const N = LV.length, y = MAP.TOP + (N - 1 - i) * MAP.ROW, x = MAP.W / 2 + Math.sin(i * 0.95) * MAP.W * 0.28; return [x, y]; };
function buildMap() {
  const inner = $('mapInner'), N = LV.length, sc = $('mapScroll');
  MAP.W = sc.clientWidth || 360; MAP.H = MAP.TOP + (N - 1) * MAP.ROW + MAP.BOT; MAP.cur = unlocked();
  inner.innerHTML = ''; inner.style.height = MAP.H + 'px'; MAP.chunks.clear();
  // one background band per area (50 levels each); level 1 is at the bottom
  for (let a = 0; a * 50 < N; a++) {
    const first = a * 50, last = Math.min(N - 1, a * 50 + 49), ar = AREAS[a] || AREAS[AREAS.length - 1];
    const yTop = last === N - 1 ? 0 : mapPos(last)[1] - MAP.ROW / 2, yBot = a === 0 ? MAP.H : mapPos(first)[1] + MAP.ROW / 2;
    const d = document.createElement('div'); d.className = 'area'; d.style.top = yTop + 'px'; d.style.height = (yBot - yTop) + 'px';
    d.style.background = `linear-gradient(${ar.top}, ${ar.bot})`; inner.appendChild(d);
    const ban = document.createElement('div'); ban.className = 'areaban'; ban.style.top = (mapPos(first)[1] + 62) + 'px';
    ban.innerHTML = `<small>エリア ${a + 1}（${first + 1}〜${last + 1}）</small>${ar.name}エリア`; inner.appendChild(ban);
  }
  const av = new Image(); av.id = 'mapAvatar'; av.src = stampSrc('shinkochu'); const [ax, ay] = mapPos(MAP.cur - 1); av.style.left = ax + 'px'; av.style.top = ay + 'px'; inner.appendChild(av);
  $('starSum').textContent = starTotal();
  const nu = newUnlocks(MAP.cur); if (nu.length) { persist(); queueGift('新しい道具！', 'これから使えるよ。3個プレゼント！', nu); if ($('ovGift').hidden) showGift(); }
  $('mSound').textContent = SV.sound ? '🔊' : '🔈';
  sc.scrollTop = clamp(ay - sc.clientHeight * 0.6, 0, MAP.H);
  renderChunks();
}
function chunkEl(k) {
  const N = LV.length, i0 = k * MAP.CH, i1 = Math.min(N - 1, i0 + MAP.CH - 1), cur = MAP.cur;
  const el = document.createElement('div'); el.className = 'mchunk';
  const yMin = mapPos(i1)[1] - MAP.ROW, yMax = mapPos(i0)[1] + MAP.ROW;
  let svg = `<svg style="position:absolute;left:0;top:${yMin}px;pointer-events:none" width="${MAP.W}" height="${yMax - yMin}" viewBox="0 ${yMin} ${MAP.W} ${yMax - yMin}" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = i0; i <= Math.min(i1, N - 2); i++) {
    const [x1, y1] = mapPos(i), [x2, y2] = mapPos(i + 1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + 18, lit = SV.stars[i + 1] ? '#ff8a2a' : '#4a5670';
    svg += `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" stroke="#1b2a44" stroke-width="9" fill="none" stroke-linecap="round" opacity=".3"/><path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" stroke="${lit}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  }
  for (let i = i0; i <= i1; i += 2) { const [x, y] = mapPos(i), px = x < MAP.W / 2 ? x + 62 : x - 62; svg += `<g opacity=".5"><rect x="${px - 3}" y="${y - 50}" width="6" height="64" fill="#6b4a2a"/><rect x="${px - 14}" y="${y - 44}" width="28" height="4" fill="#6b4a2a"/></g>`; }
  svg += '</svg>'; el.innerHTML = svg;
  for (let i = i0; i <= i1; i++) {
    const n = i + 1, [x, y] = mapPos(i), b = document.createElement('button'), kd = LV[i].kind;
    b.className = 'node' + (n > cur ? ' locked' : '') + (n === cur ? ' cur' : '') + (kd === 'boss' || kd === 'bigboss' ? ' boss' : kd === 'breather' ? ' breather' : '') + (kd === 'bigboss' ? ' big' : '');
    b.style.left = x + 'px'; b.style.top = y + 'px'; b.dataset.lv = n;
    const st = SV.stars[n] || 0;
    b.innerHTML = n > cur ? (kd === 'boss' || kd === 'bigboss' ? '👑' : '🔒') : `${n}<span class="st">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span>`;
    b.onclick = () => { if (n <= cur) { SFX.tick(); openStart(n); } else SFX.bonk(); };
    el.appendChild(b);
  }
  return el;
}
function renderChunks() {
  if (screen !== 'map') return;
  const sc = $('mapScroll'), top = sc.scrollTop, vh = sc.clientHeight || 600, N = LV.length;
  // levels visible in [top - vh, top + 2vh]
  const iAt = y => Math.round((MAP.TOP + (N - 1) * MAP.ROW - y) / MAP.ROW);
  const iHi = clamp(iAt(top - vh), 0, N - 1), iLo = clamp(iAt(top + 2 * vh), 0, N - 1);
  const need = new Set(); for (let k = Math.floor(iLo / MAP.CH); k <= Math.floor(iHi / MAP.CH); k++) need.add(k);
  for (const [k, el] of MAP.chunks) if (!need.has(k)) { el.remove(); MAP.chunks.delete(k); }
  for (const k of need) if (!MAP.chunks.has(k)) { const el = chunkEl(k); $('mapInner').appendChild(el); MAP.chunks.set(k, el); }
  const [, cy] = mapPos(MAP.cur - 1); $('mJump').hidden = cy > top - 40 && cy < top + vh + 40;
  const av = $('mapAvatar'); if (av) av.style.zIndex = 3;
}
let mapRaf = 0;
$('mapScroll').addEventListener('scroll', () => { if (!mapRaf) mapRaf = requestAnimationFrame(() => { mapRaf = 0; renderChunks(); }); }, { passive: true });
$('mJump').onclick = () => { SFX.tick(); const sc = $('mapScroll'), [, ay] = mapPos(MAP.cur - 1); const to = clamp(ay - sc.clientHeight * 0.6, 0, MAP.H); sc.scrollTo({ top: to, behavior: Math.abs(to - sc.scrollTop) > sc.clientHeight * 3 ? 'auto' : 'smooth' }); };
$('mBack').onclick = () => { SFX.tick(); show('title'); };
$('mSound').onclick = () => { SV.sound = !SV.sound; SV.bgm = SV.sound; persist(); bgmApply(); $('mSound').textContent = SV.sound ? '🔊' : '🔈'; SFX.tick(); };

// ---------------------------------------------------------------- goal widgets
const GOAL_ORDER = ['router', 'box', 'drum', 'lamp', 'tie', 'mud', 'r', 'y', 'b', 'g', 'p', 'o'];
const sortGoals = g => Object.keys(g).sort((a, b) => GOAL_ORDER.indexOf(a) - GOAL_ORDER.indexOf(b));
const goalImg = (k, px) => { const c = Art.goalSprite(k, px * 2), im = new Image(); im.src = c.toDataURL(); im.alt = k; return im; };
function goalRow(el, goals) {
  el.innerHTML = '';
  for (const k of sortGoals(goals)) { const d = document.createElement('div'); d.className = 'goal' + (goals[k] <= 0 ? ' done' : ''); d.appendChild(goalImg(k, 44)); const b = document.createElement('b'); b.textContent = goals[k] > 0 ? goals[k] : ''; d.appendChild(b); el.appendChild(d); }
}

// ---------------------------------------------------------------- level start
let LVN = 1;
function openStart(n) {
  LVN = n; const L = LV[n - 1];
  closeOverlays(); $('ovStart').hidden = false;
  $('sTitle').textContent = 'レベル ' + n; $('sName').textContent = '「' + L.name + '」';
  const g = new Game(L, 1); goalRow($('sGoals'), g.goalStart);
  $('sMoves').textContent = L.moves; $('sTip').textContent = L.tip || '';
  const st = SV.stars[n] || 0; $('sStars').innerHTML = st ? [0, 1, 2].map(i => `<i class="${i < st ? 'on' : ''}"></i>`).join('') : '';
  prePick = new Set([...prePick].filter(k => inv(k) > 0)); buildPre(n);
}
$('sGo').onclick = () => { SFX.tick(); closeOverlays(); const pk = [...prePick].filter(k => inv(k) > 0); startLevel(LVN, undefined, pk); };
$('sBack').onclick = () => { SFX.tick(); closeOverlays(); if (screen !== 'map') show('map'); };

// ---------------------------------------------------------------- board state & render
const cv = $('cv'), cx = cv.getContext('2d'), fly = $('fly'), fx2 = fly.getContext('2d');
let G = null, dispMud = null, mode = null, busy = false, paused = false, score = 0, dispGoals = {}, lowWarned = false, playId = 0;
let CS = 40, OX = 0, OY = 0, DPR = 1, VW = 0, VH = 0, bg = null;
const sprites = new Map(); // id -> sprite
let ghosts = [], parts = [], fxs = [], flyers = [], texts = [], timers = [], tweens = [];
let clock = performance.now(), shake = 0, lastInput = performance.now(), hintCells = null;
let SPD = SV.fast ? 0.7 : 1; // animation speed multiplier (tests set this low)

function tween(dur, fn, delay = 0, ez = ease.lin) { return new Promise(res => tweens.push({ t0: clock + delay * SPD, dur: Math.max(1, dur * SPD), fn, ez, res })); }
const wait = ms => tween(ms, () => {});
function mkSprite(p, r, c) { const s = { id: p.id, p: Object.assign({}, p), r, c, sc: 1, al: 1, rot: 0, sy: 1, land: 0, shk: 0, badge: null }; sprites.set(p.id, s); return s; }

function resize() {
  const st = $('stage'); const r = st.getBoundingClientRect(); VW = r.width; VH = r.height; DPR = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = Math.round(VW * DPR); cv.height = Math.round(VH * DPR);
  fly.width = Math.round(innerWidth * DPR); fly.height = Math.round(innerHeight * DPR);
  if (G) {
    const pad = 10; CS = Math.floor(Math.min((VW - pad * 2) / G.W, (VH - pad * 2) / G.H, 72));
    OX = Math.round((VW - CS * G.W) / 2); OY = Math.round((VH - CS * G.H) / 2);
    buildBg();
  }
}
window.addEventListener('resize', () => { if (screen === 'game') resize(); else if (screen === 'map') buildMap(); });
// v1.1.3: re-measure whenever #stage itself changes size (goal bar wraps, booster bar appears, iOS toolbars, safe areas)
function fitCheck() { if (screen !== 'game' || !G) return; const r = $('stage').getBoundingClientRect(); if (r.width > 0 && r.height > 0 && (Math.abs(r.width - VW) > 0.5 || Math.abs(r.height - VH) > 0.5)) resize(); }
if (window.ResizeObserver) { let fq = 0; new ResizeObserver(() => { if (!fq) fq = requestAnimationFrame(() => { fq = 0; fitCheck(); }); }).observe($('stage')); }
if (window.visualViewport) visualViewport.addEventListener('resize', fitCheck);
function buildBg() {
  bg = document.createElement('canvas'); bg.width = Math.ceil((CS * G.W + 24) * DPR); bg.height = Math.ceil((CS * G.H + 24) * DPR);
  const x = bg.getContext('2d'); x.scale(DPR, DPR); x.translate(12, 12);
  const R = CS * 0.22;
  // frame (union of cells, padded)
  x.fillStyle = 'rgba(13,46,106,.35)';
  for (let r = 0; r < G.H; r++) for (let c = 0; c < G.W; c++) if (!G.hole[r][c]) { x.beginPath(); x.roundRect ? x.roundRect(c * CS - 7, r * CS - 4, CS + 14, CS + 14, R + 6) : x.rect(c * CS - 7, r * CS - 4, CS + 14, CS + 14); x.fill(); }
  x.fillStyle = '#ffffff';
  for (let r = 0; r < G.H; r++) for (let c = 0; c < G.W; c++) if (!G.hole[r][c]) { x.beginPath(); x.roundRect ? x.roundRect(c * CS - 5, r * CS - 5, CS + 10, CS + 10, R + 4) : x.rect(c * CS - 5, r * CS - 5, CS + 10, CS + 10); x.fill(); }
  for (let r = 0; r < G.H; r++) for (let c = 0; c < G.W; c++) if (!G.hole[r][c]) {
    x.fillStyle = (r + c) % 2 ? '#24518f' : '#2b5c9e'; x.fillRect(c * CS - 0.5, r * CS - 0.5, CS + 1, CS + 1);
  }
}
const cellXY = (r, c) => [OX + c * CS + CS / 2, OY + r * CS + CS / 2];

function draw() {
  cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, VW, VH);
  if (!G) return;
  if (SV.fx === 'lite') shake = Math.min(shake, 2);
  let sx = 0, sy = 0; if (shake > 0.2) { sx = (Math.random() - 0.5) * shake; sy = (Math.random() - 0.5) * shake; shake *= 0.88; } else shake = 0;
  cx.translate(sx, sy);
  if (bg) cx.drawImage(bg, OX - 12, OY - 12, bg.width / DPR, bg.height / DPR);
  cx.save(); cx.beginPath(); cx.rect(OX - 4, OY - 2, CS * G.W + 8, CS * G.H + 6); cx.clip();
  const S = CS * DPR, t = clock;
  if (dispMud) { const mi = Art.sprite({ t: 'mud' }, S); for (let r = 0; r < G.H; r++) for (let c = 0; c < G.W; c++) if (dispMud[r][c]) { const [x, y] = cellXY(r, c); cx.drawImage(mi, x - CS / 2, y - CS / 2, CS, CS); } }
  const list = [...sprites.values()].sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const s of list) drawSprite(s, S, t);
  cx.restore();
  for (const g of ghosts) drawSprite(g, S, t);
  if (mode) drawMode(t);
  // fx
  for (const f of fxs) f.draw(cx, t);
  // particles
  for (const p of parts) { cx.globalAlpha = clamp(p.life / p.max, 0, 1); cx.fillStyle = p.col; if (p.star) { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillRect(-p.sz / 2, -p.sz / 6, p.sz, p.sz / 3); cx.fillRect(-p.sz / 6, -p.sz / 2, p.sz / 3, p.sz); cx.restore(); } else { cx.beginPath(); cx.arc(p.x, p.y, p.sz, 0, 7); cx.fill(); } }
  cx.globalAlpha = 1;
  for (const tx of texts) { const k = (t - tx.t0) / tx.dur; if (k < 0) continue; cx.save(); cx.globalAlpha = clamp(2 - k * 2, 0, 1); cx.translate(tx.x, tx.y - k * 30); const sc = k < 0.15 ? ease.back(k / 0.15) : 1; cx.scale(sc, sc);
    cx.font = `900 ${tx.size}px "Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans CJK JP",sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
    cx.lineWidth = tx.size * 0.22; cx.strokeStyle = '#1b4b9b'; cx.strokeText(tx.s, 0, 0); cx.fillStyle = tx.col || '#fff'; cx.fillText(tx.s, 0, 0); cx.restore(); }
  // flyers on the overlay canvas
  fx2.setTransform(DPR, 0, 0, DPR, 0, 0); fx2.clearRect(0, 0, innerWidth, innerHeight);
  for (const f of flyers) { const k = clamp((t - f.t0) / f.dur, 0, 1); if (t < f.t0) continue; const e = ease.inq(k);
    const x = f.x0 + (f.x1 - f.x0) * e, y = f.y0 + (f.y1 - f.y0) * e - Math.sin(k * Math.PI) * 60, sz = f.sz * (1 - 0.4 * k);
    fx2.drawImage(f.img, x - sz / 2, y - sz / 2, sz, sz); }
}
function drawSprite(s, S, t) {
  let sc = s.sc, sy = s.sy; if (s.land) { const k = (t - s.land) / (160 * SPD); if (k < 1) { sy = 1 - 0.14 * Math.sin(k * Math.PI); sc *= 1; } else s.land = 0; }
  if (s.al <= 0 || sc <= 0.01) return;
  let [x, y] = cellXY(s.r, s.c); let rot = s.rot;
  if (s.shk) { const k = (t - s.shk) / (300 * SPD); if (k < 1) x += Math.sin(k * 30) * CS * 0.08 * (1 - k); else s.shk = 0; }
  if (hintCells && hintCells.has(s.id)) { const w = Math.sin(t / 110); rot += w * 0.08; sc *= 1 + Math.abs(w) * 0.06; }
  const img = Art.sprite(s.p, S);
  cx.save(); cx.globalAlpha = s.al; cx.translate(x, y + CS * (1 - sy) / 2); if (rot) cx.rotate(rot); cx.scale(sc, sc * sy);
  if (s.p.t === 'disco') cx.rotate(Math.sin(t / 500) * 0.15);
  cx.drawImage(img, -CS / 2, -CS / 2, CS, CS);
  if (s.p.lock) cx.drawImage(Art.sprite({ t: 'tie' }, S), -CS / 2, -CS / 2, CS, CS);
  if (s.badge && s.p.t === 'b') { const b = Art.sprite({ t: 'badge', kind: s.badge }, S * 0.4); cx.drawImage(b, CS * 0.12, -CS * 0.5, CS * 0.38, CS * 0.38); }
  if (s.flash) { const k = (t - s.flash) / (250 * SPD); if (k < 1) { cx.globalAlpha = (1 - k) * 0.8; cx.globalCompositeOperation = 'lighter'; cx.drawImage(img, -CS / 2, -CS / 2, CS, CS); } else s.flash = 0; }
  cx.restore();
}
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(50, now - lastT); lastT = now; clock = now;
  // tweens
  if (tweens.length) { const done = []; for (const w of tweens) { if (clock < w.t0) continue; const k = clamp((clock - w.t0) / w.dur, 0, 1); w.fn(w.ez(k)); if (k >= 1) done.push(w); } if (done.length) { tweens = tweens.filter(w => !done.includes(w)); done.forEach(w => w.res()); } }
  // particles
  for (const p of parts) { p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.35 * dt / 16; p.life -= dt; p.rot = (p.rot || 0) + 0.2; }
  parts = parts.filter(p => p.life > 0);
  fxs = fxs.filter(f => clock < f.end); texts = texts.filter(tx => clock < tx.t0 + tx.dur); flyers = flyers.filter(f => clock < f.t0 + f.dur);
  ghosts = ghosts.filter(g => !g.dead);
  // hint after idle
  if (G && !busy && !paused && G.status === 'play' && !hintCells && now - lastInput > 5000) showHint();
  if (screen === 'game') draw(); else if (flyers.length || fly._dirty) { fx2.setTransform(1, 0, 0, 1, 0, 0); fx2.clearRect(0, 0, fly.width, fly.height); flyers = []; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- effects
const COLHEX = ['#ff4d5e', '#ffc928', '#35a2ff', '#3fcc66', '#a46bff', '#ff8a2a'];
function burst(r, c, col, n = 7, star = false) { if (SV.fx === 'lite') n = Math.ceil(n / 3); const [x, y] = cellXY(r, c); for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * 4; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, life: 450 + Math.random() * 250, max: 600, col, sz: star ? CS * 0.22 : CS * (0.05 + Math.random() * 0.07), star }); } }
function popText(s, r, c, size, col) { const [x, y] = cellXY(r, c); texts.push({ s, x: clamp(x, 80, VW - 80), y, t0: clock, dur: 1100 * Math.max(SPD, 0.3), size: size || CS * 0.62, col }); }
function goalTarget(key) { const el = document.querySelector(`#goals .goal[data-k="${key}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2 - 6, el]; }
function goalHit(p, r, c) {
  const key = p.t === 'b' ? COLORS[p.c] : p.t;
  if (!(key in dispGoals) || dispGoals[key] <= 0) return;
  dispGoals[key]--;
  const tg = goalTarget(key); if (!tg) return;
  const sr = cv.getBoundingClientRect(), [x, y] = cellXY(r, c);
  if (flyers.length < 14) flyers.push({ img: Art.goalSprite(key, CS * DPR), x0: sr.left + x, y0: sr.top + y, x1: tg[0], y1: tg[1], t0: clock, dur: 520 * Math.max(SPD, 0.2), sz: CS });
  setTimeout(() => updateGoal(key), 520 * Math.max(SPD, 0.2));
}
function updateGoal(key) { const el = document.querySelector(`#goals .goal[data-k="${key}"]`); if (!el) return; const v = Math.max(0, dispGoals[key]); el.querySelector('b').textContent = v > 0 ? v : ''; el.classList.toggle('done', v <= 0); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function buildHud() {
  const el = $('goals'); el.innerHTML = '';
  for (const k of sortGoals(G.goalStart)) { const d = document.createElement('div'); d.className = 'goal'; d.dataset.k = k; d.appendChild(goalImg(k, 38)); const b = document.createElement('b'); b.textContent = G.goals[k]; d.appendChild(b); el.appendChild(d); }
  $('lvlNo').textContent = 'レベル ' + LVN; $('lvlName').textContent = LV[LVN - 1].name;
  setMoves(); setScore(0);
}
function setMoves() { $('moves').textContent = G.moves; $('movesBox').classList.toggle('low', G.moves <= 5 && G.status === 'play'); }
function setScore(v) { score = v; $('score').textContent = score; }
const PTS = { lamp: 60, b: 10, rocket: 60, bomb: 90, disco: 150, box: 40, drum: 50, router: 300 };

// kill a sprite with a pop animation
function popSprite(id, opt = {}) {
  const s = sprites.get(id); if (!s) return; sprites.delete(id);
  const p = s.p; setScore(score + (PTS[p.t] || 10));
  if (p.t === 'b') burst(s.r, s.c, COLHEX[p.c], 6), burst(s.r, s.c, '#fff', 2, true);
  else if (p.t === 'box') burst(s.r, s.c, p.mx === 2 ? '#9a5f2a' : '#d49a5a', 9), SFX.box();
  else if (p.t === 'drum') burst(s.r, s.c, '#ff8a2a', 8), SFX.drum();
  else if (p.t === 'router') burst(s.r, s.c, '#7cffc4', 12, true);
  else if (p.t === 'lamp') burst(s.r, s.c, COLHEX[p.c] || '#fff', 10, true), SFX.drum();
  if (opt.noGhost) return;
  ghosts.push(s); s.z = 5;
  tween(opt.dur || 170, k => { s.sc = k < 0.35 ? 1 + k * 0.5 : (1.175 * (1 - (k - 0.35) / 0.65)); s.al = 1 - Math.max(0, k - 0.5) * 2; }).then(() => s.dead = 1);
}
function damage(d) { const s = sprites.get(d.id); if (!s) return; s.p.hp = d.hp; s.shk = clock; s.flash = clock; burst(s.r, s.c, '#9a5f2a', 5); SFX.box(); setScore(score + 20); }

// ---------------------------------------------------------------- phase playback
function fxDelay(fx, r, c) {
  const T = 34;
  if (fx.type === 'rocket') { if (fx.dir === 'h' && r === fx.r) return Math.abs(c - fx.c) * T; if (fx.dir === 'v' && c === fx.c) return Math.abs(r - fx.r) * T; return null; }
  if (fx.type === 'cross') { let d = null; if (Math.abs(r - fx.r) <= fx.w) d = Math.abs(c - fx.c) * T; if (Math.abs(c - fx.c) <= fx.w) { const e = Math.abs(r - fx.r) * T; d = d == null ? e : Math.min(d, e); } return d; }
  if (fx.type === 'bomb') return Math.max(Math.abs(r - fx.r), Math.abs(c - fx.c)) * 55;
  if (fx.type === 'all') return Math.max(Math.abs(r - fx.r), Math.abs(c - fx.c)) * 45;
  if (fx.type === 'hammer') return 220;
  if (fx.type === 'shovel') return 120 + c * 40;
  if (fx.type === 'disco') { const i = fx.targets.findIndex(([y, x]) => y === r && x === c); return i < 0 ? null : 260 + i * 22; }
  return 0;
}
function startFx(fx) {
  const t0 = clock, [x0, y0] = cellXY(fx.r, fx.c);
  if (fx.type === 'rocket' || fx.type === 'cross') {
    SFX.drill(); buzz(15); shake = Math.max(shake, 5);
    const lines = []; const w = fx.type === 'cross' ? fx.w : 0;
    if (fx.type === 'rocket') lines.push(fx.dir); else { lines.push('h', 'v'); }
    for (const dir of lines) for (let d = -w; d <= w; d++) {
      const img = Art.sprite({ t: 'rocket', dir }, CS * DPR), len = (dir === 'h' ? G.W : G.H) * 34 * SPD + 120;
      fxs.push({ end: t0 + len, draw(x, t) { const k = (t - t0) / (34 * SPD); for (const sg of [-1, 1]) { const px = dir === 'h' ? x0 + sg * k * CS : x0 + d * CS, py = dir === 'v' ? y0 + sg * k * CS : y0 + d * CS;
        x.save(); x.globalAlpha = 0.5; x.fillStyle = '#fff7b0'; if (dir === 'h') x.fillRect(Math.min(x0, px), py - CS * 0.12, Math.abs(px - x0), CS * 0.24); else x.fillRect(px - CS * 0.12, Math.min(y0, py), CS * 0.24, Math.abs(py - y0)); x.restore();
        x.save(); x.translate(px, py); if (sg < 0) x.scale(dir === 'h' ? -1 : 1, dir === 'v' ? -1 : 1); x.drawImage(img, -CS * 0.6, -CS * 0.6, CS * 1.2, CS * 1.2); x.restore();
        if (Math.random() < 0.5) parts.push({ x: px, y: py, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 300, max: 300, col: '#ffe14a', sz: CS * 0.06 }); } } });
    }
  } else if (fx.type === 'bomb' || fx.type === 'all') {
    SFX.boom(); buzz(fx.type === 'all' ? [40, 30, 60] : 35); shake = Math.max(shake, fx.type === 'all' ? 18 : 12);
    const R = fx.type === 'all' ? Math.max(G.W, G.H) : (fx.rad || 2) + 1.5, dur = 420 * SPD;
    fxs.push({ end: t0 + dur, draw(x, t) { const k = (t - t0) / dur; x.save(); x.globalAlpha = 1 - k; x.strokeStyle = '#fff2a8'; x.lineWidth = CS * 0.4 * (1 - k) + 2; x.beginPath(); x.arc(x0, y0, CS * R * ease.out(k), 0, 7); x.stroke();
      const g = x.createRadialGradient(x0, y0, 0, x0, y0, CS * R * ease.out(k) + 1); g.addColorStop(0, 'rgba(255,240,180,.8)'); g.addColorStop(1, 'rgba(255,140,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(x0, y0, CS * R * ease.out(k) + 1, 0, 7); x.fill(); x.restore(); } });
    for (let i = 0; i < 14; i++) burst(fx.r, fx.c, i % 2 ? '#ffb000' : '#ff5a3a', 2);
  } else if (fx.type === 'disco') {
    SFX.disco(); const col = COLHEX[fx.col] || '#fff', dur = (300 + fx.targets.length * 22) * SPD + 250;
    fxs.push({ end: t0 + dur, draw(x, t) { x.save(); x.lineCap = 'round'; fx.targets.forEach(([r, c], i) => { const st = t0 + (60 + i * 22) * SPD; if (t < st) return; const k = clamp((t - st) / (200 * SPD), 0, 1); const [x1, y1] = cellXY(r, c);
      x.globalAlpha = 0.9 * (1 - clamp((t - st - 300 * SPD) / (200 * SPD), 0, 1)); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); x.stroke(); x.strokeStyle = col; x.lineWidth = 2; x.stroke(); }); x.restore(); } });
  } else if (fx.type === 'combo') { SFX.make(); shake = Math.max(shake, 6); }
  else if (fx.type === 'hammer') {
    const dur = 420 * SPD; setTimeout(() => { SFX.box(); shake = Math.max(shake, 9); burst(fx.r, fx.c, '#ffe14a', 10, true); }, 200 * SPD);
    fxs.push({ end: t0 + dur, draw(x, t) { const k = clamp((t - t0) / dur, 0, 1), a = k < 0.5 ? -1.2 + 1.6 * ease.inq(k * 2) : 0.4; x.save(); x.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1; x.translate(x0 + CS * 0.55, y0 - CS * 0.2); x.rotate(a); x.scale(CS / 32, CS / 32);
      x.fillStyle = '#a0632b'; x.fillRect(-2.5, -4, 5, 30); x.fillStyle = '#5d6878'; x.fillRect(-14, -14, 28, 12); x.fillStyle = '#8b97aa'; x.fillRect(-14, -14, 28, 4); x.restore();
      if (k > 0.48 && k < 0.8) { x.save(); x.globalAlpha = (0.8 - k) * 3; x.strokeStyle = '#fff2a8'; x.lineWidth = 4; x.beginPath(); x.arc(x0, y0, CS * (0.4 + (k - 0.48) * 2), 0, 7); x.stroke(); x.restore(); } } });
  } else if (fx.type === 'shovel') {
    SFX.drill(); shake = Math.max(shake, 7); const dur = (120 + G.W * 40 + 200) * SPD, y = y0;
    fxs.push({ end: t0 + dur, draw(x, t) { const k = (t - t0) / SPD, px = OX + (k - 120) / 40 * CS; x.save(); x.globalAlpha = 0.45; x.fillStyle = '#c99a5a'; x.fillRect(OX, y - CS * 0.45, clamp(px - OX, 0, CS * G.W), CS * 0.9); x.restore();
      x.save(); x.translate(clamp(px, OX - CS, OX + CS * G.W + CS), y); x.scale(CS / 32, CS / 32); x.fillStyle = '#ffb000'; x.beginPath(); x.moveTo(-14, -10); x.lineTo(10, -10); x.lineTo(16, 12); x.lineTo(-10, 12); x.closePath(); x.fill(); x.strokeStyle = '#8a5a00'; x.lineWidth = 2; x.stroke(); x.fillStyle = '#5d6878'; for (let i = -10; i <= 10; i += 6) x.fillRect(i + 4, 12, 3, 5); x.restore();
      if (Math.random() < 0.6) parts.push({ x: px, y, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4, life: 400, max: 400, col: '#a0632b', sz: CS * 0.07 }); } });
  }
}
// unlocked ties and cleared mud ride along with any phase
function playExtras(ph, dly) {
  let m = 0;
  for (const u of ph.unlocked || []) { const d = dly(u.r, u.c); m = Math.max(m, d); tween(1, () => {}, d).then(() => { const s = sprites.get(u.id); if (s) { s.p.lock = 0; s.flash = clock; s.shk = clock; } burst(u.r, u.c, '#2b3346', 6); SFX.box(); goalHit({ t: 'tie' }, u.r, u.c); setScore(score + 30); }); }
  for (const [r, c] of ph.mud || []) { const d = dly(r, c); m = Math.max(m, d); tween(1, () => {}, d).then(() => { if (dispMud) dispMud[r][c] = 0; burst(r, c, '#8a5a2a', 7); goalHit({ t: 'mud' }, r, c); setScore(score + 20); }); }
  return m;
}
async function playPhase(ph) {
  if (ph.kind === 'fall') return playFall(ph);
  if (ph.kind === 'swap') return playSwap(ph);
  if (ph.kind === 'shuffle') return playShuffle(ph);
  if (ph.kind === 'collect') {
    SFX.router(); popText('開通！', ph.removed[0].r - 0.6, ph.removed[0].c, CS * 0.7, '#7cffc4');
    for (const rm of ph.removed) { goalHit(rm.p, rm.r, rm.c); popSprite(rm.id, { dur: 300 }); }
    return wait(320);
  }
  const blast = ph.kind === 'blast' || ph.kind === 'combo' || ph.kind === 'morph';
  if (blast) {
    const [or, oc] = ph.origin || [0, 0];
    if (ph.merge || ph.kind === 'combo') {
      // gather into the new special
      const gather = rm => ph.kind === 'combo' ? rm.merge : rm.p.t === 'b';
      for (const rm of ph.removed) if (!gather(rm)) { goalHit(rm.p, rm.r, rm.c); popSprite(rm.id); }
      await Promise.all(ph.removed.filter(gather).map(rm => { const s = sprites.get(rm.id); if (!s) return null; s.z = 3; const r0 = s.r, c0 = s.c; return tween(140, k => { s.r = r0 + (or - r0) * k; s.c = c0 + (oc - c0) * k; s.sc = 1 - 0.25 * k; }, 0, ease.inq); }));
      for (const rm of ph.removed.filter(gather)) { goalHit(rm.p, rm.r, rm.c); popSprite(rm.id, { noGhost: true }); }
      for (const d of ph.damaged) damage(d);
      playExtras(ph, () => 0);
      for (const sw of ph.swaps || []) swapAnim(sw, 0);
      const n = ph.removed.filter(rm => rm.p.t === 'b').length;
      for (const cr of ph.created) { const s = mkSprite(cr.p, cr.r, cr.c); s.sc = 0; s.flash = clock; s.z = 4; tween(260, k => s.sc = k, 0, ease.back).then(() => s.z = 0); }
      if (ph.kind === 'combo') { startFx(ph.fx[0]); popText(ph.created[0].p.t === 'all' ? 'すべて開通！' : 'コンボ！', or, oc, CS * 0.8, '#ffe14a'); }
      else { SFX.pop(n); SFX.make(); const t = ph.created[0].p.t; popText(t === 'rocket' ? 'ドリル！' : t === 'bomb' ? '融着キット！' : '光ボール！', or, oc, CS * 0.62, '#ffe14a'); if (t === 'disco') pal('taio', 1300); }
      return wait(260);
    }
    if (ph.kind === 'morph') { for (const rm of ph.removed) popSprite(rm.id, { noGhost: true }); for (const cr of ph.created) { const s = mkSprite(cr.p, cr.r, cr.c); s.flash = clock; } return wait(120); }
    // plain blast: pop outward from the tapped cell
    const n = ph.removed.filter(rm => rm.p.t === 'b').length; SFX.pop(n);
    let maxd = 0;
    for (const rm of ph.removed) { const d = (Math.abs(rm.r - or) + Math.abs(rm.c - oc)) * 18; maxd = Math.max(maxd, d); tween(1, () => {}, d).then(() => { goalHit(rm.p, rm.r, rm.c); popSprite(rm.id); }); }
    for (const d of ph.damaged) tween(1, () => {}, 60).then(() => damage(d));
    maxd = Math.max(maxd, playExtras(ph, (r, c) => (Math.abs(r - or) + Math.abs(c - oc)) * 18));
    for (const sw of ph.swaps || []) swapAnim(sw, 60);
    if (n >= 8) popText(n >= 12 ? 'すごい！' : 'ナイス！', or, oc);
    return wait(maxd + 190);
  }
  // wave of specials
  for (const fx of ph.fx) startFx(fx);
  const dly = (r, c) => { let d = null; for (const fx of ph.fx) { const e = fxDelay(fx, r, c); if (e != null) d = d == null ? e : Math.min(d, e); } return d == null ? 0 : d; };
  let maxd = 0;
  for (const rm of ph.removed) {
    if (rm.self) { const s = sprites.get(rm.id); if (s) { sprites.delete(rm.id); if (rm.p.t === 'bomb' || rm.p.t === 'disco') { ghosts.push(s); s.z = 6; tween(200, k => { s.sc = 1 + k * 0.6; s.al = 1 - k; }).then(() => s.dead = 1); } setScore(score + (PTS[rm.p.t] || 50)); } continue; }
    const d = dly(rm.r, rm.c); maxd = Math.max(maxd, d);
    tween(1, () => {}, d).then(() => { goalHit(rm.p, rm.r, rm.c); popSprite(rm.id, { dur: 150 }); });
  }
  for (const cr of ph.created) { const d = dly(cr.r, cr.c); maxd = Math.max(maxd, d); tween(1, () => {}, d).then(() => { const s = mkSprite(cr.p, cr.r, cr.c); s.flash = clock; }); }
  for (const dm of ph.damaged) { const d = dly(dm.r, dm.c); maxd = Math.max(maxd, d); tween(1, () => {}, d).then(() => damage(dm)); }
  for (const sw of ph.swaps || []) { const d = dly(sw.br, sw.bc); maxd = Math.max(maxd, d); swapAnim(sw, d); }
  maxd = Math.max(maxd, playExtras(ph, dly));
  return wait(maxd + 220);
}
function swapAnim(sw, delay) {
  const a = sprites.get(sw.a), b = sprites.get(sw.b); if (!a || !b) return;
  const ar = a.r, br = b.r;
  tween(160, k => { a.r = ar + (sw.ar - ar) * k; b.r = br + (sw.br - br) * k; }, delay, ease.out);
}
function playSwap(ph, back) {
  const a = sprites.get(ph.a.id), b = sprites.get(ph.b.id); if (!a || !b) return wait(0);
  SFX.tick(); const ar = a.r, ac = a.c, br = b.r, bc = b.c; a.z = 4; b.z = 3;
  const go = tween(150, k => { a.r = ar + (br - ar) * k; a.c = ac + (bc - ac) * k; b.r = br + (ar - br) * k; b.c = bc + (ac - bc) * k; a.sc = 1 + Math.sin(k * Math.PI) * 0.15; }, 0, ease.out);
  if (!back) return go.then(() => { a.z = b.z = 0; });
  return go.then(() => { SFX.bonk(); return tween(170, k => { a.r = br + (ar - br) * k; a.c = bc + (ac - bc) * k; b.r = ar + (br - ar) * k; b.c = ac + (bc - ac) * k; }, 40, ease.out); }).then(() => { a.z = b.z = 0; a.r = ar; a.c = ac; b.r = br; b.c = bc; });
}
function playFall(ph) {
  const T = 52, items = [];
  let maxT = 0;
  for (const e of ph.paths) {
    let s = sprites.get(e.id);
    if (!s) { s = mkSprite(e.p, e.path[0][0], e.path[0][1]); }
    const t0 = e.start * T, t1 = t0 + (e.path.length - 1) * T; maxT = Math.max(maxT, t1);
    items.push({ s, e, t0, t1 });
  }
  return tween(maxT, k => {
    const t = k * maxT;
    for (const it of items) {
      if (t < it.t0) continue;
      const pth = it.e.path, f = clamp((t - it.t0) / T, 0, pth.length - 1), i = Math.floor(f), fr = f - i;
      const a = pth[i], b = pth[Math.min(i + 1, pth.length - 1)];
      it.s.r = a[0] + (b[0] - a[0]) * fr; it.s.c = a[1] + (b[1] - a[1]) * fr;
      if (t >= it.t1 && !it.landed) { it.landed = 1; it.s.land = clock; }
    }
  });
}
function playShuffle(ph) {
  SFX.shuffle(); if (!ph.manual) banner('まぜまぜ！<small>消せる組がなくなったよ</small>', 1300);
  const moves = ph.moves.map(m => { const s = sprites.get(m.id); return s ? { s, r0: s.r, c0: s.c, m } : null; }).filter(Boolean);
  for (const rc of ph.recolor || []) { const s = sprites.get(rc.id); if (s) s.p.c = rc.c; }
  if (ph.manual) banner('まぜる！', 900);
  return tween(520, k => { for (const o of moves) { const kk = ease.out(k); o.s.r = o.r0 + (o.m.r - o.r0) * kk - Math.sin(k * Math.PI) * 0.8; o.s.c = o.c0 + (o.m.c - o.c0) * kk; o.s.rot = Math.sin(k * Math.PI) * 0.6; } }).then(() => moves.forEach(o => o.s.rot = 0));
}
// make sprites exactly match the engine grid (safety net after animations)
function syncAll() {
  const seen = new Set(); dispMud = G.mud.map(row => row.slice());
  for (let r = 0; r < G.H; r++) for (let c = 0; c < G.W; c++) { const p = G.grid[r][c]; if (!p || G.hole[r][c]) continue; seen.add(p.id);
    let s = sprites.get(p.id); if (!s) s = mkSprite(p, r, c); s.r = r; s.c = c; s.sc = 1; s.al = 1; s.rot = 0; s.z = 0; s.p = Object.assign({}, p); }
  for (const id of [...sprites.keys()]) if (!seen.has(id)) sprites.delete(id);
  // group badges: what special would this group make?
  for (const s of sprites.values()) s.badge = null;
  for (const o of G.options()) if (o.kind === 'group' && o.size >= 5) { const k = o.size >= 9 ? 'disco' : o.size >= 7 ? 'bomb' : 'rocket'; for (const [r, c] of o.cells) { const p = G.grid[r][c]; const s = p && sprites.get(p.id); if (s) s.badge = k; } }
}

// ---------------------------------------------------------------- hint
function showHint() {
  const opts = G.options(); if (!opts.length) return;
  let best = opts.find(o => o.kind !== 'group' && o.size > 1) || null;
  if (!best) best = opts.reduce((a, o) => (o.kind === 'group' && (!a || o.size > a.size)) ? o : a, null) || opts[0];
  const ids = new Set(); const cells = best.kind === 'group' ? best.cells : G.specialCluster(best.r, best.c);
  for (const [r, c] of cells) { const p = G.grid[r][c]; if (p) ids.add(p.id); }
  hintCells = ids;
}
function clearHint() { hintCells = null; lastInput = performance.now(); }

// ---------------------------------------------------------------- game flow
function startLevel(n, seed, pre) {
  LVN = n; playId++; const L = LV[n - 1];
  G = new Game(L, seed != null ? seed : (Math.random() * 1e9) | 0);
  const placed = pre && pre.length ? G.placeStart(pre) : []; for (const pl of placed) { const k = pl.p.t; SV.inv[k] = Math.max(0, inv(k) - 1); } if (placed.length) persist();
  mode = null; $('modeTip').classList.remove('show');
  dispGoals = Object.assign({}, G.goals); lowWarned = false; busy = false; paused = false; document.body.classList.remove('paused');
  sprites.clear(); ghosts = []; parts = []; fxs = []; flyers = []; texts = []; tweens.forEach(w => w.res()); tweens = []; clearHint();
  show('game'); buildHud(); syncAll(); buildBoostBar();
  resize();   // v1.1.3: measure the board AFTER the HUD/goal bar and booster bar exist (they shrink #stage)
  // drop-in intro
  const myId = playId; busy = true;
  for (const s of sprites.values()) { const r1 = s.r; s.r = r1 - G.H - 1; tween(420, k => s.r = r1 - (G.H + 1) * (1 - k), (G.W - s.c) * 18 + (G.H - r1) * 10, ease.out).then(() => s.land = clock); }
  pal('shuppatsu', 1500);
  banner(`レベル ${n}<small>${L.name}</small>`, 1300);
  wait(700).then(() => { if (myId === playId) { busy = false; clearHint(); } });
  if (placed.length) wait(650).then(() => { if (myId !== playId) return; SFX.make(); for (const pl of placed) { const s = sprites.get(pl.p.id); if (s) { s.flash = clock; tween(300, k => s.sc = 1 + Math.sin(k * Math.PI) * 0.4); } burst(pl.r, pl.c, '#ffe14a', 10, true); } popText('道具セット！', G.H / 2 - 0.5, G.W / 2 - 0.5, CS * 0.7, '#ffe14a'); });
}
const canAct = () => G && !busy && !paused && G.status === 'play';
async function tapCell(r, c) {
  if (!canAct()) return false;
  if (mode) return useBoostAt(r, c);
  clearHint();
  const phases = G.tap(r, c);
  if (!phases) { const p = G.at(r, c); const s = p && sprites.get(p.id); if (s) { s.shk = clock; } SFX.bonk(); return false; }
  return runPhases(phases);
}
async function swapCells(r1, c1, r2, c2) {
  if (!canAct() || mode) return false;
  if (!G.inb(r2, c2)) return false;
  clearHint();
  const phases = G.swap(r1, c1, r2, c2);
  if (!phases) {
    const a = G.at(r1, c1), b = G.at(r2, c2);
    if (G.canSwap(a) && G.canSwap(b)) { busy = true; const myId = playId; await playSwap({ a: { id: a.id }, b: { id: b.id } }, true); if (myId === playId) { busy = false; syncAll(); } }
    else { const s = a && sprites.get(a.id); if (s) s.shk = clock; SFX.bonk(); }
    return false;
  }
  return runPhases(phases);
}
async function runPhases(phases) {
  busy = true; const myId = playId; setMoves();
  for (const ph of phases) { await playPhase(ph); if (myId !== playId) return true; }
  dispGoals = Object.assign({}, G.goals); for (const k in dispGoals) updateGoalQuiet(k);
  syncAll(); setMoves();
  if (G.status === 'win') { await winSeq(myId); return true; }
  if (G.status === 'lose') { await wait(500); if (myId === playId) loseSeq(); return true; }
  if (G.moves <= 3 && !lowWarned) { lowWarned = true; pal('chui', 1400); }
  busy = false; clearHint();
  return true;
}
// ---------------------------------------------------------------- boosters (earned, never sold)
const ICON = {
  hammer: '<svg viewBox="0 0 32 32"><g transform="rotate(35 16 16)"><rect x="13.5" y="9" width="5" height="21" rx="2" fill="#a0632b"/><rect x="5" y="3" width="22" height="10" rx="2.5" fill="#5d6878"/><rect x="5" y="3" width="22" height="3" rx="1.5" fill="#9aa6ba"/></g></svg>',
  shovel: '<svg viewBox="0 0 32 32"><rect x="14.5" y="2" width="3.5" height="16" fill="#a0632b"/><rect x="11" y="1" width="10" height="3.5" rx="1.7" fill="#2b3346"/><path d="M8 16h16l-2.5 9.5a5.6 5.6 0 0 1-11 0z" fill="#ffb000" stroke="#8a5a00" stroke-width="1.5"/></svg>',
  mix: '<svg viewBox="0 0 32 32" fill="none" stroke="#1b4b9b" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h7l11 14h6M3 23h7l11-14h6" stroke-width="3.6"/><path d="M24 4.5l4.5 4.5L24 13.5M24 18.5l4.5 4.5L24 27.5" stroke-width="3"/></svg>',
};
const BOOST = { hammer: { n: 'ハンマー', u: 8, tip: '壊したい所をタップ' }, shovel: { n: 'ショベル', u: 14, tip: '掘りたい横の列をタップ' }, mix: { n: 'まぜる', u: 18 } };
const PRE = { rocket: { n: 'ドリル', u: 11 }, bomb: { n: '融着キット', u: 16 }, disco: { n: '光ボール', u: 22 } };
const ITEM_NAME = k => (BOOST[k] || PRE[k]).n;
const itemImg = k => ICON[k] ? `<span class="ico">${ICON[k]}</span>` : `<img src="${Art.sprite(k === 'rocket' ? { t: 'rocket', dir: 'h' } : k === 'disco' ? { t: 'disco', c: 0 } : { t: k }, 96).toDataURL()}" alt="">`;
const reached = () => Math.max(unlocked(), LVN);
const inv = k => SV.inv[k] || 0;
function buildBoostBar() {
  // v1.1.3: buttons are created once and then only updated in place. Rebuilding them while a finger is still down
  // put a NEW button under the finger, so the click that follows the tap toggled the item straight back off.
  const bar = $('boostBar'), keys = Object.keys(BOOST);
  if (bar.children.length !== keys.length || keys.some((k, i) => bar.children[i].dataset.k !== k)) {
    bar.innerHTML = '';
    for (const k of keys) { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; fastTap(b, () => pickBoost(k)); bar.appendChild(b); }
  }
  for (const b of bar.children) {
    const k = b.dataset.k, ok = reached() >= BOOST[k].u, cls = 'bst' + (ok ? '' : ' lock') + (mode === k ? ' on' : '') + (ok && !inv(k) ? ' zero' : '');
    const html = ICON[k] + `<span>${BOOST[k].n}</span>` + (ok ? `<span class="n">${inv(k)}</span>` : `<span class="n">🔒</span>`);
    if (b.className !== cls) b.className = cls;
    if (b._h !== html) { b.innerHTML = html; b._h = html; }
    b.setAttribute('aria-pressed', mode === k ? 'true' : 'false');
  }
}
function setMode(m) { mode = m; const t = $('modeTip'); t.textContent = m ? BOOST[m].tip + '（もう一度押すとやめる）' : ''; t.classList.toggle('show', !!m); buildBoostBar(); }
let lastPick = { k: null, t: 0 };
async function pickBoost(k) {
  const now = performance.now(); if (lastPick.k === k && now - lastPick.t < 400) return; lastPick = { k, t: now };   // one tap = one toggle, whatever events follow
  if (!G || paused || G.status !== 'play') return;
  if (reached() < BOOST[k].u) { SFX.bonk(); toast(`レベル${BOOST[k].u}で使えるようになるよ`); return; }
  if (mode === k) { SFX.tick(); setMode(null); return; }
  if (busy) {   // v1.1.3: don't silently drop the tap while blocks are still falling; apply it as soon as the board settles
    const id = playId, t0 = performance.now();
    while (busy && performance.now() - t0 < 4000) await new Promise(r => setTimeout(r, 50));
    if (busy || id !== playId || !G || paused || G.status !== 'play' || mode === k) return;
  }
  if (!inv(k)) { SFX.bonk(); toast('もう持っていないよ。ボスや★宝箱でもらえるよ'); return; }
  SFX.tick();
  if (k === 'mix') { const ph = G.mix(); if (!ph) { SFX.bonk(); return; } ph[0].manual = 1; SV.inv.mix--; persist(); setMode(null); clearHint(); return runPhases(ph); }
  setMode(k);
}
async function useBoostAt(r, c) {
  const k = mode, ph = k === 'hammer' ? G.hammer(r, c) : G.shovel(r);
  if (!ph) { SFX.bonk(); return false; }
  SV.inv[k]--; persist(); setMode(null); clearHint();
  return runPhases(ph);
}
function drawMode(t) {
  const a = 0.5 + 0.5 * Math.sin(t / 160); cx.save(); cx.strokeStyle = `rgba(255,225,74,${0.5 + a * 0.5})`; cx.lineWidth = 4; cx.setLineDash([10, 8]); cx.lineDashOffset = -t / 30;
  cx.strokeRect(OX - 6, OY - 6, CS * G.W + 12, CS * G.H + 12);
  if (mode === 'shovel' && hover) { cx.setLineDash([]); cx.fillStyle = 'rgba(255,225,74,.25)'; cx.fillRect(OX, OY + hover[0] * CS, CS * G.W, CS); }
  if (mode === 'hammer' && hover) { cx.setLineDash([]); cx.strokeRect(OX + hover[1] * CS + 2, OY + hover[0] * CS + 2, CS - 4, CS - 4); }
  cx.restore();
}
let hover = null;
function toast(msg) { banner(`<small>${msg}</small>`, 1400); }
// pre-level picks
let prePick = new Set();
function buildPre(n) {
  const row = $('sPre'); row.innerHTML = ''; let any = false;
  for (const k in PRE) {
    const ok = Math.max(unlocked(), n) >= PRE[k].u; if (!ok) continue; any = true;
    const b = document.createElement('button'); b.className = 'pre' + (prePick.has(k) ? ' on' : '') + (inv(k) ? '' : ' zero'); b.title = PRE[k].n; b.dataset.k = k;
    b.innerHTML = itemImg(k) + `<span class="n">${inv(k)}</span>`;
    b.onclick = () => { if (!inv(k)) { SFX.bonk(); return; } SFX.tick(); prePick.has(k) ? prePick.delete(k) : prePick.add(k); buildPre(n); };
    row.appendChild(b);
  }
  $('sPreWrap').hidden = !any;
}
// rewards
function newUnlocks(n) {
  const got = [];
  for (const [k, d] of Object.entries(Object.assign({}, BOOST, PRE))) if (n >= d.u && !SV.got[k]) { SV.got[k] = 1; SV.inv[k] = inv(k) + 3; got.push([k, 3]); }
  return got;
}
function randItems(cnt, n) {
  const pool = Object.keys(Object.assign({}, BOOST, PRE)).filter(k => n >= (BOOST[k] || PRE[k]).u); if (!pool.length) return [];
  const out = {}; for (let i = 0; i < cnt; i++) { const k = pool[Math.floor(Math.random() * pool.length)]; out[k] = (out[k] || 0) + 1; SV.inv[k] = inv(k) + 1; }
  return Object.entries(out);
}
let giftQ = [];
function queueGift(title, msg, items) { if (items.length) giftQ.push({ title, msg, items }); }
function showGift() {
  const g = giftQ.shift(); if (!g) return false;
  $('gTitle').textContent = g.title; $('gMsg').textContent = g.msg;
  $('gItems').innerHTML = g.items.map(([k, v]) => `<div class="goal gi">${itemImg(k)}<b>×${v}</b><small>${ITEM_NAME(k)}</small></div>`).join('');
  $('ovGift').hidden = false; SFX.star(2); return true;
}
$('gOk').onclick = () => { SFX.tick(); $('ovGift').hidden = true; if (!showGift() && giftAfter) { const f = giftAfter; giftAfter = null; f(); } };
let giftAfter = null;

function updateGoalQuiet(k) { const el = document.querySelector(`#goals .goal[data-k="${k}"]`); if (!el) return; const v = Math.max(0, dispGoals[k]); el.querySelector('b').textContent = v > 0 ? v : ''; el.classList.toggle('done', v <= 0); }
async function winSeq(myId) {
  const stars = G.stars(); busy = true;
  await wait(250);
  if (BGM) BGM.play(null); buzz([50, 40, 80]);
  banner('開通！<small>目標達成</small>', 1300); SFX.win(); pal('kanryo', 1800);
  await wait(1100);
  // bonus: leftover moves become drills, several at once; tap anywhere / スキップ to finish instantly
  if (G.moves > 0) {
    banner('ボーナス！<small>タップでスキップ</small>', 1100);
    bonusSkip = false; $('skipBtn').hidden = false;
    await wait(350);
    while (G.moves > 0 && !bonusSkip) {
      const n = G.moves >= 9 ? 3 : G.moves >= 4 ? 2 : 1;
      const ph = G.bonusRocket(n); if (!ph) break; setMoves(); setScore(score + 100 * ph.rockets);
      for (const p of ph) { if (bonusSkip) { setScore(score + phaseScore(p)); continue; } await playPhase(p); }
      if (myId !== playId) { $('skipBtn').hidden = true; return; }
      syncAll();
    }
    if (bonusSkip) { // resolve the rest in the engine only, same scoring as the animations
      tweens.forEach(w => w.res()); tweens = []; fxs = []; flyers = []; texts = []; ghosts = []; parts = [];
      while (G.moves > 0) { const ph = G.bonusRocket(G.moves >= 9 ? 3 : G.moves >= 4 ? 2 : 1); if (!ph) break; score += 100 * ph.rockets; for (const p of ph) score += phaseScore(p); }
      setScore(score); syncAll(); for (const k in dispGoals) { dispGoals[k] = G.goals[k]; updateGoalQuiet(k); }
    }
    setScore(score + G.moves * 150); G.moves = 0; setMoves(); $('skipBtn').hidden = true;
  }
  if (myId !== playId) return;
  syncAll();
  const prevStars = SV.stars[LVN] || 0, starsBefore = starTotal(); SV.stars[LVN] = Math.max(prevStars, stars);
  const kd = LV[LVN - 1].kind; let gl = [];
  if (!prevStars && (kd === 'boss' || kd === 'bigboss')) { const it = randItems(kd === 'bigboss' ? 3 : 1, LVN + 1); if (it.length) { queueGift(kd === 'bigboss' ? '大ボス撃破！' : 'ボス撃破！', 'ごほうびの道具をどうぞ', it); gl.push('ボス報酬'); } }
  const chests = Math.floor(starTotal() / 30) - Math.floor(starsBefore / 30);
  for (let i = 0; i < chests; i++) { const it = randItems(2, LVN + 1); if (it.length) { queueGift('★宝箱オープン！', `★を${Math.floor(starTotal() / 30) * 30}個集めたよ`, it); gl.push('★宝箱'); } }
  const nu = newUnlocks(Math.min(LV.length, LVN + 1)); if (nu.length) { queueGift('新しい道具！', 'これから使えるよ。3個プレゼント！', nu); gl.push('新しい道具'); }
  $('wGift').textContent = gl.length ? '🎁 ' + gl.join('・') + ' をゲット！' : '';
  const prevBest = SV.best[LVN] || 0; if (score > prevBest) SV.best[LVN] = score; persist();
  $('wTitle').textContent = `レベル ${LVN} クリア！`; $('wScore').textContent = score; $('wBest').textContent = score > prevBest && prevBest ? 'ベスト更新！' : (prevBest ? `ベスト ${prevBest}` : '');
  const is = $('wStars').querySelectorAll('i'); is.forEach(i => i.className = '');
  $('wNext').textContent = LVN < LV.length ? '次のレベルへ' : 'マップへ（全レベル制覇！）';
  closeOverlays(); $('ovWin').hidden = false;
  for (let i = 0; i < stars; i++) { await wait(330); is[i].className = 'on'; SFX.star(i); }
}
// score that the animations would award for one phase (used when the bonus is skipped)
function phaseScore(ph) {
  let v = 0;
  for (const rm of ph.removed || []) v += rm.self ? (PTS[rm.p.t] || 50) : (PTS[rm.p.t] || 10);
  v += (ph.damaged || []).length * 20 + (ph.unlocked || []).length * 30 + (ph.mud || []).length * 20;
  return v;
}
let bonusSkip = false;
function skipBonus() { if ($('skipBtn').hidden || bonusSkip) return; bonusSkip = true; SFX.tick(); }
$('skipBtn').addEventListener('click', e => { e.stopPropagation(); skipBonus(); });
function loseSeq() {
  if (BGM) BGM.play(null);
  SFX.lose(); goalRow($('lGoals'), Object.fromEntries(Object.entries(G.goals).filter(([, v]) => v > 0)));
  closeOverlays(); $('ovLose').hidden = false;
}
const afterGifts = f => { if (showGift()) giftAfter = f; else f(); };
$('wNext').onclick = () => { SFX.tick(); closeOverlays(); afterGifts(() => { if (LVN < LV.length) { show('map'); openStart(LVN + 1); } else show('map'); }); };
$('wMap').onclick = () => { SFX.tick(); closeOverlays(); afterGifts(() => show('map')); };
$('lRetry').onclick = () => { SFX.tick(); closeOverlays(); startLevel(LVN); bgmFor('game'); };
$('lMap').onclick = () => { SFX.tick(); closeOverlays(); show('map'); };

// pause
function pause() { if (screen !== 'game' || !G || G.status !== 'play' || paused) return; paused = true; if (BGM) BGM.pause(true); document.body.classList.add('paused'); $('pSound').checked = SV.sound; closeOverlays(); $('ovPause').hidden = false; }
function resume() { paused = false; if (BGM) BGM.pause(false); document.body.classList.remove('paused'); $('ovPause').hidden = true; clearHint(); }
fastTap($('gPause'), () => { SFX.tick(); pause(); });
$('pResume').onclick = () => { SFX.tick(); resume(); };
$('pRetry').onclick = () => { SFX.tick(); resume(); startLevel(LVN); };
$('pMap').onclick = () => { SFX.tick(); resume(); playId++; G = null; show('map'); };
$('pSound').onchange = e => { SV.sound = e.target.checked; persist(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); persist(); appSleep(true); } else appSleep(false); });
// app/background: silence everything (Android wrapper calls these from onPause/onResume)
function appSleep(v) { try { if (v) iosSessionSleep(); if (BGM) BGM.pause(v || paused); if (AC) { if (v) AC.suspend(); else AC.resume().then(() => { if (BGM) { BGM.kick(); BGM.pause(paused); } }, () => {}); } } catch (e) {} }

// input
// tap = blast the group; swipe = swap with the neighbour (both work everywhere).
// Pointer events AND touch events both feed ONE gesture: whichever stream reports first starts it, every move from
// either stream updates it, and the first release finishes it. So if a WebView cancels or drops one stream
// (pointercancel, lost capture, missing pointermove), the other one still completes the swipe.
const SWIPE = 0.3;
let gest = null, lastIn = null, probe = false;   // probe: tests resolve cells without playing them   // lastIn: last resolved cell/swipe target (diagnostics + regression test)
const xyOf = (cx0, cy0) => { fitCheck(); const r0 = cv.getBoundingClientRect(); const x = (cx0 - r0.left) * (r0.width ? VW / r0.width : 1), y = (cy0 - r0.top) * (r0.height ? VH / r0.height : 1); return [Math.floor((y - OY) / CS), Math.floor((x - OX) / CS), x, y]; };
function gStart(X, Y) {
  if (!$('skipBtn').hidden) { skipBonus(); return false; }
  const now = performance.now();
  if (gest && now - gest.last < 700) return true;            // same finger, reported by the other stream
  if (!G) return false; const [r, c, x, y] = xyOf(X, Y);
  if (r < 0 || c < 0 || r >= G.H || c >= G.W) { gest = null; return false; }
  gest = { r, c, x, y, done: false, last: now }; hover = [r, c]; lastIn = { r, c, swipe: null }; return true;
}
function gMove(X, Y) {
  const [r, c, x, y] = xyOf(X, Y); if (mode) hover = [r, c];
  if (!gest || gest.done || mode) return; gest.last = performance.now();
  const dx = x - gest.x, dy = y - gest.y, th = CS * SWIPE;
  if (Math.abs(dx) < th && Math.abs(dy) < th) return;
  gest.done = true; const g = gest;
  const [tr, tc] = Math.abs(dx) > Math.abs(dy) ? [g.r, g.c + Math.sign(dx)] : [g.r + Math.sign(dy), g.c];
  if (lastIn) lastIn.swipe = [tr, tc];
  if (!probe) swapCells(g.r, g.c, tr, tc);
}
function gEnd(X, Y) {
  if (!gest) return;
  if (X != null) gMove(X, Y);                                  // fast flick: decide on release
  const g = gest; gest = null;
  if (!g.done && !probe) tapCell(g.r, g.c);
}
cv.addEventListener('pointerdown', e => { if (gStart(e.clientX, e.clientY) && e.pointerType === 'mouse') { try { cv.setPointerCapture(e.pointerId); } catch (_) {} } });
cv.addEventListener('pointermove', e => gMove(e.clientX, e.clientY));
cv.addEventListener('pointerup', e => gEnd(e.clientX, e.clientY));
cv.addEventListener('pointercancel', e => { if (gest) gMove(e.clientX, e.clientY); });   // keep the gesture: touchend will finish it
const tch = e => e.changedTouches && e.changedTouches[0];
cv.addEventListener('touchstart', e => { const t = tch(e); if (t) gStart(t.clientX, t.clientY); if (e.cancelable) e.preventDefault(); }, { passive: false });
cv.addEventListener('touchmove', e => { const t = tch(e); if (t) gMove(t.clientX, t.clientY); if (e.cancelable) e.preventDefault(); }, { passive: false });
cv.addEventListener('touchend', e => { const t = tch(e); gEnd(t ? t.clientX : null, t ? t.clientY : null); if (e.cancelable) e.preventDefault(); }, { passive: false });
cv.addEventListener('touchcancel', e => { const t = tch(e); if (t) gMove(t.clientX, t.clientY); setTimeout(() => { if (gest && performance.now() - gest.last > 600) gest = null; }, 700); }, { passive: false });
// buttons that must react instantly and reliably: fire on release (pointer or touch), ignore the click that follows
function fastTap(el, fn) {
  let downAt = 0, fired = 0;
  const go = e => { const n = performance.now(); if (n - fired < 450) return; fired = n; fn(e); };
  el.addEventListener('pointerdown', () => { downAt = performance.now(); });
  el.addEventListener('touchstart', () => { downAt = performance.now(); }, { passive: true });
  el.addEventListener('pointerup', e => { if (performance.now() - downAt < 1500) go(e); });
  el.addEventListener('touchend', e => { if (performance.now() - downAt < 1500) { go(e); if (e.cancelable) e.preventDefault(); } }, { passive: false });
  el.addEventListener('click', go);
}

// ---------------------------------------------------------------- diagnostics (errors + input log, hidden debug panel)
const DBG = { ev: [], err: [], t0: Date.now() };
function dbgPush(list, item, max) { list.push(item); if (list.length > max) list.shift(); }
function dbgDesc(t) { if (!t || !t.tagName) return String(t); return t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') + (t.className && typeof t.className === 'string' ? '.' + t.className.split(' ')[0] : ''); }
let dbgLastMove = 0;
['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'click'].forEach(type => document.addEventListener(type, e => {
  if ((type === 'pointermove' || type === 'touchmove') && Date.now() - dbgLastMove < 120) return; if (type.endsWith('move')) dbgLastMove = Date.now();
  const p = e.touches ? (e.changedTouches && e.changedTouches[0]) : e;
  dbgPush(DBG.ev, `${((Date.now() - DBG.t0) / 1000).toFixed(2)} ${type}${e.pointerType ? '(' + e.pointerType + ')' : ''} ${dbgDesc(e.target)} ${p && p.clientX != null ? Math.round(p.clientX) + ',' + Math.round(p.clientY) : ''}${e.defaultPrevented ? ' prevented' : ''}`, 40);
}, { capture: true, passive: true }));
function showErr(msg) {
  dbgPush(DBG.err, `${((Date.now() - DBG.t0) / 1000).toFixed(1)} ${msg}`, 20);
  try { const t = document.getElementById('errToast'); if (t) { t.textContent = '⚠ エラー: ' + String(msg).slice(0, 140); t.hidden = false; clearTimeout(showErr.t); showErr.t = setTimeout(() => { t.hidden = true; }, 6000); } } catch (e) {}
}
window.addEventListener('error', e => showErr((e.message || 'error') + (e.filename ? ' @' + String(e.filename).split('/').pop() + ':' + e.lineno : '')));
window.addEventListener('unhandledrejection', e => showErr('promise: ' + (e.reason && (e.reason.message || e.reason))));
function dbgReport() {
  const lines = [], add = s => lines.push(s);
  add(`v${VERSION} ${IS_APP ? 'APP(file:)' : 'WEB'} ${location.protocol}`);
  add(navigator.userAgent);
  add(`view ${innerWidth}x${innerHeight} dpr ${devicePixelRatio} touch ${navigator.maxTouchPoints || 0} PE ${'PointerEvent' in window} TE ${'ontouchstart' in window}`);
  add(`screen ${screen} lvl ${LVN} busy ${busy} paused ${paused} mode ${mode} status ${G ? G.status : '-'} gest ${gest ? JSON.stringify(gest) : '-'} ls ${(() => { try { localStorage.setItem('__t', '1'); return 'ok'; } catch (e) { return 'NO'; } })()}`);
  if (G && screen === 'game') {
    const hit = (x, y) => dbgDesc(document.elementFromPoint(x, y));
    { const r = cv.getBoundingClientRect(); add(`canvas css ${Math.round(r.width)}x${Math.round(r.height)} vs layout ${Math.round(VW)}x${Math.round(VH)}${Math.abs(r.height - VH) > 1 || Math.abs(r.width - VW) > 1 ? ' MISMATCH' : ' ok'}; last cell ${JSON.stringify(lastIn)}`); }
    const [bx, by] = (() => { const r = cv.getBoundingClientRect(); return [r.left + OX + CS * G.W / 2, r.top + OY + CS * G.H / 2]; })();
    add(`board centre -> ${hit(bx, by)}; CS ${CS}`);
    document.querySelectorAll('#boostBar .bst').forEach(b => { const r = b.getBoundingClientRect(); add(`booster ${b.dataset.k} [${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}] -> ${hit(r.left + r.width / 2, r.top + r.height / 2)}`); });
  }
  add('--- errors'); DBG.err.forEach(add); add('--- input (latest last)'); DBG.ev.forEach(add);
  return lines.join('\n');
}
function openDebug() { $('dbgText').textContent = dbgReport(); $('ovDebug').hidden = false; }
let verTaps = [];
function verTap() { const n = Date.now(); verTaps = verTaps.filter(t => n - t < 2500); verTaps.push(n); if (verTaps.length >= 5) { verTaps = []; openDebug(); } }

// ---------------------------------------------------------------- map menu
const OBST = [
  { k: 'box', n: '段ボール', u: 3, d: 'となりで消すと壊れる。2重の箱もあるよ' },
  { k: 'drum', n: 'ケーブルドラム', u: 5, d: 'となりで消すと回収できる' },
  { k: 'router', n: 'ルーター', u: 6, d: '一番下まで落とすと開通！' },
  { k: 'lamp', n: '信号灯', u: 35, d: '同じ色をとなりで消すと点灯して消える' },
  { k: 'mud', n: '泥', u: 45, d: '上のブロックを消すと泥もきれいになる' },
  { k: 'tie', n: '結束バンド', u: 63, d: 'しばられたブロックは動かない。となりで消すかスペシャルで外す' },
  { k: 'steel', n: '鋼鉄コンテナ', u: 83, d: '3回当てないと壊れない頑丈な箱' },
];
let menuTab = 'set';
const obstImg = k => (k === 'steel' ? Art.sprite({ t: 'box', hp: 3, mx: 3 }, 96) : Art.goalSprite(k, 96)).toDataURL();
const spImg = p => Art.sprite(p, 96).toDataURL();
function openMenu(tab) { if (tab) menuTab = tab; SFX.tick(); renderMenu(); $('ovMenu').hidden = false; }
function closeMenu() { $('ovMenu').hidden = true; }
function swRow(label, sub, key, dis) { return `<div class="mrow"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span><button class="sw${SV[key] ? ' on' : ''}" data-sw="${key}" ${dis ? 'disabled' : ''} aria-label="${label}"></button></div>`; }
function segRow(label, sub, key, opts) { return `<div class="mrow"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span><div class="seg">${opts.map(([v, t]) => `<button data-seg="${key}" data-v="${v}" class="${String(SV[key]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div></div>`; }
function renderMenu() {
  document.querySelectorAll('#muTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === menuTab));
  const cur = unlocked(), B = $('muBody'); let h = '';
  if (menuTab === 'set') {
    h += swRow('効果音', 'ブロックを消す音など', 'sound');
    h += swRow('BGM', 'オリジナルのオールドジャズ', 'bgm');
    h += `<div class="mrow"><span>BGMの音量</span><input type="range" id="muVol" min="0" max="100" value="${Math.round(SV.bgmVol * 100)}" style="width:46%"></div>`;
    h += swRow('バイブ', IS_APP ? 'アプリ版では使えません（権限なしのため）' : 'スペシャル発動でブルッ（対応端末のみ）', 'vib', IS_APP);
    h += segRow('演出', 'ひかえめ＝ゆれ・粒を少なく', 'fx', [['full', 'ふつう'], ['lite', 'ひかえめ']]);
    h += segRow('アニメの速さ', '', 'fast', [[false, 'ふつう'], [true, 'はやい']]);
    if (BGM) h += `<h4>BGM一覧</h4>` + Object.values(BGM.TRACKS).map(t => `<div class="mrow"><span>♪ ${t.title}<small>${t === BGM.TRACKS.map ? 'マップ' : t === BGM.TRACKS.level ? '通常レベル' : t === BGM.TRACKS.boss ? 'ボス・大ボス' : 'ひと休みレベル'}</small></span></div>`).join('');
  } else if (menuTab === 'how') {
    h += `<h4>👆 タップ</h4><p>同じ色が2つ以上くっついている所をタップすると消えるよ。</p>`;
    h += `<h4>👉 スワイプ</h4><p>となりのブロックと入れかえ（1手）。入れかえ先でまとまれば消える。何も起きないときは元にもどって手数は減らないよ。スペシャルを動かすとその場で発動！</p>`;
    h += `<h4>✨ スペシャル</h4>`;
    h += [[{ t: 'rocket', dir: 'h' }, 'ドリル', '5〜6個で完成。一列まるごと掘る'], [{ t: 'bomb' }, '融着キット', '7〜8個で完成。まわりを大爆発'], [{ t: 'disco', c: 0 }, '光ボール', '9個以上で完成。同じ色を全部消す']].map(([p, n, d]) => `<div class="mrow"><img src="${spImg(p)}" alt=""><span>${n}<small>${d}</small></span></div>`).join('');
    h += `<h4>💥 コンボ</h4><p>スペシャル同士がとなりにあるとき、タップかスワイプで合体！ドリル×ドリル＝十字、ドリル×融着キット＝太い十字、融着キット×2＝特大爆発、光ボール×スペシャル＝全部がそのスペシャルに、光ボール×2＝全消し！</p>`;
    h += `<h4>🚧 障害物（Lv${cur}まで）</h4>` + OBST.map(o => o.u <= cur ? `<div class="mrow"><img src="${obstImg(o.k)}" alt=""><span>${o.n}<small>${o.d}</small></span></div>` : `<div class="mrow lock"><span>？？？<small>レベル${o.u}で登場</small></span></div>`).join('');
  } else if (menuTab === 'item') {
    h += `<p>道具は買えません。遊んでもらおう！<br>・新しい道具が使えるようになると3個プレゼント<br>・ボス初クリアで+1、大ボス初クリアで+3<br>・★を30個集めるごとに宝箱で+2</p>`;
    h += `<h4>ゲーム中に使う（手数は減らない）</h4>` + Object.entries(BOOST).map(([k, d]) => `<div class="mrow${cur >= d.u ? '' : ' lock'}"><span class="ico">${ICON[k]}</span><span>${d.n}<small>${k === 'hammer' ? 'ブロック・障害物を1回たたく' : k === 'shovel' ? '横一列をまとめて掘る' : 'ブロックをまぜ直す'}${cur >= d.u ? '' : `（レベル${d.u}で解放）`}</small></span><b class="cnt">${cur >= d.u ? '×' + inv(k) : '🔒'}</b></div>`).join('');
    h += `<h4>スタート時に置く</h4>` + Object.entries(PRE).map(([k, d]) => `<div class="mrow${cur >= d.u ? '' : ' lock'}">${itemImg(k)}<span>${d.n}<small>スタート画面で選ぶと盤面に置かれる${cur >= d.u ? '' : `（レベル${d.u}で解放）`}</small></span><b class="cnt">${cur >= d.u ? '×' + inv(k) : '🔒'}</b></div>`).join('');
  } else if (menuTab === 'rec') {
    const cleared = Object.keys(SV.stars).filter(k => SV.stars[k] > 0).length, three = Object.values(SV.stars).filter(v => v >= 3).length;
    let boss = 0, big = 0; for (const k in SV.stars) { const l = LV[k - 1]; if (!l || !SV.stars[k]) continue; if (l.kind === 'boss') boss++; if (l.kind === 'bigboss') big++; }
    const nB = LV.filter(l => l.kind === 'boss').length, nBB = LV.filter(l => l.kind === 'bigboss').length;
    const best = Object.values(SV.best).reduce((a, b) => a + b, 0), ar = AREAS[Math.min(AREAS.length - 1, Math.floor((cur - 1) / 50))];
    h += `<div class="stat"><div><b>★${starTotal()}</b><small>/ ${LV.length * 3}</small></div><div><b>${cleared}</b><small>クリア / ${LV.length}</small></div><div><b>${three}</b><small>★3つのレベル</small></div><div><b>${boss + big}</b><small>ボス撃破 / ${nB + nBB}</small></div><div><b>${big}</b><small>大ボス撃破 / ${nBB}</small></div><div><b>${best.toLocaleString()}</b><small>ベストスコア合計</small></div></div>`;
    h += `<p style="text-align:center;margin-top:10px">いまの現場：<b>${ar.name}エリア</b>（レベル${cur}）<br>次の宝箱まで ★あと${30 - starTotal() % 30}</p>`;
  } else if (menuTab === 'area') {
    h += AREAS.map((a, i) => { const f = i * 50 + 1, ok = f <= cur; return `<button class="abtn" data-area="${i}" ${ok ? '' : 'disabled'} style="background:linear-gradient(90deg,${a.top},${a.bot})">${ok ? '📍' : '🔒'} ${a.name}エリア<small>レベル${f}〜${Math.min(LV.length, f + 49)}</small></button>`; }).join('');
  }
  B.innerHTML = h; B.scrollTop = 0;
  B.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { const k = b.dataset.sw; SV[k] = !SV[k]; persist(); if (k === 'bgm' || k === 'sound') bgmApply(); if (k === 'sound') $('mSound').textContent = SV.sound ? '🔊' : '🔈'; if (k === 'vib' && SV.vib) buzz(30); SFX.tick(); renderMenu(); });
  B.querySelectorAll('[data-seg]').forEach(b => b.onclick = () => { const k = b.dataset.seg, v = b.dataset.v; SV[k] = v === 'true' ? true : v === 'false' ? false : v; if (k === 'fast') SPD = SV.fast ? 0.7 : 1; persist(); SFX.tick(); renderMenu(); });
  const vol = $('muVol'); if (vol) vol.oninput = () => { SV.bgmVol = vol.value / 100; bgmApply(); }, vol.onchange = () => persist();
  B.querySelectorAll('[data-area]').forEach(b => b.onclick = () => { SFX.tick(); closeMenu(); const sc = $('mapScroll'), [, y] = mapPos(+b.dataset.area * 50); sc.scrollTo({ top: clamp(y - sc.clientHeight * 0.6, 0, MAP.H), behavior: 'auto' }); });
}
$('mMenu').onclick = () => openMenu();
$('muClose').onclick = () => { SFX.tick(); closeMenu(); };
$('muTabs').onclick = e => { const b = e.target.closest('button'); if (b) { menuTab = b.dataset.t; SFX.tick(); renderMenu(); } };
$('muJump').onclick = () => { closeMenu(); $('mJump').onclick(); };
$('muTitle').onclick = () => { SFX.tick(); closeMenu(); show('title'); };
$('muVer').textContent = `イルカのブラスト v${VERSION}${IS_APP ? '（アプリ版）' : '（WEB版）'}・広告なし・通信なし`;
$('tVer').addEventListener('click', verTap); $('muVer').addEventListener('click', verTap);
$('dbgClose').onclick = () => { $('ovDebug').hidden = true; };
$('dbgRefresh').onclick = () => { $('dbgText').textContent = dbgReport(); };
$('tVer').textContent = `v${VERSION}${IS_APP ? ' アプリ版' : ''}・タップでも スワイプでも 遊べる！`;

// Android back button support
window.__blast = {
  get G() { return G; }, get busy() { return busy; }, get screen() { return screen; }, get paused() { return paused; }, get level() { return LVN; }, get score() { return score; },
  set speed(v) { SPD = v; }, get speed() { return SPD; },
  start: (n, seed, pre) => { closeOverlays(); startLevel(n, seed, pre); }, tap: tapCell, swap: swapCells, boost: pickBoost, get mode() { return mode; }, pause, resume, save: persist, get inv() { return SV.inv; },
  get lastIn() { return lastIn; }, set probe(v) { probe = !!v; },
  cellCenter(r, c) { const r0 = cv.getBoundingClientRect(); const [x, y] = cellXY(r, c); return [r0.left + x, r0.top + y]; },
  back() { // returns true if handled
    if (!$('ovGift').hidden) { $('gOk').click(); return true; }
    if (!$('ovDebug').hidden) { $('ovDebug').hidden = true; return true; }
    if (!$('ovMenu').hidden) { closeMenu(); return true; }
    if (mode) { setMode(null); return true; }
    if (!$('ovPause').hidden) { resume(); return true; }
    if (!$('ovStart').hidden) { $('sBack').click(); return true; }
    if (!$('ovWin').hidden) { $('wMap').click(); return true; }
    if (!$('ovLose').hidden) { $('lMap').click(); return true; }
    if (screen === 'game') { pause(); return true; }
    if (screen === 'map') { show('title'); return true; }
    return false;
  },
  reset() { const snd = SV.sound; SV = DEF(); SV.sound = snd; persist(); },
  unlockAll() { for (let i = 1; i <= LV.length; i++) SV.stars[i] = SV.stars[i] || 1; persist(); },
  get sprites() { return sprites; },
  unlockTo(n) { for (let i = 1; i < n; i++) SV.stars[i] = SV.stars[i] || 1; persist(); },
  setInv(o) { Object.assign(SV.inv, o); for (const k in o) SV.got[k] = 1; persist(); if (G) buildBoostBar(); },
  open(n) { openStart(n); },
  version: VERSION, debug: () => dbgReport(), openDebug, get bgm() { return BGM && BGM.current; }, appPause() { pause(); persist(); appSleep(true); }, appResume() { appSleep(false); }, skip: skipBonus, get bonusRunning() { return !$('skipBtn').hidden; },
  mudAt(r, c) { return dispMud && dispMud[r][c]; },
};
show('title');
})();
