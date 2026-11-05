/* pet.js v3 — «Домашній улюбленець»: одноразова покупка у вкладці «Множники».
   • Студія: завантажуєш фото → вирізаєш тварину (авто + пензлик) → отримуєш 3D-«плюшеву» модель.
   • Улюбленець ходить екраном, говорить те, що ти написав (звук тварини / голос / свій аудіофайл),
     радіє, коли його гладиш, і «тапає» по годиннику замість тебе.
   • Зникає після Перезапуску (Реверба), налаштування (фото, голос) зберігаються.
   Three.js вантажиться лише коли потрібно (спершу локальний three.min.js, потім CDN). */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  var FX = function () { return window.__fx || {}; };
  function tt(k) { try { return typeof t === 'function' ? t(k) : k; } catch (e) { return k; } }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return doc.getElementById(id); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function fmt(n) { try { return formatTime(n); } catch (e) { return Math.round(n) + ' с'; } }
  function vib(p) { try { FX().vib && FX().vib(p); } catch (e) {} }
  function lite() { try { return FX().lite(); } catch (e) { return false; } }
  function gameReady() { try { return typeof score !== 'undefined' && typeof updateScore === 'function'; } catch (e) { return false; } }
  function snd(name, o) { try { var SS = window.__fxSnd; if (SS && SS.force) SS.force(name, o); } catch (e) {} }

  var PRESETS = {
    cat:     { n: 'Кіт 🐱',      text: 'Мяу!',            snd: 'meow' },
    dog:     { n: 'Собака 🐶',   text: 'Гав-гав!',        snd: 'woof' },
    parrot:  { n: 'Папуга 🦜',   text: 'Привіт! Привіт!', snd: 'chirp' },
    hamster: { n: 'Хом\u2019як 🐹', text: 'Піп-піп!',   snd: 'squeak' },
    custom:  { n: 'Своє ✍️',    text: 'Привіт!',         snd: 'squeak' }
  };
  function defaults() { return { owned: false, photo: null, name: 'Улюбленець', preset: 'cat', text: 'Мяу!', mode: 'synth', audio: null, period: 30, size: 'm', hidden: false, taps: 0 }; }
  var P = ls('fxPet', null) || defaults();
  function save() { if (!lsSet('fxPet', P)) { P.audio = null; lsSet('fxPet', P); } }

  /* ----------------------------------------------------------------- Three.js */
  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (loadThree.p) return loadThree.p;
    var urls = ['three.min.js?v=149', 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r149/three.min.js', 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js'];
    loadThree.p = new Promise(function (res, rej) {
      (function next(i) {
        if (i >= urls.length) { rej(new Error('three')); return; }
        var s = doc.createElement('script'); s.src = urls[i];
        s.onload = function () { if (window.THREE) res(window.THREE); else next(i + 1); };
        s.onerror = function () { s.remove(); next(i + 1); };
        doc.head.appendChild(s);
      })(0);
    });
    loadThree.p.catch(function () { loadThree.p = null; });
    return loadThree.p;
  }

  /* ----------------------------------------------------------------- вирізання фону */
  function autoCut(src, tol0, mode) {
    var w = src.width, h = src.height, n = w * h, sd = src.getContext('2d').getImageData(0, 0, w, h).data, x, y, t;
    var rs = [], gs = [], bs = [];
    function samp(px, py) { var k = (py * w + px) * 4; rs.push(sd[k]); gs.push(sd[k + 1]); bs.push(sd[k + 2]); }
    for (x = 0; x < w; x += 2) for (t = 0; t < 3; t++) { samp(x, t); samp(x, h - 1 - t); }
    for (y = 0; y < h; y += 2) for (t = 0; t < 3; t++) { samp(t, y); samp(w - 1 - t, y); }
    function med(a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; }
    var br = med(rs), bg = med(gs), bb = med(bs), nb = [1, -1, w, -w];
    function cd(k, r, g, b) { var dr = sd[k] - r, dg = sd[k + 1] - g, db = sd[k + 2] - b; return Math.sqrt(dr * dr * .3 + dg * dg * .59 + db * db * .11); }
    function run(tol) {
      var bgm = new Uint8Array(n), q = new Int32Array(n), qh = 0, qt = 0, lim = tol * 2.2, drift = tol * 3.2, step = tol * .14;
      function seed(px, py) { var i = py * w + px; if (!bgm[i] && cd(i * 4, br, bg, bb) <= lim) { bgm[i] = 1; q[qt++] = i; } }
      for (x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
      for (y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
      while (qh < qt) {
        var i = q[qh++], ix = i % w;
        for (var d = 0; d < 4; d++) {
          var j = i + nb[d]; if (j < 0 || j >= n || (d === 0 && ix === w - 1) || (d === 1 && ix === 0) || bgm[j]) continue;
          var dBg = cd(j * 4, br, bg, bb);
          // фон = близький до кольору країв; плавний градієнт/тінь допускаємо лише дрібними кроками
          if (dBg <= lim || (dBg <= drift && cd(j * 4, sd[i * 4], sd[i * 4 + 1], sd[i * 4 + 2]) <= step)) { bgm[j] = 1; q[qt++] = j; }
        }
      }
      var lab = new Int32Array(n), best = 0, bestSize = 0, cur = 0;           // найбільша зв'язна область тварини
      for (var s0 = 0; s0 < n; s0++) {
        if (bgm[s0] || lab[s0]) continue;
        cur++; var size = 0, qa = [s0]; lab[s0] = cur;
        while (qa.length) {
          var a = qa.pop(), ax = a % w; size++;
          for (var e = 0; e < 4; e++) { var b2 = a + nb[e]; if (b2 < 0 || b2 >= n || (e === 0 && ax === w - 1) || (e === 1 && ax === 0) || bgm[b2] || lab[b2]) continue; lab[b2] = cur; qa.push(b2); }
        }
        if (size > bestSize) { bestSize = size; best = cur; }
      }
      return { lab: lab, best: best, cov: bestSize / n };
    }
    var tol = tol0, r = run(tol), tries = 0;
    if (mode === 'cov') return { coverage: r.cov };
    // автопідбір: надто мало → фон «з'їв» тварину (зменшуємо чутливість); майже все → фон не прибрався (збільшуємо)
    while (tries < 4 && (r.cov < 0.05 || r.cov > 0.93)) { tol = r.cov < 0.05 ? tol * 0.62 : tol * 1.45; r = run(tol); tries++; }
    var m = doc.createElement('canvas'); m.width = w; m.height = h; var mc = m.getContext('2d'), id = mc.createImageData(w, h);
    for (var p2 = 0; p2 < n; p2++) { id.data[p2 * 4] = id.data[p2 * 4 + 1] = id.data[p2 * 4 + 2] = 255; id.data[p2 * 4 + 3] = (r.lab[p2] === r.best && r.best) ? 255 : 0; }
    mc.putImageData(id, 0, 0);
    return { mask: m, coverage: r.cov, tol: tol };
  }
  // підбір чутливості: беремо ту, де форма найменше змінюється при сусідніх значеннях (стабільна ділянка)
  function bestTol(src) {
    var tols = [8, 12, 17, 24, 34, 48], cv = tols.map(function (tl) { return autoCut(src, tl, 'cov').coverage; }), best = -1, bs = 9;
    for (var i = 1; i < tols.length - 1; i++) {
      if (cv[i] < 0.04 || cv[i] > 0.92) continue;
      var s = Math.abs(cv[i] - cv[i - 1]) + Math.abs(cv[i + 1] - cv[i]); if (s < bs - 1e-9) { bs = s; best = i; }
    }
    return tols[best < 0 ? 2 : best];
  }
  function composite(src, mask) {
    var c = doc.createElement('canvas'); c.width = src.width; c.height = src.height; var x = c.getContext('2d');
    x.drawImage(src, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(mask, 0, 0); return c;
  }
  function cropScale(cut, maxSide) {                                  // обрізати по межах і зменшити
    var w = cut.width, h = cut.height, d = cut.getContext('2d').getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    var cw = x1 - x0 + 1, ch = y1 - y0 + 1, k = Math.min(1, maxSide / Math.max(cw, ch)), out = doc.createElement('canvas');
    out.width = Math.max(8, Math.round(cw * k)); out.height = Math.max(8, Math.round(ch * k));
    var o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(cut, x0, y0, cw, ch, 0, 0, out.width, out.height); return out;
  }

  /* ----------------------------------------------------------------- 3D «надувна» модель з вирізки */
  function buildModel(THREE, cut) {
    var cw = cut.width, ch = cut.height, gx = 56, gy = clamp(Math.round(gx * ch / cw), 10, 80);
    var img = cut.getContext('2d').getImageData(0, 0, cw, ch).data, mask = new Uint8Array(gx * gy), i, j;
    for (j = 0; j < gy; j++) for (i = 0; i < gx; i++) {
      var px = Math.min(cw - 1, Math.round(i / (gx - 1) * (cw - 1))), py = Math.min(ch - 1, Math.round(j / (gy - 1) * (ch - 1)));
      mask[j * gx + i] = img[(py * cw + px) * 4 + 3] > 128 ? 1 : 0;
    }
    var dist = new Float32Array(gx * gy), BIG = 1e6;
    for (j = 0; j < gy; j++) for (i = 0; i < gx; i++) dist[j * gx + i] = (mask[j * gx + i] && i > 0 && j > 0 && i < gx - 1 && j < gy - 1) ? BIG : 0;
    for (j = 1; j < gy - 1; j++) for (i = 1; i < gx - 1; i++) { var k = j * gx + i; if (dist[k]) dist[k] = Math.min(dist[k], dist[k - 1] + 1, dist[k - gx] + 1, dist[k - gx - 1] + 1.4, dist[k - gx + 1] + 1.4); }
    for (j = gy - 2; j > 0; j--) for (i = gx - 2; i > 0; i--) { var k2 = j * gx + i; if (dist[k2]) dist[k2] = Math.min(dist[k2], dist[k2 + 1] + 1, dist[k2 + gx] + 1, dist[k2 + gx + 1] + 1.4, dist[k2 + gx - 1] + 1.4); }
    var dmax = 1; for (i = 0; i < dist.length; i++) if (dist[i] < BIG && dist[i] > dmax) dmax = dist[i];
    var H = 1.7, W = H * cw / ch, depth = 0.34 * Math.min(W, H), hts = new Float32Array(gx * gy);
    for (i = 0; i < hts.length; i++) hts[i] = dist[i] >= BIG ? depth : Math.pow(dist[i] / dmax, 0.55) * depth;
    for (var pass = 0; pass < 2; pass++) {                                          // згладжування
      var cp = hts.slice();
      for (j = 1; j < gy - 1; j++) for (i = 1; i < gx - 1; i++) { var kk = j * gx + i; if (mask[kk]) hts[kk] = (cp[kk] * 4 + cp[kk - 1] + cp[kk + 1] + cp[kk - gx] + cp[kk + gx]) / 8; }
    }
    function geo(sign) {
      var pos = new Float32Array(gx * gy * 3), uv = new Float32Array(gx * gy * 2), idx = [];
      for (j = 0; j < gy; j++) for (i = 0; i < gx; i++) {
        var v = j * gx + i, u = i / (gx - 1), vv = j / (gy - 1);
        pos[v * 3] = (u - .5) * W; pos[v * 3 + 1] = (.5 - vv) * H; pos[v * 3 + 2] = sign * hts[v];
        uv[v * 2] = sign > 0 ? u : 1 - u; uv[v * 2 + 1] = 1 - vv;
      }
      for (j = 0; j < gy - 1; j++) for (i = 0; i < gx - 1; i++) {
        var a = j * gx + i, b = a + 1, c = a + gx, d = c + 1;
        if (!(mask[a] || mask[b] || mask[c] || mask[d])) continue;
        if (sign > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    var tex = new THREE.CanvasTexture(cut); tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    var mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.4, side: THREE.DoubleSide });
    var grp = new THREE.Group(); grp.add(new THREE.Mesh(geo(1), mat)); grp.add(new THREE.Mesh(geo(-1), mat));
    return { group: grp, dispose: function () { try { tex.dispose(); mat.dispose(); grp.children.forEach(function (m) { m.geometry.dispose(); }); } catch (e) {} } };
  }
  function makeStage(THREE, canvas, px) {                                         // рендерер + сцена + камера
    var r = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !lite(), powerPreference: 'low-power' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite() ? 1.25 : 2)); r.setSize(px, px, false); r.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) r.outputEncoding = THREE.sRGBEncoding;
    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50); cam.position.set(0, 0.1, 6.2); cam.lookAt(0, 0, 0);
    sc.add(new THREE.AmbientLight(0xffffff, 0.95)); var dl = new THREE.DirectionalLight(0xffffff, 0.75); dl.position.set(-2, 3, 4); sc.add(dl);
    return { r: r, sc: sc, cam: cam };
  }

  /* ----------------------------------------------------------------- АКТОР (улюбленець на екрані) */
  var A = { el: null, st: null, model: null, raf: 0, x: 40, dir: 1, yaw: 0.9, phase: 0, state: 'walk', until: 0, jump: 0, spin: 0, nextTalk: 0, nextTap: 0, mood: 40, last: 0, flat: false, size: 150, bubbleT: 0, lastPat: 0, THREE: null, ready: false, token: 0 };
  function sizePx() { var base = { s: 105, m: 145, l: 195 }[P.size] || 145; return Math.round(base * (body.classList.contains('mobile-version') || window.innerWidth < 600 ? .78 : 1)); }
  function destroyActor() {
    cancelAnimationFrame(A.raf); A.raf = 0; A.ready = false;
    try { if (A.model) A.model.dispose(); } catch (e) {} A.model = null;
    try { if (A.st) A.st.r.dispose(); } catch (e) {} A.st = null;
    if (A.el) { A.el.remove(); A.el = null; }
  }
  function img2canvas(url) {
    return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { var c = doc.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); res(c); }; im.onerror = rej; im.src = url; });
  }
  function spawn() {
    destroyActor(); var token = ++A.token;
    if (!P.owned || !P.photo || P.hidden || !gameReady()) return;
    A.size = sizePx(); A.x = clamp(A.x, 6, Math.max(6, window.innerWidth - A.size - 6));
    var el = doc.createElement('div'); el.id = 'fxPet'; el.style.width = A.size + 'px'; el.style.height = A.size + 'px';
    el.innerHTML = '<div class="pet-shadow"></div><div class="pet-say"></div><canvas class="pet-cv"></canvas>';
    body.appendChild(el); A.el = el; el.style.transform = 'translate3d(' + A.x + 'px,0,0)';
    el.addEventListener('pointerdown', function (e) { e.preventDefault(); pat(e); });
    img2canvas(P.photo).then(function (cut) {
      return loadThree().then(function (THREE) { A.THREE = THREE; return { THREE: THREE, cut: cut }; }, function () { return { THREE: null, cut: cut }; });
    }).then(function (o) {
      if (!A.el || token !== A.token) return;
      var cv = A.el.querySelector('.pet-cv');
      try {
        if (!o.THREE) throw new Error('no three');
        A.st = makeStage(o.THREE, cv, A.size); A.model = buildModel(o.THREE, o.cut); A.st.sc.add(A.model.group); A.flat = false;
      } catch (e) {                                                                   // запасний варіант без WebGL
        A.flat = true; A.st = null; cv.replaceWith(Object.assign(doc.createElement('img'), { src: P.photo, className: 'pet-flat', alt: '' }));
      }
      A.ready = true; var n = performance.now(); A.last = n; A.nextTalk = n + rnd(4000, 9000); A.nextTap = n + 3000; A.until = n + rnd(3000, 6000);
      tick(n);
    });
  }
  function say(text, ms) {
    if (!A.el) return; var b = A.el.querySelector('.pet-say'); b.textContent = text; b.classList.add('on'); clearTimeout(A.bubbleT);
    A.bubbleT = setTimeout(function () { b && b.classList.remove('on'); }, ms || 2600);
    b.style.marginLeft = '0px';
    requestAnimationFrame(function () {                         // не вилазити за краї екрана
      var r = b.getBoundingClientRect(), vw = window.innerWidth, sh = r.left < 6 ? 6 - r.left : (r.right > vw - 6 ? vw - 6 - r.right : 0);
      b.style.marginLeft = sh + 'px';
    });
  }
  function voice() {
    var text = P.text || '', mode = P.mode, pr = PRESETS[P.preset] || PRESETS.custom;
    say(text, 2800);
    var SS = window.__fxSnd; var allowed = !SS || (SS.enabled && SS.enabled());
    if (!allowed) return;
    if (mode === 'audio' && P.audio) { try { var a = new Audio(P.audio); a.volume = .85; a.play().catch(function () {}); return; } catch (e) {} }
    if (mode === 'speech' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.lang = 'uk-UA'; u.pitch = 1.7; u.rate = 1.1; u.volume = .9;
        var vs = window.speechSynthesis.getVoices(); var v = vs.filter(function (x) { return /^uk/i.test(x.lang); })[0]; if (v) u.voice = v; window.speechSynthesis.speak(u); return;
      } catch (e) {}
    }
    snd(pr.snd, { n: 2 });
  }
  function pat(e) {
    var n = performance.now(); if (n - A.lastPat < 350) return; A.lastPat = n;
    A.mood = Math.min(100, A.mood + 14); A.jump = 1; A.spin = 1; P.taps++; vib(10);
    var r = A.el.getBoundingClientRect(); FX().emoji && FX().emoji(r.left + r.width / 2, r.top + r.height * .25, ['❤️', '💖', '✨'], 3, { g: -.03, decay: .015 });
    snd('pop'); if (Math.random() < .5) voice();
  }
  function tapClock() {
    var wr = $('clockWrapper'), ck = $('clickableClock'); if (!wr || !ck || !ck.offsetParent) return;
    if (body.classList.contains('fx-overlay') || doc.hidden) return;
    var r = ck.getBoundingClientRect(), x = r.left + r.width / 2 + rnd(-r.width * .15, r.width * .15), y = r.top + r.height / 2 + rnd(-r.height * .15, r.height * .15);
    try { wr.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y, view: window })); } catch (e) {}
    FX().emoji && FX().emoji(x, y, ['🐾'], 1, { g: -.02, decay: .025, size: 3.2 });
    A.jump = .7;
  }
  function tick(n) {
    A.raf = requestAnimationFrame(tick);
    if (!A.el || !A.ready) return;
    if (doc.hidden) { A.last = n; return; }
    var gap = lite() ? 42 : 30; if (n - A.last < gap) return;
    var dt = Math.min(0.12, (n - A.last) / 1000); A.last = n;
    var vw = window.innerWidth, maxX = Math.max(6, vw - A.size - 6);
    A.mood = Math.max(0, A.mood - dt * 0.4);                                         // настрій згасає
    if (n > A.until) {
      if (A.state === 'walk') { A.state = 'idle'; A.until = n + rnd(1500, 4000); }
      else { A.state = 'walk'; A.dir = Math.random() < .5 ? -1 : 1; A.until = n + rnd(4000, 9000); }
    }
    if (A.state === 'walk') {
      A.x += A.dir * 46 * dt * (A.size / 150 + .3); A.phase += dt * 9;
      if (A.x < 6) { A.x = 6; A.dir = 1; } else if (A.x > maxX) { A.x = maxX; A.dir = -1; }
    } else A.phase += dt * 2.2;
    if (n > A.nextTalk) { A.nextTalk = n + (P.period || 30) * 1000 * rnd(.75, 1.25); A.state = 'idle'; A.until = n + 2600; voice(); }
    if (n > A.nextTap) { A.nextTap = n + (3000 - 1500 * (A.mood / 100)); tapClock(); P.taps++; }     // тапи (швидше, коли радіє)
    A.el.style.transform = 'translate3d(' + A.x.toFixed(1) + 'px,0,0)';
    var talking = n < A.until && A.state === 'idle', targetYaw = A.state === 'walk' ? A.dir * 0.95 : (talking ? 0 : Math.sin(n / 900) * .35);
    A.yaw += (targetYaw - A.yaw) * Math.min(1, dt * 7);
    A.jump = Math.max(0, A.jump - dt * 2.4); A.spin = Math.max(0, A.spin - dt * 1.8);
    var hop = Math.sin((1 - A.jump) * Math.PI) * (A.jump > 0 ? 1 : 0) * .45, walk = A.state === 'walk';
    var bob = walk ? Math.abs(Math.sin(A.phase)) * .1 : Math.sin(A.phase) * .02, roll = walk ? Math.sin(A.phase) * .12 : 0;
    var sq = walk ? 1 + Math.sin(A.phase * 2) * .035 : 1 + Math.sin(A.phase) * .018;
    if (A.flat) { A.el.querySelector('.pet-flat').style.transform = 'translateY(' + (-(bob + hop) * 60) + 'px) rotate(' + (roll * 40) + 'deg) scaleX(' + (A.dir > 0 && walk ? 1 : walk ? -1 : 1) + ')'; return; }
    var g = A.model.group; g.rotation.y = A.yaw + A.spin * Math.PI * 2; g.rotation.z = roll; g.position.y = bob + hop; g.scale.set(1 / sq, sq, 1 / sq);
    A.st.r.render(A.st.sc, A.st.cam);
  }

  /* ----------------------------------------------------------------- СТУДІЯ */
  var S = null;
  function studio() {
    var old = $('fxPetStudio'); if (old) old.remove();
    var o = doc.createElement('div'); o.id = 'fxPetStudio'; o.className = 'fx-modal';
    o.innerHTML = '<div class="fx-modal-card pet-studio"><button class="fx-x" type="button" aria-label="Закрити">\u00D7</button>' +
      '<h3>🐾 ' + tt('Створи свого улюбленця') + '</h3>' +
      '<div class="ps-step" data-s="1"><p class="ps-hint">' + tt('Обери фото тварини. Найкраще — на однотонному фоні (стіна, диван, підлога).') + '</p>' +
      '<label class="fx-btn ps-pick">📷 ' + tt('Обрати фото') + '<input id="psFile" type="file" accept="image/*" hidden></label></div>' +
      '<div class="ps-step" data-s="2" hidden><p class="ps-hint">' + tt('Прибрали фон автоматично. Підправ пензликом: «Стерти» зайве, «Повернути» — втрачене.') + '</p>' +
      '<canvas id="psView" class="ps-view"></canvas>' +
      '<div class="ps-tools"><label>' + tt('Чутливість фону') + '<input id="psTol" type="range" min="6" max="70" value="30"></label>' +
      '<label>' + tt('Пензлик') + '<input id="psBrush" type="range" min="4" max="40" value="16"></label></div>' +
      '<div class="fx-row"><button class="fx-btn ghost sm" data-t="auto" type="button">🪄 ' + tt('Авто') + '</button><button class="fx-btn ghost sm on" data-t="erase" type="button">🧽 ' + tt('Стерти') + '</button>' +
      '<button class="fx-btn ghost sm" data-t="restore" type="button">🖌 ' + tt('Повернути') + '</button></div>' +
      '<div class="fx-row"><button class="fx-btn ghost" data-a="back1" type="button">←</button><button class="fx-btn" data-a="to3" type="button">' + tt('Створити 3D') + ' →</button></div></div>' +
      '<div class="ps-step" data-s="3" hidden><div class="ps-prev"><canvas id="psPrev"></canvas></div>' +
      '<div class="ps-form"><label>' + tt('Ім\u2019я') + '<input id="psName" type="text" maxlength="20"></label>' +
      '<label>' + tt('Хто це?') + '<select id="psPreset">' + Object.keys(PRESETS).map(function (k) { return '<option value="' + k + '">' + PRESETS[k].n + '</option>'; }).join('') + '</select></label>' +
      '<label>' + tt('Що каже') + '<input id="psText" type="text" maxlength="40"></label>' +
      '<label>' + tt('Як звучить') + '<select id="psMode"><option value="synth">' + tt('Звук тварини') + '</option><option value="speech">' + tt('Озвучити текст голосом') + '</option><option value="audio">' + tt('Мій аудіофайл') + '</option></select></label>' +
      '<label id="psAudioRow" hidden>' + tt('Аудіофайл') + '<input id="psAudio" type="file" accept="audio/*"></label>' +
      '<label>' + tt('Як часто (сек)') + ' <b id="psPerV">30</b><input id="psPeriod" type="range" min="8" max="120" value="30"></label>' +
      '<label>' + tt('Розмір') + '<select id="psSize"><option value="s">S</option><option value="m">M</option><option value="l">L</option></select></label></div>' +
      '<div class="fx-row"><button class="fx-btn ghost sm" data-a="test" type="button">🔊 ' + tt('Послухати') + '</button><button class="fx-btn ghost sm" data-a="spin" type="button">🔄 ' + tt('Крутити') + '</button></div>' +
      '<div class="fx-row"><button class="fx-btn ghost" data-a="back2" type="button">←</button><button class="fx-btn" data-a="save" type="button">✅ ' + tt('Зберегти улюбленця') + '</button></div></div></div>';
    body.appendChild(o); requestAnimationFrame(function () { o.classList.add('in'); });
    S = { o: o, src: null, mask: null, cut: null, tool: 'erase', down: false, prev: null, audio: P.audio };
    function step(n) { [].forEach.call(o.querySelectorAll('.ps-step'), function (s) { s.hidden = s.dataset.s !== String(n); }); }
    function close() { stopPrev(); o.classList.remove('in'); setTimeout(function () { o.remove(); }, 300); S = null; }
    o.querySelector('.fx-x').addEventListener('click', close);
    var view = o.querySelector('#psView'), vctx = view.getContext('2d');
    function redraw() {
      if (!S || !S.src) return; var w = S.src.width, h = S.src.height; view.width = w; view.height = h;
      var cs = 14; for (var y = 0; y < h; y += cs) for (var x = 0; x < w; x += cs) { vctx.fillStyle = ((x / cs + y / cs) & 1) ? '#2a3050' : '#1b2038'; vctx.fillRect(x, y, cs, cs); }
      vctx.drawImage(composite(S.src, S.mask), 0, 0);
    }
    function runAuto(fresh) {
      var sl = o.querySelector('#psTol'); if (fresh === true) sl.value = bestTol(S.src);
      var r = autoCut(S.src, +sl.value); S.mask = r.mask; redraw();
    }
    o.querySelector('#psFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var url = URL.createObjectURL(f), im = new Image();
      im.onload = function () {
        var k = Math.min(1, 360 / Math.max(im.width, im.height)), c = doc.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); S.src = c; runAuto(true); step(2);
      };
      im.onerror = function () { try { showToast(tt('Не вдалося прочитати фото')); } catch (er) {} }; im.src = url;
    });
    var tolT = 0; o.querySelector('#psTol').addEventListener('input', function () { clearTimeout(tolT); tolT = setTimeout(function () { if (S && S.src) runAuto(); }, 120); });
    [].forEach.call(o.querySelectorAll('[data-t]'), function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.t === 'auto') { runAuto(true); return; }
        S.tool = b.dataset.t; [].forEach.call(o.querySelectorAll('[data-t]'), function (x) { x.classList.toggle('on', x === b); });
      });
    });
    function paint(e) {
      var r = view.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * view.width, y = (e.clientY - r.top) / r.height * view.height, br = +o.querySelector('#psBrush').value * (view.width / r.width);
      var m = S.mask.getContext('2d'); m.globalCompositeOperation = S.tool === 'erase' ? 'destination-out' : 'source-over'; m.fillStyle = '#fff'; m.beginPath(); m.arc(x, y, br, 0, 7); m.fill(); m.globalCompositeOperation = 'source-over';
      if (!paint.q) paint.q = requestAnimationFrame(function () { paint.q = 0; redraw(); });
    }
    view.addEventListener('pointerdown', function (e) { if (!S || !S.mask) return; S.down = true; view.setPointerCapture && view.setPointerCapture(e.pointerId); paint(e); });
    view.addEventListener('pointermove', function (e) { if (S && S.down) paint(e); });
    view.addEventListener('pointerup', function () { if (S) S.down = false; });
    view.addEventListener('pointercancel', function () { if (S) S.down = false; });
    // крок 3
    var preset = o.querySelector('#psPreset'), mode = o.querySelector('#psMode'), text = o.querySelector('#psText'), period = o.querySelector('#psPeriod');
    o.querySelector('#psName').value = P.name; preset.value = P.preset; text.value = P.text; mode.value = P.mode; period.value = P.period; o.querySelector('#psSize').value = P.size; o.querySelector('#psPerV').textContent = P.period;
    o.querySelector('#psAudioRow').hidden = P.mode !== 'audio';
    preset.addEventListener('change', function () { text.value = PRESETS[preset.value].text; });
    mode.addEventListener('change', function () { o.querySelector('#psAudioRow').hidden = mode.value !== 'audio'; });
    period.addEventListener('input', function () { o.querySelector('#psPerV').textContent = period.value; });
    o.querySelector('#psAudio').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      if (f.size > 420000) { try { showToast(tt('Аудіо завелике (до ~400 КБ)')); } catch (er) {} return; }
      var fr = new FileReader(); fr.onload = function () { S.audio = fr.result; }; fr.readAsDataURL(f);
    });
    o.querySelector('[data-a="back1"]').addEventListener('click', function () { step(1); });
    o.querySelector('[data-a="back2"]').addEventListener('click', function () { stopPrev(); step(2); });
    o.querySelector('[data-a="to3"]').addEventListener('click', function () {
      var cut = cropScale(composite(S.src, S.mask), 256); if (!cut) { try { showToast(tt('Спершу залиш на фото тварину')); } catch (er) {} return; }
      S.cut = cut; step(3); startPrev();
    });
    o.querySelector('[data-a="spin"]').addEventListener('click', function () { if (S.prev) S.prev.spin = 1; });
    o.querySelector('[data-a="test"]').addEventListener('click', function () {
      var m = mode.value, tx = text.value, pr = PRESETS[preset.value] || PRESETS.custom;
      if (m === 'audio' && S.audio) { try { new Audio(S.audio).play(); return; } catch (e) {} }
      if (m === 'speech' && 'speechSynthesis' in window) { try { window.speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(tx); u.lang = 'uk-UA'; u.pitch = 1.7; u.rate = 1.1; window.speechSynthesis.speak(u); return; } catch (e) {} }
      snd(pr.snd, { n: 2 });
    });
    o.querySelector('[data-a="save"]').addEventListener('click', function () {
      P.photo = S.cut.toDataURL('image/png'); P.name = o.querySelector('#psName').value.trim() || tt('Улюбленець'); P.preset = preset.value; P.text = text.value.trim() || PRESETS[preset.value].text;
      P.mode = mode.value; P.audio = (mode.value === 'audio') ? S.audio : P.audio; P.period = +period.value; P.size = o.querySelector('#psSize').value; P.hidden = false; save();
      close(); spawn(); renderCard(); try { showToast('🐾 ' + P.name + ' ' + tt('тепер з тобою!')); } catch (e) {} vib([20, 30, 60]); snd('claim');
    });
    function startPrev() {
      var cv = o.querySelector('#psPrev'); cv.width = cv.height = 240;
      loadThree().then(function (THREE) {
        if (!S || !S.cut) return; var st = makeStage(THREE, cv, 240), m = buildModel(THREE, S.cut); st.sc.add(m.group);
        var P2 = { st: st, m: m, spin: 0, raf: 0, t0: performance.now() }; S.prev = P2;
        (function loop(n) { P2.raf = requestAnimationFrame(loop); P2.spin = Math.max(0, P2.spin - .02); m.group.rotation.y = (n - P2.t0) / 1400 + P2.spin * Math.PI * 2; m.group.position.y = Math.sin(n / 500) * .04; st.r.render(st.sc, st.cam); })(performance.now());
      }, function () { var im = new Image(); im.src = S.cut.toDataURL(); im.className = 'pet-flat spin'; cv.replaceWith(im); });
    }
    function stopPrev() { if (S && S.prev) { cancelAnimationFrame(S.prev.raf); try { S.prev.m.dispose(); S.prev.st.r.dispose(); } catch (e) {} S.prev = null; } }
    step(1);
  }

  /* ----------------------------------------------------------------- КАРТКА В «МНОЖНИКАХ» */
  function price() { try { var b = window.__fxFeatures ? window.__fxFeatures.base() : 5000; return Math.max(30000, Math.round(b * 12)); } catch (e) { return 60000; } }
  function renderCard() {
    var host = $('fxPetCard'); if (!host) return;
    var p = price(), can = false; try { can = score >= p; } catch (e) {}
    var thumb = P.photo ? '<img class="pc-th" alt="" src="' + P.photo + '">' : '<span class="pc-ic">🐾</span>';
    var h = '<div class="pc-top">' + thumb + '<div><b>' + (P.owned ? esc(P.name) : '🐾 ' + tt('Домашній улюбленець')) + '</b><small>' + (P.owned
      ? tt('Тапає по годиннику й радіє, коли його гладиш') + ' · ' + tt('Настрій') + ' ' + Math.round(A.mood) + '%'
      : tt('Одноразова покупка: загрузи фото — отримаєш 3D-улюбленця, який ходить, говорить і клікає за тебе. Зникає після Перезапуску.')) + '</small></div></div>';
    if (!P.owned) h += '<button class="fx-btn" id="pcBuy" type="button"' + (can ? '' : ' disabled') + '>' + tt('Купити') + ' · ' + esc(fmt(p)) + '</button>' + (P.photo ? '<small class="pc-note">' + tt('Збережений улюбленець повернеться після покупки') + '</small>' : '');
    else h += '<div class="fx-row"><button class="fx-btn sm" id="pcEdit" type="button">✏️ ' + tt('Створити / змінити') + '</button><button class="fx-btn ghost sm" id="pcHide" type="button">' + (P.hidden ? '👁 ' + tt('Показати') : '🙈 ' + tt('Сховати')) + '</button>' +
      '<button class="fx-btn ghost sm" id="pcTalk" type="button">🔊</button></div>';
    host.innerHTML = h;
    var b = $('pcBuy'); if (b) b.addEventListener('click', buy);
    var e = $('pcEdit'); if (e) e.addEventListener('click', studio);
    var hd = $('pcHide'); if (hd) hd.addEventListener('click', function () { P.hidden = !P.hidden; save(); if (P.hidden) destroyActor(); else spawn(); renderCard(); });
    var tk = $('pcTalk'); if (tk) tk.addEventListener('click', function () { if (A.el) voice(); else snd((PRESETS[P.preset] || PRESETS.custom).snd, { n: 2 }); });
  }
  function buy() {
    var p = price(); try { if (score < p) return; score -= p; updateScore(); } catch (e) { return; }
    P.owned = true; P.hidden = false; save(); renderCard(); try { saveGame(); } catch (e) {}
    try { showToast('🐾 ' + tt('Улюбленця куплено!')); } catch (e) {} snd('claim'); vib([20, 30, 60]);
    if (P.photo) spawn(); else studio();
  }
  function release() {                                 // Реверб: улюбленець зникає, налаштування лишаються
    P.owned = false; save(); destroyActor(); renderCard();
  }
  function buildCard() {
    var tab = $('tab-multipliers'), list = $('multipliers'); if (!tab || !list || $('fxPetCard')) return;
    var host = doc.createElement('div'); host.id = 'fxPetCard'; host.className = 'pet-card'; list.parentNode.insertBefore(host, list); renderCard();
  }

  /* ----------------------------------------------------------------- старт та хуки */
  function start() {
    if (!gameReady()) return false;
    buildCard();
    if (typeof window.completeReverb === 'function') {
      var oc = window.completeReverb; window.completeReverb = function () { var r = oc.apply(this, arguments); setTimeout(release, 300); return r; };
    }
    if (typeof window.resetProgress === 'function') {
      var orp = window.resetProgress; window.resetProgress = function () {
        var r = orp.apply(this, arguments);
        try { if (!localStorage.getItem('timeClickerSave') && !localStorage.getItem('timeClickerSaveData')) { localStorage.removeItem('fxPet'); P = defaults(); destroyActor(); renderCard(); } } catch (e) {}
        return r;
      };
    }
    if (P.owned && P.photo && !P.hidden) setTimeout(spawn, 1200);
    setInterval(function () { var tb = $('tab-multipliers'); if (tb && tb.classList.contains('active') && !doc.hidden) renderCard(); }, 1000);
    setInterval(function () { if (P.owned) save(); }, 20000);
    window.addEventListener('resize', function () { if (A.el) { var s = sizePx(); if (s !== A.size) spawn(); } });
    window.addEventListener('pagehide', save);
    window.__fxPet = { P: function () { return P; }, A: A, spawn: spawn, buy: buy, release: release, studio: studio, voice: voice, price: price, buildModel: buildModel, autoCut: autoCut, bestTol: bestTol };
    return true;
  }
  var tries = 0, iv = setInterval(function () { tries++; if (start() || tries > 60) clearInterval(iv); }, 300);
})();
