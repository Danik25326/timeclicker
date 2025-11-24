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
  let maxCombo = 0;
  let clickCloudTotal = 0;
  let lastClickTime = 0;
  let currentCombo = 0;
  let maxComboEver = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350;
  const COMBO_THRESHOLD = 5;
  let isReverbActive = false;
  let reverbHoldTimeout = null;
  let clickMultiplier = 1;
  const buttons = [];

  // === МУЗИКА ===
  const trackNames = ["Фонк №1","Фонк №2","Фонк №3","Фонк №4","Фонк №5","Фонк №6","Фонк №7"];
  const tracks = [
    "asphalt-menace.mp3","digital-overdrive.mp3","drift-phonk-phonk-music-2-434611.mp3",
    "drift-phonk-phonk-music-432222.mp3","phonk-music-409064 (2).mp3",
    "phonk-music-phonk-2025-432208.mp3","pixel-drift.mp3"
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

  prevTrack.onclick = () => { currentTrack = (currentTrack - 1 + tracks.length) % tracks.length; loadTrack(currentTrack); };
  nextTrack.onclick = () => { currentTrack = (currentTrack + 1) % tracks.length; loadTrack(currentTrack); };

  // === ФОРМАТУВАННЯ ЧАСУ ===
  function formatTime(seconds) {
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
    for (const u of units) {
      const amt = Math.floor(remaining / u.value);
      if (amt > 0) {
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
    if (idx > 0) btn.classList.add("hidden");
    btn.addEventListener("click", () => buyUpgrade(idx));
    upgradesContainer.appendChild(btn);
    buttons.push(btn);

    up.update = function() {
      const fibMultiplier = fib(up.level + 6);
      const cost = Math.floor(up.baseCost * fibMultiplier * (idx + 1));
      btn.innerHTML = `${up.name} (Lv.${up.level})<span>${formatTime(cost)}</span>`;
      btn.disabled = score < cost;
    };
    up.getCost = function() {
      const fibMultiplier = fib(up.level + 6);
      return Math.floor(up.baseCost * fibMultiplier * (idx + 1));
    };
    up.update();
  });

  function revealNext() {
    const boughtCount = upgrades.filter(u => u.level > 0).length;
    if (buttons[boughtCount]) buttons[boughtCount].classList.remove("hidden");
  }

  function buyUpgrade(i) {
    const up = upgrades[i];
    const cost = up.getCost();
    if (score < cost) return;
    score -= cost;
    up.level++;
    totalUpgradesBought++;
    autoRate += (i + 1) * 5 * prestigeMultiplier;
    showToast(`Куплено: ${up.name} (Lv.${up.level}) ✅`);
    revealNext();
    up.update();
    updateAllButtons();
    updateScore(); updateStats(); updateAchievements();

    if (up.name === "Кліпати очима") {
      document.body.classList.add("eye-blink");
      setTimeout(() => document.body.classList.remove("eye-blink"), 1000);
    }
  }

  function updateAllButtons() {
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
      if (!canAfford) {
        btn.style.background = "#334155";
        btn.style.opacity = "0.5";
      } else {
        btn.style.background = "";
        btn.style.opacity = "1";
      }
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
    const baseGain = clickPower;
    const finalGain = Math.round(baseGain * clickMultiplier * prestigeMultiplier);
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
// === НОВИЙ МАГАЗИН СКІНІВ — З МИТТЄВОЮ ПІДСВІТКОЮ ===

// Скіни стрілок
const handSkins = [
  {id:"darkblue", name:"Темно-сині", price: 0, apply:()=>{document.querySelectorAll(".hand:not(.second)").forEach(h=>{h.style.background="#1e3a8a"; h.style.boxShadow=""; h.style.animation="";});}},
  {id:"pixel",    name:"Піксельні",   price: 900, apply:()=>{document.querySelectorAll(".hand:not(.second)").forEach(h=>{h.style.background="linear-gradient(#fff,#aaa)"; h.style.boxShadow=""; h.style.animation="";});}},
  {id:"neon",     name:"Неонові",     price: 9000, apply:()=>{document.querySelectorAll(".hand:not(.second)").forEach(h=>{h.style.background="#0ea5e9"; h.style.boxShadow="0 0 25px #0ea5e9, 0 0 60px #0ea5e9"; h.style.animation="neonPulse 2s ease-in-out infinite alternate";});}},
  {id:"chrome",   name:"Хром",        price: 43200, apply:()=>{document.querySelectorAll(".hand:not(.second)").forEach(h=>{h.style.background="linear-gradient(90deg,#ddd,#888,#ddd)"; h.style.boxShadow="0 0 15px #fff, 0 0 30px #aaa"; h.style.animation="";});}},
];

// Форма годинника
const shapes = [
  {id:"round",   name:"Круг",     price: 0 },
  {id:"square",  name:"Квадрат",  price: 28800 },
  {id:"diamond", name:"Ромб",     price: 86400 },
  {id:"oval",    name:"Овал",     price: 172800 },
];

// Колір рамки
const clockSkins = [
  {id:"neon-blue", name:"Неон синій", price: 0, apply:()=>{clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 50px #0ea5e9, 0 0 100px #0ea5e9";}},
  {id:"purple",    name:"Пурпурний",  price: 64800, apply:()=>{clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 50px #8b5cf6, 0 0 100px #8b5cf6";}},
  {id:"pink",      name:"Рожевий",    price: 129600, apply:()=>{clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 50px #ec4899, 0 0 100px #ec4899";}},
  {id:"black",     name:"Чорний",     price: 259200, apply:()=>{clock.style.borderColor="#111"; clock.style.boxShadow="0 0 10px #000";}},
];

// Ефекти кліку
const effects = [
  {id:"red",       name:"Червоний спалах", price: 0 },
  {id:"blue",      name:"Синій вибух",     price: 21600 },
  {id:"glitch",    name:"Глітч",           price: 108000 },
  {id:"blackhole", name:"Чорна діра",      price: 360000 },
  {id:"ripple",    name:"Хвиля часу",      price: 720000 },
];

// ==== БАЗОВІ СТАНИ (БЕЗ LOCALSTORAGE) ====
let ownedSkins = {
  shapes: ["round"],
  clockSkins: ["neon-blue"],
  handSkins: ["darkblue"],
  effects: ["red"]
};

let currentShape = "round";
let currentClockSkin = "neon-blue";
let currentHandSkin = "darkblue";
let currentEffect = "red";

// === Покупка ===
function buySkin(type, id, price, name) {
  if (ownedSkins[type].includes(id)) {
    showToast("Цей скін уже куплено");
    return;
  }

  if (score < price) {
    showToast("Не вистачає часу!");
    return;
  }

  score -= price;
  ownedSkins[type].push(id);

  if (type === "shapes") currentShape = id;
  if (type === "clockSkins") currentClockSkin = id;
  if (type === "handSkins") currentHandSkin = id;
  if (type === "effects") currentEffect = id;

  applyAllSkins();
  updateScore();
  showToast(`Куплено: ${name} ✅`);

  refreshAllSkinGrids();
  updateSkinHighlights(); // миттєве підсвічування
}

// === Застосування скінів ===
function applyAllSkins() {
  document.querySelector(".clock").className = "clock " + currentShape;

  const clockSkin = clockSkins.find(s => s.id === currentClockSkin);
  if (clockSkin?.apply) clockSkin.apply();

  const handSkin = handSkins.find(s => s.id === currentHandSkin);
  if (handSkin?.apply) handSkin.apply();
}

// === Генерація кнопок ===
function createSkinGrid(containerId, list, type) {
  const root = document.getElementById(containerId);
  root.innerHTML = "";

  list.forEach(s => {
    const el = document.createElement("div");
    el.className = "skin";
    el.textContent = s.name;

    const isOwned = ownedSkins[type].includes(s.id);
    const isActive =
      (type === "shapes" && s.id === currentShape) ||
      (type === "clockSkins" && s.id === currentClockSkin) ||
      (type === "handSkins" && s.id === currentHandSkin) ||
      (type === "effects" && s.id === currentEffect);

    if (isOwned) {
      el.classList.add("owned");
      if (isActive) el.classList.add("active");

      el.onclick = () => {
        if (type === "shapes") currentShape = s.id;
        if (type === "clockSkins") currentClockSkin = s.id;
        if (type === "handSkins") currentHandSkin = s.id;
        if (type === "effects") currentEffect = s.id;

        applyAllSkins();
        refreshAllSkinGrids();
      };
    } else {
      el.style.opacity = "0.4";
      if (score >= s.price) {
        el.style.opacity = "1";
        el.style.boxShadow = "0 0 15px #0ff";
      }

      el.innerHTML += `<br><small style="color:#ff00ff">${formatTime(s.price)}</small>`;
      el.onclick = () => buySkin(type, s.id, s.price, s.name);
    }

    root.appendChild(el);
  });
}

// === Оновлення підсвічування ===
function updateSkinHighlights() {
  ["shapes","clockSkins","handSkins","effects"].forEach(type => {
    const list = {shapes, clockSkins, handSkins, effects}[type];
    list.forEach(s => {
      const el = document.getElementById(type + "_" + s.id) || document.querySelector(`#${type} .skin:nth-child(${list.indexOf(s)+1})`);
      if (!el) return;
      if (!ownedSkins[type].includes(s.id) && score >= s.price) {
        el.style.opacity = "1";
        el.style.boxShadow = "0 0 15px #0ff";
      } else if (!ownedSkins[type].includes(s.id)) {
        el.style.opacity = "0.4";
        el.style.boxShadow = "";
      }
    });
  });
}

// === Оновлення всіх сіток ===
function refreshAllSkinGrids() {
  createSkinGrid("shapeSkins", shapes, "shapes");
  createSkinGrid("clockSkins", clockSkins, "clockSkins");
  createSkinGrid("handSkins", handSkins, "handSkins");
  createSkinGrid("effectSkins", effects, "effects");
  updateSkinHighlights();
}

// === ПЕРШИЙ ВИКЛИК ===
refreshAllSkinGrids();
applyAllSkins();

  // === КОМБО ===
  function handleClickCombo() {
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

  // === ТОАСТ ===
  function showToast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    t.style.fontSize = "18px";
    t.style.padding = "22px 48px";

    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 10000);
  }

  // === КЛІК ===
  function triggerClickEffect() {
    clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
    void clock.offsetWidth;
    clock.classList.add("click-effect-" + currentEffect);
  }

  clockWrapper.addEventListener("click", (e) => {
    if (e.target.closest("#clickableClock") || e.target === clockWrapper) {
      addTime();
    }
  });

  function showFloating(text) {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "absolute";
    el.style.right = "20px";
    el.style.top = "50px";
    el.style.color = "#ffccd1";
    el.style.fontWeight = "700";
    el.style.opacity = "1";
    el.style.transition = "all 0.9s ease-out";
    clockWrapper.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = "translateX(60px) translateY(-80px)";
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 920);
  }

  // === СТАТИСТИКА ===
  function updateScore() {
    scoreText.textContent = `Часу витрачено: ${formatTime(score)}`;
    cloudTotalEl.textContent = `${formatTime(clickCloudTotal)}`;
    updateAllButtons();
  }

  function updateStats() {
    realTimePlayedEl.textContent = formatTime((Date.now() - sessionStart) / 1000);
    virtualTimeEl.textContent = formatTime(score);
    totalUpgradesEl.textContent = totalUpgradesBought;
    maxPerClickEl.textContent = formatTime(maxPerClick);
    prestigeMultEl.textContent = prestigeMultiplier.toFixed(2) + "×";

    document.getElementById("maxAutoRate").textContent = formatTime(autoRate);
    document.getElementById("maxCombo").textContent = maxComboEver;
    document.getElementById("totalReverbs").textContent = totalReverbs;

    const achieved = achievementsList.filter(a => a.done).length;
    document.getElementById("achievedCount").textContent = achieved;
    document.getElementById("totalAchievements").textContent = achievementsList.length;

    updateReverbText();
  }

  // Рекорди
  setInterval(() => {
    if (autoRate > maxAutoRate) maxAutoRate = autoRate;
    if (maxComboEver > maxCombo) maxCombo = maxComboEver;
  }, 1000);

  // === ДОСЯГНЕННЯ ===
  const achRoot = document.getElementById("achievements");
  const achievementsList = [
    {title:"Перший клік", desc:"Зробити перший клік", target:1, get:()=>clickCloudTotal},
    {title:"100 сек", desc:"Витратити 100 сек", target:100, get:()=>score},
    {title:"Перша покупка", desc:"Купити перший апгрейд", target:1, get:()=>totalUpgradesBought},
    {title:"Авто запущено", desc:"Маєш autoRate > 0", target:1, get:()=>autoRate>0?1:0},
    {title:"Комбо-майстер", desc:"Досягти комбо 10+", target:10, get:()=>maxComboEver},
    {title:"Стильний", desc:"Змінити будь-який скін", target:1, get:()=>(currentShape!=="round"||currentClockSkin!=="neon-blue")?1:0},
  ];

  achievementsList.forEach(a => {
    const el = document.createElement("div");
    el.className = "achievement";
    el.innerHTML = `<strong>${a.title}</strong><div style="font-size:12px;color:#bcd">${a.desc}</div><div class="ach-progress"></div><div class="ach-state">0%</div>`;
    achRoot.appendChild(el);
    a.progressEl = el.querySelector(".ach-progress");
    a.stateEl = el.querySelector(".ach-state");
  });

  function updateAchievements() {
    achievementsList.forEach(a => {
      const val = a.get();
      const percent = Math.min(100, (val / a.target) * 100);
      a.progressEl.style.width = percent + "%";
      if (percent >= 100 && !a.done) {
        a.done = true;
        a.stateEl.textContent = "Виконано ✅";
        a.stateEl.style.color = "#8df299";
        showToast(`Досягнення: ${a.title} ✅`);
      } else if (percent < 100) {
        a.stateEl.textContent = Math.floor(percent) + "%";
      }
    });
  }

  // === АВТО ТІК ===
  setInterval(() => {
    const gained = Math.round(autoRate * prestigeMultiplier);
    if (gained > 0) {
      score += gained;
      clickCloudTotal += gained;
      updateScore();
    }
    updateStats();
    updateAchievements();
  }, 1000);

  // === РЕАЛЬНИЙ ГОДИННИК ===
  function updateClockHands() {
    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours() % 12;
    document.querySelectorAll(".second").forEach(h => h.style.transform = `translateX(-50%) rotate(${s*6}deg)`);
    document.querySelectorAll(".minute").forEach(h => h.style.transform = `translateX(-50%) rotate(${m*6 + s*0.1}deg)`);
    document.querySelectorAll(".hour").forEach(h => h.style.transform = `translateX(-50%) rotate(${h*30 + m*0.5}deg)`);
  }
  setInterval(updateClockHands, 1000);
  updateClockHands();

  // === РЕВЕРБ ===
  reverbBtn.addEventListener("click", () => {
    if (!confirm("Ти впевнений, що хочеш повернути час назад?")) return;
    reverbOverlay.classList.remove("hidden");
    timeTunnel.classList.add("active");
    reverbHint.style.opacity = "1";
    isReverbActive = true;
    setTimeout(() => reverbHint.style.opacity = "0", 3000);
  });

  const startReverbHold = () => {
    if (!isReverbActive) return;
    reverbHint.style.opacity = "0";
    reverbClock.classList.add("reverb-mode");
    timeTunnel.classList.add("intense");
    document.querySelectorAll("#reverbClock .hand").forEach(hand => {
      const duration = 0.8 + Math.random() * 1.2;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const turns = 15 + Math.random() * 25;
      const rotation = direction * turns * 360;
      hand.style.animation = `chaosSpin ${duration}s linear infinite`;
      hand.style.setProperty('--rand', `${rotation}deg`);
    });
    reverbHoldTimeout = setTimeout(completeReverb, 10000);
  };

  const stopReverbHold = () => {
    clearTimeout(reverbHoldTimeout);
    reverbClock.classList.remove("reverb-mode");
    timeTunnel.classList.remove("intense");
    document.querySelectorAll("#reverbClock .hand").forEach(hand => hand.style.animation = "");
    reverbClock.style.borderColor = "#ff00ff";
  };

  reverbClock.addEventListener("mousedown", startReverbHold);
  reverbClock.addEventListener("touchstart", e => { e.preventDefault(); startReverbHold(); });
  reverbClock.addEventListener("mouseup", stopReverbHold);
  reverbClock.addEventListener("mouseleave", stopReverbHold);
  reverbClock.addEventListener("touchend", stopReverbHold);

  function completeReverb() {
    stopReverbHold();
    prestigeMultiplier *= 1.2;
    totalReverbs++;
    score = 0; clickPower = 1; autoRate = 0; totalUpgradesBought = 0; maxPerClick = 1;
    clickCloudTotal = 0; currentCombo = 0;
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

  // === ТАБИ ===
  document.querySelectorAll(".top-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".top-tabs .tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // === ЗАГОЛОВОК ===
  if (worldTitle) {
    worldTitle.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
    worldTitle.addEventListener("blur", () => {
      let t = worldTitle.textContent.trim();
      if (!t) worldTitle.textContent = "Times Clicker";
      else if (!/\sTime$/i.test(t)) worldTitle.textContent = `${t} Time`;
    });
  }

  // === СЕКРЕТНА ПАНЕЛЬ 22.09.2005 ===
  let secretCode = "";
  const magicCode = "22092005";
  document.addEventListener("keydown", (e) => {
    secretCode += e.key;
    if (secretCode.length > 8) secretCode = secretCode.slice(-8);
    if (secretCode === magicCode) {
      secretCode = "";
      showToast("22.09.2005 — доступ відкрито!");
      createDevPanel();
    }
  });

  function createDevPanel() {
    if (document.getElementById("ultimateDevPanel")) return;
    const panel = document.createElement("div");
    panel.id = "ultimateDevPanel";
    panel.style.cssText = `
      position:fixed;bottom:20px;left:20px;z-index:99999;
      background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);
      border:2px solid #ff00ff;border-radius:14px;
      padding:12px 16px;box-shadow:0 0 30px #ff00ff;
      font-family:Poppins,sans-serif;color:#fff;font-size:13px;
      width:210px;
    `;
    panel.innerHTML = `<div style="color:#ff00ff;font-weight:700;text-align:center;margin-bottom:8px;font-size:14px;">
                        Секретна панель
                       </div>`;
    function addBtn(text, color, action) {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.cssText = `
        margin:4px 0;padding:8px 12px;width:100%;
        background:${color};border:none;border-radius:10px;
        color:#fff;font-weight:600;cursor:pointer;font-size:12px;
        transition:transform 0.2s;
      `;
      btn.onmouseover = () => btn.style.transform = "translateY(-2px)";
      btn.onmouseout = () => btn.style.transform = "";
      btn.onclick = () => {
        action();
        showToast(text + " OK");
      };
      panel.appendChild(btn);
    }
    addBtn("+2 години", "#06d6d6", () => { score += 7200; clickCloudTotal += 7200; updateScore(); updateStats(); });
    addBtn("+100 авто/сек", "#3b82f6", () => autoRate += 100);
    addBtn("×2 престиж", "#a855f7", () => { prestigeMultiplier *= 2; updateStats(); });
    addBtn("Реверб", "#ec4899", () => completeReverb());
    addBtn("Закрити", "#555", () => { panel.remove(); showToast("Панель закрита"); });
    document.body.appendChild(panel);
  }

  // === ДИНАМІЧНИЙ ТЕКСТ ПЕРЕЗАПУСКУ ===
  const reverbDesc = document.getElementById("reverbDesc");
  const nextMultiplierEl = document.getElementById("nextMultiplier");

  function updateReverbText() {
    const nextMult = (prestigeMultiplier * 1.2).toFixed(2);
    nextMultiplierEl.textContent = nextMult;
  }
  updateScore(); updateStats(); updateAchievements();
};
