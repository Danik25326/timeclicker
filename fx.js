/* =====================================================================
   fx.js — частинки, зоряний фон, 3D-нахил, живі числа.
   Підключається ПІСЛЯ script.js. Нічого в логіці гри не змінює:
   лише слухає кліки й читає стан (current, animationsEnabled).
   ===================================================================== */
(function () {
  'use strict';

  var doc = document, body = doc.body;
  var $ = function (id) { return doc.getElementById(id); };
  var wrapper = $('clockWrapper'), clock = $('clickableClock');
  if (!wrapper || !clock) return;

  var isMobile = function () { return body.classList.contains('mobile-version'); };
  var animOn = function () {
    if (body.classList.contains('no-animations')) return false;
    try { return typeof animationsEnabled === 'undefined' || animationsEnabled; } catch (e) { return true; }
  };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var TAU = Math.PI * 2;

  /* ---------- canvas-и ---------- */
  function mk(id) {
    var c = doc.createElement('canvas'); c.id = id; c.setAttribute('aria-hidden', 'true');
    body.appendChild(c); return c;
  }
  var bg = mk('fxBg'), top = mk('fxTop');
  var bgx = bg.getContext('2d'), tx = top.getContext('2d');
  var W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    W = window.innerWidth; H = window.innerHeight;
    [bg, top].forEach(function (c) { c.width = W * DPR; c.height = H * DPR; });
    bgx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initStars();
  }

  /* ---------- колір акценту (з годинника) ---------- */
  var accent = { r: 14, g: 165, b: 233 };
  function syncAccent() {
    var c = clock.style.borderColor || '';
    var m = c.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m && c.charAt(0) === '#') {
      var h = c.slice(1); if (h.length === 3) h = h.replace(/./g, '$&$&');
      m = [0, parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
    }
    if (m) {
      var r = +m[1], g = +m[2], b = +m[3];
      if (r + g + b < 150) { r = 156; g = 163; b = 175; } // «Чорний» скін — світлий сірий акцент
      accent = { r: r, g: g, b: b };
      var s = doc.documentElement.style;
      s.setProperty('--fx-accent', 'rgb(' + r + ',' + g + ',' + b + ')');
      s.setProperty('--fx-accent-rgb', r + ',' + g + ',' + b);
    }
    try { if (typeof current !== 'undefined' && current.hand) body.dataset.handSkin = current.hand; } catch (e) {}
  }

  /* ---------- зоряний фон ---------- */
  var stars = [], px = 0, py = 0, tpx = 0, tpy = 0;
  function initStars() {
    var n = Math.round((W * H) / (isMobile() ? 14000 : 7500));
    stars = [];
    for (var i = 0; i < n; i++) {
      var z = Math.random();
      stars.push({
        x: Math.random() * W, y: Math.random() * H, z: z,
        r: 0.4 + z * 1.4, a: rnd(0.25, 0.9), tw: rnd(0.4, 1.6), ph: rnd(0, TAU),
        vx: (z + 0.2) * 0.04, hue: Math.random() < 0.18 ? 'a' : (Math.random() < 0.12 ? 'p' : 'w')
      });
    }
  }
  function drawStars(t) {
    bgx.clearRect(0, 0, W, H);
    px += (tpx - px) * 0.04; py += (tpy - py) * 0.04;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.x += s.vx; if (s.x > W + 5) s.x = -5;
      var tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
      var x = s.x + px * s.z * 26, y = s.y + py * s.z * 18;
      bgx.globalAlpha = s.a * tw;
      bgx.fillStyle = s.hue === 'a' ? 'rgb(' + accent.r + ',' + accent.g + ',' + accent.b + ')'
                    : s.hue === 'p' ? '#ff9ccb' : '#dbeafe';
      bgx.beginPath(); bgx.arc(x, y, s.r, 0, TAU); bgx.fill();
    }
    bgx.globalAlpha = 1;
  }

  /* ---------- частинки / кільця / числа ---------- */
  var parts = [], rings = [], texts = [], MAX_PARTS = 700;

  function burst(x, y, kind, power) {
    var cnt = Math.round((isMobile() ? 12 : 20) + power * 1.1);
    var a = accent, i, ang, sp, p;
    for (i = 0; i < cnt && parts.length < MAX_PARTS; i++) {
      ang = rnd(0, TAU);
      p = { x: x, y: y, life: 1, decay: rnd(0.012, 0.03), size: rnd(1.5, 4.2), g: 0.06, drag: 0.985, shape: 'c', trail: false };
      switch (kind) {
        case 'red':
          sp = rnd(2, 9); p.col = pick(['255,90,60', '255,160,40', '255,59,92', '255,220,120']); p.g = 0.14; p.trail = true; break;
        case 'blue':
          sp = rnd(2, 10); p.col = pick(['56,189,248', '125,211,252', '99,102,241', '255,255,255']); p.g = 0.04; p.trail = true; break;
        case 'glitch':
          sp = rnd(3, 11); p.col = pick(['0,255,255', '255,0,200', '255,255,0', '255,255,255']); p.shape = 's';
          p.size = rnd(3, 9); p.decay = rnd(0.03, 0.07); p.g = 0; break;
        case 'blackhole': {
          var d = rnd(70, 150); ang = rnd(0, TAU);
          p.x = x + Math.cos(ang) * d; p.y = y + Math.sin(ang) * d;
          sp = d / 22; p.vx = -Math.cos(ang) * sp; p.vy = -Math.sin(ang) * sp;
          p.col = pick(['168,85,247', '236,72,153', '99,102,241', '255,255,255']); p.g = 0; p.drag = 1; p.decay = 0.045; p.trail = true;
          parts.push(p); continue;
        }
        case 'ripple':
          sp = rnd(1, 5); p.col = a.r + ',' + a.g + ',' + a.b; p.g = 0; p.size = rnd(1.2, 3); break;
        default:
          sp = rnd(2, 8); p.col = a.r + ',' + a.g + ',' + a.b; p.trail = true;
      }
      p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp - 1.2;
      parts.push(p);
    }
    // ударні кільця
    var rc = kind === 'red' ? '255,59,92' : kind === 'glitch' ? '0,255,255' : kind === 'blackhole' ? '168,85,247' : a.r + ',' + a.g + ',' + a.b;
    if (kind === 'blackhole') rings.push({ x: x, y: y, r: 140, v: -9, w: 3, life: 1, col: rc });
    else {
      rings.push({ x: x, y: y, r: 6, v: 7 + power * 0.08, w: 3, life: 1, col: rc });
      if (kind === 'ripple') {
        rings.push({ x: x, y: y, r: 2, v: 5, w: 2, life: 1, col: rc, delay: 6 });
        rings.push({ x: x, y: y, r: 2, v: 4, w: 2, life: 1, col: rc, delay: 12 });
      }
    }
  }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function floatText(x, y, str, power) {
    if (!str) return;
    texts.push({
      x: x + rnd(-22, 22), y: y - 10, vy: -2.6 - Math.min(power, 40) * 0.03, life: 1,
      s: str, size: 22 + Math.min(power, 40) * 0.35, rot: rnd(-0.12, 0.12), age: 0
    });
  }

  function drawFx() {
    tx.clearRect(0, 0, W, H);
    var i, p;
    tx.globalCompositeOperation = 'lighter';
    // кільця
    for (i = rings.length - 1; i >= 0; i--) {
      var r = rings[i];
      if (r.delay) { r.delay--; continue; }
      r.r += r.v; r.life -= 0.026; r.v *= 0.965;
      if (r.life <= 0 || r.r < 2) { rings.splice(i, 1); continue; }
      tx.strokeStyle = 'rgba(' + r.col + ',' + (r.life * 0.8) + ')';
      tx.lineWidth = r.w * r.life + 0.5;
      tx.beginPath(); tx.arc(r.x, r.y, r.r, 0, TAU); tx.stroke();
    }
    // частинки
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i];
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      var al = Math.max(p.life, 0);
      if (p.trail) {
        tx.strokeStyle = 'rgba(' + p.col + ',' + al * 0.55 + ')';
        tx.lineWidth = p.size * al; tx.lineCap = 'round';
        tx.beginPath(); tx.moveTo(p.x, p.y); tx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4); tx.stroke();
      }
      tx.fillStyle = 'rgba(' + p.col + ',' + al + ')';
      if (p.shape === 's') {
        tx.fillRect(p.x - p.size / 2 + (Math.random() - .5) * 3, p.y - p.size / 2, p.size, p.size * rnd(.3, 1));
      } else {
        tx.beginPath(); tx.arc(p.x, p.y, p.size * (0.4 + al * 0.6), 0, TAU); tx.fill();
      }
    }
    tx.globalCompositeOperation = 'source-over';
    // числа
    for (i = texts.length - 1; i >= 0; i--) {
      var t = texts[i];
      t.age++; t.vy *= 0.955; t.y += t.vy; t.life -= 0.016;
      if (t.life <= 0) { texts.splice(i, 1); continue; }
      var pop = t.age < 8 ? 0.6 + t.age * 0.07 + Math.sin(t.age / 8 * Math.PI) * 0.35 : 1;
      tx.save();
      tx.translate(t.x, t.y); tx.rotate(t.rot); tx.scale(pop, pop);
      tx.globalAlpha = Math.min(1, t.life * 2.2);
      tx.font = '700 ' + t.size + 'px Poppins, system-ui, sans-serif';
      tx.textAlign = 'center'; tx.textBaseline = 'middle';
      tx.lineWidth = 5; tx.strokeStyle = 'rgba(5,8,20,.85)'; tx.lineJoin = 'round';
      tx.strokeText(t.s, 0, 0);
      var g = tx.createLinearGradient(0, -t.size / 2, 0, t.size / 2);
      g.addColorStop(0, '#fff'); g.addColorStop(1, '#ff7ab8');
      tx.shadowColor = '#ff2d87'; tx.shadowBlur = 16;
      tx.fillStyle = g; tx.fillText(t.s, 0, 0);
      tx.restore();
    }
  }

  /* ---------- головний цикл ---------- */
  var last = 0, running = true;
  function loop(t) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (t - last < (isMobile() ? 33 : 16)) return; // 30 fps на мобільних
    last = t;
    if (!animOn()) return;
    drawStars(t);
    if (parts.length || rings.length || texts.length) drawFx();
    else if (loop.dirty) { tx.clearRect(0, 0, W, H); loop.dirty = false; }
    if (parts.length || rings.length || texts.length) loop.dirty = true;
  }
  doc.addEventListener('visibilitychange', function () {
    running = !doc.hidden;
    if (running) requestAnimationFrame(loop);
  });

  /* ---------- клік по годиннику ---------- */
  var bumpT = 0, hitT = 0;
  wrapper.addEventListener('click', function (e) {
    if (!(e.target.closest('#clickableClock') || e.target === wrapper)) return;
    if (!animOn()) return;
    var x = e.clientX, y = e.clientY;
    if (!x && !y) { var rc = clock.getBoundingClientRect(); x = rc.left + rc.width / 2; y = rc.top + rc.height / 2; }
    var combo = 0;
    try { combo = typeof currentCombo !== 'undefined' ? currentCombo : 0; } catch (er) {}
    var power = Math.min(combo, 40);
    var kind = 'default';
    try { kind = (typeof current !== 'undefined' && current.effect) || 'default'; } catch (er) {}
    burst(x, y, kind, power);
    // слухач гри може спрацювати пізніше за наш (реєструється після вибору версії) — читаємо +N у наступному тіку
    setTimeout(function () {
      var gain = $('clickGain');
      floatText(x, y, gain ? gain.textContent.trim() : '', power);
    }, 0);

    wrapper.classList.remove('fx-hit'); void wrapper.offsetWidth; wrapper.classList.add('fx-hit');
    var sc = $('score'); if (sc) { sc.classList.add('fx-bump'); clearTimeout(bumpT); bumpT = setTimeout(function () { sc.classList.remove('fx-bump'); }, 90); }
    syncAccent();
  }, false);

  /* ---------- 3D-нахил за курсором + паралакс зірок ---------- */
  var touchOnly = window.matchMedia && window.matchMedia('(hover:none)').matches;
  var tiltRaf = 0, tiltEv = null;
  doc.addEventListener('pointermove', function (e) {
    tpx = (e.clientX / W - 0.5) * -1; tpy = (e.clientY / H - 0.5) * -1;
    if (touchOnly || isMobile() || !animOn()) return;
    tiltEv = e;
    if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
  }, { passive: true });
  function applyTilt() {
    tiltRaf = 0; if (!tiltEv) return;
    var r = wrapper.getBoundingClientRect();
    var dx = (tiltEv.clientX - (r.left + r.width / 2)) / (W / 2);
    var dy = (tiltEv.clientY - (r.top + r.height / 2)) / (H / 2);
    dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
    wrapper.classList.add('fx-tilting');
    wrapper.style.setProperty('--ry', (dx * 9).toFixed(2) + 'deg');
    wrapper.style.setProperty('--rx', (-dy * 9).toFixed(2) + 'deg');
  }
  doc.addEventListener('pointerleave', function () {
    wrapper.classList.remove('fx-tilting');
    wrapper.style.setProperty('--rx', '0deg'); wrapper.style.setProperty('--ry', '0deg');
  });

  /* ---------- іскри, що кружляють навколо годинника ---------- */
  setInterval(function () {
    if (!animOn() || doc.hidden || isMobile() || parts.length > 250) return;
    if (!clock.offsetParent) return; // годинник схований (напр. поки обрано версію гри)
    var r = clock.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var ang = rnd(0, TAU), rad = r.width / 2 + 6;
    parts.push({
      x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad,
      vx: Math.cos(ang + 1.57) * 0.9 + Math.cos(ang) * 0.4, vy: Math.sin(ang + 1.57) * 0.9 + Math.sin(ang) * 0.4 - 0.3,
      life: 1, decay: 0.014, size: rnd(1, 2.4), g: -0.004, drag: 0.99, shape: 'c', trail: false,
      col: accent.r + ',' + accent.g + ',' + accent.b
    });
  }, 140);

  /* ---------- салют на нові сповіщення (покупка / комбо) ---------- */
  var tc = $('toastContainer');
  if (tc && window.MutationObserver) {
    new MutationObserver(function (list) {
      if (!animOn()) return;
      list.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1 || !n.classList.contains('toast')) return;
          var txt = n.textContent || '';
          var ok = txt.indexOf('✅') > -1, fire = txt.indexOf('🔥') > -1;
          if (!ok && !fire) return;
          var r = n.getBoundingClientRect();
          var kind = fire ? 'red' : 'blue';
          setTimeout(function () {
            var rr = n.getBoundingClientRect();
            burst(rr.left + rr.width / 2, rr.top + rr.height / 2, kind, 10);
          }, 120);
        });
      });
    }).observe(tc, { childList: true });
  }

  /* ---------- музика: клас для еквалайзера ---------- */
  var pl = $('player');
  if (pl) {
    var upd = function () { body.classList.toggle('music-playing', !pl.paused && !pl.ended); };
    ['play', 'playing', 'pause', 'ended'].forEach(function (ev) { pl.addEventListener(ev, upd); });
    upd();
  }

  /* ---------- старт ---------- */
  window.addEventListener('resize', resize);
  resize(); syncAccent();
  setInterval(syncAccent, 600);
  requestAnimationFrame(loop);
})();
