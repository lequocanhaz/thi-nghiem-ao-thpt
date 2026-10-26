// Catalog photos are pre-rendered from the real simulations, never generated
// on a student's device. Keep existing IndexedDB/session data untouched.
let cleanups=[];
export function stopThumbnails(){for(const cleanup of cleanups)cleanup();cleanups=[];}
export function observeThumbnails(){
 stopThumbnails();
 for(const frame of document.querySelectorAll('[data-static-preview]')){
  const img=frame.querySelector('img'),link=frame.querySelector('.preview-link'),fallback=frame.querySelector('.preview-fallback'),retry=frame.querySelector('[data-preview-retry]');
  if(!img||!link||!fallback||!retry)continue;
  const source=img.getAttribute('src');let attempt=0;
  const loaded=()=>{link.hidden=false;fallback.hidden=true;frame.dataset.previewStatus='ready';};
  const failed=()=>{const focused=document.activeElement===link;link.hidden=true;fallback.hidden=false;frame.dataset.previewStatus='error';if(focused)retry.focus?.({preventScroll:true});};
  const again=()=>{frame.dataset.previewStatus='loading';fallback.hidden=true;link.hidden=false;img.src=source+(source.includes('?')?'&':'?')+'retry='+(++attempt);link.focus?.({preventScroll:true});};
  img.addEventListener('load',loaded);img.addEventListener('error',failed);retry.addEventListener('click',again);
  cleanups.push(()=>{img.removeEventListener('load',loaded);img.removeEventListener('error',failed);retry.removeEventListener('click',again);});
  if(img.complete)(img.naturalWidth?loaded:failed)();
 }
}
