#!/usr/bin/env python3
"""Real Chromium/WebGL thermal-pilot UI regression.
Read-only projected coordinates guide native input; model state is changed only
through public pointer/keyboard/HTML controls. No hardware/teacher acceptance.
"""
import argparse
import hashlib
import io
import json
import math
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url', default='http://127.0.0.1:4176')
parser.add_argument('--out', default='work/thermal-v87/final')
parser.add_argument('--chromium', default='/usr/bin/chromium')
parser.add_argument('--only', default='')
parser.add_argument('--swiftshader', action='store_true', help='Explicit software WebGL; never a hardware benchmark')
args = parser.parse_args()
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
LEGACY = {'calorimetry': {'state': {'hot': 80, 'cold': 20, 'mHot': .3, 'mCold': .5}, 'rows': [{'values': [80, 20, 42.5, 47025, 47025, .3, .5]}], 'notes': 'Giữ dữ liệu cũ nguyên byte'}, 'ohm': {'state': {'u': 4, 'r': 10}, 'rows': [], 'notes': 'Bài khác'}}
LEGACY_RAW = json.dumps(LEGACY, ensure_ascii=False, separators=(',', ':'))
BASE_HEAD = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()


def source_hashes():
    files = [Path('checks/browser-thermal-v87.py'),Path('dist/index.html'),Path('dist/boot.js'),Path('dist/app.js'),Path('dist/app.css'), *sorted(Path('dist/l3').glob('*.js')), *sorted(Path('dist/l3').glob('*.css'))]
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}


