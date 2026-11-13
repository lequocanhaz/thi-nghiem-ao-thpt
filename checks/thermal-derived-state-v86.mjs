// Independent import/ledger regressions. No browser or device certification.
import assert from 'node:assert/strict';
import {createState,validateState,applyAction,step,observe,totalEnergyJ,totalMassKg} from '../dist/l3/thermal-physics.js';
import {newSession,newTrial,parseSession,serializeSession} from '../dist/l3/data-notebook.js';

let validStates=0,rejectedStates=0,rejectedImports=0;
const fields=['waterVolumeM3','energyResidualJ','massResidualKg'];
function sessionFor(state){const session=newSession(state.activity);newTrial(session,state.activity,{});session.physicalState=structuredClone(state);return session;}
function parse(text,activity){return parseSession(text,{activity,validateState:state=>validateState(state).valid});}
function valid(state){
 const before=structuredClone(state);assert.equal(validateState(state).valid,true);assert.deepEqual(state,before,'Validation does not normalize a valid state');
 const session=sessionFor(state),text=serializeSession(session);assert.deepEqual(parse(text,state.activity).session,session,'Existing v1 physical/v3 session shape round-trips without migration');
 assert.ok(Number.isFinite(observe(state).energyResidualJ));validStates++;
}
function reject(state,label){
 const before=structuredClone(state);assert.equal(validateState(state).valid,false,label);assert.deepEqual(state,before,'Rejected physical state must remain intact: '+label);
 assert.throws(()=>observe(state),/invalid-state/,label);const action=applyAction(state,{actionType:'stop-stir'});assert.equal(action.ok,false);assert.equal(action.state,state,'Rejected action keeps original invalid payload');rejectedStates++;
 const session=sessionFor(state),snapshot=structuredClone(session),text=JSON.stringify(session);assert.throws(()=>parse(text,state.activity),undefined,'Import rejects '+label);assert.deepEqual(session,snapshot,'Import does not repair original data: '+label);rejectedImports++;
}
function action(state,actionType,payloadSI={}){const result=applyAction(state,{actionType,payloadSI});assert.equal(result.ok,true,actionType);valid(result.state);return result.state;}

for(const activity of ['ice','solid']){
 let state=createState(activity,{calorimeterHeatCapacityJPerK:30,solidAirCoolingWPerK:1});valid(state);
 state=action(state,'place-vessel',{placed:true});state=action(state,'pour',{massKg:.2,target:'vessel'});
 if(activity==='ice')state=action(state,'add-ice',{massKg:.02,target:'vessel'});
 else{state=action(state,'move-solid',{target:'tongs'});state=action(state,'move-solid',{target:'bath'});state=step(state,30);valid(state);state=action(state,'move-solid',{target:'tongs'});state=action(state,'move-solid',{target:'water'});}
 state=action(state,'stir',{intensity:1});for(let i=0;i<20;i++){state=step(state,.37);valid(state);}
 assert.ok(Math.abs(totalEnergyJ(state)+state.energyOutJ-state.energyInJ-state.initialEnergyJ)<1e-4);
 assert.ok(Math.abs(totalMassKg(state)-state.initialMassKg)<1e-7);
 for(const field of fields){
  for(const value of [undefined,null,'0','not-a-number',NaN,Infinity,-Infinity]){const bad=structuredClone(state);if(value===undefined)delete bad[field];else bad[field]=value;reject(bad,activity+' '+field+' '+String(value));}
  // JSON.parse accepts exponent overflow as Infinity; import must still reject.
  const session=sessionFor(state);session.physicalState[field]='OVERFLOW_FIXTURE';const text=JSON.stringify(session).replace('"OVERFLOW_FIXTURE"','1e309');assert.throws(()=>parse(text,activity),/Nonfinite|physical state/);rejectedImports++;
 }
 for(const [field,value] of [['waterVolumeM3',.0009],['massResidualKg',999],['energyResidualJ',123]]){const bad=structuredClone(state);bad[field]=value;reject(bad,activity+' counterfeit '+field);}
 // A plausible reported zero cannot hide physical ledger drift. Matching the
 // forged residual to the drift must also fail the independent balance gate.
 for(const reported of [0,.01]){const bad=structuredClone(state);bad.spillMassKg+=.01;bad.massResidualKg=reported;reject(bad,activity+' actual mass drift/report '+reported);}
 for(const reported of [0,2]){const bad=structuredClone(state);bad.energyOutJ+=2;bad.energyResidualJ=reported;reject(bad,activity+' actual energy drift/report '+reported);}
 // Spilled-water states also retain their genuine derived diagnostics.
 let spilled=action(createState(activity),'pour',{massKg:.05,target:'table'});spilled=step(spilled,1);valid(spilled);
}
const classic={schema:'thpt.session.v1',id:'calorimetry',rows:[{values:[80,20,42.5],note:'Original two-water readings'}],notes:'Preserve the old experiment'};
const legacyText=JSON.stringify(classic),legacy=parse(legacyText,'ice');assert.equal(legacy.legacy,true);assert.deepEqual(legacy.session.legacySessions,[classic]);assert.equal(JSON.stringify(legacy.session.legacySessions[0]),legacyText,'Classic sessions need no new physical fields and remain unchanged');
console.log(JSON.stringify({status:'PASS',validStates,rejectedStates,rejectedImports,legacyPreserved:true,tolerances:{waterVolumeM3:1e-10,reportedEnergyResidualJ:1e-8,reportedMassResidualKg:1e-12,actualEnergyBalanceJ:1e-4,actualMassBalanceKg:1e-7},scope:'Strict finite derived diagnostics, independent ledger consistency and import rejection; valid existing schemas and classic data retained without repair.'}));
