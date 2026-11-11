/* Lightweight, image-aligned pixel sparks. No third-party runtime or external requests. */
(()=>{
 const canvas=document.getElementById('neural-sparks');
 const image=document.querySelector('.neural-core .hero-brain');
 if(!canvas||!image)return;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=window.matchMedia('(max-width: 680px)');
 let points=[],frame=0,visible=true,last=0;
 const rng=(i)=>{let n=Math.sin(i*127.1+39.7)*43758.5453;return n-Math.floor(n)};
 function sample(){
  const off=document.createElement('canvas');off.width=off.height=160;
  const c=off.getContext('2d',{willReadFrequently:true});
  c.drawImage(image,0,0,160,160);
  const pix=c.getImageData(0,0,160,160).data;
  points=[];
  // Sample only existing violet luminous pixels, never draw a replacement brain.
  for(let y=18;y<142;y+=3)for(let x=18;x<142;x+=3){
   const k=(y*160+x)*4,r=pix[k],g=pix[k+1],b=pix[k+2],a=pix[k+3];
   if(a>115&&r>60&&b>r*.85&&b>g*1.12&&rng(x*157+y)>0.46)points.push([x,y]);
  }
 }
 function size(){canvas.width=canvas.height=320;ctx.imageSmoothingEnabled=false;}
 function allowed(){return document.body.dataset.motion!=='off'&&!motion.matches&&visible;}
 function draw(t){
  frame=requestAnimationFrame(draw);
  if(t-last<(mobile.matches?65:40))return;last=t;
  ctx.clearRect(0,0,320,320);
  if(!allowed()||!points.length)return;
  const count=mobile.matches?9:17;
  for(let i=0;i<count;i++){
   const idx=Math.floor((t*.007*(1+(i%3)*.12)+i*89)%points.length);
   const p=points[idx],x=p[0]*2,y=p[1]*2;
   const phase=(t*.002+i*2.31),strength=.48+.45*Math.sin(phase)**2;
   ctx.fillStyle=i%4===0?`rgba(114,228,255,${strength})`:`rgba(221,139,255,${strength})`;
   ctx.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,2+(i%5===0?2:0),2);
   if(i%4===0){
    ctx.fillStyle=`rgba(184,105,255,${strength*.33})`;
    ctx.fillRect(x-6,y,14,2);ctx.fillRect(x,y-6,2,14);
   }
  }
 }
 size();
 if(image.complete&&image.naturalWidth)sample();else image.addEventListener('load',sample,{once:true});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible)ctx.clearRect(0,0,320,320)});
 frame=requestAnimationFrame(draw);
 window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
