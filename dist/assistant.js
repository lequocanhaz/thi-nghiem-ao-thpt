import {assistantEndpoint} from './ai-config.js?v=22';
import {prepareImage,isImageFile,imageLimits,imageHistory} from './chat-images.js?v=33';
function deviceTimeZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Ho_Chi_Minh';}catch{return 'Asia/Ho_Chi_Minh';}}
// Provider output is text, never executable HTML.
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
const attachIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-8-8l8-8m-6 10 7-7"/></svg>';
export class LabAssistant{
 constructor({getContext,endpoint=assistantEndpoint,document=globalThis.document,fetcher=(...args)=>globalThis.fetch(...args),viewport=globalThis.visualViewport,imagePreparer=prepareImage}={}){
  Object.assign(this,{getContext,endpoint,document,fetcher,imagePreparer,threads:new Map(),drafts:new Map(),attachments:new Map(),busy:false,preparing:false});
  this.root=document.createElement('aside');this.root.id='aiAssistant';this.root.className='ai-assistant ai-simple';this.root.hidden=true;this.root.setAttribute('aria-labelledby','aiTitle');
  this.root.innerHTML='<div class="ai-head"><span class="ai-avatar" aria-hidden="true"><img src="brand/quanh-mark.svg" alt="" width="42" height="42"></span><div><span class="ai-brand">Quanh Lab</span><h2 id="aiTitle">Trợ lý AI</h2></div><button type="button" data-ai="close" aria-label="Đóng trò chuyện">×</button></div><div class="ai-messages" role="log" aria-label="Hội thoại" aria-live="polite"></div><p class="ai-status" role="status" aria-live="polite" hidden></p><form class="ai-compose"><div class="ai-attachments" aria-label="Ảnh chuẩn bị gửi" hidden></div><label class="sr-only" for="aiQuestion">Câu hỏi của bạn</label><textarea id="aiQuestion" rows="2" maxlength="6000" placeholder="Hỏi một câu, gửi ảnh bài tập hoặc đồ thị…"></textarea><div class="ai-compose-actions"><button type="button" data-ai="attach" aria-label="Thêm hình ảnh" title="Chọn tối đa 2 ảnh">'+attachIcon+'</button><input id="aiImages" class="sr-only" type="file" accept="image/*" multiple hidden><span class="ai-attachment-hint">Tối đa 2 ảnh/lượt</span><button type="submit">Gửi ↑</button></div></form>';
  document.body.append(this.root);this.q=s=>this.root.querySelector(s);this.input=this.q('textarea');this.form=this.q('form');this.submit=this.q('[type=submit]');this.status=this.q('.ai-status');this.fileInput=this.q('#aiImages');this.attachButton=this.q('[data-ai=attach]');
  this.openButton=document.querySelector('#openAssistant');this.openButton?.addEventListener('click',()=>this.open());this.q('[data-ai=close]').addEventListener('click',()=>this.close());
  this.form.addEventListener('submit',e=>{e.preventDefault();if(this.busy)this.controller?.abort();else this.send();});
  this.input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!this.busy)this.send();}});
  this.input.addEventListener('input',()=>this.syncComposer());
  this.attachButton.addEventListener('click',()=>this.fileInput.click());
  this.fileInput.addEventListener('change',()=>{const files=Array.from(this.fileInput.files||[]);this.fileInput.value='';this.addFiles(files);});
  this.input.addEventListener('paste',e=>{const files=Array.from(e.clipboardData?.files||[]).filter(isImageFile);if(files.length){e.preventDefault();this.addFiles(files);}});
  this.form.addEventListener('dragover',e=>{if(Array.from(e.dataTransfer?.types||[]).includes('Files')){e.preventDefault();this.form.classList.add('is-dragging');}});
  this.form.addEventListener('dragleave',()=>this.form.classList.remove('is-dragging'));
  this.form.addEventListener('drop',e=>{e.preventDefault();this.form.classList.remove('is-dragging');this.addFiles(Array.from(e.dataTransfer?.files||[]));});
  this.root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();this.close();}});
  this.viewport=viewport;this.syncViewport=()=>{if(this.root.hidden)return;const height=Number(viewport?.height),top=Number(viewport?.offsetTop)||0;if(Number.isFinite(height)&&height>0){this.root.style.setProperty('--chat-top',Math.max(0,top)+8+'px');this.root.style.setProperty('--chat-height',Math.max(0,height-16)+'px');}};
  viewport?.addEventListener?.('resize',this.syncViewport);viewport?.addEventListener?.('scroll',this.syncViewport);this.render();
 }
 key(){return this.getContext?.()?.id||'library';}
 thread(key=this.key()){if(!this.threads.has(key))this.threads.set(key,[]);return this.threads.get(key);}
 pictures(key=this.key()){if(!this.attachments.has(key))this.attachments.set(key,[]);return this.attachments.get(key);}
 open(){this.root.hidden=false;this.openButton?.setAttribute('aria-expanded','true');this.render();this.syncViewport();this.input.focus({preventScroll:true});}
 close(){if(this.imageDialog?.close)this.imageDialog.close();else this.imageDialog?.remove();this.input.blur?.();this.root.hidden=true;this.openButton?.setAttribute('aria-expanded','false');this.openButton?.focus({preventScroll:true});}
 refreshContext(){if(this.currentKey!==this.key())this.render();}
 notice(text=''){this.status.textContent=text;this.status.hidden=!text;}
 syncComposer(){this.submit.textContent=this.busy?'Dừng':'Gửi ↑';this.submit.disabled=!this.endpoint||(!this.busy&&(this.preparing||(!this.input.value.trim()&&!this.pictures().length)));this.submit.setAttribute('aria-label',this.busy?'Dừng chờ trả lời':'Gửi câu hỏi và hình ảnh');this.attachButton.disabled=this.busy||this.preparing||this.pictures().length>=imageLimits.count;this.form.setAttribute('aria-busy',String(this.busy||this.preparing));}
 renderAttachments(){const list=this.q('.ai-attachments');list.replaceChildren();list.hidden=!this.pictures().length;for(const picture of this.pictures()){
  const item=this.document.createElement('div');item.className='ai-attachment';const img=this.document.createElement('img');img.src=picture.thumbnail||picture.url;img.alt=picture.name;img.width=76;img.height=76;const name=this.document.createElement('span');name.textContent=picture.name;const remove=this.document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Xóa ảnh '+picture.name);remove.addEventListener('click',()=>{this.attachments.set(this.key(),this.pictures().filter(p=>p.id!==picture.id));this.renderAttachments();this.syncComposer();this.attachButton.focus?.();});item.append(img,name,remove);list.append(item);
 }}
 async addFiles(files){if(this.busy||this.preparing||!files.length)return;const key=this.key(),slots=imageLimits.count-this.pictures(key).length;if(slots<1){this.notice('Mỗi lượt gửi tối đa 2 ảnh. Xóa một ảnh để chọn ảnh khác.');return;}this.preparing=true;this.syncComposer();this.notice('Đang chuẩn bị ảnh…');const errors=[];
  try{for(const file of files.slice(0,slots)){try{const picture=await this.imagePreparer(file,{document:this.document});this.pictures(key).push(picture);}catch(error){errors.push(error.message||'Chưa đọc được ảnh.');}}if(files.length>slots)errors.push('Chỉ thêm tối đa 2 ảnh mỗi lượt.');}
  finally{this.preparing=false;this.renderAttachments();this.syncComposer();this.notice(errors.join(' ')||(this.key()!==key?'Ảnh đã sẵn sàng trong bài trước.':''));}
 }
 render(){const key=this.key();if(this.currentKey&&this.currentKey!==key){this.drafts.set(this.currentKey,this.input.value);this.input.value=this.drafts.get(key)||'';}this.currentKey=key;
  const list=this.q('.ai-messages');list.replaceChildren();const messages=[...this.thread(),...(this.pending?.key===key?[{role:'user',content:this.pending.question,pictures:this.pending.pictures},{role:'assistant',content:'Đang trả lời…',pending:true}]:[])];
  if(!messages.length){const empty=this.document.createElement('div');empty.className='ai-empty';empty.innerHTML='<span class="ai-empty-mark" aria-hidden="true"><img src="brand/quanh-mark.svg" alt="" width="58" height="58"></span><h3>Bạn muốn khám phá điều gì?</h3><p>Gửi câu hỏi, ảnh bài tập hoặc đồ thị.</p>';list.append(empty);}
  for(const message of messages){const el=this.document.createElement('div');el.className='ai-message';el.dataset.role=message.role;el.setAttribute('aria-label',message.role==='user'?'Bạn':'Trợ lý AI');if(message.role==='assistant'&&!message.pending)answerContent(el,message.content,this.document);else el.textContent=message.content;
   if(message.pictures?.length){const pictures=this.document.createElement('div');pictures.className='ai-message-images';for(const [i,p] of message.pictures.entries()){const img=this.document.createElement('img');img.src=p.thumbnail||p.url;img.alt=p.name||'Ảnh đã gửi';img.loading='lazy';const button=this.document.createElement('button');button.type='button';button.setAttribute('aria-label','Xem ảnh '+(p.name||'đã gửi'));const kept=(message.images||[]),offset=message.pictures.length-kept.length,full=p.url||(i>=offset?kept[i-offset]:p.thumbnail);button.addEventListener('click',()=>this.showImage(p,full,button));button.append(img);pictures.append(button);}el.prepend(pictures);}if(message.pending)el.classList.add('ai-pending');list.append(el);
  }list.scrollTop=list.scrollHeight;this.renderAttachments();this.syncComposer();this.input.setAttribute('aria-describedby','aiConnectionStatus');this.status.id='aiConnectionStatus';this.notice(!this.endpoint?'Trợ lý AI chưa kết nối máy chủ.':'');
 }
 showImage(picture,source,trigger){
  this.imageDialog?.remove();const dialog=this.document.createElement('dialog');dialog.className='ai-image-dialog';dialog.setAttribute('aria-label','Ảnh đã gửi');const head=this.document.createElement('div'),title=this.document.createElement('span'),close=this.document.createElement('button'),img=this.document.createElement('img');title.textContent=picture.name||'Ảnh đã gửi';close.type='button';close.textContent='×';close.setAttribute('aria-label','Đóng ảnh');img.src=source;img.alt=picture.name||'Ảnh đã gửi';head.append(title,close);dialog.append(head,img);this.document.body.append(dialog);this.imageDialog=dialog;close.addEventListener('click',()=>{if(dialog.close)dialog.close();else{dialog.remove();trigger.focus?.();}});dialog.addEventListener('close',()=>{img.src='';dialog.remove();trigger.focus?.({preventScroll:true});});if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');close.focus?.();
 }
 async send(){const inputText=this.input.value.trim(),pictures=this.pictures().map(p=>({...p}));if((!inputText&&!pictures.length)||this.busy||this.preparing)return;if(!this.endpoint){this.notice('Trợ lý AI chưa kết nối máy chủ. Câu hỏi và ảnh vẫn được giữ.');return;}
  const question=inputText||'Phân tích hình ảnh này.',images=pictures.map(p=>p.url),key=this.key(),thread=this.thread(key),context=this.getContext?.()||null,history=imageHistory(thread,images.length);this.controller=new AbortController();const controller=this.controller;this.busy=true;this.pending={key,question,pictures};this.render();let result,error='';const timeout=setTimeout(()=>controller.abort(),55000);
  try{const response=await this.fetcher(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,images,history,context,timeZone:deviceTimeZone()}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});let data;try{data=await response.json();}catch{throw Error('Trợ lý AI chưa sẵn sàng. Vui lòng thử lại sau.');}if(!response.ok)throw Error(data.error||'Chưa gửi được câu hỏi. Hãy thử lại.');if(typeof data.answer!=='string'||!data.answer.trim())throw Error('Chưa nhận được câu trả lời. Hãy thử lại.');result=data.answer.slice(0,16000);
  }catch(e){error=e?.name==='AbortError'?'Đã dừng chờ trả lời. Câu hỏi và ảnh vẫn được giữ.':e?.name==='TypeError'?'Không kết nối được trợ lý. Kiểm tra mạng và thử lại.':e?.message||'Không kết nối được trợ lý. Hãy thử lại.';}
  finally{clearTimeout(timeout);this.busy=false;this.controller=null;this.pending=null;if(result){thread.push({role:'user',content:question,images,pictures:pictures.map(p=>({name:p.name,thumbnail:p.thumbnail||p.url}))},{role:'assistant',content:result});if(thread.length>30)thread.splice(0,thread.length-30);let remaining=4;for(let i=thread.length-1;i>=0;i--){if(thread[i].images){thread[i].images=remaining?thread[i].images.slice(-remaining):[];remaining-=thread[i].images.length;}}const sentIds=new Set(pictures.map(p=>p.id));this.attachments.set(key,this.pictures(key).filter(p=>!sentIds.has(p.id)));if(this.key()===key&&this.input.value.trim()===inputText)this.input.value='';else if(this.key()!==key&&this.drafts.get(key)?.trim()===inputText)this.drafts.delete(key);}this.render();if(error)this.notice(error);else if(this.key()!==key)this.notice('Đã lưu câu trả lời trong bài trước.');}
 }
}
