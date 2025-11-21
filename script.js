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
  let lastClickTime = 0;
  let currentCombo = 0;
  let maxComboEver = 0;
  let comboTimeout = null;
  const MAX_CLICK_INTERVAL = 350;
  const COMBO_THRESHOLD = 5;
  let isReverbActive = false;
  let reverbHoldTimeout = null;

  // Скіни
  let currentShape = "round";
  let currentClockSkin = "neon-blue";
  let currentHandSkin = "darkblue";
  let currentEffect = "red";

  // === МУЗИКА ===
  const trackNames = ["Фонк №1","Фонк №2","Фонк №3","Фонк №4","Фонк №5","Фонк №6","Фонк №7"];
  const tracks = ["asphalt-menace.mp3","digital-overdrive.mp3","drift-phonk-phonk-music-2-434611.mp3","drift-phonk-phonk-music-432222.mp3","phonk-music-409064 (2).mp3","phonk-music-phonk-2025-432208.mp3","pixel-drift.mp3"].map(x => `musicList/${x}`);

  function loadTrack(i){
    player.src = tracks[i];
    nowPlaying.textContent = `Зараз: ${trackNames[i]}`;
    if(isPlaying) player.play();
  }
  loadTrack(0);
  player.addEventListener("ended", () => { currentTrack = (currentTrack + 1) % tracks.length; loadTrack(currentTrack); });
  musicBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    if(isPlaying){ player.volume = 0.45; player.play().catch(()=>{}); musicBtn.textContent = "⏸ Зупинити музику"; }
    else{ player.pause(); musicBtn.textContent = "▶️ Включити музику"; }
  });
  prevTrack.onclick = () => { currentTrack = (currentTrack - 1 + tracks.length) % tracks.length; loadTrack(currentTrack); };
  nextTrack.onclick = () => { currentTrack = (currentTrack + 1) % tracks.length; loadTrack(currentTrack); };

  // === ФОРМАТУВАННЯ ЧАСУ ===
  function formatTime(seconds){
    seconds = Math.floor(seconds);
    const units = [{name:"століття", value:60*60*24*365*100},{name:"десятиліття", value:60*60*24*365*10},{name:"рік", value:60*60*24*365},{name:"міс", value:60*60*24*30},{name:"дн", value:60*60*24},{name:"год", value:60*60},{name:"хв", value:60},{name:"сек", value:1}];
    let remaining = seconds, parts = [];
    for(const u of units){
      const amt = Math.floor(remaining / u.value);
      if(amt>0){ parts.push(`${amt} ${u.name}`); remaining %= u.value; }
    }
    return parts.length ? parts.join(" ") : `${seconds} сек`;
  }

  // === АПГРЕЙДИ ===
  const upgrades = [
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
    up.getCost = function(){ return Math.floor(up.baseCost * Math.pow(1.15, up.level)); };
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
    score -= cost; up.level++; totalUpgradesBought++;
    if(up.type === "click"){ clickPower += Math.round(up.bonus * prestigeMultiplier); if(clickPower > maxPerClick) maxPerClick = clickPower; }
    else autoRate += Math.round(up.bonus * prestigeMultiplier);
    showToast(`Куплено: ${up.name} (Lv.${up.level}) ✅`);
    revealNext(); up.update(); updateAllButtons(); updateScore(); updateStats(); updateAchievements();
  }

  function updateAllButtons(){ upgrades.forEach(up => up.update()); }

  // === СКІНИ ===
  const shapes = [{id:"round", name:"Круг"},{id:"square", name:"Квадрат"},{id:"diamond", name:"Ромб"},{id:"oval", name:"Овал"}];
  const clockSkins = [{id:"neon-blue", name:"Неон синій"},{id:"purple", name:"Пурпурний"},{id:"pink", name:"Рожевий"},{id:"black", name:"Чорний"}];
  const handSkins = [{id:"darkblue", name:"Темно-сині"},{id:"neon", name:"Неонові"},{id:"pixel", name:"Піксельні"},{id:"chrome", name:"Хром"}];
  const effects = [{id:"red", name:"Червоний спалах"},{id:"blue", name:"Синій вибух"},{id:"glitch", name:"Глітч"},{id:"blackhole", name:"Чорна діра"},{id:"ripple", name:"Хвиля часу"}];

  function applyAllSkins(){
    clock.className = "clock " + currentShape;
    clock.style.borderColor = ""; clock.style.boxShadow = "";
    if(currentClockSkin==="neon-blue"){ clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 50px #0ea5e9, 0 0 100px #0ea5e9"; }
    if(currentClockSkin==="purple"){ clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 50px #8b5cf6, 0 0 100px #8b5cf6"; }
    if(currentClockSkin==="pink"){ clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 50px #ec4899, 0 0 100px #ec4899"; }
    if(currentClockSkin==="black"){ clock.style.borderColor="#111"; clock.style.boxShadow="0 0 10px #000"; }
    document.querySelectorAll("#clickableClock .hand, #reverbClock .hand").forEach(h => {
      h.style.background = "";
      if(currentHandSkin==="darkblue") h.style.background="#1e3a8a";
      if(currentHandSkin==="neon") h.style.background="#0ea5e9";
      if(currentHandSkin==="pixel") h.style.background="linear-gradient(#fff,#aaa)";
      if(currentHandSkin==="chrome") h.style.background="linear-gradient(90deg,#ddd,#888,#ddd)";
    });
  }

  function createSkinGrid(id, list, cb){
    const root = document.getElementById(id);
    list.forEach((s,i) => {
      const el = document.createElement("div");
      el.className = "skin";
      el.textContent = s.name;
      el.onclick = () => { root.querySelectorAll(".skin").forEach(e=>e.classList.remove("active")); el.classList.add("active"); cb(s.id); applyAllSkins(); };
      if(i===0) el.classList.add("active");
      root.appendChild(el);
    });
  }
  createSkinGrid("shapeSkins", shapes, id=>currentShape=id);
  createSkinGrid("clockSkins", clockSkins, id=>currentClockSkin=id);
  createSkinGrid("handSkins", handSkins, id=>currentHandSkin=id);
  createSkinGrid("effectSkins", effects, id=>currentEffect=id);
  applyAllSkins();

  // === КОМБО + КЛІК ===
  function handleClickCombo(){ /* твій оригінальний код комбо */ 
    const now = Date.now();
    if (now - lastClickTime < MAX_CLICK_INTERVAL) currentCombo++; else currentCombo = 1;
    lastClickTime = now;
    if (currentCombo > maxComboEver) maxComboEver = currentCombo;
    if (currentCombo >= COMBO_THRESHOLD) { comboCount.textContent = currentCombo; comboBubble.classList.add("show"); }
    clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      if (currentCombo >= COMBO_THRESHOLD) { comboBubble.classList.add("burst"); showToast(`Комбо ×${currentCombo}! 🔥`); setTimeout(() => comboBubble.classList.remove("show","burst"), 700); }
      currentCombo = 0;
    }, 600);
  }

  function showToast(text){
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 10000);
  }

  function addTime(){
    const gained = Math.round(clickPower * prestigeMultiplier);
    score += gained; clickCloudTotal += gained;
    clickGainEl.textContent = `+${formatTime(gained)}`;
    showFloating(`+${formatTime(gained)}`);
    triggerClickEffect(); handleClickCombo();
    if(gained > maxPerClick) maxPerClick = gained;
    updateScore(); updateStats();
  }

  function triggerClickEffect(){
    clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
    void clock.offsetWidth;
    clock.classList.add("click-effect-" + currentEffect);
  }

  function showFloating(text){
    const el = document.createElement("div");
    el.textContent = text;
    el.style = "position:absolute;right:20px;top:50px;color:#ffccd1;font-weight:700;opacity:1;transition:all .9s";
    clockWrapper.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = "translateX(60px) translateY(-80px)"; el.style.opacity = "0"; });
    setTimeout(() => el.remove(), 920);
  }

  clockWrapper.addEventListener("click", e => { if (e.target.closest("#clickableClock") || e.target === clockWrapper) addTime(); });

  // === СТАТИСТИКА ===
  function updateScore(){ scoreText.textContent = `Часу витрачено: ${formatTime(score)}`; cloudTotalEl.textContent = formatTime(clickCloudTotal); updateAllButtons(); }
  function updateStats(){
    realTimePlayedEl.textContent = formatTime((Date.now()-sessionStart)/1000);
    virtualTimeEl.textContent = formatTime(score);
    totalUpgradesEl.textContent = totalUpgradesBought;
    maxPerClickEl.textContent = formatTime(maxPerClick);
    prestigeMultEl.textContent = prestigeMultiplier.toFixed(2)+"×";
  }

  // === АВТО + РЕАЛЬНИЙ ЧАС ===
  setInterval(() => {
    const gained = Math.round(autoRate * prestigeMultiplier);
    if(gained > 0){ score += gained; clickCloudTotal += gained; updateScore(); }
    updateStats();
    // updateAchievements() – якщо в тебе є, додай сам, або я додам
  }, 1000);

  function updateClockHands(){
    const now = new Date();
    document.querySelector("#clickableClock .second").style.transform = `translateX(-50%) rotate(${now.getSeconds()*6}deg)`;
    document.querySelector("#clickableClock .minute").style.transform = `translateX(-50%) rotate(${now.getMinutes()*6 + now.getSeconds()*0.1}deg)`;
    document.querySelector("#clickableClock .hour").style.transform = `translateX(-50%) rotate(${(now.getHours()%12)*30 + now.getMinutes()*0.5}deg)`;
  }
  setInterval(updateClockHands, 1000); updateClockHands();

  // === НОВИЙ РЕВЕРБ ===
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
      const duration = 1.5 + Math.random()*1.5;
      const dir = Math.random()>0.5 ? -1 : 1;
      const speed = 360 * (4 + Math.random()*8) * dir;
      hand.style.animation = `reverbChaos ${duration}s linear infinite`;
      hand.style.setProperty('--chaos-rotation', speed + 'deg');
    });
    reverbClock.style.animation = "pulse 1.2s ease-in-out infinite";
    reverbHoldTimeout = setTimeout(completeReverb, 10000);
  };

  const stopReverbHold = () => {
    clearTimeout(reverbHoldTimeout);
    reverbClock.classList.remove("reverb-mode");
    timeTunnel.classList.remove("intense");
    reverbClock.style.animation = "";
    document.querySelectorAll("#reverbClock .hand").forEach(h => h.style.animation = "");
  };

  reverbClock.addEventListener("mousedown", startReverbHold);
  reverbClock.addEventListener("touchstart", e=>{e.preventDefault(); startReverbHold();});
  reverbClock.addEventListener("mouseup", stopReverbHold);
  reverbClock.addEventListener("mouseleave", stopReverbHold);
  reverbClock.addEventListener("touchend", stopReverbHold);

  function completeReverb(){
    stopReverbHold();
    prestigeMultiplier *= 1.2;
    score = clickPower = autoRate = totalUpgradesBought = maxPerClick = 0;
    clickPower = 1;
    upgrades.forEach((u,i)=>{u.level=0; buttons[i]?.classList.add("hidden"); u.update();});
    buttons[0].classList.remove("hidden");
    timeTunnel.classList.add("reverb-complete");
    setTimeout(()=>{ alert(`Реверб завершено! Множник: ${prestigeMultiplier.toFixed(2)}×`); reverbOverlay.classList.add("hidden"); timeTunnel.classList.remove("active","intense","reverb-complete"); isReverbActive=false; },1200);
    updateScore(); updateStats();
  }

  // ТАБИ + ЗАГОЛОВОК
  document.querySelectorAll(".top-tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".top-tabs .tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  if(worldTitle){
    worldTitle.addEventListener("keydown", e => { if(e.key==="Enter") e.preventDefault(); });
    worldTitle.addEventListener("blur", () => {
      let t = worldTitle.textContent.trim() || "Times Clicker";
      if(!/\sTime$/i.test(t)) worldTitle.textContent = t + " Time";
    });
  }

  updateScore(); updateStats();
};
