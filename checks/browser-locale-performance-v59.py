"""Compare actual DOM traversal for old/current locale engines in Chromium.

Requires the dist server at localhost:4173. Does not call external services,
modify an existing browser profile, or claim a hardware FPS benchmark.
"""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path('work/locale-performance-v59')
OUT.mkdir(parents=True, exist_ok=True)
old = subprocess.check_output(['git', 'show', '7e491e0c641dca33ed222b47942b085e728ab590:dist/language-ui.js'], text=True)
report = {'scope': 'Chromium headless, native MutationObserver; only locale-engine source differs; no hardware FPS claim', 'runs': {}}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox', '--enable-unsafe-swiftshader'])
    for variant in ['before', 'after']:
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        context.route('https://**/*', lambda route: route.abort())
        if variant == 'before':
            context.route('**/language-ui.js*', lambda route: route.fulfill(status=200, content_type='text/javascript', body=old))
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:4173/#lab/ohm')
        page.wait_for_load_state('networkidle')
        page.wait_for_selector('#visual canvas')
        page.locator('[data-locale="en-US"]').click()
        page.wait_for_function("document.documentElement.lang==='en-US'")
        page.wait_for_timeout(200)
        result = page.evaluate('''async()=>{
            const host=document.createElement('p');host.id='localePerfProbe';host.textContent='Sẵn sàng';document.querySelector('#main').append(host);
            const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
            await frame();
            const original=document.createTreeWalker.bind(document),walks=[],input=document.querySelector('[data-number]'),canvas=document.querySelector('#visual canvas');
            let visits=0;
            document.createTreeWalker=(root,...args)=>{
                walks.push(root.id||root.className||root.nodeName);
                const walker=original(root,...args),next=walker.nextNode.bind(walker);
                walker.nextNode=()=>{const node=next();if(node)visits++;return node;};return walker;
            };
            let translated=0;
            for(let i=0;i<30;i++){
                host.textContent=i%2?'Sẵn sàng':'Đang chạy';await frame();
                if(host.textContent===(i%2?'Ready':'Running'))translated++;
            }
            return {updates:30,translated,treeWalks:walks.length,nodeVisits:visits,rootWalks:walks.filter(root=>['main','dialog','toast','aiAssistant','header'].includes(root)).length,inputPreserved:input===document.querySelector('[data-number]'),canvasPreserved:canvas===document.querySelector('#visual canvas')};
        }''')
        result['pageErrors'] = errors
        report['runs'][variant] = result
        context.close()
    browser.close()
(OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
before, after = report['runs']['before'], report['runs']['after']
assert before['translated'] == after['translated'] == 30
assert before['treeWalks'] >= 100 and before['nodeVisits'] > 1000, before
assert after['treeWalks'] == 0 and after['nodeVisits'] == 0, after
assert after['inputPreserved'] and after['canvasPreserved'] and not after['pageErrors']
print(json.dumps(report, ensure_ascii=False, indent=2))
