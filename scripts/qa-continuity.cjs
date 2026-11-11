/* Verify actual shared-element transfer, every seam in both directions and dynamic layouts. */
const {chromium,webkit}=require('playwright');const fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'chromium',out=process.env.QA_DIR||'/tmp/holymind-continuity-v6/qa-'+engine;fs.mkdirSync(out,{recursive:true});
 const browser=engine==='webkit'?await webkit.launch({headless:true}):await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const base=process.env.TEST_URL||'http://127.0.0.1:8769/',page=await browser.newPage({viewport:{width:1440,height:1000}}),checks=[],errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 const check=(name,pass,detail={})=>{checks.push({name,pass,...detail});console.log(name,pass);};
 const go=async y=>{await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(1020);return await page.evaluate(()=>HolyMindContinuity.snapshot());};
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForTimeout(1100);
 check('release-v6',await page.locator('html').getAttribute('data-build')==='continuity-v6');
 check('single-shared-carrier',await page.locator('.continuity-carrier').count()===1&&await page.locator('.continuity-brain').count()===1);
 check('pointer-transparent',await page.locator('.continuity-layer').evaluate(el=>getComputedStyle(el).pointerEvents==='none'));
 const initial=await page.evaluate(()=>HolyMindContinuity.snapshot());check('eleven-stations',initial.stations.length===11);
 const keys=initial.keys,bridges=[];
 for(let i=0;i<keys.length-1;i++)if(keys[i].id!==keys[i+1].id)bridges.push([keys[i],keys[i+1]]);
 for(const [a,b] of bridges){
  const middle=(a.at+b.at)/2;await go(a.at+2);const forward=await go(middle);
  const visible=forward.x>=0&&forward.x<=1440&&forward.y>=86&&forward.y<=1000;
  check('visible-'+a.id+'-'+b.id,visible,{x:forward.x,y:forward.y});
  if(a.id==='neural')check('original-brain-transferred',await page.locator('.continuity-transferred').count()===2&&await page.locator('.continuity-brain').evaluate(e=>getComputedStyle(e).visibility==='visible'));
  if(a.id==='ribbon')check('original-crystal-transferred',await page.locator('.band-one img.continuity-transferred').count()===1&&await page.locator('#assembly-skill.continuity-transferred').count()===1);
  await page.screenshot({path:out+'/desktop-'+a.id+'-'+b.id+'.jpg',quality:78});
  await go(b.at-2);const reverse=await go(middle);
  check('reversible-'+a.id+'-'+b.id,Math.abs(forward.x-reverse.x)<1.5&&Math.abs(forward.y-reverse.y)<1.5&&forward.from===reverse.from&&forward.to===reverse.to,{forward:{x:forward.x,y:forward.y},reverse:{x:reverse.x,y:reverse.y}});
 }
 await go(initial.stations.find(s=>s.id==='orbit').at+10);check('original-brain-restored',await page.locator('.continuity-transferred').count()===0);
 await go(500);await page.locator('#motion-toggle').click();await page.waitForTimeout(200);
 check('pause-restores-art',await page.locator('.continuity-transferred').count()===0&&await page.locator('.continuity-layer').evaluate(e=>getComputedStyle(e).display==='none'));
 await page.locator('#motion-toggle').click();await page.waitForTimeout(1100);check('resume-current-position',await page.locator('body').getAttribute('data-continuity')==='ready');
 check('no-idle-loop',!(await page.evaluate(()=>HolyMindContinuity.snapshot())).running);
 const priorHeight=await page.locator('.continuity-layer').getAttribute('data-measured-height');
 await page.locator('#show-skills').click();await page.waitForTimeout(1500);
 check('expanded-gallery-remeasured',await page.locator('.continuity-layer').getAttribute('data-measured-height')!==priorHeight&&await page.locator('.skill-card').count()===34);
 await page.locator('#show-skills').click();await page.waitForTimeout(1300);
 await page.locator('.about-story summary').click();await page.waitForTimeout(1100);const size=await page.evaluate(()=>document.documentElement.scrollHeight);
 check('disclosure-remeasured',Number(await page.locator('.continuity-layer').getAttribute('data-measured-height'))===size);
 await page.locator('.about-story summary').click();await page.waitForTimeout(1100);
 await page.locator('#next-skill').click();await page.waitForTimeout(500);check('deck-control-still-works',await page.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill')==='chain-of-verification');
 await page.locator('#instrument-open').click();check('overlay-yields-to-dialog',await page.locator('#skill-dialog').isVisible()&&await page.locator('.continuity-layer').evaluate(e=>getComputedStyle(e).display==='none'));await page.keyboard.press('Escape');
 for(const width of [320,390,680,768,1024,1440]){
  await page.setViewportSize({width,height:width<700?844:1000});await go(0);const k=(await page.evaluate(()=>HolyMindContinuity.snapshot())).keys;let overflow=[],offscreen=[];
  for(let i=0;i<k.length-1;i++){if(k[i].id===k[i+1].id)continue;const v=await go((k[i].at+k[i+1].at)/2);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))overflow.push(k[i].id);if(v.x<0||v.x>width||v.y<72||v.y>(width<700?844:1000))offscreen.push({id:k[i].id,x:v.x,y:v.y});if(width===390)await page.screenshot({path:out+'/mobile-'+k[i].id+'-'+k[i+1].id+'.jpg',quality:78});}
  check('responsive-'+width,!overflow.length&&!offscreen.length,{overflow,offscreen});
 }
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});await reduced.goto(base,{waitUntil:'networkidle'});await reduced.waitForTimeout(300);
 check('reduced-motion-static',await reduced.locator('body').getAttribute('data-continuity')==='paused'&&await reduced.locator('.continuity-transferred').count()===0);
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(base,{waitUntil:'networkidle'});check('nojs-preserves-originals',await nojs.locator('.hero-brain').isVisible()&&await nojs.locator('.orbit-brain').isVisible()&&await nojs.locator('.continuity-layer').count()===0);
 await page.goto(base+'#system-assembly',{waitUntil:'networkidle'});await page.waitForTimeout(1300);check('direct-anchor-load',await page.locator('body').getAttribute('data-continuity')==='ready'&&Number.isFinite((await page.evaluate(()=>HolyMindContinuity.snapshot())).x));
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,errors,failed},null,2));console.log(JSON.stringify({count:checks.length,errors,failed}));await browser.close();if(failed.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
