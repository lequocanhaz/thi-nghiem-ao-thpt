"""Optics v65: live Chromium/WebGL geometry, controls and responsive evidence.

Serve dist over HTTP first. Example:
  python3 checks/browser-optics-v65.py --out work/optics-v65/browser
The browser uses SwiftShader and simulated viewports; this is not Safari or a
physical-device test. External requests are blocked and no provider is called.
"""
import argparse
import json
import math
import os
import re
import time
import traceback
from pathlib import Path
from urllib.parse import urlsplit

from playwright.sync_api import sync_playwright


IDS = ['ray_slab', 'apparent_depth', 'brewster', 'mirror_rotation',
       'fiber_acceptance', 'lens_power', 'lenses_contact', 'magnifier',
       'telescope', 'microscope', 'pinhole']
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://127.0.0.1:4173/')
parser.add_argument('--out', default='work/optics-v65/browser')
parser.add_argument('--chromium', default=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'))
parser.add_argument('--only', default='', help='Regex selecting test names')
parser.add_argument('--widths', default='320,390,768,1440')
parser.add_argument('--ids', default=','.join(IDS))
parser.add_argument('--defaults-only', action='store_true', help='Capture default scenes for an initial visual review')
args = parser.parse_args()
BASE = args.base.rstrip('/') + '/'
OUT = Path(args.out)
OUT.mkdir(parents=True, exist_ok=True)
SELECTED = args.ids.split(',')
REPORT = {
    'scope': 'Actual Chromium WebGL/SwiftShader meshes and rays, independent geometry equations, live UI interactions',
    'tests': [], 'pageErrors': [], 'httpErrors': [], 'externalRequests': [],
    'limits': ['Simulated 320/390/768/1440px viewports; no physical iPhone, Android or Safari.',
               'No hardware GPU/FPS, teacher acceptance, real OAuth, Firebase or cloud sync test.',
               'Ray geometry tests cover these 11 IDs and declared ideal/paraxial assumptions.']}


def verify(condition, message):
    if not condition:
        raise AssertionError(message)


def close(actual, expected, label, tolerance=2e-5):
    verify(math.isfinite(actual) and abs(actual - expected) <= tolerance * max(1, abs(expected)),
           f'{label}: {actual} != {expected}')


def run(name, fn):
    if args.only and not re.search(args.only, name):
        return
    started = time.monotonic()
    try:
        evidence = fn()
        REPORT['tests'].append({'name': name, 'status': 'PASS', 'evidence': evidence,
                                'durationMs': round((time.monotonic() - started) * 1000)})
        print('PASS', name, flush=True)
    except Exception as error:
        REPORT['tests'].append({'name': name, 'status': 'FAIL', 'error': str(error),
                                'traceback': traceback.format_exc()})
        print('FAIL', name, str(error), flush=True)
    (OUT / 'report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))


def context(browser, width):
    ctx = browser.new_context(viewport={'width': width, 'height': 900 if width >= 768 else 844},
                              has_touch=width < 768, is_mobile=width < 768, service_workers='block')

    def guard(route):
        if urlsplit(route.request.url).netloc == urlsplit(BASE).netloc:
            route.continue_()
        else:
            REPORT['externalRequests'].append(route.request.url)
            route.abort('blockedbyclient')

    ctx.route('**/*', guard)
    ctx.on('page', lambda page: page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error))))
    ctx.on('response', lambda response: REPORT['httpErrors'].append({'url': response.url, 'status': response.status})
           if response.status >= 400 and urlsplit(response.url).netloc == urlsplit(BASE).netloc else None)
    return ctx


def capture_viewer(page):
    # Observe a live production instance through an existing public method,
    # then restore the prototype immediately. Do not replace scene/renderer.
    page.evaluate(r'''async()=>{const url=performance.getEntriesByType('resource').find(e=>/\/scene3d\.js(?:\?|$)/.test(e.name)).name;const{LabScene}=await import(url);const zoom=LabScene.prototype.zoom;LabScene.prototype.zoom=function(...args){window.__qaViewer=this;LabScene.prototype.zoom=zoom;return zoom.apply(this,args);};}''')
    page.locator('[data-action="zoom-in"]').click()
    page.wait_for_function('!!window.__qaViewer?.model')
    page.locator('[data-action="fit-view"]').click()
    page.wait_for_timeout(100)


