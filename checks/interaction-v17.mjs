import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {experiments,initialState,parameterDomainChanges} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';import {buildLabModel} from '../dist/scene3d.js';
import {rigParameters,parameterFromDrag,adjustParameter} from '../dist/learning.js';
import {graphFor} from '../dist/graphs.js';import {sweepStates,tableGraph,linearFit} from '../dist/analytics.js';
const {document,window}=parseHTML('<body/>');globalThis.document=document;window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});
let handles=0,precision=0,graphs=0;const failures=[];
for(const e of experiments){
 const state=initialState(e),config={mode:0,switches:{handles:true,labels:false}},model=buildLabModel(e.id,state,evaluate(e.id,state,config),{labels:false,interactive:true,config});
 try{const rig=model.group.children.find(g=>g.userData.isRig);assert.ok(rig,e.id+' rig exists');const knobs=rig.children.filter(g=>g.userData.param);const defs=rigParameters(e,config);assert.equal(knobs.length,defs.length);assert.equal(new Set(knobs.map(k=>k.userData.param)).size,knobs.length,e.id+' independent keys');
  for(let j=0;j<knobs.length;j++){const p=defs[j],before=knobs.map(k=>k.position.x),next={...state,[p.key]:p.max};config.dragKey=p.key;model.update(next,evaluate(e.id,next,config),config);for(let k=0;k<knobs.length;k++){assert.equal(knobs[k].userData.param,defs[k].key);if(k!==j)assert.equal(knobs[k].position.x,before[k],e.id+' other handle moved');}handles++;model.update(state,evaluate(e.id,state,config),config);}
  if(e.id==='electric'){model.update(state,evaluate(e.id,state,{...config,mode:1}),{...config,mode:1});assert.deepEqual(knobs.map(k=>k.userData.param),['q1','px']);}
  for(const p of e.params.filter(p=>p.key!=='t')){for(const x of [-2.6,0,2.6]){const q=parameterFromDrag(e,p.key,{x});assert.ok(q.value>=p.min&&q.value<=p.max);if(p.min>0)assert.ok(q.value>0,e.id+' '+p.key+' rounded to zero');}const start={...state,[p.key]:p.min};adjustParameter(e,start,p.key,1);assert.ok(start[p.key]>p.min,e.id+' '+p.key+' keyboard did not increment');precision++;}
  for(const p of e.params.filter(p=>p.key!=='t'))for(const value of [p.min,p.max]){const s={...state,[p.key]:value},g=graphFor(e,s,evaluate(e.id,s,config),config);assert.ok([g.xmin,g.xmax,g.ymin,g.ymax].every(Number.isFinite),e.id+' graph bounds');assert.ok(g.xmax>g.xmin&&g.ymax>g.ymin,e.id+' zero graph span');graphs++;}
 }catch(error){failures.push({id:e.id,error:String(error)});}finally{model.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});}
}
const tiny={params:[{key:'q',min:1e-12,max:9e-12}]};assert.deepEqual(sweepStates(tiny,{q:1e-12},'q',1e-12,9e-12,3).map(s=>s.q),[1e-12,5e-12,9e-12]);const data=tableGraph({headers:['x','y']},[{values:[1e-15,2e-15]},{values:[2e-15,4e-15]}]);assert.ok(data.xmax<1e-14&&data.ymax<1e-14);assert.equal(linearFit([[1e-15,2e-15],[2e-15,4e-15],[3e-15,6e-15]]).slope,2);
const expanded=parameterDomainChanges.filter(p=>p.action==='expand');assert.equal(expanded.length,629);assert.equal(new Set(expanded.map(p=>p.experiment)).size,270);
assert.deepEqual(failures,[]);console.log('PASS independent handles:',handles,'across all 300 labs;',precision,'parameter drag/keyboard paths;',graphs,'graphs at parameter bounds. 629 domains expanded in 270 labs. CPU geometry only.');
