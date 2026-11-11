/* Quiet Current: intent-aware native scroll -> one continuous sound instrument.
 * Does not consume wheel/touch, move the page, change any visual, or unlock audio.
 * Full-page scope. Existing approved source/assembly sound is preserved; later materials blend without new voices.
 */
(()=>{
 'use strict';
 if(!document.getElementById('system-assembly')||!window.HolyMindSoundScenes)return;
 const route=window.HolyMindSoundScenes;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=t=>t*t*(3-2*t),ease=t=>t*t*t*(t*(t*6-15)+10);
 let raf=0,measureTimer=0,lastTick=performance.now(),lastY=scrollY,lastScroll=0,intentUntil=0,suppressUntil=0,activeUntil=0;
 let speed=0,direction=1,candidate=1,reverseDistance=0,lastInput='none',gesturePeak=0,updates=0,completionArmed=true,reconnectArmed=false,lastCue=-1e6;
 let layout={orbit:1000,ribbon:2400,start:3000,end:5000,height:innerHeight,positions:{}},state={scene:'hero',scope:1,activity:0,progress:0,raw:0,direction:1,morph:0};
 function measure(){
  const top=sel=>{const el=document.querySelector(sel);return el?el.getBoundingClientRect().top+scrollY:0;};
  const s=window.HolyMindAssemblyScroll?.snapshot();
  const start=s?.enabled?s.start:top('#system-assembly'),end=s?.enabled?s.end:top('#system-assembly')+document.getElementById('system-assembly').offsetHeight;
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight),positions={};
  const planned=route.profiles.slice(4).map(row=>({id:row.id,at:row.id==='footer'?Math.min(top(row.selector)-innerHeight*.70,max-Math.min(140,innerHeight*.18)):top(row.selector)-innerHeight*(row.id==='contact'?.60:.25)}));
  // Contact/footer can share a tablet viewport. Reserve a reachable interval for
  // each rather than clamping both to maxScroll and making one scene unreachable.
  const gap=Math.min(80,innerHeight*.08);
  for(let i=planned.length-2;i>=0;i--)planned[i].at=Math.min(planned[i].at,planned[i+1].at-gap);
  let prior=end;for(const row of planned){positions[row.id]=Math.min(max,Math.max(prior+24,row.at));prior=positions[row.id];}
  layout={orbit:top('#mind-flow'),ribbon:top('#signal-crossing'),start,end,height:innerHeight,positions,lead:s?.lead??.04,finish:s?.finish??.93,max,measuredHeight:document.documentElement.scrollHeight};
  queue(220);
 }
 function scheduleMeasure(){clearTimeout(measureTimer);measureTimer=setTimeout(measure,90);}
 function position(y){return route.position(y,layout);}
 function overlayOpen(){return !!document.querySelector('dialog[open]')||document.getElementById('menu-toggle')?.getAttribute('aria-expanded')==='true';}
 function readingFocus(){
  if(overlayOpen())return .38;
  return [...document.querySelectorAll('.about-story[open],#brief-drawer[open],.assembly-guide[open]')].some(el=>{const r=el.getBoundingClientRect();return r.bottom>80&&r.top<innerHeight-4;})?.78:1;
 }
 function tick(now){
  raf=0;if(document.hidden)return;
  const dt=Math.min(.1,Math.max(.012,(now-lastTick)/1000));lastTick=now;
  const y=clamp(scrollY,0,Math.max(0,document.documentElement.scrollHeight-innerHeight)),delta=y-lastY;lastY=y;
  const accepted=now<intentUntil&&now>suppressUntil&&!overlayOpen();
  const rawSpeed=accepted&&Math.abs(delta)>.35?Math.min(4,Math.abs(delta)/Math.max(1,innerHeight)/dt):0;
  speed+=(rawSpeed-speed)*(1-Math.exp(-dt/(rawSpeed>speed?.085:.13)));
  if(accepted&&Math.abs(delta)>.35){
   const sign=Math.sign(delta);if(sign!==candidate){candidate=sign;reverseDistance=0;}reverseDistance+=Math.abs(delta);
   if(reverseDistance>10)direction=candidate;
  }
  const p=position(y),activity=accepted?clamp((1-Math.exp(-speed*1.9))*.95):0;
  gesturePeak=Math.max(gesturePeak,activity);
  state={...p,focus:readingFocus(),activity:activity<.008?0:activity,direction,intent:accepted,lastInput,speed,renderedScrollY:y};updates++;
  window.HolyMindAudio?.updateSoundscape(state);
  window.HolyMindFeedback?.onScroll({...state,gesturePeak});
  // Hysteresis: completion does not replay at 99/100; fast anchor jumps stay silent.
  if(p.progress<.84)completionArmed=true;
  if(p.progress>.16)reconnectArmed=true;
  if(accepted&&activity>.02&&now-lastCue>1800&&p.scope>.8&&y>=p.start-40&&y<=p.end+40){
   if(direction>0&&p.progress>=.999&&completionArmed){completionArmed=false;lastCue=now;window.HolyMindAudio?.settle(false);}
   else if(direction<0&&p.progress<=.001&&reconnectArmed&&y>=p.start-40){reconnectArmed=false;lastCue=now;window.HolyMindAudio?.settle(true);}
  }
  if(now<activeUntil||speed>.006)raf=requestAnimationFrame(tick);
 }
 function queue(ms=900){activeUntil=Math.max(activeUntil,performance.now()+ms);if(!raf){lastTick=performance.now();raf=requestAnimationFrame(tick);}}
 function user(type,e){if(!e.isTrusted||overlayOpen()||e.target?.closest?.('textarea,select,[contenteditable=true],#primary-nav'))return;intentUntil=performance.now()+1000;lastInput=type;gesturePeak=0;queue();}
 addEventListener('wheel',e=>user('wheel',e),{passive:true});
 addEventListener('touchmove',e=>user('touch',e),{passive:true});
 document.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.matches('input,textarea,select,button,[contenteditable=true]'))user('keyboard',e);});
 document.addEventListener('input',e=>{if(e.target.id==='assembly-control')user('manual-scrub',e);},true);
 addEventListener('scroll',()=>{
  const now=performance.now();lastScroll=now;
  if(now<intentUntil&&now>suppressUntil)intentUntil=Math.max(intentUntil,now+260);
  queue();
 },{passive:true});
 function suppress(ms=800){suppressUntil=performance.now()+ms;intentUntil=0;speed=0;lastY=scrollY;queue(200);}
 document.addEventListener('click',e=>{
  if(e.target.closest('a[href^="#"]'))suppress(1400);
  else if(e.target.closest('summary,[data-filter],#show-skills,#clear-search,#instrument-open,.skill-card,#close-skill-dialog,#menu-toggle')){suppress(500);scheduleMeasure();}
 },true);
 document.addEventListener('input',e=>{if(e.target.id==='skill-search'){suppress(400);scheduleMeasure();}},true);
 document.addEventListener('toggle',e=>{if(e.target.tagName==='DETAILS'){suppress(350);scheduleMeasure();}},true);
 const dialog=document.getElementById('skill-dialog'),menu=document.getElementById('menu-toggle');
 if(window.MutationObserver){const watcher=new MutationObserver(()=>{suppress(280);queue(300);});if(dialog)watcher.observe(dialog,{attributes:true,attributeFilter:['open']});if(menu)watcher.observe(menu,{attributes:true,attributeFilter:['aria-expanded']});}
 addEventListener('hashchange',()=>suppress(900));addEventListener('popstate',()=>suppress(900));
 addEventListener('resize',()=>{suppress(450);scheduleMeasure();},{passive:true});
 window.ScrollTrigger?.addEventListener('refresh',scheduleMeasure);
 if(window.ResizeObserver)new ResizeObserver(()=>{if(Math.abs(document.documentElement.scrollHeight-(layout.measuredHeight||0))>2)suppress(180);scheduleMeasure();}).observe(document.querySelector('main'));
 document.fonts?.ready.then(measure);
 document.addEventListener('holymind:audio-state',()=>queue(200));
 function park(){if(raf)cancelAnimationFrame(raf);raf=0;speed=0;intentUntil=0;state={...state,activity:0};window.HolyMindAudio?.updateSoundscape({...state,scope:0});}
 addEventListener('pagehide',park);addEventListener('pageshow',()=>{lastY=scrollY;measure();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)park();else{lastY=scrollY;suppress(400);measure();}});
 window.HolyMindScrollSound=Object.freeze({version:'full-current-v14',clearGesture:()=>suppress(0),suppressForNavigation:()=>suppress(1400),snapshot:()=>({...state,gesturePeak,updates,running:!!raf,lastScroll,completionArmed,reconnectArmed,scopeName:'Full journey · 11 scenes',stations:route.profiles.map(p=>({id:p.id,name:p.name,at:p.id==='hero'?0:p.id==='orbit'?layout.orbit-innerHeight*.25:p.id==='ribbon'?layout.ribbon-innerHeight*.25:p.id==='assembly'?layout.start:layout.positions[p.id]})),measuredHeight:layout.measuredHeight})});
 measure();
})();