class Bench:
    def __init__(self, browser, activity='ice', width=1440, height=1100, force_2d=False, wait_three=True, preloaded=None):
        self.activity = activity
        self.storage_key = f'quanh-l3-calorimetry-{activity}-v1'
        self.errors, self.console_errors = [], []
        self.context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=width < 600, accept_downloads=True)
        self.context.add_init_script('''if(!localStorage.getItem('qa-three-seeded')) {
          localStorage.setItem('thpt-lab-v1', %s);
          localStorage.setItem('thpt-ui-v3', JSON.stringify({renderer:'diagram',motion:false}));
          localStorage.setItem('quanh-l3-view-v1', %s);
          localStorage.setItem('qa-three-seeded', '1');
        }''' % (json.dumps(LEGACY_RAW), json.dumps('2d' if force_2d else '3d')))
        if preloaded is not None:
            self.context.add_init_script('if(!localStorage.getItem("qa-v87-fixture-seeded")){localStorage.setItem(%s,%s);localStorage.setItem("qa-v87-fixture-seeded","1");}' % (json.dumps(self.storage_key), json.dumps(json.dumps(preloaded,ensure_ascii=False,separators=(',',':')))))
        self.page = self.context.new_page()
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))
        self.page.on('console', lambda m: self.console_errors.append(m.text) if m.type == 'error' else None)
        self.page.on('dialog', lambda d: d.accept())
        self.page.goto(args.url.rstrip('/') + '/#lab/calorimetry?l3=' + activity)
        self.page.wait_for_selector('.l3-pilot')
        self.page.wait_for_function('(k)=>!!localStorage.getItem(k)', arg=self.storage_key)
        if not force_2d and wait_three:
            self.ready_3d()

    def ready_3d(self):
        self.page.wait_for_selector('#l3ThreeCanvas', state='visible', timeout=20000)
        self.page.wait_for_function('!!document.querySelector("#l3ThreeCanvas")?.dataset.projections')

    def session(self):
        return self.page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', self.storage_key)

    def wait(self, predicate, timeout=10000):
        self.page.wait_for_function('(k)=>{const s=JSON.parse(localStorage.getItem(k)||"null"); return s&&(' + predicate + ')}', arg=self.storage_key, timeout=timeout)
        return self.session()

    def click(self, action):
        if action in ['tare', 'empty-pan']:
            self.select('scale')
        self.page.locator(f'[data-l3-action="{action}"]').click()

    def select(self, tool):
        self.page.locator(f'.l3-tool-list [data-l3-tool="{tool}"]').click()

    def projections(self):
        return self.page.locator('#l3ThreeCanvas').evaluate('''c=>{const p=JSON.parse(c.dataset.projections),r=c.getBoundingClientRect(),dx=r.left-p.viewport.left,dy=r.top-p.viewport.top;for(const t of Object.values(p.targets)){t.x+=dx;t.y+=dy;}p.viewport={left:r.left,top:r.top,width:r.width,height:r.height};return p}''')

    def screen(self, x, y):
        # Public read-only view matrix; no controller callback or model mutation.
        p = self.projections()
        m, v = p['matrix'], [(x - 400) / 1000, (348 - y) / 1000, 0, 1]
        clip = [sum(m[column * 4 + row] * v[column] for column in range(4)) for row in range(4)]
        assert abs(clip[3]) > 1e-10
        viewport = p['viewport']
        return {'x': viewport['left'] + (clip[0] / clip[3] + 1) * viewport['width'] / 2,
                'y': viewport['top'] + (1 - clip[1] / clip[3]) * viewport['height'] / 2}

    def target(self, tool, rotate=False):
        p = self.projections()['targets']
        return p['cup-rotate' if rotate else tool]

    def drag(self, tool, x, y):
        self.select(tool)
        self.page.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
        start, end = self.target(tool), self.screen(x, y)
        self.page.mouse.move(start['x'], start['y'])
        self.page.mouse.down()
        self.page.mouse.move(end['x'], end['y'], steps=14)
        self.page.mouse.up()

    def unproject(self, point):
        p = self.projections()
        m, r = p['matrix'], p['viewport']
        nx, ny = (point['x']-r['left'])/r['width']*2-1, 1-(point['y']-r['top'])/r['height']*2
        a,b,c = m[0]-nx*m[3], m[4]-nx*m[7], nx*m[15]-m[12]
        d,e,f = m[1]-ny*m[3], m[5]-ny*m[7], ny*m[15]-m[13]
        determinant = a*e-b*d
        assert abs(determinant)>1e-10
        return {'x':400+1000*(c*e-b*f)/determinant, 'y':348-1000*(a*f-c*d)/determinant}

    def drag_via(self, tool, points, touch=False, single=False):
        self.select(tool)
        p=self.page;p.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
        a=self.target(tool)
        if touch:
            cdp=self.context.new_cdp_session(p)
            def pts(q):return [{'x':q['x'],'y':q['y'],'id':0,'radiusX':3,'radiusY':3,'force':1}]
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':pts(a)})
            for x,y in points:
                q=self.screen(x,y)
                steps=1 if single else 10
                for i in range(1,steps+1):
                    v={'x':a['x']+(q['x']-a['x'])*i/steps,'y':a['y']+(q['y']-a['y'])*i/steps}
                    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':pts(v)})
                a=q
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        else:
            p.mouse.move(a['x'],a['y']);p.mouse.down()
            for x,y in points:
                q=self.screen(x,y);p.mouse.move(q['x'],q['y'],steps=1 if single else 10)
            p.mouse.up()

    def snapshot_geometry(self):
        return self.page.locator('#l3ThreeCanvas').evaluate('c=>c.thermalGeometry')

    def pour(self,touch=False):
        s=self.session()['physicalState'];source=s['cupWaterMassKg'];capacity=s['config']['capacityM3']
        # Independent literal apparatus contract: regular64gon cavity, .1m high.
        cup_capacity=max(.0005,s['config']['waterMassKg']/1000*1.1)
        outer=math.sqrt(cup_capacity/(32*math.sin(math.pi/32)*.1))+.002
        dx=(outer+.018)*math.cos(math.pi/3)+.044*math.sin(math.pi/3)
        precision_angle=capacity<.0002 and source>.05
        target_x=410-1000*((outer+.018)*math.cos(math.radians(100))+.044*math.sin(math.radians(100))) if precision_angle else (370 if capacity<.0002 else 360)
        self.page.locator('[data-l3-field="speed"]').select_option('20')
        self.drag_via('cup',[(120,70),(target_x,70)],touch=touch)
        self.wait('Math.abs(s.apparatusState.positions.cup.x-'+repr(target_x)+')<1&&Math.abs(s.apparatusState.positions.cup.y-70)<1')
        self.select('cup');self.page.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
        if precision_angle:
            self.page.locator('#l3CupAngle').fill('100');self.page.locator('#l3CupAngle').dispatch_event('input')
        else:
            start,center=self.target('cup',rotate=True),self.unproject(self.target('cup'))
            anchor=self.unproject(start);radius=math.hypot(anchor['x']-center['x'],anchor['y']-center['y'])
            angle=math.atan2(anchor['x']-center['x'],center['y']-anchor['y'])
            if touch:
                cdp=self.context.new_cdp_session(self.page)
                def pts(q):return [{'x':q['x'],'y':q['y'],'id':0,'radiusX':3,'radiusY':3,'force':1}]
                cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':pts(start)})
            else:self.page.mouse.move(start['x'],start['y']);self.page.mouse.down()
            for i in range(1,21):
                theta=angle+math.radians(100)*i/20;point=self.screen(center['x']+radius*math.sin(theta),center['y']-radius*math.cos(theta))
                if touch:cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':pts(point)})
                else:self.page.mouse.move(point['x'],point['y'])
            if touch:cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            else:self.page.mouse.up()
        expected=min(source,capacity*1000)
        self.wait('s.physicalState.cupWaterMassKg<1e-8&&s.physicalState.waterMassKg>'+repr(expected-1e-6))
        self.click('step');self.page.locator('#l3CupAngle').fill('0');self.page.locator('#l3CupAngle').dispatch_event('input');self.wait('s.apparatusState.cupAngleRad===0')

    def step(self, n=1):
        before = self.session()['physicalState']['timeS']
        for _ in range(n):
            self.click('step')
        return self.wait('s.physicalState.timeS>=' + repr(before + n - .001))

    def invariant(self):
        s = self.session()['physicalState']
        assert abs(s['massResidualKg']) < 1e-8
        assert abs(s['energyResidualJ']) < 1e-5

    def legacy_unchanged(self):
        assert self.page.evaluate('localStorage.getItem("thpt-lab-v1")') == LEGACY_RAW

    def canvas_pixels(self, name):
        png = self.page.locator('#l3ThreeCanvas').screenshot(path=str(out / f'{name}.png'))
        pixels = Image.open(io.BytesIO(png)).convert('RGB')
        colors = len(pixels.getcolors(pixels.width * pixels.height) or [])
        assert colors > 64, f'Blank/flat canvas: only {colors} colors'
        return {'sha256': hashlib.sha256(png).hexdigest(), 'distinctColors': colors, 'size': list(pixels.size)}

    def gl_info(self):
        return self.page.locator('#l3ThreeCanvas').evaluate('''c=>{const g=c.getContext('webgl2')||c.getContext('webgl');if(!g)return {webgl:false};const d=g.getExtension('WEBGL_debug_renderer_info');return {webgl:true,version:g.getParameter(g.VERSION),renderer:d?g.getParameter(d.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),contextLost:g.isContextLost()}}''')

    def close(self):
        if sys.exc_info()[0]:
            try:
                self.page.screenshot(path=str(out / f'failure-{self.activity}.png'), full_page=True)
                (out / f'failure-{self.activity}.json').write_text(json.dumps({'session': self.session(), 'pageErrors': self.errors, 'consoleErrors': self.console_errors, 'html': self.page.locator('.l3-pilot').inner_text()}, ensure_ascii=False, indent=2) + '\n')
            except Exception:
                pass
        self.context.close()


