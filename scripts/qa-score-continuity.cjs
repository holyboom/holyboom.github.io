// Native scroll and measured piano after Boom, including mobile-height changes.
const {webkit,chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8789/',out=process.env.QA_DIR||'qa-output/score-continuity-'+engine;
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],runs=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const b=await(engine==='webkit'?webkit.launch():chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));
 try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>HolyMindBoomAudio.snapshot().ready&&HolyMindCueTimbres.snapshot().ready);
 const snap=()=>p.evaluate(()=>({y:scrollY,a:HolyMindAudio.snapshot(),s:HolyMindScrollSound.snapshot(),v:HolyMindViewport.snapshot(),f:HolyMindBoomCelebration.snapshot().progress}));
 const jump=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1600);};
 async function move(delta,count,resize){const rows=[];for(let i=0;i<count;i++){
  await p.mouse.wheel(0,delta);await p.waitForTimeout(75);
  if(resize&&i%4===0)await p.setViewportSize({width:390,height:i%8===0?790:844});
  const d=await snap();rows.push({y:d.y,intent:d.s.intent,activity:d.s.activity,scene:d.s.scene,cursor:d.a.score?.cursor,notes:d.a.score?.played,rms:d.a.score?.rms||0,playing:!!d.a.score?.running});
 }runs.push({delta,resize,rows});return rows;}
 check('release',await p.locator('html').getAttribute('data-build')===(process.env.EXPECTED_BUILD||'score-continuity-v26'));
 check('no-autoplay',(await snap()).a.context==='uncreated');await p.locator('#sound-toggle').click();await p.waitForTimeout(900);
 const range=await p.evaluate(()=>HolyMindBoomCelebration.snapshot().range);await jump(range.start-25);await move(4,84,false);let d=await snap();
 check('real-fireworks-played-and-completed',d.f===1&&d.a.celebration.history.some(x=>x.kind==='burst'&&x.recorded));
 check('piano-sounds-during-fireworks',runs[0].rows.some(x=>x.playing&&x.rms>.0002));
 await p.waitForFunction(()=>!HolyMindAudio.snapshot().score.running);d=await snap();
 check('stop-retains-natural-tail',d.a.score.activeVoices>0&&d.a.score.rms>.000001);
 await p.waitForTimeout(4900);const pause=await snap();
 check('tails-finish-finitely',pause.a.score.activeVoices===0&&pause.a.celebration.activeVoices===0);
 const down=await move(9,64,true);d=await snap();
 check('piano-progresses-after-boom',d.a.score.played>pause.a.score.played+10,{before:pause.a.score.played,after:d.a.score.played});
 check('next-beat-not-restart',d.a.score.history[pause.a.score.history.length]?.beat===pause.a.score.cursor);
 check('height-changes-retain-input',down.filter(x=>x.intent&&x.activity>.025).length>down.length*.8,{accepted:down.filter(x=>x.intent&&x.activity>.025).length,total:down.length});
 check('measured-piano-after-boom',down.filter(x=>x.playing&&x.rms>.0002).length>down.length*.75);
 check('chrome-resizes-ignored',d.s.ignoredViewportResizes>=10&&d.s.structuralResizes===0);
 const beforeBack=d.a.score.played,up=await move(-9,35,true);d=await snap();
 check('reverse-keeps-music',d.a.score.played>beforeBack+5&&d.a.score.direction===-1&&up.some(x=>x.rms>.001));
 check('written-score-order-preserved',d.a.score.history.every((x,i,a)=>!i||x.beat===(a[i-1].beat+1)%56));
 check('one-context-no-dropped-notes',d.a.contextCount===1&&d.a.score.skipped===0);
 check('piano-mix-unchanged',d.a.levels.piano===1&&d.a.mixGains.piano>.999&&d.a.piano);
 await p.waitForFunction(()=>!HolyMindAudio.snapshot().score.running);await p.waitForTimeout(4900);const idle=await snap();
 for(const height of [790,844,750,844]){await p.setViewportSize({width:390,height});await p.waitForTimeout(160);}await p.waitForTimeout(400);d=await snap();
 check('resize-without-scroll-does-not-start-song',d.a.score.played===idle.a.score.played&&!d.a.score.running&&d.a.score.rms<.0001);
 await p.setViewportSize({width:844,height:390});await p.waitForTimeout(1100);d=await snap();
 check('real-orientation-still-remeasures',d.v.revision>idle.v.revision&&d.s.structuralResizes>idle.s.structuralResizes);
 check('orientation-alone-is-silent',d.a.score.played===idle.a.score.played&&!d.a.score.running);
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(1400);await jump(range.end+50);await move(8,14,false);d=await snap();
 check('fresh-scroll-resumes-after-orientation',d.a.score.played>idle.a.score.played&&d.a.contextCount===1);
 await p.locator('#sound-toggle').click();await move(8,10,true);d=await snap();
 check('explicit-mute-still-wins',!d.a.enabled&&d.a.score===null);
 check('motion-still-on',await p.evaluate(()=>document.body.dataset.motion==='on'));
 const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({engine,base,checks,failed,errors,runs,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
