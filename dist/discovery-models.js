const G=9.81,R=8.314462618,kB=1.380649e-23,rad=a=>a*Math.PI/180,deg=a=>a*180/Math.PI;
export function optical(s){const u=s.n1*Math.sin(rad(s.angle))/s.n2,tir=u>1+1e-12,refracted=tir?null:deg(Math.asin(Math.min(1,u))),critical=s.n1>s.n2?deg(Math.asin(s.n2/s.n1)):null;return {refracted,critical,tir:tir?1:0,ratio:s.angle===0||tir?null:s.n2/s.n1,reflected:s.angle};}
export function fringe(s,x=s.probe,single=false){const gap=single?s.width:s.slits,spacing=s.wavelength*1e-9*s.screen/(gap*1e-3)*1000,beta=Math.PI*x/spacing;return single?(Math.abs(beta)<1e-10?1:(Math.sin(beta)/beta)**2):Math.cos(beta)**2;}
export function evaluateDiscovery(id,s){const t=s.t||0;let q;switch(id){
case 'freefall':{const duration=Math.sqrt(2*s.h0/s.gravity),tt=Math.min(t,duration);q={t:tt,height:Math.max(0,s.h0-.5*s.gravity*tt*tt),v:s.gravity*tt,duration};break;}
case 'friction':{const friction=Math.min(s.force,s.mu*s.m*G),acc=(s.force-friction)/s.m,duration=acc>0?Math.sqrt(10/acc):6,tt=Math.min(t,duration);q={t:tt,friction,acc,x:.5*acc*tt*tt,v:acc*tt,duration};break;}
case 'work':{const fx=s.force*Math.cos(rad(s.angle)),work=fx*s.distance;q={fx,work,power:work/s.seconds};break;}
case 'impulse':{const contact=Math.min(t,s.contact),impulse=s.force*contact,v=s.v0+impulse/s.m,x=s.v0*contact+.5*s.force/s.m*contact**2+v*(t-contact);q={impulse,momentum:s.m*v,v,x,activeForce:t<s.contact?s.force:0};break;}
case 'buoyancy':{const submerged=s.volume/1000*s.fraction,buoyant=s.density*G*submerged,weight=s.m*G;q={submerged,buoyant,weight,support:weight-buoyant};break;}
case 'pressure':{const gauge=s.density*G*s.depth/1000;q={gauge,pressure:s.surface+gauge};break;}
case 'reflection':q={reflected:s.angle,between:2*s.angle};break;
case 'refraction':case 'tir':q=optical(s);break;
case 'lens':case 'mirror':{const den=s.distance-s.focal,image=Math.abs(den)<1e-9?null:s.focal*s.distance/den,magnification=image===null?null:-image/s.distance;q={image,magnification,imageHeight:magnification===null?null:s.height*magnification,infinite:image===null?1:0};break;}
case 'prism':{const delta=n=>deg(2*Math.asin(n*Math.sin(rad(s.angle/2))))-s.angle,red=delta(s.index-s.dispersion/2),violet=delta(s.index+s.dispersion/2);q={red,violet,spread:violet-red};break;}
case 'young':q={spacing:s.wavelength*1e-9*s.screen/(s.slits*1e-3)*1000,intensity:fringe(s)};break;
case 'diffraction':q={firstMin:s.wavelength*1e-9*s.screen/(s.width*1e-3)*1000,intensity:fringe(s,s.probe,true)};break;
case 'polarization':{const fraction=Math.cos(rad(s.angle))**2;q={fraction,intensity:s.intensity0*fraction};break;}
case 'thermalexpansion':{const extension=s.length*s.alpha*1e-6*(s.temp-20);q={extension:extension*1000,lengthNow:s.length+extension};break;}
case 'calorimetry':{const finalTemp=(s.mHot*s.hot+s.mCold*s.cold)/(s.mHot+s.mCold),released=s.mHot*4180*(s.hot-finalTemp),absorbed=s.mCold*4180*(finalTemp-s.cold);q={finalTemp,released,absorbed};break;}
case 'phasechange':{const qWarm=-s.initial*s.mass*2100,qMelt=s.mass*334000,duration=(qWarm+qMelt+s.mass*4180*80)/s.power,tt=Math.min(t,duration),heat=s.power*tt,temp=heat<qWarm?s.initial+heat/(s.mass*2100):heat<qWarm+qMelt?0:(heat-qWarm-qMelt)/(s.mass*4180),melted=Math.max(0,Math.min(1,(heat-qWarm)/qMelt));q={t:tt,heat,temp,melted,duration};break;}
case 'heattransfer':{const gradient=(s.hot-s.cold)/s.length,power=s.conductivity*s.area*1e-4*gradient;q={gradient,power,heat:power*t};break;}
case 'isobaric':{const volume=s.n*R*s.temp/s.pressure;q={volume,ratio:volume/s.temp,work:s.n*R*(s.temp-300)};break;}
case 'isochoric':{const pressure=s.n*R*s.temp/s.volume;q={pressure,ratio:pressure/s.temp,work:0};break;}
case 'firstlaw':{const deltaU=s.heat+s.workOn,initial=1.5*s.n*R*300,internal=initial+deltaU;q={deltaU,internal,temp:internal/(1.5*s.n*R)};break;}
case 'kinetic':q={rms:Math.sqrt(3*R*s.temp/(s.molar/1000)),energy:1.5*kB*s.temp};break;
case 'resistivity':{const resistance=s.rho*s.length/s.area,i=s.u/resistance;q={resistance,i,power:s.u*i};break;}
case 'internalresistance':{const i=s.emf/(s.load+s.internalR),terminal=i*s.load;q={i,terminal,power:i*i*s.load,loss:i*i*s.internalR};break;}
case 'bridge':{const va=s.u*s.r2/(s.r1+s.r2),vb=s.u*s.r4/(s.r3+s.r4);q={va,vb,difference:va-vb};break;}
case 'solenoid':q={density:s.turns/s.length,b:4*Math.PI*1e-7*s.turns*s.i/s.length};break;
case 'lorentz':{const charge=s.charge*1e-6,mass=s.mass*1e-6,omega=charge*s.b/mass,theta=omega*t,zero=Math.abs(charge)<1e-15,radius=zero?null:mass*s.speed/(Math.abs(charge)*s.b),x=zero?s.speed*t:s.speed/omega*Math.sin(theta),y=zero?0:s.speed/omega*(Math.cos(theta)-1);q={radius,force:Math.abs(charge)*s.speed*s.b,x,y,theta,vx:s.speed*Math.cos(theta),vy:-s.speed*Math.sin(theta)};break;}
case 'transformer':{const u2=s.u1*s.n2/s.n1,i2=u2/s.load,power=u2*i2,i1=power/s.u1;q={u2,i2,i1,power};break;}
case 'ac':{const voltage=s.u0*Math.cos(2*Math.PI*s.f*t+rad(s.phase));q={voltage,i:voltage/s.resistance,rms:s.u0/Math.sqrt(2),power:s.u0*s.u0/(2*s.resistance)};break;}
default:throw Error('Unknown discovery model '+id);
}return {...s,t,...q};}
