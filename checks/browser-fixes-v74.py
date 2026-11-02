"""Independent Chromium QA for envelope/optics fixes; no AI or hardware claims."""
import argparse,cmath,json,math,os,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/fix-v74/qa');ap.add_argument('--ids',nargs='+',default=['lens','damped']);ap.add_argument('--widths',nargs='+',type=int,default=[390,1440]);ap.add_argument('--themes',nargs='+',default=['light','dark']);args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'errors':[],'limits':['Chromium/SwiftShader emulation, not physical Safari/iPhone/Android.','No AI calls or teacher acceptance.','Envelope itself is an internal output; browser assertions cover unchanged recorded kinematics and energy.']}
configs={'lens':[{'distance':40,'focal':20,'height':5},{'distance':40,'focal':-20,'height':5},{'distance':40,'focal':40,'height':5}], 'damped':[{'a':5,'period':2,'beta':.25,'t':0},{'a':5,'period':2,'beta':0,'t':.5},{'a':.1,'period':4,'beta':1.5,'t':1}]}
def expected(id,s):
 if id=='lens':
  d,f,h=s['distance'],s['focal'],s['height'];v=None if d==f else 1/(1/f-1/d);k=None if v is None else -v/d
  return [d,f,v,k,None if k is None else k*h,h]
 t=s['t'];w=2*math.pi/s['period'];r1=-s['beta']+cmath.sqrt(s['beta']**2-w*w);r2=-s['beta']-cmath.sqrt(s['beta']**2-w*w)
 c1=-r2*s['a']/(r1-r2);c2=r1*s['a']/(r1-r2);x=(c1*cmath.exp(r1*t)+c2*cmath.exp(r2*t)).real;v=(r1*c1*cmath.exp(r1*t)+r2*c2*cmath.exp(r2*t)).real
 return [t,x,v,s['beta'],.5*((v/100)**2+(w*x/100)**2)]
def ancestors(loc):
 for d in loc.locator('xpath=ancestor::details').all():
  if d.get_attribute('open') is None:d.locator(':scope>summary').click()
def control(page,k,v):
 if k=='t':page.locator('#time').evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))}',v)
 else:
  loc=page.locator('.controls [data-number="'+k+'"]');ancestors(loc);loc.fill(str(v));loc.press('Tab')
def saved(page,id):return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)
def field(page,key):
 loc=page.locator('[data-inquiry-field="'+key+'"]');ancestors(loc);return loc
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 for width in args.widths:
  for theme in args.themes:
   for id in args.ids:
    states=configs[id]
    case={'width':width,'theme':theme,'id':id,'readings':[]};ctx=browser.new_context(viewport={'width':width,'height':900},is_mobile=width<600,has_touch=width<600)
    ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1','{theme}');localStorage.setItem('quanh.locale.v1','vi-VN')")
    page=ctx.new_page();page.set_default_timeout(30000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
    try:
     page.goto(args.base+'#lab/'+id,wait_until='networkidle');page.locator('.inquiry-workbook').wait_for(state='attached');page.locator('#visual canvas').first.wait_for()
     for s in states:
      for k,v in s.items():control(page,k,v)
      page.locator('[data-action=record]').first.click();row=saved(page,id)['rows'][-1];ref=expected(id,row['s'])
      for i,(a,b) in enumerate(zip(row['values'],ref)):
       if b is None:assert a is None,(id,i,a,b)
       else:assert isinstance(a,(int,float)) and math.isclose(a,b,rel_tol=2e-8,abs_tol=2e-12),(id,i,a,b)
      case['readings'].append({'inputs':row['s'],'recorded':row['values'],'reference':ref})
     baseline=saved(page,id);before=baseline['rows'];draft='Khoảng cách ảnh <b>không đổi</b> '+id
     field(page,'prediction').fill(draft);field(page,'prediction').press('Tab')
     for mode in ['2d','3d']:
      page.locator('[data-projection="'+mode+'"]').click();assert saved(page,id)['rows']==before
      assert page.locator('[data-projection="'+mode+'"]').get_attribute('aria-pressed')=='true'
     page.locator('[data-locale="en-US"]').click()
     page.locator('[data-action=locate-parameter]').filter(has_text='Enter value').wait_for()
     assert saved(page,id)['rows']==before
     if id=='lens':
      page.locator('#timeValue').filter(has_text='Slow illustration').wait_for()
      assert page.locator('#time').get_attribute('aria-valuetext')=='Slow illustration'
      readings=page.locator('#readouts').inner_text();assert 'Image distance' in readings and 'Image height' in readings,readings
      for old in ['Khoảng cách ảnh','Chiều cao ảnh','Phát tia','Minh họa chậm','Nhập số']:
       assert old not in page.locator('.stage-shell').inner_text(),old
      assert page.locator('[data-action=locate-parameter]').get_attribute('aria-label')=='Open numeric input for the interactive parameter'
      page.locator('#play').click();page.wait_for_timeout(100);page.locator('#play').click()
      assert page.locator('#time').get_attribute('aria-valuetext')=='Slow illustration'
     assert field(page,'prediction').input_value()==draft
     control(page,'t',.5)
     assert page.locator('#time').get_attribute('aria-label')=='Experiment time'
     if id=='lens':assert page.locator('#time').get_attribute('aria-valuetext')=='Slow illustration'
     assert saved(page,id)['rows']==before
     page.locator('[data-locale="vi-VN"]').click();assert saved(page,id)['rows']==before
     page.locator('[data-action=locate-parameter]').filter(has_text='Nhập số').wait_for()
     if id=='lens':
      page.locator('#timeValue').filter(has_text='Minh họa chậm').wait_for();assert page.locator('#time').get_attribute('aria-valuetext')=='Minh họa chậm'
     assert field(page,'prediction').input_value()==draft
     page.reload(wait_until='networkidle');page.locator('.inquiry-workbook').wait_for(state='attached')
     assert saved(page,id)['rows']==before;assert field(page,'prediction').input_value()==draft
     page.locator('[data-action=reset]').last.click();assert saved(page,id)['rows']==before
     step=page.locator('[data-action=step]');ancestors(step)
     if step.is_visible():step.click();assert saved(page,id)['rows']==before
     assert page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
     page.locator('.stage-shell').screenshot(path=str(out/f'{width}-{theme}-{id}.png'));case['status']='PASS'
    except Exception as e:
     case.update(status='FAIL',error=str(e),traceback=traceback.format_exc());page.screenshot(path=str(out/f'failure-{width}-{theme}-{id}.png'));print(case,flush=True)
    report['cases'].append(case);ctx.close()
 browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'cases':[(c['width'],c['theme'],c['id'],c['status'],c.get('error')) for c in report['cases']],'errors':report['errors']},ensure_ascii=False));assert not report['errors'] and all(c['status']=='PASS' for c in report['cases'])
