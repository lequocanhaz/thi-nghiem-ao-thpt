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
parser.add_argument('--url', default='http://127.0.0.1:4173')
parser.add_argument('--out', default='work/thermal-three-v85/final')
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
    files = [Path('dist/app.js'), *sorted(Path('dist/l3').glob('*.js')), *sorted(Path('dist/l3').glob('*.css'))]
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}


class Bench:
    def __init__(self, browser, activity='ice', width=1440, height=1100, force_2d=False, wait_three=True):
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

    def pour(self):
        self.page.locator('[data-l3-field="speed"]').select_option('20')
        self.drag('cup',315,100)
        self.wait('Math.abs(s.apparatusState.positions.cup.x-315)<1&&Math.abs(s.apparatusState.positions.cup.y-100)<1')
        self.select('cup')
        self.page.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
        start, center = self.target('cup',rotate=True), self.unproject(self.target('cup'))
        anchor = self.unproject(start)
        radius = math.hypot(anchor['x']-center['x'],anchor['y']-center['y'])
        angle = math.atan2(anchor['x']-center['x'],center['y']-anchor['y'])
        self.page.mouse.move(start['x'],start['y']);self.page.mouse.down()
        for i in range(1,17):
            theta=angle+math.pi/3*i/16
            point=self.screen(center['x']+radius*math.sin(theta),center['y']-radius*math.cos(theta))
            self.page.mouse.move(point['x'],point['y'])
        self.page.mouse.up()
        self.wait('s.physicalState.cupWaterMassKg<1e-8&&s.physicalState.waterMassKg>.1999')
        self.click('step')
        self.page.locator('#l3CupAngle').fill('0')
        self.page.locator('#l3CupAngle').dispatch_event('input')
        self.wait('s.apparatusState.cupAngleRad===0')

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
        b.invariant()
        b.legacy_unchanged()
        assert not b.errors
        return {'gl': gl, 'sceneStats': stats, 'pixelsBefore': picture, 'pixelsAfterOrbit': orbit, 'orbitAndWheel': True, 'physicsUnchanged': True, 'pageErrors': b.errors}
    finally:
        b.close()


def ice_raycast_journey(browser):
    b = Bench(browser)
    p = b.page
    try:
        b.drag('calorimeter', 410, 260)
        b.wait('s.physicalState.vesselPlaced')
        b.pour()
        b.drag('ice', 270, 390)
        b.wait('s.trials[0].events.some(e=>e.actionType==="add-ice"&&!e.accepted)')
        assert b.session()['physicalState']['iceMassKg'] == 0
        b.drag('ice', 410, 260)
        b.wait('s.physicalState.iceMassKg>.019')
        b.drag('probe', 410, 180)
        b.wait('s.physicalState.probe.placement==="air"')
        assert '—' in p.locator('#l3ProbeReading').inner_text()
        p.locator('#l3StudentTemperature').fill('77.7')
        b.click('record')
        s = b.wait('s.trials[0].readings.length===1')
        assert s['trials'][0]['readings'][0]['valid'] is False
        b.drag('probe', 410, 315)
        b.wait('s.physicalState.probe.placement==="water"')
        b.step(3)
        assert '—' not in p.locator('#l3ProbeReading').inner_text()
        p.locator('#l3StudentTemperature').fill('31.2')
        b.click('record')
        s = b.wait('s.trials[0].readings.length===2')
        assert s['trials'][0]['readings'][1]['studentValueC'] == 31.2
        b.canvas_pixels('ice-raycast-water-ice-probe')
        b.invariant()
        b.legacy_unchanged()
        assert not b.errors
        return {'actualRaycastPlacementAndPour': True, 'outsideIceRejected': True, 'airProbeInvalid': True, 'waterProbeValid': True, 'manualValuesKept': True, 'pageErrors': b.errors}
    finally:
        b.close()


