/* Runtime lifecycle and retained-heap review. Headless Chromium diagnostics;
   hidden-document handling is simulated, because headless tabs stay visible. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:4173/';
const out=path.resolve(process.env.RUNTIME_QA_DIR||'docs/evidence/faceless-performance/round-3-runtime-review');
fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],sources={},heap=[],unavailableChecks=[];
const check=(name,pass,data)=>{checks.push({name,pass:Boolean(pass),data});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
(async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}});
 const pending=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{const url=response.url();if(/\/assets\/profile\/.*\.js\?/.test(url))pending.push(response.body().then(body=>{sources[new URL(url).pathname]=crypto.createHash('sha256').update(body).digest('hex');}));});
 try{
  await page.goto(base+'profile/');await page.waitForFunction(()=>window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  const snap=()=>page.evaluate(()=>ProfileExperience.snapshot());
  async function go(position){
   await page.evaluate(position=>{scrollTo({top:ProfileExperience.scrollForPosition(position),behavior:'instant'});},position);
   await page.waitForFunction(position=>Math.abs(ProfileExperience.snapshot().target-position)<.007&&Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001,position);
  }
  async function memory(label){
   await cdp.send('HeapProfiler.collectGarbage');
   const data=await cdp.send('Runtime.getHeapUsage'),dom=await cdp.send('Memory.getDOMCounters');
   heap.push({label,usedBytes:data.usedSize,totalBytes:data.totalSize,embedderBytes:data.embedderHeapUsedSize,backingStorageBytes:data.backingStorageSize,...dom});
  }
  await page.waitForTimeout(120);await memory('initial');
  for(const [label,position]of [['typing',1.50],['reflection',5.55],['contact',10]]){
   await go(position);await page.waitForFunction(()=>{const s=ProfileExperience.snapshot();return s.current===s.target&&!s.dirty&&s.trailEnergy===0;});const a=await snap();await page.waitForTimeout(350);const b=await snap();
   check(label+'-render-loop-settles',a.draws===b.draws&&b.trailEnergy===0,{draws:[a.draws,b.draws],trailEnergy:b.trailEnergy});
  }
  // A visibilitychange drives the real handler, without claiming a real hidden
  // OS tab: headless Chromium reports both tabs visible even after activation.
  await go(3.25);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  const hiddenStart=await snap();await page.waitForTimeout(350);const hiddenEnd=await snap();
  check('simulated-hidden-document-stops-and-clears',hiddenEnd.draws===hiddenStart.draws&&hiddenEnd.trailEnergy===0,{draws:[hiddenStart.draws,hiddenEnd.draws],trailEnergy:hiddenEnd.trailEnergy});
  await page.evaluate(()=>{delete document.hidden;delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});await go(3.4);const resumed=await snap();
  check('visibility-restore-renders-current-position',resumed.draws>hiddenEnd.draws&&Math.abs(resumed.current-resumed.target)<.0001,{current:resumed.current,target:resumed.target});
  // Probe real browser freezing during active rendering. Some headless builds
  // accept this command but never transition a visible tab into frozen state.
  await page.evaluate(()=>{const events=[],freeze=()=>events.push('freeze'),resume=()=>events.push('resume');window.__profileLifecycleProbe={events,freeze,resume};document.addEventListener('freeze',freeze);document.addEventListener('resume',resume);});
  await page.evaluate(()=>scrollBy({top:80,behavior:'instant'}));await page.waitForFunction(()=>ProfileExperience.snapshot().trailEnergy>.01);
  const frozenStart=await snap();await cdp.send('Page.setWebLifecycleState',{state:'frozen'});await page.waitForTimeout(850);await cdp.send('Page.setWebLifecycleState',{state:'active'});const frozenEnd=await snap();
  const lifecycleEvents=await page.evaluate(()=>{const p=window.__profileLifecycleProbe;document.removeEventListener('freeze',p.freeze);document.removeEventListener('resume',p.resume);delete window.__profileLifecycleProbe;return p.events;});
  if(lifecycleEvents.includes('freeze'))check('active-browser-freeze-does-not-accumulate-draws',frozenStart.trailEnergy>.01&&frozenEnd.draws-frozenStart.draws<=2,{draws:[frozenStart.draws,frozenEnd.draws],initialTrailEnergy:frozenStart.trailEnergy,lifecycleEvents});
  else unavailableChecks.push({name:'active-browser-freeze',reason:'This headless Chromium accepts the CDP command but does not freeze a visible tab; no freeze event was emitted.',lifecycleEvents});
  // Reversal must begin a new trail, rather than retaining the outgoing span.
  const reversal=await page.evaluate(async()=>{
   const samples=[],start=scrollY,end=start+160;
   const tick=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   for(let i=0;i<8;i++){scrollTo({top:start+(end-start)*i/7,behavior:'instant'});await tick();samples.push(ProfileExperience.snapshot());}
   for(let i=0;i<8;i++){scrollTo({top:end-(end-start)*i/7,behavior:'instant'});await tick();samples.push(ProfileExperience.snapshot());}
   const transitions=samples.slice(1).map((s,i)=>({previous:samples[i],next:s})).filter(pair=>pair.previous.trailDirection!==pair.next.trailDirection);
   return {changes:transitions.length,largestSpan:Math.max(0,...transitions.map(pair=>pair.next.trailSpan)),maximumAllowed:Math.max(0,...transitions.map(pair=>Math.abs(pair.next.current-pair.previous.current)))};
  });
  check('reversal-starts-a-fresh-trail-span',reversal.changes>0&&reversal.largestSpan<=reversal.maximumAllowed+1e-7,reversal);
  // Exercise real scroll/render paths through every key pose, then measure
  // retained JS heap after GC. This is not total process or GPU memory.
  const positions=await page.evaluate(()=>ProfileGeometry.sequence.map(s=>s.step===0?s.chapter:s.chapter+(s.step+.05)/s.count));
  for(let pass=0;pass<3;pass++){
   for(const position of pass%2?[...positions].reverse():positions)await go(position);
   await page.waitForTimeout(1000);await memory('full-traversal-'+(pass+1));console.log('Runtime traversal '+(pass+1)+' complete');
  }
  const growth=heap.at(-1).usedBytes-heap[1].usedBytes,nodeGrowth=heap.at(-1).nodes-heap[1].nodes,listenerGrowth=heap.at(-1).jsEventListeners-heap[1].jsEventListeners;
  check('retained-heap-stabilizes-after-warm-traversal',growth<2*1024*1024,{growthBytes:growth,thresholdBytes:2*1024*1024});
  check('dom-and-listeners-do-not-accumulate',nodeGrowth<=2&&listenerGrowth===0,{nodeGrowth,listenerGrowth});
  check('no-browser-errors',errors.length===0,errors);await Promise.all(pending);
  const result={capturedAt:new Date().toISOString(),base,environment:'Headless Chromium, desktop1440x1000, unthrottled. Forced-GC retained JS heap; not process/GPU/physical-device memory.',visibilityLimit:'Headless tabs remain visible; hidden-document branch uses temporary document property overrides. Unsupported lifecycle transitions are recorded separately, never counted as passes.',sources,checks,unavailableChecks,heap,errors};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:checks.length,failures:checks.filter(c=>!c.pass).length,unavailableChecks,heap,out},null,2));
  if(checks.some(c=>!c.pass))process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
