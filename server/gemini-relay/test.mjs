import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createGeminiRelay} from './relay.mjs';
import nodeHandler from './api/gemini.js';
import {createAIHandler} from '../ai-handler.mjs';

const secret='fixture-relay-secret-32-characters-minimum';
const key='fixture-gemini-key-do-not-expose';
const payload={model:'gemini-3.5-flash-lite',request:{systemInstruction:{parts:[{text:'Trợ lý Vật lí.'}]},contents:[{role:'user',parts:[{text:'Có bao nhiêu thí nghiệm?'}]}]}};
const request=(data=payload,headers={},url='https://regional-relay.vercel.app/api/gemini')=>new Request(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret,'x-goog-api-key':key,...headers},body:JSON.stringify(data)});
const answer={candidates:[{finishReason:'STOP',content:{parts:[{text:'Có 300 thí nghiệm.'}]}}]};
let calls=0,last;
const relay=createGeminiRelay({secret,fetcher:async(url,options)=>{calls++;last={url,...options};return Response.json(answer);}});
assert.equal((await createGeminiRelay()(request())).status,503);
assert.equal((await relay(request(payload,{Authorization:''}))).status,401);
assert.equal((await relay(request(payload,{Authorization:'Bearer wrong-token'}))).status,401);
assert.equal(calls,0,'Authentication failures must never reach Google');
assert.equal((await relay(request({...payload,model:'https://attacker.invalid'}))).status,400);
assert.equal((await relay(request(payload,{'x-goog-api-key':''}))).status,400);
assert.equal((await relay(request(payload,{},'https://regional-relay.vercel.app/arbitrary'))).status,404);
assert.equal(calls,0);
const result=await relay(request());assert.equal(result.status,200);assert.deepEqual(await result.json(),answer);
assert.equal(last.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
assert.deepEqual(JSON.parse(last.body),payload.request);assert.equal(last.headers['x-goog-api-key'],key);assert.equal(last.headers.Authorization,undefined);assert.equal(last.redirect,'error');
assert.equal(result.headers.get('Access-Control-Allow-Origin'),null);assert.equal(result.headers.get('Cache-Control'),'no-store');
const oversize=request();Object.defineProperty(oversize,'body',{value:new ReadableStream({start(c){c.enqueue(new Uint8Array(4_400_001));c.close();}})});assert.equal((await relay(oversize)).status,413);
const blocked=createGeminiRelay({secret,fetcher:async()=>Response.json({error:{status:'FAILED_PRECONDITION',message:'User location is not supported for the API use.'}},{status:400})});
assert.equal((await blocked(request())).status,400,'Do not fake an answer if Google still denies the region');
const offline=createGeminiRelay({secret,fetcher:async()=>{throw Error('network');}});assert.equal((await offline(request())).status,504);

const origin='https://lequocanhaz.github.io';
const siteRequest=()=>new Request('https://assistant.example/api/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({question:'Có bao nhiêu thí nghiệm',history:[],context:{id:'library',totalExperiments:300}})});
const env={AI_PROVIDER:'gemini',GEMINI_API_KEY:key,GEMINI_MODEL:'gemini-3.5-flash-lite',GEMINI_RELAY_URL:'https://regional-relay.vercel.app/api/gemini',GEMINI_RELAY_TOKEN:secret};
let relayed=0,quotaCalls=0;const logs=[];
const site=createAIHandler({quotaCheck:async()=>{quotaCalls++;return true;},retryWait:async()=>{},diagnostic:event=>logs.push(event),fetcher:async(url,options)=>{assert.equal(url,env.GEMINI_RELAY_URL);assert.equal(options.redirect,'manual','Site request must not forward credentials through redirects');relayed++;return relay(new Request(url,options));}});
const throughRelay=await site(siteRequest(),env);assert.equal(throughRelay.status,200);assert.deepEqual(await throughRelay.json(),{answer:'Có 300 thí nghiệm.'});assert.equal(relayed,1);assert.equal(quotaCalls,1);assert.equal(throughRelay.headers.get('Access-Control-Allow-Origin'),origin);assert.ok(!JSON.stringify(logs).includes(secret));assert.ok(!JSON.stringify(logs).includes(key));
for(const invalid of [{GEMINI_RELAY_TOKEN:''},{GEMINI_RELAY_TOKEN:secret+'\n'},{GEMINI_RELAY_URL:'https://evil.invalid/api/gemini'},{GEMINI_RELAY_URL:'https://x.vercel.app.evil.invalid/api/gemini'},{GEMINI_RELAY_URL:'https://x.vercel.app/api/gemini?key=bad'},{GEMINI_RELAY_URL:'http://x.vercel.app/api/gemini'}]){const bad=await site(siteRequest(),{...env,...invalid});assert.equal(bad.status,503);assert.equal(relayed,1,'Invalid routing must not expose credentials to any host');}
let authAttempts=0;const denied=createAIHandler({quotaCheck:async()=>true,diagnostic:()=>{},retryWait:()=>{throw Error('Do not retry permanent relay configuration errors');},fetcher:async()=>{authAttempts++;return Response.json({error:{status:'RELAY_UNAUTHORIZED'}},{status:401});}});
const unauthorized=await denied(siteRequest(),env);assert.equal(unauthorized.status,503);assert.equal(authAttempts,1);assert.doesNotMatch(JSON.stringify(await unauthorized.json()),new RegExp(secret+'|'+key));

// Exercise the deployable Node adapter over real localhost HTTP; Google remains mocked.
const nativeFetch=globalThis.fetch,previousToken=process.env.RELAY_TOKEN;
const server=createServer(nodeHandler);let adapterCalls=0;
try{
 process.env.RELAY_TOKEN=secret;
 globalThis.fetch=async(url,options)=>{adapterCalls++;assert.match(url,/^https:\/\/generativelanguage.googleapis.com\//);assert.equal(options.headers['x-goog-api-key'],key);return Response.json(answer);};
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const response=await nativeFetch('http://127.0.0.1:'+server.address().port+'/api/gemini',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+secret,'x-goog-api-key':key},body:JSON.stringify(payload)});
 assert.equal(response.status,200);assert.deepEqual(await response.json(),answer);assert.equal(adapterCalls,1);
}finally{globalThis.fetch=nativeFetch;if(previousToken===undefined)delete process.env.RELAY_TOKEN;else process.env.RELAY_TOKEN=previousToken;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
const config=JSON.parse(fs.readFileSync(new URL('./vercel.json',import.meta.url),'utf8'));assert.deepEqual(config.regions,['iad1']);
console.log('PASS regional Gemini relay: fixed Google destination, secret authentication, bounded body, model allowlist, no browser CORS, preserved server quota/context/filtering, fail-closed configuration, provider errors and real localhost Node adapter. No Vercel deployment or live regional inference verified.');
