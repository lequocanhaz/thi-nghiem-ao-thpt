import assert from 'node:assert/strict';
import {resolveTranslation,resolveRotation} from '../dist/l3/thermal-motion.js';
import {sweepCupPose,validateCupPose,sweepToolPose} from '../dist/l3/thermal-spatial.js';
import {createState} from '../dist/l3/thermal-physics.js';
const s=createState('ice');s.vesselPlaced=true;const sweep=(a,b)=>sweepCupPose(a,b,0,s);
const from={x:300,y:250},to={x:350,y:250};assert.ok(sweep(from,from).valid);assert.ok(!sweep(from,to).valid);
const r=resolveTranslation(from,to,sweep);assert.ok(r.contact);assert.ok(r.position.x>300.5&&r.position.x<350);assert.ok(validateCupPose(r.position,0,s).valid);let last=from;for(const p of r.path){assert.ok(sweep(last,p).valid);last=p;}
// Contact preserves tangent motion; never tunnels across the cylinder or bench.
for(const p of [{x:500,y:250},{x:350,y:100},{x:300,y:450},{x:50,y:250}]){const move=resolveTranslation(r.position,p,sweep);assert.ok(validateCupPose(move.position,0,s).valid);let prior=r.position;for(const q of move.path){assert.ok(sweep(prior,q).valid);prior=q;}}
const invalid={x:374,y:130};const frozen=resolveTranslation(invalid,{x:120,y:130},(a,b)=>sweepCupPose(a,b,Math.PI/3,s));assert.deepEqual(frozen.position,invalid);assert.equal(frozen.reason,'invalid-start');
const rot=resolveRotation(0,Math.PI/2,(a,b)=>sweepCupPose({x:360,y:115},{x:360,y:115},{from:a,to:b},s));assert.ok(rot.angle>=0&&rot.angle<=Math.PI/2);assert.ok(sweepCupPose({x:360,y:115},{x:360,y:115},{from:0,to:rot.angle},s).valid);
for(const id of ['ice','stirrer','probe']){const a=id==='ice'?{x:570,y:306.9}:{x:410,y:270},b={x:500,y:400},fn=(p,q)=>sweepToolPose(id,p,q,s,.01);if(fn(a,a).valid){const move=resolveTranslation(a,b,fn);let prev=a;for(const p of move.path){assert.ok(fn(prev,p).valid);prev=p;}}}
console.log('PASS v89 contact motion: valid prefix and one tangent leg, no wall/floor tunnelling, invalid saved poses retained and rotation constrained by the same sweep.');
// The input lifecycle suspends persistence for BOTH pointer renderers.
const {parseHTML}=await import('linkedom');const{installInteractionCore}=await import('../dist/l3/interaction-core.js');
const {window,document}=parseHTML('<svg><g data-l3-target="cup"><rect id="hit"/></g></svg>'),stage=document.querySelector('svg'),hit=document.querySelector('#hit'),tool=hit.parentNode;
stage.getBoundingClientRect=()=>({left:0,top:0,width:800,height:480});tool.focus=()=>{};let captured=false;tool.setPointerCapture=()=>captured=true;tool.hasPointerCapture=()=>captured;tool.releasePointerCapture=()=>captured=false;const phases=[],positions={cup:{x:100,y:100}};
const core=installInteractionCore(stage,{positions,onMove:(id,p)=>positions[id]=p,onDrop:()=>{},onCancel:()=>{},onRotate:()=>{},onActivate:()=>{},onStir:()=>{},onInteractionState:v=>phases.push(v)});
function send(type,x=100,y=100){const e=new window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{isPrimary:true,button:0,pointerId:1,clientX:x,clientY:y});hit.dispatchEvent(e);}send('pointerdown');send('pointermove',120,100);send('pointerup',120,100);assert.deepEqual(phases,[true,false]);phases.length=0;send('pointerdown',120,100);send('pointercancel',120,100);assert.deepEqual(phases,[true,false]);core.destroy();
console.log('PASS v89 interaction persistence lifecycle: start/end and cancel signals are paired in the real2D controller.');
