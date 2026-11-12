/* Mozart K.545 — ordered scroll score; natural sampled tails, never random chords.
 * Attributions: assets/score/mozart-k545/ATTRIBUTION.md and the piano-bank notice. */
(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
 function create(ctx,destination,options={}){
  const score=root.HolyMindMozartScore,keys=root.HolyMindCueTimbres;
  if(!score||!keys?.snapshot().ready)throw Error('Score and piano bank must be ready');
  const voices=new Set(),buffers=new Map(),history=[],nodes=[];let timer=0,disposed=false,running=false,demo=false;
  let cursor=clamp(options.startBeat||0,0,score.totalBeats-1),lastBeat=cursor,loops=0,nextTime=ctx.currentTime+.03,tempo=88,targetTempo=88,driveUntil=-1,played=0,peakVoices=0,skipped=0,pauses=0,starts=0,duckCount=0;
  let scene='hero',direction=1,enabled=true,material={cutoff:4900,room:.12,gain:1},lastAccent=-10;
  const own=n=>(nodes.push(n),n),out=own(ctx.createGain()),colour=own(ctx.createBiquadFilter()),dry=own(ctx.createGain()),wet=own(ctx.createGain()),room=own(ctx.createConvolver()),meter=own(ctx.createAnalyser());
  out.gain.value=.88;colour.type='lowpass';colour.frequency.value=4900;colour.Q.value=.5;dry.gain.value=.92;wet.gain.value=.16;meter.fftSize=2048;
  const impulse=ctx.createBuffer(2,Math.round(ctx.sampleRate*2.8),ctx.sampleRate);let seed=0x4d5a5254;
  for(let c=0;c<2;c++){const d=impulse.getChannelData(c);let lp=0;for(let i=0;i<d.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;lp+=.22*((seed>>>0)/2147483648-1-lp);const t=i/ctx.sampleRate;d[i]=lp*Math.exp(-t*3.4)*.028;}
   for(const [s,g] of [[.023,.22],[.047,.12],[.083,.065]])d[Math.round((s+c*.003)*ctx.sampleRate)]+=g;
  }
  room.normalize=false;room.buffer=impulse;colour.connect(dry);colour.connect(room);room.connect(wet);dry.connect(out);wet.connect(out);out.connect(meter);meter.connect(destination);
  // An action key may share the score harmony, but belongs to the reaction mixer.
  // Reuse the room impulse; no additional sample, composition or oscillator.
  let accentColour=null,accentWet=null;
  if(options.accentDestination){
   accentColour=own(ctx.createBiquadFilter());accentColour.type='lowpass';accentColour.frequency.value=4900;accentColour.Q.value=.5;
   const ad=own(ctx.createGain()),ar=own(ctx.createConvolver()),ao=own(ctx.createGain());accentWet=own(ctx.createGain());
   ad.gain.value=.92;accentWet.gain.value=.16;ao.gain.value=.88;ar.normalize=false;ar.buffer=impulse;
   accentColour.connect(ad);accentColour.connect(ar);ar.connect(accentWet);ad.connect(ao);accentWet.connect(ao);ao.connect(options.accentDestination);
  }
  function target(p,value,tau=.24,at=ctx.currentTime){if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(at);else{const v=p.value;p.cancelScheduledValues(at);p.setValueAtTime(v,at);}p.setTargetAtTime(value,at,tau);}
  function sample(midi){const k=keys.key(midi);if(!k)return null;if(!buffers.has(k.midi)){const b=ctx.createBuffer(1,k.samples.length,k.sampleRate);b.copyToChannel(k.samples,0);buffers.set(k.midi,b);}return {buffer:buffers.get(k.midi),rate:2**((midi-k.midi)/12)};}
  function note(event,at,secondsPerBeat,{accent=false}={}){
   if(disposed||(!options.offline&&voices.size>=36)){skipped++;return false;}
   const sampled=sample(event.midi);if(!sampled)return false;
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=sampled.buffer;source.playbackRate.value=sampled.rate;
   const melody=event.hand==='melody',hold=Math.max(.075,event.duration*secondsPerBeat*.88),release=accent?2.5:melody?2.45:1.70;
   const level=(accent?.20:melody?.43:.225)*clamp((event.velocity||70)/85,.35,1.12)*material.gain;
   const available=source.buffer.duration/sampled.rate,tailEnd=at+Math.min(available-.035,hold+release);
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+.004);
   const releaseAt=Math.min(tailEnd-.16,at+hold);gain.gain.setValueAtTime(level,releaseAt);gain.gain.exponentialRampToValueAtTime(.000008,tailEnd-.065);gain.gain.linearRampToValueAtTime(0,tailEnd);
   source.connect(gain);gain.connect(accent&&accentColour?accentColour:colour);const voice={source,gain,at,end:tailEnd,midi:event.midi,accent};voices.add(voice);peakVoices=Math.max(peakVoices,voices.size);
   source.onended=()=>{voices.delete(voice);try{source.disconnect();gain.disconnect();}catch(_){}};
   source.start(at);source.stop(tailEnd+.005);played++;return true;
  }
  function scheduleBeat(beat,at,bpm=88,profile={}){
   if(disposed)return false;const b=((beat%score.totalBeats)+score.totalBeats)%score.totalBeats,spb=60/clamp(bpm,78,100);
   const events=score.events.filter(e=>e.beat>=b&&e.beat<b+1),ids=[];
   for(const e of events){note(e,at+(e.beat-b)*spb,spb);ids.push(e.midi);}
   lastBeat=b;history.push({beat:b,bar:Math.floor(b/4)+1,at,bpm,notes:ids,scene:profile.scene||scene,direction:profile.direction||direction});if(history.length>240)history.shift();return true;
  }
  function clearTimer(){if(timer)clearTimeout(timer);timer=0;}
  function pump(){
   timer=0;if(disposed||!running||!enabled)return;const now=ctx.currentTime;
   if(ctx.state!=='running'){running=false;return;}
   if(nextTime<now-.14)nextTime=now+.025;
   if(nextTime<=now+.095){
    if(!demo&&now>driveUntil){running=false;pauses++;return;}
    tempo+=clamp(targetTempo-tempo,-2,2);scheduleBeat(cursor,nextTime,tempo,{scene,direction});cursor++;
    if(cursor>=score.totalBeats){cursor=0;loops++;}nextTime+=60/tempo;
   }
   timer=setTimeout(pump,25);
  }
  function start(){if(disposed||running||!enabled)return;starts++;running=true;nextTime=Math.max(ctx.currentTime+.025,nextTime);if(nextTime>ctx.currentTime+.8)nextTime=ctx.currentTime+.025;pump();}
  function update(state={}){
   if(disposed)return;enabled=state.enabled!==false;scene=state.scene||scene;direction=state.direction<0?-1:1;
   const p=keys.profiles.find(x=>x.id===scene)||keys.profiles[0];material={cutoff:p.cutoff,room:p.room,gain:scene==='about'?.78:scene==='footer'?.76:1};
   target(colour.frequency,p.cutoff,.4);target(wet.gain,clamp(p.room+.10,.12,.30),.65);
   if(accentColour){target(accentColour.frequency,p.cutoff,.4);target(accentWet.gain,clamp(p.room+.10,.12,.30),.65);}
   if(!enabled){demo=false;running=false;clearTimer();fade(.22,true);return;}
   const activity=clamp(state.activity||0,0,1),motion=state.intent===true&&activity>.025&&(state.focus??1)>.4;
   if(motion){driveUntil=ctx.currentTime+.28;targetTempo=78+22*Math.sqrt(activity);start();}
  }
  function fade(seconds=.85,preserveAccents=false){
   const now=ctx.currentTime;
   for(const v of voices){if(preserveAccents&&v.accent&&accentColour)continue;if(v.at>now){try{v.source.stop();}catch(_){}continue;}
    const p=v.gain.gain;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(now);else{const n=p.value;p.cancelScheduledValues(now);p.setValueAtTime(n,now);}
    p.setTargetAtTime(.000001,now,Math.max(.015,seconds/5));try{v.source.stop(now+seconds+.04);}catch(_){}
   }
  }
  function stopTransport(reason='suspend'){demo=false;running=false;clearTimer();driveUntil=-1;nextTime=ctx.currentTime+.025;fade((reason==='mute'||reason==='suspend')?.045:.9,reason==='mute');}
  function duck(){if(disposed)return;duckCount++;const t=ctx.currentTime,p=out.gain;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else p.cancelScheduledValues(t);p.linearRampToValueAtTime(.26,t+.035);p.setTargetAtTime(.88,t+.32,.22);}
  function harmony(){return score.chords[Math.floor(lastBeat/4)]||score.chords[0];}
  function accent(kind='action',variant=0){
   if(disposed||!enabled||ctx.state!=='running'||ctx.currentTime-lastAccent<.24)return false;
   const chord=harmony(),n=chord[Math.abs(variant)%chord.length],midi=n<60?n+12:n;lastAccent=ctx.currentTime;
   return note({midi,duration:.5,velocity:kind==='arrival'?45:60,hand:'melody'},ctx.currentTime+.01,60/tempo,{accent:true});
  }
  function preview(command){if(command==='start'){demo=true;enabled=true;targetTempo=88;start();}else if(command==='pause'){demo=false;running=false;clearTimer();pauses++;}else if(command==='restart'){demo=false;running=false;clearTimer();fade(1.15);cursor=0;lastBeat=0;nextTime=ctx.currentTime+.18;demo=true;enabled=true;start();}}
  function rms(){const a=new Float32Array(2048);meter.getFloatTimeDomainData(a);let n=0;for(const v of a)n+=v*v;return Math.sqrt(n/a.length);}
  function dispose(){if(disposed)return;stopTransport();disposed=true;for(const v of voices){try{v.source.stop();v.source.disconnect();v.gain.disconnect();}catch(_){}}voices.clear();for(const n of nodes){try{n.disconnect();}catch(_){}}}
  return Object.freeze({update,stopTransport,duck,harmony,accent,preview,scheduleBeat,note,dispose,snapshot:()=>({version:'scroll-score-v17',title:score.title,enabled,running,demo,cursor,lastBeat,bar:Math.floor(lastBeat/4)+1,loops,tempo,targetTempo,scene,direction,played,peakVoices,activeVoices:voices.size,skipped,pauses,starts,duckCount,timer:!!timer,rms:rms(),naturalReleaseSeconds:{melody:2.45,accompaniment:1.70},history:[...history]})});
 }
 root.HolyMindScrollScore=Object.freeze({version:'scroll-score-v17',create});
})(globalThis);
