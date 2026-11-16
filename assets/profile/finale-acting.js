/* Visible-time acting for the original woven maker. Every action returns to rest.
   The orbit evaluator supplies the real skill positions; no duplicate icons. */
(function(root){'use strict';
 const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const ease=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);},gate=(u,a,b,c,d)=>ease((u-a)/(b-a))*(1-ease((u-c)/(d-c)));
 const add=(a,b)=>a.map((v,i)=>v+b[i]),lerp=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t)),distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const spectrum=['#ff7ba6','#ffac67','#ffe397','#8fe6ba','#80dfff','#b49bff','#ed96ee'];
 const phrase=[{kind:'think-point',duration:10.5},{kind:'pair',duration:15},{kind:'inspect',duration:11},{kind:'trace',duration:12},{kind:'pair',duration:15}],period=phrase.reduce((a,b)=>a+b.duration,0),center=[-.44,.12,.13];
 function beatAt(time){const lap=Math.floor(time/period);let u=time-lap*period,start=lap*period;for(let i=0;i<phrase.length;i++){const p=phrase[i];if(u<p.duration||i===phrase.length-1)return {...p,u,start,index:lap*phrase.length+i,variant:(lap+i)%4};u-=p.duration;start+=p.duration;}}
 function lightAt(p,charge,time=0){const scrollFlash=Math.exp(-(((p-.555)/.036)**2)),pulse=(.5+.5*Math.sin(TAU*time/3.8-.9))**10,after=(.5+.5*Math.sin(TAU*time/3.8-1.65))**4,flare=clamp(scrollFlash*.82+pulse*.72),energy=charge*(.52+flare*.74+after*.13);return {energy,flare:flare*charge,phase:time*.34+p*2.1,gold:charge*(.66+flare*.34),spectrum};}
 function create(skills,position){const plans=new Map();
  function plan(beat){if(plans.has(beat.index))return plans.get(beat.index);
   const at=t=>beat.start+t,score=(s,i,side,t,exclude)=>{const q=position(s,at(t)),anchor=[center[0]+side*.75,.40,.65],sidePenalty=side&&Math.sign(q[0]-center[0])!==side?8:0;return {id:s.id,category:s.category,side:q[0]<center[0]?-1:1,score:(s.id===exclude?100:0)+sidePenalty+Math.max(0,.05-q[2])*7+Math.max(0,q[1]-1.05)*3+Math.max(0,-.42-q[1])*3+distance(q,anchor)*.25+((i+beat.index*7)%skills.length)*.004};};
   const choose=(side,t,exclude,otherCategory)=>skills.map((s,i)=>score(s,i,side,t,exclude)).sort((a,b)=>(a.score+(a.category===otherCategory?3:0))-(b.score+(b.category===otherCategory?3:0)))[0];
   const lead=beat.index%2?-1:1,first=choose(beat.kind==='pair'?-1:lead,beat.kind==='pair'?2.4:4.0),second=choose(beat.kind==='pair'?1:-lead,beat.kind==='pair'?3.5:7.6,first?.id,first?.category),value={first,second};plans.set(beat.index,value);if(plans.size>8)plans.delete(plans.keys().next().value);return value;
  }
  function sample(time,base){const beat=beatAt(time),{u}=beat,selection=plan(beat),a=skills.find(s=>s.id===selection.first?.id),b=skills.find(s=>s.id===selection.second?.id);
   if(!a)return {kind:beat.kind,stage:'rest',targetId:null,secondaryId:null,weight:0,headWeight:0,hands:{},pulls:[],torso:{},synthesis:null};
   const qa=position(a,time),qb=b?position(b,time):qa,side=selection.first.side,lead=side<0?'left':'right',other=side<0?'right':'left',hands={},pulls=[];
   let weight=0,headWeight=0,headTarget=qa,targetId=a.id,secondaryId=null,headRoll=0,torso={yaw:0,pitch:0,roll:0},stage='rest',synthesis=null,trace=null;
   const point=(id,key,amount,reach=.61)=>{hands[key]={targetId:id,point:true,weight:amount,reach,shape:'point',prelude:hands[key]};weight=Math.max(weight,amount);};
   const think=amount=>{const goal=add(base.head,[side*.17,-.235,.18]);hands[lead]={goal,aim:add(base.head,[side*.04,-.12,.12]),weight:amount,shape:'relaxed'};hands[other]={goal:add(base.hip,[-side*.09,.40,.28]),aim:add(base.head,[0,-.34,.20]),weight:amount*.72,shape:'cup'};headRoll=-side*.045*amount;torso={yaw:side*.035*amount,pitch:.045*amount,roll:-side*.025*amount};};
   if(beat.kind==='think-point'){
    const thinking=gate(u,.30,1.35,1.90,2.85),indicate=gate(u,2.15,3.35,5.85,7.15);think(thinking);if(indicate>.0001)point(a.id,lead,indicate,.57+beat.variant*.025);
    headWeight=gate(u,.0,.60,6.5,7.8);headTarget=lerp(add(base.head,[side*.35,.13,.50]),qa,ease((u-1.45)/1.10));torso.yaw+=side*.095*indicate;torso.pitch+=.022*indicate;stage=u<2.2?'think':u<3.35?'prepare':u<5.85?'indicate':u<7.8?'release':'rest';
   }else if(beat.kind==='pair'&&b){
    secondaryId=b.id;const left=gate(u,1.05,2.65,10.7,12.8),right=gate(u,1.80,3.45,11.25,13.5),join=gate(u,4.15,6.65,8.5,10.15),pullL=gate(u,1.70,3.10,10.9,13.0),pullR=gate(u,2.50,3.95,11.45,13.65),breath=.008*Math.sin(time*1.5)*join;
    const outerL=[-.99,.25,.60],outerR=[.17,.34,.68],innerL=[-.62,.20+breath,.64],innerR=[-.26,.24+breath,.70],leftGoal=lerp(outerL,innerL,join),rightGoal=lerp(outerR,innerR,join),leftPoint=add(leftGoal,[.005,.15,.10]),rightPoint=add(rightGoal,[-.005,.15,.10]);
    hands.left={goal:leftGoal,aim:leftPoint,weight:left,shape:'cup',targetId:a.id};hands.right={goal:rightGoal,aim:rightPoint,weight:right,shape:'cup',targetId:b.id};pulls.push({id:a.id,point:leftPoint,weight:pullL},{id:b.id,point:rightPoint,weight:pullR});
    weight=Math.max(left,right);headWeight=gate(u,.25,1.15,12.4,14.2);headTarget=lerp(lerp(lerp(qa,qb,ease((u-2.3)/.9)),lerp(leftPoint,rightPoint,.52),ease((u-3.8)/1.6)),qb,ease((u-11)/1.8));headRoll=.025*Math.sin(u*.8)*weight;torso={yaw:mix(-.055,.055,ease((u-2)/2))*(1-join)*weight,pitch:(.022+.045*join)*weight,roll:.018*Math.sin(u*.6)*weight};
    stage=u<1.05?'consider':u<2.65?'receive-left':u<4.15?'receive-right':u<6.65?'bring-together':u<8.5?'combine':u<10.15?'separate':u<13.65?'return':'rest';synthesis={ids:[a.id,b.id],weight:join*Math.min(pullL,pullR),center:lerp(leftPoint,rightPoint,.5),phase:u,returning:u>8.5};
   }else if(beat.kind==='inspect'){
    const receive=gate(u,.75,2.30,6.65,8.5),pull=gate(u,1.45,2.85,6.7,8.9),examine=gate(u,3.25,4.2,5.8,6.65),goal=[center[0]+side*.40,.35,.68],held=add(goal,[0,.16,.12]);
    hands[lead]={goal,aim:held,weight:receive,shape:'cup',targetId:a.id};point(a.id,other,examine,.43);pulls.push({id:a.id,point:held,weight:pull});weight=Math.max(receive,examine);headWeight=gate(u,.12,.8,8.1,9.3);headTarget=lerp(qa,held,pull);headRoll=-side*.08*receive;torso={yaw:side*.08*receive,pitch:.065*receive,roll:-side*.025*receive};stage=u<.75?'notice':u<2.85?'receive':u<6.65?'examine':u<9?'release':'rest';
   }else{
    const first=gate(u,1.1,2.2,3.6,4.7),second=gate(u,5.45,6.65,8.0,9.2),follow=ease((u-4.0)/1.6),firstSide=selection.first.side,secondSide=selection.second?.side||-firstSide;
    if(first>.0001)point(a.id,firstSide<0?'left':'right',first,.58);if(second>.0001)point(b?.id||a.id,secondSide<0?'left':'right',second,.66);
    targetId=u<5.0?a.id:b?.id||a.id;secondaryId=b?.id||null;headWeight=gate(u,.25,.95,8.7,10.1);headTarget=lerp(qa,qb,follow);headRoll=.035*Math.sin(u*.65)*headWeight;torso={yaw:mix(firstSide*.07,secondSide*.10,follow)*Math.max(first,second),pitch:.018*headWeight,roll:0};trace={ids:[a.id,b?.id||a.id],weight:gate(u,2.2,3.0,8.0,9.1),progress:follow};stage=u<1.1?'notice':u<4.0?'indicate-first':u<5.45?'follow':u<9.2?'indicate-second':'rest';
   }
   // A small upper-body breath is tied to the same finite phrase, with planted feet.
   if(stage!=='rest')torso.pitch+=(.006*Math.sin(time*1.4))*(headWeight||weight);
   return {kind:beat.kind,stage,beat:beat.index,u,targetId,secondaryId,weight,headWeight,headTarget,headRoll,hands,pulls,torso,synthesis,trace,lead};
  }
  return {sample};
 }
 const api={create,beatAt,lightAt,spectrum,phrase,period};if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileFinaleActing=api;
})(typeof globalThis!=='undefined'?globalThis:this);
