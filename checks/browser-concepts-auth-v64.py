"""Quanh Lab v64: actual scene observation, interaction and account UI fixtures.

Serve dist on HTTP first. Requires Python Playwright and Chromium. Authentication
uses an injected client fixture: no real email, Firebase account or Google OAuth
is created. Chromium viewports are simulated, not physical mobile/Safari tests.
"""
import argparse
import json
import os
import re
import time
import traceback
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base',default='http://127.0.0.1:4173/')
parser.add_argument('--out',default='work/concepts-auth-v64')
parser.add_argument('--chromium',default=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'))
parser.add_argument('--only',default='',help='Optional regex selecting scenario names')
parser.add_argument('--ids',default='',help='Optional comma-separated model IDs')
parser.add_argument('--model-widths',default='390,1440')
args=parser.parse_args()
BASE=args.base.rstrip('/')+'/'
OUT=Path(args.out);OUT.mkdir(parents=True,exist_ok=True)
REPORT={'scope':'Headless Chromium/SwiftShader, actual LabScene meshes and isolated account UI fixtures','tests':[],'pageErrors':[],'httpErrors':[],'externalRequests':[],'limits':['No real Google OAuth, Firebase project, account creation, reset email or cloud data sync was tested by the UI fixture.','No physical iPhone/Android/iOS Safari or virtual keyboard test.','Scene metadata and numerical references have bounded coverage; this is not independent expert certification of all scientific models.']}


def verify(ok,message):
    if not ok:raise AssertionError(message)


def run(name,fn):
    if args.only and not re.search(args.only,name):return
    start=time.monotonic()
    try:
        REPORT['tests'].append({'name':name,'status':'PASS','evidence':fn(),'durationMs':round((time.monotonic()-start)*1000)})
        print('PASS',name,flush=True)
    except Exception as error:
        REPORT['tests'].append({'name':name,'status':'FAIL','error':str(error),'traceback':traceback.format_exc()})
        print('FAIL',name,str(error),flush=True)
    (OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2))


def context(browser,width=1440):
    ctx=browser.new_context(viewport={'width':width,'height':900 if width>=768 else 844},has_touch=width<768,is_mobile=width<768,service_workers='block')
    def guard(route):
        if urlsplit(route.request.url).netloc==urlsplit(BASE).netloc:route.continue_()
        else:
            REPORT['externalRequests'].append(route.request.url);route.abort('blockedbyclient')
    ctx.route('**/*',guard)
    ctx.on('page',lambda page:page.on('pageerror',lambda error:REPORT['pageErrors'].append(str(error))))
    ctx.on('response',lambda response:REPORT['httpErrors'].append({'url':response.url,'status':response.status}) if response.status>=400 and urlsplit(response.url).netloc==urlsplit(BASE).netloc else None)
    return ctx


def goto_lab(page,name='energy'):
    page.goto(BASE+'#lab/'+name);page.wait_for_load_state('networkidle');page.wait_for_selector('#visual canvas',timeout=30000)


def saved(page,name='energy'):
    return page.evaluate("id=>{const s=JSON.parse(localStorage.getItem('thpt-lab-v1'))?.[id]||{};return {state:s.state,rows:s.rows,notes:s.notes,prediction:s.prediction}}",name)


def locale(page,name):
    page.locator('[data-locale="'+name+'"]').click();page.wait_for_timeout(100)


def layout(page):
    result=page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,height:innerHeight})')
    verify(result['scroll']<=result['width']+2,'Horizontal document overflow: '+json.dumps(result))
    return result


def capture_viewer(page):
    # Capture the live instance through a public method and restore its prototype.
    # This adds no production hook and does not substitute a model/renderer.
    page.evaluate(r"""async()=>{const url=performance.getEntriesByType('resource').find(e=>/\/scene3d\.js(?:\?|$)/.test(e.name)).name;const{LabScene}=await import(url);const zoom=LabScene.prototype.zoom;LabScene.prototype.zoom=function(...args){window.__qaViewer=this;LabScene.prototype.zoom=zoom;return zoom.apply(this,args);};}""")
    page.locator('[data-action="zoom-in"]').click();page.wait_for_function('!!window.__qaViewer?.model')
    page.locator('[data-action="fit-view"]').click();page.wait_for_timeout(80)


