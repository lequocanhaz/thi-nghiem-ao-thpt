import {metricColor} from './workspace.js?v=17';
const curveCache=new Map();
import {evaluate,duration} from './models.js?v=17';
export function graphFor(e,s,d,c={},rows=[]){const id=e.id;let key='t',min=0,max=duration(e,s,d),xLabel='t (s)',yLabel='',metrics=[],point=null,ignore=['t'];const curve=(label,metric,color=metricColor(e,e.graph?.metric||({I:'i',x:'x',v:'v',a:'acc',W:'total','Wđ':'k',Wt:'u'}[label]||label)))=>metrics.push({label,metric,color});
switch(id){case 'ohm':case 'series':case 'parallel':key='u';max=12;xLabel='U (V)';yLabel='I (A)';curve('I',q=>q.i);ignore=['u','t'];break;
case 'energy':yLabel='W (J)';curve('Wđ',q=>q.k,'#a5632c');curve('Wt',q=>q.u,'#3566b9');curve('W',q=>q.total,'#247b65');break;
case 'oscillation':max=s.period*3;yLabel='x (cm)';curve('x',q=>q.x);point=q=>[q.t%max,q.x];break;
case 'wave':key='f';min=.5;max=3;xLabel='f (Hz)';yLabel='λ (m)';curve('λ',q=>q.wavelength);ignore=['f','a','t'];break;
case 'capacitor':yLabel='Uc (V)';curve('Uc',q=>q.uc);break;
case 'boyle':key='v';min=2;max=10;xLabel='V (L)';yLabel='p (kPa)';curve('p',q=>q.p);ignore=['v','t'];break;
case 'gas':key=c.gasAxis==='v'?'v':'tK';min=key==='v'?2:150;max=key==='v'?10:600;xLabel=key==='v'?'V (L)':'T (K)';yLabel='p (kPa)';curve('p',q=>q.p);ignore=[key,'t'];break;
case 'uniform':yLabel='x (m)';curve('x',q=>q.x);break;
case 'acceleration':yLabel='v (m/s)';curve('v',q=>q.v);break;
case 'horizontal':case 'projectile':yLabel='h (m)';xLabel='x (m)';curve('Quỹ đạo',q=>q.y);point=q=>[q.x,q.y];break;
case 'newton':key='force';min=-15;max=15;xLabel='F (N)';yLabel='a (m/s²)';curve('a',q=>q.acc);ignore=['force','t'];break;
case 'incline':key='angle';min=5;max=40;xLabel='Góc (°)';yLabel='a (m/s²)';curve('a',q=>q.acc);ignore=['angle','t'];break;
case 'collision':yLabel='v (m/s)';curve('v₁',q=>q.v1);curve('v₂',q=>q.v2,'#a5632c');break;
case 'circular':yLabel='x (m)';max=d.period*2;curve('x',q=>q.x);point=q=>[q.t%max,q.x];break;
case 'lever':key='l2';min=.2;max=2;xLabel='l₂ (m)';yLabel='Mnet (N·m)';curve('Tổng mômen',q=>q.net);ignore=['l2','t'];break;
case 'hooke':key='m';min=0;max=2;xLabel='Δl (m)';yLabel='F (N)';curve('F',q=>q.force);point=q=>[q.extension,q.force];ignore=['m','t'];break;
case 'pendulum':key='length';min=.5;max=2;xLabel='l (m)';yLabel='T² (s²)';curve('T²',q=>q.period*q.period);ignore=['length','t'];break;
case 'damped':yLabel='x (cm)';curve('x',q=>q.x);break;
case 'resonance':key='f';min=.2;max=2.5;xLabel='f (Hz)';yLabel='A (m)';curve('A',q=>q.amplitude);ignore=['f','t'];break;
case 'interference':key='probeX';min=-2.5;max=2.5;xLabel='xP (m)';yLabel='A tổng (cm)';curve('A',q=>q.amplitude);ignore=['probeX','t'];break;
case 'standing':key='probeX';min=0;max=s.length;xLabel='x (m)';yLabel='u (cm)';curve('u',q=>q.u);ignore=['probeX'];break;
case 'sound':max=2/s.f;xLabel='t (ms)';yLabel='u (Pa)';curve('u',q=>q.u);point=q=>[(q.t%max)*1000,q.u];break;
case 'joule':yLabel='Q (J)';curve('Q',q=>q.heat);break;
case 'magnetic':key='angle';min=0;max=180;xLabel='Góc (°)';yLabel='F (N)';curve('F',q=>q.force);ignore=['angle','t'];break;
case 'induction':max=3/s.f;yLabel='e (V)';curve('e',q=>q.emf);point=q=>[q.t%max,q.emf];break;
case 'decay':yLabel='N kỳ vọng';curve('N',q=>q.N);break;
case 'electric':{const mode=c.mode??0;min=Math.max(.012,(d?.r1||.2)*.45);max=Math.min(1.1,(d?.r1||.2)*2);xLabel='r₁ (m)';yLabel=d?.unit||([0,2].includes(mode)?'F (N)':'E (N/C)');ignore=['t','x1','y1','z1','x2','y2','z2','px','py','pz','scale'];if(mode<2){const coeff=8.9875517923e9*Math.abs(s.q1*1e-9)*(mode===0?Math.abs(s.q2*1e-9):1);const samples=Array.from({length:121},(_,j)=>{const x=min+(max-min)*j/120;return [x,coeff/x**2]});return finish([{label:mode===0?'F':'E',color:'#3976dd',data:samples}],d?[[d.r1,d.magnitude]]:[],xLabel,yLabel,rows,e,s,c,ignore,q=>[q.r1,q.magnitude]);}return finish([],d?[[d.r1,d.magnitude]]:[],xLabel,yLabel,rows,e,s,c,ignore,q=>[q.r1,q.magnitude]);}
}
if(e.graph){const a=e.graph;key=a.key;min=a.min;max=a.max??duration(e,s,d);xLabel=a.xLabel;yLabel=a.yLabel;ignore=[key,'t'];curve(yLabel,q=>{const v=q[a.metric];return Number.isFinite(v)?v:NaN});}
if(key!=='t'&&id!=='standing'){const domain=e.params.find(p=>p.key===key);if(domain){min=domain.min;max=domain.max;}}
const signature=JSON.stringify([id,key,min,max,c.capMode,c.mode,c.gasAxis,Object.fromEntries(Object.entries(s).filter(([k])=>k!=='t'||id==='standing'))]);let series=curveCache.get(signature);if(!series){series=metrics.map(m=>({label:m.label,color:m.color,discrete:!!e.graph?.discrete,data:Array.from({length:e.graph?.discrete?Math.min(201,Math.round((max-min)/(e.graph.step||1))+1):161},(_,j)=>{const count=e.graph?.discrete?Math.min(201,Math.round((max-min)/(e.graph.step||1))+1):161,x=min+(max-min)*j/(count-1),ss={...s,[key]:x},q=evaluate(id,ss,c);if(!q)return [x,NaN];const xx=['horizontal','projectile'].includes(id)?q.x:id==='hooke'?q.extension:id==='sound'?x*1000:x;return [xx,m.metric(q)];})}));curveCache.set(signature,series);if(curveCache.size>16)curveCache.delete(curveCache.keys().next().value);}series=series.map(q=>({...q}));
const pointFn=point||((q,ss)=>[key==='t'?q.t:ss[key],metrics[0].metric(q)]);return finish(series,d?[pointFn(d,s)]:[],xLabel,yLabel,rows,e,s,c,ignore,pointFn);
}
function finish(series,current,xLabel,yLabel,rows,e,s,c,ignore,pointFn){const points=[],pointRows=[];for(const [index,r] of rows.entries()){if(!r.s||!r.d)continue;if(e.id==='electric'&&r.c?.mode!==c.mode)continue;if(e.id==='capacitor'&&r.c?.capMode!==c.capMode)continue;if(Object.keys(s).some(k=>!ignore.includes(k)&&Math.abs((r.s[k]??s[k])-s[k])>1e-8))continue;const p=pointFn(r.d,r.s);if(p.every(Number.isFinite)){points.push(p);pointRows.push(index);}}const all=[...series.flatMap(q=>q.data),...points,...current].filter(p=>p?.every(Number.isFinite));let xmin=Math.min(0,...all.map(p=>p[0])),xmax=Math.max(0,...all.map(p=>p[0])),ymin=Math.min(0,...all.map(p=>p[1])),ymax=Math.max(0,...all.map(p=>p[1]));if(xmax===xmin)xmax=xmin+1;if(ymax===ymin){const pad=Math.abs(ymax)*.1||1;ymax+=pad;ymin-=pad;}else{const margin=(ymax-ymin)*.12;ymax+=margin;if(ymin<0)ymin-=margin;}return {series,points,pointRows,current:current.filter(p=>p?.every(Number.isFinite)),xLabel,yLabel,xmin,xmax,ymin,ymax};}
