/* Exercise the actual Canvas/SVG plane kernels without running the art builder.
   The camera-space distance invariant rejects the former ray-horizon blow-up. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const g=require('../assets/profile/geometry.js');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name),'utf8');
const canvasSource=read('assets/profile/living.js'),svgSource=read('scripts/build-profile-art.cjs');
const canvasStart=canvasSource.indexOf('  const cameraDistance='),canvasEnd=canvasSource.indexOf('  const ink=line=>',canvasStart);
const svgStart=svgSource.indexOf('function painter('),svgEnd=svgSource.indexOf('\nfor(let state=',svgStart);
if([canvasStart,canvasEnd,svgStart,svgEnd].some(n=>n<0))throw Error('Painter test extraction boundaries changed; update this harness.');
const canvas=vm.runInNewContext('(project,illustrations)=>{'+canvasSource.slice(canvasStart,canvasEnd)+'return {plane,depthAt,splitAcrossPlane};}',{g});
const svgContext={g};vm.createContext(svgContext);
const instrumented=svgSource.slice(svgStart,svgEnd).replace('return {commands:commands.sort','return {plane,depthAt,splitAcrossPlane,commands:commands.sort');
if(instrumented===svgSource.slice(svgStart,svgEnd))throw Error('SVG painter return changed; update this harness.');
vm.runInContext(instrumented,svgContext);
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
function positionAt(t){let lo=0,hi=10;for(let j=0;j<48;j++){const mid=(lo+hi)/2;if(g.resolve(mid)<t)lo=mid;else hi=mid;}return(lo+hi)/2;}
function oldPlane(layers,project){
 const item=layers.flatMap(layer=>layer.paths).find(p=>p.fill&&p.points.length>8);if(!item)return null;
 const p=item.points,a=p[0],b=p[Math.floor(p.length/3)],c=p[Math.floor(p.length*2/3)],d=project.camera.distance,dx=b[0]-a[0],dy=b[1]-a[1],ex=c[0]-a[0],ey=c[1]-a[1],det=dx*ey-dy*ex;
 if(Math.abs(det)<=.01)return null;
 const az=1/(d-a[2]),dz=1/(d-b[2])-az,ez=1/(d-c[2])-az,x=(dz*ey-ez*dy)/det,y=(dx*ez-ex*dz)/det;
 return q=>{const inverse=az+x*(q[0]-a[0])+y*(q[1]-a[1]);return inverse>1e-5?q[2]-d+1/inverse:null;};
}
const failures=[],labels=[];let cases=0,pointSamples=0,signSamples=0,maxKey=0,maxParityError=0,maxIntersectionError=0,skinPatches=0;
const angles=[0,30,60,80,89,90,91,100,135,180];
for(const timeline of [2,3,6,14,15,20,23,27]){
 const position=positionAt(timeline),world=g.frame(position,2).filter(l=>l.alpha>.005&&l.points.length>1),objects=g.illustration(position,1);
 for(const [width,height,compact]of [[696,860,false],[390,228,true]])for(const degrees of angles){
  // Neutral strength bypasses authored orbit locks, allowing a complete angular
  // sweep at one unchanged pivot, distance and pose.
  const project=g.createProjector(position,width,height,{compact,strength:0,yaw:degrees*Math.PI/180+.20}),lines=world.map(l=>({...l,points:l.points.map(project)})),layers=objects.map(l=>({...l,paths:l.paths.map(item=>({...item,points:item.points.map(project)}))}));
  const live=canvas(project,layers),fallback=svgContext.painter(lines,layers,project),legacy=degrees===0?oldPlane(layers,project):null;cases++;
  const caseId={timeline,width,degrees};
  for(const command of fallback.commands)if(!Number.isFinite(command.depth))failures.push({...caseId,reason:'nonfinite-command'});
  for(const command of fallback.commands.filter(c=>c.item?.skin)){
   skinPatches++;const points=command.item.points,depths=points.map(live.depthAt);
   if(points.length<4||distance(points[0],points.at(-1))>1e-8)failures.push({...caseId,reason:'open-skin-polygon'});
   if(live.plane&&Math.min(...depths)<-1e-8&&Math.max(...depths)>1e-8)failures.push({...caseId,reason:'skin-straddles-work-plane'});
  }
  for(const line of lines)for(const q of line.points){
   pointSamples++;const key=live.depthAt(q),other=fallback.depthAt(q);maxKey=Math.max(maxKey,Math.abs(key));maxParityError=Math.max(maxParityError,Math.abs(key-other));
   const k=(project.camera.distance-q[2])/project.scale,point=[(q[0]-project.center[0])*k,(project.center[1]-q[1])*k,q[2]],bound=live.plane?distance(point,live.plane.a):Math.abs(q[2]);
   if(!Number.isFinite(key)||Math.abs(key)>bound+1e-8)failures.push({...caseId,reason:'key-exceeds-geometric-distance-bound',key,bound});
   if(legacy){const previous=legacy(q);if(previous!==null&&Math.abs(previous)>1e-6&&Math.abs(key)>1e-6){signSamples++;if(Math.sign(previous)!==Math.sign(key))failures.push({...caseId,reason:'front-contact-side-changed',previous,key});}}
  }
  if(live.plane)for(const line of lines.filter(l=>/^(torso|head|upperArm|forearm|hand|leg)/.test(l.part||'')||l.group==='tool')){
   const split=live.splitAcrossPlane(line.points);for(let i=1;i<split.length;i++)maxIntersectionError=Math.max(maxIntersectionError,Math.abs(live.depthAt(split[i][0])));
  }
  if(degrees===0||degrees===180){labels.push({...caseId,visibility:fallback.labelVisibility});if(degrees===0&&fallback.labelVisibility<.99||degrees===180&&fallback.labelVisibility>.001)failures.push({...caseId,reason:'label-facing-policy',visibility:fallback.labelVisibility});}
 }
}
const checks=[
 {name:'side-and-rear-keys-obey-geometric-distance-bound',pass:!failures.some(f=>/key-|nonfinite/.test(f.reason))},
 {name:'canvas-and-svg-use-identical-plane-depth',pass:maxParityError===0},
 {name:'split-intersections-land-on-the-work-plane',pass:maxIntersectionError<1e-8},
 {name:'front-contact-ordering-keeps-its-previous-side',pass:signSamples>10000&&!failures.some(f=>f.reason==='front-contact-side-changed')},
 {name:'labels-face-front-and-disappear-behind-work',pass:!failures.some(f=>f.reason==='label-facing-policy')},
 {name:'glove-skin-patches-remain-closed-after-clipping',pass:skinPatches>0&&!failures.some(f=>f.reason==='open-skin-polygon')},
 {name:'glove-skin-does-not-leak-across-the-work-plane',pass:skinPatches>0&&!failures.some(f=>f.reason==='skin-straddles-work-plane')}
];
const sources=Object.fromEntries(['assets/profile/living.js','scripts/build-profile-art.cjs','assets/profile/geometry.js'].map(name=>[name,crypto.createHash('sha256').update(read(name)).digest('hex')]));
const report={generatedAt:new Date().toISOString(),sources,cases,pointSamples,frontContactSignSamples:signSamples,maxKey,maxParityError,maxIntersectionError,checks,failures:failures.slice(0,30),labels};
const directory=path.resolve(process.env.PAINTER_QA_DIR||path.join(root,'docs/evidence/locked-orbits'));fs.mkdirSync(directory,{recursive:true});fs.writeFileSync(path.join(directory,'painter.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>!c.pass),cases,pointSamples,maxKey,maxParityError,maxIntersectionError}));
if(checks.some(c=>!c.pass))process.exitCode=1;
