window.onload = function () {
  const clock = document.getElementById("clock");
  const ctx = clock.getContext("2d");
  const scoreDisplay = document.getElementById("score");
  const upgradesContainer = document.getElementById("upgrades");
  const phonk = document.getElementById("phonk");
  const musicToggle = document.getElementById("musicToggle");
  const prevBtn = document.getElementById("musicPrev");
  const nextBtn = document.getElementById("musicNext");

  let score = 0;
  let clickPower = 1;
  let autoGain = 0;
  let isMusicPlaying = false;
  let currentTrack = 0;

  // --- Годинник ---
  function drawClock() {
    ctx.clearRect(0, 0, 200, 200);
    const now = new Date();
    ctx.save();
    ctx.translate(100, 100);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI * 2);
    ctx.stroke();

    const sec = now.getSeconds();
    const min = now.getMinutes();
    const hr = now.getHours();

    drawHand((hr % 12) / 12 * 2 * Math.PI, 50, 5);
    drawHand((min / 60) * 2 * Math.PI, 70, 3);
    drawHand((sec / 60) * 2 * Math.PI, 85, 2, "red");
    ctx.restore();

    requestAnimationFrame(drawClock);
  }

  function drawHand(angle, length, width, color = "#fff") {
    ctx.save();
    ctx.rotate(angle - Math.PI / 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(drawClock);

  // --- Клік ---
  clock.addEventListener("click", () => {
    clock.classList.add("clicked");
    setTimeout(() => clock.classList.remove("clicked"), 120);
    score += clickPower;
    updateScore();
  });

  // --- Оновлення рахунку ---
  function updateScore() {
    scoreDisplay.textContent = `Час: ${score.toFixed(0)} сек`;
  }

  // --- Автододавання ---
  setInterval(() => {
    score += autoGain;
    updateScore();
  }, 1000);

  // --- Апгрейди ---
  const upgrades = [
    { name: "📱 Увімкнути телефон", baseCost: 50, bonus: 1, level: 0 },
    { name: "💡 Зайнятись справою", baseCost: 200, bonus: 5, level: 0 },
    { name: "🏙️ Вийти на вулицю", baseCost: 1000, bonus: 25, level: 0 },
    { name: "🚀 Зловити вайб", baseCost: 5000, bonus: 100, level: 0 },
  ];

  upgrades.forEach((u) => {
    const btn = document.createElement("button");
    btn.className = "upgrade";
    btn.textContent = `${u.name} | 💰 ${u.baseCost} | 🔼 +${u.bonus}`;
    btn.onclick = () => {
      if (score >= u.baseCost) {
        score -= u.baseCost;
        u.level++;
        clickPower += u.bonus;
        u.baseCost = Math.round(u.baseCost * 1.8);
        updateScore();
        btn.textContent = `${u.name} (lvl ${u.level}) | 💰 ${u.baseCost} | 🔼 +${u.bonus}`;
      }
    };
    upgradesContainer.appendChild(btn);
  });

  // --- Музика ---
  function playTrack(index) {
    if (!tracks[index]) return;
    phonk.src = tracks[index].src;
    phonk.play();
    isMusicPlaying = true;
    musicToggle.textContent = `⏸️ ${tracks[index].name}`;
  }

  musicToggle.onclick = () => {
    if (isMusicPlaying) {
      phonk.pause();
      isMusicPlaying = false;
      musicToggle.textContent = "▶️";
    } else {
      playTrack(currentTrack);
    }
  };

  nextBtn.onclick = () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    playTrack(currentTrack);
  };

  prevBtn.onclick = () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    playTrack(currentTrack);
  };
};
