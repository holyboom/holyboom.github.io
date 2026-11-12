/* Signature celebration is rendered by the continuity clock, not an independent loop.
 * Scroll -> immutable geometry. Pausing freezes it; reverse restores the same sparks. */
(()=>{
 'use strict';
 const model=window.HolyMindBoomModel,dot=document.querySelector('.signature-period'),word=document.querySelector('.signature-front');if(!model||!dot||!word)return;
 const canvas=document.createElement('canvas');canvas.className='boom-fireworks';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 let range={start:0,end:0},progress=0,lastY=null,frameCount=0,draws=0,visible=false,lastFrame=null,lastBox=null,lastAt=0,lastDirection=0,lastEvent=-1e6,width=0,height=0,scale=1;
 const aboutName=dot.closest('.about-name'),masthead=document.querySelector('.masthead');
 let dirty=false,lastCharge='',lastEmphasis='',reads=0,skippedDraws=0;
 let cueSides=model.cues.map(()=>false),lastReset=0;const eventHistory=[],paint=[];
 const glows=model.palette.map(color=>{const c=document.createElement('canvas');c.width=c.height=40;const x=c.getContext('2d'),g=x.createRadialGradient(20,20,0,20,20,20);g.addColorStop(0,color+'A0');g.addColorStop(.25,color+'48');g.addColorStop(1,color+'00');x.fillStyle=g;x.fillRect(0,0,40,40);return c;});
 function decoration(charge=0,emphasis=0){
  const c=charge.toFixed(4),e=emphasis.toFixed(4);
  if(c!==lastCharge){dot.style.setProperty('--boom-charge',c);lastCharge=c;}
  if(e!==lastEmphasis){aboutName?.style.setProperty('--boom-emphasis',e);lastEmphasis=e;}
 }
 function clear(){if(dirty){ctx.clearRect(0,0,width,height);dirty=false;}visible=false;decoration();}
 function measureFrame(y){
  if(range.end<=range.start||y<=range.start||y>=range.end||document.hidden)return null;
  reads++;const r=dot.getBoundingClientRect(),w=word.getBoundingClientRect();
  return {width:innerWidth,height:innerHeight,header:masthead?.offsetHeight||76,wordLeft:w.left,wordTop:w.top,wordWidth:w.width,anchor:{x:r.left+r.width*.5,y:r.top+r.height*.72}};
 }
 function sameFrame(t,box){return lastFrame?.progress===t&&lastBox&&
  ['width','height','header','wordLeft','wordTop','wordWidth'].every(k=>box[k]===lastBox[k])&&
  box.anchor.x===lastBox.anchor.x&&box.anchor.y===lastBox.anchor.y;}
 function size(){const dpr=Math.min(innerWidth<=680?1.5:2,devicePixelRatio||1);if(width!==innerWidth||height!==innerHeight||scale!==dpr){width=innerWidth;height=innerHeight;scale=dpr;canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);ctx.setTransform(scale,0,0,scale,0,0);}}
 function shape(x,y,r,color,alpha,diamond=false){if(alpha<.007)return;ctx.globalAlpha=alpha;ctx.drawImage(glows[color],x-r*5,y-r*5,r*10,r*10);ctx.fillStyle=model.palette[color];ctx.beginPath();if(diamond){ctx.moveTo(x,y-r*1.6);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r*1.6);ctx.lineTo(x-r,y);ctx.closePath();ctx.fill();}else ctx.fillRect(Math.round(x-r/2),Math.round(y-r/2),r,r);}
 function draw(f,box){
  size();ctx.clearRect(0,0,width,height);ctx.save();ctx.beginPath();ctx.rect(0,box.header+2,width,height-box.header-2);ctx.clip();ctx.globalCompositeOperation='lighter';
  if(f.halo>.005){const x=box.wordLeft+box.wordWidth*.52,y=box.wordTop-55;ctx.globalAlpha=f.halo*.12;ctx.drawImage(glows[0],x-140,y-90,280,180);}
  if(f.charge>.001){const a=box.anchor,r=10+f.charge*8;ctx.globalAlpha=f.charge*.7;ctx.strokeStyle=model.palette[1];ctx.lineWidth=1;ctx.beginPath();ctx.arc(a.x,a.y,r*(1.8-f.charge*.8),0,Math.PI*2);ctx.stroke();shape(a.x,a.y,3+f.charge*2,4,f.charge*.9,true);}
  for(const trail of f.trails){ctx.globalAlpha=trail.alpha*.68;ctx.strokeStyle=model.palette[trail.color];ctx.lineWidth=1.65;ctx.beginPath();trail.points.forEach((p,i)=>i?ctx.lineTo(Math.round(p.x*2)/2,Math.round(p.y*2)/2):ctx.moveTo(p.x,p.y));ctx.stroke();}
  for(const p of f.particles){if(p.alpha<.007)continue;if(p.shape==='line'||p.shape==='fall'){ctx.globalAlpha=p.alpha*(p.shape==='fall'?.34:.65);ctx.strokeStyle=model.palette[p.color];ctx.lineWidth=p.shape==='fall'?.75:1.05;ctx.beginPath();ctx.moveTo(p.x-p.dx,p.y-p.dy);ctx.lineTo(p.x,p.y);ctx.stroke();}shape(p.x,p.y,p.size,p.color,p.alpha,p.shape==='diamond');}
  f.heads.forEach(p=>shape(p.x,p.y,3.6,p.color,p.alpha,true));ctx.restore();ctx.globalAlpha=1;dirty=true;draws++;
 }
 function render(input){
  const start=performance.now();frameCount++;const y=input.y,t=Math.max(0,Math.min(1,(y-range.start)/Math.max(1,range.end-range.start))),previous=progress;progress=t;
  const dir=lastY===null?0:Math.sign(y-lastY);lastY=y;
  if(range.end<=range.start||t===0||t===1||document.hidden){
   clear();lastFrame=model.frame(t,lastBox||{});cueSides=model.cues.map(c=>t>=c.at);lastAt=performance.now();return;
  }
  const box=input.box||measureFrame(y);
  if(!box||box.anchor.y<box.header+8||box.wordTop>innerHeight+100){clear();return;}
  const unchanged=sameFrame(t,box);lastBox=box;visible=true;
  if(!unchanged){lastFrame=model.frame(t,box);draw(lastFrame,box);decoration(lastFrame.charge,Math.min(1,t/.16,(1-t)/.13));}else skippedDraws++;
  const sound=window.HolyMindScrollSound?.snapshot(),trusted=sound?.intent===true&&(sound.focus??1)>.4&&performance.now()-lastReset>250;
  const changed=dir&&Math.abs(t-previous)>1e-7;
  if(changed&&trusted&&visible){
   if(lastDirection&&dir!==lastDirection)window.HolyMindAudio?.boomDirection?.(dir);
   const crossed=[];model.cues.forEach((c,i)=>{if(dir>0&&!cueSides[i]&&t>=c.at+.002){cueSides[i]=true;crossed.push(c);}else if(dir<0&&cueSides[i]&&t<=c.at-.002){cueSides[i]=false;crossed.push(c);}});
   // A fast swipe gets the latest visual moment, never a queue of missed explosions.
   const c=dir>0?crossed.at(-1):crossed[0];
   if(c&&performance.now()-lastEvent>45){const kind=dir>0?c.id:c.id==='charge'?'seal':c.id==='burst'?'gather':c.id==='launch'?'return':'recall';const ok=window.HolyMindAudio?.boomCue?.({kind,index:c.index,direction:dir,progress:t,x:box.anchor.x/innerWidth})||false;lastEvent=performance.now();eventHistory.push({kind,index:c.index,direction:dir,progress:t,played:ok,coalesced:crossed.length,time:lastEvent});if(eventHistory.length>100)eventHistory.shift();}
   lastDirection=dir;
  }else if(changed&&!trusted){cueSides=model.cues.map(c=>t>=c.at);lastDirection=dir;}
  if(t===0||t===1){cueSides=model.cues.map(c=>t>=c.at);}
  lastAt=performance.now();paint.push(lastAt-start);if(paint.length>90)paint.shift();
 }
 function setRange(start,end){if(Math.abs(start-range.start)>.5||Math.abs(end-range.end)>.5){range={start,end};lastY=null;lastReset=performance.now();cueSides=model.cues.map(c=>progress>=c.at);}}
 function reset(){lastY=null;lastDirection=0;lastReset=performance.now();cueSides=model.cues.map(c=>progress>=c.at);if(document.hidden)clear();}
 document.addEventListener('visibilitychange',reset);addEventListener('pagehide',()=>{reset();clear();});addEventListener('resize',reset,{passive:true});
 window.HolyMindBoomCelebration=Object.freeze({version:'afterglow-v23',render,measureFrame,setRange,snapshot:()=>({range:{...range},progress,phase:lastFrame?.phase||'rest',visible,frameCount,draws,reads,skippedDraws,particleCount:lastFrame?.particles.length||0,litParticles:lastFrame?.particles.filter(p=>p.alpha>.02).length||0,box:lastBox,geometry:lastFrame,events:[...eventHistory],lastDirection,meanPaintMs:paint.reduce((a,b)=>a+b,0)/Math.max(1,paint.length),lastAt,ownFrameLoop:false})});
})();
