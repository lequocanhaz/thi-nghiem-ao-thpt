import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {fitThermalCameraBounds} from '../dist/l3/thermal-three.js';

let assertions=0;
const check=(condition,message)=>{assert.ok(condition,message);assertions++;};
// Verify with Three's independent perspective projection, not the fitting
// formula. Include an immersed thermometer extending above the vessel rim.
const boxes=[new THREE.Box3(new THREE.Vector3(-.05,0,-.04),new THREE.Vector3(.07,.29,.04)),new THREE.Box3(new THREE.Vector3(-.14,-.01,-.14),new THREE.Vector3(.16,.42,.14)),new THREE.Box3(new THREE.Vector3(.2,.1,-.06),new THREE.Vector3(.35,.195,.06)),new THREE.Box3(new THREE.Vector3(-.42,-.1,-.01),new THREE.Vector3(-.35,.35,.02))];
for(const aspect of [294/360,364/360,726/421.08,1374/620,.5,3])for(const theta of [-.7,0,.7])for(const phi of [.65,1.1,1.5])for(const bounds of boxes){
 const original=JSON.stringify(bounds),direction=new THREE.Vector3().setFromSpherical(new THREE.Spherical(1,phi,theta)),view=fitThermalCameraBounds(bounds,{aspect,direction}),camera=new THREE.PerspectiveCamera(39,aspect,.01,8);camera.position.copy(view.position);camera.lookAt(view.target);camera.updateMatrixWorld(true);check(!view.limited,'ordinary apparatus must fit without exceeding limits');
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);check(Math.abs(p.x)<=.900001&&Math.abs(p.y)<=.900001&&p.z>-1&&p.z<1,'every corner must fit inside the 10% inset');}
 check(JSON.stringify(bounds)===original,'framing must not modify physical bounds');
}
for(const options of [{aspect:0},{aspect:NaN},{fov:180},{padding:1},{direction:new THREE.Vector3()},{direction:new THREE.Vector3(0,1,0)},{maxDistance:.1}]){assert.throws(()=>fitThermalCameraBounds(boxes[0],options),RangeError);assertions++;}
assert.throws(()=>fitThermalCameraBounds(new THREE.Box3()),RangeError);assertions++;
const limited=fitThermalCameraBounds(new THREE.Box3(new THREE.Vector3(-10,-10,-10),new THREE.Vector3(10,10,10)));check(limited.limited&&limited.distance===2.7,'unfit scenes must expose the distance limit rather than fake fitting');
console.log(JSON.stringify({status:'PASS',assertions,scope:'Camera-space fit against independent Three perspective projection; every apparatus corner, finite domain and immutable SI bounds. Browser/context framing tested separately; no physical-device claim.'}));
