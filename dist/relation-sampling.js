// A declared undefined input splits a relation even when uniform samples would
// miss it. Never interpolate across an excluded physical state.
export function sampleRelation({min,max,count=65,integer=false,excluded=[]},evaluate){
 if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min||!Number.isInteger(count)||count<2)throw new RangeError('Invalid relation domain');
 const cuts=[...new Set(excluded.filter(x=>Number.isFinite(x)&&x>=min&&x<=max))];
 const first=Math.ceil(min),last=Math.floor(max);
 const values=integer&&last-first+1<=count
  ?Array.from({length:Math.max(0,last-first+1)},(_,i)=>first+i)
  :Array.from({length:count},(_,i)=>min+(max-min)*i/(count-1)).map(x=>integer?Math.round(x):x).filter(x=>x>=min&&x<=max);
 return [...new Set([...values,...cuts])].sort((a,b)=>a-b).map(x=>{
  if(cuts.includes(x))return null;
  const y=evaluate(x);return Number.isFinite(y)?[x,y]:null;
 });
}
