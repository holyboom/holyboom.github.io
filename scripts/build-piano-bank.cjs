/* Trim licensed real piano recordings into one first-party PCM bank. */
const fs=require('fs'),cp=require('child_process'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../assets/audio/piano-v16'),sr=32000,frames=57600,notes=[['A3',57],['C4',60],['Ds4',63],['Fs4',66],['A4',69],['C5',72],['Ds5',75]],parts=[],rows=[];
for(const [note,midi] of notes){
 const input=root+'/source/'+note+'.mp3';const raw=cp.execFileSync('ffmpeg',['-v','error','-i',input,'-af','pan=mono|c0=c0','-ar',String(sr),'-f','f32le','-'],{maxBuffer:10000000});
 const values=new Float32Array(raw.length/4);for(let i=0;i<values.length;i++)values[i]=raw.readFloatLE(i*4);
 let peak=0;for(let i=0;i<Math.min(sr,values.length);i++)peak=Math.max(peak,Math.abs(values[i]));let start=0;
 while(start<sr*.06&&Math.abs(values[start])<peak*.012)start++;start=Math.max(0,start-64);
 let energy=0;for(let i=0;i<sr*.22;i++)energy+=values[start+i]**2;
 const gain=Math.min(2.6,.18/Math.max(.001,Math.sqrt(energy/(sr*.22))),.65/Math.max(.001,peak));
 const data=Buffer.alloc(frames*2);let sum=0,max=0;
 for(let i=0;i<frames;i++){const fade=Math.min(1,i/24,(frames-1-i)/(sr*.055)),v=(values[start+i]||0)*gain*Math.max(0,fade);data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),i*2);sum+=v*v;max=Math.max(max,Math.abs(v));}
 rows.push({note,midi,startSample:parts.length*frames,frames,sampleRate:sr,trimmedStartSamples:start,sourceChannel:'left',gain,peak:max,rms:Math.sqrt(sum/frames),sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex')});parts.push(data);
}
const buffer=Buffer.concat(parts);fs.writeFileSync(root+'/keys.pcm',buffer);
fs.writeFileSync(root+'/bank.json',JSON.stringify({format:'signed PCM16 little endian; mono; 32000 Hz',framesPerNote:frames,notes:rows,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')},null,2));
fs.writeFileSync(root+'/ATTRIBUTION.md',`# Piano sample credits\n\nSalamander Grand Piano by Alexander Holm. Yamaha C5 piano recordings, distributed through Tonejs/audio.\n\nSource: https://github.com/Tonejs/audio/tree/master/salamander\nLicense: Creative Commons Attribution 3.0 Unported (CC BY 3.0), https://creativecommons.org/licenses/by/3.0/\nOriginal license notice: source/upstream-README.txt. Source hashes and URLs: source/provenance.json.\n\nChanges for HolyMind: selected seven pitches; used the left microphone channel; trimmed leading silence and tails; resampled to 32 kHz mono PCM16; adjusted levels; applied release envelopes, nearby-note repitching, low-pass filtering and short room reflections; arranged short original phrases and mixed with original quiet digital/electrical textures. The piano is sampled from real recordings; the textures are source-authored synthesis. No endorsement by the sample author is implied.\n\nAttribution applies to the samples and derived audio, not to the unchanged pre-existing HolyMind synthetic soundscape or brain sounds. Retain this notice when redistributing the piano bank or cues.\n`);
console.log(JSON.stringify({notes:rows.length,bytes:buffer.length,rows}));
