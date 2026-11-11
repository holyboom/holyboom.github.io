const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8778/',out=process.env.QA_DIR||'qa-output/feedback-'+engine;
fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
try{
const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindFeedback&&window.HolyMindContinuity?.snapshot().keys.length>10);
const audio=()=>p.evaluate(()=>HolyMindAudio.snapshot());const events=()=>p.evaluate(()=>HolyMindAudio.snapshot().history.filter(x=>x.kind==='cue'));
const wheel=async(d,n=12,delay=45)=>{for(let i=0;i<n;i++){await p.mouse.wheel(0,d);await p.waitForTimeout(delay);}};
const jump=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1650);await p.waitForFunction(()=>!HolyMindContinuity.snapshot().running,null,{timeout:12000});};
check('release-feedback-v15',await p.locator('html').getAttribute('data-build')==='feedback-v15');
check('no-context-on-load',(await audio()).context==='uncreated');await wheel(10,4);check('scroll-cannot-unlock',(await audio()).context==='uncreated');
await p.locator('[data-challenge=knowledge]').click();await p.waitForTimeout(180);let a=await audio();check('first-real-action-unlocks-and-responds',a.context==='running'&&a.contextCount===1&&a.feedback.played===1&&a.history.at(-1).key==='scenario:knowledge',{history:a.history});
check('cue-bus-has-measured-output',a.feedback.maxRms>.001,{maxRms:a.feedback.maxRms});
async function action(name,fn,kind){await p.waitForTimeout(360);const before=(await audio()).feedback.played;await fn();await p.waitForTimeout(160);const a=await audio();check(name,a.feedback.played===before+1&&a.history.at(-1).id===kind,{last:a.history.at(-1)});}
await action('workbench-step',()=>p.locator('[data-step="2"]').click(),'select');let n=(await audio()).feedback.played;await p.waitForTimeout(400);await p.locator('[data-step="2"]').click();await p.waitForTimeout(150);check('same-selection-is-silent',(await audio()).feedback.played===n);
await p.locator('[data-challenge=knowledge]').focus();await action('keyboard-scenario',()=>p.keyboard.press('ArrowRight'),'switch');
await action('skill-selection',()=>p.locator('#next-skill').click(),'select');
await action('skill-open',()=>p.locator('#instrument-open').click(),'open');await action('escape-closes-with-cue',()=>p.keyboard.press('Escape'),'close');
await action('filter-change',()=>p.locator('[data-filter=verify]').click(),'filter');n=(await audio()).feedback.played;await p.waitForTimeout(400);await p.locator('[data-filter=verify]').click();await p.waitForTimeout(140);check('same-filter-is-silent',(await audio()).feedback.played===n);
await action('all-filter',()=>p.locator('[data-filter=all]').click(),'filter');await action('gallery-expands',()=>p.locator('#show-skills').click(),'open');await action('gallery-collapses',()=>p.locator('#show-skills').click(),'close');
await action('service-opens',()=>p.locator('.approach-list details').nth(1).locator('summary').click(),'open');await action('service-closes',()=>p.locator('.approach-list details').nth(1).locator('summary').click(),'close');
await action('about-opens',()=>p.locator('.about-story summary').click(),'open');await action('about-closes',()=>p.locator('.about-story summary').click(),'close');
await jump(0);await action('mobile-menu-opens',()=>p.locator('#menu-toggle').click(),'open');await action('mobile-menu-closes',()=>p.locator('#menu-toggle').click(),'close');
await p.waitForTimeout(400);n=(await audio()).feedback.played;await p.locator('#skill-search').pressSequentially('zz-no-result',{delay:45});await p.waitForTimeout(600);a=await audio();check('search-one-cue-after-typing',a.feedback.played===n+1&&a.history.at(-1).key.startsWith('search-result:'),{events:a.history.slice(-3)});await action('clear-search',()=>p.locator('#clear-search').click(),'filter');
// Native arrivals follow actual visual docking points, not the audio scene map.
for(const id of ['orbit','ribbon','assembly','system','skills','gallery','services','delivery','signature','portal']){
 const c=await p.evaluate(()=>HolyMindContinuity.snapshot()),ks=c.keys.filter(x=>x.id===id),start=ks[0].at,hold=(ks[1]?.at??start+20)-start,target=start+Math.min(9,hold*.3);
 await jump(target-110);const before=(await events()).length;await wheel(10,11,45);await p.waitForTimeout(210);const list=(await events()).slice(before);
 check('arrival-'+id,list.some(x=>x.key==='dock:'+id+':1'),{cues:list.map(x=>x.key),continuity:await p.evaluate(()=>({from:HolyMindContinuity.snapshot().from,to:HolyMindContinuity.snapshot().to,p:HolyMindContinuity.snapshot().progress})),feedback:await p.evaluate(()=>({last:HolyMindFeedback.snapshot().lastDock,history:HolyMindFeedback.snapshot().history.slice(-3)}))});
 n=(await audio()).feedback.played;await p.waitForTimeout(600);check('hold-does-not-repeat-'+id,(await audio()).feedback.played===n);
}
// Revisit from the opposite direction with actual wheel input.
for(const id of ['signature','services','skills','assembly','orbit']){
 const ks=await p.evaluate(id=>HolyMindContinuity.snapshot().keys.filter(k=>k.id===id),id),target=(ks.at(-1).at)-8;
 await jump(target+120);const before=(await events()).length;await wheel(-10,12,45);await p.waitForTimeout(200);const list=(await events()).slice(before);check('return-'+id,list.some(x=>x.key==='dock:'+id+':-1'&&x.id==='return'),{cues:list.map(x=>x.key)});
}
const yFor=async value=>p.evaluate(value=>{const s=HolyMindAssemblyScroll.snapshot();let lo=0,hi=1;for(let i=0;i<24;i++){const t=(lo+hi)/2,e=t*t*t*(t*(t*6-15)+10);if(e<value)lo=t;else hi=t;}return s.start+(s.lead+(lo+hi)/2*(s.finish-s.lead))*(s.end-s.start);},value);
for(const [i,value] of [[0,.43],[1,.68],[2,.91]]){const to=await yFor(value),from=await yFor(value-.10);await jump(from);const before=(await events()).length;await wheel((to-from)/18,18,45);await p.waitForTimeout(180);const list=(await events()).slice(before);check('real-layer-reveal-'+i,list.some(x=>x.key==='layer:'+i+':1'&&x.id==='layer'),{cues:list.map(x=>x.key)});}
let from=await yFor(.79),to=await yFor(.65);await jump(from);const before=(await events()).length;await wheel((to-from)/18,18,45);await p.waitForTimeout(160);check('layer-retracts-with-return-cue',(await events()).slice(before).some(x=>x.key==='layer:2:-1'));
await jump(await yFor(.95));await p.waitForTimeout(2000);await action('layer-focus',()=>p.locator('[data-callout=intent]').click(),'select');
// Silent programmatic changes and no startup/loading cue avalanche.
await p.waitForTimeout(1100);n=(await audio()).feedback.played;await p.evaluate(()=>HolyMindAssemblyScroll.seek(0));await p.waitForTimeout(1400);await p.evaluate(()=>HolyMindAssemblyScroll.seek(100));await p.waitForTimeout(1400);check('scripted-seek-does-not-emit-cues',(await audio()).feedback.played===n);
await jump(0);await p.locator('.sonic-settings summary').click();await p.locator('#sound-cues').uncheck();await p.locator('.sonic-settings summary').click();n=(await audio()).feedback.played;await p.locator('[data-challenge=operations]').click();await p.waitForTimeout(170);a=await audio();check('cue-switch-independent',!a.cues&&a.feedback.played===n&&a.ambience&&a.flow&&a.soundscape.continuousSources===13);
await p.reload({waitUntil:'networkidle'});a=await audio();check('cue-preference-persists',!a.cues&&a.context==='uncreated');await p.locator('.sonic-settings summary').click();await p.locator('#sound-cues').check();await p.locator('.sonic-settings summary').click();await p.locator('[data-challenge=knowledge]').click();await p.waitForTimeout(200);check('action-unlocks-after-reload',(await audio()).feedback.played===1);
await p.locator('#sound-toggle').click();n=(await audio()).feedback.played;await p.locator('[data-step="2"]').click();await p.waitForTimeout(160);check('master-mute-blocks-action-sound',!(await audio()).enabled&&(await audio()).feedback.played===n&&await p.evaluate(()=>document.body.dataset.motion==='on'));
await p.locator('#sound-toggle').click();await p.waitForTimeout(750);
for(let i=0;i<12;i++){await p.locator('[data-step="'+(i%4)+'"]').click({force:true});await p.waitForTimeout(30);}await p.waitForTimeout(1000);a=await audio();check('rapid-actions-bounded-and-cleaned',a.feedback.maxVoices===1&&!a.feedback.active&&a.feedback.dropped>0,{feedback:a.feedback});
await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(200);a=await audio();check('background-stops-cues-and-field',!a.feedback.active&&a.soundscape===null&&a.context==='suspended');
await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await p.waitForTimeout(250);n=(await audio()).feedback.played;await wheel(10,5);check('return-scroll-does-not-unlock',(await audio()).feedback.played===n&&(await audio()).needsGesture);
await p.locator('[data-challenge=venture]').click();await p.waitForTimeout(300);a=await audio();check('next-action-resumes-no-back-to-hero',a.context==='running'&&!a.needsGesture&&a.contextCount===1&&a.history.at(-1).key==='scenario:venture');
await jump(0);await p.locator('.sonic-settings summary').click();await p.screenshot({path:out+'/mobile-settings.jpg',quality:86});await p.locator('.sonic-settings summary').click();
for(const width of [320,390,680,768,1024,1440]){await p.setViewportSize({width,height:width<=680?844:1000});await p.waitForTimeout(800);check('responsive-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.body.dataset.motion==='on'));}
await p.screenshot({path:out+'/desktop.jpg',quality:82});
const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
