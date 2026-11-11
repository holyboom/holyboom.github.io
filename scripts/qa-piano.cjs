/* Piano provenance, sample-first output, scene-specific phrases and failure behavior. */
const {chromium,webkit}=require('playwright'),fs=require('fs'),crypto=require('crypto');
(async()=>{const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8779/',out=process.env.QA_DIR||'qa-output/piano-'+engine;fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],check=(name,pass,detail={})=>{checks.push({name,pass:!!pass,...detail});console.log(name,!!pass);};
const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindCueTimbres?.snapshot().ready&&HolyMindAudio.snapshot().warm===14);await p.waitForTimeout(500);
 check('sample-load-does-not-create-audio-context',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
 check('seven-real-key-bank',await p.evaluate(()=>HolyMindCueTimbres.snapshot().notes===7&&HolyMindCueTimbres.snapshot().ready));
 check('eleven-moment-profiles',await p.evaluate(()=>HolyMindCueTimbres.profiles.length===11));
 check('piano-attribution-present',await p.locator('a[href="audio-credits.html"]').count()===1);
 await p.locator('[data-challenge=knowledge]').click();await p.waitForTimeout(180);
 check('first-action-is-piano-in-workbench',await p.evaluate(()=>{const e=HolyMindAudio.snapshot().history.at(-1);return e.kind==='cue'&&e.scene==='workbench'&&e.notes.length===2&&e.texture==='focus';}));
 check('real-piano-bus-produces-signal',await p.evaluate(()=>HolyMindAudio.snapshot().feedback.maxRms>.001));
 // Read all recorded/drawn sound variants at the same sample rate, inspect actual PCM.
 const metrics=await p.evaluate(()=>HolyMindCueTimbres.profiles.map(profile=>{
  const d=HolyMindCueTimbres.render('dock',0,32000,{scene:profile.id}),r=HolyMindCueTimbres.render('return',0,32000,{scene:profile.id});let peak=0,sum=0,diff=0,tail=0;for(let i=0;i<d.samples.length;i++){peak=Math.max(peak,Math.abs(d.samples[i]));sum+=d.samples[i]**2;if(i>d.samples.length*.6)tail+=d.samples[i]**2;if(i<r.samples.length)diff+=Math.abs(d.samples[i]-r.samples[i]);}
  return {scene:d.scene,notes:d.notes,returnNotes:r.notes,texture:d.texture,textureRatio:d.textureRmsRatio,duration:d.duration,peak,rms:Math.sqrt(sum/d.samples.length),tail,different:diff>1,fingerprint:Array.from(d.samples.filter((_,i)=>i%79===0))};
 }));
 const hashes=[];for(const r of metrics){hashes.push(crypto.createHash('sha256').update(JSON.stringify(r.fingerprint)).digest('hex'));delete r.fingerprint;check('piano-and-material-'+r.scene,r.notes.length>=2&&r.duration>=.9&&r.duration<=1.5&&r.peak<=.321&&r.rms>.005&&r.textureRatio<=.101&&r.textureRatio>.02&&r.different,{metric:r});}
 check('eleven-distinct-moments',new Set(hashes).size===11);
 const mappings=await p.evaluate(()=>['orbit','ribbon','assembly','system','skills','gallery','services','delivery','signature','portal'].map(id=>({id,scene:HolyMindCueTimbres.resolveScene('dock:'+id+':1','arrival','hero')})));
 check('real-dock-to-moment-map',JSON.stringify(mappings.map(x=>x.scene))===JSON.stringify(['orbit','ribbon','assembly','workbench','instrument','gallery','services','services','about','contact']),{mappings});
 await p.waitForTimeout(1300);
 for(const scene of ['orbit','assembly','about','contact']){
  await p.evaluate(scene=>HolyMindAudio.cue('dock',{scene,kind:'preview',priority:3,key:'qa-moment:'+scene}),scene);await p.waitForTimeout(240);
  const a=await p.evaluate(()=>HolyMindAudio.snapshot());check('live-phrase-'+scene,a.history.at(-1).scene===scene&&a.feedback.rms>.0001,{event:a.history.at(-1),rms:a.feedback.rms});await p.waitForTimeout(1350);
 }
 // Actual service/about controls choose their visual section, not the hero/default.
 await p.locator('.approach-list details').nth(1).locator('summary').click();await p.waitForTimeout(180);check('service-action-has-service-piano',await p.evaluate(()=>HolyMindAudio.snapshot().history.at(-1).scene==='services'));
 await p.waitForTimeout(550);await p.locator('.about-story summary').click();await p.waitForTimeout(180);check('about-action-has-warm-piano',await p.evaluate(()=>{const e=HolyMindAudio.snapshot().history.at(-1);return e.scene==='about'&&e.texture==='warmth';}));
 await p.waitForTimeout(1500);check('piano-tail-cleans-up',await p.evaluate(()=>!HolyMindAudio.snapshot().feedback.active&&HolyMindAudio.snapshot().feedback.retiring===0));
 for(let i=0;i<14;i++){await p.evaluate(i=>HolyMindAudio.cue('select',{scene:i%2?'workbench':'gallery',priority:3,key:'piano-stress:'+i}),i);await p.waitForTimeout(180);}
 check('overlapping-release-bounded',await p.evaluate(()=>HolyMindAudio.snapshot().feedback.retiring<=1&&HolyMindAudio.snapshot().contextCount===1));await p.waitForTimeout(1400);
 await p.evaluate(()=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:0,behavior:'instant'});});await p.waitForTimeout(1300);{const r=await p.locator('[data-brain-target=hero]').boundingBox();await p.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.45);}await p.waitForTimeout(200);check('original-brain-sound-separate',await p.evaluate(()=>HolyMindAudio.snapshot().lastStyle===HolyMindNeural.snapshot().lastStyle&&HolyMindTimbres.version==='electric-v12'));
 await p.locator('.sonic-settings summary').click();await p.screenshot({path:out+'/mobile-controls.jpg',quality:85});
 const q=await browser.newPage({viewport:{width:390,height:844}});q.on('pageerror',e=>errors.push('studio: '+e.message));await q.goto(new URL('qa/piano-v16.html',base).href,{waitUntil:'networkidle'});await q.waitForFunction(()=>document.querySelectorAll('[data-moment]').length===11);
 check('studio-eleven-real-moment-buttons',await q.locator('[data-moment]').count()===11);
 await q.locator('[data-moment=about]').click();await q.waitForTimeout(240);check('studio-hears-real-about-instrument',await q.evaluate(()=>{const a=document.getElementById('showcase').contentWindow.HolyMindAudio.snapshot();return a.history.at(-1).scene==='about'&&a.feedback.rms>0;}));
 await q.waitForTimeout(1300);await q.locator('#piano-direction').selectOption('reverse');await q.locator('[data-moment=about]').click();await q.waitForTimeout(240);check('studio-return-uses-reversed-note-order',await q.evaluate(()=>{const e=document.getElementById('showcase').contentWindow.HolyMindAudio.snapshot().history.at(-1);return e.id==='return'&&e.notes[0]===64&&e.notes[1]===57;}));
 await q.screenshot({path:out+'/mobile-studio.jpg',quality:85,fullPage:true});await q.setViewportSize({width:1440,height:1000});await q.screenshot({path:out+'/desktop-studio.jpg',quality:85});await q.close();
 // Bank fetch failure is quiet and does not replace the request with old beeps.
 const missing=await browser.newPage({viewport:{width:390,height:844}});missing.on('pageerror',e=>errors.push('missing-bank: '+e.message));await missing.route('**/keys.pcm',r=>r.abort());await missing.goto(base,{waitUntil:'networkidle'});await missing.locator('[data-challenge=knowledge]').click();await missing.waitForTimeout(600);check('missing-bank-no-beep-no-runtime-crash',await missing.evaluate(()=>HolyMindCueTimbres.snapshot().status==='failed'&&HolyMindAudio.snapshot().feedback.played===0&&document.body.dataset.motion==='on'));await missing.close();
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
