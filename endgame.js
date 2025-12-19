// === ГЛОБАЛЬНІ ЗМІННІ ДЛЯ КІНЦЯ ГРИ ===
let bossState={wins:0,losses:0,round:1,active:false,key1:false,key2:false,broken:false}, restoreCode="", endInput="";

// === ЛОГІКА ЗАПУСКУ ===
// Перевірка чи можна отримати 1 ключ (викликати при покупці зірок)
const checkFirstKey = () => { if(!bossState.key1 && constellation.center.unlocked && [...constellation.hourHand.stars,...constellation.minuteHand.stars,...constellation.secondHand.stars].every(s=>s.unlocked)){ bossState.key1=true; showToast("🗝️ ЧАСТИНА КЛЮЧА (1/2)"); alert("Дивна вібрація... Відкрито апгрейд 'Кінець Часу'"); saveGame(); }};
// Запуск сцени з босом (викликати при покупці апгрейду "Кінець часу")
const startEnding = () => { if(bossState.key2){ showLegend(); return; } id('bossArena').style.display='flex'; id('game').classList.add('game-hidden'); bossDial(0); };
// Управління діалогом боса
const bossDial = (i) => { const lines=[{t:"Ти той, хто хоче зупинити час?",w:"c"},{t:"...",w:"p"},{t:"Переможи мене в 3 іграх.",w:"c"},{t:"...",w:"p"},{t:"Готовий?",w:"c",c:true}]; const d=id('bossDialogue'), c=id('bossControls'); d.innerHTML=`<b style="color:${lines[i].w=='c'?'#0ea5e9':'#fff'}">${lines[i].w=='c'?'ГОДИННИК':'ТИ'}</b>: ${lines[i].t}`; if(lines[i].c){c.innerHTML=`<button onclick="location.reload()" class="choose-btn" style="background:#f00">Ні</button><button onclick="runGame(1)" class="choose-btn" style="background:#0f0">Так</button>`} else {setTimeout(()=>bossDial(i+1),1500)} };

// === МІНІ-ІГРИ (BOSS FIGHT) ===
// Запуск конкретної гри
const runGame = (r) => { bossState.round=r; id('bossControls').innerHTML=''; id('bossCanvasBox').style.display='block'; const ctx=id('bossCanvas').getContext('2d'); if(r>3) return finishFight(); id('bossDialogue').innerHTML=`РАУНД ${r}`; if(r==1) gameShooter(ctx); else if(Math.random()>0.5) gamePong(ctx); else gameMemory(ctx); };
// Завершення раунду
const endRound = (win) => { id('bossCanvasBox').style.display='none'; win ? bossState.wins++ : bossState.losses++; id('bossDialogue').innerHTML=win?"<span style='color:#0f0'>ПЕРЕМОГА!</span>":"<span style='color:#f00'>ПРОГРАШ!</span>"; setTimeout(()=>runGame(bossState.round+1), 2000); };
// Фінал битви
const finishFight = () => { id('bossDialogue').innerHTML=bossState.wins>0 ? "Ти гідний... Ось ключ." : "Геть звідси!"; id('bossControls').innerHTML=bossState.wins>0 ? `<button class="phonk-btn" onclick="getKey2()">ЗАБРАТИ КЛЮЧ</button>` : `<button class="phonk-btn" onclick="location.reload()">ВИХІД</button>`; };
// Отримання 2 ключа
const getKey2 = () => { bossState.key2=true; id('bossArena').style.display='none'; showLegend(); saveGame(); };

