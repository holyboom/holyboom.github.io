/* Scroll Sonata v17. One gesture-unlocked AudioContext, separate sound buses.
 * Electric v12 tap PCM is unchanged. Muting sound never changes visual motion.
 * A suspended/interrupted page requires a new explicit gesture: scroll cannot wake it.
 */
(()=>{
 'use strict';
 const timbres=window.HolyMindTimbres;if(!timbres)return;
 let context=null,master=null,compressor=null,analyser=null,landscape=null;
 let enabled=true,volume=.48,ambience=true,flow=true,unlocked=false,needsGesture=false,disposed=false;
 let played=0,dropped=0,lastStyle=null,token=0,pending=0,peakVoices=0,maxRms=0,lastSynthesisMs=0,lastScheduleMs=0,meterTimer=0;
 let music=null,musicLoading=false,musicResume=0;
 let latest={scope:1,activity:0,progress:0,direction:1,morph:0},contextCount=0;
 const cache=new Map(),pcm=new Map(),voices=new Set(),history=[];
 let cues=true,cueVoice=null,cueMeter=null,cuePlayed=0,cueDropped=0,cueMaxRms=0,cuePeakVoices=0,lastCueAt=-1e6,lastCueKey='',lastCuePriority=0,lastBrainAt=-1e6,feedbackUnlock=null;
 const cueCache=new Map(),cueMeta=new Map(),retiringCues=new Set();let pendingPianoKey=null;
 const button=document.getElementById('sound-toggle'),control=document.getElementById('sound-volume');
 const bedControl=document.getElementById('sound-ambience'),flowControl=document.getElementById('sound-flow'),cueControl=document.getElementById('sound-cues');
 const fieldEnabled=!!document.getElementById('system-assembly');
 try{enabled=localStorage.getItem('holymind-sound')!=='muted';const raw=localStorage.getItem('holymind-volume'),v=Number(raw);if(raw!==null&&v>=0&&v<=1)volume=v;
  cues=localStorage.getItem('holymind-cues')!=='off';ambience=localStorage.getItem('holymind-ambience')!=='off';flow=localStorage.getItem('holymind-flow')!=='off';}catch(_){}
 const ready=()=>enabled&&unlocked&&!needsGesture&&!disposed&&!document.hidden&&context?.state==='running';
 function ui(){
  const waiting=enabled&&(!unlocked||needsGesture),label=waiting?(needsGesture?'Resume sound':'Start sound'):enabled?'Sound on':'Muted';
  if(button){button.setAttribute('aria-pressed',String(enabled&&unlocked&&!needsGesture));button.setAttribute('aria-label',waiting?label:enabled?'Mute HolyMind sound':'Enable HolyMind sound');button.dataset.sound=enabled?'on':'off';const l=button.querySelector('.sound-label');if(l)l.textContent=label;button.title=waiting?'Tap to begin the quiet soundscape':'Mute sound without stopping motion';}
  if(control)control.value=String(Math.round(volume*100));if(bedControl)bedControl.checked=ambience;if(flowControl)flowControl.checked=flow;if(cueControl)cueControl.checked=cues;
  document.body.dataset.sound=enabled?(needsGesture?'needs-gesture':unlocked?'enabled':'armed'):'muted';
  document.dispatchEvent(new CustomEvent('holymind:audio-state',{detail:{enabled,unlocked,needsGesture,ambience,flow,cues}}));
 }
 function stop(){if(music){musicResume=music.snapshot().cursor;music.dispose();music=null;}stopCue(.04);for(const v of retiringCues){try{v.source.stop();v.source.disconnect();v.gain.disconnect();}catch(_){}}retiringCues.clear();pendingPianoKey=null;feedbackUnlock=null;token++;pending=0;for(const v of voices){try{v.source.stop();}catch(_){}try{v.source.disconnect();v.gain.disconnect();}catch(_){}}voices.clear();if(meterTimer)clearTimeout(meterTimer);meterTimer=0;}
 function field(){
  if(!ready()||!fieldEnabled||!window.HolyMindSoundscape)return;
  if(!landscape){try{landscape=HolyMindSoundscape.create(context,master);}catch(_){document.body.dataset.soundscape='unavailable';return;}}
  landscape.update({...latest,enabled,ambience,flow});document.body.dataset.soundscape='ready';
  if(!music&&window.HolyMindScrollScore){
   if(window.HolyMindCueTimbres?.snapshot().ready)music=HolyMindScrollScore.create(context,master,{startBeat:musicResume});
   else if(!musicLoading){musicLoading=true;window.HolyMindCueTimbres?.prepare().then(ok=>{musicLoading=false;if(ok&&ready())field();});}
  }
  music?.update({...latest,enabled:enabled&&cues});
 }
 function make(){
  if(context)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC){document.body.dataset.sound='unsupported';return false;}
  try{
   context=new AC({latencyHint:'interactive'});contextCount++;
   master=context.createGain();master.gain.value=enabled?volume:0;
   compressor=context.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=14;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.14;
   analyser=context.createAnalyser();analyser.fftSize=512;master.connect(compressor);compressor.connect(analyser);analyser.connect(context.destination);
   cueMeter=context.createAnalyser();cueMeter.fftSize=512;cueMeter.connect(master);
   context.addEventListener('statechange',()=>{if(context.state!=='running'&&unlocked){needsGesture=true;landscape?.silence();stop();ui();}});
   return true;
  }catch(_){document.body.dataset.sound='unsupported';return false;}
 }
 function buffer(id){
  if(cache.has(id))return cache.get(id);const start=performance.now(),d=pcm.get(id)||timbres.render(id);pcm.set(id,d);
  const b=context.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);cache.set(id,b);lastSynthesisMs=performance.now()-start;return b;
 }
 function meter(){
  if(!analyser||(!voices.size&&!cueVoice)){meterTimer=0;return;}const d=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(d);let sum=0;for(const x of d)sum+=x*x;maxRms=Math.max(maxRms,Math.sqrt(sum/d.length));if(cueVoice)cueMaxRms=Math.max(cueMaxRms,readCueRms());meterTimer=setTimeout(meter,55);
 }
 function play(id,{gain=1,gesture=false,variation=true,kind='brain'}={}){
  if(!enabled||document.hidden||disposed||!timbres.presets.some(p=>p.id===id))return false;
  if((!unlocked||needsGesture)&&!gesture)return false;if(!make())return false;
  if(gesture){if(!unlocked||needsGesture){latest={...latest,activity:0,intent:false};window.HolyMindScrollSound?.clearGesture?.();}unlocked=true;needsGesture=false;}
  if(pending>=3){dropped++;return false;}
  const generation=token,requestAt=performance.now();pending++;
  // Called in the trusted click handler before an await; required on mobile browsers.
  const resume=context.state==='running'?Promise.resolve():context.resume();
  Promise.resolve(resume).then(()=>{
   pending=Math.max(0,pending-1);if(generation!==token||!enabled||document.hidden||disposed||context.state!=='running')return;
   needsGesture=false;ui();field();
   if(performance.now()-requestAt>600){dropped++;return;}
   if(voices.size>=3){const oldest=voices.values().next().value;try{oldest.source.stop();}catch(_){}voices.delete(oldest);}
   const source=context.createBufferSource(),g=context.createGain();source.buffer=buffer(id);source.playbackRate.value=variation?.985+Math.random()*.03:1;
   const now=context.currentTime;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(Math.max(0,Math.min(1,gain))/Math.sqrt(1+voices.size*.65),now+.004);g.gain.setTargetAtTime(0,now+source.buffer.duration*.83,.035);
   source.connect(g);g.connect(master);const voice={source,gain:g};voices.add(voice);peakVoices=Math.max(peakVoices,voices.size);
   source.onended=()=>{voices.delete(voice);source.disconnect();g.disconnect();};source.start(now+.002);
   stopCue(.8);music?.duck();lastBrainAt=performance.now();landscape?.duck(now);played++;lastStyle=id;lastScheduleMs=performance.now()-requestAt;
   history.push({id,kind,time:performance.now(),rate:source.playbackRate.value});if(history.length>80)history.shift();if(!meterTimer)meter();
  }).catch(()=>{pending=Math.max(0,pending-1);dropped++;needsGesture=true;ui();});return true;
 }
 function mute(value){
  enabled=!value;stop();if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.012);
  if(!enabled){landscape?.dispose();landscape=null;}else field();
  try{localStorage.setItem('holymind-sound',enabled?'enabled':'muted');}catch(_){}ui();
 }
 function setVolume(n){volume=Math.max(0,Math.min(1,Number(n)||0));if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.02);try{localStorage.setItem('holymind-volume',String(volume));}catch(_){}ui();}
 function setLayer(name,on,persist=true){
  if(name==='ambience')ambience=!!on;else if(name==='flow')flow=!!on;else if(name==='cues'){cues=!!on;if(!cues){stopCue(.35);music?.stopTransport('mute');}}else return;
  if(persist)try{localStorage.setItem('holymind-'+name,on?'on':'off');}catch(_){}field();ui();
 }
 button?.addEventListener('click',e=>{
  if(!e.isTrusted)return;
  if(!enabled){mute(false);play('insight-pulse',{gesture:true,gain:.45,kind:'enable'});}
  else if(!unlocked||needsGesture)play('insight-pulse',{gesture:true,gain:.45,kind:'enable'});
  else mute(true);
 });
 control?.addEventListener('input',()=>setVolume(Number(control.value)/100));
 bedControl?.addEventListener('change',()=>setLayer('ambience',bedControl.checked));flowControl?.addEventListener('change',()=>setLayer('flow',flowControl.checked));cueControl?.addEventListener('change',()=>setLayer('cues',cueControl.checked));
 document.addEventListener('holymind:brain-burst',e=>{const d=e.detail||{};play(d.styleId||'neural-discharge',{gesture:d.userGesture===true});});
 // Only an actual relevant input may unlock the feedback instrument. Scroll cannot.
 function beginFeedback(gesture=false){
  if(!gesture||!enabled||!cues||document.hidden||disposed)return false;
  window.HolyMindCueTimbres?.prepare?.();if(ready())return true;if(!make())return false;
  const generation=token;latest={...latest,activity:0,intent:false};window.HolyMindScrollSound?.clearGesture?.();unlocked=true;needsGesture=false;
  const resumed=context.state==='running'?Promise.resolve():context.resume();
  feedbackUnlock=Promise.resolve(resumed).then(()=>{if(generation!==token||!enabled||disposed||document.hidden||context.state!=='running')return false;needsGesture=false;ui();field();return true;}).catch(()=>{needsGesture=true;ui();return false;});
  return true;
 }
 function readCueRms(){if(!cueMeter)return 0;const d=new Float32Array(512);cueMeter.getFloatTimeDomainData(d);let sum=0;for(const n of d)sum+=n*n;return Math.sqrt(sum/d.length);}
 function stopCue(release=1.25){
  if(!cueVoice)return;const v=cueVoice;cueVoice=null;retiringCues.add(v);
  const now=context.currentTime,p=v.gain.gain;
  try{if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(now);else{const n=p.value;p.cancelScheduledValues(now);p.setValueAtTime(n,now);}p.setTargetAtTime(.000001,now,release/5);v.source.stop(now+release+.04);}catch(_){}
 }
 function cue(id,{variant=0,priority=2,key=id,kind='action',direction=1,scene=null}={}){
  const registry=window.HolyMindCueTimbres;if(!registry||!registry.presets.some(p=>p.id===id)||!enabled||!cues||document.hidden||disposed)return false;
  if(!ready()){
   if(feedbackUnlock&&!needsGesture){const generation=token,at=performance.now();feedbackUnlock.then(ok=>{if(ok&&generation===token&&performance.now()-at<350)cue(id,{variant,priority,key,kind,direction,scene});});}
   return false;
  }
  if(!registry.snapshot().ready){
   const request=key,at=performance.now(),generation=token;pendingPianoKey=request;
   registry.prepare().then(ok=>{if(ok&&pendingPianoKey===request&&token===generation&&performance.now()-at<300){pendingPianoKey=null;cue(id,{variant,priority,key,kind,direction,scene});}});
   return false;
  }
  const wall=performance.now();
  if(wall-lastBrainAt<230||(key===lastCueKey&&wall-lastCueAt<750)||wall-lastCueAt<(priority>lastCuePriority?70:priority>=3?145:280)){cueDropped++;return false;}
  if(music?.snapshot().running){
   const accepted=music.accent(kind,variant);if(!accepted){cueDropped++;return false;}
   cuePlayed++;lastCueAt=wall;lastCueKey=key;lastCuePriority=priority;
   history.push({id,kind:'cue',eventKind:kind,key,variant,direction,scene:scene||latest.scene||'hero',notes:music.harmony(),source:'score-aligned accent',time:wall});if(history.length>120)history.shift();return true;
  }
  const harmony=music?.harmony()||window.HolyMindMozartScore?.chords?.[0]||[60,64,67];
  const v=Math.max(0,Math.min(5,Math.round(variant))),chosenScene=registry.resolveScene(key,kind,scene||latest.scene||'hero'),cacheKey=id+':'+v+':'+chosenScene+':'+harmony.join('-');
  let b=cueCache.get(cacheKey);if(!b){const d=registry.render(id,v,32000,{scene:chosenScene,key,kind,harmony});cueMeta.set(cacheKey,{scene:d.scene,notes:d.notes,texture:d.texture});b=context.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);cueCache.set(cacheKey,b);if(cueCache.size>48){const first=cueCache.keys().next().value;cueCache.delete(first);cueMeta.delete(first);}}
  if(cueVoice){retiringCues.add(cueVoice);cueVoice=null;}
  if(retiringCues.size>=6){cueDropped++;return false;}
  const source=context.createBufferSource(),g=context.createGain(),now=context.currentTime;source.buffer=b;
  const level=kind==='arrival'?.72:kind==='layer'?.66:kind==='phase'?.67:.70;
  g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(level,now+.004);g.gain.setTargetAtTime(.000001,now+Math.max(.2,b.duration-1.20),.26);source.connect(g);g.connect(cueMeter);
  const voice={source,gain:g};cueVoice=voice;cuePeakVoices=Math.max(cuePeakVoices,1+retiringCues.size);
  source.onended=()=>{if(cueVoice===voice)cueVoice=null;retiringCues.delete(voice);source.disconnect();g.disconnect();};source.start(now+.002);
  cuePlayed++;lastCueAt=wall;lastCueKey=key;lastCuePriority=priority;landscape?.duck(now,.38);
  history.push({id,kind:'cue',eventKind:kind,key,variant:v,direction,...cueMeta.get(cacheKey),time:wall});if(history.length>120)history.shift();if(!meterTimer)meter();
  return true;
 }
 // No 25/50/75 tap-preset milestones: continuous layer opening owns that story.
 function suspend(){disposed=true;needsGesture=unlocked;stop();landscape?.dispose();landscape=null;if(context?.state==='running')context.suspend().catch(()=>{});ui();}
 function restore(){disposed=false;latest={...latest,activity:0};ui();}
 addEventListener('pagehide',suspend);addEventListener('pageshow',restore);document.addEventListener('visibilitychange',()=>document.hidden?suspend():restore());
 let warm=0;function warmOne(){if(warm>=timbres.presets.length)return;const p=timbres.presets[warm++];pcm.set(p.id,timbres.render(p.id));if('requestIdleCallback'in window)requestIdleCallback(warmOne,{timeout:1500});else setTimeout(warmOne,90);}
 if('requestIdleCallback'in window)requestIdleCallback(warmOne,{timeout:1200});else setTimeout(warmOne,300);
 window.HolyMindAudio=Object.freeze({play,mute,setVolume,setLayer,beginFeedback,cue,
  scorePreview(command,gesture=false){if(!gesture)return false;if(command==='pause'){music?.preview('pause');return true;}beginFeedback(true);const run=()=>{field();music?.preview(command);};if(ready())run();else feedbackUnlock?.then(ok=>{if(ok)run();});return true;},
  setMix(mode){if(!['taps','bed','full'].includes(mode))return;setLayer('ambience',mode!=='taps',false);setLayer('flow',mode==='full',false);setLayer('cues',mode==='full',false);},
  updateSoundscape(state){latest={...latest,...state};if(ready())field();},
  settle(reverse=false){if(!ready()||!flow||!landscape)return false;const ok=landscape.settle(reverse);if(ok){lastCueAt=performance.now();lastCuePriority=3;history.push({id:reverse?'current-reconnect':'current-resolve',kind:'resolution',time:performance.now()});if(history.length>80)history.shift();}return ok;},
  snapshot:()=>({version:'scroll-score-v17',character:timbres.character,enabled,volume,ambience,flow,cues,unlocked,needsGesture,context:context?.state||'uncreated',contextCount,played,dropped,lastStyle,voices:voices.size,peakVoices,pending,maxRms,lastSynthesisMs,lastScheduleMs,warm:pcm.size,history:[...history],score:music?.snapshot()||null,feedback:{played:cuePlayed,dropped:cueDropped,active:!!cueVoice,maxVoices:cuePeakVoices,maxRms:cueMaxRms,rms:readCueRms(),lastKey:lastCueKey,retiring:retiringCues.size,piano:window.HolyMindCueTimbres?.snapshot()},soundscape:landscape?.snapshot()||null})});ui();
})();
