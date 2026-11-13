#!/usr/bin/env python3
"""Independent Chromium UI journeys for the two calorimetry pilots.
Runs real DOM pointer/keyboard controls; reads persisted sessions as evidence.
Does not call controller/solver APIs or certify teachers/physical devices.
"""
import argparse
import hashlib
import subprocess
from datetime import datetime, timezone
import csv
import io
import json
import math
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--url',default='http://127.0.0.1:4173')
parser.add_argument('--out',default='work/level3-v84/browser')
parser.add_argument('--chromium',default='/usr/bin/chromium')
parser.add_argument('--only',default='',help='Comma-separated case names')
args=parser.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
LEGACY={'calorimetry':{'state':{'hot':80,'cold':20,'mHot':.3,'mCold':.5},'rows':[{'values':[80,20,42.5,47025,47025,.3,.5],'s':{'hot':80,'cold':20,'mHot':.3,'mCold':.5},'d':{'finalTemp':42.5}}],'notes':'Ghi chép phiên cũ: giữ nguyên á','prediction':'Nước cân bằng trong khoảng hai nhiệt độ'},'ohm':{'state':{'u':4,'r':10},'rows':[{'values':[4,10,.4,10,1.6]}],'notes':'Dữ liệu bài khác'}}
LEGACY_RAW=json.dumps(LEGACY,ensure_ascii=False,separators=(',',':'))
results=[]
SOURCE_FILES=['dist/app.js','dist/l3/thermal-pilot.js','dist/l3/thermal-physics.js','dist/l3/apparatus-registry.js','dist/l3/interaction-core.js','dist/l3/data-notebook.js','dist/l3/measurement-engine.js','dist/l3/thermal-protocol.js','dist/l3/thermal-view.js','dist/l3/thermal.css']
def source_hashes():return {f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in SOURCE_FILES}
BASE_HEAD=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()

class Bench:
 def __init__(self,browser,activity='ice',width=1440,height=1100):
  self.activity=activity;self.storage_key='quanh-l3-calorimetry-'+activity+'-v1';self.errors=[]
  self.context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<600,accept_downloads=True)
  self.context.add_init_script('''if(!localStorage.getItem('qa-level3-seeded')){localStorage.setItem('thpt-lab-v1',%s);localStorage.setItem('thpt-ui-v3',JSON.stringify({renderer:'diagram',motion:false}));localStorage.setItem('qa-level3-seeded','1');localStorage.setItem('quanh-l3-view-v1','2d');}'''%json.dumps(LEGACY_RAW))
  self.page=self.context.new_page();self.page.on('pageerror',lambda e:self.errors.append(str(e)))
  self.page.on('dialog',lambda d:d.accept('Đọc sớm; giữ dữ liệu gốc.') if d.type=='prompt' else d.accept())
  self.page.goto(args.url.rstrip('/')+'/#lab/calorimetry?l3='+activity)
  self.page.wait_for_selector('#l3Stage');self.page.wait_for_function('(k)=>!!localStorage.getItem(k)',arg=self.storage_key)
  self.page.evaluate('window.__qaStage=document.querySelector("#l3Stage")')
 def session(self):return self.page.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',self.storage_key)
 def wait(self,predicate):
  self.page.wait_for_function('(x)=>{const s=JSON.parse(localStorage.getItem(x.key)||"null");return s&&('+predicate+');}',arg={'key':self.storage_key},timeout=10000)
  return self.session()
 def click(self,action):
  if action in ['empty-pan','tare']:self.page.locator('.l3-tool-list [data-l3-tool="scale"]').click()
  self.page.locator('[data-l3-action="'+action+'"]').click()
 def screen(self,x,y):return self.page.locator('#l3Stage').evaluate('(s,p)=>{const v=s.createSVGPoint();v.x=p.x;v.y=p.y;const q=v.matrixTransform(s.getScreenCTM());return {x:q.x,y:q.y}}',{'x':x,'y':y})
 def origin(self,id):return self.page.locator('#l3-'+id).evaluate('(n)=>{const p=n.ownerSVGElement.createSVGPoint();p.x=0;p.y=0;const q=p.matrixTransform(n.getScreenCTM());return {x:q.x,y:q.y}}')
 def drag(self,id,x,y):
  self.page.locator('.l3-tool-list [data-l3-tool="'+id+'"]').click()
  self.page.locator('#l3Stage').scroll_into_view_if_needed();start=self.origin(id);end=self.screen(x,y)
  self.page.mouse.move(start['x'],start['y']);self.page.mouse.down();self.page.mouse.move(end['x'],end['y'],steps=12);self.page.mouse.up()
 def key(self,id,key):self.page.locator('#l3-'+id).focus();self.page.locator('#l3-'+id).press(key)
 def step(self,n=1):
  before=self.session()['physicalState']['timeS']
  for _ in range(n):self.click('step')
  return self.wait('s.physicalState.timeS>='+repr(before+n-.001))
 def set_speed(self,n=20):self.page.locator('[data-l3-field="speed"]').select_option(str(n))
 def pour(self):
  self.key('calorimeter','Enter');self.wait('s.physicalState.vesselPlaced')
  self.set_speed();self.drag('cup',410,130);self.key('cup','r')
  self.wait('s.physicalState.cupWaterMassKg<1e-8&&s.physicalState.waterMassKg>0.1999')
  self.click('step');self.page.locator('#l3CupAngle').fill('0');self.page.locator('#l3CupAngle').dispatch_event('input')
  self.wait('s.apparatusState.cupAngleRad===0')
 def invariant(self):
  s=self.session()['physicalState'];assert abs(s['massResidualKg'])<1e-8,s;assert abs(s['energyResidualJ'])<1e-5,s
 def unchanged_legacy(self):assert self.page.evaluate('localStorage.getItem("thpt-lab-v1")')==LEGACY_RAW
 def screenshot(self,name):self.page.screenshot(path=str(out/(name+'.png')),full_page=True)
 def close(self):
  if sys.exc_info()[0]:
   self.screenshot('failure-'+self.activity)
   (out/('failure-'+self.activity+'.json')).write_text(json.dumps({'session':self.session(),'pageErrors':self.errors,'statusText':self.page.locator('#l3Status').inner_text()},ensure_ascii=False,indent=2)+'\n')
  self.context.close()

