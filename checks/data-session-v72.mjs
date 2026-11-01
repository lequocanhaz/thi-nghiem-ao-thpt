import assert from 'node:assert/strict';
import {conditionGroups,regressionConditions,pauseForParameterEdit} from '../dist/data-session-v72.js';
const e={id:'ohm',params:[{key:'u'},{key:'r'}]},col=(_e,key)=>({u:0,r:1}[key]??null);
const row=(u,r,t=0)=>({s:{u,r,t},c:{viewMode:'3d',graphX:0},values:[u,r,u/r]});
const rows=[row(1,10),row(2,10,1),row(3,10,2)],before=structuredClone(rows);
assert.equal(regressionConditions(e,rows,0,col).compatible,true);
assert.deepEqual(rows,before);
assert.equal(conditionGroups(e,[...rows,row(4,20)],0,col).length,2);
assert.equal(regressionConditions(e,[...rows,row(4,20)],0,col).reason,'mixed-conditions');
assert.equal(conditionGroups(e,[row(1,10),row(1,20)],1,col).length,1);
assert.equal(conditionGroups(e,[row(1,10),row(2,10)],2,col).length,2,'Dependent x axes do not silently discard controlled inputs');
assert.equal(conditionGroups(e,[row(1,10),row(2,10+1e-10)],0,col).length,2,'Do not group rounded values');
assert.equal(regressionConditions(e,[{values:[1,10,.1]},{values:[2,10,.2]}],0,col).reason,'unknown-conditions');
assert.equal(regressionConditions(e,[],0,col).reason,'empty');
const visual=rows.map(r=>({...r,c:{...r.c,viewMode:'2d',plotGrid:false}}));
assert.equal(regressionConditions(e,visual,0,col).compatible,true,'Display configuration is not an experimental condition');
const capacitor={id:'capacitor',params:[{key:'u'},{key:'r'}]};
assert.equal(conditionGroups(capacitor,[{...row(1,10),c:{capMode:'charge'}},{...row(1,10),c:{capMode:'discharge'}}],0,col).length,2);
assert.deepEqual(pauseForParameterEdit(false),{running:false,message:''});
assert.match(pauseForParameterEdit(true).message,/Số liệu đã ghi/);
assert.match(pauseForParameterEdit(true,'en-US').message,/kept/);
assert.deepEqual(rows,before,'Helpers do not alter or discard recorded rows');
console.log('PASS v72 controlled-condition grouping: exact parameters, independent variable, legacy safety, modes, visual invariance, no mutation, pause notice.');

const {tableGraph}=await import('../dist/analytics.js');
const {experiments,initialState}=await import('../dist/experiments.js');
const {evaluate}=await import('../dist/models.js');
const {tableValues}=await import('../dist/measurements.js');
const ohm=experiments.find(e=>e.id==='ohm');
const make=(u,r)=>{const s={...initialState(ohm),u,r},d=evaluate('ohm',s);return {s,c:{},values:tableValues('ohm',s,d)};};
const measured=[make(1,10),make(2,10),make(3,10)];
assert.ok(Math.abs(tableGraph(ohm,measured,0,2,true).regression.slope-.1)<1e-12);
const mixed=[...measured,make(4,20)];
const g=tableGraph(ohm,mixed,0,2,true);
assert.equal(g.regression,null);assert.equal(g.fitBlockedReason,'mixed-conditions');assert.equal(g.conditionGroups,2);assert.equal(g.points.length,4);assert.deepEqual(g.pointRows,[0,1,2,3]);
const legacy=tableGraph(ohm,measured.map(({values})=>({values})),0,2,true);
assert.equal(legacy.fitBlockedReason,'unknown-conditions');assert.equal(legacy.points.length,3);
console.log('PASS v72 integrated measured graph: homogeneous Ohm slope, blocked mixed/unknown fits, original point indexes and all data retained.');

const dynamicRows=(id,inputKey,values)=>{const experiment=experiments.find(e=>e.id===id);return {experiment,rows:values.map(([value,t])=>{const s={...initialState(experiment),[inputKey]:value,t};return {s,c:{},values:tableValues(id,s,evaluate(id,s))};})};};
const shm=dynamicRows('oscillation','a',[[2,0],[3,.2],[4,.4]]);
assert.equal(tableGraph(shm.experiment,shm.rows,5,1,true).fitBlockedReason,'mixed-conditions','Changing phase confounds amplitude vs displacement');
const timeline=dynamicRows('oscillation','a',[[2,0],[2,.2],[2,.4]]);
assert.equal(tableGraph(timeline.experiment,timeline.rows,0,1,true).conditionGroups,1,'Recorded time axis permits clock variation at fixed inputs');
for(const [id,key,x,y] of [['energy','h0',1,3],['decay','n0',1,3],['horizontal','v0',3,4],['collision','v1',1,2],['pendulum','angle',1,3]]){
 const q=dynamicRows(id,key,[[2,0],[3,0],[4,0]]);
 assert.equal(tableGraph(q.experiment,q.rows,x,y,true).fitBlockedReason,'mixed-conditions',`${id}.${key} is not identical to the selected derived output column`);
}
console.log('PASS v72 confounder guards: changing clock on parameter axes; explicit time axis; legacy initial-vs-current aliases.');
