import {authConfig} from './auth-config.js?v=66';

export const authPersistenceKey='quanh.auth.persistence.v1';
const appName='quanh-lab-auth';
const knownCodes=new Set([
 'auth/not-configured','auth/invalid-config','auth/sdk-unavailable','auth/initialization-timeout',
 'auth/configuration-changed','auth/operation-in-progress','auth/client-destroyed','auth/unknown',
 'auth/invalid-email','auth/missing-password','auth/weak-password','auth/password-does-not-meet-requirements',
 'auth/email-already-in-use','auth/invalid-credential','auth/wrong-password','auth/user-not-found',
 'auth/user-disabled','auth/too-many-requests','auth/network-request-failed',
 'auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request',
 'auth/account-exists-with-different-credential','auth/credential-already-in-use',
 'auth/operation-not-allowed','auth/unauthorized-domain','auth/web-storage-unsupported',
 'auth/operation-not-supported-in-this-environment','auth/requires-recent-login',
 'auth/invalid-api-key','auth/app-not-authorized','auth/no-current-user'
]);
const errorPairs={
 'auth/not-configured':['Đăng nhập chưa được kết nối. Chủ website cần hoàn tất cấu hình Firebase.','Sign-in is not connected yet. The website owner needs to finish Firebase setup.'],
 'auth/invalid-config':['Cấu hình đăng nhập chưa hợp lệ. Chủ website cần kiểm tra cấu hình Firebase.','The sign-in configuration is invalid. The website owner needs to check Firebase settings.'],
 'auth/sdk-unavailable':['Chưa tải được công cụ đăng nhập. Kiểm tra mạng và thử lại.','Unable to load the sign-in tools. Check your connection and retry.'],
 'auth/initialization-timeout':['Khởi tạo đăng nhập quá lâu. Kiểm tra mạng và thử lại.','Sign-in initialization took too long. Check your connection and retry.'],
 'auth/configuration-changed':['Cấu hình đăng nhập đã thay đổi. Hãy tải lại trang.','The sign-in configuration changed. Reload this page.'],
 'auth/operation-in-progress':['Một thao tác tài khoản đang được xử lí. Hãy chờ thao tác đó kết thúc.','An account operation is in progress. Wait for it to finish.'],
 'auth/invalid-email':['Nhập một địa chỉ email hợp lệ.','Enter a valid email address.'],
 'auth/missing-password':['Nhập mật khẩu của bạn.','Enter your password.'],
 'auth/weak-password':['Mật khẩu chưa đủ mạnh. Dùng ít nhất 6 ký tự và theo yêu cầu của dịch vụ.','The password is too weak. Use at least 6 characters and follow the service requirements.'],
 'auth/password-does-not-meet-requirements':['Mật khẩu chưa đáp ứng chính sách của dịch vụ. Chọn mật khẩu dài và khó đoán hơn.','The password does not meet the service policy. Choose a longer, harder-to-guess password.'],
 'auth/email-already-in-use':['Chưa tạo được tài khoản với email này. Thử đăng nhập hoặc đặt lại mật khẩu.','Unable to create an account with this email. Try signing in or resetting your password.'],
 'auth/invalid-credential':['Email hoặc mật khẩu chưa đúng. Kiểm tra lại hoặc đặt lại mật khẩu.','The email or password is incorrect. Check your details or reset your password.'],
 'auth/user-disabled':['Tài khoản này đã bị vô hiệu hóa. Liên hệ chủ website để được hỗ trợ.','This account is disabled. Contact the website owner for help.'],
 'auth/too-many-requests':['Có quá nhiều yêu cầu đăng nhập. Chờ một lúc rồi thử lại.','Too many sign-in attempts. Wait a while and try again.'],
 'auth/network-request-failed':['Không kết nối được dịch vụ đăng nhập. Kiểm tra mạng rồi thử lại.','Unable to reach the sign-in service. Check your connection and retry.'],
 'auth/popup-blocked':['Trình duyệt đã chặn cửa sổ Google. Cho phép cửa sổ bật lên cho website này rồi nhấn Google lần nữa.','Your browser blocked the Google window. Allow popups for this website, then select Google again.'],
 'auth/popup-closed-by-user':['Cửa sổ Google đã đóng. Chưa đăng nhập; bạn có thể thử lại.','The Google window was closed. You are not signed in; you can try again.'],
 'auth/cancelled-popup-request':['Yêu cầu Google trước đã được hủy. Chỉ mở một cửa sổ đăng nhập mỗi lần.','The previous Google request was cancelled. Open one sign-in window at a time.'],
 'auth/account-exists-with-different-credential':['Email này dùng phương thức đăng nhập khác. Dùng phương thức đã đăng ký rồi thử lại.','This email uses another sign-in method. Sign in with the method you previously registered.'],
 'auth/credential-already-in-use':['Thông tin đăng nhập này đã thuộc tài khoản khác. Dùng phương thức đăng nhập đã có.','These sign-in details belong to another account. Use the existing sign-in method.'],
 'auth/operation-not-allowed':['Phương thức đăng nhập này chưa được bật trên Firebase. Chủ website cần bật nhà cung cấp tương ứng.','This sign-in method is not enabled in Firebase. The website owner needs to enable the provider.'],
 'auth/unauthorized-domain':['Tên miền này chưa được cho phép đăng nhập. Chủ website cần thêm tên miền trong Firebase Authentication.','This domain is not authorized for sign-in. The website owner needs to add it in Firebase Authentication.'],
 'auth/web-storage-unsupported':['Trình duyệt đang chặn bộ nhớ đăng nhập. Cho phép bộ nhớ trang hoặc thử cửa sổ trình duyệt khác.','Your browser is blocking sign-in storage. Allow site storage or try another browser window.'],
 'auth/operation-not-supported-in-this-environment':['Trình duyệt này chưa hỗ trợ phương thức đăng nhập đã chọn. Thử email và mật khẩu hoặc dùng trình duyệt khác.','This browser does not support the selected sign-in method. Try email and password or another browser.'],
 'auth/requires-recent-login':['Thao tác cần phiên đăng nhập mới. Đăng xuất rồi đăng nhập lại.','This action needs a recent sign-in. Sign out and sign in again.'],
 'auth/invalid-api-key':['Cấu hình đăng nhập chưa được dịch vụ chấp nhận. Chủ website cần kiểm tra Firebase Web App.','The service did not accept the sign-in configuration. The website owner needs to check the Firebase Web App.'],
 'auth/app-not-authorized':['Ứng dụng này chưa được phép dùng dịch vụ đăng nhập. Chủ website cần kiểm tra cấu hình Firebase.','This app is not authorized to use sign-in. The website owner needs to check Firebase settings.'],
 'auth/no-current-user':['Bạn cần đăng nhập trước khi xóa tài khoản.','Sign in before deleting your account.'],
 'auth/unknown':['Chưa hoàn tất được thao tác tài khoản. Thử lại sau.','Unable to complete this account action. Please try again later.']
};
export function authErrorText(code,locale='vi'){
 if(code==='auth/wrong-password'||code==='auth/user-not-found')code='auth/invalid-credential';
 return (errorPairs[code]||errorPairs['auth/unknown'])[/^en(?:-|$)/i.test(locale)?1:0];
}
function failure(code){const error=new Error(authErrorText(code,'en'));error.code=code;return error;}
function normalizeError(error,fallback='auth/unknown'){
 let code=error?.code;
 if(code==='auth/api-key-not-valid.-please-pass-a-valid-api-key.')code='auth/invalid-api-key';
 return failure(knownCodes.has(code)?code:fallback);
}
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
export function validateAuthConfig(config){
 const unavailable=errorCode=>Object.freeze({enabled:false,valid:false,errorCode,firebase:null});
 if(!config||config.enabled!==true)return unavailable('auth/not-configured');
 const firebase=config.firebase;
 if(!plain(config)||Object.keys(config).some(k=>!['enabled','firebase'].includes(k))||!plain(firebase))return unavailable('auth/invalid-config');
 const allowed=['apiKey','authDomain','projectId','appId','storageBucket','messagingSenderId'];
 if(Object.keys(firebase).some(k=>!allowed.includes(k)))return unavailable('auth/invalid-config');
 if(!['apiKey','authDomain','projectId','appId'].every(key=>typeof firebase[key]==='string'))return unavailable('auth/invalid-config');
 if(!/^AIza[0-9A-Za-z_-]{35}$/.test(firebase.apiKey||'')||!/^1:\d+:web:[a-f0-9]+$/.test(firebase.appId||'')||!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(firebase.projectId||'')||firebase.authDomain!==firebase.projectId+'.firebaseapp.com')return unavailable('auth/invalid-config');
 if(firebase.messagingSenderId!==undefined&&(typeof firebase.messagingSenderId!=='string'||!/^\d{1,24}$/.test(firebase.messagingSenderId)))return unavailable('auth/invalid-config');
 if(firebase.storageBucket!==undefined&&(typeof firebase.storageBucket!=='string'||!new RegExp('^'+firebase.projectId+'\\.(?:appspot\\.com|firebasestorage\\.app)$').test(firebase.storageBucket)))return unavailable('auth/invalid-config');
 const cleaned=Object.fromEntries(allowed.filter(k=>firebase[k]!==undefined).map(k=>[k,firebase[k]]));
 return Object.freeze({enabled:true,valid:true,errorCode:null,firebase:Object.freeze(cleaned)});
}
export function authAvailability(config=authConfig){const {enabled,errorCode}=validateAuthConfig(config);return Object.freeze({enabled,errorCode});}
function localSDKLoader(){let attempt=0;return ()=>{const retry=attempt++?'&retry='+attempt:'';return import('./vendor/firebase-auth.js?v=64'+retry);};}
function defaultStorage(){try{return globalThis.localStorage;}catch{return null;}}
function safeUser(user){
 if(!user)return null;
 return Object.freeze({uid:String(user.uid||'').slice(0,128),email:typeof user.email==='string'?user.email.slice(0,254):null,displayName:typeof user.displayName==='string'?user.displayName.slice(0,200):null,emailVerified:user.emailVerified===true,providerIds:Object.freeze([...new Set((user.providerData||[]).map(p=>p.providerId).filter(p=>typeof p==='string'))])});
}
function credentials({email,password}={},signup=false){
 email=typeof email==='string'?email.trim():'';
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw failure('auth/invalid-email');
 if(typeof password!=='string'||!password.length)throw failure('auth/missing-password');
 if(signup&&password.length<6)throw failure('auth/weak-password');
 return {email,password};
}
function deadline(promise,milliseconds){
 let timer;
 return Promise.race([promise,new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(failure('auth/initialization-timeout')),milliseconds);})]).finally(()=>clearTimeout(timer));
}
/** Firebase owns its authentication persistence. This adapter never stores a
 * password/token, uploads lab data or modifies existing Quanh Lab storage keys.
 * Nothing initializes Firebase until prepare() or an explicit account action.
 */
