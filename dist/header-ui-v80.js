// One navigation pattern, using the existing controls and their original listeners.
import {getLocale,onLocaleChange} from './i18n.js?v=54';

export function installHeaderUI({document=globalThis.document,window=globalThis.window}={}){
 const header=document?.querySelector('.header,.reading-header'),nav=header?.querySelector('nav');
 if(!header||!nav||header.dataset.sharedHeader)return null;
 header.dataset.sharedHeader='pending';
 const media=window.matchMedia('(max-width: 720px)');
 let menu,panel,summary,scheduled=false;
 const en=()=>getLocale()==='en-US';
 function label(button,text){
  let span=button.querySelector('span');
  for(const node of [...button.childNodes])if(node.nodeType===3)node.remove();
  if(!span){span=document.createElement('span');button.append(span);}
  if(span.textContent!==text)span.textContent=text;
  button.setAttribute('aria-label',text);button.title=text;
 }
 function ordered(parent,nodes){nodes.forEach((node,index)=>{if(parent.children[index]!==node)parent.insertBefore(node,parent.children[index]||null);});}
 function close(returnFocus=false){if(!menu?.open)return;menu.open=false;if(returnFocus)summary.focus();}
 function normalize(){
  scheduled=false;
  const account=nav.querySelector('#openAccount'),theme=nav.querySelector('#appearanceToggle'),language=nav.querySelector('.ql-language-switch');
  // Account, locale and appearance scripts mount asynchronously. Wait for them,
  // so their initial insertBefore operations still target their original nav.
  if(!account||!theme||!language)return;
  const links=[...nav.querySelectorAll('a')];
  const library=links.find(a=>a.getAttribute('href')?.endsWith('#library'));
  const books=links.find(a=>a.getAttribute('href')==='books.html');
  const ai=nav.querySelector('#openAssistant');if(!library||!books||!ai)return;
  if(!menu){
   menu=document.createElement('details');menu.id='headerUtilities';menu.className='header-utilities';
   summary=document.createElement('summary');summary.setAttribute('aria-controls','headerUtilityPanel');
   summary.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6"/></svg><span></span>';
   panel=document.createElement('div');panel.id='headerUtilityPanel';panel.className='header-utility-panel';
   menu.append(summary,panel);nav.append(menu);
   panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close(true);}});
   menu.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();event.preventDefault();close(true);}});
   panel.addEventListener('click',event=>{if(event.target.closest('[data-action=guide],[data-action=settings]'))close();});
   observer.observe(panel,{childList:true});
  }
  const guide=nav.querySelector('[data-action=guide]'),settings=nav.querySelector('[data-action=settings]');
  ordered(panel,[language,guide,settings,theme].filter(Boolean));
  for(const [node,kind]of [[library,'library'],[books,'books'],[ai,'ai'],[account,'account'],[menu,'utilities']])node.dataset.headerItem=kind;
  const libraryText=en()?'Library':'Thư viện',booksText=en()?'Textbooks':'Sách giáo khoa';
  if(library.textContent!==libraryText)library.textContent=libraryText;if(books.textContent!==booksText)books.textContent=booksText;
  library.setAttribute('aria-label',library.textContent);books.setAttribute('aria-label',books.textContent);
  label(ai,en()?'AI assistant':'Trợ lý AI');
  label(summary,en()?'Options':'Tùy chọn');
  if(guide)guide.dataset.menuLabel=en()?'Help':'Hướng dẫn';
  if(settings)settings.dataset.menuLabel=en()?'Settings':'Cài đặt';
  theme.dataset.menuLabel=theme.getAttribute('aria-label')||'';
  const bookPage=header.classList.contains('reading-header');
  if(bookPage){books.setAttribute('aria-current','page');library.removeAttribute('aria-current');}
  else {books.removeAttribute('aria-current');if(!window.location.hash.startsWith('#sources'))library.setAttribute('aria-current',window.location.hash.startsWith('#lab/')?'location':'page');else library.removeAttribute('aria-current');}
  ordered(nav,media.matches?[account,menu,library,books,ai]:[library,books,ai,account,menu]);
  nav.classList.add('shared-nav-v80');header.classList.add('shared-header-v80');header.dataset.sharedHeader='ready';
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(normalize);}}
 const observer=new window.MutationObserver(schedule);observer.observe(nav,{childList:true});
 const outside=event=>{if(menu&&!menu.contains(event.target))close();};
 const refresh=()=>{close();schedule();};
 const appearance=()=>{if(menu?.open)queueMicrotask(()=>{const theme=panel.querySelector('#appearanceToggle');if(theme)theme.dataset.menuLabel=theme.getAttribute('aria-label')||'';});};
 document.addEventListener('click',outside);document.addEventListener('click',appearance);
 window.addEventListener('hashchange',refresh);media.addEventListener('change',refresh);
 const unsubscribe=onLocaleChange(schedule);normalize();
 return {refresh:schedule,destroy(){observer.disconnect();unsubscribe();document.removeEventListener('click',outside);document.removeEventListener('click',appearance);window.removeEventListener('hashchange',refresh);media.removeEventListener('change',refresh);}};
}
if(typeof document!=='undefined')installHeaderUI();
