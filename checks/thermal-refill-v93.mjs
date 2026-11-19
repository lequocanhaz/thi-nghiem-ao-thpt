import assert from 'node:assert/strict';
import {createState,applyAction,validateState,totalMassKg,totalEnergyJ,observe,step,cupRefillCapacityKg} from '../dist/l3/thermal-physics.js';
import {newSession,newTrial,serializeSession,parseSession,exportCSV} from '../dist/l3/data-notebook.js';
import {readingFromObservation} from '../dist/l3/measurement-engine.js';
import {makeEvent} from '../dist/l3/interaction-core.js';
import {initialPositions} from '../dist/l3/thermal-apparatus.js';

let assertions=0;
const check=(value,message)=>{assert.ok(value,message);assertions++;};
const close=(actual,expected,tolerance=1e-9)=>check(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected} within ${tolerance}`);
function act(s,type,p={}){const r=applyAction(s,{actionType:type,payloadSI:p});check(r.ok,`${type}: ${r.reason}`);return r;}
function invariant(s){
 check(validateState(s).valid,JSON.stringify(validateState(s).errors));
 const incoming=s.massInKg??0;
 close(totalMassKg(s),s.initialMassKg+incoming,1e-9);
 close(totalEnergyJ(s)+s.energyOutJ,s.initialEnergyJ+s.energyInJ,1e-6);
 close(s.massResidualKg,0,1e-9);close(s.energyResidualJ,0,1e-6);
}
for(const activity of ['ice','solid']){
 let s=createState(activity),original=structuredClone(s);
 check(!Object.hasOwn(s,'massInKg'),'Old state need not contain incoming mass');
 close(cupRefillCapacityKg(s),0);
 const full=applyAction(s,{actionType:'refill-cup',payloadSI:{massKg:.01}});
 check(!full.ok&&full.reason==='cup-full','Full source rejects extra water');assert.deepEqual(s,original);assertions++;
 s=act(s,'pour',{massKg:.2,target:'table'}).state;
 const before=structuredClone(s),r=act(s,'refill-cup',{massKg:.2});s=r.state;
 close(s.cupWaterMassKg,.2);close(s.cupTempC,s.config.waterTempC);close(s.massInKg,.2);
 close(s.energyInJ-before.energyInJ,.2*4180*s.config.waterTempC,1e-8);
 close(r.effects.addedMassKg,.2);close(r.effects.inputEnergyJ,.2*4180*s.config.waterTempC,1e-8);
 close(s.initialMassKg,original.initialMassKg);close(s.initialEnergyJ,original.initialEnergyJ);
 close(s.spillMassKg,before.spillMassKg);close(s.spillEnergyJ,before.spillEnergyJ);
 invariant(s);assert.deepEqual(before,act(original,'pour',{massKg:.2,target:'table'}).state);assertions++;
 s=act(s,'place-vessel').state;s=act(s,'pour',{massKg:.125,target:'vessel'}).state;
 close(cupRefillCapacityKg(s),.125);
 const beforePartial=structuredClone(s);s=act(s,'refill-cup',{massKg:.1}).state;
 close(s.cupWaterMassKg,.175);close(s.massInKg,.3);close(s.waterMassKg,beforePartial.waterMassKg);
 close(s.timeS,beforePartial.timeS);assert.deepEqual(s.config,original.config);assertions++;
 invariant(s);s=step(s,2);invariant(s);close(observe(s).massInKg,.3);
 const invalid=[0,-.01,NaN,Infinity,'0.01',null,undefined,3];
 for(const massKg of invalid){const prev=structuredClone(s),r=applyAction(s,{actionType:'refill-cup',payloadSI:{massKg}});check(!r.ok,'Bad SI mass rejected');check(r.state===s,'Bad mass returns original state');assert.deepEqual(s,prev);assertions++;}
 const over=applyAction(s,{actionType:'refill-cup',payloadSI:{massKg:.03}});
 check(!over.ok&&over.reason==='refill-exceeds-capacity','Oversized refill rejected atomically');check(over.state===s,'No implicit spill or clamping');
 const temperatureOverride=applyAction(s,{actionType:'refill-cup',payloadSI:{massKg:.01,temperatureC:95}});
 check(!temperatureOverride.ok,'Unsupported incoming-temperature override rejected');
 const session=newSession(activity);newTrial(session,activity,{});session.physicalState=s;session.apparatusState={positions:initialPositions(s),cupAngleRad:0};
 const event=makeEvent({sessionId:session.sessionId,simTimeS:s.timeS,actionType:'refill-cup',targetId:'cup',payloadSI:{massKg:.1},accepted:true});
 const observation=observe(s);session.trials[0].events.push(event);session.trials[0].trace.push({...observation,conditionsSI:{}});session.trials[0].readings.push(readingFromObservation(observation,20,{}));
 const raw=serializeSession(session),parsed=parseSession(raw,{activity,validateState:value=>validateState(value).valid}).session;
 assert.deepEqual(parsed.physicalState,s);assertions++;invariant(parsed.physicalState);const csv=exportCSV(parsed),csvRows=csv.split('\r\n');check(csv.startsWith('\uFEFF'),'CSV export remains available');check(csvRows[0].endsWith('\"mass_in_kg\"'),'CSV appends external mass column');check(csvRows[1].endsWith('\"'+s.massInKg+'\"'),'Manual reading retains external mass');check(csvRows[2].endsWith('\"'+s.massInKg+'\"'),'Automatic trace retains external mass');assert.deepEqual(parsed.trials[0].events[0],event);assertions++;
 for(const value of [-1,Infinity,NaN,null,'0']){const bad=structuredClone(s);bad.massInKg=value;check(!validateState(bad).valid,'Malformed incoming mass ledger rejected');}
 const forged=structuredClone(s);forged.massInKg+=.01;check(!validateState(forged).valid,'Ledger mass mismatch rejected');
 // Legacy absence stays absent during save/load and stepping; no migration rewrites.
 session.physicalState=original;const legacyRaw=serializeSession(session);const legacy=parseSession(legacyRaw,{activity,validateState:value=>validateState(value).valid}).session;
 check(!Object.hasOwn(legacy.physicalState,'massInKg'),'Old state remains byte-shape compatible');check(!Object.hasOwn(step(legacy.physicalState,1),'massInKg'),'Step does not backfill old state');
}
// Fill/empty repeatedly past the original stock; incoming mass is external,
// not a replacement of the initial ledger or removal of earlier spills.
let s={...createState('ice',{waterMassKg:.123456,waterTempC:57.25,capacityM3:.0001}),apparatusGeometryVersion:'thermal.geometry.v2'};s=act(s,'place-vessel').state;
for(let i=0;i<40;i++){
 s=act(s,'pour',{massKg:.123456,target:i%2?'table':'vessel'}).state;
 const spillBefore=s.spillMassKg;s=act(s,'refill-cup',{massKg:.123456}).state;
 close(s.spillMassKg,spillBefore);close(s.massInKg,(i+1)*.123456,1e-12);invariant(s);
}
close(s.energyInJ,40*.123456*4180*57.25,1e-6);
const zero=createState('ice',{waterMassKg:0});close(cupRefillCapacityKg(zero),0);
check(!applyAction(zero,{actionType:'refill-cup',payloadSI:{massKg:.01}}).ok,'Configured-zero source stays unavailable');invariant(zero);
let cold=createState('solid',{waterTempC:0});cold=act(cold,'pour',{massKg:.2,target:'table'}).state;cold=act(cold,'refill-cup',{massKg:.2}).state;close(cold.energyInJ,0);close(cold.massInKg,.2);invariant(cold);
// The old source-temperature import guard permits a tiny finite tolerance.
// A valid, energy-accounted imported difference must not be silently erased
// when configured-temperature water is mixed into that existing source.
for(const activity of ['ice','solid']){
 let imported=act(createState(activity,{waterMassKg:2,waterTempC:40}),'pour',{massKg:1,target:'table'}).state;
 const deltaC=8e-9;
 imported.cupTempC+=deltaC;
 imported.energyInJ+=imported.cupWaterMassKg*4180*deltaC;
 imported.energyResidualJ=totalEnergyJ(imported)+imported.energyOutJ-imported.energyInJ-imported.initialEnergyJ;
 check(validateState(imported).valid,'Tiny, ledger-consistent legacy source-temperature difference is valid');
 const session=newSession(activity);newTrial(session,activity,{});session.physicalState=imported;session.apparatusState={positions:initialPositions(imported),cupAngleRad:0};
 imported=parseSession(serializeSession(session),{activity,validateState:value=>validateState(value).valid}).session.physicalState;
 const original=structuredClone(imported),oldCupMass=imported.cupWaterMassKg,oldCupTemp=imported.cupTempC,addedMass=1;
 const expectedTemp=(oldCupMass*oldCupTemp+addedMass*imported.config.waterTempC)/(oldCupMass+addedMass);
 const filled=act(imported,'refill-cup',{massKg:addedMass}).state;
 close(filled.cupTempC,expectedTemp,1e-12);invariant(filled);
 close(filled.energyInJ,original.energyInJ+addedMass*4180*original.config.waterTempC,1e-8);
 assert.deepEqual(imported,original);assertions++;
 session.physicalState=filled;const restored=parseSession(serializeSession(session),{activity,validateState:value=>validateState(value).valid}).session.physicalState;
 assert.deepEqual(restored,filled);assertions++;invariant(restored);
}
console.log(JSON.stringify({status:'PASS',assertions,scope:'External source refill, empty/partial stock, exact amount and temperature, unchanged initial ledgers, mass/energy invariants, spills, malformed SI input and old/new session roundtrips.'}));
