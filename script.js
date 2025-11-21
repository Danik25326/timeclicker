window.onload = () => {
  // DOM
  const $ = s => document.getElementById(s);
  const clock = $("clickableClock"), wrapper = $("clockWrapper"), combo = $("comboBubble"), comboCount = combo.querySelector("#comboCount");
  const player = $("player"), scoreEl = $("score"), gainEl = $("clickGain"), totalEl = $("cloudTotal");
  const nowPlay = $("nowPlaying"), realTimeEl = $("realTimePlayed"), virtEl = $("virtualTime");
  const upgradesEl = $("upgrades"), achievementsEl = $("achievements");
  const reverbBtn = $("reverbBtn"), reverbOverlay = $("reverbOverlay"), reverbClock = $("reverbClock"), reverbHint = $("reverbHint");
  const timeTunnel = $("timeTunnel"), toastCont = $("toastContainer");

  // State
  let score = 0, clickPower = 1, autoRate = 0, prestige = 1, clickTotal = 0, bought = 0, maxClick = 1;
  let combo = 0, maxCombo = 0, lastClick = 0, comboTimer = null;
  let isReverb = false, reverbTimer = null;
  let currentSkin = {shape:"round", color:"neon-blue", hands:"darkblue", effect:"red"};

  const sessionStart = Date.now();
  const COMBO_TIME = 350, COMBO_SHOW = 5;

  // МУЗИКА
  const tracks = ["asphalt-menace","digital-overdrive","drift-phonk-phonk-music-2-434611","drift-phonk-phonk-music-432222","phonk-music-409064 (2)","phonk-music-phonk-2025-432208","pixel-drift"].map(t => `musicList/${t}.mp3`);
  let track = 0, playing = false;
  const load = i => { player.src = tracks[i]; nowPlay.textContent = `Зараз: Фонк №${i+1}`; if(playing) player.play(); };
  load(0);
  player.onended = () => load(track = (track + 1) % tracks.length);
  $("musicBtn").onclick = () => {
    playing = !playing;
    playing ? player.play() : player.pause();
    $("musicBtn").textContent = playing ? "⏸ Зупинити" : "▶️ Включити музику";
  };
  $("prevTrack").onclick = () => load(track = (track - 1 + tracks.length) % tracks.length);
  $("nextTrack").onclick = () => load(track = (track + 1) % tracks.length);

  // ЧАС
  const fmt = s => {
    s = Math.floor(s);
    const u = [
      ["століття", 31536e5], ["десятиліття", 31536e4], ["рік", 31536e3],
      ["міс", 2592e3], ["дн", 86400], ["год", 3600], ["хв", 60], ["сек", 1]
    ];
    let r = "";
    for (const [n, v] of u) if (s >= v) { r += Math.floor(s/v) + " " + n + " "; s %= v; }
    return r || s + " сек";
  };

  // АПГРЕЙДИ
  const upgrades = [
    ["Кліпати очима",1,"click",1], ["Включити телефон",8,"auto",1], ["Гортати стрічку",25,"auto",3],
    ["Мем-тур",90,"click",2], ["Автоперегортання",450,"auto",10], ["Підписка",2400,"auto",30],
    ["Серіал-марафон",15e3,"auto",120], ["Проєкт із затримкою",12e4,"click",50], ["Життєвий крінж",8e5,"auto",500],
    ["Discord 24/7",5e6,"auto",2000], ["Reels до ранку",2e7,"click",300], ["Філософія",1e8,"auto",1e4]
  ].map(([n,c,t,b]) => ({name:n, base:c, type:t, bonus:b, level:0}));

  const btns = upgrades.map((u, i) => {
    const b = document.createElement("button");
    b.className = "upgrade-btn" + (i ? " hidden" : "");
    b.onclick = () => buy(i);
    upgradesEl.appendChild(b);
    u.btn = b;
    u.cost = () => Math.floor(u.base * 1.15**u.level);
    u.update = () => {
      b.innerHTML = `${u.name} (Lv.${u.level})<span>${fmt(u.cost())}</span>`;
      b.disabled = score < u.cost();
    };
    u.update();
    return b;
  });

  function reveal() {
    const bought = upgrades.filter(u => u.level).length;
    if (btns[bought]) btns[bought].classList.remove("hidden");
  }

  function buy(i) {
    const u = upgrades[i];
    const c = u.cost();
    if (score < c) return;
    score -= c; u.level++; bought++;
    if (u.type === "click") clickPower += Math.round(u.bonus * prestige);
    else autoRate += Math.round(u.bonus * prestige);
    showToast(`Куплено: ${u.name} (Lv.${u.level}) ✅`);
    reveal(); u.update(); updateAllButtons(); updateScore(); updateStats(); updateAch();
  }

  function updateAllButtons() { upgrades.forEach(u => u.update()); }

  // СКІНИ
  const applySkins = () => {
    clock.className = "clock " + currentSkin.shape;
    const c = { "neon-blue":"#0ea5e9", purple:"#8b5cf6", pink:"#ec4899", black:"#111" }[currentSkin.color];
    clock.style.borderColor = c; clock.style.boxShadow = `0 0 50px ${c}, 0 0 100px ${c}`;
    const h = { darkblue:"#1e3a8a", neon:"#0ea5e9", pixel:"linear-gradient(#fff,#aaa)", chrome:"linear-gradient(90deg,#ddd,#888,#ddd)" }[currentSkin.hands];
    document.querySelectorAll(".hand").forEach(e => e.style.background = h);
  };
  ["shape","clock","hand","effect"].forEach(type => {
    const id = type + "Skins";
    const list = type === "shape" ? [{id:"round",name:"Круг"},{id:"square",name:"Квадрат"},{id:"diamond",name:"Ромб"},{id:"oval",name:"Овал"}] :
                type === "clock" ? [{id:"neon-blue",name:"Неон синій"},{id:"purple",name:"Пурпурний"},{id:"pink",name:"Рожевий"},{id:"black",name:"Чорний"}] :
                type === "hand" ? [{id:"darkblue",name:"Темно-сині"},{id:"neon",name:"Неонові"},{id:"pixel",name:"Піксельні"},{id:"chrome",name:"Хром"}] :
                [{id:"red",name:"Червоний"},{id:"blue",name:"Синій"},{id:"glitch",name:"Глітч"},{id:"blackhole",name:"Чорна діра"},{id:"ripple",name:"Хвиля часу"}];
    list.forEach((s,i) => {
      const el = document.createElement("div");
      el.className = "skin" + (i===0?" active":"");
      el.textContent = s.name;
      el.onclick = () => {
        $(id).querySelectorAll(".skin").forEach(e=>e.classList.remove("active"));
        el.classList.add("active");
        currentSkin[type === "effect" ? "effect" : type === "clock" ? "color" : type] = s.id;
        if(type !== "effect") applySkins();
      };
      $(id).appendChild(el);
    });
  });
  applySkins();

  // КОМБО
  function comboClick() {
    const now = Date.now();
    currentCombo = (now - lastClickTime < MAX_CLICK_INTERVAL) ? currentCombo + 1 : 1;
    lastClickTime = now;
    if (currentCombo > maxCombo) maxCombo = currentCombo;
    if (currentCombo >= COMBO_SHOW) {
      comboCount.textContent = currentCombo;
      combo.classList.add("show");
    }
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
      if (currentCombo >= COMBO_SHOW) {
        combo.classList.add("burst");
        showToast(`Комбо ×${currentCombo}! 🔥`);
        setTimeout(() => combo.classList.remove("show","burst"), 700);
      }
      currentCombo = 0;
    }, 600);
  }

  // ТОАСТ 10 сек
  function showToast(t) {
    const e = document.createElement("div");
    e.className = "toast";
    e.textContent = t;
    toastCont.appendChild(e);
    setTimeout(() => e.remove(), 10000);
  }

  // КЛІК + АНІМАЦІЯ
  function click() {
    const gain = Math.round(clickPower * prestige);
    score += gain; clickTotal += gain;
    gainEl.textContent = `+${fmt(gain)}`;
    floating(`+${fmt(gain)}`);
    clock.classList.remove(..."red blue glitch blackhole ripple".split(" ").map(c=>`click-effect-${c}`));
    void clock.offsetWidth;
    clock.classList.add("click-effect-" + currentSkin.effect);
    comboClick();
    if (gain > maxClick) maxClick = gain;
    updateScore(); updateStats();
  }

  function floating(text) {
    const e = document.createElement("div");
    e.textContent = text;
    e.style.position = "absolute"; e.style.right = "20px"; e.style.top = "50px";
    e.style.color = "#ffccd1"; e.style.fontWeight = "700"; e.style.opacity = "1";
    e.style.transition = "all 0.9s ease-out";
    wrapper.appendChild(e);
    requestAnimationFrame(() => {
      e.style.transform = "translateX(60px) translateY(-80px)";
      e.style.opacity = "0";
    });
    setTimeout(() => e.remove(), 920);
  }

  wrapper.addEventListener("click", e => {
    if (e.target.closest("#clickableClock")) click();
  });

  // СТАТИСТИКА
  function updateScore() {
    scoreEl.textContent = `Часу витрачено: ${fmt(score)}`;
    totalEl.textContent = fmt(clickTotal);
    updateAllButtons();
  }
  function updateStats() {
    realTimePlayedEl.textContent = fmt((Date.now()-sessionStart)/1000);
    virtualTimeEl.textContent = fmt(score);
    $("totalUpgrades").textContent = bought;
    maxPerClickEl.textContent = fmt(maxClick);
    prestigeMultEl.textContent = prestige.toFixed(2)+"×";
  }

  // ДОСЯГНЕННЯ
  const achList = [
    ["Перший клік",()=>clickTotal>=1,1], ["100 сек",()=>score>=100,100],
    ["Перша покупка",()=>bought>=1,1], ["Авто",()=>autoRate>0,1],
    ["Комбо-майстер",()=>maxCombo>=10,10], ["Стильний",()=>currentShape!=="round"||currentClockSkin!=="neon-blue",1]
  ];
  achList.forEach(([title, get, target]) => {
    const el = document.createElement("div");
    el.className = "achievement";
    el.innerHTML = `<strong>${title}</strong><div class="ach-progress"></div><div class="ach-state">0%</div>`;
    achievementsEl.appendChild(el);
    el.progress = el.querySelector(".ach-progress");
    el.state = el.querySelector(".ach-state");
    el.get = get; el.target = target; el.done = false;
  });
  function updateAch() {
    achievementsEl.querySelectorAll(".achievement").forEach(el => {
      const val = el.get();
      const p = Math.min(100, val / el.target * 100);
      el.progress.style.width = p + "%";
      if (p >= 100 && !el.done) {
        el.done = true;
        el.state.textContent = "Виконано ✅";
        el.state.style.color = "#8df299";
        showToast(`Досягнення: ${el.querySelector("strong").textContent} ✅`);
      } else if (p < 100) el.state.textContent = Math.floor(p) + "%";
    });
  }

  // АВТО
  setInterval(() => {
    const g = Math.round(autoRate * prestige);
    if (g) { score += g; clickTotal += g; updateScore(); }
    updateStats(); updateAch();
  }, 1000);

  // РЕАЛЬНИЙ ЧАС
  setInterval(() => {
    const n = new Date();
    secondHand.style.transform = `translateX(-50%) rotate(${n.getSeconds()*6}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${n.getMinutes()*6 + n.getSeconds()*0.1}deg)`;
    hourHand.style.transform = `translateX(-50%) rotate(${(n.getHours()%12)*30 + n.getMinutes()*0.5}deg)`;
  }, 1000);

  // РЕВЕРБ (10 сек утримання)
  reverbBtn.onclick = () => {
    if (!confirm("Повернути час назад?")) return;
    reverbOverlay.classList.remove("hidden");
    timeTunnel.classList.add("active");
    reverbHint.style.display = "block";
    isReverbActive = true;
    setTimeout(() => reverbHint.style.display = "none", 4000);
  };

  const stopHold = () => {
    clearTimeout(reverbTimer);
    reverbClock.classList.remove("reverb-mode");
    reverbClock.querySelectorAll(".hand").forEach(h => h.classList.remove("reverb-chaos"));
  };

  reverbClock.onmousedown = () => {
    if (!isReverbActive) return;
    reverbHint.style.display = "none";
    reverbClock.classList.add("reverb-mode");
    reverbClock.querySelectorAll(".hand").forEach(h => {
      h.style.setProperty('--rand', Math.random()*360 + 'deg');
      h.classList.add("reverb-chaos");
    });
    reverbTimer = setTimeout(completeReverb, 10000);
  };
  reverbClock.onmouseup = reverbClock.onmouseleave = stopHold;

  function completeReverb() {
    stopHold();
    prestige *= 1.2;
    score = clickPower = autoRate = bought = maxClick = 0;
    upgrades.forEach((u,i) => { u.level = 0; btns[i]?.classList.add("hidden"); u.update(); });
    btns[0].classList.remove("hidden");
    updateScore(); updateStats(); updateAch();
    setTimeout(() => {
      alert(`Реверб! Множник: ${prestige.toFixed(2)}×`);
      reverbOverlay.classList.add("hidden");
      timeTunnel.classList.remove("active");
      isReverbActive = false;
    }, 800);
  }

  // ТАБИ + ЗАГОЛОВОК
  document.querySelectorAll(".top-tabs .tab").forEach(b => b.onclick = () => {
    document.querySelectorAll(".top-tabs .tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
    b.classList.add("active");
    $(b.dataset.tab).classList.add("active");
  });

  worldTitle && (worldTitle.onkeydown = e => e.key==="Enter" && e.preventDefault());
  worldTitle && (worldTitle.onblur = () => {
    let t = worldTitle.textContent.trim();
    if (!t) worldTitle.textContent = "Times Clicker";
    else if (!/\sTime$/i.test(t)) worldTitle.textContent = t + " Time";
  });

  // СТАРТ
  updateScore(); updateStats(); updateAch();
};