def render_and_camera(browser):
    b = Bench(browser)
    p = b.page
    try:
        assert not p.locator('#l3Stage').is_visible()
        assert p.locator('[data-l3-view="3d"]').get_attribute('aria-pressed') == 'true'
        gl = b.gl_info()
        assert gl['webgl'] and not gl['contextLost']
        stats = p.locator('#l3ThreeCanvas').evaluate("c=>JSON.parse(c.dataset.stats)")
        assert stats['meshCount'] >= 10 and stats['triangles'] > 0 and stats['drawCalls'] > 0, stats
        before, matrix = b.session(), b.projections()['matrix']
        picture = b.canvas_pixels('ice-real-webgl-before-orbit')
        p.locator('[data-l3-camera-mode="orbit"]').click()
        p.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
        box = p.locator('#l3ThreeCanvas').bounding_box()
        x, y = box['x'] + box['width'] * .5, box['y'] + box['height'] * .45
        p.mouse.move(x, y)
        p.mouse.down()
        p.mouse.move(x + 100, y + 30, steps=14)
        p.mouse.up()
        p.wait_for_function('(m)=>JSON.stringify(JSON.parse(document.querySelector("#l3ThreeCanvas").dataset.projections).matrix)!==JSON.stringify(m)', arg=matrix)
        orbit = b.canvas_pixels('ice-real-webgl-after-orbit')
        assert picture['sha256'] != orbit['sha256']
        assert b.session()['physicalState'] == before['physicalState']
        matrix = b.projections()['matrix']
        p.mouse.wheel(0, -220)
        p.wait_for_function('(m)=>JSON.stringify(JSON.parse(document.querySelector("#l3ThreeCanvas").dataset.projections).matrix)!==JSON.stringify(m)', arg=matrix)
        assert b.session()['physicalState'] == before['physicalState']
        p.locator('[data-l3-camera-mode="apparatus"]').click()
        b.drag('cup',120,70)
        b.wait('Math.abs(s.apparatusState.positions.cup.y-70)<1')
        p.set_viewport_size({'width':390,'height':844})
        p.wait_for_timeout(300)
        b.drag('cup',220,70)
        b.wait('Math.abs(s.apparatusState.positions.cup.x-220)<1&&Math.abs(s.apparatusState.positions.cup.y-70)<1')
        assert b.session()['physicalState'] == before['physicalState']
        b.invariant()
        b.legacy_unchanged()
        assert not b.errors
        return {'gl': gl, 'sceneStats': stats, 'pixelsBefore': picture, 'pixelsAfterOrbit': orbit, 'orbitAndWheel': True, 'physicsUnchanged': True, 'pageErrors': b.errors}
    finally:
        b.close()

def lifecycle_locale_theme_single(browser,activity):
    b = Bench(browser,activity)
    p = b.page
    try:
        p.locator('[data-l3-note="hypothesis"]').fill('Dữ liệu giữ qua camera và giao diện.')
        p.locator('#l3StudentTemperature').fill('66.6')
        b.click('record')
        saved = b.wait('s.trials[0].readings.length===1')
        p.locator('#headerUtilities > summary').click()
        p.locator('header [data-locale="en-US"]').click()
        p.wait_for_function('document.documentElement.lang.startsWith("en")')
        b.ready_3d()
        assert ('ice' if activity=='ice' else 'solid') in p.locator('.l3-pilot h1').inner_text().lower()
        if not p.locator('#appearanceToggle').is_visible():
            p.locator('#headerUtilities > summary').click()
        p.locator('#appearanceToggle').click()
        p.wait_for_function('document.documentElement.dataset.appearance==="dark"')
        b.canvas_pixels(activity+'-dark-english')
        assert b.session()['trials'][0]['readings'] == saved['trials'][0]['readings']
        assert p.locator('#l3ThreeCanvas').count() == 1
        p.locator('#l3ThreeCanvas').evaluate('(c)=>window.__qaRouteCanvas=c')
        p.locator('header a.brand').first.click()
        p.wait_for_selector('#bannerTitle')
        assert p.locator('#l3ThreeCanvas').count() == 0
        detached = p.evaluate('()=>{const c=window.__qaRouteCanvas;return {connected:c.isConnected,stats:JSON.parse(c.dataset.stats)}}')
        assert not detached['connected'] and detached['stats']['disposed'], detached
        p.goto(args.url.rstrip('/') + '/#lab/calorimetry?l3='+activity)
        b.ready_3d()
        restored = b.wait('s.trials[0].readings.length===1')
        assert restored['trials'] == saved['trials']
        b.legacy_unchanged()
        assert not b.errors
        return {'localeAndTheme': True, 'logoTeardown': detached, 'routeAndReloadRetainReadings': True, 'pageErrors': b.errors}
    finally:
        b.close()

def lifecycle_locale_theme(browser):
    return {activity:lifecycle_locale_theme_single(browser,activity) for activity in ['ice','solid']}

def fallback_2d_keyboard_single(browser,activity):
    b = Bench(browser,activity,force_2d=True)
    p = b.page
    try:
        p.wait_for_selector('#l3Stage', state='visible')
        assert p.locator('#l3ThreeCanvas').count() == 0
        p.locator('#l3-calorimeter').focus()
        p.locator('#l3-calorimeter').press('Enter')
        b.wait('s.physicalState.vesselPlaced')
        p.locator('#l3StudentTemperature').fill('72.3')
        b.click('record')
        saved = b.wait('s.trials[0].readings.length===1')
        p.locator('[data-l3-view="3d"]').click()
        b.ready_3d()
        p.locator('[data-l3-view="2d"]').click()
        p.wait_for_selector('#l3Stage', state='visible')
        assert b.session()['trials'][0]['readings'] == saved['trials'][0]['readings']
        b.legacy_unchanged()
        assert not b.errors
        return {'explicit2DKeyboard': True, 'threeThenTwoRetainsData': True, 'pageErrors': b.errors}
    finally:
        b.close()

def fallback_2d_keyboard(browser):
    return {activity:fallback_2d_keyboard_single(browser,activity) for activity in ['ice','solid']}

def cancel_pointer_lifecycle(browser):
    b = Bench(browser)
    p = b.page
    try:
        b.select('cup')
        p.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
        before = b.session()
        p.evaluate('document.addEventListener("pointerdown",e=>window.__qaPointerId=e.pointerId,true)')
        def start_drag():
            a, z = b.target('cup'), b.screen(220, 150)
            p.mouse.move(a['x'], a['y']); p.mouse.down()
            p.mouse.move(z['x'], z['y'], steps=9)
        start_drag()
        p.evaluate('document.querySelector("#l3ThreeCanvas").dispatchEvent(new PointerEvent("pointercancel",{pointerId:window.__qaPointerId,bubbles:true}))')
        p.mouse.up()
        b.wait('Math.abs(s.apparatusState.positions.cup.x-120)<.01&&Math.abs(s.apparatusState.positions.cup.y-130)<.01')
        start_drag()
        p.evaluate('document.querySelector("#l3ThreeCanvas").releasePointerCapture(window.__qaPointerId)')
        p.mouse.up()
        restored = b.wait('Math.abs(s.apparatusState.positions.cup.x-120)<.01&&Math.abs(s.apparatusState.positions.cup.y-130)<.01')
        assert restored['physicalState'] == before['physicalState']
        p.wait_for_timeout(1100)
        assert b.session()['physicalState'] == before['physicalState']
        b.legacy_unchanged()
        assert not b.errors
        return {'cancelRestoresPose': True, 'lostCaptureRestoresPose': True, 'pausedPhysicsHolds': True, 'scope': 'Native Chromium mouse down/move; injected pointercancel and browser releasePointerCapture, not physical touch interruption', 'pageErrors': b.errors}
    finally:
        b.close()

