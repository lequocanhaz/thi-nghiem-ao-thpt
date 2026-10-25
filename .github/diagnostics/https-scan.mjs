import {spawn, execFileSync} from 'node:child_process';
import {existsSync, readFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

for(const site of ['http://physicslab.tech/','https://physicslab.tech/','http://www.physicslab.tech/','https://www.physicslab.tech/']){
  try {const r=await fetch(site,{redirect:'manual',signal:AbortSignal.timeout(10000)});console.log('FETCH',JSON.stringify({site,status:r.status,location:r.headers.get('location'),server:r.headers.get('server'),hsts:r.headers.get('strict-transport-security')}));}
  catch(e){console.log('FETCH_ERROR',site,e.cause?.code||e.message);}
}
const binary=['google-chrome','chromium','chromium-browser'].find(x=>{try{execFileSync('which',[x]);return true}catch{return false}});
console.log('CHROME_BINARY',binary||'NONE');
if(!binary)process.exit(0);
const port=19223, dir=mkdtempSync(join(tmpdir(),'quanh-security-'));
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='';chrome.stderr.on('data',d=>{stderr+=d.toString().slice(0,3000);});
try{
  let connected=false;
  for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:'+port+'/json/version');if(r.ok){connected=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
  if(!connected)throw Error('Chrome debugging endpoint not ready '+stderr.slice(0,500));
  for(const site of ['https://physicslab.tech/','https://www.physicslab.tech/']){
    const target=await (await fetch('http://127.0.0.1:'+port+'/json/new?'+encodeURIComponent('about:blank'),{method:'PUT'})).json();
    const ws=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
    let id=0;const active=new Map(),events={security:[],issues:[],http:[],errors:[],failures:[],navigation:[]};
    ws.onmessage=(e)=>{let m;try{m=JSON.parse(e.data)}catch{return};
      if(m.id&&active.has(m.id)){active.get(m.id)(m);active.delete(m.id);return;}
      if(m.method==='Security.visibleSecurityStateChanged'){events.security.push(m.params);}
      if(m.method==='Security.securityStateChanged'){events.security.push(m.params);}
      if(m.method==='Audits.issueAdded'){events.issues.push(m.params.issue);}
      if(m.method==='Network.requestWillBeSent'){const u=m.params.request.url;if(u.startsWith('http://')||u.startsWith('ws://'))events.http.push({url:u,type:m.params.type,initiator:m.params.initiator?.type});}
      if(m.method==='Network.loadingFailed'){events.failures.push({requestId:m.params.requestId,errorText:m.params.errorText,blockedReason:m.params.blockedReason});}
      if(m.method==='Page.frameNavigated'&&m.params.frame?.parentId===undefined){events.navigation.push(m.params.frame.url);}
      if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'){events.errors.push(m.params.entry.text);}
    };
    const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id;active.set(i,resolve);ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(active.has(i)){active.delete(i);reject(Error(method+' timeout'));}},7000)});
    for(const cmd of ['Security.enable','Audits.enable','Network.enable','Page.enable','Log.enable'])try{await send(cmd)}catch(e){console.log('CDP_ENABLE_ERROR',cmd,e.message);}
    await send('Page.navigate',{url:site});
    await new Promise(r=>setTimeout(r,8500));
    console.log('BROWSER_DIAG',site,JSON.stringify(events).slice(0,16000));
    ws.close();
  }
}catch(e){console.log('BROWSER_ERROR',e.stack?.slice(0,2000)||e.message);}
finally{chrome.kill('SIGKILL');}
