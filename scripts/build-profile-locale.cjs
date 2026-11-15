/* Native copy only: never fork the approved character or motion timeline. */
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),story=require('./data/profile-story.th.json'),english=require('./data/profile-story.json');
for(const [i,c]of story.chapters.entries()){
 const base=english.chapters[i];if(c.id!==base.id||c.beats.length!==base.beats.length)throw new Error('Thai chapter structure differs: '+c.id);
 for(const [j,beat]of c.beats.entries())for(const key of ['pose','prop','tone','energy','shot'])if(beat[key]!==base.beats[j][key])throw new Error('Locale changes motion: '+c.id+'/'+key);
}
const text={
 'A PLACE FOR PEOPLE':'บ้านที่มีคนอยู่','THE FIRST DRAWING':'เส้นแรกของแบบบ้าน','AI ENTERS THE WORKFLOW':'ลองให้ AI ช่วยงาน','DRAWING → CODE':'เส้นวาด → โค้ด','ONE WORKING COMPONENT':'ชิ้นส่วนที่ทำงานได้',
 'THE DEPTH BENEATH':'งานที่ซ่อนอยู่ข้างหลัง','PEOPLE · REQUIREMENTS · CODE':'คน · โจทย์ · โค้ด','PARTS BECOME A SYSTEM':'หลายชิ้นกลายเป็นระบบ','UNDERSTAND THE NEED':'ฟังให้เข้าใจ','A PERSON REVIEWS':'หยุดให้คนตรวจ','REVIEWED BY A PERSON':'คนตรวจทานแล้ว','KEEP THE LESSON':'เก็บบทเรียนไว้',
 'THE PATH IS NOT CLEAR':'ยังหาทางไปต่อ','TRY · LEARN · REFINE':'ลอง · เรียนรู้ · ปรับ','SEEK · SELECT · SYNTHESIZE':'ค้น · คัด · ประกอบ','PURPOSE · METHOD · CHARACTER':'หน้าที่ · วิธี · ตัวตน','A SKILL OF ITS OWN':'สกิลที่มีตัวตน','YOUR NEXT STEP. YOUR CHOICE.':'ขั้นต่อไป คุณเลือกเอง','A CLEAR WAY IN':'รู้ว่าจะเริ่มตรงไหน'
};
const scenes=[
 {verb:'นึกถึงสิ่งที่อยากสร้าง',action:'นึกถึงสิ่งที่อยากสร้าง',meaning:'จินตนาการ',label:'00 / ก่อนเรื่องราวจะเริ่ม',caption:'ทุกอย่างเริ่มจากสิ่งที่ผมอยากสร้าง'},
 ...story.chapters.map(c=>({label:c.eyebrow})),
 {verb:'มองย้อนกลับไป',action:'มองย้อนกลับไป',meaning:'ประสบการณ์',label:'09 / งานที่พาผมมาถึงตรงนี้',caption:'แต่ละงานมีบางอย่างติดตัวผมมา'},
 {verb:'เริ่มเรื่องถัดไป',action:'เริ่มเรื่องถัดไป',meaning:'สิ่งที่จะสร้างด้วยกัน',label:'10 / เรื่องที่เราจะเขียนต่อ',caption:'คุณมีเรื่องไหนที่อยากลองสร้างด้วยกันไหม'}
];
const data={scenes,story:story.chapters.map(c=>({chapter:c.scene,beats:c.beats.map(({action,caption,meaning})=>({action,caption,meaning}))})),text};
const source='/* Generated from independently authored Thai copy. Run npm run build:profile. */\n(()=>{\'use strict\';if(document.documentElement.lang!==\'th\')return;const c=window.ProfileScenes,d='+JSON.stringify(data)+';c.locale=\'th\';c.sceneUnit=\'ฉาก\';c.text=d.text;d.scenes.forEach((s,i)=>Object.assign(c.scenes[i],s));d.story.forEach(s=>s.beats.forEach((b,i)=>Object.assign(c.story.find(v=>v.chapter===s.chapter).beats[i],b)));})();\n';
fs.writeFileSync(path.join(root,'assets/profile/locale-th.js'),source);
console.log('Built Thai scene copy; approved performance structure matches English.');
