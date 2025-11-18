/* TimesClicker — main script */
window.onload = function () {
  // DOM
  const clock = document.getElementById("clickableClock");
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

  // State
  let score = 0;               // virtual time spent
  let clickPower = 1;         // seconds per click
  let autoRate = 0;           // seconds per second from auto upgrades
  let isPlaying = false;
  let currentTrack = 0;
  let sessionStart = Date.now();
  let totalUpgradesBought = 0;
  let maxPerClick = 1;
  let prestigeMultiplier = 1.0;
  let clickCloudTotal = 0;

  // Tracks (assume files are in musicList/)
  const trackNames = [
    "Фонк №1","Фонк №2","Фонк №3","Фонк №4","Фонк №5","Фонк №6","Фонк №7"
  ];
  const tracks = [
    "asphalt-menace.mp3",
    "digital-overdrive.mp3",
    "drift-phonk-phonk-music-2-434611.mp3",
    "drift-phonk-phonk-music-432222.mp3",
    "phonk-music-409064 (2).mp3",
    "phonk-music-phonk-2025-432208.mp3",
    "pixel-drift.mp3"
  ].map(x => `musicList/${x}`);

  // Load track
  function loadTrack(i){
    player.src = tracks[i];
    nowPlaying.textContent = `Зараз: ${trackNames[i]}`;
    if(isPlaying) player.play();
  }
  loadTrack(0);

  // when ended -> next
  player.addEventListener("ended", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });

  musicBtn.addEventListener("click", () => {
    if(!isPlaying){
      isPlaying = true;
      player.volume = 0.45;
      player.play().catch(()=>{ /* autoplay restrictions handled by user click */ });
      musicBtn.textContent = "⏸ Зупинити музику";
    } else {
      isPlaying = false;
      player.pause();
      musicBtn.textContent = "▶️ Включити музику";
    }
  });

  prevTrack.addEventListener("click", () => {
    currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
    loadTrack(currentTrack);
  });
  nextTrack.addEventListener("click", () => {
    currentTrack = (currentTrack + 1) % tracks.length;
    loadTrack(currentTrack);
  });

  // format time (seconds) into units
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

  // Upgrades: mix of click and auto
  const upgrades = [
    { name:"Кліпати очима", baseCost:1, type:"click", bonus:1, level:0, desc:"Кліп - мінус секунду швидко." },
    { name:"Включити телефон", baseCost:8, type:"auto", bonus:1, level:0, desc:"Телефон віднімає час автоматично (1 сек / 5 с базово)." },
    { name:"Гортати стрічку новин", baseCost:25, type:"auto", bonus:3, level:0, desc:"Погладжування стрічки — пасивний втрачач часу." },
    { name:"Невеликий мем-тур", baseCost:90, type:"click", bonus:2, level:0, desc:"Клік дає більше втрат." },
    { name:"Автоперегортання", baseCost:450, type:"auto", bonus:10, level:0, desc:"Серйозна автоматизація." },
    { name:"Придбати підписку", baseCost:2400, type:"auto", bonus:30, level:0, desc:"Всі підписки крадуть час." },
    { name:"Серіал-марафон", baseCost:15000, type:"auto", bonus:120, level:0, desc:"Великий пасив." },
    { name:"Проєкт із затримкою", baseCost:120000, type:"click", bonus:50, level:0, desc:"Коли клікаєш, втрачається дуже багато." },
    { name:"Життєвий крінж", baseCost:800000, type:"auto", bonus:500, level:0, desc:"Топовий авто-витрачальник." },
  ];

  // Render upgrades
  const buttons = [];
  upgrades.forEach((up, idx) => {
    const btn = document.createElement("button");
    btn.className = "upgrade-btn hidden";
    btn.addEventListener("click", () => buyUpgrade(idx));
    upgradesContainer.appendChild(btn);
    buttons.push(btn);

    up.update = function(){
      const cost = Math.floor(up.baseCost * Math.pow(1.15, up.level));
      btn.textContent = `${up.name} (Lv.${up.level}) — ${formatTime(cost)}`;
      btn.disabled = score < cost;
    };
    up.getCost = function(){
      return Math.floor(up.baseCost * Math.pow(1.15, up.level));
    };
    up.update();
  });
  if(buttons[0]) buttons[0].classList.remove("hidden");

  function revealNext(i){
    if(buttons[i+1]) buttons[i+1].classList.remove("hidden");
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
    // progressive reveal - show next every buy
    up.update();
    revealNext(i);
    updateAllButtons();
    updateScore();
    updateStats();
  }

  function updateAllButtons(){
    upgrades.forEach((up, idx) => {
      up.update();
      if(!buttons[idx].classList.contains("hidden")){
        buttons[idx].disabled = score < up.getCost();
      }
    });
  }

  // Score / UI updates
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

  // Click animation and bubble
  function triggerClockAnimation(){
    clock.classList.remove("click-anim");
    void clock.offsetWidth;
    clock.classList.add("click-anim");
  }

  function showFloating(text){
    // create floating element near clock on the right
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "absolute";
    el.style.right = "-10px";
    el.style.top = "30px";
    el.style.color = "#ffccd1";
    el.style.fontWeight = "700";
    el.style.opacity = "1";
    el.style.transition = "transform 900ms ease-out, opacity 900ms";
    document.getElementById("clockWrapper").appendChild(el);
    requestAnimationFrame(()=> {
      el.style.transform = "translateX(40px) translateY(-60px)";
      el.style.opacity = "0";
    });
    setTimeout(()=> el.remove(), 920);
  }

  // Click handler
  function addTime(){
    const gained = Math.round(clickPower * 1); // multiplied already by prestige when bought
    score += gained;
    clickCloudTotal += gained;
    clickGainEl.textContent = `+${formatTime(gained)}`;
    showFloating(`+${formatTime(gained)}`);
    triggerClockAnimation();
    if(gained > maxPerClick) maxPerClick = gained;
    updateScore(); updateStats();
  }
  clock.addEventListener("click", addTime);

  // Auto tick (per second)
  setInterval(() => {
    // autoRate is seconds per second (total passive loss)
    const gained = Math.round(autoRate * 1);
    if(gained>0){
      score += gained;
      clickCloudTotal += gained;
      updateScore();
      updateStats();
    }
    // update real-time display
    updateStats();
  }, 1000);

  // Clock hands
  function updateClockHands(){
    const now = new Date();
    const s = now.getSeconds();
    const m = now.getMinutes();
    const h = now.getHours()%12;
    if(secondHand) secondHand.style.transform = `translateX(-50%) rotate(${s*6}deg)`;
    if(minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${m*6 + s*0.1}deg)`;
    if(hourHand) hourHand.style.transform = `translateX(-50%) rotate(${h*30 + m*0.5}deg)`;
  }
  setInterval(updateClockHands,1000);
  updateClockHands();

  // Skins (simple — change border color or background)
  const skins = [
    {name:"Неон синій", style:()=>{ clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 30px #0ea5e9"; }},
    {name:"Пурпурний", style:()=>{ clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 30px #8b5cf6"; }},
    {name:"Рожевий", style:()=>{ clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 30px #ec4899"; }},
    {name:"Чорний мінімал", style:()=>{ clock.style.borderColor="#222"; clock.style.boxShadow="none"; }},
  ];
  const skinsRoot = document.getElementById("skins");
  skins.forEach((s, i) => {
    const el = document.createElement("div");
    el.className = "skin";
    el.textContent = s.name;
    el.style.background = "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)";
    el.onclick = ()=> {
      skins.forEach((_,j)=> skinsRoot.children[j].classList.remove("active"));
      el.classList.add("active");
      s.style();
    };
    skinsRoot.appendChild(el);
    if(i===0) el.classList.add("active");
  });

  // Achievements (simple examples)
  const achievementsList = [
    {id:"ach1", title:"Перший клік", desc:"Зробити перший клік", check: ()=> clickCloudTotal >= 1},
    {id:"ach2", title:"100 сек", desc:"Витратити 100 сек", check: ()=> clickCloudTotal >= 100},
    {id:"ach3", title:"Перша покупка", desc:"Купити перший апгрейд", check: ()=> totalUpgradesBought >= 1},
    {id:"ach4", title:"Авто запущено", desc:"Маєш autoRate > 0", check: ()=> autoRate > 0},
  ];
  const achRoot = document.getElementById("achievements");
  achievementsList.forEach(a => {
    const el = document.createElement("div");
    el.className = "achievement";
    el.id = a.id;
    el.innerHTML = `<strong>${a.title}</strong><div style="font-size:12px;color:#bcd">${a.desc}</div><div class="ach-state" style="margin-top:8px;color:#ffd">Стан: Чекає</div>`;
    achRoot.appendChild(el);
  });

  function updateAchievements(){
    achievementsList.forEach(a => {
      const el = document.getElementById(a.id);
      const state = el.querySelector(".ach-state");
      if(a.check()){
        state.textContent = "Пройдено ✅";
        state.style.color = "#8df299";
      } else {
        state.textContent = "Чекає";
        state.style.color = "#ffd";
      }
    });
  }

  // Reverb (prestige) — animation + reset
  reverbBtn.addEventListener("click", ()=>{
    // animation
    timeTunnel.classList.add("active");
    setTimeout(()=> {
      timeTunnel.classList.remove("active");
      // apply prestige: multiply multiplier by 1.2 and reset progress
      prestigeMultiplier *= 1.2;
      // reset basics
      score = 0;
      clickPower = 1;
      autoRate = 0;
      totalUpgradesBought = 0;
      maxPerClick = 1;
      // reset upgrades levels
      upgrades.forEach((u, idx)=> {
        u.level = 0;
        if(buttons[idx]) buttons[idx].classList.add("hidden");
        // reveal first again
        if(idx===0 && buttons[0]) buttons[0].classList.remove("hidden");
        u.update();
      });
      updateScore();
      updateStats();
      updateAchievements();
      alert(`Реверб завершено. Новий множник: ${prestigeMultiplier.toFixed(2)}×`);
    }, 2400);
  });

  // Tabs switching
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-page").forEach(p=>p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");
    });
  });

  // periodic UI updates
  setInterval(()=>{
    updateScore();
    updateStats();
    updateAchievements();
  }, 1000);

  // prevent Enter in title and auto append "Time" on blur
  if(worldTitle){
    worldTitle.addEventListener("keydown", (e)=>{ if(e.key==="Enter") e.preventDefault(); });
    worldTitle.addEventListener("blur", ()=>{
      let t = worldTitle.textContent.trim();
      if(!t) worldTitle.textContent = "Times Clicker";
      else if(!/(\bTime)$/i.test(t)) worldTitle.textContent = `${t} Time`;
    });
  }

  // initial UI refresh
  updateScore(); updateStats(); updateAchievements();
};
