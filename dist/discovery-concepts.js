// Theoretical relations accompanying the apparatus. No recorded data are modified.
import {T,C,V,box,line,sphere,label,setText,updateLine} from './geometry-kit.js?v=35';
import {evaluateDiscovery} from './discovery-models.js?v=17';
import {getLocale} from './i18n.js?v=54';

const spec=(variable,output,min,max,xLabel,yLabel,title,en,scale=1)=>({variable,output,min,max,xLabel,yLabel,title,en,scale});
export const discoveryConcepts=Object.freeze({
 freefall:spec('t','height',0,s=>Math.sqrt(2*s.h0/s.gravity),'t (s)','h (m)','Tốc độ tăng khi vật rơi','Speed increases while falling'),
 friction:spec('force','acc',0,30,'F (N)','a (m/s²)','Ngưỡng ma sát rồi tăng tốc','Friction threshold, then acceleration'),
 work:spec('angle','work',0,120,'α (°)','A (J)','Chỉ thành phần dọc đường sinh công','Only the parallel component does work'),
 impulse:spec('t','momentum',0,4,'t (s)','p (kg·m/s)','Lực làm thay đổi động lượng','Force changes momentum'),
 buoyancy:spec('fraction','buoyant',0,1,'V chìm / V','Fₐ (N)','Lực đẩy theo thể tích chìm','Buoyant force and submerged volume'),
 pressure:spec('depth','pressure',0,5,'h (m)','p (kPa)','Áp suất gồm phần mặt thoáng','Pressure includes surface pressure'),
 reflection:spec('angle','reflected',0,80,'i (°)','r (°)','Góc đo với pháp tuyến','Angles measured from the normal'),
 refraction:spec('angle','refracted',0,80,'i (°)','r (°)','Tia khúc xạ theo định luật Snell','Refraction follows Snell’s law'),
 tir:spec('angle','refracted',0,85,'i (°)','r (°)','Qua góc giới hạn: không còn tia khúc xạ','Beyond critical angle: no refracted ray'),
 lens:spec('inverseDistance','inverseImage',1/80,1/8,'1/d (cm⁻¹)',"1/d′ (cm⁻¹)",'Ảnh thật, vô cực và ảnh ảo','Real, infinite and virtual images'),
 mirror:spec('inverseDistance','inverseImage',1/80,1/8,'1/d (cm⁻¹)',"1/d′ (cm⁻¹)",'Ảnh thật và ảo qua tiêu điểm','Real and virtual images across the focus'),
 prism:spec('index','red',1.26,1.74,'n','δmin (°)','Mỗi màu ở lệch cực tiểu riêng','Each color at its own minimum deviation'),
 young:spec('probe','intensity',-12,12,'x (mm)','I / Imax','Vân sáng và vân tối trên màn','Bright and dark fringes on the screen'),
 diffraction:spec('probe','intensity',-20,20,'x (mm)','I / I₀','Khe hẹp làm vân giữa rộng hơn','A narrower slit broadens the central fringe'),
 polarization:spec('angle','intensity',0,180,'α (°)','I (W/m²)','Hai trục vuông góc chặn ánh sáng','Crossed axes extinguish the light'),
 thermalexpansion:spec('temp','extension',20,200,'T (°C)','Δl (mm)','Nở dài so với mốc 20 °C','Expansion relative to 20 °C'),
 calorimetry:spec('mHot','finalTemp',.1,1,'m nóng (kg)','T cân bằng (°C)','Nhiệt nhường bằng nhiệt nhận','Heat released equals heat absorbed'),
 phasechange:spec('heatKJ','temp',0,s=>(-s.initial*s.mass*2100+s.mass*334000+s.mass*4180*80)/1000,'Q (kJ)','T (°C)','Nóng chảy: nhận nhiệt, nhiệt độ không đổi','Melting: heat enters at constant temperature'),
 heattransfer:spec('length','power',.1,1,'l (m)','P (W)','Dẫn nhiệt từ nóng sang lạnh','Heat conduction from hot to cold'),
 isobaric:spec('temp','volume',200,600,'T (K)','V (L)','Đẳng áp: V tỉ lệ với T tuyệt đối','Constant pressure: volume follows absolute T'),
 isochoric:spec('temp','pressure',150,600,'T (K)','p (kPa)','Đẳng tích: p tỉ lệ với T tuyệt đối','Constant volume: pressure follows absolute T'),
 firstlaw:spec('heat','deltaU',-200,300,'Q (J)','ΔU (J)','Nội năng nhận cả nhiệt và công','Internal energy receives heat and work'),
 kinetic:spec('temp','rms',150,900,'T (K)','v RMS (m/s)','Nhiệt độ liên hệ động năng phân tử','Temperature relates to molecular kinetic energy'),
 resistivity:spec('length','resistance',.5,10,'l (m)','R (Ω)','Dây dài hơn có điện trở lớn hơn','A longer wire has greater resistance'),
 internalresistance:spec('load','terminal',.2,20,'R tải (Ω)','U (V)','Sụt áp Ir bên trong nguồn','Voltage loss Ir inside the source'),
 bridge:spec('r4','difference',5,100,'R₄ (Ω)','U AB (V)','Cân bằng khi hai điện thế bằng nhau','Balance when the two potentials are equal'),
 solenoid:spec('i','b',-5,5,'I (A)','B (mT)','Đảo dòng điện thì đảo từ trường','Reverse current to reverse the field',1000),
 lorentz:spec('speed','force',1,10,'v (m/s)','F (µN)','Lực vuông góc vận tốc, không sinh công','Force perpendicular to velocity does no work',1e6),
 transformer:spec('n2','u2',50,500,'N₂','U₂ RMS (V)','Tỉ số điện áp bằng tỉ số số vòng','Voltage ratio equals the turns ratio'),
 ac:spec('t','voltage',0,6,'t (s)','u (V)','Điện áp và dòng điện cùng pha','Voltage and current are in phase')
});
function inputFor(id,s,value){
 const q=discoveryConcepts[id];
 if(q.variable==='inverseDistance')return {...s,distance:1/value};
 if(q.variable==='heatKJ')return {...s,t:value*1000/s.power};
 return {...s,[q.variable]:value,...(id==='prism'?{dispersion:0}:{})};
}
function outputFor(id,s,d){return ['lens','mirror'].includes(id)?(d.image===null?0:1/d.image):d[discoveryConcepts[id].output]*discoveryConcepts[id].scale;}
export function discoveryRelation(id,s,d=evaluateDiscovery(id,s)){
 const q=discoveryConcepts[id];if(!q)return null;
 const min=typeof q.min==='function'?q.min(s):q.min,max=typeof q.max==='function'?q.max(s):q.max;
 const samples=Array.from({length:193},(_,j)=>{
  const x=min+(max-min)*j/192,state=inputFor(id,s,x),data=evaluateDiscovery(id,state);
  const y=outputFor(id,state,data);return {x,y:data[q.output]===null&&!['lens','mirror'].includes(id)?null:Number.isFinite(y)?y:null};
 });
 let x=q.variable==='inverseDistance'?1/s.distance:q.variable==='heatKJ'?d.heat/1000:id==='prism'?s.index-s.dispersion/2:q.variable==='t'?(d.t??s.t??0):s[q.variable]||0;
 let y=outputFor(id,s,d);if(d[q.output]===null&&!['lens','mirror'].includes(id))y=null;
 const values=samples.filter(p=>p.y!==null).map(p=>p.y);if(Number.isFinite(y))values.push(y);
 let ymin=Math.min(0,...values),ymax=Math.max(0,...values);if(ymax-ymin<1e-12){ymin-=.5;ymax+=.5;}
 const pad=(ymax-ymin)*.06;ymin-=pad;ymax+=pad;
 return {id,min,max,ymin,ymax,xLabel:q.xLabel,yLabel:q.yLabel,samples,marker:{x,y:Number.isFinite(y)?y:null},title:q.title,en:q.en};
}
// Retained lines and marker avoid creating/discarding WebGL objects while playing.
export function addDiscoveryConcept(group,id,state,data,o={}){
 if(!discoveryConcepts[id])return ()=>{};
 const panel=new T.Group();panel.name='discovery-concept-'+id;panel.userData.conceptId=id;panel.userData.theoretical=true;group.add(panel);
 panel.position.set(0,4.3,-.9);
 const w=4.9,h=1.45,x0=-w/2,y0=-h/2;
 const board=box(panel,w+.55,h+.75,.035,0xf5f8fc,0,.04,-.05);board.userData.conceptPanel=true;board.castShadow=false;
 line(panel,[V(x0,y0,0),V(x0+w,y0,0)],0x7d8b9e);line(panel,[V(x0,y0,0),V(x0,y0+h,0)],0x7d8b9e);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(192*6),3));
 const curve=new T.LineSegments(geometry,new T.LineBasicMaterial({color:C.blue}));curve.name='concept-theoretical-curve';panel.add(curve);
 const zero=line(panel,[V(),V()],0xaeb9c7,true),marker=sphere(panel,.075,C.orange);marker.name='concept-current-state';
 // Axis units are part of the instrument, independent of optional scene labels.
 const small={...o,labels:true,fontSize:28,fontWeight:550,width:768,height:100,pixelSize:12,scale:[4.8,.5]};
 const title=label(panel,'',V(0,1.15,.08),small),xLabel=label(panel,'',V(.55,-1.02,.08),{...small,scale:[3.3,.43]}),yLabel=label(panel,'',V(-1.8,.86,.08),{...small,scale:[2,.36]});
 const low=label(panel,'',V(x0,-.89,.08),{...small,scale:[.9,.29]}),high=label(panel,'',V(x0+w,-.89,.08),{...small,scale:[.9,.29]}),legend=label(panel,'',V(1.3,.88,.08),{...small,scale:[2.7,.3]});
 const ylow=label(panel,'',V(x0+.33,y0+.12,.08),{...small,scale:[.7,.26]}),yhigh=label(panel,'',V(x0+.33,y0+h-.12,.08),{...small,scale:[.7,.26]});
 let signature='',relation;
 const number=x=>Math.abs(x)>9999||Math.abs(x)>0&&Math.abs(x)<.001?x.toExponential(1):Number(x.toFixed(3)).toString();
 function update(s,d){
  const q=discoveryConcepts[id],key=JSON.stringify(Object.entries(s).filter(([name])=>name!==q.variable&&name!=='t'&&!(q.variable==='inverseDistance'&&name==='distance')));
  if(key!==signature){
   signature=key;relation=discoveryRelation(id,s,d);const arr=geometry.attributes.position;
   const point=p=>V(x0+(p.x-relation.min)/(relation.max-relation.min)*w,y0+(p.y-relation.ymin)/(relation.ymax-relation.ymin)*h,.02);
   let count=0;
   for(let j=1;j<relation.samples.length;j++){
    const a=relation.samples[j-1],b=relation.samples[j];if(a.y===null||b.y===null)continue;
    const pa=point(a),pb=point(b);arr.setXYZ(count++,pa.x,pa.y,pa.z);arr.setXYZ(count++,pb.x,pb.y,pb.z);
   }
   geometry.setDrawRange(0,count);arr.needsUpdate=true;geometry.computeBoundingSphere();
   const yz=y0+(0-relation.ymin)/(relation.ymax-relation.ymin)*h;updateLine(zero,[V(x0,yz,.01),V(x0+w,yz,.01)]);
   panel.userData.relation=relation;
  }
  const current=discoveryRelationPoint(id,s,d),x=current.x,y=current.y;
  marker.visible=Number.isFinite(y)&&x>=relation.min-1e-9&&x<=relation.max+1e-9;
  if(marker.visible)marker.position.set(x0+(x-relation.min)/(relation.max-relation.min)*w,y0+(y-relation.ymin)/(relation.ymax-relation.ymin)*h,.07);
  panel.userData.current={...current};
  const en=getLocale()==='en-US';setText(title,en?q.en:q.title);setText(xLabel,q.xLabel);setText(yLabel,q.yLabel);setText(low,number(relation.min));setText(high,number(relation.max));setText(ylow,number(relation.ymin));setText(yhigh,number(relation.ymax));setText(legend,en?'Theory · Orange: current state':'Lý thuyết · Cam: trạng thái hiện tại');
  panel.visible=false;
 }
 update(state,data);return update;
}
export function discoveryRelationPoint(id,s,d=evaluateDiscovery(id,s)){
 const q=discoveryConcepts[id],x=q.variable==='inverseDistance'?1/s.distance:q.variable==='heatKJ'?d.heat/1000:id==='prism'?s.index-s.dispersion/2:q.variable==='t'?(d.t??s.t??0):s[q.variable]||0;
 const y=outputFor(id,s,d);return {x,y:d[q.output]===null&&!['lens','mirror'].includes(id)?null:Number.isFinite(y)?y:null};
}
