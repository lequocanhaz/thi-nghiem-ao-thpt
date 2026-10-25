import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {LabAssistant} from '../dist/assistant.js';

const setup=(lang='en-US')=>parseHTML(`<html lang="${lang}"><body><button id="openAssistant"></button></body></html>`);
let context={id:'ohm',title:'Định luật Ohm',parameters:[{key:'u',label:'Hiệu điện thế U',value:6}]},sent,calls=0;
const {document,window}=setup();
const chat=new LabAssistant({document,getContext:()=>context,endpoint:'https://fixture.invalid/chat',fetcher:async(url,options)=>{calls++;sent=JSON.parse(options.body);return Response.json({answer:'The current is 0.6 A.'});},imagePreparer:async()=>{throw Error('Mỗi ảnh cần nhỏ hơn 20 MB.');}});
chat.open();
assert.equal(chat.openButton.getAttribute('aria-controls'),'aiAssistant');
assert.equal(chat.openButton.getAttribute('aria-expanded'),'true');
assert.equal(chat.q('#aiTitle').textContent,'AI assistant');
assert.equal(chat.q('.ai-context').textContent,"Investigating Ohm's law");
assert.equal(chat.q('.ai-messages').getAttribute('aria-label'),'Conversation');
assert.equal(chat.q('label').textContent,'Your question');
assert.equal(chat.q('[data-ai=close]').getAttribute('aria-label'),'Close chat');
assert.equal(chat.attachButton.getAttribute('aria-label'),'Attach images');
assert.equal(chat.submit.textContent,'Send ↑');
assert.match(chat.input.placeholder,/Ask a question/);
assert.match(chat.q('.ai-prompt-hint').textContent,/press Send/);
chat.q('.ai-prompt').click();assert.match(chat.input.value,/Ohm's law/);assert.doesNotMatch(chat.input.value,/Định luật/);
chat.input.value='Keep this draft';await chat.addFiles([{name:'huge.png'}]);
assert.match(chat.status.textContent,/20 MB/);assert.equal(chat.status.dataset.state,'error');assert.equal(chat.input.value,'Keep this draft');
chat.fetcher=async()=>Response.json({error:'Dịch vụ AI đang bận. Hãy thử lại sau.'},{status:429});
await chat.send();assert.match(chat.status.textContent,/request limit or is busy/);assert.equal(chat.input.value,'Keep this draft');assert.equal(chat.thread().length,0);
chat.fetcher=async()=>Response.json({error:'Chủ website cần kiểm tra thanh toán OpenAI API.'},{status:429});await chat.send();assert.match(chat.status.textContent,/API billing/);
chat.fetcher=async()=>{throw new TypeError('Load failed');};await chat.send();assert.match(chat.status.textContent,/Check your connection/);assert.doesNotMatch(chat.status.textContent,/Load failed/);
// An image-only English request must not synthesize a Vietnamese user message.
chat.fetcher=async(url,options)=>{sent=JSON.parse(options.body);return Response.json({answer:'A sample graph.'});};
chat.input.value='';chat.pictures().push({id:'one',name:'Graph.png',url:'data:image/png;base64,fixture'});await chat.send();
assert.equal(sent.question,'Analyze this image.');assert.equal(sent.locale,'en-US');
assert.equal(chat.q('[data-role=user]').getAttribute('aria-label'),'You');
assert.match(chat.q('.ai-message-images button').getAttribute('aria-label'),/^View image/);
chat.q('.ai-message-images button').click();assert.equal(chat.imageDialog.getAttribute('aria-label'),'Sent image');assert.equal(chat.imageDialog.querySelector('button').getAttribute('aria-label'),'Close image');chat.imageDialog.querySelector('button').click();
// Changing locale preserves both source-language conversation and unsent drafts.
chat.input.value='My unsent question';document.documentElement.lang='vi';chat.render();assert.equal(chat.input.value,'My unsent question');assert.equal(chat.q('#aiTitle').textContent,'Trợ lý AI');assert.match(chat.q('.ai-messages').textContent,/A sample graph/);
document.documentElement.lang='en-US';chat.render();assert.equal(chat.input.value,'My unsent question');assert.equal(chat.submit.textContent,'Send ↑');
// Coarse-pointer Enter belongs to the multiline composer, without accidental POST.
let mobileCalls=0;
const mobile=new LabAssistant({document:setup().document,coarsePointer:()=>true,endpoint:'https://fixture.invalid/chat',fetcher:async()=>{mobileCalls++;return Response.json({answer:'Fixture'});}});
mobile.input.value='Line one';
const key=(options={})=>{const event=new window.Event('keydown',{cancelable:true});Object.assign(event,{key:'Enter',...options});return event;};
const enter=key();mobile.input.dispatchEvent(enter);assert.equal(enter.defaultPrevented,false);assert.equal(mobileCalls,0);
const ime=key({isComposing:true,ctrlKey:true});mobile.input.dispatchEvent(ime);assert.equal(ime.defaultPrevented,false);assert.equal(mobileCalls,0);
const shortcut=key({ctrlKey:true});mobile.input.dispatchEvent(shortcut);await new Promise(setImmediate);assert.equal(shortcut.defaultPrevented,true);assert.equal(mobileCalls,1);
// Slow requests and explicit cancellation produce distinct, recoverable feedback.
chat.fetcher=async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')),{once:true}));
chat.input.value='Preserve after timeout';
const originalTimeout=globalThis.setTimeout;let fireTimeout;
try{
 globalThis.setTimeout=(callback,delay)=>{assert.equal(delay,55000);fireTimeout=callback;return 0;};
 const pending=chat.send();assert.equal(chat.submit.textContent,'Stop');fireTimeout();await pending;
}finally{globalThis.setTimeout=originalTimeout;}
assert.match(chat.status.textContent,/took too long/);assert.equal(chat.input.value,'Preserve after timeout');assert.equal(chat.status.dataset.state,'error');
const pending=chat.send();chat.controller.abort();await pending;assert.match(chat.status.textContent,/Stopped waiting/);assert.equal(chat.input.value,'Preserve after timeout');
chat.close();assert.equal(chat.openButton.getAttribute('aria-expanded'),'false');
console.log('PASS assistant UX v59: complete VI/EN shell/status/aria, English image-only message, context prompts, server/image errors, locale/draft retention, coarse-pointer multiline Enter and IME, distinct timeout/cancel, no real API calls.');
