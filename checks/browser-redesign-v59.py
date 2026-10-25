"""Quanh Lab browser regression checks against an existing static HTTP server.

Run: python checks/browser-redesign-v59.py --base http://127.0.0.1:4173/ --out work/qa-v59
Requires Python Playwright and Chromium. Uses isolated profiles and blocks external assistant
access; never reads real user storage or calls the AI provider. Viewports are
simulated Chromium screens, not physical iPhone/Safari/Android certification.
"""
import argparse
import json
import os
import re
import time
import traceback
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', default='http://127.0.0.1:4173/')
parser.add_argument('--out', default='work/qa-v59')
parser.add_argument('--chromium', default=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'))
parser.add_argument('--only', default='', help='Optional regex selecting test names')
parser.add_argument('--widths', default='320,375,390,414,430,768,1024,1440,1920')
args = parser.parse_args()
BASE = args.base.rstrip('/') + '/'
OUT = Path(args.out)
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {'testFilter': args.only or 'all', 'scope': 'Chromium headless + SwiftShader; isolated profiles, external AI blocked; simulated responsive viewports', 'tests': [], 'pageErrors': [], 'requests': [], 'localHTTPErrors': [], 'limits': ['No physical iPhone, iOS Safari or Android Chrome test.', 'No hardware FPS, real virtual keyboard or exhaustive visual review of all 300 labs.', 'Independent model/catalog/asset coverage is supplied by npm run check.']}


def verify(condition, message):
    if not condition:
        raise AssertionError(message)


def run(name, function):
    if args.only and not re.search(args.only, name):
        return
    start = time.monotonic()
    try:
        REPORT['tests'].append({'name': name, 'status': 'PASS', 'evidence': function(), 'durationMs': round((time.monotonic() - start) * 1000)})
        print('PASS', name, flush=True)
    except Exception as error:
        REPORT['tests'].append({'name': name, 'status': 'FAIL', 'error': str(error), 'traceback': traceback.format_exc(), 'durationMs': round((time.monotonic() - start) * 1000)})
        print('FAIL', name, str(error), flush=True)
    (OUT / 'report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))


def guard(route):
    if urlsplit(route.request.url).netloc == urlsplit(BASE).netloc:
        route.continue_()
    else:
        REPORT['requests'].append({'url': route.request.url, 'method': route.request.method, 'blocked': True})
        route.abort('blockedbyclient')


def new_context(browser, width=1440):
    context = browser.new_context(viewport={'width': width, 'height': 900 if width >= 768 else 844}, has_touch=width < 768, is_mobile=width < 768, accept_downloads=True, service_workers='block')
    context.route('**/*', guard)
    context.on('page', lambda page: page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error))))
    context.on('response', lambda response: REPORT['localHTTPErrors'].append({'url': response.url, 'status': response.status}) if response.status >= 400 and urlsplit(response.url).netloc == urlsplit(BASE).netloc else None)
    return context


def goto(page, route=''):
    page.goto(BASE + route)
    page.wait_for_load_state('networkidle')
    if '#lab/' in route:
        page.wait_for_selector('#visual canvas', timeout=30000)
    elif route.startswith('books.html?'):
        page.wait_for_selector('.paper-page img', timeout=15000)
    else:
        page.wait_for_selector('#search', timeout=15000)


def locale(page, name):
    page.locator('[data-locale="' + name + '"]').click()
    page.wait_for_function('(name)=>document.documentElement.lang.slice(0,2)===name.slice(0,2)', arg=name)
    page.wait_for_timeout(80)


def saved(page, name='electric'):
    return page.evaluate("id=>{const s=JSON.parse(localStorage.getItem('thpt-lab-v1'))[id];return {state:s.state,rows:s.rows,notes:s.notes,prediction:s.prediction}}", name)


def open_details(page, selector):
    details = page.locator(selector)
    if not details.evaluate('e=>e.open'):
        details.locator(':scope > summary').click()


