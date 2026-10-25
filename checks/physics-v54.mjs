import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
const K=8.9875517923e9,EPS=8.8541878128e-12,G=6.67430e-11,M=5.972e24,Q=1.602176634e-19,MP=1.672621924e-27,C=299792458;
let assertions=0;
const near=(actual,expected,relative=2e-10,absolute=1e-12)=>{assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=absolute+relative*Math.abs(expected),`${actual} differs from ${expected}`);assertions++;};
const data=(id,input)=>evaluate(id,{...initialState(experiments.find(e=>e.id===id)),...input});
// Coulomb potential uses Euclidean source-to-probe distance, never signed x.
for(const charge of [.1,4,49.6,-4])for(const half of [.05,.15,1.5])for(const x of [-3,-.5,0,.025,.1,.25,1,3]){
 if(x===half||x===-half)continue;
 const d=data('potential_pair',{charge,half,distance:x});
 const positiveDistance=Math.hypot(x-half,0,0),negativeDistance=Math.hypot(x+half,0,0);
 near(d.near,K*charge*1e-9/positiveDistance);near(d.far,-K*charge*1e-9/negativeDistance);near(d.potential,K*charge*1e-9*(1/positiveDistance-1/negativeDistance));
}
for(const x of [-.15,.15]){const d=data('potential_pair',{half:.15,distance:x});assert.equal(d.potential,null);assertions++;}
// Independent adaptive quadrature of the causal convolution of two RC stages.
function integrate(f,a=0,b=1,eps=1e-13){
 const sim=(a,b,fa,fm,fb)=>(b-a)*(fa+4*fm+fb)/6;
 const recurse=(a,b,fa,fm,fb,whole,eps,depth)=>{const m=(a+b)/2,l=f((a+m)/2),r=f((m+b)/2),left=sim(a,m,fa,l,fm),right=sim(m,b,fm,r,fb),delta=left+right-whole;if(depth===0||Math.abs(delta)<15*eps)return left+right+delta/15;return recurse(a,m,fa,l,fm,left,eps/2,depth-1)+recurse(m,b,fm,r,fb,right,eps/2,depth-1);};
 const fa=f(a),fm=f((a+b)/2),fb=f(b);return recurse(a,b,fa,fm,fb,sim(a,b,fa,fm,fb),eps,24);
}
for(const [a,b]of [[.005,.005000009],[.005,.005],[.3,.8],[2,.005],[.05,10],[.5,.5000000000001]])for(const fraction of [0,1e-6,.1,1,6]){
 const t=fraction*Math.max(a,b),ref=12*integrate(u=>(t/a)*Math.exp(-t*u/a)*(-Math.expm1(-t*(1-u)/b))),d=data('two_stage_rc',{tau1:a,tau2:b,t});
 near(d.out,ref,2e-9,1e-11);near(d.first,-12*Math.expm1(-t/a));near(d.lag,d.first-ref,2e-9,1e-11);near(d.out,data('two_stage_rc',{tau1:b,tau2:a,t}).out);
 assert.ok(d.out>=0&&d.out<=12);assertions++;
}
for(const density of [-.1,0,.03,.1])for(const position of [-1,-1e-11,-Number.MIN_VALUE,Number.MIN_VALUE,1e-11,1]){
 const d=data('charged_plane',{density,position});near(d.field,Math.sign(position)*density*1e-6/(2*EPS));near(d.jump,density*1e-6/EPS);near(d.magnitude,Math.abs(density)*1e-6/(2*EPS));
}
assert.equal(data('charged_plane',{position:0}).field,null);assertions++;
for(const axis of [8000,12000,30000])for(const eccentricity of [0,.2,.3,.7])for(const angle of [0,60,180,270,360]){
 const d=data('elliptic_orbit',{axis,eccentricity,angle}),allowed=axis*(1-eccentricity)>=6371;
 assert.equal(d.domainValid,allowed);assertions++;
 if(!allowed){for(const key of ['radius','speed','areaRate'])assert.equal(d[key],null);assert.match(d.domainMessage,/6371/);continue;}
 const p=axis*1000*(1-eccentricity**2),r=p/(1+eccentricity*Math.cos(angle*Math.PI/180));
 near(d.radius,r/1000);near(d.speed**2,G*M*(2/r-1/(axis*1000))/1e6);near(d.areaRate,Math.sqrt(G*M*p)/2e6);
}
for(const magnetic of [.1,.5,1,5])for(const radius of [2,10,20,100]){
 const d=data('cyclotron',{magnetic,radius,gapVoltage:1000}),r=radius/100,v=Q*magnetic*r/MP,allowed=v<=C*.1;
 assert.equal(d.domainValid,allowed);assertions++;near(d.classicalSpeed,v);
 if(!allowed){for(const key of ['frequency','energy','turns'])assert.equal(d[key],null);assert.match(d.domainMessage,/0,1c/);continue;}
 near(d.frequency,v/(2*Math.PI*r)/1e6);near(d.energy,.5*MP*v*v/Q/1000);near(d.turns,d.energy*1000/(2*1000));
}
console.log(`PASS physics v54: ${assertions} independent assertions for dipole potential, buffered RC convolution, charged sheet and orbital/cyclotron domains. Numerical/domain checks only; no rendered-scene or classroom certification.`);
