import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {experiments} from '../dist/experiments.js';
import {matchesCatalog,readCatalogURL} from '../dist/catalog-filters.js';
const root=new URL('../dist/',import.meta.url);
const {document}=parseHTML(fs.readFileSync(new URL('index.html',root),'utf8'));
assert.ok(document.querySelector('#library h1'));
assert.equal(document.querySelector('.skip').getAttribute('href'),'#main');
assert.ok(document.querySelector('#main[tabindex="-1"]'));
assert.ok(document.querySelector('dialog[aria-labelledby="dialogTitle"]'));
assert.ok(document.querySelector('#toast[role="status"][aria-live="polite"]'));
for(const node of document.querySelectorAll('.brand,.footer-brand'))assert.equal(node.getAttribute('href'),'./');
for(const name of ['og:title','og:description','og:image'])assert.ok(document.querySelector(`meta[property="${name}"]`).content);
// Traverse real static ES-module edges: the home entry must not request the renderer or Three.js.
const seen=new Set();
function inspect(url){
 const path=new URL(url);path.search='';if(seen.has(path.href))return;seen.add(path.href);
 assert.doesNotMatch(path.pathname,/\/(scene3d|software-scene|three\.module\.min)\.js$/);
 const source=fs.readFileSync(path,'utf8');
 for(const match of source.matchAll(/^(?:import|export)\s+[^\n]*?from\s*['"]([^'"]+)['"]/gm))if(match[1].startsWith('.'))inspect(new URL(match[1],path));
}
inspect(new URL('app.js',root));
assert.equal(experiments.filter(e=>matchesCatalog(e,'physics','all')).length,300);
assert.equal(experiments.filter(e=>matchesCatalog(e,'chemistry','all')).length,0);
assert.equal(experiments.filter(e=>matchesCatalog(e,'all','ket-noi')).length,0,'Never invent a textbook alignment');
assert.equal(matchesCatalog({subject:'biology',bookSeries:['canh-dieu']},'biology','canh-dieu'),true);
assert.equal(matchesCatalog({subject:'biology',bookSeries:['canh-dieu']},'physics','canh-dieu'),false);
assert.deepEqual(readCatalogURL('?grade=11&subject=physics&q=%C4%91i%E1%BB%87n&series=bad'),{grade:'11',subject:'physics',search:'điện',series:'all'});
// Exercise the actual asynchronous loader with controlled network completion/failure.
const {loadRenderers}=await import('../dist/lab-loader.js?failure-test');
await assert.rejects(loadRenderers({timeout:15,importModule:()=>new Promise(()=>{})}),/quá 15 giây/);
await assert.rejects(loadRenderers({importModule:async()=>{throw Error('offline')}}),/offline/);
const progress=[],LabScene=class{},SoftwareScene=class{};
const modules=await loadRenderers({onProgress:p=>progress.push(p),importModule:async name=>name.includes('software')?{SoftwareScene}:{LabScene}});
assert.equal(modules.LabScene,LabScene);assert.equal(modules.SoftwareScene,SoftwareScene);
assert.deepEqual(progress,[0,50,100]);
let requests=0;await loadRenderers({importModule:()=>{requests++;}});assert.equal(requests,0,'Reuse valid modules after navigation');
console.log('PASS v49 static library/SEO/accessibility, no home WebGL import, honest subject/book mapping, loader timeout/offline/retry and real module progress.');
