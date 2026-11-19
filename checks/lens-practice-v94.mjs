import assert from 'node:assert/strict';
import {applyLensAction, opticalState, practice, railBounds, validLensRail} from '../dist/l3/lens-practice.js';

let checks = 0;
function check(value) { assert.ok(value); checks++; }
function eq(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function near(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
  checks++;
}
function set(state, station, positionM) {
  const action = {type:'position', station, positionM};
  const result = applyLensAction(state, action);
  assert.ok(result.state, `${station} could not move to ${positionM}`);
  return result.state;
}

const initial = practice.initial();
check(validLensRail(initial));
eq(opticalState(initial).focus, 'after');
eq(practice.measure(initial), null);
eq(railBounds(initial,'objectM'), [.02,.32]);
eq(railBounds(initial,'lensM'), [.20,.66]);
eq(railBounds(initial,'screenM'), [.44,.98]);

const left = set(initial,'screenM',.54);
eq(opticalState(left).focus,'before');
eq(practice.measure(left), null);
const sharp = set(initial,'screenM',.62);
eq(opticalState(sharp).focus, 'sharp');
eq(practice.measure(sharp), {lensNumber:1, objectDistanceM:.24, screenDistanceM:.24});
near(opticalState(sharp).magnification, -1);
near(opticalState(sharp).blurDiameterM, 0);
for (const positionM of [.615,.625]) eq(opticalState(set(initial,'screenM',positionM)).focus,'sharp');
for (const positionM of [.61,.63]) eq(practice.measure(set(initial,'screenM',positionM)),null);

const second = set(set(sharp,'objectM',.08),'screenM',.58);
eq(practice.measure(second), {lensNumber:1, objectDistanceM:.30, screenDistanceM:.20});
near(opticalState(second).magnification, -2/3);
const unchanged = structuredClone(initial);
for (const action of [null,{}, {type:'replace-lens',lensNumber:'1'},{type:'replace-lens',lensNumber:4},
  {type:'position',station:'objectM',positionM:.325}, {type:'position',station:'lensM',positionM:.105},
  {type:'position',station:'screenM',positionM:.385}, {type:'position',station:'objectM',positionM:0},
  {type:'position',station:'screenM',positionM:1.005}, {type:'position',station:'objectM',positionM:Number.NaN},
  {type:'position',station:'screenM',positionM:Infinity}, {type:'position',station:'screenM',positionM:.673},
  {type:'position',station:'f',positionM:.45}]) {
  check(Array.isArray(applyLensAction(initial,action).message));
  eq(initial, unchanged);
}
for (const invalid of [null, {}, [], { ...initial, objectM:'0.14' }, {...initial, objectM:.35},
  {...initial,lensNumber:0}, {...initial,screenM:1.5}, {...initial,objectM:Infinity}, {...initial,unrecognized:1}]) {
  eq(validLensRail(invalid),false);
  eq(practice.measure(invalid),null);
}

const alternate = applyLensAction(initial,{type:'replace-lens',lensNumber:2}).state;
eq(alternate, {...initial, lensNumber:2});
near(opticalState(alternate).imageDistanceM,.48);
eq(opticalState(alternate).focus,'before');
eq(practice.measure(set(alternate,'screenM',.86)),{lensNumber:2,objectDistanceM:.24,screenDistanceM:.48});
const virtual = opticalState(set(initial,'objectM',.30));
eq(virtual.focus,'virtual');
near(virtual.imageDistanceM,-.24);
near(virtual.magnification,3);
eq(practice.measure(set(initial,'objectM',.30)),null);
const collimated = opticalState(set(initial,'objectM',.26));
eq(collimated.focus,'parallel');
eq(collimated.imageDistanceM,null);
eq(collimated.magnification,null);
eq(practice.measure(set(initial,'objectM',.26)),null);
const beyond = opticalState(set(initial,'objectM',.25));
eq(beyond.focus,'beyond');
near(beyond.imageDistanceM,1.56);
eq(practice.measure(set(initial,'objectM',.25)),null);

const aperture = .046;
const tipH = .025;
// Get image position from intersecting the centre and the initially parallel ray.
// Then project the two aperture-edge rays to the actual screen to predict blur.
for (const [index,f] of [.12,.16,.20].entries()) {
  for (let dCentimeters = 6; dCentimeters <= 65; dCentimeters += 1) {
    const d = dCentimeters / 100;
    for (const screenOffset of [.06,.105,.16,.28]) {
      const state = { objectM:.02, lensM:(2+dCentimeters)/100,
        screenM:Math.round((.02+d+screenOffset)*1000)/1000, lensNumber:index+1 };
      check(practice.validate(state));
      const prediction = opticalState(state);
      const screenRayHeight = lensHeight => lensHeight + screenOffset*((lensHeight-tipH)/d - lensHeight/f);
      near(prediction.blurDiameterM, Math.abs(screenRayHeight(aperture) - screenRayHeight(-aperture)));
      const centerSlope = -tipH/d;
      const parallelSlope = -tipH/f;
      if (Math.abs(centerSlope - parallelSlope) < 1e-12) {
        eq(prediction.focus,'parallel');
        eq(prediction.imageDistanceM,null);
        continue;
      }
      const conjugate = tipH/(centerSlope - parallelSlope);
      near(prediction.imageDistanceM,conjugate);
      near(prediction.magnification,centerSlope*conjugate/tipH);
      const accepted = conjugate > 0 && Math.abs(screenOffset-conjugate) <= .005 + 1e-12;
      eq(!!practice.measure(state),accepted);
      if (accepted) {
        const reading = practice.measure(state);
        near(reading.screenDistanceM,screenOffset);
        near(reading.objectDistanceM,d);
      }
    }
  }
}

console.log(JSON.stringify({status:'PASS',checks,scope:'Thin-lens ray intersections, finite aperture defocus, projection gating, SI rail controls and invalid actions'}));
