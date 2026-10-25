import assert from 'node:assert/strict';
import {expansionExperiments} from '../dist/expansion-catalog.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate,duration,clampState} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
import {graphFor} from '../dist/graphs.js';
const by=Object.fromEntries(experiments.map(e=>[e.id,e])),data=(id,x={})=>evaluate(id,{...initialState(by[id]),...x}),near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} vs ${b}`);
assert.equal(expansionExperiments.length,150);assert.equal(experiments.length,300);assert.equal(new Set(experiments.map(e=>e.id)).size,300);assert.equal(new Set(experiments.map(e=>e.title)).size,300);
assert.equal(data('table_hanging',{hanging:.1,mass:2,friction:.4}).acc,0);
near(data('contact_carts',{force:12,mass:1,second:2}).contact,8);
let a=data('free_wedge',{angle:30,mass:1,wedge:3});near(a.relativeAcc*Math.cos(Math.PI/6),4*a.wedgeAcc);
a=data('three_strings',{left:30,right:60,mass:2});near(a.tension1*Math.cos(Math.PI/6),a.tension2*.5);near(a.tension1*.5+a.tension2*Math.sin(Math.PI/3),19.62);
a=data('collision_2d',{angle:30,speed:10,mass:2});near(a.v1x+a.v2x,10);near(a.v1y+a.v2y,0);near(a.speed1*a.speed1+a.speed2*a.speed2,100);
a=data('collision_spring',{mass:1,second:1,speed:2,stiffness:100});near(.5*100*a.compression**2,.5*2*a.common**2);
near(data('angular_momentum',{radius:1}).work,0);near(data('atwood_inertia',{pulleyMass:0,m1:1,m2:2}).acc,9.81/3);
near(data('elliptic_orbit',{angle:0}).areaRate,data('elliptic_orbit',{angle:180}).areaRate);
a=data('binary_orbit',{massRatio:.5});near(a.r1,.5*a.r2);
near(data('poiseuille',{radius:.4}).flow/data('poiseuille',{radius:.2}).flow,16);
near(data('capillary_rise',{angle:90}).height,0);
const E=data('coupled_pendulums',{t:0}).energy;for(const t of [.1,1,4,9])near(data('coupled_pendulums',{t}).energy,E);
assert.ok(data('large_pendulum',{amplitude:100}).period>data('large_pendulum',{amplitude:20}).period);
assert.ok(data('vibration_absorber',{frequency:Math.sqrt(40)/(2*Math.PI),absorberMass:.3,coupling:12}).ratio<.2);
a=data('string_boundary');near(a.reflectedPower+a.transmittedPower,1);a=data('bead_scattering');near(a.reflectedPower+a.transmittedPower,1);
near(data('string_power',{amplitude:8}).power/data('string_power',{amplitude:4}).power,4);
assert.ok(data('dispersive_packet',{wavelength:.1,depth:2}).ratio<.501);
near(data('sound_tdoa',{x:0}).delay,0);
near(data('charged_ring',{distance:0}).field,0);assert.ok(data('charged_ring',{distance:0}).potential>0);
near(data('charged_solid_sphere',{distance:0}).field,0);near(data('charged_solid_sphere',{distance:.5,radius:.5}).field,data('charged_solid_sphere',{distance:.500000001,radius:.5}).field,1e-6);
assert.equal(data('charged_plane',{position:0}).field,null);
a=data('electric_work_paths',{detour:0});near(a.straightWork,data('electric_work_paths',{detour:1}).detourWork);
a=data('connected_spheres',{radius1:3,radius2:6});near(a.charge2,2*a.charge1);
near(data('conducting_shell',{distance:.4}).field,0);near(data('isolated_dielectric',{dielectric:3}).energy*3,data('isolated_dielectric',{dielectric:1}).energy);
a=data('layered_dielectric',{dielectric:4});near(a.field1*2,a.field2*4);
a=data('two_meshes');near(a.power,a.loss);
near(data('star_delta',{r1:30,r2:30,r3:30}).rab,90);
near(data('resistor_ladder',{stages:1,series:30,shunt:50}).equivalent,80);
near(data('unbalanced_bridge',{r1:10,r2:20,r3:20,r4:40}).meterCurrent,0);
near(data('ammeter_shunt',{range:1,galvanometer:1,resistance:100}).shunt,.1/.999);
near(data('kelvin_four_wire',{sample:.1,lead:.2}).twoWire,.5);
a=data('two_stage_rc',{tau1:.5,tau2:.5,t:.5});near(a.out,12*(1-2/Math.E));
a=data('charge_sharing',{c1:100,c2:100,u1:10,u2:0});near(a.final,5);near(a.lost,2500);
for(const resistance of [10,2*Math.sqrt(.5/.0005),150]){let previous=Infinity;for(let j=0;j<=20;j++){const d=data('rlc_free',{resistance,t:j*.01});assert.ok(d.energy<=previous+1e-6);previous=d.energy;}assert.ok(Number.isFinite(previous));}
near(data('rlc_free',{resistance:2*Math.sqrt(.5/.0005)}).regime,1);
a=data('flyback_diode',{t:10});near(a.current,0);near(a.diodeEnergy+a.copperHeat,250);
near(data('half_rectifier',{t:.015,frequency:50}).output,0);
near(data('bridge_rectifier',{t:.005,frequency:50}).output,data('bridge_rectifier',{t:.015,frequency:50}).output);
for(const frequency of [10,500,10000]){const lo=data('rc_lowpass',{frequency}),hi=data('rc_highpass',{frequency});near(lo.gain**2+hi.gain**2,1);near(hi.phase-lo.phase,90);}
a=data('loop_axis',{distance:0});near(a.field,a.center);
near(data('magnetic_helix',{angle:0}).radius,0);near(data('magnetic_helix',{angle:90}).pitch,0);
a=data('sliding_rod');near(a.power,a.heat);
a=data('magnetic_braking',{t:2});near(a.heat+.5*.3*a.speed**2,.5*.3*9);
near(data('poynting_energy').average/299792458*1e6,data('poynting_energy').density);
assert.equal(data('separated_lenses',{object:30,separation:30}).image,null);a=data('separated_lenses',{object:30,separation:45});near(a.image,30);near(a.magnification,.5);
near(data('camera_defocus',{focus:2,object:2}).blur,0);near(data('thin_film',{thickness:0}).intensity,0);near(data('thin_film',{thickness:550/(4*1.4)}).intensity,1);
near(data('michelson',{mirror:.275,wavelength:550}).fringes,1);near(data('fabry_perot',{gap:.55,wavelength:550}).transmission,1);
a=data('airy_pattern',{radial:0});near(a.intensity,1);assert.ok(data('airy_pattern',{radial:a.firstDark}).intensity<1e-6);
near(data('finite_double_slit',{position:5.5,width:.1}).envelope,0);
near(Math.abs(data('wave_plate',{angle:45,retardance:90}).circular),1);
a=data('radiative_balance');near(a.absorbed,a.netEmission);
a=data('layered_wall');near(a.flux*a.thermalResistance,20);
near(data('transient_heat_bar',{probe:.5,t:0}).temperature,100);near(data('transient_heat_bar',{probe:.5,t:10}).heatFlux,0);
a=data('seebeck');near(a.emf*a.current,a.power);
near(data('otto_cycle',{compression:8}).efficiency,100*(1-8**(-.4)));
const sr=data('stirling_regenerator',{regeneration:1,hot:600,cold:300});near(sr.efficiency,50);
a=data('refrigerator');near(a.rejected,500+a.work);
// Distribution normalization uses integration independent from the implementation.
let integral=0;const limit=6000,n=12000;for(let i=0;i<=n;i++)integral+=(i===0||i===n?.5:1)*data('maxwell_distribution',{speed:limit*i/n}).density*limit/n;near(integral,1,1e-5);
near(data('two_level_boltzmann',{gap:30,temperature:300,degeneracy:1}).upper,1/(1+Math.exp(.03*1.602176634e-19/(1.380649e-23*300))));
near(data('brownian_motion',{t:2,diffusion:1}).msd,12);assert.deepEqual(data('brownian_motion',{t:2}),data('brownian_motion',{t:2}));
near(data('vapor_pressure',{temperature:373.15}).pressure,101.325);
near(data('hydrogen_lines',{initial:3,final:2}).energy,13.605693*5/36);assert.equal(data('hydrogen_lines',{initial:2,final:3}).wavelength,null);
near(data('compton_scattering',{angle:0}).recoil,0);near(data('quantum_box',{position:1}).cumulative,1);near(data('quantum_box',{position:0}).density,0);
for(const t of [0,1,3,10]){a=data('decay_chain',{parentHalf:2,daughterHalf:2,t});near(a.parent+a.daughter+a.stable,1000);near(a.daughter,1000*Math.LN2/2*t*Math.exp(-Math.LN2/2*t));}
a=data('alpha_recoil',{massNumber:200,energy:5});near(a.alpha+a.daughter,5);near(a.alpha/a.daughter,196/4);
a=data('reaction_threshold',{defect:-.004,target:1,incident:4});assert.equal(a.available,null);
a=data('gamma_attenuation');near(data('gamma_attenuation',{thickness:a.halfLayer}).fraction,50);
let sum=0,square=0;for(let seed=1;seed<=10000;seed++){const d=data('poisson_counting',{seed,rate:5,interval:1});sum+=d.count;square+=d.count*d.count;}assert.ok(Math.abs(sum/10000-5)<.15);assert.ok(Math.abs(square/10000-(sum/10000)**2-5)<.3);
// Domain failures must not masquerade as quantitative predictions.
assert.equal(data('gyroscope',{omega:10,radius:.05,arm:.15}).precession,null);
assert.equal(data('stokes_settling',{radius:.15,viscosity:10,density:8000}).terminal,null);
assert.equal(data('metacentric',{width:.6,draft:.3,bg:.1}).stable,0);
assert.equal(data('fabry_perot',{reflectivity:.1}).finesse,null);
const fp=data('fabry_perot',{reflectivity:.6});near(fp.finesse,Math.PI/(2*Math.asin(.4/(2*Math.sqrt(.6)))));
// Brownian bridge restores the correct variance between fixed time steps.
for(const t of [.025,.075]){let meanR2=0;for(let seed=1;seed<=10000;seed++)meanR2+=data('brownian_motion',{t,seed,diffusion:1}).sample;near(meanR2/10000,6*t,.025);}
const beforeStep=data('brownian_motion',{t:.05-1e-10}),atStep=data('brownian_motion',{t:.05});assert.ok(Math.hypot(beforeStep.x-atStep.x,beforeStep.y-atStep.y,beforeStep.z-atStep.z)<.001);
for(const e of expansionExperiments){const base=initialState(e);for(const pattern of [0,1,2,3]){const raw={...base};e.params.forEach((p,i)=>raw[p.key]=((i+pattern)%2?p.max:p.min));const state=clampState(e,raw),d=evaluate(e.id,state);assert.ok(Object.entries(d).every(([key,v])=>key==='domainValid'?typeof v==='boolean':key==='domainMessage'?typeof v==='string':v===null||typeof v==='number'&&Number.isFinite(v)),e.id+' finite corners and typed domain metadata');if(d.domainValid===false){assert.ok(d.domainMessage.length>0,e.id+' explains its invalid domain');assert.ok(e.readouts.every(r=>d[r.key]===null),e.id+' never presents out-of-domain values as measurements');}assert.equal(tableValues(e.id,state,d).length,e.headers.length);assert.ok(duration(e,state,d)>0);}}
const counting=by.poisson_counting,st=initialState(counting),cg=graphFor(counting,st,data('poisson_counting'));assert.equal(cg.series[0].discrete,true);assert.equal(cg.series[0].data.length,100);
console.log('PASS 300 unique titles/IDs; 150 new protocols, independent conservation/domain/limit checks across all 30 research groups, RLC regimes, optical nulls, normalized probability and reproducible Poisson/Brownian samples. No browser or GPU test.');
