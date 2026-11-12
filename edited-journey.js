/* Short main journey, opt-in depth. No audio policy, motion toggle or scroll hijack. */
(()=>{
 'use strict';
 const library=document.getElementById('skill-library'),notes=document.getElementById('workbench-notes');if(!library)return;
 let refreshFrame=0,refreshes=0;
 const refresh=()=>{if(refreshFrame)return;refreshFrame=requestAnimationFrame(()=>{refreshFrame=0;window.ScrollTrigger?.refresh();refreshes++;});};
 library.addEventListener('toggle',refresh);notes?.addEventListener('toggle',refresh);
 document.getElementById('close-skill-library')?.addEventListener('click',()=>{
  window.HolyMindScrollSound?.suppressForNavigation();library.open=false;
  const summary=library.querySelector(':scope>summary');summary.focus({preventScroll:true});summary.scrollIntoView({behavior:'instant',block:'center'});refresh();
 });
 // Older section links/externally supplied hashes still reach the optional content.
 function exposeHash(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return;}
  const el=id&&document.getElementById(id);if(!el)return;
  for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
 }
 addEventListener('hashchange',exposeHash);exposeHash();
 document.querySelectorAll('[data-explore-category]').forEach(a=>a.addEventListener('click',()=>{library.open=true;refresh();}));
 window.HolyMindEdit=Object.freeze({version:'edited-journey-v27',snapshot:()=>({libraryOpen:library.open,notesOpen:!!notes?.open,refreshes,story:'hero → orbit → assembly → question → skills → practice → Boom → contact',removedCapabilities:0})});
})();