def open_lab(page, name):
    if not page.url.startswith(BASE):
        page.goto(BASE + '#lab/' + name)
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('#visual canvas', timeout=30000)
        capture_viewer(page)
    else:
        page.evaluate('id=>location.hash="lab/"+id', name)
        page.wait_for_function('id=>window.__qaViewer?.id===id', arg=name, timeout=20000)
    page.locator('[data-mode="measure"]').click()
    page.locator('[data-action="fit-view"]').click()
    page.wait_for_timeout(60)


def numbers(page, values):
    for key, value in values.items():
        field = page.locator(f'.controls [data-number="{key}"]')
        if abs(float(field.input_value()) - value) < 1e-10:
            continue
        # The advanced disclosure is genuine UI; open it before typing.
        for details in field.locator('xpath=ancestor::details').all():
            if details.get_attribute('open') is None:
                details.locator(':scope > summary').click()
        field.fill(str(value))
        field.press('Tab')
    page.wait_for_timeout(65)
    actual = page.evaluate('window.__qaViewer.state')
    for key, value in values.items():
        close(actual[key], value, 'Typed parameter ' + key)


def locale(page, name):
    page.locator(f'[data-locale="{name}"]').click()
    page.wait_for_timeout(70)


def layout(page):
    result = page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
    verify(result['scroll'] <= result['width'] + 2, 'Document overflow: ' + json.dumps(result))
    return result


def saved(page, name):
    return page.evaluate('''id=>{const s=JSON.parse(localStorage.getItem('thpt-lab-v1'))?.[id]||{};return{state:s.state,rows:s.rows,notes:s.notes,prediction:s.prediction}}''', name)


def camera(page):
    return page.evaluate('''()=>{const v=window.__qaViewer;return{position:v.camera.position.toArray(),quaternion:v.camera.quaternion.toArray(),target:v.controls.target.toArray(),zoom:v.camera.zoom,autoFrame:v.autoFrame}}''')


def same_camera(a, b):
    for key in ['position', 'quaternion', 'target']:
        if any(abs(x-y) > 1e-6 for x, y in zip(a[key], b[key])):
            return False
    return abs(a['zoom'] - b['zoom']) < 1e-6 and a['autoFrame'] == b['autoFrame']


SCENE = r'''()=>{
 const v=window.__qaViewer,g=v.model.group;g.updateMatrixWorld(true);
 const gl=v.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
 const out={id:v.id,state:v.state,projection:v.projection,webgl:!!gl,isContextLost:gl.isContextLost(),renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),nonFinite:[],rays:[],markers:[],labels:[],geometry:null,mapping:null,fingerprint:0,readouts:[...document.querySelectorAll('#readouts .meter')].map(e=>({label:e.querySelector('span').textContent,value:e.querySelector('strong').firstChild.nodeValue,unit:e.querySelector('small').textContent})),modelStatus:document.querySelector('#modelStatus').textContent};
 let hash=2166136261;const mix=x=>hash=Math.imul(hash^(Math.round(x*1e5)|0),16777619)>>>0;
 const world=p=>g.worldToLocal(p).toArray();
 g.traverse(o=>{let visible=true;for(let p=o;p;p=p.parent)if(!p.visible)visible=false;
  if(o.userData.opticsGeometry){out.geometry=o.userData.opticsGeometry;out.mapping=o.userData.opticsProjection;}
  if(visible&&o.userData.modelLabel&&o.userData.text)out.labels.push(o.userData.text);
  if(!visible)return;
  for(const n of [...o.position.toArray(),...o.scale.toArray(),...o.quaternion.toArray(),...(o.geometry?.attributes?.position?.array||[])]){if(!Number.isFinite(n))out.nonFinite.push(o.name||o.type);mix(n);}
  if(o.userData.opticsSegment&&(o.isMesh||o.isLine)){let a,b;const attr=o.geometry?.attributes?.position;
   if(o.isLine&&attr){a=o.position.clone().set(attr.getX(0),attr.getY(0),attr.getZ(0));b=o.position.clone().set(attr.getX(attr.count-1),attr.getY(attr.count-1),attr.getZ(attr.count-1));}
   else {const h=o.geometry?.parameters?.height??1;a=o.position.clone().set(0,-h/2,0);b=o.position.clone().set(0,h/2,0);}
   out.rays.push({name:o.name,type:o.type,uuid:o.uuid,geometryUUID:o.geometry.uuid,descriptor:o.userData.opticsSegment,from:world(o.localToWorld(a)),to:world(o.localToWorld(b)),dashed:o.material?.isLineDashedMaterial===true,material:o.material?.type});
  }
  if(o.userData.opticsMarker)out.markers.push({name:o.name,descriptor:o.userData.opticsMarker,position:world(o.getWorldPosition(o.position.clone()))});
 });out.fingerprint=hash;return out;
}'''


