"""Independent browser QA for observation surfaces and coordinate translation.
Chromium emulation only; no hardware, AI, or teacher acceptance claim.
"""
import argparse,json,os,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ap=argparse.ArgumentParser();ap.add_argument('--base',default='http://127.0.0.1:4173/');ap.add_argument('--out',default='work/spec-v75/qa');ap.add_argument('--ids',nargs='+',default=['vector_sum','spring_period','charge_quantization','potential_point','ray_slab']);ap.add_argument('--widths',nargs='+',type=int,default=[390,1440]);ap.add_argument('--themes',nargs='+',default=['light','dark']);ap.add_argument('--before',action='store_true');args=ap.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
report={'cases':[],'errors':[],'base':args.base,'contrastEnforced':not args.before,'limits':['Chromium/SwiftShader emulation; not physical Safari/iPhone/Android.','No AI inference or teacher acceptance.','Selected visible text and graphic pairs sampled, not full WCAG certification.']}
sources=[Path(__file__).resolve().parents[1]/'dist'/p for p in ['observation-theme-v75.css','language-ui.js']]
def fingerprint():return {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}
initial=fingerprint()
paint=r'''()=>{
const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
const rgb=c=>{cx.clearRect(0,0,1,1);cx.fillStyle=c;cx.fillRect(0,0,1,1);return Array.from(cx.getImageData(0,0,1,1).data)};
const mix=(a,b)=>{let q=a[3]/255;return [0,1,2].map(i=>a[i]*q+b[i]*(1-q))};
const bg=e=>{let p=e,l=[];while(p){l.push(rgb(getComputedStyle(p).backgroundColor));p=p.parentElement}let b=[255,255,255];for(let i=l.length-1;i>=0;i--)b=mix(l[i],b);return b};
const lum=x=>x.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>{let x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const pairs=[];
const add=(sel,prop,min)=>{for(const e of [...document.querySelectorAll('#conceptObservation '+sel)].slice(0,8)){if(!e.getClientRects().length||getComputedStyle(e).display==='none')continue;let s=getComputedStyle(e);if(prop==='stroke'&&e.tagName==='path'&&!e.getAttribute('d'))continue;let c=rgb(s[prop]),b=bg(prop==='backgroundColor'?e.parentElement:e);if(c[3]===0)continue;pairs.push({selector:sel,property:prop,color:s[prop],background:b,ratio:ratio(mix(c,b),b),minimum:min,text:(e.textContent||'').slice(0,50)})}};
for(const s of ['.observation-details>summary','.observation-title','.observation-key>span','.observation-axis-labels p','.observation-current-value','.observation-values>summary','.observation-values th','.observation-values td','.observation-note','.optics-notes li','.optics-legend li','.optics-values dt','.optics-values dd'])add(s,'color',4.5);
add('.observation-ticks text','fill',4.5);
for(const s of ['.observation-curve','.observation-axes','.observation-zero'])add(s,'stroke',3);
add('.observation-current','fill',3);add('.observation-samples circle','fill',3);
for(const s of ['.theory-key','.current-key'])add(s,'backgroundColor',3);
add('.optics-line','borderTopColor',3);
const h=document.querySelector('#conceptObservation'),key=document.querySelector('.theory-key'),curve=document.querySelector('.observation-curve'),currentKey=document.querySelector('.current-key'),marker=document.querySelector('.observation-current');
return {pairs,rootBackground:getComputedStyle(h).backgroundColor,keys:curve?{theory:rgb(getComputedStyle(key).backgroundColor),curve:rgb(getComputedStyle(curve).stroke),current:rgb(getComputedStyle(currentKey).backgroundColor),marker:rgb(getComputedStyle(marker).fill)}:null};
}'''
def ancestors(loc):
 for d in loc.locator('xpath=ancestor::details').all():
  if d.get_attribute('open') is None:d.locator(':scope>summary').click()
