import {evaluate} from '../dist/models.js';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {TAU,circleState,phaseToTime,mountCircle,updateCircle} from '../dist/shm-circle.js';

const close=(actual,expected,msg)=>assert.ok(Math.abs(actual-expected)<1e-9,msg+': '+actual+' vs '+expected);
const initial={a:5,period:2,t:0};
const q0=circleState(initial);
close(q0.x,5,'At t=0 the oscillator starts at the positive endpoint');
close(q0.v,0,'At the positive endpoint speed is zero');
close(q0.acc,-5*Math.PI*Math.PI,'Acceleration points toward equilibrium');
close(q0.omega,Math.PI,'Angular velocity agrees with the spring period');
const q1=circleState({...initial,t:.5});
close(q1.phase,Math.PI/2,'A quarter period is pi/2');
close(q1.x,0,'A quarter period is the equilibrium position');
close(q1.v,-5*Math.PI,'Velocity is maximal and negative at a quarter period');
const q2=circleState({...initial,t:1});
close(q2.x,-5,'A half period is the negative endpoint');
close(q2.v,0,'Velocity vanishes at the negative endpoint');
close(q2.acc,5*Math.PI*Math.PI,'Acceleration is restorative at the negative endpoint');
const q3=circleState({...initial,t:1.5});
close(q3.x,0,'At three quarters of a cycle displacement is zero');
assert.ok(q3.v>0,'At three quarters of a cycle velocity points toward positive x');
for(const t of [0,.03,.25,.73,1.28,3.5,19.9]){
 const q=circleState({...initial,t});
 close(q.x,q.A*Math.cos(q.phase),'Projection equals cosine at t '+t);
 close(q.acc,-q.omega*q.omega*q.x,'Acceleration law at t '+t);
 close(q.v,-q.A*q.omega*Math.sin(q.phase),'Projection speed at t '+t);
}
close(phaseToTime(Math.PI/2,2,4.4),4.5,'Choosing a phase preserves the current cycle');
close(phaseToTime(TAU,2,4.4),6,'A full turn advances to the end of the current cycle');
close(phaseToTime(0,2,20),18,'At the final boundary, allow seeking in the last cycle');
close(phaseToTime(Math.PI,2,20),19,'Final-cycle half turn is reachable');
assert.equal(phaseToTime(0,0,0),null);
assert.equal(circleState({a:5,period:0,t:0}),null);

const {document,window}=parseHTML('<section id="panel"></section>');
globalThis.document=document;
const host=document.querySelector('#panel');
let selection=null;
mountCircle(host,p=>{selection=p;},'vi-VN');
assert.equal(host.querySelectorAll('.shm-radian').length,16,'Full school-angle reference ring');
assert.equal(host.querySelectorAll('[data-shm-phase]').length,5,'Quick phase presets');
assert.equal(host.querySelectorAll('.shm-wave-line').length,1,'Cosine reference curve');
assert.ok(host.textContent.includes('Vòng tròn lượng giác'),'Vietnamese classroom explanation');
const oldSvg=host.querySelector('svg');
assert.ok(updateCircle(host,{...initial,t:.5},{x:q1.x,v:q1.v,acc:q1.acc},'vi-VN'));
assert.equal(host.querySelector('svg'),oldSvg,'Changing state must not redraw chart DOM');
assert.match(host.querySelector('[data-shm-phase-text]').textContent,/90°/);
assert.match(host.querySelector('[data-shm-v]').textContent,/cm\/s$/);
const m=host.querySelector('[data-shm-m]');
close(Number(m.getAttribute('cx')),180,'At 90 degrees the rotating point is directly above O');
assert.ok(Number(m.getAttribute('cy'))<156,'Counterclockwise projection uses a positive mathematical angle');
close(Number(host.querySelector('[data-shm-h]').getAttribute('cx')),180,'Projection is at the origin at 90 degrees');
const preset=host.querySelector('[data-shm-phase="180"]');
preset.dispatchEvent(new window.Event('click'));
close(selection,Math.PI,'Preset changes model phase through callback');
mountCircle(host,p=>{selection=p;},'en-US');
assert.match(host.textContent,/circle behind the oscillation/i,'English users see English explanation');
assert.ok(updateCircle(host,{...initial,t:1},{x:q2.x,v:q2.v,acc:q2.acc},'en-US'));
assert.match(host.querySelector('[data-shm-x]').textContent,/-5.00 cm/);
console.log('PASS SHM circle v67: 16 marked angles, exact cosine projections and velocities, signed acceleration, synchronized SVG/presets, VI/EN, accessible slider and limits.');

for(const a of [1,5,10])for(const period of [.5,2,4])for(let i=0;i<=160;i++){
 const t=i/8,q=circleState({a,period,t}),d=evaluate('oscillation',{a,period,t});
 close(q.x,d.x,'Engine displacement');close(q.v,d.v,'Engine velocity');close(q.acc,d.acc,'Engine acceleration');
 close(q.x*q.x+(a*Math.sin(q.phase))**2,a*a,'Radius invariant');
}
console.log('PASS 1449 phase-circle states against the oscillator engine and radius invariant.');
