export const practiceSchema = 'quanh.practice.v1';
export const maxRuns = 12;
export const maxReadings = 120;
export const maxEvents = 400;
export const maxBytes = 2_000_000;

const noteKeys = ['prediction', 'analysis', 'conclusion'];
const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);
const isObject = value => value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
const isoDate = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));

export function dataSafe(value, depth = 0) {
  if (depth > 8) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 6000;
  if (Array.isArray(value)) return value.length <= maxEvents && value.every(item => dataSafe(item, depth + 1));
  return isObject(value) && Object.keys(value).length <= 40 &&
    Object.entries(value).every(([key, item]) => key.length <= 64 && !dangerousKeys.has(key) && dataSafe(item, depth + 1));
}

export function validValues(practice, values) {
  return isObject(values) && Object.keys(values).length === practice.columns.length &&
    practice.columns.every(({key}) => Object.hasOwn(values, key) && Number.isFinite(values[key]) && Math.abs(values[key]) <= 1e15);
}

export function createRun(practice) {
  return {state: practice.initial(), notes: {prediction: '', analysis: '', conclusion: ''}, readings: [], events: []};
}

export function createPracticeSession(practice) {
  return {schema: practiceSchema, labId: practice.id, runs: [createRun(practice)]};
}

function checkedState(practice, state) {
  return dataSafe(state) && practice.validate(state) === true;
}

export function parsePracticeSession(text, practice) {
  if (typeof text !== 'string' || text.length > maxBytes) throw new RangeError('Session size');
  const session = JSON.parse(text);
  if (!isObject(session) || session.schema !== practiceSchema || session.labId !== practice.id ||
      !Array.isArray(session.runs) || !session.runs.length || session.runs.length > maxRuns) throw new TypeError('Session identity');
  for (const run of session.runs) {
    if (!isObject(run) || !checkedState(practice, run.state) || !isObject(run.notes) ||
        !noteKeys.every(key => typeof run.notes[key] === 'string' && run.notes[key].length <= 4000) ||
        !Array.isArray(run.readings) || run.readings.length > maxReadings || !Array.isArray(run.events) ||
        run.events.length > maxEvents) throw new TypeError('Run');
    for (const row of run.readings) {
      if (!isObject(row) || !isoDate(row.recordedAt) || !validValues(practice, row.values) ||
          !checkedState(practice, row.state)) throw new TypeError('Reading');
    }
    for (const event of run.events) {
      if (!isObject(event) || event.schemaVersion !== 1 || !isoDate(event.recordedAt) ||
          typeof event.accepted !== 'boolean' || !isObject(event.action) || !dataSafe(event.action) ||
          typeof event.type !== 'string' || event.type.length > 64) throw new TypeError('Action');
    }
  }
  // Copy the defined fields into a fresh document. Imports are data only.
  return {schema: practiceSchema, labId: practice.id, runs: session.runs.map(run => ({
    state: run.state,
    notes: Object.fromEntries(noteKeys.map(key => [key, run.notes[key]])),
    readings: run.readings.map(({recordedAt, values, state}) => ({recordedAt, values, state})),
    events: run.events.map(({schemaVersion, type, action, accepted, recordedAt}) => ({schemaVersion, type, action, accepted, recordedAt}))
  }))};
}

export function serializePracticeSession(session) {
  const text = JSON.stringify(session);
  if (text.length > maxBytes) throw new RangeError('Session size');
  return text;
}

export function exportPracticeCSV(session, practice) {
  const quoted = value => '"' + String(value).replaceAll('"', '""') + '"';
  const rows = [['lab_id', 'run', 'recorded_at', ...practice.columns.map(({key, unit}) => key + ' (' + unit + ')')]];
  session.runs.forEach((run, index) => {
    for (const row of run.readings) rows.push([session.labId, index + 1, row.recordedAt, ...practice.columns.map(({key}) => row.values[key])]);
  });
  return '\uFEFF' + rows.map(row => row.map(quoted).join(',')).join('\r\n');
}
