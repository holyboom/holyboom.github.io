const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),audio=require('../boom-audio.js'),dir=root+'/assets/audio/grand-boom-v22',meta=JSON.parse(fs.readFileSync(dir+'/bank.json')),raw=fs.readFileSync(dir+'/fireworks.pcm');audio.loadBank(raw,meta);
const box={module:{exports:{}},Float32Array,Math,Object,Number,RangeError};box.globalThis=box;vm.runInNewContext(cp.execFileSync('git',['show','b22fbce694d4d880574b0161b2a8331014a2715a:boom-audio.js'],{encoding:'utf8'}),box);const old=box.module.exports;
function spectrum(a,sr){const N=2048,re=new Float64Array(N),im=new Float64Array(N);let energy=0,weighted=0,low=0,high=0;
 for(let start=0;start+N<=a.length;start+=N){for(let j=0;j<N;j++){re[j]=a[start+j]*(.5-.5*Math.cos(2*Math.PI*j/(N-1)));im[j]=0;}
  for(let i=1,j=0;i<N;i++){let bit=N>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
  for(let len=2;len<=N;len<<=1){const angle=-2*Math.PI/len,wr0=Math.cos(angle),wi0=Math.sin(angle);for(let i=0;i<N;i+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){const x=i+j,y=x+len/2,tr=wr*re[y]-wi*im[y],ti=wr*im[y]+wi*re[y];re[y]=re[x]-tr;im[y]=im[x]-ti;re[x]+=tr;im[x]+=ti;const w=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=w;}}}
  for(let k=1;k<N/2;k++){const f=k*sr/N,p=re[k]*re[k]+im[k]*im[k];energy+=p;weighted+=p*f;if(f<600)low+=p;if(f>=1800)high+=p;}
 }
 return {centroidHz:weighted/energy,below600:low/energy,above1800:high/energy};
}
const checks=[],rows=[];function check(name,pass,detail={}){checks.push({name,pass:!!pass,...detail});}
for(const row of meta.clips){const d=audio.render(row.kind,row.index),a=d.samples;let peak=0,sum=0;for(const x of a){peak=Math.max(peak,Math.abs(x));sum+=x*x;}const sig=spectrum(a,d.sampleRate);rows.push({key:row.key,peak,rms:Math.sqrt(sum/a.length),...sig});check('finite-bounded-faded-'+row.key,a.every(Number.isFinite)&&peak<=.481&&a[0]===0&&a.at(-1)===0);}
const before=spectrum(old.render('burst',2,[],24000).samples,24000),after=rows.filter(r=>r.key.startsWith('burst:'));
check('five-real-source-bursts',after.length===5&&new Set(after.map(r=>fs.readFileSync(dir+'/'+r.key.replace(':','-')+'.wav').toString('base64'))).size===5);
check('brighter-than-rejected-synth',after.every(r=>r.centroidHz>before.centroidHz*1.3),{before,after});
check('no-low-thud-dominance',after.every(r=>r.below600<.15),{values:after.map(r=>({key:r.key,low:r.below600}))});
check('manifest-bank-hash',crypto.createHash('sha256').update(raw).digest('hex')===meta.sha256);
check('source-provenance',meta.sources.length===3&&meta.sources.every(r=>r.license==='CC0 1.0'&&r.page.startsWith('https://freesound.org/people/')&&crypto.createHash('sha256').update(fs.readFileSync(dir+'/source/'+r.name+'.mp3')).digest('hex')===r.sha256));
const out={release:'grand-boom-v22',checks,failed:checks.filter(c=>!c.pass),rows,oldBurstSpectrum:before,method:'Hann-windowed 2048-point FFT, energy-weighted spectral centroid of edited source PCM. Spectrum is not a listener-quality or hearing-safety certification.'};fs.mkdirSync(root+'/docs/evidence/grand-boom-v22',{recursive:true});fs.writeFileSync(root+'/docs/evidence/grand-boom-v22/audio-signals.json',JSON.stringify(out,null,2));console.log(JSON.stringify({checks:checks.length,failed:out.failed,before,bursts:after}));if(out.failed.length)process.exitCode=1;
