/* Fixed-length, contact-aware performance for the symbolic woven maker.
   Pure scroll sampling; no accumulated physics state. Authoring: faceless-performance.json. */
(function(root){'use strict';
 const handShapes=typeof module==='object'&&module.exports?require('./hand-shapes.js'):root.ProfileHandShapes;
 if(!handShapes)throw new Error('Profile hand model unavailable');
 const PI=Math.PI,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const smooth=v=>{v=clamp(v);return clamp(v*v*v*(v*(v*6-15)+10));};
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,v)=>a.map(n=>n*v),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),len=a=>Math.hypot(...a),norm=a=>mul(a,1/(len(a)||1)),lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const lengths=Object.freeze({upperArm:.39,forearm:.43,thigh:.47,shin:.48,shoulderSpan:.49,hipSpan:.31,spine:.72});
 const floorY=-1.30,seatY=-.74,seatCenter=[-.48,seatY,-.12],footTargets=[[-.68,-1.18,.38],[-.26,-1.18,.33]],standingFeet=[[-.68,-1.18,.26],[-.26,-1.18,.21]],tableSupport=[-.35,-.10,.46];
 const seated=i=>i<7||(i>=13&&i<=16);
 const names=['design','draw','sketch','type','component','assemble','verify','read','connect','release','ai','inspect','approve','alone','reach','reflect','repair','rise','lesson','research','shape','protect','complexity','clear','agency','welcome','invite','reveal','offer','stand','begin'];
 const kinds=['paper','paper','paper','screen','screen','panel','panel','document','network','network','screen','document','document','light','barrier','lesson','repair','light','lesson','library','skill','skill','network','panel','panel','panel','panel','document','panel','none','none'];
 // Attention, preparation, action, response; the remainder is a readable hold.
 const timing=[[0.16,0.16,0.34,0.14],[0.2,0.15,0.25,0.15],[0.12,0.16,0.4,0.16],[0.12,0.22,0.32,0.16],[0.12,0.16,0.4,0.16],[0.14,0.2,0.34,0.18],[0.14,0.16,0.28,0.18],[0.24,0.14,0.24,0.16],[0.12,0.2,0.36,0.16],[0.16,0.16,0.34,0.14],[0.2,0.16,0.26,0.18],[0.14,0.16,0.28,0.18],[0.16,0.2,0.24,0.18],[0.26,0.16,0.18,0.12],[0.14,0.18,0.22,0.14],[0.18,0.12,0.18,0.12],[0.18,0.24,0.24,0.2],[0.14,0.3,0.28,0.16],[0.2,0.15,0.25,0.15],[0.18,0.16,0.3,0.18],[0.16,0.18,0.32,0.2],[0.14,0.16,0.28,0.18],[0.12,0.2,0.36,0.16],[0.16,0.18,0.3,0.16],[0.18,0.16,0.22,0.14],[0.18,0.18,0.22,0.12],[0.18,0.18,0.22,0.12],[0.16,0.16,0.34,0.14],[0.18,0.16,0.22,0.14],[0.18,0.16,0.18,0.14],[0.16,0.14,0.2,0.1]];
 const direction=[
 // yaw, forward lean, head inclination, lateral weight transfer.
 [.12,.02,.08,0],[-.18,-.07,.02,-.05],[-.22,.34,.43,-.015],[-.10,.23,.26,-.04],
 [.48,.025,.12,.07],[-.24,.18,.20,-.03],[.38,-.045,.26,.05],[-.30,.09,.34,-.05],
 [.42,.055,.04,.07],[-.20,-.075,.015,-.06],[.08,.25,-.035,.035],[-.36,.28,.39,-.04],
 [.13,-.085,.07,.035],[-.18,.44,.65,-.065],[.38,-.10,.27,.06],[-.34,.38,.72,-.055],
 [.26,.32,.38,.035],[-.22,-.085,-.07,-.025],[.36,.025,.25,.055],[-.15,.13,.035,-.04],
 [-.26,.07,.28,-.05],[.46,-.055,.10,.065],[-.38,.12,-.02,-.045],[.25,.20,.19,.035],
 [-.24,-.08,.04,-.07],[.08,-.025,-.04,.045],[-.16,.035,.12,-.035],[.48,.24,.34,.05],
 [.20,-.055,.045,-.065],[-.34,-.035,.09,.045],[.30,-.065,-.055,-.045]
 ];
 // Negative offsets bend the knees without changing the planted foot targets.
 const level=[0,0,0,0,0,0,0,-.015,0,-.025,-.025,-.075,0,0,0,0,0,0,-.025,-.045,-.25,0,-.035,-.07,-.02,0,-.025,-.055,-.015,0,0];
 // Standing foot marks: width and fore/aft stagger. Transfers step one foot at
 // a time; the sit/rise marks retain the established support choreography.
 const stance={8:[.035,.045],9:[.015,-.055],10:[.045,.02],11:[.01,.065],18:[.02,-.035],19:[.05,.05],20:[.055,-.045],21:[.015,.06],22:[.07,.025],23:[.025,-.055],24:[.04,.06],25:[.065,0],26:[.015,-.065],27:[.035,.04],28:[.05,-.025],29:[0,.06],30:[.055,.035]};
 function footMark(i,side){const base=seated(i)?footTargets[side]:standingFeet[side],s=stance[i];return !s||seated(i)?base:add(base,[(side?1:-1)*s[0],0,(side?1:-1)*s[1]]);}
 let clips=root.ProfilePerformanceClips||null;if(typeof module==='object'&&module.exports){try{clips=require('./performance-source/pilot-clips.js');}catch(error){/* Secondary curves are optional; primary rig remains deterministic. */}}
 function setClips(value){clips=value&&value.clips?value.clips:value;}
 function frame(yaw=0,pitch=0,roll=0){const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),sr=Math.sin(roll),cr=Math.cos(roll);const x=[cy,0,-sy],y=[sy*sp,cp,cy*sp],z=[sy*cp,-sp,cy*cp];return {x:add(mul(x,cr),mul(y,sr)),y:add(mul(y,cr),mul(x,-sr)),z};}
 function apply(f,v){return add(add(mul(f.x,v[0]),mul(f.y,v[1])),mul(f.z,v[2]));}
 function palm(forward,normalHint=[0,1,0]){const z=norm(forward);let x=norm(cross(normalHint,z));if(len(x)<.1)x=norm(cross([1,0,0],z));return {x,y:norm(cross(z,x)),z};}
 function alignToolFrame(localAxis,worldAxis,normalHint){const local=palm(localAxis,[0,1,0]),world=palm(worldAxis,normalHint);return {x:apply(world,[local.x[0],local.y[0],local.z[0]]),y:apply(world,[local.x[1],local.y[1],local.z[1]]),z:apply(world,[local.x[2],local.y[2],local.z[2]])};}
 function quaternion(f){const m00=f.x[0],m11=f.y[1],m22=f.z[2],trace=m00+m11+m22;let q;if(trace>0){const s=Math.sqrt(trace+1)*2;q=[(f.y[2]-f.z[1])/s,(f.z[0]-f.x[2])/s,(f.x[1]-f.y[0])/s,s/4];}else if(m00>m11&&m00>m22){const s=Math.sqrt(1+m00-m11-m22)*2;q=[s/4,(f.y[0]+f.x[1])/s,(f.z[0]+f.x[2])/s,(f.y[2]-f.z[1])/s];}else if(m11>m22){const s=Math.sqrt(1+m11-m00-m22)*2;q=[(f.y[0]+f.x[1])/s,s/4,(f.z[1]+f.y[2])/s,(f.z[0]-f.x[2])/s];}else{const s=Math.sqrt(1+m22-m00-m11)*2;q=[(f.z[0]+f.x[2])/s,(f.z[1]+f.y[2])/s,s/4,(f.x[1]-f.y[0])/s];}return q;}
 function blendFrame(a,b,t){const qa=quaternion(a);let qb=quaternion(b),cos=dot(qa,qb);if(cos<0){qb=mul(qb,-1);cos=-cos;}let q;if(cos>.9995)q=norm(lerp(qa,qb,t));else{const angle=Math.acos(clamp(cos,-1,1)),den=Math.sin(angle);q=add(mul(qa,Math.sin((1-t)*angle)/den),mul(qb,Math.sin(t*angle)/den));}const [x,y,z,w]=q;return {x:[1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w)],y:[2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w)],z:[2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y)]};}
 function blendWrist(a,b,t){const shape=handShapes.blend(a.shape,b.shape,t),customOffset=!!(a.customOffset||b.customOffset);return {frame:blendFrame(a.frame,b.frame,t),offset:customOffset?lerp(a.offset,b.offset,t):shape.contactOffset,curl:mix(a.curl,b.curl,t),shape,customOffset};}
 function sampleClip(name,u){const clip=clips?.[name]||clips?.clips?.[name];if(!clip?.keys?.length)return null;const keys=clip.keys;let a=keys[0],b=keys[keys.length-1];for(let i=1;i<keys.length;i++)if(keys[i].t>=u){a=keys[i-1];b=keys[i];break;}const t=clamp((u-a.t)/Math.max(.00001,b.t-a.t));const out={};for(const key of ['lean','yaw','headYaw','headPitch'])out[key]=mix(a[key]||0,b[key]||0,t);for(const key of ['handL','handR','pelvis'])out[key]=lerp(a[key]||[0,0,0],b[key]||[0,0,0],t);return out;}
 function twoBone(origin,requested,l1,l2,pole){const delta=sub(requested,origin),distance=len(delta),axis=norm(distance<1e-8?[0,-1,0]:delta),d=clamp(distance,Math.abs(l1-l2)+.0001,l1+l2-.0002),end=add(origin,mul(axis,d));let side=sub(sub(pole,origin),mul(axis,dot(sub(pole,origin),axis)));if(len(side)<1e-6)side=cross(axis,[0,0,1]);if(len(side)<1e-6)side=cross(axis,[1,0,0]);side=norm(side);const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));return {joint:add(add(origin,mul(axis,along)),mul(side,height)),end,requested:[...requested],clamped:Math.abs(distance-d)>1e-6,error:Math.abs(distance-d)};}
 function workFrame(kind,stand,index=-1){const paper=kind==='paper',screen=kind==='screen',origin=paper?[-.06,-.17+stand*.39,.40]:[screen?.18:-.06,(screen?.31:.03)+stand*.33,.40],u=[1,0,0],v=paper?[0,.62,-Math.sqrt(1-.62*.62)]:[0,1,0];if(index===15){origin[0]-=.10;origin[1]-=.20;origin[2]-=.10;}if(index===18){origin[0]=-.20;origin[2]=.82;}if(index===20)origin[1]-=.18;const normal=norm(cross(u,v));const keyboard={origin:[-.08,-.23+stand*.39,.48],u:[1,0,0],v:[0,.13,-Math.sqrt(1-.13*.13)],normal:[0,Math.sqrt(1-.13*.13),.13],width:.84,height:.30};return {origin,u,v,normal,width:screen?.82:.92,height:paper?.72:screen?.42:.56,kind,keyboard};}
 function blendWork(a,b,t){const u=norm(lerp(a.u,b.u,t)),v=norm(lerp(a.v,b.v,t)),normal=norm(cross(u,v));return {origin:lerp(a.origin,b.origin,t),u,v,normal,width:mix(a.width,b.width,t),height:mix(a.height,b.height,t),kind:t<.5?a.kind:b.kind,keyboard:b.keyboard};}
 function toolDock(w){const tip=at(w,.45,.16,.018);return {tip,shaftEnd:add(tip,mul(w.v,.202)),origin:[...w.origin],u:[...w.u],v:[...w.v],normal:[...w.normal]};}
 function at(w,x,y,z=0){return add(w.origin,add(add(mul(w.u,x),mul(w.v,y)),mul(w.normal,z)));}
 function painted(w,x,y,z=.012){return at(w,(x-.89)*w.width/1.3,(y-.32)*w.height/1.04,z);}
 function inspectWork(w,amount){if(!amount)return w;const x=(.46-.89)*w.width/1.3,y=(-.035-.32)*w.height/1.04,z=.015,pivot=at(w,x,y,z),r=frame(.24*amount,-.10*amount,.08*amount),u=apply(r,w.u),v=apply(r,w.v),normal=norm(cross(u,v));return {...w,u,v,normal,origin:sub(pivot,add(add(mul(u,x),mul(v,y)),mul(normal,z)))};}
 function handSpec(i,side,w,body){const right=side===1,hip=body.hip,head=body.head;const bodyAt=v=>add(hip,v),work=(x,y,z,grip='open',active=false,space='work')=>({target:at(w,x,y,z),grip,active,space});const rest=(open=false)=>({target:bodyAt(right?[.27,.14,.27]:[-.23,.10,.23]),grip:open?'open':'relaxed',active:false,space:'body'});const key=(x,y,z,active=false)=>({target:at(w.keyboard,x,y,z),grip:'type',active,space:'keyboard'});
  switch(i){
   case 0:return right?work(-.08,.06,.13,'write'):work(-.34,-.17,.025,'brace',true);
   case 1:return right?work(.04,.24,.24,'write'):{target:bodyAt([-.23,.35,.19]),grip:'open',active:false,space:'body'};
   case 2:return right?work(-.03,.17,.27,'write'):work(-.34,-.17,.025,'brace',true);
   case 3:return right?key(.13,-.01,.07):key(-.19,.01,.075);
   case 4:return right?work(.12,.08,.08,'point'):key(-.19,.01,.07);
   case 5:return right?work(.08,-.06,.12,'open'):work(-.30,.18,.08,'open');
   case 6:return right?{target:bodyAt([.08,.52,.19]),grip:'reflect',active:false,space:'body'}:{target:add(tableSupport,[0,.02,0]),grip:'brace',active:false,space:'support'};
   case 7:return right?{target:bodyAt([.31,.83,.16]),grip:'reflect',active:false,space:'body'}:work(-.32,-.15,.025,'hold',true);
   case 18:return right?{target:bodyAt([.02,.42,.24]),grip:'cup',active:false,space:'body'}:{...work(-.30,-.12,-.025,'hold',true),back:true};
   case 8:return right?work(.31,.18,.08,'point'):work(-.32,-.11,.07,'open');
   case 22:return right?work(.20,-.10,.10,'hold'):work(-.32,.18,.07,'point');
   case 9:return {target:bodyAt(right?[.48,.28,.31]:[-.43,.24,.26]),grip:'open',active:false,space:'body'};
   case 10:return right?work(.18,.27,.10,'point'):key(-.18,0,.06);
   case 11:return right?work(.03,.12,.09,'point'):work(-.32,-.15,.025,'hold',true);
   case 12:return right?{target:bodyAt([.44,.40,.25]),grip:'open',active:false,space:'body'}:{target:add(tableSupport,[0,.02,0]),grip:'brace',active:false,space:'support'};
   case 13:return {target:bodyAt(right?[.13,.35,.36]:[-.075,.33,.37]),grip:'cup',active:false,space:'body'};
   case 14:return right?work(.04,-.04,.10,'point'):{target:[...tableSupport],grip:'brace',active:true,space:'support'};
   case 15:return right?{target:add(head,apply(body.headFrame,[.10,.06,.12])),grip:'reflect',active:true,space:'head-support'}:{target:painted(w,.46,-.035,.015),grip:'cup',active:true,space:'fragment',roll:-.15};
   case 16:return right?work(.04,-.17,.19,'open'):work(-.35,-.21,.12,'open');
   case 17:return {target:bodyAt(right?[.13,.40,.35]:[-.37,.12,.15]),grip:right?'cup':'open',active:false,space:'body'};
   case 19:return right?work(.14,.15,.12,'hold'):work(-.31,-.12,.025,'hold',true);
   case 20:return right?work(.17,-.08,.07,'cup'):work(-.26,-.10,.07,'cup');
   case 21:return right?{target:bodyAt([.36,.67,.12]),grip:'open',active:false,space:'body'}:{target:painted(w,.40,.10,.015),grip:'hold',active:true,space:'work'};
   case 23:return right?work(.13,.06,.09,'open'):work(-.32,-.15,.025,'brace',true);
   case 24:return right?work(-.30,-.36,.15,'open',false,'agency'):{target:bodyAt([-.10,.31,.27]),grip:'relaxed',active:false,space:'body'};
   case 25:return right?work(.55,-.06,-.04,'open',false,'welcome'):{target:bodyAt([-.47,.30,.26]),grip:'open',active:false,space:'body'};
   case 28:return right?work(.09,-.30,.23,'open',false,'offer'):{target:bodyAt([-.16,.20,.34]),grip:'open',active:false,space:'body'};
   case 26:return right?work(.56,-.14,.02,'open',false,'invitation'):{target:bodyAt([-.32,.12,.10]),grip:'open',active:false,space:'body'};
   case 27:return right?{target:bodyAt([.20,.61,.26]),grip:'hold',active:false,space:'body'}:work(-.33,-.14,.025,'hold',true);
   case 29:return {target:bodyAt(right?[.06,.10,.28]:[-.08,.12,.30]),grip:'relaxed',active:false,space:'body'};
   case 30:return right?{target:bodyAt([.37,.94,.25]),grip:'open',active:false,space:'offer'}:{target:bodyAt([-.38,.26,.22]),grip:'open',active:false,space:'body'};
  }return rest();
 }
 function actionSpec(i,side,a,w,body){const spec=handSpec(i,side,w,body),right=side===1;let target=[...spec.target],active=spec.active,grip=spec.grip,space=spec.space;
  if(i===2&&right){const stroke=smooth(a<.62?a/.62:(a-.62)/.38),lift=smooth((a-.57)/.035)*(1-smooth((a-.635)/.035));target=a<.62?at(w,mix(-.19,.13,stroke),.03+.09*Math.sin(PI*stroke),.014):at(w,.13,mix(.03,-.08,stroke),.014);target=add(target,mul(w.normal,.045*lift));active=lift<.001;grip='write';}
  if([3,4,10].includes(i)){const n=right?3:2,cycle=smooth(a),phase=cycle*n+(right?0:.35),pulse=Math.sin(PI*(phase%1))**4;target=at(w.keyboard,(right?.13:-.19)+.025*Math.sin(cycle*PI*2),.01+(right?-.01:.015),.020*(1-pulse));active=pulse>.96;grip='type';space='keyboard';spec.press=pulse;}
  if(i===5&&right){const t=smooth(a);target=painted(w,mix(.48,.91,t),mix(.18,.65,t),.012+.10*Math.sin(PI*t));active=a>.86;grip='hold';}
  if([6,11,21].includes(i)&&right){target=at(w,mix(-.12,.11,smooth(a)),.11+.035*Math.sin(a*PI),.035);active=a>.1&&a<.85;grip='point';}
  if(i===8||i===22){
   // Set one end of the strand before drawing the other taut. For the
   // tangle, reverse which side takes the load and trace the short branch.
   const anchorsFirst=i===8?!right:right;
   const travel=anchorsFirst?ramp(a,0,.54):ramp(a,.16,.92);
   const x=i===8?(right?1.31:.49):(right?1.0:.46);
   const y=i===8?.15:(right?.30:.13);
   target=painted(w,mix(right?.85:.69,x,travel),mix(.36,y,travel),.012+.08*Math.sin(PI*travel));
   active=travel===1;
  }
  if(i===9){
   // Weight is still between the palms at the start. Seat the object, then
   // open the far fingers before the presenting hand clears the silhouette.
   const release=ramp(a,right?.32:.16,right?.90:.70);
   target=add(target,[side*.14*(release-1),.11*(1-release),.08*(1-release)]);
  }
  if(i===13){
   const shelter=ramp(a,right?.14:0,right?.83:.60);
   target=add(target,[side*.07*(1-shelter),(right?.13:-.025)*(1-shelter),.04*(1-shelter)]);
  }
  if(i===14&&right){const reach=smooth(a/.56),recoil=smooth((a-.58)/.42);target=lerp(add(body.hip,[.20,.32,.34]),at(w,.14,.02,.04),reach);target=lerp(target,add(body.hip,[.18,.38,.35]),recoil*.45);active=false;grip='cup';}
  if(i===16&&!right){target=painted(w,.38,.26,.015);active=true;grip='brace';}
  if(i===16&&right){target=at(w,mix(-.13,.10,smooth(a)),mix(-.11,.04,smooth(a)),.012+.10*Math.sin(PI*smooth(a/.86)));active=a>.86;grip='hold';}
  if(i===19&&right){target=at(w,mix(.21,-.02,smooth(a)),.15+.08*Math.sin(PI*a),.012+.10*Math.sin(PI*smooth(a/.80)));active=a>.8;grip='hold';}
  if(i===20){const t=smooth(a);target=painted(w,right?mix(1.30,1.17,t):mix(.42,.63,t),.36,.015);active=a>.85;grip='cup';}
  if(i===23&&right){target=at(w,mix(-.13,.16,smooth(a)),.06,.025);active=true;grip='open';}
  if(i===24&&right){target=lerp(at(w,.13,.06,.09),spec.target,smooth(a));target[1]+=.025*Math.sin(PI*a);active=false;grip='open';}
  if(i===27&&right){target=at(w,mix(.18,.06,smooth(a)),.12,.012+.18*smooth((a-.16)/.84));active=a<.16;grip='hold';}
  if([25,26,28].includes(i)&&right){const from=i===25?at(w,.57,-.10,.06):i===26?at(w,.58,-.15,.03):at(w,.10,-.28,.10);target=lerp(from,spec.target,smooth(a));const arc=Math.sin(PI*smooth(a));target[1]+=(i===26?.11:i===28?.065:.08)*arc;target[0]+=(i===26?-.105:.05)*arc;target[2]+=.06*arc;}
  if(i===30&&right){target=add(target,[.015*Math.sin(PI*a),.035*Math.sin(PI*a),.025*Math.sin(PI*a)]);}
  return {...spec,target,active,grip,space};
 }
 function wristFor(spec,w,side){let forward,normal=[0,1,0],offset=[0,0,.105];
  if(spec.grip==='write'){forward=add(add(mul(w.normal,-1),mul(w.v,.20)),mul(w.u,.12));normal=w.v;offset=[.015,-.025,.15];}
  else if(spec.grip==='type'){forward=mul(w.keyboard.v,-1);normal=w.keyboard.normal;}
  else if(spec.grip==='point'){forward=w.normal;normal=w.v;}
  else if(['brace','hold'].includes(spec.grip)){normal=spec.space==='support'?[0,1,0]:spec.back?mul(w.normal,-1):w.normal;forward=spec.space==='support'?[side*.12,0,.99]:mul(w.v,w.kind==='paper'?-1:1);}
  else if(spec.grip==='reflect'){forward=[-.06,.40,-.92];normal=[0,1,0];offset=[0,0,.09];}
  else if(spec.grip==='relaxed'){forward=[side*.12,-.85,.50];normal=[0,.50,.85];offset=[0,0,.10];}
  else {forward=spec.space==='invitation'?[.85,-.04,.53]:spec.space==='welcome'?[.36,-.30,.88]:spec.space==='offer'?[.04,-.04,1]:[side*.20,-.10,.97];normal=spec.space==='welcome'||spec.space==='invitation'?[0,-1,-.35]:[0,-1,0];offset=[0,0,.105];}
  const shape=spec.grip==='type'&&Number.isFinite(spec.press)?handShapes.press(spec.press,side):handShapes.pose(spec.grip,side);offset=shape.contactOffset;
  const curl={write:.68,type:.32,hold:.62,brace:.34,point:.20,relaxed:.40,open:.12,cup:.47,reflect:.45}[spec.grip]??.4,f=palm(forward,normal);if(spec.roll){const c=Math.cos(spec.roll),s=Math.sin(spec.roll);return {frame:{x:add(mul(f.x,c),mul(f.y,s)),y:add(mul(f.y,c),mul(f.x,-s)),z:f.z},offset,curl,shape};}return {frame:f,offset,curl,shape};
 }
 function phaseAt(to,u){const t=timing[to],bridge=to===7?.36:to===13?.32:0,scale=1-bridge,attentionEnd=to===3?.10:bridge+t[0]*scale,start=to===3?.50:attentionEnd+t[1]*scale,end=to===3?.82:start+t[2]*scale,settle=to===3?.92:end+t[3]*scale;return {bridge,attentionEnd,stage:u<bridge?'bridge':u<attentionEnd?'attention':u<start?'preparation':u<end?'action':u<settle?'response':'hold',actionStart:start,actionEnd:end,settle,action:clamp((u-start)/(end-start))};}
 function accentAt(timeline){
  timeline=clamp(Number.isFinite(timeline)?timeline:0,0,30);const to=Math.ceil(timeline),u=to?timeline-(to-1):1,p=phaseAt(to,u),envelope=Math.sin(PI*clamp((u-.10)/.84))**2;
  const charge=Math.sin(PI*clamp((u-p.actionStart+.09)/Math.max(.18,p.actionEnd-p.actionStart+.09)))**2;
  return {beat:to,progress:u,envelope,charge:to>0?charge:0};
 }
 function handAccent(wf,spec,side,to,u,weight){
  // Keep the pen handoff, exact typing and load-bearing support untouched.
  if(to<5||to===10||(side===-1&&[7,13,16,17,23].includes(to))||['support','head-support','stylus-dock','keyboard'].includes(spec.space)||wf.customOffset)return {wf,target:spec.target,amount:0};
  const pulse=Math.sin(PI*clamp((u-(side===1?.12:.20))/(side===1?.78:.72)))**2;
  if(pulse<1e-10)return {wf,target:spec.target,amount:0};
  const flex=wf.shape.parameters.flex.slice(1).flat(),closure=smooth((flex.reduce((n,v)=>n+v,0)/flex.length-.12)/.23),doubt=to===15,amount=pulse*(doubt?.4:1);
  const shape=handShapes.articulate(wf.shape,{curl:mix(-.075,.23,closure)*amount,spread:mix(.16,-.07,closure)*amount,phase:u+(side===1?0:.13)});
  let f=wf.frame,target=spec.target;
  // Only gestures that never acquire a contact receive a free wrist arc.
  // Binary contact weights must not turn a rotation on/off at acquisition.
  const free=[9,12,13,14,17,24,25,26,28,29,30].includes(to)&&['body','agency','welcome','offer','invitation'].includes(spec.space);
  if(free){
   const roll=amount*side*mix(.28,.22,closure),yaw=amount*side*mix(.24,.14,closure),pitch=amount*mix(.12,-.16,closure),rotation=frame(yaw,pitch,roll);
   f={x:apply(wf.frame,rotation.x),y:apply(wf.frame,rotation.y),z:apply(wf.frame,rotation.z)};
   const lift=to===13?.028:to===17?.035:mix(.055,.042,closure),across=side*amount*mix(.035,-.022,closure);
   target=add(target,[across,lift*amount,.026*amount*Math.sin(PI*u)]);
  }
  return {wf:{...wf,frame:f,shape,offset:shape.contactOffset,curl:wf.curl+mix(-.04,.14,closure)*amount},target,amount};
 }
 // A reaction starts on perception, loads the support, then resolves after contact.
 // Keep these offsets in joint space, upstream of the IK solve. All keys are
 // sampled directly in either direction, including the hold leading into a cut.
 const ramp=(u,start,end)=>smooth((u-start)/(end-start));
 // Timings are fractions of the incoming shot. Lean, turn, bank and gaze are
 // degrees. The asymmetry belongs to the action: tucked ribs on a lift, a
 // counterturn against tension, or a retreat to clear the visitor's view.
 const accents={
  //                  see,   load, work, free, lean, turn, bank, gaze
  1:  [ .025,.19,.42,.74,   -6, -10,  3,  16], // find the blank site
  3:  [ .03, .13,.28,.39,    5,  10, -4,  10], // follow the pen to its rest
  4:  [ .045,.19,.40,.63,    6, -13, -2, -15], // locate one component
  5:  [ .04, .23,.49,.79,   10,   7,  6,  17], // seat the far corner first
  6:  [ .02, .20,.44,.72,    8, -12, -4, -12], // peer along the seam
  7:  [ .37, .54,.72,.94,    7,   9,  4,  11], // take the brief after rising
  8:  [ .025,.17,.48,.78,   -6,  12, -5,  17], // keep the bridge under tension
  9:  [ .065,.26,.53,.79,    9, -14,  5, -17], // deliver and release
  10: [ .02, .16,.37,.71,   -5,  10, -3,  19], // notice the inference
  11: [ .035,.22,.53,.83,    8,   9,  6, -16], // read the fine edge
  12: [ .06, .28,.57,.85,   -7, -12, -4,  18], // signal approval, step clear
  13: [ .32, .43,.69,.91,   10,  -9,  6, -11], // shelter the ember
  14: [ .05, .21,.44,.69,   13,  -9, -6,  19], // reach against a resisting surface
  16: [ .035,.19,.45,.71,    7,  12, -5, -12], // brace the near side before pressing
  17: [ .11, .23,.51,.80,   -5,   8,  4,  14], // push through the support
  18: [ .075,.28,.59,.85,    9,  12, -4,  13], // turn the lesson towards the light
  19: [ .02, .16,.38,.80,    7,  13, -6,  16], // carry the folio across the midline
  20: [ .04, .24,.50,.79,   11,  -6,  3, -14], // collect with both hands
  21: [ .025,.19,.45,.73,   -8,  -9, -6, -15], // follow the edge of the moat
  22: [ .03, .18,.55,.82,    7,  12,  6, -17], // separate the two branches
  23: [ .07, .24,.46,.78,    8,  11, -2,  11], // sweep the interface clear
  24: [ .08, .27,.54,.82,   -8, -13, -5,  17], // leave the choice to the reader
  25: [ .02, .14,.39,.71,   -6,   9, -7,  12], // turn the open side out
  26: [ .035,.16,.44,.76,   -9, -14,  5, -15], // clear the entrance
  27: [ .05, .19,.48,.82,    7,  -8,  5,  15], // tip a layer into view
  28: [ .06, .21,.47,.80,    9,   7, -4,  11], // offer, then transfer the weight
  29: [ .11, .34,.61,.93,   -6, -10,  4, -15], // let the hands settle
  30: [ .04, .22,.52,.89,   -9,  12, -5,  20]  // look to the visitor before inviting
 };
 const radians=PI/180;
 function bodyActing(beat,u){
  let lean=0,turn=0,nod=0,look=0,roll=0,shift=0;
  if(beat===2){
   // Paper is supported throughout. The pen comes off the second mark before
   // the ribs draw back; the head stays aimed at the drawing a little longer.
   const focus=ramp(u,.07,.21)*(1-ramp(u,.59,.75)),review=ramp(u,.68,.92);
   lean=.085*focus-.25*review;turn=.17*focus+.18*review;
   nod=.08*focus-.20*ramp(u,.77,.97);look=.19*ramp(u,.025,.13)*(1-ramp(u,.69,.93));
   roll=-.07*focus+.065*review;shift=.017*focus-.024*review;
  }else if(beat===15){
   // Head checks the damaged edge, aborts the first approach, then settles
   // into the palm while the other hand bears the surviving corner.
   const check=ramp(u,.015,.10)*(1-ramp(u,.15,.30)),sink=ramp(u,.45,.69);
   look=-.26*check+.10*sink;nod=.13*check+.10*sink;
   lean=-.29*ramp(u,.10,.25)*(1-ramp(u,.43,.65))+.09*sink;
   turn=.10*check-.09*sink;roll=-.13*sink;shift=-.018*sink;
  }else if(accents[beat]){
   const [see,load,work,free,bend,twist,bank,aim]=accents[beat];
   const gaze=ramp(u,see,load)*(1-ramp(u,work,free));
   const transfer=ramp(u,see,load)*(1-ramp(u,load,work));
   const exert=ramp(u,load,work)*(1-ramp(u,work,free));
   // Eyes arrive first. Transfer against the direction of the shoulder,
   // reverse into the effort, and allow the pelvis to settle last.
   look=aim*radians*gaze;nod=bend*radians*(.42*gaze+.30*exert);
   lean=bend*radians*(exert-.27*transfer);turn=twist*radians*(exert-.34*transfer);
   roll=bank*radians*exert;
   shift=.0022*bank*(transfer-.8*exert);
  }
  return {lean,turn,nod,look,roll,shift};
 }
 function evaluate(timeline,lightOnly=false,idleSeconds=0){
  timeline=clamp(Number.isFinite(timeline)?timeline:0,0,30);const to=Math.ceil(timeline),from=Math.max(0,to-1),u=to===0?1:timeline-from,phase=phaseAt(to,u),a=direction[from],b=direction[to],isRise=to===7||to===17,isSit=to===13;
  const stanceProgress=isRise?smooth((u-(to===17?.40:.17))/(to===17?.32:.17)):isSit?smooth((u-.02)/.22):smooth((u-.10)/.72),seat= mix(seated(from)?1:0,seated(to)?1:0,stanceProgress),stand=1-seat;
  const prepPulse=Math.sin(PI*clamp((u-(to===17?.12:0))/(to===17?.74:to===7?.40:to===13?.32:.80)))**2,bodyT=to===15?smooth((u-.025)/.20):to===2?smooth((u-.02)/.42):smooth((u-.08)/.62),headT=smooth((u-.015)/.44),stepSway=isRise?.025*(Math.sin(PI*clamp((u-(to===17?.10:0))/(to===17?.16:.09)))-Math.sin(PI*clamp((u-(to===17?.23:.07))/(to===17?.16:.10)))):0,baseShift=mix(a[3],b[3],bodyT)+stepSway;
  let yaw=mix(a[0],b[0],bodyT),lean=mix(a[1],b[1],bodyT)+(isRise?.42*prepPulse:isSit?.14*prepPulse:to===14?.07*smooth((u-.12)/.30)*(1-smooth((u-.60)/.25)):to===16?.045*prepPulse:0),headPitch=mix(a[2],b[2],headT),headYaw=mix(({25:-.04,26:.02,28:-.02,29:.02,30:.02})[from]??a[0]+.24,({25:-.04,26:.02,28:-.02,29:.02,30:.02})[to]??b[0]+.24,headT);headPitch+=.10*mix(seated(from)?1:0,seated(to)?1:0,headT);
  if(to===3){const dockingAttention=Math.sin(PI*clamp((u-.02)/.40))**2;headPitch+=.10*dockingAttention;headYaw-=.14*dockingAttention;}
  if(to===15){headPitch-=.10*smooth((u-.82)/.14);headYaw+=.12*smooth((u-.82)/.14);}if(from===15){headPitch-=.10*(1-headT);headYaw+=.12*(1-headT);}
  const authored=sampleClip(to===2?'draw':to===16?'repair':to===17?'rise':'',u);if(authored){lean+=authored.lean||0;yaw+=authored.yaw||0;headPitch+=authored.headPitch||0;headYaw+=authored.headYaw||0;}
  const acting=bodyActing(to,u),previousActing=bodyActing(from,1),release=1-ramp(u,.02,.31);
  const shift=baseShift+acting.shift+previousActing.shift*release;
  lean+=acting.lean+previousActing.lean*release;
  yaw+=acting.turn+previousActing.turn*release;
  headYaw+=acting.look+previousActing.look*release;
  headPitch+=acting.nod+previousActing.nod*release;
  // A single observed pause plays on the visible-time clock. Both ends
  // return exactly to the scroll pose. Never move the pelvis, feet, paper
  // plane or IK targets for a breath. The gaze settles after the chest.
  const breath=ramp(idleSeconds,0,.86)*(1-ramp(idleSeconds,.92,2.32));
  const glance=ramp(idleSeconds,.16,1.02)*(1-ramp(idleSeconds,1.18,2.4));
  const attention=beat=>accents[beat]?.[7]??(beat===15?-15:14);
  const sceneDirection=mix(attention(from),attention(to),headT);
  const collapsed=mix(Number(from>=13&&from<=16),Number(to>=13&&to<=16),bodyT);
  const pelvisLean=lean;
  lean+=mix(.015,.026,collapsed)*breath;
  headPitch+=mix(-.032,.046,collapsed)*glance;
  headYaw+=sceneDirection*radians*.23*glance;
  const shoulderRoll=acting.roll+previousActing.roll*release+.012*breath;
  const hip=[-.48+shift,-.22-.39*seat-.02*stand+mix(level[from],level[to],stanceProgress),.20-.32*seat+(isRise?.24*seat*smooth((u-(to===17?.20:.08))/(to===17?.20:.09)):isSit?.12*prepPulse:0)],pelvisFrame=frame(yaw*.35,-pelvisLean*.15,-shift*.38),chestFrame=frame(yaw,lean,-shift*.22+shoulderRoll),lumbar=add(hip,mul(frame(yaw*.6,lean*.45,-shift*.25).y,.26)),ribcage=add(lumbar,mul(frame(yaw*.85,lean*.8,-shift*.23+shoulderRoll*.6).y,.28)),shoulder=add(ribcage,mul(chestFrame.y,.18)),neck=add(shoulder,mul(chestFrame.y,.105)),headFrame=frame(headYaw,headPitch,-shift*.15),head=add(neck,mul(headFrame.y,.255));
  const shoulderL=add(shoulder,mul(chestFrame.x,-lengths.shoulderSpan/2)),shoulderR=add(shoulder,mul(chestFrame.x,lengths.shoulderSpan/2)),hipL=add(add(hip,mul(pelvisFrame.x,-lengths.hipSpan/2)),mul(pelvisFrame.y,-.055)),hipR=add(add(hip,mul(pelvisFrame.x,lengths.hipSpan/2)),mul(pelvisFrame.y,-.055));
  const body={hip,head,headFrame},previousBase=workFrame(kinds[from],stand,from),currentBase=workFrame(kinds[to],stand,to),previousWork=from===15?inspectWork(previousBase,1):previousBase,currentWork=to===15?inspectWork(currentBase,1):currentBase,baseWork=blendWork(previousBase,currentBase,to===3?smooth((u-.36)/.14):smooth((u-.16)/.20)),work=inspectWork(baseWork,to===15?smooth(phase.action):from===15?1-smooth((u-.16)/.20):0);
  const hands=[],wrists=[],contacts=[],reach=[],handAmounts=[];
  for(const side of lightOnly?[1]:[-1,1]){
   const start=handSpec(from,side,previousWork,body),finish=handSpec(to,side,currentWork,body),actionStart=actionSpec(to,side,0,work,body),actionEnd=actionSpec(to,side,1,work,body),startWrist=wristFor(start,previousWork,side),finishWrist=wristFor(finish,currentWork,side),actionStartWrist=wristFor(actionStart,work,side),actionEndWrist=wristFor(actionEnd,work,side);let spec,wf,weight=0,offsetFreedom=u<phase.actionStart?1-smooth((u-phase.actionStart+.10)/.10):u>phase.actionEnd?smooth((u-phase.actionEnd)/.10)*(finish.active?0:1):0;
   if(u<phase.actionStart){const t=to===16?smooth((u-(side===-1?.18:.27))/(side===-1?.12:.15)):smooth((u-phase.attentionEnd)/Math.max(.01,phase.actionStart-phase.attentionEnd));spec={...actionStart,target:lerp(start.target,actionStart.target,t),active:false};spec.target[1]+=.035*Math.sin(PI*t);if(side===1&&(to===25||to===26))spec.target[2]+=.08*Math.sin(PI*t);wf=blendWrist(startWrist,actionStartWrist,t);}
   else if(u<=phase.actionEnd){spec=actionSpec(to,side,phase.action,work,body);weight=spec.active?1:0;wf=spec.grip==='type'?wristFor(spec,work,side):blendWrist(actionStartWrist,actionEndWrist,smooth(phase.action));}
   else {const t=smooth((u-phase.actionEnd)/Math.max(.01,phase.settle-phase.actionEnd));spec={...finish,target:lerp(actionEnd.target,finish.target,t),active:finish.active&&t>.999};weight=spec.active?1:0;wf=blendWrist(actionEndWrist,finishWrist,t);}
   if(to===15&&side===1){
    // Leave a visible gap when the first reach stalls. Lower the elbow before
    // raising the palm; weight transfers only after the temple reaches it.
    const waiting=add(body.hip,[.30,.39,.29]),withdraw=ramp(u,.13,.34),touch=ramp(u,.41,.68);
    const target=lerp(lerp(start.target,waiting,withdraw),finish.target,touch);
    target[1]-=.07*Math.sin(PI*withdraw);target[2]+=.055*Math.sin(PI*touch);
    spec={...finish,target,active:touch===1};
    weight=spec.active?1:0;wf=blendWrist(startWrist,finishWrist,withdraw);
   }
   if(to===0){spec=finish;weight=spec.active?1:0;wf=finishWrist;}
   if(to===19&&u>phase.actionEnd){const t=smooth((u-phase.actionEnd-.05)/(phase.settle-phase.actionEnd-.05));spec={...finish,target:lerp(actionEnd.target,finish.target,t),active:actionEnd.active&&t<.001};weight=spec.active?1:0;wf=blendWrist(actionEndWrist,finishWrist,t);}
   if(to===16&&u>phase.actionEnd){const releaseStart=phase.actionEnd+(phase.settle-phase.actionEnd)*(side===1?.50:.60),releaseEnd=phase.settle-(side===1?.02:0),t=smooth((u-releaseStart)/(releaseEnd-releaseStart));spec={...finish,target:lerp(actionEnd.target,finish.target,t),grip:t<.5?actionEnd.grip:finish.grip,active:actionEnd.active&&t<.001};weight=spec.active?1:0;wf=blendWrist(actionEndWrist,finishWrist,t);offsetFreedom*=t;}

   // The same physical stylus is placed and released before keyboard ownership.
   if(to===3&&u<.50){
    const dock=toolDock(previousWork),dockWrist={frame:alignToolFrame([-.001,-.007,-.081],previousWork.v,previousWork.normal),offset:handShapes.pose('write',side).contactOffset,curl:.68,shape:handShapes.pose('write',side),customOffset:true};
    if(side===1){
     if(u<.28){const t=smooth((u-.10)/.18);spec={...start,target:lerp(start.target,dock.tip,t),active:false,space:'stylus-dock',effector:'stylus'};spec.target=add(spec.target,mul(previousWork.normal,.045*Math.sin(PI*t)));wf=blendWrist(startWrist,dockWrist,t);weight=0;}
     else if(u<.36){spec={...start,target:[...dock.tip],active:true,space:'stylus-dock',effector:'stylus'};wf={...dockWrist,curl:mix(.68,.16,smooth((u-.30)/.06)),shape:handShapes.sample('write','open',smooth((u-.30)/.06),side)};weight=1;}
     else {const t=smooth((u-.36)/.14),released={...dockWrist,curl:.16,shape:handShapes.pose('open',side)};spec={...actionStart,target:lerp(dock.tip,actionStart.target,t),active:false,effector:'fingertip'};spec.target=add(spec.target,mul(previousWork.normal,.035*Math.sin(PI*t)));wf=blendWrist(released,actionStartWrist,t);weight=0;}
    }else{const t=smooth((u-.36)/.14);spec={...actionStart,target:lerp(start.target,actionStart.target,t),active:u<.36,space:u<.36?'paper':'keyboard'};spec.target[1]+=.025*Math.sin(PI*t);wf=blendWrist(startWrist,actionStartWrist,t);weight=u<.36?1:0;}
   }
   // Rise support is released after the centre of mass has travelled above the feet.
   if((isRise||isSit)&&side===-1){const supportBlend=isRise?(to===17?smooth((u-.10)/.14)*(1-smooth((u-.60)/.15)):smooth((u-.01)/.10)*(1-smooth((u-.27)/.08))):smooth(u/.04)*(1-smooth((u-.23)/.08)),supportSpec={target:tableSupport,grip:'brace',space:'support'};spec={...spec,target:lerp(spec.target,tableSupport,supportBlend),grip:supportBlend>.5?'brace':spec.grip,space:supportBlend>.5?'support':spec.space};wf=blendWrist(wf,wristFor(supportSpec,work,side),supportBlend);weight=supportBlend>.999?1:0;offsetFreedom*=1-supportBlend;}
   if(authored&&weight===0&&offsetFreedom>0)spec.target=add(spec.target,mul(authored[side===-1?'handL':'handR']||[0,0,0],offsetFreedom));
   const accent=handAccent(wf,spec,side,to,u,weight);wf=accent.wf;spec={...spec,target:accent.target};handAmounts[side===-1?0:1]=accent.amount;
   const goal=sub(spec.target,apply(wf.frame,wf.offset)),origin=side===-1?shoulderL:shoulderR,poleWeight=side===1?(to===15?smooth((u-.18)/.40):from===15?1-smooth((u-.08)/.50):0):0,pole=add(origin,lerp([side*.45,-.48,-.22],[.52,-.50,.36],poleWeight)),solution=twoBone(origin,goal,lengths.upperArm,lengths.forearm,pole);
   const index=side===-1?0:1;hands[index]=solution;wrists[index]=wf.frame;if(!lightOnly){reach[index]={requested:goal,solved:solution.end,clamped:solution.clamped,error:solution.error};
   contacts[index]={target:spec.target,tip:add(solution.end,apply(wf.frame,wf.offset)),active:weight===1,weight,grip:spec.grip,gripOffset:wf.offset,fingerCurl:wf.curl,shape:wf.shape,space:spec.space,effector:spec.effector||(spec.grip==='write'?'stylus':'fingertip')};}
  }
  const light=add(hands[1].end,apply(wrists[1],[.015,-.052,.055]));if(lightOnly)return light;
  const footState=[0,1].map(side=>{const start=footMark(from,side),end=footMark(to,side);let progress=stanceProgress;if(isRise)progress=smooth((u-(to===17?(side?.25:.12):(side?.09:.02)))/(to===17?.12:.06));else if(isSit)progress=smooth((u-(side?.285:.25))/.035);else if(!seated(from)&&!seated(to))progress=smooth((u-(side?.35:.06))/.20);const stepping=len(sub(start,end))>.001,moving=stepping&&progress>0&&progress<1,target=lerp(start,end,progress);if(stepping)target[1]+=.045*Math.sin(PI*progress);return {target,weight:moving?0:1,frame:frame(side?.07:-.07,stepping?-.18*Math.sin(2*PI*progress):0,0)};});
  const legs=[twoBone(hipL,footState[0].target,lengths.thigh,lengths.shin,add(hipL,[-.03,-.2,1])),twoBone(hipR,footState[1].target,lengths.thigh,lengths.shin,add(hipR,[.03,-.2,1]))];
  const seatWeight=Math.max(0,seat*.65*(1-smooth((1-seat)/.18))),leftWeight=(1-seatWeight)*(footState[0].weight===0?0:footState[1].weight===0?1:clamp(.53-shift*1.2,.35,.7)),rightWeight=1-seatWeight-leftWeight;
  let tool;const penAxis=norm(apply(wrists[1],[-.001,-.007,-.081]));if(to<3){tool={held:1,alpha:1,tip:[...contacts[1].tip],shaftEnd:add(contacts[1].tip,mul(penAxis,.202)),dock:toolDock(work),stage:'held',owner:'right-hand',handoff:[.36,.50],release:[.30,.36]};}else if(to===3){const dock=toolDock(previousWork),placed=u>=.28,released=u>=.36,held=1-smooth((u-.30)/.06),axis=penAxis,tip=released?dock.tip:contacts[1].tip;tool={held,alpha:1-smooth((u-.52)/.14),tip:[...tip],shaftEnd:released?dock.shaftEnd:add(tip,mul(axis,.202)),dock,stage:released?(u>=.66?'hidden':'released'):placed?'placing':u>.10?'placing':'held',owner:released?'drafting-surface':'right-hand',handoff:[.36,.50],release:[.30,.36]};}else{const dock=toolDock(workFrame('paper',0));tool={held:0,alpha:0,tip:dock.tip,shaftEnd:dock.shaftEnd,dock,stage:'hidden',owner:'drafting-surface',handoff:[.36,.50],release:[.30,.36]};}
  let drawing=null;if(to===2||from===2){const progress=to===2?phase.action:1,points=[],strokes=[[],[]];for(let i=0;i<=96;i++){const a=i/96;if(a>progress)break;const p=actionSpec(2,1,a,work,body);if(p.active){points.push(p.target);strokes[a<.62?0:1].push(p.target);}}drawing={tip:contacts[1].tip,points,strokes,progress,active:to===2&&phase.stage==='action'&&contacts[1].active};}
  return {head,hip,shoulder,shoulderL,shoulderR,hipL,hipR,elbowL:hands[0].joint,elbowR:hands[1].joint,handL:hands[0].end,handR:hands[1].end,knees:legs.map(l=>l.joint),feet:legs.map(l=>l.end),tilt:headPitch,seated:seat>.5,seatAmount:seat,frames:{head:headFrame,chest:chestFrame,pelvis:pelvisFrame,wristL:wrists[0],wristR:wrists[1],footL:footState[0].frame,footR:footState[1].frame},spine:{pelvis:hip,lumbar,ribcage,chest:shoulder,neck},light,handMotion:{left:handAmounts[0],right:handAmounts[1],light:accentAt(timeline)},work,drawing,tool,contacts:{left:contacts[0],right:contacts[1]},support:{floorY,seatY,seatCenter:[...seatCenter],tableSupport:[...tableSupport],seatWeight,footL:footState[0],footR:footState[1]},weights:{left:leftWeight,right:rightWeight,seat:seatWeight},phase:{from,to,beat:to,progress:u,stage:phase.stage,action:phase.action,bridge:phase.bridge,attentionEnd:phase.attentionEnd,actionStart:phase.actionStart,actionEnd:phase.actionEnd,settle:phase.settle},lengths,reach:{left:reach[0],right:reach[1]},authoring:authored?'blender-curves':'authored-controls'};
 }
 // Trail sampling shares the same rig evaluation but omits unused body/prop output.
 function poseAt(timeline,idleSeconds=0){return evaluate(timeline,false,idleSeconds);}
 function lightAt(timeline,idleSeconds=0){return evaluate(timeline,true,idleSeconds);}
 function pose(value){if(typeof value==='number')return poseAt(value);const aliases={build:5,review:11,experience:24};const i=aliases[value]??names.indexOf(value);return poseAt(i<0?0:i);}
 // Additive finale gestures reuse the original fixed-length rig and C glove.
 function finalePose(base,options={}){
  const controls=options.hands||{},torso=options.torso||{},bodyAmount=Math.abs(torso.yaw||0)+Math.abs(torso.pitch||0)+Math.abs(torso.roll||0);
  if(!options.open&&!options.weight&&!options.headWeight&&!bodyAmount&&!Object.values(controls).some(c=>c?.weight||c?.prelude?.weight))return base;
  const p={...base,frames:{...base.frames},contacts:{...base.contacts},reach:{...base.reach},spine:{...base.spine}};
  // Rotate only the supported upper body; feet, knees and pelvis keep their marks.
  if(bodyAmount){const turn=frame(torso.yaw||0,torso.pitch||0,torso.roll||0),at=q=>add(base.hip,apply(turn,sub(q,base.hip)));
   for(const key of ['head','shoulder','shoulderL','shoulderR'])p[key]=at(base[key]);
   for(const key of ['lumbar','ribcage','chest','neck'])p.spine[key]=at(base.spine[key]);
   for(const key of ['head','chest'])p.frames[key]={x:apply(turn,base.frames[key].x),y:apply(turn,base.frames[key].y),z:apply(turn,base.frames[key].z)};
  }
  const weight=clamp(options.weight||0),side=options.side===-1?-1:1,target=options.target;
  for(const handSide of [-1,1]){
   const suffix=handSide<0?'L':'R',key=handSide<0?'left':'right',shoulder=p['shoulder'+suffix],original=p['hand'+suffix];
   let goal=original,wrist=p.frames['wrist'+suffix],shape=p.contacts[key].shape,grip=p.contacts[key].grip;
   if(options.open){const amount=clamp(options.open),requested=add(shoulder,[handSide*.43,-.16,.30]);goal=lerp(original,requested,amount);shape=handShapes.blend(shape,handShapes.pose('open',handSide),amount);}
   if(target&&handSide===side&&weight){const direction=norm(sub(target,shoulder)),requested=add(shoulder,mul(direction,.58));goal=lerp(goal,requested,weight);const aiming=norm(sub(target,goal));wrist=blendFrame(wrist,palm(aiming,[0,1,0]),weight);shape=handShapes.blend(shape,handShapes.pose('point',handSide),weight);grip='point';}
   function control(c){if(!c)return;if(c.prelude)control(c.prelude);const amount=clamp(c.weight||0);if(!amount)return;
    const requested=c.point&&c.aim?add(shoulder,mul(norm(sub(c.aim,shoulder)),clamp(c.reach||.61,.38,.68))):c.goal||goal;
    goal=add(lerp(goal,requested,amount),mul(c.arc||[handSide*.025,.018,.17],Math.sin(PI*amount)));if(c.axis||c.aim)wrist=blendFrame(wrist,palm(c.axis||norm(sub(c.aim,goal)),c.normal||[0,1,0]),amount);
    shape=handShapes.blend(shape,handShapes.pose(c.shape||'open',handSide),amount);if(amount>.5)grip=c.shape||'open';
   }
   control(controls[key]);
   // Transport the resting bend plane with the arm swing. A linearly blended
   // pole can pass through the wrist axis and flip the elbow by 180 degrees.
   let pole=[handSide*.48,-.42,.12];if(options.acting){const from=norm(sub(base['hand'+suffix],base['shoulder'+suffix])),to=norm(sub(goal,shoulder)),v=cross(from,to),cos=dot(from,to),rest=sub(base['elbow'+suffix],base['shoulder'+suffix]),bend=norm(sub(rest,mul(from,dot(rest,from))));pole=cos>-.98?add(add(bend,cross(v,bend)),mul(cross(v,cross(v,bend)),1/(1+cos))):[handSide,-.1,.2];}
   const solution=twoBone(shoulder,goal,lengths.upperArm,lengths.forearm,add(shoulder,pole));
   p['elbow'+suffix]=solution.joint;p['hand'+suffix]=solution.end;p.frames['wrist'+suffix]=wrist;
   p.contacts[key]={...p.contacts[key],shape,grip,active:false,weight:0,tip:add(solution.end,apply(wrist,shape.contactOffset))};
   p.reach[key]={requested:goal,solved:solution.end,clamped:solution.clamped,error:solution.error};
  }
  const look=options.headTarget||target;if(look){const delta=sub(look,p.head),yaw=clamp(Math.atan2(delta[0],delta[2]),-.76,.76),pitch=clamp(-Math.atan2(delta[1],Math.hypot(delta[0],delta[2])),-.28,.37);p.frames.head=blendFrame(p.frames.head,frame(yaw,pitch,options.headRoll||0),clamp(options.headWeight||weight));}
  p.light=p.contacts[options.lead||(side<0?'left':'right')].tip;return p;
 }
 function restPose(){return poseAt(29);}
 const api={poseAt,lightAt,accentAt,pose,restPose,finalePose,setClips,lengths,names};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileMotion=api;
})(typeof globalThis!=='undefined'?globalThis:this);
