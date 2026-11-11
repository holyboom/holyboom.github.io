/* Boom: deterministic geometry. One scroll coordinate, the same particles both ways.
 * No random/time integration in frame(); reversing t reconstructs the exact state. */
(function(root){
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},TAU=Math.PI*2;
 const palette=['#B475FF','#67E8F9','#FF7AC6','#F2CC8F','#F8F2FF'];
 const definitions=[
  {id:'crown',style:'radial',x:.48,h:.40,r:.19,start:.14,burst:.34,color:0},
  {id:'left',style:'fan',x:.16,h:.23,r:.15,start:.165,burst:.38,color:1},
  {id:'right',style:'diamond',x:.83,h:.25,r:.16,start:.19,burst:.42,color:2},
  {id:'spire',style:'needle',x:.31,h:.52,r:.15,start:.215,burst:.46,color:0},
  {id:'crystal',style:'crystal',x:.68,h:.47,r:.17,start:.24,burst:.50,color:3}
 ];
 let seed=0x484D424D;function rand(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
 const bursts=definitions.map((b,k)=>({...b,particles:Array.from({length:18},(_,i)=>{
  let angle=i/18*TAU;if(b.style==='fan')angle=Math.PI+(.10+i/17*.80)*Math.PI;
  if(b.style==='diamond')angle=Math.PI/4+Math.round(i/18*8)*Math.PI/4+(rand()-.5)*.14;
  return {angle,radius:.62+rand()*.45,twinkle:rand()*TAU,size:1.0+rand()*1.3,color:i%7===0?4:b.color,skew:(rand()-.5)*.15};
 }),dust:Array.from({length:9},()=>({angle:rand()*TAU,radius:.35+rand()*.62,phase:rand()*TAU,size:.8+rand()*.9,color:rand()>.6?3:4}))}));
 function geometry(box,b){
  const scale=clamp(box.wordWidth,210,410),radius=Math.min(clamp(scale*b.r,31,76),Math.max(8,(box.wordTop-box.header-20)/3));
  const x=clamp(box.wordLeft+box.wordWidth*b.x,radius+12,box.width-radius-12);
  // Keep crowns above the word, with small-screen clearance below the masthead.
  const y=clamp(box.wordTop-scale*b.h,box.header+radius*1.15+8,Math.max(box.header+radius*1.15+8,box.wordTop-radius*1.6-8));
  return {x,y,radius};
 }
 function rocket(a,b,u,k){const t=smooth(u),c={x:a.x+(b.x-a.x)*.46+(k%2?18:-12),y:Math.min(a.y,b.y)-28};return {x:(1-t)**2*a.x+2*(1-t)*t*c.x+t*t*b.x,y:(1-t)**2*a.y+2*(1-t)*t*c.y+t*t*b.y};}
 function frame(progress,box){
  const t=clamp(progress),particles=[],trails=[],heads=[],centers=[];
  const charge=smooth(t/.12)*(1-smooth((t-.23)/.15)),halo=smooth((t-.58)/.10)*(1-smooth((t-.79)/.21));
  if(t===0||t===1)return {progress:t,charge:0,halo:0,particles,trails,heads,centers,phase:t===0?'rest':'complete'};
  bursts.forEach((b,k)=>{
   const g=geometry(box,b);centers.push({id:b.id,...g});
   const u=clamp((t-b.start)/(b.burst-b.start));
   if(t>=b.start&&t<=b.burst){const head=rocket(box.anchor,g,u,k);heads.push({...head,color:4,alpha:1});const line=[];for(let j=0;j<=18;j++)line.push(rocket(box.anchor,g,Math.max(0,u-.24)+Math.min(u,.24)*j/18,k));trails.push({points:line,color:b.color,alpha:smooth((t-b.start)/.025)});}
   if(t>=b.burst){
    const age=clamp((t-b.burst)/(1-b.burst)),spread=1-Math.exp(-5.2*age),fade=1-smooth((t-.64-k*.012)/(.36-k*.012));
    b.particles.forEach((p,i)=>{const r=g.radius*p.radius*spread,drift=g.radius*.52*age*age;const angle=p.angle+p.skew*age;
     const alpha=fade*(.52+.48*Math.sin(p.twinkle+age*19)**2)*smooth(age/.018);
     particles.push({id:k+':'+i,x:g.x+Math.cos(angle)*r,y:g.y+Math.sin(angle)*r+drift,dx:Math.cos(angle)*(4+11*(1-age)),dy:Math.sin(angle)*(4+11*(1-age)),alpha,size:p.size,color:p.color,shape:b.style==='crystal'||i%4===0?'diamond':'line'});
    });
    b.dust.forEach((p,i)=>{const r=g.radius*p.radius*(.2+.95*spread),a=smooth((t-b.burst-.065)/.12)*(1-smooth((t-.72)/.28))*(.25+.75*Math.sin(p.phase+age*25)**2);
     particles.push({id:k+':dust:'+i,x:g.x+Math.cos(p.angle)*r,y:g.y+Math.sin(p.angle)*r+age*age*g.radius*.7,dx:0,dy:0,alpha:a,size:p.size,color:p.color,shape:'square'});
    });
   }
  });
  const phase=t<.14?'charge':t<.34?'launch':t<.58?'burst':t<.82?'glitter':'fade';
  return {progress:t,charge,halo,particles,trails,heads,centers,phase};
 }
 const cues=[{at:.045,id:'charge',index:0},...definitions.map((b,i)=>({at:b.start+.012,id:'launch',index:i})),...definitions.map((b,i)=>({at:b.burst+.004,id:'burst',index:i})),{at:.72,id:'glitter',index:0}].sort((a,b)=>a.at-b.at);
 const api=Object.freeze({version:'boom-v20',frame,bursts,definitions,palette,cues,particleCount:135,seed:'0x484D424D'});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindBoomModel=api;
})(globalThis);
