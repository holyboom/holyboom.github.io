const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),dir=root+'/assets/audio/afterglow-v23',oldDir=root+'/assets/audio/grand-boom-v22';
const model=require('../boom-particles.js'),audio=require('../boom-audio.js'),meta=JSON.parse(fs.readFileSync(dir+'/bank.json')),oldmeta=JSON.parse(fs.readFileSync(oldDir+'/bank.json'));
audio.loadBank(fs.readFileSync(dir+'/fireworks.pcm'),meta);
const sandbox={module:{exports:{}},Math,Object,Number,Array};sandbox.globalThis=sandbox;vm.runInNewContext(cp.execFileSync('git',['show','9f74d18:boom-particles.js'],{encoding:'utf8'}),sandbox);const old=sandbox.module.exports;
const checks=[],rows=[];const check=(name,pass,data={})=>checks.push({name,pass:!!pass,...data});
const rms=a=>Math.sqrt(a.reduce((s,x)=>s+x*x,0)/Math.max(1,a.length));
for(const r of meta.clips){const a=audio.render(r.kind,r.index).samples;check('finite-fade-'+r.key,a.every(Number.isFinite)&&Math.max(...a)<.60&&a[0]===0&&a.at(-1)===0);if(r.kind==='burst'||r.kind==='glitter'){
 const before=oldmeta.clips.find(x=>x.key===r.key),tail=a.slice(Math.round(before.duration*24000),Math.round(Math.min(r.duration-.25,before.duration+.65)*24000));
 check('audible-extended-tail-'+r.key,r.duration>=before.duration*1.4&&rms(tail)>.00008,{before:before.duration,after:r.duration,extendedRms:rms(tail)});
 if(r.kind==='burst'){const raw=fs.readFileSync(oldDir+'/fireworks.pcm');let delta=0;for(let i=0;i<.18*24000;i++)delta=Math.max(delta,Math.abs(a[i]-raw.readInt16LE((before.offset+i)*2)/32768));check('accepted-attack-preserved-'+r.index,delta<.00004,{maxDifference:delta});}
 const tailValues=[.25,.5,.75].map(f=>({remaining:f,rms:rms(a.slice(Math.max(0,a.length-Math.round((f+.12)*24000)),a.length-Math.round(f*24000)))}));rows.push({key:r.key,duration:r.duration,tailValues});
}}
check('finale-longest-burst',meta.clips.filter(c=>c.kind==='burst').every(c=>c.duration<=audio.render('burst',4).duration));
check('all-five-bursts-unique',new Set(meta.clips.filter(c=>c.kind==='burst').map(c=>crypto.createHash('sha256').update(fs.readFileSync(dir+'/'+c.file)).digest('hex'))).size===5);
check('bank-hash',crypto.createHash('sha256').update(fs.readFileSync(dir+'/fireworks.pcm')).digest('hex')===meta.sha256);
check('same-source-provenance',JSON.stringify(meta.sources)===JSON.stringify(oldmeta.sources));
const box={width:390,height:844,header:73,wordLeft:25,wordTop:450,wordWidth:280,anchor:{x:292,y:520}};
check('glitter-increased',model.particleCount===259&&model.bursts.reduce((n,b)=>n+b.dust.length,0)===91);
check('large-small-order-unchanged',JSON.stringify(model.definitions.map(x=>x.size))===JSON.stringify(old.definitions.map(x=>x.size)));
for(const t of [.2,.4,.6,.8,.87,.93,.97,.995]){const a=model.frame(t,box),b=model.frame(t,box);check('deterministic-'+t,JSON.stringify(a)===JSON.stringify(b)&&a.particles.every(p=>[p.x,p.y,p.alpha].every(Number.isFinite)));}
const final=model.frame(.93,box),before=old.frame(.93,box),fall=final.particles.filter(p=>p.id.startsWith('4:dust:')&&p.role==='falling-glitter');
check('finale-has-falling-trails',fall.length>=18&&fall.every(p=>p.shape==='fall'&&p.dy>0));
check('substantial-final-fall',fall.reduce((n,p)=>n+p.fall,0)/fall.length>35,{meanFall:fall.reduce((n,p)=>n+p.fall,0)/fall.length});
check('late-sparkle-lingers',final.particles.filter(p=>p.alpha>.10).length>before.particles.filter(p=>p.alpha>.10).length,{before:before.particles.filter(p=>p.alpha>.10).length,after:final.particles.filter(p=>p.alpha>.10).length});
const f=Array.from({length:30},(_,i)=>model.frame(.70+i*.009,box).particles.find(p=>p.id==='4:dust:3')?.alpha||0);let turns=0;for(let i=1;i<f.length-1;i++)if(f[i]>f[i-1]&&f[i]>f[i+1])turns++;
check('twinkle-multiple-peaks',turns>=2,{peaks:turns});
check('endpoints-fully-clear',[0,1].every(t=>model.frame(t,box).particles.length===0));
const output={release:'afterglow-v23',checks,failed:checks.filter(c=>!c.pass),rows,particleCount:model.particleCount,source:'Production PCM and deterministic geometry, compared with v22'};
fs.mkdirSync(root+'/docs/evidence/afterglow-v23',{recursive:true});fs.writeFileSync(root+'/docs/evidence/afterglow-v23/model-audio.json',JSON.stringify(output,null,2));console.log(JSON.stringify({count:checks.length,failed:output.failed,rows}));if(output.failed.length)process.exitCode=1;
