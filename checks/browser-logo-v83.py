"""Real logo-navigation and compact-home regression after the reported desktop bug.
Uses real links/history and a fresh local browser profile. No OAuth or AI requests are sent.
Chromium cache diagnostics use CDP; no request routing disables the browser cache.
"""
import argparse,json,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/logo-v83-qa/final');ap.add_argument('--engine',choices=['chromium','firefox','webkit'],default='chromium');ap.add_argument('--renderer',choices=['auto','diagram'],default='auto');ap.add_argument('--themes',nargs='+',default=['light','dark']);ap.add_argument('--geometry-sizes',nargs='+',default=['1920x1200','1901x1031','1520x824','320x568','390x844','844x390']);ap.add_argument('--journey-sizes',nargs='+',default=['1920x1200','390x844']);ap.add_argument('--only',nargs='+');ap.add_argument('--groups',nargs='+',default=['geometry','journeys','books']);args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'engine':args.engine,'rendererPreference':args.renderer,'cases':[],'pageErrors':[],'consoleErrors':[],'failedRequests':[],'httpErrors':[],'limits':['Headless desktop engines and emulated viewports are not physical iPhone/Android/Safari verification.','The1520x824 case approximates the CSS layout area at125% on a1900x1030 screen, not an actual browser-toolbar zoom operation.','Fresh browser profiles contain no production signed-in account. Account client identity and a sample email form draft are checked without submitting credentials.','Chat checks use unsent local drafts; no AI inference or message sending.','The optional diagram renderer is the existing application preference in a disposable test profile; this does not verify WebGL or device GPU rendering.']}
def verify(ok,message):
 if not ok:raise AssertionError(message)
