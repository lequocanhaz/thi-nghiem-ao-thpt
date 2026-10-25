// Controls surrounding textbook images are localized; the photographed textbook pages,
// table of contents and model state are never rewritten or auto-translated.
import {i18n,getLocale} from './i18n.js?v=54';
import {mountLanguagePill} from './language-pill.js?v=57';
const dictionary=new Map([
 ['Đến nội dung','Skip to main content'],['Điều hướng','Navigation'],['Thí nghiệm','Experiments'],
 ['Sách giáo khoa','Textbooks'],['Kết nối tri thức với cuộc sống','Connecting Knowledge to Life'],
 ['Đang mở thư viện sách…','Loading textbook library…'],['← Đổi sách','← Change textbook'],
 ['Trang chủ','Home'],['Vật lí','Physics'],['Bìa sách','Book cover'],['Lớp 10','Grade 10'],['Lớp 11','Grade 11'],['Lớp 12','Grade 12'],
 ['Đổi lớp','Change grade'],['Mục lục','Contents'],['Mục lục theo bài học','Lesson contents'],
 ['Trang trước','Previous page'],['Trang sau','Next page'],['Đến trang','Go to page'],
 ['Thu nhỏ','Zoom out'],['Phóng to','Zoom in'],['Hai trang','Two pages'],['Một trang','Single page'],
 ['Đọc toàn màn hình','Fullscreen reader'],['Thoát toàn màn hình','Exit fullscreen'],
 ['Chưa tải được trang sách.','Could not load the textbook page.'],['Thử lại','Try again'],
 ['Đọc sách','Read book'],['Bản mẫu','Sample edition'],['Đang tải…','Loading…'],
 ['Kết nối tri thức','Connecting Knowledge'],['Chọn bài học','Select a lesson'],
 ['Trình đọc sách','Textbook reader'],['Điều khiển sách','Textbook controls'],
 ['Sách Vật lí 10','Physics 10 textbook'],['Sách Vật lí 11','Physics 11 textbook'],
 ['Sách Vật lí 12','Physics 12 textbook'],
 ['Tải lại','Reload'],['Chưa mở được thư viện sách.','Could not open the textbook library.']
]);
const originals=new WeakMap();
const roots=['.skip','.reading-header','#booksMain'];
const excluded='script,style,svg,canvas,#paperStack,#bookChapter,#bookGrade,.textbook-card h2,.textbook-cover';
let scheduled=false;
function translateText(node,en){
 if(!node.parentElement||node.parentElement.closest(excluded))return;
 const raw=node.nodeValue||'',old=originals.get(node),source=old&&raw===old.output?old.source:raw;
 const trimmed=source.trim(),replacement=dictionary.get(trimmed)||(/^([0-9]+) trang$/.test(trimmed)?trimmed.replace('trang','pages'):trimmed);
 const next=en?source.replace(trimmed,replacement):source;
 if(next!==raw)node.nodeValue=next;
 if(en&&next!==source)originals.set(node,{source,output:next});else originals.delete(node);
}
function apply(){
 const en=getLocale()==='en-US';document.documentElement.lang=en?'en-US':'vi';
 document.title=document.querySelector('#reader:not([hidden])')?.querySelector('#readingTitle')?.textContent+' · Quanh Lab';
 if(!document.querySelector('#reader:not([hidden])'))document.title=en?'Textbooks · Quanh Lab':'Sách giáo khoa · Quanh Lab';
 for(const selector of roots){
  const root=document.querySelector(selector);if(!root)continue;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  while(walk.nextNode()){
   const node=walk.currentNode;
   if(node.nodeType===3)translateText(node,en);
   else if(node.nodeType===1&&!node.closest(excluded)){
    for(const attr of ['aria-label','title','placeholder']){
     if(!node.hasAttribute(attr))continue;
     const key='data-ql-original-'+attr,source=node.getAttribute(key)||node.getAttribute(attr);
     const result=en?(dictionary.get(source)||source):source;
     if(en&&result!==source){node.setAttribute(key,source);node.setAttribute(attr,result);}
     else if(!en&&node.hasAttribute(key)){node.setAttribute(attr,source);node.removeAttribute(key);}
    }
   }
  }
 }
 syncReaderDisclosure();
}
// Explain what changes language and what is unchanged in the scanned source pages.
function syncReaderDisclosure(){
 const reader=document.getElementById('reader');
 const shelf=document.getElementById('bookShelf');
 const en=getLocale()==='en-US';
 let note=document.getElementById('bookLanguageDisclosure');
 if(!en){note?.remove();return;}
 if(!note){
  note=document.createElement('p');
  note.id='bookLanguageDisclosure';
  note.setAttribute('lang','en-US');
  note.className='book-language-note';
  note.textContent='English book titles, chapters and navigation are available. Original textbook page images remain in Vietnamese.';
  const heading=reader?.querySelector('.reading-heading');
  (heading||shelf?.querySelector('.books-heading'))?.insertAdjacentElement('afterend',note);
 }
 if(reader&&!reader.hidden&&note.parentElement!==reader){
  reader.querySelector('.reading-heading')?.insertAdjacentElement('afterend',note);
 }else if(shelf&&!shelf.hidden&&note.parentElement!==shelf){
  shelf.querySelector('.books-heading')?.insertAdjacentElement('afterend',note);
 }
}
const nav=document.querySelector('.reading-header nav');
if(nav){
 if(!document.getElementById('bookLanguageNoteStyles')){
 const style=document.createElement('style');style.id='bookLanguageNoteStyles';
 style.textContent='.book-language-note{margin:12px 0 20px;border-inline-start:3px solid #69788e;background:#f2f5f9;color:#28384f;border-radius:0 8px 8px 0;padding:9px 13px;font-size:.825rem;line-height:1.5;} .reading-selects #bookChapter{box-sizing:border-box;max-width:100%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;} .reading-selects label:has(#bookChapter){flex:1 1 260px;min-width:0;} @media(max-width:620px){.reading-selects{display:grid;grid-template-columns:100px minmax(0,1fr);width:100%;}.reading-selects label,.reading-selects select{width:100%!important;min-width:0!important;max-width:100%!important;}}';
 document.head.append(style);
}
 mountLanguagePill(nav,{
  id:'bookLocale',
  onChange(){apply();}
 });
 apply();
 const observer=new MutationObserver(()=>{
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;apply();});
 });
 const root=document.querySelector('#booksMain');
 if(root)observer.observe(root,{subtree:true,childList:true,characterData:true});
}
