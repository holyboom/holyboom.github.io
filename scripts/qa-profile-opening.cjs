/* The opening has its own visible-time clock; the formed person stays scroll-driven. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),g=require('../assets/profile/geometry.js'),out=process.env.OPENING_QA_DIR||'/tmp/profile-opening';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));},hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

// Compare two composited page frames with only the lower copy of the SVG
// removed. Container size alone cannot detect a clipped or unpainted <use>.
async function paintedWeave(page,selector) {
 const styles='.reading-thread,.thought-light{visibility:hidden!important}';
 const frames=[];
 for(const style of [styles,styles+'.shared-weave-lower{visibility:hidden!important}']){
  const png=await page.screenshot({style,scale:'css',animations:'disabled'});
  frames.push(png.toString('base64'));
 }
 return page.evaluate(async ({images,selector})=>{
  const pixels=await Promise.all(images.map(async encoded=>{
   const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
   const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
   return ctx.getImageData(0,0,img.width,img.height).data;
  }));
  const seam=Math.ceil(document.querySelector('.stage').getBoundingClientRect().bottom);
  const band=Math.max(1,Math.floor((innerHeight-seam)/5));
  const [a,b]=pixels;
  const painted=i=>Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>=3;
  function changed(start,end){
   let count=0;
   for(let i=start*innerWidth*4;i<end*innerWidth*4;i+=4)if(painted(i))count++;
   return count;
  }
  const metrics={seam,byStage:changed(seam,seam+band),byFoot:changed(innerHeight-band,innerHeight)};
  if(selector){
   const el=document.querySelector(selector),range=new Range();range.selectNodeContents(el.firstChild);
   metrics.height=el.getBoundingClientRect().height;
   metrics.overflow=document.documentElement.scrollWidth>innerWidth;
   metrics.rows=Array.from(range.getClientRects(),r=>{
    const y=Math.floor((r.top+r.bottom)/2);
    let first=0;while(first<innerWidth&&!painted((innerWidth*y+first)*4))first++;
    return {right:r.right,first,visible:first<innerWidth};
   });
  }
  return metrics;
 },{images:frames,selector});
}

async function checkSharedWeave(page,viewport){
 const lower=page.locator('.shared-weave-lower');
 if(viewport.width>=768){
  check('desktop-retains-its-separate-stage',!(await lower.isVisible()));
  return;
 }
 // Capture the actual camera frame, including any pointer parallax.
 await page.evaluate(()=>{
  const project=ProfileGeometry.projectLines;
  ProfileGeometry.projectLines=(...args)=>(window.__weaveProjection=project(...args));
 });
 await page.waitForFunction(()=>Boolean(window.__weaveProjection));
 async function seek(position){
  await page.evaluate(p=>scrollTo({top:ProfileExperience.scrollForPosition(p),behavior:'instant'}),position);
  await page.waitForFunction(p=>{const s=ProfileExperience.snapshot();return Math.abs(s.target-p)<.015&&s.current===s.target;},position);
 }
 async function checkPaint(name){
  const contact=await page.evaluate(()=>{
   const s=ProfileExperience.snapshot(),projection=window.__weaveProjection;
   const canvas=document.querySelector('#architecture'),rect=canvas.getBoundingClientRect(),css=getComputedStyle(canvas);
   const inset=side=>parseFloat(css['padding'+side])+parseFloat(css['border'+side+'Width']);
   const left=inset('Left'),top=inset('Top'),w=rect.width-left-inset('Right'),h=rect.height-top-inset('Bottom');
   const use=document.querySelector('.shared-weave-lower use'),errors=[];
   for(const path of document.querySelectorAll('.shared-weave path[data-source-line]')){
    if(!path.getBoundingClientRect().height||Number(path.getAttribute('opacity'))<=0)continue;
    const first=path.getPointAtLength(0),upper=first.matrixTransform(path.getScreenCTM());
    const lower=first.matrixTransform(use.getScreenCTM());
    const k=Number(path.dataset.sampleIndex),f=Number(path.dataset.sampleFraction)||0;
    const source=[];
    for(const line of projection){
     if(String(line.id)!==path.dataset.sourceLine||!line.points[k])continue;
     const a=line.points[k],b=line.points[k+1]||a;
     source.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);
    }
    const gap=Math.min(...source.map(q=>Math.hypot(rect.left+left+q[0]*w/s.width-upper.x,rect.top+top+q[1]*h/s.height-upper.y)));
    errors.push(Math.max(gap,Math.hypot(lower.x-upper.x,lower.y-upper.y)));
   }
   return {attached:errors.length,maxGap:Math.max(0,...errors)};
  });
  const ink=await paintedWeave(page);
  check(name,contact.attached>0&&contact.maxGap<1&&ink.byStage>20&&ink.byFoot>20,{...contact,...ink});
 }
 await checkPaint('opening-strands-paint-below-stage-and-near-viewport-foot');
 await seek(4);
 await checkPaint('story-floor-continues-into-the-reading-space');
 await seek(8.9);
 await page.waitForFunction(()=>ProfileExperience.snapshot().finale?.active);
 check('the-finale-replaces-the-story-weave',!(await lower.isVisible()));
 await page.setViewportSize({width:320,height:568});
 await page.waitForFunction(()=>innerWidth===320&&ProfileExperience.snapshot().width<=320);
 await seek(0);
 await checkPaint('reverse-from-finale-restores-the-weave-on-a-narrow-phone');
}


async function checkThaiCopy(browser){
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'th/profile/');
  await page.waitForFunction(()=>window.ProfileExperience?.snapshot().opening.active);
  await page.evaluate(()=>document.fonts.ready);
  async function edit(selector,words){
   await page.locator(selector).evaluate(async(el,words)=>{
    if(el.childNodes.length!==1)el.textContent=words;
    else el.firstChild.textContent=words;
    await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
   },words);
   return paintedWeave(page,selector);
  }
  const short=await edit('#hero-title','ฝัน'),wide=await edit('#hero-title','อยากชวนคุณมาดู');
  const wrapped=await edit('.hero-hook','ก่อนจะเขียนโค้ด ผมเคยฝันถึงบ้านที่มีคนอยู่');
  const restored=await edit('#hero-title','ฝัน');
  const clear=m=>!m.overflow&&m.rows.every(r=>r.visible&&r.first>=r.right);
  check('thai-title-ink-clears-the-weave-after-a-same-height-edit',
   wide.height===short.height&&wide.rows[0].right>short.rows[0].right+50&&clear(wide)&&wide.rows[0].first>short.rows[0].first+10,{short,wide});
  check('a-rewrapped-thai-hook-keeps-both-lines-clear',wrapped.rows.length>1&&clear(wrapped),wrapped);
  check('shortening-the-thai-title-returns-space-to-the-fabric',clear(restored)&&restored.rows[0].first<wide.rows[0].first-10,restored);
 }finally{await page.close();}
}

(async()=>{
 const phases=[0,.6,1.8,3.2,5.5,9.4];check('the-opening-elastic-network-keeps-changing-shape',new Set(phases.map(p=>hash(g.frame(0,1,0,p)))).size===phases.length);
 const rates=Array.from({length:401},(_,i)=>{const t=i/20;return(g.openingPhase(t+.001)-g.openingPhase(t-.001))/.002;});check('tempo-alternates-smoothly-between-fast-and-slow-without-reversing',Math.min(...rates)>.2&&Math.max(...rates)/Math.min(...rates)>6&&Math.max(...rates)<2.2,{slowest:Math.min(...rates),fastest:Math.max(...rates)});
 const finite=[],lights=[];for(const p of [0,.2,.35,.5,.7,.82,1,2,5.4,6.1])for(const phase of phases){const frame=g.frame(p,1,0,phase);if(frame.length!==777||frame.some(l=>l.points.some(q=>!q.every(Number.isFinite))))finite.push({p,phase});const signal=frame.find(l=>l.id===0).points[0];if(distance(signal,g.lightAt(p,phase))>1e-9||distance(g.lightTrail(p,1,.1,12,phase)[0].point,signal)>1e-9)lights.push({p,phase});}
 check('all-777-identities-stay-finite-through-the-formation',finite.length===0,finite);check('source-light-and-scroll-trail-follow-the-same-moving-filament',lights.length===0,lights);
 check('ambient-time-never-deforms-the-formed-person',[1,2,3.5,5.4,6.1,8,9,10].every(p=>phases.every(phase=>hash(g.frame(p,2,0,phase))===hash(g.frame(p,2)))));
 if(process.env.SKIP_BROWSER!=='1'){const {chromium}=require('playwright'),b=await chromium.launch();try{for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){const p=await b.newPage({viewport});p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await p.waitForFunction(()=>window.ProfileExperience?.snapshot().opening.active);await p.evaluate(()=>document.fonts.ready);const a=await p.evaluate(()=>ProfileExperience.snapshot());await p.waitForFunction(a=>{const s=ProfileExperience.snapshot();return s.opening.seconds>a.opening.seconds+.2&&s.draws>a.draws+2;},a,{timeout:6000});const c=await p.evaluate(()=>ProfileExperience.snapshot());check('opening-keeps-moving-without-scroll-'+viewport.width,c.opening.active&&c.opening.seconds>a.opening.seconds+.2&&c.draws>a.draws+2,{before:a.opening,after:c.opening});await p.screenshot({path:path.join(out,viewport.width+'-elastic.png')});
 await p.locator('#origins').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>{const s=ProfileExperience.snapshot();return s.current===s.target&&s.current>.99&&s.idleSeconds>0&&s.idleSeconds<1;});
 const observing=await p.evaluate(()=>ProfileExperience.snapshot());
 await p.waitForFunction(first=>ProfileExperience.snapshot().idleSeconds>first+.25,observing.idleSeconds);
 const breathing=await p.evaluate(()=>ProfileExperience.snapshot());
 check('stationary-person-acts-without-advancing-story-'+viewport.width,breathing.current===observing.current&&breathing.draws>observing.draws&&breathing.opening.seconds===observing.opening.seconds);
 await p.waitForFunction(()=>{const s=ProfileExperience.snapshot();return Math.abs(s.target-1)<.01&&s.current===s.target&&!s.dirty&&s.trailEnergy<.01&&!s.opening.active;});const stopped=await p.evaluate(()=>ProfileExperience.snapshot());await p.waitForTimeout(300);const paused=await p.evaluate(()=>ProfileExperience.snapshot());check('formed-person-stops-the-ambient-clock-and-idle-loop-'+viewport.width,stopped.opening.seconds===paused.opening.seconds&&stopped.draws===paused.draws,{stopped:stopped.opening,paused:paused.opening,draws:[stopped.draws,paused.draws]});
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForFunction(()=>ProfileExperience.snapshot().current<.01&&ProfileExperience.snapshot().opening.active);const resumed=await p.evaluate(()=>ProfileExperience.snapshot());check('returning-to-the-opening-resumes-its-own-clock-'+viewport.width,resumed.opening.seconds>paused.opening.seconds&&resumed.opening.seconds-paused.opening.seconds<.5,{paused:paused.opening,resumed:resumed.opening});
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(100);const hidden=await p.evaluate(()=>ProfileExperience.snapshot().opening.seconds);await p.waitForTimeout(250);check('hidden-page-pauses-the-opening-clock-'+viewport.width,hidden===await p.evaluate(()=>ProfileExperience.snapshot().opening.seconds));await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(70);const visible=await p.evaluate(()=>ProfileExperience.snapshot().opening.seconds);check('visibility-resume-does-not-replay-hidden-time-'+viewport.width,visible>hidden&&visible-hidden<.20,{hidden,visible});await checkSharedWeave(p,viewport);await p.close();}await checkThaiCopy(b);}finally{await b.close();}check('no-browser-errors',errors.length===0,errors);}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,checks,errors,notes:['The opening is intentionally ambient and follows visible active time.','Scroll geometry remains pure when sampled with an explicit phase; the formed person ignores that phase.']},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
