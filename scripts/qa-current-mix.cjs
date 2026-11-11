/* Scoped mix regression: preserve source colour; measure scroll gain against v17.
 * Offline samples use the actual production graph/score, not substitute sounds. */
const {chromium,webkit}=require('playwright'),fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const BASELINE='8459f5763154cb31a60fde78f6c68b80bc71e4d2';
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8781/',out=process.env.QA_DIR||'qa-output/current-mix-'+engine;
 fs.mkdirSync(out,{recursive:true});fs.rmSync(out+'/result.json',{force:true});const checks=[],errors=[];
 const check=(name,pass,data={})=>{checks.push({name,pass:!!pass,...data});console.log(name,!!pass);};
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.HolyMindCueTimbres?.snapshot().ready&&window.HolyMindScrollSound?.snapshot().stations.length===11);
  check('release-v18',await p.locator('html').getAttribute('data-build')==='current-mix-v18');
  check('only-scroll-boost-config',await p.evaluate(()=>HolyMindSoundscape.mix.scrollBoostDb===8&&Math.abs(HolyMindSoundscape.mix.scrollBoostGain-10**.4)<1e-9));
  check('no-autoplay',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'));
  const old=cp.execFileSync('git',['show',BASELINE+':holymind-soundscape.js'],{encoding:'utf8'}).replace('root.HolyMindSoundscape=','root.HolyMindSoundscapeBaseline=');await p.addScriptTag({content:old});
  const offline=await p.evaluate(async()=>{
   const sr=24000,duration=14,total=Math.round(sr*duration),outputs={};
   for(const config of [
    {id:'before-current',old:true,mode:'current',master:1},
    {id:'after-current',old:false,mode:'current',master:1},
    {id:'before-ambient',old:true,mode:'ambient',master:1},
    {id:'after-ambient',old:false,mode:'ambient',master:1},
    {id:'before-mix',old:true,mode:'mix',master:.48},
    {id:'after-mix',old:false,mode:'mix',master:.48},
    {id:'after-stress',old:false,mode:'stress',master:1}
   ]){
    const ctx=new OfflineAudioContext(2,total,sr),master=ctx.createGain();master.gain.value=config.master;
    if(config.mode==='mix'||config.mode==='stress'){
     const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=14;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.14;master.connect(comp);comp.connect(ctx.destination);
    }else master.connect(ctx.destination);
    const field=(config.old?HolyMindSoundscapeBaseline:HolyMindSoundscape).create(ctx,master);
    const musical=config.mode==='mix'||config.mode==='stress',score=musical?HolyMindScrollScore.create(ctx,master,{offline:true}):null;
    if(score){for(let i=0;i<14;i++){const at=.75+i*60/88+(i>=8?1.25:0);score.scheduleBeat(i,at,88,{scene:'orbit'});}}
    for(let i=0;i<=140;i++){
     const t=i*.1;
     let activity=t<1?0:t<3?.30:t<5?.6:t<7?.85:t<8?0:t<10.5?.52:0;
     field.update({scope:1,enabled:true,ambience:config.mode!=='current',flow:config.mode!=='ambient',activity,progress:Math.min(1,t/11),direction:t>=8?-1:1,morph:.34,scene:'orbit'},t);
    }
    if(config.mode==='stress'){
     for(const [i,id] of ['holy-prime','neural-discharge','triad-resonance'].entries()){
      const d=HolyMindTimbres.render(id),b=ctx.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);
      const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;g.gain.value=1/Math.sqrt(1+i*.65);s.connect(g);g.connect(master);s.start(4.5);field.duck(4.5);
     }
    }
    master.gain.setTargetAtTime(0,12.8,.15);
    const rendered=await ctx.startRendering();outputs[config.id]=[rendered.getChannelData(0),rendered.getChannelData(1)];
   }
   function stats(id){const d=outputs[id];let peak=0,sum=0,finite=true,late=0,n=0;for(const ch of d)for(let i=0;i<ch.length;i++){const v=ch[i];finite=finite&&Number.isFinite(v);peak=Math.max(peak,Math.abs(v));sum+=v*v;if(i>sr*12.5){late+=v*v;n++;}}return {id,finite,peak,rms:Math.sqrt(sum/(total*2)),lateRms:Math.sqrt(late/Math.max(1,n))};}
   const metrics=Object.keys(outputs).map(stats),g=10**.4;let maxRelativeError=0,ambientMaxDifference=0;
   for(let ch=0;ch<2;ch++)for(let i=0;i<total;i++){
    maxRelativeError=Math.max(maxRelativeError,Math.abs(outputs['after-current'][ch][i]-outputs['before-current'][ch][i]*g));
    ambientMaxDifference=Math.max(ambientMaxDifference,Math.abs(outputs['after-ambient'][ch][i]-outputs['before-ambient'][ch][i]));
   }
   const before=metrics.find(m=>m.id==='before-current'),after=metrics.find(m=>m.id==='after-current');
   const enc=ch=>{const bytes=new Uint8Array(ch.buffer);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
   return {sr,duration,measuredBoostDb:20*Math.log10(after.rms/before.rms),maxRelativeError,ambientMaxDifference,metrics,previews:['before-mix','after-mix'].map(id=>({id,channels:outputs[id].map(enc)}))};
  });
  check('scroll-stem-plus-eight-db',Math.abs(offline.measuredBoostDb-8)<.02,{measuredDb:offline.measuredBoostDb});
  check('original-current-timbre-preserved',offline.maxRelativeError<.000001,{maxError:offline.maxRelativeError});
  check('ambient-stem-identical',offline.ambientMaxDifference<.000001,{maxDifference:offline.ambientMaxDifference});
  for(const m of offline.metrics)check('finite-unclipped-'+m.id,m.finite&&m.peak<.98,{peak:m.peak,rms:m.rms});
  check('scroll-decays-after-pause',offline.metrics.find(x=>x.id==='after-current').lateRms<.00001);
  const before=offline.metrics.find(x=>x.id==='before-mix'),after=offline.metrics.find(x=>x.id==='after-mix');
  check('master-mix-not-just-turned-up',20*Math.log10(after.rms/before.rms)<3,{totalMixChangeDb:20*Math.log10(after.rms/before.rms)});
  if(process.env.WRITE_PREVIEWS==='1'){
   const dir=path.resolve(__dirname,'../assets/audio/current-mix-v18');fs.mkdirSync(dir,{recursive:true});const rows=[];
   for(const r of offline.previews){const ch=r.channels.map(s=>new Float32Array(Uint8Array.from(Buffer.from(s,'base64')).buffer)),frames=ch[0].length,b=Buffer.alloc(44+frames*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(offline.sr,24);b.writeUInt32LE(offline.sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);for(let i=0;i<frames;i++)for(let c=0;c<2;c++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,ch[c][i]))*32767),44+i*4+c*2);const file=r.id+'.wav';fs.writeFileSync(dir+'/'+file,b);rows.push({file,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});}
   fs.writeFileSync(dir+'/manifest.json',JSON.stringify({release:'current-mix-v18',source:'Actual production graph via OfflineAudioContext; identical Mozart beats and current gestures; only scroll gain differs.',masterGain:.48,normalization:'None; neither file independently normalized',duration:offline.duration,sampleRate:offline.sr,measurements:{measuredBoostDb:offline.measuredBoostDb,totalMixChangeDb:20*Math.log10(after.rms/before.rms),metrics:offline.metrics},files:rows},null,2));
  }
  delete offline.previews;fs.writeFileSync(out+'/offline.json',JSON.stringify(offline,null,2));
  const audio=()=>p.evaluate(()=>HolyMindAudio.snapshot());const wheel=async(d,n=20)=>{for(let i=0;i<n;i++){await p.mouse.wheel(0,d);await p.waitForTimeout(75);}};
  await p.locator('#sound-toggle').click();await p.waitForTimeout(1200);await wheel(14,38);let a=await audio();
  check('live-scroll-and-piano-both-have-signal',a.soundscape.rms.scroll>.002&&a.score.rms>.0002&&a.score.played>10,{currentRms:a.soundscape.rms.scroll,pianoRms:a.score.rms});
  check('one-context-no-new-source-bank',a.contextCount===1&&a.soundscape.continuousSources===13&&a.score.peakVoices<=36);
  check('live-mix-includes-eight-db',a.soundscape.scrollBoostDb===8);
  check('music-order-unchanged',a.score.history.every((s,i,h)=>!i||s.beat===(h[i-1].beat+1)%56));
  await p.waitForFunction(()=>!HolyMindAudio.snapshot().score.running,null,{timeout:6000});a=await audio();
  check('piano-still-rings-at-scroll-stop',a.score.activeVoices>0&&a.score.rms>.00001,{voices:a.score.activeVoices,rms:a.score.rms});
  await p.waitForTimeout(4700);a=await audio();
  check('current-quiets-without-cutting-ambient',a.soundscape.rms.scroll<.00008&&a.soundscape.rms.ambient>.0002&&!a.score.timer);
  await wheel(-12,26);a=await audio();check('up-scroll-current-and-score',a.soundscape.direction===-1&&a.soundscape.rms.scroll>.001&&a.score.running);
  await p.evaluate(()=>{HolyMindScrollSound.suppressForNavigation();scrollTo({top:0,behavior:'instant'});});await p.waitForTimeout(1800);
  await p.locator('.sonic-settings summary').click();await p.locator('#sound-flow').uncheck();await p.locator('.sonic-settings summary').click();await wheel(14,24);a=await audio();
  check('flow-toggle-still-independent',!a.flow&&a.soundscape.rms.scroll<.0001&&a.score.rms>.0001);
  await p.locator('#sound-toggle').click();a=await audio();check('mute-still-cleans-every-bus',!a.enabled&&a.soundscape===null&&a.score===null&&await p.evaluate(()=>document.body.dataset.motion==='on'));
  check('no-ui-overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const failed=checks.filter(x=>!x.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(x=>x.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
