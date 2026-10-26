"""Readable relation and live marker QA. Serve dist on port4173 first.
Chromium viewports only; no hardware/iOS Safari claim.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('work/optics-v65/observation');OUT.mkdir(parents=True,exist_ok=True)
report=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width in [320,390,1440]:
  page=browser.new_page(viewport={'width':width,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4173/#lab/vector_sum',wait_until='networkidle');page.wait_for_selector('#conceptObservation svg')
  marker=page.locator('.observation-current');assert marker.is_visible()
  assert page.locator('.observation-curve').get_attribute('d'),'Angle must be a continuous theoretical curve'
  previous=marker.get_attribute('cx');page.evaluate('window.__obsSvg=document.querySelector(".observation-chart")')
  page.locator('.controls details.advanced>summary').click();field=page.locator('[data-number="angle"]');field.fill('90');field.press('Tab');page.wait_for_function('document.querySelector(".observation-current").getAttribute("cx")!=='+json.dumps(previous))
  assert page.evaluate('window.__obsSvg===document.querySelector(".observation-chart")'),'Input point update replaced the graph/focus'
  assert marker.is_visible()
  for locale in ['vi-VN','en-US']:
   page.locator('[data-locale="'+locale+'"]').click();page.wait_for_timeout(120)
   assert page.locator('.observation-current').is_visible()
   assert page.locator('#conceptObservation').get_attribute('aria-label').startswith('Observe' if locale=='en-US' else 'Quan sát')
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
   page.locator('#conceptObservation').screenshot(path=str(OUT/f'plot-{width}-{locale}.png'))
  page.locator('.observation-values>summary').click();page.wait_for_function('document.querySelectorAll(".observation-values tbody tr").length>10')
  page.goto('http://127.0.0.1:4173/#lab/charge_quantization',wait_until='networkidle');page.wait_for_selector('#conceptObservation svg')
  assert page.locator('.observation-curve').get_attribute('d')==''
  assert page.locator('.observation-samples circle').count()>10
  assert page.locator('.observation-current').is_visible()
  page.goto('http://127.0.0.1:4173/#lab/potential_pair',wait_until='networkidle');page.wait_for_selector('#conceptObservation svg')
  assert page.locator('.observation-curve').get_attribute('d').count('M')==2,'Undefined charge position was bridged'
  advanced=page.locator('.controls details.advanced')
  if advanced.count() and not advanced.evaluate('e=>e.open'):advanced.locator('summary').first.click()
  field=page.locator('[data-number="distance"]');field.fill('0.15');field.press('Tab');page.wait_for_timeout(150)
  assert not page.locator('.observation-current').is_visible(),'Pole cannot have a fabricated finite marker'
  field.fill('1');field.press('Tab');page.wait_for_timeout(150);assert page.locator('.observation-current').is_visible()
  page.locator('[data-locale="en-US"]').click();page.wait_for_timeout(150)
  assert 'Probe x-coordinate' in page.locator('.observation-axis-labels').inner_text()
  assert 'Total potential' in page.locator('.observation-axis-labels').inner_text()
  page.locator('#conceptObservation').screenshot(path=str(OUT/f'potential-gap-{width}.png'))
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+2')
  assert not errors,errors
  report.append({'width':width,'continuousAngle':True,'discreteCharge':True,'currentPointVisibleAndMoves':True,'SVGStable':True,'VI_EN':True,'tableAvailable':True,'dipolePoleGap':True,'undefinedMarkerHidden':True,'humanEnglishAxes':True,'pageErrors':errors})
  print('PASS observation',width,flush=True);page.close()
 browser.close()
(OUT/'report.json').write_text(json.dumps(report,indent=2))
