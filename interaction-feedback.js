/* Actual state changes -> finite sonic acknowledgements.
 * Reads existing rendered state; never moves the page, changes selections or owns visuals.
 * Docking uses the visual continuity route, not arbitrary section percentages. */
(()=>{
 'use strict';
 const q=s=>document.querySelector(s),history=[];
 let lastDock=null,dockY=0,dockCandidate=null,rearmed=true,lastPhase=null,lastReveals=[0,0,0],scrollCalls=0,actions=0,copyArmed=0,searchTimer=0;
 const timers=new Set();
 const emit=(id,opts)=>{const played=window.HolyMindAudio?.cue(id,opts)||false;history.push({id,...opts,played,time:performance.now()});if(history.length>120)history.shift();return played;};
 const selected=(sel,attr)=>q(sel)?.getAttribute(attr)||'';
 const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>75&&r.top<innerHeight;};
 const dockVariants={neural:0,orbit:1,ribbon:2,assembly:3,system:1,skills:4,gallery:2,services:3,delivery:4,signature:0,portal:5};
 function onScroll(s){
  scrollCalls++;const c=window.HolyMindContinuity?.snapshot();
  const phase=q('#mind-flow')?.dataset.phase||null,reveals=window.HolyMindAssembly?.snapshot().reveals||[0,0,0];
  const input=s.intent&&(s.gesturePeak||s.activity)>.025&&!document.hidden;
  const choices=[];
  if(phase!==lastPhase&&lastPhase!==null&&input&&visible(q('.orbit-stage'))){choices.push({id:'phase',priority:2,key:'phase:'+phase,kind:'phase',variant:Math.max(0,['reason','build','verify'].indexOf(phase)),direction:s.direction});}
  lastPhase=phase;
  if(input&&s.renderedScrollY>=s.start-40&&s.renderedScrollY<=s.end+40){
   let layer=-1;
   for(let i=0;i<3;i++)if((s.direction>0&&lastReveals[i]<.98&&reveals[i]>=.98)||(s.direction<0&&lastReveals[i]>.02&&reveals[i]<=.02))layer=i;
   if(layer>=0)choices.push({id:s.direction>0?'layer':'return',priority:2,key:'layer:'+layer+':'+s.direction,kind:'layer',variant:layer,direction:s.direction});
  }
  lastReveals=[...reveals];
  if(c&&Number.isFinite(c.progress)){
   const dock=c.from===c.to?c.from:c.progress>=.985?c.to:c.progress<=.015?c.from:null;
   if(!input){dockCandidate=null;if(dock){lastDock=dock;dockY=s.renderedScrollY;rearmed=false;}}
   else if(!dock){dockCandidate=null;if(Math.abs(s.renderedScrollY-dockY)>70)rearmed=true;}
   else if(dock!==lastDock||rearmed){
    if(!dockCandidate||dockCandidate.id!==dock)dockCandidate={id:dock,at:performance.now()};
    if(performance.now()-dockCandidate.at>=65){
     choices.push({id:s.direction<0?'return':'dock',priority:1,key:'dock:'+dock+':'+s.direction,kind:'arrival',variant:dockVariants[dock]||0,direction:s.direction});
     lastDock=dock;dockY=s.renderedScrollY;rearmed=false;dockCandidate=null;
    }
   }
  }
  // One latest meaningful event per frame. Layer/phase beats a simultaneous arrival.
  const event=choices.sort((a,b)=>b.priority-a.priority)[0];if(event)emit(event.id,event);
 }
 function describe(target){
  if(!(target instanceof Element)||target.closest('.sonic-settings,.brain-trigger,#sound-toggle'))return null;
  let e;
  if((e=target.closest('[data-challenge]')))return {id:'switch',key:'scenario',read:()=>selected('[data-challenge][aria-selected=true]','data-challenge')};
  if((e=target.closest('[data-step]')))return {id:'select',key:'step',read:()=>selected('[data-step][aria-pressed=true]','data-step')};
  if((e=target.closest('[data-callout]')))return {id:'select',key:'layer-focus',read:()=>selected('[data-callout][aria-pressed=true]','data-callout')};
  if((e=target.closest('.deck-shard,#previous-skill,#next-skill')))return {id:'select',key:'skill-select',read:()=>selected('.deck-shard[aria-pressed=true]','data-skill')};
  if((e=target.closest('.skill-card,#instrument-open')))return {id:'open',key:'skill-detail',read:()=>q('#skill-dialog')?.open?q('#skill-dialog-title').textContent:''};
  if((e=target.closest('#close-skill-dialog,#skill-source'))||target.matches('#skill-dialog'))return {id:'close',key:'skill-close',read:()=>String(q('#skill-dialog')?.open)};
  if((e=target.closest('[data-filter]')))return {id:'filter',key:'filter',read:()=>selected('[data-filter][aria-pressed=true]','data-filter')};
  if((e=target.closest('#show-skills')))return {id:'open',key:'gallery-expand',read:()=>e.getAttribute('aria-expanded'),choose:v=>v==='true'?'open':'close'};
  if((e=target.closest('#clear-search')))return {id:'filter',key:'search-reset',read:()=>q('#skill-search').value+'|'+selected('[data-filter][aria-pressed=true]','data-filter')};
  if((e=target.closest('#open-brief')))return {id:'open',key:'brief-open',read:()=>String(q('#brief-drawer').open)};
  if((e=target.closest('#copy-brief')))return {id:'confirm',key:'copy',copy:true,read:()=>''};
  if((e=target.closest('#menu-toggle')))return {id:'open',key:'navigation',read:()=>e.getAttribute('aria-expanded'),choose:v=>v==='true'?'open':'close'};
  if((e=target.closest('summary'))){const d=e.closest('details');if(!d)return null;return {id:'open',key:'disclosure:'+(d.id||[...document.querySelectorAll('details')].indexOf(d)),read:()=>String(d.open),choose:v=>v==='true'?'open':'close'};}
  if((e=target.closest('a[href^="#"]')))return {id:'switch',key:'navigate',read:()=>location.hash};
  return null;
 }
 function schedule(fn,ms=30){const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);}
 function capture(e){
  if(!e.isTrusted)return;
  if(e.type==='keydown'&&!['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Home','End','Escape'].includes(e.key))return;
  let action=describe(e.target);
  if(e.type==='keydown'&&e.key==='Escape'){
   if(q('#skill-dialog')?.open)action={id:'close',key:'skill-close',read:()=>String(q('#skill-dialog').open)};
   else if(q('#menu-toggle')?.getAttribute('aria-expanded')==='true')action={id:'close',key:'navigation',read:()=>q('#menu-toggle').getAttribute('aria-expanded')};
   else return;
  }
  if(e.type==='keydown'&&e.key!=='Escape'&&!e.target.closest('[data-challenge],.deck-shard'))return;
  if(!action)return;
  const before=action.read();window.HolyMindAudio?.beginFeedback(true);actions++;
  if(action.copy){copyArmed=performance.now()+1600;return;}
  schedule(()=>{
   if(document.hidden)return;const after=action.read();if(after===before)return;
   const id=action.choose?action.choose(after):action.id,variant=action.key==='step'?Number(after)||0:action.key==='filter'?['all','reason','build','verify'].indexOf(after):0;
   emit(id,{priority:3,key:action.key+':'+after,kind:'action',variant});
  });
 }
 document.addEventListener('click',capture,true);document.addEventListener('keydown',capture,true);
 document.addEventListener('input',e=>{
  if(!e.isTrusted)return;
  if(e.target.id==='assembly-control')window.HolyMindAudio?.beginFeedback(true);
  if(e.target.id==='skill-search'){
   window.HolyMindAudio?.beginFeedback(true);clearTimeout(searchTimer);
   searchTimer=setTimeout(()=>{if(document.hidden)return;const count=document.querySelectorAll('.skill-card').length;emit(count?'filter':'close',{priority:3,key:'search-result:'+e.target.value.length+':'+count,kind:'action',variant:count%3});},420);
  }
 },true);
 const copy=q('#copy-status');if(copy&&window.MutationObserver)new MutationObserver(()=>{
  if(performance.now()<copyArmed&&copy.textContent.startsWith('Project brief copied.')){copyArmed=0;emit('confirm',{priority:3,key:'copy-success',kind:'action'});}
 }).observe(copy,{childList:true,characterData:true,subtree:true});
 function reset(){clearTimeout(searchTimer);for(const t of timers)clearTimeout(t);timers.clear();dockCandidate=null;lastDock=null;rearmed=true;copyArmed=0;lastPhase=q('#mind-flow')?.dataset.phase||null;lastReveals=window.HolyMindAssembly?.snapshot().reveals||[0,0,0];}
 addEventListener('pagehide',reset);addEventListener('pageshow',reset);document.addEventListener('visibilitychange',reset);
 window.HolyMindFeedback=Object.freeze({version:'feedback-v15',onScroll,snapshot:()=>({scrollCalls,actions,lastDock,dockCandidate:lastDock?dockCandidate:null,phase:lastPhase,reveals:[...lastReveals],history:[...history]})});reset();
})();
