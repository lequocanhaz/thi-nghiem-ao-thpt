#!/usr/bin/env python3
"""New investigation activities through the real bench UI."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))

def act(b, action):
    button=b.page.locator(f'[data-l3-assist={action}]')
    if b.page.viewport_size['width']<600:button.tap()
    else:button.click()
    b.page.wait_for_function('()=>document.querySelector("#l3SimpleActions").getAttribute("aria-busy")==="false"')

def prepare(b, grams):
    b.page.locator('.l3-dose-tools>summary').click()
    act(b,'place');act(b,'align')
    b.page.locator('#l3PourDose').fill(str(grams));act(b,'dose')
    dose=b.wait(f'Math.abs(s.physicalState.cupWaterMassKg-(.2-{grams}/1000))<1e-10&&s.apparatusState.cupAngleRad===0',timeout=20000)
    assert abs(dose['physicalState']['waterMassKg']-grams/1000)<1e-10
    assert abs(dose['physicalState']['spillMassKg'])<1e-10
    return dose

def measure(b):
    act(b,'probe');b.wait('s.physicalState.probe.placement==="water"')
    for _ in range(3):
        b.step();text=b.page.locator('#l3ProbeReading').inner_text()
        b.page.locator('#l3StudentTemperature').fill(text.split()[0].replace(',','.'));b.click('record')
    b.wait('s.trials.at(-1).readings.length===3')

def compare(b):
    p=b.page
    before=b.session();panel=p.locator('#l3Comparison')
    panel.locator('summary').click()
    p.locator('[data-l3-cmp=origin]').select_option('sample')
    assert panel.locator('.l3-cmp-summary').count()==2
    for trial in ['a','b']:
        assert any(panel.locator(f'.l3-cmp-{trial} .l3-cmp-{kind}').get_attribute('d') for kind in ['marker','local'])
    p.locator('[data-l3-cmp=source]').select_option('instrument')
    assert panel.locator('.l3-comparison').get_attribute('data-source')=='instrument'
    for trial in ['a','b']:
        assert any(panel.locator(f'.l3-cmp-{trial} .l3-cmp-{kind}').get_attribute('d') for kind in ['line','local'])
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    assert b.session()==before

def calculate_fusion(b):
    p=b.page;p.locator('.l3-calculation>summary').click()
    for k,v in {'mw':'0.050125','mi':'0.005','ccal':'0','tw':'40','tf':str((.050125*4180*40-.005*334000)/(.055125*4180))}.items():
        p.locator(f'[data-l3-calc={k}]').fill(v)
    b.click('calculate');assert 'xác nhận' in p.locator('#l3CalculationStatus').inner_text();assert not b.session()['trials'][-1].get('calculation')
    p.locator('[data-l3-calc-all-melted]').check();b.click('calculate');assert 'vẫn còn đá' in p.locator('#l3CalculationStatus').inner_text()
    p.locator('[data-l3-field=speed]').select_option('20');b.click('pause');b.wait('s.physicalState.iceMassKg<=1e-10',timeout=35000);b.click('pause')
    b.click('calculate');s=b.wait('Math.abs(s.trials.at(-1).calculation?.latentHeatJPerKg-334000)<1e-6');assert p.locator('#l3EnergyBalance').is_visible()
    p.reload();p.wait_for_selector('#l3MainAction');assert b.session()['trials'][-1]['calculation']==s['trials'][-1]['calculation']
    p.locator('.l3-calculation>summary').click();assert 'J/kg' in p.locator('#l3Calculated').inner_text()

def dose_boundaries(browser):
    script="""import{createState}from'./dist/l3/thermal-physics.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';import{newSession,newTrial,serializeSession}from'./dist/l3/data-notebook.js';const s={...createState('ice',{capacityM3:.0001}),apparatusGeometryVersion:'thermal.geometry.v2'},q=newSession('ice');newTrial(q,'ice',{});q.physicalState=s;q.apparatusState={positions:initialPositions(s),icePieceMassKg:.01,cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2'};process.stdout.write(serializeSession(q));"""
    fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],text=True));b=Bench(browser,force_2d=True,preloaded=fixture);p=b.page
    try:
        p.locator('.l3-dose-tools>summary').click();act(b,'place');act(b,'align')
        initial=b.session()['physicalState'];p.locator('#l3PourDose').fill('201');act(b,'dose')
        assert 'không vượt' in p.locator('#l3Status').inner_text();assert b.session()['physicalState']==initial
        p.locator('#l3PourDose').fill('150');act(b,'dose');b.wait('s.physicalState.waterMassKg>.002')
        p.locator('#l3MainAction').click();stopped=b.wait('s.apparatusState.cupAngleRad===0')
        p.wait_for_timeout(550);assert b.session()['physicalState']['cupWaterMassKg']==stopped['physicalState']['cupWaterMassKg']
        p.locator('[data-l3-field=speed]').select_option('20');p.locator('#l3PourDose').fill('150');act(b,'dose')
        expected=stopped['physicalState']['cupWaterMassKg']-.15
        s=b.wait(f'Math.abs(s.physicalState.cupWaterMassKg-{expected})<1e-9&&s.apparatusState.cupAngleRad===0');state=s['physicalState']
        assert abs(state['waterMassKg']-.1)<1e-9
        assert abs(state['spillMassKg']-(.1-expected))<1e-9
        b.invariant();assert not b.errors
        return {'case':'dose-boundaries','overAvailableRejectsWithoutTransfer':True,'stopDoesNotContinue':True,'spillMassKg':state['spillMassKg'],'conservedAt20x':True,'pageErrors':b.errors[:]}
    finally:b.close()

