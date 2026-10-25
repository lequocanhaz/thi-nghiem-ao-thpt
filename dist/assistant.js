import {assistantEndpoint} from './ai-config.js?v=22';
import {prepareImage,isImageFile,imageLimits,imageHistory} from './chat-images.js?v=35';
import {typesetMath} from './math.js?v=52';
import englishTitles from './locales/experiments-en-US.js?v=54';
function selectedLocale(document){return /^en(?:-|$)/i.test(document.documentElement?.lang||document.documentElement?.getAttribute('lang')||'')?'en-US':'vi-VN';}
function deviceTimeZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Ho_Chi_Minh';}catch{return 'Asia/Ho_Chi_Minh';}}
// Provider output is text, never executable HTML.
function answerContent(element,text,document){
 // Supported math: $$...$$, \[...\], \(...\), and $...$.
 // Everything other than trusted mathematical typesetting remains plain text.
 const pattern=/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|(?<!\$)\$([^$\n]+)\$(?!\$)|\*\*([^*\n]+)\*\*|https:\/\/[^\s<>"']+/g;
 let offset=0;
 for(const match of String(text||'').matchAll(pattern)){
  element.append(document.createTextNode(text.slice(offset,match.index)));
  let node;
  if(match[1]||match[2]||match[3]||match[4]){
   const latex=match[1]||match[2]||match[3]||match[4];
   node=document.createElement('span');
   node.className='math-tex'+(match[1]||match[2]?' math-block':' ai-inline-math');
   node.setAttribute('data-math-tex',latex);
   node.setAttribute('data-math-display',match[1]||match[2]?'true':'false');
   node.textContent=latex;
  }else if(match[5]){
   node=document.createElement('strong');
   node.textContent=match[5];
  }else{
   const url=match[0].replace(/[.,;:!?)]+$/,'');
   node=document.createElement('a');node.textContent=url;node.href=url;
   node.target='_blank';node.rel='noopener noreferrer';
   element.append(node);element.append(document.createTextNode(match[0].slice(url.length)));
   offset=match.index+match[0].length;continue;
  }
  element.append(node);offset=match.index+match[0].length;
 }
 element.append(document.createTextNode(text.slice(offset)));
 typesetMath(element);
}
const attachIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 12 6-6a4 4 0 0 1 6 6l-8 8a6 6 0 0 1-8-8l8-8m-6 10 7-7"/></svg>';
function contextPrompts(context,locale='vi-VN'){
 if(locale==='en-US'){
  if(!context?.id||context.id==='library')return [
   {label:'Find an experiment',question:'Help me find a suitable physics experiment. First ask about my grade and the phenomenon I want to investigate.'},
   {label:'Plan a fair test',question:'Suggest one simulation and help me choose an independent variable, controlled conditions, data table and graph.'},
   {label:'Interpret graphs',question:'Help me read the axes, units, slope and physical meaning of a physics graph.'}
  ];
  const title=String(englishTitles[context.id]?.title||'the current experiment');
  const variable=context.parameters?.find(p=>p.key!=='t'&&p.label)?.key;
  return [
   {label:'Explain the principle',question:'Explain the physical principle and validity conditions for '+title+'. What should I observe?'},
   {label:'Plan an investigation',question:'For '+title+', help me vary '+(variable||'one parameter')+' while keeping other conditions fixed, and record comparable measurements.'},
   {label:'Analyze the graph',question:'For '+title+', explain the graph axes, units, trends and slope. Distinguish predictions from simulated data.'}
  ];
 }

 if(!context?.id||context.id==='library')return [
  {label:'Tìm bài phù hợp',question:'Hãy giúp tôi tìm một bài thí nghiệm phù hợp trong thư viện. Trước tiên, hỏi tôi đang học lớp nào và muốn tìm hiểu chủ đề gì.'},
  {label:'Lập kế hoạch khảo sát',question:'Hãy gợi ý một bài trong thư viện để luyện khảo sát: chọn một biến để thay đổi, giữ các biến khác cố định và lập bảng số liệu.'},
  {label:'Đọc đồ thị',question:'Hãy gợi ý một bài trong thư viện để luyện đọc đồ thị, rồi hướng dẫn tôi nhận biết hai trục, đơn vị, xu hướng và ý nghĩa của độ dốc.'}
 ];
 const title=String(context.title||'thí nghiệm hiện tại'),parameter=context.parameters?.find(p=>p.key!=='t'&&p.label);
 const columns=(context.columns||[]).filter(c=>typeof c==='string').slice(0,3);
 const setting=parameter&&Number.isFinite(parameter.value)?` (hiện tại ${parameter.value}${parameter.unit?' '+parameter.unit:''})`:'';
 return [
  {label:'Hiểu nguyên lí',question:`Giải thích nguyên lí và điều kiện áp dụng của bài «${title}». Tôi nên chú ý điều gì khi quan sát mô hình?`},
  {label:parameter?'Khảo sát '+parameter.label:'Lập kế hoạch khảo sát',question:parameter?`Trong bài «${title}», hãy hướng dẫn tôi khảo sát ảnh hưởng của «${parameter.label}»${setting}: mỗi lần chỉ đổi một biến, ghi số liệu và kiểm tra dự đoán.`:`Hãy hướng dẫn tôi chọn một biến để khảo sát trong bài «${title}», giữ các biến khác cố định và ghi số liệu để kiểm tra dự đoán.`},
  {label:'Đọc đồ thị',question:`Hướng dẫn tôi đọc đồ thị của bài «${title}»: nhận biết hai trục, đơn vị, xu hướng và ý nghĩa của độ dốc.${columns.length?' Đối chiếu với các cột số liệu '+columns.map(c=>'«'+c+'»').join(', ')+'.':''}`}
 ];
}
export class LabAssistant{
 constructor({getContext,endpoint=assistantEndpoint,document=globalThis.document,fetcher=(...args)=>globalThis.fetch(...args),viewport=globalThis.visualViewport,imagePreparer=prepareImage,coarsePointer=()=>globalThis.matchMedia?.('(pointer: coarse)')?.matches||false}={}){
  Object.assign(this,{getContext,endpoint,document,fetcher,imagePreparer,coarsePointer,threads:new Map(),drafts:new Map(),attachments:new Map(),busy:false,preparing:false});
  this.root=document.createElement('aside');this.root.id='aiAssistant';this.root.className='ai-assistant ai-simple';this.root.hidden=true;this.root.setAttribute('aria-labelledby','aiTitle');
  this.root.innerHTML='<div class="ai-head"><span class="ai-avatar" aria-hidden="true"><img src="brand/quanh-mark.svg?v=37" alt="" width="42" height="42"></span><div><span class="ai-brand">Quanh Lab</span><h2 id="aiTitle" tabindex="-1">Trợ lý AI</h2><span class="ai-context"></span></div><button type="button" data-ai="close" aria-label="Đóng trò chuyện">×</button></div><div class="ai-messages" role="log" aria-label="Hội thoại" aria-live="polite"></div><p class="ai-status" role="status" aria-live="polite" hidden></p><form class="ai-compose"><div class="ai-attachments" aria-label="Ảnh chuẩn bị gửi" hidden></div><label class="sr-only" for="aiQuestion">Câu hỏi của bạn</label><textarea id="aiQuestion" rows="2" maxlength="6000" placeholder="Hỏi một câu, gửi ảnh bài tập hoặc đồ thị…"></textarea><div class="ai-compose-actions"><button type="button" data-ai="attach" aria-label="Thêm hình ảnh" title="Chọn tối đa 2 ảnh">'+attachIcon+'</button><input id="aiImages" class="sr-only" type="file" accept="image/*" multiple hidden><span class="ai-attachment-hint">Tối đa 2 ảnh/lượt</span><button type="submit">Gửi ↑</button></div></form>';
  document.body.append(this.root);this.q=s=>this.root.querySelector(s);this.input=this.q('textarea');this.form=this.q('form');this.submit=this.q('[type=submit]');this.status=this.q('.ai-status');this.fileInput=this.q('#aiImages');this.attachButton=this.q('[data-ai=attach]');
  this.openButton=document.querySelector('#openAssistant');this.openButton?.setAttribute('aria-controls',this.root.id);this.openButton?.setAttribute('aria-expanded','false');this.openButton?.addEventListener('click',()=>this.open());this.q('[data-ai=close]').addEventListener('click',()=>this.close());
  this.form.addEventListener('submit',e=>{e.preventDefault();if(this.busy)this.controller?.abort();else this.send();});
  this.input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&(!this.coarsePointer()||e.ctrlKey||e.metaKey)){e.preventDefault();if(!this.busy)this.send();}});
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
 text(vi,en){return selectedLocale(this.document)==='en-US'?en:vi;}
 localizeShell(){
  this.q('#aiTitle').textContent=this.text('Trợ lý AI','AI assistant');
  this.q('[data-ai=close]').setAttribute('aria-label',this.text('Đóng trò chuyện','Close chat'));
  this.q('.ai-messages').setAttribute('aria-label',this.text('Hội thoại','Conversation'));
  this.q('.ai-attachments').setAttribute('aria-label',this.text('Ảnh chuẩn bị gửi','Images ready to send'));
  this.q('label[for=aiQuestion]').textContent=this.text('Câu hỏi của bạn','Your question');
  this.input.placeholder=this.text('Hỏi một câu, gửi ảnh bài tập hoặc đồ thị…','Ask a question, or attach a problem or graph image…');
  this.attachButton.setAttribute('aria-label',this.text('Thêm hình ảnh','Attach images'));
  this.attachButton.title=this.text('Chọn tối đa 2 ảnh','Choose up to 2 images');
  this.q('.ai-attachment-hint').textContent=this.text('Tối đa 2 ảnh/lượt','Up to 2 images per message');
 }
 key(){return this.getContext?.()?.id||'library';}
 thread(key=this.key()){if(!this.threads.has(key))this.threads.set(key,[]);return this.threads.get(key);}
 pictures(key=this.key()){if(!this.attachments.has(key))this.attachments.set(key,[]);return this.attachments.get(key);}
 open(){this.root.hidden=false;this.openButton?.setAttribute('aria-expanded','true');this.render();this.syncViewport();(this.coarsePointer()?this.q('#aiTitle'):this.input).focus({preventScroll:true});}
 close(){if(this.imageDialog?.close)this.imageDialog.close();else this.imageDialog?.remove();this.input.blur?.();this.root.hidden=true;this.openButton?.setAttribute('aria-expanded','false');this.openButton?.focus({preventScroll:true});}
 refreshContext(){if(this.currentKey!==this.key())this.render();}
 notice(text='',state='info'){this.status.textContent=text;this.status.hidden=!text;this.status.dataset.state=state;}
 syncComposer(){this.submit.textContent=this.busy?this.text('Dừng','Stop'):this.text('Gửi ↑','Send ↑');this.submit.disabled=!this.endpoint||(!this.busy&&(this.preparing||(!this.input.value.trim()&&!this.pictures().length)));this.submit.setAttribute('aria-label',this.busy?this.text('Dừng chờ trả lời','Stop waiting for a response'):this.text('Gửi câu hỏi và hình ảnh','Send question and images'));this.attachButton.disabled=this.busy||this.preparing||this.pictures().length>=imageLimits.count;this.form.setAttribute('aria-busy',String(this.busy||this.preparing));}
 renderAttachments(){const list=this.q('.ai-attachments');list.replaceChildren();list.hidden=!this.pictures().length;for(const picture of this.pictures()){
  const item=this.document.createElement('div');item.className='ai-attachment';const img=this.document.createElement('img');img.src=picture.thumbnail||picture.url;img.alt=picture.name;img.width=76;img.height=76;const name=this.document.createElement('span');name.textContent=picture.name;const remove=this.document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',this.text('Xóa ảnh ','Remove image ')+picture.name);remove.addEventListener('click',()=>{this.attachments.set(this.key(),this.pictures().filter(p=>p.id!==picture.id));this.renderAttachments();this.syncComposer();this.attachButton.focus?.();});item.append(img,name,remove);list.append(item);
 }}
 imageError(error){
  const message=error?.message;
  if(selectedLocale(this.document)!=='en-US')return message||'Chưa đọc được ảnh.';
  if(/20 MB/.test(message))return 'Each image must be smaller than 20 MB. Choose another image or take a screenshot.';
  if(/quá lớn/.test(message))return 'The image is too large to send. Crop the problem or graph you want to discuss.';
  if(/quá lâu/.test(message))return 'The image took too long to load. Please choose it again.';
  return 'Unable to prepare this image. Choose a JPG, PNG or WebP image, or take a screenshot.';
 }
 responseError(message,status){
  if(selectedLocale(this.document)!=='en-US')return message||'Chưa gửi được câu hỏi. Hãy thử lại.';
  if(/thanh toán|hạn mức khả dụng/.test(message))return 'The AI service has no available API credit. The website owner needs to check API billing.';
  if(status===429)return 'The AI service has reached its request limit or is busy. Please try again later.';
  if(status===403)return 'The AI service does not allow access from this website. Your question and images were kept.';
  if(status===400||status===413)return 'The question, images or conversation exceed the service limits. Shorten the question or use smaller images.';
  if(status===422)return 'The AI service could not answer this content. Try rephrasing the question.';
  return 'The AI service could not answer. Your question and images were kept. Please try again later.';
 }
 async addFiles(files){if(this.busy||this.preparing||!files.length)return;const key=this.key(),slots=imageLimits.count-this.pictures(key).length;if(slots<1){this.notice(this.text('Mỗi lượt gửi tối đa 2 ảnh. Xóa một ảnh để chọn ảnh khác.','Attach up to 2 images per message. Remove one to choose another.'),'error');return;}this.preparing=true;this.syncComposer();this.notice(this.text('Đang chuẩn bị ảnh…','Preparing images…'),'loading');const errors=[];
  try{for(const file of files.slice(0,slots)){try{const picture=await this.imagePreparer(file,{document:this.document});this.pictures(key).push(picture);}catch(error){errors.push(this.imageError(error));}}if(files.length>slots)errors.push(this.text('Chỉ thêm tối đa 2 ảnh mỗi lượt.','Only 2 images can be attached per message.'));}
  finally{this.preparing=false;this.renderAttachments();this.syncComposer();this.notice(this.key()!==key?this.text('Đã xử lí ảnh trong bài trước.','Images were prepared in the previous experiment.'):errors.join(' '),errors.length?'error':'info');}
 }
 renderPrompts(empty,context,key){
  const prompts=this.document.createElement('div');prompts.className='ai-prompts';prompts.setAttribute('role','group');prompts.setAttribute('aria-label',this.text('Gợi ý câu hỏi','Suggested questions'));
  for(const [index,prompt] of contextPrompts(context,selectedLocale(this.document)).entries()){
   const button=this.document.createElement('button');button.type='button';button.className='ai-prompt';button.textContent=prompt.label;button.setAttribute('aria-label',this.text('Soạn câu hỏi: ','Draft question: ')+prompt.label);
   button.addEventListener('click',()=>{
    if(this.key()!==key){this.refreshContext();return;}
    // A suggestion edits only this draft. Existing text and pictures stay intact.
    const previous=this.input.value,question=contextPrompts(this.getContext?.(),selectedLocale(this.document))[index].question,next=previous+(previous&&!previous.endsWith('\n')?'\n':'')+question;
    if(next.length>6000){this.notice(this.text('Bản nháp đã gần giới hạn 6000 ký tự. Hãy rút gọn trước khi thêm gợi ý.','The draft is close to the 6000-character limit. Shorten it before adding a suggestion.'),'error');return;}
    this.input.value=next;
    this.drafts.set(key,this.input.value);this.syncComposer();this.input.focus({preventScroll:true});this.input.setSelectionRange?.(this.input.value.length,this.input.value.length);
   });prompts.append(button);
  }
  const hint=this.document.createElement('p');hint.className='ai-prompt-hint';hint.textContent=this.text('Chọn một gợi ý để soạn câu hỏi, rồi nhấn Gửi khi bạn sẵn sàng.','Choose a suggestion to draft a question, then press Send when ready.');empty.append(prompts,hint);
 }
 render(){this.localizeShell();const key=this.key();if(this.currentKey&&this.currentKey!==key){this.drafts.set(this.currentKey,this.input.value);this.input.value=this.drafts.get(key)||'';}this.currentKey=key;const context=this.getContext?.();const contextName=context?.id&&context.id!=='library'?(selectedLocale(this.document)==='en-US'?englishTitles[context.id]?.title:context.title)||this.text('Thí nghiệm hiện tại','Current experiment'):this.text('Thư viện thí nghiệm','Experiment library');this.q('.ai-context').textContent=contextName;this.q('.ai-context').title=contextName;
  const list=this.q('.ai-messages');list.replaceChildren();const messages=[...this.thread(),...(this.pending?.key===key?[{role:'user',content:this.pending.question,pictures:this.pending.pictures},{role:'assistant',content:this.text('Đang trả lời…','Preparing a response…'),pending:true}]:[])];
  if(!messages.length){const empty=this.document.createElement('div');empty.className='ai-empty';empty.innerHTML='<span class="ai-empty-mark" aria-hidden="true"><img src="brand/quanh-mark.svg?v=37" alt="" width="58" height="58"></span><h3>'+(selectedLocale(this.document)==='en-US'?'What would you like to explore?':'Bạn muốn khám phá điều gì?')+'</h3><p>'+(selectedLocale(this.document)==='en-US'?'Ask a question, or send a problem or graph image.':'Gửi câu hỏi, ảnh bài tập hoặc đồ thị.')+'</p>';this.renderPrompts(empty,context,key);list.append(empty);}
  for(const message of messages){const el=this.document.createElement('div');el.className='ai-message';el.dataset.role=message.role;el.setAttribute('aria-label',message.role==='user'?this.text('Bạn','You'):this.text('Trợ lý AI','AI assistant'));if(!message.pending)answerContent(el,message.content,this.document);else el.textContent=message.content;
   if(message.pictures?.length){const pictures=this.document.createElement('div');pictures.className='ai-message-images';for(const [i,p] of message.pictures.entries()){const img=this.document.createElement('img');img.src=p.thumbnail||p.url;img.alt=p.name||this.text('Ảnh đã gửi','Sent image');img.loading='lazy';const button=this.document.createElement('button');button.type='button';button.setAttribute('aria-label',this.text('Xem ảnh ','View image ')+(p.name||this.text('đã gửi','sent')));const kept=(message.images||[]),offset=message.pictures.length-kept.length,full=p.url||(i>=offset?kept[i-offset]:p.thumbnail);button.addEventListener('click',()=>this.showImage(p,full,button));button.append(img);pictures.append(button);}el.prepend(pictures);}if(message.pending)el.classList.add('ai-pending');list.append(el);
  }list.scrollTop=list.scrollHeight;this.renderAttachments();this.syncComposer();this.input.setAttribute('aria-describedby','aiConnectionStatus');this.status.id='aiConnectionStatus';this.notice(!this.endpoint?this.text('Trợ lý AI chưa kết nối máy chủ.','The AI assistant is not connected to a server.'):this.pending&&this.pending.key!==key?this.text('Đang trả lời ở bài trước. Bạn có thể soạn câu hỏi mới.','A response is pending in the previous experiment. You can draft another question here.'):'');
 }
 showImage(picture,source,trigger){
  this.imageDialog?.remove();const dialog=this.document.createElement('dialog');dialog.className='ai-image-dialog';dialog.setAttribute('aria-label',this.text('Ảnh đã gửi','Sent image'));const head=this.document.createElement('div'),title=this.document.createElement('span'),close=this.document.createElement('button'),img=this.document.createElement('img');title.textContent=picture.name||this.text('Ảnh đã gửi','Sent image');close.type='button';close.textContent='×';close.setAttribute('aria-label',this.text('Đóng ảnh','Close image'));img.src=source;img.alt=picture.name||this.text('Ảnh đã gửi','Sent image');head.append(title,close);dialog.append(head,img);this.document.body.append(dialog);this.imageDialog=dialog;close.addEventListener('click',()=>{if(dialog.close)dialog.close();else{dialog.remove();trigger.focus?.();}});dialog.addEventListener('close',()=>{img.src='';dialog.remove();trigger.focus?.({preventScroll:true});});if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');close.focus?.();
 }
 async send(){const locale=selectedLocale(this.document),inputText=this.input.value.trim(),pictures=this.pictures().map(p=>({...p}));if((!inputText&&!pictures.length)||this.busy||this.preparing)return;if(!this.endpoint){this.notice(this.text('Trợ lý AI chưa kết nối máy chủ. Câu hỏi và ảnh vẫn được giữ.','The AI assistant is not connected to a server. Your question and images were kept.'),'error');return;}
  const question=inputText||(locale==='en-US'?'Analyze this image.':'Phân tích hình ảnh này.'),images=pictures.map(p=>p.url),key=this.key(),thread=this.thread(key),context=this.getContext?.()||null,history=imageHistory(thread,images.length);this.controller=new AbortController();const controller=this.controller;this.busy=true;this.pending={key,question,pictures};this.render();let result,error='',timedOut=false;const timeout=setTimeout(()=>{timedOut=true;controller.abort();},55000);
  try{const response=await this.fetcher(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,images,history,context,locale,timeZone:deviceTimeZone()}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});let data;try{data=await response.json();}catch{throw Error(this.text('Trợ lý AI chưa sẵn sàng. Vui lòng thử lại sau.','The AI assistant is unavailable. Please try again later.'));}if(!response.ok)throw Error(this.responseError(data.error,response.status));if(typeof data.answer!=='string'||!data.answer.trim())throw Error(this.text('Chưa nhận được câu trả lời. Hãy thử lại.','No answer was received. Please try again.'));result=data.answer.slice(0,16000);
  }catch(e){error=e?.name==='AbortError'?(timedOut?this.text('Trợ lý phản hồi quá lâu. Câu hỏi và ảnh vẫn được giữ; hãy thử gửi lại.','The assistant took too long to respond. Your question and images were kept; try sending again.'):this.text('Đã dừng chờ trả lời. Câu hỏi và ảnh vẫn được giữ.','Stopped waiting. Your question and images were kept.')):e?.name==='TypeError'?this.text('Không kết nối được trợ lý. Kiểm tra mạng và thử lại.','Unable to connect to the assistant. Check your connection and try again.'):e?.message||this.text('Không kết nối được trợ lý. Hãy thử lại.','Unable to connect to the assistant. Please try again.');}
  finally{clearTimeout(timeout);this.busy=false;this.controller=null;this.pending=null;if(result){thread.push({role:'user',content:question,images,pictures:pictures.map(p=>({name:p.name,thumbnail:p.thumbnail||p.url}))},{role:'assistant',content:result});if(thread.length>30)thread.splice(0,thread.length-30);let remaining=4;for(let i=thread.length-1;i>=0;i--){if(thread[i].images){thread[i].images=remaining?thread[i].images.slice(-remaining):[];remaining-=thread[i].images.length;}}const sentIds=new Set(pictures.map(p=>p.id));this.attachments.set(key,this.pictures(key).filter(p=>!sentIds.has(p.id)));if(this.key()===key&&this.input.value.trim()===inputText)this.input.value='';else if(this.key()!==key&&this.drafts.get(key)?.trim()===inputText)this.drafts.delete(key);}this.render();if(this.key()!==key)this.notice(error?this.text('Chưa gửi được câu hỏi ở bài trước. Bản nháp và ảnh vẫn được giữ.','The question in the previous experiment failed. Its draft and images were kept.'):this.text('Đã lưu câu trả lời trong bài trước.','The response was saved in the previous experiment.'),error?'error':'success');else if(error)this.notice(error,'error');}
 }
}
