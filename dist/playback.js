import {evaluate,clampState} from './models.js?v=17';
import {meters} from './measurements.js?v=17';
import {usableParams,coreParams} from './learning.js?v=17';

// A static law is driven by a controlled experimental process, never a fake t-axis.
export const isDriven=e=>['electric','lever','hooke','magnetic'].includes(e.id)||!!(e.static&&!e.visualOnly);
// Choose a control that also changes the real apparatus, before a graph-only input.
const apparatusControl={rotational_inertia:'radius',rolling:'radius',spring_energy:'extension',string_resonance:'mode',open_pipe:'mode',closed_pipe:'mode',potential_pair:'distance',dipole_torque:'angle',inductor_energy:'current',binding_energy:'nucleons',metacentric:'angle',atwood_inertia:'m1',physical_pendulum:'length',harmonic_timbre:'second',cyclotron:'radius',em_plane_wave:'amplitude',newton_rings:'curvature',maxwell_distribution:'temperature'};
const basis=(e,s,c,key)=>JSON.stringify([e.params.filter(p=>p.key!==key&&p.key!=='t').map(p=>[p.key,s[p.key]]),c.mode,c.capMode]);
const outputs=(e,s,c)=>{const d=evaluate(e.id,s,c);return d?meters[e.id].map(m=>Object.hasOwn(d,m.key)?d[m.key]:s[m.key]):null;};
const good=values=>values&&values.some(Number.isFinite)&&values.every(v=>v===null||v===undefined||Number.isFinite(v));
function sample(e,s,key,value){return clampState(e,{...s,[key]:value});}
function response(a,b,skip){return a.reduce((sum,v,i)=>sum+(!skip.has(i)&&(Number.isFinite(v)&&Number.isFinite(b[i])?Math.abs(v-b[i])/Math.max(1e-30,Math.abs(v),Math.abs(b[i])):0)),0);}
export function processValue(e,plan,position){
 const p=e.params.find(p=>p.key===plan.key);if(!p)return NaN;
 const f=Math.max(0,Math.min(1,position));if(f===0)return plan.from;if(f===1)return plan.to;const discrete=['mode','turns','n1','n2','n0'].includes(p.key)||(e.atlas&&p.step===1&&p.digits===0),smooth=discrete?f:f*f*(3-2*f),raw=plan.from+(plan.to-plan.from)*smooth;
 return Math.max(p.min,Math.min(p.max,discrete?p.min+Math.round((raw-p.min)/p.step)*p.step:Number(raw.toPrecision(12))));
}
export function createProcess(e,s,c={}){
 const start=outputs(e,s,c);if(!good(start))throw Error('Điều kiện ban đầu chưa cho số đo hợp lệ.');
 const params=usableParams(e,c),preferred=[c.processKey,apparatusControl[e.id],c.dragKey,e.graph?.key,...coreParams(e).map(p=>p.key)],order=[...new Set([...preferred,...params.map(p=>p.key)])];
 let best;
 for(const key of order){const p=params.find(p=>p.key===key);if(!p||p.max<=p.min)continue;
  const candidates=[.2,.37,.63,.8,0,1].map(f=>p.min+(p.max-p.min)*f);
  for(const value of candidates){const target=sample(e,s,key,value),to=target[key];if(Math.abs(to-s[key])<Math.max(1e-20,Math.abs(s[key])*1e-8))continue;
   const plan={key,from:s[key],to,position:0,seconds:8,basis:basis(e,s,c,key)};
   let score=0,valid=true;
   for(const f of [.125,.25,.375,.5,.625,.75,.875,1]){const next=sample(e,s,key,processValue(e,plan,f)),readings=outputs(e,next,c);if(!good(readings)){valid=false;break;}score=Math.max(score,response(start,readings,new Set(meters[e.id].flatMap((m,i)=>m.key===key?[i]:[]))));}
   if(valid&&score>1e-8){best={...plan,score};break;}
  }
  if(best)break;
 }
 if(!best)throw Error('Chưa tìm được quy trình có số đo biến đổi an toàn cho bài '+e.id+'.');
 delete best.score;return best;
}
export function processFor(e,s,c={}){
 const p=c.process,def=p&&usableParams(e,c).find(q=>q.key===p.key);
 if(def&&[p.from,p.to,p.position,p.seconds].every(Number.isFinite)&&p.from>=def.min&&p.from<=def.max&&p.to>=def.min&&p.to<=def.max&&p.seconds>=1&&p.seconds<=60&&p.position>=0&&p.position<=1&&p.basis===basis(e,s,c,p.key)&&Math.abs(processValue(e,p,p.position)-s[p.key])<Math.max(1e-15,Math.abs(s[p.key])*1e-7))return p;
 return createProcess(e,s,c);
}
export function seekProcess(e,s,c,position){
 const p=processFor(e,s,c),f=Math.max(0,Math.min(1,position));
 const next=sample(e,s,p.key,processValue(e,p,f));if(!good(outputs(e,next,c)))throw Error('Quy trình chạm điều kiện mô hình chưa xác định.');
 Object.assign(s,next,{t:f*p.seconds});c.process={...p,position:f};return f>=1;
}
export function advanceProcess(e,s,c,seconds){
 const p=processFor(e,s,c);c.process=p;
 const next=p.position+Math.max(0,seconds)/p.seconds;
 return seekProcess(e,s,c,c.loop&&next>1?next%1:Math.min(1,next));
}
export function cleanProcess(e,s,c,raw){
 if(!raw||typeof raw!=='object')return undefined;
 try{const candidate=processFor(e,s,{...c,process:raw});return candidate===raw?{...raw}:undefined;}catch{return undefined;}
}
