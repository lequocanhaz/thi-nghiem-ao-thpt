"""Native Chromium checks for Quanh Lab workspace destinations and disclosure.
No AI calls. Viewport emulation does not certify physical iPhone/Safari.
"""
import argparse,json,os,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/ux76/qa');ap.add_argument('--smoke-only',action='store_true');ap.add_argument('--deep-only',action='store_true');ap.add_argument('--deep-ids',nargs='+',default=['ohm','oscillation','electric','lens']);args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'viewports':[],'deep':[],'errors':[],'httpErrors':[],'limits':['Chromium/SwiftShader viewport emulation, not real Safari/iPhone/Android or virtual keyboards.','No AI inference or teacher/scientific acceptance.']}
files=['dist/app.js','dist/views.js','dist/product-ux-v76.css']
def hashes():return {p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in files}
report['sourceStart']=hashes()
def session(page,id):return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)
def show_details(page,sel):
 d=page.locator(sel)
 if d.get_attribute('open') is None:d.locator(':scope>summary').click()
def ancestors(loc):
 for d in loc.locator('xpath=ancestor::details').all():
  if d.get_attribute('open') is None:d.locator(':scope>summary').click()
def no_overflow(page):assert page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth'),'Document overflow'
def navigate(page,id):
 page.goto(args.base+'#lab/'+id,wait_until='networkidle');page.locator('.inquiry-workbook').wait_for(state='attached')
 page.locator('.shm-circle-svg' if id=='oscillation' else '#visual canvas').first.wait_for(timeout=60000)
def mobile_jump(page,action):page.locator('.workspace-toolbar [data-action="'+action+'"]').click()
def data_open(page,width):
 b=page.locator('.workspace-toolbar [data-action=toggle-dock]')
 if width<=620:b.click()
 elif not page.locator('#researchPanel').is_visible():b.click()
 page.locator('#researchPanel').wait_for(state='visible');page.locator('.work-tabs [data-panel=data]').click()