def solid_raycast_journey(browser):
    b = Bench(browser, 'solid')
    p = b.page
    try:
        b.drag('calorimeter', 410, 260)
        b.wait('s.physicalState.vesselPlaced')
        b.pour()
        b.drag('solid', 410, 300)
        b.wait('s.trials[0].events.some(e=>e.actionType==="move-solid"&&!e.accepted&&e.reason==="use-tongs")')
        assert b.session()['physicalState']['solid']['location'] == 'tray'
        b.drag('tongs', 260, 390)
        b.wait('s.physicalState.solid.location==="tongs"')
        b.drag('tongs', 140, 280)
        before = b.wait('s.physicalState.solid.location==="bath"')['physicalState']['solid']['tempC']
        heated = b.step(5)['physicalState']['solid']['tempC']
        assert before < heated < 90
        b.drag('tongs', 140, 280)
        b.wait('s.physicalState.solid.location==="tongs"')
        b.drag('tongs', 410, 300)
        b.wait('s.physicalState.solid.location==="water"')
        b.drag('probe', 410, 315)
        b.wait('s.physicalState.probe.placement==="water"')
        s = b.step(4)
        assert s['physicalState']['waterTempC'] > 20
        b.canvas_pixels('solid-raycast-transfer')
        b.invariant()
        b.legacy_unchanged()
        assert not b.errors
        return {'bareHandRejected': True, 'tongsBathWater': True, 'finiteHeatingC': [before, heated], 'waterWarmed': True, 'pageErrors': b.errors}
    finally:
        b.close()


def lifecycle_locale_theme(browser):
    b = Bench(browser)
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
        assert 'ice' in p.locator('.l3-pilot h1').inner_text().lower()
        if not p.locator('#appearanceToggle').is_visible():
            p.locator('#headerUtilities > summary').click()
        p.locator('#appearanceToggle').click()
        p.wait_for_function('document.documentElement.dataset.appearance==="dark"')
        b.canvas_pixels('ice-dark-english')
        assert b.session()['trials'][0]['readings'] == saved['trials'][0]['readings']
        assert p.locator('#l3ThreeCanvas').count() == 1
        p.locator('#l3ThreeCanvas').evaluate('(c)=>window.__qaRouteCanvas=c')
        p.locator('header a.brand').first.click()
        p.wait_for_selector('#bannerTitle')
        assert p.locator('#l3ThreeCanvas').count() == 0
        detached = p.evaluate('()=>{const c=window.__qaRouteCanvas;return {connected:c.isConnected,stats:JSON.parse(c.dataset.stats)}}')
        assert not detached['connected'] and detached['stats']['disposed'], detached
        p.goto(args.url.rstrip('/') + '/#lab/calorimetry?l3=ice')
        b.ready_3d()
        restored = b.wait('s.trials[0].readings.length===1')
        assert restored['trials'] == saved['trials']
        b.legacy_unchanged()
        assert not b.errors
        return {'localeAndTheme': True, 'logoTeardown': detached, 'routeAndReloadRetainReadings': True, 'pageErrors': b.errors}
    finally:
        b.close()


def fallback_2d_keyboard(browser):
    b = Bench(browser, force_2d=True)
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


