"""Optional Chromium checks: serve dist at localhost:4173 first.
Python Playwright and /usr/bin/chromium required. Outputs only /tmp/quanh-physics-v54.
These are selected UI/DOM cases; rendered-mesh constraints have separate CPU tests.
"""
import json
import os
import re
import time
import traceback
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:4173/'
OUT=Path('/tmp/quanh-physics-v54'); OUT.mkdir(parents=True,exist_ok=True)
FILTER=os.environ.get('QUANH_QA_TEST_PATTERN','')
REPORT={'testPattern':FILTER or 'all','scope':'Chromium headless SwiftShader; desktop 1440 and touch-emulated 390px, selected UI cases only','tests':[],'pageErrors':[],'externalRequests':[],'renderers':[]}

def verify(ok,message):
    if not ok: raise AssertionError(message)

def run(name,fn):
    if FILTER and not re.search(FILTER,name):return
    start=time.monotonic()
    try:
        evidence=fn();REPORT['tests'].append({'name':name,'status':'PASS','evidence':evidence,'durationMs':round((time.monotonic()-start)*1000)})
        print('PASS',name,flush=True)
    except Exception as e:
        REPORT['tests'].append({'name':name,'status':'FAIL','error':str(e),'traceback':traceback.format_exc()});print('FAIL',name,str(e),flush=True)
    (OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2))

def network(route):
    if urlsplit(route.request.url).netloc=='127.0.0.1:4173':route.continue_()
    else:
        REPORT['externalRequests'].append(route.request.url);route.abort('blockedbyclient')

def open_lab(page,id):
    page.goto(BASE+'#lab/'+id,wait_until='networkidle')
    page.locator('#visual canvas').wait_for(timeout=25000)
    page.locator('[data-lesson="'+id+'"]').first.wait_for(state='attached',timeout=15000)
    renderer=page.locator('#visual canvas').evaluate("e=>{const g=e.getContext('webgl2');return {webgl2:!!g,contextLost:g?.isContextLost()??null,ariaLabel:e.getAttribute('aria-label')}}")
    verify(renderer['webgl2'] and not renderer['contextLost'],'Expected live WebGL2 context, not Canvas fallback')
    REPORT['renderers'].append({'id':id,'viewport':page.viewport_size,**renderer})

def edit(page,key,value):
    node=page.locator('.controls [data-number="'+key+'"]')
    node.evaluate('(e)=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==="DETAILS")p.open=true}')
    node.fill(str(value));node.press('Tab')
    verify(abs(float(node.input_value())-value)<=max(1e-9,abs(value)*1e-9),'Numeric input was unexpectedly clamped: '+key)

