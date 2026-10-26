import {T,V,line,arrow,sphere,box,label,setText,updateLine} from './geometry-kit.js?v=35';
import {trackLayout} from './track-layout.js?v=59';
import {leverGeometry} from './lever-geometry.js?v=54';
import {evaluate} from './models.js?v=54';

// These are observation aids. Their coordinates reuse each existing apparatus
// mapping; they never write to the scientific state or replace calculated data.
export const EXTENDED_CONCEPTS=Object.freeze({
 uniform:{independent:['t','v'],dependent:['x'],principle:'equal-time-displacement'},
 acceleration:{independent:['t','v0','acc'],dependent:['x','v'],principle:'equal-time-displacement'},
 newton:{independent:['force','m'],dependent:['acc','x','v'],principle:'force-mass-acceleration'},
 horizontal:{independent:['h0','v0'],dependent:['x','y','range'],principle:'independent-motion-components'},
 projectile:{independent:['v0','angle'],dependent:['height','range'],principle:'apex-and-landing'},
 incline:{independent:['angle','mu','m'],dependent:['normal','friction','acc'],principle:'resolved-forces'},
 collision:{independent:['m1','m2','v1','v2','e'],dependent:['momentum','k'],principle:'momentum-superposition'},
 circular:{independent:['radius','v','m'],dependent:['period','force'],principle:'radial-force-tangent-velocity'},
 lever:{independent:['m1','m2','l1','l2'],dependent:['torque1','torque2'],principle:'perpendicular-moment-arms'},
 hooke:{independent:['m','k'],dependent:['extension','force'],principle:'extension-from-natural-length'},
 pendulum:{independent:['length','angle'],dependent:['theta','period'],principle:'equilibrium-and-turning-points'},
 damped:{independent:['a','period','beta'],dependent:['x','envelope'],principle:'decaying-amplitude-envelope'},
 resonance:{independent:['f','f0','beta','force'],dependent:['amplitude','phase'],principle:'driving-and-response'},
 interference:{independent:['separation','phase','f'],dependent:['u1','u2','u','delta'],principle:'path-difference-superposition'},
 standing:{independent:['mode','length','speed'],dependent:['nodes','antinodes','frequency'],principle:'fixed-nodes-moving-antinodes'},
 sound:{independent:['f','a'],dependent:['lambda','u'],principle:'longitudinal-compression'},
 series:{independent:['u','r1','r2'],dependent:['i','u1','u2'],principle:'same-current-voltage-division'},
 parallel:{independent:['u','r1','r2'],dependent:['i','i1','i2'],principle:'same-voltage-current-division'},
 joule:{independent:['u','r','m','t'],dependent:['power','heat','temp'],principle:'electrical-energy-to-heat'},
 magnetic:{independent:['b','i','length','angle'],dependent:['force','fy'],principle:'current-cross-field'},
 induction:{independent:['b','turns','area','f'],dependent:['flux','emf','i'],principle:'changing-flux-induces-emf'},
 decay:{independent:['half','n0','t'],dependent:['N','remaining','activity'],principle:'expected-population-fraction'}
});
const ink={blue:0x1764b0,orange:0xc96b1c,green:0x16775e,purple:0x7541b3,gray:0x8292a3};
const fmt=value=>Number.isFinite(value)?Number(value.toPrecision(3)).toString():'—';
function dot(group,name,color=ink.blue,r=.065){const node=sphere(group,r,color);node.material=new T.MeshBasicMaterial({color});node.name=name;return node;}
function trace(group,name,count=2,color=ink.gray,dashed=true){const node=line(group,Array.from({length:count},()=>V()),color,dashed);node.name=name;return node;}
function text(group,name,position,o){const node=label(group,'',position,{...o,fontSize:34,fontWeight:600,pixelSize:14,pixelOffset:[0,-12]});if(node){node.name=name;node.userData.coordinateAid=true;node.userData.profile={metric:false};}return node;}
function at(node,position,value){if(!node)return;node.position.copy(position);node.userData.pixelAnchor?.copy(position);setText(node,value);}
function vector(group,name,color){const node=arrow(group,V(),V(1,0,0),color);node.name=name;node.userData.conceptVector=true;node.traverse(part=>{part.renderOrder=900;if(part.material){part.material.depthTest=false;part.material.depthWrite=false;}});return node;}
function setVector(node,origin,direction,magnitude,scale,visible=true){
 node.position.copy(origin);node.userData.value=magnitude;node.userData.direction=direction.toArray();node.visible=visible&&Number.isFinite(magnitude)&&Math.abs(magnitude)>1e-10;
 if(!node.visible)return;node.setDirection(direction.clone().normalize().multiplyScalar(Math.sign(magnitude)));
 const length=Math.max(.025,Math.abs(magnitude)*scale);node.setLength(length,Math.min(.14,length*.4),Math.min(.07,length*.2));
}
function relativeBar(group,name,color){const node=box(group,1,.12,.12,color);node.material=new T.MeshBasicMaterial({color});node.name=name;return node;}

