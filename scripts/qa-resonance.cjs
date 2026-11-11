/* Actual browser audio graph, trusted taps, 14 separate renderers, input/state regressions. */
const {chromium,webkit}=require('playwright'),fs=require('fs'),crypto=require('crypto');
(async()=>{
 const engine=process.env.ENGINE||'webkit',base=process.env.TEST_URL||'http://127.0.0.1:8774/',out=process.env.QA_DIR||'qa-output/resonance-'+engine;
 fs.mkdirSync(out,{recursive:true});const checks=[],errors=[];const check=(name,pass,data={})=>{checks.push({name,pass,...data});console.log(name,pass);};
 const browser=await(engine==='webkit'?webkit.launch({headless:true}):chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined}));
 try{
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().includes('summary.json'))errors.push(r.status()+' '+r.url());});
 await p.addInitScript(()=>localStorage.setItem('holyboom-motion','off'));await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>HolyMindNeural.snapshot().paths===46&&HolyMindAudio.snapshot().warm===14);
 check('release-v11',await p.locator('html').getAttribute('data-build')==='resonance-v11');
 check('fourteen-styles-two-signatures',await p.evaluate(()=>HolyMindReactions.styles.length===14&&HolyMindReactions.styles.filter(s=>s.rare).length===2));
 check('no-context-no-autoplay-before-gesture',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'&&HolyMindAudio.snapshot().played===0));
 await p.evaluate(()=>HolyMindAssemblyScroll.seek(100));await p.waitForTimeout(650);check('scroll-before-tap-remains-silent',await p.evaluate(()=>HolyMindAudio.snapshot().context==='uncreated'&&HolyMindAudio.snapshot().played===0));await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(1200);
 check('always-on-motion-unaffected',await p.evaluate(()=>document.body.dataset.motion==='on'&&document.body.dataset.motionProfile==='full'&&HolyMindNeural.snapshot().running));
 const tap=async()=>{const r=await p.locator('[data-brain-target=hero]').boundingBox();await p.touchscreen.tap(r.x+r.width*.5,r.y+r.height*.45);};
 await tap();await p.waitForTimeout(230);
 const a=await p.evaluate(()=>({audio:HolyMindAudio.snapshot(),neural:HolyMindNeural.snapshot()}));
 check('trusted-tap-unlocks-real-audio',a.audio.unlocked&&a.audio.context==='running'&&a.audio.played===1,{state:a.audio.context,scheduleMs:a.audio.lastScheduleMs});
 check('audio-graph-carries-nonzero-signal',a.audio.maxRms>0.0001,{maxRms:a.audio.maxRms});
 check('sound-preset-matches-visual',a.audio.lastStyle===a.neural.lastStyle);
 check('reaction-name-visible',await p.locator('#reaction-readout').innerText()!== '14 reactions. One deliberate mind.');
 await p.screenshot({path:out+'/mobile-reaction.jpg',quality:86});
 const pick=await p.evaluate(()=>{const seq=[];for(let i=0;i<1200;i++)seq.push(HolyMindReactions.pick(i%2?'orbit':'hero').id);return {unique:[...new Set(seq)],recentRepeat:seq.some((s,i)=>seq.slice(Math.max(0,i-3),i).includes(s)),rare:seq.filter(s=>['holy-prime','triad-resonance'].includes(s)).length};});
 check('random-covers-all-fourteen',pick.unique.length===14,{unique:pick.unique});check('no-repeat-in-last-three',!pick.recentRepeat);check('signature-effects-are-infrequent',pick.rare>0&&pick.rare/1200<.15,{rare:pick.rare,total:1200});
 const ids=await p.evaluate(()=>HolyMindReactions.styles.map(s=>s.id));
 await p.waitForTimeout(1200);
 for(const id of ids){await p.evaluate(id=>HolyMindNeural.burst({styleId:id,x:.5,y:.46}),id);await p.waitForTimeout(235);const r=await p.evaluate(()=>({a:HolyMindAudio.snapshot(),n:HolyMindNeural.snapshot()}));check('style-audio-'+id,r.n.lastStyle===id&&r.a.lastStyle===id&&r.n.activeBursts<=3&&r.a.voices<=3);}
 check('bounded-audio-polyphony',await p.evaluate(()=>HolyMindAudio.snapshot().peakVoices<=3));
 await p.waitForTimeout(1600);check('voices-and-bursts-clean-up',await p.evaluate(()=>HolyMindAudio.snapshot().voices===0&&HolyMindNeural.snapshot().activeBursts===0));
 // Isolated same-time renders establish geometric variety, not merely renamed presets.
 const rendered=await p.evaluate(async()=>{
  const paths=await fetch('assets/neural-paths.json').then(r=>r.json()).then(d=>d.paths),image=new Image();image.src='assets/brain-480.webp';await image.decode();
  const glyphs={};for(const s of HolyMindReactions.styles){const im=new Image();im.src='assets/skills/'+s.glyph+'.webp';await im.decode();glyphs[s.glyph]=im;}
  const results=[];
  for(const s of HolyMindReactions.styles){const c=document.createElement('canvas');c.width=c.height=480;const ctx=c.getContext('2d');ctx.fillStyle='#100b1b';ctx.fillRect(0,0,480,480);ctx.globalAlpha=.5;ctx.drawImage(image,0,0,480,480);ctx.globalAlpha=1;
   const line=(pts,color,a,width=1.7)=>{if(pts.length<2)return;ctx.beginPath();pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](Math.round(p[0]/2)*2,Math.round(p[1]/2)*2));ctx.strokeStyle=color;ctx.globalAlpha=a;ctx.lineWidth=width;ctx.stroke();ctx.globalAlpha=1;};
   const star=(x,y,r,a,c)=>{ctx.fillStyle=c;ctx.globalAlpha=a;ctx.fillRect(x-r,y-1,r*2+2,2);ctx.fillRect(x-1,y-r,2,r*2+2);ctx.globalAlpha=1;};
   HolyMindReactions.draw({ctx,line,star,glow:()=>{},paths,glyph:id=>glyphs[id]},{styleId:s.id,x:240,y:228,seed:9,paths:[0,7,14]},.34,.8);
   results.push({id:s.id,png:c.toDataURL().split(',')[1]});}
  return results;
 });
 const hashes=[];for(const r of rendered){const b=Buffer.from(r.png,'base64');hashes.push(crypto.createHash('sha256').update(b).digest('hex'));fs.writeFileSync(out+'/'+r.id+'.png',b);}check('fourteen-distinct-same-phase-images',new Set(hashes).size===14);
 await p.locator('#sound-toggle').tap();const muted=await p.evaluate(()=>({a:HolyMindAudio.snapshot().played,n:HolyMindNeural.snapshot().burstCount}));await tap();await p.waitForTimeout(250);
 check('mute-stops-sound-not-motion',await p.evaluate(v=>HolyMindAudio.snapshot().played===v.a&&HolyMindNeural.snapshot().burstCount===v.n+1&&HolyMindNeural.snapshot().running,muted));
 await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(250);check('mute-persists-without-disabling-motion',await p.evaluate(()=>!HolyMindAudio.snapshot().enabled&&document.body.dataset.motion==='on'));
 await p.locator('.sonic-settings summary').click();await p.locator('#sound-volume').fill('0');await p.reload({waitUntil:'networkidle'});check('zero-volume-persists',await p.evaluate(()=>HolyMindAudio.snapshot().volume===0));
 await p.locator('.sonic-settings summary').click();await p.locator('#sound-volume').fill('48');await p.locator('.sonic-settings summary').click();await p.locator('#sound-toggle').tap();await p.waitForTimeout(300);
 await tap();await p.waitForTimeout(160);const count=await p.evaluate(()=>HolyMindAudio.snapshot().played);await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await p.waitForTimeout(150);
 check('background-stops-voices',await p.evaluate(()=>HolyMindAudio.snapshot().voices===0));await p.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await p.waitForTimeout(300);check('no-delayed-audio-on-return',await p.evaluate(n=>HolyMindAudio.snapshot().played===n,count));await tap();await p.waitForTimeout(220);check('next-tap-resumes-audio',await p.evaluate(n=>HolyMindAudio.snapshot().played>n&&HolyMindAudio.snapshot().context==='running',count));
 // Four assembly milestones; hovering around a threshold never retriggers it.
 await p.evaluate(()=>HolyMindAssemblyScroll.seek(0));await p.waitForTimeout(700);const startCount=await p.evaluate(()=>HolyMindAudio.snapshot().history.filter(h=>h.kind==='milestone').length);
 for(const value of [26,51,76,100]){await p.evaluate(v=>HolyMindAssemblyScroll.seek(v),value);await p.waitForTimeout(720);}
 const milestones=await p.evaluate(()=>HolyMindAudio.snapshot().history.filter(h=>h.kind==='milestone'));
 check('four-forward-milestone-cues',milestones.length-startCount===4,{ids:milestones.slice(-4).map(x=>x.id)});
 await p.evaluate(()=>HolyMindAssemblyScroll.seek(74));await p.waitForTimeout(650);await p.evaluate(()=>HolyMindAssemblyScroll.seek(76));await p.waitForTimeout(650);check('milestone-boundary-no-repeat',await p.evaluate(n=>HolyMindAudio.snapshot().history.filter(h=>h.kind==='milestone').length===n,milestones.length));
 await p.evaluate(()=>HolyMindAssemblyScroll.seek(0));await p.waitForTimeout(650);await p.evaluate(()=>HolyMindAssemblyScroll.seek(100));await p.waitForTimeout(650);check('fast-scroll-plays-one-cue-not-four',await p.evaluate(n=>HolyMindAudio.snapshot().history.filter(h=>h.kind==='milestone').length===n+1,milestones.length));
 for(const width of [320,390,430,680,768,1024,1440]){await p.setViewportSize({width,height:width<700?844:1000});await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(650);const layout=await p.evaluate(()=>{const r=document.querySelector('.neural-stage').getBoundingClientRect(),c=document.querySelector('.hero-copy').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,brainFirst:r.top<c.top,side:c.left<r.left&&r.top<c.bottom,nav:[...document.querySelectorAll('.masthead-inner>*,.nav-actions>*')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,display:getComputedStyle(e).display};})};});check('responsive-'+width,!layout.overflow&&(width<=680?layout.brainFirst:layout.side)&&layout.nav.every(n=>n.display==='none'||n.right<=width+1&&n.left>=-1),{layout});if(width===1440)await p.screenshot({path:out+'/desktop.jpg',quality:86});}
 const q=await browser.newPage({viewport:{width:390,height:844}});q.on('pageerror',e=>errors.push('preview: '+e.message));await q.goto(new URL('qa/resonance-v11.html',base).href,{waitUntil:'networkidle'});check('preview-fourteen-real-selectors',await q.locator('[data-preset]').count()===14);await q.locator('[data-preset=holy-prime]').click();await q.waitForTimeout(250);check('preview-plays-selected-sound',await q.evaluate(()=>HolyMindAudio.snapshot().lastStyle==='holy-prime'&&HolyMindAudio.snapshot().maxRms>0));await q.close();
 const silent=await browser.newPage({viewport:{width:390,height:844}});await silent.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});silent.on('pageerror',e=>errors.push('noaudio: '+e.message));await silent.goto(base,{waitUntil:'networkidle'});const sr=await silent.locator('[data-brain-target=hero]').boundingBox();await silent.mouse.click(sr.x+sr.width*.5,sr.y+sr.height*.45);await silent.waitForTimeout(200);check('no-audio-api-keeps-visuals',await silent.evaluate(()=>HolyMindNeural.snapshot().burstCount===1&&HolyMindNeural.snapshot().running&&document.body.dataset.sound==='unsupported'));await silent.close();
 const failed=checks.filter(c=>!c.pass);fs.writeFileSync(out+'/result.json',JSON.stringify({base,engine,checks,failed,errors,physicalDevice:false},null,2));console.log(JSON.stringify({count:checks.length,failed:failed.map(c=>c.name),errors}));if(failed.length||errors.length)process.exitCode=1;
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
