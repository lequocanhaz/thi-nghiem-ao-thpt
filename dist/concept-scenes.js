import * as T from './vendor/three.module.min.js';
import {modelLabel} from './model-label.js?v=49';

// Quantitative observations attached to the apparatus, not alternative solvers.
// Curves are analytical predictions; the highlighted point is the current model
// output. Neither the display coordinates nor these buffers write into state.
export const coreConceptIDs=Object.freeze(['energy','oscillation','wave','electric','ohm','capacitor','boyle','gas']);
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const C={ink:0x243d56,blue:0x2163ad,orange:0xb65c1f,green:0x0d7964,purple:0x7256a4,pale:0xf7fafc};
const number=value=>Number.isFinite(value)?new Intl.NumberFormat('en',{maximumSignificantDigits:3}).format(value):'—';
function label(group,text,position,options={}){
 // Instrument units/symbols stay visible like a meter's LCD; optional captions
 // elsewhere still follow the existing "labels" setting.
 return modelLabel(group,text,position,{labels:true,width:512,height:88,fontSize:34,fontWeight:600,pixelSize:13,scale:[1.35,.24],...options});
}
function line(group,name,points,color=C.ink){
 const object=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color}));
 object.name=name;group.add(object);return object;
}
function sphere(group,name,radius,color){
 const object=new T.Mesh(new T.SphereGeometry(radius,16,10),new T.MeshStandardMaterial({color,roughness:.65,metalness:0}));
 object.name=name;group.add(object);return object;
}
function arrow(group,name,color){
 const object=new T.ArrowHelper(V(1),V(),1,color,.12,.06);object.name=name;group.add(object);return object;
}
function vector(object,origin,components,scale=1,on=true){
 const value=V(...components),magnitude=value.length();object.visible=!!on&&Number.isFinite(magnitude)&&magnitude>1e-12;
 object.userData.physicalVector=[...components];object.userData.displayScale=scale;
 if(!object.visible)return;
 object.position.copy(origin);object.setDirection(value.multiplyScalar(1/magnitude));object.setLength(magnitude*scale,Math.min(.12,magnitude*scale*.25),.06);
}
function writeLine(object,points){
 const array=object.geometry.attributes.position;
 points.forEach((point,i)=>array.setXYZ(i,point.x,point.y,point.z));array.needsUpdate=true;
 object.geometry.computeBoundingSphere();
}
function plot(group,id,position,{width=2.6,height=.85,xLabel,yLabel,title}){
 const root=new T.Group();root.name=`concept-${id}-plot`;root.position.copy(position);group.add(root);
 root.userData.displaySize={width,height};
 const back=new T.Mesh(new T.PlaneGeometry(width+.65,height+1.15),new T.MeshBasicMaterial({color:C.pale,side:T.DoubleSide}));back.position.set(width/2,height/2-.15,-.035);root.add(back);
 line(root,'concept-plot-axes',[V(0,height),V(),V(width)],C.ink);
 const series=line(root,`concept-${id}-curve`,Array.from({length:65},()=>V()),C.blue);
 const point=sphere(root,`concept-${id}-point`,.075,C.orange);
 // Text is displayed by observation-view outside the canvas. No hidden canvas
 // textures are needed for labels that will never be painted in the 3D scene.
 let signature;
 return {
  root,
  update({xmin=0,xmax,ymin=0,ymax,curve,x,y,caption:copy,title:nextTitle,key}){
   if(![xmin,xmax,ymin,ymax,x,y].every(Number.isFinite)||xmax<=xmin||ymax<=ymin){root.visible=false;return;}
   root.visible=true;
   const axes={xmin,xmax,ymin,ymax,xLabel,yLabel};root.userData.axes=axes;
   const project=(a,b)=>V((a-xmin)/(xmax-xmin)*width,(b-ymin)/(ymax-ymin)*height,.015);
   const next=JSON.stringify([xmin,xmax,ymin,ymax,key]);
   if(next!==signature){
    const values=Array.from({length:65},(_,i)=>{const a=xmin+(xmax-xmin)*i/64;return[a,curve(a)];});
    writeLine(series,values.map(([a,b])=>project(a,b)));series.userData.data=values;
    root.userData.curveRevisions=(root.userData.curveRevisions||0)+1;signature=next;
   }
   point.position.copy(project(x,y));point.userData.value=[x,y];
   root.userData.observation={xmin,xmax,ymin,ymax,xLabel,yLabel,title:nextTitle||title,points:series.userData.data,current:[x,y],kind:'continuous'};
   // Relations are rendered in the readable HTML panel, outside the apparatus.
   root.visible=false;
  }
 };
}
function plotConcept(group,id,s,d,o){
 const positions={ohm:V(-1.3,.65,-1.8),capacitor:V(-1.3,.8,-1.65),boyle:V(-1.3,1.3,-1),gas:V(-1.3,1.4,-1.2)};
 const specs={ohm:{xLabel:'U (V)',yLabel:'I (A)',title:'I = U / R'},capacitor:{xLabel:'t (s)',yLabel:'U_C (V)',title:'RC'},boyle:{xLabel:'V (L)',yLabel:'p (kPa)',title:'pV = constant'},gas:{xLabel:'T (K)',yLabel:'p (kPa)',title:'p = nRT / V'}};
 const chart=plot(group,id,positions[id],specs[id]);
 const current=id==='capacitor'?arrow(group,'concept-capacitor-current',C.green):null;
 const observer=['boyle','gas'].includes(id)?sphere(group,`concept-${id}-observer`,.075,C.orange):null;
 const sampleMatrix=new T.Matrix4(),samplePosition=V(),sampleScale=V(),sampleRotation=new T.Quaternion();
 return(state,data,c={})=>{
  if(!data){chart.root.visible=false;if(current)current.visible=false;return;}
  if(id==='ohm'){
   const xmax=Math.max(12,state.u),ymax=Math.max(1,xmax/state.r);
   chart.update({xmax,ymax,curve:u=>u/state.r,x:state.u,y:data.i,key:state.r,caption:`I = ${number(data.i)} A`});
  }else if(id==='capacitor'){
   const tau=state.r*1000*state.c/1e6,u=state.u,discharge=c.capMode==='discharge';
   chart.update({xmax:Math.max(5*tau,state.t||0),ymax:Math.max(u,1e-9),curve:t=>u*(discharge?Math.exp(-t/tau):1-Math.exp(-t/tau)),x:state.t||0,y:data.uc,key:[tau,u,discharge],caption:`τ = ${number(tau)} s`,title:'τ = RC'});
   vector(current,V(-.9,.82,-1.4),[data.i,0,0],1.1/Math.max(1e-20,u/(state.r*1000)),c.switches?.vectors!==false);
  }else if(id==='boyle'){
   const xmin=Math.max(.2,state.v/4),xmax=Math.min(50,Math.max(10,state.v*2)),ymax=600/xmin;
   chart.update({xmin,xmax,ymax,curve:v=>600/v,x:state.v,y:data.p,key:'isotherm',caption:`pV ${number(data.p*state.v)} kPa·L`,title:'T = 300 K'});
  }else{
   const xmax=Math.max(600,state.tK),slope=state.n*8.314462618/state.v,ymax=slope*xmax;
   chart.update({xmax,ymax,curve:t=>slope*t,x:state.tK,y:data.p,key:slope,caption:`n = ${number(state.n)} mol`});
  }
  if(observer){
   const samples=group.parent.getObjectByName(id==='gas'?'gas-particles':'boyle-particles');observer.visible=!!samples?.count;
   if(observer.visible){samples.getMatrixAt(0,sampleMatrix);sampleMatrix.decompose(samplePosition,sampleRotation,sampleScale);observer.position.copy(samplePosition);observer.scale.copy(sampleScale);observer.userData.sampleIndex=0;}
  }
 };
}
function energyConcept(group){
 const gravity=arrow(group,'concept-energy-gravity',C.purple),velocity=arrow(group,'concept-energy-velocity',C.orange);
 label(group,'g',V(-.6,.7,.15));
 return(s,d,c={})=>{if(!d)return;const origin=V(-1,.25+d.h*.2,.2);vector(gravity,origin,[0,-9.81,0],.075,c.switches?.vectors!==false);vector(velocity,origin,[0,-d.v,0],1.2/Math.max(1,Math.sqrt(2*9.81*s.h0)),c.switches?.vectors!==false);};
}
function oscillationConcept(group){
 const endpoints=[-1,1].map(sign=>{
  const marker=line(group,`concept-oscillation-turn-${sign}`,[V(0,.12,.2),V(0,1.1,.2)],C.purple);
  const caption=label(group,sign<0?'−A':' +A',V(0,.06,.25),{scale:[.65,.21]});return{marker,caption,sign};
 });
 label(group,'x = 0',V(0,1.7,.05),{scale:[1,.21]});
 return(s)=>{for(const{marker,caption,sign}of endpoints){marker.position.x=sign*Math.abs(s.a)*.12;if(caption){caption.position.x=marker.position.x;caption.userData.pixelAnchor.x=caption.position.x;}}};
}
function waveConcept(group){
 const bracket=line(group,'concept-wave-wavelength',[V(),V(),V(),V()],C.green);
 const displacement=arrow(group,'concept-wave-displacement',C.orange),caption=label(group,'',V(0,2.6,.25),{scale:[2.5,.24]});
 const probeGuide=line(group,'concept-wave-fixed-particle',[V(),V()],C.orange);
 return(s,d,c={})=>{
  const lambda=d.wavelength,amplitude=Math.abs(s.a)*.7,y=1.3+amplitude+.4;
  bracket.visible=lambda<=6&&c.switches?.trajectory!==false;
  if(bracket.visible)writeLine(bracket,[V(-3,y-.1,.2),V(-3,y,.2),V(-3+lambda,y,.2),V(-3+lambda,y-.1,.2)]);
  caption?.userData.setText(`λ ${number(lambda)} m · u(2 m)`);
  if(caption){caption.position.set(0,y+.25,.25);caption.userData.pixelAnchor.copy(caption.position);}
  const u=s.a*Math.cos(2*Math.PI*(s.f*(s.t||0)-2/lambda));
  vector(displacement,V(-1,1.3,.23),[0,u,0],.7,c.switches?.vectors!==false);
  writeLine(probeGuide,[V(-1,1.3-amplitude-.15,.22),V(-1,1.3+amplitude+.15,.22)]);
  probeGuide.userData.fixedMaterialCoordinate=2;
 };
}
function electricConcept(group,options){
 const mode=options.config?.mode??3,keys=mode===1?['q1']:['q1','q2'];
 const marks=keys.map(key=>{
  const root=new T.Group();root.name=`concept-electric-sign-${key}`;group.add(root);
  line(root,'charge-sign-horizontal',[V(-.08,0,.16),V(.08,0,.16)],C.ink);
  const vertical=line(root,'charge-sign-vertical',[V(0,-.08,.16),V(0,.08,.16)],C.ink);
  const zero=line(root,'charge-sign-zero',Array.from({length:25},(_,i)=>V(.06*Math.cos(i*Math.PI/12),.06*Math.sin(i*Math.PI/12),.16)),C.ink);
  return{root,key,vertical,zero};
 });
 const componentLabels=[0,1].map(i=>label(group,'',V(),{scale:[.8,.2]}));
 return(s,d,c={})=>{
  for(const{root,key,vertical,zero}of marks){const i=key==='q1'?1:2;root.position.set(s['x'+i]*8,s['y'+i]*8,(s['z'+i]||0)*8);vertical.visible=s[key]>0;zero.visible=s[key]===0;root.children[0].visible=s[key]!==0;root.userData.charge=s[key];}
  componentLabels.forEach((caption,i)=>{
   if(!caption)return;const source=group.getObjectByName(`electric-component-${i}`);
   caption.visible=!!d&&!!source?.visible&&c.switches?.components!==false;
   if(caption.visible){const factor=source.userData.vectorScale||1,part=d.parts[i],target=source.position.clone().add(V(part.x,part.y,part.z||0).multiplyScalar(factor));target.y+=.2;caption.position.copy(target);caption.userData.pixelAnchor.copy(target);caption.userData.setText((mode===0||mode===2?'F':'E')+(i+1));}
  });
 };
}

export function withConceptScene(model,id,state,data,options={}){
 if(!coreConceptIDs.includes(id))return model;
 const root=new T.Group();root.name='concept-observation';root.userData.conceptVersion=64;root.userData.experiment=id;model.group.add(root);
 const update=['ohm','capacitor','boyle','gas'].includes(id)?plotConcept(root,id,state,data,options):id==='energy'?energyConcept(root):id==='oscillation'?oscillationConcept(root):id==='wave'?waveConcept(root):electricConcept(model.group,options);
 const original=model.update;
 model.update=(s,d,c={})=>{original(s,d,c);root.visible=!!d&&d.domainValid!==false;update(s,d,c);};
 // The first apparatus update has already happened in buildBaseModel.
 update(state,data,options.config||{});
 return model;
}