export function createAuthClient({config=authConfig,loadSDK=localSDKLoader(),storage=defaultStorage(),locale=()=>globalThis.document?.documentElement?.lang||'vi',startupTimeoutMs=20000}={}){
 const checked=validateAuthConfig(config),listeners=new Set();
 let snapshot=Object.freeze({enabled:checked.enabled,status:checked.enabled?'idle':'disabled',user:null,errorCode:checked.errorCode,operation:null});
 let sdk,auth,initialState,preparation,unsubscribe,ready=false,destroyed=false,performing=false;
 const emit=patch=>{if(destroyed)return;snapshot=Object.freeze({...snapshot,...patch});for(const listener of [...listeners]){try{listener(snapshot);}catch{/* A view listener cannot interrupt authentication. */}}};
 const assertAvailable=()=>{if(destroyed)throw failure('auth/client-destroyed');if(!checked.enabled)throw failure(checked.errorCode);};
 const currentLanguage=()=>{auth.languageCode=/^en(?:-|$)/i.test(typeof locale==='function'?locale():locale)?'en':'vi';};
 const remembered=()=>{try{return storage?.getItem(authPersistenceKey)==='local';}catch{return false;}};
 async function prepare(){
  assertAvailable();if(ready)return snapshot;if(preparation)return preparation;
  emit({status:'loading',errorCode:null,operation:null});
  preparation=(async()=>{
   try{
    if(!sdk){try{sdk=await deadline(loadSDK(),startupTimeoutMs);}catch(error){if(error?.code==='auth/initialization-timeout')throw error;throw failure('auth/sdk-unavailable');}}
    if(destroyed)throw failure('auth/client-destroyed');
    if(!auth){
     const existing=sdk.getApps().find(app=>app.name===appName);
     if(existing&&['apiKey','authDomain','projectId','appId'].some(key=>existing.options?.[key]!==checked.firebase[key]))throw failure('auth/configuration-changed');
     const app=existing||sdk.initializeApp(checked.firebase,appName);
     // Do not install the popup resolver here: it can load Google's helper iframe.
     // Google assets are requested only by signInWithGoogle().
     try{auth=sdk.initializeAuth(app,{persistence:remembered()?sdk.browserLocalPersistence:sdk.browserSessionPersistence});}
     catch(error){if(error?.code==='auth/already-initialized'&&existing)auth=sdk.getAuth(app);else throw error;}
     currentLanguage();
     initialState=new Promise((resolve,reject)=>{
      unsubscribe=sdk.onAuthStateChanged(auth,user=>{ready=true;emit({user:safeUser(user),...(performing?{}:{status:'ready',errorCode:null,operation:null})});resolve();},error=>{const normalized=normalizeError(error);emit({status:'error',errorCode:normalized.code,operation:null});reject(normalized);});
     });
    }
    await deadline(initialState,startupTimeoutMs);
    if(destroyed)throw failure('auth/client-destroyed');
    ready=true;emit({status:'ready',errorCode:null,operation:null});return snapshot;
   }catch(error){const normalized=normalizeError(error);emit({status:'error',errorCode:normalized.code,operation:null});throw normalized;}
   finally{preparation=null;}
  })();
  return preparation;
 }
 async function persistence(remember){
  const previous=remembered();
  try{
   if(remember){if(!storage)throw failure('auth/web-storage-unsupported');storage.setItem(authPersistenceKey,'local');if(!remembered())throw failure('auth/web-storage-unsupported');}
   else {try{storage?.removeItem(authPersistenceKey);}catch{/* Session sign-in needs no local preference. */}}
   await sdk.setPersistence(auth,remember?sdk.browserLocalPersistence:sdk.browserSessionPersistence);
  }catch(error){try{if(previous)storage?.setItem(authPersistenceKey,'local');else storage?.removeItem(authPersistenceKey);}catch{}throw normalizeError(error,'auth/web-storage-unsupported');}
 }
 async function run(operation,action){
  assertAvailable();if(performing)throw failure('auth/operation-in-progress');
  await prepare();if(performing)throw failure('auth/operation-in-progress');
  performing=true;currentLanguage();emit({status:'busy',operation,errorCode:null});
  try{const result=await action();emit({status:'ready',operation:null,errorCode:null});return result;}
  catch(error){const normalized=normalizeError(error);emit({status:'error',operation:null,errorCode:normalized.code});throw normalized;}
  finally{performing=false;}
 }
 async function emailAction(operation,input,signup){
  return run(operation,async()=>{
   const {email,password}=credentials(input,signup);await persistence(input?.remember===true);
   const result=await (signup?sdk.createUserWithEmailAndPassword:sdk.signInWithEmailAndPassword)(auth,email,password);
   const user=safeUser(result.user);emit({user});return user;
  });
 }
 return Object.freeze({
  getSnapshot:()=>snapshot,
  subscribe(listener){if(typeof listener!=='function')throw new TypeError('Expected an auth listener');if(destroyed)throw failure('auth/client-destroyed');listeners.add(listener);listener(snapshot);return ()=>listeners.delete(listener);},
  prepare,start:prepare,
  signIn:input=>emailAction('signIn',input,false),
  signUp:input=>emailAction('signUp',input,true),
  resetPassword:input=>run('resetPassword',async()=>{const {email}=credentials({email:input?.email,password:'not-used'});try{await sdk.sendPasswordResetEmail(auth,email);}catch(error){if(error?.code!=='auth/user-not-found')throw error;}}),
  signInWithGoogle:({remember=false}={})=>run('google',async()=>{await persistence(remember===true);const provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});const result=await sdk.signInWithPopup(auth,provider,sdk.browserPopupRedirectResolver);const user=safeUser(result.user);emit({user});return user;}),
  signOut:()=>run('signOut',async()=>{await sdk.signOut(auth);try{storage?.removeItem(authPersistenceKey);}catch{}emit({user:null});}),
  deleteAccount:()=>run('deleteAccount',async()=>{if(!auth.currentUser)throw failure('auth/no-current-user');await sdk.deleteUser(auth.currentUser);try{storage?.removeItem(authPersistenceKey);}catch{}emit({user:null});}),
  destroy(){destroyed=true;unsubscribe?.();listeners.clear();}
 });
}
