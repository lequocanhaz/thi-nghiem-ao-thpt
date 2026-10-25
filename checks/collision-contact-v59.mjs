import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {buildLabModel} from '../dist/scene3d.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';

const {document,window}=parseHTML('<body></body>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},arc(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){},setTransform(){},measureText:s=>({width:s.length*15})});
const experiment=experiments.find(e=>e.id==='collision'),base=initialState(experiment);
const model=buildLabModel('collision',base,evaluate('collision',base),{labels:false,thumbnail:true});
const carts=[];model.group.traverse(q=>{if(q.name==='motion-cart')carts.push(q);});
assert.equal(carts.length,2);
const close=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
const cases=[];
for(const m1 of [.05,1,5,15])for(const m2 of [.05,2,5,15])for(const e of [0,.4,1])for(const [v1,v2] of [[2,-2],[20,-15],[0,5],[5,5],[0,-15]])cases.push({...base,m1,m2,e,v1,v2});
let seed=20261026;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(let j=0;j<80;j++)cases.push({...base,m1:.05+14.95*random(),m2:.05+14.95*random(),e:random(),v1:20*random(),v2:-15+20*random()});
let frames=0,contacts=0,stickingFrames=0;
for(const state of cases){
 const hit=state.v1>state.v2?6/(state.v1-state.v2):Infinity;
 const times=[0,.1,1,2,4];
 if(hit<=4)times.push(Math.max(0,hit-1e-6),hit,Math.min(4,hit+1e-6));
 for(const t of times){
  const s={...state,t},d=evaluate('collision',s),before=JSON.stringify({s,d});
  model.update(s,d,{});model.group.updateMatrixWorld(true);
  // Tight bounds transform every actual mesh vertex. Rotated wheel bounding
  // boxes would otherwise produce a false positive beyond the physical tire.
  const bounds=carts.map(cart=>new T.Box3().setFromObject(cart,true));
  const gap=bounds[1].min.x-bounds[0].max.x;
  assert.ok(gap>=-1e-6,'Finite carts cannot penetrate before, during or after impact');
  close(gap,.28*(d.x2-d.x1));
  if(t===hit){
   close(gap,0);
   // Actual extremal mesh faces must also meet at the same height/depth.
   // Scaling whole carts with their masses used to put bumpers at different
   // heights; merely separating x bounding boxes would not fix that contact.
   const faces=carts.map((cart,index)=>{
    const matches=[];
    cart.traverse(node=>{if(!node.isMesh)return;const b=new T.Box3().setFromObject(node,true);if(Math.abs((index?b.min.x:b.max.x)-(index?bounds[index].min.x:bounds[index].max.x))<1e-6)matches.push(b);});
    assert.equal(matches.length,1,'One facing bumper defines the contact face');return matches[0];
   });
   for(const axis of ['y','z'])assert.ok(Math.min(faces[0].max[axis],faces[1].max[axis])-Math.max(faces[0].min[axis],faces[1].min[axis])>.02,'Facing bumpers have a real overlapping contact area in '+axis);
   contacts++;
  }
  if(d.hit&&s.e===0){close(gap,0);close(d.v1,d.v2);stickingFrames++;}
  const rail=new T.Box3().setFromObject(model.group.getObjectByName('motion-rail'),true);
  for(const b of bounds)assert.ok(b.min.x>=rail.min.x-1e-6&&b.max.x<=rail.max.x+1e-6,'Full cart remains on its ray throughout the trajectory');
  close(s.m1*d.v1+s.m2*d.v2,s.m1*s.v1+s.m2*s.v2);
  if(d.hit)close(d.v2-d.v1,s.e*(s.v1-s.v2));
  assert.equal(JSON.stringify({s,d}),before,'Renderer cannot alter point-particle physics or inputs');
  // Away from the instantaneous event the rendered cart velocity must keep a
  // common unit scale. This detects clamping/wrapping to hide penetration.
  if(Math.abs(t-hit)>1e-5&&t<4){
   const positions=carts.map(cart=>cart.position.x),dt=1e-6,next={...s,t:t+dt};
   model.update(next,evaluate('collision',next),{});
   carts.forEach((cart,i)=>close((cart.position.x-positions[i])/dt,.28*(i?d.v2:d.v1),2e-6));
  }
  frames++;
 }
}
assert.ok(contacts>0&&stickingFrames>0);
console.log('PASS finite collision-cart contact:',JSON.stringify({parameterCases:cases.length,frames,contacts,stickingFrames,scope:'Actual tight mesh bounds and independent momentum/restitution/velocity checks; no browser pixels, GPU or real collision experiment.'}));
