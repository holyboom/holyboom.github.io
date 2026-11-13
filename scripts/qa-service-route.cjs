/* Scoped regression: the Services bridge must not fold across readable content. */
const {webkit,chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8793/',out=process.env.QA_DIR||'/tmp/holymind-services-wire-20261113/'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[],traces=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}));
 try{
 const p=await browser.newPage({viewport:{width:992,height:1300},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindContinuity?.snapshot().keys.length>10&&window.HolyMindBoomCelebration);await p.waitForTimeout(800);
 check('fixed-controller',await p.evaluate(()=>HolyMindContinuity.version==='service-route-20261113'));
 check('no-audio-unlock',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
 async function range(){return p.evaluate(()=>{const k=HolyMindContinuity.snapshot().keys,i=k.findIndex((x,n)=>x.id==='services'&&k[n+1]?.id==='delivery');return {start:k[i].at,end:k[i+1].at};});}
 async function jump(y){await p.evaluate(y=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(1000);}
 async function sample(){return p.evaluate(()=>{
  const path=document.querySelector('.continuity-wire'),len=path.getTotalLength(),s=HolyMindContinuity.snapshot();
  const points=Array.from({length:501},(_,i)=>{const p=path.getPointAtLength(len*i/500);return {x:p.x,y:p.y};});
  const obstacles=[...document.querySelectorAll('.approach-intro h2,.approach-intro>p,.service-title,.approach-content p,.approach-list summary>.ui-icon')].filter(e=>!e.closest('.approach-content')||e.closest('details').open).map(e=>({text:e.textContent.slice(0,80)||'plus-control',r:e.getBoundingClientRect()})).filter(o=>o.r.width>0&&o.r.height>0);
  const hits=obstacles.map(o=>({text:o.text,count:points.filter(p=>p.x>o.r.left-5&&p.x<o.r.right+5&&p.y>o.r.top-5&&p.y<o.r.bottom+5).length})).filter(x=>x.count);
  const a=document.querySelector('.approach-intro>img').getBoundingClientRect(),b=document.querySelector('.approach-list details:last-child .service-art').getBoundingClientRect();
  const start={x:a.left+a.width/2,y:a.top+a.height/2},end={x:b.left+b.width/2,y:b.top+b.height/2};
  return {width:innerWidth,y:scrollY,from:s.from,to:s.to,x:s.x,cy:s.y,p:s.progress,wire:path.getAttribute('d'),length:len,hits,maxX:Math.max(...points.map(p=>p.x)),targetX:end.x,endpointError:Math.max(Math.hypot(points[0].x-start.x,points[0].y-start.y),Math.hypot(points.at(-1).x-end.x,points.at(-1).y-end.y)),carrierDistance:Math.min(...points.map(p=>Math.hypot(p.x-s.x,p.y-s.y))),overflow:document.documentElement.scrollWidth>innerWidth};
 });}
 for(const width of [320,390,680,681,768,820,992,1024,1194,1440]){
  await p.setViewportSize({width,height:width<=680?844:1300});await p.waitForTimeout(750);const r=await range(),forward=[];
  for(const t of [.08,.5,.92]){await jump(r.start+(r.end-r.start)*t);const x=await sample();forward.push(x);traces.push({mode:'closed',...x});}
  check('clear-service-text-'+width,forward.every(x=>x.from==='services'&&x.to==='delivery'&&!x.hits.length&&!x.overflow),{hits:forward.flatMap(x=>x.hits)});
  check('same-wire-and-carrier-'+width,forward.every(x=>x.endpointError<1.6&&x.carrierDistance<6),{maxEndpointError:Math.max(...forward.map(x=>x.endpointError)),maxCarrierDistance:Math.max(...forward.map(x=>x.carrierDistance))});
  if(width>680)check('no-right-hand-fold-'+width,forward.every(x=>x.maxX<=x.targetX+1.5));
  await jump(r.end+20);await jump(forward[1].y);const back=await sample();check('reversible-bridge-'+width,Math.hypot(back.x-forward[1].x,back.cy-forward[1].cy)<.12,{difference:Math.hypot(back.x-forward[1].x,back.cy-forward[1].cy)});
  if([390,820,992].includes(width)){await jump(r.start+(r.end-r.start)*.12);await p.screenshot({path:out+'/fixed-'+width+'.jpg',quality:88});}
 }
 for(const width of [390,820,992]){
  await p.setViewportSize({width,height:width===390?844:1300});await p.waitForTimeout(650);
  for(const mask of [1,2,4,7]){
   await p.evaluate(mask=>document.querySelectorAll('.approach-list details').forEach((e,i)=>e.open=!!(mask&(1<<i))),mask);await p.waitForTimeout(650);const r=await range();await jump((r.start+r.end)/2);const x=await sample();traces.push({mode:'expanded-'+mask,...x});check('expanded-content-clear-'+width+'-'+mask,x.hits.length===0&&x.endpointError<1.6,{hits:x.hits});
  }
  await p.evaluate(()=>document.querySelectorAll('.approach-list details').forEach(e=>e.open=false));await p.waitForTimeout(650);
 }
 await p.setViewportSize({width:992,height:1300});await p.waitForTimeout(650);let r=await range();await jump((r.start+r.end)/2);
 await p.locator('.approach-list details:last-child>summary').click();check('plus-control-still-clickable',await p.locator('.approach-list details:last-child').evaluate(e=>e.open));await p.locator('.approach-list details:last-child>summary').click();await p.waitForTimeout(650);
 if(await p.evaluate(()=>{const a=HolyMindAudio.snapshot();return !a.enabled||!a.unlocked||a.needsGesture;}))await p.locator('#sound-toggle').click();await p.waitForFunction(()=>HolyMindAudio.snapshot().soundscape&&HolyMindAudio.snapshot().score);await p.waitForTimeout(600);r=await range();await jump(r.start+2);await p.waitForTimeout(600);let audible=0,moving=0;
 for(let i=0;i<30;i++){await p.mouse.wheel(0,1);await p.waitForTimeout(55);const x=await p.evaluate(()=>({c:HolyMindContinuity.snapshot(),a:HolyMindAudio.snapshot()}));if(x.c.lineTravel.moving)moving++;if(x.a.soundscape?.rms.scroll>.00003)audible++;}
 check('native-travel-still-drives-line-sound',moving>0&&audible>0,{moving,audible});await p.waitForTimeout(1500);const audio=await p.evaluate(()=>HolyMindAudio.snapshot());check('stationary-line-silent',!!audio.soundscape&&audio.soundscape.rms.scroll<.00005);for(let i=0;i<8;i++){await p.mouse.wheel(0,8);await p.waitForTimeout(80);}const piano=await p.evaluate(()=>HolyMindAudio.snapshot());check('piano-keeps-one-context',piano.contextCount===1&&piano.score?.played>0,{notes:piano.score?.played,contextCount:piano.contextCount});
 check('controls-and-original-effects-preserved',await p.evaluate(()=>HolyMindBoomModel.particleCount===259&&HolyMindTimbres.presets.length===14&&document.body.dataset.motion==='on'&&document.querySelectorAll('[data-sound-level]').length===4));
 const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({engine,base,checks,failed,errors,traces,physicalIPadTested:false},null,2));console.log(JSON.stringify({checks:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
