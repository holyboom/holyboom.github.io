/* Progressive enhancement only. The complete story remains in the HTML. */
(()=>{'use strict';
 const clearBoot=()=>document.documentElement.classList.remove('profile-boot');
 const g=window.ProfileGeometry;if(!g){clearBoot();return;}
 const canvas=document.querySelector('#architecture'),stage=document.querySelector('.stage'),journey=document.querySelector('#journey');
 const ctx=canvas?.getContext('2d');if(!ctx){clearBoot();return;}
 const chapters=[...document.querySelectorAll('[data-scene]')],rail=[...document.querySelectorAll('.chapter-rail a')],beneath=document.querySelector('#beneath');
 const readingThread=window.ProfileReadingThread?.create({chapters,canvas,stage});
 const professional=document.querySelector('#experience'),summaryHost=document.querySelector('.reflection-art');
 const originalHost=canvas.parentElement,contact=document.querySelector('#contact'),contactHost=contact.querySelector('.scene-fallback');
 const finale=window.ProfileFinale?.create({g,canvas,ctx,stageHost:originalHost,summaryHost,professional,contact,requestMeasure:()=>measure(),wake});
 // Owner policy: Full is fixed. Stored preferences and OS motion settings are
 // not mode controls for this profile. No hidden selector or public setter.
 const mode='full',reduced=false;
 let anchors=[],w=0,h=0,dpr=1,frameId=0,last=0,current=0,target=0,exploded=0,px=0,py=0,tx=0,ty=0,visible=true,draws=0,drawCost=0,detail=1,dirty=true,previousWidth=innerWidth,previousHeight=innerHeight,lastLabel=-1;
 let openingSeconds=0,openingActive=false,ambientPhase=0;
 let renderedCamera=null,modelCache=null,bitmapDetail=0,navPosition=-1,navScroll=-1;
 let layoutCorrection=null,measuredDisclosureOpen=beneath.open;
 const workPaths=[...document.querySelectorAll('.work-path')],workState=()=>workPaths.map(el=>el.open?'1':'0').join('');
 const inspecting=()=>(beneath.open&&current>6.45&&current<8.25)||(workPaths.some(el=>el.open)&&current>7.75&&current<9.1);
 let measuredWorkOpen=workState();
 let readingContext=null,readingWidth=innerWidth,readingHeight=innerHeight;
 let trailDirection=1,trailEnergy=0,lastMotion=0,trailSpan=0;
 const resetTrail=()=>{trailEnergy=0;lastMotion=0;trailSpan=0;};
 const glow=document.createElement('canvas'),gc=glow.getContext('2d');
 const brief=document.querySelector('.scene-label'),counter=document.querySelector('.stage-count');
 function staticLayout(){return false;}
 function readingTop(){
  let top=document.querySelector('.site-header').getBoundingClientRect().bottom;
  if(!staticLayout()&&innerWidth<768){const r=stage.getBoundingClientRect();if(r.bottom>top&&r.top<innerHeight)top=r.bottom;}
  return Math.min(innerHeight-60,top+20);
 }
 function captureReadingContext(){
  if(scrollY<1)return {start:true};
  const top=readingTop(),chapter=chapters.find(el=>{const r=el.getBoundingClientRect();return r.bottom>top+60&&r.top<innerHeight-40;});
  if(!chapter)return null;
  const focused=document.activeElement,fr=focused?.getBoundingClientRect();
  const anchor=chapter.contains(focused)&&fr.height&&fr.bottom>top&&fr.top<innerHeight?focused:[...chapter.querySelectorAll('h1,h2,h3,p,blockquote,summary,.story-bridge')].find(el=>{const r=el.getBoundingClientRect();return r.height&&r.bottom>top&&r.top<innerHeight;})||chapter;
  return {anchor,offset:anchor.getBoundingClientRect().top-top};
 }
 function restoreReadingContext(context){
  if(context.start){scrollTo({top:0,behavior:'instant'});return;}
  if(!context.anchor.isConnected)return;
  const top=readingTop(),rect=context.anchor.getBoundingClientRect(),offset=g.clamp(context.offset,-Math.max(0,rect.height-40),Math.max(0,innerHeight-top-80));
  scrollTo({top:Math.max(0,scrollY+rect.top-top-offset),behavior:'instant'});
 }
 function activate(restore=false){
  const preservePerformance=restore&&inspecting(),context=restore&&!preservePerformance?readingContext:null;
  document.documentElement.dataset.profileMotion='full';
  document.documentElement.classList.add('profile-enhanced');
  if(restore&&!preservePerformance)layoutCorrection=null;
  clearBoot();measure({preserve:preservePerformance});
  // A structural reflow retains the reader's heading and resumes at that
  // position. Toolbar-height changes keep native scroll and the current rig.
  if(context){restoreReadingContext(context);target=positionAt(scrollY);current=target;scroll();}
  readingWidth=innerWidth;readingHeight=innerHeight;readingContext=captureReadingContext();wake();
 }
 function positionAt(scroll){
  const raw=g.positionFromAnchors(scroll,anchors);
  if(!layoutCorrection)return raw;
  const progress=Math.abs(raw-layoutCorrection.origin)/layoutCorrection.span;
  // Retain the compact correction outside its support: it is zero there, but
  // returning to the same scroll position must recover the same composition.
  if(progress>=1)return raw;
  // Release the layout offset with actual story travel, not pixel distance:
  // the raw map has hold plateaus where pixel-based decay would move backwards.
  // smooth() has maximum slope 1.5; span >= 2.2*abs(delta) keeps this monotonic.
  return g.clamp(raw+layoutCorrection.delta*(1-g.smooth(progress)),0,anchors.length-1);
 }
 function measure({navigation=false,preserve=false}={}){
  resetTrail();
  const hadAnchors=anchors.length>0;
  const nextAnchors=chapters.map(el=>el.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(el).scrollMarginTop||'0'));
  const anchorsChanged=nextAnchors.some((value,i)=>Math.abs(value-(anchors[i]??value))>.01),disclosureChanged=measuredDisclosureOpen!==beneath.open||measuredWorkOpen!==workState();
  anchors=nextAnchors;measuredDisclosureOpen=beneath.open;measuredWorkOpen=workState();
  if(hadAnchors&&!navigation&&(disclosureChanged||((layoutCorrection||preserve)&&anchorsChanged))){
   // Native scroll anchoring may also change scrollY during a width/font
   // resize. Preserve what is displayed, not an old map at that new offset.
   const preserved=current,origin=g.positionFromAnchors(scrollY,anchors),delta=preserved-origin;
   layoutCorrection=Math.abs(delta)>.00001?{origin,delta,span:Math.max(.30,2.2*Math.abs(delta))}:null;
  }
  finale?.measure(anchors);
  const r=canvas.getBoundingClientRect();readingThread?.measure();w=r.width;h=r.height;
  dpr=Math.min(devicePixelRatio||1,innerWidth<768?1.5:1.75);
  if(w&&h){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);glow.width=Math.round(w*0.5);glow.height=Math.round(h*0.5);}
  detail=innerWidth<1100?2:1;dirty=true;target=positionAt(scrollY);if(!hadAnchors)current=target;wake();
 }
 function updateNavigation(){
  if(current===navPosition&&scrollY===navScroll)return;navPosition=current;navScroll=scrollY;
  const shot=g.storyAt(current),theme=g.paletteAt(current);
  document.querySelector('.transition-copy').textContent=shot.action;
  document.querySelector('.transition-track i').style.transform='scaleX('+((shot.index+1)/shot.total)+')';
  stage.style.setProperty('--scene-accent',theme.accent);
  let active=0;for(let i=0;i<anchors.length;i++)if(scrollY>=anchors[i]-innerHeight*0.15)active=i;
  rail.forEach((a,i)=>{if(i===active)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
  if(shot.index!==lastLabel){
   brief.textContent=shot.label;counter.textContent=String(shot.index+1).padStart(2,'0')+' / '+shot.total+' '+(g.config.sceneUnit||'SCENES');
   document.querySelector('.scene-caption').textContent=shot.caption;
   document.querySelector('.scene-meaning').textContent=shot.meaning+' · '+(shot.step+1)+' / '+shot.count;
   document.querySelectorAll('[data-story-beat]').forEach(el=>el.classList.toggle('is-active',el.dataset.storyBeat===shot.chapter+':'+shot.step));
   lastLabel=shot.index;
  }
 }
 function path(c,points){
  c.beginPath();c.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length-1;i++){const p=points[i],n=points[i+1];c.quadraticCurveTo(p[0],p[1],(p[0]+n[0])/2,(p[1]+n[1])/2);}
  const end=points[points.length-1];c.lineTo(end[0],end[1]);
 }
 function render(time){
  frameId=0;if(document.hidden||!visible||staticLayout()||!w||!h){last=0;return;}
  const started=performance.now(),dt=last?Math.min(64,time-last):16;last=time;
  target=positionAt(scrollY);const follow=1-Math.exp(-dt/28);
  const previous=current,hadVisibleTrail=trailEnergy>.01;
  current=g.mix(current,target,follow);if(Math.abs(current-target)<0.0001)current=target;
  const travel=current-previous;
  if(Math.abs(travel)>1){resetTrail();}
  else if(Math.abs(travel)>.00015){
   const direction=Math.sign(travel);if(direction!==trailDirection){trailSpan=0;trailEnergy=0;}
   trailDirection=direction;trailSpan=Math.min(g.config.gravity.trailSpan,trailSpan+Math.abs(travel));lastMotion=time;trailEnergy=Math.min(1,trailEnergy+dt/110);
  }else trailEnergy*=Math.exp(-dt/180);
  if(time-lastMotion>g.config.gravity.trailLife)resetTrail();
  px=g.mix(px,tx,follow);py=g.mix(py,ty,follow);
  openingActive=current<1&&g.resolve(current)<g.config.opening.stopAt;if(openingActive)openingSeconds+=dt/1000;ambientPhase=openingActive?g.openingPhase(openingSeconds):0;
  const desired=beneath.open&&current>6.5?1:0;exploded=g.mix(exploded,desired,follow);
  const ending=finale?.render(dt/1000,scrollY);
  if(ending?.active){resetTrail();readingThread?.hide();renderedCamera=finale.snapshot().camera;updateNavigation();draws++;drawCost=drawCost*.9+(performance.now()-started)*.1;dirty=false;if(ending.pending||current!==target)wake();return;}
  const cue=window.ProfileCinematicLines?.cueFor(Math.floor(current+.001),g.storyAt(current));
  // The finite SVG event shares this RAF, but a settled rig keeps its bitmap.
  // This avoids repainting hundreds of anatomical strands just to move dust.
  if(!dirty&&!openingActive&&!hadVisibleTrail&&bitmapDetail===detail&&current===previous&&trailEnergy<.01&&Math.abs(exploded-desired)<.001&&Math.abs(px-tx)<.0001&&Math.abs(py-ty)<.0001){
   if(cue)readingThread?.animate(dt/1000,cue,visible);
   if(readingThread?.pending())wake();
   return;
  }
  if(!modelCache||modelCache.position!==current||modelCache.detail!==detail||modelCache.exploded!==exploded||modelCache.ambientPhase!==ambientPhase)modelCache={position:current,detail,exploded,ambientPhase,lines:g.frame(current,detail,exploded,ambientPhase)};
  const geom=modelCache.lines,theme=g.paletteAt(current),emotion=g.dramaAt(current);
  const compactOffering=innerWidth<768&&g.storyAt(current).prop==='possibility';
  const handLight=g.motion.accentAt(g.resolve(current)),humanLight=g.resolve(current)>=1,sourceStrength=Math.sqrt(emotion.glow),lightCore=(humanLight?3+handLight.charge*2.5:2.6)*sourceStrength,lightHalo=(humanLight?12+handLight.charge*13:7)*sourceStrength*(compactOffering ? .65 : 1);
  const project=g.createProjector(current,w,h,{compact:innerWidth<768,yaw:px,pitch:py,expanded:exploded});renderedCamera=project.camera;
  // Performance is a pure function of story position. Scaling the whole body to
  // suggest breathing also moved planted feet, hands and the work surface.
  const projectPoint=project;
  const rawIllustrations=g.illustration(current,exploded);
  const readingSource=project.camera.eyeWeight>.5?g.performanceAt(current).contacts.left.tip:g.lightAt(current);
  const readingComponents=rawIllustrations.filter(layer=>layer.role==='front-work'&&layer.alpha>.5).flatMap(layer=>layer.paths.filter(item=>(item.fill||item.readingAnchor)&&item.points.length>=4&&!item.skin));
  const readingFrame=readingThread?.read({position:current,project,source:readingSource,components:readingComponents,phase:g.cameraTrack(current)%1,accent:theme.accent,active:visible});
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const halo=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,Math.min(w,h)*.43);halo.addColorStop(0,theme.accent+'16');halo.addColorStop(1,'rgba(133,83,222,0)');ctx.globalAlpha=1-emotion.isolation*.75-emotion.doubt*.15;ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
  if(emotion.strength>.001){
   const light=projectPoint(g.lightAt(current)),radius=Math.min(w,h)*(.17+emotion.rise*.15),cast=ctx.createRadialGradient(light[0],light[1],0,light[0],light[1],radius);
   cast.addColorStop(0,'#ffd394'+Math.round(21+15*emotion.rise).toString(16).padStart(2,'0'));cast.addColorStop(1,'#ffd39400');ctx.globalAlpha=emotion.strength*emotion.glow;ctx.fillStyle=cast;ctx.fillRect(0,0,w,h);
   const edge=ctx.createRadialGradient(w*.5,h*.50,Math.min(w,h)*.22,w*.5,h*.50,Math.max(w,h)*.65);edge.addColorStop(0,'#0b091200');edge.addColorStop(1,'#0b0912d9');ctx.globalAlpha=emotion.strength*(.40+emotion.doubt*.35);ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);ctx.globalAlpha=1;
  }
  ctx.lineCap=ctx.lineJoin='round';
  const projected=g.projectLines(geom.filter(line=>line.alpha>.005&&line.points.length>1),project);
  const illustrations=g.projectIllustrations(rawIllustrations,project).map(layer=>({...layer,paths:layer.paths.filter(item=>item.alpha*layer.alpha>.001&&!(innerWidth<768&&item.secondary)).filter(item=>layer.id!=='story-world'||item.points.some(q=>q[0]>-16&&q[0]<w+16&&q[1]>-16&&q[1]<h+16))}));
  // Compare strands with the tilted work plane in camera space. A normalized
  // plane distance remains finite as an orbit passes its edge; a reciprocal
  // ray-plane depth has a horizon there and can send sorting keys to infinity.
  const cameraDistance=project.camera.distance,projectionScale=project.scale,[centerX,centerY]=project.center;
  const cameraPoint=q=>{const k=(cameraDistance-q[2])/projectionScale;return [(q[0]-centerX)*k,(centerY-q[1])*k,q[2]];};
  const screenPoint=q=>{const k=projectionScale/Math.max(project.camera.near||.25,cameraDistance-q[2]);return [centerX+q[0]*k,centerY-q[1]*k,q[2]];};
  const planeItem=illustrations.filter(layer=>layer.role==='front-work').flatMap(layer=>layer.paths).find(item=>item.fill&&item.points.length>8);
  let plane=null;
  if(planeItem){
   const points=planeItem.points,a=cameraPoint(points[0]),b=cameraPoint(points[Math.floor(points.length/3)]),c=cameraPoint(points[Math.floor(points.length*2/3)]),u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
   const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...normal);
   if(length>1e-9){const n=normal.map(value=>value/length),facing=-n[0]*a[0]-n[1]*a[1]+n[2]*(cameraDistance-a[2]);plane={a,n,side:facing<0?-1:1,facing:facing/Math.hypot(a[0],a[1],cameraDistance-a[2])};}
  }
  const depthAt=q=>{
   if(!plane)return q[2];
   const k=(cameraDistance-q[2])/projectionScale,n=plane.n,a=plane.a;
   return plane.side*(n[0]*((q[0]-centerX)*k-a[0])+n[1]*((centerY-q[1])*k-a[1])+n[2]*(q[2]-a[2]));
  };
  const depthOf=points=>points.reduce((sum,q)=>sum+depthAt(q),0)/points.length;
  const splitAcrossPlane=source=>{
   const fragments=[];let points=[source[0]],previousDepth=depthAt(source[0]);
   for(let i=1;i<source.length;i++){
    const q=source[i],depth=depthAt(q);
    if((depth<0)!==(previousDepth<0)&&Math.abs(depth-previousDepth)>1e-8){
     const previousPoint=cameraPoint(source[i-1]),nextPoint=cameraPoint(q),t=previousDepth/(previousDepth-depth),crossing=screenPoint(previousPoint.map((value,axis)=>g.mix(value,nextPoint[axis],t)));
     points.push(crossing);fragments.push(points);points=[crossing];
    }
    points.push(q);previousDepth=depth;
   }
   fragments.push(points);return fragments;
  };
  const ink=line=>['code','network'].includes(line.group)?g.config.palette.world:['intent','tool'].includes(line.group)?g.config.tones.human:['prop','architecture'].includes(line.group)?g.config.palette.highlight:line.group==='world'?theme.accent:g.config.palette.line;
  const drawLine=line=>{
   const depth=line.points[Math.floor(line.points.length/2)][2];ctx.globalAlpha=line.alpha*g.clamp(.72+depth*.10,.25,1);ctx.strokeStyle=line.group==='fabric'&&depth>.3?g.config.palette.highlight:ink(line);ctx.lineWidth=line.id===0?1.6:line.width;
   path(ctx,line.points);ctx.stroke();
   if(line.important&&['human','fabric'].includes(line.group)){const q=line.points[Math.floor(line.points.length/4)];ctx.globalAlpha=line.alpha*.75;ctx.fillStyle=g.config.palette.highlight;ctx.beginPath();ctx.arc(q[0],q[1],.9,0,Math.PI*2);ctx.fill();}
   if(line.id===0){const seed=line.points[0];ctx.globalAlpha=line.alpha;ctx.fillStyle='#eefff8';ctx.beginPath();ctx.arc(seed[0],seed[1],lightCore,0,Math.PI*2);ctx.fill();}
  };
  const signal=projected.find(l=>l.id===0),seed=signal?.points[0];
  // Diffuse light precedes opaque prop fills, so a hidden torso cannot glow
  // through a work surface. The sharp strands join the painter queue below.
  if(gc){gc.setTransform(.5,0,0,.5,0,0);gc.clearRect(0,0,w,h);gc.lineWidth=2;gc.lineCap=gc.lineJoin='round';
   for(const line of projected){if(!line.important)continue;gc.strokeStyle=ink(line);gc.globalAlpha=line.alpha*.65;path(gc,line.points);gc.stroke();}
   if(seed){gc.globalAlpha=compactOffering ? .75 : 1;gc.fillStyle=g.config.tones.human;gc.beginPath();gc.arc(seed[0],seed[1],lightHalo,0,Math.PI*2);gc.fill();}ctx.save();ctx.globalAlpha=1;ctx.filter='blur(5px)';ctx.drawImage(glow,0,0,w,h);ctx.restore();}
  const commands=[];
  for(const line of projected){
   if(line.group==='hand'){
    for(let i=0;i<line.points.length-1;i+=6){const section=line.points.slice(i,Math.min(line.points.length,i+7));
     for(const points of plane?splitAcrossPlane(section):[section])commands.push({kind:'strand',depth:depthOf(points)+1e-5,line:{...line,points}});
    }continue;
   }
   // Only split anatomical strands that cross the prop plane. This allows an
   // arm to pass behind the board while the wrist reaches its near surface,
   // without multiplying draw calls for the rest of the woven environment.
   if(plane&&(/^(torso|head|upperArm|forearm|hand|leg)/.test(line.part||'')||line.group==='tool')){
    for(const points of splitAcrossPlane(line.points))commands.push({kind:'strand',depth:depthOf(points),line:{...line,points}});
   }else commands.push({kind:'strand',depth:depthOf(line.points),line});
  }
  for(const layer of illustrations){
   // Preserve the illustration's authored in-plane paint order; its fine
   // lines and symbols must remain above its filled backing surface. The
   // keyboard has its own tilted plane rather than inheriting screen depth.
   const stacks=new Map(),scenicFocus=g.sceneryFocus(layer,project);
   for(const item of layer.paths){
    if(layer.role==='surroundings'){
     if(innerWidth<768&&item.secondary)continue;
     const alpha=layer.alpha*g.sceneryOpacity(item.points,scenicFocus);if(alpha*item.alpha>.001)commands.push({kind:'prop',depth:-100+depthOf(item.points)*.001,item,alpha});continue;
    }
    if(item.skin){
     const fragments=plane?g.clipFilled(item.points,depthAt,cameraPoint,screenPoint):[item.points];
     for(const points of fragments)commands.push({kind:'prop',depth:depthOf(points),item:{...item,points},alpha:layer.alpha});continue;
    }
    if(item.role==='volume'){
     // Closed orb rings cross their opaque equator fill. Sort their front and
     // rear arcs independently; back-layer bridges use their own depth whole.
     const fragments=plane&&layer.role==='front-work'&&!item.fill?splitAcrossPlane(item.points):[item.points];
     for(const points of fragments)commands.push({kind:'prop',depth:depthOf(points),item:{...item,points},alpha:layer.alpha});
     continue;
    }
    const role=item.role||'work';if(!stacks.has(role))stacks.set(role,{depth:depthOf(item.points),index:0});
    const stack=stacks.get(role);commands.push({kind:'prop',depth:stack.depth+stack.index++*1e-6,item,alpha:layer.alpha});
   }
  }
  if(trailEnergy>.01&&trailSpan>.001){
   const trail=g.lightTrail(current,trailDirection,trailSpan,36,ambientPhase).map(p=>({...p,q:projectPoint(p.point)}));
   for(let i=1;i<trail.length;i++){
    const visible=project.camera.perspectiveWeight?project.clip([trail[i-1].point,trail[i].point]).map(points=>points.map(projectPoint)):[[trail[i-1].q,trail[i].q]];
    for(const points of visible){if(Math.hypot(...points[0].map((value,axis)=>value-points[1][axis]))<1e-7)continue;
     for(const fragment of plane?splitAcrossPlane(points):[points])commands.push({kind:'trail',depth:depthOf(fragment),points:fragment,alpha:trail[i].alpha*trailEnergy});}
   }
  }
  const skinMaterials=new Map(g.skinMaterials(illustrations).map(m=>{const gradient=ctx.createRadialGradient(m.fx,m.fy,0,m.cx,m.cy,m.r);for(const [offset,color]of m.stops)gradient.addColorStop(offset,color);return [m.id,gradient];}));
  commands.sort((a,b)=>a.depth-b.depth);
  for(const command of commands){
   if(command.kind==='strand'){drawLine(command.line);continue;}
   if(command.kind==='trail'){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle=g.config.tones.human;
    for(const width of [9,3,1]){ctx.lineWidth=width;ctx.globalAlpha=command.alpha*(width===9?.06:width===3?.22:.8);path(ctx,command.points);ctx.stroke();}ctx.restore();continue;
   }
   const item=command.item;
   if(item.skin){ctx.beginPath();ctx.moveTo(item.points[0][0],item.points[0][1]);for(const p of item.points.slice(1))ctx.lineTo(p[0],p[1]);ctx.closePath();}else path(ctx,item.points);
   const material=item.skin?skinMaterials.get(item.surface):null;ctx.globalAlpha=command.alpha*item.alpha;if(item.fill){ctx.fillStyle=material||item.fill;ctx.fill();}ctx.strokeStyle=material||item.color;
   // Fine dust retains its optical size on phones; other prop lines stay lighter.
   ctx.lineWidth=item.width*(innerWidth<768&&!item.particle?.7:1);ctx.stroke();
  }
  const labelVisibility=(plane?g.smooth((plane.facing-.10)/.25):1)*(1-g.smooth(project.camera.focusWeight/.25));
  ctx.textAlign='center';
  for(const layer of illustrations){
   const alpha=(layer.textAlpha??layer.alpha)*(layer.role==='front-work'?labelVisibility:1);if(alpha<=.005||innerWidth<768)continue;
   for(const item of layer.texts){const q=projectPoint(item.point);ctx.globalAlpha=alpha;ctx.fillStyle=item.color;ctx.font='500 '+(innerWidth<768?8:item.size)+'px '+(g.config.locale==='th'?'ProfileThai, sans-serif':'Sora, sans-serif');ctx.fillText(item.text,q[0],q[1]);}
  }
  ctx.textAlign='start';ctx.globalAlpha=1;

  bitmapDetail=detail;readingThread?.write(readingFrame);if(cue)readingThread?.animate(dt/1000,cue,visible);updateNavigation();draws++;drawCost=drawCost*.9+(performance.now()-started)*.1;
  if(drawCost>8&&detail===1&&Math.abs(current-Math.round(current))<.02)detail=2;
  dirty=bitmapDetail!==detail;
  if(openingActive||bitmapDetail!==detail||readingThread?.pending()||trailEnergy>.01||current!==target||Math.abs(exploded-desired)>.001||Math.abs(px-tx)>.0001||Math.abs(py-ty)>.0001)wake();
 }
 function wake(){if(!frameId&&!document.hidden&&visible&&!staticLayout())frameId=requestAnimationFrame(render);}
 function scroll(){
  document.documentElement.classList.toggle('profile-story-active',scrollY<(anchors[9]??Infinity)-1);
  const finaleHost=finale?.host(scrollY);
  const host=finaleHost|| (scrollY>=(anchors[10]??Infinity)-1?contactHost:scrollY>=(anchors[9]??Infinity)-1?summaryHost:originalHost);
  if(canvas.parentElement!==host){host.appendChild(canvas);contact.classList.toggle('live-art',host===contactHost);professional.classList.toggle('live-art',host===summaryHost);layoutCorrection=null;measure({navigation:true});}
  const rect=canvas.getBoundingClientRect();visible=rect.bottom>0&&rect.top<innerHeight;if(!visible){resetTrail();readingThread?.hide();finale?.resetTime();}
  target=positionAt(scrollY);dirty=true;updateNavigation();
  if(readingWidth===innerWidth&&readingHeight===innerHeight)readingContext=captureReadingContext();
  wake();}
 addEventListener('scroll',scroll,{passive:true});
 addEventListener('resize',()=>{const structural=previousWidth!==innerWidth||Math.abs(previousHeight-innerHeight)>120;previousWidth=innerWidth;previousHeight=innerHeight;if(structural){activate(true);}else {measure();readingWidth=innerWidth;readingHeight=innerHeight;readingContext=captureReadingContext();}scroll();});
 beneath.addEventListener('toggle',()=>{measure();wake();});
 workPaths.forEach(el=>el.addEventListener('toggle',()=>{measure();wake();}));
 document.querySelector('.finale-catalog')?.addEventListener('toggle',()=>{measure({preserve:true});scroll();wake();});
 document.addEventListener('visibilitychange',()=>{last=0;resetTrail();if(document.hidden)finale?.resetTime();if(!document.hidden){measure();wake();}});
 const observer=new IntersectionObserver(()=>scroll(),{rootMargin:'100px'});observer.observe(stage);observer.observe(summaryHost);observer.observe(contactHost);
 const ro=new ResizeObserver(()=>measure());ro.observe(journey);
 addEventListener('pointermove',e=>{if(!matchMedia('(hover: hover) and (pointer: fine)').matches||reduced)return;const r=stage.getBoundingClientRect();tx=g.clamp((e.clientX-r.left)/Math.max(r.width,1)-.5,-.5,.5)*.1;ty=g.clamp((e.clientY-r.top)/Math.max(r.height,1)-.5,-.5,.5)*.1;wake();},{passive:true});
 document.addEventListener('pointerleave',()=>{tx=ty=0;wake();});
 addEventListener('pageshow',measure);document.fonts.ready.then(measure);
 activate();scroll();
 // Read-only diagnostics for reproducible QA; no control over user content.
 window.ProfileExperience=Object.freeze({snapshot:()=>({finale:finale?.snapshot(),opening:{active:openingActive,seconds:openingSeconds,phase:ambientPhase},readingThread:readingThread?.snapshot(),cinematic:readingThread?.cinematicSnapshot(),mode,reduced,current,target,detail,draws,drawCost,anchors:[...anchors],width:w,height:h,exploded,dirty,trailEnergy,trailDirection,trailSpan,layoutCorrection:layoutCorrection?{...layoutCorrection}:null,shot:g.storyAt(current).index,sceneCount:g.sequence.length,camera:renderedCamera?{...renderedCamera,target:[...renderedCamera.target]}:null})});
})();
