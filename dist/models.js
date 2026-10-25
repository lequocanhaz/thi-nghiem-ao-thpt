import {atlasById,evaluateAtlas} from './atlas-catalog.js?v=54';
import * as P from './physics.js?v=17';
import {evaluateDiscovery} from './discovery-models.js?v=17';
export const rad=d=>d*Math.PI/180;
export function interferenceAt(s,x,z,t=s.t){const lambda=s.speed/s.f,r1=Math.hypot(x+s.separation/2,z),r2=Math.hypot(x-s.separation/2,z),phase=rad(s.phase);const u1=s.a*Math.cos(2*Math.PI*(s.f*t-r1/lambda)),u2=s.a*Math.cos(2*Math.PI*(s.f*t-r2/lambda)+phase);return {u1,u2,u:u1+u2,amplitude:2*s.a*Math.abs(Math.cos((2*Math.PI*(r1-r2)/lambda+phase)/2)),delta:r2-r1,lambda};}
export function evaluate(id,s,c={}){const t=s.t||0;if(atlasById[id])return evaluateAtlas(id,s);switch(id){
 case 'ohm':return P.ohm(s.u,s.r);
 case 'energy':return P.energy(s.m,s.h0,t);
 case 'oscillation':return P.oscillation(s.a,s.period,t);
 case 'wave':return P.wave(s.a,s.f,s.speed,0,t);
 case 'boyle':return P.boyle(s.v);
 case 'gas':return P.gas(s.n,s.tK,s.v);
 case 'capacitor':return P.capacitor(s.u,s.r*1000,s.c/1e6,t,c.capMode||'charge');
 case 'electric':{const mode=c.mode??0,q=[{q:s.q1*1e-9,x:s.x1,y:s.y1,z:s.z1||0}];if(mode>=2)q.push({q:s.q2*1e-9,x:s.x2,y:s.y2,z:s.z2||0});const px=mode===0?s.x2:s.px,py=mode===0?s.y2:s.py,pz=mode===0?s.z2:s.pz;const f=P.superpose3d(q,px,py,pz||0);if(!f)return null;const factor=mode===0?s.q2*1e-9:mode===2?s.q0*1e-9:1;return {...f,x:f.x*factor,y:f.y*factor,z:f.z*factor,magnitude:f.magnitude*Math.abs(factor),parts:f.parts.map(p=>({...p,x:p.x*factor,y:p.y*factor,z:p.z*factor,magnitude:p.magnitude*Math.abs(factor)})),r1:f.parts[0].r,r2:f.parts[1]?.r??null,unit:[0,2].includes(mode)?'N':'N/C'};}
 case 'uniform':return {t,x:s.v*t,v:s.v};
 case 'acceleration':return {t,x:s.v0*t+.5*s.acc*t*t,v:s.v0+s.acc*t,acc:s.acc};
 case 'horizontal':{const duration=Math.sqrt(2*s.h0/P.G),tt=Math.min(t,duration);return {t:tt,x:s.v0*tt,y:Math.max(0,s.h0-.5*P.G*tt*tt),vx:s.v0,vy:-P.G*tt,v:Math.hypot(s.v0,P.G*tt),range:s.v0*duration,duration};}
 case 'projectile':{const vx=s.v0*Math.cos(rad(s.angle)),vy0=s.v0*Math.sin(rad(s.angle)),duration=2*vy0/P.G,tt=Math.min(t,duration);return {t:tt,x:vx*tt,y:Math.max(0,vy0*tt-.5*P.G*tt*tt),vx,vy:vy0-P.G*tt,v:Math.hypot(vx,vy0-P.G*tt),height:vy0*vy0/(2*P.G),range:vx*duration,duration};}
 case 'newton':{const acc=s.force/s.m,duration=Math.abs(acc)>1e-9?Math.sqrt(10/Math.abs(acc)):10,tt=Math.min(t,duration);return {t:tt,acc,x:.5*acc*tt*tt,v:acc*tt,force:s.force,duration};}
 case 'incline':{const a=rad(s.angle),normal=s.m*P.G*Math.cos(a),drive=s.m*P.G*Math.sin(a),friction=Math.min(drive,s.mu*normal),acc=(drive-friction)/s.m,duration=acc>1e-9?Math.sqrt(10/acc):10,tt=Math.min(t,duration);return {t:tt,acc,x:Math.min(5,.5*acc*tt*tt),v:acc*tt,normal,friction,weight:s.m*P.G,duration};}
 case 'collision':{const momentum=s.m1*s.v1+s.m2*s.v2,den=s.m1+s.m2,out1=(momentum-s.m2*s.e*(s.v1-s.v2))/den,out2=(momentum+s.m1*s.e*(s.v1-s.v2))/den,collisionTime=s.v1>s.v2?6/(s.v1-s.v2):Infinity,hit=t>=collisionTime,xc=-3+s.v1*collisionTime,x1=hit?xc+out1*(t-collisionTime):-3+s.v1*t,x2=hit?xc+out2*(t-collisionTime):3+s.v2*t,v1=hit?out1:s.v1,v2=hit?out2:s.v2;return {t,x1,x2,v1,v2,out1,out2,hit:hit?1:0,momentum,k:.5*s.m1*v1*v1+.5*s.m2*v2*v2,k0:.5*s.m1*s.v1*s.v1+.5*s.m2*s.v2*s.v2};}
 case 'circular':{const w=s.v/s.radius;return {t,theta:w*t,x:s.radius*Math.cos(w*t),z:s.radius*Math.sin(w*t),acc:s.v*s.v/s.radius,force:s.m*s.v*s.v/s.radius,period:2*Math.PI/w};}
 case 'lever':return {torque1:s.m1*P.G*s.l1,torque2:s.m2*P.G*s.l2,net:P.G*(s.m1*s.l1-s.m2*s.l2),balance:s.m1*s.l1-s.m2*s.l2};
 case 'hooke':return {force:s.m*P.G,extension:s.m*P.G/s.k,energy:.5*(s.m*P.G)**2/s.k};
 case 'pendulum':{const w=Math.sqrt(P.G/s.length),theta=rad(s.angle)*Math.cos(w*t),thetav=-rad(s.angle)*w*Math.sin(w*t),v=s.length*thetav;return {t,theta,angle:theta*180/Math.PI,v,period:2*Math.PI/w,k:.5*s.m*v*v,u:.5*s.m*P.G*s.length*theta*theta};}
 case 'damped':{const w0=2*Math.PI/s.period,wd=Math.sqrt(w0*w0-s.beta*s.beta),exp=Math.exp(-s.beta*t),x=s.a*exp*(Math.cos(wd*t)+s.beta/wd*Math.sin(wd*t)),v=-s.a*exp*w0*w0/wd*Math.sin(wd*t);return {t,x,v,acc:-2*s.beta*v-w0*w0*x,envelope:s.a*exp,energy:.5*(v*v+w0*w0*x*x)/10000};}
 case 'resonance':{const w0=2*Math.PI*s.f0,w=2*Math.PI*s.f,amplitude=s.force/Math.hypot(w0*w0-w*w,2*s.beta*w),phase=Math.atan2(2*s.beta*w,w0*w0-w*w);return {t,amplitude,phase,x:amplitude*Math.cos(w*t-phase),v:-amplitude*w*Math.sin(w*t-phase),acc:-amplitude*w*w*Math.cos(w*t-phase)};}
 case 'interference':return {t,...interferenceAt(s,s.probeX,s.probeZ)};
 case 'standing':{const frequency=s.speed*s.mode/(2*s.length),x=Math.min(s.length,s.probeX),u=2*s.a*Math.sin(s.mode*Math.PI*x/s.length)*Math.cos(2*Math.PI*frequency*t);return {t,x,u,frequency,lambda:2*s.length/s.mode,nodes:s.mode+1,antinodes:s.mode};}
 case 'sound':return {t,f:s.f,amplitude:s.a,lambda:343/s.f,u:s.a*Math.sin(2*Math.PI*s.f*t),period:1/s.f};
 case 'series':{const resistance=s.r1+s.r2,i=s.u/resistance;return {u:s.u,resistance,i,i1:i,i2:i,u1:i*s.r1,u2:i*s.r2,p:s.u*i};}
 case 'parallel':{const resistance=s.r1*s.r2/(s.r1+s.r2),i1=s.u/s.r1,i2=s.u/s.r2;return {u:s.u,resistance,i:i1+i2,i1,i2,u1:s.u,u2:s.u,p:s.u*(i1+i2)};}
 case 'joule':{const i=s.u/s.r,power=s.u*i,heat=power*t,temp=20+heat/(s.m*4180);return {t,i,power,heat,temp};}
 case 'magnetic':{const fy=s.b*s.i*s.length*Math.sin(rad(s.angle));return {force:Math.abs(fy),fy,b:s.b,i:s.i};}
 case 'induction':{const omega=2*Math.PI*s.f,theta=omega*t,flux=s.b*s.area*Math.cos(theta),emf=s.turns*s.b*s.area*omega*Math.sin(theta);return {t,theta,flux,emf,i:emf/s.r,emax:s.turns*s.b*s.area*omega};}
 case 'decay':{const lambda=Math.LN2/s.half,N=s.n0*Math.exp(-lambda*t);return {t,N,remaining:N/s.n0,decayed:s.n0-N,activity:lambda*N,lambda};}
 default:return evaluateDiscovery(id,s);
}}
export function duration(e,s,d){if(e.duration)return e.duration(s,d);if(e.id==='rl_response')return d.timeConstant*5;if(e.id==='lc_oscillator')return 3/d.frequency;if(e.id==='oscillator_energy')return 6*Math.PI*Math.sqrt(s.mass/s.stiffness);if(e.id==='newton_cooling')return 5/s.rate;if(['energy','horizontal','projectile','newton','incline','freefall','friction','phasechange'].includes(e.id))return d?.end??d?.duration??10;if(e.id==='capacitor')return (s.r*1000*s.c/1e6)*5;if(e.id==='decay')return s.half*5;return e.params.find(p=>p.key==='t')?.max??10;}
export function clampState(e,s){const rawTime=Number(s.t);for(const p of e.params){if(p.key==='t')continue;const n=Number(s[p.key]);s[p.key]=Number.isFinite(n)?Math.max(p.min,Math.min(p.max,n)):p.value;if(['mode','turns','n1','n2','n0'].includes(p.key)||(e.atlas&&p.step===1&&p.digits===0))s[p.key]=Math.max(p.min,Math.min(p.max,p.min+Math.round((s[p.key]-p.min)/p.step)*p.step));}if(e.id==='standing')s.probeX=Math.min(s.probeX,s.length);if(['lens','mirror'].includes(e.id)&&Math.abs(s.focal)<1)s.focal=s.focal<0?-1:1;const tp=e.params.find(p=>p.key==='t');if(tp){s.t=0;const max=duration(e,s,evaluate(e.id,s));s.t=Number.isFinite(rawTime)?Math.max(0,Math.min(max,rawTime)):tp.value;}return s;}
