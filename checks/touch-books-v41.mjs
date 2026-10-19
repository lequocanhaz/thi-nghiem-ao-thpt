import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {bindBookTouch} from '../dist/book-touch.js';

// Exercise the shipped pointer/touch handlers, including pointer ownership and cancellation.
function surface(pointer=true){
 const handlers=new Map(),hostHandlers=new Map(),calls=[];let captured=null,enabled=true;
 const stage={clientWidth:300,querySelector:()=>({getBoundingClientRect:()=>({width:250})}),addEventListener:(type,fn)=>handlers.set(type,fn),setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};
 const host={PointerEvent:pointer?class{}:undefined,addEventListener:(type,fn)=>hostHandlers.set(type,fn)};
 const control=bindBookTouch(stage,{canStart:()=>enabled,begin:d=>{calls.push(['begin',d]);return true;},move:p=>calls.push(['move',p]),finish:c=>calls.push(['finish',c])},host);
 const emit=(type,x,y,t=0,id=1)=>{const event={clientX:x,clientY:y,timeStamp:t,pointerId:id,button:0,target:{closest:()=>true},cancelable:true,preventDefault(){calls.push(['prevent']);}};(handlers.get(type)||hostHandlers.get(type))(event);};
 return {calls,emit,control,handlers,hostHandlers,disable:()=>enabled=false,get captured(){return captured;}};
}
let s=surface();s.emit('pointerdown',220,80);s.emit('pointermove',120,84,100);assert.equal(s.captured,1);assert.deepEqual(s.calls.find(c=>c[0]==='move'),['move',.5]);assert.ok(!s.calls.some(c=>c[0]==='finish'),'page tracks finger before release');s.emit('pointerup',120,84,110);assert.deepEqual(s.calls.at(-1),['finish',true]);
s=surface();s.emit('pointerdown',100,80);s.emit('pointermove',130,83,150);s.emit('pointerup',130,83,350);assert.deepEqual(s.calls.at(-1),['finish',false],'short pull snaps back');
s=surface();s.emit('pointerdown',100,80);s.emit('pointermove',185,82,160);s.emit('pointerup',185,82,170);assert.deepEqual(s.calls.find(c=>c[0]==='begin'),['begin',-1]);assert.deepEqual(s.calls.at(-1),['finish',true]);
s=surface();s.emit('pointerdown',100,80);s.emit('pointermove',104,130,70);s.emit('pointerup',104,130,90);assert.equal(s.calls.length,0,'vertical scroll untouched');
s=surface();s.emit('pointerdown',200,80);s.emit('pointermove',150,80,25);s.emit('pointerdown',100,100,30,2);assert.deepEqual(s.calls.at(-1),['finish',false],'second finger cancels flip');
s=surface();s.emit('pointerdown',200,80);s.emit('pointermove',100,80,100);s.emit('pointercancel',100,80,110);assert.deepEqual(s.calls.at(-1),['finish',false]);s.emit('pointerup',100,80,120);assert.equal(s.calls.filter(c=>c[0]==='finish').length,1);
s=surface();s.disable();s.emit('pointerdown',200,80);s.emit('pointermove',100,80,100);s.emit('pointerup',100,80,110);assert.equal(s.calls.length,0,'zoom/loading gate');
s=surface(false);const te=(type,touches,changedTouches=touches,t=0)=>{const e={touches,changedTouches,target:{closest:()=>true},timeStamp:t,cancelable:true,preventDefault(){}};(s.handlers.get(type)||s.hostHandlers.get(type))(e);};const tp=x=>({identifier:9,clientX:x,clientY:80});te('touchstart',[tp(200)]);te('touchmove',[tp(110)],undefined,120);te('touchend',[],[tp(110)],150);assert.deepEqual(s.calls.at(-1),['finish',true],'legacy Touch Events fallback');

