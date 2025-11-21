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
  let totalUpgradesBought = 0;
  let maxPerClick = 1;
  let prestigeMultiplier = 1.0;
  let clickCloudTotal = 0;

  // Комбо
  let lastClickTime = 0;
  let currentCombo = 0;
  let maxComboEver = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350;
  const COMBO_THRESHOLD = 5;

  // Реверб
  let isReverbActive = false;
  let reverbHoldTimeout = null;

  // Скіни
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

  // === АПГРЕЙДИ === (без змін, все ок)
  // ... (тут той самий код апгрейдів, що був у тебе — залишаємо без змін)

  // === СКІНИ ===
  const shapes = [{id:"round", name:"Круг"},{id:"square", name:"Квадрат"},{id:"diamond", name:"Ромб"},{id:"oval", name:"Овал"}];
  const clockSkins = [
    {id:"neon-blue", name:"Неон синій"},
    {id:"purple", name:"Пурпурний"},
    {id:"pink", name:"Рожевий"},
    {id:"black", name:"Чорний"},
  ];
  const handSkins = [
    {id:"darkblue", name:"Темно-сині"},
    {id:"neon", name:"Неонові"},
    {id:"pixel", name:"Піксельні"},
    {id:"chrome", name:"Хром"},
  ];
  const effects = [
    {id:"red", name:"Червоний спалах"},
    {id:"blue", name:"Синій вибух"},
    {id:"glitch", name:"Глітч"},
    {id:"blackhole", name:"Чорна діра"},
    {id:"ripple", name:"Хвиля часу"},
  ];

  // Оновлюємо обидва годинники (основний + реверб)
  function applyAllSkins(){
    // Основний годинник
    clock.className = "clock " + currentShape;
    clock.style.borderColor = "";
    clock.style.boxShadow = "";
    if(currentClockSkin === "neon-blue"){ clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 50px #0ea5e9, 0 0 100px #0ea5e9"; }
    if(currentClockSkin === "purple"){ clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 50px #8b5cf6, 0 0 100px #8b5cf6"; }
    if(currentClockSkin === "pink"){ clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 50px #ec4899, 0 0 100px #ec4899"; }
    if(currentClockSkin === "black"){ clock.style.borderColor="#111"; clock.style.boxShadow="0 0 10px #000"; }

    // Стрілки (обидва годинники)
    const allHands = document.querySelectorAll("#clickableClock .hand, #reverbClock .hand");
    allHands.forEach(h => {
      h.style.background = "";
      if(currentHandSkin === "darkblue") h.style.background = "#1e3a8a";
      if(currentHandSkin === "neon") h.style.background = "#0ea5e9";
      if(currentHandSkin === "pixel") h.style.background = "linear-gradient(#fff,#aaa)";
      if(currentHandSkin === "chrome") h.style.background = "linear-gradient(90deg,#ddd,#888,#ddd)";
    });
  }

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

  createSkinGrid("shapeSkins", shapes, (id)=>{currentShape=id; applyAllSkins();});
  createSkinGrid("clockSkins", clockSkins, (id)=>{currentClockSkin=id; applyAllSkins();});
  createSkinGrid("handSkins", handSkins, (id)=>{currentHandSkin=id; applyAllSkins();});
  createSkinGrid("effectSkins", effects, (id)=>{currentEffect=id;});
  applyAllSkins();

  // === РЕВЕРБ — НОВА КРУТА ВЕРСІЯ ===
  reverbBtn.addEventListener("click", () => {
    if (!confirm("Ти впевнений, що хочеш повернути час назад?")) return;
    reverbOverlay.classList.remove("hidden");
    timeTunnel.classList.add("active");
    reverbHint.style.opacity = "1";
    isReverbActive = true;
    setTimeout(() => reverbHint.style.opacity = "0", 3000);
  });

  function startReverbHold(){
    if (!isReverbActive) return;
    reverbHint.style.opacity = "0";
    reverbClock.classList.add("reverb-mode");
    timeTunnel.classList.add("intense");

    // Хаотичний рух кожної стрілки окремо
    document.querySelectorAll("#reverbClock .hand").forEach((hand, i) => {
      const duration = 1.5 + Math.random() * 1.5; // 1.5-3 сек
      const direction = Math.random() > 0.5 ? -1 : 1;
      const speed = 360 * (3 + Math.random() * 7) * direction; // дуже швидко
      hand.style.animation = `reverbChaos ${duration}s linear infinite`;
      hand.style.setProperty('--chaos-rotation', `${speed}deg`);
    });

    // Пульсація годинника
    reverbClock.style.animation = "pulse 1.2s ease-in-out infinite";

    reverbHoldTimeout = setTimeout(completeReverb, 10000);
  }

  function stopReverbHold(){
    clearTimeout(reverbHoldTimeout);
    reverbClock.classList.remove("reverb-mode");
    timeTunnel.classList.remove("intense");
    reverbClock.style.animation = "";
    document.querySelectorAll("#reverbClock .hand").forEach(hand => {
      hand.style.animation = "";
    });
  }

  // Підтримка миші + тач
  reverbClock.addEventListener("mousedown", startReverbHold);
  reverbClock.addEventListener("touchstart", (e) => { e.preventDefault(); startReverbHold(); });
  reverbClock.addEventListener("mouseup", stopReverbHold);
  reverbClock.addEventListener("mouseleave", stopReverbHold);
  reverbClock.addEventListener("touchend", stopReverbHold);

  function completeReverb(){
    stopReverbHold();
    prestigeMultiplier *= 1.2;
    score = 0; clickPower = 1; autoRate = 0; totalUpgradesBought = 0; maxPerClick = 1;
    upgrades.forEach((u, i) => { u.level = 0; buttons[i]?.classList.add("hidden"); u.update(); });
    buttons[0].classList.remove("hidden");

    // Крутий фінальний ефект
    timeTunnel.classList.add("reverb-complete");
    setTimeout(() => {
      alert(`Реверб завершено! Множник: ${prestigeMultiplier.toFixed(2)}×`);
      reverbOverlay.classList.add("hidden");
      timeTunnel.classList.remove("active", "intense", "reverb-complete");
      isReverbActive = false;
    }, 1200);
    updateScore(); updateStats(); updateAchievements();
  }

  // === КЛІК, КОМБО, РЕАЛЬНИЙ ЧАС тощо — без змін ===
  // (весь інший код залишається як у тебе, тільки додав applyAllSkins() де треба)

  // ТАБИ — виправлено z-index у CSS нижче
  document.querySelectorAll(".top-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".top-tabs .tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  updateScore(); updateStats(); updateAchievements();
};
