// A genuine 3D apparatus view. Thermal state and scientific decisions stay in the controller.
import * as THREE from '../vendor/three.module.min.js';
import {partitionIcePortions} from './thermal-ice-portions.js?v=89';
import {nearestInstrument} from './thermal-picking.js?v=88';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GEOMETRY,vesselGeometry,cupGeometry,waterLevel,sampleDimensions,cupLiquidGeometry,cupSpoutAt} from './thermal-geometry.js?v=87';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const finite=(n,f=0)=>Number.isFinite(n)?n:f;
const FLOOR=-.082;
const toWorld=p=>new THREE.Vector3((p.x-400)/1000,(348-p.y)/1000,0);
const toCanonical=p=>({x:p.x*1000+400,y:348-p.y*1000});
const english=locale=>/^en/i.test(locale||'');
// The controller validates physical contacts; this bound only keeps pointers
// on the stage and never hides a collision by moving the mesh.
export function constrainPosition(id,p){return{x:clamp(finite(p?.x,400),16,784),y:clamp(finite(p?.y,200),16,464)};}

// Closed geometry uses model SI volumes. A sample void is part of the water
// boundary, so the net signed mesh volume is water mass / density, not the
// larger displaced-water envelope. These meshes never determine a reading.
function trianglesGeometry(vertices){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();return g;}
// Material groups distinguish the actual horizontal free surface from the
// liquid body. The same closed SI triangles remain authoritative for volume;
// no extra disc, minimum fill or enlarged outline is placed over empty water.
function waterSurfaceGroups(geometry){const normals=geometry.getAttribute('normal'),positions=geometry.getAttribute('position'),count=positions?.count||0;if(!normals||!count)return geometry;let top=-Infinity;for(let i=0;i<count;i++)top=Math.max(top,positions.getY(i));const surface=i=>normals.getY(i)>.999&&Math.abs(positions.getY(i)-top)<1e-8?1:0;let start=0,materialIndex=surface(0);for(let i=3;i<=count;i+=3){const next=i<count?surface(i):0;if(i===count||next!==materialIndex){geometry.addGroup(start,i-start,materialIndex);start=i;materialIndex=next;}}return geometry;}
function addTriangle(vertices,a,b,c,normal){const ab=new THREE.Vector3().subVectors(b,a),ac=new THREE.Vector3().subVectors(c,a);if(ab.cross(ac).dot(normal)<0)[b,c]=[c,b];for(const p of [a,b,c])vertices.push(p.x,p.y,p.z);}
const ringAt=(radius,y,count=GEOMETRY.segments)=>Array.from({length:count},(_,i)=>new THREE.Vector3(radius*Math.sin(2*Math.PI*i/count),y,radius*Math.cos(2*Math.PI*i/count)));
function squareAt(w,d,y){return[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>new THREE.Vector3(x,y,z));}
function cap(vertices,outer,hole,up){const contour=outer.map(p=>new THREE.Vector2(p.x,p.z)),holes=hole?[hole.map(p=>new THREE.Vector2(p.x,p.z))]:[],all=[...outer,...(hole||[])],normal=new THREE.Vector3(0,up?1:-1,0);for(const [a,b,c]of THREE.ShapeUtils.triangulateShape(contour,holes))addTriangle(vertices,all[a],all[b],all[c],normal);}
function sides(vertices,lower,upper,inward=false){for(let i=0;i<lower.length;i++){const j=(i+1)%lower.length,normal=lower[i].clone().add(lower[j]);normal.y=0;if(inward)normal.negate();addTriangle(vertices,lower[i],lower[j],upper[j],normal);addTriangle(vertices,lower[i],upper[j],upper[i],normal);}}
export function createCalibratedWaterGeometry(state){
 const vessel=vesselGeometry(state),level=waterLevel(state),height=level.heightM;if(!(state.waterMassKg>0&&height>0))return new THREE.BufferGeometry();
 const vertices=[],bottom=ringAt(vessel.innerRadiusM,0),top=ringAt(vessel.innerRadiusM,height),body=level.objectKind&&level.contact!=='unsupported'?sampleDimensions(state,level.objectKind):null;
 const lo=body?Math.max(0,body.bottomWorldY):0,hi=body?Math.min(height,body.bottomWorldY+body.heightM):0,hasVoid=body&&hi>lo+1e-12;
 const lowSquare=hasVoid?squareAt(body.widthM,body.depthM,lo):null,highSquare=hasVoid?squareAt(body.widthM,body.depthM,hi):null;
 sides(vertices,bottom,top);cap(vertices,bottom,hasVoid&&lo<=1e-12?lowSquare:null,false);cap(vertices,top,hasVoid&&hi>=height-1e-12?highSquare:null,true);
 if(hasVoid){sides(vertices,lowSquare,highSquare,true);if(lo>1e-12)cap(vertices,lowSquare,null,true);if(hi<height-1e-12)cap(vertices,highSquare,null,false);}
 return waterSurfaceGroups(trianglesGeometry(vertices));
}
export function createCupWaterGeometry(state,angle){const shape=cupLiquidGeometry(state,angle),vertices=[];for(const face of shape.faces)for(let i=1;i<face.length-1;i++)for(const p of [face[0],face[i],face[i+1]])vertices.push(p.x,p.y,p.z);return waterSurfaceGroups(trianglesGeometry(vertices));}
// Fit every corner in camera space, including depth and the current viewing
// direction. World-axis height alone can crop an LCD above a focused vessel.
export function fitThermalCameraBounds(bounds,{fov=39,aspect=1,direction=new THREE.Vector3(.1,.38,1),padding=.1,minDistance=.45,maxDistance=2.7}={}){
 if(!bounds?.isBox3||bounds.isEmpty()||![...bounds.min.toArray(),...bounds.max.toArray(),fov,aspect,padding,minDistance,maxDistance].every(Number.isFinite)||fov<=0||fov>=180||aspect<=0||padding<0||padding>=1||minDistance<=0||maxDistance<minDistance)throw new RangeError('Invalid camera bounds');
 const back=new THREE.Vector3(direction.x,direction.y,direction.z);if(!back.lengthSq()||!back.toArray().every(Number.isFinite))throw new RangeError('Invalid camera direction');back.normalize();const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),back);if(right.lengthSq()<1e-12)throw new RangeError('Vertical camera direction');right.normalize();const up=new THREE.Vector3().crossVectors(back,right),target=bounds.getCenter(new THREE.Vector3()),tan=Math.tan(THREE.MathUtils.degToRad(fov/2))*(1-padding);let needed=minDistance;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const relative=new THREE.Vector3(x,y,z).sub(target),depth=relative.dot(back);needed=Math.max(needed,depth+Math.abs(relative.dot(right))/(tan*aspect),depth+Math.abs(relative.dot(up))/tan);}
 const distance=clamp(needed,minDistance,maxDistance);return{target,position:target.clone().addScaledVector(back,distance),distance,limited:needed>maxDistance};
}
function geometryVolume(g){const p=g.getAttribute('position'),index=g.getIndex();if(!p)return 0;let sum=0;const count=index?index.count:p.count,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();for(let i=0;i<count;i+=3){a.fromBufferAttribute(p,index?index.getX(i):i);b.fromBufferAttribute(p,index?index.getX(i+1):i+1);c.fromBufferAttribute(p,index?index.getX(i+2):i+2);sum+=a.dot(b.cross(c))/6;}return Math.abs(sum);}

