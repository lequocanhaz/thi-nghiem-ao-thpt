#!/usr/bin/env python3
"""An exhausted old20g session is retained; an explicit new trial supplies100g."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
node="""import{createState,applyAction,validateState}from'./dist/l3/thermal-physics.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';import{newSession,newTrial,serializeSession,parseSession}from'./dist/l3/data-notebook.js';let s={...createState('ice'),apparatusGeometryVersion:'thermal.geometry.v2'};for(const[actionType,payloadSI]of[['place-vessel',{placed:true}],['pour',{massKg:.2,target:'vessel'}],['add-ice',{massKg:.02,target:'vessel'}]]){const r=applyAction(s,{actionType,payloadSI});if(!r.ok)throw Error(r.reason);s=r.state;}delete s.icePortions;delete s.icePortionsVersion;const q=newSession('ice');newTrial(q,'ice',{iceMassKg:.02}).hypothesis='Keep this old20g investigation';q.physicalState=s;q.apparatusState={positions:initialPositions(s),icePieceMassKg:.02,cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2'};const raw=serializeSession(q);parseSession(raw,{activity:'ice',validateState:s=>validateState(s).valid});process.stdout.write(raw);"""
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',node],text=True));before=source_hashes()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 b=Bench(browser,force_2d=True,preloaded=fixture);p=b.page
 try:
  old=b.session();assert old['physicalState']['config']['iceMassKg']==.02 and old['physicalState']['iceTrayMassKg']==0
  assert old['apparatusState']['icePieceMassKg']==.02 and 'icePortions' not in old['physicalState']
  b.select('ice');p.wait_for_timeout(300);assert p.locator('[data-l3-field=ice-piece]').is_disabled()
  b.click('prepare-ice-tray');s=b.wait('s.trials.length===2&&s.physicalState.iceTrayMassKg===.1')
  assert s['trials'][0]['hypothesis']==fixture['trials'][0]['hypothesis']
  assert s['trials'][0]['finalPhysicalState']==old['physicalState']
  assert s['apparatusState']['icePieceMassKg']==.02
  p.reload();p.wait_for_selector('.l3-pilot');assert b.session()['trials']==s['trials'];assert not b.errors
  report={'status':'PASS','old20gStockAndChoicePreserved':True,'emptyTrayDisablesPieceInput':True,'explicit100gTrialPreservesPreviousHypothesisAndFinalPhysicsAfterReload':True,'pageErrors':b.errors[:],'browserVersion':browser.version}
 finally:b.close();browser.close()
after=source_hashes();assert before==after;report.update(sourceBefore=before,sourceAfter=after,sourceStable=True)
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if not k.startswith('source')},ensure_ascii=False))
