/* イルカのブラスト - procedural art (cached canvas sprites) */
(function (root) {
'use strict';
const PAL = {
  r: ['#ff8a96', '#ff4d5e', '#c41d3a'], y: ['#ffe680', '#ffc928', '#d88f00'], b: ['#8fd3ff', '#35a2ff', '#1460c4'],
  g: ['#8ff0a6', '#3fcc66', '#178f3f'], p: ['#d2b0ff', '#a46bff', '#6a33cf'], o: ['#ffc08a', '#ff8a2a', '#cf5600'],
};
const CK = ['r', 'y', 'b', 'g', 'p', 'o'];
function mk(S) { const c = document.createElement('canvas'); c.width = c.height = Math.ceil(S); return c; }
function rr(x, y, w, h, r) { const p = new Path2D(); p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath(); return p; }
function ctxOf(c) { return c.getContext('2d'); }
// --- block icons, drawn in white into a unit box [-1,1] (caller scales)
const ICON = {
  r(c) { // plug
    c.beginPath(); c.roundRect ? c.roundRect(-0.48, -0.28, 0.96, 0.62, 0.16) : c.rect(-0.48, -0.28, 0.96, 0.62); c.fill();
    c.fillRect(-0.3, -0.62, 0.15, 0.38); c.fillRect(0.15, -0.62, 0.15, 0.38);
    c.beginPath(); c.moveTo(-0.12, 0.3); c.lineTo(0.12, 0.3); c.lineTo(0.1, 0.5); c.quadraticCurveTo(0.1, 0.72, 0.42, 0.72); c.lineTo(0.42, 0.86); c.quadraticCurveTo(-0.08, 0.88, -0.1, 0.5); c.closePath(); c.fill();
  },
  y(c) { // helmet with cross
    c.beginPath(); c.moveTo(-0.62, 0.22); c.bezierCurveTo(-0.62, -0.62, 0.62, -0.62, 0.62, 0.22); c.closePath(); c.fill();
    c.beginPath(); c.roundRect ? c.roundRect(-0.82, 0.16, 1.64, 0.22, 0.11) : c.rect(-0.82, 0.16, 1.64, 0.22); c.fill();
    c.fillRect(-0.06, -0.52, 0.12, 0.62);
    c.globalCompositeOperation = 'destination-out'; c.fillRect(-0.2, -0.24, 0.4, 0.12); c.fillRect(-0.06, -0.38, 0.12, 0.4); c.globalCompositeOperation = 'source-over';
  },
  b(c) { // radio waves
    c.beginPath(); c.arc(0, 0.5, 0.15, 0, 7); c.fill();
    c.lineCap = 'round'; c.strokeStyle = c.fillStyle;
    for (const [r, w] of [[0.45, 0.16], [0.78, 0.16]]) { c.lineWidth = w; c.beginPath(); c.arc(0, 0.5, r, -Math.PI * 0.78, -Math.PI * 0.22); c.stroke(); }
    c.lineWidth = 0.16; c.beginPath(); c.arc(0, 0.5, 1.1, -Math.PI * 0.72, -Math.PI * 0.28); c.stroke();
  },
  g(c) { // wrench
    c.save(); c.rotate(-Math.PI / 4);
    c.beginPath(); c.roundRect ? c.roundRect(-0.13, -0.3, 0.26, 1.15, 0.13) : c.rect(-0.13, -0.3, 0.26, 1.15); c.fill();
    c.beginPath(); c.arc(0, -0.48, 0.36, 0, 7); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.fillRect(-0.13, -0.95, 0.26, 0.48); c.globalCompositeOperation = 'source-over';
    c.restore();
  },
  p(c) { // hex nut
    c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; c.lineTo(Math.cos(a) * 0.7, Math.sin(a) * 0.7); } c.closePath(); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(0, 0, 0.28, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
  },
  o(c) { // traffic cone
    c.beginPath(); c.moveTo(-0.14, -0.72); c.lineTo(0.14, -0.72); c.lineTo(0.46, 0.5); c.lineTo(-0.46, 0.5); c.closePath(); c.fill();
    c.beginPath(); c.roundRect ? c.roundRect(-0.72, 0.46, 1.44, 0.22, 0.08) : c.rect(-0.72, 0.46, 1.44, 0.22); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.fillRect(-0.5, -0.36, 1, 0.14); c.fillRect(-0.5, 0.06, 1, 0.14); c.globalCompositeOperation = 'source-over';
  },
};
function iconLayer(S, key, color) {
  const c = mk(S), x = ctxOf(c); x.translate(S / 2, S / 2); x.scale(S / 2, S / 2); x.fillStyle = color; ICON[key](x); return c;
}
function blockBase(x, S, pal) {
  const m = S * 0.04, w = S - 2 * m, r = S * 0.2;
  x.fillStyle = 'rgba(0,0,0,.22)'; x.fill(rr(m, m + S * 0.05, w, w - S * 0.02, r));
  x.fillStyle = pal[2]; x.fill(rr(m, m + S * 0.02, w, w - S * 0.02, r));
  const g = x.createLinearGradient(0, m, 0, S - m); g.addColorStop(0, pal[0]); g.addColorStop(0.45, pal[1]); g.addColorStop(1, pal[1]);
  x.fillStyle = g; x.fill(rr(m, m, w, w - S * 0.07, r));
  x.save(); x.globalAlpha = 0.45; x.fillStyle = '#fff'; x.beginPath(); x.ellipse(S * 0.36, S * 0.2, S * 0.22, S * 0.08, -0.25, 0, 7); x.fill(); x.restore();
}
function block(S, key) {
  const c = mk(S), x = ctxOf(c), pal = PAL[key]; blockBase(x, S, pal);
  const isz = S * 0.6, off = (S - isz) / 2;
  x.globalAlpha = 0.35; x.drawImage(iconLayer(isz, key, pal[2]), off, off + S * 0.035); x.globalAlpha = 1;
  x.drawImage(iconLayer(isz, key, '#fff'), off, off - S * 0.01);
  if (key === 'y') { // green cross on the helmet
    const k = isz / 2, cx = off + k, cy = off - S * 0.01 + k; x.fillStyle = '#20b04b';
    x.fillRect(cx - 0.2 * k, cy - 0.24 * k, 0.4 * k, 0.12 * k); x.fillRect(cx - 0.06 * k, cy - 0.38 * k, 0.12 * k, 0.4 * k);
  }
  return c;
}
function drillBit(x, len, w) { // pointing +x, from 0
  const g = x.createLinearGradient(0, -w, 0, w); g.addColorStop(0, '#f4f7fb'); g.addColorStop(0.5, '#a9b4c2'); g.addColorStop(1, '#5d6878');
  x.fillStyle = g; x.beginPath(); x.moveTo(0, -w); x.lineTo(len, 0); x.lineTo(0, w); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(40,50,70,.55)'; x.lineWidth = w * 0.18;
  for (let i = 1; i < 4; i++) { const t = i / 4, xx = len * t, hh = w * (1 - t); x.beginPath(); x.moveTo(xx - hh * 0.6, -hh); x.lineTo(xx + hh * 0.5, hh); x.stroke(); }
}
function rocket(S, dir) {
  const c = mk(S), x = ctxOf(c); x.translate(S / 2, S / 2); if (dir === 'v') x.rotate(Math.PI / 2);
  // glow
  const gl = x.createRadialGradient(0, 0, S * 0.1, 0, 0, S * 0.5); gl.addColorStop(0, 'rgba(255,240,150,.55)'); gl.addColorStop(1, 'rgba(255,240,150,0)'); x.fillStyle = gl; x.fillRect(-S / 2, -S / 2, S, S);
  x.save(); drillBit(x, S * 0.49, S * 0.21); x.restore();
  x.save(); x.scale(-1, 1); drillBit(x, S * 0.49, S * 0.21); x.restore();
  // body
  const g = x.createLinearGradient(0, -S * 0.22, 0, S * 0.22); g.addColorStop(0, '#ffe36b'); g.addColorStop(0.5, '#ffb800'); g.addColorStop(1, '#d97a00');
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fill(rr(-S * 0.24, -S * 0.19, S * 0.48, S * 0.42, S * 0.12));
  x.fillStyle = g; x.fill(rr(-S * 0.24, -S * 0.22, S * 0.48, S * 0.42, S * 0.12));
  x.fillStyle = '#2b2f3a'; x.fill(rr(-S * 0.13, -S * 0.08, S * 0.26, S * 0.15, S * 0.05));
  x.fillStyle = '#fff'; x.globalAlpha = .6; x.beginPath(); x.ellipse(-S * 0.08, -S * 0.15, S * 0.1, S * 0.035, 0, 0, 7); x.fill(); x.globalAlpha = 1;
  x.fillStyle = '#7cf'; for (const dx of [-0.07, 0, 0.07]) { x.beginPath(); x.arc(S * dx, -S * 0.005, S * 0.022, 0, 7); x.fill(); }
  return c;
}
function bomb(S) { // splice kit (red tool case with spark)
  const c = mk(S), x = ctxOf(c);
  const gl = x.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S * 0.52); gl.addColorStop(0, 'rgba(255,120,80,.45)'); gl.addColorStop(1, 'rgba(255,120,80,0)'); x.fillStyle = gl; x.fillRect(0, 0, S, S);
  x.strokeStyle = '#3a3f4b'; x.lineWidth = S * 0.07; x.beginPath(); x.moveTo(S * 0.36, S * 0.3); x.lineTo(S * 0.36, S * 0.18); x.quadraticCurveTo(S * 0.36, S * 0.12, S * 0.42, S * 0.12); x.lineTo(S * 0.58, S * 0.12); x.quadraticCurveTo(S * 0.64, S * 0.12, S * 0.64, S * 0.18); x.lineTo(S * 0.64, S * 0.3); x.stroke();
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fill(rr(S * 0.1, S * 0.3, S * 0.8, S * 0.56, S * 0.1));
  const g = x.createLinearGradient(0, S * 0.26, 0, S * 0.84); g.addColorStop(0, '#ff7a6b'); g.addColorStop(0.5, '#e8382e'); g.addColorStop(1, '#a8161b');
  x.fillStyle = g; x.fill(rr(S * 0.1, S * 0.26, S * 0.8, S * 0.56, S * 0.1));
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(S * 0.1, S * 0.42, S * 0.8, S * 0.035);
  x.fillStyle = '#d7dbe2'; x.fill(rr(S * 0.2, S * 0.39, S * 0.1, S * 0.1, S * 0.02)); x.fill(rr(S * 0.7, S * 0.39, S * 0.1, S * 0.1, S * 0.02));
  // lightning
  x.fillStyle = '#ffe14a'; x.strokeStyle = '#a06000'; x.lineWidth = S * 0.025; x.beginPath();
  x.moveTo(S * 0.54, S * 0.47); x.lineTo(S * 0.42, S * 0.64); x.lineTo(S * 0.5, S * 0.64); x.lineTo(S * 0.45, S * 0.79); x.lineTo(S * 0.6, S * 0.6); x.lineTo(S * 0.52, S * 0.6); x.lineTo(S * 0.58, S * 0.47); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.ellipse(S * 0.3, S * 0.31, S * 0.14, S * 0.035, 0, 0, 7); x.fill();
  return c;
}
function disco(S, key) { // fiber-optic ball
  const c = mk(S), x = ctxOf(c), pal = PAL[key] || PAL.b, cx = S / 2, cy = S / 2, R = S * 0.4;
  const gl = x.createRadialGradient(cx, cy, R * 0.6, cx, cy, S * 0.52); gl.addColorStop(0, pal[1] + 'aa'); gl.addColorStop(1, pal[1] + '00'); x.fillStyle = gl; x.fillRect(0, 0, S, S);
  const g = x.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, pal[0]); g.addColorStop(0.8, pal[1]); g.addColorStop(1, pal[2]);
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill();
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip(); x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = S * 0.018;
  for (let i = -3; i <= 3; i++) { x.beginPath(); x.ellipse(cx, cy, Math.abs(i) * R / 3.2 + 0.01, R, 0, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx - R, cy + i * R / 3.5); x.lineTo(cx + R, cy + i * R / 3.5); x.stroke(); }
  x.restore();
  x.strokeStyle = pal[2]; x.lineWidth = S * 0.03; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
  star(x, cx - R * 0.35, cy - R * 0.38, S * 0.13, '#fff');
  return c;
}
function star(x, cx, cy, r, col) { x.fillStyle = col; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * 0.28 : r; x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.closePath(); x.fill(); }
function box(S, mx, hp) {
  const c = mk(S), x = ctxOf(c), m = S * 0.05, w = S - 2 * m;
  if (mx === 1) { // cardboard
    x.fillStyle = '#8a5a2b'; x.fill(rr(m, m + S * 0.03, w, w - S * 0.03, S * 0.08));
    const g = x.createLinearGradient(0, m, 0, S - m); g.addColorStop(0, '#f0c48a'); g.addColorStop(1, '#d49a5a'); x.fillStyle = g; x.fill(rr(m, m, w, w - S * 0.06, S * 0.08));
    x.fillStyle = '#e9d7b3'; x.fillRect(S * 0.42, m, S * 0.16, w - S * 0.06);
    x.fillStyle = 'rgba(120,70,20,.35)'; x.fillRect(m, S * 0.3, w, S * 0.025);
    x.strokeStyle = '#a06a35'; x.lineWidth = S * 0.03; x.strokeRect(S * 0.16, S * 0.62, S * 0.2, S * 0.16);
    x.beginPath(); x.moveTo(S * 0.66, S * 0.66); x.lineTo(S * 0.8, S * 0.66); x.moveTo(S * 0.66, S * 0.74); x.lineTo(S * 0.76, S * 0.74); x.stroke();
  } else if (mx === 3) { // steel crate
    x.fillStyle = '#3d4656'; x.fill(rr(m, m + S * 0.03, w, w - S * 0.03, S * 0.07));
    const g = x.createLinearGradient(0, m, 0, S - m); g.addColorStop(0, '#dfe5ee'); g.addColorStop(0.5, '#a9b4c4'); g.addColorStop(1, '#7d899c'); x.fillStyle = g; x.fill(rr(m, m, w, w - S * 0.06, S * 0.07));
    x.strokeStyle = '#5d6878'; x.lineWidth = S * 0.05; x.strokeRect(S * 0.17, S * 0.17, S * 0.66, S * 0.6);
    x.beginPath(); x.moveTo(S * 0.17, S * 0.17); x.lineTo(S * 0.83, S * 0.77); x.moveTo(S * 0.83, S * 0.17); x.lineTo(S * 0.17, S * 0.77); x.stroke();
    x.fillStyle = '#eef2f7'; for (const [a, b] of [[.12, .12], [.88, .12], [.12, .8], [.88, .8]]) { x.beginPath(); x.arc(S * a, S * b, S * 0.035, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(m + S * 0.04, m + S * 0.03, w * 0.5, S * 0.04);
    if (hp < 3) { x.strokeStyle = '#1d2330'; x.lineWidth = S * 0.035; x.lineJoin = 'round'; x.beginPath(); x.moveTo(S * 0.62, S * 0.06); x.lineTo(S * 0.55, S * 0.3); x.lineTo(S * 0.66, S * 0.42); if (hp < 2) { x.moveTo(S * 0.2, S * 0.5); x.lineTo(S * 0.36, S * 0.56); x.lineTo(S * 0.4, S * 0.76); x.moveTo(S * 0.36, S * 0.56); x.lineTo(S * 0.52, S * 0.5); } x.stroke(); }
  } else { // wooden crate
    x.fillStyle = '#5a3414'; x.fill(rr(m, m + S * 0.03, w, w - S * 0.03, S * 0.06));
    const g = x.createLinearGradient(0, m, 0, S - m); g.addColorStop(0, '#c98b4c'); g.addColorStop(1, '#9a5f2a'); x.fillStyle = g; x.fill(rr(m, m, w, w - S * 0.06, S * 0.06));
    x.strokeStyle = 'rgba(70,35,10,.5)'; x.lineWidth = S * 0.02; for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(m, m + i * w / 4); x.lineTo(S - m, m + i * w / 4); x.stroke(); }
    x.fillStyle = '#7a4719'; x.fillRect(m, m, w, S * 0.11); x.fillRect(m, S - m - S * 0.17, w, S * 0.11); x.fillRect(m, m, S * 0.11, w - S * 0.06); x.fillRect(S - m - S * 0.11, m, S * 0.11, w - S * 0.06);
    x.save(); x.beginPath(); x.rect(m, m, w, w); x.clip(); x.translate(S / 2, S / 2); x.rotate(Math.PI / 4); x.fillRect(-S * 0.06, -S * 0.6, S * 0.12, S * 1.2); x.restore();
    x.fillStyle = '#d8d8d8'; for (const [a, b] of [[.16, .16], [.84, .16], [.16, .78], [.84, .78]]) { x.beginPath(); x.arc(S * a, S * b, S * 0.03, 0, 7); x.fill(); }
    if (hp === 1) { x.strokeStyle = '#2a1405'; x.lineWidth = S * 0.035; x.lineJoin = 'round'; x.beginPath(); x.moveTo(S * 0.3, S * 0.08); x.lineTo(S * 0.42, S * 0.3); x.lineTo(S * 0.33, S * 0.45); x.lineTo(S * 0.5, S * 0.62); x.moveTo(S * 0.42, S * 0.3); x.lineTo(S * 0.6, S * 0.36); x.lineTo(S * 0.72, S * 0.28); x.stroke(); }
  }
  return c;
}
function drum(S) { // cable drum (side view)
  const c = mk(S), x = ctxOf(c), cy = S * 0.5;
  x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.ellipse(S * 0.5, S * 0.9, S * 0.38, S * 0.06, 0, 0, 7); x.fill();
  // cable band
  const g = x.createLinearGradient(0, S * 0.22, 0, S * 0.78); g.addColorStop(0, '#5b6680'); g.addColorStop(0.5, '#2b3346'); g.addColorStop(1, '#151a26');
  x.fillStyle = g; x.fillRect(S * 0.22, S * 0.24, S * 0.56, S * 0.52);
  x.strokeStyle = '#ff8a2a'; x.lineWidth = S * 0.035; for (let i = 0; i < 6; i++) { const yy = S * (0.29 + i * 0.085); x.beginPath(); x.moveTo(S * 0.22, yy); x.quadraticCurveTo(S * 0.5, yy + S * 0.03, S * 0.78, yy); x.stroke(); }
  for (const sx of [0.2, 0.8]) {
    const fg = x.createLinearGradient(S * (sx - 0.1), 0, S * (sx + 0.1), 0); fg.addColorStop(0, '#e2b06a'); fg.addColorStop(1, '#a8702f');
    x.fillStyle = '#6e4317'; x.beginPath(); x.ellipse(S * sx, cy + S * 0.02, S * 0.12, S * 0.41, 0, 0, 7); x.fill();
    x.fillStyle = fg; x.beginPath(); x.ellipse(S * sx, cy, S * 0.12, S * 0.41, 0, 0, 7); x.fill();
    x.fillStyle = '#5a3414'; x.beginPath(); x.ellipse(S * sx, cy, S * 0.04, S * 0.11, 0, 0, 7); x.fill();
  }
  return c;
}
function router(S) { // optical router / ONU
  const c = mk(S), x = ctxOf(c);
  const gl = x.createRadialGradient(S / 2, S / 2, S * 0.15, S / 2, S / 2, S * 0.55); gl.addColorStop(0, 'rgba(120,255,200,.5)'); gl.addColorStop(1, 'rgba(120,255,200,0)'); x.fillStyle = gl; x.fillRect(0, 0, S, S);
  x.strokeStyle = '#2b3346'; x.lineWidth = S * 0.06; x.lineCap = 'round';
  x.beginPath(); x.moveTo(S * 0.28, S * 0.36); x.lineTo(S * 0.2, S * 0.1); x.moveTo(S * 0.72, S * 0.36); x.lineTo(S * 0.8, S * 0.1); x.stroke();
  x.fillStyle = '#ff4d5e'; x.beginPath(); x.arc(S * 0.2, S * 0.1, S * 0.05, 0, 7); x.fill(); x.beginPath(); x.arc(S * 0.8, S * 0.1, S * 0.05, 0, 7); x.fill();
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fill(rr(S * 0.1, S * 0.36, S * 0.8, S * 0.48, S * 0.12));
  const g = x.createLinearGradient(0, S * 0.32, 0, S * 0.8); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#cfd8e6');
  x.fillStyle = g; x.fill(rr(S * 0.1, S * 0.32, S * 0.8, S * 0.48, S * 0.12));
  x.strokeStyle = '#9aa8bd'; x.lineWidth = S * 0.02; x.stroke(rr(S * 0.1, S * 0.32, S * 0.8, S * 0.48, S * 0.12));
  x.fillStyle = '#1f6fff'; x.font = `900 ${S * 0.2}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('光', S * 0.33, S * 0.55);
  for (const [i, col] of [[0, '#2ee66b'], [1, '#2ee66b'], [2, '#ffc928']]) { x.fillStyle = col; x.beginPath(); x.arc(S * (0.55 + i * 0.1), S * 0.6, S * 0.035, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(S * 0.36, S * 0.38, S * 0.18, S * 0.03, 0, 0, 7); x.fill();
  return c;
}
function lamp(S, key) { // colored warning lamp (beacon)
  const c = mk(S), x = ctxOf(c), pal = PAL[key] || PAL.r;
  const gl = x.createRadialGradient(S / 2, S * 0.42, S * 0.05, S / 2, S * 0.42, S * 0.5); gl.addColorStop(0, pal[0] + 'cc'); gl.addColorStop(1, pal[1] + '00'); x.fillStyle = gl; x.fillRect(0, 0, S, S);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(S / 2, S * 0.88, S * 0.32, S * 0.06, 0, 0, 7); x.fill();
  const bg = x.createLinearGradient(0, S * 0.66, 0, S * 0.86); bg.addColorStop(0, '#5d6878'); bg.addColorStop(1, '#2b3346'); x.fillStyle = bg; x.fill(rr(S * 0.2, S * 0.66, S * 0.6, S * 0.2, S * 0.05));
  const g = x.createRadialGradient(S * 0.4, S * 0.32, S * 0.03, S / 2, S * 0.45, S * 0.34); g.addColorStop(0, '#fff'); g.addColorStop(0.3, pal[0]); g.addColorStop(1, pal[2]);
  x.fillStyle = g; x.beginPath(); x.moveTo(S * 0.24, S * 0.68); x.lineTo(S * 0.24, S * 0.42); x.bezierCurveTo(S * 0.24, S * 0.1, S * 0.76, S * 0.1, S * 0.76, S * 0.42); x.lineTo(S * 0.76, S * 0.68); x.closePath(); x.fill();
  x.strokeStyle = pal[2]; x.lineWidth = S * 0.025; x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = S * 0.03; for (const yy of [0.5, 0.6]) { x.beginPath(); x.moveTo(S * 0.26, S * yy); x.lineTo(S * 0.74, S * yy); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(S * 0.38, S * 0.3, S * 0.05, S * 0.09, -0.3, 0, 7); x.fill();
  return c;
}
function tie(S) { // cable-tie lock overlay
  const c = mk(S), x = ctxOf(c);
  x.save(); x.translate(S / 2, S / 2);
  for (const a of [-0.6, 0.6]) { x.save(); x.rotate(a); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-S * 0.6, -S * 0.075 + S * 0.03, S * 1.2, S * 0.15); x.fillStyle = '#2b2f3a'; x.fillRect(-S * 0.6, -S * 0.075, S * 1.2, S * 0.15); x.fillStyle = '#4a5268'; for (let i = -5; i <= 5; i++) x.fillRect(i * S * 0.1 - S * 0.015, -S * 0.06, S * 0.03, S * 0.12); x.restore(); }
  x.fillStyle = '#1b1e26'; x.fill(rr(-S * 0.14, -S * 0.12, S * 0.28, S * 0.24, S * 0.05)); x.fillStyle = '#6b7488'; x.fillRect(-S * 0.08, -S * 0.04, S * 0.16, S * 0.08);
  x.restore(); return c;
}
function mud(S) { // muddy ground under a cell
  const c = mk(S), x = ctxOf(c), m = S * 0.03;
  const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#9a6a3a'); g.addColorStop(1, '#6e4520'); x.fillStyle = g; x.fill(rr(m, m, S - 2 * m, S - 2 * m, S * 0.14));
  x.fillStyle = 'rgba(60,35,15,.55)'; for (const [a, b, r] of [[.28, .3, .1], [.7, .25, .07], [.55, .7, .12], [.22, .75, .06], [.8, .62, .05]]) { x.beginPath(); x.ellipse(S * a, S * b, S * r * 1.4, S * r, 0, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(255,230,190,.25)'; x.beginPath(); x.ellipse(S * 0.62, S * 0.68, S * 0.08, S * 0.035, 0, 0, 7); x.fill();
  return c;
}
function combo(S, kind) { const c = mk(S), x = ctxOf(c); const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, '#fff'); g.addColorStop(0.4, '#fff6a0'); g.addColorStop(1, 'rgba(255,200,40,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); star(x, S / 2, S / 2, S * 0.42, '#fff'); return c; }
// mini badge for "this group makes a special"
function badge(S, kind) {
  const c = mk(S), x = ctxOf(c), r = S * 0.46;
  x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(S / 2, S / 2 + S * 0.04, r, 0, 7); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(S / 2, S / 2, r, 0, 7); x.fill();
  x.strokeStyle = kind === 'rocket' ? '#ffb000' : kind === 'bomb' ? '#e8382e' : '#35a2ff'; x.lineWidth = S * 0.08; x.stroke();
  const k = S * 1.25, o = (S - k) / 2;
  if (kind === 'rocket') x.drawImage(rocket(k, 'h'), o, o);
  else if (kind === 'bomb') x.drawImage(bomb(k * 0.8), (S - k * 0.8) / 2, (S - k * 0.8) / 2);
  else x.drawImage(disco(k * 0.75, 'b'), (S - k * 0.75) / 2, (S - k * 0.75) / 2);
  return c;
}
const cache = new Map();
function sprite(p, S) {
  S = Math.max(8, Math.round(S));
  const key = p.t + '|' + (p.c != null ? p.c : '') + '|' + (p.dir || '') + '|' + (p.hp || '') + '|' + (p.mx || '') + '|' + (p.kind || '') + '|' + S;
  let c = cache.get(key); if (c) return c;
  if (p.t === 'b') c = block(S, CK[p.c]);
  else if (p.t === 'rocket') c = rocket(S, p.dir);
  else if (p.t === 'bomb') c = bomb(S);
  else if (p.t === 'disco') c = disco(S, CK[p.c != null ? p.c : 2]);
  else if (p.t === 'box') c = box(S, p.mx || p.hp, p.hp);
  else if (p.t === 'drum') c = drum(S);
  else if (p.t === 'router') c = router(S);
  else if (p.t === 'lamp') c = lamp(S, CK[p.c != null ? p.c : 0]);
  else if (p.t === 'tie') c = tie(S);
  else if (p.t === 'mud') c = mud(S);
  else if (p.t === 'tieblock') { c = mk(S); const x = ctxOf(c); x.drawImage(block(S, CK[p.c || 0]), 0, 0); x.drawImage(tie(S), 0, 0); }
  else if (p.t === 'badge') c = badge(S, p.kind);
  else c = combo(S, p.t);
  cache.set(key, c); return c;
}
function goalSprite(key, S) {
  const ci = CK.indexOf(key);
  if (ci >= 0) return sprite({ t: 'b', c: ci }, S);
  if (key === 'box') return sprite({ t: 'box', hp: 1, mx: 1 }, S);
  if (key === 'lamp') return sprite({ t: 'lamp', c: 0 }, S);
  if (key === 'tie') return sprite({ t: 'tieblock', c: 2 }, S);
  if (key === 'mud') return sprite({ t: 'mud' }, S);
  return sprite({ t: key }, S);
}
root.Art = { sprite, goalSprite, PAL, CK, clear: () => cache.clear() };
})(this);
