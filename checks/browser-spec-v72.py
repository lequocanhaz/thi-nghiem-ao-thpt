"""Integrated specification A/B browser QA; no live AI calls. Chromium emulation only."""
import argparse,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/spec-v72/qa');args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'errors':[],'limits':['Chromium/SwiftShader emulation, not real Safari/iPhone or Android hardware.','No teacher acceptance or AI calls.']}
def open_ancestors(loc):
 for d in loc.locator('xpath=ancestor::details').all():
  if d.get_attribute('open') is None:d.locator(':scope>summary').click()
def number(page,key,value):
 loc=page.locator('.controls [data-number="'+key+'"]');open_ancestors(loc);loc.fill(str(value));loc.press('Tab')
def session(page,id):return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)
def navigate(page,id):
 page.goto(args.base+'#lab/'+id,wait_until='domcontentloaded');page.locator('.inquiry-workbook').wait_for();page.wait_for_timeout(150)
def field(page,name):
 loc=page.locator('[data-inquiry-field="'+name+'"]');open_ancestors(loc);return loc
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY');browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 for width in [390,1440]:
  for idx,id in enumerate(['energy','oscillation','wave','electric','ohm','capacitor','boyle','gas']):
   theme='dark' if idx%2 else 'light';locale='en-US' if idx%2 else 'vi-VN';case={'width':width,'id':id,'theme':theme,'locale':locale}
   ctx=browser.new_context(viewport={'width':width,'height':1000 if width>620 else 844},is_mobile=width<620,has_touch=width<620,accept_downloads=True)
   ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1','{theme}');localStorage.setItem('quanh.locale.v1','{locale}')")
   page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   try:
    navigate(page,id);assert not page.locator('.inquiry-workbook').get_attribute('open')
    text='Prediction <img src=x onerror=alert(1)> '+id
    field(page,'prediction').fill(text);field(page,'prediction').press('Tab')
    assert page.locator('.inquiry-workbook img').count()==0
    variable=field(page,'independent');keys=variable.locator('option').evaluate_all('(nodes)=>nodes.map(x=>x.value).filter(Boolean)');assert keys;variable.select_option(keys[0])
    assert page.locator('[data-inquiry-controlled="'+keys[0]+'"]').is_disabled()
    field(page,'conclusion').fill('Conclusion based on two numerical readings, pending verification.')
    record=page.locator('[data-inquiry-text="record"]');open_ancestors(record);record.click()
    assert len(session(page,id)['rows'])==1
    show=page.locator('[data-inquiry-text="data"]');show.click();assert page.locator('#rows').count()==1
    before=session(page,id);other='vi-VN' if locale=='en-US' else 'en-US';page.locator('[data-locale="'+other+'"]').click()
    assert field(page,'prediction').input_value()==text;assert session(page,id)['rows']==before['rows']
    export=page.locator('.inquiry-export');open_ancestors(export)
    with page.expect_download() as dl:export.click()
    path=out/f'{width}-{id}-worksheet.json';dl.value.save_as(path);data=json.loads(path.read_text());assert data['worksheet']['prediction']==text and data['experimentId']==id
    assert len(data['recordedData'])==1 and all(v is None or isinstance(v,(int,float,str)) for v in data['recordedData'][0]['values'])
    assert isinstance(data['currentParameters'][keys[0]],(int,float))
    page.reload(wait_until='domcontentloaded');page.locator('.inquiry-workbook').wait_for();assert field(page,'prediction').input_value()==text
    page.locator('.inquiry-workbook').screenshot(path=str(out/f'{width}-{id}.png'))
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Document overflow'
    case['status']='PASS'
   except Exception as e:case.update(status='FAIL',error=str(e));page.screenshot(path=str(out/f'failure-{width}-{id}.png'));print(case,flush=True)
   report['cases'].append(case);ctx.close()
 # Full numerical fit workflow, independent from module unit fixtures.
 for width in [390,1440]:
  case={'width':width,'id':'ohm-fit-pause'};ctx=browser.new_context(viewport={'width':width,'height':1000},accept_downloads=True);page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
  try:
   navigate(page,'ohm');number(page,'r',10)
   for u in [2,4,6]:number(page,'u',u);page.locator('[data-action=record]').first.click()
   page.locator('#graphMode').select_option('measured');page.locator('#graphX').select_option('0');page.locator('#graphY').select_option('2');page.locator('#fitLine').check()
   assert not page.locator('#fitResult .analysis-notice').count();assert page.locator('#fitResult').inner_text().strip()
   before=session(page,'ohm')['rows'];page.locator('#play').click();assert page.locator('#play').get_attribute('aria-pressed')=='true'
   number(page,'r',20);assert page.locator('#play').get_attribute('aria-pressed')=='false';assert session(page,'ohm')['rows']==before
   assert 'tạm dừng' in page.locator('#toast').inner_text().lower() or 'paused' in page.locator('#toast').inner_text().lower()
   page.locator('[data-action=record]').first.click();assert len(session(page,'ohm')['rows'])==4
   assert page.locator('#fitResult .analysis-notice').count()>=1;assert '2 nhóm' in page.locator('#fitResult').inner_text() or '2 groups' in page.locator('#fitResult').inner_text()
   assert page.locator('#graph .measured-point').count()==4 or page.locator('#graph [data-graph-row]').count()==4
   case['status']='PASS'
  except Exception as e:case.update(status='FAIL',error=str(e));page.screenshot(path=str(out/f'failure-{width}-fit.png'));print(case,flush=True)
  report['cases'].append(case);ctx.close()
 browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2));assert not report['errors'] and all(c['status']=='PASS' for c in report['cases'])
