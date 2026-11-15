/* Standalone concept chooser. Real profile geometry/painter, demo-only component motion. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/evidence/section-motion-examples');fs.mkdirSync(out,{recursive:true});
const builder=fs.readFileSync(path.join(root,'scripts/build-profile-art.cjs'),'utf8');
const scenes=[{id:'skill',position:6.55,name:'สกิลตกผลึก',copy:'ทุกสกิลเริ่มจากปัญหาที่ฉันพบ แล้วค่อย ๆ ตกผลึกผ่านการทดลอง คัดเลือก และปรับปรุง',job:'แสงและรายละเอียดภายในสกิลค่อย ๆ มีชีวิต โดยมือยังสัมผัสชิ้นงานอยู่'},{id:'ember',position:5.03,name:'แสงในฉากดราม่า',copy:'เมื่อคำตอบยังไม่ชัด ฉันอยู่กับปัญหาและกลับมาทำงานต่อ แสงเล็กในมือจึงเป็นสิ่งที่ยังเหลืออยู่',job:'เปลวแสงหายใจเบา ๆ ก่อนมีจังหวะกดดันและค่อย ๆ กลับมาสว่าง'},{id:'review',position:4.4,name:'รอ Human review',copy:'ความสามารถของ AI ต้องมีพื้นที่ให้คนตรวจสอบ คำตอบหนึ่งคำตอบจึงยังต้องรอการตัดสินใจของมนุษย์',job:'แสงเดินมาถึงขอบเขตแล้วรอ ไม่มีการผ่านจุด review ให้อัตโนมัติ'}];
const g=require('../assets/profile/geometry.js');
for(const scene of scenes){
 let code=builder.slice(builder.indexOf('const color='));
 code=code.replace('for(let state=0;state<g.config.scenes.length;state++){',`for(const state of [${scene.position}]){`).replace('g.createProjector(state,720,720)','g.createProjector(state,720,720,{strength:0})');
 code=code.replace('return `<path${item.secondary?', 'return `<path${item.id?\' data-piece="\'+item.id+\'"\':\'\'}${item.role===\'volume\'?\' data-volume="true"\':\'\'}${item.secondary?');
 code=code.slice(0,code.indexOf('console.log('));
 vm.runInNewContext(code,{g,fs,path,dir:out,n:undefined,console},{filename:'motion-study-art.cjs'});
 const file=path.join(out,`scene-${scene.position}.svg`);scene.svg=fs.readFileSync(file,'utf8').replace(/<title[\s\S]*?<\/desc>/,'').replace(/aria-labelledby="[^"]*"/,'aria-hidden="true"').replace('role="img"','role="presentation"');fs.unlinkSync(file);
 const project=g.createProjector(scene.position,720,720,{strength:0}),layers=g.illustration(scene.position),front=layers.filter(l=>l.role==='front-work'&&l.alpha>.5).flatMap(l=>l.paths.filter(p=>p.fill&&p.points.length>=4&&!p.skin));
 const item=scene.id==='review'?front.at(-1):front[0];if(!item)throw new Error('Missing real component '+scene.id);
 const points=item.points.map(project).map(p=>p.slice(0,2));scene.outline=points;scene.piece=item.id;scene.details=layers.filter(l=>l.role==='front-work'&&l.alpha>.5).flatMap(l=>l.paths.filter(p=>p.role==='volume').map(p=>p.points.map(project).map(q=>q.slice(0,2))));
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);scene.center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];scene.radius=Math.max(12,(Math.max(...xs)-Math.min(...xs)+Math.max(...ys)-Math.min(...ys))/4);
 const world=layers.find(l=>l.id==='story-world'),anchors=[];
 for(let i=0;i<8;i++){const points=world.paths.filter(p=>p.object===i).flatMap(p=>p.points),c=[0,1,2].map(k=>points.reduce((n,p)=>n+p[k],0)/points.length),p=project(c);if(p[0]>70&&p[0]<650&&p[1]>90&&p[1]<610)anchors.push(p.slice(0,2));}
 scene.anchors=anchors.slice(0,3);while(scene.anchors.length<3)scene.anchors.push([[155,340],[555,230],[550,555]][scene.anchors.length]);
}
const template=fs.readFileSync(path.join(__dirname,'motion-examples.template.html'),'utf8');
fs.writeFileSync(path.join(out,'index.html'),template.replace('/* SCENE_DATA */',JSON.stringify(scenes).replace(/</g,'\\u003c')));
fs.writeFileSync(path.join(out,'scene-map.json'),JSON.stringify(scenes.map(({svg,...s})=>s),null,2)+'\n');
console.log(JSON.stringify({scenes:scenes.length,variants:3,standalone:path.join(out,'index.html')}));
