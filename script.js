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

  let score = 0;
  let clickPower = 1;

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

  function updateMusicButton() {
    musicBtn.textContent = phonk.paused ? "Play" : "Pause";
  }

  function loadTrack(i) {
    const wasPlaying = !phonk.paused;
    phonk.src = tracks[i];
    if (wasPlaying) phonk.play();
    updateMusicButton();
  }

  loadTrack(currentTrack);

  // Play/Pause
  musicBtn.addEventListener("click", () => {
    if (phonk.paused) {
      phonk.volume = 0.45;
      phonk.play();
    } else {
      phonk.pause();
    }
    updateMusicButton();
  });

  // Prev/Next
  prevTrack.addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
  });

  nextTrack.addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });

  // Click на годинник
  clock.addEventListener("click", () => {
    score += clickPower;
    updateScore();
    triggerClockAnimation();
  });

  function updateScore() {
    scoreText.textContent = `Часу зібрано: ${score} сек`;
  }

  function triggerClockAnimation() {
    clock.classList.remove("click-anim");
    void clock.offsetWidth;
    clock.classList.add("click-anim");
  }

  // Годинник
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
};
