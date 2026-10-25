import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {createI18n,dictionaries,supportedLocales,localeStorageKey,defaultLocale} from '../dist/i18n.js';
import {physicsGlossary} from '../dist/locales/glossary.js';

const flatten=(object,prefix='')=>Object.entries(object).flatMap(([key,value])=>typeof value==='string'?[[prefix+key,value]]:flatten(value,prefix+key+'.'));
const vi=new Map(flatten(dictionaries['vi-VN'])),en=new Map(flatten(dictionaries['en-US']));
assert.deepEqual([...vi.keys()].sort(),[...en.keys()].sort(),'Every foundation key must have an explicit counterpart');
for(const [key,value]of vi){
 assert.ok(value.trim()&&en.get(key).trim(),'Empty translation: '+key);
 const slots=text=>[...text.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(m=>m[1]).sort();
 assert.deepEqual(slots(value),slots(en.get(key)),'Interpolation parameters changed: '+key);
}
assert.equal(Object.keys(dictionaries['vi-VN'].experiments).length,300);
assert.deepEqual(Object.keys(dictionaries['vi-VN'].experiments).sort(),experiments.map(e=>e.id).sort());
for(const experiment of experiments){
 const original=dictionaries['vi-VN'].experiments[experiment.id];
 assert.equal(original.title,experiment.title);assert.equal(original.shortTitle,experiment.shortTitle);
 assert.ok(dictionaries['en-US'].experiments[experiment.id].title.length>4);
}
assert.equal(new Set(physicsGlossary.map(term=>term.key)).size,physicsGlossary.length);
for(const term of physicsGlossary){assert.equal(dictionaries['vi-VN'].physics[term.key],term.vi);assert.equal(dictionaries['en-US'].physics[term.key],term.en);}
const data=new Map([['thpt-lab-v1','preserved-session'],['quanh.locale.v1','invalid']]);
const writes=[];const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes.push(key);data.set(key,value);}};
const missing=[],listenerErrors=[];
const service=createI18n({storage,onMissingKey:event=>missing.push(event),onListenerError:error=>listenerErrors.push(error)});
assert.equal(service.getLocale(),defaultLocale);
const state=initialState(experiments[0]),rows=[{values:[1,2,3]}],camera={position:{x:1,y:2,z:3},zoom:1.75};
const preserved=structuredClone({state,rows,camera});
let changes=0;const stop=service.onLocaleChange(({locale,previous})=>{changes++;assert.equal(locale,'en-US');assert.equal(previous,'vi-VN');});
service.onLocaleChange(()=>{throw Error('A consumer failed');});
let remainingListener=0;service.onLocaleChange(()=>remainingListener++);
assert.equal(service.t('physics.torque'),'Mômen lực');
assert.equal(service.setLocale('en-US'),true);
assert.equal(service.setLocale('en-US'),false);
assert.equal(changes,1);assert.equal(remainingListener,1);assert.equal(listenerErrors.length,1);stop();
assert.equal(service.t('physics.torque'),'Torque');
assert.equal(service.t('common.experimentCount',{count:300}),'300 experiments');
assert.throws(()=>service.t('charts.versus',{x:'t (s)'}),/Missing interpolation/);
assert.throws(()=>service.t('charts.versus',{x:'t',y:{}}),/Invalid interpolation/);
assert.equal(service.t('unavailable.secret'),'Translation unavailable');
assert.equal(service.t('unavailable.secret',{},'Display fallback'),'Display fallback');
assert.equal(service.t('__proto__.toString'),'Translation unavailable');
assert.equal(missing.length,3);
for(const invalid of ['en','vi','fr-FR','',null,{},'en-US\n'])assert.throws(()=>service.setLocale(invalid),RangeError);
assert.equal(service.getLocale(),'en-US');
assert.ok(writes.every(key=>key===localeStorageKey));assert.equal(data.get('thpt-lab-v1'),'preserved-session');
assert.deepEqual({state,rows,camera},preserved,'Language service must not alter scientific state');
assert.equal(createI18n({storage}).getLocale(),'en-US');
const denied={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};
const privateService=createI18n({storage:denied});assert.equal(privateService.getLocale(),'vi-VN');privateService.setLocale('en-US');assert.equal(privateService.getLocale(),'en-US');
assert.throws(()=>createI18n({initialLocale:'en'}),RangeError);
const {document}=parseHTML('<html lang="vi"><input id="parameter" value="2.5"><span id="label"></span><button id="button">stable</button></html>');
const localized=createI18n({storage:undefined,initialLocale:'vi-VN'}),input=document.querySelector('#parameter'),label=document.querySelector('#label'),button=document.querySelector('#button');
const unbind=localized.bind(label,'physics.force');localized.bind(input,'controls.parameters',{attribute:'aria-label'});
let clicks=0;button.addEventListener('click',()=>clicks++);
localized.setLocale('en-US');assert.equal(label.textContent,'Force');assert.equal(input.getAttribute('aria-label'),'Parameters');assert.equal(input.value,'2.5');assert.equal(document.querySelector('#parameter'),input);button.click();assert.equal(clicks,1);
assert.equal(document.documentElement.lang,'vi','A standalone service must not silently alter document language before UI integration');
unbind();localized.setLocale('vi-VN');assert.equal(label.textContent,'Force','Disposed bindings must stop updating');
assert.throws(()=>localized.bind(label,'common.close',{attribute:'onclick'}),RangeError);
const safe=localized.bind(label,'charts.versus',{values:{x:'<img src=x onerror=alert(1)>',y:'F'}});assert.equal(label.querySelector('img'),null);safe();
for(const locale of supportedLocales){
 const f=createI18n({initialLocale:locale,storage:undefined});
 for(const unit of ['N','N/C','N·m','m/s²','kg·m²','Ω','T','V','°C','K','µF','Wb']){
  assert.equal(f.quantity(1234.5,unit),new Intl.NumberFormat(locale).format(1234.5)+' '+unit);
 }
 assert.equal(f.quantity(-0.002,'C',{maximumFractionDigits:4}),new Intl.NumberFormat(locale,{maximumFractionDigits:4}).format(-0.002)+' C');
 assert.equal(f.quantity(Infinity,'N'),'— N');assert.equal(f.number(null),'—');
 assert.equal(f.t('common.appName'),'Quanh Lab');assert.equal(f.t('common.owner'),'Lê Quốc Anh');
}
console.log('PASS',JSON.stringify({scope:'Standalone i18n foundation, not integrated full-site translation',locales:supportedLocales,pairedKeys:vi.size,experimentTitles:300,glossaryTerms:physicsGlossary.length,sessionStoreUntouched:true,uiLanguageSwitch:'NOT IMPLEMENTED',lessonEnglish:'NOT IMPLEMENTED',browserLocaleAcceptance:'NOT TESTED'}));
