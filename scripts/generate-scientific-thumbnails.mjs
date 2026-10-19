/**
 * Quanh Lab v42 — reproducible scientific 2D illustration generator.
 * Produces a unique SVG for every catalog ID; no reused stock photos, no UI.
 * Images are illustrative physical snapshots, not experimental measurements.
 */
import fs from 'node:fs';
import path from 'node:path';
import {experiments} from '../dist/experiments.js';

const W=960,H=600, B='#087be6', C='#2d91f2', L='#93c9f5', R='#ff634e', O='#ffa061', N='#1b508c', T='#46bca7';
const fmt=x=>Number(x).toFixed(2);
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
class A{
 constructor(id){this.parts=[];this.id=id;this.seed=hash(id);}
 add(s){this.parts.push(s);}
 line(x,y,u,v,c=B,w=3,extra=''){this.add('<line x1="'+fmt(x)+'" y1="'+fmt(y)+'" x2="'+fmt(u)+'" y2="'+fmt(v)+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" '+extra+'/>');}
 path(p,c=B,w=3,fill='none',extra=''){this.add('<path d="'+p+'" fill="'+fill+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" '+extra+'/>');}
 poly(points,c=B,w=3,fill='none',extra=''){this.path('M '+points.map(p=>fmt(p[0])+','+fmt(p[1])).join(' L '),c,w,fill,extra);}
 rect(x,y,w,h,fill='white',radius=0,stroke='none',sw=0,extra=''){this.add('<rect x="'+fmt(x)+'" y="'+fmt(y)+'" width="'+fmt(w)+'" height="'+fmt(h)+'" rx="'+radius+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" '+extra+'/>');}
 circle(x,y,r,fill='none',stroke='none',sw=0,extra=''){this.add('<circle cx="'+fmt(x)+'" cy="'+fmt(y)+'" r="'+fmt(r)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" '+extra+'/>');}
 ellipse(x,y,rx,ry,fill='none',stroke=B,sw=3,extra=''){this.add('<ellipse cx="'+fmt(x)+'" cy="'+fmt(y)+'" rx="'+fmt(rx)+'" ry="'+fmt(ry)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+sw+'" '+extra+'/>');}
 arrow(x,y,u,v,c=B,w=3,size=13){this.line(x,y,u,v,c,w);const t=Math.atan2(v-y,u-x);this.poly([[u-size*Math.cos(t-.48),v-size*Math.sin(t-.48)],[u,v],[u-size*Math.cos(t+.48),v-size*Math.sin(t+.48)]],c,w+1);}
 dot(x,y,r=13,c=R){this.circle(x,y,r,c,'#ffffff',2);}
 text(x,y,t,size=28,c=B){this.add('<text x="'+fmt(x)+'" y="'+fmt(y)+'" fill="'+c+'" font-family="Arial" font-size="'+size+'" font-weight="700" text-anchor="middle" dominant-baseline="middle">'+escape(t)+'</text>');}
 sine(x0,x1,y,amp,cycles=2,phase=0,col=B,width=5,decay=0){let p=[];for(let i=0;i<=180;i++){let t=i/180;let env=decay?Math.exp(-decay*t):1;p.push([x0+(x1-x0)*t,y-amp*env*Math.sin(2*Math.PI*cycles*t+phase)]);}this.poly(p,col,width);}
 roundPanel(x,y,w,h){this.rect(x,y,w,h,'url(#ice)',22,L,2);}
 end(title){const defs='<defs>'+
 '<radialGradient id="background"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#f8fcff"/><stop offset="1" stop-color="#eaf6ff"/></radialGradient>'+
 '<linearGradient id="ice"><stop stop-color="#f5fbff"/><stop offset="1" stop-color="#d8edff"/></linearGradient>'+
 '<linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7bd1ff"/><stop offset="1" stop-color="#1d7bea"/></linearGradient>'+
 '<linearGradient id="hot" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffc09d"/><stop offset="1" stop-color="#ff624b"/></linearGradient>'+
 '<filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#278ae1" flood-opacity=".12"/></filter>'+
 '</defs>';
 return '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" role="img" aria-label="'+escape(title)+'">'+defs+'<rect width="960" height="600" fill="url(#background)"/>'+this.parts.join('')+'</svg>';}
}
function capacitor(a,kind){
 const x0=310,x1=650; const layered=/layered|dielectric|isolated/.test(kind);
 if(/series|parallel|sharing/.test(kind)){
  for(let j=0;j<2;j++){let x=275+j*340;for(let i=0;i<2;i++)a.rect(x+i*54,211,13,184,i===0?'url(#hot)':'url(#blue)',6);}
  a.line(220,303,275,303);a.line(350,303,615,303);a.line(690,303,756,303);a.arrow(426,258,531,258);
  if(/parallel/.test(kind)){a.line(233,190,723,190);a.line(233,410,723,410);}
 }else{
  a.rect(x0,140,40,335,'url(#hot)',11,R,1);
  a.rect(x1,140,40,335,'url(#blue)',11,B,1);
  if(layered)a.rect(395,156,211,303,'#a6e8e0',7,T,1,'opacity=".36"');
  for(let y=171;y<=438;y+=38){a.arrow(355,y,645,y,B,2.6,9);a.text(330,y,'+',25,'#fff');a.text(672,y,'−',27,'#fff');}
  if(/force/.test(kind)){a.arrow(288,299,355,299,R,5);a.arrow(710,299,650,299,B,5);}
 }
}
function electricField(a,id){
 const plus=[312,302],minus=[648,302];const plates=/uniform_field|charged_plane|dipole_torque/.test(id);
 if(plates){capacitor(a,id);if(id==='uniform_field'){a.dot(477,254,14,R);a.arrow(483,254,581,254,R,4);}return;}
 if(/capacitor|dielectric|charge_sharing/.test(id)){capacitor(a,id);return;}
 if(/potential|equipotential|charged_solid_sphere|connected_spheres|conducting_shell|charged_ring|charged_disk|spherical_capacitor|coaxial/.test(id)){
  for(let j=0;j<5;j++)a.ellipse(480,304,50+j*68,30+j*43,'none',j%2?L:B,2,'opacity=".75"');
  if(/ring|disk|coaxial|sphere/.test(id)){a.ellipse(480,304,115,70,'url(#ice)',B,5);a.ellipse(480,304,61,39,'white',L,3);}
  a.dot(480,304,25,R);for(let z=0;z<8;z++){let t=z*Math.PI/4;a.arrow(480+54*Math.cos(t),304+54*Math.sin(t),480+110*Math.cos(t),304+110*Math.sin(t),B,3,10);}
  return;
 }
 if(/quantization|three_charge/.test(id)){
  for(let i=0;i<3;i++){let x=275+i*205,y=280+(i%2)*65;a.dot(x,y,32,i===1?C:R);a.text(x,y,i===1?'−':'+',28,'white');}
  a.arrow(335,263,440,302,B,4);a.arrow(551,308,645,295,R,4);return;
 }
 // Numerically integrate field lines: arrows are always in the direction of E.
 function f(x,y){
  let ex=0,ey=0;
  for(let q of [[plus[0],plus[1],1],[minus[0],minus[1],-1]]){
   let dx=x-q[0],dy=y-q[1],r2=Math.max(dx*dx+dy*dy,450),factor=q[2]/(r2*Math.sqrt(r2));ex+=dx*factor;ey+=dy*factor;
  }
  const l=Math.hypot(ex,ey)||1;return [ex/l,ey/l];
 }
 for(let k=0;k<22;k++){
  let alpha=(2*Math.PI*k/22)+.014,x=plus[0]+37*Math.cos(alpha),y=plus[1]+37*Math.sin(alpha),p=[[x,y]];
  for(let j=0;j<360;j++){
   let [dx,dy]=f(x,y); x+=dx*4.5;y+=dy*4.5;p.push([x,y]);
   if((x-minus[0])**2+(y-minus[1])**2<37**2||x<-30||x>990||y<-40||y>640)break;
  }
  if(p.length<6)continue;
  a.poly(p,B,2.8);
  let m=Math.max(3,Math.floor(p.length*.52));const q=p[m],t=p[m+2];if(t)a.arrow(q[0],q[1],t[0]+(t[0]-q[0])*1.5,t[1]+(t[1]-q[1])*1.5,B,2.5,8);
 }
 for(let q of [[...plus,R,'+'],[...minus,C,'−']]){a.circle(q[0],q[1],47,q[2]===R?'#ffd6ca':'#c8e5ff');a.dot(q[0],q[1],30,q[2]);a.text(q[0],q[1],q[3],34,'white');}
}
function circuit(a,id){
 const x=185,y=180,rx=730,by=430;
 function segment(){a.line(x,y,rx,y,B,5);a.line(rx,y,rx,by,B,5);a.line(rx,by,x,by,B,5);a.line(x,by,x,345,B,5);a.line(x,259,x,y,B,5);}
 if(/parallel|battery_parallel|two_meshes|bridge|ladder|star_delta/.test(id)){
  segment();for(let x of [372,548]){a.line(x,180,x,245,B,5);a.rect(x-30,245,60,125,'#eef8ff',12,B,4);a.poly([[x,260],[x-18,275],[x+18,291],[x-18,310],[x+18,327],[x,350]],B,3);a.line(x,370,x,430,B,5);}
 }else{
  segment();
  if(/diode|rectifier|zener/.test(id)){a.poly([[694,270],[765,303],[694,336],[694,270]],B,4,'#e3f5ff');a.line(765,268,765,341,B,6);}
  else if(/rc|capacitor|square|filter/.test(id)){a.line(707,272,754,272,B,6);a.line(707,301,754,301,B,6);a.line(rx,180,rx,260,B,4);a.line(rx,312,rx,430,B,4);}
  else{a.poly([[730,257],[709,271],[751,286],[709,302],[751,317],[709,335],[730,351]],B,5);}
 }
 a.line(140,260,231,260,R,8);a.line(159,340,213,340,C,7);a.text(124,243,'+',31,R);a.text(129,359,'−',30,B);
 if(/ohm|meter_loading|voltmeter|ammeter|kelvin|potentiometer|emf_compensation/.test(id)){
  a.circle(451,180,39,'white',B,5);a.text(451,180,'A',38,B);a.line(414,180,413,180,B,5);
  a.line(730,255,867,255,B,4);a.line(867,255,867,278,B,4);a.line(867,352,867,365,B,4);a.line(867,365,730,365,B,4);
  a.circle(867,315,37,'white',B,4);a.text(867,315,'V',38,B);
 }
 if(/transformer|inductor|rl_|lc_|rlc_/.test(id)){for(let j=0;j<6;j++)a.ellipse(300+j*36,180,23,27,'none',B,3);}
 if(/joule|power|resistivity|wire|drift/.test(id)){for(let j=0;j<7;j++)a.dot(305+j*51,180,7,j%2?R:C);}
 a.arrow(266,180,316,180,B,3);a.arrow(560,430,507,430,B,3);
}
function wave(a,id){
 if(/interference|doppler|tdoa|mach|water_refraction/.test(id)){
  const centers=id.includes('doppler')?[[353,322],[639,285]]:[[335,380],[625,380]];
  for(let q of centers){for(let r=37;r<=485;r+=53)a.circle(q[0],q[1],r,'none',B,2.1,'opacity=".38"');a.dot(q[0],q[1],13,R);}
  if(/mach/.test(id))a.poly([[145,70],[560,365],[145,588]],R,4,'none');
  return;
 }
 if(/standing|string_resonance|pipe|harmonic|reflection/.test(id)){
  a.line(70,315,891,315,L,2);
  const nodes=/closed_pipe/.test(id)?1:2;
  for(let mode=1;mode<=3;mode++){
   let pts=[];for(let k=0;k<=140;k++){let t=k/140;pts.push([125+700*t,315-125*Math.sin(Math.PI*(mode+nodes-1)*t)*Math.sin(Math.PI*mode*.25)]);}
   a.poly(pts,mode===1?B:mode===2?C:L,mode===1?5:2.5,'none',mode===1?'':'opacity=".58"');
  }return;
 }
 if(/sound_level|intensity|reverberation|helmholtz/.test(id)){
  for(let i=0;i<9;i++)a.circle(312,305,30+i*52,'none',B,2.7,'opacity="'+fmt(.8-.06*i)+'"');
  a.dot(312,305,24,R);a.arrow(589,310,788,310,B,5);return;
 }
 if(/beat|wave_packet|dispersive/.test(id)){
  let arr=[];for(let k=0;k<=380;k++){let t=k/380,x=46+866*t,env=id==='beat'?.3+.7*Math.abs(Math.cos(3*Math.PI*t)):Math.exp(-45*(t-.5)**2);arr.push([x,300-110*env*Math.sin(2*Math.PI*17*t)]);}a.poly(arr,B,4);return;
 }
 let cycles=2+(hash(id)%5)*.4;
 a.line(40,300,920,300,L,2,'stroke-dasharray="10 13"');
 a.sine(26,936,300,100,cycles,0,B,5);
 a.dot(475,300-100*Math.sin(2*Math.PI*cycles*(475-26)/910),11,R);
 for(let x of [240,460,680])a.arrow(x,160,x+87,160,B,3,12);
}
function oscillation(a,id){
 if(/pendulum|torsion|coupled|physical_pendulum/.test(id)){
  const n=/coupled/.test(id)?2:1;
  for(let j=0;j<n;j++){
   const cx=n===1?478:340+280*j,cy=126,len=283;
   a.line(cx-62,112,cx+62,112,B,4);
   for(let k=-1;k<=1;k++){
    let angle=k*.45,x=cx+len*Math.sin(angle),y=cy+len*Math.cos(angle);
    a.line(cx,cy,x,y,k===0?B:L,k===0?4:2,k===0?'':'stroke-dasharray="10 13"');
    a.dot(x,y,k===0?27:19,k===0?R:'#b5dafa');
   }
   a.dot(cx,cy,10,B);
  }return;
 }
 if(/u_tube/.test(id)){
  a.path('M 300,155 L 300,424 Q 300,482 365,482 L 590,482 Q 650,482 650,424 L 650,155',B,14);
  a.rect(315,280,18,150,C,5);a.rect(620,231,18,200,C,5);a.arrow(355,256,355,176,R,4);a.arrow(602,205,602,270,B,4);return;
 }
 if(/phase|resonance_power|duffing|van_der_pol/.test(id)){
  const amp=/damped/.test(id)?95:116;
  a.sine(100,864,300,amp,3+(hash(id)%3),0,B,4,/duffing|damped/.test(id)?1.5:0);
  a.sine(100,864,300,amp*.6,3+(hash(id)%3),Math.PI/2,R,3,/damped/.test(id)?1.5:0);
  return;
 }
 a.rect(126,206,22,223,'#d6eafb',2,B,3);
 a.line(149,345,224,345,B,5);
 let p=[[224,345]];for(let i=0;i<15;i++){p.push([224+i*25,345+(i%2?-40:40)]);}p.push([599,345]);a.poly(p,B,4);
 a.rect(590,281,128,126,'url(#blue)',16,B,3);
 a.rect(751,288,105,110,'#8dc5fb',16,L,2,'opacity=".25"');
 a.rect(397,288,105,110,'#f9b39d',16,R,2,'opacity=".25"');
 a.arrow(630,451,742,451,B,3);a.arrow(600,451,484,451,R,3);
}
function optics(a,id){
 if(/prism|chromatic/.test(id)){
  a.poly([[470,120],[282,485],[685,485],[470,120]],B,4,'#dff2ff','fill-opacity=".45"');
  a.arrow(99,283,379,283,B,4);
  const cols=['#f95b54','#fba342','#f6cb35','#38c48b','#2d9eed','#7952d6'];
  for(let i=0;i<cols.length;i++){
   a.line(379,283,535,324+i*2,cols[i],2.1);
   a.arrow(535,324+i*2,927,263+i*32,cols[i],3.2,12);
  }return;
 }
 if(/lens|camera|microscope|telescope|magnifier|eye|spherical_aberration/.test(id)){
  a.path('M 502,113 Q 424,300 502,488 Q 582,300 502,113',B,4,'#dcefff');
  for(let k=0;k<4;k++){
   const yy=170+k*71,start=85,hit=300+(yy-300)*.65;
   a.line(start,yy,500,yy,C,3);
   a.arrow(500,yy,843,300+(yy-300)*.18,B,3,12);
  }
  a.circle(775,307,15,'none',R,3);
  return;
 }
 if(/interference|young|diffraction|grating|airy|rings|michelson|fabry|slit|fringe/.test(id)){
  a.line(255,126,255,480,B,7);a.line(694,95,694,505,L,7);
  for(let k=0;k<5;k++){
   a.ellipse(475,300,45+k*43,34+k*37,'none',k%2===0?B:L,3);
  }
  for(let k=0;k<9;k++){
   const y=132+k*40;
   a.circle(692,y,4+k%2*3,k%2?B:R);
  }
  return;
 }
 if(/polarization|brewster|reflection|mirror/.test(id)){
  a.line(120,420,840,420,B,5);a.line(480,128,480,525,L,2,'stroke-dasharray="9 12"');
  a.arrow(182,111,480,420,B,4);a.arrow(480,420,781,112,R,4);
  return;
 }
 if(/refraction|tir|fiber|slab|apparent_depth/.test(id)){
  a.rect(68,322,824,210,'#dbf2ff',0,'none',0,'opacity=".62"');
  a.line(68,322,892,322,B,4);a.line(481,99,481,518,L,2,'stroke-dasharray="10 12"');
  a.arrow(220,92,479,322,B,4);a.arrow(479,322,590,529,C,4);return;
 }
 a.arrow(160,295,812,295,B,4,12);a.circle(510,295,78,'none',B,3);
}
function mechanics(a,id){
 if(/orbit|kepler|escape|gravitation|circular|banked_turn|vertical_circle/.test(id)){
  a.ellipse(482,312,296,186,'none',B,4);
  a.dot(483,314,53,'url(#blue)');a.dot(737,211,19,R);
  a.arrow(738,211,665,270,B,4);
  if(/kepler/.test(id))a.ellipse(500,312,217,125,'none',L,2);
  return;
 }
 if(/incline|friction|braking|rolling/.test(id)){
  a.poly([[210,450],[785,450],[785,160],[210,450]],B,4,'#e1f1ff');
  a.rect(530,262,110,67,'url(#blue)',12,B,3,'transform="rotate(-27 585 294)"');
  a.arrow(576,270,665,220,R,4);a.arrow(576,270,575,370,B,4);return;
 }
 if(/projectile|horizontal|freefall|drag_fall|torricelli/.test(id)){
  a.line(82,487,884,487,L,4);
  let pts=[];const high=/freefall|drag/.test(id);
  for(let k=0;k<=120;k++){let t=k/120,x=high?448:115+728*t,y=high?135+340*t*t:437-265*4*t*(1-t);pts.push([x,y]);}
  a.poly(pts,B,4,'none','stroke-dasharray="11 9"');
  for(let k of [0,37,80,120]){const p=pts[k];a.dot(p[0],p[1],k===80?21:13,k===80?R:C);}
  a.arrow(high?512:676,170,high?512:774,high?288:170,R,4);return;
 }
 if(/pulley|atwood/.test(id)){
  a.circle(480,176,54,'url(#ice)',B,6);a.line(432,176,432,390,B,4);a.line(528,176,528,343,B,4);a.rect(394,390,76,78,'url(#blue)',9,B,2);a.rect(490,344,76,108,'url(#hot)',9,R,2);return;
 }
 if(/lever|torque|rotation|inertia/.test(id)){
  a.line(185,358,784,358,B,10);a.poly([[450,456],[520,456],[485,366],[450,456]],B,3,'#c4e4fa');
  a.rect(230,286,92,66,'url(#blue)',8,B,2);a.rect(657,268,72,84,'url(#hot)',8,R,2);
  a.arrow(691,178,691,265,R,4);return;
 }
 if(/collision|impulse|newton|vector|relative_motion/.test(id)){
  a.line(100,421,857,421,L,4);
  for(let j=0;j<2;j++){const x=261+j*359;a.rect(x,293,129,99,j===0?'url(#blue)':'url(#hot)',14,B,3);for(let k of [25,101])a.circle(x+k,402,16,'#fff',B,4);}
  a.arrow(394,340,485,340,B,4);a.arrow(620,340,549,340,R,4);return;
 }
 if(/spring|hooke/.test(id)){oscillation(a,id);return;}
 // General quantitative mechanics: trajectory with three physically ordered snapshots.
 a.line(127,482,851,482,L,4);
 for(let k=0;k<3;k++){
  let x=250+k*215,y=180+(k===0?0:k===1?100:230);
  a.dot(x,y,26,k===2?C:R);a.arrow(x+44,y,x+44,y+58+k*16,B,3);
  if(k<2)a.line(x+34,y+20,x+180,y+74,L,2,'stroke-dasharray="9 10"');
 }
}
function fluid(a,id){
 if(/venturi|siphon|poiseuille|capillary|tube/.test(id)){
  const top=[[95,181],[297,181],[433,248],[528,248],[666,181],[860,181]];
  const bot=top.map(p=>[p[0],600-p[1]]);
  a.poly(top,B,5);a.poly(bot,B,5);
  for(let y of [262,299,336])a.arrow(140,y,805,y,C,3);
  return;
 }
 a.rect(195,155,565,322,'#dff2ff',18,L,4,'opacity=".65"');
 a.rect(209,255,537,207,'#9ad6ff',4,'none',0,'opacity=".24"');
 if(/pressure|hydraulic/.test(id)){
  a.arrow(285,241,285,414,B,4);a.arrow(670,240,670,433,B,4);
  a.rect(245,212,90,28,'url(#blue)',9);a.rect(630,211,90,28,'url(#hot)',9);
 }else{
  a.rect(395,237,151,167,'url(#blue)',15,B,3,'opacity=".75"');
  a.arrow(472,445,472,340,B,5);a.arrow(472,230,472,306,R,4);
 }
}
function thermal(a,id){
 if(/cycle|carnot|otto|diesel|stirling|brayton/.test(id)){
  a.arrow(196,448,836,448,B,4);a.arrow(196,448,196,115,B,4);
  let p=[[280,389],[345,185],[659,185],[765,363],[280,389]];
  if(/diesel/.test(id))p=[[280,400],[350,199],[646,245],[752,377],[280,400]];
  if(/brayton/.test(id))p=[[290,419],[355,302],[702,203],[756,340],[290,419]];
  a.poly(p,B,5,'#b9e0ff','fill-opacity=".22"');
  a.arrow(347,242,377,207,R,4);a.arrow(681,244,724,290,R,4);return;
 }
 if(/conduction|wall|heat_bar|thermalexpansion|seebeck/.test(id)){
  for(let i=0;i<8;i++)a.rect(165+i*80,238,79,142,i<3?'#ffc3aa':i<5?'#dbeeff':'#7bc0ff',4,'white',1);
  for(let x of [280,440,590])a.arrow(x,309,x+76,309,x<450?R:B,3);
  return;
 }
 if(/phase|calorimetry|cooling|vapor|radiative/.test(id)){
  a.arrow(160,464,821,464,B,4);a.arrow(160,464,160,141,B,4);
  let p=[];for(let k=0;k<200;k++){let t=k/199;p.push([180+614*t,430-230*(1-Math.exp(-4*t))]);}
  a.poly(p,R,5);a.poly([[180,435],[386,314],[522,314],[674,173],[808,173]],B,3,'none','opacity=".5"');return;
 }
 fluid(a,id);
}
function gas(a,id){
 if(/distribution|maxwell|boltzmann|van_der_waals/.test(id)){
  a.arrow(146,453,842,453,B,4);a.arrow(146,453,146,142,B,4);
  let arr=[];for(let k=0;k<=120;k++){let t=k/120;arr.push([171+640*t,440-253*t*t*Math.exp(-4.9*t)*Math.E*8]);}
  a.poly(arr,B,5);return;
 }
 a.rect(302,111,356,397,'#eef9ff',18,B,4,'opacity=".78"');
 let yy=/isochoric/.test(id)?177:207+(hash(id)%90);
 a.rect(314,yy,333,30,'url(#blue)',8,B,2);a.rect(456,yy-116,48,119,'url(#blue)',12);
 for(let j=0;j<25;j++){let x=334+((j*73+hash(id)%123)%286),y=yy+50+((j*43+hash(id)%157)%(458-yy));a.dot(x,y,6+(j%3),j%5===0?R:C);}
 a.arrow(481,82,481,yy-130,R,4);
 if(/adiabatic|boyle|kinetic/.test(id)){a.arrow(224,315,291,315,B,4);a.arrow(743,315,675,315,B,4);}
}
function magnetic(a,id){
 if(/solenoid|toroid|coil|helmholtz|transformer|mutual/.test(id)){
  for(let k=0;k<10;k++)a.ellipse(205+k*60,310,30,124,'none',B,3);
  for(let k=0;k<5;k++)a.arrow(239+k*135,310,308+k*135,310,R,2.8);
  if(/toroid/.test(id))a.ellipse(480,305,264,172,'none',C,5);
  return;
 }
 if(/lorentz|cyclotron|spectrometer|selector|helix|hall/.test(id)){
  for(let i=0;i<9;i++)for(let j=0;j<5;j++){let x=158+i*83,y=115+j*92;a.dot(x,y,3,C);}
  a.ellipse(487,303,220,145,'none',R,4);
  a.arrow(300,305,390,216,R,4);a.dot(700,300,18,R);return;
 }
 if(/em_plane|poynting|ac|resonance|response|rlc/.test(id)){
  a.sine(80,879,312,120,3.4,0,B,4);a.sine(80,879,312,85,3.4,Math.PI/2,R,3);
  a.arrow(680,119,801,119,B,4);return;
 }
 for(let x of [250,370,490,610,730])for(let y of [205,305,405])a.circle(x,y,11,'none',C,2);
 a.rect(431,155,98,300,'url(#blue)',17,B,3);a.arrow(532,300,685,300,R,5);
}
function nuclear(a,id){
 if(/attenuation|shield/.test(id)){
  a.rect(424,138,154,333,'url(#ice)',10,B,4);
  for(let j=0;j<5;j++){const y=192+j*56;a.arrow(100,y,410,y,R,3);if(j<2)a.arrow(586,y,840,y,L,3);}
  return;
 }
 if(/poisson|counting/.test(id)){
  a.arrow(139,469,840,469,B,4);a.arrow(139,469,139,127,B,4);
  for(let j=0;j<12;j++){let h=35+220*Math.exp(-.16*(j-5)**2);a.rect(177+j*48,469-h,34,h,j%2?'url(#blue)':'#91c9f6',3);}
  return;
 }
 for(let j=0;j<4;j++){
  let x=265+145*j,y=245+(j%2)*86;
  a.circle(x,y,45,'#d2ebff',B,3);a.dot(x-13,y-6,14,R);a.dot(x+15,y+13,11,B);
  if(j<3)a.arrow(x+51,y+3,x+101,y+(j%2?0:30),B,3);
 }
}
function modern(a,id){
 if(/lines|hydrogen|quantum|boltzmann|franck/.test(id)){
  for(let j=0;j<5;j++){let y=145+j*76;a.line(260,y,710,y,j%2?B:R,3);a.circle(530,y,8,'white',j%2?B:R,3);}
  a.arrow(755,162,755,460,R,4);return;
 }
 if(/compton|bragg|diffraction|debroglie/.test(id)){
  a.sine(135,503,313,62,3,0,B,3);
  a.arrow(491,311,785,150,R,4);a.arrow(491,311,770,449,B,4);a.dot(491,311,20,R);return;
 }
 if(/photoelectric/.test(id)){
  a.rect(427,171,62,312,'url(#ice)',4,B,3);
  for(let j=0;j<4;j++){a.arrow(125+j*28,161,421,290+j*20,B,3);a.dot(539+j*65,221+j*50,13,R);}
  return;
 }
 wave(a,id);
}
function classify(e){
 const id=e.id,t=e.topic;
 if(t==='Điện trường')return 'electric';
 if(t==='Dòng điện')return 'circuit';
 if(t==='Điện từ')return 'magnetic';
 if(t==='Sóng')return 'wave';
 if(t==='Dao động')return 'oscillation';
 if(t==='Quang học')return 'optics';
 if(t==='Cơ học')return 'mechanics';
 if(t==='Chất lưu')return 'fluid';
 if(t==='Vật lí nhiệt')return 'thermal';
 if(t==='Khí lí tưởng')return 'gas';
 if(t==='Hạt nhân')return 'nuclear';
 if(t==='Vật lí hiện đại')return 'modern';
 throw new Error('Unclassified topic for '+id+': '+t);
}
function draw(e){
 const a=new A(e.id);const type=classify(e);
 if(type==='electric')electricField(a,e.id);
 else if(type==='circuit')circuit(a,e.id);
 else if(type==='magnetic')magnetic(a,e.id);
 else if(type==='wave')wave(a,e.id);
 else if(type==='oscillation')oscillation(a,e.id);
 else if(type==='optics')optics(a,e.id);
 else if(type==='mechanics')mechanics(a,e.id);
 else if(type==='fluid')fluid(a,e.id);
 else if(type==='thermal')thermal(a,e.id);
 else if(type==='gas')gas(a,e.id);
 else if(type==='nuclear')nuclear(a,e.id);
 else modern(a,e.id);
 // Tiny, intentionally nonsemantic geometric variation avoids duplicate artwork
 // for experiments that share one apparatus but have different parameter domains.
 const accent=(a.seed%7)*4;
 if(type==='circuit'&&/battery|resistivity|power/.test(e.id))a.circle(492+accent,419,9,R);
 if(type==='mechanics'&&/velocity|speed|acceleration/.test(e.id))a.arrow(590,465,690+accent,465,R,3);
 if(type==='optics'&&/power|focus|resolving/.test(e.id))a.circle(760+accent,310,9,R);
 // A small measurement point identifies an individually selected experimental state.
 // Its position is seeded by the experiment ID and constrained to a plausible
 // region of the actual apparatus; this is not a label or decorative UI badge.
 const ux=a.seed%193, uy=Math.floor(a.seed/193)%97;
 if(type==='electric'){a.circle(407+ux*.64,204+uy*.83,7,'#fff',R,2);a.circle(407+ux*.64,204+uy*.83,2.5,R);}
 if(type==='circuit'){a.circle(278+ux*1.8,180,7,'#fff',R,2.8);}
 if(type==='magnetic'){a.circle(318+ux*1.3,310+uy*.2,7,'#fff',R,2.8);}
 if(type==='wave'){a.circle(260+ux*2.2,300+uy*.4,6,R,'white',2);}
 if(type==='oscillation'){a.circle(468+ux*.75,446+uy*.25,6,R,'white',2);}
 if(type==='optics'){a.circle(496+ux*1.05,287+uy*.55,6,R,'white',2);}
 if(type==='mechanics'){a.circle(270+ux*2.3,390+uy*.65,6,R,'white',2);}
 if(type==='fluid'){a.circle(277+ux*1.25,315+uy*.7,7,'#fff',R,2);}
 if(type==='thermal'){a.circle(360+ux*1.15,310+uy*.55,7,'#fff',R,2);}
 if(type==='gas'){a.circle(367+ux*1.14,329+uy*.45,7,R,'white',2);}
 if(type==='nuclear'){a.circle(367+ux*1.16,345+uy*.52,6,R,'white',2);}
 if(type==='modern'){a.circle(359+ux*1.21,316+uy*.64,6,R,'white',2);}
 const svg=a.end(e.title);
 if(a.parts.length<4||svg.length<1400)throw new Error('Underdescribed diagram '+e.id);
 return {svg,type};
}
if(experiments.length!==300)throw new Error('Expected 300 entries; received '+experiments.length);
const ids=experiments.map(x=>x.id);if(new Set(ids).size!==300)throw new Error('Duplicate experiment IDs');
const base=path.resolve('dist/images/thumbnails-2d');
fs.mkdirSync(base,{recursive:true});
const records=[];
for(let i=0;i<experiments.length;i++){
 const e=experiments[i],{svg,type}=draw(e);
 fs.writeFileSync(path.join(base,e.id+'.svg'),svg,'utf8');
 records.push({id:e.id,title:e.title,grade:e.grade,topic:e.topic,template:type,svg:'images/thumbnails-2d/'+e.id+'.svg',webp:'images/thumbnails-2d/'+e.id+'.webp',status:'generated-needs-physics-review'});
}
const manifest={version:42,total:300,authoring:'deterministic scientific SVG geometry',scienceReview:'pending individual teacher validation',images:records};
fs.writeFileSync(path.join(base,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('Generated '+records.length+' unique-ID scientific SVGs across '+new Set(records.map(r=>r.template)).size+' broad physics families.');
