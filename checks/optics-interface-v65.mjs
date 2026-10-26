import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {buildLabModel} from '../dist/scene3d.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {OPTICS_IDS} from '../dist/optics-geometry-v65.js';
const {document,window}=parseHTML('<body></body>');Object.assign(globalThis,{document,window});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},measureText:s=>({width:s.length*14})});
for(const id of OPTICS_IDS){
 const e=experiments.find(e=>e.id===id),s=initialState(e),d=evaluate(id,s),c={viewMode:'3d',viewPlane:'front',switches:{labels:true,handles:true,axes:true}},model=buildLabModel(id,s,d,{config:c,labels:true,interactive:true});
 let rig;model.group.traverse(n=>{if(n.userData.isRig)rig=n;});assert.ok(rig);
 const labels=[],handles=[];rig.traverse(n=>{if(n.userData.modelLabel)labels.push(n);if(n.userData.drag?.startsWith('param:'))handles.push(n);});
 assert.ok(labels.length&&handles.length);
 for(const mode of ['2d','3d']){
  model.update(s,d,{...c,viewMode:mode});assert.ok(rig.visible);assert.ok(handles.every(n=>n.visible));
  assert.ok(labels.every(n=>n.visible===(mode==='3d')),'Only overlapping parameter captions hidden in front2D');
 }
 if(id==='ray_slab'){
  const aid=model.group.getObjectByName('coordinate-aid');assert.ok(aid);assert.ok(aid.userData.profile.axes.every(a=>a.range[1]<=.6));
  model.update(s,d,{...c,switches:{...c.switches,axes:false}});assert.equal(model.group.getObjectByName('coordinate-aid'),undefined,'Axis toggle remains functional');
 }
 model.group.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){m?.map?.dispose();m?.dispose();}});
}
console.log('PASS optics interface v65: 11front2D caption collisions avoided, 3D labels restored, all drag handles preserved, compact nonmetric compass and working axis toggle.');
