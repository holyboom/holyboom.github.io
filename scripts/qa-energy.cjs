/* Spark v8 acceptance: real pixels, responsive ordering, all handoffs, controls and lifecycle. */
const {chromium,webkit}=require('playwright');const fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'chromium',base=process.env.TEST_URL||'http://127.0.0.1:8771/',out=process.env.QA_DIR||'qa-output/energy-'+engine;fs.mkdirSync(out,{recursive:true});
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 const checks=[],errors=[],p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 const check=(name,pass,detail={})=>{checks.push({name,pass,...detail});console.log(name,pass);};
 const goto=async()=>{await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindNeural?.snapshot().paths===46);await p.waitForTimeout(1100);};
 const scroll=async y=>{await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(100);
  await p.waitForFunction(targetY=>{
   const snapshot=HolyMindContinuity.snapshot();
   const target=Math.max(0,Math.min(targetY,document.documentElement.scrollHeight-innerHeight));
   const images=[...document.images].filter(im=>{const r=im.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});
   return Math.abs(scrollY-target)<1.1&&Math.abs(snapshot.renderedScrollY-scrollY)<1.1&&images.every(im=>im.complete)&&!snapshot.running&&ScrollTrigger.getAll().every(st=>!st.getTween?.()?.isActive());
  },y,{timeout:15000});
 };
 const go=async sel=>{const top=await p.locator(sel).evaluate(e=>e.getBoundingClientRect().top+scrollY);await scroll(top-105);};
 await p.addInitScript(()=>localStorage.setItem('holyboom-motion','off'));await goto();
 check('release-v8',await p.locator('html').getAttribute('data-build')==='spark-v8');
 check('legacy-off-does-not-disable',await p.locator('body').getAttribute('data-motion')==='on'&&await p.locator('body').getAttribute('data-motion-profile')==='full');
 check('motion-toggle-removed',await p.locator('#motion-toggle,.motion-toggle').count()===0);
 check('two-hero-shortcuts-removed',await p.locator('.hero-actions').count()===0);
 check('scroll-hint-is-not-a-jump-link',await p.locator('.hero-visual a').count()===0);
 let a=await p.locator('#neural-sparks').evaluate(e=>e.toDataURL());await p.waitForTimeout(600);let b=await p.locator('#neural-sparks').evaluate(e=>e.toDataURL());check('hero-actual-pixels-animate',a!==b);
 check('more-source-aligned-pulses',await p.evaluate(()=>{const s=HolyMindNeural.snapshot();return s.paths===46&&s.branches===18&&s.contour===96;}));
 await p.screenshot({path:out+'/desktop-hero.jpg',quality:86});
 for(const [w,h] of [[320,740],[390,844],[430,932],[680,960],[768,1000],[1024,1000],[1440,1000]]){
  await p.setViewportSize({width:w,height:h});await scroll(0);
  const box=await p.evaluate(()=>{const a=document.querySelector('.neural-stage').getBoundingClientRect(),b=document.querySelector('.hero-copy').getBoundingClientRect();return {brain:a.toJSON(),copy:b.toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};});
  check('hero-layout-'+w,!box.overflow&&(w<=680?box.brain.top<box.copy.top&&box.brain.bottom<h:box.copy.left<box.brain.left&&box.brain.top<box.copy.bottom),{brain:box.brain,copy:box.copy});
  if(w===390||w===768)await p.screenshot({path:out+'/hero-'+w+'.jpg',quality:86});
 }
 // Every reversible bridge still connects, and its receiver really responds.
 const keys=await p.evaluate(()=>HolyMindContinuity.snapshot().keys);const bridges=[];for(let i=0;i<keys.length-1;i++)if(keys[i].id!==keys[i+1].id)bridges.push([keys[i],keys[i+1]]);
 check('all-ten-bridges-retained',bridges.length===10);
 for(const [from,to] of bridges){
  const mid=(from.at+to.at)/2;await scroll(mid);const f=await p.evaluate(()=>({c:HolyMindContinuity.snapshot(),e:HolyMindEnergy.snapshot()}));
  if(from.id==='neural'){
   a=await p.locator('.neural-transit-sparks').evaluate(c=>c.toDataURL());await p.waitForTimeout(550);b=await p.locator('.neural-transit-sparks').evaluate(c=>c.toDataURL());
   check('spark-travels-with-brain',a!==b&&await p.evaluate(()=>HolyMindNeural.snapshot().transporting)&&await p.locator('.continuity-transferred').count()===2);
   await p.screenshot({path:out+'/brain-handoff.jpg',quality:86});
  }
  await scroll(from.at+(to.at-from.at)*.96);const glow=await p.evaluate(()=>HolyMindEnergy.snapshot());check('receiver-'+to.id,glow.levels[to.id]>.85,{level:glow.levels[to.id]});
  if(['orbit','assembly','skills','signature','portal'].includes(to.id))await p.screenshot({path:out+'/receiver-'+to.id+'.jpg',quality:80});
  await scroll(mid);const r=await p.evaluate(()=>({c:HolyMindContinuity.snapshot(),e:HolyMindEnergy.snapshot()}));
  check('reverse-'+from.id+'-'+to.id,Math.abs(f.c.x-r.c.x)<1.6&&Math.abs(f.c.y-r.c.y)<1.6&&Math.abs((f.e.levels[to.id]||0)-(r.e.levels[to.id]||0))<.01,{forward:{x:f.c.x,y:f.c.y,level:f.e.levels[to.id]},reverse:{x:r.c.x,y:r.c.y,level:r.e.levels[to.id]}});
 }
 const station=await p.evaluate(()=>HolyMindContinuity.snapshot().stations.find(s=>s.id==='orbit').at);await scroll(station+10);
 a=await p.locator('.orbit-sparks').evaluate(c=>c.toDataURL());await p.waitForTimeout(600);b=await p.locator('.orbit-sparks').evaluate(c=>c.toDataURL());check('orbit-keeps-brain-sparking',a!==b&&await p.locator('.continuity-transferred').count()===0);
 await go('#connect');await p.waitForTimeout(1100);const frame=await p.evaluate(()=>HolyMindNeural.snapshot().frames);await p.waitForTimeout(500);check('offscreen-renderer-stops',await p.evaluate(()=>HolyMindNeural.snapshot().frames)===frame);
 // Original controls never become controlled by the new lighting.
 await go('#system-assembly');await p.locator('#assembly-control').fill('0');const z0=await p.locator('.plane-intent').evaluate(e=>getComputedStyle(e).transform);await p.locator('#assembly-control').fill('100');await p.waitForTimeout(2300);const z1=await p.locator('.plane-intent').evaluate(e=>getComputedStyle(e).transform);
 check('right-expands-all-three-layers',z0!==z1&&await p.evaluate(()=>HolyMindAssembly.snapshot().reveals.every(v=>v===1)));
 const geo=await p.evaluate(()=>{const v=document.querySelector('.assembly-view').getBoundingClientRect();return [...document.querySelectorAll('.layer-pin')].map(pin=>{const kind=pin.dataset.pin,port=document.querySelector(`[data-callout=${kind}] .callout-port`),line=document.querySelector(`[data-leader=${kind}] .leader-line`),a=pin.getBoundingClientRect(),b=port.getBoundingClientRect(),p=line.getPointAtLength(0),q=line.getPointAtLength(line.getTotalLength());return Math.max(Math.hypot(p.x-a.left-a.width/2+v.left,p.y-a.top-a.height/2+v.top),Math.hypot(q.x-b.left-b.width/2+v.left,q.y-b.top-b.height/2+v.top));});});
 check('leader-endpoints-still-within-1px',geo.every(v=>v<1),{errors:geo});await p.locator('[data-callout=intent]').click();check('layer-focus-still-works',await p.locator('[data-callout=intent]').getAttribute('aria-pressed')==='true');await p.locator('#assembly-control').fill('0');await p.waitForTimeout(400);check('left-connects-and-retracts',await p.evaluate(()=>HolyMindAssembly.snapshot().reveals.every(v=>v===0)));
 for(const ch of ['operations','knowledge','venture']){await p.locator('[data-challenge='+ch+']').click();for(let i=0;i<4;i++){await p.locator('[data-step="'+i+'"]').click();check('scenario-'+ch+'-'+i,await p.locator('[data-step="'+i+'"]').getAttribute('aria-pressed')==='true');}}
 await go('#skill-instrument');for(let i=0;i<6;i++){const old=await p.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill');await p.locator('#next-skill').click();check('deck-next-'+i,(await p.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill'))!==old);}
 await p.locator('#instrument-open').click();check('dialog-light-layer-does-not-block',await p.locator('#skill-dialog').isVisible()&&await p.locator('.energy-reception').evaluate(e=>getComputedStyle(e).display==='none'));await p.keyboard.press('Escape');check('dialog-focus-returns',await p.locator('#instrument-open').evaluate(e=>e===document.activeElement));
 for(const [cat,count] of [['reason',13],['build',12],['verify',9]]){await p.locator(`[data-filter=${cat}]`).click();await p.waitForTimeout(200);check('filter-'+cat,await p.locator('.skill-card').count()===count);}
 await p.locator('[data-filter=all]').click();await p.locator('#show-skills').click();await p.waitForTimeout(1300);check('all-34-skills',await p.locator('.skill-card').count()===34);check('route-remeasures-expansion',Number(await p.locator('.continuity-layer').getAttribute('data-measured-height'))===await p.evaluate(()=>document.documentElement.scrollHeight));await p.locator('#skill-search').fill('zz-no-match');await p.waitForTimeout(200);check('empty-state',await p.locator('#skills-empty').isVisible());await p.locator('#clear-search').click();
 for(const w of [320,390,768,1024,1440]){await p.setViewportSize({width:w,height:w<=680?844:1000});await p.waitForTimeout(400);const over=[];for(const sel of ['#top','#mind-flow','#system-assembly','#framework','#what-i-do','#about','#connect']){await go(sel);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth))over.push(sel);}check('responsive-page-'+w,!over.length,{over});}
 const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});touch.on('pageerror',e=>errors.push('touch: '+e.message));await touch.goto(base,{waitUntil:'networkidle'});await touch.waitForTimeout(700);await touch.screenshot({path:out+'/touch-mobile.jpg',quality:86});await touch.locator('#menu-toggle').tap();check('touch-menu',await touch.locator('#menu-toggle').getAttribute('aria-expanded')==='true');await touch.locator('#menu-toggle').tap();await touch.locator('#assembly-control').tap({position:{x:330,y:22}});check('touch-expands',Number(await touch.locator('#assembly-control').inputValue())>90);await touch.locator('#next-skill').tap();check('touch-deck',await touch.locator('.deck-shard[aria-pressed=true]').getAttribute('data-skill')==='chain-of-verification');
 await touch.setViewportSize({width:844,height:390});await touch.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await touch.waitForTimeout(1000);check('phone-landscape-brain-first',await touch.evaluate(()=>document.querySelector('.neural-stage').getBoundingClientRect().top<document.querySelector('.hero-copy').getBoundingClientRect().top));
 await p.setViewportSize({width:390,height:844});await goto();await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(1000);check('system-calm-without-toggle',await p.locator('body').getAttribute('data-motion')==='on'&&await p.locator('body').getAttribute('data-motion-profile')==='calm'&&await p.evaluate(()=>ScrollTrigger.getAll().length===0));check('calm-original-art-restored',await p.locator('.continuity-transferred').count()===0);await p.locator('#assembly-control').fill('100');await p.locator('.assembly-view').scrollIntoViewIfNeeded();await p.waitForTimeout(300);check('calm-explicit-control',await p.locator('[data-callout=evidence]').isVisible());await p.emulateMedia({reducedMotion:'no-preference'});await scroll(0);check('system-profile-restores-automatically',await p.locator('body').getAttribute('data-motion-profile')==='full'&&await p.evaluate(()=>HolyMindNeural.snapshot().running));
 const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});await nojs.goto(base,{waitUntil:'networkidle'});check('nojs-original-and-guide',await nojs.locator('.hero-brain').isVisible()&&await nojs.locator('.assembly-guide').isVisible()&&await nojs.locator('.continuity-layer').count()===0);
 const fall=await browser.newPage({viewport:{width:390,height:844}});await fall.route('**/assets/vendor/**',r=>r.abort());await fall.goto(base,{waitUntil:'networkidle'});await fall.waitForTimeout(600);check('library-failure-keeps-brain-animation',await fall.evaluate(()=>HolyMindNeural.snapshot().frames>0)&&await fall.locator('body').getAttribute('data-showcase-engine')==='static');
 await p.goto(new URL('profile-schema.json',base).href);await p.goBack({waitUntil:'networkidle'});await p.waitForTimeout(1200);check('back-navigation-resumes',await p.evaluate(()=>HolyMindNeural.snapshot().running));
 const perf=await p.evaluate(()=>HolyMindNeural.snapshot());check('original-art-loads',await p.locator('img').evaluateAll(es=>es.filter(e=>e.complete&&!e.naturalWidth).length===0));
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({engine,base,checks,errors,failed,renderer:perf,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed,errors,renderer:perf}));await browser.close();if(failed.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
