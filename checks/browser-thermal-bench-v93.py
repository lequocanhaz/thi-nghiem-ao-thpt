#!/usr/bin/env python3
"""Exercise the actual thermal bench controls, layout, stir and in-trial refill."""
from pathlib import Path
from playwright.sync_api import expect

source = Path('checks/browser-thermal-v87.py').read_text()
source = source.replace("wait_for_function('!!document", "wait_for_function('()=>!!document")
exec(compile(source[:source.index('\nCASES=')], 'checks/browser-thermal-v87.py', 'exec'))


def operate(bench, action):
    target = bench.page.locator(f'[data-l3-assist="{action}"]:visible')
    if bench.page.viewport_size['width'] < 600:
        target.tap()
    else:
        target.click()
    bench.page.wait_for_function(
        '() => document.querySelector("#l3SimpleActions").getAttribute("aria-busy")==="false"'
    )


def verify(browser, activity, width, diagram):
    bench = Bench(browser, activity, width=width, height=900, force_2d=diagram)
    page = bench.page
    try:
        canvas = page.locator('#l3StageHost')
        tools = page.locator('#l3SimpleActions')
        stage_box, tools_box = canvas.bounding_box(), tools.bounding_box()
        assert stage_box and tools_box
        if width < 600:
            assert tools_box['y'] > stage_box['y'] + stage_box['height']
            assert page.locator('#l3Readings').bounding_box()['y'] > tools_box['y']
        else:
            assert tools_box['x'] >= stage_box['x'] + stage_box['width']
            assert tools_box['y'] <= stage_box['y']

        stir = page.locator('[data-l3-assist=stir]')
        assert stir.is_disabled()
        operate(bench, 'place')
        operate(bench, 'align')
        page.locator('[data-l3-field=speed]').select_option('20')
        operate(bench, 'pour')
        bench.wait('s.physicalState.cupWaterMassKg===0')
        expect(page.locator('#l3MainAction')).to_have_text('Châm nước vào cốc')
        original = bench.session()
        pos = original['apparatusState']['positions']['stirrer']

        page.locator('[data-l3-field=speed]').select_option('1')
        operate(bench, 'stir')
        stirred = bench.wait('s.physicalState.mixingIntensity>.2')
        assert stirred['apparatusState']['positions']['stirrer'] != pos
        events = stirred['trials'][0]['events']
        accepted = [event for event in events if event['actionType']=='stir' and event['accepted']]
        assert len(accepted) == 1 and accepted[0]['payloadSI']['turns'] == 1
        page.locator('#l3StageHost').screenshot(path=str(out/f'{activity}-{width}-mixing.png'))
        bench.click('pause')

        operate(bench, 'probe')
        bench.wait('s.physicalState.probe.placement==="water"')
        page.locator('#l3StudentTemperature').fill('33.4')
        bench.click('record')
        saved = bench.wait('s.trials[0].readings.length===1')
        operate(bench, 'refill')
        refilled = bench.wait('s.physicalState.cupWaterMassKg===.2 && s.physicalState.massInKg===.2')
        assert refilled['sessionId'] == saved['sessionId']
        assert len(refilled['trials']) == 1
        assert refilled['trials'][0]['readings'] == saved['trials'][0]['readings']
        assert refilled['physicalState']['waterMassKg'] == saved['physicalState']['waterMassKg']
        assert refilled['physicalState']['timeS'] == saved['physicalState']['timeS']
        assert refilled['physicalState']['energyInJ'] - saved['physicalState']['energyInJ'] == .2*4180*refilled['physicalState']['config']['waterTempC']
        bench.invariant()

        page.reload()
        page.wait_for_selector('#l3MainAction')
        assert bench.session()['physicalState'] == refilled['physicalState']
        assert bench.session()['trials'][0]['readings'] == saved['trials'][0]['readings']
        assert page.evaluate('() => document.documentElement.scrollWidth <= innerWidth + 1')
        assert not bench.errors
        page.evaluate('() => window.scrollTo(0,0)')
        page.locator('.l3-workspace').screenshot(path=str(out/f'{activity}-{width}.png'))
        return dict(activity=activity,width=width,view='2d' if diagram else '3d',
                    oneTapStir=True,inventoryRefilledG=200,retainedTrialAndReading=True,
                    conservation=True,pageErrors=bench.errors[:])
    finally:
        bench.close()


before = source_hashes()
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.chromium, headless=True,
        args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for activity, width, diagram in [('ice',390,False),('solid',1440,False),('ice',320,True)]:
        if args.only and args.only != str(width):
            continue
        result = verify(browser, activity, width, diagram)
        results.append(result)
        print(json.dumps(result,ensure_ascii=False),flush=True)
    version = browser.version
    browser.close()
after = source_hashes()
assert before == after and results
(out/'report.json').write_text(json.dumps(dict(status='PASS',browserVersion=version,results=results,
    sourceBefore=before,sourceAfter=after),ensure_ascii=False,indent=2)+'\n')