def save():(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
def run_case(page,name,action):
 if args.only and name not in args.only:return
 try:report['cases'].append({'name':name,'status':'PASS','evidence':action() or {}});print('PASS',name,flush=True)
 except Exception as error:
  report['cases'].append({'name':name,'status':'FAIL','error':str(error),'trace':traceback.format_exc()});print('FAIL',name,str(error),flush=True)
 finally:
  try:page.screenshot(path=str(out/(name+'.png')))
  except Exception as error:report['cases'][-1]['screenshotError']=str(error)
  save()
def ready(page,home=False):
 page.wait_for_selector('.shared-header-v80[data-shared-header=ready]',timeout=60000)
 if home:page.wait_for_selector('#bannerTitle',timeout=60000)
 page.evaluate('()=>document.fonts.ready');page.wait_for_timeout(100)
 page.wait_for_function("()=>{const h=document.querySelector('header.shared-header-v80'),v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--quanh-header-height'));return h&&Number.isFinite(v)&&Math.abs(h.getBoundingClientRect().height-v)<=1}")
def rect(locator):return locator.bounding_box()
def metadata(page):
 return page.evaluate("""()=>({url:location.href,hash:location.hash,scrollY,htmlClass:document.documentElement.className,bodyClass:document.body.className,appearance:document.documentElement.dataset.appearance,scale:visualViewport?.scale,textScale:getComputedStyle(document.documentElement).getPropertyValue('--text-scale'),headerHeight:getComputedStyle(document.documentElement).getPropertyValue('--quanh-header-height'),styleURLs:[...document.styleSheets].map(s=>s.href).filter(Boolean),resources:performance.getEntriesByType('resource').filter(r=>/\\.(css|js)(\\?|$)/.test(r.name)).map(r=>({url:r.name,transfer:r.transferSize,bytes:r.encodedBodySize,fromCache:r.transferSize===0}))})""")
def title_signature(page):
 return page.locator('#bannerTitle').evaluate("e=>({text:e.textContent.replace(/\\s+/g,' ').trim(),font:getComputedStyle(e).fontSize,rows:[...e.querySelectorAll('.banner-title-row')].map(r=>({text:r.textContent.trim(),font:getComputedStyle(r).fontSize,family:getComputedStyle(r).fontFamily,lineHeight:getComputedStyle(r).lineHeight,letterSpacing:getComputedStyle(r).letterSpacing}))})")
def wordmark_contrast(page):
 return page.locator('header .brand-wordmark').evaluate("""e=>{const rgb=s=>s.match(/[0-9.]+/g).map(Number),lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),bg=getComputedStyle(e.closest('header')).backgroundColor,b=lum(rgb(bg));return {background:bg,parts:[e,...e.querySelectorAll('b')].map(n=>{const color=getComputedStyle(n).color,f=lum(rgb(color));return {color,ratio:(Math.max(f,b)+.05)/(Math.min(f,b)+.05)}})}}""")
def compact_home(page):
 ready(page,True);page.wait_for_function('scrollY<2');width=page.viewport_size['width'];height=page.viewport_size['height'];header=rect(page.locator('header.shared-header-v80'));hero=rect(page.locator('.home-screen>.main-banner'));title=rect(page.locator('#bannerTitle'));primary=rect(page.locator('.main-banner .banner-actions .button.primary'));resume=rect(page.locator('.main-banner .banner-resume'));signature=title_signature(page);contrast=wordmark_contrast(page)
 verify(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Home overflows horizontally')
 verify(header and header['x']>=-1 and header['x']+header['width']<=width+1,'Header escapes the viewport')
 verify(all(p['ratio']>=4.5 for p in contrast['parts']),'Home wordmark inherits white text on a white header: '+str(contrast))
 verify(hero['height']<=761,'Home hero still exceeds the compact desktop limit')
 verify(hero['y']>=header['y']+header['height']-1,'Home hero overlaps the shared header')
 verify(hero['y']+hero['height']<=height+1,'Home hero extends below the initial viewport')
 for name,box in [('title',title),('primary CTA',primary),('resume CTA',resume)]:
  verify(box and box['x']>=-1 and box['x']+box['width']<=width+1 and box['y']>=header['height']-1 and box['y']+box['height']<=height+1,name+' is clipped outside the initial viewport: '+str(box))
 verify(len(signature['rows'])==2 and signature['rows'][0]['font']==signature['rows'][1]['font'],'The original two title rows no longer share typography')
 verify(float(signature['font'].removesuffix('px'))<=64.1,'Home title remains oversized')
 for row in page.locator('#bannerTitle .banner-title-row').all():
  box=row.bounding_box();verify(box['x']>=-1 and box['x']+box['width']<=width+1,'A title row is horizontally clipped')
 verify(page.locator('.main-banner').count()==1,'Home has duplicate banners')
 expand=rect(page.locator('.main-banner .banner-expand'))
 if expand:
  for name,box in [('title',title),('primary CTA',primary),('resume CTA',resume)]:
   overlap=min(expand['x']+expand['width'],box['x']+box['width'])-max(expand['x'],box['x'])>1 and min(expand['y']+expand['height'],box['y']+box['height'])-max(expand['y'],box['y'])>1
   verify(not overlap,'Banner fullscreen control overlaps '+name)
 return {'header':header,'hero':hero,'title':title,'primary':primary,'resume':resume,'typography':signature,'wordmark':contrast,'fullscreen':expand,'source':metadata(page)}
def client_draft(page,marker):
 page.evaluate('(marker)=>{window.qaLogoDocument=marker;window.qaLogoClient=globalThis.quanhAccountUI?.client}',marker)
 page.locator('#openAccount').click();page.wait_for_function("document.querySelector('#accountForm').getAttribute('aria-busy')==='false'");page.locator('#accountEmail').fill('logo-regression@example.test');page.locator('#accountClose').click()
def same_document(page,marker):
 verify(page.evaluate('(m)=>window.qaLogoDocument===m',marker),'The app logo replaced the document')
 verify(page.evaluate('window.qaLogoClient===globalThis.quanhAccountUI?.client'),'The app logo replaced the authentication client')
 verify(page.locator('#accountEmail').input_value()=='logo-regression@example.test','The app logo discarded the account form email draft')
with sync_playwright() as p:
 options={'headless':True}
 if args.engine=='chromium':options.update(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
 browser=getattr(p,args.engine).launch(**options);report['browserVersion']=browser.version
 def context(width,height,theme):
  ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',has_touch=width<600);ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1',{json.dumps(theme)});localStorage.setItem('quanh.locale.v1','vi-VN')");
  if args.renderer=='diagram':ctx.add_init_script("const fixtureUI=JSON.parse(localStorage.getItem('thpt-ui-v3')||'{}');fixtureUI.renderer='diagram';localStorage.setItem('thpt-ui-v3',JSON.stringify(fixtureUI))")
  page=ctx.new_page();page.set_default_timeout(25000);page.on('pageerror',lambda e:report['pageErrors'].append(str(e)));page.on('console',lambda m:report['consoleErrors'].append(m.text) if m.type=='error' else None);page.on('requestfailed',lambda r:report['failedRequests'].append({'url':r.url,'failure':r.failure}));page.on('response',lambda r:report['httpErrors'].append({'url':r.url,'status':r.status}) if r.status>=400 else None);return ctx,page
 if 'geometry' in args.groups:
  for theme in args.themes:
   for width,height in [tuple(map(int,size.split('x'))) for size in args.geometry_sizes]:
    ctx,page=context(width,height,theme)
    def geometry():page.goto(args.base,wait_until='domcontentloaded');return compact_home(page)
    run_case(page,f'home-{width}x{height}-{theme}',geometry);ctx.close()
 if 'journeys' in args.groups:
  for theme in args.themes:
   for width,height in [tuple(map(int,size.split('x'))) for size in args.journey_sizes]:
    ctx,page=context(width,height,theme)
    def journey():
     cache=None
     if args.engine=='chromium':cache=ctx.new_cdp_session(page);cache.send('Network.enable');cache.send('Network.setCacheDisabled',{'cacheDisabled':True})
     page.goto(args.base,wait_until='domcontentloaded');baseline=compact_home(page);baseline_ctas=page.locator('.main-banner .banner-actions>a').all_text_contents();client_draft(page,'logo-journey')
     page.locator('header [data-header-item=library]').click();page.locator('#search').fill('Ohm');page.wait_for_selector('#cards .card-open[href="#lab/ohm"]');page.locator('#cards .card-open[href="#lab/ohm"]').click();page.wait_for_selector('.inquiry-workbook',timeout=60000)
     page.locator('[data-action=record]').first.click();rows=page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows")
     page.locator('#openAssistant').click();page.locator('#aiAssistant textarea').fill('Giữ bản nháp Ohm khi nhấn logo');page.locator('#aiAssistant [data-ai=close]').click();page.locator('header>.brand').click();after_lab=compact_home(page);same_document(page,'logo-journey');verify(title_signature(page)==baseline['typography'],'Returning home changed the approved title content or typography');verify(page.locator('.main-banner .banner-actions>a').all_text_contents()[0]==baseline_ctas[0],'Returning home changed the primary CTA wording');verify(page.locator('.main-banner .banner-resume').get_attribute('href')=='#lab/ohm' and 'Tiếp tục bài gần nhất' in page.locator('.main-banner .banner-resume').inner_text(),'Recent-experiment CTA does not reflect the real Ohm visit');verify(page.evaluate("JSON.parse(localStorage.getItem('thpt-lab-v1')).ohm.rows")==rows,'Logo navigation changed measurements')
     page.go_back(wait_until='domcontentloaded');page.wait_for_selector('.inquiry-workbook',timeout=60000);same_document(page,'logo-journey');page.locator('#openAssistant').click();verify(page.locator('#aiAssistant textarea').input_value()=='Giữ bản nháp Ohm khi nhấn logo','Back after app logo lost the experiment chat draft');page.locator('#aiAssistant [data-ai=close]').click();page.locator('header>.brand').click();compact_home(page)
     page.evaluate('window.qaLogoBanner=document.querySelector(".main-banner")')
     if cache:cache.send('Network.setCacheDisabled',{'cacheDisabled':False})
     warm=[]
     for repeat in range(3):
      page.locator('#library').evaluate("e=>e.scrollIntoView({behavior:'instant'})");page.locator('header>.brand').click();compact_home(page);same_document(page,'logo-journey');verify(page.evaluate('document.querySelector(".main-banner")===window.qaLogoBanner'),'Repeated home logo rebuilt the existing banner');warm.append(metadata(page))
     page.locator('header [data-header-item=library]').click();page.wait_for_function('scrollY>100');page.locator('header>.brand').click();after_library=compact_home(page);same_document(page,'logo-journey')
     return {'afterLab':after_lab,'afterLibrary':after_library,'sameDocument':True,'authClientAndEmailDraftRetained':True,'rowsRetained':len(rows),'chatDraftAfterBack':True,'repeatedBannerIdentity':True,'warmSnapshots':warm}
    run_case(page,f'app-logo-journey-{width}x{height}-{theme}',journey);ctx.close()
 if 'books' in args.groups:
  for theme in args.themes:
   ctx,page=context(1920,1200,theme)
   def books():
    page.goto(args.base+'books.html?grade=10&page=4',wait_until='domcontentloaded');ready(page);page.wait_for_selector('.paper-page',timeout=30000);page.evaluate("window.qaBookDocument='books-before-logo'");page.locator('#openAssistant').click();page.locator('#aiAssistant textarea').fill('Bản nháp sách phải được bảo vệ trước khi rời trang');page.locator('#aiAssistant [data-ai=close]').click();page.locator('header>.brand').click();guard=page.locator('#conversationNavigation');guard.wait_for(state='visible');guard.locator('[data-conversation-stay]').click();verify(page.evaluate("window.qaBookDocument==='books-before-logo'"),'Staying after book logo replaced the document')
    page.locator('header>.brand').click();guard.locator('[data-conversation-leave]').click();page.wait_for_function('!window.qaBookDocument');home=compact_home(page);verify('/books.html' not in page.url,'Book logo did not navigate to the main app')
    return {'guardPreserved':True,'explicitRealDocumentNavigation':True,'home':home}
   run_case(page,f'books-logo-guard-{theme}',books);ctx.close()
 browser.close()
report['passed']=bool(report['cases']) and all(c['status']=='PASS' for c in report['cases']) and not report['pageErrors'] and not report['consoleErrors'] and not report['httpErrors'];save();print(json.dumps({'passed':report['passed'],'cases':len(report['cases']),'pageErrors':report['pageErrors'],'consoleErrors':report['consoleErrors'],'httpErrors':report['httpErrors'],'failedRequests':report['failedRequests']},ensure_ascii=False));raise SystemExit(0 if report['passed'] else 1)
