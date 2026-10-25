"""Optional Chromium mobile chat checks; run against local server 4173.
All AI requests are intercepted; no provider/API credential is needed.
Artifacts: work/ai/. Not a real mobile/Safari or live inference test.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:4173/'
OUT=Path('work/ai');OUT.mkdir(parents=True, exist_ok=True)
report={'browser':'Chromium headless, emulated viewports; API transport mocked','tests':[],'errors':[],'limits':['Not real iPhone/Safari or Android hardware.','No live API request or inference.','Virtual keyboard layout covered by viewport fixtures, not OS keyboard.']}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 context.add_init_script("localStorage.setItem('quanh.locale.v1','en-US')")
 page=context.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 requests=[];reply={'error':False}
 def guard(route):
  url=route.request.url
  if url.startswith(BASE):
   route.continue_()
  elif '/api/chat' in url:
   if route.request.method=='OPTIONS':
    route.fulfill(status=204,headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'});return
   requests.append(route.request.post_data_json)
   route.fulfill(headers={'Access-Control-Allow-Origin':'*'},status=503 if reply['error'] else 200,content_type='application/json',body=json.dumps({'error':'Dịch vụ AI đang bận. Hãy thử lại sau.'} if reply['error'] else {'answer':'The current is $I = \\dfrac{U}{R} = 0.6\\,\\mathrm{A}$. This is a mocked test answer.'}))
  else: route.abort()
 page.route('**/*',guard)
 page.goto(BASE+'#lab/ohm',wait_until='networkidle')
 page.locator('#openAssistant').click();page.locator('#aiAssistant').wait_for(state='visible')
 page.locator('#aiAssistant').screenshot(path=str(OUT/'assistant-after-en-mobile.png'))
 assert page.locator('#aiTitle').inner_text()=='AI assistant'
 assert page.locator('.ai-compose button[type=submit]').inner_text()=='Send ↑'
 page.locator('#aiQuestion').fill('Line one');page.locator('#aiQuestion').press('Enter')
 assert page.locator('#aiQuestion').input_value()=='Line one\n'
 assert not requests
 page.locator('.ai-compose button[type=submit]').click()
 page.locator('.ai-message[data-role=assistant] .katex').wait_for()
 assert requests[-1]['locale']=='en-US'
 assert page.locator('#aiQuestion').input_value()==''
 assert page.locator('.ai-message[data-role=user]').get_attribute('aria-label')=='You'
 report['tests'].append({'name':'Mobile Enter adds newline; explicit Send uses EN; LaTeX typesets','status':'PASS'})
 reply['error']=True
 page.locator('#aiQuestion').fill('Keep my question')
 page.locator('.ai-compose button[type=submit]').click()
 page.locator('.ai-status[data-state=error]').wait_for(state='visible')
 assert 'could not answer' in page.locator('.ai-status').inner_text()
 assert page.locator('#aiQuestion').input_value()=='Keep my question'
 assert not page.locator('.ai-compose button[type=submit]').is_disabled()
 report['tests'].append({'name':'Failed request uses inline EN error and retains retryable draft','status':'PASS'})
 page.locator('#aiAssistant').screenshot(path=str(OUT/'assistant-error-en-mobile.png'))
 reply['error']=False
 page.locator('.ai-compose button[type=submit]').click()
 page.wait_for_function("document.querySelectorAll('.ai-message[data-role=assistant]').length===2 && !document.querySelector('.ai-pending')")
 assert page.locator('#aiQuestion').input_value()==''
 assert len(requests)==3
 assert page.locator('.ai-status').is_hidden()
 report['tests'].append({'name':'Retained draft sends successfully on retry','status':'PASS'})
 page.locator('[data-ai=close]').click()
 assert page.locator('#openAssistant').get_attribute('aria-expanded')=='false'
 assert page.locator('#openAssistant').evaluate('(el)=>document.activeElement===el')
 report['tests'].append({'name':'Close restores focus and expanded state','status':'PASS'})
 context.close()
 browser.close()
assert not report['errors'],report['errors']
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
