// Shared, state-safe locale toggle; the original scientific data remains untouched.
import {i18n} from './i18n.js?v=54';

const pillStyles="/* Shared language pill with 44px touch targets. */\n.ql-language-switch{\n box-sizing:border-box!important;display:inline-flex!important;align-items:center!important;\n justify-content:center!important;gap:3px!important;flex:0 0 auto!important;\n width:101px!important;min-width:101px!important;height:52px!important;min-height:52px!important;\n margin:0!important;padding:3px!important;\n border:1px solid rgba(255,255,255,.29)!important;border-radius:12px!important;\n background:#111214!important;color:#fff!important;\n box-shadow:0 0 0 1px rgba(0,0,0,.06);vertical-align:middle;isolation:isolate;\n}\n.ql-language-switch>.ql-language-option{\n box-sizing:border-box!important;appearance:none!important;-webkit-appearance:none!important;\n display:inline-flex!important;align-items:center!important;justify-content:center!important;\n flex:1 0 44px!important;min-width:44px!important;width:44px!important;\n height:44px!important;min-height:44px!important;\n margin:0!important;padding:0 4px!important;border:0!important;border-radius:8px!important;\n background:transparent!important;color:#eef0f4!important;\n font-family:inherit!important;font-size:12px!important;font-weight:750!important;\n line-height:1!important;letter-spacing:.045em!important;white-space:nowrap!important;\n cursor:pointer;transition:background-color .16s ease,color .16s ease,box-shadow .16s ease;\n box-shadow:none!important;\n}\n.ql-language-switch>.ql-language-option:hover:not([aria-pressed=\"true\"]){background:#33353b!important;color:#fff!important}\n.ql-language-switch>.ql-language-option[aria-pressed=\"true\"]{\n color:#111214!important;background:#fff!important;box-shadow:0 1px 4px rgba(0,0,0,.18)!important;\n}\n.ql-language-switch>.ql-language-option:focus-visible{\n outline:3px solid #5a88fc!important;outline-offset:2px!important;position:relative;z-index:2;\n}\n@media(prefers-reduced-motion:reduce){.ql-language-switch>.ql-language-option{transition:none!important}}\n@media(forced-colors:active){\n .ql-language-switch{border:1px solid ButtonText!important;background:ButtonFace!important}\n .ql-language-switch>.ql-language-option[aria-pressed=\"true\"]{\n  border:2px solid Highlight!important;color:HighlightText!important;background:Highlight!important;\n }\n}\n/* Two rows keep the model nearer the top of a small screen. */\n@media(max-width:620px){\n .header:has(nav.ql-language-ready){\n  display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 51px 44px 44px;\n  grid-template-areas:\"ql-brand ql-brand ql-brand ql-language ql-language ql-settings\" \"ql-library ql-library ql-books ql-books ql-help ql-assistant\";\n  align-items:center;column-gap:6px;row-gap:6px;padding:8px 16px;\n }\n .header:has(nav.ql-language-ready)>.brand{grid-area:ql-brand;gap:6px;min-width:0}\n .header:has(nav.ql-language-ready)>.brand>img{width:32px;height:32px}\n .header:has(nav.ql-language-ready) .brand-wordmark{font-size:clamp(18px,5.4vw,26px);white-space:nowrap;letter-spacing:-.055em}\n .header nav.ql-language-ready{display:contents!important}\n .header nav.ql-language-ready>a[href=\"#library\"]{grid-area:ql-library;min-width:0!important}\n .header nav.ql-language-ready>a.nav-books{grid-area:ql-books;min-width:0!important}\n .header nav.ql-language-ready>button[data-action=\"guide\"]{grid-area:ql-help}\n .header nav.ql-language-ready>#openAssistant{grid-area:ql-assistant;min-width:0!important;font-size:0!important;padding:0!important}\n .header nav.ql-language-ready>#openAssistant svg{display:block!important;width:20px!important;height:20px!important}\n .header nav.ql-language-ready>.ql-language-switch{grid-area:ql-language;justify-self:end;align-self:center}\n .header nav.ql-language-ready>.settings-icon{grid-area:ql-settings;justify-self:end;width:44px;min-width:44px}\n}\n@media(max-width:390px){.header:has(nav.ql-language-ready)>.brand>img{width:28px;height:28px}}\n.reading-header nav.ql-language-ready>.ql-language-switch{margin-inline-start:5px!important}\n@media(max-width:620px){\n .reading-header nav.ql-language-ready{display:flex;flex-wrap:wrap;justify-content:flex-start;gap:6px}\n .reading-header nav.ql-language-ready>.ql-language-switch{margin-inline-start:auto!important}\n}";

const languages=Object.freeze([
 {value:'vi-VN',short:'VI',label:'Tiếng Việt'},
 {value:'en-US',short:'EN',label:'English'}
]);
export function ensureLanguagePillStyles(doc=document){
 if(doc.getElementById('qlLanguagePillStyles'))return;
 const style=doc.createElement('style');
 style.id='qlLanguagePillStyles';
 style.textContent=pillStyles;
 doc.head.append(style);
}
export function mountLanguagePill(nav,{id='quanhLanguage',before=null,onChange=()=>{}}={}){
 if(!nav)return null;
 const doc=nav.ownerDocument||document;
 const prior=doc.getElementById(id);
 if(prior)return prior;
 ensureLanguagePillStyles(doc);
 const pill=doc.createElement('div');
 pill.id=id;pill.className='ql-language-switch';
 pill.setAttribute('role','group');
 pill.setAttribute('aria-label','Ngôn ngữ / Language');
 const buttons=new Map();
 for(const language of languages){
  const button=doc.createElement('button');
  button.type='button';button.className='ql-language-option';
  button.dataset.locale=language.value;
  button.setAttribute('lang',language.value);
  button.setAttribute('title',language.label);
  button.setAttribute('aria-label',language.label+' ('+language.short+')');
  button.textContent=language.short;
  button.addEventListener('click',()=>{
   if(i18n.getLocale()===language.value)return;
   i18n.setLocale(language.value);
   onChange(language.value);
  });
  pill.append(button);
  buttons.set(language.value,button);
 }
 const sync=locale=>{
  for(const [value,button] of buttons){
   const selected=value===locale;
   button.setAttribute('aria-pressed',String(selected));
   button.classList.toggle('is-active',selected);
  }
 };
 sync(i18n.getLocale());
 i18n.onLocaleChange(({locale})=>sync(locale));
 nav.insertBefore(pill,before&&before.parentElement===nav?before:null);
 nav.classList.add('ql-language-ready');
 return pill;
}