def ice_journey(browser):
 b=Bench(browser);p=b.page
 try:
  assert p.locator('#l3StudentTemperature').input_value()==''
  assert '—' in p.locator('#l3ProbeReading').inner_text()
  assert all(v=='' for v in p.locator('[data-l3-mass]').evaluate_all('(nodes)=>nodes.map(n=>n.value)'))
  b.pour();b.invariant();b.unchanged_legacy()
  assert p.evaluate('window.__qaStage===document.querySelector("#l3Stage")')
  b.drag('probe',410,180);b.wait('s.physicalState.probe.placement==="air"')
  p.locator('#l3StudentTemperature').fill('77.7');b.click('record')
  s=b.wait('s.trials[0].readings.length===1');row=s['trials'][0]['readings'][0]
  assert not row['valid'] and row['studentValueC']==77.7 and row['measuredValue'] is None,row
  b.click('empty-pan');b.wait('s.physicalState.scale.load==="pan"')
  b.click('tare');b.wait('Math.abs(s.physicalState.scale.tareKg-0.005)<1e-8')
  b.drag('ice',675,105);b.wait('s.physicalState.scale.load==="ice"');assert '20' in p.locator('#l3ScaleReading').inner_text()
  b.drag('ice',410,260);s=b.wait('s.physicalState.iceMassKg>0.0199');assert abs(s['physicalState']['iceTrayMassKg'])<1e-8
  b.drag('probe',410,315);b.wait('s.physicalState.probe.placement==="water"');b.step(3)
  assert '—' not in p.locator('#l3ProbeReading').inner_text()
  for i in range(5):
   b.step();p.locator('#l3StudentTemperature').fill(str(31.1-i*.2));b.click('record')
  s=b.wait('s.trials[0].readings.length===6');rows=s['trials'][0]['readings'][1:]
  assert len({r['simTimeS'] for r in rows})==5 and all(r['valid'] for r in rows)
  assert rows[0]['studentValueC']==31.1 and abs(rows[0]['studentValue']-304.25)<1e-8
  assert any(abs(r['studentValue']-r['measuredValue'])>.01 for r in rows)
  assert p.locator('#l3Graph circle').count()==5
  p.locator('[data-l3-note="hypothesis"]').fill('Đá làm nước nguội.');p.locator('[data-l3-note="analysis"]').fill('Dùng năm số đo theo thời gian.');p.locator('[data-l3-note="conclusion"]').fill('Có độ trễ đầu dò, chưa trộn đều.')
  b.wait('s.trials[0].conclusion.length>0');b.invariant();b.unchanged_legacy();b.screenshot('ice-manual-readings')
  return {'readings':len(s['trials'][0]['readings']),'validReadings':5,'manualMismatchRetained':True,'invalidAirReadingRetained':True,'legacyBytesUnchanged':True,'pageErrors':b.errors}
 finally:b.close()

