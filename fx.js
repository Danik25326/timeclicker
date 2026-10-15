/* fx.js v6 */
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
        case 'plasma':
          sp = rnd(2, 9); p.col = pick(['236,72,153', '139,92,246', '56,189,248', '52,211,153']); p.g = 0.03; p.trail = true; break;
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
  // Зорі тепер чистий CSS (див. fx.css) — цикл працює лише коли є частинки/кільця/числа.
  var last = 0, running = true, rafId = 0, dirty = false, ema = 16, frames = 0;
  function kick() { if (!rafId && running) rafId = requestAnimationFrame(loop); }
  function loop(t) {
    rafId = 0;
    if (!running || !animOn()) return;
    var active = parts.length || rings.length || texts.length;
    if (!active) { if (dirty) { tx.clearRect(0, 0, W, H); dirty = false; } return; }
    rafId = requestAnimationFrame(loop);
    var gap = liteNow ? 33 : 16;
    if (t - last < gap) return;
    var dt = t - last; last = t;
    // авто-деградація: якщо ПК теж ледве тягне — вмикаємо легкий режим
    if (!liteNow && dt < 250) {
      ema = ema * 0.95 + dt * 0.05; frames++;
      if (frames > 150 && ema > 30) { forcedLite = true; applyLite(); return; }
    }
    drawFx(); dirty = true;
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
    if (!animOn() || doc.hidden || liteNow || parts.length > 250 || body.classList.contains('fx-overlay')) return;
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
      if (!animOn() || liteNow || body.classList.contains('fx-overlay') || body.classList.contains('fx-ritual')) return;
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


  /* =====================================================================
     v5 — спостерігач оверлеїв: body.fx-overlay (canvas частинок піднімається вище)
     ===================================================================== */
  var OVERLAYS = ['reverbOverlay', 'bossArena', 'gameSelector', 'mcOverlay', 'constellationContainer', 'constKeyOverlay'];
  function overlayShown(el) {
    if (!el) return false;
    if (el.classList.contains('hidden') && el.id === 'reverbOverlay') return false;
    return getComputedStyle(el).display !== 'none';
  }
  function syncOverlays() {
    var any = false;
    OVERLAYS.forEach(function (id) { if (overlayShown($(id))) any = true; });
    body.classList.toggle('fx-overlay', any);
    body.classList.toggle('fx-game', overlayShown($('bossArena')));
    return any;
  }
  if (window.MutationObserver) {
    var ob = new MutationObserver(function () { syncOverlays(); });
    OVERLAYS.forEach(function (id) { var e = $(id); if (e) ob.observe(e, { attributes: true, attributeFilter: ['style', 'class'] }); });
  }

  /* =====================================================================
     v5 — РЕВЕРБ: кільце утримання, зворотний відлік, «втягування» частинок
     ===================================================================== */
  (function () {
    var ov = $('reverbOverlay'), rc = $('reverbClock');
    if (!ov || !rc) return;
    var ring = doc.createElement('div'); ring.id = 'fxHold';
    ring.innerHTML = '<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="46"/><circle class="pr" cx="50" cy="50" r="46" pathLength="100"/></svg><div class="fx-hold-n"></div>';
    ov.appendChild(ring);
    var num = ring.querySelector('.fx-hold-n'), t0 = 0, ivT = 0, ivW = 0, lastV = 0;
    function place() {
      var r = rc.getBoundingClientRect(), D = r.width + 70;
      ring.style.left = (r.left + r.width / 2) + 'px'; ring.style.top = (r.top + r.height / 2) + 'px';
      ring.style.width = D + 'px'; ring.style.height = D + 'px';
    }
    function warp() {
      if (!animOn()) return;
      var n = liteNow ? 1 : 4, cx = W / 2, cy = H / 2, d = Math.max(W, H) * 0.62, i;
      for (i = 0; i < n && parts.length < maxParts(); i++) {
        var a = rnd(0, TAU), sp = liteNow ? rnd(11, 16) : rnd(16, 28);
        parts.push({
          x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, vx: -Math.cos(a) * sp, vy: -Math.sin(a) * sp,
          life: 1, decay: liteNow ? 0.026 : 0.021, size: rnd(1.4, 3), g: 0, drag: 1, shape: 'c', trail: !liteNow,
          col: pick(['236,72,153', '139,92,246', '255,255,255', '56,189,248'])
        });
      }
      kick();
    }
    function tick() {
      var left = Math.max(0, 10 - (performance.now() - t0) / 1000);
      num.textContent = left.toFixed(1);
      var n = Date.now();
      if (n - lastV > 320) { lastV = n; vib(5 + Math.round((10 - left) * 1.6)); }
    }
    function start() {
      place(); ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go');
      t0 = performance.now(); clearInterval(ivT); clearInterval(ivW);
      ivT = setInterval(tick, 100); ivW = setInterval(warp, liteNow ? 110 : 50);
      body.classList.add('fx-holding'); tick();
    }
    function stop() {
      ring.classList.remove('go'); num.textContent = ''; clearInterval(ivT); clearInterval(ivW);
      body.classList.remove('fx-holding');
    }
    if (window.MutationObserver) {
      new MutationObserver(function () {
        var holding = rc.classList.contains('reverb-chaos');
        var on = body.classList.contains('fx-holding');
        if (holding && !on) start(); else if (!holding && on) stop();
      }).observe(rc, { attributes: true, attributeFilter: ['class'] });
    }
    // літаючі годинники — лише на ПК (DOM-елементи); статистичні бульбашки лишаються
    if (typeof restartEffect !== 'undefined' && restartEffect.createFlyingClock) {
      var ofc = restartEffect.createFlyingClock;
      restartEffect.createFlyingClock = function () { if (liteNow) return; return ofc.apply(this, arguments); };
    }
    // завершення: салют на екрані результату
    if (typeof restartEffect !== 'undefined' && restartEffect.showCompletionScreen) {
      var osc = restartEffect.showCompletionScreen;
      restartEffect.showCompletionScreen = function () {
        var r = osc.apply(this, arguments);
        if (animOn()) {
          burst(W / 2, H * 0.42, 'gold', 36); burst(W / 2, H * 0.42, 'plasma', 24);
          setTimeout(function () { burst(W * 0.3, H * 0.5, 'gold', 14); burst(W * 0.7, H * 0.5, 'plasma', 14); }, 350);
          vib([30, 40, 30, 40, 120]);
        }
        return r;
      };
    }
  })();

  /* =====================================================================
     v5 — ВІДНОВЛЕННЯ ЧАСУ: правильно знімаємо «сірість» + яскрава хвиля кольору
     (раніше клас fx-frozen залишався і годинник лишався тьмяним)
     ===================================================================== */
  (function () {
    if (typeof window.restoreTime !== 'function') return;
    function thanks() {
      if ($('fxThanks')) return;
      var w = doc.createElement('div'); w.id = 'fxThanks';
      w.innerHTML = '<div><h3>' + tt('Дякую за гру!') + '</h3><p>' +
        tt('Нехай твій час ніколи не зупиняється. P.s. Ви можете продовжувати грати як і грали до цього.') +
        '</p><button type="button">' + tt('Продовжити') + '</button></div>';
      body.appendChild(w);
      w.querySelector('button').addEventListener('click', function () { w.remove(); });
    }
    window.restoreTime = function () {
      var rtp = $('realTimePlayed'), rp = $('restorePanel');
      document.querySelectorAll('.clock').forEach(function (c) { c.classList.remove('broken-clock'); });
      wrapper.classList.remove('fx-frozen');
      if (rtp) { rtp.classList.remove('stat-stealth'); rtp.onclick = null; }
      if (rp) rp.style.display = 'none';
      var n = new Date(), sec = n.getSeconds(), mi = n.getMinutes() + sec / 60, hr = (n.getHours() % 12 || 12) + mi / 60;
      document.querySelectorAll('.hand').forEach(function (e) {
        e.style.transition = 'transform 3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        if (e.classList.contains('hour')) e.style.transform = 'translateX(-50%) rotate(' + hr * 30 + 'deg)';
        if (e.classList.contains('minute')) e.style.transform = 'translateX(-50%) rotate(' + mi * 6 + 'deg)';
        if (e.classList.contains('second')) e.style.transform = 'translateX(-50%) rotate(' + sec * 6 + 'deg)';
      });
      try { showToast(tt('ЧАС ВІДНОВЛЮЄТЬСЯ...')); } catch (e) {}
      revive();
      setTimeout(function () {
        try { isTimeBroken = false; realTimeFrozenValue = null; } catch (e) {}
        document.querySelectorAll('.hand').forEach(function (e) { e.style.transition = ''; e.style.animation = ''; });
        try { applyAllSkins(); } catch (e) {}   // повертає колір скіна та анімації стрілок
        syncAccent();
        try { updateClockHands(); } catch (e) {}
        try { saveGame(); } catch (e) {}
        thanks();                                // замість блокуючого alert()
      }, 3000);
    };
    function revive() {
      if (!animOn() || !wrapper.animate) return;
      var r = clock.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, lite = liteNow;
      var ov = doc.createElement('div'); ov.id = 'fxRevive';
      ov.innerHTML = '<div class="rv-flash"></div><div class="rv-rain"></div>' + (lite ? '' : '<div class="rv-rain rv-r2"></div>');
      body.appendChild(ov); body.classList.add('fx-revive');
      var fl = ov.querySelector('.rv-flash');
      fl.style.background = 'radial-gradient(circle at ' + cx + 'px ' + cy + 'px,rgba(255,255,255,.9),rgba(var(--fx-accent-rgb),.35) 35%,transparent 70%)';
      fl.animate([{ opacity: 0 }, { opacity: 0, offset: .72 }, { opacity: .9, offset: .8 }, { opacity: 0 }], { duration: 3300, fill: 'both' });
      [].forEach.call(ov.querySelectorAll('.rv-rain'), function (el, i) {
        var D = r.width * 1.05; el.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + D + 'px;height:' + D + 'px';
        var T = function (s, rot) { return 'translate(-50%,-50%) scale(' + s + ') rotate(' + rot + 'deg)'; };
        el.animate([{ transform: T(.3, 0), opacity: 0 }, { transform: T(1.1, 90), opacity: .95, offset: .25 }, { transform: T(4.2 + i, 360), opacity: 0 }],
          { duration: 2600 + i * 400, delay: 500 + i * 250, fill: 'both', easing: 'cubic-bezier(.2,.7,.3,1)' });
      });
      // годинник «оживає»: з сірого → перенасичений → норма
      if (!lite && clock.animate) {
        clock.animate([{ filter: 'grayscale(1) brightness(.75)' }, { filter: 'grayscale(0) saturate(1.9) brightness(1.3)', offset: .55 }, { filter: 'none' }],
          { duration: 3000, easing: 'ease-out' });
      }
      setTimeout(function () { burst(cx, cy, 'plasma', 30); burst(cx, cy, 'gold', 20); vib([20, 30, 80]); kick(); }, 2400);
      setTimeout(function () { burst(cx, cy, 'default', 24); }, 2900);
      setTimeout(function () { ov.remove(); body.classList.remove('fx-revive'); }, 3400);
    }
  })();

  /* =====================================================================
     v5 — Прибираємо букву «Ґ» з секретного коду (її важко набрати)
     ===================================================================== */
  (function () {
    if (typeof window.generateSecretCode === 'function') {
      var og = window.generateSecretCode;
      window.generateSecretCode = function () { return String(og.apply(this, arguments)).replace(/\u0490/g, '\u0413'); };
    }
    setInterval(function () {
      try {
        if (typeof secretCode === 'string' && secretCode.indexOf('\u0490') > -1) {
          secretCode = secretCode.replace(/\u0490/g, '\u0413');   // збережений код: Ґ → Г
          var nc = $('newSecretCode'); if (nc && nc.textContent) nc.textContent = secretCode;
          if (typeof saveGame === 'function') saveGame();
        }
      } catch (e) {}
    }, 1500);
  })();

  /* =====================================================================
     v5 — ІГРИ: неонова аркада (фон, «післясвічення», bloom, ефекти кінця раунду)
     ===================================================================== */
  (function () {
    var cv = $('bossCanvas'), cont = $('bossCanvasContainer'), arena = $('bossArena');
    if (!cv || !cont) return;
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var bg = null, bl = null, blx = null, rafB = 0;
    function mkBg() {
      var c = doc.createElement('canvas'); c.width = 800; c.height = 600;
      var x = c.getContext('2d'), g = x.createRadialGradient(400, 300, 40, 400, 300, 520);
      g.addColorStop(0, '#0d1838'); g.addColorStop(1, '#02030a'); x.fillStyle = g; x.fillRect(0, 0, 800, 600);
      x.strokeStyle = 'rgba(90,150,255,.11)'; x.lineWidth = 1;
      for (var i = 0; i <= 800; i += 40) { x.beginPath(); x.moveTo(i + .5, 0); x.lineTo(i + .5, 600); x.stroke(); }
      for (var j = 0; j <= 600; j += 40) { x.beginPath(); x.moveTo(0, j + .5); x.lineTo(800, j + .5); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,.5)';
      for (var k = 0; k < 60; k++) x.fillRect((k * 137.5) % 800, (k * 71.3) % 600, 1.2, 1.2);
      return c;
    }
    var fr = CanvasRenderingContext2D.prototype.fillRect;
    ctx.fillRect = function (x, y, w, h) {
      if (w >= cv.width && h >= cv.height && x <= 0 && y <= 0) {
        var f = this.fillStyle;
        if (f === '#000000' || f === 'black') {
          if (!bg) bg = mkBg();
          this.save(); this.globalAlpha = liteNow ? 1 : 0.55; this.drawImage(bg, 0, 0); this.restore(); return;
        }
      }
      return fr.call(this, x, y, w, h);
    };
    function bloomLoop() {
      rafB = 0;
      if (!body.classList.contains('fx-game') || liteNow || !animOn() || doc.hidden) return;
      if (!bl) {
        bl = doc.createElement('canvas'); bl.id = 'fxBloom'; bl.width = 400; bl.height = 300; blx = bl.getContext('2d');
        cont.appendChild(bl);
      }
      blx.drawImage(cv, 0, 0, 400, 300);
      rafB = requestAnimationFrame(bloomLoop);
    }
    if (window.MutationObserver && arena) {
      new MutationObserver(function () { if (!rafB && body.classList.contains('fx-game')) rafB = requestAnimationFrame(bloomLoop); })
        .observe(body, { attributes: true, attributeFilter: ['class'] });
    }
    if (typeof window.onGameEnd === 'function') {
      var oge = window.onGameEnd;
      window.onGameEnd = function (win) {
        var r = oge.apply(this, arguments);
        try {
          if (animOn()) {
            var b = cv.getBoundingClientRect();
            burst(b.left + b.width / 2, b.top + b.height / 2, win ? 'gold' : 'red', win ? 38 : 26);
            vib(win ? [20, 30, 70] : [70]);
          }
        } catch (e) {}
        return r;
      };
    }
  })();

  /* =====================================================================
     v5 — МАГАЗИН: анімація покупки + «заливка» прогресу до ціни
     ===================================================================== */
  (function () {
    ['upgrades', 'multipliers'].forEach(function (cid) {
      var c = $(cid); if (!c) return;
      c.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('.upgrade-btn');
        if (!b || b.disabled) return;
        var before = b.textContent, done = false;
        // рівень міг оновитись не одразу (rAF/таймер гри) — перевіряємо кілька разів
        [0, 60, 200, 450].forEach(function (d) {
          setTimeout(function () {
            if (done || !b.isConnected || b.textContent === before) return;
            done = true;
            b.classList.remove('fx-bought'); void b.offsetWidth; b.classList.add('fx-bought');
            setTimeout(function () { b.classList.remove('fx-bought'); }, 700);
            if (animOn()) { var r = b.getBoundingClientRect(); burst(r.left + r.width * 0.5, r.top + r.height * 0.5, 'gold', 6); vib(10); kick(); }
          }, d);
        });
      }, true);
    });
    setInterval(function () {
      if (doc.hidden || !animOn()) return;
      try {
        if (typeof buttons === 'undefined' || !buttons.length) return;
        for (var i = 0; i < buttons.length; i++) {
          var b = buttons[i], u = upgrades[i];
          if (!b || !u || b.classList.contains('hidden') || !b.offsetParent) continue;
          var p = Math.max(0, Math.min(1, score / u.getC()));
          var v = p.toFixed(2);
          if (b.__p !== v) { b.__p = v; b.style.setProperty('--p', v); }
        }
      } catch (e) {}
    }, 500);
  })();

  /* =====================================================================
     v5 — СКІНИ: нові форми/кольори/стрілки/ефекти + прев'ю
     ===================================================================== */
  (function () {
    function add(list, o) { try { if (list && !list.some(function (x) { return x.id === o.id; })) list.push(o); } catch (e) {} }
    try {
      add(shapes, { id: 'squircle', n: 'Сквіркл', p: 216000 });
      add(clockSkins, { id: 'emerald', n: 'Смарагд', p: 172800 });
      add(clockSkins, { id: 'ice', n: 'Лід', p: 216000 });
      add(clockSkins, { id: 'gold', n: 'Золото', p: 432000 });
      add(clockSkins, { id: 'aurora', n: 'Аврора', p: 604800 });
      add(handSkins, { id: 'gold', n: 'Золоті', p: 86400 });
      add(handSkins, { id: 'laser', n: 'Лазерні', p: 172800 });
      add(handSkins, { id: 'aurora', n: 'Аврора', p: 345600 });
      add(effects, { id: 'gold', n: 'Золотий дощ', p: 540000 });
      add(effects, { id: 'plasma', n: 'Плазма', p: 900000 });
    } catch (e) {}
    var CLOCKS = { emerald: '#10b981', ice: '#7dd3fc', gold: '#fbbf24', aurora: '#a78bfa' };
    function extra() {
      try {
        body.dataset.clockSkin = current.clock; body.dataset.handSkin = current.hand; body.dataset.shape = current.shape || 'round';
        var cl = CLOCKS[current.clock];
        if (cl && !isTimeBroken) {
          document.querySelectorAll('.clock').forEach(function (el) { el.style.borderColor = cl; el.style.boxShadow = '0 0 50px ' + cl + ', 0 0 100px ' + cl; });
        }
      } catch (e) {}
      syncAccent();
    }
    if (typeof window.applyAllSkins === 'function') {
      var oas = window.applyAllSkins;
      window.applyAllSkins = function () { var r = oas.apply(this, arguments); extra(); return r; };
    }
    if (typeof window.createSkinGrid === 'function') {
      var ocs = window.createSkinGrid;
      window.createSkinGrid = function (ct, ls, type) {
        var r = ocs.apply(this, arguments), g = $(ct);
        if (g) [].forEach.call(g.children, function (el, i) {
          var s = ls[i]; if (!s || el.querySelector('.fx-pv')) return;
          el.dataset.skin = s.id; el.dataset.type = type;
          var pv = doc.createElement('i'); pv.className = 'fx-pv'; pv.setAttribute('aria-hidden', 'true');
          el.insertBefore(pv, el.firstChild);
        });
        return r;
      };
    }
    if (typeof window.triggerClickEffect === 'function') {
      var otc = window.triggerClickEffect;
      window.triggerClickEffect = function () { clock.classList.remove('click-effect-gold', 'click-effect-plasma'); return otc.apply(this, arguments); };
    }
    extra();
  })();


  /* =====================================================================
     v6 — БЛИМАННЯ: повіки замість чорного екрана (коротко, ~0.45 с)
     ===================================================================== */
  (function () {
    if (!window.MutationObserver) return;
    function eyelids() {
      if (!wrapper.animate) return;
      var o = $('fxEye'); if (o) o.remove();
      o = doc.createElement('div'); o.id = 'fxEye';
      o.innerHTML = '<i class="lid t"></i><i class="lid b"></i><i class="glow"></i>';
      body.appendChild(o);
      var D = 460, t = o.querySelector('.t'), b = o.querySelector('.b'), g = o.querySelector('.glow');
      var CL = 'cubic-bezier(.5,0,.85,.45)', OP = 'cubic-bezier(.2,.6,.3,1)';
      t.animate([{ transform: 'translateY(-104%)', offset: 0, easing: CL }, { transform: 'translateY(0)', offset: .36, easing: 'linear' },
                 { transform: 'translateY(0)', offset: .5, easing: OP }, { transform: 'translateY(-104%)', offset: 1 }], { duration: D, fill: 'both' });
      b.animate([{ transform: 'translateY(104%)', offset: 0, easing: CL }, { transform: 'translateY(0)', offset: .36, easing: 'linear' },
                 { transform: 'translateY(0)', offset: .5, easing: OP }, { transform: 'translateY(104%)', offset: 1 }], { duration: D, fill: 'both' });
      g.animate([{ opacity: 0 }, { opacity: 1, offset: .4 }, { opacity: 1, offset: .5 }, { opacity: 0 }], { duration: D, fill: 'both' });
      setTimeout(function () { o.remove(); }, D + 80);
      vib(8);
    }
    new MutationObserver(function () {
      if (!body.classList.contains('eye-blink')) return;
      body.classList.remove('eye-blink');   // прибираємо старий чорний екран, ще до його відмальовки
      if (animOn()) eyelids();
    }).observe(body, { attributes: true, attributeFilter: ['class'] });
  })();

  /* =====================================================================
     v6 — СТРІЧКА НОВИН: завжди працює й одразу (таймаути, кілька проксі, запасні «факти»)
     Раніше fetch без таймауту міг висіти хвилинами, а при помилці не показувалось нічого.
     ===================================================================== */
  (function () {
    if (!window.fetch || window.__fxFetch) return;
    window.__fxFetch = true;
    var of = window.fetch.bind(window), MARK = 'https://api.allorigins.win/raw?url=';
    var memo = {}, inflight = {}, failedAt = 0;
    var FACTS = [
      ['Доба на Землі ≈ 23 год 56 хв', 'Повний оберт навколо осі — зоряна доба. Сонячна доба (24 год) довша через рух Землі навколо Сонця.', 'https://uk.wikipedia.org/wiki/Доба'],
      ['Секунда — це атом цезію', 'Секунду визначають через кількість коливань атома цезію-133. Точніше за будь-який механічний годинник.', 'https://uk.wikipedia.org/wiki/Секунда'],
      ['Мільярд секунд = 31,7 року', 'Мільйон секунд — це лише ≈ 11,6 доби. А мільярд — понад три десятиліття.', 'https://uk.wikipedia.org/wiki/Секунда'],
      ['Світло від Сонця летить ≈ 8 хв', 'Тож Сонце, яке ви бачите, — таке, яким воно було 8 хвилин тому.', 'https://uk.wikipedia.org/wiki/Сонце'],
      ['Ми кліпаємо 15–20 разів на хвилину', 'Кліпання зволожує око. А ще це найкраща пауза, щоб відірватись від екрана.', 'https://uk.wikipedia.org/wiki/Моргання'],
      ['Чому у хвилині 60 секунд?', 'Шістдесяткова система лічби прийшла з давньої Месопотамії й досі живе в годиннику.', 'https://uk.wikipedia.org/wiki/Шістдесяткова_система_числення'],
      ['Високосний рік: 29 лютого', 'Рік триває ≈ 365,25 доби, тому раз на чотири роки додається ще один день.', 'https://uk.wikipedia.org/wiki/Високосний_рік'],
      ['Годинники GPS — трохи «швидші»', 'Через гравітацію та швидкість годинники супутників ходять інакше, і це враховують у розрахунках.', 'https://uk.wikipedia.org/wiki/Теорія_відносності'],
      ['Правило 20-20-20 для очей', 'Кожні 20 хвилин дивіться на щось за 6 метрів 20 секунд — очі відпочивають від екрана.', 'https://uk.wikipedia.org/wiki/Втома_очей'],
      ['Тиждень із 7 днів — дуже давня традиція', 'Семиденний цикл відомий з глибокої давнини і пов\u2019язаний із давніми календарями.', 'https://uk.wikipedia.org/wiki/Тиждень'],
      ['Сонячний годинник — найстаріший', 'Люди міряли час по тіні задовго до механічних годинників.', 'https://uk.wikipedia.org/wiki/Сонячний_годинник'],
      ['Нескінченна стрічка вбиває час', 'Знайоме відчуття? Тут принаймні кожна секунда йде в справу 😅', 'https://uk.wikipedia.org/wiki/Скролінг']
    ];
    function esc(t) { return String(t).replace(/]]>/g, ']]&gt;'); }
    function fallbackXml() {
      var a = FACTS.slice().sort(function () { return Math.random() - .5; }), now = new Date().toUTCString();
      return '<?xml version="1.0"?><rss><channel>' + a.map(function (f) {
        return '<item><title><![CDATA[\u23F1 ' + esc(f[0]) + ']]></title><description><![CDATA[' + esc(f[1]) + ']]></description><link>' + f[2] + '</link><pubDate>' + now + '</pubDate></item>';
      }).join('') + '</channel></rss>';
    }
    function timed(url, ms) {
      var ac = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = setTimeout(function () { if (ac) ac.abort(); }, ms);
      return of(url, ac ? { signal: ac.signal, mode: 'cors' } : { mode: 'cors' }).then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error('bad'); return r.text(); });
    }
    function firstGood(list) {
      return new Promise(function (res, rej) {
        var n = list.length, f = 0;
        list.forEach(function (p) {
          p.then(function (v) { if (v && v.indexOf('<item') > -1) res(v); else if (++f === n) rej(); }, function () { if (++f === n) rej(); });
        });
      });
    }
    function real(target) {
      var e = encodeURIComponent(target);
      return firstGood([timed(MARK + e, 5000), timed('https://corsproxy.io/?url=' + e, 5000), timed('https://api.codetabs.com/v1/proxy?quest=' + e, 5000)])
        .then(function (x) { memo[target] = { t: Date.now(), x: x }; return x; });
    }
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf(MARK) !== 0) return of(input, init);
      var target = decodeURIComponent(url.slice(MARK.length));
      var m = memo[target];
      if (m && Date.now() - m.t < 3.6e6) return Promise.resolve(new Response(m.x, { status: 200 }));
      var fb = function () {
        setTimeout(function () { try { lastFetchTime = 0; } catch (e) {} }, 80);   // щоб наступного разу спробувати справжні новини
        return new Response(fallbackXml(), { status: 200 });
      };
      if (Date.now() - failedAt < 300000) return Promise.resolve(fb());           // мережі нема — одразу запасні
      var p = inflight[target] || (inflight[target] = real(target).then(
        function (x) { delete inflight[target]; return x; },
        function () { delete inflight[target]; failedAt = Date.now(); return null; }));
      var quick = new Promise(function (res) { setTimeout(function () { res(null); }, 1800); });   // не чекаємо довше 1.8 с
      return Promise.race([p, quick]).then(function (x) { return x ? new Response(x, { status: 200 }) : fb(); });
    };
    // підпис джерела для запасних фактів + кнопка «закрити» + передзавантаження
    var nt = $('newsTicker'), box = $('newsTickerContainer');
    if (nt && window.MutationObserver) {
      new MutationObserver(function (list) {
        list.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) {
          if (n.nodeType !== 1 || !n.querySelector) return;
          var tt2 = n.querySelector('.news-ticker-title'), src = n.querySelector('.news-source');
          if (tt2 && src && /^\u23F1/.test(tt2.textContent)) src.textContent = 'Цікавий факт';
        }); });
      }).observe(nt, { childList: true });
    }
    if (box && !$('fxNewsClose')) {
      var x = doc.createElement('button'); x.id = 'fxNewsClose'; x.type = 'button'; x.setAttribute('aria-label', 'Закрити'); x.textContent = '\u00D7';
      x.addEventListener('click', function (e) { e.stopPropagation(); try { hideNewsTicker(); } catch (er) { box.classList.remove('show'); } });
      box.appendChild(x);
    }
    setTimeout(function () {
      try {
        if (typeof fetchRSSNews === 'function') fetchRSSNews().then(function (n) { if (n && n[0] && /^\u23F1/.test(n[0].title)) lastFetchTime = 0; });
      } catch (e) {}
    }, 7000);
  })();

  /* =====================================================================
     v6 — АВТОЗБЕРЕЖЕННЯ: показник + вибір періоду (у «Налаштуваннях»)
     ===================================================================== */
  (function () {
    var KEY = 'fxSaveEvery', lastAt = 0, nextAt = 0;
    try { lastAt = parseInt(localStorage.getItem('fxLastSave'), 10) || 0; } catch (e) {}
    var OPTS = [[30, '30 секунд (стандартно)'], [60, '1 хвилина'], [300, '5 хвилин'], [600, '10 хвилин'], [1800, '30 хвилин'], [3600, '1 година'], [7200, '2 години']];
    function getSec() { try { var v = parseInt(localStorage.getItem(KEY), 10); return v > 0 ? v : 30; } catch (e) { return 30; } }
    function schedule() {
      try { clearInterval(saveInterval); } catch (e) {}
      var ms = getSec() * 1000; nextAt = Date.now() + ms;
      try { saveInterval = setInterval(function () { nextAt = Date.now() + ms; if (typeof saveGame === 'function') saveGame(); }, ms); } catch (e) {}
    }
    if (typeof window.startIntervals === 'function') {
      var osi = window.startIntervals;
      window.startIntervals = function () { var r = osi.apply(this, arguments); schedule(); return r; };
    }
    if (typeof window.saveGame === 'function') {
      var osg = window.saveGame;
      window.saveGame = function () {
        var r = osg.apply(this, arguments); lastAt = Date.now();
        try { localStorage.setItem('fxLastSave', String(lastAt)); } catch (e) {}
        return r;
      };
    }
    // при виході зі сторінки / згортанні — зберігаємо (щоб довгий період не ризикував прогресом)
    function flush() { try { if (saveInterval && typeof saveGame === 'function') saveGame(); } catch (e) {} }
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) flush(); });
    window.addEventListener('pagehide', flush);

    function fmt(ms) {
      var sec = Math.max(0, Math.round(ms / 1000));
      if (sec < 60) return sec + ' с';
      var m = Math.round(sec / 60); if (m < 60) return m + ' хв';
      var h = Math.floor(m / 60), mm = m % 60; return h + ' год' + (mm ? ' ' + mm + ' хв' : '');
    }
    var anchor = $('showClockMarks') || $('disableAnimations'), row = anchor && anchor.closest('.setting-item');
    if (!row || $('fxSaveSel')) return;
    var w = doc.createElement('div'); w.className = 'setting-item';
    w.innerHTML = '<label for="fxSaveSel">Автозбереження:</label><select id="fxSaveSel" aria-label="Як часто зберігати гру">' +
      OPTS.map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '</select>';
    var info = doc.createElement('div'); info.className = 'fx-save-info'; info.id = 'fxSaveInfo';
    row.parentNode.insertBefore(w, row.nextSibling); row.parentNode.insertBefore(info, w.nextSibling);
    var sel = w.querySelector('select'); sel.value = String(getSec());
    if (sel.value !== String(getSec())) { var op = doc.createElement('option'); op.value = String(getSec()); op.textContent = fmt(getSec() * 1000); sel.appendChild(op); sel.value = String(getSec()); }
    function render() {
      var label = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].textContent.replace(/ \(стандартно\)/, '') : '';
      info.innerHTML = 'Зберігається кожні <b>' + label + '</b>. Останнє збереження: <b>' + (lastAt ? fmt(Date.now() - lastAt) + ' тому' : 'ще не було') +
        '</b>. Наступне автозбереження через <b>' + (nextAt ? fmt(nextAt - Date.now()) : '—') + '</b>.<br>Гра також зберігається при кожній покупці та коли ви закриваєте чи згортаєте сторінку.';
    }
    var sp = $('settings');
    if (sp && window.MutationObserver) new MutationObserver(function () { if (sp.classList.contains('active')) render(); }).observe(sp, { attributes: true, attributeFilter: ['class'] });
    sel.addEventListener('change', function () {
      try { localStorage.setItem(KEY, sel.value); } catch (e) {}
      schedule(); render();
    });
    render();
    setInterval(function () { var p = $('settings'); if (!doc.hidden && p && p.classList.contains('active')) render(); }, 5000);
  })();

  /* =====================================================================
     v6 — НОВІ ДОСЯГНЕННЯ (рівні: 1 бронза, 2 срібло, 3 золото, 4 легенда)
     ===================================================================== */
  (function () {
    if (typeof window.initAchievements !== 'function') return;
    var clicks = 0;
    try { clicks = parseInt(localStorage.getItem('fxClicks'), 10) || 0; } catch (e) {}
    wrapper.addEventListener('click', function (e) {
      if (!(e.target.closest && e.target.closest('#clickableClock')) && e.target !== wrapper) return;
      clicks++; if (clicks % 25 === 0) { try { localStorage.setItem('fxClicks', String(clicks)); } catch (er) {} }
    });
    window.addEventListener('pagehide', function () { try { localStorage.setItem('fxClicks', String(clicks)); } catch (e) {} });
    var upCnt = function () { var n = 0; try { for (var i = 0; i < Math.min(13, upgrades.length); i++) if (upgrades[i].l > 0) n++; } catch (e) {} return n; };
    var EXTRA = [
      ['👆', 'Сотня кліків', 1, 100, function () { return clicks; }, 'Зробіть 100 кліків по годиннику'],
      ['⚡', 'Тисяча кліків', 2, 1000, function () { return clicks; }, '1000 кліків — пальці вже в тонусі'],
      ['🔥', 'Десять тисяч кліків', 3, 10000, function () { return clicks; }, 'Справжній клікер-ветеран'],
      ['🎯', 'Комбо ×100', 2, 100, function () { return maxComboEver; }, 'Тримайте темп: комбо 100'],
      ['🌪️', 'Комбо ×250', 3, 250, function () { return maxComboEver; }, 'Вихор кліків: комбо 250'],
      ['🛒', 'Шопоголік', 2, 50, function () { return totalUpgradesBought; }, 'Купіть 50 апгрейдів'],
      ['🏗️', 'Будівничий часу', 3, 250, function () { return totalUpgradesBought; }, 'Купіть 250 апгрейдів'],
      ['💎', 'Мільйонер часу', 2, 1e6, function () { return clickCloudTotal; }, 'Зберіть мільйон секунд за все життя'],
      ['🏦', 'Мільярдер часу', 3, 1e9, function () { return clickCloudTotal; }, 'Мільярд секунд — це понад 31 рік'],
      ['🤖', 'Автопілот', 2, 1000, function () { return autoRate; }, 'Дохід 1000 сек за секунду'],
      ['🚀', 'Гіперпотік', 3, 1e6, function () { return autoRate; }, 'Дохід мільйон сек за секунду'],
      ['📚', 'Повна лінійка', 3, 13, upCnt, 'Придбайте кожен апгрейд хоча б раз'],
      ['⏪', 'Перший реверб', 2, 1, function () { return totalReverbs; }, 'Поверніть час назад уперше'],
      ['♾️', 'Майстер реверберацій', 3, 5, function () { return totalReverbs; }, 'П\u2019ять перезапусків часу'],
      ['🗝️', 'Власник ключів', 3, 2, function () { return (gameState.hasKey1 ? 1 : 0) + (gameState.hasKey2 ? 1 : 0); }, 'Знайдіть обидва ключі'],
      ['🕳️', 'Кінець часу', 4, 1, function () { return (gameState.ending >= 1 || isTimeBroken) ? 1 : 0; }, 'Дійдіть до зупинки часу'],
      ['🌙', 'Нічна пташка', 1, 1, function () { var h = new Date().getHours(); return h < 5 ? 1 : 0; }, 'Грайте вночі (00:00–05:00)'],
      ['🧘', 'Терпіння', 1, 30, function () { return (Date.now() - sessionStart) / 60000; }, '30 хвилин за одну сесію'],
      ['🎨', 'Колекція форм', 3, 5, function () { return ownedSkins.shapes.length; }, 'Відкрийте всі форми годинника'],
      ['👑', 'Королівська колекція', 3, 2, function () { return (ownedSkins.clockSkins.indexOf('gold') > -1 ? 1 : 0) + (ownedSkins.handSkins.indexOf('gold') > -1 ? 1 : 0); }, 'Золотий годинник і золоті стрілки'],
      ['🧪', 'Алхімік ефектів', 3, 5, function () { return ownedSkins.effects.length; }, 'Відкрийте 5 ефектів кліку'],
      ['✖️', 'Множник-майстер', 2, 3, function () { var n = 0; try { multipliers.forEach(function (m) { if (m.b) n++; }); } catch (e) {} return n; }, 'Купіть 3 множники']
    ];
    var oi = window.initAchievements;
    window.initAchievements = function () {
      var r = oi.apply(this, arguments);
      try {
        var root = $('achievements'); if (!root) return r;
        EXTRA.forEach(function (x) {
          var a = { t: x[1], tg: x[3], g: x[4], done: false };
          achievementsList.push(a);
          var el = doc.createElement('div'); el.className = 'achievement fx-ach'; el.dataset.tier = x[2];
          el.innerHTML = '<span class="fx-ach-i">' + x[0] + '</span><strong>' + x[1] + '</strong><div class="fx-ach-d">' + x[5] +
            '</div><div class="ach-progress"></div><div class="ach-state">0%</div>';
          root.appendChild(el); a.p = el.querySelector('.ach-progress'); a.s = el.querySelector('.ach-state');
        });
      } catch (e) {}
      return r;
    };
    setInterval(function () {      // підсвічуємо виконані
      try {
        var p = $('tab-achievements'); if (doc.hidden || !p || !p.classList.contains('active')) return;
        achievementsList.forEach(function (a) { if (a.p && a.p.parentNode) a.p.parentNode.classList.toggle('fx-done', !!a.done); });
      } catch (e) {}
    }, 1500);
  })();


  /* =====================================================================
     v6 — телефони: для «текстових» вкладок панель на всю ширину (усе видно)
     ===================================================================== */
  (function () {
    var WIDE = { 'tab-developers': 1, 'tab-tutorial': 1, 'tab-stats': 1, 'settings': 1, 'tab-achievements': 1, 'tab-skins': 1, 'tab-reverb': 1 };
    function sync() { var a = doc.querySelector('.tab-page.active'); body.classList.toggle('fx-wide', !!(a && WIDE[a.id])); }
    var tabs = doc.querySelector('.top-tabs');
    if (tabs) tabs.addEventListener('click', function () { setTimeout(sync, 0); setTimeout(sync, 150); });
    sync();
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

  /* ---------- зорі, що летять вгору (CSS-шари) ---------- */
  (function () {
    if ($('fxStars')) return;
    var st = doc.createElement('div'); st.id = 'fxStars'; st.setAttribute('aria-hidden', 'true');
    st.innerHTML = '<i class="s1"></i><i class="s2"></i><i class="s3"></i>';
    body.insertBefore(st, body.firstChild);
    // Плитки зір малюємо ОДИН раз на canvas → готові картинки (дешевше за десятки CSS-градієнтів:
    // саме градієнти давали фриз при перемиканні вкладок на телефонах)
    function tile(T, n, o) {
      var dpr = Math.min(window.devicePixelRatio || 1, liteNow ? 1.5 : 2);
      var c = doc.createElement('canvas'); c.width = c.height = Math.round(T * dpr);
      var x = c.getContext('2d'); if (!x) return '';
      x.scale(dpr, dpr);
      var tints = ['255,255,255', '255,255,255', '170,205,255', '120,230,255', '255,150,210'];
      for (var i = 0; i < n; i++) {
        var px = rnd(0, T), py = rnd(0, T), a = rnd(o.amin, o.amax), col = tints[(Math.random() * o.tints) | 0], r = rnd(o.rmin, o.rmax);
        for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {      // «загортаємо» краї → безшовний цикл
          var X = px + dx * T, Y = py + dy * T;
          if (X < -12 || X > T + 12 || Y < -14 || Y > T + 14) continue;
          if (o.streak && i % 2 === 0) {
            var g = x.createLinearGradient(X, Y - 9, X, Y + 9);
            g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(.5, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
            x.fillStyle = g; x.fillRect(X - .65, Y - 9, 1.3, 18);
          } else {
            x.fillStyle = 'rgba(' + col + ',' + a + ')'; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill();
          }
        }
      }
      return c.toDataURL('image/png');
    }
    [['s1', 512, 26, { amin: .3, amax: .6, rmin: .6, rmax: .95, tints: 3 }],
     ['s2', 448, 16, { amin: .45, amax: .8, rmin: 1, rmax: 1.4, tints: 5 }],
     ['s3', 384, 12, { amin: .55, amax: .9, rmin: 1.4, rmax: 1.9, tints: 4, streak: true }]].forEach(function (d) {
      if (d[0] === 's2' && liteNow) return;
      var el = st.querySelector('.' + d[0]), u = tile(d[1], d[2], d[3]);
      if (el && u) { el.style.backgroundImage = 'url("' + u + '")'; el.style.setProperty('--t', d[1] + 'px'); }
    });
  })();

  /* ---------- старт ---------- */
  window.addEventListener('resize', function () { applyLite(); resize(); kick(); });
  liteNow = detectLite(); body.classList.toggle('fx-lite', liteNow);
  resize(); syncAccent(); syncOverlays();
  setInterval(function () { applyLite(); syncAccent(); kick(); }, 1000);
  kick();
})();
