/* Camera framing contracts: deliberate close-ups retain their subject, not all feet. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module'),g=require('../assets/profile/geometry.js');
const out=process.env.DOCUMENTARY_QA_DIR||'docs/evidence/documentary-camera/validation';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const position=t=>{let a=0,b=10;for(let n=0;n<52;n++){const m=(a+b)/2;g.cameraTrack(m)<t?a=m:b=m;}return(a+b)/2;},distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const fields=c=>[c.yaw,c.pitch,c.distance,c.focal,...c.target];
// Measure the bright actor/prop pixels under real type and controls. The
// camera can crop a figure deliberately, so inspect only its visible marks.
function compositionSample(){
 const s=ProfileExperience.snapshot(),g=ProfileGeometry,canvas=document.querySelector('#architecture');
 const box=canvas.getBoundingClientRect(),css=getComputedStyle(canvas);
 const inset=side=>parseFloat(css['border'+side+'Width'])+parseFloat(css['padding'+side]);
 const left=box.left+inset('Left'),top=box.top+inset('Top');
 const width=box.width-inset('Left')-inset('Right'),height=box.height-inset('Top')-inset('Bottom');
 const picture=document.createElement('canvas');picture.width=canvas.width;picture.height=canvas.height;
 const pen=picture.getContext('2d'),ratioX=picture.width/box.width,ratioY=picture.height/box.height;
 pen.setTransform(ratioX,0,0,ratioY,0,0);
 function mark(points,paint,lineWidth,fill){
  if(points.length<2)return;
  pen.beginPath();pen.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length-1;i++)pen.quadraticCurveTo(points[i][0],points[i][1],(points[i][0]+points[i+1][0])/2,(points[i][1]+points[i+1][1])/2);
  pen.lineTo(points.at(-1)[0],points.at(-1)[1]);pen.lineWidth=Math.max(1,lineWidth||1);pen.strokeStyle=paint;pen.stroke();
  if(fill){pen.fillStyle=paint;pen.fill();}
 }
 let lines=window.__documentaryLines,layers=window.__documentaryLayers;
 if(s.finale.active){
  const f=s.finale,m=ProfileFinale.createModel(g,ProfileFinaleData).sample(f.p,f.visibleSeconds,f.heldSeconds,false);
  const project=g.projectorForCamera(m.camera,box.width,box.height);
  lines=g.projectLines(g.bodyLines(m.pose,2),project);
  layers=g.projectIllustrations([...(m.plane?[{...m.plane,role:'front-work'}]:[]),...g.bodySkin(m.pose)],project);
 }
 for(const l of lines||[])if(l.group==='human'&&l.alpha>.1)mark(l.points,l.part==='head'?'#ff0000':'#ffff00',l.width);
 for(const l of layers||[])if(l.alpha>.1&&(l.role==='hand-skin'||l.role==='front-work'))
  for(const item of l.paths)if(item.alpha*l.alpha>.1)mark(item.points,l.role==='hand-skin'?'#00ff00':'#0000ff',item.width,item.fill);
 const mask=pen.getImageData(0,0,picture.width,picture.height).data;
 const ink=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
 const header=document.querySelector('.site-header').getBoundingClientRect(),areas=[['header',header]],typeLines={};
 function textBoxes(selector,kind){
  for(const el of document.querySelectorAll(selector)){
   if(!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')continue;
   const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),range=new Range();
   for(let n=walk.nextNode();n;n=walk.nextNode()){
    if(!n.textContent.trim())continue;range.selectNodeContents(n);
    for(const r of range.getClientRects()){
     if(!r.width||!r.height||r.top>=innerHeight||r.bottom<=header.bottom||r.left>=innerWidth||r.right<=0)continue;
     if(r.top>=header.bottom&&r.bottom<=innerHeight)typeLines[kind]=(typeLines[kind]||0)+1;
     if(r.right>left&&r.left<left+width)areas.push([kind,r]);
    }
   }
  }
 }
 textBoxes('.stage-top,.stage-bottom,.scene-transition,.scene-meaning','stage-label');
 textBoxes('.scene-caption,.finale-portal-caption,.finale-phase','caption');
 textBoxes('.chapter-copy,#experience .section-heading','copy');
 const rule=document.querySelector('.transition-track');
 if(rule.getClientRects().length&&getComputedStyle(rule).visibility==='visible')areas.push(['progress',rule.getBoundingClientRect()]);
 const hits={},scenePixels={head:0,hand:0,prop:0,body:0};
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(let y=0;y<picture.height;y+=2){
  const sy=top+(y+.5)*height/picture.height;if(sy<0||sy>=innerHeight)continue;
  for(let x=0;x<picture.width;x+=2){
   const i=(y*picture.width+x)*4;if(mask[i+3]<64||ink[i+3]<48||Math.max(ink[i],ink[i+1],ink[i+2])<54)continue;
   const sx=left+(x+.5)*width/picture.width;if(sx<0||sx>=innerWidth)continue;
   const kind=mask[i+2]>128?'prop':mask[i+1]>128?(mask[i]>128?'body':'hand'):'head';
   scenePixels[kind]++;
   if(sy>=header.bottom){minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);minY=Math.min(minY,sy);maxY=Math.max(maxY,sy);}
   for(const [label,r] of areas)if(sx>=r.left&&sx<=r.right&&sy>=r.top&&sy<=r.bottom){
    const id=label+'/'+kind;hits[id]=(hits[id]||0)+1;
   }
  }
 }
 return {scene:s.shot,portal:s.finale.active,span:[Math.max(0,maxX-minX),Math.max(0,maxY-minY)].map(Math.round),canvas:[left,top,width,height].map(Math.round),scenePixels,typeLines,hits,overflow:document.documentElement.scrollWidth>innerWidth};
}

async function checkStageComposition(browser){
 for(const [w,h,lang] of [[1024,650,'th'],[1366,768,'en'],[1920,1080,'th'],[390,680,'en']]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  try{
   page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+(lang==='th'?'th/':'')+'profile/');
   await page.waitForFunction(()=>window.ProfileExperience?.snapshot().camera);await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>{
    const g=ProfileGeometry,lines=g.projectLines,layers=g.projectIllustrations;
    g.projectLines=(...args)=>(window.__documentaryLines=lines(...args));
    g.projectIllustrations=(...args)=>(window.__documentaryLayers=layers(...args));
   });
   const rows=[];
   async function scroll(y,behavior='instant'){
    await page.evaluate(({y,behavior})=>scrollTo({top:y,behavior}),{y,behavior});
    await page.waitForFunction(y=>{const s=ProfileExperience.snapshot();return Math.abs(y-scrollY)<=1&&s.current===s.target&&s.draws>0&&Boolean(window.__documentaryLayers);},y);
   }
   async function sample(label){rows.push({label,...await page.evaluate(compositionSample)});}
   const shots=w<768?[['work',27.23]]:[['drawing',1.52],['inspection',7.81],['hesitation',15.4],['work',27.23],['held-paper',28.08]];
   for(const [name,t] of shots){
    const y=await page.evaluate(p=>ProfileExperience.scrollForPosition(p),position(t));await scroll(y,name==='hesitation'?'smooth':'instant');await sample(name);
   }
   if(w<768){
    const row=rows[0],art=row.scenePixels;
    check('compact-work-shot-retains-the-stage-above-the-reading-space',!row.overflow&&row.canvas[1]>=76&&row.canvas[1]+row.canvas[3]<h*.6&&art.hand>40&&art.prop>40,row);
    continue;
   }
   const from=await page.evaluate(()=>scrollY);
   await page.mouse.wheel(0,-108);
   await page.waitForFunction(y=>scrollY<y-30&&ProfileExperience.snapshot().current===ProfileExperience.snapshot().target,from);
   await sample('reverse-wheel');
   const seam=await page.evaluate(()=>ProfileExperience.scrollForPosition(ProfileFinale.SOURCE));
   await scroll(Math.ceil(seam)-1);await sample('before-release');await scroll(Math.ceil(seam)+1);await sample('after-release');
   await page.evaluate(()=>{location.hash='ttb';});
   await page.waitForFunction(()=>{const s=ProfileExperience.snapshot();return Math.abs(s.target-4)<.01&&s.current===s.target&&!s.finale.active;});
   await sample('chapter-anchor');
   const bad=rows.filter(row=>{
    const art=row.scenePixels,small=row.span[0]<65||row.span[1]<55;
    const missingWork=['work','held-paper','before-release','after-release'].includes(row.label)&&(art.hand<20||art.prop<60);
    return row.overflow||small||missingWork||!row.typeLines.caption||Object.values(row.hits).some(n=>n>2);
   });
   check('stage-labels-and-copy-clear-painted-subjects-'+w+'-'+lang,!bad.length,bad.length?bad:rows);
  }finally{await page.close();}
 }
}

(async()=>{
 const events=g.config.camera.inserts,order=events.every((e,i)=>e.start<e.arrive&&e.arrive<e.holdEnd&&e.holdEnd<e.end&&(!i||events[i-1].end<e.start));
 check('inserts-have-approach-hold-and-release',order&&events.length>=5);check('inserts-do-not-disrupt-locked-orbits',events.every(e=>g.config.camera.orbits.every(o=>e.end<=o.start||e.start>=o.end)));
 const samples=Array.from({length:601},(_,i)=>i/60),forward=samples.map(p=>JSON.stringify(g.cameraAt(p)));
 check('all-camera-sampling-retraces',samples.every((_,i)=>JSON.stringify(g.cameraAt(samples[samples.length-1-i]))===forward[samples.length-1-i]));
 const cuts=[];for(const e of events)for(const key of ['start','arrive','holdEnd','end'])for(const compact of [false,true]){const t=e[key],a=fields(g.cameraAt(position(t-1e-5),{compact})),b=fields(g.cameraAt(position(t+1e-5),{compact}));if(Math.max(...a.map((v,i)=>Math.abs(v-b[i])))>.002)cuts.push({id:e.id,key,compact});}
 check('no-cuts-at-insert-boundaries',cuts.length===0,cuts);
 const clip=[],near=[],magnifications=[],pointer=[];
 for(const e of events)for(const compact of [false,true]){
  const p=position((e.arrive+e.holdEnd)/2),pose=g.performanceAt(p),w=compact?390:720,h=compact?286:720,project=g.createProjector(p,w,h,{compact}),focus=g.focusAt(p,{compact}),inside=q=>q[0]>4&&q[0]<w-4&&q[1]>4&&q[1]<h-4;
  const core=e.framing==='head'?g.frame(p,2).filter(l=>l.part==='head').flatMap(l=>l.points):e.framing==='work'?g.illustration(p).filter(l=>l.role==='front-work'&&l.alpha>.5).flatMap(l=>l.paths.flatMap(item=>item.points)):[focus.point,pose.handR,...(e.subject==='drawing'?[pose.tool.tip,pose.tool.shaftEnd]:[])];
  const projected=core.map(project);if(projected.some(q=>!inside(q)))clip.push({id:e.id,compact,framing:e.framing,visible:projected.filter(inside).length/projected.length});
  for(const q of [...g.frame(p,2).flatMap(l=>l.points),...g.illustration(p).flatMap(l=>l.paths.flatMap(item=>item.points))].map(project))if(!q.every(Number.isFinite)||project.camera.distance-q[2]<.25)near.push({id:e.id,compact});
  const rayScale=project.scale/(project.camera.distance-project(focus.point)[2]);g.config.camera.inserts=[];const wide=g.createProjector(p,w,h,{compact});g.config.camera.inserts=events;
  magnifications.push({id:e.id,compact,magnification:rayScale/(wide.scale/(wide.camera.distance-wide(focus.point)[2]))});
  const hover=g.createProjector(p,w,h,{compact,yaw:.05,pitch:-.05});if(distance(project(focus.point),hover(focus.point))>1e-8)pointer.push({id:e.id,compact});
 }
 check('the-focused-head-hand-or-work-remains-visible',clip.length===0,clip);check('closeups-have-no-nonfinite-or-eye-plane-crossings',near.length===0,near.slice(0,5));
 check('inserts-enlarge-the-subject-materially',magnifications.every(v=>v.magnification>1.4),magnifications);check('pointer-cannot-jostle-a-held-closeup',pointer.length===0,pointer);
 const close=position(22.10),wide=position(23.08),closePose=g.performanceAt(close),widePose=g.performanceAt(wide);
 const leads=g.illustration(close).find(layer=>layer.index===22).paths.filter(path=>path.motion==='harness');
 const entrance=g.illustration(wide).find(layer=>layer.index===23).paths;
 const bridgeShots=[];
 for(const [w,h,compact] of [[393,222,true],[696,860,false]]){
  const macro=g.createProjector(close,w,h,{compact}),establish=g.createProjector(wide,w,h,{compact});
  const inside=([x,y])=>x>3&&x<w-3&&y>3&&y<h-3;
  const closePoints=leads.flatMap(lead=>lead.points.map(macro));
  const xs=closePoints.map(point=>point[0]),wireWidth=(Math.max(...xs)-Math.min(...xs))/w;
  const fingerTips=[closePose.contacts.left.tip,closePose.contacts.right.tip].map(macro);
  const widePoints=[widePose.head,...widePose.feet,...entrance.flatMap(path=>path.points)].map(establish);
  const retreat=Array.from({length:25},(_,i)=>g.cameraAt(position(22.18+.02*i),{compact}).distance);
  bridgeShots.push({w,wireWidth,macro:macro.camera.focusId,fingersVisible:fingerTips.every(inside),
   wiresVisible:closePoints.every(inside),gatewayVisible:widePoints.every(inside),
   scaleChange:establish.camera.distance/macro.camera.distance,
   continuousRetreat:retreat.every((distance,i)=>i===0||distance>=retreat[i-1])});
 }
 check('bridge-question-frames-both-fingers-and-five-distinct-cables',new Set(leads.map(lead=>lead.color)).size===5&&
  bridgeShots.every(s=>s.macro==='inside-the-cables'&&s.fingersVisible&&s.wiresVisible&&s.wireWidth>.56),bridgeShots);
 check('pullback-reveals-the-whole-maker-and-grounded-sunrise',bridgeShots.every(s=>s.continuousRetreat&&s.scaleChange>2.65&&s.gatewayVisible),bridgeShots);
 const disclosure=[];for(const e of events){const p=position((e.arrive+e.holdEnd)/2);if(p<6.7||p>8)continue;const closed=g.cameraAt(p),open=g.cameraAt(p,{expanded:1});if(open.focusWeight!==0||open.distance<=closed.distance)disclosure.push(e.id);}
 check('opening-system-layers-reestablishes-the-wide-context',disclosure.length===0&&events.some(e=>position(e.arrive)>6.7&&position(e.arrive)<8),disclosure);
 const rear=g.config.camera.orbits.find(o=>o.id==='conviction-rear');check('rear-shot-reaches-behind-the-maker-on-both-viewports',Math.cos(rear.yaw)<-.90&&Math.cos(rear.compactYaw)<-.85);
 if(process.env.DOCUMENTARY_BASELINE){const m={exports:{}};vm.runInNewContext(fs.readFileSync(process.env.DOCUMENTARY_BASELINE,'utf8'),{module:m,exports:m.exports,require:createRequire(path.resolve('assets/profile/geometry.js'))});const old=m.exports,positions=Array.from({length:81},(_,i)=>i/8);check('actor-world-dust-and-light-are-unchanged',positions.every(p=>JSON.stringify(g.frame(p,2))===JSON.stringify(old.frame(p,2))&&JSON.stringify(g.illustration(p,1))===JSON.stringify(old.illustration(p,1))&&JSON.stringify(g.lightTrail(p))===JSON.stringify(old.lightTrail(p))));}
 if(process.env.SKIP_BROWSER!=='1'){
  const {chromium}=require('playwright'),b=await chromium.launch();try{for(const width of [1440,390]){const page=await b.newPage({viewport:{width,height:1000}});page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await page.waitForFunction(()=>window.ProfileGeometry?.focusAt&&window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
   for(const e of events){const p=position((e.arrive+e.holdEnd)/2);await page.evaluate(p=>{scrollTo({top:ProfileExperience.scrollForPosition(p),behavior:'instant'});},p);await page.waitForFunction(p=>Math.abs(ProfileExperience.snapshot().current-p)<.001&&ProfileExperience.snapshot().current===ProfileExperience.snapshot().target,p);await page.waitForTimeout(300);const state=await page.evaluate(()=>{const s=ProfileExperience.snapshot(),r=document.querySelector('#architecture').getBoundingClientRect();return {camera:s.camera,visible:r.bottom>0&&r.top<innerHeight};});check('live-closeup-'+width+'-'+e.id,state.visible&&state.camera.focusId===e.id&&state.camera.focusWeight>.99);await page.screenshot({path:path.join(out,width+'-'+e.id+'.png')});}
   await page.emulateMedia({reducedMotion:'reduce'});const count=await page.evaluate(()=>ProfileExperience.snapshot().draws);await page.evaluate(()=>document.querySelector('#conviction').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(250);check('owner-full-motion-keeps-camera-active-'+width,await page.locator('.stage').isVisible()&&await page.evaluate(n=>ProfileExperience.snapshot().mode==='full'&&ProfileExperience.snapshot().draws>n,count)&&await page.locator('#motion').count()===0);await page.close();
  }await checkStageComposition(b);}finally{await b.close();}check('no-browser-errors',errors.length===0,errors);
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,checks,errors},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out},null,2));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
