/* Actual page, native document scrolling. No animation state setters. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const mobile=process.env.VIEW==='mobile',out=path.resolve('docs/evidence/cinematic-lines'),raw=path.resolve('/workspace/releases/cinematic-lines-'+(mobile?'mobile':'desktop'));
fs.mkdirSync(raw,{recursive:true});
(async()=>{const b=await chromium.launch();try{
 const viewport=mobile?{width:390,height:844}:{width:1440,height:1000},context=await b.newContext({viewport,recordVideo:{dir:raw,size:viewport}}),p=await context.newPage(),errors=[],takes=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.TEST_URL||'http://127.0.0.1:4174/')+'profile/#origins');await p.waitForFunction(()=>window.ProfileExperience,null,{polling:50});await p.evaluate(()=>document.fonts.ready);
 const shots=mobile?[['origins',1],['conviction',5.25],['craft',6.55],['contact',10]]:[['origins',1],['allianz',2],['ttb',4.4],['conviction',5.25],['craft',6.55],['ai-experiences',7.35],['contact',10]];
 for(const [id,position]of shots){
  await p.locator('#'+id).evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  if(position%1)await p.evaluate(position=>{const a=ProfileExperience.snapshot().anchors,m=ProfileGeometry.config.morph,c=Math.floor(position);scrollTo({top:a[c]+(a[c+1]-a[c])*(m.start+(m.end-m.start)*(position-c)),behavior:'instant'});},position);
  await p.waitForFunction(position=>Math.abs(ProfileExperience.snapshot().target-position)<.015,position,{polling:50});
  await p.waitForTimeout(5700);const s=await p.evaluate(()=>{const s=ProfileExperience.snapshot();return {current:s.current,cinematic:s.cinematic};});takes.push({id,position,...s});
 }
 const video=p.video();await context.close();await video.saveAs(path.join(raw,'preview.webm'));fs.writeFileSync(path.join(out,(mobile?'mobile':'desktop')+'-capture.json'),JSON.stringify({viewport,takes,errors,raw:path.join(raw,'preview.webm')},null,2));console.log(JSON.stringify({shots:takes.length,errors,raw}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
