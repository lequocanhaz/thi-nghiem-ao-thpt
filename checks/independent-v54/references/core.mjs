/** Independent reference derivations, catalog indices 0..74.
 * No product module/constant is imported. Constants below are explicitly chosen
 * physical inputs: local g=9.81 per the stated laboratory, SI R rounded to the
 * catalogue precision, exact SI k_B, and CODATA G=6.67430e-11.
 * Full means all derived physical numeric outputs are checked, not that the
 * ideal assumptions or pedagogical presentation have been externally certified.
 */
const g=9.81, R=8.314462618, kB=1.380649e-23, G=6.67430e-11;
const pi=Math.PI, rad=x=>x*pi/180, deg=x=>x*180/pi, time=s=>s.t??0;
const bad=(kind,reason)=>({valid:false,kind,reason});
const nonnegativeTime=s=>time(s)>=0?true:bad('outside','Negative elapsed time precedes the stated initial condition.');
const positive=(s,...keys)=>keys.every(key=>s[key]>0)?nonnegativeTime(s):bad('undefined','A required positive mass, length, resistance, period, or temperature is not positive.');
const unitsTime={t:'s'};
export const references={};
function ref(id,law,method,assumptions,outputUnits,expected,options={}){
 references[id]={law,method,assumptions,outputUnits,coverage:'full',notes:'Independent closed-form derivation; comparison checks the ideal model, not experiment.',rtol:1e-7,atol:1e-10,domain:nonnegativeTime,expected,...options};
}
function flight(s,vertical,h0){
 const tEnd=(vertical+Math.sqrt(vertical*vertical+2*g*h0))/g;
 const t=Math.min(time(s),tEnd), height=h0+vertical*t-g*t*t/2;
 return {t,tEnd,height:Math.max(0,height),vertical:vertical-g*t};
}
// Fundamental mechanics, waves and circuits.
ref('energy','Conservation of mechanical energy and constant-gravity free fall.',
 'Solve h=h0−gt²/2 until h=0; K=m g(h0−h), U=mgh.',
 ['Released from rest; local g=9.81 m/s²; end at first ground contact.'],
 {...unitsTime,h:'m',v:'m/s',k:'J',u:'J',total:'J',end:'s'},s=>{
 const p=flight(s,0,s.h0),v=g*p.t;
 return {t:p.t,h:p.height,v,k:s.m*v*v/2,u:s.m*g*p.height,total:s.m*g*s.h0,end:p.tEnd};
 },{domain:s=>positive(s,'m','h0')});
ref('oscillation','Linear harmonic oscillator with displacement A and zero initial velocity.',
 'Differentiate x=A cos(2πt/T) twice; keep displacement units in cm.',
 ['Undamped; input amplitude is cm, not m.'],
 {...unitsTime,x:'cm',v:'cm/s',acc:'cm/s²',w:'rad/s'},s=>{
 const w=2*pi/s.period,phase=w*time(s),x=s.a*Math.cos(phase);
 return {t:time(s),x,v:-s.a*w*Math.sin(phase),acc:-w*w*x,w};
 },{domain:s=>positive(s,'period')});
ref('wave','A monochromatic travelling wave obeys wavelength=speed/f and T=1/f.',
 'Evaluate the travelling-wave solution at the product probe x=0.',
 ['Amplitude in cm; frequency in Hz; propagation speed m/s.'],
 {y:'cm',wavelength:'m',period:'s'},s=>({y:s.a*Math.cos(2*pi*s.f*time(s)),wavelength:s.speed/s.f,period:1/s.f}),
 {domain:s=>positive(s,'f','speed')});
ref('electric','Coulomb superposition requires signed vector charge contributions.',
 'Delegated to the parent vector reference; this entry deliberately supplies no duplicated oracle.',
 ['Point charges in vacuum; source exclusion radius 0.012 m.'],{},()=>null,
 {coverage:'partial',notes:'Electric is tested separately by the parent. No numeric expected values are supplied by core.mjs.'});
ref('ohm','Ohm law and electrical power P=UI.',
 'Determine I by solving U−IR=0, then multiply voltage and current.',
 ['Ideal resistor; raw units are A, Ω, V, W.'],
 {u:'V',r:'Ω',i:'A',p:'W'},s=>({u:s.u,r:s.r,i:s.u/s.r,p:s.u*(s.u/s.r)}),{domain:s=>positive(s,'r')});
ref('capacitor','Charge conservation and Kirchhoff RC step response.',
 'Solve dUc/dt=(U−Uc)/(RC) for charging, and dUc/dt=−Uc/(RC) for discharging; use q=CUc and W=qUc/2.',
 ['R input kΩ and C input µF are converted to SI; initial Uc=0 for charge or U for discharge.','Current is positive in the charging direction; raw output is A and J, before UI scale factors.'],
 {...unitsTime,uc:'V',i:'A',q:'C',energy:'J',tau:'s'},(s,c={})=>{
 const resistance=s.r*1e3,capacity=s.c*1e-6,tau=resistance*capacity,t=time(s),left=Math.exp(-t/tau),charge=c.capMode!=='discharge';
 const uc=s.u*(charge?1-left:left),i=(charge?1:-1)*s.u/resistance*left;
 return {t,uc,i,q:capacity*uc,energy:capacity*uc*uc/2,tau};
 },{domain:(s,c={})=>!['charge','discharge',undefined].includes(c.capMode)?bad('outside','Unknown RC mode.'):positive(s,'r','c')});
ref('boyle','Boyle isotherm pV=600 kPa·L.',
 'Divide the stated isothermal invariant by the controlled volume.',
 ['Fixed amount of gas at 300 K; pressure kPa and volume L.'],
 {v:'L',p:'kPa',pv:'kPa·L',t:'K'},s=>({v:s.v,p:600/s.v,pv:600,t:300}),{domain:s=>positive(s,'v')});