before=source_hashes();results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    if args.only not in ['solid','dose']:
        b=Bench(browser,'ice',width=390,force_2d=True);p=b.page
        try:
            first=prepare(b,50.125);assert first['physicalState']['iceMassKg']==0;b.invariant()
            p.locator('#l3BalanceTools>summary').click();act(b,'zero-balance');b.wait('s.physicalState.scale.tareKg===.005')
            act(b,'weigh-ice');weighed=b.wait('s.physicalState.scale.load==="ice"');assert weighed['physicalState']['iceTrayMassKg']==.1
            assert p.locator('#l3ScaleReading').inner_text().split()[0].replace(',','.')=='10.0'
            assert p.locator('[data-l3-assist=weigh-cup]').is_disabled()
            act(b,'add-ice');b.wait('s.physicalState.iceMassKg===.01&&s.physicalState.scale.load==="none"');measure(b)
            b.click('repeat-trial');b.wait('s.trials.length===2');assert len(b.session()['trials'][0]['readings'])==3
            prepare(b,50.125);p.locator('#l3QuickPiece').select_option('5');act(b,'add-ice');b.wait('s.physicalState.iceMassKg===.005');measure(b)
            compare(b);p.screenshot(path=str(out/'comparison-390.png'),full_page=True)
            calculate_fusion(b);b.invariant();assert not b.errors
            p.screenshot(path=str(out/'ice-390.png'),full_page=True)
            results.append({'case':'ice','exactDoseG':50.125,'balanceIceAndTare':True,'twoTrialsManualReadingsPreserved':True,'comparisonSourcesAndSampleOrigin':True,'latentHeatRecoveredAfterReload':True,'pageErrors':b.errors[:]})
        finally:b.close()
    if args.only not in ['ice','dose']:
        b=Bench(browser,'solid',width=1440);p=b.page
        try:
            p.locator('#l3BalanceTools>summary').click();act(b,'weigh-cup');b.wait('s.physicalState.scale.load==="cup"');assert '250' in p.locator('#l3ScaleReading').inner_text()
            act(b,'clear-balance');b.wait('s.physicalState.scale.load==="none"&&s.apparatusState.positions.cup.x===120')
            prepare(b,150);p.locator('#l3BalanceTools').evaluate('n=>n.open=true')
            act(b,'grip');b.wait('s.physicalState.solid.location==="tongs"');act(b,'weigh-solid');b.wait('s.physicalState.scale.load==="solid"');assert '100' in p.locator('#l3ScaleReading').inner_text()
            act(b,'clear-balance');b.wait('s.physicalState.scale.load==="none"&&s.physicalState.solid.location==="tongs"');act(b,'bath');b.wait('s.physicalState.solid.location==="bath"')
            act(b,'bath');b.wait('s.physicalState.solid.tempC>24');act(b,'bath');act(b,'grip');b.wait('s.physicalState.solid.location==="tongs"');act(b,'probe-sample')
            b.wait('s.physicalState.probe.placement==="solid"');assert 'vật rắn' in p.locator('#l3ProbePlacement').inner_text().lower()
            b.step(2);assert b.session()['physicalState']['probe']['tempC']>20
            b.invariant();assert not b.errors
            results.append({'case':'solid','grossCupMass':True,'weighedHeldSample':True,'clearBalanceHonestGrip':True,'heatedBathAccessibleAfterWeighing':True,'probeReadsActualHeldSample':True,'pageErrors':b.errors[:]})
        finally:b.close()
    if args.only not in ['ice','solid']:results.append(dose_boundaries(browser))
    version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False))
