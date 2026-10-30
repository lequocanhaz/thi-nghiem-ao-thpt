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
  const minor=deg%90!==0?' shm-minor-angle':'';
  return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="shm-tick'+minor+'"/>'+
   '<text x="'+x3+'" y="'+(y3+4)+'" text-anchor="middle" class="shm-radian'+minor+'">'+label+'</text>';
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
function circleMarkup(en){
 return '<svg class="shm-circle-svg" viewBox="0 0 360 414" role="img" aria-label="'+msg('Counterclockwise radius vector OM and its harmonic projection H on the x-axis','Vectơ OM quay ngược chiều kim đồng hồ và hình chiếu H dao động trên trục Ox',en)+'">'+
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
  '<g class="shm-model" role="group" aria-label="'+msg('Spring mass with the same horizontal coordinate as H','Vật lò xo có cùng tọa độ ngang với H',en)+'">'+
  '<text x="32" y="310" class="shm-model-label">'+msg('Oscillating mass','Vật dao động',en)+'</text>'+
  '<line x1="284" x2="284" y1="156" y2="328" class="shm-model-projection" data-shm-model-drop/>'+
  '<line x1="32" x2="322" y1="362" y2="362" class="shm-model-rail"/>'+
  '<rect x="24" y="320" width="8" height="44" class="shm-model-wall"/>'+
  '<path d="M32 342 L270 342" class="shm-model-spring" data-shm-spring/>'+
  '<g data-shm-cart transform="translate(284 342)">'+
  '<rect x="-14" y="-14" width="28" height="26" rx="4" class="shm-model-cart"/>'+
  '<circle cx="-8" cy="16" r="4" class="shm-model-wheel"/>'+
  '<circle cx="8" cy="16" r="4" class="shm-model-wheel"/>'+
  '<text x="0" y="4" text-anchor="middle" class="shm-model-mass">m</text></g>'+
  '<line x1="76" x2="318" y1="384" y2="384" class="shm-axis"/>'+
  '<path d="M314 380 L320 384 L314 388" class="shm-axis-head"/>'+
  '<path d="M76 379 V389 M180 379 V389 M284 379 V389" class="shm-model-axis-ticks"/>'+
  '<text x="76" y="403" text-anchor="middle" class="shm-axis-note">−A</text>'+
  '<text x="180" y="403" text-anchor="middle" class="shm-axis-note">0</text>'+
  '<text x="284" y="403" text-anchor="middle" class="shm-axis-note">+A</text>'+
  '<text x="332" y="388" text-anchor="middle" class="shm-axis-note">x</text></g>'+
  '</svg>';
}
function waveMarkup(en){
 return '<svg class="shm-wave-svg" viewBox="0 0 355 223" role="img" aria-label="'+msg('Displacement versus time over one complete period','Đồ thị li độ theo thời gian trong một chu kì',en)+'">'+
  '<text x="22" y="20" class="shm-wave-heading">'+msg('Displacement x(t)','Li độ x(t)',en)+'</text>'+
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
  '<text x="320" y="215" text-anchor="end" class="shm-wave-time">'+msg('time t','thời gian t',en)+'</text></svg>';
}
function markup(locale){
 const en=localeIsEnglish(locale);
 const phaseButtons=[[0,'0'],[90,'π/2'],[180,'π'],[270,'3π/2'],[360,'2π']];
 return '<section class="shm-circle" data-angles="main">'+
  '<h2 class="shm-accessible-title">'+msg('The circle behind the oscillation','Vòng tròn lượng giác và dao động điều hòa',en)+'</h2>'+
  '<div class="shm-visual-grid"><figure class="shm-svg-wrap">'+circleMarkup(en)+
  '<figcaption class="shm-caption"><span>'+msg('Drag M to change phase. The mass and H share the same x-coordinate.','Kéo M để đổi pha. Vật và H luôn có cùng tọa độ x.',en)+'</span>'+
  '<span class="shm-scale-note">'+msg('Diagram scales to ±A; measured values use cm.','Hình vẽ tự co giãn theo ±A; số đo tính bằng cm.',en)+'</span></figcaption></figure>'+
  '<div class="shm-side"><details class="shm-graph" data-shm-disclosure="graph"><summary>'+msg('Displacement graph','Đồ thị li độ',en)+'</summary>'+waveMarkup(en)+'</details>'+
  '<details class="shm-explanation" data-shm-disclosure="explanation"><summary>'+msg('Why the projection oscillates','Vì sao hình chiếu dao động?',en)+'</summary>'+
  '<div class="shm-explanation-body"><p>'+msg('M is a mathematical point travelling around an imaginary circle. The spring mass moves only along x; its displacement is the horizontal projection of OM.','M là điểm toán học chuyển động trên đường tròn tưởng tượng. Vật lò xo chỉ chuyển động trên trục x; li độ bằng hình chiếu ngang của OM.',en)+'</p>'+
  '<div class="shm-equation"><b>x = A cos φ</b><span>φ = ωt, ω = 2π/T</span><span>v = −Aω sin φ</span><span>a = −ω²x</span></div>'+
  '<p class="shm-pedagogical-note">'+msg('Ideal harmonic motion, initial phase φ₀ = 0. The tangent arrow is M’s circular velocity; its horizontal projection is the mass velocity. The drawing scales with A, without changing the measured values.','Dao động lí tưởng, pha ban đầu φ₀ = 0. Mũi tên tiếp tuyến là vận tốc của M; hình chiếu ngang của nó là vận tốc của vật. Hình vẽ co giãn theo A, không thay đổi số đo.',en)+'</p>'+
  '<div class="shm-legend"><span><i class="shm-key-radius"></i>'+msg('Radius OM','Vectơ OM',en)+'</span><span><i class="shm-key-velocity"></i>'+msg('Tangent velocity','Vận tốc tiếp tuyến',en)+'</span><span><i class="shm-key-projection"></i>'+msg('Horizontal projection','Hình chiếu ngang',en)+'</span></div>'+
  '<div class="shm-advanced-values"><span>'+msg('Velocity','Vận tốc',en)+' <strong data-shm-v>—</strong></span><span>'+msg('Acceleration','Gia tốc',en)+' <strong data-shm-a>—</strong></span></div>'+
  '<label class="shm-angle-option"><input type="checkbox" data-shm-angles> '+msg('Show all special angles','Hiện các góc đặc biệt',en)+'</label></div></details></div></div>'+
  '<div class="shm-controls"><div class="shm-values" aria-live="off"><label for="shmPhaseSlider">'+msg('Phase','Pha',en)+' <strong data-shm-phase-text>0°</strong></label><span>'+msg('Displacement','Li độ',en)+' <strong data-shm-x>—</strong></span></div>'+
  '<input type="range" id="shmPhaseSlider" min="0" max="360" step="1" value="0" aria-label="'+msg('Adjust rotation angle from 0 to 360 degrees','Điều chỉnh góc quay từ 0 đến 360 độ',en)+'">'+
  '<div class="shm-phase-presets" role="group" aria-label="'+msg('Choose a phase','Chọn pha',en)+'">'+phaseButtons.map(pair=>'<button type="button" data-shm-phase="'+pair[0]+'">'+pair[1]+'</button>').join('')+'</div></div></section>';
}
export function mountCircle(host,onPhase,locale='vi-VN'){
 if(!host)return;
 host.setAttribute('aria-label',locale==='en-US'?'Phase circle for simple harmonic motion':'Vòng tròn lượng giác biểu diễn dao động điều hòa');
 if(host.dataset.locale===locale&&host.querySelector('.shm-circle-svg'))return;
 const graphOpen=host.querySelector('.shm-graph')?.open;
 const explanationOpen=host.querySelector('.shm-explanation')?.open;
 const allAngles=host.querySelector('[data-shm-angles]')?.checked===true;
 host.innerHTML=markup(locale);
 host.dataset.locale=locale;
 host.querySelector('.shm-graph').open=graphOpen??(globalThis.matchMedia?.('(min-width:700px)').matches??true);
 host.querySelector('.shm-explanation').open=explanationOpen===true;
 const angleOption=host.querySelector('[data-shm-angles]');
 angleOption.checked=allAngles;
 const applyAngles=()=>{host.querySelector('.shm-circle').dataset.angles=angleOption.checked?'all':'main';};
 angleOption.addEventListener('change',applyAngles);applyAngles();
 const slider=host.querySelector('#shmPhaseSlider');
 slider?.addEventListener('input',()=>onPhase(Number(slider.value)*Math.PI/180));
 host.querySelectorAll('[data-shm-phase]').forEach(button=>button.addEventListener('click',()=>onPhase(Number(button.dataset.shmPhase)*Math.PI/180)));
 const svg=host.querySelector('.shm-circle-svg');
 let dragging=false;
 const phaseAt=event=>{
  if(!svg?.createSVGPoint||!svg.getScreenCTM())return null;
  const pointer=svg.createSVGPoint();pointer.x=event.clientX;pointer.y=event.clientY;
  const p=pointer.matrixTransform(svg.getScreenCTM().inverse());
  const distance=Math.hypot(p.x-CX,p.y-CY);
  if(distance<55||distance>R+34)return null;
  const angle=((Math.atan2(CY-p.y,p.x-CX)%TAU)+TAU)%TAU;
  return angle;
 };
 // SVG child touch-action is not honored consistently by browsers. Cancel
 // native panning only when a touch starts on the interactive circle.
 svg?.addEventListener('touchstart',event=>{
  if(event.touches.length===1&&phaseAt(event.touches[0])!==null)event.preventDefault();
 },{passive:false});
 svg?.addEventListener('pointerdown',event=>{
  if(event.button!==undefined&&event.button!==0)return;
  const phase=phaseAt(event);if(phase===null)return;
  dragging=true;slider?.blur?.();svg.setPointerCapture?.(event.pointerId);onPhase(phase);event.preventDefault();
 });
 svg?.addEventListener('pointermove',event=>{if(!dragging)return;const phase=phaseAt(event);if(phase!==null)onPhase(phase);});
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
 set(host,'[data-shm-cart]','transform','translate('+x+' 342)');
 set(host,'[data-shm-model-drop]','x1',x);set(host,'[data-shm-model-drop]','x2',x);
 const springEnd=x-14,coilStart=42,coilEnd=springEnd-8;
 const spring=['M 32 342','L '+coilStart+' 342'];
 for(let i=1;i<=12;i++)spring.push('L '+(coilStart+(coilEnd-coilStart)*i/12)+' '+(i===12?342:342+(i%2?-6:6)));
 spring.push('L '+springEnd+' 342');set(host,'[data-shm-spring]','d',spring.join(' '));
 set(host,'[data-shm-m-label]','x',x+(cos>=0?-20:10));set(host,'[data-shm-m-label]','y',y+(sin>=0?22:-12));
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
 if(d)d.setAttribute('aria-label',(en?'Rotating radius vector and spring mass: ':'Vectơ quay và vật lò xo: ')+
  'φ = '+number(angle,2,locale)+' rad; x = '+number(data?.x??q.x,2,locale)+' cm');
 return true;
}
