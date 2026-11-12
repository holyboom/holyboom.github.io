/* Boom: deterministic geometry. One scroll coordinate, the same particles both ways.
 * No random/time integration in frame(); reversing t reconstructs the exact state. */
(function(root){
 'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},TAU=Math.PI*2;
 const palette=['#B475FF','#67E8F9','#FF7AC6','#F2CC8F','#F8F2FF'];
 const definitions=[
  {id:'crown',style:'radial',x:.48,h:.50,size:1.00,count:38,dustCount:14,start:.14,burst:.34,color:0},
  {id:'left',style:'fan',x:.17,h:.31,size:.43,count:18,dustCount:8,start:.165,burst:.415,color:1},
  {id:'right',style:'diamond',x:.64,h:.54,size:1.18,count:44,dustCount:16,start:.19,burst:.49,color:2},
  {id:'spire',style:'needle',x:.84,h:.37,size:.53,count:20,dustCount:8,start:.215,burst:.565,color:0},
  {id:'crystal',style:'crystal',x:.38,h:.55,size:1.30,count:48,dustCount:18,start:.24,burst:.64,color:3}
 ];
 let seed=0x484D424D;function rand(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
 const bursts=definitions.map((b,k)=>({...b,particles:Array.from({length:b.count},(_,i)=>{
  let angle=i/b.count*TAU;if(b.style==='fan')angle=Math.PI+(.10+i/(b.count-1)*.80)*Math.PI;
  if(b.style==='diamond')angle=Math.PI/4+Math.round(i/b.count*8)*Math.PI/4+(rand()-.5)*.14;
  return {angle,radius:.72+rand()*.28,twinkle:rand()*TAU,size:1.15+rand()*1.25,color:i%7===0?4:b.color,skew:(rand()-.5)*.15};
 }),dust:Array.from({length:b.dustCount},()=>({angle:rand()*TAU,radius:.30+rand()*.68,phase:rand()*TAU,size:.8+rand()*.9,color:rand()>.6?3:4}))}));
 function geometry(box,b){
  // Give the crown the whole space above the word, rather than its old tiny icon box.
  // Burst sizes alternate by identity. Their ratios stay the same at every viewport.
  const space=Math.max(32,box.wordTop-box.header-18);
  const zoneWidth=Math.min(box.width-24,Math.max(box.wordWidth*1.65,box.width<=680?box.width-24:480));
  const left=clamp(box.wordLeft+box.wordWidth*.48-zoneWidth*.5,12,Math.max(12,box.width-zoneWidth-12));
  const base=Math.min(zoneWidth*.285,space*.285,176),radius=base*b.size;
  const x=clamp(left+zoneWidth*b.x,12+radius,box.width-12-radius);
  const top=box.header+8+radius*1.02,bottom=box.wordTop-10-radius*1.22;
  const desired=box.wordTop-space*b.h;
  const y=clamp(desired,top,Math.max(top,bottom));
  return {x,y,radius,sizeClass:b.size>=1?'large':'small',scale:b.size};
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
    const age=clamp((t-b.burst)/(1-b.burst)),spread=1-Math.exp(-7.1*age),fade=1-smooth((t-(b.burst+.23))/(1-b.burst-.23));
    b.particles.forEach((p,i)=>{const r=g.radius*p.radius*spread,drift=g.radius*.18*age*age;const angle=p.angle+p.skew*age;
     const alpha=fade*(.52+.48*Math.sin(p.twinkle+age*13)**2)*smooth(age/.018);
     particles.push({id:k+':'+i,x:g.x+Math.cos(angle)*r,y:g.y+Math.sin(angle)*r+drift,dx:Math.cos(angle)*(5+g.radius*.18*(1-age)),dy:Math.sin(angle)*(5+g.radius*.18*(1-age)),alpha,size:p.size,color:p.color,shape:b.style==='crystal'||i%4===0?'diamond':'line'});
    });
    b.dust.forEach((p,i)=>{const r=g.radius*p.radius*(.10+.90*spread),a=smooth((t-b.burst-.065)/.12)*(1-smooth((t-.72)/.28))*(.25+.75*Math.sin(p.phase+age*16)**2);
     particles.push({id:k+':dust:'+i,x:g.x+Math.cos(p.angle)*r,y:g.y+Math.sin(p.angle)*r+age*age*g.radius*.14,dx:0,dy:0,alpha:a,size:p.size,color:p.color,shape:'square'});
    });
   }
  });
  const phase=t<.14?'charge':t<.34?'launch':t<.72?'burst':t<.88?'glitter':'fade';
  return {progress:t,charge,halo,particles,trails,heads,centers,phase};
 }
 const cues=[{at:.045,id:'charge',index:0},...definitions.map((b,i)=>({at:b.start+.012,id:'launch',index:i})),...definitions.map((b,i)=>({at:b.burst+.004,id:'burst',index:i})),{at:.84,id:'glitter',index:0}].sort((a,b)=>a.at-b.at);
 const api=Object.freeze({version:'grand-boom-v22',frame,bursts,definitions,palette,cues,particleCount:bursts.reduce((n,b)=>n+b.particles.length+b.dust.length,0),seed:'0x484D424D'});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HolyMindBoomModel=api;
})(globalThis);
