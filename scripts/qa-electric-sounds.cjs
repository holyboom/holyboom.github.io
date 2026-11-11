/* Deterministic DSP validation and level-matched before/after audition assets. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const synth=require('../holymind-timbres.js'),root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/audio/electric-v12');
function wav(a,sr){const b=Buffer.alloc(44+a.length*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(a.length*2,40);for(let i=0;i<a.length;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,a[i]))*32767),44+i*2);return b;}
function readWav(filename){const b=fs.readFileSync(filename);const sr=b.readUInt32LE(24);let offset=12;while(offset+8<b.length){const size=b.readUInt32LE(offset+4);if(b.toString('ascii',offset,offset+4)==='data'){const a=new Float32Array(size/2);for(let i=0;i<a.length;i++)a[i]=b.readInt16LE(offset+8+i*2)/32768;return {samples:a,sampleRate:sr};}offset+=8+size+(size%2);}throw Error('No PCM data');}
function stats(a){let peak=0,sum=0,dc=0,step=0;for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));sum+=a[i]**2;dc+=a[i];if(i)step=Math.max(step,Math.abs(a[i]-a[i-1]));}return {peak,rms:Math.sqrt(sum/a.length),dc:dc/a.length,maxSampleStep:step};}
function resample(a,from,to){if(from===to)return a;const b=new Float32Array(Math.round(a.length*to/from));for(let i=0;i<b.length;i++){const x=i*from/to,j=Math.floor(x),t=x-j;b[i]=(a[j]||0)*(1-t)+(a[j+1]||0)*t;}return b;}
function concat(parts){const a=new Float32Array(parts.reduce((n,p)=>n+p.length,0));let k=0;for(const p of parts){a.set(p,k);k+=p.length;}return a;}
const check=(name,pass,details={})=>{checks.push({name,pass,...details});if(!pass)console.error(name,details);};
const checks=[],metrics=[],hashes=[];
check('exactly-fourteen-presets',synth.presets.length===14);
check('electric-character-and-version',synth.character==='digital-electric'&&synth.version==='electric-v12');
for(const p of synth.presets){const d=synth.render(p.id),again=synth.render(p.id),s=stats(d.samples),h=crypto.createHash('sha256').update(Buffer.from(d.samples.buffer)).digest('hex');hashes.push(h);
 check(p.id+'-finite-bounded',d.samples.every(Number.isFinite)&&s.peak<=.431&&s.peak>.1&&s.rms>.035&&s.rms<.075&&Math.abs(s.dc)<.001,{metrics:s});
 check(p.id+'-silent-endpoints',d.samples[0]===0&&d.samples.at(-1)===0);
 check(p.id+'-deterministic',Buffer.from(d.samples.buffer).equals(Buffer.from(again.samples.buffer)));
 check(p.id+'-correct-rate-duration',d.sampleRate===32000&&d.duration>=.5&&d.duration<=1.1);
 const file=path.join(dir,p.id+'.wav');check(p.id+'-published-file-matches-renderer',fs.readFileSync(file).equals(wav(d.samples,d.sampleRate)));
 const old=readWav(path.join(root,'assets/audio',p.id+'.wav'));const changed=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/audio',p.id+'.wav'))).digest('hex');
 check(p.id+'-different-from-v11',changed);metrics.push({id:p.id,name:p.name,tag:p.tag,duration:d.duration,...s,sha256:h,oldDuration:old.samples.length/old.sampleRate});}
check('fourteen-unique-waveforms',new Set(hashes).size===14);
for(const sr of [16000,24000,44100,48000]){const d=synth.render('neural-discharge',sr);check('portable-sample-rate-'+sr,d.samples.every(Number.isFinite)&&d.sampleRate===sr&&stats(d.samples).peak<=.431);}
try{synth.render('neural-discharge',0);check('invalid-rate-rejected',false);}catch(e){check('invalid-rate-rejected',e instanceof RangeError);}
const sr=synth.sampleRate,old=readWav(path.join(root,'assets/audio/neural-discharge.wav')),old32=resample(old.samples,old.sampleRate,sr),next=synth.render('neural-discharge').samples;
const matched=a=>{const s=stats(a),g=Math.min(.05/s.rms,.40/s.peak);return Float32Array.from(a,x=>x*g);};
const silence=t=>new Float32Array(Math.round(sr*t));
const compare=concat([silence(.18),matched(old32),silence(.55),matched(next),silence(.22)]);
fs.writeFileSync(path.join(dir,'before-after.wav'),wav(compare,sr));
const chosen=['neural-discharge','signal-fork','holy-prime'];
const preview=concat(chosen.flatMap(id=>[Float32Array.from(synth.render(id).samples,x=>x*.72),silence(.28)]));fs.writeFileSync(path.join(dir,'signature-preview.wav'),wav(preview,sr));
fs.writeFileSync(path.join(dir,'audition.json'),JSON.stringify({version:synth.version,beforeAfter:{oldFirst:true,old:'resonance-v11 / neural-discharge',new:'electric-v12 / neural-discharge',matchedRms:.05},signaturePreview:chosen},null,2));
const failed=checks.filter(c=>!c.pass);fs.mkdirSync(path.join(root,'docs/evidence/electric-v12'),{recursive:true});fs.writeFileSync(path.join(root,'docs/evidence/electric-v12/audio-validation.json'),JSON.stringify({version:synth.version,checks,failed,metrics,physicalListeningTest:false},null,2));
console.log(JSON.stringify({checks:checks.length,failed:failed.length,unique:new Set(hashes).size,maxPeak:Math.max(...metrics.map(m=>m.peak)),rmsRange:[Math.min(...metrics.map(m=>m.rms)),Math.max(...metrics.map(m=>m.rms))],beforeAfterSeconds:compare.length/sr,previewSeconds:preview.length/sr}));if(failed.length)process.exitCode=1;