ref('gas','Ideal-gas equation, equipartition and RMS molecular speed.',
 'Use SI volume for p=nRT/V, convert Pa to kPa; use M=0.028 kg/mol and mean kinetic energy 3kBT/2.',
 ['Ideal gas of molar mass 28 g/mol.','Output t is thermodynamic kelvin temperature, not simulation time.'],
 {p:'kPa',v:'L',t:'K',n:'mol',pv:'kPa·L',vrms:'m/s',meanK:'J'},s=>{
 const pressure=s.n*R*s.tK/s.v;
 return {p:pressure,v:s.v,t:s.tK,n:s.n,pv:pressure*s.v,vrms:Math.sqrt(3*R*s.tK/.028),meanK:{value:1.5*kB*s.tK,rtol:1e-7,atol:1e-30}};
 },{domain:s=>positive(s,'v','tK','n')});
ref('uniform','Constant-velocity translation.',
 'Integrate dx/dt=v with x(0)=0.', ['Signed direction is the positive x convention.'],
 {...unitsTime,x:'m',v:'m/s'},s=>({t:time(s),x:s.v*time(s),v:s.v}));
ref('acceleration','Constant acceleration with initial speed v0.',
 'Integrate a once to velocity and again to position; retain signed velocity through reversal.',
 ['x(0)=0; acceleration constant.'], {...unitsTime,x:'m',v:'m/s',acc:'m/s²'},s=>{
 const t=time(s);return {t,x:s.v0*t+s.acc*t*t/2,v:s.v0+s.acc*t,acc:s.acc};
 });
ref('horizontal','Horizontal launch in a uniform gravitational field.',
 'Separate horizontal constant velocity from vertical free fall; stop at the positive root of h=0.',
 ['Air resistance absent; initial vertical speed zero.'],
 {...unitsTime,x:'m',y:'m',vx:'m/s',vy:'m/s',v:'m/s',range:'m',duration:'s'},s=>{
 const p=flight(s,0,s.h0);return {t:p.t,x:s.v0*p.t,y:p.height,vx:s.v0,vy:p.vertical,v:Math.hypot(s.v0,p.vertical),range:s.v0*p.tEnd,duration:p.tEnd};
 },{domain:s=>positive(s,'h0')});
ref('projectile','Two-dimensional ballistic motion; landing level equals launch level.',
 'Resolve v0 into components and solve the vertical quadratic at the first return to ground.',
 ['No drag; launch angle in degrees and positive vertical component.'],
 {...unitsTime,x:'m',y:'m',vx:'m/s',vy:'m/s',v:'m/s',height:'m',range:'m',duration:'s'},s=>{
 const vx=s.v0*Math.cos(rad(s.angle)),vy=s.v0*Math.sin(rad(s.angle)),p=flight(s,vy,0);
 return {t:p.t,x:vx*p.t,y:p.height,vx,vy:p.vertical,v:Math.hypot(vx,p.vertical),height:vy*vy/(2*g),range:vx*p.tEnd,duration:p.tEnd};
 },{domain:s=>s.v0>=0&&s.angle>=0&&s.angle<=90?nonnegativeTime(s):bad('outside','Reference assumes an upward launch above the horizontal.')});
ref('newton','Newton second law with a constant signed force.',
 'Solve m ẍ=F from rest; end when |x|=5 m.',
 ['At exactly zero force the displayed ten-second observation window has no ground event.'],
 {...unitsTime,acc:'m/s²',x:'m',v:'m/s',force:'N',duration:'s'},s=>{
 const acc=s.force/s.m,end=acc===0?10:Math.sqrt(2*5/Math.abs(acc)),t=Math.min(time(s),end);
 return {t,acc,x:acc*t*t/2,v:acc*t,force:s.force,duration:end};
 },{domain:s=>positive(s,'m')});
ref('incline','Newton second law with static threshold and kinetic Coulomb friction.',
 'Use normal=mg cosα; if downslope drive≤µN stay at rest, otherwise accelerate by (drive−µN)/m.',
 ['Same coefficient for static limit and sliding friction; released from rest; stop after 5 m.'],
 {...unitsTime,acc:'m/s²',x:'m',v:'m/s',normal:'N',friction:'N',weight:'N',duration:'s'},s=>{
 const normal=s.m*g*Math.cos(rad(s.angle)),drive=s.m*g*Math.sin(rad(s.angle)),friction=drive<=s.mu*normal?drive:s.mu*normal;
 const acc=(drive-friction)/s.m,end=acc>0?Math.sqrt(10/acc):10,t=Math.min(time(s),end);
 return {t,acc,x:Math.min(5,acc*t*t/2),v:acc*t,normal,friction,weight:s.m*g,duration:end};
 },{domain:s=>positive(s,'m')});
ref('collision','Linear momentum conservation and Newton coefficient of restitution.',
 'In the centre-of-mass frame reverse and scale relative motion by e; propagate freely before/after first contact.',
 ['Two point carts initially at x=−3,+3 m; instantaneous central collision.','out1/out2 are hypothetical collision solutions even when the initial carts do not approach.'],
 {...unitsTime,x1:'m',x2:'m',v1:'m/s',v2:'m/s',out1:'m/s',out2:'m/s',hit:'1',momentum:'kg·m/s',k:'J',k0:'J'},s=>{
 const total=s.m1+s.m2,centre=(s.m1*s.v1+s.m2*s.v2)/total;
 const out1=centre-s.e*(s.v1-centre),out2=centre-s.e*(s.v2-centre),closing=s.v1-s.v2,event=closing>0?6/closing:Infinity,t=time(s),hit=t>=event;
 const pos1=hit?-3+s.v1*event+out1*(t-event):-3+s.v1*t,pos2=hit?-3+s.v1*event+out2*(t-event):3+s.v2*t;
 const v1=hit?out1:s.v1,v2=hit?out2:s.v2;
 return {t,x1:pos1,x2:pos2,v1,v2,out1,out2,hit:+hit,momentum:total*centre,k:(s.m1*v1*v1+s.m2*v2*v2)/2,k0:(s.m1*s.v1*s.v1+s.m2*s.v2*s.v2)/2};
 },{domain:s=>positive(s,'m1','m2')});
