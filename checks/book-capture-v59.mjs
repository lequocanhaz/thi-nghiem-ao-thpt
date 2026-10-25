import assert from 'node:assert/strict';
import {bindBookTouch} from '../dist/book-touch.js';

function surface(){
 const listeners=new Map(),hostListeners=new Map(),calls=[];
 let captured=null;
 const stage={clientWidth:300,querySelector:()=>({getBoundingClientRect:()=>({width:250})}),
  addEventListener:(name,handler)=>listeners.set(name,handler),
  setPointerCapture:id=>captured=id,hasPointerCapture:id=>captured===id,releasePointerCapture:()=>captured=null};
 const image={closest:()=>true};
 bindBookTouch(stage,{canStart:()=>true,begin:()=>true,move:value=>calls.push(['move',value]),finish:value=>calls.push(['finish',value])},
  {PointerEvent:class{},addEventListener:(name,handler)=>hostListeners.set(name,handler)});
 function emit(type,{x=220,y=80,time=0,target=image}={}){
  (listeners.get(type)||hostListeners.get(type))({pointerId:1,clientX:x,clientY:y,timeStamp:time,target,button:0,cancelable:true,preventDefault(){}});
 }
 return {stage,image,calls,emit};
}
let s=surface();
s.emit('pointerdown');s.emit('pointermove',{x:170,time:50});
// A real touch image has implicit pointer capture. Moving it to the parent stage
// emits a bubbling lostpointercapture on the image before the next pointermove.
s.emit('lostpointercapture',{target:s.image,time:55});
assert.equal(s.calls.some(c=>c[0]==='finish'),false,'implicit capture transfer must retain the gesture');
s.emit('pointermove',{x:80,time:100});s.emit('pointerup',{x:80,time:110});
assert.deepEqual(s.calls.at(-1),['finish',true],'touch continues and commits after ownership transfer');

s=surface();s.emit('pointerdown');s.emit('pointermove',{x:170,time:50});
s.emit('lostpointercapture',{target:s.stage,time:55});
assert.deepEqual(s.calls.at(-1),['finish',false],'actual stage capture loss must cancel safely');
s.emit('pointerup',{x:80,time:110});
assert.equal(s.calls.filter(c=>c[0]==='finish').length,1,'no second completion after cancellation');
console.log('PASS v59: implicit child-to-stage pointer capture transfer preserves book drag; actual stage capture loss cancels once. Synthetic events; browser touch tested separately.');
