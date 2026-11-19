import assert from 'node:assert/strict';
import {practice, applyLever, initialLever, leverHooksM, observeLever, validateLever} from '../dist/l3/lever-practice.js';

let checks = 0;
const eq = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
const close = (actual, expected) => { assert.ok(Math.abs(actual - expected) < 1e-12, String(actual) + ' instead of ' + expected); checks++; };
const apply = (state, type, load, extra = {}) => {
  const before = structuredClone(state);
  const result = applyLever(state, {type, load, ...extra});
  eq(state, before);
  eq(validateLever(result.state), true);
  return result.state;
};

const initial = initialLever();
eq(practice.measure(initial), null);
eq(observeLever(initial).angleRad, 0);
eq(leverHooksM, [-1.2,-.6,-.3,.3,.6,1.2]);

// Published hook coordinates and G = 9.81 m/s²: 0.5 kg * 1.2 m
// balances 1 kg * 0.6 m. Before balancing only the left load is present.
const onlyLeft = apply(initial,'attach',0,{hook:0});
close(observeLever(onlyLeft).angleRad,Math.PI/15);
const projectedArm = 1.2 * Math.cos(Math.PI/15);
const moment = .5 * 9.81 * projectedArm;
close(practice.measure(onlyLeft).armAM,projectedArm);
close(practice.measure(onlyLeft).leftNm,moment);
eq(practice.measure(onlyLeft).rightNm,0);
close(practice.measure(onlyLeft).netNm,moment);

const balanced = apply(onlyLeft,'attach',1,{hook:4});
eq(observeLever(balanced).angleRad,0);
eq(practice.measure(balanced).armAM,1.2);
eq(practice.measure(balanced).armBM,.6);
eq(practice.measure(balanced).armCM,0);
close(practice.measure(balanced).leftNm,.5*9.81*1.2);
close(practice.measure(balanced).rightNm,-1*9.81*.6);
eq(practice.measure(balanced).netNm,0);

const unbalanced = apply(balanced,'attach',1,{hook:5});
close(observeLever(unbalanced).angleRad,-Math.PI/15);
close(practice.measure(unbalanced).netNm,-.5*9.81*projectedArm);
const returned = apply(unbalanced,'return',1);
eq(returned,onlyLeft);

const addedSameSide = apply(onlyLeft,'attach',2,{hook:1});
close(practice.measure(addedSameSide).netNm,(.5*1.2+2*.6)*9.81*Math.cos(Math.PI/15));

const lighter = apply(initial,'set-mass',0,{massKg:.2});
const heavy = apply(lighter,'set-mass',2,{massKg:3});
eq(heavy.loads.map(load=>load.massKg),[.2,1,3]);
// Decimal products cancel exactly for small accepted mass increments.
const series = apply(apply(apply(apply(initial,'set-mass',0,{massKg:.3}),
 'set-mass',1,{massKg:1.2}),'attach',0,{hook:0}),'attach',1,{hook:3});
eq(practice.measure(series).netNm,0);

for (const action of [
 {type:'attach',load:1,hook:0}, {type:'attach',load:0,hook:0},
 {type:'attach',load:0,hook:6}, {type:'attach',load:0,hook:1.2},
 {type:'attach',load:0,hook:'1'}, {type:'attach',load:-1,hook:2},
 {type:'set-mass',load:0,massKg:.7}, {type:'set-mass',load:2,massKg:4},
 {type:'set-mass',load:2,massKg:1.27}, {type:'set-mass',load:2,massKg:NaN},
 {type:'set-mass',load:2,massKg:null}, {type:'return',load:2},
 {type:'invalid-drop'}, {}
]) {
 const before=structuredClone(onlyLeft);
 const result=practice.apply(onlyLeft,action);
 eq(result.state,undefined);eq(result.message?.length,2);
 eq(onlyLeft,before);
}

for (const invalid of [
 null, {}, {loads:[]}, {loads:[null,{},{}]},
 {loads:[{massKg:.6,hook:0},{massKg:.7,hook:0},{massKg:1,hook:null}]},
 {loads:[{massKg:3.9,hook:null},{massKg:1,hook:null},{massKg:2,hook:null}]},
 {loads:[{massKg:1,hook:null},{massKg:.27,hook:null},{massKg:1,hook:null}]}
]) eq(validateLever(invalid),false);

const reimported=JSON.parse(JSON.stringify(series));
eq(validateLever(reimported),true);
eq(practice.measure(reimported),practice.measure(series));
console.log(JSON.stringify({status:'PASS',checks,scope:'Signed loads and true horizontal arms against independent static moments, stops, changing masses, invalid and occupied hooks, mutation guards and restored model state.'}));