def solid_journey(browser):
 b=Bench(browser,'solid');p=b.page
 try:
  b.pour();b.drag('solid',410,300);s=b.wait('s.trials[0].events.some(e=>e.actionType==="move-solid"&&!e.accepted&&e.reason==="use-tongs")')
  assert s['physicalState']['solid']['location']=='tray'
  b.drag('tongs',260,390);b.wait('s.physicalState.solid.location==="tongs"')
  b.drag('tongs',140,280);s=b.wait('s.physicalState.solid.location==="bath"');initial=s['physicalState']['solid']['tempC']
  s=b.step(8);hot=s['physicalState']['solid']['tempC'];assert initial<hot<90,(initial,hot)
  b.drag('probe',185,300);b.wait('s.physicalState.probe.placement==="bath"');b.step(2)
  assert '—' not in p.locator('#l3ProbeReading').inner_text()
  b.drag('tongs',140,280);b.wait('s.physicalState.solid.location==="tongs"')
  b.drag('tongs',410,300);s=b.wait('s.physicalState.solid.location==="water"');assert s['physicalState']['solid']['tempC']>=hot
  b.drag('probe',410,315);b.wait('s.physicalState.probe.placement==="water"');s=b.step(4)
  assert s['physicalState']['waterTempC']>20
  for i in range(5):
   b.step();p.locator('#l3StudentTemperature').fill(str(22+i*.2));b.click('record')
  s=b.wait('s.trials[0].readings.length===5');assert all(r['valid'] for r in s['trials'][0]['readings'])
  p.locator('.l3-calculation summary').click()
  for key,value in {'mw':'.2','ccal':'0','ms':'.1','tw':'20','ts':'60','tf':'24'}.items():
   field=p.locator('[data-l3-calc="'+key+'"]');assert field.input_value()=='';field.fill(value)
  b.click('calculate');s=b.wait('!!s.trials[0].calculation');assert abs(s['trials'][0]['calculation']['specificHeatJPerKgK']-928.8888888888888)<1e-8
  b.invariant();b.unchanged_legacy();assert not b.errors;b.screenshot('solid-tongs-bath-water')
  return {'coldSampleC':initial,'heatedSampleC':hot,'finiteHeating':True,'directHandTransferRejected':True,'readings':5,'calculationUsesStudentInputs':True,'legacyBytesUnchanged':True,'pageErrors':b.errors}
 finally:b.close()

