"""Catalog control/theme browser QA. Chromium emulation, no physical Safari claim."""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/catalog-v71');args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'errors':[],'limits':['Chromium viewport emulation; not real Safari/iPhone.','No AI calls or scientific model acceptance.']}
paint=r'''sels=>sels.flatMap(sel=>[...document.querySelectorAll(sel)].filter(e=>e.getClientRects().length).map(e=>{let s=getComputedStyle(e),p=e,b='';while(p){let q=getComputedStyle(p).backgroundColor;if(q!=='rgba(0, 0, 0, 0)'&&q!=='transparent'){b=q;break}p=p.parentElement}let rgb=x=>(x.match(/[\d.]+/g)||[]).slice(0,3).map(Number),lum=x=>rgb(x).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0),a=lum(s.color),z=lum(b||'rgb(255,255,255)');return {selector:sel,text:e.textContent.slice(0,30),color:s.color,bg:b,ratio:(Math.max(a,z)+.05)/(Math.min(a,z)+.05)}}))'''
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 for width in [320,390,1440,1920]:
  for theme in ['light','dark']:
   for locale in ['vi-VN','en-US']:
    case={'width':width,'theme':theme,'locale':locale}
    ctx=browser.new_context(viewport={'width':width,'height':1000 if width>620 else 844},is_mobile=width<620,has_touch=width<620)
    ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1','{theme}');localStorage.setItem('quanh.locale.v1','{locale}')")
    page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
    try:
     page.goto(args.base+'#library',wait_until='networkidle',timeout=60000)
     page.locator('#cards .experiment-card').first.wait_for()
     page.locator('#libraryTitle').scroll_into_view_if_needed()
     assert page.locator('#cards .experiment-card').count()==24
     case['palette']=page.evaluate("() => Object.fromEntries(['.search','.search input','.grade-filters','.catalog-toolbar'].map(s=>[s,{background:getComputedStyle(document.querySelector('#library '+s)).backgroundColor,border:getComputedStyle(document.querySelector('#library '+s)).borderTopColor}]))")
     if theme=='dark':
      assert case['palette']['.search']['background']!='rgb(255, 255, 255)'
      assert case['palette']['.search input']['background']=='rgba(0, 0, 0, 0)'
      assert case['palette']['.grade-filters']['background']!='rgb(246, 247, 249)'
     case['contrast']=page.evaluate(paint,['#library .topic-chips button','#library .grade-filters button','#library .filters>button','#library .catalog-refine>summary','#library .search input','#library .card-body h3','#library .grade-tag','#library .favorite-button'])
     assert all(x['ratio']>=4.5 for x in case['contrast'] if x['selector']!='#library .favorite-button'),[(x['selector'],x['ratio']) for x in case['contrast'] if x['ratio']<4.5]
     assert not page.evaluate('() => document.documentElement.scrollWidth>innerWidth+1')
     assert page.locator('#cards img').first.evaluate("e=>e.currentSrc.includes('/previews/v65/')&&getComputedStyle(e).filter==='none'")
     page.screenshot(path=str(out/f'{width}-{theme}-{locale}.png'))
     page.locator('#search').fill('Ohm')
     page.locator('[data-action=clear-search]').wait_for(state='visible')
     page.wait_for_timeout(350)
     assert page.locator('#cards .experiment-card').count()>0
     page.locator('[data-action=clear-search]').click();page.wait_for_timeout(350)
     page.locator('#library [data-grade="10"]').click();assert page.locator('#library [data-grade="10"]').get_attribute('aria-pressed')=='true'
     page.locator('#library [data-grade="all"]').click()
     page.locator('[data-topic]').nth(1).click();assert page.locator('[data-topic]').nth(1).get_attribute('aria-pressed')=='true'
     page.locator('[data-topic="all"]').click()
     page.locator('#cards [data-favorite]').first.click()
     page.locator('[data-action=favorites-home]').click();assert page.locator('#cards .experiment-card').count()==1
     page.locator('[data-action=favorites-home]').click()
     page.locator('.catalog-refine>summary').click()
     assert page.locator('#catalogSort').is_visible();page.locator('#catalogSort').select_option('name')
     page.locator('#library [data-grade="10"]').click();page.locator('[data-action=clear-filters]').click()
     assert page.locator('#cards .experiment-card').count()==24
     page.locator('#search').focus();page.locator('#search').fill('zzzznotfound')
     page.wait_for_timeout(350);assert page.locator('#cards .experiment-card').count()==0
     page.locator('[data-action=clear-search]').click();page.wait_for_timeout(350)
     assert page.locator('#cards .experiment-card').count()==24
     case['status']='PASS'
    except Exception as e:case.update(status='FAIL',error=str(e));print({'width':width,'theme':theme,'locale':locale,'error':str(e)},flush=True);page.screenshot(path=str(out/f'failure-{width}-{theme}-{locale}.png'))
    report['cases'].append(case);ctx.close()
 browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'cases':[(c['width'],c['theme'],c['locale'],c['status'],c.get('error')) for c in report['cases']],'errors':report['errors']},ensure_ascii=False,indent=2));assert all(c['status']=='PASS' for c in report['cases']) and not report['errors']
