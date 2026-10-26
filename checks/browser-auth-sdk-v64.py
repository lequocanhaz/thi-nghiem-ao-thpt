"""Actual bundled Firebase SDK against intercepted Auth REST responses, no live accounts."""
import base64,json,time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
OUT=Path('work/auth-sdk');OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4173/'
enc=lambda value:base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
now=int(time.time());email='learner@example.test';uid='sdk-fixture-account'
token=enc({'alg':'none','typ':'JWT'})+'.'+enc({'iss':'https://securetoken.google.com/quanh-fixture','aud':'quanh-fixture','auth_time':now,'user_id':uid,'sub':uid,'iat':now,'exp':now+3600,'email':email,'email_verified':False,'firebase':{'identities':{'email':[email]},'sign_in_provider':'password'}})+'.fixture'
config={'enabled':True,'firebase':{'apiKey':'AIza'+'A'*35,'authDomain':'quanh-fixture.firebaseapp.com','projectId':'quanh-fixture','appId':'1:123456789:web:abcdef123456789'}}
report={'scope':'Chromium actual locally bundled Firebase 13.1.0; mocked Firebase REST only','tests':[],'requests':[],'pageErrors':[],'blocked':[],'limits':['No real Firebase project or account; no real passwords; no Google OAuth.','No physical device or Safari verification.']}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();page.on('pageerror',lambda err:report['pageErrors'].append(str(err)))
 def guard(route):
  url=route.request.url;parsed=urlparse(url)
  if url==BASE+'auth-fixture':route.fulfill(content_type='text/html',body='<html lang="en-US"><head><meta charset="utf-8"></head><body>Authentication SDK fixture</body></html>');return
  if url.startswith(BASE):route.continue_();return
  if parsed.hostname in ['identitytoolkit.googleapis.com','securetoken.googleapis.com']:
   headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'*'}
   if route.request.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
   report['requests'].append({'method':route.request.method,'path':parsed.path})
   if parsed.path.endswith('accounts:lookup'):
    payload={'users':[{'localId':uid,'email':email,'emailVerified':False,'providerUserInfo':[{'providerId':'password','email':email,'federatedId':email}],'createdAt':str(now*1000),'lastLoginAt':str(now*1000)}]}
   elif parsed.path.endswith(('accounts:signUp','accounts:signInWithPassword')):
    payload={'idToken':token,'refreshToken':'mock-refresh-token','expiresIn':'3600','localId':uid,'email':email,'isNewUser':parsed.path.endswith('accounts:signUp')}
   elif parsed.path.endswith('accounts:sendOobCode'):payload={'email':email}
   elif parsed.path.endswith('recaptchaConfig'):payload={}
   elif parsed.path.endswith('passwordPolicy'):payload={'customStrengthOptions':{'minPasswordLength':6},'enforcementState':'OFF'}
   elif parsed.path.endswith('accounts:delete'):payload={}
   elif parsed.path.endswith('/token'):payload={'id_token':token,'refresh_token':'mock-refresh-token','expires_in':'3600','user_id':uid,'project_id':'123456789'}
   else:raise AssertionError('Unhandled fixture endpoint '+parsed.path)
   route.fulfill(status=200,headers=headers,content_type='application/json',body=json.dumps(payload));return
  report['blocked'].append(parsed.hostname);route.abort()
 page.route('**/*',guard);page.goto(BASE+'auth-fixture',wait_until='networkidle')
 def create():
  page.evaluate("""async config=>{const {createAuthClient}=await import('./auth-client.js?v=64');window.fixtureAuth=createAuthClient({config});} """,config)
 create();assert not report['requests']
 page.evaluate('async()=>{await fixtureAuth.prepare()}');assert not report['requests'];assert page.evaluate('fixtureAuth.getSnapshot().status')=='ready'
 report['tests'].append({'name':'Actual SDK prepares SESSION without Firebase REST or Google requests','status':'PASS'})
 page.evaluate("async()=>{await fixtureAuth.signUp({email:'learner@example.test',password:'fixture-password-only',remember:false})}")
 assert page.evaluate('fixtureAuth.getSnapshot().user.emailVerified') is False
 assert page.evaluate("Object.keys(sessionStorage).some(key=>key.startsWith('firebase:authUser:'))")
 assert not page.evaluate("Object.keys(localStorage).some(key=>key.startsWith('firebase:authUser:'))")
 report['tests'].append({'name':'Actual SDK email signup not marked verified; sessionStorage persistence','status':'PASS'})
 page.evaluate('async()=>{await fixtureAuth.signOut()}');assert page.evaluate('fixtureAuth.getSnapshot().user') is None
 page.evaluate("async()=>{await fixtureAuth.signIn({email:'learner@example.test',password:'fixture-password-only',remember:true})}")
 assert page.evaluate("localStorage.getItem('quanh.auth.persistence.v1')")=='local'
 assert page.evaluate("Object.keys(localStorage).some(key=>key.startsWith('firebase:authUser:'))")
 report['tests'].append({'name':'Explicit remember uses Firebase LOCAL and own opt-in flag','status':'PASS'})
 page.reload(wait_until='networkidle');create();page.evaluate('async()=>{await fixtureAuth.prepare()}');assert page.evaluate('fixtureAuth.getSnapshot().user.uid')==uid
 report['tests'].append({'name':'Actual SDK restores remembered account after page reload','status':'PASS'})
 page.evaluate("async()=>{await fixtureAuth.resetPassword({email:'learner@example.test'})}")
 page.evaluate('async()=>{await fixtureAuth.deleteAccount()}');assert page.evaluate('fixtureAuth.getSnapshot().user') is None
 assert page.evaluate("localStorage.getItem('quanh.auth.persistence.v1')") is None
 report['tests'].append({'name':'Actual SDK password-reset and account deletion REST flows complete','status':'PASS'})
 context.close();browser.close()
assert not report['pageErrors'],report['pageErrors'];assert not report['blocked'],report['blocked']
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