def scene(page):
    return page.evaluate(SCENE)


def pt(point):
    return point[:2] if isinstance(point, list) else [point['x'], point['y']]


def direction(segment):
    a, b = pt(segment['from']), pt(segment['to'])
    return [b[0] - a[0], b[1] - a[1]]


def parallel(a, b, label):
    da, db = direction(a), direction(b)
    close(da[0]*db[1]-da[1]*db[0], 0, label, 3e-5)


def verify_scene(result, expected):
    verify(result['id'] == expected, 'Wrong live scene')
    verify(result['webgl'] and not result['isContextLost'], 'Actual WebGL context missing')
    verify(not result['nonFinite'], 'Non-finite actual vertex/transform: ' + str(result['nonFinite'][:8]))
    verify(result['geometry'] and result['mapping'], 'Semantic optics geometry missing')
    verify(len(result['rays']) >= 2, 'Fewer than two actual light-ray objects')
    verify(len(result['readouts']) == 3, 'Original three numerical readouts are missing')
    verify(not any(re.search('NaN|Infinity', r['value']) for r in result['readouts']), 'Non-finite readout text')
    mapping = result['mapping']
    scale = mapping['scale']
    origin, world_origin = pt(mapping['origin']), pt(mapping['worldOrigin'])
    verify(scale > 0 and math.isfinite(scale), 'Invalid uniform ray scale')
    for ray in result['rays']:
        descriptor = ray['descriptor']
        for key in ['from', 'to']:
            point = pt(descriptor[key])
            projected = [(point[i] - origin[i])*scale + world_origin[i] for i in range(2)]
            actual = ray[key]
            # Cylinder endpoints may be stored in the opposite local-y order.
            other = ray['to' if key == 'from' else 'from']
            err = min(max(abs(actual[i]-projected[i]) for i in range(2)),
                      max(abs(other[i]-projected[i]) for i in range(2)))
            verify(err < 3e-5, f'{expected}/{descriptor.get("id")}: actual rendered endpoint differs from optics geometry ({err})')
        virtual = descriptor.get('virtual', False) or descriptor.get('kind') == 'virtual' or descriptor.get('role') == 'virtual'
        if virtual:
            verify(ray['dashed'], 'Virtual ray is drawn solid: ' + ray['name'])
    verify_physics(result)


def physical_ray(result, name):
    ray = next((r for r in result['rays'] if r['descriptor']['id'] == name), None)
    verify(ray is not None, 'Missing actual optical ray ' + name)
    mapping = result['mapping'];origin = pt(mapping['origin']);world = pt(mapping['worldOrigin'])
    return {key: [(ray[key][i]-world[i])/mapping['scale']+origin[i] for i in range(2)]
            for key in ['from', 'to']}


