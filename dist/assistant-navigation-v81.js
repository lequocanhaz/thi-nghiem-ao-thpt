// Protect in-page navigation without storing conversations or changing the backend.
export function hasConversationWork(assistant){
 if(!assistant)return false;
 return !!(assistant.busy||assistant.preparing||assistant.input?.value?.trim()||[...(assistant.drafts?.entries()||[])].some(([key,text])=>key!==assistant.currentKey&&String(text||'').trim())||[...(assistant.threads?.values()||[])].some(messages=>messages?.length)||[...(assistant.attachments?.values()||[])].some(images=>images?.length));
}
export function installConversationNavigation({assistant,document=globalThis.document,window=globalThis.window}={}){
 if(!assistant||!document?.body)return null;
 let dialog,destination,trigger;
 const en=()=>/^en(?:-|$)/i.test(document.documentElement.lang||'');
 function close(){dialog?.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});}
 function leave(){const url=destination;dialog?.close();window.location.assign(url);}
 function show(url,link){
  destination=url;trigger=link;
  if(!dialog){
   dialog=document.createElement('dialog');dialog.className='conversation-navigation-dialog';dialog.id='conversationNavigation';dialog.setAttribute('aria-labelledby','conversationNavigationTitle');dialog.setAttribute('aria-describedby','conversationNavigationDescription');
   dialog.innerHTML='<h2 id="conversationNavigationTitle"></h2><p id="conversationNavigationDescription"></p><div class="conversation-navigation-actions"><button type="button" data-conversation-stay autofocus></button><a data-conversation-new-tab target="_blank" rel="noopener"></a><button type="button" data-conversation-leave></button></div>';
   document.body.append(dialog);
   dialog.querySelector('[data-conversation-stay]').addEventListener('click',close);
   dialog.querySelector('[data-conversation-leave]').addEventListener('click',leave);
   dialog.querySelector('[data-conversation-new-tab]').addEventListener('click',()=>queueMicrotask(close));
   dialog.addEventListener('cancel',()=>queueMicrotask(()=>trigger?.isConnected&&trigger.focus({preventScroll:true})));
   dialog.addEventListener('keydown',event=>event.stopPropagation());
  }
  dialog.querySelector('h2').textContent=en()?'Keep this conversation open?':'Giữ cuộc trò chuyện hiện tại?';
  dialog.querySelector('p').textContent=en()?'Messages, drafts, images and pending replies are held in this page only. Open the destination in a new tab and keep this tab open to retain them. Continuing in this tab may discard them when the page reloads.':'Hội thoại, bản nháp, ảnh và phản hồi đang chờ chỉ nằm trong trang này. Mở liên kết ở tab mới và giữ tab hiện tại để giữ nội dung. Chuyển trong tab này có thể làm mất nội dung khi trang tải lại.';
  dialog.querySelector('[data-conversation-stay]').textContent=en()?'Stay on this page':'Ở lại trang này';
  const next=dialog.querySelector('[data-conversation-new-tab]');next.href=url;next.textContent=en()?'Open in a new tab':'Mở ở tab mới';
  dialog.querySelector('[data-conversation-leave]').textContent=en()?'Continue in this tab':'Chuyển trong tab này';
  dialog.showModal();dialog.querySelector('[data-conversation-stay]').focus();
 }
 function click(event){
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||!hasConversationWork(assistant))return;
  const link=event.target.closest?.('a[href]');if(!link||link.hasAttribute('download')||link.closest('#conversationNavigation')||link.target&&link.target!=='_self')return;
  let url,current;try{url=new URL(link.href,window.location.href);current=new URL(window.location.href);}catch{return;}
  if(!/^https?:$/.test(url.protocol)||url.origin!==current.origin||url.pathname===current.pathname&&url.search===current.search&&(url.hash||link.getAttribute('href')?.trim().startsWith('#')))return;
  event.preventDefault();show(url.href,link);
 }
 document.addEventListener('click',click);
 return {destroy(){document.removeEventListener('click',click);dialog?.remove();},hasWork:()=>hasConversationWork(assistant)};
}
