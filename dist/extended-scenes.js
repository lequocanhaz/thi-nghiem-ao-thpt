import {scientificNumber} from './number-format.js?v=66';
import {withExtendedConcepts} from './extended-concepts.js?v=64';
import {leverGeometry} from './lever-geometry.js?v=54';
import {interferenceWindow} from './simulation-space.js?v=43';
import {trackLayout} from './track-layout.js?v=59';
import {COLLISION_CART_SCALE,collisionCartCenter} from './collision-layout.js?v=59';
import {labCart,cable} from './apparatus.js?v=35';
import {buildDiscoveryModel} from './discovery-scenes.js?v=65';
import {T,C,V,mat,mesh,box,sphere,cylinder,line,arrow as apparatusArrow,label,setText,platform,updateLine,flexibleTube,beam} from './geometry-kit.js?v=35';
import {rad,interferenceAt,evaluate} from './models.js?v=54';
// Force and velocity arrows are explanatory overlays, readable through apparatus.
const readableCurrent=value=>!Number.isFinite(value)?'—':value!==0&&(Math.abs(value)<.001||Math.abs(value)>=1e5)?scientificNumber(value,{digits:2}):value.toLocaleString('vi-VN',{maximumSignificantDigits:3});
const arrow=(...args)=>{const node=apparatusArrow(...args);node.traverse(part=>{part.renderOrder=900;if(part.material){part.material.depthTest=false;part.material.depthWrite=false;}});return node;};
const circle=(r,n=100)=>Array.from({length:n+1},(_,i)=>V(r*Math.cos(i*2*Math.PI/n),.05,r*Math.sin(i*2*Math.PI/n)));
function trolley(g,color,x=0){return labCart(g,color,x);}
function resizeTrack(g,track,layout){
 const key=JSON.stringify(layout);if(track.userData.layout===key)return;
 track.traverse(q=>{if(q.isInstancedMesh)q.dispose();q.geometry?.dispose();for(const m of Array.isArray(q.material)?q.material:[q.material]){m?.map?.dispose();m?.dispose();}});track.clear();
 const width=layout.right-layout.left,center=(layout.left+layout.right)/2,depth=layout.depth||.9;
 const deck=new T.Group();track.add(deck);deck.position.x=center;platform(deck,width+.6,Math.max(3,depth+1));
 const rail=box(track,width,.10,depth,0xf4f7fb,center,.12,0);rail.name='motion-rail';
 const count=Math.ceil(width/.5),ticks=new T.LineSegments(new T.BufferGeometry().setFromPoints(Array.from({length:count+1},(_,i)=>{const x=layout.left+width*i/count;return [V(x,.18,-depth/2),V(x,.18,depth/2)];}).flat()),new T.LineBasicMaterial({color:0xc0cfdd}));track.add(ticks);
 g.userData.motionBounds=new T.Box3(V(layout.left-1.6,-.05,-depth/2),V(layout.right+1.6,2.2,depth/2));track.userData.layout=key;
}
function straight(id,g,s,d,o){
 const track=new T.Group();track.name='motion-track';g.add(track);
 const cart=trolley(g,C.blue);cart.name='motion-cart';cart.position.y=.11;
 const force=arrow(g,V(0,1,0),V(1,0,0),C.orange),velocity=arrow(g,V(0,1.4,0),V(1,0,0),C.blue);
 return(s,d,c)=>{
  const layout=trackLayout(id,s);resizeTrack(g,track,layout);
  const x=layout.origin+d.x*layout.scale;cart.position.x=x;
  for(const [a,value,scale] of [[force,id==='newton'?s.force:d.acc||0,.08],[velocity,d.v,.13]]){a.position.set(x,a===force?1:1.4,0);a.visible=c.switches?.vectors!==false&&Math.abs(value)>.01;a.setDirection(V(Math.sign(value)||1,0,0));a.setLength(Math.min(1.6,Math.max(.02,Math.abs(value)*scale)),.15,.07);}
 };
}
function projectile(id,g,s,d,o){platform(g,8,4);const cannon=new T.Group();g.add(cannon);const tube=cylinder(cannon,.13,.75,C.metal);tube.rotation.z=-Math.PI/2;box(cannon,.6,.18,.55,C.blue,0,-.17,0);const ball=sphere(g,.15,C.orange);const path=line(g,Array.from({length:81},()=>V()),C.blue,true);const horizontal=arrow(g,V(),V(1,0,0),C.blue),vertical=arrow(g,V(),V(0,-1,0),C.orange);const control=sphere(g,.09,C.purple);control.userData.drag=id==='horizontal'?'height':'launch-angle';return(s,d,c)=>{const sx=id==='horizontal'?.20:.48,sy=id==='horizontal'?.20:.48;const y0=id==='horizontal'?.35+s.h0*sy:.35;cannon.position.set(-3,y0,0);cannon.rotation.z=id==='horizontal'?0:rad(s.angle);ball.position.set(-3+d.x*sx,.35+d.y*sy,0);control.position.set(-3+(id==='horizontal'?0:.8*Math.cos(rad(s.angle))),y0+(id==='horizontal'?.3:.8*Math.sin(rad(s.angle))),0);const pts=Array.from({length:81},(_,j)=>{const q=evaluate(id,{...s,t:d.duration*j/80});return V(-3+q.x*sx,.35+q.y*sy,0)});updateLine(path,pts);path.visible=c.switches?.trajectory!==false;for(const [a,value,axis] of [[horizontal,d.vx,V(1,0,0)],[vertical,d.vy,V(0,1,0)]]){a.visible=c.switches?.vectors!==false&&Math.abs(value)>.02;a.position.copy(ball.position);a.setDirection(axis.multiplyScalar(Math.sign(value)));a.setLength(Math.min(1.2,Math.abs(value)*.09),.14,.07);}};}
function incline(g,s,d,o){platform(g,7,4);const ramp=new T.Group();g.add(ramp);box(ramp,5,.16,1.45,0xf0f3f7);const cargo=box(ramp,.6,.48,.6,C.blue,-2,.34,0);cargo.name='incline-cargo';const handle=sphere(g,.12,C.purple);handle.userData.drag='ramp-angle';const force=arrow(g,V(),V(0,-1,0),C.orange);return(s,d,c)=>{const a=rad(s.angle);ramp.position.set(0,.35+2.5*Math.sin(a),0);ramp.rotation.z=-a;cargo.position.x=-2.25+d.x*.90;handle.position.set(-2.5*Math.cos(a),.35+5*Math.sin(a),.6);const p=cargo.getWorldPosition(V());force.position.copy(p);force.visible=c.switches?.vectors!==false;force.setLength(.9,.16,.08);};}
function collision(g,s,d,o){
 const track=new T.Group();track.name='motion-track';g.add(track);
 const a=trolley(g,C.blue),b=trolley(g,C.orange);a.name='motion-cart';b.name='motion-cart';
 const loads=[a,b].map(cart=>{cart.scale.setScalar(COLLISION_CART_SCALE);const load=box(cart,.44,.22,.42,C.metal);load.name='collision-load';return load;});
 const arrows=[arrow(g,V(),V(1,0,0),C.blue),arrow(g,V(),V(-1,0,0),C.orange)];
 return(s,d,c)=>{resizeTrack(g,track,trackLayout('collision',s));a.position.x=collisionCartCenter(d.x1,-1);b.position.x=collisionCartCenter(d.x2,1);
  loads.forEach((load,i)=>{load.scale.y=.4+.5*Math.cbrt(i?s.m2:s.m1);load.position.y=.71+.11*load.scale.y;});
  [a,b].forEach((m,i)=>{m.position.y=.17-.063*m.scale.y;const v=i?d.v2:d.v1,arrow=arrows[i];arrow.position.set(m.position.x,Math.max(1.2,m.scale.y*.8),0);arrow.visible=c.switches?.vectors!==false&&Math.abs(v)>.01;arrow.setDirection(V(Math.sign(v)||1,0,0));arrow.setLength(Math.max(.05,Math.min(1.3,Math.abs(v)*.3)),.14,.07);});
 };
}
function circular(g,s,d,o){platform(g,7.5,7.5);const track=line(g,circle(1),0xa6bed7),ball=sphere(g,.18,C.blue);ball.userData.drag='circular-radius';ball.userData.planeNormal=[0,1,0];const force=arrow(g,V(),V(-1,0,0),C.orange),velocity=arrow(g,V(),V(0,0,1),C.green);return(s,d,c)=>{track.scale.set(s.radius,1,s.radius);ball.position.set(d.x,.3,d.z);const inward=V(-Math.cos(d.theta),0,-Math.sin(d.theta)),tangent=V(-Math.sin(d.theta),0,Math.cos(d.theta));force.position.copy(ball.position);velocity.position.copy(ball.position);force.setDirection(inward);velocity.setDirection(tangent);force.setLength(Math.min(1.5,d.force*.1+.3),.14,.07);velocity.setLength(Math.min(1.6,s.v*.2),.14,.07);force.visible=velocity.visible=c.switches?.vectors!==false;};}
function lever(g,s,d,o){
 platform(g,7,3.5);cylinder(g,.18,1.6,C.metal,0,.85,0);
 const beam=new T.Group();beam.name='lever-beam-frame';beam.position.y=1.7;g.add(beam);
 const bar=box(beam,1,.12,.8,0xb5c5d7);bar.name='lever-beam';
 const weights=[cylinder(g,.18,.45,C.blue),cylinder(g,.18,.45,C.orange)];
 const ropes=[line(g,[V(),V()],C.dark),line(g,[V(),V()],C.dark)];
 weights.forEach((weight,i)=>{weight.name='lever-load-'+i;weight.userData.drag=i?'l2':'l1';ropes[i].name='lever-cable-'+i;});
 const pivot=sphere(g,.10,C.metal,0,1.7,0);pivot.name='lever-pivot';
 g.userData.leverModel='absolute-perpendicular-arms';
 return(s,d)=>{
  const layout=leverGeometry(s,d.net);beam.rotation.z=layout.angle;bar.scale.x=layout.length;bar.position.x=layout.center;
  layout.loads.forEach((load,i)=>{
   weights[i].position.set(load.x,load.weightY,load.z);weights[i].scale.setScalar(load.scale);
   updateLine(ropes[i],[V(load.x,load.attachmentY,load.z),V(load.x,load.weightY+load.height/2,load.z)]);
  });
 };
}
function hooke(g,s,d,o){platform(g,5,3);box(g,.15,3.9,.15,C.metal,-1.5,1.9,0);box(g,2.0,.15,.2,C.metal,-.6,3.8,0);const mass=cylinder(g,.28,.5,C.blue,0,1,0);mass.userData.drag='spring-load';const spring=flexibleTube(g,161,.028,C.metal);line(g,[V(.8,.4,0),V(.8,3.5,0)],0xb2c4d8);return(s,d)=>{const end=3.45-.65-d.extension;mass.position.y=end-.25;mass.scale.setScalar(.7+s.m*.16);spring.userData.update(Array.from({length:161},(_,j)=>{const f=j/160,a=f*Math.PI*20;return V(.13*Math.cos(a),3.45-f*(.65+d.extension),.13*Math.sin(a))}));};}
function pendulum(g,s,d,o){
 platform(g,6,4);for(const x of [-2.35,2.35]){cylinder(g,.06,3.45,C.metal,x,1.78,0);box(g,.54,.08,.72,0x617b6d,x,.07,0);for(const z of [-.23,.23])cylinder(g,.036,.021,C.metal,x,.12,z);cylinder(g,.095,.12,0x516958,x,3.38,0);}
 box(g,4.9,.16,.26,0xc3d0c2,0,3.5,0);const pivot=cylinder(g,.1,.22,0x496654,0,3.5,0);pivot.rotation.x=Math.PI/2;
 const arc=Array.from({length:65},(_,i)=>{const a=(-50+i*100/64)*Math.PI/180;return V(.52*Math.sin(a),3.5-.52*Math.cos(a),.18);});line(g,arc,0x8da28a);
 for(let angle=-50;angle<=50;angle+=5){const a=angle*Math.PI/180;line(g,[V(.52*Math.sin(a),3.5-.52*Math.cos(a),.18),V((angle%10===0?.59:.55)*Math.sin(a),3.5-(angle%10===0?.59:.55)*Math.cos(a),.18)],0x607b5e);}
 const ball=new T.Group();ball.userData.drag='pendulum-length';g.add(ball);const bob=sphere(ball,.22,0xceaa65);bob.material.metalness=.76;bob.material.roughness=.23;cylinder(ball,.07,.12,C.metal,0,.22,0);const ring=mesh(ball,new T.TorusGeometry(.22,.014,8,48),mat(0x8f793d));ring.rotation.x=Math.PI/2;
 const rope=beam(g,0x677d70,.009),velocity=arrow(g,V(),V(1,0,0),C.blue,.7),thetaLabel=null;thetaLabel?.scale.set(1.7,.29,1);line(g,[V(0,3.5,0),V(0,.3,0)],0xb8c8b2,true);
 return(s,d,c={})=>{ball.position.set(s.length*1.3*Math.sin(d.theta),3.5-s.length*1.3*Math.cos(d.theta),0);ball.scale.setScalar(.8+s.m*.25);ball.rotation.z=d.theta;rope.userData.setEnds(V(0,3.5,0),ball.position.clone());velocity.visible=c.switches?.vectors!==false&&Math.abs(d.v)>.001;velocity.position.copy(ball.position);velocity.setDirection(V(Math.cos(d.theta),Math.sin(d.theta),0).multiplyScalar(Math.sign(d.v)||1));velocity.setLength(Math.max(.03,Math.min(1.3,Math.abs(d.v))),.11,.06);setText(thetaLabel,`θ = ${(d.theta*180/Math.PI).toFixed(1)}° · L = ${s.length.toFixed(2)} m`);};
}
function oscillator(g,s,d,o,resonance=false){
 platform(g,7,3);const rail=box(g,6,.10,.55,0xf7f9fb,0,.12,0),mount=box(g,.15,1.0,.8,C.metal,-2.65,.58,0);
 const mass=box(g,.65,.62,.65,resonance?C.purple:C.blue,0,.60,0),spring=flexibleTube(g,121,.025,C.metal),driver=resonance?sphere(g,.1,C.orange,-2.8,.6,0):null;
 mass.name='oscillator-mass';
 return(s,d)=>{
  // Choose one display scale for the entire steady-state cycle. Clipping x
  // itself would flatten the waveform and make a moving oscillator stick.
  const displayScale=resonance?Math.min(6,1.65/Math.max(Number.MIN_VALUE,d.amplitude)):.15;
  const amplitude=resonance?d.amplitude*displayScale:Math.abs(s.a)*displayScale,anchor=Math.min(-2.55,-amplitude-.8),left=Math.min(-3,anchor-.25),right=Math.max(3,amplitude+.5),x=d.x*displayScale;
  rail.scale.x=(right-left)/6;rail.position.x=(left+right)/2;mount.position.x=anchor-.1;
  g.userData.motionBounds=new T.Box3(V(left-1,-.05,-.5),V(right+1,1.5,.5));
  mass.position.x=x;spring.userData.update(Array.from({length:121},(_,j)=>{const f=j/120,a=f*Math.PI*18;return V(anchor+f*(x-.325-anchor),.6+.13*Math.cos(a),.13*Math.sin(a));}));
  if(driver){driver.position.x=anchor-.25;driver.position.y=.6+.12*Math.sin(2*Math.PI*s.f*s.t);}
 };
}
function interference(g,s,d,o){platform(g,7.2,6.2);const n=61,positions=new Float32Array(n*n*3),indices=[];for(let j=0;j<n-1;j++)for(let k=0;k<n-1;k++){const a=j*n+k;indices.push(a,a+1,a+n,a+1,a+n+1,a+n)}const geom=new T.BufferGeometry();geom.setAttribute('position',new T.BufferAttribute(positions,3));geom.setIndex(indices);const water=mesh(g,geom,mat(0x63b6dd,{side:T.DoubleSide,roughness:.18,metalness:.2,transparent:true,opacity:.83}));const sources=[sphere(g,.11,C.blue),sphere(g,.11,C.orange)],probe=sphere(g,.10,C.purple);probe.userData.drag='interference-probe';probe.userData.planeNormal=[0,1,0];return(s,d)=>{const area=interferenceWindow(s);for(let j=0;j<n;j++)for(let k=0;k<n;k++){const x=-area.x+2*area.x*k/(n-1),z=area.z*j/(n-1),v=interferenceAt(s,x,z);positions.set([x,.65+v.u*.65,z-1.7],(j*n+k)*3)}geom.attributes.position.needsUpdate=true;geom.computeVertexNormals();geom.computeBoundingSphere();sources[0].position.set(-s.separation/2,.80,-1.7);sources[1].position.set(s.separation/2,.80,-1.7);probe.position.set(s.probeX,.65+d.u*.65,s.probeZ-1.7);};}
function standing(g,s,d,o){platform(g,7.5,3);const count=101,rope=flexibleTube(g,count,.03,C.blue),nodes=Array.from({length:6},()=>sphere(g,.085,C.orange));box(g,.12,1.5,.12,C.metal,-3,.75,0);box(g,.12,1.5,.12,C.metal,3,.75,0);const probe=sphere(g,.12,C.purple);probe.userData.drag='standing-probe';return(s,d)=>{rope.userData.update(Array.from({length:count},(_,j)=>{const x=s.length*j/(count-1),u=2*s.a*Math.sin(s.mode*Math.PI*x/s.length)*Math.cos(2*Math.PI*d.frequency*s.t);return V(-3+6*j/(count-1),1.4+u*.9,0)}));nodes.forEach((m,j)=>{m.visible=j<=s.mode;m.position.set(-3+6*j/s.mode,1.4,0)});probe.position.set(-3+6*d.x/s.length,1.4+d.u*.9,0);};}
function sound(g,s,d,o){
 platform(g,7,4);box(g,1.1,1.7,.5,C.dark,-2.8,.95,0);
 const cone=mesh(g,new T.ConeGeometry(.43,.25,40),mat(0x60778c),-2.17,1.05,0);cone.rotation.z=-Math.PI/2;cone.name='sound-speaker-cone';
 // The cone moves along the propagation axis. Compression particles and
 // wavelength references are supplied by the normalized concept layer.
 return(s,d)=>{cone.position.x=-2.17-.04*Math.min(1,s.a)*Math.cos(2*Math.PI*s.f*s.t);};
}
function network(g,s,d,o,parallel=false){
 platform(g,6.5,4);box(g,.85,.50,.65,0xe1e7ed,-2.4,.32,0);
 const labels=[label(g,'',V(-2.4,1.0,0),o),label(g,'',V(0,1.05,-1),o),label(g,'',V(0,1.05,parallel?1:-1),o)];
 const makeR=(x,z)=>{const r=cylinder(g,.14,.82,0xb98a51,x,.45,z);r.rotation.z=Math.PI/2;for(const a of [-.25,-.07,.12]){const band=mesh(g,new T.TorusGeometry(.142,.025,8,32),mat(a<0?0x414b67:0x8e5627),x+a,.45,z);band.rotation.y=Math.PI/2;}return r;};
 const paths=parallel?[[V(-2.4,.45,0),V(-1.5,.45,-1),V(1.5,.45,-1),V(2,.45,0)],[V(-2.4,.45,0),V(-1.5,.45,1),V(1.5,.45,1),V(2,.45,0)],[V(2,.45,0),V(2,.45,1.6),V(-2.4,.45,1.6),V(-2.4,.45,0)]]:[[V(-2.4,.45,0),V(-2.4,.45,-1),V(2,.45,-1),V(2,.45,1.4),V(-2.4,.45,1.4),V(-2.4,.45,0)]];
 paths.forEach((p,j)=>line(g,p,[0x2369b1,0xbd6b23,0x168064][j]));makeR(parallel?0:-.75,-1);makeR(parallel?0:.75,parallel?1:-1);
 const curves=paths.map(points=>new T.CurvePath());paths.forEach((points,j)=>points.slice(1).forEach((p,k)=>curves[j].add(new T.LineCurve3(points[k],p))));
 const clouds=paths.map((_,j)=>{const node=new T.InstancedMesh(new T.SphereGeometry(.055,10,8),new T.MeshBasicMaterial({color:[0x2369b1,0xbd6b23,0x168064][j]}),12);node.name='circuit-carriers-'+j;g.add(node);return node;}),dummy=new T.Object3D();
 return(s,d)=>{setText(labels[0],`U=${s.u} V`);setText(labels[1],`R₁=${s.r1} Ω · I₁=${readableCurrent(d.i1)} A`);setText(labels[2],`R₂=${s.r2} Ω · I₂=${readableCurrent(d.i2)} A`);if(!parallel){labels[1]?.position.set(-.75,1.05,-1);labels[2]?.position.set(.75,1.05,-1);}
  clouds.forEach((node,k)=>{const current=parallel?[d.i1,d.i2,d.i][k]:d.i;node.visible=Math.abs(current)>1e-12;node.userData.current=current;node.userData.unit='A';node.userData.phaseRate=current*.18;
   for(let j=0;j<12;j++){const f=((s.t||0)*current*.18+j/12)%1;dummy.position.copy(curves[k].getPointAt((f+1)%1));dummy.position.y+=.035;dummy.updateMatrix();node.setMatrixAt(j,dummy.matrix);}node.instanceMatrix.needsUpdate=true;
  });
 };
}
function joule(g,s,d,o){platform(g,6,4);const glass=mesh(g,new T.CylinderGeometry(.9,.9,1.9,48,1,true),mat(0xc2d7e7,{transparent:true,opacity:.09,side:T.DoubleSide,depthWrite:false}),0,1.05,0);const water=cylinder(g,.85,1.25,0x88c8df,0,.73,0);water.material.transparent=true;water.material.opacity=.5;const wire=line(g,Array.from({length:121},(_,j)=>{const f=j/120;return V(.35*Math.cos(f*Math.PI*20),.22+f*.9,.35*Math.sin(f*Math.PI*20))}),C.orange);box(g,1.0,.45,.7,0xf0f4fa,-2,.30,0);line(g,[V(-2,.55,0),V(-.8,2.1,0),V(0,1.1,0)],C.blue);const therm=box(g,.07,2.3,.07,0xc6d8e8,1.3,1.25,0),fill=box(g,.05,1,.05,C.orange,1.3,.70,.08);const l=label(g,'',V(.2,2.55,0),o);return(s,d)=>{water.material.color.setHSL(.54-(d.temp-20)/100*.09,.5,.72);fill.scale.y=(d.temp-20)/80*1.8+.1;fill.position.y=.2+fill.scale.y/2;setText(l,`${d.temp.toFixed(1)} °C`);};}
function magnets(g){box(g,1,2.5,2.2,0xebaaa0,-3.0,1.3,0);box(g,1,2.5,2.2,0x9cb8e1,3.0,1.3,0);for(const y of [.8,1.5,2.1])arrow(g,V(-2.3,y,0),V(1,0,0),0x337d97,4.6);}
function magnetic(g,s,d,o){platform(g,8,4);magnets(g);const wire=cylinder(g,.055,1,C.orange,0,1.4,0);const handle=sphere(g,.10,C.purple);handle.userData.drag='wire-angle';handle.userData.planeNormal=[0,1,0];const force=arrow(g,V(0,1.4,0),V(0,1,0),C.green);label(g,'N',V(-3,3.1,0),o);label(g,'S',V(3,3.1,0),o);return(s,d,c)=>{const direction=V(Math.cos(rad(s.angle)),0,Math.sin(rad(s.angle)));wire.quaternion.setFromUnitVectors(V(0,1,0),direction);wire.scale.y=s.length*4;handle.position.copy(direction.clone().multiplyScalar(s.length*2)).add(V(0,1.4,0));force.visible=c.switches?.vectors!==false&&Math.abs(d.fy)>.001;force.setDirection(V(0,Math.sign(d.fy)||1,0));force.setLength(Math.min(1.6,Math.max(.03,d.force*2)),.16,.08);};}
function induction(g,s,d,o){
 platform(g,8,5);magnets(g);const coils=new T.Group();coils.position.y=1.5;g.add(coils);for(let j=0;j<8;j++){const loop=mesh(coils,new T.TorusGeometry(1,.028,10,96),mat(0xb97342,{metalness:.83,roughness:.24}),(j-3.5)*.04,0,0);loop.rotation.y=Math.PI/2;}
 cylinder(g,.065,1.35,C.metal,0,.72,0);box(g,1.1,.12,.8,0xc5d4c4,0,.10,0);for(const y of [.42,.58]){const ring=mesh(g,new T.TorusGeometry(.13,.026,8,32),mat(0xcfa367),0,y,0);ring.rotation.x=Math.PI/2;box(g,.17,.08,.11,C.dark,.2,y,0);}
 box(g,1.05,.61,.46,0xcedacc,0,.40,2);const gauge=cylinder(g,.45,.12,0xf5f7ef,0,.86,2.0);gauge.rotation.x=Math.PI/2;mesh(g,new T.TorusGeometry(.452,.035,10,64),mat(C.metal),0,.86,2.07);
 for(let j=0;j<=20;j++){const a=Math.PI/2-1.1+j*2.2/20;line(g,[V(.34*Math.cos(a),.86+.34*Math.sin(a),2.081),V((j%5===0?.41:.38)*Math.cos(a),.86+(j%5===0?.41:.38)*Math.sin(a),2.081)],0x5a705b);}
 const needle=line(g,[V(),V(.31,0,0)],0xba6945);needle.position.set(0,.86,2.09);sphere(g,.035,C.dark,0,.86,2.10);label(g,'I',V(0,.69,2.12),o)?.scale.set(.3,.13,1);
 cable(g,[V(.29,.42,0),V(.48,.13,.8),V(.40,.12,1.6),V(.26,.33,1.82)],C.orange,.018);cable(g,[V(.29,.58,0),V(-.48,.13,.8),V(-.40,.12,1.6),V(-.26,.33,1.82)],C.blue,.018);
 const l=label(g,'',V(0,2.95,0),o);return(s,d)=>{coils.rotation.y=d.theta;coils.scale.setScalar(Math.sqrt(s.area/Math.PI)*8);coils.children.forEach((m,j)=>m.visible=j<Math.min(8,s.turns));needle.rotation.z=Math.PI/2-Math.max(-1,Math.min(1,d.i/.3))*1.1;setText(l,`${s.turns} vòng · ε = ${d.emf.toFixed(2)} V`);};
}
function decay(g,s,d,o){platform(g,6,5);const count=216,alive=new T.InstancedMesh(new T.SphereGeometry(.07,12,8),mat(C.blue),count),dead=new T.InstancedMesh(new T.SphereGeometry(.045,10,8),mat(0xc9d4df),count);g.add(alive,dead);const dummy=new T.Object3D();return(s,d)=>{let a=0,b=0;for(let j=0;j<count;j++){const u=((j*73)%count+.5)/count,lifetime=-Math.log(1-u)/(Math.LN2/s.half);dummy.position.set((j%6-2.5)*.5,.4+(Math.floor(j/6)%6)*.4,(Math.floor(j/36)-2.5)*.5);dummy.updateMatrix();if(s.t<lifetime)alive.setMatrixAt(a++,dummy.matrix);else dead.setMatrixAt(b++,dummy.matrix)}alive.count=a;dead.count=b;alive.instanceMatrix.needsUpdate=true;dead.instanceMatrix.needsUpdate=true;};}
export function buildExtendedModel(id,s,d,o={}){const group=new T.Group();let update;switch(id){case 'uniform':case 'acceleration':case 'newton':update=straight(id,group,s,d,o);break;case 'horizontal':case 'projectile':update=projectile(id,group,s,d,o);break;case 'incline':update=incline(group,s,d,o);break;case 'collision':update=collision(group,s,d,o);break;case 'circular':update=circular(group,s,d,o);break;case 'lever':update=lever(group,s,d,o);break;case 'hooke':update=hooke(group,s,d,o);break;case 'pendulum':update=pendulum(group,s,d,o);break;case 'damped':case 'resonance':update=oscillator(group,s,d,o,id==='resonance');break;case 'interference':update=interference(group,s,d,o);break;case 'standing':update=standing(group,s,d,o);break;case 'sound':update=sound(group,s,d,o);break;case 'series':case 'parallel':update=network(group,s,d,o,id==='parallel');break;case 'joule':update=joule(group,s,d,o);break;case 'magnetic':update=magnetic(group,s,d,o);break;case 'induction':update=induction(group,s,d,o);break;case 'decay':update=decay(group,s,d,o);break;default:return buildDiscoveryModel(id,s,d,o)}group.updateMatrixWorld(true);update(s,d,o.config||{});return withExtendedConcepts({group,update},id,s,d,o);}
