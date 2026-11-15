/* Independent locked-orbit contracts. SKIP_BROWSER=1 runs numerical QA only.
   TEST_URL defaults to http://127.0.0.1:4174/; ORBIT_QA_DIR selects evidence. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'../assets/profile/geometry.js'),g=require(source);
const out=path.resolve(process.env.ORBIT_QA_DIR||'docs/evidence/locked-orbits/numerical');
const checks=[],errors=[],browserSources=[],browserStates=[];fs.mkdirSync(out,{recursive:true});
const check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const fields=c=>[c.yaw,c.pitch,c.distance,c.focal,...c.target];
const delta=(a,b)=>Math.max(...fields(a).map((v,i)=>Math.abs(v-fields(b)[i])));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const peak=event=>(event.turnEnd+event.holdEnd)/2;
// Use the public linear camera-track API, not the eased performance resolver.
function positionAt(track){let lo=0,hi=g.config.scenes.length-1;for(let n=0;n<55;n++){const mid=(lo+hi)/2;if(g.cameraTrack(mid)<track)lo=mid;else hi=mid;}return(lo+hi)/2;}
const bodyPart=line=>line.part!=='environment'&&line.part!=='signal';
const activeDust=position=>g.illustration(position).filter(l=>l.role==='surroundings').flatMap(l=>l.paths.filter(p=>p.particle&&p.alpha*l.alpha>1e-6));
const frontWork=(position,explode)=>g.illustration(position,explode).filter(l=>l.role==='front-work');

(async()=>{
 const windows=g.config.camera.orbits;
 if(!Array.isArray(windows)||!windows.length||typeof g.orbitAt!=='function'||typeof g.cameraTrack!=='function')throw new Error('Authored orbit API/config is unavailable.');
 const ordered=windows.every((e,i)=>e.id&&[e.start,e.lockStart,e.turnEnd,e.holdEnd,e.returnEnd,e.end].every(Number.isFinite)&&e.start<e.lockStart&&e.lockStart<e.turnEnd&&e.turnEnd<=e.holdEnd&&e.holdEnd<e.returnEnd&&e.returnEnd<e.end&&(!i||windows[i-1].end<=e.start));
 check('orbit-windows-have-ordered-nonoverlapping-phases',ordered);
 const tracks=[...new Set([...Array.from({length:301},(_,i)=>i/10),...windows.flatMap(e=>Array.from({length:101},(_,i)=>e.start+(e.end-e.start)*i/100))])].sort((a,b)=>a-b);
 const positions=tracks.map(positionAt);
 check('camera-track-inversion-is-accurate',positions.every((p,i)=>Math.abs(g.cameraTrack(p)-tracks[i])<1e-9));
 const summaries=[];
 for(const compact of [false,true]){
  const label=compact?'mobile':'desktop',values=positions.map(p=>g.cameraAt(p,{compact})),golden=values.map(hash);
  check(label+'-camera-is-finite',values.every(c=>fields(c).every(Number.isFinite)&&c.distance>.5&&c.focal>0&&c.orbitWeight>=0&&c.orbitWeight<=1));
  check(label+'-camera-retraces-in-reverse',positions.every((_,i)=>{const j=positions.length-1-i;return hash(g.cameraAt(positions[j],{compact}))===golden[j];}));
  let seed=0x0b17;const shuffled=[...positions.keys()];for(let i=shuffled.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  check(label+'-jumps-do-not-depend-on-history',shuffled.every(i=>hash(g.cameraAt(positions[i],{compact}))===golden[i]));
  const failures=[],yawRanges=[],lockCameras=[];
  for(const event of windows){
   const rows=Array.from({length:81},(_,i)=>{const track=event.lockStart+(event.returnEnd-event.lockStart)*(i+.001)/80.002,p=positionAt(track);return {track,p,c:g.cameraAt(p,{compact}),orbit:g.orbitAt(p,{compact})};});
   const first=rows[0].c;
   for(const row of rows){const c=row.c;if(!row.orbit?.locked||!c.locked||Math.abs(c.orbitWeight-1)>1e-10||Math.abs(c.distance-first.distance)>1e-10||Math.abs(c.pitch-first.pitch)>1e-10||distance(c.target,first.target)>1e-10)failures.push({id:event.id,track:row.track,c});}
   const range=Math.max(...rows.map(r=>r.c.yaw))-Math.min(...rows.map(r=>r.c.yaw));yawRanges.push({id:event.id,range});lockCameras.push(...rows.map(r=>r.c));
   summaries.push({id:event.id,compact,peakCamera:g.cameraAt(positionAt(peak(event)),{compact}),yawRange:range});
  }
  check(label+'-lock-fixes-distance-pivot-and-pitch',failures.length===0,failures.slice(0,3));
  check(label+'-every-window-has-real-azimuth-travel',yawRanges.every(r=>r.range>.35),yawRanges);
  check(label+'-includes-a-side-and-a-rear-view',lockCameras.some(c=>Math.abs(Math.cos(c.yaw))<.2)&&lockCameras.some(c=>Math.cos(c.yaw)<-.2),{rearMostCosine:Math.min(...lockCameras.map(c=>Math.cos(c.yaw)))});
  const outside=positions.filter(p=>!windows.some(e=>g.cameraTrack(p)>e.start&&g.cameraTrack(p)<e.end));
  check(label+'-orbit-releases-outside-authored-windows',outside.every(p=>g.orbitAt(p,{compact})===null&&!g.cameraAt(p,{compact}).locked&&g.cameraAt(p,{compact}).orbitWeight===0));
 }
 const discontinuities=[];let maxJump=0,maxSlopeChange=0,maxCurvatureChange=0;
 for(const compact of [false,true])for(const event of windows)for(const boundary of ['start','lockStart','turnEnd','holdEnd','returnEnd','end']){
  const x=event[boundary],h=1e-4,v=[-2,-1,0,1,2].map(n=>fields(g.cameraAt(positionAt(x+n*h),{compact})));
  const jump=Math.max(...v[1].map((n,i)=>Math.abs(n-v[3][i]))),slope=Math.max(...v[2].map((n,i)=>Math.abs((v[3][i]-n)/h-(n-v[1][i])/h))),curvature=Math.max(...v[2].map((n,i)=>Math.abs((v[4][i]-2*v[3][i]+n)/(h*h)-(n-2*v[1][i]+v[0][i])/(h*h))));
  maxJump=Math.max(maxJump,jump);maxSlopeChange=Math.max(maxSlopeChange,slope);maxCurvatureChange=Math.max(maxCurvatureChange,curvature);
  if(jump>.01||slope>.1||curvature>5)discontinuities.push({id:event.id,compact,boundary,jump,slope,curvature});
 }
 check('orbit-entry-hold-return-and-exit-have-no-cuts-or-velocity-kinks',discontinuities.length===0,{maxJump,maxSlopeChange,maxCurvatureChange,failures:discontinuities});
 const hoverFailures=[];
 for(const event of windows)for(const compact of [false,true]){
  const p=positionAt(peak(event)),normal=g.createProjector(p,720,720,{compact}),moved=g.createProjector(p,720,720,{compact,yaw:.05,pitch:-.05});
  for(const q of [[.7,.2,.4],[-.6,.8,-.3],[.1,-.7,.2]])if(distance(normal(q),moved(q))>1e-9)hoverFailures.push({id:event.id,compact});
 }
 check('locked-projector-suppresses-cursor-parallax',hoverFailures.length===0,hoverFailures);
 const neutral=g.createProjector(0,720,720),free=g.createProjector(0,720,720,{yaw:.05,pitch:-.05});
 check('cursor-parallax-remains-available-outside-orbits',distance(neutral([.7,.2,.4]),free([.7,.2,.4]))>.1);
 const zero=positions.map(p=>g.cameraAt(p,{strength:0}));
 check('zero-camera-strength-remains-static',zero.every(c=>delta(c,zero[0])<1e-10&&c.orbitWeight===0&&!c.locked));

 const clipping=[],nearPlane=[],nonfinite=[],parity=[];let coreSamples=0,dustOverlap=0;
 for(const event of windows)for(let i=0;i<=16;i++){
  const track=event.start+(event.end-event.start)*i/16,position=positionAt(track),model=g.frame(position,2),layers=g.illustration(position),light=g.lightAt(position);
  if(g.orbitAt(position)?.weight>.8&&activeDust(position).length)dustOverlap++;
  for(const {w,h,compact}of [{w:696,h:760,compact:false},{w:720,h:720,compact:false},{w:390,h:286,compact:true},{w:320,h:228,compact:true}]){
   const project=g.createProjector(position,w,h,{compact}),inside=q=>q[0]>=0&&q[0]<=w&&q[1]>=0&&q[1]<=h;
   const points=model.filter(bodyPart).flatMap(l=>l.points.filter((_,j)=>j%8===0)),projected=points.map(project);coreSamples+=points.length;
   for(const q of projected){if(!q.every(Number.isFinite))nonfinite.push({id:event.id,track});if(project.camera.distance-q[2]<.25)nearPlane.push({id:event.id,track});}
   const ratio=projected.filter(inside).length/projected.length;
   if(ratio<.995||!inside(project(light)))clipping.push({type:'body-or-hand',id:event.id,track,w,h,visibleFraction:ratio,light:project(light)});
   for(const layer of layers.filter(l=>l.role==='front-work'&&l.alpha>.5)){const pp=layer.paths.flatMap(item=>item.points).map(project),fraction=pp.filter(inside).length/pp.length;if(fraction<.99)clipping.push({type:'foreground-work',id:event.id,track,w,h,visibleFraction:fraction});for(const q of pp)if(project.camera.distance-q[2]<.25)nearPlane.push({id:event.id,track,role:'work'});}
   const signal=model.find(l=>l.id===0).points[0],trail=g.lightTrail(position,1)[0].point;
   if(distance(project(light),project(signal))>1e-8||distance(project(light),project(trail))>1e-8)parity.push({id:event.id,track,w,h});
  }
 }
 check('orbit-projection-is-finite-and-clear-of-the-near-plane',!nonfinite.length&&!nearPlane.length,{coreSamples,nonfinite:nonfinite.slice(0,5),nearPlane:nearPlane.slice(0,5)});
 check('orbit-keeps-the-actor-hand-and-primary-work-in-frame',clipping.length===0,clipping.slice(0,10));
 check('hand-light-and-trail-share-the-orbit-camera',parity.length===0,parity.slice(0,5));
 check('ambient-dust-coexists-with-locked-orbits',dustOverlap>0,{activeSamples:dustOverlap});
 const late=windows.find(e=>positionAt(peak(e))>6.5&&positionAt(peak(e))<8.2),latePosition=late&&positionAt(peak(late));
 check('disclosure-preserves-front-work-during-an-orbit',!!late&&hash(frontWork(latePosition,0))===hash(frontWork(latePosition,1))&&g.illustration(latePosition,1).some(l=>l.role==='depth-layer'));
 const headOverlaps=[];let checkedNodes=0;
 if(late)for(let i=0;i<=30;i++){
  const track=late.lockStart+(late.returnEnd-late.lockStart)*i/30,position=positionAt(track),head=g.frame(position,2).filter(l=>l.part==='head').flatMap(l=>l.points),nodes=g.illustration(position,1).filter(l=>l.role==='depth-layer').flatMap(l=>l.paths.filter(p=>/-node-\d+$/.test(p.id)));
  for(const {w,h,compact}of [{w:696,h:760,compact:false},{w:390,h:286,compact:true}]){
   const project=g.createProjector(position,w,h,{compact}),projected=head.map(project),xs=projected.map(q=>q[0]),ys=projected.map(q=>q[1]),padding=(Math.max(...ys)-Math.min(...ys))*.06,bounds=[Math.min(...xs)-padding,Math.min(...ys)-padding,Math.max(...xs)+padding,Math.max(...ys)+padding];
   for(const node of nodes){const points=node.points.map(project),center=[0,1].map(axis=>points.reduce((sum,q)=>sum+q[axis],0)/points.length);checkedNodes++;if(center[0]>=bounds[0]&&center[0]<=bounds[2]&&center[1]>=bounds[1]&&center[1]<=bounds[3])headOverlaps.push({track,compact,id:node.id,center,bounds});}
  }
 }
 check('revealed-network-nodes-clear-the-faceless-head-through-the-lock',checkedNodes>0&&headOverlaps.length===0,{checkedNodes,padding:'6% of projected head height',overlaps:headOverlaps.slice(0,8)});

 if(process.env.SKIP_BROWSER!=='1'){
  const {chromium}=require('playwright'),browser=await chromium.launch(),pending=[];
  try{
   for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
    const compact=viewport.width<768,label=compact?'mobile':'desktop',page=await browser.newPage({viewport});
    page.on('pageerror',e=>errors.push({viewport:label,message:e.message}));page.on('response',r=>{if(r.request().resourceType()==='script'&&r.url().includes('/assets/profile/'))pending.push(r.body().then(body=>browserSources.push({viewport:label,url:r.url(),sha256:hash(body.toString())})));});
    await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await page.waitForFunction(()=>window.ProfileExperience&&window.ProfileGeometry?.orbitAt);await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>{const original=ProfileGeometry.createProjector;window.__orbitProjectionOriginal=original;ProfileGeometry.createProjector=(...args)=>{const project=original(...args);window.__orbitProbe={points:[[.7,.2,.4],[-.6,.8,-.3]].map(project),camera:project.camera};return project;};});
    async function go(position){await page.evaluate(position=>{const a=ProfileExperience.snapshot().anchors,c=Math.floor(position),m=ProfileGeometry.config.morph;scrollTo({top:Number.isInteger(position)?a[c]:a[c]+(a[c+1]-a[c])*(m.start+(m.end-m.start)*(position-c)),behavior:'instant'});},position);await page.waitForFunction(position=>Math.abs(ProfileExperience.snapshot().target-position)<.006&&Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001,position);await page.waitForTimeout(800);return page.evaluate(()=>({...ProfileExperience.snapshot(),probe:window.__orbitProbe}));}
    const peaks=[];
    for(const event of windows){const state=await go(positionAt(peak(event)));peaks.push(state);browserStates.push({viewport:label,id:event.id,...state});await page.screenshot({path:path.join(out,`${label}-${event.id}.png`)});}
    const rearIndex=windows.findIndex(e=>Math.cos(compact?e.compactYaw:e.yaw)<-.2),rear=windows[rearIndex],p=positionAt(peak(rear));
    const before=await go(p);await page.mouse.move(20,150);await page.waitForTimeout(600);const left=await page.evaluate(()=>window.__orbitProbe);await page.mouse.move(viewport.width-20,viewport.height-20);await page.waitForTimeout(600);const right=await page.evaluate(()=>window.__orbitProbe);
    check(label+'-live-pointer-cannot-shift-a-locked-orbit',left.points.every((q,i)=>distance(q,right.points[i])<1e-7)&&before.camera.locked);
    await go(positionAt(windows[0].start-.1));const again=await go(p);
    check(label+'-native-scroll-jump-and-return-restores-the-camera',delta(before.camera,again.camera)<.001&&again.camera.locked);
    check(label+'-live-orbit-reaches-the-rear-hemisphere',Math.cos(again.camera.yaw)<-.2);
    const traversal=[];
    await go(positionAt(rear.start-.02));
    for(const direction of ['forward','reverse']){
     const samples=await page.evaluate(async({start,end,direction})=>{
      const g=ProfileGeometry,a=ProfileExperience.snapshot().anchors,started=performance.now(),rows=[];let last=-Infinity;
      const yAt=track=>{let lo=0,hi=g.config.scenes.length-1;for(let n=0;n<45;n++){const p=(lo+hi)/2;if(g.cameraTrack(p)<track)lo=p;else hi=p;}const p=(lo+hi)/2,c=Math.floor(p),m=g.config.morph;return a[c]+(a[c+1]-a[c])*(m.start+(m.end-m.start)*(p-c));};
      await new Promise(done=>{function tick(now){const t=Math.min(1,(now-started)/2200),u=direction==='forward'?t:1-t;scrollTo({top:yAt(start+(end-start)*u),behavior:'instant'});if(now-last>90||t===1){const s=ProfileExperience.snapshot();rows.push({current:s.current,track:g.cameraTrack(s.current),camera:s.camera});last=now;}if(t===1)done();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});return rows;
     },{start:rear.start-.02,end:rear.end+.02,direction});
     await go(positionAt(direction==='forward'?rear.end+.02:rear.start-.02));traversal.push({direction,samples});
    }
    const lockedSamples=traversal.flatMap(s=>s.samples).filter(s=>s.camera?.locked),firstLock=lockedSamples[0]?.camera;
    check(label+'-native-forward-reverse-keeps-orbit-lock',lockedSamples.length>4&&lockedSamples.every(s=>Math.abs(s.camera.distance-firstLock.distance)<1e-9&&Math.abs(s.camera.pitch-firstLock.pitch)<1e-9&&distance(s.camera.target,firstLock.target)<1e-9),{samples:lockedSamples.length});
    browserStates.push({viewport:label,id:rear.id,traversal});
    // Native details element toggle exercises real layout handling without a
    // locator click scrolling the off-screen mobile control to a different beat.
    const closed=await go(latePosition);const workHash=await page.evaluate(()=>JSON.stringify(ProfileGeometry.illustration(ProfileExperience.snapshot().current,0).filter(l=>l.role==='front-work')));
    await page.locator('#beneath').evaluate(el=>{el.open=true;});await page.waitForFunction(()=>ProfileExperience.snapshot().exploded>.999);await page.waitForTimeout(150);
    const opened=await page.evaluate(()=>({...ProfileExperience.snapshot(),depthLayers:ProfileGeometry.illustration(ProfileExperience.snapshot().current,1).filter(l=>l.role==='depth-layer').length,work:JSON.stringify(ProfileGeometry.illustration(ProfileExperience.snapshot().current,1).filter(l=>l.role==='front-work'))}));
    check(label+'-native-disclosure-preserves-orbit-and-front-work',Math.abs(opened.current-closed.current)<1e-4&&delta(opened.camera,closed.camera)<1e-4&&opened.work===workHash&&opened.depthLayers>0,{positions:[closed.current,opened.current],cameraDelta:delta(opened.camera,closed.camera),depthLayers:opened.depthLayers});
    await page.screenshot({path:path.join(out,`${label}-experience-depth-open.png`)});
    await page.locator('#beneath').evaluate(el=>{el.open=false;});await page.waitForFunction(()=>ProfileExperience.snapshot().exploded<.001);
    await page.emulateMedia({reducedMotion:'reduce'});const draws=await page.evaluate(()=>ProfileExperience.snapshot().draws);await page.evaluate(()=>document.querySelector('#craft').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(250);
    check(label+'-owner-full-motion-retains-live-orbits',await page.locator('.stage').isVisible()&&await page.evaluate(draws=>ProfileExperience.snapshot().mode==='full'&&ProfileExperience.snapshot().draws>draws,draws));
    check(label+'-no-motion-selector',await page.locator('#motion,.motion-control').count()===0);
    await page.close();
   }
   await Promise.all(pending);check('browser-source-matches-tested-geometry',browserSources.filter(s=>s.url.includes('/geometry.js')).every(s=>s.sha256===hash(fs.readFileSync(source,'utf8'))));check('orbit-browser-errors',errors.length===0,errors);
  }finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,sourceHash:hash(fs.readFileSync(source,'utf8')),windows,summaries,checks,browserSources,browserStates,errors,notes:['Camera phases use the public linear cameraTrack API, independently inverted.','Background surroundings may deliberately extend beyond the stage; clipping checks cover actor, hand light, and primary work.','Browser evidence is headless Chromium, not a physical-device frame-rate measurement.']},null,2));
 const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out},null,2));if(failed.length||errors.length)process.exitCode=1;
})().catch(error=>{fs.writeFileSync(path.join(out,'error.json'),JSON.stringify({checks,error:error.stack},null,2));console.error(error);process.exitCode=1;});