def data_roundtrip(browser):
 b=Bench(browser);p=b.page
 try:
  b.pour();b.drag('ice',410,260);b.wait('s.physicalState.iceMassKg>0');b.drag('probe',410,315);b.wait('s.physicalState.probe.placement==="water"');b.step(2)
  b.click('record');b.wait('s.trials[0].readings.length===0')
  p.locator('#l3StudentTemperature').fill('999');b.click('record');b.wait('s.trials[0].readings.length===0')
  for key,value in {'water':'199','sample':'21'}.items():
   field=p.locator('[data-l3-mass="'+key+'"]');assert field.input_value()=='';field.fill(value)
  for value in ['77.7','31.3','30.2']:
   b.step();p.locator('#l3StudentTemperature').fill(value);b.click('record')
  p.locator('[data-l3-note="hypothesis"]').fill('Đá làm nước nguội.');p.locator('[data-l3-note="conclusion"]').fill('Giữ số đã đọc kể cả sai.');s=b.wait('s.trials[0].readings.length===3&&s.trials[0].conclusion.length>0')
  assert s['trials'][0]['readings'][0]['studentMassesKg']=={'water':.199,'sample':.021}
  assert abs(s['trials'][0]['conditionsSI']['waterMassKg']-.2)<1e-8 and abs(s['trials'][0]['conditionsSI']['iceMassKg']-.02)<1e-8
  p.locator('[data-l3-exclude="0:0"]').click();s=b.wait('!!s.trials[0].readings[0].excludedReason');assert len(s['trials'][0]['readings'])==3 and p.locator('#l3Graph circle').count()==2
  before=s['trials'];time=s['physicalState']['timeS'];b.step(3);s=b.session();assert len(s['trials'][0]['readings'])==3 and len(s['trials'][0]['trace'])>0
  b.click('new-trial');s=b.wait('s.trials.length===2');assert s['trials'][0]['readings']==before[0]['readings'];assert s['physicalState']['waterMassKg']==0
  with p.expect_download() as info:b.click('export-json')
  download=info.value;json_path=out/'roundtrip-L3.json';download.save_as(json_path);exported=json.loads(json_path.read_text())
  assert exported['schemaVersion']=='lab.session.v3' and len(exported['trials'])==2
  with p.expect_download() as info:b.click('export-csv')
  csv_path=out/'roundtrip-L3.csv';info.value.save_as(csv_path);rows=list(csv.DictReader(io.StringIO(csv_path.read_text(encoding='utf-8-sig'))));assert len([r for r in rows if r.get('source','student')=='student'])==3
  assert abs(float(rows[0]['student_temperature_K'])-350.85)<1e-8 and rows[0]['method']=='manual';assert rows[0]['excluded_reason']=='Đọc sớm; giữ dữ liệu gốc.';assert float(rows[0]['student_water_mass_kg'])==.199 and float(rows[0]['student_sample_mass_kg'])==.021
  p.reload();p.wait_for_selector('#l3Stage');s=b.wait('s.trials.length===2');assert s['trials']==exported['trials']
  assert p.locator('#l3StudentTemperature').input_value()==''
  b.click('new-trial');b.wait('s.trials.length===3')
  p.locator('#l3Import').set_input_files(json_path);s=b.wait('s.trials.length===2');assert s['trials']==exported['trials'];assert s['physicalState']==exported['physicalState']
  classic={'schema':'thpt.session.v1','id':'calorimetry','rows':[{'values':[80,20,42.5,47025,47025]}],'notes':'Bản cũ á','state':{'hot':80,'cold':20,'mHot':.3,'mCold':.5}}
  classic_path=out/'classic.json';classic_path.write_text(json.dumps(classic,ensure_ascii=False))
  p.locator('#l3Import').set_input_files(classic_path);s=b.wait('s.legacySessions.length===1');assert s['legacySessions'][0]==classic and s['trials']==exported['trials']
  p.locator('#l3Legacy summary').click();assert '1 dòng cũ' in p.locator('#l3Legacy').inner_text()
  with p.expect_download() as info:p.locator('[data-l3-legacy="0"]').click()
  restored=out/'classic-restored.json';info.value.save_as(restored);assert json.loads(restored.read_text())==classic
  b.unchanged_legacy();assert not b.errors;b.screenshot('data-roundtrip')
  return {'trials':2,'manualRows':3,'autoTraceSeparate':True,'misreadMassesRetainedSeparately':True,'excludedPointRetainsOriginal':True,'blankAndOutOfRangeRejected':True,'jsonRoundtrip':True,'csvRowValuesRetained':True,'reloadRestores':True,'legacyImportSeparate':True,'legacyStorageBytesUnchanged':True,'pageErrors':b.errors}
 finally:b.close()

def cancel_and_hold(browser):
 b=Bench(browser);p=b.page
 try:
  b.key('calorimeter','Enter');b.wait('s.physicalState.vesselPlaced');b.set_speed()
  p.locator('#l3Stage').scroll_into_view_if_needed()
  p.evaluate('document.querySelector("#l3Stage").addEventListener("pointerdown",e=>window.__qaPointerId=e.pointerId,true)')
  def start_move():
   start=b.origin('cup');end=b.screen(300,130);p.mouse.move(start['x'],start['y']);p.mouse.down();p.mouse.move(end['x'],end['y'],steps=8)
  start_move();p.evaluate('document.querySelector("#l3Stage").dispatchEvent(new PointerEvent("pointercancel",{pointerId:window.__qaPointerId,bubbles:true}))');p.mouse.up()
  s=b.wait('Math.abs(s.apparatusState.positions.cup.x-120)<0.01&&s.apparatusState.cupAngleRad===0');assert s['physicalState']['cupWaterMassKg']==.2
  start_move();p.evaluate('document.querySelector("#l3-cup").releasePointerCapture(window.__qaPointerId)');p.mouse.up();b.wait('Math.abs(s.apparatusState.positions.cup.x-120)<0.01')
  b.pour();s=b.session();t=s['physicalState']['timeS'];mass=s['physicalState']['waterMassKg'];p.wait_for_timeout(1200);s=b.session();assert abs(s['physicalState']['timeS']-t)<1e-7 and s['physicalState']['waterMassKg']==mass
  b.invariant();b.unchanged_legacy();assert not b.errors
  return {'pointerCancelFixtureRestoresPosition':True,'lostPointerCaptureRestoresPosition':True,'pausedStateHolds':True,'lifecycleScope':'Real Chromium mouse down/move; pointercancel event injected, lost capture released through browser API; not physical touch hardware','pageErrors':b.errors}
 finally:b.close()