def no_webgl_and_context_loss(browser):
    b = Bench(browser)
    p = b.page
    try:
        p.locator('#l3StudentTemperature').fill('68.5'); b.click('record')
        saved = b.wait('s.trials[0].readings.length===1')
        p.locator('#l3ThreeCanvas').evaluate('c=>c.getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
        p.wait_for_selector('#l3Stage', state='visible')
        assert b.session()['trials'] == saved['trials']
        assert p.locator('#l3ThreeCanvas').count() == 0
        assert '2D' in p.locator('#l3ViewStatus').inner_text()
        p.locator('#l3-calorimeter').focus(); p.locator('#l3-calorimeter').press('Enter')
        b.wait('s.physicalState.vesselPlaced')
        b.legacy_unchanged(); assert not b.errors
        loss = {'dataRetained': True, 'keyboardFallbackUsable': True, 'pageErrors': b.errors}
    finally:
        b.close()
    disabled = browser.browser_type.launch(executable_path=args.chromium, headless=True, args=['--no-sandbox', '--disable-webgl'])
    b = Bench(disabled, wait_three=False)
    try:
        b.page.wait_for_selector('#l3Stage', state='visible')
        assert b.page.locator('#l3ThreeCanvas').count() == 0
        assert '2D' in b.page.locator('#l3ViewStatus').inner_text()
        b.page.locator('#l3-calorimeter').focus(); b.page.locator('#l3-calorimeter').press('Enter')
        b.wait('s.physicalState.vesselPlaced')
        b.legacy_unchanged(); assert not b.errors
        fallback = {'nativeDisableWebGLFlag': True, 'keyboardFallbackUsable': True, 'expectedConsoleErrors': b.console_errors, 'pageErrors': b.errors}
    finally:
        b.close(); disabled.close()
    return {'contextLossFixture': loss, 'webglDisabled': fallback, 'scope': 'Browser context-loss injection/native --disable-webgl; not a physical unsupported device'}

def set_cup_angle(b,degrees):
    b.select('cup')
    b.page.locator('#l3CupAngle').fill(str(degrees))
    b.page.locator('#l3CupAngle').dispatch_event('input')

def pause_if_running(b):
    label=b.page.locator('[data-l3-action="pause"]').inner_text()
    if label in ['Tạm dừng','Pause']:
        b.click('pause')
        b.page.wait_for_timeout(400)


def mesh_oracle(snapshot):
    """Independent signed-tetra and closed-edge oracle on actual world buffers."""
    if not snapshot or snapshot.get('visible') is False:
        return {'volumeM3':0.0,'triangles':0,'closed':True,'bounds':None}
    positions=snapshot['positions'];verts=[positions[i:i+3] for i in range(0,len(positions),3)]
    if not verts:return {'volumeM3':0.0,'triangles':0,'closed':True,'bounds':None}
    idx=snapshot.get('indices')
    if idx is None:idx=list(range(len(verts)))
    assert len(idx)%3==0 and all(all(math.isfinite(v) for v in p) for p in verts)
    volume=0;edges={}
    def point_key(p):return tuple(round(v,8) for v in p)
    for n in range(0,len(idx),3):
        a,b,c=[verts[idx[n+k]] for k in range(3)]
        volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6
        keys=list(map(point_key,[a,b,c]))
        if len(set(keys))<3:continue
        for i,j in [(0,1),(1,2),(2,0)]:
            key=tuple(sorted((keys[i],keys[j])));edges[key]=edges.get(key,0)+1
    bad=sum(n!=2 for n in edges.values())
    return {'volumeM3':abs(volume),'triangles':len(idx)//3,'closed':bad==0,'nonmanifoldEdges':bad,'bounds':{'min':[min(p[i] for p in verts) for i in range(3)],'max':[max(p[i] for p in verts) for i in range(3)]}}


def assert_volume(snapshot,expected,name):
    actual=mesh_oracle(snapshot);tolerance=max(2e-10,abs(expected)*3e-5)
    assert abs(actual['volumeM3']-expected)<=tolerance,(name,expected,actual,tolerance)
    assert actual['closed'],(name,'open or nonmanifold actual mesh',actual)
    return {'expectedM3':expected,'actualM3':actual['volumeM3'],'toleranceM3':tolerance,'closed':actual['closed'],'triangles':actual['triangles']}


def assert_actual_geometry(b):
    state=b.session()['physicalState'];g=b.snapshot_geometry();assert g and g['units']=='m' and g['coordinateFrame']=='world'
    for wall,cavity in [('vesselInnerWall','vesselCavity'),('cupInnerWall','cupCavity')]:
        cp=g[cavity]['positions'];points={tuple(round(v,8) for v in cp[i:i+3]) for i in range(0,len(cp),3)}
        wp=g[wall]['positions'];assert all(tuple(round(v,8) for v in wp[i:i+3]) in points for i in range(0,len(wp),3)),wall+' differs from measured cavity profile'
    result={'cavity':assert_volume(g['vesselCavity'],state['config']['capacityM3'],'vessel cavity'),'cupCavity':assert_volume(g['cupCavity'],max(.0005,state['config']['waterMassKg']/1000*1.1),'cup cavity'),'cupWater':assert_volume(g.get('cupWater'),state['cupWaterMassKg']/1000,'cup water'),'vesselWater':assert_volume(g.get('vesselWater'),state['waterMassKg']/1000,'net vessel water')}
    if state['iceMassKg']>0:result['ice']=assert_volume(g.get('ice'),state['iceMassKg']/917,'ice mass/density')
    if state['activity']=='solid' and state['solid']['location']=='water':result['solid']=assert_volume(g.get('solid'),state['solid']['massKg']/state['config']['solidDensityKgM3'],'solid mass/density')
    return result


def calibration_and_lip(browser):
    results=[]
    for activity in ['ice','solid']:
        b=Bench(browser,activity);p=b.page
        try:
            initial=assert_actual_geometry(b)
            b.click('place-vessel');b.wait('s.physicalState.vesselPlaced')
            b.drag_via('cup',[(120,70),(360,70)])
            no_flow=[]
            for angle in [25,31]:
                set_cup_angle(b,angle);pause_if_running(b)
                before=b.session()['physicalState'];b.step(1);after=b.session()['physicalState']
                assert after['cupWaterMassKg']==before['cupWaterMassKg'] and after['waterMassKg']==before['waterMassKg'],'Below-lip tilt must not pour'
                picture=assert_actual_geometry(b)
                no_flow.append({'angleDeg':angle,'cupMassKg':after['cupWaterMassKg'],'geometry':picture})
            # Finish via public HTML exact-angle control; native handle exercised in journeys.
            p.locator('[data-l3-field="speed"]').select_option('20')
            set_cup_angle(b,100)
            b.wait('s.physicalState.cupWaterMassKg<1e-8&&s.physicalState.waterMassKg>.1999')
            pause_if_running(b);after=assert_actual_geometry(b)
            b.invariant();b.legacy_unchanged();assert not b.errors
            results.append({'activity':activity,'initialGeometry':initial,'belowLip':no_flow,'afterPour':after,'pageErrors':b.errors[:]})
        finally:b.close()
    return {'cases':results,'oracle':'Independent signed tetrahedra and edge multiplicity on actual world BufferGeometry snapshots, not declared geometry numbers.'}


def stir_gesture(b,touch=False):
    b.drag_via('stirrer',[(780,100),(410,100),(410,310)],touch=touch)
    s=b.session()['physicalState']
    # Default200g water+20gice: independent equilibrium displacement geometry.
    area=s['config']['capacityM3']/.176
    top=348-1000*(s['waterMassKg']/1000+s['iceMassKg']/1000)/area
    center_y=(top+342)/2
    b.select('stirrer');p=b.page;p.locator('#l3ThreeCanvas').scroll_into_view_if_needed();a=b.target('stirrer')
    if touch:
        cdp=b.context.new_cdp_session(p)
        def pts(q):return [{'x':q['x'],'y':q['y'],'id':0,'radiusX':3,'radiusY':3,'force':1}]
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':pts(a)})
    else:p.mouse.move(a['x'],a['y']);p.mouse.down()
    for i in range(37):
        angle=i*math.pi/12;q=b.screen(410+15*math.cos(angle),center_y+15*math.sin(angle)-10)
        if touch:cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':pts(q)})
        else:p.mouse.move(q['x'],q['y'])
    if touch:cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    else:p.mouse.up()
    b.wait('s.trials[0].events.some(e=>e.actionType==="stir"&&e.accepted)')
    pause_if_running(b)


def ice_journey(browser,touch=False):
    b=Bench(browser,width=390 if touch else 1440,height=844 if touch else 1100);p=b.page
    try:
        b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour(touch=touch)
        b.drag_via('ice',[(575,304.03),(575,110),(450,110),(450,260)],touch=touch)
        b.wait('s.trials[0].events.some(e=>e.actionType==="add-ice"&&!e.accepted)')
        assert b.session()['physicalState']['iceMassKg']==0,'x450 is outside calibrated mouth'
        b.drag_via('ice',[(575,304.03),(575,110),(410,110),(410,260)],touch=touch)
        b.wait('s.physicalState.iceMassKg>.019')
        before=assert_actual_geometry(b)
        stir_gesture(b,touch=touch)
        b.drag_via('probe',[(600,100),(450,100),(450,315)],touch=touch)
        b.wait('s.physicalState.probe.placement!=="water"')
        assert '—' in p.locator('#l3ProbeReading').inner_text()
        p.locator('#l3StudentTemperature').fill('77.7');b.click('record');recorded=b.wait('s.trials[0].readings.length===1');assert not recorded['trials'][0]['readings'][0]['valid']
        b.drag_via('probe',[(600,100),(410,100),(410,315)],touch=touch)
        b.wait('s.physicalState.probe.placement==="water"');b.step(3)
        assert '—' not in p.locator('#l3ProbeReading').inner_text()
        p.locator('#l3StudentTemperature').fill('31.2');b.click('record');s=b.wait('s.trials[0].readings.length===2');assert s['trials'][0]['readings'][1]['studentValueC']==31.2
        entered=[31.2]
        for _ in range(4):
            b.step(1)
            shown=p.locator('#l3ProbeReading').inner_text().replace(',', '.')
            value=float(shown.split()[0]);p.locator('#l3StudentTemperature').fill(str(value));b.click('record');entered.append(value)
        s=b.wait('s.trials[0].readings.length===6')
        assert [r['studentValueC'] for r in s['trials'][0]['readings'][1:]]==entered
        after=assert_actual_geometry(b)
        assert s['physicalState']['iceMassKg']<.02,'Ice must melt by physical transfer'
        b.invariant();b.legacy_unchanged();assert not b.errors
        return {'input':'CDP touch390' if touch else 'native mouse1440','outsideCalibratedMouthRejected':True,'airAndImmersedProbeCausal':True,'manualEntriesRetained':True,'fiveValidManualPointsKept':entered,'nativeStirGesture':True,'geometryAfterAddition':before,'geometryAfterHeatExchange':after,'canvas':b.canvas_pixels('ice-journey-'+('touch' if touch else 'mouse')),'pageErrors':b.errors}
    finally:b.close()


def solid_journey(browser):
    b=Bench(browser,'solid');p=b.page
    try:
        b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
        b.select('tongs');unheated=b.session()['physicalState'];b.click('heat');assert b.session()['physicalState']==unheated,'Heating control must not move an unplaced sample into bath'
        b.drag_via('solid',[(540,100),(410,100),(410,300)])
        b.wait('s.trials[0].events.some(e=>e.actionType==="move-solid"&&!e.accepted)');assert b.session()['physicalState']['solid']['location']!='water'
        pos=b.session()['apparatusState']['positions']['solid'];b.drag_via('tongs',[(pos['x'],100),(pos['x'],pos['y'])]);b.wait('s.physicalState.solid.location==="tongs"')
        b.drag_via('tongs',[(540,100),(280,100),(280,280)])
        before=b.wait('s.physicalState.solid.location==="bath"')['physicalState']['solid']['tempC'];heated=b.step(5)['physicalState']['solid']['tempC'];assert before<heated<90
        b.drag('tongs',280,280);b.wait('s.physicalState.solid.location==="tongs"');b.drag_via('tongs',[(280,100),(410,100),(410,300)])
        b.wait('s.physicalState.solid.location==="water"');b.drag_via('probe',[(600,100),(410,100),(410,315)]);b.wait('s.physicalState.probe.placement==="water"')
        s=b.step(4);assert s['physicalState']['waterTempC']>20
        geometry=assert_actual_geometry(b)
        b.invariant();b.legacy_unchanged();assert not b.errors
        return {'bareHandRejected':True,'finiteHeatingC':[before,heated],'waterWarmed':True,'geometry':geometry,'canvas':b.canvas_pixels('solid-transfer'),'pageErrors':b.errors}
    finally:b.close()


def focus_and_data(browser):
    cases=[]
    for activity in ['ice','solid']:
        b=Bench(browser,activity);p=b.page
        try:
            p.locator('#l3StudentTemperature').fill('36.4');b.click('record');saved=b.wait('s.trials[0].readings.length===1')
            p.locator('[data-l3-note="hypothesis"]').fill('Giữ dự đoán khi xem cận cảnh.');p.wait_for_timeout(400)
            before=b.session();matrix=b.projections()['matrix']
            p.locator('details.l3-camera-focus > summary').click()
            for tool in ['calorimeter','scale','probe']:
                p.locator('[data-l3-focus="'+tool+'"]').click()
                p.wait_for_function('(m)=>JSON.stringify(JSON.parse(document.querySelector("#l3ThreeCanvas").dataset.projections).matrix)!==JSON.stringify(m)',arg=matrix)
                matrix=b.projections()['matrix'];assert b.session()['physicalState']==before['physicalState'];assert b.session()['trials']==before['trials']
            b.click('fit');b.drag('cup',120,70);b.wait('Math.abs(s.apparatusState.positions.cup.y-70)<1')
            p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(300);b.drag('cup',220,70);b.wait('Math.abs(s.apparatusState.positions.cup.x-220)<1')
            assert b.session()['physicalState']==before['physicalState']
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            b.legacy_unchanged();assert not b.errors
            cases.append({'activity':activity,'threeCloseupsRetainPhysicalStateReadingsAndDraft':True,'raycastAfterFitResize':True,'pageErrors':b.errors[:]})
        finally:b.close()
    return {'cases':cases}

def capacity_and_piece_size(browser):
    seed=Bench(browser)
    try:fixture=seed.session()
    finally:seed.close()
    results=[]
    for capacity in [.0001,.01]:
        initial=json.loads(json.dumps(fixture));initial['physicalState']['config']['capacityM3']=capacity
        b=Bench(browser,preloaded=initial);p=b.page
        try:
            geometry_before=assert_actual_geometry(b)
            b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
            physical=b.session()['physicalState'];expected=min(.2,capacity*1000)
            assert abs(physical['waterMassKg']-expected)<1e-7
            assert abs(physical['spillMassKg']-(.2-expected))<1e-7
            geometry_full=assert_actual_geometry(b)
            if capacity==.01:
                b.drag_via('probe',[(600,100),(410,100),(410,343)])
                b.wait('s.physicalState.probe.placement!=="water"');assert '—' in p.locator('#l3ProbeReading').inner_text(),'3.52mm water is too shallow for required immersion'
                sample={'shallowProbeRejected':True}
            else:
                # Same 100ml apparatus, a fresh UI-created30g water trial.
                p.locator('[data-l3-config="waterMassKg"]').fill('.03');b.click('new-trial');b.wait('s.physicalState.config.waterMassKg===.03&&s.trials.length===2')
                b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
                before=b.session()['physicalState']
                b.drag_via('ice',[(575,304.03),(575,110),(410,110),(410,260)])
                p.wait_for_timeout(1200);rejected=b.session()['physicalState'];assert rejected['iceMassKg']==0
                assert rejected['iceTrayMassKg']==before['iceTrayMassKg'],'Oversize piece must not consume stock'
                p.locator('[data-l3-field="ice-piece"]').fill('1');p.locator('[data-l3-field="ice-piece"]').dispatch_event('change')
                b.drag_via('ice',[(575,304.03),(575,110),(410,110),(410,260)])
                accepted=b.wait('s.physicalState.iceMassKg>.00099')
                assert abs(accepted['physicalState']['iceMassKg']-.001)<1e-7
                sample={'defaultOversizeIceRejected':True,'oneGramPieceAccepted':True,'netFluidGeometry':assert_actual_geometry(b)}
            b.invariant();b.legacy_unchanged();assert not b.errors
            results.append({'capacityM3':capacity,'geometryBefore':geometry_before,'geometryFilled':geometry_full,'spillKg':physical['spillMassKg'],'sample':sample,'pageErrors':b.errors[:]})
        finally:b.close()
    return {'cases':results,'fixtureScope':'Capacity-only modifications to a valid empty persisted initial state; all transfers, new trials and precise piece selection through actual UI.'}


def oversized_solid(browser):
    seed=Bench(browser,'solid')
    try:fixture=seed.session()
    finally:seed.close()
    # Density affects geometrical size, not initial thermal ledger.
    fixture['physicalState']['config']['solidDensityKgM3']=500
    fixture['apparatusState']['positions']['solid']['y']=430-500*math.cbrt(.1/500)
    b=Bench(browser,'solid',preloaded=fixture);p=b.page
    try:
        b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
        pos=b.session()['apparatusState']['positions']['solid'];b.drag_via('tongs',[(pos['x'],100),(pos['x'],pos['y'])]);b.wait('s.physicalState.solid.location==="tongs"')
        before=b.session()['physicalState'];b.drag_via('tongs',[(540,100),(410,100),(410,300)])
        p.wait_for_timeout(1200);after=b.session()['physicalState'];assert after['solid']['location']!='water'
        assert after['waterMassKg']==before['waterMassKg'] and after['solid']['massKg']==before['solid']['massKg']
        assert b.session()['trials'][0]['events'][-1]['accepted'] is False,'Oversize drop must report rejection'
        assert '—' in p.locator('#l3ProbeReading').inner_text()
        b.invariant();b.legacy_unchanged();assert not b.errors
        return {'cubeDiagonalExceedsMouth':True,'noFakeInsertionOrMaterialLoss':True,'lastEvent':b.session()['trials'][0]['events'][-1],'pageErrors':b.errors}
    finally:b.close()


def collision_and_recovery(browser):
    seed=Bench(browser)
    try:
        seed.click('place-vessel');seed.wait('s.physicalState.vesselPlaced')
        seed.page.locator('#l3StudentTemperature').fill('37.4');seed.click('record');seed.wait('s.trials[0].readings.length===1')
        fixture=seed.session()
    finally:seed.close()
    fixture['apparatusState']['positions']['cup']={'x':374,'y':130};fixture['apparatusState']['cupAngleRad']=math.pi/3
    b=Bench(browser,preloaded=fixture);p=b.page
    try:
        before=b.session();assert before['apparatusState']['positions']['cup']=={'x':374,'y':130}
        assert abs(before['apparatusState']['cupAngleRad']-math.pi/3)<1e-12
        b.select('cup');assert p.locator('[data-l3-action="recover-cup"]').is_visible()
        b.step(1);stepped=b.session();assert stepped['physicalState']['cupWaterMassKg']==before['physicalState']['cupWaterMassKg'];assert stepped['physicalState']['waterMassKg']==before['physicalState']['waterMassKg']
        assert stepped['apparatusState']['positions']['cup']==before['apparatusState']['positions']['cup']
        p.locator('[data-l3-action="recover-cup"]').focus();p.locator('[data-l3-action="recover-cup"]').press('Enter');recovered=b.wait('s.apparatusState.cupAngleRad===0&&s.apparatusState.positions.cup.x===120')
        assert recovered['physicalState']==stepped['physicalState'];assert recovered['trials'][0]['readings']==before['trials'][0]['readings']
        # Body and floor sweeps tested through native mouse and emulated touch.
        body=[]
        for touch in [False,True]:
            cx=b.session()['apparatusState']['positions']['cup']['x'];b.drag_via('cup',[(cx,70),(120,70),(360,70)],touch=touch);set_cup_angle(b,60);pause_if_running(b)
            physical=b.session()['physicalState'];b.drag_via('cup',[(374,130)],touch=touch);p.wait_for_timeout(1200)
            current=b.session();assert abs(current['apparatusState']['positions']['cup']['y']-130)>1 or abs(current['apparatusState']['positions']['cup']['x']-374)>1
            assert current['physicalState']==physical
            cx=b.session()['apparatusState']['positions']['cup']['x'];b.drag_via('cup',[(cx,70),(550,70),(550,420)],touch=touch);p.wait_for_timeout(1100);assert b.session()['apparatusState']['positions']['cup']['y']<370
            b.drag_via('cup',[(550,70)],touch=touch);set_cup_angle(b,0);pause_if_running(b);b.drag_via('cup',[(550,250)],touch=touch)
            before=b.session()['physicalState'];b.drag_via('cup',[(120,250)],touch=touch,single=True);p.wait_for_timeout(1100)
            assert b.session()['apparatusState']['positions']['cup']['x']>450;assert b.session()['physicalState']==before
            body.append({'input':'CDP touch' if touch else 'mouse','bodyFloorFastSweepRejected':True})
        b.legacy_unchanged();assert not b.errors
        return {'invalidSavedPosePreserved':True,'invalidPoseNoPour':True,'explicitRecoveryKeepsPhysicalStateAndManualReading':True,'nativeCollisionCases':body,'canvas':b.canvas_pixels('calibrated-collision'),'pageErrors':b.errors}
    finally:b.close()


def export_import(browser):
    cases=[]
    for activity in ['ice','solid']:
        b=Bench(browser,activity);p=b.page
        try:
            p.locator('#l3StudentTemperature').fill('37.4');b.click('record');saved=b.wait('s.trials[0].readings.length===1');p.wait_for_timeout(1100)
            with p.expect_download() as dl:b.click('export-json')
            dest=out/(activity+'-export.json');dl.value.save_as(str(dest));assert json.loads(dest.read_text())['trials'][0]['readings']==saved['trials'][0]['readings']
            with p.expect_download() as dl:b.click('export-csv')
            csv=out/(activity+'-export.csv');dl.value.save_as(str(csv));assert '37.4' in csv.read_text() or '310.55' in csv.read_text()
            p.locator('#l3Import').set_input_files(str(dest));p.wait_for_timeout(1100);p.reload();b.ready_3d();assert b.session()['trials'][0]['readings']==saved['trials'][0]['readings']
            old=p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)
            for field,value in [('energyResidualJ','not-an-energy'),('massResidualKg',999),('waterVolumeM3',None)]:
                bad=json.loads(old)
                if value is None:del bad['physicalState'][field]
                else:bad['physicalState'][field]=value
                p.locator('#l3Import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(bad).encode()});p.wait_for_function('document.querySelector("#l3Status").textContent.includes("Không nhập phiên")');p.wait_for_timeout(1100);assert p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)==old
            b.legacy_unchanged();assert not b.errors
            cases.append({'activity':activity,'actualCsvJsonDownloads':True,'fileInputImportAndReloadRetainsReadings':True,'malformedImportsPreserveByte':True,'pageErrors':b.errors[:]})
        finally:b.close()
    return {'cases':cases}


def mobile_geometry(browser):
    results=[]
    for width,height in [(320,568),(390,844),(844,390)]:
        b=Bench(browser,width=width,height=height);p=b.page
        try:
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour(touch=True)
            geometry=assert_actual_geometry(b)
            p.locator('[data-l3-camera-mode="orbit"]').click();p.locator('#l3ThreeCanvas').scroll_into_view_if_needed();matrix=b.projections()['matrix'];box=p.locator('#l3ThreeCanvas').bounding_box();cdp=b.context.new_cdp_session(p)
            def pts(a):return [{'x':q['x'],'y':q['y'],'id':i,'radiusX':3,'radiusY':3,'force':1} for i,q in enumerate(a)]
            a=[{'x':box['x']+.3*box['width'],'y':box['y']+.55*box['height']},{'x':box['x']+.7*box['width'],'y':box['y']+.55*box['height']}]
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':pts(a)});z=[{'x':a[0]['x']-12,'y':a[0]['y']+4},{'x':a[1]['x']+12,'y':a[1]['y']+4}];cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':pts(z)});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            p.wait_for_function('(m)=>JSON.stringify(JSON.parse(document.querySelector("#l3ThreeCanvas").dataset.projections).matrix)!==JSON.stringify(m)',arg=matrix)
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            minimum=p.locator('.l3-pilot button').evaluate_all('(n)=>Math.min(...n.filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect().height))');assert minimum>=43.9
            b.legacy_unchanged();assert not b.errors
            results.append({'viewport':[width,height],'touchDragAndTwoTouchCamera':True,'geometry':geometry,'minimumButtonHeight':minimum,'canvas':b.canvas_pixels('mobile-'+str(width)),'pageErrors':b.errors[:]})
        finally:b.close()
    return {'cases':results,'scope':'CDP-emulated touch and viewports; no physical phone or hardware performance acceptance.'}


