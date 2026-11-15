/* Contracts for the selected C glove: closed skin, contact tips and sparse IDs. */
const fs=require('node:fs'),path=require('node:path'),hands=require('../assets/profile/hand-shapes.js'),g=require('../assets/profile/geometry.js');
const checks=[],failures=[],check=(name,pass)=>{checks.push({name,pass:!!pass});if(!pass)console.error('FAIL',name);},distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
let shapes=0,vertices=0,maxClosure=0,maxTip=0,maxJoin=0,nonfinite=0,mutated=0;
for(const side of [-1,1])for(const shape of [...hands.grips.map(grip=>hands.pose(grip,side)),...[.25,.5,.75].map(t=>hands.sample('open','write',t,side)),hands.press(.5,side)]){
 const before=JSON.stringify(shape),skin=hands.skin(shape);shapes++;
 for(let i=0;i<5;i++){
  const fn=skin.fingers[i],base=fn(0,0),tip=shape.fingers[i].points.at(-1);
  for(let j=0;j<16;j++){const a=j/16*Math.PI*2;maxClosure=Math.max(maxClosure,distance(base,fn(0,a)));maxTip=Math.max(maxTip,distance(tip,fn(1,a)));for(const boundary of [.12,.7888])maxJoin=Math.max(maxJoin,distance(fn(boundary-1e-6,a),fn(boundary+1e-6,a)));}
  for(let u=0;u<=20;u++)for(let j=0;j<12;j++){vertices++;if(!fn(u/20,j/12*Math.PI*2).every(Number.isFinite))nonfinite++;}
 }
 if(before!==JSON.stringify(shape))mutated++;
}
check('five-digits-through-all-grips-and-blends',shapes===24);check('finger-bases-are-closed',maxClosure<1e-10);check('skin-tips-are-exact-contact-tips',maxTip<1e-10);check('caps-join-without-position-cuts',maxJoin<1e-5);check('skin-is-finite-and-does-not-mutate-the-rig',nonfinite===0&&mutated===0);
let missing=0,badMesh=0,reverse=0,materials=0;
const positions=Array.from({length:21},(_,i)=>i/2),saved=positions.map(p=>JSON.stringify(g.illustration(p)));
for(let i=positions.length-1;i>=0;i--){const p=positions[i],layers=g.illustration(p);if(JSON.stringify(layers)!==saved[i])reverse++;
 const full=g.frame(p,1),compact=g.frame(p,2);if(full.length!==777||full.some((l,i)=>l.id!==i))missing++;
 if(p>=1)for(const part of ['handL','handR']){const essential=full.filter(l=>l.part===part&&l.important);if(essential.length!==13||essential.some(l=>!compact.some(c=>c.id===l.id&&JSON.stringify(c.points)===JSON.stringify(l.points))))missing++;}
 for(const layer of layers.filter(l=>l.role==='hand-skin'))for(const item of layer.paths)if(item.points.length<4||distance(item.points[0],item.points.at(-1))>1e-10||item.points.some(p=>!p.every(Number.isFinite)))badMesh++;
 if(p>=1){const project=g.createProjector(p,720,720),projected=layers.map(l=>({...l,paths:l.paths.map(item=>({...item,points:item.points.map(project)}))})),m=g.skinMaterials(projected);if(m.length!==2||m.some(v=>![v.cx,v.cy,v.r,v.fx,v.fy].every(Number.isFinite)||v.r<=0))materials++;}
}
check('all-777-ids-and-essential-mobile-contours-remain',missing===0);check('filled-patches-remain-finite-and-closed',badMesh===0);check('glove-surfaces-retrace-with-scroll',reverse===0);check('two-continuous-glove-materials-remain-valid',materials===0);
const out=process.env.GLOVE_QA_DIR||'docs/evidence/c-glove/skin';fs.mkdirSync(out,{recursive:true});const report={release:g.config.release,shapes,vertices,positions:positions.length,maxClosure,maxTip,maxJoin,checks};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>!c.pass),out}));if(checks.some(c=>!c.pass))process.exitCode=1;