def handle_and_stir(browser):
 b=Bench(browser);p=b.page
 try:
  b.key('calorimeter','Enter');b.wait('s.physicalState.vesselPlaced');b.set_speed();b.drag('cup',410,130)
  p.locator('.l3-tool-list [data-l3-tool="cup"]').click();p.locator('#l3Stage').scroll_into_view_if_needed()
  start=b.screen(498,175);end=b.screen(415,229);p.mouse.move(start['x'],start['y']);p.mouse.down();p.mouse.move(end['x'],end['y'],steps=16);p.mouse.up()
  b.wait('s.physicalState.cupWaterMassKg<1e-8&&s.physicalState.waterMassKg>0.1999');b.click('step');p.locator('#l3CupAngle').fill('0');p.locator('#l3CupAngle').dispatch_event('input');b.wait('s.apparatusState.cupAngleRad===0')
  b.drag('ice',280,400);s=b.wait('s.trials[0].events.some(e=>e.actionType==="add-ice"&&!e.accepted)');assert s['physicalState']['iceMassKg']==0 and abs(s['physicalState']['iceTrayMassKg']-.02)<1e-8
  b.drag('ice',410,260);b.wait('s.physicalState.iceMassKg>0')
  b.drag('probe',328,315);b.wait('s.physicalState.probe.placement==="wall"');assert '—' in p.locator('#l3ProbeReading').inner_text()
  b.drag('probe',410,180);b.wait('s.physicalState.probe.placement==="air"');assert '—' in p.locator('#l3ProbeReading').inner_text()
  b.drag('probe',460,320);b.wait('s.physicalState.probe.placement==="water"')
  b.drag('stirrer',720,340);b.click('stir');s=b.session();assert s['physicalState']['mixingIntensity']==0
  b.drag('stirrer',430,305);p.locator('#l3Stage').scroll_into_view_if_needed();start=b.origin('stirrer');p.mouse.move(start['x'],start['y']);p.mouse.down()
  for i in range(1,33):
   a=2*math.pi*i/32;point=b.screen(410+20*math.cos(a),305+20*math.sin(a));p.mouse.move(point['x'],point['y'])
  p.mouse.up();s=b.wait('s.physicalState.mixingIntensity>0');b.click('step');b.invariant();b.unchanged_legacy();assert not b.errors;b.screenshot('handle-and-circular-stir')
  return {'nativeRotationHandlePours':True,'outsideIceNoTransfer':True,'wallAndAirInvalid':True,'outsideStirNoEffect':True,'circularPointerStirCausal':True,'mixingIntensity':s['physicalState']['mixingIntensity'],'pageErrors':b.errors}
 finally:b.close()

def malformed_import(browser):
 b=Bench(browser);p=b.page
 try:
  with p.expect_download() as info:b.click('export-json')
  original=out/'before-malformed.json';info.value.save_as(original);bad=json.loads(original.read_text());bad['mode']='assessment';bad['trials'][0]['hypothesis']=42
  filename=out/'malformed.json';filename.write_text(json.dumps(bad));p.locator('#l3Import').set_input_files(filename);p.wait_for_timeout(1000)
  s=b.session();assert isinstance(s['trials'][0]['hypothesis'],str),'Malformed hypothesis was accepted; assessment actions call .trim()'
  assert 'Không nhập phiên' in p.locator('#l3Status').inner_text()
  b.key('calorimeter','Enter');b.wait('s.physicalState.vesselPlaced');assert not b.errors;b.unchanged_legacy()
  return {'malformedImportRejected':True,'liveSessionRetained':True,'usableAfterRejection':True,'pageErrors':b.errors}
 finally:b.close()

def responsive_mobile(browser):
 results=[]
 for width,height in [(320,568),(390,844),(844,390)]:
  b=Bench(browser,width=width,height=height);p=b.page
  try:
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,p.evaluate('document.documentElement.scrollWidth'))
   b.pour();b.drag('ice',410,260);b.wait('s.physicalState.iceMassKg>0');b.drag('probe',410,315);b.wait('s.physicalState.probe.placement==="water"');b.step()
   p.locator('#l3StudentTemperature').fill('32.1');b.click('record');b.wait('s.trials[0].readings.length===1')
   assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
   assert p.locator('#l3StudentTemperature').input_value()=='32.1'
   minimum=p.locator('.l3-pilot button').evaluate_all('(nodes)=>Math.min(...nodes.filter(n=>n.getClientRects().length).map(n=>n.getBoundingClientRect().height))');assert minimum>=43.9,(width,minimum)
   b.invariant();b.unchanged_legacy();assert not b.errors;b.screenshot('mobile-'+str(width))
   results.append({'viewport':[width,height],'journey':'pointer drag + keyboard rotate + manual record','bodyOverflow':False,'minButtonHeight':minimum,'pageErrors':b.errors})
  finally:b.close()
 return {'viewports':results,'scope':'Chromium viewport and pointer/keyboard automation; no real phone or on-screen keyboard evidence'}

