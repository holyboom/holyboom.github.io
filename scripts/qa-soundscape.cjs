/* Test real output buses, trusted input, suppression, lifecycle and preservation. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8777/',out=process.env.QA_DIR||'qa-output/soundscape-'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,pass);};
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindAudio?.snapshot().warm===14&&window.HolyMindAssemblyScroll?.enabled());await p.waitForTimeout(700);
 const snap=()=>p.evaluate(()=>({a:HolyMindAudio.snapshot(),s:HolyMindScrollSound.snapshot(),n:HolyMindNeural.snapshot()}));
 const tap=async()=>{const r=await p.locator('[data-brain-target=hero]').boundingBox();await p.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.45);};
 const wheel=async(d,count=8,ms=55)=>{for(let i=0;i<count;i++){await p.mouse.wheel(0,d);await p.waitForTimeout(ms);}};
 const jump=async y=>{await p.waitForTimeout(180);await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForFunction(target=>{const c=HolyMindContinuity.snapshot(),wanted=Math.max(0,Math.min(target,document.documentElement.scrollHeight-innerHeight));return Math.abs(scrollY-wanted)<1.5&&Math.abs(c.renderedScrollY-scrollY)<1.5&&!c.running;},y,{timeout:12000});await p.waitForTimeout(100);};
 const story=()=>p.evaluate(()=>HolyMindAssemblyScroll.snapshot());
 check('release-v14',await p.locator('html').getAttribute('data-build')==='full-current-v14');
 let v=await snap();check('load-has-no-context-or-sound',v.a.context==='uncreated'&&v.a.played===0&&v.a.soundscape===null);
 await wheel(25,5);v=await snap();check('scroll-cannot-unlock-audio',v.a.context==='uncreated'&&v.a.soundscape===null);
 await jump(0);await p.locator('#sound-toggle').click();await p.waitForTimeout(2000);v=await snap();
 check('explicit-start-unlocks-one-context',v.a.unlocked&&v.a.context==='running'&&v.a.contextCount===1);
 check('ambient-has-real-output-while-idle',v.a.soundscape?.rms.ambient>.0005,{rms:v.a.soundscape?.rms});
 check('idle-scroll-bus-is-silent',v.a.soundscape?.rms.scroll<.00001&&v.s.activity===0);
 check('no-motion-toggle-restored',await p.locator('#motion-toggle,.hero-actions').count()===0&&v.n.running);
 await tap();await p.waitForTimeout(70);v=await snap();check('tap-preset-still-matches-visual',v.a.lastStyle===v.n.lastStyle);
 check('tap-ducks-both-background-buses',v.a.soundscape.actual.ambientDuck<.65&&v.a.soundscape.actual.scrollDuck<.45,{actual:v.a.soundscape.actual});
 await p.waitForTimeout(1000);v=await snap();check('duck-recovers-without-restarting-scene',v.a.soundscape.actual.ambientDuck>.98&&v.a.soundscape.actual.scrollDuck>.98);
 await wheel(30,10);v=await snap();check('native-scroll-produces-current',v.s.activity>.1&&v.s.direction===1&&v.a.soundscape.rms.scroll>.0002,{activity:v.s.activity,rms:v.a.soundscape.rms});
 await p.waitForTimeout(1500);v=await snap();check('pause-fades-current-not-field',v.a.soundscape.rms.scroll<.0001&&v.a.soundscape.rms.ambient>.0005&&v.s.activity===0,{rms:v.a.soundscape.rms});
 check('no-idle-scroll-frame-loop',!v.s.running);
 await wheel(-26,7);v=await snap();check('reverse-gathers-not-retriggers',v.s.direction===-1&&v.s.activity>.05&&v.a.soundscape.direction===-1);
 await p.waitForTimeout(1400);const played=v.a.played;await wheel(1,4,65);v=await snap();check('tiny-jitter-adds-no-one-shots',v.a.played===played&&v.a.soundscape.oneShots===0);
 await p.waitForTimeout(1500);let st=await story();await jump(st.start+(st.end-st.start)*.43);v=await snap();
 check('programmatic-reposition-no-swoosh',v.s.activity===0&&v.a.soundscape.rms.scroll<.0001);
 const precise1=v.s.progress;await jump(st.start+(st.end-st.start)*.4304);v=await snap();check('continuous-progress-not-integer-percent',v.s.progress!==precise1&&Number.isFinite(v.s.progress));
 await p.locator('#assembly-control').focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>HolyMindScrollSound.snapshot().lastInput==='manual-scrub'&&HolyMindScrollSound.snapshot().gesturePeak>0,null,{timeout:5000});v=await snap();check('native-range-input-is-sonified',v.s.lastInput==='manual-scrub'&&v.s.gesturePeak>0,{scroll:v.s});
 await p.waitForTimeout(1700);await jump(st.start+(st.end-st.start)*.72);await wheel((st.end-st.start)*.24/12,12,55);await p.waitForTimeout(180);v=await snap();
 const cueCount=v.a.history.filter(h=>h.kind==='resolution').length;
 check('completion-uses-new-settle-not-tap',cueCount===1&&v.a.history.at(-1).id==='current-resolve',{history:v.a.history.slice(-3),scroll:v.s});
 check('old-four-milestones-removed',v.a.history.every(h=>h.kind!=='milestone'));
 for(let i=0;i<4;i++){await p.mouse.wheel(0,-5);await p.mouse.wheel(0,5);await p.waitForTimeout(100);}v=await snap();check('completion-boundary-does-not-repeat',v.a.history.filter(h=>h.kind==='resolution').length===cueCount);
 await p.waitForTimeout(1800);st=await story();await wheel(-(st.end-st.start)*.94/24,24,60);await p.waitForTimeout(160);v=await snap();
 check('reverse-progress-reconnects',v.s.progress<.01&&v.s.direction===-1);
 check('reverse-cue-is-not-forward-cue',v.a.history.some(h=>h.id==='current-reconnect'));
 await p.waitForTimeout(1500);await jump(st.end+1000);await p.waitForTimeout(1800);v=await snap();check('full-site-continues-after-assembly',v.s.scope===1&&v.a.soundscape.rms.ambient>.0003&&v.a.soundscape.rms.scroll<.0001,{rms:v.a.soundscape.rms});
 await jump(0);await p.waitForTimeout(1500);await p.locator('.sonic-settings>summary').click();await p.screenshot({path:out+'/mobile-sound-controls.jpg',quality:85});
 await p.locator('#sound-ambience').uncheck();await p.waitForTimeout(1500);v=await snap();check('ambience-switch-controls-only-field',!v.a.ambience&&v.a.flow&&v.a.soundscape.rms.ambient<.0001&&v.n.running);
 await p.locator('#sound-ambience').check();await p.locator('#sound-flow').uncheck();await wheel(35,8);v=await snap();check('scroll-switch-controls-only-current',v.a.ambience&&!v.a.flow&&v.a.soundscape.rms.scroll<.0001);
 await p.locator('#sound-flow').check();await jump(0);await p.locator('.sonic-settings>summary').click();
 await p.locator('#sound-toggle').click();let a=await snap();await tap();await p.waitForTimeout(230);v=await snap();check('mute-kills-audio-not-visuals',!v.a.enabled&&v.a.soundscape===null&&v.a.played===a.a.played&&v.n.burstCount>a.n.burstCount&&v.n.running);
 await p.reload({waitUntil:'networkidle'});v=await snap();check('mute-persists-and-no-context',!v.a.enabled&&v.a.context==='uncreated');
 await p.locator('#sound-toggle').click();await p.waitForTimeout(700);await p.locator('.sonic-settings>summary').click();await p.locator('#sound-volume').fill('0');await p.reload({waitUntil:'networkidle'});v=await snap();check('zero-master-volume-persists',v.a.volume===0&&v.a.context==='uncreated');
 await p.locator('.sonic-settings>summary').click();await p.locator('#sound-volume').fill('48');await p.locator('.sonic-settings>summary').click();await p.locator('#sound-toggle').click();await p.waitForTimeout(600);
 const oldCount=(await snap()).a.played;await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(200);v=await snap();check('background-stops-all-audio-sources',v.a.soundscape===null&&v.a.voices===0&&v.a.context==='suspended');
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await wheel(25,5);v=await snap();check('return-scroll-cannot-resume-or-replay',v.a.needsGesture&&v.a.context==='suspended'&&v.a.played===oldCount);
 await jump(0);await p.locator('#sound-toggle').click();await p.waitForTimeout(700);v=await snap();check('fresh-explicit-gesture-resumes-one-context',!v.a.needsGesture&&v.a.context==='running'&&v.a.contextCount===1&&v.a.soundscape,{audio:v.a,neural:v.n});
 for(let i=0;i<8;i++){await tap();await p.waitForTimeout(195);}await p.waitForTimeout(180);v=await snap();check('rapid-taps-remain-bounded',v.a.peakVoices<=3&&v.n.activeBursts<=3&&v.a.soundscape?.continuousSources===13);
 await p.waitForTimeout(2200);v=await snap();check('tap-voices-clean-up-with-field-active',v.a.voices===0&&v.a.soundscape?.rms.ambient>.0005);
 for(const w of [320,390,430,680,768,1024,1440]){await p.setViewportSize({width:w,height:w<=680?844:1000});await jump(0);const r=await p.evaluate(()=>{const b=document.querySelector('.neural-stage').getBoundingClientRect(),c=document.querySelector('.hero-copy').getBoundingClientRect();return {over:document.documentElement.scrollWidth>innerWidth,first:b.top<c.top,side:c.left<b.left&&b.top<c.bottom};});check('layout-preserved-'+w,!r.over&&(w<=680?r.first:r.side));}
 await p.screenshot({path:out+'/desktop-hero.jpg',quality:85});
 const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});touch.on('pageerror',e=>errors.push('touch: '+e.message));await touch.goto(base,{waitUntil:'networkidle'});await touch.waitForFunction(()=>HolyMindAudio.snapshot().warm===14);const rr=await touch.locator('[data-brain-target=hero]').boundingBox();await touch.touchscreen.tap(rr.x+rr.width*.5,rr.y+rr.height*.45);await touch.waitForTimeout(900);check('mobile-trusted-tap-starts-field',await touch.evaluate(()=>HolyMindAudio.snapshot().context==='running'&&HolyMindAudio.snapshot().soundscape.rms.ambient>0));await touch.close();
 const q=await browser.newPage({viewport:{width:390,height:844}});q.on('pageerror',e=>errors.push('studio: '+e.message));await q.goto(new URL('qa/full-current-v14.html',base).href,{waitUntil:'networkidle'});await q.waitForFunction(()=>!document.getElementById('begin').disabled);await q.locator('#begin').click();await q.waitForTimeout(900);check('studio-starts-real-production-graph',await q.evaluate(()=>document.getElementById('showcase').contentWindow.HolyMindAudio.snapshot().context==='running'));
 for(const mode of ['taps','bed','full']){await q.locator('[data-mix='+mode+']').click();const mix=await q.evaluate(()=>document.getElementById('showcase').contentWindow.HolyMindAudio.snapshot());check('studio-comparison-'+mode,mix.ambience===(mode!=='taps')&&mix.flow===(mode==='full')&&mix.volume===.48);}
 check('studio-three-matched-previews',await q.locator('audio').count()===3);await q.screenshot({path:out+'/mobile-studio.jpg',quality:85,fullPage:true});await q.setViewportSize({width:1440,height:1000});await q.screenshot({path:out+'/desktop-studio.jpg',quality:85});await q.close();
 const silent=await browser.newPage({viewport:{width:390,height:844}});await silent.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});silent.on('pageerror',e=>errors.push('noaudio: '+e.message));await silent.goto(base,{waitUntil:'networkidle'});const sr=await silent.locator('[data-brain-target=hero]').boundingBox();await silent.mouse.click(sr.x+sr.width*.5,sr.y+sr.height*.45);await silent.waitForTimeout(250);check('no-audio-support-preserves-motion',await silent.evaluate(()=>HolyMindNeural.snapshot().burstCount===1&&HolyMindNeural.snapshot().running&&document.body.dataset.sound==='unsupported'));await silent.close();
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
