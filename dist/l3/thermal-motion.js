// Kinematic contact response only; the supplied scientific sweep remains authoritative.
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const distance2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
export function resolveTranslation(from,to,sweep){
 if(!valid(from)||!valid(to))return{position:{...from},contact:true,reason:'invalid-position',path:[]};
 const start=sweep(from,from);if(!start.valid)return{position:{...from},contact:true,reason:'invalid-start',path:[]};
 const full=sweep(from,to);if(full.valid)return{position:{...to},contact:false,reason:'ok',path:[{...to}]};
 let lo=0,hi=1;for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(sweep(from,mix(from,to,mid)).valid)lo=mid;else hi=mid;}
 const edge=mix(from,to,lo),path=[edge];let position=edge,best=distance2(edge,to);
 // A single tangential leg lets the hand slide along contact, never warp across it.
 for(const p of [{x:edge.x,y:to.y},{x:to.x,y:edge.y}])if(distance2(p,to)<best-1e-10&&sweep(edge,p).valid){position=p;best=distance2(p,to);}
 if(distance2(position,edge)>1e-12)path.push(position);
 return{position,contact:true,reason:full.reason||'contact',obstacle:full.obstacle,path};
}
export function resolveRotation(from,to,sweep){
 if(!Number.isFinite(from)||!Number.isFinite(to)||!sweep(from,from).valid)return{angle:from,contact:true,reason:'invalid-start'};
 const full=sweep(from,to);if(full.valid)return{angle:to,contact:false,reason:'ok'};let lo=0,hi=1;for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(sweep(from,from+(to-from)*mid).valid)lo=mid;else hi=mid;}
 return{angle:from+(to-from)*lo,contact:true,reason:full.reason||'contact'};
}
