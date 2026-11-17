/* Compare all reviewed IDs to the rendered bilingual publication and live scene model. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.join(__dirname,'..'),rows=require('./data/profile-gemini-copy.json').items,locations=require('./data/profile-copy-locations.json'),base=process.env.TEST_URL||'http://127.0.0.1:4174/',out=process.env.COPY_QA_DIR||'/tmp/profile-copy';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await(process.env.ENGINE==='webkit'?webkit:chromium).launch(),checks=[];try{for(const lang of ['en','th']){
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+(lang==='th'?'th/':'')+'profile/');await page.waitForFunction(()=>window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
 const failures=await page.evaluate(async({rows,locations,lang})=>{
 const N=s=>String(s??'').replace(/\s+/g,' ').trim(),atomic=new Set(['P','H1','H2','H3','H4','BLOCKQUOTE','A','SUMMARY','LI','FIGCAPTION','TIME','BUTTON','B','SMALL']),key=e=>{if(e.id)return '#'+e.id;const tag=e.localName,cls=[...e.classList].sort().join('.');if(!e.parentElement)return '/'+tag;const siblings=[...e.parentElement.children].filter(s=>s.localName===tag&&[...s.classList].sort().join('.')===cls&&!s.id);return key(e.parentElement)+'/'+tag+(cls?'.'+cls:'')+'['+(siblings.indexOf(e)+1)+']';};
 const nodes=new Map([...document.querySelectorAll('*')].map(e=>[key(e),e])),owned=new Map(),tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);for(let t;t=tw.nextNode();){if(t.parentElement.closest('script,style')||!/[A-Za-z\u0e00-\u0e7f]/.test(t.textContent))continue;let e=t.parentElement;while(e&&!atomic.has(e.tagName))e=e.parentElement;if(!e)e=t.parentElement;const k=key(e);owned.set(k,[...(owned.get(k)||[]),N(t.textContent)]);}
 const schema=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent),failures=[],field=lang==='th'?'thai':'english',svgCache={},summary=(await(await fetch((lang==='th'?'/th':'')+'/profile/summary.txt')).text()).trim().split(/\n\s*\n/),model=ProfileGeometry.sequence;
 for(const row of rows){let actual;const kind=row.kind,expected=row[field];
 if(kind.startsWith('Native page /')){
 // Runtime stage and finale copy is validated against its actual model below; initial markup remains independently checked without JS.
 const loc=locations[row.id];if(loc.includes('.scene-caption')||loc.includes('.transition-copy')||loc.includes('.scene-meaning')||loc.includes('.scene-label')||loc.includes('.finale-skill-'))continue;
 actual=(owned.get(loc)||[]).join(' ');
 }else if(kind.startsWith('Accessibility /')){const [loc,attr]=locations[row.id].split('/@');actual=nodes.get(loc)?.getAttribute(attr);}
 else if(kind.startsWith('Story / ')){
 const chapter=document.getElementById(row.section),copy=chapter.querySelector('.chapter-copy'),k=kind.split(' / ')[1],map={eyebrow:'.eyebrow',period:'.story-era>span',yearLabel:'time',title:'h2',lede:'.lede',quote:'blockquote',bridge:'.bridge-copy',hook:'.bridge-copy strong'};
 if(k==='paragraphs')actual=[...copy.children].filter(e=>e.tagName==='P'&&!e.className).map(e=>e.textContent).join('\n\n');
 else if(k==='tags')actual=[...copy.querySelectorAll('.tags>span')].map(e=>e.textContent).join('\n\n');
 else if(k==='steps')actual=[...copy.querySelectorAll('.craft-steps>li')].map(e=>e.textContent).join('\n\n');
 else if(k==='sceneDescription')actual=chapter.querySelector('.scene-fallback img').alt;
 else if(k==='bridge')actual=[...copy.querySelector('.bridge-copy').childNodes].filter(e=>e.nodeType===3).map(e=>e.textContent).join('');
 else actual=k==='title'?[...copy.querySelector('h2').childNodes].map(n=>n.nodeName==='BR'?' ':n.textContent).join(''):copy.querySelector(map[k])?.textContent;
 }else if(kind==='Closing quotation')actual=document.querySelector('.closing-line').textContent;
 else if(row.section.startsWith('work / ')){
 const e=document.getElementById('work-'+row.section.split(' / ')[1]),part=row.sourceEn.split(' :: ')[1].split('.').slice(2).join('.');
 if(part==='title')actual=e.querySelector('summary b').textContent;else if(part==='hook')actual=e.querySelector('summary small').textContent;else{const m=/steps\[(\d+)\]\[(\d+)\]/.exec(part);if(m)actual=e.querySelectorAll('.proof-route>li')[+m[1]].querySelector(+m[2]?'p':'h3').textContent;else actual=e.querySelectorAll('.path-links a')[+/links\[(\d+)\]/.exec(part)[1]].textContent;}
 }else if(kind.startsWith('Animation / ')){const i=+/scene (\d+)/.exec(row.section)[1]-1;actual=model[i][kind.split(' / ')[1]];}
 else if(kind==='In-scene label')actual=ProfileScenes.text[row.originalEnglish];
 else if(kind==='Head / orbit caption')actual=ProfileScenes.reviewFinale[lang][row.section.split(' / ')[1]];
 else if(kind==='Two-skill caption')actual=ProfileScenes.reviewFinale[lang].synthesis;
 else if(kind==='Skill identity'||kind==='Skill purpose'){const id=row.sourceEn.split(' :: ')[1].split('.')[0],skill=ProfileFinaleData.find(s=>s.id===id);actual=kind==='Skill identity'?skill.name:skill[lang==='th'?'concept_th':'purpose'];}
 else if(row.section==='Metadata'){const selectors={'Page title':'title','Search description':'meta[name="description"]','Open Graph title':'meta[property="og:title"]','Open Graph description':'meta[property="og:description"]'},e=document.querySelector(selectors[kind]);actual=kind==='Page title'?e.textContent:e.content;}
 else if(row.section==='Metadata / JSON-LD'){actual=schema;const route=row.sourceEn.split('JSON-LD $')[1];for(const m of route.matchAll(/([^.[\]]+)|\[(\d+)\]/g))actual=actual[m[2]===undefined?m[1]:+m[2]];}
 else if(kind==='Shared SVG text'){const name=row.section.split(' / ')[1];if(!svgCache[name]){const text=await(await fetch('/assets/profile/fallback/'+(lang==='th'?'th/':'')+name+'.svg')).text();svgCache[name]=[...new DOMParser().parseFromString(text,'image/svg+xml').querySelectorAll('title,desc,text')].map(e=>e.textContent);}actual=svgCache[name][+/text\[(\d+)\]/.exec(row.sourceEn)[1]];}
 else if(kind==='Plain-text block')actual=summary[+/block (\d+)/.exec(row.sourceEn)[1]-1];
 else failures.push({id:row.id,unknown:kind});
 if(N(actual)!==N(expected))failures.push({id:row.id,kind,actual,expected});
 }return failures;
 },{rows,locations,lang});assert.deepEqual(failures,[],lang+' approved copy mismatch');assert.deepEqual(errors,[]);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:width>700?1000:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),lang+' overflow '+width);if(width!==320)await page.screenshot({path:path.join(out,lang+'-'+width+'.png')});}
 await page.close();
 const native=await browser.newPage({javaScriptEnabled:false});await native.goto(base+(lang==='th'?'th/':'')+'profile/');const nativeFailures=await native.evaluate(({rows,locations,field})=>{const N=s=>String(s??'').replace(/\s+/g,' ').trim(),atomic=new Set(['P','H1','H2','H3','H4','BLOCKQUOTE','A','SUMMARY','LI','FIGCAPTION','TIME','BUTTON','B','SMALL']);const key=e=>{if(e.id)return '#'+e.id;const tag=e.localName,cls=[...e.classList].sort().join('.');if(!e.parentElement)return '/'+tag;const siblings=[...e.parentElement.children].filter(s=>s.localName===tag&&[...s.classList].sort().join('.')===cls&&!s.id);return key(e.parentElement)+'/'+tag+(cls?'.'+cls:'')+'['+(siblings.indexOf(e)+1)+']';};const owned=new Map(),tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);for(let t;t=tw.nextNode();){if(t.parentElement.closest('script,style')||!/[A-Za-z\u0e00-\u0e7f]/.test(t.textContent))continue;let e=t.parentElement;while(e&&!atomic.has(e.tagName))e=e.parentElement;if(!e)e=t.parentElement;const k=key(e);owned.set(k,[...(owned.get(k)||[]),N(t.textContent)]);}return rows.filter(r=>r.kind.startsWith('Native page /')).flatMap(r=>N((owned.get(locations[r.id])||[]).join(' '))===N(r[field])?[]:[{id:r.id,actual:owned.get(locations[r.id]),expected:r[field]}]);},{rows,locations,field:lang==='th'?'thai':'english'});assert.deepEqual(nativeFailures,[],lang+' native fallback copy');await native.close();checks.push({lang,reviewedIds:rows.length});
 }}finally{await browser.close();}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks},null,2));console.log(JSON.stringify({checks,out}));})().catch(e=>{console.error(e);process.exitCode=1;});
