/* Four terrain families, 31 authored worlds. Pure scroll geometry, no clock. */
(function(root){'use strict';
 const cfg=typeof module==='object'&&module.exports?require('./scenes.js'):root.ProfileScenes;
 const PI=Math.PI,TAU=PI*2,COUNT=100,SAMPLES=48,CENTER=[-.46,.12],Y=-1.30;
 const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=v=>{v=clamp(v);return v*v*(3-2*v);},lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
 const cache=new Map();
 function bounded(q){const x=q[0]-CENTER[0],z=q[2]-CENTER[1],r=Math.hypot(x/2.05,z/1.45),scale=r>1?1/r:1;return [CENTER[0]+x*scale,q[1],CENTER[1]+z*scale];}
 function polar(r,a,h=0,p={}){const turn=a+(p.turn||0),shape=1+(p.lobes||0)*Math.cos((p.petals||3)*a+(p.phase||0));return bounded([CENTER[0]+Math.cos(turn)*r*shape*(p.wide||1.08),Y+h,CENTER[1]+Math.sin(turn)*r*shape*(p.deep||.76)]);}
 function terraceHeight(r,p){let h=0;for(let i=0;i<p.levels;i++)h-=p.rise*smooth((r-(.66+i*.35))/.10);return h;}
 function basinHeight(r,a,p){const rim=smooth((r-.66)/.30)*(1-smooth((r-1.23)/.55));return -p.depth*rim*(1+(p.skew||0)*Math.cos(a-p.turn));}
 function streamPoint(branch,t,width,p){
  const a=p.turn+branch/p.branches*TAU,r=.48+t*1.36,bend=p.bend*Math.sin(PI*t)+.14*Math.sin(t*TAU+p.phase),angle=a+bend;
  const q=polar(r,angle,-.025*t+.035*Math.sin(PI*t)*(branch%2?1:-1),p),nx=-Math.sin(angle),nz=Math.cos(angle)*.76;
  return bounded([q[0]+nx*width,q[1]-.018*width*width,q[2]+nz*width]);
 }
 function island(i,p){
  const a=p.turn+i/p.islands*TAU,r=1.04+(i%2)*.48+(p.spread||0),q=polar(r,a,p.lift*Math.sin(a*1.7+p.phase)-.08,p);
  return {center:q,rx:.24+.045*((i+Math.round(p.phase*3))%3),rz:.20+.03*(i%2),ry:.105+.02*(i%3),a};
 }
 function pebble(info,u,a){const b=(u-.5)*PI,c=Math.cos(b);return bounded([info.center[0]+Math.cos(a)*c*info.rx,info.center[1]+Math.sin(b)*info.ry,info.center[2]+Math.sin(a)*c*info.rz]);}
 function bridge(i,t,width,p){
  const target=island(i,p),start=polar(.48,target.a,0,p),end=[target.center[0],target.center[1]+target.ry*.45,target.center[2]],q=lerp(start,end,smooth(t)),bow=Math.sin(PI*t);
  return bounded([q[0]-Math.sin(target.a)*width,q[1]+p.bridge*bow,q[2]+Math.cos(target.a)*width*.76]);
 }
 function point(index,line,t){
  const p=cfg.floors[index],q=line/99;
  if(p.family==='terraces'){
   const r=line<58?.10+line/57*1.83:.10+t*1.83,a=line<58?t*TAU:(line-58)/42*TAU;
   return polar(r,a,terraceHeight(r,p),p);
  }
  if(p.family==='well'){
   const r=line<54?.10+line/53*1.85:.10+t*1.85,a=line<54?t*TAU:(line-54)/46*TAU;
   return polar(r,a,basinHeight(r,a,p),p);
  }
  // Every dispersed world starts from a quiet, level place for the maker.
  if(line<20){const r=line<12?.12+line/11*.46:.12+t*.46,a=line<12?t*TAU:(line-12)/8*TAU;return polar(r,a,0,p);}
  if(p.family==='paths'){
   const local=line-20,branch=local%p.branches,k=Math.floor(local/p.branches),n=Math.ceil(80/p.branches);
   if(k<n-4)return streamPoint(branch,t,(k/(n-5)-.5)*p.width,p);
   return streamPoint(branch,(k-(n-4)+1)/5,(t-.5)*p.width,p);
  }
  if(line<80){const local=line-20,i=local%p.islands,k=Math.floor(local/p.islands),n=Math.ceil(60/p.islands),info=island(i,p);
   return k<n/2?pebble(info,(k+1)/(n/2+1),t*TAU):pebble(info,t,(k-Math.ceil(n/2))/Math.ceil(n/2)*TAU);
  }
  const local=line-80,i=local%p.islands,k=Math.floor(local/p.islands),n=Math.ceil(20/p.islands);
  return bridge(i,t,(k/(Math.max(1,n-1))-.5)*.14,p);
 }
 function disc(r,p,h=0){return Array.from({length:49},(_,i)=>polar(r,i/48*TAU,h,p));}
 function scene(index){
  if(cache.has(index))return cache.get(index);const p=cfg.floors[index],lines=Array.from({length:COUNT},(_,line)=>({
   id:line,points:Array.from({length:SAMPLES},(_,i)=>point(index,line,i/(SAMPLES-1))),alpha:p.ink*(line%8===0?1:.66),width:line%8===0?.95:.58,important:line%8===0
  }));
  const plates=[{points:disc(.57,p),alpha:.23,fill:'#21162f'}];
  if(p.family==='terraces')for(let i=p.levels-1;i>=0;i--){const r=.67+i*.35;plates.push({points:disc(r,p,terraceHeight(r+.06,p)),alpha:.18,fill:i%2?'#171320':'#1d152a'});}
  if(p.family==='paths')for(let b=0;b<p.branches;b++){const points=Array.from({length:25},(_,i)=>streamPoint(b,i/24,-p.width*.5,p));points.push(...Array.from({length:25},(_,i)=>streamPoint(b,1-i/24,p.width*.5,p)),points[0]);plates.push({points,alpha:.17,fill:'#171723'});}
  if(p.family==='islands')for(let i=0;i<p.islands;i++){const info=island(i,p),points=Array.from({length:49},(_,j)=>{const a=j/48*TAU;return bounded([info.center[0]+Math.cos(a)*info.rx,info.center[1]+info.ry*.12,info.center[2]+Math.sin(a)*info.rz]);});plates.push({points,alpha:.24,fill:'#20162d'});}
  const value={index,recipe:p,lines,plates};cache.set(index,value);return value;
 }
 function deformer(raw,pose){
  const pulse=Math.sin(PI*raw)**2,m=cfg.floorMotion,angle=pulse*m.turn,c=Math.cos(angle),s=Math.sin(angle),radius=1-pulse*m.squeeze,feet=pose.feet.map(f=>[f[0],f[2]+.07]);
  return q=>{
   const x=q[0]-CENTER[0],z=q[2]-CENTER[1],outside=smooth((Math.hypot(x,z)-.62)/.4),v=[CENTER[0]+radius*(x*c-z*s),q[1]-m.sink*pulse*outside,CENTER[1]+radius*(x*s+z*c)];
   const nearest=Math.min(Math.hypot(v[0]-feet[0][0],v[2]-feet[0][1]),Math.hypot(v[0]-feet[1][0],v[2]-feet[1][1]));if(nearest<.4)v[1]=mix(v[1],pose.support.floorY,smooth(1-nearest/.40));return v;
  };
 }
 const deform=(q,raw,pose)=>deformer(raw,pose)(q);
 function layers(timeline,pose,accent){
  const a=Math.floor(timeline),b=Math.min(cfg.floors.length-1,a+1),raw=timeline-a,t=smooth((raw-.36)/.64),indices=a===b?[[a,1]]:[[a,1-t],[b,t]],transform=deformer(raw,pose);
  return indices.filter(([,weight])=>weight>.002).map(([index,weight])=>({id:'terrain-'+index,role:'surroundings',alpha:weight,textAlpha:0,texts:[],paths:scene(index).plates.map((plate,i)=>({id:'terrain-'+index+'-plate-'+i,points:plate.points.map(transform),alpha:plate.alpha,fill:plate.fill,color:accent,width:.4,role:'surroundings',secondary:false}))}));
 }
 const api={COUNT,SAMPLES,CENTER,Y,scene,deform,deformer,layers};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileFloors=api;
})(typeof globalThis!=='undefined'?globalThis:this);