def solid_weigh_pickup(browser):
 b=Bench(browser,'solid');p=b.page
 try:
  b.drag('solid',675,105);b.wait('s.physicalState.scale.load==="solid"');assert '100' in p.locator('#l3ScaleReading').inner_text()
  b.drag('tongs',675,130);b.wait('s.physicalState.solid.location==="tongs"')
  b.drag('tongs',140,280);b.wait('s.physicalState.solid.location==="bath"')
  assert '100' not in p.locator('#l3ScaleReading').inner_text(),'Removed sample still shown on balance'
  b.invariant();assert not b.errors
  return {'weighedSolidThenPickedWithTongs':True,'scaleClearedAfterRemoval':True,'pageErrors':b.errors}
 finally:b.close()

def insufficient_heat_repeat(browser):
 b=Bench(browser);p=b.page
 try:
  p.locator('[data-l3-config="waterTempC"]').fill('20');p.locator('[data-l3-config="sampleMassKg"]').fill('.1');b.click('new-trial');b.wait('s.trials.length===2')
  for index,pieces in [(1,5),(2,3)]:
   if index==2:
    p.locator('[data-l3-config="sampleMassKg"]').fill('.06');b.click('new-trial');b.wait('s.trials.length===3')
   p.locator('[data-l3-note="hypothesis"]').fill('Với 20°C và đủ đá, dự đoán còn đá sau trao đổi; giữ lượng nước và bình.')
   b.pour()
   for _ in range(pieces):b.drag('ice',410,260)
   b.wait('Math.abs(s.trials.at(-1).conditionsSI.iceMassKg-'+repr(.02*pieces)+')<1e-8')
   b.drag('probe',460,315);b.wait('s.physicalState.probe.placement==="water"')
   b.drag('stirrer',430,305);b.key('stirrer','Space');b.step(3)
   for i in range(5 if index==1 else 2):
    s=b.step(2);value=p.locator('#l3ProbeReading').inner_text().replace('°C','').strip().replace(',','.');p.locator('#l3StudentTemperature').fill(value);b.click('record')
   s=b.wait('s.trials.at(-1).readings.length==='+str(5 if index==1 else 2));b.invariant()
   assert s['physicalState']['iceMassKg']>0
   assert s['physicalState']['waterTempC']>=0
   if index==1:
    assert s['physicalState']['iceMassKg']>=.1-.2*4180*20/334000-1e-7
    observed={'timeS':s['physicalState']['timeS'],'waterTempC':s['physicalState']['waterTempC'],'iceRemainingKg':s['physicalState']['iceMassKg'],'idealEquilibriumIceLowerBoundKg':.1-.2*4180*20/334000,'scope':'Finite-time UI sample with independent energy bound; not an equilibrium-convergence claim'}
    b.screenshot('insufficient-heat-five-readings')
  p.locator('#l3Protocol details').nth(1).locator('summary').click();evidence=p.locator('#l3Evidence li').all_inner_texts();assert evidence[3].startswith('✓'),evidence
  assert len(s['trials'][1]['readings'])==5 and len(s['trials'][2]['readings'])==2
  assert all(abs(s['trials'][i]['conditionsSI']['waterTempK']-293.15)<1e-8 for i in [1,2])
  assert abs(s['trials'][1]['conditionsSI']['waterMassKg']-s['trials'][2]['conditionsSI']['waterMassKg'])<1e-8
  assert s['trials'][1]['conditionsSI']['mixingIntensity']==s['trials'][2]['conditionsSI']['mixingIntensity']
  b.unchanged_legacy();assert not b.errors;b.screenshot('insufficient-heat-controlled-repeat')
  return {'finiteTimeN02':observed,'baselineManualReadings':5,'repeatManualReadings':2,'controlledRepeatRecognized':True,'oneCatalogId':'calorimetry','pageErrors':b.errors}
 finally:b.close()

