/* Intent Journey v24. Explicit choices, never scrolling, own this tab-local brief.
 * Illustrative, deterministic demonstration. No model, account, tracking or submission. */
(()=>{
 'use strict';
 const work=window.HolyMindWorkbench,host=document.getElementById('intent-demonstration');if(!work||!host)return;
 const q=s=>document.querySelector(s),key='holymind-intent-v24';
 const stories={
  operations:{label:'Repetitive work',icon:'workflow-executor',heading:'Give your team<br>their time back.',intro:'Start with one repeatable request, a permission boundary, and a person who owns the decision.',
   stages:[['REQUESTS','Requests arrive separately.','One approved input, with its owner attached.'],['VALIDATE','One route needs a person.','Missing fields stay outside the automatic path.'],['DRAFT','A draft takes shape.','A proposed action is not a sent action.'],['OWNER REVIEW','Ready for a human decision.','Nothing is approved or sent by this demonstration.']],
   sources:['Request','Owner','Missing field'],outputs:['INTENT','CHECKED','DRAFT','REVIEW'],
   evidence:['Illustrative request: an approved form with a source and an owner.','Validation rule: incomplete input is held for a person, not silently inferred.','The artifact is a draft. External actions require an authorized human.']},
  knowledge:{label:'Scattered knowledge',icon:'source-grounded-synthesis',heading:'Make knowledge<br>worth trusting.',intro:'Begin with one question, approved sources, and an answer whose evidence can be inspected.',
   stages:[['SCOPE','Not every document belongs inside.','Permission comes before retrieval.'],['RETRIEVE','Relevant passages connect.','An unsupported source stays on the boundary.'],['SOURCE','An answer keeps its references.','Follow the source trail rather than trusting a glow.'],['EVALUATE','Support is checked, not assumed.','Insufficient evidence remains an open question.']],
   sources:['Source A','Source B','Restricted'],outputs:['QUESTION','PASSAGES','ANSWER','REVIEW'],
   evidence:['Source A: a sample approved policy excerpt, not a real client document.','Source B: a sample approved operating note; no retrieval service runs here.','Restricted material is excluded. A missing fact is not filled in as verified.']},
  venture:{label:'A new venture',icon:'seed-expansion-via-search',heading:'Test the<br>hardest assumption.',intro:'Carry one clear hypothesis into a small experiment, then decide from evidence rather than momentum.',
   stages:[['FRAME','Choose one assumption.','The other ideas stay available, not bundled into the first build.'],['PROTOTYPE','A bounded experiment forms.','This is a simulated artifact, not a production launch.'],['OBSERVE','Observe the actual task.','Collect questions and observations before claiming impact.'],['DECIDE','A decision is still yours.','Improve, pause, or expand only after reviewing the evidence.']],
   sources:['Hypothesis','Constraint','Unproven'],outputs:['QUESTION','PROTOTYPE','NOTES','DECIDE'],
   evidence:['Hypothesis: an illustrative assumption that needs user research.','Constraint: approved data and a narrow integration boundary.','No trial, customer result, conversion uplift or return on investment is claimed.']}
 };
 let selected={version:1,challenge:null,skill:null,step:0},pendingSkill=null,updates=0,carrier=null,carrierIcon=null,lastCarrier='',lastDemo='';
 try{const s=JSON.parse(sessionStorage.getItem(key)||'null');if(s?.version===1){selected.challenge=Object.hasOwn(stories,s.challenge)?s.challenge:null;selected.step=Number.isInteger(s.step)&&s.step>=0&&s.step<4?s.step:0;if(typeof s.skill==='string'&&/^[a-z0-9-]{1,70}$/.test(s.skill))pendingSkill=s.skill;}}catch(_){}
 const receipt=q('#journey-receipt'),thread=q('#journey-thread'),heading=q('#connect-heading'),intro=q('#connect-heading')?.nextElementSibling,portalIcon=q('.portal-depth>img'),portalLabel=q('.portal-caption');
 const defaults={heading:heading?.innerHTML,intro:intro?.innerHTML,icon:portalIcon?.getAttribute('src'),label:portalLabel?.textContent};
 const catalog=()=>window.HolyMindSkills?.list()||[];
 const skill=()=>catalog().find(x=>x.id===selected.skill)||null;
 const hasChoice=()=>!!(selected.challenge||selected.skill);
 const save=()=>{if(pendingSkill)return;try{if(hasChoice())sessionStorage.setItem(key,JSON.stringify(selected));else sessionStorage.removeItem(key);}catch(_){}};
 let refreshFrame=0,layoutStamp='',layoutRefreshes=0;
 // Batch actual layout changes; repeating a choice must not rebuild scroll geometry.
 function refresh(){if(refreshFrame)return;refreshFrame=requestAnimationFrame(()=>{
  refreshFrame=0;const nodes=[q('#strategy-panel'),q('#framework'),q('#about'),q('#connect'),q('.contact-portal'),receipt];
  const top=el=>{let n=0;for(let x=el;x;x=x.offsetParent)n+=x.offsetTop;return n;};
  const stamp=nodes.map(el=>el?[top(el),el.offsetWidth,el.offsetHeight].join(':'):'-').join('|');
  if(stamp===layoutStamp)return;layoutStamp=stamp;layoutRefreshes++;window.ScrollTrigger?.refresh();
 });}
 host.hidden=false;
 host.innerHTML=`<div class="demo-topline"><span id="demo-phase">REQUESTS</span><span>Illustrative · no AI request</span></div>
 <svg viewBox="0 0 600 235" class="intent-diagram" aria-hidden="true" focusable="false">
 <defs><linearGradient id="intent-stroke" x1="0" x2="1"><stop stop-color="#b475ff"/><stop offset="1" stop-color="#67e8f9"/></linearGradient></defs>
 <path class="demo-rail" d="M42 194H546M80 190v8M290 190v8M500 190v8"/>
 <g class="demo-route-lines"><path class="demo-path" d="M136 62H220L265 106H325L380 106H443"/><path class="demo-path secondary" d="M136 147H218L265 106"/><path class="demo-hold-path" d="M154 108H206V170H252"/>
 <path class="demo-current" pathLength="100" d="M136 62H220L265 106H325L380 106H443"/></g>
 <g class="demo-document" data-doc="0"><path d="M0 0H66L82 16V52H0Z"/><path class="demo-paper-lines" d="M12 16h36M12 25h52M12 34h43"/><text x="0" y="70" data-source-label="0"></text></g>
 <g class="demo-document" data-doc="1"><path d="M0 0H66L82 16V52H0Z"/><path class="demo-paper-lines" d="M12 16h36M12 25h52M12 34h43"/><text x="0" y="70" data-source-label="1"></text></g>
 <g class="demo-document demo-held" data-doc="2"><path d="M0 0H54L68 14V42H0Z"/><path class="demo-paper-lines" d="M12 14h34M12 24h24"/><text x="0" y="59" data-source-label="2"></text></g>
 <g class="demo-gate" transform="translate(290 106)"><path d="M0-34L34 0 0 34-34 0Z"/><path d="M-12 0h24M0-12v24"/><circle r="46"/></g>
 <g class="demo-artifact" transform="translate(492 106)"><path class="artifact-shell" d="M-38-44H22L40-26V44H-38Z"/><path class="artifact-inner" d="M-29-32H16L29-19V32H-29Z"/><image id="demo-artifact-icon" href="assets/skills/workflow-blueprint.webp" x="-27" y="-28" width="54" height="54"/><text id="demo-output" x="0" y="69" text-anchor="middle"></text></g>
 </svg>
 <div class="demo-caption"><p id="demo-meaning"></p><span id="demo-boundary"></span></div>
 <details id="demo-evidence"><summary>Inspect the source trail<span aria-hidden="true">↗</span></summary><div class="demo-evidence-content"></div></details>`;
 const positions=[[[22,12,-9],[58,100,7],[166,90,-5]],[[54,33,0],[54,120,0],[210,153,0]],[[56,35,0],[56,120,0],[210,153,0]],[[56,35,0],[56,120,0],[210,153,0]]];
 function renderDemo(){
  const s=work.snapshot(),story=stories[s.challenge],stage=story.stages[s.step];
  const stamp=s.challenge+':'+s.step+':'+(innerWidth<=680);if(stamp===lastDemo)return;lastDemo=stamp;
  host.dataset.demoChallenge=s.challenge;host.dataset.stage=String(s.step);
  q('#demo-phase').textContent=stage[0];q('#demo-meaning').textContent=stage[1];q('#demo-boundary').textContent=stage[2];q('#demo-output').textContent=story.outputs[s.step];
  q('#demo-artifact-icon').setAttribute('href','assets/skills/'+s.skills[s.step][0]+'.webp');
  const mobile=innerWidth<=680,coords=mobile?(s.step===0?[[10,12,-7],[24,130,6],[150,201,-5]]:[[12,30,0],[12,135,0],[150,204,0]]):positions[s.step];
  const svg=host.querySelector('svg');svg.setAttribute('viewBox',mobile?'0 0 340 283':'0 0 600 235');
  host.querySelector('.demo-gate').setAttribute('transform',mobile?'translate(174 96)':'translate(290 106)');
  host.querySelector('.demo-artifact').setAttribute('transform',mobile?'translate(286 96)':'translate(492 106)');
  const route=mobile?'M94 56H128L174 96H248':'M136 62H220L265 106H325L380 106H443';
  host.querySelector('.demo-path').setAttribute('d',route);host.querySelector('.demo-current').setAttribute('d',route);
  host.querySelector('.demo-path.secondary').setAttribute('d',mobile?'M94 161H128L174 96':'M136 147H218L265 106');
  host.querySelector('.demo-hold-path').setAttribute('d',mobile?'M94 161H114V223H150':'M154 108H206V170H252');
  host.querySelector('.demo-rail').setAttribute('d',mobile?'M14 278H326':'M42 194H546M80 190v8M290 190v8M500 190v8');
  host.querySelectorAll('[data-doc]').forEach((el,i)=>{const [x,y,r]=coords[i];el.style.transform=`translate(${x}px,${y}px) rotate(${r}deg)`;});
  host.querySelectorAll('[data-source-label]').forEach((el,i)=>el.textContent=story.sources[i]);
  const evidence=q('.demo-evidence-content');evidence.replaceChildren();story.evidence.forEach((text,i)=>{const p=document.createElement('p');const b=document.createElement('strong');b.textContent=story.sources[i]+'. ';p.append(b,document.createTextNode(text));evidence.append(p);});
 }
 receipt.innerHTML=`<div class="receipt-heading"><img id="receipt-icon" src="assets/skills/the-crystallizer.webp" width="42" height="42" alt=""><div><p>Your next step</p><h3 id="receipt-title"></h3></div></div><p id="receipt-interest"></p><p id="receipt-context" class="receipt-context"></p><div class="receipt-edit"><a id="return-to-question" href="#strategy-panel">Return to this question</a><button type="button" id="remove-carried-skill" hidden>Remove this skill</button></div><div class="receipt-actions"><button id="copy-journey" type="button">Copy this starting brief</button><button id="reset-journey" type="button">Clear choices</button></div><details id="journey-brief"><summary>Review the brief</summary><label class="sr-journey" for="journey-brief-text">Your illustrative starting brief</label><textarea id="journey-brief-text" readonly rows="7"></textarea></details><p id="journey-copy-status" class="journey-status" role="status">Nothing is sent. Choices stay in this tab.</p>`;
 const caption=q('.instrument-caption'),carryFeatured=document.createElement('button');carryFeatured.type='button';carryFeatured.id='carry-featured';carryFeatured.className='text-button carry-featured';carryFeatured.textContent='Carry this skill into my brief';caption?.append(carryFeatured);
 function related(){
  const ids=selected.challenge?work.snapshot().skills.map(x=>x[0]):[];
  document.querySelectorAll('.skill-card').forEach(el=>{
   const fits=ids.includes(el.dataset.skill),chosen=el.dataset.skill===selected.skill;
   el.dataset.journeyRelated=String(fits);el.dataset.journeySelected=String(chosen);
   let note=el.querySelector('.journey-fit');if(!note){note=document.createElement('span');note.className='journey-fit';el.append(note);}
   note.hidden=!fits&&!chosen;note.textContent=chosen?'Carried in your brief':fits?'Related to your question':'';
  });
 }
 function brief(){
  const info=skill();
  if(!selected.challenge)return ['HolyMind — starting conversation','Goal: to be clarified with Boom.',info?'Interested skill: '+info.name+'.':'No skill selected.','Next step: agree the problem, approved sources, permissions and evidence for success.','This is an illustrative brief, not an AI result or implementation commitment.','No information is sent by this page.'].join('\n');
  return work.brief();
 }
 function update(){
  updates++;const story=stories[selected.challenge],info=skill(),active=hasChoice(),icon=info?.id||story?.icon||'the-crystallizer';
  receipt.hidden=!active;thread.hidden=!active;
  if(active){
   heading.innerHTML=story?.heading||'Start with<br>a better question.';intro.textContent=story?.intro||'Bring the skill that caught your attention. We can find the question it should serve.';
   q('#receipt-icon').src='assets/skills/'+icon+'.webp';q('#receipt-title').textContent=story?.label||info?.name||'Your next question';
   q('#receipt-context').textContent=story?'Explored: '+work.snapshot().stages[selected.step][0]+' · '+(selected.step+1)+' / 4. Illustration, not an executed result.':'Your question is still open. No workflow has been chosen.';
   q('#return-to-question').textContent=story?'Return to this question':'Choose a question';
   q('#remove-carried-skill').hidden=!info;
   q('#receipt-interest').textContent=info?'Interested skill: '+info.name+'.': 'Choose a skill as you explore, or begin with this question.';
   portalIcon.src='assets/skills/'+icon+'.webp';portalLabel.textContent='YOUR INTENT, READY TO DISCUSS';
   thread.textContent='Carrying: '+(story?.label||'An open question')+(info?' · '+info.name:'')+'. Kept in this tab.';
   q('#journey-brief-text').value=brief();
  }else{heading.innerHTML=defaults.heading;intro.innerHTML=defaults.intro;portalIcon.setAttribute('src',defaults.icon);portalLabel.textContent=defaults.label;}
  q('#project-brief').value=work.brief();related();lastCarrier='';save();
  q('#carry-skill').setAttribute('aria-pressed',String(q('#skill-dialog').dataset.skill===selected.skill));
  q('#journey-copy-status').textContent='Nothing is sent. Choices stay in this tab.';
  document.body.dataset.intentJourney=active?'chosen':'exploring';
  document.dispatchEvent(new CustomEvent('holymind:intent',{detail:{...selected}}));refresh();
 }
 function chooseSkill(id){
  const found=catalog().find(s=>s.id===id);if(!found)return false;
  if(selected.skill===id)return true;
  selected.skill=id;update();q('#carry-skill-status').textContent=found.name+' is carried in your brief.';return true;
 }
 function onChoice(e){
  if(!e.isTrusted)return;
  if(e.type==='keydown'&&!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  if(e.target.closest('[data-challenge],[data-step]')){const s=work.snapshot();if(selected.challenge===s.challenge&&selected.step===s.step)return;selected.challenge=s.challenge;selected.step=s.step;update();}
 }
 document.addEventListener('click',onChoice);document.addEventListener('keydown',onChoice);
 document.addEventListener('holymind:step',renderDemo);
 let diagramWidth=innerWidth;addEventListener('resize',()=>{if(diagramWidth!==innerWidth){diagramWidth=innerWidth;renderDemo();}},{passive:true});
 document.addEventListener('holymind:skills-rendered',related);
 document.addEventListener('holymind:skills-ready',()=>{if(pendingSkill){if(catalog().some(s=>s.id===pendingSkill))selected.skill=pendingSkill;pendingSkill=null;update();}});
 q('#carry-skill').addEventListener('click',()=>chooseSkill(q('#skill-dialog').dataset.skill));
 carryFeatured.addEventListener('click',()=>{if(chooseSkill(q('.deck-shard[aria-pressed=true]')?.dataset.skill)){carryFeatured.textContent='Carried into your brief';setTimeout(()=>carryFeatured.textContent='Carry this skill into my brief',2000);}});
 q('#copy-journey').addEventListener('click',async()=>{
  const text=brief(),area=q('#journey-brief-text'),status=q('#journey-copy-status');area.value=text;
  try{if(!navigator.clipboard||!isSecureContext)throw Error('unavailable');await navigator.clipboard.writeText(text);status.textContent='Brief copied. Paste it into a conversation with Boom.';}
  catch(_){q('#journey-brief').open=true;area.focus();area.select();status.textContent='Select and copy the brief here. Nothing has been sent.';refresh();}
 });
 q('#remove-carried-skill').addEventListener('click',()=>{if(!selected.skill)return;selected.skill=null;pendingSkill=null;update();q('#return-to-question').focus({preventScroll:true});});
 q('#return-to-question').addEventListener('click',e=>{e.preventDefault();window.HolyMindScrollSound?.suppressForNavigation();const el=q('[data-challenge][aria-selected=true]');if(el){el.focus({preventScroll:true});el.scrollIntoView({behavior:'smooth',block:'center'});}});
 q('#reset-journey').addEventListener('click',()=>{selected={version:1,challenge:null,skill:null,step:0};pendingSkill=null;work.selectChallenge('operations');q('#connect .button-primary')?.focus({preventScroll:true});update();});
 q('#demo-evidence').addEventListener('toggle',refresh);q('#journey-brief').addEventListener('toggle',refresh);
 if('IntersectionObserver'in window)new IntersectionObserver(rows=>rows.forEach(r=>host.dataset.playing=String(r.isIntersecting&&!document.hidden)),{rootMargin:'50px'}).observe(host);
 document.addEventListener('visibilitychange',()=>{host.dataset.playing=String(!document.hidden&&host.getBoundingClientRect().bottom>0&&host.getBoundingClientRect().top<innerHeight);});
 function invitation(){const a=window.HolyMindAudio?.snapshot();const el=q('#sound-invitation');if(!el||!a)return;
  el.textContent=!a.enabled?'Sound is muted. The journey keeps moving.':a.needsGesture?'Tap the brain to resume sound.':a.unlocked?'Sound is awake. Scroll to carry the thought.':'Tap the brain. Let your idea travel.';document.body.dataset.soundInvitation=a.unlocked&&!a.needsGesture?'awake':'waiting';
 }
 document.addEventListener('holymind:audio-state',invitation);
 document.addEventListener('input',e=>{if(e.target.id==='assembly-control')q('.assembly-instruction span').textContent=Number(e.target.value)>=100?'Drag left to reconnect, or scroll onward.':'Keep dragging to reveal the next connection.';});
 const scrollHint=()=>{const s=q('.assembly-instruction span'),text=Number(q('#assembly-control')?.value)>=100?'Scroll onward, or scroll up to reconnect.':'Keep scrolling to reveal the next connection.';if(s&&s.textContent!==text)s.textContent=text;};
 addEventListener('wheel',scrollHint,{passive:true});addEventListener('touchmove',scrollHint,{passive:true});
 const carrierScenes=new Set(['system','skills','gallery','services','delivery','signature','portal']);
 function renderCarrier(state){
  if(!carrier){const parent=q('.continuity-carrier');if(!parent)return;const ns='http://www.w3.org/2000/svg';carrier=document.createElementNS(ns,'g');carrier.setAttribute('class','continuity-intent-mark');carrier.setAttribute('pointer-events','none');carrierIcon=document.createElementNS(ns,'image');carrierIcon.setAttribute('x','-9');carrierIcon.setAttribute('y','-9');carrierIcon.setAttribute('width','18');carrierIcon.setAttribute('height','18');carrier.append(carrierIcon);parent.append(carrier);}
  const active=hasChoice()&&carrierScenes.has(state.from)&&!(state.from==='signature'&&state.to==='signature')&&!(state.to==='signature'&&state.progress>.80)&&!(state.from==='signature'&&state.progress<.04);
  const id=selected.skill||stories[selected.challenge]?.icon||'',stamp=active+':'+id;
  if(stamp===lastCarrier)return;lastCarrier=stamp;carrier.setAttribute('opacity',active?'0.85':'0');if(active)carrierIcon.setAttribute('href','assets/skills/'+id+'.webp');
 }
 window.HolyMindJourney=Object.freeze({version:'living-flow-v25',renderCarrier,enrichBrief(text){const info=skill();return info?text+'\nInterested HolyMind skill: '+info.name+'.\nThis preference is exploratory, not a validated system recommendation.':text;},snapshot:()=>({...selected,active:hasChoice(),updates,storage:'sessionStorage',transmitsData:false,layoutRefreshes,brief:brief()})});
 if(selected.challenge){work.selectChallenge(selected.challenge);work.selectStep(selected.step);}
 if(pendingSkill&&catalog().length){if(catalog().some(s=>s.id===pendingSkill))selected.skill=pendingSkill;pendingSkill=null;}
 renderDemo();update();invitation();
})();
