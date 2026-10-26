import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration} from '../dist/models.js';
import {buildLabModel} from '../dist/scene3d.js';
import {FOUNDATION_CONCEPTS,foundationPrediction} from '../dist/foundation-concepts.js';
import {apparatusBounds} from '../dist/camera-fit.js';
const {document,window}=parseHTML('<html><body></body></html>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},measureText:s=>({width:s.length*14})});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const scope=experiments.slice(60).filter(e=>e.extra!==true);
assert.equal(scope.length,61);assert.deepEqual(new Set(scope.map(e=>e.id)),new Set(Object.keys(FOUNDATION_CONCEPTS)));
const protectedFiles=JSON.parse(fs.readFileSync(new URL('./concept-preservation-v64.json',import.meta.url),'utf8'));
for(const [path,expected]of Object.entries(protectedFiles))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),expected,'Scientific calculation/catalog/session contract unchanged: '+path);
const dispose=model=>model.group.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){m?.map?.dispose();m?.dispose();}});
let states=0,points=0;
for(const e of scope){
 const base={...initialState(e),t:0},data=evaluate(e.id,base),model=buildLabModel(e.id,base,data,{labels:false});
 const layer=model.group.getObjectByName('foundation-concept-'+e.id);assert.ok(layer,e.id+' observation layer');
 const curve=layer.getObjectByName('foundation-prediction-curve'),buffer=curve.geometry.attributes.position.array;
 const cases=[base,...e.params.flatMap(p=>[p.min,p.max].map(v=>({...base,[p.key]:v})))];
 if(e.params.some(p=>p.key==='t'))cases.push({...base,t:duration(e,base,data)*.5});
 for(const s of cases){
  const d=evaluate(e.id,s),before=JSON.stringify({s,d});if(!d||d.domainValid===false)continue;
  model.update(s,d,{switches:{vectors:true}});model.group.updateMatrixWorld(true);
  assert.equal(before,JSON.stringify({s,d}),'Observation must not mutate measurements');
  assert.equal(curve.geometry.attributes.position.array,buffer,'Retain plot buffer');
  model.group.traverse(n=>{
   assert.ok([...n.position.toArray(),...n.scale.toArray(),...n.quaternion.toArray()].every(Number.isFinite),e.id+' finite transforms');
   assert.ok((n.geometry?.attributes.position?.array||[]).every(Number.isFinite),e.id+' finite mesh');
   if(n.userData.text)assert.doesNotMatch(n.userData.text,/NaN|undefined|Infinity/,e.id+' labels');
  });
  const metadata=layer.userData.foundationConcept,[input,output]=FOUNDATION_CONCEPTS[e.id];
  close(metadata.current[0],s[input]);close(metadata.current[1],d[output]);
  const p=foundationPrediction(e,s);
  for(const point of p.points)if(point){assert.ok(point.every(Number.isFinite));points++;}
  if(['vector_sum','vector_components'].includes(e.id)){
   const vectors=model.group.userData.vectorDiagram;
   vectors.resultant.forEach((n,i)=>close(n,vectors.first[i]+vectors.second[i]));
   close(Math.hypot(...vectors.resultant),e.id==='vector_sum'?d.result:s.force);
  }
  if(e.id==='atwood'){
   const v=layer.userData.foundationForces.vectors;
   close(v[0][1]+v[1][1],s.m1*d.acc);close(v[2][1]+v[3][1],-s.m2*d.acc);
  }
  if(e.id==='three_strings'){
   const v=layer.userData.foundationForces.vectors;for(let i=0;i<3;i++)close(v.reduce((sum,row)=>sum+row[i],0),0);
  }
  if(e.id==='accelerating_pendulum'){
   const v=layer.userData.foundationForces.vectors;close(v[0][1]+v[1][1],0);close(v[1][0],s.mass*s.acc);
  }
  if(['capacitor_series','capacitor_parallel'].includes(e.id)){
   const n=model.group.userData.capacitorNetwork;assert.equal(n.steadyCurrent,0);
   assert.equal(n.topology,e.id.endsWith('series')?'series':'parallel');
   if(n.topology==='series'){close(n.charges[0],n.charges[1]);close(n.voltages[0]+n.voltages[1],s.voltage);}
   else{close(n.voltages[0],s.voltage);close(n.voltages[1],s.voltage);close(n.charges[0]+n.charges[1],(s.c1+s.c2)*s.voltage);}
   assert.equal(model.group.getObjectByName('network-capacitor-1').children.filter(n=>n.isMesh).length,2,'Actual pair of plates');
  }
  const b=apparatusBounds(model.group);assert.ok((e.id==='charge_quantization'&&s.electrons===0)||(!b.isEmpty()&&[...b.min.toArray(),...b.max.toArray()].every(Number.isFinite)),e.id+' finite apparatus bounds');states++;
 }
 model.update(base,data,{switches:{vectors:false}});
 for(let i=0;i<4;i++)assert.equal(layer.getObjectByName('foundation-force-'+i).visible,false,e.id+' vector preference');
 dispose(model);
}
// Independent analytical references for representative relations, without calling
// the production evaluator to obtain the expected values.
const value=(id,changes={})=>{const e=experiments.find(e=>e.id===id),s={...initialState(e),...changes};return foundationPrediction(e,s).current[1];};
close(value('vector_sum',{force:3,second:4,angle:90}),5);
close(value('vector_components',{force:10,angle:60}),5);
close(value('atwood',{m1:1,m2:3}),9.81/2);
close(value('elevator',{mass:2,acc:-9.81}),0);
close(value('spring_energy',{stiffness:50,extension:.2}),1);
close(value('hydraulic_press',{force:10,small:2,large:30}),150);
close(value('spring_period',{mass:1,stiffness:40}),2*Math.PI/Math.sqrt(40));
close(value('capacitor_series',{c1:20,c2:30,voltage:12}),7.2);
close(value('capacitor_parallel',{c1:20,c2:30,voltage:12}),360);
close(value('wire_field',{current:-5,distance:.05}),-20);
close(value('sliding_rod',{speed:2,magnetic:.5,length:.5,resistance:5}),-.025);
close(value('beam_supports',{load:80,beamWeight:40,position:.3}),44);
close(value('charge_quantization',{electrons:0}),0);
close(value('potential_point',{charge:0,distance:1}),0);
close(value('flux_angle',{angle:90}),0);
console.log('PASS foundation v64:',JSON.stringify({ids:61,states,finitePredictionPoints:points,independentLaws:15,scientificFilesProtected:Object.keys(protectedFiles).length,scope:'CPU geometry and independent selected laws; browser and teacher review separate'}));