ref('circular','Uniform circular motion and radial acceleration.',
 'Differentiate the radius-vector rotating at angular speed v/r; use F=m v²/r.',
 ['v is a positive speed; coordinates x,z form a horizontal plane.'],
 {...unitsTime,theta:'rad',x:'m',z:'m',acc:'m/s²',force:'N',period:'s'},s=>{
 const omega=s.v/s.radius,theta=omega*time(s),acc=s.v*omega;
 return {t:time(s),theta,x:s.radius*Math.cos(theta),z:s.radius*Math.sin(theta),acc,force:s.m*acc,period:2*pi/omega};
 },{domain:s=>positive(s,'radius','v','m')});
ref('lever','Torque balance around a massless fulcrum.',
 'Each vertical load has moment mg times horizontal arm; subtract right from left.',
 ['No rotational dynamics; balance is the mass-arm difference, not a boolean.'],
 {torque1:'N·m',torque2:'N·m',net:'N·m',balance:'kg·m'},s=>{
 const left=s.m1*s.l1,right=s.m2*s.l2;return {torque1:left*g,torque2:right*g,net:(left-right)*g,balance:left-right};
 });
ref('hooke','Static Hooke equilibrium kx=mg and elastic energy integral.',
 'Solve x=mg/k; integrate force kx from zero to extension.', ['Linear elastic region.'],
 {force:'N',extension:'m',energy:'J'},s=>{const force=s.m*g,extension=force/s.k;return {force,extension,energy:force*extension/2};},
 {domain:s=>positive(s,'k','m')});
ref('pendulum','Small-angle pendulum θ̈+(g/l)θ=0.',
 'Use the angular harmonic solution with zero initial angular speed; energy uses the quadratic small-angle potential.',
 ['Amplitude ≤15°; v is signed tangential velocity.'],
 {...unitsTime,theta:'rad',angle:'°',v:'m/s',period:'s',k:'J',u:'J'},s=>{
 const omega=Math.sqrt(g/s.length),a=rad(s.angle),phase=omega*time(s),theta=a*Math.cos(phase),v=-s.length*a*omega*Math.sin(phase);
 return {t:time(s),theta,angle:deg(theta),v,period:2*pi/omega,k:s.m*v*v/2,u:s.m*g*s.length*theta*theta/2};
 },{domain:s=>Math.abs(s.angle)>15?bad('model-limit','Small-angle curriculum explicitly limits the amplitude to 15 degrees.'):positive(s,'length','m')});
ref('damped','Damped linear oscillator with x(0)=A and v(0)=0.',
 'Combine the two characteristic-root exponentials into real displacement and its analytic derivative.',
 ['Underdamped only; mass=1 kg; input/output displacement cm converted to m for energy.'],
 {...unitsTime,x:'cm',v:'cm/s',acc:'cm/s²',envelope:'cm',energy:'J'},s=>{
 const w0=2*pi/s.period,wd=Math.sqrt(w0*w0-s.beta*s.beta),t=time(s),atten=Math.exp(-s.beta*t),cs=Math.cos(wd*t),sn=Math.sin(wd*t);
 const x=atten*(s.a*cs+s.a*s.beta/wd*sn);
 const v=atten*((s.a*s.beta-s.beta*s.a)*cs+(-s.a*wd-s.beta*s.a*s.beta/wd)*sn);
 return {t,x,v,acc:-2*s.beta*v-w0*w0*x,envelope:s.a*atten,energy:(v*v+w0*w0*x*x)*.5*.01*.01};
 },{domain:s=>s.beta<0?bad('outside','Negative damping is outside this passive model.'):s.beta>=2*pi/s.period?bad('model-limit','The declared underdamped solution requires beta < 2π/T.'):positive(s,'period')});
ref('resonance','Steady forced response from the harmonic transfer function.',
 'Take reciprocal complex impedance (ω0²−ω²)+i2βω; amplitude is modulus and lag is its argument.',
 ['Mass explicitly 1 kg; transient omitted.'],
 {...unitsTime,amplitude:'m',phase:'rad',x:'m',v:'m/s',acc:'m/s²'},s=>{
 const w=2*pi*s.f,w0=2*pi*s.f0,a=w0*w0-w*w,b=2*s.beta*w,den=a*a+b*b,real=s.force*a/den,imag=-s.force*b/den;
 const phase=w*time(s),x=real*Math.cos(phase)-imag*Math.sin(phase),v=-w*(real*Math.sin(phase)+imag*Math.cos(phase));
 return {t:time(s),amplitude:Math.hypot(real,imag),phase:Math.atan2(b,a),x,v,acc:-w*w*x};
 },{domain:s=>positive(s,'f','f0','beta')});
ref('interference','Superposition of two coherent harmonic waves.',
 'Add the cosine/sine phasor coefficients at the probe; amplitude is phasor magnitude rather than an independently copied fringe shortcut.',
 ['Two sources at x=±separation/2; second source phase offset in degrees; no geometric attenuation; amplitude cm.'],
 {...unitsTime,u1:'cm',u2:'cm',u:'cm',amplitude:'cm',delta:'m',lambda:'m'},s=>{
 const lambda=s.speed/s.f,r1=Math.hypot(s.probeX+s.separation/2,s.probeZ),r2=Math.hypot(s.probeX-s.separation/2,s.probeZ);
 const p1=-2*pi*r1/lambda,p2=-2*pi*r2/lambda+rad(s.phase),common=2*pi*s.f*time(s);
 const u1=s.a*Math.cos(common+p1),u2=s.a*Math.cos(common+p2),real=s.a*(Math.cos(p1)+Math.cos(p2)),imag=s.a*(Math.sin(p1)+Math.sin(p2));
 return {t:time(s),u1,u2,u:u1+u2,amplitude:Math.hypot(real,imag),delta:r2-r1,lambda};
 },{domain:s=>positive(s,'f','speed')});
