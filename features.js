/* features.js v3 — вкладка «Події»: щоденні нагороди, завдання, сезонна подія (Хелловін),
   звуки інтерфейсу, картка для шерингу. Підключається ПІСЛЯ script.js, fx.js, scenes.js.
   Офлайн-прогресу тут НЕМАЄ (час витрачаєш ти, а не «сам по собі»). */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  var FX = function () { return window.__fx || {}; };
  function tt(k) { try { return typeof t === 'function' ? t(k) : k; } catch (e) { return k; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return doc.getElementById(id); }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function dayKey(off) { var d = new Date(); if (off) d.setDate(d.getDate() + off); return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
  function fmt(n) { try { return formatTime(n); } catch (e) { return Math.round(n) + ' с'; } }
  function vib(p) { try { FX().vib && FX().vib(p); } catch (e) {} }
  function burst(x, y, k, p) { try { FX().burst && FX().burst(x, y, k, p); FX().kick && FX().kick(); } catch (e) {} }
  function centerOf(el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  function gameReady() { try { return typeof score !== 'undefined' && typeof updateScore === 'function' && typeof achievementsList !== 'undefined'; } catch (e) { return false; } }

  /* базова нагорода ≈ кілька хвилин твого доходу (масштабується з прогресом) */
  function base() {
    try { return Math.max(2000, Math.round(clickPower * clickMultiplier * prestigeMultiplier * 300 + autoRate * 180)); } catch (e) { return 2000; }
  }
  function giveTime(n) {
    try { score += n; clickCloudTotal += n; updateScore(); saveGame(); } catch (e) {}
  }

  /* ================================================================ СЕЗОН / ТЕМА */
  function season() {
    var q = (location.search.match(/season=(\w+)/) || [])[1] || (function () { try { return localStorage.getItem('fxSeason'); } catch (e) { return null; } })();
    if (q) return q === 'none' ? null : q;
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    if ((m === 10 && day >= 15) || (m === 11 && day <= 10)) return 'halloween';   // 15 жовтня – 10 листопада (останні дні — «запас», щоб устигнути зібрати нагороди)
    return null;
  }
  var SEASON = season();
  var HAL = {
    shapes: [{ id: 'pumpkin', n: 'Гарбуз 🎃', p: 300000 }, { id: 'tombstone', n: 'Надгробок 🪦', p: 300000 }],
    clockSkins: [{ id: 'pumpkin', n: 'Гарбуз 🎃', p: 250000 }, { id: 'witch', n: 'Відьма 🧪', p: 250000 }, { id: 'blood', n: 'Кров 🩸', p: 250000 }],
    handSkins: [{ id: 'bone', n: 'Кістки 🦴', p: 350000 }, { id: 'flame', n: 'Полум\u2019я 🔥', p: 350000 }],
    effects: [{ id: 'ghost', n: 'Привиди 👻', p: 500000 }, { id: 'bats', n: 'Кажани 🦇', p: 500000 }, { id: 'candy', n: 'Цукерки 🍬', p: 500000 }]
  };
  var HAL_COLORS = { pumpkin: '#ff7a00', witch: '#84cc16', blood: '#dc2626' };
  function addSkins() {
    try {
      var map = { shapes: shapes, clockSkins: clockSkins, handSkins: handSkins, effects: effects };
      Object.keys(HAL).forEach(function (k) {
        HAL[k].forEach(function (o) { if (!map[k].some(function (x) { return x.id === o.id; })) map[k].push(o); });
      });
    } catch (e) {}
    try { Object.keys(HAL_COLORS).forEach(function (k) { window.__fxClocks[k] = HAL_COLORS[k]; }); } catch (e) {}
  }
  function isHalSkin(type, id) { return !!(HAL[type] && HAL[type].some(function (o) { return o.id === id; })); }
  function applyTheme() {
    body.classList.toggle('th-halloween', SEASON === 'halloween');
    try {
      if (SEASON === 'halloween') window.__fxClocks['neon-blue'] = '#ff7a00'; else delete window.__fxClocks['neon-blue'];
      if (typeof applyAllSkins === 'function') applyAllSkins();
    } catch (e) {}
    if (SEASON === 'halloween' && !$('fxDeco')) {
      var d = doc.createElement('div'); d.id = 'fxDeco'; d.setAttribute('aria-hidden', 'true');
      var web = '<svg viewBox="0 0 200 200" width="170" height="170" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"><path d="M0 0 L200 200 M0 0 L200 90 M0 0 L90 200 M0 0 L200 150 M0 0 L150 200 M0 0 L200 30 M0 0 L30 200"/>' +
        '<path d="M30 0 Q22 22 0 30 M62 0 Q44 44 0 62 M100 0 Q70 70 0 100 M140 0 Q100 100 0 140 M180 0 Q130 130 0 180"/></svg>';
      d.innerHTML = '<div class="web l">' + web + '</div><div class="web r">' + web + '</div>' +
        '<i class="bat b1">🦇</i><i class="bat b2">🦇</i><i class="bat b3">🦇</i><div class="moon"></div>';
      body.appendChild(d);
    }
    if (SEASON !== 'halloween') { var o = $('fxDeco'); if (o) o.remove(); }
  }

  /* ================================================================ ЗВУКИ (WebAudio, без файлів) */
  var A = { ctx: null, on: true, vol: 0.5, last: 0 };
  (function () { var j = ls('fxSnd', null); if (j) { A.on = j.on !== false; A.vol = typeof j.vol === 'number' ? j.vol : .5; } })();
  function ac() {
    if (!A.on) return null;
    if (!A.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { A.ctx = new C(); } catch (e) { return null; } }
    if (A.ctx.state === 'suspended') A.ctx.resume();
    return A.ctx;
  }
  function tone(f, at, dur, type, vol, slide) {
    var c = ac(); if (!c) return; var t0 = c.currentTime + at;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (vol || .3) * A.vol), t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function noise(at, dur, vol, lp) {
    var c = ac(); if (!c) return; var t0 = c.currentTime + at, n = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = lp || 900;
    g.gain.value = (vol || .3) * A.vol; s.connect(f); f.connect(g); g.connect(c.destination); s.start(t0);
  }
  var SND = {
    click: function (o) { var p = 520 + Math.min(o.combo || 0, 60) * 9; if (SEASON === 'halloween') tone(p * .55, 0, .06, 'triangle', .16, p * .4); else tone(p, 0, .045, 'sine', .14, p * 1.25); },
    buy: function () { tone(660, 0, .1, 'triangle', .22); tone(990, .08, .16, 'triangle', .22); },
    ach: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, i * .09, .22, 'sine', .25); }); },
    claim: function () { [784, 988, 1175, 1568, 1976].forEach(function (f, i) { tone(f, i * .07, .26, 'triangle', .22); }); },
    candy: function () { tone(1200, 0, .07, 'sine', .15, 1800); tone(1800, .05, .08, 'sine', .12); },
    meow: function () { tone(560, 0, .5, 'sawtooth', .16, 900); tone(900, .22, .4, 'sawtooth', .12, 480); },
    woof: function (o) { var n = (o && o.n) || 1; for (var i = 0; i < n; i++) { tone(210, i * .22, .16, 'sawtooth', .2, 90); noise(i * .22, .12, .18, 700); } },
    chirp: function () { for (var i = 0; i < 3; i++) tone(1500 + i * 260, i * .09, .07, 'sine', .16, 2600); },
    squeak: function () { tone(1900, 0, .09, 'triangle', .18, 2800); tone(2300, .1, .07, 'triangle', .14, 3000); },
    pop: function () { tone(440, 0, .05, 'sine', .15, 880); }
  };
  function play(name, o) {
    if (!A.on) return; var n = Date.now();
    if (name === 'click' && n - A.last < 35) return; if (name === 'click') A.last = n;
    try { SND[name] && SND[name](o || {}); } catch (e) {}
  }
  window.__fxSnd = {
    play: play, enabled: function () { return A.on; }, vol: function () { return A.vol; },
    force: function (name, o) { var was = A.on; A.on = true; try { SND[name] && SND[name](o || {}); } catch (e) {} A.on = was; }   // для «послухати» у студії улюбленця
  };
  function sndSettings() {
    var anchor = $('fxSaveInfo') || $('showClockMarks') || $('disableAnimations'); if (!anchor || $('fxSndOn')) return;
    var w = doc.createElement('div'); w.className = 'setting-item';
    w.innerHTML = '<label for="fxSndOn">' + tt('Звуки гри:') + '</label><input type="checkbox" id="fxSndOn" aria-label="Звуки">';
    var w2 = doc.createElement('div'); w2.className = 'setting-item';
    w2.innerHTML = '<label for="fxSndVol">' + tt('Гучність звуків:') + '</label><input type="range" id="fxSndVol" min="0" max="100" aria-label="Гучність звуків">';
    var ref = anchor.classList && anchor.classList.contains('setting-item') ? anchor : (anchor.closest && anchor.closest('.setting-item')) || anchor;
    ref.parentNode.insertBefore(w, ref.nextSibling); ref.parentNode.insertBefore(w2, w.nextSibling);
    var cb = w.querySelector('input'), rg = w2.querySelector('input'); cb.checked = A.on; rg.value = Math.round(A.vol * 100);
    function save() { lsSet('fxSnd', { on: A.on, vol: A.vol }); }
    cb.addEventListener('change', function () { A.on = cb.checked; save(); if (A.on) play('pop'); });
    rg.addEventListener('input', function () { A.vol = rg.value / 100; save(); });
    rg.addEventListener('change', function () { play('buy'); });
  }

  /* ================================================================ ЩОДЕННА НАГОРОДА */
  var DAY_MULT = [1, 1.5, 2, 3, 4, 6, 10];
  function dState() {
    var d = ls('fxDaily', { last: '', streak: 0, best: 0 }), t0 = dayKey(0), y = dayKey(-1);
    if (d.last === t0) return { claimed: true, idx: ((d.streak - 1) % 7 + 7) % 7, streak: d.streak, best: d.best };
    if (d.last === y) return { claimed: false, idx: d.streak % 7, streak: d.streak, best: d.best };
    return { claimed: false, idx: 0, streak: 0, best: d.best, broken: d.streak > 0 };
  }
  function claimDaily() {
    var s = dState(); if (s.claimed) return;
    var streak = s.streak + 1, idx = (streak - 1) % 7, reward = Math.round(base() * DAY_MULT[idx]);
    lsSet('fxDaily', { last: dayKey(0), streak: streak, best: Math.max(s.best || 0, streak) });
    giveTime(reward);
    var candy = SEASON === 'halloween' ? 10 + idx * 6 : 0; if (candy) addCandy(candy, true);
    play('claim'); vib([20, 30, 60]);
    try { showToast('🎁 ' + tt('Щоденна нагорода:') + ' +' + fmt(reward) + (candy ? ' · +' + candy + ' 🍬' : '') + ' · 🔥 ' + streak); } catch (e) {}
    var b = $('evClaim'); if (b) { var c = centerOf(b); burst(c[0], c[1], 'gold', 30); FX().emoji && FX().emoji(c[0], c[1], ['🎁', '✨', '⭐'], 8); }
    render(); badge();
  }

  /* ================================================================ ЩОДЕННІ ЗАВДАННЯ */
  var POOL = {
    1: [['clicks', 100, 'Зроби 100 кліків'], ['minutes', 5, 'Пограй 5 хвилин'], ['upg', 2, 'Купи 2 апгрейди']],
    2: [['clicks', 400, 'Зроби 400 кліків'], ['combo', 25, 'Досягни комбо 25'], ['upg', 6, 'Купи 6 апгрейдів'], ['minutes', 12, 'Пограй 12 хвилин']],
    4: [['clicks', 1000, 'Зроби 1000 кліків'], ['combo', 60, 'Досягни комбо 60'], ['upg', 12, 'Купи 12 апгрейдів'], ['minutes', 25, 'Пограй 25 хвилин']]
  };
  var Q = null;
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function newQuests() {
    var key = dayKey(0), h = hashStr(key), list = [];
    [1, 2, 4].forEach(function (m, i) { var p = POOL[m][(h + i * 7) % POOL[m].length]; list.push({ k: p[0], t: p[1], m: m, n: p[2], claimed: false }); });
    var snap = { upg: 0, earn: 0 }; try { snap.upg = totalUpgradesBought; snap.earn = clickCloudTotal; } catch (e) {}
    return { day: key, list: list, snap: snap, prog: { clicks: 0, combo: 0, minutes: 0 }, allClaimed: false };
  }
  function loadQ() { var q = ls('fxQuests', null); if (!q || q.day !== dayKey(0)) q = newQuests(); Q = q; }
  function saveQ() { if (Q) lsSet('fxQuests', Q); }
  function qval(k) {
    try {
      if (k === 'clicks' || k === 'combo') return Q.prog[k];
      if (k === 'minutes') return Math.floor(Q.prog.minutes);
      if (k === 'upg') { if (totalUpgradesBought < Q.snap.upg) Q.snap.upg = totalUpgradesBought; return totalUpgradesBought - Q.snap.upg; }
      if (k === 'earn') { if (clickCloudTotal < Q.snap.earn) Q.snap.earn = clickCloudTotal; return clickCloudTotal - Q.snap.earn; }
    } catch (e) {}
    return 0;
  }
  function qdone(q) { return qval(q.k) >= q.t; }
  function claimQuest(i) {
    var q = Q.list[i]; if (!q || q.claimed || !qdone(q)) return;
    q.claimed = true; var reward = Math.round(base() * q.m), candy = SEASON === 'halloween' ? q.m * 8 : 0;
    giveTime(reward); if (candy) addCandy(candy, true);
    saveQ(); play('claim'); vib([15, 25, 40]);
    try { showToast('📋 ' + tt('Завдання виконано:') + ' +' + fmt(reward) + (candy ? ' · +' + candy + ' 🍬' : '')); } catch (e) {}
    if (Q.list.every(function (x) { return x.claimed; }) && !Q.allClaimed) {
      Q.allClaimed = true; var bonus = Math.round(base() * 3); giveTime(bonus); if (SEASON === 'halloween') addCandy(30, true); saveQ();
      try { showToast('🏆 ' + tt('Усі завдання дня!') + ' +' + fmt(bonus)); } catch (e) {}
    }
    var b = $('evQ' + i); if (b) { var c = centerOf(b); burst(c[0], c[1], 'gold', 24); }
    render(); badge();
  }

  /* ================================================================ ХЕЛЛОВІН-ПОДІЯ */
  var CANDY_REWARDS = [
    [25, 'clockSkins', 'pumpkin'], [60, 'handSkins', 'bone'], [110, 'effects', 'ghost'], [180, 'shapes', 'pumpkin'], [280, 'effects', 'bats'],
    [400, 'clockSkins', 'witch'], [540, 'handSkins', 'flame'], [700, 'shapes', 'tombstone'], [900, 'clockSkins', 'blood'], [1100, 'effects', 'candy']
  ];
  var EV = ls('fxEvent', { year: 0, candy: 0, got: [] });
  (function () { var y = new Date().getFullYear(); if (EV.year !== y) EV = { year: y, candy: 0, got: [] }; })();
  function saveEv() { lsSet('fxEvent', EV); }
  function skinName(type, id) { var o = HAL[type].filter(function (x) { return x.id === id; })[0]; return o ? o.n : id; }
  function grant(type, id) {
    try { if (ownedSkins[type].indexOf(id) < 0) ownedSkins[type].push(id); } catch (e) {}
  }
  function addCandy(n, quiet) {
    if (SEASON !== 'halloween') return;
    EV.candy += n;
    CANDY_REWARDS.forEach(function (r, i) {
      if (EV.candy >= r[0] && EV.got.indexOf(i) < 0) {
        EV.got.push(i); grant(r[1], r[2]);
        try { showToast('🎃 ' + tt('Нагорода події:') + ' ' + skinName(r[1], r[2])); } catch (e) {}
        play('ach'); vib([30, 40, 70]);
        try { saveGame(); if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
      }
    });
    saveEv(); if (!quiet) play('candy'); evCounter();
  }
  function reapplyEvent() {                       // нагороди події не зникають після Реверба
    EV.got.forEach(function (i) { var r = CANDY_REWARDS[i]; if (r) grant(r[1], r[2]); });
    try { if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
  }
  function evCounter() { var e = $('evCandyN'); if (e) e.textContent = EV.candy; var f = $('evCandyBar'); if (f) f.style.width = candyPct() + '%'; }
  function candyPct() {
    var prev = 0, nxt = null;
    for (var i = 0; i < CANDY_REWARDS.length; i++) { if (EV.candy < CANDY_REWARDS[i][0]) { nxt = CANDY_REWARDS[i][0]; break; } prev = CANDY_REWARDS[i][0]; }
    return nxt ? Math.round((EV.candy - prev) / (nxt - prev) * 100) : 100;
  }

  /* ================================================================ КАРТКА ДЛЯ ШЕРИНГУ */
  function shapePath(c, x, y, w, h, shape) {
    c.beginPath();
    if (shape === 'square') { rr(c, x, y, w, h, 28); }
    else if (shape === 'squircle') { rr(c, x, y, w, h, w * .32); }
    else if (shape === 'diamond') { c.moveTo(x + w / 2, y); c.lineTo(x + w, y + h / 2); c.lineTo(x + w / 2, y + h); c.lineTo(x, y + h / 2); c.closePath(); }
    else if (shape === 'oval') { c.ellipse(x + w / 2, y + h / 2, w / 2, h * .42, 0, 0, 7); }
    else if (shape === 'tombstone') { c.moveTo(x, y + h); c.lineTo(x, y + h / 2); c.arc(x + w / 2, y + h / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
    else if (shape === 'pumpkin') { c.ellipse(x + w / 2, y + h / 2, w / 2, h * .46, 0, 0, 7); }
    else c.arc(x + w / 2, y + h / 2, w / 2, 0, 7);
  }
  function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function makeCard() {
    var W = 1080, H = 1350, cv = doc.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
    var hal = SEASON === 'halloween', acc = (getComputedStyle(doc.documentElement).getPropertyValue('--fx-accent') || '#0ea5e9').trim() || '#0ea5e9';
    var g = c.createLinearGradient(0, 0, 0, H);
    if (hal) { g.addColorStop(0, '#1a0826'); g.addColorStop(.55, '#3b1257'); g.addColorStop(1, '#0a0410'); } else { g.addColorStop(0, '#060a1e'); g.addColorStop(.55, '#101a45'); g.addColorStop(1, '#04060f'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var rg = c.createRadialGradient(W * .3, H * .22, 10, W * .3, H * .22, 620); rg.addColorStop(0, hal ? 'rgba(255,122,0,.38)' : 'rgba(14,165,233,.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    var rg2 = c.createRadialGradient(W * .85, H * .8, 10, W * .85, H * .8, 640); rg2.addColorStop(0, hal ? 'rgba(168,85,247,.35)' : 'rgba(236,72,153,.28)'); rg2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg2; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 140; i++) { c.fillStyle = 'rgba(255,255,255,' + (.2 + Math.random() * .6) + ')'; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '700 64px Poppins, system-ui, sans-serif';
    c.fillText('Times Clicker' + (hal ? ' 🎃' : ''), W / 2, 120);
    // годинник
    var cs = 420, cx = W / 2 - cs / 2, cy = 190, shape = 'round'; try { shape = current.shape || 'round'; } catch (e) {}
    c.save(); c.shadowColor = acc; c.shadowBlur = 60; shapePath(c, cx, cy, cs, cs, shape); c.fillStyle = '#050914'; c.fill(); c.restore();
    shapePath(c, cx, cy, cs, cs, shape); c.lineWidth = 14; c.strokeStyle = acc; c.stroke();
    var mx = W / 2, my = cy + cs / 2, d = new Date(), hr = (d.getHours() % 12) + d.getMinutes() / 60, mi = d.getMinutes() + d.getSeconds() / 60, sc = d.getSeconds();
    function hand(a, len, w, col) { c.save(); c.translate(mx, my); c.rotate(a); c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(0, 18); c.lineTo(0, -len); c.stroke(); c.restore(); }
    for (var k = 0; k < 12; k++) { c.save(); c.translate(mx, my); c.rotate(k * Math.PI / 6); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-3, -cs * .38, 6, 20); c.restore(); }
    hand(hr / 12 * 2 * Math.PI, 100, 14, '#e6f4ff'); hand(mi / 60 * 2 * Math.PI, 150, 9, '#bfe3ff'); hand(sc / 60 * 2 * Math.PI, 165, 4, '#ff2d87');
    c.fillStyle = '#ff2d87'; c.beginPath(); c.arc(mx, my, 14, 0, 7); c.fill();
    // головне число
    var total = 0; try { total = clickCloudTotal || score; } catch (e) {}
    c.fillStyle = '#9fb4dd'; c.font = '500 36px Poppins, system-ui, sans-serif'; c.fillText(tt('Усього витрачено часу'), W / 2, 720);
    c.fillStyle = '#fff'; var big = fmt(total), fs = 92; c.font = '800 ' + fs + 'px Poppins, system-ui, sans-serif';
    while (c.measureText(big).width > W - 140 && fs > 44) { fs -= 4; c.font = '800 ' + fs + 'px Poppins, system-ui, sans-serif'; }
    c.fillText(big, W / 2, 820);
    // плитки
    var done = 0, totalAch = 0; try { done = achievementsList.filter(function (a) { return a.done; }).length; totalAch = achievementsList.length; } catch (e) {}
    var up = 0, rev = 0, combo = 0; try { up = totalUpgradesBought; rev = totalReverbs; combo = typeof maxComboEver !== 'undefined' ? maxComboEver : 0; } catch (e) {}
    var clicks = ls('fxClicks', 0), ds = dState();
    var tiles = [['🏆', tt('Досягнення'), done + '/' + totalAch], ['🛒', tt('Апгрейдів'), up], ['⏪', tt('Перезапусків'), rev], ['🔥', tt('Серія днів'), ds.streak], ['👆', tt('Кліків'), clicks], ['🎯', tt('Макс. комбо'), combo]];
    tiles.forEach(function (tl, i) {
      var tx = 90 + (i % 3) * 300, ty = 900 + Math.floor(i / 3) * 170;
      c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); rr(c, tx, ty, 270, 145, 28); c.fill(); c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#fff'; c.font = '700 46px Poppins, system-ui, sans-serif'; c.fillText(String(tl[2]), tx + 135, ty + 70);
      c.fillStyle = '#9fb4dd'; c.font = '500 26px Poppins, system-ui, sans-serif'; c.fillText(tl[0] + ' ' + tl[1], tx + 135, ty + 115);
    });
    c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '500 30px Poppins, system-ui, sans-serif';
    c.fillText('timesclicker.pp.ua · ' + d.toLocaleDateString('uk-UA'), W / 2, 1290);
    return cv;
  }
  function shareCard() {
    var cv = makeCard(), url = cv.toDataURL('image/png');
    var o = $('fxShareOverlay'); if (o) o.remove();
    o = doc.createElement('div'); o.id = 'fxShareOverlay'; o.className = 'fx-modal';
    o.innerHTML = '<div class="fx-modal-card"><button class="fx-x" type="button" aria-label="Закрити">\u00D7</button><h3>' + tt('Твоя картка') + '</h3>' +
      '<img alt="card" src="' + url + '"><div class="fx-row"><button class="fx-btn" data-a="share" type="button">📤 ' + tt('Поділитись') + '</button><button class="fx-btn ghost" data-a="save" type="button">⬇️ ' + tt('Завантажити') + '</button></div></div>';
    body.appendChild(o); requestAnimationFrame(function () { o.classList.add('in'); });
    function close() { o.classList.remove('in'); setTimeout(function () { o.remove(); }, 300); }
    o.querySelector('.fx-x').addEventListener('click', close); o.addEventListener('click', function (e) { if (e.target === o) close(); });
    function blob(cb) { cv.toBlob(cb, 'image/png'); }
    o.querySelector('[data-a="save"]').addEventListener('click', function () { var a = doc.createElement('a'); a.href = url; a.download = 'times-clicker.png'; doc.body.appendChild(a); a.click(); a.remove(); });
    o.querySelector('[data-a="share"]').addEventListener('click', function () {
      blob(function (b) {
        var f; try { f = new File([b], 'times-clicker.png', { type: 'image/png' }); } catch (e) {}
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: 'Times Clicker', text: tt('Моя гра в Times Clicker') }).catch(function () {});
        else { var a = doc.createElement('a'); a.href = url; a.download = 'times-clicker.png'; doc.body.appendChild(a); a.click(); a.remove(); }
      });
    });
    play('pop');
  }
  window.__fxShare = shareCard;

  /* ================================================================ ВКЛАДКА «ПОДІЇ» */
  var tabBtn = null, page = null;
  function badge() {
    if (!tabBtn) return;
    var has = !dState().claimed;
    try { has = has || (Q && Q.list.some(function (q) { return !q.claimed && qdone(q); })); } catch (e) {}
    tabBtn.classList.toggle('fx-dot', !!has);
  }
  function dayLabel(i) { return tt('День') + ' ' + (i + 1); }
  function render() {
    if (!page || !Q) return;
    var ds = dState(), hal = SEASON === 'halloween', h = '';
    // --- щоденна нагорода
    h += '<div class="ev-card"><div class="ev-h"><b>🎁 ' + tt('Щоденна нагорода') + '</b><span class="ev-streak">🔥 ' + ds.streak + (ds.best ? ' · ' + tt('рекорд') + ' ' + ds.best : '') + '</span></div><div class="ev-days">';
    for (var i = 0; i < 7; i++) {
      var st = ds.claimed ? (i <= ds.idx ? 'done' : 'future') : (i < ds.idx ? 'done' : i === ds.idx ? 'today' : 'future');
      var amt = fmt(Math.round(base() * DAY_MULT[i]));
      h += '<div class="ev-day ' + st + (i === 6 ? ' big' : '') + '"><small>' + dayLabel(i) + '</small><i>' + (i === 6 ? '🎁' : '⏱️') + '</i><span>' + (st === 'done' ? '✓' : '+' + esc(amt)) + '</span></div>';
    }
    h += '</div>' + (ds.broken ? '<div class="ev-note">' + tt('Серію втрачено — починаємо спочатку') + '</div>' : '') +
      '<button id="evClaim" class="fx-btn" type="button"' + (ds.claimed ? ' disabled' : '') + '>' + (ds.claimed ? '✓ ' + tt('Забрано сьогодні') : '🎁 ' + tt('Забрати')) + '</button></div>';
    // --- завдання
    h += '<div class="ev-card"><div class="ev-h"><b>📋 ' + tt('Завдання дня') + '</b><span class="ev-streak">' + Q.list.filter(function (q) { return q.claimed; }).length + '/3</span></div>';
    Q.list.forEach(function (q, i) {
      var v = Math.min(qval(q.k), q.t), done = v >= q.t, pct = Math.round(v / q.t * 100);
      h += '<div class="ev-q' + (q.claimed ? ' claimed' : '') + '"><div class="ev-qt"><span>' + (hal ? '🎃 ' : '') + esc(tt(q.n)) + '</span><b>' + v + '/' + q.t + '</b></div>' +
        '<div class="ev-bar"><i style="width:' + pct + '%"></i></div><div class="ev-qr"><small>' + tt('Нагорода') + ': ' + esc(fmt(Math.round(base() * q.m))) + (hal ? ' · ' + (q.m * 8) + ' 🍬' : '') + '</small>' +
        '<button id="evQ' + i + '" class="fx-btn sm" type="button" data-q="' + i + '"' + ((done && !q.claimed) ? '' : ' disabled') + '>' + (q.claimed ? '✓' : tt('Забрати')) + '</button></div></div>';
    });
    h += '</div>';
    // --- Хелловін
    if (hal) {
      h += '<div class="ev-card ev-hal"><div class="ev-h"><b>🎃 ' + tt('Хелловін') + '</b><span class="ev-streak">🍬 <b id="evCandyN">' + EV.candy + '</b></span></div>' +
        '<div class="ev-note">' + tt('Цукерки випадають із кліків, щоденних нагород і завдань. Збирай — відкривай хелловінські скіни безкоштовно!') + '</div>' +
        '<div class="ev-bar big"><i id="evCandyBar" style="width:' + candyPct() + '%"></i></div><div class="ev-rw">';
      CANDY_REWARDS.forEach(function (r, i) {
        var got = EV.got.indexOf(i) > -1;
        h += '<div class="ev-r' + (got ? ' got' : '') + '"><b>' + r[0] + ' 🍬</b><span>' + esc(skinName(r[1], r[2])) + '</span>' + (got ? '<em>✓</em>' : '') + '</div>';
      });
      h += '</div></div>';
    }
    // --- шеринг
    h += '<div class="ev-card"><div class="ev-h"><b>📸 ' + tt('Картка для друзів') + '</b></div><div class="ev-note">' + tt('Створи гарну картку зі своїм часом, досягненнями та годинником і поділись нею.') +
      '</div><button id="evShare" class="fx-btn" type="button">📸 ' + tt('Створити картку') + '</button></div>';
    page.querySelector('.ev-grid').innerHTML = h;
    var cl = $('evClaim'); if (cl) cl.addEventListener('click', claimDaily);
    [].forEach.call(page.querySelectorAll('[data-q]'), function (b) { b.addEventListener('click', function () { claimQuest(+b.dataset.q); }); });
    var sh = $('evShare'); if (sh) sh.addEventListener('click', shareCard);
  }
  function buildTab() {
    var tabs = doc.querySelector('.top-tabs'), ach = $('tab-achievements'); if (!tabs || !ach || $('tab-events')) return;
    tabBtn = doc.createElement('button'); tabBtn.className = 'tab'; tabBtn.dataset.tab = 'tab-events'; tabBtn.setAttribute('role', 'tab'); tabBtn.setAttribute('aria-selected', 'false');
    tabBtn.setAttribute('aria-controls', 'tab-events'); tabBtn.textContent = (SEASON === 'halloween' ? '🎃 ' : '🎁 ') + tt('Події');
    var achBtn = tabs.querySelector('[data-tab="tab-achievements"]'); if (achBtn && achBtn.nextSibling) tabs.insertBefore(tabBtn, achBtn.nextSibling); else tabs.appendChild(tabBtn);
    page = doc.createElement('section'); page.id = 'tab-events'; page.className = 'tab-page'; page.setAttribute('role', 'tabpanel'); page.setAttribute('aria-labelledby', 'tab-events'); page.hidden = true;
    page.innerHTML = '<h3>' + (SEASON === 'halloween' ? '🎃 ' : '🎁 ') + tt('Події та нагороди') + '</h3><div class="ev-grid"></div>';
    ach.parentNode.insertBefore(page, ach.nextSibling);
    try { window.__fxWide['tab-events'] = 1; } catch (e) {}
    tabBtn.addEventListener('click', function () {
      [].forEach.call(doc.querySelectorAll('.top-tabs .tab'), function (x) { x.classList.remove('active'); });
      [].forEach.call(doc.querySelectorAll('.tab-page'), function (x) { x.classList.remove('active'); });
      tabBtn.classList.add('active'); page.classList.add('active'); if (!Q || Q.day !== dayKey(0)) loadQ(); render(); badge(); play('pop');
      body.classList.toggle('fx-wide', body.classList.contains('mobile-version'));
    });
  }

  /* ================================================================ ПОДІЇ ГРИ → наші лічильники */
  function onClick(e) {
    var wr = $('clockWrapper'); if (!wr) return;
    if (!(e.target.closest && e.target.closest('#clickableClock')) && e.target !== wr) return;
    setTimeout(function () {
      var combo = 0; try { combo = currentCombo; } catch (er) {}
      if (!Q) return;
      Q.prog.clicks++; if (combo > Q.prog.combo) Q.prog.combo = combo;
      play('click', { combo: combo });
      if (SEASON === 'halloween' && Math.random() < 0.10) {
        var r = wr.getBoundingClientRect(), x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
        FX().emoji && FX().emoji(x, y, ['🍬', '🍭', '🍫'], 2, { g: -0.02, decay: .016 }); addCandy(1);
      }
    }, 0);
  }
  function hooks() {
    var wr = $('clockWrapper'); if (wr) wr.addEventListener('click', onClick, false);
    // купівля → звук
    ['upgrades', 'multipliers'].forEach(function (id) {
      var c = $(id); if (!c || !window.MutationObserver) return;
      new MutationObserver(function (list) {
        list.forEach(function (m) { if (m.attributeName === 'class' && m.target.classList && m.target.classList.contains('fx-bought') && !m.target.__snd) { m.target.__snd = 1; setTimeout(function () { m.target.__snd = 0; }, 700); play('buy'); } });
      }).observe(c, { attributes: true, subtree: true, attributeFilter: ['class'] });
    });
    // досягнення → звук (через тост)
    if (typeof window.showToast === 'function') {
      var ost = window.showToast;
      window.showToast = function (txt) { var r = ost.apply(this, arguments); try { if (/^Досягнення/.test(String(txt))) play('ach'); } catch (e) {} return r; };
    }
    // час гри для «пограй N хвилин»
    setInterval(function () { if (!Q || doc.hidden || !gameReady()) return; Q.prog.minutes += 0.25; if (Math.round(Q.prog.minutes * 4) % 4 === 0) saveQ(); if (page && page.classList.contains('active')) render(); badge(); }, 15000);
    setInterval(function () { if (!Q || Q.day !== dayKey(0)) loadQ(); if (page && page.classList.contains('active') && !doc.hidden) render(); badge(); saveQ(); }, 4000);
    // після Реверба: нагороди події лишаються
    if (typeof window.completeReverb === 'function') {
      var ocr = window.completeReverb;
      window.completeReverb = function () { var r = ocr.apply(this, arguments); setTimeout(function () { reapplyEvent(); try { if (Q) { Q.snap.upg = 0; Q.snap.earn = 0; } } catch (e) {} }, 400); return r; };
    }
    // сховати сезонні скіни поза подією (якщо не відкриті)
    if (typeof window.createSkinGrid === 'function') {
      var ocs = window.createSkinGrid;
      window.createSkinGrid = function (ct, ls2, type) {
        var r = ocs.apply(this, arguments), g = $(ct);
        if (g) [].forEach.call(g.children, function (el) {
          var id = el.dataset && el.dataset.skin; if (!id || !isHalSkin(type, id)) return;
          el.dataset.hal = '1'; el.style.display = (SEASON === 'halloween' || el.classList.contains('owned')) ? '' : 'none';
        });
        return r;
      };
    }
  }

  /* ================================================================ СТАРТ */
  function start() {
    if (!gameReady()) return false;
    addSkins(); loadQ(); reapplyEvent(); applyTheme();
    buildTab(); hooks(); sndSettings(); badge();
    try { if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
    window.addEventListener('pagehide', saveQ);
    window.__fxFeatures = { season: function () { return SEASON; }, addCandy: addCandy, state: function () { return { Q: Q, EV: EV }; }, shareCard: shareCard, claimDaily: claimDaily, base: base, play: play, render: render };
    return true;
  }
  // налаштування з’являються після відкриття вкладки — підчепимось пізніше
  var tries = 0, iv = setInterval(function () { tries++; if (start() || tries > 40) { clearInterval(iv); if (tries <= 40) setTimeout(sndSettings, 1500); } }, 250);
  setInterval(sndSettings, 4000);
})();
