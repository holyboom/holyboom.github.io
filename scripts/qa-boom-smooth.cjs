/* Regression for end-of-fireworks / reverse exit and mobile browser chrome resizing.
 * Native wheel input; viewport-only changes simulate, not claim, physical Safari UI. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8784/',out=process.env.QA_DIR||'/tmp/holymind-boom-smooth-v21/smooth-'+engine;
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],captures=[];
 const b=await(engine==='webkit'?webkit.launch():chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}));
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 try{
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:engine==='chromium'});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.__scrollCommands=[];const original=window.scrollTo;window.scrollTo=function(...args){__scrollCommands.push({at:performance.now(),args});return original.apply(this,args);};});
  await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindBoomCelebration?.snapshot().range.start>0&&HolyMindCueTimbres.snapshot().ready);
  await p.locator('#sound-toggle').click();await p.waitForTimeout(1000);
  const snap=()=>p.evaluate(()=>{const v=HolyMindBoomCelebration.snapshot(),c=HolyMindContinuity.snapshot(),dot=document.querySelector('.signature-period').getBoundingClientRect();return {y:scrollY,h:innerHeight,v,pin:HolyMindAssemblyScroll.snapshot(),viewport:HolyMindViewport.snapshot(),height:document.documentElement.scrollHeight,dot:dot.top,commands:__scrollCommands.length,route:c.from+'-'+c.to,carrier:{x:c.x,y:c.y},audio:HolyMindAudio.snapshot()};});
  const go=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1300);};
  let a=await snap(),r=a.v.range;check('release-v21',await p.locator('html').getAttribute('data-build')==='boom-smooth-v21');
  for(const [label,y] of [['after-fireworks',r.end+50],['above-boom',r.start-80],['mid-reverse',r.start+(r.end-r.start)*.63]]){
   await go(y);a=await snap();await p.evaluate(()=>window.__pinBefore=ScrollTrigger.getById('assembly-story'));
   const rows=[];
   for(const height of [790,750,790,844]){await p.setViewportSize({width:390,height});await p.waitForTimeout(500);const v=await snap();rows.push({h:height,y:v.y,range:v.v.range,progress:v.v.progress,body:v.height,commands:v.commands,pinSame:await p.evaluate(()=>window.__pinBefore===ScrollTrigger.getById('assembly-story'))});}
   check('no-scroll-jump-'+label,rows.every(x=>Math.abs(x.y-a.y)<=1),{beforeY:a.y,rows});
   check('same-story-range-'+label,rows.every(x=>Math.abs(x.range.start-a.v.range.start)<.01&&Math.abs(x.range.end-a.v.range.end)<.01));
   check('no-pin-rebuild-'+label,rows.every(x=>x.pinSame&&x.body===a.height));
  }
  await go(r.end-30);let before=await snap();const ys=[];
  for(let i=0;i<22;i++){await p.mouse.wheel(0,4);await p.waitForTimeout(24);const s=await snap();ys.push(s.y);}
  await p.waitForTimeout(900);let ended=await snap();check('end-forward-does-not-reposition',ys.every((v,i)=>!i||v>=ys[i-1]-1));check('complete-is-transparent',!ended.v.visible&&ended.v.progress===1);
  const endReads=ended.v.reads,endDraws=ended.v.draws;await p.mouse.wheel(0,10);await p.waitForTimeout(1000);ended=await snap();check('no-measure-or-paint-after-completion',ended.v.reads===endReads&&ended.v.draws===endDraws);
  await go(r.start+24);ys.length=0;for(let i=0;i<25;i++){await p.mouse.wheel(0,-4);await p.waitForTimeout(24);ys.push((await snap()).y);}await p.waitForTimeout(850);const gone=await snap();check('reverse-exit-does-not-reposition',ys.every((v,i)=>!i||v<=ys[i-1]+1));check('reverse-exit-clears-all-particles',gone.v.progress===0&&!gone.v.visible&&gone.v.particleCount===0);
  const cr=gone.v.reads,cd=gone.v.draws;await p.mouse.wheel(0,-12);await p.waitForTimeout(900);a=await snap();check('no-measure-or-paint-above-boom',a.v.reads===cr&&a.v.draws===cd);
  // Pause mid-scene must retain exact pixels without redundant canvas raster work.
  await go((r.start+r.end)/2);await p.waitForTimeout(800);a=await snap();const pixels=await p.locator('.boom-fireworks').evaluate(c=>c.toDataURL());
  await p.evaluate(()=>{for(let i=0;i<40;i++)HolyMindBoomCelebration.render({y:scrollY});});const rested=await snap();check('unchanged-frames-not-repainted',rested.v.draws===a.v.draws&&rested.v.skippedDraws>=a.v.skippedDraws+40);check('paused-pixels-preserved',pixels===await p.locator('.boom-fireworks').evaluate(c=>c.toDataURL()));
  await p.screenshot({path:out+'/mobile-burst.jpg',quality:85});
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(1400);a=await snap();check('orientation-still-rebuilds',a.viewport.width===844&&a.viewport.height===390&&a.pin.viewport==='844x390');check('one-assembly-pin-after-orientation',await p.evaluate(()=>ScrollTrigger.getAll().filter(s=>s.vars.id==='assembly-story').length===1));
  const r2=a.v.range;await go(r2.start+(r2.end-r2.start)*.6);a=await snap();check('landscape-still-renders',a.v.visible&&a.v.litParticles>20);await p.screenshot({path:out+'/landscape.jpg',quality:85});
  await p.setViewportSize({width:1440,height:1000});await p.waitForTimeout(1200);a=await snap();check('desktop-geometry-rebuilds',a.viewport.width===1440&&a.pin.viewport==='1440x1000');
  await p.setViewportSize({width:1440,height:840});await p.waitForTimeout(1200);a=await snap();check('desktop-height-resize-not-ignored',a.viewport.height===840&&a.pin.viewport==='1440x840');
  check('piano-source-still-present',a.audio.score&&a.audio.contextCount===1);check('always-motion-and-no-overflow',await p.evaluate(()=>document.body.dataset.motion==='on'&&document.documentElement.scrollWidth<=innerWidth));
  const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
