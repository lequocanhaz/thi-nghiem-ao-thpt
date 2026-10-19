import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {experiments} from '../dist/experiments.js';
import {homeMarkup,cardsMarkup} from '../dist/views.js';
import {curriculumKey,curriculumMeta,curriculumOptions,interactionTags} from '../dist/curriculum.js';

const icon=()=>'<svg aria-hidden="true"></svg>';
const prefs={favorites:[],recent:[],progress:{},layout:{}};
assert.equal(experiments.length,300,'expected catalog size');
assert.equal(new Set(experiments.map(e=>e.id)).size,300,'unique experiment identifiers');
for(const e of experiments){
 const meta=curriculumMeta(e);
 assert.ok(meta.label&&meta.scope,'has honest curriculum information for '+e.id);
 assert.equal(meta.key,curriculumKey(e));
 const tags=interactionTags(e);
 assert.ok(tags.length>=1&&tags.length<=2,'compact interaction tags');
 assert.ok(tags.every(t=>!/(chạy theo thời gian|quy trình tự động)/i.test(t)),'no misleading technical jargon');
}
const all=curriculumOptions(experiments);
assert.equal(all.reduce((n,g)=>n+g.count,0),300,'every lesson is classified');
for(const grade of [10,11,12]){
 const section=curriculumOptions(experiments,grade);
 assert.ok(section.length,'grade '+grade+' has sections');
 assert.ok(section.every(x=>x.grade===grade));
}
const {document:catalog}=parseHTML(cardsMarkup(experiments,prefs,icon));
assert.equal(catalog.querySelectorAll('.experiment-card').length,300);
assert.equal(catalog.querySelectorAll('.card-syllabus').length,300);
assert.equal(catalog.querySelectorAll('.card-interactions').length,300);
assert.equal(catalog.querySelectorAll('[data-thumb]').length,300);
for(const card of catalog.querySelectorAll('.experiment-card'))assert.ok(card.querySelector('.card-open').getAttribute('href').startsWith('#lab/'));
const home=homeMarkup(experiments,prefs,{search:'',grade:'all',topic:'all',filter:'all',pathFilter:null},icon);
const {document}=parseHTML(home);
assert.ok(document.querySelector('#curriculumTopicFilter'));
assert.equal(document.querySelector('#curriculumSummary'),null);assert.equal(document.querySelector('.library-lead'),null);
assert.ok(document.querySelector('#bannerTitle em'));
const css=fs.readFileSync(new URL('../dist/app.css',import.meta.url),'utf8');
assert.match(css,/banner-copy h1 em\{display:inline-block;margin-top:/);
assert.match(css,/\.curriculum-picker/);
console.log('Library v39: 300 curriculum links, interaction badges and thumbnail slots verified.');
