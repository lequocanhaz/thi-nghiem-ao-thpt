import {modelLabel} from './model-label.js?v=35';
import {tickStep,tickValues,tickText} from './plot-grid.js?v=35';
import * as T from './vendor/three.module.min.js';
import {evaluate} from './models.js?v=17';
import {axisExtent,interferenceWindow} from './simulation-space.js?v=43';
import {trackLayout} from './track-layout.js?v=43';
const axis=(key,unit,scale,range)=>({key,unit,scale,range});
// World-to-physical mappings are taken from the corresponding apparatus builders.
// A display scale is not silently interpreted as metres.
const orientationIds=new Set('incline pendulum lever hooke collision magnetic lorentz solenoid vector_sum vector_components relative_motion gravitational_force orbit escape_speed kepler torque_angle rotational_inertia angular_accel rolling beam_supports three_strings collision_2d angular_momentum gyroscope rotating_planet elliptic_orbit binary_orbit tidal_gradient charged_ring charged_rod charged_disk charged_solid_sphere charged_plane equipotential_map three_charge_energy electric_work_paths dipole_torque uniform_field potential_point potential_pair loop_axis helmholtz_coils finite_solenoid toroid compass_coil velocity_selector mass_spectrometer cyclotron magnetic_helix em_plane_wave poynting_energy prism lens mirror reflection refraction tir ray_slab grating young diffraction polarization'.split(' '));
export function coordinateProfile(id,s={}){
 const x=(unit,scale,range)=>axis('x',unit,scale,range),y=(key,unit,scale,range)=>axis(key,unit,scale,range);
 const flight=['horizontal','projectile'].includes(id)&&Number.isFinite(s.v0)?evaluate(id,s):null;
 const track=trackLayout(id,s),water=interferenceWindow(s);
 const profiles={
  electric:{origin:[0,0,0],axes:[x('m',8,[-axisExtent(.3,Math.max(Math.abs(s.x1||0),Math.abs(s.x2||0),Math.abs(s.px||0))),axisExtent(.3,Math.max(Math.abs(s.x1||0),Math.abs(s.x2||0),Math.abs(s.px||0)))]),y('y','m',8,[-.25,.25]),axis('z','m',8,[-.25,.25])],plane:'front'},
  energy:{origin:[-1.7,.25,0],axes:[y('h','m',.2,[0,axisExtent(20,s.h0)])],plane:'front'},
  oscillation:{origin:[0,.62,0],axes:[x('cm',.12,[-axisExtent(10,Math.abs(s.a)),axisExtent(10,Math.abs(s.a))])],plane:'front'},
  damped:{origin:[0,.6,0],axes:[x('cm',.15,[-axisExtent(10,Math.abs(s.a)),axisExtent(10,Math.abs(s.a))])],plane:'front'},
  wave:{origin:[-3,1.3,0],axes:[x('m',1,[0,6]),y('u','cm',.7,[-axisExtent(1,Math.abs(s.a)),axisExtent(1,Math.abs(s.a))])],plane:'front'},
  standing:{origin:[-3,1.4,0],axes:[x('m',6/Math.max(.001,s.length||4),[0,s.length||4]),y('u','cm',.9,[-Math.max(.2,2*(s.a||.2)),Math.max(.2,2*(s.a||.2))])],plane:'front'},
  uniform:track&&{origin:[track.origin,.22,0],axes:[x('m',track.scale,track.range)],plane:'front'},
  acceleration:track&&{origin:[track.origin,.22,0],axes:[x('m',track.scale,track.range)],plane:'front'},
  newton:track&&{origin:[track.origin,.22,0],axes:[x('m',track.scale,track.range)],plane:'front'},
  horizontal:{origin:[-3,.35,0],axes:[x('m',.2,[0,axisExtent(30,flight?.range)]),y('y','m',.2,[0,axisExtent(20,s.h0)])],plane:'front'},
  projectile:{origin:[-3,.35,0],axes:[x('m',.48,[0,axisExtent(12,flight?.range)]),y('y','m',.48,[0,axisExtent(8,flight?.height)])],plane:'front'},
  circular:{origin:[0,.3,0],axes:[x('m',1,[-(s.radius||1.5),(s.radius||1.5)]),axis('z','m',1,[-(s.radius||1.5),(s.radius||1.5)])],plane:'top'},
  interference:{origin:[0,.65,-1.7],axes:[x('m',1,[-water.x,water.x]),axis('z','m',1,[0,water.z])],plane:'top'}
 };
 if(profiles[id])return {...profiles[id],metric:true,note:'Vạch chia theo đại lượng và đơn vị ghi trên từng trục. Tỉ lệ các trục có thể khác nhau.'};
 if(orientationIds.has(id))return {origin:[0,0,0],axes:[x('',1,[-2,2]),y('y','',1,[0,3]),axis('z','',1,[-2,2])],plane:'front',metric:false,note:'Trục định hướng của hình minh họa; không dùng chiều dài trên hình để đọc số đo.'};
 return null;
}
const colors={x:0x2360ba,y:0xb74a25,h:0xb74a25,u:0xb74a25,z:0x087a65};
const direction=key=>new T.Vector3(...(key==='x'?[1,0,0]:key==='z'?[0,0,1]:[0,1,0]));
export function coordinatePoint(profile,key,value){const a=profile.axes.find(a=>a.key===key);return a?new T.Vector3(...profile.origin).addScaledVector(direction(key),value*a.scale):null;}
function label(text,position,options={}){
 const sprite=modelLabel(null,text,position,{width:384,height:88,fontSize:40,fontWeight:600,pixelSize:16,scale:[1.05,.24],...options});
 if(sprite)Object.assign(sprite.userData,{coordinateLabel:text,...options});return sprite||new T.Group();
}
export function hasCoordinateGrid(profile){return !!profile&&profile.axes.length>1;}
function buildGrid(profile){
 const grid=new T.Group();grid.userData.coordinateGrid=true;
 const x=profile.axes.find(a=>a.key==='x');if(!x)return grid;
 for(const a of profile.axes.filter(a=>a.key!=='x')){
  const plane=new T.Group();plane.userData.gridPlane=a.key==='z'?'top':'front';
  for(const major of [false,true]){
   const points=[],origin=new T.Vector3(...profile.origin),sx=tickStep(...x.range),sy=tickStep(...a.range),dx=direction('x'),dy=direction(a.key);
   const add=(u,v)=>points.push(origin.clone().addScaledVector(dx,u*x.scale).addScaledVector(dy,v*a.scale));
   for(const u of tickValues(...x.range,sx/(major?1:5))){add(u,a.range[0]);add(u,a.range[1]);}
   for(const v of tickValues(...a.range,sy/(major?1:5))){add(x.range[0],v);add(x.range[1],v);}
   const lines=new T.LineSegments(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:major?0x8297b3:0xaebed1,transparent:true,opacity:major?.42:.2,depthWrite:false}));lines.renderOrder=-10;plane.add(lines);
  }
  grid.add(plane);
 }
 return grid;
}
function buildAid(profile,config){
 const group=new T.Group();group.name='coordinate-aid';group.userData.coordinateAid=true;group.userData.profile=profile;
 if(config.switches?.grid!==false&&hasCoordinateGrid(profile))group.add(buildGrid(profile));
 const origin=new T.Vector3(...profile.origin);group.add(label('O',origin,{pixelOffset:profile.axes.length>1?[-26,0]:[0,24]}));
 for(const a of profile.axes){
  const branch=new T.Group();branch.userData.axisKey=a.key;const dir=direction(a.key),color=colors[a.key];const from=origin.clone().addScaledVector(dir,a.range[0]*a.scale),to=origin.clone().addScaledVector(dir,a.range[1]*a.scale);
  const line=new T.Line(new T.BufferGeometry().setFromPoints([from,to]),new T.LineBasicMaterial({color,transparent:true,opacity:.72}));branch.add(line);
  const arrow=new T.ArrowHelper(dir,to.clone().addScaledVector(dir,-.14),.14,color,.14,.065);branch.add(arrow);
  branch.add(label(a.key+(a.unit?' ('+a.unit+')':''),to,{pixelOffset:a.key==='x'?[42,-22]:[0,-32]}));
  if(profile.metric){const step=tickStep(...a.range);for(const value of tickValues(...a.range,step)){if(Math.abs(value)<1e-10)continue;const p=coordinatePoint(profile,a.key,value),cross=a.key==='x'?new T.Vector3(0,.05,0):new T.Vector3(.05,0,0);const tick=new T.Line(new T.BufferGeometry().setFromPoints([p.clone().sub(cross),p.clone().add(cross)]),new T.LineBasicMaterial({color}));branch.add(tick);branch.add(label(tickText(value,step),p,{pixelOffset:a.key==='x'?[0,24]:[-26,0],tickValue:value,tickStep:step,tickHorizontal:a.key==='x',tickDelta:dir.clone().multiplyScalar(step*a.scale)}));}}
  group.add(branch);
 }
 return group;
}
function dispose(group){group.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m?.map?.dispose();m?.dispose();}});}
export function withCoordinates(model,id,state,data,options={}){
 const update=model.update;let aid,signature;
 const sync=(s,c={})=>{const profile=coordinateProfile(id,s),on=!!profile&&!options.thumbnail&&!options.hero&&!options.config?.thumbnail&&!options.config?.hero&&c.switches?.axes!==false;const sig=on?JSON.stringify([profile,c.switches?.grid!==false]):'';
  if(sig!==signature){if(aid){model.group.remove(aid);dispose(aid);aid=null;}if(on){aid=buildAid(profile,c);model.group.add(aid);}signature=sig;}
  if(aid){for(const branch of aid.children){if(branch.userData.axisKey)branch.visible=c.viewMode!=='2d'||(c.viewPlane==='top'?['x','z']:['x','y','u','h']).includes(branch.userData.axisKey);if(branch.userData.coordinateGrid)for(const plane of branch.children)plane.visible=plane.userData.gridPlane===(c.viewMode==='2d'?(c.viewPlane||profile.plane):profile.plane);}}
 };
 model.update=(s,d,c={})=>{update(s,d,c);sync(s,c);};sync(state,options.config||{});return model;
}
