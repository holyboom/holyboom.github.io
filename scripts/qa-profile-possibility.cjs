/* Final offering: one distinct prop, approved camera/actor, pure native scroll. */
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),g=require('../assets/profile/geometry.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4174/',out=process.env.POSSIBILITY_QA_DIR||'/tmp/profile-possibility';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
function position(track){let lo=8,hi=9;for(let i=0;i<46;i++){const m=(lo+hi)/2;g.cameraTrack(m)<track?lo=m:hi=m;}return (lo+hi)/2;}
check('only-final-offer-uses-the-new-work-prop',g.sequence[28].prop==='possibility'&&g.sequence[25].prop==='recipient'&&g.sequence.length===31);
const samples=Array.from({length:61},(_,i)=>27.26+i*.015),forward=samples.map(t=>JSON.stringify(g.illustration(position(t))));
check('paper-and-light-retrace-exactly',samples.every((t,i)=>JSON.stringify(g.illustration(position(samples[samples.length-1-i])))===forward[samples.length-1-i]));
const planeAt=t=>g.illustration(position(t)).find(l=>l.prop==='possibility'&&l.alpha>.05);
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const panel=(plane,id)=>plane.paths.find(item=>item.id==='work-28-plane-'+id);
const phases=[27.39,27.60,27.746].map(planeAt);
check('folded-unfolding-and-open-are-distinct-states',phases[0].unfold===0&&phases[1].unfold>0&&phases[1].unfold<1&&phases[2].unfold===1);
check('two-paper-wings-meet-at-the-visible-crease',phases.every(plane=>{
 const spine=panel(plane,'spine'),keel=panel(plane,'keel'),wings=['wing-far','wing-near'].map(id=>panel(plane,id));
 return plane.texts.length===0&&spine&&keel?.fill&&wings.every(wing=>wing?.fill&&wing.readingAnchor&&
  distance(wing.points[0],wing.points.at(-1))<1e-8&&spine.points.every(q=>wing.points.some(v=>distance(q,v)<1e-8)));
}));
check('keel-rests-on-the-original-glove',samples.every(t=>{
 const plane=planeAt(t);if(!plane)return true;
 const pad=g.performanceAt(position(t)).contacts.right.tip;
 return distance(plane.source,pad)<1e-8&&distance(plane.hub,pad)<1e-8&&panel(plane,'keel').points.some(q=>distance(q,pad)<1e-8);
}));
function insidePolygon(point,vertices){
 let inside=false;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
  const a=vertices[i],b=vertices[j];
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
const bounds=points=>[0,1].map(i=>[Math.min(...points.map(q=>q[i])),Math.max(...points.map(q=>q[i]))]);
const visibility=[];
for(const [w,h,compact] of [[393,272,true],[390,221,true],[696,780,false]]){
 let maximumHeadOverlap=0,clipped=0,openSize;
 for(const t of [...samples,27.746]){
  const p=position(t),plane=planeAt(t);if(!plane)continue;
  const project=g.createProjector(p,w,h,{compact}),opaque=plane.paths.filter(path=>path.fill).map(path=>path.points.map(project));
  const points=opaque.flat(),head=g.frame(p,2).filter(l=>l.part==='head').flatMap(l=>l.points.map(project));
  if(points.some(q=>!q.every(Number.isFinite)))throw Error('Nonfinite paper vertex');
  if(plane.alpha>.5){
   clipped+=points.filter(q=>q[0]<0||q[0]>w||q[1]<0||q[1]>h).length;
   const covered=head.filter(q=>opaque.some(polygon=>insidePolygon(q,polygon))).length;
   maximumHeadOverlap=Math.max(maximumHeadOverlap,covered/head.length);
  }
  if(t===27.746)openSize=bounds(points).map(([min,max])=>max-min);
 }
 visibility.push({w,h,maximumHeadOverlap,clipped,openSize});
}
check('paper-fits-the-picture-and-leaves-the-head-readable',visibility.every(v=>v.clipped===0&&v.maximumHeadOverlap<.06),visibility);
// On the short phone the canvas height limits the subject's projected size.
check('open-plane-retains-readable-wings-and-room-for-the-maker',visibility.filter(v=>v.w<500).every(v=>{
 const [width,height]=v.openSize;
 return width>.40*v.h&&width<.60*v.h&&height>.16*v.h&&height<.31*v.h;
}),visibility);
const finale=require('../assets/profile/finale.js'),skillData=require('../assets/skills.json');
const ending=finale.createModel(g,skillData.skills||skillData),source=g.illustration(finale.SOURCE).find(l=>l.prop==='possibility');
const dt=.00001,release=.20;
const [before,at,after]=[-dt,0,dt].map(offset=>ending.sample(release+offset).plane.hub);
const velocity=(a,b)=>b.map((value,i)=>(value-a[i])/dt);
check('paper-inherits-the-moving-palms-release-velocity',distance(velocity(before,at),velocity(at,after))<.02);
const first=ending.sample(0),held=ending.sample(.15),away=ending.sample(.27),landed=ending.sample(.36),rewound=ending.sample(.15);
check('same-paper-wings-enter-the-finale-and-release-from-the-glove',
 JSON.stringify(first.plane)===JSON.stringify(source)&&distance(held.plane.hub,held.pose.contacts.right.tip)<1e-8&&
 away.plane.flight>0&&distance(away.plane.hub,away.pose.contacts.right.tip)>.15&&
 panel(away.plane,'wing-near').fill===panel(source,'wing-near').fill&&!landed.plane&&JSON.stringify(held.plane)===JSON.stringify(rewound.plane));
(async()=>{const b=await chromium.launch();try{for(const viewport of [{width:1280,height:840},{width:390,height:844}]){const p=await b.newPage({viewport});p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'profile/');await p.waitForFunction(()=>window.ProfileExperience);await p.evaluate(()=>document.fonts.ready);
 async function go(track){const pos=position(track);await p.evaluate(pos=>{const s=ProfileExperience.snapshot(),f=ProfileGeometry.config.morph;scrollTo({top:s.anchors[8]+(s.anchors[9]-s.anchors[8])*(f.start+(f.end-f.start)*(pos-8)),behavior:'instant'});},pos);await p.waitForFunction(pos=>Math.abs(ProfileExperience.snapshot().current-pos)<.001&&ProfileExperience.snapshot().current===ProfileExperience.snapshot().target,pos);return p.evaluate(()=>{const s=ProfileExperience.snapshot(),v=ProfileGeometry.illustration(s.current).find(l=>l.prop==='possibility');return {camera:s.camera,unfold:v?.unfold,paths:v?.paths,reading:s.readingThread};});}
 const opened=await go(28.04);check('native-scroll-reveals-open-offering-'+viewport.width,opened.unfold===1&&opened.paths.some(path=>path.id==='work-28-plane-wing-near'&&path.fill)&&opened.reading.visible&&opened.paths.some(path=>path.readingAnchor&&path.id===opened.reading.componentId),opened.reading);
 await p.screenshot({path:path.join(out,'offer-'+viewport.width+'.png')});await go(27.76);const again=await go(28.04);check('reverse-restores-identical-camera-and-offering-'+viewport.width,JSON.stringify(opened.camera)===JSON.stringify(again.camera)&&JSON.stringify(opened.paths)===JSON.stringify(again.paths));
 await p.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await p.waitForFunction(()=>ProfileExperience.snapshot().target===10);await go(28.04);check('return-from-ending-preserves-full-motion-and-layout-'+viewport.width,await p.evaluate(()=>ProfileExperience.snapshot().mode==='full'&&document.documentElement.scrollWidth<=innerWidth&&!document.querySelector('#motion')));await p.close();
}}finally{await b.close();}check('no-browser-errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>!c.pass),out}));if(checks.some(c=>!c.pass))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
