import {boundedPage,spreadPages,turnPage,pageImage} from './book-model.js?v=40';
import {bindBookTouch} from './book-touch.js?v=41';
import {getLocale,onLocaleChange} from './i18n.js?v=54';
import {localizedBookTitle,localizedBookString,bookChapterOptionGroups,bookShelfCards,pageStatusText} from './book-copy.js?v=58';

const $=s=>document.querySelector(s);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalog=[],book=null,page=1,zoom=1,preferTwo=true,two=false,token=0,busy=false,failedPage=null,activeTurn=null,touchController=null;
const cache=new Map();
const browserZoomed=()=>Number(window.visualViewport?.scale||1)>1.01;
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
 $('#zoomValue').textContent=Math.round(zoom*100)+'%';$('#spreadMode').setAttribute('aria-pressed',String(two));$('#spreadMode').textContent=two?localizedBookString('Một trang','Single page'):localizedBookString('Hai trang','Two pages');
 $('#bookStage').setAttribute('aria-busy',String(busy));$('#bookStage').style.touchAction=zoom>1||browserZoomed()?'pan-x pan-y pinch-zoom':'pan-y pinch-zoom';
 const chapter=[...book.chapters,...book.lessons].sort((a,b)=>b.page-a.page).find(c=>c.page<=page);$('#bookChapter').value=String(page===1?1:page===book.contentsPage?book.contentsPage:chapter?.page||0);
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
function makePage(number,image){const wrapper=document.createElement('div');wrapper.className='paper-page';wrapper.dataset.page=number;const img=document.createElement('img');img.src=image.src;img.alt=localizedBookTitle(book)+' — '+localizedBookString('trang ','page ')+number;img.width=image.naturalWidth;img.height=image.naturalHeight;img.draggable=false;wrapper.append(img);return wrapper;}
function discardTurn(){if(activeTurn){activeTurn.animation?.cancel();activeTurn.layer.remove();activeTurn.under.remove();activeTurn=null;}$('#bookStage').classList.remove('is-turning');delete $('#bookStage').dataset.turnProgress;}
function previewTurn(direction){
 if(!book||busy||zoom!==1)return false;
 const target=turnPage(page,book.pages,two,direction);if(target===page)return false;
 const stack=$('#paperStack'),oldPages=[...stack.querySelectorAll('.paper-page')],leaf=direction>0?oldPages.at(-1):oldPages[0];if(!leaf)return false;
 const layer=document.createElement('div');layer.className='turning-page'+(direction<0?' backward':'');layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{width:leaf.style.width,height:leaf.style.height,left:leaf.offsetLeft+'px'});
 const front=leaf.querySelector('img').cloneNode();front.alt='';const back=front.cloneNode();back.className='turn-back';layer.append(front,back);
 const under=document.createElement('div');under.className='turn-under';under.setAttribute('aria-hidden','true');
 stack.append(under,layer);$('#bookStage').classList.add('is-turning');
 const preview={layer,under,direction,target,progress:0};activeTurn=preview;
 const numbers=spreadPages(target,book.pages,two),grade=book.grade;
 preview.loaded=Promise.all(numbers.map(n=>imageFor(grade,n))).then(images=>{
  if(activeTurn!==preview)return;
  under.replaceChildren(...numbers.map((n,i)=>{const p=makePage(n,images[i]);p.style.width=leaf.style.width;p.style.height=leaf.style.height;return p;}));
  back.src=images[direction>0?0:images.length-1].src;
 });preview.loaded.catch(()=>{});return true;
}
function previewProgress(value){const p=activeTurn;if(!p)return;p.progress=value;$('#bookStage').dataset.turnProgress=value.toFixed(3);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;p.layer.style.transform=reduced?'none':`rotateY(${(p.direction>0?-165:165)*value}deg)`;p.layer.style.opacity=reduced?String(1-value*.8):'1';}
async function finishTurn(commit){
 const p=activeTurn;if(!p)return;busy=true;updateControls();
 try{
  if(commit)await p.loaded;if(activeTurn!==p)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduced){p.animation=p.layer.animate?.([{transform:p.layer.style.transform||'rotateY(0deg)'},{transform:`rotateY(${(p.direction>0?-165:165)*(commit?1:0)}deg)`}],{duration:Math.max(120,280*Math.abs((commit?1:0)-p.progress)),easing:'ease-out',fill:'forwards'});try{await p.animation?.finished;}catch{}}
  if(activeTurn!==p)return;
  if(commit)await showPage(p.target,{fromTurn:true});
 }catch{if(activeTurn===p){failedPage=p.target;$('#bookError').hidden=false;$('#bookStatus').textContent=localizedBookString('Chưa tải được trang sách.','Could not load the textbook page.');}}
 finally{if(activeTurn===p){discardTurn();busy=false;updateControls();}}
}
async function showPage(value,{animate=false,direction=1,push=false,fromTurn=false}={}){
 if(!book)return;
 if(!fromTurn){touchController?.reset();discardTurn();}
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
  $('#bookStatus').textContent=pageStatusText(book,numbers);
  const nearby=[numbers[0]-1,numbers.at(-1)+1].filter(n=>n>=1&&n<=book.pages);
  nearby.forEach(n=>{imageFor(book.grade,n).catch(()=>{});});
 }catch{
  if(generation===token){failedPage=target;$('#bookError').hidden=false;$('#bookStatus').textContent=localizedBookString('Chưa tải được trang sách.','Could not load the textbook page.');}
 }finally{if(generation===token){busy=false;updateControls();}}
}
async function openBook(grade,value,{push=false}={}){
 touchController?.reset();discardTurn();
 const selected=catalog.find(b=>b.grade===Number(grade));if(!selected){showShelf();return;}
 ++token;book=selected;page=boundedPage(value??savedPage(book.grade,book.pages),book.pages);zoom=1;two=shouldUseTwo();
 $('#bookShelf').hidden=true;$('#reader').hidden=false;$('#paperStack').replaceChildren();
 $('#readingTitle').textContent=localizedBookTitle(book);document.title=localizedBookTitle(book)+' · Quanh Lab';
 $('#bookGrade').innerHTML=catalog.map(b=>`<option value="${b.grade}" ${b===book?'selected':''}>${localizedBookString('Lớp ','Grade ')}${b.grade}</option>`).join('');
 $('#bookChapter').innerHTML=bookChapterOptionGroups(book,escape);
 await showPage(page,{push});
}
// Language changes must never reopen books, reset zoom, drop pages or alter URL/page storage.
function refreshBookLabels(){
 if(!catalog.length)return;
 const cards=$('#bookCards');
 if(cards)cards.innerHTML=bookShelfCards(catalog,escape);
 if(!book){document.title=localizedBookString('Sách giáo khoa','Textbooks')+' · Quanh Lab';return;}
 const chapter=$('#bookChapter'),selected=chapter.value;
 $('#readingTitle').textContent=localizedBookTitle(book);
 document.title=localizedBookTitle(book)+' · Quanh Lab';
 $('#bookGrade').innerHTML=catalog.map(b=>`<option value="${b.grade}" ${b===book?'selected':''}>${localizedBookString('Lớp ','Grade ')}${b.grade}</option>`).join('');
 chapter.innerHTML=bookChapterOptionGroups(book,escape);
 chapter.value=selected;
 for(const image of document.querySelectorAll('#paperStack .paper-page img')){
  image.alt=localizedBookTitle(book)+' — '+localizedBookString('trang ','page ')+image.closest('.paper-page')?.dataset.page;
 }
 updateControls();
 $('#bookStatus').textContent=pageStatusText(book,spreadPages(page,book.pages,two));
}
onLocaleChange(refreshBookLabels);
function showShelf(){touchController?.reset();discardTurn();++token;book=null;busy=false;$('#reader').hidden=true;$('#bookShelf').hidden=false;document.title=localizedBookString('Sách giáo khoa','Textbooks')+' · Quanh Lab';$('#paperStack').replaceChildren();cache.clear();}
async function readRoute(){const params=new URLSearchParams(location.search);if(params.has('grade'))await openBook(params.get('grade'),params.has('page')?params.get('page'):undefined);else showShelf();}
function navigate(direction){if(!book||busy)return;const next=turnPage(page,book.pages,two,direction);if(next!==page)showPage(next,{animate:true,direction});}
function changeZoom(amount){if(!book)return;touchController?.reset();if(activeTurn){discardTurn();busy=false;}zoom=Math.max(1,Math.min(2.5,zoom+amount));const nextTwo=shouldUseTwo();if(nextTwo!==two)showPage(page);else{sizePaper();updateControls();}}
async function fullscreen(){const reader=$('#reader');if(document.fullscreenElement){try{await document.exitFullscreen();}catch{}}else if(reader.classList.contains('reading-focus'))reader.classList.remove('reading-focus');else{try{if(!reader.requestFullscreen)throw Error();await reader.requestFullscreen();}catch{reader.classList.add('reading-focus');}}$('#bookFullscreen').setAttribute('aria-label',document.fullscreenElement||reader.classList.contains('reading-focus')?localizedBookString('Thoát toàn màn hình','Exit fullscreen'):localizedBookString('Đọc toàn màn hình','Fullscreen reader'));resize();}
function resize(){if(!book)return;touchController?.reset();if(activeTurn){discardTurn();busy=false;updateControls();}const desired=shouldUseTwo();if(desired!==two)showPage(page);else sizePaper();}

