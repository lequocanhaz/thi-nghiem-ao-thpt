// Controls surrounding textbook images are localized; the photographed textbook pages,
// table of contents and model state are never rewritten or auto-translated.
import {i18n,getLocale} from './i18n.js?v=54';
const dictionary=new Map([
 ['Đến nội dung','Skip to main content'],['Điều hướng','Navigation'],['Thí nghiệm','Experiments'],
 ['Sách giáo khoa','Textbooks'],['Kết nối tri thức với cuộc sống','Connecting Knowledge to Life'],
 ['Đang mở thư viện sách…','Loading textbook library…'],['← Đổi sách','← Change textbook'],
 ['Đổi lớp','Change grade'],['Mục lục','Contents'],['Mục lục theo bài học','Lesson contents'],
 ['Trang trước','Previous page'],['Trang sau','Next page'],['Đến trang','Go to page'],
 ['Thu nhỏ','Zoom out'],['Phóng to','Zoom in'],['Hai trang','Two pages'],['Một trang','Single page'],
 ['Đọc toàn màn hình','Fullscreen reader'],['Thoát toàn màn hình','Exit fullscreen'],
 ['Chưa tải được trang sách.','Could not load the textbook page.'],['Thử lại','Try again'],
 ['Đọc sách','Read book'],['Bản mẫu','Sample edition'],['Đang tải…','Loading…'],
 ['Tải lại','Reload'],['Chưa mở được thư viện sách.','Could not open the textbook library.']
]);
const originals=new WeakMap();
const roots=['.reading-header','#booksMain'];
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
 document.title=en?'Textbooks · Quanh Lab':'Sách giáo khoa · Quanh Lab';
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
}
const nav=document.querySelector('.reading-header nav');
if(nav){
 const select=document.createElement('select');select.id='bookLocale';select.setAttribute('aria-label','Language / Ngôn ngữ');
 select.innerHTML='<option value="vi-VN">🇻🇳 VI</option><option value="en-US">🇺🇸 EN</option>';
 select.value=getLocale();
 select.style.cssText='margin-left:.5rem;max-width:5.8rem;padding:.35rem;border-radius:8px;border:1px solid #aaa;background:white;color:#222;';
 nav.append(select);
 select.addEventListener('change',()=>{if(!['vi-VN','en-US'].includes(select.value))return;i18n.setLocale(select.value);apply();});
 apply();
 const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});});
 const root=document.querySelector('#booksMain');if(root)observer.observe(root,{subtree:true,childList:true,characterData:true});
}
