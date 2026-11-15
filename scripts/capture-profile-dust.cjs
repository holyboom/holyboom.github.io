/* Small visual review of real scroll-bound dust. No renderer modifications.
   TEST_URL defaults to http://127.0.0.1:4174/; DUST_CAPTURE_DIR selects output. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const base=process.env.TEST_URL||'http://127.0.0.1:4174/';
const out=path.resolve(process.env.DUST_CAPTURE_DIR||'docs/evidence/ambient-dust/candidate');
const indices=(process.env.DUST_BEATS||'3,13,20,23').split(',').map(Number);
const phases=[['formed',.001],['breakup',.35],['cloud',.52],['reassembling',.72],['reformed',.999]];
if(fs.existsSync(path.join(out,'manifest.json')))throw new Error('Choose a fresh DUST_CAPTURE_DIR.');
fs.mkdirSync(out,{recursive:true});
const artCSS='#architecture{display:block!important;position:fixed!important;inset:0 auto auto 0!important;width:720px!important;height:720px!important;padding:0!important;z-index:999!important;background:#0b0912!important}.site-header,.stage-top,.stage-bottom,.scene-transition,.scene-meaning,.scene-caption,.chapter-rail{visibility:hidden!important}.stage-frame:before,.stage-frame:after{display:none!important}.stage{z-index:100!important}';
(async()=>{
 const browser=await chromium.launch(),contexts=[],pages={},errors=[],bodies=[],loadedScripts=[],captures=[],sweeps=[];
 try{
  async function setup(name,viewport,record=false){
   const context=await browser.newContext({viewport,...(record?{recordVideo:{dir:path.join(out,'video-source'),size:{width:1000,height:1000}}}:{})});contexts.push(context);const page=await context.newPage();page.on('pageerror',error=>errors.push({view:name,message:error.message}));
   page.on('response',response=>{if(response.request().resourceType()==='script'&&response.url().startsWith(new URL(base).origin))bodies.push(response.body().then(body=>loadedScripts.push({view:name,url:response.url(),sha256:crypto.createHash('sha256').update(body).digest('hex')})));});
   await page.goto(base+'profile/');await page.waitForFunction(()=>window.ProfileExperience&&window.ProfileGeometry);await page.evaluate(()=>document.fonts.ready);
   if(name==='art'||record){await page.addStyleTag({content:artCSS+(record?'body:before{content:"";position:fixed;inset:0;z-index:99;background:#0b0912;pointer-events:none}#architecture{inset:140px auto auto 140px!important}':'')});await page.evaluate(()=>dispatchEvent(new Event('resize')));}
   return page;
  }
  for(const [name,viewport]of Object.entries({desktop:{width:1440,height:1000},mobile:{width:390,height:844},art:{width:1000,height:1000}}))pages[name]=await setup(name,viewport);
  await Promise.all(bodies);
  const metadata=await pages.art.evaluate(()=>({release:ProfileGeometry.config.release,sequence:ProfileGeometry.sequence}));
  async function gotoTimeline(page,timeline){
   const target=await page.evaluate(timeline=>{const g=ProfileGeometry;let lo=0,hi=g.config.scenes.length-1;for(let i=0;i<58;i++){const mid=(lo+hi)/2;if(g.resolve(mid)<timeline)lo=mid;else hi=mid;}const position=(lo+hi)/2,a=ProfileExperience.snapshot().anchors,c=Math.floor(position),y=c>=a.length-1?a.at(-1):a[c]+(a[c+1]-a[c])*(g.config.morph.start+(g.config.morph.end-g.config.morph.start)*(position-c));scrollTo({top:y,behavior:'instant'});return position;},timeline);
   await page.waitForFunction(target=>Math.abs(ProfileExperience.snapshot().target-target)<.006,target);await page.waitForFunction(()=>Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001);await page.waitForTimeout(800);
   return page.evaluate(()=>{const s=ProfileExperience.snapshot(),g=ProfileGeometry,layers=g.illustration(s.current).filter(layer=>layer.role==='surroundings'),particles=layers.flatMap(layer=>layer.paths.filter(item=>item.particle&&item.alpha*layer.alpha>1e-6));return {position:s.current,timeline:g.resolve(s.current),camera:s.camera,particles:particles.length,mobileParticles:particles.filter(item=>!item.secondary).length};});
  }
  for(const index of indices)for(const [phase,fraction]of phases){
   const timeline=index-1+fraction,views=phase==='cloud'?['desktop','mobile','art']:['art'];
   for(const view of views){const page=pages[view],state=await gotoTimeline(page,timeline),file=`${view}-${String(index).padStart(2,'0')}-${phase}.png`;if(view==='art')await page.locator('#architecture').screenshot({path:path.join(out,file)});else await page.screenshot({path:path.join(out,file)});captures.push({index,phase,fraction,view,file,...state});}
  }
  // A separate recording context avoids still-capture setup jumps in the video.
  const videoPage=await setup('video',{width:1000,height:1000},true);
  for(const index of indices){
   await gotoTimeline(videoPage,index-1+.001);
   for(const direction of ['forward','reverse']){
    const samples=await videoPage.evaluate(async({index,direction})=>{const g=ProfileGeometry,anchors=ProfileExperience.snapshot().anchors,inverse=timeline=>{let lo=0,hi=g.config.scenes.length-1;for(let n=0;n<48;n++){const mid=(lo+hi)/2;if(g.resolve(mid)<timeline)lo=mid;else hi=mid;}return(lo+hi)/2;},yAt=timeline=>{const position=inverse(timeline),c=Math.floor(position);return anchors[c]+(anchors[c+1]-anchors[c])*(g.config.morph.start+(g.config.morph.end-g.config.morph.start)*(position-c));},start=performance.now(),rows=[];let last=-Infinity;
     await new Promise(done=>{function tick(now){const t=Math.min(1,(now-start)/3600),u=direction==='forward'?t:1-t;scrollTo({top:yAt(index-1+.001+.998*u),behavior:'instant'});if(now-last>=120||t===1){const s=ProfileExperience.snapshot();rows.push({elapsed:now-start,position:s.current,timeline:g.resolve(s.current),camera:s.camera});last=now;}if(t===1)done();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});return rows;},{index,direction});
    const state=await gotoTimeline(videoPage,index-1+(direction==='forward'?.999:.001));sweeps.push({index,direction,samples,...state});
   }
  }
  const video=videoPage.video();await videoPage.context().close();await video.saveAs(path.join(out,'dust-forward-reverse.webm'));
  const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const style='body{margin:0;padding:24px;background:#0b0912;color:#eee7f5;font:14px/1.5 Arial}h1{font:32px Georgia}main{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}figure{margin:0;border-top:1px solid #9172b4}img{width:100%;display:block}figcaption{padding:10px;color:#c9b9df}a{color:#a8dfd0}';
  const board=await browser.newPage({viewport:{width:1500,height:850}});
  for(const index of indices){const title=metadata.sequence[index-1].action+' → '+metadata.sequence[index].action,html='<!doctype html><meta charset="utf-8"><style>'+style+'</style><h1>'+esc(title)+'</h1><p>Actual production Canvas · '+esc(metadata.release)+'</p><main>'+captures.filter(item=>item.index===index&&item.view==='art').map(item=>'<figure><img src="'+item.file+'"><figcaption>'+item.phase+' · '+item.particles+' grains</figcaption></figure>').join('')+'</main>';const file=`transition-${String(index).padStart(2,'0')}`;fs.writeFileSync(path.join(out,file+'.html'),html);await board.goto('file://'+path.join(out,file+'.html'));await board.screenshot({path:path.join(out,file+'.png'),fullPage:true});}
  await Promise.all(bodies);const uniqueScripts=new Map();for(const script of loadedScripts){if(uniqueScripts.has(script.url)&&uniqueScripts.get(script.url)!==script.sha256)errors.push({view:script.view,message:'Build changed during capture: '+script.url});uniqueScripts.set(script.url,script.sha256);}
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({capturedAt:new Date().toISOString(),base,...metadata,loadedScripts,captures,sweeps,errors,notes:['All artwork is live Canvas capture.','Native desktop/mobile contexts retain the production layout.','Isolated art is 720-square with DOM overlays hidden by capture CSS.','Each recorded transition uses continuous native scroll in both directions; jumps between nonadjacent beats are capture navigation.','No physical-device performance claim is implied.']},null,2));
  console.log(JSON.stringify({out,release:metadata.release,captures:captures.length,sweeps:sweeps.length,errors},null,2));if(errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
