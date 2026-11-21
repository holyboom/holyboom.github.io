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
 function strandPath(sample,offset,phase,extent=1){return Array.from({length:49},(_,i)=>{const u=extent*i/48,p=sample(u),a=sample(u-.008),b=sample(u+.008),dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1,k=offset*Math.sin(Math.PI*u)*Math.sin(TAU*(u*1.5-phase));return (i?'L':'M')+[p[0]-dy/n*k,p[1]+dx/n*k].join(' ');}).join(' ');}
 function canvasPoint(q,rect,padding,size){return [rect.left+padding.left+q[0]/size.width*(rect.width-padding.left-padding.right),rect.top+padding.top+q[1]/size.height*(rect.height-padding.top-padding.bottom)];}
 // Closed disclosures can retain Range rectangles without painting their text.
 // A tether must terminate on a visible glyph, never one of those retained boxes.
 function visibleReceiver(el){
  if(!el?.isConnected)return false;
  for(let d=el.closest('details');d;d=d.parentElement?.closest('details'))if(!d.open&&!d.firstElementChild?.contains(el))return false;
  if(el.checkVisibility&&!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true,contentVisibilityAuto:true}))return false;
  const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse';
 }
 function textLines(el){
  if(!visibleReceiver(el))return [];
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),lines=[];let node;
  while((node=walker.nextNode())){const parent=node.parentElement;if(!node.textContent.trim()||parent?.closest('[aria-hidden="true"]')||!visibleReceiver(parent))continue;
   if(el.dataset.storyBeat&&node!==el.lastChild)continue;
   const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>5&&r.height>4)lines.push({left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY});range.detach();
  }
  return lines;
 }
 function create({chapters,canvas,stage,question}){
  const svg=document.createElementNS(NS,'svg');svg.classList.add('reading-thread');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
  svg.innerHTML='<defs><linearGradient id="reading-thread-ink" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd394"/><stop offset=".5" stop-color="#e8c9ff"/><stop offset="1" stop-color="#c398ff"/></linearGradient></defs><path class="reading-component-trace" pathLength="1"/><path class="reading-thread-halo"/><path class="reading-thread-line"/><g class="reading-thread-weave"></g><path class="reading-thread-under"/><ellipse class="reading-thread-arrival"/><circle class="reading-thread-source"/><circle class="reading-thread-source-ring"/><g class="reading-thread-packet"></g><g class="reading-thread-dust"></g><circle class="reading-thread-end" r="2.5"/>';
  document.body.appendChild(svg);
  const gradient=svg.querySelector('linearGradient'),stop=gradient.lastElementChild,halo=svg.querySelector('.reading-thread-halo'),line=svg.querySelector('.reading-thread-line'),under=svg.querySelector('.reading-thread-under'),sourceDot=svg.querySelector('.reading-thread-source'),sourceRing=svg.querySelector('.reading-thread-source-ring'),arrival=svg.querySelector('.reading-thread-arrival'),end=svg.querySelector('.reading-thread-end'),trace=svg.querySelector('.reading-component-trace');
  const nodes=(selector,tag,count)=>{const group=svg.querySelector(selector);return Array.from({length:count},()=>{const node=document.createElementNS(NS,tag);group.appendChild(node);return node;});},weave=nodes('.reading-thread-weave','path',4),packet=nodes('.reading-thread-packet','circle',12),dust=nodes('.reading-thread-dust','circle',8);
  const cinema=root.ProfileCinematicLines?.create(svg);
  let questionLines=[],receivers=[],padding={left:0,right:0,top:0,bottom:0},receiver=null,snapshot={visible:false},headerBottom=100,launchSource=null;
  function measure(){
   launchSource=null;
   const style=getComputedStyle(canvas);for(const side of ['left','right','top','bottom'])padding[side]=parseFloat(style['padding'+side[0].toUpperCase()+side.slice(1)])||0;
   headerBottom=document.querySelector('.site-header').getBoundingClientRect().bottom;
   questionLines=question?textLines(question):[];
   receivers=chapters.map((chapter,index)=>[...chapter.querySelectorAll('h1,h2,h3,.career-context,.lede,.scene-sequence li,.chapter-copy>p,blockquote,.story-bridge,.section-heading>p,.career-row p,.contact p')].filter(el=>!el.classList.contains('eyebrow')&&!el.classList.contains('story-era')&&!el.hasAttribute('data-career-context')).map(el=>{
    const lines=textLines(el);
    const role=/^H[123]$/.test(el.tagName)?'heading':el.dataset.storyBeat?'beat':'copy';return {el,index,lines,role};
   }).filter(r=>r.lines.length));
  }
  function select(index,compact,safeTop,preferred,readY=scrollY,activeBeat){
   if(preferred&&visibleReceiver(preferred)){
    const item=preferred===question?{el:question,lines:questionLines,index:6,role:'copy'}:receivers[7]?.find(item=>item.el===preferred);
    const glyph=item?.lines.find(r=>r.top-readY>=safeTop&&r.bottom-readY<innerHeight-18);
    if(glyph)return {...item,rect:{...glyph,top:glyph.top-readY,bottom:glyph.bottom-readY}};
   }
   const groups=[index,index+1,index-1].filter(i=>i>=0&&i<receivers.length);
   for(const group of groups){const candidates=[];for(const item of receivers[group]){
    if(!visibleReceiver(item.el))continue;
    const lines=item.lines.map(r=>({...r,top:r.top-readY,bottom:r.bottom-readY})).filter(r=>r.top>=safeTop&&r.bottom<innerHeight-18);
    if(!lines.length)continue;const r=lines[0],chosen=activeBeat?item.el.dataset.storyBeat===activeBeat:item.el.classList.contains('is-active'),priority=item.role==='beat'&&chosen?60:item.role==='heading'?40:item.el.classList.contains('lede')?30:item.role==='beat'?20:10;
    candidates.push({...item,rect:r,priority});
   }if(candidates.length)return candidates.sort((a,b)=>b.priority-a.priority||a.rect.top-b.rect.top)[0];}
   return null;
  }
  function read({position,project,source,components=[],phase=0,accent,active=true,quietSource=false,preferred=null,layout=null}){
   if(!active||position<1||document.hidden||(project.camera.framing==='head'&&project.camera.focusWeight>.4))return null;
   const compact=innerWidth<768,r=layout?.rect||canvas.getBoundingClientRect(),stageRect=layout?.rect||stage.getBoundingClientRect(),inset=layout?.padding||padding,safeTop=compact?Math.max(headerBottom,stageRect.bottom)+16:headerBottom+20;
   const target=select(Math.min(chapters.length-1,Math.floor(position+.001)),compact,safeTop,preferred,layout?.readY,layout?.activeBeat);if(!target)return null;
   const q=project(source),handVisible=project.camera.distance-q[2]>=(project.camera.near||.25);
   const hand=canvasPoint(q,r,inset,r),inside=p=>p[0]>=r.left+5&&p[0]<=r.right-5&&p[1]>=Math.max(r.top,headerBottom)+24&&p[1]<=r.bottom-38;
   let origin=hand,componentId=null,contour=[];
   const candidates=components.map(item=>{
    const points=project.clip(item.points,true).flatMap(loop=>loop.map(q=>canvasPoint(project(q),r,inset,r)));
    const visible=points.filter(inside);
    if(!visible.length)return null;
    const centre=[0,1].map(axis=>visible.reduce((n,p)=>n+p[axis],0)/visible.length);
    const xs=visible.map(p=>p[0]),ys=visible.map(p=>p[1]);
    const size=Math.sqrt((Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys)));
    // Prefer the material in the palm to an adjacent rivet or a single key.
    const distance=Math.hypot(centre[0]-hand[0],centre[1]-hand[1])+(compact?Math.max(0,16-size):0);
    return {id:item.id,points,visible,size,distance};
   }).filter(Boolean).sort((a,b)=>a.distance-b.distance);
   if(candidates.length){
    const c=candidates[0],axis=compact?1:0;
    const edge=(compact?Math.max:Math.min)(...c.visible.map(p=>p[axis])),rim=c.visible.filter(p=>Math.abs(p[axis]-edge)<3);
    origin=rim.reduce((a,b)=>compact?(b[0]<a[0]?b:a):(b[1]>a[1]?b:a));componentId=c.id;contour=c.points.length===c.visible.length?c.points:[];
    // A full source ring would cover the chip, latch or seam on a phone.
    quietSource=quietSource||(compact&&c.size<32);
   }
   if(!inside(origin)||(!componentId&&!handVisible))return null;
   const box=target.rect,endpoint=[compact?box.left-8:box.right+9,box.bottom+4],gutter=compact?Math.max(12,Math.min(box.left-10,20)):stageRect.left+10;
   const geometry=route(origin,endpoint,gutter,compact,innerHeight-48),energy=energyAt(phase),sample=sampleRoute(geometry),point=sample(energy.travel),width=Math.min(compact?135:180,box.right-box.left),underline=compact?'M'+[box.left,endpoint[1]].join(' ')+'h'+width:'M'+[box.right-width,endpoint[1]].join(' ')+'h'+width;
   return {origin,endpoint,geometry,point,underline,target,accent,compact,quietSource,energy,sample,contour,componentId,viewport:[innerWidth,innerHeight],region:{left:r.left+inset.left,right:r.right-inset.right,top:Math.max(headerBottom,r.top+inset.top),bottom:r.bottom-inset.bottom}};
  }

  function hide(){svg.style.display='none';cinema?.hide();if(receiver){receiver.classList.remove('story-receiver');receiver=null;}snapshot={visible:false};}
  function write(frame){
   if(!frame){hide();return;}
   if(frame.launch)cinema?.hide();else cinema?.setFrame(frame);
   const {origin,endpoint,geometry,point,target,accent,compact,viewport,energy,sample,contour,componentId}=frame;
   svg.style.display='block';svg.style.width=viewport[0]+'px';svg.style.height=viewport[1]+'px';svg.setAttribute('viewBox','0 0 '+viewport.join(' '));svg.style.setProperty('--reading-tone',accent);svg.dataset.layout=compact?'below':'beside';
   svg.classList.toggle('quiet-source',frame.quietSource);
   svg.style.opacity='';svg.style.clipPath='';under.style.opacity='';end.style.opacity='';sourceDot.style.opacity='';
   for(const p of [halo,line])p.setAttribute('d',geometry.d);under.setAttribute('d',frame.underline);
   line.style.opacity=String(.28+energy.flight*.36);halo.style.opacity=String(.035+energy.flight*.035);
   svg.style.setProperty('--reading-impact',energy.impact);svg.style.setProperty('--reading-charge',energy.charge);
   const offsets=compact?[-3,3]:[-7,-3.5,3.5,7],extent=frame.launch?.remaining??1;
   weave.forEach((node,i)=>{node.style.display=i<offsets.length?'':'none';if(i<offsets.length)node.setAttribute('d',extent>.0002?strandPath(sample,offsets[i],energy.phase,extent):'');});
   trace.setAttribute('d',contour.length?'M'+contour.map(p=>p.join(' ')).join('L')+'Z':'');trace.style.opacity=String(.12+energy.charge*.55+energy.flight*(1-energy.travel)*.30);trace.style.strokeDasharray='.22 .78';trace.style.strokeDashoffset=String(-energy.phase);
   sourceDot.setAttribute('r',3+energy.charge*2);sourceRing.setAttribute('r',6+energy.charge*6);sourceRing.style.opacity=String(.18+energy.charge*.6);
   sourceRing.setAttribute('cx',origin[0]);sourceRing.setAttribute('cy',origin[1]);
   arrival.setAttribute('cx',endpoint[0]);arrival.setAttribute('cy',endpoint[1]);arrival.setAttribute('rx',5+energy.impact*10);arrival.setAttribute('ry',2+energy.impact*3);arrival.style.opacity=String(energy.impact*.75);
   packet.forEach((node,i)=>{const age=i/(packet.length-1),p=sample(energy.travel-age*.18);node.setAttribute('cx',p[0]);node.setAttribute('cy',p[1]);node.setAttribute('r',i===0?2.8:1.5-age*.9);node.style.opacity=String(energy.flight*(1-age)**1.4*(compact&&i>7?0:1));});
   dust.forEach((node,i)=>{const a=i*2.399,spread=energy.impact*(5+i*.9),side=compact?-1:1;node.setAttribute('cx',endpoint[0]+side*(3+spread*(.6+.4*Math.cos(a))));node.setAttribute('cy',endpoint[1]+Math.sin(a)*energy.impact*4);node.setAttribute('r',i%3===0?1.5:.85);node.style.opacity=String(energy.impact*.7*(compact&&i>4?0:1));});
   for(const [node,p]of [[sourceDot,origin],[end,endpoint]]){node.setAttribute('cx',p[0]);node.setAttribute('cy',p[1]);}
   for(const [key,v]of Object.entries({x1:origin[0],y1:origin[1],x2:endpoint[0],y2:endpoint[1]}))gradient.setAttribute(key,v);stop.setAttribute('stop-color',accent);
   const highlighted=frame.launch?.progress>.042?null:target.el;
   if(receiver!==highlighted){receiver?.classList.remove('story-receiver');receiver=highlighted;receiver?.classList.add('story-receiver');}
   if(receiver){
    receiver.style.setProperty('--reading-tone',accent);receiver.style.setProperty('--reading-wash',accent+'0b');receiver.style.setProperty('--reading-glow',accent+Math.round(34+energy.impact*51).toString(16).padStart(2,'0'));receiver.style.setProperty('--reading-impact',energy.impact);
   }
   snapshot={visible:true,layout:compact?'below':'beside',source:origin,target:endpoint,receiver:target.el.textContent.trim().slice(0,110),chapter:target.index,role:target.role,path:geometry.d,sourceKind:componentId?'component':'hand',componentId,contour,energy};
  }
  function drawLaunch(frame){
   if(!frame?.plane||document.hidden||frame.progress>=.335){hide();return;}
   const {plane,sourcePlane,position,progress:p,startY,sourceBounds:r,sourcePadding,bounds}=frame;
   const g=root.ProfileGeometry,compact=innerWidth<768;
   // Rebuild the native work-frame receiver and its actual rim from scroll
   // geometry. An anchor jump and a rewind use exactly the same starting ink.
   const key=[position,startY,r.left,r.top,r.width,r.height].join(',');
   if(!launchSource||launchSource.key!==key){
    const project=g.createProjector(position,r.width,r.height,{compact}),shot=g.storyAt(position);
    const layer=g.illustration(position).find(l=>l.id==='paper-plane'&&l.alpha>.5);
    const components=layer?.paths.filter(item=>item.readingAnchor&&item.fill)||[];
    const initial=read({position,project,source:g.lightAt(position),components,phase:g.cameraTrack(position)%1,
     accent:g.paletteAt(position).accent,layout:{rect:r,padding:sourcePadding,readY:startY,activeBeat:shot.chapter+':'+shot.step}});
    launchSource={key,initial};
   }
   const initial=launchSource.initial;
   if(!initial||!visibleReceiver(initial.target.el)){hide();return;}
   const ramp=(a,b)=>smooth((p-a)/(b-a)),pull=ramp(.014,.174),remaining=1-pull;
   const anchor=ramp(.010,.099),tail=plane.tail,nose=plane.nose,firstTail=sourcePlane.tail;
   const origin=initial.origin.map((q,i)=>tail[i]+(q-firstTail[i])*(1-anchor));
   const endpoint=[initial.endpoint[0],initial.endpoint[1]+startY-scrollY],box=initial.target.rect;
   const gutter=compact?Math.max(12,Math.min(box.left-10,20)):r.left+10;
   const geometry=route(origin,endpoint,gutter,compact,innerHeight-48),sample=sampleRoute(geometry);
   const width=Math.min(compact?135:180,box.right-box.left);
   const underline='M'+[compact?box.left:box.right-width,endpoint[1]].join(' ')+'h'+width;
   const offset=origin.map((q,i)=>q-initial.origin[i]);
   const contour=initial.contour.map(q=>q.map((v,i)=>v+offset[i]));
   const coil=ramp(.045,.17)*(1-ramp(.192,.226));
   const thrust=ramp(.192,.216)*(1-ramp(.236,.335));
   const tip=sample(remaining),phase=p<=.014?'attached':p<.174?'return':p<.20?'wound':'released';
   const launch={progress:p,phase,remaining,tail,nose,returnTip:tip,coil,thrust};
   write({...initial,origin,endpoint,geometry,sample,underline,contour,launch});
   snapshot.launch=launch;
   svg.style.clipPath='inset('+Math.max(0,headerBottom)+'px 0 0 0)';
   if(p<=.014)return;
   const length=Math.hypot(nose[0]-tail[0],nose[1]-tail[1])||1;
   const axis=nose.map((v,i)=>(v-tail[i])/length),normal=[-axis[1],axis[0]];
   const at=(along,across)=>[tail[0]+axis[0]*along+normal[0]*across,tail[1]+axis[1]*along+normal[1]*across];
   // This length leaves the same path the light originally took from hand to
   // words. The end travels through the gutter, clear of the text itself.
   const short=remaining>.0002?strandPath(sample,0,0,remaining):'';
   // The last turns wrap along the keel, then straighten into a short wake
   // opposite the projected nose. Both are measured in units of this plane.
   const radius=Math.min(compact?5.2:8,length*.060);
   const wound=coil>.002?Array.from({length:29},(_,i)=>{
    const u=i/28,t=u*coil,theta=TAU*1.45*t,wrap=coil*Math.sin(Math.PI*u)**.72;
    // Wind just aft of the paper. The overlapping turns remain readable
    // against the air, even on an ivory wing only a few pixels thick.
    const q=at(-Math.min(19,length*.18)*t+radius*.74*Math.sin(theta)*wrap,
     radius*(Math.cos(theta)-.32)*wrap);
    return (i?'L':'M')+q.join(' ');
   }).join(' '):'';
   const wake=thrust>.002?Array.from({length:17},(_,i)=>{
    const u=i/16,q=at(-Math.min(compact?32:48,length*.37)*thrust*u,radius*.28*Math.sin(Math.PI*u));
    return (i?'L':'M')+q.join(' ');
   }).join(' '):'';
   const path=[short,wound,wake].filter(Boolean).join(' ');
   for(const node of [line,halo])node.setAttribute('d',path);
   const pulse=Math.sin(Math.PI*pull),charge=coil+thrust*(1-coil);
   line.style.opacity=String(mix(.28+initial.energy.flight*.36,.78,ramp(.014,.055))*(.90+.10*charge));
   halo.style.opacity=String(.045+.07*charge);
   trace.style.opacity=String((.12+initial.energy.charge*.55+initial.energy.flight*(1-initial.energy.travel)*.3)*(1-anchor));
   const glyphSafe=endpoint[1]>(compact?bounds.bottom+4:headerBottom+4)&&endpoint[1]<innerHeight-6;
   const leftAtText=(1-ramp(.014,.048))*(glyphSafe?1:0);
   under.style.opacity=String((.5+.5*initial.energy.impact)*leftAtText);
   end.style.opacity=String(.9*leftAtText);arrival.style.opacity=String(initial.energy.impact*.75*leftAtText);
   for(const node of dust)node.style.opacity=String(Number(node.style.opacity)*leftAtText);
   const oldPacket=1-ramp(.014,.028),returnLight=ramp(.023,.048)*(1-ramp(.173,.202));
   packet.forEach((node,i)=>{
    if(oldPacket>.001){node.style.opacity=String(Number(node.style.opacity)*oldPacket);return;}
    const age=i/(packet.length-1),q=sample(Math.min(1,remaining+age*.055));
    node.setAttribute('cx',q[0]);node.setAttribute('cy',q[1]);node.setAttribute('r',i?.8:2);
    node.style.opacity=String(returnLight*(1-age)**2*(.48+.52*pulse));
   });
   sourceRing.setAttribute('r',3+charge*3);sourceRing.style.opacity=String(.10+.42*charge);
   sourceDot.style.opacity=String(.55+.36*charge);
   svg.style.opacity=String(Math.min(plane.alpha??1,1-ramp(.270,.335)));
   snapshot.path=path;
  }
  return {measure,read,write,drawLaunch,hide,animate:(dt,cue,enabled)=>cinema?.advance(dt,cue,enabled),pending:()=>cinema?.pending()||false,cinematicSnapshot:()=>cinema?.snapshot()||{active:false},snapshot:()=>({...snapshot})};
 }
 const api={route,canvasPoint,energyAt,sampleRoute,strandPath,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileReadingThread=api;
})(typeof globalThis!=='undefined'?globalThis:this);
