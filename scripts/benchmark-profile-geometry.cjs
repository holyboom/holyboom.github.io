/* Isolated Node geometry CPU/heap benchmark; no Canvas, GPU, browser or FPS claim.
   Run: node --expose-gc scripts/benchmark-profile-geometry.cjs --out path.json
   Each measurement case gets a fresh process. No runtime source is edited. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),os=require('node:os');
const root=path.resolve(__dirname,'..'),worker=process.argv.indexOf('--worker');
const stats=a=>{const s=[...a].sort((x,y)=>x-y),at=p=>s[Math.min(s.length-1,Math.floor(p*(s.length-1)))];return {samples:a.length,medianMs:at(.5),p95Ms:at(.95),minMs:s[0],maxMs:s.at(-1),meanMs:a.reduce((x,y)=>x+y,0)/a.length};};
if(worker>=0){
 if(!global.gc)throw new Error('Run benchmark workers with --expose-gc');
 const kind=process.argv[worker+1],beforeImport=process.memoryUsage().heapUsed,g=require(path.join(root,'assets/profile/geometry.js'));
 const positions=g.sequence.map(s=>s.chapter+s.step/s.count),midpoints=g.sequence.slice(0,-1).map(s=>s.chapter+(s.step+.55)/s.count);let sink=0;
 const gc=()=>{global.gc();global.gc();return process.memoryUsage().heapUsed;};
 const importHeap=gc();
 const consume=lines=>{sink+=lines.length+lines[0].points[0][0];};
 const warmAll=detail=>{for(const pos of positions)consume(g.frame(pos,detail));for(const pos of midpoints)consume(g.frame(pos,detail));};
 if(kind==='heap'){
  warmAll(1);const framesHeap=gc();for(const pos of [...positions,...midpoints]){g.illustration(pos);g.cameraAt(pos);}const allHeap=gc();
  process.stdout.write(JSON.stringify({kind,sequenceCount:g.sequence.length,lineCount:g.LINES,samplesPerStrand:g.SAMPLES,heapBytes:{beforeImport,afterImport:importHeap,afterAllFrameCaches:framesHeap,afterAllSceneCaches:allHeap,frameCacheGrowth:framesHeap-importHeap,allCacheGrowth:allHeap-importHeap},sink}));
 }else if(kind.startsWith('frame')){
  const detail=Number(kind.at(-1)),cold=[];for(const pos of positions){const t=performance.now();consume(g.frame(pos,detail));cold.push(performance.now()-t);}warmAll(detail);
  for(let i=0;i<120;i++)consume(g.frame(midpoints[i%midpoints.length],detail));gc();const warm=[];
  for(let i=0;i<180;i++){const pos=midpoints[(i*7)%midpoints.length],t=performance.now();consume(g.frame(pos,detail));warm.push(performance.now()-t);}
  process.stdout.write(JSON.stringify({kind,detail,coldPerScene:stats(cold),warmMidTransitions:stats(warm),sink}));
 }else if(kind==='light'){
  warmAll(2);for(let i=0;i<80;i++)g.lightTrail(midpoints[i%midpoints.length],1,.25,36);gc();
  const measurements={};for(const [name,fn]of [['pose',p=>g.motion.poseAt(g.resolve(p))],['lightAt',p=>g.lightAt(p)],['trail36',p=>g.lightTrail(p,1,.25,36)],['frameDetail2',p=>g.frame(p,2)]]){const values=[];for(let i=0;i<180;i++){const p=midpoints[(i*7)%midpoints.length],t=performance.now();fn(p);values.push(performance.now()-t);}measurements[name]=stats(values);}
  process.stdout.write(JSON.stringify({kind,measurements,sink}));
 }else throw new Error('Unknown worker '+kind);
}else{
 const files=['assets/profile/geometry.js','assets/profile/motion.js','assets/profile/hand-shapes.js','assets/profile/scenes.js'],sha=Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
 const result={capturedAt:new Date().toISOString(),node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,sourceSHA256:sha,method:'Fresh --expose-gc Node workers; warm full sequence; CPU geometry only. Not browser/device FPS. Timing is order- and JIT-sensitive; compare repeated runs with equal detail.',cases:[]};
 for(const kind of ['heap','frame1','frame2','light']){const p=spawnSync(process.execPath,['--expose-gc',__filename,'--worker',kind],{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024});if(p.status!==0)throw new Error(kind+': '+p.stderr);result.cases.push(JSON.parse(p.stdout));}
 const ix=process.argv.indexOf('--out');if(ix>=0){const out=path.resolve(process.argv[ix+1]);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');}process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
