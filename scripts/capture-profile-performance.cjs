/* Review the shipped renderer, not a second illustrative implementation.
   CAPTURE_DIR selects a round; defaults to the immutable baseline directory.
   CAPTURE_VIDEO=1 records the isolated-canvas pilot traversal.
   SWEEP_ONLY=1 records continuous forward/reverse scroll through pilot beats.
   CAPTURE_BEATS=20,25 limits key poses; CAPTURE_VIEWS=art limits their views.
   SKIP_PILOTS=1 / SKIP_PHASES=1 omit transition/phase stills.
   STILL_DELAY_MS=800 lets afterimages decay; ART_DPR=2 inspects small contacts. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const out=path.resolve(process.env.CAPTURE_DIR||'docs/evidence/faceless-performance/baseline');
const base=process.env.TEST_URL||'http://127.0.0.1:4174/';
const sweepOnly=process.env.SWEEP_ONLY==='1',recordVideo=sweepOnly||process.env.CAPTURE_VIDEO==='1';
const artDpr=Math.max(1,Math.min(3,Number(process.env.ART_DPR)||1));
const stillDelayMs=Math.max(0,Math.min(2000,Number(process.env.STILL_DELAY_MS)||0));
const selectedBeats=process.env.CAPTURE_BEATS?new Set(process.env.CAPTURE_BEATS.split(',').map(Number)):null;
const selectedViews=new Set((process.env.CAPTURE_VIEWS||'desktop,mobile,art').split(','));
const selectedStages=process.env.PHASE_STAGES?new Set(process.env.PHASE_STAGES.split(',')):null;
if(fs.existsSync(path.join(out,'manifest.json'))&&process.env.ALLOW_OVERWRITE!=='1')throw new Error('Capture directory already contains a manifest; choose a new CAPTURE_DIR or explicitly set ALLOW_OVERWRITE=1.');
fs.mkdirSync(out,{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const captureTime=new Date().toISOString();
(async()=>{
 const browser=await chromium.launch({headless:true}),pages={},contexts=[],scriptBodies=[],loadedScripts=[];
 try{
  for(const [name,viewport]of Object.entries({desktop:{width:1440,height:1000},mobile:{width:390,height:844},art:{width:1000,height:1000}})){
   const context=await browser.newContext({viewport,deviceScaleFactor:name==='art'?artDpr:1,...(name==='art'&&recordVideo?{recordVideo:{dir:path.join(out,'video-source'),size:{width:1000,height:1000}}}:{})});contexts.push(context);pages[name]=await context.newPage();if(name==='art')pages[name].on('response',r=>{if(r.request().resourceType()==='script'&&r.url().startsWith(new URL(base).origin))scriptBodies.push(r.body().then(body=>loadedScripts.push({url:r.url(),bytes:body.length,sha256:crypto.createHash('sha256').update(body).digest('hex')})).catch(error=>loadedScripts.push({url:r.url(),captureError:error.message})));});
  }
  await Promise.all(Object.values(pages).map(async p=>{await p.goto(base+'profile/');await p.waitForFunction(()=>window.ProfileExperience&&window.ProfileGeometry);await p.evaluate(()=>document.fonts.ready);}));
  await Promise.all(scriptBodies);
  await pages.art.addStyleTag({content:`#architecture{display:block!important;position:fixed!important;inset:0 auto auto 0!important;width:720px!important;height:720px!important;padding:0!important;z-index:999!important;background:#0b0912!important}.site-header,.stage-top,.stage-bottom,.scene-transition,.scene-meaning,.scene-caption,.chapter-rail{visibility:hidden!important}.stage-frame:before,.stage-frame:after{display:none!important}.stage{z-index:100!important}`});
  if(recordVideo)await pages.art.addStyleTag({content:`body:before{content:"";position:fixed;inset:0;z-index:99;background:#0b0912;pointer-events:none}#architecture{inset:140px auto auto 140px!important}`});
  if(process.env.HIDE_LABELS==='1')await pages.art.evaluate(()=>{const original=ProfileGeometry.illustration;ProfileGeometry.illustration=(...args)=>original(...args).map(layer=>({...layer,texts:[]}));});
  await pages.art.evaluate(()=>dispatchEvent(new Event('resize')));
  const metadata=await pages.desktop.evaluate(()=>({release:ProfileGeometry.config.release,sequence:ProfileGeometry.sequence,shots:ProfileGeometry.config.camera.shots,morph:ProfileGeometry.config.morph,scripts:[...document.scripts].filter(s=>s.src).map(s=>s.src)}));
  const releases=await Promise.all(Object.values(pages).map(p=>p.evaluate(()=>ProfileGeometry.config.release)));
  if(!releases.every(r=>r===metadata.release))throw new Error('A build changed while baseline pages loaded; retry against a stable preview.');
  const snapshots=[],errors=[];for(const [name,p]of Object.entries(pages))p.on('pageerror',e=>errors.push({viewport:name,message:e.message}));
  async function go(p,position){
   const expected=Math.min(10,position),y=await p.evaluate(position=>{const a=ProfileExperience.snapshot().anchors,g=ProfileGeometry,chapter=Math.floor(position);if(position===chapter||chapter>=9)return a[Math.min(10,chapter)];return a[chapter]+(a[chapter+1]-a[chapter])*(g.config.morph.start+(g.config.morph.end-g.config.morph.start)*(position-chapter));},expected);
   await p.evaluate(y=>scrollTo({top:Math.max(0,y),behavior:'instant'}),y);
   await p.waitForFunction(expected=>Math.abs(ProfileExperience.snapshot().target-expected)<.006,expected);
   await p.waitForFunction(()=>Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001);
   if(stillDelayMs)await p.waitForTimeout(stillDelayMs);
   await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   return p.evaluate(()=>{const s=ProfileExperience.snapshot();return {position:s.current,shot:s.shot,detail:s.detail,drawCost:s.drawCost,camera:s.camera};});
  }
  for(const [index,shot]of (process.env.ACTIONS_ONLY==='1'||sweepOnly?[]:metadata.sequence).entries()){
   if(selectedBeats&&!selectedBeats.has(index))continue;
   const position=shot.step===0?shot.chapter:shot.chapter+(shot.step+.05)/shot.count,id=String(index).padStart(2,'0');
   const entries=await Promise.all(Object.entries(pages).filter(([name])=>selectedViews.has(name)).map(async([name,p])=>{const state=await go(p,position);const file=`${name}-${id}.png`;if(name==='art')await p.locator('#architecture').screenshot({path:path.join(out,file)});else await p.screenshot({path:path.join(out,file)});return {viewport:name,file,...state};}));
   snapshots.push({index,action:shot.action,pose:shot.pose,prop:shot.prop,position,entries});
   if(index%6===0)console.log(`Captured ${index+1}/${metadata.sequence.length}: ${shot.action}`);
  }
  const pilots=[];
  for(const index of (process.env.ACTIONS_ONLY==='1'||sweepOnly||process.env.SKIP_PILOTS==='1'?[]:[2,13,15,20,23]).filter(i=>i<metadata.sequence.length-1)){
   const shot=metadata.sequence[index];
   for(const phase of [.25,.50,.75]){
    const position=shot.chapter+(shot.step+phase)/shot.count,state=await go(pages.art,position),file=`transition-${String(index).padStart(2,'0')}-${Math.round(phase*100)}.png`;
    await pages.art.locator('#architecture').screenshot({path:path.join(out,file)});pilots.push({index,phase,position,file,from:shot.action,to:metadata.sequence[index+1].action,...state});
   }
  }
  const performances=[],phaseSamples=await pages.art.evaluate(indices=>{
   const g=ProfileGeometry;if(!g.motion?.poseAt)return [];const results=[];
   for(const index of indices){const groups={};for(let n=1;n<=100;n++){const u=n/100,phase=g.motion.poseAt(index-1+u).phase;const stage=phase.stage;(groups[stage]||=[]).push(u);}
    for(const [stage,samples]of Object.entries(groups)){const u=stage==='hold'?.999: samples[Math.floor(samples.length/2)],target=index-1+u;let lo=0,hi=10;for(let k=0;k<50;k++){const mid=(lo+hi)/2;if(g.resolve(mid)<target)lo=mid;else hi=mid;}results.push({index,stage,u,position:(lo+hi)/2});}
   }return results;
  },sweepOnly||process.env.SKIP_PHASES==='1'?[]:(process.env.PERFORMANCE_BEATS||'2,3,11,14,15,20').split(',').map(Number));
  for(const sample of phaseSamples){if(selectedStages&&!selectedStages.has(sample.stage))continue;const state=await go(pages.art,sample.position),file=`performance-${String(sample.index).padStart(2,'0')}-${sample.stage}.png`;await pages.art.locator('#architecture').screenshot({path:path.join(out,file)});const actual=await pages.art.evaluate(()=>{const g=ProfileGeometry,position=ProfileExperience.snapshot().current,p=g.performanceAt(position),canvas=document.querySelector('#architecture'),project=g.createProjector(position,canvas.clientWidth,canvas.clientHeight);return {phase:p.phase,hand:p.handR,head:p.head,hip:p.hip,work:p.work.center,contact:p.contacts.right,projectedWrist:project(p.handR),projectedTip:project(g.lightAt(position))};});performances.push({...sample,...state,file,actual});}
  const sweeps=[];
  if(sweepOnly){
   const ranges=await pages.art.evaluate(indices=>indices.map(index=>{const g=ProfileGeometry,inverse=target=>{let lo=0,hi=10;for(let k=0;k<50;k++){const mid=(lo+hi)/2;if(g.resolve(mid)<target)lo=mid;else hi=mid;}return(lo+hi)/2;};return{index,from:inverse(index-1),to:inverse(index-.001)};}),(process.env.PERFORMANCE_BEATS||'2,3,11,14,15,20').split(',').map(Number));
   for(const range of ranges){
    await go(pages.art,range.from);
    for(const direction of ['forward','reverse']){
     const from=direction==='forward'?range.from:range.to,to=direction==='forward'?range.to:range.from;
     const samples=await pages.art.evaluate(async({from,to})=>{const anchors=ProfileExperience.snapshot().anchors,g=ProfileGeometry,yAt=position=>{const chapter=Math.floor(position);return position===chapter||chapter>=9?anchors[Math.min(10,chapter)]:anchors[chapter]+(anchors[chapter+1]-anchors[chapter])*(g.config.morph.start+(g.config.morph.end-g.config.morph.start)*(position-chapter));},rows=[],started=performance.now();let last=-Infinity;await new Promise(done=>{function tick(now){const progress=Math.min(1,(now-started)/3000);scrollTo({top:yAt(from+(to-from)*progress),behavior:'instant'});if(now-last>=100||progress===1){const s=ProfileExperience.snapshot(),p=g.performanceAt(s.current);rows.push({elapsed:now-started,position:s.current,target:s.target,camera:s.camera,hand:p.handR,stage:p.phase.stage});last=now;}if(progress===1)done();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});return rows;},{from,to});
     const state=await go(pages.art,to),file=`sweep-${String(range.index).padStart(2,'0')}-${direction}-end.png`;
     // Avoid clipped Playwright screenshots during video: Chromium can briefly
     // expose the screenshot viewport in its recording. Read the real Canvas.
     const png=await pages.art.evaluate(()=>{const source=document.querySelector('#architecture'),copy=document.createElement('canvas');copy.width=source.width;copy.height=source.height;const ctx=copy.getContext('2d');ctx.fillStyle='#0b0912';ctx.fillRect(0,0,copy.width,copy.height);ctx.drawImage(source,0,0);return copy.toDataURL('image/png').split(',')[1];});fs.writeFileSync(path.join(out,file),Buffer.from(png,'base64'));sweeps.push({...range,direction,durationMs:3000,samples,file,...state});
    }
    console.log(`Captured forward/reverse sweep for beat ${range.index}: ${metadata.sequence[range.index].action}`);
   }
  }
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({capturedAt:captureTime,base,loadedScripts,unlabelledDiagnostic:process.env.HIDE_LABELS==='1',...metadata,viewport:{desktop:[1440,1000],mobile:[390,844],art:[720,720]},artDeviceScaleFactor:artDpr,stillDelayMs,notes:['All artwork is captured from the live browser canvas.','The art view overrides capture CSS only: 720-square canvas, no caption overlays, desktop camera behavior.','Desktop and mobile captures retain the real layout.','Steady key poses allow two settled rendering frames. Pilot transitions use fixed scroll positions.','Continuous sweeps drive native scroll at requestAnimationFrame cadence and retain the runtime camera damping.','These are headless review captures, not physical-device performance measurements.'],metadataHash:crypto.createHash('sha256').update(JSON.stringify(metadata)).digest('hex'),snapshots,pilots,performances,sweeps,errors},null,2));
  const style=`*{box-sizing:border-box}body{margin:0;padding:32px;background:#0b0912;color:#eee7f5;font:14px/1.6 Arial,sans-serif}h1{font:38px/1.1 Georgia,serif;margin:0 0 14px}h2{font:21px/1.2 Georgia,serif;margin:8px 0}p{color:#c4bacc}header{margin-bottom:25px}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}figure{margin:0;background:#15121e;border-top:2px solid #b497e8}img{display:block;width:100%;height:auto}figcaption{padding:16px}small{color:#c3a4f0}a{color:#b6e6db;margin-right:14px}@media(max-width:750px){main{grid-template-columns:1fr}}`;
  const card=s=>{const id=String(s.index).padStart(2,'0'),art=s.entries.find(e=>e.viewport==='art')||s.entries[0];return `<figure><a href="${art.file}"><img src="${art.file}" alt="${esc(s.action)}"></a><figcaption><small>${s.index+1} / ${esc(s.pose)} · ${esc(s.prop)}</small><h2>${esc(s.action)}</h2><p>${s.entries.filter(e=>e.viewport!=='art').map(e=>`<a href="${e.file}">${esc(e.viewport)} context</a>`).join('')}</p></figcaption></figure>`;};
  const doc=(title,cards)=>`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${style}</style><header><h1>${esc(title)}</h1><p>${esc(metadata.release)} · ${esc(captureTime)} · actual live Canvas captures${process.env.HIDE_LABELS==='1'?' · object labels removed for acting diagnostic':''}</p></header><main>${cards}</main></html>`;
  fs.writeFileSync(path.join(out,'contact-sheet.html'),doc(selectedBeats?'Human performance — selected beats':'Human performance — all 31 beats',snapshots.map(card).join('')));
  const board=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  for(let i=0;i<snapshots.length;i+=6){const file=`sheet-${String(i/6+1).padStart(2,'0')}`,html=doc(selectedBeats?`Human performance — selected poses ${i/6+1}`:`Human performance — beats ${i+1}–${Math.min(i+6,snapshots.length)}`,snapshots.slice(i,i+6).map(card).join(''));fs.writeFileSync(path.join(out,file+'.html'),html);await board.goto('file://'+path.join(out,file+'.html'));await board.screenshot({path:path.join(out,file+'.png'),fullPage:true});}
  fs.writeFileSync(path.join(out,'transitions.html'),doc('Transition pilots — 25% / 50% / 75%',pilots.map(s=>`<figure><img src="${s.file}" alt="${esc(s.from)} transition"><figcaption><small>${Math.round(s.phase*100)}% · position ${s.position.toFixed(3)}</small><h2>${esc(s.from)} → ${esc(s.to)}</h2></figcaption></figure>`).join('')));
  for(const index of [...new Set(performances.map(s=>s.index))]){
   const cards=performances.filter(s=>s.index===index).map(s=>`<figure><img src="${s.file}" alt="${esc(s.actual.phase.stage)}"><figcaption><small>${esc(s.actual.phase.stage)} · u ${s.u.toFixed(2)}</small><h2>${esc(metadata.sequence[index].action)}</h2></figcaption></figure>`).join(''),file=`performance-${String(index).padStart(2,'0')}`;fs.writeFileSync(path.join(out,file+'.html'),doc(metadata.sequence[index].action+' — performance phases',cards));await board.goto('file://'+path.join(out,file+'.html'));await board.screenshot({path:path.join(out,file+'.png'),fullPage:true});
  }
  await board.goto('file://'+path.join(out,'transitions.html'));await board.screenshot({path:path.join(out,'transitions.png'),fullPage:true});
  const video=pages.art.video();await Promise.all(contexts.map(c=>c.close()));if(video)await video.saveAs(path.join(out,'pilot-traversal.webm'));
  const capturedViews=[...new Set([...snapshots.flatMap(s=>s.entries.map(e=>e.viewport)),...(pilots.length||performances.length||sweeps.length?['art']:[])])];
  console.log(JSON.stringify({out,release:metadata.release,poses:snapshots.length,capturedViews,transitionCaptures:pilots.length,performanceCaptures:performances.length,continuousSweeps:sweeps.length,errors},null,2));if(errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
