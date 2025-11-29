function startGame(v){document.getElementById('chooser').style.display='none';document.getElementById('game').style.display='';if(v==='mobile')document.body.classList.add('mobile-version');else document.body.classList.remove('mobile-version');initGame()}
function initGame(){const d=document,q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s),id=s=>d.getElementById(s),clock=id("clickableClock"),clockWrapper=id("clockWrapper"),comboBubble=id("comboBubble"),comboCount=id("comboCount"),clickCloudEl=id("clickCloud"),musicBtn=id("musicBtn"),prevTrack=id("prevTrack"),nextTrack=id("nextTrack"),player=id("player"),scoreText=id("score"),upgradesContainer=id("upgrades"),multipliersContainer=id("multipliers"),clickGainEl=id("clickGain"),cloudTotalEl=id("cloudTotal"),nowPlaying=id("nowPlaying"),realTimePlayedEl=id("realTimePlayed"),virtualTimeEl=id("virtualTime"),totalUpgradesEl=id("totalUpgrades"),maxPerClickEl=id("maxPerClick"),prestigeMultEl=id("prestigeMult"),reverbBtn=id("reverbBtn"),timeTunnel=id("timeTunnel"),worldTitle=id("worldTitle"),toastContainer=id("toastContainer"),reverbOverlay=id("reverbOverlay"),reverbClock=id("reverbClock"),reverbHint=id("reverbHint");
// Оновлення дати
function updateDate(){id("currentDate").textContent=new Date().toLocaleDateString('uk-UA')}
updateDate();setInterval(updateDate,60000);

// === State ===
let score=0,clickPower=1,autoRate=0,isPlaying=0,currentTrack=0,sessionStart=Date.now(),totalUpgradesBought=0,maxPerClick=1,
prestigeMultiplier=1,totalReverbs=0,maxAutoRate=0,maxCombo=0,clickCloudTotal=0,lastClickTime=0,currentCombo=0,maxComboEver=0,
comboTimeout=null,MAX_CLICK_INTERVAL=350,COMBO_THRESHOLD=5,isReverbActive=0,reverbHoldTimeout=null,clickMultiplier=1,buttons=[];

// === МУЗИКА ===
const trackNames=["Фонк №1","Фонк №2","Фонк №3","Фонк №4","Фонк №5","Фонк №6","Фонк №7"],tracks=[
"asphalt-menace.mp3","digital-overdrive.mp3","drift-phonk-phonk-music-2-434611.mp3",
"drift-phonk-phonk-music-432222.mp3","phonk-music-409064 (2).mp3",
"phonk-music-phonk-2025-432208.mp3","pixel-drift.mp3"].map(x=>`musicList/${x}`);

function loadTrack(i){player.src=tracks[i];nowPlaying.textContent=`Зараз: ${trackNames[i]}`;if(isPlaying)player.play();}
loadTrack(0);
player.addEventListener("ended",()=>{currentTrack=(currentTrack+1)%tracks.length;loadTrack(currentTrack);});
musicBtn.addEventListener("click",()=>{
if(!isPlaying){isPlaying=1;player.volume=0.45;player.play().catch(()=>{});musicBtn.textContent="⏸ Зупинити музику";}
else{isPlaying=0;player.pause();musicBtn.textContent="▶️ Включити музику";}});
prevTrack.onclick=()=>{currentTrack=(currentTrack-1+tracks.length)%tracks.length;loadTrack(currentTrack);};
nextTrack.onclick=()=>{currentTrack=(currentTrack+1)%tracks.length;loadTrack(currentTrack);};

// === ФОРМАТУВАННЯ ЧАСУ ===
function formatTime(s){s=Math.floor(s);const u=[
{name:"століття",v:3153600000},{name:"десятиліття",v:315360000},{name:"рік",v:31536000},
{name:"міс",v:2592000},{name:"дн",v:86400},{name:"год",v:3600},{name:"хв",v:60},{name:"сек",v:1}];
let r=s,p=[];for(const x of u){const a=Math.floor(r/x.v);if(a>0){p.push(`${a} ${x.name}`);r%=x.v;}}
return p.length?p.join(" "):`${s} сек`;}

