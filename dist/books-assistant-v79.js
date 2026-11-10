// Textbook context contains metadata only, never invented scan text.
import {LabAssistant} from './assistant.js?v=79';
import {getReadingContext} from './book-reader.js?v=79';
import {onLocaleChange,getLocale} from './i18n.js?v=54';
const trigger=document.querySelector('#openAssistant');trigger?.parentElement?.append(trigger);
const assistant=new LabAssistant({getContext:()=>getReadingContext()||{id:'library',title:'Sách giáo khoa',kind:'bookshelf'}});
document.addEventListener('quanh-book-context-change',()=>assistant.refreshContext());
function label(){const button=document.querySelector('#openAssistant'),text=getLocale()==='en-US'?'AI assistant':'Trợ lý AI';button?.setAttribute('aria-label',text);if(button){button.title=text;button.querySelector('span').textContent=text;}}
label();onLocaleChange(()=>{label();assistant.render();});
