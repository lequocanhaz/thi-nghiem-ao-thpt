// Actual reader controls and original textbook metadata in a DOM fixture.
// This is not browser layout, scan translation or physical-device acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {setLocale} from '../dist/i18n.js?v=54';
import {experiments,initialState} from '../dist/experiments.js';
import {matchesSearch,searchTerms} from '../dist/catalog-search.js';

const metadata=fs.readFileSync(new URL('../dist/books/catalog.json',import.meta.url),'utf8');
const catalog=JSON.parse(metadata),catalogBefore=JSON.stringify(catalog);
assert.equal(catalog.reduce((sum,book)=>sum+book.pages,0),388);
assert.equal(catalog.reduce((sum,book)=>sum+book.lessons.length,0),85);
const physicsBefore=JSON.stringify(experiments.map(e=>[e.id,e.params,e.formula,initialState(e)]));
assert.equal(experiments.length,300);
for(const query of ['Nhiệt dung riêng','nhiet dung rieng','specific heat capacity','calorimeter','stirring rod']){
 const found=experiments.filter(e=>matchesSearch(e,searchTerms(query))).map(e=>e.id);
 assert.ok(found.includes('calorimetry'),query);
 if(query==='specific heat capacity')assert.ok(!found.includes('ohm'),'No unrelated specific-heat alias');
}
assert.equal(JSON.stringify(experiments.map(e=>[e.id,e.params,e.formula,initialState(e)])),physicsBefore);

const {document,window}=parseHTML(fs.readFileSync(new URL('../dist/books.html',import.meta.url),'utf8'));
const stored=new Map([['quanh.book.12','22']]);
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:true}),location:{href:'https://lab.example/books.html?grade=12&page=22',search:'?grade=12&page=22'},history:{replaceState(){},pushState(){}},localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,String(value))},fetch:async()=>({ok:true,json:async()=>catalog}),Image:class{naturalWidth=1120;naturalHeight=1600;decode=async()=>{};set src(value){this._src=value;queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}});
window.innerWidth=768;
window.HTMLElement.prototype.getBoundingClientRect=function(){return {width:250,height:400};};
Object.defineProperties(document.querySelector('#bookStage'),{clientWidth:{value:700},clientHeight:{value:600}});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this._value||this.querySelector('option')?.getAttribute('value')||'';},set(value){this._value=String(value);}});
const {getReadingContext}=await import('../dist/book-reader.js?book-thermal-link-test=88');
const $=s=>document.querySelector(s),flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const pageTo=async page=>{$('#bookPage').value=String(page);$('#pageForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await flush();};
const link=$('#bookLessonExperiment');
assert.ok(link,'The related practical must be visible in the actual reader, not a hidden route only');
assert.equal(link.getAttribute('href'),'index.html#lab/specific-heat');
assert.equal(link.hidden,false);assert.equal(getReadingContext().page,22);
assert.equal(link.textContent,'Thực hành: Nhiệt dung riêng');
assert.match($('#bookCurrentLesson').textContent,/Bài 4\. Nhiệt dung riêng/);
$('#zoomIn').click();await flush();assert.equal($('#zoomValue').textContent,'125%');
const paper=$('#paperStack').firstElementChild;
setLocale('en-US');await flush();
assert.equal(link.textContent,'Experiment: Specific heat capacity');assert.equal(link.hidden,false);
assert.equal(getReadingContext().page,22);assert.equal($('#zoomValue').textContent,'125%');
assert.equal($('#paperStack').firstElementChild,paper,'Locale updates must not replace the current scan');
setLocale('vi-VN');await flush();assert.equal(link.textContent,'Thực hành: Nhiệt dung riêng');
for(const [page,visible] of [[21,false],[22,true],[23,true],[24,true],[25,true],[26,false]]){
 await pageTo(page);assert.equal(link.hidden,!visible,'Related practical follows lesson interval at file page '+page);
 assert.equal(getReadingContext().page,page);
}
$('#bookGrade').value='10';$('#bookGrade').dispatchEvent(new window.Event('change'));await flush();
assert.equal(getReadingContext().grade,10);assert.equal(link.hidden,true,'Do not attach grade12 practical to another textbook');
assert.equal(stored.get('quanh.book.12'),'26','Changing grade retains the last read page');
assert.equal(JSON.stringify(catalog),catalogBefore,'Original 388 pages and85 lesson entries are unchanged');
assert.equal(fs.readFileSync(new URL('../dist/books/catalog.json',import.meta.url),'utf8'),metadata);
const assistantSource=fs.readFileSync(new URL('../dist/books-assistant-v79.js',import.meta.url),'utf8');
assert.match(assistantSource,/book-reader\.js\?v=88/);
const bookHtml=fs.readFileSync(new URL('../dist/books.html',import.meta.url),'utf8');
assert.match(bookHtml,/books-assistant-v79\.js\?v=88/);
assert.match(bookHtml,/src="book-reader\.js\?v=88"/);
assert.ok(!bookHtml.includes('book-reader.js?v=81'),'Both direct and assistant imports must use the same module URL');
console.log('PASS v88 textbook specific-heat practical: actual lesson4 controls/pages22–25, off-lesson hiding, VI/EN with current scan/page/zoom retained, cache chain,300 existing IDs and presentation-only bilingual search aliases. DOM fixture only.');
