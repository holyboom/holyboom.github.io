/* Assert actual visible carrier travel, exact silent states and independent piano. */
const {chromium,webkit}=require('playwright'),fs=require('fs'),cp=require('child_process');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8782/',out=process.env.QA_DIR||'qa-output/line-current-'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[],traces=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const b=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindCueTimbres?.snapshot().ready&&HolyMindContinuity.snapshot().keys.length>10);
 const snap=()=>p.evaluate(()=>({a:HolyMindAudio.snapshot(),c:HolyMindContinuity.snapshot(),s:HolyMindScrollSound.snapshot(),y:scrollY}));
 const jump=async y=>{await p.waitForFunction(()=>!HolyMindContinuity.snapshot().running&&!HolyMindScrollSound.snapshot().running,null,{timeout:15000});await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1550);await p.waitForFunction(target=>{const want=Math.max(0,Math.min(target,document.documentElement.scrollHeight-innerHeight)),c=HolyMindContinuity.snapshot();return Math.abs(scrollY-want)<1.5&&Math.abs(c.renderedScrollY-scrollY)<1.5&&!c.running;},y,{timeout:12000});};
 const wheel=async(d,n=14,delay=50)=>{
  // Read throughout the gesture in-page, not only after each awaited tool call:
  // a correct 12 ms closing edge may already be silent by the end snapshot.
  await p.evaluate(()=>{window.__lineRecording=true;window.__lineSamples=[];const sample=()=>{
   if(!window.__lineRecording)return;const a=HolyMindAudio.snapshot(),c=HolyMindContinuity.snapshot();
   window.__lineSamples.push({line:c.lineTravel,rms:a.soundscape?.rms.scroll||0,gate:a.soundscape?.lineGate.value||0,requested:a.soundscape?.lineGate.requested||false,scrollY,wire:document.querySelector('.continuity-current')?.getAttribute('d'),score:a.score?.running,scope:HolyMindScrollSound.snapshot().scene});
   requestAnimationFrame(sample);
  };requestAnimationFrame(sample);});
  for(let i=0;i<n;i++){await p.mouse.wheel(0,d);await p.waitForTimeout(delay);}
  await p.waitForTimeout(65);return p.evaluate(()=>{window.__lineRecording=false;return window.__lineSamples;});
 };
 check('release-v19',await p.locator('html').getAttribute('data-build')===(process.env.EXPECTED_BUILD||'line-current-v19'));
 check('initial-silent-no-context',(await snap()).a.context==='uncreated');await wheel(8,4);check('scroll-does-not-unlock',(await snap()).a.context==='uncreated');await jump(0);
 await p.locator('#sound-toggle').click();await p.waitForTimeout(1100);let v=await snap();
 check('resting-current-gate-closed',v.a.soundscape.lineGate.value===0&&v.a.soundscape.rms.scroll===0);
 check('ambient-remains-audible',v.a.soundscape.rms.ambient>.0002);
 check('plus-eight-db-preserved',v.a.soundscape.scrollBoostDb===8);
 const ks=v.c.keys,segments=[];for(let i=0;i<ks.length-1;i++)if(ks[i].id!==ks[i+1].id)segments.push([ks[i],ks[i+1]]);
 check('all-ten-visual-transfers',segments.length===10);
 for(const [from,to] of segments){
  const span=to.at-from.at,start=from.at+span*.30,end=from.at+span*.70;
  await jump(start);v=await snap();check('silent-scripted-jump-'+to.id,v.a.soundscape.lineGate.value===0&&v.a.soundscape.rms.scroll===0);
  const down=await wheel((end-start)/18,18,45);traces.push({from:from.id,to:to.id,direction:1,rows:down});
  check('audible-only-real-travel-'+to.id,down.some(x=>x.line.moving&&x.line.lineVisible&&x.wire&&x.rms>.00005),{movingSamples:down.filter(x=>x.line.moving).length,audibleSamples:down.filter(x=>x.rms>.00005).length});
  check('no-open-gate-without-visible-path-'+to.id,down.every(x=>!x.requested||(x.line.lineVisible&&x.line.from!==x.line.to)));
  await p.waitForTimeout(200);v=await snap();check('mid-line-stop-is-silent-'+to.id,!v.c.lineTravel.moving&&v.a.soundscape.lineGate.value===0&&v.a.soundscape.rms.scroll===0);
  const up=await wheel(-(end-start)/18,18,45);traces.push({from:from.id,to:to.id,direction:-1,rows:up});
  check('reverse-line-travel-audible-'+to.id,up.some(x=>x.line.moving&&x.line.lineVisible&&x.rms>.00005));
  await p.waitForTimeout(200);v=await snap();check('reverse-stop-is-silent-'+to.id,!v.c.lineTravel.moving&&v.a.soundscape.rms.scroll===0);
 }
 // Pinned 0–100 reveal is extensive scrolling, but the carrier is docked: silence.
 const st=await p.evaluate(()=>HolyMindAssemblyScroll.snapshot());await jump(st.start+120);
 const pinned=await wheel(Math.min(30,(st.end-st.start-350)/25),25,55);v=await snap();
 check('pinned-layers-no-current',pinned.every(x=>x.line.reason==='docked'&&x.gate===0&&x.rms===0));
 check('pinned-layers-piano-still-plays',pinned.some(x=>x.score)&&v.a.score.played>0&&v.a.contextCount===1);
 check('piano-beat-order-not-altered',v.a.score.history.every((x,i,h)=>!i||x.beat===(h[i-1].beat+1)%56));
 await p.waitForFunction(()=>!HolyMindAudio.snapshot().score.running);v=await snap();
 check('piano-rings-while-current-is-silent',v.a.score.activeVoices>0&&v.a.score.rms>.000001&&v.a.soundscape.rms.scroll===0,{pianoRms:v.a.score.rms,currentRms:v.a.soundscape.rms.scroll});
 // Scroll inside other true visual hold intervals: no noise despite moving page.
 for(const id of ['orbit','ribbon','skills','services','signature']){
  const k=await p.evaluate(id=>HolyMindContinuity.snapshot().keys.filter(x=>x.id===id),id);if(k.length<2)continue;
  const width=k[1].at-k[0].at;await jump(k[0].at+width*.2);const rows=await wheel(width*.5/12,12,50);
  check('docked-scroll-silent-'+id,rows.every(x=>x.rms===0&&x.gate===0),{keys:k,maxRms:Math.max(...rows.map(x=>x.rms)),rows});
 }
 // Reflow never injects a path sound, and later transitions still work after it.
 await p.locator('#show-skills').click();await p.waitForTimeout(1500);v=await snap();check('gallery-reflow-silent',v.a.soundscape.rms.scroll===0&&v.a.soundscape.lineGate.value===0);
 await p.locator('[data-filter=verify]').click();await p.waitForTimeout(1000);v=await snap();check('filter-reflow-silent',v.a.soundscape.rms.scroll===0);
 await p.locator('[data-filter=all]').click();await p.waitForTimeout(1000);
 await jump(0);await p.locator('.sonic-settings summary').click();await p.locator('#sound-flow').uncheck();await p.locator('.sonic-settings summary').click();
 let route=await p.evaluate(()=>HolyMindContinuity.snapshot().keys),i=route.findIndex((x,j)=>x.id==='ribbon'&&route[j+1]?.id==='assembly'),a=route[i].at,z=route[i+1].at;
 await jump(a+(z-a)*.3);const muted=await wheel((z-a)*.35/14,14,50);check('flow-switch-blocks-even-real-travel',muted.some(x=>x.line.moving)&&muted.every(x=>x.rms===0));
 await jump(0);await p.locator('.sonic-settings summary').click();await p.locator('#sound-flow').check();await p.locator('.sonic-settings summary').click();
 // Hidden interruption, stale motion and fresh gestures still retain lifecycle.
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(100);v=await snap();check('hidden-stops-score-and-current',v.a.context==='suspended'&&v.a.soundscape===null&&v.a.score===null);
 await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await wheel(10,4);v=await snap();check('return-scroll-does-not-resume',v.a.context==='suspended'&&v.a.needsGesture);
 await p.locator('#sound-toggle').click();await p.waitForTimeout(650);v=await snap();check('fresh-gesture-no-stale-current',v.a.context==='running'&&v.a.contextCount===1&&v.a.soundscape.rms.scroll===0);
 for(const w of [320,390,768,1440]){await p.setViewportSize({width:w,height:w<700?844:1000});await p.waitForTimeout(800);await jump(0);v=await snap();check('resize-silent-and-layout-'+w,v.a.soundscape.rms.scroll===0&&await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.body.dataset.motion==='on'));}
 await p.screenshot({path:out+'/desktop.jpg',quality:82});await p.setViewportSize({width:390,height:844});await jump(st.start+200);await p.screenshot({path:out+'/mobile-assembly.jpg',quality:82});
 // Offline graph tests: closed = mathematical silence; fail-closed visual lease;
 // with a fresh moving line the exact previous +8 dB current waveform is retained.
 const original=cp.execFileSync('git',['show','b6cb59f7807a7bae7a8b8677a4139a9e9765b274:holymind-soundscape.js'],{encoding:'utf8'}).replace('root.HolyMindSoundscape=','root.HolyMindSoundscapeBaseline=');await p.addScriptTag({content:original});
 const offline=await p.evaluate(async()=>{
  const results={},sampleRate=24000,seconds=2;
  for(const mode of ['before-current','open-current','closed-current','dock-current','stale-current','before-ambient','after-ambient']){
   const ctx=new OfflineAudioContext(1,sampleRate*seconds,sampleRate),g=mode.startsWith('before')?HolyMindSoundscapeBaseline.create(ctx,ctx.destination):HolyMindSoundscape.create(ctx,ctx.destination);
   const ambient=mode.endsWith('ambient');g.update({scope:1,enabled:true,ambience:ambient,flow:!ambient,activity:.6,morph:.4,progress:.3,direction:1},0);
   if(!mode.startsWith('before')&&mode!=='closed-current'&&!ambient){
    if(mode==='stale-current')g.setLineTravel({moving:true,lineVisible:true,from:'ribbon',to:'assembly'},.15);
    else for(let t=0;t<1.3;t+=1/60)g.setLineTravel({moving:true,lineVisible:true,from:'ribbon',to:mode==='dock-current'?'ribbon':'assembly'},t);
    g.setLineTravel({moving:false},1.3);
   }
   const data=(await ctx.startRendering()).getChannelData(0);results[mode]=Array.from(data);
  }
  const rms=(x,start=0,end=seconds)=>{const a=Math.floor(start*sampleRate),b=Math.floor(end*sampleRate);let s=0;for(let i=a;i<b;i++)s+=x[i]*x[i];return Math.sqrt(s/(b-a));};
  const diff=(a,b,start,end)=>{let max=0;for(let i=Math.floor(start*sampleRate);i<Math.floor(end*sampleRate);i++)max=Math.max(max,Math.abs(a[i]-b[i]));return max;};
  return {closedRms:rms(results['closed-current']),dockRms:rms(results['dock-current']),staleRms:rms(results['stale-current'],.30,2),openRms:rms(results['open-current'],.3,1.2),afterCloseRms:rms(results['open-current'],1.33,2),openMaxDiff:diff(results['before-current'],results['open-current'],.2,1.25),ambientMaxDiff:diff(results['before-ambient'],results['after-ambient'],0,2)};
 });
 check('default-closed-is-exact-silence',offline.closedRms===0,offline);
 check('dock-cannot-open-gate',offline.dockRms===0);
 check('stale-renderer-fails-closed',offline.staleRms===0);
 check('gate-closes-to-exact-zero',offline.afterCloseRms===0);
 check('moving-current-original-waveform-preserved',offline.openRms>.0001&&offline.openMaxDiff<.000002,{maxDifference:offline.openMaxDiff});
 check('ambient-waveform-unchanged',offline.ambientMaxDiff<.000002,{maxDifference:offline.ambientMaxDiff});
 fs.writeFileSync(out+'/traces.json',JSON.stringify(traces));fs.writeFileSync(out+'/offline.json',JSON.stringify(offline,null,2));
 const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,offline,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
