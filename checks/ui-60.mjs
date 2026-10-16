import {guideClips,readoutClips,previewClips} from '../dist/voice-recordings.js';
import * as workspace from '../dist/workspace.js';
import {fitModels,fitSummary,reportMarkup} from '../dist/research.js';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {experiments,initialState,electricModes} from '../dist/experiments.js';
import {evaluate,duration,clampState} from '../dist/models.js';
import {meters,tableValues} from '../dist/measurements.js';
import {graphFor} from '../dist/graphs.js';
import {sources,sourceChecked} from '../dist/sources.js';
import {themeFor,paths,coreParams,parameterFromDrag,adjustParameter,usableParams} from '../dist/learning.js';
import {homeMarkup,cardsMarkup,labMarkup,discoveryMarkup,coachMarkup} from '../dist/views.js';
import {tableGraph,sweepStates,segments,graphParameter,tableColumnFor} from '../dist/analytics.js';
import {Narrator,Tone} from '../dist/media.js';
const nodes=new Map(),events=new Map(),frames=[],stored={};
function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',value:'',hidden:false,dataset:{},parentElement:{dataset:{}},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},setAttribute(){},scrollIntoView(){},showModal(){this.open=true},close(){this.open=false},click(){},appendChild(){},prepend(){},append(){},after(){},remove(){},addEventListener(type,fn){events.set(selector+':'+type,fn);}});return nodes.get(selector);}
class Stage{constructor(drag){this.drag=drag}quality(){}mount(n){this.node=n}update(id,s,d,c){this.id=id;this.s={...s};this.d=d;this.c=c;}view(){}zoom(){}dispose(){}capture(){return 'data:image/png;base64,'}}
class BannerScene {constructor(container,{motion=true,onError=()=>{}}={}){this.container=container;this.motion=motion;}setMotion(v){this.motion=v;}setSpread(v){this.spread=v;}setScroll(v){this.scroll=v;}setQuality(v){this.quality=v;}dispose(){this.disposed=true;}}
const sandbox={BannerScene,guideClips,readoutClips,previewClips,SoftwareScene:class extends Stage{constructor(...args){super(...args);this.isSoftware=true;}},fitModels,fitSummary,reportMarkup,experiments,initialState,electricModes,themeFor,paths,coreParams,parameterFromDrag,adjustParameter,usableParams,homeMarkup,cardsMarkup,labMarkup,discoveryMarkup,coachMarkup,tableGraph,sweepStates,segments,graphParameter,tableColumnFor,evaluate,duration,clampState,meters,tableValues,graphFor,sources,sourceChecked,Narrator,Tone,URLSearchParams,navigator:{clipboard:{writeText:async()=>{}}},LabScene:Stage,observeThumbnails(){},stopThumbnails(){},console,Number,Math,JSON,Object,Array,String,Map,Set,Blob,URL,structuredClone,setTimeout,clearTimeout,requestAnimationFrame(fn){frames.push(fn);return frames.length},document:{querySelector:node,querySelectorAll:()=>[],documentElement:node('html'),body:node('body'),createElement:()=>node('created'),addEventListener(type,fn){events.set('document:'+type,fn);}},localStorage:{getItem:key=>stored[key]||null,setItem:(k,v)=>stored[k]=v},window:{scrollTo(){},addEventListener(){}},location:{hash:'',href:'https://lab.example/'},matchMedia:()=>({matches:false})};
Object.assign(sandbox,workspace);vm.createContext(sandbox);let source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/gm,'');vm.runInContext(source,sandbox);
assert.equal((node('#cards').innerHTML.match(/class="experiment-card"/g)||[]).length,24);
vm.runInContext("grade='11';renderCards()",sandbox);assert.equal((node('#cards').innerHTML.match(/class="experiment-card"/g)||[]).length,Math.min(24,experiments.filter(e=>e.grade===11).length));
vm.runInContext("grade='all';search='nem ngang';renderCards()",sandbox);assert.equal((node('#cards').innerHTML.match(/class="experiment-card"/g)||[]).length,1);
for(let i=0;i<experiments.length;i++){
 vm.runInContext(`mode='measure';renderLab(experiments[${i}]);rows=[];state.t=0;record()`,sandbox);const id=experiments[i].id;
 assert.equal(vm.runInContext('rows[0].values.length',sandbox),experiments[i].headers.length);
 assert.equal(vm.runInContext('viewer.id',sandbox),id);
 assert.ok(!/NaN|undefined|Infinity/.test(node('#graph').innerHTML),id+' graph markup');
 assert.ok(node('#rows').innerHTML.includes('<tr '));
 for(const p of ['tasks','theory','sources']){vm.runInContext(`panel='${p}';renderPanel()`,sandbox);assert.ok(node('#panel').innerHTML.length>70);}
 assert.ok(node('#panel').innerHTML.includes(sources[id][0].url));
 console.log('PASS',id,'workspace, controls, measures, recording, chart and source panels');
}
vm.runInContext('renderLab(experiments.find(e=>e.id==="electric"));state.z1=-.1;state.z2=.1;state.pz=.15',sandbox);for(let mode=0;mode<4;mode++){vm.runInContext(`config.mode=${mode};refresh()`,sandbox);assert.ok(Number.isFinite(vm.runInContext('getData().magnitude',sandbox)));}
vm.runInContext('viewer.drag("p",{x:.12,y:-.08,z:0})',sandbox);frames.pop()(0);assert.equal(vm.runInContext('state.px',sandbox),.12);assert.equal(vm.runInContext('state.py',sandbox),-.08);
vm.runInContext('config.switches.resultant=false;refresh();config.switches.resultant=true;refresh()',sandbox);assert.equal(vm.runInContext('viewer.c.switches.resultant',sandbox),true);
vm.runInContext('renderLab(experiments.find(e=>e.id==="ohm"));rows=[];state.u=0;record();state.u=6;record();download=(text,name,type)=>{globalThis.exported={text,name,type}};exportCSV()',sandbox);assert.ok(sandbox.exported.text.startsWith('\ufeff'));assert.ok(sandbox.exported.text.includes('"0","10","0","","0"'));
vm.runInContext('save()',sandbox);const session=JSON.parse(stored['thpt-lab-v1']);assert.equal(session.ohm.rows.length,2);
console.log('PASS filter/search, four electric modes, drag callback, vector recovery, CSV and persistence.');
node('#notes').dataset.notesFor='ohm';node('#notes').value='U tăng thì I tăng khi R không đổi.';vm.runInContext('save();renderLab(experiments.find(e=>e.id==="energy"))',sandbox);const after=JSON.parse(stored['thpt-lab-v1']);assert.ok(after.ohm.notes.includes('R không đổi'));assert.ok(!after.energy.notes.includes('R không đổi'));
vm.runInContext('renderLab(experiments.find(e=>e.id==="ohm"))',sandbox);const click=(dataset)=>events.get('document:click')({target:{closest:selector=>selector==='button'?{dataset}:null}});
await click({action:'undo'});assert.equal(vm.runInContext('rows.length',sandbox),1);
await click({action:'clear'});assert.equal(vm.runInContext('rows.length',sandbox),0);
const change=events.get('document:change');await change({target:{id:'preset',value:'1',dataset:{}}});assert.equal(vm.runInContext('state.u',sandbox),experiments.find(e=>e.id==='ohm').presets[1].values.u);
const valid={schema:'thpt.session.v1',id:'ohm',state:{u:3,r:10,t:0},config:{mode:0,capMode:'charge'},notes:'Ghi chép từ phiên nhập',rows:[{values:[3,10,.3,10,.9],s:{u:3,r:10,t:0},d:{u:3,r:10,i:.3,p:.9},c:{mode:0,capMode:'charge'}}]};await change({target:{id:'sessionFile',dataset:{},files:[{size:500,text:async()=>JSON.stringify(valid)}]}});assert.equal(vm.runInContext('rows.length',sandbox),1);assert.equal(vm.runInContext('state.u',sandbox),3);assert.ok(JSON.parse(stored['thpt-lab-v1']).ohm.notes.includes('phiên nhập'));
const invalid={...valid,id:'projectile'};await change({target:{id:'sessionFile',dataset:{},files:[{size:500,text:async()=>JSON.stringify(invalid)}]}});assert.equal(vm.runInContext('active.id',sandbox),'ohm');assert.equal(vm.runInContext('state.u',sandbox),3);assert.ok(node('#toast').textContent.includes('không hợp lệ'));
console.log('PASS separate notes per experiment, undo/clear, presets, session import, and rejection of a different experiment’s session.');
// New controls must change measured results, retain data and keep observations isolated.
for(const e of experiments){sandbox.targetId=e.id;sandbox.targetKey=coreParams(e)[0].key;vm.runInContext('renderLab(experiments.find(e=>e.id===targetId));viewer.drag("param:"+targetKey,{x:2.6,y:0,z:2})',sandbox);frames.pop()(0);assert.equal(vm.runInContext('state[targetKey]',sandbox),e.params.find(p=>p.key===sandbox.targetKey).max,e.id+' drag updates parameter');vm.runInContext('adjustSelected(-1)',sandbox);assert.ok(vm.runInContext('state[targetKey]',sandbox)<e.params.find(p=>p.key===sandbox.targetKey).max,e.id+' non-drag alternative');}
vm.runInContext('mode="measure";renderLab(experiments.find(e=>e.id==="ohm"));rows=[];state.u=6;state.r=10;config.graphMode="model"',sandbox);
await click({action:'pin'});vm.runInContext('changeState("u",12)',sandbox);assert.equal(vm.runInContext('pinned.state.u',sandbox),6);assert.equal(vm.runInContext('state.u',sandbox),12);assert.ok(node('#comparison').innerHTML.includes('0,600'));assert.ok(node('#graph').innerHTML.includes('stroke-dasharray'));
await click({action:'swap-pin'});assert.equal(vm.runInContext('state.u',sandbox),6);assert.equal(vm.runInContext('pinned.state.u',sandbox),12);
await click({action:'restore-pin'});assert.equal(vm.runInContext('state.u',sandbox),12);
node('#sweepKey').value='u';node('#sweepStart').value=0;node('#sweepEnd').value=6;node('#sweepCount').value=10;
await click({action:'run-sweep'});assert.equal(vm.runInContext('rows.length',sandbox),10);assert.equal(vm.runInContext('config.graphMode',sandbox),'measured');assert.equal(vm.runInContext('config.graphX',sandbox),0);assert.equal(vm.runInContext('config.graphY',sandbox),2);assert.ok(vm.runInContext('rows.every(r=>r.s.r===10)',sandbox));
await change({target:{id:'fitLine',checked:true,dataset:{}}});assert.ok(node('#fitResult').innerHTML.includes('R²'));assert.ok(node('#fitResult').innerHTML.includes('RMSE'));assert.ok(Math.abs(vm.runInContext('tableGraph(active,rows,config.graphX,config.graphY,true).regression.slope',sandbox)-.1)<1e-12);
await click({row:'0'});assert.equal(vm.runInContext('state.u',sandbox),0);assert.equal(vm.runInContext('rows.length',sandbox),10);
node('#sweepStart').value=-1;await click({action:'run-sweep'});assert.equal(vm.runInContext('rows.length',sandbox),10);assert.ok(node('#toast').textContent.includes('giới hạn'));
await change({target:{id:'',checked:true,dataset:{progress:'0'}}});assert.equal(JSON.parse(stored['thpt-ui-v3']).progress.ohm[0],true);
vm.runInContext('panel="discover";renderPanel()',sandbox);node('#prediction').dataset.notesFor='ohm';node('#prediction').value='Điện trở không đổi';vm.runInContext('save();renderLab(experiments.find(e=>e.id==="freefall"))',sandbox);assert.equal(JSON.parse(stored['thpt-lab-v1']).ohm.prediction,'Điện trở không đổi');assert.notEqual(JSON.parse(stored['thpt-lab-v1']).freefall.prediction,'Điện trở không đổi');
vm.runInContext('pathFilter=0;grade="all";topic="all";search="";filter="all";renderHome()',sandbox);assert.equal((node('#cards').innerHTML.match(/class="experiment-card"/g)||[]).length,5);
vm.runInContext('location.hash="#lab/ohm?"+new URLSearchParams({s:JSON.stringify({state:{u:4,r:8},mode:0,capMode:"charge"})});route()',sandbox);assert.equal(vm.runInContext('state.u',sandbox),4);assert.equal(vm.runInContext('state.r',sandbox),8);
console.log('PASS all 300 direct parameter callbacks and button alternatives, snapshot A/B, sweep isolation, regression, row restoration, invalid sweep rejection, progress, predictions and shared settings.');
vm.runInContext('renderLab(experiments.find(e=>e.id==="ohm"));state.u=6;selectParam("source-voltage");viewer.drag("source-voltage",{x:-1.8,y:.43,z:.14})',sandbox);frames.pop()(0);assert.equal(vm.runInContext('state.u',sandbox),9);assert.equal(vm.runInContext('config.dragKey',sandbox),'u');
vm.runInContext('state.u=6;selectParam("source-voltage-fine");viewer.drag("source-voltage-fine",{x:-1.36,y:.43,z:.14})',sandbox);frames.pop()(0);assert.equal(vm.runInContext('state.u',sandbox),6.5);
console.log('PASS physical source coarse/fine voltage knob callbacks and parameter selection.');
for(const [id,key]of [['voltage_divider','voltage'],['kirchhoff_loop','source1'],['battery_series','emf']]){sandbox.sourceId=id;sandbox.sourceKey=key;vm.runInContext('renderLab(experiments.find(e=>e.id===sourceId));selectParam("source-voltage");globalThis.startVoltage=state[sourceKey];viewer.drag("source-voltage",{x:-2.6,y:.4,z:.49})',sandbox);frames.pop()(0);const expected=vm.runInContext('Math.min(active.params.find(p=>p.key===sourceKey).max,startVoltage+.6)',sandbox);assert.ok(Math.abs(vm.runInContext('state[sourceKey]',sandbox)-expected)<1e-9);assert.equal(vm.runInContext('config.dragKey',sandbox),key);}
console.log('PASS source knobs choose voltage/emf/source1 correctly in all new circuit families.');
