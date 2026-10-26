// Refuse accidentally published credential files and common live API tokens.
// This only scans public deployment assets; keep a server-side secret scanner as well.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {authConfig} from '../dist/auth-config.js';
import {validateAuthConfig} from '../dist/auth-client.js';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const signatures=[
 ['provider API credential',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
 ['GitHub access credential',/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/],
 ['Google API credential',/\bAIza[0-9A-Za-z_-]{35}\b/],
 ['AWS access credential',/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
 ['private key block',/-----BEGIN [A-Z ]*PRIVATE KEY-----/]
];
export function inspect({directory=root,config=authConfig}={}){
 const checked=validateAuthConfig(config);
 let count=0;
 const files=[directory];
 while(files.length){
  const current=files.pop();
  for(const d of fs.readdirSync(current,{withFileTypes:true})){
   const full=path.join(current,d.name),relative=path.relative(directory,full).replaceAll(path.sep,'/');
   if(d.isDirectory()){if(/^\.(?:git|env)/i.test(d.name))throw Error('Do not publish hidden private directory: '+relative);files.push(full);continue;}
   if(/^\.(?:env|npmrc|netrc)/i.test(d.name)||/\.(?:pem|p12|pfx|key|map)$/i.test(d.name))
    throw Error('Blocked private asset: '+relative);
   if(!/\.(?:html?|js|mjs|json|css|xml|txt|svg)$/i.test(d.name))continue;
   count++;
   const data=fs.readFileSync(full,'utf8');
   for(const [category,pattern]of signatures){
    const matches=[...data.matchAll(new RegExp(pattern.source,'g'))];
    if(!matches.length)continue;
    // A Firebase Web App apiKey is a public project identifier, not a server
    // credential. Permit exactly the validated configured value in its sole
    // configuration module; Google provider/service keys elsewhere stay blocked.
    if(category==='Google API credential'&&relative==='auth-config.js'&&checked.valid&&matches.every(match=>match[0]===checked.firebase.apiKey))continue;
    throw Error('Possible '+category+' in public file: '+relative);
   }
  }
 }
 return count;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Public text assets screened:',inspect());
