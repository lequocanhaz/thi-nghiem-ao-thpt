import {T,V,C,line,arrow,sphere,box,label,setText,updateLine} from './geometry-kit.js?v=35';
import {evaluate} from './models.js?v=54';
import {getLocale} from './i18n.js?v=54';
import {englishParameter} from './english-study.js?v=56';
import {sampleRelation} from './relation-sampling.js?v=65';

// Explicit per-experiment scope. Existing apparatus remains the primary view.
// These predictions are from the scientific evaluator, not fabricated readings.
export const FOUNDATION_CONCEPTS=Object.freeze({
 vector_sum:['angle','result','vector-parallelogram'],vector_components:['angle','fx','orthogonal-components'],
 relative_motion:['t','x','reference-frame-displacement'],average_speed:['v2','average','equal-distances-unequal-times'],braking:['t','v','velocity-area-stopping'],
 atwood:['m2','acc','weight-difference'],pulley:['branches','pull','supporting-rope-branches'],elevator:['acc','normal','normal-minus-weight'],torque_angle:['angle','torque','perpendicular-lever-arm'],
 spring_energy:['extension','energy','work-under-force-extension'],hydraulic_press:['large','output','equal-pressure-different-areas'],communicating:['density2','height2','equal-bottom-pressure'],
 spring_period:['mass','period','mass-period-relation'],oscillator_energy:['t','kinetic','constant-total-energy'],phase_difference:['t','sum','displacement-superposition'],
 string_speed:['tension','speed','tension-wave-speed'],string_resonance:['mode','frequency','fixed-end-harmonics'],sound_level:['exponent','level','logarithmic-intensity'],intensity_distance:['distance','intensity','spherical-spreading'],
 standing_phase:['t','signal','counter-propagating-superposition'],reflection_wave:['t','signal','fixed-boundary-inversion'],uniform_field:['charge','force','signed-charge-force'],potential_point:['distance','potential','signed-inverse-distance'],potential_pair:['distance','potential','signed-potential-superposition'],
 capacitor_plate:['gap','capacity','plate-geometry'],dielectric:['dielectric','charge','fixed-voltage-changing-charge'],capacitor_series:['c2','u1','same-charge-voltage-division'],capacitor_parallel:['c2','q2','same-voltage-charge-addition'],
 charge_quantization:['electrons','charge','discrete-charge'],drift:['current','drift','electron-drift-opposite-current'],wire_stretch:['factor','resistance','constant-volume-wire'],
 potentiometer:['fraction','output','sliding-voltage-division'],voltage_divider:['load','output','loaded-divider'],meter_loading:['meter','error','measurement-load'],battery_series:['cells','current','series-emf-and-resistance'],battery_parallel:['cells','current','parallel-current-sharing'],wire_field:['distance','field','signed-right-hand-field'],flux_angle:['angle','flux','signed-projected-area'],binding_energy:['defect','energy','mass-energy-balance'],
 table_hanging:['hanging','acc','connected-system-forces'],contact_carts:['force','contact','contact-action-reaction'],accelerating_pendulum:['acc','tilt','effective-gravity-direction'],double_incline:['right','acc','opposing-downslope-components'],ladder_balance:['position','wall','moments-about-foot'],beam_supports:['position','rightReaction','load-sharing-reactions'],three_strings:['left','tension1','closed-force-triangle'],slide_tip:['height','tipForce','sliding-versus-tipping'],collision_2d:['angle','speed1','orthogonal-outgoing-momenta'],ballistic_pendulum:['speed','height','momentum-then-energy'],collision_spring:['speed','compression','inelastic-loss-then-elastic-energy'],string_power:['amplitude','power','quadratic-wave-power'],three_charge_energy:['third','energy','signed-pair-energies'],electric_work_paths:['detour','detourWork','path-independent-work'],isolated_dielectric:['dielectric','voltage','fixed-charge-decreasing-voltage'],ammeter_shunt:['range','shunt','parallel-current-split'],voltmeter_design:['range','series','series-voltage-split'],charge_sharing:['u1','final','charge-conservation-energy-loss'],sliding_rod:['speed','force','magnetic-force-opposes-motion'],magnetic_braking:['t','speed','kinetic-energy-to-heat'],coil_entering_field:['t','flux','overlap-and-flux-change'],layered_wall:['thickness1','interface','series-thermal-resistances']
});
const finite=Number.isFinite,rad=x=>x*Math.PI/180;
const fmt=x=>finite(x)?new Intl.NumberFormat('en',{maximumSignificantDigits:3}).format(x):'—';
export function foundationPrediction(e,state){
 const spec=FOUNDATION_CONCEPTS[e.id];if(!spec)return null;
 const [inputKey,outputKey,principle]=spec,p=e.params.find(p=>p.key===inputKey),q=e.readouts.find(q=>q.key===outputKey);
 const current=evaluate(e.id,state),excludedInputs=e.id==='potential_pair'?[state.half,-state.half].filter(x=>x>=p.min&&x<=p.max):[];
 const points=sampleRelation({min:p.min,max:p.max,integer:['charge_quantization','pulley','string_resonance','battery_series','battery_parallel'].includes(e.id),excluded:excludedInputs},x=>{
  const d=evaluate(e.id,{...state,[inputKey]:x});
  return d&&d.domainValid!==false?d[outputKey]:null;
 });
 return {id:e.id,inputKey,outputKey,principle,xUnit:p.unit,yUnit:q.unit,inputLabel:p.label,outputLabel:q.label,
  points,excludedInputs,current:current&&current.domainValid!==false&&finite(current[outputKey])?[state[inputKey],current[outputKey]]:null};
}
/** Two actual capacitor branches, including their conducting connections. The
 * steady-state diagram has no moving carriers: a charged ideal capacitor does
 * not carry a continuing DC current through its dielectric. */