def actual_ray_equations(result):
    """Use centreline vertices/transforms from actual WebGL objects, not values metadata."""
    name, s = result['id'], result['state']
    ray = lambda key: physical_ray(result, key)
    slope = lambda q: direction(q)[1]/direction(q)[0]
    if name == 'ray_slab':
        parallel(ray('incident'), ray('emergent'), 'Actual slab emergent/incident parallel')
        incoming = direction(ray('incident'))
        close(math.degrees(math.atan2(incoming[0], -incoming[1])), s['angle'], 'Actual slab incidence matches control')
        inside = direction(ray('in-slab'));r = math.asin(math.sin(math.radians(s['angle']))/s['index'])
        close(inside[0]/-inside[1], math.tan(r), 'Actual in-slab Snell direction')
        close(ray('in-slab')['from'][1], 0, 'Actual slab entry face')
        close(ray('in-slab')['to'][1], -s['thickness'], 'Actual slab exit thickness')
    elif name == 'apparent_depth':
        for sign in [-1, 1]:
            back = ray('back-extension-'+str(sign));liquid = ray('liquid-'+str(sign));air = ray('air-'+str(sign))
            close(back['to'][0], 0, 'Actual apparent image x')
            close(back['to'][1], -s['depth']/s['index'], 'Actual paraxial back intersection h/n')
            close(direction(air)[0]/direction(air)[1], s['index']*direction(liquid)[0]/direction(liquid)[1], 'Actual near-normal refraction slopes')
    elif name == 'brewster':
        a, b = direction(ray('reflected')), direction(ray('refracted'))
        close((a[0]*b[0]+a[1]*b[1])/math.hypot(*a)/math.hypot(*b), 0, 'Actual Brewster outgoing right angle')
        incoming = direction(ray('incident'));angle = math.atan(s['index']/s['index1'])
        close(math.atan2(incoming[0], -incoming[1]), angle, 'Actual Brewster incident angle')
        close(s['index1']*abs(incoming[0])/math.hypot(*incoming), s['index']*abs(b[0])/math.hypot(*b), 'Actual Brewster Snell law')
    elif name == 'mirror_rotation':
        a, b = direction(ray('incident')), direction(ray('reflected'))
        a = [q/math.hypot(*a) for q in a];b = [q/math.hypot(*b) for q in b]
        phi = math.radians(s['rotation']);n = [-math.sin(phi), math.cos(phi)]
        dot = a[0]*n[0]+a[1]*n[1]
        for i in range(2):
            close(b[i], a[i]-2*dot*n[i], 'Actual mirror vector reflection')
        expected = math.radians(70+2*s['rotation'])
        close(math.atan2(b[1], b[0]), expected, 'Actual reflected ray rotates twice mirror')
    elif name == 'fiber_acceptance':
        NA = math.sqrt(s['core']**2-s['cladding']**2)
        theta = .8*math.asin(min(1, NA));beta = math.asin(math.sin(theta)/s['core'])
        close(abs(slope(ray('incident'))), math.tan(theta), 'Actual incident ray inside acceptance cone')
        core = [r for r in result['rays'] if r['descriptor']['id'].startswith('core-ray-')]
        for r in core:
            close(abs(slope(ray(r['descriptor']['id']))), math.tan(beta), 'Actual guided fiber ray slope')
        verify(90-math.degrees(beta) >= math.degrees(math.asin(s['cladding']/s['core'])), 'Actual fiber ray below critical angle')
        for sign in [-1, 1]:
            cone = ray('acceptance-cone-'+str(sign));v = direction(cone)
            close(abs(v[1]/v[0]), math.tan(math.asin(min(1, NA))), 'Actual acceptance cone angle')
    elif name in ['lens_power', 'lenses_contact']:
        P = 100/s['focal'] if name == 'lens_power' else s['power1']+s['power2']
        for j in [0, 2]:
            emerging = ray('emergent-'+str(j));a = emerging['from']
            if abs(P) < 1e-9:
                close(slope(emerging), 0, 'Actual afocal outgoing ray parallel to axis')
            else:
                close(a[1]+slope(emerging)*(100/P-a[0]), 0, 'Actual thin-lens focus intersection')
                if P < 0:
                    back = ray('virtual-'+str(j));close(back['to'][0], 100/P, 'Actual negative-power virtual focal position')
                    close(back['to'][1], 0, 'Actual virtual focus lies on axis')
    elif name in ['magnifier', 'telescope', 'microscope']:
        emerging = [ray('emergent-'+str(j)) for j in range(3)]
        for q in emerging[1:]:
            parallel(emerging[0], q, 'Actual final rays parallel for image at infinity')
        if name == 'telescope':
            for j in range(3):
                close(ray('objective-ray-'+str(j))['to'][0], s['objective'], 'Actual telescope intermediate focal plane')
                close(ray('emergent-'+str(j))['from'][0], s['objective']+s['eyepiece'], 'Actual telescope lens separation')
                close(slope(ray('emergent-'+str(j)))/slope(ray('incident-'+str(j))), -s['objective']/s['eyepiece'], 'Actual telescope signed angular magnification')
        elif name == 'microscope':
            u = s['objective']*(s['objective']+s['interval'])/s['interval']
            for j in range(3):
                close(ray('incident-'+str(j))['from'][0], -u, 'Actual microscope object conjugate')
                close(ray('objective-ray-'+str(j))['to'][0], s['objective']+s['interval'], 'Actual microscope intermediate plane')
                close(ray('emergent-'+str(j))['from'][0], s['objective']+s['interval']+s['eyepiece'], 'Actual microscope lens separation')
                close(ray('objective-ray-'+str(j))['to'][1]/ray('incident-'+str(j))['from'][1], -s['interval']/s['objective'], 'Actual microscope inverted intermediate magnification')
        else:
            for j in range(3):
                close(ray('incident-'+str(j))['from'][0], -s['focal'], 'Actual magnifier object at focal plane')
                close(slope(ray('emergent-'+str(j))), -ray('incident-'+str(j))['from'][1]/s['focal'], 'Actual magnifier parallel final direction')
    elif name == 'pinhole':
        for j in range(3):
            a, b = ray('incident-'+str(j)), ray('screen-ray-'+str(j))
            parallel(a, b, 'Actual pinhole ray straight through aperture')
            close(a['to'][0], 0, 'Actual ray crosses pinhole x')
            close(a['to'][1], 0, 'Actual ray crosses pinhole y')
            close(b['to'][0], s['screen'], 'Actual ray reaches screen')
            close(b['to'][1], -a['from'][1]*s['screen']/s['distance'], 'Actual pinhole inverted image height')


