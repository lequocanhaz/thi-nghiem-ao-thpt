import {Readable} from 'node:stream';
import {createGeminiRelay} from '../relay.mjs';

export default async function handler(req,res){
 const abort=new AbortController();
 const cancel=()=>{if(!res.writableEnded)abort.abort();};
 req.once('aborted',cancel);res.once('close',cancel);
 try{
  let body;
  if(!['GET','HEAD'].includes(req.method))body=req.body===undefined?Readable.toWeb(req):typeof req.body==='string'||Buffer.isBuffer(req.body)?req.body:JSON.stringify(req.body);
  const request=new Request('https://relay.invalid'+req.url,{method:req.method,headers:req.headers,signal:abort.signal,...(body===undefined?{}:{body,duplex:'half'})});
  const response=await createGeminiRelay({secret:process.env.RELAY_TOKEN})(request);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:{status:'RELAY_INTERNAL_ERROR'}}));}
 finally{req.removeListener('aborted',cancel);res.removeListener('close',cancel);}
}
