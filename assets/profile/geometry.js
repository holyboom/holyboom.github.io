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
 const indexPivot=[.50,.14];
 function indexPoint(u,v,angle,depth){return [.46+u*Math.cos(angle)-v*Math.sin(angle),.095+u*Math.sin(angle)+v*Math.cos(angle),u*depth+.03*v];}
 const indexStrips={
  'index-back':{angle:1.43,depth:-.17,start:18.56,end:18.78},
  'index-middle':{angle:.78,depth:-.06,start:18.50,end:18.69}
 };
 function objectScene(index){
  if(objectCache[index])return objectCache[index];
  const shot=sequence[index],accent=cfg.tones[shot.tone],paths=[],texts=[];
  const point=(x,y,z=0)=>[x,y,z];
  const line=(points,{color=accent,width=2.1,fill=null,alpha=1,role='work',motion=null}={})=>paths.push({points:points.map(p=>point(...p)),color,width,fill,alpha,role,motion});
  // The strand painter rounds a single vertex. A doubled corner keeps a cut
  // edge sharp in Canvas and SVG; edge midpoints also follow folds and grips.
  const facet=(vertices,style)=>{
   const corners=vertices.map(p=>point(...p));
   const boundary=corners.flatMap((a,i)=>[a,a,lerp(a,corners[(i+1)%corners.length],.5)]);
   line([...boundary,corners[0]],style);
  };
  const label=(text,x=.89,y=-.35,size=11)=>texts.push({text:cfg.text?.[text]??text,point:point(x,y),color:accent,size});
  const arc=(x,y,rx,ry,start=0,end=TAU,style={})=>line(Array.from({length:49},(_,i)=>{const a=mix(start,end,i/48);return [x+Math.cos(a)*rx,y+Math.sin(a)*ry];}),style);
  const orb=(x,y,r,style={})=>{
   // A real woven ellipsoid, with the original outline/contact rim retained.
   arc(x,y,r,r,0,TAU,{fill:'#100f20',...style});
   for(const meridian of [-1.12,-.56,0,.56,1.12])line(Array.from({length:33},(_,i)=>{const a=i/32*TAU;return [x+r*Math.sin(a)*Math.cos(meridian),y+r*Math.cos(a),r*Math.sin(a)*Math.sin(meridian)];}),{width:.65,alpha:.48,...style,fill:null,role:'volume'});
   if(r>.22)for(const latitude of [-.55,-.18,.18,.55]){const radius=r*Math.sqrt(1-latitude*latitude);line(Array.from({length:33},(_,i)=>{const a=i/32*TAU;return [x+Math.cos(a)*radius,y+r*latitude,Math.sin(a)*radius];}),{width:.55,alpha:.38,...style,fill:null,role:'volume'});}
  };
  const prop=shot.prop;
  if(prop==='none')return {paths,texts};
  if(['blueprint','house'].includes(prop)){
   // Cyanotype paper, a curled corner and the oversize white plan lines read
   // even on the far side of the desk. The pen still owns the live ink.
   facet([[.24,-.20],[1.54,-.20],[1.54,.64],[1.34,.84],[.24,.84]],
    {fill:'#244365',color:'#99bdd0',width:1.3});
   facet([[1.34,.84],[1.34,.64],[1.54,.64]],{fill:'#91a9bc',color:'#b5ccda',width:.8});
   for(let i=0;i<4;i++)line([[.29,-.09+i*.20],[1.47,-.09+i*.20]],{color:'#90b1c6',width:.55,alpha:.40});
   const chalk={color:'#f1ecda',width:1.6};
   if(prop==='house'){
    const fold={color:'#f9e6c7',width:1.15,motion:'fold'};
    // Upright leaves share a ridge. The visible entrance and deep side wall
    // give the building a scale that the flat floor plan alone cannot supply.
    const left=.48,right=1.28,ridge=.87,front=-.015,back=.58,wall=.32,peak=.61;
    facet([[left,back,0],[left,back,wall],[ridge,back,peak],[right,back,wall],[right,back,0]],{...fold,fill:'#c2a88b'});
    facet([[left,front,0],[left,back,0],[left,back,wall],[left,front,wall]],{...fold,fill:'#b29577'});
    facet([[left,front,0],[left,front,wall],[ridge,front,peak],[right,front,wall],[right,front,0]],{...fold,fill:'#efe4c7'});
    facet([[left-.04,front-.035,wall],[ridge,front-.035,peak],[ridge,back+.035,peak],[left-.04,back+.035,wall]],{...fold,fill:'#b86748'});
    facet([[ridge,front-.035,peak],[right+.035,front-.035,wall],[right+.035,back+.035,wall],[ridge,back+.035,peak]],{...fold,fill:'#d38a64'});
    facet([[.61,front-.014,0],[.61,front-.014,.23],[.77,front-.014,.23],[.77,front-.014,0]],{...fold,color:'#455269',fill:'#354961'});
    facet([[.94,front-.014,.12],[.94,front-.014,.24],[1.13,front-.014,.24],[1.13,front-.014,.12]],{...fold,color:'#597284',fill:'#73909c'});
    for(const y of [.14,.35])line([[left-.04,y,wall],[ridge,y,peak],[right+.035,y,wall]],{...fold,width:.75,alpha:.74});
   }else{
    facet([[.44,-.02],[1.31,-.02],[1.31,.56],[.44,.56]],{...chalk,fill:'#345774'});
    line([[.45,.55],[.76,.55],[.76,.16],[1.30,.16]],chalk);
    line([[1.02,.17],[1.02,.34],[1.30,.34]],chalk);
    arc(.76,.16,.18,.18,0,PI/2,{width:.95,color:'#e2decf'});
    line([[.39,-.115],[1.37,-.115]],{color:'#b3c8d5',width:.8});
    for(const x of [.44,.76,1.31])line([[x-.022,-.15],[x+.022,-.08]],chalk);
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
    // A perforated listing rises from the printer's mouth as keys land.
    // The last visible lines stay inside the two sprocket tracks.
    // The machine's sloping back joins the platen to the keyboard bed.
    facet([[.18,0],[1.54,0],[1.54,1],[.18,1]],{motion:'printer-back',fill:'#354b56',color:'#8b9e9f',width:.9});
    for(const x of [.30,1.40])line([[x,.10],[x,.87]],{motion:'printer-back',color:'#78938e',width:1.25});
    facet([[.18,-.07],[1.55,-.07],[1.48,.065],[.27,.065]],{fill:'#465660',color:'#91a7b2',width:1.2});
    const tape={motion:'listing',color:'#e7dfc9',width:1};
    facet([[.32,.01],[1.39,.01],[1.39,.76],[1.28,.71],[1.16,.77],[1.04,.72],[.93,.78],[.82,.72],[.70,.78],[.59,.73],[.47,.79],[.32,.74]],{...tape,fill:'#dfd7ba'});
    for(let row=0;row<4;row++){
     const y=.14+row*.153;
     for(const x of [.375,1.33])arc(x,y,.018,.022,0,TAU,{...tape,fill:'#5b666a',color:'#5b666a',width:.55});
     const x=.47+.06*(row%3);
     line([[x,y],[x+.14,y]],{...tape,color:'#314656',width:2.1});
     line([[x+.20,y],[x+.47-row*.038,y]],{...tape,color:'#587a79',width:1.6});
    }
   }else if(prop==='component'){
    // A keyed IC package has a clipped corner, a central die and broad
    // plated terminals. Clock traces come alive under the typing fingers.
    const pins={fill:'#c89764',color:'#edc59a',width:.8};
    for(const side of [-1,1])for(let i=0;i<5;i++){
     const x=side<0?.47:1.33,y=-.015+i*.156;
     facet([[x,y],[x+side*.085,y],[x+side*.145,y-.04],[x+side*.21,y-.04],[x+side*.21,y+.018],[x+side*.15,y+.018],[x+side*.085,y+.059],[x,y+.059]],pins);
    }
    facet([[.43,-.13],[1.36,-.13],[1.36,.75],[.59,.75],[.43,.59]],{fill:'#36525d',color:'#a3c6c4',width:1.5});
    facet([[.58,.03],[1.21,.03],[1.21,.60],[.58,.60]],{fill:'#688589',color:'#c8d7c8',width:1.1});
    const circuit={color:'#ecbb81',width:1.55,motion:'output'};
    line([[.57,.18],[.73,.18],[.81,.37],[.94,.37],[1.03,.49],[1.21,.49]],circuit);
    line([[.61,.10],[.84,.10],[.95,.25],[1.16,.25]],{...circuit,width:.95});
    arc(.54,.59,.034,.034,0,TAU,{fill:'#f9d8a4',color:'#edc59a'});
   }else{
    // Incoming signals meet a faceted inference prism. The three distinct
    // output bands are only revealed after keystrokes reach the new branch.
    for(let i=0;i<3;i++){
     const y=.08+.22*i;
     line([[.11,y],[.33,y],[.64,.31+i*.045]],{color:'#8daec2',width:1.7});
     arc(.12,y,.042,.039,0,TAU,{fill:'#b6cdd2',color:'#b6cdd2',width:.75});
    }
    facet([[.60,.04],[.93,.84],[1.18,.27],[1.07,-.02]],{fill:'#576185',color:'#b4a9d4',width:1.4});
    facet([[.60,.04],[.88,.30],[.93,.84]],{fill:'#a39bc1',color:'#cbc6df',width:1});
    facet([[.60,.04],[.88,.30],[1.18,.27],[1.07,-.02]],{fill:'#526f89',color:'#9ac2ca',width:1});
    for(let i=0;i<3;i++){
     const y=.35+i*.095,x=1.61+i*.055;
     facet([[1.10,y-.07],[x,y+.01+i*.075],[x,y+.09+i*.075],[1.10,y]],{color:['#96d4c0','#f2c285','#a9a9e0'][i],fill:['#6aafa0','#d3a270','#8b88c0'][i],motion:'output',width:.75});
    }
   }
   label(prop==='ai'?'AI ENTERS THE WORKFLOW':prop==='code'?'DRAWING → CODE':'ONE WORKING COMPONENT');
  }else if(prop==='assembly'&&index===5){
   // Four mounting ears, a copper winding and a keyed centre distinguish the
   // fixed socket from the loose cartridge being pressed into it.
   const block=[[.23,.16],[.23,.83],[.38,.98],[1.40,.98],[1.56,.82],[1.56,.15],[1.39,-.02],[.41,-.02]];
   facet(block,{fill:'#405965',color:'#a8c1c3',width:1.35});
   for(const [x,y] of [[.38,.16],[1.4,.16],[.38,.82],[1.4,.82]])arc(x,y,.041,.046,0,TAU,{color:'#b4c1bd',fill:'#24333d',width:1});
   for(let i=0;i<5;i++)line([[.44+i*.15,.10],[.53+i*.15,.22],[.53+i*.15,.36]],{color:'#c7875c',width:1.8});
   arc(.91,.65,.36,.28,0,TAU,{fill:'#16272f',color:'#b98361',width:2.5});
   const brass={fill:'#c79b68',color:'#f1c590',width:1,motion:'collar'};
   facet([[.68,.45],[1.10,.45],[1.17,.53],[1.17,.79],[1.06,.86],[.76,.86],[.66,.74],[.66,.62],[.73,.62],[.73,.54]],brass);
   arc(.91,.65,.14,.13,0,TAU,{...brass,fill:'#806751',color:'#e2bf8b'});
   line([[.84,.66],[.98,.66]],{width:1.8,color:'#3d3c37',motion:'collar'});
   arc(.91,.65,.31,.23,PI*.10,PI*.90,{color:'#b5efd3',motion:'seam',width:2.4});
   label('PARTS BECOME A SYSTEM',.89,-.52);
  }else if(prop==='complexity'){
   // Five separate insulated leads leave each ferrule together, then bow out
   // around the hands. Slack at the middle forms a looser, crossing loop.
   const colors=['#65d9c0','#b199ff','#ffac70','#6fcff3','#eb83b4'];
   for(let i=0;i<colors.length;i++){
    const band=i-2,lead=Array.from({length:65},(_,j)=>{
     const t=j/64,slack=Math.sin(PI*t),curl=Math.sin(TAU*t);
     return [.30+.86*t-(.46+.07*band)*curl-.19*Math.sin(2*TAU*t)+.18*slack*Math.sin(2*TAU*t+band*.65),
      .13+.17*t+band*.016+slack*(.47*Math.sin(TAU*t+band*.94)+.24*Math.cos(3*PI*t-band*.42)-.22)-.07*curl*curl,
      .02+slack*(.14+.12*Math.cos(TAU*t+band*.80))];
    });
    line(lead,{color:colors[i],width:i===2?3.5:2.9,motion:'harness'});
   }
   for(const [side,x,y,d] of [['left',.46,.13,-1],['right',1,.30,1]]){
    const style={motion:'ferrule-'+side,color:'#9ba9ad',width:1};
    const sleeve=(vertices,finish)=>facet(vertices.map(([u,v,z])=>[x+d*u,y+v,z]),{...style,...finish});
    sleeve([[-.035,-.052,.01],[.08,-.062,.01],[.125,-.039,.01],[.165,-.032,.01],[.165,.032,.01],[.115,.044,.01],[.085,.063,.01],[-.035,.052,.01]],
     {fill:side==='left'?'#42616a':'#805340'});
    sleeve([[-.035,.052,.01],[.085,.063,.01],[.106,.042,.032],[-.016,.035,.032]],
     {fill:side==='left'?'#8bb2b8':'#dfac75',color:side==='left'?'#bad9d7':'#f3cfa9',width:.65});
    for(const u of [.105,.142])line([[x+d*u,y-.036,.021],[x+d*u,y+.037,.021]],{...style,color:'#b8b9ae',width:1.4});
   }
   label('THE DEPTH BENEATH',.89,-.52);
  }else if(prop==='network'){
   // Colour-coded plug shells travel with the two end grips. A slack cable
   // becomes a continuous span when the second plug is seated.
   for(const side of [-1,1]){
    const x=side<0?.49:1.31,y=.15,d=side<0?1:-1,plug={motion:side<0?'left-plug':'right-plug',color:'#d9c6ab',width:1};
    facet([[x-d*.24,y-.24],[x+d*.10,y-.24],[x+d*.10,y+.24],[x-d*.24,y+.24]],{fill:'#3b5760',color:'#88a7a9',width:1.2});
    facet([[x-d*.13,y-.13],[x+d*.04,y-.13],[x+d*.04,y+.13],[x-d*.13,y+.13]],{fill:'#152a35',color:'#607d88',width:1});
    facet([[x-d*.09,y-.067],[x+d*.05,y-.067],[x+d*.05,y+.067],[x-d*.09,y+.067]],{...plug,fill:'#d3bc93'});
    facet([[x,y-.103],[x+d*.17,y-.103],[x+d*.22,y-.05],[x+d*.22,y+.05],[x+d*.17,y+.103],[x,y+.103]],{...plug,fill:side<0?'#b78059':'#6daca3'});
   }
   for(const dy of [-.016,.016])line(Array.from({length:27},(_,i)=>[i/26,dy,0]),{color:dy>0?'#d3bb8a':'#719397',width:1.8,motion:'cable'});
   label('PEOPLE · REQUIREMENTS · CODE',.89,-.52);
  }else if(prop==='assembly'){
   // A folding truss opens across the palms. Its deck stays between the two
   // pads and the triangulated sections rise together as the span widens.
   const bridge={motion:'truss',color:'#d4b485',width:1.2};
   facet([[0,-.025],[1,-.025],[1,.045],[0,.045]],{...bridge,fill:'#a58160'});
   for(let i=0;i<4;i++){
    const x=i/4,h0=.10+.29*Math.sin(PI*x),h1=.10+.29*Math.sin(PI*(x+.25));
    facet([[x,0],[x+.035,0],[x+.25,h1],[x+.215,h1]],{...bridge,fill:'#b58e67'});
    facet([[x+.25,0],[x+.215,0],[x,h0],[x+.035,h0]],{...bridge,fill:'#cda579'});
    facet([[x,h0],[x+.25,h1],[x+.25,h1+.05],[x,h0+.05]],{...bridge,fill:'#65878a',color:'#b6ccc4'});
   }
   label('PARTS BECOME A SYSTEM',.89,-.52);
  }else if(['brief','review','verified','lesson'].includes(prop)){
   if(prop==='brief'){
    // Take the clipped field notes by their bottom corner. A folded sheet,
    // metal jaws and a small sketched route are readable without printed text.
    const card={motion:'brief-grip',color:'#d6baa1',width:1};
    facet([[.32,-.19],[1.22,-.19],[1.39,-.02],[1.39,.90],[.32,.90]],{...card,fill:'#8d7059'});
    facet([[.40,-.09],[1.19,-.09],[1.31,.034],[1.31,.79],[.40,.79]],{...card,fill:'#e4d9ba'});
    facet([[1.19,-.09],[1.19,.039],[1.31,.034]],{...card,fill:'#baa987'});
    facet([[.62,.76],[1.08,.76],[1.06,.90],[.96,.90],[.94,.97],[.76,.97],[.74,.90],[.65,.90]],{...card,fill:'#536674',color:'#b0bcc1'});
    for(let i=0;i<2;i++)line([[.49,.58-i*.12],[1.12-i*.19,.58-i*.12]],{...card,color:'#736b64',width:1.4});
    line([[.50,.12],[.68,.25],[.88,.21],[1.13,.34]],{...card,color:'#54877c',width:2.2});
   }else if(prop==='review'&&index===11){
    // A registration proof has physical paper edges. Coloured registration
    // marks on it become a larger pair of marks inside the moving loupe.
    facet([[.31,-.13],[1.39,-.13],[1.48,-.04],[1.48,.76],[.31,.76]],{fill:'#d9d6c1',color:'#f0ead8',width:.9});
    for(let i=0;i<3;i++){
     const x=.46+i*.20;
     facet([[x,.07],[x+.16,.07],[x+.16,.24],[x,.24]],{fill:['#527f87','#a2778c','#d5ac73'][i],color:'#d9d6c1',width:.55});
    }
    for(let i=0;i<2;i++)line([[.45,.59-i*.12],[.70+i*.12,.59-i*.12]],{color:'#646d71',width:1.2});
    const lens={motion:'lens',color:'#97abb0',width:1.15};
    facet([[1.08,.37],[1.18,.41],[1.44,.13],[1.36,.06]],{...lens,fill:'#866653',color:'#b79171'});
    arc(.99,.55,.27,.275,0,TAU,{...lens,fill:'#506977',color:'#c1cdd1',width:2.4});
    arc(.99,.55,.206,.21,0,TAU,{...lens,fill:'#bcd4d2',color:'#e0e8d9'});
    for(const [dx,clr] of [[-.025,'#765e7a'],[.035,'#5a8792']])arc(.99+dx,.55,.082,.086,0,TAU,{...lens,color:clr,width:1.4});
   }else if(prop==='verified'){
    if(index===6){
     // A stem, compression nut and circular bezel form a gauge, with no
     // enclosing UI panel competing for the work light.
     facet([[.78,.09],[.78,-.28],[1.0,-.28],[1.0,.09]],{fill:'#b78b60',color:'#e4b884',width:1.15});
     facet([[.69,-.06],[.76,.04],[1.01,.04],[1.09,-.06],[1.01,-.17],[.76,-.17]],{fill:'#a07856',color:'#d6b88e',width:1});
     arc(.89,.38,.57,.465,0,TAU,{fill:'#536263',color:'#afbdb1',width:1.6});
     arc(.89,.38,.51,.40,0,TAU,{fill:'#d9d5b7',color:'#a9997f',width:1.5});
     arc(.89,.31,.44,.31,.12*PI,.88*PI,{color:'#536c67',width:2.4});
     arc(.89,.31,.44,.31,.12*PI,.34*PI,{color:'#498673',width:3.1});
     for(let i=0;i<7;i++){const a=PI*.12+i*PI*.125;line([[.89+Math.cos(a)*.365,.31+Math.sin(a)*.235],[.89+Math.cos(a)*.43,.31+Math.sin(a)*.305]],{color:'#42545c',width:1.2});}
     facet([[.86,.24],[.91,.28],[1.18,.54],[.89,.30]],{fill:'#975c48',color:'#754634',width:1.1,motion:'needle'});
     arc(.89,.28,.053,.053,0,TAU,{fill:'#4d5055',color:'#655e60',width:.9});
    }else{
     // A spring-return switch in a cast foot, held up for another person
     // to try. The handle stands clear of its base in silhouette.
     const device={motion:'prototype',color:'#b3c9c2',width:1.05};
     facet([[.31,-.08],[.51,-.24],[1.27,-.24],[1.50,-.06],[1.39,.08],[.47,.08]],{...device,fill:'#456a70'});
     facet([[.31,-.08],[.52,.16],[1.29,.16],[1.50,-.06],[1.28,-.13],[.52,-.13]],{...device,fill:'#85a7a2'});
     arc(.82,.10,.19,.095,0,TAU,{...device,fill:'#506369',color:'#bccbc1'});
     arc(1.23,.07,.071,.045,0,TAU,{...device,fill:'#9ae7b0',color:'#baf3c4',motion:'pilot-lamp'});
     const rocker={motion:'rocker',color:'#f0ce9c',width:1.15};
     facet([[.76,.105],[.81,.58],[.93,.58],[.885,.105]],{...rocker,fill:'#b19473'});
     facet([[.72,.53],[.76,.72],[.86,.79],[1.03,.73],[1.0,.56],[.94,.49]],{...rocker,fill:'#d19469'});
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
    // A hinged cutaway: the copper traces belong to the fixed instrument.
    // The translucent cover rotates about its left edge, exposing the chip.
    facet([[.43,.055,-.065],[1.43,.055,-.065],[1.49,.13,-.065],[1.49,.67,-.065],[1.43,.73,-.065],[.43,.73,-.065]],{fill:'#25424c',color:'#86c9cc',width:1.3});
    facet([[.50,.13,-.041],[1.41,.13,-.041],[1.41,.65,-.041],[.50,.65,-.041]],{fill:'#172f37',color:'#668f9a',width:.75});
    for(const side of [-1,1])for(let i=0;i<3;i++){
     const x=.99+side*.15,y=.32+i*.086,end=x+side*(.14+i*.026);
     line([[x,y,-.018],[x+side*.07,y,-.018],[end,y+(i-1)*.055,-.018],[end+side*.056,y+(i-1)*.055,-.018]],{color:'#e4bb85',width:1.25});
    }
    facet([[.84,.25,0],[1.14,.25,0],[1.14,.55,0],[.84,.55,0]],{fill:'#344358',color:'#c1dce7',width:1.6});
    arc(1.065,.46,.028,.028,0,TAU,{color:'#e6ce9f',fill:'#e6ce9f',width:.7});
    const lid={motion:'cutaway',color:'#a9e9f4',width:1.35};
    facet([[.43,.055,.035],[1.43,.055,.035],[1.49,.13,.035],[1.49,.67,.035],[1.43,.73,.035],[.43,.73,.035]],{...lid,fill:'#43566e',alpha:.82});
    line([[1.34,.55,.045],[1.18,.42,.045],[1.04,.30,.045]],{...lid,width:.8,alpha:.58});
    for(const y of [.19,.52])line([[.43,y,.045],[.43,y+.105,.045]],{width:2.7,color:'#f0dab9'});
   }
   label({brief:'UNDERSTAND THE NEED',review:'A PERSON REVIEWS',verified:'REVIEWED BY A PERSON',lesson:'KEEP THE LESSON'}[prop]);
  }else if(prop==='remnant'){
   // A single piece of the failed surface stays in the left palm. The right
   // hand can support the bowed head, making doubt legible without a face.
   const outline=[[.46,-.035],[.66,-.01],[.77,.12],[.68,.11],[.76,.24],[.63,.19],[.65,.33],[.48,.25],[.40,.15],[.46,-.035]];
   // Retain the same sampled closed-plane contract as the larger work objects.
   line(outline.flatMap((a,i)=>i===outline.length-1?[a]:Array.from({length:4},(_,j)=>lerp(a,outline[i+1],j/4))),{color:'#f0b098',fill:'#9d4e46',width:1.35});
   // The selvedge rests on the palm. Loose ends taper and hang away
   // from that corner as the hand turns the failed piece to find the seam.
   for(let i=0;i<9;i++){
    const t=i/8,root=[.43+t*.26,.12+t*.08,.014];
    line([[.46+t*.16,-.018+t*.018,.014],root,[root[0]-.025,.15+.06*Math.sin(PI*t),.02]],{color:cfg.tones.human,width:.8,alpha:.65});
    if(i%2===0)line([root,[root[0]+.025,.16+t*.06,.05],[root[0]+.064,.16+t*.08,.07],[root[0]+.14,.10+t*.12,.11]],{color:'#ffccb0',width:1.35,motion:'fray'});
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
    // The spark is half sheltered by an open, charred husk. Break the
    // silhouette at the top so the ember reads through either profile.
    facet([[x-.17,y-.07],[x-.20,y+.13],[x-.10,y+.065],[x-.025,y+.14],[x+.095,y+.075],[x+.20,y+.15],[x+.15,y-.055],[x+.02,y-.13]],{fill:'#894b42',color:'#da8f6a',width:1.1});
    facet([[x-.09,y+.065,.025],[x-.03,y+.18,.05],[x+.02,y+.32,.01],[x+.10,y+.16,.02],[x+.07,y+.065,.04]],{fill:'#ffd68c',color:'#fff0b6',width:1.5});
    line([[x-.13,y+.012,.07],[x-.045,y-.036,.09],[x+.064,y-.018,.085],[x+.13,y+.05,.06]],{color:'#ffc180',width:1});
   }
  }else if(['fracture','repair'].includes(prop)){
   // Broad cut faces keep the tear visible at phone size. The loom's
   // brass end bars stay put while the free teeth take the strain.
   const torn=prop==='fracture';
   for(const side of [-1,1]){
    const edge=side<0?.29:1.48,cut=side<0?.75:1.03;
    const contour=[[edge,.22],[cut,.25],[cut+side*.06,.34],[cut-side*.055,.39],[cut+side*.075,.46],[cut-side*.04,.52],[edge,.59]];
    facet(contour,{fill:torn?'#98534b':'#40777a',color:torn?'#e8a28c':'#8cc5c0',width:1.2,motion:torn?'strap':null});
    for(let i=0;i<4;i++){
     const y=.29+.072*i,end=cut-side*(i%2?.02:.09);
     line(Array.from({length:15},(_,j)=>{const t=j/14;return [mix(edge,end,t),y+.031*Math.sin(PI*t),.018];}),{width:1.2,color:torn?'#e7b398':'#87c0b8',motion:torn?'strap':null});
    }
    facet([[edge-.034,.17],[edge+.034,.17],[edge+.034,.64],[edge-.034,.64]],{fill:'#a87c62',color:'#e4bd8c',width:.95});
   }
   if(!torn){
    // Four crossing stitches bridge the old cleft in sequence. The lighter
    // working end of the wooden shuttle identifies the direction of travel.
    for(let i=0;i<4;i++){
     const y=.26+.072*i;
     line([[.70,y,.022],[.81,y+.046,.09],[.94,y+.065,.09],[1.08,y+.044,.021]],{color:'#edcd90',width:2.8,motion:'seam'});
     line([[.72,y+.04,.03],[.87,y+.006,.08],[1.07,y-.006,.025]],{color:'#c8ac74',width:1.6,motion:'seam'});
    }
    facet([[.78,.33],[.89,.435],[1.23,.50],[1.13,.41],[.86,.32]],{fill:'#d49865',color:'#ffdfaf',width:1.15,motion:'shuttle'});
    line([[.92,.37],[1.08,.43]],{color:'#623f39',width:2,motion:'shuttle'});
   }
   label(torn?'THE PATH IS NOT CLEAR':'TRY · LEARN · REFINE');
  }else if(prop==='library'){
   // A fan of indexed field samples. The back two stay on their pivot
   // while the flagged sheet is drawn free by the right hand.
   const folio=(angle,fill,tab,motion,depth)=>{
    const at=(u,v)=>indexPoint(u,v,angle,depth);
    const face=[[0,-.07],[.87,-.07],[.96,.02],[.96,.22],[0,.22]];
    facet(face.map(([u,v])=>at(u,v)),{fill,color:'#dfcbb3',width:1.15,motion});
    const flag=[[.61,.19],[.79,.19],[.80,.36],[.62,.35]];
    facet(flag.map(([u,v])=>at(u,v)),{fill:tab,color:'#e9d6b8',width:.85,motion});
    for(let j=0;j<2;j++)line([at(.25,.021+j*.098),at(.66-j*.20,.021+j*.098)],{color:'#59515e',width:1.3,motion});
   };
   folio(indexStrips['index-back'].angle,'#95c7c0','#668fa3','index-back',indexStrips['index-back'].depth);
   folio(indexStrips['index-middle'].angle,'#c2a6b9','#995777','index-middle',indexStrips['index-middle'].depth);
   folio(.12,'#f3dcae','#cf8c59','leaf',.13);
   arc(...indexPivot,.061,.061,0,TAU,{fill:'#bc8a61',color:'#ffe1a4',width:1});
   label('SEEK · SELECT · SYNTHESIZE');
  }else if(prop==='skill'){
   // Two keyed spur gears share a cast mounting jig. The pitch circles are
   // tangent; a tooth on the pinion enters a gap on the larger wheel.
   const jig={motion:'workshop-jig',fill:'#475266',color:'#92a0ae',width:.85};
   // Cast trestles anchor the two bearings; the open space beneath the bed
   // lets the floor show through as the camera moves around the fixture.
   for(const [x,spread] of [[-.19,-.09],[1.29,.12]]){
    facet([[x-.064,-.55,-.10],[x+.060,-.55,-.10],[x+spread+.038,-1.445,-.14],[x+spread-.054,-1.445,-.14]],{...jig,fill:'#515564',color:'#737584'});
    facet([[x+.060,-.55,-.10],[x+.060,-.55,-.24],[x+spread+.038,-1.445,-.25],[x+spread+.038,-1.445,-.14]],{...jig,fill:'#353c4c',color:'#535b68'});
    facet([[x+spread-.090,-1.44,.012],[x+spread+.098,-1.44,.012],[x+spread+.100,-1.435,-.24],[x+spread-.066,-1.435,-.24]],{...jig,fill:'#515a68',color:'#626a77'});
   }
   facet([[-.39,-.58,-.25],[1.47,-.58,-.25],[1.52,-.46,-.21],[-.32,-.46,-.21]],jig);
   facet([[-.37,-.57,-.19],[1.49,-.57,-.19],[1.48,-.535,.12],[-.37,-.535,.12]],{...jig,fill:'#656e79'});
   for(const [x,y,half] of [[0,0,.14],[.868,.221,.165]]){
    facet([[x-.24,-.47,-.18],[x+.19,-.47,-.18],[x+half,y-.04,-.18],[x+.055,y+.113,-.18],[x-.065,y+.113,-.18],[x-half,y-.04,-.18]],{...jig,fill:'#52566b'});
    facet([[x+half*.68,y-.07,-.17],[x+half,y-.04,-.17],[x+.19,-.47,-.17],[x+.125,-.47,-.17]],{...jig,fill:'#75768a',color:'#92929f',width:.65});
   }
   const disk=(x,y,z,r,style)=>line(Array.from({length:33},(_,i)=>[x+r*Math.cos(TAU*i/32),y+r*Math.sin(TAU*i/32),z]),style);
   const brace={motion:'gear-brace',color:'#baada0',fill:'#807774',width:.85};
   facet([[-.055,-.014,0],[.21,-.25,-.006],[.32,-.25,-.006],[.042,.028,0]],brace);
   disk(0,0,0,.060,{...brace,fill:'#a8b4b2',color:'#d7d9cd'});
   // The shaft remains on the bearing while the small wheel is lifted onto it.
   const shaft={...jig,fill:'#b5b7b8',color:'#d9d6c7'};
   facet([[-.049,.009,-.19],[-.049,.009,.05],[.050,.009,.05],[.050,.009,-.19]],shaft);
   disk(0,0,.05,.055,shaft);
   function wheel(teeth,spokes,driven){
    const prefix=driven?'gear-driven':'gear-drive',radius=teeth*.032,bore=radius*(driven?.70:.63);
    const face=driven?'#779cb2':'#d39a61',edge=driven?'#c0dce3':'#ffda95',side=driven?'#455c72':'#855d42';
    const style={motion:prefix+'-rim',fill:face,color:edge,width:.82};
    const radial=(a,r,z)=>[r*Math.cos(a),r*Math.sin(a),z];
    const pitch=TAU/teeth,phase=.249+(driven?PI+pitch*.5:0),outline=[];
    for(let i=0;i<teeth;i++){
     const a=phase+i*pitch;
     for(const [f,r] of [[-.47,radius-.036],[-.34,radius-.036],[-.15,radius+.033],[.15,radius+.033],[.34,radius-.036]])outline.push(radial(a+f*pitch,r,.018));
    }
    // A reverse-wound bore leaves actual open space between the spokes.
    const ring=z=>{
     const outside=outline.map(([x,y])=>[x,y,z]),inside=Array.from({length:49},(_,i)=>radial(phase-.47*pitch-TAU*i/48,bore,z));
     // Double a cut corner to preserve it in the rounded strand painter.
     // The machined, circular inner edge needs only one sample per angle.
     return [...outside.flatMap(q=>[q,q]),outside[0],outside[0],...inside,inside[0],outside[0]];
    };
    line(ring(-.066),{...style,motion:prefix+'-back',fill:side,color:side});
    // Join the two cut faces around each tooth. The exposed axial walls
    // are visible at the side camera as the pinion slides onto its spindle.
    for(let i=0;i<teeth;i++){
     const near=Array.from({length:6},(_,j)=>outline[(i*5+j)%outline.length]);
     const far=near.map(([x,y])=>[x,y,-.066]).reverse();
     line([...near,...far].flatMap(q=>[q,q]).concat([near[0]]),{...style,motion:prefix+'-flank',fill:side,color:side,width:.55});
    }
    for(let i=0;i<spokes;i++){
     const angle=phase+i*TAU/spokes,radialPoint=(r,w)=>[r*Math.cos(angle)-w*Math.sin(angle),r*Math.sin(angle)+w*Math.cos(angle),.013];
     const width=driven?.054:.037;
     facet([radialPoint(.035,-width*.9),radialPoint(bore+.023,-width),radialPoint(bore+.023,width),radialPoint(.035,width*.9)],
      {...style,motion:prefix+'-spoke',fill:face});
    }
    line(ring(.018),style);
    disk(0,0,.031,driven?.102:.081,{...style,motion:prefix+'-hub',fill:side});
    disk(0,0,.041,driven?.049:.038,{...style,motion:prefix+'-hub',fill:'#c9c6b6',color:'#e4e5d8'});
    // One engraved witness mark on the rim makes the opposite rotations visible.
    line([radial(phase+.7*pitch,bore+.014,.027),radial(phase+.7*pitch,radius-.047,.027)],{...style,motion:prefix+'-mark',fill:null,color:'#f7eed9',width:1.8});
   }
   wheel(18,5,true);wheel(10,4,false);
   const armAngle=2.40,pinX=.14*Math.cos(armAngle),pinY=.14*Math.sin(armAngle),crank={motion:'gear-drive-crank',color:'#e8cfa1',fill:'#ae7851',width:1.1};
   facet([[-.024,-.022,.045],[pinX-.027,pinY-.019,.045],[pinX+.018,pinY+.027,.045],[.025,.015,.045]],crank);
   line([[pinX,pinY,.043],[pinX,pinY,.085]],{...crank,fill:null,width:3.1});
   disk(pinX,pinY,.085,.032,{...crank,motion:'gear-crank',fill:'#f4d8a4',color:'#fff0c8'});
   // A single wired pilot lamp on the fixed bearing responds to the output.
   line([[1.16,-.32,-.11],[1.43,-.32,-.11],[1.54,-.245,-.07]],{...jig,fill:null,color:'#b7a68d',width:1.45});
   facet([[1.43,-.46,-.09],[1.62,-.46,-.09],[1.605,-.425,-.09],[1.575,-.26,-.09],[1.493,-.26,-.09]],{...jig,fill:'#667877',color:'#9bafb0'});
   disk(1.54,-.175,-.07,.110,{...jig,fill:'#53696d',color:'#9cbebe'});
   disk(1.54,-.175,-.061,.078,{motion:'gear-output-lamp',fill:'#b3f3ae',color:'#ebffe0',width:1.45});
   disk(1.52,-.152,-.056,.024,{motion:'gear-output-lamp',fill:'#fffde3',color:'#fffde3',width:.66});
   label('A SKILL OF ITS OWN',.90,-.53);
  }else if(prop==='moat'){
   const a=[.50,.41,.01],b=[.71,.70,-.12],c=[1.12,.69,-.08],d=[1.30,.37,.015],e=[.91,-.045,.145],f=[.91,.40,.35];
   facet([[.36,.67,-.08],[.62,.73,-.09],[.90,.9,-.10],[1.18,.73,-.09],[1.43,.67,-.08],[1.37,.23,-.06],[1.20,.035,-.02],[.90,-.27,.03],[.59,.035,-.02],[.41,.20,-.04]],{fill:'#35475b',color:'#a4cecb',width:2});
   line([[.43,.58],[.53,.26],[.65,.10],[.89,-.12],[1.17,.12],[1.29,.33]],{color:'#6b929c',width:1});
   for(const side of [-1,1]){
    const cheek=[[1.32,.68,-.07],[1.44,.67,-.08],[1.37,.23,-.06],[1.16,.035,-.02],[1.26,.26,-.035]];
    facet(cheek.map(([x,y,z])=>[.90+side*(x-.90),y,z]),{fill:'#537878',color:'#89b6ad',width:.9,motion:'shield-rim'});
   }
   // A raised leather strap wraps back into two rivets at the shield rim.
   // Its lower bend sits on the palmar contact of the defending hand.
   facet([[.43,.29,-.045],[.37,.24,.035],[.363,.10,.035],[.405,.049,.035],[.51,.105,-.025],[.55,.17,-.04],[.45,.134,.035],[.426,.157,.035],[.43,.22,.015],[.49,.25,-.045]],{fill:'#9b765c',color:'#dcbb8a',width:1.2});
   for(const [corners,fill] of [[[a,b,f],'#648ea0'],[[b,c,f],'#c2e7df'],[[c,d,f],'#96b8d3'],[[d,e,f],'#6076a2'],[[e,a,f],'#8273ab']]){
    facet(corners,{fill,color:'#cfbddc',width:.8});
   }
   label('PURPOSE · METHOD · CHARACTER',.90,-.53);
  }else if(['interface','choice','recipient'].includes(prop)){
   // Gates open into depth; the choice is a fork with a movable token.
   // Neither shape needs a simulated browser surrounding the action.
   if(prop==='choice'){
    // A tangible fork in the path, with a round stepping stone on each arm.
    for(const side of [-1,1]){
     const rail=(t,v)=>[.87+side*.43*t*t+v,-.15+t*.85,.09*Math.sin(PI*t)];
     const left=Array.from({length:18},(_,j)=>rail(j/17,-.07)),right=Array.from({length:18},(_,j)=>rail(1-j/17,.07));
     line([...left,...right,left[0]],{fill:side===1?'#517d75':'#55516b',color:side===1?'#add7ba':'#b1a2c0',width:1.15});
     arc(.87+side*.43,.70,.145,.092,0,TAU,{fill:side===1?'#9bb9a5':'#92819e',color:'#d4d4bd',width:1});
    }
    orb(.87,-.10,.107,{fill:'#f6ce91',color:'#ffebc6',motion:'token'});
   }else if(prop==='recipient'){
    // The triangular pocket stays on the open palm. The card slides out
    // from inside it after the wrist has offered the mouth to the reader.
    const paper={width:1.1,color:'#b2e2d1'};
    facet([[.31,.09,-.04],[.93,.58,-.04],[1.55,.09,-.04]],{...paper,fill:'#607d77'});
    facet([[.31,-.37,-.032],[1.55,-.37,-.032],[1.55,.09,-.032],[.31,.09,-.032]],{...paper,fill:'#415e58'});
    const card={motion:'invitation-slip',color:'#e5dccc'};
    facet([[.40,-.36,-.018],[1.46,-.36,-.018],[1.46,.36,-.018],[.40,.36,-.018]],{...card,fill:'#e4daca',width:.8});
    line([[.48,.22],[.85,.22]],{...card,color:'#575367',width:1.4});
    line([[.48,.13],[.77,.13]],{...card,color:'#756d78',width:1});
    arc(1.29,.21,.073,.073,0,TAU,{...card,color:'#915c79',fill:'#bc7b94',width:1});
    facet([[.31,-.37,.025],[1.55,-.37,.025],[1.55,.09,.025],[.93,-.17,.035],[.31,.09,.025]],{...paper,fill:'#679987'});
    for(const x of [.31,1.55])line([[x,-.37,.04],[.93,-.13,.04]],{color:'#b8dac5',width:.95});
   }else if(index===26){
    // Hinged leaf and fixed sill enclose the steps revealed by the opening.
    const jamb={color:'#a6c8bd',width:1.25,fill:'#42635d'};
    facet([[.56,-.22,-.48],[1.71,-.22,-.48],[1.71,.90,-.48],[.56,.90,-.48]],{fill:'#17232b',color:'#5c7c78',width:.8});
    for(let i=0;i<3;i++){
     const w=.47-i*.11,y=-.18+i*.13,z=-.10-i*.15;
     facet([[1.14-w,y,z],[1.14+w,y,z],[1.14+w-.09,y+.085,z-.13],[1.14-w+.09,y+.085,z-.13]],{color:'#9ac0b4',width:1,fill:i%2?'#405456':'#304246'});
    }
    facet([[.53,-.24,.02],[.66,-.24,.02],[.66,.85,.02],[.53,.96,.02]],jamb);
    facet([[.53,.96,.02],[1.74,.96,.02],[1.62,.85,.02],[.66,.85,.02]],jamb);
    facet([[1.62,-.24,.02],[1.74,-.24,.02],[1.74,.96,.02],[1.62,.85,.02]],jamb);
    facet([[.66,-.20,0],[1.62,-.20,0],[1.62,.85,0],[.66,.85,0]],{motion:'door-leaf',color:'#9bcab8',fill:'#36574f',width:1.35});
    facet([[.76,.28,.018],[1.51,.28,.018],[1.51,.75,.018],[.76,.75,.018]],{motion:'door-leaf',color:'#8ab3a3',fill:'#46695d',width:.85});
    line([[1.48,.075,.05],[1.58,.075,.05],[1.59,.02,.045]],{motion:'door-leaf',color:'#f6cc8e',width:2.4});
    facet([[.46,-.31,.17],[1.82,-.31,.17],[1.71,-.22,.025],[.54,-.22,.025]],jamb);
   }else{
    // A landing, two deep sandstone piers and a rising sun. The opening
    // stays empty; the far horizon is visible between the two capitals.
    const stone={color:'#c58e78',width:1},sunX=.91,radius=.45,horizon=.04;
    for(const s of [-1,1]){
     const pier=(x,y,z)=>[sunX+s*x,y,z],face=(corners,fill,edge=stone.color)=>facet(corners.map(v=>pier(...v)),{...stone,fill,color:edge});
     face([[.61,-.69,-.20],[.91,-.69,-.20],[.91,1.08,-.20],[.74,1.14,-.20],[.60,.99,-.20]],'#76585f');
     face([[.61,-.69,.11],[.91,-.69,.11],[.91,1.08,.11],[.74,1.14,.11],[.60,.99,.11]],'#a46e68');
     face([[.60,.99,.11],[.74,1.14,.11],[.74,1.14,-.20],[.60,.99,-.20]],'#d89e79','#f0bd94');
     face([[.61,-.69,.11],[.60,.99,.11],[.60,.99,-.20],[.61,-.69,-.20]],'#724f58');
     face([[.91,-.69,.11],[.91,-.69,-.20],[.91,1.08,-.20],[.91,1.08,.11]],'#775865');
     face([[.52,-.73,.17],[.99,-.73,.17],[.99,-.53,.17],[.52,-.53,.17]],'#9a7572');
     face([[.52,-.53,.17],[.99,-.53,.17],[.99,-.53,-.24],[.52,-.53,-.24]],'#c79983');
     face([[.52,-1.29,.15],[.99,-1.29,.15],[.99,-.73,.15],[.52,-.73,.15]],'#574751','#74606a');
     line([pier(.68,-.50,.117),pier(.665,.91,.117),pier(.765,1.012,.117)],{motion:'pier-inlay',color:'#ffdb9c',width:1.55});
    }
    const disk=Array.from({length:65},(_,i)=>{const a=TAU*i/64;return [sunX+radius*Math.cos(a),.34+radius*Math.sin(a),-.27];});
    line(disk,{motion:'sunrise-disc',fill:'#f9c184',color:'#ffe3ad',width:1.35});
    paths.at(-1).dawnStops=[[0,'#fff2cc'],[.4,'#ffe5b1'],[.78,'#ffd194'],[1,'#f3b277']];
    for(let i=0;i<7;i++){
     const a=PI*(.10+i*.8/6),ray=(r,w)=>[sunX+r*Math.cos(a)-w*Math.sin(a),.34+r*Math.sin(a)+w*Math.cos(a),-.28];
     facet([ray(.51,-.009),ray(i%2?.585:.63,0),ray(.51,.009)],{motion:'sunrise-ray',fill:'#e7b47d',color:'#e7b47d',width:.68});
    }
    // Each projecting tread has a real horizontal surface, a vertical riser
    // and a lit nosing. The sides widen on their way down to the viewer.
    for(let i=0;i<4;i++){
     const y=horizon-.145*i,z=-.24+.27*i,back=.57+.11*i,front=back+.11,next=z+.27;
     facet([[sunX-back,y,z],[sunX+back,y,z],[sunX+front,y,next],[sunX-front,y,next]],{fill:['#ddbc91','#cca780','#b48d78','#a67e73'][i],color:'#d2ae92',width:.85});
     facet([[sunX-front,y,next],[sunX+front,y,next],[sunX+front,y-.145,next],[sunX-front,y-.145,next]],{fill:['#966d63','#85616a','#795c69','#675663'][i],color:'#a57e77',width:.65});
     line([[sunX-front+.05,y+.006,next],[sunX+front-.05,y+.006,next]],{motion:'sunlit-step-'+i,color:'#ffe1a9',width:1.7});
    }
    // Unlit base courses meet the room floor under the bright nosings. The
    // landing recedes into shadow while the open passage holds the eye.
    for(let i=0;i<4;i++){
     const y=-.54-.185*i,z=.84+.105*i,back=1.01+.014*i,front=back+.014,next=z+.105;
     const top=['#85676b','#79616a','#685965','#534b59'][i],edge=['#a4837d','#917679','#786873','#625965'][i];
     facet([[sunX-back,y,z],[sunX+back,y,z],[sunX+front,y,next],[sunX-front,y,next]],{fill:top,color:edge,width:.7});
     facet([[sunX-front,y,next],[sunX+front,y,next],[sunX+front,y-.185,next],[sunX-front,y-.185,next]],{fill:['#6e5661','#5b4c59','#4a404f','#39323f'][i],color:top,width:.6});
    }
    // The operator steadies the lower brace with the left hand. The right
    // thumb draws the brass carriage along a shallow slot in the near pier.
    const rail={motion:'gate-rail',width:2.2,color:'#c79c78'};
    line([[-.38,.21,.425],[-.37,.20,.42],[-.24,.21,.40],[-.15,.38,.40],[.10,.38,.40]],rail);
    line([[-.19,.42,.425],[.10,.42,.425]],{...rail,color:'#765962',width:3.6});
    facet([[-.036,-.037,0],[.038,-.037,0],[.042,.022,0],[0,.045,0],[-.036,.025,0]],{motion:'gate-carriage',fill:'#edb16c',color:'#ffe0a2',width:1.3});
   }
   if(prop!=='recipient')label(prop==='choice'?'YOUR NEXT STEP. YOUR CHOICE.':'A CLEAR WAY IN');
  }
  return objectCache[index]={paths,texts,prop};
 }
 // The keel rests on the glove. Each wing opens about the same crease, so
 // the two sheets stay joined while they change from a fold to a glider.
 function paperPlane(position,pose){
  const track=cameraTrack(position),unfold=smooth((track-27.52)/.17);
  const source=pose.contacts.right.tip,hub=source.slice();
  const axis=norm([.94,.225,.26]),up=norm(cross([.12,-.62,.82],axis)),span=cross(axis,up);
  const point=(length,side,lift)=>add(hub,add(mul(axis,length),add(mul(span,side),mul(up,lift))));
  // The maker carries the closed wings below the chin, then fans them up
  // on either side of the keel as the camera returns from the portrait.
  const angle=.055-(1-unfold)*1.12;
  const wing=(length,side,lift=0)=>point(length,side*Math.cos(angle),lift+Math.abs(side)*Math.sin(angle));
  const nose=point(1.26,0,.145),tail=point(-.15,0,.145),pin=hub;
  const far=wing(-.24,-.53,.18),near=wing(-.38,.60,.18);
  const farFold=wing(-.08,-.21,.15),nearFold=wing(-.11,.22,.145);
  const paths=[];
  function ink(id,points,color,width,options={}){
   paths.push({id:'work-28-plane-'+id,points,color,width,alpha:1,fill:null,role:'paper',readingAnchor:false,...options});
  }
  function panel(id,vertices,fill,color){
   // A doubled corner remains a sharp paper edge in the curved path painter.
   const points=vertices.flatMap((q,i)=>[q,q,lerp(q,vertices[(i+1)%vertices.length],.5)]);
   ink(id,[...points,vertices[0]],color,1,{fill,readingAnchor:true});
  }
  panel('wing-far',[far,tail,nose],'#aebed9','#d2dbed');
  panel('wing-near',[tail,near,nose],'#f7eacb','#fff3d4');
  panel('inner-fold',[nearFold,tail,nose],'#d9c8ae','#e9d7b8');
  panel('keel',[tail,pin,nose],'#a28d7a','#dec7ab');
  ink('spine',[tail,nose],'#fff3d6',1.65);
  ink('far-crease',[farFold,nose],'#e9e5e9',.9);
  // Two small blueprint registration marks survive on the paper it came from.
  for(let i=0;i<2;i++){
   const a=lerp(near,nose,.19+i*.058),b=lerp(near,nearFold,.45-i*.13);
   ink('registration-'+i,[a,lerp(b,nose,.19+i*.058)],'#91858a',.9);
  }
  return {id:'paper-plane',prop:'possibility',paths,texts:[],unfold,hub,source,tip:nose,axis,track};
 }
 // Retain the exact chapter geometry into the throw. Once released, the rear
 // folds bank as one sheet; the glint is the path actually traced by the nose.
 const paperRelease=.20,paperGone=.34,glideSpan=paperGone-paperRelease;
 const releaseOffset=motion.paperThrowOffset(paperRelease);
 const exitSpeed=mul(sub(motion.paperThrowOffset(paperRelease+.0001),motion.paperThrowOffset(paperRelease-.0001)),glideSpan/.0002);
 function launchPaperPlane(plane,progress,actor){
  if(!plane||progress>=paperGone)return null;
  if(progress<=0)return plane;
  const flight=clamp((progress-paperRelease)/glideSpan),tip=actor?.contacts.right.tip||plane.hub;
  const pivot=flight>0?add(plane.hub,releaseOffset):tip;
  function airborne(q,t){
   const local=sub(q,plane.hub),bank=-.63*smooth(t),c=Math.cos(bank),s=Math.sin(bank);
   const rolled=add(add(mul(local,c),mul(cross(plane.axis,local),s)),mul(plane.axis,local.reduce((n,v,i)=>n+v*plane.axis[i],0)*(1-c)));
   const yaw=.69*smooth(t),dx=rolled[0]*Math.cos(yaw)+rolled[2]*Math.sin(yaw),dz=-rolled[0]*Math.sin(yaw)+rolled[2]*Math.cos(yaw);
   // Hermite glide leaves the glove with its measured speed before banking
   // into depth. The same curve supplies every vertex of the short light trail.
   const drift=add(mul(exitSpeed,t*(1-t)**2),add(mul([.78,.47,-.98],t*t*(3-2*t)),mul([.34,-.20,-1.8],t*t*(t-1))));
   return add(add(pivot,drift),[dx,rolled[1],dz]);
  }
  const paths=plane.paths.map(path=>({...path,points:path.points.map(q=>airborne(q,flight))}));
  if(flight>.01){
   const points=Array.from({length:21},(_,i)=>airborne(plane.tip,flight*Math.pow(i/20,.86)));
   paths.unshift({id:'paper-flight-crease',points,color:'#ffdc9a',alpha:.72*smooth(flight/.18),width:1.15,role:'paper',fill:null});
  }
  return {...plane,alpha:plane.alpha*(1-smooth((progress-.245)/.095)),paths,hub:airborne(plane.hub,flight),tip:airborne(plane.tip,flight),flight};
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
 function storyThread(timeline,p,position){
  const chapter=Math.min(10,timeline<1?timeline:sequence[Math.floor(timeline)].chapter),raw=timeline%1;
  const next=sequence[Math.min(sequence.length-1,Math.floor(timeline)+1)].chapter,c=mix(chapter,next,smooth(raw));
  const response=responseAt(timeline,p),fracture=(sequence[Math.floor(timeline)].prop==='fracture'?1-smooth(raw):0)+(sequence[Math.ceil(timeline)].prop==='fracture'?smooth(raw):0);
  const route=memoryRoute(timeline,p);
  const paths=[],color=cfg.tones.human,alpha=smooth((timeline-.85)/.30)*.46;
  // A wire head is translucent. During the rear-to-eye move, attenuate
  // the filament where the head lies on its sightline, including its
  // wrist-locked first vertex. The distal thread keeps its own material.
  const shot=cfg.camera.perspectives[0],track=cameraTrack(position);
  const shoulderView=track>shot.rear&&track<shot.eye?cameraAt(position):null;
  const eye=shoulderView&&cameraEye(shoulderView),headRay=eye&&sub(p.head,eye);
  const coverage=shoulderView?smooth((track-shot.rear)/(.5*(shot.shoulder-shot.rear)))*
   (1-smooth((shoulderView.eyeWeight-.43)/.57)):0;
  function headClearance(point){
   const ray=norm(sub(point,eye)),along=ray.reduce((sum,n,i)=>sum+n*headRay[i],0);
   return Math.hypot(...sub(headRay,mul(ray,along)));
  }
  for(let i=0;i<24;i++){
   const a=i/24,b=(i+1)/24,erosion=fracture*smooth((a-.24)/.30),points=Array.from({length:5},(_,k)=>route(mix(a,b,k/4)));
   const veil=coverage*(1-smooth((i-3)/4));
   const clearance=veil?mix(1,smooth((Math.min(...points.map(headClearance))-.30)/.12),veil):1;
   paths.push({id:'memory-filament-'+i,points,color,width:1.05,alpha:(.88-.50*a)*(1-erosion*.95)*clearance,fill:null,role:'surroundings',secondary:false});
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
 // The right leaf lifts at its outer corner and rolls across the fixed spine.
 // The three turned sheets leave the left stack in reverse stacking order.
 const pageTurns=[
  {start:17.74,end:17.94,release:18.45,flight:.36},
  {start:18.015,end:18.19,release:18.395,flight:.34},
  {start:18.22,end:18.335,release:18.345,flight:.33}
 ];
 function lessonLeaves(position,p,book,idleSeconds){
  const track=cameraTrack(position),loose=[];
  if(track<17.70||track>=18.83)return loose;
  const ramp=(x,a,b)=>smooth((x-a)/(b-a));
  function sheet(id,turn,flight,opacity,depart){
   if(opacity<.002)return;
   // Freeze each sheet's launch frame once it is free of the moving hand.
   // The short blend preserves a paused breath right at detachment.
   const released=flight>0,free=ramp(flight,0,.18),swing=Math.sin(PI*flight),side=id%2?1:-1;
   const launch=depart?motion.poseAt(depart):p;
   // The upper leaf catches a rising crosswind. The next rolls forward and
   // left, while the last, heavier one slips lower across the departing book.
   const gust=flight*(.85+.15*flight),destinations=[[.44,-.10,.09],[-.33,.11,-.04],[.17,.28,.24]];
   const drift=mul(destinations[id]||[0,0,0],gust);
   drift[1]+=(.08+.03*id)*swing;
   const sail=side*.60*Math.sin(flight*PI*(2.4+id*.35))*swing;
   const tumble=side*(flight*(.65+id*.47)+sail*.7);
   const roll=(id-1)*.68*gust+.22*sail;
   const at=(u,v)=>{
    // Integrate a bent cross-section: its arc length stays constant while
    // the outer corner peels ahead and the opposite corner catches up.
    const bend=Math.sin(PI*turn),curl=bend*(1.38+.55*(v-.5))+sail;
    const mean=PI*turn+curl*(u*.5-.22)+sail*.85;
    const half=curl*u*.5,length=.321*u*(Math.abs(half)<1e-7?1:Math.sin(half)/half);
    let x=.84+length*Math.cos(mean),y=.078+.526*v+u*.02
      +.035*u*(v-.5)*bend+.03*u*sail;
    let z=-.045+.077*u-length*Math.sin(mean)-.004*(id+1);
    if(released){
     const height=y-.34,depth=z+.005,tilted=height*Math.cos(tumble)-depth*Math.sin(tumble);
     z=-.005+height*Math.sin(tumble)+depth*Math.cos(tumble);
     const across=x-.68;
     x=.68+across*Math.cos(roll)-tilted*Math.sin(roll);
     y=.34+across*Math.sin(roll)+tilted*Math.cos(roll);
    }
    const world=lessonPagePoint(p,[x,y,z]);
    return released?add(lerp(world,lessonPagePoint(launch,[x,y,z]),free),drift):world;
   };
   const paths=[],key='lesson-leaf-'+id;
   const path=(part,points,fill,color,width,alpha=1)=>paths.push({id:key+'-'+part,points,fill,color,width,alpha,role:'work',readingAnchor:false});
   // A single unbroken face stays legible even as the flying paper fades.
   // Three soft shadows describe the curl without gaps between adjacent faces.
   const shade=8*(1-Math.cos(PI*turn))*.5,cream='rgb('+[246,236,215].map(value=>Math.round(value-shade)).join(',')+')';
   for(let j=0;j<4;j++){
    const near=j/4,far=j?(j+1)/4:1,corners=[[near,0],[far,0],[far,1],[near,1]],points=[];
    for(let edge=0;edge<4;edge++)for(let n=0;n<5;n++)points.push(at(...lerp(corners[edge],corners[(edge+1)%4],n/5)));
    points.push(points[0]);
    if(!j)path('band-0',points,cream,'#c0b4a0',.55);
    else path('band-'+j,points,'#8f7e83','#8f7e83',.24,(.16*Math.sin(PI*turn)+.08*Math.abs(sail))*j/3);
   }
   const stroke=(name,fn,color,width)=>path(name,Array.from({length:15},(_,i)=>at(...fn(i/14))),null,color,width);
   stroke('edge',t=>[1,t],'#aa9c87',.85);
   for(let k=0;k<3;k++)stroke('ink-'+k,t=>[.14+t*(.52+.08*((id+k)%3)),.74-k*.17+.014*Math.sin(t*PI)],k?'#746978':'#895a65',k?.75:1);
   if(book&&!released)book.paths.push(...paths.map(item=>({...item,alpha:opacity*item.alpha})));
   else loose.push({id:key,role:'loose-page',alpha:opacity,textAlpha:0,texts:[],paths});
  }
  let idleSpace=1;
  pageTurns.forEach((beat,i)=>{
   const turn=ramp(track,beat.start,beat.end),flight=clamp((track-beat.release)/beat.flight);
   idleSpace*=1-Math.sin(PI*turn)**2;
   const opacity=ramp(track,beat.start-.018,beat.start+.025)*(1-ramp(flight,.28,1));
   // Left-over leaves fade with the cover until they slip free, then carry
   // their own bounded opacity into the research scene.
   const launchTime=resolve(6+(beat.release-starts[6])/sequence[starts[6]].count);
   const launchAlpha=1-ramp(launchTime-18,...lessonHandoffs[18]);
   sheet(i,turn,flight,opacity*(flight>0?mix(launchAlpha,.85,ramp(flight,0,.30)):1),flight>0?launchTime:null);
  });
  // At a native scroll hold a fresh loose corner turns once and settles
  // onto the identical underleaf. Both ends of the finite idle are neutral.
  if(book&&idleSeconds>0&&idleSeconds<2.4){
   const visibility=ramp(track,17.7,17.83)*(1-ramp(track,18.22,18.34))*idleSpace;
   const opacity=ramp(idleSeconds,.08,.34)*(1-ramp(idleSeconds,1.84,2.38))*visibility;
   sheet(3,ramp(idleSeconds,.27,1.80),0,opacity,null);
  }
  return loose;
 }
 // Released from the plugs, each lead uncoils towards its own lane on the
 // staircase. Its crest travels back along the wire as the far end lands.
 function unspoolEntrance(leads,steps,progress){
  const paths=leads.map((lead,lane)=>{
   const across=.17+.165*lane;
   const landings=steps.map(step=>lerp(step.points[0],step.points.at(-1),across));
   const points=lead.points.map((source,j)=>{
    const along=j/(lead.points.length-1),row=along*(landings.length-1);
    const target=lerp(landings[Math.floor(row)],landings[Math.ceil(row)],row%1);
    const drop=smooth((progress-.11-.14*(1-along)-lane*.018)/.48);
    const point=lerp(source,target,drop);
    point[1]+=.26*Math.sin(PI*drop)*Math.sin(PI*along)+.018*drop;
    return point;
   });
   return {...lead,id:'entrance-lead-'+lane,points,readingAnchor:false};
  });
  return {id:'unspooling-entrance',alpha:1-smooth((progress-.70)/.29),paths,texts:[],textAlpha:0};
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
   const gearing=index===20?motion.skillRig(incoming?phase.progress:1):null;
   const acquired=incoming?smooth((phase.progress-phase.actionStart+.09)/.09):0;
   const released=incoming?smooth((phase.progress-phase.actionEnd)/.12):1;
   const pin=(start,finish,pivot,release=released)=>{
    const grip=lerp(lerp(map(start),p.contacts.right.tip,acquired),map(finish),release);
    return sub(grip,map(pivot));
   };
   const offsets={
    collar:()=>pin([.48,.18],[.91,.65],[.91,.65]),
    shuttle:()=>pin([.70,.12],[1.03,.40],[1.03,.40]),
    leaf:()=>{
     const rest=[1.23,.52,0],tab=indexPoint(.773,.33,.12,.13);
     // Only the gripped portion of the move uses the raised index tab as
     // its register. The entry and the parked card retain their old marks.
     const release=incoming?smooth((phase.progress-phase.actionEnd-.06)/.12):1;
     return pin(rest,[.86,.60],lerp(rest,tab,acquired*(1-release)),release);
    },
    lens:()=>pin([.78,.52],[1.05,.52],[1.33,.20]),
    peel:()=>pin([1.14,.55],[1.02,.56,.32],[1.14,.55])
   };
   const prop=sequence[index].prop;
   // Cable ends share their ferrules' grip. The plug is seated before the
   // hands retreat and the slack follows the distance between the two ends.
   const plugTip=(side,start,finish)=>{
    const target=lerp(map(start),p.contacts[side].tip,acquired);
    // Match the rig's raised contact pad; the socket face sits behind it.
    const seated=add(map(finish),mul(work.normal,.012));
    return lerp(target,seated,incoming?smooth((action-.85)/.15):1);
   };
   const plugs=prop==='network'?[plugTip('left',[.69,.36],[.49,.15]),plugTip('right',[.85,.36],[1.31,.15])]:null;
   const ferrules=prop==='complexity'?['left','right'].map((side,i)=>{
    const register=map(i?[1,.30,.02]:[.46,.13,.02]);
    const held=incoming?acquired:1-smooth(raw/.18);
    return mul(sub(p.contacts[side].tip,register),held);
   }):null;
   return (item,pathIndex)=>{
    let alpha=item.alpha,color=item.color;
    let transform=q=>map(q);
    if(index===17){
     transform=([x,y,z])=>add(p.contacts.right.tip,[(x-.89)*.57,(y-.32)*.57,z*.57]);
    }else if(index===25){
     const rise=item.motion==='invitation-slip'?.19*smooth((action-.18)/.67):0;
     transform=([x,y,z])=>add(p.contacts.right.tip,add(mul(work.u,(x-.97)*.65),add(mul(work.v,(y+.37+rise)*.58),mul(work.normal,z*.60))));
    }else if(index===26){
     // The latch is on the palm side. The leaf swings away, leaving the
     // aperture beside the hand and the entire projecting forearm readable.
     transform=q=>map(motion.doorPoint(q,action,item.motion==='door-leaf'));
    }else if(item.motion==='cutaway'){
     const hinge=.43,angle=1.40*smooth((action-.08)/.76);
     transform=([x,y,z])=>map([hinge+(x-hinge)*Math.cos(angle)-z*Math.sin(angle),y,(x-hinge)*Math.sin(angle)+z*Math.cos(angle)]);
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
    }else if(item.motion==='printer-back'){
     transform=([x,t])=>lerp(keyboard([x,-.19]),map([x,-.04]),t);
    }else if(item.motion==='listing'){
     const keyTravel=action*4,feed=(Math.floor(keyTravel)+smooth(keyTravel%1))/4,buried=(1-feed)*.55;
     // The printer mouth masks the hidden strip; the paper and type keep
     // their dimensions above it as the rollers advance in short steps.
     const paperTop=Math.max(...item.points.map(q=>q[1]));
     alpha*=smooth((paperTop-buried)/.045);
     transform=([x,y,z])=>map([x,Math.max(.012,y-buried),z]);
    }else if(item.motion==='brief-grip'){
     const grip=incoming?acquired:1,pivot=map([.44,.04]),tip=lerp(pivot,p.contacts.left.tip,grip);
     const tilt=.14*(1-grip)+.12*Math.sin(PI*action);
     transform=([x,y,z])=>add(tip,sub(map([x,y,(y-.04)*tilt+z]),pivot));
    }else if(item.motion==='left-plug'||item.motion==='right-plug'){
     const left=item.motion==='left-plug',offset=sub(plugs[left?0:1],map([left?.49:1.31,.15]));
     transform=q=>add(map(q),offset);
    }else if(item.motion==='cable'){
     const a=add(plugs[0],mul(work.u,.145)),b=add(plugs[1],mul(work.u,-.145));
     const sag=.045+.16*(1-action);
     transform=([t,y])=>add(lerp(a,b,t),add(mul(work.v,y-sag*Math.sin(PI*t)),mul(work.normal,.065*Math.sin(2*PI*t))));
    }else if(item.motion==='truss'){
     const a=p.contacts.left.tip,b=p.contacts.right.tip,width=Math.hypot(...sub(a,b));
     const fold=Math.sqrt(Math.max(.22,1-(width/1.2)**2));
     transform=([x,y])=>add(lerp(a,b,x),mul(work.v,y*(.58+.40*fold)));
    }else if(['prototype','rocker','pilot-lamp'].includes(item.motion)){
     const pivot=map([.98,.105]),pad=lerp(pivot,p.contacts.right.tip,incoming?acquired:1);
     const load=smooth((action-.08)/.56);
     transform=([x,y,z])=>{
      const throwDistance=item.motion==='rocker'?(y-.105)*(.39-.70*load):0;
      return add(pad,sub(map([x+throwDistance,y,z]),pivot));
     };
     if(item.motion==='pilot-lamp')alpha*=.25+.75*smooth((action-.60)/.25);
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
     if(item.fill)alpha*=.14+.86*rise;
     transform=([x,y,h])=>map([x,y+h*.36*(1-rise),h*rise]);
    }else if(item.motion==='output'||item.motion==='seam'){
     const onset=item.motion==='seam'?.71+(pathIndex%5)*.042:.08+(pathIndex%4)*.09;
     alpha*=smooth((action-onset)/.18);
    }else if(item.motion==='strap'){
     const tension=Math.sin(PI*action)**2;
     transform=([x,y,z])=>{
      const side=x<.89?-1:1,bar=side<0?.29:1.48,free=clamp(Math.abs(x-bar)/.47);
      return map([x-side*.095*tension*free,y-.068*tension*free,z+.15*free*tension]);
     };
    }else if(item.motion==='span'){
     transform=([x,y,z],i)=>map([x,y-(.14*(1-action)+.035)*Math.sin(PI*i/(item.points.length-1)),z]);
    }else if(item.motion==='needle'){
     const settle=.10*Math.sin(PI*smooth(action))*Math.sin(3*PI*smooth(action));
     transform=([x,y])=>map([x-(y-.28)*(1.9*(1-action)+settle),y,0]);
    }else if(gearing){
     const fixed=[.07,.16,.43],driven=item.motion.startsWith('gear-driven-'),drive=item.motion.startsWith('gear-drive-')||item.motion==='gear-crank';
     const base=driven?[fixed[0]+.69*.868,fixed[1]+.221,fixed[2]-.724*.868]:drive?gearing.pinion:item.motion==='gear-brace'?gearing.brace:fixed;
     const spin=driven?-gearing.turn*10/18:drive?gearing.turn:0,cos=Math.cos(spin),sin=Math.sin(spin);
     if(item.motion==='gear-output-lamp')alpha*=.10+.90*smooth((gearing.turn-.42)/.40);
     transform=([x,y,z])=>{
      const u=cos*x-sin*y,v=sin*x+cos*y;
      return [base[0]+.69*u+.724*z,base[1]+v,base[2]-.724*u+.69*z];
     };
    }else if(item.motion==='harness'){
     transform=([x,y,z],i)=>{
      const t=i/(item.points.length-1),span=Math.sin(PI*t);
      return add(map([x,y-.13*(1-action)*span,z+.07*action*span]),lerp(ferrules[0],ferrules[1],t));
     };
    }else if(item.motion?.startsWith('ferrule-')){
     const offset=ferrules[item.motion==='ferrule-left'?0:1];
     transform=q=>add(map(q),offset);
    }else if(indexStrips[item.motion]){
     // The closed index deck waits for the notebook leaves to clear. Rotate
     // the swatches around the brass rivet and open their depth last.
     const strip=indexStrips[item.motion],track=cameraTrack(position);
     if(track<strip.end){
      const folded=1-smooth((track-strip.start)/(strip.end-strip.start));
      const angle=(.12-strip.angle)*folded,c=Math.cos(angle),s=Math.sin(angle);
      transform=([x,y,z])=>{
       const dx=x-indexPivot[0],dy=y-indexPivot[1];
       const length=dx*Math.cos(strip.angle)+dy*Math.sin(strip.angle);
       return map([indexPivot[0]+dx*c-dy*s,indexPivot[1]+dx*s+dy*c,z+length*(.10-strip.depth)*folded]);
      };
     }
    }else if(item.motion==='shield-rim'){
     const turn=.90*smooth(action);
     transform=([x,y,z])=>{
      const hinge=x<.90?.49:1.31,offset=x-hinge;
      return map([hinge+offset*Math.cos(turn),y,z+Math.abs(offset)*Math.sin(turn)]);
     };
    }else if(index===23){
     // The gate stands beyond the working hand, facing the entrance approach
     // at an angle to the maker. Its columns and staircase stay planted.
     const opening=incoming?smooth((phase.progress-.44)/.30):1;
     if(item.motion==='gate-rail')transform=q=>q;
     else if(item.motion==='gate-carriage'){
      // Same thumb travel as the rig. The carriage stops in its slot before
      // the hand lifts toward the horizon.
      const grip=[mix(-.19,.10,smoother(action)),.42,.425];
      transform=q=>add(grip,q);
     }else{
      const sun=item.motion==='sunrise-disc'||item.motion==='sunrise-ray';
      if(item.motion==='sunrise-ray')alpha*=smooth((opening-.34)/.6);
      if(item.motion==='pier-inlay')alpha*=.26+.74*opening;
      if(item.motion?.startsWith('sunlit-step-'))alpha*=.18+.82*smooth((opening-.09*Number(item.motion.at(-1)))/.58);
      transform=([x,y,z])=>[.09+.73*x-.683*z,sun?Math.max(.038,y-.68*(1-opening)):y,.425+.683*x+.73*z];
     }
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
   const front={...o,role:'front-work',labelSurface:{origin:work.origin,normal:work.normal}};
   if(object.prop==='possibility')return {...front,...paperPlane(position,p)};
   return {...front,prop:object.prop,paths:object.paths.map(workMaterial(o.index)),texts:object.texts.map(item=>({...item,point:['code','component','ai'].includes(object.prop)?add(work.keyboard.origin,add(mul(work.keyboard.v,-work.keyboard.height/2-.10),mul(work.keyboard.normal,-.015))):object.prop==='lesson'?heldPage(item.point):map(item.point)}))};
  });
  if(from===22&&raw>0&&raw<.99){
   const cableLayer=layers.find(layer=>layer.index===22);
   const harnessPaths=cableLayer?.paths??objectScene(22).paths.filter(item=>item.motion==='harness').map(workMaterial(22));
   const stepPaths=layers.find(layer=>layer.index===23)?.paths??objectScene(23).paths.filter(item=>item.motion?.startsWith('sunlit-step-')).map(workMaterial(23));
   const steps=stepPaths.filter(item=>item.motion?.startsWith('sunlit-step-')).reverse();
   const entrance=unspoolEntrance(harnessPaths.filter(item=>item.motion==='harness'),steps,raw);
   if(cableLayer)cableLayer.paths=cableLayer.paths.filter(item=>item.motion!=='harness');
   layers.push(entrance);
  }
  if(timeline>=17&&timeline<19)layers.push(...lessonLeaves(position,p,layers.find(l=>l.prop==='lesson'),idleSeconds));
  if(p.drawing?.strokes){const alpha=p.phase.to===3?1-smooth(p.phase.progress/.32):1,paths=p.drawing.strokes.filter(points=>points.length>1).map(points=>({points,color:cfg.tones.human,width:2.3,alpha:1,fill:null,role:'work'}));if(paths.length&&alpha>.005)layers.push({id:'drawn-ink',alpha,textAlpha:0,paths,texts:[]});}
  // The disclosed architecture opens behind the unchanged interaction surface.
  // These are visible layers with their own world-space depth, not a moved hand target.
  const reveal=clamp(explode)*smooth((position-6.5)/.2)*smooth((8.2-position)/.2);
  if(reveal>.001){
   // The rear graphs fan beside/below the head as the camera turns. Preserve
   // the front interaction plane and real layer depth; only their spread changes.
   const orbit=orbitAt(position),fan=orbit?.disclosureFan,side=fan?orbit.weight*smooth((Math.abs(orbit.camera.yaw)-.45)/.60):0;
   // Once the invitation is in the outstretched palm, fan the hidden graph
   // past its far edge so both circuitry and envelope can still be read.
   const invitationClearance=.72*smooth((timeline-24.25)/.75);
   // Lift the disclosed boards above the sunlit stair instead of burying
   // their connection nodes in the solid courses of its foundation.
   const gateClearance=.29*smooth((timeline-22.15)/.60)*(1-smooth((timeline-23.35)/.55));
   for(let level=2;level>=1;level--){
    const color=level===1?cfg.tones.build:cfg.tones.human,origin=add(work.origin,add(mul(work.normal,-.34*level*reveal),add(mul(work.u,((.40+(fan?.[0]||0)*side)*level+invitationClearance+gateClearance)*reveal),mul(work.v,((.20+(fan?.[1]||0)*side)*level+gateClearance)*reveal)))),paths=[];
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
  const thread=storyThread(timeline,p,position);if(thread.alpha>.005)layers.push(thread);
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
 function shotCamera(i){if(cameraCache.has(i))return cameraCache.get(i);const base=cfg.camera.shots[sequence[i].prop==='possibility'?'offering':i===22||i===23?'gateway':sequence[i].shot||'establish'],seat=motion.poseAt(i).seatAmount||0;const value={...base,target:[...base.target]};if(i>0){if(sequence[i].shot==='establish')value.target=[-.24,-.10,.16];value.target[1]-=.15*seat;}cameraCache.set(i,value);return value;}
 function cameraTrack(position){
  position=clamp(position,0,cfg.scenes.length-1);const chapter=Math.floor(position),start=starts[chapter];
  return Math.min(sequence.length-1,start+(position-chapter)*sequence[start].count);
 }
 function orbitAt(position,{compact=false}={}){
  const track=cameraTrack(position),event=cfg.camera.orbits?.find(item=>track>item.start&&track<item.end);
  if(!event)return null;
  const weight=clamp(smoother((track-event.start)/(event.lockStart-event.start))*(1-smoother((track-event.returnEnd)/(event.end-event.returnEnd))));
  const entry=compact?mix(-.20,event.entryYaw,cfg.camera.compactStrength):event.entryYaw,exit=compact?mix(-.20,event.exitYaw,cfg.camera.compactStrength):event.exitYaw,peak=compact?event.compactYaw:event.yaw;
  const yaw=track<=event.holdEnd?mix(entry,peak,smoother((track-event.lockStart)/(event.turnEnd-event.lockStart))):mix(peak,exit,smoother((track-event.holdEnd)/(event.returnEnd-event.holdEnd)));
  return {id:event.id,track,weight,locked:track>=event.lockStart&&track<=event.returnEnd,progress:clamp((track-event.start)/(event.end-event.start)),disclosureFan:event.disclosureFan?[...event.disclosureFan]:null,camera:{yaw,pitch:event.pitch,distance:event.distance,target:[...event.target]}};
 }
 function focusAt(position,{compact=false}={}){
  const track=cameraTrack(position),event=cfg.camera.inserts?.find(e=>track>e.start&&track<e.end);if(!event)return null;
  const weight=smoother((track-event.start)/(event.arrive-event.start))*(1-smoother((track-event.holdEnd)/(event.end-event.holdEnd))),p=motion.poseAt(resolve(position));
  let point=event.subject==='head'?p.head:event.subject==='light'?p.light:event.subject==='drawing'?(p.tool?.held>.5?p.tool.tip:p.light):p.work.origin;
  if(event.subject==='cables'){
   // Look between the fingers while they work. On release the gaze travels
   // along the raised end before the wider doorway occupies the frame.
   const midpoint=lerp(p.contacts.left.tip,p.contacts.right.tip,.50);
   point=lerp(midpoint,p.contacts.right.tip,.48*smoother((track-event.holdEnd)/(event.end-event.holdEnd)));
  }
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
   handoff=smoother(release+1/3),
   subject=lerp(lessonPagePoint(p,[.84,.355]),workCentre,smoother(release)),
   // Ease back along the paper normal as the leaves separate. This gives
   // both the flying sheets and the incoming sample folio room in the frame.
   withdraw=smoother((track-event.holdEnd)/.14),
   shoulder=at(event.shoulderOffset),eye=at(event.eyeOffset),lens=add(eye,mul(p.work.normal,-.38*handoff-.75*withdraw)),
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
  project.eye=[tx-sy*cx*camera.distance,ty+sx*camera.distance,tz+cy*cx*camera.distance];
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
 // Objects can have bevels, curled sheets and moving lids. A work label
 // faces out of the maker's work plane regardless of their tessellation.
 function workLabelVisibility(layers,project,{still=false}={}){
  const surface=layers.find(layer=>layer.labelSurface)?.labelSurface;
  // A static plate keeps its caption through a close-up. The live camera
  // yields that space to the subject until it pulls back.
  const focus=still?1:1-smooth(project.camera.focusWeight/.25);
  if(!surface)return focus;
  const towardEye=norm(sub(project.eye,surface.origin));
  const facing=surface.normal.reduce((sum,n,i)=>sum+n*towardEye[i],0);
  return smooth((facing-.10)/.25)*focus;
 }
 function projectIllustrations(layers,project){return layers.map(layer=>({...layer,paths:layer.paths.flatMap(item=>project.clip(item.points,!!item.fill).map(points=>({...item,points:points.map(project)})))}));}
 // Compatibility for callers that explicitly need the legacy neutral projection.
 function project(p,w,h,yaw=0,pitch=0){return prepareProjection({...cfg.camera,target:[0,0,0]},w,h,yaw,pitch)(p);}
 function positionFromAnchors(scroll,anchors,readingStops){
  if(readingStops&&scroll>=readingStops[0][0]&&scroll<=readingStops.at(-1)[0]){
   for(let i=1;i<readingStops.length;i++){
    const [start,from]=readingStops[i-1],[end,to]=readingStops[i];
    if(scroll<=end)return mix(from,to,clamp((scroll-start)/Math.max(.001,end-start)));
   }
  }
  if(scroll<=anchors[0])return 0;for(let i=0;i<anchors.length-1;i++)if(scroll<anchors[i+1]){const p=(scroll-anchors[i])/(anchors[i+1]-anchors[i]);return i+clamp((p-cfg.morph.start)/(cfg.morph.end-cfg.morph.start));}return anchors.length-1;}
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
 const api={motion,launchPaperPlane,performanceAt:(position,idleSeconds=0)=>motion.poseAt(resolve(position),idleSeconds),config:cfg,LINES,SAMPLES,sequence,starts,resolve,storyAt,orbitAt,focusAt,cameraTrack,cameraAt,cameraEye,filamentAt,filamentRails,perspectiveAt,createProjector,projectorForCamera:prepareProjection,bodyLines:(p,detail=2)=>createScene(29,p,true,detail).filter(l=>l.points.length>1).map(l=>({...l,alpha:l.alpha*(l.group==='human'?.76:1)})),bodySkin:p=>gloveSkin(29,p),projectLines,projectIllustrations,workLabelVisibility,skinMaterials,clipFilled,sceneryFocus,sceneryOpacity,paletteAt,dramaAt,illustration,lightAt,lightTrail,trailSpanAt,clamp,mix,smooth,openingPhase,frame,project,positionFromAnchors};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
