#!/usr/bin/env python3
"""Exercise the integrated practice routes with browser input and inspect saved readings."""
import argparse
import hashlib
import json
import math
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:4200')
parser.add_argument('--out', default='work/practice-v94/accepted')
parser.add_argument('--only', default='')
args = parser.parse_args()
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
files = [Path('dist/app.js'),Path('dist/index.html'),Path('dist/boot.js'),*Path('dist/l3').glob('*practice*'),Path(__file__)]
fingerprint = lambda: {str(f):hashlib.sha256(f.read_bytes()).hexdigest() for f in files}
before = fingerprint()


class Bench:
    def __init__(self, browser, lab, width, entry=False):
        self.lab = lab
        self.width = width
        self.context = browser.new_context(viewport={'width':width,'height':900},has_touch=width<600,accept_downloads=True)
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda error: self.errors.append(str(error)))
        self.page.on('dialog', lambda dialog: dialog.accept())
        self.route = args.url.rstrip('/') + '/?v=94#lab/' + lab
        self.page.goto(self.route + ('' if entry else '?practice=1'))
        if entry:
            self.activate('[data-practice-entry='+lab+']')
        self.page.locator('[data-practice-id='+lab+']').wait_for()
        if self.page.locator('[data-practice-view="2d"]').count():
            self.activate('[data-practice-view="2d"]')


    def activate(self, selector):
        target = self.page.locator(selector)
        if self.width < 600:
            target.tap()
        else:
            target.click()

    def drag(self, selector, dx, dy=0):
        target = self.page.locator(selector)
        target.scroll_into_view_if_needed()
        box = target.bounding_box()
        x, y = box['x']+box['width']/2, box['y']+box['height']/2
        self.page.mouse.move(x,y)
        self.page.mouse.down()
        self.page.mouse.move(x+dx,y+dy,steps=12)
        self.page.mouse.up()

    def saved(self):
        return self.page.evaluate('(id) => JSON.parse(localStorage.getItem("quanh-practice-"+id+"-v1"))',self.lab)

    def record(self, expected_count):
        self.activate('[data-practice-action=record]')
        expect(self.page.locator('#practiceRows tr')).to_have_count(expected_count)
        return self.saved()['runs'][-1]['readings'][-1]['values']

    def layout(self):
        assert self.page.evaluate('() => document.documentElement.scrollWidth <= innerWidth+1')
        assert not self.errors
        self.page.evaluate('() => window.scrollTo(0,0)')
        self.page.screenshot(path=str(out/f'{self.lab}-{self.width}.png'),full_page=True)


def circuit(bench):
    p = bench.page
    for lead, target in [('source','sourceN')]:
        bench.activate('[data-ohm-lead='+lead+']')
        bench.activate('[data-ohm-terminal='+target+']')
    bench.activate('[data-ohm-switch]')
    expect(p.locator('[data-practice-action=record]')).to_be_disabled()
    bench.activate('[data-ohm-switch]')
    for lead, target in [('source','ammeterP'),('ammeter','resistorP'),('return','sourceN'),('voltageP','resistorP'),('voltageN','resistorN')]:
        bench.activate('[data-ohm-lead='+lead+']')
        bench.activate('[data-ohm-terminal='+target+']')
    bench.activate('[data-ohm-switch]')
    assert bench.record(1) == {'voltage':6,'current':.6,'resistance':10}
    bench.activate('[data-ohm-switch]')
    p.locator('[data-ohm-setting=supplyV]').fill('9')
    p.locator('[data-ohm-setting=supplyV]').press('Tab')
    bench.activate('[data-ohm-switch]')
    assert bench.record(2) == {'voltage':9,'current':.9,'resistance':10}
    return {'shortBlocksRecord':True,'currentsA':[.6,.9]}


def optics(bench):
    p = bench.page
    expect(p.locator('[data-practice-action=record]')).to_be_disabled()
    screen = p.locator('[data-lens-tool=screenM]')
    for _ in range(5): screen.press('Shift+ArrowLeft')
    first = bench.record(1)
    assert first['objectDistanceM']==.24 and first['screenDistanceM']==.24
    obj = p.locator('[data-lens-tool=objectM]')
    for _ in range(3): obj.press('Shift+ArrowLeft')
    for _ in range(2): screen.press('Shift+ArrowLeft')
    second = bench.record(2)
    assert second['objectDistanceM']==.30 and second['screenDistanceM']==.20
    assert abs((1/.24+1/.24)-(1/.30+1/.20)) < 1e-10
    return {'unfocusedBlocksRecord':True,'focusDistancesM':[[.24,.24],[.30,.20]]}


