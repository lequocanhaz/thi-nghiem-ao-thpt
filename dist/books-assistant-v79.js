import {installConversationNavigation} from './assistant-navigation-v81.js?v=81';
// Textbook context contains metadata only, never invented scan text.
import {LabAssistant} from './assistant.js?v=81';
import {getReadingContext} from './book-reader.js?v=81';
import {onLocaleChange,getLocale} from './i18n.js?v=54';
const assistant=new LabAssistant({getContext:()=>getReadingContext()||{id:'library',title:getLocale()==='en-US'?'Textbook library':'Thư viện sách giáo khoa',kind:'bookshelf'}});
installConversationNavigation({assistant,document,window});
document.addEventListener('quanh-book-context-change',()=>assistant.refreshContext());
function label(){const button=document.querySelector('#openAssistant'),text=getLocale()==='en-US'?'AI assistant':'Trợ lý AI';button?.setAttribute('aria-label',text);if(button){button.title=text;button.querySelector('span').textContent=text;}}
// The language pill updates <html lang> after notifying locale listeners.
label();onLocaleChange(()=>{label();queueMicrotask(()=>assistant.render());});
