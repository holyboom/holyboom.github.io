/* Quiet Current: intent-aware native scroll -> one continuous sound instrument.
 * Does not consume wheel/touch, move the page, change any visual, or unlock audio.
 * Prototype scope is Hero -> orbital chapters -> ribbon -> pinned assembly only.
 */
(()=>{
 'use strict';
 if(!document.getElementById('system-assembly'))return;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=t=>t*t*(3-2*t),ease=t=>t*t*t*(t*(t*6-15)+10);
 let raf=0,measureTimer=0,lastTick=performance.now(),lastY=scrollY,lastScroll=0,intentUntil=0,suppressUntil=0,activeUntil=0;
 let speed=0,direction=1,candidate=1,reverseDistance=0,lastInput='none',gesturePeak=0,updates=0,completionArmed=true,reconnectArmed=false,lastCue=-1e6;
 let layout={orbit:1000,ribbon:2400,start:3000,end:5000,height:innerHeight},state={scene:'hero',scope:1,activity:0,progress:0,raw:0,direction:1,morph:0};
 function measure(){
  const top=sel=>{const el=document.querySelector(sel);return el?el.getBoundingClientRect().top+scrollY:0;};
  const s=window.HolyMindAssemblyScroll?.snapshot();
  layout={orbit:top('#mind-flow'),ribbon:top('#signal-crossing'),start:s?.enabled?s.start:top('#system-assembly'),end:s?.enabled?s.end:top('#system-assembly')+document.getElementById('system-assembly').offsetHeight,height:innerHeight};
  queue(220);
 }
 function scheduleMeasure(){clearTimeout(measureTimer);measureTimer=setTimeout(measure,90);}
 function position(y){
  const story=window.HolyMindAssemblyScroll?.snapshot(),start=story?.enabled?story.start:layout.start,end=story?.enabled?story.end:layout.end;
  const raw=clamp((y-start)/Math.max(1,end-start)),p=ease(clamp((raw-(story?.lead??.04))/((story?.finish??.93)-(story?.lead??.04))));
  const scene=y<layout.orbit-innerHeight*.25?'hero':y<layout.ribbon-innerHeight*.25?'orbit':y<start?'ribbon':y<=end+innerHeight*.4?'assembly':'outside';
  const scope=y<=end?1:1-smooth(clamp((y-end)/(innerHeight*.4)));
  const morph=scene==='hero'?.10:scene==='orbit'?.34:scene==='ribbon'?.55:scene==='assembly'?.66+.34*p:1;
  return {scene,scope,progress:p,raw,morph,start,end};
 }
 function tick(now){
  raf=0;if(document.hidden)return;
  const dt=Math.min(.1,Math.max(.012,(now-lastTick)/1000));lastTick=now;
  const y=clamp(scrollY,0,Math.max(0,document.documentElement.scrollHeight-innerHeight)),delta=y-lastY;lastY=y;
  const accepted=now<intentUntil&&now>suppressUntil;
  const rawSpeed=accepted&&Math.abs(delta)>.35?Math.min(4,Math.abs(delta)/Math.max(1,innerHeight)/dt):0;
  speed+=(rawSpeed-speed)*(1-Math.exp(-dt/(rawSpeed>speed?.085:.13)));
  if(accepted&&Math.abs(delta)>.35){
   const sign=Math.sign(delta);if(sign!==candidate){candidate=sign;reverseDistance=0;}reverseDistance+=Math.abs(delta);
   if(reverseDistance>10)direction=candidate;
  }
  const p=position(y),activity=accepted?clamp((1-Math.exp(-speed*1.9))*.95):0;
  gesturePeak=Math.max(gesturePeak,activity);
  state={...p,activity:activity<.008?0:activity,direction,intent:accepted,lastInput,speed,renderedScrollY:y};updates++;
  window.HolyMindAudio?.updateSoundscape(state);
  // Hysteresis: completion does not replay at 99/100; fast anchor jumps stay silent.
  if(p.progress<.84)completionArmed=true;
  if(p.progress>.16)reconnectArmed=true;
  if(accepted&&activity>.02&&now-lastCue>1800&&p.scope>.8){
   if(direction>0&&p.progress>=.999&&completionArmed){completionArmed=false;lastCue=now;window.HolyMindAudio?.settle(false);}
   else if(direction<0&&p.progress<=.001&&reconnectArmed&&y>=p.start-40){reconnectArmed=false;lastCue=now;window.HolyMindAudio?.settle(true);}
  }
  if(now<activeUntil||speed>.006)raf=requestAnimationFrame(tick);
 }
 function queue(ms=900){activeUntil=Math.max(activeUntil,performance.now()+ms);if(!raf){lastTick=performance.now();raf=requestAnimationFrame(tick);}}
 function user(type,e){if(!e.isTrusted)return;intentUntil=performance.now()+1000;lastInput=type;gesturePeak=0;queue();}
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
 document.addEventListener('click',e=>{if(e.target.closest('a[href^="#"]'))suppress(1400);},true);
 addEventListener('hashchange',()=>suppress(900));addEventListener('popstate',()=>suppress(900));
 addEventListener('resize',()=>{suppress(450);scheduleMeasure();},{passive:true});
 window.ScrollTrigger?.addEventListener('refresh',scheduleMeasure);
 if(window.ResizeObserver)new ResizeObserver(scheduleMeasure).observe(document.querySelector('main'));
 document.fonts?.ready.then(measure);
 document.addEventListener('holymind:audio-state',()=>queue(200));
 function park(){if(raf)cancelAnimationFrame(raf);raf=0;speed=0;intentUntil=0;state={...state,activity:0};window.HolyMindAudio?.updateSoundscape({...state,scope:0});}
 addEventListener('pagehide',park);addEventListener('pageshow',()=>{lastY=scrollY;measure();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)park();else{lastY=scrollY;suppress(400);measure();}});
 window.HolyMindScrollSound=Object.freeze({version:'soundscape-v13',snapshot:()=>({...state,gesturePeak,updates,running:!!raf,lastScroll,completionArmed,reconnectArmed,scopeName:'Hero → Assemble'})});
 measure();
})();
