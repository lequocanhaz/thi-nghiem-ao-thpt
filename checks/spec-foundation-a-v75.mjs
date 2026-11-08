import assert from 'node:assert/strict';
import fs from 'node:fs';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
// References from Newton balances, SI conversion, harmonic superposition and
// electrostatic definitions; never call production helpers in an oracle.
const gravity=9.81, elementary=1.602176634e-19, coulomb=8.9875517923e9, vacuum=8.8541878128e-12;
const angle=d=>d*Math.PI/180;
const ref={
 vector_sum:s=>{const y=s.second*Math.sin(angle(s.angle)),x=s.force+s.second*Math.cos(angle(s.angle));return {fx:x,fy:y,result:Math.sqrt(x*x+y*y)};},
 vector_components:s=>({fx:s.force*Math.cos(angle(s.angle)),fy:s.force*Math.sin(angle(s.angle)),result:s.force}),
 relative_motion:s=>({x:s.speed*s.t,frameX:s.frame*s.t,relative:s.speed-s.frame}),
 average_speed:s=>{const t1=s.distance/s.v1,t2=s.distance/s.v2;return {t1,t2,average:(2*s.distance)/(t1+t2)};},
 braking:s=>{const stopTime=s.speed/s.deceleration,elapsed=Math.min(s.t,stopTime);return {stopTime,stopDistance:s.speed*stopTime/2,v:s.speed-s.deceleration*elapsed,x:s.speed*elapsed-s.deceleration*elapsed*elapsed/2};},
 atwood:s=>{const acc=gravity*(s.m2-s.m1)/(s.m1+s.m2);return {acc,tension:s.m1*(gravity+acc),difference:gravity*s.m2-gravity*s.m1};},
 pulley:s=>{const rope=s.branches*s.lift,work=s.mass*gravity*s.lift;return {rope,work,pull:work/rope};},
 elevator:s=>({normal:s.mass*gravity+s.mass*s.acc,weight:s.mass*gravity,ratio:(gravity+s.acc)/gravity}),
 torque_angle:s=>{const arm=s.length*Math.sin(angle(s.angle));return {arm,torque:s.force*arm,perpendicular:s.force*arm/s.length};},
 spring_energy:s=>{const force=s.stiffness*s.extension;return {force,average:force/2,energy:force*s.extension/2};},
 hydraulic_press:s=>{const pressurePa=s.force/(s.small*1e-4);return {pressure:pressurePa/1000,output:pressurePa*s.large*1e-4,ratio:s.large/s.small};},
 communicating:s=>{const pressurePa=s.density1*gravity*s.height,height2=pressurePa/(s.density2*gravity);return {pressure:pressurePa/1000,height2,ratio:height2/s.height};},
 spring_period:s=>{const period=2*Math.PI*Math.sqrt(s.mass/s.stiffness);return {period,frequency:1/period,omega:2*Math.PI/period};},
 oscillator_energy:s=>{const phase=s.t*Math.sqrt(s.stiffness/s.mass),x=s.amplitude*Math.cos(phase),v=-s.amplitude*Math.sqrt(s.stiffness/s.mass)*Math.sin(phase);return {x,kinetic:s.mass*v*v/2,potential:s.stiffness*x*x/2,total:s.stiffness*s.amplitude*s.amplitude/2};},
 phase_difference:s=>{const phase=2*Math.PI*s.frequency*s.t,delta=angle(s.phase);return {x1:s.amplitude*Math.cos(phase),x2:s.amplitude*Math.cos(phase+delta),sum:2*s.amplitude*Math.cos(delta/2)*Math.cos(phase+delta/2)};},
 string_speed:s=>{const densitySI=s.linear/1000,v=Math.sqrt(s.tension/densitySI);return {speed:v,wavelength:v/10,ratio:1/densitySI};},
 string_resonance:s=>{const wavelength=2*s.length/s.mode,v=Math.sqrt(s.tension/.005);return {wavelength,frequency:v/wavelength,fundamental:v/(2*s.length)};},
 sound_level:s=>{const intensitySI=10**s.exponent,ratio=intensitySI/1e-12;return {ratio,intensity:intensitySI/1e-6,level:10*Math.log10(ratio)};},
 intensity_distance:s=>{const area=4*Math.PI*s.distance*s.distance,intensitySI=s.power/area;return {area,intensity:intensitySI/1e-6,level:10*Math.log10(intensitySI/1e-12)};},
 standing_phase:s=>{const spatial=Math.PI*s.probe+angle(s.phase)/2,temporal=2*Math.PI*s.t+angle(s.phase)/2;return {signal:2*Math.cos(spatial)*Math.cos(temporal),envelope:2*Math.abs(Math.cos(spatial)),x:s.probe};},
 reflection_wave:s=>{const temporal=2*Math.PI*s.frequency*s.t,spatial=Math.PI*s.probe;return {incident:Math.cos(temporal-spatial),reflected:-Math.cos(temporal+spatial),signal:2*Math.sin(temporal)*Math.sin(spatial)};},
 uniform_field:s=>{const chargeSI=s.charge*1e-6,massSI=s.mass*1e-6,forceSI=chargeSI*s.field;return {force:forceSI/1e-3,acc:forceSI/massSI,work:forceSI*.1/1e-6};},
 potential_point:s=>{const volts=coulomb*s.charge*1e-9/s.distance;return {potential:volts,field:volts/s.distance,work:volts*1e-9/1e-9};},
 potential_pair:s=>{const plus=s.distance-s.half,minus=s.distance+s.half,near=plus===0?null:coulomb*s.charge*1e-9/Math.abs(plus),far=minus===0?null:-coulomb*s.charge*1e-9/Math.abs(minus);return {near,far,potential:near===null||far===null?null:near+far};},
 capacitor_plate:s=>{const metres=s.gap/1000,areaSI=s.area/10000,farads=vacuum*areaSI/metres;return {capacity:farads/1e-12,charge:farads*s.voltage/1e-9,field:(s.voltage/metres)/1000};},
 dielectric:s=>{const farads=s.base*1e-12*s.dielectric;return {capacity:farads/1e-12,charge:farads*s.voltage/1e-9,energy:(farads*s.voltage*s.voltage/2)/1e-9};},
 capacitor_series:s=>{const capacity=1/(1/s.c1+1/s.c2),charge=capacity*s.voltage;return {capacity,u1:charge/s.c1,u2:charge/s.c2};},
 capacitor_parallel:s=>({capacity:s.c1+s.c2,q1:s.c1*s.voltage,q2:s.c2*s.voltage}),
 charge_quantization:s=>({charge:-elementary*s.electrons/1e-15,count:s.electrons,unit:elementary/1e-15}),
 drift:s=>{const areaSI=s.area*1e-6,particleFlux=s.current/elementary;return {drift:particleFlux/(8.5e28*areaSI)*1000,density:s.current/s.area,charge:s.current*1};},
 wire_stretch:s=>{const areaRatio=1/s.factor,resistanceRatio=s.factor/areaRatio;return {resistance:s.base*resistanceRatio,area:areaRatio,ratio:resistanceRatio};},
};
// Literal anchors are hand-calculated independent check points, not generated
// by ref(). Nontrivial cancellation, equal-mass, SI and boundary cases included.
const anchors={
 vector_sum:[{force:3,second:4,angle:90},{result:5,fx:3,fy:4}],
 vector_components:[{force:10,angle:90},{fx:0,fy:10,result:10}],
 relative_motion:[{speed:-3,frame:2,t:4},{relative:-5,x:-12,frameX:8}],
 average_speed:[{v1:5,v2:10,distance:30},{average:20/3,t1:6,t2:3}],
 braking:[{speed:10,deceleration:5,t:3},{stopDistance:10,stopTime:2,v:0,x:10}],
 atwood:[{m1:1,m2:1},{acc:0,tension:9.81,difference:0}],
 pulley:[{mass:2,branches:4,lift:.5},{pull:4.905,rope:2,work:9.81}],
 elevator:[{mass:2,acc:-9.81},{normal:0,weight:19.62,ratio:0}],
 torque_angle:[{force:10,length:2,angle:30},{torque:10,arm:1,perpendicular:5}],
 spring_energy:[{stiffness:100,extension:.2},{energy:2,force:20,average:10}],
 hydraulic_press:[{force:10,small:2,large:30},{output:150,pressure:50,ratio:15}],
 communicating:[{density1:800,density2:1000,height:.5},{height2:.4,pressure:3.924,ratio:.8}],
 spring_period:[{mass:1,stiffness:4},{period:Math.PI,frequency:1/Math.PI,omega:2}],
 oscillator_energy:[{mass:1,stiffness:4,amplitude:.1,t:0},{x:.1,kinetic:0,potential:.02,total:.02}],
 phase_difference:[{phase:180,amplitude:1,frequency:1,t:0},{x1:1,x2:-1,sum:0}],
 string_speed:[{tension:20,linear:5},{speed:Math.sqrt(4000),wavelength:Math.sqrt(40),ratio:200}],
 string_resonance:[{length:1,tension:20,mode:2},{frequency:Math.sqrt(4000),fundamental:Math.sqrt(1000),wavelength:1}],
 sound_level:[{exponent:-6},{level:60,intensity:1,ratio:1000000}],
 intensity_distance:[{distance:1,power:.01},{intensity:795.7747154594767,level:89.00790135977904,area:12.566370614359172}],
 standing_phase:[{probe:0,phase:0,t:0},{signal:2,envelope:2,x:0}],
 reflection_wave:[{probe:0,frequency:1,t:.25},{incident:0,reflected:0,signal:0}],
 uniform_field:[{field:300,charge:-2,mass:5},{force:-.6,acc:-120,work:-60}],
 potential_point:[{charge:1,distance:1},{potential:8.9875517923,field:8.9875517923,work:8.9875517923}],
 potential_pair:[{charge:1,half:.5,distance:.5},{near:null,far:-8.9875517923,potential:null}],
 capacitor_plate:[{area:100,gap:1,voltage:10},{capacity:88.541878128,charge:.88541878128,field:10}],
 dielectric:[{dielectric:3,base:100,voltage:10},{capacity:300,charge:3,energy:15}],
 capacitor_series:[{c1:20,c2:30,voltage:12},{capacity:12,u1:7.2,u2:4.8}],
 capacitor_parallel:[{c1:20,c2:30,voltage:12},{capacity:50,q1:240,q2:360}],
 charge_quantization:[{electrons:1000},{charge:-.1602176634,count:1000,unit:.0001602176634}],
 drift:[{current:1,area:1},{drift:.0734295185222525,density:1,charge:1}],
 wire_stretch:[{factor:2,base:5},{resistance:20,area:.5,ratio:4}],
};
const scope=experiments.slice(60).filter(e=>e.extra!==true).slice(0,31);
assert.equal(scope.length,31);assert.deepEqual(new Set(scope.map(e=>e.id)),new Set(Object.keys(ref)));
const profiles=JSON.parse(fs.readFileSync(new URL('../sources/specification-v72/profiles.json',import.meta.url))).profiles;
let comparisons=0;const records=[];
function close(actual,wanted,label){
 comparisons++;
 if(wanted===null){assert.equal(actual,null,label);return;}
 assert.ok(Number.isFinite(actual)&&Number.isFinite(wanted),label+' finite');
 // Analytic references only; near-zero uses an absolute floor. This is not a
 // tolerance recommendation for future stochastic/numerical solvers.
 assert.ok(Math.abs(actual-wanted)<=1e-10+2e-11*Math.abs(wanted),`${label}: ${actual} != ${wanted}`);
}
for(const e of scope){
 assert.ok(profiles.find(p=>p.id===e.id),e.id+' original specification');
 const base=initialState(e),cases=[base,Object.fromEntries(e.params.map(p=>[p.key,p.min])),Object.fromEntries(e.params.map(p=>[p.key,p.max]))];
 for(const p of e.params)for(const v of [p.min,p.max])cases.push({...base,[p.key]:v});
 const [anchor,wanted]=anchors[e.id];cases.push({...base,...anchor});
 const before=comparisons;
 if(e.id==='vector_sum')cases.push({...base,force:10,second:10,angle:180});
 if(e.id==='oscillator_energy')for(const t of [0,Math.PI/4,Math.PI/2,3*Math.PI/4,Math.PI])cases.push({...base,mass:1,stiffness:4,amplitude:.1,t});
 if(e.id==='reflection_wave')for(const t of [0,.125,.25,.5,1,10])cases.push({...base,probe:0,t});
 if(e.id==='standing_phase')for(const t of [0,.1,.25,.75,1])cases.push({...base,probe:.5,phase:0,t});
 if(e.id==='potential_pair')for(const distance of [.5-1e-9,.5+1e-9])cases.push({...base,half:.5,distance});
 if(e.id==='capacitor_series')cases.push({...base,c1:20,c2:20,voltage:12});

 for(const [key,value]of Object.entries(wanted)){
  close(ref[e.id]({...base,...anchor})[key],value,`${e.id}/reference/literal/${key}`);
  close(evaluate(e.id,{...base,...anchor})[key],value,`${e.id}/production/literal/${key}`);
 }
 for(const [i,s]of cases.entries()){
  const expected=ref[e.id](s),input=JSON.stringify(s),actual=evaluate(e.id,s);
  assert.equal(JSON.stringify(s),input,e.id+' no input mutation');
  for(const [key,wanted]of Object.entries(expected))close(actual[key],wanted,`${e.id}/${i}/${key}`);
  if(e.id==='oscillator_energy')close(actual.kinetic+actual.potential,actual.total,e.id+'/energy conservation');
  if(e.id==='atwood'){close(actual.tension-s.m1*gravity,s.m1*actual.acc,e.id+'/left Newton balance');close(s.m2*gravity-actual.tension,s.m2*actual.acc,e.id+'/right Newton balance');}
  if(e.id==='pulley')close(actual.pull*actual.rope,s.mass*gravity*s.lift,e.id+'/input-output work balance');
  if(e.id==='communicating')close(s.density1*gravity*s.height,s.density2*gravity*actual.height2,e.id+'/equal bottom pressure');
  if(e.id==='capacitor_series'){close(actual.u1+actual.u2,s.voltage,e.id+'/voltage sum');close(s.c1*actual.u1,s.c2*actual.u2,e.id+'/equal series charge');}
  if(e.id==='potential_point')close(actual.field*s.distance,actual.potential,e.id+'/potential-field radial relationship');
  const row=tableValues(e.id,s,actual);assert.equal(row.length,e.headers.length);
  const independent={...s,t:s.t||0,...expected};
  e.columns.forEach((column,index)=>close(row[index],independent[column.key]===null?null:independent[column.key]*column.scale,`${e.id}/${i}/table/${column.key}`));
 }
 records.push({id:e.id,status:'PASS',cases:cases.length,comparisons:comparisons-before,literalAnchor:{input:anchor,expected:wanted},scope:'analytic reference outputs and raw table columns; no scene/device/teacher acceptance'});
}
const report={scope:'first31 of exact61 foundation IDs',ids:records.length,comparisons,records,limits:['Analytic numeric and raw-table checks only.','No physical-device, scene-geometry, curriculum or teacher signoff.']};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('../docs/spec-v75/physics-a.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`PASS v75 foundation A: ${scope.length} IDs, ${records.reduce((n,r)=>n+r.cases,0)} cases, ${comparisons} comparisons (independent literals, SI conversions, analytic relations, full raw tables).`);
