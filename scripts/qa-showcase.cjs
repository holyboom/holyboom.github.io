
// v8 removed the site toggle; exercise the real OS preference instead.
async function toggleMotion(page){const calm=await page.locator('body').getAttribute('data-motion-profile')==='calm';await page.emulateMedia({reducedMotion:calm?'no-preference':'reduce'});}
const {chromium,webkit}=require('playwright');
const fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'chromium';
 const browser=engine==='webkit'?await webkit.launch({headless:true}):await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined)});
 const base=process.env.TEST_URL||'http://127.0.0.1:8768/';const out=process.env.QA_DIR||'qa-output/showcase-'+engine;fs.mkdirSync(out,{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
 await page.goto(base,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.body.dataset.showcaseEngine==='ready');await page.waitForTimeout(800);
 const check=(name,pass,extra={})=>{checks.push({name,pass,...extra});console.log(name,pass);};
 const go=async(sel,offset=100)=>{const y=await page.locator(sel).evaluate(el=>el.getBoundingClientRect().top+scrollY);await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y-offset);await page.waitForTimeout(850);};
 check('release-key',await page.locator('html').getAttribute('data-build')===(process.env.EXPECT_BUILD||'spark-v8'));
 check('six-scenes',await page.locator('[data-scene]').count()===6);
 for(const [name,sel] of Object.entries({hero:'.hero',crossing:'.signal-crossing',assembly:'.assembly-exhibit',instrument:'.skill-instrument',services:'.approach-list',signature:'.about',portal:'.connect'})){
  await go(sel);await page.screenshot({path:out+'/desktop-'+name+'.jpg',quality:80});
 }
 await go('.assembly-exhibit');
 await page.locator('#assembly-control').fill('0');let a=await page.locator('.plane-intent').evaluate(el=>getComputedStyle(el).transform);
 await page.locator('#assembly-control').fill('100');let b=await page.locator('.plane-intent').evaluate(el=>getComputedStyle(el).transform);check('slider-connects',a!==b,{a,b});
 await page.locator('#assembly-control').fill('35');
 await page.locator('#assembly-control').focus();await page.keyboard.press('ArrowRight');check('slider-keyboard',await page.locator('#assembly-control').inputValue()==='36');
 await go('.skill-instrument');
 for(let i=0;i<6;i++){
  await page.locator('.deck-shard').nth(i).click();
  check('deck-'+i,await page.locator('.deck-shard').nth(i).getAttribute('aria-pressed')==='true');
  await page.locator('#instrument-open').click();
  const want=await page.locator('.deck-shard').nth(i).getAttribute('data-title');const actual=await page.locator('#skill-dialog-title').innerText();
  check('deck-dialog-'+i,(await page.locator('#skill-dialog').isVisible())&&want===actual,{want,actual});await page.keyboard.press('Escape');
  check('deck-focus-return-'+i,await page.locator('#instrument-open').evaluate(el=>el===document.activeElement));
 }
 await page.locator('.deck-shard').first().focus();await page.keyboard.press('End');check('deck-keyboard-end',await page.locator('.deck-shard').last().getAttribute('aria-pressed')==='true');
 await page.keyboard.press('Home');check('deck-keyboard-home',await page.locator('.deck-shard').first().getAttribute('aria-pressed')==='true');
 for(let i=0;i<3;i++){
  const d=page.locator('.approach-list details').nth(i);await d.locator('summary').click();if(!(await d.getAttribute('open'))&&await d.evaluate(e=>!e.open))await d.locator('summary').click();
  check('service-open-'+i,await d.evaluate(el=>el.open));
 }
 await page.locator('[data-challenge=knowledge]').click();await page.locator('[data-step="1"]').click();
 check('workbench-updates-art',(await page.locator('#assembly-skill').getAttribute('src'))===(await page.locator('#stage-icon').getAttribute('src')));
 // Distinct scene matrices must follow scroll, not a cosmetic label.
 for(const [name,scene,target] of [['assembly-scroll','.assembly-exhibit','.assembly-rotor'],['deck-scroll','.skill-instrument','.deck-fan'],['signature-scroll','.about','.signature-depth'],['portal-scroll','.connect','.portal-frame']]){
  await go(scene,700);a=await page.locator(target).first().evaluate(e=>e instanceof SVGGraphicsElement ? JSON.stringify(['a','b','c','d','e','f'].map(k=>e.getCTM()[k])) : getComputedStyle(e).transform);await go(scene,140);b=await page.locator(target).first().evaluate(e=>e instanceof SVGGraphicsElement ? JSON.stringify(['a','b','c','d','e','f'].map(k=>e.getCTM()[k])) : getComputedStyle(e).transform);check(name,a!==b,{a,b});
 }
 await toggleMotion(page);await page.waitForTimeout(300);check('pause-all',await page.locator('body').getAttribute('data-showcase-engine')==='paused'&&await page.evaluate(()=>ScrollTrigger.getAll().length===0));
 await page.locator('#assembly-control').fill('80');check('static-interaction',await page.locator('.assembly-exhibit').getAttribute('data-expanded')==='80');await toggleMotion(page);
 for(const w of [320,390,680,768,1024,1440]){
  await page.setViewportSize({width:w,height:w<=680?844:1000});await page.waitForTimeout(500);
  let over=[],missing=[];for(const sel of ['#top','#mind-flow','.signal-crossing','.assembly-exhibit','.skill-instrument','#framework','#what-i-do','#about','#connect']){
   await go(sel);if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))over.push(sel);
  }
  check('responsive-'+w,over.length===0,{overflow:over});
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(550);
 for(const [name,sel] of Object.entries({assembly:'.assembly-exhibit',instrument:'.skill-instrument',services:'.approach-list',signature:'.about',portal:'.connect'})){
  await go(sel,92);await page.screenshot({path:out+'/mobile-'+name+'.jpg',quality:80});
 }
 await go('.skill-instrument');for(let i=0;i<6;i++){const old=await page.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill');await page.locator('#next-skill').click();check('mobile-deck-next-'+i,(await page.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill'))!==old);}
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});await reduced.goto(base,{waitUntil:'networkidle'});check('reduced-motion',await reduced.locator('body').getAttribute('data-showcase-engine')==='paused'&&await reduced.evaluate(()=>ScrollTrigger.getAll().length===0));
 await reduced.locator('#assembly-control').fill('100');check('reduced-motion-slider',await reduced.locator('.assembly-exhibit').getAttribute('data-expanded')==='100');
 const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});await nojs.goto(base,{waitUntil:'networkidle'});check('nojs-content',await nojs.locator('#hero-heading').isVisible()&&await nojs.locator('.connect-action a').isVisible());
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);
 check('all-images-load',await page.locator('img').evaluateAll(es=>es.filter(e=>e.complete&&!e.naturalWidth).length===0));
 const countBefore=await page.evaluate(()=>ScrollTrigger.getAll().length);
 for(let i=0;i<3;i++){await toggleMotion(page);await toggleMotion(page);}
 check('no-trigger-leak',await page.evaluate(()=>ScrollTrigger.getAll().length)===countBefore,{before:countBefore,after:await page.evaluate(()=>ScrollTrigger.getAll().length)});
 const fallback=await browser.newPage({viewport:{width:390,height:844}});
 await fallback.route('**/assets/vendor/**',route=>route.abort());
 await fallback.goto(base,{waitUntil:'networkidle'});await fallback.locator('#assembly-control').fill('70');
 check('missing-library-static-fallback',await fallback.locator('body').getAttribute('data-showcase-engine')==='static'&&await fallback.locator('.assembly-exhibit').getAttribute('data-expanded')==='70');
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 touch.on('pageerror',e=>errors.push('touch: '+e.message));
 await touch.goto(base,{waitUntil:'networkidle'});await touch.locator('#next-skill').tap();
 check('touch-deck-navigation',await touch.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill')==='chain-of-verification');
 await touch.locator('#assembly-control').tap({position:{x:260,y:22}});
 check('touch-slider',Number(await touch.locator('#assembly-control').inputValue())!==35);
 await touch.locator('#menu-toggle').tap();check('touch-menu',await touch.locator('#menu-toggle').getAttribute('aria-expanded')==='true');
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/qa-result.json',JSON.stringify({base,engine,errors,checks,failed},null,2));console.log(JSON.stringify({engine,errors,checks,failed}));await browser.close();if(errors.length||failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
