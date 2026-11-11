/* Export the production instrument, not a separately invented soundtrack.
 * Every comparison uses identical gesture timing, taps, master gain and compression.
 */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto');
(async()=>{
 const out=path.resolve(__dirname,'../assets/audio/soundscape-v13');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined});
 try{
  const page=await browser.newPage();await page.goto(process.env.TEST_URL||'http://127.0.0.1:8776/',{waitUntil:'networkidle'});
  const manifest=[];
  for(const mode of ['taps','bed','full','field-only','scroll-only']){
   const result=await page.evaluate(async mode=>{
    const sr=24000,duration=22,ctx=new OfflineAudioContext(2,sr*duration,sr),master=ctx.createGain();master.gain.value=.48;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=14;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.14;master.connect(comp);comp.connect(ctx.destination);
    const graph=HolyMindSoundscape.create(ctx,master),clamp=n=>Math.max(0,Math.min(1,n)),ease=t=>t*t*t*(t*(t*6-15)+10);
    const withTaps=['taps','bed','full'].includes(mode),amb=['bed','full','field-only'].includes(mode),flow=['full','scroll-only'].includes(mode);
    const taps=[{at:.6,id:'neural-discharge'},{at:7.5,id:'cognitive-reframe'},{at:16.2,id:'goal-lock'}];
    for(let i=0;i<=220;i++){
     const t=i*.1;let activity=0,p=0,direction=1,morph=.1;
     if(t>=2.5&&t<5.8){activity=.22+.28*Math.sin((t-2.5)/3.3*Math.PI);morph=.34;}
     if(t>=8.5&&t<14){const u=clamp((t-8.5)/5.2);p=ease(u);activity=.22+.48*Math.sin(u*Math.PI);morph=.66+.34*p;}
     else if(t>=14&&t<17){p=1;morph=1;}
     if(t>=17&&t<=20.8){const u=clamp((t-17)/3.8);p=1-ease(u);direction=-1;activity=.20+.43*Math.sin(u*Math.PI);morph=.66+.34*p;}
     graph.update({enabled:true,scope:1,ambience:amb,flow,activity,progress:p,direction,morph},t);
     for(const tap of taps){if(Math.abs(t-tap.at)<.04&&withTaps){const d=HolyMindTimbres.render(tap.id),b=ctx.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=b;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(1,t+.004);g.gain.setTargetAtTime(0,t+d.duration*.83,.035);source.connect(g);g.connect(master);source.start(t+.002);graph.duck(t);}}
     if(flow&&Math.abs(t-13.9)<.04)graph.settle(false,t);
     if(flow&&Math.abs(t-20.8)<.04)graph.settle(true,t);
    }
    master.gain.setTargetAtTime(0,21.2,.1);
    const rendered=await ctx.startRendering(),channels=[];let sum=0,peak=0,finite=true,maxStep=0;
    for(let ch=0;ch<2;ch++){const d=rendered.getChannelData(ch),bytes=new Uint8Array(d.buffer);let text='';for(let i=0;i<bytes.length;i+=16384)text+=String.fromCharCode(...bytes.subarray(i,i+16384));channels.push(btoa(text));for(let i=0;i<d.length;i++){finite=finite&&Number.isFinite(d[i]);sum+=d[i]*d[i];peak=Math.max(peak,Math.abs(d[i]));if(i)maxStep=Math.max(maxStep,Math.abs(d[i]-d[i-1]));}}
    const end=Math.max(...Array.from(rendered.getChannelData(0).slice(-256),Math.abs));return {sr,duration,channels,finite,peak,rms:Math.sqrt(sum/(sr*duration*2)),maxStep,end};
   },mode);
   const names={taps:'taps-only',bed:'field-and-taps',full:'full-journey','field-only':'quiet-field','scroll-only':'reversible-current'},channels=result.channels.map(s=>new Float32Array(Uint8Array.from(Buffer.from(s,'base64')).buffer));
   const frames=channels[0].length,b=Buffer.alloc(44+frames*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(result.sr,24);b.writeUInt32LE(result.sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);
   for(let i=0;i<frames;i++)for(let c=0;c<2;c++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),44+i*4+c*2);
   const file=names[mode]+'.wav';fs.writeFileSync(path.join(out,file),b);delete result.channels;
   manifest.push({mode,file,...result,bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')});console.log(mode,JSON.stringify(result));
  }
  // The unchanged tap baseline includes the existing compressor's makeup gain.
  // Bound below clipping and compare the added mix against that same baseline.
  const checks=manifest.map(r=>({file:r.file,pass:r.finite&&r.peak<.50&&r.rms>.0001&&r.end<.001}));
  checks.push({file:'full-versus-baseline',pass:manifest.find(x=>x.mode==='full').peak<=manifest.find(x=>x.mode==='taps').peak*1.05});
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:'soundscape-v13',duration:22,masterGain:.48,normalization:'None; identical master gain and compressor in every comparison',renderer:'Production HolyMindSoundscape graph via OfflineAudioContext',originalTaps:'Electric v12 unchanged',timeline:[{at:.6,event:'tap'},{at:2.5,event:'scroll forward'},{at:5.8,event:'pause'},{at:7.5,event:'tap'},{at:8.5,event:'assembly unfold'},{at:13.9,event:'new current settle'},{at:16.2,event:'tap'},{at:17,event:'reverse / reconnect'},{at:21.2,event:'fade'}],presets:manifest,checks},null,2));
  fs.writeFileSync(path.join(out,'README.md'),'# Quiet Current — controlled listening previews\n\nThe three comparisons use the production Web Audio graph, three identical Electric v12 taps, a fixed 22-second down/pause/up gesture score, 0.48 master gain and the same compressor. They are not separately normalized. The two isolated stems use the same level. No generative model, recording, external sound pack or new runtime library is used.\n\nThese are illustrative scripted gestures, not microphone recordings from an iPhone or proof of subjective sound quality. Browser output may differ slightly across engines and devices. Run scripts/render-soundscape.cjs with the preview server running to reproduce them.\n');
  if(checks.some(c=>!c.pass))throw Error('Audio validation failed');console.log('Five actual-graph previews exported; all finite, nonzero, bounded and faded.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
