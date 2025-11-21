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
  let totalBought = 0;
  let maxPerClick = 1;
  let prestigeMultiplier = 1.0;
  let clickCloudTotal = 0;
  let lastClickTime = 0;
  let currentCombo = 0;
  let maxComboEver = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350;
  const COMBO_THRESHOLD = 5;
  let isReverbActive = false;
  let reverbHoldTimeout = null;
  let currentShape = "round";
  let currentClockSkin = "neon-blue";
  let currentHandSkin = "darkblue";
  let currentEffect = "red";

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
      musicBtn.textContent = "▶️ Включити музику";
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

// === НОВІ АПГРЕЙДИ — ФІБОНАЧЧІ + КУМУЛЯТИВНИЙ ЗРІСТ ===
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

// Функція Фібоначчі для кумулятивного росту
function fib(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
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
    const fibMultiplier = fib(up.level + 6); // починаємо з більшого числа, щоб було важко
    const cost = Math.floor(up.baseCost * fibMultiplier * (idx + 1));
    btn.innerHTML = `${up.name} (Lv.${up.level})<span>${formatTime(cost)}</span>`;
    btn.disabled = score < cost;
  };
  up.getCost = function(){
    const fibMultiplier = fib(up.level + 6);
    return Math.floor(up.baseCost * fibMultiplier * (idx + 1));
  };
  up.update();
});

function buyUpgrade(i){
  const up = upgrades[i];
  const cost = up.getCost();
  if(score < cost) return;
  score -= cost;
  up.level++;
  totalUpgradesBought++;

  // Всі апгрейди додають тільки авто-час (автодобыча)
  autoRate += (i + 1) * 5 * prestigeMultiplier; // від 5 до 60 сек/с

  showToast(`Куплено: ${up.name} (Lv.${up.level}) ✅`);
  revealNext();
  up.update();
  updateAllButtons();
  updateScore(); updateStats(); updateAchievements();

  // Анімація "заплющення очей" при покупці
  document.body.classList.add("blink");
  setTimeout(() => document.body.classList.remove("blink"), 200);
}
  function updateAllButtons(){
    upgrades.forEach(up => up.update());
  }
  // Множники кліку (окремий список)
const multipliers = [
  { name:"Подвійний клік", cost:5000, mult:2, level:0 },
  { name:"Потрійний клік", cost:50000, mult:3, level:0 },
  { name:"x10 за клік", cost:1000000, mult:10, level:0 },
  { name:"x50 за клік", cost:20000000, mult:50, level:0 },
  { name:"x100 за клік", cost:100000000, mult:100, level:0 },
];

let clickMultiplier = 1; // глобальний множник кліку