export function mountThermalThree(host,options={}){
 if(!host?.append)throw new TypeError('A mounted stage host is required');
 const {activity='ice',onMove=()=>{},onDrop=()=>{},onRotate=()=>{},onStir=()=>{},onSelect=()=>{},canStart=()=>true,onCancel=()=>{},onUnavailable=()=>{},onCamera=()=>{},onInteractionState=()=>{}}=options;
 let locale=options.locale||'vi-VN',current={state:options.getState?.()||{},positions:options.positions||{},angle:options.getAngle?.()||0,selected:options.getSelected?.()||'calorimeter',observation:{}},disposed=false,contextLost=false,frame=0,drag=null,mode='apparatus',isDark=false;
 const shell=document.createElement('div');shell.className='l3-three-shell';
 const canvas=document.createElement('canvas');canvas.id='l3ThreeCanvas';canvas.className='l3-three-canvas';canvas.tabIndex=0;canvas.setAttribute('role','group');canvas.setAttribute('aria-describedby','l3GestureHint');
 shell.append(canvas);host.append(shell);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){shell.remove();throw error;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));renderer.setClearColor(0xf3f4f4);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(39,1,.01,8);scene.background=new THREE.Color(0xf3f4f4);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=false;controls.minDistance=.45;controls.maxDistance=2.7;controls.minPolarAngle=.65;controls.maxPolarAngle=1.5;controls.minAzimuthAngle=-.7;controls.maxAzimuthAngle=.7;controls.enablePan=true;controls.screenSpacePanning=true;controls.panSpeed=.65;controls.rotateSpeed=.65;controls.zoomSpeed=.75;controls.target.set(0,.12,0);
 const ambient=new THREE.HemisphereLight(0xffffff,0x657586,1.35);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(-.35,.9,.7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-.65,right:.65,top:.65,bottom:-.55,near:.05,far:3});key.shadow.bias=-.00015;scene.add(key);
 const rim=new THREE.DirectionalLight(0xc2e3ff,1.35);rim.position.set(.6,.6,-.4);scene.add(rim);
 const material=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.54,metalness:.08,...extra});
 const mat={bench:material(0x91bacb),edge:material(0x3c687b,{metalness:.55}),white:material(0xf5f8fa),metal:material(0x7893a5,{roughness:.27,metalness:.7}),dark:material(0x203e50),glass:material(0xcceaf5,{transparent:true,opacity:.13,depthWrite:false,roughness:.12,metalness:.05,side:THREE.DoubleSide}),water:material(0x007ca9,{transparent:true,opacity:.68,depthWrite:false,roughness:.32,metalness:0,side:THREE.FrontSide}),ice:material(0xdff8ff,{transparent:true,opacity:.94,roughness:.22,metalness:.04}),solid:material(0xcd8555,{roughness:.39,metalness:.45}),accent:material(0x087c97,{roughness:.35}),screen:material(0xe4f4df,{roughness:.8}),tip:material(0xe7a259),rubber:material(0x354858),stirrer:material(0x14586a,{roughness:.4,metalness:.16}),grip:material(0xf5b44a,{roughness:.8,metalness:0})};
 // Scientific water is tinted for legibility. Both materials stay transparent
 // and depth-tested so a submerged rod remains visible and can be gripped.
 mat.waterSurface=material(0x05b8df,{transparent:true,opacity:.8,depthWrite:false,roughness:.3,metalness:0,side:THREE.FrontSide});
 // The cup and reservoir keep independent materials: stirring the vessel
 // must not animate another container. All free-surface triangles stay fixed.
 mat.cupSurface=mat.waterSurface.clone();mat.bathWater=mat.water.clone();
 const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)'),mixingUniforms={thermalMixing:{value:0},thermalPhase:{value:0}};
 // A bounded colour glint communicates existing model mixing, not fluid
 // displacement or a measured wave. There is no extra animation loop.
 mat.waterSurface.onBeforeCompile=shader=>{Object.assign(shader.uniforms,mixingUniforms);shader.vertexShader='varying vec3 vThermalSurfacePosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvThermalSurfacePosition = position;');shader.fragmentShader='varying vec3 vThermalSurfacePosition;\nuniform float thermalMixing;\nuniform float thermalPhase;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat thermalRing = 0.5 + 0.5 * sin(length(vThermalSurfacePosition.xz) * 540.0 - thermalPhase * 4.5);\nfloat thermalArc = 0.5 + 0.5 * sin(vThermalSurfacePosition.x * 210.0 + vThermalSurfacePosition.z * 180.0 + thermalPhase * 3.0);\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.98, 1.0), thermalMixing * 0.28 * thermalRing * thermalArc);');};
 mat.waterSurface.customProgramCacheKey=()=> 'thermal-mixing-colour-v93';
 const liquidMaterials=[mat.water,mat.waterSurface];
 const roots={},picks=[],screens=[],disposables=new Set();
 function mesh(geometry,matr,parent,position=[0,0,0]){const m=new THREE.Mesh(geometry,matr);m.position.set(...position);m.castShadow=matr!==mat.glass;m.receiveShadow=true;parent.add(m);return m;}
 function box(w,h,d,matr,parent,pos){return mesh(new THREE.BoxGeometry(w,h,d),matr,parent,pos);}
 function cylinder(radius,height,matr,parent,pos,open=false,segments=32){return mesh(new THREE.CylinderGeometry(radius,radius,height,segments,1,open),matr,parent,pos);}
 function torus(radius,tube,matr,parent,pos,horizontal=true){const m=mesh(new THREE.TorusGeometry(radius,tube,8,40),matr,parent,pos);if(horizontal)m.rotation.x=Math.PI/2;return m;}
 function rod(a,b,radius,matr,parent){const vector=new THREE.Vector3().subVectors(b,a),m=cylinder(radius,vector.length(),matr,parent);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vector.normalize());return m;}
 function target(id){const g=new THREE.Group();g.userData.target=id;scene.add(g);roots[id]=g;picks.push(g);return g;}
 function screen(parent,w,h,pos){const textureCanvas=document.createElement('canvas');textureCanvas.width=512;textureCanvas.height=160;const texture=new THREE.CanvasTexture(textureCanvas);texture.colorSpace=THREE.SRGBColorSpace;const m=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,toneMapped:false}),parent,pos);m.castShadow=false;const s={canvas:textureCanvas,texture,value:'',dark:null};screens.push(s);return s;}
 function setScreen(s,value){if(value===s.value&&s.dark===isDark)return;s.value=value;s.dark=isDark;const c=s.canvas.getContext('2d');c.fillStyle=isDark?'#20382b':'#e4f4df';c.fillRect(0,0,512,160);c.fillStyle=isDark?'#e3f5e6':'#203e2b';c.font='600 94px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(value,256,86,486);s.texture.needsUpdate=true;}
 // Interior dimensions are calibrated; racks, handles and instrument screens
 // remain interaction affordances and are not volumetric measuring instruments.
 const bench=new THREE.Group();scene.add(bench);box(.91,.025,.4,mat.bench,bench,[0,FLOOR-.0125,-.015]);box(.92,.008,.41,mat.edge,bench,[0,FLOOR-.03,-.015]);
 for(const x of [-.39,.39])for(const z of [-.16,.14])box(.025,.14,.025,mat.metal,bench,[x,FLOOR-.11,z]);
 const deck=box(.09,.078,.09,mat.white,scene,[.01,FLOOR+.039,0]);
 const cupStand=box(.12,.008,.12,mat.white,scene,[-.28,.16,0]);box(.06,.008,.08,mat.white,scene,[-.39,FLOOR+.004,-.04]);rod(new THREE.Vector3(-.39,FLOOR+.008,-.04),new THREE.Vector3(-.39,.156,-.04),.005,mat.metal,scene);rod(new THREE.Vector3(-.39,.156,-.04),new THREE.Vector3(-.28,.156,-.04),.004,mat.metal,scene);
 const vessel=target('calorimeter'),vesselDrawing=new THREE.Group();vessel.add(vesselDrawing);const vesselWater=mesh(new THREE.BufferGeometry(),liquidMaterials,vessel,[0,-.088,0]);vesselWater.castShadow=false;
 const floatingIce=box(1,1,1,mat.ice,vessel,[0,0,0]),immersedSolid=box(1,1,1,mat.solid,vessel,[0,0,0]);
 // These touching portions partition the unchanged equivalent ice volume.
 // They do not pretend to be free rigid bodies or a fluid simulation.
 const portionUnit=new THREE.BoxGeometry(1,1,1),portionMesh=new THREE.InstancedMesh(portionUnit,mat.ice,1001);portionMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);portionMesh.count=0;portionMesh.visible=false;portionMesh.frustumCulled=false;portionMesh.castShadow=true;portionMesh.receiveShadow=true;vessel.add(portionMesh);
 const edgeCoordinates=new Float32Array(1001*24*3),portionEdgesGeometry=new THREE.BufferGeometry();portionEdgesGeometry.setAttribute('position',new THREE.BufferAttribute(edgeCoordinates,3).setUsage(THREE.DynamicDrawUsage));portionEdgesGeometry.setDrawRange(0,0);
 const portionEdges=new THREE.LineSegments(portionEdgesGeometry,new THREE.LineBasicMaterial({color:0x338fb7,transparent:true,opacity:.9,depthWrite:false}));portionEdges.visible=false;portionEdges.frustumCulled=false;vessel.add(portionEdges);
 const instanceTransform=new THREE.Matrix4(),instancePosition=new THREE.Vector3(),instanceScale=new THREE.Vector3(),instanceRotation=new THREE.Quaternion(),instanceColor=new THREE.Color();let currentPortions=[],portionKey='',portionStateRef=null;
 const cup=target('cup'),cupDrawing=new THREE.Group();cup.add(cupDrawing);const cupWater=mesh(new THREE.BufferGeometry(),[mat.water,mat.cupSurface],scene);cupWater.castShadow=false;
 let profileKey='',liquidKey='',vesselLiquidKey='',geometryMetadataKey='',vesselWall=null,cupWall=null,vesselCavity=null,cupCavity=null,profileV=null,profileC=null,shapeKey='',shapeCache=null,projectionKey='',canvasLocale='',screenKey='';
 function clearDrawing(group){group.traverse(o=>o.geometry?.dispose());group.clear();}
 function rebuildProfiles(state){const key=[state.config?.capacityM3,state.config?.waterMassKg].join('/');if(key===profileKey)return;const v=vesselGeometry(state),c=cupGeometry(state);profileKey=key;profileV=v;profileC=c;clearDrawing(vesselDrawing);clearDrawing(cupDrawing);
  // Inner and outer surfaces share the exact regular64-gon profile. Their
  // annular lips and bases leave an open mouth rather than a filled cylinder.
  vesselWall=cylinder(v.innerRadiusM,v.innerHeightM,mat.glass,vesselDrawing,[0,0,0],true,v.segments);cylinder(v.outerRadiusM,v.innerHeightM,mat.glass,vesselDrawing,[0,0,0],true,v.segments);
  cylinder(v.outerRadiusM,v.bottomThicknessM,mat.white,vesselDrawing,[0,-.088-v.bottomThicknessM/2,0],false,v.segments);torus((v.innerRadiusM+v.outerRadiusM)/2,v.wallM/2,mat.metal,vesselDrawing,[0,.088,0]);
  for(const sign of [-1,1])rod(new THREE.Vector3(sign*(v.outerRadiusM+.002),-.015,0),new THREE.Vector3(sign*(v.outerRadiusM+.018),.02,0),.003,mat.metal,vesselDrawing);
  for(let i=1;i<6;i++)box(.007,.001,.0014,mat.dark,vesselDrawing,[v.innerRadiusM*.62,-.088+i*v.innerHeightM/6,v.innerRadiusM*.82]);
  cupWall=cylinder(c.innerRadiusM,c.innerHeightM,mat.glass,cupDrawing,[0,0,0],true,c.segments);cylinder(c.outerRadiusM,c.innerHeightM,mat.glass,cupDrawing,[0,0,0],true,c.segments);
  cylinder(c.outerRadiusM,c.bottomLocalY-c.outerBottomY,mat.glass,cupDrawing,[0,(c.bottomLocalY+c.outerBottomY)/2,0],false,c.segments);torus((c.innerRadiusM+c.outerRadiusM)/2,c.wallM/2,mat.metal,cupDrawing,[0,c.topLocalY,0]);
  rod(new THREE.Vector3(c.spoutStart.x,c.spoutStart.y,0),new THREE.Vector3(c.spoutEnd.x,c.spoutEnd.y,0),.003,mat.glass,cupDrawing);
  for(let i=1;i<5;i++)box(.008,.001,.0013,mat.dark,cupDrawing,[c.innerRadiusM*.45,c.bottomLocalY+i*c.innerHeightM/5,c.innerRadiusM*.86]);
  for(const old of [vesselCavity,cupCavity])if(old){old.dispose();disposables.delete(old);}
  vesselCavity=new THREE.CylinderGeometry(v.innerRadiusM,v.innerRadiusM,v.innerHeightM,v.segments);cupCavity=new THREE.CylinderGeometry(c.innerRadiusM,c.innerRadiusM,c.innerHeightM,c.segments);disposables.add(vesselCavity);disposables.add(cupCavity);liquidKey='';vesselLiquidKey='';
 }
 function updatePortions(state,body,shapeSignature){
  const records=state.icePortions,ledgerChanged=records!==portionStateRef,key=shapeSignature+'/'+(state.icePortionsVersion||'legacy');
  if(!ledgerChanged&&key===portionKey)return;portionStateRef=records;portionKey=key;
  currentPortions=state.activity!=='solid'&&state.iceMassKg>0?partitionIcePortions(state):[];
  const multiple=currentPortions.length>1;floatingIce.visible=!multiple&&currentPortions.length===1;portionMesh.visible=multiple;portionEdges.visible=multiple;portionMesh.count=multiple?currentPortions.length:0;
  if(!multiple){portionEdgesGeometry.setDrawRange(0,0);return;}
  let cursor=0;const edges=[[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
  currentPortions.forEach((part,i)=>{const a=part.centerM,b=part.sizeM;instancePosition.set(a.x,-.088+body.centerWorldY+a.y,a.z);instanceScale.set(b.x,b.y,b.z);instanceTransform.compose(instancePosition,instanceRotation,instanceScale);portionMesh.setMatrixAt(i,instanceTransform);instanceColor.set(0xdff8ff).multiplyScalar(i%2?.9:1);portionMesh.setColorAt(i,instanceColor);
   const corners=Array.from({length:8},(_,j)=>[instancePosition.x+(j&1?.5:-.5)*b.x,instancePosition.y+(j&2?.5:-.5)*b.y,instancePosition.z+(j&4?.5:-.5)*b.z]);for(const edge of edges)for(const index of edge)for(const value of corners[index])edgeCoordinates[cursor++]=value;
  });portionMesh.instanceMatrix.needsUpdate=true;if(portionMesh.instanceColor)portionMesh.instanceColor.needsUpdate=true;portionEdgesGeometry.attributes.position.needsUpdate=true;portionEdgesGeometry.setDrawRange(0,cursor/3);
 }
 const rotateGizmo=new THREE.Group();rotateGizmo.userData.target='cup';rotateGizmo.userData.rotate=true;scene.add(rotateGizmo);picks.push(rotateGizmo);const gizmoRing=torus(.014,.003,mat.accent,rotateGizmo,[0,0,0],false);const cone=mesh(new THREE.ConeGeometry(.005,.013,10),mat.accent,rotateGizmo,[.014,.004,0]);cone.rotation.z=-.5;
 // Bath, tray and two tools that can actually transfer the unknown solid.
 const bath=new THREE.Group();scene.add(bath);bath.position.copy(toWorld({x:280,y:280}));
 // An open rectangular bath: sensor/sample can enter the water from above.
 // Its controlled thermal reservoir is not used to infer a sample temperature.
 box(.165,.008,.135,mat.white,bath,[0,-.06,0]);for(const x of [-.0795,.0795])box(.006,.112,.135,mat.glass,bath,[x,0,0]);for(const z of [-.0645,.0645])box(.153,.112,.006,mat.glass,bath,[0,0,z]);box(.153,.074,.123,mat.bathWater,bath,[0,-.019,0]);
 for(const x of [-.075,.075])for(const z of [-.0565,.0565])box(.007,.086,.007,mat.metal,bath,[x,-.107,z]);box(.12,.015,.012,mat.dark,bath,[0,-.063,.071]);

 const tray=box(.255,.008,.08,mat.white,scene,[(622.5-400)/1000,(348-322)/1000,0]);
 const ice=target('ice');const looseIce=box(1,1,1,mat.ice,ice,[0,0,0]);
 const solid=target('solid'),looseSolid=box(1,1,1,mat.solid,solid,[0,0,0]);
 const tongs=target('tongs'),tongsDrawing=new THREE.Group();tongs.add(tongsDrawing);let jawKey='';
 function updateJaws(state,body){const held=state.solid?.location==='tongs',gap=held?body.widthM+.006:body.widthM+.008,key=held+'/'+gap;if(key===jawKey)return;jawKey=key;clearDrawing(tongsDrawing);for(const sign of [-1,1]){rod(new THREE.Vector3(sign*.013,.18,0),new THREE.Vector3(sign*(gap/2+.008),-.012,0),.003,mat.metal,tongsDrawing);rod(new THREE.Vector3(sign*(gap/2+.008),-.012,0),new THREE.Vector3(sign*gap/2,-.025,0),.003,mat.metal,tongsDrawing);}torus(.013,.0025,mat.metal,tongsDrawing,[0,.18,0],false);}
 const stirrer=target('stirrer');rod(new THREE.Vector3(0,.2,0),new THREE.Vector3(0,-.01,0),.004,mat.stirrer,stirrer);cylinder(.005,.04,mat.grip,stirrer,[0,.18,0]);const paddle=box(.014,.014,.006,mat.stirrer,stirrer,[0,-.008,0]);
 const probe=target('probe');rod(new THREE.Vector3(0,0,0),new THREE.Vector3(0,.19,0),.003,mat.metal,probe);mesh(new THREE.SphereGeometry(.005,12,8),mat.tip,probe,[0,0,0]);box(.069,.064,.022,mat.dark,probe,[0,.225,0]);const probeScreen=screen(probe,.058,.028,[0,.228,.012]);
 // Balance positions preserve the accepted pan and LCD geometry and canonical weighing snaps.
 const scale=target('scale');scale.position.set(.275,0,0);box(.15,.043,.11,mat.white,scale,[0,.126,-.005]);cylinder(.027,.039,mat.metal,scale,[0,.166,0]);box(.135,.009,.095,mat.metal,scale,[0,.189,0]);const scaleScreen=screen(scale,.1,.028,[0,.127,.052]);
 // Fixed racks make initially elevated instruments legible as equipment, not levitating props.
 const racks=new THREE.Group();scene.add(racks);for(const x of [-.28,.2,.38]){box(.095,.009,.08,mat.white,racks,[x,FLOOR+.006,-.075]);rod(new THREE.Vector3(x+.035,FLOOR+.01,-.075),new THREE.Vector3(x+.035,.19,-.075),.003,mat.metal,racks);rod(new THREE.Vector3(x-.035,.19,-.075),new THREE.Vector3(x+.035,.19,-.075),.003,mat.metal,racks);}
 for(const x of [.2,.38])rod(new THREE.Vector3(x,.19,-.075),new THREE.Vector3(x,.19,0),.003,mat.metal,racks);
 let stream=mesh(new THREE.CylinderGeometry(.0025,.003,.1,10),mat.water,scene);stream.visible=false;stream.castShadow=false;

 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),projected=new THREE.Vector3();
 function rootOf(object){while(object&&!object.userData.target)object=object.parent;return object;}
 function visible(object){while(object){if(!object.visible)return false;object=object.parent;}return true;}
 function point(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const p=new THREE.Vector3();return raycaster.ray.intersectPlane(plane,p)?toCanonical(p):null;}
 function projectWorld(p,r=canvas.getBoundingClientRect()){projected.copy(p).project(camera);return{x:r.left+(projected.x+1)*r.width/2,y:r.top+(1-projected.y)*r.height/2,visible:projected.z>-1&&projected.z<1};}
 function projectPoint(p){return projectWorld(toWorld(p));}
 function projectTarget(id,part,r){if(id==='cup'&&(part==='rotate'||part?.part==='rotate'))return projectWorld(rotateGizmo.position,r);const obj=roots[id];if(!obj)return null;const p=obj.position.clone();if(id==='scale')p.set(.275,.127,.054);return projectWorld(p,r);}
 function pick(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(picks,true).filter(hit=>visible(hit.object)),chosen=options.getSelected?.()||current.selected;
  const gizmo=projectWorld(rotateGizmo.position,r);if(rotateGizmo.visible&&Math.hypot(gizmo.x-event.clientX,gizmo.y-event.clientY)<=22.5)return rotateGizmo;
  // Transparent water and glass must not capture a hand reaching for a tool.
  // Opaque rims, samples and apparatus still occlude tools behind them.
  const blocks=hit=>{const m=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex||0]:hit.object.material;return !m?.transparent||m.opacity>=1;},handheld=id=>['stirrer','probe','tongs'].includes(id),chosenIndex=hits.findIndex(hit=>rootOf(hit.object)?.userData.target===chosen);
  // A palette choice disambiguates two handheld tools sharing the same pixels.
  // It never reaches through opaque vessel rims, balances or samples.
  if(handheld(chosen)&&chosenIndex>=0&&!hits.slice(0,chosenIndex).some(hit=>blocks(hit)&&!handheld(rootOf(hit.object)?.userData.target)))return rootOf(hits[chosenIndex].object);
  const opaque=hits.find(blocks),front=opaque&&rootOf(opaque.object);
  if(front&&!['calorimeter','cup'].includes(front.userData.target))return front;
  const shafts=[];for(const [id,lo,hi]of [['stirrer',-.01,.2],['probe',0,.19]]){const obj=roots[id];if(!obj||!visible(obj))continue;shafts.push({id,obj,a:projectWorld(obj.localToWorld(new THREE.Vector3(0,lo,0)),r),b:projectWorld(obj.localToWorld(new THREE.Vector3(0,hi,0)),r)});}
  const shaft=nearestInstrument({x:event.clientX,y:event.clientY},shafts,chosen);if(shaft&&(!front||front===shaft.obj))return shaft.obj;
  if(front)return front;
  // 44px touch allowance for small free apparatus, without crossing opaque hits.
  const small=[];for(const [id,obj]of Object.entries(roots)){if(!visible(obj))continue;const p=projectTarget(id,undefined,r);if(p?.visible)small.push({id,obj,a:p,b:p});}
  const near=nearestInstrument({x:event.clientX,y:event.clientY},small,chosen);if(near)return near.obj;
  return hits.length?rootOf(hits[0].object):null;
 }
 function pointerDown(event){if(disposed||contextLost||mode==='orbit'||event.button!==0||!event.isPrimary)return;const picked=pick(event);if(!picked)return;const id=picked.userData.target;event.preventDefault();event.stopImmediatePropagation();onSelect(id);if(!canStart(id))return;const p=point(event),origin=current.positions[id];if(!p||!origin)return;controls.enabled=false;canvas.focus({preventScroll:true});drag={id,pointerId:event.pointerId,start:{...origin},offset:{x:origin.x-p.x,y:origin.y-p.y},rotate:picked.userData.rotate||event.altKey,angle:current.angle,initial:Math.atan2(p.x-origin.x,origin.y-p.y),winding:0,lastAngle:null};canvas.setPointerCapture(event.pointerId);shell.dataset.dragging=id;onInteractionState(true);}
 function pointerMove(event){if(!drag||drag.pointerId!==event.pointerId)return;event.preventDefault();event.stopImmediatePropagation();const p=point(event);if(!p)return;const d=drag;if(d.rotate){let delta=Math.atan2(p.x-d.start.x,d.start.y-p.y)-d.initial;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;onRotate(d.id,clamp(d.angle+delta,0,100*Math.PI/180));}else{const next=constrainPosition(d.id,{x:p.x+d.offset.x,y:p.y+d.offset.y});onMove(d.id,next);if(d.id==='stirrer'){const state=options.getState?.()||current.state,surface=waterLevel(state).canonicalY,center={x:410,y:(surface+342)/2},dx=current.positions[d.id].x-center.x,dy=current.positions[d.id].y+10-center.y,radius=Math.hypot(dx,dy);if(radius>=8&&radius<=95){const a=Math.atan2(dy,dx);if(d.lastAngle!==null){let delta=a-d.lastAngle;while(delta>Math.PI)delta-=Math.PI*2;while(delta<-Math.PI)delta+=Math.PI*2;d.winding+=delta;if(Math.abs(d.winding)>=Math.PI/2){onStir(Math.abs(d.winding)/(2*Math.PI));d.winding=0;}}d.lastAngle=a;}else{d.lastAngle=null;d.winding=0;}}}requestRender();}
 function finish(event,cancel=false){if(!drag||event?.pointerId!==undefined&&drag.pointerId!==event.pointerId)return;const d=drag;drag=null;delete shell.dataset.dragging;controls.enabled=true;try{if(canvas.hasPointerCapture(d.pointerId))canvas.releasePointerCapture(d.pointerId);}catch{}try{if(cancel){onMove(d.id,d.start);onCancel(d.id);}else onDrop(d.id,current.positions[d.id]||d.start,d.start);}finally{onInteractionState(false);requestRender();}}
 function cancel(){finish({},true);}
 const pointerUp=e=>finish(e),pointerCancel=e=>finish(e,true),lostCapture=e=>finish(e,true);
 canvas.addEventListener('pointerdown',pointerDown,true);canvas.addEventListener('pointermove',pointerMove,true);canvas.addEventListener('pointerup',pointerUp,true);canvas.addEventListener('pointercancel',pointerCancel,true);canvas.addEventListener('lostpointercapture',lostCapture,true);
 function keyboard(event){if(event.altKey&&event.key.startsWith('Arrow')){event.preventDefault();autoFit=false;focusedId=null;const offset=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(offset);s.theta=clamp(s.theta+(event.key==='ArrowLeft'?-.09:event.key==='ArrowRight'?.09:0),-.7,.7);s.phi=clamp(s.phi+(event.key==='ArrowUp'?-.08:event.key==='ArrowDown'?.08:0),.65,1.5);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();onCamera(getCamera());requestRender();}else if(event.key==='Escape')cancel();}
 canvas.addEventListener('keydown',keyboard);
 function getCamera(){return{position:camera.position.toArray(),target:controls.target.toArray(),...(focusedId?{focusId:focusedId}:{})};}
 function validCamera(c){return c&&['position','target'].every(k=>Array.isArray(c[k])&&c[k].length===3&&c[k].every(n=>Number.isFinite(n)&&Math.abs(n)<4))&&new THREE.Vector3(...c.position).distanceTo(new THREE.Vector3(...c.target))>=.3;}
 function fit(){autoFit=true;focusedId=null;const aspect=camera.aspect||1;controls.target.set(0,.13,0);const distance=Math.max(.93,.97/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*aspect));camera.position.set(distance*.1,.13+distance*.38,distance);controls.update();onCamera(getCamera());requestRender();}
 function zoom(factor){if(!(factor>0&&Number.isFinite(factor)))return;autoFit=false;focusedId=null;const offset=camera.position.clone().sub(controls.target);offset.setLength(clamp(offset.length()/factor,.45,2.7));camera.position.copy(controls.target).add(offset);controls.update();onCamera(getCamera());requestRender();}
 function focusTool(id){if(!Object.hasOwn(roots,id))return false;const object=id==='solid'&&immersedSolid.visible?immersedSolid:id==='ice'&&!ice.visible?(portionMesh.visible?portionMesh:floatingIce):roots[id];if(!object||!visible(object))return false;if(drag)cancel();scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(object);
  if(id==='calorimeter'&&current.state?.vesselPlaced){const g=vesselGeometry(current.state);for(const name of ['probe','stirrer']){const p=current.positions[name],tip=p&&p.y+(name==='stirrer'?10:0);if(p&&visible(roots[name])&&Math.abs(p.x-g.centerCanonicalX)<g.innerApothemM*1000&&tip>=g.rimCanonicalY&&tip<=g.bottomCanonicalY)bounds.union(new THREE.Box3().setFromObject(roots[name]));}}
  const view=fitThermalCameraBounds(bounds,{fov:camera.fov,aspect:camera.aspect,direction:camera.position.clone().sub(controls.target)});autoFit=false;focusedId=id;controls.target.copy(view.target);camera.position.copy(view.position);controls.update();onCamera(getCamera());requestRender();return true;}

 function setCameraMode(value){mode=value==='orbit'?'orbit':'apparatus';if(drag)cancel();shell.dataset.cameraMode=mode;canvas.style.cursor=mode==='orbit'?'grab':'default';}
 let initialFit=false,autoFit=true,lastSize='',focusedId=null;
 // CSS owns the visible stage height. Read that exact box for the drawing
 // buffer and perspective so a compact stage never stretches the apparatus.
 function resize(){if(disposed)return;const r=shell.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);const signature=w.toFixed(2)+'/'+h.toFixed(2);if(signature===lastSize)return;lastSize=signature;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(!initialFit){initialFit=true;if(validCamera(options.initialCamera)){autoFit=false;camera.position.fromArray(options.initialCamera.position);controls.target.fromArray(options.initialCamera.target);focusedId=Object.hasOwn(roots,options.initialCamera.focusId)?options.initialCamera.focusId:null;controls.update();}else fit();}else if(autoFit)fit();else if(focusedId&&!drag)focusTool(focusedId);requestRender();}
 const bathTint=new THREE.Color();
 function updateGraphicState(){const s=current.state||{},heat=clamp((finite(s.config?.bathTempC)-finite(s.config?.ambientTempC,22))/70,0,1);mat.bathWater.color.copy(mat.water.color).lerp(bathTint.set(isDark?0xf3ac43:0xf5ad32),heat);mixingUniforms.thermalMixing.value=motionPreference.matches||!(s.waterMassKg>0)?0:clamp(finite(s.mixingIntensity),0,1);mixingUniforms.thermalPhase.value=finite(s.timeS);}
 const motionChanged=()=>{updateGraphicState();requestRender();};motionPreference.addEventListener('change',motionChanged);
 function theme(){const dark=document.documentElement.dataset.appearance==='dark';if(dark===isDark)return;isDark=dark;scene.background.set(dark?0x212121:0xf3f4f4);mat.bench.color.set(dark?0x37474f:0x91bacb);mat.white.color.set(dark?0xb7c7cc:0xf5f8fa);mat.glass.color.set(dark?0x9bd8eb:0xcceaf5);mat.water.color.set(dark?0x009bc9:0x007ca9);mat.waterSurface.color.set(dark?0x30d0ed:0x05b8df);mat.cupSurface.color.copy(mat.waterSurface.color);mat.stirrer.color.set(dark?0xaddce0:0x14586a);mat.edge.color.set(dark?0x749bae:0x3c687b);ambient.intensity=dark?1.5:1.35;key.intensity=dark?2.4:2.6;updateGraphicState();for(const s of screens){s.dark=null;setScreen(s,s.value);}requestRender();}
 function labelLayout(){const r=canvas.getBoundingClientRect(),e=english(locale);if(canvasLocale!==locale){canvasLocale=locale;canvas.setAttribute('aria-label',e?'3D thermal apparatus. Grip an instrument along its shaft and drag. Use the apparatus buttons for keyboard operation.':'Dụng cụ nhiệt 3D. Cầm dọc thân dụng cụ rồi kéo. Dùng bảng dụng cụ để thao tác bằng bàn phím.');}
  const vp=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),key=[r.left,r.top,r.width,r.height,...vp.elements,...Object.values(roots).flatMap(obj=>[visible(obj)?1:0,...obj.position.toArray()]),...rotateGizmo.position.toArray()].join('/');if(key===projectionKey)return;projectionKey=key;
  const targets={};for(const[id,obj]of Object.entries(roots))if(visible(obj))targets[id]=projectTarget(id,undefined,r);targets['cup-rotate']=projectTarget('cup','rotate',r);canvas.dataset.projections=JSON.stringify({targets,matrix:vp.toArray(),viewport:{left:r.left,top:r.top,width:r.width,height:r.height},canonical:{xOrigin:400,yOrigin:348,scale:.001}});
 }
 function requestRender(){if(!frame&&!disposed&&!contextLost)frame=requestAnimationFrame(render);}
 function render(){frame=0;if(disposed||contextLost)return;controls.update();renderer.render(scene,camera);labelLayout();let meshCount=0;scene.traverse(o=>{if(o.isMesh&&visible(o))meshCount++;});canvas.dataset.stats=JSON.stringify({meshCount,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,contextLost,disposed});}
 function update(next={}){if(disposed)return;current={...current,...next};locale=next.locale||locale;const s=current.state||{},p=current.positions||{},angle=finite(current.angle);for(const [id,g]of Object.entries(roots)){if(id==='scale')continue;if(p[id])g.position.copy(toWorld(p[id]));}cup.rotation.z=-angle;rotateGizmo.position.copy(toWorld({x:finite(p.cup?.x,120)+88,y:finite(p.cup?.y,130)+45}));rotateGizmo.visible=current.selected==='cup';
  rebuildProfiles(s);const v=profileV,c=profileC,nextShapeKey=[v.capacityM3,finite(s.waterMassKg),finite(s.iceMassKg),s.solid?.location,s.solid?.massKg,s.config?.solidDensityKgM3].join('/');if(nextShapeKey!==shapeKey){shapeKey=nextShapeKey;shapeCache={level:waterLevel(s),iceBody:sampleDimensions(s,'ice'),solidBody:sampleDimensions(s,'solid')};}const{level,iceBody,solidBody}=shapeCache;
  const vk=[v.capacityM3,finite(s.waterMassKg),finite(s.iceMassKg),s.solid?.location,solidBody.massKg,solidBody.densityKgM3].join('/');if(vk!==vesselLiquidKey){vesselLiquidKey=vk;vesselWater.geometry.dispose();vesselWater.geometry=createCalibratedWaterGeometry(s);}vesselWater.visible=finite(s.waterMassKg)>0;
  floatingIce.scale.set(iceBody.widthM,iceBody.heightM,iceBody.depthM);floatingIce.position.set(0,-.088+iceBody.centerWorldY,0);updatePortions(s,iceBody,nextShapeKey);
  immersedSolid.visible=activity==='solid'&&s.solid?.location==='water';immersedSolid.scale.set(solidBody.widthM,solidBody.heightM,solidBody.depthM);immersedSolid.position.set(0,-.088+solidBody.centerWorldY,0);looseSolid.scale.set(solidBody.widthM,solidBody.heightM,solidBody.depthM);updateJaws(s,solidBody);
  const pieceMass=Math.max(0,finite(s.heldIceMassKg,finite(s.config?.icePieceMassKg,.02)));ice.visible=activity==='ice'&&pieceMass>0&&finite(s.iceTrayMassKg)+1e-12>=pieceMass;const side=Math.cbrt(pieceMass/GEOMETRY.iceDensityKgM3);looseIce.scale.setScalar(side);solid.visible=activity==='solid'&&s.solid?.location!=='water';tongs.visible=activity==='solid';bath.visible=activity==='solid';tray.visible=activity==='ice';
  const fraction=clamp(finite(s.cupWaterMassKg)/(GEOMETRY.waterDensityKgM3*c.capacityM3),0,1),lk=[c.capacityM3,finite(s.cupWaterMassKg),angle].join('/');cupWater.visible=fraction>0;if(lk!==liquidKey){liquidKey=lk;cupWater.geometry.dispose();cupWater.geometry=createCupWaterGeometry(s,angle);}cupWater.position.copy(cup.position);
  const metadataKey=[vk,lk,pieceMass,currentPortions.map(p=>p.massKg).join(',')].join('/');if(metadataKey!==geometryMetadataKey){geometryMetadataKey=metadataKey;canvas.dataset.geometry=JSON.stringify({units:'m',segments:GEOMETRY.segments,vessel:{capacityM3:v.capacityM3,innerRadiusM:v.innerRadiusM,innerHeightM:v.innerHeightM,cavityMeshVolumeM3:geometryVolume(vesselCavity),waterMeshVolumeM3:geometryVolume(vesselWater.geometry),waterMeshKind:'net-fluid-with-sample-void',freeSurfaceEnvelopeVolumeM3:level.heightM*v.areaM2,waterHeightM:level.heightM,waterContact:level.contact,valid:level.valid,reason:level.reason},cup:{capacityM3:c.capacityM3,innerRadiusM:c.innerRadiusM,innerHeightM:c.innerHeightM,cavityMeshVolumeM3:geometryVolume(cupCavity),waterMeshVolumeM3:geometryVolume(cupWater.geometry)},ice:{kind:currentPortions.length>1?'partitioned-equivalent-block':'immersed-equivalent-block',portionCount:currentPortions.length,widthM:iceBody.widthM,heightM:iceBody.heightM,depthM:iceBody.depthM},sourceIce:{kind:'selected-cube',massKg:pieceMass,sideM:side},solid:{widthM:solidBody.widthM,heightM:solidBody.heightM,depthM:solidBody.depthM}});}
  const obs=current.observation||{},valid=['water','bath','solid'].includes(s.probe?.placement)&&obs.valid===true,reading=valid?obs.displayTemperatureC??obs.temperatureC:null,nextScreenKey=[locale,reading,obs.scaleReadingKg].join('/');if(nextScreenKey!==screenKey){screenKey=nextScreenKey;const nf=new Intl.NumberFormat(english(locale)?'en-US':'vi-VN',{minimumFractionDigits:1,maximumFractionDigits:1});setScreen(probeScreen,Number.isFinite(reading)?nf.format(reading)+'°C':'— °C');setScreen(scaleScreen,Number.isFinite(obs.scaleReadingKg)?nf.format(obs.scaleReadingKg*1000)+' g':'— g');}
  stream.visible=current.flowing===true&&fraction>0;if(stream.visible){const start=new THREE.Vector3(c.spoutEnd.x,c.spoutEnd.y,0).applyAxisAngle(new THREE.Vector3(0,0,1),-angle).add(cup.position),end=toWorld(current.flowEnd||{x:finite(p.cup?.x,120),y:426}),length=start.distanceTo(end);stream.position.copy(start).add(end).multiplyScalar(.5);stream.scale.y=Math.max(.0001,length/.1);stream.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize());}
  deck.visible=true;theme();updateGraphicState();if(next.paintNow){if(frame)cancelAnimationFrame(frame);frame=0;render();}else requestRender();
 }
 const cameraStarted=()=>{autoFit=false;focusedId=null;},cameraChanged=()=>requestRender(),cameraEnd=()=>{if(!disposed){onCamera(getCamera());requestRender();}};controls.addEventListener('start',cameraStarted);controls.addEventListener('change',cameraChanged);controls.addEventListener('end',cameraEnd);
 const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(shell);const themeObserver=new MutationObserver(theme);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-appearance']});
 function contextLoss(event){event.preventDefault();contextLost=true;cancel();if(frame)cancelAnimationFrame(frame);frame=0;canvas.dataset.stats=JSON.stringify({contextLost:true,disposed:false});onUnavailable('webgl-context-lost');}
 let scrollFrame=0;const scroll=()=>{if(!scrollFrame&&!disposed)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;if(!disposed)labelLayout();});};window.addEventListener('scroll',scroll,{capture:true,passive:true});
 canvas.addEventListener('webglcontextlost',contextLoss);window.addEventListener('blur',cancel);
 function snapshotGeometry(geometry,matrix){const p=geometry?.getAttribute('position'),indices=geometry?.getIndex();if(!p)return{positions:[],indices:[]};const point=new THREE.Vector3(),positions=[];for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i);if(matrix)point.applyMatrix4(matrix);positions.push(point.x,point.y,point.z);}return{positions,indices:indices?Array.from(indices.array):null};}
 Object.defineProperty(canvas,'thermalGeometry',{configurable:true,get(){if(disposed)return{disposed:true};scene.updateMatrixWorld(true);return{coordinateFrame:'world',units:'m',vesselInnerWall:snapshotGeometry(vesselWall?.geometry,vesselWall?.matrixWorld),cupInnerWall:snapshotGeometry(cupWall?.geometry,cupWall?.matrixWorld),vesselCavity:snapshotGeometry(vesselCavity,vessel.matrixWorld),cupCavity:snapshotGeometry(cupCavity,cup.matrixWorld),vesselWater:{...snapshotGeometry(vesselWater.geometry,vesselWater.matrixWorld),visible:vesselWater.visible},cupWater:{...snapshotGeometry(cupWater.geometry,cupWater.matrixWorld),visible:cupWater.visible},ice:floatingIce.visible?{...snapshotGeometry(floatingIce.geometry,floatingIce.matrixWorld),visible:true}:null,iceParts:currentPortions.map((part,i)=>{const matrix=new THREE.Matrix4();if(portionMesh.visible){portionMesh.getMatrixAt(i,matrix);matrix.premultiply(portionMesh.matrixWorld);}else matrix.copy(floatingIce.matrixWorld);return{...snapshotGeometry(portionUnit,matrix),id:part.id,origin:part.origin,massKg:part.massKg,volumeM3:part.volumeM3,visible:true};}),iceAggregate:currentPortions.length?{...snapshotGeometry(floatingIce.geometry,floatingIce.matrixWorld),kind:'equivalent-aggregate-envelope',visible:floatingIce.visible}:null,solid:immersedSolid.visible?{...snapshotGeometry(immersedSolid.geometry,immersedSolid.matrixWorld),visible:true}:null,looseIce:{...snapshotGeometry(looseIce.geometry,looseIce.matrixWorld),visible:ice.visible},looseSolid:{...snapshotGeometry(looseSolid.geometry,looseSolid.matrixWorld),visible:solid.visible}};}});
 resize();update(current);if(focusedId)focusTool(focusedId);
 function destroy(){if(disposed)return;cancel();disposed=true;if(frame)cancelAnimationFrame(frame);resizeObserver.disconnect();themeObserver.disconnect();motionPreference.removeEventListener('change',motionChanged);window.removeEventListener('blur',cancel);window.removeEventListener('scroll',scroll,true);if(scrollFrame)cancelAnimationFrame(scrollFrame);controls.removeEventListener('start',cameraStarted);controls.removeEventListener('change',cameraChanged);controls.removeEventListener('end',cameraEnd);controls.dispose();canvas.removeEventListener('pointerdown',pointerDown,true);canvas.removeEventListener('pointermove',pointerMove,true);canvas.removeEventListener('pointerup',pointerUp,true);canvas.removeEventListener('pointercancel',pointerCancel,true);canvas.removeEventListener('lostpointercapture',lostCapture,true);canvas.removeEventListener('keydown',keyboard);canvas.removeEventListener('webglcontextlost',contextLoss);scene.traverse(o=>{if(o.geometry)disposables.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){disposables.add(m);if(m.map)disposables.add(m.map);}});for(const d of disposables)d.dispose?.();renderer.dispose();renderer.forceContextLoss();canvas.dataset.stats=JSON.stringify({disposed:true,contextLost});shell.remove();}
 return{update,destroy,zoom,fit,focusTool,getCamera,setCameraMode,cancel,projectPoint,projectTarget,constrainPosition};
}
