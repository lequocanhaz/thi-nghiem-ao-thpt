// English learning copy for all 300 lab IDs. This is an original guided investigation,
// NOT a literal translation of the six Vietnamese editorial fields in each lesson.
// Scientific variables and formulas remain owned by the original simulation catalog.
import {dictionaries} from './i18n.js?v=54';
const titles=dictionaries['en-US'].experiments;
const topics={
 'Cơ học':{name:'Mechanics',knowledge:'Distinguish displacement from distance and velocity from speed; specify the reference frame and the positive direction.',caution:'Visual scale, camera angle and object speed are not measurement instruments. Interpret the numerical readouts and sign conventions.'},
 'Dao động':{name:'Oscillations',knowledge:'Review period, frequency, amplitude and phase. Decide whether damping or driving is part of the present model.',caution:'A periodic-looking animation does not by itself demonstrate simple harmonic motion. Check the stated mathematical relationship.'},
 'Sóng':{name:'Waves',knowledge:'Distinguish propagation from the motion of a medium particle. Review period, frequency, wavelength and phase.',caution:'Do not infer the real wave speed from a slowed-down illustration; use values and units from the model.'},
 'Quang học':{name:'Optics',knowledge:'Measure ray angles from the normal and distinguish ray optics from wave optics.',caution:'A drawn ray or image is a model representation. Check the sign convention and whether a real or virtual image is predicted.'},
 'Điện trường':{name:'Electrostatics',knowledge:'Review charge signs, vector superposition, potential difference and electric-field direction.',caution:'Vector arrows and field lines encode direction and relative magnitude; their drawn lengths are not direct measurements.'},
 'Dòng điện':{name:'Electric circuits',knowledge:'Review potential difference, conventional current, circuit resistance and energy conservation.',caution:'An ideal component model can omit lead resistance, heating and internal resistance. Check the assumptions before generalizing.'},
 'Điện từ':{name:'Electromagnetism',knowledge:'Distinguish magnetic-field direction from force direction; review flux and the relevant sign conventions.',caution:'Use the right-hand rule and algebraic signs; a 3D perspective can make directions appear misleading.'},
 'Vật lí nhiệt':{name:'Thermal physics',knowledge:'Distinguish temperature, heat, internal energy and work, using the specified sign convention.',caution:'Check whether heat loss, material heat capacity and phase changes are included in the model.'},
 'Khí lí tưởng':{name:'Ideal gases',knowledge:'Use absolute temperature in kelvin and distinguish pressure, volume and amount of substance.',caution:'Illustrative particles are not a literal count of molecules. State which variables are held fixed.'},
 'Chất lưu':{name:'Fluids',knowledge:'Review density, hydrostatic pressure, buoyancy and energy balance.',caution:'Check whether the liquid is assumed incompressible and whether the model neglects viscosity or turbulence.'},
 'Hạt nhân':{name:'Nuclear physics',knowledge:'Review activity, half-life, conservation laws and the meaning of expected values.',caution:'An expected particle count is not the same as one stochastic realization. Check the scale of the simulated sample.'},
 'Vật lí hiện đại':{name:'Modern physics',knowledge:'Distinguish classical approximations from quantum or relativistic assumptions; track electronvolt and SI units.',caution:'Do not interpret a schematic quantum object as an exact trajectory unless the model explicitly defines it.'}
};
const symbols={
 mass:'Mass',m:'Mass',force:'Force',f:'Frequency',u:'Voltage',v:'Velocity / volume',speed:'Speed',
 v0:'Initial velocity',a:'Amplitude / acceleration',acc:'Acceleration',h0:'Initial height',t:'Time',
 tK:'Temperature',T:'Temperature',p:'Pressure',r:'Resistance / radius',r1:'Resistance R₁',r2:'Resistance R₂',
 c:'Capacitance / speed of light',k:'Stiffness / coefficient',b:'Magnetic flux density',i:'Current',
 q1:'Charge q₁',q2:'Charge q₂',q0:'Test charge q₀',px:'Observation x-coordinate',py:'Observation y-coordinate',
 pz:'Observation z-coordinate',length:'Length',angle:'Angle',half:'Half-life',n0:'Initial count',
 turns:'Number of turns',area:'Area',separation:'Separation',phase:'Phase',period:'Period',
 amplitude:'Amplitude',radius:'Radius',beta:'Damping coefficient',mu:'Coefficient of friction',
 position:'Position',distance:'Distance',width:'Width',height:'Height',volume:'Volume',pressure:'Pressure',
 temperature:'Temperature',frequency:'Frequency',wavelength:'Wavelength',energy:'Energy',power:'Power',
 charge:'Charge',current:'Current',time:'Time',resistance:'Resistance',voltage:'Voltage',
 density:'Density',index:'Refractive index',focal:'Focal length'
};
const starts=[
 [/^Khối lượng/i,'Mass'],[/^Trọng lượng/i,'Weight'],[/^Lực /i,'Force '],
 [/^Lực/i,'Force'],[/^Biên độ/i,'Amplitude'],[/^Tần số góc/i,'Angular frequency'],
 [/^Tần số/i,'Frequency'],[/^Chu kì bán rã/i,'Half-life'],[/^Chu kì/i,'Period'],
 [/^Thời điểm/i,'Time'],[/^Thời gian/i,'Time'],[/^Nhiệt độ/i,'Temperature'],
 [/^Áp suất/i,'Pressure'],[/^Thể tích/i,'Volume'],[/^Điện áp/i,'Voltage'],
 [/^Hiệu điện thế/i,'Potential difference'],[/^Điện trở/i,'Resistance'],
 [/^Điện dung/i,'Capacitance'],[/^Điện tích/i,'Electric charge'],
 [/^Cường độ dòng điện/i,'Electric current'],[/^Dòng điện/i,'Current'],
 [/^Cường độ điện trường/i,'Electric field strength'],[/^Cảm ứng từ/i,'Magnetic flux density'],
 [/^Từ thông/i,'Magnetic flux'],[/^Tốc độ/i,'Speed'],[/^Vận tốc/i,'Velocity'],
 [/^Gia tốc/i,'Acceleration'],[/^Độ cao/i,'Height'],[/^Độ dài/i,'Length'],
 [/^Chiều dài/i,'Length'],[/^Góc /i,'Angle '],[/^Góc/i,'Angle'],
 [/^Khoảng cách/i,'Distance'],[/^Bán kính/i,'Radius'],[/^Hệ số/i,'Coefficient'],
 [/^Hoành độ/i,'x-coordinate'],[/^Tung độ/i,'y-coordinate'],
 [/^Tọa độ/i,'Coordinate'],[/^Số vòng/i,'Number of turns'],[/^Diện tích/i,'Area'],
 [/^Bước sóng/i,'Wavelength'],[/^Số hạt/i,'Particle count'],[/^Lượng chất/i,'Amount of substance'],
 [/^Thời gian sống/i,'Lifetime'],[/^Công suất/i,'Power'],[/^Năng lượng/i,'Energy']
];
export const englishTopic=topic=>topics[topic]?.name||'Physics';
export const englishTitle=id=>titles[id]?.shortTitle||id;
export function englishParameter(param,index=0){
 const original=String(param?.label||'').trim();
 const symbol=String(param?.key||'parameter');
 // Retain the original symbol when it is an explicit terminal token.
 for(const [pattern,replacement] of starts){
  if(pattern.test(original)){
   const suffix=original.replace(pattern,'').trim();
   if(!suffix)return replacement+(param?.unit?' ('+param.unit+')':'');
   // Vietnam-specific suffixes cannot be safely machine translated. Use the known stable identifier.
   return replacement+' · '+(symbols[symbol]&&symbols[symbol]!==replacement?symbols[symbol]+' / ':'')+symbol;
  }
 }
 return (symbols[symbol]||'Variable '+(index+1))+' · '+symbol;
}
const explicit={
 energy:{principle:'Mechanical energy is the sum of kinetic and potential energies. For the free-fall model, gravity converts potential energy into kinetic energy while their sum remains constant.',test:'Compare the total energy at several different times. Then change the initial height while keeping the mass fixed.'},
 oscillation:{principle:'For ideal simple harmonic motion, acceleration points toward equilibrium and is proportional to the negative displacement.',test:'Compare displacement, velocity and acceleration at the two turning points and at equilibrium.'},
 wave:{principle:'In this transverse wave model, the disturbance propagates while individual medium particles oscillate about their equilibrium positions.',test:'Keep propagation speed constant while varying frequency, and check the relation between wavelength and frequency.'},
 electric:{principle:'The electric field at an observation point is the vector sum of the contributions from individual charges. A positive test charge experiences force in the field direction.',test:'Vary charge signs and positions, compare component vectors and their resultant, and check how the field changes with distance.'},
 ohm:{principle:'For an ohmic resistor under constant conditions, the current is proportional to the applied potential difference. In an I–U graph, the slope is 1/R.',test:'Record current for several voltages at fixed resistance. Repeat with a second resistance and compare slopes.'},
 capacitor:{principle:'In an ideal RC circuit, charging and discharging are time-dependent processes controlled by the time constant R C.',test:'Compare capacitor voltage at one and two time constants, then change R or C while keeping the other fixed.'},
 boyle:{principle:'For a fixed amount of ideal gas at constant absolute temperature, pressure is inversely proportional to volume.',test:'Record at least five pressure–volume pairs and compare their pV products.'},
 gas:{principle:'The ideal-gas equation links pressure, volume, amount of substance and absolute temperature.',test:'Hold two quantities fixed, vary a third, and examine which other quantity changes.'},
 lever:{principle:'For static rotational equilibrium, clockwise and anticlockwise torques about the pivot balance. Torque depends on the perpendicular lever arm.',test:'Move one hanging mass along the beam and compare torques without letting the object slide off the model beam.'},
 magnetic:{principle:'The magnetic force on a current-carrying straight conductor depends on the current, field strength, active length and the angle to the field.',test:'Compare force for 0°, 90° and 180°, and reverse the current direction.'},
 induction:{principle:'A changing magnetic flux through a coil induces an electromotive force. Its sign reflects Lenz’s law.',test:'Vary the rate of flux change and the number of turns, then compare peak induced emf.'},
 decay:{principle:'The expected population of undecayed nuclei decreases exponentially, with half of the expected population remaining after each half-life.',test:'Record the expected population at 0, one, and two half-lives, and compare ratios.'}
};
export function englishStudy(e){
 const title=englishTitle(e.id);
 const topic=topics[e.topic]||{name:'Physics',knowledge:'Review the relevant physical quantities and their SI units.',caution:'Consider the limits and assumptions of the mathematical model.'};
 const extra=explicit[e.id];
 const params=(e.params||[]).filter(p=>p.key!=='t');
 const control=(e.lesson?.controlKey&&params.find(p=>p.key===e.lesson.controlKey))||params[0]||e.params?.[0];
 const controlName=control?englishParameter(control):'the independent variable';
 const fixed=params.filter(p=>p!==control).slice(0,4).map(englishParameter);
 const formula=String(e.formula||'').replace(/hằng số/gi,'constant').replace(/không đổi/gi,'constant');
 const domainNotes=topic.caution;
 return {
  title,topic:topic.name,goal:'Investigate '+title.toLowerCase()+' by varying a controlled input, reading model outputs and interpreting the corresponding graph.',
  scope:e.extra?'Advanced model: review the mathematical and physical assumptions before using the result.':'High-school investigation using a simplified scientific model.',
  prerequisite:topic.knowledge,
  explanation:extra?.principle||('This interactive model explores '+title.toLowerCase()+'. Use the actual numerical readouts and the displayed relation to compare predictions with calculated outcomes.'),
  controlLabel:controlName,controlUnit:control?.unit||'',
  fixed:fixed.length?fixed:['Other initial conditions and model settings'],
  investigation:extra?.test||('Vary '+controlName+' systematically through valid values; observe the response and record comparable states.'),
  evidence:'All readouts are generated by the programmed model. Agreement with its formula is an internal consistency check, not independent experimental validation.',
  misconception:domainNotes,
  question:'What changes when you vary '+controlName+' while keeping the other initial conditions fixed? Support your answer with measurements and describe any limitations.',
  answer:'Compare measurements obtained under the same fixed conditions. State the trend, units and model assumptions; use the displayed formula where applicable. Numerical conclusions require your recorded data.',
  formula,notes:'The original Vietnamese lesson contains more detailed model-specific instructions and explanations. This English study guide is a separately authored learning aid, not a sentence-by-sentence certified translation.',
  references:e.lesson?.sources||[],
  sourceScope:'Reference links discuss underlying physics. The specific simulation and its exercise sequence must be interpreted within this model’s stated limits.'
 };
}
export function englishIntro(e){
 const q=englishStudy(e);
 return 'Welcome to '+q.title+'. '+q.explanation+' '+q.investigation+' Check all numerical results against the model assumptions.';
}
