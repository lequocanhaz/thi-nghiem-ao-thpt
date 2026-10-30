"""Serve dist at127.0.0.1:4173. Chromium/SwiftShader QA; no physical Safari claim."""
import argparse,hashlib,json,math,re,time,traceback
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
from PIL import Image
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--out',type=Path,default=Path('work/v69/qa'))
parser.add_argument('--base',default='http://127.0.0.1:4173/')
parser.add_argument('--deep-only',action='store_true')
parser.add_argument('--deep-widths',nargs='+',type=int,default=[390,1440])
args=parser.parse_args();OUT=args.out;OUT.mkdir(parents=True,exist_ok=True)
SOURCES=['dist/app.js','dist/views.js','dist/shm-circle.js','dist/shm-circle.css','dist/studio-v69.css','dist/appearance-v67.js','dist/studio-export-v69.js']
def hashes():return {f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in SOURCES}
REPORT={'scope':'Chromium/SwiftShader simulated viewports; mouse, keyboard and CDP touch. No physical Safari/iPhone/Android, OAuth or GPU/FPS claim.','sourceStart':hashes(),'viewports':[],'deep':[],'errors':[],'consoleErrors':[],'httpErrors':[],'externalRequests':[]}
def check(ok,message):
 if not ok:raise AssertionError(message)
def close(a,b,message,tol=1e-6):check(abs(a-b)<=tol,f'{message}: {a} != {b}')
def session(page):return page.evaluate('JSON.parse(localStorage.getItem("thpt-lab-v1")).oscillation')
def data(page):
 s=session(page);return {k:s[k] for k in ['state','rows','notes']}
def open_details(page,selector):
 loc=page.locator(selector)
 if loc.get_attribute('open') is None:loc.locator(':scope>summary').click()
def number(page,key,value):
 field=page.locator(f'.controls [data-number="{key}"]')
 for detail in field.locator('xpath=ancestor::details').all():
  if detail.get_attribute('open') is None:detail.locator(':scope>summary').click()
 field.fill(str(value));field.press('Tab')
def seek_time(page,value):
 open_details(page,'.playback-options');loc=page.locator('#time');loc.fill(str(value));loc.dispatch_event('input');page.locator('.playback-options>summary').click()
def point(page):return page.locator('[data-shm-m]').get_attribute('cx')
def geometry(page):
 q=page.evaluate('''()=>{const p=s=>document.querySelector(s),vec=s=>['x1','y1','x2','y2'].map(k=>+p(s).getAttribute(k));return {m:[+p('[data-shm-m]').getAttribute('cx'),+p('[data-shm-m]').getAttribute('cy')],h:[+p('[data-shm-h]').getAttribute('cx'),+p('[data-shm-h]').getAttribute('cy')],cart:p('[data-shm-cart]').getAttribute('transform'),drop:vec('[data-shm-model-drop]'),projected:vec('[data-shm-projected-v]'),tangent:vec('[data-shm-tangent]'),phase:p('[data-shm-phase-text]').textContent,values:['x','v','a'].map(k=>p('[data-shm-'+k+']').textContent)};}''')
 s=session(page)['state'];phi=2*math.pi*s['t']/s['period'];x=s['a']*math.cos(phi);v=-s['a']*2*math.pi/s['period']*math.sin(phi);a=-(2*math.pi/s['period'])**2*x
 xy=[float(v) for v in re.findall(r'-?\d+(?:\.\d+)?',q['cart'])]
 close(q['m'][0],180+104*x/s['a'],'M x from physics');close(q['m'][1],156-104*math.sin(phi),'M y')
 close(xy[0],q['h'][0],'Cart and H same x');close(xy[0],q['m'][0],'Cart and M same x');close(xy[1],342,'Cart baseline')
 close(q['projected'][2]-q['projected'][0],q['tangent'][2]-q['tangent'][0],'Velocity orthogonal projection')
 for value,expected,name in zip(q['values'],[x,v,a],['x','v','a']):close(float(value.split()[0].replace(',','.')),expected,'Displayed '+name,.006)
 return q

def observe(page):
 page.on('request',lambda r:REPORT['externalRequests'].append(r.url) if urlsplit(r.url).scheme in ['http','https'] and urlsplit(r.url).netloc!=urlsplit(args.base).netloc else None)
 page.on('pageerror',lambda e:REPORT['errors'].append(str(e)))
 page.on('console',lambda m:REPORT['consoleErrors'].append(m.text) if m.type=='error' else None)
 page.on('response',lambda r:REPORT['httpErrors'].append({'url':r.url,'status':r.status}) if r.status>=400 else None)
