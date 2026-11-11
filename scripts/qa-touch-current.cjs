/* Chromium native touch input, not synthetic DOM events. WebKit is checked separately. */
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{const base=process.env.TEST_URL||'http://127.0.0.1:8777/',out=process.env.QA_DIR||'/tmp/holymind-full-current-v14/touch';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[];
 const browser=await chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined});try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindScrollSound?.snapshot().stations.length===11);await p.locator('#sound-toggle').tap();await p.waitForTimeout(1300);
 const cdp=await p.context().newCDPSession(p),check=(name,pass,detail)=>{checks.push({name,pass,...detail});console.log(name,pass);};
 async function swipe(from,to){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:185,y:from}]});for(let i=1;i<=14;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:185,y:from+(to-from)*i/14}]});await p.waitForTimeout(45);}const during=await p.evaluate(()=>({s:HolyMindScrollSound.snapshot(),a:HolyMindAudio.snapshot().soundscape,y:scrollY}));await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});return during;}
 for(const id of ['instrument','gallery','services']){
  await p.evaluate(id=>{const s=HolyMindScrollSound.snapshot().stations.find(x=>x.id===id);HolyMindScrollSound.suppressForNavigation();scrollTo({top:s.at+180,behavior:'instant'});},id);await p.waitForTimeout(1700);
  const a=await swipe(650,300);check('native-touch-down-'+id,a.s.lastInput==='touch'&&a.s.direction===1&&a.s.gesturePeak>.05&&a.a.rms.scroll>.00005,{activity:a.s.activity,rms:a.a.rms.scroll});
  await p.waitForTimeout(1700);const b=await swipe(300,650);check('native-touch-up-'+id,b.s.lastInput==='touch'&&b.s.direction===-1&&b.s.gesturePeak>.05&&b.a.rms.scroll>.00005,{activity:b.s.activity,rms:b.a.rms.scroll});await p.waitForTimeout(1500);
 }
 const a=await p.evaluate(()=>HolyMindAudio.snapshot());check('one-context-after-native-swipes',a.contextCount===1&&a.soundscape.continuousSources===13&&a.soundscape.oneShots===0,{contextCount:a.contextCount});
 const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine:'chromium',method:'DevTools native touch sequence in emulated mobile viewport',checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({checks:checks.length,failed,errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
