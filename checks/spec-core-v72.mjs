import assert from 'node:assert/strict';
import {experiments} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {wave} from '../dist/physics.js';
import {tableValues} from '../dist/measurements.js';

// Independent reference values and invariants from specification profiles 001–008.
// These analytic models should agree to floating-point precision; this is not a
// universal tolerance for numerical integration or statistical experiments.
const ids=['energy','oscillation','wave','electric','ohm','capacitor','boyle','gas'];
let assertions=0;
function close(actual,expected,label,absolute=1e-11){
 assert.ok(Number.isFinite(actual),`${label}: finite`);
 assert.ok(Math.abs(actual-expected)<=absolute+Math.abs(expected)*1e-11,`${label}: ${actual} != ${expected}`);
 assertions++;
}
const state=id=>Object.fromEntries(experiments.find(e=>e.id===id).params.map(p=>[p.key,p.value]));
for(const id of ids){
 const e=experiments.find(e=>e.id===id);
 assert.ok(e,`${id}: catalog entry`);
 for(const endpoint of ['value','min','max']){
  const s=Object.fromEntries(e.params.map(p=>[p.key,p[endpoint]]));
  // All electric coordinates at the same endpoint coincide; use the default
  // separated geometry to test charge extremes, and test exclusion separately.
  if(id==='electric')for(const p of e.params.filter(p=>/^[xyz]|^p[xyz]/.test(p.key)))s[p.key]=p.value;
  const d=evaluate(id,s);
  assert.ok(d,`${id}/${endpoint}: defined`);
  for(const [key,value] of Object.entries(d))if(typeof value==='number')assert.ok(Number.isFinite(value),`${id}/${endpoint}/${key}`);
  const row=tableValues(id,s,d);
  assert.equal(row.length,e.headers.length,`${id}: column count`);
  assertions++;
 }
}

for(const [m,h0,total] of [[1,10,98.1],[.2,1,1.962],[5,20,981]]){
 const end=Math.sqrt(2*h0/9.81);
 for(const fraction of [0,.25,.5,.75,1]){
  const s={m,h0,t:end*fraction},d=evaluate('energy',s);
  close(d.k+d.u,total,'energy conservation');
  close(d.h,h0*(1-fraction*fraction),'height from elapsed fall fraction');
  const row=tableValues('energy',s,d);close(row[3]+row[4],total,'recorded energy');
 }
 const landed=evaluate('energy',{m,h0,t:end+100});close(landed.h,0,'no underground fall');close(landed.k,total,'energy at impact limit');
}
const oscillationReference=[[0,5,0,-49.34802200544679],[.5,0,-15.707963267948966,0],[1,-5,0,49.34802200544679],[1.5,0,15.707963267948966,0],[2,5,0,-49.34802200544679]];
for(const [t,x,v,acc] of oscillationReference){const d=evaluate('oscillation',{a:5,period:2,t});close(d.x,x,'quarter-cycle x');close(d.v,v,'quarter-cycle v');close(d.acc,acc,'quarter-cycle acceleration');}
for(const period of [.5,2,4])for(const t of [0,.17,period/4,period/2]){
 const d=evaluate('oscillation',{a:3,period,t});close(d.acc,-d.w*d.w*d.x,'restoring acceleration');
 close(d.x*d.x+(d.v/d.w)**2,9,'phase-space invariant');
}
for(const [f,lambda] of [[.5,4],[1,2],[2,1]]){
 const d=evaluate('wave',{a:.5,f,speed:2,t:.13});close(d.wavelength,lambda,'independent wavelength');
 close(d.period,1/f,'wave period');
 for(const x of [0,.7,2]){close(wave(.5,f,2,x,.13).y,wave(.5,f,2,x+lambda,.13).y,'nearest full-phase interval');close(wave(.5,f,2,x,.13).y,-wave(.5,f,2,x+lambda/2,.13).y,'half-wave antiphase');}
}
const electric={...state('electric'),q1:1,q2:0,q0:1,x1:0,y1:0,z1:0,px:.2,py:0,pz:0};
const field=evaluate('electric',electric,{mode:3});close(field.x,224.6887948075,'single source E');
const positive=evaluate('electric',electric,{mode:2}),negative=evaluate('electric',{...electric,q0:-1},{mode:2});
close(positive.x,2.246887948075e-7,'nC force',1e-20);close(negative.x,-positive.x,'negative test charge reverses F',1e-20);
close(evaluate('electric',{...electric,q0:-1},{mode:3}).x,field.x,'test charge does not contribute to E');
close(evaluate('electric',{...electric,px:.4},{mode:3}).x,field.x/4,'inverse square');
assert.equal(evaluate('electric',{...electric,px:.011},{mode:3}),null,'excluded near-source domain');assertions++;
const symmetric={...electric,q1:1,q2:1,x1:-.2,x2:.2,y2:0,z2:0,px:0};
close(evaluate('electric',symmetric,{mode:3}).magnitude,0,'symmetric same-charge cancellation');
for(const [u,i] of [[0,0],[2,.2],[4,.4],[6,.6],[8,.8]]){
 const s={u,r:10},d=evaluate('ohm',s);close(d.i,i,'Ohm reference');
 if(u===0)assert.equal(tableValues('ohm',s,d)[3],null,'0/0 undefined in recorded data');
}
close((evaluate('ohm',{u:8,r:10}).i-evaluate('ohm',{u:2,r:10}).i)/6,.1,'I–U slope A/V');
for(const capMode of ['charge','discharge'])for(const [t,decay] of [[0,1],[2,.36787944117144233],[6,.049787068367863944]]){
 const s={u:6,r:2,c:1000,t},d=evaluate('capacitor',s,{capMode});
 close(d.tau,2,'kOhm/uF to seconds');close(d.uc,6*(capMode==='charge'?1-decay:decay),'RC reference');
 close(d.i,(capMode==='charge'?1:-1)*.003*decay,'conventional current A');close(d.energy,.0005*d.uc*d.uc,'capacitor stored energy');
 const row=tableValues('capacitor',s,d,{capMode});close(row[6],d.i*1000,'recorded mA');close(row[7],d.energy*1000,'recorded mJ');
}
for(const [v,p] of [[2,300],[4,150],[6,100],[8,75],[10,60]]){const d=evaluate('boyle',{v});close(d.p,p,'Boyle absolute pressure kPa');close(d.p*d.v,600,'isothermal invariant kPa L');close(d.t,300,'constant absolute temperature');}
for(const [tK,p] of [[300,249.43387854],[600,498.86775708]]){const d=evaluate('gas',{n:1,tK,v:10});close(d.p,p,'ideal gas independent pressure kPa');close(d.p/d.t,.8314462618,'constant n,V: p/T');}
const base=evaluate('gas',{n:1,tK:300,v:10});close(evaluate('gas',{n:2,tK:300,v:10}).p,2*base.p,'pressure scales with amount');close(evaluate('gas',{n:1,tK:300,v:20}).p,base.p/2,'pressure scales inversely with volume');
console.log(`PASS specification profiles001–008: ${assertions} reference/invariant/column checks; no model equations changed. Numeric acceptance only, not scene, hardware or teacher signoff.`);
