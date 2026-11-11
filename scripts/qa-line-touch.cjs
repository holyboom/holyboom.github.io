/* Native browser touch input in mobile emulation, not synthetic scroll events. */
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const base=process.env.TEST_URL||'http://127.0.0.1:8782/',out=process.env.QA_DIR||'/tmp/holymind-line-current-v19/touch';fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];
 const b=await chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined});
 try{const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>HolyMindCueTimbres.snapshot().ready);await p.locator('#sound-toggle').tap();await p.waitForTimeout(1000);
 const cdp=await p.context().newCDPSession(p),check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const jump=async y=>{await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1650);};
 async function swipe(from,to){const rows=[];await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:185,y:from}]});for(let i=1;i<=18;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:185,y:from+(to-from)*i/18}]});await p.waitForTimeout(50);rows.push(await p.evaluate(()=>{const a=HolyMindAudio.snapshot();return {l:HolyMindContinuity.snapshot().lineTravel,rms:a.soundscape.rms.scroll,requested:a.soundscape.lineGate.requested,gate:a.soundscape.lineGate.value,piano:a.score.running,input:HolyMindScrollSound.snapshot().lastInput};}));}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return rows;}
 const keys=await p.evaluate(()=>HolyMindContinuity.snapshot().keys),i=keys.findIndex((k,i)=>k.id==='ribbon'&&keys[i+1]?.id==='assembly'),a=keys[i].at,z=keys[i+1].at;
 await jump(a+(z-a)*.32);let rows=await swipe(640,370);check('native-touch-line-down-audible',rows.filter(r=>r.input==='touch'&&r.l.moving&&r.l.lineVisible&&r.rms>.00005).length>=3,{rows});
 await p.waitForTimeout(650);check('native-touch-stop-silent',await p.evaluate(()=>!HolyMindContinuity.snapshot().lineTravel.moving&&HolyMindAudio.snapshot().soundscape.rms.scroll===0));
 await jump(a+(z-a)*.68);rows=await swipe(370,640);check('native-touch-line-up-audible',rows.filter(r=>r.input==='touch'&&r.l.moving&&r.l.lineVisible&&r.rms>.00005).length>=3,{rows});
 const pin=await p.evaluate(()=>HolyMindAssemblyScroll.snapshot());await jump(pin.start+200);rows=await swipe(640,370);
 check('native-touch-pinned-current-silent',rows.every(r=>!r.requested&&r.gate===0&&r.rms===0&&r.l.reason==='docked'),{rows});
 check('native-touch-piano-continues-in-pin',rows.some(r=>r.piano));
 await p.waitForTimeout(200);check('same-context-and-no-extra-sources',await p.evaluate(()=>HolyMindAudio.snapshot().contextCount===1&&HolyMindAudio.snapshot().soundscape.continuousSources===13));
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine:'chromium',input:'DevTools native touch in mobile emulation',checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
