/* Explicit-choice journey and sound mixing. Browser assertions, not a listener study. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8787/',out=process.env.QA_DIR||'qa-output/intent-'+engine;fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[],requests=[];
const check=(name,pass,detail={})=>{checks.push({name,pass:!!pass,...detail});console.log(name,!!pass);};
const b=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.method()!=='GET')requests.push({method:r.method(),url:r.url()});});
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindJourney&&HolyMindSkills.list().length===34&&HolyMindBoomAudio.snapshot().ready&&HolyMindCueTimbres.snapshot().ready);await p.waitForTimeout(1000);
 const state=()=>p.evaluate(()=>HolyMindJourney.snapshot()),audio=()=>p.evaluate(()=>HolyMindAudio.snapshot());
 const jump=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1450);};
 check('release-v24',await p.locator('html').getAttribute('data-build')==='intent-v24');
 check('initial-is-generic-no-invented-choice',!(await state()).active&&await p.locator('#journey-receipt').isHidden());
 check('load-silent-no-audio-context',(await audio()).context==='uncreated');
 check('four-independent-controls',await p.locator('#sound-piano,#sound-cues,#sound-flow,#sound-ambience').count()===4);
 check('new-diagram-marked-illustrative',(await p.locator('.demo-topline').innerText()).includes('no AI request'));
 for(const challenge of ['operations','knowledge','venture']){
  await p.locator('[data-challenge='+challenge+']').click();
  for(let i=0;i<4;i++){await p.locator('[data-step="'+i+'"]').click();const s=await state();check('explicit-stage-'+challenge+'-'+i,s.challenge===challenge&&s.step===i&&await p.locator('#intent-demonstration').getAttribute('data-stage')===String(i));}
  await p.locator('#demo-evidence>summary').click();check('source-trail-'+challenge,await p.locator('.demo-evidence-content p').count()===3);await p.locator('#demo-evidence>summary').click();
 }
 await p.locator('[data-challenge=knowledge]').click();await p.locator('[data-step="2"]').click();await p.waitForTimeout(500);await p.locator('#intent-demonstration').scrollIntoViewIfNeeded();await p.waitForTimeout(1000);await p.screenshot({path:out+'/mobile-knowledge.jpg',quality:86});
 await p.locator('#instrument-open').click();await p.locator('#carry-skill').click();let s=await state();const chosen=s.skill;
 check('skill-carried-only-on-explicit-action',chosen==='mcp-orchestrator'&&(await p.locator('#carry-skill-status').innerText()).includes('carried'));
 await p.locator('#close-skill-dialog').click();check('skill-and-scenario-in-brief',s.brief.includes('approved internal knowledge')&&s.brief.includes('MCP orchestration'));
 await p.locator('#journey-receipt').scrollIntoViewIfNeeded();await p.waitForTimeout(1100);
 check('portal-heading-personalized',(await p.locator('#connect-heading').innerText()).includes('Make knowledge'));
 check('portal-carries-selected-icon',(await p.locator('.portal-depth>img').getAttribute('src')).includes(chosen));
 check('portal-brief-matches-workbench',(await p.locator('#journey-brief-text').inputValue())===(await p.locator('#project-brief').inputValue()));
 await p.screenshot({path:out+'/mobile-portal.jpg',quality:86});
 await p.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedBrief=text;}}});});
 await p.locator('#copy-journey').click();check('copy-confirmed-content',await p.evaluate(()=>window.__copiedBrief===HolyMindJourney.snapshot().brief)&&(await p.locator('#journey-copy-status').innerText()).includes('Brief copied'));
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('blocked');}}}));
 await p.locator('#copy-journey').click();check('copy-fallback-keeps-reviewable-text',await p.locator('#journey-brief').getAttribute('open')!==null&&await p.locator('#journey-brief-text').inputValue()===(await state()).brief);await p.locator('#journey-brief>summary').click();
 const saved=await state();const r=await p.evaluate(()=>HolyMindBoomCelebration.snapshot().range);for(const y of [0,r.start+60,r.end+30,r.start-100,0])await jump(y);
 const after=await state();check('scroll-and-reverse-never-change-intent',after.skill===saved.skill&&after.challenge===saved.challenge&&after.step===saved.step);
 await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindJourney&&HolyMindSkills.list().length===34);await p.waitForTimeout(900);s=await state();
 check('reload-restores-tab-choice',s.skill===chosen&&s.challenge==='knowledge'&&s.step===2);
 check('storage-only-whitelisted-ids',await p.evaluate(()=>{const s=JSON.parse(sessionStorage.getItem('holymind-intent-v24'));return Object.keys(s).sort().join(',')==='challenge,skill,step,version'&&typeof s.challenge==='string';}));
 await p.locator('#show-skills').click();await p.waitForTimeout(700);check('all-34-skills-remain',await p.locator('.skill-card').count()===34);
 check('related-skills-annotated',await p.locator('.skill-card[data-journey-related=true]').count()===4);
 check('carried-skill-highlighted',await p.locator('.skill-card[data-journey-selected=true]').count()===1);
 await p.locator('#skill-search').fill('source');await p.waitForTimeout(600);check('filtered-grid-keeps-intent',(await state()).skill===chosen&&(await state()).challenge==='knowledge');
 await p.locator('#skill-search').fill('');await p.waitForTimeout(400);await p.locator('#reset-journey').click();check('clear-restores-generic-portal',!(await state()).active&&(await p.locator('#connect-heading').innerText()).includes('Bring the'));
 check('clear-removes-session-state',await p.evaluate(()=>sessionStorage.getItem('holymind-intent-v24')===null));
 await p.locator('[data-challenge=operations]').focus();await p.keyboard.press('ArrowDown');check('keyboard-choice-carried',(await state()).challenge==='knowledge');
 // Four real channels retain one AudioContext; gain automation is observed after settling.
 await jump(0);await p.locator('#sound-toggle').click();await p.waitForTimeout(1300);if(!(await audio()).enabled){await p.locator('#sound-toggle').click();await p.waitForTimeout(700);}
 await p.locator('.sonic-settings>summary').click();await p.locator('#sound-piano').uncheck();await p.waitForTimeout(350);
 let a=await audio();check('piano-off-keeps-reactions',!a.piano&&a.cues&&a.mixGains.piano<.001&&a.mixGains.reactions>.99);
 check('fireworks-play-with-piano-off',await p.evaluate(()=>HolyMindAudio.boomPreview({kind:'burst',index:4,direction:1,x:.8},true)));await p.waitForTimeout(160);a=await audio();check('firework-signal-with-piano-off',a.celebration.rms>.0001&&Math.abs(a.celebration.history.at(-1).pan-.21)<.01);
 await p.locator('#sound-piano').check();await p.locator('#sound-cues').uncheck();await p.waitForTimeout(400);await p.evaluate(()=>HolyMindAudio.scorePreview('start',true));await p.waitForTimeout(1100);a=await audio();
 check('reaction-off-keeps-piano',a.piano&&!a.cues&&a.score.running&&a.score.rms>.0001&&a.mixGains.reactions<.001);
 check('reaction-off-blocks-firework',!await p.evaluate(()=>HolyMindAudio.boomPreview({kind:'burst',index:4,direction:1},true)));
 await p.locator('#sound-cues').check();await p.locator('.sound-fine-tune>summary').click();
 for(const [id,value] of [['piano',41],['reactions',56],['flow',63],['ambience',72]]){await p.locator('#mix-'+id).fill(String(value));await p.waitForTimeout(350);a=await audio();check('level-'+id,Math.abs(a.levels[id]-value/100)<.001);}
 a=await audio();check('post-envelope-mix-gains',Math.abs(a.mixGains.piano-.41)<.001&&Math.abs(a.mixGains.reactions-.56)<.001&&Math.abs(a.soundscape.actual.flowLevel-.63)<.001&&Math.abs(a.soundscape.actual.ambientLevel-.72)<.001);
 await p.locator('#mix-piano').fill('0');await p.waitForTimeout(350);
 await p.evaluate(()=>HolyMindAudio.cue('select',{key:'verify-independent-reaction',priority:3,kind:'action',variant:1}));await p.waitForTimeout(90);a=await audio();
 check('musical-action-keeps-reaction-bus-at-piano-zero',a.feedback.rms>.00003&&a.mixGains.piano<.001,{rms:a.feedback.rms});
 await p.locator('#mix-piano').fill('41');await p.waitForTimeout(250);
 await p.screenshot({path:out+'/mobile-mix.jpg',quality:86});await p.evaluate(()=>HolyMindAudio.scorePreview('pause',true));
 await p.reload({waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindJourney);await p.waitForTimeout(600);a=await audio();check('mix-levels-persist-without-autoplay',a.context==='uncreated'&&a.levels.piano===.41&&a.levels.flow===.63);
 await p.locator('#sound-toggle').click();await p.waitForTimeout(700);await p.evaluate(()=>HolyMindAudio.setMix('taps'));await p.waitForTimeout(250);
 a=await audio();check('legacy-taps-audition-still-has-reactions',a.cues&&!a.piano&&!a.flow&&!a.ambience);
 check('legacy-taps-audition-does-not-add-fireworks',!await p.evaluate(()=>HolyMindAudio.boomPreview({kind:'burst',index:1,direction:1},true)));
 await p.evaluate(()=>HolyMindAudio.setMix('full'));await p.waitForTimeout(300);check('full-mix-restores-all-layers',await p.evaluate(()=>{const a=HolyMindAudio.snapshot();return a.piano&&a.cues&&a.flow&&a.ambience;}));
 // Draw cost affects only the next effect boundary, never identities or current progress.
 const stats=await p.evaluate(()=>{const budget=HolyMindVisualBudget;for(let i=0;i<40;i++)budget.observe(14);const pending=budget.snapshot();budget.boundary();return {pending,after:budget.snapshot(),count:HolyMindBoomModel.particleCount};});
 check('budget-changes-only-at-boundary',stats.pending.pending==='efficient'&&stats.pending.detail==='full'&&stats.after.detail==='efficient');check('budget-never-removes-particles-or-motion',stats.count===259&&stats.after.particlesRemoved===0&&await p.evaluate(()=>document.body.dataset.motion==='on'));
 const reflection=await p.evaluate(()=>{const m=HolyMindBoomModel,box={width:390,height:844,header:73,wordLeft:25,wordTop:380,wordWidth:280,anchor:{x:290,y:450}};const f=m.frame(.84,box);HolyMindLighting.boom(f,box);const a=HolyMindLighting.snapshot().boom;HolyMindLighting.boom(m.frame(.92,box),box);HolyMindLighting.boom(f,box);const b=HolyMindLighting.snapshot().boom;HolyMindLighting.boom(null,null);return {a,b,end:HolyMindLighting.snapshot().boom};});
 check('reflection-reverses-deterministically',JSON.stringify(reflection.a)===JSON.stringify(reflection.b)&&reflection.a.gold>0&&reflection.a.gold<=.42);check('reflection-clears-at-end',!reflection.end.active&&reflection.end.gold===0);
 for(const [width,height] of [[320,760],[390,844],[768,1000],[1440,1000],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(900);await p.locator('[data-challenge=knowledge]').click();await p.locator('[data-step="2"]').click();await p.waitForTimeout(650);
  check('responsive-layout-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.locator('#intent-demonstration').scrollIntoViewIfNeeded();await p.waitForTimeout(650);await p.screenshot({path:out+'/demo-'+width+'.jpg',quality:84});
 }
 // Invalid persisted identifiers cannot become HTML, asset paths or automatic selections.
 const bad=await b.newPage({viewport:{width:390,height:844}});await bad.addInitScript(()=>sessionStorage.setItem('holymind-intent-v24',JSON.stringify({version:1,challenge:'<script>',skill:'../../secret',step:99})));bad.on('pageerror',e=>errors.push('invalid:'+e.message));await bad.goto(base,{waitUntil:'networkidle'});await bad.waitForFunction(()=>window.HolyMindJourney&&window.HolyMindSkills);check('invalid-storage-discarded',await bad.evaluate(()=>!HolyMindJourney.snapshot().active));await bad.close();
 const migrated=await b.newPage();await migrated.addInitScript(()=>localStorage.setItem('holymind-cues','off'));await migrated.goto(base,{waitUntil:'networkidle'});check('legacy-cue-preference-migrates-conservatively',await migrated.evaluate(()=>!HolyMindAudio.snapshot().piano&&!HolyMindAudio.snapshot().cues));await migrated.close();
 check('no-post-or-data-submission',requests.length===0,{requests});
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
