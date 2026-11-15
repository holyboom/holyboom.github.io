/* One scroll-driven filament carries attention from the maker to actual text.
   Geometry reads and SVG writes are separated; there is no independent ticker. */
(function(root){'use strict';
 const NS='http://www.w3.org/2000/svg',clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t;
 const smooth=v=>{v=clamp(v);return v*v*(3-2*v);},TAU=Math.PI*2;
 const cubic=(s,t)=>[0,1].map(i=>(1-t)**3*s[0][i]+3*(1-t)**2*t*s[1][i]+3*(1-t)*t*t*s[2][i]+t**3*s[3][i]);
 function route(source,target,gutter,compact,bottom=Infinity){
  const [sx,sy]=source,[tx,ty]=target;
  const elbow=compact?[gutter,sy+Math.min(48,Math.max(18,(ty-sy)*.20))]:[gutter,Math.min(bottom,sy+84)];
  let segments;
  if(compact)segments=[[source,[sx,sy+26],[gutter,sy+34],elbow],[elbow,[gutter,mix(elbow[1],ty,.42)],[gutter,ty],target]];
  else {
   const direction=Math.sign(elbow[1]-ty)||1,r=Math.min(24,Math.abs(elbow[1]-ty)*.4,Math.max(0,gutter-tx)*.5),vertical=[gutter,ty+direction*r],corner=[gutter-r,ty],k=.55228475;
   segments=[[source,[sx+14,mix(sy,elbow[1],.85)],[gutter,elbow[1]-Math.sign(ty-elbow[1])*24],elbow],
    [elbow,[gutter,mix(elbow[1],vertical[1],.33)],[gutter,mix(elbow[1],vertical[1],.67)],vertical],
    [vertical,[gutter,ty+direction*r*(1-k)],[gutter-r*(1-k),ty],corner],
    [corner,[mix(corner[0],tx,.33),ty],[mix(corner[0],tx,.67),ty],target]];
  }
  return {segments,d:'M'+source.join(' ')+segments.map(s=>'C'+s.slice(1).map(p=>p.join(' ')).join(' ')).join(' ')};
 }
 function sampleRoute(geometry){
  const points=geometry.segments.flatMap((s,j)=>Array.from({length:33},(_,i)=>cubic(s,i/32)).slice(j?1:0)),lengths=[0];
  for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
  const total=lengths.at(-1);return u=>{const distance=clamp(u)*total;let lo=1,hi=lengths.length-1;while(lo<hi){const mid=(lo+hi)>>1;lengths[mid]<distance?lo=mid+1:hi=mid;}const i=lo,t=(distance-lengths[i-1])/(lengths[i]-lengths[i-1]||1);return [mix(points[i-1][0],points[i][0],t),mix(points[i-1][1],points[i][1],t)];};
 }
 function energyAt(phase){
  phase=clamp(phase);const travel=smooth((phase-.16)/.55),flight=smooth((phase-.12)/.06)*(1-smooth((phase-.76)/.10)),impact=smooth((phase-.71)/.07)*(1-smooth((phase-.84)/.16)),charge=Math.sin(Math.PI*clamp(phase/.22))**2;
  return {phase,travel,flight,impact,charge};
 }
 function strandPath(sample,offset,phase){return Array.from({length:49},(_,i)=>{const u=i/48,p=sample(u),a=sample(u-.008),b=sample(u+.008),dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1,k=offset*Math.sin(Math.PI*u)*Math.sin(TAU*(u*1.5-phase));return (i?'L':'M')+[p[0]-dy/n*k,p[1]+dx/n*k].join(' ');}).join(' ');}
 function canvasPoint(q,rect,padding,size){return [rect.left+padding.left+q[0]/size.width*(rect.width-padding.left-padding.right),rect.top+padding.top+q[1]/size.height*(rect.height-padding.top-padding.bottom)];}
 function create({chapters,canvas,stage}){
  const svg=document.createElementNS(NS,'svg');svg.classList.add('reading-thread');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.innerHTML='<defs><linearGradient id="reading-thread-ink" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd394"/><stop offset=".5" stop-color="#e8c9ff"/><stop offset="1" stop-color="#c398ff"/></linearGradient></defs><path class="reading-component-trace" pathLength="1"/><path class="reading-thread-halo"/><path class="reading-thread-line"/><g class="reading-thread-weave"></g><path class="reading-thread-under"/><ellipse class="reading-thread-arrival"/><circle class="reading-thread-source"/><circle class="reading-thread-source-ring"/><g class="reading-thread-packet"></g><g class="reading-thread-dust"></g><circle class="reading-thread-end" r="2.5"/>';
  document.body.appendChild(svg);
  const gradient=svg.querySelector('linearGradient'),stop=gradient.lastElementChild,halo=svg.querySelector('.reading-thread-halo'),line=svg.querySelector('.reading-thread-line'),under=svg.querySelector('.reading-thread-under'),sourceDot=svg.querySelector('.reading-thread-source'),sourceRing=svg.querySelector('.reading-thread-source-ring'),arrival=svg.querySelector('.reading-thread-arrival'),end=svg.querySelector('.reading-thread-end'),trace=svg.querySelector('.reading-component-trace');
  const nodes=(selector,tag,count)=>{const group=svg.querySelector(selector);return Array.from({length:count},()=>{const node=document.createElementNS(NS,tag);group.appendChild(node);return node;});},weave=nodes('.reading-thread-weave','path',4),packet=nodes('.reading-thread-packet','circle',12),dust=nodes('.reading-thread-dust','circle',8);
  const cinema=root.ProfileCinematicLines?.create(svg);
  let receivers=[],padding={left:0,right:0,top:0,bottom:0},receiver=null,snapshot={visible:false},headerBottom=100;
  function measure(){
   const style=getComputedStyle(canvas);for(const side of ['left','right','top','bottom'])padding[side]=parseFloat(style['padding'+side[0].toUpperCase()+side.slice(1)])||0;
   headerBottom=document.querySelector('.site-header').getBoundingClientRect().bottom;
   receivers=chapters.map((chapter,index)=>[...chapter.querySelectorAll('h1,h2,h3,.career-context,.lede,.scene-sequence li,.chapter-copy>p,blockquote,.story-bridge,.section-heading>p,.career-row p,.contact p')].filter(el=>!el.classList.contains('eyebrow')).map(el=>{
    const range=document.createRange();range.selectNodeContents(el.dataset.storyBeat&&el.lastChild?.nodeType===3?el.lastChild:el);const lines=[...range.getClientRects()].filter(r=>r.width>5&&r.height>4).map(r=>({left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY}));range.detach();
    const role=el.hasAttribute('data-company')?'company':/^H[123]$/.test(el.tagName)?'heading':el.classList.contains('career-context')?'company-context':el.dataset.storyBeat?'beat':'copy';return {el,index,lines,role};
   }).filter(r=>r.lines.length));
  }
  function select(index,compact,safeTop){
   const groups=[index,index+1,index-1].filter(i=>i>=0&&i<receivers.length);
   for(const group of groups){const candidates=[];for(const item of receivers[group]){
    const lines=item.lines.map(r=>({...r,top:r.top-scrollY,bottom:r.bottom-scrollY})).filter(r=>r.top>=safeTop&&r.bottom<innerHeight-18);
    if(!lines.length)continue;const r=lines[0],priority=item.role==='heading'?40:item.role==='company-context'?30:item.role==='beat'&&item.el.classList.contains('is-active')?25:item.el.classList.contains('lede')?20:10;
    candidates.push({...item,rect:r,priority});
   }if(candidates.some(c=>c.role==='company'))return candidates.find(c=>c.role==='company');if(candidates.length)return candidates.sort((a,b)=>Math.abs(a.rect.top-b.rect.top)<12?b.priority-a.priority:a.rect.top-b.rect.top)[0];}
   return null;
  }
  function read({position,project,source,components=[],phase=0,accent,active=true}){
   if(!active||position<1||document.hidden||(project.camera.framing==='head'&&project.camera.focusWeight>.4))return null;
   const compact=innerWidth<768,r=canvas.getBoundingClientRect(),stageRect=stage.getBoundingClientRect(),safeTop=compact?Math.max(headerBottom,stageRect.bottom)+16:headerBottom+20;
   const target=select(Math.min(chapters.length-1,Math.floor(position+.001)),compact,safeTop);if(!target)return null;
   const q=project(source),handVisible=project.camera.distance-q[2]>=(project.camera.near||.25);
   const hand=canvasPoint(q,r,padding,{width:r.width,height:r.height}),inside=p=>p[0]>=r.left+5&&p[0]<=r.right-5&&p[1]>=Math.max(r.top,headerBottom)+24&&p[1]<=r.bottom-38;
   let origin=hand,componentId=null,contour=[];
   const candidates=components.map(item=>{const points=project.clip(item.points,true).flatMap(points=>points.map(q=>canvasPoint(project(q),r,padding,{width:r.width,height:r.height}))),visible=points.filter(inside);if(!visible.length)return null;const centre=[0,1].map(axis=>visible.reduce((n,p)=>n+p[axis],0)/visible.length);return {id:item.id,points,visible,distance:Math.hypot(centre[0]-hand[0],centre[1]-hand[1])};}).filter(Boolean).sort((a,b)=>a.distance-b.distance);
   if(candidates.length){const c=candidates[0];const edge=compact?Math.max(...c.visible.map(p=>p[1])):Math.min(...c.visible.map(p=>p[0])),rim=c.visible.filter(p=>compact?edge-p[1]<3:p[0]-edge<3);origin=rim.reduce((a,b)=>compact?(b[0]<a[0]?b:a):(b[1]>a[1]?b:a));componentId=c.id;contour=c.points.every(inside)?c.points:[];}
   if(!inside(origin)||(!componentId&&!handVisible))return null;
   const box=target.rect,endpoint=[compact?box.left-8:box.right+9,box.bottom+4],gutter=compact?Math.max(12,Math.min(box.left-10,20)):stageRect.left+10;
   const geometry=route(origin,endpoint,gutter,compact,innerHeight-48),energy=energyAt(phase),sample=sampleRoute(geometry),point=sample(energy.travel),width=Math.min(compact?135:180,box.right-box.left),underline=compact?'M'+[box.left,endpoint[1]].join(' ')+'h'+width:'M'+[box.right-width,endpoint[1]].join(' ')+'h'+width;
   return {origin,endpoint,geometry,point,underline,target,accent,compact,energy,sample,contour,componentId,viewport:[innerWidth,innerHeight],region:{left:r.left+padding.left,right:r.right-padding.right,top:Math.max(headerBottom,r.top+padding.top),bottom:r.bottom-padding.bottom}};
  }

  function hide(){svg.style.display='none';cinema?.hide();if(receiver){receiver.classList.remove('story-receiver');receiver=null;}snapshot={visible:false};}
  function write(frame){
   if(!frame){hide();return;}
   cinema?.setFrame(frame);
   const {origin,endpoint,geometry,point,target,accent,compact,viewport,energy,sample,contour,componentId}=frame;
   svg.style.display='block';svg.style.width=viewport[0]+'px';svg.style.height=viewport[1]+'px';svg.setAttribute('viewBox','0 0 '+viewport.join(' '));svg.style.setProperty('--reading-tone',accent);svg.dataset.layout=compact?'below':'beside';
   for(const p of [halo,line])p.setAttribute('d',geometry.d);under.setAttribute('d',frame.underline);
   line.style.opacity=String(.28+energy.flight*.36);halo.style.opacity=String(.035+energy.flight*.035);
   svg.style.setProperty('--reading-impact',energy.impact);svg.style.setProperty('--reading-charge',energy.charge);
   const offsets=compact?[-3,3]:[-7,-3.5,3.5,7];weave.forEach((node,i)=>{node.style.display=i<offsets.length?'':'none';if(i<offsets.length)node.setAttribute('d',strandPath(sample,offsets[i],energy.phase));});
   trace.setAttribute('d',contour.length?'M'+contour.map(p=>p.join(' ')).join('L')+'Z':'');trace.style.opacity=String(.12+energy.charge*.55+energy.flight*(1-energy.travel)*.30);trace.style.strokeDasharray='.22 .78';trace.style.strokeDashoffset=String(-energy.phase);
   sourceDot.setAttribute('r',3+energy.charge*2);sourceRing.setAttribute('r',6+energy.charge*6);sourceRing.style.opacity=String(.18+energy.charge*.6);
   sourceRing.setAttribute('cx',origin[0]);sourceRing.setAttribute('cy',origin[1]);
   arrival.setAttribute('cx',endpoint[0]);arrival.setAttribute('cy',endpoint[1]);arrival.setAttribute('rx',5+energy.impact*10);arrival.setAttribute('ry',2+energy.impact*3);arrival.style.opacity=String(energy.impact*.75);
   packet.forEach((node,i)=>{const age=i/(packet.length-1),p=sample(energy.travel-age*.18);node.setAttribute('cx',p[0]);node.setAttribute('cy',p[1]);node.setAttribute('r',i===0?2.8:1.5-age*.9);node.style.opacity=String(energy.flight*(1-age)**1.4*(compact&&i>7?0:1));});
   dust.forEach((node,i)=>{const a=i*2.399,spread=energy.impact*(5+i*.9),side=compact?-1:1;node.setAttribute('cx',endpoint[0]+side*(3+spread*(.6+.4*Math.cos(a))));node.setAttribute('cy',endpoint[1]+Math.sin(a)*energy.impact*4);node.setAttribute('r',i%3===0?1.5:.85);node.style.opacity=String(energy.impact*.7*(compact&&i>4?0:1));});
   for(const [node,p]of [[sourceDot,origin],[end,endpoint]]){node.setAttribute('cx',p[0]);node.setAttribute('cy',p[1]);}
   for(const [key,v]of Object.entries({x1:origin[0],y1:origin[1],x2:endpoint[0],y2:endpoint[1]}))gradient.setAttribute(key,v);stop.setAttribute('stop-color',accent);
   if(receiver!==target.el){if(receiver)receiver.classList.remove('story-receiver');receiver=target.el;receiver.classList.add('story-receiver');}
   receiver.style.setProperty('--reading-tone',accent);receiver.style.setProperty('--reading-wash',accent+'0b');receiver.style.setProperty('--reading-glow',accent+Math.round(34+energy.impact*51).toString(16).padStart(2,'0'));receiver.style.setProperty('--reading-impact',energy.impact);
   snapshot={visible:true,layout:compact?'below':'beside',source:origin,target:endpoint,receiver:receiver.textContent.trim().slice(0,110),chapter:target.index,role:target.role,path:geometry.d,sourceKind:componentId?'component':'hand',componentId,contour,energy};
  }
  return {measure,read,write,hide,animate:(dt,cue,enabled)=>cinema?.advance(dt,cue,enabled),pending:()=>cinema?.pending()||false,cinematicSnapshot:()=>cinema?.snapshot()||{active:false},snapshot:()=>({...snapshot})};
 }
 const api={route,canvasPoint,energyAt,sampleRoute,strandPath,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileReadingThread=api;
})(typeof globalThis!=='undefined'?globalThis:this);
