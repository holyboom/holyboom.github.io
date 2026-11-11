/* Long recorded attacks/decays for sustained score voices. Preserve 6 seconds. */
const fs=require('fs'),cp=require('child_process'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../assets/audio/scroll-score-v17'),sr=24000,frames=sr*6;
const notes=[['A2',45],['C3',48],['Fs3',54],['A3',57],['C4',60],['Fs4',66],['A4',69],['C5',72],['Ds5',75],['Fs5',78],['A5',81]],parts=[],rows=[];
for(const [note,midi] of notes){
 const input=root+'/source/'+note+'.mp3',raw=cp.execFileSync('ffmpeg',['-v','error','-i',input,'-af','pan=mono|c0=c0','-ar',String(sr),'-f','f32le','-'],{maxBuffer:10000000});
 const values=new Float32Array(raw.length/4);for(let i=0;i<values.length;i++)values[i]=raw.readFloatLE(i*4);
 let peak=0;for(let i=0;i<Math.min(sr,values.length);i++)peak=Math.max(peak,Math.abs(values[i]));let start=0;while(start<sr*.06&&Math.abs(values[start])<peak*.012)start++;start=Math.max(0,start-48);
 let en=0;for(let i=0;i<sr*.22;i++)en+=values[start+i]**2;
 const gain=Math.min(3.2,.16/Math.max(.001,Math.sqrt(en/(sr*.22))),.59/Math.max(.001,peak)),data=Buffer.alloc(frames*2);let sum=0,max=0;
 for(let i=0;i<frames;i++){const fade=Math.min(1,i/24,(frames-1-i)/(sr*.8)),v=(values[start+i]||0)*gain*Math.max(0,fade);data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),i*2);sum+=v*v;max=Math.max(max,Math.abs(v));}
 rows.push({note,midi,frames,sampleRate:sr,trimmedStartSamples:start,sourceChannel:'left',gain,peak:max,rms:Math.sqrt(sum/frames),sha256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex')});parts.push(data);
}
const buffer=Buffer.concat(parts);fs.writeFileSync(root+'/keys.pcm',buffer);fs.writeFileSync(root+'/bank.json',JSON.stringify({sampleRate:sr,framesPerNote:frames,durationPerNote:6,format:'PCM16 little endian mono',notes:rows,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')},null,2));
fs.writeFileSync(root+'/ATTRIBUTION.md','# Long piano sample bank\n\nSalamander Grand Piano recordings by Alexander Holm, distributed by Tonejs/audio under CC BY 3.0 Unported: https://creativecommons.org/licenses/by/3.0/ . Source: https://github.com/Tonejs/audio/tree/master/salamander .\n\nChanges: eleven recorded pitches selected; left microphone channel; leading silence trimmed, resampled to 24 kHz mono PCM16; level-adjusted; six-second natural sample decays retained with a final 800 ms fade. Nearby pitches are transposed at playback, with authored envelopes, filtering and reverberation. Original recording notices and URL/hash provenance are in source/. No endorsement is implied.\n\nThese samples are CC BY 3.0; derived Mozart score/arrangement and musical previews use the score attribution and CC BY-SA 3.0 in assets/score/mozart-k545/ATTRIBUTION.md.\n');console.log(JSON.stringify({notes:rows.length,secondsPerKey:6,bytes:buffer.length}));
