"""Independent Chromium checks for the reversible experiment selection.
No inference/provider requests. Viewports are not physical iPhone/Safari tests.
Run against a stable checkout; source hashes are recorded for reproducibility.
"""
import argparse
import hashlib
import json
import os
import traceback
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='http://127.0.0.1:4173/')
ap.add_argument('--out', default='work/curation77/qa')
ap.add_argument('--smoke-only', action='store_true')
ap.add_argument('--deep-only', action='store_true')
ap.add_argument('--widths', type=lambda value: [int(item.strip()) for item in value.split(',')],
    default=[320, 375, 390, 414, 430, 768, 1024, 1440, 1920],
    help='Comma-separated smoke viewport widths; defaults to the nine required widths.')
args = ap.parse_args()
if not args.widths or any(width < 1 for width in args.widths):
    ap.error('--widths must contain positive integer viewport widths')
out = Path(args.out)
out.mkdir(parents=True, exist_ok=True)
report = {'cases': [], 'errors': [], 'httpErrors': [], 'limits': [
    'Chromium/SwiftShader viewport emulation, not physical Safari/iPhone/Android or a virtual keyboard.',
    'No teacher acceptance, full scientific-model certification, or AI inference test.',
    'The main collection is a reversible editorial selection; supplementary does not mean scientifically invalid.'
]}
tracked = ['dist/app.js', 'dist/views.js', 'dist/library-selection-v77.js', 'dist/observation-view.js', 'dist/language-ui.js', 'dist/library-selection-v77.css', 'dist/boot.js', 'dist/index.html']

def hashes():
    return {name: hashlib.sha256(Path(name).read_bytes()).hexdigest() for name in tracked}

report['sourceStart'] = hashes()

def save():
    (out / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))

def no_overflow(page):
    assert page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth+1'), 'Document overflows horizontally'

def query(page):
    return parse_qs(urlsplit(page.url).query)

def ready(page):
    page.locator('#cards .experiment-card').first.wait_for(state='attached')
    page.locator('#collectionCount').wait_for(state='visible')

def collection(page, value):
    page.locator('.collection-switch [data-collection="' + value + '"]').click()
    assert page.locator('.collection-switch [data-collection="' + value + '"]').get_attribute('aria-pressed') == 'true'

def count(page):
    return int(page.locator('#collectionCount').inner_text())

def locale(page, value):
    page.locator('[data-locale="' + value + '"]').click()
    page.wait_for_function('(value)=>document.documentElement.lang===value', arg=('vi' if value=='vi-VN' else value))
    page.wait_for_timeout(100)

def show_details(page, selector):
    node = page.locator(selector)
    if node.get_attribute('open') is None:
        node.locator(':scope > summary').click()

def session(page, id):
    return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1")||"{}")[id]', id)

def snapshot_session(page, id):
    s = session(page, id)
    return {'state': s['state'], 'rows': s['rows'], 'notes': s['notes']}

def navigate_lab(page, id):
    page.goto(args.base + '#lab/' + id, wait_until='networkidle')
    page.locator('.lab[data-experiment="' + id + '"]').wait_for(state='attached')
    page.locator('.inquiry-workbook').wait_for(state='attached')
    page.locator('.shm-circle-svg' if id == 'oscillation' else '#visual canvas').first.wait_for(timeout=60000)

def open_data(page):
    if not page.locator('#researchPanel').is_visible():
        page.locator('.workspace-toolbar [data-action=toggle-dock]').click()
    page.locator('.work-tabs [data-panel=data]').click()

def open_parameters(page):
    if not page.locator('#controlsPanel').is_visible():
        page.locator('.workspace-toolbar [data-action=toggle-controls]').click()

