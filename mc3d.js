/* mc3d.js v3 — «Minecraft-пісочниця»: 3D-світ із блоків (власні текстури, намальовані кодом).
   Замінює стару міні-гру «Кубічне Бінго» (апгрейд №12). Three.js вантажиться лише при запуску.
   Це НЕ Minecraft: окрема невелика гра в схожому жанрі (вокселі, добування, будівництво, день/ніч). */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  function $(i) { return doc.getElementById(i); }
  function tt(k) { try { return typeof t === 'function' ? t(k) : k; } catch (e) { return k; } }
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var FX = function () { return window.__fx || {}; };
  function vib(p) { try { FX().vib && FX().vib(p); } catch (e) {} }
  function lite() { try { return FX().lite(); } catch (e) { return false; } }

  /* ----------------------------------------------------------------- Three.js (локально → CDN) */
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

  /* ----------------------------------------------------------------- блоки */
  var CH = 16, HT = 48, SEA = 15;
  var B = {
    1: { n: 'Трава', t: [0, 1, 2], h: .6, drop: 2 }, 2: { n: 'Земля', t: [2], h: .5 }, 3: { n: 'Камінь', t: [3], h: 1.5, drop: 8 }, 4: { n: 'Пісок', t: [4], h: .5 },
    5: { n: 'Колода', t: [6, 5, 6], h: 1.1 }, 6: { n: 'Листя', t: [7], h: .2, tr: 1, drop: 0 }, 7: { n: 'Дошки', t: [8], h: .8 }, 8: { n: 'Бруківка', t: [9], h: 1.3 },
    9: { n: 'Вугілля', t: [10], h: 1.7, drop: 9 }, 10: { n: 'Залізо', t: [11], h: 2.1 }, 11: { n: 'Алмаз', t: [12], h: 2.7 }, 12: { n: 'Вода', t: [13], h: 0, tr: 1, liquid: 1 },
    13: { n: 'Скло', t: [15], h: .3, tr: 1 }, 14: { n: 'Бедрок', t: [14], h: 0 }
  };
  var RECIPES = [
    { n: 'Колода → 4 дошки', need: { 5: 1 }, give: { 7: 4 } },
    { n: '2 піску → 2 скла', need: { 4: 2 }, give: { 13: 2 } },
    { n: '2 бруківки → 2 каменя', need: { 8: 2 }, give: { 3: 2 } }
  ];
  var QUEST = [[5, 6, 'Колод'], [8, 10, 'Бруківки'], [9, 1, 'Вугілля'], [10, 1, 'Заліза'], [11, 1, 'Алмаз']];

  /* ----------------------------------------------------------------- шум */
  function hash(x, y, z, s) { var h = (x * 374761393 + y * 668265263 + z * 1274126177 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vn2(x, z, s) { var xi = Math.floor(x), zi = Math.floor(z), u = sm(x - xi), v = sm(z - zi), a = hash(xi, 0, zi, s), b = hash(xi + 1, 0, zi, s), c = hash(xi, 0, zi + 1, s), d = hash(xi + 1, 0, zi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function vn3(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sm(x - xi), v = sm(y - yi), w = sm(z - zi);
    function h(a, b, c) { return hash(xi + a, yi + b, zi + c, s); }
    var x00 = h(0, 0, 0) + (h(1, 0, 0) - h(0, 0, 0)) * u, x10 = h(0, 1, 0) + (h(1, 1, 0) - h(0, 1, 0)) * u, x01 = h(0, 0, 1) + (h(1, 0, 1) - h(0, 0, 1)) * u, x11 = h(0, 1, 1) + (h(1, 1, 1) - h(0, 1, 1)) * u;
    var y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v; return y0 + (y1 - y0) * w;
  }
  function fbm(x, z, s) { var a = 1, f = 1, sum = 0, n = 0; for (var i = 0; i < 4; i++) { sum += vn2(x * f, z * f, s + i) * a; n += a; a *= .5; f *= 2; } return sum / n; }

  /* ----------------------------------------------------------------- текстури (атлас 8×4, тайл 16 px) */
  function makeAtlas() {
    var c = doc.createElement('canvas'); c.width = 128; c.height = 64; var x = c.getContext('2d'), seed = 7;
    function R(i) { return hash(i, seed, 3, 11); }
    function tile(i, base, vary, fn) {
      var ox = (i % 8) * 16, oy = Math.floor(i / 8) * 16;
      for (var py = 0; py < 16; py++) for (var px = 0; px < 16; px++) {
        var k = (R(i * 256 + py * 16 + px) - .5) * vary, col = base.map(function (v) { return Math.max(0, Math.min(255, Math.round(v + k))); });
        x.fillStyle = 'rgb(' + col.join(',') + ')'; x.fillRect(ox + px, oy + py, 1, 1);
      }
      if (fn) fn(ox, oy);
    }
    function dots(ox, oy, col, n, sd) { x.fillStyle = col; for (var k = 0; k < n; k++) { var px = Math.floor(hash(k, sd, 1, 5) * 14) + 1, py = Math.floor(hash(k, sd, 2, 5) * 14) + 1; x.fillRect(ox + px, oy + py, 2, 2); } }
    tile(0, [92, 160, 62], 30);                                                                     // трава (верх)
    tile(1, [134, 96, 62], 28, function (ox, oy) { x.fillStyle = 'rgb(92,160,62)'; x.fillRect(ox, oy, 16, 4); for (var i = 0; i < 16; i++) if (R(900 + i) > .5) x.fillRect(ox + i, oy + 4, 1, 2); });   // трава (бік)
    tile(2, [134, 96, 62], 28);                                                                     // земля
    tile(3, [128, 128, 128], 26);                                                                   // камінь
    tile(4, [219, 207, 142], 20);                                                                   // пісок
    tile(5, [102, 78, 46], 22, function (ox, oy) { x.fillStyle = 'rgba(40,28,14,.45)'; for (var i = 0; i < 16; i += 4) x.fillRect(ox + i, oy, 1, 16); });   // колода (бік)
    tile(6, [160, 128, 80], 18, function (ox, oy) { x.strokeStyle = 'rgba(70,50,24,.6)'; x.strokeRect(ox + 2, oy + 2, 12, 12); x.strokeRect(ox + 5, oy + 5, 6, 6); });  // колода (торець)
    tile(7, [60, 130, 50], 40, function (ox, oy) { x.clearRect(ox + 3, oy + 3, 3, 3); x.clearRect(ox + 10, oy + 8, 3, 3); x.clearRect(ox + 6, oy + 12, 2, 2); });      // листя (з дірками)
    tile(8, [176, 140, 84], 16, function (ox, oy) { x.fillStyle = 'rgba(70,46,20,.5)'; for (var i = 3; i < 16; i += 4) x.fillRect(ox, oy + i, 16, 1); });             // дошки
    tile(9, [118, 118, 118], 34, function (ox, oy) { x.strokeStyle = 'rgba(40,40,40,.7)'; for (var i = 0; i < 16; i += 5) x.strokeRect(ox + (i * 3) % 12, oy + i, 6, 5); }); // бруківка
    tile(10, [128, 128, 128], 26, function (ox, oy) { dots(ox, oy, '#1c1c1c', 6, 21); });          // вугілля
    tile(11, [128, 128, 128], 26, function (ox, oy) { dots(ox, oy, '#d8a47a', 6, 22); });          // залізо
    tile(12, [128, 128, 128], 26, function (ox, oy) { dots(ox, oy, '#4fe3e0', 6, 23); });          // алмаз
    tile(13, [52, 108, 220], 16);                                                                   // вода
    tile(14, [40, 40, 40], 30);                                                                     // бедрок
    tile(15, [200, 230, 240], 6, function (ox, oy) { x.clearRect(ox + 1, oy + 1, 14, 14); x.fillStyle = 'rgba(190,225,240,.28)'; x.fillRect(ox + 1, oy + 1, 14, 14); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(ox + 3, oy + 3, 3, 1); });  // скло
    return c;
  }

  /* ----------------------------------------------------------------- гра */
  var M = null;
  var save = ls('fxMc', { seed: (Math.random() * 1e6) | 0, edits: {}, inv: { 7: 12 }, pos: null, got: {}, done: false });
  function persist() {
    if (!M) return; save.inv = M.inv; save.got = M.got; save.done = M.done; save.pos = [M.px, M.py, M.pz, M.yaw, M.pitch];
    if (!lsSet('fxMc', save)) { save.edits = {}; lsSet('fxMc', save); }
  }
  function height(gx, gz, s) { return Math.floor(10 + fbm(gx / 48, gz / 48, s) * 22); }
  function treeAt(gx, gz, s) {
    if (hash(gx, 0, gz, s + 3) > 0.011) return 0; var h = height(gx, gz, s); if (h <= SEA + 1) return 0; return 4 + Math.floor(hash(gx, 1, gz, s + 4) * 2);
  }
  function genChunk(cx, cz) {
    var s = save.seed, d = new Uint8Array(CH * HT * CH), x, z, y;
    function set(lx, ly, lz, id) { if (lx >= 0 && lx < CH && lz >= 0 && lz < CH && ly >= 0 && ly < HT) d[lx + CH * (lz + CH * ly)] = id; }
    for (z = 0; z < CH; z++) for (x = 0; x < CH; x++) {
      var gx = cx * CH + x, gz = cz * CH + z, h = Math.min(HT - 8, height(gx, gz, s));
      for (y = 0; y <= h; y++) {
        var id;
        if (y === 0) id = 14;
        else if (y === h) id = h <= SEA + 1 ? 4 : 1;
        else if (y >= h - 3) id = h <= SEA + 1 ? 4 : 2;
        else {
          id = 3; var r = hash(gx, y, gz, s + 7);
          if (y < 30 && r < 0.012) id = 9; else if (y < 20 && r > .5 && r < .5 + 0.007) id = 10; else if (y < 10 && r > .8 && r < .8 + 0.0016) id = 11;
          if (y > 3 && y < h - 2 && vn3(gx / 9, y / 7, gz / 9, s + 9) > 0.74) id = 0;
        }
        d[x + CH * (z + CH * y)] = id;
      }
      for (y = h + 1; y <= SEA; y++) d[x + CH * (z + CH * y)] = 12;
    }
    for (z = -2; z < CH + 2; z++) for (x = -2; x < CH + 2; x++) {          // дерева (включно із сусідніх колонок)
      var tg = treeAt(cx * CH + x, cz * CH + z, s); if (!tg) continue;
      var th = height(cx * CH + x, cz * CH + z, s);
      for (y = 1; y <= tg; y++) set(x, th + y, z, 5);
      for (var ly = tg - 2; ly <= tg + 1; ly++) { var rr = ly >= tg ? 1 : 2; for (var dz = -rr; dz <= rr; dz++) for (var dx = -rr; dx <= rr; dx++) { if (Math.abs(dx) === rr && Math.abs(dz) === rr && hash(dx, ly, dz, s) > .5) continue; var cur = (x + dx >= 0 && x + dx < CH && z + dz >= 0 && z + dz < CH) ? d[(x + dx) + CH * ((z + dz) + CH * (th + ly))] : 1; if (cur === 0) set(x + dx, th + ly, z + dz, 6); } }
      set(x, th + tg + 1, z, 6);
    }
    var ed = save.edits[cx + ',' + cz];
    if (ed) ed.split(',').forEach(function (e) { var p = e.split(':'); d[+p[0]] = +p[1]; });
    return d;
  }
  function getB(gx, gy, gz) {
    if (gy < 0) return 14; if (gy >= HT) return 0;
    var cx = Math.floor(gx / CH), cz = Math.floor(gz / CH), c = M.chunks[cx + ',' + cz]; if (!c) return 3;
    return c.d[(gx - cx * CH) + CH * ((gz - cz * CH) + CH * gy)];
  }
  function setB(gx, gy, gz, id) {
    var cx = Math.floor(gx / CH), cz = Math.floor(gz / CH), k = cx + ',' + cz, c = M.chunks[k]; if (!c || gy < 0 || gy >= HT) return;
    var lx = gx - cx * CH, lz = gz - cz * CH, idx = lx + CH * (lz + CH * gy); c.d[idx] = id; c.dirty = true;
    save.edits[k] = (save.edits[k] ? save.edits[k] + ',' : '') + idx + ':' + id;
    if (lx === 0) mark(cx - 1, cz); if (lx === CH - 1) mark(cx + 1, cz); if (lz === 0) mark(cx, cz - 1); if (lz === CH - 1) mark(cx, cz + 1);
  }
  function mark(cx, cz) { var c = M.chunks[cx + ',' + cz]; if (c) c.dirty = true; }
  function solid(id) { return id !== 0 && id !== 12; }

  /* ----------------------------------------------------------------- меш чанка */
  var FACES = [   // dx,dy,dz, вершини (4×xyz), яскравість, tile-індекс (0 верх,1 бік,2 низ)
    [0, 1, 0, [0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0], 1.0, 0], [0, -1, 0, [0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1], .5, 2],
    [1, 0, 0, [1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1], .8, 1], [-1, 0, 0, [0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0], .8, 1],
    [0, 0, 1, [0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1], .7, 1], [0, 0, -1, [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0], .7, 1]
  ];
  function tileOf(id, face) { var t = B[id].t; return t.length === 1 ? t[0] : t[face]; }
  function buildMesh(cx, cz) {
    var T = M.T, c = M.chunks[cx + ',' + cz], P = [], U = [], C = [], I = [], wP = [], wU = [], wC = [], wI = [], x, y, z, f, v;
    for (y = 1; y < HT; y++) for (z = 0; z < CH; z++) for (x = 0; x < CH; x++) {
      var id = c.d[x + CH * (z + CH * y)]; if (!id) continue; var gx = cx * CH + x, gz = cz * CH + z, water = id === 12;
      for (f = 0; f < 6; f++) {
        var F = FACES[f], nb = getB(gx + F[0], y + F[1], gz + F[2]);
        if (water ? nb !== 0 : (nb !== 0 && !(B[nb].tr && nb !== id))) continue;
        if (water && f !== 0) continue;                                           // вода — лише верхня поверхня
        var t = tileOf(id, F[5]), u0 = (t % 8) / 8 + .002, v0 = 1 - (Math.floor(t / 8) + 1) / 4 + .004, du = 1 / 8 - .004, dv = 1 / 4 - .008;
        var PP = water ? wP : P, UU = water ? wU : U, CC = water ? wC : C, II = water ? wI : I, base = PP.length / 3, vs = F[3], sh = F[4];
        for (v = 0; v < 4; v++) { PP.push(gx + vs[v * 3], y + vs[v * 3 + 1] - (water ? 0.12 : 0), gz + vs[v * 3 + 2]); CC.push(sh, sh, sh); }
        UU.push(u0, v0, u0 + du, v0, u0 + du, v0 + dv, u0, v0 + dv);
        II.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    function mk(P2, U2, C2, I2, mat) {
      if (!I2.length) return null; var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(P2), 3)); g.setAttribute('uv', new T.BufferAttribute(new Float32Array(U2), 2)); g.setAttribute('color', new T.BufferAttribute(new Float32Array(C2), 3)); g.setIndex(I2);
      var m = new T.Mesh(g, mat); m.frustumCulled = true; return m;
    }
    ['mO', 'mW'].forEach(function (k) { if (c[k]) { M.scene.remove(c[k]); c[k].geometry.dispose(); c[k] = null; } });
    c.mO = mk(P, U, C, I, M.matO); c.mW = mk(wP, wU, wC, wI, M.matW);
    if (c.mO) M.scene.add(c.mO); if (c.mW) M.scene.add(c.mW);
    c.dirty = false; c.meshed = true;
  }

  /* ----------------------------------------------------------------- фізика / промінь */
  function boxHits(px, py, pz) {
    var x0 = Math.floor(px - .3), x1 = Math.floor(px + .3), y0 = Math.floor(py), y1 = Math.floor(py + 1.78), z0 = Math.floor(pz - .3), z1 = Math.floor(pz + .3);
    for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++) for (var x = x0; x <= x1; x++) if (solid(getB(x, y, z))) return true;
    return false;
  }
  function raycast() {
    var T = M.T, o = M.cam.position.clone(), d = new T.Vector3(0, 0, -1).applyQuaternion(M.cam.quaternion), x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    var sx = d.x > 0 ? 1 : -1, sy = d.y > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1, tx = d.x ? ((d.x > 0 ? x + 1 - o.x : o.x - x) / Math.abs(d.x)) : 1e9, ty = d.y ? ((d.y > 0 ? y + 1 - o.y : o.y - y) / Math.abs(d.y)) : 1e9, tz = d.z ? ((d.z > 0 ? z + 1 - o.z : o.z - z) / Math.abs(d.z)) : 1e9;
    var dx = d.x ? 1 / Math.abs(d.x) : 1e9, dy = d.y ? 1 / Math.abs(d.y) : 1e9, dz = d.z ? 1 / Math.abs(d.z) : 1e9, nx = 0, ny = 0, nz = 0, dist = 0;
    for (var i = 0; i < 40; i++) {
      var b = getB(x, y, z);
      if (b && b !== 12) return { x: x, y: y, z: z, id: b, nx: nx, ny: ny, nz: nz };
      if (tx < ty && tx < tz) { dist = tx; x += sx; tx += dx; nx = -sx; ny = 0; nz = 0; } else if (ty < tz) { dist = ty; y += sy; ty += dy; nx = 0; ny = -sy; nz = 0; } else { dist = tz; z += sz; tz += dz; nx = 0; ny = 0; nz = -sz; }
      if (dist > 5.5) return null;
    }
    return null;
  }
  function addItem(id, n) { M.inv[id] = (M.inv[id] || 0) + n; if (M.slots.indexOf(id) < 0) M.slots.push(id); renderBar(); }
  function takeItem(id) { M.inv[id]--; if (M.inv[id] <= 0) { delete M.inv[id]; var i = M.slots.indexOf(id); if (i > -1) M.slots.splice(i, 1); if (M.sel >= M.slots.length) M.sel = Math.max(0, M.slots.length - 1); } renderBar(); }
  function breakBlock(h) {
    var id = h.id; if (id === 14) return; setB(h.x, h.y, h.z, 0);
    var drop = B[id].drop === undefined ? id : B[id].drop; if (drop) { addItem(drop, 1); M.got[drop] = (M.got[drop] || 0) + 1; }
    vib(8); quest();
  }
  function placeBlock(h) {
    var id = M.slots[M.sel]; if (!id || !M.inv[id]) return; var x = h.x + h.nx, y = h.y + h.ny, z = h.z + h.nz;
    if (getB(x, y, z) !== 0 && getB(x, y, z) !== 12) return;
    setB(x, y, z, id); if (boxHits(M.px, M.py, M.pz)) { setB(x, y, z, 0); return; }
    takeItem(id); vib(5);
  }
  function quest() {
    var all = true; QUEST.forEach(function (q) { if ((M.got[q[0]] || 0) < q[1]) all = false; });
    renderQuest();
    if (all && !M.done) {
      M.done = true; var rw = 0; try { var b = window.__fxFeatures ? window.__fxFeatures.base() : 5000; rw = Math.round(b * 12); score += rw; clickCloudTotal += rw; updateScore(); saveGame(); } catch (e) {}
      try { showToast('⛏️ ' + tt('Квест пісочниці виконано!') + (rw ? ' +' + formatTime(rw) : '')); } catch (e) {}
      try { window.__fxSnd && window.__fxSnd.force && window.__fxSnd.force('claim'); } catch (e) {}
    }
  }

  /* ----------------------------------------------------------------- UI */
  function icon(id) {
    var c = doc.createElement('canvas'); c.width = c.height = 32; var x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    var t = tileOf(id, 1); x.drawImage(M.atlas, (t % 8) * 16, Math.floor(t / 8) * 16, 16, 16, 0, 0, 32, 32); return c;
  }
  function renderBar() {
    var bar = $('mcBar'); if (!bar) return; bar.innerHTML = '';
    for (var i = 0; i < Math.max(9, M.slots.length); i++) {
      var id = M.slots[i], s = doc.createElement('button'); s.type = 'button'; s.className = 'mc-slot' + (i === M.sel ? ' on' : ''); s.dataset.i = i;
      if (id) { s.appendChild(icon(id)); var n = doc.createElement('b'); n.textContent = M.inv[id]; s.appendChild(n); s.title = tt(B[id].n); }
      s.addEventListener('click', function () { M.sel = +this.dataset.i; renderBar(); });
      bar.appendChild(s);
    }
  }
  function renderQuest() {
    var q = $('mcQuest'); if (!q) return;
    q.innerHTML = '<b>⛏️ ' + tt('Квест') + (M.done ? ' ✅' : '') + '</b>' + QUEST.map(function (r) { var have = Math.min(r[1], M.got[r[0]] || 0); return '<span class="' + (have >= r[1] ? 'ok' : '') + '">' + tt(r[2]) + ' ' + have + '/' + r[1] + '</span>'; }).join('');
  }
  function craftPanel() {
    var p = $('mcCraft'); p.hidden = !p.hidden; if (p.hidden) return;
    p.innerHTML = '<b>🔨 ' + tt('Крафт') + '</b>' + RECIPES.map(function (r, i) {
      var ok = Object.keys(r.need).every(function (k) { return (M.inv[k] || 0) >= r.need[k]; });
      return '<button type="button" data-r="' + i + '"' + (ok ? '' : ' disabled') + '>' + tt(r.n) + '</button>';
    }).join('');
    [].forEach.call(p.querySelectorAll('[data-r]'), function (b) { b.addEventListener('click', function () { var r = RECIPES[+b.dataset.r]; Object.keys(r.need).forEach(function (k) { for (var i = 0; i < r.need[k]; i++) takeItem(+k); }); Object.keys(r.give).forEach(function (k) { addItem(+k, r.give[k]); }); p.hidden = true; craftPanel(); }); });
  }

  /* ----------------------------------------------------------------- запуск */
  function open() {
    var old = $('mcSandbox'); if (old) return;
    var o = doc.createElement('div'); o.id = 'mcSandbox'; o.className = 'fx-modal mc-ov'; o.style.zIndex = 9988;
    var touch = window.matchMedia && matchMedia('(pointer:coarse)').matches || body.classList.contains('mobile-version');
    o.innerHTML = '<div class="mc-wrap' + (touch ? ' touch' : '') + '"><canvas id="mcCv"></canvas><div class="mc-cross"></div><div id="mcQuest" class="mc-quest"></div><div id="mcBar" class="mc-bar"></div>' +
      '<div id="mcInfo" class="mc-info">' + tt('Завантаження світу…') + '</div><div id="mcCraft" class="mc-craft" hidden></div><button class="fx-x" type="button" aria-label="Закрити">\u00D7</button>' +
      '<button class="mc-btn mc-c" type="button" id="mcCraftBtn">🔨</button>' +
      (touch ? '<div id="mcStick" class="mc-stick"><i></i></div><div id="mcLook" class="mc-look"></div><button class="mc-btn mc-jump" id="mcJump" type="button">⬆</button><button class="mc-btn mc-dig" id="mcDig" type="button">⛏</button><button class="mc-btn mc-put" id="mcPut" type="button">▣</button>' : '<div class="mc-help">WASD · Пробіл · ЛКМ ламати · ПКМ ставити · 1-9 · E крафт · Esc</div>') + '</div>';
    body.appendChild(o); requestAnimationFrame(function () { o.classList.add('in'); });
    loadThree().then(function (T) { init(T, o, touch); }, function () { $('mcInfo').textContent = tt('Не вдалося завантажити 3D-бібліотеку. Перевір інтернет.'); });
    o.querySelector('.fx-x').addEventListener('click', function () { close(o); });
  }
  function close(o) {
    if (M) { persist(); cancelAnimationFrame(M.raf); clearInterval(M.sv); M.keyCleanup && M.keyCleanup(); try { M.r.dispose(); } catch (e) {} Object.keys(M.chunks).forEach(function (k) { var c = M.chunks[k]; if (c.mO) c.mO.geometry.dispose(); if (c.mW) c.mW.geometry.dispose(); }); if (doc.pointerLockElement) doc.exitPointerLock(); M = null; }
    o.classList.remove('in'); setTimeout(function () { o.remove(); }, 300);
  }
  function init(T, o, touch) {
    var cv = $('mcCv'), wrap = o.querySelector('.mc-wrap'), W = wrap.clientWidth, Hh = wrap.clientHeight, R = lite() ? 2 : 3;
    var r = new T.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite() ? 1 : 1.5)); r.setSize(W, Hh, false);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(72, W / Hh, 0.08, 160); cam.rotation.order = 'YXZ';
    var atlas = makeAtlas(), tex = new T.CanvasTexture(atlas); tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter; tex.generateMipmaps = false; if (T.sRGBEncoding) tex.encoding = T.sRGBEncoding;
    var matO = new T.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.5 }), matW = new T.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, opacity: 0.62, depthWrite: false });
    var hl = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.004, 1.004, 1.004)), new T.LineBasicMaterial({ color: 0x000000 })); hl.visible = false; scene.add(hl);
    var bg = new T.Color(0x8ec9f0); scene.background = bg; scene.fog = new T.Fog(0x8ec9f0, 18, R * CH + 6);
    M = { bg: bg, T: T, r: r, scene: scene, cam: cam, atlas: atlas, matO: matO, matW: matW, hl: hl, chunks: {}, inv: save.inv, got: save.got || {}, done: !!save.done, slots: [], sel: 0, px: 8.5, py: 40, pz: 8.5, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, keys: {}, onGround: false, t: 60, mining: 0, minTarget: null, touch: touch, joy: { x: 0, y: 0 }, digHeld: false, raf: 0, last: 0, R: R, queue: [], fps: 60 };
    Object.keys(M.inv).forEach(function (k) { M.slots.push(+k); });
    function ensure(cx, cz) { var k = cx + ',' + cz; if (!M.chunks[k]) M.chunks[k] = { d: genChunk(cx, cz), dirty: true, meshed: false, cx: cx, cz: cz }; return M.chunks[k]; }
    M.ensure = ensure;
    // стартова позиція
    for (var dz = -2; dz <= 2; dz++) for (var dx = -2; dx <= 2; dx++) ensure(dx, dz);
    if (save.pos) { M.px = save.pos[0]; M.py = save.pos[1]; M.pz = save.pos[2]; M.yaw = save.pos[3]; M.pitch = save.pos[4]; }
    else { var h = height(8, 8, save.seed); M.px = 8.5; M.pz = 8.5; M.py = Math.max(h, SEA) + 2; }
    var scx = Math.floor(M.px / CH), scz = Math.floor(M.pz / CH); for (dz = -R - 1; dz <= R + 1; dz++) for (dx = -R - 1; dx <= R + 1; dx++) ensure(scx + dx, scz + dz);
    for (dz = -1; dz <= 1; dz++) for (dx = -1; dx <= 1; dx++) buildMesh(scx + dx, scz + dz);              // найближчі чанки одразу
    renderBar(); renderQuest(); $('mcInfo').hidden = true;
    // ---- керування
    function kd(e) { if (!M) return; if (e.code === 'Escape') { if (!doc.pointerLockElement) close(o); return; } if (e.code === 'KeyE') { craftPanel(); return; } if (/Digit[1-9]/.test(e.code)) { M.sel = +e.code.slice(5) - 1; renderBar(); return; } M.keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); }
    function ku(e) { if (M) M.keys[e.code] = false; }
    function mm(e) { if (!M || doc.pointerLockElement !== cv) return; M.yaw -= e.movementX * 0.0024; M.pitch = Math.max(-1.55, Math.min(1.55, M.pitch - e.movementY * 0.0024)); }
    function md(e) { if (!M) return; if (doc.pointerLockElement !== cv) { try { cv.requestPointerLock(); } catch (er) {} return; } if (e.button === 0) M.digHeld = true; else if (e.button === 2) { var h = raycast(); if (h) placeBlock(h); } }
    function mu(e) { if (e.button === 0 && M) M.digHeld = false; }
    function wh(e) { if (!M) return; M.sel = (M.sel + (e.deltaY > 0 ? 1 : -1) + Math.max(9, M.slots.length)) % Math.max(9, M.slots.length); renderBar(); }
    doc.addEventListener('keydown', kd); doc.addEventListener('keyup', ku); doc.addEventListener('mousemove', mm); cv.addEventListener('mousedown', md); doc.addEventListener('mouseup', mu); cv.addEventListener('wheel', wh, { passive: true }); cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    $('mcCraftBtn').addEventListener('click', craftPanel);
    if (touch) {
      var st = $('mcStick'), look = $('mcLook'), sid = null, lid = null, lx = 0, ly = 0;
      st.addEventListener('pointerdown', function (e) { sid = e.pointerId; st.setPointerCapture(sid); });
      st.addEventListener('pointermove', function (e) { if (e.pointerId !== sid) return; var r2 = st.getBoundingClientRect(), dx2 = (e.clientX - (r2.left + r2.width / 2)) / (r2.width / 2), dy2 = (e.clientY - (r2.top + r2.height / 2)) / (r2.height / 2), l = Math.hypot(dx2, dy2) || 1, k = Math.min(1, l); M.joy.x = dx2 / l * k; M.joy.y = dy2 / l * k; st.firstChild.style.transform = 'translate(' + M.joy.x * 28 + 'px,' + M.joy.y * 28 + 'px)'; });
      function endStick(e) { if (e.pointerId !== sid) return; sid = null; M.joy.x = M.joy.y = 0; st.firstChild.style.transform = ''; }
      st.addEventListener('pointerup', endStick); st.addEventListener('pointercancel', endStick);
      look.addEventListener('pointerdown', function (e) { lid = e.pointerId; lx = e.clientX; ly = e.clientY; look.setPointerCapture(lid); });
      look.addEventListener('pointermove', function (e) { if (e.pointerId !== lid) return; M.yaw -= (e.clientX - lx) * 0.006; M.pitch = Math.max(-1.55, Math.min(1.55, M.pitch - (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; });
      look.addEventListener('pointerup', function () { lid = null; }); look.addEventListener('pointercancel', function () { lid = null; });
      var jb = $('mcJump'); jb.addEventListener('pointerdown', function (e) { e.preventDefault(); M.keys.Space = true; }); jb.addEventListener('pointerup', function () { M.keys.Space = false; }); jb.addEventListener('pointercancel', function () { M.keys.Space = false; });
      var db = $('mcDig'); db.addEventListener('pointerdown', function (e) { e.preventDefault(); M.digHeld = true; }); db.addEventListener('pointerup', function () { M.digHeld = false; }); db.addEventListener('pointercancel', function () { M.digHeld = false; });
      $('mcPut').addEventListener('pointerdown', function (e) { e.preventDefault(); var h = raycast(); if (h) placeBlock(h); });
    }
    M.keyCleanup = function () { doc.removeEventListener('keydown', kd); doc.removeEventListener('keyup', ku); doc.removeEventListener('mousemove', mm); doc.removeEventListener('mouseup', mu); window.removeEventListener('resize', rs); };
    function rs() { if (!M) return; var w = wrap.clientWidth, h = wrap.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    window.addEventListener('resize', rs);
    M.sv = setInterval(persist, 15000);
    M.raf = requestAnimationFrame(loop);
  }
  var SKY_D = [0x8ec9f0], SKY_N = [0x0a1030];
  function loop(now) {
    if (!M) return; M.raf = requestAnimationFrame(loop);
    if (!M.last || now < M.last) M.last = now;                              // перший кадр може мати старішу мітку часу
    var dt = Math.max(0, Math.min(0.05, (now - M.last) / 1000)); M.last = now; var T = M.T;
    // --- рух
    var fwd = (M.keys.KeyW || M.keys.ArrowUp ? 1 : 0) - (M.keys.KeyS || M.keys.ArrowDown ? 1 : 0) - M.joy.y, str = (M.keys.KeyD || M.keys.ArrowRight ? 1 : 0) - (M.keys.KeyA || M.keys.ArrowLeft ? 1 : 0) + M.joy.x;
    var sp = (M.keys.ShiftLeft || M.keys.ShiftRight ? 5.8 : 4.4), sy = Math.sin(M.yaw), cy = Math.cos(M.yaw), len = Math.hypot(fwd, str) || 1; if (len < 1) len = 1;
    var wx = (-sy * fwd + cy * str) / len * sp, wz = (-cy * fwd - sy * str) / len * sp, inW = getB(Math.floor(M.px), Math.floor(M.py + .4), Math.floor(M.pz)) === 12;
    M.vx = wx; M.vz = wz; M.vy -= (inW ? 6 : 30) * dt; if (inW) M.vy = Math.max(M.vy, -2.2);
    if (M.keys.Space && (M.onGround || inW)) { M.vy = inW ? 3.6 : 9.2; M.onGround = false; }
    function mv(ax, d) { if (!d) return false; var nx = M.px + (ax === 0 ? d : 0), ny = M.py + (ax === 1 ? d : 0), nz = M.pz + (ax === 2 ? d : 0); if (!boxHits(nx, ny, nz)) { M.px = nx; M.py = ny; M.pz = nz; return true; } return false; }
    var sub = Math.ceil(dt / 0.015); for (var s = 0; s < sub; s++) { var d2 = dt / sub; mv(0, M.vx * d2); mv(2, M.vz * d2); if (!mv(1, M.vy * d2)) { if (M.vy < 0) M.onGround = true; M.vy = 0; } else if (M.vy < -0.1) M.onGround = false; }
    if (M.py < -10) { M.py = 40; M.vy = 0; }
    // --- камера
    M.cam.position.set(M.px, M.py + 1.62, M.pz); M.cam.rotation.set(M.pitch, M.yaw, 0);
    // --- день/ніч
    M.t += dt; var ph = (M.t % 240) / 240, sun = Math.max(0.0, Math.min(1, Math.sin(ph * Math.PI * 2) * 0.9 + 0.55)), c1 = new T.Color(SKY_N[0]).lerp(new T.Color(SKY_D[0]), sun);
    M.bg.copy(c1); M.scene.fog.color.copy(c1); var lum = 0.32 + 0.68 * sun; M.matO.color.setScalar(lum); M.matW.color.setScalar(lum);
    // --- чанки: завантаження навколо гравця та меші по одному за кадр
    var pcx = Math.floor(M.px / CH), pcz = Math.floor(M.pz / CH), R = M.R, dx, dz, built = 0;
    var need = []; for (dz = -R - 1; dz <= R + 1; dz++) for (dx = -R - 1; dx <= R + 1; dx++) if (!M.chunks[(pcx + dx) + ',' + (pcz + dz)]) need.push([dx * dx + dz * dz, pcx + dx, pcz + dz]);
    need.sort(function (a, b) { return a[0] - b[0]; }); for (var ni = 0; ni < need.length && ni < 2; ni++) M.ensure(need[ni][1], need[ni][2]);
    var list = []; for (dz = -R; dz <= R; dz++) for (dx = -R; dx <= R; dx++) { var c = M.chunks[(pcx + dx) + ',' + (pcz + dz)]; if (c && (c.dirty || !c.meshed) && M.chunks[(pcx + dx + 1) + ',' + (pcz + dz)] && M.chunks[(pcx + dx - 1) + ',' + (pcz + dz)] && M.chunks[(pcx + dx) + ',' + (pcz + dz + 1)] && M.chunks[(pcx + dx) + ',' + (pcz + dz - 1)]) list.push([dx * dx + dz * dz, c]); }
    list.sort(function (a, b) { return a[0] - b[0]; }); for (var i = 0; i < list.length && built < (lite() ? 1 : 2); i++) { buildMesh(list[i][1].cx, list[i][1].cz); built++; }
    Object.keys(M.chunks).forEach(function (k) { var c = M.chunks[k]; if (Math.abs(c.cx - pcx) > R + 2 || Math.abs(c.cz - pcz) > R + 2) { if (c.mO) { M.scene.remove(c.mO); c.mO.geometry.dispose(); } if (c.mW) { M.scene.remove(c.mW); c.mW.geometry.dispose(); } delete M.chunks[k]; } });
    // --- ціль / ламання
    var h = raycast(); if (h) { M.hl.position.set(h.x + .5, h.y + .5, h.z + .5); M.hl.visible = true; } else M.hl.visible = false;
    if (M.digHeld && h && B[h.id].h > 0) {
      if (!M.minTarget || M.minTarget.x !== h.x || M.minTarget.y !== h.y || M.minTarget.z !== h.z) { M.minTarget = h; M.mining = 0; }
      M.mining += dt / B[h.id].h; M.hl.material.color.setHex(M.mining > .5 ? 0xff3030 : 0x000000);
      if (M.mining >= 1) { breakBlock(h); M.mining = 0; M.minTarget = null; }
    } else { M.mining = 0; M.minTarget = null; M.hl.material.color.setHex(0x000000); }
    M.r.render(M.scene, M.cam);
  }
  window.initMinecraft = open;
  window.__fxMc = { open: open, state: function () { return M; }, B: B, genChunk: genChunk, save: save, api: { ray: function () { return raycast(); }, brk: function (h) { return breakBlock(h); }, put: function (h) { return placeBlock(h); }, get: function (x, y, z) { return getB(x, y, z); } } };
})();
