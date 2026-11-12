/* Grand Boom Afterglow v23: real CC0 firework recordings, self-hosted and prepared before scroll.
 * Sources/edits: assets/audio/afterglow-v23/ATTRIBUTION.md. No synthesized noise,
 * pitched oscillators or piano inside this bank. Mozart remains a separate instrument. */
(function(root){
 'use strict';
 const SR=24000,base=typeof document!=='undefined'?new URL('assets/audio/afterglow-v23/',document.currentScript?.src||location.href).href:null;
 const durations=Object.freeze({charge:.32,launch:1,burst:3.70,glitter:4.20,recall:.9,gather:.85,return:1,seal:.24});
 let bank=null,promise=null,status='unloaded',error=null,attempt=0;
 function loadBank(raw,meta){
  const bytes=raw instanceof ArrayBuffer?new Uint8Array(raw):new Uint8Array(raw.buffer,raw.byteOffset,raw.byteLength);
  if(!meta||meta.sampleRate!==SR||bytes.byteLength!==meta.bytes||!Array.isArray(meta.clips)||meta.clips.length!==24)throw new RangeError('Invalid recorded firework bank');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),loaded=new Map();
  for(const row of meta.clips){
   if(!Number.isInteger(row.offset)||!Number.isInteger(row.frames)||row.offset<0||row.frames<1||(row.offset+row.frames)*2>bytes.length)throw new RangeError('Invalid clip bounds');
   const samples=new Float32Array(row.frames);for(let i=0;i<row.frames;i++)samples[i]=view.getInt16((row.offset+i)*2,true)/32768;
   loaded.set(row.key,{...row,samples,sampleRate:SR,notes:[]});
  }
  bank=loaded;status='ready';error=null;return true;
 }
 function prepare(){
  if(bank)return Promise.resolve(true);if(promise)return promise;if(!base)return Promise.resolve(false);
  if(status==='failed'&&Date.now()-attempt<3000)return Promise.resolve(false);attempt=Date.now();status='loading';
  promise=Promise.all([fetch(base+'bank.json',{credentials:'same-origin'}).then(r=>{if(!r.ok)throw Error('Firework manifest '+r.status);return r.json();}),fetch(base+'fireworks.pcm',{credentials:'same-origin',priority:'low'}).then(r=>{if(!r.ok)throw Error('Firework samples '+r.status);return r.arrayBuffer();})]).then(([meta,data])=>loadBank(data,meta)).catch(e=>{status='failed';error=e.message;return false;}).finally(()=>{promise=null;});return promise;
 }
 function render(kind,index=0,harmony=[],sampleRate=SR){
  if(!bank)throw Error('Recorded fireworks are not ready');if(!(kind in durations))throw new RangeError('Unknown firework cue');
  const i=Math.max(0,Math.min(4,index|0)),clip=bank.get(kind+':'+i)||bank.get(kind+':0');if(!clip)throw Error('Missing recorded cue');
  if(sampleRate!==SR)throw new RangeError('Recorded firework renderer expects 24000 Hz');
  return {...clip,kind,index:i,source:'real recorded fireworks / CC0',notes:[],duration:clip.samples.length/SR};
 }
 function create(ctx,destination){
  const bus=ctx.createGain(),meter=ctx.createAnalyser(),voices=new Set(),cache=new Map(),history=[],samples=new Float32Array(1024);
  meter.fftSize=1024;bus.gain.value=.82;bus.connect(meter);meter.connect(destination);
  let played=0,dropped=0,peakVoices=0,disposed=false,lastAt=-1e6,direction=1,maxRms=0,normalPreemptions=0;prepare();
  const maxVoices=12;
  function release(v,seconds=.18){if(v.releasing)return;v.releasing=true;const p=v.gain.gain,t=ctx.currentTime;try{if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}p.setTargetAtTime(0,t,seconds/5);v.source.stop(t+seconds+.015);}catch(_){}}
  function reverse(dir){if(dir===direction)return;direction=dir;for(const v of voices)release(v,.65);}
  function play(event={},harmony=[]){
   if(disposed||ctx.state!=='running')return false;const now=ctx.currentTime,kind=event.kind;if(!(kind in durations))return false;
   // Missing/late assets are silent, never a delayed explosion or the rejected synth fallback.
   if(!bank){prepare();dropped++;return false;}
   if(now-lastAt<.052){dropped++;return false;}reverse(event.direction<0?-1:1);
   // Let normal overlapping recordings finish. Never trim a preceding tail just
   // because another rocket has launched; pathological scrubs are bounded, not queued.
   if(voices.size>=maxVoices){dropped++;return false;}
   const index=Math.max(0,Math.min(4,event.index|0)),key=kind+':'+index;let entry=cache.get(key);
   if(!entry){const d=render(kind,index),b=ctx.createBuffer(1,d.samples.length,SR);b.copyToChannel(d.samples,0);entry={buffer:b,clip:d.key};cache.set(key,entry);}
   const source=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():null;source.buffer=entry.buffer;
   gain.gain.value=kind==='burst'?(index%2===0?.88:.66):kind==='launch'?.56:kind==='glitter'?.50:.64;
   source.connect(gain);if(pan){pan.pan.value=(index-2)*.15;gain.connect(pan);pan.connect(bus);}else gain.connect(bus);
   const voice={source,gain,pan,releasing:false,kind,index,start:now,end:now+entry.buffer.duration};voices.add(voice);peakVoices=Math.max(peakVoices,voices.size);
   source.onended=()=>{voices.delete(voice);try{source.disconnect();gain.disconnect();pan?.disconnect();}catch(_){}};
   source.start(now+.002);played++;lastAt=now;history.push({kind,index,direction,notes:[],harmony:[...harmony],recorded:true,clip:entry.clip,at:now,duration:entry.buffer.duration,progress:event.progress});if(history.length>100)history.shift();return true;
  }
  function rms(){meter.getFloatTimeDomainData(samples);let sum=0;for(const n of samples)sum+=n*n;const v=Math.sqrt(sum/samples.length);maxRms=Math.max(maxRms,v);return v;}
  function silence(){for(const v of voices)release(v,.04);}
  function dispose(){if(disposed)return;disposed=true;for(const v of voices){try{v.source.stop();v.source.disconnect();v.gain.disconnect();v.pan?.disconnect();}catch(_){}}voices.clear();cache.clear();bus.disconnect();meter.disconnect();}
  return Object.freeze({play,reverse,silence,dispose,snapshot:()=>({played,dropped,activeVoices:voices.size,peakVoices,direction,cacheSize:cache.size,rms:rms(),maxRms,disposed,maxVoices,normalPreemptions,voices:[...voices].map(v=>({kind:v.kind,index:v.index,start:v.start,end:v.end,releasing:v.releasing})),recorded:true,bankStatus:status,history:[...history]})});
 }
 const api=Object.freeze({version:'afterglow-v23',render,create,prepare,loadBank,durations,snapshot:()=>({status,error,ready:!!bank,clips:bank?.size||0,source:'Three CC0 real firework field recordings',generated:false})});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.HolyMindBoomAudio=api;prepare();}
})(globalThis);
