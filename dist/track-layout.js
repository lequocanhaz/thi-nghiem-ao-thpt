import {experiments,initialState} from './experiments.js?v=54';
import {evaluate,duration} from './models.js?v=54';
import {tickStep} from './plot-grid.js?v=35';

const specs={uniform:{origin:-3,scale:.12,range:[0,50]},acceleration:{origin:-1.5,scale:.06,range:[0,100]},newton:{origin:0,scale:.5,range:[-5,5]},collision:{origin:0,scale:.28,range:[-10,10]}};
const cache=new Map();
// Use the full physical time interval, including a quadratic turning point.
// Camera/track extents never depend on the current playback time.
export function trackLayout(id,state={}){
 const spec=Object.hasOwn(specs,id)?specs[id]:null;if(!spec)return null;
 const e=experiments.find(e=>e.id===id),s={...initialState(e),...state};
 const signature=JSON.stringify(e.params.filter(p=>p.key!=='t').map(p=>s[p.key]));
 if(cache.get(id)?.signature===signature)return cache.get(id).layout;
 const end=duration(e,s,evaluate(id,s)),times=[0,end];
 if(id==='collision'){
  const hit=6/(s.v1-s.v2);if(hit>0&&hit<end)times.push(hit);
  const positions=times.flatMap(t=>{const d=evaluate(id,{...s,t});return [d.x1*.28-.42,d.x2*.28+.42];}),size=Math.max(.8+s.m1*.1,.8+s.m2*.1);
  const layout={origin:0,scale:.28,range:spec.range,end,left:Math.min(-3.5,...positions)-.5*size,right:Math.max(3.5,...positions)+.5*size,depth:Math.max(.9,size*.9)};
  cache.set(id,{signature,layout});return layout;
 }
 if(id==='acceleration'&&s.acc){const turn=-s.v0/s.acc;if(turn>0&&turn<end)times.push(turn);}
 const positions=times.map(t=>evaluate(id,{...s,t}).x),lo=Math.min(spec.range[0],...positions),hi=Math.max(spec.range[1],...positions),step=tickStep(lo,hi,5);
 const range=[Math.floor(lo/step)*step,Math.ceil(hi/step)*step];
 const layout={origin:spec.origin,scale:spec.scale,range,end,left:spec.origin+range[0]*spec.scale-.6,right:spec.origin+range[1]*spec.scale+.6};
 cache.set(id,{signature,layout});return layout;
}
