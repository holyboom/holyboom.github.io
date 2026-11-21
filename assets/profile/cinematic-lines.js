/* Finite cinematic accents. Geometry is pure; the existing page ticker owns time.
   The maker/camera remain scroll-driven. This local reaction is deliberately not
   a second, supposedly reversible simulation of the person's performance. */
(function(root){'use strict';
 const NS='http://www.w3.org/2000/svg',TAU=Math.PI*2,DURATION=4.6;
 const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
 const kinds=['potential','drawing','assembly','tributaries','boundary','tension','distillation','clarity','opening','echoes','invitation'];
 function cueFor(chapter,shot={}){
  let kind=kinds[chapter]||'invitation';
  if(chapter===5)kind=shot.prop==='repair'?'repair':shot.prop==='remnant'?'doubt':shot.pose==='rise'?'recovery':'tension';
  if(chapter===6&&shot.prop==='moat')kind='moat';
  // Dramatic/craft beats earn individual moments; other sections play once.
  return {key:chapter+':'+([5,6].includes(chapter)?shot.index:'entry'),chapter,kind,review:shot.prop==='review'||chapter===4};
 }
 function stateAt(phase){
  phase=clamp(phase);return {phase,visibility:smooth(phase/.075)*(1-smooth((phase-.82)/.18)),charge:Math.sin(Math.PI*clamp(phase/.22))**2,travel:smooth((phase-.27)/.38),flight:smooth((phase-.24)/.05)*(1-smooth((phase-.67)/.08)),impact:smooth((phase-.70)/.07)*(1-smooth((phase-.84)/.16)),transform:smooth((phase-.12)/.57)};
 }
 const pt=(c,r,a,ratio=.64)=>[c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r*ratio];
 function path(points){if(points.length<2)return '';return 'M'+points[0].join(' ')+'C'+points.slice(1).map(p=>p.join(' ')).join(' ');}
 function softPath(points){if(points.length<2)return '';let d='M'+points[0].join(' ');for(let i=1;i<points.length-1;i++)d+='Q'+points[i].join(' ')+' '+[(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2].join(' ');return d+'L'+points.at(-1).join(' ');}
 function compose(frame,phase,cue){
  const s=stateAt(phase),paths=[],particles=[],flares=[],color=frame.accent||'#c398ff',warm='#ffd394',cool='#78dafa';
  if(!s.visibility)return {paths,particles,flares,state:s,kind:cue.kind};
  // When the portrait/open invitation has no solid prop, light belongs to the
  // actual hand source. This small aura is not presented as a component edge.
  const contour=frame.contour.length?frame.contour:Array.from({length:37},(_,i)=>pt(frame.origin,18,i/36*TAU,.75));
  const center=[0,1].map(k=>contour.reduce((n,p)=>n+p[k],0)/contour.length),r=Math.max(frame.compact?18:28,Math.min(frame.compact?44:78,Math.max(...[0,1].map(k=>(Math.max(...contour.map(p=>p[k]))-Math.min(...contour.map(p=>p[k])))*.5))));
  const local=frame.region,fit=p=>[Math.max(local.left+4,Math.min(local.right-4,p[0])),Math.max(local.top+4,Math.min(local.bottom-4,p[1]))];
  const add=(points,alpha=.6,tone=color,width=1.1,extra={})=>paths.push({d:softPath(points.map(fit)),alpha:alpha*s.visibility,tone,width,...extra});
  const particle=(p,alpha,size=1.4,tone=warm,role='local')=>particles.push({p:fit(p),alpha:alpha*s.visibility,size,tone,role});
  const rim=contour.map(p=>[mix(center[0],p[0],1.04),mix(center[1],p[1],1.04)]);
  if(!frame.quietSource)paths.push({d:softPath(rim),alpha:(.2+s.charge*.65)*s.visibility,tone:cue.review?warm:color,width:1.6,dash:[.08+s.transform*.8,1],offset:0});
  for(let j=0;j<(frame.quietSource?0:frame.compact?4:6);j++){
   const points=[],side=j%2?-1:1,spread=(j+1)/6;
   for(let i=0;i<=36;i++){
    const u=i/36,a=u*TAU+j*.63;let p;
    switch(cue.kind){
     case 'drawing':{const q=contour[Math.min(contour.length-1,Math.floor(u*(contour.length-1)*smooth(s.phase/.58)))];p=[q[0]+side*(1-s.transform)*r*.5* Math.sin(Math.PI*u),q[1]-(1-s.transform)*spread*r*.8];break;}
     case 'assembly':{const q=pt(center,r*(.65+spread*.85)*(1-s.transform*.32),a,.4+spread*.15);p=[q[0],q[1]-(1-s.transform)*r*(1+spread)+Math.sin(Math.PI*u)*r*.15];break;}
     case 'tributaries':p=[center[0]-(1-u)*r*(1.7+spread),center[1]+side*Math.sin(Math.PI*u)*r*(.45+spread)*(1-s.transform*.4)];break;
     case 'boundary':p=[frame.origin[0]-8-(1-u)*r*(1.4+spread),frame.origin[1]+side*Math.sin(Math.PI*u)*r*(.35+spread*.6)];break;
     case 'tension':case 'doubt':{const pull=Math.sin(Math.PI*s.transform),radius=r*(.7+u*(1.7+pull*.8));p=pt(center,radius,j*TAU/6+Math.sin(u*Math.PI)*(.4-pull*.65),.72);break;}
     case 'repair':case 'recovery':{const radius=r*(.32+(1-u)*(1.6-s.transform*.8));p=pt(center,radius,j*TAU/6+u*2.6-s.transform,.72);break;}
     case 'distillation':case 'moat':{const radius=r*(.6+(1-u)*(1.8-s.transform));p=pt(center,radius,a*.7+j*.55+s.transform*.6,.72);break;}
     case 'clarity':p=[center[0]+(u-.5)*r*3,center[1]+Math.sin(u*Math.PI*2+j*.6)*r*(1-s.transform)*spread];break;
     case 'opening':{const radius=r*(.2+Math.sin(Math.PI*u)*(1.2+s.transform*.8));p=pt(center,radius,j*TAU/6+(u-.5)*.7,.78);break;}
     case 'echoes':{const q=contour[Math.round(u*(contour.length-1))],depth=Math.sin(Math.PI*s.transform)*j*.22;p=[q[0]+r*depth,q[1]-r*depth*.6];break;}
     default:{p=pt(center,r*(.6+spread+s.transform*.4),Math.PI*.15+u*Math.PI*1.25+j*.22,.64);break;}
    }
    points.push(p);
   }
   add(points,(cue.kind==='doubt'?.18:.34)*(1-j*.07),cue.review?warm:j%3===0?cool:color,j===0?1.5:.8,{dash:[.18+.67*s.transform,1],offset:-s.phase*.15});
  }
  // A bounded dust family carries pressure out, or selected material inward.
  const inward=['distillation','repair','recovery','moat'].includes(cue.kind);
  for(let i=0;i<(frame.quietSource?0:frame.compact?14:24);i++){
   const dustAge=smooth((s.phase-.14-(i%5)*.012)/(.58+(i%3)*.04)),a=i*2.399963+cue.chapter*.7,seed=.5+((i*17)%29)/29;
   const rimPoint=contour[(i*7)%contour.length],far=pt(center,r*(1.6+seed),a+dustAge*(inward?-.65:.3),.78),u=inward?1-dustAge:dustAge;
   let p=[mix(rimPoint[0],far[0],u),mix(rimPoint[1],far[1],u)];p[1]+=inward?0:dustAge*dustAge*r*.38;
   if(cue.review)p=[frame.origin[0]-10-r*(1-dustAge)*(1+seed),frame.origin[1]+Math.sin(a)*r*.5];
   particle(p,Math.sin(Math.PI*dustAge)**1.2*(cue.kind==='doubt'?.2:.65),i%4===0?1.9:1.05,cue.review?warm:i%4===0?cool:warm);
  }
  // One new travelling ribbon, then a small receiver response. It follows the
  // already measured route and never invents a destination in empty space.
  const ribbonAt=u=>{const p=frame.sample(u),a=frame.sample(u-.01),b=frame.sample(u+.01),dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1,frequency=cue.kind==='tributaries'?2:cue.kind==='clarity'?.5:1,offset=Math.sin(Math.PI*u)*Math.sin(u*TAU*frequency-s.phase*3)*(frame.compact?4:8)*(1-s.transform*.5);return [p[0]-dy/n*offset,p[1]+dx/n*offset];};
  const ribbon=Array.from({length:49},(_,i)=>ribbonAt(i/48));
  paths.push({d:softPath(ribbon),alpha:s.flight*.46,tone:color,width:1.35,dash:[.18,.82],offset:-s.travel});
  for(let i=0;i<7;i++){const u=clamp(s.travel-i*.017),p=ribbonAt(u);particles.push({p,alpha:s.flight*(1-i/8),size:i?1.5:2.6,tone:i?color:'#fff2d5',role:'transfer'});}
  // The original B study's missing optical layer: a visible charge, a moving
  // light, then a receiver bloom. Local falloff, never a full-screen flash.
  const launch=Math.sin(Math.PI*clamp((phase-.24)/.20))**2;
  const smallSource=frame.quietSource||(frame.compact&&String(frame.componentId||'').startsWith('work-28-vessel-'));
  flares.push({p:frame.origin,radius:(frame.compact?34:58)*(1+s.charge*.48)*(smallSource ? .65 : 1),alpha:s.visibility*(s.charge*.95+launch*.42)*(smallSource ? .75 : 1),core:2+s.charge*3.8,tone:cue.review?warm:color,role:'source'});
  flares.push({p:ribbonAt(s.travel),radius:frame.compact?17:24,alpha:s.flight*.68,core:2.5,tone:warm,role:'transfer'});
  flares.push({p:frame.endpoint,radius:frame.compact?26:38,alpha:s.impact*.64,core:1+s.impact*3,tone:color,role:'receiver'});
  if(s.charge>.02&&!frame.quietSource){const p=frame.origin,size=(frame.compact?12:20)*(1+s.charge*.6);for(const [x,y]of [[size,0],[0,size*.65]])paths.push({d:path([[p[0]-x,p[1]-y],[p[0]-x*.25,p[1]-y*.25],[p[0]+x*.25,p[1]+y*.25],[p[0]+x,p[1]+y]]),alpha:s.charge*s.visibility*.85,tone:'#fff2dc',width:1.1});}
  if(s.impact>0){const end=frame.endpoint;paths.push({d:path([[end[0]-4,end[1]+2],[end[0]-18,end[1]-8*s.impact],[end[0]-32,end[1]-8*s.impact],[end[0]-50,end[1]+2]]),alpha:s.impact*.8,tone:color,width:1.4});}
  return {paths,particles,flares,state:s,kind:cue.kind,center,radius:r};
 }
 function controller(){
  let key=null,candidate=null,candidateAge=0,age=DURATION,events=0,cue=null;
  return {step(next,dt,available){
   if(!available){age=DURATION;candidate=null;candidateAge=0;return null;}
   if(next.key!==key){age=DURATION;if(candidate!==next.key){candidate=next.key;candidateAge=0;}candidateAge+=dt;if(candidateAge>=.12){key=next.key;cue=next;age=0;events++;candidate=null;candidateAge=0;}}
   else {candidate=null;candidateAge=0;age=Math.min(DURATION,age+dt);}
   return cue&&age<DURATION?{phase:age/DURATION,cue}:null;
  },pending:()=>candidate!==null||age<DURATION,snapshot:()=>({key,kind:cue?.kind||null,age,active:age<DURATION,pending:candidate!==null,events,duration:DURATION})};
 }
 function create(svg){
  const group=document.createElementNS(NS,'g');group.classList.add('cinematic-lines');group.setAttribute('aria-hidden','true');svg.appendChild(group);
  const defs=document.createElementNS(NS,'defs');group.appendChild(defs);
  const clip=document.createElementNS(NS,'clipPath'),clipRect=document.createElementNS(NS,'rect');clip.id='cinematic-source-clip';clip.appendChild(clipRect);defs.appendChild(clip);
  const lamps=Array.from({length:3},(_,i)=>{const gradient=document.createElementNS(NS,'radialGradient');gradient.id='cinematic-bloom-'+i;defs.appendChild(gradient);const stops=[[0,'#fff6e4',.96],[.10,'#ffe1a8',.72],[.30,'#c398ff',.26],[1,'#c398ff',0]].map(([offset,color,alpha])=>{const stop=document.createElementNS(NS,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);stop.setAttribute('stop-opacity',alpha);gradient.appendChild(stop);return stop;});const bloom=document.createElementNS(NS,'circle'),core=document.createElementNS(NS,'circle');bloom.setAttribute('fill','url(#'+gradient.id+')');core.setAttribute('fill','#fff4db');group.appendChild(bloom);group.appendChild(core);if(i===0){bloom.setAttribute('clip-path','url(#cinematic-source-clip)');core.setAttribute('clip-path','url(#cinematic-source-clip)');}return {bloom,core,stops};});
  const make=(tag,n)=>Array.from({length:n},()=>{const el=document.createElementNS(NS,tag);group.appendChild(el);return el;}),lines=make('path',14),grains=make('circle',32),clock=controller();
  let lastFrame=null,paint=null,updates=0,lastState={active:false};
  const clear=()=>{group.style.display='none';paint=null;};
  return {setFrame:frame=>{lastFrame=frame;},advance(dt,cue,enabled=true){
   const frame=lastFrame,available=!!(enabled&&frame&&frame.target.index===cue.chapter),event=clock.step(cue,dt,available);
   if(!event){clear();lastState={...clock.snapshot(),active:false};return;}
   paint=compose(frame,event.phase,event.cue);group.style.display='';group.dataset.kind=event.cue.kind;
   const bounds=frame.region;for(const [k,v]of Object.entries({x:bounds.left,y:bounds.top,width:Math.max(0,bounds.right-bounds.left),height:Math.max(0,bounds.bottom-bounds.top)}))clipRect.setAttribute(k,v);
   lamps.forEach((lamp,i)=>{const flare=paint.flares[i];for(const node of [lamp.bloom,lamp.core])node.style.display=flare?'':'none';if(!flare)return;for(const node of [lamp.bloom,lamp.core]){node.setAttribute('cx',flare.p[0]);node.setAttribute('cy',flare.p[1]);node.setAttribute('opacity',flare.alpha);}lamp.bloom.setAttribute('r',flare.radius);lamp.core.setAttribute('r',flare.core);for(const stop of lamp.stops.slice(2))stop.setAttribute('stop-color',flare.tone);});
   lines.forEach((node,i)=>{const item=paint.paths[i];node.style.display=item?'':'none';if(!item)return;node.setAttribute('d',item.d);node.setAttribute('stroke',item.tone);node.setAttribute('stroke-width',item.width);node.setAttribute('opacity',item.alpha);node.setAttribute('pathLength','1');node.setAttribute('stroke-dasharray',item.dash?.join(' ')||'none');node.setAttribute('stroke-dashoffset',item.offset||0);});
   grains.forEach((node,i)=>{const item=paint.particles[i];node.style.display=item?'':'none';if(!item)return;node.setAttribute('cx',item.p[0]);node.setAttribute('cy',item.p[1]);node.setAttribute('r',item.size);node.setAttribute('fill',item.tone);node.setAttribute('opacity',item.alpha);node.dataset.role=item.role;});
   updates++;lastState={...clock.snapshot(),phase:event.phase,source:frame.origin,target:frame.endpoint,componentId:frame.componentId,localBounds:frame.region,flares:paint.flares,particles:paint.particles.filter(p=>p.alpha>.01).map(p=>({p:p.p,role:p.role}))};
  },pending:clock.pending,hide(){clock.step({},0,false);lastFrame=null;clear();lastState={...clock.snapshot(),active:false};},snapshot:()=>({...lastState,updates})};
 }
 const api={DURATION,cueFor,stateAt,compose,controller,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileCinematicLines=api;
})(typeof globalThis!=='undefined'?globalThis:this);
