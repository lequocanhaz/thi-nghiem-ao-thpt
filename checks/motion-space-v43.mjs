import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration} from '../dist/models.js';
import {isDriven,processFor,seekProcess} from '../dist/playback.js';
import {SoftwareScene} from '../dist/software-scene.js';
import {apparatusBounds,boundsInView} from '../dist/camera-fit.js';
import {trackLayout} from '../dist/track-layout.js';
import {coordinateProfile,coordinatePoint} from '../dist/coordinates.js';
const {document,window}=parseHTML('<body><div id="scene"></div></body>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false}),requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},arc(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){},setTransform(){},measureText:s=>({width:s.length*15})});
window.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
let width=320,height=360;const mount=document.querySelector('#scene');Object.defineProperties(mount,{clientWidth:{get:()=>width},clientHeight:{get:()=>height}});
const view=new SoftwareScene();view.mount(mount);
const base={mode:0,capMode:'charge',switches:{axes:true,grid:true,handles:true,labels:false,vectors:true,trajectory:true,light:true,lines:true,resultant:true,components:true}};
let railFrames=0,frames=0,runs=0,guardedRuns=0;
const worldBox=node=>{node.updateWorldMatrix(true,true);return new T.Box3().setFromObject(node);};
// Regression: keep the same initial camera while the car traverses its WHOLE rail.
// Independently measure the actual meshes, not the layout's advertised bounds.
for(const id of ['uniform','acceleration','newton','collision']){
 const e=experiments.find(e=>e.id===id),first=initialState(e),params=e.params.filter(p=>p.key!=='t'),states=[first,...e.presets.slice(1).map(p=>({...first,...p.values})),...params.flatMap(p=>[p.min,p.max].map(n=>({...first,[p.key]:n})))];
 if(id==='uniform')states.push({...first,v:20});
 if(id==='acceleration')states.push({...first,v0:20,acc:-10});
 for(const start of states)for(const [w,h,mode]of [[320,360,'3d'],[390,360,'2d'],[430,400,'3d'],[844,360,'2d'],[1280,500,'3d']]){
  width=w;height=h;view.resize();const cfg={...structuredClone(base),viewMode:mode,viewPlane:'front'},s={...start,t:0};view.update(id,s,evaluate(id,s,cfg),cfg);view.fitView();
  const position=view.camera.position.clone(),end=duration(e,s,evaluate(id,s,cfg)),times=Array.from({length:101},(_,i)=>end*i/100);
  if(id==='acceleration'&&s.acc){const t=-s.v0/s.acc;if(t>0&&t<end)times.push(t);}
  const initialRange=coordinateProfile(id,s)?.axes[0].range;
  for(const t of times){s.t=t;const d=evaluate(id,s,cfg);view.update(id,s,d,{...cfg,playing:t<end});
   const rail=worldBox(view.model.group.getObjectByName('motion-rail')),carts=[];view.model.group.traverse(q=>{if(q.name==='motion-cart')carts.push(q);});
   for(const cart of carts){const b=worldBox(cart);assert.ok(b.min.x>=rail.min.x-1e-5&&b.max.x<=rail.max.x+1e-5,id+' car stays on rail at '+t);assert.ok(b.min.z>=rail.min.z-1e-5&&b.max.z<=rail.max.z+1e-5,id+' wheels stay inside rail width');}
   assert.ok(boundsInView(view.camera,apparatusBounds(view.model.group),.945),id+' entire apparatus stays in frame');
   assert.ok(view.camera.position.distanceTo(position)<1e-7,id+' full journey fits initial camera without chasing');
   if(id!=='collision'){const p=coordinateProfile(id,s),a=p.axes[0],point=coordinatePoint(p,'x',d.x),cart=carts[0];assert.ok(d.x>=a.range[0]-1e-8&&d.x<=a.range[1]+1e-8);assert.ok(Math.abs(point.x-cart.position.x)<1e-10,'axis and actual car share the exact unit mapping');assert.deepEqual(a.range,initialRange,'axis stable throughout playback');}
   railFrames++;
  }
 }
}
console.log('PASS whole-rail regression',railFrames,'frames');
// Run the live scene update and camera guard for all 300 experiments, not freshly
// frame each sample (the old test did that and could not detect this bug).
const catalog=[];
for(const e of experiments){
 let count=0,adjusted=false;
 for(const preset of e.presets)for(const [w,h,mode]of [[320,360,'3d'],[320,360,'2d'],[1280,500,'3d'],[1280,500,'2d']]){
  width=w;height=h;view.resize();const c={...structuredClone(base),viewMode:mode,viewPlane:coordinateProfile(e.id,initialState(e))?.plane||'front'},s={...initialState(e),...preset.values,t:0};
  if(isDriven(e))c.process=processFor(e,s,c);
  view.update(e.id,s,evaluate(e.id,s,c),c);view.fitView();const beginning=view.camera.clone(),end=isDriven(e)?1:duration(e,s,evaluate(e.id,s,c));
  for(let i=0;i<=16;i++){
   if(isDriven(e))seekProcess(e,s,c,i/16);else s.t=end*i/16;
   view.update(e.id,s,evaluate(e.id,s,c),{...c,playing:i<16});
   const b=apparatusBounds(view.model.group);assert.ok(boundsInView(view.camera,b,.945),`${e.id} ${preset.name} ${mode} ${w} frame ${i}`);
   const deck=worldBox(view.model.group.getObjectByName('expanded-workspace'));
   assert.ok(deck.min.x<=b.min.x+1e-5&&deck.max.x>=b.max.x-1e-5&&deck.min.z<=b.min.z+1e-5&&deck.max.z>=b.max.z-1e-5,e.id+' work surface covers apparatus');
   adjusted ||= !boundsInView(beginning,b,.945);frames++;count++;
  }runs++;
 }
 if(adjusted)guardedRuns++;catalog.push({id:e.id,frames:count,expandedDuringRun:adjusted});
 if(catalog.length%50===0)console.log('Playback coverage',catalog.length,'/ 300');
}
// Calibrated ranges must also contain all permitted configured positions/amplitudes.
let calibratedCases=0;
for(const e of experiments){
 if(!coordinateProfile(e.id,initialState(e))?.metric)continue;
 const first=initialState(e),states=[first,...e.params.filter(p=>p.key!=='t').flatMap(p=>[p.min,p.max].map(value=>({...first,[p.key]:value})))];
 for(const s of states){const d=evaluate(e.id,s),p=coordinateProfile(e.id,s),values={
  electric:{x:[s.x1,s.x2,s.px],y:[s.y1,s.y2,s.py],z:[s.z1,s.z2,s.pz]},
  energy:{h:[0,s.h0]},oscillation:{x:[-s.a,s.a]},damped:{x:[-s.a,s.a]},
  wave:{x:[0,6],u:[-s.a,s.a]},standing:{x:[0,s.length],u:[-2*s.a,2*s.a]},
  uniform:{x:[0,evaluate(e.id,{...s,t:duration(e,s,d)}).x]},acceleration:{x:[0,evaluate(e.id,{...s,t:duration(e,s,d)}).x]},newton:{x:[0,evaluate(e.id,{...s,t:duration(e,s,d)}).x]},
  horizontal:{x:[0,d.range],y:[0,s.h0]},projectile:{x:[0,d.range],y:[0,d.height]},
  circular:{x:[-s.radius,s.radius],z:[-s.radius,s.radius]},interference:{x:[s.probeX,-s.separation/2,s.separation/2],z:[0,s.probeZ]}
 }[e.id];
 for(const axis of p.axes)for(const value of values[axis.key]||[]){assert.ok(value>=axis.range[0]-1e-8&&value<=axis.range[1]+1e-8,e.id+' calibrated '+axis.key+' value '+value);calibratedCases++;}
 }
}
const waterExperiment=experiments.find(e=>e.id==='interference'),waterState={...initialState(waterExperiment),probeX:12.5,probeZ:12.5,separation:15};view.update('interference',waterState,evaluate('interference',waterState),base);let surface,probe;view.model.group.traverse(q=>{if(q.geometry?.attributes.position?.count===3721)surface=q;if(q.userData.drag==='interference-probe')probe=q;});const waterBounds=worldBox(surface),probePosition=probe.getWorldPosition(new T.Vector3());assert.ok(probePosition.x>=waterBounds.min.x&&probePosition.x<=waterBounds.max.x&&probePosition.z>=waterBounds.min.z&&probePosition.z<=waterBounds.max.z,'probe remains over expanded water surface');
// A run re-enables fitting after a prior manual zoom; paused manual views remain available.
const e=experiments.find(e=>e.id==='uniform'),s={...initialState(e),v:20};view.update(e.id,s,evaluate(e.id,s),base);view.zoom('in');assert.equal(view.autoFrame,false);view.update(e.id,s,evaluate(e.id,s),{...base,playing:true});assert.equal(view.autoFrame,true);view.zoom('in');assert.equal(view.autoFrame,false);view.update(e.id,s,evaluate(e.id,s),{...base,playing:true});assert.ok(boundsInView(view.camera,apparatusBounds(view.model.group),.945),'running camera guard survives manual zoom');view.update(e.id,s,evaluate(e.id,s),{...base,playing:false});view.zoom('in');const paused=view.camera.position.clone();view.update(e.id,s,evaluate(e.id,s),{...base,playing:false});assert.ok(view.camera.position.equals(paused),'paused detail view remains available');
view.dispose();
const report={experiments:catalog.length,runs,playbackFrames:frames,wholeRailFrames:railFrames,calibratedCases,experimentsThatNeededReframing:guardedRuns,viewports:[[320,360],[390,360],[430,400],[844,360],[1280,500]],catalog,scope:'Live scene/model/camera methods, real mesh bounds, 2D/3D and synthetic playback. CPU geometry only; no browser pixels, iPhone hardware or Safari.'};
fs.writeFileSync(new URL('./motion-space-audit-v43.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('PASS',JSON.stringify({...report,catalog:undefined}));
