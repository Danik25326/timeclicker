/* ===== Позначки годинника (12/3/6/9 + проміжні) — окремий модуль ===== */
/* Нічого в script.js не змінює, лише додає елементи в DOM та слухає власний чекбокс. */
(function () {
  var STORAGE_KEY = 'timeClickerShowMarks';
  var ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  // Зіставляємо кути з цифрами
  var MAJOR_ANGLES = { 0: '12', 90: '3', 180: '6', 270: '9' };

  function buildMarks() {
    var frag = document.createDocumentFragment();
    ANGLES.forEach(function (angle) {
      var wrap = document.createElement('div');
      wrap.className = 'mark-wrap';
      wrap.style.transform = 'rotate(' + angle + 'deg)';

      var mark = document.createElement('div');
      
      if (MAJOR_ANGLES[angle]) {
        mark.className = 'mark major';
        
        // Додаємо саму цифру до головних позначок
        var num = document.createElement('div');
        num.className = 'mark-number';
        num.textContent = MAJOR_ANGLES[angle];
        // Розвертаємо цифру у зворотний бік, щоб вона стояла рівно, а не догори дригом
        num.style.transform = 'rotate(-' + angle + 'deg)';
        mark.appendChild(num);
      } else {
        mark.className = 'mark minor';
      }

      wrap.appendChild(mark);
      frag.appendChild(wrap);
    });
    return frag;
  }

  function injectMarks(clockEl) {
    if (!clockEl || clockEl.querySelector(':scope > .clock-marks')) return;
    var container = document.createElement('div');
    container.className = 'clock-marks';
    container.setAttribute('aria-hidden', 'true');
    container.appendChild(buildMarks());
    clockEl.insertBefore(container, clockEl.firstChild);
  }

  function syncMarkColors() {
    document.querySelectorAll('.clock').forEach(function (clockEl) {
      var color = "";
      
      // Перевіряємо глобальну змінну скінів з script.js для точного збігу кольорів
      if (window.current && window.current.clock) {
        var c = window.current.clock;
        color = c === "neon-blue" ? "#0ea5e9" : c === "purple" ? "#8b5cf6" : c === "pink" ? "#ec4899" : "#111";
      } else {
        // Безпечний фолбек
        color = clockEl.style.borderColor || getComputedStyle(clockEl).borderTopColor;
      }

      if (color) {
        clockEl.style.setProperty('--mark-color', color);
      }
    });
  }

  function applyVisibility(show) {
    document.body.classList.toggle('marks-hidden', !show);
  }

  function getSavedPreference() {
    var saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === '1';
  }

  function wireCheckbox(show) {
    var checkbox = document.getElementById('showClockMarks');
    if (!checkbox) return;
    checkbox.checked = show;
    checkbox.addEventListener('change', function () {
      applyVisibility(this.checked);
      localStorage.setItem(STORAGE_KEY, this.checked ? '1' : '0');
    });
  }

  function hookSkinChanges() {
    // Підхоплюємо зміну кольору з applyAllSkins() без редагування script.js
    if (typeof window.applyAllSkins === 'function' && !window.applyAllSkins.__marksPatched) {
      var original = window.applyAllSkins;
      window.applyAllSkins = function () {
        var result = original.apply(this, arguments);
        syncMarkColors();
        return result;
      };
      window.applyAllSkins.__marksPatched = true;
    }
  }

  function init() {
    injectMarks(document.getElementById('clickableClock'));
    injectMarks(document.getElementById('reverbClock'));
    syncMarkColors();
    hookSkinChanges();

    var show = getSavedPreference();
    applyVisibility(show);
    wireCheckbox(show);

    // Періодична підстраховка на випадок перебудови DOM (скидання прогресу тощо)
    setInterval(function () {
      injectMarks(document.getElementById('clickableClock'));
      injectMarks(document.getElementById('reverbClock'));
      syncMarkColors();
      hookSkinChanges();
    }, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