def mobile_touch_camera(browser):
    cases = []
    for width, height in [(320, 568), (390, 844), (844, 390)]:
        b = Bench(browser, width=width, height=height)
        p = b.page
        try:
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
            b.select('calorimeter')
            p.locator('#l3ThreeCanvas').focus()
            p.locator('#l3ThreeCanvas').press('Enter')
            b.wait('s.physicalState.vesselPlaced')
            b.select('cup')
            p.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
            cdp = b.context.new_cdp_session(p)
            a, z = b.target('cup'), b.screen(315, 100)
            def points(coords):
                return [{'x': v['x'], 'y': v['y'], 'id': i, 'radiusX': 3, 'radiusY': 3, 'force': 1} for i, v in enumerate(coords)]
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': points([a])})
            for i in range(1, 13):
                q = {'x': a['x'] + (z['x']-a['x'])*i/12, 'y': a['y'] + (z['y']-a['y'])*i/12}
                cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': points([q])})
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            b.wait('Math.abs(s.apparatusState.positions.cup.x-315)<1&&Math.abs(s.apparatusState.positions.cup.y-100)<1')
            p.locator('[data-l3-field="speed"]').select_option('20')
            p.locator('#l3ThreeCanvas').focus()
            p.locator('#l3ThreeCanvas').press('r')
            b.wait('s.physicalState.waterMassKg>.1999&&s.physicalState.cupWaterMassKg<1e-8')
            b.click('step')
            p.locator('#l3CupAngle').fill('0')
            p.locator('#l3CupAngle').dispatch_event('input')
            before = b.wait('s.apparatusState.cupAngleRad===0')['physicalState']
            p.locator('[data-l3-camera-mode="orbit"]').click()
            p.locator('#l3ThreeCanvas').scroll_into_view_if_needed()
            matrix = b.projections()['matrix']
            box = p.locator('#l3ThreeCanvas').bounding_box()
            left = {'x': box['x'] + box['width']*.34, 'y': box['y'] + box['height']*.55}
            right = {'x': box['x'] + box['width']*.66, 'y': box['y'] + box['height']*.55}
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': points([left, right])})
            changed = [{'x': left['x']-14, 'y': left['y']+4}, {'x': right['x']+14, 'y': right['y']+4}]
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': points(changed)})
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            p.wait_for_function('(m)=>JSON.stringify(JSON.parse(document.querySelector("#l3ThreeCanvas").dataset.projections).matrix)!==JSON.stringify(m)', arg=matrix)
            assert b.session()['physicalState'] == before
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
            minimum = p.locator('.l3-pilot button').evaluate_all('(nodes)=>Math.min(...nodes.filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect().height))')
            assert minimum >= 43.9, minimum
            image = b.canvas_pixels(f'mobile-three-{width}')
            b.invariant(); b.legacy_unchanged(); assert not b.errors
            cases.append({'viewport': [width, height], 'touchDragAndKeyboardPour': True, 'twoTouchCamera': True, 'physicsUnchangedByCamera': True, 'noBodyOverflow': True, 'minimumButtonHeight': minimum, 'canvas': image, 'pageErrors': b.errors})
        finally:
            b.close()
    return {'viewports': cases, 'scope': 'Chromium CDP-emulated touchscreen and viewports; no physical phone, OSK or hardware GPU claim'}


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


CASES = {'render_and_camera': render_and_camera, 'ice_raycast_journey': ice_raycast_journey, 'solid_raycast_journey': solid_raycast_journey, 'lifecycle_locale_theme': lifecycle_locale_theme, 'fallback_2d_keyboard': fallback_2d_keyboard, 'cancel_pointer_lifecycle': cancel_pointer_lifecycle, 'mobile_touch_camera': mobile_touch_camera, 'no_webgl_and_context_loss': no_webgl_and_context_loss}
unknown = set(filter(None, args.only.split(','))) - set(CASES)
if unknown:
    parser.error('Unknown --only cases: ' + ', '.join(sorted(unknown)))
results = []
with sync_playwright() as playwright:
    flags = ['--no-sandbox'] + (['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] if args.swiftshader else [])
    browser = playwright.chromium.launch(executable_path=args.chromium, headless=True, args=flags)
    for name, case in CASES.items():
        if args.only and name not in args.only.split(','):
            continue
        before = source_hashes()
        try:
            result = {'case': name, 'status': 'PASS', **case(browser)}
        except Exception as error:
            import traceback
            result = {'case': name, 'status': 'FAIL', 'error': str(error), 'traceback': traceback.format_exc()}
        after = source_hashes()
        result.update({'sourceBefore': before, 'sourceAfter': after, 'sourceChangedDuringCase': [f for f in after if before.get(f) != after[f]]})
        results.append(result)
        report = {'scope': 'Chromium actual WebGL; software renderer when reported, no hardware/teacher acceptance', 'gitHead': BASE_HEAD, 'generatedAt': datetime.now(timezone.utc).isoformat(), 'browserVersion': browser.version, 'flags': flags, 'results': results}
        (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps({k: v for k, v in result.items() if k not in ['sourceBefore', 'sourceAfter']}, ensure_ascii=False), flush=True)
    browser.close()
if any(r['status'] != 'PASS' for r in results):
    raise SystemExit(1)
