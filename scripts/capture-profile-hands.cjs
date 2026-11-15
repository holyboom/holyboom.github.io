/* Shared-geometry hand studies plus actual native-scroll page captures. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),{createRequire}=require('node:module'),{chromium}=require('playwright'),g=require('../assets/profile/geometry.js');
const out=process.env.HAND_CAPTURE_DIR||'docs/evidence/soft-hands',base=process.env.TEST_URL||'http://127.0.0.1:4174/';fs.mkdirSync(out,{recursive:true});
const position=track=>{let lo=0,hi=10;for(let i=0;i<50;i++){const m=(lo+hi)/2;g.cameraTrack(m)<track?lo=m:hi=m;}return(lo+hi)/2;};
let old=null;if(process.env.HAND_BASELINE){const m={exports:{}};vm.runInNewContext(fs.readFileSync(process.env.HAND_BASELINE,'utf8'),{module:m,exports:m.exports,require:createRequire(path.resolve('assets/profile/geometry.js'))});old=m.exports;}
const studies=[['Drawing',1.45,'R'],['Typing',3.5,'R'],['Supporting',5.4,'L'],['Reviewing',11.48,'R'],['Holding the light',17.24,'R'],['Open invitation',25.4,'R']];
const strandPieces=lines=>lines.flatMap(line=>line.group!=='hand'?[line]:Array.from({length:Math.ceil((line.points.length-1)/6)},(_,i)=>({...line,points:line.points.slice(i*6,Math.min(line.points.length,i*6+7))})));
(async()=>{const b=await chromium.launch(),errors=[],captures=[],sources=[];try{
 const rows=[];for(const [name,track,side]of studies){const p=position(track),project=g.createProjector(p,720,720),filter=l=>l.part==='hand'+side||l.part==='forearm'+side,after=g.frame(p,1).filter(filter),hand=after.filter(l=>l.part==='hand'+side).flatMap(l=>l.points.map(project));
  const before=old?old.frame(p,1).filter(filter):null,x=Math.min(...hand.map(q=>q[0]))-6,y=Math.min(...hand.map(q=>q[1]))-6,w=Math.max(...hand.map(q=>q[0]))-x+6,h=Math.max(...hand.map(q=>q[1]))-y+6;
  const svg=(lines,geometry)=>{
   const commands=strandPieces(lines.filter(l=>l.alpha>.005)).map(l=>({points:l.points.map(project),fill:'none',color:'#b17af5',alpha:l.alpha,width:l.width})),layers=geometry.illustration(p).filter(l=>l.id==='hand-skin-'+side).map(l=>({...l,paths:l.paths.map(item=>({...item,points:item.points.map(project)}))}));
   const materials=g.skinMaterials(layers).map(m=>`<radialGradient id="${m.id}" gradientUnits="userSpaceOnUse" cx="${m.cx}" cy="${m.cy}" r="${m.r}" fx="${m.fx}" fy="${m.fy}">${m.stops.map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join('')}</radialGradient>`).join('');
   for(const layer of layers)for(const item of layer.paths)commands.push({points:item.points,fill:`url(#${item.surface})`,color:`url(#${item.surface})`,alpha:item.alpha*layer.alpha,width:item.width});
   for(const c of commands)c.depth=c.points.reduce((sum,q)=>sum+q[2],0)/c.points.length;
   return `<svg viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><defs>${materials}</defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b0912"/>${commands.sort((a,b)=>a.depth-b.depth).map(c=>`<path d="${c.points.map((q,i)=>(i?'L':'M')+q[0]+','+q[1]).join(' ')}" fill="${c.fill}" stroke="${c.color}" opacity="${c.alpha}" stroke-width="${c.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;
  };
  rows.push(`<div class="name">${name}</div>${before?'<div>'+svg(before,old)+'</div>':''}<div>${svg(after,g)}</div>`);
 }
 const file=old?'comparison':'hand-studies',columns=old?'180px 340px 340px':'180px 340px';
 fs.writeFileSync(path.join(out,file+'.html'),`<!doctype html><meta charset="utf-8"><style>body{background:#0b0912;color:#e9dff2;margin:28px;font:16px Arial}main,header{display:grid;grid-template-columns:${columns};gap:20px;align-items:center}svg{display:block;width:340px;height:240px}.name{font:24px Georgia}h1{font:32px Georgia}header{padding:20px 0;color:#bca6cc}</style><h1>Softer hands · shared geometry comparison</h1><header><div>Gesture</div>${old?'<div>Before</div>':''}<div>After</div></header><main>${rows.join('')}</main>`);
 const board=await b.newPage({viewport:{width:980,height:1200}});await board.goto('file://'+path.resolve(out,file+'.html'));await board.screenshot({path:path.join(out,file+'.png'),fullPage:true});await board.close();
 // Gesture-specific study views make the selected silhouette inspectable;
 // full-page captures below retain the actual documentary camera and props.
 const gestures=[];
 for(const [name,track]of [['OPEN',30],['DRAW',1.45],['HOLD',17.24]]){
  const p=position(track),pose=g.performanceAt(p),wrist=pose.frames.wristR,origin=pose.handR;
  const yaw=name==='DRAW'?-.9:-.25,pitch=name==='HOLD'?-.9:name==='DRAW'?.4:.2;
  const local=q=>{const d=q.map((n,i)=>n-origin[i]),x=d.reduce((s,n,i)=>s+n*wrist.x[i],0),y=d.reduce((s,n,i)=>s+n*wrist.y[i],0),z=d.reduce((s,n,i)=>s+n*wrist.z[i],0),horizontal=x*Math.cos(yaw)+y*Math.sin(yaw),back=-x*Math.sin(yaw)+y*Math.cos(yaw);return [150+horizontal*1500,(name==='HOLD'?205:260)+(-z*Math.cos(pitch)+back*Math.sin(pitch))*1500,-back*Math.cos(pitch)-z*Math.sin(pitch)];};
  const layers=g.illustration(p).filter(l=>l.id==='hand-skin-R').map(l=>({...l,paths:l.paths.map(item=>({...item,points:item.points.map(local)}))}));
  const materials=g.skinMaterials(layers).map(m=>`<radialGradient id="study-${name}-${m.id}" gradientUnits="userSpaceOnUse" cx="${m.cx}" cy="${m.cy}" r="${m.r}" fx="${m.fx}" fy="${m.fy}">${m.stops.map(([o,c])=>`<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`).join('');
  const commands=strandPieces(g.frame(p,1).filter(l=>l.part==='handR')).map(l=>({points:l.points.map(local),color:'#c197ed',fill:'none',alpha:l.alpha,width:l.width}));
  for(const layer of layers)for(const item of layer.paths)commands.push({points:item.points,color:`url(#study-${name}-${item.surface})`,fill:`url(#study-${name}-${item.surface})`,alpha:layer.alpha,width:.3});
  if(name==='DRAW')commands.push({points:[pose.tool.tip,pose.tool.shaftEnd].map(local),color:'#ffd394',fill:'none',alpha:1,width:3});
  commands.sort((a,b)=>a.points.reduce((s,p)=>s+p[2],0)/a.points.length-b.points.reduce((s,p)=>s+p[2],0)/b.points.length);
  const light=local(pose.light),orb=name==='HOLD'?`<circle cx="${light[0]}" cy="${light[1]}" r="18" fill="#ffb860" opacity=".22"/><circle cx="${light[0]}" cy="${light[1]}" r="9" fill="#ffd394"/>`:'';
  gestures.push(`<figure><svg viewBox="0 0 300 330"><defs>${materials}</defs>${commands.map(c=>`<path d="${c.points.map((q,i)=>(i?'L':'M')+q[0]+','+q[1]).join(' ')}" stroke="${c.color}" fill="${c.fill}" opacity="${c.alpha}" stroke-width="${c.width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}${orb}</svg><figcaption>${name}</figcaption></figure>`);
 }
 const study=await b.newPage({viewport:{width:1040,height:500}});fs.writeFileSync(path.join(out,'c-glove.html'),`<!doctype html><meta charset="utf-8"><style>body{margin:24px;background:#0b0912;color:#e9dff2;font:15px Arial}h1{font:32px Georgia}main{display:flex;gap:24px}figure{width:300px;margin:0}figcaption{text-align:center;letter-spacing:.25em;color:#c197ed}small{display:block;margin-top:20px;color:#aa9bb8}</style><h1>C · Pebble glove</h1><main>${gestures.join('')}</main><small>Production glove geometry · enlarged posed studies</small>`);await study.goto('file://'+path.resolve(out,'c-glove.html'));await study.screenshot({path:path.join(out,'c-glove.png'),fullPage:true});await study.close();
 for(const [view,viewport]of Object.entries({desktop:{width:1440,height:1000},mobile:{width:390,height:844}})){
  const page=await b.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'profile/');await page.waitForFunction(()=>window.ProfileExperience&&window.ProfileGeometry);await page.evaluate(()=>document.fonts.ready);
  sources.push({view,...await page.evaluate(()=>({release:ProfileScenes.release,geometry:document.querySelector('script[src*="geometry.js"]').src}))});
  for(const [name,track]of [['drawing',1.45],['typing',3.5],['light',17.24],['choice',24.5]]){
   const p=position(track);await page.evaluate(pos=>{const a=ProfileExperience.snapshot().anchors,c=Math.floor(pos),f=ProfileGeometry.config.morph;scrollTo({top:a[c]+(a[c+1]-a[c])*(f.start+(f.end-f.start)*(pos-c)),behavior:'instant'});},p);
   await page.waitForFunction(p=>Math.abs(ProfileExperience.snapshot().current-p)<.001&&ProfileExperience.snapshot().current===ProfileExperience.snapshot().target,p);await page.waitForTimeout(250);
   const file=view+'-'+name+'.png';await page.screenshot({path:path.join(out,file)});captures.push({view,name,track,position:p,file});
  }await page.close();
 }
 const sourceHash=crypto.createHash('sha256').update(fs.readFileSync('assets/profile/geometry.js')).digest('hex');fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({release:g.config.release,sourceHash,captures,sources,errors,notes:['Hand studies enlarge shared geometry in the actual authored viewing direction. They are not full-page screenshots.','Desktop/mobile images are actual native-scroll Canvas captures in headless Chromium.']},null,2));console.log(JSON.stringify({captures:captures.length,errors,out}));if(errors.length)process.exitCode=1;
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
