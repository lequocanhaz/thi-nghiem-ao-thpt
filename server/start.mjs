import http from 'node:http';
import {Readable} from 'node:stream';
import {createAIHandler} from './ai-handler.mjs';
const handler=createAIHandler();
http.createServer(async(req,res)=>{try{const request=new Request('http://localhost'+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});const reply=await handler(request,{...process.env,CLIENT_IP:req.socket.remoteAddress});res.writeHead(reply.status,Object.fromEntries(reply.headers));res.end(Buffer.from(await reply.arrayBuffer()));}catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Máy chủ chưa xử lý được yêu cầu.'}));}}).listen(Number(process.env.PORT)||8787);
