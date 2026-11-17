#!/usr/bin/env python3
"""Exercise the default simplified bench through public controls, no state setters."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
before=source_hashes();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for activity,width,two in [('ice',1440,False),('ice',390,False),('ice',390,True),('solid',1440,False)]:
  b=Bench(browser,activity,width=width,height=1000,force_2d=two);p=b.page
  try:
   assert not p.locator('#l3Adjustments').get_attribute('open')
   initial=b.session()['physicalState'];assert initial['cupWaterMassKg']==.2 and initial['waterMassKg']==0
   def action(a):
    p.locator('[data-l3-assist='+a+']').click();p.wait_for_function('document.querySelector("#l3SimpleActions").getAttribute("aria-busy")==="false"');p.wait_for_timeout(450)
   action('place');action('align');action('pour')
   b.wait('s.physicalState.waterMassKg>.025');p.locator('#l3MainAction').click();p.wait_for_timeout(1100)
   partial=b.session()['physicalState'];assert .025<partial['waterMassKg']<.2 and partial['cupWaterMassKg']>0
   stopped=partial['waterMassKg'];p.wait_for_timeout(700);assert b.session()['physicalState']['waterMassKg']==stopped
   action('pour');b.wait('s.physicalState.cupWaterMassKg===0',timeout=30000)
   p.wait_for_function('!document.querySelector("[data-l3-assist=probe]").disabled',timeout=10000)
   assert abs(b.session()['physicalState']['waterMassKg']-.2)<1e-8
   if activity=='ice':
    p.locator('#l3QuickPiece').select_option('10')
    for i in range(3):action('add-ice');b.wait('s.physicalState.icePortions?.length==='+str(i+1))
    assert abs(b.session()['physicalState']['iceMassKg']-.03)<1e-8
   else:
    action('grip');b.wait('s.physicalState.solid.location==="tongs"');action('bath');b.wait('s.physicalState.solid.location==="bath"')
    action('bath');b.wait('s.physicalState.solid.tempC>21');action('bath');action('probe');b.wait('s.physicalState.probe.placement==="bath"')
    action('grip');b.wait('s.physicalState.solid.location==="tongs"');action('vessel');b.wait('s.physicalState.solid.location==="water"')
   action('probe');b.wait('s.physicalState.probe.placement==="water"')
   action('stir');action('stir');b.wait('s.physicalState.mixingIntensity>0')
   b.click('pause');b.invariant()
   p.locator('#l3StudentTemperature').fill('33.4');b.click('record');b.wait('s.trials[0].readings.length===1')
   with p.expect_download() as download:b.click('export-json')
   file=out/f'{activity}-{width}-{two}.json';download.value.save_as(str(file));saved=json.loads(file.read_text())
   p.locator('#l3Import').set_input_files(str(file));p.wait_for_timeout(900);p.reload();p.wait_for_selector('#l3MainAction');p.wait_for_timeout(1000)
   restored=b.session();assert restored['physicalState']==saved['physicalState'];assert restored['trials']==saved['trials'];assert not b.errors
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   assert not p.locator('#l3Adjustments').get_attribute('open')
   p.screenshot(path=str(out/f'{activity}-{width}-{two}.png'),full_page=True)
   results.append({'activity':activity,'width':width,'view':'2d' if two else '3d','partialPourStopsExactly':True,'emptyCupUnlocksOtherActions':True,'sampleAndActualImmersionAndStir':True,'manualReadingJSONImportReload':True,'noHorizontalOverflow':True,'pageErrors':b.errors[:]});print(json.dumps(results[-1]),flush=True)
  finally:b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True,'scope':'Chromium mouse/tap via publicHTML controls, softwareWebGL; not physicaldevices or teacheracceptance.'},ensure_ascii=False,indent=2)+'\n')