def saved(page,id):
    return page.evaluate('id=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)

def snapshot(page,name):
    page.locator('.stage-shell').scroll_into_view_if_needed()
    page.screenshot(path=str(OUT/(name+'.png')),full_page=True)

def record(page,id):
    page.locator('[data-action=record]').first.click()
    return saved(page,id)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for width in [1440,390]:
        ctx=browser.new_context(viewport={'width':width,'height':900 if width>600 else 844},has_touch=width<600,is_mobile=width<600)
        ctx.route('**/*',network)
        page=ctx.new_page();page.on('pageerror',lambda e:REPORT['pageErrors'].append(str(e)))
        def lever():
            open_lab(page,'lever');cases=[]
            for l1,l2,m1,m2 in [(.02,10,.02,15),(10,.02,15,.02),(.02,.02,15,15),(10,10,15,15),(1.2,.6,1,2)]:
                for key,value in [('l1',l1),('l2',l2),('m1',m1),('m2',m2)]:edit(page,key,value)
                row=record(page,'lever')['rows'][-1];d=row['d']
                verify(abs(d['net']-9.81*(m1*l1-m2*l2))<1e-8,'Moment readout does not match independent mg*l')
                verify(not any(t in page.locator('#readouts').inner_text() for t in ['NaN','Infinity','undefined']),'Nonfinite lever UI')
                cases.append({'l1':l1,'l2':l2,'m1':m1,'m2':m2,'net':d['net']})
                if len(cases)<=2:snapshot(page,f'lever-case{len(cases)}-{width}')
            snapshot(page,f'lever-{width}');return {'cases':cases,'scope':'Numeric controls/readouts and screenshots; attachment constraints checked separately on actual meshes'}
        run(f'{width}px lever expanded-domain controls and moment readouts',lever)
        def particles():
            evidence=[]
            for id in ['gas','boyle']:
                open_lab(page,id)
                for volume in [.2,50]:
                    edit(page,'v',volume);row=record(page,id)['rows'][-1];d=row['d']
                    expected=(.24*8.314462618*300/volume) if id=='gas' else 600/volume
                    pressure=d.get('pressure',d.get('p'))
                    verify(pressure is not None and abs(pressure-expected)<max(1e-8,abs(expected)*1e-8),f'Pressure differs from independent SI gas constant reference: {id} V={volume}, actual={pressure}, expected={expected}')
                    for projection in ['2d','3d']:
                        page.locator('[data-projection="'+projection+'"]').click()
                        verify(page.locator('#visual canvas').is_visible(),'Canvas missing in '+projection)
                    snapshot(page,f'{id}-v{volume}-{width}')
                    evidence.append({'id':id,'volume':volume,'pressure':pressure})
            return {'states':evidence,'scope':'UI/render availability, numerical pressure and screenshots; collision containment is a separate rendered-mesh test'}
        run(f'{width}px gas/Boyle min-max volume in 2D and 3D',particles)
        def potential():
            open_lab(page,'potential_pair');evidence=[]
            edit(page,'charge',4);edit(page,'half',1.5)
            for x in [.1,1,3]:
                edit(page,'distance',x);row=record(page,'potential_pair')['rows'][-1];actual=row['d']['potential']
                expected=8.9875517923e9*4e-9*(1/abs(x-1.5)-1/abs(x+1.5))
                verify(abs(actual-expected)<max(1e-8,abs(expected)*1e-8),'Signed distance reappeared in potential UI')
                evidence.append({'x':x,'actual':actual,'expected':expected})
            snapshot(page,f'potential-{width}')
            # Negative x is outside the current UI slider, so exercise the browser-loaded model explicitly.
            left=page.evaluate('''async()=>{const url=performance.getEntriesByType('resource').find(r=>/\\/models\\.js\\?/.test(r.name)).name;const {evaluate}=await import(url);return evaluate('potential_pair',{charge:4,half:1.5,distance:-3,t:0}).potential}''')
            expected=8.9875517923e9*4e-9*(1/4.5-1/1.5)
            verify(abs(left-expected)<1e-7,'Left side browser model potential wrong')
            return {'ui':evidence,'negativeXModelOnly':left}
        run(f'{width}px dipole potential between sources and both sides',potential)
        def domain():
            evidence=[]
            for id,invalid,restore in [('cyclotron',{'magnetic':5,'radius':100},{'magnetic':.5,'radius':10}),('elliptic_orbit',{'axis':800,'eccentricity':.7},{'axis':12000,'eccentricity':.3})]:
                open_lab(page,id);before=record(page,id)
                for key,value in invalid.items():edit(page,key,value)
                row_count=len(before['rows']);notice=page.locator('.domain-notice')
                verify(notice.is_visible(),'Outside-domain notice missing')
                verify(page.locator('#visual').evaluate('e=>getComputedStyle(e).visibility')=='hidden','Outside-domain geometry remains visible')
                verify(not page.locator('#modelStatus').is_hidden(),'Model status warning missing')
                verify(page.locator('[data-action=record]').first.is_disabled(),'Outside-domain record action remains enabled')
                verify(page.locator('#play').is_disabled(),'Outside-domain play action remains enabled')
                for button in page.locator('[data-action=step]').all():
                    verify(button.is_disabled(),'Outside-domain step action remains enabled')
                # HTMLElement.click() intentionally ignores disabled controls: exercise the browser semantics
                # without Playwright waiting for a disabled button to become actionable.
                page.locator('[data-action=record]').first.evaluate('(e)=>e.click()')
                page.locator('#play').evaluate('(e)=>e.click()');page.wait_for_timeout(200)
                verify(len(saved(page,id)['rows'])==row_count,'Outside-domain record inserted invalid data')
                after=saved(page,id)
                verify(after['state'].get('t',0)==before['state'].get('t',0),'Outside-domain run advanced model time')
                snapshot(page,f'{id}-invalid-{width}')
                for key,value in restore.items():edit(page,key,value)
                verify(not notice.is_visible(),'Domain notice failed to clear')
                verify(page.locator('#visual').is_visible(),'Valid geometry did not recover')
                after=record(page,id);verify(len(after['rows'])==row_count+1,'Valid measurement cannot be recorded after recovery')
                verify(after['rows'][:row_count]==before['rows'],'Valid prior measurements changed after invalid domain')
                verify(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Page overflow in domain recovery')
                evidence.append({'id':id,'priorRows':row_count,'restoredRows':len(after['rows'])})
            return evidence
        run(f'{width}px invalid model domains block measurements and recover safely',domain)
        def sweep_domain():
            open_lab(page,'cyclotron')
            edit(page,'magnetic',.5);edit(page,'radius',10)
            before=record(page,'cyclotron');prior=before['rows']
            button=page.locator('[data-action=sweep]').first
            button.evaluate('(e)=>{for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==="DETAILS")p.open=true}')
            button.click();page.locator('#sweepKey').select_option('magnetic')
            page.locator('#sweepStart').fill('.1');page.locator('#sweepEnd').fill('5');page.locator('#sweepCount').select_option('10')
            page.locator('[data-action=run-sweep]').click()
            after=saved(page,'cyclotron');added=after['rows'][len(prior):]
            expected=[.1+i*(5-.1)/9 for i in range(10) if 1.602176634e-19*(.1+i*(5-.1)/9)*.1/1.672621924e-27<=.1*299792458]
            verify(len(added)==len(expected),'Sweep did not exclude exactly the outside-domain states')
            verify(after['rows'][:len(prior)]==prior,'Sweep changed valid prior measurements')
            verify(all(row['d'].get('domainValid') is True for row in added),'Sweep inserted a known invalid-domain state')
            for row,magnetic in zip(added,expected):
                verify(abs(row['s']['magnetic']-magnetic)<1e-10,'Sweep preserved wrong independent input state')
                verify(all(row['d'][key] is not None for key in ['frequency','energy','turns']),'Sweep inserted empty output as valid')
            notice=page.locator('#toast').inner_text()
            verify('Bỏ qua 4 thiết lập ngoài miền áp dụng' in notice,'Sweep omitted excluded-state count')
            verify(page.locator('.domain-notice').is_visible(),'Sweep ended outside-domain without visible warning')
            snapshot(page,f'cyclotron-sweep-{width}')
            return {'priorRows':len(prior),'added':len(added),'excluded':10-len(added),'message':notice}
        run(f'{width}px sweep excludes outside-domain cyclotron states',sweep_domain)
        def visual_settings():
            open_lab(page,'projectile')
            # Select a nonzero physical time using the same input event as a scrub gesture.
            page.locator('#time').evaluate('(e)=>{e.value=String(Math.min(1,Number(e.max)/2));e.dispatchEvent(new Event("input",{bubbles:true}))}')
            before=record(page,'projectile')
            page.evaluate("window.__qaCanvas=document.querySelector('#visual canvas');window.__qaInput=document.querySelector('.controls [data-number]')")
            # Capture the actual browser-loaded instance through one public camera operation.
            # Restore the prototype immediately; no production code or numeric model is replaced.
            page.evaluate(r"""async()=>{const url=performance.getEntriesByType('resource').find(r=>/\/scene3d\.js\?/.test(r.name)).name;const {LabScene}=await import(url);const original=LabScene.prototype.zoom;LabScene.prototype.zoom=function(...args){window.__qaViewer=this;try{return original.apply(this,args)}finally{LabScene.prototype.zoom=original}}}""")
            page.locator('[data-action=zoom-in]').click();page.wait_for_timeout(200)
            def camera():
                return page.evaluate("()=>{const v=window.__qaViewer;return {position:v.camera.position.toArray(),quaternion:v.camera.quaternion.toArray(),target:v.controls.target.toArray(),zoom:[v.camera.zoom],projection:v.projection}}")
            baseline=camera();evidence=[]
            page.locator('details.visual-settings > summary').click()
            page.locator('#visualMode').focus()
            for mode in ['high-contrast','classroom','reduced-motion','standard']:
                page.locator('#visualMode').select_option(mode)
                verify(page.locator('#visualMode').evaluate('(e)=>e===document.activeElement'),'Changing preset lost keyboard focus')
                after=saved(page,'projectile')
                verify(after['state']==before['state'],'Visual preset reset physical parameters or time')
                verify(after['rows']==before['rows'],'Visual preset changed recorded measurements')
                verify(page.evaluate("window.__qaCanvas===document.querySelector('#visual canvas')&&window.__qaInput===document.querySelector('.controls [data-number]')"),'Visual preset replaced canvas or physical input')
                actual=camera();verify(actual['projection']==baseline['projection'],'Visual preset changed projection')
                for key in ['position','quaternion','target','zoom']:
                    verify(all(abs(a-b)<1e-8 for a,b in zip(actual[key],baseline[key])),'Visual preset moved manual camera '+key)
                verify(page.locator('.stage-shell').get_attribute('data-visual-mode')==mode,'Stage did not receive selected visual mode')
                verify(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Visual settings overflow page')
                panel=page.locator('.visual-settings-panel').bounding_box()
                verify(panel is not None and panel['x']>=-1 and panel['x']+panel['width']<=width+1,'Visual settings panel escapes viewport')
                evidence.append({'mode':mode,'time':after['state'].get('t'),'rows':len(after['rows']),'cameraPreserved':True})
            page.locator('#visual-labels').select_option('off');page.locator('#visual-grid').select_option('off');page.locator('#visual-trajectory').select_option('off')
            verify(page.locator('#visual-labels').input_value()=='off','Label preference did not stay selected')
            saved_visual=page.evaluate("JSON.parse(localStorage.getItem('quanh-visual-v1'))")
            verify(all(saved_visual[key] is False for key in ['labels','grid','trajectory']),'Visual switches not persisted independently')
            verify(saved(page,'projectile')['state']==before['state'],'Visual switch changed physical state')
            page.locator('[data-visual-setting=reducedMotion]').check()
            snapshot(page,f'visual-settings-{width}')
            page.locator('details.visual-settings > summary').click()
            page.locator('#play').click();page.wait_for_timeout(250)
            # Reduced motion controls ancillary motion; it must not turn the explicit Run action into a no-op.
            page.locator('#play').click()
            verify(saved(page,'projectile')['state']['t']>before['state']['t'],'Visual preferences stopped explicit physical playback')
            return {'presets':evidence,'switches':saved_visual,'manualCamera':baseline}
        run(f'{width}px visual preferences preserve physical state, rows, camera and focus',visual_settings)
        ctx.close()
    browser.close()
REPORT['summary']={status:sum(t['status']==status for t in REPORT['tests']) for status in ['PASS','FAIL']}
(OUT/'report.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2))
print(json.dumps(REPORT['summary']),flush=True)
raise SystemExit(1 if REPORT['summary']['FAIL'] or REPORT['pageErrors'] or REPORT['externalRequests'] else 0)