// === АПГРЕЙДИ ===
const upgrades=[
{n:"Кліпати очима",c:1,l:0},{n:"Включити телефон",c:8,l:0},{n:"Гортати стрічку",c:40,l:0},
{n:"Мем-тур",c:200,l:0},{n:"Автоперегляд",c:1100,l:0},{n:"Підписка",c:6500,l:0},
{n:"Серіал-марафон",c:40000,l:0},{n:"Робота з дедлайном",c:250000,l:0},{n:"Життєвий крінж",c:1600000,l:0},
{n:"Discord-марафон",c:10000000,l:0},{n:"Reels до ранку",c:65000000,l:0},{n:"Філософські роздуми",c:400000000,l:0}];

function fib(n){if(n<=1)return n;let a=0,b=1;for(let i=2;i<=n;i++)[a,b]=[b,a+b];return b;}

upgrades.forEach((u,i)=>{const b=d.createElement("button");b.className="upgrade-btn";
if(i>0)b.classList.add("hidden");b.addEventListener("click",()=>buyUpgrade(i));upgradesContainer.appendChild(b);buttons.push(b);
u.up=function(){const f=fib(u.l+6),c=Math.floor(u.c*f*(i+1));
b.innerHTML=`${u.n} (Lv.${u.l})<span>${formatTime(c)}</span>`;b.disabled=score<c;};
u.getC=function(){return Math.floor(u.c*fib(u.l+6)*(i+1));};u.up();});

function revealNext(){const c=upgrades.filter(u=>u.l>0).length;if(buttons[c])buttons[c].classList.remove("hidden");}

function buyUpgrade(i){const u=upgrades[i],c=u.getC();if(score<c)return;score-=c;u.l++;totalUpgradesBought++;
autoRate+=(i+1)*5*prestigeMultiplier;showToast(`Куплено: ${u.n} (Lv.${u.l}) ✅`);revealNext();u.up();updateAllButtons();
updateScore();updateStats();updateAchievements();if(u.n==="Кліпати очима"){d.body.classList.remove("eye-blink");
void d.body.offsetWidth;d.body.classList.add("eye-blink");setTimeout(()=>d.body.classList.remove("eye-blink"),1000);}}

function updateAllButtons(){upgrades.forEach(u=>u.up());multipliers.forEach(m=>m.up&&m.up());}

// === МНОЖНИКИ КЛІКУ ===
const multipliers=[
{n:"Подвійний клік",c:5000,m:2,b:0},{n:"Потрійний клік",c:50000,m:3,b:0},
{n:"x10 за клік",c:1000000,m:10,b:0},{n:"x50 за клік",c:20000000,m:50,b:0},{n:"x100 за клік",c:100000000,m:100,b:0}];

multipliers.forEach(m=>{const b=d.createElement("button");b.className="upgrade-btn multiplier-btn";
function upB(){if(m.b){b.remove();return;}const a=score>=m.c;b.innerHTML=`${m.n}<span>${formatTime(m.c)}</span>`;
b.disabled=!a;b.style.background=a?"":"#334155";b.style.opacity=a?"1":"0.5";}
b.addEventListener("click",()=>{if(score<m.c||m.b)return;score-=m.c;m.b=1;clickMultiplier=m.m;
showToast(`Активовано: ${m.n}!`);upB();updateScore();updateStats();});
multipliersContainer.appendChild(b);m.up=upB;upB();});

// === КЛІК ===
function addTime(){const g=Math.round(clickPower*clickMultiplier*prestigeMultiplier);
score+=g;clickCloudTotal+=g;if(g>maxPerClick)maxPerClick=g;
clickGainEl.textContent=`+${formatTime(g)}`;showFloating(`+${formatTime(g)}`);triggerClickEffect();
handleClickCombo();updateScore();updateStats();updateAchievements();}
                    
