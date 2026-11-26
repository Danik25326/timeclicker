/* mobile.js v1 — туторіал для телефонів + захист від збоїв при масштабуванні.
   Підключається ПІСЛЯ script.js. script.js не змінюється — функції туторіалу підміняються тут.
   Що виправлено:
     • вікно туторіалу більше НЕ перекриває виділений елемент (особливо годинник на кроці «натисни»):
       воно стає знизу або зверху — де більше місця — і не вище за вільну область;
     • довгий текст прокручується всередині вікна, а не виходить за екран;
     • підсвічений елемент не «ламає» верстку (раніше йому завжди ставили position:relative);
     • повторний запуск туторіалу починається з чистого стану. */
(function () {
  'use strict';
  var doc = document, body = doc.body;
  function $(x) { return doc.getElementById(x); }
  function mob() { return body.classList.contains('mobile-version') || window.innerWidth < 760; }

  function clearHL() {
    [].forEach.call(doc.querySelectorAll('.highlighted-step'), function (e) {
      e.classList.remove('highlighted-step');
      e.style.position = (e.dataset.fxPos && e.dataset.fxPos !== '-') ? e.dataset.fxPos : '';
      e.style.zIndex = (e.dataset.fxZ && e.dataset.fxZ !== '-') ? e.dataset.fxZ : '';
      delete e.dataset.fxPos; delete e.dataset.fxZ;
    });
  }
  function hl(el) {
    el.classList.add('highlighted-step');
    el.dataset.fxPos = el.style.position || '-'; el.dataset.fxZ = el.style.zIndex || '-';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';   // fixed/absolute/sticky не чіпаємо
    el.style.zIndex = '15001';
  }

  /* розмістити вікно там, де воно не закриває виділене */
  function place() {
    var dia = $('tutorialDialogue'); if (!dia || dia.style.display === 'none') return;
    dia.classList.remove('fx-at-top', 'fx-at-bottom'); dia.style.maxHeight = '';
    if (!mob()) return;
    var vh = window.innerHeight, hs = doc.querySelector('.highlighted-step'), spaceTop = vh * .5, spaceBottom = vh * .5;
    if (hs) {
      var r = hs.getBoundingClientRect(), vt = Math.max(0, r.top), vb = Math.min(vh, r.bottom);
      if (vb > vt) { spaceTop = vt; spaceBottom = vh - vb; }
    }
    var bottom = spaceBottom >= spaceTop, free = bottom ? spaceBottom : spaceTop;
    dia.classList.add(bottom ? 'fx-at-bottom' : 'fx-at-top');
    dia.style.maxHeight = Math.max(120, Math.min(vh * 0.42, free - 14)) + 'px';
  }
  function progress(idx) {
    var dia = $('tutorialDialogue'); if (!dia) return;
    var p = $('fxTutProg');
    if (!p) { p = doc.createElement('div'); p.id = 'fxTutProg'; dia.insertBefore(p, dia.firstChild); }
    try { p.textContent = (idx + 1) + ' / ' + tutorialSteps.length; } catch (e) {}
  }

  if (typeof window.showTutorialStep === 'function') {
    window.showTutorialStep = function (idx) {
      if (idx >= tutorialSteps.length) { endTutorial(); return; }
      var step = tutorialSteps[idx];
      clearHL();
      if (step.tab) { var b = doc.querySelector("button[data-tab='" + step.tab + "']"); if (b) b.click(); }
      var dia = $('tutorialDialogue'); dia.classList.toggle('dialogue-top', step.pos === 'top');
      if (step.el) {
        var el = doc.querySelector(step.el);
        if (el) { hl(el); try { el.scrollIntoView({ behavior: 'auto', block: mob() ? 'nearest' : 'center' }); } catch (e) {} }
      }
      $('tutorialBackBtn').style.display = idx > 0 ? 'inline-block' : 'none';
      $('tutorialNextBtn').style.display = 'none';
      $('tutorialNextBtn').textContent = step.action === 'finish' ? t('Закінчити туторіал') : t('Продовжити');
      $('tutorialBackBtn').textContent = t('Назад'); $('tutorialBackBtn').onclick = prevTutorialStep;
      $('skipTutorialTopBtn').textContent = t('Скіпнути туторіал');
      progress(idx);
      typeText(t(step.text), function () { onStepTextComplete(); place(); });
      place(); setTimeout(place, 80); setTimeout(place, 420);
    };
  }
  if (typeof window.startTutorial === 'function') {
    var os = window.startTutorial;
    window.startTutorial = function () {                      // чистий старт (особливо при повторному проході)
      clearHL();
      try { clearTimeout(typewriterTimeout); isTextTyping = false; } catch (e) {}
      var dia = $('tutorialDialogue'); if (dia) { dia.classList.remove('dialogue-top', 'fx-at-top', 'fx-at-bottom'); dia.style.maxHeight = ''; }
      var tx = $('tutorialText'); if (tx) tx.innerHTML = '';
      var c = $('clickableClock'); if (c) { c.onclick = null; c.classList.remove('click-effect-neon'); }
      return os.apply(this, arguments);
    };
  }
  if (typeof window.endTutorial === 'function') {
    var oe = window.endTutorial;
    window.endTutorial = function () {
      clearHL(); var c = $('clickableClock'); if (c) { c.onclick = null; c.classList.remove('click-effect-neon'); }
      var r = oe.apply(this, arguments); var dia = $('tutorialDialogue'); if (dia) { dia.classList.remove('fx-at-top', 'fx-at-bottom'); dia.style.maxHeight = ''; } return r;
    };
  }
  var rt = 0;
  function again() { clearTimeout(rt); rt = setTimeout(place, 120); }
  window.addEventListener('resize', again); window.addEventListener('orientationchange', again);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', again);
})();
