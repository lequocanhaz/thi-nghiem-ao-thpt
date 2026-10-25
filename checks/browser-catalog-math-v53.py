"""Optional: serve dist at localhost:4173; requires Python Playwright and Chromium.
Artifacts go to /tmp/quanh-ui-review; no external requests are allowed.
"""
from playwright.sync_api import sync_playwright
import json
from pathlib import Path
Path('/tmp/quanh-ui-review').mkdir(parents=True,exist_ok=True)
report=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [320,390,1440]:
  ctx=b.new_context(viewport={'width':width,'height':900});page=ctx.new_page()
  page.route('**/*',lambda r:r.continue_() if r.request.url.startswith('http://127.0.0.1:4173/') or r.request.url.startswith('data:') else r.abort())
  page.goto('http://127.0.0.1:4173/',wait_until='networkidle');seen=set();bad=[]
  for n in range(1,14):
   page.evaluate('n=>{const s=document.querySelector("#catalogPageSelect");s.value=String(n);s.dispatchEvent(new Event("change",{bubbles:true}));}',n)
   page.wait_for_function('Array.from(document.querySelectorAll("#cards .math-tex")).every(e=>e.dataset.mathRendered==="true")')
   measurements=page.locator('#cards .experiment-card').evaluate_all('es=>es.map(e=>{const f=e.querySelector(".math-formula"),k=f.querySelector(".katex"),r=e.querySelector(".card-image").getBoundingClientRect(),q=k.getBoundingClientRect();return {id:e.querySelector("[data-thumb]").dataset.thumb,vertical:f.scrollHeight>f.clientHeight+2||q.top<r.top||q.bottom>r.bottom,font:parseFloat(getComputedStyle(k).fontSize),width:document.documentElement.scrollWidth,viewport:innerWidth}})')
   for m in measurements:
    seen.add(m['id'])
    if m['vertical'] or m['font']>25 or m['width']>width:bad.append(m)
  assert len(seen)==300,(width,len(seen))
  report.append({'width':width,'cards':len(seen),'failures':bad})
  page.locator('#cards .card-image').first.scroll_into_view_if_needed();page.screenshot(path=f'/tmp/quanh-ui-review/card-layout-{width}.png')
  ctx.close()
 b.close()
open('/tmp/quanh-ui-review/card-layout.json','w').write(json.dumps(report,indent=2))
assert not any(x['failures'] for x in report), report
print('PASS Chromium catalog math: 300 cards at each of 320, 390 and 1440px; no vertical clipping or page overflow. Local browser, not device hardware.')
