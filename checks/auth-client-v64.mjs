import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAuthClient,validateAuthConfig,authAvailability,authPersistenceKey,authErrorText} from '../dist/auth-client.js';
import {authConfig} from '../dist/auth-config.js';
const config={enabled:true,firebase:{apiKey:'AIza'+'A'.repeat(35),authDomain:'quanh-fixture.firebaseapp.com',projectId:'quanh-fixture',appId:'1:123456789:web:abcdef123456789'}};
const memory=()=>{const map=new Map([['thpt-vat-li-session','keep-lab-session'],['quanh.locale.v1','vi-VN']]),writes=[];return {map,writes,getItem:key=>map.get(key)||null,setItem:(key,value)=>{writes.push(key);map.set(key,value);},removeItem:key=>{writes.push(key);map.delete(key);}};};
function fixtures({initialUser=null,initialDelay=false}={}){
 const calls=[],apps=[],auth={currentUser:initialUser},listeners=new Set();let failCode=null,release,loads=0;
 const user={uid:'fixture-account',email:'learner@example.test',displayName:'Test learner',emailVerified:false,providerData:[{providerId:'password'}],accessToken:'must-not-leak-token',refreshToken:'must-not-leak-refresh'};
 const change=value=>{auth.currentUser=value;for(const callback of listeners)callback(value);};
 const fail=()=>{if(failCode){const error=new Error('PRIVATE_PROVIDER_DETAIL');error.code=failCode;throw error;}};
 const sdk={
  browserSessionPersistence:{type:'SESSION'},browserLocalPersistence:{type:'LOCAL'},browserPopupRedirectResolver:{resolver:'popup'},
  getApps:()=>apps,
  initializeApp:(options,name)=>{calls.push(['initializeApp',name]);const app={name,options};apps.push(app);return app;},
  initializeAuth:(app,options)=>{calls.push(['initializeAuth',options]);return auth;},getAuth:()=>auth,
  onAuthStateChanged:(target,callback)=>{calls.push(['subscribe']);listeners.add(callback);if(initialDelay)release=()=>callback(auth.currentUser);else queueMicrotask(()=>callback(auth.currentUser));return ()=>listeners.delete(callback);},
  setPersistence:async(target,persistence)=>{calls.push(['persistence',persistence.type]);},
  signInWithEmailAndPassword:async(target,email,password)=>{calls.push(['signIn',email,password]);fail();change(user);return {user};},
  createUserWithEmailAndPassword:async(target,email,password)=>{calls.push(['signUp',email,password]);fail();change(user);return {user};},
  sendPasswordResetEmail:async(target,email)=>{calls.push(['resetPassword',email]);fail();},
  GoogleAuthProvider:class{setCustomParameters(parameters){this.parameters=parameters;}},
  signInWithPopup:async(target,provider,resolver)=>{calls.push(['google',provider.parameters,resolver]);fail();change({...user,providerData:[{providerId:'google.com'}],emailVerified:true});return {user:auth.currentUser};},
  signOut:async()=>{calls.push(['signOut']);fail();change(null);},
  deleteUser:async target=>{calls.push(['deleteUser',target.uid]);fail();change(null);}
 };
 return {calls,auth,sdk,user,change,get loads(){return loads;},loadSDK:async()=>{loads++;return sdk;},setFail:code=>failCode=code,release:()=>release?.()};
}
assert.equal(validateAuthConfig(config).valid,true);
assert.equal(validateAuthConfig(config).firebase.authDomain,'quanh-fixture.firebaseapp.com');
assert.equal(validateAuthConfig(authConfig).valid,authConfig.enabled===true,'Published auth config must validate when enabled');
assert.deepEqual(authAvailability({enabled:false,firebase:null}),{enabled:false,errorCode:'auth/not-configured'});
for(const firebase of [{...config.firebase,authDomain:'https://quanh-fixture.firebaseapp.com'},{...config.firebase,authDomain:'quanh-fixture.firebaseapp.com.evil.test'},{...config.firebase,authDomain:'another-project.firebaseapp.com'},{...config.firebase,private_key:'not-permitted'},{...config.firebase,projectId:['quanh-fixture']},{...config.firebase,apiKey:''},{...config.firebase,measurementId:'not-an-analytics-config'},{...config.firebase,messagingSenderId:123}])assert.equal(validateAuthConfig({enabled:true,firebase}).errorCode,'auth/invalid-config');
let disabledLoads=0;
const disabled=createAuthClient({config:{enabled:false,firebase:null},loadSDK:()=>{disabledLoads++;throw Error('must not load');},storage:memory()});
const disabledStates=[];disabled.subscribe(s=>disabledStates.push(s));assert.equal(disabled.getSnapshot().status,'disabled');
for(const method of ['prepare','signIn','signUp','resetPassword','signInWithGoogle','signOut','deleteAccount'])await assert.rejects(disabled[method]({email:'test@example.test',password:'not-a-real-password'}),{code:'auth/not-configured'});
assert.equal(disabledLoads,0);assert.equal(disabledStates.length,1,'No fake auth state when disconnected');
const sdkUnavailable=createAuthClient({config,loadSDK:async()=>{throw Error('private diagnostic');},storage:memory()});await assert.rejects(sdkUnavailable.prepare(),{code:'auth/sdk-unavailable'});assert.equal(sdkUnavailable.getSnapshot().errorCode,'auth/sdk-unavailable');
const stalled=createAuthClient({config,loadSDK:()=>new Promise(()=>{}),storage:memory(),startupTimeoutMs:1});await assert.rejects(stalled.prepare(),{code:'auth/initialization-timeout'});stalled.destroy();
const fixture=fixtures(),storage=memory(),client=createAuthClient({config,loadSDK:fixture.loadSDK,storage,locale:()=> 'en-US'}),states=[];
client.subscribe(s=>states.push(s));assert.equal(fixture.loads,0,'subscribe does not initialize auth');assert.equal(fixture.calls.length,0);
await Promise.all([client.prepare(),client.start()]);assert.equal(fixture.loads,1);assert.equal(fixture.calls.filter(c=>c[0]==='initializeAuth').length,1);assert.equal(fixture.calls.find(c=>c[0]==='initializeAuth')[1].persistence.type,'SESSION');assert.equal('popupRedirectResolver' in fixture.calls.find(c=>c[0]==='initializeAuth')[1],false,'Do not proactively load Google iframe/scripts');assert.equal(client.getSnapshot().status,'ready');assert.equal(client.getSnapshot().user,null);assert.equal(fixture.auth.languageCode,'en');
await assert.rejects(client.signUp({email:'invalid',password:'123456'}),{code:'auth/invalid-email'});await assert.rejects(client.signUp({email:'learner@example.test',password:'123'}),{code:'auth/weak-password'});assert.equal(fixture.calls.some(c=>c[0]==='signUp'),false);
const account=await client.signUp({email:' learner@example.test ',password:'do-not-store-me',remember:false});
assert.equal(account.email,'learner@example.test');assert.equal(account.emailVerified,false,'Do not claim an unverified email is verified');assert.equal(account.accessToken,undefined);assert.equal(account.refreshToken,undefined);assert.equal(Object.isFrozen(account),true);assert.equal(client.getSnapshot().status,'ready');assert.equal(client.getSnapshot().user.uid,'fixture-account');
assert.equal(storage.getItem(authPersistenceKey),null);assert.ok(!JSON.stringify(client.getSnapshot()).includes('do-not-store-me'));assert.ok(!JSON.stringify([...storage.map]).includes('do-not-store-me'));assert.equal(fixture.calls.find(c=>c[0]==='signUp')[1],'learner@example.test');
await client.signOut();assert.equal(client.getSnapshot().user,null);assert.equal(storage.getItem('thpt-vat-li-session'),'keep-lab-session');
await client.signIn({email:'learner@example.test',password:'do-not-store-me',remember:true});assert.equal(storage.getItem(authPersistenceKey),'local');assert.equal(fixture.calls.filter(c=>c[0]==='persistence').at(-1)[1],'LOCAL');
const rememberedFixture=fixtures({initialUser:fixture.user}),restored=createAuthClient({config,loadSDK:rememberedFixture.loadSDK,storage});
await restored.prepare();assert.equal(rememberedFixture.calls.find(c=>c[0]==='initializeAuth')[1].persistence.type,'LOCAL');assert.equal(restored.getSnapshot().user.uid,'fixture-account','Restore through SDK state listener');
fixture.setFail('auth/requires-recent-login');await assert.rejects(client.deleteAccount(),{code:'auth/requires-recent-login'});assert.equal(client.getSnapshot().user.uid,'fixture-account');assert.equal(storage.getItem('thpt-vat-li-session'),'keep-lab-session');
fixture.setFail(null);await client.deleteAccount();assert.equal(client.getSnapshot().user,null);assert.equal(storage.getItem(authPersistenceKey),null);assert.equal(storage.getItem('thpt-vat-li-session'),'keep-lab-session');
await assert.rejects(client.deleteAccount(),{code:'auth/no-current-user'});
fixture.setFail('auth/user-not-found');await client.resetPassword({email:'missing@example.test'});assert.equal(client.getSnapshot().status,'ready','Do not reveal reset account existence');
fixture.setFail(null);await client.resetPassword({email:'learner@example.test'});assert.equal(client.getSnapshot().user,null);
for(const code of ['auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request','auth/operation-not-allowed','auth/unauthorized-domain','auth/network-request-failed']){
 fixture.setFail(code);await assert.rejects(client.signInWithGoogle(),{code});assert.equal(client.getSnapshot().status,'error');assert.equal(client.getSnapshot().user,null);assert.ok(authErrorText(code,'en').length>20);assert.ok(authErrorText(code,'vi').length>20);
}
fixture.setFail(null);const googleUser=await client.signInWithGoogle({remember:false});assert.deepEqual(googleUser.providerIds,['google.com']);assert.equal(googleUser.emailVerified,true);const popup=fixture.calls.filter(c=>c[0]==='google').at(-1);assert.deepEqual(popup[1],{prompt:'select_account'});assert.equal(popup[2],fixture.sdk.browserPopupRedirectResolver);assert.equal(storage.getItem(authPersistenceKey),null);
fixture.setFail('private-provider-error');await assert.rejects(client.signIn({email:'test@example.test',password:'password'}),error=>error.code==='auth/unknown'&&!error.message.includes('PRIVATE_PROVIDER_DETAIL'));
const slow=fixtures();let completeSignIn;slow.sdk.signInWithEmailAndPassword=()=>new Promise(resolve=>completeSignIn=()=>{slow.change(slow.user);resolve({user:slow.user});});const serial=createAuthClient({config,loadSDK:slow.loadSDK,storage:memory()});await serial.prepare();const pending=serial.signIn({email:'test@example.test',password:'password'});await new Promise(setImmediate);assert.equal(serial.getSnapshot().status,'busy');await assert.rejects(serial.signInWithGoogle(),{code:'auth/operation-in-progress'});completeSignIn();await pending;
const timeoutFixture=fixtures({initialDelay:true}),timed=createAuthClient({config,loadSDK:timeoutFixture.loadSDK,storage:memory(),startupTimeoutMs:1});await assert.rejects(timed.prepare(),{code:'auth/initialization-timeout'});timeoutFixture.release();await timed.prepare();assert.equal(timed.getSnapshot().status,'ready');
const blocked=createAuthClient({config,loadSDK:fixtures().loadSDK,storage:{getItem:()=>null,setItem:()=>{throw Error('blocked');},removeItem:()=>{}}});await assert.rejects(blocked.signIn({email:'test@example.test',password:'password',remember:true}),{code:'auth/web-storage-unsupported'});assert.equal(blocked.getSnapshot().user,null);
assert.ok(storage.writes.every(key=>key===authPersistenceKey),'Adapter never modifies lab/storage keys');
client.destroy();await assert.rejects(client.prepare(),{code:'auth/client-destroyed'});restored.destroy();serial.destroy();timed.destroy();blocked.destroy();
const source=fs.readFileSync(new URL('../dist/auth-client.js',import.meta.url),'utf8');assert.doesNotMatch(source,/signInWithRedirect|signInWithCustomToken|fetch\(|(?:localStorage|sessionStorage|storage)\??\.clear\(/);assert.match(source,/import\('\.\/vendor\/firebase-auth\.js\?v=64'\+retry\)/);
console.log('PASS auth adapter v64: lazy/disconnected states, config allowlist, local SDK failure, SESSION default/explicit LOCAL restore, signup/signin/reset/Google/signout/delete fixtures, recent-login and popup errors, no token/password copies or lab data changes, no real auth service calls.');
