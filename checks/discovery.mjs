import {parseHTML} from 'linkedom';
import assert from 'node:assert/strict';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,clampState,duration} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
import {buildLabModel} from '../dist/scene3d.js';
import {coreParams,parameterFromDrag,themeFor} from '../dist/learning.js';
import {linearFit,tableGraph,sweepStates,segments} from '../dist/analytics.js';
const {document:geometryDocument,window:geometryWindow}=parseHTML('<html><body></body></html>');globalThis.document=geometryDocument;geometryWindow.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});

const s=id=>initialState(experiments.find(e=>e.id===id)),d=(id,change={})=>evaluate(id,{...s(id),...change}),close=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(a),Math.abs(b)),`${a} vs ${b}`);
close(d('freefall').duration**2,2*s('freefall').h0/s('freefall').gravity);
close(d('freefall',{h0:20}).duration/d('freefall',{h0:5}).duration,2);
close(d('friction',{force:2}).acc,0);assert.ok(d('friction',{force:10}).acc>0);
close(d('work',{angle:90}).work,0);assert.ok(d('work',{angle:120}).work<0);
for(const t of [0,.4,2,4]){const q=d('impulse',{t});close(q.momentum-s('impulse').m*s('impulse').v0,q.impulse);close(q.impulse,s('impulse').force*Math.min(t,s('impulse').contact));}
close(d('buoyancy',{fraction:.5}).buoyant,d('buoyancy',{fraction:1}).buoyant/2);
close(d('pressure').pressure-s('pressure').surface,d('pressure').gauge);
close(d('reflection').reflected,s('reflection').angle);
let q=d('refraction');close(s('refraction').n1*Math.sin(s('refraction').angle*Math.PI/180),s('refraction').n2*Math.sin(q.refracted*Math.PI/180));
q=d('tir');assert.equal(q.tir,1);assert.equal(q.refracted,null);q=d('tir',{n1:1.5,n2:1,angle:Math.asin(1/1.5)*180/Math.PI});assert.equal(q.tir,0);close(q.refracted,90);
assert.equal(d('refraction',{n1:1,n2:1.5}).critical,null);
for(const id of ['lens','mirror']){q=d(id);close(1/s(id).focal,1/s(id).distance+1/q.image);assert.equal(d(id,{distance:20,focal:20}).image,null);q=d(id,{focal:-20});assert.ok(q.image<0&&q.magnification>0&&q.magnification<1);}
close(d('prism',{dispersion:0}).spread,0);assert.ok(d('prism').spread>0);
close(d('young',{probe:0}).intensity,1);close(d('young',{probe:d('young').spacing/2}).intensity,0);
close(d('diffraction',{probe:0}).intensity,1);close(d('diffraction',{probe:d('diffraction').firstMin}).intensity,0);close(d('diffraction',{probe:3}).intensity,d('diffraction',{probe:-3}).intensity);
close(d('polarization',{angle:45}).fraction,.5);close(d('polarization',{angle:90}).fraction,0);
close(d('thermalexpansion').extension,s('thermalexpansion').alpha*1e-6*s('thermalexpansion').length*(s('thermalexpansion').temp-20)*1000);
q=d('calorimetry');close(q.released,q.absorbed);assert.ok(q.finalTemp>s('calorimetry').cold&&q.finalTemp<s('calorimetry').hot);
const ice=s('phasechange'),warm=-ice.initial*ice.mass*2100,melt=ice.mass*334000;
q=d('phasechange',{t:(warm+melt/2)/ice.power});close(q.temp,0);close(q.melted,.5);close(d('phasechange',{t:d('phasechange').duration}).temp,80);
const iceLab=experiments.find(e=>e.id==='phasechange'),longIce={...ice,mass:.1,power:50};const total=duration(iceLab,longIce,evaluate('phasechange',longIce));close(clampState(iceLab,{...longIce,t:total}).t,total);
close(d('heattransfer',{length:1}).power,d('heattransfer',{length:.5}).power/2);
close(d('isobaric',{temp:600}).volume/d('isobaric',{temp:300}).volume,2);close(d('isochoric',{temp:600}).pressure/d('isochoric',{temp:300}).pressure,2);
close(d('firstlaw').deltaU,s('firstlaw').heat+s('firstlaw').workOn);
close(d('kinetic',{temp:600}).energy/d('kinetic',{temp:300}).energy,2);close(d('kinetic',{molar:4}).energy,d('kinetic',{molar:28}).energy);
close(d('resistivity',{length:10}).resistance,d('resistivity',{length:5}).resistance*2);
q=d('internalresistance');close(q.terminal+q.i*s('internalresistance').internalR,s('internalresistance').emf);close(q.power+q.loss,s('internalresistance').emf*q.i);assert.ok(d('internalresistance',{load:1}).power>d('internalresistance',{load:2}).power);
close(d('bridge').difference,0);assert.notEqual(d('bridge',{r4:50}).difference,0);
close(d('solenoid',{i:-2}).b,-d('solenoid',{i:2}).b);
for(const charge of [-1,1]){const ss={...s('lorentz'),charge,t:1.4},q=evaluate('lorentz',ss),omega=ss.charge*ss.b/ss.mass;close(Math.hypot(q.vx,q.vy),ss.speed);close(Math.hypot(q.x,q.y+ss.speed/omega),q.radius);}
q=d('lorentz',{charge:0,t:2});assert.equal(q.radius,null);close(q.x,8);close(q.y,0);
q=d('transformer');close(s('transformer').u1*q.i1,q.u2*q.i2);
const ac=s('ac'),n=2000,mean=Array.from({length:n},(_,j)=>d('ac',{t:j/(n*ac.f)}).voltage**2).reduce((a,b)=>a+b)/n;close(Math.sqrt(mean),d('ac').rms);
for(const e of experiments){const initial=initialState(e),config={switches:{handles:true,vectors:true,trajectory:true},mode:0,capMode:'charge'},model=buildLabModel(e.id,initial,evaluate(e.id,initial,config),{labels:false,interactive:true,config});let count=0;model.group.traverse(m=>{if(m.userData.drag?.startsWith('param:'))count++;});assert.ok(count>=1,e.id+' direct handle');const key=coreParams(e)[0].key;assert.equal(parameterFromDrag(e,key,{x:-2.6}).value,e.params.find(p=>p.key===key).min);assert.equal(parameterFromDrag(e,key,{x:2.6}).value,e.params.find(p=>p.key===key).max);
for(const side of ['min','max']){const ss=clampState(e,Object.fromEntries(e.params.map(p=>[p.key,p[side]]))),data=evaluate(e.id,ss,config);model.update(ss,data,config);model.group.updateMatrixWorld(true);model.group.traverse(m=>{assert.ok(m.matrixWorld.elements.every(Number.isFinite),e.id+' extreme transform');const a=m.geometry?.attributes.position?.array;if(a)assert.ok(Array.from(a).every(Number.isFinite),e.id+' extreme vertices');});}
model.group.traverse(m=>{m.geometry?.dispose();m.material?.dispose?.();});}
const points=[[0,1],[1,3],[2,5],[3,7]],fit=linearFit(points);close(fit.slope,2);close(fit.intercept,1);close(fit.r2,1);assert.equal(linearFit([[1,2],[1,3],[1,4]]),null);
assert.equal(segments([[0,1],[1,NaN],[2,3]]).length,2);
const ohm=experiments.find(e=>e.id==='ohm'),sweep=sweepStates(ohm,s('ohm'),'u',0,6,10);assert.equal(sweep.length,10);close(sweep.at(-1).u,6);assert.ok(sweep.every(p=>p.r===s('ohm').r));assert.throws(()=>sweepStates(ohm,s('ohm'),'u',-1,6,10));
const rows=sweep.map(ss=>({values:tableValues('ohm',ss,evaluate('ohm',ss))})),plot=tableGraph(ohm,rows,0,2,true);close(plot.regression.slope,1/s('ohm').r);
const luma=color=>{const rgb=color.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};for(const e of experiments){const a=themeFor(e);assert.ok((1.05)/(luma(a.color)+.05)>=4.5,e.topic+' accent contrast');}
console.log('PASS 30 new physical models, null/limit states, 150 interaction rigs and parameter endpoints, scatter regression, sweep isolation and all theme text contrast.');
