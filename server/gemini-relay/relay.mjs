import {timingSafeEqual} from 'node:crypto';

const models=new Set(['gemini-3.5-flash-lite','gemini-3.8-flash']);
const maximumBytes=4_400_000;
const json=(status,body)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const failure=(status,code)=>json(status,{error:{status:code}});
function equal(a,b){const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);}
async function read(request){
 const reader=request.body?.getReader();if(!reader)throw Error('EMPTY');
 const chunks=[];let size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maximumBytes){await reader.cancel();throw Error('SIZE');}chunks.push(value);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

// Called only by the existing assistant server. No browser CORS or general URL proxy.
export function createGeminiRelay({fetcher=(...args)=>globalThis.fetch(...args),secret}={}){
 return async function relay(request){
  if(!secret||secret.length<32||secret.length>256||/[\r\n]/.test(secret))return failure(503,'RELAY_NOT_CONFIGURED');
  if(!equal(request.headers.get('Authorization')||'','Bearer '+secret))return failure(401,'RELAY_UNAUTHORIZED');
  if(new URL(request.url).pathname!=='/api/gemini')return failure(404,'RELAY_NOT_FOUND');
  if(request.method!=='POST')return failure(405,'RELAY_METHOD_NOT_ALLOWED');
  if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return failure(415,'RELAY_INVALID_CONTENT_TYPE');
  const key=request.headers.get('x-goog-api-key');
  if(!key||key.length>512||/[\r\n]/.test(key))return failure(400,'RELAY_KEY_REQUIRED');
  let data;try{data=await read(request);}catch(error){return failure(error.message==='SIZE'?413:400,'RELAY_INVALID_BODY');}
  if(!models.has(data?.model)||!data.request||!Array.isArray(data.request.contents)||!data.request.contents.length||!data.request.systemInstruction)return failure(400,'RELAY_INVALID_REQUEST');
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(40000)]);
  try{
   const response=await fetcher('https://generativelanguage.googleapis.com/v1beta/models/'+data.model+':generateContent',{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(data.request),signal,redirect:'error'
   });
   // Provider payload is returned to the assistant server, which filters it before the browser.
   let payload;try{payload=await response.json();}catch{return failure(502,'RELAY_INVALID_UPSTREAM');}
   return json(response.status,payload);
  }catch{return failure(504,'RELAY_CONNECTION_FAILED');}
 };
}
