/* scenes.js v5 — сучасні версії «сцен» апгрейдів (та сама ідея, новий вигляд).
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


  /* =====================================================================
     DISCORD: живий чат на Groq (модель openai/gpt-oss-120b)
       • #барабулька — розмова з пам'яттю (поки апгрейд відкритий; при виході пам'ять стирається)
       • інші канали — ШІ пише репліки вигаданих користувачів за темою каналу
       • БЮДЖЕТ ТОКЕНІВ: ліміт Groq — 8000 токенів/хв і 200K/день на ВЕСЬ ключ.
         45% хвилинного ліміту — тільки Барабульці, 45% — тільки фоновому чату, 10% запас.
         Чат не може «позичити» токени в Барабульки, тож розмова з нею не страждає.
       • Чат неспішний (як у людей): ~3 репліки раз на 45–75 с, між репліками 4–9 с.
       • Коли бюджет/ліміт вичерпано — запасні локальні репліки, чат не «вмирає».
     ===================================================================== */
  (function () {
    var KEY = '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';   // ← ключ Groq (вшитий свідомо)
    var MODEL = 'openai/gpt-oss-120b';
    var API = 'https://api.groq.com/openai/v1/chat/completions';
    var LIM = {
      tpm: 8000,                                   // ліміт Groq: токенів на хвилину (на весь ключ)
      share: { chat: 0.45, ai: 0.45 },             // частки хвилинного ліміту (решта 10% — запас)
      dayTokens: { chat: 30000, ai: 70000 },       // макс. токенів за добу НА ОДИН БРАУЗЕР (у Groq 200K на весь ключ)
      bgEvery: [45000, 75000],                     // пауза між фоновими «пачками» чату
      bgEveryAI: [90000, 140000],                  // ... коли ви говорите з Барабулькою (чат тихіший)
      localEvery: [60000, 90000],                  // пауза між запасними локальними репліками
      gap: [4000, 9000],                           // пауза між репліками «живих» користувачів
      replyGap: [3000, 6000],                      // ... коли вони відповідають вам
      seedMin: 40000,                              // «стартова» пачка нового каналу — не частіше ніж раз на 40 с
      replyMin: 10000,                             // ШІ-відповідь на ваше повідомлення — не частіше ніж раз на 10 с
      aiHistMsgs: 10, aiHistChars: 2600,           // скільки пам'яті передаємо Барабульці
      aiMax: 450, chatMax: 420                     // макс. токенів відповіді
    };
    if (typeof showDiscord !== 'function') return;

    var PERS = [
      { n: 'GamerGirl',   c: '#EB459E', d: 'енергійна геймерка, любить інді й шутери, багато жартує' },
      { n: 'StreamerBoy', c: '#FEE75C', d: 'стрімер, балакучий, любить розповідати історії зі стрімів' },
      { n: 'ProPlayer',   c: '#57F287', d: 'досвідчений гравець, дає чіткі поради, трохи зверхній, але добрий' },
      { n: 'NoobMaster',  c: '#ED4245', d: 'новачок, ставить багато питань, смішно помиляється' },
      { n: 'TechGuru',    c: '#00B0F4', d: 'технар: залізо, код, гаджети, ШІ' },
      { n: 'NightOwl',    c: '#B388FF', d: 'нічна пташка, філософствує, любить музику й дивні факти' }
    ];
    var BYNAME = {}; PERS.forEach(function (p) { BYNAME[p.n] = p; });
    var TOPIC = {
      general: 'загальна балачка: настрій, новини дня, музика, меми, плани на вихідні, їжа, а ще гра Times Clicker (клікер про час) та її апгрейди',
      games: 'відеоігри: новинки, поради, боси, інді, кооператив, мобільні ігри, кіберспорт',
      tech: 'технології: залізо, смартфони, програмування, штучний інтелект, оптимізація, ОС, гаджети',
      reality: 'реальне життя: навчання, робота, час і тайм-менеджмент, звички, подорожі, цікаві історії'
    };
    var TEXT = ['general', 'games', 'tech', 'reality'];
    var BARABULKA = 'Ти — Барабулька, дружній жартівливий український ШІ-помічник у Discord-чаті гри Times Clicker (клікер про час). ' +
      'Відповідай українською, живо, зазвичай 1–4 речення; можеш пояснювати, жартувати, допомагати з іграми, технологіями, навчанням і життям. ' +
      'Пам\u2019ятай, про що ви говорили в цій розмові, і враховуй це. Не вигадуй фактів: якщо не знаєш — чесно скажи.';

    var alive = false, extras = true, tokKey = 'max_completion_tokens', coolUntil = 0, estChat = 800;
    var spent = { chat: [], ai: [] }, convo = [], hist = {}, seeded = {}, busy = {}, nextBg = 0, lastCh = [], lastSeed = 0, lastReply = 0, foot = null;
    var day = (function () {
      var d = new Date().toISOString().slice(0, 10), o = { d: d, n: 0, tok: { chat: 0, ai: 0 } };
      try { var j = JSON.parse(localStorage.getItem('fxDiscordDay') || 'null'); if (j && j.d === d && j.tok) o = j; } catch (e) {}
      return o;
    })();
    function saveDay() { try { localStorage.setItem('fxDiscordDay', JSON.stringify(day)); } catch (e) {} }
    function now() { return Date.now(); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function R(a) { return rnd(a[0], a[1]); }

    /* ---------- токенний бюджет ---------- */
    function used(k) { var t = now(); spent[k] = spent[k].filter(function (x) { return t - x.t < 60000; }); return spent[k].reduce(function (a, x) { return a + x.n; }, 0); }
    function cap(k) { return LIM.tpm * LIM.share[k]; }
    function dayLeft(k) { return LIM.dayTokens[k] - day.tok[k]; }
    function canSpend(k, est) { return now() >= coolUntil && used(k) + est <= cap(k) && dayLeft(k) >= est; }
    function record(k, n) { spent[k].push({ t: now(), n: n }); day.tok[k] += n; day.n++; saveDay(); }
    function waitSec(k, est) {                       // скільки секунд чекати, поки звільниться місце в хвилинному бюджеті
      var t = now(), need = used(k) + est - cap(k), acc = 0, arr = spent[k].slice().sort(function (a, b) { return a.t - b.t; });
      for (var i = 0; i < arr.length; i++) { acc += arr[i].n; if (acc >= need) return Math.max(1, Math.ceil((arr[i].t + 60000 - t) / 1000)); }
      return 5;
    }
    async function waitBudget(k, est, maxMs) {
      var t0 = now();
      while (true) {
        if (dayLeft(k) < est) return { ok: false, reason: 'day' };
        if (canSpend(k, est)) return { ok: true };
        var w = Math.max(waitSec(k, est) * 1000, coolUntil - now());
        if (now() - t0 + Math.min(w, 2000) > maxMs) return { ok: false, reason: 'wait', sec: Math.ceil(w / 1000) };
        await sleep(Math.min(w, 2000)); if (!alive) return { ok: false, reason: 'closed' };
      }
    }

    /* ---------- запит до Groq ---------- */
    async function groq(messages, o) {
      o = o || {};
      var body = { model: MODEL, messages: messages, temperature: o.temp == null ? 0.9 : o.temp };
      if (extras) { body.reasoning_effort = 'low'; body.include_reasoning = false; }
      body[tokKey] = o.max || 400;
      for (var attempt = 0; attempt < 3; attempt++) {
        var ac = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = setTimeout(function () { if (ac) ac.abort(); }, 22000);
        try {
          var r = await fetch(API, { method: 'POST', headers: { 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ac ? ac.signal : undefined });
          clearTimeout(tm);
          if (r.status === 429) { var ra = parseFloat(r.headers.get('retry-after')) || 30; coolUntil = now() + Math.min(ra, 120) * 1000; return { error: 'rate', wait: Math.ceil(ra) }; }
          if (r.status === 401 || r.status === 403) return { error: 'auth' };
          if (r.status === 400) {
            var tx = await r.text();
            if (extras && /reasoning/i.test(tx)) { extras = false; delete body.reasoning_effort; delete body.include_reasoning; continue; }
            if (tokKey === 'max_completion_tokens' && /max_completion_tokens/i.test(tx)) { delete body.max_completion_tokens; tokKey = 'max_tokens'; body.max_tokens = o.max || 400; continue; }
            return { error: 'bad', message: tx.slice(0, 120) };
          }
          if (!r.ok) { if (r.status >= 500 && attempt < 2) { await sleep(1200); continue; } return { error: 'http', status: r.status }; }
          var j = await r.json();
          var tokUsed = (j.usage && j.usage.total_tokens) || o.est || 800;
          record(o.kind || 'chat', tokUsed);
          if (o.kind === 'chat') estChat = Math.round(estChat * 0.6 + tokUsed * 0.4);
          var rem = parseInt(r.headers.get('x-ratelimit-remaining-tokens'), 10);
          if (rem >= 0 && rem < 800) coolUntil = Math.max(coolUntil, now() + 12000);
          var m = j.choices && j.choices[0] && j.choices[0].message;
          return { text: String((m && m.content) || '').trim() };
        } catch (e) {
          clearTimeout(tm);
          if (attempt < 2) { await sleep(1000 * (attempt + 1)); continue; }
          return { error: 'net' };
        }
      }
      return { error: 'net' };
    }

    /* ---------- Барабулька (розмова з пам'яттю на час сесії; бюджет — окремий від чату) ---------- */
    function convoChars() { return convo.reduce(function (a, m) { return a + m.content.length; }, 0); }
    window.generateAIResponseDirect = async function (u) {
      convo.push({ role: 'user', content: u });
      while (convo.length > LIM.aiHistMsgs || (convoChars() > LIM.aiHistChars && convo.length > 1)) convo.shift();
      var est = Math.ceil((BARABULKA.length + convoChars()) / 3.2) + LIM.aiMax;
      var w = await waitBudget('ai', est, 25000);
      if (!w.ok) {
        convo.pop();
        return { error: 'api_fail', message: w.reason === 'day' ? 'На сьогодні ліміт розмов з Барабулькою вичерпано — продовжимо завтра' :
                 w.reason === 'closed' ? '' : 'Ліміт токенів на хвилину — спробуй ще раз за ~' + w.sec + ' с' };
      }
      var r = await groq([{ role: 'system', content: BARABULKA }].concat(convo), { kind: 'ai', max: LIM.aiMax, temp: 0.8, est: est });
      if (r.error || !r.text) {
        convo.pop();
        var msg = r.error === 'rate' ? 'Забагато запитів — спробуй за ' + r.wait + ' с' :
                  r.error === 'auth' ? 'Ключ Groq не приймається' : r.error === 'http' ? 'Сервер відповів ' + r.status :
                  r.error === 'net' ? 'Немає зв\u2019язку, спробуй ще раз' : 'Спробуйте ще раз';
        return { error: 'api_fail', message: msg };
      }
      convo.push({ role: 'assistant', content: r.text });
      return r.text;
    };

    /* ---------- «живий» чат у тематичних каналах ---------- */
    var LOCAL = {
      general: [['Хто що слухає сьогодні?', 'Зараз крутиться один плейлист на повторі 🎧'], ['Як у вас день?', 'Нормально, але час летить як шалений 😅'], ['Коли вихідні вже?', 'Ще далеко, тримаймось ☕']],
      games: [['Як пройти останнього боса?', 'Не лізь у ближній бій, бий здалеку.'], ['Є що пограти вечором?', 'Спробуй якусь інді, там часто дуже круті ідеї.'], ['Шукаю напарника в коопі', 'О, я в ділі, пиши в особисті!']],
      tech: [['Який ПК зараз брати?', 'Дивись на відеокарту й оперативку, решта — вторинне.'], ['Чому лагає на телефоні?', 'Закрий фонові вкладки й вимкни зайві анімації.'], ['Хтось пробував локальні ШІ-моделі?', 'Так, на хорошій відеокарті цілком реально.']],
      reality: [['Як ви плануєте день?', 'Я розбиваю на маленькі кроки, так легше починати.'], ['Як перестати відкладати справи?', 'Пообіцяй собі лише 5 хвилин — далі втягується.'], ['Куди поїхати відпочити?', 'У гори! Тиша і повітря, краще за будь-який екран.']]
    };
    function pickPers(n, must) {
      var a = PERS.slice().sort(function () { return Math.random() - .5; });
      if (must) { a = a.filter(function (p) { return p.n !== must; }); a.unshift(BYNAME[must]); }
      return a.slice(0, n);
    }
    function plain(h) { return h.map(function (x) { return x.u + ': ' + x.m; }).join('\n'); }
    function prompt(ch, opt) {
      var last = (hist[ch] || []).slice(-1)[0], act = pickPers(4, last && BYNAME[last.u] ? last.u : null);
      var sys = 'Ти симулюєш живий український Discord-чат (розмовна мова, трохи сленгу й емодзі, без образ і лінків). Канал: ' + TOPIC[ch] + '.\n' +
        'Учасники (вигадані): ' + act.map(function (p) { return p.n + ' — ' + p.d; }).join('; ') + '.\n' +
        'Напиши ' + (opt.n || 3) + ' наступні репліки переписки: різні учасники, по 1–2 короткі речення, природно. ' +
        'Хтось ставить питання — інший відповідає; можна жартувати, сперечатися, ділитись історією. Не повторюй сказане раніше.' +
        (opt.user ? ' Користувач «Ви» щойно написав у чаті — відреагуй саме на це (звертайся до нього).' : '') +
        '\nВідповідь — ЛИШЕ JSON-масив: [{"u":"Ім\u2019я","m":"текст"}]. Імена тільки зі списку учасників.';
      var h = (hist[ch] || []).slice(-6);
      return [{ role: 'system', content: sys }, { role: 'user', content: h.length ? 'Останні повідомлення:\n' + plain(h) : 'Чат щойно відкрили — почни природну розмову за темою каналу.' }];
    }
    function parse(txt) {
      var m = String(txt).match(/\[[\s\S]*\]/); if (!m) return [];
      var a; try { a = JSON.parse(m[0]); } catch (e) { return []; }
      if (!Array.isArray(a)) return [];
      return a.filter(function (x) { return x && BYNAME[x.u] && typeof x.m === 'string' && x.m.trim(); }).slice(0, 4)
              .map(function (x) { return { u: x.u, m: x.m.trim().slice(0, 260) }; });
    }
    function localLines(ch, userTxt) {
      var ps = pickPers(2);
      if (userTxt) {
        var q = /\?/.test(userTxt), A = q ? ['Гарне питання! Я б спробував так і подивився, що вийде.', 'Хм, залежить від ситуації, але загалом — так.', 'Хтось тут точно знає краще, але мій варіант — спробувати.']
                                          : ['Круто сказано 👍', 'Ха, я теж так думаю', 'Цікаво! Розкажи більше?', 'Не згоден, але аргумент прийнятий 😄'];
        return [{ u: ps[0].n, m: A[(Math.random() * A.length) | 0] }, { u: ps[1].n, m: 'А я б додав: ' + (LOCAL[ch] ? LOCAL[ch][(Math.random() * 3) | 0][1] : 'спробуй і розкажеш!') }];
      }
      var pr = (LOCAL[ch] || LOCAL.general)[(Math.random() * 3) | 0];
      return [{ u: ps[0].n, m: pr[0] }, { u: ps[1].n, m: pr[1] }];
    }
    function ensureFoot() {
      var m = document.getElementById('discordMessages'); if (!m) return null;
      if (!foot || !foot.isConnected) {
        foot = document.createElement('div'); foot.className = 'fx-foot';
        foot.innerHTML = '<span class="fx-typing"></span><span class="fx-quota"></span>';
        m.parentNode.insertBefore(foot, m.nextSibling);
      }
      return foot;
    }
    function setTyping(ch, who) {
      var f = ensureFoot(); if (!f) return;
      f.querySelector('.fx-typing').textContent = (who && currentDiscordChannel === ch) ? '✍️ ' + who + ' друкує…' : '';
    }
    function pct(k) { return Math.min(100, Math.round(used(k) / cap(k) * 100)); }
    function renderQuota() {
      var f = ensureFoot(); if (!f) return;
      var q = f.querySelector('.fx-quota');
      q.innerHTML = '⚡ Барабулька <b>' + pct('ai') + '%</b> · чат <b>' + pct('chat') + '%</b>';
      q.title = 'Токени за хвилину: ' + used('ai') + '/' + cap('ai') + ' (Барабулька), ' + used('chat') + '/' + cap('chat') + ' (чат).\n' +
        'Сьогодні в цьому браузері: Барабулька ' + day.tok.ai + '/' + LIM.dayTokens.ai + ', чат ' + day.tok.chat + '/' + LIM.dayTokens.chat + ' токенів.' +
        (now() < coolUntil ? '\nПауза через ліміт Groq: ' + Math.ceil((coolUntil - now()) / 1000) + ' с' : '');
    }
    function push(ch, u, m, color, mine) {
      (hist[ch] = hist[ch] || []).push({ u: u, m: m }); if (hist[ch].length > 30) hist[ch].shift();
      addMessageToChannel(ch, esc(u), esc(m), color);
      if (mine) { var box = document.getElementById('discordMessages'); if (box && box.lastChild && currentDiscordChannel === ch) box.lastChild.classList.add('fx-me'); }
    }
    async function play(ch, lines, gap, reply) {
      for (var i = 0; i < lines.length; i++) {
        if (!alive) return;
        var L = lines[i]; setTyping(ch, L.u);
        await sleep(Math.max(900, Math.min(2800, 600 + L.m.length * 30)) + (i === 0 && reply ? 0 : 0));
        if (!alive) return; setTyping(ch, '');
        push(ch, L.u, L.m, BYNAME[L.u].c);
        if (i < lines.length - 1) await sleep(R(gap));            // неспішний темп, як у людей
      }
    }
    async function batch(ch, o) {
      o = o || {};
      while (busy[ch]) { await sleep(400); if (!alive) return; }
      busy[ch] = true;
      try {
        var lines = [];
        if (!o.noAI && canSpend('chat', Math.round(estChat * 1.15))) {
          var r = await groq(prompt(ch, o), { kind: 'chat', max: LIM.chatMax, temp: 0.95, est: estChat });
          if (r.text) lines = parse(r.text);
        }
        if (!lines.length) lines = localLines(ch, o.userTxt);
        if (!alive) return;
        await play(ch, lines, o.user ? LIM.replyGap : LIM.gap, !!o.user);
      } catch (e) {} finally { busy[ch] = false; setTyping(ch, ''); }
    }
    function userSay(ch, txt) {
      push(ch, tt('Ви'), txt, '#8EA2FF', true);
      var ai = now() - lastReply >= LIM.replyMin; lastReply = now();    // не частіше ніж раз на 10 с «платна» відповідь
      batch(ch, { user: true, userTxt: txt, n: 3, noAI: !ai });
    }
    async function askBarabulka(txt) {
      var inp = document.querySelector('#discordOverlay input[type="text"]');
      addMessageToChannel('ai', esc(tt('Ви')), esc(txt), '#8EA2FF');
      var box = document.getElementById('discordMessages'); if (box && box.lastChild) box.lastChild.classList.add('fx-me');
      if (inp) inp.disabled = true; setTyping('ai', tt('Барабулька'));
      var ans = await window.generateAIResponseDirect(txt);
      setTyping('ai', '');
      if (!alive) return;
      if (ans && ans.error) { if (ans.message) addMessageToChannel('ai', esc(tt('Барабулька')), esc(tt('Помилка: ') + ans.message), '#FF4444'); }
      else addMessageToChannel('ai', esc(tt('Барабулька')), esc(ans), '#00FFAA');
      if (inp) { inp.disabled = false; try { inp.focus(); } catch (e) {} }
    }

    /* ---------- фонова активність (замість шаблонних фраз) ---------- */
    window.startDiscordActivity = function () {
      try { if (discordActivityInterval) clearInterval(discordActivityInterval); } catch (e) {}
      nextBg = now() + 20000;
      try {
        discordActivityInterval = setInterval(function () {
          renderQuota();
          if (!alive || !discordOverlay || document.hidden || now() < nextBg) return;
          var ch;
          for (var k = 0; k < 6; k++) { ch = TEXT[(Math.random() * TEXT.length) | 0]; if (lastCh.indexOf(ch) < 0) break; }
          lastCh.push(ch); if (lastCh.length > 2) lastCh.shift();
          var ai = canSpend('chat', Math.round(estChat * 1.15));
          nextBg = now() + (!ai ? R(LIM.localEvery) : (currentDiscordChannel === 'ai' ? R(LIM.bgEveryAI) : R(LIM.bgEvery)));
          batch(ch, { bg: true, n: 3, noAI: !ai });
        }, 1000);
      } catch (e) {}
    };

    /* ---------- обгортки навколо функцій гри ---------- */
    var oShow = window.showDiscord, oSwitch = window.switchDiscordChannel, oHide = window.hideDiscord;
    function renderMsg(box, msg) {
      var md = document.createElement('div');
      md.style.cssText = 'margin-bottom:20px;padding:10px;background:rgba(0,0,0,0.5);border-radius:8px;border-left:4px solid ' + msg.color + ';animation:fadeIn 0.3s ease;';
      md.innerHTML = '<div style="display:flex;align-items:center;margin-bottom:5px;"><div style="width:32px;height:32px;background:' + msg.color + ';border-radius:50%;margin-right:10px;display:flex;align-items:center;justify-content:center;font-weight:bold;">' +
        String(msg.user).replace(/&[a-z]+;/g, '?').charAt(0) + '</div><div><span style="color:' + msg.color + ';font-weight:bold;">' + msg.user + '</span><span style="color:#72767d;font-size:12px;margin-left:10px;">' + msg.time +
        '</span></div></div><div style="color:#dcddde;padding-left:42px;font-size:14px;">' + msg.message + '</div>';
      if (msg.user === esc(tt('Ви'))) md.classList.add('fx-me');
      box.appendChild(md);
    }
    window.showDiscord = function () {
      if (discordOverlay) return;
      try { userGroqApiKey = KEY; } catch (e) {}
      alive = true; convo = []; hist = {}; seeded = {}; busy = {}; lastCh = []; foot = null; lastSeed = 0; lastReply = 0;
      var r = oShow.apply(this, arguments);
      try {
        var gm = (discordChannelMessages.general || []);
        hist.general = gm.map(function (x) { return { u: x.user, m: String(x.message).replace(/<[^>]*>/g, '') }; });
        var inp = discordOverlay.querySelector('input[type="text"]'), btn = inp && inp.parentNode.querySelector('button');
        if (btn) btn.onclick = function () {
          var txt = inp.value.trim(); if (!txt) return;
          var ch = currentDiscordChannel; if (ch === 'voice' || inp.disabled) return;
          inp.value = '';
          if (ch === 'ai') askBarabulka(txt); else userSay(ch, txt);
        };
        // ВАЖЛИВО: оригінал мав  onkeydown=(e)=>e.key==='Enter'&&sb.click()  — для будь-якої клавіші, крім Enter,
        // це повертає false, а false з onkeydown СКАСОВУЄ натискання → текст не вводився взагалі.
        inp.onkeydown = function (e) {
          if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (btn) btn.click(); }   // нічого не повертаємо
        };
        renderQuota();
      } catch (e) {}
      return r;
    };
    window.switchDiscordChannel = function (cid) {
      var r = oSwitch.apply(this, arguments);
      if (!alive) return r;
      try {
        setTyping(cid, '');
        if (cid === 'reality') {                       // ключ більше не потрібен — це звичайний тематичний канал
          var box = document.getElementById('discordMessages'), inp = document.querySelector('#discordOverlay input[type="text"]');
          if (box) { box.innerHTML = ''; (discordChannelMessages.reality || []).forEach(function (m) { renderMsg(box, m); }); box.scrollTop = box.scrollHeight; }
          if (inp) { inp.disabled = false; inp.placeholder = tt('Напишіть повідомлення...'); }
        }
        if (TEXT.indexOf(cid) > -1 && !seeded[cid]) {
          seeded[cid] = true;
          var cheap = now() - lastSeed < LIM.seedMin; lastSeed = now();    // не частіше ніж раз на 40 с «платна» стартова пачка
          setTimeout(function () { if (alive) batch(cid, { n: 3, noAI: cheap }); }, 600);
        }
        renderQuota();
      } catch (e) {}
      return r;
    };
    window.hideDiscord = function () {
      alive = false; convo = []; hist = {}; seeded = {}; busy = {};        // сесія стирається — Барабулька «забуває» розмову
      try { if (foot) foot.remove(); } catch (e) {} foot = null;
      return oHide.apply(this, arguments);
    };
    window.__fxDc = { LIM: LIM, day: day, used: used, cap: cap, canSpend: canSpend, state: function () { return { estChat: estChat, coolUntil: coolUntil, spent: spent }; } };
  })();

  /* кнопки/хоткеї: Esc закриває сцену */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var map = { autoplayOverlay: 'hideAutoplay', seriesOverlay: 'hideSeriesMarathon', deadlineOverlay: 'hideDeadlineWork', cringeOverlay: 'hideCringe', philosophyOverlay: 'hidePhilosophy', reelsOverlay: 'hideReels' };
    Object.keys(map).forEach(function (id) { if (doc.getElementById(id)) { try { window[map[id]](); } catch (er) {} } });
  });
})();
