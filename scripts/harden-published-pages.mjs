// Apply Content Security Policy to all public HTML pages during deployment.
// GitHub Pages serves static files; this policy is an HTML meta tag, not a response header.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const policy=[
 "default-src 'self'",
 "base-uri 'self'",
 "object-src 'none'",
 "frame-src 'none'",
 "form-action 'self'",
 "script-src 'self' 'wasm-unsafe-eval'",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob: https:",
 "font-src 'self' data:",
 "media-src 'self' blob:",
 "connect-src 'self' https:",
 "worker-src 'self' blob:",
 "upgrade-insecure-requests"
].join('; ');
const marker='<meta http-equiv="Content-Security-Policy" content="'+policy+'">';
const referrer='<meta name="referrer" content="strict-origin-when-cross-origin">';
const root=fileURLToPath(new URL('../dist/',import.meta.url));

export function secureHTML(source){
 if(typeof source!=='string'||!/<head\b[^>]*>/i.test(source))throw Error('Missing document head');
 if(source.includes(marker))return source;
 if(/<meta\s[^>]*http-equiv=["']Content-Security-Policy["']/i.test(source))throw Error('Review existing security policy');
 return source.replace(/<head\b[^>]*>/i,head=>head+marker+referrer);
}
function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const full=path.join(dir,entry.name);
  return entry.isDirectory()?walk(full):[full];
 });
}
export function processPages({write=false,verify=false}={}){
 const htmlFiles=walk(root).filter(file=>file.endsWith('.html'));
 if(htmlFiles.length<300)throw Error('Expected at least 300 published pages');
 for(const file of htmlFiles){
  const original=fs.readFileSync(file,'utf8');
  if(verify){
   if(!original.includes(marker)||!original.includes(referrer))throw Error('Unprotected HTML page: '+path.relative(root,file));
   continue;
  }
  const secured=secureHTML(original);
  if(write&&secured!==original)fs.writeFileSync(file,secured);
 }
 return htmlFiles.length;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const cmd=process.argv[2];
 if(!['--write','--verify'].includes(cmd))throw Error('Choose --write or --verify');
 console.log('Secured public HTML pages:',processPages({write:cmd==='--write',verify:cmd==='--verify'}));
}
