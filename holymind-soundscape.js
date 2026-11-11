/* HolyMind Quiet Current v14 — authored Web Audio instrument, not a music loop.
 * Three independent buses: quiet field, continuous scroll current, brief resolution.
 * Browser and OfflineAudioContext use this SAME graph. No samples, no network,
 * no generative-audio service, no repeating tap presets, no JS audio callback.
 */
(function(root){
 'use strict';
 const TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
 function texture(ctx,seconds,seed){
  const n=Math.round(ctx.sampleRate*seconds),over=Math.round(ctx.sampleRate*.08),raw=new Float32Array(n+over);
  let fast=0,slow=0;
  for(let i=0;i<raw.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const v=(seed>>>0)/2147483648-1;fast+=.14*(v-fast);slow+=.013*(fast-slow);raw[i]=(fast-slow)*1.9;}
  const b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);d.set(raw.subarray(0,n));
  // Cross the end into a continuation of the very same band-limited texture.
  for(let i=0;i<over;i++){const u=(1-Math.cos(Math.PI*i/over))*.5;d[i]=raw[n+i]*(1-u)+raw[i]*u;}
  return b;
 }
 function resolution(ctx,reverse=false){
  const duration=reverse?.36:.56,n=Math.round(ctx.sampleRate*duration),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
  // A current settling, not a bell, packet sequence, or existing brain sound.
  for(let i=0;i<n;i++){const t=i/ctx.sampleRate,u=i/n,env=Math.sin(Math.PI*u)**2*Math.exp(-u*2.3);const f=reverse?165:220;
   d[i]=(Math.sin(TAU*f*t+.13*Math.sin(TAU*37*t))+.38*Math.sin(TAU*f*1.5*t))*env*.035;}
  return b;
 }
 function create(ctx,destination){
  if(!ctx||!destination)throw new TypeError('AudioContext and destination are required');
  const nodes=[],sources=[],oneshots=new Set(),params=new Map();let disposed=false,updates=0,ducks=0,resolves=0,last={};
  const own=n=>(nodes.push(n),n),gain=(v=1)=>{const n=own(ctx.createGain());n.gain.value=v;return n;};
  const filter=(type,hz,q=.6)=>{const n=own(ctx.createBiquadFilter());n.type=type;n.frequency.value=hz;n.Q.value=q;return n;};
  const master=gain(1),ambient=gain(0),scroll=gain(0),resolveBus=gain(1),ambientDuck=gain(1),scrollDuck=gain(1);
  const meterA=own(ctx.createAnalyser()),meterS=own(ctx.createAnalyser()),meterR=own(ctx.createAnalyser());[meterA,meterS,meterR].forEach(n=>n.fftSize=1024);
  ambient.connect(ambientDuck);ambientDuck.connect(meterA);meterA.connect(master);
  scroll.connect(scrollDuck);scrollDuck.connect(meterS);meterS.connect(master);resolveBus.connect(meterR);meterR.connect(master);master.connect(destination);
  const bedLow=filter('lowpass',1250,.5),motionLow=filter('lowpass',1600,.58),motionPan=ctx.createStereoPanner?own(ctx.createStereoPanner()):gain(1);
  bedLow.connect(ambient);motionLow.connect(motionPan);motionPan.connect(scroll);
  function osc(hz,level,dest,type='sine'){
   const o=own(ctx.createOscillator()),g=gain(level);o.frequency.value=hz;o.type=type;o.connect(g);g.connect(dest);sources.push(o);o.start(ctx.currentTime);return {o,g};
  }
  function lfo(param,hz,depth){const o=own(ctx.createOscillator()),g=gain(depth);o.frequency.value=hz;o.connect(g);g.connect(param);sources.push(o);o.start(ctx.currentTime);return o;}
  // Quiet electric field: open fifth, restrained upper partial, asynchronous drift.
  const a=osc(110,.0064,bedLow),b=osc(165,.0038,bedLow),c=osc(220.12,.0018,bedLow);
  lfo(a.g.gain,1/19,.0008);lfo(b.g.gain,1/31,.00055);lfo(c.o.detune,1/43,2.4);
  const fieldTexture=own(ctx.createBufferSource());fieldTexture.buffer=texture(ctx,11.3,0x484d5131);fieldTexture.loop=true;
  const fieldBand=filter('bandpass',510,.55),fieldGain=gain(.0075);fieldTexture.connect(fieldBand);fieldBand.connect(fieldGain);fieldGain.connect(bedLow);sources.push(fieldTexture);fieldTexture.start(ctx.currentTime);
  lfo(fieldBand.frequency,1/27,82);
  // Scroll is one continuously shaped filament. Velocity never retriggers a file.
  const primary=osc(220,.021,motionLow),secondary=osc(330,.008,motionLow);
  lfo(primary.o.frequency,37,.95);lfo(secondary.o.detune,1/17,2);
  const drift=own(ctx.createBufferSource());drift.buffer=texture(ctx,7.7,0x484d5132);drift.loop=true;
  const driftBand=filter('bandpass',980,.72),driftGain=gain(.040);drift.connect(driftBand);driftBand.connect(driftGain);driftGain.connect(motionLow);sources.push(drift);drift.start(ctx.currentTime,.41);
  const data=new Float32Array(1024);
  function rms(analyser){try{analyser.getFloatTimeDomainData(data);let n=0;for(const x of data)n+=x*x;return Math.sqrt(n/data.length);}catch(_){return 0;}}
  function target(param,value,at,tau=.12){
   if(!Number.isFinite(value))return;
   const prev=params.get(param);if(prev!==undefined&&Math.abs(prev-value)<1e-5)return;params.set(param,value);
   if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(at);else{const v=param.value;param.cancelScheduledValues(at);param.setValueAtTime(v,at);}
   param.setTargetAtTime(value,at,Math.max(.008,tau));
  }
  function update(input={},at=ctx.currentTime){
   if(disposed)return;updates++;
   const scope=clamp(input.scope??1),enabled=input.enabled!==false,amb=input.ambience!==false,flow=input.flow!==false;
   const activity=clamp(input.activity??0),p=clamp(input.voiceProgress??input.progress??0),direction=clamp(input.direction??1,-1,1),scene=clamp(input.morph??0);
   const fieldLevel=clamp(input.fieldLevel??1,.45,1.1),currentLevel=clamp(input.currentLevel??1,.45,1.1),openness=clamp(input.openness??1,.6,1.15),textureLevel=clamp(input.textureLevel??1,.3,1.15);
   const focus=clamp(input.focus??1,.25,1);
   const active=enabled?scope:0;
   const bed=amb?active*(.91-scene*.12)*fieldLevel*focus:0,travel=flow?active*Math.pow(activity,.72)*.86*currentLevel*focus:0;
   target(ambient.gain,bed,at,bed<(last.ambientGain||0)?.22:.7);target(scroll.gain,travel,at,travel>(last.scrollGain||0)?.09:.13);
   // Direction is expressed mostly through openness, not a cartoon pitch slide.
   target(primary.o.frequency,220*(1+.035*p+.009*direction),at,.18);
   target(secondary.o.frequency,330*(1+.028*p-.004*direction),at,.22);
   target(motionLow.frequency,(1100+activity*650+p*260+direction*170)*openness,at,.16);
   target(driftBand.frequency,(690+activity*510+p*240+direction*95)*openness,at,.2);
   target(bedLow.frequency,(1370-scene*460)*openness,at,.8);
   target(fieldGain.gain,.0075*textureLevel,at,.65);target(driftGain.gain,.040*textureLevel,at,.3);
   if(motionPan.pan)target(motionPan.pan,direction*.09*activity,at,.24);
   last={scope,enabled,ambience:amb,flow,activity,progress:p,direction,morph:scene,scene:input.scene||'hero',fieldLevel,currentLevel,openness,textureLevel,focus,ambientGain:bed,scrollGain:travel,at};
  }
  function duck(at=ctx.currentTime,strength=1){
   if(disposed)return;ducks++;const d=clamp(strength);
   for(const [node,floor] of [[ambientDuck,.42],[scrollDuck,.24]]){
    const p=node.gain;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(at);else{p.cancelScheduledValues(at);p.setValueAtTime(p.value,at);}
    p.linearRampToValueAtTime(1-(1-floor)*d,at+.025);p.setValueAtTime(1-(1-floor)*d,at+.19);p.setTargetAtTime(1,at+.19,.13);
   }
  }
  function settle(reverse=false,at=ctx.currentTime){
   if(disposed||last.enabled===false||last.flow===false||(last.scope??1)<.05)return false;
   if(oneshots.size>=1)return false;
   const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=resolution(ctx,reverse);g.gain.value=reverse?.46:.72;
   s.connect(g);g.connect(resolveBus);oneshots.add(s);resolves++;
   s.onended=()=>{oneshots.delete(s);s.disconnect();g.disconnect();};s.start(at);duck(at,.30);return true;
  }
  function silence(at=ctx.currentTime){
   target(ambient.gain,0,at,.035);target(scroll.gain,0,at,.025);last={...last,enabled:false,activity:0,ambientGain:0,scrollGain:0};
   for(const s of oneshots){try{s.stop(at);}catch(_){}}oneshots.clear();
  }
  function dispose(){if(disposed)return;silence();disposed=true;for(const s of sources){try{s.stop();}catch(_){}}for(const n of nodes){try{n.disconnect();}catch(_){}}}
  return Object.freeze({update,duck,settle,silence,dispose,snapshot:()=>({version:'full-current-v14',disposed,updates,ducks,resolves,continuousSources:sources.length,oneShots:oneshots.size,...last,actual:{ambient:ambient.gain.value,scroll:scroll.gain.value,ambientDuck:ambientDuck.gain.value,scrollDuck:scrollDuck.gain.value},rms:{ambient:rms(meterA),scroll:rms(meterS),resolve:rms(meterR)}})});
 }
 root.HolyMindSoundscape=Object.freeze({version:'full-current-v14',create,description:'Quiet Electric Field / Reversible Filament / Settled Current',scope:'Entire showcase, Hero through Footer',resolution});
})(globalThis);
