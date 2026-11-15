/* Behavioral checks run against the built public artifact, with and without JS. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,firefox,webkit}=require('playwright');
const geometry=require('../assets/profile/geometry.js');
const base=process.env.TEST_URL||'http://127.0.0.1:4174/',engine=process.env.ENGINE||'chromium';
const out=process.env.QA_DIR||'/tmp/living-profile-'+engine;fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],check=(name,pass,data)=>{checks.push({name,pass:!!pass,data});if(!pass)console.error('FAIL',name,data);};
(async()=>{
 // Midpoints and both directions exercise mapping, not just the final silhouettes.
 for(let state=0;state<=10;state+=.125){const a=geometry.frame(state),b=geometry.frame(state);assert.deepEqual(a,b);assert(a.every(l=>l.points.every(p=>p.every(Number.isFinite))));}
 const anchors=Array.from({length:11},(_,i)=>i*1000);
 const forward=Array.from({length:101},(_,i)=>geometry.positionFromAnchors(i*100,anchors));
 const reverse=Array.from({length:101},(_,i)=>geometry.positionFromAnchors((100-i)*100,anchors)).reverse();
 check('deterministic-forward-reverse-geometry',JSON.stringify(forward)===JSON.stringify(reverse));
 // The light remains attached to the drawing hand, in either scroll direction.
 for(let position=.125;position<10;position+=.25){
  assert.deepEqual(geometry.lightAt(position),geometry.frame(position)[0].points[0]);
  for(const direction of [-1,1]){const trail=geometry.lightTrail(position,direction);assert.deepEqual(trail[0].point,geometry.lightAt(position));assert(trail.every((p,i)=>p.alpha>=0&&p.alpha<=1&&(!i||p.alpha<=trail[i-1].alpha)));assert.deepEqual(trail.at(-1).point,geometry.lightAt(position-direction*geometry.config.gravity.trailSpan));}
 }
 check('light-trail-attachment-and-directions',true);
 const floorMotion=geometry.config.floorMotion,pulseBefore=geometry.config.gravity.collapse;geometry.config.floorMotion={squeeze:0,turn:0,sink:0};const relaxed=geometry.frame(2.5);geometry.config.floorMotion=floorMotion;const collapsed=geometry.frame(2.5);
 const distance=p=>Math.hypot(p[0]+.46,p[2]-.12);
 const world=collapsed.find(l=>l.group==='world'),plain=relaxed.find(l=>l.id===world.id);
 check('terrain-remesh-contracts-around-its-support-centre',world.points.reduce((sum,p)=>sum+distance(p),0)<plain.points.reduce((sum,p)=>sum+distance(p),0)*.98);
 const exact=geometry.frame(3);geometry.config.gravity.collapse=0;check('gravity-preserves-chapter-endpoints',JSON.stringify(exact)===JSON.stringify(geometry.frame(3)));geometry.config.gravity.collapse=pulseBefore;
 check('31-authored-scenes',geometry.sequence.length===31&&new Set(geometry.sequence.map(s=>s.action)).size===31);
 check('five-consistent-colour-meanings',Object.keys(geometry.config.tones).length===5&&geometry.sequence.every(s=>geometry.config.tones[s.tone]&&s.meaning));
 for(const shot of geometry.sequence){const position=shot.chapter+(shot.step+.05)/shot.count;
  const objects=geometry.illustration(Math.min(10,position));assert(objects.every(layer=>layer.paths.every(p=>p.points.every(q=>q.every(Number.isFinite)))));
  // Optional labels must not be a requirement for a visible prop: action and
  // meaning live in native HTML, leaving the hands unobstructed on the Canvas.
  if(shot.prop!=='none')assert(objects.some(layer=>layer.alpha>.005&&layer.paths.length>3&&layer.paths.some(p=>p.alpha>.1&&p.points.length>3)));
  const state=geometry.frame(Math.min(10,position));assert(state.length===geometry.LINES);
 }
 check('recognizable-props-for-all-28-story-scenes',true);
 const browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,...(process.env.CHROMIUM_PATH&&engine==='chromium'?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:process.env.RECORD_VIDEO==='1'?{dir:out,size:{width:1440,height:1000}}:undefined});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));const external=[];p.on('request',r=>{if(!r.url().startsWith(new URL(base).origin))external.push(r.url());});
  await p.goto(base+'profile/');await p.waitForFunction(()=>window.ProfileExperience);await p.evaluate(()=>document.fonts.ready);
  check('native-career-and-identity',(await p.locator('main').innerText()).includes('AI experiences')&&await p.locator('h1').count()===1);
  check('narrative-bridges',await p.locator('.story-bridge').count()===8);
  check('human-geometry',geometry.LINES>400&&geometry.frame(1).some(l=>l.group==='hand')&&geometry.frame(1).some(l=>l.group==='code'));
  const nativeBeats=await p.locator('[data-story-beat]').evaluateAll(items=>Object.fromEntries(items.map(el=>[el.dataset.storyBeat,el.textContent])));
  check('all-scene-actions-in-native-html',Object.keys(nativeBeats).length===28&&geometry.sequence.filter(s=>s.chapter>0&&s.chapter<9).every(s=>nativeBeats[s.chapter+':'+s.step]?.includes(s.action)));
  const sceneAnchors=await p.evaluate(()=>ProfileExperience.snapshot().anchors);
  async function moveThrough(start,end){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),start);await p.waitForTimeout(250);await p.evaluate(async({start,end})=>{const began=performance.now();await new Promise(resolve=>{function step(now){const t=Math.min(1,(now-began)/700);scrollTo({top:start+(end-start)*t,behavior:'instant'});if(t<1)requestAnimationFrame(step);else resolve();}requestAnimationFrame(step);});},{start,end});}
  const start=sceneAnchors[1]+(sceneAnchors[2]-sceneAnchors[1])*.3,end=sceneAnchors[1]+(sceneAnchors[2]-sceneAnchors[1])*.65;
  await moveThrough(start,end);let trailState=await p.evaluate(()=>ProfileExperience.snapshot());check('scroll-down-light-trail',trailState.trailEnergy>.05&&trailState.trailDirection===1,trailState.trailEnergy);
  await moveThrough(end,start);trailState=await p.evaluate(()=>ProfileExperience.snapshot());check('scroll-up-light-trail',trailState.trailEnergy>.05&&trailState.trailDirection===-1,trailState.trailEnergy);
  // Start the rest window after the eased scene has actually stopped moving.
  await p.waitForFunction(()=>ProfileExperience.snapshot().current===ProfileExperience.snapshot().target);
  await p.waitForTimeout(1100);check('stationary-trail-fades',await p.evaluate(()=>ProfileExperience.snapshot().trailEnergy===0));
  const visited=[];
  for(const [index,shot]of geometry.sequence.entries()){
   if(shot.chapter>=9)continue;
   const local=(shot.step+.05)/shot.count,y=sceneAnchors[shot.chapter]+(sceneAnchors[shot.chapter+1]-sceneAnchors[shot.chapter])*(geometry.config.morph.start+(geometry.config.morph.end-geometry.config.morph.start)*local);
   await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForFunction(expected=>Math.abs(ProfileExperience.snapshot().target-expected)<.005,shot.chapter+local);await p.waitForFunction(()=>Math.abs(ProfileExperience.snapshot().current-ProfileExperience.snapshot().target)<.0001);
   const displayed=await p.locator('.transition-copy').innerText();if(displayed===shot.action)visited.push(index);
  }
  check('all-29-sticky-scenes-reachable-and-captioned',visited.length===29,visited);
  const names=['intro','origins','allianz','accenture','ttb','conviction','craft','ai-experiences','work-heading','experience','contact'];
  const screenshotStates=[0,1,2,3,4,5,6,7,8,10];
  for(let i=0;i<names.length;i++){
   await p.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),names[i]);await p.waitForFunction(i=>Math.abs(ProfileExperience.snapshot().target-i)<.05,i);await p.waitForTimeout(200);
   const state=await p.evaluate(()=>ProfileExperience.snapshot());check('chapter-target-'+names[i],Math.abs(state.target-i)<.05,state.target);
   if(i===9)check('reflection-canvas-docked-and-visible',await p.locator('#experience canvas').count()===1&&await p.locator('#experience canvas').isVisible());
   if(screenshotStates.includes(i))await p.screenshot({path:path.join(out,`desktop-${String(i).padStart(2,'0')}.png`)});
  }
  check('contact-canvas-docked',await p.locator('#contact canvas').count()===1);
  await p.locator('a[href="#origins"]').first().click();await p.waitForTimeout(1000);check('return-from-contact',await p.locator('.stage canvas').count()===1);
  await p.evaluate(()=>document.querySelector('#ai-experiences').scrollIntoView({behavior:'instant'}));await p.waitForTimeout(200);await p.locator('#beneath summary').click();await p.waitForTimeout(500);
  check('inspect-structure',await p.evaluate(()=>document.querySelector('#beneath').open&&ProfileExperience.snapshot().exploded>.95));
  await p.screenshot({path:path.join(out,'beneath.png')});
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(200);check('scroll-preserves-disclosure',await p.locator('#beneath').getAttribute('open')!==null);
  check('motion-control-removed',await p.locator('#motion,.motion-control').count()===0);
  await p.emulateMedia({reducedMotion:'reduce'});check('owner-full-ignores-os-preference',await p.evaluate(()=>ProfileExperience.snapshot().mode==='full'&&!ProfileExperience.snapshot().reduced&&document.documentElement.dataset.profileMotion==='full'));
  await p.evaluate(()=>localStorage.setItem('holyboom.profile.motion.v1','reduced'));await p.reload();await p.waitForFunction(()=>window.ProfileExperience);check('legacy-stored-preference-cannot-change-full',await p.evaluate(()=>ProfileExperience.snapshot().mode==='full'&&!ProfileExperience.snapshot().reduced)&&await p.locator('.stage').isVisible());
  await p.emulateMedia({reducedMotion:'no-preference'});
  for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768],[1440,1000],[1920,1080],[844,390]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(250);
   check('no-overflow-'+width,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===390||width===1440)await p.screenshot({path:path.join(out,'hero-'+width+'.png')});
  }
  await p.setViewportSize({width:390,height:600});await p.waitForTimeout(200);check('short-phone-retains-full-motion',await p.locator('.stage').isVisible()&&await p.evaluate(()=>ProfileExperience.snapshot().mode==='full'));
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(150);const mobileBefore=await p.evaluate(()=>ProfileExperience.snapshot().anchors);
  await p.setViewportSize({width:390,height:780});await p.waitForTimeout(150);check('toolbar-no-reset',await p.evaluate(()=>ProfileExperience.snapshot().target===0));
  await p.goto(base+'profile/#ttb');await p.waitForFunction(()=>Math.abs(ProfileExperience.snapshot().target-4)<.1);check('deep-link',Math.abs((await p.evaluate(()=>ProfileExperience.snapshot())).target-4)<.1);
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(100);await p.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await p.waitForTimeout(400);check('fast-scroll-no-backlog',(await p.evaluate(()=>ProfileExperience.snapshot())).target===10);
  check('no-runtime-third-party',external.length===0,external);check('runtime-errors',errors.length===0,errors);
  const video=p.video();await context.close();if(video)await video.saveAs(path.join(out,'journey.webm'));
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),q=await noJS.newPage();
  await q.goto(base+'profile/');check('no-js-complete',await q.locator('[data-scene]').count()===11&&(await q.locator('main').innerText()).includes('FastAPI'));
  check('no-js-fallback',await q.locator('#intro .scene-fallback').isVisible());await q.locator('#beneath summary').click();check('native-inspection',await q.locator('#beneath').getAttribute('open')!==null);
  await q.locator('.questions summary').first().click();check('native-faq',await q.locator('.questions details[open]').count()===1);
  await q.screenshot({path:path.join(out,'no-js.png')});await q.emulateMedia({media:'print'});check('print-readable',!await q.locator('.stage').isVisible()&&await q.locator('#experience').isVisible());
  await q.goto(base+'th/profile/');check('thai-native-story-without-js',await q.locator('[data-scene]').count()===11&&await q.locator('#conviction').isVisible());check('thai-profile',await q.locator('html').getAttribute('lang')==='th');await noJS.close();
  const failedScript=await browser.newContext({viewport:{width:390,height:844}});await failedScript.route('**/living.js*',route=>route.abort());const fallback=await failedScript.newPage();await fallback.goto(base+'profile/');check('script-failure-fallback',await fallback.locator('#intro .scene-fallback').isVisible()&&await fallback.locator('#contact a.primary').count()===1);await failedScript.close();
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked');}});});const r=await blocked.newPage();await r.goto(base+'profile/');await r.waitForFunction(()=>window.ProfileExperience);check('blocked-storage',await r.evaluate(()=>ProfileExperience.snapshot().mode==='full'));await blocked.close();
 }finally{await browser.close();}
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine,base,checks,errors,physicalDevice:false},null,2));console.log(JSON.stringify({engine,checks:checks.length,failed,output:out},null,2));if(failed.length||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
