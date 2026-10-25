import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {experiments} from '../dist/experiments.js';
import {matchesCatalog,readCatalogURL,availableCatalogFilters} from '../dist/catalog-filters.js';
import {homeMarkup} from '../dist/views.js';
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
assert.deepEqual(readCatalogURL('?subject=chemistry&series=ket-noi'),{grade:'all',subject:'chemistry',search:'',series:'ket-noi'},'Legacy URL filters remain explicit and removable, never silently broadened');
assert.deepEqual(availableCatalogFilters(experiments),{subjects:[['physics','Vật lí']],bookSeries:[]});
const home=list=>parseHTML(homeMarkup(list,{favorites:[],recent:[],progress:{}},{search:'',grade:'all',topic:'all',filter:'all',pathFilter:null},()=>'<svg></svg>')).document;
const currentHome=home(experiments);
assert.equal(currentHome.querySelector('#subjectFilter'),null,'One subject does not need a selector');
assert.equal(currentHome.querySelector('#bookSeriesFilter'),null,'Do not offer unverified textbook mappings');
assert.match(currentHome.querySelector('#catalogScope').textContent,/300 thí nghiệm Vật lí · Lớp 10, 11, 12/);
const futureCatalog=[...experiments,{...experiments[0],id:'chemistry-fixture',subject:'chemistry',bookSeries:['ket-noi']},{...experiments[0],id:'biology-fixture',subject:'biology',bookSeries:['canh-dieu']}];
const futureHome=home(futureCatalog);
for(const [id,key] of [['subjectFilter','subject'],['bookSeriesFilter','series']]){
 const select=futureHome.querySelector('#'+id);assert.ok(select,'Show selectors when real choices exist');
 for(const option of select.querySelectorAll('option'))if(option.value!=='all')assert.ok(futureCatalog.some(e=>matchesCatalog(e,key==='subject'?option.value:'all',key==='series'?option.value:'all')),'Every displayed option has a matching record');
}
assert.equal(futureHome.querySelector('#bookSeriesFilter option[value="chan-troi"]'),null,'Never infer missing series membership');
const oneSeries=experiments.map(e=>({...e,bookSeries:['ket-noi']}));
assert.equal(home(oneSeries).querySelector('#bookSeriesFilter'),null,'One real series does not need a selector');
const viewSource=fs.readFileSync(new URL('views.js',root),'utf8');
const banner=viewSource.match(/ <section class="main-banner[\s\S]*? <\/section>/)?.[0];assert.ok(banner);
const approvedTitle='<h1 tabindex="-1" id="bannerTitle" class="primary-heading"><span class="banner-title-row banner-title-row--main">HỆ THỐNG THÍ NGHIỆM</span><span class="banner-title-row banner-title-row--sub">VẬT LÍ ẢO</span></h1>';
const previousTitle='<h1 tabindex="-1" id="bannerTitle" class="primary-heading">Thí nghiệm<br><em>Vật Lí</em></h1>';
assert.equal(banner.split(approvedTitle).length,2,'The homepage must display the approved virtual physics system title');
assert.equal(createHash('sha256').update(banner.replace(approvedTitle,previousTitle)).digest('hex'),'46908b1168de4237f17b86528f05e1f761d7e48534a87395a0eff9eeee25d769','Original banner must be preserved aside from the approved heading');
// Exercise the actual asynchronous loader with controlled network completion/failure.
const {loadRenderers}=await import('../dist/lab-loader.js?failure-test');
await assert.rejects(loadRenderers({timeout:15,importModule:()=>new Promise(()=>{})}),/quá 15 giây/);
await assert.rejects(loadRenderers({importModule:async()=>{throw Error('offline')}}),/offline/);
const progress=[],LabScene=class{},SoftwareScene=class{};
const modules=await loadRenderers({onProgress:p=>progress.push(p),importModule:async name=>name.includes('software')?{SoftwareScene}:{LabScene}});
assert.equal(modules.LabScene,LabScene);assert.equal(modules.SoftwareScene,SoftwareScene);
assert.deepEqual(progress,[0,50,100]);
let requests=0;await loadRenderers({importModule:()=>{requests++;}});assert.equal(requests,0,'Reuse valid modules after navigation');
console.log('PASS v49/v51 static library/SEO/accessibility, data-backed filter options, stable legacy URLs, unchanged banner template, no home WebGL import, loader timeout/offline/retry and real module progress.');
