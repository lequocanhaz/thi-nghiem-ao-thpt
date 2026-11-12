// Bench geometry is declared in metres, projected at 1000 SVG units/metre.
export const apparatusRegistry=Object.freeze({
 calorimeter:{positionM:{x:.410,y:.260},regionM:{x:.320,y:.150,width:.180,height:.200}},
 cup:{positionM:{x:.120,y:.130}},ice:{positionM:{x:.660,y:.290}},
 probe:{positionM:{x:.600,y:.180},rangeK:[273.15,373.15],resolutionK:.1,responseTimeS:2},
 stirrer:{positionM:{x:.720,y:.340}},tongs:{positionM:{x:.270,y:.090}},solid:{positionM:{x:.260,y:.390}},
 scale:{positionM:{x:.675,y:.105},regionM:{x:.600,y:.050,width:.150,height:.110},resolutionKg:.001},
 bath:{positionM:{x:.140,y:.265},regionM:{x:.050,y:.190,width:.180,height:.160}}
});
export const initialPositions=()=>Object.fromEntries(Object.entries(apparatusRegistry).map(([id,d])=>[id,{x:d.positionM.x*1000,y:d.positionM.y*1000}]));
export function contains(region,p){return !!region&&Number.isFinite(p?.x)&&Number.isFinite(p?.y)&&p.x>=region.x&&p.x<=region.x+region.width&&p.y>=region.y&&p.y<=region.y+region.height;}
export function targetAt(point){const p={x:point.x/1000,y:point.y/1000};for(const id of ['scale','bath','calorimeter'])if(contains(apparatusRegistry[id].regionM,p))return id;return 'table';}
export const placementFor=point=>({calorimeter:'water',bath:'bath',scale:'wall',table:'air'})[targetAt(point)];
// A downward stream may start ABOVE the opening; the spout need not be inside it.
export function pourTargetAt(spout,state){return state.vesselPlaced&&spout.x>=334&&spout.x<=486&&spout.y>=0&&spout.y<=342?'vessel':'table';}
export function waterSurfaceY(state){const volume=(state.waterMassKg+state.iceMassKg)/1000+(state.solid.location==='water'?state.solid.massKg/state.config.solidDensityKgM3:0);return 348-176*Math.min(1,volume/state.config.capacityM3);}
export function probePlacementAt(p,state,positions){
 if(state.activity==='solid'&&state.solid.location!=='water'&&Math.abs(p.x-positions.solid.x)<=22&&Math.abs(p.y-positions.solid.y)<=24)return 'solid';
 const surface=waterSurfaceY(state);
 if(state.vesselPlaced&&state.waterMassKg>0&&p.x>=334&&p.x<=486&&p.y>=surface+5&&p.y<=342)return 'water';
 if(state.vesselPlaced&&p.x>=320&&p.x<=500&&p.y>=150&&p.y<=360&&(p.x<334||p.x>486||p.y>342))return 'wall';
 if(state.activity==='solid'&&p.x>=65&&p.x<=215&&p.y>=263&&p.y<=332)return 'bath';
 return 'air';
}
export function safePositions(value){const out=initialPositions();if(value&&typeof value==='object')for(const id of Object.keys(out)){const p=value[id];if(p){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>800||p.y<0||p.y>480)throw new RangeError('Apparatus position outside the bench');out[id]={x:p.x,y:p.y};}}return out;}
