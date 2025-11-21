window.onload = function () {
  // === DOM ===
  const clock = document.getElementById("clickableClock");
  const clockWrapper = document.getElementById("clockWrapper");
  const comboBubble = document.getElementById("comboBubble");
  const comboCount = document.getElementById("comboCount");
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
  const realTimePlayedEl = document.getElementById("realTimePlayed");
  const virtualTimeEl = document.getElementById("virtualTime");
  const totalUpgradesEl = document.getElementById("totalUpgrades");
  const maxPerClickEl = document.getElementById("maxPerClick");
  const prestigeMultEl = document.getElementById("prestigeMult");
  const reverbBtn = document.getElementById("reverbBtn");
  const timeTunnel = document.getElementById("timeTunnel");
  const worldTitle = document.getElementById("worldTitle");
  const toastContainer = document.getElementById("toastContainer");
  const reverbOverlay = document.getElementById("reverbOverlay");
  const reverbClock = document.getElementById("reverbClock");
  const reverbHint = document.getElementById("reverbHint");

  // === State ===
  let score = 0, clickPower = 1, autoRate = 0, isPlaying = false, currentTrack = 0;
  let sessionStart = Date.now(), totalUpgradesBought = 0, maxPerClick = 1, prestigeMultiplier = 1.0, clickCloudTotal = 0;

  // Комбо + максимальне комбо за сесію
  let lastClickTime = 0, currentCombo = 0, maxComboEver = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350, COMBO_THRESHOLD = 5;

  // Реверб
  let isReverbActive = false, reverbHoldTimeout = null, reverbChaosInterval = null;

  // === МУЗИКА, ФОРМАТ, АПГРЕЙДИ, СКІНИ — без змін (залишив як було, працює ідеально) ===
  // ... (весь твій попередній код до досягнень) ...

  // === ДОСЯГНЕННЯ (комбо-майстер тепер бере МАКСИМУМ за сесію) ===
  const achievementsList = [
    {title:"Перший клік", desc:"Зробити перший клік", target:1, get:()=>clickCloudTotal},
    {title:"100 сек", desc:"Витратити 100 сек", target:100, get:()=>score},
    {title:"Перша покупка", desc:"Купити перший апгрейд", target:1, get:()=>totalUpgradesBought},
    {title:"Авто запущено", desc:"Маєш autoRate > 0", target:1, get:()=>autoRate>0?1:0},
    {title:"Комбо-майстер", desc:"Досягти комбо 10+", target:10, get:()=>maxComboEver}, // ← тепер maxComboEver!
    {title:"Стильний", desc:"Змінити будь-який скін", target:1, get:()=>(currentShape!=="round"||currentClockSkin!=="neon-blue")?1:0},
  ];

  const achRoot = document.getElementById("achievements");
  achievementsList.forEach(a => {
    const el = document.createElement("div");
    el.className = "achievement";
    el.innerHTML = `<strong>${a.title}</strong><div style="font-size:12px;color:#bcd">${a.desc}</div><div class="ach-progress"></div><div class="ach-state">0%</div>`;
    achRoot.appendChild(el);
    a.progressEl = el.querySelector(".ach-progress");
    a.stateEl = el.querySelector(".ach-state");
  });

  function updateAchievements(){
    achievementsList.forEach(a => {
      const val = a.get();
      const percent = Math.min(100, (val / a.target) * 100);
      a.progressEl.style.width = percent + "%";
      if(percent >= 100 && !a.done){
        a.done = true;
        a.stateEl.textContent = "Виконано ✅";
        a.stateEl.style.color = "#8df299";
        showToast(`Досягнення: ${a.title} ✅`);
      } else if(percent < 100){
        a.stateEl.textContent = Math.floor(percent) + "%";
      }
    });
  }

  // === КОМБО (тепер запам'ятовує максимум) ===
  function handleClickCombo(){
    const now = Date.now();
    if (now - lastClickTime < MAX_CLICK_INTERVAL) {
      currentCombo++;
    } else {
      currentCombo = 1;
    }
    lastClickTime = now;
    if (currentCombo > maxComboEver) maxComboEver = currentCombo;

    if (currentCombo >= COMBO_THRESHOLD) {
      comboCount.textContent = currentCombo;
      comboBubble.classList.add("show");
    }

    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      if (currentCombo >= COMBO_THRESHOLD) {
        comboBubble.classList.add("burst");
        showToast(`Комбо ×${currentCombo}! 🔥`);
        setTimeout(() => comboBubble.classList.remove("show","burst"), 700);
      }
      currentCombo = 0;
    }, 600);
  }

  // === НОВИЙ РЕВЕРБ — тримай 30 секунд! ===
  reverbBtn.addEventListener("click", () => {
    if (!confirm("Ти впевнений, що хочеш повернути час назад?")) return;
    reverbOverlay.classList.remove("hidden");
    timeTunnel.classList.add("active");
    reverbHint.style.display = "block";
    isReverbActive = true;

    // Хінт зникає через 4 секунди
    setTimeout(() => reverbHint.style.display = "none", 4000);
  });

  reverbClock.addEventListener("mousedown", () => {
    if (!isReverbActive) return;
    reverbHint.style.display = "none";

    // Хаотичний рух стрілок
    reverbChaosInterval = setInterval(() => {
      const rand = Math.random() * 360;
      reverbClock.querySelector(".hour").style.transform = `translateX(-50%) rotate(${rand}deg)`;
      reverbClock.querySelector(".minute").style.transform = `translateX(-50%) rotate(${rand*12}deg)`;
      reverbClock.querySelector(".second").style.transform = `translateX(-50%) rotate(${rand*60}deg)`;
    }, 50);

    // Через 30 секунд — реверб!
    reverbHoldTimeout = setTimeout(() => {
      clearInterval(reverbChaosInterval);
      completeReverb();
    }, 30000);
  });

  reverbClock.addEventListener("mouseup", () => {
    clearInterval(reverbChaosInterval);
    clearTimeout(reverbHoldTimeout);
  });

  function completeReverb(){
    prestigeMultiplier *= 1.2;
    score = 0; clickPower = 1; autoRate = 0; totalUpgradesBought = 0; maxPerClick = 1;
    upgrades.forEach((u, i) => { u.level = 0; buttons[i]?.classList.add("hidden"); u.update(); });
    buttons[0].classList.remove("hidden");
    updateScore(); updateStats(); updateAchievements();
    alert(`Реверб завершено! Множник: ${prestigeMultiplier.toFixed(2)}×`);
    reverbOverlay.classList.add("hidden");
    timeTunnel.classList.remove("active");
    isReverbActive = false;
  }

  // === ТОАСТ — 10 секунд ===
  function showToast(text){
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    t.style.fontSize = "18px";
    t.style.padding = "22px 44px";
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 10000);
  }

  // === КЛІК ===
  function addTime(){
    const gained = Math.round(clickPower * prestigeMultiplier);
    score += gained;
    clickCloudTotal += gained;
    clickGainEl.textContent = `+${formatTime(gained)}`;
    showFloating(`+${formatTime(gained)}`);
    triggerClickEffect();
    handleClickCombo();
    if(gained > maxPerClick) maxPerClick = gained;
    updateScore(); updateStats();
  }

  clock.addEventListener("click", addTime);

  // ... решта коду без змін (таби, заголовок, старт тощо) ...
};
