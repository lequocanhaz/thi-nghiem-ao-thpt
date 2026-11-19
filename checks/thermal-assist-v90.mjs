import assert from 'node:assert/strict';
import {planThermalPlacement,planThermalStir,planAssistedStir} from '../dist/l3/thermal-assist.js';
import {createState,applyAction,validateState,totalMassKg,totalEnergyJ} from '../dist/l3/thermal-physics.js';
import {initialPositions,probePlacementAt,pourTargetAt,cupSpoutAt} from '../dist/l3/thermal-apparatus.js';
import {sweepCupPose,sweepToolPose} from '../dist/l3/thermal-spatial.js';
let assertions=0;
const ok=(v,m)=>{assert.ok(v,m);assertions++;},equal=(a,b,m)=>{assert.deepEqual(a,b,m);assertions++;};
function action(state,actionType,payloadSI){const r=applyAction(state,{actionType,payloadSI});ok(r.ok,actionType+': '+r.reason);ok(validateState(r.state).valid,'accepted state validates');return r.state;}
function setup(activity='ice',config={},fillKg=0,placed=true){let state={...createState(activity,{iceMassKg:.1,...config}),apparatusGeometryVersion:'thermal.geometry.v2'};if(placed)state=action(state,'place-vessel',{placed:true});if(fillKg)state=action(state,'pour',{massKg:fillKg,target:'vessel'});return{state,positions:initialPositions(state,.01),angle:0,pieceMassKg:.01};}
function plan(id,target,ctx,expected=true){const before=structuredClone(ctx),result=planThermalPlacement(id,target,ctx);equal(ctx,before,'planning is read only');equal(result.valid,expected,id+' / '+target);if(!expected){equal(result.path,[],'rejected plans have no partially executable path');return result;}
 let from=ctx.positions[id];for(const to of result.path){const sweep=id==='cup'?sweepCupPose(from,to,ctx.angle,ctx.state):sweepToolPose(id,from,to,ctx.state,ctx.pieceMassKg);ok(sweep.valid,'every complete leg passes the existing physical sweep');
  // Intermediate guards exercise interpolation rather than endpoint snapping.
  for(let i=1;i<=8;i++){const p={x:from.x+(to.x-from.x)*i/8,y:from.y+(to.y-from.y)*i/8};ok((id==='cup'?sweepCupPose(from,p,ctx.angle,ctx.state):sweepToolPose(id,from,p,ctx.state,ctx.pieceMassKg)).valid,'interpolated pose remains on the valid swept route');}
  from=to;
 }return result;
}
const base=setup();
const cup=plan('cup','pour',base),cupEnd=cup.path.at(-1),a=100*Math.PI/180;
ok(sweepCupPose(cupEnd,cupEnd,{from:0,to:a},base.state).valid,'prepared cup can actually tilt');equal(pourTargetAt(cupSpoutAt(cupEnd,a,base.state),base.state),'vessel','the stream enters the vessel');
const ice=plan('ice','vessel',base),beforeMass=totalMassKg(base.state),beforeEnergy=totalEnergyJ(base.state),withIce=action(base.state,'add-ice',{massKg:.01,target:'vessel'});equal(withIce.iceMassKg,.01);ok(Math.abs(totalMassKg(withIce)-beforeMass)<1e-12);ok(Math.abs(totalEnergyJ(withIce)-beforeEnergy)<1e-8);
plan('cup','pour',{...base,angle:Math.PI/3},false);
plan('cup','pour',{...base,positions:{...base.positions,cup:{x:410,y:260}}},false);
plan('ice','vessel',{...base,pieceMassKg:.1+.001},false);
plan('probe','vessel',base,false);plan('stirrer','vessel',base,false);
const unplaced=setup('ice',{},0,false);for(const id of ['cup','ice','probe','stirrer'])plan(id,id==='cup'?'pour':'vessel',unplaced,false);
plan('scale','vessel',base,false);plan('probe','unknown',base,false);
const wet=setup('ice',{},.2);
for(const id of ['probe','stirrer']){const p=plan(id,'vessel',wet),end=p.path.at(-1);equal(probePlacementAt({x:end.x,y:end.y+(id==='stirrer'?10:0)},wet.state,wet.positions),'water','the actual sensing tip is immersed');}
const immersed=plan('probe','vessel',wet).path.at(-1);plan('probe','rest',{...wet,positions:{...wet.positions,probe:immersed}});
const shallow=setup('ice',{},.005);equal(plan('probe','vessel',shallow,false).reason,'water-too-shallow');equal(plan('stirrer','vessel',shallow,false).reason,'water-too-shallow');
const rod=plan('stirrer','vessel',wet).path.at(-1),stirCtx={...wet,positions:{...wet.positions,stirrer:rod}},snap=structuredClone(stirCtx),stir=planThermalStir(stirCtx);equal(stirCtx,snap,'stir planning does not alter state');ok(stir.valid,'immersed rod can complete the named turn');ok(stir.path.length>=16);ok(Math.hypot(stir.path[0].x-stir.path.at(-1).x,stir.path[0].y-stir.path.at(-1).y)<1e-9,'one complete closed path');let prev=rod,area=0;for(let i=0;i<stir.path.length;i++){const p=stir.path[i],next=stir.path[(i+1)%stir.path.length];ok(sweepToolPose('stirrer',prev,p,wet.state,.01).valid);equal(probePlacementAt({x:p.x,y:p.y+10},wet.state,wet.positions),'water');area+=p.x*next.y-next.x*p.y;prev=p;}ok(Math.abs(area)/2>100,'the gesture encloses a real area, not decorative jitter');ok(!planThermalStir(base).valid,'an absent or dry rod cannot stir');
for(const capacityM3 of [.0001,.0006,.01]){const large=setup('ice',{waterMassKg:2,capacityM3}),p=plan('cup','pour',large),end=p.path.at(-1);ok(sweepCupPose(end,end,{from:0,to:a},large.state).valid,'large source cup clears the rim when tilting');equal(pourTargetAt(cupSpoutAt(end,a,large.state),large.state),'vessel','large source cup is aimed, not just able to pour');}
const narrow=setup('ice',{waterMassKg:.05,capacityM3:.0001},.05);
for(const id of ['probe','stirrer']){const p=plan(id,'vessel',narrow),end=p.path.at(-1);equal(probePlacementAt({x:end.x,y:end.y+(id==='stirrer'?10:0)},narrow.state,narrow.positions),'water','usable narrow vessels retain measurement assistance');}
const narrowRod=plan('stirrer','vessel',narrow).path.at(-1),narrowStir=planThermalStir({...narrow,positions:{...narrow.positions,stirrer:narrowRod}});ok(narrowStir.valid,'a physically valid small turn remains available in a narrow vessel');for(const p of narrowStir.path)equal(probePlacementAt({x:p.x,y:p.y+10},narrow.state,narrow.positions),'water');
const solid=setup('solid',{},.2);plan('tongs','vessel',solid,false);plan('tongs','bath',solid,false);const grip=plan('tongs','sample',solid);let held={...solid,state:action(solid.state,'move-solid',{target:'tongs'}),positions:{...solid.positions,tongs:grip.path.at(-1)}};plan('tongs','sample',held,false);plan('tongs','bath',held);plan('tongs','vessel',held);const endSolid=action(held.state,'move-solid',{target:'water'});ok(Math.abs(totalMassKg(endSolid)-totalMassKg(held.state))<1e-12);ok(Math.abs(totalEnergyJ(endSolid)-totalEnergyJ(held.state))<1e-8);
for(const [config,sampleY]of [[{},319.3333333333333],[{solidMassKg:.2,solidDensityKgM3:900},286.2282745710952]]){
 const c=setup('solid',config),heldState=action(c.state,'move-solid',{target:'tongs'}),bathState=action(heldState,'move-solid',{target:'bath'}),bathCtx={...c,state:bathState,positions:{...c.positions,solid:{x:280,y:sampleY}}},p=plan('probe','bath',bathCtx);
 equal(probePlacementAt(p.path.at(-1),bathState,bathCtx.positions),'bath','Measure bath must sample the fluid, not the solid occupying that point');
}
plan('probe','bath',base,false);
for(const ctx of [wet,narrow,solid,stirCtx]){
 const original=structuredClone(ctx),singlePress=planAssistedStir(ctx);
 equal(ctx,original,'one-press stirring plans without mutating the trial');
 ok(singlePress.valid,'one-press stirring is available with usable water');
 let previous=ctx.positions.stirrer;
 for(const point of singlePress.path){ok(sweepToolPose('stirrer',previous,point,ctx.state,ctx.pieceMassKg).valid,'safe insertion or turn');previous=point;}
 const turn=singlePress.path.slice(-33);
 equal(turn[0].x,turn.at(-1).x,'the final part is a full turn');
 for(const point of turn)equal(probePlacementAt({x:point.x,y:point.y+10},ctx.state,ctx.positions),'water');
}
for(const ctx of [base,unplaced,shallow])equal(planAssistedStir(ctx).path,[],'no partial move or turn when the vessel cannot be stirred');
console.log(JSON.stringify({status:'PASS',assertions,scope:'Read-only assisted routing, complete sweeps/interpolation, real immersion, closed stir path, no-water/invalid pose/domain rejection, large-cup aiming and existing physical transfers. Not browser or device acceptance.'}));
