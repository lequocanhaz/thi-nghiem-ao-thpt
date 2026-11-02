import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {setLocale} from '../dist/i18n.js?v=54';
import {installLanguageUI,translateShort} from '../dist/language-ui.js';

const labels=[
 ['Khoảng cách ảnh','Image distance'],['Chiều cao ảnh','Image height'],
 ['Phát tia','Trace rays'],['Minh họa chậm','Slow illustration'],['Nhập số ↗','Enter value ↗'],
 ['Thông số điều chỉnh trực tiếp','Direct manipulation parameter'],
 ['Mở ô nhập số của biến tương tác','Open numeric input for the interactive parameter'],
];
for(const [vi,en] of labels){assert.equal(translateShort(vi),en);assert.equal(translateShort('  '+vi+'  '),'  '+en+'  ');}
// Exact catalog labels only: do not translate substrings in user prose or units.
for(const text of ['Tôi chọn Khoảng cách ảnh để khảo sát','Khoảng cách ảnh của tôi','imageHeight','cm','h′ (cm)'])assert.equal(translateShort(text),text);

const {document,window}=parseHTML('<html><head><title></title><meta name="description"></head><body><header class="header"><nav></nav></header><main id="main"><canvas></canvas><div id="reading">Khoảng cách ảnh</div><button id="play">Phát tia</button><output id="timeValue">Minh họa chậm</output><button id="enter" aria-label="Mở ô nhập số của biến tương tác">Nhập số ↗</button><select aria-label="Thông số điều chỉnh trực tiếp"><option>Khoảng cách vật</option></select><input id="distance" value="43.125"><div class="notes-area">Khoảng cách ảnh</div><textarea>Chiều cao ảnh</textarea><div class="ai-messages">Phát tia</div><div class="ai-compose">Minh họa chậm</div><span class="math-tex">Khoảng cách ảnh</span><div id="rows"><span>43,125</span></div></main><dialog id="dialog"></dialog><div id="aiAssistant"></div><div id="toast"></div><footer></footer></body></html>');
globalThis.document=document;globalThis.location={hash:'#lab/lens'};
globalThis.NodeFilter={SHOW_ELEMENT:1,SHOW_TEXT:4};globalThis.CustomEvent=window.CustomEvent;
const frames=[],observers=[];
globalThis.requestAnimationFrame=cb=>frames.push(cb);
globalThis.MutationObserver=class {constructor(cb){this.callback=cb;observers.push(this);}observe(){}disconnect(){}};
const input=document.querySelector('#distance'),canvas=document.querySelector('canvas'),row=document.querySelector('#rows');
const english=()=>{
 assert.equal(document.querySelector('#reading').textContent,'Image distance');
 assert.equal(document.querySelector('#play').textContent,'Trace rays');
 assert.equal(document.querySelector('#timeValue').textContent,'Slow illustration');
 assert.equal(document.querySelector('#enter').textContent,'Enter value ↗');
 assert.equal(document.querySelector('#enter').getAttribute('aria-label'),'Open numeric input for the interactive parameter');
 assert.equal(document.querySelector('select').getAttribute('aria-label'),'Direct manipulation parameter');
};
setLocale('en-US');installLanguageUI();english();
const reading=document.querySelector('#reading');reading.textContent='Chiều cao ảnh';
observers.at(-1).callback([{type:'childList',target:reading,addedNodes:[reading.firstChild]}]);
while(frames.length)frames.shift()();
assert.equal(reading.textContent,'Image height','refresh-created labels translate incrementally');
document.querySelector('[data-locale="vi-VN"]').click();
assert.equal(reading.textContent,'Chiều cao ảnh');
assert.equal(document.querySelector('#play').textContent,'Phát tia');
assert.equal(document.querySelector('#timeValue').textContent,'Minh họa chậm');
assert.equal(document.querySelector('#enter').textContent,'Nhập số ↗');
assert.equal(document.querySelector('#enter').getAttribute('aria-label'),'Mở ô nhập số của biến tương tác');
document.querySelector('[data-locale="en-US"]').click();
assert.equal(reading.textContent,'Image height');
for(const [selector,text] of [['.notes-area','Khoảng cách ảnh'],['textarea','Chiều cao ảnh'],['.ai-messages','Phát tia'],['.ai-compose','Minh họa chậm'],['.math-tex','Khoảng cách ảnh']])assert.equal(document.querySelector(selector).textContent,text);
assert.equal(document.querySelector('#distance'),input);assert.equal(input.value,'43.125');
assert.equal(document.querySelector('canvas'),canvas);assert.equal(document.querySelector('#rows'),row);assert.equal(row.textContent,'43,125');
console.log('PASS v74 exact optical labels, arrow action and accessible names; VI/EN roundtrip and incremental labels preserve input precision, rows, canvas, notes, math and AI content. Synthetic DOM; browser verification is separate.');
