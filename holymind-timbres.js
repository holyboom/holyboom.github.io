/* HolyMind Electric v12 — original, reproducible Digital + Electricity DSP.
 * Capacitor sweeps, shaped spark grains, clocked data pulses and a short logic latch.
 * No modal bells, sampled materials, stock audio, generative-audio model or sustained pad.
 * The same renderer is used in the browser and for the downloadable WAV files. */
(function(root){
 'use strict';
 const presets=[
  {id:'neural-discharge',name:'Synaptic voltage',mode:'discharge',tail:.68,from:780,to:125,drive:2.8,sparks:25,bits:5,gate:36,body:.22,sequence:[1,1.5,1.125,2,1],tag:'Sharp charge / branching crackle'},
  {id:'crystallizer-bloom',name:'Digital crystallization',mode:'bloom',tail:.84,from:220,to:840,drive:1.8,sparks:15,bits:7,gate:26,body:.18,sequence:[1,1.5,2,1.5,2.5,3,2],tag:'Faceted data / rising electric bloom'},
  {id:'insight-pulse',name:'Insight ignition',mode:'pulse',tail:.66,from:380,to:1080,drive:1.4,sparks:11,bits:3,gate:20,body:.21,sequence:[1,1.5,2.25],tag:'Two clean pulses / quick spark release'},
  {id:'constraint-break',name:'Constraint short-circuit',mode:'break',tail:.63,from:1160,to:130,drive:3.3,sparks:27,bits:5,gate:48,body:.24,sequence:[2,1.75,1,1.125,.75],tag:'Broken digital gate / controlled arc'},
  {id:'verification-spark',name:'Verification latch',mode:'verify',tail:.60,from:520,to:740,drive:1.2,sparks:9,bits:3,gate:18,body:.16,sequence:[1,1,1.5],tag:'Paired logic ticks / resolved voltage'},
  {id:'reasoning-arc',name:'Logic sequence',mode:'sequence',tail:.85,from:280,to:690,drive:1.7,sparks:14,bits:7,gate:32,body:.16,sequence:[1,1.125,1.5,1.125,2,1.5,2.25],tag:'Clocked packets / linked electric steps'},
  {id:'cognitive-reframe',name:'Phase reframe',mode:'reframe',tail:.78,from:780,to:270,drive:2.5,sparks:18,bits:5,gate:29,body:.18,sequence:[1.5,1.125,1,1.5,2],tag:'Down-up voltage / changed perspective'},
  {id:'pattern-reset',name:'Pattern interrupt',mode:'reset',tail:.68,from:380,to:160,drive:2.4,sparks:17,bits:5,gate:42,body:.21,sequence:[1,1,1,2,1.5],tag:'Repeating clock / clean break / restart'},
  {id:'signal-fork',name:'Branching circuit',mode:'fork',tail:.76,from:330,to:760,drive:2.1,sparks:18,bits:6,gate:31,body:.17,sequence:[1,1.25,1.5,1.25,2,1.5],tag:'Split data paths / twin spark trails'},
  {id:'goal-lock',name:'Target voltage lock',mode:'lock',tail:.78,from:1100,to:150,drive:2.4,sparks:15,bits:5,gate:25,body:.27,sequence:[2.25,2,1.5,1.125,1],tag:'Converging charge / low firm latch'},
  {id:'debate-synthesis',name:'Dual-signal fusion',mode:'merge',tail:.82,from:430,to:280,drive:2.2,sparks:16,bits:6,gate:23,body:.20,sequence:[1.125,1.5,1.125,1.5,1,1],tag:'Alternating carriers / one resolved signal'},
  {id:'evidence-manifest',name:'Evidence data-write',mode:'manifest',tail:.78,from:310,to:540,drive:1.6,sparks:17,bits:8,gate:45,body:.15,sequence:[1,1,1.5,1.125,1.5,2,1.125,1.5],tag:'Encoded ticks / electric write-through'},
  {id:'holy-prime',name:'HolyMind Prime charge',mode:'prime',tail:1.05,from:160,to:1120,drive:3.0,sparks:29,bits:8,gate:34,body:.27,sequence:[1,1.5,2.25,1.5,2,3,2.25,1.5],tag:'Signature capacitor rise / violet arc / resolved core'},
  {id:'triad-resonance',name:'Triad circuit alignment',mode:'triad',tail:.98,from:260,to:780,drive:2.0,sparks:21,bits:9,gate:27,body:.23,sequence:[1,1.5,2,1,1.5,2,1.5,2,3],tag:'Three digital branches / synchronized charge'}
 ];
 const map=Object.fromEntries(presets.map((p,index)=>[p.id,{...p,index}]));
 const TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 function render(id,sampleRate=32000){
  if(!Number.isFinite(sampleRate)||sampleRate<16000||sampleRate>96000)throw new RangeError('Sample rate must be 16000–96000 Hz');
  const p=map[id]||map['insight-pulse'],N=Math.ceil(sampleRate*p.tail),out=new Float32Array(N),noise=new Float32Array(N);
  let seed=(0x484d4532+p.index*73471)>>>0;
  const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
  let fast=0,slow=0;
  // A bounded band of aperiodic electric grains, not continuous white hiss.
  for(let i=0;i<N;i++){const n=random()*2-1;fast+=.49*(n-fast);slow+=.065*(fast-slow);noise[i]=fast-slow;}
  const sweepLength=p.tail*(p.mode==='prime'?.66:.48);let phase=0,modPhase=0,bodyPhase=0;
  for(let i=0;i<Math.min(N,Math.ceil(sweepLength*sampleRate));i++){
   const t=i/sampleRate,u=clamp(t/sweepLength),attack=1-Math.exp(-t/0.0025),decay=(1-u)**1.65;
   let freq=p.from*(p.to/p.from)**u;
   if(p.mode==='reframe')freq=u<.48?780*(220/780)**(u/.48):220*(950/220)**((u-.48)/.52);
   if(p.mode==='reset'&&u>.35&&u<.51)continue;
   phase+=TAU*freq/sampleRate;modPhase+=TAU*(freq*1.61+31)/sampleRate;
   const gate=.48+.52*(.5+.5*Math.sin(TAU*p.gate*t+Math.sin(t*57)));
   const fm=Math.sin(phase+Math.sin(modPhase)*(p.drive*(1-u)+.20));
   const electric=Math.tanh(fm*1.55)*.19*attack*decay*gate;
   // Deliberately grainy edge has a small weight and is filtered below.
   const quantized=Math.round(electric*52)/52;
   bodyPhase+=TAU*(104+54*Math.exp(-t*18))/sampleRate;
   const body=Math.sin(bodyPhase)*Math.exp(-t*19)*attack*p.body;
   out[i]+=.86*electric+.14*quantized+body;
  }
  // Each style has an authored arc timing pattern; high end is short and controlled.
  for(let j=0;j<p.sparks;j++){
   let at=.006+(j/p.sparks)**1.15*p.tail*.62+(random()-.5)*.012;
   if(p.mode==='break')at=(j%3)*.008+Math.floor(j/3)*.026;
   if(p.mode==='verify')at=j<p.sparks/2?.018+j*.006:.16+(j-p.sparks/2)*.006;
   if(p.mode==='triad')at=Math.floor(j/7)*.17+(j%7)*.012;
   if(p.mode==='reset'&&at>.13&&at<.23)at+=.12;
   at=Math.max(0,at);const duration=.009+random()*.026,start=Math.round(at*sampleRate),length=Math.ceil(duration*sampleRate);
   const frequency=1400+random()*2900,gain=(.16+random()*.18)*(1-j/(p.sparks*1.7));let phi=0;
   for(let k=0;k<length&&start+k<N;k++){
    const z=k/sampleRate,u=z/duration,env=(1-Math.exp(-z/.00065))*Math.exp(-z/(duration*.23))*(1-u);
    phi+=TAU*frequency*(1-u*.55)/sampleRate;
    out[start+k]+=(noise[start+k]*1.85+Math.sin(phi+noise[start+k]*2.2)*.22)*env*gain;
   }
  }
  // Short stepped data packets replace the previous bell-like struck notes.
  const packetBase=390+p.index%4*48,packetSpan=p.tail*.48,packetStart=.04;
  for(let j=0;j<p.bits;j++){
   let at=packetStart+j/Math.max(1,p.bits-1)*packetSpan;
   if(p.mode==='fork')at=packetStart+Math.floor(j/2)*.105+(j%2)*.017;
   if(p.mode==='reset')at=[.015,.065,.115,.31,.385][j];
   if(p.mode==='triad')at=.025+Math.floor(j/3)*.18+(j%3)*.032;
   at+=(random()-.5)*.004;
   const start=Math.max(0,Math.round(at*sampleRate)),duration=.025+(p.mode==='prime'?.022:.012)+random()*.009;
   const length=Math.ceil(duration*sampleRate),f=packetBase*p.sequence[j%p.sequence.length];let phi=0;
   for(let k=0;k<length&&start+k<N;k++){
    const z=k/sampleRate,u=k/length,env=Math.sin(Math.PI*clamp(u))**1.4;
    // Three odd partials give a digital edge without an unfiltered square wave.
    phi+=TAU*f*(1+.035*(1-u))/sampleRate;
    const pulse=Math.sin(phi)+.23*Math.sin(phi*3)+.085*Math.sin(phi*5);
    const mod=.78+.22*Math.sin(TAU*(80+j*13)*z);
    out[start+k]+=pulse*env*mod*(p.mode==='manifest'?.115:.095);
   }
  }
  // Shared HolyMind logic latch: brief, dry fifth, no chime/reverberant tail.
  const resolveAt=p.tail*.70,latchBase=p.mode==='lock'?165:220+p.index%3*27.5;
  for(let j=0;j<2;j++){
   const start=Math.round((resolveAt+j*.037)*sampleRate),length=Math.round(.072*sampleRate),freq=latchBase*(j?1.5:1);
   for(let k=0;k<length&&start+k<N;k++){const z=k/sampleRate,u=k/length,env=Math.sin(Math.PI*u)**2*Math.exp(-u*2.4);out[start+k]+=(Math.sin(TAU*freq*z)+.22*Math.sin(TAU*freq*3*z))*env*.11;}
  }
  // Very short electrical reflections, not a metallic room/reverb.
  const dry=out.slice();for(const [seconds,gain] of [[.013,.055],[.031,.025]]){const delay=Math.round(seconds*sampleRate);for(let i=delay;i<N;i++)out[i]+=dry[i-delay]*gain;}
  // DC removal and two smooth low-pass stages bound the bite on small speakers.
  const dcR=Math.exp(-TAU*45/sampleRate),lp=1-Math.exp(-TAU*5600/sampleRate);let prev=0,hp=0,lo1=0,lo2=0;
  let peak=0,sum=0;
  for(let i=0;i<N;i++){
   hp=out[i]-prev+dcR*hp;prev=out[i];lo1+=lp*(hp-lo1);lo2+=lp*(lo1-lo2);
   const fade=Math.min(1,i/(sampleRate*.0015),(N-1-i)/(sampleRate*.035));out[i]=lo2*Math.max(0,fade);
   peak=Math.max(peak,Math.abs(out[i]));sum+=out[i]*out[i];
  }
  const rms=Math.sqrt(sum/N),gain=Math.min(.069/Math.max(rms,1e-9),.43/Math.max(peak,1e-9));
  for(let i=0;i<N;i++)out[i]*=gain;
  return {samples:out,sampleRate,duration:N/sampleRate,id:p.id,name:p.name,character:'digital-electric',tag:p.tag};
 }
 const api=Object.freeze({version:'electric-v12',character:'digital-electric',sampleRate:32000,presets:Object.freeze(presets.map(p=>Object.freeze({...p,sequence:Object.freeze([...p.sequence])}))),render});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindTimbres=api;
})(globalThis);
