import {assistantEndpoint} from './ai-config.js?v=22';
// Text-only server chat. No model downloads or browser inference.
function deviceTimeZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Ho_Chi_Minh';}catch{return 'Asia/Ho_Chi_Minh';}}
// Render only a small, safe subset: emphasis, simple Unicode inline math and HTTPS source links.
// Unsupported notation stays visible; generated HTML is never executed.
function answerContent(element,text,document){
 const pattern=/\*\*([^*\n]+)\*\*|(?<!\$)\$([^$\n\\]+)\$(?!\$)|https:\/\/[^\s<>"']+/g;let offset=0;
 for(const match of text.matchAll(pattern)){
  element.append(document.createTextNode(text.slice(offset,match.index)));let node;
  if(match[1]){node=document.createElement('strong');node.textContent=match[1];}
  else if(match[2]){node=document.createElement('span');node.className='ai-inline-math';node.textContent=match[2];}
  else{const url=match[0].replace(/[.,;:!?)]+$/,'');node=document.createElement('a');node.textContent=url;node.href=url;node.target='_blank';node.rel='noopener noreferrer';element.append(node);element.append(document.createTextNode(match[0].slice(url.length)));offset=match.index+match[0].length;continue;}
  element.append(node);offset=match.index+match[0].length;
 }
 element.append(document.createTextNode(text.slice(offset)));
}
export class LabAssistant{
 // Keep the Window receiver required by WebKit instead of calling native fetch as a class method.
 constructor({getContext,endpoint=assistantEndpoint,document=globalThis.document,fetcher=(...args)=>globalThis.fetch(...args)}={}){
  Object.assign(this,{getContext,endpoint,document,fetcher,threads:new Map(),drafts:new Map(),busy:false});
  this.root=document.createElement('aside');this.root.id='aiAssistant';this.root.className='ai-assistant ai-simple';this.root.hidden=true;this.root.setAttribute('aria-labelledby','aiTitle');
  this.root.innerHTML='<div class="ai-head"><h2 id="aiTitle">Trợ lý Vật lí</h2><button type="button" data-ai="close" aria-label="Đóng trò chuyện">×</button></div><div class="ai-messages" role="log" aria-label="Hội thoại" aria-live="polite"></div><p class="ai-status" role="status" aria-live="polite" hidden></p><form class="ai-compose"><label class="sr-only" for="aiQuestion">Câu hỏi của bạn</label><textarea id="aiQuestion" rows="2" maxlength="6000" placeholder="Hỏi về Vật lí hoặc điều bạn muốn biết…"></textarea><button type="submit">Gửi ↑</button></form>';
  document.body.append(this.root);this.q=s=>this.root.querySelector(s);this.input=this.q('textarea');this.form=this.q('form');this.submit=this.q('[type=submit]');this.status=this.q('.ai-status');
  this.openButton=document.querySelector('#openAssistant');this.openButton?.addEventListener('click',()=>this.open());this.q('[data-ai=close]').addEventListener('click',()=>this.close());
  this.form.addEventListener('submit',e=>{e.preventDefault();if(this.busy)this.controller?.abort();else this.send();});
  this.input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!this.busy)this.send();}});
  this.root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();this.close();}});
  this.render();
 }
 key(){return this.getContext?.()?.id||'library';}
 thread(key=this.key()){if(!this.threads.has(key))this.threads.set(key,[]);return this.threads.get(key);}
 open(){this.root.hidden=false;this.openButton?.setAttribute('aria-expanded','true');this.render();this.input.focus();}
 close(){this.root.hidden=true;this.openButton?.setAttribute('aria-expanded','false');this.openButton?.focus();}
 refreshContext(){if(this.currentKey!==this.key())this.render();}
 notice(text=''){this.status.textContent=text;this.status.hidden=!text;}
 render(){const key=this.key();if(this.currentKey&&this.currentKey!==key){this.drafts.set(this.currentKey,this.input.value);this.input.value=this.drafts.get(key)||'';}this.currentKey=key;
  const list=this.q('.ai-messages');list.replaceChildren();const messages=[...this.thread(),...(this.pending?.key===key?[{role:'user',content:this.pending.question},{role:'assistant',content:'Đang trả lời…',pending:true}]:[])];
  if(!messages.length){const empty=this.document.createElement('p');empty.className='ai-empty';empty.textContent='Bạn muốn tìm hiểu điều gì?';list.append(empty);}
  for(const message of messages){const el=this.document.createElement('div');el.className='ai-message';el.dataset.role=message.role;el.setAttribute('aria-label',message.role==='user'?'Bạn':'Trợ lý');if(message.role==='assistant'&&!message.pending)answerContent(el,message.content,this.document);else el.textContent=message.content;if(message.pending)el.classList.add('ai-pending');list.append(el);}list.scrollTop=list.scrollHeight;
  this.submit.textContent=this.busy?'Dừng':'Gửi ↑';this.submit.disabled=!this.endpoint;this.submit.setAttribute('aria-label',this.busy?'Dừng chờ trả lời':'Gửi câu hỏi');this.input.setAttribute('aria-describedby','aiConnectionStatus');this.status.id='aiConnectionStatus';this.form.setAttribute('aria-busy',String(this.busy));
  this.notice(!this.endpoint?'Trợ lý chưa kết nối máy chủ.':'');
 }
 async send(){const question=this.input.value.trim();if(!question||this.busy)return;if(!this.endpoint){this.notice('Trợ lý chưa kết nối máy chủ. Câu hỏi vẫn được giữ.');return;}
  const key=this.key(),thread=this.thread(key),context=this.getContext?.()||null,history=thread.slice(-10).map(m=>({role:m.role,content:m.content}));this.controller=new AbortController();const controller=this.controller;this.busy=true;this.pending={key,question};this.render();let result,error='';const timeout=setTimeout(()=>controller.abort(),55000);
  try{const response=await this.fetcher(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history,context,timeZone:deviceTimeZone()}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});let data;try{data=await response.json();}catch{throw Error('Trợ lý chưa sẵn sàng. Vui lòng thử lại sau.');}if(!response.ok)throw Error(data.error||'Chưa gửi được câu hỏi. Hãy thử lại.');if(typeof data.answer!=='string'||!data.answer.trim())throw Error('Chưa nhận được câu trả lời. Hãy thử lại.');result=data.answer.slice(0,16000);
  }catch(e){error=e?.name==='AbortError'?'Đã dừng chờ trả lời. Câu hỏi vẫn được giữ.':e?.name==='TypeError'?'Không kết nối được trợ lý. Kiểm tra mạng và thử lại.':e?.message||'Không kết nối được trợ lý. Hãy thử lại.';}
  finally{clearTimeout(timeout);this.busy=false;this.controller=null;this.pending=null;if(result){thread.push({role:'user',content:question},{role:'assistant',content:result});if(thread.length>30)thread.splice(0,thread.length-30);if(this.key()===key&&this.input.value.trim()===question)this.input.value='';else if(this.key()!==key&&this.drafts.get(key)?.trim()===question)this.drafts.delete(key);}this.render();if(error)this.notice(error);else if(this.key()!==key)this.notice('Đã lưu câu trả lời trong bài trước.');}
 }
}
