"""Optional phase-C browser checks. Native Chromium/SwiftShader emulation, not hardware acceptance.
Numeric controls and time slider events exercise app recording; reference arithmetic is independent Python.
"""
import argparse,cmath,json,math
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/spec-v73/qa');args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'errors':[],'limits':['Chromium/SwiftShader viewport emulation; not real Safari or Android hardware.','No teacher acceptance; six representative IDs, not all52 scenes.','Time slider uses native input events; no physical touch gesture certification.']}
configs={
'damped':[{'a':5,'period':2,'beta':.25,'t':0},{'a':5,'period':2,'beta':0,'t':.5},{'a':.1,'period':4,'beta':1.5,'t':1}],
'collision':[{'m1':1,'m2':2,'v1':3,'v2':-1,'e':1,'t':0},{'m1':1,'m2':1,'v1':3,'v2':-3,'e':1,'t':2},{'m1':1,'m2':2,'v1':0,'v2':5,'e':0,'t':4}],
'refraction':[{'angle':40,'n1':1,'n2':1.5},{'angle':0,'n1':1,'n2':1.5},{'angle':80,'n1':1.8,'n2':1}],
'lens':[{'distance':40,'focal':20,'height':5},{'distance':40,'focal':-20,'height':5},{'distance':40,'focal':40,'height':5}],
'phasechange':[{'mass':.05,'power':200,'initial':-10,'t':0},{'mass':.05,'power':200,'initial':-10,'t':47},{'mass':.05,'power':200,'initial':-10,'t':172.35}],
'lorentz':[{'charge':1,'mass':1,'speed':4,'b':.5,'t':0},{'charge':0,'mass':1,'speed':4,'b':.5,'t':1},{'charge':-1,'mass':1,'speed':4,'b':.5,'t':1}]}
def expected(id,s):
 t=s.get('t',0)
 if id=='damped':
  w=2*math.pi/s['period'];r1=-s['beta']+cmath.sqrt(s['beta']**2-w*w);r2=-s['beta']-cmath.sqrt(s['beta']**2-w*w)
  c1=-r2*s['a']/(r1-r2);c2=r1*s['a']/(r1-r2);x=(c1*cmath.exp(r1*t)+c2*cmath.exp(r2*t)).real;v=(r1*c1*cmath.exp(r1*t)+r2*c2*cmath.exp(r2*t)).real
  return [t,x,v,s['beta'],.5*((v/100)**2+(w*x/100)**2)]
 if id=='collision':
  m,n,u,v,e=[s[k] for k in ['m1','m2','v1','v2','e']];p=m*u+n*v
  if u>v and t>=6/(u-v):u,v=(p-n*e*(u-v))/(m+n),(p+m*e*(u-v))/(m+n)
  return [t,u,v,p,(m*u*u+n*v*v)/2,e]
 if id=='refraction':
  a=math.radians(s['angle']);q=s['n1']*math.sin(a)/s['n2'];tir=q>1
  return [s['angle'],None if tir else math.degrees(math.asin(q)),s['n1'],s['n2'],int(tir),None if tir or s['angle']==0 else s['n2']/s['n1'],math.degrees(math.asin(s['n2']/s['n1'])) if s['n1']>s['n2'] else None]
 if id=='lens':
  d,f,h=s['distance'],s['focal'],s['height'];v=None if d==f else 1/(1/f-1/d);k=None if v is None else -v/d
  return [d,f,v,k,None if k is None else k*h,h]
 if id=='phasechange':
  m,p,initial=s['mass'],s['power'],s['initial'];q=p*t;warm=-initial*m*2100;melt=m*334000
  temp=initial+q/(m*2100) if q<warm else 0 if q<warm+melt else (q-warm-melt)/(m*4180)
  return [t,q,temp,max(0,min(1,(q-warm)/melt)),m,p,initial]
 q,m,v,b=s['charge']*1e-6,s['mass']*1e-6,s['speed'],s['b'];w=q*b/m
 return [t,s['charge'],m*v/(abs(q)*b) if q else None,abs(q)*v*b*1e6,v*t if not q else v/w*math.sin(w*t),0 if not q else v/w*(math.cos(w*t)-1),v,s['mass'],b]
