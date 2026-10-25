/** Structural/runtime inventory, not a scientific oracle. --write emits review artifacts.
 * Optional --scientific=<json> attaches a separately executed independent audit.
 * It never runs or rewrites checks/audit-300 historical reports.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {meters,tableValues} from '../dist/measurements.js';
import {graphFor} from '../dist/graphs.js';
import {isDriven} from '../dist/playback.js';
import {formulaCatalog} from '../dist/formula-catalog.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const configs=e=>e.id==='electric'?[0,1,2,3].map(mode=>({mode})):e.id==='capacitor'?['charge','discharge'].map(capMode=>({capMode})):[{}];
const numeric=(d,p='')=>typeof d==='number'?[[p,d]]:d&&typeof d==='object'?Object.entries(d).flatMap(([k,v])=>numeric(v,p?p+'.'+k:k)):[];
const digest=name=>createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
const files=['dist/experiments.js','dist/models.js','dist/physics.js','dist/discovery-models.js','dist/atlas-catalog.js','dist/expansion-catalog.js','dist/parameter-domains.js','dist/measurements.js','dist/graphs.js','dist/formula-catalog.js'];
const baseSources=Object.fromEntries(['dist/models.js','dist/discovery-models.js'].map(n=>[n,fs.readFileSync(path.join(root,n),'utf8')]));
const scientificPath=process.argv.find(a=>a.startsWith('--scientific='))?.slice('--scientific='.length);
let independent=scientificPath?JSON.parse(fs.readFileSync(scientificPath,'utf8')):null;
if(process.argv.includes('--independent')){
 // Versioned numerical reference snapshot; historical audit reports remain untouched.
 // Never import product compute functions into the reference implementations.
 const {auditExperiment,references}=await import('./independent-v54/lib/experiment.mjs');
 const orbit=references.elliptic_orbit,orbitExpected=orbit.expected,orbitDomain=orbit.domain;
 orbit.domain=s=>s.axis*(1-s.eccentricity)<6371?{valid:false,kind:'model-limit',reason:'Finite Earth requires pericenter >=6371 km.'}:orbitDomain(s);
 orbit.expected=s=>({...orbitExpected(s),pericenter:s.axis*(1-s.eccentricity),domainValid:true,domainMessage:''});
 const cyclotron=references.cyclotron,cyclotronExpected=cyclotron.expected;
 cyclotron.expected=s=>({...cyclotronExpected(s),classicalSpeed:1.602176634e-19*Math.abs(s.magnetic)*s.radius/100/1.672621924e-27,domainValid:true,domainMessage:''});
 const started=new Date().toISOString(),results=[];
 for(const e of experiments)results.push(auditExperiment(e.id));
 independent={started,finished:new Date().toISOString(),scope:'Versioned independent reference snapshot; only finite-Earth domain and independently calculated diagnostics added in-memory; no browser or old unconditional focused findings.',results};
}
if(independent){assert.equal(independent.results.length,300);assert.equal(new Set(independent.results.map(r=>r.id)).size,300);assert.ok(independent.started&&independent.finished);}
assert.equal(experiments.length,300);assert.equal(new Set(experiments.map(e=>e.id)).size,300);
const entries=[],issues=[];let defaultConfigurations=0;
for(const e of experiments){
 const state=initialState(e),readouts=meters[e.id]||[];assert.ok(e.title&&e.grade&&e.formula&&formulaCatalog[e.id],e.id+' identity/formula');assert.ok(readouts.length,e.id+' measurements');assert.ok(e.params.length,e.id+' input controls');assert.ok(e.headers.length,e.id+' table');
 const defaults=[];
 for(const config of configs(e)){
  defaultConfigurations++;const before=JSON.stringify(state),d=evaluate(e.id,state,config);assert.equal(JSON.stringify(state),before,e.id+' must not mutate input');assert.ok(d&&typeof d==='object',e.id+' evaluates');assert.notEqual(d.domainValid,false,e.id+' valid default domain');
  for(const [key,v]of numeric(d))assert.ok(Number.isFinite(v),e.id+' finite default '+key);
  const values=tableValues(e.id,state,d,config);assert.equal(values.length,e.headers.length,e.id+' table schema');assert.ok(values.every(v=>v===null||typeof v!=='number'||Number.isFinite(v)),e.id+' finite table');
  for(const m of readouts){const value=Object.hasOwn(d,m.key)?d[m.key]:state[m.key];assert.ok(value===null||Number.isFinite(value),e.id+' readout '+m.key);}
  const graph=graphFor(e,state,d,config,[]);assert.ok([graph.xmin,graph.xmax,graph.ymin,graph.ymax].every(Number.isFinite),e.id+' graph bounds');assert.ok(graph.xLabel&&graph.yLabel,e.id+' graph labels');
  const derived=d=>Object.fromEntries(numeric(d).filter(([key])=>key!=='t'&&!e.params.some(p=>p.key===key)));
  const original=JSON.stringify(derived(d));let reactiveParameter=null;
  for(const p of e.params){if(reactiveParameter)break;for(const value of [p.min,(p.min+p.max)/2,p.max]){try{const trial=evaluate(e.id,{...state,[p.key]:value},config);if(trial?.domainValid===false||!trial)continue;if(JSON.stringify(derived(trial))!==original){reactiveParameter=p.key;break;}}catch(error){issues.push({id:e.id,kind:'parameter-probe-exception',key:p.key,value,error:String(error)});}}}
  defaults.push({config,status:'PASS',readouts:readouts.length,tableColumns:values.length,graphSeries:graph.series.length,graphPointCount:graph.series.reduce((n,s)=>n+s.data.length,0),reactiveParameter});
 }
 const result=independent?.results.find(r=>r.id===e.id);
 const calculationSource=e.expanded?'dist/expansion-catalog.js':e.atlas?'dist/atlas-catalog.js':baseSources['dist/models.js'].includes("case '"+e.id+"'")?'dist/models.js':'dist/discovery-models.js';
 const numericStatus=result?(result.status==='VERIFIED'?'PASS':result.status==='FAILED'?'FAIL':result.status==='PARTIAL'?'PARTIAL':'NOT TESTED'):'NOT TESTED';
 entries.push({id:e.id,title:e.title,grade:e.grade,topic:e.topic,calculation:{entry:'dist/models.js:evaluate',source:calculationSource,sharedDispatcher:true,computeKind:e.expanded||e.atlas?'per-entry compute callback':calculationSource==='dist/models.js'?'per-ID switch law, sometimes delegated to physics.js':'per-ID discovery solver'},rendering:{dispatcher:'dist/scene3d.js:buildLabModel',family:e.sourceGroup||e.scene||e.id,sharedFamily:!!(e.sourceGroup||e.scene),quantitativeGeometryStatus:'NOT TESTED in this inventory; see VISUAL_QA for selected actual-mesh checks',illustrativeClock:e.visualOnly===true},interaction:{parameterCount:e.params.length,reactiveDefaults:defaults.every(d=>d.reactiveParameter!==null),playback:isDriven(e)?'controlled parameter process':e.visualOnly?'illustrative light clock, not speed measurement':'time evolution'},measurements:{readouts:readouts.map(m=>({key:m.key,unit:m.unit})),tableColumns:e.headers.length,status:'PASS schema/default only'},graph:{declared:e.graph||null,status:'PASS finite bounds/default only'},formula:{plain:e.formula,tex:formulaCatalog[e.id]},defaults,scientific:{status:numericStatus,referenceStatus:result?.status||'NOT TESTED',sampledStates:result?.states||0,independentStates:result?.physicsStates||0,comparisons:result?.physicsPassed||0,failures:result?.physicsFailed||0,missingOutputs:result?.missingOutputs||[],domainExclusions:[...new Set(result?.domainExclusions?.map(x=>x.reason)||[])],unitsSkipped:result?.categories?.units?.SKIP||0},browserStatus:'NOT TESTED by this inventory',pedagogicalSignoff:'NOT TESTED'});
}
const summary={catalogEntries:entries.length,uniqueIDs:new Set(entries.map(e=>e.id)).size,byGrade:Object.fromEntries([10,11,12].map(g=>[g,entries.filter(e=>e.grade===g).length])),defaultConfigurations,reactiveEntries:entries.filter(e=>e.interaction.reactiveDefaults).length,illustrativeClocks:entries.filter(e=>e.rendering.illustrativeClock).length,missingMeasurementDefinitions:entries.filter(e=>!e.measurements.readouts.length).map(e=>e.id),missingGraphDefinitions:entries.filter(e=>e.defaults.some(d=>!d.graphSeries&&e.id!=='electric')).map(e=>e.id),numericStatuses:entries.reduce((o,e)=>(o[e.scientific.status]=(o[e.scientific.status]||0)+1,o),{}),issues};
assert.equal(summary.reactiveEntries,300,'Every catalog entry must have a tested parameter response');
assert.equal(issues.length,0,'Unexpected parameter-probe exceptions must be resolved');
const report={generatedAt:new Date().toISOString(),baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scope:'Working-tree snapshot; catalog IDs are not 300 independent engines. PASS is finite sampled numerical evidence, not full scientific/pedagogical/visual certification.',sourceSHA256:Object.fromEntries(files.map(n=>[n,digest(n)])),independentAudit:independent?{started:independent.started,finished:independent.finished,scope:independent.scope,sha256:createHash('sha256').update(scientificPath&&!process.argv.includes('--independent')?fs.readFileSync(scientificPath):JSON.stringify(independent)).digest('hex'),totals:independent.results.reduce((o,r)=>{for(const k of ['states','validStates','physicsStates','physicsPassed','physicsFailed','unitsPassed','unitsFailed','graphChecks','measurementChecks'])o[k]=(o[k]||0)+(r[k]||0);return o;},{})}:null,summary,entries};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'docs/audit-v54-inventory.json'),JSON.stringify(report,null,2)+'\n');
console.log('PASS catalog v54 runtime/default inventory:',JSON.stringify(summary));

if(independent?.results.some(r=>r.status==='FAILED'||(r.counts?.FAIL||0)>0))process.exitCode=1;
