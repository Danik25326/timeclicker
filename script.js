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
  let clickCloudTotal = 0;

  // === НОВА СИСТЕМА КОМБО (видалив дубль змінних) ===
  let lastClickTime = 0;
  let clickCombo = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350;  // мс між кліками (швидко!)
  const COMBO_THRESHOLD = 5;       // з якого кліку показувати бульбашку

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

  // === АПГРЕЙДИ ===
  const upgrades = [ /* твої 12 апгрейдів — без змін */ 
    { name:"Кліпати очима", baseCost:1, type:"click", bonus:1, level:0 },
    { name:"Включити телефон", baseCost:8, type:"auto", bonus:1, level:0 },
    { name:"Гортати стрічку новин", baseCost:25, type:"auto", bonus:3, level:0 },
    { name:"Невеликий мем-тур", baseCost:90, type:"click", bonus:2, level:0 },
    { name:"Автоперегортання", baseCost:450, type:"auto", bonus:10, level:0 },
    { name:"Придбати підписку", baseCost:2400, type:"auto", bonus:30, level:0 },
    { name:"Серіал-марафон", baseCost:15000, type:"auto", bonus:120, level:0 },
    { name:"Проєкт із затримкою", baseCost:120000, type:"click", bonus:50, level:0 },
    { name:"Життєвий крінж", baseCost:800000, type:"auto", bonus:500, level:0 },
    { name:"Зависнути в Discord", baseCost:5000000, type:"auto", bonus:2000, level:0 },
    { name:"Скролити Reels до ранку", baseCost:20000000, type:"click", bonus:300, level:0 },
    { name:"Філософські роздуми", baseCost:100000000, type:"auto", bonus:10000, level:0 },
  ];

  const buttons = [];
  upgrades.forEach((up, idx) => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn";
    if(idx > 0) btn.classList.add("hidden");
    btn.addEventListener("click", () => buyUpgrade(idx));
    upgradesContainer.appendChild(btn);
    buttons.push(btn);

    up.update = function(){
      const cost = Math.floor(up.baseCost * Math.pow(1.15, up.level));
      btn.innerHTML = `${up.name} (Lv.${up.level})<span>${formatTime(cost)}</span>`;
      btn.disabled = score < cost;
    };
    up.getCost = function(){
      return Math.floor(up.baseCost * Math.pow(1.15, up.level));
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

    if(up.type === "click"){
      clickPower += Math.round(up.bonus * prestigeMultiplier);
      if(clickPower > maxPerClick) maxPerClick = clickPower;
    } else {
      autoRate += Math.round(up.bonus * prestigeMultiplier);
    }

    // ← НОВА ФІШКА: тост при покупці
    showToast(`Куплено: ${up.name} (Lv.${up.level}) ✅`);

    revealNext();
    up.update();
    updateAllButtons();
    updateScore(); updateStats(); updateAchievements();
  }

  function updateAllButtons(){
    upgrades.forEach(up => up.update());
  }

  // === СКІНИ ===
  let currentShape = "round";
  let currentClockSkin = "neon-blue";
  let currentHandSkin = "darkblue";
  let currentEffect = "red";

  const shapes = [{id:"round", name:"Круг"},{id:"square", name:"Квадрат"},{id:"diamond", name:"Ромб"},{id:"oval", name:"Овал"}];
  const clockSkins = [
    {id:"neon-blue", name:"Неон синій", apply:()=>{clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 40px #0ea5e9, 0 0 80px #0ea5e9";}},
    {id:"purple", name:"Пурпурний", apply:()=>{clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 40px #8b5cf6, 0 0 80px #8b5cf6";}},
    {id:"pink", name:"Рожевий", apply:()=>{clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 40px #ec4899, 0 0 80px #ec4899";}},
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
      el.className="skin";
      el.textContent = s.name;
      el.onclick = ()=>{
        root.querySelectorAll(".skin").forEach(e=>e.classList.remove("active"));
        el.classList.add("active");
        callback(s.id, s);
      };
      if(i===0) el.classList.add("active");
      root.appendChild(el);
    });
  }

  function applyAllSkins(){
    clock.className = "clock " + currentShape;
    clockSkins.find(s=>s.id===currentClockSkin)?.apply();
    handSkins.find(s=>s.id===currentHandSkin)?.apply();
  }

  createSkinGrid("shapeSkins", shapes, (id)=>{currentShape=id; applyAllSkins();});
  createSkinGrid("clockSkins", clockSkins, (id)=>{currentClockSkin=id; applyAllSkins();});
  createSkinGrid("handSkins", handSkins, (id)=>{currentHandSkin=id; applyAllSkins();});
  createSkinGrid("effectSkins", effects, (id)=>{currentEffect=id;});
  applyAllSkins();

  // === ПРАВИЛЬНИЙ КОМБО (швидкі кліки) ===
  function handleClickCombo(){
    const now = Date.now();
    const diff = now - lastClickTime;

    if (diff < MAX_CLICK_INTERVAL) {
      clickCombo++;
    } else {
      clickCombo = 1; // скидаємо, бо клік був повільний
    }
    lastClickTime = now;

    if (clickCombo >= COMBO_THRESHOLD) {
      comboCount.textContent = clickCombo;
      comboBubble.classList.add("show");
    }

    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      if (clickCombo >= COMBO_THRESHOLD) {
        comboBubble.classList.add("burst");
        showToast(`Комбо ×${clickCombo}! 🔥`);
        setTimeout(() => {
          comboBubble.classList.remove("show", "burst");
        }, 700);
      }
      clickCombo = 0;
    }, 600);
  }

  // === ТОАСТ ===
  function showToast(text){
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    t.style.fontSize = "16px";          // трошки більший текст
    t.style.padding = "18px 36px";      // більше місця
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 6000); // 6 секунд замість 3.5
  }

  // === КЛІК ===
  function addTime(){
    const gained = Math.round(clickPower * prestigeMultiplier);
    score += gained;
    clickCloudTotal += gained;
    clickGainEl.textContent = `+${formatTime(gained)}`;
    showFloating(`+${formatTime(gained)}`);
    triggerClickEffect();
    handleClickCombo();          // ← тут нова функція
    if(gained > maxPerClick) maxPerClick = gained;
    updateScore(); updateStats();
  }

  function triggerClickEffect(){
    clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
    void clock.offsetWidth;
    clock.classList.add("click-effect-" + currentEffect);
  }

  clock.addEventListener("click", addTime);

  function showFloating(text){
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "absolute";
    el.style.right = "20px";
    el.style.top = "50px";
    el.style.color = "#ffccd1";
    el.style.fontWeight = "700";
    el.style.opacity = "1";
    el.style.transition = "transform 900ms ease-out, opacity 900ms";
    clockWrapper.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = "translateX(60px) translateY(-80px)";
      el.style.opacity = "0";
    });
    setTimeout(() => el.remove(), 920);
  }

  // === СТАТИСТИКА + АЧІВКИ ===
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

  const achievementsList = [
    {title:"Перший клік", desc:"Зробити перший клік", check: ()=> clickCloudTotal >= 1},
    {title:"100 сек", desc:"Витратити 100 сек", check: ()=> score >= 100},
    {title:"Перша покупка", desc:"Купити перший апгрейд", check: ()=> totalUpgradesBought >= 1},
    {title:"Авто запущено", desc:"Маєш autoRate > 0", check: ()=> autoRate > 0},
    {title:"Комбо-майстер", desc:"10+ швидких кліків", check: ()=> clickCombo >= 10},
    {title:"Стильний", desc:"Змінити скін", check: ()=> currentShape!=="round" || currentClockSkin!=="neon-blue"},
  ];

  const achRoot = document.getElementById("achievements");
  achievementsList.forEach(a => {
    const el = document.createElement("div");
    el.className = "achievement";
    el.innerHTML = `<strong>${a.title}</strong><div style="font-size:12px;color:#bcd">${a.desc}</div><div class="ach-state" style="margin-top:8px;color:#ffd">Чекає</div>`;
    achRoot.appendChild(el);
    a.el = el.querySelector(".ach-state");
  });

  function updateAchievements(){
    achievementsList.forEach(a => {
      if(a.check() && a.el.textContent !== "Пройдено ✅"){
        a.el.textContent = "Пройдено ✅";
        a.el.style.color = "#8df299";
        showToast(`Досягнення: ${a.title} ✅`);
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

  // === ГОДИННИК РЕАЛЬНИЙ ===
  function updateClockHands(){
    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours() % 12;
    secondHand.style.transform = `translateX(-50%) rotate(${s*6}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${m*6 + s*0.1}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${h*30 + m*0.5}deg)`;
  }
  setInterval(updateClockHands, 1000);
  updateClockHands();

// ... весь твій попередній код до ревербу ...

// ДОДАЄМО ДО achievementsList прогрес
const achievementsList = [
  {title:"Перший клік", desc:"Зробити перший клік", target:1, get:()=>clickCloudTotal},
  {title:"100 сек", desc:"Витратити 100 сек", target:100, get:()=>score},
  {title:"Перша покупка", desc:"Купити перший апгрейд", target:1, get:()=>totalUpgradesBought},
  {title:"Авто запущено", desc:"Маєш autoRate > 0", target:1, get:()=>autoRate>0?1:0},
  {title:"Комбо-майстер", desc:"10+ швидких кліків", target:10, get:()=>clickCombo},
  {title:"Стильний", desc:"Змінити будь-який скін", target:1, get:()=>(currentShape!=="round"||currentClockSkin!=="neon-blue")?1:0},
];

// Рендер досягнень з прогрес-баром
achievementsList.forEach(a => {
  const el = document.createElement("div");
  el.className = "achievement";
  el.innerHTML = `
    <strong>${a.title}</strong>
    <div style="font-size:12px;color:#bcd">${a.desc}</div>
    <div class="ach-progress"></div>
    <div class="ach-state">0%</div>
  `;
  achRoot.appendChild(el);
  a.el = el;
  a.progressEl = el.querySelector(".ach-progress");
  a.stateEl = el.querySelector(".ach-state");
});

function updateAchievements(){
  achievementsList.forEach(a => {
    const val = a.get();
    const percent = Math.min(100, (val / a.target) * 100);
    a.progressEl.style.width = percent + "%";
    if(percent >= 100){
      a.stateEl.textContent = "Виконано ✅";
      a.stateEl.style.color = "#8df299";
      if(!a.done){
        a.done = true;
        showToast(`Досягнення: ${a.title} ✅`);
      }
    } else {
      a.stateEl.textContent = Math.floor(percent) + "%";
    }
  });
}

// НОВИЙ РЕВЕРБ — гравець крутить стрілки!
const reverbOverlay = document.getElementById("reverbOverlay");
let isReverbActive = false;
let reverbStartX, reverbStartY;

reverbBtn.addEventListener("click", () => {
  if(confirm("Ти впевнений, що хочеш повернути час назад?")){
    reverbOverlay.classList.remove("hidden");
    timeTunnel.classList.add("active");
    isReverbActive = true;
    document.body.style.cursor = "grab";
  }
});

function completeReverb(){
  prestigeMultiplier *= 1.2;
  score = 0; clickPower = 1; autoRate = 0; totalUpgradesBought = 0; maxPerClick = 1;
  upgrades.forEach((u, i) => { u.level = 0; if(buttons[i]) buttons[i].classList.add("hidden"); u.update(); });
  buttons[0].classList.remove("hidden");
  updateScore(); updateStats(); updateAchievements();
  alert(`Реверб завершено! Множник: ${prestigeMultiplier.toFixed(2)}×`);
  reverbOverlay.classList.add("hidden");
  timeTunnel.classList.remove("active");
  isReverbActive = false;
}

// Крутимо стрілки мишкою/тачем
clock.addEventListener("mousedown", e => {
  if(!isReverbActive) return;
  reverbStartX = e.clientX;
  reverbStartY = e.clientY;
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});
function onMouseMove(e){
  if(!isReverbActive) return;
  const dx = e.clientX - reverbStartX;
  const dy = e.clientY - reverbStartY;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
  hourHand.style.transform = `translateX(-50%) rotate(${angle}deg)`;
  minuteHand.style.transform = `translateX(-50%) rotate(${angle*12}deg)`;
  secondHand.style.transform = `translateX(-50%) rotate(${angle*60}deg)`;
  // Якщо стрілки близько до 12:00
  if(Math.abs(angle % 360) < 15){
    completeReverb();
  }
}
function onMouseUp(){
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

// Тости — тепер 7 секунд
function showToast(text){
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  t.style.fontSize = "17px";
  t.style.padding = "20px 40px";
  toastContainer.appendChild(t);
  setTimeout(() => t.remove(), 7000);
}
