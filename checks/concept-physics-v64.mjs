import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {buildLabModel} from '../dist/scene3d.js';
import {coreConceptIDs} from '../dist/concept-scenes.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration} from '../dist/models.js';

const {document,window}=parseHTML('<body></body>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},arc(){},moveTo(){},lineTo(){},closePath(){},setLineDash(){},setTransform(){},measureText:s=>({width:s.length*15})});
const close=(actual,expected,rtol=2e-5,atol=2e-6)=>assert.ok(Math.abs(actual-expected)<=atol+rtol*Math.abs(expected),`${actual} != ${expected}`);
const options={labels:false,interactive:false,thumbnail:true};
let seed=20261027,states=0,curveVertices=0,componentCases=0;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),quaternion=new T.Quaternion();
function finite(model){
 model.group.traverse(node=>{
  assert.ok([...node.position.toArray(),...node.scale.toArray(),...node.quaternion.toArray()].every(Number.isFinite),'Finite scene transform '+node.name);
  const vertices=node.geometry?.attributes.position?.array;
  if(vertices)assert.ok(vertices.every(Number.isFinite),'Finite scene vertices '+node.name);
 });
}
function dispose(model){model.group.traverse(node=>{node.geometry?.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material]){material?.map?.dispose();material?.dispose();}if(node.isInstancedMesh)node.dispose();});}
function plotLaw(id,s,c){
 if(id==='ohm')return u=>u/s.r;
 if(id==='capacitor'){const tau=(s.r*1000)*(s.c*1e-6);return t=>s.u*(c.capMode==='discharge'?Math.exp(-t/tau):1-Math.exp(-t/tau));}
 if(id==='boyle')return v=>600/v;
 if(id==='gas')return t=>s.n*8.314462618*t/s.v;
 return null;
}
for(const id of coreConceptIDs){
 const experiment=experiments.find(e=>e.id===id),base={...initialState(experiment),t:0};
 const samples=[base,...experiment.params.flatMap(p=>[p.min,p.max].map(value=>({...base,[p.key]:value})))];
 for(let i=0;i<24;i++)samples.push({...base,...Object.fromEntries(experiment.params.map(p=>[p.key,p.min+(p.max-p.min)*random()]))});
 if(id==='capacitor')samples.push({...base,r:.1,c:10,t:.1}); // historical URL: t can exceed 5 RC
 const configs=id==='electric'?[0,1,2,3].map(mode=>({mode})):id==='capacitor'?[{capMode:'charge'},{capMode:'discharge'}]:[{}];
 for(const mode of configs){
  const config={...mode,switches:{components:true,resultant:true,vectors:true,trajectory:true,lines:true}};
  const model=buildLabModel(id,base,evaluate(id,base,config),{...options,config});
  assert.equal(model.group.getObjectByName('concept-observation')?.userData.experiment,id);
  const chart=model.group.getObjectByName(`concept-${id}-plot`),curve=model.group.getObjectByName(`concept-${id}-curve`);
  const originalBuffer=curve?.geometry.attributes.position.array;
  for(const s of samples){
   const d=evaluate(id,s,config),before=JSON.stringify({s,d});
   model.update(s,d,config);model.group.updateMatrixWorld(true);finite(model);
   assert.equal(JSON.stringify({s,d}),before,'Concept display cannot mutate model inputs or measurements');
   if(chart&&d){
    const law=plotLaw(id,s,config),axes=chart.userData.axes,vertices=curve.geometry.attributes.position;
    assert.equal(chart.visible,false,'Theory relation is displayed outside the apparatus to avoid labels obscuring the model');
    assert.equal(vertices.array,originalBuffer,'Keep plot vertex buffer during observation');
    // Recover each plotted physical point from actual Float32 geometry, then
    // compare with a separate analytical law. Do not trust curve.userData.data.
    for(let i=0;i<vertices.count;i++){
     const x=axes.xmin+vertices.getX(i)/2.6*(axes.xmax-axes.xmin);
     const y=axes.ymin+vertices.getY(i)/.85*(axes.ymax-axes.ymin);
     close(y,law(x),3e-5,Math.max(1e-9,axes.ymax*2e-6));curveVertices++;
    }
    const point=model.group.getObjectByName(`concept-${id}-point`);
    const x=axes.xmin+point.position.x/2.6*(axes.xmax-axes.xmin);
    const y=axes.ymin+point.position.y/.85*(axes.ymax-axes.ymin);
    const expectedX=id==='ohm'?s.u:id==='capacitor'?s.t:id==='boyle'?s.v:s.tK;
    close(x,expectedX,1e-10,1e-9);close(y,law(expectedX),1e-9,1e-9);
    if(id==='gas'||id==='boyle'){
     const instances=model.group.getObjectByName(id==='gas'?'gas-particles':'boyle-particles'),observer=model.group.getObjectByName(`concept-${id}-observer`);
     instances.getMatrixAt(0,matrix);matrix.decompose(position,quaternion,scale);
     assert.ok(observer.position.distanceTo(position)<1e-10);assert.ok(observer.scale.distanceTo(scale)<1e-10,'Observation mark keeps the actual particle radius');
    }
    if(id==='capacitor'){
     const arrow=model.group.getObjectByName('concept-capacitor-current'),expected=s.u/(s.r*1000)*Math.exp(-s.t/(s.r*s.c*.001))*(config.capMode==='discharge'?-1:1);
     close(arrow.userData.physicalVector[0],expected,1e-8,1e-11);
     if(arrow.visible){const direction=new T.Vector3(0,1,0).applyQuaternion(arrow.quaternion);assert.equal(Math.sign(direction.x),Math.sign(expected));}
    }
   }else if(id==='oscillation'){
    close(model.group.getObjectByName('concept-oscillation-turn--1').position.x,-Math.abs(s.a)*.12);
    close(model.group.getObjectByName('concept-oscillation-turn-1').position.x,Math.abs(s.a)*.12);
   }else if(id==='wave'){
    const lambda=s.speed/s.f,u=s.a*Math.cos(2*Math.PI*(s.f*s.t-2/lambda));
    const arrow=model.group.getObjectByName('concept-wave-displacement'),guide=model.group.getObjectByName('concept-wave-fixed-particle'),bracket=model.group.getObjectByName('concept-wave-wavelength');
    close(arrow.userData.physicalVector[1],u,1e-9,1e-8);assert.equal(arrow.userData.physicalVector[0],0);assert.equal(guide.userData.fixedMaterialCoordinate,2);
    assert.equal(bracket.visible,lambda<=6);
    if(bracket.visible)close(bracket.geometry.attributes.position.getX(2)-bracket.geometry.attributes.position.getX(1),lambda);
    let particle;model.group.traverse(node=>{if(node.userData.drag==='wave-amplitude')particle=node;});
    close(particle.position.x,-1);close(particle.position.y,1.3+.7*u);
   }else if(id==='energy'){
    const arrow=model.group.getObjectByName('concept-energy-gravity'),velocity=model.group.getObjectByName('concept-energy-velocity');
    assert.deepEqual(arrow.userData.physicalVector,[0,-9.81,0]);
    const time=Math.min(s.t,Math.sqrt(2*s.h0/9.81));close(velocity.userData.physicalVector[1],-9.81*time);
   }else if(id==='electric'){
    for(const key of config.mode===1?['q1']:['q1','q2']){
     const mark=model.group.getObjectByName('concept-electric-sign-'+key);
     assert.equal(mark.getObjectByName('charge-sign-vertical').visible,s[key]>0);
     assert.equal(mark.getObjectByName('charge-sign-zero').visible,s[key]===0);componentCases++;
    }
   }
   states++;
  }
  if(chart){
   const s={...base,t:0},d=evaluate(id,s,config);model.update(s,d,config);
   const revisions=chart.userData.curveRevisions,t=id==='capacitor'?s.r*s.c*.001*.5:.01,next={...s,t};
   model.update(next,evaluate(id,next,config),config);
   assert.equal(chart.userData.curveRevisions,revisions,'Changing time moves only the current point, not the parameter-defined curve');
  }
  dispose(model);
 }
}

