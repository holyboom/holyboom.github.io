/* HolyMind firework punctuation. Finite authored noise/charge + licensed piano tone.
 * Not recorded pyrotechnics; not reversed recordings. One existing AudioContext.
 * Piano samples retain the Salamander attribution in audio-credits.html. */
(function(root){
 'use strict';const TAU=Math.PI*2;
 const durations={charge:.40,launch:.32,burst:1.40,glitter:1.10,recall:.65,gather:.72,return:.45,seal:.45};
 function render(kind,index=0,harmony=[60,64,67],sampleRate=24000){
  if(!(kind in durations))throw new RangeError('Unknown celebration cue');
  index=Math.max(0,Math.min(4,index|0));const sr=sampleRate,n=Math.ceil(durations[kind]*sr),out=new Float32Array(n),dry=new Float32Array(n);
  let seed=(0x424F4F4D+index*731+Object.keys(durations).indexOf(kind)*1999)>>>0,lp=0,slow=0;const reverse=['recall','gather','return','seal'].includes(kind);
  const chord=harmony.filter(Number.isFinite);if(!chord.length)chord.push(60,64,67);
  const notes=kind==='burst'&&index%2===0?[chord[index%chord.length]+(chord[index%chord.length]<72?12:0)]:kind==='charge'||kind==='seal'?[chord[0]]:[];
  for(let i=0;i<n;i++){
   const t=i/sr,u=t/durations[kind];seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const r=(seed>>>0)/2147483648-1;lp+=.30*(r-lp);slow+=.035*(lp-slow);const noise=lp-slow;
   let v=0;
   if(kind==='burst'){
    const env=(1-Math.exp(-t/.0025))*Math.exp(-t/0.063);
    const puff=Math.sin(TAU*(108+index*17)*t+2.8*(1-Math.exp(-t*24)))*Math.exp(-t*23);
    let crackle=0;for(let j=0;j<7;j++){const z=t-(.11+j*.045+index*.004);if(z>0)crackle+=(1-Math.exp(-z/.001))*Math.exp(-z/0.009)*(j%3===0?.7:.35);}
    v=noise*(env*.60+crackle*.24)+puff*env*.10;
   }else if(kind==='launch')v=noise*Math.sin(Math.PI*u)**1.4*.14+Math.sin(TAU*(310*t+150*t*t))*.010*Math.sin(Math.PI*u)**2;
   else if(kind==='charge')v=noise*u*u*(1-u)*.26+Math.sin(TAU*(95*t+25*t*t))*.025*Math.sin(Math.PI*u)**2;
   else if(kind==='glitter'){const grain=(.5+.5*Math.sin(t*105+index))**12;v=noise*grain*.18*Math.exp(-t*3)*Math.min(1,t/.04);}
   else {const rise=Math.sin(Math.PI*Math.min(1,u*1.05))**2,body=reverse?(kind==='seal'?.04:.12):.1;v=noise*rise*body+Math.sin(TAU*(330*t-90*t*t))*.012*rise;}
   dry[i]=v;
  }
  // Musical support uses chord tones of the currently sounding score, not a new chord.
  for(const midi of notes){const keys=root.HolyMindCueTimbres?.key?.(midi);if(!keys)continue;const rate=2**((midi-keys.midi)/12)*keys.sampleRate/sr,level=kind==='burst'?.12:.065;
   for(let i=0;i<n;i++){const ix=i*rate,k=Math.floor(ix);if(k+1>=keys.samples.length)break;const t=i/sr,s=keys.samples[k]+(keys.samples[k+1]-keys.samples[k])*(ix-k);dry[i]+=s*level*Math.min(1,t/.004)*Math.min(1,(n-1-i)/(sr*.28));}
  }
  // Finite small reflections; never a continuously running celebration bed.
  let state=0;const filter=1-Math.exp(-TAU*5000/sr);for(let i=0;i<n;i++){let v=dry[i];for(const [delay,g] of [[.047,.14],[.091,.07]]){const d=Math.round(delay*sr);if(i>=d)v+=dry[i-d]*g;}state+=filter*(v-state);out[i]=state*Math.max(0,Math.min(1,i/(sr*.003),(n-1-i)/(sr*.12)));}
  return {samples:out,sampleRate:sr,duration:n/sr,kind,index,notes,source:'authored electric firework + existing licensed piano'};
 }
 function create(ctx,destination){
  const bus=ctx.createGain(),meter=ctx.createAnalyser(),voices=new Set(),cache=new Map(),history=[];meter.fftSize=1024;bus.gain.value=.82;bus.connect(meter);meter.connect(destination);
  let played=0,dropped=0,peakVoices=0,disposed=false,lastAt=-1e6,direction=1,maxRms=0;
  function release(v,seconds=.12){if(v.releasing)return;v.releasing=true;const p=v.gain.gain,t=ctx.currentTime;try{if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}p.setTargetAtTime(0,t,seconds/5);v.source.stop(t+seconds+.015);}catch(_){}}
  function reverse(dir){if(dir===direction)return;direction=dir;for(const v of voices)release(v,.16);}
  function play(event={},harmony=[60,64,67]){
   if(disposed||ctx.state!=='running')return false;const now=ctx.currentTime,kind=event.kind;if(!(kind in durations))return false;
   if(now-lastAt<.052){dropped++;return false;}reverse(event.direction<0?-1:1);
   if(voices.size>=5){dropped++;return false;}if(voices.size>=3)release(voices.values().next().value,.10);
   const index=event.index|0,key=kind+':'+index+':'+harmony.join('-');let entry=cache.get(key);
   if(!entry){const d=render(kind,index,harmony,24000),b=ctx.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);entry={buffer:b,notes:d.notes};cache.set(key,entry);if(cache.size>32)cache.delete(cache.keys().next().value);}
   const s=ctx.createBufferSource(),g=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():null;s.buffer=entry.buffer;g.gain.value=kind==='burst'?.90:kind==='glitter'?.56:.72;
   s.connect(g);if(pan){pan.pan.value=(index-2)*.15;g.connect(pan);pan.connect(bus);}else g.connect(bus);
   const v={source:s,gain:g,pan,releasing:false};voices.add(v);peakVoices=Math.max(peakVoices,voices.size);s.onended=()=>{voices.delete(v);try{s.disconnect();g.disconnect();pan?.disconnect();}catch(_){}};s.start(now+.002);played++;lastAt=now;
   history.push({kind,index,direction,notes:[...entry.notes],harmony:[...harmony],at:now,progress:event.progress});if(history.length>100)history.shift();return true;
  }
  function rms(){const a=new Float32Array(1024);meter.getFloatTimeDomainData(a);let s=0;for(const n of a)s+=n*n;const v=Math.sqrt(s/a.length);maxRms=Math.max(maxRms,v);return v;}
  function silence(){for(const v of voices)release(v,.04);}
  function dispose(){if(disposed)return;disposed=true;for(const v of voices){try{v.source.stop();v.source.disconnect();v.gain.disconnect();v.pan?.disconnect();}catch(_){}}voices.clear();bus.disconnect();meter.disconnect();}
  return Object.freeze({play,reverse,silence,dispose,snapshot:()=>({played,dropped,activeVoices:voices.size,peakVoices,direction,cacheSize:cache.size,rms:rms(),maxRms,disposed,history:[...history]})});
 }
 const api=Object.freeze({version:'boom-v20',render,create,durations});if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindBoomAudio=api;
})(globalThis);
