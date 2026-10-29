// A pedagogical projection of uniform circular motion onto simple harmonic motion.
// Display-only: the Physics engine remains authoritative for x, v and a.
export const TAU = 2 * Math.PI;
const CX=180,CY=156,R=104;
const angles=[
 [0,'0'],[30,'π/6'],[45,'π/4'],[60,'π/3'],[90,'π/2'],
 [120,'2π/3'],[135,'3π/4'],[150,'5π/6'],[180,'π'],
 [210,'−5π/6'],[225,'−3π/4'],[240,'−2π/3'],
 [270,'−π/2'],[300,'−π/3'],[315,'−π/4'],[330,'−π/6']
];
const localeIsEnglish=locale=>locale==='en-US';
const number=(n,d=2,locale='vi-VN')=>Number.isFinite(n)
 ? new Intl.NumberFormat(locale,{maximumFractionDigits:d,minimumFractionDigits:d}).format(Math.abs(n)<1e-10?0:n):'—';
const set=(host,selector,attribute,value)=>host.querySelector(selector)?.setAttribute(attribute,String(value));
const write=(host,selector,value)=>{const node=host.querySelector(selector);if(node&&node.textContent!==value)node.textContent=value;};

export function circleState(state){
 const A=Number(state?.a),T=Number(state?.period),t=Number(state?.t||0);
 if(!Number.isFinite(A)||A<=0||!Number.isFinite(T)||T<=0||!Number.isFinite(t))return null;
 const omega=TAU/T,phi=omega*t,phase=((phi%TAU)+TAU)%TAU;
 const x=A*Math.cos(phi),v=-A*omega*Math.sin(phi),acc=-omega*omega*x;
 return {A,T,t,omega,phi,phase,x,v,acc,cycles:Math.floor(Math.max(0,phi)/TAU)};
}
export function phaseToTime(phase,period,currentTime=0,maxTime=20){
 if(!Number.isFinite(phase)||!Number.isFinite(period)||period<=0)return null;
 const cycle=Math.min(Math.floor(Math.max(0,currentTime)/period),Math.max(0,Math.ceil(maxTime/period)-1));
 const phaseClamped=Math.max(0,Math.min(TAU,phase));
 let next=cycle*period+phaseClamped/TAU*period;
 if(next>maxTime&&cycle>0)next-=period;
 return Math.min(Math.max(0,maxTime),Math.max(0,next));
}
const svgNumber=value=>Number(value.toFixed(3));
const position=(degree,radius=R)=>{
 const angle=degree*Math.PI/180;
 return [svgNumber(CX+radius*Math.cos(angle)),svgNumber(CY-radius*Math.sin(angle))];
};
const labels=()=>{
 const ticks=angles.map(([deg,label])=>{
  const [x1,y1]=position(deg,R+4),[x2,y2]=position(deg,R+10),[x3,y3]=position(deg,R+25);
  return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="shm-tick"/>'+
   '<text x="'+x3+'" y="'+(y3+4)+'" text-anchor="middle" class="shm-radian">'+label+'</text>';
 }).join('');
 return ticks;
};
const waveform=()=>{
 const pts=Array.from({length:181},(_,i)=>{
  const x=40+275*i/180, y=104-67*Math.cos(i/180*TAU);
  return svgNumber(x)+','+svgNumber(y);
 }).join(' ');
 return '<polyline points="'+pts+'" class="shm-wave-line"/>';
};
const msg=(en,vi,english)=>english?en:vi;
function markup(locale){
 const en=localeIsEnglish(locale);
 const phaseButtons=[[0,'0'],[90,'π/2'],[180,'π'],[270,'3π/2'],[360,'2π']];
 return '<details class="shm-circle" open><summary>'+
  '<span class="shm-kicker">'+msg('UNIFORM CIRCULAR MOTION','CHUYỂN ĐỘNG TRÒN ĐỀU',en)+'</span>'+
  '<strong>'+msg('The circle behind the oscillation','Vòng tròn lượng giác và dao động điều hòa',en)+'</strong>'+
  '<span class="shm-summary-chevron" aria-hidden="true">▾</span></summary>'+
  '<div class="shm-body"><p class="shm-lead">'+msg('Drag point M around the circle, or choose a phase. The spring, projection and graph share the same clock.','Kéo điểm M trên đường tròn hoặc chọn pha. Hình chiếu, con lắc lò xo và đồ thị cùng dùng một thời điểm.',en)+'</p>'+
  '<div class="shm-visual-grid"><div class="shm-svg-wrap">'+
  '<svg class="shm-circle-svg" viewBox="0 0 360 317" role="img" aria-label="'+msg('Counterclockwise radius vector OM and its harmonic projection H on the x-axis','Vectơ OM quay ngược chiều kim đồng hồ và hình chiếu H dao động trên trục Ox',en)+'">'+
  '<defs><marker id="shmRadiusArrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="#265db9"/></marker>'+
  '<marker id="shmTangentArrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#c77a29"/></marker>'+
  '<marker id="shmVelocityArrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#1a8065"/></marker></defs>'+
  '<circle cx="'+CX+'" cy="'+CY+'" r="'+R+'" class="shm-circle-outline"/>'+
  '<line x1="27" x2="336" y1="'+CY+'" y2="'+CY+'" class="shm-axis"/>'+
  '<path d="M335 151 L344 156 L335 161" class="shm-axis-head"/>'+
  '<line x1="'+CX+'" x2="'+CX+'" y1="29" y2="285" class="shm-vertical-axis"/>'+
  labels()+
  '<g class="shm-projection-marks">'+
  '<line x1="'+(CX-R/2)+'" x2="'+(CX-R/2)+'" y1="151" y2="161"/>'+
  '<line x1="'+(CX+R/2)+'" x2="'+(CX+R/2)+'" y1="151" y2="161"/>'+
  '</g>'+
  '<text x="'+(CX-R)+'" y="174" text-anchor="middle" class="shm-axis-note">−A</text>'+
  '<text x="'+(CX-R/2)+'" y="174" text-anchor="middle" class="shm-axis-note">−A/2</text>'+
  '<text x="'+CX+'" y="174" text-anchor="middle" class="shm-axis-note">O</text>'+
  '<text x="'+(CX+R/2)+'" y="174" text-anchor="middle" class="shm-axis-note">A/2</text>'+
  '<text x="'+(CX+R)+'" y="174" text-anchor="middle" class="shm-axis-note">A</text>'+
  '<text x="346" y="147" text-anchor="middle" class="shm-axis-note">x</text>'+
  '<path class="shm-phase-arc" data-shm-arc fill="none"/>'+
  '<line x1="'+CX+'" y1="'+CY+'" x2="'+(CX+R)+'" y2="'+CY+'" class="shm-radius" data-shm-radius marker-end="url(#shmRadiusArrow)"/>'+
  '<line x1="'+(CX+R)+'" y1="'+CY+'" x2="'+(CX+R)+'" y2="'+CY+'" class="shm-projection-line" data-shm-drop/>'+
  '<line class="shm-tangent" data-shm-tangent marker-end="url(#shmTangentArrow)"/>'+
  '<line class="shm-projected-v" data-shm-projected-v marker-end="url(#shmVelocityArrow)"/>'+
  '<circle cx="'+(CX+R)+'" cy="'+CY+'" r="8" class="shm-moving-point" data-shm-m/>'+
  '<circle cx="'+(CX+R)+'" cy="'+CY+'" r="6" class="shm-projected-point" data-shm-h/>'+
  '<text x="'+(CX+R)+'" y="'+(CY-14)+'" class="shm-moving-label" data-shm-m-label>M</text>'+
  '<text x="'+(CX+R)+'" y="'+(CY+22)+'" class="shm-h-label" data-shm-h-label>H</text>'+
  '<circle cx="'+CX+'" cy="'+CY+'" r="3.6" class="shm-origin"/>'+
  '<circle cx="'+CX+'" cy="'+CY+'" r="'+(R+6)+'" class="shm-drag-ring" fill="none" stroke="transparent" stroke-width="18" data-shm-drag/>'+
  '</svg>'+
  '<div class="shm-legend"><span><i class="shm-key-radius"></i>'+msg('Radius vector','Vectơ quay OM',en)+'</span><span><i class="shm-key-velocity"></i>'+msg('Circular velocity','Vận tốc tiếp tuyến',en)+'</span><span><i class="shm-key-projection"></i>'+msg('Projection','Hình chiếu H',en)+'</span></div></div>'+
  '<div class="shm-side"><svg class="shm-wave-svg" viewBox="0 0 355 223" role="img" aria-label="'+msg('Displacement versus time over one complete period','Đồ thị li độ theo thời gian trong một chu kì',en)+'">'+
  '<text x="22" y="20" class="shm-wave-heading">'+msg('Displacement x(t)','LI ĐỘ x(t)',en)+'</text>'+
  '<line x1="40" x2="320" y1="104" y2="104" class="shm-axis"/>'+
  '<line x1="40" x2="40" y1="24" y2="186" class="shm-axis"/>'+
  '<line x1="108.75" x2="108.75" y1="33" y2="175" class="shm-wave-guide"/>'+
  '<line x1="177.5" x2="177.5" y1="33" y2="175" class="shm-wave-guide"/>'+
  '<line x1="246.25" x2="246.25" y1="33" y2="175" class="shm-wave-guide"/>'+
  '<text x="27" y="43" class="shm-wave-axis-label">A</text><text x="22" y="179" class="shm-wave-axis-label">−A</text>'+
  '<text x="40" y="199" class="shm-wave-time" text-anchor="middle">0</text>'+
  '<text x="108.75" y="199" class="shm-wave-time" text-anchor="middle">T/4</text>'+
  '<text x="177.5" y="199" class="shm-wave-time" text-anchor="middle">T/2</text>'+
  '<text x="246.25" y="199" class="shm-wave-time" text-anchor="middle">3T/4</text>'+
  '<text x="315" y="199" class="shm-wave-time" text-anchor="middle">T</text>'+
  waveform()+
  '<line x1="40" y1="34" x2="40" y2="172" class="shm-wave-cursor" data-shm-wave-cursor/>'+
  '<circle cx="40" cy="37" r="6" class="shm-wave-point" data-shm-wave-point/>'+
  '<text x="320" y="215" text-anchor="end" class="shm-wave-time">'+msg('time t','thời gian t',en)+'</text></svg>'+
  '<div class="shm-equation" aria-label="'+msg('Harmonic displacement equals the projection of the rotating vector','Li độ dao động bằng hình chiếu của vectơ quay',en)+'">'+
  '<div><b>x = A cos φ</b><span>φ = ωt, ω = 2π/T</span></div>'+
  '<div><span>v = −Aω sin φ</span><span>a = −ω²x</span></div></div>'+
  '<div class="shm-values" aria-live="off">'+
  '<div><span>'+msg('Phase','Pha',en)+'</span><strong data-shm-phase-text>0°</strong></div>'+
  '<div><span>'+msg('Displacement','Li độ',en)+'</span><strong data-shm-x>—</strong></div>'+
  '<div><span>'+msg('Velocity','Vận tốc',en)+'</span><strong data-shm-v>—</strong></div>'+
  '<div><span>'+msg('Acceleration','Gia tốc',en)+'</span><strong data-shm-a>—</strong></div>'+
  '</div></div></div>'+
  '<div class="shm-controls"><label for="shmPhaseSlider">'+msg('Phase within a period','Pha trong một chu kì',en)+'</label>'+
  '<input type="range" id="shmPhaseSlider" min="0" max="360" step="1" value="0" aria-label="'+msg('Adjust rotation angle from 0 to 360 degrees','Điều chỉnh góc quay từ 0 đến 360 độ',en)+'">'+
  '<div class="shm-phase-presets">'+phaseButtons.map(pair=>'<button type="button" data-shm-phase="'+pair[0]+'">'+pair[1]+'</button>').join('')+'</div>'+
  '</div><p class="shm-pedagogical-note">'+msg('Ideal harmonic motion: initial phase φ₀ = 0. M travels on an imaginary circle; the spring mass travels only along x. The tangent arrow belongs to circular motion, not the mass velocity.','Mô hình lí tưởng: φ₀ = 0. Điểm M chuyển động tròn tưởng tượng, còn vật lò xo chỉ chuyển động trên trục Ox. Mũi tên tiếp tuyến là vận tốc của M, không phải vận tốc của vật lò xo.',en)+'</p>'+
  '</div></details>';
}
export function mountCircle(host,onPhase,locale='vi-VN'){
 if(!host)return;
 host.setAttribute('aria-label',locale==='en-US'?'Phase circle for simple harmonic motion':'Vòng tròn lượng giác biểu diễn dao động điều hòa');
 if(host.dataset.locale===locale&&host.querySelector('.shm-circle-svg'))return;
 const expanded=host.querySelector('.shm-circle')?.open!==false;
 host.innerHTML=markup(locale);
 host.dataset.locale=locale;
 if(!expanded)host.querySelector('.shm-circle').open=false;
 const slider=host.querySelector('#shmPhaseSlider');
 slider?.addEventListener('input',()=>onPhase(Number(slider.value)*Math.PI/180));
 host.querySelectorAll('[data-shm-phase]').forEach(button=>button.addEventListener('click',()=>onPhase(Number(button.dataset.shmPhase)*Math.PI/180)));
 const svg=host.querySelector('.shm-circle-svg');
 let dragging=false;
 const seek=event=>{
  if(!svg?.createSVGPoint||!svg.getScreenCTM())return;
  const pointer=svg.createSVGPoint();pointer.x=event.clientX;pointer.y=event.clientY;
  const p=pointer.matrixTransform(svg.getScreenCTM().inverse());
  const distance=Math.hypot(p.x-CX,p.y-CY);
  if(distance<55||distance>R+34)return;
  const angle=((Math.atan2(CY-p.y,p.x-CX)%TAU)+TAU)%TAU;
  onPhase(angle);
 };
 svg?.addEventListener('pointerdown',event=>{
  if(event.button!==undefined&&event.button!==0)return;
  dragging=true;slider?.blur?.();svg.setPointerCapture?.(event.pointerId);seek(event);event.preventDefault();
 });
 svg?.addEventListener('pointermove',event=>{if(dragging)seek(event);});
 const stop=()=>{dragging=false;};
 svg?.addEventListener('pointerup',stop);svg?.addEventListener('pointercancel',stop);
}
export function updateCircle(host,state,data,locale='vi-VN'){
 if(!host)return false;
 const q=circleState(state);
 if(!q)return false;
 const angle=q.phase,cos=Math.cos(angle),sin=Math.sin(angle);
 const x=CX+R*cos,y=CY-R*sin;
 set(host,'[data-shm-radius]','x2',x);set(host,'[data-shm-radius]','y2',y);
 set(host,'[data-shm-drop]','x1',x);set(host,'[data-shm-drop]','x2',x);
 set(host,'[data-shm-drop]','y1',y);set(host,'[data-shm-drop]','y2',CY);
 set(host,'[data-shm-m]','cx',x);set(host,'[data-shm-m]','cy',y);
 set(host,'[data-shm-h]','cx',x);set(host,'[data-shm-h]','cy',CY);
 set(host,'[data-shm-m-label]','x',x+(cos>=0?12:-24));set(host,'[data-shm-m-label]','y',y+(sin>=0?-10:19));
 set(host,'[data-shm-h-label]','x',x+8);set(host,'[data-shm-h-label]','y',CY+27);
 const tangent=host.querySelector('[data-shm-tangent]');
 tangent?.setAttribute('x1',x);tangent?.setAttribute('y1',y);
 tangent?.setAttribute('x2',x-33*sin);tangent?.setAttribute('y2',y-33*cos);
 const projected=host.querySelector('[data-shm-projected-v]');
 const vx=-sin;
 projected?.setAttribute('x1',x);projected?.setAttribute('y1',CY);
 projected?.setAttribute('x2',x+33*vx);
 projected?.setAttribute('y2',CY);
 if(projected)projected.style.display=Math.abs(vx)<1e-7?'none':'';
 const endX=CX+27*Math.cos(angle),endY=CY-27*Math.sin(angle);
 const arc=angle<1e-6?'':('M '+(CX+27)+' '+CY+' A 27 27 0 '+(angle>Math.PI?1:0)+' 0 '+endX+' '+endY);
 set(host,'[data-shm-arc]','d',arc);
 const gx=40+275*angle/TAU,gy=104-67*Math.cos(angle);
 set(host,'[data-shm-wave-cursor]','x1',gx);set(host,'[data-shm-wave-cursor]','x2',gx);
 set(host,'[data-shm-wave-point]','cx',gx);set(host,'[data-shm-wave-point]','cy',gy);
 const en=localeIsEnglish(locale);
 const degrees=Math.round(angle*180/Math.PI)%360;
 write(host,'[data-shm-phase-text]',number(degrees,0,locale)+'° · '+number(angle,2,locale)+' rad');
 write(host,'[data-shm-x]',number(data?.x??q.x,2,locale)+' cm');
 write(host,'[data-shm-v]',number(data?.v??q.v,2,locale)+' cm/s');
 write(host,'[data-shm-a]',number(data?.acc??q.acc,2,locale)+' cm/s²');
 const slider=host.querySelector('#shmPhaseSlider');
 if(slider&&document.activeElement!==slider)slider.value=String(degrees);
 const d=host.querySelector('.shm-circle-svg');
 if(d)d.setAttribute('aria-label',(en?'Rotating radius vector and displacement: ':'Vectơ quay và hình chiếu: ')+
  'φ = '+number(angle,2,locale)+' rad; x = '+number(data?.x??q.x,2,locale)+' cm');
 return true;
}
