"""Quanh Lab shared-header regression and visual inventory, Chromium only.
Firebase is a routed SDK fixture; no real account or AI provider requests.
The 720x450/DPR2 case models reflow, not a browser-toolbar zoom action.
"""
import argparse,ast,json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base',default='http://127.0.0.1:4173/');parser.add_argument('--out',default='work/visual-v80/after');parser.add_argument('--widths',nargs='+',type=int,default=[320,360,390,768,1024,1440]);parser.add_argument('--themes',nargs='+',default=['light','dark']);parser.add_argument('--locales',nargs='+',default=['vi-VN','en-US']);parser.add_argument('--deep-only',action='store_true');parser.add_argument('--matrix-only',action='store_true');parser.add_argument('--lab-only',action='store_true');args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'browser':'Headless Chromium','base':args.base,'cases':[],'pageErrors':[],'limits':['Viewport/touch emulation is not physical iPhone/Safari/Android verification.','720x450CSSpx/DPR2 models 1440x900 at200% reflow, not actual browser-toolbar zoom.','Firebase SDK fixture only; no real OAuth/account writes, AI inference, or scientific-model verification.']}
module=ast.parse(Path('checks/browser-account-profile-v78.py').read_text())
sdk=next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SDK' for t in n.targets))
identity_script='''(()=>{
 const selectors=['header [data-action="guide"]','header [data-action="settings"]','#appearanceToggle','#openAccount','header [data-locale="vi-VN"]','header [data-locale="en-US"]'];
 window.qaOriginalNodes={};window.qaOriginalClicks={};
 new MutationObserver(()=>{for(const selector of selectors){const node=document.querySelector(selector);if(node&&!window.qaOriginalNodes[selector]){window.qaOriginalNodes[selector]=node;window.qaOriginalClicks[selector]=0;node.addEventListener('click',()=>window.qaOriginalClicks[selector]++);}}}).observe(document,{childList:true,subtree:true});
})();'''
def verify(condition,message):
 if not condition:raise AssertionError(message)
