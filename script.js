window.onload = function () {
  // Елементи
  const clock = document.getElementById("clickableClock");
  const hourHand = document.querySelector(".hour");
  const minuteHand = document.querySelector(".minute");
  const secondHand = document.querySelector(".second");
  const musicBtn = document.getElementById("musicBtn");
  const prevTrack = document.getElementById("prevTrack");
  const nextTrack = document.getElementById("nextTrack");
  const player = document.getElementById("player");
  const scoreText = document.getElementById("score");
  const upgradesContainer = document.getElementById("upgrades");
  const clickGainEl = document.getElementById("clickGain");
  const cloudTotalEl = document.getElementById("cloudTotal");
  const nowPlaying = document.getElementById("nowPlaying");
  const clickCloud = document.getElementById("clickCloud");

  // Статистика
  let score = 0,
    clickPower = 1,
    autoRate = 0,
    isPlaying = false,
    currentTrack = 0,
    clickCloudTotal = 0,
    clickBuffer = [];

  // Музика
  const trackNames = ["Фонк №1", "Фонк №2", "Фонк №3", "Фонк №4", "Фонк №5", "Фонк №6", "Фонк №7"];
  const tracks = [
    "asphalt-menace.mp3",
    "digital-overdrive.mp3",
    "drift-phonk-phonk-music-2-434611.mp3",
    "drift-phonk-phonk-music-432222.mp3",
    "phonk-music-409064 (2).mp3",
    "phonk-music-phonk-2025-432208.mp3",
    "pixel-drift.mp3",
  ].map(x => `musicList/${x}`);

  function loadTrack(i) {
    player.src = tracks[i];
    nowPlaying.textContent = `Зараз: ${trackNames[i]}`;
    if (isPlaying) player.play();
  }
  loadTrack(0);

  player.addEventListener("ended", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });

  musicBtn.addEventListener("click", () => {
    if (!isPlaying) {
      isPlaying = true;
      player.volume = 0.45;
      player.play().catch(() => {});
      musicBtn.textContent = "⏸ Зупинити музику";
    } else {
      isPlaying = false;
      player.pause();
      musicBtn.textContent = "▶️ Включити музику";
    }
  });

  prevTrack.addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
  });

  nextTrack.addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });

  // Функція оновлення годинника
  function updateClock() {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ms = now.getMilliseconds();

    hourHand.style.transform = `rotate(${h * 30 + m * 0.5}deg)`;
    minuteHand.style.transform = `rotate(${m * 6}deg)`;
    secondHand.style.transform = `rotate(${s * 6 + ms * 0.006}deg)`;
    requestAnimationFrame(updateClock);
  }
  updateClock();

  // Клік на годинник
  clock.addEventListener("click", () => {
    score += clickPower;
    scoreText.textContent = score;

    // Швидкі кліки для бульбашки
    const now = Date.now();
    clickBuffer.push(now);

    // Викидаємо старіші ніж 0.1с
    clickBuffer = clickBuffer.filter(t => now - t <= 100);

    if (clickBuffer.length >= 10) {
      // Спрацьовує бульбашка
      clickCloudTotal += 1;
      cloudTotalEl.textContent = clickCloudTotal;
      clickCloud.classList.add("show");
      setTimeout(() => clickCloud.classList.remove("show"), 500);
      clickBuffer = []; // обнуляємо буфер
    }
  });

  // Апгрейди (приклад)
  const upgrades = [
    { name: "Кліпати очима", baseCost: 1, type: "click", bonus: 1, level: 0 },
    { name: "Включити телефон", baseCost: 8, type: "auto", bonus: 1, level: 0 },
    { name: "Гортати стрічку новин", baseCost: 25, type: "auto", bonus: 3, level: 0 },
  ];

  function renderUpgrades() {
    upgradesContainer.innerHTML = "";
    upgrades.forEach((upg, i) => {
      const btn = document.createElement("button");
      btn.textContent = `${upg.name} (${upg.level}) - ${upg.baseCost * (upg.level + 1)} очки`;
      btn.onclick = () => {
        const cost = upg.baseCost * (upg.level + 1);
        if (score >= cost) {
          score -= cost;
          upg.level += 1;
          if (upg.type === "click") clickPower += upg.bonus;
          else autoRate += upg.bonus;
          renderUpgrades();
          scoreText.textContent = score;
        }
      };
      upgradesContainer.appendChild(btn);
    });
  }
  renderUpgrades();

  // Автоклік
  setInterval(() => {
    score += autoRate;
    scoreText.textContent = score;
  }, 1000);
};
