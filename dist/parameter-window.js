// Slider windows are UI state. They never change a model's permitted domain.
export function parameterLimits(experiment,p,state={}){
 const max=experiment.id==='standing'&&p.key==='probeX'?Math.min(p.max,state.length??p.max):p.max;
 return {min:p.min,max:Math.max(p.min,max)};
}
export function cleanParameterWindows(experiment,raw={},state={}){
 const result={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const p of experiment.params){if(p.key==='t')continue;const q=raw[p.key],hard=parameterLimits(experiment,p,state);if(!q||!Number.isFinite(q.min)||!Number.isFinite(q.max)||q.min<hard.min||q.max>hard.max||q.min>=q.max||q.max-q.min<p.step*.999999)continue;
  const snap=v=>Math.max(hard.min,Math.min(hard.max,hard.min+Math.round((v-hard.min)/p.step)*p.step));const min=snap(q.min),max=snap(q.max);if(min<max)result[p.key]={min,max};
 }return result;
}
export function parameterWindow(experiment,p,state,raw={}){
 const hard=parameterLimits(experiment,p,state),q=cleanParameterWindows(experiment,raw,state)[p.key];
 if(!q||!Number.isFinite(state[p.key])||state[p.key]<q.min-p.step*1e-6||state[p.key]>q.max+p.step*1e-6)return {...hard,custom:false};
 return {...q,custom:q.min!==hard.min||q.max!==hard.max};
}
export function revealParameterWindows(experiment,state,raw={}){
 const clean=cleanParameterWindows(experiment,raw,state);for(const p of experiment.params)if(clean[p.key]&&!parameterWindow(experiment,p,state,clean).custom)delete clean[p.key];return clean;
}
