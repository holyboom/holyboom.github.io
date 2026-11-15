/* Terrain and owner Full-motion contracts against geometry and native input. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),g=require('../assets/profile/geometry.js'),floors=require('../assets/profile/floors.js');
const out=process.env.FLOOR_QA_DIR||'docs/evidence/story-worlds/validation';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));},hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
(async()=>{
 const recipes=g.config.floors,worlds=recipes.map((_,i)=>floors.scene(i));
 check('four-selected-families-cover-all-31-scenes',recipes.length===g.sequence.length&&recipes.length===31&&new Set(recipes.map(r=>r.family)).size===4);
 check('every-scene-has-its-own-ground-geometry',new Set(worlds.map(w=>hash(w.lines.map(l=>l.points)))).size===31&&new Set(recipes.map(r=>r.name)).size===31);
 check('all-worlds-keep-the-same-100-strands-and-48-samples',worlds.every(w=>w.lines.length===100&&w.lines.every((l,i)=>l.id===i&&l.points.length===48)));
 const positions=Array.from({length:161},(_,i)=>i/16),forward=positions.map(p=>hash(g.frame(p,2).filter(l=>l.floor))),rewind=[...positions].reverse().map(p=>hash(g.frame(p,2).filter(l=>l.floor))).reverse();
 check('all-floors-retrace-in-both-scroll-directions',JSON.stringify(forward)===JSON.stringify(rewind));
 const finite=[],missing=[],supports=[];
 for(const p of positions){const full=g.frame(p,1),compact=g.frame(p,2),ground=full.filter(l=>l.floor),pose=g.performanceAt(p);
  if(full.length!==777||ground.length!==100||compact.filter(l=>l.floor).length!==100||ground.some(l=>!compact.some(c=>c.id===l.id&&hash(c.points)===hash(l.points))))missing.push(p);
  for(const l of ground)for(const q of l.points)if(!q.every(Number.isFinite)||Math.abs(q[0])>3||q[1]<-2.3||q[1]>-.7||Math.abs(q[2])>2)finite.push(p);
  if(p>=1)for(const foot of pose.feet){const near=ground.flatMap(l=>l.points).filter(q=>Math.hypot(q[0]-foot[0],q[2]-foot[2]-.07)<.13);if(!near.length||Math.min(...near.map(q=>Math.abs(q[1]-pose.support.floorY)))>.025)supports.push({p,foot});}
 }
 check('terrain-remains-finite-and-below-the-actor',finite.length===0,finite.slice(0,4));check('all-777-ids-and-entire-floor-survive-mobile-detail',missing.length===0,missing);check('rendered-ground-remains-beneath-the-foot-supports',supports.length===0,supports.slice(0,4));
 // Filled relief follows the same deterministic support transform as the grid.
 const plates=positions.map(p=>hash(g.illustration(p).filter(l=>l.id?.startsWith('terrain-'))));check('relief-plates-retrace-with-the-network',positions.every((p,i)=>hash(g.illustration(p).filter(l=>l.id?.startsWith('terrain-')))===plates[i]));
 if(process.env.SKIP_BROWSER!=='1'){
  const {chromium}=require('playwright'),b=await chromium.launch();try{
   for(const reducedMotion of ['reduce','no-preference']){
    const context=await b.newContext({viewport:{width:390,height:844},reducedMotion});await context.addInitScript(()=>localStorage.setItem('holyboom.profile.motion.v1','reduced'));const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await page.waitForFunction(()=>window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
    check('full-policy-ignores-old-storage-and-os-'+reducedMotion,await page.evaluate(()=>ProfileExperience.snapshot().mode==='full'&&!ProfileExperience.snapshot().reduced&&document.documentElement.dataset.profileMotion==='full')&&await page.locator('#motion,.motion-control').count()===0);
    const start=await page.evaluate(()=>ProfileExperience.snapshot().draws);await page.locator('#conviction').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForFunction(n=>ProfileExperience.snapshot().draws>n&&Math.abs(ProfileExperience.snapshot().target-5)<.05,start);check('native-scroll-still-renders-'+reducedMotion,await page.locator('#architecture').isVisible());
    for(const [width,height]of [[844,390],[390,600],[640,480]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);check('full-renderer-remains-active-'+reducedMotion+'-'+width+'x'+height,await page.locator('#architecture').isVisible()&&await page.evaluate(()=>ProfileExperience.snapshot().mode==='full'&&document.documentElement.scrollWidth<=innerWidth));}
    await page.close();await context.close();
   }
   const p=await b.newPage({viewport:{width:1440,height:1000}});await p.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await p.waitForFunction(()=>window.ProfileExperience);await p.evaluate(()=>document.fonts.ready);await p.evaluate(()=>document.querySelector('#origins').scrollIntoView({behavior:'instant'}));await p.waitForFunction(()=>{const s=ProfileExperience.snapshot();return Math.abs(s.target-1)<.05&&s.current===s.target&&s.trailEnergy<.01&&!s.dirty;});const before=await p.evaluate(()=>ProfileExperience.snapshot());await p.waitForTimeout(200);const after=await p.evaluate(()=>ProfileExperience.snapshot());check('full-mode-does-not-run-an-idle-render-loop',after.draws===before.draws,{before:{draws:before.draws,target:before.target},after:{draws:after.draws,target:after.target}});await p.close();
  }finally{await b.close();}check('no-browser-errors',errors.length===0,errors);
 }
 const report={release:g.config.release,recipes,checks,errors,notes:['Full motion is the explicit owner policy; automatic OS reduced-motion switching is intentionally absent.','Static no-JS, failed-runtime and print fallbacks remain.','Browser viewport emulation is not a physical-device performance claim.']};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
