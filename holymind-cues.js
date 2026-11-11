/* Semantic digital-electric cues. Authored DSP, no stock/sample/model dependency.
 * Separate from unchanged brain discharges and the approved continuous soundscape. */
(function(root){
 'use strict';
 const presets=[
  {id:'dock',name:'Circuit seated',from:430,to:650,duration:.29,pulses:[0,.073],noise:.13},
  {id:'return',name:'Current reconnected',from:640,to:350,duration:.27,pulses:[0,.09],noise:.11},
  {id:'phase',name:'Reason · Build · Verify',from:350,to:710,duration:.30,pulses:[0,.055,.12],noise:.09},
  {id:'layer',name:'Layer connection revealed',from:500,to:850,duration:.24,pulses:[0,.08],noise:.12},
  {id:'select',name:'Focused capability',from:690,to:540,duration:.15,pulses:[0],noise:.09},
  {id:'switch',name:'New working path',from:320,to:630,duration:.26,pulses:[0,.085],noise:.12},
  {id:'open',name:'Information unfolds',from:300,to:790,duration:.31,pulses:[0,.065,.13],noise:.08},
  {id:'close',name:'Information gathers',from:650,to:270,duration:.22,pulses:[0,.07],noise:.07},
  {id:'confirm',name:'Evidence accepted',from:520,to:780,duration:.28,pulses:[0,.11],noise:.06},
  {id:'filter',name:'Signal refined',from:460,to:610,duration:.19,pulses:[0,.058],noise:.15}
 ];
 const map=Object.fromEntries(presets.map((p,i)=>[p.id,{...p,i}])),TAU=Math.PI*2;
 function render(id,variant=0,sampleRate=32000){
  const p=map[id];if(!p)throw new RangeError('Unknown cue');
  const v=Math.max(0,Math.min(5,Math.round(Number(variant)||0))),rate=1+v*.035,n=Math.ceil(p.duration*sampleRate),out=new Float32Array(n);
  let seed=(0x484d4331+p.i*9719+v*3701)>>>0,low=0,slow=0,phase=0;
  for(let i=0;i<n;i++){
   const t=i/sampleRate,u=t/p.duration;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
   const noise=(seed>>>0)/2147483648-1;low+=.38*(noise-low);slow+=.07*(low-slow);
   const f=p.from*(p.to/p.from)**Math.min(1,u*1.7)*rate;phase+=TAU*f/sampleRate;
   let env=0,crackle=0;
   for(const at of p.pulses){const z=t-at;if(z<0)continue;env+=(1-Math.exp(-z/.003))*Math.exp(-z/.031);crackle+=(1-Math.exp(-z/.0015))*Math.exp(-z/.008);}
   const carrier=Math.sin(phase+.32*Math.sin(phase*1.51))+.17*Math.sin(phase*3);
   const gate=.76+.24*Math.sin(TAU*(21+p.i*2)*t);
   const resolve=Math.sin(TAU*(190+v*13)*t)*(1-Math.exp(-t/.004))*Math.exp(-t/0.055)*.045;
   out[i]=carrier*env*gate*.15+(low-slow)*crackle*p.noise+resolve;
  }
  const lp=1-Math.exp(-TAU*4300/sampleRate),r=Math.exp(-TAU*60/sampleRate);let prev=0,hp=0,l1=0,l2=0,peak=0,sum=0;
  for(let i=0;i<n;i++){hp=out[i]-prev+r*hp;prev=out[i];l1+=lp*(hp-l1);l2+=lp*(l1-l2);out[i]=l2*Math.max(0,Math.min(1,i/(sampleRate*.002),(n-1-i)/(sampleRate*.025)));peak=Math.max(peak,Math.abs(out[i]));sum+=out[i]**2;}
  const gain=Math.min(.066/Math.max(1e-9,Math.sqrt(sum/n)),.39/Math.max(1e-9,peak));for(let i=0;i<n;i++)out[i]*=gain;
  return {id:p.id,name:p.name,variant:v,samples:out,sampleRate,duration:n/sampleRate};
 }
 const api=Object.freeze({version:'feedback-v15',presets:Object.freeze(presets.map(p=>Object.freeze(p))),render});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindCueTimbres=api;
})(globalThis);
