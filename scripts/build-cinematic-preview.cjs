/* Portable preview of the actual profile runtime, with original assets inline. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=process.env.PROFILE_PREVIEW_DIR?path.resolve(process.env.PROFILE_PREVIEW_DIR):path.join(root,'docs/evidence/cinematic-lines');
function file(url,base=root){const p=url.split(/[?#]/)[0],resolved=p.startsWith('/')?path.join(root,p):path.resolve(base,p);if(!resolved.startsWith(root+path.sep))throw Error('Outside preview root');return resolved;}
function data(url,base=root){const p=file(url,base),ext=path.extname(p),type={'.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'}[ext];if(!type)throw Error('Unsupported preview asset '+p);return 'data:'+type+';base64,'+fs.readFileSync(p).toString('base64');}
let html=fs.readFileSync(path.join(root,'profile/index.html'),'utf8'),scripts=[];
html=html.replace(/<script\b([^>]*?)src="([^"]+)"([^>]*)><\/script>/g,(_,a,url,b)=>{scripts.push('<script'+(b.includes('onerror')?' onerror="document.documentElement.classList.remove(\'profile-boot\')"':'')+'>'+fs.readFileSync(file(url),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>');return '';});
html=html.replace(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g,(_,url)=>{const p=file(url),css=fs.readFileSync(p,'utf8').replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(all,q,asset)=>/^(data:|#|https?:)/.test(asset)?all:'url("'+data(asset,path.dirname(p))+'")');return '<style>'+css+'</style>';});
html=html.replace(/\b(src|href)="(\/assets\/[^\"]+)"/g,(_,attr,url)=>attr+'="'+data(url)+'"');
html=html.replace(/href="\/(?!assets\/)([^"]*)"/g,(_,p)=>'href="https://holyboom.github.io/'+p+'"');
html=html.replace('</body>',scripts.join('\n')+'\n</body>');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'profile-preview.html'),html);
console.log(JSON.stringify({preview:path.join(out,'profile-preview.html'),scripts:scripts.length,bytes:Buffer.byteLength(html)}));
