/* Fallback art uses the exact articulated human geometry of the live renderer. */
const fs=require('node:fs'),path=require('node:path');
const story=require('./data/profile-story.json');
const configPath=path.join(__dirname,'../assets/profile/scenes.js');
const source=fs.readFileSync(configPath,'utf8');
const beats=story.chapters.map(c=>({chapter:c.scene,beats:c.beats}));
const assignment=' // BEGIN GENERATED STORY\n config.story='+JSON.stringify(beats)+';\n // END GENERATED STORY';
let generated=source.includes('// BEGIN GENERATED STORY')?source.replace(/ \/\/ BEGIN GENERATED STORY[\s\S]*? \/\/ END GENERATED STORY/,assignment):source.replace(" if(typeof module",assignment+"\n if(typeof module");
const review=require('./data/profile-gemini-copy.json').items,baseScenes={},canvasText={};
for(const row of review){if(row.kind==='In-scene label')canvasText[row.originalEnglish]=row.english;if(row.kind.startsWith('Animation / ')){const chapter=Number(/chapter (\d+)/.exec(row.sourceEn)[1]);if([0,9,10].includes(chapter)){const key=row.kind.split(' / ')[1];(baseScenes[chapter]??={})[key]=row.english;if(key==='action')baseScenes[chapter].verb=row.english;}}}
const finaleLabels={en:{},th:{}};for(const row of review){if(row.kind==='Head / orbit caption'){const key=row.section.split(' / ')[1];finaleLabels.en[key]=row.english;finaleLabels.th[key]=row.thai;}if(row.kind==='Two-skill caption'){finaleLabels.en.synthesis=row.english;finaleLabels.th.synthesis=row.thai;}}
const copyAssignment=' // BEGIN GENERATED REVIEW\n config.reviewFinale='+JSON.stringify(finaleLabels)+';config.text='+JSON.stringify(canvasText)+';Object.entries('+JSON.stringify(baseScenes)+').forEach(([i,s])=>Object.assign(config.scenes[i],s));\n // END GENERATED REVIEW';
generated=generated.includes('// BEGIN GENERATED REVIEW')?generated.replace(/ \/\/ BEGIN GENERATED REVIEW[\s\S]*? \/\/ END GENERATED REVIEW/,copyAssignment):generated.replace(" if(typeof module",copyAssignment+"\n if(typeof module");
if(generated!==source)fs.writeFileSync(configPath,generated);
const g=require('../assets/profile/geometry.js');
const dir=process.env.PROFILE_ART_DIR?path.resolve(process.env.PROFILE_ART_DIR):path.join(__dirname,'../assets/profile/fallback');fs.mkdirSync(dir,{recursive:true});
const color=(l,accent)=>l.group==='world'?accent:['code','network'].includes(l.group)?g.config.palette.world:['intent','tool'].includes(l.group)?g.config.tones.human:['prop','architecture'].includes(l.group)?g.config.palette.highlight:g.config.palette.line;
const escape=text=>String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const n=value=>value.toFixed(2);
const toPath=points=>{let d=`M${n(points[0][0])} ${n(points[0][1])}`;
 for(let i=1;i<points.length-1;i++){const p=points[i],q=points[i+1];d+=`Q${n(p[0])} ${n(p[1])} ${n((p[0]+q[0])/2)} ${n((p[1]+q[1])/2)}`;}
 const p=points.at(-1);return d+`L${n(p[0])} ${n(p[1])}`;
};
// Mirror the Canvas painter's horizon-free, normalized camera-space plane.
// Keep this algorithm aligned with assets/profile/living.js when compositing changes.
function painter(lines,layers,project){
 const cameraDistance=project.camera.distance,projectionScale=project.scale,[centerX,centerY]=project.center;
 const cameraPoint=q=>{const k=(cameraDistance-q[2])/projectionScale;return [(q[0]-centerX)*k,(centerY-q[1])*k,q[2]];};
 const screenPoint=q=>{const k=projectionScale/Math.max(project.camera.near||.25,cameraDistance-q[2]);return [centerX+q[0]*k,centerY-q[1]*k,q[2]];};
 const planeItem=layers.filter(layer=>layer.role==='front-work').flatMap(layer=>layer.paths).find(item=>item.fill&&item.points.length>8);
 let plane=null;
 if(planeItem){
  const points=planeItem.points,a=cameraPoint(points[0]),b=cameraPoint(points[Math.floor(points.length/3)]),c=cameraPoint(points[Math.floor(points.length*2/3)]),u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
  const normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...normal);
  if(length>1e-9){const n=normal.map(value=>value/length),facing=-n[0]*a[0]-n[1]*a[1]+n[2]*(cameraDistance-a[2]);plane={a,n,side:facing<0?-1:1,facing:facing/Math.hypot(a[0],a[1],cameraDistance-a[2])};}
 }
 const depthAt=q=>{
  if(!plane)return q[2];
  const k=(cameraDistance-q[2])/projectionScale,n=plane.n,a=plane.a;
  return plane.side*(n[0]*((q[0]-centerX)*k-a[0])+n[1]*((centerY-q[1])*k-a[1])+n[2]*(q[2]-a[2]));
 };
 const depthOf=points=>points.reduce((sum,q)=>sum+depthAt(q),0)/points.length,commands=[];
 const splitAcrossPlane=source=>{
  const fragments=[];let points=[source[0]],previousDepth=depthAt(source[0]);
  for(let i=1;i<source.length;i++){
   const q=source[i],depth=depthAt(q);
   if((depth<0)!==(previousDepth<0)&&Math.abs(depth-previousDepth)>1e-8){
    const previousPoint=cameraPoint(source[i-1]),nextPoint=cameraPoint(q),t=previousDepth/(previousDepth-depth),crossing=screenPoint(previousPoint.map((value,axis)=>g.mix(value,nextPoint[axis],t)));
    points.push(crossing);fragments.push(points);points=[crossing];
   }
   points.push(q);previousDepth=depth;
  }
  fragments.push(points);return fragments;
 };
 for(const line of lines){
  if(line.group==='hand'){
   for(let i=0;i<line.points.length-1;i+=6){const section=line.points.slice(i,Math.min(line.points.length,i+7));
    for(const points of plane?splitAcrossPlane(section):[section])commands.push({kind:'strand',depth:depthOf(points)+1e-5,line:{...line,points}});
   }continue;
  }
  if(plane&&(/^(torso|head|upperArm|forearm|hand|leg)/.test(line.part||'')||line.group==='tool')){
   for(const points of splitAcrossPlane(line.points))commands.push({kind:'strand',depth:depthOf(points),line:{...line,points}});
  }else commands.push({kind:'strand',depth:depthOf(line.points),line});
 }
 for(const layer of layers){
  const stacks=new Map(),scenicFocus=g.sceneryFocus(layer,project);
  for(const item of layer.paths){
   if(layer.role==='surroundings'){
    const alpha=layer.alpha*g.sceneryOpacity(item.points,scenicFocus);if(alpha*item.alpha>.001)commands.push({kind:'prop',depth:-100+depthOf(item.points)*.001,item,alpha});continue;
   }
   if(item.skin){
    const fragments=plane?g.clipFilled(item.points,depthAt,cameraPoint,screenPoint):[item.points];
    for(const points of fragments)commands.push({kind:'prop',depth:depthOf(points),item:{...item,points},alpha:layer.alpha});continue;
   }
   if(plane&&layer.role==='front-work'&&item.role==='volume'&&!item.fill){
    for(const points of splitAcrossPlane(item.points))commands.push({kind:'prop',depth:depthOf(points),item:{...item,points},alpha:layer.alpha});continue;
   }
   const role=item.role||'work';if(!stacks.has(role))stacks.set(role,{depth:depthOf(item.points),index:0});
   const stack=stacks.get(role);commands.push({kind:'prop',depth:(role==='volume'?depthOf(item.points):stack.depth)+stack.index++*1e-6,item,alpha:layer.alpha});
  }
 }
 return {commands:commands.sort((a,b)=>a.depth-b.depth),labelVisibility:g.workLabelVisibility(layers,project)};
}
for(let state=0;state<g.config.scenes.length;state++){
 const project=g.createProjector(state,720,720);
 const accent=g.paletteAt(state).accent,lines=g.projectLines(g.frame(state,2).filter(l=>l.alpha>.005&&l.points.length>1),project);
 const layers=g.projectIllustrations(g.illustration(state),project);
 const mesh=line=>{
  const depth=line.points[Math.floor(line.points.length/2)][2],ink=line.group==='fabric'&&depth>.3?g.config.palette.highlight:color(line,accent);
  let svg=`<path d="${toPath(line.points)}" stroke="${ink}" stroke-width="${line.id===0?1.6:line.width}" opacity="${(line.alpha*g.clamp(.72+depth*.10,.25,1)).toFixed(3)}"/>`;
  if(line.important&&['human','fabric'].includes(line.group)){const q=line.points[Math.floor(line.points.length/4)];svg+=`<circle cx="${n(q[0])}" cy="${n(q[1])}" r=".9" fill="${g.config.palette.highlight}" opacity="${(line.alpha*.75).toFixed(3)}"/>`;}
  if(line.id===0){const q=line.points[0];svg+=`<circle cx="${n(q[0])}" cy="${n(q[1])}" r="${state===0?2.6:2.0}" fill="#eefff8" opacity="${line.alpha}"/>`;}
  return svg;
 };
 const skinMaterials=g.skinMaterials(layers).map(m=>`<radialGradient id="${m.id}" gradientUnits="userSpaceOnUse" cx="${n(m.cx)}" cy="${n(m.cy)}" r="${n(m.r)}" fx="${n(m.fx)}" fy="${n(m.fy)}">${m.stops.map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join('')}</radialGradient>`).join('');
 const painted=painter(lines,layers,project),objects=painted.commands.map(command=>{
  if(command.kind==='strand')return mesh(command.line);
  const item=command.item,d=item.skin?item.points.map((p,i)=>(i?'L':'M')+n(p[0])+' '+n(p[1])).join('')+'Z':toPath(item.points),material=item.skin?`url(#${item.surface})`:null;return `<path${item.secondary?' class="ambient-secondary"':''} d="${d}" fill="${material||item.fill||'none'}" stroke="${material||item.color}" stroke-width="${item.width}" opacity="${(command.alpha*item.alpha).toFixed(3)}"/>`;
 }).join('');
 const labels=layers.map(layer=>{
  const alpha=(layer.textAlpha??layer.alpha)*(layer.role==='front-work'?painted.labelVisibility:1);if(alpha<=.005)return '';
  return `<g class="art-label" opacity="${alpha.toFixed(3)}">${layer.texts.map(t=>{const p=project(t.point);return `<text x="${n(p[0])}" y="${n(p[1])}" fill="${t.color}" font-family="Arial,sans-serif" font-size="${t.size}" text-anchor="middle">${escape(t.text)}</text>`;}).join('')}</g>`;
 }).join('');
 const seed=lines.find(line=>line.id===0)?.points[0],halo=seed?`<circle cx="${n(seed[0])}" cy="${n(seed[1])}" r="${state===0?9:7}" fill="${g.config.tones.human}" filter="url(#glow)"/>`:'';
 const shot=g.storyAt(state);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 720" role="img" aria-labelledby="scene-title scene-description"><title id="scene-title">${escape(shot.action)}</title><desc id="scene-description">${escape(shot.caption)}</desc><style>@media(max-width:560px){.art-label,.ambient-secondary{display:none}}</style><defs><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter>${skinMaterials}</defs>${halo}<g fill="none" stroke-linecap="round" stroke-linejoin="round">${objects}</g>${labels}</svg>`;
 fs.writeFileSync(path.join(dir,`scene-${state}.svg`),svg);
}
console.log(`Generated ${g.config.scenes.length} woven narrative SVGs (${g.LINES} identity-preserving strands).`);
// Localized fallback images reuse the identical paths and approved copy slots.
const approved=require('./data/profile-gemini-copy.json').items;
const thaiDir=path.join(dir,'th');fs.mkdirSync(thaiDir,{recursive:true});
const thaiFont=fs.readFileSync(path.join(__dirname,'../assets/fonts/noto-sans-thai.woff2')).toString('base64');
for(let state=0;state<g.config.scenes.length;state++){
 const slots=approved.filter(r=>r.kind==='Shared SVG text'&&r.section===`Fallback / scene-${state}`);
 const filename=path.join(dir,`scene-${state}.svg`),original=fs.readFileSync(filename,'utf8');
 function localize(language){let index=0;const result=original.replace(/(<(?:title|desc|text)\b[^>]*>)([\s\S]*?)(<\/(?:title|desc|text)>)/g,(_,open,text,close)=>{
  const slot=slots[index++];if(!slot)throw Error(`Missing approved fallback slot ${state}/${index}`);
  return open+escape(language==='th'?slot.thai:slot.english)+close;
 });if(index!==slots.length)throw Error(`Fallback copy count differs: ${state}`);return result;}
 fs.writeFileSync(filename,localize('en'));
 const thai=localize('th').replace(/(<svg\b[^>]*>)/,`$1<style>@font-face{font-family:ProfileThai;src:url(data:font/woff2;base64,${thaiFont}) format('woff2')}text{font-family:ProfileThai,Arial,sans-serif}</style>`);
 fs.writeFileSync(path.join(thaiDir,`scene-${state}.svg`),thai);
}
