import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {buildLabModel} from '../dist/scene3d.js';
import {updateObservation} from '../dist/observation-view.js';
import {mainExperimentIds,isMainExperiment,readCollection,collectionEntries,selectionInfo,selectionCopy} from '../dist/library-selection-v77.js';
import {homeMarkup,cardsMarkup,labMarkup} from '../dist/views.js';
import {translateShort} from '../dist/language-ui.js';

const main=collectionEntries(experiments),archive=collectionEntries(experiments,'archive');
assert.equal(main.length,40);assert.equal(archive.length,260);
assert.equal(new Set(mainExperimentIds).size,mainExperimentIds.length);
assert.deepEqual(new Set([...main,...archive].map(e=>e.id)),new Set(experiments.map(e=>e.id)));
assert.ok(main.every(e=>isMainExperiment(e.id)&&selectionInfo(e.id).kind==='main'));
assert.equal(collectionEntries(experiments,'main',true).length,300,'Saved/recent entries span both collections');
assert.equal(collectionEntries(experiments,'archive',true).length,300);
assert.equal(readCollection('?collection=archive&q=debroglie'),'archive');
for(const search of ['','?collection=main','?collection=invalid'])assert.equal(readCollection(search),'main');
for(const id of ['kirchhoff_loop','diode_model','battery_parallel','debroglie','voltmeter_design']){
 assert.equal(isMainExperiment(id),false);
 assert.equal(selectionInfo(id).kind,'needs-work');
 assert.ok(selectionInfo(id).reason.length>50);
}
for(const id of ['spring_period','potential_point','standing_phase']){
 const info=selectionInfo(id);assert.equal(info.kind,'supplementary');
 assert.ok(mainExperimentIds.includes(info.primary));assert.notEqual(info.primary,id);
 assert.ok(experiments.find(e=>e.id===id));
}
for(const [vi,en] of selectionCopy)assert.equal(translateShort(vi),en,'Exact bilingual collection copy: '+vi);
assert.equal(translateShort('40 thí nghiệm · 1–24'),'40 experiments · 1–24');
const prefs={favorites:['spring_period'],recent:['spring_period'],progress:{},layout:{}},filters={search:'',grade:'all',topic:'all',filter:'all',pathFilter:null};
const home=parseHTML(homeMarkup(experiments,prefs,filters,()=>'<svg></svg>')).document;
assert.equal(home.querySelector('#collectionCount').textContent,'40');
assert.equal(home.querySelector('.recent-entry').getAttribute('href'),'#lab/spring_period','Old supplementary work stays resumable');
const card=parseHTML(cardsMarkup(archive,prefs,()=>'<svg></svg>')).document;
assert.equal(card.querySelectorAll('[data-selection="needs-work"]').length,10);
for(const e of archive)assert.ok(card.querySelector(`[data-thumb="${e.id}"] img`),'Original thumbnail retained: '+e.id);
const lab=labMarkup(experiments.find(e=>e.id==='spring_period'),{prefs,state:{},config:{switches:{}},controls:'',panel:'data',mode:'explore',experiments},()=>'<svg></svg>');
assert.ok(lab.includes('href="#lab/oscillation"'));
assert.equal(parseHTML(lab).document.querySelectorAll('#labSelect option').length,300);

// Theoretical disclosure is optional; its closed initial state must not remove
// the scientific content or close the user's choice after a locale change.
const {document,window}=parseHTML('<html><body><section id="host"></section><section id="other"></section></body></html>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},measureText:s=>({width:s.length*14})});
const host=document.querySelector('#host'),other=document.querySelector('#other');
for(const node of [host,other])Object.defineProperty(node,'clientWidth',{value:360});
const build=id=>{const e=experiments.find(e=>e.id===id),s=initialState(e);return buildLabModel(id,s,evaluate(id,s),{labels:false});};
const relation=build('vector_sum');
updateObservation(host,relation.group,'vector_sum','vi-VN',{initialOpen:false});
assert.equal(host.hidden,false);assert.equal(host.querySelector('.observation-details').hasAttribute('open'),false);
assert.ok(host.querySelector('.observation-chart'));
host.querySelector('.observation-details').setAttribute('open','');
updateObservation(host,relation.group,'vector_sum','en-US',{initialOpen:false});
assert.ok(host.querySelector('.observation-details').hasAttribute('open'));
updateObservation(other,relation.group,'vector_sum');
assert.ok(other.querySelector('.observation-details').hasAttribute('open'),'Standalone callers keep the existing default');
const lens=build('ray_slab');
updateObservation(other,lens.group,'ray_slab','vi-VN',{initialOpen:false});
assert.ok(other.querySelector('.observation-details').hasAttribute('open'),'Ray legend stays open');
assert.ok(other.querySelector('.optics-notes'));
for(const model of [relation,lens])model.group.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){m?.map?.dispose();m?.dispose();}});
const index=fs.readFileSync(new URL('../dist/experiments/index.html',import.meta.url),'utf8');
const staticCatalog=parseHTML(index).document;
assert.equal(staticCatalog.querySelectorAll('details .catalog-list a').length,260);
assert.equal(staticCatalog.querySelectorAll('.catalog-list a').length,300);
console.log('PASS v77: 40 main / 260 supplementary, full route and image inventory, honest limitations, related investigations, resume safety, VI/EN and reversible theoretical disclosure.');
