import assert from 'node:assert/strict';
import fs from 'node:fs';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
// Independent textbook references: force/torque balance, KCL, energy and Faraday.
// Constants and equations below are not imported from the implementation.
const g=9.81,mu0=4*Math.PI*1e-7,kC=8.9875517923e9,deg=x=>180*x/Math.PI,rad=x=>x*Math.PI/180;
function divider(U,Rtop,Rbottom,Rload){const conductance=1/Rbottom+1/Rload;return (U/Rtop)/(1/Rtop+conductance);}
const refs={
 potentiometer:s=>({output:s.voltage*s.fraction,upper:s.resistance-s.resistance*s.fraction,lower:s.resistance*s.fraction}),
 voltage_divider:s=>{const output=divider(s.voltage,s.r1,s.r2,s.load);return {output,unloaded:s.voltage/(1+s.r1/s.r2),current:output/s.load*1000};},
 meter_loading:s=>{const measured=divider(s.voltage,s.r1,s.r2,s.meter),trueValue=s.voltage/(1+s.r1/s.r2);return {measured,trueValue,error:trueValue?100*(trueValue-measured)/trueValue:0};},
 battery_series:s=>{const emfTotal=s.cells*s.emf,internalTotal=s.cells*s.internal;return {emfTotal,internalTotal,current:emfTotal/(internalTotal+s.resistance)};},
 battery_parallel:s=>{const internalTotal=1/(s.cells/s.internal);return {emfTotal:s.emf,internalTotal,current:s.emf/(s.resistance+internalTotal)};},
 wire_field:s=>{const tesla=mu0*s.current/(2*Math.PI*s.distance);return {field:tesla*1e6,magnitude:Math.abs(tesla)*1e6,circulation:tesla*2*Math.PI*s.distance*1e6};},
 flux_angle:s=>({flux:s.field*(s.area/1e4)*Math.cos(rad(s.angle))*1e3,maximum:s.field*(s.area/1e4)*1e3,projection:s.area*Math.cos(rad(s.angle))}),
 binding_energy:s=>{const energy=s.defect*931.494102;return {energy,perNucleon:energy/s.nucleons,joule:energy*1e6*1.602176634e-19*1e12};},
 table_hanging:s=>{const maxF=s.friction*s.mass*g,acc=Math.max(0,(s.hanging*g-maxF)/(s.mass+s.hanging));return {acc,tension:s.hanging*g-s.hanging*acc,frictionForce:acc>0?maxF:s.hanging*g};},
 contact_carts:s=>{const acc=s.force/(s.mass+s.second);return {acc,contact:s.second*acc,net:s.force-s.second*acc};},
 accelerating_pendulum:s=>{const effective=Math.sqrt(g*g+s.acc*s.acc);return {tilt:deg(Math.atan2(s.acc,g)),effective,tension:s.mass*effective};},
 double_incline:s=>{const fL=s.mass*g*Math.sin(rad(s.left)),fR=s.second*g*Math.sin(rad(s.right)),acc=(fR-fL)/(s.mass+s.second);return {acc,drive:fR-fL,tension:fR-s.second*acc};},
 ladder_balance:s=>{const floor=(s.mass+s.person)*g,wall=(s.mass*g*.5+s.person*g*s.position)*Math.cos(rad(s.angle))/Math.sin(rad(s.angle));return {floor,wall,minimumMu:wall/floor};},
 beam_supports:s=>{const total=s.load+s.beamWeight,rightReaction=s.load*s.position+s.beamWeight*.5;return {rightReaction,leftReaction:total-rightReaction,sum:total};},
 three_strings:s=>{const a=rad(s.left),b=rad(s.right),load=s.mass*g;const tension1=load/(Math.sin(a)+Math.cos(a)*Math.tan(b));return {load,tension1,tension2:tension1*Math.cos(a)/Math.cos(b)};},
 slide_tip:s=>{const tipForce=(s.mass*g*s.width*.5)/s.height,slideForce=s.friction*s.mass*g;return {tipForce,slideForce,first:tipForce<slideForce?1:0};},
 collision_2d:s=>{const a=rad(s.angle),vx=s.speed*Math.cos(a)**2,vy=s.speed*Math.cos(a)*Math.sin(a),v2x=s.speed-vx;return {v1x:vx,v1y:vy,v2x,v2y:-vy,speed1:Math.hypot(vx,vy),speed2:Math.hypot(v2x,vy),energy:s.mass*(vx*vx+v2x*v2x+2*vy*vy)/2};},
 ballistic_pendulum:s=>{const total=s.mass+s.bullet,p=s.bullet*s.speed,common=p/total;return {common,height:p*p/(2*g*total*total),lost:s.bullet*s.speed*s.speed/2-p*p/(2*total)};},
 collision_spring:s=>{const total=s.mass+s.second,p=s.mass*s.speed,common=p/total,after=p*p/(2*total);return {common,compression:Math.sqrt(2*after/s.stiffness),lost:s.mass*s.speed*s.speed/2-after};},
 string_power:s=>{const A=s.amplitude*1e-3,density=s.density*1e-3,speed=Math.sqrt(s.tension/density),w=2*Math.PI*s.frequency;return {speed,power:density*w*w*A*A*speed/2*1e3,wavelength:speed/s.frequency};},
 three_charge_energy:s=>{const pairs=[[s.charge,s.charge],[s.charge,s.third],[s.charge,s.third]].map(([a,b])=>kC*(a*1e-9)*(b*1e-9)/s.side*1e9);return {energy:pairs.reduce((a,b)=>a+b,0),pairEnergy:pairs[0],workThird:pairs[1]+pairs[2]};},
 electric_work_paths:s=>{const potential=r=>kC*1e-9/r,work=(potential(s.start)-potential(s.end))*1e-9*1e9;return {straightWork:work,detourWork:work,pathLength:Math.sqrt(((s.end-s.start)/2)**2+s.detour*s.detour)*2};},
 isolated_dielectric:s=>{const Q=s.charge*1e-9,C=s.capacity*1e-12,voltage=Q/(s.dielectric*C),energy=Q*voltage/2;return {voltage,energy:energy*1e9,released:(Q*Q/(2*C)-energy)*1e9};},
 ammeter_shunt:s=>{const Ig=s.galvanometer*1e-3,burden=Ig*s.resistance,Is=s.range-Ig;return {burden,shunt:burden/Is,shuntPower:burden*Is};},
 voltmeter_design:s=>{const Ig=s.galvanometer*1e-3,input=s.range/Ig;return {input,series:input-s.resistance,power:s.range*Ig*1000};},
 charge_sharing:s=>{const c1=s.c1*1e-6,c2=s.c2*1e-6,Q=c1*s.u1+c2*s.u2,U=Q/(c1+c2),Ei=(c1*s.u1*s.u1+c2*s.u2*s.u2)/2,Ef=(c1+c2)*U*U/2;return {final:U,charge:Q*1e6,lost:(Ei-Ef)*1e6};},
 sliding_rod:s=>{const emf=s.magnetic*s.length*s.speed,current=emf/s.resistance,force=-current*s.length*s.magnetic;return {emf,current,force,power:emf*current,heat:current*current*s.resistance};},
 magnetic_braking:s=>{const lambda=s.magnetic*s.magnetic*.5*.5/(s.mass*s.resistance),speed=3*Math.exp(-lambda*s.t);return {speed,tau:1/lambda,distance:3*(-Math.expm1(-lambda*s.t))/lambda,heat:s.mass*(9-speed*speed)/2};},
 coil_entering_field:s=>{const left=s.t-1,right=left+.8,covered=Math.max(0,Math.min(right,2)-Math.max(left,0)),enter=(right>0&&right<2)?1:0,exit=(left>0&&left<2)?1:0,emf=-Math.round(s.turns)*s.magnetic*(enter-exit);return {emf,current:emf/s.resistance,flux:Math.round(s.turns)*s.magnetic*covered,x:left};},
 layered_wall:s=>{const r1=s.thickness1/s.conductivity1,r2=s.thickness2/s.conductivity2,flux=(30-10)/(r1+r2);return {thermalResistance:r1+r2,flux,interface:10+flux*r2};},
};
const scope=experiments.slice(60).filter(e=>e.extra!==true).slice(31);
assert.equal(scope.length,30);assert.deepEqual(new Set(scope.map(e=>e.id)),new Set(Object.keys(refs)));
const profileIds=new Set(JSON.parse(fs.readFileSync(new URL('../sources/specification-v72/profiles.json',import.meta.url))).profiles.map(p=>p.id));
let assertions=0;const entries=[];let current;
function close(actual,expected,label,atol=2e-10,rtol=2e-10){assert.ok(Number.isFinite(actual)&&Number.isFinite(expected),label+': finite');const err=Math.abs(actual-expected);assert.ok(err<=atol+rtol*Math.abs(expected),`${label}: ${actual} != ${expected}`);assertions++;if(current)current.maxAbsoluteError=Math.max(current.maxAbsoluteError,err);}
for(const e of scope){
 assert.ok(profileIds.has(e.id));current={id:e.id,status:'PASS-reference-cases',cases:0,numericComparisons:0,maxAbsoluteError:0};const begin=assertions;
 const base=initialState(e),states=[base,...e.params.flatMap(p=>['min','max'].map(edge=>({...base,[p.key]:p[edge]})))];
 if(e.id==='coil_entering_field')for(const t of [.1,.2,.5,1,1.5,2,2.2,2.5,3,3.1,4])states.push({...base,t});
 if(e.id==='magnetic_braking')for(const t of [1,2,5,10])states.push({...base,t});
 for(const s of states){
  const before=JSON.stringify(s),d=evaluate(e.id,s),expected=refs[e.id](s),row=tableValues(e.id,s,d);assert.equal(JSON.stringify(s),before,e.id+': no input mutation');assert.equal(row.length,e.headers.length);
  for(const [key,value] of Object.entries(expected))close(d[key],value,e.id+'/'+key);
  e.columns.forEach((c,i)=>{const value=Object.hasOwn(expected,c.key)?expected[c.key]:s[c.key];assert.notEqual(value,undefined,e.id+'/'+c.key+' independent table reference');close(row[i],value*(c.scale??1),e.id+'/table/'+c.key);});
  if(e.id==='collision_2d'){close(d.v1x+d.v2x,s.speed,'collision x momentum/m');close(d.v1y+d.v2y,0,'collision y momentum/m');close(d.v1x*d.v2x+d.v1y*d.v2y,0,'orthogonal equal-mass outgoing velocities');}
  if(e.id==='sliding_rod')close(d.power,d.heat,'mechanical input equals Joule heat');
  if(e.id==='magnetic_braking')close(d.heat+s.mass*d.speed*d.speed/2,4.5*s.mass,'remaining K + heat');
  if(e.id==='charge_sharing')close((s.c1+s.c2)*d.final,d.charge,'charge conservation microcoulomb');
  current.cases++;
 }
 current.numericComparisons=assertions-begin;entries.push(current);
}
// Literal anchors independently solvable without the implementation equations.
current=null;
for(const [id,state,key,value] of [
 ['potentiometer',{fraction:.25,resistance:40,voltage:12},'output',3],
 ['voltage_divider',{r1:100,r2:100,load:100,voltage:12},'output',4],
 ['meter_loading',{meter:100,r1:100,r2:100,voltage:12},'error',100/3],
 ['battery_series',{cells:2,emf:2,internal:1,resistance:2},'current',1],
 ['battery_parallel',{cells:2,emf:2,internal:2,resistance:1},'current',1],
 ['wire_field',{current:1,distance:.1},'field',2],
 ['flux_angle',{angle:0,field:1,area:100},'flux',10],
 ['binding_energy',{defect:1,nucleons:10},'energy',931.494102],
 ['table_hanging',{hanging:1,mass:1,friction:0},'acc',4.905],
 ['contact_carts',{force:12,mass:1,second:2},'contact',8],
 ['accelerating_pendulum',{acc:9.81,mass:1},'tilt',45],
 ['double_incline',{left:30,right:30,mass:1,second:1},'acc',0],
 ['ladder_balance',{angle:45,mass:2,person:0,position:0},'minimumMu',.5],
 ['beam_supports',{position:.5,load:80,beamWeight:40},'leftReaction',60],
 ['three_strings',{left:30,right:30,mass:1},'tension1',9.81],
 ['slide_tip',{height:1,width:1,friction:.5,mass:1},'tipForce',4.905],
 ['collision_2d',{angle:0,speed:6,mass:1},'speed2',0],
 ['ballistic_pendulum',{bullet:1,mass:1,speed:2},'lost',1],
 ['collision_spring',{speed:2,mass:1,second:1,stiffness:50},'compression',.2],
 ['string_power',{amplitude:1,frequency:1,density:1,tension:1},'speed',Math.sqrt(1000)],
 ['three_charge_energy',{third:-1,charge:2,side:.4},'energy',0],
 ['electric_work_paths',{start:1,end:1,detour:1},'straightWork',0],
 ['isolated_dielectric',{dielectric:2,capacity:100,charge:1},'voltage',5],
 ['ammeter_shunt',{range:.002,galvanometer:1,resistance:100},'shunt',100],
 ['voltmeter_design',{range:10,galvanometer:1,resistance:100},'series',9900],
 ['charge_sharing',{c1:100,c2:100,u1:6,u2:6},'lost',0],
 ['sliding_rod',{speed:-2,magnetic:.5,length:.5,resistance:5},'force',.025],
 ['magnetic_braking',{magnetic:1,mass:.3,resistance:3,t:0},'speed',3],
 ['coil_entering_field',{magnetic:.5,turns:10,resistance:10,t:.5},'emf',-5],
 ['layered_wall',{thickness1:.1,conductivity1:1,thickness2:.1,conductivity2:1},'interface',20],
])close(evaluate(id,state)[key],value,id+'/literal anchor');
// A pass here establishes reproducibility of a known domain defect, not approval
// of a passive voltmeter with a negative added resistor.
const invalid={range:.1,galvanometer:10,resistance:1000},bad=evaluate('voltmeter_design',invalid);
for(const [key,value] of Object.entries(invalid)){const p=experiments.find(e=>e.id==='voltmeter_design').params.find(p=>p.key===key);assert.ok(value>=p.min&&value<=p.max);}
assert.equal(bad.series,-990);assert.notEqual(bad.domainValid,false);
const knownIssues=[{id:'voltmeter_design',status:'FAIL-domain-constraint-pending',state:invalid,actual:bad.series,unit:'Ω',minimumRealizableRange:10,expected:'Require Umax >= Ig Rg and indicate invalid state instead of presenting negative passive series resistance.',reason:'Expanded independent controls permit Umax<IgRg; current output has no invalid-domain flag despite catalog claiming positive added resistor.'}];
entries.find(e=>e.id==='voltmeter_design').status='PARTIAL-reference-cases-pass-domain-constraint-fails';
const report={scope:'last30 of exactly61 extra!==true experiments after original60',experiments:30,numericComparisons:assertions,entries,knownIssues,limits:['Analytic reference and table numeric checks only; not all scenes, physical hardware, curriculum or teacher signoff.','Literal anchors may intentionally bypass UI ranges to isolate conservation/units; domain probes use declared current ranges.','Negative passive voltmeter resistor is recorded as a genuine failure, not certified as valid.']};
if(process.argv.includes('--write'))fs.writeFileSync(new URL('../docs/spec-v75/physics-b.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(`PASS reference arithmetic for30 IDs/${assertions} numeric comparisons; OPEN domain defect voltmeter_design (-990 Ω permitted state).`);
