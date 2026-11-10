"""Focused UI spec regression: Chromium viewports, 2x-DPR reflow and optional computed text-size stress.
Uses synthetic Firebase/AI transport; no production account or AI calls.
Run local server on 4173, then this script. Reports retain failures for review.
"""
import argparse,ast,base64,json,os,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/ui-spec-v79');ap.add_argument('--baseline',action='store_true');ap.add_argument('--widths',nargs='+',type=int,default=[320,360,390,768,1024,1440]);ap.add_argument('--text-stress-only',action='store_true');ap.add_argument('--reflow-only',action='store_true');ap.add_argument('--screens',nargs='+',default=['library','lab','books','account','ai']);args=ap.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'browser':'Headless Chromium/SwiftShader','base':args.base,'baseline':args.baseline,'cases':[],'pageErrors':[],'limits':['Viewport/touch emulation is not physical Android/iPhone/Safari testing.','The 720x450 CSS-pixel, 2x-DPR case models the reflow of a 1440x900 screen at 200% zoom; this is not an actual browser-toolbar zoom action. Optional --text-stress-only additionally doubles direct text/control computed font sizes without double inheritance.','Firebase SDK and AI responses are routed synthetic fixtures; no real OAuth/Firebase writes or AI inference.','Sample lab Ohm, linked oscillator, and lens do not certify the entire catalog or scientific correctness.']}
module=ast.parse(Path('checks/browser-account-profile-v78.py').read_text())
sdk=next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SDK' for t in n.targets))
sdk=sdk.replace("emailVerified:true","photoURL:'https://lh3.googleusercontent.com/qa-profile.png',emailVerified:true")
pixel=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1cAAAAASUVORK5CYII=')
def verify(ok,why):
 if not ok:raise AssertionError(why)
def overflow(page,selector='html'):
 return page.locator(selector).evaluate('e=>({scroll:e.scrollWidth,client:e.clientWidth,width:innerWidth})')
def fit(page,selector='html'):
 r=overflow(page,selector);verify(r['scroll']<=r['client']+1,f'{selector} horizontal overflow: {r}')
def contained(page,selector):
 r=page.locator(selector).bounding_box();verify(r is not None,'Missing box: '+selector)
 viewport=page.viewport_size
 verify(r['x']>=-1 and r['x']+r['width']<=viewport['width']+1,f'{selector} escapes viewport horizontally: {r}')
 verify(r['y']>=-1 and r['y']+r['height']<=viewport['height']+1,f'{selector} escapes viewport vertically: {r}')
 return r
def header_overlap(page):
 boxes=[]
 for node in page.locator('.header nav>:is(a,button),.reading-header nav>:is(a,button)').all():
  if node.is_visible():boxes.append({'text':node.get_attribute('aria-label') or node.inner_text(),'box':node.bounding_box()})
 for i,a in enumerate(boxes):
  for b in boxes[i+1:]:
   x,y=a['box'],b['box']
   overlap=min(x['x']+x['width'],y['x']+y['width'])-max(x['x'],y['x'])>1 and min(x['y']+x['height'],y['y']+y['height'])-max(x['y'],y['y'])>1
   verify(not overlap,f'Header controls overlap: {a} {b}')
 return boxes
def targets(page,selectors):
 evidence=[]
 for selector in selectors:
  for loc in page.locator(selector).all():
   if not loc.is_visible():continue
   r=loc.bounding_box();evidence.append({'selector':selector,'w':r['width'],'h':r['height']});verify(r['width']>=43.5 and r['height']>=43.5,f'Touch target under 44px: {evidence[-1]}')
 return evidence
def ready(page):
 page.wait_for_selector('#openAccount')
 page.wait_for_function('window.quanhAccountUI?.client.getSnapshot().status==="ready"')
