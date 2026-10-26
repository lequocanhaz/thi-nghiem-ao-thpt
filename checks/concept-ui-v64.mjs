// Semantic geometry checks for the22 extended concept scenes. CPU/Canvas
// projection only: browser visibility and hardware performance need separate QA.
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {buildExtendedModel} from '../dist/extended-scenes.js';
import {EXTENDED_CONCEPTS} from '../dist/extended-concepts.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration} from '../dist/models.js';
import {projectScene} from '../dist/software-scene.js';
import * as T from '../dist/vendor/three.module.min.js';
const {document,window}=parseHTML('<html><body></body></html>');Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},measureText:s=>({width:s.length*15})});
const close=(a,b,message='mapping')=>assert.ok(Math.abs(a-b)<1e-7,`${message}: ${a} != ${b}`);
const node=(model,name)=>{const object=model.group.getObjectByName(name);assert.ok(object,name);return object;};
let statesChecked=0,vertices=0,projections=0;
for(const id of Object.keys(EXTENDED_CONCEPTS)){
 const e=experiments.find(e=>e.id===id),base=initialState(e),cases=[base];
 if(id==='damped')for(const t of [0,.01,.2,.5,1,2])cases.push({...base,a:50,period:4,beta:1.5,t});
 const end=duration(e,base,evaluate(id,base));
 if(e.params.some(p=>p.key==='t'))for(const fraction of [.125,.5,1])cases.push({...base,t:end*fraction});
 for(const p of e.params.filter(p=>p.key!=='t'))for(const value of [p.min,p.max])cases.push({...base,[p.key]:value});
 const model=buildExtendedModel(id,base,evaluate(id,base),{labels:true,config:{switches:{vectors:true}}});
 const layer=node(model,'concept-'+id);assert.equal(layer.userData.concept.principle,EXTENDED_CONCEPTS[id].principle);assert.ok(layer.children.length>0);
 assert.equal(layer.userData.conceptualReference,true,'Geometric concepts belong to the observed apparatus');layer.traverse(n=>{if(n.userData.modelLabel)assert.equal(n.userData.coordinateAid,true,'Floating text cannot distort camera fitting');});
 const childCount=layer.children.length;
 for(const s of cases){const d=evaluate(id,s);if(!d||d.domainValid===false)continue;const before=JSON.stringify({s,d});model.update(s,d,{switches:{vectors:true,trajectory:true}});model.group.updateMatrixWorld(true);
  assert.equal(JSON.stringify({s,d}),before,'Rendering may not rewrite scientific state/data: '+id);assert.equal(layer.children.length,childCount,'Reuse concept objects while updating '+id);
  layer.traverse(object=>{for(const v of object.geometry?.attributes.position?.array||[]){assert.ok(Number.isFinite(v),id+' finite concept geometry');vertices++;}assert.ok(object.position.toArray().every(Number.isFinite),id+' finite positions');if(object.userData.text)assert.doesNotMatch(object.userData.text,/NaN|Infinity|undefined/,id+' finite labels');});
  if(['uniform','acceleration','newton'].includes(id)){const dots=Array.from({length:5},(_,j)=>node(model,'equal-time-'+j));const intervals=dots.slice(1).map((n,j)=>n.userData.sampleTime-dots[j].userData.sampleTime);intervals.forEach(t=>close(t,intervals[0],'Equal time sampling'));if(id==='uniform'){const dx=dots.slice(1).map((n,j)=>n.userData.physicalX-dots[j].userData.physicalX);dx.forEach(x=>close(x,dx[0],'Uniform equal displacements'));}}
  if(['horizontal','projectile'].includes(id)){close(node(model,'landing-point').userData.range,d.range);if(id==='projectile')close(node(model,'apex-point').userData.physicalHeight,d.height);}
  if(id==='incline'){const n=node(model,'normal-force').userData.direction,f=node(model,'friction-force').userData.direction;close(n[0]*f[0]+n[1]*f[1],0,'Normal perpendicular to slope');close(node(model,'normal-force').userData.value,d.normal);}
  if(id==='collision'){const p1=node(model,'momentum-1'),p2=node(model,'momentum-2');close((p1.userData.value||0)+(p2.userData.value||0),d.momentum,'Momentum arrows preserve signed sum');}
  if(id==='lever'){close(node(model,'moment-arm-1').userData.perpendicularArm,s.l1);close(node(model,'moment-arm-2').userData.perpendicularArm,s.l2);}
  if(id==='hooke'){close(node(model,'spring-extension').userData.extension,d.extension);close(node(model,'spring-force').userData.value,d.force);close(node(model,'spring-weight').userData.value,d.force);}
  if(id==='damped')assert.ok(Math.abs(d.x)<=node(model,'amplitude-positive').userData.physicalAmplitude+1e-7,'Damped analytical envelope contains the actual zero-velocity solution');
  if(id==='standing'){const antinodes=Array.from({length:5},(_,j)=>node(model,'antinode-'+j));assert.equal(antinodes.filter(n=>n.visible).length,s.mode);antinodes.filter(n=>n.visible).forEach((n,j)=>{close(Math.abs(Math.sin(s.mode*Math.PI*n.userData.physicalX/s.length)),1,'Antinodes occur at amplitude maxima');close(n.userData.displacement,2*s.a*(j%2?-1:1)*Math.cos(2*Math.PI*d.frequency*s.t),'Antinode marker moves with the string');});}
  if(id==='sound'){const first=node(model,'sound-particle-0'),last=node(model,'sound-particle-63');close(first.userData.pressure,d.u,'Source compression matches calculated pressure phase');close(last.userData.physicalX,2*d.lambda,'Two actual wavelengths in normalized view');for(let j=0;j<64;j++){const p=node(model,'sound-particle-'+j);assert.ok(Math.abs(p.position.x-p.userData.equilibriumX)<=.04000001,'Particles oscillate locally, never travel at sound speed');close(p.position.y,1.05);close(p.position.z,0);}}
  if(['series','parallel'].includes(id)){const i1=node(model,'branch-current-1').userData.value||0,i2=node(model,'branch-current-2').userData.value||0,it=node(model,'total-current').userData.value||0;close(id==='parallel'?i1+i2:i1,it,'Circuit current conservation');if(id==='parallel'&&d.i2!==0)close(node(model,'circuit-carriers-0').userData.phaseRate/node(model,'circuit-carriers-1').userData.phaseRate,d.i1/d.i2,'Branch motion rate follows branch current');}
  if(id==='magnetic'){const a=node(model,'wire-current').userData.direction;close(a[0],Math.cos(s.angle*Math.PI/180));close(a[2],Math.sin(s.angle*Math.PI/180));}
  if(id==='induction')close(node(model,'coil-area-normal').userData.cosineWithField,d.flux/(s.b*s.area),'Magnetic flux follows surface normal');
  if(id==='decay'){close(node(model,'population-remaining').userData.fraction,d.remaining);close(node(model,'population-remaining').userData.expectedPopulation,d.N);}
  statesChecked++;
 }
 const camera=new T.PerspectiveCamera(40,1.6,.01,300);camera.position.set(8,6,10);camera.lookAt(0,1,0);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const primitives=projectScene(model.group,camera,640,400);assert.ok(primitives.length>0,id+' Canvas fallback projects model');projections++;
 model.update(base,evaluate(id,base),{switches:{vectors:false}});
 for(const name of ['normal-force','friction-force','parallel-weight','momentum-1','momentum-2','weight-1','weight-2','spring-force','spring-weight','driving-force','displacement-u1','displacement-u2','branch-current-1','branch-current-2','total-current','wire-current','coil-area-normal']){const object=model.group.getObjectByName(name);if(object)assert.equal(object.visible,false,'Honor vector toggle: '+id+'/'+name);}
}
console.log('PASS extended concepts v64',JSON.stringify({ids:Object.keys(EXTENDED_CONCEPTS).length,statesChecked,finiteVertices:vertices,canvasProjections:projections,scope:'CPU geometry/state/mapping; no browser pixels or hardware performance claim'}));
