/* Shared visible hand/contact model. Angles blend; fixed phalanges are rebuilt by FK.
   Wrist-local x spans the palm, +y points out of its back, +z follows the fingers.
   The palmar contact pad is therefore on -y. No accumulating animation state. */
(function(root){'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
 const names=['thumb','index','middle','ring','little'];
 // Approved C glove: a broad pebble palm and five short, inflated digits.
 const roots=[[-.048,-.003,.026],[-.042,0,.073],[-.013,0,.078],[.018,0,.075],[.046,0,.064]];
 const lengths=[[.029,.020,.013],[.024,.020,.014],[.027,.021,.014],[.025,.019,.013],[.020,.016,.011]];
 const palm={center:[0,0,.028],radii:[.061,.035,.061]};
 const pad=[0,-.035,.032],tool=[-.026,-.052,.14],free=[0,0,.075];
 const presets={
  relaxed:{yaw:[-.12,-.025,0,.025,.065],flex:[[.20,.22,.12],[.20,.25,.12],[.24,.28,.14],[.28,.31,.16],[.31,.34,.17]],feature:'none'},
  open:{yaw:[-.48,-.075,0,.045,.12],flex:[[.10,.12,.07],[.08,.11,.05],[.10,.13,.06],[.13,.16,.08],[.16,.19,.09]],feature:'none'},
  cup:{yaw:[.34,-.015,0,.025,.06],flex:[[.28,.26,.13],[.27,.34,.17],[.31,.38,.19],[.34,.42,.21],[.38,.45,.23]],feature:'palm'},
  hold:{yaw:[.52,.035,0,-.018,-.035],flex:[[.31,.30,.15],[.31,.42,.22],[.36,.46,.24],[.40,.50,.27],[.43,.54,.29]],feature:'palm'},
  brace:{yaw:[-.29,-.035,0,.025,.065],flex:[[.12,.12,.07],[.05,.08,.04],[.06,.09,.04],[.08,.10,.05],[.11,.12,.06]],feature:'palm'},
  point:{yaw:[.14,0,0,.025,.065],flex:[[.23,.24,.13],[.025,.035,.02],[.34,.43,.21],[.38,.47,.24],[.41,.50,.27]],feature:'index'},
  type:{yaw:[-.12,0,0,.025,.06],flex:[[.15,.17,.08],[.25,.32,.16],[.22,.29,.14],[.26,.31,.16],[.30,.35,.18]],feature:'index'},
  write:{yaw:[.60,.16,0,.025,.065],flex:[[.50,.42,.20],[.54,.50,.22],[.35,.43,.22],[.38,.46,.25],[.41,.49,.27]],feature:'tool'}
 };
 const aliases={grip:'hold',support:'brace',inspect:'hold',reflect:'cup',stylus:'write',draw:'write',press:'type',touch:'point',offer:'open',invite:'open'};
 function normalGrip(grip){grip=String(grip||'relaxed');return presets[grip]?grip:aliases[grip]||'relaxed';}
 function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const v of Object.values(value))freeze(v);}return value;}
 function controls(grip){const preset=presets[normalGrip(grip)];return {yaw:[...preset.yaw],flex:preset.flex.map(a=>[...a]),features:{index:preset.feature==='index'?1:0,palm:preset.feature==='palm'?1:0,tool:preset.feature==='tool'?1:0,none:preset.feature==='none'?1:0}};}
 function build(parameters,side,grip){
  side=side<0?-1:1;
  const fingers=names.map((name,i)=>{
   let point=[roots[i][0]*side,roots[i][1],roots[i][2]],bend=0;
   const points=[[...point]],yaw=parameters.yaw[i]*side,c=Math.cos(yaw),s=Math.sin(yaw);
   for(let j=0;j<3;j++){bend+=parameters.flex[i][j];const forward=Math.cos(bend)*lengths[i][j],down=-Math.sin(bend)*lengths[i][j];point=[point[0]+s*forward,point[1]+down,point[2]+c*forward];points.push(point);}
   return {name,points,lengths:[...lengths[i]],radii:i===0?[.018,.017,.015,.013]:[.0145,.014,.013,.0115],active:parameters.features.index>.5&&i===1};
  });
  const featurePoints={index:fingers[1].points[3],palm:pad,tool:[tool[0]*side,tool[1],tool[2]],none:free},contactOffset=[0,0,0],weights=parameters.features;
  for(const key of Object.keys(featurePoints))for(let j=0;j<3;j++)contactOffset[j]+=featurePoints[key][j]*weights[key];
  const dominant=Object.keys(weights).find(k=>weights[k]>1-1e-8),featureNames={index:'index-tip',palm:'palm-pad',tool:'tool-tip',none:'none'};
  return {side,grip,palm:{center:[...palm.center],radii:[...palm.radii]},fingers,contactOffset,contactFeature:dominant?featureNames[dominant]:'transition',parameters};
 }
 const cache={};
 function pose(grip,side=1){grip=normalGrip(grip);side=side<0?-1:1;const key=grip+':'+side;return cache[key]||(cache[key]=freeze(build(controls(grip),side,grip)));}
 function blend(a,b,t){
  if(!a?.parameters||!b?.parameters)throw new Error('Hand blend requires sampled hand shapes');
  if(a.side!==b.side)throw new Error('Hand blend cannot swap sides');
  t=clamp(Number.isFinite(t)?t:0);if(t===0)return a;if(t===1)return b;
  const pa=a.parameters,pb=b.parameters,parameters={yaw:pa.yaw.map((v,i)=>mix(v,pb.yaw[i],t)),flex:pa.flex.map((angles,i)=>angles.map((v,j)=>mix(v,pb.flex[i][j],t))),features:{}};
  for(const key of ['index','palm','tool','none'])parameters.features[key]=mix(pa.features[key],pb.features[key],t);
  return build(parameters,a.side,a.grip===b.grip?a.grip:'transition');
 }
 function sample(gripA,gripB,t,side=1){const a=pose(gripA,side),b=pose(gripB,side);return a===b?a:blend(a,b,t);}
 // A key press flexes the index independently; the wrist/contact solver uses its FK tip.
 const hoverCache={};
 function press(pulse,side=1){pulse=clamp(Number.isFinite(pulse)?pulse:0);side=side<0?-1:1;if(pulse===1)return pose('type',side);if(pulse===0&&hoverCache[side])return hoverCache[side];const parameters=controls('type'),hover=[.10,.12,.06];parameters.flex[1]=presets.type.flex[1].map((angle,i)=>mix(hover[i],angle,pulse));const shape=build(parameters,side,'type');if(pulse===0)hoverCache[side]=freeze(shape);return shape;}

 // Scroll accents change joint angles, never the approved C glove proportions.
 // Loaded index/tool features stay unchanged; IK receives the new contact pad.
 function articulate(shape,{curl=0,spread=0,phase=0}={}){
  if(!curl&&!spread||shape.parameters.features.tool===1)return shape;
  const p=shape.parameters,parameters={yaw:[...p.yaw],flex:p.flex.map(a=>[...a]),features:{...p.features}};
  for(let i=0;i<5;i++){
   const freedom=(1-p.features.tool)*(i===1?1-p.features.index:1),lag=1-.16*Math.sin(phase*Math.PI*2-i*.42),weight=[.35,.62,.80,.95,1][i];
   parameters.yaw[i]+=spread*freedom*[-.85,-.42,0,.42,.82][i];
   for(let j=0;j<3;j++)parameters.flex[i][j]=clamp(parameters.flex[i][j]+curl*weight*lag*freedom*[.70,1,.65][j],.015,.82);
  }
  return build(parameters,shape.side,shape.grip);
 }

 // Both the sparse filaments and filled skin sample these same surfaces.
 // Skin remains a pure function of the frozen/sampled articulated shape.
 const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),norm=a=>mul(a,1/(Math.hypot(...a)||1)),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],pow=(v,p)=>Math.sign(v)*Math.abs(v)**p;
 const skins=new WeakMap();
 function skin(shape){
  if(skins.has(shape))return skins.get(shape);
  const palmPoint=(t,a)=>{const b=(t-.5)*Math.PI,c=Math.cos(b),r=shape.palm.radii,origin=shape.palm.center;return [origin[0]+r[0]*pow(c,.62)*pow(Math.cos(a),.78),origin[1]+r[1]*pow(c,.86)*pow(Math.sin(a),.92),origin[2]+r[2]*pow(Math.sin(b),.62)];};
  const fingers=shape.fingers.map(finger=>{
   const points=finger.points,tip=points.at(-1),axis=norm(sub(tip,points.at(-2))),across=norm([axis[2],0,-axis[0]]),radius=finger.radii.at(-1),end=sub(tip,mul(axis,radius));
   // A fat cap may reach behind the final knuckle. Keep its skin tangent
   // forward-facing rather than reversing the curve at that joint.
   const controls=[points[0],points[1],sub(end,mul(axis,finger.lengths.at(-1)*.65)),end];
   const rootAxis=norm(sub(points[1],points[0])),rootBack=norm(cross(rootAxis,across));
   return (t,a)=>{let center,tangent,r;
    if(t<.12){const b=t/.12*Math.PI/2,radial=add(mul(across,Math.cos(a)),mul(rootBack,Math.sin(a)));return add(sub(points[0],mul(rootAxis,finger.radii[0]*Math.cos(b))),mul(radial,finger.radii[0]*Math.sin(b)));}
    t=(t-.12)/.88;
    if(t>.76){const b=(t-.76)/.24*Math.PI/2;center=add(end,mul(axis,radius*Math.sin(b)));tangent=axis;r=radius*Math.cos(b);}
    else {const u=t/.76,v=1-u;center=controls[0].map((_,i)=>v*v*v*controls[0][i]+3*v*v*u*controls[1][i]+3*v*u*u*controls[2][i]+u*u*u*controls[3][i]);tangent=norm(controls[0].map((_,i)=>3*v*v*(controls[1][i]-controls[0][i])+6*v*u*(controls[2][i]-controls[1][i])+3*u*u*(controls[3][i]-controls[2][i])));r=mix(finger.radii[0],radius,u*u*(3-2*u));}
    return add(center,add(mul(across,Math.cos(a)*r),mul(norm(cross(tangent,across)),Math.sin(a)*r)));
   };
  });
  const result={palm:palmPoint,fingers};skins.set(shape,result);return result;
 }
 const api={pose,sample,blend,press,articulate,skin,grips:Object.freeze(Object.keys(presets)),lengths:freeze(lengths.map(a=>[...a]))};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.ProfileHandShapes=api;
})(typeof globalThis!=='undefined'?globalThis:this);
