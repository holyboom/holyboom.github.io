/* Piano Moments v16. Real licensed grand-piano keys lead; section textures follow.
 * The sample bank is self-hosted and decoded as PCM without creating an AudioContext.
 * Piano recordings: Alexander Holm / Salamander Grand Piano / CC BY 3.0.
 * See assets/audio/piano-v16/ATTRIBUTION.md for sources, license and modifications. */
(function(root){
 'use strict';
 const SR=24000,FRAMES=144000,PITCHES=[45,48,54,57,60,66,69,72,75,78,81],TAU=Math.PI*2;
 const presets=[
 {id:'dock',name:'Piano arrival',duration:1.25},{id:'return',name:'A note returning',duration:1.05},
 {id:'phase',name:'Thought into harmony',duration:1.00},{id:'layer',name:'Keys unfolding',duration:.95},
 {id:'select',name:'One deliberate key',duration:.62},{id:'switch',name:'A new direction',duration:.86},
 {id:'open',name:'Space opens',duration:.98},{id:'close',name:'A gentle release',duration:.72},
 {id:'confirm',name:'A grounded resolution',duration:1.08},{id:'filter',name:'Clarity in one note',duration:.58}
 ];
 const profiles=[
 {id:'hero',label:'Neural origin',notes:[69,76],texture:'pulse',meaning:'A clear key; a small spark wakes behind it.',cutoff:4900,room:.075,length:1.18},
 {id:'orbit',label:'Connected intelligence',notes:[64,69,76],texture:'air',meaning:'Open piano intervals with a light orbiting shimmer.',cutoff:5200,room:.14,length:1.34},
 {id:'ribbon',label:'Signal crossing',notes:[69,72],texture:'filament',meaning:'A pair of keys carried by a thin electrical thread.',cutoff:5100,room:.08,length:1.08},
 {id:'assembly',label:'System unfolding',notes:[57,64,69],texture:'join',meaning:'Separated keys align; a quiet circuit settles into place.',cutoff:4400,room:.06,length:1.22},
 {id:'workbench',label:'Working intention',notes:[60,64],texture:'focus',meaning:'Close, dry piano with a precise, restrained pulse.',cutoff:3900,room:.045,length:.97},
 {id:'instrument',label:'Capability constellation',notes:[72,76],texture:'particles',meaning:'Upper keys with fine digital particles between notes.',cutoff:5400,room:.095,length:1.13},
 {id:'gallery',label:'Evidence atlas',notes:[69,72],texture:'etch',meaning:'A single clear piano gesture and a fine etched texture.',cutoff:4200,room:.055,length:1.02},
 {id:'services',label:'Applied intelligence',notes:[57,64,72],texture:'weight',meaning:'A grounded open interval with a low electrical body.',cutoff:4400,room:.08,length:1.25},
 {id:'about',label:'The human behind the mind',notes:[57,64],texture:'warmth',meaning:'Warm, softened piano; almost no electronic edge.',cutoff:2700,room:.16,length:1.40},
 {id:'contact',label:'The next possibility',notes:[64,69,72],texture:'opening',meaning:'An opening piano phrase with a gentle luminous tail.',cutoff:4600,room:.18,length:1.45},
 {id:'footer',label:'A quiet return',notes:[64,57],texture:'warmth',meaning:'Two soft keys gather the journey, without a fanfare.',cutoff:2900,room:.12,length:1.18}
 ];
 const map=Object.fromEntries(presets.map(p=>[p.id,p])),scenes=Object.fromEntries(profiles.map(p=>[p.id,p]));
 const alias={neural:'hero',system:'workbench',skills:'instrument',signature:'about',portal:'contact',delivery:'services'};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));let bank=null,loadPromise=null,status='unloaded',error=null,lastAttempt=0;
 const bankURL=typeof document!=='undefined'?new URL('assets/audio/scroll-score-v17/keys.pcm',document.currentScript?.src||location.href).href:null;
 function loadBank(data){
  const bytes=data instanceof ArrayBuffer?new Uint8Array(data):new Uint8Array(data.buffer,data.byteOffset,data.byteLength);
  if(bytes.length!==PITCHES.length*FRAMES*2)throw new RangeError('Invalid piano bank size');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);bank=PITCHES.map((midi,k)=>{const samples=new Float32Array(FRAMES);for(let i=0;i<FRAMES;i++)samples[i]=view.getInt16((k*FRAMES+i)*2,true)/32768;return {midi,samples};});status='ready';error=null;return true;
 }
 function prepare(){
  if(bank)return Promise.resolve(true);if(loadPromise)return loadPromise;if(!bankURL)return Promise.resolve(false);
  if(status==='failed'&&Date.now()-lastAttempt<2500)return Promise.resolve(false);lastAttempt=Date.now();status='loading';
  loadPromise=fetch(bankURL,{credentials:'same-origin',priority:'low'}).then(r=>{if(!r.ok)throw Error('Piano bank '+r.status);return r.arrayBuffer();}).then(loadBank).catch(e=>{status='failed';error=e.message;return false;}).finally(()=>{loadPromise=null;});return loadPromise;
 }
 function resolveScene(key='',kind='action',scene='hero'){
  if(kind==='arrival'){scene=String(key).split(':')[1]||scene;}
  else if(kind==='layer'||String(key).startsWith('layer'))scene='assembly';
  else if(kind==='phase')scene='orbit';
  else if(/^(scenario|step|brief|copy)/.test(key))scene='workbench';
  else if(String(key).startsWith('skill-select'))scene='instrument';
  else if(/^(filter|gallery|search)/.test(key))scene='gallery';
  scene=alias[scene]||scene;return scenes[scene]?scene:'hero';
 }
 function render(id,variant=0,sampleRate=SR,options={}){
  if(!bank)throw new Error('Piano samples are not loaded');const p=map[id];if(!p)throw new RangeError('Unknown cue');
  if(!Number.isFinite(sampleRate)||sampleRate<16000||sampleRate>96000)throw new RangeError('Invalid sample rate');
  const v=clamp(Math.round(Number(variant)||0),0,5),scene=resolveScene(options.key,options.kind,options.scene),profile=scenes[scene];
  const reverse=id==='return'||id==='close';let notes=[...profile.notes],step=.085;
  if(id==='return')notes.reverse();
  if(id==='select'||id==='filter')notes=[notes[v%notes.length]];
  else if(id==='phase')notes=[[60,64],[64,69],[67,69]][v%3];
  else if(id==='layer')notes=[[57,64],[60,69],[64,72]][v%3];
  else if(id==='switch')notes=[notes[0],notes.at(-1)];
  else if(id==='open')notes=[notes[0],notes.at(-1)];
  else if(id==='close')notes=[notes[0]];
  else if(id==='confirm')notes=[57,64,69];
  if(Array.isArray(options.harmony)&&options.harmony.length){const tones=options.harmony.map(n=>n<60?n+12:n);notes=notes.map(n=>tones.reduce((a,b)=>Math.abs(b-n)<Math.abs(a-n)?b:a));notes=[...new Set(notes)];}
  if(scene==='about')step=.125;if(id==='confirm')step=.045;
  const duration=(id==='dock'?profile.length:id==='return'?Math.min(1.25,profile.length*.88):p.duration)+1.65;
  const count=Math.ceil(duration*sampleRate),piano=new Float32Array(count),texture=new Float32Array(count);
  notes.forEach((midi,j)=>{
   const source=bank.reduce((a,b)=>Math.abs(b.midi-midi)<Math.abs(a.midi-midi)?b:a),rate=2**((midi-source.midi)/12)*SR/sampleRate,at=Math.round(j*step*sampleRate);
   const strength=(j===0?.88:.56)*((scene==='about'||scene==='footer')?.86:1),release=duration-j*step;
   for(let i=at;i<count;i++){const z=i-at,index=z*rate,k=Math.floor(index);if(k+1>=source.samples.length)break;const t=z/sampleRate;
    const sample=source.samples[k]+(source.samples[k+1]-source.samples[k])*(index-k);
    const env=Math.min(1,t/.0018,Math.max(0,(release-t)/1.25));piano[i]+=sample*strength*env;
   }
  });
  // Preserve recorded hammer and string decay; soften only the top end by scene.
  const lp=1-Math.exp(-TAU*profile.cutoff/sampleRate);let filtered=0;
  for(let i=0;i<count;i++){filtered+=lp*(piano[i]-filtered);piano[i]=filtered;}
  const dry=piano.slice();for(const [time,gain] of [[.041,profile.room],[.079,profile.room*.55],[.127,profile.room*.25]]){const d=Math.round(time*sampleRate);for(let i=d;i<count;i++)piano[i]+=dry[i-d]*gain;}
  let seed=(0x5049414e+profiles.indexOf(profile)*7919+v*17)>>>0,fast=0,slow=0;
  const textureGain={air:.075,filament:.065,join:.055,focus:.045,particles:.075,etch:.042,weight:.05,warmth:.025,opening:.065,pulse:.06}[profile.texture];
  for(let i=0;i<count;i++){
   const t=i/sampleRate,u=t/duration;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
   const noise=(seed>>>0)/2147483648-1;fast+=.18*(noise-fast);slow+=.035*(fast-slow);
   const env=Math.sin(Math.PI*clamp((t-.025)/(duration*.8),0,1))**2*Math.exp(-u*4.8);
   let detail=0;
   if(['air','opening'].includes(profile.texture))detail=(Math.sin(TAU*880*t)+.35*Math.sin(TAU*1320*t))*.3+(fast-slow)*.3;
   else if(['warmth','weight'].includes(profile.texture))detail=Math.sin(TAU*110*t)*.42+(fast-slow)*.10;
   else if(profile.texture==='join'||profile.texture==='focus'){const z=t-.12;detail=(fast-slow)*Math.exp(-Math.max(0,z)*35)*(z>0?1:0)+Math.sin(TAU*220*t)*.16;}
   else if(profile.texture==='particles'){const grains=(.5+.5*Math.sin(TAU*13*t))**8;detail=(fast-slow)*grains+.12*Math.sin(TAU*1320*t);}
   else detail=(fast-slow)*.8+Math.sin(TAU*(reverse?330:440)*t+.1*Math.sin(t*35))*.15;
   texture[i]=detail*env*textureGain;
  }
  let pEnergy=0,tEnergy=0;for(let i=0;i<count;i++){pEnergy+=piano[i]**2;tEnergy+=texture[i]**2;}
  const limit=scene==='about'?.035:scene==='footer'?.045:['join','focus','etch'].includes(profile.texture)?.065:.095,textureScale=Math.min(14,Math.sqrt(pEnergy/Math.max(1e-12,tEnergy))*limit);
  const out=new Float32Array(count);let peak=0,sum=0;
  for(let i=0;i<count;i++){const fade=Math.min(1,(count-1-i)/(sampleRate*.5));out[i]=(piano[i]+texture[i]*textureScale)*Math.max(0,fade);peak=Math.max(peak,Math.abs(out[i]));sum+=out[i]**2;}
  const gain=Math.min(1.20,.32/Math.max(.001,peak));for(let i=0;i<count;i++)out[i]*=gain;
  return {id,name:p.name,variant:v,scene,notes,texture:profile.texture,source:'recorded-piano + authored texture',samples:out,sampleRate,duration:count/sampleRate,textureRmsRatio:Math.sqrt(tEnergy/Math.max(pEnergy,1e-12))*textureScale,gain};
 }
 const api=Object.freeze({version:'scroll-score-v17',presets:Object.freeze(presets),profiles:Object.freeze(profiles),render,resolveScene,loadBank,prepare,key(midi){if(!bank)return null;const v=bank.reduce((a,b)=>Math.abs(b.midi-midi)<Math.abs(a.midi-midi)?b:a);return {midi:v.midi,samples:v.samples,sampleRate:SR};},snapshot:()=>({status,error,ready:!!bank,notes:bank?.length||0,source:'Salamander Grand Piano / Alexander Holm / CC BY 3.0'})});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.HolyMindCueTimbres=api;prepare();}
})(globalThis);
