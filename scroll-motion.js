/* HolyMind motion: progressive enhancement, content never hidden. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const hero=document.querySelector('.neural-core');
 const sections=[...document.querySelectorAll('main>section:not(.hero)')];
 const headings=[...document.querySelectorAll('.section-head h2,.framework-head h2,.approach-intro h2,.about-name h2,.connect h2')];
 const art=[...document.querySelectorAll('.principles img,.challenge-picker img,.step-detail img,.skill-card img,.approach-intro img,.connect-action>img')];
 sections.forEach((s,i)=>{s.classList.add('motion-section');s.style.setProperty('--motion-index',i);});
 headings.forEach(h=>h.classList.add('motion-heading'));
 art.forEach((a,i)=>{a.classList.add('motion-art');a.style.setProperty('--motion-seed',i%5);});
 const io=new IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('in-view');io.unobserve(entry.target);}}
 },{threshold:.12,rootMargin:'0px 0px -5% 0px'});
 [...sections,...headings,...art].forEach(el=>io.observe(el));
 let raf=0;
 function update(){raf=0;if(reduced.matches||document.body.dataset.motion==='off'){document.documentElement.style.setProperty('--scroll-rotation','0deg');return;}
  if(hero){const r=hero.getBoundingClientRect();const progress=Math.max(-1,Math.min(1,(innerHeight*.6-r.top)/innerHeight));hero.style.setProperty('--brain-tilt',`${progress*9}deg`);hero.style.setProperty('--brain-shift',`${progress*-18}px`);}
  const viewport=innerHeight;
  for(const el of art){const r=el.getBoundingClientRect();if(r.bottom<0||r.top>viewport)continue;
   const progress=Math.max(-1,Math.min(1,(viewport*.55-(r.top+r.height/2))/viewport));
   el.style.setProperty('--art-turn',`${progress*(el.closest('.skill-card')?11:19)}deg`);
   el.style.setProperty('--art-shift',`${progress*-12}px`);
  }
 }
 function queue(){if(!raf)raf=requestAnimationFrame(update);}
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
 queue();
})();
