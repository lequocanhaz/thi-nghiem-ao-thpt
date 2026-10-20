import assert from 'node:assert/strict';
import {experiments,initialState,electricModes} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
import {graphFor} from '../dist/graphs.js';
import {tableGraph} from '../dist/analytics.js';
import {graphColumnLabel,rowInGraphMode} from '../dist/electric-analysis.js';

const e=experiments.find(e=>e.id==='electric'),s=initialState(e);
const row=(mode,state=s)=>{const c={mode},d=evaluate(e.id,state,c);return {s:{...state},d,c,values:tableValues(e.id,state,d,c)};};
const rows=[0,1,2,3].map(mode=>row(mode));
const original=JSON.stringify(rows);
for(let mode=0;mode<4;mode++){
 const c={mode},label=[0,2].includes(mode)?'F (N)':'E (N/C)';
 const g=graphFor(e,s,evaluate(e.id,s,c),c,rows);
 assert.equal(g.yLabel,label);assert.deepEqual(g.pointRows,[mode]);
 const table=tableGraph(e,rows,4,6,false,c);
 assert.equal(table.xLabel,'r₁ (m)');assert.equal(table.yLabel,label);
 assert.deepEqual(table.pointRows,[mode]);assert.equal(table.excludedModes,3);
 assert.equal(graphColumnLabel(e,6,c),label);
 assert.equal(tableGraph(e,rows,6,4,false,c).xLabel,label);
 // Legacy tables without snapshots retain their original mode label and units.
 const legacy={values:rows[mode].values};assert.equal(rowInGraphMode(e,legacy,c),true);
 assert.deepEqual(tableGraph(e,[legacy],4,6,false,c).pointRows,[0]);
 assert.equal(rowInGraphMode(e,{values:[...legacy.values.slice(0,7),'wrong']},c),false);
}
assert.equal(JSON.stringify(rows),original,'Filtering must never change saved rows');
assert.equal(rowInGraphMode(e,{values:[null]},{}),false,'Unknown legacy mode is not guessed');
assert.equal(rowInGraphMode(e,{values:[electricModes[1]]},{mode:0}),false);
// A field is independent of the test charge; hidden/inactive parameters do not remove evidence.
for(const mode of [0,1,3]){
 const before=row(mode),after={...s,q0:-s.q0};if(mode===1)after.q2=9;
 const g=graphFor(e,after,evaluate(e.id,after,{mode}),{mode},[before]);
 assert.deepEqual(g.pointRows,[0]);
 assert.equal(evaluate(e.id,after,{mode}).magnitude,before.d.magnitude);
}
// Active charges still control the model curve and selection of comparable points.
for(const mode of [0,1,2,3]){
 const after={...s,q1:s.q1/2};
 assert.deepEqual(graphFor(e,after,evaluate(e.id,after,{mode}),{mode},[row(mode)]).pointRows,[]);
}
const forceAfter={...s,q0:2*s.q0};
assert.deepEqual(graphFor(e,forceAfter,evaluate(e.id,forceAfter,{mode:2}),{mode:2},[row(2)]).pointRows,[]);
const scan=[.05,.1,.2,.4].map(r=>row(1,{...s,x1:0,y1:0,z1:0,px:r,py:0,pz:0}));
const mixed=[row(0),...scan,row(2),row(3)];
const fit=tableGraph(e,mixed,4,6,'inverseSquare',{mode:1});
assert.deepEqual(fit.pointRows,[1,2,3,4]);assert.equal(fit.regression.n,4);
assert.ok(Math.abs(fit.regression.slope-35.9502071692)<1e-9);
assert.ok(Math.abs(fit.regression.intercept)<1e-8);
// A different experiment is unaffected by electric-only filtering/labels.
const ohm=experiments.find(e=>e.id==='ohm');
assert.deepEqual(tableGraph(ohm,[{values:[6,10,.6]}],0,2).points,[[6,.6]]);
console.log('PASS v51 electric: 4 modes, explicit F/E units, mixed/legacy tables, original row indexes and immutability, inactive/active charge dependencies, inverse-square fit from 4 distances, unchanged Ohm behavior. Node only.');
