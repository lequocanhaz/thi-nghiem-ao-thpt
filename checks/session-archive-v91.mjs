import assert from 'node:assert/strict';
import {archiveAndReplaceSession,readSessionArchives} from '../dist/l3/session-archive.js';
import {newSession,newTrial,serializeSession,parseSession,SESSION_MAX_CHARS,SESSION_WARNING_CHARS,SESSION_FILE_MAX_BYTES} from '../dist/l3/data-notebook.js';
import {createState,validateState} from '../dist/l3/thermal-physics.js';
import {initialPositions} from '../dist/l3/thermal-apparatus.js';
const key='quanh-l3-calorimetry-ice-v1';
const make=count=>{const s=newSession('ice');for(let i=0;i<count;i++)newTrial(s,'ice',{}).hypothesis='Keep trial '+i;s.physicalState=createState('ice');s.apparatusState={positions:initialPositions(s.physicalState),cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2'};return serializeSession(s);};
const previous=make(20),next=make(1);
class MemoryStorage{constructor(){this.data=new Map([[key,previous]]);this.writes=0;this.failAt=0;this.silent=false;this.partial=false;}getItem(k){return this.data.get(k)??null;}setItem(k,v){this.writes++;if(this.writes===this.failAt){if(this.partial)this.data.set(k,'incomplete');if(this.silent)return;throw Error('QuotaExceeded');}this.data.set(k,String(v));}}
let assertions=0;const ok=f=>{f();assertions++;};
const storage=new MemoryStorage();
for(let i=0;i<5;i++){
 const item=archiveAndReplaceSession(storage,key,{previousJSON:previous,nextJSON:next,trials:20,now:123});
 ok(()=>assert.equal(storage.getItem(item.key),previous));ok(()=>assert.equal(storage.getItem(key),next));
 ok(()=>assert.equal(parseSession(storage.getItem(item.key),{activity:'ice',validateState:s=>validateState(s).valid}).session.trials.length,20));
}
ok(()=>assert.equal(readSessionArchives(storage,key).length,5));
ok(()=>assert.equal(new Set(readSessionArchives(storage,key).map(a=>a.key)).size,5));
for(const failAt of [1,2,3])for(const silent of [false,true]){
 const s=new MemoryStorage();s.failAt=failAt;s.silent=silent;
 ok(()=>assert.throws(()=>archiveAndReplaceSession(s,key,{previousJSON:previous,nextJSON:next,trials:20,now:123})));
 ok(()=>assert.equal(s.getItem(key),previous));
 if(failAt>1)ok(()=>assert.equal(s.getItem(key+'-archive-123'),previous));
}
const partial=new MemoryStorage();partial.failAt=3;partial.partial=true;
ok(()=>assert.throws(()=>archiveAndReplaceSession(partial,key,{previousJSON:previous,nextJSON:next,trials:20,now:123})));
ok(()=>assert.equal(partial.getItem(key),previous));
for(const raw of ['{}','{"schemaVersion":1,"items":[{"key":"secret-key","createdAt":123,"trials":20}]}','{"schemaVersion":1,"items":null}']){
 const s=new MemoryStorage();s.data.set(key+'-archives-v1',raw);
 ok(()=>assert.throws(()=>archiveAndReplaceSession(s,key,{previousJSON:previous,nextJSON:next,trials:20,now:123})));
 ok(()=>assert.equal(s.writes,0));ok(()=>assert.equal(s.getItem(key),previous));
}
ok(()=>assert(SESSION_WARNING_CHARS<SESSION_MAX_CHARS));
ok(()=>assert(SESSION_FILE_MAX_BYTES>=3*SESSION_MAX_CHARS));
ok(()=>assert.throws(()=>parseSession(' '.repeat(SESSION_MAX_CHARS+1)),/exceeds/));
const tooLarge=JSON.parse(next);tooLarge.trials[0].events=Array.from({length:1200},()=>({schemaVersion:1,labId:'calorimetry',simTimeS:0,actionType:'test',accepted:true,payloadSI:{note:'x'.repeat(2000)}}));
const tooLargeBefore=JSON.stringify(tooLarge);
ok(()=>assert.throws(()=>serializeSession(tooLarge),/exceeds/));
ok(()=>assert.equal(JSON.stringify(tooLarge),tooLargeBefore,'Rejecting an oversized export never trims the original data'));
console.log(JSON.stringify({status:'PASS',assertions,scope:'Readable complete archives, collisions, verified writes, archive/index/primary quota failures and rollback; no data eviction or schema change.'}));
