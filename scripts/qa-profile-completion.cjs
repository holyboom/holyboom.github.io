/* Public work paths and the ending remain usable with keyboard and without JS. */
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:4174/',out=process.env.COMPLETION_QA_DIR||'docs/evidence/complete/interaction';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
(async()=>{const b=await chromium.launch();try{
 for(const width of [1440,390,320]){
  const p=await b.newPage({viewport:{width,height:width===1440?1000:844}});p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'profile/');await p.waitForFunction(()=>window.ProfileExperience);await p.evaluate(()=>document.fonts.ready);
  await p.locator('.capability-link[href="#work-paths"]').click();await p.waitForFunction(()=>location.hash==='#work-paths');await p.waitForTimeout(700);
  check('capability-links-into-real-work-'+width,await p.locator('.work-path').count()===3);
  for(const id of ['review','sources','intent']){
   const summary=p.locator('#work-'+id+' summary');await summary.focus();await p.waitForTimeout(200);await p.waitForFunction(()=>ProfileExperience.snapshot().current===ProfileExperience.snapshot().target);const before=await p.evaluate(()=>ProfileExperience.snapshot().current);
   await p.keyboard.press('Enter');await p.waitForTimeout(200);const after=await p.evaluate(()=>ProfileExperience.snapshot().current);
   check('keyboard-opens-'+id+'-'+width,await p.locator('#work-'+id).evaluate(e=>e.open)&&await p.locator('#work-'+id+' .proof-route').isVisible());
   check('work-disclosure-preserves-scene-'+id+'-'+width,Math.abs(after-before)<.005,{before,after});
   await summary.focus();await p.keyboard.press('Space');await p.waitForTimeout(100);check('keyboard-closes-'+id+'-'+width,!await p.locator('#work-'+id).evaluate(e=>e.open));
  }
  await p.locator('#work-review summary').focus();await p.keyboard.press('Enter');await p.waitForTimeout(150);await p.screenshot({path:path.join(out,'work-'+width+'.png')});
  check('no-horizontal-overflow-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.evaluate(()=>document.querySelector('#contact').scrollIntoView({behavior:'instant'}));await p.waitForTimeout(400);check('ending-recalls-the-first-line-'+width,await p.locator('.closing-line').innerText()==='I still build places for people. The medium has changed.');
  await p.screenshot({path:path.join(out,'closing-'+width+'.png')});
  await p.locator('.return-to-line').click();await p.waitForFunction(()=>location.hash==='#origins'&&Math.abs(document.querySelector('#origins').getBoundingClientRect().top-parseFloat(getComputedStyle(document.querySelector('#origins')).scrollMarginTop))<3);check('return-to-the-first-line-'+width,await p.evaluate(()=>{const e=document.querySelector('#origins');return Math.abs(e.getBoundingClientRect().top-parseFloat(getComputedStyle(e).scrollMarginTop))<3;}));
  if(width===1440){
   const links=await p.locator('.work-path .path-links a').evaluateAll(a=>a.map(x=>x.getAttribute('href')));
   for(const href of [...new Set(links)]){const url=new URL(href,base),r=await p.request.get(url.href),body=await r.text(),id=url.hash.slice(1);check('public-proof-link-'+href,r.ok()&&(!id||body.includes('id="'+id+'"')),{status:r.status()});}
  }
  await p.close();
 }
 for(const mode of ['no-js','os-reduced-full']){
  const p=await b.newPage({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})});await p.goto(base+'profile/');
  await p.locator('#work-sources summary').click();check(mode+'-work-path-is-native',await p.locator('#work-sources').evaluate(e=>e.open)&&await p.locator('#work-sources .path-links a').first().isVisible());
  if(mode==='no-js')check(mode+'-closing-art-is-present',await p.locator('#contact .scene-fallback img').isVisible());else {await p.locator('#contact').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await p.waitForFunction(()=>window.ProfileExperience?.snapshot().target===10);check(mode+'-closing-art-is-present',await p.locator('#architecture').isVisible()&&await p.evaluate(()=>ProfileExperience.snapshot().mode==='full'));}await p.close();
 }
 check('no-browser-errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out},null,2));if(failed.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