def navigate(page):
 page.goto(args.base+'#lab/oscillation',wait_until='networkidle');page.wait_for_selector('[data-shm-cart]')
 check(page.locator('.stage-shell').get_attribute('data-shm-view')=='linked','Default presentation is not linked')
 check(page.locator('#visual').is_hidden(),'WebGL host visible over linked view')
 check(page.locator('[data-shm-linked]').get_attribute('aria-pressed')=='true','Linked button inactive')
 check(not page.evaluate(r'performance.getEntriesByType("resource").some(e=>/scene3d|three\.module/.test(e.name))'),'Default linked view downloaded WebGL')
def overflow(page):check(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal document overflow')
def phase(page,degree):
 slider=page.locator('#shmPhaseSlider');slider.fill(str(degree));slider.dispatch_event('input');geometry(page)
def record_note(page):
 page.locator('[data-action="record"]').first.click();page.locator('.work-tabs [data-panel="tasks"]').click();page.locator('#notes').fill('v69 QA: preserve this notebook.');page.locator('.work-tabs [data-panel="data"]').click()
 s=session(page);check(len(s['rows'])==1,'Recorded row missing');check(s['notes']=='v69 QA: preserve this notebook.','Notebook missing');return s

def pointer_drag(page):
 svg=page.locator('.shm-circle-svg');svg.scroll_into_view_if_needed()
 points=svg.evaluate('''s=>{const m=s.getScreenCTM();return [[290,156],[180,46]].map(([x,y])=>{const p=new DOMPoint(x,y).matrixTransform(m);return{x:p.x,y:p.y}})}''')
 page.mouse.move(points[0]['x'],points[0]['y']);page.mouse.down();page.mouse.move(points[1]['x'],points[1]['y'],steps=10);page.mouse.up();close(float(page.locator('#shmPhaseSlider').input_value()),90,'Mouse quarter-phase drag',1)
def touch_drag(page,ctx):
 svg=page.locator('.shm-circle-svg');svg.scroll_into_view_if_needed()
 points=svg.evaluate('''s=>{const m=s.getScreenCTM();return Array.from({length:13},(_,j)=>{const a=j/12*Math.PI/2,p=new DOMPoint(180+110*Math.cos(a),156-110*Math.sin(a)).matrixTransform(m);return{x:p.x,y:p.y}})}''')
 cdp=ctx.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[points[0]]})
 for p in points[1:]:cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[p]})
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});close(float(page.locator('#shmPhaseSlider').input_value()),90,'CDP quarter-phase drag',1)

def connect_viewer(page):
 page.evaluate(r'''async()=>{const u=performance.getEntriesByType('resource').find(e=>/\/scene3d\.js(?:\?|$)/.test(e.name)).name;const{LabScene}=await import(u);const original=LabScene.prototype.zoom;LabScene.prototype.zoom=function(...a){window.__studioQaViewer=this;LabScene.prototype.zoom=original;return original.apply(this,a);};}''')
 page.locator('[data-action="zoom-in"]').click();page.wait_for_function('()=>!!window.__studioQaViewer?.model')
def viewer_info(page):return page.evaluate('''()=>{const v=window.__studioQaViewer,g=v.renderer.getContext();return {state:{...v.state},webgl:!!g&&!g.isContextLost(),projection:v.projection,cart:v.model.group.getObjectByName('motion-cart').position.x,camera:v.camera.position.toArray(),target:v.controls.target.toArray()};}''')
def menus(page):
 open_details(page,'.playback-options');page.keyboard.press('Escape')
 check(page.locator('.playback-options').get_attribute('open') is None,'Escape left time options open')
 check(page.locator('.playback-options>summary').evaluate('e=>e===document.activeElement'),'Escape did not restore time-option focus')
 open_details(page,'.playback-options');page.locator('.study-mode-menu>summary').click()
 check(page.locator('.playback-options').get_attribute('open') is None,'Study menu did not close time options')
 page.keyboard.press('Escape');check(page.locator('.study-mode-menu').get_attribute('open') is None,'Escape left study menu open')
 check(page.locator('.study-mode-menu>summary').evaluate('e=>e===document.activeElement'),'Escape did not restore study-menu focus')
 open_details(page,'.playback-options');page.locator('.view-menu>summary').click()
 check(page.locator('.playback-options').get_attribute('open') is None,'Tools menu did not close time options')
 page.locator('.view-menu>summary').click()

