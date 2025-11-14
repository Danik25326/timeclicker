window.onload = function () {
  const clock = document.getElementById("clickableClock");
  const hourHand = document.querySelector(".hour");
  const minuteHand = document.querySelector(".minute");
  const secondHand = document.querySelector(".second");
  const musicBtn = document.getElementById("musicBtn");
  const phonk = document.getElementById("phonk");
  const scoreText = document.getElementById("score");
  const upgradesContainer = document.getElementById("upgrades");

  const editNameBtn = document.getElementById("editNameBtn");
  const worldNameSpan = document.getElementById("worldName");

  let score = 0;
  let clickPower = 1;

  // ❤️ ЗМІНА НАЗВИ (Earth Time → custom Time)
  editNameBtn.addEventListener("click", () => {
    let newName = prompt("Введи нову назву (тільки перше слово):");
    if (!newName) return;
    newName = newName.trim().split(" ")[0];
    worldNameSpan.textContent = newName;
  });

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

  // 🔥 ЗМЕНШЕНІ ЦІНИ ×5
  const upgrades = [
    { name: "📱 Включити телефон", baseCost: 12, bonus: 1, level: 0 },
    { name: "☕ Зробити каву", baseCost: 25, bonus: 2, level: 0 },
    { name: "💻 Увімкнути ноут", baseCost: 700, bonus: 3, level: 0 },
    { name: "🎧 Надіти навушники", baseCost: 2000, bonus: 4, level: 0 },
    { name: "💪 Почати тренування", baseCost: 20000, bonus: 5, level: 0 },
    { name: "📚 Відкрити книгу", baseCost: 200000, bonus: 6, level: 0 },
    { name: "🌇 Вийти на прогулянку", baseCost: 2000000, bonus: 7, level: 0 },
    { name: "🚀 Почати проєкт", baseCost: 20000000, bonus: 8, level: 0 },
    { name: "🧠 Медитувати над сенсом часу", baseCost: 200000000, bonus: 9, level: 0 },
  ];

  const buttons = [];

  upgrades.forEach((upgrade, index) => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn hidden";
    upgradesContainer.appendChild(btn);
    buttons.push(btn);

    function updateText() {
      const cost = upgrade.baseCost * (upgrade.level + 1);
      btn.textContent = `${upgrade.name} (Lv.${upgrade.level}) — ${formatTime(cost)}`;
    }

    updateText();

    btn.addEventListener("click", () => {
      const cost = upgrade.baseCost * (upgrade.level + 1);
      if (score >= cost) {
        score -= cost;
        upgrade.level++;
        clickPower += upgrade.bonus;
        updateText();
        updateScore();
        revealNext(index);
      }
    });

    upgrade.update = updateText;
  });

  // показуємо перший апгрейд
  buttons[0].classList.remove("hidden");

  // відкриття наступного апгрейду після покупки попереднього
  function revealNext(i) {
    if (buttons[i + 1]) {
      buttons[i + 1].classList.remove("hidden");
    }
  }

  function updateScore() {
    scoreText.textContent = `Часу зібрано: ${formatTime(score)}`;
  }

  function boomEffect() {
    clock.style.scale = "1.05";
    setTimeout(() => (clock.style.scale = "1"), 120);
  }

  function addTime() {
    score += clickPower;
    updateScore();
    boomEffect();
  }

  // Клік тільки по годиннику
  clock.addEventListener("click", addTime);

  musicBtn.addEventListener("click", () => {
    if (phonk.paused) {
      phonk.volume = 0.4;
      phonk.play();
      musicBtn.textContent = "⏸ Зупинити фонк";
    } else {
      phonk.pause();
      musicBtn.textContent = "▶️ Включити фонк";
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
  // ========== РЕДАГОВАННЯ НАЗВИ ==========
const worldName = document.getElementById("worldName");

// Забороняємо перенос рядків
worldName.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    worldName.blur();
  }
});

// Коли користувач закінчив редагувати
worldName.addEventListener("blur", () => {
  let text = worldName.textContent.trim();

  // Беремо тільки перше слово
  const firstWord = text.split(" ")[0] || "Earth";

  // Встановлюємо формат: "<перше слово> Time"
  worldName.textContent = `${firstWord} Time`;
});
};
