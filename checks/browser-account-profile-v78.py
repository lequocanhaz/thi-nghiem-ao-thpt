"""Chromium account profile regression with a routed Firebase SDK fixture; no real OAuth/account calls."""
from playwright.sync_api import sync_playwright
import json
from pathlib import Path
SDK='''
export const browserSessionPersistence={},browserLocalPersistence={},browserPopupRedirectResolver={};
const apps=[],listeners=new Set();const auth={currentUser:JSON.parse(sessionStorage.getItem('qa-user')||'null')};
function emit(user){auth.currentUser=user;sessionStorage.setItem('qa-user',JSON.stringify(user));listeners.forEach(f=>f(user));}
const user={uid:'qa-user',displayName:'Quốc Anh',email:'learner@example.test',emailVerified:true,providerData:[{providerId:'google.com'}]};
export function getApps(){return apps}export function initializeApp(options,name){const app={options,name};apps.push(app);return app}
export function initializeAuth(){return auth}export function getAuth(){return auth}
export function onAuthStateChanged(a,fn){listeners.add(fn);queueMicrotask(()=>fn(auth.currentUser));return ()=>listeners.delete(fn)}
export async function setPersistence(){} export class GoogleAuthProvider{setCustomParameters(){}}
export async function signInWithPopup(){emit({...user});return {user:auth.currentUser}}
export async function signInWithEmailAndPassword(){return signInWithPopup()} export const createUserWithEmailAndPassword=signInWithEmailAndPassword;
export async function updateProfile(user,patch){if(window.qaFailSave){const e=Error('private');e.code='auth/network-request-failed';throw e}Object.assign(user,patch);emit(user)}
export async function signOut(){emit(null)}export async function deleteUser(){emit(null)}export async function sendPasswordResetEmail(){}
'''
OUT=Path('work/account-profile-v78');OUT.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width,path,dark in [(390,'/',False),(1280,'/',True),(390,'/books.html',True),(1280,'/books.html',False)]:
  context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
  context.add_init_script("localStorage.setItem('quanh-appearance-v1',"+json.dumps('dark' if dark else 'light')+")")
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.route('**/vendor/firebase-auth.js?*',lambda route:route.fulfill(body=SDK,content_type='application/javascript'))
  page.goto('http://127.0.0.1:4173'+path);page.wait_for_selector('#openAccount')
  page.wait_for_function("quanhAccountUI.client.getSnapshot().status==='ready'")
  page.evaluate("document.documentElement.dataset.appearance="+json.dumps('dark' if dark else 'light'))
  page.locator('#openAccount').click();page.wait_for_function("document.querySelector('#accountForm').getAttribute('aria-busy')==='false'")
  assert page.locator('.google-symbol').evaluate("e=>getComputedStyle(e).stroke")=='none'
  page.screenshot(path=str(OUT/f'signin-{width}-{path=="/"}.png'))
  page.locator('#accountGoogle').click();page.wait_for_selector('#accountMember',state='visible')
  assert page.locator('#accountName').inner_text()=='Quốc Anh'
  assert page.locator('#openAccount svg').get_attribute('hidden') is not None
  assert 'Hồ sơ' in page.locator('#openAccount').get_attribute('aria-label')
  page.locator('#accountDisplayName').fill('Anh học Vật lí');page.locator('#accountSave').click()
  page.wait_for_function("document.querySelector('#accountName').textContent==='Anh học Vật lí'")
  assert page.locator('#accountDisplayName').evaluate('e=>e===document.activeElement')
  page.evaluate('window.qaFailSave=true');page.locator('#accountDisplayName').fill('Not saved');page.locator('#accountSave').click();page.wait_for_selector('#accountError',state='visible')
  assert page.locator('#accountName').inner_text()=='Anh học Vật lí'
  page.evaluate('window.qaFailSave=false');page.locator('#accountClose').click();page.reload();page.wait_for_function("document.querySelector('#openAccount').classList.contains('is-signed-in')")
  page.locator('#openAccount').click();page.wait_for_function("document.querySelector('#accountProfileForm').getAttribute('aria-busy')==='false'")
  assert page.locator('#accountDisplayName').input_value()=='Anh học Vật lí'
  assert not page.locator('#accountDelete').is_visible()
  page.locator('#accountManage summary').focus();page.keyboard.press('Enter');assert page.locator('#accountDelete').is_visible()
  page.keyboard.press('Tab');assert page.locator('#accountDelete').evaluate('e=>e===document.activeElement')
  page.locator('#accountDelete').click();page.locator('#accountDeleteCancel').click()
  page.locator('#accountManage summary').click()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert page.locator('#accountDialog').evaluate('e=>e.scrollWidth<=e.clientWidth')
  page.screenshot(path=str(OUT/f'profile-{width}-{path=="/"}.png'))
  page.evaluate("async()=>{const {i18n}=await import('/i18n.js?v=54');i18n.setLocale('en-US')}");assert page.locator('#accountTitle').inner_text()=='Account profile'
  page.keyboard.press('Escape');assert page.locator('#openAccount').evaluate('e=>e===document.activeElement')
  page.locator('#openAccount').click();page.locator('#accountSignOut').click();page.wait_for_selector('#accountGuest',state='visible')
  assert not errors,errors
  results.append({'width':width,'path':path,'dark':dark,'pass':True});context.close()
 browser.close()
print(json.dumps(results))
