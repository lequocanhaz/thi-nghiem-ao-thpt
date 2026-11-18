import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { mountThermalComparison, prepareComparisonSeries } from '../dist/l3/thermal-comparison.js';
import { newSession, newTrial, parseSession, serializeSession } from '../dist/l3/data-notebook.js';
import { readingFromObservation } from '../dist/l3/measurement-engine.js';
import { applyAction, createState, observe, validateState } from '../dist/l3/thermal-physics.js';
import { initialPositions, GEOMETRY_VERSION } from '../dist/l3/thermal-apparatus.js';

const trace = (simTimeS, displayTemperatureC, probePlacement = 'water', extra = {}) => ({
  simTimeS, displayTemperatureC, probePlacement, valid: true, phase: 'liquid', ...extra
});

// Source isolation and actual time ordering. A missing/invalid observation breaks the trace.
const mixedTrace = [
  trace(11, 22), trace(0, 20), trace(1, 21), trace(2, 36, 'bath'),
  trace(3, 20), trace(4, 21, 'water', { valid: false }), trace(5, 23),
  trace(6, 25, 'water', { representative: false }), trace(7, 24), trace(8, 24),
  trace(-1, 1), trace(9, Number.NaN), trace(9.5, 50, 'solid')
];
const mixed = { trace: mixedTrace, readings: [{
  simTimeS: 0, studentValueC: 55, measuredValue: 293.15, valid: true,
  observation: { probePlacement: 'water' }
}, {
  simTimeS: 1, studentValueC: 22, valid: true, excludedReason: 'Parallax',
  observation: { probePlacement: 'water' }
}, { simTimeS: 2, studentValueC: 30, valid: true }] };
assert.deepEqual(prepareComparisonSeries(mixed).points.map(p => p.temperatureC), [55]);
assert.equal(prepareComparisonSeries(mixed).omitted, 1);
const water = prepareComparisonSeries(mixed, { source: 'instrument' });
assert.deepEqual(water.points.map(p => p.timeS), [0, 1, 3, 5, 6, 7, 8, 11]);
assert.deepEqual(water.points.map(p => p.segment), [1, 1, 2, 3, 4, 5, 5, 6]);
assert.equal(water.points[4].local, true);
assert.equal(water.omitted, 2);
assert.equal(prepareComparisonSeries(mixed, { source: 'instrument', medium: 'bath' }).first.temperatureC, 36);
assert.equal(prepareComparisonSeries(mixed, { source: 'instrument', medium: 'solid' }).first.temperatureC, 50);
assert.equal(mixed.trace[0].simTimeS, 11, 'sorting never changes the session');
assert.equal(prepareComparisonSeries({ trace: {} }, { source: 'instrument' }).count, 0);

// Only accepted transfers set each trial's time origin; later or undone transfers do not reset it.
const event = (simTimeS, actionType, payloadSI, extra = {}) => ({ simTimeS, actionType, payloadSI, accepted: true, ...extra });
const iceEvents = [
  event(6, 'add-ice', { target: 'vessel', massKg: .01 }),
  event(4, 'add-ice', { target: 'vessel', massKg: .01 }),
  event(1, 'add-ice', { target: 'vessel', massKg: .01 }, { undone: true }),
  event(2, 'add-ice', { target: 'vessel', massKg: .01 }, { accepted: false }),
  event(3, 'add-ice', { target: 'tray', massKg: .01 })
];
const aligned = prepareComparisonSeries({ activity: 'ice', events: iceEvents, trace: [trace(1, 40), trace(4, 30), trace(5, 25)] }, { source: 'instrument', origin: 'sample' });
assert.deepEqual(aligned.points.map(p => [p.timeS, p.temperatureC]), [[0, 30], [1, 25]]);
const alignedSolid = prepareComparisonSeries({
  activity: 'solid',
  events: [event(2, 'move-solid', { target: 'bath' }), event(8, 'move-solid', { target: 'water' })],
  trace: [trace(4, 60), trace(8, 25), trace(9, 26)]
}, { source: 'instrument', origin: 'sample' });
assert.deepEqual(alignedSolid.points.map(p => [p.timeS, p.temperatureC]), [[0, 25], [1, 26]]);
assert.equal(prepareComparisonSeries(mixed, { origin: 'sample' }).missingOrigin, true);

// Wide histories stay bounded while preserving endpoints and temperature extrema.
const long = Array.from({ length: 10000 }, (_, index) => trace(index, 20));
long[1000].displayTemperatureC = 103;
long[8764].displayTemperatureC = -5;
long[9765].valid = false;
const sampled = prepareComparisonSeries({ trace: long }, { source: 'instrument' });
assert.equal(sampled.count, 9999);
assert(sampled.points.length <= 480);
assert.equal(sampled.points[0].timeS, 0);
assert.equal(sampled.points.at(-1).timeS, 9999);
assert(sampled.points.some(p => p.temperatureC === 103));
assert(sampled.points.some(p => p.temperatureC === -5));
assert.notEqual(sampled.points.find(p => p.timeS < 9765).segment, sampled.points.at(-1).segment);