with sync_playwright() as p:
    proxy = os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--enable-unsafe-swiftshader'],
        **({'proxy': {'server': proxy}} if args.base.startswith('https:') and proxy else {}))

    report['browserVersion'] = browser.version

    def context(width, theme):
        ctx = browser.new_context(viewport={'width': width, 'height': 844 if width < 621 else 1000},
            is_mobile=width < 621, has_touch=width < 621, reduced_motion='reduce')
        ctx.add_init_script("localStorage.setItem('quanh-appearance-v1'," + json.dumps(theme) + ");")
        # A context begins in Vietnamese; language changes must survive in-place.
        ctx.add_init_script("if(!localStorage.getItem('quanh.locale.v1'))localStorage.setItem('quanh.locale.v1','vi-VN');")
        page = ctx.new_page()
        page.set_default_timeout(45000)
        page.on('pageerror', lambda e: report['errors'].append(str(e)))
        page.on('response', lambda r: report['httpErrors'].append({'url': r.url, 'status': r.status}) if r.status >= 400 else None)
        return ctx, page

    def run(case, fn):
        ctx, page = context(case['width'], case['theme'])
        try:
            fn(page, case)
            no_overflow(page)
            case['status'] = 'PASS'
        except Exception as e:
            case.update(status='FAIL', error=str(e), trace=traceback.format_exc())
            try:
                page.screenshot(path=str(out / ('failure-' + case['name'] + '-' + str(case['width']) + '-' + case['theme'] + '.png')))
            except Exception:
                pass
        report['cases'].append(case)
        ctx.close()
        save()
        print(json.dumps(case, ensure_ascii=False), flush=True)

    def smoke(page, case):
        page.goto(args.base + '#library', wait_until='networkidle')
        ready(page)
        assert count(page) == 40, 'The default library should contain 40 main investigations'
        assert page.locator('#cards .experiment-card').count() == 24
        assert page.locator('#cards [data-selection="main"]').count() == 24
        assert page.locator('.collection-switch [data-collection=main]').get_attribute('aria-pressed') == 'true'
        assert '300 thí nghiệm' not in page.locator('.home-purpose').inner_text()
        assert page.locator('.topic-chips [data-topic="Chất lưu"]').is_hidden(), 'Empty fluid category should be hidden in main'
        for node in page.locator('.collection-switch button').all():
            box = node.bounding_box()
            assert box and box['height'] >= 44 and box['width'] >= 44, ('Collection touch target', box)
        page.locator('#libraryTitle').scroll_into_view_if_needed()
        page.locator('#cards img').first.scroll_into_view_if_needed()
        page.wait_for_function('()=>document.querySelector("#cards img").complete&&document.querySelector("#cards img").naturalWidth>0')
        assert 'previews/v74/' in page.locator('#cards img').first.get_attribute('src')
        no_overflow(page)
        if case['width'] in [390, 1440]:
            page.locator('#libraryTitle').evaluate("e=>e.scrollIntoView({block:'start'})")
            page.screenshot(path=str(out / f'main-{case["width"]}-{case["theme"]}.png'))
        collection(page, 'archive')
        assert count(page) == 260
        assert page.locator('.topic-chips [data-topic="Chất lưu"]').is_visible(), 'Supplementary fluid investigations need their category'
        assert page.locator('#cards [data-selection="main"]').count() == 0
        assert query(page).get('collection') == ['archive']
        no_overflow(page)
        if case['width'] in [390, 1440]:
            page.locator('#libraryTitle').evaluate("e=>e.scrollIntoView({block:'start'})")
            page.screenshot(path=str(out / f'archive-{case["width"]}-{case["theme"]}.png'))
        locale(page, 'en-US')
        assert 'Supplementary collection' in page.locator('.collection-switch [data-collection=archive]').inner_text()
        assert 'Specialized' in page.locator('#collectionDescription').inner_text()
        locale(page, 'vi-VN')
        assert 'Kho bổ trợ' in page.locator('.collection-switch [data-collection=archive]').inner_text()
        assert count(page) == 260
        collection(page, 'main')
        assert count(page) == 40
        assert 'collection' not in query(page)
        case['main'] = 40
        case['archive'] = 260
        case['localeRoundTrip'] = True
        case['firstImageLoaded'] = True

    if not args.deep_only:
        for width in args.widths:
            for theme in ['light', 'dark']:
                run({'name': 'collection', 'width': width, 'theme': theme}, smoke)

    def full_catalog(page, case):
        page.goto(args.base + '#library', wait_until='networkidle')
        ready(page)
        sets = {}
        for scope, expected in [('main', 40), ('archive', 260)]:
            collection(page, scope)
            found = set()
            pages = (expected + 23) // 24
            for n in range(1, pages + 1):

                if n > 1:
                    page.locator('#pagination > button').last.click()
                found.update(page.locator('#cards [data-thumb]').evaluate_all('es=>es.map(e=>e.dataset.thumb)'))
            assert len(found) == expected, (scope, len(found))
            sets[scope] = found
        assert not sets['main'].intersection(sets['archive'])
        assert len(sets['main'] | sets['archive']) == 300
        collection(page, 'main')
        page.locator('#search').fill('de broglie')
        assert page.locator('#cards .experiment-card').count() == 0, 'Search in main should not silently widen to archive'
        assert page.locator('#cards .empty').is_visible()
        page.locator('#cards [data-collection=archive]').click()
        assert 'debroglie' in page.locator('#cards [data-thumb]').evaluate_all('es=>es.map(e=>e.dataset.thumb)')
        assert query(page).get('q') == ['de broglie']
        assert query(page).get('collection') == ['archive']
        page.go_back(wait_until='networkidle')
        assert page.locator('.collection-switch [data-collection=main]').get_attribute('aria-pressed') == 'true'
        assert page.locator('#search').input_value() == 'de broglie'
        assert page.locator('#cards .experiment-card').count() == 0
        page.go_forward(wait_until='networkidle')
        assert page.locator('.collection-switch [data-collection=archive]').get_attribute('aria-pressed') == 'true'
        assert page.locator('#search').input_value() == 'de broglie'
        page.locator('#cards a.card-open[href="#lab/debroglie"]').click()
        page.locator('.selection-notice').wait_for()
        assert 'bước sóng de Broglie' in page.locator('.selection-notice').inner_text()
        locale(page, 'en-US')
        assert 'wavelength' in page.locator('.selection-notice').inner_text()
        locale(page, 'vi-VN')
        assert 'bước sóng' in page.locator('.selection-notice').inner_text()
        case.update(totalUnique=300, disjoint=True, searchArchive=True, historyScopeQuery=True, honestNoticeRoundTrip=True)

    def saved_session(page, case):
        navigate_lab(page, 'spring_period')
        assert page.locator('.selection-notice').is_visible()
        assert page.locator('.selection-notice a[href="#lab/oscillation"]').count() == 1
        page.locator('[data-action=record]').first.click()
        open_data(page)
        page.locator('.work-tabs [data-panel=tasks]').click()
        note = 'Curation v77 giữ ghi chép <script>literal</script>'
        page.locator('#notes').fill(note)
        page.locator('#notes').press('Tab')
        before = snapshot_session(page, 'spring_period')
        assert len(before['rows']) == 1 and before['notes'] == note
        page.locator('.lab-header-actions [data-favorite=spring_period]').click()
        page.locator('.lab-breadcrumb a.back').click()
        ready(page)
        assert count(page) == 40
        page.locator('.filters [data-action=favorites-home]').click()
        assert page.locator('#cards [data-thumb=spring_period]').count() == 1, 'Archived favorite disappeared'
        assert 'cả hai' in page.locator('#collectionDescription').inner_text()
        assert count(page) == 1, 'Personal collection count should match the saved investigations'
        page.locator('.filters [data-action=recent-home]').click()
        assert page.locator('#cards [data-thumb=spring_period]').count() == 1, 'Archived recent disappeared'
        page.locator('#cards a.card-open[href="#lab/spring_period"]').click()
        page.locator('.inquiry-workbook').wait_for(state='attached')
        assert snapshot_session(page, 'spring_period') == before
        locale(page, 'en-US')
        assert snapshot_session(page, 'spring_period') == before
        assert 'Supplementary' in page.locator('.selection-notice').inner_text()
        assert 'Related introductory investigation:' in page.locator('.selection-notice').inner_text(), 'Related link prefix remains Vietnamese'
        assert page.locator('#labSelect optgroup').evaluate_all('es=>es.map(e=>e.label)') == ['Main library', 'Supplementary collection'], 'Native collection labels remain Vietnamese'
        locale(page, 'vi-VN')
        assert snapshot_session(page, 'spring_period') == before
        assert page.locator('#labSelect optgroup').evaluate_all('es=>es.map(e=>e.label)') == ['Thư viện chính', 'Kho bổ trợ'], 'Native collection labels did not return to Vietnamese'
        assert 'Bài nhập môn liên quan:' in page.locator('.selection-notice').inner_text()
        page.reload(wait_until='networkidle')
        page.locator('.inquiry-workbook').wait_for(state='attached')
        assert snapshot_session(page, 'spring_period') == before
        no_overflow(page)
        page.locator('.lab-heading').scroll_into_view_if_needed()
        page.screenshot(path=str(out / f'lab-{case["width"]}-{case["theme"]}.png'))
        case.update(archivedFavorite=True, archivedRecent=True, rowsNotesStatePreserved=True, oldRouteReload=True)

    def model_disclosure(page, case):
        navigate_lab(page, 'spring_period')
        generic = page.locator('#conceptObservation .observation-details')
        generic.wait_for(state='attached')
        assert generic.get_attribute('open') is None, 'The supplementary theoretical curve starts expanded'
        generic.locator(':scope > summary').click()
        assert generic.get_attribute('open') is not None
        locale(page, 'en-US')
        assert generic.get_attribute('open') is not None, 'Language switch closed the selected disclosure'
        locale(page, 'vi-VN')
        assert generic.get_attribute('open') is not None
        open_parameters(page)
        show_details(page, '.display-settings')
        handle = page.locator('[data-switch=handles]')
        assert not handle.is_checked(), 'Unlabelled parameter rails should be off in a fresh session'
        before = snapshot_session(page, 'spring_period')
        handle.check()
        assert session(page, 'spring_period')['config']['switches']['handles'] is True
        assert snapshot_session(page, 'spring_period') == before
        page.reload(wait_until='networkidle')
        page.locator('.inquiry-workbook').wait_for(state='attached')
        assert session(page, 'spring_period')['config']['switches']['handles'] is True, 'Explicit saved display preference was discarded'
        navigate_lab(page, 'ray_slab')
        optics = page.locator('#conceptObservation .observation-details')
        optics.wait_for(state='attached')
        assert optics.get_attribute('open') is not None, 'Mandatory ray legend should remain expanded'
        assert page.locator('#conceptObservation .optics-legend li').count() > 0
        case.update(theoryClosedByDefault=True, chosenDisclosurePreserved=True, opticsLegendVisible=True,
                    handlesOffByDefault=True, handlesExplicitPreferenceRestored=True)

    if not args.smoke_only:
        run({'name': 'all-and-search', 'width': 1440, 'theme': 'light'}, full_catalog)
        for width, theme in [(390, 'dark'), (1440, 'light')]:
            run({'name': 'saved-session', 'width': width, 'theme': theme}, saved_session)
        run({'name': 'model-disclosure', 'width': 1440, 'theme': 'dark'}, model_disclosure)
    browser.close()
report['sourceEnd'] = hashes()
report['sourceStable'] = report['sourceStart'] == report['sourceEnd']
report['passed'] = report['sourceStable'] and all(c['status'] == 'PASS' for c in report['cases']) and not report['errors'] and not report['httpErrors']
save()
print(json.dumps({'passed': report['passed'], 'sourceStable': report['sourceStable'], 'cases': len(report['cases']), 'errors': report['errors'], 'httpErrors': report['httpErrors']}, ensure_ascii=False))
raise SystemExit(0 if report['passed'] else 1)
