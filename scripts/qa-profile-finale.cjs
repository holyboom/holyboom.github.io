/* Real catalogue, bounded reverse transitions, fixed-length acting and one native canvas. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module'),{chromium}=require('playwright');
const g=require('../assets/profile/geometry.js'),f=require('../assets/profile/finale.js'),skills=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/skills.json'))).skills;
const out=process.env.FINALE_QA_DIR||'/tmp/profile-finale';fs.mkdirSync(out,{recursive:true});const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const data=Array.isArray(skills)?skills:JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/skills.json'))),model=f.createModel(g,data),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i])),maxDelta=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
check('all-34-identities-and-source-assets-are-real',model.skills.length===34&&new Set(model.skills.map(s=>s.id)).size===34&&model.skills.every(s=>fs.existsSync(path.join(__dirname,'../assets/skills',s.id+'.webp'))));
const categories=model.skills.reduce((a,s)=>(a[s.category]=(a[s.category]||0)+1,a),{});check('three-authored-crowns-use-catalogue-categories',categories.reason===13&&categories.build===12&&categories.verify===9,categories);
const poses=[];for(let i=0;i<=200;i++){const frame=model.sample(i/200,725,725);poses.push(frame);for(const node of frame.nodes)if(!node.point.every(Number.isFinite))throw Error('non-finite skill');}
check('fragments-converge-before-skills-emerge',poses[50].memory.length>100&&poses[120].charge>.95&&poses[120].nodes.every(s=>s.alpha===0)&&poses[172].nodes.every(s=>s.alpha>.5)&&poses[200].memory.length===0);
const echoScores=[];
for(const [w,h,compact] of [[393,222,true],[696,860,false]]){
 for(const [id,held,arrive] of [['blueprint',.216,.383],['notebook',.349,.515],['cogwheels',.482,.646]]){
  const sample=model.sample(held,0,0,compact),project=g.projectorForCamera(sample.camera,w,h);
  const materials=sample.overture.echoes.filter(e=>e.alpha*e.fillAlpha>.70),work=materials.find(e=>e.id===id);
  const points=(work?.paths||[]).flatMap(path=>path.points.map(project)),xs=points.map(q=>q[0]),ys=points.map(q=>q[1]);
  const shapeWidth=Math.max(...xs)-Math.min(...xs),visible=points.length>0&&points.every(([x,y])=>x>3&&x<w-3&&y>3&&y<h-3);
  const peel=model.sample(arrive-.035,0,0,compact).overture.echoes.find(e=>e.id===id);
  const threads=peel?.paths.filter(path=>path.role==='memory-thread')||[];
  const almost=model.sample(arrive-.0001,0,0,compact),last=almost.overture.echoes.find(e=>e.id===id);
  const error=Math.max(...(last?.paths||[]).flatMap(path=>path.points.map(q=>distance(q,almost.head))));
  echoScores.push({id,w,visible,oneMaterial:materials.length===1,shapeWidth,threads:threads.length,
   longestThread:Math.max(...threads.map(t=>distance(t.points[0],t.points.at(-1)))),error});
 }
}
check('recognisable-work-wakes-in-isolation-and-fits-both-frames',echoScores.every(v=>v.visible&&v.oneMaterial&&v.shapeWidth>64),echoScores);
check('each-material-peels-into-curved-threads-and-arrives-at-the-head',echoScores.every(v=>v.threads===3&&v.longestThread>.16&&v.error<.001),echoScores);
const recognition=[];
for(const compact of [false,true]){
  const gaze=p=>model.sample(p,0,0,compact).pose.frames.head.z;
  const plan=gaze(.308),book=gaze(.396),gear=gaze(.502),settled=gaze(.646);
  const original=g.motion.poseAt(29).frames.head.z;
  const still=model.sample(.46,0,0,compact).pose===model.sample(.46,10,10,compact).pose;
  recognition.push({compact,plan,book,gear,settled,still,restError:distance(settled,original)});
}
check('head-finds-the-plan-then-the-book-and-lifts-to-gears-before-returning',
  recognition.every(r=>r.plan[0]<-.17&&r.book[0]>.22&&r.gear[0]>.26&&
    r.gear[1]-r.book[1]>.095&&r.restError<1e-10&&r.still),recognition);
check('memory-afterimages-end-before-the-settled-orbit',poses[130].overture.pulses.some(p=>p.kind==='arrival')&&
 poses[156].overture.pulses.some(p=>p.kind==='reveal')&&poses[181].overture.pulses.length===0&&
 poses[200].overture.echoes.length===0);
check('formation-retraces-at-held-phase',poses.every((a,i)=>JSON.stringify(a)===JSON.stringify(model.sample(i/200,725,725))));
const clocks=f.clock();for(let i=0;i<100;i++)clocks.step(1,.04,true);const frozen=clocks.step(.98,.04,true);for(let i=0;i<100;i++)clocks.step(.97,.04,true);check('reverse-captures-phase-and-does-not-spend-visible-time',Math.abs(frozen.held-4)<1e-8&&clocks.snapshot().time===frozen.time&&clocks.snapshot().held===frozen.held);
const still=clocks.step(1,20,false);check('hidden-or-offscreen-orbit-does-not-advance',still.time===frozen.time);const resumed=clocks.step(1,.016,true);check('resume-continues-from-the-frozen-phase',Math.abs(resumed.time-frozen.time-.016)<1e-8);
let largest=0,boundary=0;for(const held of [0,3,29,180,725,3600,100000]){const a=model.sample(1,held,held),b=model.sample(1-1e-7,held,held),c=model.sample(.94,held,held),d=model.sample(.94-1e-7,held,held);for(let i=0;i<34;i++)boundary=Math.max(boundary,distance(a.nodes[i].point,b.nodes[i].point),distance(c.nodes[i].point,d.nodes[i].point));let previous=c.nodes;for(let j=1;j<=40;j++){const next=model.sample(.94+j*.06/40,held,held).nodes;for(let i=0;i<34;i++)largest=Math.max(largest,distance(previous[i].point,next[i].point));previous=next;}}
check('hours-of-orbit-do-not-unwind-through-scroll',largest<.27&&boundary<1e-5,{largestStep:largest,boundary});
let reachError=0,pointed=0,rest=0,targets=new Set();for(let t=0;t<90;t+=.2){const frame=model.sample(1,t,t),p=frame.pose;for(const side of ['L','R']){reachError=Math.max(reachError,Math.abs(distance(p['shoulder'+side],p['elbow'+side])-p.lengths.upperArm),Math.abs(distance(p['elbow'+side],p['hand'+side])-p.lengths.forearm));}if(frame.attention.weight>.9){pointed++;targets.add(frame.attention.targetId);}if(frame.attention.stage==='rest')rest++;}
check('pointing-has-anticipation-follow-through-and-rest-with-fixed-bones',reachError<1e-8&&pointed>50&&rest>30&&targets.size>5,{reachError,pointed,rest,targets:targets.size});
let discontinuity=0;for(const category of ['reason','build','verify'])for(let i=0;i<300;i++){const t=i*.12;discontinuity=Math.max(discontinuity,Math.abs(f.phase(category,t+.001)-f.phase(category,t)));}check('fast-and-slow-orbits-have-continuous-speed',discontinuity<.001);
const baselineFile=path.resolve('/workspace/releases/profile-v22-validation/baseline-geometry.js');if(fs.existsSync(baselineFile)){const m={exports:{}};vm.runInNewContext(fs.readFileSync(baselineFile,'utf8'),{module:m,exports:m.exports,require:createRequire(path.resolve(__dirname,'../assets/profile/geometry.js'))});const old=m.exports,field=c=>[c.yaw,c.pitch,c.distance,c.focal,...c.target];check('all-31-original-actor-and-world-scenes-preserved',Array.from({length:121},(_,i)=>i/12).every(p=>JSON.stringify(g.frame(p,2))===JSON.stringify(old.frame(p,2))&&JSON.stringify(g.illustration(p))===JSON.stringify(old.illustration(p))));check('approved-offering-camera-remains-identical',Array.from({length:101},(_,i)=>8+i*.0024).every(p=>maxDelta(field(g.cameraAt(p)),field(old.cameraAt(p)))<1e-10));}
const toPosition=track=>{let a=0,b=10;for(let i=0;i<45;i++){const m=(a+b)/2;g.cameraTrack(m)<track?a=m:b=m;}return(a+b)/2;};
for(const rail of g.filamentRails){const p=toPosition((rail.start+rail.end)/2),a=g.filamentAt(p),cam=g.cameraAt(p);check('camera-follows-existing-thread-'+rail.id,a&&cam.filamentId===rail.id&&cam.filamentWeight>.2&&a.point.every(Number.isFinite));}
(async()=>{if(process.env.SKIP_BROWSER!=='1'){const browser=await chromium.launch();try{for(const width of [1440,390])for(const lang of ['en','th']){const page=await browser.newPage({viewport:{width,height:width>700?1000:844}});page.on('pageerror',e=>errors.push(e.stack));await page.addInitScript(()=>{const raf=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),pending=new Set();let peak=0;window.requestAnimationFrame=cb=>{const id=raf(t=>{pending.delete(id);cb(t);});pending.add(id);peak=Math.max(peak,pending.size);return id;};window.cancelAnimationFrame=id=>{pending.delete(id);cancel(id)};window.__finaleRaf=()=>({pending:pending.size,peak});});
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+(lang==='th'?'th/':'')+'profile/');await page.waitForFunction(()=>window.ProfileExperience);await page.evaluate(()=>document.fonts.ready);
 const suffix=lang+'-'+width;async function go(p){await page.evaluate(p=>{const a=ProfileExperience.snapshot().anchors,c=ProfileGeometry.config.morph,start=a[8]+(a[9]-a[8])*(c.start+(c.end-c.start)*(ProfileFinale.SOURCE-8));scrollTo({top:start+(a[9]-start)*p,behavior:'instant'});},p);await page.waitForTimeout(190);return page.evaluate(()=>ProfileExperience.snapshot().finale);}
 // Compare the rendered head in viewport coordinates across the canvas handoff.
 async function headAtBoundary(offset){await page.evaluate(offset=>{const a=ProfileExperience.snapshot().anchors,c=ProfileGeometry.config.morph,start=a[8]+(a[9]-a[8])*(c.start+(c.end-c.start)*(ProfileFinale.SOURCE-8));scrollTo({top:offset<0?Math.floor(start)-1:Math.ceil(start)+1,behavior:'instant'});},offset);await page.waitForFunction(()=>{const s=ProfileExperience.snapshot();return s.current>8.70&&s.current===s.target&&!s.dirty;},null,{polling:50});return page.evaluate(()=>{const s=ProfileExperience.snapshot(),g=ProfileGeometry,c=document.querySelector('#architecture'),r=c.getBoundingClientRect(),style=getComputedStyle(c),ending=s.finale.active,pose=ending?ProfileFinale.createModel(g,ProfileFinaleData).sample(s.finale.p,s.finale.visibleSeconds,s.finale.heldSeconds,innerWidth<768).pose:g.performanceAt(s.current),q=g.projectorForCamera(s.camera,r.width,r.height)(pose.head),t=ending?Math.max(0,Math.min(1,s.finale.p/.12)):0,release=t*t*t*(t*(t*6-15)+10),sy=ending?(innerWidth<768?1-58/r.height*(1-release):1):(r.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom))/r.height,top=ending?(innerWidth<768?20*(1-release):0):parseFloat(style.paddingTop);return[r.left+q[0],r.top+q[1]*sy+top];});}
 const headBefore=await headAtBoundary(-1),headAfter=await headAtBoundary(1);check('original-head-crosses-the-portal-without-a-jump-'+suffix,distance(headBefore,headAfter)<4,{pixels:distance(headBefore,headAfter)});
 const liveMemories=[];for(const [p,id] of [[.216,'blueprint'],[.349,'notebook'],[.482,'cogwheels']]){const state=await go(p);liveMemories.push(state.memoryWorks?.includes(id));}
 check('native-scroll-activates-the-three-work-memories-'+suffix,liveMemories.every(Boolean));
 const gather=await go(.38),within=await go(.61),reveal=await go(.83),orbit=await go(1);await page.waitForFunction(()=>ProfileExperience.snapshot().finale.textures===34);await page.waitForTimeout(600);
 check('native-scroll-owns-collapse-charge-and-burst-'+suffix,gather.phase==='gather'&&gather.fragmentCount>100&&within.phase==='within'&&within.arrivedMass>.95&&reveal.phase==='reveal'&&orbit.phase==='orbit');
 check('single-original-canvas-is-docked-in-experience-'+suffix,await page.locator('#architecture').count()===1&&await page.locator('#experience #architecture').count()===1&&await page.locator('#architecture').isVisible()&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(out,'orbit-'+suffix+'.png')});const before=await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds);await page.waitForTimeout(500);const after=await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds);check('settled-orbits-continue-at-visible-time-'+suffix,after>before+.20);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);const hidden=await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds);await page.waitForTimeout(230);check('browser-hidden-time-is-frozen-'+suffix,hidden===await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds));await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(160);const resume=await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds);check('browser-resume-has-no-backlog-'+suffix,resume>hidden&&resume-hidden<.30);
 const reverse=await go(.97),ret=await go(.58),same=await go(.97);check('reverse-and-mid-transition-reversal-retain-one-phase-'+suffix,reverse.heldSeconds===same.heldSeconds&&ret.phase==='within');await page.screenshot({path:path.join(out,'charge-'+suffix+'.png')});await go(1);
 await page.locator('.finale-catalog summary').click();check('native-skill-catalogue-is-readable-'+suffix,await page.locator('.finale-catalog[open] li').count()===34&&await page.locator('.finale-catalog[open] li').last().isVisible());await page.locator('.finale-catalog summary').click();
 await page.locator('#contact').evaluate(e=>e.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(600);const off=await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds);await page.waitForTimeout(200);check('leaving-the-finale-stops-its-clock-'+suffix,off===await page.evaluate(()=>ProfileExperience.snapshot().finale.visibleSeconds));await page.locator('#experience').evaluate(e=>e.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(250);check('return-from-contact-restores-original-canvas-'+suffix,await page.locator('#experience #architecture').count()===1&&await page.evaluate(()=>ProfileExperience.snapshot().finale.active));
 if(width===390){
  for(const height of [654,844]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);
   const placement=()=>page.evaluate(()=>{
    const canvas=document.querySelector('#architecture'),r=canvas.getBoundingClientRect(),section=document.querySelector('#experience');
    return {y:scrollY,top:r.top,bottom:r.bottom,h:r.height,host:canvas.parentElement.className,
     count:document.querySelectorAll('#architecture').length,eyebrow:section.querySelector('.eyebrow').getBoundingClientRect().top,
     title:section.querySelector('h2').getBoundingClientRect().toJSON(),header:document.querySelector('.site-header').getBoundingClientRect().bottom};
   });
   const layouts=[];for(const phase of [.50,.66,.78,.90,.997,1,.78,.50]){await go(phase);layouts.push(await placement());}
   check('portal-keeps-the-entire-burst-above-summary-text-'+suffix+'-'+height,layouts.every(r=>r.count===1&&r.bottom+12<r.eyebrow&&r.eyebrow<r.title.top),{minimumGap:Math.min(...layouts.map(r=>r.eyebrow-r.bottom))});
   const incoming=layouts[4],docked=layouts[5],documentEdge=r=>r.y+r.top;
   check('last-portal-frame-meets-the-reserved-artwork-'+suffix+'-'+height,Math.abs(documentEdge(incoming)-documentEdge(docked))<4&&Math.abs(incoming.h-docked.h)<2&&docked.host.includes('reflection-art'));
   const direct=await browser.newPage({viewport:{width,height}});
   try{
    await direct.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+(lang==='th'?'th/':'')+'profile/#experience');
    await direct.evaluate(()=>document.fonts.ready);
    await direct.waitForFunction(()=>window.ProfileExperience?.snapshot().finale.p===1&&document.querySelector('#experience #architecture'));
    const bounds=await direct.evaluate(()=>{const q=s=>document.querySelector(s).getBoundingClientRect();return {canvas:q('#architecture').toJSON(),eyebrow:q('#experience .eyebrow').top,title:q('#experience h2').toJSON(),header:q('.site-header').bottom};});
    check('direct-summary-preserves-the-complete-heading-and-orbit-'+suffix+'-'+height,bounds.canvas.top>=bounds.header&&bounds.canvas.bottom+12<bounds.eyebrow&&bounds.title.bottom<=height+1,bounds);
   }finally{await direct.close();}
  }
 }
 await page.setViewportSize(width<700?{width:844,height:390}:{width:1024,height:768});await page.waitForTimeout(260);await go(.75);check('orientation-preserves-native-layout-and-portal-'+suffix,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelectorAll('#architecture').length===1&&ProfileExperience.snapshot().finale.active));await go(1);const raf=await page.evaluate(()=>__finaleRaf());check('finale-shares-the-single-page-animation-frame-'+suffix,raf.peak===1,raf);await page.close();}
 const p=await browser.newPage({viewport:{width:390,height:844}});await p.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/#experience');await p.waitForFunction(()=>window.ProfileExperience?.snapshot().finale.p===1&&document.querySelector('#experience #architecture')); check('direct-experience-link-starts-the-actual-orbit',await p.evaluate(()=>ProfileExperience.snapshot().finale.p===1&&document.querySelector('#experience #architecture')!==null));await p.close();
 const fallback=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});await fallback.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/');await fallback.locator('.finale-catalog summary').click();check('all-34-skills-and-career-remain-native-without-javascript',await fallback.locator('.finale-catalog[open] li').count()===34&&await fallback.locator('.career-row').count()>=4);await fallback.close();
 const failed=await browser.newPage();await failed.route('**/finale.js*',r=>r.abort());await failed.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/#experience');await failed.waitForFunction(()=>window.ProfileExperience&&ProfileExperience.snapshot().target===9&&document.querySelector('#experience #architecture')); check('optional-finale-failure-preserves-the-original-reflection',await failed.locator('#experience #architecture').count()===1&&await failed.evaluate(()=>ProfileExperience.snapshot().mode==='full'));await failed.close();
 }finally{await browser.close();}}
 check('no-runtime-errors',errors.length===0,errors);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,errors,physicalDevice:false},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out}));if(failed.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
