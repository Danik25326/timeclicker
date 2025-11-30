// === ОСНОВНІ ФУНКЦІЇ ===
function startGame(v){
    document.getElementById('chooser').style.display='none';
    document.getElementById('game').style.display='';
    if(v==='mobile') document.body.classList.add('mobile-version');
    else document.body.classList.remove('mobile-version');
    initGame();
}

function initGame(){
    // === ЗМІННІ СТАНУ ===
    let score=0,clickPower=1,autoRate=0,isPlaying=0,currentTrack=0,sessionStart=Date.now(),totalUpgradesBought=0,maxPerClick=1,prestigeMultiplier=1,totalReverbs=0,maxAutoRate=0,maxCombo=0,clickCloudTotal=0,lastClickTime=0,currentCombo=0,maxComboEver=0,comboTimeout=null,MAX_CLICK_INTERVAL=350,COMBO_THRESHOLD=5,isReverbActive=0,reverbHoldTimeout=null,clickMultiplier=1,buttons=[],prestigeThreshold=3600,currentPrestigeProgress=0;

    // === ВИПРАВЛЕНА ОПТИМІЗАЦІЯ - ТІЛЬКИ ДЛЯ МОБІЛЬНИХ ===
    const d=document,q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s),id=s=>d.getElementById(s),clock=id("clickableClock"),clockWrapper=id("clockWrapper"),comboBubble=id("comboBubble"),comboCount=id("comboCount"),clickCloudEl=id("clickCloud"),musicBtn=id("musicBtn"),prevTrack=id("prevTrack"),nextTrack=id("nextTrack"),player=id("player"),scoreText=id("score"),upgradesContainer=id("upgrades"),multipliersContainer=id("multipliers"),clickGainEl=id("clickGain"),cloudTotalEl=id("cloudTotal"),nowPlaying=id("nowPlaying"),realTimePlayedEl=id("realTimePlayed"),virtualTimeEl=id("virtualTime"),totalUpgradesEl=id("totalUpgrades"),maxPerClickEl=id("maxPerClick"),prestigeMultEl=id("prestigeMult"),reverbBtn=id("reverbBtn"),timeTunnel=id("timeTunnel"),worldTitle=id("worldTitle"),toastContainer=id("toastContainer"),reverbOverlay=id("reverbOverlay"),reverbClock=id("reverbClock"),reverbHint=id("reverbHint");

    // Переконаємося, що елементи існують
    if (!clock) {
        console.error("Clock element not found!");
        return;
    }

    // === ОПТИМІЗАЦІЯ ДЛЯ МОБІЛЬНИХ (НЕ ВПЛИВАЄ НА ПК) ===
    const m='ontouchstart'in window||navigator.maxTouchPoints>0;
    if(m){
        console.log("Mobile optimizations active");
        // КОМБО СИСТЕМА - АДАПТОВАНА ДЛЯ МОБІЛЬНИХ
        MAX_CLICK_INTERVAL=500;
        COMBO_THRESHOLD=3;
    }

    // === ОНОВЛЕННЯ ДАТИ ===
    function updateDate(){
        const dateEl = id("currentDate");
        if(dateEl) dateEl.textContent=new Date().toLocaleDateString('uk-UA');
    }
    updateDate();
    setInterval(updateDate,60000);

    // === МУЗИКА ===
    const trackNames=["Фонк №1","Фонк №2","Фонк №3","Фонк №4","Фонк №5","Фонк №6","Фонк №7"],
          tracks=["asphalt-menace.mp3","digital-overdrive.mp3","drift-phonk-phonk-music-2-434611.mp3","drift-phonk-phonk-music-432222.mp3","phonk-music-409064 (2).mp3","phonk-music-phonk-2025-432208.mp3","pixel-drift.mp3"].map(x=>`musicList/${x}`);
    
    function loadTrack(i){
        player.src=tracks[i];
        nowPlaying.textContent=`Зараз: ${trackNames[i]}`;
        if(isPlaying) player.play();
    }
    loadTrack(0);
    
    player.addEventListener("ended",()=>{
        currentTrack=(currentTrack+1)%tracks.length;
        loadTrack(currentTrack);
    });
    
    musicBtn.addEventListener("click",()=>{
        if(!isPlaying){
            isPlaying=1;
            player.volume=0.45;
            player.play().catch(()=>{});
            musicBtn.textContent="⏸ Зупинити музику";
        } else {
            isPlaying=0;
            player.pause();
            musicBtn.textContent="▶️ Включити музику";
        }
    });
    
    prevTrack.onclick=()=>{
        currentTrack=(currentTrack-1+tracks.length)%tracks.length;
        loadTrack(currentTrack);
    };
    
    nextTrack.onclick=()=>{
        currentTrack=(currentTrack+1)%tracks.length;
        loadTrack(currentTrack);
    };

    // === ФОРМАТУВАННЯ ЧАСУ ===
    function formatTime(s){
        s=Math.floor(s);
        const u=[
            {name:"століття",v:3153600000},
            {name:"десятиліття",v:315360000},
            {name:"рік",v:31536000},
            {name:"міс",v:2592000},
            {name:"дн",v:86400},
            {name:"год",v:3600},
            {name:"хв",v:60},
            {name:"сек",v:1}
        ];
        let r=s,p=[];
        for(const x of u){
            const a=Math.floor(r/x.v);
            if(a>0){
                p.push(`${a} ${x.name}`);
                r%=x.v;
            }
        }
        return p.length?p.join(" "):`${s} сек`;
    }

    // === ВИПРАВЛЕНА СИСТЕМА КЛІКІВ ===
    function addTime(){
        const g=Math.round(clickPower*clickMultiplier*prestigeMultiplier);
        score+=g;
        clickCloudTotal+=g;
        if(g>maxPerClick) maxPerClick=g;
        clickGainEl.textContent=`+${formatTime(g)}`;
        showFloating(`+${formatTime(g)}`);
        triggerClickEffect();
        handleClickCombo(); 
        updateScore();
        updatePrestigeProgress();
    }
    
    function handleClickCombo(){
        const n=Date.now();
        if(n-lastClickTime<MAX_CLICK_INTERVAL) currentCombo++;
        else currentCombo=1;
        lastClickTime=n;
        if(currentCombo>maxComboEver) maxComboEver=currentCombo;
        if(currentCombo>=COMBO_THRESHOLD){
            comboCount.textContent=currentCombo;
            comboBubble.classList.add("show");
        }
        clearTimeout(comboTimeout);
        comboTimeout=setTimeout(()=>{
            if(currentCombo>=COMBO_THRESHOLD){
                comboBubble.classList.add("burst");
                showToast(`Комбо ×${currentCombo}! 🔥`);
                setTimeout(()=>comboBubble.classList.remove("show","burst"),700);
            }
            currentCombo=0;
        },300);
    }
    
    function showToast(t){
        const e=d.createElement("div");
        e.className="toast";
        e.textContent=t;
        e.style.cssText="font-size:18px;padding:22px 48px";
        toastContainer.appendChild(e);
        setTimeout(()=>e.remove(),10000);
    }
    
    function triggerClickEffect(){
        clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
        void clock.offsetWidth;
        clock.classList.add("click-effect-"+current.effect);
    }
    
    function showFloating(t){
        const e=d.createElement("div");
        e.textContent=t;
        e.style.cssText="position:absolute;right:20px;top:50px;color:#ffccd1;font-weight:700;opacity:1;transition:all 0.9s ease-out";
        clockWrapper.appendChild(e);
        requestAnimationFrame(()=>{
            e.style.transform="translateX(60px) translateY(-80px)";
            e.style.opacity="0";
        });
        setTimeout(()=>e.remove(),920);
    }

    // ВИПРАВЛЕНИЙ ОБРОБНИК КЛІКІВ
    let lastClick=0;
    clock.addEventListener("click",e=>{
        const now=Date.now();
        if(now-lastClick<100)return;
        lastClick=now;
        addTime();
    });

    // === ГОДИННИК ===
    function updateClockHands(){
        const n=new Date(),
              s=n.getSeconds()+n.getMilliseconds()/1000,
              m=n.getMinutes()+s/60,
              h=(n.getHours()%12||12)+m/60; 
        qa("#clickableClock .second").forEach(x=>x.style.transform=`translateX(-50%) rotate(${s*6}deg)`);
        qa("#clickableClock .minute").forEach(x=>x.style.transform=`translateX(-50%) rotate(${m*6}deg)`); 
        qa("#clickableClock .hour").forEach(x=>x.style.transform=`translateX(-50%) rotate(${h*30}deg)`);
    }
    
    // Запускаємо годинник
    setInterval(updateClockHands,50);
    updateClockHands();

    // === АПГРЕЙДИ ===
    const upgrades=[
        {n:"Кліпати очима",c:1,l:0},
        {n:"Включити телефон",c:8,l:0},
        {n:"Гортати стрічку",c:40,l:0},
        {n:"Мем-тур",c:200,l:0},
        {n:"Автоперегляд",c:1100,l:0},
        {n:"Підписка",c:6500,l:0},
        {n:"Серіал-марафон",c:40000,l:0},
        {n:"Робота з дедлайном",c:250000,l:0},
        {n:"Життєвий крінж",c:1600000,l:0},
        {n:"Discord-марафон",c:10000000,l:0},
        {n:"Reels до ранку",c:65000000,l:0},
        {n:"Філософські роздуми",c:400000000,l:0}
    ];
    
    function fib(n){
        if(n<=1)return n;
        let a=0,b=1;
        for(let i=2;i<=n;i++)[a,b]=[b,a+b];
        return b;
    }
    
    upgrades.forEach((u,i)=>{
        const b=d.createElement("button");
        b.className="upgrade-btn";
        if(i>0) b.classList.add("hidden");
        b.addEventListener("click",()=>buyUpgrade(i));
        upgradesContainer.appendChild(b);
        buttons.push(b);
        u.up=function(){
            const f=fib(u.l+6),c=Math.floor(u.c*f*(i+1));
            b.innerHTML=`${u.n} (Lv.${u.l})<span>${formatTime(c)}</span>`;
            b.disabled=score<c;
        };
        u.getC=function(){return Math.floor(u.c*fib(u.l+6)*(i+1));};
        u.up();
    });
    
    function revealNext(){
        const c=upgrades.filter(u=>u.l>0).length;
        if(buttons[c]) buttons[c].classList.remove("hidden");
    }
    
    function buyUpgrade(i){
        const u=upgrades[i],c=u.getC();
        if(score<c)return;
        score-=c;
        u.l++;
        totalUpgradesBought++;
        autoRate+=(i+1)*5*prestigeMultiplier;
        showToast(`Куплено: ${u.n} (Lv.${u.l}) ✅`);
        revealNext();
        u.up();
        updateAllButtons();
        updateScore();
        updateStats();
        updateAchievements();
        updatePrestigeProgress();
        
        if(u.n==="Кліпати очима"){
            d.body.classList.remove("eye-blink");
            void d.body.offsetWidth;
            d.body.classList.add("eye-blink");
            setTimeout(()=>d.body.classList.remove("eye-blink"),1000);
        }
    }
    
    function updateAllButtons(){
        upgrades.forEach(u=>u.up());
        multipliers.forEach(m=>m.up&&m.up());
    }

    // === ВИПРАВЛЕНА СТАТИСТИКА ===
    function updateScore(){
        scoreText.textContent=`Часу витрачено: ${formatTime(score)}`;
        cloudTotalEl.textContent=`${formatTime(clickCloudTotal)}`;
        updateAllButtons();
    }                    
    
    function updateStats(){
        realTimePlayedEl.textContent=formatTime((Date.now()-sessionStart)/1000);
        virtualTimeEl.textContent=formatTime(score);
        totalUpgradesEl.textContent=totalUpgradesBought;
        maxPerClickEl.textContent=formatTime(maxPerClick);
        prestigeMultEl.textContent=prestigeMultiplier.toFixed(2);
        id("maxAutoRate").textContent=formatTime(autoRate);
        id("maxCombo").textContent=maxComboEver;
        id("totalReverbs").textContent=totalReverbs;
        
        const a=achievementsList.filter(x=>x.done).length;
        id("achievedCount").textContent=a;
        id("totalAchievements").textContent=achievementsList.length;
        
        id("shapeSkinsCount").textContent=ownedSkins.shapes.length;
        id("clockSkinsCount").textContent=ownedSkins.clockSkins.length;
        id("handSkinsCount").textContent=ownedSkins.handSkins.length;
        id("effectSkinsCount").textContent=ownedSkins.effects.length;
        id("totalSkins").textContent=ownedSkins.shapes.length+ownedSkins.clockSkins.length+ownedSkins.handSkins.length+ownedSkins.effects.length;
        
        updateReverbText(); 
        updatePrestigeProgress();
    }

    // Ініціалізація відображення
    updateScore();
    updateStats();

    console.log("Game initialized successfully");
}

// Додайте цей код для перевірки
window.addEventListener('load', function() {
    console.log("Page loaded");
});
