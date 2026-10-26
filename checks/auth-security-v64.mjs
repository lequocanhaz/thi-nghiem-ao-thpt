import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {policy,accountPolicy,policyForHTML} from '../scripts/harden-published-pages.mjs';
import {inspect} from '../scripts/check-public-assets.mjs';
import {accountErrorKey} from '../dist/account-ui.js';
// Synthetic well-formed public identifier only; never a provisioned provider key.
const firebase={apiKey:'AIza'+'x'.repeat(35),authDomain:'quanh-fixture.firebaseapp.com',projectId:'quanh-fixture',appId:'1:123456789:web:abc123'};
const config={enabled:true,firebase};
assert.equal(accountPolicy(),policy,'Unconfigured release must not enable Google scripts or frames');
const enabled=accountPolicy(config);
assert.ok(enabled.includes("script-src 'self' 'wasm-unsafe-eval' https://apis.google.com"));
assert.ok(enabled.includes('frame-src https://quanh-fixture.firebaseapp.com'));
assert.ok(!enabled.includes('https://*.')&&!enabled.includes("'unsafe-eval'"));
assert.equal(accountPolicy({...config,firebase:{...firebase,authDomain:'other.example'}}),policy,'Untrusted frame domains rejected');
assert.equal(policyForHTML('<script src="account-ui.js?v=64" type="module"></script>',config),enabled);
assert.equal(policyForHTML('<script src="boot.js?v=64"></script>',config),policy,'Other content retains strict local-script policy');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'quanh-auth-security-'));
try{
 fs.writeFileSync(path.join(directory,'auth-config.js'),'export const key='+JSON.stringify(firebase.apiKey));
 assert.equal(inspect({directory,config}),1);
 assert.throws(()=>inspect({directory}),/Google API credential/,'No general key-scan exception');
 fs.writeFileSync(path.join(directory,'wrong.js'),firebase.apiKey);
 assert.throws(()=>inspect({directory,config}),/Google API credential.*wrong\.js/);
 fs.unlinkSync(path.join(directory,'wrong.js'));
 fs.appendFileSync(path.join(directory,'auth-config.js'),'\n'+'AIza'+'y'.repeat(35));
 assert.throws(()=>inspect({directory,config}),/Google API credential/,'Additional key remains blocked');
}finally{fs.rmSync(directory,{recursive:true,force:true});}
assert.equal(accountErrorKey('auth/popup-blocked'),'blocked');
assert.equal(accountErrorKey('auth/invalid-credential'),'invalid');
assert.equal(accountErrorKey('auth/unauthorized-domain'),'unavailable');
const source=fs.readFileSync(new URL('../dist/account-ui.js',import.meta.url),'utf8');
assert.doesNotMatch(source,/localStorage\.(?:clear|removeItem|setItem)|sessionStorage\.(?:clear|removeItem|setItem)|innerHTML\s*=.*(?:snapshot\.user|\.email|\.displayName)/);
for(const file of ['index.html','books.html'])assert.match(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),/account-ui\.js\?v=64/);
console.log('PASS auth security: exact configured Firebase helper origins, isolated public web-config exception, other keys blocked, disabled configuration makes no Google policy exception, safe profile text and session preservation.');
