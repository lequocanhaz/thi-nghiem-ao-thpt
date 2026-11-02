import assert from 'node:assert/strict';
import {evaluate} from '../dist/models.js';
import {experiments} from '../dist/experiments.js';
import {tableValues} from '../dist/measurements.js';

// For x(0)=a and v(0)=0 the underdamped solution can be written
// x=R exp(-beta*t) cos(omegaD*t-phi), R=|a| hypot(1,beta/omegaD).
// This independent amplitude/phase form gives both a bound and contact points.
// Only the declared underdamped catalog domain is certified here.
let assertions=0,states=0,contacts=0;
const check=(condition,label)=>{assert.ok(condition,label);assertions++;};
function near(actual,expected,label,absolute=2e-12,relative=2e-12){
 check(Number.isFinite(actual)&&Number.isFinite(expected),label+' finite');
 check(Math.abs(actual-expected)<=absolute+relative*Math.abs(expected),`${label}: ${actual} vs ${expected}`);
}
function legacy(s){
 const w0=2*Math.PI/s.period,wd=Math.sqrt(w0*w0-s.beta*s.beta),exp=Math.exp(-s.beta*s.t);
 const x=s.a*exp*(Math.cos(wd*s.t)+s.beta/wd*Math.sin(wd*s.t));
 const v=-s.a*exp*w0*w0/wd*Math.sin(wd*s.t);
 return {t:s.t,x,v,acc:-2*s.beta*v-w0*w0*x,energy:.5*(v*v+w0*w0*x*x)/10000};
}
const e=experiments.find(e=>e.id==='damped');
const limits=Object.fromEntries(e.params.map(p=>[p.key,{min:p.min,max:p.max}]));
check(limits.beta.max<2*Math.PI/limits.period.max,'Entire declared domain remains underdamped');
const amplitudes=[limits.a.min,5,limits.a.max];
const periods=[limits.period.min,1,2,3,limits.period.max];
const betas=[limits.beta.min,.25,.75,1.25,limits.beta.max];
for(const a of amplitudes)for(const period of periods)for(const beta of betas){
 const omega=2*Math.PI/period,q=Math.sqrt(omega*omega-beta*beta);
 const ratio=beta/q,phase=Math.atan(ratio),R=a*Math.hypot(1,ratio);
 let previousEnvelope=Infinity,previousEnergy=Infinity;
 for(let i=0;i<=20;i++){
  const t=limits.t.min+(limits.t.max-limits.t.min)*i/20,s={a,period,beta,t};
  const d=evaluate('damped',s),old=legacy(s),bound=R*Math.exp(-beta*t);
  near(d.x,bound*Math.cos(q*t-phase),'independent amplitude/phase displacement');
  near(d.envelope,bound,'positive displacement envelope in cm');
  near(d.decayCoefficient,a*Math.exp(-beta*t),'separate signed decay coefficient in cm');
  check(d.envelope>=0&&Math.abs(d.x)<=d.envelope+2e-12,'Envelope bounds |x|');
  check(d.envelope<=previousEnvelope+2e-12,'Envelope is non-increasing');
  check(d.energy<=previousEnergy+2e-12,'Mechanical energy is non-increasing');
  previousEnvelope=d.envelope;previousEnergy=d.energy;
  for(const key of Object.keys(old)){
   assert.equal(d[key],old[key],`Existing ${key} stays bit-for-bit unchanged`);assertions++;
  }
  assert.deepEqual(tableValues('damped',s,d),[s.t,old.x,old.v,s.beta,old.energy]);assertions++;
  near(d.energy,((d.v/100)**2+omega**2*(d.x/100)**2)/2,'cm to m energy conversion');
  if(beta===0)near(d.envelope,a,'Undamped envelope equals initial displacement');
  if(t===0){near(d.x,a,'Initial displacement');near(d.v,0,'Zero initial velocity');}
  states++;
 }
 // A conservative loose bound would pass inequalities but fail these contact
 // checks: the amplitude/phase envelope is attained when q*t-phi=n*pi.
 for(let n=0;n<3;n++){
  const t=(phase+n*Math.PI)/q;
  if(t>limits.t.max)continue;
  const d=evaluate('damped',{a,period,beta,t});
  near(Math.abs(d.x),d.envelope,'Envelope contact point');contacts++;
 }
 // Independent centered differences validate x'=v and v'=acc without changing
 // solver steps; select a moderate interior point to avoid cancellation.
 const t=.37,h=1e-5,left=evaluate('damped',{a,period,beta,t:t-h});
 const mid=evaluate('damped',{a,period,beta,t}),right=evaluate('damped',{a,period,beta,t:t+h});
 near((right.x-left.x)/(2*h),mid.v,'Numerical displacement derivative',2e-7,2e-8);
 near((right.v-left.v)/(2*h),mid.acc,'Numerical velocity derivative',2e-6,2e-8);
}
const anchor=evaluate('damped',{a:.1,period:4,beta:1.5,t:1});
near(anchor.x,.05220112251515952,'Near-critical literal displacement');
near(anchor.envelope,.07517047340087202,'Near-critical literal rigorous envelope');
near(anchor.decayCoefficient,.022313016014842982,'Near-critical literal former coefficient');
check(Math.abs(anchor.x)>anchor.decayCoefficient,'Regression reproduces why the former field was not a bound');
console.log(JSON.stringify({status:'PASS',states,contacts,assertions,domain:limits,resolved:'damped.envelope is a rigorous underdamped amplitude bound; decayCoefficient retains the former coefficient; kinematics, energy and table rows unchanged',limits:'Analytic CPU/domain checks only; not critical/overdamped support, browser rendering or hardware certification.'}));
