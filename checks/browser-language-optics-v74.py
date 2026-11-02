"""Exact optics-label regression; Chromium emulation, no AI or hardware claim."""
import argparse,json,os,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/ui-v74');ap.add_argument('--widths',nargs='+',type=int,default=[390,1440]);ap.add_argument('--themes',nargs='+',default=['light','dark']);args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'errors':[],'limits':['Chromium emulated390/1440, not physical Safari/iPhone.','No API inference or account login.']}
def saved(page):return page.evaluate('()=>JSON.parse(localStorage.getItem("thpt-lab-v1"))?.lens')
def labels(page,en):
 expected=['Image distance','Linear magnification','Image height'] if en else ['Khoảng cách ảnh','Độ phóng đại','Chiều cao ảnh']
 assert page.locator('#readouts .meter>span').all_text_contents()==expected
 assert page.locator('#play').inner_text().strip()==('Trace rays' if en else 'Phát tia')
 assert page.locator('#timeValue').inner_text()==('Slow illustration' if en else 'Minh họa chậm')
 assert page.locator('#time').get_attribute('aria-valuetext')==('Slow illustration' if en else 'Minh họa chậm')
 assert page.locator('#time').get_attribute('aria-label')==('Experiment time' if en else 'Thời điểm thí nghiệm')
 assert page.locator('[data-action=locate-parameter]').inner_text()==('Enter value ↗' if en else 'Nhập số ↗')
 assert page.locator('[data-action=locate-parameter]').get_attribute('aria-label')==('Open numeric input for the interactive parameter' if en else 'Mở ô nhập số của biến tương tác')
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY');browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 for width in args.widths:
  for theme in args.themes:
   case={'width':width,'theme':theme};ctx=browser.new_context(viewport={'width':width,'height':900},is_mobile=width<600,has_touch=width<600)
   ctx.add_init_script("if(!localStorage.getItem('quanh.locale.v1'))localStorage.setItem('quanh.locale.v1','vi-VN');if(!localStorage.getItem('quanh-appearance-v1'))localStorage.setItem('quanh-appearance-v1',"+json.dumps(theme)+")")
   page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   try:
    page.goto(args.base+'#lab/lens',wait_until='networkidle');page.locator('#visual canvas').first.wait_for();labels(page,False)
    distance=page.locator('.controls [data-number=distance]')
    for d in distance.locator('xpath=ancestor::details').all():
     if d.get_attribute('open') is None:d.locator(':scope>summary').click()
    distance.fill('43');distance.press('Tab');page.locator('[data-action=record]').first.click()
    original=saved(page);assert len(original['rows'])==1
    note=page.locator('[data-inquiry-field=prediction]')
    for d in note.locator('xpath=ancestor::details').all():
     if d.get_attribute('open') is None:d.locator(':scope>summary').click()
    note.fill('Khoảng cách ảnh — Phát tia: lời dự đoán của tôi.');note.press('Tab')
    page.locator('[data-locale="en-US"]').click();page.wait_for_timeout(200);labels(page,True)
    assert saved(page)['state']==original['state'];assert saved(page)['rows']==original['rows'];assert note.input_value()=='Khoảng cách ảnh — Phát tia: lời dự đoán của tôi.'
    # Real refresh re-creates playback labels. Translation must still apply.
    page.locator('[data-action=step]').click();page.wait_for_timeout(200);labels(page,True)
    distance.fill('44');distance.press('Tab');page.wait_for_timeout(200);labels(page,True)
    assert saved(page)['rows']==original['rows']
    distance.fill('43');distance.press('Tab');page.wait_for_timeout(200);labels(page,True)
    after=saved(page);assert after['rows']==original['rows']
    page.locator('[data-action=locate-parameter]').click();assert page.locator('.controls [data-number=distance]').evaluate('(e)=>e===document.activeElement')
    page.locator('[data-locale="vi-VN"]').click();page.wait_for_timeout(200);labels(page,False)
    assert saved(page)['state']==after['state'];assert saved(page)['rows']==original['rows']
    assert note.input_value()=='Khoảng cách ảnh — Phát tia: lời dự đoán của tôi.'
    page.locator('[data-locale="en-US"]').click();page.wait_for_timeout(200);labels(page,True)
    assert page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth+1')
    page.locator('.stage-shell').screenshot(path=str(out/f'lens-{width}-{theme}-en.png'))
    page.reload(wait_until='networkidle');page.locator('#visual canvas').first.wait_for();labels(page,True)
    assert saved(page)['rows']==original['rows']
    case.update(status='PASS',recordedRows=1,parameterDistance=43,notesPreserved=True,screenReaderTimeValue='Slow illustration')
   except Exception as e:
    case.update(status='FAIL',error=str(e),traceback=traceback.format_exc());page.screenshot(path=str(out/f'failure-{width}-{theme}.png'));print(case,flush=True)
   report['cases'].append(case);ctx.close()
 browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2));assert all(c['status']=='PASS' for c in report['cases']) and not report['errors']
