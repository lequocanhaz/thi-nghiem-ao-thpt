import {T,V,label} from './geometry-kit.js?v=35';
import {buildOpticsGeometry,OPTICS_IDS} from './optics-geometry-v65.js?v=65';

export {OPTICS_IDS};
const colors={incident:0xd98220,inside:0x087f89,emergent:0x2468cc,reflected:0xba4255,virtual:0x8656bd,guide:0x65758b,normal:0x65758b};
const finite=Number.isFinite;
const material=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,side:T.DoubleSide});
// A keyed pool retains WebGL geometry/materials while an input is being driven.
// Inactive alternatives (e.g. virtual rays or zero-power lens outlines) are hidden.
function begin(parent){parent.userData.opticsCursor=0;for(const child of parent.children)child.visible=false;}
function retained(parent,kind,create,key){
 const cache=parent.userData.opticsPool||(parent.userData.opticsPool=new Map());
 const slot=key||kind+':'+parent.userData.opticsCursor++;let node=cache.get(slot);
 if(!node){node=create();cache.set(slot,node);parent.add(node);}
 node.visible=true;return node;
}
function partGroup(parent,key){const part=retained(parent,'group',()=>new T.Group(),key);part.name=key;begin(part);return part;}
function line(group,points,color=colors.guide,dashed=false,variant=''){
 const result=retained(group,(dashed?'dashed':'line')+variant,()=>new T.Line(new T.BufferGeometry(),dashed?new T.LineDashedMaterial({color,dashSize:.10,gapSize:.06}):new T.LineBasicMaterial({color})));
 const geometry=result.geometry;let position=geometry.attributes.position;
 if(!position||position.count!==points.length){position=new T.BufferAttribute(new Float32Array(points.length*3),3);geometry.setAttribute('position',position);}
 points.forEach((p,i)=>position.setXYZ(i,p.x,p.y,p.z));position.needsUpdate=true;
 geometry.computeBoundingSphere();result.material.color.setHex(color);
 if(dashed){let distances=geometry.attributes.lineDistance;if(!distances||distances.count!==points.length){distances=new T.BufferAttribute(new Float32Array(points.length),1);geometry.setAttribute('lineDistance',distances);}let distance=0;points.forEach((p,i)=>{if(i)distance+=p.distanceTo(points[i-1]);distances.setX(i,distance);});distances.needsUpdate=true;}
 return result;
}
function solid(group,from,to,color,radius=.024){
 const direction=to.clone().sub(from),length=direction.length();
 const mesh=retained(group,'cylinder',()=>new T.Mesh(new T.CylinderGeometry(1,1,1,10),material(color)));
 mesh.material.color.setHex(color);mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.set(radius,length,radius);
 mesh.quaternion.setFromUnitVectors(V(0,1,0),length>1e-12?direction.normalize():V(0,1,0));return mesh;
}
function box(group,width,height,depth,color,opacity=1){
 const mesh=retained(group,'box',()=>new T.Mesh(new T.BoxGeometry(1,1,1),material(color,opacity)));
 mesh.scale.set(width,height,depth);mesh.material.color.setHex(color);mesh.material.opacity=opacity;mesh.material.transparent=opacity<1;mesh.material.depthWrite=opacity===1;return mesh;
}
function sphere(group,radius,color){
 const mesh=retained(group,'sphere',()=>new T.Mesh(new T.SphereGeometry(1,12,8),material(color)));
 mesh.material.color.setHex(color);mesh.scale.setScalar(radius);return mesh;
}
function directionHead(group,from,to,color){
 const delta=to.clone().sub(from),length=delta.length();if(length<.18)return;
 const height=Math.min(.14,length*.18),head=retained(group,'cone',()=>new T.Mesh(new T.ConeGeometry(.38,1,10),material(color)));
 head.scale.setScalar(height);head.material.color.setHex(color);head.position.copy(from).addScaledVector(delta,.59);head.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());
 head.userData.opticsDirection=true;
}
function caption(group,text,position,options,offset=[0,-16]){
 if(!text||typeof document==='undefined'||options.labels===false)return null;
 const sprite=retained(group,'label',()=>label(null,text,position,{...options,labels:true,width:256,height:96,fontSize:36,fontWeight:600,pixelSize:12,pixelOffset:offset,scale:[.9,.34]}));
 if(sprite){sprite.position.copy(position);sprite.userData.pixelAnchor.copy(position);sprite.userData.pixelOffset=offset;sprite.userData.setText(text);sprite.userData.opticsLabel=true;}return sprite;
}
function lensShape(height,width,sign){
 const shape=new T.Shape(),h=height/2,w=width/2;
 if(sign<0){shape.moveTo(-w,-h);shape.lineTo(w,-h);shape.quadraticCurveTo(-w*.45,0,w,h);shape.lineTo(-w,h);shape.quadraticCurveTo(w*.45,0,-w,-h);}
 else if(sign>0){shape.moveTo(0,-h);shape.quadraticCurveTo(width,0,0,h);shape.quadraticCurveTo(-width,0,0,-h);}
 else{shape.moveTo(-w,-h);shape.lineTo(w,-h);shape.lineTo(w,h);shape.lineTo(-w,h);shape.closePath();}
 return shape;
}
/** A diagram is projected with one metric scale for both axes. Optical thickness,
 * ray width, supports and marker heads are schematic; focal/object/image positions
 * and ray slopes are the pure physical geometry, without coordinate clamping. */
