#!/usr/bin/env python3
"""Real Chromium layout checks at the nine requested widths, not physical devices."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
before=source_hashes();cases=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for activity in ['ice','solid']:
  b=Bench(browser,activity);p=b.page
  try:
   initial=b.session()['physicalState']
   for width in [320,375,390,414,430,768,1024,1440,1920]:
    p.set_viewport_size({'width':width,'height':900});p.wait_for_timeout(300)
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(activity,width,'horizontal overflow')
    controls=p.locator('.l3-pilot button').evaluate_all('bs=>bs.filter(b=>b.getBoundingClientRect().width&&b.getBoundingClientRect().height).map(b=>({label:b.textContent,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height}))')
    small=[b for b in controls if b['width']<43.5 or b['height']<43.5];assert not small,(activity,width,small)
    stats=p.locator('#l3ThreeCanvas').evaluate('c=>JSON.parse(c.dataset.stats)');assert stats['meshCount']>20 and not stats['contextLost']
    assert b.session()['physicalState']==initial
    cases.append({'activity':activity,'viewportWidth':width,'visibleControls':len(controls),'noHorizontalOverflow':True,'touchTargetsAtLeast44px':True,'physicalStateRetained':True})
    if width in [320,1440]:p.screenshot(path=str(out/(activity+'-'+str(width)+'.png')),full_page=True)
   assert not b.errors
  finally:b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'viewports-report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'cases':cases,'sourceBefore':before,'sourceAfter':after,'sourceStable':True,'scope':'Chromium headless with software WebGL; viewport emulation only, no physical mobile/OSK/Safari claim.'},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','cases':len(cases),'sourceStable':True}))