def camera(page):
    return page.evaluate('''()=>{const v=window.__qaViewer;return {position:v.camera.position.toArray(),quaternion:v.camera.quaternion.toArray(),target:v.controls.target.toArray(),zoom:v.camera.zoom,autoFrame:v.autoFrame}}''')


def camera_equal(a,b,tolerance=1e-6):
    for key in ['position','quaternion','target']:
        if any(abs(x-y)>tolerance for x,y in zip(a[key],b[key])):return False
    return abs(a['zoom']-b['zoom'])<=tolerance and a['autoFrame']==b['autoFrame']


def scene(page):
    return page.evaluate('''()=>{const v=window.__qaViewer,g=v.model.group;g.updateMatrixWorld(true);const result={id:v.id,visibleMeshes:0,visibleLines:0,geometryValues:0,nonFinite:[],names:[],labels:[],concepts:[],fingerprint:0};let hash=2166136261;const mix=x=>{const q=Math.round(x*1e5);hash=Math.imul(hash^(q|0),16777619)>>>0};g.traverse(o=>{const visible=(()=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true})();if(o.name)result.names.push(o.name);if(o.userData.modelLabel&&visible&&o.userData.text)result.labels.push(o.userData.text);if(o.userData.conceptVersion||o.userData.concept||o.userData.conceptId||o.userData.foundationConcept)result.concepts.push({name:o.name,version:o.userData.conceptVersion,id:o.userData.conceptId,concept:o.userData.concept,foundation:o.userData.foundationConcept,axes:o.userData.axes,current:o.userData.current});if(visible){if(o.isMesh)result.visibleMeshes++;if(o.isLine)result.visibleLines++;for(const n of [...o.position.toArray(),...o.scale.toArray(),...o.quaternion.toArray()]){if(!Number.isFinite(n))result.nonFinite.push(o.name||o.type);mix(n);}for(const n of o.geometry?.attributes?.position?.array||[]){result.geometryValues++;if(!Number.isFinite(n))result.nonFinite.push(o.name||o.type);mix(n);}for(const n of o.isInstancedMesh?o.instanceMatrix.array:[])if(!Number.isFinite(n))result.nonFinite.push(o.name||o.type);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.color){mix(m.color.r);mix(m.color.g);mix(m.color.b);}for(const ch of o.userData.text||'')mix(ch.charCodeAt(0));}});result.fingerprint=hash;return result;}''')


def verify_scene(result,expected):
    verify(result['id']==expected,'Wrong actual scene mounted')
    verify(not result['nonFinite'],'Non-finite rendered geometry: '+json.dumps(result['nonFinite'][:8]))
    verify(result['visibleMeshes']>=2 and result['geometryValues']>0,'Apparatus is empty')
    verify(result['concepts'],'No pedagogical observation layer in '+expected)
    if any(c.get('id')==expected for c in result['concepts']):
        verify(result['concepts'],'Observation metadata is missing')


