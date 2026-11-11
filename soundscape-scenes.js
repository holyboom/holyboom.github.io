/* Quiet Current v14 — one continuous instrument, eleven reversible listening zones.
 * Pure geometry-to-mix mapping; no randomness, audio creation or DOM mutation.
 */
(function(root){
 'use strict';
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),smooth=t=>t*t*(3-2*t),ease=t=>t*t*t*(t*(t*6-15)+10);
 const base={fieldLevel:1,currentLevel:1,openness:1,textureLevel:1,voiceProgress:0};
 const rows=[
  {id:'hero',name:'Neural origin',selector:'#top',morph:.10},
  {id:'orbit',name:'Connected intelligence',selector:'#mind-flow',morph:.34},
  {id:'ribbon',name:'Signal crossing',selector:'#signal-crossing',morph:.55},
  {id:'assembly',name:'System unfolding',selector:'#system-assembly',morph:1,voiceProgress:1},
  {id:'workbench',name:'Working intention',selector:'.bench-layout',morph:.78,fieldLevel:.94,currentLevel:.90,openness:.92,textureLevel:.88,voiceProgress:.55},
  {id:'instrument',name:'Capability constellation',selector:'#skill-instrument',morph:.53,fieldLevel:1,currentLevel:1.02,openness:1.08,textureLevel:.98,voiceProgress:.64},
  {id:'gallery',name:'Evidence atlas',selector:'.atlas-toolbar',morph:.70,fieldLevel:.88,currentLevel:.82,openness:.88,textureLevel:.72,voiceProgress:.44},
  {id:'services',name:'Applied intelligence',selector:'#what-i-do',morph:.76,fieldLevel:.94,currentLevel:.92,openness:.95,textureLevel:.88,voiceProgress:.55},
  {id:'about',name:'The human behind the mind',selector:'#about',morph:.94,fieldLevel:.76,currentLevel:.64,openness:.78,textureLevel:.50,voiceProgress:.26},
  {id:'contact',name:'The next possibility',selector:'#connect',morph:.84,fieldLevel:.90,currentLevel:.80,openness:.92,textureLevel:.70,voiceProgress:.70},
  {id:'footer',name:'A quiet return',selector:'#connect footer',morph:1,fieldLevel:.72,currentLevel:.60,openness:.72,textureLevel:.44,voiceProgress:.22}
 ].map(x=>Object.freeze({...base,...x}));
 const byId=Object.fromEntries(rows.map(x=>[x.id,x])),keys=['morph','fieldLevel','currentLevel','openness','textureLevel','voiceProgress'];
 function position(y,l){
  const raw=clamp((y-l.start)/Math.max(1,l.end-l.start)),p=ease(clamp((raw-(l.lead??.04))/((l.finish??.93)-(l.lead??.04))));
  const common={scope:1,raw,progress:p,start:l.start,end:l.end};
  if(y<=l.end){
   const id=y<l.orbit-l.height*.25?'hero':y<l.ribbon-l.height*.25?'orbit':y<l.start?'ribbon':'assembly';
   const mix={...byId[id]};if(id==='assembly'){mix.morph=.66+.34*p;mix.voiceProgress=p;}
   return {...common,...mix,scene:id,label:mix.name,sceneNext:id,blend:0,sceneProgress:id==='assembly'?p:0};
  }
  const stops=[{id:'assembly',at:l.end},...rows.slice(4).map(x=>({id:x.id,at:l.positions[x.id]}))];
  let i=0;while(i<stops.length-1&&y>=stops[i+1].at)i++;
  const a=stops[i],b=stops[i+1]||a,t=a===b?1:clamp((y-a.at)/Math.max(1,b.at-a.at)),blend=a===b?0:smooth(t);
  const mix={...byId[a.id]};for(const key of keys)mix[key]=byId[a.id][key]+(byId[b.id][key]-byId[a.id][key])*blend;
  return {...common,...mix,scene:a.id,label:byId[a.id].name,sceneNext:b.id,blend,sceneProgress:t};
 }
 const api=Object.freeze({version:'full-current-v14',profiles:Object.freeze(rows),position});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindSoundScenes=api;
})(globalThis);