ref('standing','Standing mode on a string with two fixed ends.',
 'Impose n half-wavelengths in length l; evaluate spatial sine times temporal cosine.',
 ['n integer≥1; amplitude of each travelling component is A; probe is limited to the right endpoint.'],
 {...unitsTime,x:'m',u:'cm',frequency:'Hz',lambda:'m',nodes:'1',antinodes:'1'},s=>{
 const n=s.mode,lambda=2*s.length/n,frequency=s.speed/lambda,x=Math.min(s.probeX,s.length);
 return {t:time(s),x,u:2*s.a*Math.sin(2*pi*x/lambda)*Math.cos(2*pi*frequency*time(s)),frequency,lambda,nodes:n+1,antinodes:n};
 },{domain:s=>!Number.isInteger(s.mode)||s.mode<1?bad('outside','Mode number must be a positive integer.'):positive(s,'length','speed')});
ref('sound','Harmonic pressure wave with sound speed 343 m/s.',
 'Period is inverse frequency; wavelength follows one period of propagation; pressure probe has initial sine phase.',
 ['Air speed fixed; amplitude and u are pressures in Pa.'],
 {...unitsTime,f:'Hz',amplitude:'Pa',lambda:'m',u:'Pa',period:'s'},s=>({t:time(s),f:s.f,amplitude:s.a,lambda:343/s.f,u:s.a*Math.sin(2*pi*s.f*time(s)),period:1/s.f}),
 {domain:s=>positive(s,'f')});
ref('series','Kirchhoff voltage law and common series current.',
 'Solve U=I(R1+R2), then allocate each voltage drop.', ['Two positive ideal resistors.'],
 {u:'V',resistance:'Ω',i:'A',i1:'A',i2:'A',u1:'V',u2:'V',p:'W'},s=>{
 const resistance=s.r1+s.r2,i=s.u/resistance;return {u:s.u,resistance,i,i1:i,i2:i,u1:s.u*s.r1/resistance,u2:s.u*s.r2/resistance,p:i*i*resistance};
 },{domain:s=>positive(s,'r1','r2')});
ref('parallel','Kirchhoff current law with equal branch voltage.',
 'Add branch conductances to obtain the equivalent resistance and current.', ['Two positive ideal resistors.'],
 {u:'V',resistance:'Ω',i:'A',i1:'A',i2:'A',u1:'V',u2:'V',p:'W'},s=>{
 const conductance=1/s.r1+1/s.r2,i1=s.u/s.r1,i2=s.u/s.r2;return {u:s.u,resistance:1/conductance,i:i1+i2,i1,i2,u1:s.u,u2:s.u,p:s.u*s.u*conductance};
 },{domain:s=>positive(s,'r1','r2')});
ref('joule','Electrical dissipation U²/R and calorimetric energy balance.',
 'Integrate constant heating power and divide heat by water heat capacity.',
 ['Water starts at 20°C; c=4180 J/(kg·K); no losses or phase transition.'],
 {...unitsTime,i:'A',power:'W',heat:'J',temp:'°C'},s=>{
 const i=s.u/s.r,power=i*i*s.r,heat=power*time(s);return {t:time(s),i,power,heat,temp:20+heat/(4180*s.m)};
 },{domain:s=>positive(s,'r','m')});
ref('magnetic','Magnetic force on a current-carrying straight conductor.',
 'Use signed y component of I l×B; magnitude is its absolute value.',
 ['B points +x; wire lies in xz; angle is in degrees.'],
 {force:'N',fy:'N',b:'T',i:'A'},s=>{
 const fy=s.i*s.length*s.b*Math.sin(rad(s.angle));return {force:Math.abs(fy),fy,b:s.b,i:s.i};
 });
ref('induction','Faraday law e=−N dΦ/dt and Ohm law.',
 'Differentiate flux BS cos(2πft) analytically; retain turns only in emf, since Φ is flux per turn.',
 ['Rigid loop rotates uniformly; inductance neglected.'],
 {...unitsTime,theta:'rad',flux:'Wb',emf:'V',i:'A',emax:'V'},s=>{
 const omega=2*pi*s.f,theta=omega*time(s),emax=s.turns*s.b*s.area*omega,emf=emax*Math.sin(theta);
 return {t:time(s),theta,flux:s.b*s.area*Math.cos(theta),emf,i:emf/s.r,emax};
 },{domain:s=>positive(s,'r','f')});
ref('decay','Independent decay probability with half-life T.',
 'The surviving expectation is N0×2^(−t/T); hazard is ln2/T, and activity is hazard times survivors.',
 ['Continuous expected counts; no claim that a single observed sample is fractional.'],
 {...unitsTime,N:'1',remaining:'1',decayed:'1',activity:'Bq',lambda:'s⁻¹'},s=>{
 const survival=2**(-time(s)/s.half),N=s.n0*survival,lambda=Math.log(2)/s.half;
 return {t:time(s),N,remaining:survival,decayed:s.n0*(1-survival),activity:lambda*N,lambda};
 },{domain:s=>positive(s,'half','n0')});
// Discovery models: independently work their physical observables in native output units.
ref('freefall','Free fall from rest in a user-selected constant gravity.',
 'Solve the ground-contact root, then integrate acceleration up to that event.',
 ['No air resistance; positive downward velocity.'],
 {...unitsTime,height:'m',v:'m/s',duration:'s'},s=>{
 const duration=Math.sqrt(2*s.h0/s.gravity),t=Math.min(time(s),duration);return {t,height:Math.max(0,s.h0-s.gravity*t*t/2),v:s.gravity*t,duration};
 },{domain:s=>positive(s,'h0','gravity')});
ref('friction','Static friction inequality plus kinetic Newton equation.',
 'At rest friction balances the applied force up to µmg; above threshold solve constant acceleration to x=5 m.',
 ['Applied force nonnegative; same static and kinetic coefficient.'],
 {...unitsTime,friction:'N',acc:'m/s²',duration:'s',x:'m',v:'m/s'},s=>{
 const threshold=s.mu*s.m*g,sliding=s.force>threshold,friction=sliding?threshold:s.force,acc=sliding?(s.force-threshold)/s.m:0;
 const duration=acc>0?Math.sqrt(10/acc):6,t=Math.min(time(s),duration);return {t,friction,acc,duration,x:acc*t*t/2,v:acc*t};
 },{domain:s=>s.force<0?bad('outside','This static-friction model assumes nonnegative applied force.'):positive(s,'m')});
