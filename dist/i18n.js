import vi from './locales/vi-VN.js?v=54';
import en from './locales/en-US.js?v=54';

export const supportedLocales=Object.freeze(['vi-VN','en-US']);
export const defaultLocale='vi-VN';
export const localeStorageKey='quanh.locale.v1';
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const dictionaries=freeze({'vi-VN':vi,'en-US':en});
const supported=locale=>supportedLocales.includes(locale);
const own=(object,key)=>object!=null&&Object.hasOwn(object,key);
function lookup(dictionary,key){
 if(typeof key!=='string'||!key)return undefined;
 return key.split('.').reduce((value,part)=>own(value,part)?value[part]:undefined,dictionary);
}
function browserStorage(){try{return globalThis.localStorage;}catch{return undefined;}}
function storedLocale(storage){try{const value=storage?.getItem(localeStorageKey);return supported(value)?value:defaultLocale;}catch{return defaultLocale;}}

/** Pure language service: never reads or rewrites experiment/session state, never routes or reloads. */
export function createI18n({storage=browserStorage(),initialLocale,onMissingKey,onListenerError}={}){
 if(initialLocale!==undefined&&!supported(initialLocale))throw new RangeError('Unsupported locale');
 let locale=initialLocale??storedLocale(storage);
 const listeners=new Set();
 const api={
  getLocale:()=>locale,
  setLocale(next){
   if(!supported(next))throw new RangeError('Unsupported locale');
   if(next===locale)return false;
   const previous=locale;locale=next;
   try{storage?.setItem(localeStorageKey,locale);}catch{/* A denied/quota-limited store must not break language changes. */}
   for(const listener of [...listeners]){try{listener(Object.freeze({locale,previous}));}catch(error){onListenerError?.(error);}}
   return true;
  },
  onLocaleChange(listener){if(typeof listener!=='function')throw new TypeError('A locale listener must be a function');listeners.add(listener);return ()=>listeners.delete(listener);},
  t(key,values={},fallback){
   let value=lookup(dictionaries[locale],key);
   if(typeof value!=='string'){
    onMissingKey?.({key,locale});
    value=lookup(dictionaries[defaultLocale],key);
    if(typeof value!=='string')value=typeof fallback==='string'?fallback:dictionaries[locale].common.missingTranslation;
   }
   return value.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(_,name)=>{
    if(!own(values,name))throw new TypeError('Missing interpolation value: '+name);
    const replacement=values[name];
    if(!['string','number','boolean'].includes(typeof replacement))throw new TypeError('Invalid interpolation value: '+name);
    return String(replacement);
   });
  },
  number(value,options={}){return typeof value==='number'&&Number.isFinite(value)?new Intl.NumberFormat(locale,options).format(value):'—';},
  quantity(value,unit,options={}){
   if(typeof unit!=='string')throw new TypeError('An SI unit must be a string');
   const formatted=api.number(value,options);return unit?formatted+' '+unit:formatted;
  },
  /** Bind only an explicitly chosen leaf or attribute. Keeps the node, input values and event listeners. */
  bind(element,key,{attribute,values={}}={}){
   if(!element||typeof element.setAttribute!=='function')throw new TypeError('A translation binding requires an element');
   if(attribute&&!['title','placeholder','aria-label','aria-description','alt'].includes(attribute))throw new RangeError('Unsupported translation attribute');
   const update=()=>{const text=api.t(key,typeof values==='function'?values():values);if(attribute)element.setAttribute(attribute,text);else element.textContent=text;};
   update();return api.onLocaleChange(update);
  },
 };
 return Object.freeze(api);
}

// Integration is intentionally explicit. Importing this module does not alter the document or add a selector.
export const i18n=createI18n();
export const getLocale=()=>i18n.getLocale();
export const setLocale=locale=>i18n.setLocale(locale);
export const t=(...args)=>i18n.t(...args);
export const formatNumber=(...args)=>i18n.number(...args);
export const formatQuantity=(...args)=>i18n.quantity(...args);
export const onLocaleChange=listener=>i18n.onLocaleChange(listener);
