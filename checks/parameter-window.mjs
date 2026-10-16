import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {parameterLimits,parameterWindow,cleanParameterWindows,revealParameterWindows} from '../dist/parameter-window.js';
let count=0,custom=0;
for(const e of experiments){
 const state=initialState(e),before=structuredClone(state),data=evaluate(e.id,state),metadata=JSON.stringify(e.params);
 for(const p of e.params.filter(p=>p.key!=='t')){
  count++;const hard=parameterLimits(e,p,state);assert.ok(Number.isFinite(hard.min)&&Number.isFinite(hard.max)&&hard.max>hard.min,e.id+' '+p.key);
  assert.deepEqual(parameterWindow(e,p,state),{...hard,custom:false});
  for(const raw of [null,[],{unknown:{min:0,max:1}},{[p.key]:{min:NaN,max:Infinity}},{[p.key]:{min:hard.max,max:hard.min}},{[p.key]:{min:hard.min-p.step,max:hard.max}}])assert.deepEqual(cleanParameterWindows(e,raw,state),{});
  const units=Math.floor((hard.max-hard.min)/p.step),lo=hard.min+Math.floor(units*.2)*p.step,hi=hard.min+Math.floor(units*.8)*p.step;
  if(hi>lo){
   const q=cleanParameterWindows(e,{[p.key]:{min:lo,max:hi}},state)[p.key];assert.ok(q&&q.min>=hard.min&&q.max<=hard.max);const middle={...state,[p.key]:(q.min+q.max)/2},w=parameterWindow(e,p,middle,{[p.key]:q});assert.equal(w.custom,true);custom++;
   assert.equal(parameterWindow(e,p,{...state,[p.key]:hard.min},{[p.key]:q}).custom,hard.min>=q.min&&hard.min<=q.max);assert.deepEqual(revealParameterWindows(e,{...state,[p.key]:hard.max},{[p.key]:q}),{});
  }
 }
 assert.deepEqual(state,before,'UI windows never mutate '+e.id+' state');assert.deepEqual(evaluate(e.id,state),data);assert.equal(JSON.stringify(e.params),metadata,'physical domains stay intact');
}
assert.equal(count,852);assert.equal(experiments.length,300);assert.ok(custom>800);
const standing=experiments.find(e=>e.id==='standing'),p=standing.params.find(p=>p.key==='probeX'),state={...initialState(standing),length:2};assert.equal(parameterLimits(standing,p,state).max,2);assert.deepEqual(cleanParameterWindows(standing,{probeX:{min:0,max:3}},state),{});
console.log(`PASS all ${count} non-time parameter windows across 300 investigations: invalid settings rejected, ${custom} custom intervals, full-domain reveal, dynamic standing-wave bound, unchanged states/results/physical limits.`);
