import {boundedPage,spreadPages,turnPage,pageImage} from './book-model.js?v=40';

const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalog=[],book=null,page=1,zoom=1,preferTwo=true,two=false,token=0,busy=false,gesture=null,failedPage=null;
const cache=new Map();
function savedPage(grade,total){try{return boundedPage(localStorage.getItem('quanh.book.'+grade)||1,total);}catch{return 1;}}
function savePage(){try{localStorage.setItem('quanh.book.'+book.grade,String(page));}catch{}}
function imageFor(grade,number){
 const src=pageImage(grade,number);
 if(cache.has(src)){const item=cache.get(src);cache.delete(src);cache.set(src,item);return item;}
 const pending=new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=async()=>{try{await image.decode?.();}catch{}resolve(image);};image.onerror=()=>{cache.delete(src);reject(Error('image-load'));};image.src=src;});
 cache.set(src,pending);while(cache.size>6)cache.delete(cache.keys().next().value);return pending;
}
function shouldUseTwo(){return preferTwo&&zoom===1&&window.innerWidth>=860;}
function updateURL(push=false){const url=new URL('books.html',location.href);if(book){url.searchParams.set('grade',book.grade);url.searchParams.set('page',page);}history[push?'pushState':'replaceState']({},'',url);}
function updateControls(){
 if(!book)return;
 const visible=spreadPages(page,book.pages,two);
 $('#bookPage').value=String(page);$('#bookPage').max=String(book.pages);$('#pageTotal').textContent='/ '+book.pages;
 $('#bookPrevious').disabled=busy||visible[0]===1;$('#bookNext').disabled=busy||visible.at(-1)===book.pages;
 $('#zoomOut').disabled=zoom<=1;$('#zoomIn').disabled=zoom>=2.5;
 $('#zoomValue').textContent=Math.round(zoom*100)+'%';$('#spreadMode').setAttribute('aria-pressed',String(two));
 $('#bookStage').setAttribute('aria-busy',String(busy));$('#bookStage').style.touchAction=zoom>1?'pan-x pan-y':'pan-y';
 const chapter=[...book.chapters].reverse().find(c=>c.page<=page);$('#bookChapter').value=String(chapter?.page||0);
}
function sizePaper(){
 if(!book)return;
 const stage=$('#bookStage'),pages=$('#paperStack').querySelectorAll('.paper-page'),padding=window.innerWidth<=620?24:48;
 if(!pages.length)return;
 const availableWidth=Math.max(200,stage.clientWidth-padding);
 const availableHeight=Math.max(240,stage.clientHeight-padding);
 const baseHeight=Math.min(availableHeight,availableWidth/(pages.length*book.ratio));
 const height=Math.max(120,baseHeight)*zoom,width=height*book.ratio;
 for(const p of pages){p.style.height=height+'px';p.style.width=width+'px';}
}
function makePage(number,image){const wrapper=document.createElement('div');wrapper.className='paper-page';wrapper.dataset.page=number;const img=document.createElement('img');img.src=image.src;img.alt=`${book.title} — trang ${number}`;img.width=image.naturalWidth;img.height=image.naturalHeight;img.draggable=false;wrapper.append(img);return wrapper;}
async function showPage(value,{animate=false,direction=1,push=false}={}){
 if(!book)return;
 const currentBook=book,target=boundedPage(value,book.pages),generation=++token;
 busy=true;failedPage=null;$('#bookError').hidden=true;updateControls();
 const nextTwo=shouldUseTwo(),numbers=spreadPages(target,book.pages,nextTwo);
 try{
  const images=await Promise.all(numbers.map(n=>imageFor(currentBook.grade,n)));
  if(generation!==token||book!==currentBook)return;
  const stack=$('#paperStack'),oldImages=[...stack.querySelectorAll('.paper-page img')],oldImage=direction>0?oldImages.at(-1):oldImages[0];
  const previous=oldImage?.src;
  stack.replaceChildren(...numbers.map((n,i)=>makePage(n,images[i])));
  page=target;two=nextTwo;sizePaper();
  $('#bookStage').scrollTop=0;$('#bookStage').scrollLeft=0;
  updateURL(push);savePage();
  if(animate&&previous&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const targetPage=direction>0?stack.lastElementChild:stack.firstElementChild;
   const layer=document.createElement('div');layer.className='turning-page'+(direction<0?' backward':'');
   layer.style.width=targetPage.style.width;layer.style.height=targetPage.style.height;layer.style.left=(direction>0?targetPage.offsetLeft:0)+'px';
   const front=document.createElement('img');front.src=previous;front.alt='';
   const back=document.createElement('img');back.src=images[direction>0?0:images.length-1].src;back.alt='';back.className='turn-back';layer.append(front,back);stack.append(layer);
   const animation=layer.animate?.([{transform:'rotateY(0deg)',opacity:1},{transform:`rotateY(${direction>0?-165:165}deg)`,opacity:.9}],{duration:420,easing:'cubic-bezier(.25,.65,.3,1)',fill:'forwards'});
   try{await animation?.finished;}catch{}layer.remove();
  }
  if(generation!==token||book!==currentBook)return;
  $('#bookStatus').textContent=`${book.title}, trang ${numbers.join(' và ')} trên ${book.pages}`;
  const nearby=[numbers[0]-1,numbers.at(-1)+1].filter(n=>n>=1&&n<=book.pages);
  nearby.forEach(n=>{imageFor(book.grade,n).catch(()=>{});});
 }catch{
  if(generation===token){failedPage=target;$('#bookError').hidden=false;$('#bookStatus').textContent='Chưa tải được trang sách.';}
 }finally{if(generation===token){busy=false;updateControls();}}
}
async function openBook(grade,value,{push=false}={}){
 const selected=catalog.find(b=>b.grade===Number(grade));if(!selected){showShelf();return;}
 ++token;book=selected;page=boundedPage(value??savedPage(book.grade,book.pages),book.pages);zoom=1;two=shouldUseTwo();
 $('#bookShelf').hidden=true;$('#reader').hidden=false;$('#paperStack').replaceChildren();
 $('#readingTitle').textContent=book.title;document.title=book.title+' · Quanh Lab';
 $('#bookGrade').innerHTML=catalog.map(b=>`<option value="${b.grade}" ${b===book?'selected':''}>Lớp ${b.grade}</option>`).join('');
 $('#bookChapter').innerHTML='<option value="0">Mục lục</option><option value="1">Bìa sách</option>'+book.chapters.map(c=>`<option value="${c.page}">${escape(c.title)}</option>`).join('');
 await showPage(page,{push});
}
function showShelf(){++token;book=null;busy=false;$('#reader').hidden=true;$('#bookShelf').hidden=false;document.title='Sách giáo khoa · Quanh Lab';$('#paperStack').replaceChildren();cache.clear();}
async function readRoute(){const params=new URLSearchParams(location.search);if(params.has('grade'))await openBook(params.get('grade'),params.has('page')?params.get('page'):undefined);else showShelf();}
function navigate(direction){if(!book||busy)return;const next=turnPage(page,book.pages,two,direction);if(next!==page)showPage(next,{animate:true,direction});}
function changeZoom(amount){if(!book)return;zoom=Math.max(1,Math.min(2.5,zoom+amount));const nextTwo=shouldUseTwo();if(nextTwo!==two)showPage(page);else{sizePaper();updateControls();}}
async function fullscreen(){const reader=$('#reader');if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}else if(reader.classList.contains('reading-focus'))reader.classList.remove('reading-focus');else{try{if(!reader.requestFullscreen)throw Error();await reader.requestFullscreen();}catch{reader.classList.add('reading-focus');}}$('#bookFullscreen').setAttribute('aria-label',document.fullscreenElement||reader.classList.contains('reading-focus')?'Thoát toàn màn hình':'Đọc toàn màn hình');resize();}
function resize(){if(!book)return;const desired=shouldUseTwo();if(desired!==two)showPage(page);else sizePaper();}

