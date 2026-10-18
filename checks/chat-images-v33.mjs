import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {LabAssistant} from '../dist/assistant.js';
import {prepareImage,isImageFile,imageHistory,imageLimits} from '../dist/chat-images.js';
import {experiments,initialState} from '../dist/experiments.js';
import {labMarkup} from '../dist/views.js';

const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7S0AAAAASUVORK5CYII=';
const file=name=>({name,type:'image/png',size:1000});
assert.ok(isImageFile(file('graph.png')));assert.ok(isImageFile({name:'photo.HEIC',type:'',size:100}));assert.equal(isImageFile({type:'image/svg+xml',name:'drawing.svg'}),false);
let revoked=0,sourceCount=0;const sizes=[],fakeUrl={createObjectURL(){sourceCount++;return 'blob:fixture';},revokeObjectURL(){revoked++;}};
class Picture{naturalWidth=4000;naturalHeight=3000;set src(value){if(value)queueMicrotask(()=>this.onload());}}
let encoded=0;const ctx={fillRect(){},drawImage(image,x,y,w,h){sizes.push([w,h]);}};
const canvas={width:0,height:0,getContext:()=>ctx,toDataURL:()=>{encoded++;return 'data:image/jpeg;base64,'+(encoded===1?'A'.repeat(imageLimits.maxDataLength+1):'/9j/');}};
const prepared=await prepareImage(file('diagram.png'),{ImageClass:Picture,url:fakeUrl,document:{createElement:()=>canvas}});
assert.deepEqual(sizes.slice(0,2),[[2000,1500],[1600,1200]],'Large images shrink without changing aspect ratio');assert.deepEqual(sizes.at(-1),[280,210]);assert.equal(prepared.width,1600);assert.equal(prepared.height,1200);assert.equal(revoked,1);assert.equal(canvas.width,1,'Release the full-size canvas');
await assert.rejects(prepareImage({...file('huge.png'),size:21*1024*1024},{url:fakeUrl}),/20 MB/);assert.equal(sourceCount,1);
await assert.rejects(prepareImage({name:'x.svg',type:'image/svg+xml',size:2}),/JPG/);
class Broken{set src(value){if(value)queueMicrotask(()=>this.onerror());}}
await assert.rejects(prepareImage(file('broken.png'),{ImageClass:Broken,url:fakeUrl}),/Chưa đọc được/);assert.equal(revoked,2,'Revoke object URLs on decode failure too');
const history=Array.from({length:8},(_,i)=>({role:i%2?'assistant':'user',content:String(i),...(i%2?{}:{images:[png,png]})}));
for(const count of [0,1,2]){const h=imageHistory(history,count);assert.ok(h.reduce((n,m)=>n+(m.images?.length||0),count)<=4);assert.equal(h.at(-2).images?.length,2);assert.ok(h.every(m=>m.role==='user'||!m.images));}

