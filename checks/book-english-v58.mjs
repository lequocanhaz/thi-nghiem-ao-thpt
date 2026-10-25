import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {setLocale,getLocale} from '../dist/i18n.js?v=54';
import {bookEnglishMetadata,bookIsEnglish,localizedBookTitle,localizedChapterTitle,localizedLessonTitle,localizedBookString,checkBookMetadata,bookChapterOptionGroups,bookShelfCards,pageStatusText} from '../dist/book-copy.js';

const catalog=JSON.parse(fs.readFileSync(new URL('../dist/books/catalog.json',import.meta.url),'utf8'));
const snapshot=JSON.stringify(catalog);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assert.equal(catalog.length,3);
assert.equal(catalog.reduce((sum,b)=>sum+b.lessons.length,0),85);
assert.equal(catalog.reduce((sum,b)=>sum+b.chapters.length,0),15);
assert.equal(catalog.reduce((sum,b)=>sum+b.pages,0),388);
assert.equal(getLocale(),'vi-VN');
assert.equal(bookIsEnglish(),false);
for(const book of catalog){
 assert.equal(checkBookMetadata(book),true,'All lessons and chapters translated grade '+book.grade);
 assert.equal(localizedBookTitle(book),book.title);
 assert.equal(localizedLessonTitle(book,book.lessons[0]),book.lessons[0].title);
 assert.equal(localizedChapterTitle(book,0),book.chapters[0].title);
 const opts=bookChapterOptionGroups(book,escape);
 for(const item of book.lessons)assert.ok(opts.includes(escape(item.title)),book.grade+' lesson '+item.number+' preserved');
 assert.ok(opts.includes('Bìa sách'));
}
setLocale('en-US');
assert.equal(getLocale(),'en-US');
assert.equal(bookIsEnglish(),true);
let allEnglishTitles=new Set();
for(const book of catalog){
 assert.equal(localizedBookTitle(book),'Physics '+book.grade);
 const translated=bookEnglishMetadata[book.grade];
 assert.equal(translated.lessons.length,book.lessons.length);
 assert.equal(translated.chapters.length,book.chapters.length);
 const html=bookChapterOptionGroups(book,escape);
 assert.match(html,/Select a lesson/);
 assert.match(html,/Chapter overview · p\./);
 assert.match(html,/Lesson 1\./);
 assert.doesNotMatch(html,/Bài \d+|Mở đầu chương|tr\. \d+/,'No Vietnamese navigation labels');
 for(const lesson of book.lessons){
  const title=localizedLessonTitle(book,lesson);
  assert.ok(title.length>=8,book.grade+' lesson '+lesson.number+' English title');
  assert.ok(title===translated.lessons[lesson.number-1],book.grade+' matching row');
  assert.ok(html.includes(escape(title)),book.grade+' rendered English lesson '+lesson.number);
  assert.ok(html.includes('value="'+lesson.page+'"'),book.grade+' internal page unchanged');
  allEnglishTitles.add(book.grade+':'+title);
 }
 for(let j=0;j<book.chapters.length;j++){
  assert.equal(localizedChapterTitle(book,j),translated.chapters[j]);
  assert.ok(html.includes('label="'+escape(translated.chapters[j])+'"'));
 }
 assert.ok(pageStatusText(book,[7]).includes('page 7 of '+book.pages));
}
assert.equal(allEnglishTitles.size,85);
const cards=bookShelfCards(catalog,escape);
assert.match(cards,/Physics 10/);assert.match(cards,/Physics 11/);assert.match(cards,/Physics 12/);
assert.match(cards,/142 pages/);assert.match(cards,/119 pages/);assert.match(cards,/127 pages/);
assert.match(cards,/Sample edition/);assert.match(cards,/Read book/);
assert.doesNotMatch(cards,/Đọc sách|trang|Vật lí/);
assert.equal(localizedBookString('Đọc sách','Read book'),'Read book');
assert.equal(JSON.stringify(catalog),snapshot,'Book metadata, lesson/page destinations and page images unchanged');
setLocale('vi-VN');
assert.equal(bookShelfCards(catalog,escape).includes('Vật lí 11'),true);
assert.equal(localizedBookString('Đọc sách','Read book'),'Đọc sách');
assert.equal(pageStatusText(catalog[0],[7]),'Vật lí 10, trang 7 trên 142');
assert.equal(JSON.stringify(catalog),snapshot);
for(const file of ['dist/book-copy.js','dist/book-reader.js','dist/book-language.js']){
 execFileSync(process.execPath,['--check',new URL('../'+file,import.meta.url).pathname],{stdio:'pipe'});
}
const readerSource=fs.readFileSync(new URL('../dist/book-reader.js',import.meta.url),'utf8');
assert.match(readerSource,/onLocaleChange\(refreshBookLabels\)/);
assert.match(readerSource,/bookChapterOptionGroups\(book,escape\)/);
assert.match(readerSource,/bookShelfCards\(catalog,escape\)/);
assert.doesNotMatch(readerSource,/onLocaleChange\([^)]*\).*showPage\(/,'Changing the locale must not reload scans');
console.log('PASS v58: 85 English lesson titles, 15 English chapter names, 388 original scans, 3 cards, bilingual roundtrip, stable page destinations and reader module syntax.');
