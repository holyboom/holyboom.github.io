/* Gesture-unlocked audio. Sound is independent of ALWAYS-ON visual motion.
 * No audio/context on load, no continuous bed, no network or account dependencies. */
(()=>{
 'use strict';
 const timbres=window.HolyMindTimbres;if(!timbres)return;
 let context=null,master=null,compressor=null,analyser=null,enabled=true,volume=.48,unlocked=false,played=0,dropped=0,lastStyle=null,lastMilestoneAt=-1e6;
 let token=0,pending=0,peakVoices=0,maxRms=0,lastSynthesisMs=0,lastScheduleMs=0,disposed=false;
 const cache=new Map(),pcm=new Map(),voices=new Set(),history=[];let meterTimer=0;
 const button=document.getElementById('sound-toggle'),control=document.getElementById('sound-volume');
 try{enabled=localStorage.getItem('holymind-sound')!=='muted';const stored=localStorage.getItem('holymind-volume'),v=Number(stored);if(stored!==null&&v>=0&&v<=1)volume=v;}catch(_){}
 function ui(){
  if(button){button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Mute HolyMind sound':'Enable HolyMind sound');button.dataset.sound=enabled?'on':'off';button.querySelector('.sound-label').textContent=enabled?'Sound on':'Muted';}
  if(control)control.value=String(Math.round(volume*100));
  document.body.dataset.sound=enabled?(unlocked?'enabled':'armed'):'muted';
 }
 function make(){
  if(context)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC){document.body.dataset.sound='unsupported';return false;}
  try{context=new AC({latencyHint:'interactive'});master=context.createGain();master.gain.value=enabled?volume:0;
   compressor=context.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=14;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.14;
   analyser=context.createAnalyser();analyser.fftSize=512;master.connect(compressor);compressor.connect(analyser);analyser.connect(context.destination);return true;
  }catch(_){document.body.dataset.sound='unsupported';return false;}
 }
 function buffer(id){
  if(cache.has(id))return cache.get(id);const start=performance.now();const data=pcm.get(id)||timbres.render(id);pcm.set(id,data);
  const b=context.createBuffer(1,data.samples.length,data.sampleRate);b.copyToChannel(data.samples,0);cache.set(id,b);lastSynthesisMs=performance.now()-start;return b;
 }
 function stop(){token++;pending=0;for(const v of voices){try{v.source.stop();}catch(_){}v.source.disconnect();v.gain.disconnect();}voices.clear();if(meterTimer)clearTimeout(meterTimer);meterTimer=0;}
 function meter(){
  if(!analyser||!voices.size){meterTimer=0;return;}const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);let sum=0;for(const v of data)sum+=v*v;maxRms=Math.max(maxRms,Math.sqrt(sum/data.length));meterTimer=setTimeout(meter,55);
 }
 function play(id,{gain=1,gesture=false,variation=true,kind='brain'}={}){
  if(!enabled||document.hidden||disposed||!timbres.presets.some(p=>p.id===id))return false;
  if(!unlocked&&!gesture)return false;
  if(!make())return false;
  if(gesture){unlocked=true;ui();}
  if(pending>=3){dropped++;return false;}
  const generation=token,requestAt=performance.now();pending++;
  // resume is invoked within the accepted gesture, before any asynchronous work.
  const resume=context.state==='running'?Promise.resolve():context.resume();
  Promise.resolve(resume).then(()=>{
   pending=Math.max(0,pending-1);if(generation!==token||!enabled||document.hidden||disposed||context.state!=='running')return;
   // Do not play a stale burst long after the associated visual finished.
   if(performance.now()-requestAt>600){dropped++;return;}
   if(voices.size>=3){const oldest=voices.values().next().value;try{oldest.source.stop();}catch(_){}voices.delete(oldest);}
   const source=context.createBufferSource(),g=context.createGain();source.buffer=buffer(id);source.playbackRate.value=variation?.985+Math.random()*.03:1;
   const now=context.currentTime;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(gain/Math.sqrt(1+voices.size*.65),now+.004);g.gain.setTargetAtTime(0,now+source.buffer.duration*.83,.035);
   source.connect(g);g.connect(master);const voice={source,gain:g};voices.add(voice);peakVoices=Math.max(peakVoices,voices.size);
   source.onended=()=>{voices.delete(voice);source.disconnect();g.disconnect();};source.start(now+.002);played++;lastStyle=id;lastScheduleMs=performance.now()-requestAt;
   history.push({id,kind,time:performance.now(),rate:source.playbackRate.value});if(history.length>80)history.shift();if(!meterTimer)meter();
  }).catch(()=>{pending=Math.max(0,pending-1);dropped++;document.body.dataset.sound='needs-gesture';});return true;
 }
 function mute(value){enabled=!value;stop();if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.012);try{localStorage.setItem('holymind-sound',enabled?'enabled':'muted');}catch(_){}ui();}
 button?.addEventListener('click',e=>{mute(enabled);if(enabled&&e.isTrusted)play('insight-pulse',{gesture:true,gain:.55,kind:'enable'});});
 control?.addEventListener('input',()=>{volume=Math.max(0,Math.min(1,Number(control.value)/100));if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.02);try{localStorage.setItem('holymind-volume',String(volume));}catch(_){};});
 document.addEventListener('holymind:brain-burst',e=>{const d=e.detail||{};play(d.styleId||'neural-discharge',{gesture:d.userGesture===true});});
 // Milestones only AFTER a visitor has explicitly unlocked sound. One cue for a
 // fast jump; no replay when hovering around a threshold, no automatic unlock.
 const marks=[25,50,75,100],ids=['insight-pulse','signal-fork','verification-spark','holy-prime'];let prior=0;const reached=new Set();
 document.addEventListener('holymind:assembly',e=>{
  const v=Number(e.detail?.expanded)||0;if(v<=2)reached.clear();
  const crossed=marks.filter(m=>prior<m&&v>=m&&!reached.has(m));crossed.forEach(m=>reached.add(m));prior=v;
  if(!crossed.length||!unlocked||!enabled||document.hidden)return;
  const s=window.HolyMindAssemblyScroll?.snapshot();if(!s?.active)return;
  const now=performance.now(),m=crossed.at(-1);if(now-lastMilestoneAt<550)return;lastMilestoneAt=now;
  play(ids[marks.indexOf(m)],{gain:.38,kind:'milestone',variation:false});
 });
 function suspend(){disposed=true;stop();if(context&&context.state==='running')context.suspend().catch(()=>{});}
 function restore(){disposed=false;ui();/* A new explicit gesture resumes audio; never replay missed sounds. */}
 addEventListener('pagehide',suspend);addEventListener('pageshow',restore);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else restore();});
 // Warm pure PCM in idle slices; this creates no AudioContext and emits no sound.
 let warm=0;function warmOne(){if(warm>=timbres.presets.length)return;const p=timbres.presets[warm++];pcm.set(p.id,timbres.render(p.id));if('requestIdleCallback'in window)requestIdleCallback(warmOne,{timeout:1500});else setTimeout(warmOne,90);}
 if('requestIdleCallback'in window)requestIdleCallback(warmOne,{timeout:1200});else setTimeout(warmOne,300);
 window.HolyMindAudio=Object.freeze({play,mute,setVolume(n){volume=Math.max(0,Math.min(1,Number(n)||0));if(master)master.gain.setTargetAtTime(enabled?volume:0,context.currentTime,.02);ui();},snapshot:()=>({version:'resonance-v11',enabled,volume,unlocked,context:context?.state||'uncreated',played,dropped,lastStyle,voices:voices.size,peakVoices,pending,maxRms,lastSynthesisMs,lastScheduleMs,warm:pcm.size,history:[...history]})});ui();
})();