def spring(bench):
    p = bench.page
    rail = p.locator('[data-osc-rail]').bounding_box()
    bench.drag('[data-osc-mass]',rail['width']*.19)
    if p.locator('[data-osc-release]').is_visible():
        bench.activate('[data-osc-release]')
    bench.activate('[data-osc-start]')
    expect(p.locator('[data-practice-action=record]')).to_be_disabled()
    p.wait_for_function("() => Number(document.querySelector('[data-osc-cycles]').textContent)>=2")
    bench.activate('[data-osc-stop]')
    row = bench.record(1)
    assert row['cycles'] >= 2
    theoretical = 2*math.pi*math.sqrt(row['massKg']/row['stiffnessNPerM'])
    # The learner can stop after a whole cycle plus part of the next one.
    assert theoretical-.015 <= row['meanPeriodS'] < theoretical*(1+1/row['cycles'])+.015
    assert row['amplitudeCm']>0
    return {'elapsedS':row['durationS'],'cycles':row['cycles'],'measuredPeriodS':row['meanPeriodS'],'referencePeriodS':theoretical}


def piston(bench):
    p = bench.page
    first = bench.record(1)
    box = p.locator('[data-gas-track]').bounding_box()
    bench.drag('[data-gas-piston]',-box['width']*.24)
    second = bench.record(2)
    assert second['volumeL'] < first['volumeL'] and second['pressureKPa'] > first['pressureKPa']
    assert abs(second['volumeL']*second['pressureKPa']-first['volumeL']*first['pressureKPa']) < 1.0
    return {'volumesL':[first['volumeL'],second['volumeL']],'pressuresKPa':[first['pressureKPa'],second['pressureKPa']]}


def lever(bench):
    p = bench.page
    expect(p.locator('[data-practice-action=record]')).to_be_disabled()
    for load, hook in [(0,0),(1,4)]:
        bench.activate(f'[data-lever-load="{load}"]')
        bench.activate(f'[data-lever-hook="{hook}"]')
    row = bench.record(1)
    assert abs(row['netNm'])<1e-8 and abs(row['leftNm'])>1
    bench.activate('[data-lever-load="2"]')
    bench.activate('[data-lever-hook="4"]')
    assert bench.saved()['runs'][0]['events'][-1]['accepted'] is False
    bench.activate('[data-lever-hook="5"]')
    tilted = bench.record(2)
    assert tilted['netNm']<0
    return {'netNm':[row['netNm'],tilted['netNm']],'occupiedHookRejected':True}


def persistence(bench):
    p = bench.page
    previous = bench.saved()
    p.locator('#practiceGraph > summary').click()
    expect(p.locator('#practicePlot svg')).to_be_visible()
    p.locator('details:has(#practicePrediction) > summary').click()
    p.locator('#practicePrediction').fill('Giữ sơ đồ và số đo để so sánh.')
    p.wait_for_function('(id) => JSON.parse(localStorage.getItem("quanh-practice-"+id+"-v1")).runs[0].notes.prediction.length>0',arg=bench.lab)
    saved = bench.saved()
    assert saved['runs'][0]['readings']==previous['runs'][0]['readings']
    if bench.lab=='gas':
        with p.expect_download() as exported:
            bench.activate('[data-practice-action=json]')
        path = out/'exported-gas.json'
        exported.value.save_as(str(path))
        assert json.loads(path.read_text())==saved
        with p.expect_download() as exported:
            bench.activate('[data-practice-action=csv]')
        csv = out/'exported-gas.csv'
        exported.value.save_as(str(csv))
        assert 'pressureKPa (kPa)' in csv.read_text(encoding='utf-8-sig')
        p.locator('#practiceImport').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{"labId":"lens"}'})
        expect(p.locator('#practiceStatus')).to_have_attribute('data-error','true')
        assert bench.saved()==saved
        bench.activate('[data-practice-action=new]')
        assert len(bench.saved()['runs'])==2
        p.locator('#practiceImport').set_input_files(str(path))
        expect(p.locator('#practiceRun')).to_contain_text('Lượt 1')
        assert bench.saved()==saved
    p.reload()
    p.locator('#practiceTitle').wait_for()
    assert bench.saved()==saved
    expect(p.locator('#practiceRows tr')).to_have_count(len(saved['runs'][0]['readings']))
    if bench.lab=='gas':
        p.locator('#headerUtilities > summary').click()
        p.locator('[data-locale=en-US]').click()
        expect(p.locator('.practice-lab')).to_have_attribute('lang','en')
        assert bench.saved()==saved
        if not p.locator('[data-locale=vi-VN]').is_visible():
            p.locator('#headerUtilities > summary').click()
        p.locator('[data-locale=vi-VN]').click()
        expect(p.locator('.practice-lab')).to_have_attribute('lang','vi')


cases = [('ohm',390,circuit),('lens',1440,optics),('oscillation',768,spring),('gas',390,piston),('lever',320,lever)]
results = []
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for lab, width, check in cases:
        if args.only and lab not in args.only.split(','):
            continue
        bench = Bench(browser, lab, width, entry=lab=='ohm')
        try:
            result = check(bench)
            persistence(bench)
            bench.layout()
            item = {'lab':lab,'width':width,'retainedReading':True,'pageErrors':bench.errors,**result}
            results.append(item)
            print(json.dumps(item,ensure_ascii=False),flush=True)
        finally:
            bench.context.close()
    version = browser.version
    browser.close()
after = fingerprint()
assert before==after and results
(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after},ensure_ascii=False,indent=2)+'\n')
