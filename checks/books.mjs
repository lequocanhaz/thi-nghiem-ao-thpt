import assert from 'node:assert/strict';
import fs from 'node:fs';
import {boundedPage,spreadPages,turnPage,pageImage} from '../dist/book-model.js';
import {homeMarkup} from '../dist/views.js';
import {experiments} from '../dist/experiments.js';
import {parseHTML} from 'linkedom';

const catalog=JSON.parse(fs.readFileSync(new URL('../dist/books/catalog.json',import.meta.url)));
assert.deepEqual(catalog.map(b=>b.grade),[10,11,12]);
assert.deepEqual(catalog.map(b=>b.pages),[142,119,127]);
let pages=0,transitions=0;
for(const book of catalog){
 assert.ok(book.ratio>.65&&book.ratio<.8);
 assert.equal(book.lessons.length,({10:34,11:26,12:25})[book.grade]);
 for(const [i,l]of book.lessons.entries()){assert.equal(l.number,i+1);assert.ok(l.title.length>4);assert.equal(l.page,l.printedPage+book.printedOffset);assert.ok(l.page>book.chapters[0].page&&l.page<=book.pages);if(i)assert.ok(l.page>book.lessons[i-1].page);}
 let previousChapter=0;
 for(const c of book.chapters){assert.ok(c.page>previousChapter&&c.page<=book.pages);assert.equal(c.page,c.printedPage+book.printedOffset);previousChapter=c.page;}
 assert.equal(boundedPage(-5,book.pages),1);assert.equal(boundedPage(Infinity,book.pages),1);assert.equal(boundedPage(99999,book.pages),book.pages);
 for(let page=1;page<=book.pages;page++){
  const bytes=fs.readFileSync(new URL('../dist/'+pageImage(book.grade,page),import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes.length>4000);pages++;
  for(const two of [false,true]){
   const visible=spreadPages(page,book.pages,two);
   assert.ok(visible.includes(page));assert.ok(visible.length>0&&visible.length<=2);assert.ok(visible.every(n=>n>=1&&n<=book.pages));
   if(visible.length===2)assert.equal(visible[1],visible[0]+1);
   for(const direction of [-1,1]){const next=turnPage(page,book.pages,two,direction);assert.ok(next>=1&&next<=book.pages);assert.ok(direction>0?next>=page:next<=page);transitions++;}
  }
 }
 for(const two of [false,true]){
  const seen=new Set();let page=1;
  for(let i=0;i<book.pages+1;i++){spreadPages(page,book.pages,two).forEach(n=>seen.add(n));const next=turnPage(page,book.pages,two,1);if(next===page)break;page=next;}
  assert.equal(seen.size,book.pages,'Every page is reachable in reading order');
  assert.ok(spreadPages(page,book.pages,two).includes(book.pages),'Last page remains reachable');
 }
}
const prefs={favorites:[],recent:[],progress:{},layout:{}};
const {document}=parseHTML(homeMarkup(experiments,prefs,{search:'',grade:'all',topic:'all',filter:'all'},()=>''));
assert.equal(document.querySelectorAll('.home-book').length,3);assert.equal(document.querySelector('#tryExperiment'),null);
assert.doesNotMatch(document.querySelector('.home').textContent,/Chọn lớp và mạch kiến thức|Nhấn tương tác cho biết|số bài cụ thể phụ thuộc/);
for(const grade of [10,11,12])assert.ok(document.querySelector(`[href="books.html?grade=${grade}"]`));
console.log('PASS textbook assets and reader state:',JSON.stringify({books:3,pages,transitions,reachable:'all pages in single and double page modes',limits:'File/DOM/state checks; actual page turning, zoom and layout require browser validation.'}));
