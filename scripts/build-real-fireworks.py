"""Edit CC0 field recordings into a bounded first-party firework bank; no synthesized sound."""
from pathlib import Path
import array, math, json, shutil, subprocess, struct, hashlib, wave
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'assets/audio/grand-boom-v22'; SRC=OUT/'source'; SRC.mkdir(parents=True,exist_ok=True)
working=Path('/tmp/holymind-grand-boom-v22/sources')
if working.exists():
    for p in working.glob('*.mp3'):shutil.copyfile(p,SRC/p.name)
    shutil.copyfile(working/'provenance.json',SRC/'provenance.json')
if not (SRC/'provenance.json').exists():raise SystemExit('Source recordings and provenance are required in assets/audio/grand-boom-v22/source')
SR=24000

def extract(name,start,length,hp=600,lp=7200,rate=1.0):
    # A narrow source edit, not a generated waveform or a fake whistle oscillator.
    cmd=['ffmpeg','-v','error','-ss',str(start),'-t',str(length),'-i',str(SRC/(name+'.mp3')),'-af',f'highpass=f={hp}:p=2,lowpass=f={lp}:p=2','-ac','1','-ar',str(SR),'-f','f32le','-']
    a=array.array('f');a.frombytes(subprocess.check_output(cmd))
    if rate!=1:
        o=array.array('f')
        for i in range(int(len(a)/rate)-1):
            x=i*rate;k=int(x);o.append(a[k]+(a[k+1]-a[k])*(x-k))
        a=o
    return a

def level(a,rms=.08,peak=.48):
    g=min(peak/max(1e-8,max(map(abs,a))),rms/max(1e-8,math.sqrt(sum(x*x for x in a)/len(a))))
    return array.array('f',(x*g for x in a))

def fade(a,attack=.006,release=.20):
    n=len(a);att=max(1,int(attack*SR));rel=max(1,int(release*SR))
    return array.array('f',(x*min(1,i/att)**.7*(min(1,(n-1-i)/rel)**1.4) for i,x in enumerate(a)))

def fit(a,seconds):
    n=int(seconds*SR);return a[:n]+array.array('f',[0])*max(0,n-len(a))

def add(a,b,at=0,gain=1):
    offset=int(at*SR)
    for i,x in enumerate(b):
        if offset+i<len(a):a[offset+i]+=x*gain
    return a

def compress_recording(a):
    # Reduce the recorded pop's excessive crest factor without replacing its timbre.
    raw=subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar',str(SR),'-ac','1','-i','pipe:0','-af','acompressor=threshold=0.022:ratio=6:attack=0.1:release=75:makeup=2:knee=4','-f','f32le','-'],input=a.tobytes())
    result=array.array('f');result.frombytes(raw);return result

def save_wav(path,a):
    with wave.open(str(path),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR)
        f.writeframes(b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767)) for x in a))

rows=[];clips={}
whistle_specs=[('whistle-pop',.06,.92,1.04),('whistles',3.65,.59,1.08),('whistle-pop',.12,.84,.99),('whistles',7.36,.63,1.05),('whistle-pop',.03,1.01,1.01)]
for i,(name,at,length,rate) in enumerate(whistle_specs):
    clips['launch:'+str(i)]=fade(level(extract(name,at,length,450,7200,rate),.060,.30),.018,.11)
# Distinct recorded crackle tails; a single recorded pop preserves the physical attack.
pop=level(extract('whistle-pop',1.105,.62,1900,7600),.085,.43)
tail_starts=[39.95,43.57,46.17,52.08,63.07]
lengths=[1.35,.85,1.60,1.00,1.85]
for i,(start,length) in enumerate(zip(tail_starts,lengths)):
    tail=fade(level(extract('crackle',start,length,2200,7400,1.015+(i%2)*.025),.050 if i%2==0 else .038,.25),.035,.35)
    out=array.array('f',[0])*int(length*SR)
    impact=pop if i%2==0 else array.array('f',(x*.75 for x in pop))
    add(out,impact);add(out,tail,.025,.85)
    clips['burst:'+str(i)]=fade(level(compress_recording(out),.042 if i%2==0 else .029,.46),.002,.32)
    # Inward texture: the real crackle tail gathers back into the dot without a fake sine sweep.
    inward=array.array('f',reversed(tail[:int(min(.85,length)*SR)]))
    clips['gather:'+str(i)]=fade(level(inward,.045,.26),.16,.08)
    back=array.array('f',reversed(clips['launch:'+str(i)]))
    clips['return:'+str(i)]=fade(level(back,.035,.20),.08,.12)
