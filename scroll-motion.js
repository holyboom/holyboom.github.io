/* Living Mind v4: self-hosted GSAP, native scrolling, source artwork and zero hidden content. */
(() => {
 'use strict';
 const {gsap,ScrollTrigger}=window;
 if(!gsap||!ScrollTrigger){document.body.dataset.scrollEngine='static';return;}
 gsap.registerPlugin(ScrollTrigger);ScrollTrigger.config({ignoreMobileResize:true});
 const grid=document.getElementById('skills-grid'),scene=document.getElementById('mind-flow');
 const chapters=[...document.querySelectorAll('.flow-chapter')];
 let sceneContext=null,galleryContext=null,scheduled=0,resizeTimer=0,width=innerWidth;
 const allowed=()=>document.body.dataset.motion==='on';
 const small=()=>innerWidth<=680;
 const scroll=(trigger,start='top 92%',end='top 40%')=>({trigger,start,end,scrub:.55,invalidateOnRefresh:true});
 function phase(name){scene.dataset.phase=name;chapters.forEach(el=>el.classList.toggle('is-current',el.dataset.phase===name));}
 function gallery(){
  if(galleryContext)galleryContext.revert();galleryContext=null;
  if(!allowed()||!grid)return;
  galleryContext=gsap.context(()=>{
   [...grid.children].forEach((el,i)=>{
    el.dataset.motionReady='true';
    gsap.fromTo(el,{y:small()?32:60,rotation:(i%2?1:-1)*(small()?2.5:4)},{y:0,rotation:0,ease:'none',scrollTrigger:scroll(el,'top 98%',small()?'top 66%':'top 52%')});
    const art=el.querySelector('img');
    if(art)gsap.fromTo(art,{rotation:-12},{rotation:12,ease:'none',scrollTrigger:scroll(el,'top bottom','bottom top')});
   });
  },grid);
 }
 function build(){
  if(sceneContext)sceneContext.revert();sceneContext=null;
  if(galleryContext)galleryContext.revert();galleryContext=null;
  document.body.dataset.scrollEngine=allowed()?'gsap-3.15.1':'paused';
  if(!allowed()){phase('reason');return;}
  sceneContext=gsap.context(()=>{
   gsap.fromTo('.neural-stage',{rotation:-3,y:0},{rotation:9,y:-45,ease:'none',scrollTrigger:scroll('.hero','top top','bottom top')});
   const journey=scroll(scene,'top 65%','bottom 75%');
   gsap.fromTo('.orbit-track',{rotation:-25},{rotation:125,ease:'none',scrollTrigger:journey});
   gsap.fromTo('.orbit-item img',{rotation:25},{rotation:-125,ease:'none',scrollTrigger:{...journey}});
   gsap.fromTo('.orbit-outer',{rotation:0,svgOrigin:'260 260'},{rotation:175,svgOrigin:'260 260',ease:'none',scrollTrigger:{...journey}});
   gsap.fromTo('.orbit-inner',{rotation:0,svgOrigin:'260 260'},{rotation:-115,svgOrigin:'260 260',ease:'none',scrollTrigger:{...journey}});
   gsap.fromTo('.orbit-brain',{scale:.9,rotation:-5},{scale:1.08,rotation:6,ease:'none',scrollTrigger:{...journey}});
   chapters.forEach((el,i)=>{
    gsap.fromTo(el.querySelector('.chapter-content'),{y:small()?30:54,rotation:(i%2?-1:1)*(small()?2:3.5)},{y:0,rotation:0,ease:'none',scrollTrigger:scroll(el,'top 95%',small()?'top 58%':'top 46%')});
    gsap.fromTo(el.querySelector('img'),{rotation:-18},{rotation:22,ease:'none',scrollTrigger:scroll(el,'top bottom','bottom 25%')});
    ScrollTrigger.create({trigger:el,start:'top 60%',end:'bottom 60%',onEnter:()=>phase(el.dataset.phase),onEnterBack:()=>phase(el.dataset.phase)});
   });
   gsap.fromTo('.strategy-panel',{y:small()?32:65,rotation:small()?1.2:2.2},{y:0,rotation:0,ease:'none',scrollTrigger:scroll('.bench-layout','top 90%','top 38%')});
  });
  gallery();ScrollTrigger.refresh();
 }
 function queueGallery(){if(scheduled)cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(()=>{scheduled=0;gallery();ScrollTrigger.refresh();});}
 if(grid)new MutationObserver(queueGallery).observe(grid,{childList:true});
 document.addEventListener('holymind:motion',build);
 document.querySelectorAll('[data-explore-category]').forEach(link=>link.addEventListener('click',()=>document.querySelector('[data-filter="'+link.dataset.exploreCategory+'"]')?.click()));
 addEventListener('resize',()=>{if(width===innerWidth)return;width=innerWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(build,160);},{passive:true});
 document.addEventListener('load',e=>{if(e.target.tagName==='IMG')ScrollTrigger.refresh();},true);
 document.fonts?.ready.then(()=>ScrollTrigger.refresh());
 addEventListener('pageshow',()=>ScrollTrigger.refresh());
 phase('reason');build();
})();