AUTH_MOCK=r"""async({enabled=true,holdPrepare=false}={})=>{
 const url=performance.getEntriesByType('resource').find(e=>/\/account-ui\.js(?:\?|$)/.test(e.name)).name;
 const{installAccountUI}=await import(url);globalThis.quanhAccountUI?.destroy();
 let snapshot={enabled,status:enabled?'idle':'disabled',user:null,errorCode:enabled?null:'auth/not-configured',operation:null};
 const listeners=new Set(),plans=new Map(),pending=new Map(),calls=[];
 const emit=patch=>{snapshot={...snapshot,...patch};for(const fn of listeners)fn({...snapshot});};
 const profile=provider=>({uid:'qa-fixture-'+provider,email:'qa@example.invalid',displayName:'QA <img src=x onerror=globalThis.__qaAuthXss=1>',emailVerified:provider==='google.com',providerIds:[provider]});
 async function op(method,payload={}){calls.push({method,email:payload.email,remember:payload.remember,passwordLength:payload.password?.length});const plan=plans.get(method)||{};plans.delete(method);emit({status:method==='prepare'?'loading':'busy',operation:method,errorCode:null});if(plan.hold)await new Promise(resolve=>pending.set(method,resolve));if(plan.error){emit({status:'error',operation:null,errorCode:plan.error});const error=Error('PRIVATE_PROVIDER_DIAGNOSTIC_do_not_show');error.code=plan.error;throw error;}let user=snapshot.user;if(['signIn','signUp'].includes(method))user=profile('password');if(method==='google')user=profile('google.com');if(['signOut','deleteAccount'].includes(method))user=null;emit({status:'ready',operation:null,user,errorCode:null});return user;}
 const client={getSnapshot:()=>({...snapshot}),subscribe:fn=>{listeners.add(fn);fn({...snapshot});return()=>listeners.delete(fn)},prepare:()=>op('prepare'),start:()=>op('prepare'),signIn:p=>op('signIn',p),signUp:p=>op('signUp',p),resetPassword:p=>op('resetPassword',p),signInWithGoogle:p=>op('google',p),signOut:()=>op('signOut'),deleteAccount:()=>op('deleteAccount')};
 if(holdPrepare)plans.set('prepare',{hold:true});
 globalThis.__qaAuth={calls,plan:(method,plan)=>plans.set(method,plan),release:method=>{pending.get(method)?.();pending.delete(method);},snapshot:()=>({...snapshot}),emit};
 globalThis.quanhAccountUI=installAccountUI({client});return{installed:!!globalThis.quanhAccountUI};
}"""


def auth_fixture(page,enabled=True,hold_prepare=False):
    page.wait_for_selector('#openAccount',timeout=20000)
    result=page.evaluate(AUTH_MOCK,{'enabled':enabled,'holdPrepare':hold_prepare})
    verify(result['installed'],'Could not install isolated account fixture')


def auth_open(page):
    page.locator('#openAccount').click();page.wait_for_selector('#accountDialog[open]')
    page.wait_for_function("document.querySelector('#accountForm').getAttribute('aria-busy')==='false'")


def auth_submit(page,email='qa@example.invalid',password='Only-QA-1234!'):
    page.locator('#accountEmail').fill(email)
    if page.locator('#accountPassword').is_visible():page.locator('#accountPassword').fill(password)
    page.locator('#accountSubmit').click()


def auth_idle(page):
    page.wait_for_function("document.querySelector('#accountForm').getAttribute('aria-busy')==='false'")


def preserve(page,before):
    verify(saved(page)==before,'Account action changed experiment parameters, measurements or notes')