// All 300 get a finite default/start/middle/end scene audit, regardless of which
// IDs were redesigned. This is geometry coverage, not scientific certification.
assert.equal(experiments.length,300);assert.equal(new Set(experiments.map(e=>e.id)).size,300);
const audit=[];
for(const experiment of experiments){
 const s={...initialState(experiment),t:0},d=evaluate(experiment.id,s),model=buildLabModel(experiment.id,s,d,options),end=duration(experiment,s,d);
 let frames=0;
 for(const t of [0,end/2,end]){const state={...s,t},data=evaluate(experiment.id,state),before=JSON.stringify({state,data});model.update(state,data,{});finite(model);assert.equal(JSON.stringify({state,data}),before);frames++;}
 audit.push({id:experiment.id,title:experiment.title,grade:experiment.grade,topic:experiment.topic,implementation:experiment.expanded?'expansion':experiment.atlas?'atlas':'base',curricularFlag:experiment.extra===true?'extension':'foundation',parameterCount:experiment.params.filter(p=>p.key!=='t').length,observationFrames:frames,baseConceptRedesign:coreConceptIDs.includes(experiment.id),scope:'Finite CPU geometry at three time states; not a visual/scientific sign-off'});
 dispose(model);
}
if(process.argv.includes('--write')){fs.mkdirSync(new URL('../work/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('../work/concept-audit-v64.json',import.meta.url),JSON.stringify({coreConceptIDs,states,curveVertices,componentCases,audit},null,2)+'\n');}
console.log('PASS v64 core observations:',JSON.stringify({ids:coreConceptIDs.length,states,curveVertices,componentCases,catalog:300,catalogFrames:audit.reduce((n,e)=>n+e.observationFrames,0),scope:'Independent analytical curve/point checks and actual mesh geometry; no browser pixels, teacher approval or 300-model redesign claim.'}));
