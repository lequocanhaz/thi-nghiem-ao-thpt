import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {OPTICS_IDS,buildOpticsGeometry} from '../dist/optics-geometry-v65.js';

// Independent expectations are recovered from the actual ray endpoints, rather
// than trusting helper values or asking evaluate() to produce an expected ray.
const close=(a,b,tol=2e-9)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const vector=s=>({x:s.to.x-s.from.x,y:s.to.y-s.from.y});
const length=v=>Math.hypot(v.x,v.y);
const unit=s=>{const v=vector(s),l=length(v);return {x:v.x/l,y:v.y/l};};
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const slope=s=>{const v=vector(s);return v.y/v.x;};
const atX=(s,x)=>s.from.y+(x-s.from.x)*slope(s);
const ray=(g,id)=>{const result=g.segments.find(s=>s.id===id);assert.ok(result,g.id+' '+id);return result;};
const mark=(g,id)=>{const result=g.markers.find(m=>m.id===id);assert.ok(result,g.id+' '+id);return result;};
const element=(g,id)=>{const result=g.elements.find(m=>m.id===id);assert.ok(result,g.id+' '+id);return result;};
const deg=a=>a*180/Math.PI;
function finiteTree(value,path='geometry'){
 if(typeof value==='number')assert.ok(Number.isFinite(value),'Finite '+path);
 else if(Array.isArray(value))value.forEach((v,i)=>finiteTree(v,path+'.'+i));
 else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))finiteTree(v,path+'.'+k);
}
function insideBounds(g){
 const {minX,maxX,minY,maxY}=g.bounds;
 assert.ok(maxX>minX&&maxY>minY,g.id+' nonempty physical bounds');
 for(const s of g.segments)for(const q of [s.from,s.to]){
  assert.ok(q.x>=minX-1e-8&&q.x<=maxX+1e-8&&q.y>=minY-1e-8&&q.y<=maxY+1e-8,g.id+' unclipped ray bounds');
 }
 for(const m of g.markers){assert.ok(m.x>=minX-1e-8&&m.x<=maxX+1e-8);assert.ok(m.y>=minY-1e-8&&m.y<=maxY+1e-8);}
}
function science(g,s,d){
 switch(g.id){
  case 'ray_slab':{
   const a=ray(g,'incident'),b=ray(g,'in-slab'),c=ray(g,'emergent'),u=unit(a),v=unit(b),w=unit(c);
   close(u.x,s.index*v.x);close(dot(u,w),1);close(c.from.y,-s.thickness);close(b.to.x,s.thickness*v.x/-v.y);
   const distance=Math.abs(cross(u,c.from));close(distance,d.shift);
   const measure=ray(g,'lateral-shift');close(length(vector(measure)),d.shift);close(dot(vector(measure),u),0);
   close(deg(Math.asin(v.x)),d.refracted);close(deg(Math.asin(w.x)),d.emergent);
   if(s.index===1||s.angle===0)close(distance,0);
   break;
  }
  case 'apparent_depth':{
   assert.equal(g.model,'paraxial');assert.equal(g.image.kind,'virtual');assert.equal(g.image.paraxial,true);
   const object=mark(g,'object'),image=mark(g,'apparent-image');close(object.y,-s.depth);close(image.y,-s.depth/s.index);
   for(const sign of [-1,1]){
    const inner=ray(g,'liquid-'+sign),outer=ray(g,'air-'+sign),back=ray(g,'back-extension-'+sign);
    const q=vector(inner),r=vector(outer);close(r.x/r.y,s.index*q.x/q.y);
    close(back.to.x,0);close(back.to.y,image.y);close(back.to.y,outer.from.y-outer.from.x*slope(outer));
    assert.equal(back.dashed,true);assert.ok(Math.abs(unit(outer).x)<.064,'Near-normal observer');
    // Quantify the small-angle scope instead of claiming exact Snell refraction.
    const sinIn=Math.abs(unit(inner).x),sinOut=Math.abs(unit(outer).x);
    assert.ok(Math.abs(sinOut-s.index*sinIn)<=.002*s.index*sinIn+1e-12,'Bounded paraxial Snell error');
   }
   assert.ok(g.notes.some(n=>/≈/.test(n.vi)&&/paraxial/.test(n.en)));
   close(-image.y,d.apparent);close(image.y-object.y,d.rise);break;
  }
  case 'brewster':{
   const a=unit(ray(g,'incident')),r=unit(ray(g,'reflected')),t=unit(ray(g,'refracted'));
   close(s.index1*a.x,s.index*t.x);close(dot(r,t),0);close(a.x,r.x);close(a.y,-r.y);
   const i=Math.asin(a.x),theta=Math.asin(t.x);
   close(deg(i),d.angle);close(deg(theta),d.refracted);close(deg(i+theta),90);
   const rp=(s.index*Math.cos(i)-s.index1*Math.cos(theta))/(s.index*Math.cos(i)+s.index1*Math.cos(theta));close(rp,0);
   assert.equal(ray(g,'reflected').role,s.index===s.index1?'guide':'reflected');
   assert.equal(ray(g,'reflected').physical,s.index!==s.index1);break;
  }
  case 'mirror_rotation':{
   const u=unit(ray(g,'incident')),v=unit(ray(g,'reflected')),v0=unit(ray(g,'original-reflection')),n=element(g,'mirror').normal;
   close(v.x,u.x-2*dot(u,n)*n.x);close(v.y,u.y-2*dot(u,n)*n.y);
   close(dot(u,n),-dot(v,n));close(dot(v,v),1);
   const signedTurn=deg(Math.atan2(cross(v0,v),dot(v0,v)));close(signedTurn,2*s.rotation);close(signedTurn,d.deviation);
   // At rotations above 20°, incidence changes side; no abs()/angle-wrap may
   // incorrectly make the reflected direction turn back.
   close(g.values.incidenceSigned,20-s.rotation);break;
  }
  case 'fiber_acceptance':{
   const incoming=unit(ray(g,'incident')),inner=g.segments.filter(q=>q.id.startsWith('core-ray-')),outgoing=unit(ray(g,'emergent'));
   assert.ok(inner.length>1);close(incoming.y,s.core*unit(inner[0]).y);close(Math.abs(outgoing.y),s.core*Math.abs(unit(inner.at(-1)).y));
   const NA=Math.sqrt(s.core*s.core-s.cladding*s.cladding),critical=Math.asin(s.cladding/s.core),acceptance=Math.asin(NA);
   close(NA,d.aperture);close(deg(acceptance),d.angle);close(deg(critical),d.critical);
   for(const [j,r]of inner.entries()){
    assert.ok(r.from.x>=0&&r.to.x<=6+1e-9);assert.ok(Math.abs(r.from.y)<=.45+1e-9&&Math.abs(r.to.y)<=.45+1e-9);
    const beta=Math.atan(Math.abs(slope(r)));assert.ok(Math.PI/2-beta>critical,'Actual core ray undergoes TIR');
    if(j<inner.length-1){close(Math.abs(r.to.y),.45);close(slope(r),-slope(inner[j+1]));close(r.to.x,inner[j+1].from.x);close(r.to.y,inner[j+1].from.y);}
   }
   const cone=ray(g,'acceptance-cone--1'),coneAngle=Math.atan(Math.abs(slope(cone)));close(deg(coneAngle),d.angle);
   close(Math.abs(Math.asin(incoming.y)),.8*acceptance);break;
  }
  case 'lens_power':case 'lenses_contact':{
   const power=g.id==='lens_power'?100/s.focal:s.power1+s.power2;
   for(const j of [0,1,2]){
    const a=ray(g,'incident-'+j),b=ray(g,'emergent-'+j);close(slope(a),0);close(slope(b),-power*a.to.y/100);
    if(power!==0)close(atX(b,100/power),0);
   }
   if(power===0){assert.equal(g.image.kind,'none');assert.equal(g.image.afocal,true);assert.equal(g.markers.filter(m=>m.type==='focus').length,0);assert.equal(g.values.focal,null);}
   else{
    const f=100/power;close(mark(g,'image-focus').x,f);assert.equal(g.image.kind,power>0?'real':'virtual');
    if(power<0)for(const j of [0,2]){const v=ray(g,'virtual-'+j);assert.equal(v.dashed,true);assert.ok(v.to.x<0);close(v.to.x,f);close(v.to.y,0);}
    else assert.equal(g.segments.filter(s=>s.role==='virtual').length,0);
   }
   if(g.id==='lenses_contact'){
    const a=element(g,'lens-1'),b=element(g,'lens-2');close(a.x,b.x);close(a.power,s.power1);close(b.power,s.power2);close(g.values.focal??0,d.focal??0);
    for(const j of [0,2]){const y=ray(g,'incident-'+j).to.y;assert.ok(Math.abs(y*s.power1/100)<=.131&&Math.abs(y*s.power2/100)<=.131,'Paraxial at each individual contact lens, including strong near-cancellation');}
   }else{close(power,d.power);close(s.focal/100,d.focus);}
   break;
  }
  case 'magnifier':{
   const object=mark(g,'object'),L=element(g,'lens');close(object.x,-s.focal);close(L.x,0);assert.equal(g.image.kind,'infinite');
   for(const j of [0,1,2]){const a=ray(g,'incident-'+j),b=ray(g,'emergent-'+j);close(slope(b),slope(a)-a.to.y/s.focal);close(slope(b),-object.height/s.focal);}
   close(25/s.focal,d.magnification);assert.equal(g.markers.some(m=>m.type==='image'),false);break;
  }
  case 'telescope':{
   const objective=element(g,'objective'),eye=element(g,'eyepiece'),image=mark(g,'intermediate');
   close(eye.x-objective.x,s.objective+s.eyepiece);close(image.x,s.objective);assert.equal(g.image.kind,'infinite');
   for(const j of [0,1,2]){
    const a=ray(g,'incident-'+j),b=ray(g,'objective-ray-'+j),c=ray(g,'ocular-ray-'+j),out=ray(g,'emergent-'+j);
    close(slope(b),slope(a)-a.to.y/s.objective);close(slope(b),slope(c));close(b.to.y,image.height);close(c.from.y,image.height);
    close(slope(out),slope(c)-c.to.y/s.eyepiece);close(slope(out)/slope(a),-s.objective/s.eyepiece);assert.ok(Math.abs(slope(a))<=.04+1e-10);assert.ok(Math.abs(slope(out))<=.04+1e-10);
   }
   close(eye.x,d.lengthNow);close(-s.objective/s.eyepiece,d.magnification);break;
  }
  case 'microscope':{
   const object=mark(g,'object'),intermediate=mark(g,'intermediate'),objective=element(g,'objective'),eye=element(g,'eyepiece'),u=-object.x,v=intermediate.x;
   close(1/u+1/v,1/s.objective);close(intermediate.height/object.height,-v/u);close(-v/u,-s.interval/s.objective);
   close(eye.x-v,s.eyepiece);close(v-s.objective,s.interval);close(eye.x,s.objective+s.interval+s.eyepiece);close(objective.x,0);
   assert.equal(g.image.kind,'infinite');assert.ok(intermediate.height<0&&object.height>0);
   for(const j of [0,1,2]){
    const a=ray(g,'incident-'+j),b=ray(g,'objective-ray-'+j),c=ray(g,'ocular-ray-'+j),out=ray(g,'emergent-'+j);
    close(slope(b),slope(a)-a.to.y/s.objective);close(slope(b),slope(c));close(b.to.y,intermediate.height);close(c.from.y,intermediate.height);
    close(slope(out),slope(c)-c.to.y/s.eyepiece);close(slope(out),-intermediate.height/s.eyepiece);
    assert.ok(Math.abs(slope(a))<.09&&Math.abs(slope(out))<.036,'Paraxial microscope angles, including expanded domain endpoints');
   }
   close(-intermediate.height/object.height,d.linear);close(25/s.eyepiece,d.ocular);close(Math.abs(intermediate.height/object.height)*25/s.eyepiece,d.magnification);break;
  }
  case 'pinhole':{
   const object=mark(g,'object'),image=mark(g,'image'),hole=element(g,'aperture'),screen=element(g,'screen');
   close(object.x,-s.distance);close(screen.x,s.screen);close(image.x,screen.x);close(image.height,-s.height*s.screen/s.distance);
   close(image.height*100,d.image);close(image.height/object.height,d.magnification);close(hole.x,0);assert.equal(g.image.kind,'real');
   for(const j of [0,1,2]){const a=ray(g,'incident-'+j),b=ray(g,'screen-ray-'+j);close(slope(a),slope(b));close(a.to.x,0);close(a.to.y,0);close(b.to.x,s.screen);}
   break;
  }
 }
}
let seed=20261026,states=0,segments=0;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const counts={};
for(const id of OPTICS_IDS){
 const e=experiments.find(e=>e.id===id);assert.ok(e,id+' catalog entry');
 const base=initialState(e),params=e.params.filter(p=>p.key!=='t');
 const samples=[base,...params.flatMap(p=>[p.min,p.max].map(n=>({...base,[p.key]:n})))];
 // Every domain corner, including simultaneous extremes, uses live public
 // domains after parameter-domain expansion (not original historical limits).
 for(let bits=0;bits<2**params.length;bits++)samples.push({...base,...Object.fromEntries(params.map((p,i)=>[p.key,bits&(1<<i)?p.max:p.min]))});
 for(let j=0;j<24;j++)samples.push({...base,...Object.fromEntries(params.map(p=>[p.key,p.min+random()*(p.max-p.min)]))});
 if(id==='lenses_contact')for(const pair of [[50,-50],[-50,50],[0,0],[-10,-10],[10,-10],[50,-49.5],[-50,49.5]])samples.push({...base,power1:pair[0],power2:pair[1]});
 if(id==='brewster')samples.push({...base,index:1.5,index1:1.5});
 if(id==='mirror_rotation')for(const rotation of [19,20,21,30])samples.push({...base,rotation});
 for(const input of samples){
  const s=Object.freeze({...input}),d=Object.freeze(evaluate(id,s)),before=JSON.stringify({s,d}),g=buildOpticsGeometry(id,s,d);
  assert.equal(JSON.stringify({s,d}),before,id+' immutable raw state/readouts');finiteTree(g);insideBounds(g);science(g,s,d);
  for(const readout of e.readouts){if(d[readout.key]===null)assert.equal(g.values[readout.key],null);else close(g.values[readout.key],d[readout.key]);}
  assert.ok(g.notes.length&&g.notes.every(n=>n.vi&&n.en),id+' explicit bilingual scope');
  assert.equal(g.axisY,['ray_slab','apparent_depth','brewster','mirror_rotation'].includes(id)?null:0);
  states++;segments+=g.segments.length;
 }
 counts[id]=samples.length;
}
assert.equal(OPTICS_IDS.length,11);assert.equal(buildOpticsGeometry('not-optics',{}),null);
// Preserve the scientific/session contracts protected by the preceding release.
const protectedFiles=JSON.parse(fs.readFileSync(new URL('./concept-preservation-v64.json',import.meta.url),'utf8'));
for(const [path,expected]of Object.entries(protectedFiles))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),expected,'Preserved equation/catalog/session source: '+path);

