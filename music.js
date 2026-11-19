// イルカのブラスト BGM — original "old jazz" pieces, synthesized live with WebAudio (no files, no network).
// Track data is plain text so it can be read/checked from Node (tools/music_check.js).
(function (root) {
'use strict';
const TRACKS = {
  // 港の散歩道 — medium swing, F major, clarinet lead (map / title)
  map: { title: '港の散歩道', bpm: 118, swing: 0.66, style: 'swing', lead: 'clarinet', harm: null,
    chords: ['F6', 'D7', 'Gm7', 'C7', 'F6', 'F7', 'Bb6', 'Bdim', 'F6/C', 'D7', 'G7', 'C7', 'F6', 'D7', 'Gm7 C7', 'F6'],
    mel: ['C5:3 A4:1 C5:2 D5:2', 'F#5:3 E5:1 D5:2 C5:2', 'Bb4:2 D5:2 F5:3 E5:1', 'E5:2 D5:1 C5:1 Bb4:2 G4:2',
          'A4:3 C5:1 F5:2 E5:2', 'Eb5:4 D5:1 C5:1 A4:2', 'D5:3 Bb4:1 G4:2 D5:2', 'D5:2 F5:2 Ab5:3 G5:1',
          'A5:2 F5:2 C5:3 D5:1', 'C5:2 A4:2 F#4:2 A4:2', 'B4:3 D5:1 F5:2 E5:2', 'E5:2 G5:2 Bb5:2 G5:1 E5:1',
          'F5:3 D5:1 C5:2 A4:2', 'F#4:2 A4:1 C5:1 D5:2 F#5:2', 'G5:2 F5:2 E5:2 C5:2', 'F5:6 r:2'] },
  // ケーブル・ラグ — ragtime two-beat, C major, muted trumpet lead, stride piano (normal levels)
  level: { title: 'ケーブル・ラグ', gain: 1.8, bpm: 152, swing: 0.58, style: 'rag', lead: 'trumpet', harm: null,
    chords: ['C', 'C', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'E7', 'E7', 'Am', 'Am', 'D7', 'G7', 'C', 'G7'],
    mel: ['E5:1 G5:2 E5:1 C5:2 G4:2', 'A4:1 C5:2 E5:1 G5:3 r:1', 'F5:1 D5:2 B4:1 G4:2 B4:2', 'D5:1 F5:2 G5:1 F5:2 D5:2',
          'B4:1 D5:2 F5:1 A5:2 G5:2', 'F5:2 E5:1 D5:1 B4:2 G4:2', 'C5:1 E5:2 G5:1 C6:3 r:1', 'B5:1 A5:1 G5:2 E5:2 C5:2',
          'G#4:1 B4:2 D5:1 E5:2 G#5:2', 'B5:3 G#5:1 E5:2 D5:2', 'C5:1 E5:2 A5:1 C6:2 A5:2', 'G#5:1 A5:2 E5:1 C5:2 A4:2',
          'F#5:1 A5:2 F#5:1 D5:2 C5:2', 'B4:1 D5:2 G5:1 F5:2 D5:2', 'E5:1 G5:2 C6:1 G5:2 E5:2', 'D5:2 B4:2 G4:2 r:2'] },
  // 夜勤ストンプ — hot dixieland stomp, D minor, trumpet lead + clarinet harmony (boss levels)
  boss: { title: '夜勤ストンプ', bpm: 176, swing: 0.64, style: 'dixie', lead: 'trumpet', harm: 'clarinet',
    chords: ['Dm', 'Dm', 'Gm', 'Gm', 'A7', 'A7', 'Dm', 'A7', 'Dm', 'D7', 'Gm', 'Gm', 'Dm/A', 'E7 A7', 'Dm', 'A7'],
    mel: ['D5:2 F5:1 A5:1 r:1 A5:1 G5:1 F5:1', 'E5:1 F5:1 D5:2 A4:4', 'G4:1 Bb4:1 D5:1 G5:2 F5:1 D5:2', 'Bb5:3 A5:1 G5:2 D5:2',
          'C#5:1 E5:1 G5:1 A5:2 G5:1 E5:2', 'Bb5:2 A5:1 G5:1 E5:2 C#5:2', 'D5:1 F5:1 A5:1 D6:3 r:2', 'C#6:1 Bb5:1 A5:1 G5:1 E5:2 C#5:2',
          'A5:2 F5:1 D5:1 A5:2 F5:2', 'F#5:1 A5:1 C6:2 A5:2 F#5:2', 'G5:3 Bb5:1 D6:2 Bb5:2', 'A5:1 G5:1 F5:1 D5:1 Bb4:2 G4:2',
          'A4:1 D5:1 F5:1 A5:3 G5:1 F5:1', 'E5:1 G#5:1 B5:2 C#6:1 Bb5:1 G5:2', 'F5:1 E5:1 D5:2 A4:2 D5:2', 'E5:2 C#5:2 A4:3 r:1'] },
  // 休憩所のブギ — easy shuffle boogie, G major, clarinet lead (breather levels)
  rest: { title: '休憩所のブギ', bpm: 104, swing: 0.67, style: 'boogie', lead: 'clarinet', harm: null,
    chords: ['G6', 'G6', 'C6', 'C6', 'G6', 'E7', 'A7', 'D7', 'G6', 'G7', 'C6', 'C#dim', 'G6/D', 'E7', 'A7 D7', 'G6'],
    mel: ['B4:2 D5:2 E5:3 D5:1', 'B4:1 A4:1 G4:2 r:4', 'E5:2 G5:2 A5:3 G5:1', 'E5:1 D5:1 C5:2 r:4',
          'D5:3 B4:1 D5:2 G5:2', 'G#5:3 E5:1 D5:2 B4:2', 'C#5:2 E5:2 G5:2 E5:2', 'F#5:4 r:2 D5:2',
          'G5:3 E5:1 D5:2 B4:2', 'F5:3 D5:1 B4:2 G4:2', 'C5:2 E5:2 G5:2 A5:2', 'Bb5:3 G5:1 E5:2 C#5:2',
          'D5:2 B4:2 G4:3 A4:1', 'B4:2 D5:2 G#5:3 E5:1', 'A5:2 G5:2 F#5:2 E5:1 C5:1', 'B4:4 G4:2 r:2'] },
};
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = s => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) throw new Error('bad note ' + s); return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
const QUAL = { '': [0, 4, 7], '6': [0, 4, 7, 9], '7': [0, 4, 7, 10], 'm': [0, 3, 7], 'm7': [0, 3, 7, 10], 'm6': [0, 3, 7, 9], 'dim': [0, 3, 6, 9], 'maj7': [0, 4, 7, 11] };
function chord(s) { const [main, slash] = s.split('/'); const m = /^([A-G][#b]?)(.*)$/.exec(main); const root = midi(m[1] + '2') % 12; const iv = QUAL[m[2]]; if (!iv) throw new Error('bad chord ' + s); return { root, iv, bass: slash ? midi(slash + '2') % 12 : root }; }
// expand a track into absolute events (time in eighth-note steps)
function compile(T) {
  const bars = T.chords.length, ev = { lead: [], harm: [], bass: [], comp: [], drum: [] };
  const chordAt = []; // per beat
  T.chords.forEach((cs, b) => { const parts = cs.split(' ').map(chord); for (let q = 0; q < 4; q++) chordAt.push(parts.length === 1 ? parts[0] : parts[q < 2 ? 0 : 1]); });
  T.mel.forEach((ms, b) => { let t = b * 8; for (const tok of ms.split(' ')) { const [n, d] = tok.split(':'); const len = +d; if (n !== 'r') ev.lead.push({ t, len, m: midi(n) }); t += len; } if (t !== b * 8 + 8) throw new Error(`${T.title} bar ${b + 1} has ${t - b * 8} eighths`); });
  // harmony: nearest chord tone 3-9 semitones below the lead
  if (T.harm) for (const n of ev.lead) { const ch = chordAt[Math.floor(n.t / 2)]; let best = null; for (let k = 3; k <= 9; k++) { const p = n.m - k; if (ch.iv.includes(((p - ch.root) % 12 + 12) % 12)) { best = p; break; } } if (best) ev.harm.push({ t: n.t, len: n.len, m: best }); }
  const near = (pc, ref) => { let m = 36 + pc; while (m < ref - 6) m += 12; while (m > ref + 6) m -= 12; return m; };
  let prev = 43;
  for (let q = 0; q < bars * 4; q++) {
    const ch = chordAt[q], nx = chordAt[(q + 1) % (bars * 4)], beat = q % 4, t = q * 2;
    if (T.style === 'rag') { // oom-pah: bass on 1 and 3, chord on 2 and 4
      if (beat % 2 === 0) { const pc = beat === 0 ? ch.bass : (ch.root + 7) % 12; prev = near(pc, 40); ev.bass.push({ t, len: 1.6, m: prev }); }
      else ev.comp.push({ t, len: 1, ms: ch.iv.map(i => 60 + ((ch.root + i) % 12)), v: 1 });
    } else if (T.style === 'boogie') { // shuffle boogie bass: R 3 5 6 b7 6 5 3 pattern in eighths
      const pat = [0, 4, 7, 9, 10, 9, 7, 4]; for (let e = 0; e < 2; e++) ev.bass.push({ t: t + e, len: 0.9, m: near(ch.root, 40) + pat[beat * 2 + e] - (pat[beat * 2 + e] > 7 ? 0 : 0) });
      if (beat === 1 || beat === 3) ev.comp.push({ t: t + 1, len: 0.8, ms: ch.iv.map(i => 60 + ((ch.root + i) % 12)), v: 0.8 });
    } else { // walking bass + four-to-the-bar rhythm chords
      let pc; if (beat === 0) pc = ch.bass; else if (beat === 3 || nx !== ch && beat === 1 && chordAt[q + 1] && chordAt[q + 1] !== ch) pc = null; else pc = (ch.root + ch.iv[beat === 1 ? 1 : 2]) % 12;
      let m; if (pc == null) { const target = near(nx.bass, prev); m = target + (prev < target ? -1 : 1); } else m = near(pc, prev);
      if (m < 33) m += 12; if (m > 52) m -= 12; prev = m; ev.bass.push({ t, len: 1.8, m });
      ev.comp.push({ t, len: 0.9, ms: ch.iv.map(i => 55 + ((ch.root + i - 7 + 12) % 12)), v: beat % 2 ? 1 : 0.6 });
      if (T.style === 'dixie' && beat === 3) ev.comp.push({ t: t + 1, len: 0.6, ms: ch.iv.map(i => 67 + ((ch.root + i) % 12)), v: 0.7 });
    }
    // drums: ride/brush on every beat, skip-note on the swung "and" of 2 and 4, soft kick (feathered), snare brush on 2 & 4
    ev.drum.push({ t, k: 'ride' }); if (beat % 2) { ev.drum.push({ t: t + 1, k: 'ride2' }); ev.drum.push({ t, k: 'snare' }); }
    ev.drum.push({ t, k: 'kick' }); if (T.style === 'dixie' && beat === 3) ev.drum.push({ t: t + 1, k: 'snare' });
    if (beat === 0) ev.drum.push({ t, k: 'swish' });
  }
  return { ev, steps: bars * 8 };
}
const COMPILED = {}; for (const k in TRACKS) COMPILED[k] = compile(TRACKS[k]);

// ---------------------------------------------------------------- player
function Player(getCtx) {
  let want = null, swT = 0, forceUntil = 0, resync = false, ac = null, out = null, verb = null, noiseBuf = null, cur = null, timer = 0, pos = 0, t0 = 0, vol = 0.6, on = true, paused = false;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function setup() {
    ac = getCtx(); if (!ac || out) return !!ac;
    out = ac.createGain(); out.gain.value = 0; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; // old-record warmth
    out.connect(lp); lp.connect(ac.destination);
    // short room reverb via feedback delay
    verb = ac.createDelay(); verb.delayTime.value = 0.09; const fb = ac.createGain(); fb.gain.value = 0.28; const vg = ac.createGain(); vg.gain.value = 0.22;
    verb.connect(fb); fb.connect(verb); verb.connect(vg); vg.connect(lp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  const env = (g, t, a, peak, dec, len) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(peak * 0.6, t + a, dec); g.gain.setTargetAtTime(0.0001, t + len, 0.04); };
  function voice(kind, m, t, len) {
    const g = ac.createGain(); g.connect(out); if (kind !== 'bass') g.connect(verb);
    if (kind === 'trumpet') { // muted (harmon) trumpet: saw -> narrow bandpass + vibrato
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(hz(m) * 0.985, t); o.frequency.exponentialRampToValueAtTime(hz(m), t + 0.05);
      lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(hz(m) * 0.012, t + Math.max(0.12, len * 0.6)); lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 3.2; o.connect(f); f.connect(g); env(g, t, 0.03, 0.16, 0.3, len);
      o.start(t); lfo.start(t); o.stop(t + len + 0.25); lfo.stop(t + len + 0.25);
    } else if (kind === 'clarinet') { // square (odd harmonics) -> lowpass, gentle vibrato
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'square'; o.frequency.value = hz(m); lfo.frequency.value = 5.6; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(hz(m) * 0.008, t + Math.max(0.15, len * 0.7)); lfo.connect(lg); lg.connect(o.frequency);
      f.type = 'lowpass'; f.frequency.value = Math.min(3200, hz(m) * 3.2); f.Q.value = 1; o.connect(f); f.connect(g); env(g, t, 0.04, 0.11, 0.4, len);
      o.start(t); lfo.start(t); o.stop(t + len + 0.25); lfo.stop(t + len + 0.25);
    } else if (kind === 'bass') { // plucked upright bass
      const o = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = hz(m); o2.frequency.value = hz(m) * 2;
      const g2 = ac.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(f); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(260, t + 0.25);
      o.connect(f); f.connect(g); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
    } else if (kind === 'piano') { // bright honky-tonk piano: two slightly detuned triangles, fast decay
      for (const det of [-6, 7]) { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(m); o.detune.value = det; o.connect(g); o.start(t); o.stop(t + len + 0.1); }
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    }
  }
  function drum(k, t) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.connect(f); f.connect(g); g.connect(out);
    let dur = 0.1;
    if (k === 'ride' || k === 'ride2') { f.type = 'highpass'; f.frequency.value = 7000; dur = k === 'ride' ? 0.22 : 0.12; g.gain.setValueAtTime(k === 'ride' ? 0.05 : 0.035, t); }
    else if (k === 'snare') { f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.7; dur = 0.18; g.gain.setValueAtTime(0.06, t); }
    else if (k === 'swish') { f.type = 'bandpass'; f.frequency.setValueAtTime(3000, t); f.frequency.linearRampToValueAtTime(6000, t + 0.4); dur = 0.45; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.2); }
    else if (k === 'kick') { const o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); og.gain.setValueAtTime(0.12, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.2); g.gain.value = 0; }
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  // scheduler: look ahead 0.35 s, called every 90 ms
  function tick() {
    if (!cur || paused || !ac || (ac.state !== 'running' && !forceUntil)) return;
    const T = TRACKS[cur], C = COMPILED[cur], spb = 60 / T.bpm, now = ac.currentTime;
    const rel = s => { const beat = Math.floor(s / 2), off = s - beat * 2; const inBeat = off < 1 ? off * T.swing : T.swing + (off - 1) * (1 - T.swing); return (beat + inBeat) * spb; };
    if (t0 === 0 || resync) { t0 = now + 0.08 - rel(pos); resync = false; }
    const stepTime = s => t0 + rel(s);
    while (stepTime(pos) < now + (forceUntil || 0.35)) {
      const loop = Math.floor(pos / C.steps), base = loop * C.steps, s0 = pos - base;
      for (const part of ['lead', 'harm', 'bass', 'comp', 'drum']) for (const e of C.ev[part]) {
        if (e.t < s0 || e.t >= s0 + 1) continue;
        const t = stepTime(base + e.t); if (t < now - 0.02) continue; const end = e.len ? stepTime(base + e.t + e.len) - t : 0;
        if (part === 'lead') voice(T.lead, e.m, t, end * 0.92);
        else if (part === 'harm') voice(T.harm, e.m, t, end * 0.9);
        else if (part === 'bass') voice('bass', e.m, t, Math.max(0.18, end));
        else if (part === 'comp') { for (const m of e.ms) voice('piano', m, t, Math.max(0.12, end) * e.v); }
        else drum(e.k, t);
      }
      pos++;
    }
  }
  function fade(to, sec) { if (!out) return; const n = ac.currentTime; out.gain.cancelScheduledValues(n); out.gain.setValueAtTime(out.gain.value, n); out.gain.linearRampToValueAtTime(to, n + sec); }
  const level = () => (on && !paused && cur ? vol * 0.9 * (TRACKS[cur].gain || 1) : 0);
  return {
    TRACKS,
    play(name) {
      if (!TRACKS[name]) name = null; want = name;
      if (!setup()) { cur = name; return; }
      if (!timer) timer = setInterval(tick, 90);
      if (name === cur) { fade(level(), 0.3); return; }
      clearTimeout(swT);
      const start = () => { cur = want; pos = 0; t0 = 0; fade(level(), 0.5); };
      if (cur && out.gain.value > 0.01) { fade(0, 0.35); cur = null; swT = setTimeout(start, 380); } else start();
    },
    stop() { fade(0, 0.3); cur = null; },
    setOn(v) { on = !!v; if (setup()) fade(level(), 0.3); },
    setVolume(v) { vol = Math.max(0, Math.min(1, v)); if (out) fade(level(), 0.1); },
    pause(v) { paused = !!v; if (!out) return; if (paused) fade(0, 0.25); else { // resync the clock so we resume cleanly
        resync = true; fade(level(), 0.4); } },
    kick() { if (setup()) { if (cur) fade(level(), 0.3); if (!timer) timer = setInterval(tick, 90); } },
    get current() { return cur; },
    offline(name, seconds) { setup(); cur = name; on = true; paused = false; out.gain.value = vol * 0.9 * (TRACKS[name].gain || 1); t0 = 0; pos = 0; forceUntil = seconds; tick(); forceUntil = 0; },
  };
}
const api = { TRACKS, COMPILED, compile, Player };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.IrukaMusic = api;
})(typeof window !== 'undefined' ? window : globalThis);
