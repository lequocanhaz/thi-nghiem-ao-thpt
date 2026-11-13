#!/usr/bin/env python3
"""Real browser storage-recovery UI, isolated persisted fixtures only; no model setter."""
import argparse, hashlib, json
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--url',default='http://127.0.0.1:4176');p.add_argument('--out',default='work/thermal-v86/storage');args=p.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
def hashes():
 files=[Path(__file__),Path('dist/index.html'),Path('dist/boot.js'),Path('dist/app.js'),*sorted(Path('dist/l3').glob('*.js')),*sorted(Path('dist/l3').glob('*.css'))]
 return {str(f):hashlib.sha256(f.read_bytes()).hexdigest() for f in files}
def download(page,selector,name):
 with page.expect_download() as dl:page.locator(selector).click()
 dest=out/name;dl.value.save_as(str(dest));return dest.read_bytes()
results=[];before=hashes()
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for activity in ['ice','solid']:
  key='quanh-l3-calorimetry-'+activity+'-v1';raw=' {"broken":"giữ nguyên bản gốc — '+activity+'", "schemaVersion":"invalid"}\n'
  ctx=browser.new_context(viewport={'width':1440 if activity=='ice' else 390,'height':1000},accept_downloads=True)
  ctx.add_init_script('if(!localStorage.getItem("seeded-storage86")){localStorage.setItem(%s,%s);localStorage.setItem("quanh-l3-view-v1","2d");localStorage.setItem("seeded-storage86","1");}'%(json.dumps(key),json.dumps(raw)))
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
  page.goto(args.url.rstrip('/')+'/#lab/calorimetry?l3='+activity);page.locator('[data-l3-action="export-original"]').wait_for(state='visible')
  assert 'Phiên lưu chưa đọc được' in page.locator('#l3Status').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Recovery controls overflow horizontally'
  note='Dự đoán mới trong RAM '+activity
  page.locator('[data-l3-note="hypothesis"]').fill(note);page.locator('#l3StudentTemperature').fill('31.7');page.wait_for_timeout(1200)
  assert page.evaluate('(k)=>localStorage.getItem(k)',key)==raw
  current=download(page,'[data-l3-action="export-json"]',activity+'-current-before-backup.json');valid=json.loads(current)
  assert valid['trials'][0]['hypothesis']==note and valid['drafts']['temperature']=='31.7'
  page.locator('#l3Import').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':current})
  page.wait_for_function('document.querySelector("#l3Status").textContent.includes("Sao lưu bản gốc trước")')
  assert page.evaluate('(k)=>localStorage.getItem(k)',key)==raw
  original=download(page,'[data-l3-action="export-original"]',activity+'-unread-original.json')
  assert original==raw.encode('utf-8')
  assert page.evaluate('(k)=>localStorage.getItem(k)',key)==raw
  # Public file-input import after explicit backup; old RAM session downloads.
  with page.expect_download() as dl:page.locator('#l3Import').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':current})
  dl.value.save_as(str(out/(activity+'-preimport-backup.json')))
  page.wait_for_timeout(1500)
  restored=json.loads(page.evaluate('(k)=>localStorage.getItem(k)',key))
  assert restored['trials'][0]['hypothesis']==note
  assert not page.locator('[data-l3-action="export-original"]').is_visible()
  page.reload();page.locator('#l3StudentTemperature').wait_for();assert page.locator('#l3StudentTemperature').input_value()=='31.7'
  assert page.locator('[data-l3-note="hypothesis"]').input_value()==note
  assert not errors
  results.append({'activity':activity,'case':'unread-original','status':'PASS','originalByteExact':True,'newRamDraftExported':True,'replacementBlockedUntilBackup':True,'explicitBackupImportReloadRetainsDrafts':True,'pageErrors':errors[:]})
  ctx.close()
  # Inject only browser storage failure; all live content changes still via UI.
  ctx=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
  raw_valid=json.dumps(restored,separators=(',',':'),ensure_ascii=False)
  ctx.add_init_script('''if(!localStorage.getItem('quota-seeded86')){localStorage.setItem(%s,%s);localStorage.setItem('quanh-l3-view-v1','2d');localStorage.setItem('quota-seeded86','1');}const originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===%s)throw new DOMException('QA quota fixture','QuotaExceededError');return originalSet.call(this,k,v);};'''%(json.dumps(key),json.dumps(raw_valid),json.dumps(key)))
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(args.url.rstrip('/')+'/#lab/calorimetry?l3='+activity)
  page.locator('[data-l3-note="hypothesis"]').fill('Quota test '+activity)
  page.wait_for_function('document.querySelector("#l3Status").textContent.includes("Chưa lưu được")')
  assert page.evaluate('(k)=>localStorage.getItem(k)',key)==raw_valid
  exported=download(page,'[data-l3-action="export-json"]',activity+'-quota-current.json')
  assert json.loads(exported)['trials'][0]['hypothesis']=='Quota test '+activity
  assert not errors
  results.append({'activity':activity,'case':'quota','status':'PASS','storedCopyRetainedByteExact':True,'unsavedRamWorkExported':True,'pageErrors':errors[:]})
  ctx.close()
 version=browser.version;browser.close()
after=hashes();assert before==after,'Sources changed while verifying storage recovery'
report={'generatedAt':datetime.now(timezone.utc).isoformat(),'browserVersion':version,'scope':'Chromium browser UI in 2D for storage fault isolation; no device/teacher acceptance','sourceBefore':before,'sourceAfter':after,'sourceStable':True,'results':results}
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':'PASS','browserVersion':version,'cases':len(results),'sourceStable':True}))
