/* Material responses to one shared energy carrier. Pure scroll state, reversible.
 * Existing component selections, slider values and transforms are never overwritten.
 */
(()=>{
 'use strict';
 const q=s=>document.querySelector(s),clamp=n=>Math.max(0,Math.min(1,n)),smooth=t=>t*t*(3-2*t);
 const targets={neural:'.hero-copy',orbit:'.orbit-stage',ribbon:'.signal-crossing',assembly:'.assembly-view',system:'.strategy-panel',skills:'.skill-instrument',gallery:'.framework',services:'.approach-intro',delivery:'.approach-list details:last-child .service-art',signature:'.signature-sculpture',portal:'.contact-portal'};
 const surfaces=Object.fromEntries(Object.entries(targets).map(([key,sel])=>{const el=q(sel);el?.classList.add('energy-surface');return[key,el];}));
 const light=document.createElement('div');light.className='energy-reception';light.setAttribute('aria-hidden','true');light.innerHTML='<div class="energy-pool"></div><div class="energy-pool is-gold"></div>';document.body.append(light);
 const pools=[...light.children];let state=null,levels={},updates=0;
 function level(id,v,x,y){
  const el=surfaces[id];if(!el)return;v=clamp(v);levels[id]=v;
  el.style.setProperty('--received',v.toFixed(4));el.dataset.energyReceived=v.toFixed(4);
  if(v>.01){const r=el.getBoundingClientRect();el.style.setProperty('--energy-x',(clamp((x-r.left)/Math.max(r.width,1))*100).toFixed(2)+'%');el.style.setProperty('--energy-y',(clamp((y-r.top)/Math.max(r.height,1))*100).toFixed(2)+'%');}
 }
 function receive(next){
  state=next;updates++;const {from,to,progress:p,same,x,y}=next;
  const calm=document.body.dataset.motionProfile==='calm',depart=same?.85:1-smooth(clamp(p*2.1)),arrival=same?0:smooth(clamp((p-.36)/.64));
  for(const id of Object.keys(surfaces))level(id,id===from?depart:id===to?arrival:0,x,y);
  const dims=innerWidth<=680?[180,140]:[260,180];
  pools.forEach((el,i)=>{const id=i?to:from,amount=calm?0:i?arrival:depart,target=surfaces[id];
   if(!target||amount<.02){el.style.opacity='0';return;}
   const r=target.getBoundingClientRect(),px=clamp((x-r.left)/Math.max(r.width,1))*r.width+r.left,py=clamp((y-r.top)/Math.max(r.height,1))*r.height+r.top;
   el.style.transform=`translate3d(${px-dims[0]/2}px,${py-dims[1]/2}px,0)`;el.style.opacity=String(amount*.8);
  });
  // Light runs along the actual existing linework; phase retraces when scroll reverses.
  q('.orbit-dashes')?.style.setProperty('stroke-dashoffset',String(-p*150));
  const portal=surfaces.portal;if(portal)portal.querySelectorAll('.portal-highlight').forEach((el,i)=>{el.style.strokeDashoffset=String((1-(levels.portal||0))*200+i*12);});
 }
 function brain({x,y,charge,hero,orbit,quiet}){
  q('.neural-core')?.style.setProperty('--neural-charge',String(quiet?.5:charge));
  if(hero)level('neural',(quiet?.1:.3)*charge,innerWidth*x,innerHeight*y);
  if(orbit&&state?.from==='orbit'&&state?.to==='orbit')level('orbit',.55+charge*.35,innerWidth*x,innerHeight*y);
 }
 document.addEventListener('holymind:motion',()=>{if(document.body.dataset.motionProfile==='calm'){for(const id of Object.keys(surfaces))level(id,0,0,0);pools.forEach(el=>el.style.opacity='0');}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pools.forEach(el=>el.style.opacity='0');});
 window.HolyMindEnergy=Object.freeze({receive,brain,snapshot:()=>({version:'spark-v8',updates,state:state?{...state}:null,levels:{...levels}})});
})();
