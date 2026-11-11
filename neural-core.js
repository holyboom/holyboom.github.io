/* Spark v8: one clock + one pixel-neon light field shared by hero, handoff and orbit.
 * The source artwork is never recolored. All electricity is a transparent overlay.
 * No WebGL context, library, external service or full-screen strobing is added.
 */
(() => {
 'use strict';
 const canvas=document.getElementById('neural-sparks'),image=document.querySelector('.hero-brain');
 if(!canvas||!image)return;
 const W=480,small=matchMedia('(max-width:680px)'),body=document.body;
 const surface=document.createElement('canvas'),mask=document.createElement('canvas'),beam=document.createElement('canvas');
 for(const c of [surface,mask,beam,canvas])c.width=c.height=W;
 const ctx=surface.getContext('2d'),mc=mask.getContext('2d',{willReadFrequently:true}),bc=beam.getContext('2d');
 if(!ctx||!mc||!bc)return;
 const heroCtx=canvas.getContext('2d');if(!heroCtx)return;
 const orbitImage=document.querySelector('.orbit-brain'),orbit=document.createElement('canvas');
 orbit.className='orbit-sparks';orbit.width=orbit.height=W;orbit.setAttribute('aria-hidden','true');orbitImage?.after(orbit);
 const orbitCtx=orbit.getContext('2d');
 let transit=null,transitCtx=null,paths=[],nodes=[],outline=[],ready=false,heroInside=true,orbitInside=false;
 let transporting=false,raf=0,last=0,elapsed=0,frames=0,dead=false,frameCost=0,engaged=false;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),fract=n=>n-Math.floor(n);
 const calm=()=>body.dataset.motionProfile==='calm';
 const active=()=>ready&&!document.hidden&&!dead&&(heroInside||orbitInside||transporting);
 const colors=['#67e8f9','#c48aff','#f2cc8f','#ff7ac6'];
 const sprites=new Map();
 function sprite(color){
  if(sprites.has(color))return sprites.get(color);
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
  const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,color+'b0');r.addColorStop(.18,color+'60');r.addColorStop(.5,color+'18');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,64,64);sprites.set(color,c);return c;
 }
 function glow(x,y,r,color,alpha){ctx.globalAlpha=alpha;ctx.drawImage(sprite(color),x-r,y-r,r*2,r*2);ctx.globalAlpha=1;}
 function star(x,y,r,a,color){
  x=Math.round(x/2)*2;y=Math.round(y/2)*2;glow(x,y,18+r*2,color,a*.48);
  ctx.globalAlpha=a;ctx.fillStyle=color;ctx.fillRect(x-r,y-1,r*2+2,2);ctx.fillRect(x-1,y-r,2,r*2+2);
  ctx.fillStyle='#f8f2ff';ctx.fillRect(x-1,y-1,3,3);ctx.globalAlpha=1;
 }
 function line(points,color,alpha,width=1.7){
  if(points.length<2)return;
  ctx.beginPath();points.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](Math.round(p[0]/2)*2,Math.round(p[1]/2)*2));
  ctx.lineJoin='miter';ctx.lineCap='square';ctx.strokeStyle=color;ctx.globalAlpha=alpha*.17;ctx.lineWidth=width*4;ctx.stroke();
  ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke();ctx.globalAlpha=1;
 }
 function loadMask(){
  try {
   mc.clearRect(0,0,W,W);mc.drawImage(image,0,0,W,W);
   const px=mc.getImageData(0,0,W,W),d=px.data;
   outline=[];
   for(let i=0;i<96;i++){
    const a=i/96*Math.PI*2;let r=80;
    for(let s=230;s>=50;s-=2){const x=Math.round(240+Math.cos(a)*s),y=Math.round(228+Math.sin(a)*s);if(x<0||x>=W||y<0||y>=W)continue;const k=(y*W+x)*4;
     if(d[k+3]>95&&d[k+2]>65&&d[k]+d[k+1]+d[k+2]>170){r=s;break;}}
    outline.push([240+Math.cos(a)*r,228+Math.sin(a)*r,a]);
   }
   for(let k=0;k<d.length;k+=4){const l=.35*d[k]+.45*d[k+1]+.2*d[k+2];const a=d[k+3]*clamp((l-102)/112);d[k]=255;d[k+1]=255;d[k+2]=255;d[k+3]=a;}
   mc.putImageData(px,0,0);ready=true;sync();
  }catch(_){canvas.dataset.state='fallback';}
 }
 function paint(t){
  const quiet=calm(),speed=quiet?.14:engaged?1.12:1;
  const tick=t*speed,charge=.68+.17*Math.sin(t*.0009);
  ctx.clearRect(0,0,W,W);ctx.globalCompositeOperation='lighter';
  // Broad, low-luminance field stays within the source's bright line mask.
  const x=235+Math.sin(tick*.00052)*100,y=220+Math.cos(tick*.00071)*75;
  bc.clearRect(0,0,W,W);bc.globalCompositeOperation='source-over';
  const g=bc.createRadialGradient(x,y,4,x,y,145);g.addColorStop(0,'rgba(103,232,249,.9)');g.addColorStop(.38,'rgba(178,114,255,.62)');g.addColorStop(1,'rgba(103,232,249,0)');bc.fillStyle=g;bc.fillRect(0,0,W,W);bc.globalCompositeOperation='destination-in';bc.drawImage(mask,0,0);
  ctx.globalAlpha=quiet?.17:.6;ctx.drawImage(beam,0,0);ctx.globalAlpha=1;
  const count=quiet?3:small.matches?12:18;
  for(let i=0;i<count&&paths.length;i++){
   const time=tick/3100+i*.647,phase=fract(time),id=(Math.floor(time)+i*7)%paths.length,path=paths[id],n=path.length;
   const head=Math.min(n-1,Math.floor(phase*n)),tail=Math.max(0,head-(quiet?8:22));
   const alpha=clamp(phase*6)*clamp((1-phase)*6)*(quiet?.28:1),c=i%7===0?colors[2]:i%3===0?colors[1]:colors[0];
   line(path.slice(tail,head+1),c,alpha,quiet?1:1.7);
   const [px,py]=path[head];star(px,py,quiet?2:4,alpha,c);
   if(!quiet){
    // Three sparse pixels peel away from a synapse, keeping the 8-bit edge.
    for(let j=0;j<3;j++){const a=i*2.4+j*2.094,travel=fract(phase*1.25+j*.27),r=6+travel*22;
     const sx=Math.round((px+Math.cos(a)*r)/2)*2,sy=Math.round((py+Math.sin(a)*r)/2)*2;
     ctx.fillStyle=j===2?'#ff7ac6':c;ctx.globalAlpha=(1-travel)*alpha*.7;ctx.fillRect(sx,sy,2,2);}
    ctx.globalAlpha=1;
   }
  }
  if(!quiet&&outline.length){
   // Edge discharges follow a radial contour sampled from the actual brain, not an oval mask.
   for(let i=0;i<6;i++){
    const cycle=tick/4400+i*.159,phase=fract(cycle),idx=(Math.floor(cycle)*11+i*15)%outline.length;
    const [ox,oy,a]=outline[idx],length=14+Math.sin(phase*Math.PI)*24,alpha=Math.sin(phase*Math.PI)**2*.75;
    const arc=[];for(let j=0;j<8;j++){const u=j/7,jitter=Math.sin(j*2.3+tick*.0014+i)*3.5*Math.sin(u*Math.PI);arc.push([ox+Math.cos(a)*length*u+Math.cos(a+Math.PI/2)*jitter,oy+Math.sin(a)*length*u+Math.sin(a+Math.PI/2)*jitter]);}
    line(arc,i%3===0?colors[3]:colors[0],alpha,1.3);const end=arc[arc.length-1];star(end[0],end[1],2.5,alpha,colors[0]);
    const rim=[];for(let j=0;j<6;j++){const v=outline[(idx+j)%outline.length];rim.push([v[0],v[1]]);}line(rim,colors[1],alpha*.6,1.2);
   }
  }
  if(nodes.length&&!quiet)for(let i=0;i<6;i++){
   const [nx,ny]=nodes[(i*5)%nodes.length],wave=(Math.sin(tick*.0011+i*1.8)+1)/2;
   if(wave>.45)star(nx,ny,3.5,(wave-.45)*1.3,i%3===0?colors[2]:colors[0]);
  }
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  // All three displays copy the SAME rendered frame and time. No spark restart at a seam.
  const copy=(c,target)=>{if(!c)return;c.clearRect(0,0,W,W);c.imageSmoothingEnabled=false;c.drawImage(surface,0,0);target.dataset.frames=String(frames);};
  if(heroInside&&!transporting)copy(heroCtx,canvas);
  if(orbitInside&&!transporting&&orbitCtx){orbit.style.transform=orbitImage?.style.transform||'';copy(orbitCtx,orbit);}
  if(transporting){if(!transit){transit=document.querySelector('.neural-transit-sparks');transitCtx=transit?.getContext('2d');}copy(transitCtx,transit);}
  orbit.style.opacity=transporting?'0':'1';
  window.HolyMindEnergy?.brain({x:x/W,y:y/W,charge,hero:heroInside&&!transporting,orbit:orbitInside&&!transporting,quiet});
  frames++;
 }
 function tick(t){
  raf=0;if(!active())return;
  const interval=calm()?1000/12:1000/30;if(!last)last=t-interval;
  const dt=t-last;if(dt>=interval-1){elapsed+=Math.min(dt,90);last=t;const start=performance.now();paint(elapsed);frameCost=frameCost*.9+(performance.now()-start)*.1;}
  raf=requestAnimationFrame(tick);
 }
 function sync(){
  const enabled=active();canvas.dataset.state=enabled?(calm()?'calm':'running'):ready?'offscreen':'loading';
  if(enabled&&!raf){last=0;raf=requestAnimationFrame(tick);}
  if(!enabled&&raf){cancelAnimationFrame(raf);raf=0;last=0;}
 }
 window.HolyMindNeural=Object.freeze({version:'spark-v8',transport(value){if(transporting===value)return;transporting=value;orbit.style.opacity=value?'0':'1';sync();},snapshot:()=>({ready,frames,elapsed,active:active(),running:!!raf,transporting,heroInside,orbitInside,paths:paths.length,branches:calm()?3:small.matches?12:18,contour:outline.length,profile:body.dataset.motionProfile,meanPaintMs:Number(frameCost.toFixed(3)),targets:{hero:canvas.dataset.frames||'0',orbit:orbit.dataset.frames||'0',transit:transit?.dataset.frames||'0'}})});
 image.addEventListener('load',loadMask);if(image.complete&&image.naturalWidth)loadMask();
 fetch('assets/neural-paths.json?v=spark-v8').then(r=>{if(!r.ok)throw Error('paths');return r.json();}).then(data=>{
  if(Array.isArray(data.paths)&&data.paths.every(p=>Array.isArray(p)&&p.length>1&&p.every(v=>v.length===2&&v.every(n=>Number.isFinite(n)&&n>=0&&n<W)))){paths=data.paths;nodes=(data.nodes||[]).filter(v=>v.length===2&&v.every(Number.isFinite));canvas.dataset.paths=String(paths.length);sync();}
 }).catch(()=>{canvas.dataset.paths='fallback';});
 if('IntersectionObserver'in window){const io=new IntersectionObserver(es=>{for(const e of es){if(e.target===canvas)heroInside=e.isIntersecting;else orbitInside=e.isIntersecting;}sync();},{rootMargin:'40px'});io.observe(canvas);io.observe(orbit);}
 document.addEventListener('holymind:motion',sync);document.addEventListener('visibilitychange',sync);
 const stage=document.querySelector('.neural-stage');stage?.addEventListener('pointerenter',()=>{engaged=true;});stage?.addEventListener('pointerleave',()=>{engaged=false;});
 addEventListener('pagehide',()=>{dead=true;sync();});addEventListener('pageshow',()=>{dead=false;sync();});
})();
