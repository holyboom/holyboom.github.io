/* Articulated human / environment geometry. Shared by Canvas, SVG and reversibility QA.
   Every anatomical strand keeps its identity through every chapter. */
(function(root){'use strict';
 const cfg=typeof module==='object'&&module.exports?require('./scenes.js'):root.ProfileScenes;
 const motion=typeof module==='object'&&module.exports?require('./motion.js'):root.ProfileMotion;
 const hands=typeof module==='object'&&module.exports?require('./hand-shapes.js'):root.ProfileHandShapes;
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
  starts.push(sequence.length);const base=cfg.scenes[chapter],beats=cfg.story?.find(s=>s.chapter===chapter)?.beats||[{action:base.verb,caption:base.caption,pose:base.pose,prop:'none',tone:'dream',meaning:'Imagination',energy:1}];
  beats.forEach((beat,step)=>sequence.push({...base,...beat,chapter,step,count:beats.length}));
 }
 function resolve(position){
  position=clamp(position,0,cfg.scenes.length-1);const chapter=Math.floor(position),start=starts[chapter],count=sequence[start].count,local=(position-chapter)*count,step=Math.min(count-1,Math.floor(local)),phase=local-step;
  const hold=cfg.actingHolds?.find(item=>item.beat===start+step),begin=hold?.until??.20;
  return Math.min(sequence.length-1,start+step+smooth((phase-begin)/(.85-begin)));
 }
 function storyAt(position){const timeline=resolve(position),index=Math.min(sequence.length-1,Math.floor(timeline)+(timeline%1>.24?1:0)),shot=sequence[index];return {...shot,index,total:sequence.length,timeline};}
 const rgb=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
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
  // A continuous woven landscape: soft hills settle around the maker's gravity well.
  const field=(x,z)=>[x,-1.32-.10*Math.exp(-((x+.25)**2+z*z)*1.6)+.24*Math.sin(x*1.8+z*.7+(options.chapter+options.step*.18)*.4)+.15*Math.cos(z*2.2),z];
  for(let j=0;j<50;j++){const q=-2+j*4/49;emit(t=>field(q,-1.6+t*3.2),'world',quiet?.20:.47,.6,j%7===0);emit(t=>field(-2+t*4,q*.8),'world',quiet?.20:.47,.6,j%7===0);}
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
   if(line.group==='world')line.alpha*=.15+.65*(options.energy??1);
   if(['human','hair','detail'].includes(line.group))line.alpha*=.76;
  }
  return lines;
 }
 const cache=[];
 const scene=i=>cache[i]||(cache[i]=createScene(i));
 const LINES=scene(0).length;
 // The complete body moves together so hands never detach from arms. The world follows.
 const timing={intent:[0,.76],hand:[0,.76],human:[0,.76],hair:[0,.76],detail:[0,.76],ui:[.22,.95],prop:[.22,.95],architecture:[.30,1],network:[.24,1],world:[.36,1],code:[.18,.96]};
 function frame(position,detail=1,explode=0){
  const timeline=resolve(position),a=Math.floor(timeline),b=Math.min(a+1,sequence.length-1),raw=timeline-a;
  const source=scene(a),destination=raw?scene(b):source,p=motion.poseAt(timeline),body=createScene(a,p,true,a>0?detail:1);
  const lines=[],pulse=Math.sin(PI*raw)**2,attractor=p.light;
  for(let l=0;l<source.length;l++){
   const s=source[l],d=destination[l];if(detail>1&&Math.floor(l/2)%detail&&!s.important)continue;
   if(l<body.length&&a>0){const live=body[l];lines.push({...live,alpha:live.alpha*(live.group==='human'?.76:1)});continue;}
   if(s.alpha<=.005&&d.alpha<=.005&&!(a===0&&l<body.length)){lines.push(s);continue;}
   const range=a===0?[0,.88]:(timing[s.group]||[0,1]),t=smooth((raw-range[0])/(range[1]-range[0]));
   const targetLine=a===0&&l<body.length?body[l]:d;
   const environment=['prop','ui','architecture','network','world','code','fabric'].includes(s.group),pull=environment?cfg.gravity.collapse:0;
   const angle=pulse*cfg.gravity.swirl*(environment?1:0),c=Math.cos(angle),sn=Math.sin(angle),radius=1-pull*pulse;
   const points=s.points.map((q,k)=>{
    const dest=targetLine.points[k];let v=[mix(q[0],dest[0],t),mix(q[1],dest[1],t),mix(q[2],dest[2],t)];
    if(pulse>0&&pull>0&&!(a===0&&l<body.length)){const x=v[0]-attractor[0],y=v[1]-attractor[1],z=v[2]-attractor[2];v=[attractor[0]+radius*(x*c-z*sn),attractor[1]+radius*y,attractor[2]+radius*(x*sn+z*c)];}
    if(s.group==='world'&&a>0){const distance=Math.min(...p.feet.map(f=>Math.hypot(v[0]-f[0],v[2]-f[2]-.07)));v[1]=mix(v[1],p.support.floorY,smooth(1-distance/.40));}
    if(explode&&environment){v[0]+=(s.group==='prop'?.25:.55)*explode;v[2]-=(s.group==='network'?.7:.3)*explode;}
    return v;
   });
   const group=raw>.5?targetLine.group:s.group;
   lines.push({...s,group,alpha:mix(s.alpha,targetLine.alpha,t),points});
  }
  return lines;
 }
 function lightAt(position){
  const timeline=resolve(position),light=motion.lightAt(timeline);return timeline>=1?light:lerp(scene(0)[0].points[0],light,smooth(timeline/.88));
 }
 function lightTrail(position,direction=1,span=cfg.gravity.trailSpan,count=32){
  return Array.from({length:count},(_,i)=>{const age=i/(count-1);return {point:lightAt(position-direction*span*age),alpha:(1-age)**1.7};});
 }
 // Recognizable action props sit in front of the woven world. Colour supports their meaning.
 const objectCache=[];
 function objectScene(index){
  if(objectCache[index])return objectCache[index];
  const shot=sequence[index],accent=cfg.tones[shot.tone],paths=[],texts=[],z=.95;
  const isDrawing=['blueprint','house'].includes(shot.prop);
  const point=(x,y,z=0)=>[x,y,z];
  const line=(points,{color=accent,width=2.1,fill=null,alpha=1,role='work'}={})=>paths.push({points:points.map(p=>point(...p)),color,width,fill,alpha,role});
  const label=(text,x=.89,y=-.35,size=11)=>texts.push({text,point:point(x,y),color:accent,size});
  const arc=(x,y,rx,ry,start=0,end=TAU,style={})=>line(Array.from({length:49},(_,i)=>{const a=mix(start,end,i/48);return [x+Math.cos(a)*rx,y+Math.sin(a)*ry];}),style);
  const roundRect=(x,y,w,h,style={})=>{
   const r=Math.min(.09,w*.15,h*.15),points=[];
   for(const [cx,cy,start] of [[x+w-r,y+h-r,0],[x+r,y+h-r,PI/2],[x+r,y+r,PI],[x+w-r,y+r,PI*1.5]])for(let i=0;i<9;i++){const a=start+i/8*PI/2;points.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
   points.push(points[0]);line(points,{fill:'#100f20',...style});
  };
  const frame=()=>{roundRect(.24,-.20,1.30,1.04);line([[.25,.65],[1.53,.65]],{width:.7,alpha:.5});for(let i=0;i<3;i++)arc(.34+i*.08,.74,.013,.013,0,TAU,{width:1});};
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
   roundRect(.24,-.20,1.30,1.04,{fill:'#131021'});for(let i=0;i<5;i++){line([[.34+i*.23,-.10],[.34+i*.23,.57]],{width:.5,alpha:.2});line([[.32,-.10+i*.15],[1.45,-.10+i*.15]],{width:.5,alpha:.2});}
   if(prop==='house'){line([[.47,.23],[.89,.57],[1.31,.23]],{width:3});roundRect(.57,-.06,.64,.34,{fill:null,width:2.6});roundRect(.82,-.06,.15,.24,{fill:null,width:1.5});roundRect(1.02,.11,.10,.09,{fill:null,width:1});}
   else{roundRect(.52,-.01,.69,.46,{fill:null});line([[.83,-.01],[.83,.23],[1.20,.23]],{width:1.5});arc(.83,.23,.15,.15,-PI/2,0,{width:1});}
   label(prop==='house'?'A PLACE FOR PEOPLE':'THE FIRST DRAWING');
  }else if(['code','component','ai'].includes(prop)){
   frame();line([[.24,-.20],[.06,-.48],[1.65,-.48],[1.54,-.20]],{fill:'#111c28',width:2,role:'keyboard'});for(let i=0;i<6;i++)line([[.37+i*.15,-.29],[.35+i*.15,-.37]],{width:3,alpha:.55,role:'keyboard'});line([[.63,.47],[.47,.32],[.63,.17]],{width:3});line([[1.12,.47],[1.28,.32],[1.12,.17]],{width:3});line([[.98,.50],[.80,.14]],{width:2});
   line([[.47,-.04],[.83,-.04]],{width:2,alpha:.5});line([[.91,-.04],[1.31,-.04]],{width:2,alpha:.35});
   if(prop==='ai'){orb(1.42,.84,.19,{color:cfg.tones.dream});label('AI ENTERS THE WORKFLOW');}
   else label(prop==='code'?'DRAWING → CODE':'ONE WORKING COMPONENT');
  }else if(['assembly','network','complexity'].includes(prop)){
   const nodes=prop==='complexity'?[[.36,.75],[.87,.88],[1.38,.69],[.46,.13],[1.0,.30],[1.48,-.05],[.79,-.25]]:[[.39,.15],[.91,.65],[1.42,.15]];
   for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(prop!=='network'||j===i+1)link(nodes[i],nodes[j],{alpha:prop==='complexity'?.4:.9});
   for(const [i,node]of nodes.entries()){roundRect(node[0]-.15,node[1]-.12,.30,.24,{width:1.7});if(prop==='assembly')check(node[0],node[1]);else arc(...node,.045,.045,0,TAU,{width:1});}
   label(prop==='complexity'?'THE DEPTH BENEATH':prop==='network'?'PEOPLE · REQUIREMENTS · CODE':'PARTS BECOME A SYSTEM',.89,-.52);
  }else if(['brief','review','verified','lesson'].includes(prop)){
   page();if(prop==='review'){arc(1.24,.02,.25,.25,0,TAU,{color:cfg.tones.human,fill:'#151323'});line([[1.4,-.14],[1.57,-.31]],{color:cfg.tones.human,width:4});arc(1.24,.02,.08,.05,0,TAU,{color:cfg.tones.human});}
   if(prop==='verified'){arc(1.24,.02,.22,.22,0,TAU,{color:cfg.tones.care,fill:'#101b19'});check(1.24,.02);}
   if(prop==='lesson'){arc(.90,.83,.12,.12,0,TAU,{fill:'#211c18'});line([[.84,.65],[.96,.65]],{width:2});}
   label({brief:'UNDERSTAND THE NEED',review:'A PERSON REVIEWS',verified:'REVIEWED BY A PERSON',lesson:'KEEP THE LESSON'}[prop]);
  }else if(prop==='ember'){
   const x=.89,y=.32;
   for(let i=3;i>0;i--)arc(x,y,.07+i*.065,.09+i*.09,0,TAU,{color:cfg.tones.human,width:1,alpha:.16/i});
   line([[x,y-.09],[x-.12,y+.01],[x-.06,y+.15],[x+.015,y+.26],[x+.10,y+.07],[x+.08,y-.06],[x,y-.09]],{color:cfg.tones.human,fill:'#ffd394',width:1.5,alpha:.9});
   // The nearby HTML action/caption carries this meaning; keep the hands free of labels.
  }else if(['fracture','repair'].includes(prop)){
   orb(.35,.40,.16);orb(1.42,.40,.16);
   link([.51,.40],[.79,.40]);link([1.05,.40],[1.26,.40]);
   if(prop==='fracture'){line([[.89,.64],[.82,.49],[.99,.35],[.88,.19]],{color:cfg.tones.friction,width:3});arc(.93,.40,.36,.36,0,TAU,{color:cfg.tones.friction,alpha:.18,width:1});label('THE PATH IS NOT CLEAR');}
   else{link([.79,.40],[1.05,.40],{color:cfg.tones.human,width:4});check(.93,.03);label('TRY · LEARN · REFINE');}
  }else if(prop==='library'){
   for(let i=0;i<3;i++){const x=.28+i*.41,y=.08+Math.sin(i*2)*.15;roundRect(x,y,.33,.54);line([[x+.07,y+.04],[x+.07,y+.50]],{width:1});line([[x+.13,y+.39],[x+.27,y+.39]],{width:1.5});link([x+.16,y+.56],[.9,.92],{width:1,alpha:.5});}
   orb(.9,.93,.12);label('SEEK · SELECT · SYNTHESIZE');
  }else if(['skill','moat'].includes(prop)){
   orb(.9,.36,.29,{color:cfg.tones.dream});
   if(prop==='moat')line([[.90,1.0],[1.44,.76],[1.40,.10],[.90,-.33],[.40,.10],[.36,.76],[.90,1.0]],{width:2.7});
   else for(let i=0;i<3;i++){const a=i/3*TAU;orb(.9+Math.cos(a)*.55,.36+Math.sin(a)*.55,.07,{color:cfg.tones.human});link([.9+Math.cos(a)*.46,.36+Math.sin(a)*.46],[.9+Math.cos(a)*.30,.36+Math.sin(a)*.30],{alpha:.5});}
   label(prop==='moat'?'PURPOSE · METHOD · CHARACTER':'A SKILL OF ITS OWN',.90,-.53);
  }else if(['interface','choice','recipient'].includes(prop)){
   frame();line([[.43,.46],[1.03,.46]],{width:3});line([[.43,.31],[1.28,.31]],{width:1.3,alpha:.5});
   roundRect(.43,-.03,.83,.18,{color:cfg.tones.care,fill:'#12382d'});line([[.99,.02],[1.08,.06],[.99,.1]],{color:cfg.tones.care,width:2});
   if(prop==='choice'){arc(1.40,.17,.23,.23,0,TAU,{color:cfg.tones.human,fill:'#191a22'});check(1.4,.17);}
   if(prop==='recipient'){arc(1.47,.89,.15,.15,0,TAU,{color:cfg.tones.human,fill:'#191a22'});line([[1.19,.57],[1.24,.70],[1.47,.76],[1.68,.70],[1.74,.57]],{color:cfg.tones.human,width:2.5});}
   if(prop!=='recipient')label(prop==='choice'?'YOUR NEXT STEP. YOUR CHOICE.':'A CLEAR WAY IN');
  }
  return objectCache[index]={paths,texts,prop};
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
  return {role:'surroundings',id:'story-world',name:t<.5?a.name:b.name,alpha:mix(a.strength,b.strength,t),textAlpha:0,texts:[],paths,
   focus:[{point:p.head,radius:.30},{point:p.handL,radius:.13},{point:p.handR,radius:.15},{point:p.work.origin,radius:.43}]};
 }
 // Soft, screen-space negative space keeps new scenic glyphs off the blank
 // head and the interaction. The 3D set itself stays anchored during orbits.
 function sceneryFocus(layer,project){return (layer.focus||[]).map(f=>{const q=project(f.point);return {x:q[0],y:q[1],radius:f.radius*project.scale/Math.max(.25,project.camera.distance-q[2])};});}
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
 function storyThread(timeline,p){
  const chapter=Math.min(10,timeline<1?timeline:sequence[Math.floor(timeline)].chapter),raw=timeline%1;
  const next=sequence[Math.min(sequence.length-1,Math.floor(timeline)+1)].chapter,c=mix(chapter,next,smooth(raw));
  const response=responseAt(timeline,p),fracture=(sequence[Math.floor(timeline)].prop==='fracture'?1-smooth(raw):0)+(sequence[Math.ceil(timeline)].prop==='fracture'?smooth(raw):0);
  const formA=cfg.memoryForms[Math.floor(c)],formB=cfg.memoryForms[Math.min(10,Math.floor(c)+1)],form=formA.map((v,i)=>mix(v,formB[i],smooth(c%1))),origin=p.light;
  const end=[.98,-.84,-.40],control1=add(origin,[.04,-.24,-.12]),control2=[.70,-1.04,-.35];
  const bezier=(a,b,c,d,t)=>a.map((v,k)=>(1-t)**3*v+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k]);
  const route=t=>{
   if(t<.42)return bezier(origin,control1,control2,end,t/.42);
   const u=(t-.42)/.58,a=u*TAU*form[2],x=Math.cos(a),y=Math.sin(a),r=1+form[4]*Math.sin(3*a);
   return [end[0]+form[0]*(Math.sign(x)*Math.abs(x)**form[3]*r-1),end[1]+form[1]*Math.sign(y)*Math.abs(y)**form[3]*r,end[2]-.20*u+.12*Math.sin(a*.7+c*.28)*Math.sin(PI*u)];
  };
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
    for(let row=0;row<intervals.length-1;row++)for(let column=0;column<12;column++){
     const u=intervals[row],v=intervals[row+1],a=column/12*TAU,b=(column+1)/12*TAU,points=[fn(u,a),fn(u,b),fn(v,b),fn(v,a)].map(world),surface='glove-'+side+'-'+name;
     paths.push({id:surface+'-'+row+'-'+column,points:[...points,points[0]],fill:'#583372',color:'#583372',width:.3,alpha:1,role:'volume',skin:true,surface:'glove-'+side});
    }
   }
   layers.push({id:'hand-skin-'+side,role:'hand-skin',alpha,textAlpha:0,texts:[],paths});
  }
  return layers;
 }
 function illustration(position,explode=0){
  const timeline=resolve(position),from=Math.floor(timeline),to=Math.min(sequence.length-1,from+1),raw=timeline-from,p=motion.poseAt(timeline),work=p.work,handoff=p.phase.to===3?p.tool.handoff:[.10,.26],t=smooth((raw-handoff[0])/(handoff[1]-handoff[0]));
  const map=(q,frame=work)=>add(frame.origin,add(add(mul(frame.u,(q[0]-.89)*(frame.width||1.3)/1.3),mul(frame.v,(q[1]-.32)*(frame.height||1.04)/1.04)),mul(frame.normal,(q[2]||0)*Math.min((frame.width||1.3)/1.3,(frame.height||1.04)/1.04))));
  const keyboard=q=>{const f=work.keyboard||work;return add(f.origin,add(mul(f.u,(q[0]-.855)*(f.width||.84)/1.59),mul(f.v,(q[1]+.34)*(f.height||.30)/.28)));};
  const layers=[{index:from,alpha:1-t,textAlpha:1-smooth((raw-handoff[0]+.08)/.08)},{index:to,alpha:t,textAlpha:smooth((raw-handoff[1])/.08)}].filter(o=>o.alpha>.005).map(o=>{
   const object=objectScene(o.index),ember=object.prop==='ember';
   return {...o,role:'front-work',prop:object.prop,paths:object.paths.map((item,pathIndex)=>({...item,id:'work-'+o.index+'-'+pathIndex,alpha:item.alpha*(object.prop==='house'&&!item.fill? .32:1),points:item.points.map(q=>item.role==='keyboard'?keyboard(q):ember?add(p.light,add(mul(work.u,(q[0]-.89)*.42),mul(work.v,(q[1]-.32)*.42))):map(q))})),texts:object.texts.map(item=>({...item,point:['code','component','ai'].includes(object.prop)?add(work.keyboard.origin,add(mul(work.keyboard.v,-work.keyboard.height/2-.10),mul(work.keyboard.normal,-.015))):map(item.point)}))};
  });
  if(p.drawing?.strokes){const alpha=p.phase.to===3?1-smooth(p.phase.progress/.32):1,paths=p.drawing.strokes.filter(points=>points.length>1).map(points=>({points,color:cfg.tones.human,width:2.3,alpha:1,fill:null,role:'work'}));if(paths.length&&alpha>.005)layers.push({alpha,textAlpha:0,paths,texts:[]});}
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
  const thread=storyThread(timeline,p);if(thread.alpha>.005)layers.push(thread);
  // The first imagined place returns as a soft, open pavilion for the visitor.
  const closing=smooth((position-9.15)/.85);
  if(closing>.005){const paths=[],path=(id,fn,alpha,width=.8)=>paths.push({id:'closing-'+id,points:Array.from({length:49},(_,i)=>fn(i/48)),color:cfg.tones.dream,width,alpha,fill:null,role:'surroundings',secondary:false});
   for(let rib=0;rib<3;rib++)path('arch-'+rib,t=>{const a=t*PI;return [-.22+Math.cos(a)*(1.15-rib*.07),-1.27+Math.sin(a)*(2.90-rib*.06),-.76-rib*.23];},rib===0?.75:.33,rib===0?1.15:.7);
   for(let line=0;line<5;line++)path('roof-'+line,t=>{const a=(line+1)/6*PI;return [-.22+Math.cos(a)*(1.15-.14*t),-1.27+Math.sin(a)*(2.90-.12*t),-.76-.46*t];},.24,.65);
   layers.push({id:'closing-architecture',role:'surroundings',alpha:closing*.30,textAlpha:0,texts:[],paths});
  }
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
  return {...base,orbitId:orbit?.id||null,orbitWeight:weight,locked:!!orbit?.locked&&strength===1,focusId:focusWeight>0?focus.id:null,focusWeight,framing:focusWeight>.02?focus.framing:'full'};
 }
 function prepareProjection(camera,w,h,yaw=0,pitch=0){
  const cy=Math.cos(camera.yaw+yaw),sy=Math.sin(camera.yaw+yaw),cx=Math.cos(camera.pitch+pitch),sx=Math.sin(camera.pitch+pitch),[tx,ty,tz]=camera.target,scale=Math.min(w,h)*.285*camera.focal,ox=w/2,oy=h/2;
  // Rotation and viewport coefficients are computed once, not for every strand vertex.
  const project=p=>{const qx=p[0]-tx,qy=p[1]-ty,qz=p[2]-tz,x=qx*cy+qz*sy,z=-qx*sy+qz*cy,y=qy*cx-z*sx,depth=qy*sx+z*cx,k=scale/Math.max(.25,camera.distance-depth);return [ox+x*k,oy-y*k,depth];};
  project.camera=camera;project.scale=scale;project.center=[ox,oy];return project;
 }
 function createProjector(position,w,h,{compact=false,yaw=0,pitch=0,strength=1,expanded=0}={}){
  const camera=cameraAt(position,{compact,strength,expanded}),free=1-Math.max(camera.orbitWeight,camera.focusWeight);
  return prepareProjection(camera,w,h,yaw*free,pitch*free);
 }
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
 const api={motion,performanceAt:position=>motion.poseAt(resolve(position)),config:cfg,LINES,SAMPLES,sequence,starts,resolve,storyAt,orbitAt,focusAt,cameraTrack,cameraAt,createProjector,skinMaterials,clipFilled,sceneryFocus,sceneryOpacity,paletteAt,illustration,lightAt,lightTrail,clamp,mix,smooth,frame,project,positionFromAnchors};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileGeometry=api;
})(typeof globalThis!=='undefined'?globalThis:this);
