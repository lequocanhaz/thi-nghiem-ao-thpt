// Pure optical construction data. Coordinates use one physical length unit per
// scene; a renderer must apply the SAME linear scale to x and y.
// This module never changes a state, a readout or the production equations.
export const OPTICS_IDS=Object.freeze(['ray_slab','apparent_depth','brewster','mirror_rotation','fiber_acceptance','lens_power','lenses_contact','magnifier','telescope','microscope','pinhole']);
const PI=Math.PI,EPS=1e-10;
const rad=a=>a*PI/180,deg=a=>a*180/PI;
const p=(x,y)=>({x,y});
const add=(a,b,k=1)=>p(a.x+k*b.x,a.y+k*b.y);
const direction=a=>p(Math.cos(a),Math.sin(a));
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const note=(vi,en)=>({vi,en});
function scene(id,unit,model='geometric'){
 return {id,unit,model,axisY:['ray_slab','apparent_depth','brewster','mirror_rotation'].includes(id)?null:0,segments:[],elements:[],markers:[],arcs:[],values:{},notes:[],image:{kind:'none'}};
}
function segment(g,id,role,from,to,extra={}){g.segments.push({id,role,from,to,arrow:role!=='guide'&&role!=='virtual',dashed:role==='guide'||role==='virtual',...extra});}
function marker(g,id,type,x,y,extra={}){g.markers.push({id,type,x,y,...extra});}
function lens(g,id,x,height,focal,label){g.elements.push({id,type:'lens',x,y:0,height,focal,label,power:focal===null?0:100/focal});}
function arc(g,id,center,radius,start,end,label){g.arcs.push({id,center,radius,start,end,label});}
function interfaceLine(g,id,y,left,right,indexAbove,indexBelow){g.elements.push({id,type:'interface',from:p(left,y),to:p(right,y),normal:p(0,1),indexAbove,indexBelow});}
function medium(g,id,x,y,width,height,index,role='medium'){g.elements.push({id,type:'medium',x,y,width,height,index,role});}
function finish(g){
 const points=[];
 for(const s of g.segments)points.push(s.from,s.to);
 for(const e of g.elements){
  if(e.from)points.push(e.from,e.to);
  if(Number.isFinite(e.x)){
   const w=e.width||0,h=e.height||0;
   points.push(p(e.x-w/2,e.y-h/2),p(e.x+w/2,e.y+h/2));
  }
 }
 for(const m of g.markers)points.push(p(m.x,m.y),p(m.x,m.y+(m.height||0)));
 for(const a of g.arcs)points.push(p(a.center.x-a.radius,a.center.y-a.radius),p(a.center.x+a.radius,a.center.y+a.radius));
 const xs=points.map(v=>v.x),ys=points.map(v=>v.y);
 g.bounds={minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};
 return g;
}

