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
const bodies=points.map((_,i)=>g.performanceAt(position(13+i+.02))),closed=bodies[0],doubt=bodies[2],rise=bodies[4];
check('doubt-is-bowed-and-the-return-reopens-the-silhouette',doubt.tilt>rise.tilt+.4&&closed.seatAmount>.99&&rise.seatAmount<.01);
const active=samples.map(p=>g.illustration(p).find(l=>l.id==='drama-room')).filter(Boolean),ids=active[0].paths.map(p=>p.id);
check('all-49-room-and-fragment-identities-survive-the-passage',active.every(l=>l.paths.length===49&&JSON.stringify(l.paths.map(p=>p.id))===JSON.stringify(ids)));
const near=[];for(const p of samples)for(const compact of [false,true]){const project=g.createProjector(p,compact?390:720,compact?286:720,{compact});for(const layer of g.illustration(p).filter(l=>l.id==='drama-room'))for(const item of layer.paths)for(const q of item.points)if(project.camera.distance-project(q)[2]<.25)near.push({p,compact,id:item.id});}
check('new-scenery-stays-behind-the-eye-plane-through-all-shots',near.length===0,near.slice(0,4));
const outside=[0,1,2,3,4,4.5,6.5,7,7.5,8,9,10];check('emotional-grading-releases-outside-the-personal-passage',outside.every(p=>g.dramaAt(p).strength===0&&!g.illustration(p).some(l=>l.id==='drama-room')));
if(process.env.DRAMA_BASELINE){const old=require(path.resolve(process.env.DRAMA_BASELINE)),different=outside.filter(p=>hash({f:g.frame(p,2),a:g.illustration(p),c:g.cameraAt(p)})!==hash({f:old.frame(p,2),a:old.illustration(p),c:old.cameraAt(p)}));check('approved-scenes-outside-the-passage-remain-identical',different.length===0,different);}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,checks,samples:samples.length,emotionalStates:points},null,2));const failed=checks.filter(c=>!c.pass);console.log(JSON.stringify({checks:checks.length,failed,out}));if(failed.length)process.exitCode=1;
