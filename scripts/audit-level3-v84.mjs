/**
 * P0 inventory from an immutable git snapshot, never an L3 certificate.
 * node scripts/audit-level3-v84.mjs [--write|--check] [--baseline-ref COMMIT]
 * --write changes only docs/level3-v84/catalog-audit.{json,csv}.
 * Existing manually reviewed acceptance is preserved by ID.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
for(let i=0;i<args.length;i++){assert.ok(['--write','--check','--baseline-ref'].includes(args[i]),'Unknown argument '+args[i]);if(args[i]==='--baseline-ref')assert.ok(args[++i]&&!args[i].startsWith('--'),'--baseline-ref requires a commit');}
assert.ok(!(args.includes('--write')&&args.includes('--check')),'Choose --write or --check');
const ref=args.includes('--baseline-ref')?args[args.indexOf('--baseline-ref')+1]:'6aba10bd33f013d2f96d51513764022a65b65d86';
const git=(...a)=>execFileSync('git',a,{cwd:root,maxBuffer:64*1024*1024}).toString();
const hash=x=>createHash('sha256').update(x).digest('hex');
const canonical=x=>JSON.stringify(x,(_k,v)=>typeof v==='function'?{$functionSha256:hash(v.toString())}:typeof v==='number'&&!Number.isFinite(v)?{$nonFinite:String(v)}:v);
const out=path.join(root,'docs/level3-v84'),jsonFile=path.join(out,'catalog-audit.json');
const previous=fs.existsSync(jsonFile)?JSON.parse(fs.readFileSync(jsonFile,'utf8')):null;
const commit=git('rev-parse',ref+'^{commit}').trim();
const tree=git('ls-tree','-r','--name-only',commit).trim().split('\n');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'quanh-level3-')),sources=new Map();
function snapshot(file){
 if(sources.has(file))return;
 const text=git('show',commit+':'+file);sources.set(file,text);
 fs.mkdirSync(path.dirname(path.join(temp,file)),{recursive:true});fs.writeFileSync(path.join(temp,file),text);
 for(const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g)){
  const local=path.posix.normalize(path.posix.join(path.posix.dirname(file),m[1].split('?')[0]));
  if(local.endsWith('.js'))snapshot(local);
 }
}
const gateNames={'L3-01':'Tự thiết lập/bố trí hệ','L3-02':'Thao tác trực tiếp có nguyên nhân','L3-03':'Hệ quả vật lí và thao tác sai','L3-04':'Đọc dụng cụ đúng vị trí/thang/đơn vị','L3-05':'Biến độc lập/phụ thuộc/kiểm soát và lặp','L3-06':'Sổ đo, đồ thị, CSV/JSON','L3-07':'Dự đoán, khảo sát, kết luận và giới hạn','L3-08':'Nghiệm thu độc lập/giáo viên/thiết bị'};
const layerNames={F1:'Mô hình',F2:'Tương tác',F3:'Dữ liệu',F4:'Trình duyệt',F5:'Giáo viên và thiết bị thật'};

function dashboard(report){
 const data={baseline:report.baseline.commit,fingerprint:report.baseline.catalogFingerprintSha256,counts:report.counts,summary:report.summary,gates:report.gateNames,records:report.records.map(r=>({id:r.id,title:r.title,topic:r.topic,grade:r.grade,source:r.sourceRef,mode:r.baselineBehaviour.mode,scene:r.archetype.scene,system:r.physicalSystem.description,readouts:r.measurements.declaredReadouts.map(m=>m.label+(m.unit?' ('+m.unit+')':'')),limits:r.knownLimitations.sourceText,variables:r.variables,gaps:r.knownLimitations.gaps,triage:r.triage,acceptance:r.acceptance,evidence:r.evidence}))};
 return '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quanh Lab · Audit Level 3</title><style>body{margin:0;background:#f5f7fa;color:#18263c;font:16px/1.5 system-ui,sans-serif}main{max-width:1400px;margin:auto;padding:24px}h1{font-size:clamp(24px,4vw,36px);margin:0 0 12px}.notice{background:#fff4d9;border-left:4px solid #a86500;padding:16px;border-radius:8px}code{overflow-wrap:anywhere}.summary,.filters{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.summary span{background:white;border:1px solid #d7dfeb;border-radius:8px;padding:12px}.filters label{display:grid;gap:4px}input,select{font:inherit;min-height:44px;max-width:100%;padding:4px 10px;box-sizing:border-box}input:focus-visible,select:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid #1c62bc;outline-offset:3px}.table-scroll{overflow:auto;background:white;border:1px solid #d7dfeb;border-radius:10px}table{border-collapse:collapse;width:100%;min-width:820px}th,td{border-bottom:1px solid #e0e6ef;padding:12px;text-align:left;vertical-align:top}th{background:#eaf0f8}details{max-width:600px}summary{cursor:pointer;min-height:32px;padding:6px 0}.status{font-weight:700;white-space:nowrap}p{max-width:100ch}dl{margin:8px 0}dt{font-weight:700}dd{margin:0 0 12px}li{margin:4px 0}a{color:#1855a0}@media(max-width:500px){main{padding:16px}.filters label{width:100%}}@media print{.filters{display:none}table{min-width:0}details{max-width:none}}</style><main><h1>Audit Level 3 · 300 thí nghiệm</h1><p class="notice"><strong>Hồ sơ rà soát nội bộ, chỉ đọc.</strong> Trường có dữ liệu nguồn không đồng nghĩa đã đạt Level 3. Các gate, mô hình, tương tác, dữ liệu, trình duyệt và giáo viên/thiết bị thật có trạng thái riêng. Chưa có nghiệm thu thì giữ NOT TESTED.</p><p>Baseline <code>'+data.baseline+'</code><br>Catalog SHA-256 <code>'+data.fingerprint+'</code></p><div class="summary" id="summary"></div><div class="filters"><label>Tìm tên hoặc ID<input id="query" type="search" autocomplete="off"></label><label>Chủ đề<select id="topic"><option value="">Tất cả</option></select></label><label>Trạng thái<select id="status"><option value="">Tất cả</option><option>PASS</option><option>PARTIAL</option><option>NOT TESTED</option><option>BLOCKED</option></select></label></div><p id="count" role="status" aria-live="polite"></p><div class="table-scroll" role="region" aria-label="Ma trận audit Level 3" tabindex="0"><table><thead><tr><th>ID / thí nghiệm</th><th>Chủ đề</th><th>Hành vi baseline API</th><th>Trạng thái Level 3</th><th>Hồ sơ và khoảng trống</th></tr></thead><tbody id="rows"></tbody></table></div><p>Chỉ có calorimetry được chọn làm pilot. Các bài khác chưa được xếp chi phí/rủi ro thiết kế Level 3; đây không phải danh sách 300 bài đã hoàn tất. API Node không thay thế thao tác trình duyệt, giáo viên hoặc thiết bị thật.</p></main><script type="application/json" id="audit">'+JSON.stringify(data).replaceAll('<','\\u003c')+'</script><script>const audit=JSON.parse(document.querySelector("#audit").textContent),$=s=>document.querySelector(s),el=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text??""});for(const [k,v] of Object.entries(audit.summary.overall))$("#summary").append(el("span",k+": "+v));for(const t of [...new Set(audit.records.map(r=>r.topic))].sort()){const o=el("option",t);o.value=t;$("#topic").append(o)}function draw(){const q=$("#query").value.trim().toLocaleLowerCase(),topic=$("#topic").value,status=$("#status").value,records=audit.records.filter(r=>(!q||(r.id+" "+r.title).toLocaleLowerCase().includes(q))&&(!topic||r.topic===topic)&&(!status||r.acceptance.overall.status===status));$("#count").textContent=records.length+" / "+audit.records.length+" bài";$("#rows").replaceChildren();for(const r of records){const tr=el("tr"),name=el("td"),a=el("a",r.id+" · "+r.title);a.href="../#lab/"+encodeURIComponent(r.id);name.append(a);tr.append(name,el("td",r.topic+" · Lớp "+r.grade),el("td",r.mode));const statusCell=el("td",r.acceptance.overall.status);statusCell.className="status";tr.append(statusCell);const cell=el("td"),details=el("details"),summary=el("summary","Xem nguồn, gate và thiếu sót");details.append(summary);const dl=el("dl");for(const [k,v]of [["Nguồn",r.source],["Hệ vật lí (khai báo)",r.system],["Nhóm dựng hình (chưa duyệt archetype)",r.scene??"Không có scene field"],["Số đọc tính toán",r.readouts.join("; ")],["Giới hạn ghi trong nguồn",r.limits],["Ưu tiên / độ khó / rủi ro",r.triage.priority+" / "+r.triage.difficulty+" / "+r.triage.risk],["Biến ứng viên, chưa được duyệt",JSON.stringify(r.variables)],["Chứng cứ nghiệm thu",r.acceptance.overall.evidenceRefs.join("; ")||"Chưa có"]]){dl.append(el("dt",k),el("dd",v))}details.append(dl);const gates=el("ul");for(const[k,v]of Object.entries(r.acceptance.gates))gates.append(el("li",k+" "+audit.gates[k]+": "+v.status));for(const[k,v]of Object.entries(r.acceptance.evidenceLayers))gates.append(el("li",k+": "+v.status));details.append(gates);const gaps=el("ul");for(const gap of r.gaps)gaps.append(el("li",gap));details.append(gaps);cell.append(details);tr.append(cell);$("#rows").append(tr)}}for(const id of ["#query","#topic","#status"])$(id).addEventListener("input",draw);draw();</script></html>\n';
}

const untested=()=>({status:'NOT TESTED',evidenceRefs:[],reviewer:null,reviewedAt:null});
const newAcceptance=()=>({overall:untested(),gates:Object.fromEntries(Object.keys(gateNames).map(k=>[k,untested()])),evidenceLayers:Object.fromEntries(Object.keys(layerNames).map(k=>[k,untested()])),teacherReview:untested(),realDeviceReview:untested(),notes:[]});
function validateAcceptance(r){
 assert.deepEqual(Object.keys(r.acceptance.gates).sort(),Object.keys(gateNames).sort(),r.id+' eight gates');
 assert.deepEqual(Object.keys(r.acceptance.evidenceLayers).sort(),Object.keys(layerNames).sort(),r.id+' five evidence layers');
 for(const [label,a] of [['overall',r.acceptance.overall],...Object.entries(r.acceptance.gates),...Object.entries(r.acceptance.evidenceLayers),['teacherReview',r.acceptance.teacherReview],['realDeviceReview',r.acceptance.realDeviceReview]]){
  assert.ok(['PASS','PARTIAL','NOT TESTED','BLOCKED'].includes(a.status),r.id+' '+label+' invalid status');
  assert.ok(Array.isArray(a.evidenceRefs),r.id+' '+label+' evidence must be array');
  if(a.status==='PASS'||a.status==='PARTIAL')assert.ok(a.evidenceRefs.length&&a.reviewer&&a.reviewedAt,r.id+' '+label+' reviewed status needs evidence, reviewer and date');
 }
 if(r.acceptance.overall.status==='PASS')assert.ok(Object.values(r.acceptance.gates).every(g=>g.status==='PASS')&&r.acceptance.teacherReview.status==='PASS'&&r.acceptance.realDeviceReview.status==='PASS',r.id+' overall PASS needs all gates plus teacher/device');
}
try{
 fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
 const modules=['dist/experiments.js','dist/models.js','dist/playback.js','dist/measurements.js','dist/learning.js','dist/lessons/catalog.js'];
 modules.forEach(snapshot);
 const [{experiments,initialState},{evaluate,clampState,duration},{isDriven,createProcess,advanceProcess},{meters,tableValues},{coreParams},{lessons}]=await Promise.all(modules.map(f=>import(pathToFileURL(path.join(temp,f)).href)));
 assert.equal(experiments.length,300);assert.equal(new Set(experiments.map(e=>e.id)).size,300);
 assert.deepEqual(Object.keys(lessons).sort(),experiments.map(e=>e.id).sort());
 const lineRef=(file,needle)=>{const n=(sources.get(file)||'').split('\n').findIndex(s=>s.includes(needle));return n<0?file:file+':'+(n+1);};
 const shared={playback:lineRef('dist/playback.js','export const isDriven'),drag:lineRef('dist/learning.js','export function parameterFromDrag'),core:lineRef('dist/learning.js','export const coreParams'),meters:lineRef('dist/measurements.js','export const meters'),table:lineRef('dist/measurements.js','export function tableValues'),model:lineRef('dist/models.js','export function evaluate')};
 const catalogs=['dist/experiments.js','dist/extended-catalog.js','dist/discovery-catalog.js','dist/atlas-catalog.js','dist/expansion-catalog.js'];
 const testSources=new Map(tree.filter(f=>f.startsWith('checks/')&&/\.(mjs|py)$/.test(f)).map(f=>[f,git('show',commit+':'+f)]));
 const changed=(a,b)=>Object.keys({...a,...b}).filter(k=>k!=='t'&&typeof a?.[k]==='number'&&typeof b?.[k]==='number'&&Number.isFinite(a[k])&&Number.isFinite(b[k])&&Math.abs(a[k]-b[k])>1e-10*Math.max(1e-20,Math.abs(a[k]),Math.abs(b[k])));
 const records=experiments.map((e,i)=>{
  const needle=catalogs.flatMap(file=>["id:'"+e.id+"'","lab('"+e.id+"'","add('"+e.id+"'","l('"+e.id+"'"].filter(n=>sources.get(file).includes(n)).map(n=>({file,n})))[0];
  assert.ok(needle,'Missing declaration origin '+e.id);const sourceRef=lineRef(needle.file,needle.n);
  const state=clampState(e,initialState(e)),config={mode:0,capMode:'charge'};
  const probe={scope:'Baseline Node API observation; not an independent physics oracle, apparatus action or browser test',configuration:config,initialState:state,errors:[]};
  try{
   const d=evaluate(e.id,{...state},config);probe.defaultModelReturned=!!d;probe.domainValid=d?.domainValid!==false;
   probe.meters=(meters[e.id]||[]).map(m=>({...m,value:d?.[m.key]??state[m.key]??null}));
   probe.tableValues=tableValues(e.id,{...state},d,config);probe.tableWidth=probe.tableValues.length;probe.headerWidth=e.headers.length;
   probe.nonFiniteDefaultFields=Object.entries(d||{}).filter(([,v])=>typeof v==='number'&&!Number.isFinite(v)).map(([k])=>k);
   const span=duration(e,state,d);probe.duration=span;
   probe.timeSamples=[.137,.419,.731].map(f=>{const t=Number.isFinite(span)?span*f:f;return {time:t,changedNumericOutputKeysExcludingTime:changed(d,evaluate(e.id,{...state,t},config))};});
   probe.modelChangesWithTime=probe.timeSamples.some(s=>s.changedNumericOutputKeysExcludingTime.length>0);
   if(isDriven(e)){const s={...state},c={...config},p=createProcess(e,s,c);c.process=p;advanceProcess(e,s,c,4);probe.automaticProcess={key:p.key,from:p.from,to:p.to,seconds:p.seconds,stateAtHalf:s,changedNumericOutputKeysExcludingTime:changed(d,evaluate(e.id,s,c))};}
  }catch(error){probe.errors.push(String(error));}
  const declaredReadouts=meters[e.id]||[],independent=e.graph?.key?[e.graph.key]:coreParams(e).slice(0,1).map(p=>p.key);
  const gaps=['Structured apparatus topology, setup affordances and placement validation absent from baseline catalog','Per-ID instrument range/tare/lag contract absent from baseline catalog','Direct causal and invalid-action interaction acceptance not independently tested','Variable assignments are source-derived candidates, not an approved design','Student-recorded values vs model truth separation not verified per ID','Teacher and real-device acceptance absent'];
  return {
   number:i+1,catalogId:e.id,id:e.id,title:e.title,grade:e.grade,topic:e.topic,route:'/#lab/'+e.id,sourceRef,
   physicalSystem:{name:e.title,description:e.description,formula:e.formula,sourceRef,verification:'SOURCE DECLARATION ONLY'},
   archetype:{scene:e.scene??null,view:e.view??null,sourceGroup:e.sourceGroup??null,classification:'Existing rendering group only; L3 apparatus archetype NOT TESTED'},
   apparatus:{items:[],status:'NOT TESTED',metadataPresent:Object.hasOwn(e,'apparatus'),reason:'No structured apparatus field; scene names and scalar handles are not a validated apparatus inventory'},
   causalActions:{declaredParameterControls:e.params,defaultCoreHandleKeys:coreParams(e).map(p=>p.key),genericHandleMappingRef:shared.drag,automaticProcess:probe.automaticProcess??null,directPhysicalActionStatus:'NOT TESTED',invalidActionStatus:'NOT TESTED',evidenceRef:shared.playback},
   measurements:{declaredReadouts,columns:e.columns??null,headers:e.headers,sourceRef:shared.meters,interpretation:'Computed readout declarations, not independently verified instruments',placement:null,range:null,resolutionContract:null,lag:null,studentRecordContract:null},
   variables:{status:'NOT TESTED',basis:'Graph declarations/core parameter selection only; needs per-ID design review',independentCandidates:independent,dependentCandidates:e.graph?.metric?[e.graph.metric]:declaredReadouts.map(m=>m.key),controlCandidates:e.params.filter(p=>p.key!=='t'&&!independent.includes(p.key)).map(p=>p.key),approvedIndependent:[],approvedDependent:[],approvedControls:[]},
   modelAssumptions:{sourceText:e.theory,sourceRef,verification:'NOT TESTED'},
   knownLimitations:{sourceText:e.limit,sourceRef,independentReview:'NOT TESTED',gaps},
   learning:{tasks:e.tasks,declaredLearning:e.learning??null,lessonRef:'dist/lessons/catalog.js',verifiedInvestigationProtocol:'NOT TESTED'},
   baselineBehaviour:{mode:isDriven(e)?'AUTOMATIC_PARAMETER_PROCESS':e.visualOnly?'VISUAL_EMISSION_ONLY':probe.modelChangesWithTime?'TIME_DEPENDENT_OUTPUT_OBSERVED':'NO_TIME_DEPENDENT_OUTPUT_OBSERVED',staticFlag:e.static??null,visualOnly:!!e.visualOnly,hasTimeParameter:e.params.some(p=>p.key==='t'),isDriven:isDriven(e),probe},
   oracleTests:{status:'NOT TESTED',existingLiteralIdReferences:[...testSources].filter(([,s])=>s.includes("'"+e.id+"'")||s.includes('"'+e.id+'"')).map(([f])=>f),note:'Literal ID reference discovery only; tests not executed here and do not certify all L3 gates'},
   browserTests:{status:'NOT TESTED',evidenceRefs:[]},mobileEvidence:{status:'NOT TESTED',evidenceRefs:[]},
   reuse:{existingAPIs:['evaluate','tableValues',...(isDriven(e)?['createProcess','advanceProcess']:[])],evidenceRefs:[shared.model,shared.table,shared.core],scope:'Candidate infrastructure reuse; each L3 contract still needs validation'},
   triage:{priority:e.id==='calorimetry'?'P1 PILOT':'NOT TRIAGED',difficulty:'NOT ESTIMATED',risk:'NOT ASSESSED',reason:e.id==='calorimetry'?'User-selected thermal pilot, two distinct activities within one existing ID':'Source inventory cannot establish implementation cost/risk/acceptance'},
   evidence:{source:[sourceRef,...new Set(Object.values(shared))],apiProbe:{evidenceId:'baseline-api:'+e.id,status:probe.errors.length?'ERROR':'OBSERVED',notL3Acceptance:true},teacher:[],realDevice:[]},
   acceptance:previous?.records?.find(r=>r.id===e.id)?.acceptance??newAcceptance()
  };
 });
 records.forEach(validateAcceptance);
 // Negative assertions prevent the inventory from accepting a fabricated PASS.
 const fake={id:'self-test',acceptance:newAcceptance()};fake.acceptance.overall.status='PASS';
 assert.throws(()=>validateAcceptance(fake),/reviewed status needs evidence/);
 Object.assign(fake.acceptance.overall,{evidenceRefs:['fixture'],reviewer:'fixture',reviewedAt:'fixture'});
 assert.throws(()=>validateAcceptance(fake),/overall PASS needs all gates/);
 const tally=(items,get)=>items.reduce((a,r)=>(a[get(r)]=(a[get(r)]||0)+1,a),{});
 const books=JSON.parse(git('show',commit+':dist/books/catalog.json'));
 const counts={experiments:records.length,uniqueIds:new Set(records.map(r=>r.id)).size,lessons:Object.keys(lessons).length,bookPages:tree.filter(f=>/^dist\/books\/(10|11|12)\/\d+\.webp$/.test(f)).length,bookLessonEntries:books.reduce((n,b)=>n+b.lessons.length,0),audioClips:tree.filter(f=>/^dist\/audio\/vi13\/[^/]+\.mp3$/.test(f)).length};
 assert.deepEqual(counts,{experiments:300,uniqueIds:300,lessons:300,bookPages:388,bookLessonEntries:85,audioClips:301});
 const sourceManifest=[...sources].sort(([a],[b])=>a.localeCompare(b)).map(([file,text])=>({file,baselineSha256:hash(text),workingTreeSha256:fs.existsSync(path.join(root,file))?hash(fs.readFileSync(path.join(root,file))):null}));
 const summary={overall:tally(records,r=>r.acceptance.overall.status),behaviour:tally(records,r=>r.baselineBehaviour.mode),isDriven:records.filter(r=>r.baselineBehaviour.isDriven).length,timeDependentOutputObserved:records.filter(r=>r.baselineBehaviour.probe.modelChangesWithTime).length,nonDrivenWithoutTimeParameter:records.filter(r=>!r.baselineBehaviour.isDriven&&!r.baselineBehaviour.hasTimeParameter).map(r=>r.id),apiErrors:records.filter(r=>r.baselineBehaviour.probe.errors.length).map(r=>({id:r.id,errors:r.baselineBehaviour.probe.errors})),nonFiniteDefaultOutput:records.filter(r=>r.baselineBehaviour.probe.nonFiniteDefaultFields?.length).map(r=>({id:r.id,keys:r.baselineBehaviour.probe.nonFiniteDefaultFields})),sourceFieldCoverage:Object.fromEntries(['apparatus','physicalSystem','causalActions','measurements','independent','dependent','controls','instrumentState','setup'].map(k=>[k,experiments.filter(e=>Object.hasOwn(e,k)).length])),topics:tally(records,r=>r.topic)};
 const baseline={commit,catalogFingerprintSha256:hash(canonical(experiments)),idFingerprintSha256:hash(experiments.map(e=>e.id).sort().join('\n')),catalogSerialization:'Catalog array order; JSON function source SHA-256 and explicit nonfinite numeric markers',sourceManifest};
 const report={schema:'quanh.level3.audit.v1',generatedAt:new Date().toISOString(),scope:'P0 immutable source inventory/API observations; never Level 3 certification',baseline,counts,gateNames,evidenceLayerNames:layerNames,sharedEvidence:shared,summary,limitations:['Default mode 0 / capacitor charge only; no scene rendering or browser/interaction/device test','Changed/finite model outputs do not establish apparatus manipulation or independent scientific accuracy','Source refs and literal test-ID matches are traceability aids, not executed test results','Variables/archetypes/assumptions/limits still need per-ID review','No teacher/curriculum/phone/Safari hardware/performance acceptance claim'],records};
 const columns=['number','catalog_id','id','title','grade','topic','sourceRef','baselineMode','scene','sourceApparatusPresent','independentCandidates','dependentCandidates','controlCandidates','physicalSystem','measurements','modelAssumptions','knownLimitations','apiErrors','priority','difficulty','risk','overall',...Object.keys(gateNames),...Object.keys(layerNames),'teacherReview','realDeviceReview','evidenceRefs'];
 const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 const csv=[columns.map(cell).join(','),...records.map(r=>[r.number,r.catalogId,r.id,r.title,r.grade,r.topic,r.sourceRef,r.baselineBehaviour.mode,r.archetype.scene,r.apparatus.metadataPresent,r.variables.independentCandidates.join(';'),r.variables.dependentCandidates.join(';'),r.variables.controlCandidates.join(';'),r.physicalSystem.description,r.measurements.declaredReadouts.map(m=>m.label+' ['+m.unit+']').join(';'),r.modelAssumptions.sourceText,r.knownLimitations.sourceText,r.baselineBehaviour.probe.errors.join(';'),r.triage.priority,r.triage.difficulty,r.triage.risk,r.acceptance.overall.status,...Object.keys(gateNames).map(k=>r.acceptance.gates[k].status),...Object.keys(layerNames).map(k=>r.acceptance.evidenceLayers[k].status),r.acceptance.teacherReview.status,r.acceptance.realDeviceReview.status,r.acceptance.overall.evidenceRefs.join(';')].map(cell).join(','))].join('\n')+'\n';
 if(args.includes('--check')){
  assert.ok(previous,'Generate with --write first');assert.equal(previous.baseline.commit,commit);assert.equal(previous.baseline.catalogFingerprintSha256,baseline.catalogFingerprintSha256);assert.equal(previous.baseline.idFingerprintSha256,baseline.idFingerprintSha256);assert.deepEqual(previous.counts,counts);
  assert.deepEqual(previous.records.map(r=>r.id),records.map(r=>r.id));
  for(const r of records){const old=previous.records.find(p=>p.id===r.id);assert.equal(canonical({...old,acceptance:undefined}),canonical({...r,acceptance:undefined}),r.id+' source inventory/API probe changed');}
  assert.deepEqual(previous.summary,summary,'JSON summary must match reviewed acceptance');
  assert.equal(fs.readFileSync(path.join(out,'catalog-audit.csv'),'utf8'),csv,'CSV must match JSON reviewed acceptance');
  assert.equal(fs.readFileSync(path.join(root,'dist/review/level3-v84.html'),'utf8'),dashboard(report),'Read-only dashboard must match JSON acceptance');
 }
 if(args.includes('--write')){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(jsonFile,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'catalog-audit.csv'),csv);fs.mkdirSync(path.join(root,'dist/review'),{recursive:true});fs.writeFileSync(path.join(root,'dist/review/level3-v84.html'),dashboard(report));}
 console.log(JSON.stringify({command:args.includes('--check')?'CHECK':args.includes('--write')?'WRITE':'READ ONLY',baseline:commit,catalogFingerprintSha256:baseline.catalogFingerprintSha256,counts,summary},null,2));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
