import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {coordinateProfile,coordinatePoint} from '../dist/coordinates.js';
import {SoftwareScene,projectScene,drawProjection} from '../dist/software-scene.js';
import {dragPlaneNormal} from '../dist/scene3d.js';
import {apparatusBounds} from '../dist/camera-fit.js';
import {experiments,initialState} from '../dist/experiments.js';import {evaluate} from '../dist/models.js';
const {document,window}=parseHTML('<body><div id="visual"></div></body>');globalThis.document=document;globalThis.window=window;globalThis.matchMedia=()=>({matches:false});globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
let textDraws=0;const ctx={clearRect(){},fillRect(){},fillText(){textDraws++},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},arc(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){},setTransform(){},measureText:s=>({width:s.length*15})};window.HTMLCanvasElement.prototype.getContext=()=>ctx;window.HTMLCanvasElement.prototype.setPointerCapture=()=>{};
const container=document.querySelector('#visual');Object.defineProperties(container,{clientWidth:{get:()=>800},clientHeight:{get:()=>480}});
const view=new SoftwareScene();view.mount(container);let count=0,metric=0,orientation=0,labels=0;
const corners=box=>[box.min.x,box.max.x].flatMap(x=>[box.min.y,box.max.y].flatMap(y=>[box.min.z,box.max.z].map(z=>new T.Vector3(x,y,z))));
for(const e of experiments){
 const s=initialState(e),d=evaluate(e.id,s),profile=coordinateProfile(e.id,s);if(profile?.metric)metric++;else if(profile)orientation++;
 const cfg={viewMode:'2d',viewPlane:profile?.plane||'front',switches:{axes:true,labels:false,handles:true}};view.update(e.id,s,d,cfg);
 assert.ok(view.camera.isOrthographicCamera,e.id+' real orthographic camera');assert.equal(view.controls.enableRotate,false);assert.equal(view.controls.mouseButtons.LEFT,T.MOUSE.PAN);view.fitView();
 const box=apparatusBounds(view.model.group);assert.ok(!box.isEmpty(),e.id);view.camera.updateMatrixWorld(true);for(const p of corners(box)){const q=p.project(view.camera);assert.ok([q.x,q.y,q.z].every(Number.isFinite),e.id+' finite frustum');assert.ok(Math.abs(q.x)<.87&&Math.abs(q.y)<.87,e.id+' orthographic fit');}
 const primitives=projectScene(view.scene,view.camera,800,480,1200);assert.ok(primitives.length>0,e.id+' nonempty 2D projection');assert.ok(primitives.every(p=>p.points.flat().every(Number.isFinite)),e.id+' finite drawing primitives');if(e.id==='electric'){labels=primitives.filter(p=>p.kind==='text').length;drawProjection(ctx,primitives,800,480);}
 const before=JSON.stringify(view.state);view.setProjection('3d');assert.ok(view.camera.isPerspectiveCamera);view.setProjection('2d',cfg.viewPlane);assert.equal(JSON.stringify(view.state),before);count++;
}
assert.ok(labels>0&&textDraws>0,'Axis labels must draw in the non-WebGL path too');
// Exact world/physical mappings, including centimetres and variable string length.
for(const [id,key,value,expected] of [['electric','x',.2,[1.6,0,0]],['oscillation','x',5,[.6,.62,0]],['wave','u',1,[-3,2,0]],['projectile','y',2,[-3,1.31,0]],['circular','z',1,[0,.3,1]],['standing','x',2,[0,1.4,0]]]){const p=coordinatePoint(coordinateProfile(id,{length:4}),key,value);p.toArray().forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<1e-10,id+' exact coordinate mapping'));}
// Objects at different depth have equal projected scale in orthographic mode.
view.update('electric',initialState(experiments.find(e=>e.id==='electric')),evaluate('electric',initialState(experiments.find(e=>e.id==='electric'))),{viewMode:'2d',viewPlane:'front',switches:{axes:true}});view.camera.updateMatrixWorld(true);const a=new T.Vector3(.4,.5,0).project(view.camera),b=new T.Vector3(.4,.5,2).project(view.camera);assert.ok(Math.abs(a.x-b.x)<1e-10&&Math.abs(a.y-b.y)<1e-10);
view.setProjection('3d');view.camera.position.set(9,6,7);view.controls.target.set(1,1,0);view.controls.update();view.autoFrame=false;const position=view.camera.position.clone(),target=view.controls.target.clone();view.setProjection('2d','front');const oldZoom=view.camera.zoom;view.zoom('in');assert.ok(view.camera.zoom>oldZoom);view.setProjection('2d','top');assert.equal(view.controls.enableRotate,false);const normal=dragPlaneNormal({userData:{drag:'param:u'}},view.camera,'2d','ohm');assert.ok(Math.abs(normal.dot(new T.Vector3(0,1,0)))>.9999);view.setProjection('3d');assert.ok(view.camera.position.distanceTo(position)<1e-9&&view.controls.target.distanceTo(target)<1e-9,'Restore previous 3D camera without moving apparatus');
view.dispose();
const css=readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');for(const width of [480,800,1100,1440])assert.ok(css.includes('width:'+width+'px'),'Responsive breakpoint '+width);assert.match(css,/body \.primary-heading[^}]+font-weight:700!important;text-transform:uppercase/);assert.match(css,/body h1,body h2[^}]+font-weight:400!important/);assert.match(css,/prefers-reduced-motion/);
console.log(`PASS v28 spatial: ${count} apparatus in actual orthographic camera/Canvas projection; ${metric} calibrated coordinate profiles, ${orientation} orientation-only profiles; exact SI/cm mappings, axis text, no perspective depth scaling, orthographic zoom, XZ drag plane and 3D camera restoration. CPU geometry/DOM/CSS contracts; no browser/GPU pixels.`);
