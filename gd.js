/* gd.js v3 — «Geometry Dash»-подібна гра: 10 власних рівнів (куб + корабель), відсоток проходження,
   спроби, практичний режим із чекпоїнтами, синтезована музика. 15-й апгрейд у магазині.
   Рівні — НЕ офіційні (вони належать автору оригіналу): усі 10 згенеровані й виважені тут. */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  function $(i) { return doc.getElementById(i); }
  function tt(k) { try { return typeof t === 'function' ? t(k) : k; } catch (e) { return k; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var FX = function () { return window.__fx || {}; };
  function vib(p) { try { FX().vib && FX().vib(p); } catch (e) {} }
  function lite() { try { return FX().lite(); } catch (e) { return false; } }

  /* ============================================================ інтеграція в магазин (апгрейд №15) */
  if (typeof upgrades !== 'undefined' && upgrades.length === 14 && !upgrades.__gd) {
    upgrades.__gd = true;
    upgrades.push({ n: 'Geometry Dash', c: 900000000, l: 0 });
  }
  if (typeof window.revealNext === 'function') {
    var orn = window.revealNext;
    window.revealNext = function () {                   // 15-й апгрейд з'являється після «Філософських роздумів»
      var r = orn.apply(this, arguments);
      try { if (upgrades[12].l > 0 && buttons[14]) buttons[14].classList.remove('hidden'); if (upgrades[14] && upgrades[14].l > 0 && buttons[14]) buttons[14].classList.remove('hidden'); } catch (e) {}
      return r;
    };
  }
  if (typeof window.buyUpgrade === 'function') {
    var obu = window.buyUpgrade;
    window.buyUpgrade = function (i) {
      var before = 0; try { before = upgrades[i].l; } catch (e) {}
      var r = obu.apply(this, arguments);
      try {
        if (i === 14 && upgrades[14].l > before) setTimeout(openGD, 300);
        if (i === 12 && buttons[14]) buttons[14].classList.remove('hidden');
      } catch (e) {}
      return r;
    };
  }
  try { var u11 = upgrades[11]; if (u11 && u11.n === 'Кубічне Бінго') u11.n = 'Minecraft-пісочниця'; } catch (e) {}

  /* ============================================================ рівні */
  var LEVELS = [
    { n: 'Старт',          bpm: 120, len: 230, diff: 1,  ship: 0, pal: ['#0b1d4a', '#1d4ed8', '#38bdf8'] },
    { n: 'Неонове місто',  bpm: 128, len: 300, diff: 2,  ship: 0, pal: ['#2a0a46', '#9d174d', '#f472b6'] },
    { n: 'Ритм',           bpm: 132, len: 340, diff: 3,  ship: 1, pal: ['#052e2b', '#0f766e', '#2dd4bf'] },
    { n: 'Космос',         bpm: 136, len: 380, diff: 4,  ship: 1, pal: ['#0a0720', '#4c1d95', '#a78bfa'] },
    { n: 'Лазер',          bpm: 140, len: 420, diff: 5,  ship: 1, pal: ['#2b0a0a', '#b91c1c', '#fb7185'] },
    { n: 'Спека',          bpm: 144, len: 460, diff: 6,  ship: 2, pal: ['#2a1405', '#c2410c', '#fbbf24'] },
    { n: 'Крижаний шлях',  bpm: 148, len: 500, diff: 7,  ship: 2, pal: ['#07192b', '#0369a1', '#bae6fd'] },
    { n: 'Кібер',          bpm: 152, len: 540, diff: 8,  ship: 2, pal: ['#04140a', '#15803d', '#86efac'] },
    { n: 'Хаос',           bpm: 156, len: 600, diff: 9,  ship: 3, pal: ['#1a0524', '#a21caf', '#f0abfc'] },
    { n: 'Демон часу',     bpm: 160, len: 700, diff: 10, ship: 3, pal: ['#14040a', '#e11d48', '#fda4af'] }
  ];
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* генерація: усе виважено під фізику стрибка (висота ≈2.1, довжина ≈3.9 клітинки) */
  var cache = {};
  function build(idx) {
    if (cache[idx]) return cache[idx];
    var L = LEVELS[idx], r = rng(1000 + idx * 31), spikes = [], blocks = [], gaps = [], portals = [], ships = [], x = 14;
    function spike(sx, sy) { spikes.push({ x: sx, y: sy || 0 }); }
    function block(bx, by) { blocks.push({ x: bx, y: by }); }
    var shipAt = []; for (var k = 1; k <= L.ship; k++) shipAt.push(Math.round(L.len / (L.ship + 1) * k));
    var shipLen = 46 + L.diff * 3, lastW = 0;
    var P = [
      { min: 1, w: 3, f: function (a) { spike(a); return 1; } },
      { min: 1, w: 2, f: function (a) { spike(a); spike(a + 1); return 2; } },
      { min: 2, w: 2, f: function (a) { block(a, 0); block(a + 1, 0); spike(a + 3); return 4; } },
      { min: 2, w: 2, f: function (a) { gaps.push({ x0: a, x1: a + 2 }); return 2; } },
      { min: 3, w: 2, f: function (a) { spike(a); spike(a + 3); return 4; } },
      { min: 3, w: 2, f: function (a) { block(a, 0); block(a + 1, 0); block(a + 2, 0); block(a + 2, 1); block(a + 3, 0); block(a + 3, 1); spike(a + 6); return 7; } },
      { min: 4, w: 2, f: function (a) { block(a, 0); spike(a, 1); return 1; } },
      { min: 5, w: 2, f: function (a) { gaps.push({ x0: a, x1: a + 3 }); return 3; } },
      { min: 6, w: 2, f: function (a) { spike(a); spike(a + 1); gaps.push({ x0: a + 6, x1: a + 8 }); return 9; } },
      { min: 7, w: 2, f: function (a) { block(a, 0); block(a + 1, 0); spike(a + 2); spike(a + 3); block(a + 4, 0); block(a + 5, 0); return 6; } }
    ];
    while (x < L.len - 14) {
      if (shipAt.length && x >= shipAt[0]) {
        shipAt.shift();
        var x0 = Math.round(x), ph = r() * 6, A = 1.5 + L.diff * 0.12, gh = Math.max(3.4, 4.9 - L.diff * 0.2);
        portals.push({ x: x0, m: 'ship' }); ships.push([x0, x0 + shipLen]);
        for (var xi = 0; xi < shipLen; xi++) {
          var ramp = Math.min(1, xi / 6, (shipLen - xi) / 6), c = 2.7 + (Math.sin(xi * 0.17 + ph) * A + Math.sin(xi * 0.06 + ph) * 0.7) * ramp + (1 - ramp) * 0;
          for (var y = 0; y < 11; y++) if (y + 0.5 < c - gh / 2 || y + 0.5 > c + gh / 2) block(x0 + 4 + xi, y);
        }
        portals.push({ x: x0 + shipLen + 6, m: 'cube' });
        x = x0 + shipLen + 14; lastW = 0; continue;
      }
      var gap = Math.max(3.6, 5.6 - L.diff * 0.22) + r() * 1.3 + (lastW > 5 ? 1 : 0);
      x += gap;
      var pool = P.filter(function (p) { return L.diff >= p.min; }), p = pool[(r() * pool.length) | 0];
      lastW = p.f(Math.round(x)); x += lastW;
    }
    // індекс по клітинках для швидких колізій
    var bi = {}, si = {};
    blocks.forEach(function (b) { (bi[b.x] = bi[b.x] || []).push(b); });
    spikes.forEach(function (s) { (si[s.x] = si[s.x] || []).push(s); });
    return (cache[idx] = { L: L, spikes: spikes, blocks: blocks, gaps: gaps, portals: portals, ships: ships, bi: bi, si: si });
  }

  /* ============================================================ збереження */
  var SAVE = ls('fxGD', { best: [], done: [], att: [] });
  function saveGD() { lsSet('fxGD', SAVE); }

  /* ============================================================ музика (WebAudio, без файлів) */
  var M = { ctx: null, iv: 0, on: true, n: 0 };
  function mctx() {
    var S = window.__fxSnd; if (S && S.enabled && !S.enabled()) return null;
    if (!M.on) return null;
    if (!M.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { M.ctx = new C(); } catch (e) { return null; } }
    if (M.ctx.state === 'suspended') M.ctx.resume(); return M.ctx;
  }
  function osc(c, t0, f0, f1, dur, type, vol, lp) {
    var o = c.createOscillator(), g = c.createGain(), fl = null; o.type = type; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    if (lp) { fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function startMusic(bpm) {
    stopMusic(); var c = mctx(); if (!c) return; var beat = 60 / bpm, bass = [55, 55, 65.4, 49, 55, 73.4, 65.4, 49];
    M.n = 0;
    M.iv = setInterval(function () {
      var cc = mctx(); if (!cc) return; var t0 = cc.currentTime + 0.02, n = M.n++;
      if (n % 2 === 0) osc(cc, t0, 150, 45, 0.16, 'sine', 0.35);                          // kick
      else osc(cc, t0, 6000, 3000, 0.03, 'square', 0.03);                                 // hat
      if (n % 4 === 2) osc(cc, t0, 220, 160, 0.1, 'sawtooth', 0.05, 1500);               // «snare»
      if (n % 2 === 0) osc(cc, t0, bass[(n / 2) % bass.length] * 2, 0, beat * 0.9, 'sawtooth', 0.09, 700);
      if (n % 8 === 6) osc(cc, t0, bass[(n / 2) % bass.length] * 8, 0, beat * 0.5, 'triangle', 0.05);
    }, beat * 500);
  }
  function stopMusic() { clearInterval(M.iv); M.iv = 0; }
  function sfx(kind) {
    var c = mctx(); if (!c) return; var t0 = c.currentTime;
    if (kind === 'die') { osc(c, t0, 300, 40, 0.35, 'sawtooth', 0.25, 900); }
    else if (kind === 'win') { [523, 659, 784, 1046, 1318].forEach(function (f, i) { osc(c, t0 + i * 0.09, f, 0, 0.3, 'triangle', 0.18); }); }
    else if (kind === 'jump') { osc(c, t0, 500, 900, 0.07, 'square', 0.04); }
    else if (kind === 'portal') { osc(c, t0, 200, 1200, 0.25, 'sine', 0.15); }
  }

  /* ============================================================ гра */
  var G = null;
  var TILE_G = 122, JUMPV = 22.9, SPEED = 10.4, DT = 1 / 240;
  function newRun(idx, cp) {
    var lv = build(idx);
    return { lv: lv, idx: idx, x: cp ? cp.x : 0, y: cp ? cp.y : 0, vy: cp ? cp.vy : 0, mode: cp ? cp.mode : 'cube', ground: true, rot: 0, dead: false, deadT: 0, won: false, trail: [], parts: [], held: false, acc: 0, t: 0, cpl: cp ? cp.pct : 0 };
  }
  function shipAtX(lv, x) { for (var i = 0; i < lv.ships.length; i++) if (x >= lv.ships[i][0] + 3 && x <= lv.ships[i][1] + 5) return true; return false; }
  function overGap(lv, x0, x1) { for (var i = 0; i < lv.gaps.length; i++) { var g = lv.gaps[i]; if (x1 > g.x0 + 0.15 && x0 < g.x1 - 0.15) return true; } return false; }
  function die(r) {
    if (r.dead) return; r.dead = true; r.deadT = 0; sfx('die'); vib([40, 30, 80]);
    for (var i = 0; i < 26; i++) { var a = Math.random() * 6.28, s = 2 + Math.random() * 7; r.parts.push({ x: r.x + 0.5, y: r.y + 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, l: 1 }); }
    var pct = Math.min(99, Math.floor(r.x / r.lv.L.len * 100)); if (!G.practice && pct > (SAVE.best[r.idx] || 0)) { SAVE.best[r.idx] = pct; saveGD(); }
  }
  function step(r) {                                       // один фізичний крок (1/240 с)
    var lv = r.lv, prevX = r.x;
    r.x += SPEED * DT; r.t += DT;
    var ship = r.mode === 'ship', ix, i, arr, o;
    // портали
    for (i = 0; i < lv.portals.length; i++) { o = lv.portals[i]; if (prevX < o.x && r.x >= o.x && r.mode !== o.m) { r.mode = o.m; sfx('portal'); if (o.m === 'ship') { r.y = Math.max(r.y, 1); r.vy = 0; } } }
    ship = r.mode === 'ship';
    // ----- вертикаль
    if (ship) { r.vy += (r.held ? 48 : -48) * DT; r.vy = Math.max(-9, Math.min(9, r.vy)); }
    else { if (r.held && r.ground) { r.vy = JUMPV; r.ground = false; sfx('jump'); } r.vy -= TILE_G * DT; }
    var py0 = r.y; r.y += r.vy * DT; r.ground = false;
    var x0 = r.x + 0.06, x1 = r.x + 0.94, y0 = r.y, y1 = r.y + (ship ? 0.85 : 1);
    // підлога
    if (!overGap(lv, r.x, r.x + 1) && r.y <= 0) { r.y = 0; if (r.vy < 0) r.vy = 0; r.ground = true; y0 = 0; y1 = r.y + (ship ? 0.85 : 1); }
    if (ship && r.y > 10.5) { r.y = 10.5; r.vy = Math.min(r.vy, 0); }
    if (r.y < -2.5) { die(r); return; }
    // блоки
    for (ix = Math.floor(x0); ix <= Math.floor(x1); ix++) {
      arr = lv.bi[ix]; if (!arr) continue;
      for (i = 0; i < arr.length; i++) {
        var b = arr[i];
        if (x1 > b.x + 0.02 && x0 < b.x + 1 - 0.02 && y1 > b.y + 0.02 && y0 < b.y + 1 - 0.02) {
          if (!ship && py0 >= b.y + 1 - 0.28 && r.vy <= 0.5) { r.y = b.y + 1; r.vy = 0; r.ground = true; y0 = r.y; y1 = r.y + 1; }   // приземлення на верх блока
          else { die(r); return; }
        }
      }
    }
    // шипи
    for (ix = Math.floor(x0) - 1; ix <= Math.floor(x1); ix++) {
      arr = lv.si[ix]; if (!arr) continue;
      for (i = 0; i < arr.length; i++) {
        var s = arr[i];
        if (x1 > s.x + 0.3 && x0 < s.x + 0.7 && y1 > s.y + 0.05 && y0 < s.y + 0.52) { die(r); return; }
      }
    }
    // обертання
    if (!ship) { if (!r.ground) r.rot += (Math.PI / 2) / 0.375 * DT; else r.rot = Math.round(r.rot / (Math.PI / 2)) * (Math.PI / 2); }
    else r.rot = Math.max(-0.7, Math.min(0.7, -r.vy * 0.07));
    // чекпоїнти практичного режиму
    if (G.practice && r.ground && !ship) { var pc = Math.floor(r.x / lv.L.len * 10); if (pc > r.cpl) { r.cpl = pc; G.cp = { x: r.x, y: r.y, vy: 0, mode: r.mode, pct: pc }; } }
    if (r.x >= lv.L.len) win(r);
  }
  function win(r) {
    if (r.won) return; r.won = true; sfx('win'); vib([30, 40, 80, 40, 120]);
    var first = !SAVE.done[r.idx] && !G.practice;
    if (!G.practice) { SAVE.done[r.idx] = 1; SAVE.best[r.idx] = 100; saveGD(); }
    var reward = 0;
    if (first) {
      try { var base = window.__fxFeatures ? window.__fxFeatures.base() : 5000; reward = Math.round(base * 3 * (r.idx + 1)); score += reward; clickCloudTotal += reward; updateScore(); saveGame(); } catch (e) {}
      try { showToast('🔷 ' + tt('Рівень пройдено:') + ' ' + LEVELS[r.idx].n + ' · +' + formatTime(reward)); } catch (e) {}
    }
    G.winMsg = { reward: reward, practice: G.practice, att: SAVE.att[r.idx] || 1 };
  }

  /* ----- відмальовка ----- */
  function draw() {
    var c = G.cv, x = G.ctx, W = c.width, H = c.height, r = G.run, lv = r.lv, L = lv.L, pal = L.pal;
    var S = Math.min(H / 9.4, W / 13), gy = H * (W > H ? 0.84 : 0.66), camX = r.x - 5.5 * (W > H ? 1 : 0.6);
    var beat = (r.t * L.bpm / 60) % 1, pulse = Math.pow(1 - beat, 3);
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // фон: пульсуючі «ромби»
    x.save(); x.globalAlpha = 0.10 + pulse * 0.1; x.fillStyle = pal[2];
    var step = S * 5, off = -((camX * S * 0.3) % step);
    for (var bx = off - step; bx < W + step; bx += step) { x.beginPath(); x.moveTo(bx + step / 2, gy - S * 8); x.lineTo(bx + step, gy - S * 4); x.lineTo(bx + step / 2, gy); x.lineTo(bx, gy - S * 4); x.closePath(); x.fill(); }
    x.restore();
    function X(wx) { return (wx - camX) * S; } function Y(wy) { return gy - wy * S; }
    // земля
    x.fillStyle = 'rgba(0,0,0,0.38)'; x.fillRect(0, gy, W, H - gy);
    x.strokeStyle = pal[2]; x.lineWidth = 3; x.shadowColor = pal[2]; x.shadowBlur = lite() ? 0 : 10;
    x.beginPath(); var open = false;
    var a0 = Math.floor(camX), a1 = Math.ceil(camX + W / S) + 1, cx0 = a0;
    for (var gx = a0; gx <= a1; gx++) { var inGap = overGap(lv, gx, gx + 1) && overGap(lv, gx + 0.2, gx + 0.8); if (!inGap) { if (!open) { x.moveTo(X(gx), gy); open = true; } x.lineTo(X(gx + 1), gy); } else open = false; }
    x.stroke(); x.shadowBlur = 0;
    // фініш
    if (L.len - camX < W / S + 2) { var fx = X(L.len); x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(fx, 0, S * 0.5, H); }
    // блоки
    x.lineWidth = 2;
    for (var ix = a0 - 1; ix <= a1; ix++) {
      var ba = lv.bi[ix]; if (ba) for (var i = 0; i < ba.length; i++) { var b = ba[i], bx0 = X(b.x), by0 = Y(b.y + 1); x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(bx0, by0, S + 1, S + 1); x.strokeStyle = pal[2]; x.strokeRect(bx0 + 1, by0 + 1, S - 2, S - 2); x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(bx0 + 3, by0 + 3, S - 6, S * 0.22); }
      var sa = lv.si[ix]; if (sa) for (var j = 0; j < sa.length; j++) { var s = sa[j], sx = X(s.x), sy = Y(s.y); x.fillStyle = '#05060c'; x.strokeStyle = pal[2]; x.beginPath(); x.moveTo(sx + 2, sy); x.lineTo(sx + S / 2, sy - S * 0.92); x.lineTo(sx + S - 2, sy); x.closePath(); x.fill(); x.stroke(); }
    }
    // портали
    lv.portals.forEach(function (p) { if (p.x < camX - 2 || p.x > camX + W / S + 2) return; var px = X(p.x), py = Y(2.5); x.strokeStyle = p.m === 'ship' ? '#f472b6' : '#38bdf8'; x.lineWidth = 5; x.beginPath(); x.ellipse(px, py, S * 0.35, S * 1.5, 0, 0, 7); x.stroke(); });
    // шлейф і частинки
    r.trail.forEach(function (tp, k) { x.fillStyle = 'rgba(255,255,255,' + (k / r.trail.length * 0.25) + ')'; x.fillRect(X(tp.x) + S * 0.25, Y(tp.y) - S * 0.75, S * 0.5, S * 0.5); });
    r.parts.forEach(function (p) { x.fillStyle = 'rgba(255,255,255,' + Math.max(0, p.l) + ')'; x.fillRect(X(p.x) - 3, Y(p.y) - 3, 6, 6); });
    // гравець
    if (!r.dead) {
      var ppx = X(r.x), ppy = Y(r.y);
      x.save(); x.translate(ppx + S / 2, ppy - S / 2); x.rotate(-r.rot);
      if (r.mode === 'ship') {
        x.fillStyle = '#facc15'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(-S * .5, S * .25); x.lineTo(S * .55, 0); x.lineTo(-S * .5, -S * .3); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#38bdf8'; x.fillRect(-S * .1, -S * .22, S * .3, S * .2);
      } else {
        x.fillStyle = '#facc15'; x.strokeStyle = '#fff'; x.lineWidth = 2; x.fillRect(-S / 2, -S / 2, S, S); x.strokeRect(-S / 2 + 1, -S / 2 + 1, S - 2, S - 2);
        x.fillStyle = '#0b1020'; x.fillRect(-S * .28, -S * .2, S * .18, S * .18); x.fillRect(S * .1, -S * .2, S * .18, S * .18); x.fillRect(-S * .25, S * .12, S * .5, S * .1);
      }
      x.restore();
    }
    // HUD
    var pct = Math.min(100, r.x / L.len * 100);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(W * 0.2, 14, W * 0.6, 8); x.fillStyle = pal[2]; x.fillRect(W * 0.2, 14, W * 0.6 * pct / 100, 8);
    x.fillStyle = '#fff'; x.font = '700 ' + Math.round(Math.max(14, H * 0.03)) + 'px Poppins,system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(Math.floor(pct) + '%', W / 2, 46);
    x.textAlign = 'left'; x.font = '600 ' + Math.round(Math.max(12, H * 0.024)) + 'px Poppins,system-ui,sans-serif'; x.fillStyle = 'rgba(255,255,255,.85)';
    x.fillText(tt('Спроба') + ' ' + (SAVE.att[r.idx] || 1) + (G.practice ? ' · ' + tt('практика') : ''), 14, H - 14);
    if (r.won) { x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '800 ' + Math.round(H * 0.07) + 'px Poppins,system-ui,sans-serif'; x.fillText(tt('Рівень пройдено!'), W / 2, H * 0.4);
      x.font = '600 ' + Math.round(H * 0.035) + 'px Poppins,system-ui,sans-serif'; x.fillText(G.winMsg.practice ? tt('(практика — без нагороди)') : (G.winMsg.reward ? '+' + formatTime(G.winMsg.reward) : tt('Нагороду вже отримано')), W / 2, H * 0.5);
      x.fillText(tt('Торкнись, щоб повернутись до рівнів'), W / 2, H * 0.6); }
    if (W < H && !G.hintDone) { x.fillStyle = 'rgba(255,255,255,.75)'; x.textAlign = 'center'; x.font = '600 13px Poppins,system-ui,sans-serif'; x.fillText('↻ ' + tt('Для зручності поверни телефон горизонтально'), W / 2, H * 0.12); }
  }
  function loop(ts) {
    if (!G || !G.run) return; G.raf = requestAnimationFrame(loop);
    var r = G.run, dt = Math.min(0.05, (ts - (G.last || ts)) / 1000); G.last = ts;
    if (G.paused) { draw(); return; }
    if (r.dead) {
      r.deadT += dt; r.parts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 18 * dt; p.l -= dt * 1.4; });
      if (r.deadT > 0.7) { SAVE.att[r.idx] = (SAVE.att[r.idx] || 1) + 1; if (!G.practice) saveGD(); var held = r.held; G.run = newRun(r.idx, G.practice ? G.cp : null); G.run.held = held; }
    } else if (!r.won) {
      r.acc += dt; var n = 0; while (r.acc >= DT && n < 40) { r.acc -= DT; n++; step(r); if (r.dead || r.won) break; }
      if (!r.dead) { r.trail.push({ x: r.x, y: r.y }); if (r.trail.length > 14) r.trail.shift(); }
    }
    draw();
  }

  /* ============================================================ UI */
  function menuHTML() {
    var h = '<div class="gd-head"><b>🔷 Geometry Dash</b><label class="gd-prac"><input type="checkbox" id="gdPrac"' + (G && G.practice ? ' checked' : '') + '> ' + tt('Практика (чекпоїнти)') + '</label></div>' +
      '<p class="gd-sub">' + tt('Тримай торкання/пробіл — куб стрибає, корабель летить вгору. За перше проходження — нагорода часом.') + '</p><div class="gd-list">';
    LEVELS.forEach(function (L, i) {
      var best = SAVE.best[i] || 0, done = SAVE.done[i];
      h += '<button class="gd-lv" type="button" data-i="' + i + '" style="--a:' + L.pal[1] + ';--b:' + L.pal[2] + '"><span class="gd-n">' + (i + 1) + '</span><b>' + esc(tt(L.n)) + '</b><i>' + '★'.repeat(Math.ceil(L.diff / 2)) + '☆'.repeat(5 - Math.ceil(L.diff / 2)) + '</i><small>' + (done ? '✅ ' : '') + best + '%</small><em style="width:' + best + '%"></em></button>';
    });
    return h + '</div>';
  }
  function openGD() {
    var old = $('gdOverlay'); if (old) old.remove();
    var o = doc.createElement('div'); o.id = 'gdOverlay'; o.className = 'fx-modal gd-ov'; o.style.zIndex = 9989;
    o.innerHTML = '<div class="gd-card"><button class="fx-x" type="button" aria-label="Закрити">\u00D7</button><div class="gd-menu"></div><div class="gd-play" hidden><canvas></canvas>' +
      '<button class="gd-b gd-back" type="button">☰</button><button class="gd-b gd-mute" type="button">🔊</button></div></div>';
    body.appendChild(o); requestAnimationFrame(function () { o.classList.add('in'); });
    G = { o: o, run: null, raf: 0, practice: false, cp: null, paused: false, hintDone: false, cv: null, ctx: null };
    var menu = o.querySelector('.gd-menu'), play = o.querySelector('.gd-play');
    function showMenu() {
      stopMusic(); cancelAnimationFrame(G.raf); G.run = null; play.hidden = true; menu.hidden = false; var pr = G.practice; menu.innerHTML = menuHTML();
      [].forEach.call(menu.querySelectorAll('.gd-lv'), function (b) { b.addEventListener('click', function () { start(+b.dataset.i); }); });
      menu.querySelector('#gdPrac').addEventListener('change', function (e) { G.practice = e.target.checked; });
    }
    function size() { var cv = G.cv, r = play.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, lite() ? 1 : 1.5); cv.width = Math.max(300, Math.round(r.width * d)); cv.height = Math.max(200, Math.round(r.height * d)); }
    function start(i) {
      menu.hidden = true; play.hidden = false; G.cv = play.querySelector('canvas'); G.ctx = G.cv.getContext('2d'); size();
      G.cp = null; SAVE.att[i] = SAVE.att[i] || 1; G.run = newRun(i, null); G.last = 0; G.won = false; cancelAnimationFrame(G.raf); G.raf = requestAnimationFrame(loop);
      startMusic(LEVELS[i].bpm); setTimeout(function () { if (G) G.hintDone = true; }, 5000);
    }
    function hold(v) { if (G && G.run) { if (G.run.won && v) { showMenu(); return; } G.run.held = v; } }
    play.addEventListener('pointerdown', function (e) { if (e.target.closest('.gd-b')) return; e.preventDefault(); hold(true); });
    play.addEventListener('pointerup', function () { hold(false); }); play.addEventListener('pointercancel', function () { hold(false); }); play.addEventListener('pointerleave', function () { hold(false); });
    play.querySelector('.gd-back').addEventListener('click', function (e) { e.stopPropagation(); showMenu(); });
    play.querySelector('.gd-mute').addEventListener('click', function (e) { e.stopPropagation(); M.on = !M.on; e.currentTarget.textContent = M.on ? '🔊' : '🔇'; if (!M.on) stopMusic(); else if (G.run) startMusic(G.run.lv.L.bpm); });
    function key(down) { return function (e) { if (!G || !$('gdOverlay')) return; if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); hold(down); } else if (down && e.code === 'Escape') { if (!play.hidden) showMenu(); else closeGD(); } }; }
    var kd = key(true), ku = key(false); doc.addEventListener('keydown', kd); doc.addEventListener('keyup', ku);
    window.addEventListener('resize', function () { if (G && G.cv && !play.hidden) size(); });
    function closeGD() { stopMusic(); if (G) cancelAnimationFrame(G.raf); doc.removeEventListener('keydown', kd); doc.removeEventListener('keyup', ku); G = null; o.classList.remove('in'); setTimeout(function () { o.remove(); }, 300); }
    o.querySelector('.fx-x').addEventListener('click', closeGD);
    showMenu();
  }
  window.openGD = openGD;
  window.__fxGD = { levels: LEVELS, build: build, open: openGD, save: function () { return SAVE; }, state: function () { return G; }, step: step, newRun: newRun };
})();
