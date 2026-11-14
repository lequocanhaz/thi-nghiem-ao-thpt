// Independent numerical geometry oracles. No WebGL/device/teacher certification.
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {GEOMETRY,vesselGeometry,cupGeometry,waterLevel,sampleDimensions,cupSpoutAt,cupLiquidGeometry,cupPourCapacity} from '../dist/l3/thermal-geometry.js';
const near=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}; tolerance ${tol}`);
const frozen=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))frozen(v);Object.freeze(x);}return x;};
let capacityCases=0,cupCases=0,hydroCases=0,guardCases=0,spoutCases=0,pourCases=0,maxCupResidualM3=0,maxMeshResidualM3=0;
// Shoelace and the actual triangulated Three.js cylinder, independently of the
// module's regular-prism coefficient. Float32 mesh volume has its own tolerance.
function shoelace(points){return Math.abs(points.reduce((s,a,i)=>{const b=points[(i+1)%points.length];return s+a.x*b.z-a.z*b.x;},0))/2;}
function circlePolygon(r,n){return Array.from({length:n},(_,i)=>({x:r*Math.sin(i*2*Math.PI/n),z:r*Math.cos(i*2*Math.PI/n)}));}
function meshVolume(g){const p=g.attributes.position,index=g.index;let total=0;for(let i=0;i<(index?.count??p.count);i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i):i),b=new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+1):i+1),c=new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+2):i+2);total+=a.dot(b.cross(c))/6;}return Math.abs(total);}
for(const capacity of [.0001,.000101,.0002,.0003,.0006,.0009,.001,.002,.005,.00999,.01]){
 const config=frozen({capacityM3:capacity}),before=structuredClone(config),v=vesselGeometry(config),polygon=circlePolygon(v.innerRadiusM,64);near(shoelace(polygon)*v.innerHeightM,capacity,3e-17);near(v.areaM2,shoelace(polygon),3e-16);near(v.innerApothemM,v.innerRadiusM*Math.cos(Math.PI/64));near(v.rimCanonicalY,172);near(v.bottomCanonicalY,348);assert.equal(v.segments,64);
 const mesh=new THREE.CylinderGeometry(v.innerRadiusM,v.innerRadiusM,v.innerHeightM,64,1,false);const residual=Math.abs(meshVolume(mesh)-capacity);maxMeshResidualM3=Math.max(maxMeshResidualM3,residual);assert.ok(residual<capacity*2e-7);mesh.dispose();assert.deepEqual(config,before);capacityCases++;
}
for(const waterMassKg of [0,.01,.2,.45,.5,1,2]){const g=cupGeometry({waterMassKg});near(shoelace(circlePolygon(g.innerRadiusM,64))*g.innerHeightM,Math.max(.0005,waterMassKg*.0011),1e-16);assert.ok(g.innerApothemM<g.innerRadiusM&&g.innerRadiusM<g.outerRadiusM);near(g.topLocalY-g.bottomLocalY,g.innerHeightM);assert.ok(g.outerBottomY<g.bottomLocalY&&g.outerTopY>g.topLocalY);capacityCases++;}
// Independent integration oracle: slice the regular polygon at local x. Both
// the polygon's z-width and clipped liquid y-height are affine between vertices
// and the two gravity-plane breaks; two-point Gauss integrates their quadratic
// product exactly. This never calls the module's 3D clipping/volume routine.
function liquidByVerticalSlices(g,angle,level){
 const polygon=circlePolygon(g.innerRadiusM,64),sin=Math.sin(angle),cos=Math.cos(angle),breaks=polygon.map(p=>p.x),r=g.innerRadiusM;
 if(Math.abs(sin)>1e-12)for(const y of [g.bottomLocalY,g.topLocalY]){const x=(y*cos-level)/sin;if(x>-r&&x<r)breaks.push(x);}
 const xs=[...new Set(breaks)].sort((a,b)=>a-b),width=x=>{const z=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if((a.x<=x&&b.x>=x)||(a.x>=x&&b.x<=x)){if(Math.abs(b.x-a.x)>1e-15)z.push(a.z+(b.z-a.z)*(x-a.x)/(b.x-a.x));}}return z.length?Math.max(...z)-Math.min(...z):0;},height=x=>{if(Math.abs(cos)<1e-12)return -x*sin<=level?g.innerHeightM:0;const cut=Math.max(0,Math.min(g.innerHeightM,(level+x*sin)/cos-g.bottomLocalY));return cos>0?cut:g.innerHeightM-cut;};
 let volume=0;for(let i=0;i<xs.length-1;i++){const a=xs[i],b=xs[i+1],mid=(a+b)/2,offset=(b-a)/(2*Math.sqrt(3));volume+=(b-a)/2*(width(mid-offset)*height(mid-offset)+width(mid+offset)*height(mid+offset));}return volume;
}
for(const waterMassKg of [.01,.2,.5,1,2])for(const fraction of [0,.001,.1,.5,1])for(const degrees of [0,2,15,30,60,89,90,100]){
 const state=frozen({activity:'ice',config:{waterMassKg},cupWaterMassKg:waterMassKg*fraction}),before=structuredClone(state),angle=degrees*Math.PI/180,g=cupGeometry(state),liquid=cupLiquidGeometry(state,angle),target=state.cupWaterMassKg/1000;
 const integrated=fraction?liquidByVerticalSlices(g,angle,liquid.surfaceYM):0;near(integrated,target,6e-13);near(liquid.volumeM3,integrated,6e-13);maxCupResidualM3=Math.max(maxCupResidualM3,Math.abs(liquid.volumeM3-target));assert.equal(liquid.overflow,false);
 for(const face of liquid.faces)for(const p of face){assert.ok([p.x,p.y,p.z].every(Number.isFinite));assert.ok(p.y<=liquid.surfaceYM+1e-12);const local={x:p.x*Math.cos(angle)-p.y*Math.sin(angle),y:p.x*Math.sin(angle)+p.y*Math.cos(angle)};assert.ok(local.y>=g.bottomLocalY-1e-12&&local.y<=g.topLocalY+1e-12);assert.ok(Math.hypot(local.x,p.z)<=g.innerRadiusM+1e-12);}
 for(const p of liquid.sectionLocalXY)assert.ok(Math.abs(p.x)<=g.innerRadiusM+1e-12&&p.y>=g.bottomLocalY-1e-12&&p.y<=g.topLocalY+1e-12);
 assert.deepEqual(state,before);cupCases++;
}
// The same independent slice integral checks how much liquid a tilted open cup
// can retain, including a below-lip tilt that must not pour and gradual emptying.
for(const sourceMass of [.01,.2,.5,1,2])for(const degrees of [0,10,30,31,45,55,60,75,89,90,100]){
 const state=frozen({config:{waterMassKg:sourceMass},cupWaterMassKg:sourceMass}),angle=degrees*Math.PI/180,g=cupGeometry(state),pour=cupPourCapacity(state,angle),before=structuredClone(state),retained=liquidByVerticalSlices(g,angle,pour.lipHeightYM);near(pour.retainedVolumeM3,retained,5e-14);near(pour.pourableMassKg,Math.max(0,sourceMass-retained*1000),5e-11);assert.deepEqual(state,before);if(degrees>=90)near(pour.retainedVolumeM3,0,1e-15);pourCases++;
}
const partlyFull={config:{waterMassKg:.2},cupWaterMassKg:.2};for(const degree of [0,30,31,45,55]){assert.equal(cupPourCapacity(partlyFull,degree*Math.PI/180).canPour,false,'A 40%-full cup must first reach its lip');pourCases++;}
const at60=cupPourCapacity(partlyFull,Math.PI/3);assert.ok(at60.pourableMassKg>0&&at60.pourableMassKg<.2);const remaining=.2-at60.pourableMassKg;assert.equal(cupPourCapacity({...partlyFull,cupWaterMassKg:remaining},Math.PI/3).canPour,false,'Holding 60° pours only the excess, not the entire source');assert.ok(cupPourCapacity({...partlyFull,cupWaterMassKg:remaining},Math.PI/2).pourableMassKg>=remaining-1e-12);pourCases++;
const excessive=cupLiquidGeometry({config:{waterMassKg:.2},cupWaterMassKg:2},Math.PI/3);assert.equal(excessive.overflow,true);near(excessive.volumeM3,.0005,1e-14);near(excessive.targetVolumeM3,.002);cupCases++;
function checkHydro(state){const before=structuredClone(state),s=frozen(state),v=vesselGeometry(s),level=waterLevel(s),body=level.objectKind?sampleDimensions(s,level.objectKind):null;
 assert.ok([level.heightM,level.canonicalY,level.objectBottomM,level.objectCenterM,level.displacedVolumeM3].every(Number.isFinite));assert.ok(level.heightM>=0&&level.heightM<=v.innerHeightM);assert.ok(level.objectBottomM>=0);near(v.areaM2*level.unclampedHeightM-level.displacedVolumeM3,s.waterMassKg/1000,5e-16);
 if(body&&level.valid){near(body.widthM*body.heightM*body.depthM,body.volumeM3,5e-18);near(body.volumeM3*body.densityKgM3,body.massKg,1e-14);const depth=Math.max(0,Math.min(body.heightM,level.unclampedHeightM-level.objectBottomM));near(depth*body.footprintM2,level.displacedVolumeM3,5e-16);if(level.contact==='floating')near(level.displacedVolumeM3*1000,body.massKg,1e-12);else if(level.contact==='grounded')near(level.objectBottomM,0);}
 assert.deepEqual(s,before);hydroCases++;return{v,level,body};}
for(const waterMassKg of [0,.0001,.001,.01,.1,.2,.4])for(const iceMassKg of [.001,.02,.1,.4]){const result=checkHydro({activity:'ice',config:{capacityM3:.0006},waterMassKg,iceMassKg});if(!waterMassKg){assert.equal(result.level.heightM,0);assert.equal(result.level.contact,'grounded');near(result.level.displacedVolumeM3,0);}}
const ordinary=checkHydro({activity:'ice',config:{capacityM3:.0006},waterMassKg:.2,iceMassKg:.02});near(ordinary.level.heightM,.00022/(.0006/.176));assert.equal(ordinary.level.contact,'floating');near(ordinary.body.submergedFraction,.917);
const threshold=(ordinary.v.areaM2-ordinary.body.footprintM2)*ordinary.body.heightM*.917*1000;
const below=checkHydro({activity:'ice',config:{capacityM3:.0006},waterMassKg:threshold*(1-1e-7),iceMassKg:.02}),above=checkHydro({activity:'ice',config:{capacityM3:.0006},waterMassKg:threshold*(1+1e-7),iceMassKg:.02});assert.equal(below.level.contact,'grounded');assert.equal(above.level.contact,'floating');assert.ok(Math.abs(above.level.heightM-below.level.heightM)<1e-8);
for(const density of [500,917,1000,2700,20000])for(const mass of [.001,.01,.1])for(const waterMassKg of [0,.0001,.01,.2])checkHydro({activity:'solid',config:{solidDensityKgM3:density,capacityM3:.0006},solid:{massKg:mass,location:'water'},waterMassKg});
const tooLarge=checkHydro({activity:'solid',config:{solidDensityKgM3:500},solid:{massKg:1,location:'water'},waterMassKg:.2});assert.equal(tooLarge.level.valid,false);assert.equal(tooLarge.level.reason,'sample-does-not-fit');assert.equal(tooLarge.level.contact,'unsupported');near(tooLarge.level.heightM,.0002/tooLarge.v.areaM2);near(tooLarge.level.displacedVolumeM3,0);
const noBody=checkHydro({activity:'solid',config:{capacityM3:.01},solid:{massKg:1,location:'tray'},waterMassKg:3});assert.equal(noBody.level.contact,'none');near(noBody.level.heightM,.003/(.01/.176));
const overflow=checkHydro({activity:'ice',config:{capacityM3:.0001},waterMassKg:2,iceMassKg:0});assert.equal(overflow.level.valid,false);assert.equal(overflow.level.reason,'vessel-overflow');assert.equal(overflow.level.overflow,true);near(overflow.level.heightM,.176);
for(const mass of [.01,.2,2])for(const angle of [0,.2,Math.PI/2,100*Math.PI/180]){const p={x:300,y:70},g=cupGeometry({waterMassKg:mass}),spout=cupSpoutAt(p,angle,{waterMassKg:mass});const world=new THREE.Vector3(g.spoutEnd.x,g.spoutEnd.y,0).applyAxisAngle(new THREE.Vector3(0,0,1),-angle);near(spout.x,300+world.x*1000);near(spout.y,70-world.y*1000);spoutCases++;}
for(const value of [null,'0',NaN,Infinity,-Infinity,-1]){for(const fn of [()=>vesselGeometry({capacityM3:value}),()=>cupGeometry({waterMassKg:value}),()=>waterLevel({waterMassKg:value}),()=>sampleDimensions({iceMassKg:value},'ice'),()=>cupLiquidGeometry({cupWaterMassKg:value})]){assert.throws(fn);guardCases++;}}
for(const fn of [()=>vesselGeometry({capacityM3:.00001}),()=>vesselGeometry({capacityM3:.011}),()=>cupGeometry({waterMassKg:2.1}),()=>sampleDimensions({config:{solidDensityKgM3:0}},'solid'),()=>sampleDimensions({},'unknown'),()=>cupSpoutAt({x:NaN,y:0},0),()=>cupSpoutAt({x:0,y:0},Infinity),()=>cupLiquidGeometry({cupWaterMassKg:0},NaN)]){assert.throws(fn);guardCases++;}
assert.equal(GEOMETRY.segments,64);assert.ok(Object.isFrozen(GEOMETRY));
console.log(JSON.stringify({status:'PASS',capacityCases,cupCases,hydroCases,spoutCases,pourCases,guardCases,maxCupResidualM3,maxMeshResidualM3,scope:'Independent polygon shoelace, actual Three.js triangulated cylinder, exact piecewise Gauss slice integration of tilted cup, water-volume and Archimedes balances including dry/shallow/unsupported domains; no WebGL/hardware/teacher claim.'}));
