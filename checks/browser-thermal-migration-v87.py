#!/usr/bin/env python3
"""Browser migration of versioned apparatus geometry; fixtures never alter a live model."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--url',default='http://127.0.0.1:4176');p.add_argument('--out',default='work/thermal-v87/migration');a=p.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
node="""import {createState,applyAction,observe,validateState} from './dist/l3/thermal-physics.js';import{newSession,newTrial,serializeSession,parseSession}from'./dist/l3/data-notebook.js';import{readingFromObservation}from'./dist/l3/measurement-engine.js';let s=createState('ice');for(const [actionType,payloadSI]of[['place-vessel',{placed:true}],['pour',{massKg:.2,target:'vessel'}],['place-probe',{placement:'water'}]])s=applyAction(s,{actionType,payloadSI}).state;const session=newSession('ice');newTrial(session,'ice',{});session.physicalState=s;session.apparatusState.positions.probe={x:450,y:300};session.trials[0].readings.push(readingFromObservation(observe(s),'37.4',{}));const text=serializeSession(session);parseSession(text,{activity:'ice',validateState:x=>validateState(x).valid});process.stdout.write(text);"""
raw=subprocess.check_output(['node','--input-type=module','-e',node],text=True);fixture=json.loads(raw);key='quanh-l3-calorimetry-ice-v1'
def hashes():return {str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [Path(__file__),Path('dist/app.js'),*sorted(Path('dist/l3').glob('*.js')),*sorted(Path('dist/l3').glob('*.css'))]}
def dl(page,selector,name):
 with page.expect_download() as d:page.locator(selector).click()
 f=out/name;d.value.save_as(str(f));return f.read_bytes()
before=hashes();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for quota in [False,True]:
  ctx=browser.new_context(viewport={'width':390 if quota else 1440,'height':1000},accept_downloads=True)
  seed='if(!localStorage.getItem("migration87-seeded")){localStorage.setItem(%s,%s);localStorage.setItem("quanh-l3-view-v1","2d");localStorage.setItem("migration87-seeded","1");}'%(json.dumps(key),json.dumps(raw))
  if quota:seed+="const save=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.includes('-pre-calibration-'))throw new DOMException('fixture','QuotaExceededError');return save.call(this,k,v);};"
  ctx.add_init_script(seed);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(a.url.rstrip('/')+'/#lab/calorimetry?l3=ice');page.locator('[data-l3-action="export-original"]').wait_for(state='visible');page.wait_for_timeout(1300)
  current_raw=page.evaluate('(k)=>localStorage.getItem(k)',key);current=json.loads(current_raw)
  assert current['trials'][0]['readings']==fixture['trials'][0]['readings'],'Historical reading may not be relabeled or changed'
  if quota:assert current_raw==raw,'Failed backup must prevent primary overwrite'
  else:
   assert current['apparatusState']['geometryVersion']=='thermal.geometry.v2'
   assert current['physicalState']['probe']['placement']=='wall','5mm sensor at x450 contacts calibrated outer wall'
   assert current['apparatusState']['positions']==fixture['apparatusState']['positions'],'Calibration must not silently shift old poses'
   backups=page.evaluate('Object.keys(localStorage).filter(k=>k.includes("-pre-calibration-")).map(k=>localStorage.getItem(k))');assert raw in backups
   page.reload();page.locator('[data-l3-action="export-original"]').wait_for(state='visible')
  original=dl(page,'[data-l3-action="export-original"]','original-'+str(quota)+'.json');assert original==raw.encode('utf-8')
  current_data=dl(page,'[data-l3-action="export-json"]','current-'+str(quota)+'.json');parsed=json.loads(current_data)
  assert parsed['apparatusState']['geometryVersion']=='thermal.geometry.v2' and parsed['physicalState']['probe']['placement']=='wall'
  assert parsed['trials'][0]['readings']==fixture['trials'][0]['readings']
  if quota:
   assert page.evaluate('(k)=>localStorage.getItem(k)',key)==raw
   with page.expect_download() as downloaded:page.locator('#l3Import').set_input_files({'name':'current.json','mimeType':'application/json','buffer':current_data})
   downloaded.value.save_as(str(out/'before-import.json'));page.wait_for_timeout(1300)
   assert json.loads(page.evaluate('(k)=>localStorage.getItem(k)',key))['apparatusState']['geometryVersion']=='thermal.geometry.v2'
  assert not errors
  results.append({'quota':quota,'oldReadingsRetained':True,'oldPoseNotShifted':True,'originalByteExact':True,'newContactReconciledFromGeometry':True,'newJsonStillExportable':True,'pageErrors':errors})
  ctx.close()
 version=browser.version;browser.close()
after=hashes();assert before==after
report={'status':'PASS','browserVersion':version,'sourceBefore':before,'sourceAfter':after,'sourceStable':True,'results':results,'scope':'Isolated persisted v1 geometry fixtures, real2D UI, byte-exact backups and instrument-contact reconciliation; no real hardware or teacher acceptance.'}
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','cases':len(results),'sourceStable':True}))
