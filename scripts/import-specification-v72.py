"""Import paragraph text extracted from the user's DOCX, preserving proposed requirements."""
import argparse,hashlib,json,pathlib,re,zipfile,xml.etree.ElementTree as ET
p=argparse.ArgumentParser();p.add_argument('text',nargs='?');p.add_argument('--docx',required=True);a=p.parse_args()
if a.text:
 s=pathlib.Path(a.text).read_text()
else:
 ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
 xml=ET.fromstring(zipfile.ZipFile(a.docx).read('word/document.xml'))
 s='\n'.join(''.join(t.text or '' for t in para.findall('.//w:t',ns)) for para in xml.findall('.//w:p',ns))
matches=list(re.finditer(r'^(\d{3})\. (.+?)\s+\[ID: ([a-z0-9_]+)\s*\|\s*LỚP (\d+)\]',s,re.M))
assert len(matches)==300 and len({m[3] for m in matches})==300
end=s.index('7. KẾ HOẠCH GIAO VIỆC',matches[-1].end());records=[]
for i,m in enumerate(matches):
 body=s[m.end():matches[i+1].start() if i+1<len(matches) else end].strip()
 records.append({'number':int(m[1]),'id':m[3],'title':m[2].strip(),'grade':int(m[4]),'proposedExtension':'MỞ RỘNG/CHUYÊN ĐỀ – CHỜ ĐỐI CHIẾU YCCĐ' in body,'requirements':body})
root=pathlib.Path(__file__).resolve().parents[1]
meta={'document':'Dac_ta_chinh_sua_chi_tiet_300_thi_nghiem_Quanh_Lab (1).docx','sha256':hashlib.sha256(pathlib.Path(a.docx).read_bytes()).hexdigest(),'documentVersion':'1.0','documentDate':'2026-10-30','requirementsAreProposals':True,'profiles':records}
(root/'sources/specification-v72/profiles.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
coverage={'sourceSha256':meta['sha256'],'baselineCommit':'ef52beae086a2f5140c46a0c6fa37df31c02ceb8','statusDefinitions':{'pending':'Not independently accepted; requirement requires checking','implemented':'Specific software behavior implemented; not teacher acceptance'},'experiments':[{'id':r['id'],'stage':'B' if r['number']<=8 else 'C-D-E','scientificReview':'pending','pedagogicalReview':'pending','realDeviceReview':'pending','curriculum':{'gradeFromCatalog':r['grade'],'contentStrand':None,'learningOutcome':None,'textbookLesson':None,'verification':'pending','proposedExtension':r['proposedExtension']},'criteria':{k:'pending' for k in ['S1','S2','S3','S4','S5','S6','S7']}} for r in records]}
tracker=root/'docs/spec-v72/coverage.json'
if not tracker.exists():tracker.write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
else:assert json.loads(tracker.read_text())['sourceSha256']==meta['sha256'],'Source changed: review existing acceptance ledger instead of overwriting it.'
(root/'sources/specification-v72/system-requirements.txt').write_text(s[:s.index('5. BẢNG ĐIỀU HƯỚNG')])
print('Imported',len(records),'unique proposed profiles; none marked fully accepted.')