def checkrows(page,id,rows):assert session(page,id)['rows']==rows,'Recorded rows changed unexpectedly'
def tools(page):
 for sel in ['.playback-options','.view-menu']:
  d=page.locator(sel)
  if d.count() and d.get_attribute('open') is not None and d.locator(':scope>summary').is_visible():d.locator(':scope>summary').click()
 show_details(page,'.view-menu')
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 def context(width,theme):
  ctx=browser.new_context(viewport={'width':width,'height':844 if width<621 else 1000},is_mobile=width<621,has_touch=width<621,accept_downloads=True,reduced_motion='reduce')
  ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1','{theme}');localStorage.setItem('quanh.locale.v1','vi-VN')")
  page=ctx.new_page();page.set_default_timeout(45000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
  page.on('response',lambda r:report['httpErrors'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  return ctx,page
 if not args.deep_only:
  for n,width in enumerate([320,375,390,414,430,768,1024,1440,1920]):
   ctx,page=context(width,'dark' if n%2 else 'light');case={'width':width}
   try:
    navigate(page,'ohm');no_overflow(page)
    bar=page.locator('.workspace-toolbar');case['bar']=bar.bounding_box()
    case['playY']=page.locator('#play').bounding_box()['y']
    if width<=620:
     r=page.locator('#play').bounding_box();assert r['y']+r['height']<=case['bar']['y'],'Play is behind fixed bar or below initial screen'
    if width<=620:
     assert not page.locator('.playback-options').get_attribute('open'),'Phone options start expanded'
     for action in ['workspace-model','toggle-controls','toggle-dock']:
      button=page.locator('.workspace-toolbar [data-action="'+action+'"]');r=button.bounding_box();assert r and r['height']>=44 and r['width']>=44,(action,r)
     mobile_jump(page,'toggle-controls');assert page.locator('#controlsPanel').is_visible()
     assert page.locator('.control-heading h2').evaluate('e=>document.activeElement===e'),'Parameters focus missing'
     mobile_jump(page,'toggle-controls');assert page.locator('#controlsPanel').is_visible(),'Repeated params destination closed panel'
     mobile_jump(page,'toggle-dock');assert page.locator('#researchPanel').is_visible()
     mobile_jump(page,'toggle-dock');assert page.locator('#researchPanel').is_visible(),'Repeated data destination closed panel'
     assert page.locator('#researchPanel .dock-title h2').evaluate('e=>document.activeElement===e'),'Data focus missing'
     for tab in page.locator('.work-tabs button').all():
      r=tab.bounding_box();assert r['x']>=0 and r['x']+r['width']<=width+1,'Tab clipped'
     mobile_jump(page,'workspace-model');assert page.locator('.stage-top').evaluate('e=>document.activeElement===e'),'Model focus missing'
     show_details(page,'.playback-options');page.locator('#speed').select_option('.5');page.keyboard.press('Escape');assert page.locator('.playback-options').get_attribute('open') is None
    else:assert page.locator('.playback-options').get_attribute('open') is not None,'Desktop options closed'
    no_overflow(page);case['status']='PASS';page.screenshot(path=str(out/f'smoke-{width}.png'))
   except Exception as e:case.update(status='FAIL',error=str(e),trace=traceback.format_exc());page.screenshot(path=str(out/f'failure-smoke-{width}.png'))
   report['viewports'].append(case);ctx.close();(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(case,flush=True)
 if not args.smoke_only:
  for id,width,theme in [('ohm',390,'light'),('oscillation',390,'dark'),('electric',1440,'dark'),('lens',1440,'light')]:
   if id not in args.deep_ids:continue
   ctx,page=context(width,theme);case={'id':id,'width':width,'theme':theme}
   try:
    navigate(page,id)
    # Real running state, one explicit step and one record.
    page.locator('#play').click();page.wait_for_timeout(160);page.locator('#play').click()
    if width>620:
     page.locator('.lab-heading h1').click();page.locator('#speed').focus();page.keyboard.press('Escape')
     assert page.locator('.playback-options').get_attribute('open') is not None,'Desktop options dismissed'
     for sel in ['#speed','#time','[data-action=step]']:assert page.locator(sel).first.is_visible(),'Desktop playback control hidden: '+sel
    if width<=620:show_details(page,'.playback-options')
    page.locator('[data-action=step]').first.click()
    if width<=620:page.keyboard.press('Escape')
    page.locator('[data-action=record]').first.click();rows=session(page,id)['rows'];assert len(rows)==1,'No record'
    if width<=620:mobile_jump(page,'toggle-controls')
    num=page.locator('#controlsPanel [data-number]').first;ancestors(num);num.fill(num.input_value());num.press('Tab');checkrows(page,id,rows)
    data_open(page,width);page.locator('.work-tabs [data-panel=tasks]').click();note='UX76 preserve notebook <script>test</script>'
    page.locator('#notes').fill(note);page.locator('#notes').press('Tab');page.locator('.work-tabs [data-panel=data]').click();checkrows(page,id,rows)
    with page.expect_download() as download:page.locator('[data-action=csv]').click()
    csv=out/f'{id}-{width}.csv';download.value.save_as(csv);assert csv.stat().st_size>10
    if width<=620:mobile_jump(page,'workspace-model')
    for locale in ['en-US','vi-VN']:
     page.locator('[data-locale="'+locale+'"]').click();checkrows(page,id,rows);assert session(page,id)['notes']==note
    # Both model representations and actual image export remain available.
    for mode in ['2d','3d']:
     page.locator('[data-projection="'+mode+'"]').click();checkrows(page,id,rows)
    if id=='oscillation':page.locator('[data-shm-linked]').click()
    tools(page)
    with page.expect_download() as download:page.locator('[data-action=png]').click()
    png=out/f'{id}-{width}.png';download.value.save_as(png);assert png.read_bytes()[:8]==b'\x89PNG\r\n\x1a\n'
    # Fullscreen fallback traps keyboard focus and hides the fixed workspace bar.
    page.evaluate('()=>document.querySelector(".stage-shell").requestFullscreen=undefined');tools(page);page.locator('[data-action=fullscreen]').click()
    assert page.locator('.stage-shell').evaluate('e=>e.classList.contains("is-fullscreen")')
    for key in ['Tab']*50+['Shift+Tab']*50:
     page.keyboard.press(key);assert page.evaluate('()=>!!document.activeElement.closest(".stage-shell")'),'Fullscreen focus escaped'
    if width<=620:assert page.locator('.workspace-toolbar').is_hidden(),'Fixed bar overlays fullscreen'
    page.keyboard.press('Escape');assert not page.locator('.stage-shell').evaluate('e=>e.classList.contains("is-fullscreen")')
    # Opening chat is local-only; never submit a provider request.
    page.locator('#openAssistant').click();page.locator('#aiAssistant').wait_for(state='visible')
    if width<=620:assert page.locator('.workspace-toolbar').is_hidden(),'Fixed bar overlays chat'
    page.locator('[data-ai=close]').click();checkrows(page,id,rows)
    show_details(page,'.study-mode-menu');page.locator('[data-mode=present]').click();assert page.locator('.lab').get_attribute('data-layout')=='present'
    page.locator('[data-action=exit-present]').click();assert page.locator('.lab').get_attribute('data-layout')!='present';checkrows(page,id,rows)
    page.reload(wait_until='networkidle');page.locator('.inquiry-workbook').wait_for(state='attached');checkrows(page,id,rows);assert session(page,id)['notes']==note
    if width==390:
     page.set_viewport_size({'width':768,'height':1000});assert page.locator('.playback-options').get_attribute('open') is not None
     page.set_viewport_size({'width':390,'height':844});assert page.locator('.playback-options').get_attribute('open') is None
    no_overflow(page);page.screenshot(path=str(out/f'deep-{id}-{width}.png'));case.update(status='PASS',rowsNotesPreserved=True,csv=True,png=True,fullscreenTabs=100,chatLocalOnly=True)
   except Exception as e:case.update(status='FAIL',error=str(e),trace=traceback.format_exc());page.screenshot(path=str(out/f'failure-deep-{id}-{width}.png'))
   report['deep'].append(case);ctx.close();(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(case,flush=True)
 browser.close()
report['sourceEnd']=hashes();report['sourceStable']=report['sourceStart']==report['sourceEnd'];report['passed']=all(c['status']=='PASS' for c in report['viewports']+report['deep']) and not report['errors'] and not report['httpErrors']
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'passed':report['passed'],'sourceStable':report['sourceStable'],'errors':report['errors'],'httpErrors':report['httpErrors']}));raise SystemExit(0 if report['passed'] else 1)
