import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {cardsMarkup,labMarkup} from '../dist/views.js';
const prefs={favorites:[],progress:{},layout:{}},icon=()=>'<svg aria-hidden="true"><path d="M0 0h1"/></svg>';
const {document}=parseHTML(cardsMarkup(experiments,prefs,icon));
assert.equal(document.querySelectorAll('.experiment-card').length,300);
for(const [i,card] of [...document.querySelectorAll('.experiment-card')].entries()){
 const e=experiments[i];assert.equal(card.querySelector('h3').textContent,e.shortTitle.toLocaleUpperCase('vi-VN'));
 assert.equal(card.querySelector('.card-topic').textContent,e.topic);
 assert.equal(card.querySelector('.card-open').getAttribute('href'),'#lab/'+e.id);
 assert.equal(card.querySelector('[data-preview]').dataset.preview,e.id);
 assert.equal(card.querySelector('[data-favorite]').dataset.favorite,e.id);
 assert.equal(card.querySelector('.card-bottom'),null);assert.doesNotMatch(card.textContent,/Chạy theo thời gian|Quy trình tự động/);
 const {document:lab}=parseHTML(labMarkup(e,{prefs,state:initialState(e),config:{viewMode:'3d',switches:{}},controls:'',mode:'measure',panel:'data',experiments},icon));
 assert.ok(lab.querySelector('#lessonTitle').textContent.startsWith(e.shortTitle.toLocaleUpperCase('vi-VN')));
 assert.equal(lab.querySelector('.lab-topic').textContent,e.topic);
}
for(const filename of ['quanh-logo.svg','quanh-mark.svg']){
 const svg=fs.readFileSync(new URL('../dist/brand/'+filename,import.meta.url),'utf8');
 const encoded=svg.match(/href="data:image\/png;base64,([^"]+)"/)?.[1];assert.ok(encoded,'Logo embeds the supplied image, without a remote dependency');
 assert.equal(createHash('sha256').update(Buffer.from(encoded,'base64')).digest('hex'),'67f3076b17ccbd5ce35ebc297c5c044b2917ca0285cd11af1ab3e23a63b4011b');
 assert.doesNotMatch(svg,/<ellipse|#D2F18A/i,'The previous orbit mark is gone');
}
const font=fs.readFileSync(new URL('../dist/fonts/ManropeVariable.woff2',import.meta.url));assert.equal(font.toString('ascii',0,4),'wOF2');
assert.match(fs.readFileSync(new URL('../dist/fonts/MANROPE-LICENSE.txt',import.meta.url),'utf8'),/SIL OPEN FONT LICENSE/);
console.log('PASS v35: 300 uppercase titles, topic tags, open/preview/favorite routes and simplified cards; uploaded logo bytes preserved; local WOFF2 font and license. DOM/file checks only.');
