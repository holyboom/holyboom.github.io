/* One continuous finale. Scroll owns formation; visible time owns the settled orbit. */
(function(root){'use strict';
 const thoughtModule=typeof module==='object'&&module.exports?require('./thought-light.js'):root.ProfileThoughtLight;
 const actingModule=typeof module==='object'&&module.exports?require('./finale-acting.js'):root.ProfileFinaleActing;
 const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10);};
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,n)=>a.map(v=>v*n),lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t)),norm=a=>mul(a,1/(Math.hypot(...a)||1));
 const SOURCE=8.73,CENTER=[-.44,.12,.13],colors={reason:'#c398ff',build:'#78dafa',verify:'#98ebc4'},groups={reason:{period:30,cycle:8.2,amount:.48,tilt:.08,phase:0},build:{period:25,cycle:9.4,amount:.52,tilt:-.77,phase:1.3},verify:{period:36,cycle:7.6,amount:.45,tilt:.76,phase:2.4}};
 const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
 const bezier=(a,b,c,d,t)=>a.map((v,i)=>(1-t)**3*v+3*(1-t)**2*t*b[i]+3*(1-t)*t*t*c[i]+t**3*d[i]);
 function phase(category,time){const g=groups[category],v=TAU/g.cycle;return (category==='verify'?-1:1)*TAU/g.period*(time+g.amount/v*(Math.sin(v*time+g.phase)-Math.sin(g.phase)));}
 function catalogue(data){const counts={reason:0,build:0,verify:0};for(const s of data)counts[s.category]++;const index={reason:0,build:0,verify:0};return data.map(s=>({...s,slot:index[s.category]++,count:counts[s.category]}));}
 function orbit(skill,angle){const g=groups[skill.category],a=TAU*skill.slot/skill.count+g.phase+angle,r=skill.category==='reason'?1.57:skill.category==='build'?1.77:1.43,x=Math.cos(a)*r,y=Math.sin(a)*r*.79,z=Math.sin(a)*.65;return add(CENTER,[x,y*Math.cos(g.tilt)-z*Math.sin(g.tilt),y*Math.sin(g.tilt)+z*Math.cos(g.tilt)]);}
 function clock(){let time=0,held=0,glowTime=0,thoughtTime=0,wasSettled=false;return {step(p,dt,visible){const settled=p>=1,delta=clamp(dt,0,.064);if(!settled&&wasSettled)held=time;if(visible){if(settled)time+=delta;if(p>.38&&p<.85)glowTime+=delta;if(settled||(p>.38&&p<.85))thoughtTime+=delta;}wasSettled=settled;return {time,held:p>=1?time:held,glowTime,thoughtTime};},snapshot:()=>({time,held,glowTime,thoughtTime}),capture:()=>{held=time;return held;}};}
 function skillFrames(skills,p,time,held,head){const transition=smooth((p-.94)/.06);return skills.map((s,i)=>{
   const stable=orbit(s,0),angle=p>=1?phase(s.category,time):Math.atan2(Math.sin(phase(s.category,held)),Math.cos(phase(s.category,held)))*transition,end=orbit(s,angle),delay=(i%5)*.008,flight=smooth((p-.68-delay)/(.26-delay));
   const side=s.category==='reason'?-1:s.category==='build'?1:((i%2)*2-1),c1=add(head,[side*.34,.40,(-.1+(i%3)*.12)]),c2=add(stable,[side*.26,.18,-.12]);
   const point=p<.94?bezier(head,c1,c2,stable,flight):end;return {...s,point,alpha:smooth((p-.69-delay)/.12),flight,color:colors[s.category]};
  });}
 function gesture(skills,time){const duration=6.5,cycle=Math.floor(time/duration),u=time-cycle*duration,start=cycle*duration;
  const eligible=skills.map((s,i)=>{const points=[1.7,2.6,3.9,4.4].map(t=>orbit(s,phase(s.category,start+t)));const safe=points.every(q=>q[2]>.20&&Math.abs(q[0]-CENTER[0])>.47&&q[1]>-.35&&q[1]<.85);return {s,i,safe,score:Math.abs(points[1][1]-.38)+((i+cycle*7)%skills.length)*.006};}).filter(v=>v.safe).sort((a,b)=>a.score-b.score);
  if(!eligible.length)return {targetId:null,weight:0,headWeight:0,stage:'rest'};
  const chosen=eligible[cycle%Math.min(3,eligible.length)].s,weight=smooth((u-.65)/1.05)*(1-smooth((u-3.75)/.85)),headWeight=smooth((u-.1)/.55)*(1-smooth((u-4.1)/1.0));return {targetId:chosen.id,weight,headWeight,stage:u<.65?'notice':u<1.7?'prepare':u<3.75?'indicate':u<4.6?'release':'rest'};
 }
 // The three fragments of work shown in the overture retain their actual
 // materials: cyanotype ink, a cream notebook with a dark binding, and the
 // ten-tooth brass pinion coupled to the eighteen-tooth steel wheel.
 function memoryDrawings(){
  const drawings=[];
  let paths;
  const stroke=(points,color,fill=null,width=1.2,rotor=null)=>paths.push({points,color,fill,width,rotor});
  const loop=(x,y,r,n=40)=>Array.from({length:n+1},(_,i)=>[x+r*Math.cos(i*TAU/n),y+r*Math.sin(i*TAU/n)]);
  paths=[];drawings.push({id:'blueprint',center:[-1.29,.30,.12],desktopCenter:[-.99,.07,.22],wake:.148,peel:.244,arrive:.383,paths});
  stroke([[-.62,-.37],[.55,-.31],[.61,.25],[.47,.39],[-.56,.34],[-.62,-.37]],'#8bbdd8','#254664');
  stroke([[.47,.39],[.45,.22],[.61,.25]],'#bcdeea','#537e98');
  stroke([[-.45,-.21],[-.41,.20],[.27,.24],[.26,-.17],[.05,-.19]],'#f4f1d8',null,1.7);
  stroke([[.26,.02],[-.12,0],[-.14,-.20],[-.45,-.21]],'#e1e7d6');
  stroke([[-.11,.01],[-.10,.22]],'#e1e7d6');
  stroke([[-.03,-.19],[-.02,-.10],[.03,-.11],[.07,-.15],[.08,-.19]],'#b0dfdd',null,.85);
  stroke([[-.45,-.27],[.30,-.23]],'#95c4d6',null,.75);
  paths=[];drawings.push({id:'notebook',center:[.71,-.09,.12],wake:.300,peel:.375,arrive:.515,paths});
  stroke([[-.69,-.16],[-.60,.31],[-.12,.26],[.04,.14],[.54,.29],[.73,-.17],[.14,-.33],[0,-.38],[-.69,-.16]],'#ab7d63','#764e45',1.5);
  stroke([[-.62,-.10],[-.55,.35],[-.21,.30],[.02,.18],[.01,-.28],[-.20,-.20],[-.62,-.10]],'#e2d9c1','#e6dac0',.9);
  stroke([[.02,.18],[.19,.32],[.51,.37],[.67,-.10],[.28,-.18],[.01,-.28],[.02,.18]],'#eadeca','#f3e9d4',.9);
  stroke([[-.02,-.30],[.02,.18]],'#805f52',null,1.5);
  for(let row=0;row<3;row++){
   const y=.16-row*.092;
   stroke([[-.48,y+.036],[-.29,y+.012],[-.13,y-.040]],'#9d8679',null,.85);
   stroke([[.14,y-.025],[.28,y+.05],[.47,y+.077]],'#b49a86',null,.85);
  }
  paths=[];drawings.push({id:'cogwheels',center:[.85,.52,.04],wake:.428,peel:.502,arrive:.646,paths});
  function wheel(x,y,teeth,radius,spokes,face,edge,drive){
   const rotor={x,y,drive},perimeter=[];
   for(let j=0;j<teeth;j++)for(const [fraction,size] of [[0,.84],[.18,.84],[.29,1],[.62,1],[.73,.84]]){
    const a=(j+fraction+(drive>0?.50:0))*TAU/teeth;
    perimeter.push([x+Math.cos(a)*radius*size,y+Math.sin(a)*radius*size]);
   }
   stroke([...perimeter,perimeter[0]],edge,face,1.05,rotor);
   stroke(loop(x,y,radius*.63),edge,'#29333d',.90,rotor);
   for(let j=0;j<spokes;j++){
    const a=j/spokes*TAU,at=(r,d)=>[x+(Math.cos(a)*r-Math.sin(a)*d)*radius,y+(Math.sin(a)*r+Math.cos(a)*d)*radius];
    stroke([at(.10,-.07),at(.65,-.10),at(.65,.10),at(.10,.07),at(.10,-.07)],face,face,.5,rotor);
   }
   stroke(loop(x,y,radius*.22,24),edge,face,1.0,rotor);
   stroke(loop(x,y,radius*.095,20),'#d5c6a1','#26333a',.65,rotor);
  }
  wheel(.24,.10,18,.50,5,'#779cb2','#c0dce3',-10/18);
  wheel(-.42,-.14,10,.29,4,'#d39a61','#ffda95',1);
  return drawings;
 }
 const drawings=memoryDrawings();
 const drawingCenter=(drawing,compact)=>!compact&&drawing.desktopCenter?drawing.desktopCenter:drawing.center;
 function memoryLooks(p,compact){
  if(p<=.215||p>=drawings.at(-1).arrive)return null;
  // Leave the flying plane before glancing at the plan. The next work
  // takes over as its ink or paper appears. Ease back as the last gear lands.
  const looks=[];
  for(let i=0;i<drawings.length;i++){
   const work=drawings[i],next=drawings[i+1],wake=Math.max(.215,work.wake);
   const see=smooth((p-wake)/.073),leave=next?smooth((p-next.wake)/.073):smooth((p-work.peel)/(work.arrive-work.peel));
   const weight=.53*see*(1-leave);
   if(weight>0)looks.push({point:drawingCenter(work,compact),weight});
  }
  return looks;
 }
 function materialMemories(p,head,compact){
  const echoes=[],pulses=[];
  for(const d of drawings){
   const side=Math.sign(d.center[0]-head[0]),receive=(p-d.arrive)/.080;
   if(receive>0&&receive<1){
    const radius=.17+.32*smooth(receive);
    const points=Array.from({length:33},(_,i)=>{const a=(-.10+i/32*1.28)*Math.PI;return add(head,[side*Math.cos(a)*radius,Math.sin(a)*radius*.63-.035,-.08]);});
    pulses.push({points,kind:'arrival',color:'#ffe1ac',width:1.25,alpha:.50*Math.sin(Math.PI*receive)**2});
   }
   if(p<=d.wake||p>=d.arrive)continue;
   const wake=smooth((p-d.wake)/.045),peel=clamp((p-d.peel)/(d.arrive-d.peel));
   const center=drawingCenter(d,compact);
   const size=(compact?1.10:d.id==='blueprint'?.88:1)*(.90+.10*wake);
   const pointAt=(q,rotor,along)=>{
    let [x,y]=q;
    if(rotor){const angle=.40*rotor.drive*smooth((p-d.wake)/(d.peel-d.wake)),c=Math.cos(angle),s=Math.sin(angle),u=x-rotor.x,v=y-rotor.y;x=rotor.x+c*u-s*v;y=rotor.y+s*u+c*v;}
    const home=add(center,[x*size,y*size-.11*(1-wake),x*.08+y*.09]);
    // The nearer edge lifts first. Every bit of ink follows its own
    // continuous arc from its mark on the page all the way into the head.
    const delay=.36*clamp(.5+side*x*.75-y*.26)+.20*along,t=smooth((peel-delay)/(1-delay));
    if(!t)return home;
    return bezier(home,add(home,[-side*.37,.43+.10*y,.23]),add(head,[side*.66,.34+.14*y,.08]),head,t);
   };
   const paths=d.paths.map(path=>({...path,points:path.points.map((q,j)=>pointAt(q,path.rotor,j/(path.points.length-1)))}));
   const alpha=wake*(1-smooth((peel-.85)/.15)),fillAlpha=1-smooth(peel/.60);
   if(peel>.08){
    // Three threads carry the plan lines, the page ruling or the contour of
    // the teeth. Each keeps its original colour as the leading edge warms.
    const inks=d.paths.filter(line=>!line.fill).map(line=>line.color);
    for(let lane=0;lane<3;lane++){
     const delay=lane*.055,flight=smooth((peel-delay)/(1-delay));
     const from=pointAt([-.26*side,.05+lane*.045],null,1),tail=smooth((peel-.54-delay)/(.46-delay))*flight;
     const turn=add(from,[-side*.28,.32+lane*.12,.18]),bend=add(head,[side*(.54+lane*.07),.18+lane*.13,.08]);
     const points=Array.from({length:23},(_,i)=>bezier(from,turn,bend,head,mix(tail,flight,i/22)));
     paths.push({points,role:'memory-thread',color:lane===2?'#ffe8ba':inks[lane]||d.paths[0].color,width:lane===2?1.5:1,fill:null});
    }
   }
   echoes.push({id:d.id,peel,alpha,fillAlpha,paths});
  }
  // One broken wavefront follows the emerging skills. Its open arcs expand
  // from the temple behind the body and vanish before the catalogue settles.
  if(p>.69&&p<.895){
   const beat=(p-.69)/.205,r=.21+1.62*(1-(1-beat)**2);
   for(const [a,b] of [[.10,.34],[.56,.85],[1.10,1.37],[1.58,1.85]]){
    const points=Array.from({length:27},(_,i)=>{const angle=Math.PI*mix(a,b,i/26);return add(head,[Math.cos(angle)*r,Math.sin(angle)*r*.55-.15*beat,-.15-.10*beat]);});
    pulses.push({points,kind:'reveal',color:beat<.40?'#fff4d6':'#f3c789',width:1.55-.66*beat,alpha:.65*Math.sin(Math.PI*beat)**2});
   }
  }
  return {echoes,pulses};
 }
 function createModel(g,data){
  const skills=catalogue(data),acting=actingModule?.create(skills,(s,t)=>orbit(s,phase(s.category,t))),sourceLines=g.frame(SOURCE,2),sourceLayers=g.illustration(SOURCE),pose0=g.performanceAt(SOURCE);
  const sourcePlane=sourceLayers.find(layer=>layer.prop==='possibility');
  const environments=[...sourceLines.filter(l=>l.part==='environment'&&l.alpha>.005).map(l=>({...l,color:l.group==='world'?'#a471d6':'#b17af5'})),...sourceLayers.filter(l=>l.role!=='hand-skin'&&l!==sourcePlane).flatMap((l,j)=>l.paths.map((p,i)=>({...p,id:p.id||'source-'+j+'-'+i,alpha:p.alpha*l.alpha}))).filter(l=>l.alpha>.005)];
  const fragments=environments.map((l,i)=>{const points=l.points.filter((_,j)=>j%Math.max(1,Math.floor(l.points.length/7))===0),center=points.reduce((a,b)=>add(a,b),[0,0,0]).map(v=>v/points.length),seed=hash(String(l.id)+':'+i);return {...l,id:'memory-'+i,sourceId:l.id,points,center,seed};});
  let poseKey=null,restPose=null,echoCache=null,glanceCache=null;
  const emptyOverture={echoes:[],pulses:[]};
  function overtureAt(p,head,compact){
   if(p<=drawings[0].wake||p>=.895)return emptyOverture;
   if(echoCache?.p===p&&echoCache.compact===compact&&head.every((q,i)=>q===echoCache.head[i]))return echoCache.value;
   const value=materialMemories(p,head,compact);echoCache={p,head,compact,value};return value;
  }
  function sample(p,time=0,held=0,compact=false,glowTime=0,thoughtTime=p>.94?(p>=1?time:held):glowTime){p=clamp(p);const relax=smooth((p-.03)/.53),poseTime=28+relax;if(poseKey!==poseTime){poseKey=poseTime;restPose=g.motion.poseAt(poseTime);}const pose=restPose,head=add(pose.head,[0,.015,-.02]),visibleTime=p>=1?time:held,formation=smooth((p-.94)/.06),attention=acting?.sample(visibleTime,pose)||gesture(skills,visibleTime),nodes=skillFrames(skills,p,time,held,head),target=nodes.find(s=>s.id===attention.targetId),open=smooth((p-.68)/.20)*(1-formation);
   for(const pull of attention.pulls||[]){const node=nodes.find(n=>n.id===pull.id);if(node){node.orbitPoint=node.point;node.pull=pull.weight*formation;node.point=lerp(node.orbitPoint,pull.point,node.pull);}}
   const scaledControl=c=>c?{...c,weight:(c.weight||0)*formation,aim:c.targetId?nodes.find(n=>n.id===c.targetId)?.point:c.aim,prelude:scaledControl(c.prelude)}:null,hands=Object.fromEntries(Object.entries(attention.hands||{}).map(([key,c])=>[key,scaledControl(c)]));
   // The pulse continues on a held frame. Share the solved head/actor so
   // the existing body-mesh cache also remains effective during that pause.
   const heldGlance=glanceCache?.progress===p&&glanceCache.compact===compact;
   const looks=heldGlance?null:memoryLooks(p,compact);
   const actor=heldGlance?glanceCache.pose:g.motion.finalePose(pose,{launchProgress:p,memoryLooks:looks,open:open*.82,acting:!!acting&&formation>0,...(!acting?{target:target?.point,side:target&&target.point[0]<CENTER[0]?-1:1,weight:attention.weight*formation}:{}),hands,headTarget:attention.headTarget,headWeight:attention.headWeight*formation,headRoll:attention.headRoll||0,torso:Object.fromEntries(Object.entries(attention.torso||{}).map(([key,v])=>[key,v*formation])),lead:attention.lead});
   if(looks?.length)glanceCache={progress:p,compact,pose:actor};
   // Sample the moving orbit and the solved glove independently. Acquisition and
   // release crossfade those two positions, so reverse scroll retraces the handoff.
   for(const pull of attention.pulls||[]){
    if(!pull.hand)continue;
    const node=nodes.find(n=>n.id===pull.id),pad=actor.contacts[pull.hand].tip;
    node.tilt=pull.tilt*node.pull;
    node.pad=pad;node.point=lerp(node.orbitPoint,add(pad,[0,.14,0]),node.pull);
   }
   const synthesis=attention.synthesis?{...attention.synthesis,weight:attention.synthesis.weight*formation}:null,trace=attention.trace?{...attention.trace,weight:attention.trace.weight*formation}:null;
   const actualHead=add(actor.head,[0,.015,-.02]),overture=overtureAt(p,actualHead,compact);
   const plane=p<.35&&sourcePlane&&g.launchPaperPlane?g.launchPaperPlane(sourcePlane,p,actor):null;
   const quiet=1-.73*Math.max(0,...overture.echoes.map(e=>e.alpha));
   const memory=p>.64?[]:fragments.map((f,i)=>{const delay=(i%9)*.009,u=smooth((p-.16-delay)/(.43-delay)),lane=i%3-1,receiver=add(head,[lane*.035,0,-.015]),c1=add(f.center,[lane*.20,.19,.12]),c2=add(head,[lane*.40,.28,-.15]),center=bezier(f.center,c1,c2,receiver,u),scale=mix(1,.006,smooth(u)),turn=Math.sin(Math.PI*u)*(.3+(i%5)*.11),c=Math.cos(turn),s=Math.sin(turn);return {...f,alpha:quiet*f.alpha*smooth((p-.10)/.12)*(1-smooth((u-.92)/.08)),points:f.points.map(q=>{const v=mul(sub(q,f.center),scale);return add(center,[v[0]*c-v[2]*s,v[1],v[0]*s+v[2]*c]);})};});
   const arrived=p>.61?1:fragments.reduce((n,f,i)=>n+smooth((p-.30-(i%9)*.009)/.29),0)/fragments.length,charge=arrived*(1-smooth((p-.70)/.15)),baseCamera=g.cameraAt(SOURCE,{compact}),endCamera={yaw:-.22,pitch:.10,distance:8.3,focal:6,target:[-.40,.02,.16]},zoom=smooth((p-.1)/.40)*(1-smooth((p-.68)/.25)),blend=smooth((p-.68)/.26),camera={...baseCamera,yaw:mix(baseCamera.yaw,endCamera.yaw,blend),pitch:mix(baseCamera.pitch,endCamera.pitch,blend),distance:mix(baseCamera.distance*(1-zoom*.075),endCamera.distance,blend),target:lerp(lerp(baseCamera.target,add(head,[0,-.12,0]),zoom*.26),endCamera.target,blend),focal:6,near:.25,perspectiveWeight:0,focusWeight:0,orbitWeight:0};
   const light=actingModule?.lightAt(p,charge,thoughtTime,formation)||thoughtModule?.lightAt(p,charge,thoughtTime,formation)||{energy:charge,flare:0,gold:charge,phase:0,spectrum:['#fff8df','#ffe0a2','#edb662']},hookIds=thoughtModule&&formation>0?thoughtModule.targets(skills,(s,t)=>orbit(s,phase(s.category,t)),visibleTime,light.hook):[],hookTargets=hookIds.map(id=>nodes.find(n=>n.id===id)).filter(Boolean);
   return {p,pose:actor,head:actualHead,overture,plane,light,thoughtTime,hookTargets,synthesis,trace,sourceAlpha:quiet*(1-smooth((p-.12)/.16)),environments,memory,charge,nodes,attention,camera,phase:p<.10?'remember':p<.48?'gather':p<.68?'within':p<.94?'reveal':'orbit',pose0};
  }
  return {skills,sample};
 }
 function create(options){
  const {g,canvas,ctx,stageHost,summaryHost,professional,contact,requestMeasure,wake}=options,model=createModel(g,root.ProfileFinaleData||[]),time=clock(),thoughtLayer=thoughtModule?.create(),textures=new Map(),lang=document.documentElement.lang,portal=document.createElement('div');portal.className='finale-portal';portal.setAttribute('aria-hidden','true');document.body.appendChild(portal);const portalCaption=document.createElement('p');portalCaption.className='finale-portal-caption';portal.appendChild(portalCaption);
  const caption=document.querySelector('.finale-caption'),name=document.querySelector('.finale-skill-name'),purpose=document.querySelector('.finale-skill-purpose'),bridge=document.querySelector('#work-heading .story-bridge');
  let layoutWidth=innerWidth,layoutHeight=innerHeight,anchors=[],start=Infinity,end=Infinity,active=false,settled=false,sourceRect=null,padding={top:0,bottom:0,left:0,right:0},snapshot={},loaded=false,lastName='',lastPhase='',lastP=-1,geometryCache=null,skinCache=null;
  function sourceBounds(y){const r=stageHost.getBoundingClientRect(),sticky=parseFloat(getComputedStyle(stageHost.closest('.stage')).top)||105;return {left:r.left,top:Math.min(sticky,r.top+Math.max(0,y-start)),width:r.width,height:r.height};}
  function measure(a){anchors=a;end=a[9];start=a[8]+(a[9]-a[8])*(g.config.morph.start+(g.config.morph.end-g.config.morph.start)*(SOURCE-8));if(active&&(layoutWidth!==innerWidth||layoutHeight!==innerHeight)){sourceRect=sourceBounds(scrollY);padding=innerWidth<768?{top:20,bottom:38,left:0,right:0}:{top:0,bottom:0,left:0,right:0};}layoutWidth=innerWidth;layoutHeight=innerHeight;}
  function progress(y){return y>=end-1?1:clamp((y-start)/Math.max(1,end-start));}
  function load(){if(loaded)return;loaded=true;for(const s of model.skills){const img=new Image();img.src='/assets/skills/'+s.id+'.webp';img.decode().then(async()=>{let bitmap=img;if(root.createImageBitmap){try{bitmap=await createImageBitmap(img,{resizeWidth:160,resizeHeight:160,resizeQuality:'high'});}catch{}}if(bitmap===img){const tile=document.createElement('canvas');tile.width=tile.height=160;tile.getContext('2d').drawImage(img,0,0,160,160);bitmap=tile;}textures.set(s.id,bitmap);img.removeAttribute('src');wake();}).catch(()=>{});}}
  function desired(y){if(y>start-innerHeight*1.4)load();return y>=start&&y<anchors[10];}
  function host(y){const wanted=desired(y),p=progress(y);document.documentElement.classList.toggle('profile-finale-active',wanted);if(!wanted){thoughtLayer?.hide();if(active){active=false;settled=false;professional.classList.remove('finale-active','finale-settled');portal.style.display='none';caption?.classList.remove('is-visible');}return null;}
   if(!active){active=true;const fromStage=canvas.parentElement===stageHost,style=getComputedStyle(canvas);sourceRect=sourceBounds(y);for(const side of ['top','bottom','left','right'])padding[side]=fromStage?(parseFloat(style['padding'+side[0].toUpperCase()+side.slice(1)])||0):(innerWidth<768?(side==='top'?20:side==='bottom'?38:0):0);}
   professional.classList.add('finale-active');const nextSettled=p>=1;if(settled&&!nextSettled)time.capture();settled=nextSettled;professional.classList.toggle('finale-settled',settled);
   if(settled){portal.style.display='none';const r=summaryHost.getBoundingClientRect();if(r.bottom<=0||r.top>=innerHeight)thoughtLayer?.hide();return summaryHost;}
   const s=stageHost.getBoundingClientRect(),d=summaryHost.getBoundingClientRect(),u=smooth((p-.53)/.47),w=mix(sourceRect.width,d.width,u),h=mix(sourceRect.height,d.height,u),safe=document.querySelector('.site-header').getBoundingClientRect().bottom+10;
   const earlyTop=mix(sourceRect.top,Math.max(safe,sourceRect.top),smooth(p/.18)),dy=Math.min(d.top,Math.max(safe,innerHeight-h-18)),top=mix(earlyTop,dy,u);
   portal.style.display='block';portal.style.left=mix(s.left,d.left,u)+'px';portal.style.top=top+'px';portal.style.width=w+'px';portal.style.height=h+'px';
   return portal;
  }
  function drawPath(points,color,width,alpha,project){if(alpha<=.002||points.length<2)return;ctx.globalAlpha=clamp(alpha);ctx.strokeStyle=color||'#b17af5';ctx.lineWidth=width||.7;ctx.beginPath();const a=project(points[0]);ctx.moveTo(a[0],a[1]);for(let i=1;i<points.length;i++){const q=project(points[i]);ctx.lineTo(q[0],q[1]);}ctx.stroke();}
  function paintedPath(item,alpha,fillAlpha,project){
   if(item.fill&&alpha*fillAlpha>.003){
    const points=item.points.map(project);
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(const q of points.slice(1))ctx.lineTo(q[0],q[1]);
    ctx.closePath();ctx.globalAlpha=clamp(alpha*fillAlpha);ctx.fillStyle=item.fill;ctx.fill();
   }
   drawPath(item.points,item.color,item.width,alpha,project);
  }
  const formationAt=p=>smooth((p-.94)/.06);
 function render(dt,y){const p=progress(y),r=canvas.getBoundingClientRect(),visible=r.bottom>0&&r.top<innerHeight&&r.right>0;if(!active||!r.width||!r.height)return {active:false,pending:false};
   const c=time.step(p,dt,visible&&!document.hidden),f=model.sample(p,c.time,c.held,innerWidth<768,c.glowTime,c.thoughtTime),w=r.width,h=r.height,project0=g.projectorForCamera(f.camera,w,h),release=smooth(p/.12),sx=mix((sourceRect.width-padding.left-padding.right)/sourceRect.width,1,release),sy=mix((sourceRect.height-padding.top-padding.bottom)/sourceRect.height,1,release),project=q=>{const v=project0(q);return [v[0]*sx+padding.left*(1-release),v[1]*sy+padding.top*(1-release),v[2]];};
   ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);ctx.clearRect(0,0,w,h);ctx.lineCap=ctx.lineJoin='round';
   thoughtLayer?.draw(f,project,r);
   for(const l of f.environments)drawPath(l.points,l.color,l.width,l.alpha*f.sourceAlpha,project);
   for(const l of f.memory){drawPath(l.points,l.color,l.width||.75,l.alpha,project);if(f.p>.27&&l.alpha>.05){const q=project(l.points.at(-1));ctx.globalAlpha=l.alpha*.45;ctx.fillStyle=l.color;ctx.beginPath();ctx.arc(q[0],q[1],.9,0,TAU);ctx.fill();}}
   for(const echo of f.overture.echoes)for(const path of echo.paths)paintedPath(path,echo.alpha,echo.fillAlpha,project);
   for(const pulse of f.overture.pulses)drawPath(pulse.points,pulse.color,pulse.width,pulse.alpha,project);
   const projected=f.nodes.map(s=>{
    const q=project(s.point),perspective=project0.scale/Math.max(.25,f.camera.distance-q[2]);
    const front=clamp((q[2]+.9)/1.8),compact=innerWidth<768;
    let radius=.48*clamp(perspective*(.22+.09*front),compact?10:12,compact?27:39);
    if(s.pad&&s.pull>0){
     const pad=project(s.pad),crown=project(add(s.pad,[0,.14,0]));
     radius=mix(radius,Math.hypot(crown[0]-pad[0],crown[1]-pad[1]),s.pull);
    }
    return {...s,q,front,radius};
   }).sort((a,b)=>a.q[2]-b.q[2]),bodyDepth=project(f.pose.shoulder)[2];
   const pieces=f.synthesis?.ids.map(id=>projected.find(s=>s.id===id));
   const socket=pieces?.[0],plug=pieces?.[1];
   const jointAngle=socket&&plug?clamp(Math.atan2(plug.q[1]-socket.q[1],plug.q[0]-socket.q[0]),-.40,.40):0;
   const focus=f.synthesis?Math.min(...f.attention.pulls.map(v=>v.weight))*formationAt(p):0;
   function housing(s,isSocket){
    // The open jaws of the receiver and the stepped brass tongue of the
    // insert are distinct silhouettes even with the inner artwork unlit.
    const points=isSocket?
     [[-.98,-.60],[-.71,-.94],[.56,-.94],[1.13,-.58],[1.13,-.28],[.70,-.28],[.70,.26],[1.13,.26],[1.13,.58],[.65,.90],[-.73,.90],[-.98,.61]]:
     [[-.66,-.82],[.46,-.82],[.98,-.40],[.98,.43],[.52,.90],[-.66,.90],[-.84,.48],[-.84,.17],[-1.32,.17],[-1.32,-.18],[-.84,-.18],[-.84,-.47]];
    const r=s.radius;
    function plate(offset,fill,stroke){
     ctx.beginPath();for(const [i,[x,y]] of points.entries()){if(i===0)ctx.moveTo(x*r,(y+offset)*r);else ctx.lineTo(x*r,(y+offset)*r);}
     ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=.78;ctx.stroke();
    }
    ctx.save();ctx.globalAlpha*=s.pull;ctx.rotate(jointAngle);
    plate(.11,isSocket?'#282c49':'#51402f','#958799');
    plate(0,isSocket?'#5c657f':'#967950',isSocket?'#bfcde0':'#f0cca0');
    if(!isSocket){
     ctx.fillStyle='#f4d691';ctx.fillRect(-1.28*r,-.12*r,.40*r,.24*r);
    }
    ctx.restore();
   }
   function icon(s){
    if(s.alpha<.005)return;
    const acquired=(s===socket||s===plug)?s.pull||0:0;
    const radius=s.radius*(1-.33*acquired),size=radius/.48,alpha=s.alpha*(.13+.87*s.front);
    const selected=(s.id===f.attention.targetId||s.id===f.attention.secondaryId)&&f.attention.weight>.1;
    ctx.save();ctx.globalAlpha=alpha*(selected?1:1-.46*focus);ctx.translate(s.q[0],s.q[1]);if(s.tilt)ctx.rotate(s.tilt);
    if(acquired>.001)housing(s,s===socket);
    ctx.fillStyle='#0c0914';ctx.beginPath();ctx.arc(0,0,radius,0,TAU);ctx.fill();
    ctx.shadowColor=s.color;ctx.shadowBlur=selected?14*(1-acquired):s.front*5;ctx.strokeStyle=s.color;ctx.lineWidth=selected?1.6-.6*acquired:.65;ctx.stroke();ctx.shadowBlur=0;
    const image=textures.get(s.id);
    if(image){ctx.beginPath();ctx.arc(0,0,size*.45,0,TAU);ctx.clip();ctx.drawImage(image,-size*.43,-size*.43,size*.86,size*.86);}
    else{ctx.strokeStyle=s.color;ctx.beginPath();ctx.moveTo(-size*.18,0);ctx.lineTo(0,-size*.2);ctx.lineTo(size*.18,0);ctx.lineTo(0,size*.2);ctx.closePath();ctx.stroke();}
    ctx.restore();
   }
   if(p<.94)for(const s of projected){if(s.flight>.01&&s.flight<.999){const a=f.head,b=s.point,mid=lerp(a,b,.45);mid[1]+=.20;drawPath(Array.from({length:17},(_,i)=>bezier(a,mid,mid,b,i/16)),s.color,.9,s.alpha*(1-s.flight)*.65,project);}}
   // Three spatial planes remain faint; identity lives in the icons and native catalogue.
   if(p>.71)for(const category of Object.keys(groups)){const sample=model.skills.find(s=>s.category===category),points=Array.from({length:97},(_,i)=>orbit({...sample,slot:0},i/96*TAU));drawPath(points,colors[category],.65,smooth((p-.71)/.22)*.16,project);}
   for(const s of projected)if(s.pull>.02&&s.orbitPoint){const mid=lerp(s.orbitPoint,s.point,.5);mid[1]+=.12;drawPath(Array.from({length:19},(_,i)=>bezier(s.orbitPoint,mid,mid,s.point,i/18)),s.color,.7,s.pull*.24,project);}
   for(const s of projected)if(s.q[2]<bodyDepth)icon(s);
   if(geometryCache?.pose!==f.pose){geometryCache={pose:f.pose,body:g.bodyLines(f.pose,2),skin:g.bodySkin(f.pose)};skinCache=null;}
   const {body,skin}=geometryCache,handLines=body.filter(l=>l.group==='hand');
   for(const l of body.filter(l=>l.group!=='hand'))drawPath(l.points,l.group==='intent'?'#ffe7b1':l.group==='support'?'#a8e6d5':'#b17af5',l.width,l.alpha,project);
   const projectionKey=[w,h,sx,sy,f.camera.yaw,f.camera.pitch,f.camera.distance,...f.camera.target].join(':');
   if(skinCache?.key!==projectionKey){const skins=skin.map(layer=>({...layer,paths:layer.paths.map(item=>({...item,points:item.points.map(project)}))}));skinCache={key:projectionKey,skins,materials:g.skinMaterials(skins)};}
   const {skins,materials}=skinCache;
   for(const layer of skins){const points=layer.paths.flatMap(v=>v.points),m=materials.find(v=>v.id.includes(layer.id==='hand-skin-L'?'glove-L':'glove-R'))||materials[skins.indexOf(layer)];if(!m)continue;const gradient=ctx.createRadialGradient(m.fx,m.fy,0,m.cx,m.cy,m.r);for(const [at,color]of m.stops)gradient.addColorStop(at,color);ctx.globalAlpha=layer.alpha;ctx.fillStyle=gradient;ctx.beginPath();for(const item of layer.paths){ctx.moveTo(item.points[0][0],item.points[0][1]);for(const q of item.points.slice(1))ctx.lineTo(q[0],q[1]);ctx.closePath();}ctx.fill();}
   for(const l of handLines)drawPath(l.points,'#bda0e9',l.width,l.alpha,project);
   if(f.plane?.alpha>.003)for(const panel of f.plane.paths)paintedPath(panel,panel.alpha*f.plane.alpha,1,project);
   const palm=project(f.pose.light),palmEnergy=(1-(f.plane?.alpha||0))*(1-smooth((p-.15)/.30))*.6+f.attention.weight*.36*smooth((p-.94)/.06);if(palmEnergy>.01){ctx.globalAlpha=palmEnergy;const light=ctx.createRadialGradient(palm[0],palm[1],0,palm[0],palm[1],14);light.addColorStop(0,'#fff5d9');light.addColorStop(.14,'#edd3ff');light.addColorStop(1,'#bf80ff00');ctx.fillStyle=light;ctx.fillRect(palm[0]-14,palm[1]-14,28,28);}

   for(const s of projected)if(s.q[2]>=bodyDepth)icon(s);
   if(f.synthesis?.weight>.005){const pair=f.synthesis.ids.map(id=>projected.find(s=>s.id===id));if(pair.every(Boolean)){const a=pair[0].point,b=pair[1].point,center=lerp(a,b,.5),strength=f.synthesis.weight;
    // Connect the facing rims. Arch the thread around the artwork and let it
    // tighten into a small stitch under pressure, preserving both identities.
    const [left,right]=pair,dx=right.q[0]-left.q[0],dy=right.q[1]-left.q[1],span=Math.hypot(dx,dy)||1;
    const ux=dx/span,uy=dy/span;
    for(const lane of [-1,1]){
     const offset=lane*.60;
     const rim=(s,direction)=>[s.q[0]+s.radius*(direction*ux*.8-uy*offset),s.q[1]+s.radius*(direction*uy*.8+ux*offset)];
     const start=rim(left,1),end=rim(right,-1),bow=lane*(1-strength*.6)*Math.min(left.radius,right.radius);
     ctx.globalAlpha=.84*strength;ctx.strokeStyle=lane===1?right.color:left.color;ctx.lineWidth=1.3;
     ctx.beginPath();ctx.moveTo(...start);ctx.quadraticCurveTo((start[0]+end[0])/2-uy*bow,(start[1]+end[1])/2+ux*bow,...end);ctx.stroke();
    }
    const q=project(center),radius=clamp(project0.scale*.042/(f.camera.distance-q[2]),2,9),halo=ctx.createRadialGradient(q[0],q[1],0,q[0],q[1],radius*2.6);halo.addColorStop(0,'#fffbe5');halo.addColorStop(.23,'#ffe499bb');halo.addColorStop(.58,'#ddacff50');halo.addColorStop(1,'#bf8aff00');ctx.save();ctx.globalCompositeOperation='lighter';const sincePress=(f.synthesis.phase-6.63)/.32;ctx.globalAlpha=strength*(.31+.50*Math.exp(-sincePress*sincePress));ctx.fillStyle=halo;ctx.fillRect(q[0]-radius*2.6,q[1]-radius*2.6,radius*5.2,radius*5.2);ctx.restore();
   }}
   if(f.trace?.weight>.005){const pair=f.trace.ids.map(id=>projected.find(s=>s.id===id));if(pair.every(Boolean)){const a=pair[0].point,b=pair[1].point,mid=lerp(a,b,.5);mid[1]+=.16;drawPath(Array.from({length:31},(_,i)=>bezier(a,mid,mid,b,i/30)),'#d1c2ef',.8,f.trace.weight*.5,project);}}
   const pointed=projected.find(s=>s.id===f.attention.targetId);if(p>.94){for(const [side,control]of Object.entries(f.attention.hands||{})){const node=projected.find(s=>s.id===control.targetId);if(node&&control.weight>.15&&(!node.pad||node.pull<1)){const tip=f.pose.contacts[side].tip,mid=lerp(tip,node.point,.5);mid[1]+=.035;drawPath(Array.from({length:13},(_,i)=>bezier(tip,mid,mid,node.point,i/12)),node.color,.85,control.weight*formationAt(p)*(1-(node.pad?node.pull:0))*.60,project);}}}
   ctx.globalAlpha=1;
   const labels={en:{remember:'What the work leaves with me.',gather:'Every piece carries a lesson.',within:'The experience stays with the person.',reveal:'Experience becomes capability.',orbit:'HolyMind · 34 skills, shaped through practice.'},th:{remember:'สิ่งที่ทำ ค่อย ๆ ติดตัวผมมา',gather:'แต่ละชิ้นมีเรื่องที่ผมได้เรียนรู้',within:'ประสบการณ์ยังอยู่ในคนที่ลงมือทำ',reveal:'สิ่งที่เรียนรู้ เริ่มมีตัวตนของมันเอง',orbit:'HolyMind · 34 สกิลจากการลงมือทำ'}};
   const reviewed=root.ProfileScenes?.reviewFinale;if(reviewed){Object.assign(labels.en,reviewed.en);Object.assign(labels.th,reviewed.th);}
   if(lastPhase!==f.phase){lastPhase=f.phase;const el=document.querySelector('.finale-phase');if(el)el.textContent=labels[lang==='th'?'th':'en'][f.phase];portalCaption.textContent=labels[lang==='th'?'th':'en'][f.phase];}
   caption?.classList.toggle('is-visible',p>.85);const partner=projected.find(s=>s.id===f.attention.secondaryId),pairing=f.attention.kind==='pair'&&partner&&f.attention.weight>.15,selected=pointed||(!lastName?projected.find(s=>s.q[2]>bodyDepth)||projected[0]:null),captionKey=selected?(pairing?selected.id+'+'+partner.id:selected.id):lastName;
   if(selected&&captionKey!==lastName&&!caption?.contains(document.activeElement)){lastName=captionKey;if(name)name.textContent=pairing?selected.name+' + '+partner.name:selected.name;if(purpose)purpose.textContent=pairing?(reviewed?.[lang==='th'?'th':'en']?.synthesis||(lang==='th'?'ลองให้สองวิธีนี้ทำงานด้วยกัน':'Two ways of working, brought together.')):(lang==='th'?selected.concept_th:selected.purpose);}
   snapshot={active:true,p,phase:f.phase,visible,visibleSeconds:c.time,heldSeconds:c.held,headGlowSeconds:c.glowTime,thoughtSeconds:c.thoughtTime,thought:thoughtLayer?.snapshot(),headLight:f.light,actingKind:f.attention.kind,actingBeat:f.attention.beat,secondaryId:f.attention.secondaryId,synthesis:f.synthesis?{ids:f.synthesis.ids,weight:f.synthesis.weight}:null,captured:f.nodes.filter(s=>s.pull>.01).map(s=>({id:s.id,weight:s.pull,point:s.point})),skillCount:f.nodes.length,fragmentCount:f.memory.length,memoryWorks:f.overture.echoes.filter(e=>e.alpha>.04).map(e=>e.id),planeAlpha:f.plane?.alpha||0,planeVisible:(f.plane?.alpha||0)>.01,arrivedMass:f.charge,targetId:f.attention.targetId,gesture:f.attention.stage,hand:f.attention.targetId&&pointed?.point[0]<CENTER[0]?'left':'right',head:f.head,host:canvas.parentElement===portal?'portal':'experience',textures:textures.size,camera:f.camera};lastP=p;
   return {active:true,pending:visible&&(p>=1||(p>.38&&p<.85&&f.charge>.005)),visible};
  }
  return {measure,host,render,progress,desired,snapshot:()=>({...snapshot,active,visible:active&&canvas.getBoundingClientRect().bottom>0&&canvas.getBoundingClientRect().top<innerHeight}),resetTime:()=>{thoughtLayer?.hide();},model};
 }
 const api={SOURCE,phase,orbit,clock,catalogue,gesture,createModel,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileFinale=api;
})(typeof globalThis!=='undefined'?globalThis:this);
