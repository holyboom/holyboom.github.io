"""Lengthen recorded firework tails while preserving the approved leading attacks.
Sources are the existing v22 self-hosted CC0 HQ previews; no new synthesized signal.
"""
from pathlib import Path
import array,math,json,subprocess,struct,hashlib,wave,runpy
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT/'assets/audio/grand-boom-v22';OUT=ROOT/'assets/audio/afterglow-v23';OUT.mkdir(parents=True,exist_ok=True);SR=24000

def read(path):
 with wave.open(str(path),'rb') as w:
  assert w.getframerate()==SR and w.getnchannels()==1
  b=w.readframes(w.getnframes());return array.array('f',(n[0]/32768 for n in struct.iter_unpack('<h',b)))
def save(path,a):
 with wave.open(str(path),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767)) for x in a))
def smooth(t):
 t=max(0,min(1,t));return t*t*(3-2*t)
def add(a,b,at=0,gain=1):
 off=round(at*SR)
 for i,x in enumerate(b):
  if off+i<len(a):a[off+i]+=x*gain
 return a

def recorded_tail(start,length,rms=.017,peak=.095):
 cmd=['ffmpeg','-v','error','-ss',str(start),'-t',str(length),'-i',str(OLD/'source/crackle.mp3'),'-af','highpass=f=2200:p=2,lowpass=f=7100:p=2,acompressor=threshold=0.013:ratio=5:attack=0.5:release=90:makeup=1:knee=4','-ac','1','-ar',str(SR),'-f','f32le','-']
 a=array.array('f');a.frombytes(subprocess.check_output(cmd));n=round(length*SR);a=a[:n]+array.array('f',[0])*max(0,n-len(a))
 gain=min(rms/max(1e-9,math.sqrt(sum(x*x for x in a)/n)),peak/max(1e-9,max(map(abs,a))))
 # Long recorded tail: a smooth arrival, gradually lower energy and zero at the end.
 for i in range(n):
  u=i/max(1,n-1);env=smooth((i/SR)/.20)*(.90-.20*u)*(1-smooth((u-.48)/.52));a[i]*=gain*env
 return a
oldmeta=json.loads((OLD/'bank.json').read_text());clips={r['key']:read(OLD/r['file']) for r in oldmeta['clips']}
lengths=[2.25,1.45,2.75,1.75,3.70];starts=[40.20,43.78,46.36,52.31,63.32]
for i,seconds in enumerate(lengths):
 old=clips[f'burst:{i}'];out=array.array('f',[0])*round(seconds*SR);add(out,old)
 # 180 ms unchanged physical attack, then an additional real crackling decay.
 tail=recorded_tail(starts[i],seconds-.18,.026 if i==4 else .015 if i%2==0 else .010,.14 if i==4 else .085)
 add(out,tail,.18)
 # Low wet reflections are copies of that recording, not oscillator/noise synthesis.
 for delay,gain in [(.071,.075),(.143,.040),(.229,.020)]:add(out,tail,.18+delay,gain)
 for j in range(round(.18*SR),len(out)):out[j]*=(1-smooth((j/SR-(seconds-.65))/.65))
 clips[f'burst:{i}']=out
old=clips['glitter:0'];seconds=4.20;out=array.array('f',[0])*round(seconds*SR);add(out,old)
tail=recorded_tail(52.08,4.02,.022,.11);add(out,tail,.18)
for delay,gain in [(.091,.10),(.179,.045)]:add(out,tail,.18+delay,gain)
for i in range(len(out)):out[i]*=1-smooth((i/SR-3.35)/.85)
clips['glitter:0']=out
rows=[];parts=[];offset=0
for key,a in clips.items():
 assert a and all(math.isfinite(x) for x in a) and max(map(abs,a))<.6
 kind,index=key.split(':');file=key.replace(':','-')+'.wav';save(OUT/file,a)
 raw=b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767)) for x in a);parts.append(raw)
 def energy(start,end):
  s=a[round(start*SR):round(end*SR)];return math.sqrt(sum(x*x for x in s)/max(1,len(s)))
 rows.append({'key':key,'kind':kind,'index':int(index),'file':file,'offset':offset,'frames':len(a),'duration':len(a)/SR,'peak':max(map(abs,a)),'rms':energy(0,len(a)/SR),'lateRms':energy(max(0,len(a)/SR-1),max(.1,len(a)/SR-.35)),'first':a[0],'last':a[-1],'source':'existing CC0 recordings; preserved attacks, longer recorded crackle and finite fades','notes':[]});offset+=len(a)
raw=b''.join(parts);(OUT/'fireworks.pcm').write_bytes(raw)
meta={'version':'afterglow-v23','sampleRate':SR,'format':'mono PCM16 little-endian','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'clips':rows,'sources':oldmeta['sources'],'originalSourceDirectory':'../grand-boom-v22/source','edits':{'attack':'First 180 ms of all five accepted v22 recorded bursts preserved exactly before PCM quantization.','tail':'Additional real CC0 crackle excerpts, upper-band EQ/compression, gentle recorded reflections, smooth non-looping finite fades.','durationSeconds':lengths,'glitterDurationSeconds':4.2,'notChanged':'Launch, reverse/gather/return, charge and seal source clips; score/piano, background and line current.'}}
(OUT/'bank.json').write_text(json.dumps(meta,indent=2)+'\n')
for name,version in [('before',False),('after',True)]:
 reel=array.array('f',[0])*round(10.2*SR)
 for i,t in enumerate([.25,1.05,1.90,2.80,3.65]):
  launch=clips[f'launch:{i}'];burst=clips[f'burst:{i}'] if version else read(OLD/f'burst-{i}.wav')
  add(reel,launch,t,.82*.56*.48);add(reel,burst,t+.60,.82*(.88 if i%2==0 else .66)*.48)
 add(reel,clips['glitter:0'] if version else read(OLD/'glitter-0.wav'),4.65,.82*.50*.48)
 save(OUT/f'{name}-tail-preview.wav',reel)
(OUT/'ATTRIBUTION.md').write_text((OLD/'ATTRIBUTION.md').read_text()+'\n\n## Afterglow v23 edits\nSame three CC0 source recordings and hashes as ../grand-boom-v22/source/provenance.json. New longer high-band recorded crackle tails and low-level short reflections, non-uniform large/small durations and a four-point-two-second glitter fade. The original burst attacks, recorded source identities and license remain unchanged. This is not a live recording of a single firework; it is an authored edit of those real recordings. No generated noise, oscillator or piano was added.\n')
print(json.dumps({'clips':len(rows),'bytes':len(raw),'burstSeconds':lengths,'glitterSeconds':4.2,'maxPeak':max(r['peak'] for r in rows)}))
