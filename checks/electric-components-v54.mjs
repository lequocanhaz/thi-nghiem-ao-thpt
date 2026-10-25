import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
const base=initialState(experiments.find(e=>e.id==='electric'));let count=0;
for(const mode of [0,1,2,3])for(const charge of [-9,-1,0,1,9])for(const z of [-.8,0,.8]){
 const s={...base,q0:charge,q2:charge,z2:z,pz:z,px:.31,py:.27};const d=evaluate('electric',s,{mode});assert.ok(d);
 for(const p of d.parts){const norm=Math.hypot(p.x,p.y,p.z);assert.ok(Math.abs(p.magnitude-norm)<=1e-12+norm*1e-12,'Component magnitude equals its vector norm in '+d.unit);count++;}
 for(const key of ['x','y','z'])assert.ok(Math.abs(d[key]-d.parts.reduce((a,p)=>a+p[key],0))<1e-12+Math.abs(d[key])*1e-12);
 if(mode===0||mode===2)assert.equal(d.unit,'N');else assert.equal(d.unit,'N/C');
}
console.log('PASS electric v54:',count,'signed/zero-charge 3D component magnitudes and superposition checks; force and field units separated.');
