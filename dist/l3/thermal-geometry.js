// Geometry in metres, kg and m³. No function changes a physical state or infers
// a measurement from pixels. The calibrated vessels are regular 64-gon prisms.
export const GEOMETRY=Object.freeze({
 segments:64,canonicalUnitsPerM:1000,xOrigin:400,yOrigin:348,floorWorldY:-.082,
 vesselCenterCanonicalX:410,vesselInnerHeightM:.176,vesselWallM:.004,vesselBottomM:.004,
 cupInnerHeightM:.1,cupBottomLocalY:-.05,cupTopLocalY:.05,cupWallM:.002,
 cupOuterBottomY:-.054,cupOuterTopY:.052,
 waterDensityKgM3:1000,iceDensityKgM3:917,contactToleranceM:1e-10
});
const G=GEOMETRY,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function finite(name,value,lo,hi){if(typeof value!=='number'||!Number.isFinite(value)||value<lo||value>hi)throw new RangeError(name);return value;}
function configOf(input){if(input===undefined)return {};if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('Geometry config');const c=input.config===undefined?input:input.config;if(!c||typeof c!=='object'||Array.isArray(c))throw new TypeError('Geometry config');return c;}
const value=(o,k,f,lo,hi)=>finite(k,o[k]===undefined?f:o[k],lo,hi);
function prism(capacityM3,heightM){const coefficient=G.segments*Math.sin(2*Math.PI/G.segments)/2,r=Math.sqrt(capacityM3/(heightM*coefficient));return{segments:G.segments,capacityM3,innerHeightM:heightM,heightM,innerRadiusM:r,innerApothemM:r*Math.cos(Math.PI/G.segments),areaM2:capacityM3/heightM};}
export function vesselGeometry(input){const c=configOf(input),p=prism(value(c,'capacityM3',.0006,.0001,.01),G.vesselInnerHeightM);return{...p,outerRadiusM:p.innerRadiusM+G.vesselWallM,wallM:G.vesselWallM,bottomThicknessM:G.vesselBottomM,bottomWorldY:0,rimWorldY:G.vesselInnerHeightM,centerCanonicalX:G.vesselCenterCanonicalX,bottomCanonicalY:G.yOrigin,rimCanonicalY:G.yOrigin-G.vesselInnerHeightM*G.canonicalUnitsPerM};}
export function cupGeometry(input){const c=configOf(input),sourceKg=value(c,'waterMassKg',.2,0,2),p=prism(Math.max(.0005,sourceKg/G.waterDensityKgM3*1.1),G.cupInnerHeightM),outer=p.innerRadiusM+G.cupWallM;return{...p,outerRadiusM:outer,wallM:G.cupWallM,bottomLocalY:G.cupBottomLocalY,topLocalY:G.cupTopLocalY,outerBottomY:G.cupOuterBottomY,outerTopY:G.cupOuterTopY,spoutStart:{x:outer-.005,y:.049},spoutEnd:{x:outer+.018,y:.044}};}
function shape(state,kind){
 if(!state||typeof state!=='object'||Array.isArray(state))throw new TypeError('Geometry state');const c=configOf(state),vessel=vesselGeometry(c);let mass,density,width,height;
 if(kind==='ice'){mass=value(state,'iceMassKg',0,0,1);density=G.iceDensityKgM3;const volume=mass/density;width=mass>0?Math.min(Math.cbrt(volume),vessel.innerApothemM*1.2):0;height=mass>0?volume/(width*width):0;}
 else if(kind==='solid'){const solid=state.solid===undefined?{}:state.solid;if(!solid||typeof solid!=='object'||Array.isArray(solid))throw new TypeError('Solid geometry');mass=value(solid,'massKg',value(c,'solidMassKg',.1,.001,1),.001,1);density=value(c,'solidDensityKgM3',2700,500,20000);width=Math.cbrt(mass/density);height=width;}
 else throw new RangeError('Sample kind');
 const volume=mass/density;return{kind,massKg:mass,densityKgM3:density,widthM:width,heightM:height,depthM:width,volumeM3:volume,footprintM2:width*width,submergedFraction:Math.min(1,density/G.waterDensityKgM3),fitsVesselMouth:Math.hypot(width/2,width/2)<=vessel.innerApothemM+G.contactToleranceM};
}
export function waterLevel(state){
 if(!state||typeof state!=='object'||Array.isArray(state))throw new TypeError('Geometry state');const c=configOf(state),vessel=vesselGeometry(c),mass=value(state,'waterMassKg',0,0,3),waterVolume=mass/G.waterDensityKgM3;
 const kind=state.activity==='solid'&&state.solid?.location==='water'?'solid':state.activity!=='solid'&&value(state,'iceMassKg',0,0,1)>0?'ice':null;
 const body=kind?shape(state,kind):null;let h=waterVolume/vessel.areaM2,displacement=0,contact='none',bottom=0,center=0,valid=true,reason='ok';
 if(body){center=body.heightM/2;if(!body.fitsVesselMouth){valid=false;reason='sample-does-not-fit';contact='unsupported';}
  else if(mass<=0){h=0;contact='grounded';}
  else{const a=vessel.areaM2,b=body.footprintM2,H=body.heightM,grounded=waterVolume<=(a-b)*H?waterVolume/(a-b):(waterVolume+body.volumeM3)/a;
   if(body.densityKgM3<G.waterDensityKgM3&&grounded>=body.submergedFraction*H){h=(waterVolume+body.massKg/G.waterDensityKgM3)/a;bottom=Math.max(0,h-body.submergedFraction*H);center=bottom+H/2;displacement=body.massKg/G.waterDensityKgM3;contact='floating';}
   else{h=grounded;displacement=b*Math.min(h,H);contact='grounded';}
  }
 }
 const overflow=h>vessel.innerHeightM+G.contactToleranceM,height=clamp(h,0,vessel.innerHeightM);if(overflow&&valid){valid=false;reason='vessel-overflow';}
 return{valid,reason,volumeM3:waterVolume+displacement,waterVolumeM3:waterVolume,displacedVolumeM3:displacement,heightM:height,unclampedHeightM:h,canonicalY:G.yOrigin-height*G.canonicalUnitsPerM,overflow,contact,objectKind:kind,objectBottomM:bottom,objectCenterM:center};
}
export function sampleDimensions(state,kind){const s=shape(state,kind),inWater=kind==='ice'?s.massKg>0&&state.activity!=='solid':state.activity==='solid'&&state.solid?.location==='water',level=inWater?waterLevel(state):null;return{...s,contact:level?.contact||'none',bottomWorldY:level?.objectBottomM??0,centerWorldY:level?.objectCenterM??s.heightM/2,valid:level?.valid??true,reason:level?.reason||'ok'};}
export function cupSpoutAt(position,angle,input){if(!position||typeof position!=='object')throw new TypeError('Cup position');const x=finite('cup x',position.x,-100000,100000),y=finite('cup y',position.y,-100000,100000);finite('cup angle',angle,-2*Math.PI,2*Math.PI);const p=cupGeometry(input).spoutEnd,c=Math.cos(angle),s=Math.sin(angle);return{x:x+G.canonicalUnitsPerM*(p.x*c+p.y*s),y:y+G.canonicalUnitsPerM*(p.x*s-p.y*c)};}
const point=(x,y,z)=>({x,y,z}),cross=(a,b)=>point(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
function volumeOf(faces){let result=0;for(const f of faces)for(let i=1;i<f.length-1;i++)result+=dot(f[0],cross(f[i],f[i+1]))/6;return Math.abs(result);}
function clippedFaces(faces,level){const out=[],cap=[];for(const face of faces){const poly=[];for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length],ia=a.y<=level,ib=b.y<=level;if(ia)poly.push(a);if(ia!==ib){const t=(level-a.y)/(b.y-a.y),p=point(a.x+(b.x-a.x)*t,level,a.z+(b.z-a.z)*t);poly.push(p);if(!cap.some(q=>(q.x-p.x)**2+(q.z-p.z)**2<1e-24))cap.push(p);}}if(poly.length>=3)out.push(poly);}if(cap.length>=3){const cx=cap.reduce((s,p)=>s+p.x,0)/cap.length,cz=cap.reduce((s,p)=>s+p.z,0)/cap.length;cap.sort((a,b)=>Math.atan2(a.x-cx,a.z-cz)-Math.atan2(b.x-cx,b.z-cz));out.push(cap);}return out;}
function rotatedCupFaces(g,angle){const c=Math.cos(angle),s=Math.sin(angle),ring=y=>Array.from({length:g.segments},(_,i)=>{const a=2*Math.PI*i/g.segments,x=g.innerRadiusM*Math.sin(a);return point(x*c+y*s,-x*s+y*c,g.innerRadiusM*Math.cos(a));}),bottom=ring(g.bottomLocalY),top=ring(g.topLocalY),faces=[bottom.slice().reverse(),top];for(let i=0;i<g.segments;i++){const j=(i+1)%g.segments;faces.push([bottom[i],bottom[j],top[j],top[i]]);}const all=faces.flat();return{faces,min:Math.min(...all.map(p=>p.y)),max:Math.max(...all.map(p=>p.y))};}
// Water leaves an open cup only after reaching its lowest mouth edge. The
// controller may transfer at a finite rate, capped by this excess, without
// inventing flow from a merely tilted cup whose surface is below the lip.
function computeCupPourCapacity(state,angle=0){finite('cup angle',angle,-2*Math.PI,2*Math.PI);const g=cupGeometry(state),mass=value(state,'cupWaterMassKg',0,0,2),closed=rotatedCupFaces(g,angle),lip=g.topLocalY*Math.cos(angle)-g.innerRadiusM*Math.abs(Math.sin(angle)),retained=clamp(volumeOf(clippedFaces(closed.faces,lip)),0,g.capacityM3),excess=Math.max(0,mass-retained*G.waterDensityKgM3);return{retainedVolumeM3:retained,pourableMassKg:excess,lipHeightYM:lip,canPour:excess>1e-9};}
// Closed polyhedron clipped by gravity. It depicts finite transfer, not a CFD or
// instant-spill solver: while pouring, a transient surface may reach an open lip.
function computeCupLiquidGeometry(state,angle=0){
 finite('cup angle',angle,-2*Math.PI,2*Math.PI);const g=cupGeometry(state),mass=value(state,'cupWaterMassKg',0,0,2),target=mass/G.waterDensityKgM3,c=Math.cos(angle),s=Math.sin(angle),body=rotatedCupFaces(g,angle),closed=body.faces,min=body.min,max=body.max,overflow=target>g.capacityM3+1e-14,wanted=clamp(target,0,g.capacityM3);let level=min,faces=[];
 if(wanted<=1e-14){level=min;faces=[];}else if(wanted>=g.capacityM3){level=max;faces=closed;}
 else if(wanted>0){let lo=min,hi=max;for(let i=0;i<36;i++){const mid=(lo+hi)/2;if(volumeOf(clippedFaces(closed,mid))<wanted)lo=mid;else hi=mid;}level=(lo+hi)/2;faces=clippedFaces(closed,level);}
 // An actual z=0 cross-section of this symmetric prism, expressed back in cup
 // local axes for SVG's enclosing rotation. It is not used to calculate fill.
 const sectionRot=[point(-g.innerRadiusM*c+g.bottomLocalY*s,g.innerRadiusM*s+g.bottomLocalY*c,0),point(g.innerRadiusM*c+g.bottomLocalY*s,-g.innerRadiusM*s+g.bottomLocalY*c,0),point(g.innerRadiusM*c+g.topLocalY*s,-g.innerRadiusM*s+g.topLocalY*c,0),point(-g.innerRadiusM*c+g.topLocalY*s,g.innerRadiusM*s+g.topLocalY*c,0)],section=[];
 if(wanted>1e-14)for(let i=0;i<sectionRot.length;i++){const a=sectionRot[i],b=sectionRot[(i+1)%sectionRot.length],ia=a.y<=level,ib=b.y<=level;if(ia)section.push(a);if(ia!==ib){const t=(level-a.y)/(b.y-a.y);section.push(point(a.x+(b.x-a.x)*t,level,0));}}
 const volume=volumeOf(faces);return{faces,surfaceYM:level,volumeM3:volume,targetVolumeM3:target,numericalResidualM3:volume-wanted,overflow,sectionLocalXY:section.map(p=>({x:p.x*c-p.y*s,y:p.x*s+p.y*c})),segments:g.segments};
}

