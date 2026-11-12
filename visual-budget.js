/* Render-cost budget. Only glow resolution changes at scene boundaries.
 * Never disables motion, changes particle identities or adds an animation loop. */
(()=>{'use strict';let detail='full',pending='full',mean=0,samples=0,heavy=0,light=0,changes=0;
 function observe(ms){if(!Number.isFinite(ms)||ms<0||ms>250)return;mean=samples?mean*.92+ms*.08:ms;samples++;if(mean>6){heavy++;light=0;}else if(mean<2.2){light++;heavy=Math.max(0,heavy-1);}if(heavy>=18)pending='efficient';if(light>=140)pending='full';}
 function boundary(){if(detail===pending)return;detail=pending;changes++;document.body.dataset.visualDetail=detail;}
 window.HolyMindVisualBudget=Object.freeze({observe,boundary,canvasDpr(maximum){return Math.min(maximum,devicePixelRatio||1,detail==='efficient'?1.15:2);},snapshot:()=>({detail,pending,meanPaintMs:mean,samples,changes,changesAtBoundaryOnly:true,particlesRemoved:0,motionDisabled:false})});document.body.dataset.visualDetail=detail;
})();
