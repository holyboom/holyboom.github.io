const {chromium,webkit}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8791/',out=process.env.QA_DIR||'qa-output/contact-readme-'+engine,linkedin='https://www.linkedin.com/in/boom-theerawee';
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const b=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindJourney&&HolyMindSkills.list().length===34&&window.HolyMindBoomCelebration);await p.waitForTimeout(800);
 check('release-v28',await p.locator('html').getAttribute('data-build')==='linkedin-fieldnotes-v28');
 check('silent-load',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
 check('no-active-instagram-links',await p.locator('a[href*="instagram.com"]').count()===0);
 const links=await p.locator('a[href*="linkedin.com"]').evaluateAll(es=>es.map(e=>({text:e.textContent.trim(),url:e.href,rel:e.rel})));
 check('three-current-linkedin-destinations',links.length===3&&links.every(l=>l.url===linkedin),{links});
 check('primary-contact-is-linkedin',(await p.locator('#connect .button-primary').getAttribute('href'))===linkedin&&(await p.locator('#connect .button-primary').innerText()).includes('LinkedIn'));
 const ld=await p.locator('script[type="application/ld+json"]').textContent(),schema=JSON.parse(ld);
 check('inline-sameas-updated',schema.mainEntity.sameAs.includes(linkedin)&&!ld.includes('instagram.com'));
 const profile=await(await p.request.get(new URL('profile-schema.json',base).href)).json(),text=await(await p.request.get(new URL('llms.txt',base).href)).text();
 check('external-schema-agrees',profile.mainEntity.sameAs.includes(linkedin)&&!JSON.stringify(profile).includes('instagram.com'));
 check('machine-readable-contact-agrees',text.includes('LinkedIn: '+linkedin)&&!text.includes('Instagram'));
 check('short-default-route-retained',await p.evaluate(()=>document.documentElement.scrollHeight<9000&&!document.querySelector('#skill-library').open));
 for(const challenge of ['operations','knowledge','venture']){
  await p.locator('[data-challenge='+challenge+']').click();await p.locator('[data-step="2"]').click();
  const s=await p.evaluate(()=>HolyMindJourney.snapshot());
  check('generated-contact-'+challenge,s.brief.includes(linkedin)&&!s.brief.includes('instagram.com'));
 }
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__brief=text;}}}));
 await p.locator('#copy-journey').click();check('clipboard-receives-linkedin-brief',await p.evaluate(url=>__brief.includes(url)&&!__brief.includes('instagram.com'),linkedin));
 await p.locator('#reset-journey').click();await p.locator('#instrument-open').click();await p.locator('#carry-skill').click();await p.locator('#close-skill-dialog').click();
 check('skill-only-brief-also-uses-linkedin',await p.evaluate(url=>{const s=HolyMindJourney.snapshot();return !s.challenge&&!!s.skill&&s.brief.includes(url);},linkedin));
 await p.locator('#connect .button-primary').scrollIntoViewIfNeeded();await p.waitForTimeout(700);await p.screenshot({path:out+'/website-contact-mobile.jpg',quality:85});
 check('art-motion-and-sound-preserved',await p.evaluate(()=>HolyMindBoomModel.particleCount===259&&HolyMindTimbres.presets.length===14&&document.body.dataset.motion==='on'&&document.querySelectorAll('[data-sound-level]').length===4));
 for(const width of [320,390,768,1440]){await p.setViewportSize({width,height:900});await p.waitForTimeout(700);await p.locator('#connect .button-primary').scrollIntoViewIfNeeded();check('website-no-horizontal-overflow-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 const nojs=await b.newPage({javaScriptEnabled:false});await nojs.goto(base,{waitUntil:'networkidle'});check('static-html-brief-and-cta-agree',(await nojs.locator('#project-brief').inputValue()).includes(linkedin)&&await nojs.locator('#connect .button-primary').getAttribute('href')===linkedin);await nojs.close();
 const r=await b.newPage({viewport:{width:390,height:844}});r.on('pageerror',e=>errors.push('readme:'+e.message));await r.goto(new URL('qa/fieldnotes-v28.html',base).href,{waitUntil:'networkidle'});
 check('readme-native-linkedin-actions',await r.locator('.markdown-body a[href="'+linkedin+'"]').count()===2);
 check('readme-historical-content-deferred',await r.locator('.markdown-body details').count()===1&&!await r.locator('.markdown-body details').getAttribute('open'));
 check('readme-has-text-without-art',(await r.locator('.markdown-body').innerText()).includes('Theerawee')&&(await r.locator('.markdown-body').innerText()).includes('not a live AI service'));
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await r.setViewportSize({width,height:1000});await r.emulateMedia({colorScheme:theme});await r.waitForFunction(({width,theme})=>[...document.querySelectorAll('.markdown-body picture img')].every(i=>i.complete&&i.naturalWidth>0&&i.currentSrc.endsWith((width<=600?'mobile':'desktop')+'-'+theme+'.png')),{width,theme},{timeout:10000});
  const v=await r.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.querySelectorAll('.markdown-body picture img')].map(i=>({src:i.currentSrc,alt:i.alt,width:i.naturalWidth}))}));
  const size=width<=600?'mobile':'desktop';check('readme-'+width+'-'+theme,!v.overflow&&v.images.length===2&&v.images.every(i=>i.src.endsWith(size+'-'+theme+'.png')&&i.alt.length>30),v);
  if(width===390||width===1440)await r.screenshot({path:out+'/readme-'+size+'-'+theme+'.jpg',fullPage:true,quality:85});
 }
 await r.locator('.markdown-body details>summary').click();check('engineering-notes-accessible',await r.locator('.markdown-body a[href="../docs/ENGINEERING.md"]').isVisible());
 const localLinks=await r.locator('.markdown-body a').evaluateAll(es=>es.map(e=>e.href));
 for(const url of [...new Set(localLinks)].filter(u=>u.startsWith(new URL(base).origin)&&!u.includes('#'))){const response=await r.request.get(url);check('readme-internal-link-'+new URL(url).pathname,response.ok(),{status:response.status()});}
 await r.close();const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
