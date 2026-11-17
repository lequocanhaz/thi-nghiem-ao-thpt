#!/usr/bin/env python3
"""Recovery and reduced-motion regressions at the public controller seam."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
node="""import{createState,applyAction,validateState}from'./dist/l3/thermal-physics.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';import{newSession,newTrial,serializeSession,parseSession}from'./dist/l3/data-notebook.js';const q=newSession('ice');newTrial(q,'ice',{}).hypothesis='Keep the previous investigation';let s={...createState('ice'),apparatusGeometryVersion:'thermal.geometry.v2'};s=applyAction(s,{actionType:'place-vessel',payloadSI:{placed:true}}).state;s=applyAction(s,{actionType:'pour',payloadSI:{massKg:.2,target:'table'}}).state;q.physicalState=s;q.apparatusState={positions:initialPositions(s),icePieceMassKg:.01,cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2'};const raw=serializeSession(q);parseSession(raw,{activity:'ice',validateState:s=>validateState(s).valid});process.stdout.write(raw);"""
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',node],text=True));before=source_hashes();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width in ([] if args.only=='reduced' else [1440,390]):
  b=Bench(browser,width=width,force_2d=True,preloaded=fixture);p=b.page
  try:
   p.wait_for_function('()=>document.querySelector("#l3MainAction").textContent.length>0');p.wait_for_timeout(100);enabled=p.locator('#l3MainAction').is_enabled();p.screenshot(path=str(out/f'empty-{width}.png'),full_page=True)
   print(json.dumps({'case':'empty-source-and-vessel','width':width,'primaryEnabled':enabled,'label':p.locator('#l3MainAction').inner_text()}),flush=True)
   assert enabled,'Both vessels are empty; the primary action offers no recovery'
   p.locator('#l3MainAction').click();s=b.wait('s.trials.length===2&&s.physicalState.cupWaterMassKg===.2')
   assert s['trials'][0]['hypothesis']==fixture['trials'][0]['hypothesis'];assert s['trials'][0]['finalPhysicalState']==fixture['physicalState']
   p.reload();p.wait_for_selector('#l3MainAction');assert b.session()['trials']==s['trials'];assert not b.errors
   results.append({'case':'recovery','width':width,'oldTrialAndFinalPhysicsPreserved':True})
  finally:b.close()
 if args.only!='reduced':
  zero=json.loads(subprocess.check_output(['node','--input-type=module','-e',node.replace("createState('ice')","createState('ice',{waterMassKg:0})")],text=True))
  b=Bench(browser,force_2d=True,preloaded=zero);p=b.page
  try:
   p.wait_for_function('()=>document.querySelector("#l3MainAction").textContent.length>0');p.locator('#l3MainAction').click()
   assert p.locator('.l3-trial-settings').get_attribute('open') is not None
   field=p.locator('[data-l3-config=waterMassKg]');assert field.evaluate('n=>n===document.activeElement');field.fill('.2');b.click('new-trial')
   s=b.wait('s.trials.length===2&&s.physicalState.cupWaterMassKg===.2');assert s['trials'][0]['hypothesis']==zero['trials'][0]['hypothesis'];assert not b.errors
   results.append({'case':'zero-configured-source','explicitNewQuantityAndOldTrialPreserved':True})
  finally:b.close()
 b=Bench(browser,force_2d=True);p=b.page
 try:
  p.emulate_media(reduced_motion='reduce');p.locator('[data-l3-assist=place]').click();p.wait_for_timeout(400)
  p.locator('#l3-cup').evaluate('n=>{window.qaReducedPoses=[];window.qaReducedObserver=new MutationObserver(()=>window.qaReducedPoses.push(n.getAttribute("transform")));window.qaReducedObserver.observe(n,{attributes:true,attributeFilter:["transform"]});}')
  p.locator('[data-l3-assist=align]').click();p.wait_for_function('()=>document.querySelector("#l3SimpleActions").getAttribute("aria-busy")==="false"');p.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  poses=p.evaluate('()=>{window.qaReducedObserver.disconnect();return [...new Set(window.qaReducedPoses)];}');print(json.dumps({'case':'reduced-motion','renderedDistinctPoses':poses,'mediaReduce':p.evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches')}),flush=True)
  assert len(poses)<=1,'Reduced-motion renders intermediate animated poses instead of the final state'
  s=b.wait('s.apparatusState.positions.cup.y<=70');assert not b.errors
  results.append({'case':'reduced-motion','immediateFinalPose':True,'quantityUnchanged':s['physicalState']['waterMassKg']==0})
 finally:b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True},ensure_ascii=False,indent=2)+'\n')
