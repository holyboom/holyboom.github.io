/* Full journey coverage: native input, measured buses and matched reverse positions. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8777/',out=process.env.QA_DIR||'qa-output/full-current-'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindScrollSound?.snapshot().stations.length===11&&window.HolyMindAssemblyScroll?.enabled());await p.waitForTimeout(900);
 const snap=()=>p.evaluate(()=>({a:HolyMindAudio.snapshot(),s:HolyMindScrollSound.snapshot(),y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
 const go=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1600);await p.waitForFunction(()=>!HolyMindScrollSound.snapshot().running&&ScrollTrigger.getAll().every(t=>!t.getTween?.()?.isActive()),null,{timeout:15000});};
 const wheel=async(d,count=6)=>{for(let i=0;i<count;i++){await p.mouse.wheel(0,d);await p.waitForTimeout(60);}};
 check('full-site-release',await p.locator('html').getAttribute('data-build')==='full-current-v14');
 check('eleven-scene-registry',await p.evaluate(()=>HolyMindSoundScenes.profiles.length===11));
 check('silent-load',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
 await p.locator('#sound-toggle').click();await p.waitForTimeout(1400);
 const route=(await snap()).s.stations;
 check('strict-scene-order',route.every((s,i)=>Number.isFinite(s.at)&&(!i||s.at>route[i-1].at)));
 const visits=[];
 for(let i=0;i<route.length;i++){
  const station=route[i],end=route[i+1]?.at??(await snap()).max;
  const y=station.id==='hero'?0:station.at+Math.min(70,(end-station.at)*.22);
  await go(y);let v=await snap();visits.push({id:station.id,scene:v.s.scene,rms:v.a.soundscape?.rms.ambient,mix:{morph:v.s.morph,fieldLevel:v.s.fieldLevel,openness:v.s.openness}});
  check('ambient-'+station.id,v.s.scene===station.id&&v.s.scope===1&&v.a.soundscape?.rms.ambient>.00015,{scene:v.s.scene,rms:v.a.soundscape?.rms.ambient});
  check('one-instrument-'+station.id,v.a.contextCount===1&&v.a.soundscape?.continuousSources===13&&v.a.soundscape?.oneShots===0);
  const direction=station.id==='footer'?-1:1;
  // A native wheel, never a forged scroll event, produces the measured current.
  await wheel(direction*(station.id==='footer'?7:14),5);v=await snap();
  check('current-'+station.id,v.s.activity>.015&&v.s.direction===direction&&v.a.soundscape?.rms.scroll>.00004,{scene:v.s.scene,activity:v.s.activity,direction:v.s.direction,rms:v.a.soundscape?.rms.scroll});
  await p.waitForTimeout(1350);v=await snap();
  check('pause-'+station.id,v.s.activity===0&&!v.s.running&&v.a.soundscape.rms.scroll<.00008&&v.a.soundscape.rms.ambient>.00015);
  if(['instrument','gallery','about','contact','footer'].includes(station.id))await p.screenshot({path:out+'/'+station.id+'.jpg',quality:82});
 }
 check('no-chapter-chimes',await p.evaluate(()=>HolyMindAudio.snapshot().played===1&&HolyMindAudio.snapshot().history.every(h=>h.kind==='enable')));
 // Coordinate-to-sound is path-independent; audio smoothing is allowed to settle.
 for(let i=4;i<route.length-1;i++){
  const y=(route[i].at+route[i+1].at)*.5;
  await go(y-140);await wheel(20,7);await p.waitForTimeout(1200);let forward=await snap();const actual=forward.y;
  await go(actual+140);await wheel(-20,7);await p.waitForTimeout(1200);let reverse=await snap();
  const keys=['fieldLevel','currentLevel','openness','textureLevel','voiceProgress','morph'];
  const delta=Math.max(...keys.map(k=>Math.abs(forward.s[k]-reverse.s[k])));
  check('reversible-material-'+route[i].id,Math.abs(forward.y-reverse.y)<2&&delta<.005,{delta,forwardY:forward.y,reverseY:reverse.y});
 }
 // Small adjacent samples near a seam cannot switch off or restart a bus.
 const seam=await p.evaluate(()=>{const s=HolyMindScrollSound.snapshot(),l={orbit:s.stations.find(x=>x.id==='orbit').at+innerHeight*.25,ribbon:s.stations.find(x=>x.id==='ribbon').at+innerHeight*.25,start:s.start,end:s.end,height:innerHeight,positions:Object.fromEntries(s.stations.slice(4).map(x=>[x.id,x.at]))};let max=0,all=true;for(const x of s.stations.slice(4)){const a=HolyMindSoundScenes.position(x.at-.5,l),b=HolyMindSoundScenes.position(x.at+.5,l);for(const key of ['fieldLevel','currentLevel','openness','textureLevel','voiceProgress','morph'])max=Math.max(max,Math.abs(a[key]-b[key]));all=all&&a.scope===1&&b.scope===1;}return {max,all};});
 check('no-discontinuous-chapter-seams',seam.all&&seam.max<.01,seam);
 // Responsive/dynamic discovery updates downstream coordinates, not the sound graph.
 await p.locator('#show-skills').click();await p.waitForTimeout(1800);let v=await snap();
 check('expanded-gallery-keeps-34-skills',await p.locator('.skill-card').count()===34);
 check('gallery-remeasures-services',v.s.stations.find(x=>x.id==='services').at>route.find(x=>x.id==='services').at&&v.s.measuredHeight===await p.evaluate(()=>document.documentElement.scrollHeight));
 const expanded=v.s.stations.find(x=>x.id==='gallery');await go(expanded.at+500);await wheel(18,5);v=await snap();
 check('expanded-gallery-still-has-current',v.s.scene==='gallery'&&v.a.soundscape.rms.scroll>.00005);
 await p.waitForTimeout(1400);await p.locator('[data-filter=verify]').click();await p.waitForTimeout(1600);v=await snap();
 check('filter-layout-does-not-swoosh',v.s.activity===0&&v.a.soundscape.rms.scroll<.0001&&v.a.contextCount===1);
 await p.locator('[data-filter=all]').click();await p.waitForTimeout(1200);
 await p.locator('#instrument-open').click();await p.waitForTimeout(1000);v=await snap();
 check('dialog-ducks-field',await p.locator('#skill-dialog').isVisible()&&v.a.soundscape.focus<.5&&v.a.soundscape.rms.ambient>.00005);
 await p.mouse.wheel(0,160);await p.waitForTimeout(250);v=await snap();check('dialog-scroll-no-page-current',v.s.activity===0&&v.a.soundscape.rms.scroll<.0001);
 await p.keyboard.press('Escape');await p.waitForTimeout(1200);v=await snap();check('dialog-close-restores-field',v.a.soundscape.focus===1&&v.a.contextCount===1);
 const about=v.s.stations.find(x=>x.id==='about');await go(about.at+100);await p.locator('.about-story summary').click();await p.waitForTimeout(1200);v=await snap();
 check('about-disclosure-reading-space',v.s.focus<1&&v.s.focus>.5&&v.s.scope===1,{state:v.s,rect:await p.locator('.about-story').boundingBox()});
 await p.locator('.about-story summary').click();await p.waitForTimeout(900);
 // Starting directly at the footer also works without prior-scene initialization.
 const deep=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});deep.on('pageerror',e=>errors.push('deep: '+e.message));await deep.goto(base+'#connect',{waitUntil:'networkidle'});await deep.waitForTimeout(1300);
 check('deep-link-does-not-autoplay',await deep.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
 await deep.locator('#sound-toggle').click();await deep.waitForTimeout(1300);
 check('deep-link-gesture-starts-full-soundscape',await deep.evaluate(()=>HolyMindAudio.snapshot().soundscape.rms.ambient>.00015&&HolyMindScrollSound.snapshot().scope===1));await deep.close();
 // Keep ambience and scroll switches global, regardless of current scene.
 await go(0);await p.locator('.sonic-settings summary').click();await p.locator('#sound-ambience').uncheck();await p.locator('.sonic-settings summary').click();await p.waitForTimeout(700);
 const contact=(await snap()).s.stations.find(x=>x.id==='contact');await go(contact.at+70);await wheel(15,5);v=await snap();
 check('global-ambience-off-retains-late-scroll',v.a.soundscape.rms.ambient<.00008&&v.a.soundscape.rms.scroll>.00004);
 await p.locator('#sound-toggle').click();await p.waitForTimeout(200);v=await snap();check('late-scene-mute-removes-all-buses',!v.a.enabled&&v.a.soundscape===null&&await p.evaluate(()=>document.body.dataset.motion==='on'));
 await p.locator('#sound-toggle').click();await p.waitForTimeout(600);
 for(const width of [320,390,680,768,1024,1440]){
  await p.setViewportSize({width,height:width<700?844:1000});await p.waitForTimeout(1100);await go(0);v=await snap();
  check('responsive-scene-map-'+width,v.s.stations.length===11&&v.s.stations.every((x,i)=>!i||x.at>v.s.stations[i-1].at)&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{stations:v.s.stations});
  await go(v.max);v=await snap();check('footer-covered-'+width,v.s.scope===1&&v.s.scene==='footer');
 }
 const q=await browser.newPage({viewport:{width:390,height:844}});q.on('pageerror',e=>errors.push('studio: '+e.message));await q.goto(new URL('qa/full-current-v14.html',base).href,{waitUntil:'networkidle'});await q.waitForFunction(()=>!document.querySelector('#begin').disabled);
 check('studio-all-eleven-chapters',await q.locator('#chapter option').count()===11);
 await q.locator('#begin').click();await q.waitForTimeout(1100);await q.locator('#chapter').selectOption('services');await q.waitForTimeout(1800);
 check('studio-downstream-live-graph',await q.evaluate(()=>{const w=document.querySelector('#showcase').contentWindow;return w.HolyMindScrollSound.snapshot().scene==='services'&&w.HolyMindAudio.snapshot().soundscape.rms.ambient>0&&w.HolyMindAudio.snapshot().contextCount===1;}));
 await q.screenshot({path:out+'/mobile-studio.jpg',fullPage:true,quality:82});await q.setViewportSize({width:1440,height:1000});await q.waitForTimeout(900);await q.screenshot({path:out+'/desktop-studio.jpg',quality:82});await q.close();
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,visits,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
