/* Emotional continuity, source framing and preservation of the rest of the story. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),g=require('../assets/profile/geometry.js');
const out=process.env.DRAMA_QA_DIR||'/tmp/profile-drama-qa';fs.mkdirSync(out,{recursive:true});const checks=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'),position=track=>{let lo=0,hi=10;for(let i=0;i<48;i++){const mid=(lo+hi)/2;g.cameraTrack(mid)<track?lo=mid:hi=mid;}return(lo+hi)/2;};
const samples=Array.from({length:129},(_,i)=>position(12+i*.05));
const state=p=>({frame:g.frame(p,2),art:g.illustration(p),camera:g.cameraAt(p),emotion:g.dramaAt(p)}),forward=samples.map(p=>hash(state(p)));
check('dramatic-materials-and-camera-retrace-exactly',[...samples].reverse().every((p,i)=>hash(state(p))===forward[samples.length-1-i]));
check('skipping-between-moments-does-not-mutate-the-story',[7,101,32,128,1,96,48,3].every(i=>hash(state(samples[i]))===forward[i]));
const errors=[];for(const p of samples){const art=g.illustration(p),lines=g.frame(p,2),e=g.dramaAt(p);if(lines.length<300||lines.filter(l=>l.floor).length!==100||Object.values(e).some(v=>!Number.isFinite(v))||e.glow<=0)errors.push({p,reason:'state'});for(const l of [...lines,...art.flatMap(a=>a.paths)])if(l.points.some(q=>!q.every(Number.isFinite))||!Number.isFinite(l.alpha))errors.push({p,reason:l.id});}
check('terrain-and-all-dramatic-material-remain-finite',errors.length===0,errors.slice(0,4));
const points=[13.02,14.02,15.02,16.02,17.02].map(t=>g.dramaAt(position(t)));
check('the-five-moments-have-distinct-emotional-compositions',new Set(points.map(hash)).size===5&&points[0].isolation>.9&&points[1].pressure>.9&&points[2].doubt>.9&&points[3].repair>.9&&points[4].rise>.9);
check('the-light-survives-the-lowest-moment-and-recovers',points[2].glow>0&&points[2].glow<points[0].glow&&points[4].glow>points[3].glow);
for(const id of ['the-weight-of-resistance','stay-with-the-question']){const event=g.config.camera.inserts.find(e=>e.id===id),p=position((event.arrive+event.holdEnd)/2),target=id==='the-weight-of-resistance'?'fracture':'remnant',front=g.illustration(p).filter(l=>l.role==='front-work'&&l.alpha>.5);check('held-closeup-keeps-its-own-object-'+id,front.some(l=>l.prop===target),{props:front.map(l=>l.prop),story:g.storyAt(p).action});}
// The persistence caption and the highlighted prop must refer to the same
// subject, including mid-scroll and while the actor breathes on a held frame.
const contactIssues=[];
for(let step=0;step<=60;step++){
 const timeline=17+step/30;
 let lo=5,hi=7;
 for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(g.resolve(mid)<timeline)lo=mid;else hi=mid;}
 const pos=(lo+hi)/2,seconds=.85,p=g.performanceAt(pos,seconds);
 const layers=g.illustration(pos,0,seconds).filter(l=>l.role==='front-work');
 const dominant=layers.reduce((a,b)=>a.alpha>=b.alpha?a:b);
 if(timeline<18&&p.contacts.left.active!==(dominant.prop==='lesson'))contactIssues.push({timeline,reason:'premature-or-missing-grasp'});
 if(dominant.prop!==g.storyAt(pos).prop)contactIssues.push({timeline,prop:dominant.prop,reason:'caption'});
 for(const layer of layers.filter(l=>l.prop==='ember'||l.prop==='lesson')){
  const book=layer.prop==='lesson',tip=p.contacts[book?'left':'right'].tip;
  // The ember base and lower corner of the ivory leaf are the real contact vertices.
  const corners=layer.paths.filter(path=>path.fill).map(path=>path.points[0]);
  if(!corners.some(q=>Math.hypot(...q.map((n,i)=>n-tip[i]))<1e-8))contactIssues.push({timeline,prop:layer.prop,reason:'hand'});
  if(book&&layer.paths.filter(path=>path.fill&&path.points.length>=24).length<3)contactIssues.push({timeline,reason:'book-cover-or-leaf'});
 }
}
check('persistence-and-lesson-hand-off-with-caption-and-palm',contactIssues.length===0,contactIssues);
// Compare leaf geometry relative to its own spine: breath and camera travel
// alone cannot satisfy a turning-page check.
const paperAt=(track,id,seconds=0)=>{
 const paths=g.illustration(position(track),0,seconds).flatMap(layer=>layer.paths);
 return paths.filter(path=>path.id?.startsWith('lesson-leaf-'+id+'-'));
};
const span=paths=>{
 const corner=paths.find(path=>path.id.endsWith('-band-0')).points[0];
 return paths.find(path=>path.id.endsWith('-edge')).points[0].map((n,i)=>n-corner[i]);
};
const middle=[];let turns=true;
for(const [i,track] of [17.84,18.1025,18.2775].entries()){
 const sheet=paperAt(track,i),flat=paperAt([17.93,18.182,18.33][i],i);
 const arc=span(sheet),land=span(flat);
 turns&&=sheet.length===8&&Math.hypot(...arc.map((n,i)=>n-land[i]))>.1;
 middle.push(arc);
}
check('three-bound-leaves-turn-individually-off-the-spine',turns,middle);
const idle=paperAt(18,3,1.02);
check('craft-hold-turns-a-page-and-resolves-to-neutral',idle.length===8&&
 Math.hypot(...span(idle).map((n,i)=>n-span(paperAt(18,3,.28))[i]))>.1&&
 paperAt(18,3,0).length===0&&paperAt(18,3,2.4).length===0);
const drifting=track=>g.illustration(position(track)).filter(layer=>layer.role==='loose-page');
const flightCounts=[18.34,18.36,18.41,18.47,18.82].map(track=>drifting(track).length);
check('sheets-release-individually-and-clear-the-next-work',String(flightCounts)==='0,1,2,3,0'&&
 drifting(18.62).every(layer=>layer.alpha>0&&layer.alpha<.86),flightCounts);
const bodies=points.map((_,i)=>g.performanceAt(position(13+i+.02))),closed=bodies[0],doubt=bodies[2],rise=bodies[4];
check('doubt-is-bowed-and-the-return-reopens-the-silhouette',doubt.tilt>rise.tilt+.4&&closed.seatAmount>.99&&rise.seatAmount<.01);
const active=samples.map(p=>g.illustration(p).find(l=>l.id==='drama-room')).filter(Boolean),ids=active[0].paths.map(p=>p.id);
check('all-49-room-and-fragment-identities-survive-the-passage',active.every(l=>l.paths.length===49&&JSON.stringify(l.paths.map(p=>p.id))===JSON.stringify(ids)));
const near=[];for(const p of samples)for(const compact of [false,true]){const project=g.createProjector(p,compact?390:720,compact?286:720,{compact});for(const layer of g.projectIllustrations(g.illustration(p),project).filter(l=>l.id==='drama-room'))for(const item of layer.paths)for(const q of item.points)if(project.camera.distance-q[2]<(project.camera.near||.25)-1e-8)near.push({p,compact,id:item.id});}
check('new-scenery-stays-behind-the-eye-plane-through-all-shots',near.length===0,near.slice(0,4));
const outside=[0,1,2,3,4,4.5,6.5,7,7.5,8,9,10];check('emotional-grading-releases-outside-the-personal-passage',outside.every(p=>g.dramaAt(p).strength===0&&!g.illustration(p).some(l=>l.id==='drama-room')));
if(process.env.DRAMA_BASELINE){const old=require(path.resolve(process.env.DRAMA_BASELINE)),different=outside.filter(p=>hash({f:g.frame(p,2),a:g.illustration(p),c:g.cameraAt(p)})!==hash({f:old.frame(p,2),a:old.illustration(p),c:old.cameraAt(p)}));check('approved-scenes-outside-the-passage-remain-identical',different.length===0,different);}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,checks,samples:samples.length,emotionalStates:points},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out}));if(failed.length)process.exitCode=1;
