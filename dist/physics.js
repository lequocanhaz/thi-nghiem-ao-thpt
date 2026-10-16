export const K = 8.9875517923e9;
export const RGAS = 8.314462618;
export const G = 9.81;
export const ohm = (u,r) => ({u,r,i:u/r,p:u*u/r});
export function field(q,x,y,px,py) {
  const dx=px-x,dy=py-y,r=Math.hypot(dx,dy);
  if(q===0) return {x:0,y:0,r,magnitude:0};
  if(r<0.012) return null;
  const f=K*q/(r*r*r);
  return {x:f*dx,y:f*dy,r,magnitude:K*Math.abs(q)/(r*r)};
}
export function superpose(charges,px,py) {
  const parts=charges.map(c=>field(c.q,c.x,c.y,px,py));
  if(parts.some(p=>!p)) return null;
  const x=parts.reduce((s,p)=>s+p.x,0),y=parts.reduce((s,p)=>s+p.y,0);
  return {x,y,magnitude:Math.hypot(x,y),parts};
}
export function field3d(q,x,y,z,px,py,pz) {
  const dx=px-x,dy=py-y,dz=pz-z,r=Math.hypot(dx,dy,dz);
  if(q===0) return {x:0,y:0,z:0,r,magnitude:0};
  if(r<0.012) return null;
  const f=K*q/(r*r*r);
  return {x:f*dx,y:f*dy,z:f*dz,r,magnitude:K*Math.abs(q)/(r*r)};
}
export function superpose3d(charges,px,py,pz) {
  const parts=charges.map(c=>field3d(c.q,c.x,c.y,c.z??0,px,py,pz));
  if(parts.some(p=>!p)) return null;
  const x=parts.reduce((s,p)=>s+p.x,0),y=parts.reduce((s,p)=>s+p.y,0),z=parts.reduce((s,p)=>s+p.z,0);
  return {x,y,z,magnitude:Math.hypot(x,y,z),parts};
}
export function energy(m,h0,t) {
  const end=Math.sqrt(2*h0/G),time=Math.min(Math.max(0,t),end);
  const h=Math.max(0,h0-G*time*time/2),v=G*time;
  return {t:time,h,v,k:0.5*m*v*v,u:m*G*h,total:m*G*h0,end};
}
export function oscillation(a,period,t) {
  const w=2*Math.PI/period;
  return {t,x:a*Math.cos(w*t),v:-a*w*Math.sin(w*t),acc:-a*w*w*Math.cos(w*t),w};
}
export function wave(a,f,speed,x,t) {
  const wavelength=speed/f;
  return {y:a*Math.cos(2*Math.PI*(f*t-x/wavelength)),wavelength,period:1/f};
}
export const boyle=(v)=>({v,p:600/v,pv:600,t:300});
export function capacitor(u,r,c,t,mode) {
  const tau=r*c,decay=Math.exp(-Math.max(0,t)/tau);
  const uc=mode==='charge'?u*(1-decay):u*decay;
  const i=(mode==='charge'?1:-1)*u/r*decay;
  return {t,uc,i,q:c*uc,energy:0.5*c*uc*uc,tau};
}
export function gas(n,t,v) {
  const p=n*RGAS*t/(v/1000)/1000;
  const vrms=Math.sqrt(3*RGAS*t/0.028);
  return {p,v,t,n,pv:p*v,vrms,meanK:1.5*1.380649e-23*t};
}
