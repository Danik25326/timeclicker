window.onload = function () {
  const clock = document.getElementById("clickableClock");
  const hourHand = document.querySelector(".hour");
  const minuteHand = document.querySelector(".minute");
  const secondHand = document.querySelector(".second");
  const musicBtn = document.getElementById("musicBtn");
  const prevTrack = document.getElementById("prevTrack");
  const nextTrack = document.getElementById("nextTrack");
  const phonk = document.getElementById("phonk");
  const scoreText = document.getElementById("score");
  const upgradesContainer = document.getElementById("upgrades");

  let score = 0;
  let clickPower = 1;

  /* ===== СПИСОК ТРЕКІВ ===== */
  const tracks = [
    "asphalt-menace.mp3",
    "digital-overdrive.mp3",
    "drift-phonk-phonk-music-2-434611.mp3",
    "drift-phonk-phonk-music-432222.mp3",
    "phonk-music-409064 (2).mp3",
    "phonk-music-phonk-2025-432208.mp3",
    "pixel-drift.mp3"
  ].map(name => `https://raw.githubusercontent.com/Danik25326/timeclicker/main/musicList/${name}`);

  let currentTrack = 0;
  let isPlaying = false;

  function loadTrack(i) {
    phonk.src = tracks[i];
    if (isPlaying) phonk.play();
  }

  loadTrack(currentTrack);

  /* ===== КНОПКА PLAY/PAUSE ===== */
  musicBtn.addEventListener("click", () => {
    if (!isPlaying) {
      phonk.volume = 0.45;
      phonk.play();
      musicBtn.textContent = "Зупинити фонк";
      isPlaying = true;
    } else {
      phonk.pause();
      musicBtn.textContent = "Включити фонк";
      isPlaying = false;
    }
  });

  /* ===== ПЕРЕМІКАННЯ ТРЕКІВ ===== */
  prevTrack.addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
  });

  nextTrack.addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });

  /* ===== ЛОГІКА ГОДИННИКА ===== */
  function triggerClockAnimation() {
    clock.classList.remove("click-anim");
    void clock.offsetWidth;
    clock.classList.add("click-anim");
  }

  function addTime() {
    score += clickPower;
    updateScore();
    triggerClockAnimation();
  }

  if (clock) clock.addEventListener("click", addTime);

  function updateScore() {
    let display = "";
    if (score < 60) display = `${score} сек`;
    else if (score < 3600) display = `${Math.floor(score/60)} хв ${score%60} сек`;
    else {
      let hours = Math.floor(score/3600);
      let mins = Math.floor((score%3600)/60);
      let secs = score % 60;
      display = `${hours} год ${mins} хв ${secs} сек`;
    }
    scoreText.textContent = `Часу зібрано: ${display}`;
  }

  /* ===== ОНОВЛЕННЯ СТРІЛОК ГОДИННИКА ===== */
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

  /* ===== ПРИКЛАД АПГРЕЙДІВ ЛІВОРУЧ ===== */
  const exampleUpgrades = [
    {name: "Подвоїти клік", cost: 10},
    {name: "Швидший годинник", cost: 50},
  ];

  exampleUpgrades.forEach(u => {
    const btn = document.createElement("button");
    btn.classList.add("upgrade-btn");
    btn.textContent = `${u.name} (${u.cost} Time)`;
    upgradesContainer.appendChild(btn);

    btn.addEventListener("click", () => {
      if (score >= u.cost) {
        score -= u.cost;
        clickPower *= 2;
        updateScore();
        btn.disabled = true;
      }
    });
  });
};