const {document,window}=parseHTML('<body><button id="openAssistant"></button></body>');let current='ohm',sent,sequence=0,calls=0;
const chat=new LabAssistant({document,endpoint:'https://fixture.example/api/chat',getContext:()=>({id:current}),imagePreparer:async f=>({id:'image-'+(++sequence),name:f.name,url:png,thumbnail:png}),fetcher:async(url,options)=>{calls++;sent=JSON.parse(options.body);return Response.json({answer:'Đây là đồ thị.'});}});
chat.open();assert.equal(chat.q('#aiTitle').textContent,'Trợ lý AI');assert.ok(chat.fileInput.multiple||chat.fileInput.hasAttribute('multiple'));assert.equal(chat.submit.disabled,true);
await chat.addFiles([file('graph.png')]);assert.equal(chat.q('.ai-attachments').hidden,false);assert.equal(chat.q('.ai-attachment img').alt,'graph.png');assert.equal(chat.submit.disabled,false);await chat.send();
assert.equal(calls,1);assert.equal(sent.images.length,1);assert.equal(sent.images[0],png);assert.equal(sent.context.id,'ohm');assert.equal(chat.pictures().length,0);assert.equal(chat.thread().length,2);assert.ok(chat.q('.ai-message-images img'));assert.equal(chat.thread()[0].pictures[0].name,'graph.png');chat.q('.ai-message-images button').click();assert.equal(document.querySelector('.ai-image-dialog>img').src,png);document.querySelector('.ai-image-dialog button').click();assert.equal(document.querySelector('.ai-image-dialog'),null);
chat.input.value='Nhận xét độ dốc';await chat.send();assert.equal(sent.history[0].images[0],png,'The follow-up carries the previously sent image');
await chat.addFiles([file('first.png'),file('second.png'),file('third.png')]);assert.equal(chat.pictures().length,2);assert.match(chat.status.textContent,/tối đa 2/);assert.equal(chat.attachButton.disabled,true);
chat.q('.ai-attachment button').click();assert.equal(chat.pictures().length,1);assert.equal(chat.attachButton.disabled,false);
chat.input.value='Giữ ảnh và câu hỏi';chat.fetcher=async()=>Response.json({error:'Máy chủ đang bận'},{status:503});const retained=chat.pictures()[0].id;await chat.send();assert.equal(chat.pictures()[0].id,retained);assert.equal(chat.input.value,'Giữ ảnh và câu hỏi');assert.match(chat.status.textContent,/đang bận/);
chat.fetcher=async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')),{once:true}));const canceled=chat.send();chat.controller.abort();await canceled;assert.equal(chat.pictures()[0].id,retained);assert.match(chat.status.textContent,/Đã dừng/);
current='wave';chat.refreshContext();assert.equal(chat.pictures().length,0);assert.equal(chat.input.value,'');await chat.addFiles([file('wave.png')]);chat.input.value='Bản nháp sóng';current='ohm';chat.refreshContext();assert.equal(chat.pictures()[0].id,retained);assert.equal(chat.input.value,'Giữ ảnh và câu hỏi');
let resolve;chat.fetcher=async()=>new Promise(r=>resolve=r);const waiting=chat.send();current='wave';chat.refreshContext();resolve(Response.json({answer:'Đã xem ảnh điện.'}));await waiting;assert.equal(chat.pictures()[0].name,'wave.png');assert.equal(chat.input.value,'Bản nháp sóng');assert.equal(chat.pictures('ohm').length,0);assert.match(chat.status.textContent,/bài trước/);
// Actual paste/drop/change event listeners use the same preparation and limits.
current='paste';chat.refreshContext();const paste=new window.Event('paste',{cancelable:true});paste.clipboardData={files:[file('pasted.png')]};chat.input.dispatchEvent(paste);await new Promise(setImmediate);assert.equal(chat.pictures()[0].name,'pasted.png');assert.equal(paste.defaultPrevented,true);
const drop=new window.Event('drop',{cancelable:true});drop.dataTransfer={files:[file('dropped.png')]};chat.form.dispatchEvent(drop);await new Promise(setImmediate);assert.equal(chat.pictures().length,2);
current='picker';chat.refreshContext();chat.fileInput.files=[file('picked.png')];chat.fileInput.dispatchEvent(new window.Event('change'));await new Promise(setImmediate);assert.equal(chat.pictures()[0].name,'picked.png');
current='processing';chat.refreshContext();let finishPreparation;chat.imagePreparer=async()=>new Promise(r=>finishPreparation=r);const preparing=chat.addFiles([file('delayed.png')]);assert.equal(chat.submit.disabled,true);const callCount=calls;await chat.send();assert.equal(calls,callCount);current='other';chat.refreshContext();finishPreparation({id:'delayed',name:'delayed.png',url:png,thumbnail:png});await preparing;assert.equal(chat.pictures().length,0);assert.equal(chat.pictures('processing').length,1);

const index=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(index,/<title>Quanh Lab/);assert.equal(parseHTML(index).document.querySelector('.brand-wordmark').textContent,'QUANH LAB');assert.match(index,/brand\/quanh-mark.svg/);assert.equal(parseHTML(index).document.querySelector('#openAssistant').textContent,'Trợ lý AI');
const prefs={favorites:[],recent:[],progress:{},layout:{}},config={viewMode:'3d',switches:{axes:true,grid:true}};
for(const e of experiments){const {document:lab}=parseHTML(labMarkup(e,{prefs,config,state:initialState(e),controls:'',mode:'measure',panel:'data',experiments},()=>'<svg/>'));for(const selector of ['[data-action="report"]','[data-action="pin"]','[data-action="sweep"]','[data-action="restart-view"]','.view-menu','[data-camera]'])assert.equal(lab.querySelector(selector),null,e.id+' removed '+selector);assert.ok(lab.querySelector('[data-action="play"]'));assert.ok(lab.querySelector('[data-action="record"]'));}
const report={brand:'Quanh Lab',simplifiedLabs:300,maxCurrentImages:2,maxHistoryImages:4,tests:['local JPEG preparation, bounds, aspect ratio, URL cleanup','image-only send and image follow-up','preview/remove, two-image limit','failure/cancel preservation','route-safe attachments and asynchronous preparation','real paste/drop/picker DOM events','300 routes without removed tools'],limits:'DOM and injected decoding/transport fixtures; not OS photo picker or real Safari canvas.'};
fs.writeFileSync(new URL('./images-audit-v33.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('PASS Quanh Lab image conversations and simplified 300 labs',JSON.stringify(report));
