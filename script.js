window.onload = () => {
  const $ = id => document.getElementById(id);
  const clock = $("clickableClock"), wrap = $("clockWrapper"), combo = $("comboBubble"), cCount = combo.querySelector("#comboCount");
  const player = $("player"), scoreEl = $("score"), gainEl = $("clickGain"), totalEl = $("cloudTotal"), nowPlay = $("nowPlaying");
  const realEl = $("realTimePlayed"), virtEl = $("virtualTime"), upgEl = $("upgrades"), achEl = $("achievements");
  const revBtn = $("reverbBtn"), revOv = $("reverbOverlay"), revClk = $("reverbClock"), revHint = $("reverbHint");
  const tunnel = $("timeTunnel"), toast = $("toastContainer");
  const worldTitle = $("worldTitle");

  let s = 0, cp = 1, ar = 0, pr = 1, ct = 0, bought = 0, mc = 1;
  let cc = 0, mx = 0, lc = 0, ctimer = null;
  let rev = false, rtimer = null;
  let skin = {sh:"round", col:"neon-blue", h:"darkblue", ef:"red"};
  const start = Date.now();
  const CI = 350, CS = 5;

  // Музика
  const tr = ["asphalt-menace","digital-overdrive","drift-phonk-phonk-music-2-434611","drift-phonk-phonk-music-432222","phonk-music-409064 (2)","phonk-music-phonk-2025-432208","pixel-drift"].map(t=>`musicList/${t}.mp3`);
  let ti = 0, pl = false;
  const load = i => { player.src = tr[i]; nowPlay.textContent = `Зараз: Фонк №${i+1}`; pl && player.play(); };
  load(0);
  player.onended = () => load(ti = (ti+1)%tr.length);
  $("musicBtn").onclick = () => { pl = !pl; pl?player.play():player.pause(); $("musicBtn").textContent = pl?"⏸ Зупинити":"▶️ Включити музику"; };
  $("prevTrack").onclick = () => load(ti = (ti-1+tr.length)%tr.length);
  $("nextTrack").onclick = () => load(ti = (ti+1)%tr.length);

  // Формат часу
  const fmt = n => {
    n = Math.floor(n);
    const u = [["століття",31536e5],["десятиліття",31536e4],["рік",31536e3],["міс",2592e3],["дн",86400],["год",3600],["хв",60],["сек",1]];
    let r = ""; for(const [t,v] of u) if(n>=v){r+=Math.floor(n/v)+" "+t+" ";n%=v} return r||n+" сек";
  };

  // Апгрейди
  const ups = [
    ["Кліпати очима",1,"click",1],["Включити телефон",8,"auto",1],["Гортати стрічку",25,"auto",3],
    ["Мем-тур",90,"click",2],["Автоперегортання",450,"auto",10],["Підписка",2400,"auto",30],
    ["Серіал-марафон",15e3,"auto",120],["Проєкт із затримкою",12e4,"click",50],["Життєвий крінж",8e5,"auto",500],
    ["Discord 24/7",5e6,"auto",2000],["Reels до ранку",2e7,"click",300],["Філософія",1e8,"auto",1e4]
  ].map(([n,c,t,b])=>({n, c, t, b, l:0}));
  const bs = ups.map((u,i)=>{
    const b=document.createElement("button"); b.className="upgrade-btn"+(i?" hidden":"");
    b.onclick=()=>buy(i); upgEl.appendChild(b);
    u.btn=b; u.cost=()=>Math.floor(u.c*1.15**u.l);
    u.upd=()=>{b.innerHTML=`${u.n} (Lv.${u.l})<span>${fmt(u.cost())}</span>`;b.disabled=s<u.cost()};
    u.upd(); return b;
  });
  const reveal=()=>{const c=ups.filter(u=>u.l).length; bs[c]&&bs[c].classList.remove("hidden")};
  const buy=i=>{
    const u=ups[i], c=u.cost(); if(s<c)return;
    s-=c; u.l++; bought++;
    u.t==="click"?cp+=Math.round(u.b*pr):ar+=Math.round(u.b*pr);
    toast(`Куплено: ${u.n} (Lv.${u.l}) ✅`);
    reveal(); u.upd(); ups.forEach(u=>u.upd()); scoreEl.textContent=`Часу витрачено: ${fmt(s)}`; totalEl.textContent=fmt(ct); updateStats(); updateAch();
  };

  // Скіни
  const apply=()=>{
    clock.className="clock "+skin.sh;
    const col={"neon-blue":"#0ea5e9",purple:"#8b5cf6",pink:"#ec4899",black:"#111"}[skin.col];
    clock.style.borderColor=col; clock.style.boxShadow=`0 0 50px ${col},0 0 100px ${col}`;
    const hnd={"darkblue":"#1e3a8a",neon:"#0ea5e9",pixel:"linear-gradient(#fff,#aaa)",chrome:"linear-gradient(90deg,#ddd,#888,#ddd)"}[skin.h];
    document.querySelectorAll(".hand").forEach(e=>e.style.background=hnd);
  };
  ["shape","clock","hand","effect"].forEach(t=>{
    const id=t+"Skins", list=t==="shape"?[{id:"round",name:"Круг"},{id:"square",name:"Квадрат"},{id:"diamond",name:"Ромб"},{id:"oval",name:"Овал"}]:
      t==="clock"?[{id:"neon-blue",name:"Неон синій"},{id:"purple",name:"Пурпурний"},{id:"pink",name:"Рожевий"},{id:"black",name:"Чорний"}]:
      t==="hand"?[{id:"darkblue",name:"Темно-сині"},{id:"neon",name:"Неонові"},{id:"pixel",name:"Піксельні"},{id:"chrome",name:"Хром"}]:
      [{id:"red",name:"Червоний"},{id:"blue",name:"Синій"},{id:"glitch",name:"Глітч"},{id:"blackhole",name:"Чорна діра"},{id:"ripple",name:"Хвиля часу"}];
    list.forEach((sk,j)=>{
      const el=document.createElement("div"); el.className="skin"+(!j?" active":""); el.textContent=sk.name;
      el.onclick=()=>{$(id).querySelectorAll(".skin").forEach(e=>e.classList.remove("active"));el.classList.add("active");
        skin[t==="effect"?"ef":t==="clock"?"col":t==="hand"?"h":"sh"]=sk.id;
        t!=="effect"&&apply();
      };
      $(id).appendChild(el);
    });
  });
  apply();

  // Комбо
  const comboClick=()=>{
    const now=Date.now();
    cc = now-lc<CI ? cc+1 : 1; lc=now;
    if(cc>mx)mx=cc;
    if(cc>=CS){cCount.textContent=cc;combo.classList.add("show")}
    clearTimeout(ctimer);
    ctimer=setTimeout(()=>{if(cc>=CS){combo.classList.add("burst");toast(`Комбо ×${cc}! 🔥`);setTimeout(()=>combo.classList.remove("show","burst"),700)} cc=0},600);
  };

  // Тости
  const toast=t=>{const e=document.createElement("div");e.className="toast";e.textContent=t;toast.appendChild(e);setTimeout(()=>e.remove(),10000)};

  // Клік
  const click=()=>{
    const g=Math.round(cp*pr); s+=g; ct+=g; gainEl.textContent=`+${fmt(g)}`;
    floating(`+${fmt(g)}`);
    clock.classList.remove(...["red","blue","glitch","blackhole","ripple"].map(c=>`click-effect-${c}`));
    void clock.offsetWidth;
    clock.classList.add("click-effect-"+skin.ef);
    comboClick();
    if(g>mc)mc=g;
    scoreEl.textContent=`Часу витрачено: ${fmt(s)}`; totalEl.textContent=fmt(ct); updateStats();
  };
  const floating=t=>{
    const e=document.createElement("div"); e.textContent=t;
    e.style.cssText="position:absolute;right:20px;top:50px;color:#ffccd1;font-weight:700;opacity:1;transition:all .9s ease-out";
    wrap.appendChild(e);
    requestAnimationFrame(()=>{e.style.transform="translateX(60px) translateY(-80px)";e.style.opacity="0"});
    setTimeout(()=>e.remove(),920);
  };
  wrap.onclick=e=>e.target.closest("#clickableClock")&&click();

  // Статистика
  const updateStats=()=>{
    realEl.textContent=fmt((Date.now()-start)/1000);
    virtEl.textContent=fmt(s);
    $("totalUpgrades").textContent=bought;
    maxPerClickEl.textContent=fmt(mc);
    prestigeMultEl.textContent=pr.toFixed(2)+"×";
  };

  // Досягнення
  const achs=[["Перший клік",()=>ct>=1,1],["100 сек",()=>s>=100,100],["Перша покупка",()=>bought>=1,1],["Авто",()=>ar>0,1],["Комбо-майстер",()=>mx>=10,10],["Стильний",()=>skin.sh!=="round"||skin.col!=="neon-blue",1]];
  achs.forEach(([t,get,tar])=>{
    const el=document.createElement("div"); el.className="achievement";
    el.innerHTML=`<strong>${t}</strong><div class="ach-progress"></div><div class="ach-state">0%</div>`;
    achEl.appendChild(el);
    el.p=el.querySelector(".ach-progress"); el.st=el.querySelector(".ach-state"); el.get=get; el.tar=tar; el.d=false;
  });
  const updateAch=()=>achEl.querySelectorAll(".achievement").forEach(el=>{
    const v=el.get(), p=Math.min(100,v/el.tar*100);
    el.p.style.width=p+"%";
    if(p>=100&&!el.d){el.d=true;el.st.textContent="Виконано ✅";el.st.style.color="#8df299";toast(`Досягнення: ${el.querySelector("strong").textContent} ✅`)}
    else if(p<100)el.st.textContent=Math.floor(p)+"%";
  });

  // Авто + реальний час
  setInterval(()=>{const g=Math.round(ar*pr);if(g){s+=g;ct+=g;scoreEl.textContent=`Часу витрачено: ${fmt(s)}`;totalEl.textContent=fmt(ct)} updateStats();updateAch()},1000);
  setInterval(()=>{const n=new Date();secondHand.style.transform=`translateX(-50%) rotate(${n.getSeconds()*6}deg)`;
    minuteHand.style.transform=`translateX(-50%) rotate(${n.getMinutes()*6+n.getSeconds()*0.1}deg)`;
    hourHand.style.transform=`translateX(-50%) rotate(${(n.getHours()%12)*30+n.getMinutes()*0.5}deg)`},1000);

  // Реверб
  revBtn.onclick=()=>{if(!confirm("Повернути час назад?"))return;
    revOv.classList.remove("hidden");tunnel.classList.add("active");revHint.style.display="block";rev=true;
    setTimeout(()=>revHint.style.display="none",4000);
  };
  const stop=()=>{clearTimeout(rtimer);revClk.classList.remove("reverb-mode");revClk.querySelectorAll(".hand").forEach(h=>h.classList.remove("reverb-chaos"))};
  revClk.onmousedown=()=>{
    if(!rev)return;
    revHint.style.display="none";
    revClk.classList.add("reverb-mode");
    revClk.querySelectorAll(".hand").forEach(h=>{h.style.setProperty('--rand',Math.random()*360+'deg');h.classList.add("reverb-chaos")});
    rtimer=setTimeout(revComplete,10000);
  };
  revClk.onmouseup=revClk.onmouseleave=stop;
  const revComplete=()=>{
    stop(); pr*=1.2; s=cp=ar=bought=mc=0;
    ups.forEach((u,i)=>{u.l=0;bs[i]?.classList.add("hidden");u.upd()}); bs[0].classList.remove("hidden");
    updateScore();updateStats();updateAch();
    setTimeout(()=>{alert(`Реверб! Множник: ${pr.toFixed(2)}×`);revOv.classList.add("hidden");tunnel.classList.remove("active");rev=false},800);
  };

  // Таби + заголовок
  document.querySelectorAll(".top-tabs .tab").forEach(b=>b.onclick=()=>{
    document.querySelectorAll(".top-tabs .tab,.tab-page").forEach(e=>e.classList.remove("active"));
    b.classList.add("active"); $(b.dataset.tab).classList.add("active");
  });
  worldTitle&&(worldTitle.onkeydown=e=>e.key==="Enter"&&e.preventDefault());
  worldTitle&&(worldTitle.onblur=()=>{let t=worldTitle.textContent.trim();worldTitle.textContent=t?t+(/\sTime$/i.test(t)?"":" Time"):"Times Clicker"});

  // Старт
  scoreEl.textContent=`Часу витрачено: 0 сек`; totalEl.textContent="0 сек"; updateStats(); updateAch();
};
