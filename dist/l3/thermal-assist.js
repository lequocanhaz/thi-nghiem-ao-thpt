// Named destinations are an accessible alternative to precision dragging.
// Plans never modify state: every leg still has to pass the scientific sweep.
import {sweepCupPose,sweepToolPose} from './thermal-spatial.js?v=89';
import {waterLevel,vesselGeometry,cupSpoutAt,sampleDimensions} from './thermal-geometry.js?v=87';
import {initialPositions,pourTargetAt,probePlacementAt,targetAt} from './thermal-apparatus.js?v=89';
export function planThermalPlacement(id,target,{state,positions,angle=0,pieceMassKg=.01}){
 const fail=reason=>({valid:false,reason,path:[]});
 if(!positions[id]||!['cup','ice','probe','stirrer','tongs'].includes(id))return fail('unsupported-tool');
 if(['vessel','pour'].includes(target)&&!state.vesselPlaced)return fail('vessel-not-placed');
 let end;
 if(target==='scale'){
  const item=id==='tongs'?'solid':id;
  if(!['cup','ice','solid'].includes(item))return fail('unsupported-target');
  if(id==='tongs'&&state.solid.location!=='tongs')return fail('use-tongs');
  if(id==='ice'&&state.iceTrayMassKg<pieceMassKg)return fail('ice-stock-exceeded');
  if(id==='cup'&&Math.abs(angle)>1e-6)return fail('upright-first');
  if(!['none','pan'].includes(state.scale.load))return fail('balance-occupied');
  const sampleHalfHeight=id==='cup'?54:id==='ice'?Math.cbrt(pieceMassKg/917)*500:sampleDimensions(state,'solid').heightM*500+25;
  end={x:675,y:154.5-sampleHalfHeight};
  if(targetAt(end,state)!=='scale')return fail('unsupported-target');
 }else if(id==='cup'&&target==='pour'){
  if(Math.abs(angle)>1e-6)return fail('upright-first');
  for(const y of [70,40,16]){const p={x:410-cupSpoutAt({x:0,y},100*Math.PI/180,state).x,y};if(sweepCupPose(p,p,{from:0,to:100*Math.PI/180},state).valid&&pourTargetAt(cupSpoutAt(p,100*Math.PI/180,state),state)==='vessel'){end=p;break;}}if(!end)return fail('pour-path-blocked');
 }else if(id==='ice'&&target==='vessel'){
  if(state.iceTrayMassKg+1e-12<pieceMassKg)return fail('ice-stock-exceeded');
  end={x:410,y:270};
 }else if(['probe','stirrer'].includes(id)&&target==='vessel'){
  if(state.waterMassKg<=0)return fail('no-water');
  const offset=Math.min(10,Math.max(0,(vesselGeometry(state).innerApothemM-.007)*500));
  end={x:410+(id==='probe'?offset:-offset),y:(waterLevel(state).canonicalY+348)/2-(id==='stirrer'?10:0)};
  if(probePlacementAt({x:end.x,y:end.y+(id==='stirrer'?10:0)},state,positions)!=='water')return fail('water-too-shallow');
 }else if(id==='probe'&&target==='bath'&&state.activity==='solid'){end={x:350,y:285};if(probePlacementAt(end,state,positions)!=='bath')return fail('probe-not-in-bath');}
 else if(id==='probe'&&target==='held-sample'&&state.activity==='solid'){
  if(state.solid.location!=='tongs')return fail('use-tongs');
  const {x,y}=positions.solid,halfHeight=sampleDimensions(state,'solid').heightM*500;
  end={x,y:y-halfHeight+.1};
  if(probePlacementAt(end,state,positions)!=='solid')return fail('probe-not-on-sample');
 }
 else if(target==='rest'&&['probe','cup','ice'].includes(id))end=initialPositions(state,pieceMassKg)[id];
 else if(id==='tongs'&&target==='sample'){
  if(state.solid.location==='tongs')return fail('already-held');
  end={x:positions.solid.x,y:positions.solid.y-25};
 }else if(id==='tongs'&&['vessel','bath'].includes(target)){
  if(state.solid.location!=='tongs')return fail('use-tongs');
  end={x:target==='bath'?280:410,y:target==='bath'?280:125};
 }else return fail('unsupported-target');
 const from=positions[id],lift=Math.min(id==='cup'?70:80,from.y,end.y),path=[{x:from.x,y:lift},{x:end.x,y:lift},end];
 let previous=from;
 for(const next of path){const result=id==='cup'?sweepCupPose(previous,next,angle,state):sweepToolPose(id,previous,next,state,pieceMassKg);if(!result.valid)return fail(result.reason);previous=next;}
 return{valid:true,id,target,path,reason:'ok'};
}
export function planThermalStir({state,positions,pieceMassKg=.01}){
 const offset=Math.min(10,Math.max(0,(vesselGeometry(state).innerApothemM-.007)*500)),center={x:410-offset,y:(waterLevel(state).canonicalY+348)/2},radius=Math.min(9,vesselGeometry(state).innerApothemM*1000-offset-8,(338-waterLevel(state).canonicalY)/2-.5);
 if(radius<2)return{valid:false,reason:'water-too-shallow',path:[]};
 const path=Array.from({length:33},(_,i)=>({x:center.x+radius*Math.cos(i*Math.PI/16),y:center.y-10+radius*Math.sin(i*Math.PI/16)}));
 let previous=positions.stirrer;
 for(const next of path){if(probePlacementAt({x:next.x,y:next.y+10},state,positions)!=='water'||!sweepToolPose('stirrer',previous,next,state,pieceMassKg).valid)return{valid:false,reason:'stirrer-not-immersed',path:[]};previous=next;}
 return{valid:true,id:'stirrer',target:'stir',path,reason:'ok'};
}

export function planAssistedStir(context){
 const {state,positions}=context;
 if(!state.vesselPlaced||state.waterMassKg<=0)return{valid:false,reason:'no-water',path:[]};
 const rod=positions.stirrer;
 if(probePlacementAt({x:rod.x,y:rod.y+10},state,positions)==='water')return planThermalStir(context);
 const placement=planThermalPlacement('stirrer','vessel',context);
 if(!placement.valid)return placement;
 const turn=planThermalStir({...context,positions:{...positions,stirrer:placement.path.at(-1)}});
 return turn.valid?{...turn,path:[...placement.path,...turn.path]}:turn;
}