// Independent review of the retained renderer after its parameter-update
// refactor. Recover the actual arrow-cone tips: a correct marker declaration
// alone would not catch an old inverted quaternion or a stale pooled arrow.
const {buildOpticsModel}=await import('../dist/optics-scenes-v65.js');
const {V}=await import('../dist/geometry-kit.js');
let rendererFrames=0,actualArrowTips=0;
for(const id of OPTICS_IDS){
 const e=experiments.find(e=>e.id===id),base=initialState(e),params=e.params.filter(p=>p.key!=='t'),cases=[base];
 for(let bits=0;bits<2**params.length;bits++)cases.push({...base,...Object.fromEntries(params.map((p,i)=>[p.key,bits&(1<<i)?p.max:p.min]))});
 if(id==='lenses_contact')cases.push({...base,power1:-50,power2:49.5},{...base,power1:50,power2:-49.5},{...base,power1:0,power2:0});
 const model=buildOpticsModel(id,base,evaluate(id,base),{labels:false});
 for(const s of cases)model.update(s,evaluate(id,s),{switches:{labels:false}});
 const resources=new Map();model.group.traverse(n=>{if(n.geometry)resources.set(n.uuid,[n.geometry,n.material,n.geometry.attributes.position,n.geometry.attributes.lineDistance]);});
 for(let cycle=0;cycle<3;cycle++)for(const s of cases){
  const d=evaluate(id,s),before=JSON.stringify({s,d});model.update(s,d,{switches:{labels:false}});model.group.updateMatrixWorld(true);assert.equal(JSON.stringify({s,d}),before);
  const g=model.group.userData.opticsGeometry,projection=model.group.userData.opticsProjection;
  for(const m of g.markers){
   const part=model.group.getObjectByName('optics-marker-'+m.id);assert.equal(part.visible,true,id+' active current marker');
   if(!Number.isFinite(m.height)||Math.abs(m.height)<1e-12)continue;
   const arrow=part.children.find(n=>n.visible&&n.type==='ArrowHelper');assert.ok(arrow,id+' active object/image arrow');
   const tip=arrow.cone.getWorldPosition(V()),basePoint=arrow.getWorldPosition(V());
   close((tip.y-basePoint.y)/projection.scale,m.height);close(tip.x,basePoint.x);actualArrowTips++;
  }
  for(const s of g.segments){
   const part=model.group.getObjectByName('optics-ray-'+s.id);assert.equal(part.visible,true,id+' active current ray group');
   if(length(vector(s))*projection.scale<1e-8)continue;
   assert.ok(part.children.some(n=>n.visible&&(n.isMesh||n.isLine)),id+' current ray has a visible primitive');
  }
  model.group.traverse(n=>{
   if(!n.geometry)return;const old=resources.get(n.uuid);assert.ok(old,id+' bounded retained primitives after full-corner warmup');
   for(const [i,current]of [n.geometry,n.material,n.geometry.attributes.position,n.geometry.attributes.lineDistance].entries())assert.equal(current,old[i],id+' retained rendering resources');
  });rendererFrames++;
 }
 model.group.traverse(n=>{n.geometry?.dispose();for(const material of Array.isArray(n.material)?n.material:[n.material])material?.dispose();});
}
console.log('PASS optics science v65:',JSON.stringify({ids:OPTICS_IDS.length,states,physicalSegments:segments,counts,protectedSources:Object.keys(protectedFiles).length,rendererFrames,actualArrowTips,scope:'Independent analytical rays/readouts, actual retained-renderer arrow tips and resource identities; no browser pixels, hardware QA or 300-model scientific sign-off.'}));