// === СКІНИ ===
const clockSkins=[
{id:"neon-blue",n:"Неон синій",p:0,a:()=>qa('.clock').forEach(c=>{c.style.borderColor="#0ea5e9";c.style.boxShadow="0 0 50px #0ea5e9, 0 0 100px #0ea5e9"})},
{id:"purple",n:"Пурпурний",p:64800,a:()=>qa('.clock').forEach(c=>{c.style.borderColor="#8b5cf6";c.style.boxShadow="0 0 50px #8b5cf6, 0 0 100px #8b5cf6"})},
{id:"pink",n:"Рожевий",p:129600,a:()=>qa('.clock').forEach(c=>{c.style.borderColor="#ec4899";c.style.boxShadow="0 0 50px #ec4899, 0 0 100px #ec4899"})},
{id:"black",n:"Чорний",p:259200,a:()=>qa('.clock').forEach(c=>{c.style.borderColor="#111";c.style.boxShadow="0 0 10px #000"})}],
shapes=[{id:"round",n:"Круг",p:0},{id:"square",n:"Квадрат",p:28800},{id:"diamond",n:"Ромб",p:86400},{id:"oval",n:"Овал",p:172800}],
handSkins=[{id:"darkblue",n:"Темно-сині",p:0,a:()=>qa(".hand:not(.second)").forEach(h=>{h.style.background="#1e3a8a";h.style.boxShadow="";h.style.animation=""})},
{id:"pixel",n:"Піксельні",p:900,a:()=>qa(".hand:not(.second)").forEach(h=>{h.style.background="linear-gradient(#fff,#aaa)";h.style.boxShadow="";h.style.animation=""})},
{id:"neon",n:"Неонові",p:9000,a:()=>qa(".hand:not(.second)").forEach(h=>{h.style.background="#0ea5e9";h.style.boxShadow="0 0 25px #0ea5e9, 0 0 60px #0ea5e9";h.style.animation="neonPulse 2s ease-in-out infinite alternate"})},
{id:"chrome",n:"Хром",p:43200,a:()=>qa(".hand:not(.second)").forEach(h=>{h.style.background="linear-gradient(90deg,#ddd,#888,#ddd)";h.style.boxShadow="0 0 15px #fff, 0 0 30px #aaa";h.style.animation=""})}],
effects=[{id:"red",n:"Червоний спалах",p:0},{id:"blue",n:"Синій вибух",p:21600},{id:"glitch",n:"Глітч",p:108000},{id:"blackhole",n:"Чорна діра",p:360000},{id:"ripple",n:"Хвиля часу",p:720000}],
ownedSkins={shapes:["round"],clockSkins:["neon-blue"],handSkins:["darkblue"],effects:["red"]},
currentShape="round",currentClockSkin="neon-blue",currentHandSkin="darkblue",currentEffect="red";

function buySkin(t,i,p,n){if(ownedSkins[t].includes(i))return showToast("Цей скін вже куплено");if(score<p)return showToast("Не вистачає часу!");score-=p;ownedSkins[t].push(i);if(t==="shapes")currentShape=i;if(t==="clockSkins")currentClockSkin=i;if(t==="handSkins")currentHandSkin=i;if(t==="effects")currentEffect=i;applyAllSkins();updateScore();updateStats();updateAchievements();showToast(`Куплено: ${n} ✅`);refreshAllSkinGrids();}

function applyAllSkins(){qa('.clock').forEach(c=>c.className="clock "+currentShape);clockSkins.find(s=>s.id===currentClockSkin)?.a();handSkins.find(s=>s.id===currentHandSkin)?.a();}

function createSkinGrid(ct,ls,t){const r=id(ct);r.innerHTML="";ls.forEach(s=>{const e=d.createElement("div");e.className="skin";e.textContent=s.n;const o=ownedSkins[t].includes(s.id);let a=false;if(t==="shapes")a=s.id===currentShape;if(t==="clockSkins")a=s.id===currentClockSkin;if(t==="handSkins")a=s.id===currentHandSkin;if(t==="effects")a=s.id===currentEffect;if(o){e.classList.add("owned");if(a)e.classList.add("active");e.onclick=()=>{if(t==="shapes")currentShape=s.id;if(t==="clockSkins")currentClockSkin=s.id;if(t==="handSkins")currentHandSkin=s.id;if(t==="effects")currentEffect=s.id;applyAllSkins();refreshAllSkinGrids();};}else{e.style.opacity="0.4";if(score>=s.p){e.style.opacity="1";e.style.boxShadow="0 0 15px #0ff";}e.innerHTML+=`<br><small style="color:#ff00ff">${formatTime(s.p)}</small>`;e.onclick=()=>buySkin(t,s.id,s.p,s.n);}r.appendChild(e);});}

function refreshAllSkinGrids(){createSkinGrid("shapeSkins",shapes,"shapes");createSkinGrid("clockSkins",clockSkins,"clockSkins");createSkinGrid("handSkins",handSkins,"handSkins");createSkinGrid("effectSkins",effects,"effects");}

function updateSkinHighlights(){[{l:shapes,t:"shapes",c:"shapeSkins"},{l:clockSkins,t:"clockSkins",c:"clockSkins"},{l:handSkins,t:"handSkins",c:"handSkins"},{l:effects,t:"effects",c:"effectSkins"}].forEach(obj=>{const ct=id(obj.c);if(!ct)return;Array.from(ct.children).forEach((el,i)=>{const s=obj.l[i],o=ownedSkins[obj.t].includes(s.id);if(!o){if(score>=s.p){el.style.opacity="1";el.style.boxShadow="0 0 15px #0ff";}else{el.style.opacity="0.4";el.style.boxShadow="";}}});});}

