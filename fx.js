/* fx.js v4 */
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
  /* ---------- ЛЕГКИЙ РЕЖИМ (телефони / слабкі пристрої) ---------- */
  var forcedLite = false, liteNow = false;
  function detectLite() {
    if (forcedLite || isMobile()) return true;
    var coarse = window.matchMedia && window.matchMedia('(hover:none) and (pointer:coarse)').matches;
    return !!coarse || window.innerWidth < 700;
  }
  function applyLite() {
    var v = detectLite();
    if (v === liteNow) return;
    liteNow = v;
    body.classList.toggle('fx-lite', v);
    if (W) resize();
    kick();
  }
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
    DPR = liteNow ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    [bg, top].forEach(function (c) { c.width = W * DPR; c.height = H * DPR; });
    bgx.setTransform(DPR, 0, 0, DPR, 0, 0);
    tx.setTransform(DPR, 0, 0, DPR, 0, 0);
    initStars();
    if (liteNow) drawStars(0); // у легкому режимі зорі малюються один раз
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
      if (r !== accent.r || g !== accent.g || b !== accent.b) {
        accent = { r: r, g: g, b: b };
        var s = doc.documentElement.style;
        s.setProperty('--fx-accent', 'rgb(' + r + ',' + g + ',' + b + ')');
        s.setProperty('--fx-accent-rgb', r + ',' + g + ',' + b);
        if (liteNow) drawStars(0);
      }
    }
    try { if (typeof current !== 'undefined' && current.hand && body.dataset.handSkin !== current.hand) body.dataset.handSkin = current.hand; } catch (e) {}
  }

  /* ---------- зоряний фон ---------- */
  var stars = [], px = 0, py = 0, tpx = 0, tpy = 0;
  function initStars() {
    var n = Math.round((W * H) / (liteNow ? 16000 : 7500));
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
      var tw = 1, x = s.x, y = s.y;
      if (!liteNow) {
        s.x += s.vx; if (s.x > W + 5) s.x = -5;
        tw = 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.ph);
        x = s.x + px * s.z * 26; y = s.y + py * s.z * 18;
      }
      bgx.globalAlpha = s.a * tw;
      bgx.fillStyle = s.hue === 'a' ? 'rgb(' + accent.r + ',' + accent.g + ',' + accent.b + ')'
                    : s.hue === 'p' ? '#ff9ccb' : '#dbeafe';
      bgx.beginPath(); bgx.arc(x, y, s.r, 0, TAU); bgx.fill();
    }
    bgx.globalAlpha = 1;
  }

  /* ---------- частинки / кільця / числа ---------- */
  var parts = [], rings = [], texts = [];
  function maxParts() { return liteNow ? 90 : 700; }

  function burst(x, y, kind, power) {
    var cnt = liteNow ? Math.min(7 + (power >> 2), 14) : Math.round(20 + power * 1.1);
    var a = accent, i, ang, sp, p;
    for (i = 0; i < cnt && parts.length < maxParts(); i++) {
      ang = rnd(0, TAU);
      p = { x: x, y: y, life: 1, decay: rnd(0.012, 0.03), size: rnd(1.5, 4.2), g: 0.06, drag: 0.985, shape: 'c', trail: false };
      if (liteNow) p.decay *= 1.5;
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
          if (liteNow) p.trail = false;
          parts.push(p); continue;
        }
        case 'gold':
          sp = rnd(2, 9); p.col = pick(['255,215,0', '255,236,150', '255,170,40', '255,255,255']); p.g = 0.05; p.trail = true; break;
        case 'ripple':
          sp = rnd(1, 5); p.col = a.r + ',' + a.g + ',' + a.b; p.g = 0; p.size = rnd(1.2, 3); break;
        default:
          sp = rnd(2, 8); p.col = a.r + ',' + a.g + ',' + a.b; p.trail = true;
      }
      if (liteNow) p.trail = false;
      p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp - 1.2;
      parts.push(p);
    }
    // ударні кільця
    var rc = kind === 'gold' ? '255,215,0' : kind === 'red' ? '255,59,92' : kind === 'glitch' ? '0,255,255' : kind === 'blackhole' ? '168,85,247' : a.r + ',' + a.g + ',' + a.b;
    if (liteNow && rings.length >= 2) return;
    if (kind === 'blackhole') rings.push({ x: x, y: y, r: 140, v: -9, w: 3, life: 1, col: rc });
    else {
      rings.push({ x: x, y: y, r: 6, v: 7 + power * 0.08, w: 3, life: 1, col: rc });
      if (kind === 'ripple' && !liteNow) {
        rings.push({ x: x, y: y, r: 2, v: 5, w: 2, life: 1, col: rc, delay: 6 });
        rings.push({ x: x, y: y, r: 2, v: 4, w: 2, life: 1, col: rc, delay: 12 });
      }
    }
  }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function floatText(x, y, str, power) {
    if (!str || (liteNow && texts.length >= 3)) return;
    texts.push({
      x: x + rnd(-22, 22), y: y - 10, vy: -2.6 - Math.min(power, 40) * 0.03, life: 1,
      s: str, size: 22 + Math.min(power, 40) * 0.35, rot: rnd(-0.12, 0.12), age: 0
    });
  }

  function drawFx() {
    tx.clearRect(0, 0, W, H);
    var i, p;
    if (!liteNow) tx.globalCompositeOperation = 'lighter';
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
      tx.lineWidth = 4; tx.strokeStyle = 'rgba(5,8,20,.85)'; tx.lineJoin = 'round';
      tx.strokeText(t.s, 0, 0);
      if (liteNow) { tx.fillStyle = '#ffd0e6'; }
      else {
        var g = tx.createLinearGradient(0, -t.size / 2, 0, t.size / 2);
        g.addColorStop(0, '#fff'); g.addColorStop(1, '#ff7ab8');
        tx.shadowColor = '#ff2d87'; tx.shadowBlur = 16; // shadowBlur дуже дорогий на слабких GPU
        tx.fillStyle = g;
      }
      tx.fillText(t.s, 0, 0);
      tx.restore();
    }
  }

  /* ---------- головний цикл ---------- */
  var last = 0, running = true, rafId = 0, dirty = false, ema = 16, frames = 0;
  function kick() { if (!rafId && running) rafId = requestAnimationFrame(loop); }
  function loop(t) {
    rafId = 0;
    if (!running || !animOn()) return;
    var active = parts.length || rings.length || texts.length;
    // у легкому режимі цикл спить, поки немає частинок (нуль роботи в простої)
    if (!active && liteNow) { if (dirty) { tx.clearRect(0, 0, W, H); dirty = false; } return; }
    rafId = requestAnimationFrame(loop);
    var gap = liteNow ? 33 : 16;
    if (t - last < gap) return;
    var dt = t - last; last = t;
    // авто-деградація: якщо ПК теж ледве тягне — вмикаємо легкий режим
    if (!liteNow && dt < 250) {
      ema = ema * 0.95 + dt * 0.05; frames++;
      if (frames > 150 && ema > 30) { forcedLite = true; applyLite(); return; }
    }
    if (!liteNow) drawStars(t);
    if (active) { drawFx(); dirty = true; }
    else if (dirty) { tx.clearRect(0, 0, W, H); dirty = false; }
  }
  doc.addEventListener('visibilitychange', function () {
    running = !doc.hidden;
    if (running) kick();
  });

  /* ---------- клік по годиннику ---------- */
  var bumpT = 0, lastBurst = 0, lastText = 0;
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
    var now = Date.now();
    if (!liteNow || now - lastBurst > 70) { lastBurst = now; burst(x, y, kind, power); }
    // слухач гри може спрацювати пізніше за наш (реєструється після вибору версії) — читаємо +N у наступному тіку
    setTimeout(function () {
      var gain = $('clickGain');
      var n2 = Date.now();
      if (!liteNow || n2 - lastText > 120) { lastText = n2; floatText(x, y, gain ? gain.textContent.trim() : '', power); }
      kick();
    }, 0);
    kick();

    if (!liteNow) {
      wrapper.classList.remove('fx-hit'); void wrapper.offsetWidth; wrapper.classList.add('fx-hit');
      var sc = $('score'); if (sc) { sc.classList.add('fx-bump'); clearTimeout(bumpT); bumpT = setTimeout(function () { sc.classList.remove('fx-bump'); }, 90); }
      syncAccent();
    }
  }, false);

  /* ---------- 3D-нахил за курсором + паралакс зірок ---------- */
  var touchOnly = window.matchMedia && window.matchMedia('(hover:none)').matches;
  var tiltRaf = 0, tiltEv = null;
  doc.addEventListener('pointermove', function (e) {
    tpx = (e.clientX / W - 0.5) * -1; tpy = (e.clientY / H - 0.5) * -1;
    if (touchOnly || liteNow || !animOn()) return;
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
    if (!animOn() || doc.hidden || liteNow || parts.length > 250) return;
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
      if (!animOn() || liteNow || body.classList.contains('const-open') || body.classList.contains('fx-ritual')) return;
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


  /* =====================================================================
     РИТУАЛ «ДВА КЛЮЧІ» — кінематографічна версія triggerTheEnd.
     Замінює емодзі-ключі: SVG-ключі летять по дузі, входять у замок,
     повертаються (3D), спалах, ударні хвилі, час зупиняється.
     Лише transform/opacity (WAAPI) — легко для телефонів.
     ===================================================================== */
  var ritualBusy = false;
  var tt = function (k) { try { return typeof t === 'function' ? t(k) : k; } catch (e) { return k; } };
  function keySvg(flip, uid) {
    return '<svg viewBox="0 0 160 56" width="160" height="56" style="display:block;overflow:visible">' +
      '<defs><linearGradient id="kg' + uid + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#fff6cf"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#a1500a"/></linearGradient></defs>' +
      '<g' + (flip ? ' transform="translate(160,0) scale(-1,1)"' : '') + ' fill="url(#kg' + uid + ')" stroke="#6b3a05" stroke-width="1.2" stroke-linejoin="round">' +
      '<path fill-rule="evenodd" d="M8 28a20 20 0 1 0 40 0a20 20 0 1 0 -40 0ZM19 28a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z"/>' +
      '<rect x="46" y="24" width="104" height="9" rx="4.5"/><rect x="116" y="33" width="9" height="12" rx="2"/><rect x="131" y="33" width="9" height="8" rx="2"/>' +
      '<path d="M52 27.5H146" stroke="#fff" stroke-opacity=".65" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></svg>';
  }
  function vib(p) { try { if (navigator.vibrate && hapticsOn()) navigator.vibrate(p); } catch (e) {} }

  function ritual() {
    if (ritualBusy) return;
    try { if (typeof isTimeBroken !== 'undefined' && isTimeBroken) return; } catch (e) {}
    ritualBusy = true;
    var rtp = $('realTimePlayed');
    try { realTimeFrozenValue = rtp ? rtp.textContent : null; } catch (e) {}
    var freeze = function () {
      try { isTimeBroken = true; } catch (e) {}
      if (rtp) { if (realTimeFrozenValue) rtp.textContent = realTimeFrozenValue; rtp.classList.add('stat-stealth'); rtp.onclick = window.startRestoreDialogue; }
    };
    var finish = function () {
      try { applyAllSkins(); } catch (e) {}
      try { showToast(tt('ЧАС ЗУПИНЕНО...')); } catch (e) {}
      try { saveGame(); } catch (e) {}
      ritualBusy = false;
    };
    if (!animOn() || !wrapper.animate) { freeze(); setTimeout(finish, 300); return; }

    var lite = liteNow, DUR = 2800, EASE = 'cubic-bezier(.16,.84,.3,1)';
    var r = clock.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var sc = W < 600 ? 0.55 : 1, ky = cy - 28 * sc;
    var tipL = r.left + r.width * 0.05, tipR = r.right - r.width * 0.05;
    var finL = tipL - 150 * sc, finR = tipR - 10 * sc;
    var ov = doc.createElement('div'); ov.id = 'fxRitual';
    var html = '<div class="rt-dim"></div><div class="rt-flash"></div>' +
      '<div class="rt-ring"></div>' + (lite ? '' : '<div class="rt-ring rt-ring2"></div>') +
      '<div class="rt-wave"></div>' + (lite ? '' : '<div class="rt-wave"></div>') +
      '<div class="rt-key" data-s="L">' + keySvg(false, 'L') + '</div><div class="rt-key" data-s="R">' + keySvg(true, 'R') + '</div>' +
      '<div class="rt-cap"></div>';
    ov.innerHTML = html; body.appendChild(ov); body.classList.add('fx-ritual');
    var q = function (sel) { return ov.querySelectorAll(sel); };
    var at = function (el, kf, o) { o = o || {}; o.duration = o.duration || DUR; o.fill = 'both'; return el.animate(kf, o); };

    // темрява навколо годинника
    var dim = ov.querySelector('.rt-dim');
    dim.style.background = 'radial-gradient(circle at ' + cx + 'px ' + cy + 'px,rgba(0,0,0,0) 10%,rgba(2,3,10,.84) 72%)';
    at(dim, [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .82 }, { opacity: 0 }]);
    // спалах
    var fl = ov.querySelector('.rt-flash');
    fl.style.background = 'radial-gradient(circle at ' + cx + 'px ' + cy + 'px,rgba(255,255,255,.95),rgba(251,191,36,.35) 32%,transparent 70%)';
    at(fl, [{ opacity: 0 }, { opacity: 0, offset: .70 }, { opacity: .95, offset: .735 }, { opacity: 0, offset: .92 }, { opacity: 0 }]);
    // кільця замка
    [].forEach.call(q('.rt-ring'), function (el, i) {
      var D = r.width + (i ? 112 : 56), dir = i ? -1 : 1;
      el.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + D + 'px;height:' + D + 'px';
      var T = function (sc2, rot) { return 'translate(-50%,-50%) scale(' + sc2 + ') rotate(' + rot * dir + 'deg)'; };
      at(el, [{ transform: T(1.5, 0), opacity: 0 }, { transform: T(1, 110), opacity: .9, offset: .45 }, { transform: T(1, 300), opacity: .9, offset: .72 },
              { transform: T(1.45, 380), opacity: 0 }], { easing: 'ease-in-out' });
    });
    // ударні хвилі
    [].forEach.call(q('.rt-wave'), function (el, i) {
      el.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + r.width + 'px;height:' + r.width + 'px';
      at(el, [{ transform: 'translate(-50%,-50%) scale(.35)', opacity: .95 }, { transform: 'translate(-50%,-50%) scale(' + (3.2 - i * .7) + ')', opacity: 0 }],
         { duration: 850, delay: DUR * .72 + i * 140, easing: 'cubic-bezier(.2,.7,.3,1)' });
    });
    // ключі
    [].forEach.call(q('.rt-key'), function (el) {
      var left = el.dataset.s === 'L', dirx = left ? 1 : -1;
      var fin = left ? finL : finR, pre = fin - dirx * 78 * sc;
      var sx = left ? -190 * sc : W + 30, sy = ky + (left ? -1 : 1) * Math.min(H * .28, 190);
      var arc = ky + (left ? -1 : 1) * 36 * sc;
      var tr = function (x, y) { return 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ')'; };
      if (!lite) el.style.filter = 'drop-shadow(0 0 12px rgba(251,191,36,.75))';
      at(el, [{ transform: tr(sx, sy), offset: 0, easing: EASE }, { transform: tr(pre, arc), offset: .30, easing: 'ease-in-out' },
              { transform: tr(pre + dirx * 14, ky), offset: .40, easing: 'cubic-bezier(.5,0,.8,.4)' }, { transform: tr(fin, ky), offset: .50 },
              { transform: tr(fin, ky), offset: .86 }, { transform: tr(fin, ky), offset: 1 }]);
      at(el, [{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: 1, offset: .86 }, { opacity: 0 }]);
      var svg = el.firstChild;
      svg.style.transformOrigin = '50% 50%';
      at(svg, [{ transform: 'perspective(420px) rotateX(0deg)', offset: 0 }, { transform: 'perspective(420px) rotateX(0deg)', offset: .5, easing: 'cubic-bezier(.55,0,.25,1)' },
               { transform: 'perspective(420px) rotateX(360deg)', offset: .73 }, { transform: 'perspective(420px) rotateX(360deg)', offset: 1 }]);
    });
    // підпис
    var cap = ov.querySelector('.rt-cap'); cap.textContent = tt('ЧАС ЗУПИНЕНО...');
    cap.style.cssText = 'left:50%;top:' + Math.min(H - 60, cy + r.width / 2 + 56) + 'px';
    at(cap, [{ opacity: 0, letterSpacing: '.7em', transform: 'translate(-50%,0) scale(.96)' }, { opacity: 0, offset: .74 },
             { opacity: 1, letterSpacing: '.22em', transform: 'translate(-50%,0) scale(1)', offset: .86 }, { opacity: 1, offset: .95 }, { opacity: 0, letterSpacing: '.22em', transform: 'translate(-50%,0) scale(1)' }]);
    // легка тряска годинника під час «повороту»
    if (!lite) {
      wrapper.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(0,0)', offset: .5 }, { transform: 'translate(-2px,1px)', offset: .56 }, { transform: 'translate(2px,-1px)', offset: .62 },
                       { transform: 'translate(-1px,-2px)', offset: .68 }, { transform: 'translate(1px,2px)', offset: .72 }, { transform: 'translate(0,0)', offset: .74 }, { transform: 'translate(0,0)' }], { duration: DUR });
    }
    // подія: ключі входять у замок
    setTimeout(function () {
      burst(tipL, cy, 'gold', 6); burst(tipR, cy, 'gold', 6); vib(12); kick();
    }, DUR * .50);
    // подія: поворот → час зупиняється
    setTimeout(function () {
      freeze(); wrapper.classList.add('fx-frozen');
      burst(cx, cy, 'gold', 34); burst(cx, cy, 'default', 14); vib([30, 40, 110]); kick();
    }, DUR * .72);
    // кінець
    setTimeout(function () {
      ov.remove(); body.classList.remove('fx-ritual'); finish();
    }, DUR + 60);
  }
  // підміна функції гри: initTheRitual викликає triggerTheEnd за іменем
  if (typeof window.triggerTheEnd === 'function') window.triggerTheEnd = ritual;

  /* =====================================================================
     СУЗІР'Я: клас body.const-open (для canvas поверх), спалахи при активації зірок
     ===================================================================== */
  (function () {
    var cc = $('constellationContainer');
    if (!cc || !window.MutationObserver) return;
    var openedAt = 0, seen = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
    var isOpen = function () { return cc.style.display && cc.style.display !== 'none'; };
    var sync = function () {
      var o = isOpen();
      if (o && !body.classList.contains('const-open')) openedAt = Date.now();
      body.classList.toggle('const-open', !!o);
      if (o) kick();
    };
    new MutationObserver(function (list) {
      var i, m;
      // 1) спершу — відкриття екрана (до обробки зірок: до цього моменту DOM уже у фінальному стані)
      for (i = 0; i < list.length; i++) { m = list[i]; if (m.target === cc && m.attributeName === 'style') { sync(); break; } }
      // 2) потім — зірки, що засвітились
      for (i = 0; i < list.length; i++) {
        m = list[i];
        if (m.target === cc) continue;
        var el = m.target;
        if (!el.classList || !el.classList.contains('constellation-star') && !el.classList.contains('constellation-center')) continue;
        if (!el.classList.contains('active')) continue;
        if (seen && seen.has(el)) continue;
        if (seen) seen.add(el);
        // зірки, що «вмикаються» під час відкриття екрана, не салютують
        if (!isOpen() || Date.now() - openedAt < 1600 || !animOn()) continue;
        var b = el.getBoundingClientRect();
        burst(b.left + b.width / 2, b.top + b.height / 2, 'gold', el.id === 'constCenter' ? 30 : 16);
        vib([14, 24, 14]);
      }
    }).observe(cc, { attributes: true, subtree: true, attributeFilter: ['class', 'style'] });
    sync();
  })();

  /* =====================================================================
     Вібровідгук (телефони) + перемикач у «Налаштуваннях»
     ===================================================================== */
  function hapticsOn() { try { return localStorage.getItem('fxHaptics') !== '0'; } catch (e) { return true; } }
  (function () {
    if (!navigator.vibrate) return;
    var da = $('disableAnimations'), row = da && da.closest('.setting-item');
    if (!row || $('fxHapticsToggle')) return;
    var r2 = doc.createElement('div'); r2.className = 'setting-item';
    r2.innerHTML = '<label for="fxHapticsToggle">' + tt('Вібрація при кліку:') + '</label><input type="checkbox" id="fxHapticsToggle" aria-label="Вібрація">';
    row.parentNode.insertBefore(r2, row.nextSibling);
    var cb = r2.querySelector('input'); cb.checked = hapticsOn();
    cb.addEventListener('change', function () { try { localStorage.setItem('fxHaptics', cb.checked ? '1' : '0'); } catch (e) {} if (cb.checked) vib(20); });
  })();
  var lastVib = 0;
  wrapper.addEventListener('click', function () {
    if (!navigator.vibrate) return;
    var n = Date.now(); if (n - lastVib < 45) return; lastVib = n;
    vib(7);
  });

  /* =====================================================================
     Спалах країв екрана на віхах комбо
     ===================================================================== */
  (function () {
    var cb = $('comboCount'); if (!cb || !window.MutationObserver) return;
    var el = doc.createElement('div'); el.id = 'fxMilestone'; body.appendChild(el);
    var marks = { 10: 1, 25: 1, 50: 1, 100: 1, 200: 1, 500: 1 }, prev = 0;
    new MutationObserver(function () {
      var v = parseInt(cb.textContent, 10) || 0;
      if (v !== prev && marks[v] && animOn()) {
        el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
        vib([10, 20, 30]);
      }
      prev = v;
    }).observe(cb, { childList: true, characterData: true, subtree: true });
  })();

  /* ---------- розвантаження коду гри (script.js не чіпаємо) ----------
     Функції script.js — глобальні, тому їх можна обгорнути зверху. */
  function wrapGlobal(name, gap, opts) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    opts = opts || {};
    var lastT = 0, tm = 0;
    window[name] = function () {
      var self = this, args = arguments;
      if (opts.hiddenSkip && doc.hidden) return;
      if (opts.liteOnly && !liteNow) return orig.apply(self, args);
      if (opts.gate && !opts.gate()) return;
      var n = performance.now();
      if (n - lastT >= gap) { lastT = n; return orig.apply(self, args); }
      if (opts.trailing && !tm) {
        tm = setTimeout(function () { tm = 0; lastT = performance.now(); orig.apply(self, args); }, gap - (n - lastT));
      }
    };
  }
  // старі «літаючі» цифри приховані CSS — не створюємо їх взагалі (DOM + transition + 2 таймери на клік)
  if (typeof window.showFloating === 'function') window.showFloating = function () {};
  // кожен клік переписував innerHTML усіх кнопок апгрейдів — обмежуємо до ~4 разів/с
  wrapGlobal('updateAllButtons', 400, { liteOnly: true, trailing: true });
  wrapGlobal('updatePrestigeProgress', 250, { liteOnly: true, trailing: true });
  // кожні 50 мс гра чіпала стилі всіх скінів, навіть із закритою вкладкою
  wrapGlobal('updateSkinHighlights', 400, {
    gate: function () { var t = $('tab-skins'); return t && t.classList.contains('active'); }
  });
  // стрілки: у легкому режимі ~11 разів/с (різниці на око нема), у фоновій вкладці не оновлюємо
  wrapGlobal('updateClockHands', 90, { liteOnly: true });
  (function () {
    var o = window.updateClockHands;
    if (typeof o === 'function') window.updateClockHands = function () { if (doc.hidden) return; return o.apply(this, arguments); };
  })();

  /* ---------- без «виділення» годинника при тапі ---------- */
  wrapper.addEventListener('mousedown', function (e) { e.preventDefault(); }); // не фокусується / не виділяється, click працює
  wrapper.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'touch' && doc.activeElement && doc.activeElement.blur) doc.activeElement.blur();
  });

  /* ---------- старт ---------- */
  window.addEventListener('resize', function () { applyLite(); resize(); kick(); });
  liteNow = detectLite(); body.classList.toggle('fx-lite', liteNow);
  resize(); syncAccent();
  setInterval(function () { applyLite(); syncAccent(); kick(); }, 1000);
  kick();
})();
