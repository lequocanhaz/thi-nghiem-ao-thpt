import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {segmentDistance,nearestInstrument} from '../dist/l3/thermal-picking.js';
import {installInteractionCore} from '../dist/l3/interaction-core.js';
import {renderThermalStage,renderPilotShell,pickThermalTool} from '../dist/l3/thermal-view.js';
for(const t of[0,.1,.5,.9,1]){assert.equal(segmentDistance({x:10,y:200*t},{x:0,y:0},{x:0,y:200}),10);}
assert.equal(segmentDistance({x:3,y:4},{x:0,y:0},{x:0,y:0}),5);
const shafts=[{id:'stirrer',a:{x:0,y:0},b:{x:0,y:200}},{id:'probe',a:{x:15,y:0},b:{x:15,y:190}}];
assert.equal(nearestInstrument({x:0,y:100},shafts,'calorimeter').id,'stirrer');
assert.equal(nearestInstrument({x:15,y:100},shafts,'stirrer').id,'probe');
assert.equal(nearestInstrument({x:37.6,y:100},shafts,'probe'),null);
assert.equal(nearestInstrument({x:37.5,y:100},shafts,'calorimeter').id,'probe');
for(const activity of['solid','ice']){const{document}=parseHTML(renderThermalStage({activity}));assert.equal(document.querySelectorAll('.l3-svg-label').length,0);assert.ok(document.querySelector('#l3ProbeValue'));assert.ok(document.querySelector('#l3ScaleValue'));assert.equal(document.querySelector('#l3-stirrer').getAttribute('aria-label'),'Que khuấy');}
const {document,window}=parseHTML('<svg><g id="vessel" data-l3-target="calorimeter"><rect id="covered"/></g><g id="rod" data-l3-target="stirrer"/></svg>');const stage=document.querySelector('svg'),rod=document.querySelector('#rod');stage.getBoundingClientRect=()=>({left:0,top:0,width:800,height:480});rod.focus=()=>{};let capture=false;rod.setPointerCapture=()=>capture=true;rod.hasPointerCapture=()=>capture;rod.releasePointerCapture=()=>capture=false;
const positions={stirrer:{x:410,y:310},calorimeter:{x:410,y:260}};let dropped=0;const core=installInteractionCore(stage,{positions,pickTarget:()=>rod,getSelected:()=> 'calorimeter',onMove:(id,p)=>positions[id]=p,onDrop:()=>dropped++,onStir:()=>{},onRotate:()=>{},onActivate:()=>{}});function dispatch(type,x,y){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,isPrimary:true,button:0,pointerId:1});document.querySelector('#covered').dispatchEvent(e);}dispatch('pointerdown',410,310);dispatch('pointermove',420,310);dispatch('pointerup',420,310);assert.equal(positions.stirrer.x,420);assert.equal(positions.calorimeter.x,410);assert.equal(dropped,1);assert.equal(capture,false);core.destroy();
console.log('PASS v88 picking: whole-shaft distance/touch bounds, nearest tool over selected container, pointer lifecycle, label-free stage with accessible tools and measured displays.');
