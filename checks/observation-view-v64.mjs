import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {buildLabModel} from '../dist/scene3d.js';
import {readObservation,relationPaths,updateObservation} from '../dist/observation-view.js';
const {document,window}=parseHTML('<html><body><section id="observation"></section></body></html>');
Object.assign(globalThis,{document,window,matchMedia:()=>({matches:false})});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},fillText(){},measureText:s=>({width:s.length*14})});
const host=document.querySelector('section');Object.defineProperty(host,'clientWidth',{value:360});
let observed=0;
for(const e of experiments){
 const state=initialState(e),model=buildLabModel(e.id,state,evaluate(e.id,state),{labels:false});
 const data=readObservation(model.group,e.id);
 updateObservation(host,model.group,e.id);
 if(data){
  observed++;assert.ok(!host.hidden);if(data.current?.every(Number.isFinite)&&data.current[0]>=data.xmin&&data.current[0]<=data.xmax&&data.current[1]>=data.ymin&&data.current[1]<=data.ymax)assert.equal(host.querySelector('.observation-current').hasAttribute('hidden'),false,'Actual current point must be visible');assert.ok(host.querySelector('svg[role="img"] title').textContent);
  assert.ok(host.querySelectorAll('th[scope="col"]').length===2,'Numerical alternative for theoretical curve');
  assert.ok(host.querySelector('.observation-note').textContent.includes('không phải các điểm đo'));
  assert.ok(!/NaN|undefined|Infinity/.test(host.innerHTML));
  const curve=host.querySelector('.observation-curve');updateObservation(host,model.group,e.id);
  assert.equal(host.querySelector('.observation-curve'),curve,'Keep SVG and focusable disclosure when current state is unchanged');
  updateObservation(host,model.group,e.id,'en-US');assert.match(host.querySelector('summary').textContent,/Observe/);
 }else if(model.group.userData.opticsObservation){assert.ok(!host.hidden);assert.ok(host.querySelector('.optics-notes li'));}else assert.ok(host.hidden);
 model.group.traverse(n=>{n.geometry?.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material]){m?.map?.dispose();m?.dispose();}});
}
assert.equal(readObservation(buildLabModel('vector_sum',initialState(experiments.find(e=>e.id==='vector_sum')),evaluate('vector_sum',initialState(experiments.find(e=>e.id==='vector_sum'))),{labels:false}).group,'vector_sum').kind,'continuous','A one-degree input step does not make the physical angle discrete');
assert.equal(observed,95,'Four core, thirty discovery and sixty-one foundation relations');
const points=[[0,0],[1,1],null,[2,4],[3,null],[4,16]];
const paths=relationPaths(points,p=>p);
assert.equal((paths.path.match(/M/g)||[]).length,3,'Never connect across missing or singular model outputs');
const discrete=relationPaths([[0,0],[1,1]],p=>p,true);
assert.equal(discrete.path,'');assert.equal((discrete.circles.match(/<circle/g)||[]).length,2,'Integer states are separate points');
console.log('PASS observation view v64: 95 readable accessible relations outside model bounds, VI/EN, stable SVG/disclosure, numerical tables, no curves across singular states, discrete predictions and no changes to measured rows.');