def full_event_log(browser):
    seed=Bench(browser)
    try:
        seed.click('place-vessel');seed.wait('s.physicalState.vesselPlaced');fixture=seed.session()
    finally:seed.close()
    fixture['apparatusState']['positions']['cup']={'x':374,'y':130};fixture['apparatusState']['cupAngleRad']=math.pi/3
    event={k:v for k,v in fixture['trials'][0]['events'][0].items() if k in ['schemaVersion','labId','simTimeS','actionType','accepted']};fixture['trials'][0]['events']=[dict(event) for _ in range(5000)]
    b=Bench(browser,preloaded=fixture);p=b.page
    try:
        before=b.session();b.select('calorimeter');b.click('place-vessel');b.select('cup');b.click('recover-cup');p.wait_for_timeout(1100);after=b.session()
        assert after['physicalState']==before['physicalState'] and after['apparatusState']['positions']==before['apparatusState']['positions'];assert len(after['trials'][0]['events'])==5000
        assert 'Nhật ký đã đầy' in p.locator('#l3Status').inner_text()
        with p.expect_download() as dl:b.click('export-json')
        path=out/'5000-events.json';dl.value.save_as(str(path));assert len(json.loads(path.read_text())['trials'][0]['events'])==5000
        p.locator('#l3Import').set_input_files(str(path));p.wait_for_timeout(1100);assert len(b.session()['trials'][0]['events'])==5000
        assert not b.errors
        return {'eventCountRemains5000':True,'exportImportRetainsFullLog':True,'rejectedRecoveryNoMutation':True,'pageErrors':b.errors}
    finally:b.close()


