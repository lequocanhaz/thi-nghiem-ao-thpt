#!/usr/bin/env python3
"""Native browser input through five custom Three.js practice benches."""
import argparse
import hashlib
import json
import math
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url',default='http://127.0.0.1:4201')
parser.add_argument('--out',default='work/practice-v95/accepted')
parser.add_argument('--only',default='')
args=parser.parse_args()
out=Path(args.out)
out.mkdir(parents=True,exist_ok=True)
paths=[Path('dist/app.js'),Path('dist/boot.js'),Path('dist/index.html'),*Path('dist/l3').glob('*practice*'),Path(__file__)]
fingerprint=lambda:{str(path):hashlib.sha256(path.read_bytes()).hexdigest() for path in paths}
before=fingerprint()
canvas_selector='[data-practice-canvas]'


class Bench:
    def __init__(self,browser,lab,width,fallback=False):
        self.lab=lab
        self.width=width
        self.context=browser.new_context(viewport={'width':width,'height':850},has_touch=width<600)
        self.page=self.context.new_page()
        self.errors=[]
        self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.page.goto(args.url.rstrip('/')+'/?v=95#lab/'+lab+'?practice=1')
        self.canvas=self.page.locator(canvas_selector)
        if not fallback:
            self.canvas.wait_for(timeout=24000)
            self.canvas.scroll_into_view_if_needed()

    def coords(self,identifier):
        result=self.page.evaluate("""async id => {
         const {projectPracticeInstrument}=await import('/l3/practice-three.js?v=95');
         const point=projectPracticeInstrument(document.querySelector('[data-practice-canvas]'),id);
         return point && {x:point.x,y:point.y};
        }""",identifier)
        assert result is not None,identifier
        return result

    def drag(self,tool,destination,cancel=False,touch=False):
        self.canvas.scroll_into_view_if_needed()
        start=self.coords(tool)
        end=self.coords(destination) if isinstance(destination,str) else destination
        if touch:
            cdp=self.context.new_cdp_session(self.page)
            send=lambda phase,points:cdp.send('Input.dispatchTouchEvent',{'type':phase,'touchPoints':points})
            send('touchStart',[start])
            for index in range(1,9):
                send('touchMove',[{k:start[k]+(end[k]-start[k])*index/8 for k in ('x','y')}])
            send('touchCancel' if cancel else 'touchEnd',[])
            cdp.detach()
        else:
            self.page.mouse.move(start['x'],start['y'])
            self.page.mouse.down()
            self.page.mouse.move(end['x'],end['y'],steps=12)
            if cancel:self.page.keyboard.press('Escape')
            self.page.mouse.up()

    def saved(self):
        return self.page.evaluate('(id)=>JSON.parse(localStorage.getItem("quanh-practice-"+id+"-v1"))',self.lab)

    def click(self,id):
        self.canvas.scroll_into_view_if_needed()
        point=self.coords(id)
        self.page.mouse.click(point['x'],point['y'])

    def record(self):
        self.page.locator('[data-practice-action=record]').click()
        return self.saved()['runs'][-1]['readings'][-1]['values']


def ohm(b):
    p=b.page
    b.canvas.scroll_into_view_if_needed()
    b.drag('lead:source','socket:sourceN',cancel=True,touch=True)
    assert b.saved() is None
    b.drag('lead:source','socket:sourceN',touch=True)
    b.click('switch')
    expect(p.locator('[data-practice-action=record]')).to_be_disabled()
    b.click('switch')
    pairs=[('source','ammeterP'),('ammeter','resistorP'),('return','sourceN'),('voltageP','resistorP'),('voltageN','resistorN')]
    for lead,target in pairs:
        b.drag('lead:'+lead,'socket:'+target,touch=True)
        assert b.saved()['runs'][-1]['state']['connections'][lead]==target
    b.click('switch')
    row=b.record()
    assert row=={'voltage':6,'current':.6,'resistance':10}
    return {'connectionCount':5,'shortBlocksMeasurement':True,'touchCancelPreserved':True,'readings':row}


def lens(b):
    p=b.page
    expect(p.locator('[data-practice-action=record]')).to_be_disabled()
    state={'screenM':.72,'lensM':.38}
    for _ in range(5):
        if abs(state['screenM']-.62)<=.005000001:
            break
        b.canvas.scroll_into_view_if_needed()
        screen,optic=b.coords('screenM'),b.coords('lensM')
        fraction=(.62-state['screenM'])/(state['screenM']-state['lensM'])
        end={k:screen[k]+fraction*(screen[k]-optic[k]) for k in ('x','y')}
        b.drag('screenM',end)
        state=b.saved()['runs'][0]['state']
    row=b.record()
    assert abs(row['screenDistanceM']-.24)<=.005000001 and row['objectDistanceM']==.24
    return {'screenPositionM':state['screenM'],'readings':row}


