import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {buildLabModel} from '../dist/scene3d.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';

const {document,window}=parseHTML('<body></body>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},arc(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){},setTransform(){},measureText:s=>({width:s.length*15})});
const experiment=experiments.find(e=>e.id==='resonance'),base=initialState(experiment);
const cases=[base,{...base,f:1,f0:1,beta:.1,force:2}];
for(const f0 of [.05,1,10])for(const f of [.02,f0,12.5])for(const beta of [.1,1])for(const force of [.02,10])cases.push({...base,f0,f,beta,force});
const model=buildLabModel('resonance',base,evaluate('resonance',base),{labels:false,thumbnail:true});
const mass=model.group.getObjectByName('oscillator-mass');assert.ok(mass);
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
let frames=0,scaledCases=0;
for(const state of cases){
 // Independent complex response to x'' + 2 beta x' + omega0² x = F cos(omega t), m=1.
 const omega=2*Math.PI*state.f,omega0=2*Math.PI*state.f0;
 const real=omega0*omega0-omega*omega,imag=2*state.beta*omega,den=real*real+imag*imag;
 const u=state.force*real/den,v=state.force*imag/den,amplitude=Math.hypot(u,v);
 const scale=amplitude*6<=1.65?6:1.65/amplitude;
 if(scale<6)scaledCases++;
 const observed=[];
 for(let i=0;i<=96;i++){
  const phase=i*2*Math.PI/96,t=phase/omega,s={...state,t},d=evaluate('resonance',s),before=JSON.stringify({s,d});
  model.update(s,d,{});
  const expected=(u*Math.cos(phase)+v*Math.sin(phase))*scale;
  close(mass.position.x,expected);
  close(d.amplitude,amplitude,1e-8);
  assert.equal(JSON.stringify({s,d}),before,'Drawing the oscillator cannot alter measured physics');
  observed.push(mass.position.x);frames++;
 }
 // Equally spaced samples of a sinusoid satisfy this recurrence. A clipped
 // plateau at an extremum fails it even when the amplitude still looks right.
 for(let i=1;i<observed.length-1;i++)close(observed[i-1]+observed[i+1],2*Math.cos(2*Math.PI/96)*observed[i]);
}
assert.ok(scaledCases>0);
console.log('PASS resonance waveform:',JSON.stringify({parameterCases:cases.length,frames,scaledCases,scope:'Actual mass positions match an independent harmonic-response oracle without clipping; numerical/CPU geometry only.'}));
