/* Verify actual native scroll, immutable reverse geometry, audio and regressions. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8783/',out=process.env.QA_DIR||'qa-output/boom-'+engine;fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindBoomCelebration?.snapshot().range.start>0&&window.HolyMindCueTimbres?.snapshot().ready);await p.waitForTimeout(1100);
 const snap=()=>p.evaluate(()=>({v:HolyMindBoomCelebration.snapshot(),a:HolyMindAudio.snapshot(),c:HolyMindContinuity.snapshot(),s:HolyMindScrollSound.snapshot()}));
 const jump=async(y)=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1750);};
 const wheel=async(delta,n=45,delay=42)=>{await p.evaluate(()=>{window.__boomSamples=[];window.__boomInterval=setInterval(()=>{const a=HolyMindAudio.snapshot(),v=HolyMindBoomCelebration.snapshot();window.__boomSamples.push({p:v.progress,visible:v.visible,rms:a.celebration?.rms||0,voices:a.celebration?.activeVoices||0,current:a.soundscape?.rms.scroll||0,score:a.score?.running||false,line:HolyMindContinuity.snapshot().lineTravel});},20);});for(let i=0;i<n;i++){await p.mouse.wheel(0,delta);await p.waitForTimeout(delay);}await p.waitForTimeout(160);return p.evaluate(()=>{clearInterval(window.__boomInterval);return window.__boomSamples;});};
 check('release-v20',await p.locator('html').getAttribute('data-build')===(process.env.EXPECTED_BUILD||'boom-v20'));let x=await snap();const range=x.v.range;
 check('docked-signature-window',range.end-range.start>200&&x.c.keys.filter(k=>k.id==='signature').length===2);
 check('silent-no-autoplay',x.a.context==='uncreated'&&!x.v.visible);
 const model=await p.evaluate(()=>{const m=HolyMindBoomModel,b={width:390,height:844,header:73,wordLeft:25,wordTop:330,wordWidth:280,anchor:{x:292,y:400}},values=[0,.10,.25,.40,.55,.72,.87,1],f=values.map(t=>m.frame(t,b)),r=[...values].reverse().map(t=>m.frame(t,b)).reverse();return {same:JSON.stringify(f)===JSON.stringify(r),endClear:f[0].particles.length===0&&f.at(-1).particles.length===0,bursts:m.bursts.length,particles:m.particleCount,finite:f.every(v=>v.particles.every(p=>[p.x,p.y,p.alpha].every(Number.isFinite)))};});
 check('exact-deterministic-reversal',model.same);check('zero-and-complete-are-clear',model.endClear);check('five-authored-bursts',model.bursts===5&&model.particles===135);check('finite-particle-geometry',model.finite);
 await jump(range.start-60);let samples=await wheel(4,80,28);x=await snap();check('scroll-does-not-unlock',x.a.context==='uncreated'&&x.a.celebration===null);
 await jump(0);await p.locator('#sound-toggle').click();await p.waitForTimeout(1200);await jump(range.start-60);
 const before=(await snap()).a.celebration?.played||0;samples=await wheel(4.5,80,48);x=await snap();const ev=x.a.celebration?.history||[];
 check('five-forward-burst-sounds',new Set(ev.filter(e=>e.kind==='burst'&&e.direction===1).map(e=>e.index)).size===5,{events:ev.map(e=>({kind:e.kind,index:e.index}))});
 check('charge-launch-glitter-mapped',ev.some(e=>e.kind==='charge')&&ev.some(e=>e.kind==='launch')&&ev.some(e=>e.kind==='glitter'));
 check('firework-bus-real-output',samples.some(s=>s.rms>.0005),{peakRms:Math.max(...samples.map(s=>s.rms))});
 check('all-bursts-chord-tones',ev.every(e=>e.notes.every(n=>e.harmony.some(c=>c%12===n%12))));
 check('line-current-stays-zero-at-boom',samples.filter(s=>s.p>.08&&s.p<.93).every(s=>s.current<.000001));
 check('piano-score-keeps-moving',samples.some(s=>s.p>.10&&s.p<.9&&s.score));
 const count=x.a.celebration?.played;await p.waitForTimeout(1800);x=await snap();check('idle-no-cue-repeat',x.a.celebration.played===count&&x.a.celebration.activeVoices===0);
 await jump(range.end+20);const h=(await snap()).a.celebration.history.length;samples=await wheel(-4.5,80,48);x=await snap();const back=x.a.celebration.history.slice(h);
 check('reverse-gathers-five-original-bursts',new Set(back.filter(e=>e.kind==='gather').map(e=>e.index)).size===5,{events:back.map(e=>({kind:e.kind,index:e.index}))});
 check('return-flight-and-dot-seal',back.some(e=>e.kind==='return')&&back.some(e=>e.kind==='seal'));
 check('reverse-has-audible-output',samples.some(s=>s.rms>.0004));check('returns-to-rest',x.v.progress===0&&!x.v.visible);
 // Real scrub frames at exactly matching coordinates; waits allow existing 3D scrub to settle.
 const captured=[];for(const t of [.10,.27,.48,.64,.80]){await jump(range.start+(range.end-range.start)*t);x=await snap();const image=await p.locator('.boom-fireworks').evaluate(c=>c.toDataURL());captured.push({t,image,box:x.v.box,geo:x.v.geometry});await p.screenshot({path:out+'/forward-'+String(t).replace('.','')+'.jpg',quality:86});}
 await jump(range.end+25);for(const item of [...captured].reverse()){await jump(range.start+(range.end-range.start)*item.t);x=await snap();const ref=await p.evaluate(({t,box})=>HolyMindBoomModel.frame(t,box),{t:x.v.progress,box:item.box});check('reverse-same-particles-'+item.t,JSON.stringify(ref)===JSON.stringify(item.geo));}
 await jump(range.start+(range.end-range.start)*.64);x=await snap();const drawCount=x.v.draws;await p.waitForTimeout(1100);x=await snap();check('no-perpetual-celebration-loop',x.v.draws===drawCount&&!x.v.ownFrameLoop);
 const stable=await p.locator('.boom-fireworks').evaluate(c=>c.toDataURL());await p.waitForTimeout(650);check('paused-visual-does-not-randomize',stable===await p.locator('.boom-fireworks').evaluate(c=>c.toDataURL()));
 const played=x.a.celebration.played;await jump(range.end);await jump(range.start);await jump(range.end);check('scripted-navigation-does-not-explode-audio',(await snap()).a.celebration.played===played);
 await jump(range.start+(range.end-range.start)*.40);samples=await wheel(2,3,25);let n=(await snap()).a.celebration.played;for(let i=0;i<12;i++){await p.mouse.wheel(0,i%2?-.3:.3);await p.waitForTimeout(30);}check('tiny-jitter-not-audio-avalanche',(await snap()).a.celebration.played<=n+1);
 for(let i=0;i<3;i++){await wheel(20,10,20);await wheel(-20,10,20);}x=await snap();check('rapid-reverse-voices-bounded',x.a.celebration.peakVoices<=5);await p.waitForTimeout(2100);check('all-effect-voices-clean-up',(await snap()).a.celebration.activeVoices===0);
 await p.locator('#sound-toggle').click();await jump(range.start);samples=await wheel(6,45,30);x=await snap();check('muted-celebration-still-visual',!x.a.enabled&&x.a.celebration===null&&samples.some(s=>s.visible));
 await p.locator('#sound-toggle').click();await p.waitForTimeout(900);await jump(range.start+40);await wheel(4,20,35);await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(180);x=await snap();check('hidden-disposes-celebration',x.a.celebration===null&&x.a.context==='suspended');
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await wheel(5,15,25);x=await snap();check('return-needs-new-gesture',x.a.needsGesture&&x.a.celebration===null);
 await p.locator('#sound-toggle').click();await p.waitForTimeout(700);check('one-context-after-resume',(await snap()).a.contextCount===1);
 for(const [width,height] of [[320,760],[390,844],[768,1000],[1440,1000],[844,390]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(1000);const r=(await snap()).v.range;await jump(r.start+(r.end-r.start)*.60);x=await snap();check('bounded-responsive-canvas-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.boom-fireworks').style.pointerEvents!=='auto')&&x.v.range.end>x.v.range.start&&x.v.visible);
  const particles=x.v.geometry?.particles.filter(p=>p.alpha>.03)||[];check('particles-horizontal-safe-'+width,particles.every(v=>v.x>=0&&v.x<=width));check('fireworks-above-word-'+width,particles.every(v=>v.y<x.v.box.wordTop+5),{lowest:Math.max(...particles.map(p=>p.y)),wordTop:x.v.box.wordTop});await p.screenshot({path:out+'/view-'+width+'.jpg',quality:85});
 }
 check('no-extra-audio-context',x.a.contextCount===1);check('always-on-motion-preserved',await p.evaluate(()=>document.body.dataset.motion==='on'&&!document.querySelector('#motion-toggle')));
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
