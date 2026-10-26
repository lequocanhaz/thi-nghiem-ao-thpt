"""Cold-home image and typography regression for Quanh Lab v65.

Serve dist over HTTP before running. Requires Python Playwright and Chromium.
Example: python checks/browser-catalog-v65.py --base http://127.0.0.1:4173/
All contexts are isolated. This is Chromium viewport emulation, not physical
Safari/iPhone/Android or a scientific-model acceptance test.
"""
import argparse
from hashlib import sha256
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
parser.add_argument('--out', default='work/optics-v65/catalog')
parser.add_argument('--chromium', default=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'))
parser.add_argument('--widths', default='320,375,390,414,430,768,1024,1440,1920')
parser.add_argument('--only', default='', help='Optional regex matching scenario names')
args = parser.parse_args()
BASE = args.base.rstrip('/') + '/'
OUT = Path(args.out)
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {'scope': 'Headless Chromium, isolated cold profiles; local images decoded in the browser. Simulated viewports, no hardware Safari claim.', 'tests': [], 'pageErrors': [], 'httpErrors': [], 'unexpectedExternalRequests': [], 'limits': ['Image decoding and layout do not independently certify the physics depicted in each preview.', 'No real Safari/iPhone/Android, virtual keyboard, hardware FPS or long-term memory test.', 'Intentional missing-image fixture is isolated from the no-HTTP-error checks.']}


def verify(condition, message):
    if not condition:
        raise AssertionError(message)


def run(name, function):
    if args.only and not re.search(args.only, name):
        return
    start = time.monotonic()
    try:
        REPORT['tests'].append({'name': name, 'status': 'PASS', 'evidence': function(), 'durationMs': round((time.monotonic()-start)*1000)})
        print('PASS', name, flush=True)
    except Exception as error:
        REPORT['tests'].append({'name': name, 'status': 'FAIL', 'error': str(error), 'traceback': traceback.format_exc()})
        print('FAIL', name, str(error), flush=True)
    (OUT/'report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))


def context(browser, width=1440, intentional_error=False):
    ctx = browser.new_context(viewport={'width': width, 'height': 900 if width>=768 else 844}, has_touch=width<768, is_mobile=width<768, service_workers='block')
    def guard(route):
        if urlsplit(route.request.url).netloc == urlsplit(BASE).netloc:
            route.continue_()
        else:
            REPORT['unexpectedExternalRequests'].append(route.request.url)
            route.abort('blockedbyclient')
    ctx.route('**/*', guard)
    ctx.on('page', lambda page: page.on('pageerror', lambda error: REPORT['pageErrors'].append(str(error))))
    if not intentional_error:
        ctx.on('response', lambda response: REPORT['httpErrors'].append({'url':response.url,'status':response.status}) if response.status>=400 and urlsplit(response.url).netloc==urlsplit(BASE).netloc else None)
    return ctx


def home(page):
    page.goto(BASE)
    page.wait_for_load_state('networkidle')
    page.wait_for_selector('#cards [data-thumb] img', state='attached', timeout=20000)
    page.evaluate('document.fonts.ready')


def no_renderer(page):
    resources = page.evaluate("performance.getEntriesByType('resource').map(e=>e.name)")
    bad = [url for url in resources if re.search(r'/(scene3d|software-scene|three\.module\.min|OrbitControls)\.js(?:\?|$)',url)]
    verify(not bad, 'Cold library imported 3D renderer: '+json.dumps(bad))
    return {'resourceCount':len(resources),'rendererImports':bad}


def banner(page):
    data = page.locator('#bannerTitle .banner-title-row').evaluate_all('''els=>els.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const ink=range.getBoundingClientRect();return {text:e.textContent,font:s.fontFamily,size:parseFloat(s.fontSize),weight:s.fontWeight,spacing:s.letterSpacing,lineHeight:parseFloat(s.lineHeight),style:s.fontStyle,bounds:r.toJSON(),ink:ink.toJSON()}})''')
    verify(len(data)==2,'Banner must have exactly two rows')
    first,second=data
    for key in ['font','weight','spacing','style']:
        verify(first[key]==second[key],f'Banner rows differ in {key}: '+json.dumps(data,ensure_ascii=False))
    verify(abs(first['size']-second['size'])<0.1,'Banner rows differ in font size')
    verify(second['bounds']['top']>=first['bounds']['bottom']-1,'Banner rows overlap')
    width=page.viewport_size['width']
    for line in data:
        verify(line['ink']['left']>=-1 and line['ink']['right']<=width+1,'Banner text escapes viewport: '+json.dumps(line,ensure_ascii=False))
        verify(line['lineHeight']/line['size']>=1.25,'Banner line height is too tight')
    actions=page.locator('.banner-actions a').evaluate_all('''els=>els.map(e=>{const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);return {text:e.textContent,box:r.toJSON(),ink:range.getBoundingClientRect().toJSON()}})''')
    for action in actions:
        verify(action['box']['left']>=-1 and action['box']['right']<=width+1,'Banner action escapes viewport: '+json.dumps(action,ensure_ascii=False))
        verify(action['ink']['left']>=action['box']['left']-1 and action['ink']['right']<=action['box']['right']+1,'Banner action text is clipped: '+json.dumps(action,ensure_ascii=False))
    return {'titleRows':data,'actions':actions}


def layout(page):
    result=page.evaluate('''()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cards:[...document.querySelectorAll('#cards .experiment-card')].map(e=>{const r=e.getBoundingClientRect(),image=e.querySelector('[data-thumb]'),body=e.querySelector('.card-body'),actions=e.querySelector('.card-actions');return {id:image.dataset.thumb,card:r.toJSON(),image:image.getBoundingClientRect().toJSON(),body:body.getBoundingClientRect().toJSON(),actions:actions.getBoundingClientRect().toJSON(),padding:getComputedStyle(body).padding,buttonHeights:[...actions.querySelectorAll('a,button')].map(x=>x.getBoundingClientRect().height)}})})''')
    verify(result['scroll']<=result['width']+2,'Document has horizontal overflow')
    paddings=set()
    for item in result['cards']:
        verify(item['image']['width']>0 and item['image']['height']>0,'Preview collapsed: '+item['id'])
        verify(item['image']['bottom']<=item['body']['top']+2,'Preview overlaps card content: '+item['id'])
        verify(item['body']['bottom']<=item['actions']['top']+2,'Card body overlaps actions: '+item['id'])
        verify(item['actions']['bottom']<=item['card']['bottom']+2,'Actions escape card: '+item['id'])
        verify(all(h>=43 for h in item['buttonHeights']),'Card action touch target is too short: '+item['id'])
        paddings.add(item['padding'])
    verify(len(paddings)==1,'Card content padding is inconsistent within viewport')
    rows={}
    for item in result['cards']:
        rows.setdefault(round(item['card']['top']),[]).append(item)
    for row in rows.values():
        verify(max(x['actions']['bottom'] for x in row)-min(x['actions']['bottom'] for x in row)<=2,'Card actions are not aligned within their grid row')
    return result


def decode_cards(page):
    # Scroll each actual lazy image into view, then decode it. No data URL,
    # injected placeholder or forced eager-loading replacement is accepted.
    values=page.evaluate('''async()=>{const results=[];for(const slot of document.querySelectorAll('#cards [data-thumb]')){const img=slot.querySelector('img');if(!img){results.push({id:slot.dataset.thumb,error:'no-image'});continue;}img.scrollIntoView({block:'nearest',behavior:'instant'});await new Promise(requestAnimationFrame);try{await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('image-timeout')),10000))]);results.push({id:slot.dataset.thumb,src:img.currentSrc||img.src,width:img.naturalWidth,height:img.naturalHeight,complete:img.complete});}catch(e){results.push({id:slot.dataset.thumb,src:img.src,error:String(e)});}}return results;}''')
    for value in values:
        verify(not value.get('error'),'Image decode failed: '+json.dumps(value))
        verify(value['width']>=100 and value['height']>=100,'Preview is empty or a placeholder: '+json.dumps(value))
        verify('/previews/v65/'+value['id']+'.webp' in value['src'],'Wrong or nonstatic preview URL: '+json.dumps(value))
        verify(value['src'].startswith(BASE),'Preview image must be a local static asset')
    return values


with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    def manifest_integrity():
        ctx=context(browser)
        try:
            response=ctx.request.get(BASE+'previews/v65/manifest.json')
            verify(response.ok,'Preview manifest did not load')
            manifest=response.json()
            verify(manifest.get('schema')=='quanh-lab.simulation-previews.v1','Unknown preview manifest schema')
            verify(manifest.get('complete') is True and manifest.get('sourceStable') is True and manifest.get('errors')==[],'Generator did not finish against stable source')
            entries=manifest['experiments']
            verify(len(entries)==300 and len({x['id'] for x in entries})==300,'Manifest does not contain 300 unique experiments')
            hashes=set()
            total=0
            for item in entries:
                image=ctx.request.get(BASE+'previews/v65/'+item['file'])
                verify(image.ok,'Preview HTTP failure: '+item['id'])
                payload=image.body()
                verify(len(payload)==item['bytes'] and sha256(payload).hexdigest()==item['sha256'],'Preview differs from captured manifest: '+item['id'])
                hashes.add(item['sha256'])
                total+=len(payload)
            return {'experiments':300,'byteVerifiedImages':300,'uniqueImageHashes':len(hashes),'totalBytes':total,'sourceCommit':manifest['sourceCommit'],'dimensions':manifest['dimensions']}
        finally:
            ctx.close()
    run('preview manifest: 300 unique IDs, completed export and exact HTTP asset hashes',manifest_integrity)

    for width in [int(x) for x in args.widths.split(',')]:
        def viewport(width=width):
            ctx=context(browser,width)
            page=ctx.new_page()
            try:
                home(page)
                first=page.locator('#cards [data-thumb] img').first
                first.scroll_into_view_if_needed()
                page.wait_for_function("document.querySelector('#cards [data-thumb] img').naturalWidth>0")
                verify(page.locator('#cards .catalog-formula:visible').count()==0,'Successful image cards still show formula fallbacks')
                fonts=[]
                for language in ['vi-VN','en-US']:
                    page.locator('[data-locale="'+language+'"]').click()
                    page.wait_for_timeout(250)
                    verify(page.locator('[data-locale="'+language+'"]').get_attribute('aria-pressed')=='true','Language pill did not select '+language)
                    page.evaluate('scrollTo(0,0)')
                    fonts.append({'locale':language,'rows':banner(page)})
                page.locator('[data-locale="vi-VN"]').click()
                page.wait_for_timeout(200)
                initial_layout=layout(page)
                page.evaluate('scrollTo(0,0)')
                if width in [320,390,1440]:
                    decode_cards(page)
                    page.evaluate('scrollTo(0,0)')
                    page.screenshot(path=str(OUT/f'hero-{width}.png'))
                    page.locator('#library').evaluate('e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-16)')
                    page.screenshot(path=str(OUT/f'library-{width}.png'))
                    page.locator('#cards').evaluate('e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-16)')
                    page.screenshot(path=str(OUT/f'cards-{width}.png'))
                    page.evaluate('scrollTo(0,0)')
                    page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
                seen={}
                pages=int(page.locator('#catalogPageSelect option').last.get_attribute('value'))
                verify(pages==13,'Expected 13 catalog pages for 300 experiments')
                for number in range(1,pages+1):
                    if number>1:
                        jump=page.locator('#catalogPageSelect')
                        if jump.is_visible():
                            jump.select_option(str(number))
                        else:
                            page.locator('#pagination > button').last.click()
                    for image in decode_cards(page):
                        verify(image['id'] not in seen,'Duplicate experiment across pages: '+image['id'])
                        seen[image['id']]=image
                verify(len(seen)==300,'Catalog pagination lost experiments: '+str(len(seen)))
                verify(len({item['src'] for item in seen.values()})==300,'Preview URLs are shared between experiments')
                render_resources=no_renderer(page)
                return {'width':width,'decodedImages':len(seen),'catalogPages':pages,'banner':fonts,'layout':initial_layout,'assets':list(seen.values()),**render_resources}
            finally:
                ctx.close()
        run(f'cold home {width}px: 300 static previews, bilingual banner, card layout, no WebGL import',viewport)

    def interactions():
        ctx=context(browser,390)
        page=ctx.new_page()
        try:
            home(page)
            page.locator('#search').fill('Ohm')
            page.wait_for_timeout(200)
            img=page.locator('[data-thumb="ohm"] img')
            img.scroll_into_view_if_needed()
            page.wait_for_function("document.querySelector('[data-thumb=ohm] img').naturalWidth>0")
            image_url=img.get_attribute('src')
            initial_alt=img.get_attribute('alt')
            page.locator('[data-preview="ohm"]').click()
            verify(page.locator('#dialog').evaluate('e=>e.open'),'Quick preview did not open')
            verify(page.locator('#dialog img').count()==1,'Quick preview lost its experiment image')
            verify(page.locator('#dialog img').get_attribute('src')==image_url,'Quick preview uses a different image')
            page.locator('#dialog [data-action="close-dialog"]').click()
            page.locator('[data-favorite="ohm"]').click()
            page.locator('[data-locale="en-US"]').click()
            verify(page.locator('[data-favorite="ohm"]').get_attribute('aria-pressed')=='true','Language switch lost favorite state')
            verify(page.locator('[data-thumb="ohm"] img').get_attribute('src')==image_url,'Language switch changed preview URL')
            english_alt=page.locator('[data-thumb="ohm"] img').get_attribute('alt')
            verify(english_alt and english_alt!=initial_alt and 'Ohm' in english_alt,'Preview alternative text did not switch to English')
            no_renderer(page)
            image_link=page.locator('[data-thumb="ohm"] .preview-link')
            image_link.focus()
            verify(image_link.evaluate('e=>e===document.activeElement'),'Preview link cannot receive keyboard focus')
            image_link.press('Enter')
            page.wait_for_selector('#visual canvas',timeout=30000)
            verify('#lab/ohm' in page.url,'Preview image keyboard action did not open the experiment')
            page.go_back()
            page.wait_for_selector('#search')
            page.locator('#cards .card-open').first.click()
            page.wait_for_selector('#visual canvas',timeout=30000)
            verify('#lab/ohm' in page.url,'Card action did not open the experiment')
            return {'search':True,'quickPreview':True,'favoriteAndLocale':True,'imageKeyboardOpensLab':True,'cardOpensLab':True}
        finally:
            ctx.close()
    run('static preview interactions: search, quick preview, favorite, locale and real lab route',interactions)

    def missing_image():
        ctx=context(browser,390,intentional_error=True)
        ctx.route('**/previews/v65/energy.webp',lambda route:route.fulfill(status=404,body='intentional QA fixture'))
        page=ctx.new_page()
        try:
            home(page)
            slot=page.locator('[data-thumb="energy"]')
            slot.scroll_into_view_if_needed()
            page.wait_for_selector('[data-thumb="energy"] .preview-fallback',state='visible',timeout=15000)
            verify(not slot.locator('.preview-link').is_visible(),'Broken preview link remains visible')
            verify(slot.bounding_box()['height']>100,'Failed image collapsed its card')
            retry=slot.locator('[data-preview-retry="energy"]')
            retry.focus()
            retry.press('Enter')
            page.wait_for_function("document.querySelector('[data-thumb=energy]').dataset.previewStatus==='ready' && document.querySelector('[data-thumb=energy] img').naturalWidth>0")
            verify(not slot.locator('.preview-fallback').is_visible(),'Successful retry did not dismiss image fallback')
            verify(slot.locator('.preview-link').is_visible(),'Successful retry did not restore preview link')
            verify(slot.locator('.preview-link').evaluate('e=>e===document.activeElement'),'Image retry lost keyboard focus instead of returning to the restored link')
            page.locator('[data-preview="energy"]').click()
            verify(page.locator('#dialog').evaluate('e=>e.open'),'Image failure blocked quick preview')
            no_renderer(page)
            return {'fixture':'energy.webp returns404','errorFallbackVisible':True,'retryRestoresImage':True,'cardSizePreserved':True,'previewWorks':True}
        finally:
            ctx.close()
    run('missing static image: explicit error, retry restores image and working preview',missing_image)
    browser.close()

run('no uncaught JavaScript errors or unexpected local HTTP failures',lambda:(verify(not REPORT['pageErrors'] and not REPORT['httpErrors'] and not REPORT['unexpectedExternalRequests'],json.dumps({'pageErrors':REPORT['pageErrors'],'httpErrors':REPORT['httpErrors'],'externalRequests':REPORT['unexpectedExternalRequests']})) or {'pageErrors':[],'httpErrors':[]}))
failures=[x for x in REPORT['tests'] if x['status']!='PASS']
print(json.dumps({'passed':len(REPORT['tests'])-len(failures),'failed':len(failures),'report':str(OUT/'report.json')}))
raise SystemExit(1 if failures else 0)
