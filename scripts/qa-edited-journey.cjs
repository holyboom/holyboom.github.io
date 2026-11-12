const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8790/',out=process.env.QA_DIR||'qa-output/edited-'+engine;
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],nonRead=[];const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const b=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));try{
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))nonRead.push(r.url());});
  await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindEdit&&HolyMindSkills.list().length===34&&HolyMindBoomAudio.snapshot().ready&&HolyMindCueTimbres.snapshot().ready);await p.waitForTimeout(1200);
  const jump=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1400);};
  const height=()=>p.evaluate(()=>document.documentElement.scrollHeight);
  check('current-release',await p.locator('html').getAttribute('data-build')==='edited-journey-v27');
  check('silent-unselected-load',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'&&!HolyMindJourney.snapshot().active));
  const defaultHeight=await height();check('default-mobile-route-under-nine-thousand',defaultHeight<9000,{height:defaultHeight});
  check('principle-duplication-removed',await p.locator('.principles').count()===0&&await p.locator('.flow-chapter').count()===3);
  check('depth-closed-by-default',await p.evaluate(()=>!document.querySelector('#skill-library').open&&!document.querySelector('#workbench-notes').open&&!document.querySelector('.about-story').open));
  check('only-featured-deck-on-main-route',await p.locator('.deck-shard').count()===6&&await p.locator('.skill-card:visible').count()===0&&await p.locator('.skill-card').count()===34);
  check('services-start-as-compact-rows',await p.locator('.approach-list details[open]').count()===0);
  check('full-art-and-motion',await p.evaluate(()=>HolyMindBoomModel.particleCount===259&&HolyMindTimbres.presets.length===14&&document.body.dataset.motion==='on'&&!document.querySelector('#motion-toggle')));
  const route=await p.evaluate(()=>({keys:HolyMindContinuity.snapshot().keys,stations:HolyMindScrollSound.snapshot().stations,max:document.documentElement.scrollHeight-innerHeight}));
  check('all-eleven-visual-stations',new Set(route.keys.map(k=>k.id)).size===11);
  check('route-keys-in-order-and-reachable',route.keys.every((k,i)=>Number.isFinite(k.at)&&k.at<=route.max&&(!i||k.at>route.keys[i-1].at)),{keys:route.keys});
  check('all-eleven-audio-stations',route.stations.length===11&&route.stations.every((s,i)=>!i||s.at>route.stations[i-1].at));
  await p.locator('#skill-library>summary').focus();await p.keyboard.press('Enter');await p.waitForTimeout(1500);
  check('keyboard-opens-full-library',await p.evaluate(()=>document.querySelector('#skill-library').open)&&await p.locator('.skill-card:visible').count()===34);
  const expandedHeight=await height();check('library-is-optional-depth',expandedHeight>defaultHeight+1500,{expandedHeight,defaultHeight});
  await p.locator('[data-filter=verify]').click();await p.waitForTimeout(600);check('filter-remains-functional',await p.locator('.skill-card').count()>0&&(await p.locator('.skill-category').allTextContents()).every(x=>x==='Verify'));
  await p.locator('#skill-search').fill('no-such-skill-zz999');await p.waitForTimeout(600);check('search-empty-state-visible',await p.locator('#skills-empty').isVisible()&&await p.locator('.skill-card').count()===0);
  await p.locator('#clear-search').click();await p.waitForTimeout(700);check('reset-restores-all-34',await p.locator('.skill-card').count()===34);
  await p.locator('#close-skill-library').click();await p.waitForTimeout(1700);check('close-restores-short-route',!await p.evaluate(()=>document.querySelector('#skill-library').open)&&Math.abs((await height())-defaultHeight)<4,{after:await height(),defaultHeight});
  check('close-restores-summary-focus',await p.evaluate(()=>document.activeElement===document.querySelector('#skill-library>summary')));
  for(const id of ['operations','knowledge','venture']){await p.locator('[data-challenge='+id+']').click();for(const step of [0,2,3]){await p.locator('[data-step="'+step+'"]').click();await p.waitForTimeout(100);check('visible-demo-'+id+'-'+step,await p.evaluate(({id,step})=>HolyMindJourney.snapshot().challenge===id&&HolyMindJourney.snapshot().step===step&&HolyMindWorkflowProof.snapshot().step===step,{id,step}));}}
  await p.locator('[data-challenge=knowledge]').click();await p.locator('[data-step="2"]').click();
  await p.locator('#workbench-notes>summary').click();await p.waitForTimeout(800);
  check('rationale-and-guardrail-still-readable',await p.locator('#scenario-question').isVisible()&&await p.locator('#step-description').isVisible()&&await p.locator('#guardrail').isVisible()&&(await p.locator('#guardrail').innerText()).includes('permissions'));
  await p.locator('#workbench-notes>summary').click();await p.locator('[data-evidence-source="2"]').click();check('excluded-source-still-excluded',await p.evaluate(()=>HolyMindWorkflowProof.snapshot().source===2&&!HolyMindWorkflowProof.snapshot().outputSources.includes('SRC-X')));await p.locator('#demo-evidence>summary').click();
  await p.locator('#instrument-open').click();await p.locator('#carry-skill').click();await p.locator('#close-skill-dialog').click();
  const selected=await p.evaluate(()=>HolyMindJourney.snapshot());check('choice-reaches-portal',selected.challenge==='knowledge'&&selected.skill==='mcp-orchestrator'&&(await p.locator('#connect-heading').innerText()).includes('Make knowledge'));
  await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copied=text}}));await p.locator('#copy-journey').click();
  check('brief-copy-preserved',await p.evaluate(()=>window.__copied===HolyMindJourney.snapshot().brief));
  await p.locator('#return-to-question').click();await p.waitForTimeout(1400);check('return-keeps-question-and-skill',await p.evaluate(()=>HolyMindJourney.snapshot().step===2&&HolyMindJourney.snapshot().skill==='mcp-orchestrator'));
  for(const index of [0,1,2]){const s=p.locator('.approach-list details').nth(index);await s.locator('summary').click();check('service-detail-'+index,await s.locator('.approach-content').isVisible());await s.locator('summary').click();}
  await p.locator('.about-story>summary').click();check('full-bio-not-deleted',await p.locator('.thai-copy').isVisible()&&await p.locator('.identity-note').isVisible());await p.locator('.about-story>summary').click();
  await p.locator('#reset-journey').click();await p.waitForTimeout(900);
  const assembly=await p.evaluate(()=>HolyMindAssemblyScroll.snapshot());check('assembly-shortened-not-removed',assembly.end-assembly.start>=800&&assembly.end-assembly.start<1300);
  for(const value of [0,50,100,50,0]){await p.evaluate(v=>HolyMindAssemblyScroll.seek(v),value);await p.waitForTimeout(900);check('assembly-scrub-'+value+'-'+checks.length,await p.locator('#assembly-control').inputValue()===String(value));}
  await p.evaluate(()=>HolyMindAssemblyScroll.seek(100));await p.waitForTimeout(1100);check('all-three-layer-callouts-complete',await p.locator('.layer-callout[data-complete=true]').count()===3);
  const boom=await p.evaluate(()=>HolyMindBoomCelebration.snapshot().range);const samples=[];
  for(const t of [.35,.64,.88]){await jump(boom.start+t*(boom.end-boom.start));samples.push(await p.evaluate(()=>({box:HolyMindBoomCelebration.snapshot().box,geometry:HolyMindBoomCelebration.snapshot().geometry})));}
  for(let i=samples.length-1;i>=0;i--){const t=[.35,.64,.88][i];await jump(boom.start+t*(boom.end-boom.start));const equal=await p.evaluate(ref=>JSON.stringify(HolyMindBoomModel.frame(ref.geometry.progress,ref.box))===JSON.stringify(ref.geometry),samples[i]);check('same-particle-model-on-reverse-'+i,equal);}
  check('falling-finale-still-present',samples[2].geometry.particles.some(x=>x.role==='falling-glitter'&&x.fall>10));
  for(const [width,hh] of [[320,760],[390,844],[768,1000],[1440,1000],[844,390]]){await p.setViewportSize({width,height:hh});await p.waitForTimeout(1200);await jump(0);check('responsive-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('#skill-library>summary').click();await p.waitForTimeout(800);check('expanded-library-responsive-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('#close-skill-library').click();await p.waitForTimeout(800);}
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(900);await p.locator('#menu-toggle').click();check('mobile-contact-discoverable',await p.locator('#primary-nav .compact-contact-link').isVisible());await p.locator('#primary-nav .compact-contact-link').click();await p.waitForTimeout(1300);check('mobile-contact-navigation-works',await p.evaluate(()=>location.hash==='#connect'&&document.querySelector('#menu-toggle').getAttribute('aria-expanded')==='false'));
  const noJS=await b.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});await noJS.goto(base);await noJS.locator('#workbench-notes>summary').click();check('native-disclosure-without-js',await noJS.locator('#step-description').isVisible()&&await noJS.locator('#connect .button-primary').count()===1);await noJS.close();
  check('no-submissions-or-new-network-writes',nonRead.length===0);
  const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