ref('work','Work is force dot displacement; mean power is work per elapsed interval.',
 'Project the force on the displacement direction before multiplying by distance.', ['Constant force and straight displacement; signed work.'],
 {fx:'N',work:'J',power:'W'},s=>{const fx=s.force*Math.cos(rad(s.angle)),work=fx*s.distance;return {fx,work,power:work/s.seconds};},
 {domain:s=>positive(s,'seconds')});
ref('impulse','Impulse–momentum theorem with a rectangular force pulse.',
 'Integrate force over min(t,contact); integrate pre/post-contact velocity in separate intervals.',
 ['Initial position zero; after contact force vanishes.'],
 {impulse:'N·s',momentum:'kg·m/s',v:'m/s',x:'m',activeForce:'N'},s=>{
 const t=time(s),tc=Math.min(t,s.contact),acc=s.force/s.m,v=s.v0+acc*tc,x=s.v0*tc+acc*tc*tc/2+v*(t-tc);
 return {impulse:s.force*tc,momentum:s.m*s.v0+s.force*tc,v,x,activeForce:t<s.contact?s.force:0};
 },{domain:s=>positive(s,'m','contact')});
ref('buoyancy','Archimedes force equals displaced fluid weight.',
 'Convert litres to cubic metres, compute displaced weight, and solve vertical static support balance.',
 ['Fraction specifies externally maintained submersion; support can be negative.'],
 {submerged:'m³',buoyant:'N',weight:'N',support:'N'},s=>{
 const submerged=s.volume*.001*s.fraction,buoyant=s.density*submerged*g,weight=s.m*g;return {submerged,buoyant,weight,support:weight-buoyant};
 });
ref('pressure','Hydrostatic equilibrium dp/dh=ρg.',
 'Integrate through a homogeneous fluid and add the absolute surface pressure; convert Pa to kPa.',
 ['Gauge and absolute pressures are different outputs.'], {gauge:'kPa',pressure:'kPa'},s=>{
 const gauge=s.density*g*s.depth*.001;return {gauge,pressure:s.surface+gauge};
 });
ref('reflection','Specular reflection at a plane surface.',
 'Equal angles relative to the normal; the reported angle between directions is 2i.',
 ['Angles measured from normal, not mirror plane.'], {reflected:'°',between:'°'},s=>({reflected:s.angle,between:2*s.angle}));
function snell(s){
 const sinI=Math.sin(rad(s.angle)),sinR=s.n1/s.n2*sinI,reflection=sinR>1+1e-12;
 return {refracted:reflection?null:deg(Math.asin(Math.min(1,sinR))),critical:s.n1>s.n2?deg(Math.asin(s.n2/s.n1)):null,tir:+reflection,ratio:s.angle===0||reflection?null:s.n2/s.n1,reflected:s.angle};
}
for(const id of ['refraction','tir'])ref(id,'Snell law and the critical-angle condition.',
 'Solve sin(r)=n1 sin(i)/n2; classify total internal reflection when no real transmitted angle exists.',
 ['Exactly critical incidence is a grazing refracted ray; sin(i)/sin(r) is undefined at normal incidence.'],
 {refracted:'°',critical:'°',tir:'1',ratio:'1',reflected:'°'},snell,{domain:s=>positive(s,'n1','n2')});
function gaussianImage(s){
 const atFocus=Math.abs(s.distance-s.focal)<1e-9;
 if(atFocus)return {image:null,magnification:null,imageHeight:null,infinite:1};
 const inverseImage=1/s.focal-1/s.distance,image=1/inverseImage,magnification=-image/s.distance;
 return {image,magnification,imageHeight:magnification*s.height,infinite:0};
}
for(const id of ['lens','mirror'])ref(id,'Gaussian paraxial image equation and transverse magnification.',
 'Subtract object vergence from optical power; invert the remaining vergence; magnification=−image/object.',
 ['Signed focal length; all lengths cm; at object distance=focal length the image is at infinity.','UI normalizes focal=0 before use; the unnormalized singular state is outside this reference.'],
 {image:'cm',magnification:'1',imageHeight:'cm',infinite:'1'},gaussianImage,
 {domain:s=>s.focal===0||s.distance===0?bad('undefined','Zero focal length or object distance is singular in the paraxial model.'):nonnegativeTime(s),atol:1e-8});
ref('prism','Minimum deviation of an equilateral optical path through a prism.',
 'At symmetry r1=r2=A/2; Snell gives i=asin(n sin(A/2)); deviation=2i−A for each colour.',
 ['Red and violet are separate minimum-deviation paths with n±dispersion/2.'],
 {red:'°',violet:'°',spread:'°'},s=>{
 const red=2*deg(Math.asin((s.index-s.dispersion/2)*Math.sin(rad(s.angle/2))))-s.angle;
 const violet=2*deg(Math.asin((s.index+s.dispersion/2)*Math.sin(rad(s.angle/2))))-s.angle;
 return {red,violet,spread:violet-red};
 },{domain:s=>(s.index+s.dispersion/2)*Math.sin(rad(s.angle/2))>1?bad('undefined','No real symmetric transmitted minimum-deviation path.'):nonnegativeTime(s)});
ref('young','Fraunhofer two-slit interference with equal coherent fields.',
 'Compute path-phase difference 2πax/(λD); normalized intensity=(1+cos phase)/2; fringe period λD/a.',
 ['λ nm, slit separation mm, screen m, probe mm; no single-slit envelope.'],
 {spacing:'mm',intensity:'1'},s=>{
 const spacing=s.wavelength*1e-9*s.screen/(s.slits*.001)*1000,phase=2*pi*s.probe/spacing;
 return {spacing,intensity:(1+Math.cos(phase))/2};
 },{domain:s=>positive(s,'wavelength','screen','slits'),atol:1e-9});
ref('diffraction','Fraunhofer diffraction from a uniform slit aperture.',
 'Integrate the aperture phase to a sinc amplitude; square it and use its first zero at β=π.',
 ['Same distance/unit conventions as Young; limit sinβ/β=1 at centre.'],
 {firstMin:'mm',intensity:'1'},s=>{
 const firstMin=s.wavelength*1e-9*s.screen/(s.width*.001)*1000,beta=pi*s.probe/firstMin;
 const amplitude=Math.abs(beta)<1e-8?1-beta*beta/6:Math.sin(beta)/beta;
 return {firstMin,intensity:amplitude*amplitude};
 },{domain:s=>positive(s,'wavelength','screen','width')});
