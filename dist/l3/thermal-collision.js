// Collision contract for the existing XY manipulation slice (world Z=0).
// 1 world unit = 1 m; canonical pixels are an interaction projection, not a
// measurement source. This is a conservative apparatus envelope, not a general
// 3D rigid-body solver. It neither modifies poses nor thermal state.
export const COLLISION_GEOMETRY=Object.freeze({
 canonicalScalePerM:1000,xOrigin:400,yOrigin:348,floorWorldY:-.082,
 cupRadiusM:.044,cupHalfHeightM:.059,spoutRadiusM:.004,
 vesselCenterCanonicalX:410,vesselInnerRadiusM:.076,vesselOuterRadiusM:.092,
 toleranceM:1e-7,maxRotationStepRad:Math.PI/90
});
const G=COLLISION_GEOMETRY,E=G.toleranceM;
const rectangle=(x0,y0,x1,y1)=>[{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];
const cupBody=rectangle(-.044,-.059,.044,.059);
// A round-ended spout is enclosed by its segment-aligned rectangle, including
// both spherical caps. The enlarged corners can reject a near-grazing pose.
const spoutA={x:.035,y:.055},spoutB={x:.055,y:.050};
const dx=spoutB.x-spoutA.x,dy=spoutB.y-spoutA.y,length=Math.hypot(dx,dy),u={x:dx/length,y:dy/length},v={x:-u.y,y:u.x},r=.004;
const spout=[[-r,-r],[length+r,-r],[length+r,r],[-r,r]].map(([a,b])=>({x:spoutA.x+a*u.x+b*v.x,y:spoutA.y+a*u.y+b*v.y}));
const components=[{id:'cup-body',points:cupBody},{id:'cup-spout',points:spout}];
// Vessel geometry is stationary in this pilot. Walls are finite strips, not a
// filled vessel box. There is no imaginary lid across its open mouth.
const center=(410-400)/1000;
const obstacles=[
 {id:'vessel-left-wall',points:rectangle(center-.092,0,center-.076,.188)},
 {id:'vessel-right-wall',points:rectangle(center+.076,0,center+.092,.188)},
 {id:'vessel-bottom',points:rectangle(center-.084,-.0005,center+.084,.0085)},
 {id:'vessel-left-rim',points:rectangle(center-.091,.187,center-.081,.197)},
 {id:'vessel-right-rim',points:rectangle(center+.081,.187,center+.091,.197)}
];
const inputValid=(p,a)=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=100000&&Math.abs(p.y)<=100000&&Number.isFinite(a)&&a>=0&&a<=Math.PI*2;
const transform=(points,p,a)=>{const c=Math.cos(a),s=Math.sin(a),x=(p.x-G.xOrigin)/1000,y=(G.yOrigin-p.y)/1000;return points.map(q=>({x:x+q.x*c+q.y*s,y:y-q.x*s+q.y*c}));};
function axes(points){return points.map((p,i)=>{const q=points[(i+1)%points.length],dx=q.x-p.x,dy=q.y-p.y,n=Math.hypot(dx,dy);return n?{x:-dy/n,y:dx/n}:null;}).filter(Boolean);}
function interval(points,axis){let min=Infinity,max=-Infinity;for(const p of points){const d=p.x*axis.x+p.y*axis.y;min=Math.min(min,d);max=Math.max(max,d);}return {min,max};}
function penetrates(a,b,inflate=0){
 for(const axis of [...axes(a),...axes(b)]){const x=interval(a,axis),y=interval(b,axis);if(x.max+inflate<=y.min+E||y.max<=x.min-inflate+E)return false;}
 return true;
}
function hull(points){const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lower=[],upper=[];for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of sorted.slice().reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));}
function checkShapes(shapes,state,margin=0){
 for(const shape of shapes){
  if(Math.min(...shape.points.map(p=>p.y))-margin<G.floorWorldY-E)return {valid:false,reason:'cup-table',component:shape.id};
  if(state?.vesselPlaced)for(const obstacle of obstacles)if(penetrates(shape.points,obstacle.points,margin))return {valid:false,reason:'cup-vessel',component:shape.id,obstacle:obstacle.id};
 }
 return {valid:true,reason:'ok'};
}
export function cupCollisionShapes(position,angleRad){
 if(!inputValid(position,angleRad))throw new RangeError('Invalid cup pose');
 return components.map(c=>({id:c.id,points:transform(c.points,position,angleRad)}));
}
export function validateCupPose(position,angleRad,state={}){
 if(!inputValid(position,angleRad))return {valid:false,reason:'invalid-cup-pose'};
 return checkShapes(cupCollisionShapes(position,angleRad),state);
}
// For translation, convex-hulling endpoints is the exact swept convex envelope.
// For rotation, subdivide <=2° and inflate the hull by the maximum vertex arc
// sagitta. This encloses every intermediate pose and errs toward rejection;
// it cannot jump through the wall merely because pointer events are far apart.
export function sweepCupPose(from,to,angleRad,state={}){
 const a0=typeof angleRad==='object'?angleRad?.from:angleRad,a1=typeof angleRad==='object'?angleRad?.to:angleRad;
 if(!inputValid(from,a0)||!inputValid(to,a1))return {valid:false,reason:'invalid-cup-pose'};
 const start=validateCupPose(from,a0,state);
 if(!start.valid)return {...start,reason:'invalid-cup-start',startReason:start.reason};
 const count=Math.max(1,Math.ceil(Math.abs(a1-a0)/G.maxRotationStepRad));
 const radius=Math.max(...components.flatMap(c=>c.points.map(p=>Math.hypot(p.x,p.y))));
 for(let i=0;i<count;i++){
  const lo=i/count,hi=(i+1)/count,p0={x:from.x+(to.x-from.x)*lo,y:from.y+(to.y-from.y)*lo},p1={x:from.x+(to.x-from.x)*hi,y:from.y+(to.y-from.y)*hi};
  const before=cupCollisionShapes(p0,a0+(a1-a0)*lo),after=cupCollisionShapes(p1,a0+(a1-a0)*hi),margin=radius*(1-Math.cos(Math.abs(a1-a0)/(2*count)));
  const result=checkShapes(before.map((s,j)=>({id:s.id,points:hull([...s.points,...after[j].points])})),state,margin);
  if(!result.valid)return {...result,swept:true,interval:[lo,hi]};
 }
 return {valid:true,reason:'ok'};
}
