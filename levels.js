/* イルカのブラスト - levels. layout: '.' random block, ' ' hole, x 段ボール(1), X 木箱(2), d ケーブルドラム, R 光ルーター
   goals: r プラグ y ヘルメット b 電波 g スパナ p ナット o コーン / box / drum / router */
(function (root) {
const F = '........';
const HAND = [
 { name: 'はじめての現場', colors: 4, moves: 15, goals: { r: 12 }, layout: [F,F,F,F,F,F,F,F,F], tip: '同じ色が2つ以上くっついている所をタップ！' },
 { name: 'ヘルメットと電波', colors: 4, moves: 15, goals: { y: 18, b: 18 }, layout: [F,F,F,F,F,F,F,F,F], tip: '5個以上まとめて消すとドリルができるよ' },
 { name: '資材置き場', colors: 4, moves: 27, goals: { box: 'all' }, layout: [F,F,F,F,F,F,F,'xxxxxxxx','xxxxxxxx'], tip: '段ボールはとなりで消すと壊れるよ' },
 { name: 'ドリル解禁', colors: 5, moves: 27, goals: { g: 22, p: 22 }, layout: [F,F,F,F,F,F,F,F,F], tip: 'ドリルはタップすると一列まるごと掘るよ' },
 { name: 'ケーブルドラム', colors: 4, moves: 15, goals: { drum: 'all' }, layout: [F,'.d....d.',F,'...dd...',F,'.d....d.',F,'...dd...',F], tip: 'ドラムはとなりで消すと回収できるよ' },
 { name: 'ルーターを届けよう', colors: 4, moves: 17, goals: { router: 2 }, layout: ['..R..R..',F,F,F,F,F,F,F,F], tip: 'ルーターを一番下まで降ろすと開通！' },
 { name: 'ひし形の電柱', colors: 5, moves: 25, goals: { p: 20, box: 'all' }, layout: ['   ..   ','  ....  ',' ...... ','........','xx....xx','........',' ...... ','  .xx.  ','   ..   '] },
 { name: '重い木箱', colors: 5, moves: 38, goals: { box: 'all' }, layout: [F,F,F,F,F,F,'..XXXX..','.xxxxxx.','xxxxxxxx'], tip: '木箱は2回たたくと壊れるよ' },
 { name: '巻き取り作業', colors: 5, moves: 33, goals: { r: 20, drum: 10 }, drumRate: 0.05, layout: [F,F,'d......d',F,'..d..d..',F,'d......d',F,F] },
 { name: '光回線、開通！', colors: 4, moves: 22, goals: { box: 'all', router: 2 }, layout: ['..R..R..',F,F,F,F,F,F,'x..xx..x','xxxxxxxx'] },
 { name: '鉄塔のぼり', colors: 5, moves: 31, goals: { y: 25, b: 25, g: 25 }, layout: ['  ....  ','  ....  ',' ...... ',' ...... ','........','........','........','........','........'] },
 { name: '倉庫の整理', colors: 5, moves: 29, goals: { box: 'all' }, layout: ['........','........','x......x','........','........','........','........','xxxxxxxx','xxxxxxxx'] },
 { name: '雨の日の配線', colors: 5, moves: 34, goals: { drum: 14, router: 2 }, drumRate: 0.06, layout: ['...R....',F,'.d.d.d.d',F,'d.d.d.d.',F,F,F,F] },
 { name: 'マンホール', colors: 5, moves: 25, goals: { box: 'all', p: 25 }, layout: [F,F,'..xxxx..','.x....x.','.x....x.','.x....x.','..xxxx..',F,F] },
 { name: '中継局', colors: 5, moves: 40, goals: { router: 3, r: 20 }, routerRate: 0.25, layout: ['R......R','........','........','...  ...','...  ...','........','........','........','........'] },
 { name: 'ケーブル工場', colors: 5, moves: 40, goals: { drum: 'all', box: 'all' }, layout: ['........','dd....dd','........','..dddd..','........','........','xx....xx','xxxxxxxx','xxxxxxxx'] },
 { name: '電柱の林', colors: 6, moves: 36, goals: { o: 20, g: 20 }, layout: ['........','........','. .. .. ','. .. .. ','........','........','........','........','........'] },
 { name: '地下ケーブル', colors: 5, moves: 40, goals: { box: 'all', router: 3 }, layout: ['...RR...',F,F,F,F,'xxx..xxx','xXx..xXx','xxx..xxx',F] },
 { name: '大雨注意', colors: 6, moves: 30, goals: { drum: 18 }, drumRate: 0.08, layout: [F,'d.d..d.d',F,'.d.dd.d.',F,'d.d..d.d',F,F,F] },
 { name: '基地局建設', colors: 6, moves: 39, goals: { box: 'all', y: 25 }, layout: ['........','........','........','.xxxxxx.','.x....x.','.x....x.','.xxxxxx.','........','........'] },
 { name: '夜間工事', colors: 5, moves: 38, goals: { router: 3, box: 'all' }, layout: ['..R..R..',F,F,F,F,F,'x.x..x.x',F,'xxxxxxxx'] },
 { name: 'ドラムの山', colors: 6, moves: 40, goals: { drum: 'all', b: 20 }, layout: [F,F,'...dd...','..dddd..','.dddddd.','dddddddd',F,F,F] },
 { name: 'Y字の鉄塔', colors: 5, moves: 36, goals: { box: 'all', p: 25 }, layout: ['...  ...','...  ...','...  ...','........',' x....x ','  x..x  ','  x..x  ','  ....  ','  xxxx  '] },
 { name: '光ファイバー網', colors: 5, moves: 40, goals: { router: 3, drum: 10 }, drumRate: 0.05, routerRate: 0.25, layout: ['R..R..R.',F,'d......d',F,'..d..d..',F,'d......d',F,F] },
 { name: '大型倉庫', colors: 5, moves: 34, goals: { box: 'all' }, layout: [F,F,F,F,'xXxXxXxX','XxXxXxXx','xxxxxxxx',F,F] },
 { name: '雷にそなえて', colors: 6, moves: 40, goals: { r: 25, y: 25, o: 25 }, layout: [F,F,F,F,F,F,F,F,F] },
 { name: '海底ケーブル', colors: 5, moves: 40, goals: { router: 3, box: 'all' }, layout: ['.R....R.',F,F,F,F,'x......x','xx....xx','xxx..xxx',F] },
 { name: '台風一過', colors: 5, moves: 38, goals: { drum: 14, box: 'all' }, drumRate: 0.07, layout: [F,'d.d..d.d',F,'.d.dd.d.',F,F,F,'x..xx..x','xxxxxxxx'] },
 { name: '最後の難所', colors: 5, moves: 40, goals: { box: 'all', router: 2, g: 20 }, layout: ['...RR...',F,F,'xx....xx','Xx....xX','.x....x.',F,'xx....xx','xx....xx'] },
 { name: '全国開通！', colors: 5, moves: 38, goals: { box: 'all', drum: 'all', router: 3 }, layout: ['R..R..R.',F,'d......d','.d....d.','xxx..xxx','xx....xx',F,F,'x.x..x.x'] },
];
// ---------------------------------------------------------------- areas (a new one every 50 levels)
const AREAS = [
  { name: '住宅街', top: '#5cc3ff', bot: '#9be36b' }, { name: '山あい', top: '#7fb0ff', bot: '#5fcf9b' },
  { name: '海辺', top: '#4fc0ff', bot: '#ffe0a0' }, { name: '商店街', top: '#ffb38a', bot: '#ffd86b' },
  { name: '工場地帯', top: '#9aa8bd', bot: '#c9b48a' }, { name: '雪の町', top: '#bfe3ff', bot: '#f4fbff' },
  { name: '港町', top: '#3f8fd8', bot: '#8fd3e8' }, { name: '夜の都会', top: '#2a2f6b', bot: '#6b4fa8' },
  { name: '離島', top: '#3fd0e0', bot: '#b8f0a0' }, { name: '全国ネット', top: '#ff9de0', bot: '#ffd84d' },
];
const TASKS = ['電柱工事', '配線点検', '光ケーブル敷設', '中継器の交換', '鉄塔の点検', '地下配管', '分電盤の整理', 'アンテナ調整', '資材の搬入', 'ケーブル巻き取り', '端子箱の設置', '夜間メンテ', '回線の切替', '足場の組立', '基地局の増設'];
// ---------------------------------------------------------------- deterministic level generator (levels 31+)
function mul(seed) { let s = seed >>> 0; return () => { let t = (s = (s + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const SHAPES = {
  full: ['........', '........', '........', '........', '........', '........', '........', '........', '........'],
  topcut: ['  ....  ', ' ...... ', '........', '........', '........', '........', '........', '........', '........'],
  diamond: ['   ..   ', '  ....  ', ' ...... ', '........', '........', '........', ' ...... ', '  ....  ', '   ..   '],
  notch: ['........', '........', '........', '...  ...', '...  ...', '........', '........', '........', '........'],
  pillars: ['........', '........', '.. .. ..', '.. .. ..', '........', '........', '........', '........', '........'],
  ytower: ['...  ...', '...  ...', '...  ...', '........', '........', ' ...... ', '  ....  ', '  ....  ', '  ....  '],
  hourglass: ['........', '........', ' ...... ', '  ....  ', '  ....  ', ' ...... ', '........', '........', '........'],
  frame: ['........', '........', '........', '... ....', '..    ..', '... ....', '........', '........', '........'],
  corners: ['  ....  ', '  ....  ', '........', '........', '........', '........', '........', '  ....  ', '  ....  '],
  arch: ['........', '........', '........', '........', '........', '........', '...  ...', '..    ..', '..    ..'],
  vase: [' ...... ', '  ....  ', ' ...... ', '........', '........', '........', '........', ' ...... ', ' ...... '],
  sides: [' ...... ', ' ...... ', ' ...... ', '........', '........', '........', '........', '........', '........'],
};
const INTRO = { 35: 'lamp', 45: 'mud', 63: 'tie', 83: 'metal' };
const INTRO_TIP = { lamp: '色ランプは、同じ色をとなりで消すと回収できるよ', mud: 'ぬかるみの上のブロックを消すと、ぬかるみがきれいになるよ', tie: '結束バンドのブロックは動かない。同じ色でいっしょに消すと外れるよ', metal: '鉄の箱は3回たたくと壊れるよ' };
const COLK = ['r', 'y', 'b', 'g', 'p', 'o'];
function levelKind(n) { return n % 50 === 0 ? 'bigboss' : n % 10 === 0 ? 'boss' : (n % 10 === 1 || n % 10 === 6) ? 'breather' : 'normal'; }
function gen(n, pv) {
  pv = pv || 0; const ease = pv % 6, es = 1 - ease * 0.13;
  const R = mul(n * 7919 + 13 + Math.floor(pv / 6) * 104729), ri = k => Math.floor(R() * k), pick = a => a[ri(a.length)];
  const kind = levelKind(n), t = Math.min(1, (n - 31) / 469), intro = INTRO[n];
  const mult = { breather: 0.7, normal: 1, boss: 1.15, bigboss: 1.25 }[kind];
  let colors = kind === 'breather' ? (t < 0.3 ? 4 : 5) : (R() < 0.12 + 0.3 * t ? 6 : 5);
  const shapeName = intro || kind === 'breather' ? pick(['full', 'topcut', 'corners']) : pick(Object.keys(SHAPES));
  const g = SHAPES[shapeName].map(r => r.split('')), mud = g.map(r => r.map(() => '.'));
  const H = 9, W = 8, open = (r, c) => g[r][c] === '.';
  const clearCols = []; for (let c = 0; c < W; c++) { let ok = true; for (let r = 0; r < H; r++) if (g[r][c] === ' ') ok = false; if (ok) clearCols.push(c); }
  const feats = ['color', 'box', 'drum', 'router'];
  if (n >= 35) feats.push('lamp'); if (n >= 45) feats.push('mud'); if (n >= 60) feats.push('tie');
  const want = intro ? 1 : kind === 'breather' ? 1 : kind === 'normal' ? (R() < 0.55 + 0.3 * t ? 2 : 1) : kind === 'boss' ? (R() < 0.5 ? 3 : 2) : 3;
  let chosen = intro ? [intro === 'metal' ? 'box' : intro] : [];
  while (chosen.length < want) { const f = pick(feats); if (f === 'router' && clearCols.length < 2) continue; if (f !== 'color' && chosen.includes(f)) continue; if (chosen.filter(x => x === 'color').length >= 2 && f === 'color') continue; chosen.push(f); }
  const goals = {}; const usedCol = []; let routerRate;
  const cnt = base => Math.max(3, Math.round(base * mult * es));
  // symmetric scatter placement on open cells in rows [r0,r1]
  const scatter = (ch, k, r0, r1, onMud) => {
    const cells = []; for (let r = r0; r <= r1; r++) for (let c = 0; c < 4; c++) if (onMud ? (g[r][c] !== ' ' && mud[r][c] === '.') : open(r, c)) cells.push([r, c]);
    for (let i = cells.length - 1; i > 0; i--) { const j = ri(i + 1); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    let placed = 0;
    for (const [r, c] of cells) { if (placed >= k) break; for (const cc of [c, W - 1 - c]) { if (placed >= k) break; if (onMud) { if (g[r][cc] !== ' ' && mud[r][cc] === '.') { mud[r][cc] = 'm'; placed++; } } else if (open(r, cc)) { g[r][cc] = ch; placed++; } } }
    return placed;
  };
  for (const f of chosen) {
    if (f === 'color') { let ci; do ci = ri(colors); while (usedCol.includes(ci)); usedCol.push(ci); goals[COLK[ci]] = cnt(14 + 16 * t); }
    else if (f === 'box') {
      const k = cnt(8 + 10 * t), pat = intro === 'metal' ? 'bottom' : pick(['bottom', 'band', 'scatter', 'ring', 'side']);
      let placed = 0;
      if (pat === 'bottom') { for (let r = H - 1; r >= 4 && placed < k; r--) for (const c of [0, 7, 1, 6, 2, 5, 3, 4]) if (open(r, c) && placed < k) { g[r][c] = 'x'; placed++; } }
      else if (pat === 'band') { const r0 = 4 + ri(3); for (let r = r0; r < Math.min(H, r0 + 2) && placed < k; r++) for (let c = 0; c < W && placed < k; c++) if (open(r, c) && (c + r) % 3 !== 0) { g[r][c] = 'x'; placed++; } }
      else if (pat === 'ring') { const r0 = 3 + ri(2); for (let r = r0; r < Math.min(H, r0 + 4); r++) for (let c = 1; c < W - 1; c++) { const edge = r === r0 || r === r0 + 3 || c === 1 || c === W - 2; if (edge && open(r, c) && placed < k) { g[r][c] = 'x'; placed++; } } }
      else if (pat === 'side') { for (let r = H - 1; r >= 3 && placed < k; r--) for (const c of [0, 7, 1, 6]) if (open(r, c) && placed < k) { g[r][c] = 'x'; placed++; } }
      if (placed < k) scatter('x', k - placed, 3, H - 1);
      // stronger boxes
      const pX = intro === 'metal' ? 0.2 : 0.1 + 0.3 * t, pK = n >= 83 && intro !== 'metal' ? 0.03 + 0.12 * t : 0;
      for (let r = 0; r < H; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 'x' && g[r][W - 1 - c] === 'x') { const u = R(); const ch = u < pK ? 'K' : u < pK + pX ? 'X' : 'x'; g[r][c] = ch; g[r][W - 1 - c] = ch; }
      if (intro === 'metal') { let done = 0; for (let r = H - 1; r >= 0 && done < 2; r--) for (const c of [2, 5]) if ('xX'.includes(g[r][c]) && done < 2) { g[r][c] = 'K'; done++; } }
      goals.box = 'all';
    }
    else if (f === 'drum') { scatter('d', cnt(5 + 6 * t), 1, 6); goals.drum = 'all'; }
    else if (f === 'lamp') { scatter('L', cnt(4 + 6 * t), 1, 7); goals.lamp = 'all'; }
    else if (f === 'tie') { scatter('T', cnt(5 + 8 * t), 2, 8); goals.tie = 'all'; }
    else if (f === 'mud') {
      const k = cnt(8 + 12 * t), pat = pick(['bottom', 'scatter', 'mid']); let placed = 0;
      if (pat === 'bottom') { for (let r = H - 1; r >= 2 && placed < k; r--) for (const c of [0, 7, 1, 6, 2, 5, 3, 4]) if (g[r][c] !== ' ' && mud[r][c] === '.' && placed < k) { mud[r][c] = 'm'; placed++; } }
      else if (pat === 'mid') { for (let r = 3; r < 7 && placed < k; r++) for (let c = 1; c < W - 1 && placed < k; c++) if (g[r][c] !== ' ' && mud[r][c] === '.') { mud[r][c] = 'm'; placed++; } }
      if (placed < k) scatter('m', k - placed, 2, H - 1, true);
      goals.mud = 'all';
    }
    else if (f === 'router') {
      const k = kind === 'breather' ? 2 : Math.max(1, Math.round((2 + (t > 0.4 ? 1 : 0) + (kind.includes('boss') ? 1 : 0)) * (ease >= 3 ? 0.7 : 1)));
      const cols = clearCols.slice(); for (let i = cols.length - 1; i > 0; i--) { const j = ri(i + 1); [cols[i], cols[j]] = [cols[j], cols[i]]; }
      for (let i = 0; i < Math.min(k, cols.length, 3); i++) g[0][cols[i]] = 'R';
      goals.router = k; routerRate = 0.25;
    }
  }
  const area = AREAS[Math.floor((n - 1) / 50)] || AREAS[AREAS.length - 1];
  const name = (kind === 'bigboss' ? '★大ボス：' : kind === 'boss' ? '★ボス：' : '') + area.name + 'の' + TASKS[(n * 7 + Math.floor(n / 50)) % TASKS.length];
  const tip = intro ? INTRO_TIP[intro] : kind === 'bigboss' ? 'エリアの大ボス！ブースターも使ってね' : kind === 'boss' ? 'ボス現場！特殊ブロックをためてコンボを狙おう' : '';
  const L = { name, colors, moves: 30, goals, layout: g.map(r => r.join('')), kind, gen: pv };
  if (mud.some(r => r.includes('m'))) L.mud = mud.map(r => r.join(''));
  if (routerRate) L.routerRate = routerRate;
  if (tip) L.tip = tip;
  return L;
}
// tuned [moves, variant] for generated levels (tools/tune500.js writes this)
const TUNE = /*TUNE*/{31:[15,0],32:[24,0],33:[32,2],34:[22,0],35:[34,0],36:[15,0],37:[27,3],38:[30,3],39:[17,6],40:[33,3],41:[15,0],42:[15,3],43:[39,0],44:[15,0],45:[17,6],46:[15,0],47:[40,7],48:[28,0],49:[20,0],50:[34,2],51:[15,0],52:[39,5],53:[34,1],54:[25,6],55:[25,0],56:[21,0],57:[36,0],58:[37,3],59:[31,0],60:[36,2],61:[23,0],62:[21,3],63:[25,1],64:[37,3],65:[32,6],66:[15,0],67:[34,0],68:[27,0],69:[28,0],70:[38,0],71:[17,0],72:[15,0],73:[37,4],74:[31,6],75:[15,0],76:[15,0],77:[40,9],78:[27,1],79:[38,0],80:[42,10],81:[15,0],82:[20,0],83:[40,0],84:[17,6],85:[36,1],86:[15,0],87:[18,0],88:[35,1],89:[15,0],90:[42,3],91:[15,0],92:[35,2],93:[19,0],94:[23,0],95:[22,0],96:[30,0],97:[15,0],98:[20,5],99:[40,6],100:[39,0],101:[18,0],102:[34,0],103:[32,2],104:[33,0],105:[26,0],106:[21,0],107:[34,0],108:[15,0],109:[18,0],110:[44,6],111:[15,0],112:[21,3],113:[15,0],114:[19,0],115:[26,0],116:[27,0],117:[37,13],118:[34,0],119:[33,6],120:[37,0],121:[29,0],122:[31,3],123:[40,0],124:[36,10],125:[33,0],126:[23,0],127:[40,0],128:[18,0],129:[15,5],130:[33,0],131:[15,0],132:[27,3],133:[31,0],134:[30,0],135:[35,5],136:[15,0],137:[39,8],138:[31,2],139:[37,0],140:[40,0],141:[22,0],142:[37,0],143:[15,0],144:[39,1],145:[31,0],146:[15,0],147:[36,2],148:[34,3],149:[35,0],150:[36,0],151:[30,1],152:[28,0],153:[40,3],154:[31,0],155:[34,6],156:[15,0],157:[40,16],158:[20,0],159:[29,6],160:[28,0],161:[15,0],162:[15,6],163:[37,8],164:[40,1],165:[28,2],166:[23,0],167:[38,0],168:[25,1],169:[28,0],170:[45,5],171:[15,0],172:[34,1],173:[23,0],174:[15,0],175:[31,7],176:[25,0],177:[23,0],178:[37,2],179:[31,13],180:[42,0],181:[22,6],182:[21,0],183:[35,1],184:[30,0],185:[34,1],186:[16,0],187:[21,0],188:[15,0],189:[30,0],190:[33,3],191:[29,2],192:[40,0],193:[40,0],194:[24,0],195:[38,0],196:[32,0],197:[30,1],198:[24,0],199:[15,3],200:[49,2],201:[18,0],202:[27,0],203:[25,0],204:[36,0],205:[16,0],206:[32,12],207:[38,2],208:[34,3],209:[28,3],210:[42,5],211:[32,0],212:[28,2],213:[31,0],214:[39,1],215:[40,9],216:[15,0],217:[37,0],218:[29,0],219:[37,2],220:[42,0],221:[15,0],222:[27,0],223:[33,0],224:[21,0],225:[20,1],226:[18,0],227:[22,0],228:[29,6],229:[21,0],230:[30,11],231:[31,1],232:[40,2],233:[27,7],234:[39,0],235:[40,0],236:[18,6],237:[39,0],238:[39,3],239:[35,2],240:[45,1],241:[30,0],242:[30,1],243:[25,0],244:[33,2],245:[35,2],246:[18,0],247:[27,0],248:[40,5],249:[22,0],250:[35,12],251:[15,6],252:[16,0],253:[33,0],254:[39,6],255:[39,4],256:[22,6],257:[37,1],258:[29,0],259:[16,0],260:[44,5],261:[31,0],262:[35,0],263:[20,0],264:[15,0],265:[30,6],266:[21,0],267:[27,0],268:[22,0],269:[31,5],270:[35,4],271:[22,2],272:[39,1],273:[31,11],274:[35,0],275:[25,9],276:[15,12],277:[32,0],278:[33,3],279:[40,0],280:[39,0],281:[30,9],282:[32,6],283:[34,0],284:[27,6],285:[34,0],286:[27,6],287:[24,0],288:[34,0],289:[34,0],290:[45,1],291:[27,5],292:[31,6],293:[35,0],294:[40,4],295:[19,0],296:[22,12],297:[31,1],298:[33,11],299:[32,12],300:[50,17],301:[19,0],302:[35,2],303:[36,7],304:[39,3],305:[36,5],306:[23,6],307:[38,0],308:[15,6],309:[39,5],310:[40,3],311:[21,0],312:[25,0],313:[33,3],314:[40,4],315:[40,11],316:[29,0],317:[27,0],318:[26,1],319:[38,5],320:[35,1],321:[32,16],322:[21,0],323:[36,7],324:[32,1],325:[40,2],326:[19,0],327:[23,11],328:[40,2],329:[29,3],330:[39,5],331:[15,0],332:[37,17],333:[34,0],334:[33,0],335:[26,9],336:[20,0],337:[29,0],338:[29,5],339:[40,0],340:[44,14],341:[29,7],342:[40,10],343:[35,14],344:[25,0],345:[29,9],346:[15,0],347:[40,1],348:[30,5],349:[39,2],350:[36,15],351:[18,0],352:[31,0],353:[35,0],354:[19,0],355:[25,0],356:[26,0],357:[26,0],358:[34,3],359:[38,2],360:[42,2],361:[28,0],362:[33,1],363:[19,0],364:[34,12],365:[36,1],366:[25,0],367:[28,1],368:[40,0],369:[38,7],370:[44,9],371:[23,0],372:[40,3],373:[36,9],374:[32,6],375:[37,0],376:[22,6],377:[38,11],378:[24,12],379:[35,1],380:[40,11],381:[31,0],382:[22,4],383:[37,6],384:[39,13],385:[39,6],386:[26,14],387:[25,2],388:[37,5],389:[40,2],390:[42,11],391:[15,0],392:[40,4],393:[15,0],394:[31,4],395:[25,6],396:[24,0],397:[40,3],398:[38,1],399:[35,0],400:[50,9],401:[22,6],402:[29,6],403:[32,6],404:[35,2],405:[36,1],406:[22,0],407:[30,0],408:[35,9],409:[36,1],410:[36,1],411:[15,1],412:[30,0],413:[39,13],414:[40,8],415:[36,0],416:[30,9],417:[35,1],418:[37,6],419:[39,3],420:[37,0],421:[29,4],422:[27,12],423:[25,6],424:[31,10],425:[33,0],426:[24,4],427:[40,4],428:[24,1],429:[40,0],430:[43,1],431:[32,1],432:[28,3],433:[32,3],434:[35,0],435:[29,0],436:[24,0],437:[26,6],438:[40,10],439:[35,5],440:[38,9],441:[28,13],442:[34,8],443:[30,12],444:[38,1],445:[39,11],446:[32,12],447:[25,0],448:[39,5],449:[35,5],450:[49,2],451:[19,8],452:[35,0],453:[35,2],454:[20,6],455:[30,0],456:[23,6],457:[37,1],458:[38,0],459:[21,3],460:[45,3],461:[30,6],462:[25,17],463:[38,0],464:[28,0],465:[33,5],466:[17,6],467:[32,0],468:[37,4],469:[15,6],470:[42,16],471:[18,12],472:[31,6],473:[31,0],474:[38,3],475:[32,1],476:[23,15],477:[39,8],478:[38,2],479:[39,3],480:[41,13],481:[15,6],482:[26,0],483:[39,8],484:[36,15],485:[36,4],486:[22,6],487:[24,0],488:[37,0],489:[34,0],490:[40,5],491:[15,0],492:[34,5],493:[30,10],494:[32,3],495:[40,4],496:[29,0],497:[33,7],498:[36,2],499:[38,14],500:[45,1]}/*END*/;
const TOTAL = 500;
const LEVELS = HAND.map((L, i) => Object.assign({ kind: levelKind(i + 1) === 'bigboss' ? 'boss' : (i + 1) % 10 === 0 ? 'boss' : 'normal' }, L));
for (let n = HAND.length + 1; n <= TOTAL; n++) { const tu = TUNE[n] || [30, 0]; const L = gen(n, tu[1]); L.moves = tu[0]; LEVELS.push(L); }
const api = LEVELS; api.gen = gen; api.AREAS = AREAS; api.levelKind = levelKind; api.HAND = HAND.length;
if (typeof module !== 'undefined' && module.exports) module.exports = api; else { root.BLAST_LEVELS = api; root.BLAST_AREAS = AREAS; }
})(this);