ref('polarization','Malus intensity law for an ideal analyser.',
 'Project the incident electric field on the analyser direction and square the normalized projection.',
 ['Incident light already linearly polarized; I0 refers to incident intensity on analyser.'],
 {fraction:'1',intensity:'W/m²'},s=>{const projection=Math.cos(rad(s.angle)),fraction=projection*projection;return {fraction,intensity:s.intensity0*fraction};});
ref('thermalexpansion','Linear thermal strain Δl/l=αΔT.',
 'Convert coefficient from micro per kelvin to inverse kelvin; reference temperature is 20°C.',
 ['α constant, uniform temperature.'], {extension:'mm',lengthNow:'m'},s=>{
 const increment=s.length*s.alpha*1e-6*(s.temp-20);return {extension:increment*1e3,lengthNow:s.length+increment};
 });
ref('calorimetry','Conservation of heat between two insulated water portions.',
 'Total thermal energy relative to zero Celsius divided by total heat capacity yields equilibrium temperature.',
 ['Equal water heat capacity 4180 J/(kg·K); no calorimeter, losses or phase transitions.'],
 {finalTemp:'°C',released:'J',absorbed:'J'},s=>{
 const totalC=4180*(s.mHot+s.mCold),finalTemp=(4180*s.mHot*s.hot+4180*s.mCold*s.cold)/totalC;
 return {finalTemp,released:4180*s.mHot*(s.hot-finalTemp),absorbed:4180*s.mCold*(finalTemp-s.cold)};
 },{domain:s=>positive(s,'mHot','mCold')});
ref('phasechange','Energy balance across ice warming, fusion, and liquid-water warming.',
 'Compare supplied specific enthalpy with 2100(0−Tinitial) and latent heat 334000 J/kg; cap at water 80°C.',
 ['Initial material is subzero ice; constant heater power; no heat losses or boiling.'],
 {...unitsTime,heat:'J',temp:'°C',melted:'1',duration:'s'},s=>{
 const ice=2100*(-s.initial),fusion=334000,water=4180*80,duration=s.mass*(ice+fusion+water)/s.power,t=Math.min(time(s),duration),heat=s.power*t,e=heat/s.mass;
 const temp=e<ice?s.initial+e/2100:e<ice+fusion?0:(e-ice-fusion)/4180;
 return {t,heat,temp,melted:Math.max(0,Math.min(1,(e-ice)/fusion)),duration};
 },{domain:s=>s.initial>0?bad('outside','Initial phase is assumed to be subzero ice.'):positive(s,'mass','power'),atol:1e-8});
ref('heattransfer','Fourier conduction through a homogeneous bar.',
 'Thermal resistance l/(kA) gives power ΔT/Rth; constant power integrated over time gives heat.',
 ['Steady 1D gradient; area input cm².'], {gradient:'K/m',power:'W',heat:'J'},s=>{
 const gradient=(s.hot-s.cold)/s.length,power=(s.hot-s.cold)/(s.length/(s.conductivity*s.area*1e-4));return {gradient,power,heat:power*time(s)};
 },{domain:s=>positive(s,'length','conductivity','area')});
ref('isobaric','Ideal gas at fixed pressure and boundary work ∫p dV.',
 'V=nRT/p in litres when p is kPa; work nR(T−300 K).', ['Pressure fixed per run; initial temperature 300 K.'],
 {volume:'L',ratio:'L/K',work:'J'},s=>({volume:s.n*R*s.temp/s.pressure,ratio:s.n*R/s.pressure,work:s.n*R*(s.temp-300)}),
 {domain:s=>positive(s,'pressure','temp','n')});
ref('isochoric','Ideal gas in a rigid vessel.',
 'p=nRT/V; boundary work is zero since dV=0.', ['Volume L, pressure output kPa.'],
 {pressure:'kPa',ratio:'kPa/K',work:'J'},s=>({pressure:s.n*R*s.temp/s.volume,ratio:s.n*R/s.volume,work:0}),
 {domain:s=>positive(s,'volume','temp','n')});
ref('firstlaw','First law using positive work done on the gas.',
 'ΔU=Q+Won; add initial monatomic energy 3nR×300/2 and invert U=3nRT/2.',
 ['Ideal monatomic gas; initial T=300 K; do not infer a process path from the exchange totals.'],
 {deltaU:'J',internal:'J',temp:'K'},s=>{
 const deltaU=s.heat+s.workOn,capacity=1.5*s.n*R,temp=300+deltaU/capacity;return {deltaU,internal:capacity*temp,temp};
 },{domain:s=>s.n<=0?bad('undefined','Nonpositive amount of gas.'):300+(s.heat+s.workOn)/(1.5*s.n*R)<=0?bad('outside','The specified energy extraction gives nonpositive absolute temperature.'):nonnegativeTime(s)});
ref('kinetic','Equipartition for ideal-gas translational energy.',
 'Three translational degrees give mean energy=3kBT/2 and v_rms=√(3RT/M).',
 ['Molar mass input g/mol; individual mean energy is J.'], {rms:'m/s',energy:'J'},s=>({rms:Math.sqrt(3*R*s.temp/(s.molar*.001)),energy:3*kB*s.temp/2}),
 {domain:s=>positive(s,'temp','molar'),atol:1e-30});
ref('resistivity','Uniform-wire resistance ρl/A and Joule power.',
 'Convert µΩ·m and mm² consistently; their factors cancel in the resistance ratio.',
 ['Temperature independent resistivity; voltage DC.'], {resistance:'Ω',i:'A',power:'W'},s=>{
 const rho=s.rho*1e-6,area=s.area*1e-6,resistance=rho*s.length/area,i=s.u/resistance;return {resistance,i,power:i*i*resistance};
 },{domain:s=>positive(s,'rho','area','length')});
