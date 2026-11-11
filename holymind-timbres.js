/* Original HolyMind micro-score. Deterministic DSP authored for this site.
 * Physical-material-inspired modal resonators + seeded texture; NOT field recordings,
 * sampled instruments, stock sounds, or output from a generative-audio model.
 * Shared browser/offline renderer makes every downloadable WAV reproducible. */
(function(root){
 'use strict';
 const presets=[
 {id:'neural-discharge',name:'Graphite ignition',f:246,decay:.12,texture:.25,events:[[0,1,1],[.052,1.5,.48],[.15,2,.27]],tail:.7},
 {id:'crystallizer-bloom',name:'Cut crystal',f:329.63,decay:.24,texture:.11,events:[[0,1,.85],[.065,1.5,.65],[.17,2,.5]],tail:1.05},
 {id:'insight-pulse',name:'Porcelain insight',f:293.66,decay:.21,texture:.07,events:[[0,1,1],[.095,1.498,.58],[.24,2.245,.32]],tail:1.05},
 {id:'constraint-break',name:'Split slate',f:196,decay:.10,texture:.38,events:[[0,1,1],[.028,1.12,.6],[.13,1.5,.45]],tail:.75},
 {id:'verification-spark',name:'Evidence seal',f:392,decay:.15,texture:.13,events:[[0,1,.8],[.115,1.5,.62]],tail:.85},
 {id:'reasoning-arc',name:'Connected beads',f:261.63,decay:.14,texture:.15,events:[[0,1,.65],[.074,1.25,.62],[.148,1.5,.55],[.235,2,.42]],tail:1.0},
 {id:'cognitive-reframe',name:'Turned glass',f:311.13,decay:.2,texture:.16,events:[[0,1.34,.8],[.08,1.12,.5],[.19,1.5,.65]],tail:1.0},
 {id:'pattern-reset',name:'Loop release',f:220,decay:.095,texture:.25,events:[[0,1,.85],[.075,1,.55],[.22,2,.55]],tail:.8},
 {id:'signal-fork',name:'Twin filaments',f:349.23,decay:.16,texture:.13,events:[[0,1,.8],[.08,1.25,.6],[.095,1.5,.52]],tail:.9},
 {id:'goal-lock',name:'Magnetic resolve',f:220,decay:.2,texture:.18,events:[[0,2,.38],[.08,1.5,.5],[.22,1,1]],tail:1.0},
 {id:'debate-synthesis',name:'Two into one',f:293.66,decay:.18,texture:.13,events:[[0,1.125,.65],[.035,1.5,.55],[.21,1,.9]],tail:1.0},
 {id:'evidence-manifest',name:'Etched ledger',f:277.18,decay:.10,texture:.28,events:[[0,1,.7],[.06,1.125,.5],[.12,1.5,.45],[.25,2,.36]],tail:.9},
 {id:'holy-prime',name:'HolyMind signature',f:293.66,decay:.25,texture:.10,events:[[0,1,.75],[.11,1.498,.65],[.28,2.245,.55],[.38,.5,.38]],tail:1.3},
 {id:'triad-resonance',name:'Threefold resonance',f:246.94,decay:.24,texture:.10,events:[[0,1,.75],[.13,1.5,.6],[.26,2,.5],[.35,2.5,.24]],tail:1.25}
 ];
 const map=Object.fromEntries(presets.map((p,i)=>[p.id,{...p,index:i}]));
 function render(id,sampleRate=24000){
  const p=map[id]||map['insight-pulse'],N=Math.ceil(sampleRate*p.tail),out=new Float32Array(N);
  let random=(0x48504d31+p.index*73471)>>>0,low=0,slow=0;
  const modes=[1,1.973,2.637,3.916,5.273,6.143],levels=[1,.30,.15,.062,.028,.012];
  const notes=p.events.map(([t,ratio,gain])=>({t,ratio,gain}));
  for(let i=0;i<N;i++){
   const t=i/sampleRate;random^=random<<13;random^=random>>>17;random^=random<<5;
   const n=(random>>>0)/2147483648-1;low+=.28*(n-low);slow+=.035*(low-slow);
   let sum=0;
   for(const event of notes){const z=t-event.t;if(z<0)continue;
    const impact=(1-Math.exp(-z/0.0018))*Math.exp(-z/(.011+p.texture*.035));
    sum+=(low-slow)*impact*p.texture*.22*event.gain;
    // A warm material body, with an imperfect strike and a slightly beating upper mode.
    sum+=Math.sin(2*Math.PI*(88+p.index%4*11)*z)*Math.exp(-z*32)*(1-Math.exp(-z*600))*.065*event.gain;
    for(let k=0;k<modes.length;k++){
     const f=p.f*event.ratio*modes[k],d=p.decay/(1+k*.62);
     const env=(1-Math.exp(-z/(.0035+k*.0009)))*Math.exp(-z/d);
     const detune=k===1?1+.0017*Math.sin(z*9+p.index):1;
     sum+=Math.sin(2*Math.PI*f*z*detune)*env*levels[k]*.18*event.gain;
    }
   }
   // A short brushed grain ties the digital gesture to a tactile material.
   sum+=(low-slow)*Math.exp(-t*8)*Math.sin(Math.min(1,t/.05)*Math.PI/2)*p.texture*.014;
   out[i]=sum;
  }
  // Small, irregular early reflections, no ambient pad or long sci-fi reverb.
  const dry=out.slice();for(const [seconds,gain] of [[.029,.11],[.047,.075],[.083,.04]]){const delay=Math.round(seconds*sampleRate);for(let i=delay;i<N;i++)out[i]+=dry[i-delay]*gain;}
  let mean=0;for(const x of out)mean+=x;mean/=N;let rms=0,peak=0;
  for(let i=0;i<N;i++){out[i]-=mean;rms+=out[i]**2;peak=Math.max(peak,Math.abs(out[i]));}
  rms=Math.sqrt(rms/N);const gain=Math.min(.065/Math.max(rms,1e-9),.46/Math.max(peak,1e-9));
  for(let i=0;i<N;i++){const fade=Math.min(1,i/(sampleRate*.003),(N-1-i)/(sampleRate*.045));out[i]=Math.tanh(out[i]*gain*1.03)*Math.max(0,fade);}
  return {samples:out,sampleRate,duration:N/sampleRate,id:p.id,name:p.name};
 }
 const api=Object.freeze({version:'resonance-v11',sampleRate:24000,presets:Object.freeze(presets.map(p=>Object.freeze(p))),render});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindTimbres=api;
})(globalThis);
