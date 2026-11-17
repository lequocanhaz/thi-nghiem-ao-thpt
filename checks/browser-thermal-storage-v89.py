#!/usr/bin/env python3
"""Storage regression: deferred writes during capture and clean-idle import/reload."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
before=source_hashes();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for two in [True,False]:
  b=Bench(browser,force_2d=two);p=b.page
  try:
   b.select('stirrer');p.wait_for_timeout(1600)
   stage=p.locator('#l3Stage' if two else '#l3ThreeCanvas');stage.scroll_into_view_if_needed()
   def screen(x,y):
    if not two:return b.screen(x,y)
    return stage.evaluate('(s,p)=>{const q=s.createSVGPoint();q.x=p.x;q.y=p.y;const a=q.matrixTransform(s.getScreenCTM());return{x:a.x,y:a.y}}',{'x':x,'y':y})
   p.evaluate('''key=>{window.qaPrimaryWrites=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)window.qaPrimaryWrites++;return original.call(this,k,v);};}''',b.storage_key)
   start=screen(780,340);p.mouse.move(start['x'],start['y']);p.mouse.down()
   for i in range(20):
    q=screen(775+3*math.sin(i*.5),340);p.mouse.move(q['x'],q['y']);p.wait_for_timeout(90)
   held=p.evaluate('window.qaPrimaryWrites');assert held==0,{'view':two,'writesDuringDrag':held}
   p.mouse.up();p.wait_for_timeout(1500);released=p.evaluate('window.qaPrimaryWrites');assert released>0
   exported=b.session();exported['trials'][-1]['hypothesis']='QA v89 clean idle import: preserve this prediction'
   p.wait_for_timeout(1600);idle=p.evaluate('window.qaPrimaryWrites');p.wait_for_timeout(1200);assert p.evaluate('window.qaPrimaryWrites')==idle
   p.locator('#l3Import').set_input_files({'name':'clean-idle.json','mimeType':'application/json','buffer':json.dumps(exported).encode()})
   b.wait('s.trials[s.trials.length-1].hypothesis==="QA v89 clean idle import: preserve this prediction"')
   p.reload();p.wait_for_selector('.l3-pilot')
   if not two:b.ready_3d()
   restored=b.session();assert restored['trials']==exported['trials'];assert restored['physicalState']==exported['physicalState'];assert not b.errors
   results.append({'view':'2d' if two else '3d','writesDuringHeld1800ms':held,'writesAfterRelease':released,'cleanIdleImportReloadPreservesTrialAndPhysics':True,'pageErrors':b.errors[:]});print(json.dumps(results[-1]),flush=True)
  finally:b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True},ensure_ascii=False,indent=2)+'\n')
