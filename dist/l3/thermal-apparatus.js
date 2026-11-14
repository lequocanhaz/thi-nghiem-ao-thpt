// Calibrated apparatus contact. Legacy registry remains available to old sessions.
import {apparatusRegistry,initialPositions as legacyPositions,safePositions,targetAt as legacyTarget} from './apparatus-registry.js?v=85';
import {vesselGeometry,waterLevel,sampleDimensions,cupSpoutAt} from './thermal-geometry.js?v=87';
export {apparatusRegistry,safePositions,cupSpoutAt};
export function initialPositions(state,pieceMassKg=.02){const p=legacyPositions();if(state){const solid=sampleDimensions(state,'solid');p.solid.x=Math.max(540,525+solid.widthM*500);p.tongs.y=130;p.stirrer.x=780;p.solid.y=430-solid.heightM*500;p.bath.x=280;p.ice.y=318-Math.cbrt(Math.max(0,pieceMassKg)/917)*500;}return p;}
export const GEOMETRY_VERSION='thermal.geometry.v2';
export function targetAt(p,state){
 const legacy=legacyTarget(p);if(legacy==='scale')return legacy;if(state.activity==='solid'&&p.x>=205&&p.x<=355&&p.y>=263&&p.y<=332)return 'bath';
 const g=vesselGeometry(state),half=g.innerApothemM*1000;
 return state.vesselPlaced&&Math.abs(p.x-g.centerCanonicalX)<=half&&p.y>=g.rimCanonicalY&&p.y<=g.bottomCanonicalY?'calorimeter':'table';
}
export function pourTargetAt(p,state){const g=vesselGeometry(state);return state.vesselPlaced&&Math.abs(p.x-g.centerCanonicalX)<=g.innerApothemM*1000&&p.y>=0&&p.y<=g.rimCanonicalY?'vessel':'table';}
export const waterSurfaceY=state=>waterLevel(state).canonicalY;
export function probePlacementAt(p,state,positions){
 if(state.activity==='solid'&&state.solid.location!=='water'){const d=sampleDimensions(state,'solid');if(Math.abs(p.x-positions.solid.x)<=d.widthM*500&&Math.abs(p.y-positions.solid.y)<=d.heightM*500)return 'solid';}
 const g=vesselGeometry(state),dx=Math.abs(p.x-g.centerCanonicalX)/1000,y=(348-p.y)/1000,level=waterLevel(state);
 if(state.vesselPlaced&&dx<=g.innerApothemM-.005&&y>=.005&&y<=level.heightM-.005&&state.waterMassKg>0&&level.valid)return 'water';
 if(state.vesselPlaced&&dx<=g.outerRadiusM+.005&&y>=-.009&&y<=g.rimWorldY+.005&&(dx>=g.innerApothemM-.005||y<=.005||!level.valid))return 'wall';
 if(state.activity==='solid'&&p.x>=205&&p.x<=355&&p.y>=263&&p.y<=332)return 'bath';return 'air';
}
export function sampleFitsAt(p,state,kind,massKg){
 const g=vesselGeometry(state),d=kind==='ice'?{widthM:Math.cbrt(massKg/917),depthM:Math.cbrt(massKg/917)}:sampleDimensions(state,'solid');
 return Math.hypot(Math.abs((p.x-g.centerCanonicalX)/1000)+d.widthM/2,d.depthM/2)<=g.innerApothemM+1e-10;
}