def shot(page,name):page.screenshot(path=str(out/(name+'.png')))
def case(page,name,fn):
 try:
  evidence=fn() or {};report['cases'].append({'name':name,'status':'PASS','evidence':evidence});print('PASS',name,flush=True)
 except Exception as e:
  report['cases'].append({'name':name,'status':'FAIL','error':str(e),'trace':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
 finally:
  try:shot(page,name)
  except:pass
  try:page.evaluate("document.querySelectorAll('dialog[open]').forEach(e=>e.close())")
  except:pass
  (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 for width,zoom in ([(720,2)] if args.text_stress_only or args.reflow_only else [(w,1) for w in args.widths]+([(720,2)] if 1440 in args.widths else [])):
  ctx=browser.new_context(viewport={'width':width,'height':450 if zoom==2 else 900},device_scale_factor=2 if zoom==2 else 1,is_mobile=False,has_touch=width<600,reduced_motion='reduce')
  ctx.add_init_script("localStorage.setItem('quanh-appearance-v1','light');localStorage.setItem('quanh.locale.v1','vi-VN')")
  page=ctx.new_page();page.set_default_timeout(20000)
  page.on('pageerror',lambda e:report['pageErrors'].append(str(e)))
  page.route('https://lh3.googleusercontent.com/qa-profile.png',lambda route:route.fulfill(body=pixel,content_type='image/png'))
  page.route('https://lh3.googleusercontent.com/fail.png',lambda route:route.abort())
  page.route('**/vendor/firebase-auth.js?*',lambda route:route.fulfill(body=sdk,content_type='application/javascript'))
  page.route('**/api/chat',lambda r:r.fulfill(content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps({'answer':'**Khảo sát định luật Ohm**\n\nGiữ điện trở không đổi và đọc số đo. Công thức: \\[I=\\frac{U}{R}\\].'})))
  def goto(path):
   page.goto(args.base+path,wait_until='networkidle');ready(page)
   if args.text_stress_only:
    page.evaluate('''()=>{
      const candidates=[...document.body.querySelectorAll('*')].filter(e=>!e.dataset.qaTextScaled&&e.namespaceURI==='http://www.w3.org/1999/xhtml'&&([...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())||e.matches('input,textarea,select')));
      const sizes=candidates.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)*2]);
      for(const [element,size] of sizes){element.style.fontSize=size+'px';element.dataset.qaTextScaled='true';}
    }''')
  prefix=f'{width}-'+('text200-2xdpr' if args.text_stress_only else 'reflow2xdpr' if zoom==2 else 'normal')
  if 'library' in args.screens:
   def library():
    goto('#library');page.locator('#cards .experiment-card').first.wait_for();fit(page);shot(page,'library-start-'+prefix)
    evidence={'header':header_overlap(page),'targets':targets(page,['#openAccount','#openAssistant','.header [data-action=settings]','#library [data-grade]']), 'cards':page.locator('#cards .experiment-card').count()}
    search=page.locator('#search');search.fill('zzzz-ui-spec-no-result');page.wait_for_selector('#cards .empty');fit(page)
    verify(page.locator('#resultCount').inner_text(),'No announced result count')
    page.locator('#cards [data-action=clear-filters]').click();page.locator('#cards .experiment-card').first.wait_for();verify(search.input_value()=='','Clear filters did not clear search')
    search.fill('dinh luat ohm');page.wait_for_function("document.querySelector('#cards')?.textContent.includes('Ohm')")
    verify(page.locator('#cards a[href="#lab/ohm"]').count()>0,'Unaccented search misses Ohm');page.locator('#library [data-action=clear-search]').click();fit(page)
    return evidence
   case(page,'library-'+prefix,library)
  if 'lab' in args.screens:
   def lab():
    goto('#lab/ohm');page.wait_for_selector('#visual canvas',timeout=60000);fit(page)
    page.locator('.stage-top').scroll_into_view_if_needed();shot(page,'lab-model-'+prefix)
    canvas=page.locator('.stage-viewport').bounding_box();verify(canvas['width']>200 and canvas['height']>180,'Simulation region collapsed')
    if width<621 and zoom==1:
     verify(page.locator('#controlsPanel').is_visible(),'Essential parameter panel starts hidden')
    evidence={'stage':canvas,'targets':targets(page,['#play','[data-action=record]','.workspace-toolbar>div>button'])}
    page.locator('[data-action=record]').first.click();page.wait_for_function("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows.length===1")
    before=page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows")
    if not page.locator('#researchPanel').is_visible():page.locator('.workspace-toolbar [data-action=toggle-dock]').click()
    page.locator('.work-tabs [data-panel=data]').click();page.locator('.work-tabs [data-panel=tasks]').click();page.locator('.work-tabs [data-panel=data]').click();fit(page)
    verify(page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows")==before,'Changing data tab lost recorded measurements')
    verify(page.locator('#controlsPanel [data-number]').count()>0,'No editable numerical parameters')
    if not args.baseline and width==390 and zoom==1:
     page.evaluate("window.qaReadouts=document.querySelector('.readouts');window.qaParams=[...document.querySelectorAll('#controlsPanel [data-number]')].map(e=>e.value)")
     for resized in [1440,390]:
      page.set_viewport_size({'width':resized,'height':900});page.wait_for_timeout(150)
      verify(page.locator('.readouts').evaluate('e=>e===window.qaReadouts'),'Resize replaced the readout node')
      verify(page.evaluate("[...document.querySelectorAll('#controlsPanel [data-number]')].map(e=>e.value).join('|')===window.qaParams.join('|')"),'Resize changed parameters')
      if resized==390:verify(page.evaluate("document.querySelector('.controls').nextElementSibling===window.qaReadouts"),'Mobile readouts do not follow parameters')
      else:verify(page.evaluate("window.qaReadouts.closest('.stage-shell')!==null"),'Desktop readouts left model')
     page.evaluate("document.querySelector('.stage-shell').requestFullscreen=undefined;document.querySelector('[data-action=fullscreen]').click()")
     page.wait_for_function("document.querySelector('.stage-shell').classList.contains('is-fullscreen')")
     verify(page.evaluate("window.qaReadouts.closest('.stage-shell')!==null"),'Fullscreen lost live readouts')
     page.keyboard.press('Escape');page.wait_for_function("document.querySelector('.controls').nextElementSibling===window.qaReadouts")
     verify(page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows")==before,'Resize/fullscreen changed measurements')
     page.evaluate("document.querySelector('[data-action=focus]').click()")
     verify(page.evaluate("document.querySelector('.lab').classList.contains('focus')&&window.qaReadouts.closest('.stage-shell')!==null"),'Focus view lost live readouts')
     page.keyboard.press('Escape');page.wait_for_function("document.querySelector('.controls').nextElementSibling===window.qaReadouts")
     evidence['sameReadoutsNodeAcrossResizeFullscreenAndFocus']=True
    return evidence
   case(page,'lab-'+prefix,lab)
  if 'samples' in args.screens:
   for sample in ['oscillation','lens']:
    def sample_lab(sample=sample):
     goto('#lab/'+sample);page.locator('.inquiry-workbook').wait_for(state='attached')
     page.locator('.shm-circle-svg' if sample=='oscillation' else '#visual canvas').first.wait_for(timeout=60000)
     fit(page);evidence={'parameterInputs':page.locator('#controlsPanel [data-number]').count(),'modes':[]}
     verify(evidence['parameterInputs']>0,'Sample lacks direct numerical parameter controls')
     for mode in ['2d','3d']:
      page.locator('[data-projection="'+mode+'"]').click();page.locator('#visual canvas').wait_for(timeout=60000);fit(page)
      evidence['modes'].append(mode)
     page.locator('.stage-top').scroll_into_view_if_needed()
     return evidence
    case(page,'sample-'+sample+'-'+prefix,sample_lab)
  if 'books' in args.screens:
   def books():
    goto('books.html?grade=10&page=4');page.locator('.paper-page').first.wait_for();fit(page)
    evidence={'header':header_overlap(page),'targets':targets(page,['#bookToolbar button','#openAccount','#openAssistant'])}
    next_page='6' if page.locator('#spreadMode').get_attribute('aria-pressed')=='true' else '5'
    page.locator('#bookStage').focus();page.keyboard.press('ArrowRight');page.wait_for_function("v=>document.querySelector('#bookPage').value===v",arg=next_page)
    # Locate the reader's native table of contents disclosure without guessing class names.
    toc=page.locator('#bookTocToggle,#toggleToc,[data-book-action=toc]').first
    if toc.count():toc.click();toc.click()
    else:verify(page.locator('#bookChapter option').count()>30,'Book chapter/lesson navigation missing')
    verify(page.locator('#bookPage').input_value()==next_page,'TOC interaction changed reading position');fit(page)
    if not args.baseline and width==390 and zoom==1:
     page.locator('#openAssistant').click();chat=page.locator('#aiAssistant');chat.wait_for(state='visible')
     verify(not chat.locator('textarea').evaluate('e=>e===document.activeElement'),'Books AI opened keyboard')
     verify(next_page in chat.locator('.ai-context').inner_text(),'Books AI lacks current page context')
     chat.locator('textarea').fill('Câu hỏi về sách');chat.locator('[data-ai=close]').click()
     page.locator('#bookNext').click();page.wait_for_function("v=>document.querySelector('#bookPage').value!==v",arg=next_page)
     current=page.locator('#bookPage').input_value();page.locator('#openAssistant').click()
     verify(current in chat.locator('.ai-context').inner_text(),'Books AI context did not follow page change')
     verify(chat.locator('textarea').input_value()=='Câu hỏi về sách','Book page change discarded the question draft')
     evidence['bookAIPageContextDraftNoKeyboard']=True
     chat.locator('[data-ai=close]').click()
    return evidence
   case(page,'books-'+prefix,books)
  if 'account' in args.screens:
   def account():
    goto('');page.locator('#openAccount').click();page.locator('#accountGoogle').wait_for(state='visible');fit(page,'#accountDialog');shot(page,'account-signin-'+prefix)
    verify(page.locator('.google-symbol').evaluate("e=>getComputedStyle(e).stroke")== 'none','Google logo inherited monochrome outline')
    page.locator('#accountGoogle').click();page.locator('#accountMember').wait_for(state='visible');fit(page,'#accountDialog');contained(page,'#accountDialog')
    evidence={'targets':targets(page,['#accountClose','#accountSave','#accountSignOut']), 'profile':page.locator('#accountName').inner_text()}
    verify('Quốc Anh' in evidence['profile'],'Signed-in profile missing authenticated name')
    if not args.baseline and width==390 and zoom==1:
     page.wait_for_function("!document.querySelector('#accountAvatar img').hidden && document.querySelector('#accountAvatar img').naturalWidth>0")
     page.evaluate("async()=>{const sdk=await import('/vendor/firebase-auth.js?v=78');await sdk.updateProfile(sdk.getAuth().currentUser,{photoURL:'https://lh3.googleusercontent.com/fail.png'})}")
     page.wait_for_function("document.querySelector('#accountAvatar img').hidden&&!document.querySelector('#accountAvatar .account-avatar-initial').hidden")
     page.evaluate("async()=>{const sdk=await import('/vendor/firebase-auth.js?v=78');await sdk.updateProfile(sdk.getAuth().currentUser,{photoURL:'javascript:alert(1)'})}")
     verify(page.locator('#accountAvatar img').get_attribute('src') is None,'Unsafe photo URL reached an image element')
     evidence['avatarSuccessErrorUnsafeURL']=True
    if args.text_stress_only:
     for _ in range(24):
      page.keyboard.press('Tab');verify(page.evaluate("document.activeElement.closest('#accountDialog')!==null"),'Text-stress modal keyboard focus escaped')
     contained(page,'#accountDialog')
    shot(page,'account-profile-'+prefix)
    page.keyboard.press('Escape');verify(page.locator('#openAccount').evaluate('e=>e===document.activeElement'),'Escape did not return account focus')
    return evidence
   case(page,'account-'+prefix,account)
  if 'ai' in args.screens:
   def ai():
    goto('#lab/ohm');page.wait_for_selector('#visual canvas',timeout=60000);page.locator('#openAssistant').click();chat=page.locator('#aiAssistant');chat.wait_for(state='visible');fit(page,'#aiAssistant');contained(page,'#aiAssistant')
    if width<621 and zoom==1:verify(not chat.locator('textarea').evaluate('e=>e===document.activeElement'),'Opening chat focused textarea and may summon keyboard')
    evidence={'targets':targets(page,['#aiAssistant [data-ai=close]','#aiAssistant button[type=submit]','#aiAssistant [data-ai=attach]'])}
    chat.locator('textarea').fill('Giữ câu hỏi nháp của tôi');chat.locator('[data-ai=close]').click();page.locator('#openAssistant').click();verify(chat.locator('textarea').input_value()=='Giữ câu hỏi nháp của tôi','Closing chat lost draft')
    return evidence
   case(page,'ai-'+prefix,ai)
  ctx.close()
 browser.close()
report['passed']=all(c['status']=='PASS' for c in report['cases']) and not report['pageErrors'];(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'passed':report['passed'],'cases':len(report['cases']),'failed':[c['name'] for c in report['cases'] if c['status']=='FAIL'],'pageErrors':report['pageErrors']},ensure_ascii=False));raise SystemExit(0 if report['passed'] else 1)