ref('internalresistance','Series loop with a source emf and internal resistance.',
 'Solve I(E,R+r); terminal voltage is E−Ir; dissipation partitions into I²R and I²r.',
 ['Steady DC and a purely resistive load.'], {i:'A',terminal:'V',power:'W',loss:'W'},s=>{
 const i=s.emf/(s.internalR+s.load);return {i,terminal:s.emf-i*s.internalR,power:i*i*s.load,loss:i*i*s.internalR};
 },{domain:s=>positive(s,'load','internalR')});
ref('bridge','Open-circuit Wheatstone bridge node potentials.',
 'Solve each independent series branch current, then multiply by its lower resistance.',
 ['Infinite resistance voltmeter; difference is left midpoint minus right midpoint.'], {va:'V',vb:'V',difference:'V'},s=>{
 const leftI=s.u/(s.r1+s.r2),rightI=s.u/(s.r3+s.r4),va=leftI*s.r2,vb=rightI*s.r4;return {va,vb,difference:va-vb};
 },{domain:s=>positive(s,'r1','r2','r3','r4')});
ref('solenoid','Ampere law for a long air-core solenoid.',
 'Integrate B over axial length: Bl=µ0NI, with µ0=4π×10⁻⁷ H/m.',
 ['Long-solenoid approximation; signed current determines axial field.'], {density:'m⁻¹',b:'T'},s=>({density:s.turns/s.length,b:(4*pi*1e-7)*s.turns*s.i/s.length}),
 {domain:s=>positive(s,'length')});
ref('lorentz','Lorentz force in a uniform B along +z; constant kinetic energy.',
 'Solve the coupled velocity equations vx′=ωvy, vy′=−ωvx; integrate the circular velocity. Use the straight-line limit for q=0.',
 ['Initial velocity +x; q µC, mass mg, B tesla; both q and mass convert by 10⁻⁶ to SI.'],
 {radius:'m',force:'N',x:'m',y:'m',theta:'rad',vx:'m/s',vy:'m/s'},s=>{
 const q=s.charge*1e-6,m=s.mass*1e-6,omega=q*s.b/m,t=time(s),theta=omega*t;
 if(q===0)return {radius:null,force:0,x:s.speed*t,y:0,theta:0,vx:s.speed,vy:0};
 const sinc=Math.abs(theta)<1e-6?1-theta*theta/6:Math.sin(theta)/theta;
 return {radius:m*s.speed/(Math.abs(q)*s.b),force:Math.abs(q)*s.speed*s.b,x:s.speed*t*sinc,y:-2*s.speed/omega*Math.sin(theta/2)**2,theta,vx:s.speed*Math.cos(theta),vy:-s.speed*Math.sin(theta)};
 },{domain:s=>positive(s,'mass','b'),atol:1e-8});
ref('transformer','Ideal transformer flux linkage ratio and power balance.',
 'Secondary RMS voltage scales with turns ratio; load determines secondary current, input power then determines primary current.',
 ['Ideal lossless AC transformer; all displayed current/voltage values RMS; load resistive.'],
 {u2:'V',i2:'A',i1:'A',power:'W'},s=>{
 const ratio=s.n2/s.n1,u2=ratio*s.u1,i2=u2/s.load,power=u2*i2;return {u2,i2,i1:ratio*i2,power};
 },{domain:s=>positive(s,'n1','n2','load','u1')});
ref('ac','Sinusoidal voltage on a resistor.',
 'Instantaneous current is in phase with voltage; cycle mean cos² is 1/2, giving RMS and mean power.',
 ['Phase input degrees; frequency Hz; purely resistive load.'], {voltage:'V',i:'A',rms:'V',power:'W'},s=>{
 const voltage=s.u0*Math.cos(2*pi*s.f*time(s)+rad(s.phase)),rms=s.u0/Math.sqrt(2);return {voltage,i:voltage/s.resistance,rms,power:rms*rms/s.resistance};
 },{domain:s=>positive(s,'resistance','f')});
// First fifteen Atlas models: vector decomposition, constrained motion and gravity.
ref('vector_sum','Euclidean addition of two force vectors.',
 'Resolve the second vector into x,y components; norm the component sum.', ['First force aligned +x.'],
 {fx:'N',fy:'N',result:'N'},s=>{const fx=s.force+s.second*Math.cos(rad(s.angle)),fy=s.second*Math.sin(rad(s.angle));return {fx,fy,result:Math.hypot(fx,fy)};});
ref('vector_components','Orthogonal force projection.',
 'Dot the force with Cartesian unit vectors; its norm remains the controlled magnitude.', ['Angle measured from +x.'],
 {fx:'N',fy:'N',result:'N'},s=>({fx:s.force*Math.cos(rad(s.angle)),fy:s.force*Math.sin(rad(s.angle)),result:s.force}));
ref('relative_motion','Galilean translation between uniformly moving frames.',
 'Position in moving coordinates is x−x_frame, whose derivative is v−v_frame.', ['Frame and object start at a common origin.'],
 {relative:'m/s',x:'m',frameX:'m'},s=>({relative:s.speed-s.frame,x:s.speed*time(s),frameX:s.frame*time(s)}));
ref('average_speed','Mean speed equals total path length divided by total duration.',
 'Compute each equal-distance leg time separately before dividing 2d by their sum.', ['Both speeds positive; equal distances, not equal times.'],
 {average:'m/s',t1:'s',t2:'s'},s=>{const t1=s.distance/s.v1,t2=s.distance/s.v2;return {average:2*s.distance/(t1+t2),t1,t2};},
 {domain:s=>positive(s,'v1','v2','distance')});
ref('braking','Constant deceleration until the first zero velocity.',
 'Stop time=v0/a; integrate the positive velocity segment, then hold position after stopping.', ['No reversal after brake stop.'],
 {stopDistance:'m',stopTime:'s',v:'m/s',x:'m'},s=>{
 const stopTime=s.speed/s.deceleration,t=Math.min(time(s),stopTime),v=time(s)<stopTime?s.speed-s.deceleration*t:0;
 return {stopDistance:s.speed*stopTime/2,stopTime,v,x:s.speed*t-s.deceleration*t*t/2};
 },{domain:s=>positive(s,'deceleration','speed')});
