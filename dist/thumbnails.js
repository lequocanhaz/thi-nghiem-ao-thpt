// Quanh Lab v42: static, versioned, individual 2D physics thumbnails.
// No WebGL initialization, no on-scroll simulation screenshot capture.
let observer=null,generation=0;
const STATIC_BASE=new URL('./images/thumbnails-2d/',import.meta.url);
function markUnavailable(el){
 if(!el?.isConnected)return;
 el.dataset.ready='true';
 el.setAttribute('title','Chưa tải được hình minh họa này. Bạn vẫn có thể mở thí nghiệm.');
}
function load(el,own,validIds){
 if(el.dataset.ready||el.dataset.loading)return;
 const id=el.dataset.thumb;
 if(!id||!validIds.has(id)){markUnavailable(el);return;}
 el.dataset.loading='true';
 const image=document.createElement('img');
 image.alt='';
 image.width=960;
 image.height=600;
 image.loading='lazy';
 image.decoding='async';
 image.onload=()=>{
  if(own!==generation||!el.isConnected)return;
  el.replaceChildren(image);
  el.dataset.ready='true';
  delete el.dataset.loading;
 };
 image.onerror=()=>{
  if(own!==generation)return;
  delete el.dataset.loading;
  markUnavailable(el);
 };
 image.src=new URL(encodeURIComponent(id)+'.webp',STATIC_BASE).href;
}
export function stopThumbnails(){
 generation++;
 observer?.disconnect();
 observer=null;
}
export function observeThumbnails(experiments){
 stopThumbnails();
 const own=generation;
 const validIds=new Set(experiments.map(item=>item.id));
 const elements=[...document.querySelectorAll('[data-thumb]')];
 if(!('IntersectionObserver'in globalThis)){
  elements.forEach(el=>load(el,own,validIds));
  return;
 }
 observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   observer?.unobserve(entry.target);
   load(entry.target,own,validIds);
  }
 },{rootMargin:'220px'});
 elements.forEach(el=>observer.observe(el));
}
