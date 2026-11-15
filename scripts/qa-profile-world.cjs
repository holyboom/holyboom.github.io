/* Authored scenic density, reversibility and focus protection in the real painter. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{createRequire}=require('node:module');
const source=path.resolve(__dirname,'../assets/profile/geometry.js'),g=require(source),out=process.env.WORLD_QA_DIR||'docs/evidence/dramatic-world/validation';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),world=p=>g.illustration(p).find(l=>l.id==='story-world');
const inverse=t=>{let a=0,b=10;for(let n=0;n<50;n++){const m=(a+b)/2;g.resolve(m)<t?a=m:b=m;}return(a+b)/2;};
(async()=>{
 const positions=Array.from({length:161},(_,i)=>i/16),forward=positions.map(p=>hash(world(p)));
 check('all-eleven-chapters-have-distinct-authored-sets',new Set(g.config.environments.map(e=>e.name)).size===11&&new Set(g.config.environments.map(e=>e.objects.join(','))).size===11);
 check('world-retraces-without-history',[...positions.keys()].reverse().every(i=>hash(world(positions[i]))===forward[i]));
 let finite=true,backdrop=true,budget=true,protectedInk=0,protectedSamples=0,nearPlane=0;
 for(const p of positions){const w=world(p);budget&&=w.paths.length<=120&&w.paths.filter(x=>!x.secondary).length<=75;backdrop&&=w.role==='surroundings'&&w.paths.every(x=>!x.fill);
  for(const item of w.paths)for(const q of item.points)finite&&=q.length===3&&q.every(Number.isFinite)&&q.every(v=>Math.abs(v)<5);
  for(const compact of [false,true]){const project=g.createProjector(p,720,720,{compact}),focus=g.sceneryFocus(w,project);
   for(const item of w.paths){const points=item.points.map(project),opacity=g.sceneryOpacity(points,focus);if(!Number.isFinite(opacity)||opacity<0||opacity>1)finite=false;
    if(points.some(q=>project.camera.distance-q[2]<=.25))nearPlane++;
    if(points.some(q=>Math.hypot(q[0]-focus[0].x,q[1]-focus[0].y)<focus[0].radius)){protectedSamples++;if(opacity>.000001)protectedInk++;}
   }
  }
 }
 check('finite-bounded-world-geometry',finite);check('bounded-desktop-and-mobile-budget',budget);check('scenic-world-is-a-nonopaque-backdrop',backdrop);check('head-negative-space-suppresses-scenic-ink',protectedSamples>0&&protectedInk===0,{protectedSamples,protectedInk});check('no-scenic-eye-plane-crossings',nearPlane===0,{nearPlane});
 const baselinePath=process.env.WORLD_BASELINE;
 if(baselinePath){const module={exports:{}};vm.runInNewContext(fs.readFileSync(baselinePath,'utf8'),{module,exports:module.exports,require:createRequire(source)});const before=module.exports;
  check('existing-performance-and-features-are-unchanged',positions.every(p=>hash(g.frame(p,2))===hash(before.frame(p,2))&&hash(g.illustration(p,1).filter(l=>l.id!=='story-world'))===hash(before.illustration(p,1))&&hash(g.cameraAt(p))===hash(before.cameraAt(p))));
 }
 if(process.env.SKIP_BROWSER!=='1'){
  const {chromium}=require('playwright'),browser=await chromium.launch();try{
   for(const width of [1440,390]){const page=await browser.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await page.waitForFunction(()=>window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
    for(const timeline of (process.env.WORLD_TEST_TIMELINES||'2,13,14,20,23,30').split(',').map(Number)){const target=timeline===30?10:inverse(timeline);await page.evaluate(target=>{const a=ProfileExperience.snapshot().anchors,c=Math.floor(target),f=ProfileGeometry.config.morph;scrollTo({top:c>=10?a[10]:a[c]+(a[c+1]-a[c])*(f.start+(f.end-f.start)*(target-c)),behavior:'instant'});},target);await page.waitForFunction(()=>ProfileExperience.snapshot().current===ProfileExperience.snapshot().target);await page.waitForTimeout(850);for(let warm=0;warm<5;warm++){await page.evaluate(()=>document.dispatchEvent(new Event('pointerleave')));await page.waitForTimeout(90);}
     const original=await page.evaluate(()=>{const canvas=document.querySelector('#architecture'),g=ProfileGeometry,p=ProfileExperience.snapshot().current,pose=g.performanceAt(p),project=g.createProjector(p,canvas.width,canvas.height,{compact:innerWidth<768}),q=project(pose.head),r=.20*project.scale/(project.camera.distance-q[2]),ctx=canvas.getContext('2d'),x=Math.max(0,Math.floor(q[0]-r)),y=Math.max(0,Math.floor(q[1]-r)),size=Math.max(1,Math.ceil(r*2));return {x,y,size,state:ProfileExperience.snapshot(),pixels:[...ctx.getImageData(x,y,size,size).data]};});
     await page.evaluate(()=>{window.worldOriginal=ProfileGeometry.illustration;ProfileGeometry.illustration=(...args)=>window.worldOriginal(...args).filter(l=>l.id!=='story-world');document.dispatchEvent(new Event('pointerleave'));});await page.waitForTimeout(200);
     const delta=await page.evaluate(original=>{const ctx=document.querySelector('#architecture').getContext('2d'),pixels=ctx.getImageData(original.x,original.y,original.size,original.size).data;let max=0,changed=0;for(let i=0;i<pixels.length;i++){const d=Math.abs(pixels[i]-original.pixels[i]);max=Math.max(max,d);if(d>2)changed++;}return {max,changed,before:{current:original.state.current,detail:original.state.detail},after:{current:ProfileExperience.snapshot().current,detail:ProfileExperience.snapshot().detail}};},original);
     if(delta.max>2){const crops=await page.evaluate(original=>{const c=document.createElement('canvas');c.width=c.height=original.size;const ctx=c.getContext('2d');ctx.putImageData(new ImageData(new Uint8ClampedArray(original.pixels),original.size,original.size),0,0);const before=c.toDataURL();ctx.putImageData(document.querySelector('#architecture').getContext('2d').getImageData(original.x,original.y,original.size,original.size),0,0);return {before,after:c.toDataURL()};},original);for(const [name,data]of Object.entries(crops))fs.writeFileSync(path.join(out,'head-'+width+'-'+timeline+'-'+name+'.png'),Buffer.from(data.split(',')[1],'base64'));}
     check('painted-head-remains-clear-'+width+'-'+timeline,delta.max<=2,delta);
     await page.evaluate(()=>{ProfileGeometry.illustration=window.worldOriginal;delete window.worldOriginal;document.dispatchEvent(new Event('pointerleave'));});await page.waitForTimeout(200);
    }await page.close();
   }
  }finally{await browser.close();}
  check('no-browser-errors',errors.length===0,errors);
 }
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,checks,errors,sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')},null,2));console.log(JSON.stringify({checks:checks.length,failed,out},null,2));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
