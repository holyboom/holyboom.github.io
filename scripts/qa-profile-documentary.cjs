/* Camera framing contracts: deliberate close-ups retain their subject, not all feet. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module'),g=require('../assets/profile/geometry.js');
const out=process.env.DOCUMENTARY_QA_DIR||'docs/evidence/documentary-camera/validation';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const position=t=>{let a=0,b=10;for(let n=0;n<52;n++){const m=(a+b)/2;g.cameraTrack(m)<t?a=m:b=m;}return(a+b)/2;},distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const fields=c=>[c.yaw,c.pitch,c.distance,c.focal,...c.target];
(async()=>{
 const events=g.config.camera.inserts,order=events.every((e,i)=>e.start<e.arrive&&e.arrive<e.holdEnd&&e.holdEnd<e.end&&(!i||events[i-1].end<e.start));
 check('inserts-have-approach-hold-and-release',order&&events.length>=5);check('inserts-do-not-disrupt-locked-orbits',events.every(e=>g.config.camera.orbits.every(o=>e.end<=o.start||e.start>=o.end)));
 const samples=Array.from({length:601},(_,i)=>i/60),forward=samples.map(p=>JSON.stringify(g.cameraAt(p)));
 check('all-camera-sampling-retraces',samples.every((_,i)=>JSON.stringify(g.cameraAt(samples[samples.length-1-i]))===forward[samples.length-1-i]));
 const cuts=[];for(const e of events)for(const key of ['start','arrive','holdEnd','end'])for(const compact of [false,true]){const t=e[key],a=fields(g.cameraAt(position(t-1e-5),{compact})),b=fields(g.cameraAt(position(t+1e-5),{compact}));if(Math.max(...a.map((v,i)=>Math.abs(v-b[i])))>.002)cuts.push({id:e.id,key,compact});}
 check('no-cuts-at-insert-boundaries',cuts.length===0,cuts);
 const clip=[],near=[],magnifications=[],pointer=[];
 for(const e of events)for(const compact of [false,true]){
  const p=position((e.arrive+e.holdEnd)/2),pose=g.performanceAt(p),w=compact?390:720,h=compact?286:720,project=g.createProjector(p,w,h,{compact}),focus=g.focusAt(p,{compact}),inside=q=>q[0]>4&&q[0]<w-4&&q[1]>4&&q[1]<h-4;
  const core=e.framing==='head'?g.frame(p,2).filter(l=>l.part==='head').flatMap(l=>l.points):e.framing==='work'?g.illustration(p).filter(l=>l.role==='front-work'&&l.alpha>.5).flatMap(l=>l.paths.flatMap(item=>item.points)):[focus.point,pose.handR,...(e.subject==='drawing'?[pose.tool.tip,pose.tool.shaftEnd]:[])];
  const projected=core.map(project);if(projected.some(q=>!inside(q)))clip.push({id:e.id,compact,framing:e.framing,visible:projected.filter(inside).length/projected.length});
  for(const q of [...g.frame(p,2).flatMap(l=>l.points),...g.illustration(p).flatMap(l=>l.paths.flatMap(item=>item.points))].map(project))if(!q.every(Number.isFinite)||project.camera.distance-q[2]<.25)near.push({id:e.id,compact});
  const rayScale=project.scale/(project.camera.distance-project(focus.point)[2]);g.config.camera.inserts=[];const wide=g.createProjector(p,w,h,{compact});g.config.camera.inserts=events;
  magnifications.push({id:e.id,compact,magnification:rayScale/(wide.scale/(wide.camera.distance-wide(focus.point)[2]))});
  const hover=g.createProjector(p,w,h,{compact,yaw:.05,pitch:-.05});if(distance(project(focus.point),hover(focus.point))>1e-8)pointer.push({id:e.id,compact});
 }
 check('the-focused-head-hand-or-work-remains-visible',clip.length===0,clip);check('closeups-have-no-nonfinite-or-eye-plane-crossings',near.length===0,near.slice(0,5));
 check('inserts-enlarge-the-subject-materially',magnifications.every(v=>v.magnification>1.4),magnifications);check('pointer-cannot-jostle-a-held-closeup',pointer.length===0,pointer);
 const disclosure=[];for(const e of events){const p=position((e.arrive+e.holdEnd)/2);if(p<6.7||p>8)continue;const closed=g.cameraAt(p),open=g.cameraAt(p,{expanded:1});if(open.focusWeight!==0||open.distance<=closed.distance)disclosure.push(e.id);}
 check('opening-system-layers-reestablishes-the-wide-context',disclosure.length===0&&events.some(e=>position(e.arrive)>6.7&&position(e.arrive)<8),disclosure);
 const rear=g.config.camera.orbits.find(o=>o.id==='conviction-rear');check('rear-shot-reaches-behind-the-maker-on-both-viewports',Math.cos(rear.yaw)<-.90&&Math.cos(rear.compactYaw)<-.85);
 if(process.env.DOCUMENTARY_BASELINE){const m={exports:{}};vm.runInNewContext(fs.readFileSync(process.env.DOCUMENTARY_BASELINE,'utf8'),{module:m,exports:m.exports,require:createRequire(path.resolve('assets/profile/geometry.js'))});const old=m.exports,positions=Array.from({length:81},(_,i)=>i/8);check('actor-world-dust-and-light-are-unchanged',positions.every(p=>JSON.stringify(g.frame(p,2))===JSON.stringify(old.frame(p,2))&&JSON.stringify(g.illustration(p,1))===JSON.stringify(old.illustration(p,1))&&JSON.stringify(g.lightTrail(p))===JSON.stringify(old.lightTrail(p))));}
 if(process.env.SKIP_BROWSER!=='1'){
  const {chromium}=require('playwright'),b=await chromium.launch();try{for(const width of [1440,390]){const page=await b.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await page.waitForFunction(()=>window.ProfileGeometry?.focusAt&&window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
   for(const e of events){const p=position((e.arrive+e.holdEnd)/2);await page.evaluate(p=>{const a=ProfileExperience.snapshot().anchors,c=Math.floor(p),f=ProfileGeometry.config.morph;scrollTo({top:a[c]+(a[c+1]-a[c])*(f.start+(f.end-f.start)*(p-c)),behavior:'instant'});},p);await page.waitForFunction(p=>Math.abs(ProfileExperience.snapshot().current-p)<.001&&ProfileExperience.snapshot().current===ProfileExperience.snapshot().target,p);await page.waitForTimeout(300);const state=await page.evaluate(()=>{const s=ProfileExperience.snapshot(),r=document.querySelector('#architecture').getBoundingClientRect();return {camera:s.camera,visible:r.bottom>0&&r.top<innerHeight};});check('live-closeup-'+width+'-'+e.id,state.visible&&state.camera.focusId===e.id&&state.camera.focusWeight>.99);await page.screenshot({path:path.join(out,width+'-'+e.id+'.png')});}
   await page.emulateMedia({reducedMotion:'reduce'});const count=await page.evaluate(()=>ProfileExperience.snapshot().draws);await page.evaluate(()=>document.querySelector('#conviction').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(250);check('owner-full-motion-keeps-camera-active-'+width,await page.locator('.stage').isVisible()&&await page.evaluate(n=>ProfileExperience.snapshot().mode==='full'&&ProfileExperience.snapshot().draws>n,count)&&await page.locator('#motion').count()===0);await page.close();
  }}finally{await b.close();}check('no-browser-errors',errors.length===0,errors);
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,checks,errors},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out},null,2));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
