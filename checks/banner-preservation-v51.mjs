import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {experiments} from '../dist/experiments.js';

const root=new URL('../',import.meta.url);
const baseline=JSON.parse(fs.readFileSync(new URL('./banner-preservation-v51.json',import.meta.url),'utf8'));
const read=name=>fs.readFileSync(new URL(name,root));
const hash=value=>createHash('sha256').update(value).digest('hex');
for(const name of ['dist/banner.js','dist/app.css','dist/video/black-hole.mp4','dist/video/black-hole.webm','dist/video/black-hole.webp']){
 assert.equal(hash(read(name)),baseline.files[name],name+' must remain byte-identical');
}
// Shared entrypoints only change cache versions, never startup/banner behavior.
for(const [name,expected]of Object.entries(baseline.normalizedSharedFiles)){
 assert.equal(hash(read(name).toString().replace(/\?v=\d+/g,'?v=BASE')),expected,name);
}
const view=read('dist/views.js').toString();
const markup=view.slice(view.indexOf(' <section class="main-banner'),view.indexOf(' </section>')+' </section>'.length);
assert.equal(hash(markup),baseline.bannerMarkupSHA256,'Banner markup, text and layout');
const bannerLines=read('dist/app.js').toString().split('\n').filter(line=>/banner|Banner/.test(line)).join('\n');
assert.equal(hash(bannerLines),baseline.appBannerLinesSHA256,'Banner import, mount, playback lifecycle, routing and fullscreen handlers');
const ids=experiments.map(e=>e.id).sort();
assert.equal(ids.length,300);assert.equal(new Set(ids).size,300);
assert.equal(hash(JSON.stringify(ids)),baseline.experimentIDs.sha256,'Preserve exact experiment IDs');
const walk=dir=>fs.readdirSync(new URL(dir+'/',root),{withFileTypes:true}).flatMap(entry=>{
 const name=path.posix.join(dir,entry.name);return entry.isDirectory()?walk(name):[name];
});
for(const [dir,expected]of Object.entries(baseline.protectedTrees)){
 const names=walk(dir).sort();assert.equal(names.length,expected.files,dir+' file count');
 assert.equal(hash(names.map(name=>name+':'+hash(read(name))).join('\n')),expected.sha256,dir+' contents');
}
console.log('PASS v51 SHA-256: banner media/poster/playback/CSS/markup unchanged; exact 300 IDs, books, audio, lessons, brand and fonts preserved. Source/asset checks only; desktop/mobile browser playback remains unverified.');
