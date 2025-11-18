/* TimesClicker — main script (updated with skins, combo bubble, toasts) */
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
  const skinsRoot = document.getElementById("skins");
  const achRoot = document.getElementById("achievements");
  const clockWrapper = document.getElementById("clockWrapper");

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

  // --- ADD: combo/rapid-click state
  let clickBuffer = []; // timestamps for rapid click detection
  let comboCount = 0;
  let comboTimeout = null;
  const COMBO_MIN = 10; // min clicks
  const COMBO_WINDOW_MS = 100; // period threshold per click (0.1s)
  const COMBO_MAX_SIZE = 22; // visual max bubble scale (clamped)
  // create combo bubble element
  const comboBubble = document.createElement("div");
  comboBubble.className = "combo-bubble";
  comboBubble.style.display = "none";
  clockWrapper.appendChild(comboBubble);

  // Toast container
  const toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
  function showToast(text, time = 2400) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    toastContainer.appendChild(t);
    // show
    requestAnimationFrame(()=> t.classList.add("show"));
    setTimeout(()=> {
      t.classList.remove("show");
      setTimeout(()=> t.remove(), 300);
    }, time);
  }

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

  // Upgrades: mix of click and auto (kept original)
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

  // Render upgrades (progressive reveal already implemented)
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
  function triggerClockAnimation(effect = 'red'){
    // remove all possible effect classes, then add selected
    clock.classList.remove("click-anim","click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
    // pick class by selected effect
    if(effect === 'red') clock.classList.add("click-effect-red");
    else if(effect === 'blue') clock.classList.add("click-effect-blue");
    else if(effect === 'glitch') clock.classList.add("click-effect-glitch");
    else if(effect === 'blackhole') clock.classList.add("click-effect-blackhole");
    else if(effect === 'ripple') clock.classList.add("click-effect-ripple");
    // remove after short timeout
    setTimeout(()=> {
      clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
    }, 420);
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

  // Click handler (keeps original behavior) + rapid combo detection
  // currentClickEffect chosen from clickEffects below (default 'red')
  let currentClickEffect = 'red';
  function addTime(){
    const gained = Math.round(clickPower * 1); // multiplied already by prestige when bought
    score += gained;
    clickCloudTotal += gained;
    clickGainEl.textContent = `+${formatTime(gained)}`;
    showFloating(`+${formatTime(gained)}`);
    triggerClockAnimation(currentClickEffect);
    if(gained > maxPerClick) maxPerClick = gained;
    updateScore(); updateStats();

    // --- ADD: rapid-click detection
    const now = Date.now();
    clickBuffer.push(now);
    // keep only last COMBO_WINDOW_MS window *but also allow accumulation across many clicks*
    clickBuffer = clickBuffer.filter(t => now - t <= 1000); // keep last 1s for counting speed bursts
    // count how many clicks within last COMBO_WINDOW_MS sliding windows
    // We'll detect: if there are >= COMBO_MIN clicks such that average spacing <= COMBO_WINDOW_MS
    if(clickBuffer.length >= COMBO_MIN){
      // compute average interval across last COMBO_MIN
      const last = clickBuffer.slice(-COMBO_MIN);
      let intervals = 0;
      for(let i=1;i<last.length;i++) intervals += (last[i]-last[i-1]);
      const avg = intervals / (last.length-1);
      if(avg <= COMBO_WINDOW_MS){
        // start/extend combo
        comboCount += 1;
        showComboBubble(clickBuffer.length);
        // reset combo timeout to detect end of burst
        if(comboTimeout) clearTimeout(comboTimeout);
        comboTimeout = setTimeout(()=> {
          // on combo end -> burst/pop
          popCombo(clickBuffer.length);
          comboCount = 0;
          clickBuffer = [];
        }, 180); // short wait after last click
      }
    }
  }
  clock.addEventListener("click", addTime);

  // SHOW combo bubble above clock, scale with clicks (clamped)
  function showComboBubble(clicks){
    const size = Math.min(COMBO_MAX_SIZE, Math.max(0, clicks));
    comboBubble.style.display = "flex";
    comboBubble.textContent = `x${clicks}`;
    const scale = 0.7 + (size / COMBO_MAX_SIZE) * 1.3;
    comboBubble.style.transform = `translateX(-50%) scale(${scale})`;
    // keep visible; final pop handled by popCombo
  }
  function popCombo(clicks){
    if(clicks < COMBO_MIN) {
      comboBubble.style.transform = `translateX(-50%) scale(0.01)`;
      comboBubble.style.display = "none";
      return;
    }
    // compute gained from burst (approx): sum of clickPower for last clicks
    // For a nicer message, show count and virtual seconds gained during burst
    const gained = Math.round(clickPower * (clicks)); // simple
    // visual pop
    comboBubble.classList.add("combo-pop");
    comboBubble.textContent = `ВИТРАТИ: ${formatTime(gained)}`;
    setTimeout(()=> {
      comboBubble.classList.remove("combo-pop");
      comboBubble.style.transform = `translateX(-50%) scale(0.01)`;
      comboBubble.style.display = "none";
    }, 380);
    // also show floating text and add to score/cloud if you want (we choose: it's already added per-click)
    // show toast summary
    showToast(`Комбо x${clicks} → ${formatTime(gained)} витрачено`);
  }

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

  // Skins (clock border / general) — original + we add click effects and hand skins
  const skins = [
    {name:"Неон синій", style:()=>{ clock.style.borderColor="#0ea5e9"; clock.style.boxShadow="0 0 30px #0ea5e9"; }},
    {name:"Пурпурний", style:()=>{ clock.style.borderColor="#8b5cf6"; clock.style.boxShadow="0 0 30px #8b5cf6"; }},
    {name:"Рожевий", style:()=>{ clock.style.borderColor="#ec4899"; clock.style.boxShadow="0 0 30px #ec4899"; }},
    {name:"Чорний мінімал", style:()=>{ clock.style.borderColor="#222"; clock.style.boxShadow="none"; }},
  ];

  // --- ADD: click-effect skins
  const clickEffects = [
    { id: 'red', name: 'Червоний спалах' },
    { id: 'blue', name: 'Синій електро' },
    { id: 'glitch', name: 'Глітч' },
    { id: 'blackhole', name: 'Чорна діра' },
    { id: 'ripple', name: 'Хвиля часу' }
  ];

  // --- ADD: hand skins
  const handSkins = [
    { id: 'dark', name: 'Темно-сині', class: 'skin-dark' },
    { id: 'neon', name: 'Неонові', class: 'skin-neon' },
    { id: 'pixel', name: 'Піксельні', class: 'skin-pixel' },
    { id: 'chrome', name: 'Хромовані', class: 'skin-chrome' },
    { id: 'glow', name: 'Прозорі (з підсвіткою)', class: 'skin-glow' },
  ];

  // render skins UI: we append sections inside #skins root
  (function renderSkinsUI(){
    skinsRoot.innerHTML = ''; // clear (in case)
    const sectionA = document.createElement("div");
    sectionA.className = "skins-section";
    sectionA.innerHTML = `<h4>Скіни годинника</h4>`;
    skins.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "skin";
      el.textContent = s.name;
      el.onclick = ()=> {
        // unselect others
        Array.from(sectionA.querySelectorAll('.skin')).forEach(x=>x.classList.remove('active'));
        el.classList.add("active");
        s.style();
      };
      if(i===0) el.classList.add("active");
      sectionA.appendChild(el);
    });
    skinsRoot.appendChild(sectionA);

    // click effects
    const sectionB = document.createElement("div");
    sectionB.className = "skins-section";
    sectionB.innerHTML = `<h4>Ефект при кліку</h4>`;
    clickEffects.forEach((e,i)=>{
      const b = document.createElement("div");
      b.className = "skin";
      b.textContent = e.name;
      b.onclick = ()=> {
        Array.from(sectionB.querySelectorAll('.skin')).forEach(x=>x.classList.remove('active'));
        b.classList.add("active");
        currentClickEffect = e.id;
      };
      if(i===0) b.classList.add("active");
      sectionB.appendChild(b);
    });
    skinsRoot.appendChild(sectionB);

    // hand skins
    const sectionC = document.createElement("div");
    sectionC.className = "skins-section";
    sectionC.innerHTML = `<h4>Скіни стрілок</h4>`;
    handSkins.forEach((h,i)=>{
      const b = document.createElement("div");
      b.className = "skin";
      b.textContent = h.name;
      b.onclick = ()=> {
        Array.from(sectionC.querySelectorAll('.skin')).forEach(x=>x.classList.remove('active'));
        b.classList.add("active");
        // apply class to hands
        [hourHand, minuteHand, secondHand].forEach(hand=>{
          hand.classList.remove('skin-dark','skin-neon','skin-pixel','skin-chrome','skin-glow');
          hand.classList.add(h.class);
        });
      };
      if(i===0) b.classList.add("active");
      sectionC.appendChild(b);
    });
    skinsRoot.appendChild(sectionC);
  })();

  // Achievements (simple examples) + progress
  const achievementsList = [
    {id:"ach1", title:"Перший клік", desc:"Зробити перший клік", check: ()=> clickCloudTotal >= 1, target:1},
    {id:"ach2", title:"100 сек", desc:"Витратити 100 сек", check: ()=> clickCloudTotal >= 100, target:100},
    {id:"ach3", title:"Перша покупка", desc:"Купити перший апгрейд", check: ()=> totalUpgradesBought >= 1, target:1},
    {id:"ach4", title:"Авто запущено", desc:"Маєш autoRate > 0", check: ()=> autoRate > 0, target:1},
  ];

  achievementsList.forEach(a => {
    const el = document.createElement("div");
    el.className = "achievement";
    el.id = a.id;
    el.innerHTML = `<strong>${a.title}</strong>
      <div style="font-size:12px;color:#bcd">${a.desc}</div>
      <div class="ach-state" style="margin-top:8px;color:#ffd">Стан: Чекає</div>
      <div class="progress">Прогрес: <span class="prog-value">0</span> / ${a.target}</div>
      <div class="progress-bar"><i style="width:0%"></i></div>
    `;
    achRoot.appendChild(el);
  });

  function updateAchievements(){
    achievementsList.forEach(a => {
      const el = document.getElementById(a.id);
      const state = el.querySelector(".ach-state");
      // calculate progress number (simple)
      let cur = 0;
      if(a.id === 'ach1') cur = Math.min(clickCloudTotal, a.target);
      else if(a.id === 'ach2') cur = Math.min(clickCloudTotal, a.target);
      else if(a.id === 'ach3') cur = Math.min(totalUpgradesBought, a.target);
      else if(a.id === 'ach4') cur = autoRate > 0 ? a.target : 0;
      const pct = Math.min(100, Math.round((cur / a.target) * 100));
      el.querySelector('.prog-value').textContent = cur;
      el.querySelector('.progress-bar > i').style.width = `${pct}%`;

      if(a.check()){
        if(!el.dataset.done){
          // just unlocked
          el.dataset.done = '1';
          state.textContent = "Пройдено ✅";
          state.style.color = "#8df299";
          // toast
          showToast(`Досягнення: ${a.title} отримано!`);
        } else {
          state.textContent = "Пройдено ✅";
          state.style.color = "#8df299";
        }
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
      showToast(`Реверб завершено. Новий множник: ${prestigeMultiplier.toFixed(2)}×`, 3000);
    }, 1200);
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