setInterval(updateSkinHighlights,50);refreshAllSkinGrids();applyAllSkins();
// === КОМБО ===
function handleClickCombo(){const n=Date.now();if(n-lastClickTime<MAX_CLICK_INTERVAL)currentCombo++;else currentCombo=1;
lastClickTime=n;if(currentCombo>maxComboEver)maxComboEver=currentCombo;if(currentCombo>=COMBO_THRESHOLD){
comboCount.textContent=currentCombo;comboBubble.classList.add("show");}clearTimeout(comboTimeout);
comboTimeout=setTimeout(()=>{if(currentCombo>=COMBO_THRESHOLD){comboBubble.classList.add("burst");
showToast(`Комбо ×${currentCombo}! 🔥`);setTimeout(()=>comboBubble.classList.remove("show","burst"),700);}currentCombo=0;},300);}

// === ТОАСТ ===
function showToast(t){const e=d.createElement("div");e.className="toast";e.textContent=t;
e.style.cssText="font-size:18px;padding:22px 48px";toastContainer.appendChild(e);setTimeout(()=>e.remove(),10000);}

// === КЛІК ЕФЕКТ ===
function triggerClickEffect(){const clockEl = id("clickableClock"); clock.classList.remove("click-effect-red","click-effect-blue","click-effect-glitch","click-effect-blackhole","click-effect-ripple");
void clock.offsetWidth;clock.classList.add("click-effect-"+current.effect);}

clockWrapper.addEventListener("click",e=>{if(e.target.closest("#clickableClock")||e.target===clockWrapper)addTime();});

function showFloating(t){const e=d.createElement("div");e.textContent=t;e.style.cssText="position:absolute;right:20px;top:50px;color:#ffccd1;font-weight:700;opacity:1;transition:all 0.9s ease-out";
clockWrapper.appendChild(e);requestAnimationFrame(()=>{e.style.transform="translateX(60px) translateY(-80px)";e.style.opacity="0";});setTimeout(()=>e.remove(),920);}

// === СТАТИСТИКА ===
function updateScore(){scoreText.textContent=`Часу витрачено: ${formatTime(score)}`;cloudTotalEl.textContent=`${formatTime(clickCloudTotal)}`;updateAllButtons();}                    
function updateStats(){
    realTimePlayedEl.textContent=formatTime((Date.now()-sessionStart)/1000);
    virtualTimeEl.textContent=formatTime(score);
    totalUpgradesEl.textContent=totalUpgradesBought;
    maxPerClickEl.textContent=formatTime(maxPerClick);
    prestigeMultEl.textContent=prestigeMultiplier.toFixed(2);
    id("maxAutoRate").textContent=formatTime(autoRate);
    id("maxCombo").textContent=maxComboEver;
    id("totalReverbs").textContent=totalReverbs;
    
    // ВИПРАВЛЕНО: використовуємо x.done замість x.d
    const a=achievementsList.filter(x=>x.done).length;
    id("achievedCount").textContent=a;
    id("totalAchievements").textContent=achievementsList.length;
    
    id("shapeSkinsCount").textContent=ownedSkins.shapes.length;
    id("clockSkinsCount").textContent=ownedSkins.clockSkins.length;
    id("handSkinsCount").textContent=ownedSkins.handSkins.length;
    id("effectSkinsCount").textContent=ownedSkins.effects.length;
    id("totalSkins").textContent=ownedSkins.shapes.length+ownedSkins.clockSkins.length+ownedSkins.handSkins.length+ownedSkins.effects.length;
    updateReverbText();
}                    
setInterval(()=>{if(autoRate>maxAutoRate)maxAutoRate=autoRate;if(maxComboEver>maxCombo)maxCombo=maxComboEver;},1000);
                    
