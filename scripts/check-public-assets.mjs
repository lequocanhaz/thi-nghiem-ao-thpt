// Refuse accidentally published credential files and common live API tokens.
// This only scans public deployment assets; keep a server-side secret scanner as well.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const signatures=[
 ['provider API credential',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
 ['GitHub access credential',/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/],
 ['Google API credential',/\bAIza[0-9A-Za-z_-]{35}\b/],
 ['AWS access credential',/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
 ['private key block',/-----BEGIN [A-Z ]*PRIVATE KEY-----/]
];
export function inspect(){
 let count=0;
 const files=[root];
 while(files.length){
  const current=files.pop();
  for(const d of fs.readdirSync(current,{withFileTypes:true})){
   const full=path.join(current,d.name),relative=path.relative(root,full).replaceAll(path.sep,'/');
   if(d.isDirectory()){if(/^\.(?:git|env)/i.test(d.name))throw Error('Do not publish hidden private directory: '+relative);files.push(full);continue;}
   if(/^\.(?:env|npmrc|netrc)/i.test(d.name)||/\.(?:pem|p12|pfx|key|map)$/i.test(d.name))
    throw Error('Blocked private asset: '+relative);
   if(!/\.(?:html?|js|mjs|json|css|xml|txt|svg)$/i.test(d.name))continue;
   count++;
   const data=fs.readFileSync(full,'utf8');
   for(const [category,pattern]of signatures)if(pattern.test(data))throw Error('Possible '+category+' in public file: '+relative);
  }
 }
 return count;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Public text assets screened:',inspect());
