/* Surface light derived from the same source coordinates as the visual effects.
 * Pure particle-frame mapping: reversal restores the same material light. */
(()=>{'use strict';const q=s=>document.querySelector(s),word=q('.signature-sculpture'),hero=q('.hero-visual'),portal=q('.contact-portal'),cache=new WeakMap();
 const rim=q('.core-orbit');if(rim){const glint=document.createElement('span');glint.className='source-reflection';glint.setAttribute('aria-hidden','true');rim.append(glint);}
 let last={active:false,gold:0,cyan:0,violet:0,x:.5},sourceLight=0,updates=0;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 function set(el,name,value){if(!el)return;let values=cache.get(el);if(!values){values={};cache.set(el,values);}const v=typeof value==='number'?value.toFixed(4):value;if(values[name]===v)return;values[name]=v;el.style.setProperty(name,v);}
 function boom(frame,box){
  if(!frame||!box||frame.progress<=0||frame.progress>=1){if(last.active){set(word,'--boom-light-gold',0);set(word,'--boom-light-cyan',0);set(word,'--boom-light-violet',0);}last={active:false,gold:0,cyan:0,violet:0,x:.5};return;}
  let gold=0,cyan=0,violet=0,weight=0,x=0;const sums={gold:0,cyan:0,violet:0},weights={gold:0,cyan:0,violet:0};
  for(const p of frame.particles){const d=Math.max(0,box.wordTop-p.y),a=Math.max(0,p.alpha)/(1+d/110);weight+=a;x+=a*p.x;const channel=p.color===3?'gold':p.color===1?'cyan':'violet';sums[channel]+=a*p.x;weights[channel]+=a;if(p.color===3)gold+=a;else if(p.color===1)cyan+=a;else violet+=a;}
  gold=clamp(gold/32,0,.42);cyan=clamp(cyan/24,0,.30);violet=clamp(violet/65,0,.28);
  const center=weight?clamp((x/weight-box.wordLeft)/Math.max(1,box.wordWidth)):.5;
  const centers={};for(const c of ['gold','cyan','violet']){centers[c]=weights[c]?clamp((sums[c]/weights[c]-box.wordLeft)/Math.max(1,box.wordWidth)):.5;set(word,'--boom-light-'+c+'-x',(centers[c]*100).toFixed(2)+'%');}
  set(word,'--boom-light-x',(center*100).toFixed(2)+'%');set(word,'--boom-light-gold',gold);set(word,'--boom-light-cyan',cyan);set(word,'--boom-light-violet',violet);
  last={active:true,gold,cyan,violet,x:center,centers};updates++;
 }
 function brain(s){sourceLight=s.hero?clamp(.18+s.charge*.25+s.burst*.35):0;set(hero,'--source-light',sourceLight);set(hero,'--source-x',(clamp(s.x)*100).toFixed(2)+'%');set(hero,'--source-y',(clamp(s.y)*100).toFixed(2)+'%');}
 function travel(s){const value=s.to==='portal'?clamp(s.progress):s.from==='portal'?.7:0;set(portal,'--portal-reflection',value);}
 window.HolyMindLighting=Object.freeze({boom,brain,travel,snapshot:()=>({boom:{...last},sourceLight,updates,pureScrollReflection:true})});
})();
