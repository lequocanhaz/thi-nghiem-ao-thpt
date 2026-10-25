import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {experiments} from '../dist/experiments.js';
import {siteURL} from '../scripts/build-discovery-pages.mjs';

const root=new URL('../dist/',import.meta.url);
const ids=new Set(experiments.map(e=>e.id));
const files=fs.readdirSync(new URL('experiments/',root)).filter(name=>name.endsWith('.html'));
assert.equal(files.length,301);
for(const e of experiments){
 const path=`experiments/${e.id}.html`;
 const {document}=parseHTML(fs.readFileSync(new URL(path,root),'utf8'));
 assert.equal(document.documentElement.lang,'vi');
 assert.equal(document.querySelector('h1').textContent,e.title);
 assert.equal(document.querySelector('meta[name="description"]').content,e.description);
 assert.equal(document.querySelector('link[rel="canonical"]').href,new URL(path,siteURL).href);
 assert.ok(document.querySelector(`a[href="../#lab/${e.id}"]`),'Explicit link to the existing simulation');
 assert.ok(document.querySelector('main').textContent.includes(e.limit),'Current model assumptions must be present');
 assert.ok(document.querySelector('.katex-mathml math'),'Server-rendered MathML available without JavaScript');
 assert.equal(document.querySelectorAll('li').length,e.tasks.length);
 const data=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
 assert.equal(data['@type'],'LearningResource');assert.equal(data.name,e.title);
 assert.equal(data.url,new URL(path,siteURL).href);
 assert.equal(document.querySelectorAll('script[src]').length,0,'Entry pages do not load a renderer or tracker');
 for(const a of document.querySelectorAll('a[href]')){
  const href=a.getAttribute('href');if(/^(?:https?:|#)/.test(href))continue;
  const target=new URL(href,new URL(path,root));target.hash='';target.search='';
  assert.ok(fs.existsSync(target),`Local link exists: ${path} → ${href}`);
 }
}
const catalog=parseHTML(fs.readFileSync(new URL('experiments/index.html',root),'utf8')).document;
const links=[...catalog.querySelectorAll('.catalog-list a')];assert.equal(links.length,300);
assert.deepEqual(new Set(links.map(link=>link.getAttribute('href').replace('.html',''))),ids);
const sitemap=fs.readFileSync(new URL('sitemap.xml',root),'utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);assert.equal(urls.length,305);assert.equal(new Set(urls).size,305);
for(const path of ['','books.html','about.html','about-en.html','experiments/',...experiments.map(e=>`experiments/${e.id}.html`)])assert.ok(urls.includes(new URL(path,siteURL).href));
for(const [file,language] of [['about.html','vi'],['about-en.html','en']]){
 const doc=parseHTML(fs.readFileSync(new URL(file,root),'utf8')).document;
 assert.equal(doc.documentElement.lang,language);assert.ok(doc.querySelector('#rights'));
 assert.equal(doc.querySelectorAll('link[rel="alternate"][hreflang]').length,2);
}
const app=parseHTML(fs.readFileSync(new URL('index.html',root),'utf8')).document;
assert.equal(app.querySelector('link[rel="sitemap"]').getAttribute('href'),'sitemap.xml');
assert.equal(JSON.parse(app.querySelector('#quanhSiteData').textContent).url,siteURL);
assert.ok(app.querySelector('a[href="experiments/"]'));assert.ok(app.querySelector('a[href="about.html"]'));
console.log('PASS 300 crawlable learning resources, rendered formulas/MathML, current assumptions, live simulation links, 305 canonical sitemap URLs and bilingual product information. Indexing by search engines is not asserted.');
