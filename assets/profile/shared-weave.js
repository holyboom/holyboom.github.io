/* Continue the projected scene threads into the mobile reading margin. */
(function(root){
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 // Stable IDs on the two outer folds of the original membrane / floor rig.
 const warpSources=[80,96,97,100,101,84,104,105,108,109,112,88,176,177,180,181,92];
 const floorSources=[684,691,698,705,712,719,726,733],levels=24;
 function attr(node,key,value){if(node.getAttribute(key)!==String(value))node.setAttribute(key,value);}
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
 const mix=(a,b,t)=>a+(b-a)*t;
 const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
 const pt=q=>q[0].toFixed(2)+','+q[1].toFixed(2);
 const blend=(a,b,t)=>a.map((n,i)=>mix(n,b[i],t));
 const svgNode=(name,attributes={})=>{
  const node=document.createElementNS(ns,name);
  for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
  return node;
 };
 function threadPath(root,tangent,sections){
  const points=[root,...sections],second=points[1],third=points[2];
  const pull=Math.min(46,Math.hypot(second[0]-root[0],second[1]-root[1])*.40);
  const firstControl=[root[0]+tangent[0]*pull,root[1]+tangent[1]*pull];
  const nextDx=third[0]-second[0],nextDy=third[1]-second[1],nextLength=Math.hypot(nextDx,nextDy)||1;
  const settle=Math.min(pull,Math.max(6,(second[1]-root[1])*.48));
  const secondControl=[second[0]-nextDx/nextLength*settle,second[1]-nextDy/nextLength*settle];
  let d='M'+pt(root)+'C'+pt(firstControl)+' '+pt(secondControl)+' '+pt(second);
  for(let i=2;i<points.length;i++){
   const a=points[i-1],b=points[i],before=points[i-2],after=points[i+1]||b;
   d+='C'+pt(i===2?blend(a,b,.30):a.map((n,k)=>n+(b[k]-before[k])/6))+' '+pt(b.map((n,k)=>n-(after[k]-a[k])/6))+' '+pt(b);
  }
  return d;
 }
 // Glyph rectangles stay in document coordinates. New viewports, font loads
 // and disclosures are measured by the site's existing layout lifecycle.
 function textLines(journey,frameLeft,scroll){
  const range=document.createRange(),lines=[];
  for(const copy of journey.querySelectorAll('.chapter-copy')){
   const walk=document.createTreeWalker(copy,NodeFilter.SHOW_TEXT);
   for(let node=walk.nextNode();node;node=walk.nextNode()){
    if(!node.textContent.trim())continue;
    range.selectNodeContents(node);
    for(const r of range.getClientRects())if(r.width>1&&r.height>1)
     lines.push({top:r.top+scroll,bottom:r.bottom+scroll,right:r.right-frameLeft});
   }
  }
  return lines.sort((a,b)=>a.top-b.top);
 }
 function create({stage,canvas}){
  const frame=canvas.closest('.stage-frame'),journey=stage.closest('.journey'),host=journey?.querySelector('.shared-weave-host');
  let upper,lower,fabric,warp,crossings,ground,layout,inkMask,quietRows,marginRows,visible=false;
  let labels=[],measuredShot=-1;
  function mount(){
   if(upper)return;
   upper=svgNode('svg',{class:'shared-weave','aria-hidden':'true',focusable:'false'});
   lower=svgNode('svg',{class:'shared-weave-lower','aria-hidden':'true',focusable:'false'});
   // Stroke clearance also applies to the first cubic leaving the canvas,
   // between the sampled rows and on unfamiliar translations or large type.
   const defs=svgNode('defs'),gradient=svgNode('linearGradient',{id:'profile-weave-density',x1:'0%',x2:'0%',y1:'0%',y2:'100%'});
   quietRows=Array.from({length:levels+1},()=>{const stop=svgNode('stop',{'stop-color':'white'});gradient.append(stop);return stop;});
   const mask=svgNode('mask',{id:'profile-weave-clearance',maskUnits:'userSpaceOnUse',x:0,y:0,width:'100%',height:'100%'});
   inkMask=svgNode('path',{fill:'black'});mask.append(svgNode('rect',{x:0,y:0,width:'100%',height:'100%',fill:'url(#profile-weave-density)'}),inkMask);
   defs.append(gradient,mask);upper.append(defs);
   const mesh=svgNode('g',{id:'profile-shared-fabric',mask:'url(#profile-weave-clearance)',fill:'none','stroke-linecap':'round','stroke-linejoin':'round'});
   upper.append(mesh);lower.append(svgNode('use',{href:'#profile-shared-fabric'}));
   frame.append(upper);host.append(lower);
   fabric=svgNode('g',{'data-material':'membrane'});ground=svgNode('g',{'data-material':'terrain'});mesh.append(fabric,ground);
   const paths=(group,count,kind)=>Array.from({length:count},()=>{const path=svgNode('path',{'data-thread':kind});group.append(path);return path;});
   crossings=paths(fabric,15,'weft');warp=paths(fabric,17,'warp');
   ground={group:ground,paths:paths(ground,8,'floor')};
   warp.forEach((path,i)=>path.setAttribute('stroke-width',i===0||i===16?'1.05':'.77'));
   crossings.forEach((path,i)=>{path.setAttribute('stroke-width','.62');path.setAttribute('opacity',i%4===0?'.36':'.23');});
   ground.paths.forEach((path,i)=>path.setAttribute('stroke-width',i%3===0?'.8':'.56'));
  }
  function hide(){
   if(!upper||!visible)return;
   upper.style.display='none';lower.style.display='none';visible=false;
  }
  function measureLabels(){
   const f=frame.getBoundingClientRect(),range=document.createRange();labels=[];marginRows=null;
   for(const node of frame.querySelectorAll('.scene-caption,.scene-meaning')){
    range.selectNodeContents(node);
    for(const r of range.getClientRects())if(r.width>1&&r.height>1)labels.push({top:r.top-f.top,bottom:r.bottom-f.top,right:r.right-f.left});
   }
  }
  function measure(){
   layout=null;
   if(!frame||!host||innerWidth>=768||!frame.contains(canvas)){hide();return;}
   const box=canvas.getBoundingClientRect(),f=frame.getBoundingClientRect();
   if(box.width<1||box.height<1||!f.width){hide();return;}
   mount();
   const css=getComputedStyle(canvas),px=k=>parseFloat(css[k])||0;
   const left=px('borderLeftWidth')+px('paddingLeft'),right=px('borderRightWidth')+px('paddingRight');
   const top=px('borderTopWidth')+px('paddingTop'),bottom=px('borderBottomWidth')+px('paddingBottom');
   const view=window.visualViewport?.height||innerHeight,viewportRight=document.documentElement.clientWidth-f.left;
   const sticky=parseFloat(getComputedStyle(stage).top),stageTop=Number.isFinite(sticky)?sticky:f.top;
   const height=Math.max(f.height+1,view-stageTop);
   layout={x:box.left-f.left+left,y:box.top-f.top+top,sx:(box.width-left-right)/box.width,sy:(box.height-top-bottom)/box.height,
    left:-f.left,right:viewportRight,width:document.documentElement.clientWidth,seam:f.height,height,stageTop,
    lines:textLines(journey,f.left,scrollY)};
   measureLabels();measuredShot=-1;
   for(const svg of [upper,lower]){
    svg.setAttribute('viewBox','0 0 '+viewportRight+' '+height);
    svg.style.width=viewportRight+'px';svg.style.height=height+'px';
    svg.style.setProperty('--shared-weave-seam',f.height+'px');svg.style.pointerEvents='none';
   }
  }
  function draw({position,projected,theme,shot,ambientPhase=0,scroll=window.scrollY}){
   if(!layout||innerWidth>=768||!projected?.length){hide();return;}
   if(!visible){upper.style.removeProperty('display');lower.style.removeProperty('display');visible=true;}
   const l=layout,story=shot||root.ProfileGeometry.storyAt(position),timeline=story.timeline??root.ProfileGeometry.resolve(position);
   if(story.index!==measuredShot){measureLabels();measuredShot=story.index;}
   const opening=1-ease((timeline-.17)/.65),floor=ease((timeline-.18)/.60);
   const x=q=>l.x+q[0]*l.sx,y=q=>l.y+q[1]*l.sy;
   const top=scroll+l.stageTop,right=l.right-2,width=l.width;
   const native=ease(scroll/(l.height*.98)),phase=timeline*.53;
   if(!marginRows||marginRows.scroll!==scroll){
    const docStart=top+l.seam-68,docEnd=top+l.height+60;
    // Skip preceding chapters without revisiting all their lines each frame.
    let lo=0,hi=l.lines.length;
    while(lo<hi){const mid=(lo+hi)>>1;if(l.lines[mid].top<docStart-80)lo=mid+1;else hi=mid;}
    const seen=[];
    for(let j=lo;j<l.lines.length&&l.lines[j].top<docEnd;j++)seen.push(l.lines[j]);
    function inkEdge(localY,base){
     const docY=top+localY;let edge=base;
     if(localY<l.seam+30)for(const line of labels){
      const space=Math.max(0,line.top-localY,localY-line.bottom);
      if(space<34)edge=Math.max(edge,mix(base,Math.min(right-3,line.right+12),1-ease(space/34)));
     }
     for(const line of seen){
      const space=Math.max(0,line.top-docY,docY-line.bottom);
      if(space<36)edge=Math.max(edge,mix(base,Math.min(right-3,line.right+11),1-ease(space/36)));
     }
     return edge;
    }
    const first=l.seam*.67,end=l.height+10;
    const rows=Array.from({length:levels},(_,i)=>{
     const t=i/(levels-1),v=mix(first,end,t);
     const natural=l.left+width*mix(.68,.79,native);
     return {t,y:v,edge:inkEdge(v,natural),quietEdge:inkEdge(v,l.left+width*.875)};
    });
    const cut=(a,b,r)=>'M0,'+a.toFixed(1)+'H'+Math.min(right,r).toFixed(1)+'V'+b.toFixed(1)+'H0Z';
    attr(inkMask,'d',labels.map(v=>cut(v.top-2,v.bottom+2,v.right+4)).join('')+
     seen.filter(v=>v.bottom-top>l.seam-3).map(v=>cut(Math.max(l.seam-2,v.top-top-3),v.bottom-top+3,v.right+5)).join(''));
    quietRows.forEach((stop,i)=>{
     const row=rows[Math.max(0,i-1)],room=right-row.edge;
     attr(stop,'offset',i===0?'0%':Math.min(100,row.y/l.height*100).toFixed(2)+'%');
     attr(stop,'stop-opacity',i===0?1:ease((room-4)/21).toFixed(3));
    });
    marginRows={scroll,rows};
   }
   const rows=marginRows.rows;
   // The warp rotates about the ribbon's length. One hem crosses in front
   // of the other and spreads apart again near the foot of the viewport.
   function section(row,openingFabric){
    const {t}=row;
    const edge=openingFabric?row.edge:row.quietEdge,room=Math.max(1,right-edge);
    const phaseAngle=openingFabric?.4+4.7*t+.11*Math.sin(ambientPhase*.39)+native*.64:phase*.71+2.4*t;
    const span=Math.min(room*.46,width*(openingFabric?.154-.038*native:.051));
    const sweep=openingFabric?.51+.31*Math.sin(1.79*Math.PI*t-.55+native*.56):.62+.28*Math.sin(phase+Math.PI*2*t);
    const center=mix(edge+span,right-span,sweep);
    const c=Math.cos(phaseAngle),s=Math.sin(phaseAngle);
    const skew=span*(.22*s*Math.sin(Math.PI*t)+.20*(1-t)**3);
    return lane=>[center+span*(lane*c+(1-lane*lane)*.33*s),row.y+skew*lane];
   }
   const byId=new Map();
   for(const line of projected){
    if((opening>0&&line.id>=80&&line.id<192)||(floor>0&&line.floor)){const old=byId.get(line.id);if(!old||old.points.length<line.points.length)byId.set(line.id,line);}
   }
   function attach(path,line,index,sections,alpha){
    if(!line||line.points.length<3||alpha<.004){path.setAttribute('opacity','0');return;}
    const points=line.points,n=points.length;
    let i=Math.min(n-2,Math.max(1,Math.round(index*(n-1)))),fraction=0;
    if(line.floor){
     // The outside shoulder of this same world curve turns continuously
     // with the camera. A quadratic estimate between its three samples
     // selects a point ON the painted segment, including on reverse scroll.
     const score=q=>{const u=x(q),v=y(q);return u-.13*Math.abs(v-l.seam*.76)-1.8*Math.max(0,u-right+15)-1.50*Math.max(0,v-l.seam*.95);};
     let best=-Infinity;
     for(let j=0;j<n;j++){const value=score(points[j]);if(value>best){best=value;i=j;}}
     if(i>0&&i<n-1){
      const a=score(points[i-1]),b=score(points[i+1]),curve=a+b-2*best;
      if(curve<-.00001){fraction=clamp((a-b)/(2*curve),-.5,.5);if(fraction<0){i--;fraction++;}}
     }else if(i===n-1){i--;fraction=1;}
    }
    const root=[mix(x(points[i]),x(points[i+1]),fraction),mix(y(points[i]),y(points[i+1]),fraction)];
    // A lens inside a workpiece can clip the floor to infinity or outside
    // the upper stage. Fade the root; never draw a diagonal across captions.
    let strength=alpha;
    if(line.floor){
     strength*=ease((root[0]-l.left+12)/36)*ease((right-root[0]+8)/30)*ease((root[1]-.37*l.seam)/(.21*l.seam));
     strength*=1-ease((root[1]-l.seam*.97)/(l.seam*.22));
    }
    const prior=points[Math.max(0,i-1)],dx=x(points[i+1])-x(prior),dy=y(points[i+1])-y(prior);
    const sign=dx*(sections[0][0]-root[0])+dy*(sections[0][1]-root[1])>=0?1:-1,length=Math.hypot(dx,dy)||1;
    attr(path,'data-source-line',line.id);attr(path,'data-sample-index',i);if(line.floor)attr(path,'data-sample-fraction',fraction.toFixed(6));
    // A ground line already lies beside the caption. Continue it outwards
    // along its own tangent to the nearest point of the descending margin.
    // Never pull it upwards to the opening's earlier departure row.
    let start=0;
    if(line.floor)while(start<sections.length-3&&sections[start][1]<root[1]+Math.max(22,(sections[start][0]-root[0])*.38))start++;
    const route=start?sections.slice(start):sections;
    attr(path,'d',threadPath(root,[sign*dx/length,sign*dy/length],route));attr(path,'opacity',strength.toFixed(3));
   }
   fabric.style.display=opening>0?'':'none';
   if(opening>0){
    attr(fabric,'stroke',root.ProfileGeometry.config.palette.line);attr(fabric,'opacity',opening.toFixed(3));
    const bands=rows.map(row=>section(row,true));
    for(let i=0;i<warp.length;i++){
     const lane=i/8-1;
     // Parallel meridians leave the folded lobe. Its opposite hem and two
     // interior folds continue the crossing family of rings on that surface.
     const id=warpSources[i],index=id<96?.91+.035*lane:.80+.035*lane;
     attach(warp[i],byId.get(id),index,bands.map(point=>point(lane)),i%4===0?.79:.54);
    }
    crossings.forEach((path,j)=>{
     const k=Math.round(2+j*(levels-4)/(crossings.length-1)),row=rows[k],points=[];
     for(let i=0;i<=10;i++){
      const across=i/5-1,q=bands[k](across);
      q[1]+=Math.sin(Math.PI*i/10)*(5+8*row.t);points.push(q);
     }
     attr(path,'d','M'+points.map(pt).join('L'));
    });
   }
   ground.group.style.display=floor>0?'':'none';
   if(floor>0){
    attr(ground.group,'stroke',theme.accent);attr(ground.group,'opacity',floor.toFixed(3));
    const bands=rows.map(row=>section(row,false));
    ground.paths.forEach((path,i)=>{
     // These retained terrain IDs exist in every world and morph through
     // terraces, channels and islands with the original floor coordinates.
     const line=byId.get(floorSources[i]),lane=i/(ground.paths.length-1)*2-1;
     attach(path,line,0,bands.map(point=>point(lane)),i%3===0?.37:.24);
    });
   }
  }
  return {measure,draw,hide};
 }
 root.ProfileSharedWeave={create};
})(typeof globalThis!=='undefined'?globalThis:this);