// Exact-key, bounded memoization shares immutable drawing geometry across 2D/3D.
// No quantization and no cache of temperatures, measurements or physical state.
let liquidKey='',liquidCache=null,pourKey='',pourCache=null;
const freezeTree=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))freezeTree(x);Object.freeze(v);}return v;};
export function cupLiquidGeometry(state,angle=0){finite('cup angle',angle,-2*Math.PI,2*Math.PI);const g=cupGeometry(state),mass=value(state,'cupWaterMassKg',0,0,2),key=[g.capacityM3,mass,angle].join('/');if(key!==liquidKey){liquidCache=freezeTree(computeCupLiquidGeometry(state,angle));liquidKey=key;}return liquidCache;}
export function cupPourCapacity(state,angle=0){finite('cup angle',angle,-2*Math.PI,2*Math.PI);const g=cupGeometry(state),mass=value(state,'cupWaterMassKg',0,0,2),key=[g.capacityM3,angle].join('/');if(key!==pourKey){pourCache=computeCupPourCapacity(state,angle);pourKey=key;}const excess=Math.max(0,mass-pourCache.retainedVolumeM3*G.waterDensityKgM3);return{retainedVolumeM3:pourCache.retainedVolumeM3,pourableMassKg:excess,lipHeightYM:pourCache.lipHeightYM,canPour:excess>1e-9};}
// Available liquid volume at the physical brim, accounting for grounding and
// Archimedes displacement. Apparatus version2 uses this instead of counting
// the entire emergent ice/low-density sample as displaced water.
export function maximumWaterMassKg(state){const v=vesselGeometry(state),kind=state.activity==='solid'&&state.solid?.location==='water'?'solid':state.activity!=='solid'&&value(state,'iceMassKg',0,0,1)>0?'ice':null;if(!kind)return v.capacityM3*G.waterDensityKgM3;const body=shape(state,kind);if(!body.fitsVesselMouth)throw new RangeError('sample-does-not-fit');const submergedAtFloat=body.heightM*Math.min(1,body.densityKgM3/G.waterDensityKgM3),displacement=body.footprintM2*Math.min(v.innerHeightM,submergedAtFloat);return Math.max(0,(v.capacityM3-displacement)*G.waterDensityKgM3);}
