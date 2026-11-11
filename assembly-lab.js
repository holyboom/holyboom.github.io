/* Exploded System v7. Native input drives reversible disclosure; real 3D pins drive lines.
   All geometry is read before drawing; work stops offscreen/hidden and after scrub settles. */
(() => {
 'use strict';
 const root=document.getElementById('system-assembly'),slider=document.getElementById('assembly-control');
 if(!root||!slider)return;
 const view=root.querySelector('.assembly-view'),svg=root.querySelector('.assembly-leaders'),output=document.getElementById('assembly-value');
 if(!view||!svg)return;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=t=>t*t*(3-2*t),ns='http://www.w3.org/2000/svg';
 const kinds=['intent','tools','evidence'],titles=['Human Intent','Connections','Evidence'],ranges=[[18,42],[42,67],[67,90]];
 let amount=Number(slider.value),reveals=[0,0,0],focus=-1,manualFocus=-1,raf=0,until=0,inside=false,scanStart=0,lastComplete=false,frames=0,geometry=[];
 const allowed=()=>document.body.dataset.motion==='on';
 const el=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
 const rows=kinds.map((kind,i)=>{
  const group=el('g',{'data-leader':kind});
  const glow=el('path',{class:'leader-glow',pathLength:1}),line=el('path',{class:'leader-line',pathLength:1}),origin=el('circle',{class:'leader-origin',r:4}),end=el('rect',{class:'leader-end',width:6,height:6}),head=el('rect',{class:'leader-head',width:4,height:4});
  group.append(glow,line,origin,end,head);svg.append(group);
  const callout=root.querySelector(`[data-callout="${kind}"]`),plane=root.querySelector(`[data-assembly-layer="${kind}"]`),pin=root.querySelector(`[data-pin="${kind}"]`),port=callout.querySelector('.callout-port');
  callout.addEventListener('click',()=>{scanStart=0;until=0;manualFocus=i;apply(amount,false);queue(350);});
  return {kind,group,glow,line,origin,end,head,callout,plane,pin,port};
 });
 function apply(value,changed=true){
  amount=clamp(Number(value)||0,0,100);
  if(changed)manualFocus=-1;
  reveals=ranges.map(([a,b])=>smooth(clamp((amount-a)/(b-a))));
  const next=amount<18?-1:amount<42?0:amount<67?1:2;
  focus=manualFocus>=0?manualFocus:next;
  root.style.setProperty('--separation',String(amount/100));root.style.setProperty('--slider-fill',`${amount}%`);
  root.style.setProperty('--routing-reveal',smooth(clamp((amount-26)/34)).toFixed(4));root.style.setProperty('--checks-reveal',smooth(clamp((amount-52)/38)).toFixed(4));
  const complete=amount>=96;
  if(complete&&!lastComplete&&changed&&allowed()&&inside)scanStart=performance.now();
  if(!complete||!allowed())scanStart=0;
  lastComplete=complete;root.dataset.complete=String(complete);root.dataset.expanded=String(amount);root.dataset.assembled=String(100-amount);
  if(output)output.textContent=`${Math.round(amount)}% expanded`;
  slider.setAttribute('aria-valuetext',`${amount} percent expanded${next>=0?'; '+titles[next]+' revealed':'; connected system'}`);
  const hint=root.querySelector('.assembly-instruction');
  hint.firstChild.textContent=complete?'Three layers. One connected system.':'One system. Three layers.';
  hint.querySelector('span').textContent=root.dataset.assemblyMode==='guided'?(complete?'Scroll onward, or scroll up to reconnect.':'Keep scrolling. Follow the next connection.'):(complete?'Tap a label to inspect its layer. Drag left to reconnect.':'Keep dragging to reveal the next connection.');
  rows.forEach((r,i)=>{
   const reveal=reveals[i],visible=reveal>.015;
   root.style.setProperty(`--${r.kind}-reveal`,reveal.toFixed(4));
   r.callout.style.visibility=visible?'visible':'hidden';r.callout.style.opacity=String(reveal);r.callout.style.transform=`translateX(${((1-reveal)*12).toFixed(2)}px)`;
   r.callout.disabled=reveal<.65;r.callout.setAttribute('aria-hidden',String(!visible));r.callout.dataset.complete=String(reveal>.98);
   r.callout.setAttribute('aria-pressed',String(focus===i&&visible));r.plane.dataset.active=String(focus===i&&visible);
   r.plane.style.setProperty('--icon-scale',String(focus===i?1.04:1));
  });
  queue(220);
 }
 function draw(now){
  raf=0;
  if(document.hidden||!inside)return;
  // READ phase: both endpoints are actual projected DOM boxes after CSS 3D transforms.
  const base=view.getBoundingClientRect();
  if(base.width<=0||base.height<=0)return;
  const points=rows.map(r=>{const a=r.pin.getBoundingClientRect(),b=r.port.getBoundingClientRect();return {a:{x:a.left+a.width/2-base.left,y:a.top+a.height/2-base.top},b:{x:b.left+b.width/2-base.left,y:b.top+b.height/2-base.top}};});
  // WRITE phase: one SVG in the same coordinate system; no layout-changing transforms.
  svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);
  const scan=scanStart?clamp((now-scanStart)/1750):0;
  if(scanStart&&scan>=1)scanStart=0;
  const scanFocus=scanStart?Math.min(2,Math.floor(scan*3)):-1;
  root.style.setProperty('--scan-alpha',scanStart?String(Math.sin(scan*Math.PI)*.55):'0');root.style.setProperty('--scan-y',`${scan*base.height*.65}px`);
  geometry=rows.map((r,i)=>{
   const {a,b}=points[i],reveal=reveals[i],active=scanFocus>=0?scanFocus===i:focus===i;
   const dx=b.x-a.x,bend=Math.min(b.x-14,a.x+Math.max(12,dx*.5));
   const d=`M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${(a.x+Math.max(7,dx*.16)).toFixed(2)} ${a.y.toFixed(2)} L${bend.toFixed(2)} ${b.y.toFixed(2)} L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
   r.group.style.opacity=reveal>0?String((active?1:.45)*Math.min(1,reveal*2)):'0';
   [r.line,r.glow].forEach(p=>{p.setAttribute('d',d);p.style.strokeDasharray='1';p.style.strokeDashoffset=String(1-reveal);});
   r.origin.setAttribute('cx',a.x);r.origin.setAttribute('cy',a.y);r.end.setAttribute('x',b.x-3);r.end.setAttribute('y',b.y-3);r.end.style.opacity=String(clamp((reveal-.75)*4));
   r.origin.setAttribute('r',active?4:3);
   if(reveal>0&&reveal<.999){const point=r.line.getPointAtLength(r.line.getTotalLength()*reveal);r.head.setAttribute('x',point.x-2);r.head.setAttribute('y',point.y-2);r.head.style.opacity='1';}else r.head.style.opacity='0';
   if(scanFocus>=0){r.callout.setAttribute('aria-pressed',String(active));r.plane.dataset.active=String(active);}
   else{r.callout.setAttribute('aria-pressed',String(active&&reveal>0));r.plane.dataset.active=String(active&&reveal>0);}
   return {kind:r.kind,reveal,anchor:a,endpoint:b,path:d,visible:reveal>.015};
  });
  frames++;root.dataset.rendered=String(frames);
  const scrubActive=allowed()&&window.ScrollTrigger?.getAll().some(st=>st.getTween?.()?.isActive());
  if((now<until&&allowed())||scanStart||scrubActive)raf=requestAnimationFrame(draw);
 }
 function queue(ms=900){
  if(document.hidden||!inside)return;
  until=Math.max(until,performance.now()+(allowed()?ms:0));if(!raf)raf=requestAnimationFrame(draw);
 }
 const visible=()=>{const r=view.getBoundingClientRect();inside=r.bottom>-100&&r.top<innerHeight+100;};
 document.addEventListener('holymind:assembly',e=>apply(e.detail?.expanded??slider.value));
 document.addEventListener('holymind:motion',()=>{scanStart=0;until=0;apply(amount,false);queue();});
 addEventListener('scroll',()=>{visible();queue();},{passive:true});
 addEventListener('resize',()=>{visible();queue(1200);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;scanStart=0;}else{visible();queue();}});
 addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;scanStart=0;});addEventListener('pageshow',()=>{visible();queue();});
 root.querySelector('.assembly-guide').addEventListener('toggle',()=>{window.ScrollTrigger?.refresh();queue();});
 if(window.IntersectionObserver)new IntersectionObserver(es=>{inside=es[0].isIntersecting;if(inside)queue();else{if(raf)cancelAnimationFrame(raf);raf=0;scanStart=0;}},{rootMargin:'100px'}).observe(view);
 if(window.ResizeObserver)new ResizeObserver(()=>{visible();queue();}).observe(view);
 window.ScrollTrigger?.addEventListener('refresh',()=>{visible();queue(1000);});
 document.fonts?.ready.then(()=>queue());
 root.dataset.assemblyReady='true';slider.disabled=false;visible();apply(amount,false);
 window.HolyMindAssembly=Object.freeze({version:'exploded-v7',snapshot:()=>({value:amount,assembled:100-amount,reveals:[...reveals],focus,inside,running:!!raf,frames,geometry:geometry.map(g=>({...g}))})});
})();
