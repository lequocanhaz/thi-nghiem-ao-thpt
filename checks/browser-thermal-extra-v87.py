#!/usr/bin/env python3
"""Additional calibrated boundary flows through public UI; no model setters."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
# Reuse only trusted repository harness definitions, never imported session data.
exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
before=source_hashes();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 b=Bench(browser,'solid');p=b.page
 try:
  p.locator('[data-l3-config="sampleMassKg"]').fill('.001');b.click('new-trial');b.wait('s.physicalState.config.solidMassKg===.001');b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
  pos=b.session()['apparatusState']['positions']['solid'];b.drag_via('tongs',[(pos['x'],100),(pos['x'],pos['y'])]);held=b.wait('s.physicalState.solid.location==="tongs"')
  assert abs(held['apparatusState']['positions']['solid']['y']-held['apparatusState']['positions']['tongs']['y']-25)<1e-8
  b.select('solid');assert not p.locator('[data-l3-action="recover-tool"]').is_visible(),'Held solid cannot recover independently of tongs'
  b.drag_via('tongs',[(pos['x'],100),(280,100),(280,280)]);b.wait('s.physicalState.solid.location==="bath"');b.step(5)
  b.drag('tongs',280,280);b.wait('s.physicalState.solid.location==="tongs"');b.drag_via('tongs',[(280,100),(410,100),(410,300)]);b.wait('s.physicalState.solid.location==="water"');b.step(2)
  held_state=b.session();sample_pos=held_state['apparatusState']['positions']['solid'];sample_location=held_state['physicalState']['solid']['location']
  b.drag_via('tongs',[(410,100),(675,100)]);b.wait('s.physicalState.scale.load!=="solid"');p.wait_for_timeout(500)
  b.drag_via('tongs',[(675,70),(540,70),(540,200)]);p.wait_for_timeout(600);after_empty=b.session()
  assert after_empty['physicalState']['solid']['location']==sample_location and after_empty['apparatusState']['positions']['solid']==sample_pos
  assert after_empty['physicalState']['scale']['load']!='solid','Empty tongs cannot weigh a remote solid'
  b.invariant();assert not b.errors;results.append({'case':'one-gram-solid','status':'PASS','heldAndTransferredWithTongs':True,'geometry':assert_actual_geometry(b),'pageErrors':b.errors[:]})
 finally:b.close()
 b=Bench(browser);p=b.page
 try:
  p.locator('[data-l3-config="waterMassKg"]').fill('.59');b.click('new-trial');b.wait('s.physicalState.config.waterMassKg===.59');b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
  b.drag_via('ice',[(575,304.03),(575,110),(410,110),(410,260)]);s=b.wait('s.physicalState.iceMassKg>.019')['physicalState']
  conditions=b.session()['trials'][-1]['conditionsSI'];assert conditions['setupChangedDuringExchange'] and abs(conditions['spillMassKg']-.01)<1e-8
  assert abs(s['waterMassKg']-.58)<1e-8 and abs(s['spillMassKg']-.01)<1e-8 and abs(s['energyOutJ']-1672)<1e-5,s
  b.invariant();assert not b.errors;results.append({'case':'floating-ice-overflow','status':'PASS','waterRetainedKg':s['waterMassKg'],'spillKg':s['spillMassKg'],'spillEnergyJ':s['energyOutJ'],'geometry':assert_actual_geometry(b),'pageErrors':b.errors[:]})
 finally:b.close()
 # A trusted persisted state immediately before the grounded-melting regression.
 node='''import{createState,applyAction,step,validateState}from'./dist/l3/thermal-physics.js';import{newSession,newTrial,serializeSession,parseSession}from'./dist/l3/data-notebook.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';let s={...createState('ice',{waterMassKg:.3,waterTempC:40,iceMassKg:.4}),apparatusGeometryVersion:'thermal.geometry.v2'};for(const[actionType,payloadSI]of[['place-vessel',{placed:true}],['pour',{massKg:.3,target:'vessel'}],['add-ice',{massKg:.4,target:'vessel'}]]){const r=applyAction(s,{actionType,payloadSI});if(!r.ok)throw Error(r.reason);s=r.state;}for(let i=0;i<180;i++)s=step(s,1);const q=newSession('ice');newTrial(q,'ice',{waterMassKg:.3,iceMassKg:.4,waterTempK:313.15});q.physicalState=s;q.apparatusState={positions:initialPositions(s),cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2'};const raw=serializeSession(q);parseSession(raw,{activity:'ice',validateState:s=>validateState(s).valid});process.stdout.write(raw);'''
 fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',node],text=True));b=Bench(browser,preloaded=fixture)
 try:
  prior=b.session()['physicalState'];b.step(10);current=b.session();s=current['physicalState'];c=current['trials'][-1]['conditionsSI']
  assert s['spillMassKg']>prior['spillMassKg'] and c['meltingSpillMassKg']>0 and c['setupChangedDuringExchange']
  assert abs(c['meltingSpillMassKg']-(s['spillMassKg']-prior['spillMassKg']))<1e-8
  b.invariant();assert not b.errors;results.append({'case':'grounded-melting-overflow','status':'PASS','spillKg':s['spillMassKg'],'dischargedEnergyJ':s['energyOutJ'],'causeRecorded':True,'pageErrors':b.errors[:]})
 finally:b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'extra-report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True,'scope':'Native UI and software WebGL; no physical hardware or teacher acceptance.'},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','cases':len(results),'sourceStable':True}))