def spring(b):
    p=b.page
    pos=b.coords('mass')
    width=b.canvas.bounding_box()['width']
    b.drag('mass',{'x':pos['x']+width*.16,'y':pos['y']})
    p.locator('[data-osc-start]').click()
    p.wait_for_function("() => Number(document.querySelector('[data-osc-cycles]').textContent)>=2")
    p.locator('[data-osc-stop]').click()
    row=b.record()
    exact=2*math.pi*math.sqrt(row['massKg']/row['stiffnessNPerM'])
    assert row['cycles']>=2 and row['amplitudeCm']>0
    assert exact-.015 <= row['meanPeriodS'] < exact*(1+1/row['cycles'])+.015
    return {'referencePeriodS':exact,'readings':row}


def gas(b):
    a=b.record()
    b.canvas.scroll_into_view_if_needed()
    pos=b.coords('piston')
    end={'x':pos['x']-b.canvas.bounding_box()['width']*.16,'y':pos['y']}
    previous=b.saved()
    b.drag('piston',end,cancel=True)
    assert b.saved()==previous
    b.drag('piston',end)
    row=b.record()
    assert row['volumeL']<a['volumeL'] and row['pressureKPa']>a['pressureKPa']
    assert abs(row['volumeL']*row['pressureKPa']-a['volumeL']*a['pressureKPa'])<1.1

    p=b.page
    b.canvas.scroll_into_view_if_needed()
    pos=b.coords('piston')
    p.locator('[data-practice-orbit]').click()
    b.canvas.scroll_into_view_if_needed()
    bounds=b.canvas.bounding_box()
    x,y=bounds['x']+bounds['width']*.70,bounds['y']+bounds['height']*.31
    p.mouse.move(x,y);p.mouse.down();p.mouse.move(x-90,y+30,steps=11);p.mouse.up()
    rotated=b.coords('piston')
    assert math.hypot(rotated['x']-pos['x'],rotated['y']-pos['y'])>5
    before_fit=b.saved()
    p.locator('[data-practice-fit]').click()
    assert b.saved()==before_fit
    return {'from':a,'to':row,'escapePreservesState':True,'orbitLeavesStateUnchanged':True}


def lever(b):
    for tool,hook in [('load:0','hook:0'),('load:1','hook:4')]:
        b.drag(tool,hook)
    balanced=b.record()
    assert abs(balanced['netNm'])<1e-9 and abs(balanced['leftNm'])>1
    b.drag('load:2','hook:4')
    assert b.saved()['runs'][0]['events'][-1]['accepted'] is False
    b.drag('load:2','hook:5')
    row=b.record()
    assert row['netNm']<0
    return {'netNm':[balanced['netNm'],row['netNm']],'occupiedHookRejected':True}


def switch_views(b):
    p=b.page
    old=b.saved()
    b.canvas.screenshot(path=str(out/f'{b.lab}-{b.width}.png'))
    p.locator('[data-practice-view="2d"]').click()
    expect(b.canvas).to_have_count(0)
    assert b.saved()==old
    p.locator('[data-practice-view="3d"]').click()
    b.canvas.wait_for(timeout=24000)
    assert b.saved()==old
    p.reload()
    b.canvas.wait_for(timeout=24000)
    expect(p.locator('#practiceRows tr')).to_have_count(len(old['runs'][0]['readings']))
    assert b.saved()==old and not b.errors
    assert p.evaluate('() => document.documentElement.scrollWidth <= innerWidth+1')


results=[]
with sync_playwright() as pw:
    flags=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=flags)
    for lab,width,check in [('ohm',390,ohm),('lens',1440,lens),('oscillation',1024,spring),('lever',390,lever),('gas',1440,gas)]:
        if args.only and lab not in args.only.split(','):
            continue
        b=Bench(browser,lab,width)
        try:
            result=check(b)
            switch_views(b)
            item=dict(lab=lab,width=width,default3D=True,switchAndReloadRetained=True,pageErrors=b.errors,**result)
            results.append(item)
            print(json.dumps(item,ensure_ascii=False),flush=True)
        finally:
            b.context.close()
    browser_version=browser.version
    browser.close()
    if not args.only or args.only=='fallback':
        fallback_browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-webgl'])
        b=Bench(fallback_browser,'gas',390,fallback=True)
        expect(b.page.locator('[data-practice-view="2d"]')).to_have_attribute('aria-pressed','true',timeout=24000)
        expect(b.page.locator('.practice-view-status')).to_contain_text('WebGL')
        row=b.record()
        assert row['volumeL']==6 and not b.errors
        results.append(dict(lab='fallback',width=390,recordWorksWithWebGLDisabled=True,readings=row))
        b.context.close()
        fallback_browser.close()
after=fingerprint()
assert before==after and results
(out/'report.json').write_text(json.dumps(dict(status='PASS',browserVersion=browser_version,results=results,
    sourceBefore=before,sourceAfter=after),ensure_ascii=False,indent=2)+'\n')
