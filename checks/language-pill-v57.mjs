import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {i18n} from '../dist/i18n.js?v=54';
import {mountLanguagePill,ensureLanguagePillStyles} from '../dist/language-pill.js?v=57';

const {document,window}=parseHTML('<!doctype html><html><head></head><body>'+
 '<header class="header"><nav>'+
 '<a href="#library">Library</a><a class="nav-books">Textbooks</a>'+
 '<button data-action="guide">Help</button><button id="openAssistant">AI Assistant</button>'+
 '<button data-action="settings">Settings</button></nav></header>'+
 '<header class="reading-header"><nav><a>Experiments</a><a>Textbooks</a></nav></header>'+
 '<main><input id="measurement" value="14.5"><canvas id="simulation"></canvas></main>'+
 '</body></html>');

assert.equal(i18n.getLocale(),'vi-VN');
const header=document.querySelector('.header nav');
const untouchedInput=document.querySelector('#measurement');
const canvas=document.querySelector('#simulation');
const beforeOrder=[...header.children].map(e=>e.textContent);
let changes=[];
const first=mountLanguagePill(header,{
 id:'quanhLanguage',
 before:header.querySelector('[data-action="settings"]'),
 onChange(locale){changes.push(locale);}
});
assert.ok(first,'mounts language pill');
assert.equal(first.tagName,'DIV','native select removed in favor of a two-button group');
assert.equal(first.getAttribute('role'),'group');
assert.equal(header.querySelectorAll('.ql-language-switch').length,1);
assert.equal(first.querySelectorAll('button').length,2);
assert.equal(first.querySelector('select'),null,'no white native select');
assert.equal(first.nextElementSibling.getAttribute('data-action'),'settings');
assert.equal(header.children.length,beforeOrder.length+1);
assert.equal(first.querySelector('[data-locale="vi-VN"]').getAttribute('aria-pressed'),'true');
assert.equal(first.querySelector('[data-locale="en-US"]').getAttribute('aria-pressed'),'false');
assert.equal(header.classList.contains('ql-language-ready'),true);
assert.ok(document.getElementById('qlLanguagePillStyles'));
assert.equal(document.querySelectorAll('#qlLanguagePillStyles').length,1);
const rules=document.querySelector('#qlLanguagePillStyles').textContent;
assert.match(rules,/background:#111214!important/);
assert.match(rules,/aria-pressed="true"/);
assert.match(rules,/max-width:620px/);
assert.match(rules,/max-width:390px/);
assert.match(rules,/grid-template-areas:/,'six controls have an explicit mobile layout');
assert.match(rules,/grid-area:ql-language/);
assert.match(rules,/focus-visible/);
assert.match(rules,/prefers-reduced-motion/);
assert.match(rules,/forced-colors/);
assert.equal(mountLanguagePill(header,{id:'quanhLanguage'}),first,'mounting is idempotent');
ensureLanguagePillStyles(document);
assert.equal(document.querySelectorAll('#qlLanguagePillStyles').length,1);
const bookNav=document.querySelector('.reading-header nav');
const book=mountLanguagePill(bookNav,{id:'bookLocale',onChange(locale){changes.push('book:'+locale);}});
assert.equal(book.querySelectorAll('button').length,2);
assert.equal(document.querySelectorAll('.ql-language-switch').length,2);
const click=(element)=>element.dispatchEvent(new window.Event('click',{bubbles:true}));
click(first.querySelector('[data-locale="en-US"]'));
assert.equal(i18n.getLocale(),'en-US');
assert.deepEqual(changes,['en-US']);
for(const pill of [first,book]){
 assert.equal(pill.querySelector('[data-locale="en-US"]').getAttribute('aria-pressed'),'true','shared singleton sync');
 assert.equal(pill.querySelector('[data-locale="vi-VN"]').getAttribute('aria-pressed'),'false');
}
click(first.querySelector('[data-locale="en-US"]'));
assert.deepEqual(changes,['en-US'],'clicking active language does not dispatch');
click(book.querySelector('[data-locale="vi-VN"]'));
assert.equal(i18n.getLocale(),'vi-VN');
assert.deepEqual(changes,['en-US','book:vi-VN']);
assert.equal(first.querySelector('[data-locale="vi-VN"]').getAttribute('aria-pressed'),'true');
assert.equal(document.querySelector('#measurement'),untouchedInput);
assert.equal(document.querySelector('#simulation'),canvas);
assert.equal(untouchedInput.value,'14.5','language toggle preserves measurement inputs');
assert.equal(header.querySelector('#openAssistant').textContent,'AI Assistant','assistant button untouched');
assert.equal(header.querySelector('[data-action="settings"]').textContent,'Settings');
console.log('PASS v57: styled native-free VI/EN pills, 2 headers, mobile layout, keyboard focus, singleton sync and no data/DOM reset. No real-browser pixel test.');
