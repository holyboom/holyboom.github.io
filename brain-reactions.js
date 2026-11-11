/* HolyMind Resonance: fourteen authored visual metaphors, not clinical interventions.
 * Shares the existing pixel canvas/clock. No new frame loop, assets or input capture. */
(()=>{
 'use strict';
 const raw=[
 ['neural-discharge','Neural Discharge','Activation','explore','workflow-executor',1.15],
 ['crystallizer-bloom','Crystallizer Bloom','Clarify the thought','structure','the-crystallizer',1],
 ['insight-pulse','Insight Pulse','A new connection','explore','enhancement-engine',1.1],
 ['constraint-break','Constraint Break','Release a constraint','structure','constraint-discovery-loop',1],
 ['verification-spark','Verification Spark','Check the evidence','confirm','chain-of-verification',1],
 ['reasoning-arc','Reasoning Arc','Connect the steps','structure','dynamic-skill-sequencer',1],
 ['cognitive-reframe','Cognitive Reframe','Change perspective','explore','angle-agents',1.1],
 ['pattern-reset','Pattern Reset','Interrupt a loop','confirm','evaluator-optimizer',.9],
 ['signal-fork','Signal Fork','Explore alternatives','explore','subagent-fanout',1.05],
 ['goal-lock','Goal Lock','Align with the goal','confirm','goal-driven-execution',1],
 ['debate-synthesis','Debate Synthesis','Find common ground','confirm','dual-agent-debate',1],
 ['evidence-manifest','Evidence Manifest','Make the result inspectable','structure','evidence-manifest-builder',1],
 ['holy-prime','HolyMind Prime','One deliberate mind','signature','the-crystallizer',.14],
 ['triad-resonance','Triad Resonance','Reason · build · verify','signature','skill-triad-techniques',.14]
 ];
 const styles=raw.map((r,i)=>Object.freeze({id:r[0],name:r[1],meaning:r[2],group:r[3],glyph:r[4],weight:r[5],index:i,duration:1200,rare:i>=12}));
 const byId=Object.fromEntries(styles.map(s=>[s.id,s]));let bag=[],recent=[],sinceRare=7,history=[];
 function random(){if(globalThis.crypto?.getRandomValues){const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0]/4294967296;}return Math.random();}
 function pick(target='hero'){
  if(!bag.length)bag=styles.filter(s=>!s.rare).map(s=>s.id);
  const rare=sinceRare>=7&&random()<.12;
  let candidates=(rare?styles.filter(s=>s.rare):bag.map(id=>byId[id])).filter(s=>!recent.includes(s.id));
  if(!candidates.length)candidates=styles.filter(s=>!s.rare&&!recent.includes(s.id));
  const weights=candidates.map(s=>s.weight*(target==='orbit'&&s.group==='confirm'?1.35:target==='hero'&&s.group==='explore'?1.2:1));
  let value=random()*weights.reduce((a,b)=>a+b,0),selected=candidates.at(-1);
  for(let i=0;i<candidates.length;i++){value-=weights[i];if(value<=0){selected=candidates[i];break;}}
  bag=bag.filter(id=>id!==selected.id);recent=[...recent.slice(-2),selected.id];sinceRare=selected.rare?0:sinceRare+1;
  history.push(selected.id);if(history.length>60)history.shift();return selected;
 }
 const C=['#67e8f9','#c48aff','#f2cc8f','#ff7ac6'],clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t;
 function draw(g,b,u,alpha){
  const s=byId[b.styleId]||styles[0],{ctx,line,star,glow,paths}=g;
  const e=1-(1-u)**3,fade=alpha,mid=Math.sin(Math.PI*u),seed=b.seed*.618;
  const cx=b.x,cy=b.y;const P=(x,y)=>[clamp(cx+x,7,473),clamp(cy+y,7,473)];
  const L=(points,color=C[0],a=1,w=1.5)=>line(points.map(p=>P(p[0]*1.1,p[1]*1.1)),color,Math.min(1,fade*a*1.35),w*1.6);
  const S=(x,y,r=3,color=C[0],a=1)=>{const p=P(x*1.1,y*1.1);star(...p,r*1.15,Math.min(1,fade*a*1.15),color);};
  const diamond=(x,y,r,c=C[0],a=1)=>L([[x,y-r],[x+r,y],[x,y+r],[x-r,y],[x,y-r]],c,a,1.4);
  const ring=(r,sides=8,rot=0,sy=.76,c=C[0],a=1)=>L(Array.from({length:sides+1},(_,i)=>{const q=rot+i*2*Math.PI/sides;return [Math.cos(q)*r,Math.sin(q)*r*sy];}),c,a);
  const glyph=(id,x,y,size,rotation,a=1)=>{const im=g.glyph?.(id);if(!im?.complete||!im.naturalWidth)return;ctx.save();const p=P(x*1.1,y*1.1);ctx.translate(...p);ctx.rotate(rotation);ctx.globalAlpha=fade*a;ctx.drawImage(im,-size/2,-size/2,size,size);ctx.restore();};
  S(0,0,3+(1-u)*3,C[0],.7);
  switch(s.index){
   case 0: // Directed neural branch, with forks rather than circular confetti.
    for(let j=0;j<9;j++){const q=j*2.399+seed,r=30+e*(70+j%3*26),pts=[[0,0]];
     for(let k=1;k<7;k++){const f=k/6,wiggle=Math.sin(k*2.7+j)*10*(1-f);pts.push([Math.cos(q)*r*f+Math.sin(q)*wiggle,Math.sin(q)*r*f*.8-Math.cos(q)*wiggle]);}
     L(pts,j%3?C[0]:C[1],.85,1.7);const end=pts.at(-1);S(...end,2.8);L([pts[3],[end[0]*.7+18,end[1]*.7-13]],C[1],.5);
    }break;
   case 1: // The crystallizer unfurls six facets and gently recollects.
    for(let j=0;j<6;j++){const q=j*Math.PI/3+u*.5,r=30+Math.sin(u*Math.PI)*105,x=Math.cos(q)*r,y=Math.sin(q)*r*.7;
     diamond(x,y,8+mid*12,j%2?C[1]:C[0]);L([[0,0],[x,y]],C[1],.4);glyph('the-crystallizer',x,y,34+mid*12,q*.3,.85);}
    ring(18+e*55,6,u*.35,1,C[2],.6);break;
   case 2: // Successive insight fronts, not the same-time explosion.
    for(let j=0;j<3;j++){const p=clamp((u-j*.12)/.64);if(p>0&&p<1){ring(18+p*140,8,j*.12, .75,j===2?C[2]:C[0],(1-p)*1.1);for(let k=0;k<4;k++){const q=k*Math.PI/2+j*.1;S(Math.cos(q)*(18+p*140),Math.sin(q)*(18+p*140)*.75,3);}}}
    glyph('enhancement-engine',0,0,45+mid*28,0,.9);break;
   case 3: // Four constraint brackets split, break and leave an open center.
    for(let j=0;j<4;j++){const q=j*Math.PI/2,dx=Math.cos(q)*(32+e*85),dy=Math.sin(q)*(32+e*85),r=28*(1-u*.6);
     ctx.save();const pts=[[-r,-r],[-r,0],[-r,r],[0,r]];L(pts.map(p=>[dx+p[0]*Math.cos(q)-p[1]*Math.sin(q),dy+p[0]*Math.sin(q)+p[1]*Math.cos(q)]),C[1],.9);
     for(let k=0;k<3;k++)diamond(dx+k*9*Math.cos(q+.5),dy+k*9*Math.sin(q+.5),3,C[0],.8);ctx.restore();}
    ring(15+e*38,4,Math.PI/4,1,C[2],.7);break;
   case 4: // Each evidence node is checked in order.
    for(let j=0;j<5;j++){const q=j*Math.PI*.4-Math.PI/2,x=Math.cos(q)*105,y=Math.sin(q)*82,p=clamp((u-j*.055)/.35);
     L([[0,0],[x*.55,0],[x,y]],C[0],.4+p*.4);diamond(x,y,13,C[2],p);if(p>.4)L([[x-6,y],[x-1,y+5],[x+8,y-6]],C[2],p,2);}
    glyph('chain-of-verification',0,0,60,0,.9);break;
   case 5: { // An ordered chain running between discrete thought-nodes.
    const pts=Array.from({length:8},(_,j)=>[-135+j*38,Math.sin(j*.85-1)*65]);const head=clamp(u*1.5)*7;
    const n=Math.floor(head);if(n>0)L(pts.slice(0,n+1),C[0],.9,2);
    pts.forEach((p,j)=>{if(j<=head){diamond(...p,6,j===n?C[2]:C[1],.9);S(...p,2,C[0],.7);}});
    break;}
   case 6: // A tilted frame reforms into a new perspective.
    for(let j=0;j<2;j++){const q=(1-e)*.78+j*Math.PI/4,r=38+mid*65,pts=Array.from({length:5},(_,k)=>{const a=q+k*Math.PI/2;return [Math.cos(a)*r*(j?1:.65),Math.sin(a)*r];});L(pts,j?C[0]:C[1],j?.95:.5);}
    for(let j=0;j<4;j++){const q=j*Math.PI/2+u;diamond(Math.cos(q)*120*mid,Math.sin(q)*85*mid,5,C[2],.7);}break;
   case 7: { // A loop breaks at one point, then a clean path exits.
    const pts=[];for(let j=0;j<24;j++){const q=j/24*2*Math.PI+u*2.2,r=70+12*Math.sin(q*3);if(j<20)pts.push([Math.cos(q)*r,Math.sin(q)*r*.8]);}
    L(pts,C[1],.85,2);const end=pts.at(-1);L([end,[end[0]+e*80,end[1]-e*35]],C[0],.9);diamond(end[0]+e*80,end[1]-e*35,7,C[2]);break;}
   case 8: // Three genuine tree branches and child choices.
    for(let j=0;j<3;j++){const x=(j-1)*104,y=-74,p=clamp((u-j*.05)*2.2);L([[0,55],[0,10],[x*p,y*p]],C[0],.8,2);diamond(x*p,y*p,11,C[j===1?2:1]);for(let k of [-1,1]){L([[x*p,y*p],[x*p+k*26*p,y*p-31*p]],C[1],.7);S(x*p+k*26*p,y*p-31*p,2,C[0]);}}break;
   case 9: // Converge, then lock onto a defined goal.
    for(let j=0;j<12;j++){const q=j*Math.PI/6+seed,r=20+(1-e)*155;diamond(Math.cos(q)*r,Math.sin(q)*r*.75,3+u*2,C[j%3?0:2]);}
    ring(28+e*14,4,Math.PI/4,1,C[2]);L([[-60,0],[-42,0]],C[0],.8);L([[42,0],[60,0]],C[0],.8);L([[0,-60],[0,-42]],C[0],.8);glyph('goal-driven-execution',0,0,40,0,.7);break;
   case 10: // Two viewpoints meet and become one new crystal.
    for(let side of [-1,1]){const x=side*125*(1-e),y=Math.sin(u*Math.PI*2)*side*16;diamond(x,y,28*(1-u*.5),side<0?C[1]:C[0]);for(let j=0;j<7;j++){const q=j*2.4+side;S(x+Math.cos(q)*(20+mid*24),y+Math.sin(q)*(20+mid*24),2,side<0?C[1]:C[0],.7);}}
    ring(15+e*36,6,-u*.4,1,C[2],e);break;
   case 11: // An inspectable ledger appears line by line.
    for(let j=0;j<3;j++){const x=-56+j*25,y=-70+j*24,p=clamp((u-j*.08)*2.5);L([[x,y+110],[x,y],[x+74,y],[x+90,y+16],[x+90,y+110],[x,y+110]],j===2?C[2]:C[1],p*.75);for(let k=0;k<4;k++)L([[x+12,y+25+k*17],[x+12+p*48,y+25+k*17]],C[0],p*.8);}
    break;
   case 12: // Rare: HolyMind's own crystallizer surrounds one connected core.
    for(let j=0;j<12;j++){const q=j*Math.PI/6+u*.28,r=48+mid*100;glyph('the-crystallizer',Math.cos(q)*r,Math.sin(q)*r*.7,24+mid*12,q,.9);if(j%2===0)L([[0,0],[Math.cos(q)*r,Math.sin(q)*r*.7]],C[2],.35);}
    ring(24+mid*65,8,u*.3,.8,C[2],.9);glyph('skill-triad-techniques',0,0,62,0,.9);break;
   case 13: // Rare: three interlocked cognitive domains align.
    for(let j=0;j<3;j++){const q=j*Math.PI*2/3-Math.PI/2,cx=Math.cos(q)*(28+mid*35),cy=Math.sin(q)*(28+mid*35),pts=[];
     for(let k=0;k<=3;k++){const a=k*Math.PI*2/3-Math.PI/2+u*.6;pts.push([cx+Math.cos(a)*72,cy+Math.sin(a)*72]);}L(pts,C[j],.9,1.8);diamond(cx,cy,7,C[j]);}
    S(0,0,5,C[2],.9);break;
  }
  // Shared residual node glow joins all fourteen effects to the existing neural network.
  if(paths?.length)for(let j=0;j<Math.min(3,b.paths.length);j++){const path=paths[b.paths[j]],head=Math.floor(clamp((u-j*.03)/.8)*(path.length-1));line(path.slice(Math.max(0,head-16),head+1),j===2?C[2]:C[0],fade*.4,1.4);}
  ctx.globalAlpha=1;return fade;
 }
 window.HolyMindReactions=Object.freeze({version:'resonance-v11',styles:Object.freeze(styles),get:id=>byId[id]||null,pick,draw,snapshot:()=>({count:styles.length,recent:[...recent],remaining:bag.length,sinceRare,history:[...history]})});
})();
