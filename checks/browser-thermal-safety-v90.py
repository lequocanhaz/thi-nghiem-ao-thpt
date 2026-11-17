#!/usr/bin/env python3
"""Assessment and Escape for the simplified controls; no model setters."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
before=source_hashes()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);b=Bench(browser,force_2d=True);p=b.page
 try:
  p.locator('#l3Adjustments>summary').click();p.locator('[data-l3-field=mode]').select_option('assessment');b.wait('s.mode==="assessment"')
  p.locator('[data-l3-assist=place]').click();p.wait_for_timeout(400)
  p.locator('[data-l3-assist=align]').click();p.wait_for_timeout(120);p.keyboard.press('Escape');p.wait_for_timeout(700)
  assert p.locator('#l3SimpleActions').get_attribute('aria-busy')=='false';assert b.session()['physicalState']['waterMassKg']==0
  p.locator('[data-l3-assist=align]').click();p.wait_for_function('document.querySelector("#l3SimpleActions").getAttribute("aria-busy")==="false"');p.wait_for_timeout(400)
  p.locator('[data-l3-assist=pour]').click();p.wait_for_timeout(600);assert b.session()['physicalState']['waterMassKg']==0
  assert 'dự đoán' in p.locator('#l3Status').inner_text().lower()
  p.locator('[data-l3-note=hypothesis]').fill('Tăng lượng đá sẽ giảm nhiệt độ cân bằng.');p.wait_for_timeout(400)
  p.locator('[data-l3-assist=pour]').click();b.wait('s.physicalState.waterMassKg>.01');p.keyboard.press('Escape');p.wait_for_timeout(900)
  s=b.session();assert s['physicalState']['cupWaterMassKg']>0 and s['apparatusState']['cupAngleRad']==0
  mass=s['physicalState']['waterMassKg'];p.wait_for_timeout(800);assert b.session()['physicalState']['waterMassKg']==mass
  p.reload();p.wait_for_selector('#l3MainAction');p.wait_for_timeout(800);restored=b.session();assert restored['physicalState']==s['physicalState'];assert restored['trials']==s['trials'];assert not b.errors
  result={'status':'PASS','cancelledPlacementPreservesMass':True,'assessmentBlocksPourUntilPrediction':True,'EscapeStopsPourAndRetainsTransferredWater':True,'reloadPreservesData':True,'pageErrors':b.errors[:],'browserVersion':browser.version}
 finally:b.close();browser.close()
after=source_hashes();assert before==after;result.update(sourceBefore=before,sourceAfter=after,sourceStable=True)
(out/'report.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if not k.startswith('source')},ensure_ascii=False))
