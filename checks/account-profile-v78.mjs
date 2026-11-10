// DOM regression coverage. Native layout, CSS and OAuth are covered separately in Chromium.
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {installAccountUI,accountErrorKey} from '../dist/account-ui.js';
import {i18n} from '../dist/i18n.js?v=54';
const {document,window}=parseHTML('<!doctype html><html><body><header class="header"><nav></nav></header></body></html>');
globalThis.document=document;
Object.defineProperty(window.HTMLElement.prototype,'open',{configurable:true,get(){return this.hasAttribute('open')},set(value){this.toggleAttribute('open',!!value)}});
window.HTMLElement.prototype.showModal=function(){this.open=true;};
window.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
const user={uid:'restored-user',displayName:'<img src=x onerror=alert(1)>',email:'learner@example.test',emailVerified:true,providerIds:['google.com']};
let snapshot={enabled:true,status:'idle',user:null,errorCode:null},prepareCalls=0,updateCalls=[],failNext=false,releaseUpdate;
const listeners=new Set();
const emit=patch=>{snapshot={...snapshot,...patch};for(const listener of listeners)listener(snapshot);};
const client={
 getSnapshot:()=>snapshot,
 subscribe(listener){listeners.add(listener);listener(snapshot);return()=>listeners.delete(listener);},
 async prepare(){prepareCalls++;emit({status:'ready',user});},
 async updateDisplayName(name){updateCalls.push(name);await new Promise(resolve=>releaseUpdate=resolve);if(failNext){failNext=false;throw Object.assign(Error('private provider text'),{code:'auth/network-request-failed'});}emit({user:{...snapshot.user,displayName:name}});},
 async signOut(){emit({user:null});}
};
const ui=installAccountUI({client});
const $=selector=>document.querySelector(selector);
const flush=()=>new Promise(setImmediate);
await flush();
assert.equal(prepareCalls,1,'Header restores the Firebase session without opening the dialog');
assert.equal($('#openAccount').getAttribute('aria-label'),'Hồ sơ tài khoản');
assert.equal($('#accountMember').hidden,false);assert.equal($('#accountGuest').hidden,true);
assert.equal($('#accountName').textContent,user.displayName);assert.equal($('#accountName img'),null,'Provider text cannot insert HTML');
assert.equal($('#accountDisplayName').value,user.displayName);assert.match($('#accountProvider').textContent,/Google/);
assert.equal($('#accountVerified').classList.contains('is-verified'),true);
await ui.open();assert.equal($('#openAccount').getAttribute('aria-expanded'),'true');
$('#accountDisplayName').value='Tên mới';
$('#accountProfileForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
assert.equal($('#accountSave').disabled,true);assert.equal($('#accountProfileForm').getAttribute('aria-busy'),'true');
$('#accountProfileForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
assert.deepEqual(updateCalls,['Tên mới'],'Repeated submit while saving is ignored');
releaseUpdate();await flush();
assert.equal($('#accountName').textContent,'Tên mới');assert.equal($('#accountSave').disabled,false);
assert.equal($('#accountStatus').textContent,'Đã cập nhật hồ sơ.');
$('#accountDisplayName').value='   ';$('#accountProfileForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await flush();
assert.equal(updateCalls.length,1);assert.match($('#accountError').textContent,/1 đến 80/);
$('#accountDisplayName').value='Nháp được giữ';failNext=true;$('#accountProfileForm').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));releaseUpdate();await flush();
assert.equal($('#accountName').textContent,'Tên mới');assert.equal($('#accountDisplayName').value,'Nháp được giữ');assert.match($('#accountError').textContent,/Kiểm tra mạng/);assert.doesNotMatch($('#accountError').textContent,/private provider/);
i18n.setLocale('en-US');assert.equal($('#accountTitle').textContent,'Account profile');assert.equal($('#accountSave').textContent,'Save changes');assert.equal($('#accountDisplayName').value,'Nháp được giữ','Locale changes preserve the draft');
$('#accountSignOut').click();await flush();assert.equal($('#accountMember').hidden,true);assert.equal($('#accountGuest').hidden,false);assert.equal($('#accountDisplayName').value,'');
$('#accountClose').click();assert.equal($('#openAccount').getAttribute('aria-expanded'),'false');
ui.destroy();assert.equal($('#openAccount'),null);assert.equal($('#accountDialog'),null);assert.equal(listeners.size,0);
assert.equal(accountErrorKey('auth/invalid-display-name'),'invalidName');
i18n.setLocale('vi-VN');delete globalThis.document;
console.log('PASS profile v78 DOM: restored header, safe provider text, profile editing, duplicate submit guard, invalid-name/network recovery, VI/EN draft preservation, signout cleanup. Not a browser or real Firebase/OAuth test.');