function slab(s){
 const g=scene('ray_slab','cm'),i=rad(s.angle),r=Math.asin(Math.sin(i)/s.index),h=s.thickness;
 const L=Math.max(1.2,1.1*h),entry=p(0,0),u=p(Math.sin(i),-Math.cos(i));
 const source=add(entry,u,-L),exit=p(h*Math.tan(r),-h),end=add(exit,u,L);
 const projection=add(entry,u,dot(exit,u)),shift=Math.hypot(exit.x-projection.x,exit.y-projection.y);
 segment(g,'incident','incident',source,entry);segment(g,'in-slab','inside',entry,exit);segment(g,'emergent','emergent',exit,end);
 segment(g,'undeviated','guide',entry,add(projection,u,L*.35));
 segment(g,'lateral-shift','guide',exit,projection,{dimension:true});
 for(const [id,q]of [['entry',entry],['exit',exit]])segment(g,id+'-normal','guide',p(q.x,q.y-.42*L),p(q.x,q.y+.42*L),{normal:true});
 const left=Math.min(source.x,-.4*L),right=Math.max(end.x,exit.x+.5*L);
 medium(g,'slab',(left+right)/2,-h/2,right-left,h,s.index);
 interfaceLine(g,'upper-face',0,left,right,1,s.index);interfaceLine(g,'lower-face',-h,left,right,s.index,1);
 arc(g,'incidence',entry,.27*L,PI/2,PI/2+i,'i');arc(g,'refraction',entry,.22*L,-PI/2,-PI/2+r,'r');
 marker(g,'shift','point',(exit.x+projection.x)/2,(exit.y+projection.y)/2,{label:'d'});
 g.values={shift,refracted:deg(r),emergent:deg(i),incidence:deg(i),thickness:h};
 g.notes.push(note('Tia ló song song tia tới; d đo vuông góc giữa hai đường tia.','The emergent ray is parallel to the incident ray; d is their perpendicular separation.'));
 return finish(g);
}
function apparentDepth(s){
 const g=scene('apparent_depth','m','paraxial'),h=s.depth,n=s.index,innerSlope=.035,outerSlope=n*innerSlope;
 const object=p(0,-h),image=p(0,-h/n),L=.65*h;
 for(const sign of [-1,1]){
  const hit=p(sign*h*innerSlope,0),end=p(hit.x+sign*outerSlope*L,L);
  segment(g,'liquid-'+sign,'inside',object,hit);
  segment(g,'air-'+sign,'emergent',hit,end);
  segment(g,'back-extension-'+sign,'virtual',hit,image);
 }
 medium(g,'liquid',0,-h/2,1.25*h,h,n);interfaceLine(g,'surface',0,-.625*h,.625*h,1,n);
 segment(g,'normal','guide',p(0,-1.08*h),p(0,.72*h),{normal:true});
 marker(g,'object','object',0,-h,{label:'Vật',labelEn:'Object'});
 marker(g,'apparent-image','image',0,-h/n,{virtual:true,label:'Ảnh ảo ≈',labelEn:'Virtual image ≈'});
 g.image={kind:'virtual',x:image.x,y:image.y,paraxial:true};
 g.values={apparent:h/n,rise:h-h/n,ratio:n,innerAngle:deg(Math.atan(innerSlope)),outerAngle:deg(Math.atan(outerSlope)),snellResidual:Math.sin(Math.atan(outerSlope))-n*Math.sin(Math.atan(innerSlope))};
 g.notes.push(note('Quan sát gần pháp tuyến: h′ ≈ h/n. Tia trên hình dùng xấp xỉ gần trục, không phải ảnh chính xác ở góc lớn.','Near-normal viewing: h′ ≈ h/n. The displayed rays use the paraxial approximation, not an exact image at large angles.'));
 return finish(g);
}
function brewster(s){
 const g=scene('brewster','relative'),i=Math.atan(s.index/s.index1),r=PI/2-i,L=1.8,o=p(0,0);
 segment(g,'incident','incident',p(-L*Math.sin(i),L*Math.cos(i)),o);
 const matched=Math.abs(s.index-s.index1)<EPS;
 segment(g,'reflected',matched?'guide':'reflected',o,p(L*Math.sin(i),L*Math.cos(i)),{physical:!matched});
 segment(g,'refracted','emergent',o,p(L*Math.sin(r),-L*Math.cos(r)));
 segment(g,'normal','guide',p(0,-L),p(0,L),{normal:true});
 medium(g,'upper',0,L/2,2.6*L,L,s.index1);medium(g,'lower',0,-L/2,2.6*L,L,s.index);
 interfaceLine(g,'interface',0,-1.3*L,1.3*L,s.index1,s.index);
 arc(g,'incidence',o,.47,PI/2,PI/2+i,'iB');arc(g,'refraction',o,.40,-PI/2,-PI/2+r,'r');
 // The right-angle corner follows the two outgoing directions themselves.
 const a=direction(PI/2-i),b=direction(-PI/2+r),corner=add(add(o,a,.2),b,.2);
 segment(g,'orthogonal-a','guide',add(o,a,.2),corner);segment(g,'orthogonal-b','guide',corner,add(o,b,.2));
 g.values={angle:deg(i),refracted:deg(r),sum:90,reflectedPresent:!matched};
 g.notes.push(matched?note('Hai chiết suất bằng nhau: không có tia phản xạ; hướng nét đứt chỉ là dựng hình.','Equal refractive indices: no reflected ray; the dashed direction is a construction only.'):note('Với ánh sáng tới không phân cực, tia phản xạ chỉ còn phân cực s; thành phần phản xạ p bằng 0.','For unpolarized incident light, the reflected ray retains s polarization; its p component vanishes.'));
 return finish(g);
}
function mirrorRotation(s){
 const g=scene('mirror_rotation','relative'),phi=rad(s.rotation),i=rad(20),o=p(0,0),u=p(Math.sin(i),-Math.cos(i)),n=p(-Math.sin(phi),Math.cos(phi)),t=p(Math.cos(phi),Math.sin(phi));
 const v=add(u,n,-2*dot(u,n)),v0=p(Math.sin(i),Math.cos(i)),L=1.9;
 g.elements.push({id:'mirror',type:'mirror',from:add(o,t,-1.8),to:add(o,t,1.8),normal:n});
 segment(g,'incident','incident',add(o,u,-L),o);segment(g,'reflected','reflected',o,add(o,v,L));
 segment(g,'original-reflection','guide',o,add(o,v0,L));segment(g,'normal','guide',add(o,n,-.6),add(o,n,L),{normal:true});
 segment(g,'original-mirror','guide',p(-1.6,0),p(1.6,0));
 arc(g,'mirror-rotation',o,.57,0,phi,'α');arc(g,'ray-rotation',o,.90,PI/2-i,PI/2-i+2*phi,'2α');
 g.values={deviation:2*s.rotation,normal:s.rotation,ratio:2,incidenceSigned:20-s.rotation,incidence:Math.abs(20-s.rotation),incidentDirection:u,reflectedDirection:v,normalDirection:n};
 g.notes.push(note('Giữ nguyên tia tới; gương quay +α thì tia phản xạ quay +2α. Nét đứt là vị trí ban đầu.','Keep the incident ray fixed; a mirror rotation of +α rotates the reflected ray by +2α. Dashed lines show the initial position.'));
 return finish(g);
}
function fiber(s){
 const g=scene('fiber_acceptance','cm'),NA=Math.sqrt(s.core*s.core-s.cladding*s.cladding),acceptance=Math.asin(Math.min(1,NA)),theta=.8*acceptance,beta=Math.asin(Math.sin(theta)/s.core),half=.45,length=6,lead=1.2;
 medium(g,'core',length/2,0,length,2*half,s.core,'core');
 for(const sign of [-1,1])medium(g,'cladding-'+sign,length/2,sign*(half+.16),length,.32,s.cladding,'cladding');
 g.elements.push({id:'entrance',type:'interface',from:p(0,-half-.32),to:p(0,half+.32),normal:p(1,0),indexAbove:1,indexBelow:s.core});
 segment(g,'entrance-axis','guide',p(-lead,0),p(1,0),{normal:true});
 for(const sign of [-1,1])segment(g,'acceptance-cone-'+sign,'guide',p(0,0),p(-lead,sign*lead*Math.tan(acceptance)),{cone:true});
 segment(g,'incident','incident',p(-lead,-lead*Math.tan(theta)),p(0,0));
 let q=p(0,0),sign=1,count=0;
 while(q.x<length-EPS&&count<32){
  const wall=sign*half,dx=Math.abs((wall-q.y)/Math.tan(beta)),nextX=Math.min(length,q.x+dx),next=p(nextX,q.y+sign*Math.tan(beta)*(nextX-q.x));
  segment(g,'core-ray-'+count,'inside',q,next);
  if(nextX<length-EPS){
   marker(g,'bounce-'+count,'point',next.x,next.y,{totalInternalReflection:true});
   if(count===0){segment(g,'wall-normal','guide',p(next.x,next.y-.32),p(next.x,next.y+.32),{normal:true});arc(g,'wall-incidence',next,.24,-PI/2,-PI+beta,'icore');}
   sign=-sign;
  }
  q=next;count++;
 }
 segment(g,'emergent','emergent',q,p(length+lead,q.y+sign*lead*Math.tan(theta)));
 arc(g,'acceptance',p(0,0),.53,PI,PI+acceptance,'θmax');
 g.values={aperture:NA,angle:deg(acceptance),critical:deg(Math.asin(s.cladding/s.core)),incidentAngle:deg(theta),internalAngle:deg(beta),wallIncidence:90-deg(beta),bounceCount:count-1};
 g.notes.push(note('Tia kinh tuyến được chọn ở 0,8 góc nhận cực đại; phản xạ toàn phần tại biên lõi–vỏ. Ngoài sợi là không khí.','The meridional ray is shown at 0.8 of the maximum acceptance angle; it undergoes total internal reflection at the core–cladding boundary. The external medium is air.'));
 return finish(g);
}
function parallelLens(id,s){
 const g=scene(id,'cm','paraxial'),power=id==='lens_power'?100/s.focal:s.power1+s.power2,f=Math.abs(power)<1e-9?null:100/power;
 const F=f===null?100/Math.max(1,Math.abs(s.power1),Math.abs(s.power2)):Math.abs(f);
 // Near cancellation, the equivalent focal length can greatly exceed each
 // individual focal length. Keep rays paraxial at BOTH individual elements.
 const apertureScale=id==='lenses_contact'?Math.min(F,100/Math.max(1,Math.abs(s.power1),Math.abs(s.power2))):F;
 const a=.13*apertureScale,xLeft=-1.25*F,xRight=1.8*F;
 if(id==='lens_power')lens(g,'lens',0,3.1*a,f,'L');
 else{
  // Both thin elements act in exactly the same plane. A renderer may use
  // depth/outline separation, never fake a finite axial separation.
  lens(g,'lens-1',0,3.1*a,Math.abs(s.power1)<EPS?null:100/s.power1,'L₁');
  lens(g,'lens-2',0,3.1*a,Math.abs(s.power2)<EPS?null:100/s.power2,'L₂');
 }
 for(const [j,y]of [-a,0,a].entries()){
  const hit=p(0,y),out=p(xRight,f===null?y:y-y*xRight/f);
  segment(g,'incident-'+j,'incident',p(xLeft,y),hit);segment(g,'emergent-'+j,'emergent',hit,out);
  if(f!==null&&f<0&&j!==1)segment(g,'virtual-'+j,'virtual',hit,p(f,0));
 }
 if(f!==null){
  marker(g,'object-focus','focus',-f,0,{label:'F'});marker(g,'image-focus','focus',f,0,{label:'F′',virtual:f<0});
  g.image={kind:f>0?'real':'virtual',x:f,y:0,objectAtInfinity:true};
 }else g.image={kind:'none',afocal:true};
 g.values=id==='lens_power'?{power,focus:s.focal/100,parallel:1,focal:s.focal}:{power,focal:f,type:Math.sign(power)};
 g.notes.push(f===null?note('Độ tụ tổng bằng 0: tia ló song song tia tới, không có tiêu điểm hữu hạn.','Zero total power: the emerging rays stay parallel to the incoming rays; no finite focus exists.'):f<0?note('Chùm ló phân kì; đường kéo dài nét đứt gặp nhau tại tiêu điểm ảo.','The emerging bundle diverges; dashed backward extensions meet at the virtual focus.'):note('Các tia tới song song trục hội tụ tại tiêu điểm ảnh F′.','Rays incident parallel to the axis converge at the image focus F′.'));
 return finish(g);
}
function magnifier(s){
 const g=scene('magnifier','cm','paraxial'),f=s.focal,h=.10*f,endX=1.55*f;
 lens(g,'lens',0,4.6*h,f,'L');marker(g,'object','object',-f,0,{height:h,label:'Vật tại F',labelEn:'Object at F'});
 marker(g,'object-focus','focus',-f,0,{label:'F'});marker(g,'image-focus','focus',f,0,{label:'F′'});
 for(const [j,y]of [0,h,2*h].entries()){
  const hit=p(0,y),tip=p(-f,h),u=(y-h)/f,v=u-y/f;
  segment(g,'incident-'+j,'incident',tip,hit);segment(g,'emergent-'+j,'emergent',hit,p(endX,y+v*endX));
 }
 g.image={kind:'infinite',directionSlope:-h/f};g.values={magnification:25/f,distance:f,power:100/f,objectHeight:h,objectDistance:f};
 g.notes.push(note('Vật ở tiêu diện: chùm ló song song, ảnh ở vô cực. G∞ = 25 cm/f là bội giác, không phải độ cao ảnh.','The object lies in the focal plane: the emerging bundle is parallel and the image is at infinity. G∞ = 25 cm/f is angular magnification, not image height.'));
 return finish(g);
}
function telescope(s){
 const g=scene('telescope','cm','paraxial'),f1=s.objective,f2=s.eyepiece,L=f1+f2,alpha=.04*Math.min(1,f2/f1),a=.08*f1,h=alpha*f1;
 const hits=[-a,0,a].map(y=>({y,v:alpha-y/f1})),ys=hits.map(q=>q.y+L*q.v),ocularHalf=Math.max(...ys.map(Math.abs),.035*f1)*1.23;
 lens(g,'objective',0,2.5*a,f1,'Vật kính');lens(g,'eyepiece',L,2*ocularHalf,f2,'Thị kính');
 marker(g,'intermediate','intermediate',f1,0,{height:h,label:'Ảnh trung gian',labelEn:'Intermediate image'});
 marker(g,'common-focus','focus',f1,0,{label:'F′₁ = F₂'});
 for(const [j,q]of hits.entries()){
  const hit=p(0,q.y),mid=p(f1,h),eye=p(L,ys[j]),outSlope=q.v-eye.y/f2;
  segment(g,'incident-'+j,'incident',p(-.36*f1,q.y-.36*f1*alpha),hit);
  segment(g,'objective-ray-'+j,'inside',hit,mid);segment(g,'ocular-ray-'+j,'inside',mid,eye);
  segment(g,'emergent-'+j,'emergent',eye,p(L+.36*f1,eye.y+outSlope*.36*f1));
 }
 g.image={kind:'infinite',directionSlope:-f1/f2*alpha};
 g.values={magnification:-f1/f2,lengthNow:L,ratio:f1/f2,incomingSlope:alpha,outgoingSlope:-f1/f2*alpha,intermediateX:f1,intermediateHeight:h};
 g.notes.push(note('Vật ở xa tạo chùm tới song song nghiêng một góc nhỏ. Ảnh trung gian ở tiêu diện chung; chùm ló song song, ảnh cuối ở vô cực và đảo chiều.','A distant object supplies a slightly inclined parallel bundle. The intermediate image lies in the common focal plane; the final bundle is parallel, with an inverted image at infinity.'));
 return finish(g);
}
function microscope(s){
 const g=scene('microscope','cm','paraxial'),f1=s.objective,f2=s.eyepiece,delta=s.interval,v=f1+delta,u=f1*v/delta,L=v+f2,h=.035*Math.min(v,f2)*f1/delta,H=-delta/f1*h,a=.05*f1;
 const hits=[-a,0,a].map(y=>({y,before:(y-h)/u,after:(y-h)/u-y/f1})),ys=hits.map(q=>q.y+L*q.after);
 lens(g,'objective',0,2.6*a,f1,'Vật kính');lens(g,'eyepiece',L,2.4*Math.max(...ys.map(Math.abs),.08*f2),f2,'Thị kính');
 marker(g,'object','object',-u,0,{height:h,label:'Vật',labelEn:'Object'});
 marker(g,'intermediate','intermediate',v,0,{height:H,label:'Ảnh trung gian đảo',labelEn:'Inverted intermediate image'});
 marker(g,'objective-focus','focus',f1,0,{label:'F′₁'});marker(g,'ocular-focus','focus',v,0,{label:'F₂'});
 segment(g,'optical-interval','guide',p(f1,.22*f2),p(v,.22*f2),{dimension:true,label:'δ'});
 for(const [j,q]of hits.entries()){
  const hit=p(0,q.y),mid=p(v,H),eye=p(L,ys[j]),outSlope=q.after-eye.y/f2;
  segment(g,'incident-'+j,'incident',p(-u,h),hit);segment(g,'objective-ray-'+j,'inside',hit,mid);segment(g,'ocular-ray-'+j,'inside',mid,eye);
  segment(g,'emergent-'+j,'emergent',eye,p(L+.28*L,eye.y+outSlope*.28*L));
 }
 g.image={kind:'infinite',directionSlope:-H/f2};
 g.values={magnification:delta*25/(f1*f2),linear:delta/f1,ocular:25/f2,signedLinear:-delta/f1,signedAngularMagnification:-delta*25/(f1*f2),objectDistance:u,intermediateDistance:v,lensSeparation:L,opticalInterval:delta,objectHeight:h,intermediateHeight:H};
 g.notes.push(note('δ là khoảng F′₁–F₂, không phải khoảng cách hai kính. Vật kính tạo ảnh thật đảo tại tiêu diện thị kính; ảnh cuối ở vô cực. Bội giác hiển thị là độ lớn.','δ is the F′₁–F₂ interval, not the lens separation. The objective forms an inverted real image in the eyepiece focal plane; the final image is at infinity. The displayed magnification is a magnitude.'));
 return finish(g);
}
function pinhole(s){
 const g=scene('pinhole','m'),u=s.distance,v=s.screen,h=s.height,H=-h*v/u,A=Math.max(h,Math.abs(H)),opening=.025*Math.min(u,v,A);
 g.elements.push({id:'aperture',type:'aperture',x:0,y:0,height:2.3*A,opening});
 g.elements.push({id:'screen',type:'screen',x:v,y:0,height:2.3*Math.max(Math.abs(H),.12*A)});
 marker(g,'object','object',-u,0,{height:h,label:'Vật',labelEn:'Object'});marker(g,'image','image',v,0,{height:H,label:'Ảnh đảo trên màn',labelEn:'Inverted screen image'});
 // Three different object points each travel straight through the same hole.
 for(const [j,y]of [0,h*.5,h].entries()){
  segment(g,'incident-'+j,'incident',p(-u,y),p(0,0));segment(g,'screen-ray-'+j,'emergent',p(0,0),p(v,-y*v/u));
 }
 g.image={kind:'real',x:v,y:0,height:H};g.values={image:100*H,magnification:-v/u,ratio:v/u,objectDistance:u,imageDistance:v,objectHeight:h,imageHeight:H};
 g.notes.push(note('Tia đi thẳng qua lỗ tạo ảnh đảo thật trên màn. Tọa độ hình dùng mét; số đọc chiều cao ảnh dùng centimét. Bỏ qua nhiễu xạ và kích thước lỗ.','Straight rays through the pinhole form a real inverted image on the screen. Diagram coordinates are in metres; the image-height readout is in centimetres. Diffraction and finite-hole blur are omitted.'));
 return finish(g);
}
export function buildOpticsGeometry(id,state,_outputs){
 switch(id){
  case 'ray_slab':return slab(state);
  case 'apparent_depth':return apparentDepth(state);
  case 'brewster':return brewster(state);
  case 'mirror_rotation':return mirrorRotation(state);
  case 'fiber_acceptance':return fiber(state);
  case 'lens_power':case 'lenses_contact':return parallelLens(id,state);
  case 'magnifier':return magnifier(state);
  case 'telescope':return telescope(state);
  case 'microscope':return microscope(state);
  case 'pinhole':return pinhole(state);
  default:return null;
 }
}