def layout(page):
    result = page.evaluate('''()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,lang:document.documentElement.lang,header:document.querySelector('header').getBoundingClientRect().toJSON(),overflow:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&r.right>innerWidth+2&&r.left>=0&&!e.closest('.book-stage,.topic-chips,.table-wrap,.graph-scroll,.ai-messages')}).slice(0,8).map(e=>({tag:e.tagName,id:e.id,cls:e.className,right:Math.round(e.getBoundingClientRect().right)}))})''')
    verify(result['scroll'] <= result['width'] + 2, 'Document horizontal overflow: ' + json.dumps(result, ensure_ascii=False))
    return result


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=args.chromium, headless=True, args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    for width in [int(value) for value in args.widths.split(',')]:
        def responsive(width=width):
            context = new_context(browser, width)
            page = context.new_page()
            evidence = []
            try:
                for route in ['', '#library', '#lab/electric', 'books.html?grade=10&page=7']:
                    goto(page, route)
                    for language in ['vi-VN', 'en-US']:
                        locale(page, language)
                        item = layout(page)
                        item.update({'route': route or 'home', 'locale': language})
                        evidence.append(item)
                    if route == '#lab/electric':
                        page.locator('#openAssistant').click()
                        chat = page.locator('#aiAssistant').bounding_box()
                        composer = page.locator('.ai-compose').bounding_box()
                        verify(chat['x'] >= -1 and chat['x'] + chat['width'] <= width + 1, 'Assistant escapes horizontal viewport')
                        verify(composer['y'] >= 0 and composer['y'] + composer['height'] <= page.viewport_size['height'] + 1, 'Composer outside viewport')
                        page.locator('[data-ai=close]').click()
                    if width in [320, 390, 1440] and route in ['', '#library', '#lab/electric', 'books.html?grade=10&page=7']:
                        name = (route.replace('#', '').replace('/', '-').replace('?', '-').replace('&', '-').replace('=', '-') or 'home')
                        page.evaluate('scrollTo(0,0)')
                        page.screenshot(path=str(OUT / f'{width}-{name}.png'), full_page=True)
                return evidence
            finally:
                context.close()
        run(f'responsive {width}px: home/library/lab/book VI and EN + assistant bounds', responsive)

    def library_search():
        context = new_context(browser)
        page = context.new_page()
        try:
            goto(page, '#library')
            page.wait_for_selector('#cards .katex', state='attached')
            results = []
            for language, query in [('vi-VN', 'định luật ohm'), ('en-US', 'Ohm'), ('vi-VN', 'electric field')]:
                locale(page, language)
                page.locator('#search').fill(query)
                page.wait_for_timeout(350)
                count = page.locator('#cards .experiment-card').count()
                verify(count > 0, f'No bilingual search results for {query}')
                results.append({'locale': language, 'query': query, 'cards': count, 'status': page.locator('#resultCount').inner_text()})
            page.locator('#search').fill('qa-no-experiment-123456789')
            page.wait_for_timeout(350)
            verify(page.locator('#cards .empty').count() == 1, 'Missing no-results guidance')
            page.locator('#cards [data-action="clear-filters"]').click()
            page.wait_for_timeout(150)
            verify(page.locator('#search').input_value() == '', 'Clear filters did not clear query')
            verify(page.locator('#cards .experiment-card').count() > 0, 'Clear filters did not restore cards')
            page.locator('#library [data-grade="10"]').click()
            page.wait_for_timeout(150)
            verify(page.locator('#library [data-grade="10"]').get_attribute('aria-pressed') == 'true', 'Grade filter missing selected state')
            return {'queries': results, 'noResults': True, 'clearFilters': True, 'gradeFilter': True}
        finally:
            context.close()
    run('bilingual search, no-result recovery and grade filtering', library_search)

    def navigation_history():
        context = new_context(browser)
        page = context.new_page()
        try:
            goto(page)
            page.locator('.header a[href="#library"]').click()
            count = page.evaluate('history.length')
            page.locator('#search').press_sequentially('Ohm', delay=50)
            page.wait_for_timeout(250)
            verify(page.evaluate('history.length') <= count + 1, 'Typing creates more than one browser-history entry per search edit')
            before_url = page.url
            first = page.locator('#cards .card-body').first
            destination = first.get_attribute('href')
            first.click()
            page.wait_for_selector('#visual canvas')
            page.go_back()
            page.wait_for_load_state('networkidle')
            page.wait_for_selector('#search')
            verify(page.locator('#search').input_value() == 'Ohm', 'Back lost the current search')
            verify(page.url == before_url, 'Back did not return to exact search URL')
            page.go_forward()
            page.wait_for_selector('#visual canvas')
            verify(page.url.endswith(destination), 'Forward did not restore selected lab')
            return {'typingAddsAtMostOneHistoryEntry': True, 'backRestoresSearch': True, 'forwardRestoresLab': True}
        finally:
            context.close()
    run('browser Back/Forward and typing-safe search history', navigation_history)

    def landscape():
        context = new_context(browser, 390)
        page = context.new_page()
        try:
            evidence = []
            for route in ['#lab/electric', 'books.html?grade=10&page=7']:
                goto(page, route)
                for width, height in [(844, 390), (667, 375), (390, 844)]:
                    page.set_viewport_size({'width': width, 'height': height})
                    page.wait_for_timeout(100)
                    item = layout(page)
                    item.update({'route': route, 'height': height})
                    evidence.append(item)
            return evidence
        finally:
            context.close()
    run('simulated landscape rotation 844×390 and 667×375, back to portrait', landscape)

    def session_language():
        context = new_context(browser)
        page = context.new_page()
        try:
            goto(page, '#lab/electric')
            page.locator('[data-mode="measure"]').click()
            page.locator('.work-tabs [data-panel="tasks"]').click()
            page.locator('#notes').fill('QA v59: preserve notes through language, resize, backup and reload.')
            page.locator('.work-tabs [data-panel="data"]').click()
            number = page.locator('.controls [data-number]').first
            key = number.get_attribute('data-number')
            old = float(number.input_value())
            step = float(number.get_attribute('step') or 1)
            maximum = float(number.get_attribute('max'))
            value = old + step if old + step <= maximum else old - step
            number.fill(str(value))
            number.press('Tab')
            page.locator('[data-action="record"]').first.click()
            page.locator('[data-action="record"]').first.click()
            before = saved(page)
            page.evaluate("()=>{window.__qaCanvas=document.querySelector('#visual canvas');window.__qaInput=document.querySelector('.controls [data-number]');}")
            for language in ['en-US', 'vi-VN', 'en-US']:
                locale(page, language)
                verify(saved(page) == before, 'Language changed saved measurement session')
                verify(page.evaluate("()=>window.__qaCanvas===document.querySelector('#visual canvas')&&window.__qaInput===document.querySelector('.controls [data-number]')"), 'Language remounted simulation or controls')
            for width in [390, 1440, 768, 1440]:
                page.set_viewport_size({'width': width, 'height': 900})
                page.wait_for_timeout(100)
                verify(saved(page) == before, 'Resize changed saved measurement session')
            open_details(page, '.session-menu')
            with page.expect_download() as event:
                page.locator('[data-action="save-session"]').click()
            backup_path = OUT / 'qa-electric-session.json'
            event.value.save_as(backup_path)
            backup = json.loads(backup_path.read_text())
            verify(backup['schema'] == 'thpt.session.v1' and backup['rows'] == before['rows'], 'Backup rows/schema mismatch')
            page.keyboard.press('Escape')
            page.locator('.work-tabs [data-panel="tasks"]').click()
            page.locator('#notes').fill('Temporary edit for import proof')
            open_details(page, '.session-menu')
            with page.expect_file_chooser() as event:
                page.locator('[data-action="import-session"]').click()
            event.value.set_files(backup_path)
            page.wait_for_selector('#dialog [data-action="confirm-import-session"]')
            page.locator('#dialog [data-action="confirm-import-session"]').click()
            page.wait_for_timeout(250)
            verify(saved(page) == before, 'Import failed to restore session')
            page.reload()
            page.wait_for_load_state('networkidle')
            page.wait_for_selector('#visual canvas')
            verify(saved(page) == before, 'Reload failed to preserve session')
            return {'parameter': key, 'value': value, 'recordedRows': len(before['rows']), 'languageRoundtrips': 3, 'sameCanvasAndInput': True, 'responsivePreservesSession': True, 'backupImportReload': True}
        finally:
            context.close()
    run('language switches and responsive layout preserve simulation, parameters, rows, notes; backup/import/reload', session_language)

    def measurement_delete():
        context = new_context(browser)
        page = context.new_page()
        try:
            goto(page, '#lab/electric')
            page.locator('[data-mode="measure"]').click()
            page.locator('.work-tabs [data-panel="data"]').click()
            page.locator('[data-action="record"]').first.click()
            before = saved(page)
            page.locator('[data-action="clear"]').click()
            verify(page.locator('#dialog').evaluate('e=>e.open'), 'Deleting measurements lacks confirmation dialog')
            verify(saved(page)['rows'] == before['rows'], 'Rows deleted before confirmation')
            page.locator('#dialog [data-action="close-dialog"]').first.click()
            verify(saved(page)['rows'] == before['rows'], 'Cancel did not retain measurements')
            page.locator('[data-action="clear"]').click()
            confirm = page.locator('#dialog [data-action="confirm-clear-data"],#dialog [data-action="clear-confirm"]')
            verify(confirm.count() == 1, 'Missing specific confirm-delete control')
            confirm.click()
            verify(saved(page)['rows'] == [], 'Confirmed delete did not clear rows')
            page.locator('[data-action="restore-data"]').click()
            verify(saved(page)['rows'] == before['rows'], 'Undo failed to restore deleted measurements')
            return {'confirmation': True, 'cancelRetainsRows': True, 'confirmDeletesRows': True, 'undoRestoresRows': True}
        finally:
            context.close()
    run('destructive measurement deletion: confirmation, cancel and undo', measurement_delete)

    def textbook_navigation():
        context = new_context(browser, 390)
        page = context.new_page()
        try:
            evidence = []
            for grade in [10, 11, 12]:
                goto(page, f'books.html?grade={grade}&page=7')
                for language in ['en-US', 'vi-VN']:
                    locale(page, language)
                    verify(page.locator('#bookPage').input_value() == '7', 'Language changed textbook page')
                page.locator('#bookNext').click()
                page.wait_for_function("document.querySelector('#bookPage').value==='8' && document.querySelector('#bookStage').getAttribute('aria-busy')==='false'")
                page.locator('#bookPrevious').click()
                page.wait_for_function("document.querySelector('#bookPage').value==='7' && document.querySelector('#bookStage').getAttribute('aria-busy')==='false'")
                page.locator('#zoomIn').click()
                verify(page.locator('#zoomValue').inner_text() != '100%', 'Textbook zoom failed')
                page.locator('#zoomOut').click()
                verify(page.locator('#zoomValue').inner_text() == '100%', 'Textbook reset zoom failed')
                verify(page.evaluate("[...document.querySelectorAll('.paper-page img')].every(e=>e.complete&&e.naturalWidth>0)"), 'Textbook image did not load')
                page.reload();page.wait_for_load_state('networkidle');page.wait_for_selector('.paper-page img')
                verify(page.locator('#bookPage').input_value() == '7', 'Reload changed textbook position')
                evidence.append({'grade': grade, 'pageRoundtrip': '7→8→7', 'zoom': True, 'localeRetainsPage': True, 'imageLoaded': True, 'reloadRetainsPage': True})
            return evidence
        finally:
            context.close()
    run('three textbooks: next/previous, zoom, original images and VI/EN page retention', textbook_navigation)

    def assistant_draft():
        context = new_context(browser, 390)
        page = context.new_page()
        try:
            goto(page, '#lab/electric')
            page.locator('#openAssistant').click()
            page.locator('#aiQuestion').fill('Teacher draft')
            before_requests = len(REPORT['requests'])
            page.locator('.ai-prompt').first.click()
            draft = page.locator('#aiQuestion').input_value()
            verify(draft.startswith('Teacher draft\n'), 'Context prompt overwrote draft')
            verify(len(REPORT['requests']) == before_requests, 'Draft prompt made external request')
            verify(page.locator('.ai-message[data-role="user"]').count() == 0, 'Draft prompt auto-submitted')
            page.locator('[data-ai="close"]').click()
            locale(page, 'en-US')
            page.locator('#openAssistant').click()
            verify(page.locator('#aiQuestion').input_value() == draft, 'Language switch lost AI draft')
            page.locator('[data-ai="close"]').click()
            page.locator('#openAssistant').click()
            verify(page.locator('#aiQuestion').input_value() == draft, 'Close/reopen lost AI draft')
            page.keyboard.press('Escape')
            verify(not page.locator('#aiAssistant').is_visible(), 'Escape failed to close assistant')
            verify(page.locator('#openAssistant').evaluate('e=>e===document.activeElement'), 'Close failed to restore opener focus')
            return {'draftPreserved': True, 'promptDoesNotSubmit': True, 'languagePreservesDraft': True, 'closeReopenPreservesDraft': True, 'escapeRestoresFocus': True}
        finally:
            context.close()
    run('assistant draft, contextual suggestions, language retention and Escape focus', assistant_draft)
    def discovery_pages():
        evidence = []
        for width in [320, 390, 1440]:
            context = new_context(browser, width)
            page = context.new_page()
            try:
                for route in ['experiments/', 'experiments/ohm.html', 'about.html', 'about-en.html']:
                    page.goto(BASE + route)
                    page.wait_for_load_state('networkidle')
                    item = layout(page)
                    verify(page.locator('h1').count() == 1, 'Static page lacks a single main heading')
                    verify(page.locator('main').count() == 1, 'Static page lacks main landmark')
                    if route == 'experiments/':
                        hrefs = page.locator('main a[href$=".html"]').evaluate_all('(els)=>els.map(e=>e.getAttribute("href"))')
                        verify(len(set(hrefs)) == 300, 'Experiment directory does not link to all 300 labs: ' + str(len(set(hrefs))))
                        item['experimentLinks'] = len(set(hrefs))
                    elif route == 'experiments/ohm.html':
                        page.wait_for_selector('.katex', state='attached')
                        cta = page.locator('a[href$="#lab/ohm"]').first
                        verify(cta.count() == 1, 'Static Ohm page lacks lab CTA')
                        cta.click()
                        page.wait_for_selector('#visual canvas', timeout=30000)
                        verify('#lab/ohm' in page.url, 'Learning page CTA did not open Ohm simulation')
                        item['formulaRenderedAndLabOpened'] = True
                    else:
                        verify(page.locator('a[href$="#library"]').count() >= 1, 'Product page lacks library CTA')
                    item['route'] = route
                    evidence.append(item)
                return_to = BASE + '#library'
                page.goto(return_to)
                page.wait_for_load_state('networkidle')
                for href in ['about.html', 'experiments/']:
                    link = page.locator('footer a[href="' + href + '"]')
                    verify(link.count() == 1, 'Footer is missing ' + href)
                    link.focus()
                    verify(link.evaluate('e=>e===document.activeElement'), 'Footer link cannot receive keyboard focus')
                return_evidence = True
            finally:
                context.close()
        return {'pages': evidence, 'footerKeyboardFocus': return_evidence}
    run('static discovery/product pages at320/390/1440:300 links, formulas, lab CTA, footer focus', discovery_pages)

    def scientific_meshes():
        evidence = []
        for width in [390, 1440]:
            context = new_context(browser, width)
            page = context.new_page()
            try:
                for name, state in [('collision', {'m1':5,'m2':5,'v1':2,'v2':-2,'e':0,'t':1.5}), ('collision', {'m1':0.05,'m2':15,'v1':2,'v2':-2,'e':0,'t':1.5}), ('resonance', {'f':1,'f0':1,'beta':0.1,'force':2,'t':0.125})]:
                    from urllib.parse import quote
                    route = '#lab/' + name + '?s=' + quote(json.dumps({'state':state}), safe='')
                    goto(page, route)
                    # Capture the instance through its existing public zoom method;
                    # restore the prototype immediately. No production hook or source rewrite.
                    page.evaluate(r"""async()=>{const url=performance.getEntriesByType('resource').find(e=>/\/scene3d\.js(?:\?|$)/.test(e.name)).name;const {LabScene}=await import(url);const zoom=LabScene.prototype.zoom;LabScene.prototype.zoom=function(...args){window.__qaActualViewer=this;LabScene.prototype.zoom=zoom;return zoom.apply(this,args);};}""")
                    page.locator('[data-action="zoom-in"]').click()
                    page.wait_for_function('!!window.__qaActualViewer?.model')
                    if name == 'collision':
                        result = page.evaluate(r"""async()=>{const url=performance.getEntriesByType('resource').find(e=>/\/vendor\/three\.module\.min\.js/.test(e.name)).name;const T=await import(url);const v=window.__qaActualViewer;v.model.group.updateMatrixWorld(true);const carts=[];v.model.group.traverse(o=>{if(o.name==='motion-cart')carts.push(o);});const boxes=carts.map(o=>new T.Box3().setFromObject(o,true));return {cartCount:carts.length,gap:boxes[1].min.x-boxes[0].max.x,renderer:v.renderer.constructor.name};}""")
                        verify(result['cartCount'] == 2 and abs(result['gap']) < 1e-6, 'Actual rendered collision carts do not touch without overlap: ' + json.dumps(result))
                    else:
                        positions = []
                        for t, expected in [(0.125, 1.65 / 2**0.5), (0.25, 1.65)]:
                            if t != 0.125:
                                page.evaluate('(state)=>{location.hash="lab/resonance?s="+encodeURIComponent(JSON.stringify({state}));}', {**state, 't': t})
                                page.wait_for_function('(t)=>JSON.parse(localStorage.getItem("thpt-lab-v1")).resonance.state.t===t', arg=t)
                            page.wait_for_timeout(80)
                            value = page.evaluate("window.__qaActualViewer.model.group.getObjectByName('oscillator-mass').position.x")
                            verify(abs(value - expected) < 1e-6, 'Actual resonance mass is clipped or incorrectly scaled: ' + str(value))
                            positions.append({'t': t, 'x': value, 'expected': expected})
                        result = {'positions': positions}
                    before = saved(page, name)
                    for mode in ['2d', '3d']:
                        page.locator('[data-projection="' + mode + '"]').click()
                        verify(saved(page, name) == before, 'Projection changed physical state or rows in ' + name)
                    page.evaluate('scrollTo(0,0)')
                    page.screenshot(path=str(OUT / f'{width}-{name}-{state.get("m1","sinusoid")}-actual-mesh.png'), full_page=True)
                    evidence.append({'width': width, 'experiment': name, 'state': state, **result, 'projectionRetainsState': True})
            finally:
                context.close()
        return evidence
    run('actual browser scene geometry: finite collision contact and unclipped resonant sinusoid at390/1440', scientific_meshes)
    browser.close()

run('no uncaught browser JavaScript errors', lambda: (verify(not REPORT['pageErrors'], '\n'.join(REPORT['pageErrors'])) or {'pageErrors': []}))
run('local HTTP assets load successfully', lambda: (verify(not REPORT['localHTTPErrors'], json.dumps(REPORT['localHTTPErrors'])) or {'failedAssets': []}))
failed = [test for test in REPORT['tests'] if test['status'] != 'PASS']
print(json.dumps({'passed': len(REPORT['tests'])-len(failed), 'failed': len(failed), 'report': str(OUT/'report.json')}, ensure_ascii=False))
raise SystemExit(1 if failed else 0)