$('#bookPrevious').addEventListener('click',()=>navigate(-1));$('#bookNext').addEventListener('click',()=>navigate(1));
$('#pageForm').addEventListener('submit',event=>{event.preventDefault();if(!book)return;const value=$('#bookPage').value;if(!value||!Number.isFinite(Number(value))){updateControls();return;}showPage(value);});
$('#zoomIn').addEventListener('click',()=>changeZoom(.25));$('#zoomOut').addEventListener('click',()=>changeZoom(-.25));
$('#spreadMode').addEventListener('click',()=>{if(two)preferTwo=false;else{preferTwo=true;zoom=1;}showPage(page);});
$('#bookGrade').addEventListener('change',()=>openBook($('#bookGrade').value,undefined,{push:true}));
$('#bookChapter').addEventListener('change',()=>{const target=Number($('#bookChapter').value);if(target)showPage(target);});
$('#bookFullscreen').addEventListener('click',fullscreen);$('#retryBook').addEventListener('click',()=>showPage(failedPage??page));
document.addEventListener('fullscreenchange',()=>{const on=Boolean(document.fullscreenElement)||$('#reader').classList.contains('reading-focus');$('#bookFullscreen').setAttribute('aria-label',on?'Thoát toàn màn hình':'Đọc toàn màn hình');resize();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('#reader').classList.remove('reading-focus');if(!document.fullscreenElement)$('#bookFullscreen').setAttribute('aria-label','Đọc toàn màn hình');resize();return;}if(!book||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea'))return;if(event.key==='ArrowRight'){event.preventDefault();navigate(1);}else if(event.key==='ArrowLeft'){event.preventDefault();navigate(-1);}else if(event.key==='Home'){event.preventDefault();showPage(1);}else if(event.key==='End'){event.preventDefault();showPage(book.pages);}});
$('#bookStage').addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'&&zoom===1)gesture={x:event.clientX,y:event.clientY};});
$('#bookStage').addEventListener('pointerup',event=>{if(!gesture)return;const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;gesture=null;if(Math.abs(dx)>55&&Math.abs(dy)<40)navigate(dx<0?1:-1);});
$('#bookStage').addEventListener('pointercancel',()=>{gesture=null;});
window.addEventListener('resize',resize);window.addEventListener('popstate',readRoute);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizePaper).observe($('#bookStage'));

try{
 const response=await fetch('books/catalog.json?v=40');if(!response.ok)throw Error('catalog-load');catalog=await response.json();
 $('#bookCards').innerHTML=catalog.map(b=>`<a class="textbook-card" href="books.html?grade=${b.grade}" aria-label="Đọc ${escape(b.title)}"><div class="textbook-cover"><img src="books/${b.grade}/cover.webp" width="340" height="480" alt="Bìa ${escape(b.title)}" decoding="async"></div><div><div class="textbook-meta"><h2>${escape(b.title)}</h2><span>${b.pages} trang</span></div>${b.sample?'<div class="textbook-edition">Bản mẫu</div>':''}</div><span class="textbook-open">Đọc sách <span aria-hidden="true">↗</span></span></a>`).join('');
 $('#bookCards').addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();openBook(new URL(link.href).searchParams.get('grade'),undefined,{push:true});});
 await readRoute();
}catch{$('#bookCards').innerHTML='<p role="alert">Chưa mở được thư viện sách. <a href="books.html">Tải lại</a></p>';}
