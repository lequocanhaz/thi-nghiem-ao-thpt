import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {discoveryExperiments} from '../dist/discovery-catalog.js';
import {evaluateDiscovery} from '../dist/discovery-models.js';
import {buildDiscoveryModel} from '../dist/discovery-scenes.js';
import {discoveryConcepts,discoveryRelation,discoveryRelationPoint} from '../dist/discovery-concepts.js';
const {document,window}=parseHTML('<body></body>');globalThis.document=document;
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},measureText:s=>({width:s.length*14})});
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const initial=e=>Object.fromEntries(e.params.map(p=>[p.key,p.value]));
const base=id=>initial(discoveryExperiments.find(e=>e.id===id));
const at=(id,values={})=>({...base(id),...values});
const point=(id,values={})=>discoveryRelationPoint(id,at(id,values));
assert.equal(Object.keys(discoveryConcepts).length,30);
assert.deepEqual(new Set(Object.keys(discoveryConcepts)),new Set(discoveryExperiments.map(e=>e.id)));
// Independent analytic cases: dimensions, signed quantities, singular states and phase transitions.
near(point('freefall',{h0:20,gravity:10,t:1}).y,15);
near(point('friction',{force:5,m:2,mu:.5}).y,0);
near(point('friction',{force:20,m:2,mu:.5}).y,5.095);
near(point('work',{force:10,angle:60,distance:2}).y,10);
near(point('impulse',{force:4,contact:1,m:2,v0:-1,t:2}).y,2);
near(point('buoyancy',{density:1000,volume:1,fraction:.5}).y,4.905);
near(point('pressure',{density:1000,depth:2,surface:100}).y,119.62);
near(point('reflection',{angle:30}).y,30);
near(point('refraction',{n1:1,n2:1.5,angle:30}).y,Math.asin(1/3)*180/Math.PI);
assert.equal(point('tir',{n1:1.5,n2:1,angle:60}).y,null);
near(point('lens',{distance:40,focal:20}).x,.025);near(point('lens',{distance:40,focal:20}).y,.025);
near(point('lens',{distance:20,focal:20}).y,0);
near(point('mirror',{distance:40,focal:-20}).y,-.075);
near(point('prism',{angle:60,index:1.5,dispersion:0}).y,(2*Math.asin(.75)-Math.PI/3)*180/Math.PI);
near(point('young',{probe:0}).y,1);
near(point('young',{wavelength:500,screen:1,slits:.5,probe:.5}).y,0);
near(point('diffraction',{wavelength:500,screen:1,width:.1,probe:5}).y,0);
near(point('polarization',{angle:90}).y,0);
near(point('thermalexpansion',{length:1,alpha:12,temp:120}).y,1.2);
near(point('calorimetry',{mHot:.5,mCold:.5,hot:80,cold:20}).y,50);
near(point('phasechange',{mass:.05,power:200,initial:-10,t:(1050+8350)/200}).y,0);
near(point('heattransfer',{conductivity:200,area:4,length:.5,hot:100,cold:20}).y,12.8);
near(point('isobaric',{n:.1,temp:300,pressure:100}).y,2.4943387854);
near(point('isochoric',{n:.1,temp:300,volume:4}).y,62.358469635);
near(point('firstlaw',{heat:-100,workOn:20}).y,-80);
near(point('kinetic',{temp:300,molar:28}).y,Math.sqrt(3*8.314462618*300/.028));
near(point('resistivity',{rho:.02,length:5,area:.2}).y,.5);
near(point('internalresistance',{emf:6,internalR:1,load:5}).y,5);
near(point('bridge',{r1:20,r2:40,r3:30,r4:60}).y,0);
near(point('solenoid',{turns:500,length:.5,i:-2}).y,-4*Math.PI*1e-4*2000);
near(point('lorentz',{charge:1,speed:4,b:.5}).y,2);
near(point('transformer',{n1:200,n2:100,u1:12}).y,6);
near(point('ac',{u0:12,f:1,phase:0,t:.25}).y,0);
let frames=0;
for(const e of discoveryExperiments){
 const s=initial(e),d=evaluateDiscovery(e.id,s),model=buildDiscoveryModel(e.id,s,d,{labels:false,thumbnail:true});
 const panel=model.group.getObjectByName('discovery-concept-'+e.id),curve=panel.getObjectByName('concept-theoretical-curve');
 assert.ok(panel.userData.theoretical);assert.ok(curve);assert.ok(panel.children.some(o=>o.userData.modelLabel),'Instrument units remain available when optional labels are off');
 const originalCurve=curve.geometry,originalMarker=panel.getObjectByName('concept-current-state');
 const states=[s,...e.params.flatMap(p=>[{...s,[p.key]:p.min},{...s,[p.key]:p.max}])];
 for(const state of states){
  const data=evaluateDiscovery(e.id,state),before=JSON.stringify({state,data}),relation=discoveryRelation(e.id,state,data);
  assert.ok(relation.max>relation.min&&relation.ymax>relation.ymin);
  assert.ok(relation.xLabel&&relation.yLabel);assert.ok(relation.samples.every(p=>Number.isFinite(p.x)&&(p.y===null||Number.isFinite(p.y))));
  model.update(state,data,{switches:{vectors:true,trajectory:true}});model.group.updateMatrixWorld(true);
  assert.equal(JSON.stringify({state,data}),before,e.id+' render keeps scientific inputs/outputs immutable');
  assert.equal(curve.geometry,originalCurve);assert.equal(panel.getObjectByName('concept-current-state'),originalMarker);
  model.group.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite),e.id+' finite matrix');const a=o.geometry?.attributes.position?.array;if(a)assert.ok(Array.from(a).every(Number.isFinite),e.id+' finite vertices');});
  const current=discoveryRelationPoint(e.id,state,data);assert.deepEqual(panel.userData.current,current);frames++;
 }
}
// Actual geometry checks: no clamped translation, signed transfers, zero transmitted field and held immersion.
for(const id of ['friction','impulse']){
 const s=at(id,id==='friction'?{force:30,mu:0,m:.5,t:2}:{force:20,contact:2,m:.5,t:4}),d=evaluateDiscovery(id,s),m=buildDiscoveryModel(id,s,d,{labels:false});
 near(m.group.getObjectByName('discovery-moving-body').position.x,-2.5+d.x*.85);
 const rail=m.group.getObjectByName('discovery-full-motion-rail').geometry.attributes.position;assert.ok(rail.getX(1)>-2.5+d.x*.85);
}
{
 const s=at('firstlaw',{heat:-100,workOn:20}),m=buildDiscoveryModel('firstlaw',s,evaluateDiscovery('firstlaw',s),{labels:false});
 assert.ok(m.group.getObjectByName('discovery-signed-energy-0').position.y<1.6);assert.ok(m.group.getObjectByName('discovery-signed-energy-1').position.y>1.6);assert.ok(m.group.getObjectByName('discovery-signed-energy-2').position.y<1.6);
}
{
 const s=at('polarization',{angle:90}),m=buildDiscoveryModel('polarization',s,evaluateDiscovery('polarization',s),{labels:false});
 assert.equal(m.group.getObjectByName('discovery-transmitted-light').visible,false);assert.equal(m.group.getObjectByName('discovery-projected-electric-field').visible,false);
}
{
 const s=at('heattransfer',{hot:100,cold:20}),m=buildDiscoveryModel('heattransfer',s,evaluateDiscovery('heattransfer',s),{labels:false});
 for(let j=1;j<16;j++)assert.ok(m.group.getObjectByName('discovery-temperature-segment-'+j).userData.temperature<m.group.getObjectByName('discovery-temperature-segment-'+(j-1)).userData.temperature);
}
{
 const s=at('buoyancy',{m:.1,volume:2,density:1000,fraction:1}),m=buildDiscoveryModel('buoyancy',s,evaluateDiscovery('buoyancy',s),{labels:false});
 const support=m.group.getObjectByName('discovery-holding-force');assert.ok(support.userData.value<0);assert.ok(support.visible);
}
for(const angle of [20,50,70]){
 const s=at('prism',{angle}),m=buildDiscoveryModel('prism',s,evaluateDiscovery('prism',s),{labels:false});
 for(let j=0;j<7;j++){
  const ray=m.group.getObjectByName('discovery-prism-color-'+j),n=ray.userData.index,i=ray.userData.incidence,r=angle*Math.PI/360;
  near(Math.sin(i),n*Math.sin(r));near(ray.userData.minimumDeviation,2*i-angle*Math.PI/180);
  const p=ray.geometry.attributes.position;near(p.getZ(1),p.getZ(2));assert.ok(p.getX(2)>p.getX(1));
 }
}
console.log('PASS v64 discovery: 30 theoretical relations, independent analytic cases, '+frames+' finite immutable geometry frames, retained buffers, signed energy, unclamped motion, field extinction, thermal gradient, support force and Snell-consistent minimum-deviation rays. CPU geometry only.');
