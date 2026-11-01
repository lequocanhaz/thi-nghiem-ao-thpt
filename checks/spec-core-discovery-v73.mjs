import assert from 'node:assert/strict';
import {experiments} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
// Independent analytical identities in SI; no calls to the production physics helpers.
const G=9.81,R=8.314462618,k=1.380649e-23,rad=x=>x*Math.PI/180;
let count=0;const records=[];
function eq(a,b,label){assert.ok(Number.isFinite(a)&&Number.isFinite(b),label+' finite');assert.ok(Math.abs(a-b)<=(b===0?1e-12:1e-9*Math.abs(b)+1e-30),`${label}: ${a} != ${b}`);count++;}
for(const e of experiments.slice(30,60)){
 let local=0;
 for(const variant of ['default','low','high']){
 const s=Object.fromEntries(e.params.map(p=>[p.key,variant==='default'?p.value:variant==='low'?p.min:p.max]));
 // The declared terminal-time models stop on contact, while impulse is observed
 // both during and after contact. These are valid physical times, not UI pixels.
 if(e.id==='freefall')s.t=Math.sqrt(2*s.h0/s.gravity)*({default:.5,low:0,high:1}[variant]);
 if(e.id==='phasechange')s.t=({default:0,low:1,high:2}[variant])===0?0:variant==='low'?(-s.initial*s.mass*2100+s.mass*334000*.5)/s.power:(-s.initial*s.mass*2100+s.mass*334000+s.mass*4180*40)/s.power;
 if(e.id==='impulse')s.t=variant==='low'?s.contact/2:2*s.contact;
 if(e.id==='friction')s.t=0;
 const d=evaluate(e.id,s);assert.ok(d,e.id);
 const q=(a,b,label)=>{eq(a,b,`${e.id}/${variant}/${label}`);local++;};
 switch(e.id){
 case 'freefall':q(2*(s.h0-d.height),s.gravity*d.t*d.t,'fall distance');q(d.v*d.v,2*s.gravity*(s.h0-d.height),'energy per mass');break;
 case 'friction':q(d.friction+ s.m*d.acc,s.force,'force balance');q(d.acc,Math.max(0,s.force/s.m-s.mu*G),'static threshold');break;
 case 'work':q(d.work,s.force*s.distance*Math.cos(rad(s.angle)),'scalar work');q(d.power*s.seconds,d.work,'average power');break;
 case 'impulse':q(d.momentum-s.m*s.v0,s.force*Math.min(s.t,s.contact),'impulse momentum');q(d.x,s.v0*s.t+s.force/s.m*(Math.min(s.t,s.contact)*s.t-.5*Math.min(s.t,s.contact)**2),'piecewise trajectory');break;
 case 'buoyancy':q(d.buoyant/G,s.density*s.volume*.001*s.fraction,'displaced mass');q(d.support+d.buoyant,d.weight,'support equilibrium');break;
 case 'pressure':q((d.pressure-s.surface)*1000,s.density*G*s.depth,'hydrostatic Pa');q(d.gauge,d.pressure-s.surface,'gauge definition');break;
 case 'reflection':q(d.reflected,s.angle,'reflection law');q(d.between,2*s.angle,'included angle');break;
 case 'refraction':case 'tir':{
 const beyond=s.n1*Math.sin(rad(s.angle))>s.n2+1e-12;
 assert.equal(d.tir,beyond?1:0);local++;count++;
 if(beyond)assert.equal(d.refracted,null);else q(s.n2*Math.sin(rad(d.refracted)),s.n1*Math.sin(rad(s.angle)),'Snell invariant');
 if(s.n1>s.n2)q(Math.sin(rad(d.critical)),s.n2/s.n1,'critical boundary');break;}
 case 'lens':case 'mirror':
 if(s.distance===s.focal){assert.equal(d.image,null);assert.equal(d.infinite,1);local++;count++;}
 else {q(1/s.distance+1/d.image,1/s.focal,'signed imaging equation');q(d.imageHeight/s.height,-d.image/s.distance,'magnification');}break;
 case 'prism':q(Math.sin(rad((d.red+s.angle)/2))/Math.sin(rad(s.angle/2)),s.index-s.dispersion/2,'red minimum deviation');q(Math.sin(rad((d.violet+s.angle)/2))/Math.sin(rad(s.angle/2)),s.index+s.dispersion/2,'violet minimum deviation');assert.ok(d.spread>=0);break;
 case 'young':q(d.spacing*.001*s.slits*.001,s.wavelength*1e-9*s.screen,'fringe SI spacing');q(d.intensity,(1+Math.cos(2*Math.PI*(s.probe*.001)*(s.slits*.001)/(s.wavelength*1e-9*s.screen)))/2,'interference normalized');break;
 case 'diffraction':{q(d.firstMin*.001*s.width*.001,s.wavelength*1e-9*s.screen,'first zero SI');const z=Math.PI*(s.probe*.001)*(s.width*.001)/(s.wavelength*1e-9*s.screen);q(d.intensity,z===0?1:(Math.sin(z)/z)**2,'normalized sinc');break;}
 case 'polarization':q(d.intensity,s.intensity0*(1+Math.cos(2*rad(s.angle)))/2,'Malus');q(d.fraction,d.intensity/s.intensity0,'transmission');break;
 case 'thermalexpansion':q((d.lengthNow-s.length)/s.length,s.alpha*1e-6*(s.temp-20),'relative expansion');q(d.extension*.001,d.lengthNow-s.length,'mm conversion');break;
 case 'calorimetry':q(s.mHot*(s.hot-d.finalTemp),s.mCold*(d.finalTemp-s.cold),'isolated heat balance');q(d.released,d.absorbed,'equal heat J');break;
 case 'phasechange':{const h=d.heat/s.mass;q(d.heat,s.power*d.t,'delivered heat');if(h< -s.initial*2100)q(d.temp,s.initial+h/2100,'ice warming');else if(h< -s.initial*2100+334000){q(d.temp,0,'latent plateau');q(d.melted,(h+s.initial*2100)/334000,'melt fraction');}else q(d.temp,(h+s.initial*2100-334000)/4180,'liquid warming');break;}
 case 'heattransfer':q(d.power*s.length,s.conductivity*s.area*1e-4*(s.hot-s.cold),'Fourier SI');q(d.heat,d.power*s.t,'constant heat flow');break;
 case 'isobaric':q(s.pressure*1000*d.volume*.001,s.n*R*s.temp,'pV SI');q(d.work,s.pressure*(d.volume-s.n*R*300/s.pressure),'constant pressure work');break;
 case 'isochoric':q(d.pressure*1000*s.volume*.001,s.n*R*s.temp,'pV SI');q(d.work,0,'zero volume work');break;
 case 'firstlaw':q(d.deltaU,s.heat+s.workOn,'work on convention');q(d.internal,1.5*s.n*R*d.temp,'monatomic internal energy');assert.ok(d.temp>0);break;
 case 'kinetic':q(d.rms*d.rms*(s.molar*.001),3*R*s.temp,'rms SI molar mass');q(d.energy,1.5*k*s.temp,'mean particle energy');break;
 case 'resistivity':q(d.resistance*(s.area*1e-6),s.rho*1e-6*s.length,'SI resistivity geometry');q(d.power,s.u*d.i,'electrical power');break;
 case 'internalresistance':q(d.terminal+d.i*s.internalR,s.emf,'loop voltage');q(d.power+d.loss,s.emf*d.i,'source power balance');break;
 case 'bridge':q(d.va*(s.r1+s.r2),s.u*s.r2,'left divider');q(d.vb*(s.r3+s.r4),s.u*s.r4,'right divider');q(d.difference,d.va-d.vb,'signed bridge');break;
 case 'solenoid':q(d.b*s.length,4*Math.PI*1e-7*s.turns*s.i,'Ampere long solenoid');q(d.density,s.turns/s.length,'winding density');break;
 case 'lorentz':q(d.vx*d.vx+d.vy*d.vy,s.speed*s.speed,'speed conserved');q(d.force,Math.abs(s.charge*1e-6)*s.speed*s.b,'Lorentz magnitude');if(s.charge!==0)q(d.radius*Math.abs(s.charge*1e-6)*s.b,s.mass*1e-6*s.speed,'SI mg microC radius');break;
 case 'transformer':q(d.u2/s.u1,s.n2/s.n1,'turn ratio');q(s.u1*d.i1,d.u2*d.i2,'ideal power conservation');break;
 case 'ac':q(d.rms*Math.sqrt(2),s.u0,'peak rms');q(d.power,s.u0*s.u0/(2*s.resistance),'cycle power');q(d.i*s.resistance,d.voltage,'instantaneous Ohm');break;
 default:throw Error('Uncovered '+e.id);
 }
 const row=tableValues(e.id,s,d);assert.equal(row.length,e.headers.length,e.id+' table columns');
 for(let j=0;j<e.columns.length;j++){const c=e.columns[j],v=d[c.key]??s[c.key];if(v!==null&&v!==undefined&&Number.isFinite(v))q(row[j],v*c.scale,'table '+c.key);}
 }
 records.push({id:e.id,configurations:3,assertions:local,status:'PASS'});
}
// Defined singular limits use explicit missing values instead of fake finite images.
for(const id of ['lens','mirror']){
 const d=evaluate(id,{distance:20,focal:20,height:5});
 assert.equal(d.image,null);assert.equal(d.magnification,null);assert.equal(d.infinite,1);count+=3;
}
const neutral=evaluate('lorentz',{charge:0,mass:1,speed:4,b:.5,t:2});
assert.equal(neutral.radius,null);eq(neutral.x,8,'neutral straight motion');eq(neutral.y,0,'neutral transverse motion');eq(neutral.force,0,'neutral force');
for(const charge of [-1,1]){
 const d=evaluate('lorentz',{charge,mass:1,speed:4,b:.5,t:Math.PI});
 eq(d.radius,8,'charge sign radius');eq(d.vx*d.vx+d.vy*d.vy,16,'sign invariant speed');
}
const critical=180/Math.PI*Math.asin(1/1.5);
const boundary=evaluate('tir',{n1:1.5,n2:1,angle:critical});
eq(boundary.refracted,90,'critical grazing ray');assert.equal(boundary.tir,0);count++;
const blocked=evaluate('tir',{n1:1.5,n2:1,angle:critical+.001});assert.equal(blocked.refracted,null);assert.equal(blocked.tir,1);count+=2;
for(const id of ['young','diffraction']){
 const s={wavelength:550,screen:1.5,slits:.4,width:.15,probe:0};
 eq(evaluate(id,s).intensity,1,id+' central maximum');
 const zero=id==='young'?550e-9*1.5/(.4e-3)*1000/2:550e-9*1.5/(.15e-3)*1000;
 eq(evaluate(id,{...s,probe:zero}).intensity,0,id+' interference zero');
}
// Literal textbook-style anchors independently evaluated in stated display units.
const anchors=[
 ['pressure',{depth:2,density:1000,surface:101.3},'pressure',120.92],
 ['buoyancy',{fraction:1,volume:1,density:1000,m:1},'buoyant',9.81],
 ['lens',{distance:30,focal:10,height:4},'image',15],
 ['mirror',{distance:30,focal:10,height:4},'imageHeight',-2],
 ['refraction',{angle:30,n1:1,n2:1.5},'refracted',19.47122063449069],
 ['young',{wavelength:600,slits:.5,screen:2,probe:0},'spacing',2.4],
 ['thermalexpansion',{length:2,alpha:12,temp:120},'extension',2.4],
 ['calorimetry',{mHot:1,mCold:1,hot:80,cold:20},'finalTemp',50],
 ['resistivity',{rho:.017,length:10,area:.2,u:1},'resistance',.85],
 ['internalresistance',{emf:6,load:5,internalR:1},'terminal',5],
 ['transformer',{u1:12,n1:200,n2:100,load:20},'u2',6],
 ['ac',{u0:12,resistance:20,f:1,phase:0,t:0},'power',3.6],
];
for(const [id,s,key,expected]of anchors)eq(evaluate(id,s)[key],expected,`literal ${id}/${key}`);
const firstlawFixed=evaluate('firstlaw',{n:.2,heat:100,workOn:50});
eq(firstlawFixed.internal,898.30163562,'Initial300K plus Q plus work-on in J');
assert.equal(records.length,30);
console.log(JSON.stringify({scope:'Independent analytic physics and unit identities, original31–60',models:records.length,assertions:count,records,limits:['No scene geometry or real device certification.','No teacher acceptance.']},null,2));
