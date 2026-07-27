/* ===== Позначки годинника (60 хвилин + цифри + розумна геометрія) ===== */
(function () {
  var STORAGE_KEY = 'timeClickerShowMarks';

  function buildMarks() {
    var frag = document.createDocumentFragment();
    // Генеруємо 60 поділок (на кожну хвилину)
    for (let i = 0; i < 60; i++) {
      let angle = i * 6; // 360 градусів / 60 = 6 градусів на крок
      var wrap = document.createElement('div');
      wrap.className = 'mark-wrap';
      wrap.dataset.angle = angle;
      wrap.style.transform = 'rotate(' + angle + 'deg)';

      if (angle % 90 === 0) {
        // Кожні 90 градусів (12, 3, 6, 9 годин) - ТІЛЬКИ ЦИФРА, без рисочки
        var num = document.createElement('div');
        num.className = 'mark-number';
        num.textContent = angle === 0 ? 12 : angle / 30;
        // Розвертаємо цифру назад, щоб вона не стояла догори дригом
        num.style.transform = 'translate(-50%, -50%) rotate(-' + angle + 'deg)';
        wrap.appendChild(num);
      } else if (angle % 30 === 0) {
        // Кожні 30 градусів (5 хвилин) - ВЕЛИКА РИСОЧКА
        var markMajor = document.createElement('div');
        markMajor.className = 'mark major';
        wrap.appendChild(markMajor);
      } else {
        // Усі інші - МАЛЕНЬКІ РИСОЧКИ (хвилини)
        var markMinor = document.createElement('div');
        markMinor.className = 'mark minor';
        wrap.appendChild(markMinor);
      }

      frag.appendChild(wrap);
    }
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

  function syncMarks() {
    var color = "";
    var shape = "round";
    
    // Беремо поточний скін і форму безпосередньо з гри
    if (window.current) {
      if (window.current.clock) {
        var c = window.current.clock;
        color = c === "neon-blue" ? "#0ea5e9" : c === "purple" ? "#8b5cf6" : c === "pink" ? "#ec4899" : "#111";
      }
      if (window.current.shape) {
        shape = window.current.shape;
      }
    }

    document.querySelectorAll('.clock').forEach(function (clockEl) {
      if (!color) color = clockEl.style.borderColor || getComputedStyle(clockEl).borderTopColor;
      if (color) clockEl.style.setProperty('--mark-color', color);
      
      var marks = clockEl.querySelectorAll('.mark-wrap');
      marks.forEach(function (wrap) {
        var angle = parseFloat(wrap.dataset.angle);
        var rad = angle * Math.PI / 180;
        var absSin = Math.abs(Math.sin(rad));
        var absCos = Math.abs(Math.cos(rad));
        var r = 1; // За замовчуванням коло
        
        // --- МАГІЯ ГЕОМЕТРІЇ ---
        // Вираховуємо віддаленість від центру, щоб вписатись у фігуру
        if (shape === 'square') {
          r = 1 / Math.max(absSin, absCos);
        } else if (shape === 'diamond') {
          r = 1 / (absSin + absCos);
        } else if (shape === 'oval') {
          r = 1; // Овал - це просто здавлене коло, r=1 виглядає найкраще
        }
        
        var baseRadius = 43; // Відсоток віддаленості від центру (залишає 7% на відступ від краю)
        var radius = baseRadius * r;
        var top = 50 - radius;
        
        // Анімовано змінюємо відступ зверху, змушуючи рисочки "перетікати" в нову форму
        var child = wrap.firstElementChild;
        if (child) {
          child.style.top = top + '%';
        }
      });
    });
  }

  function applyVisibility(show) {
    document.body.classList.toggle('marks-hidden', !show);
  }

  function getSavedPreference() {
    var saved = localStorage.getItem(STORAGE_KEY);
    // ЗМІНА ТУТ: Якщо в пам'яті немає налаштування (перший вхід), повертаємо false
    return saved === null ? false : saved === '1';
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
    if (typeof window.applyAllSkins === 'function' && !window.applyAllSkins.__marksPatched) {
      var original = window.applyAllSkins;
      window.applyAllSkins = function () {
        var result = original.apply(this, arguments);
        syncMarks(); // Миттєве оновлення при зміні скіна
        return result;
      };
      window.applyAllSkins.__marksPatched = true;
    }
  }

  function init() {
    injectMarks(document.getElementById('clickableClock'));
    injectMarks(document.getElementById('reverbClock'));
    syncMarks();
    hookSkinChanges();

    var show = getSavedPreference();
    applyVisibility(show);
    wireCheckbox(show);

    setInterval(function () {
      injectMarks(document.getElementById('clickableClock'));
      injectMarks(document.getElementById('reverbClock'));
      syncMarks();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
