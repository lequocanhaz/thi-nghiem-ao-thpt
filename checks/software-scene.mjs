import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration,clampState} from '../dist/models.js';
import {buildLabModel} from '../dist/scene3d.js';
import {projectScene,drawProjection} from '../dist/software-scene.js';
import {T} from '../dist/geometry-kit.js';
const{document,window}=parseHTML('<body/>');globalThis.document=document;window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*20})});
let strokes=0,faces=0;const ctx={clearRect(){},fillRect(){},beginPath(){},arc(){},fill(){faces++},moveTo(){},lineTo(){},closePath(){},setLineDash(){},stroke(){strokes++}};
const camera=new T.PerspectiveCamera(40,800/480,.05,100);camera.position.set(7,5.85,8);camera.lookAt(0,1.25,0);let primitives=0;let seed=2047;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(const e of experiments){const base=initialState(e),model=buildLabModel(e.id,base,evaluate(e.id,base),{labels:false,config:{switches:{}}});for(let n=0;n<3;n++){const s=clampState(e,Object.fromEntries(e.params.map(p=>[p.key,p.min+random()*(p.max-p.min)])));s.t=duration(e,s,evaluate(e.id,s))*(n/3);const d=evaluate(e.id,s);if(d)assert.ok(Object.values(d).filter(v=>typeof v==='number').every(Number.isFinite),e.id+' finite values');model.update(s,d,{switches:{}});const projection=projectScene(model.group,camera,800,480);assert.ok(projection.length>0,e.id+' visible apparatus');assert.ok(projection.every(p=>p.points.every(x=>x.every(Number.isFinite))),e.id+' finite projection');drawProjection(ctx,projection,800,480);primitives+=projection.length;}model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});}
assert.ok(faces>0&&strokes>0);console.log('PASS all 300 apparatus in Canvas projection at 900 reproducible parameter states: '+primitives+' finite primitives, actual drawing calls and both curves/surfaces. No browser/GPU test.');
