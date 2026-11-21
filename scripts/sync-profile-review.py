"""Keep every canonical copy surface aligned with the reviewed ID catalogue."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1];rows=json.loads((ROOT/'scripts/data/profile-gemini-copy.json').read_text())['items']
for lang,field in [('en','english'),('th','thai')]:
 path=ROOT/('scripts/data/profile-story'+('.th' if lang=='th' else '')+'.json');story=json.loads(path.read_text());chapters={c['id']:c for c in story['chapters']};work={c['id']:c for c in story['workPaths']}
 for row in rows:
  value=row[field];kind=row['kind']
  if kind.startswith('Story / '):
   k=kind.split(' / ')[1];c=chapters[row['section']];c[k]=(value.split('\n\n') if value else []) if isinstance(c[k],list) else value
  elif kind=='Closing quotation':story['closingQuote']=value
  elif row['section'].startswith('work / '):
   target=work[row['section'].split(' / ')[1]];pathpart=row['sourceEn'].split(' :: ')[1].split('.',2)[2];keys=[int(b) if b else a for a,b in re.findall(r'([^.[\]]+)|\[(\d+)\]',pathpart)]
   for k in keys[:-1]:target=target[k]
   target[keys[-1]]=value
  elif kind.startswith('Animation / '):
   chapter=int(re.search(r'chapter (\d+)',row['sourceEn'])[1]);beat=int(re.search(r'beat (\d+)',row['sourceEn'])[1]);k=kind.split(' / ')[1]
   if chapter in (0,9,10):continue
   next(c for c in story['chapters'] if c['scene']==chapter)['beats'][beat][k]=value
 story['release']='living-human-motion-v27';path.write_text(json.dumps(story,ensure_ascii=False,indent=2)+'\n')
skillpath=ROOT/'assets/skills.json';skills=json.loads(skillpath.read_text());byid={s['id']:s for s in skills}
for row in rows:
 if row['kind']=='Skill purpose':
  key=row['sourceEn'].split(' :: ')[1].rsplit('.',1)[0];byid[key]['purpose']=row['english'];byid[key]['concept_th']=row['thai']
skillpath.write_text(json.dumps(skills,ensure_ascii=False,indent=2)+'\n')
print('Synchronized canonical story, scene beats, and skill purposes with Gemini review.')
