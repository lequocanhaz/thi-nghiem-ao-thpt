import {modelLabel} from './model-label.js?v=49';
import {tickStep,tickValues,tickText} from './plot-grid.js?v=35';
import * as T from './vendor/three.module.min.js';
import {coordinateProfile,hasCoordinateGrid} from './coordinate-profile.js?v=59';
export {coordinateProfile,hasCoordinateGrid};
const colors={x:0x2360ba,y:0xb74a25,h:0xb74a25,u:0xb74a25,z:0x087a65};
const direction=key=>new T.Vector3(...(key==='x'?[1,0,0]:key==='z'?[0,0,1]:[0,1,0]));
export function coordinatePoint(profile,key,value){const a=profile.axes.find(a=>a.key===key);return a?new T.Vector3(...profile.origin).addScaledVector(direction(key),value*a.scale):null;}
function label(text,position,options={}){
 const sprite=modelLabel(null,text,position,{width:384,height:88,fontSize:40,fontWeight:600,pixelSize:16,scale:[1.05,.24],...options});
 if(sprite)Object.assign(sprite.userData,{coordinateLabel:text,...options});return sprite||new T.Group();
}
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
 const sync=(s,c={})=>{let profile=coordinateProfile(id,s);
  // This is an orientation compass, not the optical origin or a ruler. Keep it
  // small and away from the ray junction; retain the existing axes/grid toggles.
  if(profile&&!profile.metric&&model.group.userData.opticsGeometry)profile={...profile,origin:[-2.8,0,-.4],axes:profile.axes.map(a=>({...a,range:[0,.6]}))};
  const on=!!profile&&!options.thumbnail&&!options.hero&&!options.config?.thumbnail&&!options.config?.hero&&c.switches?.axes!==false;const sig=on?JSON.stringify([profile,c.switches?.grid!==false]):'';
  if(sig!==signature){if(aid){model.group.remove(aid);dispose(aid);aid=null;}if(on){aid=buildAid(profile,c);model.group.add(aid);}signature=sig;}
  if(aid){for(const branch of aid.children){if(branch.userData.axisKey)branch.visible=c.viewMode!=='2d'||(c.viewPlane==='top'?['x','z']:['x','y','u','h']).includes(branch.userData.axisKey);if(branch.userData.coordinateGrid)for(const plane of branch.children)plane.visible=plane.userData.gridPlane===(c.viewMode==='2d'?(c.viewPlane||profile.plane):profile.plane);}}
 };
 model.update=(s,d,c={})=>{update(s,d,c);sync(s,c);};sync(state,options.config||{});return model;
}