export function buildOpticsModel(id,state,data,options={}){
 if(!OPTICS_IDS.includes(id))throw Error('Unknown optics scene '+id);
 const group=new T.Group();group.name='optics-scene-'+id;
 const apparatus=new T.Group();apparatus.name='optics-apparatus';group.add(apparatus);
 let signature='';
 const model={group,update(s,d,config={}){
  // Clock-only updates are free; driven parameter changes retain primitives and
  // position/dash buffers, so controlled playback does not rebuild WebGL meshes.
  const next=JSON.stringify(Object.entries(s).filter(([key])=>key!=='t'))+'|'+(options.labels!==false)+'|'+(config.switches?.labels!==false);
  if(next===signature)return;signature=next;
  begin(apparatus);
  const geometry=buildOpticsGeometry(id,s,d),b=geometry.bounds;
  const width=Math.max(b.maxX-b.minX,1e-9),height=Math.max(b.maxY-b.minY,1e-9),scale=Math.min(7/width,4.3/height);
  const origin={x:(b.minX+b.maxX)/2,y:(b.minY+b.maxY)/2};
  const project=(p,z=.1)=>V((p.x-origin.x)*scale,1.9+(p.y-origin.y)*scale,z);
  const distance=value=>value*scale;
  const labelOptions={...options,labels:options.labels!==false&&config.switches?.labels!==false};
  const addLine=(from,to,color=colors.guide,dashed=false,z=.02)=>line(apparatus,[project(from,z),project(to,z)],color,dashed);
  // The optical axis is a quiet reference through the actual lens centres.
  if(finite(geometry.axisY)){
   const axis=addLine({x:b.minX,y:geometry.axisY},{x:b.maxX,y:geometry.axisY},0x8d9bac,true,-.04);axis.name='optics-axis';axis.userData.opticsAxis={y:geometry.axisY};
  }
  const opticalElements=geometry.elements||[],lenses=opticalElements.filter(e=>e.type==='lens');
  const railY=Math.min(...lenses.map(e=>project({x:e.x,y:(e.y||0)-(e.height||height*.7)/2}).y),1)-.24;
  if(lenses.length){
   const rail=solid(apparatus,V(-3.5,railY,-.2),V(3.5,railY,-.2),0x8194aa,.035);rail.name='optics-bench';
   for(const x of [-3.2,3.2]){const foot=box(apparatus,.32,.11,.6,0x5e718a);foot.position.set(x,railY-.08,-.2);}
  }
  for(const e of opticalElements){
   const part=partGroup(apparatus,'optics-'+e.type+'-'+e.id);part.userData.opticsElement=e;
   const p=project({x:e.x||0,y:e.y||0},0);
   if(e.type==='medium'){
    const w=distance(e.width),h=distance(e.height),color=e.role==='cladding'?0xc2b49c:e.id==='upper'?0xb2c6db:0x68b4cd,body=box(part,w,h,.34,color,e.id==='upper'?.12:.28);
    body.position.copy(p);body.position.z=-.25;body.renderOrder=-2;
    // Media are named outside the ray junction, where a short symbol stays readable.
    const mediumSymbol=e.role==='core'?'n₁':e.role==='cladding'?'n₂':e.id==='upper'?'n₁':e.id==='lower'?'n₂':'n';
    caption(part,e.label||mediumSymbol,p.clone().add(V(w*.32,h*.32,.05)),labelOptions,[0,0]);
   }else if(e.type==='lens'){
    const h=distance(e.height),index=lenses.indexOf(e),samePlane=lenses.some(other=>other!==e&&Math.abs(other.x-e.x)<1e-8),profileWidth=samePlane?.13+.10*index:.16,sign=finite(e.power)?Math.sign(e.power):finite(e.focal)?Math.sign(e.focal):1;
    const glass=retained(part,'lens-'+sign+'-'+profileWidth,()=>new T.Mesh(new T.ExtrudeGeometry(lensShape(1,profileWidth,sign),{depth:.16,bevelEnabled:false,curveSegments:24}),material(index%2?0x9c86d0:0x4ca7bd,.43)));glass.scale.y=h;
    glass.position.copy(p).add(V(0,0,-.10));
    const outline=retained(part,'outline-'+sign,()=>new T.Line(new T.BufferGeometry().setFromPoints(lensShape(1,profileWidth,sign).getPoints(48).map(q=>V(q.x,q.y,.025))),new T.LineBasicMaterial({color:index%2?0x7753a9:0x247f9b})));
    outline.position.copy(p);outline.scale.y=h;outline.name='optics-lens-outline';
    const mount=solid(part,V(p.x,p.y-h/2,-.16),V(p.x,railY,-.16),0x62748b,.028);mount.name='optics-lens-support';
    const symbol=lenses.length===1?'L':index===0?'L₁':'L₂';
    if(h<.55){
     // A symbolic holder keeps a small objective discoverable. Its aperture is
     // not a measured model input; the glass and every ray retain metric scale.
     const half=.275;for(const side of [-1,1]){line(part,[V(p.x-.10,p.y+side*half,-.12),V(p.x+.10,p.y+side*half,-.12)],0x62748b);}
     const holder=solid(part,V(p.x,p.y-half,-.15),V(p.x,p.y+half,-.15),0x62748b,.027);holder.name='optics-symbolic-lens-mount';holder.userData.opticsSchematic='lens-mount';
    }
    caption(part,symbol,p.clone().add(V(0,Math.max(h/2,.275)+.1,.15)),labelOptions,[samePlane?(index===0?-20:20):0,-14]);
   }else if(e.type==='interface'||e.type==='mirror'){
    const a=project(e.from),z=project(e.to),mirror=e.type==='mirror';
    solid(part,a,z,mirror?0x5c728a:0x3c7f94,mirror?.045:.022);
    if(mirror){
     const delta=z.clone().sub(a),normal=V(-delta.y,delta.x,0).normalize();
     for(let j=1;j<12;j++){const anchor=a.clone().lerp(z,j/12);line(part,[anchor.clone().addScaledVector(normal,-.055),anchor.clone().addScaledVector(normal,-.18).addScaledVector(delta,.025)],0x687d93);}
    }
    caption(part,e.label,a.clone().lerp(z,.86).add(V(0,.15,.12)),labelOptions);
   }else if(e.type==='screen'||e.type==='aperture'){
    const h=distance(e.height),opening=distance(e.opening||0),color=e.type==='screen'?0xc1cbd6:0x45566e;
    const piece=(y,hPart)=>{if(hPart<=0)return;const piece=box(part,.075,hPart,.48,color,e.type==='screen'?.82:1);piece.position.set(p.x,y,-.05);};
    if(e.type==='aperture'){const gap=Math.min(h*.3,Math.max(.065,opening));piece(p.y+(h+gap)/4,(h-gap)/2);piece(p.y-(h+gap)/4,(h-gap)/2);}
    else{piece(p.y,h);for(const side of [-1,1])solid(part,V(p.x-.05,p.y+side*h/2,.21),V(p.x+.05,p.y+side*h/2,.21),0x647a91,.025);}
    caption(part,e.label|| (e.type==='screen'?'S':'O'),p.clone().add(V(0,h/2+.1,.18)),labelOptions);
   }
  }
  for(const segment of geometry.segments||[]){
   const part=partGroup(apparatus,'optics-ray-'+segment.id);part.userData.opticsSegment=segment;
   const color=colors[segment.role]||colors.emergent,a=project(segment.from,.12),z=project(segment.to,.12),dashed=segment.dashed||segment.role==='virtual'||segment.role==='guide'||segment.role==='normal';
   if(a.distanceTo(z)<1e-8)continue;
   if(dashed){const ray=line(part,[a,z],color,true);ray.name='optics-dashed-'+segment.id;ray.userData.opticsSegment=segment;}
   else{const ray=solid(part,a,z,color);ray.name='optics-solid-'+segment.id;ray.userData.opticsSegment=segment;if(segment.arrow!==false)directionHead(part,a,z,color);}
  }
  for(const marker of geometry.markers||[]){
   const part=partGroup(apparatus,'optics-marker-'+marker.id);part.userData.opticsMarker=marker;
   const p=project(marker,.17),color=marker.type==='object'?colors.incident:marker.virtual?colors.virtual:marker.type==='focus'?0x445a74:colors.emergent;
   if(finite(marker.height)&&Math.abs(marker.height)>1e-12){
    const end=project({x:marker.x,y:marker.y+marker.height},.17),delta=end.clone().sub(p),length=delta.length(),head=Math.min(.16,length*.32);
    const arrow=retained(part,'arrow',()=>new T.ArrowHelper(V(0,1,0),V(),1,color));arrow.position.copy(p);arrow.setDirection(delta.normalize());arrow.setLength(length,head,head*.46);arrow.setColor(color);arrow.line.visible=true;arrow.name='optics-object-image-arrow';
    if(marker.virtual){const extension=line(part,[p,end],color,true);extension.name='optics-virtual-image';arrow.line.visible=false;}
    if(length<.10){const tip=sphere(part,.040,color);tip.position.copy(end);tip.userData.opticsSchematic='marker-dot';}
    const symbol=marker.type==='object'?'A':marker.type==='intermediate'?'A′':'A′';
    caption(part,symbol,p.clone().add(V(0,Math.sign(marker.height)*length,.06)),labelOptions,[marker.type==='object'?-14:14,Math.sign(marker.height)>0?-17:17]);
   }else{
    const dot=sphere(part,marker.type==='focus'?.043:.064,color);dot.position.copy(p);
    if(marker.type==='focus'){line(part,[p.clone().add(V(-.065,0,0)),p.clone().add(V(.065,0,0))],color);line(part,[p.clone().add(V(0,-.065,0)),p.clone().add(V(0,.065,0))],color);}
    const symbol=marker.type==='object'?'O':marker.type==='image'?'O′':marker.label;
    const offset=marker.type==='focus'?[0,18]:marker.type==='object'?[-16,0]:marker.type==='image'?[16,0]:[0,-17];
    caption(part,symbol,p.clone().add(V(0,0,.04)),labelOptions,offset);
   }
  }
  for(const arc of geometry.arcs||[]){
   const points=Array.from({length:41},(_,j)=>project({x:arc.center.x+arc.radius*Math.cos(arc.start+(arc.end-arc.start)*j/40),y:arc.center.y+arc.radius*Math.sin(arc.start+(arc.end-arc.start)*j/40)},.16));
   const curved=line(apparatus,points,colors[arc.role]||colors.guide,!!arc.dashed);curved.name='optics-angle-'+arc.id;curved.userData.opticsArc=arc;
   const angle=(arc.start+arc.end)/2;caption(apparatus,arc.label,project({x:arc.center.x+arc.radius*1.24*Math.cos(angle),y:arc.center.y+arc.radius*1.24*Math.sin(angle)},.18),labelOptions,[0,-4]);
  }
  group.userData.opticsGeometry=geometry;
  group.userData.opticsProjection={scale,origin,worldOrigin:{x:0,y:1.9},metricScale:'uniform',schematic:['ray-width','optical-thickness','support','marker-head','lens-mount','marker-dot','aperture-gap']};
  group.userData.opticsObservation={id,notes:{vi:(geometry.notes||[]).map(n=>n.vi).filter(Boolean),en:(geometry.notes||[]).map(n=>n.en).filter(Boolean)},values:Array.isArray(geometry.values)?geometry.values:[],image:geometry.image,unit:geometry.unit,legend:[
   {role:'incident',color:'#d98220',vi:'Tia tới',en:'Incident ray'},
   {role:'inside',color:'#087f89',vi:'Tia trong môi trường',en:'Ray inside the medium'},
   {role:'emergent',color:'#2468cc',vi:'Tia ló / truyền qua',en:'Emergent / transmitted ray'},
   {role:'reflected',color:'#ba4255',vi:'Tia phản xạ',en:'Reflected ray'},
   {role:'virtual',color:'#8656bd',dashed:true,vi:'Đường kéo dài / ảnh ảo',en:'Back extension / virtual image'},
   {role:'guide',color:'#65758b',dashed:true,vi:'Pháp tuyến / đường dựng',en:'Normal / construction'}
  ].filter(legend=>geometry.segments.some(s=>s.role===legend.role)).map(({role,vi,en,...rest})=>({kind:role==='guide'?'axis':role,labels:{vi,en},...rest}))};
  if(id==='microscope'||id==='telescope'){
   group.userData.opticsObservation.notes.vi.push('Ở thang toàn hệ, vật hoặc ảnh trung gian có thể rất nhỏ. Chuyển sang 2D và phóng to để khảo sát chi tiết.');
   group.userData.opticsObservation.notes.en.push('At the full-system scale, the object or intermediate image can be very small. Switch to 2D and zoom in to inspect details.');
  }
  if(lenses.some(e=>distance(e.height)<.55)){
   group.userData.opticsObservation.notes.vi.push('Giá đỡ kính được vẽ tượng trưng để nhận ra vật kính nhỏ; kích thước giá không biểu diễn khẩu độ. Tâm kính, vật, ảnh, tiêu điểm và đường tia dùng cùng tỉ lệ.');
   group.userData.opticsObservation.notes.en.push('Lens holders are schematic so that a small objective remains visible; holder size does not represent aperture. Lens centres, objects, images, foci and rays share one scale.');
  }
 }};
 model.update(state,data,options.config||{});return model;
}
