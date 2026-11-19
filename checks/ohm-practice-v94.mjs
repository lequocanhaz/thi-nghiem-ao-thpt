import assert from 'node:assert/strict';
import {practice, observeCircuit} from '../dist/l3/ohm-practice.js';

let assertions = 0;
const equal = (actual, expected, message) => { assertions++; assert.deepEqual(actual, expected, message); };
const ok = (value, message) => { assertions++; assert.ok(value, message); };
function apply(state, action) {
  const snapshot = structuredClone(state);
  const next = practice.apply(state, action).state;
  equal(state, snapshot, 'previous state remains intact');
  ok(practice.validate(next), 'accepted action keeps valid state');
  return next;
}
function connect(state, lead, terminal) {
  return apply(state, {type:'connect', lead, terminal});
}
const proper = {
  source: 'ammeterP',
  ammeter: 'resistorP',
  return: 'sourceN',
  voltageP: 'resistorP',
  voltageN: 'resistorN'
};

const initial = practice.initial();
ok(practice.validate(initial));
equal(observeCircuit(initial).status, 'open');
equal(practice.measure(initial), null);
equal(observeCircuit(apply(initial, {type:'switch'})).status, 'loop');

for (const invalid of [
  {type:'connect', lead:'unknown', terminal:'resistorP'},
  {type:'connect', lead:'voltageP', terminal:'constructor'},
  {type:'connect', lead:'voltageN', terminal:'voltmeterN'},
  {type:'set', key:'supplyV', value:Infinity},
  {type:'set', key:'supplyV', value:13},
  {type:'set', key:'resistance', value:0},
  {type:'set', key:'resistance', value:10.5},
  {type:'set', key:'closed', value:true}
]) {
  const result = practice.apply(initial, invalid);
  ok(Array.isArray(result.message));
  equal(result.state, undefined);
}
equal(initial.connections, {source:null, ammeter:null, return:null, voltageP:null, voltageN:null});

let wired = initial;
for (const [lead, terminal] of Object.entries(proper)) wired = connect(wired, lead, terminal);
equal(practice.measure(wired), null, 'wiring does not energize the circuit');
const live = apply(wired, {type:'switch'});
equal(observeCircuit(live).status, 'ready');
equal(practice.measure(live), {voltage:6,current:.6,resistance:10});
ok(practice.validate(JSON.parse(JSON.stringify(live))));
for (const action of [{type:'connect',lead:'source',terminal:'sourceN'},{type:'disconnect',lead:'source'}]) {
  ok(Array.isArray(practice.apply(live, action).message), 'open the switch before revising the circuit');
}
equal(practice.measure(apply(live, {type:'switch'})), null);
const noMeter = apply(wired, {type:'disconnect',lead:'voltageN'});
equal(observeCircuit(apply(noMeter,{type:'switch'})).status,'parallel');

for (const [change, status] of [
  [{source:'sourceN'}, 'short'],
  [{ammeter:'sourceN'}, 'short'],
  [{source:'resistorP', ammeter:null}, 'series'],
  [{voltageN:'resistorP'}, 'parallel'],
  [{voltageP:'resistorN', voltageN:'resistorP'}, 'polarity'],
  [{source:null}, 'loop']
]) {
  const state = {...live,connections:{...proper,...change}};
  equal(observeCircuit(state).status,status);
  equal(practice.measure(state),null);
}
equal(observeCircuit({...live,connections:{...proper,voltageP:'resistorN',voltageN:'resistorP'}}).voltage,-6);
const equivalent = {
  source:'resistorP',
  ammeter:'sourceN',
  return:'ammeterP',
  voltageP:'sourceP',
  voltageN:'sourceN'
};
equal(practice.measure({...live,connections:equivalent}), {voltage:6,current:.6,resistance:10}, 'low-side ammeter and electrically equivalent voltage nodes');

for (const resistance of [2,3,7,10,15,30]) {
  for (const voltage of [0,.5,1.25,3.4,6,8.5,10.25,12]) {
    const state = {...live, supplyV:voltage, resistance};
    const measured = practice.measure(state);
    equal(measured.voltage, voltage);
    ok(Math.abs(measured.current - voltage / resistance) <= .0005 + Number.EPSILON);
    equal(measured.resistance, resistance);
  }
}
equal(practice.measure({...live,supplyV:6.1234,resistance:7}), {voltage:6.12,current:.875,resistance:7}, 'independent display resolution case');
for (const state of [
  {...live, connections:{...proper, invalid:'sourceP'}},
  {...live, connections:{...proper, source:'sourceP'}},
  {...live, resistance:32},
  {...live, closed:'true'},
  {...live, supplyV:NaN},
  {...live, connections:['sourceN']},
  null
]) {
  equal(practice.validate(state),false);
  equal(practice.measure(state),null);
}
console.log(JSON.stringify({status:'PASS',assertions,scope:'Ideal DC circuit nodes, open and short circuits, series and parallel measurement, quantization, immutable state and serialization'}));
