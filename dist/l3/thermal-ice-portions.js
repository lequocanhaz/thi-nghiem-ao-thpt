// Each accepted addition is retained as a portion of the existing lumped ice model.
// This is not a free-body/CFD solver. Cuboids partition the equivalent SI body;
// their union is exactly the same ice volume used by hydrostatics and heat transfer.
import {sampleDimensions} from './thermal-geometry.js?v=87';
export const ICE_PORTIONS_VERSION='thermal.ice-portions.v1';
export const MAX_ICE_PORTIONS=1001;
const MASS_TOL_KG=1e-10;
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const number=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi;
const sum=(parts,key)=>parts.reduce((n,p)=>n+p[key],0);
export function validateIcePortions(state){
 const errors=[];try{
  if(state.icePortionsVersion===undefined&&state.icePortions===undefined)return {valid:true,errors};
  if(state.activity!=='ice'||state.icePortionsVersion!==ICE_PORTIONS_VERSION||!Array.isArray(state.icePortions)||state.icePortions.length>MAX_ICE_PORTIONS)throw Error('ice portions version');
  let previousTime=-1,previousFraction=0,previousOrigin=null,legacy=0;
  for(let i=0;i<state.icePortions.length;i++){
   const p=state.icePortions[i];
   if(!plain(p)||Object.keys(p).some(k=>!['id','origin','initialMassKg','massKg','addedAtSimTimeS'].includes(k))||p.id!=='ice-portion-'+(i+1))throw Error('ice portion identity');
   if(!['added','legacy-aggregate'].includes(p.origin)||p.origin==='legacy-aggregate'&&(i!==0||legacy++))throw Error('ice portion origin');
   if(!number(p.initialMassKg,Number.MIN_VALUE,1+MASS_TOL_KG)||!number(p.massKg,0,p.initialMassKg+Math.max(Number.MIN_VALUE,p.initialMassKg*1e-12)))throw Error('ice portion mass');
   if(!number(p.addedAtSimTimeS,0,state.timeS+1e-8)||p.addedAtSimTimeS<previousTime)throw Error('ice portion time');
   // Uniform proportional melting cannot make an older portion retain a larger
   // fraction than a newer one. Same-time added portions share the same fraction.
   const fraction=p.massKg/p.initialMassKg;
   if(!Number.isFinite(fraction)||fraction<previousFraction-1e-9||p.origin==='added'&&previousOrigin==='added'&&p.addedAtSimTimeS===previousTime&&Math.abs(fraction-previousFraction)>1e-9)throw Error('ice portion melt order');
   previousTime=p.addedAtSimTimeS;previousFraction=fraction;previousOrigin=p.origin;
  }
  const remaining=sum(state.icePortions,'massKg'),aggregate=state.iceMassKg;
  // An absolute tolerance alone could erase an entire tiny positive body or
  // accept phantom portions after full melting. Never repair either quantity.
  if(!number(aggregate,0,1+MASS_TOL_KG)||(aggregate>0)!==(remaining>0))throw Error('ice portion remaining presence');
  const remainingTolerance=Math.min(MASS_TOL_KG,Math.max(aggregate,remaining)*1e-9);
  if(Math.abs(remaining-aggregate)>remainingTolerance)throw Error('ice portion remaining sum');
  const transferred=state.config.iceMassKg-state.iceTrayMassKg;
  if(Math.abs(sum(state.icePortions,'initialMassKg')-transferred)>MASS_TOL_KG)throw Error('ice portion source sum');
 }catch(error){errors.push(error.message);}return {valid:errors.length===0,errors};
}
export function appendIcePortion(state,massKg){
 if(state.activity!=='ice'||!number(massKg,Number.MIN_VALUE,1))throw new RangeError('ice portion addition');
 if(state.icePortionsVersion===undefined&&state.icePortions===undefined){
  state.icePortionsVersion=ICE_PORTIONS_VERSION;state.icePortions=[];
  const previous=state.config.iceMassKg-state.iceTrayMassKg;
  // The amount transferred before tracking is known, but its historical piece
  // count and addition times are not. The timestamp is tracking-start time.
  if(previous>0||state.iceMassKg>0)state.icePortions.push({id:'ice-portion-1',origin:'legacy-aggregate',initialMassKg:Math.max(previous,state.iceMassKg),massKg:state.iceMassKg,addedAtSimTimeS:state.timeS});
 }
 if(!validateIcePortions(state).valid)throw new RangeError('invalid ice portions');
 if(state.icePortions.length>=MAX_ICE_PORTIONS)throw new RangeError('ice portion limit');
 state.icePortions.push({id:'ice-portion-'+(state.icePortions.length+1),origin:'added',initialMassKg:massKg,massKg,addedAtSimTimeS:state.timeS});
}
export function meltIcePortions(state,newIceMassKg){
 if(state.icePortionsVersion===undefined&&state.icePortions===undefined)return;
 const parts=state.icePortions,total=sum(parts,'massKg');
 if(!number(newIceMassKg,0,total+MASS_TOL_KG))throw new RangeError('ice portion melting');
 if(newIceMassKg===0){for(const p of parts)p.massKg=0;return;}
 if(!(total>newIceMassKg))return; // Preserve a sub-ulp discrepancy without regrowing ice.
 let remaining=newIceMassKg,remainingOld=total;
 const active=parts.filter(p=>p.massKg>0);
 for(let i=0;i<active.length;i++){
  const p=active[i],old=p.massKg,next=i===active.length-1?Math.min(old,Math.max(0,remaining)):Math.min(old,Math.max(0,remaining*old/remainingOld));
  p.massKg=next;remaining-=next;remainingOld-=old;
 }
 // A residual below floating-point summation precision is deliberately not used
 // to change the scientific aggregate. Validation bounds both absolute and relative summation error, not data repair.
}
export function icePortionSummary(state){
 const hasLedger=state.icePortionsVersion===ICE_PORTIONS_VERSION&&Array.isArray(state.icePortions),parts=hasLedger?state.icePortions:[];
 return {hasLedger,addedCount:hasLedger?parts.filter(p=>p.origin==='added').length:null,remainingCount:hasLedger?parts.filter(p=>p.origin==='added'&&p.massKg>0).length:null,legacyAggregateCount:hasLedger?parts.filter(p=>p.origin==='legacy-aggregate').length:(state.iceMassKg>0?1:0),remainingMassKg:state.iceMassKg,trackedInitialMassKg:hasLedger?sum(parts,'initialMassKg'):null};
}
export function partitionIcePortions(state){
 if(!validateIcePortions(state).valid)throw new RangeError('invalid ice portion partition');
 if(!(state.iceMassKg>0))return [];
 const body=sampleDimensions(state,'ice'),items=state.icePortionsVersion===ICE_PORTIONS_VERSION?state.icePortions.filter(p=>p.massKg>0):[{id:'legacy-aggregate',origin:'legacy-aggregate',massKg:state.iceMassKg,initialMassKg:state.iceMassKg}];
 const result=[];
 if(!items.length)throw new RangeError('positive ice needs a positive portion');
 function divide(parts,center,size){
  if(parts.length===1){const p=parts[0];result.push({id:p.id,origin:p.origin,massKg:p.massKg,initialMassKg:p.initialMassKg,centerM:{...center},sizeM:{...size},volumeM3:size.x*size.y*size.z});return;}
  const total=sum(parts,'massKg');let cumulative=0,best=Infinity,split=1,leftMass=parts[0].massKg;
  for(let i=1;i<parts.length;i++){cumulative+=parts[i-1].massKg;const distance=Math.abs(cumulative-total/2);if(distance<best){best=distance;split=i;leftMass=cumulative;}}
  const axis=['x','y','z'].reduce((a,b)=>size[a]>=size[b]?a:b),ratio=leftMass/total,leftSize={...size,[axis]:size[axis]*ratio},rightSize={...size,[axis]:size[axis]-size[axis]*ratio},leftCenter={...center,[axis]:center[axis]-(size[axis]-leftSize[axis])/2},rightCenter={...center,[axis]:center[axis]+(size[axis]-rightSize[axis])/2};
  divide(parts.slice(0,split),leftCenter,leftSize);divide(parts.slice(split),rightCenter,rightSize);
 }
 divide(items,{x:0,y:0,z:0},{x:body.widthM,y:body.heightM,z:body.depthM});return result;
}