def foreground_stall(browser):
    b=Bench(browser)
    try:
        before=b.session()['physicalState'];b.click('pause')
        timing=b.page.evaluate("""async()=>{const read=()=>Number(document.querySelector('#l3TimeReading').textContent.replace(',','.').split(' ')[0]),initial=read(),start=performance.now();while(performance.now()-start<2000){}await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return {wallS:(performance.now()-start)/1000,simDeltaS:read()-initial};}""")
        assert timing['simDeltaS']>=1.8 and timing['simDeltaS']<=timing['wallS']+.3,timing
        pause_if_running(b);b.invariant();after=b.session()['physicalState'];assert after['cupWaterMassKg']==before['cupWaterMassKg'] and after['waterMassKg']==before['waterMassKg'];assert not b.errors
        return {'foregroundStall':timing,'elapsedTimeNotDiscarded':True,'physicalQuantitiesRetained':True,'scope':'Artificial foreground main-thread stall in software browser; not a hardware FPS or latency certification.'}
    finally:b.close()

CASES={'foreground_stall':foreground_stall,'full_event_log':full_event_log,'calibration_and_lip':calibration_and_lip,'capacity_and_piece_size':capacity_and_piece_size,'ice_journey_mouse':lambda browser:ice_journey(browser,False),'ice_journey_touch':lambda browser:ice_journey(browser,True),'solid_journey':solid_journey,'oversized_solid':oversized_solid,'collision_and_recovery':collision_and_recovery,'export_import':export_import,'focus_and_data':focus_and_data,'render_and_camera':render_and_camera,'lifecycle_locale_theme':lifecycle_locale_theme,'fallback_2d_keyboard':fallback_2d_keyboard,'cancel_pointer_lifecycle':cancel_pointer_lifecycle,'mobile_geometry':mobile_geometry,'no_webgl_and_context_loss':no_webgl_and_context_loss}
unknown=set(filter(None,args.only.split(',')))-set(CASES)
if unknown:parser.error('Unknown --only '+str(unknown))
results=[]
with sync_playwright() as playwright:
    flags=['--no-sandbox']+(['--use-angle=swiftshader','--enable-unsafe-swiftshader'] if args.swiftshader else [])
    browser=playwright.chromium.launch(executable_path=args.chromium,headless=True,args=flags)
    for name,case in CASES.items():
        if args.only and name not in args.only.split(','):continue
        before=source_hashes()
        try:result={'case':name,'status':'PASS',**case(browser)}
        except Exception as error:
            import traceback
            result={'case':name,'status':'FAIL','error':str(error),'traceback':traceback.format_exc()}
        after=source_hashes();result.update({'sourceBefore':before,'sourceAfter':after,'sourceChangedDuringCase':[p for p in set(before)|set(after) if before.get(p)!=after.get(p)]});results.append(result)
        report={'scope':'Actual Chromium/WebGL software rendering, no hardware/teacher acceptance','gitHead':BASE_HEAD,'generatedAt':datetime.now(timezone.utc).isoformat(),'browserVersion':browser.version,'flags':flags,'results':results};(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({k:v for k,v in result.items() if k not in ['sourceBefore','sourceAfter']},ensure_ascii=False),flush=True)
    browser.close()
if any(r['status']!='PASS' or r['sourceChangedDuringCase'] for r in results):raise SystemExit(1)
