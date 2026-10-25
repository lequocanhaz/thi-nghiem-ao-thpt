import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {cardsMarkup,labMarkup} from '../dist/views.js';
const prefs={favorites:[],progress:{},layout:{}},icon=()=>'<svg aria-hidden="true"><path d="M0 0h1"/></svg>';
const {document}=parseHTML(cardsMarkup(experiments,prefs,icon));
assert.equal(document.querySelectorAll('.experiment-card').length,300);
for(const [i,card] of [...document.querySelectorAll('.experiment-card')].entries()){
 const e=experiments[i];assert.equal(card.querySelector('h3').textContent,e.shortTitle);
 assert.equal(card.querySelector('.card-topic').textContent,e.topic);
 assert.equal(card.querySelector('.card-open').getAttribute('href'),'#lab/'+e.id);
 assert.equal(card.querySelector('[data-preview]').dataset.preview,e.id);
 assert.equal(card.querySelector('[data-favorite]').dataset.favorite,e.id);
 assert.equal(card.querySelector('.card-bottom'),null);assert.doesNotMatch(card.textContent,/Chạy theo thời gian|Quy trình tự động/);
 const {document:lab}=parseHTML(labMarkup(e,{prefs,state:initialState(e),config:{viewMode:'3d',switches:{}},controls:'',mode:'measure',panel:'data',experiments},icon));
 assert.ok(lab.querySelector('#lessonTitle').textContent.startsWith(e.shortTitle));
 assert.equal(lab.querySelector('.lab-topic').textContent,e.topic);
}
for(const filename of ['quanh-logo.svg','quanh-mark.svg']){
 const svg=fs.readFileSync(new URL('../dist/brand/'+filename,import.meta.url),'utf8');
 assert.match(svg,/<path\b/,'Native vector logo paths exist');
 assert.doesNotMatch(svg,/<image\b|<rect\b|<text\b|data:image/i,'Logo has no opaque bitmap, background or font dependency');
 for(const color of ['#1b50d2','#0dcfd8','#fa7551'])assert.ok(svg.toLowerCase().includes(color),'Original logo ink '+color);

}
const font=fs.readFileSync(new URL('../dist/fonts/ManropeVariable.woff2',import.meta.url));assert.equal(font.toString('ascii',0,4),'wOF2');
assert.match(fs.readFileSync(new URL('../dist/fonts/MANROPE-LICENSE.txt',import.meta.url),'utf8'),/SIL OPEN FONT LICENSE/);
console.log('PASS v35: 300 original-case titles, topic tags, open/preview/favorite routes and simplified cards; transparent native vector logo; local WOFF2 font and license. DOM/file checks only.');
