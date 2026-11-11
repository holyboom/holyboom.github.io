/* Showcase v5. Decorative scroll scenes, bounded pointer input, real native controls. */
(() => {
 'use strict';
 const {gsap, ScrollTrigger} = window;
 const body = document.body;
 const allowed = () => body.dataset.motion === 'on' && body.dataset.motionProfile !== 'calm';
 const small = () => innerWidth <= 680;
 const exhibit = document.querySelector('.assembly-exhibit');
 const slider = document.getElementById('assembly-control');
 const shards = [...document.querySelectorAll('.deck-shard')];
 const opener = document.getElementById('instrument-open');
 if(slider)slider.disabled=false;
 [...shards,document.getElementById('previous-skill'),document.getElementById('next-skill')].filter(Boolean).forEach(el=>el.disabled=false);
 let context = null, width = innerWidth, resizeTimer = 0, selected = 2;
 const scroll = (trigger, start = 'top bottom', end = 'bottom top') => ({trigger, start, end, scrub:.65, invalidateOnRefresh:true});
 // Static equivalents remain available with JS/motion disabled.
 function assemble(value) {
  const amount = Math.min(100, Math.max(0, Number(value) || 0));
  exhibit?.style.setProperty('--separation', String(amount / 100));
  slider?.setAttribute('aria-valuetext', `${amount} percent expanded`);
  if(exhibit){exhibit.dataset.assembled=String(100-amount);exhibit.dataset.expanded=String(amount);}
  document.dispatchEvent(new CustomEvent('holymind:assembly',{detail:{expanded:amount}}));
 }
 slider?.addEventListener('input', () => assemble(slider.value));
 assemble(slider?.value || 35);
 function select(index, focus = false) {
  selected = (index + shards.length) % shards.length;
  shards.forEach((el,i) => el.setAttribute('aria-pressed', String(i === selected)));
  const item = shards[selected]; if(!item)return;
  document.getElementById('instrument-title').textContent = item.dataset.title;
  document.getElementById('instrument-purpose').textContent = item.dataset.purpose;
  if(opener)opener.dataset.skill = item.dataset.skill;
  const position=document.getElementById('instrument-position');if(position)position.textContent=`${selected+1} / ${shards.length}`;
  if(focus)item.focus({preventScroll:true});
 }
 shards.forEach((el,i) => {
  el.addEventListener('click', () => select(i));
  el.addEventListener('keydown', event => {
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   select(event.key === 'Home' ? 0 : event.key === 'End' ? shards.length - 1 : i + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
 });
 document.getElementById('previous-skill')?.addEventListener('click',()=>select(selected-1));
 document.getElementById('next-skill')?.addEventListener('click',()=>select(selected+1));
 select(2);
 opener?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('holymind:open-skill', {detail:{id:shards[selected]?.dataset.skill,opener}})));
 const services = [...document.querySelectorAll('.approach-list details')];
 document.querySelector('.about-story')?.addEventListener('toggle',()=>ScrollTrigger?.refresh());
 services.forEach(el => el.addEventListener('toggle', () => {if(ScrollTrigger)ScrollTrigger.refresh();}));
 // Interaction with the actual workbench changes the symbol on the top plane.
 document.addEventListener('holymind:step', event => {
  const id = event.detail?.skill;
  if(typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id))return;
  const art = document.getElementById('assembly-skill');
  if(art)art.src = `assets/skills/${id}.webp`;
 });
 function build() {
  if(context)context.revert(); context = null;
  body.dataset.showcaseEngine = !allowed() ? 'paused' : gsap && ScrollTrigger ? 'ready' : 'static';
  if(!allowed() || !gsap || !ScrollTrigger)return;
  context = gsap.context(() => {
   gsap.fromTo('.band-one .signal-word',{xPercent:-13},{xPercent:13,ease:'none',scrollTrigger:scroll('.signal-crossing')});
   gsap.fromTo('.band-two .signal-word',{xPercent:16},{xPercent:-16,ease:'none',scrollTrigger:scroll('.signal-crossing')});
   gsap.fromTo('.signal-intersection',{rotation:32,scaleY:.5},{rotation:-25,scaleY:1.3,ease:'none',scrollTrigger:scroll('.signal-crossing')});
   gsap.fromTo('.assembly-rotor',{rotationY:small()?-6:-16,rotationZ:-12,y:20},{rotationY:small()?9:20,rotationZ:12,y:-18,ease:'none',scrollTrigger:scroll('.assembly-exhibit')});
   gsap.fromTo('.assembly-shadow',{scaleX:.8,opacity:.4},{scaleX:1.15,opacity:.9,ease:'none',scrollTrigger:scroll('.assembly-exhibit')});
   gsap.fromTo('.deck-fan',{'--spread':small()?.82:.65,rotationX:12,rotationY:-10},{'--spread':1,rotationX:0,rotationY:10,ease:'none',scrollTrigger:scroll('.skill-instrument','top 90%','bottom 25%')});
   services.forEach((el,i) => {
    gsap.fromTo(el,{rotationY:small()?0:(i%2?-9:9),x:small()?(i%2?12:-12):(i%2?34:-34)},{rotationY:0,x:0,ease:'none',scrollTrigger:scroll(el,'top 95%','top 35%')});
    gsap.fromTo(el.querySelector('.service-art img'),{rotation:-18,y:12},{rotation:18,y:-12,ease:'none',scrollTrigger:scroll(el)});
    gsap.fromTo(el.querySelector('.service-outline'),{rotation:0},{rotation:90,ease:'none',scrollTrigger:scroll(el)});
   });
   gsap.fromTo('.signature-depth',{rotationY:-28,rotationX:12},{rotationY:18,rotationX:-6,ease:'none',scrollTrigger:scroll('.about')});
   gsap.utils.toArray('.signature-echoes>span').forEach((el,i) => {
    gsap.fromTo(el,{x:(i+1)*20,y:-(i+1)*22,z:-(i+1)*35},{x:(i+1)*5,y:-(i+1)*5,z:-(i+1)*12,ease:'none',scrollTrigger:scroll('.about','top bottom','bottom 30%')});
   });
   gsap.utils.toArray('.portal-frame').forEach((el,i) => {
    const size = 1-i*.12;
    gsap.fromTo(el,{attr:{transform:`translate(240 240) rotate(${i*9}) scale(${size*.65}) translate(-240 -240)`},opacity:.4},{attr:{transform:`translate(240 240) rotate(${-i*7}) scale(${size}) translate(-240 -240)`},opacity:1,ease:'none',scrollTrigger:scroll('.connect','top 95%','bottom bottom')});
   });
   gsap.fromTo('.portal-depth>img',{rotation:-35,scale:.75},{rotation:0,scale:1.08,ease:'none',scrollTrigger:scroll('.connect','top bottom','bottom bottom')});
  });
  ScrollTrigger.refresh();
 }
 // Pointer tilt is an enhancement of the portal only; touch never competes with page scrolling.
 const portal = document.querySelector('.contact-portal');
 const depth = document.querySelector('.portal-depth');
 const fine = matchMedia('(hover: hover) and (pointer: fine)');
 let pointerFrame = 0, pointerX = 0, pointerY = 0;
 function clearTilt(){if(pointerFrame)cancelAnimationFrame(pointerFrame);pointerFrame=0;if(depth)depth.style.transform='';}
 portal?.addEventListener('pointermove', event => {
  if(!allowed() || !fine.matches || !depth)return;
  const rect = portal.getBoundingClientRect();
  pointerX = (event.clientX-rect.left)/rect.width-.5;
  pointerY = (event.clientY-rect.top)/rect.height-.5;
  if(pointerFrame)return;
  pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;depth.style.transform=`rotateX(${-pointerY*14}deg) rotateY(${pointerX*18}deg)`;});
 });
 portal?.addEventListener('pointerleave',clearTilt);
 document.addEventListener('holymind:motion',()=>{clearTilt();build();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTilt();});
 addEventListener('resize',()=>{if(width===innerWidth)return;width=innerWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(build,210);},{passive:true});
 addEventListener('pageshow',()=>{ScrollTrigger?.refresh();});
 if(document.fonts)document.fonts.ready.then(()=>ScrollTrigger?.refresh());
 build();
})();
