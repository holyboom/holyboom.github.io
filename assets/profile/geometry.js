/* Articulated human / environment geometry. Shared by Canvas, SVG and reversibility QA.
   Every anatomical strand keeps its identity through every chapter. */
(function(root){'use strict';
 const cfg=typeof module==='object'&&module.exports?require('./scenes.js'):root.ProfileScenes;
 const motion=typeof module==='object'&&module.exports?require('./motion.js'):root.ProfileMotion;
 const hands=typeof module==='object'&&module.exports?require('./hand-shapes.js'):root.ProfileHandShapes;
 const floors=typeof module==='object'&&module.exports?require('./floors.js'):root.ProfileFloors;
 if(!motion)throw new Error('Profile performance module unavailable');
 const PI=Math.PI,TAU=PI*2,SAMPLES=48;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const mix=(a,b,t)=>a+(b-a)*t;
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 const add=(a,b)=>a.map((n,i)=>n+b[i]);
 const sub=(a,b)=>a.map((n,i)=>n-b[i]);
 const mul=(a,k)=>a.map(n=>n*k);
 const lerp=(a,b,t)=>a.map((n,i)=>mix(n,b[i],t));
 const norm=a=>mul(a,1/(Math.hypot(...a)||1));
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const sequence=[],starts=[];
 for(let chapter=0;chapter<cfg.scenes.length;chapter++){
  starts.push(sequence.length);const base=cfg.scenes[chapter],beats=cfg.story?.find(s=>s.chapter===chapter)?.beats||[{action:base.verb,caption:base.caption,pose:base.pose,prop:'none',tone:'dream',meaning:base.meaning||'Imagination',energy:1}];
  beats.forEach((beat,step)=>sequence.push({...base,...beat,chapter,step,count:beats.length}));
 }
 function resolve(position){
  position=clamp(position,0,cfg.scenes.length-1);const chapter=Math.floor(position),start=starts[chapter],count=sequence[start].count,local=(position-chapter)*count,step=Math.min(count-1,Math.floor(local)),phase=local-step;
  const hold=cfg.actingHolds?.find(item=>item.beat===start+step),begin=hold?.until??.20;
  return Math.min(sequence.length-1,start+step+smooth((phase-begin)/(.85-begin)));
 }
 // During the recovered-light passage the caption changes when the new
 // workpiece takes the lead. A single window controls both language editions.
 const lessonHandoffs=motion.lessonHandoffs;
 function storyAt(position){
  const timeline=resolve(position),from=Math.floor(timeline),handoff=lessonHandoffs[from];
  const switchAt=handoff?(handoff[0]+handoff[1])*.5:(timeline>=13&&timeline<18?.62:.24);
  const index=Math.min(sequence.length-1,from+(timeline-from>switchAt?1:0));
  return {...sequence[index],index,total:sequence.length,timeline};
 }
 const rgb=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
 // One emotional clock for material, set, and source light. No time-based pulse.
 function dramaState(timeline){
  const keys=cfg.drama.keys,empty={strength:0,isolation:0,pressure:0,doubt:0,repair:0,rise:0,body:1,glow:1};
  if(timeline<=cfg.drama.start||timeline>=cfg.drama.end)return empty;
  const i=keys.findIndex(k=>k.at>=timeline),a=keys[i-1],b=keys[i],t=smooth((timeline-a.at)/(b.at-a.at)),state={};
  for(const key of ['isolation','pressure','doubt','repair','rise','body','glow'])state[key]=mix(a[key],b[key],t);
  state.strength=smooth((timeline-12)/.85)*(1-smooth((timeline-17.25)/1.15));return state;
 }
 function dramaAt(position){return dramaState(resolve(position));}
 function paletteAt(position){const timeline=resolve(position),a=sequence[Math.floor(timeline)],b=sequence[Math.min(sequence.length-1,Math.floor(timeline)+1)],t=timeline%1;
  const ac=rgb(cfg.tones[a.tone]),bc=rgb(cfg.tones[b.tone]);return {accent:'#'+ac.map((n,i)=>Math.round(mix(n,bc[i],t)).toString(16).padStart(2,'0')).join(''),energy:mix(a.energy??1,b.energy??1,t)};
 }
 function weave(u,v){
  const a=u*TAU,b=v*TAU,R=.68+.17*Math.cos(3*a-.4),r=.39+.16*Math.sin(3*a+.3),x=(R+r*Math.cos(b))*Math.cos(a),y=(R+r*Math.cos(b))*Math.sin(a)*1.18,z=r*Math.sin(b)+.62*Math.sin(2*a)+.18*Math.cos(3*a),tilt=.5;
  return [x*Math.cos(tilt)-y*Math.sin(tilt)+.12,x*Math.sin(tilt)+y*Math.cos(tilt)+.13,z];
 }
 function createScene(index,performance=null,bodyOnly=false,detail=1){
  const options=sequence[index],p=performance||motion.poseAt(index),lines=[];let part='signal';
  const basis=(q,f)=>f?[q[0]*f.x[0]+q[1]*f.y[0]+q[2]*f.z[0],q[0]*f.x[1]+q[1]*f.y[1]+q[2]*f.z[1],q[0]*f.x[2]+q[1]*f.y[2]+q[2]*f.z[2]]:q;
  const emit=(fn,group='human',alpha=1,width=.7,important=false)=>{
   // Static scene anatomy is always replaced by the sampled live rig in frame().
   // Keep its identity/paint metadata, without retaining unused vertex arrays.
   // Scene zero still needs every source point for the opening formation.
   const unusedCachedBody=!performance&&index>0&&part!=='environment';
   lines.push({id:lines.length,part,group,alpha,width,important,points:unusedCachedBody||(bodyOnly&&detail>1&&Math.floor(lines.length/2)%detail&&!important)?[]:Array.from({length:SAMPLES},(_,i)=>fn(i/(SAMPLES-1)))});
  };
  const segment=(a,b,group='human',alpha=1,width=.7,important=false)=>emit(t=>{const q=lerp(a,b,t),bow=Math.sin(PI*t);if(['prop','architecture','world','code','intent'].includes(group)){q[0]+=.07*bow;q[2]+=.10*bow;}return q;},group,alpha,width,important);
  function poly(points,group='human',alpha=1,width=.7,important=false){
   const closed=Math.hypot(...sub(points[0],points[points.length-1]))<.0001,vertices=closed?points.slice(0,-1):points;
   emit(t=>{const n=vertices.length,segments=closed?n:n-1,f=t*segments,i=Math.min(segments-1,Math.floor(f)),v=f-i;
    const at=k=>vertices[closed?(k+n)%n:Math.max(0,Math.min(n-1,k))],a=at(i-1),b=at(i),c=at(i+1),d=at(i+2);
    return b.map((x,j)=>.5*((2*x)+(-a[j]+c[j])*v+(2*a[j]-5*x+4*c[j]-d[j])*v*v+(-a[j]+3*x-3*c[j]+d[j])*v*v*v));
   },group,alpha,width,important);
  }
  function ellipsoid(center,radii,group='human',alpha=1,lat=7,lon=8,tilt=0,frame=null){
   if(group==='human'){lat*=2;lon*=2;}
   const pt=(a,b)=>{const v=[radii[0]*Math.sin(a)*Math.cos(b),radii[1]*Math.cos(a),radii[2]*Math.sin(a)*Math.sin(b)];return add(center,basis([v[0],v[1]*Math.cos(tilt)-v[2]*Math.sin(tilt),v[1]*Math.sin(tilt)+v[2]*Math.cos(tilt)],frame));};
   for(let i=1;i<=lat;i++)emit(t=>pt(i/(lat+1)*PI,t*TAU),group,alpha,.65);
   for(let i=0;i<lon;i++)emit(t=>pt(t*PI,i/lon*TAU),group,alpha,.75,i%4===0);
  }
  function tube(a,b,r0,r1,group='human',alpha=1,endFrame=null){const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[1])>.9?[1,0,0]:[0,1,0])),v=cross(axis,u);
   const pt=(t,angle)=>{const radial=add(mul(u,Math.cos(angle)*mix(r0,r1,t)),mul(v,Math.sin(angle)*mix(r0,r1,t))),tip=endFrame?basis([Math.cos(angle)*r1,Math.sin(angle)*.024,0],endFrame):radial;
    return add(lerp(a,b,t),endFrame?lerp(radial,tip,smooth((t-.58)/.42)):radial);};
   const count=group==='human'?16:6;
   for(let i=0;i<count;i++)emit(t=>pt(t,i/count*TAU+Math.sin(PI*t)*.34),group,alpha,.85,i===0);
   for(let i=1;i<=(group==='human'?10:3);i++){const at=i/(group==='human'?11:4);emit(t=>pt(at,t*TAU),group,alpha*(endFrame?1-.72*smooth((at-.52)/.40):1),.6);}
  }
  function panel(c,u,v,alpha=1){
   const normal=norm(cross(u,v)),pt=(x,y)=>add(c,add(add(mul(u,x),mul(v,y)),mul(normal,-.18*(1-x*x-y*y)+.055*Math.sin(PI*x)*Math.cos(PI*y))));
   // One soft membrane, with curved crossing strands instead of window frames.
   emit(t=>pt(Math.cos(t*TAU),Math.sin(t*TAU)),'prop',alpha*.7,.8,true);
   for(let i=0;i<7;i++){const q=-.9+i*.3,r=Math.sqrt(1-q*q);
    emit(t=>pt((t*2-1)*r,q+.075*Math.sin(t*PI)),'prop',alpha*.65,.65);
    emit(t=>pt(q+.075*Math.sin(t*PI),(t*2-1)*r),'prop',alpha*.65,.65);
   }
   for(let i=0;i<7;i++){const q=.24+i*.105;emit(t=>pt(Math.cos(t*TAU)*q,Math.sin(t*TAU)*q),'ui',alpha*.43,.55);}
   emit(t=>pt(.44+Math.cos(t*TAU)*.17,-.15+Math.sin(t*TAU)*.22),'ui',alpha*.75,.75);
  }
  // Anatomy is evaluated from a fixed-proportion rig. No vertex morph or gravity
  // contraction is applied to this layer after the opening formation.
  const wristR=p.frames?.wristR,wristL=p.frames?.wristL,headFrame=p.frames?.head,chestFrame=p.frames?.chest;
  const pen=p.light||add(p.handR,[.02,.02,.06]);
  // A stationary emitter is a point; segment() deliberately bows intent paths.
  emit(()=>[...pen],'intent',1,1.25,true);
  const tool=p.tool;
  segment(tool?.tip||pen,tool?.shaftEnd||pen,'tool',tool?.alpha??0,1.35,true);
  part='torso';
  const neck=add(p.shoulder,basis([0,.08,0],chestFrame));
  tube(neck,add(p.head,basis([0,-.22,0],headFrame)),.078,.075,'human');
  const torso=(t,a)=>{const center=lerp(add(p.hip,[0,-.065,0]),add(p.shoulder,basis([0,.065,0],chestFrame)),t),radius=.21+.073*Math.sin(t*PI*.82);
   return add(center,basis([Math.cos(a)*radius,0,Math.sin(a)*(.14+.04*Math.sin(t*PI))],chestFrame));};
  for(let j=0;j<21;j++)emit(t=>torso(j/20,t*TAU),'human',.80,.65);
  for(let j=0;j<26;j++)emit(t=>torso(t,j/26*TAU),'human',.88,.75,j%5===0);
  ellipsoid(add(p.hip,[0,-.05,0]),[.245,.145,.16],'human',.65,3,5,0,p.frames?.pelvis);
  poly([add(neck,basis([-.13,-.025,.115],chestFrame)),add(neck,basis([0,-.13,.18],chestFrame)),add(neck,basis([.13,-.025,.115],chestFrame))],'detail',.7,.7,true);
  part='head';
  // A quiet, blank head. Chin/occiput and the neck establish direction without eyes.
  const cranial=(a,b)=>{const y=Math.cos(a),jaw=1-.16*Math.max(0,-y),x=.19*Math.sin(a)*Math.cos(b)*jaw,front=Math.sin(b),z=(front>0?.155:.192)*Math.sin(a)*front;
   const centre=.048*smooth((-y-.12)/.88)-.012*smooth((y-.25)/.75);
   return add(p.head,basis([x,.25*y,z+centre],headFrame));};
  for(let j=1;j<15;j++)emit(t=>cranial(j/15*PI,t*TAU),'human',.88,.65);
  for(let j=0;j<22;j++)emit(t=>cranial(t*PI,j/22*TAU),'human',.82,.7,j%7===0);
  for(const side of [-1,1]){
   const shoulder=side<0?p.shoulderL:p.shoulderR,elbow=side<0?p.elbowL:p.elbowR,hand=side<0?p.handL:p.handR,frame=side<0?wristL:wristR;
   part=side<0?'upperArmL':'upperArmR';ellipsoid(shoulder,[.115,.12,.105],'human',.65,3,4,0,chestFrame);
   tube(shoulder,elbow,.104,.075);
   part=side<0?'forearmL':'forearmR';tube(elbow,add(hand,basis([0,0,-.018],frame)),.075,.032,'human',1,frame);
   part=side<0?'handL':'handR';
   const contact=side<0?p.contacts?.left:p.contacts?.right,shape=contact.shape;
   // The approved C glove has a pebble palm, pill fingers and a sparse surface
   // network. Preserve the original 27 strand identities per hand.
   const skin=hands.skin(shape),palmAt=(t,a)=>add(hand,basis(skin.palm(t,a),frame));
   for(const [angle,alpha,width,important]of [[0,.72,.95,true],[PI,.72,.95,true],[PI/2,.30,.65,false],[PI*1.5,.25,.6,true]])emit(t=>palmAt(t,angle),'hand',alpha,width,important);
   for(const at of [.25,.50,.75])emit(t=>palmAt(at,t*TAU),'hand',.27,.6);
   for(let i=0;i<shape.fingers.length;i++){
    const surface=skin.fingers[i];
    for(let strand=0;strand<4;strand++){
     const contour=strand<2,angle=contour?strand*PI:(strand===2?PI/2:PI*1.5);
     emit(t=>add(hand,basis(strand===3?surface(.38,t*TAU):surface(t,angle),frame)),'hand',contour?.67:strand===2?.26:.16,contour?.85:.5,contour);
    }
   }
   part=side<0?'legL':'legR';
   const hip=side<0?p.hipL:p.hipR,knee=p.knees[side<0?0:1],foot=p.feet[side<0?0:1];
   tube(hip,knee,.12,.088);tube(knee,foot,.088,.060);
   ellipsoid(add(foot,[0,-.04,.08]),[.095,.08,.19],'human',.72,3,5,0,p.frames?.[side<0?'footL':'footR']);
  }
  part='support';
  // The seat, palm rest and floor patches share the rig's contact coordinates.
  const floor=p.support?.floorY??-1.30,seat=p.support?.seatCenter||[-.46,p.support?.seatY??-.74,-.08];
  const chairAlpha=.78*(p.seatAmount??(p.seated?1:0));
  const seatPoint=(x,z)=>[seat[0]+x,seat[1],seat[2]+z];
  for(let j=0;j<6;j++)emit(t=>seatPoint(Math.cos(t*TAU)*(.28-j*.017),Math.sin(t*TAU)*(.29-j*.017)),'support',chairAlpha,.7,j===0);
  for(const x of [-.20,.20])for(const z of [-.20,.20])poly([seatPoint(x,z),[seat[0]+x,floor+.08,seat[2]+z],[seat[0]+x*1.15,floor,seat[2]+z*1.1]],'support',chairAlpha*.8,.7);
  // A low curved back and fixed woven contact patch make the seat legible.
  for(const x of [-.22,.22])poly([seatPoint(x,-.19),[seat[0]+x,seat[1]+.35,seat[2]-.29],[seat[0]+x*.85,seat[1]+.48,seat[2]-.28]],'support',chairAlpha*.72,.9);
  for(let j=0;j<7;j++)emit(t=>[seat[0]+(t*2-1)*.22,seat[1]+.12+j*.055,seat[2]-.27+.05*Math.cos((t-.5)*PI)],'support',chairAlpha*.44,.6);
  const ground=(x,z)=>[x,floor-.012+.01*Math.sin((x+.4)*PI)*Math.sin(z*PI),z];
  const storyTime=(p.phase.from||0)+p.phase.progress,supportGlow=.10*Math.exp(-(((storyTime-16.6)/.75)**2));
  for(let j=0;j<11;j++){const q=(j/10*2-1)*.95,span=Math.sqrt(1-q*q),alpha=.08+(.18+supportGlow)*(1-q*q);emit(t=>ground(-.38+q*.74,.28+(t*2-1)*.72*span),'support',alpha,.6);emit(t=>ground(-.38+(t*2-1)*.74*span,.28+q*.72),'support',alpha,.6);}
  const table=p.support?.tableSupport||p.support?.handSupport||[-.62,-.19,.49];
  // Keep the palm rest through contact/release; let it leave with the seated
  // workspace instead of remaining as an unexplained oval in standing shots.
  const tablePresence=Math.max(p.seatAmount||0,1-smooth((storyTime-6.35)/.14),smooth((storyTime-11.80)/.16)*(1-smooth((storyTime-16.75)/.15)));
  for(let j=0;j<4;j++)emit(t=>[table[0]+Math.cos(t*TAU)*(.22+j*.012),table[1],table[2]+Math.sin(t*TAU)*(.19+j*.01)],'support',.22*tablePresence,.7,j===0);
  for(const x of [-.14,.14])segment([table[0]+x,table[1],table[2]],[table[0]+x,floor,table[2]],'support',.15*tablePresence,.65);
  const dock=p.tool?.dock,restAlpha=p.phase.to===3?smooth((p.phase.progress-.04)/.1)*(1-smooth((p.phase.progress-.52)/.14))*.55:0;
  const restCenter=dock?lerp(dock.tip,dock.shaftEnd,.5):[0,0,0],restAxis=dock?norm(sub(dock.shaftEnd,dock.tip)):[1,0,0],restSide=dock?norm(cross(dock.normal,restAxis)):[0,0,1];
  for(let j=0;j<3;j++)emit(t=>add(restCenter,add(mul(restAxis,Math.cos(t*TAU)*(.124+j*.007)),mul(restSide,Math.sin(t*TAU)*(.022+j*.006)))),'support',restAlpha*(1-j*.2),.6,j===0);
  for(const foot of p.feet)emit(t=>[foot[0]+Math.cos(t*TAU)*.15,floor,foot[2]+.07+Math.sin(t*TAU)*.25],'support',.22,.65);
  if(bodyOnly)return lines;
  part='environment';
  // A drafting surface becomes a display, then an open system. Same panel strands.
  const name=options.pose,isDesk=p.seated,quiet=name==='alone';
  const pc=isDesk?[.18,-.25,.64]:name==='offer'?[.70,.42,.75]:name==='invite'?[1.30,.48,-.45]:[.79,.48,.15],pu=isDesk?[.82,0,0]:[.54,0,.10],pv=isDesk?[0,0,.53]:[0,.62,0];
  panel(pc,pu,pv,quiet?.25:name==='invite'?.24:.82);
  const sideAlpha=['draw','alone','stand','invite'].includes(name)?.06:.5;
  panel([-1.15,.45,-.65],[.27,0,-.06],[0,.40,0],sideAlpha);
  panel([1.25,.95,-.63],[.28,0,.05],[0,.37,0],sideAlpha);
  // Table support transforms into panel stands. Furniture grounds seated poses.
  for(const x of [-.52,.84]){const a=isDesk?[x,-.25,.38]:[x,.05,-.22];segment(a,[x,-1.25,.38],'prop',isDesk?.48:.16,.85);}
  panel([-.54,-.44,-.08],[.29,0,0],[0,0,.32],isDesk?.45:.02);
  for(const x of [-.79,-.3])segment([x,-.44,-.26],[x,-1.28,-.35],'prop',isDesk?.45:.02,.8);
  poly([pen,pen,pen,pen,pen],'intent',0,.9,false);
  // Rounded field nodes gather where architectural marks used to be.
  for(let j=0;j<4;j++){
   const amount=['build','connect'].includes(name)?1:['shape','experience','offer'].includes(name)?.65:.12;
   const x=(name==='shape'?.02:.22)+(j%2)*.51,z=.45+Math.floor(j/2)*.35,base=isDesk?-.23:name==='shape'?.38+Math.floor(j/2)*.22:-.20,h=(.25+j*.11)*amount;
   const at=(a,b)=>[x+Math.sin(a)*Math.cos(b)*.19,base+h*.5+Math.cos(a)*Math.max(.10,h*.65),z+Math.sin(a)*Math.sin(b)*.16];
   for(let k=0;k<2;k++)emit(t=>at((k+1)/3*PI,t*TAU),'architecture',.65,.65);
   for(let k=0;k<4;k++)emit(t=>at(t*PI,k/4*TAU),'architecture',.6,.65);
   ellipsoid([x,base+h*.5,z],[.21,.21,.21],'architecture',name==='shape'?.65:.07,3,4);
  }
  // Connections pass behind the maker, never across the face.
  for(let j=0;j<8;j++)emit(t=>{const a=t*TAU*.82,rad=1.18+j*.035;return [Math.cos(a)*rad+.1,Math.sin(a)*rad*.76+.14,-.64+Math.sin(a)*.15];},'network',['connect','experience','shape','offer'].includes(name)?.32:.035,.65);
  // The same 100 strand identities become terraces, wells, flowing pathways or
  // linked islands. Every beat has its own authored geometry and silhouette.
  for(const line of floors.scene(index).lines)lines.push({id:lines.length,part:'environment',group:'world',floor:true,alpha:line.alpha,width:line.width,important:line.important,points:line.points});
  for(let j=0;j<18;j++){const x=-1.9+j*.22,z=-1.3+(j%3)*.08;emit(t=>[x+.20*Math.sin(t*PI*1.4+j*.22),-1.25+t*(2.9-((j*7)%5)*.13),z+.15*Math.sin(t*PI)],'code',quiet?.025:.095,.45);}
  if(index===0){
   // The approved A material: a large folded, continuous woven surface, not a mannequin.
   for(let l=0;l<lines.length;l++){
    const line=lines[l];if(l>=192&&line.group!=='world'){line.alpha=0;continue;}
    if(l<192){line.points=Array.from({length:SAMPLES},(_,s)=>weave(l<96?l/95:s/(SAMPLES-1),l<96?s/(SAMPLES-1):(l-96)/95));line.group=l===0?'intent':'fabric';line.alpha=l===0?.8:.78;line.width=l===0?1:.7;line.important=l%8===0;}
   }
  }
  if(index>0)for(const line of lines){
   if(['prop','ui','architecture'].includes(line.group))line.alpha=0;
   if(['code','network'].includes(line.group))line.alpha*=.10;
   // Terrain ink is authored per beat; do not dim it a second time through
   // the foreground action's energy. Quiet scenes still need a readable floor.
   if(['human','hair','detail'].includes(line.group))line.alpha*=.76;
  }
  return lines;
 }
 const cache=[];
 const scene=i=>cache[i]||(cache[i]=createScene(i));
 const LINES=scene(0).length;
 // The complete body moves together so hands never detach from arms. The world follows.
 const timing={intent:[0,.76],hand:[0,.76],human:[0,.76],hair:[0,.76],detail:[0,.76],ui:[.22,.95],prop:[.22,.95],architecture:[.30,1],network:[.24,1],world:[.36,1],code:[.18,.96]};
 function openingPhase(seconds){const o=cfg.opening;return seconds*o.rate+o.paceAmount*Math.sin(seconds*o.paceFrequency);}
 function openingDeformer(phase){
  if(!phase)return q=>q;
  const sx=1+.14*Math.sin(phase),sy=1-.10*Math.sin(phase),sz=1+.10*Math.sin(phase*.7),angle=.16*Math.sin(phase*.53),c=Math.cos(angle),s=Math.sin(angle);
  return q=>{const x=q[0]*sx+.16*(Math.sin(phase*.61+q[1]*1.4)-Math.sin(q[1]*1.4)),y=q[1]*sy+.12*(Math.sin(phase*.83+q[0]*1.7)-Math.sin(q[0]*1.7)),z=q[2]*sz+.16*(Math.sin(phase*.9+(q[0]+q[1])*.8)-Math.sin((q[0]+q[1])*.8));return [x*c-z*s,y,x*s+z*c];};
 }
 function frame(position,detail=1,explode=0,ambientPhase=0,idleSeconds=0){
  const timeline=resolve(position),a=Math.floor(timeline),b=Math.min(a+1,sequence.length-1),raw=timeline-a;
  const elastic=openingDeformer(a===0?ambientPhase:0);
  // The resting opening only needs its visible membrane, not a rebuilt human.
  if(timeline===0&&ambientPhase)return scene(0).filter(s=>!(detail>1&&Math.floor(s.id/2)%detail&&!s.important&&!s.floor)).map(line=>line.id<192?{...line,points:line.points.map(elastic)}:line);
  const source=scene(a),destination=raw?scene(b):source,p=motion.poseAt(timeline,idleSeconds),body=createScene(a,p,true,a>0?detail:1);
  const lines=[],pulse=Math.sin(PI*raw)**2,attractor=p.light,floorTransform=floors.deformer(raw,p),emotion=dramaState(timeline);
  for(let l=0;l<source.length;l++){
   const s=source[l],d=destination[l];if(detail>1&&Math.floor(l/2)%detail&&!s.important&&!s.floor)continue;
   if(l<body.length&&a>0){const live=body[l],material=['human','hand','detail'].includes(live.group)?emotion.body:1;lines.push({...live,alpha:live.alpha*(live.group==='human'?.76:1)*material});continue;}
   if(s.alpha<=.005&&d.alpha<=.005&&!(a===0&&l<body.length)){lines.push(s);continue;}
   const range=a===0?[0,.88]:(timing[s.group]||[0,1]),t=smooth((raw-range[0])/(range[1]-range[0]));
   const targetLine=a===0&&l<body.length?body[l]:d;
   const environment=['prop','ui','architecture','network','world','code','fabric'].includes(s.group),pull=environment?cfg.gravity.collapse:0;
   const angle=pulse*cfg.gravity.swirl*(environment?1:0),c=Math.cos(angle),sn=Math.sin(angle),radius=1-pull*pulse;
   const points=s.points.map((q,k)=>{
    const sourcePoint=a===0&&l<192?elastic(q):q,dest=targetLine.points[k];let v=[mix(sourcePoint[0],dest[0],t),mix(sourcePoint[1],dest[1],t),mix(sourcePoint[2],dest[2],t)];
    if(s.floor)return floorTransform(v);
    if(pulse>0&&pull>0&&!(a===0&&l<body.length)){const x=v[0]-attractor[0],y=v[1]-attractor[1],z=v[2]-attractor[2];v=[attractor[0]+radius*(x*c-z*sn),attractor[1]+radius*y,attractor[2]+radius*(x*sn+z*c)];}
    if(explode&&environment){v[0]+=(s.group==='prop'?.25:.55)*explode;v[2]-=(s.group==='network'?.7:.3)*explode;}
    return v;
   });
   const group=raw>.5?targetLine.group:s.group;
   lines.push({...s,group,alpha:mix(s.alpha,targetLine.alpha,t),points});
  }
  return lines;
 }
 function lightAt(position,ambientPhase=0,idleSeconds=0){
  const timeline=resolve(position),light=motion.lightAt(timeline,idleSeconds);return timeline>=1?light:lerp(openingDeformer(ambientPhase)(scene(0)[0].points[0]),light,smooth(timeline/.88));
 }
 // Exposure follows actual elapsed time, including frames slower than the
 // simulation tick. The first span after reversal fits inside the new path.
 function trailSpanAt(previousSpan,travel,elapsedMs){
  if(elapsedMs<=0)return previousSpan;
  const exposureMs=140,target=Math.min(cfg.gravity.trailSpan,Math.abs(travel)*exposureMs/elapsedMs);
  return mix(previousSpan,target,1-Math.exp(-elapsedMs/exposureMs));
 }
 function lightTrail(position,direction=1,span=cfg.gravity.trailSpan,count=32,ambientPhase=0,idleSeconds=0){
  return Array.from({length:count},(_,i)=>{const age=i/(count-1);return {point:lightAt(position-direction*span*age,ambientPhase,idleSeconds),alpha:(1-age)**1.7};});
 }
 // Recognizable action props sit in front of the woven world. Colour supports their meaning.
 const objectCache=[];
 function objectScene(index){
  if(objectCache[index])return objectCache[index];
  const shot=sequence[index],accent=cfg.tones[shot.tone],paths=[],texts=[],z=.95;
  const isDrawing=['blueprint','house'].includes(shot.prop);
  const point=(x,y,z=0)=>[x,y,z];
  const line=(points,{color=accent,width=2.1,fill=null,alpha=1,role='work',motion=null}={})=>paths.push({points:points.map(p=>point(...p)),color,width,fill,alpha,role,motion});
  const label=(text,x=.89,y=-.35,size=11)=>texts.push({text:cfg.text?.[text]??text,point:point(x,y),color:accent,size});
  const arc=(x,y,rx,ry,start=0,end=TAU,style={})=>line(Array.from({length:49},(_,i)=>{const a=mix(start,end,i/48);return [x+Math.cos(a)*rx,y+Math.sin(a)*ry];}),style);
  const roundRect=(x,y,w,h,style={})=>{
   const r=Math.min(.09,w*.15,h*.15),points=[];
   for(const [cx,cy,start] of [[x+w-r,y+h-r,0],[x+r,y+h-r,PI/2],[x+r,y+r,PI],[x+w-r,y+r,PI*1.5]])for(let i=0;i<9;i++){const a=start+i/8*PI/2;points.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
   points.push(points[0]);line(points,{fill:'#100f20',...style});
  };
  const check=(x,y)=>line([[x-.10,y],[x-.02,y-.07],[x+.14,y+.13]],{color:cfg.tones.care,width:3});
  const page=(x=.42,y=-.07)=>{roundRect(x,y,.9,.73);for(let i=0;i<3;i++)line([[x+.12,y+.54-i*.14],[x+.70-(i%2)*.15,y+.54-i*.14]],{width:1.3,alpha:.6});};
  const orb=(x,y,r,style={})=>{
   // A real woven ellipsoid, with the original outline/contact rim retained.
   arc(x,y,r,r,0,TAU,{fill:'#100f20',...style});
   for(const meridian of [-1.12,-.56,0,.56,1.12])line(Array.from({length:33},(_,i)=>{const a=i/32*TAU;return [x+r*Math.sin(a)*Math.cos(meridian),y+r*Math.cos(a),r*Math.sin(a)*Math.sin(meridian)];}),{width:.65,alpha:.48,...style,fill:null,role:'volume'});
   if(r>.22)for(const latitude of [-.55,-.18,.18,.55]){const radius=r*Math.sqrt(1-latitude*latitude);line(Array.from({length:33},(_,i)=>{const a=i/32*TAU;return [x+Math.cos(a)*radius,y+r*latitude,Math.sin(a)*radius];}),{width:.55,alpha:.38,...style,fill:null,role:'volume'});}
  };
  const link=(a,b,style={})=>line([a,[(a[0]+b[0])/2,(a[1]+b[1])/2+.12],b],{width:1.5,...style});
  const prop=shot.prop;
  if(prop==='none')return {paths,texts};
  if(['blueprint','house'].includes(prop)){
   // Two registration ticks and a clipped corner make this a sheet on a desk.
   // The valley folds sit flat until the pen clears them for inspection.
   const corners=[[.24,-.20],[1.54,-.20],[1.54,.64],[1.34,.84],[.24,.84],[.24,-.20]];
   const contour=corners.slice(1).flatMap((b,i)=>Array.from({length:6},(_,j)=>lerp(corners[i],b,j/6)));
   line([...contour,corners.at(-1)],{fill:'#171427',width:1.1});
   line([[1.34,.84],[1.33,.63],[1.54,.64]],{width:.9,alpha:.75});
   for(let i=0;i<5;i++)line([[.29,-.09+i*.16],[1.47,-.09+i*.16]],{width:.55,alpha:.22});
   for(const x of [.34,1.42])line([[x,-.12],[x,-.02]],{width:1});
   if(prop==='house'){
    const fold={color:cfg.tones.dream,width:1.55,motion:'fold'};
    for(const y of [.03,.51])line([[.52,y,0],[.52,y,.20],[.85,y,.41],[1.18,y,.20],[1.18,y,0]],fold);
    for(const [x,h] of [[.52,.20],[.85,.41],[1.18,.20]])line([[x,.03,h],[x,.51,h]],fold);
    for(let j=1;j<=4;j++){const y=.03+j*.096;line([[.52,y,.20],[.85,y,.41],[1.18,y,.20]],{...fold,width:.75,alpha:.58});}
    line([[.60,.03,.005],[.60,.03,.14],[.72,.03,.14],[.72,.03,.005]],fold);
    line([[.52,.51],[1.18,.51],[1.18,.03],[.52,.03],[.52,.51]],{width:1.15});
   }else{
    line([[.50,-.01],[1.23,-.01],[1.23,.48],[.50,.48],[.50,-.01]],{width:1.7});
    line([[.83,-.01],[.83,.23],[1.23,.23]],{width:1.3});arc(.83,.23,.15,.15,-PI/2,0,{width:.9});
   }
   label(prop==='house'?'A PLACE FOR PEOPLE':'THE FIRST DRAWING');
  }else if(['code','component','ai'].includes(prop)){
   // All three typing beats use the same physical keyboard. The result
   // it drives progresses from code, to a chip, to a new inference branch.
   line([[.24,-.20],[.06,-.48],[1.65,-.48],[1.54,-.20],[.24,-.20]],{fill:'#111c28',width:1.35,role:'keyboard'});
   for(let row=0;row<2;row++)for(let col=0;col<8;col++){
    const x=.31+col*.14+row*.035,y=-.31+row*.058;
    line([[x,y],[x+.095,y]],{width:2,alpha:.7,role:'keyboard',motion:'key'});
   }
   if(prop==='code'){
    roundRect(.29,-.15,1.19,.88,{width:1.3});
    for(let i=0;i<4;i++){const x=.42+(i%3)*.09,y=.52-i*.15;line([[x,y],[x+.19,y]],{width:2.4});line([[x+.25,y],[x+.54-i*.04,y]],{color:cfg.tones.care,width:1.35,motion:'output'});}
   }else if(prop==='component'){
    roundRect(.57,.06,.64,.54,{fill:'#132532',width:2.1});
    for(const dir of [-1,1])for(let i=0;i<4;i++){const y=.12+i*.12,x=dir===1?1.21:.57;line([[x,y],[x+dir*.13,y],[x+dir*.22,y+.06]],{width:1.35});}
    line([[.65,.24],[.82,.24],[.86,.43],[.91,.17],[.97,.33],[1.13,.33]],{color:cfg.tones.care,width:2,motion:'output'});
   }else{
    for(let i=0;i<3;i++){const y=.04+i*.22;orb(.42,y,.065);link([.48,y],[.88,.36],{color:cfg.tones.build});}
    orb(.89,.36,.17);link([1.02,.36],[1.34,.62],{color:cfg.tones.care,motion:'output'});orb(1.36,.63,.11,{color:cfg.tones.care});
   }
   label(prop==='ai'?'AI ENTERS THE WORKFLOW':prop==='code'?'DRAWING → CODE':'ONE WORKING COMPONENT');
  }else if(prop==='assembly'&&index===5){
   // The moving collar travels with the pinching hand into a fixed socket.
   for(const radius of [.24,.19])arc(.91,.65,radius,radius*.65,0,TAU,{fill:radius===.24?'#13212b':null,width:1.35});
   for(let i=0;i<3;i++)link([.91+(i-1)*.08,.55],[.50+i*.36,-.12],{width:.95,alpha:.55});
   for(const r of [.14,.10])arc(.91,.65,r,r*.74,0,TAU,{fill:r===.14?'#233148':null,color:cfg.palette.highlight,width:1.6,motion:'collar'});
   arc(.91,.65,.21,.143,0,TAU,{color:cfg.tones.care,motion:'seam',width:2.2});
   label('PARTS BECOME A SYSTEM',.89,-.52);
  }else if(['assembly','network','complexity'].includes(prop)){
   const nodes=prop==='complexity'?[[.36,.75],[.87,.88],[1.38,.69],[.46,.13],[1.0,.30],[1.48,-.05],[.79,-.25]]:prop==='assembly'?[[.33,.30],[.68,.57],[1.03,.37],[1.40,.53]]:[[.49,.15],[.91,.65],[1.31,.15]];
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(prop==='complexity'||j===i+1)link(nodes[i],nodes[j],{width:1.5,alpha:prop==='complexity'?.48:.98,motion:'span'});
   for(const [i,node]of nodes.entries())orb(...node,prop==='complexity'?.073:prop==='assembly'?.085:.102,{color:i===1?cfg.palette.highlight:accent});
   label(prop==='complexity'?'THE DEPTH BENEATH':prop==='network'?'PEOPLE · REQUIREMENTS · CODE':'PARTS BECOME A SYSTEM',.89,-.52);
  }else if(['brief','review','verified','lesson'].includes(prop)){
   if(prop==='brief'||prop==='review'&&index===11){
    page(.40,-.08);
    if(prop==='review'){
     arc(1.00,.50,.20,.18,0,TAU,{color:cfg.tones.human,fill:'#262033',motion:'lens'});
     line([[1.15,.38],[1.33,.20]],{width:3,motion:'lens'});
    }else line([[.43,.02],[.76,.18],[1.11,.17]],{color:cfg.tones.care,width:1.65});
   }else if(prop==='verified'){
    if(index===6){
     arc(.90,.33,.51,.32,0,TAU,{fill:'#122020',width:1.15});
     for(let i=0;i<7;i++){const a=PI*.15+i*PI*.118;line([[.90+Math.cos(a)*.40,.30+Math.sin(a)*.26],[.90+Math.cos(a)*.45,.30+Math.sin(a)*.3]],{width:1.35});}
     line([[.90,.28],[1.12,.51]],{width:2.3,motion:'needle'});
    }else{
     for(const r of [.32,.27,.18])arc(.88,.34,r,r*.88,0,TAU,{fill:r===.32?'#142321':null,width:r===.32?1.9:.9});
     check(.88,.34);
    }
   }else if(prop==='lesson'){
    // Two leaves share a spine. Sample straight edges on both leaves:
    // the Canvas strand painter otherwise rounds a four-vertex page into a loop.
    const seamBottom=[.84,.06,-.045],seamTop=[.84,.63,-.045];
    const leaf=(corners,fill)=>{
     const points=corners.flatMap((q,i)=>Array.from({length:6},(_,j)=>lerp(q,corners[(i+1)%corners.length],j/6)));
     line([...points,points[0]],{fill,color:'#a39ca7',width:.85});
    };
    leaf([[.437,.064,-.008],[.84,.016,-.054],[1.21,.057,.038],[1.21,.678,.038],[.84,.66,-.054],[.437,.692,-.008]],'#554161');
    leaf([[.46,.095,0],seamBottom,seamTop,[.46,.66,0]],'#e2d9c5');
    leaf([seamBottom,[1.18,.09,.045],[1.18,.65,.045],seamTop],'#f3ead5');
    line([seamBottom,seamTop],{color:'#6d6475',width:1.45});
    for(let i=0;i<3;i++){
     line([[.51,.50-i*.11,-.006],[.75-i*.015,.47-i*.11,-.032]],{width:1.2,color:'#55536c',alpha:.94});
     line([[.91,.47-i*.11,-.022],[1.11-i*.024,.49-i*.11,.028]],{width:1,color:'#686276',alpha:.90});
    }
    line([[1.05,.642,.012],[1.05,.46,.012],[1.08,.495,.020],[1.11,.47,.027],[1.11,.647,.027],[1.05,.642,.012]],{fill:'#9f4268',color:'#a64970',width:.7});
   }else{
    for(let i=0;i<3;i++)roundRect(.41+i*.08,-.06+i*.10,.77,.54,{fill:i===2?'#202a3a':'#141723',width:1.2,motion:i===2?'peel':null});
    line([[.72,.41],[.92,.57],[1.13,.40]],{width:1.9,motion:'peel'});
   }
   label({brief:'UNDERSTAND THE NEED',review:'A PERSON REVIEWS',verified:'REVIEWED BY A PERSON',lesson:'KEEP THE LESSON'}[prop]);
  }else if(prop==='remnant'){
   // A single piece of the failed surface stays in the left palm. The right
   // hand can support the bowed head, making doubt legible without a face.
   const outline=[[.46,-.035],[.66,-.01],[.77,.12],[.68,.11],[.76,.24],[.63,.19],[.65,.33],[.48,.25],[.40,.15],[.46,-.035]];
   // Retain the same sampled closed-plane contract as the larger work objects.
   line(outline.flatMap((a,i)=>i===outline.length-1?[a]:Array.from({length:4},(_,j)=>lerp(a,outline[i+1],j/4))),{color:cfg.tones.human,fill:'#17121d',width:1.7});
   // The selvedge rests on the palm. Loose ends taper and hang away
   // from that corner as the hand turns the failed piece to find the seam.
   for(let i=0;i<9;i++){
    const t=i/8,root=[.43+t*.26,.12+t*.08,.014];
    line([[.46+t*.16,-.018+t*.018,.014],root,[root[0]-.025,.15+.06*Math.sin(PI*t),.02]],{color:cfg.tones.human,width:.8,alpha:.65});
    if(i%2===0)line([root,[root[0]+.025,.16+t*.06,.05],[root[0]+.064,.16+t*.08,.07],[root[0]+.14,.10+t*.12,.11]],{color:cfg.tones.friction,width:1.1,motion:'fray'});
   }
   line([[.46,.025],[.57,.12],[.62,.08]],{color:cfg.palette.highlight,width:1.1,alpha:.75});
  }else if(prop==='ember'){
   const x=.89,y=.32;
   if(index===17){
    // A glowing coal on the palmar pad, with two loose incandescent fibres.
    // Its first and last vertex meet the glove at the same physical point.
    const heart=[[x,y],[x-.075,y+.035],[x-.09,y+.11],[x-.045,y+.165],[x-.01,y+.145],[x+.055,y+.23],[x+.085,y+.11],[x+.06,y+.04],[x,y]];
    line(heart,{color:'#fff2c7',fill:'#f0ac58',width:1.3});
    for(const side of [-1,1])line([[x,y,.015],[x+side*.04,y+.08,.03],[x-side*.018,y+.15,.018],[x+.05,y+.22,.008]],{color:side<0?'#fff8d7':'#ffcb8c',width:.85});
   }else{
    for(let i=0;i<4;i++){const w=.09+i*.04,h=.14+i*.022;
     const points=Array.from({length:33},(_,k)=>{const a=k/32*TAU,f=.65+.35*Math.cos(a);return [x+w*Math.sin(a)*f,y-h*Math.cos(a),.04*Math.sin(a*2+i)];});
     line(points,{color:i===1?cfg.palette.highlight:cfg.tones.human,width:i===0?2:.85,fill:i===0?'#ffd394':null,alpha:i===0?.94:.50});
    }
   }
  }else if(['fracture','repair'].includes(prop)){
   // Five pulled fibres share two anchors. The free split ends recoil
   // independently. In repair, a shuttle lays a seam across the same break.
   orb(.35,.40,.13);orb(1.42,.40,.13);
   for(let i=0;i<5;i++){const y=.28+i*.05,offset=(i%3)*.025;
    for(const side of [-1,1]){const x=side<0?.35:1.42,end=side<0?.78-offset:1.01+offset;
     line(Array.from({length:19},(_,j)=>{const t=j/18;return [mix(x,end,t),mix(.4,y,t)+.055*Math.sin(PI*t),.025*Math.sin(t*PI+i)];}),{width:i===2?1.7:1.0,motion:prop==='fracture'?'tension':null});}
    if(prop==='repair')line([[.77,y],[.88,y+.043],[1.04,y-.014]],{width:1.55,color:cfg.tones.care,motion:'seam'});
   }
   if(prop==='repair')arc(1.03,.40,.08,.045,0,TAU,{fill:'#bcf4e8',width:1.2,motion:'shuttle'});
   label(prop==='fracture'?'THE PATH IS NOT CLEAR':'TRY · LEARN · REFINE');
  }else if(prop==='library'){
   for(let i=0;i<3;i++){const x=.28+i*.41,y=.08+Math.sin(i*2)*.15,motion=i===2?'leaf':null;roundRect(x,y,.33,.54,{motion});line([[x+.07,y+.04],[x+.07,y+.50]],{width:1,motion});line([[x+.13,y+.39],[x+.27,y+.39]],{width:1.5,motion});link([x+.16,y+.56],[.9,.92],{width:1,alpha:.5});}
   orb(.9,.93,.12);label('SEEK · SELECT · SYNTHESIZE');
  }else if(['skill','moat'].includes(prop)){
   orb(.9,.36,.29,{color:cfg.tones.dream,motion:prop==='skill'?'compress':null});
   if(prop==='moat')line([[.90,1.0],[1.44,.76],[1.40,.10],[.90,-.33],[.40,.10],[.36,.76],[.90,1.0]],{width:2.7});
   else for(let i=0;i<3;i++){const a=i/3*TAU;orb(.9+Math.cos(a)*.55,.36+Math.sin(a)*.55,.07,{color:cfg.tones.human});link([.9+Math.cos(a)*.46,.36+Math.sin(a)*.46],[.9+Math.cos(a)*.30,.36+Math.sin(a)*.30],{alpha:.5});}
   label(prop==='moat'?'PURPOSE · METHOD · CHARACTER':'A SKILL OF ITS OWN',.90,-.53);
  }else if(['interface','choice','recipient'].includes(prop)){
   // Gates open into depth; the choice is a fork with a movable token.
   // Neither shape needs a simulated browser surrounding the action.
   if(prop==='choice'){
    for(const side of [-1,1]){
     const path=Array.from({length:25},(_,i)=>{const t=i/24;return [.87+side*.42*t*t,-.15+t*.85,.09*Math.sin(PI*t)];});
     line(path,{width:side===1?2.4:1.15,color:side===1?cfg.tones.care:accent});
    }
    orb(.87,-.1,.085,{color:cfg.palette.highlight,motion:'token'});
    arc(1.29,.70,.078,.052,0,TAU,{width:1.45,fill:'#18352d'});
   }else if(prop==='recipient'){
    for(let i=0;i<5;i++){const x=.42+i*.24;arc(x,.24,.15,.34,0,TAU,{width:i===2?1.5:.95,color:i===2?cfg.palette.highlight:accent});}
    line([[.27,.24],[.89,.21],[1.55,.26]],{width:1.6,motion:'span'});
    orb(1.55,.26,.086,{color:cfg.tones.human});
   }else{
    const openDoor=index===26;
    // A strand through the left jamb gives the bracing hand a contact.
    roundRect(.37,-.02,.13,.35,{fill:'#17262d',width:1.2});
    for(let rib=0;rib<5;rib++){
     const inset=rib*.052,span=.53-inset;
     const points=Array.from({length:33},(_,k)=>{const a=k/32*PI;return [.89+Math.cos(a)*span,-.12+Math.sin(a)*(.84-inset),-rib*.075];});
     line(points,{width:rib===0?2.2:1,alpha:1-rib*.105,motion:openDoor?'gate':null});
    }
    const threshold=[[.32,-.12],[1.46,-.12],[1.22,.02,-.30],[.55,.02,-.30],[.32,-.12]];
    line(threshold,{fill:'#18282a',width:1.35});
    if(!openDoor){
     line([[.55,.43,.041],[1.18,.43,.041]],{width:.9,alpha:.6});
     arc(1.12,.43,.065,.06,0,TAU,{color:cfg.palette.highlight,fill:'#244034',motion:'slider',width:1.35});
     line([[.36,.01],[.61,.12],[1.15,.12],[1.31,.21]],{color:cfg.tones.care,width:1.45,motion:'output'});
    }
   }
   if(prop!=='recipient')label(prop==='choice'?'YOUR NEXT STEP. YOUR CHOICE.':'A CLEAR WAY IN');
  }
  return objectCache[index]={paths,texts,prop};
 }
 // A single work-chapter offering replaces the repeated browser/recipient prop.
 // World-space ribs share the approved palm and camera; every path retraces scroll.
 function possibilityVessel(position,p){
  const track=cameraTrack(position),unfold=smooth((track-27.62)/.36),work=p.work;
  const source=p.contacts.right.tip,hub=add(source,add(mul(work.v,.045),mul(work.u,-.025)));
  const height=.14+.30*unfold,ceiling=p.head[1]-(.35-.05*unfold);
  if(hub[1]+height>ceiling)hub[1]=ceiling-height;
  const world=q=>add(hub,add(add(mul(work.u,q[0]),mul(work.v,q[1])),mul(work.normal,q[2])));
  const ribs=[],paths=[],path=(id,points,color,width=1,alpha=1,extra={})=>paths.push({id:'work-28-vessel-'+id,points,color,width,alpha,fill:null,role:'volume',...extra});
  const cubic=(a,b,c,d,t)=>a.map((n,i)=>(1-t)**3*n+3*(1-t)**2*t*b[i]+3*(1-t)*t*t*c[i]+t**3*d[i]);
  const leaves=[
   {tip:[-.82,.20,-.07],c1:[-.18,.06,.10],c2:[-.64,.34,.05],bud:[-.065,.14,-.035],width:.18,color:cfg.tones.dream},
   {tip:[-.48,.37,-.24],c1:[-.13,.14,-.11],c2:[-.62,.31,-.27],bud:[.005,.15,-.055],width:.12,color:cfg.tones.build},
   {tip:[.12,.31,.10],c1:[.14,.05,.13],c2:[.23,.25,.14],bud:[.065,.10,.045],width:.095,color:cfg.tones.care}
  ];
  for(let index=0;index<leaves.length;index++){
   const leaf=leaves[index],open=smooth((unfold-index*.065)/(1-index*.065)),tip=lerp(leaf.bud,leaf.tip,open),c1=lerp(mul(leaf.bud,.30),leaf.c1,open),c2=lerp(mul(leaf.bud,.72),leaf.c2,open);
   const centre=t=>cubic([0,0,0],c1,c2,tip,t);
   const surface=(t,s)=>{const q=centre(t),a=centre(clamp(t-.001)),b=centre(clamp(t+.001)),side=norm([-(b[1]-a[1]),b[0]-a[0],0]),span=leaf.width*(.16+.84*open)*Math.sin(PI*t)**.85;return world(add(q,add(mul(side,span*s),[0,0,(.025+.06*open)*Math.sin(PI*t)*(1-s*s)])));};
   ribs.push(surface);
   const sample=(fn,count=33)=>Array.from({length:count},(_,i)=>fn(i/(count-1)));
   path(index+'-spine',sample(t=>surface(t,0)),leaf.color,1.35,.92);
   path(index+'-reflected-light',sample(t=>surface(t*.20,0),13),cfg.tones.human,1.05,.25+.34*unfold);
   for(const side of [-1,1])path(index+'-rim-'+side,sample(t=>surface(t,side)),leaf.color,1.15,.78);
   for(let row=1;row<=7;row++){const v=-1+row/4;path(index+'-warp-'+row,sample(t=>surface(t,v),25),leaf.color,.55,.22+.10*(1-Math.abs(v)));}
   for(let rib=1;rib<=10;rib++){const t=rib/11;path(index+'-weft-'+rib,sample(v=>surface(t,v*2-1),17),leaf.color,.60,.25+.13*Math.sin(PI*t));}
   const rim=[...sample(t=>surface(t,-1),17),...sample(t=>surface(1-t,1),17)];rim.push(rim[0]);
   path(index+'-contour',rim,leaf.color,.45,.13,{readingAnchor:true});
   const q=surface(1,0),radius=.008+.005*open;
   path(index+'-tip',sample(t=>add(q,add(mul(work.u,Math.cos(TAU*t)*radius),mul(work.v,Math.sin(TAU*t)*radius))),17),cfg.palette.highlight,1.35,.92);
  }
  for(const [index,[a,b]] of [[ribs[0](.36,.6),ribs[1](.42,-.6)],[ribs[1](.27,.4),ribs[2](.44,-.5)]].entries()){
   const c=add(lerp(a,b,.35),mul(work.normal,index?-.06:.05)),d=add(lerp(a,b,.70),mul(work.v,-.045));
   path('cross-span-'+index,Array.from({length:25},(_,i)=>cubic(a,c,d,b,i/24)),index?cfg.tones.care:cfg.palette.highlight,.65,.28*unfold);
  }
  const ring=Array.from({length:25},(_,i)=>world([Math.cos(i/24*TAU)*.025,Math.sin(i/24*TAU)*.025,0]));
  path('hub',ring,cfg.tones.human,1.65,.90,{readingAnchor:true});
  const light=p.light,gap=Math.hypot(...sub(light,hub));
  if(gap>.008)path('hand-thread',Array.from({length:17},(_,i)=>{const t=i/16;return add(lerp(light,hub,t),mul(work.v,Math.sin(PI*t)*.025));}),cfg.tones.human,.95,.68);
  return {id:'possibility-vessel',prop:'possibility',paths,texts:[],unfold,hub,source,track};
 }
 // Quiet, authored surroundings share the camera and scroll timeline, but never
 // become hand targets. Stable path identities let their woven forms reconfigure.
 const surroundingsCache=[];
 function surroundingScene(index){
  if(surroundingsCache[index])return surroundingsCache[index];
  const shot=sequence[index],chapter=shot.chapter,quiet=chapter===5;
  const kind=chapter===1&&shot.pose!=='type'?'architecture':chapter===6?'seeds':chapter===3||chapter===4||chapter>=7?'network':'workspace';
  const paths=[],color=cfg.tones[shot.tone],phase=shot.step/Math.max(1,shot.count-1);
  const pods=[[-1.38,.22,-.90,.56,.69,-.13],[1.20,.34,-1.00,.62,.50,.13],[1.36,1.08,-1.65,.46,.39,-.10]];
  const path=(id,fn,alpha=.7,width=.9,secondary=false)=>paths.push({id,points:Array.from({length:32},(_,i)=>fn(i/31)),color,width,alpha,fill:null,role:'surroundings',secondary});
  for(const [j,pod]of pods.entries()){
   const [cx,cy,cz,w,h,tilt]=pod,angle=tilt+(phase-.5)*.10,c=Math.cos(angle),s=Math.sin(angle),fall=quiet?-.20-j*.07:0;
   const at=(x,y,z=0)=>[cx+(x*w*c-y*h*s)*.5+(phase-.5)*.035,cy+(x*w*s+y*h*c)*.5+fall,cz+z+(j===0?.13:-.10)*x];
   const visibility=quiet?[.50,.23,.10][j]:j===2?.54:1,secondary=j===2;
   const addPath=(id,fn,alpha,width=.9)=>path('surroundings-'+j+'-'+id,t=>at(...fn(t)),alpha*visibility,width,secondary);
   for(let shell=0;shell<3;shell++){
    const scale=1-shell*.13;
    addPath('shell-'+shell,t=>{
     const a=t*TAU,x=Math.cos(a),y=Math.sin(a),rounded=kind==='seeds'?.86:.32;
     return [Math.sign(x)*Math.abs(x)**rounded*scale,Math.sign(y)*Math.abs(y)**rounded*scale,.035*Math.sin(2*a+shell)];
    },shell===0?.70:.24,shell===0?1.05:.65);
   }
   for(let k=0;k<3;k++)addPath('weave-'+k,t=>{const x=t*1.72-.86,y=(k-1)*.43;return [x,y+.07*Math.sin(t*PI),.045*Math.sin(t*PI)];},.25,.65);
   for(let k=0;k<4;k++)addPath('idea-'+k,t=>{
    if(kind==='architecture'){
     if(k===0)return [t*1.35-.675,.08+.54*Math.sin(PI*t),.045];
     if(k===1)return [Math.cos(t*TAU)*.62,-.31+Math.sin(t*TAU)*.18,.04];
     return [(k===2?-.40:.40)+.025*Math.sin(PI*t),-.30+.55*t,.04];
    }
    if(kind==='seeds'){
     const a=t*TAU,turn=k*PI/2;return [.18*Math.cos(turn)+.32*Math.cos(a)*Math.cos(turn)-.17*Math.sin(a)*Math.sin(turn),.18*Math.sin(turn)+.32*Math.cos(a)*Math.sin(turn)+.17*Math.sin(a)*Math.cos(turn),.06*Math.sin(a)];
    }
    if(kind==='network'){
     const nodes=[[-.48,-.28],[.02,.36],[.48,-.10]];
     if(k<3){const a=t*TAU;return [nodes[k][0]+.13*Math.cos(a),nodes[k][1]+.16*Math.sin(a),.04];}
     const segment=t<.5?0:1,u=(t-segment*.5)*2,a=nodes[segment],b=nodes[segment+1];return [mix(a[0],b[0],u),mix(a[1],b[1],u)+.07*Math.sin(PI*u),.04];
    }
    return [mix(-.57+(k%2)*.18,.52-(k%3)*.12,t),.48-k*.30+.025*Math.sin(PI*t),.04];
   },quiet?.34:.72,k===3?.75:.95);
  }
  // Two peripheral threads and three distant seed points leave the centre open.
  for(let side=0;side<2;side++)path('surroundings-thread-'+side,t=>{
   const x=side?1.17:-1.40;return [x+.20*Math.sin(PI*t+side),-.90+t*1.70,-1.18-.18*Math.sin(PI*t)];
  },quiet?.13:.38,.75,side===1);
  for(let k=0;k<3;k++)path('surroundings-seed-'+k,t=>{const a=t*TAU;return [1.03+k*.19+.025*Math.cos(a),-.53+k*.16+.035*Math.sin(a),-1.05-k*.20];},quiet?.12:.66,.85,k===1);
  return surroundingsCache[index]={paths,alpha:index===0?0:quiet?.12:chapter===9?.16:.22};
 }
 // Each fragment begins on its source filament, curls outward into a tiny grain,
 // then lands on the corresponding destination filament. Everything is sampled
 // from scroll: no emitter clock, random spawn or accumulated particle velocity.
 const dustPlans=new Map();
 function dustPlan(from){
  if(dustPlans.has(from))return dustPlans.get(from);
  const source=sequence[from],target=sequence[Math.min(from+1,sequence.length-1)];
  const plan=cfg.dust?.transitions.find(event=>event.from===source.prop&&event.to===target.prop)||null;
  dustPlans.set(from,plan);return plan;
 }
 const dustNoise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
 function dustFragments(item,pathIndex,from,t,plan){
  const pod=Math.floor(pathIndex/10),local=pathIndex%10;
  if(pathIndex>=30||!plan.pods.includes(pod)||(plan.interior&&local<6))return null;
  // The whole piece erodes in a wave, instead of disappearing in one frame.
  const phase=clamp(t+(dustNoise(from*37+pathIndex)-.5)*.12*Math.sin(PI*t));
  const erode=smooth((phase-.14)/.18)*(1-smooth((phase-.77)/.17));
  if(erode<=.00001)return null;
  const loosen=smooth((phase-.16)/.30)*(1-smooth((phase-.62)/.28)),paths=[];
  const pointAt=u=>{const f=clamp(u)*(item.points.length-1),i=Math.min(item.points.length-2,Math.floor(f));return lerp(item.points[i],item.points[i+1],f-i);};
  for(let grain=0;grain<6;grain++){
   const seed=from*601+pathIndex*17+grain*7,r1=dustNoise(seed),r2=dustNoise(seed+1),r3=dustNoise(seed+2);
   const center=pointAt((grain+.5)/6),angle=r1*TAU+phase*.9,radius=(.10+r2*.22)*plan.spread,side=(pod===0?-1:1)*(plan.gather?-1:1);
   const offset=[side*(.08+radius*(.5+.5*Math.cos(angle))),Math.sin(angle)*radius+(plan.drift||0)*phase,-.08-r3*.20+.04*Math.sin(angle)];
   const shrink=1-loosen*.975;
   const points=Array.from({length:4},(_,i)=>{
    const q=pointAt((grain+i/3)/6);
    return center.map((v,k)=>v+(q[k]-v)*shrink+offset[k]*loosen);
   });
   paths.push({...item,id:item.id+'-dust-'+grain,sourcePath:item.id,particle:true,secondary:item.secondary||grain%2===1,points,
    alpha:item.alpha*erode*(1+loosen*(.45+r3*.65)),width:mix(item.width,.85+r2*.80,loosen)});
  }
  return {erode,paths};
 }
 function responseAt(timeline,p){
  const raw=timeline%1,beat=Math.ceil(timeline),resistance=sequence[beat]?.prop==='fracture';
  const create=[2,5,6,12,16,20,23,25].includes(beat),action=Math.sin(PI*clamp(p.phase.action))**2;
  const release=smooth((raw-p.phase.actionEnd)/.12)*(1-smooth((raw-.94)/.06));
  return {resistance,reach:(resistance?-.075:.065)*action,energy:create?release:0};
 }
 function surroundings(timeline,p){
  const from=Math.floor(timeline),to=Math.min(sequence.length-1,from+1),raw=timeline-from,t=smooth((raw-.12)/.78),a=surroundingScene(from),b=surroundingScene(to);
  const alpha=mix(a.alpha,b.alpha,t),pulse=Math.sin(PI*t),quiet=sequence[from].chapter===5||sequence[to].chapter===5;
  const plan=dustPlan(from),paths=[],response=responseAt(timeline,p);
  a.paths.forEach((item,i)=>{
   const next=b.paths[i],rgbA=rgb(item.color),rgbB=rgb(next.color),color='#'+rgbA.map((v,k)=>Math.round(mix(v,rgbB[k],t)).toString(16).padStart(2,'0')).join('');
   const path={...item,color,alpha:mix(item.alpha,next.alpha,t),points:item.points.map((q,k)=>{
    const v=lerp(q,next.points[k],t);v[0]+=Math.sign(v[0])*.045*pulse;v[1]-=(quiet?.055:.025)*pulse;
    const distance=Math.hypot(...sub(v,p.light)),pull=response.reach*Math.exp(-distance*distance/4);
    return lerp(v,p.light,pull);
   })};
   const dust=plan&&dustFragments(path,i,from,t,plan);
   paths.push(dust?{...path,alpha:path.alpha*(1-dust.erode)}:path);
   if(dust)paths.push(...dust.paths);
  });
  return {role:'surroundings',id:'ambient',alpha:alpha*(1+.18*response.energy),textAlpha:0,texts:[],paths};
 }
 // A complete set surrounds the maker. Fixed topology lets whole environments
 // fold, fall and reconstruct with scroll, without spawning objects or clocks.
 const worldCache=[];
 function worldScene(index){
  if(worldCache[index])return worldCache[index];
  const shot=sequence[index],chapter=shot.chapter,set=cfg.environments[chapter],phase=shot.step/Math.max(1,shot.count-1),paths=[];
  const placements=[[-1.30,-.55,-.25,.56,.70],[1.24,-.34,-.55,.62,.72],[-1.45,.66,-1.0,.72,.96],[1.30,.65,-1.35,.72,.94],[-.95,.28,-2.0,.92,1.25],[.82,1.0,-2.0,.92,1.08],[-.98,-1.08,.68,.62,.35],[1.12,-.99,.62,.72,.38]];
  const rounded=(v,r=.46)=>v*Math.pow((v*v+.012)/1.012,(r-1)/2);
  const ellipse=(a,x=1,y=1,z=0)=>[Math.cos(a)*x,Math.sin(a)*y,z];
  function local(kind,k,t){
   const a=t*TAU,q=k/11;
   if(kind==='arch'){
    if(k<4){const angle=t*PI;return [Math.cos(angle)*(1-k*.08),-.92+1.92*Math.sin(angle),-k*.18];}
    if(k<8){const angle=(k-3)/5*PI;return [Math.cos(angle)*(1-t*.24),-.92+(1.92-t*.24)*Math.sin(angle),-t*.54];}
    return [Math.cos(a)*(1-(k-8)*.16),-.92+.12*Math.sin(a),.18+Math.sin(a)*.32];
   }
   if(kind==='tower'){
    if(k<4){const angle=k/4*TAU;return [.65*Math.cos(angle)+.09*Math.sin(t*PI),t*2-1,.24*Math.sin(angle)+.08*Math.sin(PI*t)];}
    if(k<8)return [.65*Math.cos(a),-.85+(k-4)*.55+.025*Math.sin(a*2),.24*Math.sin(a)];
    return [mix(-.62,.62,t),-.85+(k-8)*.55+.08*Math.sin(t*PI),.25];
   }
   if(kind==='bridge'){
    if(k<4)return [t*2-1,-.28+.55*Math.sin(t*PI)+(k%2)*.22,(k-1.5)*.16];
    if(k<8){const x=-.75+(k-4)*.5;return [x,-.28+t*(.55*Math.sin((x+1)/2*PI)+.22),-.22+t*.44];}
    return [t*2-1,-.33+(k-8)*.12+.07*Math.sin(PI*t),.23];
   }
   if(kind==='chair'){
    if(k<4){const x=k%2? .62:-.62,z=k<2?.25:-.25;return [x+.08*Math.sin(PI*t),-1+t*.9,z];}
    if(k<6)return [.68*Math.cos(a),-.10+(k-4)*.06,.30*Math.sin(a)];
    if(k<10){const x=(k-7.5)*.35;return [x,-.08+t*1.12,-.27-.08*Math.sin(PI*t)];}
    return [Math.cos(a)*.63,.60+Math.sin(a)*.43,-.28-(k-10)*.08];
   }
   if(kind==='orb'){
    if(k<6){const lat=(k-2.5)*.28,r=Math.sqrt(1-lat*lat);return [Math.cos(a)*r,lat,Math.sin(a)*r*.55];}
    const turn=(k-6)/6*PI;return [Math.sin(a)*Math.cos(turn),Math.cos(a),Math.sin(a)*Math.sin(turn)*.55];
   }
   if(kind==='petal'){
    if(k<5){const turn=k/5*TAU,rad=.38+.30*Math.cos(a);return [Math.cos(turn)*rad-Math.sin(turn)*Math.sin(a)*.19,Math.sin(turn)*rad+Math.cos(turn)*Math.sin(a)*.19,.14*Math.sin(a)];}
    if(k<10){const turn=(k-5)/5*TAU;return [Math.cos(turn)*(.12+t*.34),Math.sin(turn)*(.12+t*.34),.08*Math.sin(t*PI)];}
    return ellipse(a,k===10?.78:.18,k===10?.78:.18,-.04);
   }
   if(kind==='network'){
    const nodes=[[-.65,-.48],[.05,.72],[.73,.18],[.16,-.65],[-.68,.46]];
    if(k<5){const node=nodes[k];return [node[0]+.16*Math.cos(a),node[1]+.18*Math.sin(a),.06*Math.sin(a)];}
    if(k<10){const start=nodes[k-5],end=nodes[(k-3)%5];return [mix(start[0],end[0],t),mix(start[1],end[1],t)+.13*Math.sin(PI*t),-.05+.12*Math.sin(PI*t)];}
    return [rounded(Math.cos(a),.78)*(k===10?1:.90),rounded(Math.sin(a),.78)*(k===10?1:.90),-.16];
   }
   if(kind==='fragment'){
    const turn=k*2.399,r=.24+q*.64,fall=chapter===5?phase*.18:0;
    return [Math.cos(turn)*r+(t-.5)*(.26+q*.25),Math.sin(turn)*r+.13*Math.sin(PI*t)-fall,-.12+.16*Math.cos(t*PI+turn)];
   }
   // Folios and revealed layers use rounded surfaces with real depth, not fills.
   if(k<4){const turn=t*PI/2+k*PI/2;return [rounded(Math.cos(turn)),rounded(Math.sin(turn)),kind==='layers'?-.20*k:.04*Math.sin(turn*2)];}
   if(k<7)return [mix(-.72,.72,t),.53-(k-4)*.38+.05*Math.sin(PI*t),.06];
   if(k<10)return [rounded(Math.cos(a))*(1-(k-7)*.08),rounded(Math.sin(a))*(1-(k-7)*.08),-.15-(k-7)*.17];
   return [mix(-.70,.70,t),(k===10?-.74:.75)+.04*Math.sin(PI*t),-.10+t*.20];
  }
  for(let object=0;object<8;object++){
   let kind=set.objects[object];
   if(chapter===5){const variants=[null,['chair','fragment','arch','fragment','bridge','layers','fragment','fragment'],['folio','fragment','arch','chair','fragment','folio','fragment','folio'],['folio','bridge','arch','chair','bridge','layers','fragment','tower'],['petal','bridge','arch','folio','bridge','network','folio','tower']];kind=(variants[shot.step]||set.objects)[object];}
   const [cx,cy,cz,w,h]=placements[object],tilt=(object%2?1:-1)*(.09+phase*.07),ct=Math.cos(tilt),st=Math.sin(tilt),color=chapter===5?(object%3===0?cfg.tones.human:cfg.tones.friction):object%4===0?cfg.tones.human:object%3===0?cfg.tones.care:cfg.tones[set.tone];
   for(let k=0;k<12;k++){
    const points=Array.from({length:25},(_,n)=>{const [x,y,z]=local(kind,k,n/24);return [cx+(x*w*ct-y*h*st)*.5,cy+(x*w*st+y*h*ct)*.5+(chapter===5&&shot.step===2?-.12:0),cz+z*.55];});
    paths.push({id:'world-object-'+object+'-'+k,points,color,width:k<4?1.1:.65,alpha:(k<4?.68:k<7?.44:.25)*(object>=4?.72:1),fill:null,role:'surroundings',secondary:(object===4||object===5||k===8||k===11),object,kind});
   }
  }
  // Threads connect the set to itself, not to the body. A broken span belongs
  // to resistance; the same span becomes whole again as the work resumes.
  for(let strand=0;strand<12;strand++){
   const side=strand%2?1:-1,row=Math.floor(strand/2),broken=chapter===5&&shot.step<3,points=Array.from({length:25},(_,i)=>{
    const t=broken?i/24*.38:i/24,x=side*(.72+t*.96),y=-1.16+row*.21+.14*Math.sin(PI*t);return [x,y,-.60-row*.24+.20*Math.sin(t*PI)];
   });
   paths.push({id:'world-span-'+strand,points,color:chapter===5?cfg.tones.friction:cfg.tones[set.tone],width:.7,alpha:row<3?.42:.22,fill:null,role:'surroundings',secondary:row>=3,object:-1,kind:'span'});
  }
  // A few high, curved filaments suggest light travelling through the room.
  for(let beam=0;beam<6;beam++)paths.push({id:'world-light-'+beam,points:Array.from({length:25},(_,n)=>{const t=n/24,side=beam%2?1:-1;return [side*(1.12+beam*.045-.30*t),1.72-t*2.60,-1.8+beam*.18+.22*Math.sin(PI*t)];}),color:chapter===5?cfg.tones.human:cfg.tones[set.tone],width:beam%3===0?1.6:.75,alpha:beam%3===0?.18:.09,fill:null,role:'surroundings',secondary:beam>2,object:-1,kind:'light'});
  return worldCache[index]={paths,strength:set.strength,name:set.name};
 }
 function storyWorld(timeline,p){
  const from=Math.floor(timeline),to=Math.min(sequence.length-1,from+1),raw=timeline-from,t=smooth((raw-.04)/.92),a=worldScene(from),b=worldScene(to),pulse=Math.sin(PI*t)**2,response=responseAt(timeline,p);
  const paths=a.paths.map((item,i)=>{const next=b.paths[i],ac=rgb(item.color),bc=rgb(next.color),color='#'+ac.map((v,k)=>Math.round(mix(v,bc[k],t)).toString(16).padStart(2,'0')).join('');return {...item,color,alpha:mix(item.alpha,next.alpha,t),points:item.points.map((q,k)=>{
   const v=lerp(q,next.points[k],t),side=Math.sign(v[0]+.2);v[0]+=side*.055*pulse;v[1]-=.07*pulse;v[2]-=.08*pulse;
   const influence=response.reach*.65*Math.exp(-(Math.hypot(...sub(v,p.light))**2)/3);return lerp(v,p.light,influence);
  })};});
  const emotion=dramaState(timeline),quiet=1-emotion.isolation*.57-emotion.doubt*.13;
  return {role:'surroundings',id:'story-world',name:t<.5?a.name:b.name,alpha:mix(a.strength,b.strength,t)*quiet,textAlpha:0,texts:[],paths,
   focus:[{point:p.head,radius:.30},{point:p.handL,radius:.13},{point:p.handR,radius:.15},{point:p.work.origin,radius:.43}]};
 }
 // The room tightens around the maker, a broken working surface sheds material,
 // then those same fragments become a path. Everything lives in the camera's
 // 3D world, so the approved rear orbit also reveals the back of this pressure.
 function dramaSet(timeline,p){
  const e=dramaState(timeline);if(e.strength<=.001)return null;
  const paths=[],strain=e.pressure*.85+e.doubt*.40,release=e.rise,source=p.work,
   emit=(id,points,color,alpha,width=1,fill=null)=>paths.push({id:'drama-'+id,points,color,alpha,width,fill,role:'surroundings',secondary:false});
  const warm=smooth((e.repair+release)/.85),cold=rgb('#e5859c'),gold=rgb(cfg.tones.human),color='#'+cold.map((v,i)=>Math.round(mix(v,gold[i],warm)).toString(16).padStart(2,'0')).join('');
  // Tall bowed ribs suggest the weight of the room; the opening grows on rising.
  for(let rib=0;rib<9;rib++){
   const radius=1.42+rib*.045-strain*.24+release*.26,z=-.94-rib*.09;
   emit('room-rib-'+rib,Array.from({length:49},(_,i)=>{const a=i/48*PI;return [-.46+Math.cos(a)*radius,-1.25+Math.sin(a)*(2.42-strain*.20+release*.30),z+.12*Math.sin(a*2+rib*.15)];}),color,(.14+strain*.19+release*.10)*(rib%3===0?1:.48),rib%3===0?1.3:.7);
  }
  // A split span is attached to the work plane. Fixed seeded paths keep each
  // torn fragment identifiable when the visitor reverses or skips the passage.
  const scatter=smooth((timeline-13.20)/1.15)*(1-smooth((timeline-15.45)/1.05));
  const presence=smooth((timeline-13.14)/.55)*(1-smooth((timeline-16.75)/.60));
  for(let j=0;j<28;j++){
   const side=j%2?1:-1,row=Math.floor(j/2),u=(row+.5)/14,
    local=[side*(.08+u*.37),-.16+u*.37,.018],
    origin=add(source.origin,add(mul(source.u,local[0]),add(mul(source.v,local[1]),mul(source.normal,local[2])))),
    drift=[side*(.32+u*.67),-.14-.55*u,-.18-.32*(j%4)/3],
    centre=add(origin,mul(drift,scatter)),angle=(j*.83+scatter*side*1.8),r=.018+(j%4)*.008;
   const points=Array.from({length:9},(_,i)=>{const a=angle+i/8*TAU;return add(centre,[Math.cos(a)*r*(1+scatter),Math.sin(a)*r*.65,Math.sin(a)*r*.35]);});
   emit('fragment-'+j,points,j%5===0?cfg.tones.human:color,presence*(.44+(j%3)*.09),j%5===0?1.4:.8,'#17101c');
  }
  // Fine pressure threads converge toward the surviving warm source, then open
  // outward into the repaired room. They stay behind the head and the hands.
  for(let j=0;j<12;j++){
   const side=j%2?1:-1,row=Math.floor(j/2);
   emit('tension-'+j,Array.from({length:33},(_,i)=>{const t=i/32;return [-.46+side*(.69+t*(.80+release*.35)), -1.12+row*.18+Math.sin(PI*t)*(.12+strain*.25),-.62-row*.17-.12*strain];}),color,.16+strain*.20+release*.13,.8);
  }
  return {id:'drama-room',role:'surroundings',alpha:e.strength,textAlpha:0,texts:[],paths,focus:[{point:p.head,radius:.34},{point:p.handL,radius:.16},{point:p.handR,radius:.18}]};
 }
 // Soft, screen-space negative space keeps new scenic glyphs off the blank
 // head and the interaction. The 3D set itself stays anchored during orbits.
 function sceneryFocus(layer,project){return (layer.focus||[]).filter(f=>!project.camera.perspectiveWeight||project.camera.distance-project.depth(f.point)>=project.camera.near).map(f=>{const q=project(f.point);return {x:q[0],y:q[1],radius:f.radius*project.scale/Math.max(.25,project.camera.distance-q[2])};});}
 function sceneryOpacity(points,focus){
  if(!focus.length)return 1;
  let opacity=1,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const q of points){minX=Math.min(minX,q[0]);maxX=Math.max(maxX,q[0]);minY=Math.min(minY,q[1]);maxY=Math.max(maxY,q[1]);}
  for(const f of focus){const radius=f.radius*1.08,extent=radius*1.65;
   if(f.x+extent<minX||f.x-extent>maxX||f.y+extent<minY||f.y-extent>maxY)continue;
   let nearestSquared=Infinity;
   for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],x=b[0]-a[0],y=b[1]-a[1],t=clamp(((f.x-a[0])*x+(f.y-a[1])*y)/(x*x+y*y||1)),dx=a[0]+x*t-f.x,dy=a[1]+y*t-f.y;nearestSquared=Math.min(nearestSquared,dx*dx+dy*dy);}
   if(nearestSquared<=radius*radius)return 0;opacity=Math.min(opacity,smooth((Math.sqrt(nearestSquared)/radius-1)/.65));
  }
  return opacity;
 }
 // One warm filament remembers the drawing through every chapter. Its route
 // stays below the work and head, attached to the same wrist-local light.
 function memoryRoute(timeline,p){
  const chapter=Math.min(10,timeline<1?timeline:sequence[Math.floor(timeline)].chapter),raw=timeline%1,next=sequence[Math.min(sequence.length-1,Math.floor(timeline)+1)].chapter,c=mix(chapter,next,smooth(raw));
  const formA=cfg.memoryForms[Math.floor(c)],formB=cfg.memoryForms[Math.min(10,Math.floor(c)+1)],form=formA.map((v,i)=>mix(v,formB[i],smooth(c%1))),origin=p.light;
  const end=[.98,-.84,-.40],control1=add(origin,[.04,-.24,-.12]),control2=[.70,-1.04,-.35];
  const bezier=(a,b,c,d,t)=>a.map((v,k)=>(1-t)**3*v+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k]);
  const route=t=>{
   if(t<.42)return bezier(origin,control1,control2,end,t/.42);
   const u=(t-.42)/.58,a=u*TAU*form[2],x=Math.cos(a),y=Math.sin(a),r=1+form[4]*Math.sin(3*a);
   return [end[0]+form[0]*(Math.sign(x)*Math.abs(x)**form[3]*r-1),end[1]+form[1]*Math.sign(y)*Math.abs(y)**form[3]*r,end[2]-.20*u+.12*Math.sin(a*.7+c*.28)*Math.sin(PI*u)];
  };
  return route;
 }
 function storyThread(timeline,p){
  const chapter=Math.min(10,timeline<1?timeline:sequence[Math.floor(timeline)].chapter),raw=timeline%1;
  const next=sequence[Math.min(sequence.length-1,Math.floor(timeline)+1)].chapter,c=mix(chapter,next,smooth(raw));
  const response=responseAt(timeline,p),fracture=(sequence[Math.floor(timeline)].prop==='fracture'?1-smooth(raw):0)+(sequence[Math.ceil(timeline)].prop==='fracture'?smooth(raw):0);
  const route=memoryRoute(timeline,p);
  const paths=[],color=cfg.tones.human,alpha=smooth((timeline-.85)/.30)*.46;
  for(let i=0;i<24;i++){
   const a=i/24,b=(i+1)/24,erosion=fracture*smooth((a-.24)/.30),points=Array.from({length:5},(_,k)=>route(mix(a,b,k/4)));
   paths.push({id:'memory-filament-'+i,points,color,width:1.05,alpha:(.88-.50*a)*(1-erosion*.95),fill:null,role:'surroundings',secondary:false});
   if(i>=6){const u=(i+.5)/24,point=route(u),angle=i*2.399,drift=erosion*.15;
    point[0]+=Math.cos(angle)*drift;point[1]-=drift*(.4+dustNoise(i));point[2]-=drift;
    paths.push({id:'memory-grain-'+i,points:[point,add(point,[.002,.002,0])],color,width:1.2,alpha:erosion*.8,fill:null,role:'surroundings',secondary:i%2===1,memoryGrain:true});}
  }
  // A soft ripple propagates over the woven ground after a completed action.
  for(let ring=0;ring<2;ring++){
   const phase=clamp((raw-p.phase.actionEnd-ring*.06)/Math.max(.08,1-p.phase.actionEnd)),radius=.24+phase*.70;
   const points=Array.from({length:49},(_,i)=>{const a=i/48*TAU;return [p.light[0]+Math.cos(a)*radius,p.support.floorY+.012,-.02+Math.sin(a)*radius*.65];});
   paths.push({id:'response-wave-'+ring,points,color:cfg.tones.care,width:.85,alpha:response.energy*(1-phase)*.42,fill:null,role:'surroundings',secondary:ring===1});
  }
  return {role:'surroundings',id:'story-thread',alpha,textAlpha:0,texts:[],paths};
 }
 function gloveSkin(timeline,p){
  const alpha=smooth((timeline-.82)/.18)*.98;if(alpha<.001)return [];
  const layers=[];
  for(const side of ['L','R']){
   const shape=p.contacts[side==='L'?'left':'right'].shape,skin=hands.skin(shape),frame=p.frames['wrist'+side],origin=p['hand'+side],paths=[];
   const world=q=>add(origin,add(add(mul(frame.x,q[0]),mul(frame.y,q[1])),mul(frame.z,q[2])));
   for(const [name,fn]of [['palm',skin.palm],...skin.fingers.map((fn,i)=>['finger-'+i,fn])]){
    const intervals=name==='palm'?[0,.12,.30,.50,.70,.88,1]:[0,.06,.12,.34,.56,.79,.90,.96,1];
    // Adjacent quads share a ring. Evaluate its FK surface and transform
    // each vertex once, keeping the original winding and seam coordinates.
    const rings=intervals.map(u=>Array.from({length:13},(_,i)=>world(fn(u,i/12*TAU))));
    for(let row=0;row<rings.length-1;row++)for(let column=0;column<12;column++){
     const near=rings[row],far=rings[row+1],points=[near[column],near[column+1],far[column+1],far[column]],surface='glove-'+side+'-'+name;
     paths.push({id:surface+'-'+row+'-'+column,points:[...points,points[0]],fill:'#583372',color:'#583372',width:.3,alpha:1,role:'volume',skin:true,surface:'glove-'+side});
    }
   }
   layers.push({id:'hand-skin-'+side,role:'hand-skin',alpha,textAlpha:0,texts:[],paths});
  }
  return layers;
 }
 // Both the moving ink and the compact camera use the page corner held in the left glove.
 function lessonPagePoint(p,[x,y,z=0]){
  const w=p.work,sx=w.width/1.3,sy=w.height/1.04;
  return add(p.contacts.left.tip,add(mul(w.u,(x-.46)*sx),add(mul(w.v,(y-.095)*sy),mul(w.normal,z*Math.min(sx,sy)))));
 }
 function illustration(position,explode=0,idleSeconds=0){
  const timeline=resolve(position),from=Math.floor(timeline),to=Math.min(sequence.length-1,from+1),raw=timeline-from,p=motion.poseAt(timeline,idleSeconds),work=p.work;
  const handoff=lessonHandoffs[from]||(p.phase.to===3?p.tool.handoff:from===14?[.17,.30]:timeline>=13&&timeline<17?[.42,.66]:[.10,.26]);
  const t=smooth((raw-handoff[0])/(handoff[1]-handoff[0]));
  const map=(q,frame=work)=>add(frame.origin,add(add(mul(frame.u,(q[0]-.89)*(frame.width||1.3)/1.3),mul(frame.v,(q[1]-.32)*(frame.height||1.04)/1.04)),mul(frame.normal,(q[2]||0)*Math.min((frame.width||1.3)/1.3,(frame.height||1.04)/1.04))));
  const heldPage=q=>lessonPagePoint(p,q);
  const keyboard=q=>{const f=work.keyboard;return add(f.origin,add(mul(f.u,(q[0]-.855)*f.width/1.59),mul(f.v,(q[1]+.34)*f.height/.28)));};
  // Local contact registers on each loose piece. The socket/folio stays put
  // during acquisition. Only the acquired piece follows the solved finger.
  const phase=p.phase;
  function workMaterial(index){
   const incoming=phase.to===index,action=incoming?phase.action:1;
   const acquired=incoming?smooth((phase.progress-phase.actionStart+.09)/.09):0;
   const released=incoming?smooth((phase.progress-phase.actionEnd)/.12):1;
   const pin=(start,finish,pivot)=>{
    const grip=lerp(lerp(map(start),p.contacts.right.tip,acquired),map(finish),released);
    return sub(grip,map(pivot));
   };
   const offsets={
    slider:()=>pin([.705,.43],[1.12,.43],[1.12,.43]),
    collar:()=>pin([.48,.18],[.91,.65],[.91,.65]),
    shuttle:()=>pin([.70,.12],[1.03,.40],[1.03,.40]),
    leaf:()=>pin([1.23,.52],[.86,.60],[1.23,.52]),
    lens:()=>pin([.78,.52],[1.05,.52],[1.33,.20]),
    peel:()=>pin([1.14,.55],[1.02,.56,.32],[1.14,.55])
   };
   const prop=sequence[index].prop;
   return (item,pathIndex)=>{
    let alpha=item.alpha,color=item.color;
    let transform=q=>map(q);
    if(index===17){
     transform=([x,y,z])=>add(p.contacts.right.tip,[(x-.89)*.57,(y-.32)*.57,z*.57]);
    }else if(prop==='lesson'){
     transform=heldPage;
    }else if(prop==='ember'){
     transform=([x,y,z])=>add(p.light,add(mul(work.u,(x-.89)*.52),add(mul(work.v,(y-.32)*.52),mul(work.normal,z*.52))));
    }else if(prop==='remnant'){
     const hinge=map([.46,-.035]),tilt=-.14+.66*smooth(action)-.26*smooth((action-.66)/.34);
     const palm=add(hinge,mul(work.normal,.015));
     transform=([x,y,z],i)=>{
      const fray=item.motion==='fray'?i/(item.points.length-1):0;
      const curl=fray*Math.sin(PI*action),dx=(x-.46)*1.18,dy=(y+.035)*1.2-.055*curl;
      const local=map([.46+dx*Math.cos(tilt)-dy*Math.sin(tilt),-.035+dy*Math.cos(tilt)+dx*Math.sin(tilt),z+.09*curl]);
      return add(palm,sub(local,hinge));
     };
    }else if(offsets[item.motion]){
     const offset=offsets[item.motion]();transform=q=>add(map(q),offset);
    }else if(item.role==='keyboard'){
     transform=keyboard;
     if(item.motion==='key'){
      const key=keyboard(item.points[0]),gap=Math.min(...['left','right'].map(side=>Math.hypot(...sub(p.contacts[side].tip,key))));
      const press=1-smooth(gap/.085);alpha*=.58+.42*press;
      if(press>.6)color=cfg.palette.highlight;
      transform=q=>add(keyboard(q),mul(work.keyboard.normal,-.009*press));
     }
    }else if(item.motion==='fold'){
     const rise=incoming?smooth((phase.progress-phase.actionEnd)/.18):1;
     transform=([x,y,h])=>map([x,y+h*.36*(1-rise),h*rise]);
    }else if(item.motion==='output'||item.motion==='seam'){
     const onset=item.motion==='seam'?.71+(pathIndex%5)*.042:.08+(pathIndex%4)*.09;
     alpha*=smooth((action-onset)/.18);
    }else if(item.motion==='tension'){
     const load=Math.sin(PI*action)**2;
     transform=([x,y,z],i)=>{const free=i/(item.points.length-1);return map([x+(x>.89?-.12:.12)*load*free,y-.075*load*free,z+.18*free*load]);};
    }else if(item.motion==='span'){
     transform=([x,y,z],i)=>map([x,y-(.14*(1-action)+.035)*Math.sin(PI*i/(item.points.length-1)),z]);
    }else if(item.motion==='needle'){
     transform=([x,y])=>map([x-(y-.28)*.95*(1-action),y,0]);
    }else if(item.motion==='compress'){
     const radius=1.33-.33*smooth(action);
     transform=([x,y,z])=>map([.9+(x-.9)*radius,.36+(y-.36)/Math.sqrt(radius),z]);
    }else if(item.motion==='token'){
     transform=([x,y,z])=>map([x+.42*action*action,y+.80*action,z+.085*Math.sin(PI*action)]);
    }else if(item.motion==='gate'){
     transform=([x,y,z])=>map([.89+(x-.89)*(.55+.45*action),y,z-.22*action*(y+.12)]);
    }
    return {...item,id:'work-'+index+'-'+pathIndex,alpha,color,points:item.points.map(transform)};
   };
  }
  const layers=[{index:from,alpha:1-t,textAlpha:1-smooth((raw-handoff[0]+.08)/.08)},{index:to,alpha:t,textAlpha:smooth((raw-handoff[1])/.08)}].filter(o=>o.alpha>.005).map(o=>{
   const object=objectScene(o.index);
   if(object.prop==='possibility')return {...o,role:'front-work',...possibilityVessel(position,p)};
   return {...o,role:'front-work',prop:object.prop,paths:object.paths.map(workMaterial(o.index)),texts:object.texts.map(item=>({...item,point:['code','component','ai'].includes(object.prop)?add(work.keyboard.origin,add(mul(work.keyboard.v,-work.keyboard.height/2-.10),mul(work.keyboard.normal,-.015))):object.prop==='lesson'?heldPage(item.point):map(item.point)}))};
  });
  if(p.drawing?.strokes){const alpha=p.phase.to===3?1-smooth(p.phase.progress/.32):1,paths=p.drawing.strokes.filter(points=>points.length>1).map(points=>({points,color:cfg.tones.human,width:2.3,alpha:1,fill:null,role:'work'}));if(paths.length&&alpha>.005)layers.push({id:'drawn-ink',alpha,textAlpha:0,paths,texts:[]});}
  // The disclosed architecture opens behind the unchanged interaction surface.
  // These are visible layers with their own world-space depth, not a moved hand target.
  const reveal=clamp(explode)*smooth((position-6.5)/.2)*smooth((8.2-position)/.2);
  if(reveal>.001){
   // The rear graphs fan beside/below the head as the camera turns. Preserve
   // the front interaction plane and real layer depth; only their spread changes.
   const orbit=orbitAt(position),fan=orbit?.disclosureFan,side=fan?orbit.weight*smooth((Math.abs(orbit.camera.yaw)-.45)/.60):0;
   for(let level=2;level>=1;level--){
    const color=level===1?cfg.tones.build:cfg.tones.human,origin=add(work.origin,add(mul(work.normal,-.34*level*reveal),add(mul(work.u,(.40+(fan?.[0]||0)*side)*level*reveal),mul(work.v,(.20+(fan?.[1]||0)*side)*level*reveal)))),paths=[];
    const at=(x,y,z=0)=>add(origin,add(add(mul(work.u,x*work.width*.52),mul(work.v,y*work.height*.54)),mul(work.normal,z)));
    const path=(id,points,alpha,width=.65,fill=null,role='depth')=>paths.push({id:'depth-'+level+'-'+id,points,color,alpha,width,fill,role});
    const perimeter=Array.from({length:65},(_,i)=>{const a=i/64*TAU,c=Math.cos(a),sn=Math.sin(a);return at(Math.sign(c)*Math.abs(c)**.38,Math.sign(sn)*Math.abs(sn)**.38);});
    path('boundary',perimeter,.56,.9,'#10101c');
    for(let j=0;j<7;j++){const q=-.78+j*.26;path('warp-'+j,Array.from({length:25},(_,i)=>{const t=i/24*1.74-.87;return at(q+.025*Math.sin(t*PI),t,.014*Math.sin(t*PI));}),.14);}
    for(let j=0;j<5;j++){const q=-.65+j*.325;path('weft-'+j,Array.from({length:25},(_,i)=>{const t=i/24*1.74-.87;return at(t,q+.04*Math.sin(t*PI),.014*Math.cos(t*PI));}),.13);}
    const nodes=level===1?[[-.62,-.30],[0,.35],[.60,-.18]]:[[-.60,.32],[0,-.20],[.58,.32]];
    for(let j=0;j<nodes.length;j++){const [x,y]=nodes[j];path('node-'+j,Array.from({length:25},(_,i)=>{const a=i/24*TAU;return at(x+Math.cos(a)*.12,y+Math.sin(a)*.16,.012);}),.88,1.05);if(j)path('connection-'+j,[at(...nodes[j-1],.01),at((x+nodes[j-1][0])/2,.04,.035),at(x,y,.01)],.68,.9);}
    for(const corner of [[-.85,-.75],[.85,.75]]){const target=add(work.origin,add(mul(work.u,corner[0]*work.width*.52),mul(work.v,corner[1]*work.height*.54)));path('bridge-'+corner[0],[target,at(...corner)],.28,.6,null,'volume');}
    layers.push({role:'depth-layer',id:level===1?'orchestration':'review-access',depthLevel:level,alpha:reveal*.82,textAlpha:0,paths,texts:[]});
   }
  }
  const ambient=surroundings(timeline,p);if(ambient.alpha>.005)layers.push(ambient);
  layers.push(storyWorld(timeline,p));
  const drama=dramaSet(timeline,p);if(drama)layers.push(drama);
  const thread=storyThread(timeline,p);if(thread.alpha>.005)layers.push(thread);
  // The first imagined place returns as a soft, open pavilion for the visitor.
  const closing=smooth((position-9.15)/.85);
  if(closing>.005){const paths=[],path=(id,fn,alpha,width=.8)=>paths.push({id:'closing-'+id,points:Array.from({length:49},(_,i)=>fn(i/48)),color:cfg.tones.dream,width,alpha,fill:null,role:'surroundings',secondary:false});
   for(let rib=0;rib<3;rib++)path('arch-'+rib,t=>{const a=t*PI;return [-.22+Math.cos(a)*(1.15-rib*.07),-1.27+Math.sin(a)*(2.90-rib*.06),-.76-rib*.23];},rib===0?.75:.33,rib===0?1.15:.7);
   for(let line=0;line<5;line++)path('roof-'+line,t=>{const a=(line+1)/6*PI;return [-.22+Math.cos(a)*(1.15-.14*t),-1.27+Math.sin(a)*(2.90-.12*t),-.76-.46*t];},.24,.65);
   layers.push({id:'closing-architecture',role:'surroundings',alpha:closing*.30,textAlpha:0,texts:[],paths});
  }
  layers.push(...floors.layers(timeline,p,paletteAt(position).accent));
  layers.push(...gloveSkin(timeline,p));
  return layers;
 }

 // Authored dolly/orbit rig. Camera easing begins before the morph and settles after it.
 // A fixed focal length changes perspective through distance, not a CSS scale transform.
 const smoother=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
 const cameraCache=new Map();
 function shotCamera(i){if(cameraCache.has(i))return cameraCache.get(i);const base=cfg.camera.shots[sequence[i].shot||'establish'],seat=motion.poseAt(i).seatAmount||0;const value={...base,target:[...base.target]};if(i>0){if(sequence[i].shot==='establish')value.target=[-.24,-.10,.16];value.target[1]-=.15*seat;}cameraCache.set(i,value);return value;}
 function cameraTrack(position){
  position=clamp(position,0,cfg.scenes.length-1);const chapter=Math.floor(position),start=starts[chapter];
  return Math.min(sequence.length-1,start+(position-chapter)*sequence[start].count);
 }
 function orbitAt(position,{compact=false}={}){
  const track=cameraTrack(position),event=cfg.camera.orbits?.find(item=>track>item.start&&track<item.end);
  if(!event)return null;
  const weight=smoother((track-event.start)/(event.lockStart-event.start))*(1-smoother((track-event.returnEnd)/(event.end-event.returnEnd)));
  const entry=compact?mix(-.20,event.entryYaw,cfg.camera.compactStrength):event.entryYaw,exit=compact?mix(-.20,event.exitYaw,cfg.camera.compactStrength):event.exitYaw,peak=compact?event.compactYaw:event.yaw;
  const yaw=track<=event.holdEnd?mix(entry,peak,smoother((track-event.lockStart)/(event.turnEnd-event.lockStart))):mix(peak,exit,smoother((track-event.holdEnd)/(event.returnEnd-event.holdEnd)));
  return {id:event.id,track,weight,locked:track>=event.lockStart&&track<=event.returnEnd,progress:clamp((track-event.start)/(event.end-event.start)),disclosureFan:event.disclosureFan?[...event.disclosureFan]:null,camera:{yaw,pitch:event.pitch,distance:event.distance,target:[...event.target]}};
 }
 function focusAt(position,{compact=false}={}){
  const track=cameraTrack(position),event=cfg.camera.inserts?.find(e=>track>e.start&&track<e.end);if(!event)return null;
  const weight=smoother((track-event.start)/(event.arrive-event.start))*(1-smoother((track-event.holdEnd)/(event.end-event.holdEnd))),p=motion.poseAt(resolve(position));
  const point=event.subject==='head'?p.head:event.subject==='light'?p.light:event.subject==='drawing'?(p.tool?.held>.5?p.tool.tip:p.light):p.work.origin;
  return {id:event.id,subject:event.subject,framing:event.framing,track,weight,radius:event.radius,point:[...point],camera:{yaw:compact?event.compactYaw:event.yaw,pitch:event.pitch,distance:compact?event.compactDistance:event.distance,target:add(point,event.offset)}};
 }
 function cameraEye(camera){const cp=Math.cos(camera.pitch);return add(camera.target,mul([-Math.sin(camera.yaw)*cp,Math.sin(camera.pitch),Math.cos(camera.yaw)*cp],camera.distance));}
 function cameraFromEye(eye,target,focal){const v=sub(eye,target),distance=Math.hypot(...v);return {yaw:Math.atan2(-v[0],v[2]),pitch:Math.asin(clamp(v[1]/distance,-1,1)),distance,target,focal};}
 function perspectiveAt(position,{compact=false}={}){
  const track=cameraTrack(position),event=cfg.camera.perspectives?.find(e=>track>e.start&&track<e.returnEnd);if(!event)return null;
  const timeline=resolve(position),p=motion.poseAt(timeline),f=p.frames.head,at=offset=>add(p.head,add(mul(f.x,offset[0]),add(mul(f.y,offset[1]),mul(f.z,offset[2])))),
   workCentre=add(p.work.origin,mul(p.work.v,.025)),
   // Follow the withdrawing book until the next piece has taken over. Its
   // plane travels back towards the face during the handoff; an equal dolly
   // along the page normal keeps the readable angle from collapsing edge-on.
   [releaseStart,releaseEnd]=lessonHandoffs[18],release=(timeline-18-releaseStart)/(releaseEnd-releaseStart),
   handoff=compact?smoother(release+1/3):0,
   subject=compact?lerp(lessonPagePoint(p,[.84,.355]),workCentre,smoother(release)):workCentre,
   shoulder=at(event.shoulderOffset),eye=at(event.eyeOffset),lens=add(eye,mul(p.work.normal,-.38*handoff)),
   rear={yaw:event.yaw,pitch:event.pitch,distance:event.distance,target:[...event.target],focal:cfg.camera.focal},
   incoming=smoother((track-event.start)/(event.rear-event.start)),outgoing=1-smoother((track-event.holdEnd)/(event.returnEnd-event.holdEnd)),
   approach=smoother((track-event.rear)/(event.shoulder-event.rear)),inhabit=smoother((track-event.shoulder)/(event.eye-event.shoulder)),
   eyeWeight=inhabit*outgoing,near=event.near,
   shoulderCamera=cameraFromEye(shoulder,subject,compact?2.8:2.25),eyeCamera=cameraFromEye(lens,subject,compact?event.compactFocal:event.focal);
  return {id:event.id,track,incoming,outgoing,approach,eyeWeight,near,subject,eye,shoulder,rear,shoulderCamera,eyeCamera,phase:track<event.rear?'rear':track<event.shoulder?'shoulder':track<event.eye?'enter':track<=event.holdEnd?'eyes':'return'};
 }
 const blendCamera=(a,b,t)=>({yaw:mix(a.yaw,b.yaw,t),pitch:mix(a.pitch,b.pitch,t),distance:Math.exp(mix(Math.log(a.distance),Math.log(b.distance),t)),target:lerp(a.target,b.target,t),focal:Math.exp(mix(Math.log(a.focal),Math.log(b.focal),t))});
 // A rail samples the same visible filament used by the environment. The eye
 // travels parallel to it with a safe stand-off; the original held shots own priority.
 const filamentRails=[
  {id:'imagination-to-hand',start:.25,end:1.09,opening:true},
  {id:'component-to-system',start:4.10,end:5.50},
  {id:'fragment-to-repair',start:15.72,end:16.88},
  {id:'listening-to-connection',start:7.15,end:8.80},
  {id:'belief-to-first-prototype',start:9.25,end:10.94},
  {id:'complexity-to-person',start:25.03,end:25.92}
 ];
 function filamentAt(position,{compact=false}={}){
  const track=cameraTrack(position),event=filamentRails.find(e=>track>e.start&&track<e.end);if(!event)return null;
  const u=clamp((track-event.start)/(event.end-event.start)),progress=smoother(u),p=motion.poseAt(resolve(position)),route=event.opening?t=>weave(t*.5,.32):memoryRoute(resolve(position),p),at=mix(event.opening?.80:.42,0,progress),point=route(at),ahead=route(Math.max(0,at-.035));
  return {id:event.id,track,progress,point,ahead,weight:Math.sin(PI*u)**4*(compact?.60:1),standOff:compact?5.8:5.3};
 }
 function cameraAt(position,{compact=false,strength=1,expanded=0}={}){
  position=clamp(position,0,cfg.scenes.length-1);const chapter=Math.floor(position),start=starts[chapter],count=sequence[start].count,local=(position-chapter)*count,step=Math.min(count-1,Math.floor(local));
  const a=start+step,b=Math.min(sequence.length-1,a+1),from=shotCamera(a),to=shotCamera(b),t=smoother((local-step-.08)/.88);
  const neutral={yaw:-.20,pitch:.12,distance:5.9,target:[-.24,-.18,.20]},amount=clamp(strength)*(compact?cfg.camera.compactStrength:1);
  const value={yaw:mix(from.yaw,to.yaw,t),pitch:mix(from.pitch,to.pitch,t),distance:Math.exp(mix(Math.log(from.distance),Math.log(to.distance),t)),target:lerp(from.target,to.target,t)};
  if([6,12,16].includes(a)){const u=local-step,wide=smoother(u/.24)*(1-smoother((u-.82)/.18));value.distance=mix(value.distance,6.55,wide);value.target=lerp(value.target,[-.30,-.20,.18],wide);value.pitch=mix(value.pitch,.12,wide);}
  const base={yaw:mix(neutral.yaw,value.yaw,amount),pitch:mix(neutral.pitch,value.pitch,amount),distance:Math.exp(mix(Math.log(neutral.distance),Math.log(value.distance),amount)),target:lerp(neutral.target,value.target,amount),focal:cfg.camera.focal};
  const orbit=orbitAt(position,{compact}),weight=(orbit?.weight||0)*clamp(strength);
  if(orbit&&weight>0){
   base.yaw=mix(base.yaw,orbit.camera.yaw,weight);base.pitch=mix(base.pitch,orbit.camera.pitch,weight);
   base.distance=Math.exp(mix(Math.log(base.distance),Math.log(orbit.camera.distance),weight));base.target=lerp(base.target,orbit.camera.target,weight);
  }
  const reveal=clamp(expanded)*smooth((position-6.5)/.2)*smooth((8.2-position)/.2);
  const focus=focusAt(position,{compact}),focusWeight=(focus?.weight||0)*clamp(strength)*(1-reveal);
  if(focusWeight>0){base.yaw=mix(base.yaw,focus.camera.yaw,focusWeight);base.pitch=mix(base.pitch,focus.camera.pitch,focusWeight);base.distance=Math.exp(mix(Math.log(base.distance),Math.log(focus.camera.distance),focusWeight));base.target=lerp(base.target,focus.camera.target,focusWeight);}
  const perspective=perspectiveAt(position,{compact}),povWeight=perspective?perspective.incoming*perspective.outgoing*clamp(strength)*(1-reveal):0;
  if(perspective&&povWeight>0){
   const rear=blendCamera(base,perspective.rear,perspective.incoming),over=blendCamera(rear,perspective.shoulderCamera,perspective.approach),subjective=blendCamera(over,perspective.eyeCamera,perspective.eyeWeight);
   Object.assign(base,blendCamera(base,subjective,perspective.outgoing*clamp(strength)*(1-reveal)));
  }
  const filament=filamentAt(position,{compact}),filamentWeight=(filament?.weight||0)*clamp(strength)*(1-Math.max(weight,focusWeight,povWeight))*(1-reveal);
  if(filamentWeight>0){const eye=cameraEye(base),direction=norm(sub(eye,filament.point)),railEye=add(filament.point,mul(direction,filament.standOff)),target=lerp(base.target,lerp(filament.point,filament.ahead,.65),.36),guided=cameraFromEye(railEye,target,base.focal);Object.assign(base,blendCamera(base,guided,filamentWeight));}
  return {...base,filamentId:filamentWeight>.001?filament.id:null,filamentWeight,orbitId:orbit?.id||null,orbitWeight:weight,locked:!!orbit?.locked&&strength===1,focusId:focusWeight>0?focus.id:null,focusWeight,framing:povWeight>.001?'perspective':focusWeight>.02?focus.framing:'full',perspectiveId:povWeight>0?perspective.id:null,perspectiveWeight:povWeight,eyeWeight:(perspective?.eyeWeight||0)*clamp(strength)*(1-reveal),near:povWeight>0?perspective.near:.25};
 }
 function prepareProjection(camera,w,h,yaw=0,pitch=0){
  const cy=Math.cos(camera.yaw+yaw),sy=Math.sin(camera.yaw+yaw),cx=Math.cos(camera.pitch+pitch),sx=Math.sin(camera.pitch+pitch),[tx,ty,tz]=camera.target,scale=Math.min(w,h)*.285*camera.focal,ox=w/2,oy=h/2;
  // Rotation and viewport coefficients are computed once, not for every strand vertex.
  const project=p=>{const qx=p[0]-tx,qy=p[1]-ty,qz=p[2]-tz,x=qx*cy+qz*sy,z=-qx*sy+qz*cy,y=qy*cx-z*sx,depth=qy*sx+z*cx,k=scale/Math.max(camera.near||.25,camera.distance-depth);return [ox+x*k,oy-y*k,depth];};
  project.camera=camera;project.scale=scale;project.center=[ox,oy];
  project.depth=p=>{const qx=p[0]-tx,qy=p[1]-ty,qz=p[2]-tz,z=-qx*sy+qz*cy;return qy*sx+z*cx;};
  project.clip=(points,closed=false)=>{
   if(!camera.perspectiveWeight)return [points];
   const limit=camera.distance-camera.near,depth=p=>limit-project.depth(p),crossing=(a,b,da,db)=>lerp(a,b,da/(da-db));
   if(closed){let polygon=[],a=points.at(-1),da=depth(a);for(const b of points){const db=depth(b);if((da>=0)!==(db>=0))polygon.push(crossing(a,b,da,db));if(db>=0)polygon.push(b);a=b;da=db;}if(polygon.length<3)return [];polygon.push(polygon[0]);return [polygon];}
   const fragments=[];let current=[],a=points[0],da=depth(a);if(da>=0)current.push(a);
   for(const b of points.slice(1)){const db=depth(b);if((da>=0)!==(db>=0)){const cut=crossing(a,b,da,db);current.push(cut);if(da>=0){if(current.length>1)fragments.push(current);current=[];}}if(db>=0)current.push(b);a=b;da=db;}if(current.length>1)fragments.push(current);return fragments;
  };
  return project;
 }
 function createProjector(position,w,h,{compact=false,yaw=0,pitch=0,strength=1,expanded=0}={}){
  const camera=cameraAt(position,{compact,strength,expanded}),free=1-Math.max(camera.orbitWeight,camera.focusWeight,camera.perspectiveWeight,camera.filamentWeight||0);
  return prepareProjection(camera,w,h,yaw*free,pitch*free);
 }
 function projectLines(lines,project){return lines.flatMap(line=>{const alpha=line.alpha*(line.part==='head'?1-smoother(((project.camera.eyeWeight||0)-.03)/.40):1);return alpha>.001?project.clip(line.points).map(points=>({...line,alpha,points:points.map(project)})):[];});}
 function projectIllustrations(layers,project){return layers.map(layer=>({...layer,paths:layer.paths.flatMap(item=>project.clip(item.points,!!item.fill).map(points=>({...item,points:points.map(project)})))}));}
 // Compatibility for callers that explicitly need the legacy neutral projection.
 function project(p,w,h,yaw=0,pitch=0){return prepareProjection({...cfg.camera,target:[0,0,0]},w,h,yaw,pitch)(p);}
 function positionFromAnchors(scroll,anchors){if(scroll<=anchors[0])return 0;for(let i=0;i<anchors.length-1;i++)if(scroll<anchors[i+1]){const p=(scroll-anchors[i])/(anchors[i+1]-anchors[i]);return i+clamp((p-cfg.morph.start)/(cfg.morph.end-cfg.morph.start));}return anchors.length-1;}
 // One continuous illustrated material per glove, shared by every patch.
 // A screen-space material avoids visible facet bands at this small scale.
 function skinMaterials(layers){
  const groups=new Map();for(const layer of layers)for(const item of layer.paths)if(item.skin){if(!groups.has(item.surface))groups.set(item.surface,[]);groups.get(item.surface).push(...item.points);}
  return [...groups].map(([id,points])=>{
   const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1])),w=Math.max(...points.map(p=>p[0]))-x,h=Math.max(...points.map(p=>p[1]))-y,r=Math.max(w,h)*.68,cx=x+w*.5,cy=y+h*.5;
   return {id,cx,cy,r:Math.max(.01,r),fx:cx-r*.22,fy:cy-r*.28,stops:[[0,'#a56bd2'],[.38,'#754599'],[.78,'#412452'],[1,'#20132f']]};
  });
 }
 // Keep filled glove patches closed on both sides of a work surface.
 function clipFilled(source,depthAt,cameraPoint,screenPoint){
  const vertices=Math.hypot(...sub(source[0],source.at(-1)))<1e-8?source.slice(0,-1):source,depths=vertices.map(depthAt);
  if(Math.min(...depths)>=-1e-9||Math.max(...depths)<=1e-9)return [source];
  return [-1,1].map(sign=>{
   const polygon=[];
   for(let i=0;i<vertices.length;i++){
    const j=(i+1)%vertices.length,p=vertices[i],q=vertices[j],a=depths[i],b=depths[j],inside=a*sign>=0,next=b*sign>=0;
    if(inside)polygon.push(p);
    if(inside!==next){const t=a/(a-b),start=cameraPoint(p),end=cameraPoint(q);polygon.push(screenPoint(lerp(start,end,t)));}
   }
   return polygon.length>=3?[...polygon,polygon[0]]:null;
  }).filter(Boolean);
 }
 const api={motion,performanceAt:(position,idleSeconds=0)=>motion.poseAt(resolve(position),idleSeconds),config:cfg,LINES,SAMPLES,sequence,starts,resolve,storyAt,orbitAt,focusAt,cameraTrack,cameraAt,cameraEye,filamentAt,filamentRails,perspectiveAt,createProjector,projectorForCamera:prepareProjection,bodyLines:(p,detail=2)=>createScene(29,p,true,detail).filter(l=>l.points.length>1).map(l=>({...l,alpha:l.alpha*(l.group==='human'?.76:1)})),bodySkin:p=>gloveSkin(29,p),projectLines,projectIllustrations,skinMaterials,clipFilled,sceneryFocus,sceneryOpacity,paletteAt,dramaAt,illustration,lightAt,lightTrail,trailSpanAt,clamp,mix,smooth,openingPhase,frame,project,positionFromAnchors};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
