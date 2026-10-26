import assert from 'node:assert/strict';
import {sampleRelation} from '../dist/relation-sampling.js';
import {foundationPrediction} from '../dist/foundation-concepts.js';
import {experiments,initialState} from '../dist/experiments.js';
import {relationPaths} from '../dist/observation-view.js';
const e=experiments.find(e=>e.id==='potential_pair'),base=initialState(e),k=8.9875517923e9;
for(const half of [.005,.15,.42,1.5]){
 const s={...base,half},before=JSON.stringify(s),r=foundationPrediction(e,s);
 assert.equal(JSON.stringify(s),before);
 if(half>=e.params.find(p=>p.key==='distance').min){
  assert.ok(r.points.includes(null),'Undefined x=a must be explicitly sampled');
  const gap=r.points.indexOf(null),left=r.points[gap-1],right=r.points[gap+1];
  if(left&&right){assert.ok(left[0]<half&&right[0]>half);const svg=relationPaths(r.points,p=>p);assert.equal((svg.path.match(/M/g)||[]).length,2,'Two disconnected branches');}
 }
 for(const p of r.points.filter(Boolean))assert.ok(Math.abs(p[1]-(k*s.charge*1e-9/Math.abs(p[0]-half)-k*s.charge*1e-9/Math.abs(p[0]+half)))<1e-8*Math.max(1,Math.abs(p[1])));
 const atPole=foundationPrediction(e,{...s,distance:half});assert.equal(atPole.current,null,'No artificial finite value at a charge');
}
assert.deepEqual(sampleRelation({min:0,max:3,count:4,excluded:[1]},x=>x*x),[[0,0],null,[2,4],[3,9]]);
assert.deepEqual(sampleRelation({min:0,max:1,count:5,integer:true},x=>x),[[0,0],[1,1]]);
assert.ok(sampleRelation({min:0,max:1},()=>null).every(p=>p===null));
assert.throws(()=>sampleRelation({min:1,max:1},x=>x),RangeError);
console.log('PASS relation sampling v65: independently checked dipole law, explicit pole cuts between uniform samples, immutable inputs, no fabricated finite pole value, discrete quantities and invalid domains.');
