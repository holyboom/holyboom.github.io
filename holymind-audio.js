/* Quiet Current v13. One gesture-unlocked AudioContext, separate sound buses.
 * Electric v12 tap PCM is unchanged. Muting sound never changes visual motion.
 * A suspended/interrupted page requires a new explicit gesture: scroll cannot wake it.
 */
(()=>{
 'use strict';
 const timbres=window.HolyMindTimbres;if(!timbres)return;
 let context=null,master=null,compressor=null,analyser=null,landscape=null;
 let enabled=true,volume=.48,ambience=true,flow=true,unlocked=false,needsGesture=false,disposed=false;
 let played=0,dropped=0,lastStyle=null,token=0,pending=0,peakVoices=0,maxRms=0,lastSynthesisMs=0,lastScheduleMs=0,meterTimer=0;
 let latest={scope:1,activity:0,progress:0,direction:1,morph:0},contextCount=0;
 const cache=new Map(),pcm=new Map(),voices=new Set(),history=[];
 const button=document.getElementById('sound-toggle'),control=document.getElementById('sound-volume');
 const bedControl=document.getElementById('sound-ambience'),flowControl=document.getElementById('sound-flow');
 const fieldEnabled=!!document.getElementById('system-assembly');
 try{enabled=localStorage.getItem('holymind-sound')!=='muted';const raw=localStorage.getItem('holymind-volume'),v=Number(raw);if(raw!==null&&v>=0&&v<=1)volume=v;
  ambience=localStorage.getItem('holymind-ambience')!=='off';flow=localStorage.getItem('holymind-flow')!=='off';}catch(_){}
 const ready=()=>enabled&&unlocked&&!needsGesture&&!disposed&&!document.hidden&&context?.state==='running';
 function ui(){
  const waiting=enabled&&(!unlocked||needsGesture),label=waiting?(needsGesture?'Resume sound':'Start sound'):enabled?'Sound on':'Muted';
  if(button){button.setAttribute('aria-pressed',String(enabled&&unlocked&&!needsGesture));button.setAttribute('aria-label',waiting?label:enabled?'Mute HolyMind sound':'Enable HolyMind sound');button.dataset.sound=enabled?'on':'off';const l=button.querySelector('.sound-label');if(l)l.textContent=label;button.title=waiting?'Tap to begin the quiet soundscape':'Mute sound without stopping motion';}
  if(control)control.value=String(Math.round(volume*100));if(bedControl)bedControl.checked=ambience;if(flowControl)flowControl.checked=flow;
  document.body.dataset.sound=enabled?(needsGesture?'needs-gesture':unlocked?'enabled':'armed'):'muted';
  document.dispatchEvent(new CustomEvent('holymind:audio-state',{detail:{enabled,unlocked,needsGesture,ambience,flow}}));
 }
 function stop(){token++;pending=0;for(const v of voices){try{v.source.stop();}catch(_){}try{v.source.disconnect();v.gain.disconnect();}catch(_){}}voices.clear();if(meterTimer)clearTimeout(meterTimer);meterTimer=0;}
 function field(){
  if(!ready()||!fieldEnabled||!window.HolyMindSoundscape)return;
  if(!landscape){try{landscape=HolyMindSoundscape.create(context,master);}catch(_){document.body.dataset.soundscape='unavailable';return;}}
  landscape.update({...latest,enabled,ambience,flow});document.body.dataset.soundscape='ready';
 }
 function make(){
  if(context)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC){document.body.dataset.sound='unsupported';return false;}
  try{
   context=new AC({latencyHint:'interactive'});contextCount++;
   master=context.createGain();master.gain.value=enabled?volume:0;
   compressor=context.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=14;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.14;
   analyser=context.createAnalyser();analyser.fftSize=512;master.connect(compressor);compressor.connect(analyser);analyser.connect(context.destination);
   context.addEventListener('statechange',()=>{if(context.state!=='running'&&unlocked){needsGesture=true;landscape?.silence();stop();ui();}});
   return true;
  }catch(_){document.body.dataset.sound='unsupported';return false;}
 }
 function buffer(id){
  if(cache.has(id))return cache.get(id);const start=performance.now(),d=pcm.get(id)||timbres.render(id);pcm.set(id,d);
  const b=context.createBuffer(1,d.samples.length,d.sampleRate);b.copyToChannel(d.samples,0);cache.set(id,b);lastSynthesisMs=performance.now()-start;return b;
 }
 function meter(){
  if(!analyser||!voices.size){meterTimer=0;return;}const d=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(d);let sum=0;for(const x of d)sum+=x*x;maxRms=Math.max(maxRms,Math.sqrt(sum/d.length));meterTimer=setTimeout(meter,55);
 }
 function play(id,{gain=1,gesture=false,variation=true,kind='brain'}={}){
  if(!enabled||document.hidden||disposed||!timbres.presets.some(p=>p.id===id))return false;
  if((!unlocked||needsGesture)&&!gesture)return false;if(!make())return false;
  if(gesture){unlocked=true;needsGesture=false;}
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
   landscape?.duck(now);played++;lastStyle=id;lastScheduleMs=performance.now()-requestAt;
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
  if(name==='ambience')ambience=!!on;else if(name==='flow')flow=!!on;else return;
  if(persist)try{localStorage.setItem('holymind-'+name,on?'on':'off');}catch(_){}field();ui();
 }
 button?.addEventListener('click',e=>{
  if(!e.isTrusted)return;
  if(!enabled){mute(false);play('insight-pulse',{gesture:true,gain:.45,kind:'enable'});}
  else if(!unlocked||needsGesture)play('insight-pulse',{gesture:true,gain:.45,kind:'enable'});
  else mute(true);
 });
 control?.addEventListener('input',()=>setVolume(Number(control.value)/100));
 bedControl?.addEventListener('change',()=>setLayer('ambience',bedControl.checked));flowControl?.addEventListener('change',()=>setLayer('flow',flowControl.checked));
 document.addEventListener('holymind:brain-burst',e=>{const d=e.detail||{};play(d.styleId||'neural-discharge',{gesture:d.userGesture===true});});
 // No 25/50/75 tap-preset milestones: continuous layer opening owns that story.
 function suspend(){disposed=true;needsGesture=unlocked;stop();landscape?.dispose();landscape=null;if(context?.state==='running')context.suspend().catch(()=>{});ui();}
 function restore(){disposed=false;latest={...latest,activity:0};ui();}
 addEventListener('pagehide',suspend);addEventListener('pageshow',restore);document.addEventListener('visibilitychange',()=>document.hidden?suspend():restore());
 let warm=0;function warmOne(){if(warm>=timbres.presets.length)return;const p=timbres.presets[warm++];pcm.set(p.id,timbres.render(p.id));if('requestIdleCallback'in window)requestIdleCallback(warmOne,{timeout:1500});else setTimeout(warmOne,90);}
 if('requestIdleCallback'in window)requestIdleCallback(warmOne,{timeout:1200});else setTimeout(warmOne,300);
 window.HolyMindAudio=Object.freeze({play,mute,setVolume,setLayer,
  setMix(mode){if(!['taps','bed','full'].includes(mode))return;setLayer('ambience',mode!=='taps',false);setLayer('flow',mode==='full',false);},
  updateSoundscape(state){latest={...latest,...state};if(ready())field();},
  settle(reverse=false){if(!ready()||!flow||!landscape)return false;const ok=landscape.settle(reverse);if(ok){history.push({id:reverse?'current-reconnect':'current-resolve',kind:'resolution',time:performance.now()});if(history.length>80)history.shift();}return ok;},
  snapshot:()=>({version:'soundscape-v13',character:timbres.character,enabled,volume,ambience,flow,unlocked,needsGesture,context:context?.state||'uncreated',contextCount,played,dropped,lastStyle,voices:voices.size,peakVoices,pending,maxRms,lastSynthesisMs,lastScheduleMs,warm:pcm.size,history:[...history],soundscape:landscape?.snapshot()||null})});ui();
})();
