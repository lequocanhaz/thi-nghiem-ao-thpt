import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {experiments} from '../dist/experiments.js';
import {cardsMarkup} from '../dist/views.js';
import {observeThumbnails,stopThumbnails} from '../dist/thumbnails.js';
const root=new URL('../',import.meta.url),folder=new URL('../dist/previews/v65/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',folder),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.complete,true);assert.equal(manifest.sourceStable,true);assert.deepEqual(manifest.errors,[]);
assert.equal(manifest.experiments.length,300);
assert.deepEqual(new Set(manifest.experiments.map(e=>e.id)),new Set(experiments.map(e=>e.id)));
let bytes=0;
for(const record of manifest.experiments){
 assert.equal(record.status,'captured');assert.equal(record.domainValid,true);assert.equal(record.framing.boundsInView,true);
 assert.equal(record.file,record.id+'.webp');
 const buffer=fs.readFileSync(new URL(record.file,folder));bytes+=buffer.length;
 assert.equal(hash(buffer),record.sha256,record.id+' image must match its actual-render provenance');
 assert.equal(buffer.toString('ascii',0,4),'RIFF');assert.equal(buffer.toString('ascii',8,12),'WEBP');
 const kind=buffer.toString('ascii',12,16);let width,height;
 if(kind==='VP8 '){width=buffer.readUInt16LE(26)&0x3fff;height=buffer.readUInt16LE(28)&0x3fff;}
 else if(kind==='VP8X'){width=1+buffer.readUIntLE(24,3);height=1+buffer.readUIntLE(27,3);}
 else if(kind==='VP8L'){const bits=buffer.readUInt32LE(21);width=1+(bits&0x3fff);height=1+((bits>>>14)&0x3fff);}
 assert.equal(width,640,record.id);assert.equal(height,400,record.id);
}
assert.ok(bytes<5*1024*1024,'Keep all300 preview files below5MiB; only visible images load in the app');
for(const source of manifest.sourceFiles)assert.equal(hash(fs.readFileSync(new URL(source.path,root))),source.sha256,'Regenerate previews after renderer/scientific source changes: '+source.path);
assert.equal(hash(fs.readFileSync(new URL(manifest.generator.path,root))),manifest.generator.sha256);
const {document,window}=parseHTML('<html><body>'+cardsMarkup(experiments,{favorites:[],progress:{}},()=>'<svg></svg>')+'</body></html>');
assert.equal(document.querySelectorAll('.card-image img').length,300);
for(const e of experiments){
 const frame=document.querySelector(`[data-thumb="${e.id}"]`),img=frame.querySelector('img');
 assert.equal(img.getAttribute('src'),`previews/v65/${e.id}.webp`);assert.equal(img.getAttribute('loading'),'lazy');assert.equal(img.getAttribute('width'),'640');assert.equal(img.getAttribute('height'),'400');
 assert.equal(img.closest('a').getAttribute('href'),'#lab/'+e.id);assert.equal(frame.querySelector('.preview-fallback').hidden,true);assert.equal(frame.querySelector('.catalog-formula'),null);
}
globalThis.document=document;observeThumbnails();
const frame=document.querySelector('[data-thumb="ohm"]'),img=frame.querySelector('img'),retry=frame.querySelector('[data-preview-retry]');
img.dispatchEvent(new window.Event('error'));assert.equal(frame.dataset.previewStatus,'error');assert.equal(frame.querySelector('.preview-fallback').hidden,false);
retry.click();assert.equal(frame.dataset.previewStatus,'loading');assert.match(img.getAttribute('src'),/ohm\.webp\?retry=1$/);
img.dispatchEvent(new window.Event('load'));assert.equal(frame.dataset.previewStatus,'ready');assert.equal(frame.querySelector('.preview-fallback').hidden,true);
stopThumbnails();img.dispatchEvent(new window.Event('error'));assert.equal(frame.dataset.previewStatus,'ready','Removed cards must release their image/retry listeners');
console.log('PASS v65 300 static actual-render previews: source/image hashes,640×400 WebP,byte budget,clickable accessible lazy images,error/retry/recovery and listener cleanup. No live WebGL on home.');