def displayed_number(text):
 text=text.strip()
 if text=='—':return None
 if '×' in text:
  mantissa,power=text.split('×');power=power.strip()[2:].translate(str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺','0123456789-+'))
  return float(mantissa.strip().replace('.','').replace(',','.'))*10**int(power)
 return float(text.replace('.','').replace(',','.'))
def open_details(loc):
 for d in loc.locator('xpath=ancestor::details').all():
  if d.get_attribute('open') is None:d.locator(':scope>summary').click()
def set_control(page,key,value):
 if key=='t':page.locator('#time').evaluate('(e,v)=>{e.value=v;e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))}',value)
 else:
  loc=page.locator('.controls [data-number="'+key+'"]');open_details(loc);loc.fill(str(value));loc.press('Tab')
def saved(page,id):return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 for width in [390,1440]:
  for id,states in configs.items():
   case={'width':width,'id':id,'readings':[]};ctx=browser.new_context(viewport={'width':width,'height':900},is_mobile=width<600,has_touch=width<600);page=ctx.new_page();page.set_default_timeout(30000);page.on('pageerror',lambda e:report['errors'].append(str(e)))
   try:
    page.goto(args.base+'#lab/'+id,wait_until='networkidle');page.locator('.inquiry-workbook').wait_for(state='attached');page.locator('#visual canvas').first.wait_for()
    for s in states:
     for k,v in s.items():set_control(page,k,v)
     page.locator('[data-action=record]').first.click();rows=saved(page,id)['rows'];actual=rows[-1]['values'];recorded_inputs=rows[-1]['s'];ref=expected(id,recorded_inputs)
     assert len(actual)==len(ref),(id,actual,ref)
     for i,(a,b) in enumerate(zip(actual,ref)):
      if b is None:assert a is None,(id,i,a,b)
      else:assert isinstance(a,(int,float)) and math.isclose(a,b,rel_tol=2e-8,abs_tol=2e-8),(id,i,a,b)
     case['readings'].append({'requestedInputs':s,'actualInputs':recorded_inputs,'recorded':actual,'reference':ref})
    page.locator('[data-action=toggle-dock]').first.click() if not page.locator('#rows').count() else None
    assert page.locator('#rows').count()==1
    assert len(saved(page,id)['rows'])==3
    cells=page.locator('#rows tr').evaluate_all('(rows)=>rows.map(r=>[...r.querySelectorAll("td")].slice(1).map(c=>c.textContent))')
    assert len(cells)==3
    for texts,reading in zip(cells,case['readings']):
     reading['displayedCells']=texts
     for text,reference in zip(texts,reading['reference']):
      shown=displayed_number(text)
      if reference is None:assert shown is None,(id,text,reference)
      else:assert shown is not None and math.isclose(shown,reference,rel_tol=.005,abs_tol=.00051 if abs(reference)>=.1 else .000051),(id,text,reference)
    before=saved(page,id)['rows'];page.locator('[data-locale="en-US"]').click();assert saved(page,id)['rows']==before
    page.locator('[data-action=reset]').last.click();assert saved(page,id)['rows']==before
    if page.locator('[data-action=step]').is_visible():page.locator('[data-action=step]').click()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'horizontal overflow'
    page.locator('.stage-shell').screenshot(path=str(out/f'{width}-{id}.png'));case['status']='PASS'
   except Exception as e:case.update(status='FAIL',error=str(e),inquiryCount=page.locator('.inquiry-workbook').count());(out/f'failure-{width}-{id}.html').write_text(page.content());page.screenshot(path=str(out/f'failure-{width}-{id}.png'));print(case,flush=True)
   report['cases'].append(case);ctx.close()
 browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'cases':[(c['width'],c['id'],c['status'],c.get('error')) for c in report['cases']],'errors':report['errors']},ensure_ascii=False));assert not report['errors'] and all(c['status']=='PASS' for c in report['cases'])
