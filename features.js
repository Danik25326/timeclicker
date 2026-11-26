/* features.js v5 — вкладка «Події»: щоденні нагороди, завдання, сезонна подія (Хелловін),
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

  /* ================================================================ КАЛЕНДАР СВЯТ
     Усе вмикається САМЕ за датою: тема, декор, цукерки/сніжинки…, святкові скіни, анонс.
     Додати нове свято = додати один запис у HOLS. */
  function Dt(y, m, d, end) { return end ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d, 0, 0, 0); }
  function shiftD(d, n, end) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0); }
  function orthEaster(y) {                                   // православний Великдень (юліанський → григоріанський, 1900–2099)
    var a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, m = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
    var dt = new Date(y, m - 1, day); dt.setDate(dt.getDate() + 13); return dt;
  }
  function nthWd(y, m, wd, n) { var d = new Date(y, m - 1, 1); d.setDate(1 + ((wd - d.getDay() + 7) % 7) + (n - 1) * 7); return d; }
  var HOLS = [
    { id: 'halloween', name: 'Хелловін', emoji: '🎃', cur: '🍬', curName: 'цукерки', drop: .10, dropE: ['🍬', '🍭', '🍫'], acc: [255, 122, 0], acc2: [168, 85, 247], main: '#ff7a00', tint: '#ffc27a', bg: ['#170a22', '#06030b'], manual: true,
      win: function (y) { return [Dt(y, 10, 15), Dt(y, 11, 10, 1)]; },
      sk: { shapes: [['pumpkin', 'Гарбуз 🎃', '50% / 44%'], ['tombstone', 'Надгробок 🪦', '50% 50% 8% 8% / 44% 44% 8% 8%']],
            colors: [['pumpkin', 'Гарбуз 🎃', '#ff7a00'], ['witch', 'Відьма 🧪', '#84cc16'], ['blood', 'Кров 🩸', '#dc2626']],
            hands: [['bone', 'Кістки 🦴', ['#d9cfb4', '#fffaf0', '#cfc4a6']], ['flame', 'Полум\u2019я 🔥', ['#fff3a0', '#ff9a1a', '#e0360c']]],
            fx: [['ghost', 'Привиди 👻', ['👻'], '200,255,220'], ['bats', 'Кажани 🦇', ['🦇'], '170,80,255'], ['candy', 'Цукерки 🍬', ['🍬', '🍭', '🍫', '🎃'], '255,150,40']] } },
    { id: 'newyear', name: 'Новий рік і Різдво', emoji: '🎄', cur: '❄️', curName: 'сніжинки', drop: .10, dropE: ['❄️', '✨', '🎁'], acc: [239, 68, 68], acc2: [34, 197, 94], main: '#ef4444', tint: '#fecaca', bg: ['#0c1626', '#040810'],
      deco: { e: ['❄️', '❄️', '❄️', '✨'], mode: 'fall', n: 16 }, win: function (y) { return [Dt(y, 12, 15), Dt(y + 1, 1, 14, 1)]; },
      sk: { shapes: [['ny-gift', 'Подарунок 🎁', '14%'], ['ny-bauble', 'Ялинкова куля 🔮', '50% 50% 50% 50% / 46% 46% 54% 54%']],
            colors: [['ny-ice', 'Крига ❄️', '#7dd3fc'], ['ny-spruce', 'Ялинка 🎄', '#22c55e'], ['ny-gold', 'Святкове золото ✨', '#fbbf24']],
            hands: [['ny-candy', 'Льодяник 🍭', ['#ffffff', '#ef4444', '#991b1b']], ['ny-frost', 'Іній 🧊', ['#ffffff', '#a5f3fc', '#3b82f6']]],
            fx: [['ny-snow', 'Снігопад ❄️', ['❄️', '✨'], '186,230,253'], ['ny-gifts', 'Подарунки 🎁', ['🎁', '⭐'], '239,68,68'], ['ny-fire', 'Феєрверк 🎆', ['🎆', '🎇', '✨'], '251,191,36']] } },
    { id: 'valentine', name: 'День Святого Валентина', emoji: '💝', cur: '💌', curName: 'листівки', drop: .10, dropE: ['💌', '💖', '💕'], acc: [236, 72, 153], acc2: [244, 63, 94], main: '#ec4899', tint: '#fbcfe8', bg: ['#1a0a1c', '#07030a'],
      deco: { e: ['💖', '💗', '💕', '❤️'], mode: 'rise', n: 12 }, win: function (y) { return [Dt(y, 2, 7), Dt(y, 2, 15, 1)]; },
      sk: { shapes: [['vl-heart', 'Серденько 💗', '50% 50% 50% 50% / 40% 40% 60% 60%'], ['vl-letter', 'Листівка ✉️', '10%']],
            colors: [['vl-rose', 'Троянда 🌹', '#f43f5e'], ['vl-quartz', 'Рожевий кварц 💎', '#f9a8d4'], ['vl-wine', 'Вино 🍷', '#be123c']],
            hands: [['vl-cupid', 'Стріла Амура 🏹', ['#fff1f2', '#fb7185', '#be123c']], ['vl-pearl', 'Перлини 🦪', ['#ffffff', '#fbcfe8', '#ec4899']]],
            fx: [['vl-hearts', 'Серця 💖', ['💖', '💕', '💘'], '236,72,153'], ['vl-roses', 'Троянди 🌹', ['🌹', '🌸'], '244,63,94'], ['vl-kiss', 'Поцілунки 💋', ['💋', '😘', '💞'], '251,113,133']] } },
    { id: 'womensday', name: '8 Березня', emoji: '🌷', cur: '🌷', curName: 'тюльпани', drop: .10, dropE: ['🌷', '🌸', '🌼'], acc: [244, 114, 182], acc2: [163, 230, 53], main: '#f472b6', tint: '#fbcfe8', bg: ['#18091c', '#06030a'],
      deco: { e: ['🌸', '🌷', '🌼'], mode: 'fall', n: 12 }, win: function (y) { return [Dt(y, 3, 1), Dt(y, 3, 9, 1)]; },
      sk: { shapes: [['wd-flower', 'Квітка 🌼', '42% 58% 46% 54% / 54% 42% 58% 46%'], ['wd-vase', 'Ваза 🏺', '30% 30% 50% 50% / 20% 20% 55% 55%']],
            colors: [['wd-tulip', 'Тюльпан 🌷', '#f43f5e'], ['wd-mimosa', 'Мімоза 🌼', '#facc15'], ['wd-lilac', 'Бузок 💜', '#c084fc']],
            hands: [['wd-stem', 'Стебла 🌿', ['#ecfccb', '#84cc16', '#3f6212']], ['wd-ribbon', 'Стрічка 🎀', ['#ffffff', '#f9a8d4', '#db2777']]],
            fx: [['wd-petals', 'Пелюстки 🌸', ['🌸', '🌷'], '244,114,182'], ['wd-bouquet', 'Букет 💐', ['💐', '🌹'], '244,63,94'], ['wd-butterfly', 'Метелики 🦋', ['🦋', '✨'], '168,85,247']] } },
    { id: 'easter', name: 'Великдень', emoji: '🥚', cur: '🥚', curName: 'писанки', drop: .10, dropE: ['🥚', '🐣', '🌼'], acc: [251, 191, 36], acc2: [52, 211, 153], main: '#fbbf24', tint: '#fde68a', bg: ['#0f1a14', '#040806'],
      deco: { e: ['🥚', '🐣', '🌼', '🐰'], mode: 'float', n: 9 }, win: function (y) { var e = orthEaster(y); return [shiftD(e, -10), shiftD(e, 3, 1)]; },
      sk: { shapes: [['ea-egg', 'Писанка 🥚', '50% 50% 50% 50% / 60% 60% 40% 40%'], ['ea-basket', 'Кошик 🧺', '12% 12% 40% 40% / 12% 12% 40% 40%']],
            colors: [['ea-gold', 'Золота писанка ✨', '#fbbf24'], ['ea-green', 'Весна 🌿', '#34d399'], ['ea-sky', 'Небо 🕊️', '#38bdf8']],
            hands: [['ea-bread', 'Паска 🍞', ['#fff7d6', '#fbbf24', '#b45309']], ['ea-willow', 'Верба 🌿', ['#f5f5dc', '#a3e635', '#3f6212']]],
            fx: [['ea-eggs', 'Писанки 🥚', ['🥚', '🐣'], '251,191,36'], ['ea-bunny', 'Зайчики 🐰', ['🐰', '🥕'], '253,230,138'], ['ea-bells', 'Дзвони 🔔', ['🔔', '🌼'], '52,211,153']] } },
    { id: 'vyshyvanka', name: 'День вишиванки', emoji: '🌺', cur: '🧵', curName: 'нитки', drop: .10, dropE: ['🧵', '🌺', '🌸'], acc: [220, 38, 38], acc2: [245, 158, 11], main: '#dc2626', tint: '#fecaca', bg: ['#190a0a', '#060303'],
      deco: { e: ['🌺', '🌸', '🧵'], mode: 'float', n: 8 }, win: function (y) { var d = nthWd(y, 5, 4, 3); return [shiftD(d, -3), shiftD(d, 2, 1)]; },
      sk: { shapes: [['vy-rushnyk', 'Рушник', '6%'], ['vy-wreath', 'Віночок 🌼', '46% 54% 48% 52% / 52% 46% 54% 48%']],
            colors: [['vy-red', 'Червона нитка', '#dc2626'], ['vy-silver', 'Срібна нитка', '#9ca3af'], ['vy-gold', 'Золота нитка', '#f59e0b']],
            hands: [['vy-needle', 'Голка 🪡', ['#ffffff', '#d1d5db', '#6b7280']], ['vy-thread', 'Нитка 🧶', ['#fecaca', '#ef4444', '#7f1d1d']]],
            fx: [['vy-flowers', 'Квіти 🌺', ['🌺', '🌸'], '220,38,38'], ['vy-threads', 'Нитки 🧵', ['🧵', '✨'], '245,158,11'], ['vy-wreaths', 'Віночки 🌼', ['🌼', '🌻'], '250,204,21']] } },
    { id: 'independence', name: 'День Незалежності', emoji: '🇺🇦', cur: '🌻', curName: 'соняшники', drop: .10, dropE: ['🌻', '💙', '💛'], acc: [250, 204, 21], acc2: [59, 130, 246], main: '#facc15', tint: '#fde68a', bg: ['#07122b', '#030816'],
      deco: { e: ['🌻', '💙', '💛', '🕊️'], mode: 'float', n: 10 }, win: function (y) { return [Dt(y, 8, 17), Dt(y, 8, 26, 1)]; },
      sk: { shapes: [['in-flag', 'Прапор 🇺🇦', '4%'], ['in-shield', 'Щит 🛡️', '8% 8% 50% 50% / 8% 8% 60% 60%']],
            colors: [['in-blue', 'Блакить 💙', '#2563eb'], ['in-yellow', 'Жовтий 💛', '#facc15'], ['in-wheat', 'Пшениця 🌾', '#d4a017']],
            hands: [['in-flagh', 'Синьо-жовті 🇺🇦', ['#fde047', '#3b82f6', '#1e3a8a']], ['in-ear', 'Колос 🌾', ['#fef9c3', '#eab308', '#92400e']]],
            fx: [['in-sunflowers', 'Соняшники 🌻', ['🌻', '🌾'], '250,204,21'], ['in-hearts', 'Серця 💙💛', ['💙', '💛'], '59,130,246'], ['in-doves', 'Голуби 🕊️', ['🕊️', '✨'], '186,230,253']] } }
  ];
  function findHol(id) { for (var i = 0; i < HOLS.length; i++) if (HOLS[i].id === id) return HOLS[i]; return null; }
  function currentActive() {
    var f = (location.search.match(/season=([\w-]+)/) || [])[1] || (function () { try { return localStorage.getItem('fxSeason'); } catch (e) { return null; } })();
    var now = new Date();
    if (f) { if (f === 'none') return null; var fh = findHol(f); if (fh) return { h: fh, year: now.getFullYear() }; }
    for (var i = 0; i < HOLS.length; i++) for (var k = -1; k <= 0; k++) {
      var y = now.getFullYear() + k, w = HOLS[i].win(y);
      if (now >= w[0] && now <= w[1]) return { h: HOLS[i], year: y };
    }
    return null;
  }
  function nextHolidays(n) {
    var now = new Date(), out = [];
    HOLS.forEach(function (h) { for (var k = 0; k <= 1; k++) { var w = h.win(now.getFullYear() + k); if (w[0] > now) out.push({ h: h, days: Math.ceil((w[0] - now) / 864e5) }); } });
    out.sort(function (a, b) { return a.days - b.days; });
    var seen = {}; return out.filter(function (o) { if (seen[o.h.id]) return false; seen[o.h.id] = 1; return true; }).slice(0, n);
  }
  var ACT = currentActive(), H = ACT && ACT.h, EVKEY = ACT ? ACT.h.id + ':' + ACT.year : null;
  var SKIN_HOL = {};
  function rgb(a) { return a.join(','); }
  function holCss(h) {                                         // CSS свята генерується з реєстру (крім Хелловіну — він написаний вручну)
    var id = h.id, A = rgb(h.acc), B = rgb(h.acc2), c = '', dark = '#14111f';
    if (!h.manual) {
      c += 'body.th-' + id + '::before{background:radial-gradient(40% 35% at 18% 22%,rgba(' + A + ',.26),transparent 70%),radial-gradient(35% 40% at 82% 18%,rgba(' + B + ',.28),transparent 70%),radial-gradient(45% 40% at 70% 88%,rgba(' + A + ',.16),transparent 70%),radial-gradient(60% 60% at 50% 50%,' + h.bg[0] + ',' + h.bg[1] + ' 80%) !important}';
      c += 'body.th-' + id + '.fx-lite::before{background:radial-gradient(60% 45% at 20% 18%,rgba(' + A + ',.2),transparent 70%),radial-gradient(50% 40% at 82% 85%,rgba(' + B + ',.2),transparent 70%),' + h.bg[1] + ' !important}';
      c += 'body.th-' + id + ' .editable-title{background:linear-gradient(100deg,#fff 15%,' + h.tint + ' 50%,' + h.main + ' 85%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text}';
      c += 'body.th-' + id + ' .editable-title::after{content:" ' + h.emoji + '";-webkit-text-fill-color:initial}';
      c += 'body.th-' + id + ' .top-tabs .tab.active{background:linear-gradient(135deg,' + h.tint + ',' + h.main + ');color:' + dark + ';box-shadow:0 0 22px rgba(' + A + ',.6),inset 0 1px 0 rgba(255,255,255,.6)}';
      c += 'body.th-' + id + ' .fx-btn{background:linear-gradient(135deg,' + h.tint + ',' + h.main + ');color:' + dark + '}body.th-' + id + ' .fx-btn.ghost{background:rgba(255,255,255,.1);color:#fff}';
      c += 'body.th-' + id + ' #clickableClock .second{background:linear-gradient(180deg,#fff,rgb(' + B + ') 55%,rgb(' + B + '));box-shadow:0 0 14px rgb(' + B + '),0 0 30px rgba(' + B + ',.5)}';
      c += 'body.th-' + id + ' #clickableClock .center-dot{background:radial-gradient(circle at 35% 30%,#fff,rgb(' + B + ') 55%,rgb(' + B + '));box-shadow:0 0 20px rgb(' + B + '),0 3px 8px rgba(0,0,0,.6)}';
      c += 'body.th-' + id + '[data-hand-skin="darkblue"] #clickableClock .hand:not(.second){background:linear-gradient(180deg,' + h.tint + ',' + h.main + ' 45%,rgb(' + B + ')) !important;box-shadow:0 0 16px rgba(' + A + ',.65) !important;--hc:' + h.main + '}';
      c += 'body.th-' + id + ' .skin[data-skin="neon-blue"]{--c:' + h.main + '}';
      c += 'body.th-' + id + ' .upgrade-btn[data-ic]::before{background:rgba(' + A + ',.18);border-color:rgba(' + A + ',.4)}';
      h.sk.shapes.forEach(function (o) {
        c += '.clock.' + o[0] + '{border-radius:' + o[2] + '}body[data-shape="' + o[0] + '"] #clockWrapper::before{border-radius:' + o[2] + '}.skin[data-type="shapes"][data-skin="' + o[0] + '"] .fx-pv{border-radius:' + o[2] + '}';
      });
      h.sk.colors.forEach(function (o) { c += '.skin[data-type="clockSkins"][data-skin="' + o[0] + '"]{--c:' + o[2] + '}'; });
      h.sk.hands.forEach(function (o) {
        var g = o[2];
        c += 'body[data-hand-skin="' + o[0] + '"] #clickableClock .hand:not(.second){background:linear-gradient(180deg,' + g[0] + ',' + g[1] + ' 45%,' + g[2] + ') !important;box-shadow:0 0 16px ' + g[1] + ' !important;--hc:' + g[1] + '}';
        c += 'body.fx-lite[data-hand-skin="' + o[0] + '"] #clickableClock .hand:not(.second){box-shadow:none !important}.skin[data-type="handSkins"][data-skin="' + o[0] + '"]{--h:linear-gradient(' + g[0] + ',' + g[1] + ',' + g[2] + ')}';
      });
      h.sk.fx.forEach(function (o) {
        c += '.click-effect-' + o[0] + '{--hc:rgb(' + o[3] + ');--hc2:rgba(' + o[3] + ',.5);animation:clickHolFx .45s var(--fx-ease)}body.fx-lite .click-effect-' + o[0] + '{animation:fxLitePulse .22s ease-out !important}';
        c += '.skin[data-type="effects"][data-skin="' + o[0] + '"] .fx-pv{background:none;box-shadow:none}.skin[data-type="effects"][data-skin="' + o[0] + '"] .fx-pv::before{content:"' + o[2][0] + '";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:27px}';
      });
    }
    return c;
  }
  function setupSkins() {
    var css = '@keyframes clickHolFx{0%,100%{transform:scale(1)}40%{transform:scale(1.06);border-color:var(--hc);box-shadow:0 0 80px var(--hc),0 0 150px var(--hc2)}}';
    window.__fxEmojiFx = window.__fxEmojiFx || {};
    var map = null; try { map = { shapes: shapes, clockSkins: clockSkins, handSkins: handSkins, effects: effects }; } catch (e) {}
    HOLS.forEach(function (h) {
      css += holCss(h);
      var PR = { shapes: 300000, colors: 250000, hands: 350000, fx: 500000 }, tgt = { shapes: 'shapes', colors: 'clockSkins', hands: 'handSkins', fx: 'effects' };
      Object.keys(h.sk).forEach(function (k) {
        h.sk[k].forEach(function (o) {
          SKIN_HOL[tgt[k] + ':' + o[0]] = h;
          if (map && !map[tgt[k]].some(function (x) { return x.id === o[0]; })) map[tgt[k]].push({ id: o[0], n: o[1], p: PR[k] });
          if (k === 'colors') { try { window.__fxClocks[o[0]] = o[2]; } catch (e) {} }
          if (k === 'fx' && !h.manual) window.__fxEmojiFx[o[0]] = { chars: o[2], ring: o[3], g: .05 };
        });
      });
    });
    var st = doc.getElementById('fxHolCss') || doc.createElement('style'); st.id = 'fxHolCss'; st.textContent = css; doc.head.appendChild(st);
  }
  function buildDeco() {
    var old = $('fxDeco'); if (old) old.remove();
    if (!H) return;
    var d = doc.createElement('div'); d.id = 'fxDeco'; d.setAttribute('aria-hidden', 'true');
    if (H.id === 'halloween') {
      var web = '<svg viewBox="0 0 200 200" width="170" height="170" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.4"><path d="M0 0 L200 200 M0 0 L200 90 M0 0 L90 200 M0 0 L200 150 M0 0 L150 200 M0 0 L200 30 M0 0 L30 200"/>' +
        '<path d="M30 0 Q22 22 0 30 M62 0 Q44 44 0 62 M100 0 Q70 70 0 100 M140 0 Q100 100 0 140 M180 0 Q130 130 0 180"/></svg>';
      d.innerHTML = '<div class="web l">' + web + '</div><div class="web r">' + web + '</div><i class="bat b1">🦇</i><i class="bat b2">🦇</i><i class="bat b3">🦇</i><div class="moon"></div>';
    } else if (H.deco) {
      var n = (function () { try { return FX().lite && FX().lite() ? Math.ceil(H.deco.n / 2) : H.deco.n; } catch (e) { return H.deco.n; } })(), h2 = '';
      for (var i = 0; i < n; i++) {
        var e = H.deco.e[i % H.deco.e.length], x = Math.round(Math.random() * 96), de = (-Math.random() * 20).toFixed(1), du = (H.deco.mode === 'float' ? 18 + Math.random() * 16 : 9 + Math.random() * 10).toFixed(1), sz = (16 + Math.random() * 16).toFixed(0), top = H.deco.mode === 'float' ? Math.round(5 + Math.random() * 60) : 0;
        h2 += '<i class="dc dc-' + H.deco.mode + '" style="left:' + x + '%;top:' + top + '%;font-size:' + sz + 'px;animation-duration:' + du + 's;animation-delay:' + de + 's">' + e + '</i>';
      }
      d.innerHTML = h2;
    }
    body.appendChild(d);
  }
  function applyTheme() {
    HOLS.forEach(function (h) { body.classList.toggle('th-' + h.id, !!H && H.id === h.id); });
    try {
      if (H) window.__fxClocks['neon-blue'] = H.main; else delete window.__fxClocks['neon-blue'];
      if (typeof applyAllSkins === 'function') applyAllSkins();
    } catch (e) {}
    buildDeco();
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
    click: function (o) { var p = 520 + Math.min(o.combo || 0, 60) * 9; if (H && H.id === 'halloween') tone(p * .55, 0, .06, 'triangle', .16, p * .4); else tone(p, 0, .045, 'sine', .14, p * 1.25); },
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
    var candy = H ? 10 + idx * 6 : 0; if (candy) addCandy(candy, true);
    play('claim'); vib([20, 30, 60]);
    try { showToast('🎁 ' + tt('Щоденна нагорода:') + ' +' + fmt(reward) + (candy ? ' · +' + candy + ' ' + H.cur : '') + ' · 🔥 ' + streak); } catch (e) {}
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
    q.claimed = true; var reward = Math.round(base() * q.m), candy = H ? q.m * 8 : 0;
    giveTime(reward); if (candy) addCandy(candy, true);
    saveQ(); play('claim'); vib([15, 25, 40]);
    try { showToast('📋 ' + tt('Завдання виконано:') + ' +' + fmt(reward) + (candy ? ' · +' + candy + ' ' + H.cur : '')); } catch (e) {}
    if (Q.list.every(function (x) { return x.claimed; }) && !Q.allClaimed) {
      Q.allClaimed = true; var bonus = Math.round(base() * 3); giveTime(bonus); if (H) addCandy(30, true); saveQ();
      try { showToast('🏆 ' + tt('Усі завдання дня!') + ' +' + fmt(bonus)); } catch (e) {}
    }
    var b = $('evQ' + i); if (b) { var c = centerOf(b); burst(c[0], c[1], 'gold', 24); }
    render(); badge();
  }

  /* ================================================================ СВЯТКОВА ПОДІЯ (валюта + нагороди-скіни) */
  var THR = [25, 60, 110, 180, 280, 400, 540, 700, 900, 1100];
  function rewardsOf(h) {
    var k = h.sk, order = [['clockSkins', k.colors[0][0]], ['handSkins', k.hands[0][0]], ['effects', k.fx[0][0]], ['shapes', k.shapes[0][0]], ['effects', k.fx[1][0]],
      ['clockSkins', k.colors[1][0]], ['handSkins', k.hands[1][0]], ['shapes', k.shapes[1][0]], ['clockSkins', k.colors[2][0]], ['effects', k.fx[2][0]]];
    return order.map(function (o, i) { return [THR[i], o[0], o[1]]; });
  }
  var ES = ls('fxEvent2', null);
  if (!ES) {                                                  // міграція зі старого формату (тільки Хелловін)
    ES = { ev: {}, ann: {} }; var oldEv = ls('fxEvent', null);
    if (oldEv && (oldEv.candy || (oldEv.got && oldEv.got.length))) ES.ev['halloween:' + oldEv.year] = { candy: oldEv.candy || 0, got: oldEv.got || [] };
    lsSet('fxEvent2', ES);
  }
  function saveEv() { lsSet('fxEvent2', ES); }
  function evRec() { if (!EVKEY) return null; return ES.ev[EVKEY] || (ES.ev[EVKEY] = { candy: 0, got: [] }); }
  function skinName(type, id) {
    var h = SKIN_HOL[type + ':' + id]; if (!h) return id;
    var key = { clockSkins: 'colors', handSkins: 'hands', effects: 'fx', shapes: 'shapes' }[type], o = h.sk[key].filter(function (x) { return x[0] === id; })[0];
    return o ? o[1] : id;
  }
  function grant(type, id) { try { if (ownedSkins[type].indexOf(id) < 0) ownedSkins[type].push(id); } catch (e) {} }
  function addCandy(n, quiet) {
    var r = evRec(); if (!H || !r) return;
    r.candy += n;
    rewardsOf(H).forEach(function (rw, i) {
      if (r.candy >= rw[0] && r.got.indexOf(i) < 0) {
        r.got.push(i); grant(rw[1], rw[2]);
        try { showToast(H.emoji + ' ' + tt('Нагорода події:') + ' ' + skinName(rw[1], rw[2])); } catch (e) {}
        play('ach'); vib([30, 40, 70]);
        try { saveGame(); if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
      }
    });
    saveEv(); if (!quiet) play('candy'); evCounter();
  }
  function reapplyEvent() {                       // нагороди подій не зникають після Реверба і лишаються назавжди
    Object.keys(ES.ev).forEach(function (k) {
      var h = findHol(k.split(':')[0]); if (!h) return; var rec = ES.ev[k], rw = rewardsOf(h);
      (rec.got || []).forEach(function (i) { if (rw[i]) grant(rw[i][1], rw[i][2]); });
    });
    try { if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
  }
  function evCounter() { var r = evRec(), e = $('evCandyN'); if (e && r) e.textContent = r.candy; var f = $('evCandyBar'); if (f) f.style.width = candyPct() + '%'; }
  function candyPct() {
    var r = evRec(); if (!r || !H) return 0; var rw = rewardsOf(H), prev = 0, nxt = null;
    for (var i = 0; i < rw.length; i++) { if (r.candy < rw[i][0]) { nxt = rw[i][0]; break; } prev = rw[i][0]; }
    return nxt ? Math.round((r.candy - prev) / (nxt - prev) * 100) : 100;
  }
  function announce() {                           // одноразовий анонс початку свята
    if (!H || !EVKEY || ES.ann[EVKEY]) return;
    ES.ann[EVKEY] = 1; saveEv();
    try { showToast(H.emoji + ' ' + tt('Розпочалась подія:') + ' ' + H.name + '! ' + tt('Збирай') + ' ' + H.cur + ' ' + tt('— відкривай святкові скіни')); } catch (e) {}
    play('ach');
  }
  function refreshSeason() {                      // свято змінюється САМЕ, навіть якщо сторінку не перезавантажували
    var a = currentActive(), nid = a ? a.h.id + ':' + a.year : null;
    if (nid === EVKEY) return;
    ACT = a; H = a && a.h; EVKEY = nid;
    applyTheme(); updateTabLabel(); announce();
    try { if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
    render(); badge();
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
    var hal = !!H, acc = (getComputedStyle(doc.documentElement).getPropertyValue('--fx-accent') || '#0ea5e9').trim() || '#0ea5e9';
    var g = c.createLinearGradient(0, 0, 0, H);
    if (hal) { g.addColorStop(0, H.bg[1]); g.addColorStop(.55, H.bg[0]); g.addColorStop(1, H.bg[1]); } else { g.addColorStop(0, '#060a1e'); g.addColorStop(.55, '#101a45'); g.addColorStop(1, '#04060f'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var rg = c.createRadialGradient(W * .3, H * .22, 10, W * .3, H * .22, 620); rg.addColorStop(0, hal ? 'rgba(' + rgb(H.acc) + ',.38)' : 'rgba(14,165,233,.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    var rg2 = c.createRadialGradient(W * .85, H * .8, 10, W * .85, H * .8, 640); rg2.addColorStop(0, hal ? 'rgba(' + rgb(H.acc2) + ',.35)' : 'rgba(236,72,153,.28)'); rg2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg2; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 140; i++) { c.fillStyle = 'rgba(255,255,255,' + (.2 + Math.random() * .6) + ')'; c.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '700 64px Poppins, system-ui, sans-serif';
    c.fillText('Times Clicker' + (hal ? ' ' + H.emoji : ''), W / 2, 120);
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
    var ds = dState(), hal = !!H, h = '';
    // --- щоденна нагорода
    h += '<div class="ev-card"><div class="ev-h"><b>🎁 ' + tt('Щоденна нагорода') + '</b><span class="ev-streak">🔥 ' + ds.streak + (ds.best ? ' · ' + tt('рекорд') + ' ' + ds.best : '') + '</span></div><div class="ev-days">';
    for (var i = 0; i < 7; i++) {
      var st = ds.claimed ? (i <= ds.idx ? 'done' : 'future') : (i < ds.idx ? 'done' : i === ds.idx ? 'today' : 'future');
      h += '<div class="ev-day ' + st + (i === 6 ? ' big' : '') + '"><small>' + dayLabel(i) + '</small><i>' + (i === 6 ? '🎁' : '⏱️') + '</i><span>' + (st === 'done' ? '✓' : '×' + DAY_MULT[i]) + '</span></div>';
    }
    h += '</div><div class="ev-note">' + tt('Нагорода сьогодні:') + ' <b>+' + esc(fmt(Math.round(base() * DAY_MULT[ds.idx]))) + '</b></div>' + (ds.broken ? '<div class="ev-note">' + tt('Серію втрачено — починаємо спочатку') + '</div>' : '') +
      '<button id="evClaim" class="fx-btn" type="button"' + (ds.claimed ? ' disabled' : '') + '>' + (ds.claimed ? '✓ ' + tt('Забрано сьогодні') : '🎁 ' + tt('Забрати')) + '</button></div>';
    // --- завдання
    h += '<div class="ev-card"><div class="ev-h"><b>📋 ' + tt('Завдання дня') + '</b><span class="ev-streak">' + Q.list.filter(function (q) { return q.claimed; }).length + '/3</span></div>';
    Q.list.forEach(function (q, i) {
      var v = Math.min(qval(q.k), q.t), done = v >= q.t, pct = Math.round(v / q.t * 100);
      h += '<div class="ev-q' + (q.claimed ? ' claimed' : '') + '"><div class="ev-qt"><span>' + (hal ? H.emoji + ' ' : '') + esc(tt(q.n)) + '</span><b>' + v + '/' + q.t + '</b></div>' +
        '<div class="ev-bar"><i style="width:' + pct + '%"></i></div><div class="ev-qr"><small>' + tt('Нагорода') + ': ' + esc(fmt(Math.round(base() * q.m))) + (hal ? ' · ' + (q.m * 8) + ' ' + H.cur : '') + '</small>' +
        '<button id="evQ' + i + '" class="fx-btn sm" type="button" data-q="' + i + '"' + ((done && !q.claimed) ? '' : ' disabled') + '>' + (q.claimed ? '✓' : tt('Забрати')) + '</button></div></div>';
    });
    h += '</div>';
    // --- святкова подія
    if (hal) {
      var rr = evRec(), rw = rewardsOf(H);
      h += '<div class="ev-card ev-hol"><div class="ev-h"><b>' + H.emoji + ' ' + esc(H.name) + '</b><span class="ev-streak">' + H.cur + ' <b id="evCandyN">' + rr.candy + '</b></span></div>' +
        '<div class="ev-note">' + tt('Збирай') + ' ' + esc(H.cur) + ' ' + esc(tt(H.curName)) + ' — ' + tt('вони випадають із кліків, щоденних нагород і завдань. За них відкриваються святкові скіни безкоштовно!') + '</div>' +
        '<div class="ev-bar big"><i id="evCandyBar" style="width:' + candyPct() + '%"></i></div><div class="ev-rw">';
      rw.forEach(function (r, i) {
        var got = rr.got.indexOf(i) > -1;
        h += '<div class="ev-r' + (got ? ' got' : '') + '"><b>' + r[0] + ' ' + H.cur + '</b><span>' + esc(skinName(r[1], r[2])) + '</span>' + (got ? '<em>✓</em>' : '') + '</div>';
      });
      h += '</div></div>';
    }
    // --- календар
    var nx = nextHolidays(3);
    h += '<div class="ev-card"><div class="ev-h"><b>📅 ' + tt('Найближчі події') + '</b></div>' + nx.map(function (o) {
      return '<div class="ev-next"><span>' + o.h.emoji + ' ' + esc(o.h.name) + '</span><small>' + tt('через') + ' ' + o.days + ' ' + tt('дн.') + '</small></div>';
    }).join('') + '<div class="ev-note">' + tt('Святкові події вмикаються самі в потрібні дати — нічого налаштовувати не треба.') + '</div></div>';
    // --- шеринг
    h += '<div class="ev-card"><div class="ev-h"><b>📸 ' + tt('Картка для друзів') + '</b></div><div class="ev-note">' + tt('Створи гарну картку зі своїм часом, досягненнями та годинником і поділись нею.') +
      '</div><button id="evShare" class="fx-btn" type="button">📸 ' + tt('Створити картку') + '</button></div>';
    page.querySelector('.ev-grid').innerHTML = h;
    var cl = $('evClaim'); if (cl) cl.addEventListener('click', claimDaily);
    [].forEach.call(page.querySelectorAll('[data-q]'), function (b) { b.addEventListener('click', function () { claimQuest(+b.dataset.q); }); });
    var sh = $('evShare'); if (sh) sh.addEventListener('click', shareCard);
  }
  function updateTabLabel() {
    if (tabBtn) tabBtn.textContent = (H ? H.emoji + ' ' : '🎁 ') + tt('Події');
    if (page) { var h3 = page.querySelector('h3'); if (h3) h3.textContent = (H ? H.emoji + ' ' : '🎁 ') + tt('Події та нагороди'); }
  }
  function buildTab() {
    var tabs = doc.querySelector('.top-tabs'), ach = $('tab-achievements'); if (!tabs || !ach || $('tab-events')) return;
    tabBtn = doc.createElement('button'); tabBtn.className = 'tab'; tabBtn.dataset.tab = 'tab-events'; tabBtn.setAttribute('role', 'tab'); tabBtn.setAttribute('aria-selected', 'false');
    tabBtn.setAttribute('aria-controls', 'tab-events'); tabBtn.textContent = (H ? H.emoji + ' ' : '🎁 ') + tt('Події');
    var achBtn = tabs.querySelector('[data-tab="tab-achievements"]'); if (achBtn && achBtn.nextSibling) tabs.insertBefore(tabBtn, achBtn.nextSibling); else tabs.appendChild(tabBtn);
    page = doc.createElement('section'); page.id = 'tab-events'; page.className = 'tab-page'; page.setAttribute('role', 'tabpanel'); page.setAttribute('aria-labelledby', 'tab-events'); page.hidden = true;
    page.innerHTML = '<h3>' + (H ? H.emoji + ' ' : '🎁 ') + tt('Події та нагороди') + '</h3><div class="ev-grid"></div>';
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
      if (H && Math.random() < (H.drop || 0.1)) {
        var r = wr.getBoundingClientRect(), x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
        FX().emoji && FX().emoji(x, y, H.dropE, 2, { g: -0.02, decay: .016 }); addCandy(1);
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
    // захист: прибираємо ВСІ класи ефектів кліку перед новим (не залежить від версії fx.js)
    if (typeof window.triggerClickEffect === 'function') {
      var otce = window.triggerClickEffect, ckw = $('clickableClock');
      window.triggerClickEffect = function () { if (ckw) [].slice.call(ckw.classList).forEach(function (c) { if (c.indexOf('click-effect-') === 0) ckw.classList.remove(c); }); return otce.apply(this, arguments); };
    }
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
          var id = el.dataset && el.dataset.skin; if (!id) return; var h = SKIN_HOL[type + ':' + id]; if (!h) return;
          el.dataset.hal = h.emoji; el.style.display = ((H && H.id === h.id) || el.classList.contains('owned')) ? '' : 'none';
        });
        return r;
      };
    }
  }

  /* ================================================================ СТАРТ */
  function start() {
    if (!gameReady()) return false;
    setupSkins(); loadQ(); reapplyEvent(); applyTheme();
    buildTab(); hooks(); sndSettings(); badge(); announce(); setInterval(refreshSeason, 60000);
    try { if (typeof refreshAllSkinGrids === 'function') refreshAllSkinGrids(); } catch (e) {}
    window.addEventListener('pagehide', saveQ);
    window.__fxFeatures = { season: function () { return H ? H.id : null; }, holidays: HOLS, refreshSeason: refreshSeason, nextHolidays: nextHolidays, addCandy: addCandy, state: function () { return { Q: Q, EV: EV }; }, shareCard: shareCard, claimDaily: claimDaily, base: base, play: play, render: render };
    return true;
  }
  // налаштування з’являються після відкриття вкладки — підчепимось пізніше
  var tries = 0, iv = setInterval(function () { tries++; if (start() || tries > 40) { clearInterval(iv); if (tries <= 40) setTimeout(sndSettings, 1500); } }, 250);
  setInterval(sndSettings, 4000);
})();
