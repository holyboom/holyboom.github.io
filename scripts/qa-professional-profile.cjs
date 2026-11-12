/* Check actual static content and links, not search ranking or an AI's future recommendation. */
const {webkit,chromium}=require('playwright'),fs=require('fs');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8792/',out=process.env.QA_DIR||'/tmp/holymind-recruiter-discovery/qa-'+engine,origin='https://holyboom.github.io';
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass)};
 const browser=await(engine==='webkit'?webkit.launch():chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});p.on('pageerror',e=>errors.push(e.message));
  for(const [path,lang] of [['profile/','en'],['th/profile/','th']]){
   const response=await p.goto(new URL(path,base).href,{waitUntil:'networkidle'});check('profile-200-'+lang,response.status()===200);
   const schema=JSON.parse(await p.locator('script[type="application/ld+json"]').textContent()),text=await p.locator('main').innerText();
   check('native-readable-profile-'+lang,await p.locator('h1').count()===1&&text.includes('AI Solutions Architect')&&text.includes('ttb spark')&&text.includes('Allianz Technology')&&text.includes('FastAPI'));
   check('canonical-'+lang,await p.locator('link[rel=canonical]').getAttribute('href')===origin+'/'+path);
   check('language-'+lang,await p.locator('html').getAttribute('lang')===lang);
   const alternates=await p.locator('link[hreflang]').evaluateAll(es=>Object.fromEntries(es.map(e=>[e.hreflang,e.href])));
   check('reciprocal-languages-'+lang,alternates.en===origin+'/profile/'&&alternates.th===origin+'/th/profile/'&&alternates['x-default']===origin+'/profile/');
   check('one-true-entity-'+lang,schema['@type']==='ProfilePage'&&schema.mainEntity['@id']===origin+'/#theerawee-rangram'&&schema.mainEntity.name==='Theerawee Rangram'&&schema.mainEntity.sameAs.includes('https://www.linkedin.com/in/boom-theerawee'));
   check('role-fit-not-fabricated-employment-'+lang,text.includes(lang==='en'?'not a list of job titles I have held':'ไม่ใช่รายชื่อตำแหน่งทั้งหมดที่เคยดำรง'));
   check('example-not-production-claim-'+lang,text.includes(lang==='en'?'not a live agent service':'ไม่ใช่บริการ Agent'));
   check('no-private-identifiers-'+lang,!/(holyboom@|084217|110140201|986\/286|160,000|238,000)/.test(text));
   check('no-extra-execution-'+lang,await p.locator('script:not([type="application/ld+json"])').count()===0);
   check('indexable-meta-'+lang,(await p.locator('meta[name=robots]').getAttribute('content')).startsWith('index,follow'));
   const hrefs=await p.locator('a[href]').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
   check('public-proof-links-'+lang,hrefs.some(h=>h.includes('/blob/main/workflow-proof.js'))&&!hrefs.some(h=>h==='https://github.com/holyboom/holy-mind'));
   for(const w of [320,390,768,1440]){
    await p.setViewportSize({width:w,height:900});await p.waitForTimeout(200);
    check('layout-'+lang+'-'+w,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(w===390||w===1440)await p.screenshot({path:out+'/profile-'+lang+'-'+w+'.jpg',fullPage:true,quality:85});
   }
   await p.locator('.questions summary').first().click();check('disclosure-no-js-'+lang,await p.locator('.questions details[open]').count()===1);
  }
  await p.goto(new URL('profile/summary.txt',base).href,{waitUntil:'domcontentloaded'});const plain=await p.locator('body').innerText();check('plain-profile-complete',plain.includes('Theerawee')||plain.includes('THEERAWEE'));check('plain-profile-linkedin',plain.includes('https://www.linkedin.com/in/boom-theerawee'));
  const robots=await(await p.request.get(new URL('robots.txt',base).href)).text(),sitemap=await(await p.request.get(new URL('sitemap.xml',base).href)).text();
  check('search-access-retained',robots.includes('User-agent: OAI-SearchBot\nAllow: /')&&!robots.includes('Disallow: /'));
  check('curated-sitemap',sitemap.includes(origin+'/profile/')&&sitemap.includes(origin+'/th/profile/')&&!sitemap.includes('/qa/')&&!sitemap.includes('/docs/'));
  const root=await browser.newPage({viewport:{width:390,height:844}});root.on('pageerror',e=>errors.push(e.message));await root.goto(base,{waitUntil:'networkidle'});await root.waitForFunction(()=>window.HolyMindJourney&&HolyMindSkills.list().length===34);
  check('home-full-name-title',(await root.title()).includes('Theerawee Rangram'));
  check('visible-profile-path',await root.locator('a[href="/profile/"]').count()>=3);
  check('short-showcase-retained',await root.evaluate(()=>document.documentElement.scrollHeight<9200&&!document.querySelector('#skill-library').open&&document.body.dataset.motion==='on'));
  check('audio-default-retained',await root.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'&&HolyMindTimbres.presets.length===14&&HolyMindBoomModel.particleCount===259));
  await root.screenshot({path:out+'/homepage-mobile.jpg',quality:85});await root.close();
  const r=await browser.newPage({viewport:{width:390,height:844}});await r.goto(new URL('qa/recruiter-readme.html',base).href,{waitUntil:'networkidle'});
  const readme=await r.locator('.markdown-body').textContent();check('readme-is-person-first',readme.includes('Theerawee Rangram')&&readme.includes('Forward Deployed Engineer'));
  check('readme-no-version-history',!(/\bv\d+\b|release history|changelog|docs\/evidence/i.test(readme))&&await r.locator('.markdown-body a[href*="RELEASE-HISTORY"]').count()===0);
  for(const [width,theme] of [[390,'light'],[390,'dark'],[1440,'light'],[1440,'dark']]){
   await r.setViewportSize({width,height:1000});await r.emulateMedia({colorScheme:theme});await r.waitForFunction(({width,theme})=>[...document.querySelectorAll('.markdown-body picture img')].every(i=>i.complete&&i.naturalWidth&&i.currentSrc.endsWith((width<=600?'mobile':'desktop')+'-'+theme+'.png')),{width,theme});
   check('readme-plates-retained-'+width+'-'+theme,await r.locator('.markdown-body picture').count()===2&&await r.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===390)await r.screenshot({path:out+'/readme-'+theme+'.jpg',fullPage:true,quality:85});
  }
  await r.close();const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,indexing_or_ranking_verified:false,physicalDevice:false},null,2));console.log(JSON.stringify({checks:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