// === ДОСЯГНЕННЯ ===
const achRoot=id("achievements"),achievementsList=[
{t:"Перший клік",desc:"Зробити перший клік",tg:1,g:()=>clickCloudTotal,done:false},
{t:"100 сек",desc:"Витратити 100 сек",tg:100,g:()=>score,done:false},
{t:"Перша покупка",desc:"Купити перший апгрейд",tg:1,g:()=>totalUpgradesBought,done:false},
{t:"Авто запущено",desc:"Маєш autoRate > 0",tg:1,g:()=>autoRate>0?1:0,done:false},
{t:"Комбо-майстер",desc:"Досягти комбо 10+",tg:10,g:()=>maxComboEver,done:false},
{t:"Майстер форм",desc:"Володіти 3 формами годинника",tg:3,g:()=>ownedSkins.shapes.length,done:false},
{t:"Господар рамок",desc:"Володіти 3 кольорами рамки",tg:3,g:()=>ownedSkins.clockSkins.length,done:false},
{t:"Колекціонер стрілок",desc:"Володіти 3 скінами стрілок",tg:3,g:()=>ownedSkins.handSkins.length,done:false},
{t:"Маг ефектів",desc:"Володіти 3 ефектами кліку",tg:3,g:()=>ownedSkins.effects.length,done:false},
{t:"Стильний",desc:"Змінити будь-який скін",tg:1,g:()=>(current.shape!=="round"||current.clock!=="neon-blue"||current.hand!=="darkblue"||current.effect!=="red")?1:0,done:false}];

achievementsList.forEach(a=>{const e=d.createElement("div");e.className="achievement";
e.innerHTML=`<strong>${a.t}</strong><div style="font-size:12px;color:#bcd">${a.desc}</div><div class="ach-progress"></div><div class="ach-state">0%</div>`;
achRoot.appendChild(e);a.p=e.querySelector(".ach-progress");a.s=e.querySelector(".ach-state");});

function updateAchievements(){achievementsList.forEach(a=>{const v=a.g(),p=Math.min(100,(v/a.tg)*100);
a.p.style.width=p+"%";if(p>=100&&!a.done){a.done=true;a.s.textContent="Виконано ✅";a.s.style.color="#8df299";showToast(`Досягнення: ${a.t} ✅`);}
else if(p<100)a.s.textContent=Math.floor(p)+"%";});}

// === АВТО ТІК ===
setInterval(()=>{const g=Math.round(autoRate*prestigeMultiplier);if(g>0){score+=g;clickCloudTotal+=g;updateScore();}
updateStats();updateAchievements();},1000);

// === ГОДИННИК ===
function updateClockHands(){const n=new Date(),s=n.getSeconds()+n.getMilliseconds()/1000,m=n.getMinutes()+s/60,h=(n.getHours()%12||12)+m/60;
qa(".second").forEach(x=>x.style.transform=`translateX(-50%) rotate(${s*6}deg)`);
qa(".minute").forEach(x=>x.style.transform=`translateX(-50%) rotate(${m*6}deg)`);
qa(".hour").forEach(x=>x.style.transform=`translateX(-50%) rotate(${h*30}deg)`);}
setInterval(updateClockHands,50);updateClockHands();

// === РЕВЕРБ ===
reverbBtn.addEventListener("click",()=>{if(!confirm("Ти впевнений, що хочеш повернути час назад?"))return;startReverbMode();});

function startReverbMode(){reverbOverlay.classList.remove("hidden");timeTunnel.classList.add("active");
reverbHint.style.opacity="1";isReverbActive=1;setTimeout(()=>reverbHint.style.opacity="0",3000);}

const startReverbHold=e=>{if(e.type.includes('touch'))e.preventDefault();if(!isReverbActive)return;
reverbHint.style.opacity="0";reverbClock.classList.add("reverb-mode");timeTunnel.classList.add("intense");
qa("#reverbClock .hand").forEach(h=>{const d=0.8+Math.random()*1.2,r=(Math.random()>0.5?1:-1)*(15+Math.random()*25)*360;
h.style.animation=`none`;void h.offsetWidth;h.style.animation=`chaosSpin ${d}s linear infinite`;h.style.setProperty('--rand-rotation',`${r}deg`);});
reverbHoldTimeout=setTimeout(completeReverb,10000);};

const stopReverbHold=e=>{if(e&&e.type.includes('touch'))e.preventDefault();clearTimeout(reverbHoldTimeout);
if(isReverbActive){reverbClock.classList.remove("reverb-mode");timeTunnel.classList.remove("intense");
qa("#reverbClock .hand").forEach(h=>h.style.animation="");}};

reverbClock.addEventListener("mousedown",startReverbHold);reverbClock.addEventListener("touchstart",startReverbHold,{passive:false});
reverbClock.addEventListener("mouseup",stopReverbHold);reverbClock.addEventListener("mouseleave",stopReverbHold);
reverbClock.addEventListener("touchend",stopReverbHold);reverbClock.addEventListener("touchcancel",stopReverbHold);