def verify_physics(result):
    """Independent equations against the browser descriptor and rendered rays."""
    name, state, geo = result['id'], result['state'], result['geometry']
    values = geo.get('values', {})
    expected = {}
    if name == 'ray_slab':
        i = math.radians(state['angle']);r = math.asin(math.sin(i)/state['index'])
        expected = {'shift': state['thickness']*math.sin(i-r)/math.cos(r), 'refracted': math.degrees(r), 'emergent': state['angle']}
    elif name == 'apparent_depth':
        expected = {'apparent': state['depth']/state['index'], 'rise': state['depth']*(1-1/state['index'])}
        verify(geo.get('model') == 'paraxial', 'Apparent depth must declare near-normal approximation')
    elif name == 'brewster':
        expected = {'angle': math.degrees(math.atan(state['index']/state['index1'])), 'sum': 90}
    elif name == 'mirror_rotation':
        expected = {'deviation': 2*state['rotation']}
    elif name == 'fiber_acceptance':
        expected = {'aperture': math.sqrt(state['core']**2-state['cladding']**2), 'angle': math.degrees(math.asin(min(1, math.sqrt(state['core']**2-state['cladding']**2))))}
    elif name == 'lens_power':
        expected = {'power': 100/state['focal']}
    elif name == 'lenses_contact':
        power = state['power1']+state['power2'];expected = {'power': power}
        if abs(power) < 1e-9:
            verify(geo.get('image', {}).get('kind') in ['none', 'infinite'], 'Zero total power has a finite image/focus')
            verify(not any('focus' in str(m['descriptor']).lower() for m in result['markers']), 'Afocal contact system shows a finite focal marker')
            verify(result['readouts'][1]['value'] == '—', 'Afocal system displays a fake finite focal-length readout')
        elif power < 0:
            verify(any(r['dashed'] for r in result['rays']), 'Negative contact power lacks dashed virtual back extensions')
    elif name == 'magnifier':
        expected = {'magnification': 25/state['focal']}
        verify(geo.get('image', {}).get('kind') == 'infinite', 'Magnifier at focal plane has finite screen image')
    elif name == 'telescope':
        expected = {'magnification': -state['objective']/state['eyepiece'], 'lengthNow': state['objective']+state['eyepiece']}
        verify(geo.get('image', {}).get('kind') == 'infinite', 'Telescope final image is not at infinity')
    elif name == 'microscope':
        expected = {'magnification': state['interval']*25/(state['objective']*state['eyepiece']), 'linear': state['interval']/state['objective'], 'ocular': 25/state['eyepiece']}
        verify(geo.get('image', {}).get('kind') == 'infinite', 'Microscope final image is not at infinity')
    elif name == 'pinhole':
        expected = {'image': -100*state['height']*state['screen']/state['distance'], 'magnification': -state['screen']/state['distance']}
    for key, value in expected.items():
        verify(key in values, f'{name}: browser geometry lacks independently verifiable {key}')
        close(values[key], value, name + '/' + key)
    actual_ray_equations(result)


