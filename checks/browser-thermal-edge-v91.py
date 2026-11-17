#!/usr/bin/env python3
"""Controller/data regressions found independently in V91; public UI, no model setters."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text()
source=source[:source.index('\nCASES=')].replace("self.page.on('dialog', lambda d: d.accept())", "self.page.on('dialog', lambda d: d.dismiss() if getattr(self,'cancel_next',False) else d.accept(getattr(self,'prompt_value','')) if d.type=='prompt' else d.accept())")
source=source.replace("json.dumps(json.dumps(preloaded,ensure_ascii=False,separators=(',',':')))", "json.dumps(preloaded if isinstance(preloaded,str) else json.dumps(preloaded,ensure_ascii=False,separators=(',',':')))")
exec(compile(source,'trusted-v87-prefix-edge-v91','exec'))

def fixture(kind):
 script="""import{createState,applyAction,validateState}from'./dist/l3/thermal-physics.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';import{planThermalPlacement}from'./dist/l3/thermal-assist.js';import{newSession,newTrial,serializeSession,parseSession}from'./dist/l3/data-notebook.js';let s={...createState('ice'),apparatusGeometryVersion:'thermal.geometry.v2'},q=newSession('ice');const kind=KIND;
 if(kind==='tilted')s=applyAction(s,{actionType:'place-vessel',payloadSI:{placed:true}}).state;
 for(let i=0;i<(kind==='full'?20:1);i++)newTrial(q,'ice',{}).hypothesis='Keep investigation '+(i+1);
 const positions=initialPositions(s);if(kind==='tilted')positions.cup=planThermalPlacement('cup','pour',{state:s,positions,angle:0}).path.at(-1);
 q.physicalState=s;q.apparatusState={positions,cupAngleRad:kind==='tilted'?100*Math.PI/180:0,camera:null,geometryVersion:'thermal.geometry.v2',icePieceMassKg:.02};const text=serializeSession(q);parseSession(text,{activity:'ice',validateState:s=>validateState(s).valid});process.stdout.write(text);""".replace('KIND',json.dumps(kind))
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',script],text=True))

def downloaded(b,action,name):
 with b.page.expect_download() as d:b.click(action)
 file=out/name;d.value.save_as(str(file));return json.loads(file.read_text())

def calculator(browser):
 b=Bench(browser,'solid',force_2d=True);p=b.page
 try:
  p.locator('#l3StudentTemperature').fill('33.4');b.click('record');b.wait('s.trials[0].readings.length===1')
  p.locator('.l3-calculation>summary').click()
  def enter(values):
   for key,value in values.items():p.locator('[data-l3-calc='+key+']').fill(value)
   b.click('calculate');p.wait_for_timeout(450)
  enter({'mw':'.2','ccal':'0','ms':'.1','tw':'20','ts':'80','tf':'40'})
  b.wait('s.trials[0].calculation?.specificHeatJPerKgK===4180')
  for change in [{'ccal':'1e308'},{'ccal':'0','ms':'5e-324'}]:
   enter(change);assert '∞' not in p.locator('#l3Calculated').inner_text();saved=downloaded(b,'export-json','calculation-rejected.json')
   assert saved['trials'][0]['calculation']['specificHeatJPerKgK']==4180
   assert saved['trials'][0]['readings'][0]['studentValueC']==33.4
  p.reload();p.wait_for_selector('#l3MainAction');assert b.session()['trials'][0]['calculation']['specificHeatJPerKgK']==4180;assert not b.errors
  return {'case':'calculator-overflow','status':'PASS','validResultRetained':4180,'manualReadingPreserved':33.4,'overflowAndUnderflowRejectedBeforeSessionWrite':True,'pageErrors':b.errors[:]}
 finally:b.close()

def tilted(browser):
 b=Bench(browser,force_2d=True,preloaded=fixture('tilted'));p=b.page
 try:
  b.click('pause');b.wait('s.physicalState.waterMassKg>.01')
  assert p.locator('#l3MainAction').inner_text()=='Dừng rót'
  p.keyboard.press('Escape');p.wait_for_timeout(450);mass=b.session()['physicalState']['waterMassKg'];p.wait_for_timeout(650)
  assert b.session()['physicalState']['waterMassKg']==mass
  b.click('pause');b.wait('s.physicalState.waterMassKg>'+repr(mass+.005));p.locator('#l3MainAction').click();p.wait_for_timeout(450);mass=b.session()['physicalState']['waterMassKg'];p.wait_for_timeout(650)
  assert b.session()['physicalState']['waterMassKg']==mass;assert not b.errors;b.invariant()
  return {'case':'restored-tilted-cup','status':'PASS','actualPourHasStopLabel':True,'EscapeAndMainStopPreserveTransferredWater':True,'pageErrors':b.errors[:]}
 finally:b.close()

def rollover(browser,quota=False):
 original=fixture('full');b=Bench(browser,force_2d=True,preloaded=original);p=b.page
 try:
  p.wait_for_timeout(900);before=p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)
  b.cancel_next=True;b.click('reset');p.wait_for_timeout(400);assert p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)==before;assert len(b.session()['trials'])==20;b.cancel_next=False
  if quota:
   p.evaluate("key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith(key+'-archive-'))throw new DOMException('Quota exceeded','QuotaExceededError');return original.call(this,k,v);};}",b.storage_key)
  b.click('reset');p.wait_for_timeout(1000)
  if quota:
   assert p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)==before;assert len(b.session()['trials'])==20
   exported=downloaded(b,'export-json','rollover-quota-retained.json');assert [t['hypothesis'] for t in exported['trials']]==[t['hypothesis'] for t in original['trials']]
  else:
   fresh=b.wait('s.trials.length===1');assert fresh['sessionId']!=original['sessionId']
   p.locator('.l3-session-archives>summary').click();archived=downloaded(b,'export-archive','archived-twenty-trials.json')
   assert len(archived['trials'])==20;assert [t['hypothesis'] for t in archived['trials']]==[t['hypothesis'] for t in original['trials']]
   p.reload();p.wait_for_selector('#l3MainAction');assert len(b.session()['trials'])==1;assert p.locator('.l3-session-archives').count()==1
  assert not b.errors
  return {'case':'rollover-quota' if quota else 'rollover-cancel-archive','status':'PASS','cancelKeepsPrimaryByteExact':True,'oldTwentyTrialsPreserved':True,'quotaKeepsCurrentSession' if quota else 'freshSessionAndDownloadArchiveAfterReload':True,'pageErrors':b.errors[:]}
 finally:b.close()

def large_fixture(target,compact):
 script="""import{createState,validateState,observe}from'./dist/l3/thermal-physics.js';import{readingFromObservation}from'./dist/l3/measurement-engine.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';import{newSession,newTrial,parseSession}from'./dist/l3/data-notebook.js';import{makeEvent}from'./dist/l3/interaction-core.js';const state={...createState('ice'),apparatusGeometryVersion:'thermal.geometry.v2'},q=newSession('ice'),t=newTrial(q,'ice',{});t.analysis='Preserve this large investigation exactly';t.readings.push(readingFromObservation(observe(state),'33.4',{}));for(let i=0;i<3000;i++)t.events.push(makeEvent({sessionId:q.sessionId,simTimeS:0,actionType:'audit-note',targetId:'bench',payloadSI:{text:''},accepted:true}));q.physicalState=state;q.apparatusState={positions:initialPositions(state),cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2',icePieceMassKg:.02};const raw=()=>JSON.stringify(q,null,COMPACT?undefined:2),target=TARGET,pad=Math.floor((target-raw().length)/3000);if(pad<0)throw Error('fixture too large');for(const e of t.events)e.payloadSI.text='x'.repeat(pad);t.events.at(-1).payloadSI.text+='x'.repeat(target-raw().length);const text=raw();if(text.length!==target)throw Error('fixture size');parseSession(text,{activity:'ice',validateState:s=>validateState(s).valid});process.stdout.write(text);""".replace('TARGET',str(target)).replace('COMPACT','true' if compact else 'false')
 return subprocess.check_output(['node','--input-type=module','-e',script],text=True)

def budget(browser):
 results=[]
 for size,compact in [(1503021,False),(1997000,True)]:
  raw=large_fixture(size,compact);original=json.loads(raw);b=Bench(browser,force_2d=True,preloaded=raw);p=b.page
  try:
   p.wait_for_timeout(700)
   assert p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)==raw
   field=p.locator('[data-l3-note=analysis]');assert not field.is_editable();assert field.input_value()==original['trials'][0]['analysis']
   assert p.locator('[data-l3-action=record]').is_disabled();assert p.locator('[data-l3-exclude]').is_disabled()
   with p.expect_download() as download:b.click('export-json')
   file=out/f'large-{size}.json';download.value.save_as(str(file));assert file.read_text()==raw
   assert p.locator('#l3MainAction').get_attribute('data-l3-assist')=='restart'
   p.locator('#l3MainAction').click();p.wait_for_timeout(1000);fresh=b.wait('s.trials.length===1&&s.sessionId!=='+json.dumps(original['sessionId']))
   assert fresh['sessionId']!=original['sessionId'];assert p.locator('[data-l3-note=analysis]').is_editable()
   p.locator('.l3-session-archives>summary').click()
   with p.expect_download() as download:b.click('export-archive')
   archive=out/f'archive-large-{size}.json';download.value.save_as(str(archive));assert archive.read_text()==raw
   p.locator('[data-l3-note=analysis]').fill('Fresh session is writable');b.wait('s.trials[0].analysis==="Fresh session is writable"')
   p.reload();p.wait_for_selector('#l3MainAction');assert b.session()['trials'][0]['analysis']=='Fresh session is writable';assert not b.errors
   results.append({'initialChars':size,'compactInput':compact,'readOnlyAndExportAndArchiveByteExact':True,'newSessionWritableAfterReload':True,'pageErrors':b.errors[:]})
  finally:b.close()
 return {'case':'large-session-budget','status':'PASS','results':results}

