/* Reproducible whole-site score using the production route and Web Audio graph. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
(async()=>{
 const out=path.resolve(__dirname,'../assets/audio/full-current-v14');fs.mkdirSync(out,{recursive:true});
 const evidence=path.resolve(__dirname,'../docs/evidence/full-current-v14');fs.mkdirSync(evidence,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined});
 try{
  const page=await browser.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:8777/',{waitUntil:'networkidle'});
  const old=cp.execFileSync('git',['show','7e596d823fb7b9a2d63ea933840d6c169827aa3c:holymind-soundscape.js'],{encoding:'utf8'}).replace('root.HolyMindSoundscape=','root.HolyMindSoundscapeBaseline=');await page.addScriptTag({content:old});
  const preservation=await page.evaluate(async()=>{
   const sr=24000,seconds=12,outputs=[];
   for(const factory of [HolyMindSoundscapeBaseline,HolyMindSoundscape]){const c=new OfflineAudioContext(2,sr*seconds,sr),m=c.createGain();m.gain.value=.48;m.connect(c.destination);const graph=factory.create(c,m);
    for(let i=0;i<120;i++){const t=i*.1,p=Math.min(1,Math.max(0,(t-4)/6));graph.update({scope:1,activity:t<2?0:.4,direction:t<9?1:-1,progress:p,morph:t<2?.1:t<4?.34:.66+.34*p},t);if(i===30)graph.duck(t);}
    outputs.push(await c.startRendering());}
   let max=0,ss=0;for(let ch=0;ch<2;ch++){const a=outputs[0].getChannelData(ch),b=outputs[1].getChannelData(ch);for(let i=0;i<a.length;i++){const d=a[i]-b[i];max=Math.max(max,Math.abs(d));ss+=d*d;}}
   return {sampleRate:sr,seconds,maxDifference:max,rmsDifference:Math.sqrt(ss/(sr*seconds*2)),pass:max<.000001,method:'Same OfflineAudioContext, original v13 graph vs v14 defaults, approved Hero-to-Assembly parameter score'};
  });
  fs.writeFileSync(evidence+'/approved-sound-preservation.json',JSON.stringify(preservation,null,2));console.log('APPROVED SOUND',JSON.stringify(preservation));if(!preservation.pass)throw Error('Approved sound changed');
  const manifest=[];
  for(const mode of ['taps','bed','full','field-only','scroll-only']){
   const result=await page.evaluate(async mode=>{
    const sr=24000,duration=40,ctx=new OfflineAudioContext(2,sr*duration,sr),master=ctx.createGain();master.gain.value=.48;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=14;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.14;master.connect(comp);comp.connect(ctx.destination);
    const graph=HolyMindSoundscape.create(ctx,master),clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>n*n*(3-2*n);
    const layout={height:800,orbit:800,ribbon:1600,start:2200,end:4200,positions:{workbench:4800,instrument:5600,gallery:6400,services:7200,about:8000,contact:8800,footer:9500},lead:.04,finish:.93};
    const route=[[0,0],[2,0],[4,1000],[6,1800],[7,2200],[12,4200],[15,5000],[18,5800],[21,6600],[24,7400],[27,8200],[30,9000],[32,9700],[33,9700],[39,0],[40,0]];
    const taps=[{at:.6,id:'neural-discharge'},{at:4.5,id:'cognitive-reframe'},{at:34,id:'goal-lock'}];
    const withTaps=['taps','bed','full'].includes(mode),amb=['bed','full','field-only'].includes(mode),flow=['full','scroll-only'].includes(mode);
    const yAt=t=>{let j=0;while(j<route.length-2&&t>route[j+1][0])j++;const [a,b]=[route[j],route[j+1]],u=clamp((t-a[0])/(b[0]-a[0]));return a[1]+(b[1]-a[1])*smooth(u);};
    let last=0;
    for(let i=0;i<=400;i++){
     const t=i*.1,y=yAt(t),delta=y-last;last=y;const motion=Math.abs(delta)/80,activity=clamp((1-Math.exp(-motion*1.9))*.8),direction=t<33?1:-1;
     const position=HolyMindSoundScenes.position(y,layout);graph.update({...position,enabled:true,ambience:amb,flow,activity,direction},t);
     for(const tap of taps)if(Math.abs(t-tap.at)<.04&&withTaps){const d=HolyMindTimbres.render(tap.id),b=ctx.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.004);g.gain.setTargetAtTime(0,t+d.duration*.83,.035);s.connect(g);g.connect(master);s.start(t+.002);graph.duck(t);}
     if(flow&&i===120)graph.settle(false,t);
    }
    master.gain.setTargetAtTime(0,39.3,.08);
    const rendered=await ctx.startRendering(),channels=[];let sum=0,peak=0,finite=true;
    for(let ch=0;ch<2;ch++){const d=rendered.getChannelData(ch),bytes=new Uint8Array(d.buffer);let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));channels.push(btoa(text));for(const v of d){finite=finite&&Number.isFinite(v);sum+=v*v;peak=Math.max(peak,Math.abs(v));}}
    const end=Math.max(...Array.from(rendered.getChannelData(0).slice(-256),Math.abs));return {sr,duration,channels,finite,peak,rms:Math.sqrt(sum/(sr*duration*2)),end};
   },mode);
   const names={taps:'taps-only',bed:'field-and-taps',full:'full-journey','field-only':'quiet-field','scroll-only':'reversible-current'},channels=result.channels.map(s=>new Float32Array(Uint8Array.from(Buffer.from(s,'base64')).buffer));
   const frames=channels[0].length,b=Buffer.alloc(44+frames*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(result.sr,24);b.writeUInt32LE(result.sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);
   for(let i=0;i<frames;i++)for(let c=0;c<2;c++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),44+i*4+c*2);
   const file=names[mode]+'.wav';fs.writeFileSync(path.join(out,file),b);delete result.channels;manifest.push({mode,file,...result,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});console.log(mode,JSON.stringify(result));
  }
  const checks=manifest.map(r=>({name:r.file,pass:r.finite&&r.peak<.50&&r.rms>.0001&&r.end<.001}));checks.push({name:'full-versus-unchanged-tap-baseline',pass:manifest.find(x=>x.mode==='full').peak<=manifest.find(x=>x.mode==='taps').peak*1.05});checks.push({name:'approved-v13-instrument-preserved',pass:preservation.pass});
  fs.writeFileSync(out+'/manifest.json',JSON.stringify({version:'full-current-v14',duration:40,masterGain:.48,normalization:'None; same tap timing, master gain and compressor for all comparisons',renderer:'Production HolyMindSoundScenes + HolyMindSoundscape through OfflineAudioContext',preservation,presets:manifest,checks,limitations:'Illustrative scripted gestures, not a recording of an iPhone speaker or a subjective listening study'},null,2));
  fs.writeFileSync(out+'/README.md','# Quiet Current — the complete journey\n\nFive forty-second comparisons/stems rendered through the shipped scene-mapping function and Web Audio instrument. Identical tap timings, 0.48 master gain and compression; no independent normalization. Source-authored synthesis, no stock samples, actual recordings or generative-audio model. Runtime does not fetch these previews. The accepted v13 default instrument is separately compared sample by sample against the original graph.\n\nThis is an illustrative score from Hero to Footer and back, not a physical-device recording or a claim of subjective pleasantness.\n');
  if(checks.some(c=>!c.pass))throw Error('Preview checks failed');console.log('Whole-journey previews and preservation comparison passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