$('#bookPrevious').addEventListener('click',()=>navigate(-1));$('#bookNext').addEventListener('click',()=>navigate(1));
$('#pageForm').addEventListener('submit',event=>{event.preventDefault();if(!book)return;const value=$('#bookPage').value;if(!value||!Number.isFinite(Number(value))){updateControls();return;}showPage(value);});
$('#zoomIn').addEventListener('click',()=>changeZoom(.25));$('#zoomOut').addEventListener('click',()=>changeZoom(-.25));
$('#spreadMode').addEventListener('click',()=>{if(two)preferTwo=false;else{preferTwo=true;zoom=1;}showPage(page);});
$('#bookGrade').addEventListener('change',()=>openBook($('#bookGrade').value,undefined,{push:true}));
$('#bookChapter').addEventListener('change',()=>{const target=Number($('#bookChapter').value);if(target)showPage(target);});
$('#bookFullscreen').addEventListener('click',fullscreen);$('#retryBook').addEventListener('click',()=>showPage(failedPage??page));
document.addEventListener('fullscreenchange',()=>{const on=Boolean(document.fullscreenElement)||$('#reader').classList.contains('reading-focus');$('#bookFullscreen').setAttribute('aria-label',on?localizedBookString('Thoát toàn màn hình','Exit fullscreen'):localizedBookString('Đọc toàn màn hình','Fullscreen reader'));resize();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('#reader').classList.remove('reading-focus');if(!document.fullscreenElement)$('#bookFullscreen').setAttribute('aria-label',localizedBookString('Đọc toàn màn hình','Fullscreen reader'));resize();return;}if(!book||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,select,textarea'))return;if(event.key==='ArrowRight'){event.preventDefault();navigate(1);}else if(event.key==='ArrowLeft'){event.preventDefault();navigate(-1);}else if(event.key==='Home'){event.preventDefault();showPage(1);}else if(event.key==='End'){event.preventDefault();showPage(book.pages);}});
touchController=bindBookTouch($('#bookStage'),{canStart:()=>Boolean(book)&&!busy&&zoom===1&&!browserZoomed(),begin:previewTurn,move:previewProgress,finish:finishTurn});
window.visualViewport?.addEventListener('resize',()=>{if(browserZoomed()){touchController?.reset();if(activeTurn){discardTurn();busy=false;}}updateControls();});
window.addEventListener('resize',resize);window.addEventListener('popstate',readRoute);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizePaper).observe($('#bookStage'));

try{
 const response=await fetch('books/catalog.json?v=44');if(!response.ok)throw Error('catalog-load');catalog=await response.json();
 $('#bookCards').innerHTML=bookShelfCards(catalog,escape);
 $('#bookCards').addEventListener('click',event=>{const link=event.target.closest('a');if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();openBook(new URL(link.href).searchParams.get('grade'),undefined,{push:true});});
 await readRoute();
}catch{$('#bookCards').innerHTML='<p role="alert">Chưa mở được thư viện sách. <a href="books.html">Tải lại</a></p>';}
