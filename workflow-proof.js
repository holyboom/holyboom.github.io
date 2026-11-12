/* Living Workflow: fictional source-to-artifact examples, not a live AI service.
 * Explicit steps animate a finite transfer. Inspection never changes the user's brief.
 * Source X remains outside the answer path; final review never grants approval. */
(()=>{
 'use strict';
 const host=document.getElementById('intent-demonstration'),work=window.HolyMindWorkbench;
 if(!host||!work)return;
 const q=s=>host.querySelector(s),ns='http://www.w3.org/2000/svg';
 const examples={
  operations:{
   sources:[
    {id:'REQ-01',name:'Request',status:'Example input',quote:'Add a teammate to the Product workspace. Requested role: editor.',rule:'The workspace and requested role may be copied into a draft, not executed.'},
    {id:'POL-01',name:'Owner rule',status:'Example rule',quote:'A workspace owner must review and approve a role change before it is sent.',rule:'The proposed action stops at owner review.'},
    {id:'REQ-02',name:'Incomplete',status:'Held for a person',quote:'Requested role: not supplied.',rule:'A missing role is not guessed. This input cannot become an automatic action.'}
   ],artifact:'A draft, not a sent invitation',claims:['Workspace: Product · proposed role: editor.','An authorized workspace owner must review this draft.'],review:'Waiting for owner review',excluded:'REQ-02 stays on hold. Nothing is approved or sent.'},
  knowledge:{
   sources:[
    {id:'SRC-A',name:'Policy',status:'Approved example',quote:'Support requests belong in the service queue.',rule:'This example supports where a request should be routed.'},
    {id:'SRC-B',name:'Team note',status:'Approved example',quote:'Keep a source link and the responsible team attached to each request.',rule:'This example supports the source link and ownership requirements.'},
    {id:'SRC-X',name:'Restricted',status:'Access not granted',quote:'The document contents are not available to this demonstration.',rule:'No contents are retrieved, inferred or cited. There is no path from SRC-X into the answer.'}
   ],artifact:'An answer with a visible source',claims:['Route the request to the service queue.','Keep its source link and responsible team attached.'],review:'Ready for evidence review',excluded:'SRC-X is excluded. A missing fact stays unanswered.'},
  venture:{
   sources:[
    {id:'HYP-01',name:'Hypothesis',status:'Not yet tested',quote:'A simpler request form may reduce repeated clarification.',rule:'This is the assumption to test, not a measured result.'},
    {id:'LIM-01',name:'Boundary',status:'Example constraint',quote:'Use fictional requests in one prototype. Do not connect production systems.',rule:'The prototype remains a bounded illustration.'},
    {id:'CLAIM-X',name:'Unproven',status:'No supporting result',quote:'No participant test or business outcome has been recorded.',rule:'The prototype cannot be presented as successful evidence or a proven return on investment.'}
   ],artifact:'A test plan, not a success claim',claims:['Test whether one simplified form reduces clarification.','Use fictional inputs; keep production systems disconnected.'],review:'Decision awaits evidence',excluded:'CLAIM-X is not a result. No experiment has run here.'}
 };
 const evidence=q('#demo-evidence'),content=q('.demo-evidence-content');
 const sourceBar=document.createElement('div');sourceBar.className='proof-source-bar';sourceBar.setAttribute('role','group');sourceBar.setAttribute('aria-label','Inspect fictional example sources');
 for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.dataset.evidenceSource=String(i);b.setAttribute('aria-pressed','false');b.setAttribute('aria-controls','proof-inspector');sourceBar.append(b);}
 host.insertBefore(sourceBar,evidence);
 const inspector=document.createElement('div');inspector.id='proof-inspector';inspector.className='proof-inspector';
 inspector.innerHTML='<div class="proof-source-heading"><strong id="proof-source-name"></strong><span id="proof-source-status"></span></div><blockquote id="proof-excerpt"></blockquote><div id="proof-rule"></div><p class="proof-example-note">Fictional teaching examples, not client documents or retrieved facts.</p>';
 evidence.insertBefore(inspector,content);
 const artifact=document.createElement('div');artifact.className='proof-result';artifact.innerHTML='<h4 id="proof-artifact-title"></h4><button type="button" class="proof-claim" data-proof-claim="0"><span></span><small></small></button><button type="button" class="proof-claim" data-proof-claim="1"><span></span><small></small></button><div id="proof-exclusion"></div>';
 evidence.insertBefore(artifact,content);
 const status=document.createElement('span');status.className='sr-journey';status.id='proof-selection-status';status.setAttribute('role','status');host.append(status);
 const svg=q('svg.intent-diagram'),flight=document.createElementNS(ns,'g');flight.setAttribute('class','proof-flight');flight.setAttribute('aria-hidden','true');
 const packets=Array.from({length:3},(_,i)=>{const g=document.createElementNS(ns,'g');g.setAttribute('class','proof-packet'+(i===2?' is-held':''));const path=document.createElementNS(ns,'path');path.setAttribute('d','M0-4L4 0 0 4-4 0Z');g.append(path);flight.append(g);return g;});svg.append(flight);
 const lock=document.createElementNS(ns,'g');lock.setAttribute('class','proof-review-lock');lock.innerHTML='<path class="proof-review-stem"/><path class="proof-review-glyph" d="M0-8L8 0 0 8-8 0Z M-3-2H3V4H-3Z M-2-2V-5H2V-2"/>';svg.append(lock);
 let source=-1,scene='',step=0,tween=null,transitionCount=0,paintCount=0,lastStamp='',packetState=[],observerVisible=false,pendingVisual=false;
 const proxy={t:1},clamp=n=>Math.max(0,Math.min(1,n));
 let paths=[],review={x:0,y:0};
 function point(points,t){const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);let d=clamp(t)*total;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const f=lengths[i]?d/lengths[i]:0;return {x:points[i][0]+(points[i+1][0]-points[i][0])*f,y:points[i][1]+(points[i+1][1]-points[i][1])*f};}d-=lengths[i];}return {x:points[0][0],y:points[0][1]};}
 function layout(){
  const mobile=innerWidth<=680,gate=mobile?[174,96]:[290,106],end=mobile?[248,96]:[450,106];
  const a=mobile?[[94,56],[128,56],gate]:[[136,62],[220,62],gate],b=mobile?[[94,161],[128,161],gate]:[[136,147],[218,147],gate];
  const stop=mobile?[[184,204],[184,186],[158,186]]:[[244,153],[244,135],[224,135]];
  paths=[step<2?a:[...a,end],step<2?b:[...b,end],stop];review={x:mobile?286:492,y:mobile?220:218};
  q('.demo-hold-path').setAttribute('d',mobile?'M184 204V186H158':'M244 153V135H224');
  lock.setAttribute('transform',`translate(${review.x} ${review.y})`);lock.querySelector('.proof-review-stem').setAttribute('d',mobile?'M0-44V-11':'M0-35V-11');
 }
 function paint(){
  paintCount++;const t=proxy.t,phase=clamp(t);
  packetState=packets.map((el,i)=>{
   const u=clamp((phase-i*.10)/.72),pos=point(paths[i],u),show=step>0&&t<.995&&t>i*.10;
   const alpha=show?Math.max(0,Math.min(1,u*7,(1-u)*7)):0;
   el.setAttribute('transform',`translate(${pos.x.toFixed(3)} ${pos.y.toFixed(3)})`);el.style.opacity=String(alpha);
   return {...pos,index:i,visible:alpha>.001,alpha,held:i===2,entersOutput:i!==2&&step>=2};
  });
  lock.style.opacity=step===3?'1':'0';host.style.setProperty('--proof-assembly',String(step>=2?.45+.55*phase:.12));
 }
 function settle(){if(tween){tween.kill();tween=null;}proxy.t=1;paint();host.dataset.transitioning='false';}
 function run(animate){
  if(tween){tween.kill();tween=null;}layout();
  const shown=svg.getBoundingClientRect(),inView=shown.bottom>125&&shown.top+Math.min(70,shown.height*.15)<innerHeight;
  pendingVisual=!!(animate&&!inView&&!document.hidden);
  if(!animate||!inView||document.hidden||!window.gsap){proxy.t=1;paint();host.dataset.transitioning='false';return;}
  pendingVisual=false;proxy.t=0;transitionCount++;host.dataset.transitioning='true';paint();
  tween=gsap.to(proxy,{t:1,duration:.95,ease:'none',onUpdate:paint,onComplete:()=>{tween=null;host.dataset.transitioning='false';}});
 }
 function highlight(index){
  source=index;host.dataset.proofSource=String(index);
  host.querySelectorAll('[data-evidence-source]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  host.querySelectorAll('[data-doc]').forEach((e,i)=>e.dataset.proofActive=String(i===index));
  host.querySelectorAll('[data-proof-claim]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  const story=examples[scene],s=story.sources[index<0?0:index];
  q('#proof-source-name').textContent=s.id+' · '+s.name;q('#proof-source-status').textContent=s.status;q('#proof-excerpt').textContent=s.quote;q('#proof-rule').textContent=s.rule;
  inspector.dataset.excluded=String(index===2);host.dataset.proofExcluded=String(index===2);
 }
 function inspect(index){if(!Number.isInteger(index)||index<0||index>2)return;highlight(index);evidence.open=true;status.textContent=examples[scene].sources[index].id+': '+examples[scene].sources[index].rule;}
 function update(animate=true){
  const s=work.snapshot();if(!examples[s.challenge])return;
  const stamp=s.challenge+':'+s.step+':'+(innerWidth<=680?'mobile':'wide');if(stamp===lastStamp)return;
  const different=scene!==s.challenge;scene=s.challenge;step=s.step;lastStamp=stamp;host.dataset.proofReady='true';
  const story=examples[scene];
  sourceBar.querySelectorAll('button').forEach((b,i)=>{b.textContent=story.sources[i].id+(i===2?' · held':'');b.setAttribute('aria-label','Inspect '+story.sources[i].name+' — '+story.sources[i].status);});
  q('#proof-artifact-title').textContent=(step<2?'Preview: ':'')+story.artifact;
  host.querySelectorAll('[data-proof-claim]').forEach((b,i)=>{b.querySelector('span').textContent=story.claims[i];b.querySelector('small').textContent='Trace to '+story.sources[i].id;});
  q('#proof-exclusion').textContent=story.excluded;
  artifact.dataset.review=String(step===3);artifact.dataset.formed=String(step>=2);artifact.setAttribute('aria-label',step===3?story.review:'Illustrative output, not an executed result');
  highlight(different?-1:source);run(animate);
 }
 sourceBar.addEventListener('click',e=>{const b=e.target.closest('[data-evidence-source]');if(b)inspect(Number(b.dataset.evidenceSource));});
 artifact.addEventListener('click',e=>{const b=e.target.closest('[data-proof-claim]');if(b)inspect(Number(b.dataset.proofClaim));});
 document.addEventListener('holymind:step',()=>update(true));
 addEventListener('resize',()=>update(false),{passive:true});
 if('IntersectionObserver'in window)new IntersectionObserver(rows=>{observerVisible=rows.some(r=>r.isIntersecting);if(!observerVisible)settle();else if(pendingVisual)run(true);},{rootMargin:'0px',threshold:[0,.15,.4]}).observe(svg);
 const park=()=>{pendingVisual=false;settle();host.dataset.playing='false';};
 const resume=()=>{if(document.hidden)return;const r=svg.getBoundingClientRect();host.dataset.playing=String(r.bottom>75&&r.top<innerHeight);settle();};
 addEventListener('pagehide',park);addEventListener('pageshow',resume);document.addEventListener('visibilitychange',()=>document.hidden?park():resume());
 document.addEventListener('holymind:intent',()=>{if(!HolyMindJourney.snapshot().active){source=-1;highlight(-1);}});
 window.HolyMindWorkflowProof=Object.freeze({snapshot:()=>({scene,step,source,transitionCount,paintCount,animating:!!tween,packetState:packetState.map(p=>({...p})),sampleIds:examples[scene].sources.map(s=>s.id),excludedId:examples[scene].sources[2].id,outputSources:examples[scene].sources.slice(0,2).map(s=>s.id),illustrative:true,externalRequests:0,approvalGranted:false,observerVisible,pendingVisual})});
 update(false);
})();