// An old-format session is still readable through its normal parsing path.
const session = newSession('solid');
const first = newTrial(session, 'solid', {});
const second = newTrial(session, 'solid', {});
second.trialId = first.trialId;
let state = { ...createState('solid'), apparatusGeometryVersion: GEOMETRY_VERSION };
for (const [actionType, payloadSI] of [
  ['place-vessel', { placed: true }],
  ['pour', { massKg: 0.2, target: 'vessel' }],
  ['place-probe', { placement: 'water' }]
]) {
  const result = applyAction(state, { actionType, payloadSI });
  assert.equal(result.ok, true);
  state = result.state;
}
session.physicalState = state;
session.apparatusState = {
  positions: { ...initialPositions(state), probe: { x: 420, y: 318 } },
  cupAngleRad: 0,
  camera: null,
  geometryVersion: GEOMETRY_VERSION
};
first.readings.push(readingFromObservation(observe(state), '30.4', {}));
second.readings.push(readingFromObservation(observe(state), '32.8', {}));
first.trace.push(trace(0, 20), trace(1, 21), trace(2, 90, 'bath'), trace(3, 30), trace(4, 31));
second.trace.push(trace(0, 20), trace(1, 22), trace(2, 42, 'solid'));
const parsed = parseSession(serializeSession(session), { validateState }).session;
const unchanged = serializeSession(parsed);
const { document, Event } = parseHTML('<div id="test"></div>');
const host = document.querySelector('#test');
const comparison = mountThermalComparison(host, { session: parsed, locale: 'vi-VN' });
assert.equal(host.querySelector('summary').textContent, 'So sánh các lượt');
assert.equal(host.querySelector('.l3-cmp-body').children.length, 0, 'closed view defers all controls and charts');
const details = host.querySelector('details');
details.open = true;
details.dispatchEvent(new Event('toggle'));
assert.equal(host.querySelector('[data-l3-cmp=a] option[selected]').textContent, 'Lượt 1');
assert.equal(host.querySelector('[data-l3-cmp=b] option[selected]').textContent, 'Lượt 2');
assert.match(host.querySelector('figure').textContent, /Số em ghi/);
assert.equal(host.querySelector('.l3-cmp-a .l3-cmp-line').getAttribute('d'), '', 'manual samples are plotted as points');
assert.match(host.querySelector('.l3-cmp-summaries').textContent, /30,4 °C/);
assert.match(host.querySelector('.l3-cmp-summaries').textContent, /32,8 °C/);
const select = host.querySelector('[data-l3-cmp=source]');
select.querySelector('[value=student]').removeAttribute('selected');
select.querySelector('[value=instrument]').setAttribute('selected', '');
select.dispatchEvent(new Event('change', { bubbles: true }));
assert.equal(comparison.getView().source, 'instrument');
assert.equal(host.querySelector('.l3-cmp-a .l3-cmp-line').getAttribute('d').split('M').length - 1, 2, 'one bath reading separates two water segments');
assert(!host.querySelector('figure').textContent.includes('90'));
comparison.update(parsed, { traceOnly: true });
assert.strictEqual(host.querySelector('[data-l3-cmp=source]'), select, 'live refresh retains control identity and focus');
const view = comparison.getView();
comparison.destroy();
const english = mountThermalComparison(host, { session: parsed, locale: 'en-US', view });
assert.equal(host.querySelector('summary').textContent, 'Compare trials');
assert.equal(english.getView().source, 'instrument');
assert.equal(english.getView().open, true);
assert.match(host.querySelector('figure').textContent, /Thermometer trace/);
const origin = host.querySelector('[data-l3-cmp=origin]');
origin.querySelector('[value=start]').removeAttribute('selected');
origin.querySelector('[value=sample]').setAttribute('selected', '');
origin.dispatchEvent(new Event('change', { bubbles: true }));
assert.equal(english.getView().origin, 'sample');
assert.match(host.querySelector('.l3-cmp-summaries').textContent, /This trial has no recorded sample transfer/);
assert.equal(serializeSession(parsed), unchanged, 'view changes never write new readings or answers');
const precisionFixture = structuredClone(parsed);
for (const [index, trial] of precisionFixture.trials.entries()) {
  trial.conditionsSI.waterMassKg = .050125 + (index === 0 ? -1e-16 : 1e-16);
  trial.events.push({actionType: 'move-solid', accepted: true, payloadSI: {target: 'water'}, simTimeS: 0});
}
english.update(precisionFixture);
assert.equal(host.querySelectorAll('.l3-cmp-summary dd').length >= 2, true);
const matchedWater = [...host.querySelectorAll('.l3-cmp-summary dd')].filter(node => node.textContent.startsWith('50.125 g'));
assert.equal(matchedWater.length, 2, 'floating-point accumulation cannot make equal doses look different');
english.destroy();
assert.equal(host.children.length, 0);

console.log('PASS V92 comparison: existing sessions, two runs on shared axes, data-source and placement isolation, trace gaps, exclusion, local samples, bounded plots, locale and stable controls.');
