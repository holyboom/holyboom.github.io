/* Always Active v9: visible linework carries an ambient current even with no input.
 * CSS owns only decorative clones. Scroll and sliders retain their original transforms.
 * No requestAnimationFrame loop, timer, input interception, or external dependency.
 */
(()=>{
 'use strict';
 const q=s=>document.querySelector(s),scenes=[...document.querySelectorAll('#top,#mind-flow,#signal-crossing,#system-assembly,#framework,#what-i-do,#about,#connect')];
 const ns='http://www.w3.org/2000/svg';
 function trace(parent,d,kind,delay=0,unit=false){
  if(!parent||!d)return;
  const path=document.createElementNS(ns,'path');path.classList.add('ambient-trace',kind);path.setAttribute('d',d);path.setAttribute('fill','none');path.setAttribute('aria-hidden','true');
  if(unit)path.setAttribute('pathLength','1');path.style.animationDelay=`${delay}s`;parent.append(path);
 }
 const outer=q('.orbit-outer'),outerPath=outer?.querySelector('path');trace(outer,outerPath?.getAttribute('d'),'ambient-orbit');
 document.querySelectorAll('.plane-circuit').forEach((svg,i)=>trace(svg,svg.querySelector('.circuit-lit')?.getAttribute('d'),'ambient-circuit',-i*1.1,true));
 document.querySelectorAll('.portal-frame').forEach((g,i)=>trace(g,g.querySelector('path')?.getAttribute('d'),'ambient-portal',-i*.65));
 const band=q('.band-one');if(band){const light=document.createElement('span');light.className='ambient-band-light';light.setAttribute('aria-hidden','true');band.append(light);}
 scenes.forEach(el=>el.classList.add('ambient-scene'));
 let hidden=document.hidden;
 const within=el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;};
 function update(el,visible){el.dataset.ambientState=!hidden&&visible?'playing':'parked';}
 function refresh(){hidden=document.hidden;scenes.forEach(el=>update(el,within(el)));document.body.dataset.ambient=hidden?'parked':'active';}
 if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>update(e.target,e.isIntersecting)));scenes.forEach(el=>io.observe(el));}
 else addEventListener('scroll',refresh,{passive:true});
 document.addEventListener('visibilitychange',refresh);addEventListener('pageshow',refresh);addEventListener('focus',refresh);addEventListener('resize',refresh,{passive:true});
 document.addEventListener('holymind:motion',refresh);
 addEventListener('pagehide',()=>{hidden=true;scenes.forEach(el=>update(el,false));document.body.dataset.ambient='parked';});
 refresh();
 window.HolyMindAmbient=Object.freeze({snapshot:()=>({version:'always-v9',hidden,scenes:scenes.map(e=>({id:e.id,state:e.dataset.ambientState})),traces:document.querySelectorAll('.ambient-trace').length})});
})();
