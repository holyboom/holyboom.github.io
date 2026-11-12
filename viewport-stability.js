/* Keep document scroll geometry stable while mobile browser chrome opens/closes.
 * Actual width/orientation changes and substantial resizes still rebuild layout.
 * No scroll interception, scrollTo or fixed viewport imposed on native input. */
(()=>{
 'use strict';
 const touch=()=>navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches;
 let state={width:innerWidth,height:innerHeight,liveHeight:innerHeight,revision:0,transient:false},ignored=0;
 function measure(){
  const w=innerWidth,h=innerHeight;if(w===state.width&&h===state.liveHeight)return state;
  const entry=document.activeElement?.matches('input,textarea,select,[contenteditable=true]');
  const chromeOnly=touch()&&w<=1100&&w===state.width&&
   (Math.abs(h-state.height)<=Math.max(120,state.height*.22)||entry);
  if(chromeOnly){state={...state,liveHeight:h,transient:h!==state.height};ignored++;}
  else state={width:w,height:h,liveHeight:h,revision:state.revision+1,transient:false};
  return state;
 }
 addEventListener('resize',measure,{passive:true});
 window.HolyMindViewport=Object.freeze({measure,snapshot:()=>({...measure(),ignored})});
})();
