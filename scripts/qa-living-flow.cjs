/* Evidence must be observable in rendered state; no live AI or approval is implied. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8788/',out=process.env.QA_DIR||'qa-output/living-flow-'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[],writes=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const b=await(engine==='webkit'?webkit.launch():chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));
 try{
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push({method:r.method(),url:r.url()});});
  await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindWorkflowProof&&HolyMindSkills.list().length===34&&HolyMindBoomAudio.snapshot().ready);
  const state=()=>p.evaluate(()=>HolyMindJourney.snapshot()),proof=()=>p.evaluate(()=>HolyMindWorkflowProof.snapshot());
  check('release-v25',await p.locator('html').getAttribute('data-build')==='living-flow-v25');
  check('generic-load-no-choice-or-audio',!(await state()).active&&await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
  check('initial-label-is-illustrative',(await p.locator('.demo-topline').innerText()).includes('no AI request'));
  const scenes=[['operations','REQ-02'],['knowledge','SRC-X'],['venture','CLAIM-X']];
  for(const [id,excluded] of scenes){
   await p.locator('[data-challenge='+id+']').click();
   for(let step=0;step<4;step++){
    await p.locator('[data-step="'+step+'"]').click();await p.locator('#intent-demonstration').scrollIntoViewIfNeeded();await p.waitForTimeout(1100);
    const v=await proof();check('scenario-stage-'+id+'-'+step,v.scene===id&&v.step===step&&!v.animating&&v.packetState.every(p=>!p.held||!p.entersOutput)&&!v.approvalGranted);
   }
   await p.locator('[data-evidence-source="2"]').click();await p.waitForTimeout(300);let v=await proof();
   check('blocked-source-'+id,v.source===2&&v.excludedId===excluded&&!v.outputSources.includes(excluded)&&await p.locator('#proof-inspector').getAttribute('data-excluded')==='true');
   check('no-approval-or-success-claim-'+id,(await p.locator('#proof-exclusion').innerText()).includes(excluded)&&!(await proof()).approvalGranted);
   await p.locator('[data-proof-claim="0"]').click();let a=await proof();
   check('claim-traces-to-source-'+id,a.source===0&&(await p.locator('#proof-source-name').innerText()).includes(a.outputSources[0])&&await p.locator('[data-doc="0"]').getAttribute('data-proof-active')==='true');
   await p.locator('[data-evidence-source="1"]').focus();await p.keyboard.press('Enter');
   check('keyboard-source-'+id,(await proof()).source===1&&(await p.locator('#proof-excerpt').innerText()).length>30);
   await p.locator('#demo-evidence>summary').click();
  }
  await p.locator('[data-challenge=knowledge]').click();await p.locator('[data-step="2"]').click();await p.locator('#intent-demonstration').scrollIntoViewIfNeeded();await p.waitForTimeout(1450);
  // Actual rendered packet motion through an already visible demonstration.
  await p.locator('[data-step="1"]').click();const sampled=[];
  for(let i=0;i<5;i++){await p.waitForTimeout(90);sampled.push(await proof());}
  check('finite-visible-packet-transfer',sampled.some(s=>s.animating&&s.packetState.some(p=>p.visible))&&new Set(sampled.flatMap(s=>s.packetState.filter(p=>p.visible).map(p=>p.x.toFixed(2)+','+p.y.toFixed(2)))).size>3,{visibleFrames:sampled.filter(s=>s.packetState.some(p=>p.visible)).length});
  await p.waitForTimeout(1200);const paints=(await proof()).paintCount;await p.waitForTimeout(600);
  check('no-idle-js-paint-loop',!(await proof()).animating&&(await proof()).paintCount===paints);
  for(const n of [3,0,2,1,3]){await p.locator('[data-step="'+n+'"]').click();await p.waitForTimeout(35);}await p.waitForTimeout(1300);
  check('rapid-input-settles-at-last-stage',(await proof()).step===3&&!(await proof()).animating&&(await state()).step===3);
  await p.locator('[data-step="2"]').click();await p.waitForTimeout(1400);
  const saved=await state();await p.locator('[data-evidence-source="2"]').click();await p.locator('[data-proof-claim="1"]').click();
  const inspected=await state();
  check('evidence-inspection-never-overwrites-intent',saved.challenge===inspected.challenge&&saved.step===inspected.step&&saved.skill===inspected.skill&&saved.updates===inspected.updates);
  check('fictional-source-not-in-real-brief',!inspected.brief.includes('SRC-A')&&!inspected.brief.includes('service queue')&&(await p.locator('.proof-example-note').innerText()).includes('Fictional'));
  await p.locator('#proof-inspector').scrollIntoViewIfNeeded();await p.waitForTimeout(800);await p.screenshot({path:out+'/mobile-evidence.jpg',quality:85});
  check('reading-focus-softens-field',await p.evaluate(()=>HolyMindScrollSound.snapshot().focus<1&&HolyMindScrollSound.snapshot().focus>.5));
  await p.locator('#demo-evidence>summary').click();await p.locator('[data-step="2"]').click();await p.waitForTimeout(1600);
  await p.evaluate(()=>{window.__refreshCount=0;ScrollTrigger.addEventListener('refresh',()=>__refreshCount++);});const stable=await state();
  for(let i=0;i<4;i++){await p.locator('[data-step="2"]').click();await p.waitForTimeout(250);}await p.waitForTimeout(500);
  const same=await state(),refreshes=await p.evaluate(()=>__refreshCount);
  check('same-choice-no-redundant-refresh',refreshes===0&&same.updates===stable.updates&&same.layoutRefreshes===stable.layoutRefreshes,{refreshes,updatesBefore:stable.updates,updatesAfter:same.updates});
  await p.locator('#intent-demonstration').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/mobile-workflow.jpg',quality:85});
  await p.locator('#instrument-open').click();await p.locator('#carry-skill').click();await p.locator('#close-skill-dialog').click();await p.locator('#journey-receipt').scrollIntoViewIfNeeded();await p.waitForTimeout(900);
  const selected=await state();check('receipt-shows-selected-stage',(await p.locator('#receipt-context').innerText()).includes('Answer · 3 / 4'));
  await p.screenshot({path:out+'/mobile-portal.jpg',quality:85});await p.locator('#return-to-question').click();await p.waitForTimeout(1600);let s=await state();
  check('return-to-question-keeps-choice',s.challenge===selected.challenge&&s.step===selected.step&&s.skill===selected.skill&&await p.evaluate(()=>document.activeElement?.getAttribute('data-challenge')==='knowledge'));
  await p.locator('#remove-carried-skill').click();s=await state();check('remove-only-skill-keeps-question',s.challenge==='knowledge'&&s.step===2&&s.skill===null&&s.active&&await p.locator('#remove-carried-skill').isHidden());
  await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindWorkflowProof&&window.HolyMindSkills);s=await state();
  check('reload-restores-question-without-removed-skill',s.challenge==='knowledge'&&s.step===2&&s.skill===null);
  await p.locator('#reset-journey').click();check('clear-restores-original-contact',!(await state()).active&&(await p.locator('#connect-heading').innerText()).includes('Bring the'));
  const light=await p.evaluate(()=>{const box={wordTop:380,wordLeft:20,wordWidth:300},particles=[{x:35,y:360,alpha:.8,color:1},{x:300,y:360,alpha:.8,color:3},{x:180,y:350,alpha:.8,color:0}],f={progress:.8,particles};HolyMindLighting.boom(f,box);const a=HolyMindLighting.snapshot().boom;HolyMindLighting.boom({progress:.9,particles:[...particles].reverse()},box);HolyMindLighting.boom(f,box);const c=HolyMindLighting.snapshot().boom;HolyMindLighting.boom(null,null);return {a,c,end:HolyMindLighting.snapshot().boom};});
  check('independent-reflection-origins',light.a.centers.cyan<.1&&light.a.centers.gold>.9&&light.a.centers.violet>.4&&light.a.gold<=.42&&light.a.cyan<=.30);
  check('reflection-exact-reverse-and-clear',JSON.stringify(light.a)===JSON.stringify(light.c)&&!light.end.active);
  for(const [width,height] of [[320,760],[390,844],[768,1000],[1440,1000],[844,390]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(900);await p.locator('[data-challenge=knowledge]').click();await p.locator('[data-step="2"]').click();await p.locator('[data-evidence-source="0"]').click();await p.waitForTimeout(650);
   const bounds=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,buttons:[...document.querySelectorAll('[data-evidence-source],.proof-claim')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height};})}));
   check('responsive-interactive-proof-'+width,!bounds.overflow&&bounds.buttons.every(b=>b.h>=44&&b.w>30));
   if(width===1440){await p.locator('#intent-demonstration').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/desktop-workflow.jpg',quality:85});}
   await p.locator('#demo-evidence>summary').click();
  }
  await p.locator('[data-step="1"]').click();await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(150);
  check('pagehide-stops-new-transition',!(await proof()).animating&&!await p.evaluate(()=>HolyMindAudio.snapshot().context==='running'));
  const transitionsBeforeResume=(await proof()).transitionCount;await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await p.waitForTimeout(400);
  check('resume-without-replaying-transfer',!(await proof()).animating&&(await proof()).transitionCount===transitionsBeforeResume);
  check('no-new-submission',writes.length===0,{writes});check('motion-stays-on',await p.evaluate(()=>document.body.dataset.motion==='on'&&!document.querySelector('#motion-toggle')));
  const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
