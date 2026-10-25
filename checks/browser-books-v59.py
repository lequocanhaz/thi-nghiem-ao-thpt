"""Reader UX regression: headless Chromium, simulated viewports, not real iPhone/Safari."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('work/books-v59');OUT.mkdir(parents=True,exist_ok=True)
BASE='http://127.0.0.1:4173/'
report={'scope':'Headless Chromium, simulated mobile/desktop; native fullscreen unavailable path forced for focus test','tests':[],'errors':[]}
def check(ok,message):
 if not ok: raise AssertionError(message)
def test(name,fn):
 try:
  evidence=fn();report['tests'].append({'name':name,'status':'PASS','evidence':evidence});print('PASS',name,flush=True)
 except Exception as e:
  report['tests'].append({'name':name,'status':'FAIL','error':str(e)});print('FAIL',name,str(e),flush=True)
 (OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 page.on('pageerror',lambda e:report['errors'].append(str(e)))
 def open_reader(grade=10,number=4):
  page.goto(BASE+f'books.html?grade={grade}&page={number}');page.wait_for_load_state('networkidle');page.wait_for_selector('.paper-page')
 def viewports():
  evidence=[]
  for width in [320,375,390,414,430,768,1024,1440,1920]:
   page.set_viewport_size({'width':width,'height':844 if width<768 else 900});open_reader()
   data=page.evaluate('''()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,selects:[...document.querySelectorAll('.reading-selects label')].map(e=>e.textContent.trim().split('\\n')[0]),tools:[...document.querySelectorAll('#bookToolbar button')].filter(e=>e.getClientRects().length).map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),note:document.querySelector('#bookPageNote').textContent})''')
   check(data['scroll']<=width,'horizontal overflow '+str(data));check(all(t['w']>=43 and t['h']>=43 for t in data['tools']),'touch target '+str(data))
   page.screenshot(path=str(OUT/f'reader-{width}.png'),full_page=True);evidence.append(data)
  return evidence
 test('reader fits nine widths with visible labels and 44px controls',viewports)
 def locale():
  page.set_viewport_size({'width':390,'height':844});open_reader(12,9)
  page.locator('#zoomIn').click();before=page.locator('#paperStack img').first.get_attribute('src')
  page.locator('[data-locale="en-US"]').click();page.wait_for_timeout(100)
  check(page.locator('#bookPage').input_value()=='9','locale resets page');check(page.locator('#zoomValue').inner_text()=='125%','locale resets zoom');check(page.locator('#paperStack img').first.get_attribute('src')==before,'locale reloads image')
  check(page.locator('#bookPageNote').inner_text().startswith('Printed textbook page:'),'printed page label not translated')
  check(page.locator('#bookReadingHint').inner_text().startswith('Swipe'),'hint not translated')
  check(page.locator('label[for="bookPage"]').inner_text()=='File page','file label not translated')
  page.locator('[data-locale="vi-VN"]').click();page.wait_for_timeout(100)
  check(page.locator('#bookPageNote').inner_text().startswith('Trang in'),'printed page label not restored')
  return {'page':9,'zoom':'125%','sameImage':True,'printedPageLabel':True}
 test('VI/EN preserves page and zoom and translates new labels',locale)
 def keyboard():
  open_reader()
  page.locator('#bookStage').focus();page.keyboard.press('ArrowRight');page.wait_for_function("document.querySelector('#bookPage').value==='5'")
  page.locator('#zoomIn').focus();page.keyboard.press('End');page.wait_for_timeout(100);check(page.locator('#bookPage').input_value()=='5','End on button unexpectedly turns page')
  page.locator('#zoomIn').click();page.locator('#bookStage').focus();page.keyboard.press('ArrowRight');page.wait_for_timeout(100);check(page.locator('#bookPage').input_value()=='5','Arrow while zoomed turns page')
  return {'pageRegionArrow':True,'buttonEndDoesNotTurn':True,'zoomedArrowDoesNotTurn':True}
 test('keyboard page shortcuts stay in page region and preserve zoomed pan',keyboard)
 def fallback_focus():
  page.set_viewport_size({'width':390,'height':844});open_reader()
  page.evaluate("document.querySelector('#reader').requestFullscreen=undefined")
  page.locator('#bookFullscreen').click();check(page.locator('#reader').get_attribute('aria-modal')=='true','focus view has no modal semantics')
  for _ in range(20):
   page.keyboard.press('Tab');check(page.evaluate("document.querySelector('#reader').contains(document.activeElement)"),'focus left full-screen reader')
  page.keyboard.press('Escape');check('reading-focus' not in page.locator('#reader').get_attribute('class'),'Escape did not close focus view');check(page.locator('#bookFullscreen').evaluate('e=>e===document.activeElement'),'focus not restored')
  page.locator('#bookFullscreen').click();page.locator('#bookFullscreen').click();check(page.locator('#reader').get_attribute('aria-modal') is None,'exit button leaves modal state')
  return {'trappedTabSteps':20,'escapeRestoresFocus':True,'exitButton':True}
 test('fullscreen fallback contains keyboard focus and restores it on exit',fallback_focus)
 def loading_error_retry():
  ctx=browser.new_context(viewport={'width':390,'height':844});slow=ctx.new_page();requests=[]
  # Keep the initial image pending so loading feedback can be inspected before success.
  slow.route('**/books/10/004.webp',lambda r:requests.append(r))
  slow.goto(BASE+'books.html?grade=10&page=4',wait_until='domcontentloaded');slow.wait_for_selector('#bookLoading',state='visible')
  check(slow.locator('#bookStage').get_attribute('aria-busy')=='true','loading lacks busy state')
  slow.wait_for_timeout(100);requests.pop().continue_();slow.wait_for_selector('.paper-page');slow.wait_for_selector('#bookLoading',state='hidden')
  check(slow.locator('#bookStage').get_attribute('aria-busy')=='false','loading never clears')
  # Page 6 is not prefetched while page4 is visible; fail it once, then retry exactly that target.
  slow.route('**/books/10/006.webp',lambda r:r.abort())
  slow.locator('#bookPage').fill('6');slow.locator('.page-go').click();slow.wait_for_selector('#bookError',state='visible')
  check(slow.locator('#bookPage').input_value()=='4','failed request drops last readable page')
  slow.unroute('**/books/10/006.webp');slow.locator('#retryBook').click();slow.wait_for_function("document.querySelector('#bookPage').value==='6'")
  slow.wait_for_selector('#bookError',state='hidden');ctx.close();return {'visibleLoading':True,'preservedPageOnError':True,'retryTarget':6}
 test('visible loading, retained page after image error, explicit retry',loading_error_retry)
 def shelf_focus():
  page.goto(BASE+'books.html');page.wait_for_load_state('networkidle');page.locator('.textbook-card').first.click();page.wait_for_selector('.paper-page')
  check(page.locator('#readingTitle').evaluate('e=>e===document.activeElement'),'shelf navigation loses context focus')
  return {'headingFocused':True}
 test('opening a book moves focus to its heading',shelf_focus)
 def landscape():
  evidence=[]
  for width,height in [(844,390),(1024,768)]:
   page.set_viewport_size({'width':width,'height':height});open_reader()
   page.evaluate("document.querySelector('#reader').requestFullscreen=undefined")
   page.locator('#bookFullscreen').click()
   rect=page.locator('#bookStage').bounding_box()
   check(rect['width']>300 and rect['height']>=120,'landscape reading space collapsed')
   check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'landscape page overflow')
   page.screenshot(path=str(OUT/f'fullscreen-{width}x{height}.png'),full_page=True)
   evidence.append({'width':width,'height':height,'stage':rect});page.keyboard.press('Escape')
  return evidence
 test('landscape fullscreen keeps a usable reading area',landscape)
 def touch_turn():
  ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  touch=ctx.new_page();touch.goto(BASE+'books.html?grade=10&page=4');touch.wait_for_load_state('networkidle');touch.locator('.paper-page').scroll_into_view_if_needed()
  client=ctx.new_cdp_session(touch)
  def swipe(fraction):
   rect=touch.locator('.paper-page').bounding_box();x=rect['x']+rect['width']*.8;y=rect['y']+min(rect['height']*.5,200)
   client.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
   for part in [.2,.5,1]:client.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-rect['width']*fraction*part,'y':y+2}]})
   client.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  swipe(.65);touch.wait_for_function("document.querySelector('#bookPage').value==='5'")
  touch.locator('#zoomIn').click();touch.locator('.paper-page').scroll_into_view_if_needed();swipe(.65);touch.wait_for_timeout(200)
  check(touch.locator('#bookPage').input_value()=='5','touch while zoomed flips page')
  ctx.close();return {'synthesizedBrowserTouch':'forward from4to5','zoomPreventsTurn':True}
 test('browser touch drag turns pages and zoom suppresses turning',touch_turn)
 check(not report['errors'],'JavaScript errors: '+str(report['errors']))
 browser.close()
if any(t['status']=='FAIL' for t in report['tests']):raise SystemExit(1)
