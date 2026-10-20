// Actual Three.js model updates on CPU; this does not test WebGL pixels.
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {LabScene} from '../dist/scene3d.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {field3d} from '../dist/physics.js';
import {projectScene} from '../dist/software-scene.js';

const {document,window}=parseHTML('<html><body></body></html>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});
const camera=new T.PerspectiveCamera(40,1.5,.05,100);camera.position.set(8,5,9);camera.zoom=1.4;
const stage=Object.create(LabScene.prototype);
Object.assign(stage,{scene:new T.Scene(),camera,grid:{position:new T.Vector3(),scale:new T.Vector3(1,1,1)},shadowFloor:{position:new T.Vector3()},controls:{target:new T.Vector3(.3,.4,.5)},view(){},autoFrame:false,projection:'3d',signature:'',id:null,model:null});
const e=experiments.find(e=>e.id==='electric');
const s={...initialState(e),q1:5,q2:-3,x1:-.12,y1:0,z1:0,x2:.12,y2:0,z2:0,px:.18,py:.13,pz:.02};
const c={mode:0,viewMode:'3d',switches:{labels:false,handles:true,axes:true,grid:true,connections:true,components:true,resultant:true,parallelogram:true,lines:true}};
const position=camera.position.clone(),target=stage.controls.target.clone(),zoom=camera.zoom;
function update(){const before=structuredClone(s),d=evaluate(e.id,s,c);stage.update(e.id,s,d,c);assert.deepEqual(s,before,'Rendering must not mutate model parameters');assert.ok(camera.position.equals(position),'Manual camera position survives model updates');assert.ok(stage.controls.target.equals(target),'Manual pan survives model updates');assert.equal(camera.zoom,zoom);assert.equal(stage.autoFrame,false);return d;}
function layers(){const fields=stage.model.group.getObjectByName('electric-field-lines');assert.ok(fields);return {fields,vectors:fields.parent.children.filter(o=>o instanceof T.ArrowHelper),paths:fields.children.filter(o=>o.isLine)};}
function finiteGeometry(){stage.model.group.traverse(o=>{for(const n of o.geometry?.attributes.position?.array||[])assert.ok(Number.isFinite(n),'No nonfinite geometry after electric transition');});}
let previous;
for(let mode=0;mode<4;mode++){
 c.mode=mode;Object.assign(s,{q1:5,q2:-3,x1:-.12,y1:0,z1:0,x2:.12,y2:0,z2:0,px:.18,py:.13,pz:.02});
 const data=update();assert.equal(data.unit,[0,2].includes(mode)?'N':'N/C');
 const model=stage.model;assert.notEqual(model,previous,'Changing electric mode replaces its apparatus');previous=model;
 const {fields,vectors,paths}=layers();assert.equal(vectors.length,3);assert.ok(paths.length>0);assert.ok(vectors.some(o=>o.visible));
 const buffers=paths.map(o=>o.geometry.attributes.position.array),revision=fields.userData.revisions;
 if(mode!==0){s.px+=.01;update();assert.equal(stage.model,model);assert.equal(fields.userData.revisions,revision,'Probe motion must not retrace source-only field lines');}
 const beforeSource=paths[0].geometry.attributes.position.array.slice();s.x1-=.02;update();assert.equal(stage.model,model);assert.ok(fields.userData.revisions>revision);assert.notDeepEqual(paths[0].geometry.attributes.position.array,beforeSource,'Moving a source changes field geometry');
 paths.forEach((path,i)=>assert.equal(path.geometry.attributes.position.array,buffers[i],'Source updates reuse allocated vertex buffers'));
 c.switches.lines=false;c.switches.components=false;c.switches.resultant=false;c.switches.connections=false;c.switches.parallelogram=false;update();assert.equal(stage.model,model);assert.equal(fields.visible,false);assert.ok(vectors.every(o=>!o.visible));
 // A source moved while hidden must be traced when lines are enabled again.
 const hiddenRevision=fields.userData.revisions;s.y1=.02;update();assert.equal(fields.userData.revisions,hiddenRevision);Object.assign(c.switches,{lines:true,components:true,resultant:true,connections:true,parallelogram:true});update();assert.equal(stage.model,model);assert.equal(fields.visible,true);assert.ok(fields.userData.revisions>hiddenRevision);
 const valid={...s};if(mode===0)Object.assign(s,{x2:s.x1,y2:s.y1,z2:s.z1});else Object.assign(s,{px:s.x1,py:s.y1,pz:s.z1});
 assert.equal(update(),null);assert.equal(stage.model,model);assert.ok(vectors.every(o=>!o.visible),'Undefined field hides stale force/resultant arrows');finiteGeometry();
 Object.assign(s,valid);assert.ok(update());assert.ok(vectors.some(o=>o.visible),'Arrows recover after leaving singularity');
 s.q1=s.q2=0;const zero=update();assert.equal(zero.magnitude,0);assert.ok(vectors.every(o=>!o.visible),'Zero fields never leave stale arrows');assert.ok(layers().paths.every(o=>!o.visible),'Zero sources hide old traced paths');finiteGeometry();
}
// Exact cancellation at the midpoint: components exist, resultant is zero.
c.mode=3;Object.assign(s,{q1:5,q2:5,x1:-.12,y1:0,z1:0,x2:.12,y2:0,z2:0,px:0,py:0,pz:0});
const cancellation=update();assert.equal(cancellation.magnitude,0);const {vectors}=layers();assert.ok(vectors[0].visible&&vectors[1].visible);assert.equal(vectors[2].visible,false);finiteGeometry();
// Reference the old Vector3-based integration independently of the new buffer
// updater. Check both the positive and negative source's first traced path.
c.mode=3;Object.assign(s,{q1:5,q2:-3,x1:-.12,y1:0,z1:0,x2:.12,y2:0,z2:0,px:.18,py:.13,pz:.02});update();
const charges=[{q:s.q1*1e-9,x:s.x1,y:s.y1,z:s.z1},{q:s.q2*1e-9,x:s.x2,y:s.y2,z:s.z2}];
for(const [sourceIndex,source]of charges.entries()){
 const zz=1-1/18,r=Math.sqrt(1-zz*zz),direction=Math.sign(source.q),points=[];
 let x=source.x+.027*r,y=source.y+.027*zz,z=source.z;
 for(let k=0;k<215;k++){
  if(Math.abs(x)>.55||Math.abs(y)>.40||Math.abs(z)>.40)break;
  const parts=charges.map(q=>field3d(q.q,q.x,q.y,q.z,x,y,z));if(parts.some(v=>!v))break;
  const field=parts.reduce((sum,v)=>sum.add(new T.Vector3(v.x,v.y,v.z)),new T.Vector3());if(field.length()<1e-9)break;field.normalize();points.push([x*8,y*8,z*8]);
  x+=direction*.007*field.x;y+=direction*.007*field.y;z+=direction*.007*field.z;
  if(k>3&&charges.some(q=>Math.hypot(x-q.x,y-q.y,z-q.z)<.025))break;
 }
 const path=layers().paths[sourceIndex*18];assert.equal(path.geometry.drawRange.count,points.length,'Field-line integration preserves legacy stopping condition');
 points.flat().forEach((value,i)=>assert.ok(Math.abs(path.geometry.attributes.position.array[i]-value)<1e-6,'Field path agrees with independent legacy integration within Float32 rounding'));
}
// The Canvas fallback must not draw unused capacity in persistent line buffers.
const scene=new T.Scene(),geometry=new T.BufferGeometry(),vertices=new Float32Array(215*3);
for(let i=0;i<215;i++){vertices[i*3]=i/215-.5;vertices[i*3+1]=i/430;}
geometry.setAttribute('position',new T.BufferAttribute(vertices,3));geometry.setDrawRange(5,10);scene.add(new T.Line(geometry,new T.LineBasicMaterial()));
const projectionCamera=new T.PerspectiveCamera(40,1.5,.05,100);projectionCamera.position.z=5;projectionCamera.lookAt(0,0,0);
let projected=projectScene(scene,projectionCamera,600,400);assert.equal(projected.length,1);assert.equal(projected[0].points.length,10,'Canvas fallback respects drawRange for non-indexed lines');
geometry.setIndex(Array.from({length:30},(_,i)=>29-i));geometry.setDrawRange(3,10);projected=projectScene(scene,projectionCamera,600,400);assert.equal(projected[0].points.length,10,'Indexed line drawRange also limits fallback projection');
const expected=new T.Vector3(vertices[26*3],vertices[26*3+1],0).project(projectionCamera);assert.ok(Math.abs(projected[0].points[0][0]-(expected.x+1)*300)<1e-8,'Indexed drawRange starts at its actual first index');
geometry.dispose();
console.log('PASS v52 electric: four modes/units, persistent models/buffers, field invalidation and legacy-path equivalence, singular/zero recovery, manual camera preservation and Canvas drawRange. CPU geometry only; no WebGL pixels.');
