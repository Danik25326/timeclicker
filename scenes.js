/* scenes.js v2 — сучасні версії «сцен» апгрейдів (та сама ідея, новий вигляд).
   Підключається ПІСЛЯ script.js і fx.js. Підміняє функції show…() і використовує
   ті самі глобальні змінні та hide…() гри, тож логіка/нагороди не змінюються. */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  var FX = function () { return window.__fx || {}; };
  function tt(k) { try { return typeof t === 'function' ? t(k) : k; } catch (e) { return k; } }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function shuffle(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function vib(p) { try { FX().vib && FX().vib(p); } catch (e) {} }
  function burst(x, y, k, p) { try { FX().burst && FX().burst(x, y, k, p); FX().kick && FX().kick(); } catch (e) {} }
  function scene(id, z, cls) {
    var old = doc.getElementById(id); if (old) old.remove();
    var o = doc.createElement('div'); o.id = id; o.className = 'fxs ' + (cls || ''); o.style.zIndex = z; body.appendChild(o);
    requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('in'); }); });
    return o;
  }
  function xbtn(fn) {
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'fxs-x'; b.setAttribute('aria-label', 'Закрити'); b.textContent = '\u00D7';
    b.addEventListener('click', fn); return b;
  }
  function fadeRemove(o, extra) {
    if (!o) return; o.classList.remove('in');
    setTimeout(function () { try { o.remove(); } catch (e) {} if (extra) extra(); }, 340);
  }
  function hue(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }

  /* ---------------------------------------------------------------- 4. АВТОПЕРЕГЛЯД */
  var EMO = { 'Улюбленці': '🐶', 'Кулінарія': '🍳', 'Танці': '💃', 'Фітнес': '🏋️', 'Природа': '🌄', 'Автоогляд': '🚗', 'Ігри': '🎮', 'Кліпи': '🎵' };
  function thumb(v) {
    return '<div class="th" style="--h:' + hue(v.channel) + '"><span class="th-e">' + (EMO[v.channel] || '🎞️') + '</span>' +
      '<img alt="" loading="lazy" src="' + esc(v.thumbnail) + '" onerror="this.remove()"></div>';
  }
  window.showAutoplay = function () {
    try { hideAutoplay(); } catch (e) {}
    var v = pick(autoplayVideos), recs = shuffle(autoplayVideos.filter(function (x) { return x !== v; })).slice(0, 4);
    var o = scene('autoplayOverlay', 9997, 'ap'); try { autoplayOverlay = o; } catch (e) {}
    o.style.setProperty('--h', hue(v.channel));
    o.innerHTML =
      '<div class="ap-bg"></div><div class="ap-wrap fxs-card">' +
      '<div class="ap-top"><span class="ap-dot"></span><b>' + esc(tt('Автоперегляд')) + '</b></div>' +
      '<div class="ap-player">' + thumb(v) + '<div class="ap-time">' + esc(v.time) + '</div>' +
      '<div class="ap-count"><svg viewBox="0 0 100 100"><circle class="b" cx="50" cy="50" r="44"/><circle class="p" cx="50" cy="50" r="44" pathLength="100"/></svg><span id="apNum">5</span></div></div>' +
      '<div class="ap-info"><div class="ap-ch">' + esc(tt(v.channel)) + '</div><div class="ap-meta">' + esc(v.views) + ' ' + esc(tt('переглядів')) + ' · ' + esc(v.time) + '</div>' +
      '<div class="ap-next" id="apNext">' + esc(tt('Наступне відео через: ')) + '5 ' + esc(tt('сек')) + '</div>' +
      '<div class="ap-btns"><button class="ap-b ghost" type="button" data-a="c">' + esc(tt('Скасувати')) + '</button><button class="ap-b" type="button" data-a="g">' + esc(tt('Дивитись зараз')) + '</button></div></div>' +
      '<div class="ap-rail">' + recs.map(function (x) {
        return '<div class="ap-rec">' + thumb(x) + '<div><b>' + esc(tt(x.channel)) + '</b><small>' + esc(x.views) + ' · ' + esc(x.time) + '</small></div></div>';
      }).join('') + '</div></div>';
    o.appendChild(xbtn(function () { hideAutoplay(); }));
    [].forEach.call(o.querySelectorAll('.ap-b'), function (b) { b.addEventListener('click', function () { hideAutoplay(); }); });
    var sl = 5;
    try { clearInterval(autoplayTimeout); } catch (e) {}
    try {
      autoplayTimeout = setInterval(function () {
        sl--; var n = o.querySelector('#apNum'), nx = o.querySelector('#apNext');
        if (n) n.textContent = Math.max(sl, 0);
        if (nx) nx.textContent = tt('Наступне відео через: ') + Math.max(sl, 0) + ' ' + tt('сек');
        if (sl <= 0) { clearInterval(autoplayTimeout); hideAutoplay(); }
      }, 1000);
    } catch (e) {}
  };

  /* ---------------------------------------------------------------- 5. ПІДПИСКА */
  window.showSubscription = function () {
    var s = pick(subscriptionServices), parts = String(s.price).split('/');
    var o = scene('subscriptionOverlay', 9996, 'sb'); try { subscriptionOverlay = o; } catch (e) {}
    o.style.setProperty('--c', s.color);
    o.innerHTML =
      '<div class="sb-card fxs-card"><div class="sb-glow"></div>' +
      '<div class="sb-badge">' + esc(tt('Ексклюзивна пропозиція!')) + '</div>' +
      '<div class="sb-logo">' + s.emoji + '</div><div class="sb-name">' + esc(tt(s.name)) + '</div><div class="sb-desc">' + esc(tt(s.desc)) + '</div>' +
      '<ul class="sb-list"><li>' + esc(tt('Без реклами')) + '</li><li>' + esc(tt('Перший місяць безкоштовно')) + '</li><li>' + esc(tt('Скасувати можна будь-коли')) + '</li></ul>' +
      '<div class="sb-price"><b>' + esc(parts[0]) + '</b><span>/' + esc(parts[1] || 'міс') + '</span></div>' +
      '<div class="sb-timer" id="sbT"></div>' +
      '<button class="sb-cta" type="button">' + esc(tt('Підписатися зараз')) + '</button>' +
      '<button class="sb-later" type="button">' + esc(tt('Можливо, пізніше')) + '</button></div>';
    var iv = 0, left = 59;
    function close() { clearInterval(iv); fadeRemove(o); }
    function tick() { var e = o.querySelector('#sbT'); if (!e) return; e.textContent = tt('Пропозиція діє ще') + ' 0:' + (left < 10 ? '0' : '') + left; if (left <= 0) { e.textContent = tt('Пропозиція закінчується!'); clearInterval(iv); } left--; }
    tick(); iv = setInterval(tick, 1000);
    o.appendChild(xbtn(close));
    o.querySelector('.sb-later').addEventListener('click', close);
    o.querySelector('.sb-cta').addEventListener('click', function () { if (s.link) window.open(s.link, '_blank'); close(); });
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
  };

  /* ---------------------------------------------------------------- 6. СЕРІАЛ-МАРАФОН */
  window.showSeriesMarathon = function () {
    try { hideSeriesMarathon(); } catch (e) {}
    var o = scene('seriesOverlay', 9995, 'sr'); try { seriesOverlay = o; } catch (e) {}
    var ep = 1, season = 1 + ((Math.random() * 4) | 0);
    function src(id) { return 'https://www.youtube.com/embed/' + id + '?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&playsinline=1'; }
    o.innerHTML =
      '<div class="sr-glow"></div><div class="sr-card fxs-card">' +
      '<div class="sr-head"><span class="sr-chip">' + esc(tt('🎬 Серіал-марафон')) + '</span><span class="sr-ep" id="srEp">S' + season + ' · E' + ep + '</span></div>' +
      '<div class="sr-player"><iframe title="trailer" src="' + src(pick(seriesVideos)) + '" frameborder="0" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' +
      '<div class="sr-foot"><span>' + esc(tt('Перегляньте трейлер серіалу. Закрийте після перегляду.')) + '</span>' +
      '<button class="sr-next" type="button">' + esc(tt('Наступна серія')) + ' →</button></div></div>';
    o.appendChild(xbtn(function () { hideSeriesMarathon(); }));
    o.querySelector('.sr-next').addEventListener('click', function () {
      ep++; var fr = o.querySelector('iframe'), pl = o.querySelector('.sr-player');
      pl.classList.add('swap'); setTimeout(function () { fr.src = src(pick(seriesVideos)); pl.classList.remove('swap'); }, 220);
      o.querySelector('#srEp').textContent = 'S' + season + ' · E' + ep; vib(10);
    });
  };

  /* ---------------------------------------------------------------- 7. РОБОТА З ДЕДЛАЙНОМ */
  window.showDeadlineWork = function () {
    try { if (deadlineOverlay) deadlineOverlay.remove(); } catch (e) {}
    var o = scene('deadlineOverlay', 9994, 'dl'); try { deadlineOverlay = o; } catch (e) {}
    var target = 50; try { target = deadlineTarget; } catch (e) {}
    try { deadlineClicks = 0; deadlineTime = 10; deadlineReached = false; } catch (e) {}
    o.innerHTML =
      '<div class="dl-card fxs-card" id="deadlineContainer">' +
      '<div class="dl-title">' + esc(tt('⏰ Робота з дедлайном')) + '</div><div class="dl-desc">' + esc(tt('Зроби 50 кліків за 10 секунд!')) + '</div>' +
      '<div class="dl-ring"><svg viewBox="0 0 100 100"><circle class="b" cx="50" cy="50" r="44"/><circle class="p" cx="50" cy="50" r="44" pathLength="100"/></svg><b id="deadlineTimer">10</b></div>' +
      '<div class="dl-bar"><i id="dlFill"></i></div><div class="dl-count" id="deadlineCounter">0/' + target + ' ' + esc(tt('кліків')) + '</div>' +
      '<button class="dl-pad" type="button" aria-label="Клік"><span>👆</span></button></div>';
    o.appendChild(xbtn(function () { hideDeadlineWork(); }));
    var card = o.querySelector('#deadlineContainer'), num = o.querySelector('#deadlineTimer'), cnt = o.querySelector('#deadlineCounter'),
        fill = o.querySelector('#dlFill'), pad = o.querySelector('.dl-pad');
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var tm = 1; try { tm = deadlineTime; } catch (er) {}
      if (tm <= 0) return;
      try { deadlineClicks++; } catch (er) {}
      var c = 0; try { c = deadlineClicks; } catch (er) {}
      cnt.textContent = c + '/' + target + ' ' + tt('кліків');
      fill.style.width = Math.min(100, c / target * 100) + '%';
      pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
      var r = pad.getBoundingClientRect(); burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, 'plasma', 3); vib(6);
      if (c >= target && !card.classList.contains('done')) { try { deadlineReached = true; } catch (er) {} card.classList.add('done'); cnt.style.color = '#4ade80'; vib([20, 30, 40]); }
    });
    try { if (deadlineInterval) clearInterval(deadlineInterval); } catch (e) {}
    try {
      deadlineInterval = setInterval(function () {
        deadlineTime--; num.textContent = Math.max(deadlineTime, 0);
        if (deadlineTime <= 7) card.classList.add('hot');
        if (deadlineTime <= 3) card.classList.add('crit');
        if (deadlineTime <= 0) { clearInterval(deadlineInterval); setTimeout(function () { completeDeadline(deadlineReached); }, 100); }
      }, 1000);
    } catch (e) {}
  };

  /* ---------------------------------------------------------------- 8. ЖИТТЄВИЙ КРІНЖ */
  window.showCringe = function () {
    try { hideCringe(); } catch (e) {}
    var o = scene('cringeOverlay', 9993, 'cr'); try { cringeOverlay = o; } catch (e) {}
    var msg = tt(pick(cringeMessages)), rain = ['💀', '😳', '🫠', '🙈', '🤦', '😬', '🥴', '🫣'];
    o.innerHTML =
      '<div class="cr-vig"></div><div class="cr-rain" aria-hidden="true">' + rain.map(function (e, i) {
        return '<i style="--x:' + (6 + i * 12) + '%;--d:' + (i * .45).toFixed(2) + 's;--s:' + (22 + (i % 3) * 10) + 'px">' + e + '</i>';
      }).join('') + '</div>' +
      '<div class="cr-card fxs-card"><div class="cr-rec"><i></i> LIVE</div><div class="cr-face">😬</div>' +
      '<div class="cr-msg" data-text="' + esc(msg) + '">' + esc(msg) + '</div>' +
      '<div class="cr-sub">' + esc(tt('Ти відчуваєш крінж? Це нормально!')) + '</div>' +
      '<div class="cr-meter"><span></span></div>' +
      '<button class="cr-btn" type="button">' + esc(tt('Продовжити')) + '</button></div>';
    o.querySelector('.cr-btn').addEventListener('click', function () { try { hideCringe(); } catch (e) { o.remove(); } });
    vib([30, 40, 30]);
  };

  /* ---------------------------------------------------------------- 12. ФІЛОСОФСЬКІ РОЗДУМИ */
  window.showPhilosophy = function () {
    try { hidePhilosophy(); } catch (e) {}
    var o = scene('philosophyOverlay', 9990, 'ph'); try { philosophyOverlay = o; } catch (e) {}
    var q = tt(pick(philosophyQuotes)), text = q, who = '';
    var m = /^(.*?)\s+[-–—]\s+([^"\u201D]+)$/.exec(q); if (m) { text = m[1]; who = m[2]; }
    text = text.replace(/^["\u201C]|["\u201D]$/g, '');
    o.innerHTML =
      '<div class="ph-orb a"></div><div class="ph-orb b"></div><div class="ph-orb c"></div>' +
      '<div class="ph-card fxs-card"><div class="ph-ic">💭</div><div class="ph-mark">\u201C</div>' +
      '<div class="ph-q" aria-label="' + esc(text) + '"><span id="phT"></span><i class="ph-caret"></i></div>' +
      (who ? '<div class="ph-who">— ' + esc(who) + '</div>' : '') +
      '<div class="ph-sub">' + esc(tt('Мудрість поколінь про час...')) + '</div>' +
      '<button class="ph-btn" type="button">' + esc(tt('Прийняти мудрість')) + '</button></div>';
    var el = o.querySelector('#phT'), i = 0, speed = Math.max(14, Math.min(34, 1800 / text.length));
    var iv = setInterval(function () { if (!o.isConnected) { clearInterval(iv); return; } i++; el.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(iv); o.classList.add('typed'); } }, speed);
    o.querySelector('.ph-btn').addEventListener('click', function () { clearInterval(iv); try { hidePhilosophy(); } catch (e) { o.remove(); } });
  };

  /* ---------------------------------------------------------------- 10. REELS ДО РАНКУ */
  window.showReels = function () {
    try { hideReels(); } catch (e) {}
    var o = scene('reelsOverlay', 9991, 'rl'); try { reelsOverlay = o; } catch (e) {}
    var likes = 0, liked = false, cur = -1;
    o.innerHTML =
      '<div class="rl-phone fxs-card"><div class="rl-prog"><i></i></div><div class="rl-top">Reels 📱</div><div class="rl-feed" id="rlFeed"></div>' +
      '<div class="rl-side"><button class="rl-act" type="button" data-a="l"><span>❤️</span><small id="rlL">0</small></button>' +
      '<button class="rl-act" type="button" data-a="c"><span>💬</span><small>' + (20 + (Math.random() * 400 | 0)) + '</small></button>' +
      '<button class="rl-act" type="button" data-a="s"><span>↪️</span><small>' + esc(tt('Поділитись')) + '</small></button></div>' +
      '<div class="rl-bottom"><div class="rl-user"><i></i><b>@time.clicker</b><em>' + esc(tt('Підписатися')) + '</em></div><div class="rl-music">♫ original sound</div></div></div>';
    o.appendChild(xbtn(function () { hideReels(); }));
    var feed = o.querySelector('#rlFeed'), prog = o.querySelector('.rl-prog i'), lk = o.querySelector('#rlL');
    function slide() {
      var idx; do { idx = (Math.random() * reelsContent.length) | 0; } while (idx === cur && reelsContent.length > 1);
      cur = idx; try { reelIndex = idx; } catch (e) {}
      var txt = tt(reelsContent[idx]), em = (txt.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u) || ['🎬'])[0], cap = txt.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      var s = doc.createElement('div'); s.className = 'rl-slide'; s.style.setProperty('--h', (idx * 36 + 200) % 360);
      s.innerHTML = '<div class="rl-em">' + em + '</div><div class="rl-cap">' + esc(cap) + '</div>';
      var old = feed.querySelector('.rl-slide.cur');
      feed.appendChild(s); void s.offsetWidth; s.classList.add('cur');
      if (old) { old.classList.remove('cur'); old.classList.add('gone'); setTimeout(function () { old.remove(); }, 520); }
      liked = false; likes = 50 + ((Math.random() * 900) | 0); lk.textContent = likes; o.querySelector('[data-a="l"]').classList.remove('on');
      prog.style.animation = 'none'; void prog.offsetWidth; prog.style.animation = '';
    }
    function like(x, y) {
      var b = o.querySelector('[data-a="l"]');
      if (!liked) { liked = true; likes++; lk.textContent = likes; b.classList.add('on'); vib(8); }
      var h = doc.createElement('div'); h.className = 'rl-heart'; h.textContent = '❤️'; h.style.left = x + 'px'; h.style.top = y + 'px';
      feed.appendChild(h); setTimeout(function () { h.remove(); }, 800);
    }
    o.querySelector('[data-a="l"]').addEventListener('click', function () {
      var r = feed.getBoundingClientRect(); like(r.width - 50, r.height - 160);
    });
    var lastTap = 0, ty = null;
    feed.addEventListener('pointerdown', function (e) {
      var n = Date.now(); if (n - lastTap < 320) { var r = feed.getBoundingClientRect(); like(e.clientX - r.left, e.clientY - r.top); } lastTap = n; ty = e.clientY;
    });
    feed.addEventListener('pointerup', function (e) { if (ty !== null && ty - e.clientY > 50) { slide(); resetTimer(); } ty = null; });
    var iv;
    function resetTimer() { try { clearInterval(reelsInterval); } catch (e) {} iv = setInterval(slide, 2600); try { reelsInterval = iv; } catch (e) {} }
    slide(); resetTimer();
  };


  /* ---------------------------------------------------------------- 1. ТЕЛЕФОН: екран блокування */
  (function () {
    if (typeof window.showPhoneLockScreen !== 'function') return;
    var orig = window.showPhoneLockScreen, iv = 0;
    var NOTIF = [
      ['💬', 'Telegram', 'Мама', 'Ти де? Дедлайн горить…'], ['📸', 'Instagram', 'time.clicker', 'вподобав(ла) ваше фото'],
      ['💧', 'Нагадування', 'Випити води', 'зараз'], ['📰', 'Новини', 'Терміново', 'Час іде вперед, а ти клікаєш 😅'],
      ['🎮', 'Discord', 'Сервер', '5 нових повідомлень'], ['⏰', 'Будильник', 'Прокидайся!', 'Ти вже спізнюєшся'],
      ['🛒', 'Glovo', 'Замовлення в дорозі', 'кур\u2019єр поруч'], ['🎵', 'Spotify', 'Новий реліз', 'у вашому плейлисті']
    ];
    function two(n) { return (n < 10 ? '0' : '') + n; }
    function paint() {
      var d = new Date(), tm = two(d.getHours()) + ':' + two(d.getMinutes()), a = doc.getElementById('plTime'), b = doc.getElementById('plT0'), c = doc.getElementById('plDate');
      if (a) a.textContent = tm; if (b) b.textContent = tm;
      if (c) c.textContent = d.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    function build() {
      var s = doc.getElementById('phoneLockScreen'); if (!s) return;
      if (!s.querySelector('.pl-ui')) {
        var ui = doc.createElement('div'); ui.className = 'pl-ui';
        ui.innerHTML = '<div class="pl-shade"></div><div class="pl-island"></div><div class="pl-status"><b id="plT0">12:00</b><span>📶 🔋</span></div>' +
          '<div class="pl-clock"><div class="pl-lock">🔒</div><div class="pl-time" id="plTime">12:00</div><div class="pl-date" id="plDate"></div></div><div class="pl-notifs" id="plN"></div>';
        var img = s.querySelector('.phone-lock-image'); if (img && img.nextSibling) s.insertBefore(ui, img.nextSibling); else s.appendChild(ui);
      }
      paint();
      var box = doc.getElementById('plN'); if (!box) return; box.innerHTML = '';
      shuffle(NOTIF).slice(0, 3).forEach(function (n, i) {
        var e = doc.createElement('div'); e.className = 'pl-n'; e.style.animationDelay = (0.5 + i * 0.7) + 's';
        e.innerHTML = '<i>' + n[0] + '</i><div><small>' + esc(n[1]) + ' · ' + esc(tt('зараз')) + '</small><b>' + esc(n[2]) + '</b><span>' + esc(n[3]) + '</span></div>';
        box.appendChild(e);
      });
      clearInterval(iv);
      iv = setInterval(function () { var o = doc.getElementById('phoneLockOverlay'); if (!o || getComputedStyle(o).display === 'none') { clearInterval(iv); return; } paint(); }, 5000);
    }
    window.showPhoneLockScreen = function () { var r = orig.apply(this, arguments); try { build(); vib(20); } catch (e) {} return r; };
  })();

  /* ---------------------------------------------------------------- 3. МЕМ-ТУР: таймер на 7 с */
  (function () {
    if (typeof window.showMeme !== 'function') return;
    var orig = window.showMeme, wired = false;
    window.showMeme = function () {
      var r = orig.apply(this, arguments);
      try {
        var o = doc.getElementById('memeOverlay'), im = doc.getElementById('memeImage');
        if (o && !o.querySelector('.fx-mp')) { var p = doc.createElement('div'); p.className = 'fx-mp'; p.innerHTML = '<i></i>'; o.appendChild(p); }
        if (o) o.classList.remove('loaded');
        if (im && !wired) {
          wired = true;
          im.addEventListener('load', function () {
            var ov = doc.getElementById('memeOverlay'); if (!ov) return;
            ov.classList.remove('loaded'); void ov.offsetWidth; ov.classList.add('loaded'); vib(12);
          });
        }
      } catch (e) {}
      return r;
    };
  })();

  /* кнопки/хоткеї: Esc закриває сцену */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var map = { autoplayOverlay: 'hideAutoplay', seriesOverlay: 'hideSeriesMarathon', deadlineOverlay: 'hideDeadlineWork', cringeOverlay: 'hideCringe', philosophyOverlay: 'hidePhilosophy', reelsOverlay: 'hideReels' };
    Object.keys(map).forEach(function (id) { if (doc.getElementById(id)) { try { window[map[id]](); } catch (er) {} } });
  });
})();
