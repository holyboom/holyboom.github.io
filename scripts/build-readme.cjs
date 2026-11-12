/* Render authored README plates; no font binary is committed or bundled. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/readme');fs.mkdirSync(out,{recursive:true});
 const fontURL='https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/InstrumentSerif-Regular.ttf';
 const response=await fetch(fontURL);if(!response.ok)throw Error('Build-time typeface fetch failed: '+response.status);const font=Buffer.from(await response.arrayBuffer());
 const browser=await chromium.launch({headless:true,executablePath:process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined});const files=[];
 try{const p=await browser.newPage({viewport:{width:1400,height:1100},deviceScaleFactor:1});await p.goto('file://'+path.join(root,'scripts/readme-plates.html'));
 await p.addStyleTag({content:`@font-face{font-family:FieldSerif;src:url(data:font/ttf;base64,${font.toString('base64')}) format('truetype');font-style:normal;font-weight:400}`});await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
 for(const size of ['desktop','mobile'])for(const theme of ['light','dark']){
  await p.evaluate(({size,theme})=>{document.body.className=(size==='mobile'?'mobile ':'')+(theme==='dark'?'dark':'');},{size,theme});await p.setViewportSize({width:size==='mobile'?720:1400,height:1800});await p.waitForTimeout(80);
  for(const type of ['cover','method']){const f=`${type}-${size}-${theme}.png`;await p.locator('#'+type).screenshot({path:path.join(out,f)});const data=fs.readFileSync(path.join(out,f));files.push({file:f,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});}
 }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({design:'Engineering fieldnotes',source:'Authored HTML/CSS composition with unchanged HolyMind source artwork',font:{name:'Instrument Serif',source:fontURL,license:'SIL Open Font License',sha256:crypto.createHash('sha256').update(font).digest('hex'),binaryDistributed:false},files},null,2)+'\n');console.log(JSON.stringify(files));
})().catch(e=>{console.error(e);process.exit(1)});