def save():
 (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def case(page,name,run):
 try:report['cases'].append({'name':name,'status':'PASS','evidence':run() or {}});print('PASS',name,flush=True)
 except Exception as error:report['cases'].append({'name':name,'status':'FAIL','error':str(error),'trace':traceback.format_exc()});print('FAIL',name,str(error),flush=True)
 finally:
  try:page.screenshot(path=str(out/(name+'.png')))
  except:pass
  try:page.evaluate("document.querySelectorAll('dialog[open]').forEach(e=>e.close());document.querySelectorAll('header details').forEach(e=>e.open=false)")
  except:pass
  save()
def ready(page,path):
 page.goto(args.base+path,wait_until='networkidle')
 page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
 page.wait_for_function("!!document.querySelector('.shared-header-v80 #openAccount')&&!!document.querySelector('.shared-header-v80 #appearanceToggle')&&!!document.querySelector('.shared-header-v80 [data-locale=\"en-US\"]')")
 page.wait_for_function("window.quanhAccountUI?.client.getSnapshot().status==='ready'")
 page.evaluate('scrollTo(0,0)')

def controls(page):
 header=page.locator('.header,.reading-header').first;menu=header.locator('details').first;return header,menu,menu.locator(':scope>summary')
def rect(locator):return locator.bounding_box()
def geometry(page):
 header,menu,summary=controls(page)
 verify(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Document overflows horizontally')
 elements=[header.locator('a[href*="#library"]').first,header.locator('a[href*="books.html"]').first,header.locator('#openAssistant'),header.locator('#openAccount'),summary]
 boxes=[]
 for node in elements:
  verify(node.is_visible(),'Primary header action hidden: '+str(node))
  r=rect(node);verify(r['width']>=43.5 and r['height']>=43.5,'Header touch target below44px: '+str(r))
  verify(r['x']>=-1 and r['x']+r['width']<=page.viewport_size['width']+1,'Header action outside viewport: '+str(r));boxes.append(r)
 for index,a in enumerate(boxes):
  for b in boxes[index+1:]:
   overlap=min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x'])>1 and min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y'])>1
   verify(not overlap,'Header actions overlap: '+str([a,b]))
 primary=[elements[0].inner_text(),elements[1].inner_text(),elements[2].inner_text()]
 en=page.locator('html').get_attribute('lang').startswith('en');expected=['Library','Textbooks','AI assistant'] if en else ['Thư viện','Sách giáo khoa','Trợ lý AI']
 for wanted,actual in zip(expected,primary):verify(wanted.casefold() in ' '.join(actual.split()).casefold(),'Missing full visible nav label: '+str([wanted,actual]))
 verify(not header.locator('#appearanceToggle').is_visible(),'Theme utility remains inline')
 verify(not header.locator('[data-locale="en-US"]').is_visible(),'Language utility remains inline')
 verify(page.evaluate("Object.entries(window.qaOriginalNodes).every(([selector,node])=>document.querySelector(selector)===node)"),'Header replaced an original control node')
 return {'headerBox':rect(header),'primaryLabels':primary,'actionBoxes':boxes,'originalNodeIdentity':True}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 def context(width,height,theme,locale,dpr=1):
  ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr,has_touch=width<600,reduced_motion='reduce');ctx.add_init_script(identity_script);ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1',{json.dumps(theme)});localStorage.setItem('quanh.locale.v1',{json.dumps(locale)});")
  page=ctx.new_page();page.set_default_timeout(15000);page.on('pageerror',lambda error:report['pageErrors'].append(str(error)));page.route('**/vendor/firebase-auth.js?*',lambda r:r.fulfill(body=sdk,content_type='application/javascript'));return ctx,page
 if not args.deep_only and not args.lab_only:
  for width,height,dpr in [(w,900,1) for w in args.widths]+([(720,450,2)] if 1440 in args.widths else []):
   for theme in args.themes:
    for locale in args.locales:
     for name,path in [('library','#library'),('books','books.html')]:
      ctx,page=context(width,height,theme,locale,dpr)
      def matrix(path=path,name=name):
       ready(page,path);result=geometry(page);header,menu,summary=controls(page)
       current=header.locator('a[aria-current="page"]');verify(current.count()==1,'Header lacks one active destination')
       verify(('books' in current.get_attribute('href'))==(name=='books'),'Wrong active header destination')
       summary.click();verify(menu.evaluate('e=>e.open'),'Utilities menu did not open')
       panel=menu.locator(':scope>div').first
       verify(panel.is_visible(),'Opened utilities panel invisible');r=rect(panel);verify(r['x']>=-1 and r['x']+r['width']<=width+1,'Utilities panel escapes viewport: '+str(r))
       verify(header.locator('#appearanceToggle').is_visible() and header.locator('[data-locale="en-US"]').is_visible(),'Moved utility controls unavailable')
       page.keyboard.press('Escape');verify(not menu.evaluate('e=>e.open'),'Escape did not dismiss utilities')
       verify(summary.evaluate('e=>e===document.activeElement'),'Escape did not restore utilities focus')
       return result
      case(page,f'{name}-{width}-{height}-dpr{dpr}-{theme}-{locale}',matrix);ctx.close()
 if not args.matrix_only and not args.lab_only:
  for width in [320,1440]:
   for name,path in [('library','#library'),('books','books.html')]:
    ctx,page=context(width,900,'light','vi-VN')
    def interactions(path=path,name=name):
     ready(page,path);header,menu,summary=controls(page);geometry(page)
     original=page.evaluate('Object.keys(window.qaOriginalNodes)')
     summary.click();header.locator('[data-locale="en-US"]').click();verify(page.locator('html').get_attribute('lang').startswith('en'),'Original locale listener no longer works')
     if not menu.evaluate('e=>e.open'):summary.click()
     header.locator('#appearanceToggle').click();verify(page.locator('html').get_attribute('data-appearance')=='dark','Original theme listener no longer works')
     if not menu.evaluate('e=>e.open'):summary.click()
     header.locator('[data-locale="vi-VN"]').click()
     if menu.evaluate('e=>e.open'):summary.click()
     for action in ['guide','settings']:
      utility=header.locator('[data-action="'+action+'"]')
      if not utility.count():continue
      summary.click();utility.click();dialog=page.locator('dialog[open]');dialog.wait_for(state='visible')
      verify(not menu.evaluate('e=>e.open'),'Utility action leaves menu open behind dialog')
      verify(dialog.inner_text().strip(),'Original utility opened empty dialog');page.keyboard.press('Escape')
     summary.click();page.mouse.click(2,rect(header)['y']+rect(header)['height']+30);verify(not menu.evaluate('e=>e.open'),'Outside click did not dismiss utilities')
     summary.focus();page.keyboard.press('Enter');verify(menu.evaluate('e=>e.open'),'Keyboard Enter cannot open native utility menu');page.keyboard.press('Escape')
     # Closed utilities must be removed from sequential keyboard navigation.
     header.locator('.brand').focus()
     for _ in range(8):
      page.keyboard.press('Tab');verify(not page.evaluate("!!document.activeElement.closest('header details')&&!document.activeElement.matches('summary')"),'Closed utilities received keyboard focus')
     header.locator('#openAccount').click();page.locator('#accountDialog').wait_for(state='visible');page.locator('#accountGoogle').click();page.locator('#accountMember').wait_for(state='visible')
     verify(page.locator('#accountName').inner_text()=='Quốc Anh','Account handler broke after reparenting')
     avatar=header.locator('#openAccount>.account-trigger-avatar');avatar_style=avatar.evaluate("e=>({clip:getComputedStyle(e).clip,clipPath:getComputedStyle(e).clipPath})")
     verify(avatar.is_visible() and avatar_style['clip']=='auto' and avatar_style['clipPath']=='none','Authenticated avatar is clipped by an old header style: '+str(avatar_style))
     avatar_box=avatar.bounding_box();verify(avatar_box['width']>=24 and avatar_box['height']>=24,'Authenticated header avatar collapsed')
     page.screenshot(path=str(out/f'profile-{name}-{width}.png'));page.keyboard.press('Escape')
     header.locator('#openAssistant').click();chat=page.locator('#aiAssistant');chat.wait_for(state='visible')
     if width<600:verify(not chat.locator('textarea').evaluate('e=>e===document.activeElement'),'Mobile AI summoned keyboard')
     chat.locator('[data-ai=close]').click();geometry(page)
     verify(page.evaluate("Object.entries(window.qaOriginalNodes).every(([selector,node])=>document.querySelector(selector)===node)"),'Interactions replaced original control nodes')
     return {'originalSelectors':original,'localeThemeGuideSettingsPreserved':True,'outsideEscapeKeyboard':True,'accountAndAI':True}
    case(page,f'interactions-{name}-{width}',interactions);ctx.close()
 if not args.matrix_only and not args.deep_only:
  for width in [320,1440]:
   for theme in args.themes:
    ctx,page=context(width,900,theme,'vi-VN')
    def lab_case():
     ready(page,'#lab/ohm');page.wait_for_selector('#visual canvas',timeout=60000);geometry(page)
     stage=page.locator('.stage-viewport').bounding_box();verify(stage['width']>200 and stage['height']>180,'Model viewport collapsed')
     for selector in ['#play','[data-action=record]']:
      box=page.locator(selector).first.bounding_box();verify(box['width']>=44 and box['height']>=44,'Primary lab target under44px')
     number=page.locator('#controlsPanel [data-number]').first
     colors=number.evaluate(r'''e=>{
      const rgb=s=>s.match(/[0-9.]+/g).map(Number),l=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
      const style=getComputedStyle(e);let ancestor=e,background;while(ancestor){background=getComputedStyle(ancestor).backgroundColor;const rgba=rgb(background);if(rgba.length<4||rgba[3]===1)break;ancestor=ancestor.parentElement;}const fg=l(rgb(style.color)),bg=l(rgb(background||'rgb(255,255,255)'));return {color:style.color,background,contrast:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05),fontSize:style.fontSize};
     }''')
     verify(colors['contrast']>=4.5,'Numeric parameter text fails contrast: '+str(colors))
     page.locator('[data-action=record]').first.click();page.wait_for_function("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows.length===1")
     before=page.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm)")
     header,menu,summary=controls(page);summary.click();page.keyboard.press('Escape')
     verify(page.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm)")==before,'Utilities Escape altered the lab session')
     disclosure=page.locator('.parameter-window').first
     if disclosure.count():
      disclosure.evaluate('e=>e.open=false')
      for control in disclosure.locator('input,select,button').all():verify(not control.is_visible(),'Closed parameter disclosure leaked a control')
     page.evaluate("document.querySelector('[data-mode=present]').click()")
     verify(not header.is_visible(),'Shared header overlays presentation mode')
     page.locator('[data-action=exit-present]').click();verify(header.is_visible(),'Exiting presentation failed to restore the shared header')
     page.emulate_media(media='print');verify(not header.is_visible(),'Shared header remains visible when printing')
     page.emulate_media(media='screen');verify(header.is_visible(),'Returning to screen media failed to restore the header')
     page.locator('.stage-top').scroll_into_view_if_needed();page.screenshot(path=str(out/f'lab-model-{width}-{theme}.png'))
     number.scroll_into_view_if_needed()
     return {'stage':stage,'numberColors':colors,'recordSessionPreserved':True,'closedNativeDetails':True,'presentationAndPrintHeader':True}
    case(page,f'lab-{width}-{theme}',lab_case);ctx.close()
 browser.close()
report['passed']=all(item['status']=='PASS' for item in report['cases']) and not report['pageErrors'];save();print(json.dumps({'passed':report['passed'],'cases':len(report['cases']),'failed':[c['name'] for c in report['cases'] if c['status']=='FAIL'],'pageErrors':report['pageErrors']},ensure_ascii=False));raise SystemExit(0 if report['passed'] else 1)
