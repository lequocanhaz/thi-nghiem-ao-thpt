#!/usr/bin/env python3
"""Native repeated additions with model/mesh/session checks; no live model setters."""
from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text();exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
results=[];before=source_hashes()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,touch in [(1440,False),(390,True)]:
  b=Bench(browser,width=width,height=1000);p=b.page
  try:
   initial=b.session();assert initial['physicalState']['config']['iceMassKg']==.1 and initial['apparatusState']['icePieceMassKg']==.01
   b.click('place-vessel');b.wait('s.physicalState.vesselPlaced');b.pour()
   before_energy=b.session()['physicalState']['energyResidualJ']
   for i in range(5):
    b.drag_via('ice',[(570,110),(410,110),(410,270)],touch=touch);s=b.wait('s.physicalState.icePortions&&s.physicalState.icePortions.filter(p=>p.origin==="added").length==='+str(i+1));assert abs(s['physicalState']['iceMassKg']-(i+1)*.01)<1e-9
   s=b.session();state=s['physicalState'];assert abs(state['iceTrayMassKg']-.05)<1e-9 and len(state['icePortions'])==5
   assert '5' in p.locator('#l3IceStock').inner_text();b.invariant()
   geometry=p.locator('#l3ThreeCanvas').evaluate('c=>c.thermalGeometry');parts=geometry['iceParts'];assert len(parts)==5 and geometry['ice'] is None
   def volume(g):
    vs=g['positions'];ids=g.get('indices') or list(range(len(vs)//3));total=0
    for n in range(0,len(ids),3):
     a,b,c=[vs[3*k:3*k+3] for k in ids[n:n+3]];total+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6
    return abs(total)
   actual=sum(volume(x) for x in parts);assert abs(actual-.05/917)<.05/917*3e-5
   for part in parts:assert abs(volume(part)-part['massKg']/917)<part['massKg']/917*3e-5
   p.locator('#l3StudentTemperature').fill('31.2');b.click('record');b.wait('s.trials[0].readings.length===1');b.step(20);melted=b.session();assert 0<melted['physicalState']['iceMassKg']<.05
   for old,new in zip(state['icePortions'],melted['physicalState']['icePortions']):assert 0<=new['massKg']<=old['massKg']
   retained=melted['physicalState']['icePortions'][0]['massKg'];b.drag_via('ice',[(570,110),(410,110),(410,270)],touch=touch);s=b.wait('s.physicalState.icePortions.length===6');assert abs(s['physicalState']['icePortions'][0]['massKg']-retained)<1e-8
   with p.expect_download() as dl:b.click('export-json')
   file=out/f'ice-{width}.json';dl.value.save_as(str(file));saved=json.loads(file.read_text());p.locator('#l3Import').set_input_files(str(file));p.wait_for_timeout(1400);p.reload();b.ready_3d();restored=b.wait('s.physicalState.icePortions.length===6');assert restored['physicalState']==saved['physicalState'];assert restored['trials']==saved['trials'];b.invariant();assert not b.errors
   p.screenshot(path=str(out/f'ice-six-{width}.png'),full_page=True)
   results.append({'width':width,'touchEmulated':touch,'fiveNativeDrops':True,'sixthAfterMeltingNoRegrowth':True,'fivePartVolumeM3':actual,'JSONImportReloadPreservesLedgerAndReading':True,'pageErrors':b.errors[:]});print(json.dumps(results[-1]),flush=True)
  finally:b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after;(out/'report.json').write_text(json.dumps({'status':'PASS','browserVersion':version,'results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True},ensure_ascii=False,indent=2)+'\n')
