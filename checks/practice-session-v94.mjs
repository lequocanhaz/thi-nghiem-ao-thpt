import assert from 'node:assert/strict';
import {experiments} from '../dist/experiments.js';
import {practice as ohm} from '../dist/l3/ohm-practice.js';
import {practice as lens} from '../dist/l3/lens-practice.js';
import {practice as oscillation} from '../dist/l3/oscillation-practice.js';
import {practice as gas} from '../dist/l3/gas-practice.js';
import {practice as lever} from '../dist/l3/lever-practice.js';
import {
  createPracticeSession, dataSafe, exportPracticeCSV, maxBytes, maxRuns, parsePracticeSession,
  serializePracticeSession, validValues
} from '../dist/l3/practice-session.js';

const practices = [ohm, lens, oscillation, gas, lever];
assert.equal(experiments.length, 300);
assert.equal(new Set(experiments.map(e => e.id)).size, 300);
assert.equal(new Set(practices.map(lab => lab.id)).size, 5);
assert.throws(() => parsePracticeSession(' '.repeat(maxBytes + 1), gas), /size/);
assert.equal(dataSafe(JSON.parse('{"__proto__":{"polluted":true}}')), false);
assert.equal(dataSafe({a: {constructor: {prototype: {}}}}), false);
assert.equal(dataSafe(Infinity), false);
assert.equal(dataSafe({a:'a'.repeat(6001)}), false);
const at = '2026-11-19T00:00:00.000Z';
for (const lab of practices) {
  assert.ok(experiments.some(e => e.id === lab.id));
  assert.equal(new Set(lab.columns.map(column => column.key)).size, lab.columns.length);
  assert.ok(lab.columns.length >= 2);
  assert.equal(lab.validate(lab.initial()), true);
  const session = createPracticeSession(lab);
  const run = session.runs[0];
  run.notes.prediction = 'Đo khi điều kiện đúng <script>';
  run.events.push({schemaVersion:1,type:'setup',action:{type:'setup'},accepted:false,recordedAt:at});
  const values = Object.fromEntries(lab.columns.map(({key}, i) => [key, i + .25]));
  run.readings.push({recordedAt:at,values,state:structuredClone(run.state)});
  const text = serializePracticeSession(session);
  assert.deepEqual(parsePracticeSession(text, lab), session);
  assert.throws(() => parsePracticeSession(text, practices.find(other => other !== lab)), /identity/);
  assert.ok(exportPracticeCSV(session, lab).includes('"0.25"'));
  assert.equal(validValues(lab, {...values, unexpected:5}), false);
  assert.equal(validValues(lab, {...values, [lab.columns[0].key]:NaN}), false);
  assert.throws(() => parsePracticeSession(JSON.stringify({...session,runs:Array(maxRuns+1).fill(run)}), lab), /identity/);
  const damaged = structuredClone(session);
  damaged.runs[0].readings[0].values[lab.columns[0].key] = null;
  assert.throws(() => parsePracticeSession(JSON.stringify(damaged),lab), /Reading/);
  damaged.runs[0].readings = [];
  damaged.runs[0].events[0].action = JSON.parse('{"__proto__":{"x":10}}');
  assert.throws(() => parsePracticeSession(JSON.stringify(damaged),lab), /Action/);
}
console.log('PASS 5 practice sessions, strict per-lab identity, independent 300 catalog IDs, rejected malformed state and retained learner values, events and notes.');
