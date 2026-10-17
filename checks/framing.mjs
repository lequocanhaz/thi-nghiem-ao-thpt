import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration} from '../dist/models.js';
import {buildLabModel,LabScene} from '../dist/scene3d.js';
import {apparatusBounds,frameApparatus} from '../dist/camera-fit.js';
const {document,window}=parseHTML('<body/>');globalThis.document=document;
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});
const corners=b=>[b.min.x,b.max.x].flatMap(x=>[b.min.y,b.max.y].flatMap(y=>[b.min.z,b.max.z].map(z=>new T.Vector3(x,y,z))));
const cfg={switches:{light:true,axes:true,handles:true,labels:false,vectors:true,trajectory:true,lines:true,resultant:true,components:true}};
let cases=0,previouslyCropped=0,issues=[];
for(const e of experiments){
 const first=initialState(e),states=[first,...e.presets.map(p=>({...first,...p.values})),{...first,t:duration(e,first,evaluate(e.id,first,cfg))*.45}];
 for(let index=0;index<states.length;index++){
  const s=states[index],model=buildLabModel(e.id,s,evaluate(e.id,s,cfg),{config:cfg,labels:false,interactive:true});
  const bounds=apparatusBounds(model.group);assert.ok(!bounds.isEmpty(),e.id+' visible apparatus');
  for(const [width,height]of [[324,360],[728,420],[990,500]])for(const view of ['iso','front','top']){
   const camera=new T.PerspectiveCamera(40,width/height,.05,100),y=e.id==='electric'?0:1.25;
   camera.position.set(...(view==='front'?[0,y,11]:view==='top'?[.01,y+11,.01]:[7,y+4.6,8]));camera.lookAt(0,y,0);camera.updateMatrixWorld(true);
   const controls={target:new T.Vector3(0,y,0),update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};
   if(index===0&&view==='iso'&&corners(bounds).some(p=>{const q=p.project(camera);return Math.abs(q.x)>1||Math.abs(q.y)>1;}))previouslyCropped++;
   assert.equal(frameApparatus(camera,controls,model.group),true);camera.updateMatrixWorld(true);
   const projected=corners(bounds).map(p=>p.project(camera));
   const overflow=projected.some(p=>![p.x,p.y,p.z].every(Number.isFinite)||Math.abs(p.x)>.86001||Math.abs(p.y)>.86001||p.z<-1||p.z>1);
   if(overflow)issues.push({id:e.id,index,width,view,range:projected.map(p=>p.toArray())});cases++;
  }
  model.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m?.map?.dispose();m?.dispose();}});
 }
}
assert.equal(issues.length,0,JSON.stringify(issues.slice(0,3)));
// Hidden large geometry and a studio base must not shrink the apparatus.
const group=new T.Group(),tiny=new T.Mesh(new T.BoxGeometry(2,2,2),new T.MeshBasicMaterial()),hidden=new T.Group(),big=new T.Mesh(new T.BoxGeometry(1000,1000,1000),new T.MeshBasicMaterial());hidden.add(big);hidden.visible=false;group.add(tiny,hidden);const base=big.clone();base.userData.stageBase=true;group.add(base);assert.deepEqual(apparatusBounds(group).getSize(new T.Vector3()).toArray(),[2,2,2]);
// Run the actual view/zoom/resize methods on a camera with a simulated renderer.
const stage=Object.create(LabScene.prototype),camera=new T.PerspectiveCamera(40,2,.05,100);Object.assign(stage,{camera,id:'ohm',model:{group},controls:{target:new T.Vector3(),update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}},renderer:{getPixelRatio:()=>1,setSize(){}},container:{clientWidth:324,clientHeight:360}});stage.view('front');assert.equal(stage.autoFrame,true);stage.resize();const projected=corners(apparatusBounds(group)).map(p=>p.project(camera));assert.ok(projected.every(p=>Math.abs(p.x)<.87&&Math.abs(p.y)<.87));stage.zoom('in');assert.equal(stage.autoFrame,false);stage.fitView();assert.equal(stage.autoFrame,true);
const report={experiments:experiments.length,cases,previouslyCropped,issues:issues.length,method:'Projection of all 8 visible apparatus bounds corners, 3 aspect ratios × 3 views; defaults, presets and 45% model time. No browser/GPU pixels.'};fs.writeFileSync(new URL('./framing-audit-v28.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('PASS',JSON.stringify(report));

// Expanded parameters refit only while automatic framing is enabled, and never mid-drag.
const changing=Object.create(LabScene.prototype);Object.assign(changing,{scene:new T.Scene(),camera:new T.PerspectiveCamera(40,.9,.05,100),controls:{target:new T.Vector3(),update(){changing.camera.lookAt(this.target);changing.camera.updateMatrixWorld(true);}},grid:new T.Group(),shadowFloor:new T.Group(),interaction:true,renderer:{domElement:{style:{}}}});
const pendulum=experiments.find(e=>e.id==='pendulum'),first=initialState(pendulum);changing.update(pendulum.id,first,evaluate(pendulum.id,first,cfg),cfg);const expanded={...first,length:pendulum.params.find(p=>p.key==='length').max};changing.update(pendulum.id,expanded,evaluate(pendulum.id,expanded,cfg),cfg);assert.ok(corners(apparatusBounds(changing.model.group)).map(p=>p.project(changing.camera)).every(p=>Math.abs(p.x)<.87&&Math.abs(p.y)<.87));const still=changing.camera.position.clone();changing.drag={key:'param:length'};changing.update(pendulum.id,first,evaluate(pendulum.id,first,cfg),cfg);assert.ok(changing.camera.position.equals(still));changing.drag=null;changing.autoFrame=false;changing.update(pendulum.id,expanded,evaluate(pendulum.id,expanded,cfg),cfg);assert.ok(changing.camera.position.equals(still));console.log('PASS automatic framing follows expanded numerical parameters, preserves user view and remains fixed during direct dragging. CPU projection only.');
