/* Live-reusable tests: real taps, finite bursts, pinned geometry and bidirectional native scrolling. */
const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8773/',out=process.env.QA_DIR||'qa-output/interaction-'+engine;
 fs.mkdirSync(out,{recursive:true});
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 const checks=[],errors=[];const check=(name,pass,detail={})=>{checks.push({name,pass,...detail});console.log(name,pass);};
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.addInitScript(()=>localStorage.setItem('holyboom-motion','off'));
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindNeural?.snapshot().paths===46&&window.HolyMindAssemblyScroll?.enabled());await p.waitForTimeout(1000);
 check('release-v11',await p.locator('html').getAttribute('data-build')==='resonance-v11');
 check('always-on-preserved',await p.evaluate(()=>document.body.dataset.motionProfile==='full'&&HolyMindNeural.snapshot().running));
 check('removed-controls-stay-removed',await p.locator('#motion-toggle,.hero-actions').count()===0);
 check('fresh-load-starts-zero',await p.locator('#assembly-control').inputValue()==='0');
 const tapBrain=async()=>{const r=await p.locator('[data-brain-target=hero]').boundingBox();await p.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.45);};
 let n=await p.evaluate(()=>HolyMindNeural.snapshot().burstCount);await tapBrain();await p.waitForTimeout(220);
 check('native-touch-triggers-discharge',await p.evaluate(n=>HolyMindNeural.snapshot().burstCount===n+1&&HolyMindNeural.snapshot().activeBursts>0,n));
 check('nearby-components-receive-burst',await p.locator('.hero-visual').evaluate(e=>parseFloat(e.style.getPropertyValue('--burst-charge'))>.1));
 await p.screenshot({path:out+'/brain-burst-mobile.jpg',quality:85});
 await p.waitForTimeout(1400);check('burst-finishes-ambient-continues',await p.evaluate(()=>HolyMindNeural.snapshot().activeBursts===0&&HolyMindNeural.snapshot().running));
 for(let i=0;i<7;i++){await tapBrain();await p.waitForTimeout(190);}
 check('repeated-taps-bounded',await p.evaluate(()=>HolyMindNeural.snapshot().activeBursts<=3&&HolyMindNeural.snapshot().burstCount>=6));
 await p.waitForTimeout(1400);n=await p.evaluate(()=>HolyMindNeural.snapshot().burstCount);
 await p.locator('[data-brain-target=hero]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(210);await p.keyboard.press('Space');await p.waitForTimeout(210);
 check('keyboard-enter-space',await p.evaluate(n=>HolyMindNeural.snapshot().burstCount===n+2,n));
 n=await p.evaluate(()=>HolyMindNeural.snapshot().burstCount);
 await p.locator('[data-brain-target=hero]').evaluate(e=>{e.dispatchEvent(new PointerEvent('pointerdown',{clientX:160,clientY:200}));e.dispatchEvent(new PointerEvent('pointercancel'));e.dispatchEvent(new MouseEvent('click',{detail:1,clientX:160,clientY:200}));});
 check('cancelled-scroll-gesture-no-burst',await p.evaluate(n=>HolyMindNeural.snapshot().burstCount===n,n));
 await p.waitForTimeout(1300);
 async function goRaw(raw){const s=await p.evaluate(()=>HolyMindAssemblyScroll.snapshot());await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),s.start+raw*(s.end-s.start));await p.waitForTimeout(150);await p.waitForFunction(()=>ScrollTrigger.getAll().every(t=>!t.getTween?.()?.isActive()),{timeout:10000});await p.waitForTimeout(120);return p.evaluate(()=>({s:HolyMindAssemblyScroll.snapshot(),a:HolyMindAssembly.snapshot(),pin:document.querySelector('.assembly-pin').getBoundingClientRect().toJSON(),next:document.querySelector('.bench-layout').getBoundingClientRect().top}));}
 let v=await goRaw(-.02);check('before-entry-zero',v.s.value===0&&!v.s.active);
 const samples=[];for(const raw of [.10,.25,.50,.75,.95]){v=await goRaw(raw);samples.push(v);check('pin-holds-'+raw,v.s.active&&v.pin.top>=70&&v.pin.bottom<=845&&v.next>844,{value:v.s.value,top:v.pin.top,bottom:v.pin.bottom});if([.5,.95].includes(raw))await p.screenshot({path:out+'/pinned-mobile-'+raw+'.jpg',quality:85});}
 check('pin-position-stable',Math.max(...samples.map(x=>x.pin.top))-Math.min(...samples.map(x=>x.pin.top))<1.5);
 check('progress-monotonic',samples.every((x,i)=>!i||x.s.value>samples[i-1].s.value)&&samples.at(-1).s.value===100);
 const eased=[];for(const u of [.1,.2,.4,.5,.8,.9]){const s=await p.evaluate(()=>HolyMindAssemblyScroll.snapshot());v=await goRaw(s.lead+u*(s.finish-s.lead));eased.push(v.s.value);}
 check('slow-normal-slow',eased[3]-eased[2]>2*(eased[1]-eased[0])&&eased[3]-eased[2]>2*(eased[5]-eased[4]),{values:eased});
 const forward=await goRaw(.5);await goRaw(.98);const reverse=await goRaw(.5);check('reverse-exact-progress',forward.s.value===reverse.s.value&&Math.abs(forward.pin.top-reverse.pin.top)<1.5&&JSON.stringify(forward.a.reveals)===JSON.stringify(reverse.a.reveals));
 v=await goRaw(.96);check('complete-before-release',v.s.active&&v.s.value===100&&v.a.reveals.every(x=>x===1));
 await p.waitForTimeout(1900);
 const geo=await p.evaluate(()=>{const base=document.querySelector('.assembly-view').getBoundingClientRect();return [...document.querySelectorAll('.layer-pin')].map(pin=>{const r=pin.getBoundingClientRect(),port=document.querySelector(`[data-callout=${pin.dataset.pin}] .callout-port`).getBoundingClientRect(),line=document.querySelector(`[data-leader=${pin.dataset.pin}] .leader-line`),a=line.getPointAtLength(0),b=line.getPointAtLength(line.getTotalLength());return Math.max(Math.hypot(a.x-r.left-r.width/2+base.left,a.y-r.top-r.height/2+base.top),Math.hypot(b.x-port.left-port.width/2+base.left,b.y-port.top-port.height/2+base.top));});});
 check('real-leader-endpoints-under-1px',geo.every(x=>x<1),{errors:geo});
 await p.locator('[data-callout=intent]').click();check('callout-focus-preserved',await p.locator('[data-callout=intent]').getAttribute('aria-pressed')==='true');
 v=await goRaw(1.12);check('release-after-completion',!v.s.active&&v.s.value===100&&v.pin.top<70);
 v=await goRaw(-.02);check('reverse-reconnects-and-releases',v.s.value===0&&!v.s.active&&v.a.reveals.every(x=>x===0));
 await goRaw(.5);await p.locator('#assembly-control').fill('70');await p.waitForTimeout(700);check('manual-slider-seeks-story',await p.evaluate(()=>HolyMindAssemblyScroll.snapshot().value===70&&HolyMindAssemblyScroll.snapshot().active));
 await p.locator('#assembly-control').focus();await p.keyboard.press('Home');await p.waitForTimeout(200);check('range-home-zero',await p.locator('#assembly-control').inputValue()==='0');await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);check('range-arrow-right-expands',await p.locator('#assembly-control').inputValue()==='1');await p.keyboard.press('End');await p.waitForTimeout(250);check('range-end-100',await p.locator('#assembly-control').inputValue()==='100');
 for(const [w,h] of [[320,740],[390,844],[430,932],[680,960],[768,1000],[1024,900],[1440,1000],[844,390]]){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(800);v=await goRaw(.96);
  const data=await p.evaluate(()=>{const pin=document.querySelector('.assembly-pin').getBoundingClientRect(),view=document.querySelector('.assembly-view').getBoundingClientRect(),all=[...document.querySelectorAll('.assembly-plane,.assembly-interlayer')].map(e=>({name:e.className,r:e.getBoundingClientRect().toJSON(),opacity:getComputedStyle(e).opacity}));return {pin:pin.toJSON(),view:view.toJSON(),all,overflow:document.documentElement.scrollWidth>innerWidth,spacers:document.querySelectorAll('.pin-spacer').length,pinTriggers:ScrollTrigger.getAll().filter(t=>t.vars.id==='assembly-story').length};});
  const visible=data.all.every(x=>x.r.left>=-1&&x.r.right<=w+1&&x.r.top>=data.pin.top-1&&x.r.bottom<=h+1&&Number(x.opacity)>.5);
  check('responsive-pin-'+w+'x'+h,!data.overflow&&data.pin.top>=70&&data.pin.bottom<=h+1&&visible,{data});
  check('single-pin-after-resize-'+w,data.spacers===1&&data.pinTriggers===1);
  await p.screenshot({path:out+'/full-'+w+'x'+h+'.jpg',quality:82});
 }
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(800);await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(1000);
 const orbitAt=await p.evaluate(()=>HolyMindContinuity.snapshot().stations.find(s=>s.id==='orbit').at);
 await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),orbitAt+30);await p.waitForTimeout(1200);n=await p.evaluate(()=>HolyMindNeural.snapshot().burstCount);
 const ob=await p.locator('[data-brain-target=orbit]').boundingBox();await p.touchscreen.tap(ob.x+ob.width/2,ob.y+ob.height/2);await p.waitForTimeout(220);check('orbital-brain-tap',await p.evaluate(n=>HolyMindNeural.snapshot().burstCount===n+1,n));
 await p.screenshot({path:out+'/orbit-burst.jpg',quality:85});
 const keys=await p.evaluate(()=>HolyMindContinuity.snapshot().keys);check('ten-bridges-preserved',keys.filter((x,i)=>i&&x.id!==keys[i-1].id).length===10);
 const station=await p.evaluate(()=>{const s=HolyMindAssemblyScroll.snapshot(),c=HolyMindContinuity.snapshot();return {s,keys:c.keys.filter(x=>x.id==='assembly')};});check('continuity-stays-through-pin',station.keys.length===2&&Math.abs(station.keys[0].at-station.s.start)<1&&Math.abs(station.keys[1].at-station.s.end)<1);
 for(const ch of ['operations','knowledge','venture']){await p.locator('[data-challenge='+ch+']').click();for(let i=0;i<4;i++){await p.locator('[data-step="'+i+'"]').click();check('workbench-'+ch+'-'+i,await p.locator('[data-step="'+i+'"]').getAttribute('aria-pressed')==='true');}}
 await p.locator('#next-skill').click();await p.locator('#instrument-open').click();check('skill-dialog-preserved',await p.locator('#skill-dialog').isVisible());await p.keyboard.press('Escape');check('dialog-focus-return',await p.locator('#instrument-open').evaluate(e=>e===document.activeElement));
 await p.locator('#show-skills').click();await p.waitForTimeout(1300);check('all-34-skills-preserved',await p.locator('.skill-card').count()===34);check('pin-single-after-gallery-expansion',await p.evaluate(()=>ScrollTrigger.getAll().filter(t=>t.vars.id==='assembly-story').length===1));
 await p.locator('#skill-search').fill('zz-no-results');await p.waitForTimeout(200);check('search-empty-state',await p.locator('#skills-empty').isVisible());await p.locator('#clear-search').click();
 await p.goto(base+'#system-assembly',{waitUntil:'networkidle'});await p.waitForTimeout(1300);check('direct-anchor-load-no-errors',await p.evaluate(()=>HolyMindAssemblyScroll.enabled()&&Number.isFinite(HolyMindAssemblyScroll.snapshot().start)));
 const fallback=await browser.newPage({viewport:{width:390,height:844}});await fallback.route('**/assets/vendor/**',r=>r.abort());await fallback.goto(base,{waitUntil:'networkidle'});await fallback.locator('#assembly-control').fill('100');check('missing-library-manual-fallback',await fallback.locator('#system-assembly').getAttribute('data-assembly-mode')==='manual'&&await fallback.locator('#assembly-control').inputValue()==='100');await fallback.close();
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto(base,{waitUntil:'networkidle'});check('nojs-content-accessible',await nojs.locator('.hero-brain').isVisible()&&await nojs.locator('.assembly-guide').isVisible());await nojs.close();
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
