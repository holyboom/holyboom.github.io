"""Extract a reproducible excerpt from the attributed Mutopia MIDI. No MIDI runtime."""
from pathlib import Path
import struct,json,hashlib
p=Path(__file__).resolve().parent.parent/'assets/score/mozart-k545';data=(p/'K545-1.mid').read_bytes()
assert data[:4]==b'MThd'
length=struct.unpack('>I',data[4:8])[0];fmt,tracks,ppq=struct.unpack('>HHH',data[8:14]);at=8+length
rows=[];metas=[]
for tr in range(tracks):
 assert data[at:at+4]==b'MTrk'
 n=struct.unpack('>I',data[at+4:at+8])[0];b=data[at+8:at+8+n];at+=8+n;i=t=0;running=None;active={}
 def vlq():
  global i
  v=0
  while True:
   x=b[i];i+=1;v=(v<<7)|(x&127)
   if not x&128:return v
 while i<len(b):
  t+=vlq();status=b[i]
  if status&128:i+=1;running=status if status<240 else running
  else:status=running
  if status==255:
   typ=b[i];i+=1;sz=vlq();val=b[i:i+sz];i+=sz
   if typ in [3,81,88]:metas.append({'track':tr,'tick':t,'type':typ,'value':list(val) if typ!=3 else val.decode(errors='replace')})
   continue
  if status in [240,247]:sz=vlq();i+=sz;continue
  ch=status&15;op=status>>4;one=b[i];i+=1;two=0
  if op not in [12,13]:two=b[i];i+=1
  if op==9 and two>0:active.setdefault((ch,one),[]).append((t,two))
  if op==8 or (op==9 and two==0):
   q=active.get((ch,one),[])
   if q:
    start,vel=q.pop(0);rows.append({'beat':round(start/ppq,6),'duration':round((t-start)/ppq,6),'midi':one,'velocity':vel,'track':tr,'channel':ch})
rows.sort(key=lambda x:(x['beat'],x['track'],x['midi']))
print(json.dumps({'format':fmt,'tracks':tracks,'ppq':ppq,'meta':metas[:12],'first':rows[:30],'last':rows[-3:]},indent=2))
(p/'parsed-midi.json').write_text(json.dumps({'ppq':ppq,'events':rows,'meta':metas},indent=2))
# Preserve the first twelve complete bars. Add a clearly labelled two-bar G-to-C
# cadence so an interactive repeat lands musically rather than at a cut-off point.
events=[{'beat':x['beat'],'duration':x['duration'],'midi':x['midi'],'velocity':x['velocity'],'hand':'melody' if x['track']==1 else 'accompaniment','source':'Mozart / Mutopia'} for x in rows if x['beat']<48]
for beat,note,dur,hand,vel in [(48,71,1,'melody',70),(49,74,1,'melody',68),(50,67,2,'melody',65),(48,43,2,'accompaniment',56),(48,59,2,'accompaniment',53),(48,62,2,'accompaniment',53),(50,55,2,'accompaniment',51),(50,59,2,'accompaniment',51),(50,62,2,'accompaniment',51),(52,72,3.5,'melody',68),(52,48,3.5,'accompaniment',54),(52,64,3.5,'accompaniment',48),(52,67,3.5,'accompaniment',48)]:
 events.append({'beat':beat,'duration':dur,'midi':note,'velocity':vel,'hand':hand,'source':'HolyMind closing cadence'})
events.sort(key=lambda x:(x['beat'],0 if x['hand']=='melody' else 1,x['midi']))
chords=[[60,64,67],[59,62,65,67],[60,65,69],[59,62,67],[53,57,60],[52,55,60],[50,53,59],[48,52,55],[53,57,62],[54,57,60,62],[55,59,62],[55,59,62],[55,59,62],[60,64,67]]
score={'version':'scroll-score-v17','title':'Sonata in C major, K.545 — opening with HolyMind cadence','composer':'Wolfgang Amadeus Mozart','sourceBars':12,'arrangedCadenceBars':2,'beatsPerBar':4,'totalBeats':56,'tempoRange':[78,100],'license':'CC BY-SA 3.0','transcription':'Alejandro Sierra / Mutopia Project, 2013-09-01','sourceURL':'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=998','modifications':'First twelve bars extracted without pitch/order changes; two original closing bars, softer dynamics, slower scroll-controlled tempo, sampled piano and interactive phrasing.','events':events,'chords':chords}
(p/'opening.json').write_text(json.dumps(score,indent=2))
root=p.parents[2];(root/'mozart-score-data.js').write_text('/* Mozart K.545 / Alejandro Sierra, Mutopia — CC BY-SA 3.0. See assets/score/mozart-k545/ATTRIBUTION.md */\n(function(r){const s='+json.dumps(score,separators=(',',':'))+';if(typeof module!=="undefined"&&module.exports)module.exports=s;else r.HolyMindMozartScore=Object.freeze(s);})(globalThis);\n')
(p/'ATTRIBUTION.md').write_text('''# Score and arrangement credits\n\nComposition: Wolfgang Amadeus Mozart, Piano Sonata in C major K.545, first movement (Allegro). The composition is public domain.\n\nDigital transcription: Alejandro Sierra / Mutopia Project, Mutopia-2013/09/01-998, distributed under Creative Commons Attribution-ShareAlike 3.0 Unported.\nSource: https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=998\nLicense: https://creativecommons.org/licenses/by-sa/3.0/\n\nHolyMind adaptation: the first twelve complete bars extracted from the distributed MIDI, followed by two newly arranged G-to-C closing bars. Tempo is slowed and bounded for user-controlled scrolling, dynamics are softened, and section material changes affect piano colour rather than note order. Music continues chronologically in either scroll direction; it is not reversed audio.\n\nThe derived score data, this arrangement and rendered musical previews are offered under CC BY-SA 3.0. Source files, source hashes and extraction script are included. Piano recordings have their separate CC BY 3.0 attribution in assets/audio/scroll-score-v17/ATTRIBUTION.md. No endorsement is implied.\n''')
print('SCORE',len(events),'notes,',len(chords),'bars; melody opening',[x['midi'] for x in events if x['hand']=='melody'][:8])
