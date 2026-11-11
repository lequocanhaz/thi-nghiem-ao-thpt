"""Targeted acceptance gaps after v80: data states, keyboard, large text and navigation.
All contexts are disposable local browser profiles. Imported null data are an explicit legacy
fixture, never fabricated scientific measurements. No real OAuth/account or AI calls.
"""
import argparse,ast,json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/ui-gaps-v81/final');ap.add_argument('--only',nargs='+');ap.add_argument('--groups',nargs='+',default=['charts','layout','books','departure']);args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'browser':'Chromium/SwiftShader','base':args.base,'cases':[],'pageErrors':[],'limits':['Viewport/landscape/short-height emulation is not physical Android/iPhone/Safari or a real software keyboard.','Computed text doubling and CSS-pixel reflow are explicitly synthetic text/layout stress, not browser-toolbar zoom.','Firebase is routed to a local SDK fixture; AI transport is not called.','SVG text-doubling clipping is recorded separately; full axis labels/units must remain available in a visible HTML caption.']}
module=ast.parse(Path('checks/browser-account-profile-v78.py').read_text());sdk=next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SDK' for t in n.targets))
def verify(ok,message):
 if not ok:raise AssertionError(message)
def save():(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def case(page,name,run):
 if args.only and name not in args.only:return
 try:report['cases'].append({'name':name,'status':'PASS','evidence':run() or {}});print('PASS',name,flush=True)
 except Exception as error:report['cases'].append({'name':name,'status':'FAIL','error':str(error),'trace':traceback.format_exc()});print('FAIL',name,str(error),flush=True)
 finally:
  try:page.screenshot(path=str(out/(name+'.png')))
  except:pass
  save()
def navigate(page,id):
 page.goto(args.base+'#lab/'+id,wait_until='domcontentloaded');page.wait_for_selector('.inquiry-workbook',timeout=60000);page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
def open_data(page):
 if not page.locator('#researchPanel').is_visible():page.locator('.workspace-toolbar [data-action=toggle-dock]').click()
 page.locator('.work-tabs [data-panel=data]').click()
 for selector in ['#chartPanel','#tablePanel']:page.locator(selector).evaluate('e=>e.open=true')
def session(page,id):return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)
def number(page,key,value):
 node=page.locator('#controlsPanel [data-number="'+key+'"]')
 for ancestor in node.locator('xpath=ancestor::details').all():ancestor.evaluate('e=>e.open=true')
 node.fill(str(value));node.press('Tab')
