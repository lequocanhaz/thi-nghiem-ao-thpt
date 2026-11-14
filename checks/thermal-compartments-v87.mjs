// Independent model-domain regressions: valid ledgers alone do not prove that
// material can be created in a source beaker or in an inactive activity.
import assert from 'node:assert/strict';
import {createState,validateState,applyAction,step,observe,totalEnergyJ,totalMassKg} from '../dist/l3/thermal-physics.js';
import {newSession,newTrial,parseSession,serializeSession} from '../dist/l3/data-notebook.js';
let validStates=0,rejectedStates=0,rejectedImports=0;
const clone=s=>structuredClone(s),near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} differs from ${b}`);
function sessionFor(state){const s=newSession(state.activity);newTrial(s,state.activity,{});s.physicalState=clone(state);if(state.probe.placement==='water')s.apparatusState.positions.probe={x:410,y:340};return s;}
function parse(text,activity){return parseSession(text,{activity,validateState:s=>validateState(s).valid});}
function accept(state,label){const before=clone(state);assert.equal(validateState(state).valid,true,label);assert.deepEqual(state,before);near(totalMassKg(state),state.initialMassKg,1e-7);near(totalEnergyJ(state)+state.energyOutJ-state.energyInJ,state.initialEnergyJ,1e-4);const session=sessionFor(state);assert.deepEqual(parse(serializeSession(session),state.activity).session,session);validStates++;return state;}
function act(state,actionType,payloadSI={}){const result=applyAction(state,{actionType,payloadSI});assert.equal(result.ok,true,actionType);return accept(result.state,actionType);}
function reject(state,label){const before=clone(state);near(totalMassKg(state),state.initialMassKg,1e-10);near(totalEnergyJ(state)+state.energyOutJ-state.energyInJ,state.initialEnergyJ,1e-7);assert.equal(validateState(state).valid,false,label);assert.deepEqual(state,before,'No repair of '+label);assert.throws(()=>observe(state),/invalid-state/);assert.throws(()=>step(state,.1),/invalid-state/);const result=applyAction(state,{actionType:'stop-stir'});assert.equal(result.ok,false);assert.equal(result.state,state);rejectedStates++;assert.throws(()=>parse(JSON.stringify(sessionFor(state)),state.activity));assert.deepEqual(state,before);rejectedImports++;}
// Deliberately counterfeit bookkeeping closes both old balance gates, exposing
// the new compartment gate rather than merely tripping a total-mass mismatch.
function closeEnergyLedger(state){const difference=totalEnergyJ(state)+state.energyOutJ-state.energyInJ-state.initialEnergyJ;if(difference>0)state.energyInJ+=difference;else state.energyOutJ-=difference;state.massResidualKg=totalMassKg(state)-state.initialMassKg;state.energyResidualJ=totalEnergyJ(state)+state.energyOutJ-state.energyInJ-state.initialEnergyJ;return state;}
for(const activity of ['ice','solid'])for(const temperature of [0,20,40,95]){
 let s=accept(createState(activity,{waterTempC:temperature,calorimeterHeatCapacityJPerK:30,solidAirCoolingWPerK:1}),'initial');
 s=act(s,'place-vessel',{placed:true});s=act(s,'load-scale',{item:'cup'});s=act(s,'tare');s=act(s,'pour',{massKg:.05,target:'table'});s=act(s,'pour',{massKg:.1,target:'vessel'});s=act(s,'pour',{massKg:.05,target:'vessel'});
 if(activity==='ice')s=act(s,'add-ice',{massKg:.02,target:'vessel'});
 else{s=act(s,'load-scale',{item:'solid'});s=act(s,'move-solid',{target:'tongs'});s=act(s,'move-solid',{target:'bath'});s=accept(step(s,60),'finite heating');s=act(s,'move-solid',{target:'tongs'});s=act(s,'move-solid',{target:'water'});}
 s=act(s,'place-probe',{placement:'water'});s=act(s,'calibrate-probe',{offsetK:.2});s=act(s,'stir',{intensity:1});for(let i=0;i<8;i++)s=accept(step(s,.37),'heat exchange');
 // Empty source temperatures carry no energy or information about source water.
 const empty=clone(s);empty.cupWaterMassKg=0;empty.cupTempC=95;empty.massResidualKg=totalMassKg(empty)-empty.initialMassKg;empty.energyResidualJ=totalEnergyJ(empty)+empty.energyOutJ-empty.energyInJ-empty.initialEnergyJ;accept(empty,'empty cup may retain a stale display coordinate');
}
// Cup may never contain more than the original source: there is no refill action.
const impossibleCup=createState('ice',{waterMassKg:2,waterTempC:40,iceMassKg:1});impossibleCup.cupWaterMassKg=3;impossibleCup.iceTrayMassKg=0;reject(closeEnergyLedger(impossibleCup),'3 kg cup from a 2 kg source, despite total mass/energy balance');
for(const split of [[0,.03],[.015,.015],[.03,0]]){const s=createState('ice');s.cupWaterMassKg-=.01;s.iceMassKg=split[0];s.iceTrayMassKg=split[1];s.vesselPlaced=true;reject(closeEnergyLedger(s),'ice stock increased beyond initial '+split.join('/'));}
for(const compartment of ['iceMassKg','iceTrayMassKg']){const s=createState('solid');s.cupWaterMassKg-=.01;s[compartment]=.01;reject(closeEnergyLedger(s),'inactive solid lab contains '+compartment);}
for(const activity of ['ice','solid']){
 let s=applyAction(createState(activity),{actionType:'place-vessel',payloadSI:{placed:true}}).state;s=applyAction(s,{actionType:'pour',payloadSI:{massKg:.1,target:'vessel'}}).state;
 // The source has no thermal contact action. Counterfeit source cooling plus
 // warming of the receiving water preserves the ledger but is unreachable.
 s.cupTempC-=10;s.nearWaterTempC+=10;s.farWaterTempC+=10;s.waterTempC+=10;reject(closeEnergyLedger(s),'nonempty source temperature changed in '+activity);
}
const classic={schema:'thpt.session.v1',id:'calorimetry',rows:[{values:[80,20,42.5],note:'Unmodified classic two-water measurement'}],notes:'Do not convert this to ice data'};const text=JSON.stringify(classic);for(const activity of ['ice','solid']){const parsed=parse(text,activity);assert.equal(parsed.legacy,true);assert.equal(JSON.stringify(parsed.session.legacySessions[0]),text);}
console.log(JSON.stringify({status:'PASS',validStates,rejectedStates,rejectedImports,classicPreserved:true,scope:'Real action/step states and import round-trips; adversarial compartment/source-temperature states retain total mass and energy yet must be rejected without repair. No browser or teacher acceptance.'}));
