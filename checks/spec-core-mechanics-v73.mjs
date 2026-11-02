import assert from 'node:assert/strict';
import {experiments} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
// Independent analytic oracles. Constants/units are written here, not imported
// from the implementation. These tolerances apply to closed-form arithmetic,
// not statistical samples, nonlinear solvers or pedagogical acceptance.
const G=9.81, pi=Math.PI;
const ids=['uniform','acceleration','horizontal','projectile','newton','incline','collision','circular','lever','hooke','pendulum','damped','resonance','interference','standing','sound','series','parallel','joule','magnetic','induction','decay'];
const counts={}; let assertions=0;
function near(a,b,label){assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');assert.ok(Math.abs(a-b)<=2e-9+2e-10*Math.abs(b),`${label}: ${a} vs ${b}`);assertions++;}
function oracle(id,s){let t=s.t||0;const r=d=>d*pi/180;
 switch(id){
 case'uniform':return {t,x:s.v*t,v:s.v};
 case'acceleration':return {t,x:s.v0*t+s.acc*t*t/2,v:s.v0+s.acc*t,acc:s.acc};
 case'horizontal':{const duration=Math.sqrt(2*s.h0/G),q=Math.min(t,duration);return {t:q,x:s.v0*q,y:Math.max(0,s.h0-G*q*q/2),vx:s.v0,vy:-G*q,range:s.v0*duration,duration};}
 case'projectile':{const u=s.v0*Math.cos(r(s.angle)),v=s.v0*Math.sin(r(s.angle)),duration=2*v/G,q=Math.min(t,duration);return {t:q,x:u*q,y:Math.max(0,v*q-G*q*q/2),vx:u,vy:v-G*q,range:u*duration,height:v*v/(2*G),duration};}
 case'newton':{const a=s.force/s.m,end=a===0?10:Math.sqrt(10/Math.abs(a)),q=Math.min(t,end);return {t:q,acc:a,x:a*q*q/2,v:a*q,duration:end};}
 case'incline':{const n=s.m*G*Math.cos(r(s.angle)),drive=s.m*G*Math.sin(r(s.angle)),f=Math.min(drive,s.mu*n),a=(drive-f)/s.m,end=a<=1e-9?10:Math.sqrt(10/a),q=Math.min(t,end);return {t:q,normal:n,friction:f,acc:a,x:Math.min(5,a*q*q/2),v:a*q,weight:s.m*G,duration:end};}
 case'collision':{const p=s.m1*s.v1+s.m2*s.v2,rel=s.v1-s.v2,m=s.m1+s.m2,w1=(p-s.m2*s.e*rel)/m,w2=(p+s.m1*s.e*rel)/m,hit=rel>0&&t>=6/rel,v1=hit?w1:s.v1,v2=hit?w2:s.v2;return {v1,v2,out1:w1,out2:w2,hit:Number(hit),momentum:p,k:(s.m1*v1*v1+s.m2*v2*v2)/2,k0:(s.m1*s.v1*s.v1+s.m2*s.v2*s.v2)/2};}
 case'circular':return {theta:s.v*t/s.radius,x:s.radius*Math.cos(s.v*t/s.radius),z:s.radius*Math.sin(s.v*t/s.radius),acc:s.v*s.v/s.radius,force:s.m*s.v*s.v/s.radius,period:2*pi*s.radius/s.v};
 case'lever':return {torque1:s.m1*G*s.l1,torque2:s.m2*G*s.l2,net:G*(s.m1*s.l1-s.m2*s.l2)};
 case'hooke':return {force:s.m*G,extension:s.m*G/s.k,energy:(s.m*G)**2/(2*s.k)};
 case'pendulum':{const w=Math.sqrt(G/s.length),theta=r(s.angle)*Math.cos(w*t),v=-s.length*r(s.angle)*w*Math.sin(w*t);return {theta,angle:theta*180/pi,v,period:2*pi*Math.sqrt(s.length/G),k:s.m*v*v/2,u:s.m*G*s.length*theta*theta/2};}
 case'damped':{const w=2*pi/s.period,q=Math.sqrt(w*w-s.beta*s.beta),decay=Math.exp(-s.beta*t),x=s.a*decay*(Math.cos(q*t)+s.beta*Math.sin(q*t)/q),v=-s.a*w*w*decay*Math.sin(q*t)/q;return {x,v,acc:-2*s.beta*v-w*w*x,envelope:Math.abs(s.a)*Math.hypot(1,s.beta/q)*decay,decayCoefficient:s.a*decay,energy:(v*v+w*w*x*x)/20000};}
 case'resonance':{const w=2*pi*s.f,w0=2*pi*s.f0,amplitude=s.force/Math.sqrt((w0*w0-w*w)**2+4*s.beta*s.beta*w*w),phase=Math.atan2(2*s.beta*w,w0*w0-w*w);return {amplitude,phase,x:amplitude*Math.cos(w*t-phase),v:-w*amplitude*Math.sin(w*t-phase),acc:-w*w*amplitude*Math.cos(w*t-phase)};}
 case'interference':{const r1=Math.sqrt((s.probeX+s.separation/2)**2+s.probeZ**2),r2=Math.sqrt((s.probeX-s.separation/2)**2+s.probeZ**2),k=2*pi*s.f/s.speed,p=r(s.phase),u1=s.a*Math.cos(2*pi*s.f*t-k*r1),u2=s.a*Math.cos(2*pi*s.f*t-k*r2+p);return {u1,u2,u:u1+u2,amplitude:s.a*Math.sqrt(Math.max(0,2+2*Math.cos(k*(r2-r1)-p))),delta:r2-r1,lambda:s.speed/s.f};}
 case'standing':{const x=Math.min(s.probeX,s.length),f=s.mode*s.speed/(2*s.length);return {x,frequency:f,lambda:2*s.length/s.mode,nodes:s.mode+1,antinodes:s.mode,u:2*s.a*Math.sin(s.mode*pi*x/s.length)*Math.cos(2*pi*f*t)};}
 case'sound':return {f:s.f,amplitude:s.a,lambda:343/s.f,period:1/s.f,u:s.a*Math.sin(2*pi*s.f*t)};
 case'series':{const i=s.u/(s.r1+s.r2);return {i,i1:i,i2:i,resistance:s.r1+s.r2,u1:i*s.r1,u2:i*s.r2,p:s.u*i};}
 case'parallel':return {i1:s.u/s.r1,i2:s.u/s.r2,i:s.u/s.r1+s.u/s.r2,resistance:1/(1/s.r1+1/s.r2),u1:s.u,u2:s.u,p:s.u*s.u*(1/s.r1+1/s.r2)};
 case'joule':return {i:s.u/s.r,power:s.u*s.u/s.r,heat:s.u*s.u*t/s.r,temp:20+s.u*s.u*t/(s.r*s.m*4180)};
 case'magnetic':{const fy=s.b*s.i*s.length*Math.sin(r(s.angle));return {force:Math.abs(fy),fy,b:s.b,i:s.i};}
 case'induction':{const theta=2*pi*s.f*t,emf=s.turns*s.b*s.area*2*pi*s.f*Math.sin(theta);return {theta,flux:s.b*s.area*Math.cos(theta),emf,i:emf/s.r,emax:s.turns*s.b*s.area*2*pi*s.f};}
 case'decay':{const lambda=Math.log(2)/s.half,N=s.n0*2**(-t/s.half);return {N,remaining:N/s.n0,decayed:s.n0-N,activity:lambda*N,lambda};}
 }
}
function expectedRow(id,s,d){switch(id){
 case'uniform':return[d.t,d.x,d.v];case'acceleration':return[d.t,d.x,d.v,d.acc];
 case'horizontal':case'projectile':return[d.t,d.x,d.y,d.vx,d.vy,d.range];
 case'newton':return[d.t,s.force,s.m,d.acc,d.x,d.v];case'incline':return[d.t,s.angle,s.mu,d.acc,d.x,d.v,d.friction];
 case'collision':return[s.t,d.v1,d.v2,d.momentum,d.k,s.e];case'circular':return[s.t,s.radius,s.v,d.acc,d.force,d.period];
 case'lever':return[s.m1,s.m2,s.l1,s.l2,d.torque1,d.torque2,d.net];case'hooke':return[s.m,s.k,d.force,d.extension,d.energy];
 case'pendulum':return[s.t,d.angle,d.period,d.v,d.k,d.u];case'damped':return[s.t,d.x,d.v,s.beta,d.energy];
 case'resonance':return[s.t,s.f,s.f0,d.amplitude,d.x,s.beta];case'interference':return[s.t,s.probeX,s.probeZ,d.delta,d.amplitude,d.u,d.lambda];
 case'standing':return[s.t,d.x,d.u,d.frequency,d.lambda,d.nodes,d.antinodes];case'sound':return[s.t,d.f,d.amplitude,d.u,d.lambda,d.period];
 case'series':return[s.u,s.r1,s.r2,d.resistance,d.i,d.u1,d.u2];case'parallel':return[s.u,s.r1,s.r2,d.resistance,d.i,d.i1,d.i2];
 case'joule':return[s.t,d.i,d.power,d.heat,d.temp];case'magnetic':return[s.b,s.i,s.length,s.angle,d.force,d.fy];
 case'induction':return[s.t,d.flux,d.emf,d.i,s.turns,s.f];case'decay':return[s.t,d.N,d.decayed,d.activity,s.half];
}}
for(const id of ids){
 const e=experiments.find(e=>e.id===id);assert.ok(e,id); counts[id]=0;
 for(const boundary of ['min','value','max']){
  const s=Object.fromEntries(e.params.map(p=>[p.key,p[boundary]]));
  // Three elapsed states per parameter configuration, including the domain edge.
  for(const time of (e.params.some(p=>p.key==='t')?[0,(s.t||1)/2,s.t||1]:[0])){
   if(e.params.some(p=>p.key==='t'))s.t=time;
   const expected=oracle(id,s),actual=evaluate(id,s);
   for(const [key,value] of Object.entries(expected))near(actual[key],value,`${id}/${boundary}/${time}/${key}`);
   const row=tableValues(id,s,actual);assert.equal(row.length,e.headers.length,id+' recorded columns');assertions++;
   expectedRow(id,s,expected).forEach((v,i)=>near(row[i],v,`${id}/${boundary}/table/${i}`));
   counts[id]++;
  }
 }
}
// Mechanistic invariants supplement the analytic oracles at zero/sign changes.
for(const coefficient of [0,.5,1]){
 const s={m1:1,m2:2,v1:3,v2:-1,e:coefficient,t:4},d=evaluate('collision',s);
 near(s.m1*d.v1+s.m2*d.v2,1,'collision momentum');
 near(d.v2-d.v1,coefficient*4,'Newton restitution');
 near(d.k0-d.k,(1-coefficient**2)*(.5*(2/3)*16),'collision dissipated energy');
}
for(const force of [-4,0,4]){const d=evaluate('newton',{force,m:2,t:.2});near(d.acc,force/2,'Newton signed force');}
for(const t of [0,.2,1]){
 const s={a:5,period:2,beta:0,t},d=evaluate('damped',s);near(d.energy,.5*(pi*5/100)**2,'undamped energy in J from cm');
 const p=evaluate('pendulum',{length:1,angle:10,m:.5,t});near(p.k+p.u,.5*.5*G*(10*pi/180)**2,'small-angle energy');
}
for(const half of [.1,4,50]){const d=evaluate('decay',{n0:1000,half,t:half});near(d.N,500,'one half-life');}
for(const current of [-2,0,2]){const d=evaluate('magnetic',{b:.5,i:current,length:.5,angle:90});near(d.fy,.25*current,'magnetic sign');}
// Fixed numerical anchors: these numbers were calculated independently.
near(evaluate('newton',{force:6,m:2,t:1}).acc,3,'anchor Newton acceleration');
near(evaluate('newton',{force:6,m:2,t:1}).x,1.5,'anchor Newton displacement');
const swap=evaluate('collision',{m1:1,m2:1,v1:3,v2:0,e:1,t:3});
near(swap.v1,0,'anchor equal-mass first cart stops');near(swap.v2,3,'anchor equal-mass target takes velocity');
const balance=evaluate('lever',{m1:1,m2:2,l1:1.2,l2:.6});
near(balance.torque1,11.772,'anchor left torque');near(balance.torque2,11.772,'anchor right torque');near(balance.net,0,'anchor lever balances');
near(evaluate('magnetic',{b:.5,i:2,length:.5,angle:90}).fy,.5,'anchor perpendicular magnetic force');
for(const [a,period,beta] of [[5,2,.25],[.1,.5,0],[50,4,1.5]]){
 let previous=Infinity;
 for(let i=0;i<=200;i++){
  const d=evaluate('damped',{a,period,beta,t:i/10});
  assert.ok(d.energy<=previous+1e-10,'damped mechanical energy cannot increase');previous=d.energy;assertions++;
 }
}
// Regression for the v73 finding: the coefficient is retained under its own
// explicit name, while envelope now bounds the zero-initial-velocity solution.
const nearCritical=evaluate('damped',{a:.1,period:4,beta:1.5,t:1});
near(nearCritical.envelope,.07517047340087202,'near-critical rigorous envelope');
near(nearCritical.decayCoefficient,.022313016014842982,'legacy coefficient preserved under explicit name');
assert.ok(Math.abs(nearCritical.x)>nearCritical.decayCoefficient,'Decay coefficient is not a displacement bound');assertions++;
assert.ok(Math.abs(nearCritical.x)<=nearCritical.envelope,'Envelope bounds the displacement');assertions++;
console.log(JSON.stringify({status:'PASS',resolvedIssues:[{id:'damped',field:'envelope',status:'fixed-v74',meaning:'Envelope includes omega0/omegaD; former coefficient retained as decayCoefficient.'}],ids,assertions,configurations:counts,limits:'Independent closed-form CPU oracles and raw numeric table values; small-angle pendulum approximation only; no browser, hardware or teacher acceptance.'}));
