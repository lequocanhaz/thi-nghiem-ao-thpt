import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {setLocale} from '../dist/i18n.js?v=54';
import {installLanguageUI} from '../dist/language-ui.js';

const {document,window}=parseHTML('<html><head><title></title><meta name="description"></head><body><header class="header"><nav></nav></header><main id="main"><div id="status">Sẵn sàng</div><input id="value" value="1.23456789"><canvas></canvas><p id="notes">An unchanged note</p></main><dialog id="dialog"></dialog><div id="aiAssistant"></div><div id="toast"></div><footer>Giới thiệu</footer></body></html>');
globalThis.document=document;globalThis.location={hash:''};
globalThis.NodeFilter={SHOW_ELEMENT:1,SHOW_TEXT:4};
globalThis.CustomEvent=window.CustomEvent;
const frames=[],observers=[];
globalThis.requestAnimationFrame=callback=>frames.push(callback);
globalThis.MutationObserver=class{
 constructor(callback){this.callback=callback;observers.push(this);}
 observe(){}disconnect(){}
};
const input=document.querySelector('input'),canvas=document.querySelector('canvas');
setLocale('en-US');installLanguageUI();
assert.equal(document.querySelector('#status').textContent,'Ready');
assert.equal(document.querySelector('footer').textContent,'About');
const createWalker=document.createTreeWalker.bind(document),visited=[];
document.createTreeWalker=(root,...args)=>{visited.push(root);return createWalker(root,...args);};
const status=document.querySelector('#status');
for(let i=0;i<30;i++){
 status.textContent=i%2?'Sẵn sàng':'Đang chạy';
 observers.at(-1).callback([{type:'childList',target:status,addedNodes:[status.firstChild]}]);
 while(frames.length)frames.shift()();
 assert.equal(status.textContent,i%2?'Ready':'Running');
}
assert.equal(visited.length,0,'Readout text changes must not traverse the whole page or even a subtree');
const subtree=document.createElement('section');subtree.innerHTML='<p>Thông số</p><span>Đồ thị</span>';document.querySelector('#main').append(subtree);
observers.at(-1).callback([{type:'childList',target:subtree.parentElement,addedNodes:[subtree,subtree.firstChild]}]);
while(frames.length)frames.shift()();
assert.deepEqual(visited,[subtree],'Translate an inserted ancestor once, without duplicate child walks');
assert.equal(subtree.firstChild.textContent,'Parameters');
assert.equal(subtree.lastChild.textContent,'Graph');
document.querySelector('[data-locale="vi-VN"]').click();
assert.equal(status.textContent,'Sẵn sàng');
assert.equal(subtree.firstChild.textContent,'Thông số');
assert.equal(document.querySelector('input'),input);assert.equal(input.value,'1.23456789');
assert.equal(document.querySelector('canvas'),canvas);assert.equal(document.querySelector('#notes').textContent,'An unchanged note');
console.log('PASS incremental locale updates: 30 readout updates avoid page walks, nested inserts deduplicated, VI/EN roundtrip preserves controls, values, canvas and notes. DOM instrumentation, not a hardware performance benchmark.');
