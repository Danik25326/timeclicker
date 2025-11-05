window.onload = function() {
  const clock = document.getElementById('clickableClock');
  const hourHand = document.querySelector('.hour');
  const minuteHand = document.querySelector('.minute');
  const secondHand = document.querySelector('.second');
  const clickBtn = document.getElementById('clickBtn');
  const musicBtn = document.getElementById('musicBtn');
  const phonk = document.getElementById('phonk');
  const scoreText = document.getElementById('score');
  const upgradesContainer = document.getElementById('upgrades');

  let score = 0;
  let clickPower = 1;

  // === ФОРМАТУВАННЯ ЧАСУ ===
  function formatTime(seconds) {
    const units = [
      { name: "століття", value: 60 * 60 * 24 * 365 * 100 },
      { name: "десятиліття", value: 60 * 60 * 24 * 365 * 10 },
      { name: "рік", value: 60 * 60 * 24 * 365 },
      { name: "міс", value: 60 * 60 * 24 * 30 },
      { name: "дн", value: 60 * 60 * 24 },
      { name: "год", value: 60 * 60 },
      { name: "хв", value: 60 },
      { name: "сек", value: 1 }
    ];

    let remaining = seconds;
    const parts = [];
    for (const u of units) {
      const amount = Math.floor(remaining / u.value);
      if (amount > 0 || parts.length > 0) {
        if (amount > 0) parts.push(`${amount} ${u.name}`);
        remaining %= u.value;
      }
    }
    if (parts.length === 0) return `${Math.floor(seconds)} сек`;
    return parts.join(" ");
  }

  // === АПГРЕЙДИ ===
  const upgrades = [
    { name: "📱 Включити телефон", baseCost: 10, bonus: 1, level: 0 },
    { name: "☕ Зробити каву", baseCost: 60, bonus: 2, level: 0 },
    { name: "💻 Увімкнути ноут", baseCost: 120, bonus: 3, level: 0 },
    { name: "🎧 Надіти навушники", baseCost: 1000, bonus: 4, level: 0 },
    { name: "💪 Почати тренування", baseCost: 10000, bonus: 5, level: 0 },
    { name: "📚 Відкрити книгу", baseCost: 1000000, bonus: 6, level: 0 },
    { name: "🌇 Вийти на прогулянку", baseCost: 10000000, bonus: 7, level: 0 },
    { name: "🚀 Почати проєкт", baseCost: 100000000, bonus: 8, level: 0 },
    { name: "🧠 Медитувати над сенсом часу", baseCost: 1000000000, bonus: 9, level: 0 },
  ];

  upgrades.forEach((upgrade, index) => {
    const btn = document.createElement('button');
    btn.className = 'upgrade-btn';
    updateUpgradeText();

    btn.addEventListener('click', () => {
      const cost = upgrade.baseCost + upgrade.level;
      if (score >= cost) {
        score -= cost;
        upgrade.level++;
        clickPower += upgrade.bonus;
        updateUpgradeText();
        updateScore();
        revealNextUpgrade(index);
      }
    });

    function updateUpgradeText() {
      const cost = upgrade.baseCost + upgrade.level;

      // логіка загадковості
      if (index < 3) {
        btn.textContent = `${upgrade.name} (Lv.${upgrade.level}) — ${formatTime(cost)}`;
      } else if (index === 3) {
        btn.textContent = `❓ ??? — ${formatTime(cost)}`;
      } else {
        btn.textContent = `🔒 Недоступно`;
        btn.disabled = true;
      }
    }

    upgradesContainer.appendChild(btn);
  });

  function revealNextUpgrade(currentIndex) {
    const next = upgradesContainer.children[currentIndex + 1];
    if (next && next.disabled) {
      next.disabled = false;
      next.textContent = `❓ ??? — ${formatTime(upgrades[currentIndex + 1].baseCost)}`;
      next.classList.add('mystery');
    }
  }

  function updateScore() {
    scoreText.textContent = `Часу зібрано: ${formatTime(score)}`;
  }

  function boomEffect() {
    clock.style.scale = "1.05";
    setTimeout(() => (clock.style.scale = "1"), 100);
  }

  function addTime() {
    score += clickPower;
    updateScore();

    clock.style.borderColor = "#ec4899";
    clock.style.boxShadow = "0 0 50px #ec4899, 0 0 100px #ec4899";
    boomEffect();

    setTimeout(() => {
      clock.style.borderColor = "#0ea5e9";
      clock.style.boxShadow =
        "0 0 30px #0ea5e9, 0 0 60px #0ea5e9, inset 0 0 30px rgba(14, 165, 233, 0.3)";
    }, 300);
  }

  clickBtn.addEventListener('click', addTime);
  clock.addEventListener('click', addTime);

  musicBtn.addEventListener('click', () => {
    if (phonk.paused) {
      phonk.volume = 0.4;
      phonk.play();
      musicBtn.textContent = "⏸ Зупинити фонк";
      musicBtn.classList.add("active");
    } else {
      phonk.pause();
      musicBtn.textContent = "▶️ Включити фонк";
      musicBtn.classList.remove("active");
    }
  });

  function updateClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;

    secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minutes * 6 + seconds * 0.1}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${hours * 30 + minutes * 0.5}deg)`;
  }

  setInterval(updateClock, 1000);
  updateClock();
  updateScore();
};
