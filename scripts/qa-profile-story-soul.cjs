/* Scroll holds and the shared memory filament: independent behavioral contracts. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),g=require('../assets/profile/geometry.js');
const out=process.env.SOUL_QA_DIR||'docs/evidence/story-soul/numerical';fs.mkdirSync(out,{recursive:true});
const checks=[],check=(name,pass,data)=>checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});
const position=track=>{let a=0,b=10;for(let i=0;i<52;i++){const m=(a+b)/2;g.cameraTrack(m)<track?a=m:b=m;}return(a+b)/2;};
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const thread=p=>g.illustration(p).find(l=>l.id==='story-thread');
for(const hold of g.config.actingHolds){
 const points=[.05,hold.until*.5,hold.until-.001].map(u=>position(hold.beat+u));
 check('pose-holds-'+hold.beat,points.every(p=>JSON.stringify(g.performanceAt(p))===JSON.stringify(g.performanceAt(points[0]))));
 const cameras=points.map(p=>g.cameraAt(p));check('camera-continues-through-hold-'+hold.beat,Math.abs(cameras[0].yaw-cameras.at(-1).yaw)>.01);
 check('hold-releases-'+hold.beat,g.resolve(position(hold.beat+.82))>hold.beat+.8);
}
const positions=Array.from({length:321},(_,i)=>i/32),snapshots=positions.map(p=>JSON.stringify(g.illustration(p)));
check('story-retraces-without-history',[...positions.keys()].reverse().every(i=>JSON.stringify(g.illustration(positions[i]))===snapshots[i]));
let finite=true,attached=true,budget=true,far=false;const clearance=[];
for(const p of positions){const layer=thread(p);if(!layer)continue;
 const filament=layer.paths.find(x=>x.id==='memory-filament-0');attached&&=distance(filament.points[0],g.lightAt(p))<1e-9;
 budget&&=layer.paths.length<=44;
 for(const item of layer.paths)for(const q of item.points){finite&&=q.length===3&&q.every(Number.isFinite);far||=q.some(v=>Math.abs(v)>5);}
 for(const compact of [false,true]){
  const project=g.createProjector(p,720,720,{compact}),head=g.frame(p,2).filter(l=>l.part==='head').flatMap(l=>l.points).map(project);
  if(!head.length||p<1)continue;
  const box=[Math.min(...head.map(q=>q[0])),Math.max(...head.map(q=>q[0])),Math.min(...head.map(q=>q[1])),Math.max(...head.map(q=>q[1]))];
  const points=layer.paths.filter(x=>x.alpha*layer.alpha>.01&&x.id.startsWith('memory-')).flatMap(x=>x.points).map(project);
  if(points.some(q=>q[0]>box[0]&&q[0]<box[1]&&q[1]>box[2]&&q[1]<box[3]))clearance.push({p,compact});
 }
}
check('thread-attached-to-hand-light',attached);check('bounded-finite-thread',finite&&!far);check('thread-path-budget',budget);
check('thread-clear-of-the-head',clearance.length===0,clearance.slice(0,8));
const quiet=thread(position(13.1)),fracture=thread(position(14.1)),synthesis=thread(position(20.1));
const grains=l=>l.paths.filter(x=>x.memoryGrain&&x.alpha*l.alpha>.005).length;
check('thread-fractures-and-reforms',grains(quiet)===0&&grains(fracture)>8&&grains(synthesis)===0);
check('one-stable-filament-across-the-story',[1.1,3.1,6.1,9.1,13.1,14.1,20.1,23.1,28.1].every(t=>thread(position(t)).paths.filter(x=>x.id.startsWith('memory-filament-')).length===24));
const sample=Array.from({length:3001},(_,i)=>g.resolve(i/300));
check('performance-time-remains-monotonic',sample.every((t,i)=>!i||t>=sample[i-1]));
const waves=positions.flatMap(p=>thread(p)?.paths.filter(x=>x.id.startsWith('response-wave-')&&x.alpha>.01)||[]);
check('completed-actions-send-ripples',waves.length>0);
const result={release:g.config.release,checks};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));
const failed=checks.filter(x=>!x.pass);console.log(JSON.stringify({checks:checks.length,failed,output:out},null,2));if(failed.length)process.exitCode=1;
