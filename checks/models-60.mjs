import {parseHTML} from 'linkedom';
import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration,clampState} from '../dist/models.js';
import {meters,tableValues} from '../dist/measurements.js';
import {graphFor} from '../dist/graphs.js';
import {buildLabModel} from '../dist/scene3d.js';
import {sources} from '../dist/sources.js';
const {document:geometryDocument,window:geometryWindow}=parseHTML('<html><body></body></html>');globalThis.document=geometryDocument;geometryWindow.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});

const close=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const initial=id=>initialState(experiments.find(e=>e.id===id));
assert.equal(experiments.length,300);assert.equal(new Set(experiments.map(e=>e.id)).size,300);
for(const e of experiments){
 const s=initialState(e),c={mode:0,capMode:'charge',switches:{vectors:true,trajectory:true}},d=evaluate(e.id,s,c);
 assert.equal(tableValues(e.id,s,d,c).length,e.headers.length,e.id+' schema');assert.equal(meters[e.id].length,3);assert.ok(sources[e.id].length>0);
 for(const p of e.params.filter(q=>q.key!=='t'))for(const value of [p.min,p.max]){const q=clampState(e,{...s,[p.key]:value}),dd=evaluate(e.id,q,c);if(dd){assert.ok(Object.values(dd).filter(v=>typeof v==='number').every(Number.isFinite),e.id+' parameter endpoint');const chart=graphFor(e,q,dd,c);assert.ok([chart.xmin,chart.xmax,chart.ymin,chart.ymax].every(Number.isFinite),e.id+' graph bounds');}}
 const model=buildLabModel(e.id,s,d,{labels:false,config:c});
 for(const t of [0,Math.min(1,duration(e,s,d)),duration(e,s,d)]){s.t=t;model.update(s,evaluate(e.id,s,c),c);model.group.updateMatrixWorld(true);model.group.traverse(o=>{assert.ok(o.position.toArray().every(Number.isFinite),e.id+' position');assert.ok(o.scale.toArray().every(Number.isFinite),e.id+' scale');const p=o.geometry?.attributes.position;if(p)assert.ok(Array.from(p.array).every(Number.isFinite),e.id+' vertices');if(o.isInstancedMesh)assert.ok(Array.from(o.instanceMatrix.array).every(Number.isFinite),e.id+' instances');});}
 console.log('PASS',e.id,'parameters, schema, graph and Three.js geometry');
}
let s=initial('horizontal');let d=evaluate('horizontal',s);close(d.duration,Math.sqrt(2*s.h0/9.81));const fast=evaluate('horizontal',{...s,v0:s.v0*2});close(fast.duration,d.duration);close(fast.range,2*d.range);
s=initial('projectile');const r30=evaluate('projectile',{...s,angle:30}).range,r60=evaluate('projectile',{...s,angle:60}).range,r45=evaluate('projectile',{...s,angle:45}).range;close(r30,r60);assert.ok(r45>r30);
for(const e of [0,.5,1]){s={...initial('collision'),e};d=evaluate('collision',{...s,t:3});close(s.m1*d.v1+s.m2*d.v2,d.momentum);close(d.v2-d.v1,e*(s.v1-s.v2));if(e===1)close(d.k,d.k0);else assert.ok(d.k<=d.k0+1e-8);}
s=initial('incline');d=evaluate('incline',{...s,mu:.7,angle:5,t:2});close(d.acc,0);close(d.v,0);
s=initial('lever');close(evaluate('lever',s).net,0);s=initial('hooke');d=evaluate('hooke',s);close(d.extension*s.k,s.m*9.81);
s=initial('pendulum');close(evaluate('pendulum',{...s,length:s.length*4}).period,evaluate('pendulum',s).period*2);
s=initial('damped');close(evaluate('damped',s).v,0);const es=[0,.3,1,2,5].map(t=>evaluate('damped',{...s,t}).energy);for(let j=1;j<es.length;j++)assert.ok(es[j]<=es[j-1]+1e-10);
s=initial('interference');close(evaluate('interference',s).amplitude,2*s.a);close(evaluate('interference',{...s,phase:180}).amplitude,0);
s=initial('standing');for(let j=0;j<=s.mode;j++)close(evaluate('standing',{...s,probeX:j*s.length/s.mode,t:.123}).u,0);
s=initial('series');d=evaluate('series',s);close(d.u1+d.u2,s.u);s=initial('parallel');d=evaluate('parallel',s);close(d.i1+d.i2,d.i);assert.ok(d.resistance<s.r1&&d.resistance<s.r2);
s=initial('joule');d=evaluate('joule',{...s,t:10});close(d.heat,d.i*d.i*s.r*10);close(d.temp-20,d.heat/(s.m*4180));
s=initial('magnetic');close(evaluate('magnetic',{...s,angle:0}).force,0);close(evaluate('magnetic',{...s,i:-s.i}).fy,-evaluate('magnetic',s).fy);
s=initial('induction');close(evaluate('induction',s).emf,0);close(evaluate('induction',{...s,t:1/(4*s.f)}).emf,s.turns*s.b*s.area*2*Math.PI*s.f);
s=initial('decay');close(evaluate('decay',{...s,t:s.half}).N,s.n0/2);close(evaluate('decay',{...s,t:2*s.half}).N,s.n0/4);
console.log('PASS conservation laws, projectile symmetry, damping, interference, nodes, circuits, heat, force direction, induction and half-life.');
