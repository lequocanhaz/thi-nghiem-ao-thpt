import {atlasExperiments} from './atlas-catalog.js?v=54';
import {discoveryExperiments} from './discovery-catalog.js?v=17';
import {electricModes} from './experiments.js?v=54';
const m=(label,key,unit='',scale=1,digits=2)=>({label,key,unit,scale,digits});
export const meters={
energy:[m('Động năng','k','J'),m('Thế năng','u','J'),m('Cơ năng','total','J')],
oscillation:[m('Li độ','x','cm'),m('Vận tốc','v','cm/s'),m('Gia tốc','acc','cm/s²')],
wave:[m('Bước sóng','wavelength','m'),m('Chu kì','period','s'),m('Tốc độ','speed','m/s')],
electric:[m('Độ lớn','magnitude',''),m('Khoảng cách r₁','r1','m'),m('Thành phần z','z','')],
ohm:[m('Dòng điện','i','A',1,3),m('Điện trở','r','Ω',1,0),m('Công suất','p','W')],
capacitor:[m('Điện áp tụ','uc','V'),m('Dòng điện','i','mA',1000,3),m('Năng lượng','energy','mJ',1000)],
boyle:[m('Áp suất','p','kPa'),m('Thể tích','v','L'),m('Tích pV','pv','kPa·L')],
gas:[m('Áp suất','p','kPa'),m('Nhiệt độ','t','K',1,0),m('Tốc độ RMS','vrms','m/s')],
uniform:[m('Vị trí','x','m'),m('Vận tốc','v','m/s'),m('Thời gian','t','s')],
acceleration:[m('Vị trí','x','m'),m('Vận tốc','v','m/s'),m('Gia tốc','acc','m/s²')],
horizontal:[m('Tầm xa','range','m'),m('Độ cao','y','m'),m('Tốc độ','v','m/s')],
projectile:[m('Tầm xa','range','m'),m('Độ cao cực đại','height','m'),m('Tốc độ','v','m/s')],
newton:[m('Gia tốc','acc','m/s²'),m('Vị trí','x','m'),m('Vận tốc','v','m/s')],
incline:[m('Gia tốc','acc','m/s²'),m('Ma sát','friction','N'),m('Vận tốc','v','m/s')],
collision:[m('Vận tốc xe 1','v1','m/s'),m('Vận tốc xe 2','v2','m/s'),m('Động lượng','momentum','kg·m/s')],
circular:[m('Lực hướng tâm','force','N'),m('Gia tốc','acc','m/s²'),m('Chu kì','period','s')],
lever:[m('Mômen trái','torque1','N·m'),m('Mômen phải','torque2','N·m'),m('Tổng mômen','net','N·m')],
hooke:[m('Lực đàn hồi','force','N'),m('Độ dãn','extension','m'),m('Thế năng','energy','J')],
pendulum:[m('Góc lệch','angle','°'),m('Chu kì','period','s'),m('Vận tốc','v','m/s')],
damped:[m('Li độ','x','cm'),m('Vận tốc','v','cm/s'),m('Cơ năng','energy','J',1,4)],
resonance:[m('Biên độ','amplitude','m',1,3),m('Li độ','x','m',1,3),m('Tần số','f','Hz')],
interference:[m('Biên độ tại P','amplitude','cm'),m('Li độ tại P','u','cm'),m('Hiệu đường đi','delta','m')],
standing:[m('Tần số','frequency','Hz'),m('Số nút','nodes','',1,0),m('Bước sóng','lambda','m')],
sound:[m('Tần số','f','Hz',1,0),m('Biên độ','amplitude','Pa'),m('Bước sóng','lambda','m')],
series:[m('Dòng điện','i','A',1,3),m('Điện áp R₁','u1','V'),m('Điện áp R₂','u2','V')],
parallel:[m('Dòng chính','i','A',1,3),m('Dòng nhánh 1','i1','A',1,3),m('Dòng nhánh 2','i2','A',1,3)],
joule:[m('Nhiệt độ','temp','°C'),m('Nhiệt lượng','heat','J'),m('Công suất','power','W')],
magnetic:[m('Độ lớn lực','force','N'),m('Thành phần y','fy','N'),m('Cảm ứng từ','b','T')],
induction:[m('Suất điện động','emf','V'),m('Dòng điện','i','A',1,3),m('Từ thông','flux','Wb',1,4)],
decay:[m('Số hạt kỳ vọng','N','',1,1),m('Đã phân rã','decayed','',1,1),m('Hoạt độ','activity','Bq',1,1)]
};
for(const e of [...discoveryExperiments,...atlasExperiments])meters[e.id]=e.readouts;
const discoveryColumns=Object.fromEntries([...discoveryExperiments,...atlasExperiments].map(e=>[e.id,e.columns]));
export function tableValues(id,s,d,c={}){switch(id){
case 'energy':return [d.t,d.h,d.v,d.k,d.u,d.total];case 'oscillation':return [d.t,d.x,d.v,d.acc,s.period,s.a];case 'wave':return [s.t,s.a,s.f,s.speed,d.wavelength,d.period];case 'ohm':return [d.u,d.r,d.i,d.i===0?null:d.u/d.i,d.p];case 'boyle':return [d.v,d.p,d.pv,d.t];case 'gas':return [d.t,d.v,d.n,d.p,d.pv,d.vrms];case 'capacitor':return [c.capMode==='discharge'?'Phóng':'Nạp',d.t,s.u,s.r,s.c,d.uc,d.i*1000,d.energy*1000];case 'electric':{const mode=c.mode??0;return [electricModes[mode],s.q1,mode!==1?s.q2:null,mode===2?s.q0:null,d.r1,mode>=2?d.r2:null,d.magnitude,d.unit,s.x1,s.y1,s.z1||0,mode===1?null:s.x2,mode===1?null:s.y2,mode===1?null:(s.z2||0),mode===0?null:s.px,mode===0?null:s.py,mode===0?null:(s.pz||0)];}
case 'uniform':return [d.t,d.x,d.v];case 'acceleration':return [d.t,d.x,d.v,d.acc];case 'horizontal':case 'projectile':return [d.t,d.x,d.y,d.vx,d.vy,d.range];case 'newton':return [d.t,s.force,s.m,d.acc,d.x,d.v];case 'incline':return [d.t,s.angle,s.mu,d.acc,d.x,d.v,d.friction];case 'collision':return [d.t,d.v1,d.v2,d.momentum,d.k,s.e];case 'circular':return [d.t,s.radius,s.v,d.acc,d.force,d.period];case 'lever':return [s.m1,s.m2,s.l1,s.l2,d.torque1,d.torque2,d.net];case 'hooke':return [s.m,s.k,d.force,d.extension,d.energy];case 'pendulum':return [d.t,d.angle,d.period,d.v,d.k,d.u];case 'damped':return [d.t,d.x,d.v,s.beta,d.energy];case 'resonance':return [d.t,s.f,s.f0,d.amplitude,d.x,s.beta];case 'interference':return [d.t,s.probeX,s.probeZ,d.delta,d.amplitude,d.u,d.lambda];case 'standing':return [d.t,d.x,d.u,d.frequency,d.lambda,d.nodes,d.antinodes];case 'sound':return [d.t,d.f,d.amplitude,d.u,d.lambda,d.period];case 'series':return [s.u,s.r1,s.r2,d.resistance,d.i,d.u1,d.u2];case 'parallel':return [s.u,s.r1,s.r2,d.resistance,d.i,d.i1,d.i2];case 'joule':return [d.t,d.i,d.power,d.heat,d.temp];case 'magnetic':return [s.b,s.i,s.length,s.angle,d.force,d.fy];case 'induction':return [d.t,d.flux,d.emf,d.i,s.turns,s.f];case 'decay':return [d.t,d.N,d.decayed,d.activity,s.half];default:return (discoveryColumns[id]||[]).map(col=>{const v=d[col.key]??s[col.key];return v===null||v===undefined?null:v*col.scale;});
}}