with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 # Catalog is read from the same actual module loaded by this browser page.
 for width in [int(x) for x in args.model_widths.split(',')]:
  ctx=context(browser,width);page=ctx.new_page()
  try:
   if not args.only or re.search(args.only,'model rendering') or args.ids:
    goto_lab(page);capture_viewer(page)
    catalog=page.evaluate(r"""async()=>{const url=performance.getEntriesByType('resource').find(e=>/\/experiments\.js(?:\?|$)/.test(e.name)).name;const{experiments}=await import(url);const ids=new Set(experiments.slice(0,60).map(e=>e.id));return experiments.filter(e=>ids.has(e.id)||!e.extra).map(e=>({id:e.id,time:e.params.some(p=>p.key==='t')}));}""")
    if args.ids:catalog=[e for e in catalog if e['id'] in args.ids.split(',')]
    else:verify(len(catalog)==121,'Expected 121 simple/core experiments')
    for item in catalog:
     def model_case(item=item,width=width):
      name=item['id'];page.evaluate('id=>location.hash="lab/"+id',name);page.wait_for_function('id=>window.__qaViewer?.id===id',arg=name,timeout=20000)
      page.locator('[data-action="fit-view"]').click();page.wait_for_timeout(40)
      initial=scene(page);verify_scene(initial,name)
      if name not in ['energy','oscillation','wave','electric','uniform','acceleration','newton','horizontal','projectile','incline','collision','circular','lever','hooke','pendulum','damped','resonance','interference','standing','sound','series','parallel','joule','magnetic','induction','decay']:
       verify(page.locator('#conceptObservation').is_visible(),'Readable relation panel missing: '+name)
       verify(page.locator('#conceptObservation svg title').text_content(),'Observation chart lacks an accessible title')
      endpoint=None
      control=page.locator('#time')
      if item['time'] and control.is_visible() and control.is_enabled():
       control.focus();control.press('End');page.wait_for_timeout(50);endpoint=scene(page);verify_scene(endpoint,name)
      if name in ['energy','wave','electric','ohm','projectile','collision','lever','reflection','lens','phasechange','vector_sum','atwood','capacitor_plate','charge_sharing','sliding_rod']:
       page.locator('#visual canvas').screenshot(path=str(OUT/f'{width}-{name}-scene.png'))
      layout(page)
      return{'initial':initial,'endpoint':endpoint,'timeEndpointApplicable':endpoint is not None}
     run(f'model rendering {item["id"]} {width}px: actual concepts, default and time endpoint finite',model_case)
  finally:ctx.close()

 for width in [390,1440]:
  def interaction(width=width):
   ctx=context(browser,width);page=ctx.new_page();evidence=[]
   try:
    goto_lab(page,'energy');capture_viewer(page)
    for name in ['energy','wave','electric','ohm','collision','lever','reflection','phasechange','vector_sum','atwood','capacitor_plate','sliding_rod']:
     page.evaluate('id=>location.hash="lab/"+id',name);page.wait_for_function('id=>window.__qaViewer?.id===id',arg=name)
     page.locator('[data-mode="measure"]').click();page.locator('.work-tabs [data-panel="data"]').click()
     field=page.locator('.controls [data-number]').first;old=float(field.input_value());step=float(field.get_attribute('step') or 1);maximum=float(field.get_attribute('max'));value=old+step if old+step<=maximum else old-step
     before_model=scene(page);field.fill(str(value));field.press('Tab');page.wait_for_timeout(80);changed=scene(page)
     verify(before_model['fingerprint']!=changed['fingerprint'],'Changing a physical parameter has no observable scene effect in '+name)
     page.locator('[data-action="record"]').first.click();before=saved(page,name);verify(len(before['rows'])>=1,'Record did not save data in '+name)
     for language in ['en-US','vi-VN']:
      locale(page,language);verify(saved(page,name)==before,'Locale changed physical state in '+name)
     page.locator('[data-action="zoom-in"]').click();page.wait_for_timeout(100);manual=camera(page);verify(manual['autoFrame'] is False,'Manual zoom did not disable automatic refit')
     for projection in ['2d','3d']:
      page.locator('[data-projection="'+projection+'"]').click();verify(saved(page,name)==before,'Projection changed physical state or rows in '+name)
     verify(camera_equal(camera(page),manual),'2D/3D roundtrip lost manual 3D camera in '+name)
     play=page.locator('[data-action="play"]');play.click();page.wait_for_timeout(250)
     if page.locator('#runStatus').inner_text() not in ['Sẵn sàng','Ready','Đã kết thúc','Finished']:play.click()
     page.wait_for_timeout(80);verify(camera_equal(camera(page),manual),'Play/pause reset manual camera in '+name)
     evidence.append({'id':name,'parameterChangedScene':True,'recordedRows':len(before['rows']),'localeProjectionPreserveState':True,'manualCameraPreserved':True})
    return evidence
   finally:ctx.close()
  run(f'model interaction {width}px: parameter observation, recording, locale, 2D/3D, play/pause and camera',interaction)

 for width in [320,375,390,414,430,768,1024,1440,1920]:
  def headers(width=width):
   ctx=context(browser,width);page=ctx.new_page();evidence=[]
   try:
    for path in ['', 'books.html']:
     page.goto(BASE+path);page.wait_for_load_state('networkidle');page.wait_for_selector('#openAccount')
     for language in ['vi-VN','en-US']:
      locale(page,language);item=layout(page);button=page.locator('#openAccount').bounding_box();verify(button['width']>=43 and button['height']>=43,'Account touch target is too small');evidence.append({'path':path,'locale':language,**item})
    return evidence
   finally:ctx.close()
  run(f'account header {width}px: home and textbooks, VI/EN, touch target and no overflow',headers)

 for width in [320,390,1440]:
  def auth_flows(width=width):
   ctx=context(browser,width);page=ctx.new_page()
   try:
    goto_lab(page);page.wait_for_selector('#openAccount');page.locator('[data-mode="measure"]').click();page.locator('.work-tabs [data-panel="tasks"]').click();page.locator('#notes').fill('QA v64: preserve this local laboratory notebook.');page.locator('.work-tabs [data-panel="data"]').click();page.locator('[data-action="record"]').first.click();before=saved(page)
    auth_fixture(page);auth_open(page)
    verify(page.locator('#accountEmail').evaluate('e=>e===document.activeElement'),'Account open did not focus email')
    dialog=page.locator('#accountDialog').bounding_box();verify(dialog['x']>=0 and dialog['x']+dialog['width']<=width+1,'Account dialog escapes viewport');verify(dialog['height']<=page.viewport_size['height'],'Account dialog cannot fit viewport')
    # Native validation must stop an invalid email before any provider call.
    page.locator('#accountEmail').fill('invalid-email');page.locator('#accountPassword').fill('Only-QA-1234!');page.locator('#accountSubmit').click();verify(page.evaluate('__qaAuth.calls.filter(c=>c.method==="signIn").length')==0,'Invalid email reached authentication client')
    page.evaluate('__qaAuth.plan("signIn",{hold:true})');auth_submit(page);page.wait_for_function('__qaAuth.snapshot().status==="busy"');verify(page.locator('#accountSubmit').is_disabled(),'Pending sign-in did not disable submit');page.locator('#accountForm').evaluate('e=>e.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))');verify(page.evaluate('__qaAuth.calls.filter(c=>c.method==="signIn").length')==1,'Pending operation submitted twice');page.evaluate('__qaAuth.release("signIn")');auth_idle(page);page.wait_for_selector('#accountSignOut',state='visible');preserve(page,before)
    verify(page.locator('#accountName img').count()==0 and not page.evaluate('!!globalThis.__qaAuthXss'),'Profile display name was interpreted as HTML')
    page.locator('#accountSignOut').click();auth_idle(page);preserve(page,before)
    page.locator('[data-account-mode="signup"]').click();verify(page.locator('#accountPassword').get_attribute('autocomplete')=='new-password','Signup uses wrong password autocomplete');auth_submit(page);auth_idle(page);page.wait_for_selector('#accountSignOut',state='visible');page.locator('#accountSignOut').click();auth_idle(page)
    page.locator('[data-account-mode="reset"]').click();verify(not page.locator('#accountPassword').is_visible(),'Password reset still requires password');auth_submit(page);auth_idle(page);verify(page.locator('#accountStatus').inner_text(),'Reset has no feedback');preserve(page,before)
    page.locator('#accountBack').click();page.evaluate('__qaAuth.plan("signIn",{error:"auth/invalid-credential"})');auth_submit(page);auth_idle(page);verify(page.locator('#accountError').is_visible(),'Failed login has no inline error');verify('PRIVATE_PROVIDER' not in page.locator('#accountError').inner_text(),'Raw provider error leaked into UI')
    page.evaluate('__qaAuth.plan("google",{error:"auth/popup-blocked"})');page.locator('#accountGoogle').click();auth_idle(page);verify(page.locator('#accountError').is_visible(),'Blocked Google popup has no feedback')
    page.locator('#accountGoogle').click();auth_idle(page);page.wait_for_selector('#accountSignOut',state='visible');verify('Google' in page.locator('#accountProvider').inner_text(),'Google fixture profile lacks provider identity');preserve(page,before)
    page.locator('#accountDelete').click();verify(page.locator('#accountDeleteCancel').evaluate('e=>e===document.activeElement'),'Delete confirmation does not default focus to cancel');page.locator('#accountDeleteCancel').click();verify(not page.locator('#accountDeletePanel').is_visible(),'Cancel did not dismiss account deletion');verify(page.evaluate('__qaAuth.calls.filter(c=>c.method==="deleteAccount").length')==0,'Cancel still deleted account');preserve(page,before)
    page.locator('#accountDelete').click();page.locator('#accountDeleteConfirm').click();auth_idle(page);verify(page.evaluate('__qaAuth.snapshot().user') is None,'Delete confirmation did not invoke account removal fixture');preserve(page,before)
    page.locator('#accountClose').click();verify(page.locator('#openAccount').evaluate('e=>e===document.activeElement'),'Account close failed to return focus')
    # Language roundtrip while closed must localize the next dialog without changing laboratory data.
    locale(page,'en-US');auth_open(page);verify('Welcome' in page.locator('#accountTitle').inner_text(),'Account dialog did not switch to English');page.keyboard.press('Escape');page.wait_for_function('!document.querySelector("#accountDialog").open');preserve(page,before)
    page.screenshot(path=str(OUT/f'auth-lab-{width}.png'))
    return{'width':width,'validation':True,'pendingDuplicatePrevention':True,'signInSignUpResetGoogleErrorSignOutDelete':True,'profileEscaped':True,'localSessionPreserved':True,'focusAndEscape':True,'calls':page.evaluate('__qaAuth.calls')}
   finally:ctx.close()
  run(f'auth fixture {width}px: validation, pending, email/signup/reset/Google/error/logout/delete, focus and lab data',auth_flows)

 def auth_disabled_loading():
  ctx=context(browser,390);page=ctx.new_page()
  try:
   goto_lab(page);auth_fixture(page,enabled=False);page.locator('#openAccount').click();verify(page.locator('#accountSubmit').is_disabled() and page.locator('#accountGoogle').is_disabled(),'Unconfigured auth exposes active provider actions');verify(page.locator('#accountStatus').inner_text(),'Unconfigured auth has no explanation');page.locator('#accountClose').click()
   auth_fixture(page,hold_prepare=True);page.locator('#openAccount').click();page.wait_for_function('__qaAuth.snapshot().status==="loading"');verify(page.locator('#accountSubmit').is_disabled(),'SDK initialization did not disable submit');verify(page.locator('#accountStatus').inner_text(),'SDK initialization has no progress feedback');page.evaluate('__qaAuth.release("prepare")');auth_idle(page)
   for _ in range(12):
    page.keyboard.press('Tab');verify(page.evaluate('document.activeElement.closest("#accountDialog")!==null'),'Keyboard focus escaped native account dialog')
   page.set_viewport_size({'width':390,'height':480});verify(page.locator('#accountDialog').bounding_box()['height']<=480,'Small visual viewport clips account modal');page.keyboard.press('Escape');page.wait_for_function('!document.querySelector("#accountDialog").open');verify(page.locator('#openAccount').evaluate('e=>e===document.activeElement'),'Escape failed to restore opener focus')
   return{'configMissing':True,'lazyInitializationPending':True,'focusContained':True,'shortViewport':True,'escapeFocus':True}
  finally:ctx.close()
 run('auth fixture disabled/loading: truthful missing config, pending feedback, keyboard and short viewport',auth_disabled_loading)
 browser.close()

run('no uncaught JavaScript errors or unexpected HTTP/external requests',lambda:(verify(not REPORT['pageErrors'] and not REPORT['httpErrors'] and not REPORT['externalRequests'],json.dumps({'pageErrors':REPORT['pageErrors'],'httpErrors':REPORT['httpErrors'],'externalRequests':REPORT['externalRequests']})) or {'pageErrors':[],'httpErrors':[],'externalRequests':[]}))
failed=[t for t in REPORT['tests'] if t['status']=='FAIL'];print(json.dumps({'passed':len(REPORT['tests'])-len(failed),'failed':len(failed),'report':str(OUT/'report.json')}));raise SystemExit(1 if failed else 0)
