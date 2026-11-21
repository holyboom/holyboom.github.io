/* The opening has its own visible-time clock; the formed person stays scroll-driven. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),g=require('../assets/profile/geometry.js'),out=process.env.OPENING_QA_DIR||'/tmp/profile-opening';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));},hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

// Hold the actual SVG frame while the browser paints it on the page and in
// isolation. Text antialiasing can change when a layer disappears on Linux.
async function paintedWeave(page,selector,returning=false) {
 const mesh=await page.locator('#profile-shared-fabric').elementHandle();
 const still=await mesh.evaluateHandle(el=>{const copy=el.cloneNode(true);el.replaceWith(copy);return copy;});
 const frames=[];
 try{
  const base='.reading-thread,.thought-light{visibility:hidden!important}';
  const isolate='html,body{background:#000!important}body{visibility:hidden!important}.shared-weave,.shared-weave-lower{visibility:visible!important}';
  for(const style of [base,base+'#profile-shared-fabric path{stroke:none!important}',isolate]){
   const png=await page.screenshot({style,scale:'css',animations:'disabled'});
   frames.push(png.toString('base64'));
  }
 }finally{
  await still.evaluate((copy,el)=>copy.replaceWith(el),mesh);
  await still.dispose();await mesh.dispose();
 }
 return page.evaluate(async ({images,selector,returning})=>{
  const pixels=await Promise.all(images.map(async encoded=>{
   const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
   const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
   return ctx.getImageData(0,0,img.width,img.height).data;
  }));
  const seam=Math.ceil(document.querySelector('.stage').getBoundingClientRect().bottom);
  const band=Math.max(1,Math.floor((innerHeight-seam)/5));
  const [a,b,layer]=pixels;
  const ink=i=>Math.max(layer[i],layer[i+1],layer[i+2])>=3;
  const painted=i=>ink(i)&&Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>=3;
  function changed(start,end){
   let count=0;
   for(let i=start*innerWidth*4;i<end*innerWidth*4;i+=4)if(painted(i))count++;
   return count;
  }
  const metrics={seam,byStage:changed(seam,seam+band),byFoot:changed(innerHeight-band,innerHeight)};
  if(returning){
   // The scroll gesture moves the visible ink itself up the page. Measure a
   // percentile so a faint antialiased pixel cannot become the lower extent.
   const rows=Array.from({length:innerHeight},(_,y)=>changed(y,y+1));
   metrics.count=rows.reduce((sum,n)=>sum+n,0);
   function edge(section){
    const cutoff=section.reduce((sum,n)=>sum+n,0)*.95;
    let sum=0;return section.findIndex(n=>(sum+=n)>=cutoff);
   }
   metrics.lowerEdge=edge(rows);
   // Across the camera handoff, compare the fabric below the stage. The
   // actor and paper can occlude different amounts of the upper threads.
   metrics.marginFoot=rows.findLastIndex((n,y)=>y>=seam&&n>=3);
  }
  if(selector){
   const el=document.querySelector(selector),range=new Range();range.selectNodeContents(el.firstChild);
   metrics.height=el.getBoundingClientRect().height;
   metrics.overflow=document.documentElement.scrollWidth>innerWidth;
   metrics.rows=Array.from(range.getClientRects(),r=>{
    const y=Math.floor((r.top+r.bottom)/2);
    let first=0;while(first<innerWidth&&!ink((innerWidth*y+first)*4))first++;
    let overlap=0;
    for(let row=Math.ceil(r.top);row<Math.floor(r.bottom);row++)
     for(let x=Math.ceil(r.left);x<Math.floor(r.right);x++)if(ink((innerWidth*row+x)*4))overlap++;
    return {right:r.right,first,overlap,visible:first<innerWidth};
   });
  }
  return metrics;
 },{images:frames,selector,returning});
}

// The ownership boundary is a document coordinate. Test the two adjacent
// native pixels as well as the held and flying stages of the actual throw.
async function checkPaperReturn(page){
 async function go(phase,view=page){
  await view.evaluate(p=>{
   const a=ProfileExperience.snapshot().anchors,c=ProfileGeometry.config.morph;
   const start=a[8]+(a[9]-a[8])*(c.start+(c.end-c.start)*(ProfileFinale.SOURCE-8));
   const y=p<=0?Math.ceil(start)-(p<0?1:0):Math.round(start+(a[9]-start)*p);
   scrollTo({top:y,behavior:'instant'});
  },phase);
  await view.waitForFunction(p=>{
   const s=ProfileExperience.snapshot(),f=s.finale;
   return s.current===s.target&&(p<0?!f.active:f.active&&Math.abs(f.p-p)<.01);
  },phase);
 }
 async function inkAt(phase,view=page){
  await go(phase,view);
  return paintedWeave(view,null,true);
 }
 async function attachment(view=page){
  return view.evaluate(()=>{
   const state=ProfileExperience.snapshot(),f=state.finale,g=ProfileGeometry;
   const model=ProfileFinale.createModel(g,ProfileFinaleData).sample(f.p,f.visibleSeconds,f.heldSeconds,true);
   const canvas=document.querySelector('#architecture').getBoundingClientRect();
   const project=g.projectorForCamera(model.camera,canvas.width,canvas.height);
   // Once airborne, the portal paints with all of its padding released.
   const screen=(id,index)=>{
    const line=model.plane.paths.find(l=>l.id==='work-28-plane-'+id);
    const q=project(line.points[index]);return [q[0]+canvas.left,q[1]+canvas.top];
   };
   const tail=screen('spine',0),keel=screen('keel',3),dx=keel[0]-tail[0],dy=keel[1]-tail[1];
   const roots=[];
   for(const path of document.querySelectorAll('.shared-weave path[data-thread="floor"]')){
    if(!path.getBoundingClientRect().height||Number(path.getAttribute('opacity'))<=0)continue;
    const q=path.getPointAtLength(0).matrixTransform(path.getScreenCTM()),x=q.x-tail[0],y=q.y-tail[1];
    const t=Math.min(1,Math.max(0,(x*dx+y*dy)/(dx*dx+dy*dy||1)));
    roots.push(Math.hypot(x-t*dx,y-t*dy));
   }
   return {tail,roots:roots.length,gap:Math.max(0,...roots),readingTip:state.readingThread?.launch?.returnTip||null};
  });
 }
 const before=await inkAt(-1),entry=await inkAt(0),lift=await inkAt(.15);
 const first=await attachment();
 const pause=await page.evaluate(async()=>{
  const path=()=>Array.from(document.querySelectorAll('.shared-weave path[data-thread="floor"]'),el=>el.getAttribute('d')).join('');
  const start=path(),p=ProfileExperience.snapshot().finale.p;
  await new Promise(resolve=>setTimeout(resolve,140));
  const idle=path();const descriptor=Object.getOwnPropertyDescriptor(document,'hidden');
  try{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
   await new Promise(resolve=>setTimeout(resolve,140));
   return start.length>0&&start===idle&&idle===path()&&ProfileExperience.snapshot().finale.p===p;
  }finally{
   if(descriptor)Object.defineProperty(document,'hidden',descriptor);else delete document.hidden;
   document.dispatchEvent(new Event('visibilitychange'));
  }
 });
 check('a-paused-or-hidden-page-holds-the-same-pull',pause&&first.roots>0);
 const flight=await inkAt(.23),next=await attachment();
 const spent=await inkAt(.40),back=await inkAt(.15),again=await attachment();
 check('shared-fabric-remains-on-screen-as-the-portal-takes-over',before.byStage>20&&entry.byStage>20&&before.byFoot>20&&entry.byFoot>20&&Math.abs(entry.marginFoot-before.marginFoot)<6,{before,entry});
 check('scroll-lifts-the-lower-fabric-and-finishes-the-pull',entry.lowerEdge>lift.lowerEdge+20&&lift.lowerEdge>flight.lowerEdge+8&&flight.count>20&&spent.count===0,{entry,lift,flight,spent});
 check('threads-follow-the-real-moving-paper-fold',[first,next].every(s=>s.roots>0&&s.gap<2)&&distance(first.tail,next.tail)>2,{first,next});
 check('reversing-retraces-the-fabric-and-paper',Math.abs(back.lowerEdge-lift.lowerEdge)<3&&distance(first.tail,again.tail)<1&&back.count>20&&again.roots>0&&again.gap<2,{lift,back,first,again});
 const direct=await page.context().browser().newPage({viewport:page.viewportSize()});
 try{
  await direct.goto(new URL('#experience',page.url()).href);
  await direct.evaluate(()=>document.fonts.ready);
  await direct.waitForFunction(()=>window.ProfileExperience?.snapshot().finale.p===1&&document.querySelector('#experience #architecture'));
  const active=await direct.locator('.shared-weave-lower').isVisible()||await direct.evaluate(()=>ProfileExperience.snapshot().readingThread.visible);
  const cold=await inkAt(.15,direct),coldFold=await attachment(direct);
  const sameReading=first.readingTip&&coldFold.readingTip?distance(first.readingTip,coldFold.readingTip)<1:first.readingTip===coldFold.readingTip;
  check('a-direct-summary-skips-the-pull-and-restores-it-on-reverse',!active&&sameReading&&cold.count>20&&Math.abs(cold.lowerEdge-lift.lowerEdge)<3&&coldFold.roots>0&&coldFold.gap<2,{active,cold,coldFold});
  await direct.setViewportSize({width:320,height:568});
  await direct.goto(new URL('/th/profile/',page.url()).href);
  await direct.waitForFunction(()=>window.ProfileExperience?.snapshot().opening.active);
  await direct.evaluate(()=>document.fonts.ready);
  // The Thai caption wraps here. The middle of a curve can shift around its
  // text even when both endpoints and the paper attachment still agree.
  const capture=()=>direct.evaluate(()=>({y:scrollY,p:ProfileExperience.snapshot().finale.p,
   curves:Array.from(document.querySelectorAll('.shared-weave path[data-thread="floor"]'),path=>path.getAttribute('d'))}));
  await go(-1,direct);await go(.011,direct);const outbound=await capture();
  await go(1,direct);await go(.24,direct);await go(.011,direct);const rewound=await capture();
  const forwardHash=hash(outbound.curves),reverseHash=hash(rewound.curves);
  check('thai-narrow-caption-preserves-every-fold-curve-on-rewind',outbound.y===rewound.y&&outbound.p===rewound.p&&outbound.curves.some(Boolean)&&forwardHash===reverseHash,
   {y:[outbound.y,rewound.y],progress:[outbound.p,rewound.p],curves:outbound.curves.length,forwardHash,reverseHash});
 }finally{await direct.close();}

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
 await checkPaperReturn(page);
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
  const clear=m=>!m.overflow&&m.rows.every(r=>r.visible&&r.first>=r.right&&r.overlap===0);
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