def png(page,width):
 page.locator('.view-menu>summary').click()
 with page.expect_download() as d:page.locator('[data-action="png"]').click()
 file=OUT/f'linked-export-{width}.png';d.value.save_as(file);im=Image.open(file).convert('RGB');check(im.size==(720,828),'PNG dimensions do not match actual linked SVG')
 q=geometry(page);cart_x=float(re.findall(r'-?\d+(?:\.\d+)?',q['cart'])[0])*2
 pixels=list(im.crop((int(cart_x-24),654,int(cart_x+24),700)).getdata());colored=sum(1 for r,g,b in pixels if b>100 and b>r*1.2 and b>g*1.1)
 check(colored>500,'PNG does not contain the current blue spring mass');return {'path':str(file),'size':im.size,'cartBluePixels':colored,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}

with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 REPORT['browser']=browser.version
 if not args.deep_only:
  for width in [320,375,390,414,430,768,1024,1440,1920]:
   ctx=browser.new_context(viewport={'width':width,'height':1000},service_workers='block');page=ctx.new_page();observe(page)
   try:
    navigate(page);phase(page,60);geometry(page);record_note(page);saved=session(page)
    for locale in ['en-US','vi-VN']:
     page.locator(f'[data-locale="{locale}"]').click();check(session(page)==saved,'Locale changed scientific session')
     before=page.locator('html').get_attribute('data-appearance');page.locator('#appearanceToggle').click();check(page.locator('html').get_attribute('data-appearance')!=before,'Theme unchanged');check(session(page)==saved,'Theme changed scientific session')
    overflow(page);before=point(page);page.locator('#play').click();page.wait_for_function('x=>document.querySelector("[data-shm-m]").getAttribute("cx")!==x',arg=before,timeout=8000);page.locator('#play').click();geometry(page)
    before=session(page);page.reload(wait_until='networkidle');page.wait_for_selector('[data-shm-cart]');check(session(page)==before,'Reload changed scientific session');overflow(page)
    if width in [390,1440]:page.locator('.stage-shell').screenshot(path=str(OUT/f'linked-stage-{width}.png'))
    REPORT['viewports'].append({'width':width,'status':'PASS','defaultNoWebGLDownload':True,'geometry':True,'rowsNotesPreserved':True,'localeThemeReload':True,'playback':True,'overflow':False});print('PASS viewport',width,flush=True)
   except Exception as e:REPORT['viewports'].append({'width':width,'status':'FAIL','error':str(e),'trace':traceback.format_exc()});print('FAIL viewport',width,str(e),flush=True)
   finally:ctx.close();(OUT/'report.json').write_text(json.dumps(REPORT,indent=2,ensure_ascii=False))
 for width in args.deep_widths:
  ctx=browser.new_context(viewport={'width':width,'height':1000},has_touch=width==390,is_mobile=width==390,accept_downloads=True,service_workers='block');page=ctx.new_page();observe(page)
  case={'width':width,'status':'FAIL'}
  try:
   navigate(page);number(page,'a',7);number(page,'period',3);phase(page,60);record_note(page);rows=session(page)['rows'];notes=session(page)['notes']
   cases=[]
   for degree,expected in [(0,18),(90,18.75),(180,19.5),(270,17.25),(360,18)]:
    seek_time(page,20);page.locator(f'[data-shm-phase="{degree}"]').click();close(session(page)['state']['t'],expected,'End-cycle time');geometry(page);cases.append({'degrees':degree,'time':expected})
   seek_time(page,20);phase(page,359);close(session(page)['state']['t'],15+359/360*3,'Near-end slider')
   pointer_drag(page);slider=page.locator('#shmPhaseSlider');slider.focus();slider.press('Home');slider.press('ArrowRight');check(slider.input_value()=='1','Keyboard phase slider did not advance')
   if width==390:touch_drag(page,ctx)
   menus(page);phase(page,60);image=png(page,width)
   # The user can still load and use the original WebGL model and camera.
   page.locator('[data-projection="3d"]').click();page.wait_for_selector('#visual canvas',timeout=60000);connect_viewer(page)
   check(page.locator('#shmCirclePanel').is_hidden(),'Linked controls remain focusable in model view');v=viewer_info(page);check(v['webgl'],'No actual WebGL renderer');close(v['cart'],.12*7*math.cos(2*math.pi*v['state']['t']/3),'WebGL physical spring cart')
   before=v['camera'];page.locator('[data-action="zoom-in"]').click();check(viewer_info(page)['camera']!=before,'3D camera did not zoom')
   page.locator('[data-projection="2d"]').click();check(viewer_info(page)['projection']=='2d','Orthographic 2D unavailable')
   before=data(page);page.locator('[data-shm-linked]').click();check(data(page)==before,'Returning linked changed data');check(page.locator('#visual').is_hidden(),'Hidden WebGL host is still visible')
   page.wait_for_function('()=>window.__studioQaViewer.visible===false');hidden_frame=page.evaluate('window.__studioQaViewer.renderer.info.render.frame');old=page.evaluate('window.__studioQaViewer.state.t');before=point(page);page.locator('#play').click();page.wait_for_function('x=>document.querySelector("[data-shm-m]").getAttribute("cx")!==x',arg=before,timeout=8000);page.locator('#play').click();close(page.evaluate('window.__studioQaViewer.state.t'),old,'Hidden WebGL updates continued');close(page.evaluate('window.__studioQaViewer.renderer.info.render.frame'),hidden_frame,'Hidden WebGL rendered frames');geometry(page)
   check(session(page)['rows']==rows and session(page)['notes']==notes,'Views/input/play changed row history/notebook')
   # Exercise CSS fullscreen fallback and its keyboard boundary under closed controls.
   page.evaluate('document.querySelector(".stage-shell").requestFullscreen=undefined')
   page.locator('.view-menu>summary').click();page.locator('[data-action="fullscreen"]').click();check(page.locator('.stage-shell').evaluate('e=>e.classList.contains("is-fullscreen")'),'Fullscreen fallback unavailable')
   focused=[]
   for key in ['Tab']*50+['Shift+Tab']*50:
    page.keyboard.press(key);check(page.evaluate('document.activeElement.closest(".stage-shell")!==null'),'Tab escaped fullscreen')
    check(page.evaluate('!!document.activeElement.getClientRects().length&&!document.activeElement.closest("[hidden]")'),'Fullscreen focused a hidden control')
    focused.append(page.evaluate('document.activeElement.tagName+":"+(document.activeElement.id||document.activeElement.getAttribute("aria-label")||document.activeElement.textContent.trim().slice(0,30))'))
   page.keyboard.press('Escape');check(not page.locator('.stage-shell').evaluate('e=>e.classList.contains("is-fullscreen")'),'Escape failed to leave fullscreen')
   page.locator('[data-locale="en-US"]').click();page.locator('#appearanceToggle').click();geometry(page);overflow(page);page.locator('.stage-shell').screenshot(path=str(OUT/f'linked-deep-{width}.png'))
   case.update(status='PASS',phaseCases=cases,pointer=True,keyboard=True,cdpTouch=width==390,webgl3D=True,model2D=True,cameraZoom=True,hiddenModelUpdatesStopped=True,fullscreenFocus=focused,rowsPreserved=True,notesPreserved=True,png=image)
   print('PASS deep',width,flush=True)
  except Exception as e:case.update(error=str(e),trace=traceback.format_exc());print('FAIL deep',width,str(e),flush=True)
  finally:REPORT['deep'].append(case);ctx.close();(OUT/'report.json').write_text(json.dumps(REPORT,indent=2,ensure_ascii=False))
 browser.close()
REPORT['sourceEnd']=hashes();REPORT['sourceStable']=REPORT['sourceStart']==REPORT['sourceEnd'];REPORT['passed']=all(t['status']=='PASS' for t in REPORT['viewports']+REPORT['deep']) and not any(REPORT[k] for k in ['errors','consoleErrors','httpErrors'])
(OUT/'report.json').write_text(json.dumps(REPORT,indent=2,ensure_ascii=False));print(json.dumps({k:REPORT[k] for k in ['passed','sourceStable','errors','consoleErrors','httpErrors']}))
raise SystemExit(0 if REPORT['passed'] else 1)
