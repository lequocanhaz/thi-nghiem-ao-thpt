"""Chromium fixture QA for neutral themes and readable AI replies. No live AI calls.
Run against the static dist server; --base may point to production for before evidence.
Emulated viewports do not certify iPhone/Safari or physical mobile keyboards.
"""
import argparse, json, os
from pathlib import Path
from playwright.sync_api import sync_playwright

ap=argparse.ArgumentParser()
ap.add_argument('--base',default='http://127.0.0.1:4173/')
ap.add_argument('--out',default='work/night-v70/qa')
ap.add_argument('--widths',nargs='+',type=int,default=[320,390,1440,1920])
ap.add_argument('--before',action='store_true',help='Capture the existing production failure without requiring contrast to pass')
args=ap.parse_args(); BASE=args.base; OUT=Path(args.out); OUT.mkdir(parents=True,exist_ok=True)
answer='''Cách thực hiện khảo sát:
1. Biến độc lập (chọn để thay đổi): Hiệu điện thế \\(U\\) đặt vào hai đầu điện trở.
2. Biến cố định (giữ không đổi): Giá trị của điện trở \\(R\\).
3. Biến phụ thuộc (đo đạc): Cường độ dòng điện \\(I\\) chạy qua mạch.
4. Lập bảng số liệu: Ghi lại các giá trị của \\(I\\) ứng với mỗi lần thay đổi \\(U\\).
5. Phân tích đồ thị: Vẽ đồ thị và rút ra mối quan hệ tỉ lệ thuận.
\\[ I = \\dfrac{U}{R} = \\dfrac{5}{10} = 0.5\\,\\mathrm{A} \\]
Kĩ năng này cũng áp dụng cho dao động và quang học trong thư viện thí nghiệm của Quanh Lab.'''
contrast_js=r'''(selectors)=>{
const rgb=s=>{let m=s.match(/[\d.]+/g);return m?m.map(Number):[0,0,0,0]};
const mix=(a,b)=>{let alpha=a.length>3?a[3]:1;return [0,1,2].map(i=>a[i]*alpha+b[i]*(1-alpha))};
function bg(el){let layers=[];for(let p=el;p;p=p.parentElement)layers.push(rgb(getComputedStyle(p).backgroundColor));let out=[255,255,255];for(let i=layers.length-1;i>=0;i--)out=mix(layers[i],out);return out}
const lum=a=>a.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
return selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(el=>el.getClientRects().length).map(el=>{let s=getComputedStyle(el),back=bg(el),fore=mix(rgb(s.color),back),l=[lum(back),lum(fore)].sort((a,b)=>b-a);return {selector,text:el.textContent.slice(0,50),foreground:s.color,background:back,ratio:(l[0]+.05)/(l[1]+.05)};}));
}'''
report={'browser':'Chromium headless / SwiftShader, emulated viewports','base':BASE,'fixtureOnly':True,'cases':[],'errors':[],'limits':['Not real iPhone/Safari/Android hardware.','No live inference, API keys or physical keyboard tested.']}
with sync_playwright() as p:
 proxy=os.environ.get('HTTPS_PROXY') or os.environ.get('HTTP_PROXY')
 launch={'executable_path':'/usr/bin/chromium','headless':True,'args':['--no-sandbox','--enable-unsafe-swiftshader']}
 if BASE.startswith('https:') and proxy:launch['proxy']={'server':proxy}
 browser=p.chromium.launch(**launch)
 for width in args.widths:
  for locale in (['vi-VN'] if args.before else ['vi-VN','en-US']):
   ctx=browser.new_context(viewport={'width':width,'height':1000 if width>600 else 844},is_mobile=width<600,has_touch=width<600)
   ctx.add_init_script(f"localStorage.setItem('quanh-appearance-v1','dark');localStorage.setItem('quanh.locale.v1','{locale}')")
   page=ctx.new_page();page.on('pageerror',lambda e:report['errors'].append(str(e)))
   requests=[];state={'error':False}
   def route_ai(route):
    req=route.request
    if req.method=='OPTIONS':route.fulfill(status=204,headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type'});return
    requests.append(req.post_data_json)
    route.fulfill(status=503 if state['error'] else 200,headers={'Access-Control-Allow-Origin':'*'},content_type='application/json',body=json.dumps({'error':'Dịch vụ AI đang bận. Hãy thử lại sau.'} if state['error'] else {'answer':answer}))
   page.route('**/api/chat',route_ai)
   case={'width':width,'locale':locale,'states':[]}
   try:
    page.goto(BASE+'?night-fixture=70#library',wait_until='networkidle',timeout=60000)
    page.locator('#openAssistant').click();page.locator('#aiQuestion').fill('Khảo sát định luật Ohm như thế nào?')
    page.locator('.ai-compose button[type=submit]').click()
    page.locator('.ai-message[data-role=assistant]:not(.ai-pending) .katex').first.wait_for()
    assert len(requests)==1
    assert requests[0]['locale']==locale
    for theme in (['dark'] if args.before else ['dark','light','dark']):
     if page.locator('html').get_attribute('data-appearance')!=theme:
      page.locator('[data-ai=close]').click();page.locator('#appearanceToggle').click();page.locator('#openAssistant').click()
     assert page.locator('html').get_attribute('data-appearance')==theme
     assert page.locator('.ai-message[data-role=assistant]').count()==1
     vals=page.evaluate(contrast_js,['.ai-message[data-role=assistant]','.ai-message[data-role=user]','.ai-context','.ai-attachment-hint','.ai-message .katex'])
     bodybg=page.locator('body').evaluate('(el)=>getComputedStyle(el).backgroundColor')
     chatbg=page.locator('.ai-messages').evaluate('(el)=>getComputedStyle(el).backgroundColor')
     headerbg=page.locator('.header').evaluate('(el)=>getComputedStyle(el).backgroundColor')
     overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth')
     chat_overflow=page.locator('.ai-messages').evaluate('(el)=>el.scrollWidth>el.clientWidth')
     if not args.before:
      assert all(x['ratio']>=4.5 for x in vals),vals
      assert not overflow and not chat_overflow,(overflow,chat_overflow)
      if theme=='dark':assert bodybg=='rgb(33, 33, 33)' and chatbg=='rgb(33, 33, 33)' and headerbg=='rgb(23, 23, 23)',(bodybg,chatbg,headerbg)
     case['states'].append({'theme':theme,'contrast':vals,'body':bodybg,'chat':chatbg,'header':headerbg,'pageOverflow':overflow,'chatOverflow':chat_overflow})
     page.locator('#aiAssistant').screenshot(path=str(OUT/f'{width}-{locale}-{theme}.png'))
    if not args.before:
     state['error']=True;page.locator('#aiQuestion').fill('Giữ nguyên câu hỏi này để gửi lại')
     page.locator('.ai-compose button[type=submit]').click();page.locator('.ai-status[data-state=error]').wait_for(state='visible')
     assert page.locator('#aiQuestion').input_value()=='Giữ nguyên câu hỏi này để gửi lại'
     err=page.evaluate(contrast_js,['.ai-status[data-state=error]']);assert all(x['ratio']>=4.5 for x in err)
     state['error']=False;page.locator('.ai-compose button[type=submit]').click()
     page.wait_for_function("document.querySelectorAll('.ai-message[data-role=assistant]:not(.ai-pending)').length===2 && !document.querySelector('.ai-pending')")
     assert page.locator('#aiQuestion').input_value()==''
     page.locator('[data-ai=close]').click()
     assert page.locator('#openAssistant').evaluate('(el)=>document.activeElement===el')
     page.goto(BASE+'#lab/oscillation',wait_until='networkidle')
     page.locator('.shm-circle').wait_for(state='visible')
     assert page.locator('body').evaluate('(el)=>getComputedStyle(el).backgroundColor')=='rgb(33, 33, 33)'
     assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
     case.update({'errorDraftRetry':'PASS','focusRestore':'PASS','linkedLab':'PASS','requests':len(requests),'errorContrast':err})
    case['status']='PASS'
   except Exception as e:
    case['status']='FAIL';case['error']=str(e);page.screenshot(path=str(OUT/f'failure-{width}-{locale}.png'))
   report['cases'].append(case);ctx.close()
 browser.close()
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'cases':[{'width':c['width'],'locale':c['locale'],'status':c['status'],'error':c.get('error')} for c in report['cases']],'errors':report['errors']},ensure_ascii=False,indent=2))
assert not report['errors'] and all(c['status']=='PASS' for c in report['cases'])