ref('drag_fall','Linear drag m v′=mg−bv from rest.',
 'Characteristic relaxation time m/b and terminal speed mg/b give velocity; integrate that relaxation exactly for distance.',
 ['Downward positive; no ground; linear drag idealization.'], {v:'m/s',terminal:'m/s',net:'N',x:'m'},s=>{
 const tau=s.mass/s.drag,z=time(s)/tau,terminal=g*tau,fraction=-Math.expm1(-z),v=terminal*fraction;
 const displacementFactor=Math.abs(z)<1e-4?z*z/2-z**3/6+z**4/24-z**5/120:z+Math.expm1(-z);
 return {v,terminal,net:s.mass*g*Math.exp(-z),x:g*tau*tau*displacementFactor};
 },{domain:s=>positive(s,'mass','drag'),atol:1e-8});
ref('atwood','Coupled Newton equations for a massless ideal rope.',
 'Solve T−m1g=m1a and m2g−T=m2a simultaneously.', ['Positive acceleration means mass2 goes down.'],
 {acc:'m/s²',tension:'N',difference:'N'},s=>{
 const difference=(s.m2-s.m1)*g,acc=difference/(s.m1+s.m2),tension=s.m1*(g+acc);return {acc,tension,difference};
 },{domain:s=>positive(s,'m1','m2')});
ref('pulley','Ideal mechanical advantage from n supporting rope segments.',
 'Balance nF=mg; inextensible rope requires pulled distance n times lift; work remains mgh.',
 ['Number of supporting branches is an integer.'], {pull:'N',rope:'m',work:'J'},s=>{
 const pull=s.mass*g/s.branches,rope=s.branches*s.lift;return {pull,rope,work:pull*rope};
 },{domain:s=>!Number.isInteger(s.branches)||s.branches<1?bad('outside','Supporting branch count is a positive integer.'):positive(s,'mass')});
ref('elevator','Vertical Newton equation N−mg=ma.',
 'Solve support force directly; divide by true weight for the scale ratio.', ['Contact with floor requires a≥−g.'],
 {normal:'N',weight:'N',ratio:'1'},s=>{const weight=s.mass*g,normal=weight+s.mass*s.acc;return {normal,weight,ratio:normal/weight};},
 {domain:s=>s.acc< -g?bad('model-limit','A floor cannot exert a negative compressive normal force.'):positive(s,'mass')});
ref('banked_turn','Frictionless banking force balance.',
 'Vertical N cosθ=mg and radial N sinθ=mv²/r give a=g tanθ and N/mg=secθ.',
 ['No friction; angle below 90 degrees; stated curriculum limit is 70 degrees.'],
 {speed:'m/s',acc:'m/s²',ratio:'1'},s=>{
 const theta=rad(s.angle),acc=g*Math.tan(theta);return {speed:Math.sqrt(acc*s.radius),acc,ratio:1/Math.cos(theta)};
 },{domain:s=>s.angle<0||s.angle>70?bad('model-limit','The declared banking angle range is 0..70 degrees.'):positive(s,'radius')});
ref('vertical_circle','Radial force balance at the top of a vertical circular path.',
 'T+mg=mv²/r; if the required tension would be negative a rope goes slack.',
 ['For slack cases, tension=0 and taut=0 are diagnostics; the prescribed circular trajectory is no longer physically attainable.'],
 {tension:'N',minimum:'m/s',taut:'1'},s=>{
 const required=s.mass*(s.speed*s.speed/s.radius-g);return {tension:required>=0?required:0,minimum:Math.sqrt(g*s.radius),taut:+(s.speed*s.speed>=g*s.radius)};
 },{domain:s=>positive(s,'mass','radius')});
ref('gravitational_force','Newton universal gravitation for spherical masses.',
 'Compute force in SI from CODATA G, then express it in µN; acceleration of mass2 is force/m2 in nm/s².',
 ['Separated spherical bodies; distance is centre-to-centre.'], {force:'µN',acc:'nm/s²',ratio:'µN·m²'},s=>{
 const newtons=G*s.m1*s.m2/(s.distance*s.distance);return {force:newtons*1e6,acc:newtons/s.m2*1e9,ratio:G*s.m1*s.m2*1e6};
 },{domain:s=>positive(s,'m1','m2','distance'),atol:1e-12});
ref('orbit','Circular Newtonian orbit: gravitational and centripetal accelerations equal.',
 'a=GM/r², v=√(ar), period=circumference/v; convert raw outputs to km/s and minutes.',
 ['Planet mass unit 10²⁴ kg; radius input km; satellite mass negligible.'],
 {speed:'km/s',period:'phút',acc:'m/s²'},s=>{
 const r=s.radius*1000,mass=s.planet*1e24,acc=G*mass/(r*r),v=Math.sqrt(acc*r);return {speed:v/1000,period:(2*pi*r/v)/60,acc};
 },{domain:s=>positive(s,'radius','planet')});
ref('escape_speed','Zero asymptotic total energy in an inverse-square gravitational field.',
 'Set v_escape²/2−GM/R=0; compare with circular speed from radial force balance.',
 ['No atmosphere, rotation or additional celestial bodies; speed outputs km/s.'],
 {escape:'km/s',circular:'km/s',ratio:'1'},s=>{
 const r=s.radius*1000,mass=s.planet*1e24,circular=Math.sqrt(G*mass/r)/1000,escape=Math.sqrt(2*G*mass/r)/1000;return {escape,circular,ratio:escape/circular};
 },{domain:s=>positive(s,'radius','planet')});
ref('kepler','Kepler third law in the explicitly normalized solar units.',
 'Set the reference 1 AU orbit period to 1 year, then solve T²/a³=1.',
 ['Normalized solar convention, not a precision ephemeris; no unspecified solar-mass or year-length rounding is inferred.'],
 {period:'năm',square:'năm²',cube:'AU³'},s=>{
 const cube=s.axis*s.axis*s.axis,period=Math.sqrt(cube);return {period,square:period*period,cube};
 },{domain:s=>positive(s,'axis')});
