"""Shared progressive-enhancement profile with independently authored native stories."""
import html, json
from pathlib import Path
from profile_locales import localize_th
ROOT = Path(__file__).resolve().parents[1]
E = html.escape

def render(head, data, lang='en'):
    story = json.loads((ROOT/('scripts/data/profile-story.th.json' if lang=='th' else 'scripts/data/profile-story.json')).read_text())
    release = story['release']
    skills = json.loads((ROOT/'assets/skills.json').read_text())
    (ROOT/'assets/profile/finale-data.js').write_text('window.ProfileFinaleData='+json.dumps(skills,ensure_ascii=False).replace('<',chr(92)+'u003c')+';\n')
    scene_total = 3 + sum(len(c['beats']) for c in story['chapters'])
    head = head.replace('/assets/profile/profile.css', '/assets/profile/living.css?v='+release)
    head = head.replace('#100b1b', '#0B0912')
    head = head.replace('</head>', f'''<script>document.documentElement.dataset.profileMotion='full';document.documentElement.classList.add('profile-boot');setTimeout(()=>document.documentElement.classList.remove('profile-boot'),4000)</script><link rel="preload" href="/assets/fonts/instrument-serif.woff2" as="font" type="font/woff2" crossorigin>
<script defer src="/assets/profile/scenes.js?v={release}"></script>
<script defer src="/assets/profile/performance-source/pilot-clips.js?v={release}"></script>
<script defer src="/assets/profile/hand-shapes.js?v={release}"></script>
<script defer src="/assets/profile/motion.js?v={release}"></script>
<script defer src="/assets/profile/floors.js?v={release}"></script>
<script defer src="/assets/profile/geometry.js?v={release}"></script>
<script defer src="/assets/profile/finale-data.js?v={release}"></script>
<script defer src="/assets/profile/finale-acting.js?v={release}"></script>
<script defer src="/assets/profile/finale.js?v={release}"></script>
<script defer src="/assets/profile/cinematic-lines.js?v={release}"></script>
<script defer src="/assets/profile/reading-thread.js?v={release}"></script>
<script defer src="/assets/profile/living.js?v={release}" onerror="document.documentElement.classList.remove('profile-boot')"></script>
</head>''')
    if lang == 'th':
        head = head.replace('<script defer src="/assets/profile/performance-source/', f'<script defer src="/assets/profile/locale-th.js?v={release}"></script>\n<script defer src="/assets/profile/performance-source/', 1)
        head = head.replace('/assets/fonts/instrument-serif.woff2', '/assets/fonts/noto-serif-thai.woff2')
        head = head.replace('</head>', f'<link rel="stylesheet" href="/assets/profile/th.css?v={release}"></head>')
    def figure(scene, label, hero=False):
        return f'<figure class="scene-fallback"><img src="/assets/profile/fallback/scene-{scene}.svg?v={release}" width="720" height="720" alt="{E(label,quote=True)}" {"fetchpriority=high" if hero else "loading=lazy"}><figcaption>Living architecture · {scene:02d}</figcaption></figure>'
    def work_paths():
        cards=[]
        symbols=['<path d="M9 23C9 11 17 7 24 7S39 11 39 23 31 39 24 39 9 35 9 23Z"/><path d="m16 24 5 5 12-13"/>', '<circle cx="15" cy="24" r="6"/><circle cx="34" cy="14" r="5"/><circle cx="34" cy="34" r="5"/><path d="M21 22Q25 15 29 14M21 26Q25 33 29 34"/>', '<path d="M10 32C10 14 17 8 24 8S38 14 38 32M10 32Q24 43 38 32M24 14v18m-6-6 6 6 6-6"/>']
        for index,item in enumerate(story['workPaths']):
            steps=''.join(f'<li><h3>{E(title)}</h3><p>{E(copy)}</p></li>' for title,copy in item['steps'])
            links=''.join(f'<a href="{E(url,quote=True)}">{E(label)} <span aria-hidden="true">↗</span></a>' for label,url in item['links'])
            cards.append(f'<details class="work-path" id="work-{item["id"]}" data-tone="{item["tone"]}"><summary><svg class="path-symbol" viewBox="0 0 48 48" aria-hidden="true">{symbols[index]}</svg><span><b>{E(item["title"])}</b><small>{E(item["hook"])}</small></span><i class="path-expand" aria-hidden="true"></i></summary><ol class="proof-route">{steps}<li><h3>Explore the work</h3><div class="path-links">{links}</div></li></ol></details>')
        return '<div class="work-paths" id="work-paths"><p class="eyebrow">FOLLOW A CAPABILITY INTO THE WORK</p>'+''.join(cards)+'</div>'
    skill_groups=[]
    for category,label in [('reason','Reason'),('build','Build'),('verify','Verify')]:
        rows=''.join('<li><b>'+E(skill['name'])+'</b><span>'+E(skill['concept_th'] if lang=='th' else skill['purpose'])+'</span></li>' for skill in skills if skill['category']==category)
        skill_groups.append('<section><h3>'+label+'</h3><ul>'+rows+'</ul></section>')
    finale_notes='<div class="finale-notes"><div class="finale-caption"><p class="finale-skill-name">HolyMind</p><p class="finale-skill-purpose">'+('34 สกิลที่ค่อย ๆ พัฒนาจากการลงมือทำ' if lang=='th' else '34 skills shaped through practice.')+'</p></div><details class="finale-catalog"><summary>'+('อ่านสกิลทั้ง 34 รายการ' if lang=='th' else 'Read all 34 skills')+'</summary><div>'+''.join(skill_groups)+'</div></details><a class="capability-link" href="/#framework">'+('สำรวจสกิลใน HolyMind' if lang=='th' else 'Explore the HolyMind collection')+' ↗</a></div>'
    chapters=[]
    for chapter_index,c in enumerate(story['chapters']):
        paras = ''.join('<p>'+E(p)+'</p>' for p in c['paragraphs'])
        career = ('<p class="career-context" data-career-context><span class="career-company">'+E(data['jobs'][c['careerIndex']][0])+'</span>'+E(data['jobs'][c['careerIndex']][1])+'</p>') if 'careerIndex' in c else ''
        period = '<p class="story-era">'+(f'<time datetime="{E(c["year"],quote=True)}">{E(c["yearLabel"])}</time>' if 'year' in c else '')+'<span>'+E(c['period'])+'</span></p>'
        extras = '<blockquote>'+E(c['quote'])+'</blockquote>' if 'quote' in c else ''
        if 'steps' in c:
            extras += '<ol class="craft-steps">'+''.join('<li>'+E(s)+'</li>' for s in c['steps'])+'</ol><p class="caption">A visual metaphor for learning and synthesis. The scenes are symbolic, not documentary recreations.</p>'
            extras += '<a class="capability-link" href="#work-paths">Follow these capabilities into the work <span aria-hidden="true">↓</span></a>'
        if c['id']=='ai-experiences':
            extras += '''<details class="beneath" id="beneath"><summary>Explore beneath the surface <span aria-hidden="true">↗</span></summary><div class="layers"><div><b>01 / Experience</b><p>A clear starting point, meaningful feedback, and a next step you can understand.</p></div><div><b>02 / Orchestration</b><p>Applications, models, and tools connected around the task.</p></div><div><b>03 / Review &amp; access</b><p>Explicit permissions, inspectable sources, and human review paths.</p></div></div><p class="caption">An illustration of my design approach, not a live system diagram.</p></details>'''
        if c['id']=='work-heading':
            extras += work_paths()
            extras += '<div class="proof-links">'+''.join(f'<a href="{E(u,quote=True)}">{E(t)} <span aria-hidden="true">↗</span></a>' for t,u in data['proofs'])+'</div>'
        next_id = story['chapters'][chapter_index+1]['id'] if chapter_index+1<len(story['chapters']) else 'experience'
        passage = '<div class="finale-passage" aria-hidden="true"><i></i><i></i><i></i></div>' if c['id']=='work-heading' else ''
        bridge = passage + f'<a class="story-bridge" href="#{next_id}"><span class="bridge-thread" aria-hidden="true"></span><span class="bridge-copy">{E(c["bridge"])}<strong>{E(c["hook"])}</strong></span><span class="bridge-arrow" aria-hidden="true">↓</span></a>'
        beats = '<ol class="scene-sequence" aria-label="Scenes in this chapter">'+''.join(f'<li data-story-beat="{c["scene"]}:{i}" data-tone="{b["tone"]}"><span>{i+1:02d}</span>{E(b["action"])}</li>' for i,b in enumerate(c['beats']))+'</ol>'
        tags = ''.join('<span>'+E(t)+'</span>' for t in c['tags'])
        title = '<br>'.join(E(s) for s in c['title'].split('\n'))
        chapters.append(f'''<section class="chapter" id="{c['id']}" data-scene="{c['scene']}" data-story-era="{c['era']}" aria-labelledby="title-{c['id']}"><div class="chapter-copy"><p class="eyebrow">{E(c['eyebrow'])}</p>{period}<h2 id="title-{c['id']}">{title}</h2><p class="lede">{E(c['lede'])}</p>{beats}{paras}{career}{extras}<div class="tags">{tags}</div>{bridge}</div>{figure(c['scene'],c['sceneDescription'])}</section>''')
    rail = ''.join(f'<a href="#{c[0]}" aria-label="{c[1]}" title="{c[1]}"><span>{i:02d}</span></a>' for i,c in enumerate([('intro','Present')]+[(c['id'],c['eyebrow'].split(' / ')[1].title()) for c in story['chapters']]))
    jobs=''.join(f'<article class="career-row"><span class="row-number">0{i+1}</span><div><h3>{E(k)}</h3><p>{E(v)}</p></div></article>' for i,(k,v) in enumerate(data['jobs']))
    fits=''.join(f'<div class="fit-row"><h3>{E(k)}</h3><p>{E(v)}</p></div>' for k,v in data['fits'])
    faq=''.join(f'<details><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q,a in data['questions'])
    page = head + f'''<body class="living-profile">
<a class="skip" href="#profile">Skip to profile</a>
<header class="site-header"><a class="brand" href="/" aria-label="Holyboom showcase"><img src="/assets/favicon.png" alt="" width="26" height="26">holyboom<span>.</span></a><nav aria-label="Main"><a href="#origins">Story</a><a href="#work-heading">Work</a><a href="#experience">Experience</a><a href="#contact">Contact <span aria-hidden="true">↗</span></a></nav><div class="header-tools"><a href="/th/profile/" lang="th">ไทย</a></div></header>
<main id="profile">
<div class="journey" id="journey"><div class="stage" aria-hidden="true"><div class="stage-frame"><div class="stage-top"><span>HOLYMIND / A HUMAN STORY IN CODE</span><span class="stage-count">01 / {scene_total} SCENES</span></div><img class="stage-poster" src="/assets/profile/fallback/scene-0.svg?v={release}" width="720" height="720" alt=""><canvas id="architecture" aria-hidden="true"></canvas><div class="scene-transition"><span class="transition-copy">Imagine</span><span class="transition-track"><i></i></span></div><div class="scene-meaning">Imagination · 1 / 1</div><div class="scene-caption">A world begins at the end of a drawn line.</div><div class="stage-bottom"><span class="scene-label">00 / A MIND AT WORK</span><span>SCROLL TO CONTINUE ↓</span></div></div></div>
<nav class="chapter-rail" aria-label="Story chapters">{rail}</nav>
<section class="chapter hero" id="intro" data-scene="0" aria-labelledby="hero-title"><div class="chapter-copy"><p class="eyebrow"><span class="status-dot"></span> BANGKOK, THAILAND / THEERAWEE RANGRAM</p><h1 id="hero-title">An architect<br>at heart.<br><em>An engineer<br>by craft.</em></h1><p class="hero-hook">Before I built systems,<br>I imagined spaces for people.</p><p class="hero-role">Boom · AI Engineer &amp; AI Solutions Architect</p><p class="hero-description">I design and build <strong>AI experiences</strong> that make complex work feel clear, intuitive, and engaging.</p><div class="actions"><a class="primary" href="#origins">Follow the first line <span aria-hidden="true">↓</span></a><a class="text-link" href="#experience">Experience at a glance <span aria-hidden="true">↗</span></a></div><div class="hero-facts"><span>9+ years in software delivery</span><a href="https://www.linkedin.com/in/boom-theerawee" rel="me">Connect on LinkedIn ↗</a></div></div>{figure(0,'A luminous purple woven membrane folds above a flowing network landscape.',True)}<div class="hero-note"><span>ONE PERSON. ONE DRAWN LINE. A WORLD OF POSSIBILITIES.</span><span>01 / THE STORY BELOW ↓</span></div></section>
{''.join(chapters)}
</div>
<section class="professional section-shell" id="experience" data-scene="9" aria-labelledby="experience-title"><div class="section-heading"><p class="eyebrow">09 / THE PROFESSIONAL VIEW</p><h2 id="experience-title">Experience,<br><em>at a glance.</em></h2>{figure(9,'The maker stands and reflects on the experience behind the work.').replace('class="scene-fallback"','class="scene-fallback reflection-art"').replace('</figure>','<div class="finale-phase"></div></figure>')}<p>Selected experience, most recent first. Detailed CV and project context are available in a recruiter conversation.</p>{finale_notes}</div><div class="career-list">{jobs}</div>
<div class="contribution"><h2 id="fit-heading">Where I can contribute</h2><div class="fits">{fits}</div><p class="caption">{E(data['fitNote'])}</p></div><div class="questions"><h2>For recruiters &amp; teams</h2>{faq}</div></section>
<section class="contact section-shell" id="contact" data-scene="10" aria-labelledby="contact-title"><div><p class="eyebrow">10 / THE NEXT CHAPTER</p><blockquote class="closing-line">{E(story['closingQuote'])}</blockquote><h2 id="contact-title">What could we<br><em>make possible?</em></h2><p>Bring the problem your team is trying to solve. Let’s explore an AI experience people can understand, trust, and want to use.</p><div class="actions"><a class="primary" href="https://www.linkedin.com/in/boom-theerawee">Let’s talk on LinkedIn <span aria-hidden="true">↗</span></a><a class="text-link" href="/profile/summary.txt">Read the plain-text profile ↗</a></div><a class="return-to-line" href="#origins">Return to the first line <span aria-hidden="true">↑</span></a></div>{figure(10,'The symbolic maker opens a curved woven space for people, recalling the first architectural drawing.')}</section>
</main><footer class="site-footer"><div><a class="brand" href="/">holyboom.</a><p>An architect at heart. An engineer by craft.</p></div><div class="footer-links"><a href="https://github.com/holyboom" rel="me">GitHub ↗</a><a href="/">HolyMind showcase ↗</a><a href="/th/profile/" lang="th">ภาษาไทย ↗</a></div><p class="caption">Profile updated {E(story['updated'])}. {E(data['footer'])}</p></footer>
</body></html>'''

    if lang == 'th':
        page = localize_th(page)
        page = page.replace('Profile updated '+E(story['updated'])+'.', E(data['updated'])+'.')
    return page.replace('↗', '<i class="arrow-ne" aria-hidden="true"></i>')
