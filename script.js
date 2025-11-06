window.onload = function () {
  const clock = document.getElementById("clickableClock");
  const hourHand = document.querySelector(".hour");
  const minuteHand = document.querySelector(".minute");
  const secondHand = document.querySelector(".second");
  const clickBtn = document.getElementById("clickBtn");
  const musicBtn = document.getElementById("musicBtn");
  const phonk = document.getElementById("phonk");
  const scoreText = document.getElementById("score");
  const upgradesContainer = document.getElementById("upgrades");

  let score = 0;
  let clickPower = 1;

  function formatTime(seconds) {
    const units = [
      { name: "століття", value: 60 * 60 * 24 * 365 * 100 },
      { name: "десятиліття", value: 60 * 60 * 24 * 365 * 10 },
      { name: "рік", value: 60 * 60 * 24 * 365 },
      { name: "міс", value: 60 * 60 * 24 * 30 },
      { name: "дн", value: 60 * 60 * 24 },
      { name: "год", value: 60 * 60 },
      { name: "хв", value: 60 },
      { name: "сек", value: 1 },
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

  const upgrades = [
    { name: "📱 Включити телефон", baseCost: 65, bonus: 1, level: 0 },
    { name: "☕ Зробити каву", baseCost: 125, bonus: 2, level: 0 },
    { name: "💻 Увімкнути ноут", baseCost: 3605, bonus: 3, level: 0 },
    { name: "🎧 Надіти навушники", baseCost: 10000, bonus: 4, level: 0 },
    { name: "💪 Почати тренування", baseCost: 100000, bonus: 5, level: 0 },
    { name: "📚 Відкрити книгу", baseCost: 1000000, bonus: 6, level: 0 },
    { name: "🌇 Вийти на прогулянку", baseCost: 10000000, bonus: 7, level: 0 },
    { name: "🚀 Почати проєкт", baseCost: 100000000, bonus: 8, level: 0 },
    { name: "🧠 Медитувати над сенсом часу", baseCost: 1000000000, bonus: 9, level: 0 },
  ];

  const buttons = [];

  upgrades.forEach((upgrade, i) => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn hidden";
    buttons.push(btn);
    upgradesContainer.appendChild(btn);

    function updateText() {
      const cost = upgrade.baseCost + upgrade.level;
      if (btn.dataset.locked === "true") {
        btn.textContent = "🔒 ??? — ???";
      } else {
        btn.textContent = `${upgrade.name} (Lv.${upgrade.level}) — ${formatTime(cost)}`;
      }
    }

    btn.dataset.locked = "false";
    updateText();

    btn.addEventListener("click", () => {
      const cost = upgrade.baseCost + upgrade.level;
      if (score >= cost && btn.dataset.locked !== "true") {
        score -= cost;
        upgrade.level++;
        clickPower += upgrade.bonus;
        updateScore();
        updateText();
        revealNextUpgrade(i);
      }
    });

    upgrade.update = updateText;
  });

  // Показати перші 3 апгрейди
  for (let i = 0; i < 3; i++) buttons[i].classList.remove("hidden");

  // Наступні 2 з замочками
  if (buttons[3]) {
    buttons[3].classList.remove("hidden");
    buttons[3].dataset.locked = "true";
    buttons[3].textContent = "🔒 ??? — ???";
  }

  if (buttons[4]) {
    buttons[4].classList.remove("hidden");
    buttons[4].dataset.locked = "true";
    buttons[4].textContent = "🔒 ??? — ???";
  }

  function revealNextUpgrade(index) {
    // логіка відкриття наступних апгрейдів
    const nextMap = { 0: 3, 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 };
    const nextIndex = nextMap[index];
    if (nextIndex !== undefined) revealWithLock(nextIndex);
  }

  function revealWithLock(index) {
    if (buttons[index]) {
      buttons[index].classList.remove("hidden");
      buttons[index].dataset.locked = "true";
      buttons[index].textContent = "🔒 ??? — ???";
    }
  }

  function updateScore() {
    scoreText.textContent = `Часу зібрано: ${formatTime(score)}`;
  }

  function boomEffect() {
    clock.style.scale = "1.05";
    setTimeout(() => {
      clock.style.scale = "1";
    }, 100);
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
        "0 0 30px #0ea5e9, 0 0 60px #0ea5e9, inset 0 0 30px rgba(14,165,233,0.3)";
    }, 300);
  }

  clickBtn.addEventListener("click", addTime);
  clock.addEventListener("click", addTime);

  musicBtn.addEventListener("click", () => {
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
    minuteHand.style.transform = `translateX(-50%) rotate(${
      minutes * 6 + seconds * 0.1
    }deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${
      hours * 30 + minutes * 0.5
    }deg)`;
  }

  setInterval(updateClock, 1000);
  updateClock();
  updateScore();
};
