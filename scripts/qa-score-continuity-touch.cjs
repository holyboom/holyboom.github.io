// Native mobile touch input with measured sound; viewport changes emulate browser chrome.
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const base=process.env.TEST_URL||'http://127.0.0.1:8789/',out=process.env.QA_DIR||'qa-output/score-continuity-touch';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>HolyMindBoomAudio.snapshot().ready&&HolyMindCueTimbres.snapshot().ready);await p.locator('#sound-toggle').tap();await p.waitForTimeout(1000);
 const cdp=await p.context().newCDPSession(p),range=await p.evaluate(()=>HolyMindBoomCelebration.snapshot().range);
 await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},range.start-20);await p.waitForTimeout(1700);
 async function swipe(from,to,resizing){const rows=[];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y:from}]});
  for(let i=1;i<=50;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:330,y:from+(to-from)*i/50}]});await p.waitForTimeout(55);
   if(resizing&&i%5===0)await p.setViewportSize({width:390,height:i%10===0?844:790});
   rows.push(await p.evaluate(()=>{const a=HolyMindAudio.snapshot(),s=HolyMindScrollSound.snapshot();return {y:scrollY,input:s.lastInput,intent:s.intent,activity:s.activity,notes:a.score.played,cursor:a.score.cursor,rms:a.score.rms,playing:a.score.running,boom:HolyMindBoomCelebration.snapshot().progress,current:a.soundscape.rms.scroll};}));
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return rows;
 }
 const fire=await swipe(690,280,false);check('native-touch-plays-fireworks',fire.some(x=>x.boom>.85)&&await p.evaluate(()=>HolyMindAudio.snapshot().celebration?.played>0));
 await p.waitForTimeout(5100);const prior=await p.evaluate(()=>HolyMindAudio.snapshot().score);
 const down=await swipe(690,280,true),after=await p.evaluate(()=>HolyMindAudio.snapshot());
 check('after-boom-native-touch-keeps-input',down.filter(x=>x.input==='touch'&&x.intent&&x.activity>.025).length>30);
 check('after-boom-native-touch-piano-audible',down.filter(x=>x.rms>.0002&&x.playing).length>30&&after.score.played>prior.played+5,{before:prior.played,after:after.score.played});
 check('native-touch-resumes-next-written-beat',after.score.history[prior.history.length]?.beat===prior.cursor);
 await p.waitForTimeout(1200);const beforeReverse=after.score.played,up=await swipe(280,690,true);const final=await p.evaluate(()=>HolyMindAudio.snapshot());
 check('reverse-native-touch-has-piano',up.filter(x=>x.rms>.0002&&x.intent).length>30&&final.score.played>beforeReverse&&final.score.direction===-1);
 check('same-audio-context',final.contextCount===1&&final.score.skipped===0);
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,checks,failed,errors,forward:down,reverse:up,physicalDevice:false,method:'Chromium native touch dispatch on emulated mobile viewport; viewport height changes emulate toolbar movement.'},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
