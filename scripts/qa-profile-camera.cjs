/* Camera contracts: perspective, continuity, composition and native reduced motion.
   Run against the built preview; SKIP_BROWSER=1 runs the numerical checks only. */
const fs=require('node:fs'),path=require('node:path'),g=require('../assets/profile/geometry.js');
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const out=process.env.CAMERA_QA_DIR||'/tmp/profile-camera-qa';fs.mkdirSync(out,{recursive:true});
const fields=c=>[c.yaw,c.pitch,c.distance,c.focal,...c.target];
const delta=(a,b)=>Math.max(...fields(a).map((n,i)=>Math.abs(n-fields(b)[i])));
const positionFor=s=>Math.min(10,s.chapter+(s.step+.05)/s.count);
(async()=>{
 if(typeof g.cameraAt!=='function'||typeof g.createProjector!=='function')throw new Error('Camera API is missing. Build the camera implementation before running this suite.');
 const positions=Array.from({length:401},(_,i)=>i/40),forward=positions.map(p=>g.cameraAt(p)),reverse=[...positions].reverse().map(p=>g.cameraAt(p)).reverse();
 check('camera-finite-for-entire-story',forward.every(c=>fields(c).every(Number.isFinite)&&c.distance>0&&c.focal>0));
 check('camera-reverses-without-history',JSON.stringify(forward)===JSON.stringify(reverse));
 const span=key=>Math.max(...forward.map(c=>c[key]))-Math.min(...forward.map(c=>c[key]));
 check('authored-depth-and-angle-variety',span('distance')>.5&&span('yaw')>.15&&span('pitch')>.10,{distanceSpan:span('distance'),yawSpan:span('yaw'),pitchSpan:span('pitch')});
 const boundaries=new Set([0,10]);for(const shot of g.sequence)for(const phase of [0,.08,.20,.85,.96,1])boundaries.add(Math.min(10,shot.chapter+(shot.step+phase)/shot.count));
 const jumps=[];for(const p of boundaries){const difference=delta(g.cameraAt(Math.max(0,p-1e-5)),g.cameraAt(Math.min(10,p+1e-5)));if(difference>.005)jumps.push({position:p,difference});}
 check('no-camera-cuts-at-beat-or-easing-boundaries',jumps.length===0,jumps);
 const compact=positions.map(p=>g.cameraAt(p,{compact:true}));
 check('compact-camera-finite-and-reversible',compact.every(c=>fields(c).every(Number.isFinite))&&JSON.stringify(compact)===JSON.stringify([...positions].reverse().map(p=>g.cameraAt(p,{compact:true})).reverse()));
 const neutral=positions.map(p=>g.cameraAt(p,{strength:0}));
 check('zero-strength-locks-a-static-camera',neutral.every(c=>delta(c,neutral[0])<1e-10));
 const compactSpan=key=>Math.max(...compact.map(c=>c[key]))-Math.min(...compact.map(c=>c[key]));
 check('compact-reduces-orbit-and-dolly-range',compactSpan('yaw')<span('yaw')&&compactSpan('pitch')<span('pitch')&&compactSpan('distance')<span('distance'));
 const transitClipping=[];for(const position of positions)for(const {w,h,compact}of [{w:696,h:860,compact:false},{w:390,h:228,compact:true}]){const project=g.createProjector(position,w,h,{compact}),subject=project.camera.framing==='head'?g.performanceAt(position).head:g.lightAt(position),q=project(subject);if(q[0]<0||q[0]>w||q[1]<0||q[1]>h)transitClipping.push({position,w,h,framing:project.camera.framing,point:q.slice(0,2)});}
 check('intended-subject-remains-in-frame-during-transitions',transitClipping.length===0,transitClipping);
 const clipping=[],nonfinite=[],nearPlane=[],misaligned=[];
 for(const {w,h,compact}of [{w:696,h:860,compact:false},{w:390,h:228,compact:true},{w:480,h:620,compact:false},{w:720,h:720,compact:false}]){
  for(const shot of g.sequence){const position=positionFor(shot),project=g.createProjector(position,w,h,{compact}),model=g.frame(position,2),hand=g.lightAt(position),tip=project(hand),trailTip=project(g.lightTrail(position,1)[0].point),signalTip=project(model.find(l=>l.id===0).points[0]);
   const same=(a,b)=>a.every((n,i)=>Math.abs(n-b[i])<1e-8);
   if(!same(tip,trailTip)||!same(tip,signalTip))misaligned.push({shot:shot.action,w,h});
   if(shot.chapter>0&&(tip[0]<0||tip[0]>w||tip[1]<0||tip[1]>h))clipping.push({type:'hand',shot:shot.action,w,h,point:tip.slice(0,2)});
   const samples=model.flatMap(l=>l.points.filter((_,i)=>i%12===0));
   for(const p of samples){const q=project(p);if(!q.every(Number.isFinite))nonfinite.push({shot:shot.action,w,h});if(project.camera.distance-q[2]<=.1)nearPlane.push({shot:shot.action,w,h});}
   for(const layer of g.illustration(position)){
    // Primary work must fit; terrain and scenery intentionally extend beyond
    // the frame, particularly in portraits and documentary detail shots.
    if(layer.alpha<.5||layer.role==='surroundings')continue;
    const points=layer.paths.flatMap(p=>p.points),projected=points.map(project),inside=projected.filter(p=>p[0]>=0&&p[0]<=w&&p[1]>=0&&p[1]<=h).length;
    // Permit a deliberate detail crop; losing over 15% of the primary prop is suspicious.
    if(points.length&&inside/points.length<.85)clipping.push({type:'prop',shot:shot.action,w,h,visibleFraction:inside/points.length});
    for(const label of layer.texts){const p=project(label.point);if(p[0]<8||p[0]>w-8||p[1]<8||p[1]>h-8)clipping.push({type:'label',shot:shot.action,w,h,text:label.text,point:p.slice(0,2)});}
   }
  }
 }
 check('finite-projection-through-all-31-shots',nonfinite.length===0,nonfinite.slice(0,8));
 check('no-eye-plane-crossings',nearPlane.length===0,nearPlane.slice(0,8));
 check('hand-and-trail-share-the-camera',misaligned.length===0,misaligned);
 check('primary-props-labels-and-hand-remain-readable',clipping.length===0,clipping);
 // A perspective camera makes equal-sized features at different depths project differently.
 const project=g.createProjector(2,696,860),lengthAt=z=>{const a=project([-.1,0,z]),b=project([.1,0,z]);return Math.hypot(a[0]-b[0],a[1]-b[1]);};
 check('depth-changes-apparent-scale',Math.abs(lengthAt(1)-lengthAt(-1))>2,{near:lengthAt(1),far:lengthAt(-1)});
 if(process.env.SKIP_BROWSER!=='1'){
  const {chromium}=require('playwright'),browser=await chromium.launch({headless:true});
  try{
   const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));
   await p.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await p.waitForFunction(()=>window.ProfileExperience&&window.ProfileExperience.snapshot().camera);await p.evaluate(()=>document.fonts.ready);
   const anchors=await p.evaluate(()=>ProfileExperience.snapshot().anchors);
   async function go(position){const chapter=Math.floor(position),y=anchors[chapter]+(anchors[chapter+1]-anchors[chapter])*(g.config.morph.start+(g.config.morph.end-g.config.morph.start)*(position-chapter));await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForFunction(expected=>Math.abs(ProfileExperience.snapshot().target-expected)<.005,position);await p.waitForFunction(()=>Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001);return p.evaluate(()=>ProfileExperience.snapshot());}
   const first=await go(1.35),other=await go(3.35),again=await go(1.35);
   check('live-camera-follows-scroll',delta(first.camera,other.camera)>.05,{first:first.camera,other:other.camera});
   check('live-camera-retraces-on-reverse-scroll',delta(first.camera,again.camera)<1e-4);
   await p.emulateMedia({reducedMotion:'reduce'});const previous=await p.evaluate(()=>ProfileExperience.snapshot().draws);await p.evaluate(()=>document.querySelector('#craft').scrollIntoView({behavior:'instant'}));await p.waitForTimeout(250);
   check('owner-full-motion-keeps-camera-rendering',await p.locator('.stage').isVisible()&&await p.evaluate(count=>ProfileExperience.snapshot().mode==='full'&&ProfileExperience.snapshot().draws>count,previous));
   check('motion-selector-is-not-exposed',await p.locator('#motion,.motion-control').count()===0);
   check('camera-browser-errors',errors.length===0,errors);
  }finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,physicalDevice:false},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,output:out},null,2));if(failed.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
