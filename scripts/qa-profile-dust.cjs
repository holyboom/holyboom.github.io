/* Independent contracts for scroll-bound surroundings dust.
   Optional DUST_BASELINE points to a pre-change geometry.js copy for exact parity checks.
   Without an existing baseline, parity checks are explicitly skipped. No browser is required. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createRequire}=require('node:module');
const source=path.resolve(__dirname,'../assets/profile/geometry.js'),g=require(source);
const baselinePath=process.env.DUST_BASELINE||null;
const out=path.resolve(process.env.DUST_QA_DIR||'/tmp/profile-dust-qa');
const checks=[];fs.mkdirSync(out,{recursive:true});
const check=(name,pass,data)=>{checks.push({name,pass:!!pass,...(data===undefined?{}:{data})});if(!pass)console.error('FAIL',name,JSON.stringify(data));};
const skip=name=>checks.push({name,pass:null,skipped:true,reason:baselinePath?'DUST_BASELINE file was not found.':'DUST_BASELINE was not provided.'});
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const finite=value=>typeof value==='number'?Number.isFinite(value):Array.isArray(value)?value.every(finite):value&&typeof value==='object'?Object.values(value).every(finite):true;
const distance=(a,b)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const ambient=position=>g.illustration(position).filter(layer=>layer.role==='surroundings');
const paths=layers=>layers.flatMap(layer=>layer.paths.map(item=>({...item,effectiveAlpha:layer.alpha*(item.alpha??1)})));
const particles=layers=>paths(layers).filter(item=>item.particle===true);
const visible=items=>items.filter(item=>item.effectiveAlpha>1e-6);
const work=(api,position,explode=0)=>api.illustration(position,explode).filter(layer=>layer.role!=='surroundings');
// Invert the public resolver rather than assuming a particular easing or scroll mapping.
function inverse(timeline){let lo=0,hi=g.config.scenes.length-1;for(let i=0;i<58;i++){const mid=(lo+hi)/2;if(g.resolve(mid)<timeline)lo=mid;else hi=mid;}return(lo+hi)/2;}
function staticPosition(index){const shot=g.sequence[index];return shot.chapter+(shot.step+.05)/shot.count;}
function loadBaseline(){const module={exports:{}};vm.runInNewContext(fs.readFileSync(baselinePath,'utf8'),{module,exports:module.exports,require:createRequire(source)}, {filename:baselinePath});return module.exports;}

try{
 const baseline=baselinePath&&fs.existsSync(baselinePath)?loadBaseline():null,last=g.sequence.length-1;
 const phases=[0,.01,.02,.08,.16,.25,.37,.5,.63,.75,.84,.92,.98,.99];
 const samples=Array.from({length:last},(_,index)=>phases.map(phase=>({timeline:index+phase,position:inverse(index+phase)}))).flat();
 samples.push({timeline:last,position:staticPosition(last)});
 const forward=samples.map(sample=>hash(ambient(sample.position))),reverse=[...samples.keys()].reverse();
 let seed=0x31d057;const shuffled=[...samples.keys()];for(let i=shuffled.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 check('actual-resolver-inverse-matches-requested-timeline',samples.every(sample=>Math.abs(g.resolve(sample.position)-sample.timeline)<1e-9));
 check('dust-retraces-identically-in-reverse',reverse.every(i=>hash(ambient(samples[i].position))===forward[i]));
 check('dust-is-independent-of-scrubbing-history',shuffled.every(i=>hash(ambient(samples[i].position))===forward[i]));

 const invalid=[],budget=[],endpointDust=[],badSources=[],runaway=[],coarse=[],middle=[],cloudSizes=new Map();
 let maxParticles=0,maxMobileParticles=0,maxCoordinate=0,maxSpread=0;
 for(const sample of samples){
  const layers=ambient(sample.position),all=paths(layers),dust=particles(layers),shown=visible(dust),fraction=sample.timeline%1;
  maxParticles=Math.max(maxParticles,dust.length);maxMobileParticles=Math.max(maxMobileParticles,dust.filter(item=>!item.secondary).length);
  if(dust.length>120)budget.push({timeline:sample.timeline,count:dust.length});
  if(!finite(layers)||all.some(item=>!item.points.length||item.points.some(q=>q.length!==3)||!(item.width>0)||item.effectiveAlpha<0||item.effectiveAlpha>1))invalid.push(sample.timeline);
  if((fraction<.020001||fraction>.979999)&&shown.length)endpointDust.push({timeline:sample.timeline,count:shown.length});
  if(fraction>.2&&fraction<.8&&shown.length)middle.push({timeline:sample.timeline,count:shown.length});
  const sources=new Map(all.filter(item=>!item.particle).map(item=>[item.id,item]));
  if(new Set(all.map(item=>item.id)).size!==all.length)invalid.push({timeline:sample.timeline,reason:'duplicate-path-id'});
  for(const item of all)for(const q of item.points){const bound=Math.max(...q.map(Math.abs));maxCoordinate=Math.max(maxCoordinate,bound);if(bound>8)runaway.push({timeline:sample.timeline,id:item.id,bound});}
  for(const item of dust){
   const parent=sources.get(item.sourcePath);
   if(!parent||!String(item.id)||item.role!=='surroundings'||typeof item.secondary!=='boolean'){badSources.push({timeline:sample.timeline,id:item.id,source:item.sourcePath});continue;}
   const spread=Math.min(...parent.points.map(q=>distance(q,item.points[0])));maxSpread=Math.max(maxSpread,spread);
   if(spread>1.5)runaway.push({timeline:sample.timeline,id:item.id,spread});
   if(item.points.length>8||item.points.some(q=>distance(q,item.points[0])>.6))coarse.push({timeline:sample.timeline,id:item.id,points:item.points.length});
  }
  // Breakup starts with pieces of filament; require those pieces to become fine
  // grains somewhere in the middle, without prescribing when the cloud peaks.
  if(fraction>.2&&fraction<.8&&shown.length){const extent=Math.max(...shown.map(item=>Math.max(...item.points.map(q=>distance(q,item.points[0])))));const index=Math.floor(sample.timeline);cloudSizes.set(index,Math.min(cloudSizes.get(index)??Infinity,extent));}
 }
 check('surroundings-have-finite-valid-geometry',invalid.length===0,invalid.slice(0,8));
 check('particle-budget-never-exceeds-120',budget.length===0,{maxParticles,maxMobileParticles,failures:budget.slice(0,8)});
 check('particles-retain-source-identities-and-mobile-flags',badSources.length===0,badSources.slice(0,8));
 check('dust-stays-near-the-background-pieces',runaway.length===0,{maxCoordinate,maxSpread,failures:runaway.slice(0,8)});
 check('fragments-contract-into-a-fine-cloud',coarse.length===0&&cloudSizes.size>0&&[...cloudSizes.values()].every(extent=>extent<.06),{cloudSizes:Object.fromEntries(cloudSizes),oversizedFragments:coarse.slice(0,8)});
 check('dust-is-visible-during-some-middle-transitions',middle.length>0,{activeSamples:middle.length});
 check('dust-is-invisible-at-transition-ends',endpointDust.length===0,endpointDust.slice(0,8));

 const staticFailures=[],staticDust=[],coreFailures=[],frameFailures=[];
 const shape=layers=>layers.map(layer=>({alpha:layer.alpha,paths:layer.paths.filter(item=>!item.particle).map(item=>({id:item.id,points:item.points,alpha:item.alpha,width:item.width,color:item.color,fill:item.fill,secondary:item.secondary}))}));
 for(let index=0;index<=last;index++){
  const position=staticPosition(index),now=ambient(position);
  if(visible(particles(now)).length)staticDust.push(index);
  if(baseline&&hash(shape(now))!==hash(shape(baseline.illustration(position).filter(layer=>layer.role==='surroundings'))))staticFailures.push(index);
 }
 check('all-integer-beats-have-no-visible-dust',staticDust.length===0,staticDust);
 if(baseline){
 check('undissolved-background-matches-baseline-at-integer-beats',staticFailures.length===0,staticFailures);
 const heroPositions=[0,.01,.04,.08].filter(position=>g.resolve(position)===0);
 check('hero-remains-unchanged',heroPositions.every(position=>hash(g.illustration(position))===hash(baseline.illustration(position))));
 for(const sample of samples){
  const position=sample.position;
  if(hash(g.performanceAt(position))!==hash(baseline.performanceAt(position))||hash(work(g,position))!==hash(work(baseline,position))||hash(g.cameraAt(position))!==hash(baseline.cameraAt(position))||hash(g.lightAt(position))!==hash(baseline.lightAt(position)))coreFailures.push(sample.timeline);
 }
 check('actor-work-camera-and-light-match-baseline-throughout',coreFailures.length===0,coreFailures.slice(0,8));
 const framePositions=[...Array.from({length:last+1},(_,i)=>staticPosition(i)),...Array.from({length:last},(_,i)=>inverse(i+.5))];
 for(const position of framePositions)if(hash(g.frame(position,2))!==hash(baseline.frame(position,2)))frameFailures.push(position);
 check('rendered-body-and-gravity-field-match-baseline',frameFailures.length===0,{samples:framePositions.length,failures:frameFailures.slice(0,8)});
 check('opening-the-work-layers-does-not-change-existing-content',[2.4,5.4,7.25,7.6,7.85].every(position=>hash(work(g,position,1))===hash(work(baseline,position,1))));
 }else for(const name of ['undissolved-background-matches-baseline-at-integer-beats','hero-remains-unchanged','actor-work-camera-and-light-match-baseline-throughout','rendered-body-and-gravity-field-match-baseline','opening-the-work-layers-does-not-change-existing-content'])skip(name);

 // Compare nearby visible paths, including births/deaths, across every transition.
 // Small finite-difference bounds catch cuts without prescribing the authored curve.
 let maxPointStep=0,maxAlphaStep=0;const cuts=[];
 for(let index=0;index<last;index++)for(let n=0;n<=20;n++){
  const timeline=index+n/20,epsilon=1e-5;
  const a=new Map(paths(ambient(inverse(Math.max(0,timeline-epsilon)))).map(item=>[item.id,item]));
  const b=new Map(paths(ambient(inverse(Math.min(last,timeline+epsilon)))).map(item=>[item.id,item]));
  for(const id of new Set([...a.keys(),...b.keys()])){
   const from=a.get(id),to=b.get(id),alpha=Math.abs((from?.effectiveAlpha||0)-(to?.effectiveAlpha||0));maxAlphaStep=Math.max(maxAlphaStep,alpha);
   if(alpha>.02)cuts.push({timeline,id,alpha});
   if(!from||!to||Math.max(from.effectiveAlpha,to.effectiveAlpha)<1e-5)continue;
   if(from.points.length!==to.points.length){cuts.push({timeline,id,reason:'visible-topology-change'});continue;}
   const step=Math.max(...from.points.map((q,i)=>distance(q,to.points[i])));maxPointStep=Math.max(maxPointStep,step);
   if(step>.02)cuts.push({timeline,id,step});
  }
 }
 check('dust-and-surroundings-have-no-sampled-transition-cuts',cuts.length===0,{maxPointStep,maxAlphaStep,failures:cuts.slice(0,8)});
 const failed=checks.filter(item=>item.pass===false),skipped=checks.filter(item=>item.skipped).map(item=>item.name);
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({release:g.config.release,source,sourceHash:hash(fs.readFileSync(source,'utf8')),baseline:baselinePath,baselineHash:baseline?hash(fs.readFileSync(baselinePath,'utf8')):null,samples:samples.length,checks},null,2));
 console.log(JSON.stringify({checks:checks.length,failed,skipped,samples:samples.length,maxParticles,maxMobileParticles,output:out},null,2));if(failed.length)process.exitCode=1;
}catch(error){fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,error:error.stack},null,2));console.error(error);process.exitCode=1;}