function motion(id,g,o){
 const samples=Array.from({length:5},(_,j)=>dot(g,'equal-time-'+j,ink.gray,.075));
 const displacement=trace(g,'displacement-reference',2,ink.orange),readout=text(g,'motion-reading',V(),o);
 return(s,d,c)=>{const layout=trackLayout(id,s),x=layout.origin+d.x*layout.scale;
  samples.forEach((node,j)=>{const time=layout.end*j/4,q=evaluate(id,{...s,t:time});node.position.set(layout.origin+q.x*layout.scale,.28,-.62);node.material.color.setHex(time<=(s.t||0)+1e-10?ink.blue:ink.gray);Object.assign(node.userData,{sampleTime:time,physicalX:q.x});});
  updateLine(displacement,[V(layout.origin,.28,.66),V(x,.28,.66)]);
  displacement.userData.physicalDisplacement=d.x;
  at(readout,V(x,1.85,0),id==='newton'?`a=${fmt(d.acc)} m/s²`:`x=${fmt(d.x)} m · v=${fmt(d.v)} m/s`);
 };
}
function flight(id,g,o){
 const landing=dot(g,'landing-point',ink.purple,.09),apex=dot(g,'apex-point',ink.orange,.085),vertical=trace(g,'height-projection',2,ink.gray),readout=text(g,'flight-reading',V(),o);
 return(s,d,c)=>{const scale=id==='horizontal'?.2:.48,current=V(-3+d.x*scale,.35+d.y*scale,0),q=evaluate(id,{...s,t:id==='horizontal'?0:d.duration/2});
  landing.position.set(-3+d.range*scale,.35,0);landing.userData.range=d.range;
  apex.position.set(-3+q.x*scale,.35+q.y*scale,0);apex.userData.physicalHeight=q.y;
  updateLine(vertical,[current,V(current.x,.35,0)]);vertical.visible=c.switches?.trajectory!==false;
  at(readout,apex.position.clone().add(V(0,.35,0)),id==='horizontal'?`h₀=${fmt(s.h0)} m · R=${fmt(d.range)} m`:`h_max=${fmt(d.height)} m · R=${fmt(d.range)} m`);
 };
}
function slope(root,g,o){
 const normal=vector(g,'normal-force',ink.blue),friction=vector(g,'friction-force',ink.purple),readout=text(g,'slope-reading',V(),o);
 return(s,d,c)=>{root.updateMatrixWorld(true);const cargo=root.getObjectByName('incline-cargo'),p=cargo?.getWorldPosition(V())||V(),a=s.angle*Math.PI/180,scale=1.1/Math.max(d.weight,1e-9),on=c.switches?.vectors!==false;
  setVector(normal,p,V(Math.sin(a),Math.cos(a),0),d.normal,scale,on);
  setVector(friction,p,V(-Math.cos(a),Math.sin(a),0),d.friction,scale,on);
  at(readout,p.clone().add(V(0,1,0)),`N=${fmt(d.normal)} N · f=${fmt(d.friction)} N`);
 };
}
function impact(root,g,o){
 const arrows=[vector(g,'momentum-1',ink.green),vector(g,'momentum-2',ink.purple)],readout=text(g,'momentum-reading',V(),o);
 return(s,d,c)=>{const carts=root.children.filter(n=>n.name==='motion-cart'),momenta=[s.m1*d.v1,s.m2*d.v2],scale=1.15/Math.max(1,...momenta.map(Math.abs));
  arrows.forEach((node,j)=>setVector(node,V(carts[j]?.position.x||0,1.9,0),V(1,0,0),momenta[j],scale,c.switches?.vectors!==false));
  at(readout,V((carts[0].position.x+carts[1].position.x)/2,2.6,0),`p₁+p₂=${fmt(d.momentum)} kg·m/s · e=${fmt(s.e)}`);
 };
}
function orbit(g,o){
 const center=dot(g,'circle-center',ink.gray),radius=trace(g,'radius-reference',2,ink.gray),marks=Array.from({length:4},(_,j)=>dot(g,'quarter-turn-'+j,ink.gray,.045)),readout=text(g,'circle-reading',V(),o);
 return(s,d)=>{center.position.set(0,.3,0);updateLine(radius,[center.position,V(d.x,.3,d.z)]);radius.userData.radius=s.radius;
  marks.forEach((node,j)=>node.position.set(s.radius*Math.cos(j*Math.PI/2),.3,s.radius*Math.sin(j*Math.PI/2)));
  at(readout,V(0,.9,0),`r=${fmt(s.radius)} m · T=${fmt(d.period)} s`);
 };
}
function balance(g,o){
 const arms=[trace(g,'moment-arm-1',2,ink.blue),trace(g,'moment-arm-2',2,ink.orange)],weights=[vector(g,'weight-1',ink.blue),vector(g,'weight-2',ink.orange)],labels=[text(g,'torque-1',V(),o),text(g,'torque-2',V(),o)],balance=text(g,'moment-balance',V(),o);
 labels.forEach((n,j)=>{if(n)n.userData.pixelOffset=[j?54:-54,-20];});
 return(s,d,c)=>{const layout=leverGeometry(s,d.net),scale=.9/(9.81*Math.max(s.m1,s.m2,1e-9));
  layout.loads.forEach((load,j)=>{updateLine(arms[j],[V(0,1.7,.85),V(load.x,1.7,.85)]);arms[j].userData.perpendicularArm=j?s.l2:s.l1;
   setVector(weights[j],V(load.x,load.weightY,load.z),V(0,-1,0),9.81*(j?s.m2:s.m1),scale,c.switches?.vectors!==false);
   at(labels[j],V(load.x/2,2.18,.85),`l${j?'₂':'₁'}=${fmt(j?s.l2:s.l1)} m`);
  });
  at(balance,V(0,2.65,0),`M₁${Math.abs(d.net)<1e-8?'=':d.torque1>d.torque2?'>':'<'}M₂`);balance&&(balance.userData.torques=[d.torque1,d.torque2]);
 };
}
function spring(root,g,o){
 const natural=trace(g,'natural-length-reference',2,ink.gray),extension=trace(g,'spring-extension',2,ink.orange,false),up=vector(g,'spring-force',ink.blue),down=vector(g,'spring-weight',ink.orange),readout=text(g,'extension-reading',V(),o),ends=[dot(g,'natural-length-end',ink.gray,.035),dot(g,'extended-length-end',ink.orange,.035)];
 return(s,d,c)=>{const mass=root.children.find(n=>n.userData.drag==='spring-load'),p=mass?.position.clone()||V(0,2.55-d.extension,0);updateLine(natural,[V(-.3,2.8,.1),V(.9,2.8,.1)]);updateLine(extension,[V(.65,2.8,.1),V(.65,2.8-d.extension,.1)]);extension.userData.extension=d.extension;ends[0].position.set(.65,2.8,.1);ends[1].position.set(.65,2.8-d.extension,.1);
  setVector(up,p,V(0,1,0),d.force,.85/Math.max(d.force,1e-9),c.switches?.vectors!==false);setVector(down,p,V(0,-1,0),d.force,.85/Math.max(d.force,1e-9),c.switches?.vectors!==false);
  at(readout,V(1.1,3.65,.1),`Δl=${fmt(d.extension)} m · F=kΔl=${fmt(d.force)} N`);
 };
}
function swing(g,o){
 const extremes=[dot(g,'left-turning-point',ink.orange),dot(g,'right-turning-point',ink.orange)],equilibrium=dot(g,'pendulum-equilibrium',ink.gray,.05),readout=text(g,'pendulum-period',V(),o);
 return(s,d)=>{const amplitude=s.angle*Math.PI/180;extremes.forEach((node,j)=>{const a=(j?1:-1)*amplitude;node.position.set(s.length*1.3*Math.sin(a),3.5-s.length*1.3*Math.cos(a),0);node.userData.angle=a;});equilibrium.position.set(0,3.5-s.length*1.3,0);at(readout,V(0,3.9,0),`T=${fmt(d.period)} s · θ=${fmt(d.theta*180/Math.PI)}°`);};
}
function oscillate(id,g,o){
 const equilibrium=trace(g,'oscillator-equilibrium',2,ink.gray),limits=[dot(g,'amplitude-negative',ink.orange,.06),dot(g,'amplitude-positive',ink.orange,.06)],readout=text(g,'amplitude-reading',V(),o),driving=id==='resonance'?vector(g,'driving-force',ink.orange):null;
 return(s,d,c)=>{const scale=id==='resonance'?Math.min(6,1.65/Math.max(Number.MIN_VALUE,d.amplitude)):.15,omega0=2*Math.PI/(s.period||1),wd=Math.sqrt(Math.max(Number.MIN_VALUE,omega0*omega0-s.beta*s.beta)),A=id==='resonance'?d.amplitude:Math.abs(s.a)*omega0/wd*Math.exp(-s.beta*(s.t||0));
  if(id==='damped'&&g.parent?.userData.motionBounds){g.parent.userData.motionBounds.expandByPoint(V(-A*scale,.6,.4));g.parent.userData.motionBounds.expandByPoint(V(A*scale,.6,.4));}
  updateLine(equilibrium,[V(0,.2,.45),V(0,1.15,.45)]);limits.forEach((node,j)=>{node.position.set((j?1:-1)*A*scale,.6,.4);node.userData.physicalAmplitude=A;});
  at(readout,V(0,1.55,0),id==='resonance'?`f/f₀=${fmt(s.f/s.f0)} · A=${fmt(d.amplitude)} m`:`A_env=${fmt(A)} cm`);
  if(driving)setVector(driving,V(d.x*scale,.6,0),V(1,0,0),s.force*Math.cos(2*Math.PI*s.f*s.t),1/Math.max(s.force,1e-9),c.switches?.vectors!==false);
 };
}
function superposition(g,o){
 const paths=[trace(g,'source-path-1',2,ink.blue),trace(g,'source-path-2',2,ink.orange)],parts=[vector(g,'displacement-u1',ink.blue),vector(g,'displacement-u2',ink.orange)],readout=text(g,'superposition-reading',V(),o);
 return(s,d,c)=>{const p=V(s.probeX,.65,s.probeZ-1.7);[[-s.separation/2,ink.blue],[s.separation/2,ink.orange]].forEach(([x],j)=>{updateLine(paths[j],[V(x,.65,-1.7),p]);paths[j].visible=c.switches?.connections!==false;setVector(parts[j],p.clone().add(V((j?1:-1)*.12,0,0)),V(0,1,0),j?d.u2:d.u1,.65,c.switches?.vectors!==false);});at(readout,p.clone().add(V(0,.9,0)),`u=u₁+u₂ · Δr/λ=${fmt(d.delta/d.lambda)}`);};
}
function nodes(g,o){
 const antinodes=Array.from({length:5},(_,j)=>dot(g,'antinode-'+j,ink.green,.065)),envelopes=[trace(g,'standing-envelope-positive',65,ink.gray),trace(g,'standing-envelope-negative',65,ink.gray)],readout=text(g,'standing-reading',V(),o);
 return(s,d)=>{antinodes.forEach((node,j)=>{node.visible=j<s.mode;const u=2*s.a*(j%2?-1:1)*Math.cos(2*Math.PI*d.frequency*s.t);node.position.set(-3+6*(j+.5)/s.mode,1.4+u*.9,.16);node.userData.physicalX=s.length*(j+.5)/s.mode;node.userData.displacement=u;});envelopes.forEach((node,j)=>updateLine(node,Array.from({length:65},(_,k)=>V(-3+6*k/64,1.4+(j?-1:1)*Math.abs(2*s.a*Math.sin(s.mode*Math.PI*k/64))*.9,0))));at(readout,V(0,2.1+2*s.a*.9,0),`n=${fmt(s.mode)} · λ=${fmt(d.lambda)} m · f=${fmt(d.frequency)} Hz`);};
}
function longitudinal(g,o){
 const count=64,particles=Array.from({length:count},(_,j)=>dot(g,'sound-particle-'+j,ink.blue,.035)),ruler=trace(g,'sound-wavelength-reference',2,ink.gray),readout=text(g,'sound-reading',V(),o);
 g.userData.spatialScale='two-wavelengths-normalized';g.userData.displacementScale='illustrative-pressure-dependent';
 return(s,d)=>{const amplitude=.04*Math.min(1,s.a);particles.forEach((node,j)=>{const q=5*j/(count-1),phase=2*Math.PI*s.f*s.t-4*Math.PI*q/5,displacement=-amplitude*Math.cos(phase),pressure=s.a*Math.sin(phase);node.position.set(-2+q+displacement,1.05,0);node.material.color.setHSL(.58,.6,.43+.35*(1-pressure/s.a)/2);Object.assign(node.userData,{equilibriumX:-2+q,normalizedDisplacement:displacement,pressure,physicalX:2*d.lambda*q/5});});updateLine(ruler,[V(-2,.55,.15),V(3,.55,.15)]);at(readout,V(.5,1.8,0),`λ=${fmt(d.lambda)} m · x/λ: 0…2 · ξ/ξ₀`);};
}
function circuit(id,g,o){
 const readout=text(g,'circuit-principle',V(0,1.75,0),o),currents=[vector(g,'branch-current-1',ink.blue),vector(g,'branch-current-2',ink.orange),vector(g,'total-current',ink.green)];
 return(s,d,c)=>{at(readout,V(0,1.75,0),id==='parallel'?`U₁=U₂=${fmt(s.u)} V · I=I₁+I₂`:`I₁=I₂=${fmt(d.i)} A · U=U₁+U₂`);g.userData.currents={total:d.i,branch1:d.i1,branch2:d.i2};
  const scale=1/Math.max(Math.abs(d.i),Math.abs(d.i1),Math.abs(d.i2),1e-9),on=c.switches?.vectors!==false;
  setVector(currents[0],V(id==='parallel'?.7:-.8,.8,-1),V(1,0,0),d.i1,scale,on);
  setVector(currents[1],V(id==='parallel'?.7:.8,.8,id==='parallel'?1:-1),V(1,0,0),d.i2,scale,on);
  setVector(currents[2],V(.4,.8,id==='parallel'?1.6:1.4),V(-1,0,0),d.i,scale,on);
 };
}
function heating(g,o){
 const input=vector(g,'electrical-power-flow',ink.blue),heat=vector(g,'thermal-energy-flow',ink.orange),readout=text(g,'heating-reading',V(),o);
 return(s,d,c)=>{const on=c.switches?.vectors!==false;setVector(input,V(-1.8,.8,.1),V(1,0,0),d.power,1/Math.max(d.power,1e-9),on);setVector(heat,V(.2,1,.1),V(1,0,0),d.power,.7/Math.max(d.power,1e-9),on);input.userData.unit='W';heat.userData.heat=d.heat;at(readout,V(0,2.9,0),`P=${fmt(d.power)} W · Q=${fmt(d.heat)} J · T=${fmt(d.temp)} °C`);};
}
function conductor(g,o){
 const current=vector(g,'wire-current',ink.orange),readout=text(g,'magnetic-force-reading',V(),o);
 return(s,d,c)=>{const angle=s.angle*Math.PI/180,direction=V(Math.cos(angle),0,Math.sin(angle));setVector(current,V(0,1.4,0),direction,s.i,Math.min(1,s.length*2)/Math.max(Math.abs(s.i),1e-9),c.switches?.vectors!==false);at(readout,V(0,3.1,0),`I=${fmt(s.i)} A · F=${fmt(d.force)} N`);};
}
function flux(g,o){
 const normal=vector(g,'coil-area-normal',ink.blue),readout=text(g,'flux-reading',V(),o);
 return(s,d,c)=>{const direction=V(Math.cos(d.theta),0,-Math.sin(d.theta));setVector(normal,V(0,1.5,0),direction,1,.9,c.switches?.vectors!==false);normal.userData.cosineWithField=direction.x;at(readout,V(0,3.25,0),`Φ=${fmt(d.flux)} Wb · ε=${fmt(d.emf)} V`);};
}
function population(g,o){
 const total=relativeBar(g,'population-reference',0xd4dce5),remaining=relativeBar(g,'population-remaining',ink.blue),half=trace(g,'half-population-reference',2,ink.orange),readout=text(g,'population-reading',V(),o);
 total.position.set(0,.18,2.1);total.scale.x=4;updateLine(half,[V(0,.08,2.1),V(0,.38,2.1)]);
 return(s,d)=>{remaining.visible=d.remaining>0;remaining.scale.x=4*Math.max(1e-9,d.remaining);remaining.position.set(-2+2*d.remaining,.19,2.1);Object.assign(remaining.userData,{fraction:d.remaining,expectedPopulation:d.N,illustrativeParticleCount:216});at(readout,V(0,3.25,0),`N=${fmt(d.N)} · N/N₀=${fmt(d.remaining)} · N_vis=216`);};
}
export function withExtendedConcepts(model,id,state,data,options={}){
 const descriptor=EXTENDED_CONCEPTS[id];if(!descriptor)return model;
 const layer=new T.Group();layer.name='concept-'+id;layer.userData.concept={id,...descriptor};
 // Geometric references belong in apparatus fitting; floating text alone is
 // excluded so long captions cannot shrink the observed phenomenon.
 layer.userData.conceptualReference=true;model.group.add(layer);
 let update;
 if(['uniform','acceleration','newton'].includes(id))update=motion(id,layer,options);
 else if(['horizontal','projectile'].includes(id))update=flight(id,layer,options);
 else if(id==='incline')update=slope(model.group,layer,options);
 else if(id==='collision')update=impact(model.group,layer,options);
 else if(id==='circular')update=orbit(layer,options);
 else if(id==='lever')update=balance(layer,options);
 else if(id==='hooke')update=spring(model.group,layer,options);
 else if(id==='pendulum')update=swing(layer,options);
 else if(['damped','resonance'].includes(id))update=oscillate(id,layer,options);
 else if(id==='interference')update=superposition(layer,options);
 else if(id==='standing')update=nodes(layer,options);
 else if(id==='sound')update=longitudinal(layer,options);
 else if(['series','parallel'].includes(id))update=circuit(id,layer,options);
 else if(id==='joule')update=heating(layer,options);
 else if(id==='magnetic')update=conductor(layer,options);
 else if(id==='induction')update=flux(layer,options);
 else if(id==='decay')update=population(layer,options);
 const original=model.update;
 model.update=(s,d,c={})=>{original(s,d,c);layer.visible=!!d&&d.domainValid!==false;if(layer.visible)update(s,d,c);};
 if(data&&data.domainValid!==false)update(state,data,options.config||{});
 return model;
}
