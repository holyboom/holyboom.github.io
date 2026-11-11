/* Living Mind v4. Original image stays intact. Pulses follow precomputed bright-pixel paths. */
(() => {
 'use strict';
 const canvas=document.getElementById('neural-sparks'),image=document.querySelector('.hero-brain');
 if(!canvas||!image)return;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const W=480,small=matchMedia('(max-width:680px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const mask=document.createElement('canvas'),beam=document.createElement('canvas');
 mask.width=mask.height=beam.width=beam.height=canvas.width=canvas.height=W;
 const mc=mask.getContext('2d',{willReadFrequently:true}),bc=beam.getContext('2d');
 if(!mc||!bc)return;
 ctx.imageSmoothingEnabled=false;
 let paths=[],nodes=[],ready=false,inside=true,raf=0,last=0,elapsed=0,frames=0,engaged=false,dead=false;
 const allowed=()=>document.body.dataset.motion==='on'||(!document.body.dataset.motion&&!reduce.matches);
 const running=()=>ready&&allowed()&&inside&&!document.hidden&&!dead;
 function loadMask(){
  try{
   mc.clearRect(0,0,W,W);mc.drawImage(image,0,0,W,W);
   const px=mc.getImageData(0,0,W,W),d=px.data;
   for(let k=0;k<d.length;k+=4){const light=.35*d[k]+.45*d[k+1]+.2*d[k+2];const alpha=d[k+3]*Math.max(0,Math.min(1,(light-115)/100));d[k]=190;d[k+1]=150;d[k+2]=255;d[k+3]=alpha;}
   mc.putImageData(px,0,0);ready=true;sync();
  }catch(_){canvas.dataset.state='fallback';}
 }
 function star(x,y,size,alpha,color){
  x=Math.round(x);y=Math.round(y);ctx.globalAlpha=alpha;ctx.fillStyle=color;
  ctx.fillRect(x-size,y-1,size*2+1,2);ctx.fillRect(x-1,y-size,2,size*2+1);ctx.fillStyle='#fff4ff';ctx.fillRect(x-1,y-1,3,3);ctx.globalAlpha=1;
 }
 function paint(t,animate){
  ctx.clearRect(0,0,W,W);if(!ready)return;
  const x=animate?110+(Math.sin(t*.00046)+1)*130:250,y=animate?220+Math.cos(t*.00061)*80:220;
  bc.clearRect(0,0,W,W);bc.globalCompositeOperation='source-over';
  const glow=bc.createRadialGradient(x,y,4,x,y,engaged?160:115);
  glow.addColorStop(0,'rgba(172,231,255,.94)');glow.addColorStop(.36,'rgba(204,131,255,.7)');glow.addColorStop(1,'rgba(160,70,255,0)');
  bc.fillStyle=glow;bc.fillRect(0,0,W,W);bc.globalCompositeOperation='destination-in';bc.drawImage(mask,0,0);
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=animate?.8:.35;ctx.drawImage(beam,0,0);ctx.globalAlpha=1;
  if(animate&&paths.length){
   const count=small.matches?5:7;
   for(let i=0;i<count;i++){
    const clock=t/(engaged?1700:2500)+i*.732,phase=clock%1;
    const path=paths[(Math.floor(clock)+i*7)%paths.length];
    const n=path.length,head=Math.min(n-1,Math.floor(phase*n)),tail=Math.max(0,head-14);
    const cyan=i%3===0,color=cyan?'#8ee9ff':'#d693ff',opacity=Math.min(1,phase*8,(1-phase)*8);
    if(head>0){
     ctx.beginPath();ctx.moveTo(...path[tail]);for(let j=tail+1;j<=head;j++)ctx.lineTo(...path[j]);
     ctx.lineJoin='miter';ctx.lineCap='square';ctx.strokeStyle=cyan?'rgba(85,202,255,.25)':'rgba(172,78,255,.3)';ctx.lineWidth=7;ctx.globalAlpha=opacity;ctx.stroke();
     ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;
    }
    const [px,py]=path[head];star(px,py,3+Math.sin(phase*Math.PI)*2,opacity,color);
    if(phase>.35&&phase<.65){ctx.globalAlpha=.5*opacity;ctx.fillStyle=color;ctx.fillRect(px+5,py-7,2,2);ctx.fillRect(px-8,py+4,2,2);ctx.globalAlpha=1;}
   }
   nodes.forEach(([nx,ny],i)=>{const a=(Math.sin(t*.0015+i*1.9)+1)/2;if(i%4===0&&a>.8)star(nx,ny,4,(a-.8)*3,'#d0a5ff');});
  }
  ctx.globalCompositeOperation='source-over';frames++;if(frames%20===0)canvas.dataset.frames=String(frames);
 }
 function tick(t){
  raf=0;if(!running())return;
  if(!last)last=t;
  const dt=t-last;
  if(dt>=(small.matches?1000/24:1000/30)){elapsed+=Math.min(dt,80);last=t;paint(elapsed,true);}
  raf=requestAnimationFrame(tick);
 }
 function sync(){
  const enabled=running();canvas.dataset.state=enabled?'running':(!allowed()?'paused':'offscreen');
  if(enabled&&!raf){last=0;raf=requestAnimationFrame(tick);}
  if(!enabled){if(raf)cancelAnimationFrame(raf);raf=0;last=0;paint(elapsed,false);}
 }
 image.addEventListener('load',loadMask);if(image.complete&&image.naturalWidth)loadMask();
 fetch('assets/neural-paths.json?v=living-mind-v4').then(r=>{if(!r.ok)throw Error('paths');return r.json();}).then(data=>{
  if(Array.isArray(data.paths)&&data.paths.every(p=>Array.isArray(p)&&p.length>1&&p.every(v=>v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<W)))){paths=data.paths;nodes=data.nodes||[];canvas.dataset.paths=String(paths.length);sync();}
 }).catch(()=>{canvas.dataset.paths='fallback';});
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{inside=es[0].isIntersecting;sync();},{rootMargin:'80px'}).observe(canvas);
 document.addEventListener('holymind:motion',sync);
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
 document.addEventListener('visibilitychange',sync);
 const stage=document.querySelector('.neural-stage');stage?.addEventListener('pointerenter',()=>{engaged=true;});stage?.addEventListener('pointerleave',()=>{engaged=false;});
 addEventListener('pagehide',()=>{dead=true;sync();});addEventListener('pageshow',()=>{dead=false;sync();});
})();