def image(page, label):
    page.locator('#visual canvas').scroll_into_view_if_needed()
    page.wait_for_function('window.__qaViewer?.dirty===false&&window.__qaViewer?.lastPaint>0')
    page.locator('#visual canvas').screenshot(path=str(OUT / (label + '.png')))


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=args.chromium, headless=True,
                                         args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    REPORT['browser'] = browser.version
    for width in [int(value) for value in args.widths.split(',')]:
        ctx = context(browser, width)
        page = ctx.new_page()
        try:
            open_lab(page, SELECTED[0])
            catalog = page.evaluate(r'''async()=>{const url=performance.getEntriesByType('resource').find(e=>/\/experiments\.js(?:\?|$)/.test(e.name)).name;return(await import(url)).experiments.filter(e=>['ray_slab','apparent_depth','brewster','mirror_rotation','fiber_acceptance','lens_power','lenses_contact','magnifier','telescope','microscope','pinhole'].includes(e.id)).map(e=>({id:e.id,params:e.params.map(p=>({key:p.key,min:p.min,max:p.max,value:p.value}))}));}''')
            for item in catalog:
                if item['id'] not in SELECTED:
                    continue

                def model_case(item=item, width=width):
                    name = item['id'];open_lab(page, name)
                    defaults = {p['key']: p['value'] for p in item['params']}
                    cases = [('default', defaults)]
                    # Every visible numerical input is tested at both full UI endpoints
                    # while other parameters retain defaults, including expanded domains.
                    if width in [390, 1440] and not args.defaults_only:
                        for parameter in item['params']:
                            for endpoint in ['min', 'max']:
                                cases.append((parameter['key']+'-'+endpoint, {**defaults, parameter['key']: parameter[endpoint]}))
                        if name == 'lenses_contact':
                            cases.extend([('afocal', {'power1': 4, 'power2': -4}),
                                          ('diverging', {'power1': -4, 'power2': -2})])
                    if name == 'pinhole' and width in [390, 1440]:
                        definitions = {p['key']: p for p in item['params']}
                        cases.append(('joint-corner', {'distance': definitions['distance']['max'],
                                                      'screen': definitions['screen']['min'],
                                                      'height': definitions['height']['min']}))
                    evidence = []
                    for label, state in cases:
                        numbers(page, state);page.locator('[data-action="fit-view"]').click();page.wait_for_timeout(45)
                        result = scene(page);verify_scene(result, name)
                        evidence.append({'case': label, **result})
                        if name == 'pinhole':
                            verify(page.evaluate('''()=>{const part=window.__qaViewer.model.group.getObjectByName('optics-aperture-aperture');return part?.children.some(o=>o.visible&&o.isMesh&&o.scale.y>0)}'''),
                                   'Pinhole opaque mask vanishes at a small aperture corner')
                        if label == 'afocal':
                            page.locator('[data-action="record"]').first.click()
                            record = saved(page, name)['rows'][-1]
                            verify(None in record['values'], 'Afocal measurement replaces undefined focal length with finite data')
                        if width in [390, 1440]:
                            image(page, f'{width}-{name}-{label}')
                            if label in ['afocal', 'diverging']:
                                page.locator('.stage-shell').screenshot(path=str(OUT/f'{width}-{name}-{label}-panel.png'))
                    numbers(page, defaults)
                    for language in ['vi-VN', 'en-US']:
                        locale(page, language)
                        verify(page.locator('#conceptObservation').is_visible(), 'Readable relation panel missing')
                        verify(page.locator('#conceptObservation').get_attribute('aria-label'), 'Observation accessible name missing')
                        verify(page.locator('#conceptObservation .optics-legend li').count() >= 2, 'Ray legend missing')
                        verify(page.locator('#conceptObservation .optics-notes li').count() >= 1, 'Physical assumptions missing')
                        if name == 'apparent_depth':
                            text = page.locator('#conceptObservation').inner_text().lower()
                            verify(('xấp xỉ' in text and 'pháp tuyến' in text) if language == 'vi-VN'
                                   else ('paraxial' in text and 'near-normal' in text),
                                   'Apparent-depth approximation is not explained visibly in ' + language)
                        layout(page)
                    return evidence

                coverage = 'defaults' if args.defaults_only or width not in [390, 1440] else 'defaults and full UI extremes'
                run(f'WebGL rays {item["id"]} {width}px: {coverage}, VI/EN and no overflow', model_case)
        finally:
            ctx.close()

    for width in [390, 1440]:
        def interactions(width=width):
            ctx = context(browser, width);page = ctx.new_page();evidence = []
            try:
                for name in SELECTED:
                    open_lab(page, name)
                    field = page.locator('.controls [data-number]').first
                    key = field.get_attribute('data-number');old = float(field.input_value())
                    step = float(field.get_attribute('step') or 1);maximum = float(field.get_attribute('max'))
                    value = old+step if old+step <= maximum else old-step
                    before = scene(page);numbers(page, {key: value});changed = scene(page)
                    verify(before['fingerprint'] != changed['fingerprint'], 'Typed parameter has no rendered effect: ' + name)
                    identities = lambda result: {r['descriptor']['id']: (r['uuid'], r['geometryUUID']) for r in result['rays']}
                    verify(identities(before) == identities(changed), 'Changing a parameter recreates same-topology ray meshes/buffers: ' + name)
                    page.locator('.work-tabs [data-panel="data"]').click()
                    page.locator('[data-action="record"]').first.click();snapshot = saved(page, name)
                    verify(len(snapshot['rows']) == 1, 'Record did not save one measurement')
                    for language in ['en-US', 'vi-VN']:
                        locale(page, language);verify(saved(page, name) == snapshot, 'Locale changed physical state or measurement')
                    page.locator('[data-action="zoom-in"]').click();page.wait_for_timeout(90);manual = camera(page)
                    verify(manual['autoFrame'] is False, 'Zoom did not disable automatic refit')
                    for projection in ['2d', '3d']:
                        page.locator(f'[data-projection="{projection}"]').click()
                        verify(saved(page, name) == snapshot, 'Projection changed physical state or rows')
                        verify_scene(scene(page), name)
                        if projection == '2d':
                            image(page, f'{width}-{name}-2d')
                    verify(same_camera(camera(page), manual), '2D/3D roundtrip lost manual 3D camera')
                    page.locator('[data-action="play"]').click();page.wait_for_timeout(220)
                    verify(same_camera(camera(page), manual), 'Playback reset manual camera')
                    play = page.locator('[data-action="play"]')
                    if play.get_attribute('aria-pressed') == 'true' or page.locator('#runStatus').inner_text() not in ['Sẵn sàng', 'Ready', 'Đã kết thúc', 'Finished']:
                        play.click()
                    page.wait_for_timeout(65);verify(same_camera(camera(page), manual), 'Pause reset manual camera')
                    verify(identities(scene(page)) == identities(changed), 'Playback recreates same-topology ray meshes/buffers: ' + name)
                    page.locator('[data-action="fit-view"]').click();verify(camera(page)['autoFrame'] is True, 'Fit did not restore automatic framing')
                    verify(len(saved(page, name)['rows']) == 1, 'Playback changed recorded measurements')
                    layout(page);evidence.append({'id': name, 'numberChangedActualGeometry': True, 'recordedRows': 1,
                                                  'localeAndProjectionPreservedState': True, 'manualCameraPreservedDuringPlay': True, 'fitRestoredAutoFrame': True})
                # Configuration is intentionally absent; no real Google/Firebase call.
                page.locator('#openAccount').click();page.wait_for_selector('#accountDialog[open]')
                verify(page.locator('#accountGoogle').is_disabled(), 'Unconfigured Google action is enabled')
                verify(page.locator('#accountSubmit').is_disabled(), 'Unconfigured email auth is enabled')
                verify(page.locator('#accountStatus').inner_text(), 'Missing auth config has no explanation')
                page.keyboard.press('Escape')
                return evidence
            finally:
                ctx.close()
        run(f'Interaction {width}px: number, record, locale, 2D/3D, playback, manual zoom, fit and disabled auth', interactions)

    for width in [390, 1440]:
        def labels_in_2d(width=width):
            ctx = context(browser, width);page = ctx.new_page();evidence = []
            try:
                for name in ['ray_slab', 'apparent_depth', 'telescope', 'microscope', 'pinhole']:
                    if name not in SELECTED:
                        continue
                    open_lab(page, name)
                    disclosure = page.locator('.controls .display-settings')
                    if disclosure.get_attribute('open') is None:
                        disclosure.locator(':scope > summary').click()
                    page.locator('.controls [data-switch="labels"]').check()
                    page.wait_for_timeout(80)
                    inspect = r'''()=>{const g=window.__qaViewer.model.group;let rig;g.traverse(o=>{if(o.userData.isRig)rig=o;});const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true};let rigLabels=0,opticalLabels=0,handles=0;rig?.traverse(o=>{if(o.userData.modelLabel&&visible(o))rigLabels++;if(o.userData.param&&visible(o))handles++;});g.traverse(o=>{if(o.userData.opticsLabel&&visible(o))opticalLabels++;});return{rigLabels,opticalLabels,handles};}'''
                    before = page.evaluate(inspect);verify(before['rigLabels'] > 0, '3D parameter captions missing with labels enabled')
                    snapshot = saved(page, name)
                    page.locator('[data-projection="2d"]').click();page.wait_for_timeout(80)
                    flat = page.evaluate(inspect)
                    verify(flat['rigLabels'] == 0, 'Parameter captions overlap the 2D ray diagram')
                    verify(flat['handles'] > 0 and flat['handles'] == before['handles'], 'Hiding 2D parameter captions removed interaction handles')
                    verify(flat['opticalLabels'] > 0, '2D suppresses the actual optical labels')
                    verify(saved(page, name) == snapshot, 'Caption/projection control changed measurements')
                    page.locator('[data-action="fit-view"]').click();image(page, f'{width}-{name}-2d-labels')
                    page.locator('[data-projection="3d"]').click();page.wait_for_timeout(70)
                    restored = page.evaluate(inspect)
                    verify(restored['rigLabels'] == before['rigLabels'], '3D parameter captions do not return')
                    verify(saved(page, name) == snapshot, '3D caption restoration changed measurements')
                    layout(page);evidence.append({'id': name, '3d': before, '2d': flat, 'restored': restored})
                return evidence
            finally:
                ctx.close()
        run(f'Labels in 2D {width}px: ray symbols visible, parameter captions hidden, handles retained and 3D captions restored', labels_in_2d)
    browser.close()

run('No uncaught JavaScript, failed local assets or external provider requests',
    lambda: (verify(not REPORT['pageErrors'] and not REPORT['httpErrors'] and not REPORT['externalRequests'],
                    json.dumps({key: REPORT[key] for key in ['pageErrors', 'httpErrors', 'externalRequests']})) or
             {'pageErrors': [], 'httpErrors': [], 'externalRequests': []}))
failed = [test for test in REPORT['tests'] if test['status'] == 'FAIL']
print(json.dumps({'passed': len(REPORT['tests'])-len(failed), 'failed': len(failed), 'report': str(OUT/'report.json')}))
raise SystemExit(1 if failed else 0)
