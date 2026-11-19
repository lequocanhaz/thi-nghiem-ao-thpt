import assert from 'node:assert/strict';
import {practice, sampleOscillator} from '../dist/l3/oscillation-practice.js';
import {experiments} from '../dist/experiments.js';

let checks = 0;
const check = predicate => {assert.ok(predicate); checks++;};
const close = (value, expected, tolerance=1e-10) => check(Math.abs(value - expected) <= tolerance);
function outcome(state, action) {
  const before = JSON.stringify(state);
  const result = practice.apply(state, action);
  check(practice.validate(result.state));
  check(JSON.stringify(state) === before);
  return result.state;
}
const invalid = (state, action) => check(!practice.apply(state, action).state);
check(experiments.some(entry => entry.id === practice.id));
const initial = practice.initial();
check(practice.validate(initial));
check(practice.measure(initial) === null);
invalid(initial, {type:'release'});
invalid(initial, {type:'pull',value:.101});
invalid(initial, {type:'pull',value:NaN});
invalid(initial, {type:'start-watch',timeS:0});
invalid(initial, {type:'setting',key:'massKg',value:0});
invalid(initial, {type:'setting',key:'stiffnessNPerM',value:Infinity});
invalid(initial, {type:'setting',key:'__proto__',value:1});
invalid(initial, {type:'other'});

for (const massKg of [.1,.5,1,1.5]) for (const stiffnessNPerM of [5,10,20,40]) {
  let configured = outcome(initial, {type:'setting',key:'massKg',value:massKg});
  configured = outcome(configured, {type:'setting',key:'stiffnessNPerM',value:stiffnessNPerM});
  for (const heldM of [-.1,-.037,.001,.071]) {
    const ready = outcome(configured, {type:'pull',value:heldM});
    const active = outcome(ready,{type:'release'});
    const theoreticS = 2 * Math.PI * Math.sqrt(massKg/stiffnessNPerM);
    const speedMax = Math.abs(heldM) * Math.sqrt(stiffnessNPerM/massKg);
    close(sampleOscillator(active,0).positionM,heldM);
    close(sampleOscillator(active,0).velocityMPerS,0);
    const quarter = sampleOscillator(active,theoreticS/4);
    close(quarter.positionM,0);
    close(quarter.velocityMPerS,-Math.sign(heldM)*speedMax);
    const half = sampleOscillator(active,theoreticS/2);
    close(half.positionM,-heldM);
    for(const ratio of [.17,.24,.62,1.1,2.95]) {
      const {positionM,velocityMPerS,accelerationMPerS2} = sampleOscillator(active,ratio*theoreticS);
      close(accelerationMPerS2,-stiffnessNPerM*positionM/massKg);
      close(massKg*velocityMPerS**2/2 + stiffnessNPerM*positionM**2/2,stiffnessNPerM*heldM**2/2);
    }
    invalid(active,{type:'start-watch',timeS:-1});
    invalid(active,{type:'start-watch',timeS:121});
    const timed = outcome(active,{type:'start-watch',timeS:.137});
    check(practice.measure(timed) === null);
    invalid(timed,{type:'start-watch',timeS:.4});
    invalid(timed,{type:'stop-watch',timeS:.137 + .8 * theoreticS});
    invalid(timed,{type:'stop-watch',timeS:120.1});
    const read = outcome(timed,{type:'stop-watch',timeS:.137 + 3 * theoreticS});
    const result = practice.measure(JSON.parse(JSON.stringify(read)));
    close(result.amplitudeCm,Math.abs(heldM)*100);
    close(result.durationS,3*theoreticS,.005001);
    check(result.cycles === 3);
    close(result.meanPeriodS,theoreticS,.005001/3);
    const late = outcome(timed,{type:'stop-watch',timeS:.137 + 3.2 * theoreticS});
    check(practice.measure(late).meanPeriodS > result.meanPeriodS);
    const selectAgain = outcome(read,{type:'pull',value:.018});
    check(practice.measure(selectAgain) === null);
    const change = outcome(read,{type:'setting',key:'massKg',value:.8});
    check(practice.measure(change) === null);
    check(!practice.validate({...read,result:{startS:10,endS:10}}));
    check(!practice.validate({...read,result:{startS:0,endS:121}}));
  }
}
console.log('oscillation practice:', checks, 'checks');
