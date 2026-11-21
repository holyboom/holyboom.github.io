/* Finite B events: actual native scrolling, fixed-source geometry and lifecycle. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{chromium}=require('playwright');
const m=require('../assets/profile/cinematic-lines.js'),thread=require('../assets/profile/reading-thread.js');
const out=process.env.CINEMATIC_QA_DIR||path.resolve('docs/evidence/cinematic-lines');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));},hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const geometry=thread.route([735,330],[300,250],640,false,800),frame={origin:[735,330],endpoint:[300,250],contour:Array.from({length:37},(_,i)=>[765+30*Math.cos(i/36*Math.PI*2),330+24*Math.sin(i/36*Math.PI*2)]),accent:'#c398ff',compact:false,region:{left:650,right:1100,top:100,bottom:800},sample:thread.sampleRoute(geometry)};
const cues=Array.from({length:10},(_,i)=>m.cueFor(i+1,{index:i,prop:i===3?'review':'skill'})),phases=Array.from({length:51},(_,i)=>i/50);
check('every-reading-section-has-a-distinct-line-language',new Set(cues.map(c=>c.kind)).size===10,cues);
for(const cue of [...cues,...['repair','doubt','recovery','moat'].map(kind=>({...cues[4],kind}))]){
 const frames=phases.map(p=>m.compose(frame,p,cue));
 check('finite-seeded-phase-geometry-'+cue.kind,frames.every(f=>f.paths.every(p=>!/(NaN|Infinity)/.test(p.d)&&p.alpha>=0&&p.alpha<=1)&&f.particles.every(p=>p.p.every(Number.isFinite)&&p.alpha>=0&&p.alpha<=1))&&phases.slice().reverse().every((p,i)=>hash(m.compose(frame,p,cue))===hash(frames[50-i])));
 check('all-extra-pixels-settle-at-both-endpoints-'+cue.kind,frames[0].paths.length===0&&frames[0].particles.length===0&&frames[50].paths.length===0&&frames[50].particles.length===0);
 check('local-dust-is-bounded-and-receiver-impact-follows-arrival-'+cue.kind,frames.every(f=>f.particles.filter(p=>p.role==='local').every(p=>p.p[0]>=frame.region.left&&p.p[0]<=frame.region.right&&p.p[1]>=frame.region.top&&p.p[1]<=frame.region.bottom)&&(f.state.impact===0||f.state.travel===1)));
}
check('review-dust-waits-before-the-real-component-edge',phases.every(p=>m.compose(frame,p,cues[3]).particles.filter(p=>p.role==='local').every(p=>p.p[0]<frame.origin[0]-7)));
const c=m.controller();for(let i=0;i<4;i++)c.step(cues[0],.04,true);check('stable-cue-starts-one-finite-event',c.snapshot().events===1&&c.snapshot().active);
for(let i=0;i<200;i++)c.step(cues[0],.04,true);check('same-section-never-auto-repeats',c.snapshot().events===1&&!c.pending());
for(const cue of cues.slice(1,7))c.step(cue,.016,true);check('fast-skips-do-not-queue-missed-events',c.snapshot().events===1);
for(let i=0;i<4;i++)c.step(cues[8],.04,true);check('latest-stable-intent-wins',c.snapshot().events===2&&c.snapshot().kind==='echoes');c.step(cues[8],0,false);check('source-exit-cancels-the-event',!c.pending());
(async()=>{const b=await chromium.launch();try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const p=await b.newPage({viewport});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const original=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),pending=new Set();let peak=0;window.requestAnimationFrame=callback=>{const id=original(t=>{pending.delete(id);callback(t);});pending.add(id);peak=Math.max(peak,pending.size);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id);};window.__rafProbe=()=>({pending:pending.size,peak});});
  await p.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await p.waitForFunction(()=>window.ProfileExperience,null,{polling:50});await p.evaluate(()=>document.fonts.ready);
  const scenes=[];
  for(const id of ['origins','allianz','accenture','ttb','conviction','craft','ai-experiences','work-heading','experience','contact']){
   await p.locator('#'+id).evaluate(el=>el.scrollIntoView({behavior:'instant'}));
   await p.waitForFunction(id=>{const s=ProfileExperience.snapshot();return s.current===s.target&&Math.abs(s.target-Number(document.querySelector('#'+id).dataset.scene))<.01;},id,{polling:50});
   await p.waitForTimeout(240);const s=await p.evaluate(()=>{const s=ProfileExperience.snapshot();return {current:s.current,cinematic:s.cinematic,thread:s.readingThread,overflow:document.documentElement.scrollWidth>innerWidth};});
   scenes.push({id,kind:s.cinematic.kind,active:s.cinematic.active,sourceKind:s.thread.sourceKind});
   if(id==='experience')check('experience-hands-source-ownership-to-the-skill-finale-'+viewport.width,await p.evaluate(()=>{const f=ProfileExperience.snapshot().finale;return f.active&&f.p===1&&f.skillCount===34&&document.querySelector('#experience #architecture');}));else check('section-entry-owns-one-visible-source-'+viewport.width+'-'+id,s.cinematic.active&&s.cinematic.key?.startsWith(Math.floor(s.current)+':')&&s.thread.visible&&JSON.stringify(s.cinematic.source)===JSON.stringify(s.thread.source)&&JSON.stringify(s.cinematic.target)===JSON.stringify(s.thread.target),{key:s.cinematic.key,sourceKind:s.thread.sourceKind});
   check('source-effects-do-not-widen-the-reading-layout-'+viewport.width+'-'+id,!s.overflow);
   if(['conviction','craft','contact'].includes(id)){
    await p.waitForFunction(()=>{const s=ProfileExperience.snapshot().cinematic;return s.active&&s.phase>.4;},null,{polling:50});
    await p.screenshot({path:path.join(out,viewport.width+'-'+id+'.png')});
   }
  }
  fs.writeFileSync(path.join(out,'scene-entries-'+viewport.width+'.json'),JSON.stringify(scenes,null,2));
  // After the visible-time consideration beat, only the SVG event continues.
  await p.waitForFunction(()=>!ProfileExperience.snapshot().dirty,null,{polling:50});
  const a=await p.evaluate(()=>{const s=ProfileExperience.snapshot();return {draws:s.draws,updates:s.cinematic.updates,image:document.querySelector('#architecture').toDataURL()};});await p.waitForTimeout(260);const z=await p.evaluate(()=>{const s=ProfileExperience.snapshot();return {draws:s.draws,updates:s.cinematic.updates,image:document.querySelector('#architecture').toDataURL()};});
  check('finite-event-keeps-the-settled-character-bitmap-'+viewport.width,a.draws===z.draws&&a.image===z.image&&z.updates>a.updates,{draws:[a.draws,z.draws],updates:[a.updates,z.updates]});
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(80);const hidden=await p.evaluate(()=>ProfileExperience.snapshot().cinematic);await p.waitForTimeout(260);const still=await p.evaluate(()=>ProfileExperience.snapshot().cinematic);check('hidden-page-freezes-event-phase-and-paint-'+viewport.width,hidden.age===still.age&&hidden.updates===still.updates);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(120);const resumed=await p.evaluate(()=>ProfileExperience.snapshot().cinematic);check('resume-has-no-missed-event-backlog-'+viewport.width,resumed.events===hidden.events&&resumed.age-hidden.age<.3);
  await p.waitForFunction(()=>!ProfileExperience.snapshot().cinematic.active&&!ProfileExperience.snapshot().cinematic.pending,null,{polling:50});await p.waitForTimeout(120);const settled=await p.evaluate(()=>({s:ProfileExperience.snapshot(),raf:__rafProbe(),display:getComputedStyle(document.querySelector('.cinematic-lines')).display}));await p.waitForTimeout(250);const idle=await p.evaluate(()=>({s:ProfileExperience.snapshot(),raf:__rafProbe()}));
  check('event-ends-and-the-shared-scheduler-really-stops-'+viewport.width,settled.s.cinematic.updates===idle.s.cinematic.updates&&settled.s.draws===idle.s.draws&&idle.raf.pending===0&&settled.display==='none');check('only-one-page-animation-frame-is-ever-pending-'+viewport.width,idle.raf.peak===1,idle.raf);
  await p.locator('#allianz').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await p.waitForTimeout(900);const back=await p.evaluate(()=>ProfileExperience.snapshot().cinematic);check('reverse-navigation-starts-a-new-local-event-'+viewport.width,back.active&&back.kind==='assembly'&&back.events>resumed.events);
  await p.setViewportSize({width:viewport.width,height:viewport.height-40});await p.waitForTimeout(130);const toolbar=await p.evaluate(()=>ProfileExperience.snapshot().cinematic);check('toolbar-height-change-does-not-retrigger-the-event-'+viewport.width,toolbar.events===back.events);
  await p.setViewportSize(viewport.width<768?{width:844,height:390}:{width:1024,height:800});await p.waitForTimeout(200);check('orientation-keeps-native-reading-and-effects-bounded-'+viewport.width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&ProfileExperience.snapshot().mode==='full'));
  await p.close();
 }
 const fallback=await b.newPage();await fallback.route('**/cinematic-lines.js*',r=>r.abort());await fallback.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/#craft');await fallback.waitForFunction(()=>window.ProfileExperience,null,{polling:50});check('optional-effect-failure-preserves-the-full-profile',await fallback.evaluate(()=>ProfileExperience.snapshot().mode==='full')&&await fallback.locator('#craft').isVisible());await fallback.close();
}finally{await b.close();}
 check('no-browser-errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,clock:'finite visible time; scroll rig is unchanged',device:'Chromium viewport emulation; no physical-phone performance claim'},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
