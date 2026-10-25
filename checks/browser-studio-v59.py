"""Optional studio layout/fullscreen and cold-library formula keyboard tests.

Run with a dist HTTP server at localhost:4173 and Python Playwright/Chromium.
Cold library uses an isolated context: after visiting a lab, thumbnail images
replace formula previews asynchronously and are a different interaction state.
"""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
Path('work/studio-v59').mkdir(parents=True,exist_ok=True)
report={'scope':'Chromium SwiftShader, viewport simulation','layouts':[],'keyboard':[],'errors':[]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:report['errors'].append(str(e)))
 for width in [1280,1440,1920,390]:
  page.set_viewport_size({'width':width,'height':900 if width>620 else 844});page.goto('http://127.0.0.1:4173/#lab/electric');page.wait_for_load_state('networkidle');page.wait_for_selector('#visual canvas');page.wait_for_timeout(350)
  item=page.evaluate('''()=>{const p=document.querySelector('.transport'),m=document.querySelector('#visual'),box=p.getBoundingClientRect();return {width:innerWidth,transport:box.toJSON(),modelTop:m.getBoundingClientRect().top,controls:[...p.children].filter(e=>e.getBoundingClientRect().width>0).map(e=>({id:e.id||e.dataset.action||e.className,rect:e.getBoundingClientRect().toJSON()})),overflow:document.documentElement.scrollWidth>innerWidth+1}}''')
  assert not item['overflow'];report['layouts'].append(item)
  if width==1440:page.screenshot(path='work/studio-v59/after-lab-1440.png')
  if width>620:
   row=[x for x in item['controls'] if x['id']!='activityLabel'];assert max(x['rect']['top'] for x in row)-min(x['rect']['top'] for x in row)<=2,'desktop controls wrapped'
  page.locator('.view-menu>summary').click();page.locator('[data-action=fullscreen]').click();page.wait_for_timeout(200)
  assert page.evaluate('!!document.fullscreenElement||!!document.querySelector(".stage-shell.is-fullscreen")');page.evaluate('document.fullscreenElement?document.exitFullscreen():null');page.keyboard.press('Escape');page.wait_for_timeout(200)
 cold=b.new_context(viewport={'width':320,'height':844});page=cold.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
 for width in [320,390]:
  page.set_viewport_size({'width':width,'height':844});page.goto('http://127.0.0.1:4173/#library');page.wait_for_load_state('networkidle');page.wait_for_function("document.querySelectorAll('.math-formula.has-katex').length===24")
  for id in ['oscillation','wave','electric']:
   page.bring_to_front();card=page.locator(f'.card-image[data-thumb={id}]');card.focus();page.wait_for_timeout(500);before=card.evaluate('(e)=>({x:e.scrollLeft,w:e.clientWidth,full:e.scrollWidth,math:e.querySelector(".math-tex").scrollWidth,mathClient:e.querySelector(".math-tex").clientWidth,overflow:getComputedStyle(e.querySelector(".math-tex")).overflowX})')
   assert card.evaluate('(e)=>e===document.activeElement'), 'preview must own keyboard focus';page.keyboard.press('ArrowRight');page.wait_for_function('(e)=>e.scrollLeft>0',arg=card.element_handle(),timeout=2000) if before['full']>before['w']+2 else None;after=card.evaluate('(e)=>e.scrollLeft')
   if before['full']>before['w']+2:assert after>0,f'focused preview does not scroll {width}/{id}: {before}'
   page.keyboard.press('End');assert card.evaluate('(e)=>e.scrollLeft>=e.scrollWidth-e.clientWidth-1');page.keyboard.press('Home');assert card.evaluate('(e)=>e.scrollLeft')==0
   assert before['overflow']=='visible';report['keyboard'].append({'width':width,'id':id,**before,'scrollAfterArrowRight':after})
  if width==390:page.screenshot(path='work/studio-v59/after-library-390.png')
 b.close()
Path('work/studio-v59/report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
