import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {STUDIO_SIZE,STUDIO_DIVISIONS,SPACE_FACTOR,MIN_SPACE_ZOOM} from '../dist/simulation-space.js';
import {LabScene,buildLabModel} from '../dist/scene3d.js';
import {apparatusBounds,frameApparatus} from '../dist/camera-fit.js';
import {coordinateProfile} from '../dist/coordinates.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
const {document,window}=parseHTML('<body/>');globalThis.document=document;
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});
assert.equal(STUDIO_SIZE/18,10);assert.equal(STUDIO_DIVISIONS/36,10);assert.equal(SPACE_FACTOR,10);
const cfg={switches:{axes:true,trajectory:true,vectors:true,handles:true,labels:false}};
const phones=[[320,568],[375,667],[390,844],[393,852],[402,874],[414,896],[430,932],[440,956],[667,375],[844,390],[852,393],[874,402],[896,414],[932,430],[956,440]];
let projections=0,trajectories=0;
for(const id of ['horizontal','projectile']){
 const e=experiments.find(e=>e.id===id),first=initialState(e),params=e.params.filter(p=>p.key!=='t');
 const values=[first,...e.presets.map(p=>({...first,...p.values})),{...first,...Object.fromEntries(params.map(p=>[p.key,p.max]))},{...first,...Object.fromEntries(params.map(p=>[p.key,p.min]))},...(id==='horizontal'?[{...first,h0:31.55,v0:29.26}]:[])];
 for(const s of values){
  const d=evaluate(id,s),profile=coordinateProfile(id,s),xr=profile.axes[0].range,yr=profile.axes[1].range;
  assert.ok(d.range<=xr[1]&&Math.max(s.h0||0,d.height||0)<=yr[1],id+' full-flight grid');
  for(let i=0;i<=100;i++){const q=evaluate(id,{...s,t:d.duration*i/100});assert.ok(q.x>=xr[0]-1e-8&&q.x<=xr[1]+1e-8&&q.y>=yr[0]-1e-8&&q.y<=yr[1]+1e-8);trajectories++;}
  const model=buildLabModel(id,s,d,{config:cfg,interactive:true});
  for(const [w,h]of phones)for(const ortho of [false,true]){
   const camera=ortho?new T.OrthographicCamera(-6,6,4,-4,.01,500):new T.PerspectiveCamera(40,w/h,.05,100);camera.aspect=w/h;camera.position.set(0,3,20);const controls={target:new T.Vector3(0,3,0),update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};
   frameApparatus(camera,controls,model.group);const b=apparatusBounds(model.group);for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.861&&Math.abs(p.y)<.861&&Math.abs(p.z)<1,'uncropped phone projection');}
   const stage=Object.assign(Object.create(LabScene.prototype),{model,camera,controls}),distance=camera.position.distanceTo(controls.target);stage.spaceView();
   if(ortho)assert.equal(camera.zoom,.1);else assert.ok(Math.abs(camera.position.distanceTo(controls.target)/distance-10)<1e-6);
   assert.equal(stage.autoFrame,false);stage.fitView();assert.equal(stage.autoFrame,true);if(ortho){assert.equal(camera.zoom,1);assert.equal(controls.minZoom,MIN_SPACE_ZOOM);}projections++;
  }
  model.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m?.map?.dispose();m?.dispose();}});
 }
}
let catalogCameraCases=0;
for(const e of experiments){
 const s=initialState(e),model=buildLabModel(e.id,s,evaluate(e.id,s),{config:cfg,interactive:true}),b=apparatusBounds(model.group);
 for(const [w,h]of phones)for(const ortho of [false,true]){
  const camera=ortho?new T.OrthographicCamera(-6,6,4,-4,.01,500):new T.PerspectiveCamera(40,w/h,.05,100);camera.aspect=w/h;camera.position.set(7,6,8);
  const controls={target:new T.Vector3(0,1.25,0),update(){camera.lookAt(this.target);camera.updateMatrixWorld(true);}};frameApparatus(camera,controls,model.group);
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<.861&&Math.abs(p.y)<.861&&Math.abs(p.z)<1,e.id+' phone frame');}catalogCameraCases++;
 }
 model.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m?.map?.dispose();m?.dispose();}});
}
const report={workspaceLinearFactor:10,studioSize:STUDIO_SIZE,trajectorySamples:trajectories,phoneCameraCases:projections,catalogExperiments:experiments.length,catalogCameraCases,phoneViewports:phones,limits:'CPU camera/frustum geometry only; not browser pixels, iPhone hardware or iOS Safari.'};fs.writeFileSync(new URL('./space-audit-v41.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('PASS',JSON.stringify(report));
