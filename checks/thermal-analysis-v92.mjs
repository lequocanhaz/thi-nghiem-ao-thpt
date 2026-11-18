import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {calculateThermalProperty, renderThermalCalculation, showThermalCalculation, thermalCalculationMessage} from '../dist/l3/thermal-analysis.js';
import {newSession, newTrial, parseSession, serializeSession} from '../dist/l3/data-notebook.js';
import {createState, validateState} from '../dist/l3/thermal-physics.js';
import {initialPositions} from '../dist/l3/thermal-apparatus.js';

let assertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  assertions++;
}
function close(actual, expected, tolerance = 1e-8) {
  check(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by more than ${tolerance}`);
}
function rejects(activity, readings, code) {
  assert.throws(() => calculateThermalProperty(activity, readings), error => error instanceof RangeError && error.code === code);
  assertions++;
}

// Independent enthalpy oracle: choose material properties, solve for the final
// equilibrium, then use the estimator to recover the original property.
const waterSpecificHeat = 4180;
for (const mw of [.12, .2, .5]) for (const mi of [.005, .02, .035]) {
  for (const ccal of [0, 45, 200]) for (const tw of [35, 55, 80]) {
    const referenceLatentHeat = 334000;
    const tf = (mw * waterSpecificHeat * tw + ccal * tw - mi * referenceLatentHeat) / ((mw + mi) * waterSpecificHeat + ccal);
    if (tf <= 0) continue;
    const readings = Object.freeze({mw, mi, ccal, tw, tf, allMelted: true});
    const {calculation, energyTerms} = calculateThermalProperty('ice', readings);
    close(calculation.latentHeatJPerKg, referenceLatentHeat, 1e-6);
    close(energyTerms.fusionJ, mi * referenceLatentHeat);
    close(energyTerms.originalWaterJ + energyTerms.calorimeterJ + energyTerms.fusionJ + energyTerms.meltwaterJ, 0);
    check(energyTerms.originalWaterJ < 0 && energyTerms.meltwaterJ > 0 && energyTerms.calorimeterJ <= 0);
  }
}

for (const mw of [.1, .2, .4]) for (const ms of [.05, .1, .2]) {
  for (const ccal of [0, 45, 200]) for (const [tw, ts] of [[20, 80], [55, 10]]) {
    const referenceSpecificHeat = 900;
    const initialEnergy = mw * waterSpecificHeat * tw + ccal * tw + ms * referenceSpecificHeat * ts;
    const tf = initialEnergy / (mw * waterSpecificHeat + ccal + ms * referenceSpecificHeat);
    const readings = Object.freeze({mw, ms, ccal, tw, ts, tf});
    const {calculation, energyTerms} = calculateThermalProperty('solid', readings);
    close(calculation.specificHeatJPerKgK, referenceSpecificHeat);
    close(energyTerms.solidJ, ms * referenceSpecificHeat * (tf - ts));
    close(energyTerms.originalWaterJ + energyTerms.calorimeterJ + energyTerms.solidJ, 0);
    check(Math.sign(energyTerms.originalWaterJ) === Math.sign(ts - tw));
  }
}

const ice = {mw: .2, mi: .02, ccal: 0, tw: 40, tf: 29.1, allMelted: true};
const solid = {mw: .2, ms: .1, ccal: 0, tw: 20, ts: 80, tf: 40};
for (const [activity, data, massKey] of [['ice', ice, 'mi'], ['solid', solid, 'ms']]) {
  rejects(activity, undefined, 'missing-readings');
  rejects(activity, {...data, tf: ''}, 'missing-readings');
  rejects(activity, {...data, mw: '.2'}, 'invalid-readings');
  rejects(activity, {...data, ccal: -1}, 'invalid-readings');
  rejects(activity, {...data, tw: NaN}, 'invalid-readings');
  rejects(activity, {...data, mw: Infinity}, 'invalid-readings');
  rejects(activity, {...data, [massKey]: 0}, 'invalid-readings');
  rejects(activity, {...data, ccal: 1e308}, 'numeric-domain');
  rejects(activity, {...data, [massKey]: Number.MIN_VALUE}, 'numeric-domain');
}
rejects('ice', {...ice, allMelted: false}, 'all-ice-melted');
rejects('ice', {...ice, allMelted: 'true'}, 'all-ice-melted');
rejects('ice', {...ice, tf: 0}, 'ice-temperature-order');
rejects('ice', {...ice, tf: 40}, 'ice-temperature-order');
rejects('ice', {...ice, tf: 39.99}, 'inconsistent-heat');
rejects('solid', {...solid, tf: 20}, 'solid-temperature-order');
rejects('solid', {...solid, tf: 80}, 'solid-temperature-order');
rejects('solid', {...solid, tw: -1000, ts: -900, tf: -950}, 'temperature-domain');
rejects('solid', {...solid, ts: -273.16}, 'temperature-domain');
rejects('ice', {...ice, tw: 100.1}, 'temperature-domain');
rejects('solid', {...solid, ms: 1e308}, 'numeric-domain');
close(calculateThermalProperty('solid', solid).calculation.specificHeatJPerKgK, 4180, 0);

// Output rendering preserves the legacy solid result shape and the shared
// session schema. Loaded values are validated before display.
for (const [activity, data, property, unit] of [
  ['ice', ice, 'latentHeatJPerKg', 'J/kg'],
  ['solid', solid, 'specificHeatJPerKgK', 'J/(kg·K)']
]) {
  const {calculation} = calculateThermalProperty(activity, data);
  const session = newSession(activity);
  newTrial(session, activity, {}).calculation = calculation;
  session.physicalState = {...createState(activity), apparatusGeometryVersion: 'thermal.geometry.v2'};
  session.apparatusState = {positions: initialPositions(session.physicalState), cupAngleRad: 0, camera: null, geometryVersion: 'thermal.geometry.v2'};
  const restored = parseSession(serializeSession(session), {activity, validateState: state => validateState(state).valid}).session.trials[0].calculation;
  assert.deepEqual(restored, calculation);
  assertions++;
  for (const locale of ['vi-VN', 'en-US']) {
    const {document} = parseHTML(`<html><body>${renderThermalCalculation(activity, locale)}</body></html>`);
    const output = document.querySelector('#l3Calculated');
    const balance = document.querySelector('#l3EnergyBalance');
    const formFields = [...document.querySelectorAll('[data-l3-calc]')];
    check(formFields.length === (activity === 'ice' ? 5 : 6));
    check(formFields.every(input => !input.hasAttribute('value') && input.closest('label')));
    const confirmation = document.querySelector('[data-l3-calc-all-melted]');
    check(activity === 'ice' ? confirmation && !confirmation.hasAttribute('checked') : !confirmation);
    check(output.textContent === '' && balance.hidden);
    check(showThermalCalculation(document, activity, locale, restored));
    check(output.textContent.endsWith(unit) && !balance.hidden);
    check(balance.querySelectorAll('.l3-calc-terms:first-of-type dd').length > 0);
    const bogus = Object.freeze({...restored, [property]: '<img src=x onerror=alert(1)>'});
    check(!showThermalCalculation(document, activity, locale, bogus));
    check(!document.querySelector('img') && balance.hidden && output.textContent === '');
    check(document.querySelector('#l3CalculationStatus').textContent === thermalCalculationMessage('saved-result-inconsistent', locale));
    check(!showThermalCalculation(document, activity, locale, null));
    check(document.querySelector('#l3CalculationStatus').textContent === '' && balance.hidden && !balance.children.length);
  }
}
console.log(JSON.stringify({status: 'PASS', assertions, scope: 'Independent ice/solid enthalpy oracles, numerical and experimental domains, legacy storage, localized empty inputs and safe result rendering.'}));
