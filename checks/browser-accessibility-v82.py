"""Targeted axe-core 4.10.3 audit of actual Quanh Lab UI states.
Requires a separately installed axe script (--axe-path/AXE_CORE_PATH). It is not vendored.
Automated WCAG-tagged findings and manual-review items are evidence, not certification.
Firebase is a routed SDK fixture. No real account writes or AI provider calls occur.
"""
import argparse,ast,json,os,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--base',default='http://127.0.0.1:4173/');parser.add_argument('--out',default='work/accessibility-v82');parser.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium');parser.add_argument('--axe-path',default=os.environ.get('AXE_CORE_PATH'));parser.add_argument('--themes',nargs='+',default=['light','dark']);parser.add_argument('--screens',nargs='+',default=['home','library','params','data','tasks','books','reader','account','profile','ai','guard']);parser.add_argument('--width',type=int,default=390);parser.add_argument('--baseline',action='store_true');parser.add_argument('--audit-only',action='store_true');parser.add_argument('--behavior-only',action='store_true');args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
if not args.axe_path:raise SystemExit('Provide --axe-path or AXE_CORE_PATH pointing to the separately installed official axe-core 4.10.3 script.')
axe_path=Path(args.axe_path)
if not axe_path.is_file():raise SystemExit('Missing axe-core script: '+str(axe_path)+'; provide --axe-path after installing the official pinned package outside the source tree.')
axe_source=axe_path.read_text();module=ast.parse(Path('checks/browser-account-profile-v78.py').read_text());sdk=next(ast.literal_eval(n.value) for n in module.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SDK' for t in n.targets))
report={'engine':args.engine,'base':args.base,'viewport':{'width':args.width,'height':900},'axeSource':str(axe_path),'axeVersion':None,'baseline':args.baseline,'cases':[],'pageErrors':[],'limits':['Automated WCAG-tagged axe checks do not establish full WCAG AA conformance. Incomplete results require manual review.','Headless desktop browser engines with emulated viewport do not establish physical Android/iPhone/Safari, real assistive-technology or virtual-keyboard acceptance.','Firebase SDK and AI transport are fixtures; no production identity writes or AI inference.','The audit samples named screens and states; it does not inspect all 300 simulations or their scientific accuracy.']}
def verify(ok,message):
 if not ok:raise AssertionError(message)
def save():(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def open_lab(page):
 page.goto(args.base+'#lab/ohm',wait_until='domcontentloaded');page.wait_for_selector('.inquiry-workbook',timeout=60000);page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
 page.evaluate('()=>document.fonts.ready')
 # Wait for a bounded sample of the actual layout, including a late renderer notice.
 page.evaluate("""async()=>{let previous='',stable=0;for(let n=0;n<20;n++){await new Promise(resolve=>setTimeout(resolve,75));const e=document.querySelector('#controlsPanel'),r=e?.getBoundingClientRect(),signature=r&&[r.x,r.y,r.width,r.height].join(',');stable=signature===previous?stable+1:0;previous=signature;if(stable>=4)return;}}""")
def data(page):
 if not page.locator('#researchPanel').is_visible():page.locator('.workspace-toolbar [data-action=toggle-dock]').click()
 page.locator('.work-tabs [data-panel=data]').click()
 for selector in ['#chartPanel','#tablePanel']:page.locator(selector).evaluate('e=>e.open=true')
def setup(page,screen):
 if screen in ['params','data','tasks']:
  open_lab(page)
  if screen=='params':
   if not page.locator('#controlsPanel').is_visible():page.locator('.workspace-toolbar [data-action=toggle-controls]').click()
   page.locator('#controlsPanel').scroll_into_view_if_needed()
  if screen=='data':
   page.locator('[data-action=record]').first.click();data(page);page.locator('#graphMode').select_option('measured');page.locator('#graphX').select_option('0');page.locator('#graphY').select_option('2');page.locator('#tablePanel').scroll_into_view_if_needed()
  if screen=='tasks':
   data(page);page.locator('.work-tabs [data-panel=tasks]').click();page.locator('#notes').fill('Nhận xét kiểm tra khả năng truy cập, không gửi lên dịch vụ.');page.locator('#notes').scroll_into_view_if_needed()
 elif screen in ['books','reader']:
  page.goto(args.base+('books.html?grade=10&page=4' if screen=='reader' else 'books.html'),wait_until='domcontentloaded');page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
  page.wait_for_selector('.paper-page' if screen=='reader' else '.textbook-card',timeout=30000)
 else:
  page.goto(args.base+('#library' if screen=='library' else ''),wait_until='domcontentloaded');page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
  if screen in ['account','profile']:
   page.locator('#openAccount').click();page.locator('#accountGuest').wait_for(state='visible')
   if screen=='profile':page.locator('#accountGoogle').click();page.locator('#accountMember').wait_for(state='visible')
  if screen in ['ai','guard']:
   page.locator('#openAssistant').click();page.locator('#aiAssistant').wait_for(state='visible')
   if screen=='guard':page.locator('#aiAssistant textarea').fill('Giữ câu hỏi nháp khi mở sách');page.locator('#aiAssistant [data-ai=close]').click();page.locator('.shared-header-v80 a[href="books.html"]').click();page.locator('#conversationNavigation').wait_for(state='visible')
 page.evaluate('()=>document.fonts.ready');page.wait_for_timeout(100)
def audit(page):
 page.evaluate(axe_source)
 result=page.evaluate("""async()=>{
  const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},resultTypes:['violations','incomplete','passes','inapplicable']});
  const select=rule=>({id:rule.id,impact:rule.impact,description:rule.description,help:rule.help,helpUrl:rule.helpUrl,tags:rule.tags,nodes:rule.nodes.map(n=>({target:n.target,html:n.html,failureSummary:n.failureSummary,checks:[...n.any,...n.all,...n.none].map(c=>({id:c.id,message:c.message,data:c.data,relatedNodes:c.relatedNodes?.map(r=>({target:r.target,html:r.html}))}))}))});
  return {axeVersion:axe.version,violations:result.violations.map(select),incomplete:result.incomplete.map(select),passes:result.passes.length,inapplicable:result.inapplicable.length};
 }""")
 return result
with sync_playwright() as p:
 engine=getattr(p,args.engine)
 options={'headless':True}
 if args.engine=='chromium':options.update(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 browser=engine.launch(**options)
 report['browserVersion']=browser.version
 for theme in args.themes:
  for screen in ([] if args.behavior_only else args.screens):
   context=browser.new_context(viewport={'width':args.width,'height':900},has_touch=args.width<600,reduced_motion='reduce');context.add_init_script(f"localStorage.setItem('quanh-appearance-v1',{json.dumps(theme)});localStorage.setItem('quanh.locale.v1','vi-VN')");page=context.new_page();page.set_default_timeout(25000);page.on('pageerror',lambda error:report['pageErrors'].append(str(error)));page.route('**/vendor/firebase-auth.js?*',lambda route:route.fulfill(body=sdk,content_type='application/javascript'));page.route('**/api/chat',lambda route:route.fulfill(content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps({'answer':'Phản hồi kiểm thử tổng hợp.'})))
   case={'screen':screen,'theme':theme}
   try:
    setup(page,screen);result=audit(page)
    report['axeVersion']=result.pop('axeVersion');case.update(result,status='FINDINGS' if result['violations'] else 'CLEAN');print(args.engine,theme,screen,[(r['id'],len(r['nodes'])) for r in result['violations']],flush=True)
    if result['violations'] or screen in ['data','profile','guard']:page.screenshot(path=str(out/f'{args.engine}-{theme}-{screen}.png'))
   except Exception as error:
    case.update(status='ERROR',error=str(error),trace=traceback.format_exc());print('ERROR',args.engine,theme,screen,str(error),flush=True)
    try:
     case['layoutAtFailure']=page.evaluate("[...document.querySelectorAll('#controlsPanel,.workspace-toolbar,#rendererNotice,[data-action=record]')].map(e=>{const r=e.getBoundingClientRect();return {selector:e.id||e.className,display:getComputedStyle(e).display,x:r.x,y:r.y,w:r.width,h:r.height}})")
     page.screenshot(path=str(out/f'{args.engine}-{theme}-{screen}-error.png'),animations='disabled',timeout=10000)
    except Exception as capture_error:case['failureCaptureError']=str(capture_error)
   finally:report['cases'].append(case);save();context.close()
 if not args.audit_only:
  for theme in args.themes:
   context=browser.new_context(viewport={'width':args.width,'height':900},has_touch=args.width<600,reduced_motion='reduce');context.add_init_script(f"localStorage.setItem('quanh-appearance-v1',{json.dumps(theme)});localStorage.setItem('quanh.locale.v1','vi-VN')");page=context.new_page();page.set_default_timeout(30000);page.on('pageerror',lambda error:report['pageErrors'].append(str(error)));page.route('**/vendor/firebase-auth.js?*',lambda route:route.fulfill(body=sdk,content_type='application/javascript'))
   case={'screen':'electric-keyboard-workflow','theme':theme}
   try:
    page.goto(args.base+'#lab/electric',wait_until='domcontentloaded');page.wait_for_selector('.inquiry-workbook',timeout=60000);page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
    def checked_mode(expected):
     pressed=page.locator('button[data-electric-mode][aria-pressed=true]');verify(pressed.count()==1 and pressed.get_attribute('data-electric-mode')==str(expected),'Keyboard/row restoration failed to select exactly one electric mode')
     verify(page.locator('[data-electric-mode][aria-pressed]:not(button)').count()==0,'A non-button graph container received aria-pressed')
    first=page.locator('button[data-electric-mode="1"]');first.focus();first.press('Space');checked_mode(1)
    page.locator('[data-action=record]').first.click();data(page);page.locator('#graphMode').select_option('measured');page.locator('#graphX').select_option('1');page.locator('#graphY').select_option('6')
    second=page.locator('button[data-electric-mode="2"]');second.focus();second.press('Enter');checked_mode(2);page.locator('[data-action=record]').first.click()
    rows=page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).electric.rows");verify(len(rows)==2,'Real mode recording failed')
    row=page.locator('[data-row="0"]');row.focus();row.press('Enter');checked_mode(1);verify(page.locator('[data-row="0"]').evaluate('e=>e===document.activeElement'),'Restoring a row lost keyboard focus')
    row=page.locator('[data-row="1"]');row.focus();row.press('Space');checked_mode(2)
    verify(page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).electric.rows")==rows,'Keyboard mode restoration changed recorded measurements')
    table=page.locator('.table-scroll');verify(table.get_attribute('role')=='region' and table.get_attribute('aria-label'),'The named scroll container lacks region semantics')
    result=audit(page);report['axeVersion']=result.pop('axeVersion');case.update(result,status='FINDINGS' if result['violations'] else 'CLEAN',behavior={'keyboardModes':True,'recordedRows':2,'rowRestoreFocus':True,'nonButtonAriaPressed':False,'dataRetained':True,'tableRegionNamed':True});page.screenshot(path=str(out/f'{args.engine}-{theme}-electric-workflow.png'));print(args.engine,theme,'electric-keyboard-workflow',[(r['id'],len(r['nodes'])) for r in result['violations']],flush=True)
   except Exception as error:case.update(status='ERROR',error=str(error),trace=traceback.format_exc());print('ERROR',args.engine,theme,'electric-keyboard-workflow',str(error),flush=True)
   finally:report['cases'].append(case);save();context.close()
 browser.close()
report['automatedClean']=bool(report['cases']) and all(c['status']=='CLEAN' for c in report['cases']) and not report['pageErrors'];report['manualReviewItems']=sum(len(c.get('incomplete',[])) for c in report['cases']);save();print(json.dumps({'engine':args.engine,'automatedClean':report['automatedClean'],'cases':len(report['cases']),'findings':[(c['screen'],c['theme'],[v['id'] for v in c.get('violations',[])]) for c in report['cases'] if c['status']!='CLEAN'],'pageErrors':report['pageErrors'],'manualReviewItems':report['manualReviewItems']},ensure_ascii=False));raise SystemExit(0 if args.baseline or report['automatedClean'] else 1)