// === ІГРОВА ЛОГІКА (CANVAS) ===
// Гра 1: Шутер
const gameShooter = (ctx) => { let p={x:50,y:300}, es=[], bs=[], fr=0, hp=3, act=true; const loop=()=>{ if(!act)return; ctx.fillStyle='#000'; ctx.fillRect(0,0,800,600); ctx.fillStyle='#0f0'; ctx.fillRect(p.x,p.y,30,30); if(fr%15==0) bs.push({x:p.x+30,y:p.y+10}); ctx.fillStyle='#ff0'; bs.forEach((b,i)=>{b.x+=10; ctx.fillRect(b.x,b.y,10,5); if(b.x>800)bs.splice(i,1)}); if(fr%60==0) es.push({x:800,y:Math.random()*550,hp:1}); ctx.fillStyle='#f00'; es.forEach((e,i)=>{e.x-=4; ctx.fillRect(e.x,e.y,30,30); if(e.x<0){hp--;es.splice(i,1)} bs.forEach((b,j)=>{if(b.x>e.x && b.x<e.x+30 && b.y>e.y && b.y<e.y+30){es.splice(i,1); bs.splice(j,1)}})}); if(fr>500){act=false; endRound(true)} if(hp<=0){act=false; endRound(false)} fr++; requestAnimationFrame(loop)}; id('bossCanvas').onmousemove=e=>p.y=e.offsetY; loop(); };
// Гра 2: Понг
const gamePong = (ctx) => { let b={x:400,y:300,dx:6,dy:6}, py=250, cy=250, sc=0, act=true; const loop=()=>{ if(!act)return; ctx.fillStyle='#000'; ctx.fillRect(0,0,800,600); ctx.fillStyle='#fff'; ctx.fillRect(10,py,20,100); ctx.fillRect(770,cy,20,100); ctx.beginPath(); ctx.arc(b.x,b.y,10,0,7); ctx.fill(); b.x+=b.dx; b.y+=b.dy; if(b.y<0||b.y>600)b.dy*=-1; if(b.x>400)cy+=(b.y-(cy+50))*0.15; if((b.x<30 && b.y>py && b.y<py+100)||(b.x>770 && b.y>cy && b.y<cy+100))b.dx*=-1.1; if(b.x<0){act=false;endRound(false)} if(b.x>800){sc++; b.x=400; b.dx=-6; if(sc>=1){act=false;endRound(true)}} requestAnimationFrame(loop)}; id('bossCanvas').onmousemove=e=>py=e.offsetY-50; loop(); };
// Гра 3: Пам'ять
const gameMemory = (ctx) => { let seq=[], uSeq=[], cols=['#f00','#0f0','#00f','#ff0'], show=true, idx=0; for(let i=0;i<4;i++)seq.push(Math.floor(Math.random()*4)); const draw=()=>{ctx.fillStyle='#000'; ctx.fillRect(0,0,800,600); cols.forEach((c,i)=>{ctx.fillStyle=c; ctx.globalAlpha=(show && seq[idx]==i)?1:0.3; ctx.fillRect(200+(i%2)*200, 100+Math.floor(i/2)*200, 180, 180)})}; const flash=setInterval(()=>{draw(); show=!show; if(!show)idx++; if(idx>=4){clearInterval(flash); ctx.globalAlpha=1; draw(); ctx.fillText("ПОВТОРИ!",350,50); id('bossCanvas').onclick=check}},600); const check=(e)=>{let x=e.offsetX>400?1:0, y=e.offsetY>300?1:0, k=x+y*2; if(k==seq[uSeq.length]){uSeq.push(k); if(uSeq.length==4)endRound(true)} else endRound(false)}; };

// === ЛЕГЕНДА ТА КОДИ ===
// Показати екран легенди
const showLegend = () => { id('legendOverlay').style.display='flex'; id('game').classList.add('game-hidden'); id('legendFront').style.display='block'; id('legendBack').style.display='none'; };
// Переворот листка
const flipLegend = () => { id('legendFront').style.display='none'; id('legendBack').style.display='block'; restoreCode="BBGERTYDSA"; id('secretCode').innerText=restoreCode; };
// Закрити легенду
const closeLegend = () => { id('legendOverlay').style.display='none'; id('game').classList.remove('game-hidden'); };
// Перевірка вводу коду (на клавіатурі)
document.addEventListener('keydown', e => { if(id('legendBack').style.display=='block'){ endInput+=e.key.toUpperCase(); if(endInput.includes(restoreCode)) openRestorePanel(); }});

// === ЗУПИНКА ТА ВІДНОВЛЕННЯ ЧАСУ ===
// Ініціалізація рітуалу (затискання)
const initRitual = () => { let c=id('clickableClock'), t=0; const start=()=>{if(bossState.key1&&bossState.key2&&!bossState.broken)t=setTimeout(breakTime, 2000)}; const end=()=>clearTimeout(t); c.onmousedown=e=>{if(e.buttons==3)start()}; c.ontouchstart=e=>{if(e.touches.length==2)start()}; c.onmouseup=end; c.ontouchend=end; c.oncontextmenu=e=>e.preventDefault(); };
// Поломка часу
const breakTime = () => { bossState.broken=true; id('clickableClock').classList.add('broken'); qa('.hand').forEach(h=>h.style.transform='rotate(180deg)'); id('realTimePlayed').classList.add('broken-text'); showToast("ЧАС ЗУПИНЕНО..."); id('realTimePlayed').onclick=()=>confirm("Ти радий?")?null:alert("Шукай код на листку..."); saveGame(); };
// Відкрити панель відновлення
const openRestorePanel = () => { id('restorePanel').style.display='flex'; id('legendOverlay').style.display='none'; };
// Перевірка часу для відновлення
const checkRestoreTime = (val) => { let d=new Date(), t=`${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`; if(val==t){ bossState.broken=false; id('clickableClock').classList.remove('broken'); id('restorePanel').style.display='none'; id('realTimePlayed').classList.remove('broken-text'); alert("Дякую за гру! Час відновлено."); saveGame(); }};
// Ініціалізація при старті
setTimeout(initRitual, 1000);
