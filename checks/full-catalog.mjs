import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,clampState,duration} from '../dist/models.js';
import {meters,tableValues} from '../dist/measurements.js';
import {buildLabModel} from '../dist/scene3d.js';
const{document,window}=parseHTML('<body/>');globalThis.document=document;
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});
const report={experiments:[],failures:[],states:0,geometry:0};
function finiteTree(value,path){if(typeof value==='number')assert.ok(Number.isFinite(value),path);else if(value&&typeof value==='object')for(const[k,v]of Object.entries(value))finiteTree(v,path+'.'+k);}
function geometry(model,id){model.group.updateMatrixWorld(true);model.group.traverse(o=>{for(const a of [o.matrixWorld.elements,o.geometry?.attributes.position?.array,o.isInstancedMesh?o.instanceMatrix.array:null])if(a)for(const n of a)assert.ok(Number.isFinite(n),id+' non-finite geometry');});report.geometry++;}
for(const e of experiments){const out={id:e.id,states:0,failures:[]},base=initialState(e),configs=e.id==='electric'?[0,1,2,3].map(mode=>({mode})):e.id==='capacitor'?['charge','discharge'].map(capMode=>({capMode})): [{}];
 for(const rawConfig of configs){const config={mode:0,capMode:'charge',switches:{handles:true,labels:false,vectors:true,trajectory:true},...rawConfig};let model;
 try{model=buildLabModel(e.id,base,evaluate(e.id,base,config),{labels:false,config});
 const states=[base,...e.presets.map(p=>({...base,...p.values}))];
 for(const p of e.params.filter(p=>p.key!=='t'))for(const value of [p.min,(p.min+p.max)/2,p.max])states.push({...base,[p.key]:value});
 for(let corner=0;corner<4;corner++)states.push(Object.fromEntries(e.params.map((p,i)=>[p.key,p.key==='t'?0:(i+corner)%3===0?p.min:(i+corner)%3===1?p.max:p.value])));
 for(const raw of states){const s=clampState(e,{...raw}),d=evaluate(e.id,s,config),max=duration(e,s,d);assert.ok(Number.isFinite(max)&&max>0,e.id+' invalid duration');
 for(const fraction of e.static&&!e.visualOnly?[0]:[0,.217,.731,1]){s.t=max*fraction;const data=evaluate(e.id,s,config);finiteTree(data,e.id);if(data){const values=tableValues(e.id,s,data,config);assert.equal(values.length,e.headers.length,e.id+' columns');finiteTree(values,e.id+' table');}
 for(const m of meters[e.id]){const value=data?(Object.hasOwn(data,m.key)?data[m.key]:s[m.key]):null;assert.ok(value===null||Number.isFinite(value),e.id+' missing meter '+m.key);}
 model.update(s,data,config);geometry(model,e.id);out.states++;report.states++;
 }
 }
 }catch(error){out.failures.push(String(error));report.failures.push({id:e.id,error:String(error)});}finally{model?.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});}
 }
 report.experiments.push(out);console.log(e.id,out.states,out.failures.length?'FAIL':'PASS');
}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));
console.log(JSON.stringify({experiments:report.experiments.length,states:report.states,geometry:report.geometry,failures:report.failures},null,2));assert.equal(report.failures.length,0);
