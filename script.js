window.onload = function() {
  const hourHand = document.querySelector('.hour');
  const minuteHand = document.querySelector('.minute');
  const secondHand = document.querySelector('.second');
  const clickBtn = document.getElementById('clickBtn');
  const scoreText = document.getElementById('score');
  const clock = document.getElementById('clickableClock');
  const phonk = document.getElementById('phonk');
  const musicBtn = document.getElementById('musicBtn');

  let score = 0;
  let isPlaying = false;

  // 🕓 плавний рух стрілок
  function updateClock() {
    const now = new Date();
    const ms = now.getMilliseconds();
    const seconds = now.getSeconds() + ms / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = now.getHours() % 12 + minutes / 60;

    secondHand.style.transform = `translateX(-50%) rotate(${seconds * 6}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minutes * 6}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${hours * 30}deg)`;

    requestAnimationFrame(updateClock);
  }
  requestAnimationFrame(updateClock);

  // 🖱 Клік по кнопці або годиннику
  function addTime() {
    score++;
    scoreText.textContent = `Часу зібрано: ${score} сек`;
    clock.style.borderColor = "#ec4899";
    setTimeout(() => clock.style.borderColor = "#0ea5e9", 200);
  }

  clickBtn.addEventListener('click', addTime);
  clock.addEventListener('click', addTime);

  // 🎵 Кнопка фонку
  musicBtn.addEventListener('click', () => {
    if (phonk.paused) {
      phonk.volume = 0.5;
      phonk.play();
      musicBtn.textContent = "⏸ Зупинити фонк";
      musicBtn.classList.add("active");
    } else {
      phonk.pause();
      musicBtn.textContent = "▶️ Включити фонк";
      musicBtn.classList.remove("active");
    }
  });
};
