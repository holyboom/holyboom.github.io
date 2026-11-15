/* Physical performance contracts, evaluated independently from the renderer.
   SKIP_BROWSER=1 runs the numerical suite and writes projection review sheets.
   Browser mode also captures the actual page; TEST_URL selects its preview server.
   Passing these checks does not establish that viewers recognise an emotion. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const motion = require('../assets/profile/motion.js');
const geometry = require('../assets/profile/geometry.js');
const out = path.resolve(process.env.PERFORMANCE_QA_DIR || 'docs/evidence/faceless-performance/validation');
fs.mkdirSync(out, { recursive: true });
const checks = [], observations = [], browserErrors = [];
function check(name, pass, data) {
  checks.push({ name, pass: Boolean(pass), ...(data === undefined ? {} : { data }) });
  if (!pass) console.error('FAIL', name, JSON.stringify(data));
}
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const subtract = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function pointToSegment(point,a,b) {
  const ab=subtract(b,a),ap=subtract(point,a),t=Math.max(0,Math.min(1,dot(ap,ab)/(dot(ab,ab)||1)));
  return distance(point,a.map((n,i)=>n+ab[i]*t));
}
// Measure the actual painted polygon/segments, rather than an authored centre.
// Closed furniture contours describe a support surface even without opaque fill.
function distanceToPaintedPath(point,item,closedSurface=false) {
  const vertices=item.points;if(!vertices?.length)return Infinity;
  let nearest=vertices.length===1?distance(point,vertices[0]):Infinity;
  for(let i=1;i<vertices.length;i++)nearest=Math.min(nearest,pointToSegment(point,vertices[i-1],vertices[i]));
  if(!(item.fill||closedSurface)||vertices.length<3)return nearest;
  const a=vertices[0],b=vertices.reduce((best,p)=>distance(p,a)>distance(best,a)?p:best,a),ab=subtract(b,a),c=vertices.reduce((best,p)=>Math.hypot(...cross(ab,subtract(p,a)))>Math.hypot(...cross(ab,subtract(best,a)))?p:best,a);
  const rawNormal=cross(ab,subtract(c,a)),length=Math.hypot(...rawNormal);if(length<1e-10)return nearest;
  const normal=rawNormal.map(n=>n/length),u=ab.map(n=>n/Math.hypot(...ab)),v=cross(normal,u),to2=p=>[dot(subtract(p,a),u),dot(subtract(p,a),v)],q=to2(point),polygon=vertices.map(to2);
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const x=polygon[i],y=polygon[j];
    if((x[1]>q[1])!==(y[1]>q[1])&&q[0]<(y[0]-x[0])*(q[1]-x[1])/(y[1]-x[1])+x[0])inside=!inside;
  }
  return inside?Math.min(nearest,Math.abs(dot(subtract(point,a),normal))):nearest;
}
const paintedSpaces=new Set(['work','paper','keyboard','support','stylus-dock']);
function paintedSurfaceGap(position,contact,modelLines=null,layers=null) {
  let painted,supportAlpha;
  if(['support','stylus-dock'].includes(contact.space)) {
    const supports=(modelLines||geometry.frame(position,1)).filter(line=>line.group==='support').map(line=>({...line,closedSurface:distance(line.points[0],line.points.at(-1))<.001}));
    supportAlpha=Math.max(0,...supports.filter(line=>line.closedSurface&&distanceToPaintedPath(contact.target,line,true)<.045).map(line=>line.alpha));
    painted=supports.filter(line=>line.alpha>.1);
  }
  else painted=(layers||geometry.illustration(position)).filter(layer=>layer.alpha>.35).flatMap(layer=>layer.paths).filter(item=>item.alpha>.1&&(contact.space!=='keyboard'||item.role==='keyboard'));
  return {count:painted.length,supportAlpha,error:painted.length?Math.min(...painted.map(item=>distanceToPaintedPath(contact.target,item,item.closedSurface))):Infinity};
}
const maxDifference = (a, b) => a.length===b.length?Math.max(...a.map((v, i) => Math.abs(v - b[i]))):Infinity;
const round = value => Math.round(value * 1e9) / 1e9;
const isPoint = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const points = p => { const result={ head: p.head, hip: p.hip, shoulder: p.shoulder,
  shoulderL: p.shoulderL, shoulderR: p.shoulderR, hipL: p.hipL, hipR: p.hipR,
  elbowL: p.elbowL, elbowR: p.elbowR, handL: p.handL, handR: p.handR,
  kneeL: p.knees[0], kneeR: p.knees[1], footL: p.feet[0], footR: p.feet[1], light: p.light };
  for(const [side,limb]of [['left','L'],['right','R']])for(const finger of p.contacts[side].shape?.fingers||[]) {
    const local=finger.points.at(-1),frame=p.frames['wrist'+limb];
    result[`finger${limb}-${finger.name}`]=p['hand'+limb].map((n,i)=>n+local[0]*frame.x[i]+local[1]*frame.y[i]+local[2]*frame.z[i]);
  }
  return result;
};
const bonePairs = [['upperArmL', 'shoulderL', 'elbowL'], ['forearmL', 'elbowL', 'handL'],
  ['upperArmR', 'shoulderR', 'elbowR'], ['forearmR', 'elbowR', 'handR'],
  ['thighL', 'hipL', 'kneeL'], ['shinL', 'kneeL', 'footL'],
  ['thighR', 'hipR', 'kneeR'], ['shinR', 'kneeR', 'footR']];
const bones = pose => {
  const p = points(pose);
  return Object.fromEntries(bonePairs.map(([name, a, b]) => [name, distance(p[a], p[b])]));
};
const worst = (list, item, limit = 12) => {
  list.push(item); list.sort((a, b) => (b.error || b.distance || 0) - (a.error || a.distance || 0));
  if (list.length > limit) list.pop();
};
function positionForTimeline(timeline) {
  if (timeline <= 0) return 0;
  if (timeline >= 30) return 10;
  if(Number.isInteger(timeline)) { const shot=geometry.sequence[timeline]; return shot.chapter+(shot.step+.05)/shot.count; }
  let lower = 0, upper = 10;
  for (let i = 0; i < 48; i++) {
    const middle = (lower + upper) / 2;
    if (geometry.resolve(middle) < timeline) lower = middle; else upper = middle;
  }
  return (lower + upper) / 2;
}
const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const canonicalFrame=lines=>lines.map(l=>[l.id,l.part||null,l.group,l.alpha,l.width,Boolean(l.important),l.points]);
const canonicalIllustration=layers=>layers.map(l=>[l.role||null,l.id||null,l.index??null,l.alpha,l.textAlpha??null,l.paths.map(p=>[p.id||null,p.role||null,p.color,p.width,p.alpha,p.fill||null,p.points]),l.texts.map(t=>[t.text,t.point,t.color,t.size])]);
const frameBaseline=path.resolve(process.env.FRAME_PARITY_BASELINE||'docs/evidence/faceless-performance/frame-parity-baseline.json');
function geometryFingerprints() {
  const timelines=new Set([...Array.from({length:31},(_,i)=>i),...Array.from({length:30},(_,i)=>i+.5),.1,.25,.75,.95,1.2,1.35,1.65,2.1,2.28,2.30,2.36,2.65,2.78,6.02,6.08,6.15,6.17,6.25,6.34,12.02,12.14,12.24,12.28,12.32,15.6265,16.12,16.24,16.37,16.40,16.55,16.72,16.86,18.5801,26.4389]);
  const records=[];
  for(const timeline of [...timelines].sort((a,b)=>a-b)) {
    const position=positionForTimeline(timeline);
    for(const explode of [0,1]) {
      const cameraFields=c=>[c.yaw,c.pitch,c.distance,c.focal,c.target],trail=direction=>geometry.lightTrail(position,direction).map(p=>[p.point,p.alpha]);
      const illustration=digest(canonicalIllustration(geometry.illustration(position,explode))),camera=digest([cameraFields(geometry.cameraAt(position)),cameraFields(geometry.cameraAt(position,{compact:true}))]),light=digest([geometry.lightAt(position),trail(1),trail(-1)]);
      for(const detail of [1,2]) {
        const lines=geometry.frame(position,detail,explode);
        records.push({timeline,position,detail,explode,full:digest(canonicalFrame(lines)),visible:digest(canonicalFrame(lines.filter(l=>l.alpha>.005&&l.points.length>1))),illustration,camera,light});
      }
    }
  }
  return records;
}
function writeFrameBaseline() {
  const sources=Object.fromEntries(['geometry.js','motion.js','hand-shapes.js','scenes.js','performance-source/pilot-clips.js','performance-source/pilot-clips.json'].filter(name=>fs.existsSync(path.resolve('assets/profile',name))).map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.resolve('assets/profile',name))).digest('hex')]));
  const records=geometryFingerprints();fs.mkdirSync(path.dirname(frameBaseline),{recursive:true});
  const temporary=frameBaseline+'.tmp';
  fs.writeFileSync(temporary,JSON.stringify({generatedAt:new Date().toISOString(),purpose:'Frozen canonical pre-cache geometry, including visible and hidden paths. Captured before the round 3 optimization.',sources,records},null,2));
  fs.renameSync(temporary,frameBaseline);
  console.log(JSON.stringify({baseline:frameBaseline,records:records.length}));
}
function compareFrameBaseline() {
  const before=JSON.parse(fs.readFileSync(frameBaseline,'utf8')),after=geometryFingerprints(),changes=[];
  if(before.records.length!==after.length)changes.push({reason:'case-count-changed',before:before.records.length,after:after.length});
  for(let i=0;i<Math.min(before.records.length,after.length);i++)for(const field of ['full','visible','illustration','camera','light'])if(before.records[i][field]!==after[i][field])changes.push({timeline:after[i].timeline,detail:after[i].detail,explode:after[i].explode,field});
  return {generatedAt:new Date().toISOString(),records:after.length,visibleOnly:process.env.FRAME_PARITY_VISIBLE_ONLY==='1',changes};
}
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function skeletonSVG(timeline, width, height, compact, neutral = false) {
  const p = motion.poseAt(timeline), position = positionForTimeline(timeline);
  const project = geometry.createProjector(position, width, height, { compact, strength: neutral ? 0 : 1 });
  const q = Object.fromEntries(Object.entries(points(p)).map(([name, value]) => [name, project(value)]));
  const pairs = [...bonePairs, ['spine', 'hip', 'shoulder'], ['neck', 'shoulder', 'head'],
    ['shoulders', 'shoulderL', 'shoulderR'], ['pelvis', 'hipL', 'hipR']];
  const line = (a, b, stroke, weight) => `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}" x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}" stroke="${stroke}" stroke-width="${weight}" stroke-linecap="round"/>`;
  const body = pairs.map(([, a, b]) => line(q[a], q[b], '#eeeeee', compact ? 5 : 8)).join('');
  const floor = line(project([-1.4, p.support.floorY, .1]), project([1.1, p.support.floorY, .1]), '#606060', 1);
  const headCloud=[];
  for(let latitude=0;latitude<=12;latitude++)for(let longitude=0;longitude<16;longitude++) {
    const a=latitude/12*Math.PI,b=longitude/16*Math.PI*2,y=Math.cos(a),local=[.17*Math.sin(a)*Math.cos(b)*(1-.12*Math.max(0,-y)),.25*y,.16*Math.sin(a)*Math.sin(b)+(y<-.35?.018:0)];
    headCloud.push(project(p.head.map((n,i)=>n+local[0]*p.frames.head.x[i]+local[1]*p.frames.head.y[i]+local[2]*p.frames.head.z[i])).slice(0,2));
  }
  const sorted=headCloud.sort((a,b)=>a[0]-b[0]||a[1]-b[1]),turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lower=[],upper=[];
  for(const point of sorted){while(lower.length>=2&&turn(lower.at(-2),lower.at(-1),point)<=0)lower.pop();lower.push(point);}
  for(const point of [...sorted].reverse()){while(upper.length>=2&&turn(upper.at(-2),upper.at(-1),point)<=0)upper.pop();upper.push(point);}
  const head=`<polygon points="${[...lower.slice(0,-1),...upper.slice(0,-1)].map(p=>p.map(n=>n.toFixed(2)).join(',')).join(' ')}" fill="#eeeeee"/>`;
  let seat='';
  if(p.seatAmount>.01||[6,12,16].includes(Math.floor(timeline))) {
    const centre=p.support.seatCenter,corners=[[-.25,-.24],[.25,-.24],[.25,.24],[-.25,.24],[-.25,-.24]].map(([x,z])=>project([centre[0]+x,p.support.seatY,centre[2]+z]));
    seat=corners.slice(1).map((p,i)=>line(corners[i],p,'#686868',2)).join('');
    for(const x of [-.22,.22])seat+=line(project([centre[0]+x,p.support.seatY,centre[2]-.16]),project([centre[0]+x,p.support.floorY,centre[2]-.16]),'#505050',1);
  }
  const work = p.work;
  let surface = '';
  if (work && isPoint(work.origin) && isPoint(work.u) && isPoint(work.v)) {
    const corners = [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5],[-.5,-.5]].map(([u,v]) => project(work.origin.map((n,i) => n + work.u[i] * u * work.width + work.v[i] * v * work.height)));
    surface = corners.slice(1).map((p,i) => line(corners[i], p, '#606060', 1)).join('');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#141414"/>${floor}${seat}${surface}${body}${head}<circle cx="${q.light[0]}" cy="${q.light[1]}" r="3" fill="#ffffff"/></svg>`;
}
function writeReviewSheets() {
  const review = [];
  for (let beat = 1; beat <= 30; beat++) review.push({ timeline: beat, label: `${String(beat + 1).padStart(2, '0')} · ${geometry.sequence[beat].action}` });
  const bridges = [6,6.16,6.30,6.48,7,12,12.16,12.30,12.48,13,16,16.16,16.30,16.48,16.68,17];
  for (const [name, entries, compact, neutral] of [
    ['poses-desktop', review, false, false], ['poses-mobile', review, true, false],
    ['poses-neutral', review, false, true], ['support-bridges', bridges.map(t => ({ timeline: t, label: `Timeline ${t.toFixed(2)}` })), false, false],
    ['dramatic-passage-mobile', Array.from({ length: 15 }, (_, i) => ({ timeline: 12 + Math.floor(i / 3) + [.20,.48,.76][i % 3], label: `${14 + Math.floor(i / 3)} / ${['prepare','action','response'][i % 3]}` })), true, true]
  ]) {
    const width = compact ? 390 : 464, height = compact ? 228 : 430;
    const cards = entries.map((entry, index) => {
      const file = `${name}-${String(index + 1).padStart(2, '0')}.svg`;
      fs.writeFileSync(path.join(out, file), skeletonSVG(entry.timeline, width, height, compact, neutral));
      return `<figure><img src="${file}" alt="${escape(entry.label)}"><figcaption>${escape(entry.label)}<small>timeline ${entry.timeline.toFixed(2)}</small></figcaption></figure>`;
    });
    fs.writeFileSync(path.join(out, `${name}.html`), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><style>body{margin:24px;background:#181818;color:#eee;font:14px/1.5 system-ui}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}figure{margin:0;background:#242424}img{display:block;width:100%;height:auto}figcaption{padding:12px}small{display:block;color:#aaa}@media(max-width:700px){main{grid-template-columns:1fr}}</style><h1>${escape(name)}</h1><p>Monochrome joint silhouettes for human review. This diagnostic omits mesh, face, hue, captions inside the frame and light trails. It does not automatically establish emotional readability.</p><main>${cards.join('')}</main></html>`);
  }
}
async function browserChecks() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width:1440,height:1000 }, { width:390,height:844 }]) {
      const page = await browser.newPage({ viewport });
      page.on('pageerror', error => browserErrors.push(error.message));
      await page.goto(new URL('profile/', process.env.TEST_URL || 'http://127.0.0.1:4174/').href);
      await page.waitForFunction(() => window.ProfileExperience && window.ProfileMotion);
      await page.evaluate(() => document.fonts.ready);
      const parityTimelines=[2.32,2.58,6.3,13,15.5,16.5,25.5];
      const browserPoses=await page.evaluate(timelines=>timelines.map(t=>ProfileMotion.poseAt(t)),parityTimelines);
      const parity=browserPoses.map((pose,i)=>{const expected=motion.poseAt(parityTimelines[i]);return {timeline:parityTimelines[i],error:maxDifference(Object.values(points(expected)).flat(),Object.values(points(pose)).flat()),toolError:Math.max(distance(expected.tool.tip,pose.tool.tip),distance(expected.tool.shaftEnd,pose.tool.shaftEnd)),sameOwnership:expected.tool.owner===pose.tool.owner};});
      const parityPass=parity.every(p=>p.error<1e-8&&p.toolError<1e-8&&p.sameOwnership);
      check(`browser-uses-the-verified-rig-and-tool-${viewport.width}`,parityPass,parity);
      const anchors = await page.evaluate(() => ProfileExperience.snapshot().anchors);
      async function go(timeline) {
        const position = positionForTimeline(timeline), chapter = Math.min(9, Math.floor(position));
        const y = position >= 10 ? anchors[10] : anchors[chapter] + (anchors[chapter + 1] - anchors[chapter]) * (geometry.config.morph.start + (geometry.config.morph.end - geometry.config.morph.start) * (position - chapter));
        await page.evaluate(y => scrollTo({ top:y, behavior:'instant' }), y);
        await page.waitForFunction(position => Math.abs(ProfileExperience.snapshot().target - position) < .006 && Math.abs(ProfileExperience.snapshot().current - ProfileExperience.snapshot().target) < .0001, position);
        return page.evaluate(() => {
          const snapshot = ProfileExperience.snapshot();
          return { snapshot, pose: ProfileMotion.poseAt(ProfileGeometry.resolve(snapshot.current)) };
        });
      }
      const first = await go(13.48); await go(16.68); const reverse = await go(13.48);
      check(`browser-pose-retraces-${viewport.width}`, maxDifference(Object.values(points(first.pose)).flat(), Object.values(points(reverse.pose)).flat()) < .001);
      async function settledCanvas(timeline) {
        await go(timeline);
        await page.waitForFunction(()=>{const s=ProfileExperience.snapshot();return s.current===s.target&&s.trailEnergy<=.01&&!s.dirty;});
        return page.evaluate(()=>({pixels:document.querySelector('.stage canvas').toDataURL(),detail:ProfileExperience.snapshot().detail}));
      }
      let beforeTool=await settledCanvas(2.28);await settledCanvas(2.65);let afterTool=await settledCanvas(2.28);
      // Adaptive detail can settle once after the first expensive draw. Compare
      // two visits at that same detail, rather than mistake LOD for a pose error.
      if(beforeTool.detail!==afterTool.detail){beforeTool=afterTool;await settledCanvas(2.65);afterTool=await settledCanvas(2.28);}
      check(`settled-canvas-retraces-after-tool-release-${viewport.width}`,beforeTool.detail===afterTool.detail&&beforeTool.pixels===afterTool.pixels,{beforeDetail:beforeTool.detail,afterDetail:afterTool.detail,samePixels:beforeTool.pixels===afterTool.pixels});
      const photographs = [];
      for (const timeline of [2,2.28,2.32,2.42,2.58,2.72,6.16,6.48,12.16,13,14,15,16,16.30,16.48,17,25]) {
        const state = await go(timeline), file = `live-${viewport.width}-t${timeline.toFixed(2)}.png`;
        await page.locator('.stage-frame').screenshot({ path:path.join(out, file) });
        photographs.push({ requestedTimeline:timeline, actualTimeline:geometry.resolve(state.snapshot.current), file, current:state.snapshot.current, camera:state.snapshot.camera });
      }
      fs.writeFileSync(path.join(out, `live-${viewport.width}.json`), JSON.stringify(photographs, null, 2));
      const cards=photographs.map(shot=>`<figure><img src="${shot.file}" alt="Actual profile at timeline ${shot.requestedTimeline}"><figcaption>Timeline ${shot.requestedTimeline.toFixed(2)} · ${escape(geometry.sequence[Math.round(shot.requestedTimeline)].action)}</figcaption></figure>`);
      fs.writeFileSync(path.join(out,`live-${viewport.width}.html`),`<!doctype html><html lang="en"><meta charset="utf-8"><title>Actual profile · ${viewport.width}</title><style>body{margin:24px;background:#15121b;color:#eee;font:14px/1.5 system-ui}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}figure{margin:0;background:#25212d}img{display:block;width:100%;height:auto}figcaption{padding:12px}@media(max-width:700px){main{grid-template-columns:1fr}}</style><h1>Actual profile · ${viewport.width}px viewport</h1><p>${parityPass?'The browser rig matches the numerical source.':'The browser rig differs from the numerical source; see results.json.'} No image retouching or pose overlays.</p><main>${cards.join('')}</main></html>`);
      async function settleDisclosure(open) {
        await page.waitForFunction(open=>{const s=ProfileExperience.snapshot();return document.querySelector('#beneath').open===open&&s.current===s.target&&s.trailEnergy<=.01&&!s.dirty&&(open?s.exploded>.998:s.exploded<.002);},open);
      }
      async function disclosureState() {
        return page.evaluate(()=>{const s=ProfileExperience.snapshot(),p=ProfileMotion.poseAt(ProfileGeometry.resolve(s.current));return {current:s.current,target:s.target,y:scrollY,anchors:s.anchors,correction:s.layoutCorrection,pose:[...p.head,...p.hip,...p.handL,...p.handR,...p.work.origin,...p.work.u,...p.work.v],front:ProfileGeometry.illustration(s.current,s.exploded).filter(l=>l.role==='front-work').flatMap(l=>l.paths.flatMap(p=>p.points.flat())),pixels:document.querySelector('.stage canvas').toDataURL()};});
      }
      await settledCanvas(geometry.resolve(7.60));
      const closed=await disclosureState();
      await page.locator('.stage-frame').screenshot({path:path.join(out,`disclosure-${viewport.width}-closed.png`)});
      await page.evaluate(()=>{document.querySelector('#beneath').open=true;});await settleDisclosure(true);
      const opened=await disclosureState();
      await page.locator('.stage-frame').screenshot({path:path.join(out,`disclosure-${viewport.width}-open.png`)});
      const openingError=Math.max(Math.abs(closed.current-opened.current),maxDifference(closed.pose,opened.pose),maxDifference(closed.front,opened.front));
      check(`disclosure-opens-real-depth-without-moving-front-${viewport.width}`,openingError<1e-6&&closed.pixels!==opened.pixels,{openingError,visiblePixelChange:closed.pixels!==opened.pixels,scrollDelta:opened.y-closed.y,correction:opened.correction});
      await page.evaluate(async()=>{dispatchEvent(new Event('resize'));dispatchEvent(new Event('resize'));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await settleDisclosure(true);
      const repeated=await disclosureState();
      check(`duplicate-layout-observers-do-not-reapply-correction-${viewport.width}`,Math.abs(repeated.current-opened.current)<1e-6,{before:opened.current,after:repeated.current});
      await page.evaluate(async()=>{const chapter=document.querySelector('#beneath').closest('.chapter');chapter.dataset.qaPadding=chapter.style.paddingBottom;chapter.style.paddingBottom=(parseFloat(getComputedStyle(chapter).paddingBottom)+24)+'px';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await settleDisclosure(true);
      const resizedContent=await disclosureState();
      await page.evaluate(async()=>{const chapter=document.querySelector('#beneath').closest('.chapter');chapter.style.paddingBottom=chapter.dataset.qaPadding;delete chapter.dataset.qaPadding;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await settleDisclosure(true);
      const restoredContent=await disclosureState();
      check(`content-resize-preserves-disclosed-performance-${viewport.width}`,Math.abs(resizedContent.current-opened.current)<1e-6&&Math.abs(restoredContent.current-opened.current)<1e-6,{opened:opened.current,resized:resizedContent.current,restored:restoredContent.current});
      if(viewport.width===390) {
        await page.setViewportSize({width:430,height:viewport.height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await settleDisclosure(true);const wider=await disclosureState();
        await page.setViewportSize(viewport);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await settleDisclosure(true);const restored=await disclosureState();
        check('compact-width-change-preserves-disclosed-performance',Math.abs(wider.current-opened.current)<1e-6&&Math.abs(restored.current-opened.current)<1e-6,{opened:opened.current,wider:wider.current,restored:restored.current});
      }
      const nativeStart=await disclosureState(),ys=Array.from({length:31},(_,i)=>Math.round(nativeStart.y+(nativeStart.anchors[8]+80-nativeStart.y)*i/30));
      async function sampleNative(y){return page.evaluate(async y=>{scrollTo({top:y,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return {y:scrollY,target:ProfileExperience.snapshot().target};},y);}
      const down=[];for(const y of ys)down.push(await sampleNative(y));const up=[];for(const y of [...ys].reverse())up.push(await sampleNative(y));up.reverse();
      check(`disclosed-native-scroll-is-monotonic-and-reversible-${viewport.width}`,down.every((p,i)=>!i||p.target>=down[i-1].target-1e-8)&&down.every((p,i)=>p.y===up[i].y&&Math.abs(p.target-up[i].target)<1e-8),{samples:ys.length,maximumReverseError:Math.max(...down.map((p,i)=>Math.abs(p.target-up[i].target)))});
      const workAnchor=await sampleNative(nativeStart.anchors[8]);
      check(`native-work-anchor-survives-disclosure-${viewport.width}`,geometry.storyAt(workAnchor.target).chapter===8,{target:workAnchor.target,chapter:geometry.storyAt(workAnchor.target).chapter});
      await sampleNative(nativeStart.y);await settleDisclosure(true);const beforeClose=await disclosureState();
      await page.evaluate(()=>{document.querySelector('#beneath').open=false;});await settleDisclosure(false);const afterClose=await disclosureState();
      const closingError=Math.max(Math.abs(beforeClose.current-afterClose.current),maxDifference(beforeClose.pose,afterClose.pose),maxDifference(beforeClose.front,afterClose.front));
      check(`disclosure-closes-without-moving-front-${viewport.width}`,closingError<1e-6,{closingError,scrollDelta:afterClose.y-beforeClose.y,correction:afterClose.correction});
      const omitPixels=state=>{const {pixels,front,pose,...rest}=state;return rest;};
      fs.writeFileSync(path.join(out,`disclosure-${viewport.width}.json`),JSON.stringify({closed:omitPixels(closed),opened:omitPixels(opened),afterClose:omitPixels(afterClose),down,up},null,2));
      await page.close();
    }
  } finally { await browser.close(); }
  check('no-browser-performance-errors', browserErrors.length === 0, browserErrors);
}
async function main() {
  const stride = 1 / 200, timelines = Array.from({ length:6001 }, (_, i) => i * stride);
  const samples = timelines.map(timeline => ({ timeline, pose:motion.poseAt(timeline) }));
  check('all-31-beats-have-finite-joints', samples.every(({ pose }) => Object.values(points(pose)).every(isPoint)), { samples:samples.length });
  const fastLightErrors=[];
  for(const {timeline,pose}of samples){const fast=motion.lightAt(timeline),error=distance(fast,pose.light);if(error!==0)worst(fastLightErrors,{timeline,error});}
  check('fast-light-is-exactly-the-complete-pose-emitter',fastLightErrors.length===0,{samples:samples.length,failures:fastLightErrors});
  const reference = bones(motion.poseAt(1.5)), ranges = {};
  for (const name of Object.keys(reference)) ranges[name] = { min:Infinity, max:-Infinity, maxError:0 };
  for (const { pose } of samples) for (const [name, value] of Object.entries(bones(pose))) {
    const range = ranges[name]; range.min = Math.min(range.min, value); range.max = Math.max(range.max, value); range.maxError = Math.max(range.maxError, Math.abs(value - reference[name]));
  }
  check('fixed-limb-segment-lengths-throughout-scroll', Object.values(ranges).every(r => r.maxError < 1e-6), ranges);
  check('bilaterally-consistent-limb-proportions', ['upperArm','forearm','thigh','shin'].every(name => Math.abs(reference[name+'L'] - reference[name+'R']) < 1e-6), reference);
  const fingerLengths={},fingerStretch=[];
  for(const {timeline,pose}of samples)for(const side of ['left','right'])for(const finger of pose.contacts[side].shape?.fingers||[])for(let segment=1;segment<finger.points.length;segment++) {
    const key=`${side}-${finger.name}-${segment}`,value=distance(finger.points[segment-1],finger.points[segment]);
    if(fingerLengths[key]===undefined)fingerLengths[key]=value;
    const error=Math.abs(value-fingerLengths[key]);if(error>1e-6)worst(fingerStretch,{timeline,finger:key,error});
  }
  check('finger-segments-do-not-stretch-during-nested-grips',Object.keys(fingerLengths).length===30&&fingerStretch.length===0,{segments:Object.keys(fingerLengths).length,failures:fingerStretch});
  const typingGroups=new Map(),typingTiming=new Map();
  for(const {pose}of samples)if([3,4,10].includes(pose.phase.to)&&pose.phase.stage==='action') {
    const beat=pose.phase.to,timing=typingTiming.get(beat)||{left:false,right:false,staggered:0};
    timing.left||=pose.contacts.left.active;timing.right||=pose.contacts.right.active;if(pose.contacts.left.active!==pose.contacts.right.active)timing.staggered++;typingTiming.set(beat,timing);
    for(const [side,limb]of [['left','L'],['right','R']]) {
      const contact=pose.contacts[side],finger=contact.shape.fingers.find(f=>f.name==='index'),keyboard=pose.work.keyboard,key=`${beat}-${side}`,values=typingGroups.get(key)||{finger:[],wrist:[]};
      values.finger.push(finger.points.at(-1)[1]);values.wrist.push(dot(subtract(pose['hand'+limb],keyboard.origin),keyboard.normal));typingGroups.set(key,values);
    }
  }
  const typingMovement=[...typingGroups].map(([key,values])=>({hand:key,fingerTravel:Math.max(...values.finger)-Math.min(...values.finger),wristTravel:Math.max(...values.wrist)-Math.min(...values.wrist)}));
  check('typing-presses-come-mainly-from-finger-flexion',typingMovement.length===6&&typingMovement.every(v=>v.fingerTravel>.008&&v.wristTravel<v.fingerTravel*.75),typingMovement);
  check('typing-hands-make-staggered-contacts',typingTiming.size===3&&[...typingTiming.values()].every(t=>t.left&&t.right&&t.staggered>=2),[...typingTiming].map(([beat,timing])=>({beat,...timing})));
  const serialized = samples.map(({ pose }) => JSON.stringify(pose));
  const reverse = [...timelines].reverse().map(t => JSON.stringify(motion.poseAt(t))).reverse();
  check('exact-reverse-sampling', serialized.every((s,i) => s === reverse[i]));
  let seed = 271828; const shuffled = timelines.map((t,i) => ({ t,i }));
  for(let i=shuffled.length-1;i>0;i--) { seed=(seed*1664525+1013904223)>>>0; const j=Math.floor(seed/4294967296*(i+1)); [shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
  check('history-independent-random-seeks', shuffled.every(({ t,i }) => JSON.stringify(motion.poseAt(t)) === serialized[i]));
  check('samples-own-their-coordinate-storage', samples.every(({ pose },i) => JSON.stringify(pose) === serialized[i]));
  const discontinuities = [], orientationJumps = [], largeSteps = [], worstContact = [], unreachable = [], footSlide = [], groundMismatch = [], frameErrors = [];
  const boundaries = Array.from({ length:31 }, (_,i) => i);
  for(let beat=0;beat<30;beat++)for(const phase of [.12,.18,.24,.32,.34,.36,.68,.78,.82,.90])boundaries.push(beat+phase);
  const stateSignature=pose=>JSON.stringify([pose.phase.stage,pose.support.footL.weight>.999,pose.support.footR.weight>.999,pose.seatAmount>.99,...['left','right'].map(side=>[pose.contacts[side].active,pose.contacts[side].grip,pose.contacts[side].space])]);
  for(let i=1;i<samples.length;i++) {
    const before=stateSignature(samples[i-1].pose);
    if(before===stateSignature(samples[i].pose))continue;
    let lower=samples[i-1].timeline,upper=samples[i].timeline;
    for(let j=0;j<30;j++) { const middle=(lower+upper)/2; if(stateSignature(motion.poseAt(middle))===before)lower=middle;else upper=middle; }
    boundaries.push((lower+upper)/2);
  }
  // Interior probes also catch an abrupt IK switch hidden between beat boundaries.
  for (let t = 0; t <= 30; t += .025) boundaries.push(t);
  let maximumEpsilonJump = 0, maximumStep = 0, activeContactSamples = 0, plantedFootSamples = 0;
  for (const timeline of boundaries) {
    const before=motion.poseAt(Math.max(0,timeline-1e-6)),after=motion.poseAt(Math.min(30,timeline+1e-6)),a=points(before),b=points(after);
    for (const name of Object.keys(a)) { const error = distance(a[name], b[name]); maximumEpsilonJump = Math.max(maximumEpsilonJump,error); if(error>.001) worst(discontinuities,{timeline:round(timeline),joint:name,error}); }
    for(const name of Object.keys(before.frames))for(const axis of ['x','y','z']) { const error=distance(before.frames[name][axis],after.frames[name][axis]); if(error>.001)worst(orientationJumps,{timeline:round(timeline),frame:name,axis,error}); }
  }
  for (let i = 0; i < samples.length; i++) {
    const { timeline, pose } = samples[i], named = points(pose);
    if (i) {
      const previous = points(samples[i-1].pose);
      for(const name of Object.keys(named)) { const error=distance(named[name],previous[name]); maximumStep=Math.max(maximumStep,error); if(error>.12) worst(largeSteps,{timeline,joint:name,error}); }
    }
    for (const [name, frame] of Object.entries(pose.frames)) {
      const axes = ['x','y','z'].map(key=>frame[key]);
      const error = Math.max(...axes.map(axis=>Math.abs(Math.hypot(...axis)-1)),Math.abs(dot(axes[0],axes[1])),Math.abs(dot(axes[0],axes[2])),Math.abs(dot(axes[1],axes[2])));
      if(error>1e-6) worst(frameErrors,{timeline,frame:name,error});
    }
    for (const [side, limb] of [['left','L'],['right','R']]) {
      const contact = pose.contacts[side], reach=pose.reach[side];
      if(isPoint(reach?.requested)) {
        const reachDistance=distance(named['shoulder'+limb],reach.requested),maxReach=reference['upperArm'+limb]+reference['forearm'+limb],minReach=Math.abs(reference['upperArm'+limb]-reference['forearm'+limb]);
        const error=Math.max(0,reachDistance-maxReach,minReach-reachDistance);
        if(error>.01)worst(unreachable,{timeline,side,error,reachDistance,availableReach:maxReach,requested:reach.requested});
      }
      if(contact?.weight > .999 && contact.active) {
        activeContactSamples++;
        const error=distance(contact.tip,contact.target);
        if(error>.005) worst(worstContact,{timeline,side,error});
      }
      const foot=pose.support['foot'+limb], previous=i?samples[i-1].pose.support['foot'+limb]:null;
      if(foot?.weight>.999) {
        plantedFootSamples++;
        const error=distance(named['foot'+limb],foot.target);
        if(error>.002) worst(groundMismatch,{timeline,side,error});
        if(previous?.weight>.999) {
          const error=distance(named['foot'+limb],points(samples[i-1].pose)['foot'+limb]);
          if(error>.0001) worst(footSlide,{timeline,side,error});
        }
      }
    }
  }
  check('no-jumps-at-beat-or-contact-boundaries', discontinuities.length===0,{ maximumEpsilonJump, failures:discontinuities });
  check('head-chest-wrist-orientations-remain-continuous',orientationJumps.length===0,{boundaryProbes:boundaries.length,failures:orientationJumps});
  check('no-fast-hidden-pole-flips',largeSteps.length===0,{stride,maximumStep,failures:largeSteps});
  check('orthonormal-head-chest-wrist-frames',frameErrors.length===0,frameErrors);
  check('authored-hand-targets-are-reachable',unreachable.length===0,unreachable);
  check('fully-weighted-hand-contacts-reach-their-targets',activeContactSamples>0&&worstContact.length===0,{activeContactSamples,failures:worstContact});
  check('planted-feet-match-contact-targets',plantedFootSamples>0&&groundMismatch.length===0,{plantedFootSamples,failures:groundMismatch});
  check('planted-feet-do-not-slide',footSlide.length===0,footSlide);
  const choreography=[];
  for(const [beat,kind]of [[7,'rise'],[13,'sit'],[17,'rise']]) {
    const part=samples.filter(s=>s.timeline>=beat-1&&s.timeline<=beat),first=part[0].pose,last=part.at(-1).pose;
    const travel=last.hip[1]-first.hip[1];
    const unsupported=part.filter(({pose})=>pose.seatAmount<.95&&(pose.support.footL.weight<.95||pose.support.footR.weight<.95));
    const result={beat:beat+1,kind,hipVerticalTravel:travel,seatStart:first.support.seatWeight,seatEnd:last.support.seatWeight,unsupportedSamples:unsupported.map(s=>s.timeline)};
    choreography.push(result);
    check(`${kind}-support-before-seat-transfer-beat-${beat+1}`,unsupported.length===0,result);
    check(`${kind}-actually-changes-body-level-beat-${beat+1}`,kind==='rise'?travel>.15:travel<-.15,result);
  }
  const prematureStanding=samples.filter(({timeline,pose})=>timeline>=13&&timeline<16.18&&pose.seatAmount<.95);
  check('dramatic-return-remains-seated-until-persistence',prematureStanding.length===0,prematureStanding.slice(0,8).map(s=>s.timeline));
  const trophy=samples.filter(({timeline,pose})=>timeline>=16.60&&timeline<=17&&pose.light[1]>pose.head[1]-.15);
  check('persistence-light-remains-below-the-head',trophy.length===0,trophy.slice(0,8).map(s=>s.timeline));
  const visibility=[], handSeparation=[];
  for(const [w,h,compact]of [[696,860,false],[390,228,true]])for(let beat=1;beat<=30;beat++) {
    const timeline=beat,pose=motion.poseAt(timeline),project=geometry.createProjector(positionForTimeline(timeline),w,h,{compact});
    const named=points(pose),p=Object.fromEntries(Object.entries(named).map(([name,value])=>[name,project(value)]));
    // Documentary inserts deliberately crop the rest of the body. Established
    // wide views retain all joints; inserts must retain their declared subject.
    const framing=project.camera.framing||'full',perspective=geometry.perspectiveAt(positionForTimeline(timeline),{compact}),subject=perspective?{point:perspective.subject}:geometry.focusAt(positionForTimeline(timeline),{compact});
    if(framing==='full'){for(const joint of ['head','handL','handR','hip','footL','footR'])if(p[joint][0]<2||p[joint][0]>w-2||p[joint][1]<2||p[joint][1]>h-2)visibility.push({beat:beat+1,w,h,joint,point:p[joint].slice(0,2)});}
    else{const q=project(subject.point);if(q[0]<2||q[0]>w-2||q[1]<2||q[1]>h-2)visibility.push({beat:beat+1,w,h,framing,point:q.slice(0,2)});}
    const a=p.hip,b=p.shoulder,c=p.handR,ab=subtract(b.slice(0,2),a.slice(0,2)),ac=subtract(c.slice(0,2),a.slice(0,2)),t=Math.max(0,Math.min(1,dot(ab,ac)/dot(ab,ab)));
    handSeparation.push({beat:beat+1,width:w,pixels:round(distance(c.slice(0,2),a.slice(0,2).map((n,i)=>n+ab[i]*t)))});
  }
  check('intended-subject-visible-at-readable-holds',visibility.length===0,visibility);
  const bridgeClipping=[];
  for(const [w,h,compact]of [[696,860,false],[390,228,true]])for(const end of [7,13,17])for(let step=0;step<=20;step++) {
    const timeline=end-1+step/20,pose=motion.poseAt(timeline),project=geometry.createProjector(positionForTimeline(timeline),w,h,{compact}),named=points(pose);
    for(const joint of ['hip','footL','footR']) { const q=project(named[joint]); if(q[0]<2||q[0]>w-2||q[1]<2||q[1]>h-2)bridgeClipping.push({bridge:[end-1,end],timeline,w,h,joint,point:q.slice(0,2)}); }
  }
  check('support-bridges-show-feet-and-pelvis',bridgeClipping.length===0,bridgeClipping);
  const renderedContacts=[],exactFingerContacts=[],paintedContactGaps=[],lightMisalignment=[],phantomEmitterStrokes=[];
  const renderSamples=[...Array.from({length:30},(_,i)=>i+1),...Array.from({length:30},(_,i)=>[i+.35,i+.50,i+.65]).flat().filter(t=>t>=1),6.24,6.48,12.24,12.48,16.24,16.48,16.76];
  for(const timeline of renderSamples) {
    const position=positionForTimeline(timeline),pose=motion.poseAt(timeline),lines=geometry.frame(position,1),illustrations=geometry.illustration(position),signal=lines.find(line=>line.id===0);
    const lightError=Math.max(distance(geometry.lightAt(position),pose.light),signal?distance(signal.points[0],pose.light):Infinity);
    if(lightError>1e-6)lightMisalignment.push({timeline,error:lightError});
    // A correct first point can conceal a bowed stationary "segment". Every
    // emitted vertex must coincide with the light after the opening formation.
    const emitter=geometry.lightAt(position),strokeError=signal?Math.max(...signal.points.map(point=>distance(point,emitter))):Infinity;
    if(strokeError!==0)phantomEmitterStrokes.push({timeline,error:strokeError});
    for(const [side,part]of [['left','handL'],['right','handR']]) {
      const contact=pose.contacts[side]; if(!contact?.active||contact.weight<.999)continue;
      const stylus=side==='right'&&/write|draw|stylus/.test(contact.grip);
      const surface=lines.filter(line=>line.alpha>.1&&(stylus?line.group==='tool':line.part===part&&line.group==='hand')).flatMap(line=>line.points);
      const error=surface.length?Math.min(...surface.map(point=>distance(point,contact.target))):Infinity;
      if(error>.04)renderedContacts.push({timeline,side,grip:contact.grip,error});
      const feature=contact.shape?.contactFeature;
      if(feature==='index-tip') {
        const endpoints=lines.filter(line=>line.alpha>.1&&line.part===part&&line.group==='hand').map(line=>line.points.at(-1));
        const error=endpoints.length?Math.min(...endpoints.map(point=>distance(point,contact.target))):Infinity;
        if(error>1e-6)exactFingerContacts.push({timeline,side,feature,error});
      } else if(feature==='palm-pad'&&error>.006)exactFingerContacts.push({timeline,side,feature,error});
      if(paintedSpaces.has(contact.space)) {
        const result=paintedSurfaceGap(position,contact,lines,illustrations);
        if(result.error>.045)paintedContactGaps.push({timeline,side,grip:contact.grip,space:contact.space,error:result.error,reason:result.count?'target-is-away-from-painted-surface':'no-visible-surface'});
      }
    }
  }
  check('rendered-hand-or-tool-meets-locked-contact',renderedContacts.length===0,renderedContacts);
  check('visible-index-tip-or-palm-pad-is-the-contact-feature',exactFingerContacts.length===0,exactFingerContacts);
  check('locked-contacts-meet-the-painted-object-or-support',paintedContactGaps.length===0,paintedContactGaps);
  check('stationary-emitter-has-no-phantom-stroke',phantomEmitterStrokes.length===0,{samples:renderSamples.length,failures:phantomEmitterStrokes});
  const contactIntervals=[],boundaryContactGaps=[],fadedSupports=[],typingContactErrors=[];
  const contactKey=(pose,side)=>{const c=pose.contacts[side];return c.active&&c.weight>.999?JSON.stringify([c.space,c.grip,c.effector]):null;};
  for(const side of ['left','right']) {
    let key=contactKey(samples[0].pose,side),start=key?0:null;
    for(let i=1;i<samples.length;i++) {
      const next=contactKey(samples[i].pose,side);if(next===key)continue;
      let lower=samples[i-1].timeline,upper=samples[i].timeline;
      for(let j=0;j<30;j++){const middle=(lower+upper)/2;if(contactKey(motion.poseAt(middle),side)===key)lower=middle;else upper=middle;}
      const boundary=(lower+upper)/2;
      if(key&&boundary>1)contactIntervals.push({side,start:Math.max(1,start),end:boundary,key});
      start=next?boundary:null;key=next;
    }
    if(key)contactIntervals.push({side,start:Math.max(1,start),end:30,key});
  }
  let paintedBoundaryProbes=0;
  for(const interval of contactIntervals) {
    if(interval.end-interval.start<1e-7)continue;
    const inset=Math.min(.0001,(interval.end-interval.start)/8);
    for(const [phase,timeline]of [['acquire',interval.start+inset],['hold',(interval.start+interval.end)/2],['release',interval.end-inset]]) {
      const pose=motion.poseAt(timeline),contact=pose.contacts[interval.side];if(!paintedSpaces.has(contact.space)||!contact.active)continue;
      const result=paintedSurfaceGap(positionForTimeline(timeline),contact);paintedBoundaryProbes++;
      if(result.error>.045)boundaryContactGaps.push({timeline,side:interval.side,phase,grip:contact.grip,space:contact.space,error:result.error,interval:[interval.start,interval.end]});
      if(contact.space==='support'&&result.supportAlpha<.1)fadedSupports.push({timeline,side:interval.side,phase,alpha:result.supportAlpha});
      if(contact.space==='keyboard') {
        const part=interval.side==='left'?'handL':'handR',ends=geometry.frame(positionForTimeline(timeline),1).filter(line=>line.part===part&&line.group==='hand'&&line.alpha>.1).map(line=>line.points.at(-1));
        const error=ends.length?Math.min(...ends.map(point=>distance(point,contact.target))):Infinity;
        if(error>1e-6||result.error>.002)typingContactErrors.push({timeline,side:interval.side,phase,visibleTipError:error,paintedKeyGap:result.error});
      }
    }
  }
  check('painted-contact-is-real-at-acquisition-and-release',boundaryContactGaps.length===0,{intervals:contactIntervals.length,probes:paintedBoundaryProbes,failures:boundaryContactGaps});
  check('load-bearing-palm-rest-remains-visible-until-release',fadedSupports.length===0,fadedSupports);
  check('moving-index-tip-meets-painted-keys-during-every-press',typingContactErrors.length===0,typingContactErrors);
  check('rendered-light-remains-on-rig-emitter',lightMisalignment.length===0,lightMisalignment);
  // Ownership is checked across the complete drawing→typing handoff, including
  // the moment the hand opens and the period when the docked stylus stays visible.
  const handoff=Array.from({length:401},(_,i)=>({timeline:2+i/400,pose:motion.poseAt(2+i/400)}));
  const toolProblems=[],dockSliding=[],toolJumps=[],typingWithStylus=[],toolLengths=[];
  for(let i=0;i<handoff.length;i++) {
    const {timeline,pose}=handoff[i],tool=pose.tool;
    if(!tool||!isPoint(tool.tip)||!isPoint(tool.shaftEnd)||!Number.isFinite(tool.held)||!Number.isFinite(tool.alpha)){toolProblems.push({timeline,reason:'missing-tool-state'});continue;}
    toolLengths.push(distance(tool.tip,tool.shaftEnd));
    if(tool.held<.999&&tool.alpha>.05) {
      const error=Math.max(distance(tool.tip,tool.dock.tip),distance(tool.shaftEnd,tool.dock.shaftEnd));
      if(error>.003)dockSliding.push({timeline,error});
    }
    if(pose.contacts.right.active&&pose.contacts.right.space==='keyboard'&&tool.held>.001)typingWithStylus.push({timeline,held:tool.held});
    if(i&&tool.alpha>.05&&handoff[i-1].pose.tool?.alpha>.05) {
      const previous=handoff[i-1].pose.tool,error=Math.max(distance(previous.tip,tool.tip),distance(previous.shaftEnd,tool.shaftEnd));
      if(error>.05)toolJumps.push({timeline,error});
    }
  }
  check('stylus-has-explicit-continuous-ownership-state',toolProblems.length===0,toolProblems);
  check('stylus-is-rigid-through-the-handoff',toolLengths.length===401&&Math.max(...toolLengths)-Math.min(...toolLengths)<1e-6,{min:Math.min(...toolLengths),max:Math.max(...toolLengths)});
  check('stylus-is-docked-before-grip-releases',dockSliding.length===0,dockSliding);
  check('no-visible-stylus-jump-through-release',toolJumps.length===0,toolJumps);
  check('right-hand-releases-stylus-before-typing-contact',typingWithStylus.length===0,typingWithStylus);
  check('typing-begins-with-the-released-pen-still-visible',handoff.some(({pose})=>pose.contacts.right.active&&pose.contacts.right.space==='keyboard'&&pose.tool?.held<.001&&pose.tool.alpha>.1));
  const renderHandoff=[],ownershipRendering=[],penOnKeys=[];
  for(let i=0;i<=40;i++) {
    const timeline=2+i/40,position=positionForTimeline(timeline),pose=motion.poseAt(timeline),tool=pose.tool,lines=geometry.frame(position,1).filter(line=>line.group==='tool'&&line.alpha>.05);
    renderHandoff.push({timeline,lines});
    if(tool?.alpha>.10) {
      if(!lines.length){ownershipRendering.push({timeline,reason:'visible-tool-missing'});continue;}
      const endPoints=lines.flatMap(line=>[line.points[0],line.points.at(-1)]),error=Math.max(Math.min(...endPoints.map(p=>distance(p,tool.tip))),Math.min(...endPoints.map(p=>distance(p,tool.shaftEnd))));
      if(error>1e-5)ownershipRendering.push({timeline,error,reason:'painted-tool-does-not-follow-owned-tool'});
    }
    if(tool?.held<.001&&tool.alpha>.1&&pose.phase.to===3&&pose.phase.stage==='action') {
      const keys=geometry.illustration(position).filter(layer=>layer.alpha>.35).flatMap(layer=>layer.paths).filter(item=>item.role==='keyboard'&&item.fill&&item.alpha>.1);
      let collision=false;
      for(let j=0;j<=16;j++) { const point=tool.tip.map((n,i)=>n+(tool.shaftEnd[i]-n)*j/16); if(keys.some(item=>distanceToPaintedPath(point,item)<.012))collision=true; }
      if(collision)penOnKeys.push({timeline,tip:tool.tip,shaftEnd:tool.shaftEnd});
    }
  }
  check('rendered-stylus-persists-at-the-dock-after-release',ownershipRendering.length===0,ownershipRendering);
  check('docked-pen-clears-the-painted-keyboard-during-typing',penOnKeys.length===0,penOnKeys);
  const rewind=renderHandoff.slice().reverse().map(({timeline})=>({timeline,lines:geometry.frame(positionForTimeline(timeline),1).filter(line=>line.group==='tool'&&line.alpha>.05)})).reverse();
  check('painted-tool-rewinds-exactly-after-release',JSON.stringify(renderHandoff)===JSON.stringify(rewind));
  const pinchGaps=[];
  for(let step=0;step<=52;step++) {
    const timeline=1+step*.025,pose=motion.poseAt(timeline),tool=pose.tool;
    if(tool.held<.999||tool.alpha<.1)continue;
    const lines=geometry.frame(positionForTimeline(timeline),1).filter(line=>line.part==='handR'&&line.group==='hand'&&line.alpha>.1),frame=pose.frames.wristR;
    for(const name of ['thumb','index']) {
      const finger=pose.contacts.right.shape.fingers.find(f=>f.name===name),local=finger.points.at(-1),tip=pose.handR.map((n,i)=>n+local[0]*frame.x[i]+local[1]*frame.y[i]+local[2]*frame.z[i]);
      const strands=lines.filter(line=>distance(line.points.at(-1),tip)<1e-6),vertices=strands.flatMap(line=>line.points),error=vertices.length?Math.min(...vertices.map(p=>pointToSegment(p,tool.tip,tool.shaftEnd))):Infinity;
      if(error>.015)pinchGaps.push({timeline,finger:name,error,reason:vertices.length?'finger-does-not-meet-shaft':'expected-finger-is-not-rendered'});
    }
  }
  check('visible-thumb-and-index-grip-the-held-stylus',pinchGaps.length===0,pinchGaps);
  const depthVisibility=[],depthAttachment=[];
  for(const position of [6.85,7.25,7.60,7.85]) {
    const base=geometry.illustration(position,0),expanded=geometry.illustration(position,1),front=layers=>layers.filter(layer=>layer.role==='front-work').map(layer=>({index:layer.index,paths:layer.paths}));
    if(JSON.stringify(front(base))!==JSON.stringify(front(expanded)))depthAttachment.push({position,reason:'front-work-changed'});
    const physical=explode=>geometry.frame(position,1,explode).filter(line=>line.part!=='environment');
    if(JSON.stringify(physical(0))!==JSON.stringify(physical(1)))depthAttachment.push({position,reason:'performer-or-support-changed'});
    const layers=expanded.filter(layer=>layer.role==='depth-layer'&&layer.alpha>.1);
    for(const [width,height,compact]of [[696,860,false],[390,228,true],[480,620,false]]) {
      const project=geometry.createProjector(position,width,height,{compact,expanded:1}),rig=geometry.performanceAt(position),frontCentre=project(rig.work.origin);
      const fills=base.filter(layer=>layer.role==='front-work'&&layer.alpha>.35).flatMap(layer=>layer.paths).filter(item=>item.fill&&item.alpha>.1).map(item=>({...item,points:item.points.map(p=>[...project(p).slice(0,2),0])}));
      if(layers.length!==2)depthVisibility.push({position,width,reason:'two-visible-depth-layers-missing',layers:layers.length});
      for(const layer of layers) {
        const boundary=layer.paths.find(path=>path.id.endsWith('-boundary')),projected=boundary.points.map(project),centre=[0,1].map(axis=>projected.reduce((sum,p)=>sum+p[axis],0)/projected.length),separation=distance(centre,frontCentre.slice(0,2));
        const visibleFraction=projected.filter(p=>p[0]>=2&&p[0]<=width-2&&p[1]>=2&&p[1]<=height-2).length/projected.length;
        const isExposed=p=>p[0]>2&&p[0]<width-2&&p[1]>2&&p[1]<height-2&&fills.every(item=>distanceToPaintedPath([p[0],p[1],0],item)>1.5);
        const exposed=layer.paths.filter(item=>item.alpha>.1).flatMap(item=>item.points).map(project).filter(isExposed).length;
        const visibleNodePoints=Math.max(0,...layer.paths.filter(item=>item.id.includes('-node-')).map(item=>item.points.map(project).filter(isExposed).length));
        let visibleConnectionLength=0;
        for(const path of layer.paths.filter(item=>item.id.includes('-connection-'))) {
          const points=path.points.map(project);
          for(let i=1;i<points.length;i++)for(let step=0;step<8;step++) {
            const middle=points[i-1].map((n,axis)=>n+(points[i][axis]-n)*(step+.5)/8);
            if(isExposed(middle))visibleConnectionLength+=distance(points[i-1].slice(0,2),points[i].slice(0,2))/8;
          }
        }
        if(separation<(compact?5:10)||exposed<12||visibleNodePoints<8||visibleConnectionLength<(compact?3:8)||visibleFraction<.98)depthVisibility.push({position,width,layer:layer.id,separation,exposed,visibleNodePoints,visibleConnectionLength,visibleFraction});
      }
    }
  }
  check('depth-disclosure-leaves-front-work-and-performer-fixed',depthAttachment.length===0,depthAttachment);
  check('disclosed-depth-layers-are-projectably-visible',depthVisibility.length===0,depthVisibility);
  if(process.env.FRAME_PARITY_BASELINE||process.env.COMPARE_FROZEN_FRAME==='1') {
    const result=compareFrameBaseline();
    check('geometry-matches-frozen-pre-cache-output',result.changes.every(c=>result.visibleOnly&&c.field==='full'),result);
  }
  const held=geometry.frame(positionForTimeline(2.32),1,0),saved=digest(canonicalFrame(held));geometry.frame(positionForTimeline(17),2,1);geometry.frame(positionForTimeline(24.5),1,0);
  check('later-frame-requests-do-not-mutate-held-snapshots',digest(canonicalFrame(held))===saved);
  observations.push({name:'projected-right-hand-to-torso-centreline',note:'Diagnostic only: a thin joint centreline is not a torso contour or an emotion recognition score.',measurements:handSeparation});
  writeReviewSheets();
  if(process.env.SKIP_BROWSER!=='1')await browserChecks();
  const sources=Object.fromEntries(['geometry.js','motion.js','hand-shapes.js','living.js','scenes.js','performance-source/pilot-clips.js'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.resolve('assets/profile',name))).digest('hex')]));
  const report={generatedAt:new Date().toISOString(),sources,samples:samples.length,timelineRange:[0,30],coverage:{boundaryProbes:boundaries.length,renderedPoseSamples:renderSamples.length,contactIntervals:contactIntervals.length,paintedBoundaryProbes,toolHandoffSamples:handoff.length,renderedToolHandoffSamples:renderHandoff.length},checks,observations,browserErrors,anatomy:ranges,choreography,limits:['No human emotion-recognition test was performed.','Support checks validate contact choreography, not a force-based biomechanical simulation.','Browser captures are emulated viewports, not physical-device tests.']};
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>!c.pass).map(c=>c.name),output:out},null,2));
  if(checks.some(c=>!c.pass)||browserErrors.length)process.exitCode=1;
}
if(process.env.CHECK_FRAME_PARITY==='1') { const result=compareFrameBaseline();fs.writeFileSync(path.join(out,'frame-parity.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(result.changes.some(c=>!result.visibleOnly||c.field!=='full'))process.exitCode=1; }
else if(process.env.CAPTURE_FRAME_BASELINE==='1')writeFrameBaseline();
else main().catch(error=>{fs.writeFileSync(path.join(out,'run-error.txt'),error.stack);console.error(error);process.exitCode=1;});
