import {SESSION_MAX_CHARS} from './data-notebook.js?v=91';
// Local session rollover: preserve a readable archive before replacing primary.
// No archive is executed or silently removed. A failed write never activates a new session.
export function readSessionArchives(storage,key){
 const raw=storage?.getItem(key+'-archives-v1');if(raw==null)return [];
 const index=JSON.parse(raw);
 if(index?.schemaVersion!==1||!Array.isArray(index.items)||index.items.length>10000)throw new TypeError('Invalid archive index');
 const prefix=key+'-archive-',seen=new Set();
 for(const item of index.items){if(!item||typeof item.key!=='string'||!item.key.startsWith(prefix)||!/^\d+$/.test(item.key.slice(prefix.length))||seen.has(item.key)||!Number.isSafeInteger(item.createdAt)||item.createdAt<0||!Number.isInteger(item.trials)||item.trials<1||item.trials>20)throw new TypeError('Invalid archive metadata');seen.add(item.key);}
 return index.items;
}
export function archiveAndReplaceSession(storage,key,{previousJSON,nextJSON,trials,now=Date.now()}){
 if(!storage||typeof previousJSON!=='string'||typeof nextJSON!=='string'||previousJSON.length>SESSION_MAX_CHARS||nextJSON.length>SESSION_MAX_CHARS||!Number.isInteger(trials)||trials<1||trials>20||!Number.isSafeInteger(now)||now<0)throw new TypeError('Invalid session rollover');
 JSON.parse(previousJSON);JSON.parse(nextJSON);
 const primaryBefore=storage.getItem(key),items=readSessionArchives(storage,key);if(items.length>=10000)throw new RangeError('Archive index full');let id=now;
 while(storage.getItem(key+'-archive-'+id)!=null)id++;
 if(!Number.isSafeInteger(id))throw new RangeError('Archive identifier exhausted');
 const archiveKey=key+'-archive-'+id;
 storage.setItem(archiveKey,previousJSON);
 if(storage.getItem(archiveKey)!==previousJSON)throw new Error('Archive write not verified');
 const metadata={key:archiveKey,createdAt:now,trials};
 const indexJSON=JSON.stringify({schemaVersion:1,items:[...items,metadata]});
 storage.setItem(key+'-archives-v1',indexJSON);
 if(storage.getItem(key+'-archives-v1')!==indexJSON)throw new Error('Archive index write not verified');
 try{storage.setItem(key,nextJSON);if(storage.getItem(key)!==nextJSON)throw new Error('Primary write not verified');}
 catch(error){if(primaryBefore!=null&&storage.getItem(key)!==primaryBefore)storage.setItem(key,primaryBefore);throw error;}
 return metadata;
}
