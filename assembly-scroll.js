/* Guided native scroll. Pin the presentation, not the input stream. */
(()=>{
 'use strict';
 const root=document.getElementById('system-assembly'),pin=root?.querySelector('.assembly-pin'),slider=document.getElementById('assembly-control');
 if(!root||!pin||!slider)return;
 const {ScrollTrigger,gsap}=window;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=t=>t*t*t*(t*(t*6-15)+10);
 const lead=.04,finish=.93;
 const viewport=()=>window.HolyMindViewport?.measure()||{width:innerWidth,height:innerHeight};
 let trigger=null,last=-1,resizeTimer=0,sizing=false,dimensions='',seeking=false;
 const progress=p=>ease(clamp((p-lead)/(finish-lead)));
 function inverse(n){let lo=0,hi=1;for(let i=0;i<24;i++){const m=(lo+hi)/2;if(ease(m)<n)lo=m;else hi=m;}return lead+(lo+hi)/2*(finish-lead);}
 function setValue(p,force=false){
  const value=Math.round(progress(p)*100);root.dataset.scrollProgress=Number(p).toFixed(6);
  if(value===last&&!force)return;last=value;slider.value=String(value);
  document.dispatchEvent(new CustomEvent('holymind:assembly',{detail:{expanded:value,source:'scroll'}}));
 }
 function size(){
  const header=document.querySelector('.masthead')?.getBoundingClientRect().height||72;
  const vh=viewport().height,available=Math.max(240,Math.min(820,vh-header-20));
  root.style.setProperty('--assembly-pin-height',`${Math.floor(available)}px`);root.style.setProperty('--assembly-pin-top',`${header+8}px`);
  pin.classList.toggle('is-short',available<470);
  const view=root.querySelector('.assembly-view'),stage=root.querySelector('.assembly-stage'),h=view.getBoundingClientRect().height,w=stage.getBoundingClientRect().width;
  const sheet=Math.min(innerWidth<=680?136:290,w*.68,h*.38);
  root.style.setProperty('--guided-sheet',`${Math.max(64,sheet).toFixed(2)}px`);
  root.style.setProperty('--guided-distance',`${Math.max(24,Math.min(155,h*.25-sheet*.08)).toFixed(2)}px`);dimensions=`${viewport().width}x${viewport().height}`;
 }
 function span(){return Math.round(clamp(viewport().height*(innerWidth<=680?2.15:2.5),1200,2400));}
 function initialize(){
  if(!gsap||!ScrollTrigger){root.dataset.assemblyMode='manual';return;}
  root.dataset.assemblyMode='guided';root.dataset.pinState='before';pin.classList.add('is-guided');size();
  trigger=ScrollTrigger.create({id:'assembly-story',trigger:root,pin,pinSpacing:true,
   start:()=>`top ${(document.querySelector('.masthead')?.offsetHeight||72)+8}`,end:()=>`+=${span()}`,anticipatePin:1,invalidateOnRefresh:true,refreshPriority:15,
   onUpdate:self=>{root.dataset.pinState=self.isActive?'pinned':self.progress===1?'after':'before';setValue(self.progress);},
   onRefresh:self=>{setValue(self.progress,true);root.dataset.pinState=self.isActive?'pinned':self.progress===1?'after':'before';},
   onLeave:()=>setValue(1),onLeaveBack:()=>setValue(0)});
  ScrollTrigger.sort();ScrollTrigger.refresh();
 }
 function seek(value){
  if(!trigger)return false;const amount=clamp(Number(value)||0,0,100)/100,raw=amount<=0?lead*.5:amount>=1?finish+.025:inverse(amount);seeking=true;
  window.scrollTo({top:trigger.start+raw*(trigger.end-trigger.start),behavior:'instant'});ScrollTrigger.update();setValue(raw,true);seeking=false;return true;
 }
 function resize(){
  if(dimensions===`${viewport().width}x${viewport().height}`||sizing)return;
  clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{
   if(!trigger)return;const active=trigger.isActive,p=trigger.progress;sizing=true;
   // Rebuild after restoring natural styles; pinned inline sizes otherwise retain the old viewport.
   trigger.kill(true);trigger=null;last=-1;initialize();
   if(active&&!seeking){window.scrollTo({top:trigger.start+p*(trigger.end-trigger.start),behavior:'instant'});ScrollTrigger.update();}sizing=false;
  },200);
 }
 window.HolyMindAssemblyScroll=Object.freeze({version:'interaction-v10',enabled:()=>!!trigger,seek,snapshot:()=>({enabled:!!trigger,start:trigger?.start||0,end:trigger?.end||0,raw:trigger?.progress||0,value:Number(slider.value),active:!!trigger?.isActive,phase:root.dataset.pinState,viewport:dimensions,ease:'smootherstep',lead,finish})});
 initialize();addEventListener('resize',resize,{passive:true});
 addEventListener('pageshow',()=>{if(trigger){size();ScrollTrigger.refresh();}});
 document.fonts?.ready.then(()=>{if(trigger){size();ScrollTrigger.refresh();}});
})();
