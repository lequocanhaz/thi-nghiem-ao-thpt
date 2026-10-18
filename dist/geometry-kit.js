import {modelLabel} from './model-label.js?v=33';
import * as T from './vendor/three.module.min.js';
export {T};
export const C={blue:0x347be1,cyan:0x32a4c4,purple:0x8972df,orange:0xef9851,green:0x359c7e,metal:0x9cacbd,dark:0x35475d};
export const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export const mat=(color,extra={})=>new T.MeshPhysicalMaterial({color,roughness:color===C.metal?.24:.38,metalness:color===C.metal?.82:color===C.dark?.06:.12,clearcoat:color===C.metal?0:.22,clearcoatRoughness:.3,...extra});
export function mesh(g,geom,material,x=0,y=0,z=0){const m=new T.Mesh(geom,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export function roundedGeometry(w,h,d){const r=Math.min(w,h,d)*.13,hw=w/2-r,hh=h/2-r,q=Math.min(r,hw,hh),shape=new T.Shape();shape.moveTo(-hw+q,-hh);shape.lineTo(hw-q,-hh);shape.quadraticCurveTo(hw,-hh,hw,-hh+q);shape.lineTo(hw,hh-q);shape.quadraticCurveTo(hw,hh,hw-q,hh);shape.lineTo(-hw+q,hh);shape.quadraticCurveTo(-hw,hh,-hw,hh-q);shape.lineTo(-hw,-hh+q);shape.quadraticCurveTo(-hw,-hh,-hw+q,-hh);const g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1,curveSegments:3});g.translate(0,0,-(d-2*r)/2);return g;}
export const box=(g,w,h,d,color,x=0,y=0,z=0)=>mesh(g,roundedGeometry(w,h,d),mat(color),x,y,z);
export const sphere=(g,r,color,x=0,y=0,z=0)=>mesh(g,new T.SphereGeometry(r,28,18),mat(color),x,y,z);
export const cylinder=(g,r,h,color,x=0,y=0,z=0)=>mesh(g,new T.CylinderGeometry(r,r,h,32),mat(color),x,y,z);
export function line(g,points,color=C.blue,dashed=false){const geom=new T.BufferGeometry().setFromPoints(points),m=dashed?new T.LineDashedMaterial({color,dashSize:.10,gapSize:.06}):new T.LineBasicMaterial({color});const l=new T.Line(geom,m);if(dashed)l.computeLineDistances();g.add(l);return l;}
export function arrow(g,origin,direction,color,length=1){const a=new T.ArrowHelper(direction.clone().normalize(),origin,length,color,.16,.08);g.add(a);return a;}
export function label(g,text,pos,o={}){return modelLabel(g,text,pos,o);}
export const setText=(l,t)=>l?.userData.setText(t);
export function platform(g,w=7,d=4){
 const firstChild=g.children.length;const m=box(g,w,.22,d,0xd6dfdb,0,-.11,0);box(g,w-.12,.035,d-.12,0xf4f6ee,0,.005,0);
 const nx=Math.max(2,Math.floor((w-.8)/.4)),nz=Math.max(2,Math.floor((d-.8)/.4)),count=nx*nz;
 const holes=new T.InstancedMesh(new T.CylinderGeometry(.021,.021,.002,10),mat(0x80938b,{roughness:.85,metalness:.05}),count);
 const collars=new T.InstancedMesh(new T.TorusGeometry(.028,.004,4,10),mat(0xc1cec4,{roughness:.44,metalness:.72}),count),dummy=new T.Object3D();
 g.add(holes,collars);holes.userData.instrumentDetail=collars.userData.instrumentDetail=true;
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=(i-(nx-1)/2)*.4,z=(j-(nz-1)/2)*.4,k=i*nz+j;dummy.rotation.set(0,0,0);dummy.position.set(x,.024,z);dummy.updateMatrix();holes.setMatrixAt(k,dummy.matrix);dummy.rotation.x=Math.PI/2;dummy.updateMatrix();collars.setMatrixAt(k,dummy.matrix);}
 for(const x of [-w/2+.2,w/2-.2])for(const z of [-d/2+.2,d/2-.2]){cylinder(g,.07,.015,C.metal,x,.035,z);line(g,[V(x-.025,.045,z),V(x+.025,.045,z)],0x627a96);cylinder(g,.12,.16,0x44526a,x,-.27,z);}
 for(const z of [-d/2+.028,d/2-.028])box(g,w-.25,.033,.018,0x84988d,0,-.09,z);
 const plate=box(g,.42,.09,.017,0x788d82,-w/2+.5,-.09,d/2+.002);plate.userData.instrumentDetail=true;
 for(const child of g.children.slice(firstChild))child.userData.stageBase=true;return m;
}
export function coil(g,from,to,radius=.13,loops=9){const points=Array.from({length:121},(_,i)=>{const f=i/120,base=from.clone().lerp(to,f),a=f*Math.PI*2*loops;return base.add(V(0,Math.cos(a)*radius,Math.sin(a)*radius));});return line(g,points,C.metal);}
export function updateLine(l,points){const a=l.geometry.attributes.position;points.forEach((p,i)=>a.setXYZ(i,p.x,p.y,p.z));a.needsUpdate=true;l.geometry.computeBoundingSphere();if(l.material.isLineDashedMaterial)l.computeLineDistances();}
export function flexibleTube(g,count=161,r=.035,color=C.metal,sides=8){const geom=new T.BufferGeometry(),pos=new Float32Array(count*sides*3),norm=new Float32Array(pos.length),indices=[];for(let i=0;i<count-1;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=a+sides,d=b+sides;indices.push(a,c,b,b,c,d);}geom.setAttribute('position',new T.BufferAttribute(pos,3));geom.setAttribute('normal',new T.BufferAttribute(norm,3));geom.setIndex(indices);geom.userData.tubeSides=sides;const tube=mesh(g,geom,mat(color,{roughness:.24,metalness:color===C.metal?.8:.3}));tube.userData.update=points=>{let previous=null;for(let i=0;i<count;i++){const tangent=points[Math.min(count-1,i+1)].clone().sub(points[Math.max(0,i-1)]).normalize(),axis=Math.abs(tangent.y)>.9?V(0,0,1):V(0,1,0),normal=previous?previous.clone().addScaledVector(tangent,-previous.dot(tangent)).normalize():tangent.clone().cross(axis).normalize(),binormal=tangent.clone().cross(normal).normalize();previous=normal;for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,n=normal.clone().multiplyScalar(Math.cos(a)).addScaledVector(binormal,Math.sin(a)),p=points[i].clone().addScaledVector(n,r),index=(i*sides+j)*3;pos.set(p.toArray(),index);norm.set(n.toArray(),index);}}geom.attributes.position.needsUpdate=geom.attributes.normal.needsUpdate=true;geom.computeBoundingSphere();};return tube;}
export function beam(g,color=C.orange,r=.017){const m=cylinder(g,r,1,color);m.material.emissive.setHex(color);m.material.emissiveIntensity=.45;m.userData.setEnds=(a,b)=>{const v=b.clone().sub(a),length=v.length();m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(V(0,1,0),v.normalize());m.scale.y=Math.max(.0001,length);};return m;}
export function badge(g,text,position,o){const s=label(g,text,position,o);s?.scale.set(1.1,.24,1);return s;}
