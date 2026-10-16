// Validated dimensional domains; retain the inherited domain for reproducible presets.
export const protectedUnits=new Set(['','°','K','°C','×','electron']);
const fixedExperiment={
 firstlaw:'Q + A and n jointly constrain positive final absolute temperature',
 joule:'The water-only model has no phase change; independently expanding U,R,m produces above-boiling liquid temperatures',
 prism:'asin(n sin(A/2)) and dispersion jointly bound real emergence',
 fiber_acceptance:'Core index must exceed cladding; inherited nonoverlapping bounds guarantee this',
 poiseuille:'The laminar-flow assumption would be violated by independently scaling radius, pressure, viscosity and length',
 stokes_settling:'Reynolds validity is already conditional; preserve the calibrated input range for this expansion',
 duffing:'RK4 uses fixed maximum step and no convergence estimator; broader forcing/nonlinearity needs accuracy verification',
 van_der_pol:'RK4 uses fixed maximum step; higher gain and initial displacement can make the integrator stiff',
 airy_pattern:'Fixed 192-node quadrature for J1 cannot accurately support an arbitrarily larger oscillatory argument',
 reaction_threshold:'The threshold and energy budget are explicitly nonrelativistic',
 alpha_recoil:'The recoil formula is explicitly nonrelativistic'
};
const fixedParam={
 'damped.period':'Must preserve beta < 2pi / period for every permitted pair',
 'damped.beta':'Must preserve the underdamped branch',
 'resonance.beta':'Damping defines a positive resonance denominator',
 'electric.x1':'Fixed coordinate-to-scene drag mapping and field singularity exclusion',
 'electric.y1':'Fixed coordinate-to-scene drag mapping', 'electric.z1':'Fixed coordinate-to-scene drag mapping',
 'electric.x2':'Fixed coordinate-to-scene drag mapping', 'electric.y2':'Fixed coordinate-to-scene drag mapping', 'electric.z2':'Fixed coordinate-to-scene drag mapping',
 'electric.px':'Fixed coordinate-to-scene drag mapping', 'electric.py':'Fixed coordinate-to-scene drag mapping', 'electric.pz':'Fixed coordinate-to-scene drag mapping',
 'doppler_source.source':'Source must remain below fixed sound speed 343 m/s',
 'doppler_observer.observer':'Preserve the subsonic positive-frequency branch',
 'moving_wall.wall':'Collision assumption requires incident particle to catch the wall',
 'hohmann.start':'Only outward transfers: starting orbit must remain below minimum target radius',
 'debroglie.voltage':'This formula is explicitly nonrelativistic and was scoped to 1–1000 V',
 'string_power.amplitude':'Small wave amplitude and slope assumption',
 'string_power.frequency':'Small wave slope assumption',
 'string_power.density':'Small wave slope depends jointly on v=sqrt(T/mu)',
 'string_power.tension':'Small wave slope depends jointly on v=sqrt(T/mu)',
 'elastic_modulus.force':'Linear-strain material assumption',
 'elastic_modulus.area':'Linear-strain material assumption',
 'elastic_modulus.young':'Linear-strain material assumption',
 'capillary_rise.radius':'Radius needs to remain in the capillary regime',
 'ammeter_shunt.galvanometer':'Keep Ig max at 2 mA, below I-range min of 10 mA',
 'spherical_capacitor.inner':'Keep a max=0.05 m below b min=0.06 m',
 'lens.height':'Paraxial height-to-object-distance ratio must not worsen',
 'mirror.height':'Paraxial height-to-object-distance ratio must not worsen',
 'young.wavelength':'Preserve the visible spectral band and calibrated fringe rendering',
 'young.slits':'Preserve small-angle/Fraunhofer aperture assumptions',
 'young.probe':'Keep probe angle small at smallest screen distance',
 'diffraction.wavelength':'Preserve the visible spectral band and calibrated fringe rendering',
 'diffraction.width':'Preserve Fraunhofer aperture assumptions',
 'diffraction.probe':'Keep probe angle small at smallest screen distance',
 'convection_radiation.initial':'Fixed-step cooling solver, thermal conditions',
};
const keepMin=new Set([
 'orbit.radius','hohmann.target','moving_wall.speed','elevator.acc',
 'spherical_capacitor.outer','hydraulic_press.large','ammeter_shunt.range',
 'young.screen','diffraction.screen','lens.distance','mirror.distance',
 'convection_radiation.mass'
]);
const keepMax=new Set(['hydraulic_press.small','poisson_counting.interval']);
const positiveMinimum={'camera_defocus.focus':.1,'camera_defocus.object':.1};
const precise=n=>Number(n.toPrecision(12));
export function proposeParameterDomain(experiment,p){
 const id=experiment.id+'.'+p.key,before={min:p.min,max:p.max,step:p.step};
 if(p.key==='t')return {id,action:'keep',reason:'Animation time has its own duration policy',...before};
 const why=fixedExperiment[experiment.id]||fixedParam[id]||(protectedUnits.has(p.unit)?'Bounded, absolute-temperature, unitless, angle, scaling, or discrete quantity':null);
 if(why)return {id,action:'keep',reason:why,...before};
 // Retain inherited integer-grid behavior until clampState has explicit quantity types.
 const integerGrid=(experiment.atlas&&p.step===1&&p.digits===0)||['mode','turns','n1','n2','n0'].includes(p.key);
 const step=integerGrid?p.step:p.step/10,origin=p.min;
 let lo=p.min<0?p.min*5:p.min>0?p.min/10:0,hi=p.max>0?p.max*5:p.max/5;
 if(keepMin.has(id))lo=p.min;if(keepMax.has(id))hi=p.max;
 if(positiveMinimum[id])lo=Math.max(lo,positiveMinimum[id]);
 // Keep every old grid point valid: new endpoints share the inherited grid origin.
 lo=origin+Math.ceil((lo-origin)/step-1e-9)*step;
 hi=origin+Math.floor((hi-origin)/step+1e-9)*step;
 if(p.min>0&&lo<=0)lo=origin+Math.ceil((Math.max(step,p.min/10)-origin)/step-1e-9)*step;
 if(p.min>0&&lo<=0)lo=p.min;
 return {id,action:lo!==p.min||hi!==p.max?'expand':'refine',reason:'Dimensional ideal-model quantity; bounded exceptions applied; old grid preserved',min:precise(lo),max:precise(hi),step:precise(step),integerGrid,before};
}
export function applyProposal(experiments){
 const manifest=[];
 for(const e of experiments)for(const p of e.params){if(p.originalDomain){manifest.push(p.domainChange);continue;}const q=proposeParameterDomain(e,p);p.originalDomain={min:p.min,max:p.max,step:p.step};p.domainChange={...q,experiment:e.id,key:p.key,unit:p.unit};manifest.push({...q,experiment:e.id,key:p.key,unit:p.unit});if(q.action==='keep')continue;Object.assign(p,{min:q.min,max:q.max,step:q.step});if(e.graph?.key===p.key){if(e.graph.min===q.before.min)e.graph.min=p.min;if(e.graph.max===q.before.max)e.graph.max=p.max;}}
 return manifest;
}
