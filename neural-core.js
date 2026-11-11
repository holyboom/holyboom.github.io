/* HolyMind pixel-neon energy v2. Pixelated strokes preserve original artwork. */
(()=>{
 const canvas=document.getElementById('neural-sparks');
 const image=document.querySelector('.neural-core .hero-brain');
 if(!canvas||!image)return;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=window.matchMedia('(max-width: 680px)');
 let nodes=[],paths=[],frame=0,visible=true,last=0;
 const random=(i)=>{const n=Math.sin(i*127.1+39.7)*43758.5453;return n-Math.floor(n)};
 function sample(){
  const off=document.createElement('canvas');off.width=off.height=160;
  const c=off.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0,160,160);
  const px=c.getImageData(0,0,160,160).data;nodes=[];
  for(let y=14;y<146;y+=2)for(let x=14;x<146;x+=2){
   const k=(y*160+x)*4,r=px[k],g=px[k+1],b=px[k+2],a=px[k+3];
   if(a>115&&r>55&&b>r*.85&&b>g*1.1&&random(x*157+y)>.25)nodes.push([x*2,y*2]);
  }
  // Nearest-neighbor links create visible angular electricity on the existing bright pixel network.
  paths=[];
  for(let i=0;i<nodes.length;i+=11){
   const a=nodes[i];let best=null,dist=950;
   for(let j=0;j<nodes.length;j+=3){const b=nodes[j],d=(a[0]-b[0])**2+(a[1]-b[1])**2;
    if(d>32&&d<dist){best=b;dist=d;}}
   if(best)paths.push([a,best]);
  }
 }
 canvas.width=canvas.height=320;ctx.imageSmoothingEnabled=false;
 function active(){return document.body.dataset.motion!=='off'&&!reduced.matches&&visible;}
 function render(t){
  frame=requestAnimationFrame(render);if(t-last<(mobile.matches?65:40))return;last=t;
  ctx.clearRect(0,0,320,320);if(!active()||!nodes.length)return;
  const count=mobile.matches?13:25;
  ctx.globalCompositeOperation='lighter';
  // Discrete electric strokes, deliberately right-angled rather than smooth lightning.
  for(let i=0;i<count;i++){
   const path=paths[Math.floor((t*.003+i*17)%paths.length)];if(!path)continue;
   const [a,b]=path,phase=(t*.003+i*2.2),alpha=.48+.5*Math.abs(Math.sin(phase));
   const x=Math.round((a[0]+b[0])/4)*2,y=Math.round((a[1]+b[1])/4)*2;
   ctx.strokeStyle=i%4===0?`rgba(97,229,255,${alpha})`:`rgba(201,103,255,${alpha})`;
   ctx.lineWidth=i%5===0?3:2;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(x,a[1]);ctx.lineTo(x,b[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
   ctx.fillStyle=`rgba(244,210,255,${alpha})`;ctx.fillRect(a[0]-2,a[1]-2,5,5);
   if(i%3===0){ctx.fillStyle=`rgba(158,69,255,${alpha*.24})`;ctx.fillRect(a[0]-8,a[1]-8,17,17);}
  }
  ctx.globalCompositeOperation='source-over';
 }
 if(image.complete&&image.naturalWidth)sample();else image.addEventListener('load',sample,{once:true});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(!visible)ctx.clearRect(0,0,320,320)});
 frame=requestAnimationFrame(render);
 window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
