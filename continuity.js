/* Continuous Mind v6. The same visual carrier, not independent reveal animations.
 * Position, morphology and trail are pure functions of scroll position: fully reversible.
 * Existing scene transforms are read, never overwritten. No scroll interception.
 */
(() => {
 'use strict';
 const main=document.querySelector('main'),body=document.body;
 if(!main)return;
 if(!window.gsap||!window.ScrollTrigger){body.dataset.continuity='static';return;}
 const ns='http://www.w3.org/2000/svg',clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t);
 const small=()=>innerWidth<=680;
 const q=s=>document.querySelector(s);
 const layer=document.createElement('div');layer.className='continuity-layer';layer.setAttribute('aria-hidden','true');
 layer.innerHTML=`<svg class="continuity-field" xmlns="${ns}"><path class="continuity-wire"/><path class="continuity-shadow"/><path class="continuity-current"/><g class="continuity-dock"><path class="continuity-receiver"/></g><g class="continuity-carrier"><path class="continuity-echo"/><path class="continuity-form"/><path class="continuity-facet"/><image class="continuity-glyph" href="assets/skills/the-crystallizer.webp" x="-28" y="-28" width="56" height="56" opacity="0"/><image class="continuity-glyph-next" href="assets/skills/the-crystallizer.webp" x="-28" y="-28" width="56" height="56" opacity="0"/><path class="continuity-core"/><g class="continuity-satellites"><path class="continuity-fragment"/><path class="continuity-fragment"/><path class="continuity-fragment"/></g></g></svg><div class="continuity-brain"><img src="assets/brain.webp" alt="" width="960" height="960"><canvas class="neural-transit-sparks" width="480" height="480"></canvas></div>`;
 body.appendChild(layer);
 const field=layer.querySelector('svg'),wire=layer.querySelector('.continuity-wire'),current=layer.querySelector('.continuity-current'),shadow=layer.querySelector('.continuity-shadow');
 const carrier=layer.querySelector('.continuity-carrier'),form=layer.querySelector('.continuity-form'),echo=layer.querySelector('.continuity-echo'),facet=layer.querySelector('.continuity-facet');
 const core=layer.querySelector('.continuity-core'),glyph=layer.querySelector('.continuity-glyph'),nextGlyph=layer.querySelector('.continuity-glyph-next'),receiver=layer.querySelector('.continuity-receiver');
 const satellites=[...layer.querySelectorAll('.continuity-fragment')],brain=layer.querySelector('.continuity-brain');
 const origin=q('.neural-core'),orbitImage=q('.orbit-brain'),ribbonImage=q('.band-one .signal-word img'),assemblyImage=q('#assembly-skill');
 let transferMode='none';
 function mute(mode){if(mode===transferMode)return;transferMode=mode;const targets=mode==='brain'?[origin,orbitImage]:mode==='crystal'?[ribbonImage,assemblyImage]:[];[origin,orbitImage,ribbonImage,assemblyImage].forEach(el=>el?.classList.toggle('continuity-transferred',targets.includes(el)));}
 const diamond=[[0,-1],[.5,-.5],[1,0],[.5,.5],[0,1],[-.5,.5],[-1,0],[-.5,-.5]];
 const octagon=[[-.42,-1],[.42,-1],[1,-.42],[1,.42],[.42,1],[-.42,1],[-1,.42],[-1,-.42]];
 const plate=[[-1,-.72],[.72,-.72],[1,-.45],[1,.45],[.72,.72],[-.72,.72],[-1,.45],[-1,-.45]];
 // Each station belongs to an existing artifact. Small mid-scene waypoints keep the
 // traveling object in the outer margin while long, optional galleries scroll past.
 const stations=[
  {id:'neural',s:'.neural-core',x:.50,y:.46,shape:diamond,w:10,h:10,angle:0,spread:0,hold:0},
  {id:'orbit',s:'.orbit-stage',x:.50,y:.50,shape:octagon,w:32,h:32,angle:45,spread:28,hold:200},
  {id:'ribbon',s:'.band-one .signal-word img',x:.50,y:.50,shape:diamond,w:26,h:14,angle:-6,spread:14,hold:35},
  {id:'assembly',s:'#assembly-skill',x:.50,y:.50,shape:plate,w:60,h:34,angle:-26,spread:50,hold:130},
  {id:'system',s:'.bench-footer',x:.98,y:.30,shape:plate,w:18,h:13,angle:0,spread:14,hold:25},
  {id:'skills',s:'.deck-shard[aria-pressed=true] .shard-surface',x:.50,y:.50,shape:plate,w:60,h:80,angle:0,spread:38,hold:130},
  {id:'gallery',s:'.atlas-bottom',x:.98,y:.10,shape:diamond,w:18,h:18,angle:0,spread:18,hold:25},
  {id:'services',s:'.approach-intro>img',x:.50,y:.50,shape:octagon,w:60,h:60,angle:45,spread:30,hold:100},
  {id:'delivery',s:'.approach-list details:last-child .service-art',x:.50,y:.50,shape:plate,w:48,h:48,angle:45,spread:25,hold:45},
  {id:'signature',s:'.signature-period',x:.5,y:.72,shape:diamond,w:7,h:7,angle:0,spread:0,hold:110},
  {id:'portal',s:'.contact-portal',x:.50,y:.50,shape:octagon,w:150,h:150,angle:0,spread:68,hold:0}
 ];
 let keys=[],raf=0,until=0,needsMeasure=true,lastY=scrollY,restored=false;
 const enabled=()=>body.dataset.motion==='on'&&!document.hidden;
 const svgPath=points=>points.map((v,i)=>`${i?'L':'M'}${v[0].toFixed(2)} ${v[1].toFixed(2)}`).join(' ')+'Z';
 const diamondPath=(x,y,r)=>`M${x} ${y-r}l${r} ${r}l${-r} ${r}l${-r} ${-r}Z`;
 // offset geometry avoids measuring our own overlays and ignores scene transforms.
 function layoutTop(el){let top=0;for(let node=el;node;node=node.offsetParent)top+=node.offsetTop;return top;}
 function viewPoint(station){
  const el=q(station.s);if(!el)return {x:innerWidth/2,y:innerHeight/2};
  const r=el.getBoundingClientRect();return {x:r.left+r.width*station.x,y:r.top+r.height*station.y};
 }
 function measure(){
  needsMeasure=false;
  const H=innerHeight,max=Math.max(1,document.documentElement.scrollHeight-H);
  const assemblyPin=window.ScrollTrigger?.getById('assembly-story');
  stations.forEach(st=>{
   const el=q(st.s);st.at=el?layoutTop(el)+el.offsetHeight*st.y-H*.56:0;
   if(st.id==='neural')st.at=0;
   if(st.id==='assembly'&&assemblyPin)st.at=assemblyPin.start;
   if(st.id==='orbit'){const section=q('#mind-flow');st.at=layoutTop(section)+Math.min(200,H*.2);}
   if(st.id==='skills'){const stage=q('.deck-stage');st.at=layoutTop(stage)+stage.offsetHeight*.46-H*.56;}
   if(st.id==='signature'){const sculpture=q('.signature-sculpture');st.at=layoutTop(sculpture)+sculpture.offsetHeight*.65-H*.56;}
   st.at=clamp(st.at,0,max);
  });
  // Responsive compositions are allowed to differ in height, never in story order.
  for(let i=1;i<stations.length;i++)stations[i].at=Math.max(stations[i].at,stations[i-1].at+50);
  keys=[];
  stations.forEach((st,i)=>{
   keys.push({at:st.at,station:st});
   if(i===stations.length-1)return;
   let end=st.at+st.hold;
   if(st.id==='assembly'&&assemblyPin)end=assemblyPin.end;
   if(st.id==='neural')end=Math.max(0,layoutTop(origin)+origin.offsetHeight*.46-H*.56);
   if(st.id==='orbit')end=layoutTop(q('#mind-flow'))+q('#mind-flow').offsetHeight-H*.83;
   end=clamp(end,st.at,stations[i+1].at-40);
   if(end>st.at+1)keys.push({at:end,station:st});
  });
  field.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
  layer.dataset.stations=String(stations.length);layer.dataset.measuredHeight=String(document.documentElement.scrollHeight);
 }
 function restore(){
  mute('none');
  brain.style.visibility='hidden';window.HolyMindNeural?.transport(false);restored=true;
 }
 function routePoint(a,c1,c2,b,t){const edge=Math.sin(Math.PI*t)**2;return {x:lerp(lerp(a.x,b.x,t),c1.x,edge),y:lerp(a.y,b.y,t)};}
 function curve(a,b,from,to){
  // Route between pieces via free page margins, not across reading columns.
  const right=small()||['assembly','system','skills','gallery','services','signature'].includes(from.id);
  const lane=right?innerWidth-(small()?24:42):(small()?24:42);
  return [a,{x:lane,y:innerHeight*.32},{x:lane,y:innerHeight*.70},b];
 }
 function polyline(curve,start,end,steps=32){
  let path='';for(let i=0;i<=steps;i++){const v=routePoint(...curve,lerp(start,end,i/steps));const x=Math.round(v.x/2)*2,y=Math.round(v.y/2)*2;path+=`${i?'L':'M'}${x} ${y} `;}return path;
 }
 function sharedBrain(a,b,p){
  const source=q('.neural-stage').getBoundingClientRect(),target=orbitImage.getBoundingClientRect();
  const src={x:source.left+source.width/2,y:source.top+source.height/2},dst={x:target.left+target.width/2,y:target.top+target.height/2};
  const t=smooth(p),flight=Math.sin(Math.PI*t)**2;
  const x=lerp(lerp(src.x,dst.x,t),innerWidth-(small()?44:70),flight*.96),y=lerp(src.y,dst.y,t)+flight*innerHeight*.06;
  const scale=Number(window.gsap?.getProperty(orbitImage,'scaleX'))||1;
  const width=lerp(lerp(origin.clientWidth,orbitImage.clientWidth*scale,t),small()?78:148,flight);
  const startAngle=Number(window.gsap?.getProperty(q('.neural-stage'),'rotation'))||0;
  const endAngle=Number(window.gsap?.getProperty(orbitImage,'rotation'))||0;
  brain.style.width=`${width}px`;brain.style.height=`${width}px`;
  brain.style.transform=`translate3d(${x-width/2}px,${y-width/2}px,0) rotate(${lerp(startAngle,endAngle,t)}deg)`;
  brain.style.visibility='visible';window.HolyMindNeural?.transport(true);
  mute('brain');restored=false;
  const trace=(start,end)=>{let d='';for(let j=0;j<=30;j++){const v=lerp(start,end,j/30),f=Math.sin(Math.PI*v)**2,px=lerp(lerp(src.x,dst.x,v),innerWidth-(small()?44:70),f*.96),py=lerp(src.y,dst.y,v)+f*innerHeight*.06;d+=`${j?'L':'M'}${Math.round(px/2)*2} ${Math.round(py/2)*2} `;}return d;};
  return {x,y,wire:trace(0,1),lit:trace(Math.max(0,t-.13),Math.min(1,t+.02))};
 }
 function render(){
  raf=0;
  if(!enabled()){layer.style.visibility='hidden';restore();body.dataset.continuity='paused';return;}
  if(needsMeasure)measure();if(!keys.length)return;
  layer.style.visibility='visible';body.dataset.continuity='ready';
  const y=clamp(scrollY,0,document.documentElement.scrollHeight-innerHeight);
  let i=0;while(i<keys.length-2&&y>keys[i+1].at)i++;
  const ka=keys[i],kb=keys[i+1]||ka,a=ka.station,b=kb.station;
  const p=ka===kb?1:clamp((y-ka.at)/Math.max(1,kb.at-ka.at)),t=smooth(p),same=a.id===b.id;
  const A=viewPoint(a),B=viewPoint(b),path=curve(A,B,a,b);
  let pos=same?A:routePoint(...path,t);
  const brainTransit=a.id==='neural'&&b.id==='orbit'&&p>0&&p<1;
  const glyphTransfer=a.id==='ribbon'&&b.id==='assembly'&&p>0&&p<1;
  if(!brainTransit)window.HolyMindNeural?.transport(false);
  if(brainTransit)pos=sharedBrain(A,B,p);else if(glyphTransfer){mute('crystal');brain.style.visibility='hidden';restored=false;}else if(!restored)restore();
  
  // The original brain arrives intact; a luminous shard then carries its intent onward.
  carrier.style.opacity=brainTransit?'0':String(a.id==='neural'?.5:1);
  const travel=same?0:Math.sin(Math.PI*p),factor=small()?.62:1;
  const w=lerp(lerp(a.w,b.w,t)*factor,small()?13:22,travel**2),h=lerp(lerp(a.h,b.h,t)*factor,small()?13:22,travel**2);
  const angle=lerp(a.angle,b.angle,t)+(same?0:travel*54);
  const pts=a.shape.map((v,j)=>[lerp(v[0],b.shape[j][0],t)*w,lerp(v[1],b.shape[j][1],t)*h]);
  form.setAttribute('d',svgPath(pts));echo.setAttribute('d',svgPath(pts.map(v=>[v[0]*1.18,v[1]*1.18])));
  facet.setAttribute('d',`M${pts[0][0]} ${pts[0][1]}L0 0L${pts[2][0]} ${pts[2][1]}M0 0L${pts[4][0]} ${pts[4][1]}`);
  carrier.setAttribute('transform',`translate(${pos.x.toFixed(3)} ${pos.y.toFixed(3)}) rotate(${angle.toFixed(3)})`);
  core.setAttribute('d',diamondPath(0,0,small()?3:4.5));
  const spread=lerp(lerp(a.spread,b.spread,t)*factor,small()?17:29,travel**2);
  satellites.forEach((s,j)=>{const rad=(j*120-90+travel*90)*Math.PI/180;s.setAttribute('d',diamondPath(Math.cos(rad)*spread,Math.sin(rad)*spread,small()?1.8:2.8));});
  // The ribbon's original crystallizer travels into the system's intention plane.
  if(glyphTransfer){
   const from=ribbonImage.getBoundingClientRect(),to=assemblyImage.getBoundingClientRect(),compact=travel**2;
   const gw=lerp(lerp(from.width,to.width,t),small()?34:50,compact),gh=lerp(lerp(from.height,to.height,t),small()?34:50,compact);
   [glyph,nextGlyph].forEach(el=>{el.setAttribute('x',String(-gw/2));el.setAttribute('y',String(-gh/2));el.setAttribute('width',String(gw));el.setAttribute('height',String(gh));el.setAttribute('preserveAspectRatio','none');});
   const href=assemblyImage.getAttribute('src');if(nextGlyph.getAttribute('href')!==href)nextGlyph.setAttribute('href',href);
   glyph.setAttribute('opacity',String(1-t));nextGlyph.setAttribute('opacity',String(t));
  }else{glyph.setAttribute('opacity','0');nextGlyph.setAttribute('opacity','0');}
  core.style.opacity=glyphTransfer?'0':'1';
  const showWire=!same&&!brainTransit&&p>.002&&p<.998;
  wire.setAttribute('d',brainTransit?pos.wire:showWire?polyline(path,0,1):'');
  const segment=brainTransit?pos.lit:showWire?polyline(path,Math.max(0,t-.14),Math.min(1,t+.025),15):'';
  current.setAttribute('d',segment);shadow.setAttribute('d',segment);
  const arrival=showWire?Math.max(0,(p-.70)/.30):0;
  const dock=same?1:1-Math.min(1,Math.sin(Math.PI*p)*3);
  layer.style.setProperty('--carrier-accent',`rgb(${Math.round(lerp(103,242,dock))} ${Math.round(lerp(232,204,dock))} ${Math.round(lerp(249,143,dock))})`);
  receiver.setAttribute('d',arrival?diamondPath(B.x,B.y,(18+22*(1-arrival))*factor):'');
  receiver.style.opacity=String(arrival*.6);
  window.HolyMindEnergy?.receive({from:a.id,to:b.id,progress:p,same,x:pos.x,y:pos.y,brainTransit});
  layer.dataset.from=a.id;layer.dataset.to=b.id;layer.dataset.progress=p.toFixed(5);
  layer.dataset.x=pos.x.toFixed(3);layer.dataset.y=pos.y.toFixed(3);
  layer.dataset.direction=y<lastY?'reverse':y>lastY?'forward':layer.dataset.direction||'forward';lastY=y;
  // Stop after the existing GSAP scrub settles. No idle animation loop is added.
  const scrubActive=window.ScrollTrigger?.getAll().some(st=>st.getTween?.()?.isActive());
  if(performance.now()<until||scrubActive)raf=requestAnimationFrame(render);
 }
 function queue(ms=850){until=Math.max(until,performance.now()+ms);if(!raf)raf=requestAnimationFrame(render);}
 function refresh(){needsMeasure=true;queue();}
 document.addEventListener('holymind:motion',()=>{restore();refresh();});
 addEventListener('scroll',()=>queue(),{passive:true});
 addEventListener('resize',refresh,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;restore();layer.style.visibility='hidden';}else refresh();});
 addEventListener('pageshow',refresh);
 addEventListener('pagehide',()=>{if(raf)cancelAnimationFrame(raf);raf=0;restore();});
 document.addEventListener('click',()=>queue());document.addEventListener('input',()=>queue());
 document.addEventListener('holymind:step',()=>queue());
 document.fonts?.ready.then(refresh);
 if(window.ScrollTrigger)window.ScrollTrigger.addEventListener('refresh',refresh);
 if(window.ResizeObserver){const observer=new ResizeObserver(refresh);observer.observe(main);}
 // Read-only diagnostics make reversal and geometry testable without driving state.
 window.HolyMindContinuity=Object.freeze({version:'spark-v8',snapshot:()=>({stations:stations.map(s=>({id:s.id,at:s.at})),keys:keys.map(k=>({id:k.station.id,at:k.at})),state:body.dataset.continuity,renderedScrollY:lastY,from:layer.dataset.from,to:layer.dataset.to,progress:Number(layer.dataset.progress),x:Number(layer.dataset.x),y:Number(layer.dataset.y),running:!!raf})});
 refresh();
})();