def fit(page):verify(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Document has horizontal overflow')
def empty(page):
 host=page.locator('#graph');verify(host.get_attribute('data-state')=='empty','Measured chart presents fallback axes instead of an empty state')
 notice=host.locator('.graph-empty-state');verify(notice.is_visible() and notice.inner_text().strip(),'Empty chart has no visible explanation')
 verify(host.locator('svg').count()==0,'Empty measured chart still draws arbitrary numeric axes')
 button=notice.locator('[data-action=record]');verify(button.is_visible(),'Empty measured chart has no real record action')
 box=button.bounding_box();verify(box['width']>=44 and box['height']>=44,'Empty-chart action is too small');return notice.inner_text()
def text_double(page,selector):
 return page.locator(selector).evaluate_all("nodes=>{const sizes=nodes.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)*2]);for(const[e,size]of sizes)e.style.setProperty('font-size',size+'px','important');return sizes.length}")
def text_bounds(page,selector):
 return page.locator(selector).evaluate("e=>{const r=e.getBoundingClientRect();return [...e.querySelectorAll('text')].filter(t=>t.getClientRects().length&&getComputedStyle(t).display!=='none').map(t=>{const a=t.getBoundingClientRect();return {text:t.textContent,font:getComputedStyle(t).fontSize,left:a.left-r.left,right:a.right-r.right,top:a.top-r.top,bottom:a.bottom-r.bottom}})}")
with sync_playwright() as p:
 report['engines']={name:{'path':getattr(p,name).executable_path,'installed':Path(getattr(p,name).executable_path).exists()} for name in ['chromium','firefox','webkit']};report['engines']['chromium']['systemExecutable']='/usr/bin/chromium'
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 def context(width=390,height=900,theme='light'):
  ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=width<600,reduced_motion='reduce');ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1',{json.dumps(theme)});localStorage.setItem('quanh.locale.v1','vi-VN')");page=ctx.new_page();page.set_default_timeout(20000);page.on('pageerror',lambda e:report['pageErrors'].append(str(e)));page.route('**/vendor/firebase-auth.js?*',lambda r:r.fulfill(body=sdk,content_type='application/javascript'));return ctx,page
 if 'charts' in args.groups:
  ctx,page=context(320)
  def no_rows():
   navigate(page,'ohm');open_data(page);page.locator('#graphMode').select_option('measured');message=empty(page);verify(page.locator('[data-action=csv]').is_disabled(),'Export is enabled with no recorded rows')
   page.locator('#graph .graph-empty-state [data-action=record]').focus();page.keyboard.press('Enter');page.wait_for_selector('#graph [data-graph-row]');page.wait_for_function("!!document.activeElement?.matches('#graph [data-graph-row]')");verify(len(session(page,'ohm')['rows'])==1,'Empty-state action did not record a real measurement');fit(page)
   return {'explanation':message,'recordedRows':1,'keyboardRecoveryFocusOnPoint':True}
  case(page,'measured-zero-rows',no_rows);ctx.close()
  ctx,page=context()
  def different_mode():
   navigate(page,'electric');page.locator('[data-action=record]').first.click();open_data(page);page.locator('#graphMode').select_option('measured');before=session(page,'electric')['rows'];page.locator('[data-electric-mode="1"]').click();open_data(page);page.locator('#graphMode').select_option('measured');message=empty(page);verify(session(page,'electric')['rows']==before,'Changing plot mode dropped the original measurements')
   page.locator('#graph .graph-empty-state [data-action=record]').click();verify(len(session(page,'electric')['rows'])==2,'New-mode record failed');page.locator('#graphX').select_option('1');page.locator('#graphY').select_option('6');page.wait_for_selector('#graph [data-graph-row]');fit(page)
   return {'explanation':message,'oldRowsRetained':True,'newModeRowAdded':True,'explicitNewModeAxes':'q1 and E (N/C)'}
  case(page,'measured-no-compatible-mode',different_mode);ctx.close()
  ctx,page=context()
  def null_legacy():
   navigate(page,'ohm');payload={'schema':'thpt.session.v1','id':'ohm','rows':[{'values':[None]*5},{'values':[None]*5}],'config':{'graphMode':'measured'}}
   page.locator('#sessionFile').set_input_files({'name':'legacy-null-data.json','mimeType':'application/json','buffer':json.dumps(payload).encode()});page.wait_for_selector('dialog[open]');page.locator('[data-action=confirm-import-session]').click();open_data(page);page.locator('#graphMode').select_option('measured');message=empty(page);verify(len(session(page,'ohm')['rows'])==2,'Legacy rows were removed to display the empty plot')
   page.locator('#graph .graph-empty-state [data-action=record]').click();page.wait_for_selector('#graph [data-graph-row]');verify(len(session(page,'ohm')['rows'])==3,'Valid point was not added alongside legacy data')
   return {'fixture':'two legacy null-valued rows imported through the existing UI','explanation':message,'legacyRowsRetained':True}
  case(page,'measured-no-finite-values',null_legacy);ctx.close()
  ctx,page=context(320,900,'dark')
  def points_and_table():
   navigate(page,'ohm')
   for index in range(24):number(page,'u',1+index%6);page.locator('[data-action=record]').first.click()
   open_data(page);page.locator('#graphMode').select_option('measured');page.locator('#graphX').select_option('0');page.locator('#graphY').select_option('2');before=session(page,'ohm')['rows']
   point=page.locator('#graph [data-graph-row="1"]');point.focus();point.press('Enter');verify(page.locator('#graph [data-graph-row="1"]').get_attribute('aria-pressed')=='true','Enter did not select a plotted point');verify(page.locator('#graph [data-graph-row="1"]').evaluate('e=>e===document.activeElement'),'Graph selection lost keyboard focus')
   page.locator('#graph [data-graph-row="2"]').focus();page.keyboard.press('Space');verify(page.locator('#graph [data-graph-row="2"]').get_attribute('aria-pressed')=='true','Space did not select a plotted point')
   table=page.locator('.table-scroll');table.scroll_into_view_if_needed();table.focus();table.press('ArrowRight');table.press('ArrowDown');page.wait_for_timeout(200);scroll=table.evaluate('e=>({x:e.scrollLeft,y:e.scrollTop,w:e.clientWidth,sw:e.scrollWidth,h:e.clientHeight,sh:e.scrollHeight})');verify(scroll['x']>0 and scroll['y']>0,'The focusable data table does not scroll using arrow keys')
   verify(session(page,'ohm')['rows']==before,'Keyboard chart/table operations modified recorded values');fit(page)
   return {'rows':24,'pointEnterSpace':True,'focusRetained':True,'tableScroll':scroll}
  case(page,'recorded-data-keyboard',points_and_table);ctx.close()
 if 'layout' in args.groups:
  for width,height,id in [(320,900,'franck_hertz'),(390,380,'electric'),(720,450,'ohm')]:
   ctx,page=context(width,height)
   def layout(id=id):
    navigate(page,id);page.locator('[data-action=record]').first.click();open_data(page);page.locator('#graphMode').select_option('measured')
    if id=='franck_hertz':page.locator('#graphY').select_option('2')
    page.locator('#graph').scroll_into_view_if_needed();normal=text_bounds(page,'#graph');text_double(page,'#graph text');doubled=text_bounds(page,'#graph')
    axes=page.locator('#graphAxisLabels');verify(axes.is_visible() and axes.inner_text().strip(),'Full axes and units are not available outside the SVG');axes_before=axes.inner_text();text_double(page,'#graphAxisLabels');verify(axes.evaluate('e=>e.scrollWidth<=e.clientWidth+1'),'Large-text axis names clip horizontally')
    caption=page.locator('#graphStateCaption');verify(caption.is_visible() and caption.inner_text().strip(),'No visible HTML axis/units caption accompanies the plot');before=caption.inner_text();text_double(page,'#graphStateCaption');fit(page);verify(caption.inner_text()==before,'Large text removed axis labels or units');verify(caption.evaluate('e=>e.scrollWidth<=e.clientWidth+1'),'Large-text axis caption clips horizontally')
    text_double(page,'.workspace-toolbar button,.workspace-toolbar summary,.workspace-toolbar span')
    if width<=620 or not page.locator('#controlsPanel').is_visible():page.locator('.workspace-toolbar [data-action=toggle-controls]').click()
    field=page.locator('#controlsPanel [data-number]').first;field.scroll_into_view_if_needed();field.focus();page.set_viewport_size({'width':width,'height':min(380,height)});page.wait_for_timeout(150);field.scroll_into_view_if_needed();box=field.bounding_box();verify(box['y']>=0 and box['y']+box['height']<=min(380,height)+1,'Numerical field cannot be exposed in a short viewport')
    toolbar=page.locator('.workspace-toolbar');editing_hidden=toolbar.is_hidden();editing_inset=page.locator('.lab').evaluate('e=>parseFloat(getComputedStyle(e).getPropertyValue("--workspace-toolbar-height"))||0')
    if editing_hidden:verify(editing_inset==0,'Hidden toolbar still reserves an obsolete bottom inset')
    field.evaluate('e=>e.blur()');page.wait_for_timeout(150);toolbar_box=toolbar.bounding_box();computed=page.locator('.lab').evaluate('e=>parseFloat(getComputedStyle(e).getPropertyValue("--workspace-toolbar-height"))||0')
    if toolbar.is_visible() and width<=620:verify(computed>=toolbar_box['height']-1,'Mobile bottom inset ignores the real toolbar height')
    fit(page)
    return {'id':id,'normalSVGLabels':normal,'doubledSVGLabels':doubled,'fullHTMLAxisNames':axes_before,'fullHTMLCaption':before,'shortViewportField':box,'toolbarHiddenWhileEditing':editing_hidden,'toolbarHeight':toolbar_box['height'] if toolbar_box else 0,'toolbarInset':computed}
   case(page,f'chart-text200-shortviewport-{id}-{width}',layout);ctx.close()
 if 'books' in args.groups:
  ctx,page=context(320,568);page.route('**/books/10/004.webp',lambda r:r.abort())
  def failed_book():
   page.goto(args.base+'books.html?grade=10&page=4',wait_until='domcontentloaded');alert=page.locator('#bookError');alert.wait_for(state='visible');page.wait_for_timeout(150);button=page.locator('#retryBook');box=button.bounding_box();verify(box['y']>=0 and box['y']+box['height']<=568,'Failed textbook image leaves Retry outside the short viewport')
   verify(alert.get_attribute('role')=='alert','Book failure lacks an announced error');page.unroute('**/books/10/004.webp');button.click();page.wait_for_selector('.paper-page',timeout=30000);verify(alert.is_hidden(),'Successful retry leaves the error visible');verify(page.locator('#bookPage').input_value()=='4','Retry opened a different page')
   return {'retryBox':box,'restoredPage':4,'errorAnnounced':True}
  case(page,'book-first-image-error-retry-320x568',failed_book);ctx.close()
 if 'departure' in args.groups:
  ctx,page=context()
  def protected_departure():
   navigate(page,'ohm');page.evaluate("window.qaDocumentMarker='retain-until-explicit-leave'");page.locator('#openAssistant').click();chat=page.locator('#aiAssistant');chat.locator('textarea').fill('Bản nháp cần giữ khi tra cứu sách');chat.locator('[data-ai=close]').click();link=page.locator('.shared-header-v80 a[href="books.html"]')
   link.click();dialog=page.locator('#conversationNavigation');dialog.wait_for(state='visible');stay=dialog.locator('[data-conversation-stay]');verify(stay.evaluate('e=>e===document.activeElement'),'Departure guard does not default focus to Stay')
   page.keyboard.press('Escape');verify(dialog.is_hidden(),'Escape does not cancel leaving');verify(link.evaluate('e=>e===document.activeElement'),'Cancelled departure did not return link focus')
   link.click();stay.click();verify(page.evaluate("window.qaDocumentMarker==='retain-until-explicit-leave'"),'Stay replaced the current document')
   link.click()
   with page.expect_popup() as pending:dialog.locator('[data-conversation-new-tab]').click()
   child=pending.value;child.wait_for_load_state('domcontentloaded');verify('books.html' in child.url,'New tab did not open the chosen destination');child.close();page.locator('#openAssistant').click();verify(chat.locator('textarea').input_value()=='Bản nháp cần giữ khi tra cứu sách','Opening a new tab lost the original question draft');chat.locator('[data-ai=close]').click()
   link.click();dialog.locator('[data-conversation-leave]').click();page.wait_for_url('**/books.html');verify(page.evaluate('window.qaDocumentMarker===undefined'),'Explicit Continue did not navigate to the new document')
   return {'defaultStay':True,'escapeFocus':True,'newTabRetainsDraft':True,'explicitContinueNavigates':True}
  case(page,'conversation-departure-stay-newtab-continue',protected_departure);ctx.close()
  ctx,page=context()
  def same_document_links():
   navigate(page,'ohm');page.evaluate("window.qaDocumentMarker='same-document'");page.locator('#openAssistant').click();page.locator('#aiAssistant textarea').fill('Nháp Ohm vẫn nằm trong thí nghiệm');page.locator('#aiAssistant [data-ai=close]').click();page.locator('.shared-header-v80 a[href="#library"]').click();page.wait_for_selector('#search')
   verify(page.locator('#conversationNavigation[open]').count()==0,'SPA navigation triggers the fresh-document warning');verify(page.evaluate("window.qaDocumentMarker==='same-document'"),'SPA link unexpectedly replaced the document')
   page.goto(args.base+'#lab/ohm',wait_until='domcontentloaded');page.wait_for_selector('.inquiry-workbook');page.locator('#openAssistant').click();verify(page.locator('#aiAssistant textarea').input_value()=='Nháp Ohm vẫn nằm trong thí nghiệm','SPA round trip lost its thread draft')
   return {'SPAHasNoGuard':True,'sameDocument':True,'draftRetained':True}
  case(page,'conversation-spa-no-warning',same_document_links);ctx.close()
  ctx,page=context()
  def brand_reload():
   navigate(page,'ohm');page.locator('#openAssistant').click();page.locator('#aiAssistant textarea').fill('Bảo vệ bản nháp khi nhấn logo');page.locator('#aiAssistant [data-ai=close]').click();page.locator('.shared-header-v80>.brand').click();page.locator('#conversationNavigation').wait_for(state='visible')
   verify(page.locator('#conversationNavigation [data-conversation-stay]').evaluate('e=>e===document.activeElement'),'Same-path reload guard does not default to Stay')
   return {'brandFreshDocumentProtected':True}
  case(page,'conversation-same-path-brand-reload',brand_reload);ctx.close()
 browser.close()
report['passed']=bool(report['cases']) and all(c['status']=='PASS' for c in report['cases']) and not report['pageErrors'];save();print(json.dumps({'passed':report['passed'],'cases':len(report['cases']),'failed':[c['name'] for c in report['cases'] if c['status']=='FAIL'],'pageErrors':report['pageErrors']},ensure_ascii=False));raise SystemExit(0 if report['passed'] else 1)
