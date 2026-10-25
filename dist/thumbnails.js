import {peekRenderers} from './lab-loader.js?v=49';
import {initialState} from './experiments.js?v=54';
import {evaluate,duration} from './models.js?v=54';

// Each image comes from the corresponding physics simulation, not a generic AI illustration.
// Render only visible cards; persist successfully captured previews in IndexedDB so
// all 300 can accumulate without keeping hundreds of data URLs in RAM.
const cache=new Map(),CACHE_MAX=36,DB_NAME='quanhlab-thumbnails-v39';
let renderer=null,queue=[],busy=false,token=0,observer=null,softwareOnly=false,dbPromise;
function database(){
 if(typeof indexedDB==='undefined')return Promise.resolve(null);
 if(!dbPromise)dbPromise=new Promise(resolve=>{
  try{
   const req=indexedDB.open(DB_NAME,1);
   req.onupgradeneeded=()=>req.result.createObjectStore('images');
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>resolve(null);
   req.onblocked=()=>resolve(null);
  }catch{resolve(null);}
 });
 return dbPromise;
}
async function stored(id){
 const db=await database();if(!db)return null;
 return new Promise(resolve=>{try{const req=db.transaction('images','readonly').objectStore('images').get(id);req.onsuccess=()=>resolve(typeof req.result==='string'?req.result:null);req.onerror=()=>resolve(null);}catch{resolve(null);}});
}
function remember(id,image){
 if(cache.has(id))cache.delete(id);cache.set(id,image);
 if(cache.size>CACHE_MAX)cache.delete(cache.keys().next().value);
 database().then(db=>{if(!db)return;try{db.transaction('images','readwrite').objectStore('images').put(image,id);}catch{}});
}
function show(el,url){if(!el?.isConnected)return;const img=document.createElement('img');img.src=url;img.alt='';img.loading='lazy';img.decoding='async';el.replaceChildren(img);el.dataset.ready='true';}
export function stopThumbnails(){token++;queue=[];observer?.disconnect();observer=null;}
export function observeThumbnails(experiments){
 stopThumbnails();const own=token,targets=document.querySelectorAll('[data-thumb]');
 for(const el of targets){const cached=cache.get(el.dataset.thumb);if(cached)show(el,cached);}
 if(!('IntersectionObserver'in globalThis)){for(const el of targets)if(!el.dataset.ready)queue.push({el,own});pump(experiments);return;}
 observer=new IntersectionObserver(entries=>{
  for(const item of entries)if(item.isIntersecting&&!item.target.dataset.ready){queue.push({el:item.target,own});observer.unobserve(item.target);}
  pump(experiments);
 },{rootMargin:'175px'});
 targets.forEach(el=>{if(!el.dataset.ready)observer.observe(el);});
}
async function renderThumbnail(e){
 if(!renderer){
  const {LabScene,SoftwareScene}=peekRenderers();
  if(!softwareOnly){try{renderer=new LabScene();}catch{softwareOnly=true;}}
  if(!renderer)renderer=new SoftwareScene();
 }
 renderer.renderer.setPixelRatio(1);
 renderer.renderer.shadowMap.enabled=false;
 renderer.renderer.setSize(640,400,false);
 renderer.camera.aspect=640/400;
 renderer.camera.updateProjectionMatrix();
 const s={...initialState(e),t:0};
 const cfg={mode:3,capMode:'charge',thumbnail:true,switches:{lines:true,connections:true,components:true,resultant:true,parallelogram:true,axes:false,vectors:true,trajectory:true}};
 let d=evaluate(e.id,s,cfg);
 if(e.params.some(p=>p.key==='t'))s.t=Math.min(duration(e,s,d)*.3,1.5);
 d=evaluate(e.id,s,cfg);
 renderer.update(e.id,s,d,cfg);
 renderer.view('iso');
 return renderer.capture();
}
async function pump(experiments){
 if(busy||!queue.length)return;busy=true;
 while(queue.length){
  const job=queue.shift(),el=job.el;
  if(job.own!==token||!el.isConnected||el.dataset.ready)continue;
  const id=el.dataset.thumb;
  try{
   let url=cache.get(id)||await stored(id);
   if(job.own!==token||!el.isConnected)continue;
   if(!url){
    if(!peekRenderers())continue; // Keep named lightweight cards until the first experiment is opened.
    const e=experiments.find(item=>item.id===id);
    if(!e)throw Error('Unknown simulation: '+id);
    // Yield before each capture to keep mobile scrolling responsive.
    await new Promise(resolve=>setTimeout(resolve,24));
    if(job.own!==token||!el.isConnected)continue;
    try{url=await renderThumbnail(e);}
    catch(error){
     renderer?.dispose();renderer=null;
     if(!softwareOnly){softwareOnly=true;url=await renderThumbnail(e);}
     else throw error;
    }
   }
   if(job.own!==token||!el.isConnected)continue;
   remember(id,url);show(el,url);
  }catch{
   // Keep each named placeholder rather than showing a wrong image.
   el.dataset.ready='true';
   el.setAttribute('title','Không thể tạo ảnh xem trước trên thiết bị này. Mở thí nghiệm để tiếp tục.');
  }
 }
 busy=false;
}