def session(page,id):return page.evaluate('(id)=>JSON.parse(localStorage.getItem("thpt-lab-v1"))[id]',id)
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY');browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'],**({'proxy':{'server':proxy}} if args.base.startswith('https:') and proxy else {}))
 for width in args.widths:
  for theme in args.themes:
   for id in args.ids:
    case={'width':width,'theme':theme,'id':id,'states':[]};ctx=browser.new_context(viewport={'width':width,'height':1000},is_mobile=width<600,has_touch=width<600)
    ctx.add_init_script("if(!localStorage.getItem('quanh.locale.v1'))localStorage.setItem('quanh.locale.v1','vi-VN');if(!localStorage.getItem('quanh-appearance-v1'))localStorage.setItem('quanh-appearance-v1',"+json.dumps(theme)+")")
    page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
    try:
     page.goto(args.base+'#lab/'+id,wait_until='networkidle');host=page.locator('#conceptObservation')
     if not args.before:page.locator('#visual .scene-canvas:visible').first.wait_for(timeout=60000)
     host.wait_for(timeout=60000)
     if args.before:
      host.scroll_into_view_if_needed();case['states'].append({'locale':'vi-VN',**page.evaluate(paint)});host.screenshot(path=str(out/f'{width}-{theme}-{id}.png'));case['status']='PASS';report['cases'].append(case);ctx.close();continue
     page.locator('[data-action=record]').first.click();baseline=session(page,id);assert len(baseline['rows'])==1
     note=page.locator('[data-inquiry-field=prediction]');ancestors(note);draft='Trục định hướng · không dùng để đọc số đo <b>lời của tôi</b>';note.fill(draft);note.press('Tab')
     for locale in ['vi-VN','en-US','vi-VN']:
      page.locator('[data-locale="'+locale+'"]').click();page.wait_for_timeout(100)
      values=host.locator('.observation-values')
      if values.count() and values.get_attribute('open') is None:
       summary=values.locator(':scope>summary');summary.focus();summary.press('Enter');assert summary.evaluate('(e)=>document.activeElement===e'),'native disclosure lost focus'
      host.scroll_into_view_if_needed()
      for summary in host.locator('summary:visible').all():assert summary.bounding_box()['height']>=44,'summary touch target'
      pairs=page.evaluate(paint);case['states'].append({'locale':locale,**pairs})
      if not args.before:
       for pair in pairs['pairs']:assert pair['ratio']>=pair['minimum']-.005,(id,theme,pair)
       if pairs['keys']:
        assert pairs['keys']['theory']==pairs['keys']['curve'];assert pairs['keys']['current']==pairs['keys']['marker']
       if theme=='dark':assert pairs['rootBackground']=='rgb(47, 47, 47)',pairs['rootBackground']
      legend=page.locator('#coordinateLegend')
      if legend.is_visible() and 'sr-only' not in (legend.get_attribute('class') or ''):
       text=legend.inner_text()
       if not args.before:assert ('Trục định hướng' in text if locale=='vi-VN' else 'Orientation axes' in text),text
      assert session(page,id)['state']==baseline['state'];assert session(page,id)['rows']==baseline['rows'];assert note.input_value()==draft
      assert page.evaluate('()=>document.documentElement.scrollWidth<=innerWidth+1'),'horizontal overflow'
     host.screenshot(path=str(out/f'{width}-{theme}-{id}.png'))
     page.reload(wait_until='networkidle');page.locator('#visual .scene-canvas:visible').first.wait_for(timeout=60000);assert session(page,id)['rows']==baseline['rows'];assert note.input_value()==draft
     case['status']='PASS'
    except Exception as e:
     case.update(status='FAIL',error=str(e),traceback=traceback.format_exc());print({k:v for k,v in case.items() if k!='states'},flush=True);page.screenshot(path=str(out/f'failure-{width}-{theme}-{id}.png'))
    report['cases'].append(case);ctx.close()
 browser.close()
report['sourceStable']=initial==fingerprint();report['sourceHashes']=initial
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({'cases':[(c['width'],c['theme'],c['id'],c['status'],c.get('error')) for c in report['cases']],'errors':report['errors']},ensure_ascii=False));assert report['sourceStable'] and not report['errors'] and all(c['status']=='PASS' for c in report['cases'])