clips['charge:0']=fade(level(extract('whistle-pop',.02,.32,900,6500),.018,.10),.05,.08)
clips['glitter:0']=fade(level(extract('crackle',40.15,1.40,2100,7100),.032,.22),.05,.45)
clips['recall:0']=fade(array.array('f',reversed(clips['glitter:0'][:int(.90*SR)])),.20,.10)
clips['seal:0']=fade(level(extract('crackle',40.34,.24,1500,6400),.020,.12),.012,.11)
parts=[];frame_offset=0
for key,a in clips.items():
    kind,index=key.split(':');file=key.replace(':','-')+'.wav';save_wav(OUT/file,a)
    data=b''.join(struct.pack('<h',round(max(-1,min(1,x))*32767)) for x in a);parts.append(data)
    rows.append({'key':key,'kind':kind,'index':int(index),'file':file,'offset':frame_offset,'frames':len(a),'duration':len(a)/SR,'peak':max(map(abs,a)),'rms':math.sqrt(sum(x*x for x in a)/len(a)),'first':a[0],'last':a[-1],'source':'CC0 recorded fireworks, edited, EQ and fades only','notes':[]})
    frame_offset+=len(a)
bank=b''.join(parts);(OUT/'fireworks.pcm').write_bytes(bank)
meta={'version':'grand-boom-v22','sampleRate':SR,'format':'mono PCM16 little-endian','bytes':len(bank),'sha256':hashlib.sha256(bank).hexdigest(),'clips':rows,'sources':json.loads((SRC/'provenance.json').read_text()),'edits':{'launch':'Recorded rocket whistle; slight rate variations, 450 Hz high-pass and 7.2 kHz low-pass','burst':'Recorded impact plus recorded irregular high crackle; 1900 / 2200 Hz high-pass, 7.4–7.6 kHz low-pass; no sine or oscillator layer','return':'Short re-enveloped reversed excerpts of recorded whistle/crackle; no reversed piano','mix':'No normalization of the entire website. Existing piano, ambience and line-current unchanged.'}}
(OUT/'bank.json').write_text(json.dumps(meta,indent=2)+'\n')
# Audition retains the actual levels; no independent normalization.
reel=array.array('f',[0])*int(7.1*SR)
for i,t in enumerate([.25,1.05,1.90,2.80,3.65]):
    add(reel,clips['launch:'+str(i)],t,.82*.56*.48)
    add(reel,clips['burst:'+str(i)],t+.60,.82*(.88 if i%2==0 else .66)*.48)
add(reel,clips['glitter:0'],4.65,.82*.50*.48)
save_wav(OUT/'five-fireworks-preview.wav',reel)
(OUT/'ATTRIBUTION.md').write_text('''# Grand Boom — recorded firework sources\n\nAll source recordings are CC0 1.0 as stated on their Freesound author pages.\n\n- Rudmer_Rotteveel — Whistle and Explosion Single_Firework (336008): https://freesound.org/people/Rudmer_Rotteveel/sounds/336008/\n- 16FThumaF — Fireworks Crackle (505264): https://freesound.org/people/16FThumaF/sounds/505264/\n- cupido-1 — fireworks whistle.WAV (456316): https://freesound.org/people/cupido-1/sounds/456316/\n\nLicense: https://creativecommons.org/publicdomain/zero/1.0/\nDownloaded representations: the authors’ public HQ MP3 previews, not the original lossless WAVs. Source URLs and SHA256 hashes are in source/provenance.json.\n\nHolyMind edits: short excerpts, mono conversion, resampling, high-pass/low-pass EQ, level balancing, modest playback-rate variation, light transient compression and finite fades. Recorded whistle/pop and crackle excerpts are layered for five distinct outward bursts. Inward cues use re-enveloped reversed excerpts; these are an artistic time-reversal effect, not recordings of a physical inward explosion. No synthesized oscillators, AI sound model, piano, or generated noise is present in the firework bank. The existing piano music is a separate unchanged licensed system. No source-author endorsement is implied.\n''')
print(json.dumps({'clips':len(rows),'bytes':len(bank),'maxPeak':max(r['peak'] for r in rows),'previewPeak':max(map(abs,reel))}))
