import assert from 'node:assert/strict';
import {validateCupPose,sweepCupPose,cupCollisionShapes,COLLISION_GEOMETRY} from '../dist/l3/thermal-collision.js';
const state={vesselPlaced:true},angle=Math.PI/3;
assert.equal(validateCupPose({x:315,y:100},angle,state).valid,true,'Documented safe pour pose');
assert.equal(validateCupPose({x:430,y:150},angle,state).valid,false,'Spout-only valid but the rotated body reaches the right wall');
const badSpout={x:430+55*Math.cos(angle)+50*Math.sin(angle),y:150+55*Math.sin(angle)-50*Math.cos(angle)};
// The existing spout-only contract does not detect the actual bad body pose.
assert.ok(badSpout.x>486,'The body case also spills at this exact tilt; independently test spout-valid body collision below.');
const spoutBodyCase={x:300,y:112};
const validSpout={x:300+55*Math.cos(angle)+50*Math.sin(angle),y:112+55*Math.sin(angle)-50*Math.cos(angle)};
assert.ok(validSpout.x>=334&&validSpout.x<=486&&validSpout.y>=0&&validSpout.y<=156);
assert.deepEqual(validateCupPose(spoutBodyCase,angle,state),{valid:false,reason:'cup-vessel',component:'cup-body',obstacle:'vessel-left-rim'},'Literal spout-valid whole-body counterexample');
assert.equal(validateCupPose({x:410,y:130},angle,state).valid,true,'Do not fabricate contact: current hull fits through the open mouth at this pose');
assert.equal(validateCupPose({x:410,y:250},0,state).valid,true,'Empty interior is not a solid obstacle or invisible lid');
assert.equal(validateCupPose({x:350,y:180},0,{vesselPlaced:false}).valid,true,'An unplaced vessel is not an invisible obstacle');
assert.equal(validateCupPose({x:120,y:371},0,state).valid,true,'Upright cup is tangent to the table');
assert.equal(validateCupPose({x:120,y:371.001},0,state).reason,'cup-table');
assert.equal(validateCupPose({x:120,y:370},Math.atan2(.044,.059),state).reason,'cup-table','Rotation checks the whole body, not just anchor height');
assert.equal(validateCupPose({x:NaN,y:0},0,state).reason,'invalid-cup-pose');
assert.equal(validateCupPose({x:0,y:0},Infinity,state).reason,'invalid-cup-pose');
assert.equal(sweepCupPose({x:120,y:250},{x:650,y:250},0,state).valid,false,'Fast pointer movement cannot tunnel through both walls');
assert.equal(sweepCupPose({x:120,y:70},{x:650,y:70},0,state).valid,true,'A high path over the opening is permitted');
assert.equal(sweepCupPose({x:350,y:180},{x:120,y:100},0,state).reason,'invalid-cup-start','Legacy bad poses require explicit recovery, never an invented safe pose');
assert.equal(sweepCupPose({x:120,y:370},{x:120,y:370},{from:0,to:Math.PI/2},state).valid,false,'Rotation path can hit the table even when endpoint anchors do not move');

// An independent Sutherland-Hodgman polygon clipping oracle, rather than SAT.
// Literal world strips match the declared conservative slice (not a full 3D
// cylinder collision proof). Test the body separately; a spout can add rejection.
const strips=[[-.082,0,-.066,.188],[.086,0,.102,.188],[-.074,-.0005,.094,.0085],[-.081,.187,-.071,.197],[.091,.187,.101,.197]];
function clip(poly,[x0,y0,x1,y1]){
 for(const [axis,limit,sign]of [['x',x0,1],['x',x1,-1],['y',y0,1],['y',y1,-1]]){
  const out=[];
  for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],ia=sign*(a[axis]-limit)>=0,ib=sign*(b[axis]-limit)>=0;
   if(ia)out.push(a);
   if(ia!==ib){const t=(limit-a[axis])/(b[axis]-a[axis]);out.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}
  }
  poly=out;if(!poly.length)break;
 }
 return Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p.x*q.y-q.x*p.y;},0))/2;
}
let compared=0,bodyCollisions=0;
for(let x=240;x<=560;x+=8)for(let y=80;y<=420;y+=10)for(const a of [0,15,35,60,90].map(v=>v*Math.PI/180)){
 const independent=[[-.044,-.059],[.044,-.059],[.044,.059],[-.044,.059]].map(([u,v])=>({x:(x-400)/1000+u*Math.cos(a)+v*Math.sin(a),y:(348-y)/1000-u*Math.sin(a)+v*Math.cos(a)}));
 const area=Math.max(...strips.map(rect=>clip(independent,rect))),floor=Math.min(...independent.map(p=>p.y));
 const result=validateCupPose({x,y},a,state);
 if(area>1e-8||floor<-.082-1e-6){assert.equal(result.valid,false,'Independent clipping/body floor collision must be rejected');bodyCollisions++;}
 const source={x,y},before=JSON.stringify(source);cupCollisionShapes(source,a);assert.equal(JSON.stringify(source),before);compared++;
}
// Swept conservative envelopes must never miss a collision witnessed in a
// densely sampled translation/rotation path. Endpoints alone are insufficient.
let sweptCases=0;
for(const start of [{x:120,y:100},{x:120,y:250},{x:315,y:100},{x:650,y:200}])for(const end of [{x:650,y:250},{x:410,y:300},{x:315,y:100},{x:120,y:370}]){
 const result=sweepCupPose(start,end,{from:0,to:Math.PI/2},state);let witness=false;
 for(let k=0;k<=200;k++){const f=k/200,p={x:start.x+(end.x-start.x)*f,y:start.y+(end.y-start.y)*f};if(!validateCupPose(p,f*Math.PI/2,state).valid)witness=true;}
 if(witness)assert.equal(result.valid,false,'Sweep must cover sampled intermediate collision');sweptCases++;
}
assert.equal(COLLISION_GEOMETRY.floorWorldY,-.082);
console.log(JSON.stringify({status:'PASS',compared,bodyCollisions,sweptCases,spoutBodyCase,scope:'Conservative 2.5D body/spout envelopes and swept path; no changes to poses, thermal values or general 3D rigid-body claim.'}));
