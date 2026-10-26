import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {policy,secureHTML,processPages} from '../scripts/harden-published-pages.mjs';
import {inspect} from '../scripts/check-public-assets.mjs';

const sample='<html lang="vi"><head><meta charset="utf-8"><script type="application/ld+json">{"name":"Quanh Lab"}</script></head><body><h1>Physics</h1></body></html>';
const html=secureHTML(sample);
const {document}=parseHTML(html);
assert.equal(document.querySelector('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'),policy);
assert.equal(document.querySelector('meta[name="referrer"]').getAttribute('content'),'strict-origin-when-cross-origin');
assert.equal(secureHTML(html),html,'Security injection must be idempotent');
assert.equal(document.querySelector('script[type="application/ld+json"]').textContent,'{"name":"Quanh Lab"}');
assert.equal(document.querySelector('h1').textContent,'Physics');
for(const directive of ["script-src 'self'","object-src 'none'","base-uri 'self'","form-action 'self'","upgrade-insecure-requests"])
 assert.ok(policy.includes(directive),'Required CSP: '+directive);
assert.throws(()=>secureHTML('<html><body>No head</body></html>'),/Missing document head/);
assert.throws(()=>secureHTML('<html><head><meta http-equiv="Content-Security-Policy" content="default-src *"></head></html>'),/Review existing security policy/);
const count=processPages(),files=inspect();
assert.ok(count>=303,'Protect every library and discovery HTML page');
assert.ok(files>count,'Public code and metadata also screened');
for(const page of ['index.html','books.html','about.html','about-en.html','experiments/index.html','experiments/energy.html']){
 const source=fs.readFileSync(new URL('../dist/'+page,import.meta.url),'utf8');
 const protectedPage=parseHTML(secureHTML(source)).document;
 assert.ok(protectedPage.querySelector('meta[http-equiv="Content-Security-Policy"]'),page+' CSP');
 assert.ok(protectedPage.querySelector('meta[name="referrer"]'),page+' referrer');
}
console.log('PASS security baseline:',count,'HTML documents protected,',files,'public text assets checked');