// Створюємо кнопки множників
multipliers.forEach((m, idx) => {
  const btn = document.createElement("button");
  btn.className = "upgrade-btn multiplier-btn";
  btn.innerHTML = `${m.name}<span>${formatTime(m.cost)}</span>`;
  document.getElementById("multipliers").appendChild(btn);

  btn.addEventListener("click", () => {
    if (score < m.cost) return;
    score -= m.cost;
    m.level++;
    clickMultiplier = m.mult;
    btn.innerHTML = `${m.name} (активно)`;
    btn.disabled = true;
    showToast(`Активовано: ${m.name}!`);
    document.body.classList.add("blink");
    setTimeout(() => document.body.classList.remove("blink"), 200);
  });
});

  // === СКІНИ ===
  const shapes = [{id:"round", name:"Круг"},{id:"square", name:"Квадрат"},{id:"diamond", name:"Ромб"},{id:"oval", name:"Овал"}];
  const clockSkins = [
    {id:"neon-blue", name:"Неон синій", apply:()=>{clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 50px #0ea5e9, 0 0 100px #0ea5e9";}},
    {id:"purple", name:"Пурпурний", apply:()=>{clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 50px #8b5cf6, 0 0 100px #8b5cf6";}},
    {id:"pink", name:"Рожевий", apply:()=>{clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 50px #ec4899, 0 0 100px #ec4899";}},
    {id:"black", name:"Чорний", apply:()=>{clock.style.borderColor="#111"; clock.style.boxShadow="0 0 10px #000";}},
  ];
  const handSkins = [
    {id:"darkblue", name:"Темно-сині", apply:()=>{document.querySelectorAll(".hand").forEach(h=>h.style.background="#1e3a8a");}},
    {id:"neon", name:"Неонові", apply:()=>{document.querySelectorAll(".hand").forEach(h=>h.style.background="#0ea5e9");}},
    {id:"pixel", name:"Піксельні", apply:()=>{document.querySelectorAll(".hand").forEach(h=>h.style.background="linear-gradient(#fff,#aaa)");}},
    {id:"chrome", name:"Хром", apply:()=>{document.querySelectorAll(".hand").forEach(h=>h.style.background="linear-gradient(90deg,#ddd,#888,#ddd)");}},
  ];
  const effects = [
    {id:"red", name:"Червоний спалах"},
    {id:"blue", name:"Синій вибух"},
    {id:"glitch", name:"Глітч"},
    {id:"blackhole", name:"Чорна діра"},
    {id:"ripple", name:"Хвиля часу"},
  ];
  function createSkinGrid(containerId, list, callback){
    const root = document.getElementById(containerId);
    list.forEach((s,i)=>{
      const el = document.createElement("div");
      el.className = "skin";
      el.textContent = s.name;
      el.onclick = ()=>{
        root.querySelectorAll(".skin").forEach(e=>e.classList.remove("active"));
        el.classList.add("active");
        callback(s.id);
      };
      if(i===0) el.classList.add("active");
      root.appendChild(el);
    });
  }
  function applyAllSkins(){
    document.querySelectorAll(".clock").forEach(c => {
      c.className = "clock " + currentShape;
    });
    const clockSkin = clockSkins.find(s => s.id === currentClockSkin);
    if (clockSkin && clockSkin.apply) clockSkin.apply();
    const handSkin = handSkins.find(s => s.id === currentHandSkin);
    if (handSkin && handSkin.apply) {
      handSkin.apply();
    }
  }
  createSkinGrid("shapeSkins", shapes, (id)=>{currentShape=id; applyAllSkins();});
  createSkinGrid("clockSkins", clockSkins, (id)=>{currentClockSkin=id; applyAllSkins();});
  createSkinGrid("handSkins", handSkins, (id)=>{currentHandSkin=id; applyAllSkins();});
  createSkinGrid("effectSkins", effects, (id)=>{currentEffect=id;});
  applyAllSkins();

  // === КОМБО ===
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

  // === ТОАСТ ===
  function showToast(text){
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    t.style.fontSize = "18px";
    t.style.padding = "22px 48px";
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 10000);
  }

  // === КЛІК ===
function addTime(){
  const gained = Math.round(clickMultiplier * prestigeMultiplier);
  score += gained;
  clickCloudTotal += gained;
  clickGainEl.textContent = `+${formatTime(gained)}`;
  showFloating(`+${formatTime(gained)}`);
  triggerClickEffect();
  handleClickCombo();
  if(gained > maxPerClick) maxPerClick = gained;
  updateScore(); updateStats();
}
  function triggerClickEffect(){
    clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
    void clock.offsetWidth;
    clock.classList.add("click-effect-" + currentEffect);
  }
  clockWrapper.addEventListener("click", (e) => {
    if (e.target.closest("#clickableClock") || e.target === clockWrapper) {
      addTime();
    }
  });
  function showFloating(text){
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
  function updateScore(){
    scoreText.textContent = `Часу витрачено: ${formatTime(score)}`;
    cloudTotalEl.textContent = `${formatTime(clickCloudTotal)}`;
    updateAllButtons();
  }
  function updateStats(){
    realTimePlayedEl.textContent = formatTime((Date.now()-sessionStart)/1000);
    virtualTimeEl.textContent = formatTime(score);
    totalUpgradesEl.textContent = totalUpgradesBought;
    maxPerClickEl.textContent = `${formatTime(maxPerClick)}`;
    prestigeMultEl.textContent = `${prestigeMultiplier.toFixed(2)}×`;
  }

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

  // === АВТО ТІК ===
  setInterval(() => {
    const gained = Math.round(autoRate * prestigeMultiplier);
    if(gained > 0){
      score += gained;
      clickCloudTotal += gained;
      updateScore();
    }
    updateStats();
    updateAchievements();
  }, 1000);

  // === РЕАЛЬНИЙ ГОДИННИК ===
  function updateClockHands(){
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

  // === ОСТАТОЧНИЙ КОСМІЧНИЙ РЕВЕРБ ===
  let reverbTime = 0;  // лічильник секунд утримання

  reverbBtn.addEventListener("click", () => {
    if (!confirm("Ти впевнений, що хочеш повернути час назад?")) return;
    reverbOverlay.classList.remove("hidden");
    timeTunnel.classList.add("active");
    reverbHint.style.opacity = "1";
    isReverbActive = true;
    reverbTime = 0;
    setTimeout(() => reverbHint.style.opacity = "0", 3000);
  });

  const startReverbHold = () => {
    if (!isReverbActive) return;
    reverbHint.style.opacity = "0";
    reverbClock.classList.add("reverb-mode");
    timeTunnel.classList.add("intense");

    // Прискорення кожну секунду
    const accelInterval = setInterval(() => {
      reverbTime++;
      if (reverbTime >= 10) clearInterval(accelInterval);

      document.querySelectorAll("#reverbClock .hand").forEach(hand => {
        const baseSpeed = 360 * (reverbTime * 2 + 5);  // від повільного до шаленого
        const direction = Math.random() > 0.5 ? 1 : -1;
        const rotation = direction * baseSpeed * 10;

        hand.style.animationDuration = `${Math.max(0.3, 3 - reverbTime * 0.25)}s`;  // швидшає
        hand.style.setProperty('--rand', `${rotation}deg`);
      });

      // Прискорюємо фон
      document.querySelector(".reverb-overlay::before").style.animationDuration = `${Math.max(1, 12 - reverbTime)}s`;

      // Зміна кольору обідка
      const colors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#ff006e", "#ff3b5c"];
      reverbClock.style.borderColor = colors[reverbTime % colors.length];
    }, 1000);

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

  function completeReverb(){
    stopReverbHold();
    prestigeMultiplier *= 1.2;
    score = 0; clickPower = 1; autoRate = 0; totalUpgradesBought = 0; maxPerClick = 1;
    upgrades.forEach((u, i) => { u.level = 0; buttons[i]?.classList.add("hidden"); u.update(); });
    buttons[0].classList.remove("hidden");

    timeTunnel.classList.add("reverb-complete");
    setTimeout(() => {
      alert(`Реверб завершено! Множник: ${prestigeMultiplier.toFixed(2)}×`);
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
  if(worldTitle){
    worldTitle.addEventListener("keydown", e => { if(e.key==="Enter") e.preventDefault(); });
    worldTitle.addEventListener("blur", () => {
      let t = worldTitle.textContent.trim();
      if(!t) worldTitle.textContent = "Times Clicker";
      else if(!/\sTime$/i.test(t)) worldTitle.textContent = `${t} Time`;
    });
  }

  updateScore(); updateStats(); updateAchievements();
};
