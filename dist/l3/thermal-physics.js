import {maximumWaterMassKg} from './thermal-geometry.js?v=87';
// Mass/energy/time in SI. Celsius is an affine temperature coordinate; differences are K.
// Two finite water nodes conserve energy. Graphics never determine measurements.
export const MODEL_VERSION='thermal.nodes.v1';
export const CONSTANTS=Object.freeze({waterSpecificHeatJPerKgK:4180,latentHeatJPerKg:334000,waterDensityKgM3:1000,iceDensityKgM3:917,maxStepS:.05});
const {waterSpecificHeatJPerKgK:CW,latentHeatJPerKg:LF,waterDensityKgM3:RW,iceDensityKgM3:RI}=CONSTANTS;
const finite=(n,v,a,b)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b)throw new RangeError(n);return v;};
const clone=s=>structuredClone(s),round=(v,r)=>Math.round(v/r)*r;
const bounds={waterMassKg:[0,2],waterTempC:[0,95],iceMassKg:[0,1],calorimeterHeatCapacityJPerK:[0,5000],calorimeterInitialTempC:[0,95],capacityM3:[.0001,.01],solidMassKg:[.001,1],solidSpecificHeatJPerKgK:[100,5000],solidDensityKgM3:[500,20000],solidTempC:[0,95],bathTempC:[0,95],ambientTempC:[0,40],solidAirCoolingWPerK:[0,10],probeTauS:[.1,30],probeResolutionK:[.01,1],scaleResolutionKg:[.0001,.01]};
export function validateConfig(activity,config={}){
 if(!['ice','solid'].includes(activity))throw new RangeError('activity');
 const d={waterMassKg:.2,waterTempC:activity==='ice'?40:20,iceMassKg:.02,calorimeterHeatCapacityJPerK:0,capacityM3:.0006,solidMassKg:.1,solidSpecificHeatJPerKgK:900,solidDensityKgM3:2700,solidTempC:20,bathTempC:90,ambientTempC:20,solidAirCoolingWPerK:0,probeTauS:2,probeResolutionK:.1,scaleResolutionKg:.001};
 if(config===null||typeof config!=='object'||Array.isArray(config))throw new RangeError('config');
 const result={};for(const [key,[lo,hi]]of Object.entries(bounds)){const value=config[key]!==undefined?config[key]:(key==='calorimeterInitialTempC'?(config.waterTempC??d.waterTempC):d[key]);result[key]=finite(key,value,lo,hi);}
 if(config.iceTempC!==undefined&&config.iceTempC!==0)throw new RangeError('Only ice initially at 0 C is supported');
 return result;
}
export function defaultConfig(activity='ice'){return validateConfig(activity);}
export const DEFAULT_CONFIGS=Object.freeze({ice:Object.freeze(validateConfig('ice')),solid:Object.freeze(validateConfig('solid'))});
const nearC=s=>s.nearWaterMassKg*CW+s.config.calorimeterHeatCapacityJPerK/2,farC=s=>s.farWaterMassKg*CW+s.config.calorimeterHeatCapacityJPerK/2;
export function containedVolumeM3(s){return s.waterMassKg/RW+s.iceMassKg/RI+(s.solid.location==='water'?s.solid.massKg/s.config.solidDensityKgM3:0);}
export function totalEnergyJ(s){return nearC(s)*s.nearWaterTempC+farC(s)*s.farWaterTempC+s.cupWaterMassKg*CW*s.cupTempC-(s.iceMassKg+s.iceTrayMassKg)*LF+(s.activity==='solid'?s.solid.massKg*s.solid.specificHeatJPerKgK*s.solid.tempC:0);}
export function totalMassKg(s){return s.nearWaterMassKg+s.farWaterMassKg+s.cupWaterMassKg+s.iceMassKg+s.iceTrayMassKg+s.spillMassKg+(s.activity==='solid'?s.solid.massKg:0);}
function sync(s){s.waterMassKg=s.nearWaterMassKg+s.farWaterMassKg;s.waterTempC=s.waterMassKg>0?(s.nearWaterMassKg*s.nearWaterTempC+s.farWaterMassKg*s.farWaterTempC)/s.waterMassKg:(s.nearWaterTempC+s.farWaterTempC)/2;s.waterVolumeM3=s.waterMassKg/RW;s.energyResidualJ=totalEnergyJ(s)+s.energyOutJ-s.energyInJ-s.initialEnergyJ;s.massResidualKg=totalMassKg(s)-s.initialMassKg;return s;}
export function createState(activity='ice',input={}){
 const config=validateConfig(activity,input),t=config.calorimeterInitialTempC;
 const s={schemaVersion:'thermal.physical.v1',modelVersion:MODEL_VERSION,activity,config,timeS:0,vesselPlaced:false,nearWaterMassKg:0,farWaterMassKg:0,nearWaterTempC:t,farWaterTempC:t,waterMassKg:0,waterTempC:t,waterVolumeM3:0,cupWaterMassKg:config.waterMassKg,cupTempC:config.waterTempC,iceMassKg:0,iceTrayMassKg:activity==='ice'?config.iceMassKg:0,solid:{massKg:config.solidMassKg,specificHeatJPerKgK:config.solidSpecificHeatJPerKgK,tempC:config.solidTempC,location:'tray'},probe:{placement:'air',tempC:config.ambientTempC,tauS:config.probeTauS,resolutionK:config.probeResolutionK,offsetK:0},scale:{load:'none',iceMassKg:0,tareKg:0,resolutionKg:config.scaleResolutionKg},mixingIntensity:0,energyInJ:0,energyOutJ:0,spillMassKg:0,spillEnergyJ:0,initialEnergyJ:0,initialMassKg:0};
 s.initialEnergyJ=totalEnergyJ(s);s.initialMassKg=totalMassKg(s);return sync(s);
}
export function validateState(s){
 const errors=[];try{
  if(!s||s.schemaVersion!=='thermal.physical.v1'||s.modelVersion!==MODEL_VERSION)throw new RangeError('version');validateConfig(s.activity,s.config);if(s.apparatusGeometryVersion!==undefined&&s.apparatusGeometryVersion!=='thermal.geometry.v2')throw new RangeError('apparatus geometry version');
  for(const k of ['timeS','nearWaterMassKg','farWaterMassKg','waterMassKg','cupWaterMassKg','iceMassKg','iceTrayMassKg','spillMassKg','energyInJ','energyOutJ','spillEnergyJ','initialMassKg'])finite(k,s[k],0,1e9);
  for(const k of ['nearWaterTempC','farWaterTempC','waterTempC','cupTempC'])finite(k,s[k],0,95.000001);
  finite('waterVolumeM3',s.waterVolumeM3,0,1e6);for(const k of ['energyResidualJ','massResidualKg'])finite(k,s[k],-1e9,1e9);
  finite('initialEnergyJ',s.initialEnergyJ,-1e9,1e9);finite('mixingIntensity',s.mixingIntensity,0,1);if(typeof s.vesselPlaced!=='boolean')throw new RangeError('vesselPlaced');
  if(!['tray','bath','tongs','water','table'].includes(s.solid?.location))throw new RangeError('solid.location');finite('solid.massKg',s.solid.massKg,.001,1);finite('solid.c',s.solid.specificHeatJPerKgK,100,5000);finite('solid.tempC',s.solid.tempC,0,95.000001);if(s.solid.massKg!==s.config.solidMassKg||s.solid.specificHeatJPerKgK!==s.config.solidSpecificHeatJPerKgK)throw new RangeError('solid definition');
  if(!['air','water','wall','bath','solid'].includes(s.probe?.placement))throw new RangeError('probe.placement');finite('probe.tempC',s.probe.tempC,0,95.000001);finite('probe.tauS',s.probe.tauS,.1,30);finite('probe.resolutionK',s.probe.resolutionK,.01,1);finite('probe.offsetK',s.probe.offsetK,-5,5);
  if(!['none','pan','cup','ice','solid'].includes(s.scale?.load))throw new RangeError('scale.load');finite('scale.tareKg',s.scale.tareKg,0,3);finite('scale.iceMassKg',s.scale.iceMassKg,0,1);finite('scale.resolutionKg',s.scale.resolutionKg,.0001,.01);
  if(s.cupWaterMassKg>s.config.waterMassKg+1e-10||s.cupWaterMassKg>0&&Math.abs(s.cupTempC-s.config.waterTempC)>1e-8)throw new RangeError('source compartment');if(s.activity==='ice'&&s.iceMassKg+s.iceTrayMassKg>s.config.iceMassKg+1e-10||s.activity==='solid'&&(s.iceMassKg!==0||s.iceTrayMassKg!==0))throw new RangeError('ice compartment');
  if(s.activity==='ice'&&s.solid.location!=='tray')throw new RangeError('inactive solid');
  const expectedMass=s.config.waterMassKg+(s.activity==='ice'?s.config.iceMassKg:s.config.solidMassKg),expectedEnergy=s.config.calorimeterHeatCapacityJPerK*s.config.calorimeterInitialTempC+s.config.waterMassKg*CW*s.config.waterTempC+(s.activity==='ice'?-s.config.iceMassKg*LF:s.config.solidMassKg*s.config.solidSpecificHeatJPerKgK*s.config.solidTempC);
  if(Math.abs(s.initialMassKg-expectedMass)>1e-8||Math.abs(s.initialEnergyJ-expectedEnergy)>1e-6)throw new RangeError('initial ledger');
  const mean=s.waterMassKg>0?(s.nearWaterMassKg*s.nearWaterTempC+s.farWaterMassKg*s.farWaterTempC)/s.waterMassKg:(s.nearWaterTempC+s.farWaterTempC)/2;
  if(Math.abs(s.waterTempC-mean)>1e-7||Math.abs(s.waterVolumeM3-s.waterMassKg/RW)>1e-10)throw new RangeError('derived water state');
  const massResidual=totalMassKg(s)-s.initialMassKg,energyResidual=totalEnergyJ(s)+s.energyOutJ-s.energyInJ-s.initialEnergyJ;
  // Validate reported diagnostics against the ledger; never repair imported data.
  if(Math.abs(s.massResidualKg-massResidual)>1e-12||Math.abs(s.energyResidualJ-energyResidual)>1e-8)throw new RangeError('derived ledger state');
  if(Math.abs(s.waterMassKg-s.nearWaterMassKg-s.farWaterMassKg)>1e-8)throw new RangeError('water nodes');if(s.apparatusGeometryVersion==='thermal.geometry.v2'?s.waterMassKg>maximumWaterMassKg(s)+1e-7:containedVolumeM3(s)>s.config.capacityM3+1e-10)throw new RangeError('capacity');if(Math.abs(massResidual)>1e-7)throw new RangeError('mass balance');if(Math.abs(energyResidual)>1e-4)throw new RangeError('energy balance');
 }catch(e){errors.push(e.message);}return {ok:errors.length===0,valid:errors.length===0,errors};
}
function scaleRawKg(s){switch(s.scale.load){case'pan':return .005;case'cup':return .05+s.cupWaterMassKg;case'ice':return .005+s.scale.iceMassKg;case'solid':return s.solid.massKg;default:return 0;}}
function addWater(s,m,temp){for(const [mk,tk,c]of [['nearWaterMassKg','nearWaterTempC',nearC(s)],['farWaterMassKg','farWaterTempC',farC(s)]]){const a=m/2,e=c*s[tk]+a*CW*temp;s[mk]+=a;s[tk]=e/(c+a*CW);}sync(s);}
// Calibrated well-mixed discharge samples both water nodes proportionally.
// Removing one entire node would spuriously disconnect the thermal circuit.
function spillWater(s,m){let remaining=m;const total=s.nearWaterMassKg+s.farWaterMassKg,fraction=total>0?Math.min(1,m/total):0;for(const [mk,tk]of [['nearWaterMassKg','nearWaterTempC'],['farWaterMassKg','farWaterTempC']]){const take=s.apparatusGeometryVersion==='thermal.geometry.v2'?s[mk]*fraction:Math.min(remaining,s[mk]),e=take*CW*s[tk];s[mk]-=take;s.spillMassKg+=take;s.spillEnergyJ+=e;s.energyOutJ+=e;remaining-=take;}sync(s);}
export function applyAction(state,event){
 if(!validateState(state).ok)return {ok:false,state,reason:'invalid-state'};if(!event||typeof event!=='object'||Array.isArray(event)||('payloadSI' in event&&(!event.payloadSI||typeof event.payloadSI!=='object'||Array.isArray(event.payloadSI))))return {ok:false,state,reason:'invalid-event'};
 const type=event.actionType||event.type,p=event.payloadSI&&typeof event.payloadSI==='object'?event.payloadSI:event,s=clone(state),effects={},reject=reason=>({ok:false,state,reason});
 try{switch(type){
 case'place-vessel':if(p.placed!==undefined&&typeof p.placed!=='boolean')return reject('invalid-placement');s.vesselPlaced=p.placed??true;break;
 case'pour':{const requested=finite('massKg',p.massKg,Number.MIN_VALUE,2);if(!['vessel','table'].includes(p.target))return reject('invalid-target');if(p.target==='vessel'&&!s.vesselPlaced)return reject('vessel-not-placed');if(s.cupWaterMassKg<=0)return reject('cup-empty');const m=Math.min(requested,s.cupWaterMassKg);s.cupWaterMassKg-=m;if(p.target==='table'){const e=m*CW*s.cupTempC;s.spillMassKg+=m;s.spillEnergyJ+=e;s.energyOutJ+=e;effects.spilledMassKg=m;}else{addWater(s,m,s.cupTempC);const excess=Math.max(0,s.apparatusGeometryVersion==='thermal.geometry.v2'?s.waterMassKg-maximumWaterMassKg(s):(containedVolumeM3(s)-s.config.capacityM3)*RW);if(excess>0){spillWater(s,excess);effects.spilledMassKg=excess;}}effects.transferredMassKg=m;break;}
 case'add-ice':{if(s.activity!=='ice')return reject('wrong-activity');const m=finite('massKg',p.massKg,Number.MIN_VALUE,1);if(p.target!=='vessel')return reject('outside-vessel');if(!s.vesselPlaced)return reject('vessel-not-placed');if(m>s.iceTrayMassKg+1e-12)return reject('ice-stock-exceeded');if(s.apparatusGeometryVersion!=='thermal.geometry.v2'&&containedVolumeM3(s)+m/RI>s.config.capacityM3+1e-12)return reject('vessel-full');s.iceTrayMassKg=Math.max(0,s.iceTrayMassKg-m);s.iceMassKg+=m;if(s.apparatusGeometryVersion==='thermal.geometry.v2'){const excess=Math.max(0,s.waterMassKg-maximumWaterMassKg(s));if(excess>0){spillWater(s,excess);effects.spilledMassKg=excess;}}if(s.scale.load==='ice')s.scale.load='none';effects.transferredMassKg=m;break;}
 case'place-probe':if(!['air','water','wall','bath','solid'].includes(p.placement))return reject('invalid-placement');if(p.placement==='water'&&(!s.vesselPlaced||s.waterMassKg<=0))return reject('probe-not-in-water');if(['bath','solid'].includes(p.placement)&&s.activity!=='solid')return reject('wrong-activity');s.probe.placement=p.placement;break;
 case'stir':if(!s.vesselPlaced||s.waterMassKg<=0)return reject('no-liquid-to-stir');s.mixingIntensity=Math.max(s.mixingIntensity,p.intensity===undefined?Math.min(1,finite('turns',p.turns,0,100)*2):finite('intensity',p.intensity,0,1));break;
 case'stop-stir':s.mixingIntensity=0;break;
 case'move-solid':if(s.activity!=='solid')return reject('wrong-activity');if(!['tray','bath','tongs','water','table'].includes(p.target))return reject('invalid-target');if(['bath','water'].includes(p.target)&&s.solid.location!=='tongs')return reject('use-tongs');if(p.target==='water'&&(!s.vesselPlaced||s.waterMassKg<=0))return reject('no-water');if(s.apparatusGeometryVersion!=='thermal.geometry.v2'&&p.target==='water'&&containedVolumeM3(s)+s.solid.massKg/s.config.solidDensityKgM3>s.config.capacityM3+1e-12)return reject('vessel-full');s.solid.location=p.target;if(p.target==='water'&&s.apparatusGeometryVersion==='thermal.geometry.v2'){const excess=Math.max(0,s.waterMassKg-maximumWaterMassKg(s));if(excess>0){spillWater(s,excess);effects.spilledMassKg=excess;}}break;
 case'load-scale':if(!['none','pan','cup','ice','solid'].includes(p.item))return reject('invalid-target');if(p.item==='solid'&&s.activity!=='solid'||p.item==='ice'&&s.activity!=='ice')return reject('wrong-activity');if(p.item==='ice')s.scale.iceMassKg=finite('massKg',p.massKg,0,s.iceTrayMassKg);s.scale.load=p.item;break;
 case'tare':s.scale.tareKg=scaleRawKg(s);break;
 case'calibrate-probe':s.probe.offsetK=finite('offsetK',p.offsetK,-5,5);break;
 default:return reject('unknown-action');
 }}catch{return reject('invalid-payload');}sync(s);if(!validateState(s).ok)return reject('invalid-result');return {ok:true,state:s,reason:effects.spilledMassKg?'water-spilled':'ok',effects};
}
function exchange(ta,tb,ca,cb,k,dt){return ca>0&&cb>0?(ta-tb)/(1/ca+1/cb)*(-Math.expm1(-k*(1/ca+1/cb)*dt)):0;}
function substep(s,dt){
 const stir=s.mixingIntensity;{
  if(s.activity==='ice'&&s.iceMassKg>0&&nearC(s)>0){const q=Math.min(s.iceMassKg*LF,nearC(s)*s.nearWaterTempC,(1.5+15*stir)*s.nearWaterTempC*dt);if(q>0){const e=nearC(s)*s.nearWaterTempC-q;s.iceMassKg=Math.max(0,s.iceMassKg-q/LF);s.nearWaterMassKg+=q/LF;s.nearWaterTempC=e/nearC(s);}}
  if(s.activity==='solid'&&s.solid.location==='water'){const cs=s.solid.massKg*s.solid.specificHeatJPerKgK,cn=nearC(s),q=exchange(s.solid.tempC,s.nearWaterTempC,cs,cn,2+12*stir,dt);s.solid.tempC-=q/cs;if(cn>0)s.nearWaterTempC+=q/cn;}
  const cn=nearC(s),cf=farC(s),q=exchange(s.farWaterTempC,s.nearWaterTempC,cf,cn,.5+40*stir,dt);if(cn>0)s.nearWaterTempC+=q/cn;if(cf>0)s.farWaterTempC-=q/cf;
 }
 if(s.activity==='solid'){const cs=s.solid.massKg*s.solid.specificHeatJPerKgK;
  if(s.solid.location==='bath'){const q=cs*(s.config.bathTempC-s.solid.tempC)*(-Math.expm1(-10/cs*dt));s.solid.tempC+=q/cs;if(q>=0)s.energyInJ+=q;else s.energyOutJ-=q;}
  else if(['tongs','table','tray'].includes(s.solid.location)&&s.config.solidAirCoolingWPerK>0){const q=cs*(s.solid.tempC-s.config.ambientTempC)*(-Math.expm1(-s.config.solidAirCoolingWPerK/cs*dt));s.solid.tempC-=q/cs;if(q>=0)s.energyOutJ+=q;else s.energyInJ-=q;}
 }
 // Melting of an emergent grounded ice block can raise the liquid above the brim.
 // Account for actual discharged water and its node-weighted enthalpy, never clamp mass.
 if(s.apparatusGeometryVersion==='thermal.geometry.v2'&&s.activity==='ice'){s.waterMassKg=s.nearWaterMassKg+s.farWaterMassKg;const excess=Math.max(0,s.waterMassKg-maximumWaterMassKg(s));if(excess>0)spillWater(s,excess);}
 let t=s.config.ambientTempC;if(s.probe.placement==='water'&&s.vesselPlaced&&s.nearWaterMassKg>0)t=s.nearWaterTempC;else if(s.probe.placement==='wall')t=s.farWaterTempC;else if(s.probe.placement==='bath'&&s.activity==='solid')t=s.config.bathTempC;else if(s.probe.placement==='solid'&&s.activity==='solid')t=s.solid.tempC;
 s.probe.tempC+=(t-s.probe.tempC)*(-Math.expm1(-dt/s.probe.tauS));s.mixingIntensity*=Math.exp(-dt/4);s.timeS+=dt;
}
export function step(state,dtSeconds){if(!validateState(state).ok)throw new RangeError('invalid-state');finite('dtSeconds',dtSeconds,0,60);const s=clone(state),n=Math.ceil(dtSeconds/CONSTANTS.maxStepS),dt=n?dtSeconds/n:0;for(let i=0;i<n;i++)substep(s,dt);return sync(s);}
export function observe(s){
 if(!validateState(s).ok)throw new RangeError('invalid-state');const water=s.probe.placement==='water'&&s.vesselPlaced&&s.waterMassKg>0,bath=s.probe.placement==='bath'&&s.activity==='solid',solid=s.probe.placement==='solid'&&s.activity==='solid',valid=water||bath||solid,representative=!water||Math.abs(s.nearWaterTempC-s.farWaterTempC)<=.2,reading=round(s.probe.tempC+s.probe.offsetK,s.probe.resolutionK);
 return {valid,representative,probePlacement:s.probe.placement,status:!valid?(s.probe.placement==='wall'?'probe-on-wall':'probe-not-in-water'):!representative?'not-uniform':'ok',temperatureC:valid?reading:null,displayTemperatureC:valid?reading:null,probeTemperatureC:s.probe.tempC,probeTemperatureK:s.probe.tempC+273.15,trueWaterTemperatureC:s.waterMassKg>0?s.waterTempC:null,trueWaterTemperatureK:s.waterMassKg>0?s.waterTempC+273.15:null,nearWaterTemperatureC:s.nearWaterTempC,farWaterTemperatureC:s.farWaterTempC,waterMassKg:s.waterMassKg,waterVolumeM3:s.waterVolumeM3,iceMassKg:s.iceMassKg,iceTrayMassKg:s.iceTrayMassKg,cupWaterMassKg:s.cupWaterMassKg,solidTemperatureC:s.activity==='solid'?s.solid.tempC:null,solidTemperatureK:s.activity==='solid'?s.solid.tempC+273.15:null,scaleReadingKg:round(scaleRawKg(s)-s.scale.tareKg,s.scale.resolutionKg),scaleResolutionKg:s.scale.resolutionKg,probeResolutionK:s.probe.resolutionK,probeTauS:s.probe.tauS,probeRangeC:{min:-10,max:110},scaleRangeKg:{min:-3,max:3},simTimeS:s.timeS,energyInJ:s.energyInJ,energyOutJ:s.energyOutJ,energyResidualJ:s.energyResidualJ,massResidualKg:s.massResidualKg,phase:s.iceMassKg>1e-10?'ice-and-water':'liquid',mixingIntensity:s.mixingIntensity};
}
export function equilibrium(activity,input={}){
 const c=validateConfig(activity,input),wc=c.waterMassKg*CW+c.calorimeterHeatCapacityJPerK,we=c.waterMassKg*CW*c.waterTempC+c.calorimeterHeatCapacityJPerK*c.calorimeterInitialTempC;
 if(activity==='ice'){if(we<c.iceMassKg*LF)return {temperatureC:0,temperatureK:273.15,iceMassRemainingKg:c.iceMassKg-we/LF,waterMassKg:c.waterMassKg+we/LF};const capacity=wc+c.iceMassKg*CW,t=capacity>0?(we-c.iceMassKg*LF)/capacity:0;return {temperatureC:t,temperatureK:t+273.15,iceMassRemainingKg:0,waterMassKg:c.waterMassKg+c.iceMassKg};}
 const capacity=wc+c.solidMassKg*c.solidSpecificHeatJPerKgK,t=(we+c.solidMassKg*c.solidSpecificHeatJPerKgK*c.solidTempC)/capacity;return {temperatureC:t,temperatureK:t+273.15,iceMassRemainingKg:0,waterMassKg:c.waterMassKg};
}
// Closed equilibrium of materials already in the vessel, excluding unpoured/unadded stocks.
export function equilibriumFromState(s){
 if(!validateState(s).ok)throw new RangeError('invalid-state');
 const waterEnergy=nearC(s)*s.nearWaterTempC+farC(s)*s.farWaterTempC;
 if(s.activity==='ice'){
  const energy=waterEnergy-s.iceMassKg*LF;
  if(energy<0)return {temperatureC:0,temperatureK:273.15,iceMassRemainingKg:-energy/LF,waterMassKg:s.waterMassKg+s.iceMassKg+energy/LF,participatingSolid:false};
  const capacity=(s.waterMassKg+s.iceMassKg)*CW+s.config.calorimeterHeatCapacityJPerK,t=capacity>0?energy/capacity:null;
  return {temperatureC:t,temperatureK:t===null?null:t+273.15,iceMassRemainingKg:0,waterMassKg:s.waterMassKg+s.iceMassKg,participatingSolid:false};
 }
 const included=s.solid.location==='water',cs=included?s.solid.massKg*s.solid.specificHeatJPerKgK:0,capacity=nearC(s)+farC(s)+cs,t=capacity>0?(waterEnergy+cs*s.solid.tempC)/capacity:null;
 return {temperatureC:t,temperatureK:t===null?null:t+273.15,iceMassRemainingKg:0,waterMassKg:s.waterMassKg,participatingSolid:included};
}
export const limitations=Object.freeze(['Two lumped water nodes; finite conductance is illustrative, not calibrated calorimetry or CFD.','Ice starts at 0 C; no supercooling, evaporation, boiling or below-zero ice.','Calorimeter heat capacity is split between nodes; its initial temperature must be specified.','Probe has zero heat-capacity backreaction, first-order response and finite resolution; water placement measures the near node.','Insulated vessel; optional Newton cooling affects a solid in air only. Bath energy and spills are accounted.','Scale container masses: cup 0.050 kg and pan 0.005 kg. No random measurement noise.']);
