import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration,clampState} from '../dist/models.js';
import {isDriven,processFor,advanceProcess,seekProcess,cleanProcess} from '../dist/playback.js';
import {coreParams} from '../dist/learning.js';
import {buildLabModel} from '../dist/scene3d.js';
const {document,window}=parseHTML('<body/>');globalThis.document=document;
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},arc(){},moveTo(){},lineTo(){},closePath(){},measureText:s=>({width:s.length*18})});
function fingerprint(group){const hash=createHash('sha256');group.updateMatrixWorld(true);const walk=o=>{if(!o.visible||o.userData.stageBase||o.userData.isRig||o.userData.coordinateAid)return;hash.update(JSON.stringify([o.matrixWorld.elements,o.material?.color?.getHex(),o.material?.opacity,o.material?.emissive?.getHex(),o.material?.emissiveIntensity,o.count]));for(const a of [o.geometry?.attributes?.position?.array,o.instanceMatrix?.array])if(a)hash.update(Buffer.from(a.buffer,a.byteOffset,a.byteLength));for(const child of o.children)walk(child);};walk(group);return hash.digest('hex');}
function dispose(model){model.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m?.map?.dispose();m?.dispose();}});}
const results=[];
for(const e of experiments){
 const s=clampState(e,initialState(e)),c={mode:0,capMode:'charge',dragKey:coreParams(e)[0]?.key,switches:{axes:false,labels:false,handles:false}},kind=isDriven(e)?'controlled-process':'time-or-emission';
 const d=evaluate(e.id,s,c);let model=buildLabModel(e.id,s,d,{config:c,labels:false,interactive:false});
 try{
  const frames=new Set([fingerprint(model.group)]);let changedOutputs=false;const initial=JSON.stringify(d);
  if(isDriven(e)){
   c.process=processFor(e,s,c);assert.ok(e.params.some(p=>p.key===c.process.key));
   for(let i=1;i<=32;i++){advanceProcess(e,s,c,.25);if(e.id==='electric'){dispose(model);model=buildLabModel(e.id,s,evaluate(e.id,s,c),{config:c,labels:false,interactive:false});}else model.update(s,evaluate(e.id,s,c),c);frames.add(fingerprint(model.group));if(JSON.stringify(evaluate(e.id,s,c))!==initial)changedOutputs=true;}
   assert.equal(c.process.position,1,e.id+' process completes');
   const atEnd={...s},restored=cleanProcess(e,s,c,JSON.parse(JSON.stringify(c.process)));assert.ok(restored,e.id+' process export/import');
   seekProcess(e,s,c,0);assert.ok(Math.abs(s[c.process.key]-c.process.from)<1e-10*Math.max(1,Math.abs(c.process.from)),e.id+' replay starts at its initial setting');
   seekProcess(e,s,c,1);assert.deepEqual(s,atEnd,e.id+' timeline reproduces end state');
   c.loop=true;advanceProcess(e,s,c,.5);assert.ok(c.process.position<1,e.id+' loop resumes');
  }else{
   const max=duration(e,s,d);assert.ok(Number.isFinite(max)&&max>0,e.id+' valid time span');
   for(let i=1;i<=8;i++){s.t=max*i/8;const next=evaluate(e.id,s,c);assert.ok(next,e.id+' evaluated frame');model.update(s,next,c);frames.add(fingerprint(model.group));if(JSON.stringify(next)!==initial)changedOutputs=true;}
  }
  results.push({id:e.id,kind,visibleFrames:frames.size,changedOutputs});
 }finally{dispose(model);}
}
// Exercise every selectable control, including integer catalogs (turns, levels, modes).
let selectableControls=0;
for(const e of experiments.filter(isDriven))for(const param of e.params.filter(p=>p.key!=='t')){
 const s=clampState(e,initialState(e)),c={mode:0,capMode:'charge',processKey:param.key};
 c.process=processFor(e,s,c);const key=c.process.key;
 for(let i=0;i<16;i++)advanceProcess(e,s,c,.5);
 assert.equal(c.process.key,key,e.id+' stable control');assert.equal(c.process.position,1,e.id+'.'+param.key+' completes without quantization restarts');
 assert.equal(cleanProcess(e,s,c,{...c.process,seconds:0}),undefined);selectableControls++;
}
const frozen=results.filter(r=>r.visibleFrames<2);console.log('Frozen apparatus:',JSON.stringify(frozen));
const report={total:results.length,selectableControls,controlledProcesses:results.filter(r=>r.kind==='controlled-process').length,timeOrEmission:results.filter(r=>r.kind!=='controlled-process').length,changedApparatus:results.filter(r=>r.visibleFrames>1).length,scope:'Real model geometry/material changes, finite evaluation, replay/loop/serialization. No browser or device pixels.',results};
writeFileSync(new URL('./playback-audit-v32.json',import.meta.url),JSON.stringify(report,null,2)+'\n');assert.equal(results.length,300);assert.equal(frozen.length,0,'Every activity must visibly change its apparatus rather than only advance a clock.');console.log('PASS 300 playback activities',JSON.stringify({...report,results:undefined}));
