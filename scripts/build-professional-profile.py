"""Static, bilingual professional profile. No AI-only content, tracking or private CV data."""
from pathlib import Path
import json, html
ROOT=Path(__file__).resolve().parents[1]
BASE='https://holyboom.github.io'
LI='https://www.linkedin.com/in/boom-theerawee'
GITHUB='https://github.com/holyboom'
REPO=GITHUB+'/holyboom.github.io'
UPDATED='2026-11-12'
E=html.escape
person={
 '@type':'Person','@id':BASE+'/#theerawee-rangram','name':'Theerawee Rangram',
 'alternateName':['Boom','Boom Theerawee','holyboom','ธีรวีร์ รางแรม'],
 'jobTitle':'AI Engineer and AI Solutions Architect',
 'description':'Bangkok-based AI Engineer and AI Solutions Architect, creator of HolyMind Framework, with 9+ years of software delivery across banking, insurance, fintech and e-commerce.',
 'url':BASE+'/profile/','sameAs':[LI,GITHUB],
 'workLocation':{'@type':'Place','name':'Bangkok, Thailand'},
 'knowsAbout':['AI Engineering','AI Solutions Architecture','Generative AI','Agentic AI','AI Transformation','Workflow Automation','LLM Evaluation','AI Governance','Human-in-the-loop Systems','API Integration','React','Angular','TypeScript','FastAPI','PostgreSQL Row-Level Security','HolyMind Framework']
}
data={
'en':{
 'path':'profile','title':'Theerawee Rangram (Boom) | AI Solutions Architect, Bangkok',
 'description':'Theerawee (Boom) Rangram, AI Engineer and AI Solutions Architect in Bangkok. 9+ years in enterprise software, GenAI integration, agentic workflows and governance.',
 'name':'Theerawee Rangram','nickname':'Boom · ธีรวีร์ รางแรม','role':'AI Engineer & AI Solutions Architect',
 'place':'Bangkok, Thailand','lead':'Turn business ambition into AI systems people can use and trust.',
 'intro':'I connect business requirements, software architecture and hands-on implementation. My focus is practical GenAI integration, agentic workflows and automation with explicit permissions, human review and inspectable evidence.',
 'experience':'9+ years of software delivery across banking, insurance, fintech and e-commerce. Creator of HolyMind Framework.',
 'profileLabel':'Professional profile','showcase':'Explore the interactive showcase','contact':'Connect with Boom on LinkedIn','plain':'Read the plain-text profile',
 'fitHeading':'Where I can contribute',
 'fits':[
 ('AI Solutions Architect','Translate business requirements into system boundaries, integrations, access controls and a delivery plan.'),
 ('AI Engineer and GenAI Engineer','Build AI-assisted workflows that connect models, tools and existing applications, with evaluation and human review.'),
 ('Forward Deployed Engineer','Bring customer-facing requirements, hands-on software delivery and international stakeholder coordination into one implementation conversation.'),
 ('AI Transformation Consultant','Identify a useful first use case, define the workflow and governance, and agree how its results will be evaluated.')],
 'fitNote':'These are relevant roles to discuss, not a list of job titles I have held. Scope, availability and commercial terms are agreed in conversation.',
 'strengthsHeading':'The combination I bring',
 'strengths':'Enterprise software experience plus applied AI architecture: GenAI integration, agent orchestration, LLM evaluation, guardrails, API integration and human-in-the-loop decisions. My application work includes TypeScript, React, Angular, FastAPI and PostgreSQL row-level security.',
 'backgroundHeading':'Selected experience',
 'backgroundIntro':'Career highlights from my professional background. Detailed CV and project context are available in a recruiter conversation.',
 'jobs':[
 ('Independent AI Solutions Architect','AI-assisted product architecture and development using React, FastAPI and PostgreSQL access controls. Translate requirements into product specifications, source-backed outputs and explicit review paths.'),
 ('ttb spark','Senior software engineering in banking, including frontend delivery and GPT-assisted Jira, Confluence and Bitbucket workflows with human review.'),
 ('Accenture','Corporate-banking frontend delivery, translating stakeholder requirements and collaborating with distributed engineering squads.'),
 ('Allianz Technology','Angular and enterprise frontend development, working with stakeholders and engineering teams in Munich and Bangkok.')],
 'workHeading':'Public work you can inspect',
 'workTitle':'HolyMind interactive portfolio',
 'workCopy':'A working browser-based showcase of intentional interaction, workflow boundaries and software engineering. Visitors explore three illustrative scenarios, inspect fictional source-to-output examples and carry an explicit choice into a planning brief.',
 'proofs':[
 ('Explore the live workbench',BASE+'/#workbench'),
 ('Inspect the source-to-output implementation',REPO+'/blob/main/workflow-proof.js'),
 ('Review choice ownership and state',REPO+'/blob/main/intent-journey.js'),
 ('Read browser checks',REPO+'/blob/main/scripts/qa-edited-journey.cjs')],
 'workNote':'This public example is a portfolio demonstration, not a live agent service or a claimed client result. Client source code, private records and confidential documents are not published here.',
 'questionsHeading':'For recruiters and hiring teams',
 'questions':[
 ('Where is Boom based?','Bangkok, Thailand. My enterprise background includes collaboration with teams in Bangkok and Munich.'),
 ('Is the experience all AI research?','No. My background is enterprise software delivery; my current focus is applied GenAI, AI solutions architecture and agentic automation—not a claim of nine years of foundation-model research.'),
 ('How can I discuss a role or request a CV?','Use LinkedIn with the role, team, location and problem you need solved. We can discuss fit and the appropriate supporting project context.')],
 'closing':'Bring the problem your team is trying to solve.',
 'footer':'Professional history is self-reported. The linked portfolio demonstrates the stated browser behavior; it does not independently verify employment or business outcomes.',
 'languageLabel':'ภาษาไทย','other':'/th/profile/','updated':'Profile reviewed 12 November 2026'
},
 'th':{
 'path':'th/profile','title':'ธีรวีร์ รางแรม (Boom) | AI Engineer และ AI Solutions Architect กรุงเทพฯ',
 'description':'รู้จัก ธีรวีร์ รางแรม (Boom) AI Engineer และ AI Solutions Architect ในกรุงเทพฯ ประสบการณ์พัฒนาซอฟต์แวร์กว่า 9 ปี เน้น GenAI ระบบ Agentic AI และการกำกับดูแล',
 'name':'ธีรวีร์ รางแรม','nickname':'Theerawee Rangram · Boom','role':'AI Engineer & AI Solutions Architect',
 'place':'กรุงเทพฯ ประเทศไทย','lead':'เปลี่ยนความตั้งใจทางธุรกิจ ให้เป็นระบบ AI ที่คนใช้งานและตรวจสอบได้',
 'intro':'ผมเชื่อมโจทย์ธุรกิจ สถาปัตยกรรมซอฟต์แวร์ และการลงมือพัฒนาเข้าด้วยกัน โดยเน้นการนำ GenAI มาใช้จริง ระบบ Agentic AI และ Automation ที่กำหนดสิทธิ์ชัดเจน มีคนตรวจทาน และย้อนดูหลักฐานได้',
 'experience':'ประสบการณ์พัฒนาซอฟต์แวร์กว่า 9 ปี ในงานธนาคาร ประกันภัย ฟินเทค และอีคอมเมิร์ซ เป็นผู้สร้าง HolyMind Framework',
 'profileLabel':'โปรไฟล์สำหรับผู้ว่าจ้าง','showcase':'ชมเว็บไซต์แบบโต้ตอบ','contact':'คุยกับ Boom ผ่าน LinkedIn','plain':'อ่านโปรไฟล์แบบข้อความ',
 'fitHeading':'งานที่นำประสบการณ์นี้ไปใช้ได้',
 'fits':[
 ('AI Solutions Architect','แปลงความต้องการทางธุรกิจเป็นขอบเขตระบบ การเชื่อมต่อ การควบคุมสิทธิ์ และแผนส่งมอบที่ลงมือทำได้'),
 ('AI Engineer และ GenAI Engineer','พัฒนา AI-assisted workflows ที่เชื่อมโมเดล เครื่องมือ และแอปพลิเคชันเดิม พร้อมการประเมินผลและคนตรวจทาน'),
 ('Forward Deployed Engineer','เชื่อมการคุยโจทย์กับลูกค้า การลงมือพัฒนาซอฟต์แวร์ และการประสานงานกับทีมต่างประเทศให้เป็นงานส่งมอบเดียวกัน'),
 ('AI Transformation Consultant','เลือกกรณีใช้งานแรกที่มีประโยชน์ ออกแบบกระบวนการและการกำกับดูแล พร้อมตกลงว่าจะประเมินผลอย่างไร')],
 'fitNote':'รายการนี้เป็นบทบาทที่เหมาะนำมาพูดคุย ไม่ใช่รายชื่อตำแหน่งทั้งหมดที่เคยดำรง ขอบเขตงาน ความพร้อมเริ่มงาน และเงื่อนไขต้องตกลงกันอีกครั้ง',
 'strengthsHeading':'จุดเชื่อมระหว่างธุรกิจ ซอฟต์แวร์ และ AI',
 'strengths':'นำประสบการณ์ซอฟต์แวร์องค์กรมาใช้กับ GenAI integration, agent orchestration, LLM evaluation, guardrails, API integration และการตัดสินใจที่มีคนกำกับ งานแอปพลิเคชันครอบคลุม TypeScript, React, Angular, FastAPI และ PostgreSQL row-level security',
 'backgroundHeading':'ประสบการณ์ที่เกี่ยวข้อง',
 'backgroundIntro':'สรุปจากประวัติการทำงานของผม สามารถพูดคุยรายละเอียด CV และบริบทโครงการที่เหมาะสมกับผู้สรรหาได้',
 'jobs':[
 ('Independent AI Solutions Architect','ออกแบบและพัฒนาผลิตภัณฑ์ที่ใช้ AI ช่วยทำงาน ด้วย React, FastAPI และการควบคุมสิทธิ์ใน PostgreSQL แปลงความต้องการเป็นข้อกำหนดผลิตภัณฑ์ ผลลัพธ์ที่อ้างอิงแหล่งข้อมูล และขั้นตอนตรวจทานที่ชัดเจน'),
 ('ttb spark','งานวิศวกรรมซอฟต์แวร์อาวุโสในธุรกิจธนาคาร ทั้ง frontend และ workflow ที่ใช้ GPT ช่วยงาน Jira, Confluence และ Bitbucket โดยมีคนตรวจทาน'),
 ('Accenture','พัฒนา frontend สำหรับงานธนาคารองค์กร แปลงความต้องการของผู้เกี่ยวข้องและทำงานร่วมกับทีมวิศวกรรมที่อยู่ต่างสถานที่'),
 ('Allianz Technology','พัฒนา Angular และ frontend ของระบบองค์กร พร้อมประสานงานกับผู้เกี่ยวข้องและทีมวิศวกรรมในมิวนิกและกรุงเทพฯ')],
 'workHeading':'ผลงานสาธารณะที่เปิดดูได้',
 'workTitle':'HolyMind interactive portfolio',
 'workCopy':'เว็บไซต์ที่ใช้งานได้จริงในเบราว์เซอร์ แสดงการออกแบบปฏิสัมพันธ์ ขอบเขต workflow และงานวิศวกรรมซอฟต์แวร์ ผู้ชมทดลองโจทย์สมมติสามรูปแบบ ตรวจความสัมพันธ์ของแหล่งข้อมูลกับผลลัพธ์ และส่งต่อสิ่งที่เลือกไปยัง brief เริ่มต้นได้',
 'proofs':[
 ('ทดลอง Workbench บนเว็บไซต์',BASE+'/#workbench'),
 ('ดูโค้ดความสัมพันธ์ของแหล่งข้อมูลกับผลลัพธ์',REPO+'/blob/main/workflow-proof.js'),
 ('ดูการเก็บตัวเลือกและสถานะของผู้ใช้',REPO+'/blob/main/intent-journey.js'),
 ('ดูชุดตรวจพฤติกรรมในเบราว์เซอร์',REPO+'/blob/main/scripts/qa-edited-journey.cjs')],
 'workNote':'ตัวอย่างสาธารณะนี้เป็นงานสาธิตใน portfolio ไม่ใช่บริการ Agent ที่รันจริงหรือผลลัพธ์ของลูกค้าที่อ้างว่าวัดแล้ว ไม่เผยแพร่โค้ดลูกค้า ข้อมูลส่วนตัว หรือเอกสารลับ',
 'questionsHeading':'ข้อมูลสำหรับ HR และทีมที่กำลังหาคน',
 'questions':[
 ('Boom อยู่ที่ไหน','กรุงเทพฯ ประเทศไทย มีประสบการณ์ทำงานร่วมกับทีมองค์กรทั้งในกรุงเทพฯ และมิวนิก'),
 ('ประสบการณ์ทั้งหมดเป็นงานวิจัย AI หรือไม่','ไม่ใช่ พื้นฐานคือการพัฒนาซอฟต์แวร์องค์กร ปัจจุบันเน้น applied GenAI, AI solutions architecture และ agentic automation ไม่ได้อ้างว่าทำวิจัย foundation model มาตลอดเก้าปี'),
 ('ติดต่อคุยตำแหน่งงานหรือขอ CV อย่างไร','ติดต่อผ่าน LinkedIn พร้อมชื่อตำแหน่ง ทีม สถานที่ทำงาน และโจทย์ที่ต้องการแก้ เพื่อประเมินความเหมาะสมและแลกเปลี่ยนรายละเอียดโครงการที่เปิดเผยได้')],
 'closing':'เริ่มจากโจทย์ที่ทีมคุณอยากแก้ให้สำเร็จ',
 'footer':'ประวัติการทำงานเป็นข้อมูลที่เจ้าของโปรไฟล์ให้ไว้ ผลงานที่ลิงก์แสดงพฤติกรรมของเว็บไซต์ ไม่ใช่หลักฐานยืนยันการจ้างงานหรือผลลัพธ์ธุรกิจจากหน่วยงานอิสระ',
 'languageLabel':'English','other':'/profile/','updated':'ทบทวนโปรไฟล์ 12 พฤศจิกายน 2026'
}}
for lang,d in data.items():
 url=BASE+'/'+d['path']+'/'
 schema={'@context':'https://schema.org','@type':'ProfilePage','@id':url+'#profile','url':url,'inLanguage':lang,'dateModified':UPDATED,'mainEntity':person}
 fits=''.join('<div class="fit-row"><h3>'+E(k)+'</h3><p>'+E(v)+'</p></div>' for k,v in d['fits'])
 jobs=''.join('<div class="career-row"><h3>'+E(k)+'</h3><p>'+E(v)+'</p></div>' for k,v in d['jobs'])
 links=''.join('<li><a href="'+E(u,quote=True)+'">'+E(t)+' <span aria-hidden="true">↗</span></a></li>' for t,u in d['proofs'])
 faqs=''.join('<details><summary>'+E(q)+'</summary><p>'+E(a)+'</p></details>' for q,a in d['questions'])
 schema_json=json.dumps(schema,ensure_ascii=False).replace('<',chr(92)+'u003c')
 page=f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{E(d['title'])}</title><meta name="description" content="{E(d['description'],quote=True)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#100b1b">
