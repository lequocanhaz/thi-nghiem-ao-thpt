"""Optional UI regression checks against an already running local dist server.

Python Playwright + Chromium/SwiftShader; simulated viewports, not real devices.
Writes screenshots/report/session download only beneath /tmp/quanh-ui-v53-qa.
"""
import json
import time
import traceback
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:4173/'
OUT = Path('/tmp/quanh-ui-v53-qa')
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {'scope': 'Chromium headless SwiftShader, desktop and simulated mobile viewports; no external services', 'tests': [], 'pageErrors': [], 'blockedExternalRequests': [], 'limits': ['No real Safari/iPhone/Android or hardware FPS test.', '300 formula syntax coverage belongs to the existing Node suite; this browser test covers UI state and actual selected math.', 'A fresh isolated browser context is used; no existing user storage/profile is touched.']}


def verify(condition, message):
    if not condition:
        raise AssertionError(message)


def save_report():
    (OUT / 'report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))


def run(name, fn):
    start = time.monotonic()
    try:
        evidence = fn()
        REPORT['tests'].append({'name': name, 'status': 'PASS', 'evidence': evidence, 'durationMs': round((time.monotonic() - start) * 1000)})
        print('PASS', name, flush=True)
    except Exception as error:
        REPORT['tests'].append({'name': name, 'status': 'FAIL', 'error': str(error), 'traceback': traceback.format_exc(), 'durationMs': round((time.monotonic() - start) * 1000)})
        print('FAIL', name, str(error), flush=True)
    save_report()


def network_guard(route):
    if urlsplit(route.request.url).netloc == '127.0.0.1:4173':
        route.continue_()
    else:
        REPORT['blockedExternalRequests'].append({'url': route.request.url, 'method': route.request.method})
        route.abort('blockedbyclient')


def context(browser, width, mobile=False):
    ctx = browser.new_context(viewport={'width': width, 'height': 900 if not mobile else 844}, is_mobile=mobile, has_touch=mobile, accept_downloads=True, service_workers='block')
    ctx.route('**/*', network_guard)
    return ctx


def open_lab(page, name):
    page.goto(BASE + '#lab/' + name)
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('#visual canvas', timeout=25000)
    page.wait_for_selector('.teaching-guide-content [data-lesson="' + name + '"]', state='attached', timeout=15000)
    page.wait_for_timeout(250)


def saved(page, name='electric'):
    return page.evaluate('''id=>{const s=JSON.parse(localStorage.getItem('thpt-lab-v1'))[id];return {state:s.state,rows:s.rows,notes:s.notes,prediction:s.prediction}}''', name)


def details_open(page, selector):
    details = page.locator(selector)
    if not details.evaluate('(e)=>e.open'):
        details.locator(':scope > summary').click()


def card_math(page, width):
    page.wait_for_function("document.querySelectorAll('.catalog-formula .math-tex').length===24 && [...document.querySelectorAll('.catalog-formula .math-tex')].every(e=>e.dataset.mathRendered==='true')")
    sizes = page.evaluate('''()=>[...document.querySelectorAll('.card-image')].map(card=>{const f=card.querySelector('.math-formula'),k=card.querySelector('.katex'),display=card.querySelector('.katex-html'),bounds=card.getBoundingClientRect(),frame=f.getBoundingClientRect(),ink=display.getBoundingClientRect();return {id:card.dataset.thumb,fontSize:parseFloat(getComputedStyle(k).fontSize),card:bounds.toJSON(),frame:frame.toJSON(),ink:ink.toJSON(),scrollHeight:f.scrollHeight,clientHeight:f.clientHeight};})''')
    for size in sizes:
        verify(10 <= size['fontSize'] <= 25, 'Unexpected card math font size: ' + json.dumps(size))
        verify(size['frame']['top'] >= size['card']['top'] - 1 and size['frame']['bottom'] <= size['card']['bottom'] + 1, 'Formula frame extends outside card image: ' + json.dumps(size))
        verify(size['ink']['top'] >= size['frame']['top'] - 2 and size['ink']['bottom'] <= size['frame']['bottom'] + 2, 'Formula glyphs clipped vertically: ' + json.dumps(size))
        verify(size['scrollHeight'] <= size['clientHeight'] + 2, 'Formula needs hidden vertical scrolling: ' + json.dumps(size))
    page.screenshot(path=str(OUT / f'library-math-{width}.png'), full_page=True)
    return sizes


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    desktop = context(browser, 1440)
    page = desktop.new_page()
    page.set_default_timeout(8000)
    page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
    try:
        open_lab(page, 'electric')

        def desktop_state():
            page.locator('[data-mode=measure]').click()
            page.locator('.work-tabs [data-panel=tasks]').click()
            page.locator('#notes').fill('QA v53: giữ ghi chép, tham số và hai dòng đo qua thay đổi bố cục.')
            page.locator('.work-tabs [data-panel=data]').click()
            input_node = page.locator('.controls [data-number]').first
            key = input_node.get_attribute('data-number')
            step = float(input_node.get_attribute('step') or 1)
            old = float(input_node.input_value())
            maximum = float(input_node.get_attribute('max'))
            new = old + step if old + step <= maximum else old - step
            input_node.fill(str(new))
            input_node.press('Tab')
            page.locator('[data-action=record]').first.click()
            page.locator('[data-action=record]').first.click()
            page.evaluate('''()=>{window.__qaInput=document.querySelector('.controls [data-number]');window.__qaSaved=JSON.parse(localStorage.getItem('thpt-lab-v1')).electric;}''')
            before = saved(page)
            for action in ['toggle-controls', 'toggle-dock']:
                button = page.locator('.workspace-toolbar [data-action="' + action + '"]')
                button.click()
                hidden = '#controlsPanel' if action == 'toggle-controls' else '#researchPanel'
                verify(not page.locator(hidden).is_visible(), action + ' does not collapse its target')
                button.click()
                verify(page.locator(hidden).is_visible(), action + ' does not reopen its target')
                verify(page.evaluate("window.__qaInput===document.querySelector('.controls [data-number]')"), 'Layout toggle recreated parameter input')
            parents = []
            for width in [1100, 1440, 1100, 1440]:
                page.set_viewport_size({'width': width, 'height': 900})
                page.wait_for_timeout(150)
                verify(page.evaluate("window.__qaInput===document.querySelector('.controls [data-number]')"), 'Responsive reparenting recreated input at ' + str(width))
                verify(saved(page) == before, 'Responsive layout changed state, notes or rows')
                parents.append({'width': width, 'parent': input_node.evaluate("e=>e.closest('.controls').parentElement.className")})
            verify(len(before['rows']) == 2 and before['notes'].startswith('QA v53'), 'Fixture did not save rows/notes')
            return {'key': key, 'value': new, 'rowCount': 2, 'sameInputNode': True, 'parents': parents}
        run('desktop collapse/resize preserves input identity and session data', desktop_state)

        def sticky_dock():
            page.set_viewport_size({'width': 1440, 'height': 900})
            page.locator('[data-mode=measure]').click()
            verify(page.locator('.controls').evaluate("e=>getComputedStyle(e).position") == 'sticky', 'Desktop parameters are not sticky')
            if page.locator('.lab').get_attribute('data-data-expanded') != 'true':
                page.locator('[data-action=expand-data]').click()
            samples = []
            document_top = page.locator('#researchPanel').evaluate('e=>e.getBoundingClientRect().top+scrollY')
            for y in [0, 250, 500, document_top - 500, document_top - 220, document_top]:
                page.evaluate('(y)=>scrollTo(0,Math.max(0,y))', y)
                page.wait_for_timeout(120)
                result = page.evaluate('''()=>{const a=document.querySelector('.controls').getBoundingClientRect(),b=document.querySelector('#researchPanel').getBoundingClientRect();const overlap=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));return {scroll:scrollY,controls:a.toJSON(),dock:b.toJSON(),overlap};}''')
                verify(result['overlap'] < 1, 'Sticky controls overlap expanded dock: ' + json.dumps(result))
                samples.append(result)
            page.screenshot(path=str(OUT / 'desktop-expanded-dock.png'), full_page=True)
            return samples
        run('desktop sticky controls stop before expanded research dock', sticky_dock)

        def session_round_trip():
            # Set up this case independently: a prior case may have failed before
            # it could create rows or notes. Compare against the actual fixture.
            page.locator('[data-mode=measure]').click()
            page.locator('.work-tabs [data-panel=tasks]').click()
            page.locator('#notes').fill('QA v53 phiên: khôi phục ghi chép và dữ liệu từ bản sao tải xuống.')
            page.locator('.work-tabs [data-panel=data]').click()
            page.locator('[data-action=record]').first.click()
            fixture = saved(page)
            summary = page.locator('.session-menu > summary')
            summary.focus()
            summary.press('Enter')
            verify(page.locator('.session-menu').evaluate('e=>e.open'), 'Keyboard did not open session menu')
            summary.press('Tab')
            page.keyboard.press('Escape')
            verify(not page.locator('.session-menu').evaluate('e=>e.open'), 'Escape did not close session menu')
            verify(summary.evaluate('e=>e===document.activeElement'), 'Session Escape lost summary focus')
            details_open(page, '.session-menu')
            with page.expect_download() as download_event:
                page.locator('[data-action=save-session]').click()
            destination = OUT / 'electric-phien.json'
            download_event.value.save_as(destination)
            exported = json.loads(destination.read_text())
            verify(exported['schema'] == 'thpt.session.v1' and exported['rows'] == fixture['rows'] and len(exported['rows']) > 0, 'Session download has wrong schema/rows')
            verify(exported['notes'].startswith('QA v53'), 'Session export lost notes')
            page.keyboard.press('Escape')
            page.locator('.work-tabs [data-panel=tasks]').click()
            page.locator('#notes').fill('Thay đổi tạm để chứng minh nhập lại bản sao.')
            details_open(page, '.session-menu')
            with page.expect_file_chooser() as file_event:
                page.locator('[data-action=import-session]').click()
            file_event.value.set_files(destination)
            page.wait_for_function("document.querySelector('#toast').textContent==='Đã mở phiên thí nghiệm.'")
            restored = saved(page)
            for field in ['state', 'rows', 'notes', 'prediction']:
                verify(restored[field] == exported[field], 'Import failed to restore ' + field)
            page.locator('.work-tabs [data-panel=tasks]').click()
            verify(page.locator('#notes').input_value() == exported['notes'], 'Restored notes not visible in notebook')
            return {'download': str(destination), 'rowsRestored': len(restored['rows']), 'notesRestored': True, 'nativeKeyboardMenu': True}
        run('session native menu and real JSON download/import', session_round_trip)

        def assistant_draft():
            page.locator('#openAssistant').click()
            prompts = page.locator('#aiAssistant .ai-prompt')
            verify(prompts.count() == 3, 'Expected three contextual draft prompts')
            page.locator('#aiQuestion').fill('Bản nháp của giáo viên.')
            requests_before = len(REPORT['blockedExternalRequests'])
            prompts.first.click()
            page.wait_for_timeout(350)
            draft = page.locator('#aiQuestion').input_value()
            verify(draft.startswith('Bản nháp của giáo viên.\n') and len(draft) > 50, 'Prompt overwrote existing draft or failed to append question')
            verify(len(REPORT['blockedExternalRequests']) == requests_before, 'Prompt attempted external service call')
            verify(page.locator('.ai-message[data-role=user]').count() == 0, 'Prompt submitted a message without explicit send')
            verify(page.locator('#aiQuestion').evaluate('e=>e===document.activeElement'), 'Prompt did not return focus to composer')
            page.locator('[data-ai=close]').click()
            return {'prompts': 3, 'draftPreserved': True, 'networkCalls': 0, 'autosubmittedMessages': 0}
        run('assistant prompts append drafts without automatic requests', assistant_draft)

        def desktop_library():
            ctx = context(browser, 1440)
            library = ctx.new_page()
            library.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
            try:
                library.goto(BASE + '#library')
                library.wait_for_load_state('networkidle')
                return card_math(library, 1440)
            finally:
                ctx.close()
        run('cold #library desktop 1440 hydrates catalog and fits 24 formulas', desktop_library)

        def fresh_mobile_library():
            ctx = context(browser, 390, mobile=True)
            library = ctx.new_page()
            library.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
            try:
                library.goto(BASE + '#library')
                library.wait_for_load_state('networkidle')
                return card_math(library, 390)
            finally:
                ctx.close()
        run('cold #library mobile 390 hydrates catalog and fits 24 formulas', fresh_mobile_library)


        for width in [320, 390]:
            def mobile_checks(width=width):
                ctx = context(browser, width, mobile=True)
                mobile = ctx.new_page()
                mobile.set_default_timeout(8000)
                mobile.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error)))
                evidence = []
                try:
                    for name in ['ohm', 'electric', 'resonance']:
                        open_lab(mobile, name)
                        mobile.wait_for_timeout(800)
                        layout = mobile.evaluate('''()=>{const p=document.querySelector('#play'),b=p.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,scroll:scrollY,play:b.toJSON(),playUncovered:!!hit&&p.contains(hit)};}''')
                        verify(layout['pageWidth'] <= width + 1, 'Mobile page overflow: ' + name + ' ' + json.dumps(layout))
                        verify(layout['play']['top'] >= 0 and layout['play']['bottom'] <= 844 and layout['playUncovered'], 'Chạy button not visible/uncovered after initial load: ' + name + ' ' + json.dumps(layout))
                        if name == 'electric':
                            summary = mobile.locator('.view-menu > summary')
                            summary.focus()
                            summary.press('Enter')
                            verify(mobile.locator('.view-menu').evaluate('e=>e.open'), 'Tools keyboard open failed')
                            verify(mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Open Tools menu created horizontal overflow')
                            axes = mobile.locator('.view-menu [data-action=toggle-axes]')
                            before = axes.get_attribute('aria-pressed')
                            axes.focus()
                            axes.press('Enter')
                            verify(axes.get_attribute('aria-pressed') != before, 'Axes control stopped working inside menu')
                            mobile.keyboard.press('Escape')
                            verify(not mobile.locator('.view-menu').evaluate('e=>e.open'), 'Escape did not close Tools')
                            verify(summary.evaluate('e=>e===document.activeElement'), 'Tools Escape did not restore summary focus')
                            verify(mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Opening Tools created horizontal overflow')
                        mobile.screenshot(path=str(OUT / f'mobile-{width}-{name}.png'), full_page=True)
                        evidence.append({'id': name, **layout})
                    mobile.goto(BASE + '#library')
                    mobile.wait_for_load_state('networkidle')
                    mobile.wait_for_selector('.experiment-card')
                    verify(mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Library overflows mobile viewport')
                    # The context has already opened WebGL experiments, so the
                    # thumbnail pipeline may replace fallback formulas with actual
                    # previews. Formula layout is tested in its own fresh context.
                    mobile.screenshot(path=str(OUT / f'mobile-{width}-library.png'), full_page=True)
                    return evidence
                finally:
                    ctx.close()
            run(f'mobile {width}: initial Chạy visibility, menu keyboard/axes and no overflow', mobile_checks)
    finally:
        desktop.close()
        browser.close()

REPORT['summary'] = {status: sum(t['status'] == status for t in REPORT['tests']) for status in ['PASS', 'FAIL']}
save_report()
print(json.dumps(REPORT['summary']), flush=True)
raise SystemExit(1 if REPORT['summary']['FAIL'] or REPORT['pageErrors'] else 0)
