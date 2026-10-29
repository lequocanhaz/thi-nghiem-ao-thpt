"""Serve dist on localhost:4173; Chromium viewports only, not hardware Safari."""
from playwright.sync_api import sync_playwright
from pathlib import Path
OUT=Path('work/v67/final');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright()as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for w in [320,375,390,414,430,768,1024,1440,1920]:
  page=b.new_page(viewport={'width':w,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:4173/#lab/oscillation',wait_until='networkidle');page.wait_for_selector('#shmPhaseSlider');page.wait_for_selector('#visual canvas')
  assert page.locator('.stage-viewport>#shmCirclePanel').count()==1
  slider=page.locator('#shmPhaseSlider');slider.fill('90');slider.dispatch_event('input');assert abs(float(page.locator('[data-shm-h]').get_attribute('cx'))-180)<.01
  page.locator('[data-action="record"]').first.click();before=page.evaluate('localStorage.getItem("thpt-lab-v1")')
  page.locator('#appearanceToggle').click();assert page.locator('html').get_attribute('data-appearance')=='dark';assert before==page.evaluate('localStorage.getItem("thpt-lab-v1")')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),w
  page.locator('[data-locale="en-US"]').click();assert 'Rotating' in page.locator('.shm-circle-svg').get_attribute('aria-label')
  if w in [390,1440]:page.locator('.stage-shell').screenshot(path=str(OUT/f'stage-{w}.png'))
  beforeX=page.locator('[data-shm-m]').get_attribute('cx');page.locator('#play').click();page.wait_for_timeout(350);assert page.locator('[data-shm-m]').get_attribute('cx')!=beforeX;page.locator('#play').click()
  page.locator('#appearanceToggle').click();page.reload(wait_until='networkidle');assert page.locator('html').get_attribute('data-appearance')=='light'
  assert not errors,errors
  print('PASS',w,flush=True);page.close()
 b.close()
