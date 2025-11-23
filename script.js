window.onload = function () {
  // === DOM ===
  const clock = document.getElementById("clickableClock");
  const clockWrapper = document.getElementById("clockWrapper");
  const comboBubble = document.getElementById("comboBubble");
  const comboCount = document.getElementById("comboCount");
  const musicBtn = document.getElementById("musicBtn");
  const prevTrack = document.getElementById("prevTrack");
  const nextTrack = document.getElementById("nextTrack");
  const player = document.getElementById("player");
  const scoreText = document.getElementById("score");
  const upgradesContainer = document.getElementById("upgrades");
  const multipliersContainer = document.getElementById("multipliers");
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
  let score = 0;
  let clickPower = 1;
  let autoRate = 0;
  let isPlaying = false;
  let currentTrack = 0;
  let sessionStart = Date.now();
  let totalUpgradesBought = 0;
  let maxPerClick = 1;
  let prestigeMultiplier = 1.0;
  let totalReverbs = 0;
  let maxAutoRate = 0;
  let maxComboEver = 0;
  let clickCloudTotal = 0;
  let lastClickTime = 0;
  let currentCombo = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350;
  const COMBO_THRESHOLD = 5;
  let isReverbActive = false;
  let reverbHoldTimeout = null;
  let currentShape = "round";
  let currentClockSkin = "neon-blue";
  let currentHandSkin = "darkblue";
  let currentEffect = "red";
  let clickMultiplier = 1;
  const buttons = [];

  // === МУЗИКА ===
  const trackNames = ["Фонк №1","Фонк №2","Фонк №3","Фонк №4","Фонк №5","Фонк №6","Фонк №7"];
  const tracks = [
    "asphalt-menace.mp3","digital-overdrive.mp3","drift-phonk-phonk-music-2-434611.mp3",
    "drift-phonk-phonk-music-432222.mp3","phonk-music-409064 (2).mp3",
    "phonk-music-phonk-2025-432208.mp3","pixel-drift.mp3"
  ].map(x => `musicList/${x}`);

  function loadTrack(i){
    player.src = tracks[i];
    nowPlaying.textContent = `Зараз: ${trackNames[i]}`;
    if(isPlaying) player.play();
  }
  loadTrack(0);
  player.addEventListener("ended", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });
  musicBtn.addEventListener("click", () => {
    if(!isPlaying){
      isPlaying = true;
      player.volume = 0.45;
      player.play().catch(() => {});
      musicBtn.textContent = "⏸ Зупинити музику";
    } else {
      isPlaying = false;
      player.pause();
      musicBtn.textContent = "Включити музику";
    }
  });
  prevTrack.onclick = () => { currentTrack = (currentTrack - 1 + tracks.length) % tracks.length; loadTrack(currentTrack); };
  nextTrack.onclick = () => { currentTrack = (currentTrack + 1) % tracks.length; loadTrack(currentTrack); };

  // === ФОРМАТУВАННЯ ЧАСУ ===
  function formatTime(seconds){
    seconds = Math.floor(seconds);
    const units = [
      {name:"століття", value:60*60*24*365*100},
      {name:"десятиліття", value:60*60*24*365*10},
      {name:"рік", value:60*60*24*365},
      {name:"міс", value:60*60*24*30},
      {name:"дн", value:60*60*24},
      {name:"год", value:60*60},
      {name:"хв", value:60},
      {name:"сек", value:1},
    ];
    let remaining = seconds;
    const parts = [];
    for(const u of units){
      const amt = Math.floor(remaining / u.value);
      if(amt>0){
        parts.push(`${amt} ${u.name}`);
        remaining %= u.value;
      }
    }
    return parts.length ? parts.join(" ") : `${seconds} сек`;
  }

  // === АПГРЕЙДИ ===
  const upgrades = [
    { name:"Кліпати очима", baseCost:1, level:0 },
    { name:"Включити телефон", baseCost:8, level:0 },
    { name:"Гортати стрічку", baseCost:40, level:0 },
    { name:"Мем-тур", baseCost:200, level:0 },
    { name:"Автоперегляд", baseCost:1100, level:0 },
    { name:"Підписка", baseCost:6500, level:0 },
    { name:"Серіал-марафон", baseCost:40000, level:0 },
    { name:"Робота з дедлайном", baseCost:250000, level:0 },
    { name:"Життєвий крінж", baseCost:1600000, level:0 },
    { name:"Discord-марафон", baseCost:10000000, level:0 },
    { name:"Reels до ранку", baseCost:65000000, level:0 },
    { name:"Філософські роздуми", baseCost:400000000, level:0 },
  ];

  function fib(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
    return b;
  }

  upgrades.forEach((up, idx) => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn";
    if(idx > 0) btn.classList.add("hidden");
    btn.addEventListener("click", () => buyUpgrade(idx));
    upgradesContainer.appendChild(btn);
    buttons.push(btn);
    up.update = function(){
      const fibMultiplier = fib(up.level + 6);
      const cost = Math.floor(up.baseCost * fibMultiplier);
      btn.innerHTML = `${up.name} (Lv.${up.level})<span>${formatTime(cost)}</span>`;
      btn.disabled = score < cost;
    };
    up.getCost = function(){
      const fibMultiplier = fib(up.level + 6);
      return Math.floor(up.baseCost * fibMultiplier);
    };
    up.update();
  });

  function revealNext(){
    const boughtCount = upgrades.filter(u => u.level > 0).length;
    if(buttons[boughtCount]) buttons[boughtCount].classList.remove("hidden");
  }

  function buyUpgrade(i){
    const up = upgrades[i];
    const cost = up.getCost();
    if(score < cost) return;
    score -= cost;
    up.level++;
    totalUpgradesBought++;
    autoRate += (i + 1) * 5 * prestigeMultiplier;
    showToast(`Куплено: ${up.name} (Lv.${up.level})`);
    revealNext();
    up.update();
    updateAllButtons();
    updateScore(); updateStats(); updateAchievements();
    if (up.name === "Кліпати очима") {
      document.body.classList.add("eye-blink");
      setTimeout(() => document.body.classList.remove("eye-blink"), 1000);
    }
  }

  function updateAllButtons(){
    upgrades.forEach(up => up.update());
    multipliers.forEach(m => m.update && m.update());
  }

  // === МНОЖНИКИ КЛІКУ ===
  const multipliers = [
    { name: "Подвійний клік", cost: 5000, mult: 2, bought: false },
    { name: "Потрійний клік", cost: 50000, mult: 3, bought: false },
    { name: "x10 за клік", cost: 1000000, mult: 10, bought: false },
    { name: "x50 за клік", cost: 20000000, mult: 50, bought: false },
    { name: "x100 за клік", cost: 100000000, mult: 100, bought: false },
  ];

  multipliers.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn multiplier-btn";

    function updateButton() {
      if (m.bought) {
        btn.remove();
        return;
      }
      const canAfford = score >= m.cost;
      btn.innerHTML = `${m.name}<span>${formatTime(m.cost)}</span>`;
      btn.disabled = !canAfford;
      btn.style.opacity = canAfford ? "1" : "0.5";
      btn.style.background = canAfford ? "" : "#334155";
    }

    btn.addEventListener("click", () => {
      if (score < m.cost || m.bought) return;
      score -= m.cost;
      m.bought = true;
      clickMultiplier = m.mult;
      showToast(`Активовано: ${m.name}!`);
      updateButton();
      updateScore();
      updateStats();
    });

    multipliersContainer.appendChild(btn);
    m.update = updateButton;
    updateButton();
  });

  // === КЛІК ===
  function addTime() {
    const finalGain = Math.round(clickPower * clickMultiplier * prestigeMultiplier);
    score += finalGain;
    clickCloudTotal += finalGain;
    if (finalGain > maxPerClick) maxPerClick = finalGain;
    clickGainEl.textContent = `+${formatTime(finalGain)}`;
    showFloating(`+${formatTime(finalGain)}`);
    triggerClickEffect();
    handleClickCombo();
    updateScore();
    updateStats();
    updateAchievements();
  }

  clockWrapper.addEventListener("click", (e) => {
    if (e.target.closest("#clickableClock") || e.target === clockWrapper) {
      addTime();
    }
  });

  // === ГОДИННИК ===
  function updateClockHands(){
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds()/1000;
    const m = now.getMinutes() + s/60;
    const h = (now.getHours() % 12) + m/60;

    document.querySelectorAll(".second").forEach(h => h.style.transform = `translateX(-50%) rotate(${s*6}deg)`);
    document.querySelectorAll(".minute").forEach(h => h.style.transform = `translateX(-50%) rotate(${m*6}deg)`);
    document.querySelectorAll(".hour").forEach(h => h.style.transform = `translateX(-50%) rotate(${h*30}deg)`);
  }
  setInterval(updateClockHands, 50);
  updateClockHands();

  // === СТАТИСТИКА ТА ІНШЕ ===
  function updateStats() {
    realTimePlayedEl.textContent = formatTime((Date.now()-sessionStart)/1000);
    virtualTimeEl.textContent = formatTime(score);
    totalUpgradesEl.textContent = totalUpgradesBought;
    maxPerClickEl.textContent = formatTime(maxPerClick);
    prestigeMultEl.textContent = prestigeMultiplier.toFixed(2) + "×";

    document.getElementById("maxAutoRate").textContent = formatTime(autoRate);
    document.getElementById("maxCombo").textContent = maxComboEver;
    document.getElementById("totalReverbs").textContent = totalReverbs;

    const achieved = achievementsList.filter(a => a.done).length;
    document.getElementById("achievedCount").textContent = achieved;

    updateReverbText();
  }

  setInterval(() => {
    if (autoRate > maxAutoRate) maxAutoRate = autoRate;
  }, 1000);

  // === ПЕРЕЗАПУСК ===
  function completeReverb(){
    stopReverbHold();
    prestigeMultiplier *= 1.2;
    totalReverbs++;
    score = 0; clickPower = 1; autoRate = 0; totalUpgradesBought = 0; maxPerClick = 1; clickCloudTotal = 0; currentCombo = 0;
    upgrades.forEach((u, i) => { u.level = 0; buttons[i]?.classList.add("hidden"); u.update(); });
    buttons[0].classList.remove("hidden");
    timeTunnel.classList.add("reverb-complete");
    setTimeout(() => {
      alert(`Перезапуск завершено! Поточний множник: ${prestigeMultiplier.toFixed(2)}×`);
      reverbOverlay.classList.add("hidden");
      timeTunnel.classList.remove("active", "intense", "reverb-complete");
      isReverbActive = false;
    }, 1500);
    updateScore(); updateStats(); updateAchievements();
  }

  // === СЕКРЕТНА ПАНЕЛЬ ===
  let secretCode = "";
  document.addEventListener("keydown", (e) => {
    secretCode += e.key;
    if (secretCode.length > 8) secretCode = secretCode.slice(-8);
    if (secretCode === "22092005") {
      secretCode = "";
      showToast("22.09.2005 — доступ відкрито!");
      const panel = document.createElement("div");
      panel.id = "devPanel";
      panel.style.cssText = "position:fixed;bottom:20px;left:20px;z-index:99999;background:#0009;padding:15px;border-radius:12px;border:2px solid #f0f;color:#f0f;font-family:Poppins";
      panel.innerHTML = "<div style='text-align:center;margin-bottom:10px'>DEV PANEL</div>";
      ["+2 години", "+100 авто", "×2 престиж", "Реверб", "Закрити"].forEach((t,i) => {
        const b = document.createElement("button");
        b.textContent = t;
        b.style = "margin:5px 0;display:block;width:100%;padding:8px;background:#f0f;color:#000;border:none;border-radius:8px;cursor:pointer";
        b.onclick = () => {
          if (i===0) { score += 7200; clickCloudTotal += 7200; }
          if (i===1) autoRate += 100;
          if (i===2) prestigeMultiplier *= 2;
          if (i===3) completeReverb();
          if (i===4) panel.remove();
          updateScore(); updateStats();
        };
        panel.appendChild(b);
      });
      document.body.appendChild(panel);
    }
  });

  updateScore(); updateStats(); updateAchievements();
};
