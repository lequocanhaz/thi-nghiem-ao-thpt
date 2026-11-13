from pathlib import Path
import sys
sys.argv=['cross-activity.py','--url','http://127.0.0.1:4176','--out','work/thermal-v86/cross-activity','--swiftshader']
source=Path('checks/browser-thermal-v86.py').read_text()
exec(compile(source[:source.index('CASES = {')],'checks/browser-thermal-v86.py','exec'))
before=source_hashes()
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    b=Bench(browser)
    p=b.page
    try:
        p.locator('#l3StudentTemperature').fill('32.1');b.click('record')
        ice=b.wait('s.trials[0].readings.length===1')
        p.goto(args.url+'/#lab/calorimetry?l3=solid');b.ready_3d()
        b.storage_key='quanh-l3-calorimetry-solid-v1'
        p.locator('#l3StudentTemperature').fill('23.4');b.click('record')
        solid=b.wait('s.trials[0].readings.length===1')
        p.goto(args.url+'/#lab/calorimetry?l3=ice');b.ready_3d()
        b.storage_key='quanh-l3-calorimetry-ice-v1'
        assert b.session()['trials']==ice['trials']
        p.goto(args.url+'/#lab/calorimetry?l3=solid');b.ready_3d();p.reload();b.ready_3d()
        b.storage_key='quanh-l3-calorimetry-solid-v1'
        assert b.session()['trials']==solid['trials']
        b.legacy_unchanged();assert not b.errors
        result={'status':'PASS','switchIceSolidIceSolidAndReload':True,'independentReadingsRetainedC':[32.1,23.4],'legacyClassicBytesRetained':True,'pageErrors':b.errors,'browserVersion':browser.version,'sourceBefore':before,'sourceAfter':source_hashes(),'scope':'Native Chromium page navigation and HTML UI; software WebGL, no physical device.'}
        assert result['sourceBefore']==result['sourceAfter']
        (out/'report.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n')
        print(json.dumps({k:v for k,v in result.items() if k not in ['sourceBefore','sourceAfter']},ensure_ascii=False))
    finally:b.close();browser.close()
