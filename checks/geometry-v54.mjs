import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {buildLabModel} from '../dist/scene3d.js';
import {SoftwareScene} from '../dist/software-scene.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {LEVER_SCALE} from '../dist/lever-geometry.js';
const {document,window}=parseHTML('<body><div id="visual"></div></body>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false}),requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},arc(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){},setTransform(){},measureText:s=>({width:s.length*15})});
window.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
const close=(a,b,tol=2e-5)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
let seed=20261025;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const states=id=>{const e=experiments.find(e=>e.id===id),base=initialState(e),cases=[base];for(const p of e.params)for(const value of [p.min,p.max,(p.min+p.max)/2])cases.push({...base,[p.key]:value});for(let j=0;j<150;j++)cases.push(Object.fromEntries(e.params.map(p=>[p.key,p.min+random()*(p.max-p.min)])));return cases;};
const options={labels:false,interactive:false,thumbnail:true};
const get=(model,name)=>{const node=model.group.getObjectByName(name);assert.ok(node,name);return node;};
const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),rotation=new T.Quaternion();
const leverStates=states('lever');
// Joint extremes matter: a short arm with a large load used to intersect the beam.
for(const l1 of [.02,10])for(const l2 of [.02,10])for(const m1 of [.02,15])for(const m2 of [.02,15])leverStates.push({l1,l2,m1,m2});
let leverCases=0,particlesChecked=0,continuousSteps=0,manualCameraFrames=0;
const lever=buildLabModel('lever',leverStates[0],evaluate('lever',leverStates[0]),options);
const bar=get(lever,'lever-beam'),pivot=get(lever,'lever-pivot');bar.geometry.computeBoundingBox();const localBounds=bar.geometry.boundingBox;
for(const state of leverStates){
 const data=evaluate('lever',state),before=JSON.stringify({state,data});lever.update(state,data,{});lever.group.updateMatrixWorld(true);
 close(pivot.getWorldPosition(new T.Vector3()).x,0);close(pivot.getWorldPosition(new T.Vector3()).y,1.7);
 let net=0;
 for(let i=0;i<2;i++){
  const weight=get(lever,'lever-load-'+i),rope=get(lever,'lever-cable-'+i),a=rope.geometry.attributes.position;
  const anchor=new T.Vector3().fromBufferAttribute(a,0),bottom=new T.Vector3().fromBufferAttribute(a,1),world=weight.getWorldPosition(new T.Vector3());
  const local=bar.worldToLocal(anchor.clone());
  assert.ok(local.x>=localBounds.min.x-1e-5&&local.x<=localBounds.max.x+1e-5,'Cable anchor stays inside the actual beam at expanded arm limits');
  assert.ok(local.z>=localBounds.min.z&&local.z<=localBounds.max.z);close(local.y,-.06);
  close(world.x,(i?state.l2:-state.l1)*LEVER_SCALE);close(anchor.x,world.x);close(anchor.z,world.z);
  close(bottom.x,anchor.x);close(bottom.z,anchor.z);close(bottom.y,world.y+.45*weight.scale.y/2);
  assert.ok(anchor.y>bottom.y+.3,'Hanging weight never penetrates the beam');
  close(weight.quaternion.x,0);close(weight.quaternion.y,0);close(weight.quaternion.z,0);
  net+=(world.x/LEVER_SCALE)*(-(i?state.m2:state.m1)*9.81);
 }
 close(net,data.net,1e-8);assert.equal(JSON.stringify({state,data}),before,'Rendering never rewrites torque or inputs');
 leverCases++;
}
// Use the matrices of the actual rendered InstancedMesh, not helper output.
for(const id of ['gas','boyle']){
 const cases=states(id),model=buildLabModel(id,{...cases[0],t:0},evaluate(id,cases[0]),options),particles=get(model,id==='gas'?'gas-particles':'boyle-particles');
 const originalGeometry=particles.geometry,originalMaterial=particles.material;
 for(let j=0;j<cases.length;j++){
  const state={...cases[j],t:[0,.001,1,13.7,1000][j%5]},data=evaluate(id,state),before=JSON.stringify({state,data});
  model.update(state,data,{});model.group.updateMatrixWorld(true);
  const box=id==='gas'?new T.Box3().setFromObject(get(model,'gas-container')):null;
  let left,right;
  if(id==='boyle'){
   const fixedBox=new T.Box3().setFromObject(get(model,'boyle-fixed-cap')),pistonBox=new T.Box3().setFromObject(get(model,'boyle-piston'));
   left=fixedBox.max.x;right=pistonBox.min.x;assert.ok(right>left,'Caps never overlap at minimum volume');
   const glassBox=new T.Box3().setFromObject(get(model,'boyle-glass'));
   assert.ok(glassBox.min.x<=left&&glassBox.max.x>=right,'Piston remains inside the actual cylinder across the full volume range');
  }
  for(let k=0;k<particles.count;k++){
   particles.getMatrixAt(k,matrix);matrix.decompose(position,rotation,scale);const radius=.075*scale.x;
   if(id==='gas')for(const axis of ['x','y','z']){
    assert.ok(position[axis]-radius>=box.min[axis]-2e-6,`${id} particle penetrates low ${axis} wall`);
    assert.ok(position[axis]+radius<=box.max[axis]+2e-6,`${id} particle penetrates high ${axis} wall`);
   }else{
    assert.ok(position.x-radius>=left-2e-6&&position.x+radius<=right+2e-6,'Particle remains between the actual cap faces');
    assert.ok(Math.hypot(position.y-1.12,position.z)+radius<=.880002,'Particle stays inside cylinder radius');
   }
   particlesChecked++;
  }
  assert.equal(JSON.stringify({state,data}),before,'Particle display does not alter pressure/temperature/rms speed');
  assert.equal(particles.geometry,originalGeometry);assert.equal(particles.material,originalMaterial);
 }
 // Bound actual instance displacement over tiny time steps, including the
 // reversal at the first x-wall. A modulo wrap would fail this test.
 const e=experiments.find(e=>e.id===id),base=initialState(e),dt=1e-5;
 for(const volume of [.2,base.v,50]){
  const wallTime=id==='gas'?1/(.55*.25):1/.18;
  for(const t of [0,1,wallTime-dt/2,1000]){
   const s={...base,v:volume,t};model.update(s,evaluate(id,s),{});
   const before=Array.from({length:particles.count},(_,j)=>{particles.getMatrixAt(j,matrix);return new T.Vector3().setFromMatrixPosition(matrix);});
   s.t+=dt;model.update(s,evaluate(id,s),{});
   for(let j=0;j<particles.count;j++){
    particles.getMatrixAt(j,matrix);const after=new T.Vector3().setFromMatrixPosition(matrix);
    assert.ok(after.distanceTo(before[j])<50*dt,'Particle trajectory cannot teleport through a wall');
    continuousSteps++;
   }
  }
 }
 // The first sample reaches the high x wall at wallTime. Its normal velocity
 // reverses while its graphical center stays continuous.
 const state={...base,t:id==='gas'?1/(.55*.25):1/.18},xs=[];
 for(const t of [state.t-dt,state.t,state.t+dt]){const s={...state,t};model.update(s,evaluate(id,s),{});particles.getMatrixAt(0,matrix);xs.push(matrix.elements[12]);}
 assert.ok(xs[1]>xs[0]&&xs[2]<xs[1],'Rendered sample reflects at the high x wall');
}
// Use the live scene update path to check that a manual camera survives play,
// pause and expanded parameter edits for the three changed apparatus models.
const container=document.querySelector('#visual');Object.defineProperties(container,{clientWidth:{get:()=>390},clientHeight:{get:()=>360}});
const view=new SoftwareScene();view.mount(container);
for(const id of ['lever','gas','boyle'])for(const projection of ['2d','3d']){
 const e=experiments.find(e=>e.id===id),state=initialState(e),config={viewMode:projection,switches:{labels:false,axes:true,grid:true,handles:true}};
 view.update(id,state,evaluate(id,state),config);view.fitView();view.zoom('in');
 const position=view.camera.position.clone(),target=view.controls.target.clone(),zoom=view.camera.zoom;
 for(let j=0;j<12;j++){
  state.t=j*.1;if(id==='lever')state.l1=j%2?.02:10;else state.v=j%2?.2:50;
  view.update(id,state,evaluate(id,state),{...config,playing:j%3!==0});
  assert.equal(view.autoFrame,false);assert.ok(view.camera.position.equals(position),'Manual camera survives playback/parameter edits');
  assert.ok(view.controls.target.equals(target),'Manual pan survives playback/parameter edits');assert.equal(view.camera.zoom,zoom);manualCameraFrames++;
 }
}
view.dispose();
console.log('PASS v54 rendered-geometry constraints:',JSON.stringify({leverCases,particlesChecked,continuousSteps,manualCameraFrames,scope:'Actual mesh/instance matrices, independent force cross-products and live CPU scene/camera path; no browser pixels, GPU/FPS or molecular collision solver certification.'}));
