// --------------------------------------------------
// TimesClicker — script.js (чисто, зрозуміло)
// --------------------------------------------------

/* DOM */
const clickBtn = document.getElementById('clickBtn');
const scoreDisplay = document.getElementById('score');
const upgradesContainer = document.getElementById('upgrades');
const clock = document.getElementById('clickableClock');
const hourHand = document.querySelector('.hour');
const minuteHand = document.querySelector('.minute');
const secondHand = document.querySelector('.second');

const musicBtn = document.getElementById('musicBtn');
const musicPrev = document.getElementById('musicPrev');
const musicNext = document.getElementById('musicNext');
const trackTitle = document.getElementById('trackTitle');
const phonk = document.getElementById('phonk');

/* STATE */
let score = parseFloat(localStorage.getItem('score')) || 0;
let clickPower = parseFloat(localStorage.getItem('clickPower')) || 1;
let autoGain = parseFloat(localStorage.getItem('autoGain')) || 0;
let musicIndex = parseInt(localStorage.getItem('musicIndex')) || 0;

/* Простий список апгрейдів (для початку) */
const upgrades = [
  { name: '📱 Включити телефон', baseCost: 10, bonus: 1, level: 0, type: 'click' },
  { name: '☕ Зробити каву', baseCost: 60, bonus: 2, level: 0, type: 'click' },
  { name: '💻 Увімкнути ноут', baseCost: 120, bonus: 3, level: 0, type: 'auto' },
  { name: '🎧 Надіти навушники', baseCost: 1000, bonus: 4, level: 0, type: 'click' }
];

/* ---------- HELPERS ---------- */
function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const units = [
    { name: "год", value: 3600 },
    { name: "хв", value: 60 },
    { name: "сек", value: 1 }
  ];
  const parts = [];
  let rem = seconds;
  for (const u of units) {
    const amt = Math.floor(rem / u.value);
    if (amt > 0) {
      parts.push(`${amt} ${u.name}`);
      rem %= u.value;
    }
  }
  return parts.length ? parts.join(' ') : `${seconds} сек`;
}

/* ---------- MUSIC: load & controls ---------- */
function loadMusic(index) {
  if (!Array.isArray(window.musicList) || !window.musicList.length) {
    trackTitle.textContent = 'Phonk: не вибрано';
    return;
  }
  musicIndex = (index + window.musicList.length) % window.musicList.length;
  const track = window.musicList[musicIndex];
  phonk.src = track.url;
  trackTitle.textContent = `Phonk: ${track.title}`;
  localStorage.setItem('musicIndex', musicIndex);
}

musicBtn.addEventListener('click', () => {
  if (!phonk.src) return;
  if (phonk.paused) {
    phonk.volume = 0.45;
    phonk.play().catch(() => {
      // деякі браузери вимагають user gesture; тут нічого не робимо, але користувач клацнув кнопку, тому має працювати
    });
    musicBtn.textContent = '⏸️ Зупинити фонк';
  } else {
    phonk.pause();
    musicBtn.textContent = '▶️ Включити фонк';
  }
});

musicPrev.addEventListener('click', () => {
  loadMusic(musicIndex - 1);
  phonk.play();
  musicBtn.textContent = '⏸️ Зупинити фонк';
});

musicNext.addEventListener('click', () => {
  loadMusic(musicIndex + 1);
  phonk.play();
  musicBtn.textContent = '⏸️ Зупинити фонк';
});

/* ---------- UPGRADES UI ---------- */
function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  upgrades.forEach((u, idx) => {
    const price = u.baseCost * (u.level + 1);
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn' + (score >= price ? '' : ' locked');
    btn.textContent = `${u.name} (Lv.${u.level}) — ${formatTime(price)}`;
    btn.disabled = score < price;
    btn.addEventListener('click', () => buyUpgrade(idx));
    upgradesContainer.appendChild(btn);
    u._btn = btn;
  });
}

function checkUpgradesState() {
  upgrades.forEach(u => {
    const price = u.baseCost * (u.level + 1);
    if (u._btn) {
      u._btn.disabled = score < price;
      u._btn.classList.toggle('locked', score < price);
      u._btn.textContent = `${u.name} (Lv.${u.level}) — ${formatTime(price)}`;
    }
  });
}

function buyUpgrade(index) {
  const u = upgrades[index];
  const price = u.baseCost * (u.level + 1);
  if (score < price) return;
  score -= price;
  u.level++;
  if (u.type === 'click') clickPower += u.bonus;
  if (u.type === 'auto') autoGain += u.bonus;
  saveProgress();
  updateScoreDisplay();
  renderUpgrades();
}

/* ---------- SCORE / AUTO ---------- */
function updateScoreDisplay() {
  scoreDisplay.textContent = `Часу зібрано: ${formatTime(score)}`;
  checkUpgradesState();
}

function saveProgress() {
  localStorage.setItem('score', score);
  localStorage.setItem('clickPower', clickPower);
  localStorage.setItem('autoGain', autoGain);
  localStorage.setItem('upgradesState', JSON.stringify(upgrades.map(u => u.level)));
}

/* auto per second (applies autoGain) */
setInterval(() => {
  score += autoGain;
  updateScoreDisplay();
  saveProgress();
  if (autoGain > 0) {
    // little visual cue
    clock.style.transform = 'scale(1.02)';
    setTimeout(() => (clock.style.transform = ''), 150);
  }
}, 1000);

/* ---------- CLICK interaction ---------- */
clickBtn.addEventListener('click', () => {
  score += clickPower;
  updateScoreDisplay();
  saveProgress();
  // small clock pop
  clock.style.transform = 'scale(1.06)';
  setTimeout(() => (clock.style.transform = ''), 120);
});

/* ---------- Clock hands (real time) ---------- */
function updateClockHands() {
  const now = new Date();
  const s = now.getSeconds();
  const m = now.getMinutes();
  const h = now.getHours() % 12;
  secondHand.style.transform = `translateX(-50%) rotate(${s * 6}deg)`;
  minuteHand.style.transform = `translateX(-50%) rotate(${m * 6 + s * 0.1}deg)`;
  hourHand.style.transform = `translateX(-50%) rotate(${h * 30 + m * 0.5}deg)`;
}
setInterval(updateClockHands, 1000);
updateClockHands();

/* ---------- Init ---------- */
function applySavedUpgrades() {
  const saved = JSON.parse(localStorage.getItem('upgradesState') || 'null');
  if (Array.isArray(saved)) {
    for (let i = 0; i < Math.min(saved.length, upgrades.length); i++) {
      upgrades[i].level = saved[i] || 0;
      // reapply their effects
      for (let k = 0; k < upgrades[i].level; k++) {
        if (upgrades[i].type === 'click') clickPower += upgrades[i].bonus;
        if (upgrades[i].type === 'auto') autoGain += upgrades[i].bonus;
      }
    }
  }
}

applySavedUpgrades();
loadMusic(musicIndex);
renderUpgrades();
updateScoreDisplay();
