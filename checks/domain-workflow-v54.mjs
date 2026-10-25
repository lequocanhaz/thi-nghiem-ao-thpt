import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {isDriven,processFor} from '../dist/playback.js';
import {graphFor} from '../dist/graphs.js';
import {sweepStates} from '../dist/analytics.js';
const prior=JSON.stringify(experiments.map(e=>[e.id,e.presets]));
// Two URL identities used to regenerate shared catalog presets from expanded
// bounds, changing safe presets into out-of-domain cyclotron configurations.
await import('../dist/experiments.js?domain-workflow-first');
await import('../dist/experiments.js?domain-workflow-second');
assert.equal(JSON.stringify(experiments.map(e=>[e.id,e.presets])),prior);
let presets=0;
for(const e of experiments)for(const preset of e.presets){
 const s={...initialState(e),...preset.values,t:0},d=evaluate(e.id,s);
 assert.notEqual(d?.domainValid,false,e.id+' named preset must be inside its declared domain');
 if(isDriven(e))processFor(e,s,{});presets++;
}
for(const [id,invalid] of [['cyclotron',{magnetic:5,radius:100}],['elliptic_orbit',{axis:800,eccentricity:.7}]]){
 const e=experiments.find(e=>e.id===id),s={...initialState(e),...invalid},before=JSON.stringify(s),d=evaluate(id,s);
 assert.equal(d.domainValid,false);assert.throws(()=>processFor(e,s,{}));
 const graph=graphFor(e,s,d,{},[]);assert.equal(graph.current.length,0,id+' invalid current point must never be plotted as zero');
 assert.equal(JSON.stringify(s),before,id+' rejecting a process preserves user inputs');
}
const e=experiments.find(e=>e.id==='cyclotron'),s=initialState(e),states=sweepStates(e,s,'magnetic',.1,5,10),allowed=states.filter(s=>evaluate(e.id,s).domainValid!==false);
assert.equal(allowed.length,6);assert.equal(states.length-allowed.length,4);
console.log('PASS domain workflow v54: stable inherited presets on repeated imports, '+presets+' named presets, invalid playback rejection/graph gaps/input preservation, mixed-domain sweep. Browser recording/scene gates tested separately.');