<link rel="canonical" href="{url}"><link rel="alternate" hreflang="en" href="{BASE}/profile/"><link rel="alternate" hreflang="th" href="{BASE}/th/profile/"><link rel="alternate" hreflang="x-default" href="{BASE}/profile/">
<meta property="og:type" content="profile"><meta property="og:url" content="{url}"><meta property="og:title" content="{E(d['title'],quote=True)}"><meta property="og:description" content="{E(d['description'],quote=True)}"><meta property="og:image" content="{BASE}/assets/readme/cover-desktop-dark.png"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.png"><link rel="stylesheet" href="/assets/profile/profile.css"><link rel="alternate" type="text/plain" href="/profile/summary.txt" title="Professional profile in plain text">
<script type="application/ld+json">{schema_json}</script>
</head><body><a class="skip" href="#profile">{'ข้ามไปที่โปรไฟล์' if lang=='th' else 'Skip to profile'}</a>
<header><a class="brand" href="/" aria-label="Holyboom showcase"><img src="/assets/favicon.png" width="32" height="32" alt="">holyboom.</a><nav aria-label="{'เปลี่ยนภาษา' if lang=='th' else 'Language'}"><span aria-current="page">{'ไทย' if lang=='th' else 'English'}</span><a href="{d['other']}" lang="{'en' if lang=='th' else 'th'}">{d['languageLabel']}</a></nav></header>
<main id="profile"><section class="intro"><div><p class="place">{E(d['place'])}</p><h1>{E(d['name'])}</h1><p class="alias">{E(d['nickname'])}</p><h2 class="role">{E(d['role'])}</h2><p class="lead">{E(d['lead'])}</p><p>{E(d['intro'])}</p><p class="experience">{E(d['experience'])}</p><div class="actions"><a class="primary" rel="me" href="{LI}">{E(d['contact'])} <span aria-hidden="true">↗</span></a><a href="/">{E(d['showcase'])}</a></div></div><aside><img src="/assets/brain-480.webp" width="480" height="480" alt="HolyMind original neural artwork"><p>Human intent.<br>Connected intelligence.<br>Evidence that matters.</p></aside></section>
<section aria-labelledby="fit-heading"><h2 id="fit-heading">{E(d['fitHeading'])}</h2><div class="fits">{fits}</div><p class="note">{E(d['fitNote'])}</p></section>
<section class="strengths"><h2>{E(d['strengthsHeading'])}</h2><p>{E(d['strengths'])}</p></section>
<section aria-labelledby="work-heading"><h2 id="work-heading">{E(d['workHeading'])}</h2><article class="work"><h3>{E(d['workTitle'])}</h3><p>{E(d['workCopy'])}</p><ul>{links}</ul><p class="note">{E(d['workNote'])}</p></article></section>
<section class="background"><h2>{E(d['backgroundHeading'])}</h2><p>{E(d['backgroundIntro'])}</p><div>{jobs}</div></section>
<section class="questions"><h2>{E(d['questionsHeading'])}</h2>{faqs}</section>
<section class="closing"><h2>{E(d['closing'])}</h2><div class="actions"><a class="primary" href="{LI}">{E(d['contact'])} <span aria-hidden="true">↗</span></a><a href="/profile/summary.txt">{E(d['plain'])}</a></div></section>
</main><footer><p>{E(d['updated'])}</p><p>{E(d['footer'])}</p><a href="{GITHUB}" rel="me">GitHub</a><a href="/">HolyMind showcase</a><a href="{d['other']}">{E(d['languageLabel'])}</a></footer></body></html>'''
 path=ROOT/d['path'];path.mkdir(parents=True,exist_ok=True);(path/'index.html').write_text(page)
# A readable summary, not instructions to any model or a ranking assertion.
en=data['en'];summary='THEERAWEE RANGRAM (BOOM)\nAI Engineer & AI Solutions Architect | Bangkok, Thailand\nธีรวีร์ รางแรม\n\n'+en['intro']+'\n'+en['experience']+'\n\nROLE FIT\n'+'\n'.join(k+': '+v for k,v in en['fits'])+'\n'+en['fitNote']+'\n\nCORE CAPABILITIES\n'+en['strengths']+'\n\nSELECTED EXPERIENCE\n'+'\n\n'.join(k+'\n'+v for k,v in en['jobs'])+'\n\nPUBLIC WORK\n'+en['workCopy']+'\n'+en['workNote']+'\nSource: '+REPO+'\n\nCONTACT\nLinkedIn: '+LI+'\nEnglish profile: '+BASE+'/profile/\nโปรไฟล์ภาษาไทย: '+BASE+'/th/profile/\n\n'+en['footer']+'\n'
(ROOT/'profile/summary.txt').write_text(summary)
# Main-site schema deliberately remains limited to the visibly stated homepage scope.
root_schema={'@context':'https://schema.org','@type':'ProfilePage','@id':BASE+'/#profile','url':BASE+'/','inLanguage':['en','th'],'dateModified':UPDATED,'mainEntity':{**person,'description':'Theerawee Rangram (Boom), AI Engineer and AI Solutions Architect in Bangkok and creator of HolyMind Framework. Business strategy, agentic workflows, evaluation and automation.','knowsAbout':['AI Engineering','AI Solutions Architecture','Agentic AI','AI Transformation','Workflow Automation','LLM Evaluation','Guardrails','HolyMind Framework']}}
(ROOT/'profile-schema.json').write_text(json.dumps(root_schema,ensure_ascii=False,indent=2)+'\n')
(ROOT/'profile/person.json').write_text(json.dumps({'@context':'https://schema.org',**person},ensure_ascii=False,indent=2)+'\n')
print('Built English and Thai profiles with native text, role fit, evidence links and consistent entity identity.')