// Run the actual reader against its DOM and image loading lifecycle, without claiming browser pixels.
const {document,window}=parseHTML(fs.readFileSync(new URL('../dist/books.html',import.meta.url),'utf8'));
let reduceMotion=false,failImageSuffix=null;
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:reduceMotion}),location:{href:'https://lab.example/books.html?grade=10&page=4',search:'?grade=10&page=4'},history:{replaceState(){},pushState(){}},localStorage:{getItem:()=>null,setItem(){}},fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../dist/books/catalog.json',import.meta.url),'utf8'))}),Image:class{naturalWidth=1120;naturalHeight=1600;decode=async()=>{};set src(value){this._src=value;queueMicrotask(()=>failImageSuffix&&value.endsWith(failImageSuffix)?this.onerror?.():this.onload?.());}get src(){return this._src;}}});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return this._value||this.querySelector('option[selected]')?.getAttribute('value')||this.querySelector('option')?.getAttribute('value')||'';},set(value){this._value=String(value);}});
window.innerWidth=390;window.PointerEvent=class{};
const stage=document.querySelector('#bookStage');Object.defineProperties(stage,{clientWidth:{value:358},clientHeight:{value:500}});
window.HTMLElement.prototype.getBoundingClientRect=function(){return {width:parseFloat(this.style.width)||250,height:parseFloat(this.style.height)||400};};
window.HTMLElement.prototype.animate=function(){return {finished:Promise.resolve(),cancel(){}};};
await import('../dist/book-reader.js?touch-test=41');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};await flush();
const send=(type,x,y,t,id=1)=>{const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,timeStamp:t,pointerId:id,button:0});document.querySelector('.paper-page img').dispatchEvent(e);};
assert.equal(document.querySelector('#bookPage').value,'4');
send('pointerdown',240,100,0);send('pointermove',70,103,200);assert.ok(stage.classList.contains('is-turning'));assert.ok(Number(stage.dataset.turnProgress)>.28);assert.equal(document.querySelector('#bookPage').value,'4');send('pointerup',70,103,220);await flush();assert.equal(document.querySelector('#bookPage').value,'5');assert.ok(!stage.classList.contains('is-turning'));
send('pointerdown',100,100,0);send('pointermove',130,100,150);send('pointerup',130,100,400);await flush();assert.equal(document.querySelector('#bookPage').value,'5','cancel preserves page');
send('pointerdown',100,100,0);send('pointermove',270,100,200);send('pointerup',270,100,220);await flush();assert.equal(document.querySelector('#bookPage').value,'4','backward page');
document.querySelector('#zoomIn').click();send('pointerdown',240,100,0);send('pointermove',70,100,150);send('pointerup',70,100,170);await flush();assert.equal(document.querySelector('#bookPage').value,'4','zoomed page pans without flipping');
document.querySelector('#zoomOut').click();
for(const grade of [10,11,12]){
 const select=document.querySelector('#bookGrade');select.value=grade;select.dispatchEvent(new window.Event('change'));await flush();
 assert.equal(document.querySelector('#bookPage').value,'1');
 send('pointerdown',240,100,0);send('pointermove',60,103,200);send('pointerup',60,103,230);await flush();assert.equal(document.querySelector('#bookPage').value,'2','each grade flips');
 send('pointerdown',80,100,0);send('pointermove',260,103,200);send('pointerup',260,103,230);await flush();assert.equal(document.querySelector('#bookPage').value,'1');
 send('pointerdown',80,100,0);send('pointermove',260,103,200);send('pointerup',260,103,230);await flush();assert.equal(document.querySelector('#bookPage').value,'1','cover cannot turn backward');
 const input=document.querySelector('#bookPage');input.value=input.max;document.querySelector('#pageForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
 send('pointerdown',240,100,0);send('pointermove',60,103,200);send('pointerup',60,103,230);await flush();assert.equal(input.value,input.max,'last page cannot turn forward');
 input.value='4';document.querySelector('#pageForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await flush();
 window.innerWidth=932;window.dispatchEvent(new window.Event('resize'));await flush();assert.equal(document.querySelectorAll('.paper-stack>.paper-page').length,2);
 send('pointerdown',240,100,0);send('pointermove',60,103,200);send('pointerup',60,103,230);await flush();assert.equal(input.value,'6','landscape spread advances two');
 send('pointerdown',240,100,0);send('pointermove',60,103,200);window.innerWidth=390;window.dispatchEvent(new window.Event('resize'));await flush();assert.equal(input.value,'6','orientation cancels an active drag');assert.ok(!stage.classList.contains('is-turning'));
}
reduceMotion=true;
send('pointerdown',240,100,0);send('pointermove',60,103,200);send('pointerup',60,103,230);await flush();assert.equal(document.querySelector('#bookPage').value,'7','reduced motion still navigates');
failImageSuffix='books/10/002.webp';const select=document.querySelector('#bookGrade');select.value='10';select.dispatchEvent(new window.Event('change'));await flush();
send('pointerdown',240,100,0);send('pointermove',60,103,200);send('pointerup',60,103,230);await flush();assert.equal(document.querySelector('#bookPage').value,'1','failed target retains last readable page');assert.equal(document.querySelector('#bookError').hidden,false);
failImageSuffix=null;document.querySelector('#retryBook').click();await flush();assert.equal(document.querySelector('#bookPage').value,'2','retry loads the failed swipe target');
console.log('PASS v41: finger-following pointer/legacy touch handlers, forward/back, snap-back, vertical scroll, multitouch/cancel, zoom gate and actual reader DOM/image lifecycle. Synthetic events; no iPhone hardware/Safari claim.');
