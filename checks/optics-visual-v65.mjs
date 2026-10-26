import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {T,V} from '../dist/geometry-kit.js';
import {buildOpticsModel,OPTICS_IDS} from '../dist/optics-scenes-v65.js';
import {apparatusBounds,frameApparatus,boundsInView} from '../dist/camera-fit.js';
import {projectScene} from '../dist/software-scene.js';

const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-6*Math.max(1,Math.abs(b)),`${message}: ${a} ≠ ${b}`);
const dispose=model=>model.group.traverse(node=>{node.geometry?.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material])m?.dispose();});
let states=0,rays=0,projections=0;
assert.equal(new Set(OPTICS_IDS).size,11,'Explicit remaining optics scope');
for(const id of OPTICS_IDS){
 const e=experiments.find(e=>e.id===id),base={...initialState(e),t:0};
 const model=buildOpticsModel(id,base,evaluate(id,base),{labels:false});
 const cases=[base,...e.params.flatMap(p=>[p.min,p.max].map(value=>({...base,[p.key]:value})))];
 if(id==='pinhole')cases.push({...base,distance:e.params.find(p=>p.key==='distance').max,screen:e.params.find(p=>p.key==='screen').min,height:e.params.find(p=>p.key==='height').min});
 if(id==='lenses_contact')cases.push({...base,power1:-4,power2:1},{...base,power1:-4,power2:4});
 for(const state of cases){
  const data=evaluate(id,state),before=JSON.stringify({state,data});model.update(state,data,{switches:{labels:false}});
  assert.equal(JSON.stringify({state,data}),before,id+' renderer preserves measurements and parameters');
  const geometry=model.group.userData.opticsGeometry,projection=model.group.userData.opticsProjection;
  assert.equal(projection.metricScale,'uniform');assert.ok(Number.isFinite(projection.scale)&&projection.scale>0);
  const project=p=>V((p.x-projection.origin.x)*projection.scale,projection.worldOrigin.y+(p.y-projection.origin.y)*projection.scale,.12);
  model.group.updateMatrixWorld(true);
  model.group.traverse(node=>{
   assert.ok([...node.position.toArray(),...node.scale.toArray(),...node.quaternion.toArray()].every(Number.isFinite),id+' finite transforms');
   assert.ok((node.geometry?.attributes.position?.array||[]).every(Number.isFinite),id+' finite vertices');
  });
  for(const segment of geometry.segments){
   const parent=model.group.getObjectByName('optics-ray-'+segment.id);assert.ok(parent,id+' actual ray '+segment.id);
   const virtual=segment.dashed||['virtual','guide','normal'].includes(segment.role),ray=parent.children.find(n=>virtual?n.isLine:n.isMesh);
   if(project(segment.from).distanceTo(project(segment.to))<1e-8)continue;
   assert.ok(ray,id+' drawn ray '+segment.id);const expected=[project(segment.from),project(segment.to)];
   const actual=virtual?[V().fromBufferAttribute(ray.geometry.attributes.position,0).applyMatrix4(ray.matrixWorld),V().fromBufferAttribute(ray.geometry.attributes.position,1).applyMatrix4(ray.matrixWorld)]:[V(0,-.5,0).applyMatrix4(ray.matrixWorld),V(0,.5,0).applyMatrix4(ray.matrixWorld)];
   for(let i=0;i<2;i++)for(const key of ['x','y','z'])close(actual[i][key],expected[i][key],id+' unclamped ray '+segment.id+' '+key);
   if(virtual)assert.equal(ray.material.isLineDashedMaterial,true,id+' back extensions use dashed strokes');
   rays++;
  }
  for(const element of geometry.elements){if(element.type==='aperture'){const part=model.group.getObjectByName('optics-aperture-'+element.id);assert.ok(part.children.some(node=>node.visible&&node.isMesh),id+' pinhole mask remains drawn when the aperture is tiny');}}
  for(const marker of geometry.markers){
   const part=model.group.getObjectByName('optics-marker-'+marker.id);assert.ok(part,id+' actual marker '+marker.id);
   const arrow=part.getObjectByName('optics-object-image-arrow');
   if(Number.isFinite(marker.height)&&Math.abs(marker.height)>1e-12){assert.ok(arrow,id+' actual object/image arrow');const expected=project(marker);expected.z=.17;close(arrow.position.x,expected.x,id+' marker x');close(arrow.position.y,expected.y,id+' marker y');}
  }
  if(geometry.image?.kind==='infinite')assert.equal(geometry.markers.some(m=>m.type==='image'),false,id+' no finite image at infinity');
  if(id==='lenses_contact'&&data.power<0)assert.ok(geometry.segments.some(s=>s.role==='virtual'),'D < 0 has backward virtual focus construction');
  const bounds=apparatusBounds(model.group);assert.ok(!bounds.isEmpty());
  for(const [width,height]of [[350,360],[1060,470]])for(const mode of ['perspective','orthographic']){
   const camera=mode==='orthographic'?new T.OrthographicCamera(-6,6,4,-4,.01,500):new T.PerspectiveCamera(40,width/height,.05,100);
   camera.aspect=width/height;camera.position.set(...(mode==='orthographic'?[0,1.9,12]:[7,6.5,8]));
   const controls={target:V(0,1.9,0),update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};
   frameApparatus(camera,controls,model.group);assert.ok(boundsInView(camera,bounds,.861),id+' fit in '+mode+' '+width);
   const primitives=projectScene(model.group,camera,width,height);assert.ok(primitives.length>0,id+' software projection');
   assert.ok(primitives.some(p=>p.kind==='line'||p.kind==='face'),id+' actual software apparatus');projections++;
  }
  states++;
 }
 // A continuous sweep keeps mesh/material/position/dash buffers after warm-up.
 const input=e.params[0],sweep=[...Array(48)].map((_,i)=>({...base,[input.key]:input.min+(input.max-input.min)*(i+1)/50}));
 for(const state of sweep)model.update(state,evaluate(id,state),{switches:{labels:false}});
 const resources=new Map();model.group.traverse(node=>{if(node.geometry)resources.set(node.uuid,[node.geometry,node.material,node.geometry.attributes.position,node.geometry.attributes.lineDistance]);});
 for(const state of sweep){model.update(state,evaluate(id,state),{switches:{labels:false}});model.group.traverse(node=>{if(!node.geometry)return;const previous=resources.get(node.uuid);assert.ok(previous,id+' retained object through continuous parameter sweep');assert.equal(node.geometry,previous[0],id+' retained geometry');assert.equal(node.material,previous[1],id+' retained material');assert.equal(node.geometry.attributes.position,previous[2],id+' retained positions');assert.equal(node.geometry.attributes.lineDistance,previous[3],id+' retained dash distances');});}
 model.update(cases.at(-1),evaluate(id,cases.at(-1)),{switches:{labels:false}});
 const firstChild=model.group.getObjectByName('optics-apparatus').children[0];model.update({...cases.at(-1),t:8},evaluate(id,{...cases.at(-1),t:8}),{switches:{labels:false}});
 assert.equal(model.group.getObjectByName('optics-apparatus').children[0],firstChild,id+' clock alone retains scene objects');
 assert.equal(model.group.userData.opticsObservation.id,id);dispose(model);
}
console.log('PASS optics visual v65',JSON.stringify({ids:OPTICS_IDS.length,states,rays,projections,scope:'CPU actual mesh/line endpoints, uniform metric scale, signed/infinite image markers, camera fit and Canvas fallback projection; browser pixels separately'}));