function completeReverb(){stopReverbHold(new Event('manual'));prestigeMultiplier*=1.2;totalReverbs++;
score=0;clickPower=1;autoRate=0;totalUpgradesBought=0;maxPerClick=1;clickCloudTotal=0;currentCombo=0;
upgrades.forEach((u,i)=>{u.l=0;if(buttons[i]){buttons[i].classList.add("hidden");if(i===0)buttons[i].classList.remove("hidden");}u.up();});
timeTunnel.classList.add("reverb-complete");setTimeout(()=>{alert(`Перезапуск завершено! Множник: ${prestigeMultiplier.toFixed(2)}×`);
reverbOverlay.classList.add("hidden");timeTunnel.classList.remove("active","intense","reverb-complete");isReverbActive=0;},1500);
updateScore();updateStats();updateAchievements();}

// === ТАБИ ===
qa(".top-tabs .tab").forEach(b=>{b.addEventListener("click",()=>{qa(".top-tabs .tab").forEach(x=>x.classList.remove("active"));
qa(".tab-page").forEach(x=>x.classList.remove("active"));b.classList.add("active");id(b.dataset.tab).classList.add("active");});});

// === ЗАГОЛОВОК ===
if(worldTitle){worldTitle.addEventListener("keydown",e=>{if(e.key==="Enter")e.preventDefault();});
const normalizeTitle=()=>{let t=worldTitle.textContent.trim();if(!t)worldTitle.textContent="Times Clicker";
else if(!/\sTime$/i.test(t))worldTitle.textContent=`${t} Time`;};
let titleCheckTimeout=null;const checkTitleForSecret=()=>{const t=worldTitle.textContent.trim().replace(/\s+/g,'');
if(/^22092005$/i.test(t)){if(!id("ultimateDevPanel")){showToast("22.09.2005 — доступ відкрито через назву!");createDevPanel();}
if(titleCheckTimeout)clearTimeout(titleCheckTimeout);titleCheckTimeout=null;return;}
clearTimeout(titleCheckTimeout);titleCheckTimeout=setTimeout(checkTitleForSecret,800);};
worldTitle.addEventListener("blur",()=>{normalizeTitle();checkTitleForSecret();});checkTitleForSecret();}

// === СЕКРЕТНА ПАНЕЛЬ ===
let secretCode="",magicCode="22092005";d.addEventListener("keydown",e=>{secretCode+=e.key;
if(secretCode.length>8)secretCode=secretCode.slice(-8);if(secretCode===magicCode){secretCode="";showToast("22.09.2005 — доступ відкрито!");createDevPanel();}});

function createDevPanel(){if(id("ultimateDevPanel"))return;const p=d.createElement("div");p.id="ultimateDevPanel";
p.style.cssText="position:fixed;bottom:20px;left:20px;z-index:99999;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);border:2px solid #ff00ff;border-radius:14px;padding:12px 16px;box-shadow:0 0 30px #ff00ff;font-family:Poppins,sans-serif;color:#fff;font-size:13px;width:210px;";
p.innerHTML='<div style="color:#ff00ff;font-weight:700;text-align:center;margin-bottom:8px;font-size:14px;">Секретна панель</div>';
function addBtn(t,c,a){const b=d.createElement("button");b.textContent=t;b.style.cssText="margin:4px 0;padding:8px 12px;width:100%;background:"+c+";border:none;border-radius:10px;color:#fff;font-weight:600;cursor:pointer;font-size:12px;transition:transform 0.2s;";
b.onmouseover=()=>b.style.transform="translateY(-2px)";b.onmouseout=()=>b.style.transform="";b.onclick=()=>{a();showToast(t+" OK");};p.appendChild(b);}
addBtn("+2 години","#06d6d6",()=>{score+=7200;clickCloudTotal+=7200;updateScore();updateStats();});
addBtn("+100 авто/сек","#3b82f6",()=>autoRate+=100);addBtn("×2 престиж","#a855f7",()=>{prestigeMultiplier*=2;updateStats();});
addBtn("Реверб","#ec4899",()=>completeReverb());addBtn("Закрити","#555",()=>{p.remove();showToast("Панель закрита");});d.body.appendChild(p);}

// === ДИНАМІЧНИЙ ТЕКСТ ПЕРЕЗАПУСКУ ===
const reverbDesc=id("reverbDesc"),nextMultiplierEl=id("nextMultiplier");
function updateReverbText(){nextMultiplierEl.textContent=(prestigeMultiplier*1.2).toFixed(2);}
updateScore();updateStats();updateAchievements();}
