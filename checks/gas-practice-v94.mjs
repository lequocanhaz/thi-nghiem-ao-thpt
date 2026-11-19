import assert from 'node:assert/strict';
import {practice, evaluateGasPractice} from '../dist/l3/gas-practice.js';

const expectedProductPaM3 = .24 * 300 * 8.314462618;
const initial = practice.initial();
assert.deepEqual(initial, {volumeM3: 0.006});
assert.equal(practice.id, 'gas');
assert.equal(practice.validate(initial), true);

let previousPressure = Infinity;
for (let tick = 200; tick <= 1000; tick++) {
  const volumeM3 = tick / 100_000;
  const next = practice.apply(initial, {type: 'move-piston', volumeM3}).state;
  assert.deepEqual(initial, {volumeM3: 0.006}, 'the reducer never changes the prior state');
  const state = JSON.parse(JSON.stringify(next));
  assert.equal(practice.validate(state), true);
  const model = evaluateGasPractice(state);
  assert.ok(Math.abs(model.pressurePa * volumeM3 - expectedProductPaM3) < 1e-10, 'ideal-gas pressure-volume invariant');
  assert.ok(model.pressurePa < previousPressure, 'expansion decreases absolute pressure');
  previousPressure = model.pressurePa;
  assert.equal(model.amountMol, .24);
  assert.equal(model.temperatureK, 300);
  const reading = practice.measure(state);
  assert.equal(reading.volumeL, tick / 100);
  assert.ok(Math.abs(reading.pressureKPa * 1_000 - model.pressurePa) <= 50 + 1e-8, 'readout within half a division');
  assert.deepEqual(Object.keys(reading), practice.columns.map(column => column.key));
}
for (const volumeM3 of [0, -.001, .00199999, .01000001, Infinity, NaN, '0.006', undefined, null]) {
  assert.equal(practice.apply(initial, {type: 'move-piston', volumeM3}).state, undefined);
  assert.equal(practice.measure({volumeM3}), null);
}
const compressed = practice.measure({volumeM3: .002});
const expanded = practice.measure({volumeM3: .01});
assert.deepEqual(compressed, {volumeL: 2, pressureKPa: 299.3, temperatureK: 300, amountMol: .24});
assert.deepEqual(expanded, {volumeL: 10, pressureKPa: 59.9, temperatureK: 300, amountMol: .24});
assert.equal(practice.apply(initial, {type: 'remove-gas', amountMol: 0.240}).state, undefined);
assert.equal(practice.apply(initial, null).state, undefined);
assert.equal(practice.validate({volumeM3: .006, temperatureK: 300}), false);
assert.equal(practice.validate({volumeM3: .006, pressurePa: 1}), false);
console.log('PASS gas V94: 801 SI states, exact pressure-volume conservation, bounded piston, fixed n/T, rounded output and invalid-action guards.');
