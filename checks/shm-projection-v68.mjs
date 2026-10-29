import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {evaluate} from '../dist/models.js';
import {mountCircle,updateCircle} from '../dist/shm-circle.js';

// Read the actual rendered vectors. Neither expected component comes from
// circleState(), its SVG radius, or the renderer's chosen tangent length.
const close=(actual,expected,message)=>assert.ok(
 Number.isFinite(actual)&&Number.isFinite(expected)&&
 Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected)),
 `${message}: ${actual} != ${expected}`
);
const attribute=(node,name)=>{
 assert.ok(node.hasAttribute(name),'SVG vector has '+name);
 const value=Number(node.getAttribute(name));
 assert.ok(Number.isFinite(value),'Finite SVG vector '+name);
 return value;
};
const vector=node=>{
 assert.ok(node,'Actual SVG velocity vector exists');
 const x1=attribute(node,'x1'),y1=attribute(node,'y1');
 const x2=attribute(node,'x2'),y2=attribute(node,'y2');
 return {x1,y1,x2,y2,dx:x2-x1,dy:y2-y1};
};

const {document}=parseHTML('<section id="projection-panel"></section>');
globalThis.document=document;
const host=document.querySelector('#projection-panel');
mountCircle(host,()=>{},'en-US');
const svg=host.querySelector('.shm-circle-svg');
const tangentNode=host.querySelector('[data-shm-tangent]');
const projectedNode=host.querySelector('[data-shm-projected-v]');
const movingNode=host.querySelector('[data-shm-m]');
const projectedPoint=host.querySelector('[data-shm-h]');
const angles=[0,.000001,.01,1,30,45,60,90,120,135,150,179,179.999999,
 180,180.000001,210,225,240,270,300,315,330,359.6,359.999999,360];
let states=0,verySmallAngles=0;

function verify(state,description){
 const data=Object.freeze(evaluate('oscillation',state));
 const before=JSON.stringify({state,data});
 assert.equal(updateCircle(host,state,data,'en-US'),true,description+' updates');
 assert.equal(JSON.stringify({state,data}),before,'Projection cannot mutate the model or readouts');
 assert.equal(host.querySelector('.shm-circle-svg'),svg,'Keep the existing chart SVG');
 assert.equal(host.querySelector('[data-shm-tangent]'),tangentNode,'Update the existing tangent');
 assert.equal(host.querySelector('[data-shm-projected-v]'),projectedNode,'Update the existing projection');

 const tangent=vector(tangentNode),projected=vector(projectedNode);
 const speedOnDiagram=Math.hypot(tangent.dx,tangent.dy);
 assert.ok(speedOnDiagram>0,description+' has nonzero circular speed');
 // Orthogonal projection onto Ox retains exactly the x component. It cannot
 // add a minimum arrow length, even near a turning point where v tends to zero.
 close(projected.dx,tangent.dx,description+' horizontal velocity projection');
 close(projected.dy,0,description+' projected velocity stays on Ox');
 close(tangent.x1,attribute(movingNode,'cx'),description+' tangent starts at M.x');
 close(tangent.y1,attribute(movingNode,'cy'),description+' tangent starts at M.y');
 close(projected.x1,attribute(projectedPoint,'cx'),description+' projected velocity starts at H.x');
 close(projected.y1,attribute(projectedPoint,'cy'),description+' projected velocity starts at H.y');
 close(projected.x1,tangent.x1,description+' M and H share an abscissa');

 // The diagram uses a normalized velocity scale. Recover that scale from the
 // actual tangent, then compare with the authoritative physical velocity.
 const physicalCircularSpeed=state.a*2*Math.PI/state.period;
 close(projected.dx/speedOnDiagram,data.v/physicalCircularSpeed,
  description+' normalized SVG velocity agrees with the oscillator engine');
 states++;
}

for(const a of [.1,5,50])for(const period of [.05,2,20]){
 for(const degree of angles){
  const state=Object.freeze({a,period,t:degree/360*period});
  verify(state,`A=${a} cm T=${period} s phase=${degree}°`);
  if(degree>0&&degree<.02)verySmallAngles++;
 }
 // Also update after many completed cycles and at the session boundary; the
 // component must remain correct after the renderer reduces the phase modulo 2π.
 for(const t of [19.999,20])verify(Object.freeze({a,period,t}),`A=${a} cm T=${period} s t=${t} s`);
}
console.log('PASS SHM velocity projection v68:',JSON.stringify({
 states,markedAngles:angles.length,verySmallAngles,
 amplitudes:[.1,5,50],periods:[.05,2,20],
 scope:'Actual SVG vector components and normalized engine velocity, tiny angles, signed velocity, live domain extrema and session boundaries; Node/DOM only, no browser or hardware claim.'
}));