export function buildFoundationCapacitors(e,state,data,o={}){
 const group=new T.Group(),parallel=e.id==='capacitor_parallel';
 const centers=parallel?[V(0,2.5,0),V(0,1.1,0)]:[V(-1.35,1.8,0),V(1.35,1.8,0)];
 const rails=(points)=>{const wire=line(group,points,0x596e87);wire.name='capacitor-connection';return wire;};
 const plates=centers.map((p,i)=>{
  const root=new T.Group();root.name='network-capacitor-'+(i+1);root.position.copy(p);group.add(root);
  const positive=box(root,.06,.75,.45,C.orange,-.12,0,0),negative=box(root,.06,.75,.45,C.blue,.12,0,0);
  const field=arrow(root,V(-.1,0,.35),V(1,0,0),C.green,.2);field.name='capacitor-field-'+(i+1);
  const caption=text(root,'',V(0,.64,.05),{...o,labels:true}),values=text(root,'',V(0,-.58,.05),o);
  return{root,field,caption,values,plates:[positive,negative]};
 });
 if(parallel){for(const p of centers){rails([V(-2.5,p.y),V(p.x-.15,p.y)]);rails([V(p.x+.15,p.y),V(2.5,p.y)]);}rails([V(-2.5,2.5),V(-2.5,.15),V(-.25,.15)]);rails([V(.25,.15),V(2.5,.15),V(2.5,2.5)]);}
 else{rails([V(-2.5,.15),V(-2.5,1.8),V(-1.5,1.8)]);rails([V(-1.2,1.8),V(1.2,1.8)]);rails([V(1.5,1.8),V(2.5,1.8),V(2.5,.15),V(.25,.15)]);rails([V(-2.5,.15),V(-.25,.15)]);}
 box(group,.055,.6,.25,C.orange,-.12,.15,0);box(group,.055,.3,.25,C.blue,.12,.15,0);
 const source=text(group,'',V(0,-.42,.03),o),law=text(group,'',V(0,3.5,.03),o);
 const model={group,update(s,d,c={}){
  const voltages=parallel?[s.voltage,s.voltage]:[d.u1,d.u2];
  const charges=parallel?[d.q1,d.q2]:[d.capacity*s.voltage,d.capacity*s.voltage];
  plates.forEach((p,i)=>{
   // With common gap and dielectric, C is proportional to plate area. Both
   // capacitors use one scale, so their relative capacities remain visible.
   const size=Math.sqrt((i?s.c2:s.c1)/Math.max(s.c1,s.c2));
   p.plates.forEach(plate=>{plate.scale.y=plate.scale.z=size;});
   setText(p.caption,'C'+(i+1));
   setText(p.values,'U'+(i+1)+' = '+fmt(voltages[i])+' V · q'+(i+1)+' = '+fmt(charges[i])+' μC');
   if(p.values)p.values.visible=o.labels!==false;
   p.field.visible=voltages[i]>0&&c.switches?.vectors!==false;
   if(p.field.visible){const length=.2*voltages[i]/120;p.field.setLength(length,Math.min(.07,length*.4),Math.min(.035,length*.2));}
   p.root.userData.capacitor={voltage:voltages[i],charge:charges[i],capacity:i?s.c2:s.c1};
  });
  setText(source,'U = '+fmt(s.voltage)+' V');setText(law,parallel?'U₁ = U₂ = U · q = q₁ + q₂':'q₁ = q₂ · U = U₁ + U₂');
  if(source)source.visible=o.labels!==false;if(law)law.visible=o.labels!==false;
  group.userData.capacitorNetwork={topology:parallel?'parallel':'series',voltages,charges,steadyCurrent:0};
 }};
 model.update(state,data,o.config||{});return model;
}
function text(g,value,p,o={}){
 if(typeof document==='undefined'||g.name==='foundation-observation-plot'||o.labels===false)return null;
 return label(g,value,p,{...o,labels:true,width:768,height:96,fontSize:34,fontWeight:600,pixelSize:12,scale:[3.2,.4]});
}
function setArrow(a,p,v,k=1){const n=v.length()*k;a.position.copy(p);a.visible=n>1e-9;if(a.visible){a.setDirection(v.clone().normalize());a.setLength(n,Math.min(.13,n*.3),Math.min(.065,n*.15));}}
// Signed comparisons always share one scale. Zero force means no arrow.
function forceCue(e,g,o){
 const arrows=[C.blue,C.orange,C.green,C.purple].map((c,i)=>{const a=arrow(g,V(),V(1,0,0),c,.1);a.name='foundation-force-'+i;return a;});
 const names=arrows.map(()=>text(g,'',V(),{...o,pixelSize:12}));
 const tag=text(g,'',V(0,3.48,.65),o),origin=V(0,1.6,.65);
 return(s,d,c={})=>{
  let vectors=null,caption='',symbols=[],origins=null;
  if(!d||d.domainValid===false){arrows.forEach(a=>a.visible=false);names.forEach(n=>{if(n)n.visible=false;});return;}
  switch(e.id){
   case 'elevator':vectors=[V(0,d.normal),V(0,-d.weight)];caption='N − mg = ma';break;
   case 'atwood':vectors=[V(0,d.tension),V(0,-s.m1*9.81),V(0,d.tension),V(0,-s.m2*9.81)];symbols=['T','m₁g','T','m₂g'];origins=[V(-.7,1.2,.65),V(-.35,1.2,.65),V(.35,1.2,.65),V(.7,1.2,.65)];caption='m₂g − m₁g = (m₁ + m₂)a';break;
   case 'uniform_field':vectors=[V(s.field),V(d.force)];caption='E → · F = qE';break;
   case 'contact_carts':vectors=[V(d.contact),V(-d.contact)];caption='N₁₂ = −N₂₁';break;
   case 'three_strings':vectors=[V(-d.tension1*Math.cos(rad(s.left)),d.tension1*Math.sin(rad(s.left))),V(d.tension2*Math.cos(rad(s.right)),d.tension2*Math.sin(rad(s.right))),V(0,-d.load)];caption='ΣF = 0';break;
   case 'beam_supports':vectors=[V(0,d.leftReaction),V(0,d.rightReaction),V(0,-s.load),V(0,-s.beamWeight)];symbols=['R₁','R₂','P','W'];origins=[V(-2.3,1.6,.65),V(2.3,1.6,.65),V(-2.3+4.6*s.position,1.6,.7),V(0,1.6,.65)];caption='R₁ + R₂ = P + W';break;
   case 'drift':vectors=[V(s.current),V(-d.drift)];symbols=['I (A)','vₑ (mm/s)'];caption='I → · e⁻ ←';break;
   case 'sliding_rod':vectors=[V(s.speed),V(d.force)];caption='F · v ≤ 0';break;
   case 'accelerating_pendulum':vectors=[V(0,-s.mass*9.81),V(s.mass*s.acc,s.mass*9.81)];caption='T + mg = ma';break;
   case 'double_incline':vectors=[V(-s.mass*9.81*Math.sin(rad(s.left))),V(s.second*9.81*Math.sin(rad(s.right)))];caption='m₂g sinβ − m₁g sinα';break;
   case 'table_hanging':vectors=[V(s.hanging*9.81),V(-d.frictionForce)];caption='m₂g − f = (m₁ + m₂)a';break;
   default:break;
  }
  if(!vectors){arrows.forEach(a=>a.visible=false);names.forEach(n=>{if(n)n.visible=false;});if(tag)tag.visible=false;return;}
  const physicalVectors=vectors.map(v=>v.toArray());
  if(!symbols.length)symbols=({elevator:['N','mg'],uniform_field:['E (N/C)','F (mN)'],contact_carts:['N₁₂','N₂₁'],three_strings:['T₁','T₂','mg'],sliding_rod:['v (m/s)','F (N)'],accelerating_pendulum:['mg','T'],double_incline:['m₁g sinα','m₂g sinβ'],table_hanging:['m₂g','f']})[e.id]||[];
  // Different dimensions are never compared by arrow length.
  if(['uniform_field','sliding_rod','drift'].includes(e.id)){
   vectors=vectors.map(v=>v.length()?v.normalize().multiplyScalar(1.1):v);
   vectors.forEach((v,i)=>setArrow(arrows[i],origin.clone().add(V(0,i*.4,0)),v));
  }else{
   const k=1.25/Math.max(...vectors.map(v=>v.length()),1e-12);
   vectors.forEach((v,i)=>setArrow(arrows[i],origins?.[i]||origin.clone().add(V((i-(vectors.length-1)/2)*.45,0,0)),v,k));
  }
  for(let i=vectors.length;i<arrows.length;i++)arrows[i].visible=false;
  for(let i=0;i<arrows.length;i++){
   const a=arrows[i],n=names[i];a.visible=a.visible&&c.switches?.vectors!==false;
   if(n){n.visible=o.labels!==false&&!!symbols[i]&&a.visible;n.position.copy(a.position).add(V(i%2?.35:-.35,.2,0));n.userData.pixelAnchor.copy(n.position);setText(n,symbols[i]||'');}
   a.userData.physicalVector=physicalVectors[i]||null;
  }
  setText(tag,caption);if(tag)tag.visible=o.labels!==false;g.userData.foundationForces={vectors:physicalVectors,comparison:['uniform_field','sliding_rod','drift'].includes(e.id)?'direction-only':'common-force-scale',caption};
 };
}
export function enhanceFoundation(model,e,state,data,o={}){
 if(!FOUNDATION_CONCEPTS[e.id])return model;
 const g=new T.Group();g.name='foundation-concept-'+e.id;g.userData.foundationConcept=true;model.group.add(g);
 const chartGroup=new T.Group();chartGroup.name='foundation-observation-plot';g.add(chartGroup);
 // The plot is immediately above the apparatus, occupying only 1.35 world units.
 // It contains one dependent quantity, with explicit SI/display units and a live point.
 const x0=-3.05,x1=3.05,y0=4.0,y1=5.1;
 const axes=line(chartGroup,[V(x0,y1),V(x0,y0),V(x1,y0)],0x35475d);axes.name='foundation-plot-axes';
 const positions=new Float32Array(64*2*3),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));
 const curve=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0x245fa6}));curve.name='foundation-prediction-curve';chartGroup.add(curve);
 const discrete=['charge_quantization','pulley','string_resonance','battery_series','battery_parallel'].includes(e.id);
 const dots=new T.Points(geometry,new T.PointsMaterial({color:0x245fa6,size:.07}));dots.name='foundation-discrete-predictions';dots.visible=discrete;curve.visible=!discrete;chartGroup.add(dots);
 const marker=sphere(chartGroup,.065,C.orange);marker.name='foundation-current-point';
 const zero=line(chartGroup,[V(x0,y0),V(x1,y0)],0xb5bfca,true);zero.name='foundation-zero-reference';
 const heading=text(chartGroup,'',V(0,5.55,0),o),xLabel=text(chartGroup,'',V(0,3.74,0),o),yLabel=text(chartGroup,'',V(-1.6,5.28,0),o),legend=text(chartGroup,'',V(1.6,5.28,0),o);
 const cue=forceCue(e,g,o),base=model.update;let signature='',cached=null,locale='';
 model.update=(s,d,c={})=>{
  base(s,d,c);
  const [key]=FOUNDATION_CONCEPTS[e.id],next=JSON.stringify(Object.entries(s).filter(([k])=>k!==key)),lang=getLocale();
  if(next!==signature||!cached){cached=foundationPrediction(e,s);signature=next;}
  const current=d&&d.domainValid!==false&&finite(d[cached.outputKey])?[s[key],d[cached.outputKey]]:null;
  const values=cached.points.filter(Boolean),xs=values.map(p=>p[0]),ys=values.map(p=>p[1]);if(current){xs.push(current[0]);ys.push(current[1]);}
  const input=e.params.find(p=>p.key===key);
  const xmin=xs.length?Math.min(...xs):input.min,xmax=xs.length?Math.max(...xs):input.max,ymin=Math.min(0,...ys),rawMax=Math.max(0,...ys),span=rawMax-ymin||1,ymax=rawMax+span*.08,ylow=ymin-span*.08;
  const project=p=>V(x0+(p[0]-xmin)/(xmax-xmin||1)*(x1-x0),y0+(p[1]-ylow)/(ymax-ylow)*(y1-y0),.03);
  let count=0;for(let i=1;i<cached.points.length;i++){const a=cached.points[i-1],b=cached.points[i];if(!a||!b)continue;const pa=project(a),pb=project(b);positions.set(pa.toArray(),count*3);positions.set(pb.toArray(),(count+1)*3);count+=2;}
  geometry.attributes.position.needsUpdate=true;geometry.setDrawRange(0,count);geometry.computeBoundingSphere();
  marker.visible=!!current;if(current)marker.position.copy(project(current));
  const zeroY=project([xmin,0]).y;updateLine(zero,[V(x0,zeroY,.01),V(x1,zeroY,.01)]);
  const en=lang==='en-US',p=e.params.find(p=>p.key===key),q=e.readouts.find(q=>q.key===cached.outputKey);
  if(locale!==lang){locale=lang;setText(heading,en?'Analytical prediction · current state':'Dự đoán lý thuyết · trạng thái hiện tại');}
  setText(xLabel,(en?englishParameter(p):p.label)+' ['+(p.unit||'1')+'] '+fmt(xmin)+'…'+fmt(xmax));
  setText(yLabel,(en?cached.outputKey:q.label)+' ['+(q.unit||'1')+'] '+fmt(ymin)+'…'+fmt(rawMax));
  setText(legend,current?(en?'Current: ':'Hiện tại: ')+fmt(current[0])+' → '+fmt(current[1]):'—');
  cue(s,d,c);
  g.userData.foundationConcept={...cached,current,range:{xmin,xmax,ymin:ylow,ymax},plotKind:discrete?'discrete-points':'continuous',curveKind:'analytical-prediction',markerKind:'current-simulation-output'};
  model.group.userData.foundationConcept=g.userData.foundationConcept;
  chartGroup.visible=false;
 };
 model.update(state,data,o.config||{});return model;
}
