// Account controls are independent of routing and never rewrite experiment storage.
import {i18n} from './i18n.js?v=54';
import {createAuthClient} from './auth-client.js?v=66';

const copy={
 'vi-VN':{
  open:'Đăng nhập',account:'Tài khoản',title:'Chào bạn đến Quanh Lab',intro:'Đăng nhập bằng email hoặc tài khoản Google.',close:'Đóng tài khoản',
  signin:'Đăng nhập',signup:'Tạo tài khoản',reset:'Quên mật khẩu',email:'Email',password:'Mật khẩu',show:'Hiện mật khẩu',hide:'Ẩn mật khẩu',
  passwordHint:'Dùng ít nhất 8 ký tự khi tạo tài khoản.',remember:'Giữ đăng nhập trên thiết bị này',shared:'Bỏ chọn khi dùng máy tính chung.',
  google:'Tiếp tục với Google',or:'hoặc dùng email',submitReset:'Gửi email đặt lại mật khẩu',back:'Quay lại đăng nhập',
  privacy:'Quyền riêng tư và dữ liệu',local:'Bảng đo, ghi chép và tiến độ hiện được lưu trên trình duyệt này. Đăng nhập chưa đồng bộ dữ liệu sang thiết bị khác.',
  disabled:'Đăng nhập đang được chuẩn bị. Bạn vẫn có thể sử dụng đầy đủ thí nghiệm và sách mà không cần tài khoản.',
  loading:'Đang kết nối dịch vụ đăng nhập…',busy:'Đang xử lý…',ready:'',resetSent:'Nếu địa chỉ này có tài khoản phù hợp, bạn sẽ nhận được email hướng dẫn. Hãy kiểm tra cả thư rác.',
  created:'Tài khoản đã được tạo.',signedIn:'Đã đăng nhập.',signedOut:'Đã đăng xuất. Dữ liệu thí nghiệm trên thiết bị vẫn được giữ.',
  signedTitle:'Tài khoản của bạn',signout:'Đăng xuất',provider:'Phương thức đăng nhập',verified:'Email đã xác minh',unverified:'Email chưa xác minh',
  invalid:'Email hoặc mật khẩu chưa đúng. Hãy kiểm tra lại hoặc đặt lại mật khẩu.',network:'Không thể kết nối. Kiểm tra mạng rồi thử lại.',
  blocked:'Trình duyệt đã chặn cửa sổ Google. Cho phép cửa sổ bật lên cho Quanh Lab rồi thử lại.',cancelled:'Bạn đã đóng đăng nhập Google. Có thể thử lại hoặc dùng email.',
  different:'Email này đang dùng phương thức đăng nhập khác. Hãy dùng phương thức ban đầu.',weak:'Mật khẩu chưa đáp ứng yêu cầu bảo mật. Dùng ít nhất 8 ký tự và làm theo chính sách của dịch vụ.',
  exists:'Chưa tạo được tài khoản với email này. Hãy đăng nhập hoặc đặt lại mật khẩu.',rate:'Có quá nhiều lần thử. Vui lòng đợi một lúc rồi thử lại.',
  unavailable:'Dịch vụ đăng nhập chưa sẵn sàng. Bạn có thể tiếp tục dùng thí nghiệm.',generic:'Chưa thực hiện được. Vui lòng thử lại.',delete:'Xóa tài khoản',deleteTitle:'Xóa tài khoản này?',deleteNotice:'Tài khoản xác thực sẽ bị xóa vĩnh viễn. Bảng đo, ghi chép và tiến độ trên thiết bị này vẫn được giữ.',deleteConfirm:'Xóa vĩnh viễn tài khoản',deleteCancel:'Giữ tài khoản',deleted:'Tài khoản đã được xóa. Dữ liệu thí nghiệm trên thiết bị vẫn được giữ.',recent:'Để xóa tài khoản, hãy đăng xuất rồi đăng nhập lại, sau đó thử xóa lần nữa.',consent:'Khi tiếp tục, thông tin đăng nhập được xử lý theo chính sách quyền riêng tư bên dưới.',session:'Không thể lưu phiên đăng nhập trên trình duyệt này. Hãy cho phép dữ liệu trang web rồi thử lại.'
 },
 'en-US':{
  open:'Sign in',account:'Account',title:'Welcome to Quanh Lab',intro:'Sign in with your email or Google account.',close:'Close account',
  signin:'Sign in',signup:'Create account',reset:'Forgot password',email:'Email',password:'Password',show:'Show password',hide:'Hide password',
  passwordHint:'Use at least 8 characters when creating an account.',remember:'Keep me signed in on this device',shared:'Leave unchecked on a shared computer.',
  google:'Continue with Google',or:'or use email',submitReset:'Send password reset email',back:'Back to sign in',
  privacy:'Privacy and data',local:'Measurements, notes and progress are currently saved in this browser. Signing in does not yet sync them across devices.',
  disabled:'Sign-in is being prepared. All experiments and textbooks remain available without an account.',
  loading:'Connecting to the sign-in service…',busy:'Working…',ready:'',resetSent:'If this address has an eligible account, you will receive an email with instructions. Check your spam folder too.',
  created:'Your account has been created.',signedIn:'You are signed in.',signedOut:'You are signed out. Experiment data on this device has been kept.',
  signedTitle:'Your account',signout:'Sign out',provider:'Sign-in method',verified:'Email verified',unverified:'Email not verified',
  invalid:'Check your email and password, or reset your password.',network:'Could not connect. Check your network and try again.',
  blocked:'Your browser blocked the Google window. Allow popups for Quanh Lab and try again.',cancelled:'You closed Google sign-in. Try again or use email.',
  different:'This email uses another sign-in method. Use the original method.',weak:'The password does not meet the security requirements. Use at least 8 characters and follow the service policy.',
  exists:'Could not create an account with this email. Try signing in or resetting your password.',rate:'Too many attempts. Wait a little and try again.',
  unavailable:'The sign-in service is not ready. You can continue using the experiments.',generic:'Could not complete the request. Please try again.',delete:'Delete account',deleteTitle:'Delete this account?',deleteNotice:'Your authentication account will be permanently deleted. Measurements, notes and progress on this device will be kept.',deleteConfirm:'Permanently delete account',deleteCancel:'Keep account',deleted:'Your account has been deleted. Experiment data on this device has been kept.',recent:'To delete your account, sign out and sign in again, then retry deletion.',consent:'By continuing, your sign-in information is handled under the privacy policy below.',session:'This browser could not save the sign-in session. Allow site data and try again.'
 }
};
export function accountErrorKey(code=''){
 if(/invalid-(credential|email|login-credentials)|wrong-password|user-not-found|user-disabled/.test(code))return 'invalid';
 if(/requires-recent-login/.test(code))return 'recent';
 if(/network|timeout/.test(code))return 'network';
 if(/popup-blocked/.test(code))return 'blocked';
 if(/popup-closed|cancelled-popup|user-cancelled/.test(code))return 'cancelled';
 if(/account-exists-with-different|credential-already-in-use/.test(code))return 'different';
 if(/weak-password|password-does-not-meet/.test(code))return 'weak';
 if(/email-already-in-use/.test(code))return 'exists';
 if(/too-many-requests|quota-exceeded/.test(code))return 'rate';
 if(/web-storage|unsupported-persistence|operation-not-supported-in-this-environment/.test(code))return 'session';
 if(/not-configured|invalid-config|operation-not-allowed|unauthorized-domain|invalid-api-key|sdk-load|config/.test(code))return 'unavailable';
 return 'generic';
}
export function installAccountUI({client=createAuthClient()}={}){
 const nav=document.querySelector('.header nav,.reading-header nav');
 if(!nav||document.querySelector('#openAccount'))return null;
 let mode='signin',messageKey='',errorKey='',busy=false,showPassword=false,deleteConfirm=false,previousFocus=null;
 let snapshot=client.getSnapshot();
 const c=()=>copy[i18n.getLocale()]||copy['vi-VN'];
 const button=document.createElement('button');button.id='openAccount';button.className='account-trigger';button.type='button';
 button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','accountDialog');
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg><span></span>';
 nav.append(button);
 const dialog=document.createElement('dialog');dialog.id='accountDialog';dialog.className='account-dialog';dialog.setAttribute('aria-labelledby','accountTitle');dialog.setAttribute('aria-describedby','accountIntro');
 dialog.innerHTML=`<div class="account-heading"><div><p class="account-eyebrow">QUANH LAB</p><h2 id="accountTitle"></h2></div><button id="accountClose" class="account-close" type="button">×</button></div>
  <p id="accountIntro"></p><p id="accountStatus" class="account-status" role="status" aria-live="polite"></p><p id="accountError" class="account-error" role="alert" hidden></p>
  <div id="accountGuest"><div class="account-modes"><button type="button" data-account-mode="signin"></button><button type="button" data-account-mode="signup"></button></div>
   <button id="accountGoogle" class="account-google" type="button"><svg class="google-symbol" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65Z"/><path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg><span data-account-copy="google"></span></button>
   <p class="account-consent" data-account-copy="consent"></p>
   <p id="accountDivider" class="account-divider" data-account-copy="or"></p>
   <form id="accountForm"><label for="accountEmail" data-account-copy="email"></label><input id="accountEmail" name="email" type="email" autocomplete="email" inputmode="email" placeholder="ban@example.com" maxlength="254" required>
    <div id="accountPasswordGroup"><label for="accountPassword" data-account-copy="password"></label><div class="account-password"><input id="accountPassword" name="password" type="password" autocomplete="current-password" maxlength="4096" required><button type="button" id="accountShowPassword" aria-controls="accountPassword" aria-pressed="false"></button></div><p id="accountPasswordHint" class="account-hint" data-account-copy="passwordHint"></p></div>
    <div id="accountRememberGroup"><label class="account-check" for="accountRemember"><input id="accountRemember" type="checkbox"><span data-account-copy="remember"></span></label><p class="account-hint" data-account-copy="shared"></p></div>
    <button id="accountSubmit" class="account-primary" type="submit"></button>
   </form><button type="button" id="accountReset" class="account-text-button" data-account-mode="reset"></button><button type="button" id="accountBack" class="account-text-button" data-account-mode="signin" hidden></button>
  </div>
  <div id="accountMember" hidden><p id="accountName" class="account-name"></p><p id="accountUserEmail" class="account-user-email"></p><p id="accountVerified"></p><p id="accountProvider"></p><button id="accountSignOut" type="button" class="account-secondary"></button><button id="accountDelete" type="button" class="account-text-button account-danger"></button><section id="accountDeletePanel" aria-labelledby="accountDeleteTitle" hidden><h3 id="accountDeleteTitle" data-account-copy="deleteTitle"></h3><p data-account-copy="deleteNotice"></p><p id="accountDeleteEmail"></p><button id="accountDeleteCancel" class="account-secondary" type="button" data-account-copy="deleteCancel"></button><button id="accountDeleteConfirm" class="account-primary account-destructive" type="button" data-account-copy="deleteConfirm"></button></section></div>
  <p class="account-local" data-account-copy="local"></p><a class="account-privacy" href="privacy.html" data-account-copy="privacy"></a>`;
 document.body.append(dialog);
 const $=s=>dialog.querySelector(s);
 function render(){
  const t=c(),signed=!!snapshot.user,unavailable=!snapshot.enabled,working=busy||['loading','busy'].includes(snapshot.status),reset=mode==='reset';
  button.querySelector('span').textContent=signed?t.account:t.open;button.setAttribute('aria-label',signed?t.account:t.open);
  dialog.lang=i18n.getLocale();$('#accountTitle').textContent=signed?t.signedTitle:reset?t.reset:t.title;
  $('#accountIntro').textContent=signed?'':t.intro;$('#accountIntro').hidden=signed;
  $('#accountClose').setAttribute('aria-label',t.close);
  for(const node of dialog.querySelectorAll('[data-account-copy]'))node.textContent=t[node.dataset.accountCopy];
  $('#accountGuest').hidden=signed||unavailable;$('#accountMember').hidden=!signed;
  for(const node of dialog.querySelectorAll('.account-modes button')){node.textContent=t[node.dataset.accountMode];node.setAttribute('aria-pressed',String(mode===node.dataset.accountMode));node.disabled=working;}
  $('.account-modes').hidden=reset;$('#accountGoogle').hidden=reset;$('#accountDivider').hidden=reset;
  $('#accountPasswordGroup').hidden=reset;$('#accountRememberGroup').hidden=reset;
  $('#accountPassword').required=!reset;$('#accountPassword').disabled=reset||working||unavailable;
  $('#accountPassword').autocomplete=mode==='signup'?'new-password':'current-password';
  $('#accountPassword').minLength=mode==='signup'?8:1;$('#accountPassword').type=showPassword?'text':'password';
  $('#accountShowPassword').textContent=showPassword?t.hide:t.show;$('#accountShowPassword').setAttribute('aria-pressed',String(showPassword));
  $('#accountShowPassword').disabled=working||unavailable;$('#accountPasswordHint').hidden=mode!=='signup';
  $('#accountEmail').disabled=working||unavailable;$('#accountRemember').disabled=working||unavailable;
  $('#accountSubmit').textContent=working?t.busy:reset?t.submitReset:t[mode];
  $('#accountReset').textContent=t.reset;$('#accountReset').hidden=reset;$('#accountBack').textContent=t.back;$('#accountBack').hidden=!reset;
  for(const id of ['accountSubmit','accountGoogle','accountReset','accountBack','accountSignOut','accountDelete','accountDeleteCancel','accountDeleteConfirm'])$('#'+id).disabled=working||unavailable;
  $('#accountForm').setAttribute('aria-busy',String(working));
  const status=unavailable?t.disabled:snapshot.status==='loading'?t.loading:working?t.busy:messageKey?t[messageKey]:'';
  $('#accountStatus').textContent=status;$('#accountStatus').hidden=!status;
  const error=errorKey||(snapshot.status==='error'?accountErrorKey(snapshot.errorCode):'');
  $('#accountError').textContent=error?t[error]:'';$('#accountError').hidden=!error;
  if(signed){
   // Authenticated profile text is never inserted as HTML.
   $('#accountName').textContent=snapshot.user.displayName||t.account;$('#accountUserEmail').textContent=snapshot.user.email||'';
   $('#accountVerified').textContent=snapshot.user.emailVerified?t.verified:t.unverified;
   $('#accountProvider').textContent=t.provider+': '+(snapshot.user.providerIds||[]).map(id=>id==='google.com'?'Google':id==='password'?'Email':id).join(', ');
  }
  $('#accountSignOut').textContent=t.signout;$('#accountDelete').textContent=t.delete;
  $('#accountDeletePanel').hidden=!signed||!deleteConfirm;$('#accountDeleteEmail').textContent=snapshot.user?.email||'';
 }
 const unsubscribe=client.subscribe(next=>{snapshot=next;render();});
 const unsubscribeLocale=i18n.onLocaleChange(render);
 async function perform(action,success){
  if(busy)return;busy=true;messageKey='';errorKey='';render();
  try{await action();messageKey=success;deleteConfirm=false;$('#accountPassword').value='';if(['signedOut','deleted'].includes(success))$('#accountRemember').checked=false;}
  catch(error){errorKey=accountErrorKey(error?.code||client.getSnapshot().errorCode);}
  finally{busy=false;snapshot=client.getSnapshot();render();if(dialog.open&&!errorKey&&['signedIn','created','signedOut','deleted'].includes(messageKey))(snapshot.user?$('#accountClose'):$('#accountEmail')).focus();}
 }
 async function open(){
  previousFocus=document.activeElement;messageKey='';errorKey='';render();dialog.showModal();
  if(snapshot.enabled)await perform(()=>client.prepare(),'ready');
  if(dialog.open)(snapshot.enabled&&!snapshot.user?$('#accountEmail'):$('#accountClose')).focus();
 }
 function close(){dialog.close();}
 button.addEventListener('click',open);$('#accountClose').addEventListener('click',close);
 const onClose=()=>{showPassword=false;deleteConfirm=false;$('#accountPassword').value='';render();previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});};
 dialog.addEventListener('close',onClose);
 dialog.addEventListener('keydown',event=>{
  // Lab/reader shortcuts must not act on the background while this dialog is open.
  event.stopPropagation();
  if(event.key!=='Tab')return;
  const targets=[...dialog.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(node=>!node.disabled&&node.getClientRects().length);
  if(!targets.length){event.preventDefault();return;}
  const index=targets.indexOf(document.activeElement);
  if(event.shiftKey&&index<=0||!event.shiftKey&&(index<0||index===targets.length-1)){
   event.preventDefault();targets[event.shiftKey?targets.length-1:0].focus();
  }
 });
 dialog.addEventListener('click',event=>{
  const next=event.target.closest('[data-account-mode]');if(!next||busy)return;
  mode=next.dataset.accountMode;messageKey='';errorKey='';showPassword=false;$('#accountPassword').value='';render();$('#accountEmail').focus();
 });
 $('#accountShowPassword').addEventListener('click',()=>{showPassword=!showPassword;render();});
 $('#accountForm').addEventListener('submit',event=>{
  event.preventDefault();if(!snapshot.enabled||busy||!$('#accountForm').reportValidity())return;
  const email=$('#accountEmail').value.trim(),password=$('#accountPassword').value,remember=$('#accountRemember').checked;
  if(mode==='reset')void perform(()=>client.resetPassword({email}),'resetSent');
  else if(mode==='signup')void perform(()=>client.signUp({email,password,remember}),'created');
  else void perform(()=>client.signIn({email,password,remember}),'signedIn');
 });
 $('#accountGoogle').addEventListener('click',()=>{if(snapshot.enabled)void perform(()=>client.signInWithGoogle({remember:$('#accountRemember').checked}),'signedIn');});
 $('#accountSignOut').addEventListener('click',()=>void perform(()=>client.signOut(),'signedOut'));
 $('#accountDelete').addEventListener('click',()=>{deleteConfirm=true;render();$('#accountDeleteCancel').focus();});
 $('#accountDeleteCancel').addEventListener('click',()=>{deleteConfirm=false;render();$('#accountDelete').focus();});
 $('#accountDeleteConfirm').addEventListener('click',()=>void perform(()=>client.deleteAccount(),'deleted'));
 render();
 return {client,open,destroy(){unsubscribe();unsubscribeLocale();button.removeEventListener('click',open);dialog.remove();button.remove();}};
}
if(typeof document!=='undefined')globalThis.quanhAccountUI=installAccountUI();