def activity_switch_retains_sessions(browser):
 b=Bench(browser);p=b.page
 try:
  p.locator('[data-l3-note="hypothesis"]').fill('Dự đoán riêng hoạt động nước–đá.');p.locator('#l3StudentTemperature').fill('66.6');b.click('record');original=b.wait('s.trials[0].readings.length===1')
  p.locator('.l3-activity-switch a[href$="solid"]').click();p.wait_for_selector('.l3-pilot[data-l3-activity="solid"]');p.wait_for_function('!!localStorage.getItem("quanh-l3-calorimetry-solid-v1")')
  other=p.evaluate('JSON.parse(localStorage.getItem("quanh-l3-calorimetry-solid-v1"))');assert other['catalogId']=='calorimetry' and other['activity']=='solid' and not other['trials'][0]['readings']
  p.locator('[data-l3-note="hypothesis"]').fill('Dự đoán riêng vật rắn.');p.locator('.l3-activity-switch a[href$="ice"]').click();p.wait_for_selector('.l3-pilot[data-l3-activity="ice"]')
  restored=b.wait('s.trials[0].readings.length===1');assert restored['trials']==original['trials'];assert restored['sessionId']==original['sessionId']
  assert p.locator('[data-l3-note="hypothesis"]').input_value()=='Dự đoán riêng hoạt động nước–đá.'
  b.unchanged_legacy();assert not b.errors
  return {'catalogId':'calorimetry','activities':['ice','solid'],'separateSessions':True,'activityRoundtripRetainsData':True,'legacyBytesUnchanged':True,'pageErrors':b.errors}
 finally:b.close()

def touch_camera_and_hit_targets(browser):
 b=Bench(browser,width=390,height=844);p=b.page
 try:
  p.locator('#l3Stage').scroll_into_view_if_needed();before=b.session();initial=p.locator('#l3Stage').get_attribute('viewBox');cdp=b.context.new_cdp_session(p)
  def points(coords):return [{'x':v['x'],'y':v['y'],'id':i,'radiusX':3,'radiusY':3,'force':1} for i,v in enumerate(coords)]
  a=b.screen(240,430);c=b.screen(560,430);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points([a,c])})
  a2=b.screen(200,430);c2=b.screen(600,430);cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':points([a2,c2])});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  s=b.wait('s.apparatusState.camera&&s.apparatusState.camera.width<790');first=s['apparatusState']['camera'];assert first['width']>=400
  a=b.screen(240,430);c=b.screen(560,430);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points([a,c])})
  shifted=[{'x':v['x']+10,'y':v['y']+3} for v in [a,c]];cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':points(shifted)});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  s=b.wait('s.apparatusState.camera&&Math.abs(s.apparatusState.camera.x-'+repr(first['x'])+')>1');assert s['physicalState']==before['physicalState'];assert s['apparatusState']['positions']==before['apparatusState']['positions']
  saved_camera=s['apparatusState']['camera']
  start=b.origin('cup');other=b.screen(560,430);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':points([start,other])});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':points([start,{'x':other['x']+15,'y':other['y']}])});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert all(abs(a-saved_camera[k])<1e-6 for a,k in zip(map(float,p.locator('#l3Stage').get_attribute('viewBox').split()),['x','y','width','height']))
  p.reload();p.wait_for_selector('#l3Stage');s=b.wait('!!s.apparatusState.camera');assert s['apparatusState']['camera']==saved_camera
  assert p.locator('#l3Stage').get_attribute('viewBox')!=initial
  b.click('fit');b.wait('s.apparatusState.camera&&Math.abs(s.apparatusState.camera.width-800)<1e-6')
  b.click('zoom-out');b.click('zoom-out');p.wait_for_timeout(150)
  targets=p.locator('#l3Stage .l3-hit').evaluate_all('(nodes)=>nodes.filter(n=>n.getClientRects().length&&!n.closest("[hidden]")).map(n=>({id:n.closest("[data-l3-target]")?.dataset.l3Target,w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))')
  assert all(t['w']>=44 and t['h']>=44 for t in targets),targets
  assert p.evaluate('document.documentElement.scrollWidth<=innerWidth');b.unchanged_legacy();assert not b.errors;b.screenshot('touch-camera-zoomout')
  return {'pinchChangesCamera':True,'twoFingerPanChangesCamera':True,'heldToolPreventsCameraGesture':True,'apparatusAndPhysicsUnchanged':True,'cameraRestoredOnReload':True,'zoomOutTargetsAtLeast44px':True,'targetMetrics':targets,'scope':'Chromium CDP-emulated touchscreen; no physical touch device evidence','pageErrors':b.errors}
 finally:b.close()

def paused_pour_hides_stream(browser):
 b=Bench(browser);p=b.page
 try:
  b.key('calorimeter','Enter');b.wait('s.physicalState.vesselPlaced');b.drag('cup',410,130);b.key('cup','r');b.wait('s.physicalState.waterMassKg>0.02&&s.physicalState.cupWaterMassKg>0')
  b.click('pause');p.locator('#l3CupAngle').fill('0');p.locator('#l3CupAngle').dispatch_event('input');s=b.wait('s.apparatusState.cupAngleRad===0')
  assert p.locator('#l3PourStream').get_attribute('hidden') is not None,'Stream remains visible after pause and returning cup upright'
  before=s['physicalState'];p.wait_for_timeout(1100);assert b.session()['physicalState']==before;b.invariant();assert not b.errors
  return {'partialPourStops':True,'uprightPausedCupHidesStream':True,'physicalStateHolds':True,'pageErrors':b.errors}
 finally:b.close()

