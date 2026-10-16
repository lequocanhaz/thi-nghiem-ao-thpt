export const themes={
'Vật lí hiện đại':{color:'#6948bd',soft:'#eee7ff',icon:'✧',tag:'Photon & vật chất'},
'Cơ học':{color:'#395bc5',soft:'#ecf0ff',icon:'↗',tag:'Chuyển động & lực'},
'Dao động':{color:'#8052b0',soft:'#f2ecff',icon:'∿',tag:'Nhịp điệu & cân bằng'},
'Sóng':{color:'#08798d',soft:'#e4f7f9',icon:'≈',tag:'Lan truyền & âm thanh'},
'Quang học':{color:'#a24577',soft:'#ffeaf4',icon:'✦',tag:'Ánh sáng & hình ảnh'},
'Điện trường':{color:'#ae561c',soft:'#fff0e1',icon:'±',tag:'Điện tích & trường'},
'Dòng điện':{color:'#8c6311',soft:'#fff5d9',icon:'ϟ',tag:'Mạch điện & năng lượng'},
'Điện từ':{color:'#315daf',soft:'#e8f1ff',icon:'↻',tag:'Từ trường & cảm ứng'},
'Vật lí nhiệt':{color:'#b14434',soft:'#ffede5',icon:'♨',tag:'Nhiệt độ & năng lượng'},
'Khí lí tưởng':{color:'#257654',soft:'#e7f6eb',icon:'◌',tag:'Khí & phân tử'},
'Chất lưu':{color:'#1666a3',soft:'#e4f4ff',icon:'≋',tag:'Chất lỏng & áp suất'},
'Hạt nhân':{color:'#73519e',soft:'#f0e9fa',icon:'⊙',tag:'Hạt & sự biến đổi'}
};
export const themeFor=e=>themes[e.topic]||themes['Điện trường'];
export const paths=[{title:'Bắt đầu với chuyển động',icon:'↗',color:'#395bc5',ids:['uniform','acceleration','freefall','newton','friction']},{title:'Lắp ý tưởng thành mạch',icon:'ϟ',color:'#8c6311',ids:['ohm','series','parallel','internalresistance','capacitor']},{title:'Nhìn thấy sóng',icon:'≈',color:'#08798d',ids:['oscillation','wave','interference','standing','young']},{title:'Hiểu nhiệt và khí',icon:'♨',color:'#b14434',ids:['calorimetry','phasechange','boyle','isobaric','isochoric']}];
export const primaryKeys={energy:['h0','m'],oscillation:['a','period'],wave:['a','f'],electric:['q1','q2'],ohm:['u','r'],capacitor:['u','c'],boyle:['v'],gas:['tK','v'],uniform:['v'],acceleration:['acc','v0'],horizontal:['h0','v0'],projectile:['angle','v0'],newton:['force','m'],incline:['angle','mu'],collision:['v1','e'],circular:['radius','v'],lever:['l1','l2'],hooke:['m','k'],pendulum:['length','angle'],damped:['beta','a'],resonance:['f','beta'],interference:['separation','phase'],standing:['mode','length'],sound:['f','a'],series:['u','r2'],parallel:['u','r2'],joule:['u','m'],magnetic:['angle','i'],induction:['f','turns'],decay:['half','n0']};
export const coreParams=e=>{const keys=primaryKeys[e.id];return keys?keys.map(k=>e.params.find(p=>p.key===k)).filter(Boolean):e.params.filter(p=>p.key!=='t').slice(0,2)};
export function parameterFromDrag(e,key,position){const p=e.params.find(p=>p.key===key);if(!p)return null;const f=Math.max(0,Math.min(1,(position.x+2.6)/5.2));let value=p.min+f*(p.max-p.min);value=p.min+Math.round((value-p.min)/p.step)*p.step;return {key,value:Math.max(p.min,Math.min(p.max,+value.toFixed(6)))};}
export function adjustParameter(e,s,key,direction){const p=e.params.find(p=>p.key===key);if(!p)return false;s[key]=Math.max(p.min,Math.min(p.max,+(s[key]+direction*p.step).toFixed(6)));return true;}
export function usableParams(e,c={}){let params=e.params.filter(p=>p.key!=='t');if(e.id!=='electric')return params;const mode=c.mode??0,keys=mode===0?['q1','q2','x1','y1','z1','x2','y2','z2','scale']:mode===1?['q1','x1','y1','z1','px','py','pz','scale']:['q1','q2',...(mode===2?['q0']:[]),'x1','y1','z1','x2','y2','z2','px','py','pz','scale'];return params.filter(p=>keys.includes(p.key));}