def readonly(browser):
 import csv
 q=json.loads(large_fixture(1503021,False));q['apparatusState']['positions']['cup']['y']=70
 raw=json.dumps(q,ensure_ascii=False,indent=2);b=Bench(browser,force_2d=True,preloaded=raw);p=b.page
 try:
  p.wait_for_timeout(700);before=p.locator('[data-l3-exclude]').inner_text()
  assert p.locator('[data-l3-exclude]').is_disabled()
  p.locator('#l3Adjustments>summary').click();b.select('cup');p.wait_for_timeout(150)
  assert p.locator('#l3CupAngle').is_disabled()
  pose=p.locator('#l3-cup').get_attribute('transform');b.prompt_value='This edit must be blocked'
  # Fault injection verifies the controller guards as well as disabled controls.
  p.locator('[data-l3-exclude]').dispatch_event('click')
  p.locator('[data-l3-action=recover-cup]').dispatch_event('click');p.wait_for_timeout(400)
  assert p.locator('[data-l3-exclude]').inner_text()==before
  assert p.locator('#l3-cup').get_attribute('transform')==pose
  assert p.evaluate('(k)=>localStorage.getItem(k)',b.storage_key)==raw
  with p.expect_download() as download:b.click('export-csv')
  file=out/'readonly-rows.csv';download.value.save_as(str(file));rows=list(csv.DictReader(file.read_text(encoding='utf-8-sig').splitlines()))
  assert len(rows)==1 and rows[0]['excluded_reason']=='' and float(rows[0]['display_temperature_C'])==33.4
  assert not b.errors
  return {'case':'read-only-mutation-guards','status':'PASS','excludeAndTiltDisabled':True,'forcedClickCannotChangeReadingOrPose':True,'CSVAndPrimaryRetainOriginalData':True,'pageErrors':b.errors[:]}
 finally:b.close()

cases={'calculator':calculator,'tilted':tilted,'rollover':rollover,'quota':lambda browser:rollover(browser,True),'budget':budget,'readonly':readonly}
selected=args.only.split(',') if args.only else list(cases);results=[];before=source_hashes()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 try:
  for key in selected:
   result=cases[key](browser);results.append(result);print(json.dumps(result,ensure_ascii=False),flush=True)
  version=browser.version
 finally:browser.close()
after=source_hashes();assert before==after
(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True,'scope':'Actual Chromium HTML controls and local-storage fault injection; no physical device or teacher acceptance.'},ensure_ascii=False,indent=2)+'\n')