def probe_contact_tracks_geometry(browser):
 b=Bench(browser,'solid');p=b.page
 try:
  b.drag('tongs',260,390);b.wait('s.physicalState.solid.location==="tongs"');b.drag('tongs',140,280);b.wait('s.physicalState.solid.location==="bath"');b.step(4)
  b.drag('probe',140,280);b.wait('s.physicalState.probe.placement==="solid"');b.step(1)
  probe_position=b.session()['apparatusState']['positions']['probe']
  b.drag('tongs',140,280);b.wait('s.physicalState.solid.location==="tongs"');b.drag('tongs',260,390)
  s=b.wait('s.physicalState.solid.location==="table"&&s.physicalState.probe.placement==="bath"')
  assert s['apparatusState']['positions']['probe']==probe_position,'Probe was attached to sample despite being left behind visually'
  b.step();s=b.session();assert s['physicalState']['probe']['placement']=='bath'
  with p.expect_download() as info:b.click('export-json')
  file=out/'contact-valid.json';info.value.save_as(file);valid=json.loads(file.read_text());valid['trials'][0]['hypothesis']='Import hợp lệ với đầu dò ở bể.';file.write_text(json.dumps(valid,ensure_ascii=False))
  p.reload();p.wait_for_selector('#l3Stage');b.wait('s.physicalState.probe.placement==="bath"')
  p.locator('#l3Import').set_input_files(file);b.wait('s.trials[0].hypothesis==="Import hợp lệ với đầu dò ở bể."')
  original=b.session();malformed=json.loads(file.read_text());malformed['physicalState']['probe']['placement']='solid';bad=out/'contact-malformed.json';bad.write_text(json.dumps(malformed,ensure_ascii=False))
  p.locator('#l3Import').set_input_files(bad);p.wait_for_timeout(1000)
  assert 'Không nhập phiên' in p.locator('#l3Status').inner_text(),'Mismatched physical contact pose was not rejected'
  assert b.session()==original,'Invalid contact pose replaced the current session'
  b.invariant();b.unchanged_legacy();assert not b.errors;b.screenshot('probe-left-behind-contact')
  return {'probeStayedPut':True,'solidMovedAway':True,'contactChangedToBath':True,'validPoseReloadAndImport':True,'malformedContactPoseRejectedBeforeReplacement':True,'pageErrors':b.errors}
 finally:b.close()

CASES={'ice_journey':ice_journey,'solid_journey':solid_journey,'data_roundtrip':data_roundtrip,'cancel_and_hold':cancel_and_hold,'handle_and_stir':handle_and_stir,'malformed_import':malformed_import,'responsive_mobile':responsive_mobile,'solid_weigh_pickup':solid_weigh_pickup,'insufficient_heat_repeat':insufficient_heat_repeat,'activity_switch_retains_sessions':activity_switch_retains_sessions,'touch_camera_and_hit_targets':touch_camera_and_hit_targets,'paused_pour_hides_stream':paused_pour_hides_stream,'probe_contact_tracks_geometry':probe_contact_tracks_geometry}
unknown=set(filter(None,args.only.split(',')))-set(CASES)
if unknown:parser.error('Unknown --only cases: '+', '.join(sorted(unknown)))
with sync_playwright() as playwright:
 browser=playwright.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox'])
 for name,fn in CASES.items():
  if args.only and name not in args.only.split(','):continue
  before_hashes=source_hashes()
  try:result={'case':name,'status':'PASS',**fn(browser)}
  except Exception as error:
   import traceback
   result={'case':name,'status':'FAIL','error':str(error),'traceback':traceback.format_exc()}
  after_hashes=source_hashes();result.update({'sourceBefore':before_hashes,'sourceAfter':after_hashes,'sourceChangedDuringCase':[f for f in SOURCE_FILES if before_hashes[f]!=after_hashes[f]]})
  results.append(result);(out/'report.json').write_text(json.dumps({'scope':'Chromium UI automation, no teacher or real device acceptance','gitHead':BASE_HEAD,'generatedAt':datetime.now(timezone.utc).isoformat(),'results':results},ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k not in ['sourceBefore','sourceAfter']},ensure_ascii=False),flush=True)
 browser.close()
if any(r['status']!='PASS' for r in results):raise SystemExit(1)
