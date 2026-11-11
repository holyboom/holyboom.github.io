/* Always-active regression: deliberately emulate Reduce Motion and legacy off preferences. */
const {chromium,webkit}=require('playwright');const fs=require('fs');const crypto=require('crypto');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8772/',out=process.env.QA_DIR||'qa-output/always-'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 const checks=[],errors=[];const check=(name,pass,details={})=>{checks.push({name,pass,...details});console.log(name,pass);};
 const init=async(profile)=>{
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:profile});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.addInitScript(()=>localStorage.setItem('holyboom-motion','off'));
  await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindNeural?.snapshot().paths===46&&document.body.dataset.ambient==='active');await p.waitForTimeout(400);return p;
 };
 const pixels=async(p,selector='#neural-sparks')=>crypto.createHash('sha256').update(await p.locator(selector).evaluate(c=>c.toDataURL())).digest('hex');
 for(const profile of ['reduce','no-preference']){
  const p=await init(profile),state=await p.evaluate(()=>({build:document.documentElement.dataset.build,policy:document.body.dataset.motionPolicy,profile:document.body.dataset.motionProfile,branches:HolyMindNeural.snapshot().branches,triggers:ScrollTrigger.getAll().length,breathe:getComputedStyle(document.querySelector('.neural-core')).animationName}));
  check(profile+'-always-full-policy',state.build==='always-v9'&&state.policy==='always'&&state.profile==='full'&&state.branches===12&&state.triggers>0,{state});
  check(profile+'-no-ui-toggle-or-hero-shortcuts',await p.locator('#motion-toggle,.hero-actions').count()===0);
  check(profile+'-brain-breathing',state.breathe==='mind-breathe');
  const hash=[],frames=[];for(let i=0;i<4;i++){hash.push(await pixels(p));frames.push(await p.evaluate(()=>HolyMindNeural.snapshot().frames));await p.waitForTimeout(1600);}
  check(profile+'-continuous-six-seconds-with-zero-input',new Set(hash).size===4&&frames.every((f,i)=>!i||f>frames[i-1])&&await p.evaluate(()=>scrollY===0),{frames});
  check(profile+'-mobile-brain-first',await p.evaluate(()=>document.querySelector('.neural-stage').getBoundingClientRect().top<document.querySelector('.hero-copy').getBoundingClientRect().top));
  await p.screenshot({path:out+'/mobile-'+profile+'.jpg',quality:85});
  await p.emulateMedia({reducedMotion:profile==='reduce'?'no-preference':'reduce'});await p.waitForTimeout(500);
  check(profile+'-system-setting-cannot-stop-motion',await p.evaluate(()=>document.body.dataset.motionProfile==='full'&&ScrollTrigger.getAll().length>0&&HolyMindNeural.snapshot().running));
  // Explicit browser lifecycle events are a smoke check; real back navigation is also exercised below.
  await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));const paused=await p.evaluate(()=>HolyMindNeural.snapshot().frames);await p.waitForTimeout(200);
  check(profile+'-pagehide-stops-hidden-work',paused===await p.evaluate(()=>HolyMindNeural.snapshot().frames));
  await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await p.waitForTimeout(500);
  check(profile+'-pageshow-resumes-without-tap',await p.evaluate(n=>HolyMindNeural.snapshot().running&&HolyMindNeural.snapshot().frames>n,paused));
  await p.close();
 }
 const p=await init('reduce');
 const go=async selector=>{await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(1200);};
 for(const [name,scene,target,pseudo,prop] of [
  ['orbit','#mind-flow','.ambient-orbit',null,'strokeDashoffset'],
  ['ribbon','#signal-crossing','.ambient-band-light',null,'transform'],
  ['assembly','#system-assembly','.ambient-circuit',null,'strokeDashoffset'],
  ['skill','#skill-instrument','.shard-surface','::after','borderTopColor'],
  ['service','#what-i-do','.service-outline',null,'borderTopColor'],
  ['signature','#about','.signature-period',null,'textShadow'],
  ['portal','#connect','.ambient-portal',null,'strokeDashoffset']
 ]){
  await go(scene);await p.locator(target).first().evaluate(el=>{const r=el.getBoundingClientRect();if(r.top<90||r.bottom>innerHeight)scrollTo({top:scrollY+r.top-innerHeight*.42,behavior:'instant'});});await p.waitForTimeout(1100);
  const read=()=>p.locator(target).first().evaluate((e,{pseudo,prop})=>({v:getComputedStyle(e,pseudo)[prop],play:getComputedStyle(e,pseudo).animationPlayState}),{pseudo,prop});
  const a=await read();await p.waitForTimeout(900);const b=await read();
  check(name+'-ambient-moves-without-scroll',a.v!==b.v&&b.play==='running',{a,b});
 }
 await go('#system-assembly');await p.locator('#assembly-control').fill('0');const z0=await p.locator('.plane-intent').evaluate(e=>getComputedStyle(e).transform);await p.locator('#assembly-control').fill('100');await p.waitForTimeout(2000);const z1=await p.locator('.plane-intent').evaluate(e=>getComputedStyle(e).transform);
 check('slider-right-opens-callouts',z0!==z1&&await p.evaluate(()=>HolyMindAssembly.snapshot().reveals.every(n=>n===1)));
 await p.locator('[data-callout=intent]').click();check('callout-still-focuses',await p.locator('[data-callout=intent]').getAttribute('aria-pressed')==='true');
 const diagnostics=await p.evaluate(()=>{const v=document.querySelector('.assembly-view').getBoundingClientRect();return [...document.querySelectorAll('.layer-pin')].map(pin=>{const line=document.querySelector(`[data-leader=${pin.dataset.pin}] .leader-line`),r=pin.getBoundingClientRect(),p=line.getPointAtLength(0);return Math.hypot(p.x-r.left-r.width/2+v.left,p.y-r.top-r.height/2+v.top);});});
 check('line-anchors-remain-attached',diagnostics.every(x=>x<1),{errors:diagnostics});
 await p.locator('#assembly-control').fill('0');await p.waitForTimeout(500);check('slider-left-retracts',await p.evaluate(()=>HolyMindAssembly.snapshot().reveals.every(n=>n===0)));
 await go('#skill-instrument');await p.locator('#next-skill').click();check('skill-control-unaffected',await p.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill')==='chain-of-verification');await p.locator('#instrument-open').click();check('dialog-still-opens',await p.locator('#skill-dialog').isVisible());await p.keyboard.press('Escape');
 for(const width of [320,390,680,768,1024,1440]){
  await p.setViewportSize({width,height:width<=680?844:1000});await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(900);
  const layout=await p.evaluate(()=>{const b=document.querySelector('.neural-stage').getBoundingClientRect(),c=document.querySelector('.hero-copy').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,first:b.top<c.top,side:c.left<b.left&&b.top<c.bottom};});
  check('layout-preserved-'+width,!layout.overflow&&(width<=680?layout.first:layout.side),{layout});
 }
 await p.screenshot({path:out+'/desktop.jpg',quality:85});
 await go('#connect');await p.waitForTimeout(1300);const f=await p.evaluate(()=>HolyMindNeural.snapshot().frames);await p.waitForTimeout(500);check('offscreen-brain-stops-work',f===await p.evaluate(()=>HolyMindNeural.snapshot().frames));
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(700);check('brain-resumes-on-return',await p.evaluate(n=>HolyMindNeural.snapshot().frames>n,f));
 await p.goto(new URL('profile-schema.json',base).href);await p.goBack({waitUntil:'networkidle'});await p.waitForTimeout(900);check('real-back-navigation-resumes',await p.evaluate(()=>HolyMindNeural.snapshot().running));
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({engine,checks:checks.length,failed,errors}));await browser.close();if(failed.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
