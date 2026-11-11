/* Offline export through the exact shipped sampled piano, envelopes and room. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto');
(async()=>{
 const out=path.resolve(__dirname,'../assets/audio/scroll-score-v17');fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined});
 try{const p=await b.newPage();await p.goto(process.env.TEST_URL||'http://127.0.0.1:8780/',{waitUntil:'networkidle'});await p.waitForFunction(()=>HolyMindCueTimbres.snapshot().ready);
 const rows=[];
 for(const mode of ['score','pause-resume','tail']){
 const r=await p.evaluate(async mode=>{
  const sr=24000,bpm=88,spb=60/bpm,duration=mode==='score'?44:mode==='pause-resume'?24:8;
  const c=new OfflineAudioContext(2,sr*duration,sr),master=c.createGain();master.gain.value=.48;const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=14;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.14;master.connect(comp);comp.connect(c.destination);
  const music=HolyMindScrollScore.create(c,master,{offline:true});
  if(mode==='score')for(let beat=0;beat<56;beat++)music.scheduleBeat(beat,.25+beat*spb,bpm);
  if(mode==='pause-resume'){
   for(let beat=0;beat<8;beat++)music.scheduleBeat(beat,.25+beat*spb,bpm);
   for(let beat=8;beat<24;beat++)music.scheduleBeat(beat,8.5+(beat-8)*spb,bpm);
  }
  if(mode==='tail')music.note({midi:72,duration:1,velocity:77,hand:'melody'},.25,spb);
  const buffer=await c.startRendering(),channels=[],bins=[];let peak=0,energy=0,finite=true;
  for(let ch=0;ch<2;ch++){const d=buffer.getChannelData(ch);let s='';const bytes=new Uint8Array(d.buffer);for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));channels.push(btoa(s));for(const x of d){peak=Math.max(peak,Math.abs(x));energy+=x*x;finite=finite&&Number.isFinite(x);}}
  const data=buffer.getChannelData(0);for(let start=0;start<duration;start+=.25){let e=0;const a=Math.round(start*sr),end=Math.min(data.length,a+sr/4);for(let j=a;j<end;j++)e+=data[j]*data[j];bins.push({at:Number(start.toFixed(2)),rms:Math.sqrt(e/Math.max(1,end-a))});}
  return {sr,duration,channels,peak,rms:Math.sqrt(energy/(sr*duration*2)),finite,bins,notes:music.snapshot().played};
 },mode);
 const cs=r.channels.map(x=>new Float32Array(Uint8Array.from(Buffer.from(x,'base64')).buffer)),n=cs[0].length,wav=Buffer.alloc(44+n*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(r.sr,24);wav.writeUInt32LE(r.sr*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*4,40);
 for(let i=0;i<n;i++)for(let ch=0;ch<2;ch++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,cs[ch][i]))*32767),44+i*4+ch*2);
 const name=mode==='score'?'score-preview.wav':mode+'.wav';fs.writeFileSync(out+'/'+name,wav);delete r.channels;rows.push({mode,file:name,...r,sha256:crypto.createHash('sha256').update(wav).digest('hex')});console.log(mode,JSON.stringify({peak:r.peak,rms:r.rms,notes:r.notes,finite:r.finite,tail:r.bins.filter(x=>x.at>=1&&x.at<=3.5)}));
 }
 const checks=rows.map(r=>({name:r.mode+'-bounded-signal',pass:r.finite&&r.peak<.80&&r.rms>.0001&&r.bins.at(-1).rms<.0001}));
 const tail=rows.find(x=>x.mode==='tail');checks.push({name:'tail-audible-after-one-second',pass:tail.bins.find(x=>x.at===1).rms>.0002});checks.push({name:'tail-gentle-decay-not-hard-gate',pass:tail.bins.find(x=>x.at===1.5).rms>tail.bins.find(x=>x.at===2.5).rms&&tail.bins.find(x=>x.at===2).rms>.000001});checks.push({name:'all-notes-rendered',pass:rows[0].notes===204});
 fs.writeFileSync(out+'/score-manifest.json',JSON.stringify({version:'scroll-score-v17',title:'Mozart K.545 opening — HolyMind arrangement',scoreLicense:'CC BY-SA 3.0',sampleLicense:'CC BY 3.0',renderer:'Production HolyMindScrollScore in OfflineAudioContext; same note envelopes, recorded samples and room',masterGain:.48,bpm:88,normalization:'None',previews:rows,checks,limitations:'Scripted rendering, not a physical iPhone speaker recording or subjective listening certification'},null,2));
 if(checks.some(x=>!x.pass))throw Error('Score render validation failed');console.log('Offline score and fade gates passed:',checks.length);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
