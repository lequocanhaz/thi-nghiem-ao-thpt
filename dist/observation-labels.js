import {scientificNumber} from './number-format.js?v=66';
// Explicit names preserve context: e.g. "half" in a dipole is not a half-life.
export const foundationAxisLabels=Object.freeze({
 vector_sum:['Angle between forces','Resultant force'],vector_components:['Angle to x-axis','Force along x'],
 relative_motion:['Time','Object position'],average_speed:['Second-leg speed','Average speed'],braking:['Time','Current speed'],
 atwood:['Right-hand mass','Signed acceleration'],pulley:['Supporting rope branches','Pulling force'],elevator:['Upward acceleration','Scale reading'],
 torque_angle:['Force-to-beam angle','Torque'],spring_energy:['Extension','Elastic potential energy'],hydraulic_press:['Large piston area','Output force'],
 communicating:['Second liquid density','Second column height'],spring_period:['Mass','Period'],oscillator_energy:['Time','Kinetic energy'],
 phase_difference:['Time','Total displacement'],string_speed:['Tension','Wave speed'],string_resonance:['Harmonic order','Harmonic frequency'],
 sound_level:['Exponent of I in W/m²','Sound intensity level'],intensity_distance:['Distance from source','Intensity'],standing_phase:['Time','Displacement at probe'],
 reflection_wave:['Time','Total displacement'],uniform_field:['Charge','Signed electric force'],potential_point:['Distance from source','Potential'],
 potential_pair:['Probe x-coordinate','Total potential'],capacitor_plate:['Plate separation','Capacitance'],dielectric:['Relative permittivity','Charge'],
 capacitor_series:['Capacitance C₂','Voltage across C₁'],capacitor_parallel:['Capacitance C₂','Charge on C₂'],charge_quantization:['Excess electron count','Signed charge'],
 drift:['Current','Drift speed magnitude'],wire_stretch:['New-to-original length ratio','New resistance'],potentiometer:['Fraction of wire used','Wiper voltage'],
 voltage_divider:['Load resistance','Loaded output voltage'],meter_loading:['Voltmeter resistance','Relative voltage decrease'],
 battery_series:['Cell count','Load current'],battery_parallel:['Cell count','Load current'],wire_field:['Distance from wire','Signed magnetic field'],
 flux_angle:['Field-to-normal angle','Signed magnetic flux'],binding_energy:['Mass defect','Binding energy'],table_hanging:['Hanging mass','Acceleration'],
 contact_carts:['Applied force','Contact force'],accelerating_pendulum:['Cart acceleration','Angle from vertical'],double_incline:['Right slope angle','Acceleration toward right'],
 ladder_balance:['Position along ladder','Wall force'],beam_supports:['Load position / beam length','Right support reaction'],three_strings:['Left string angle to horizontal','Left tension'],
 slide_tip:['Force application height','Tipping force'],collision_2d:['Incident ball deflection','First ball speed after collision'],ballistic_pendulum:['Projectile speed','Rise after collision'],
 collision_spring:['Incident cart speed','Maximum compression'],string_power:['Wave amplitude','Mean power'],three_charge_energy:['Third charge','System energy'],
 electric_work_paths:['Detour height','Work along detour'],isolated_dielectric:['Relative permittivity','Voltage after insertion'],ammeter_shunt:['Full-scale current','Required shunt resistance'],
 voltmeter_design:['Full-scale voltage','Series resistance'],charge_sharing:['Initial C₁ voltage','Final common voltage'],sliding_rod:['Signed rod velocity','Magnetic force along motion'],
 magnetic_braking:['Time','Remaining speed'],coil_entering_field:['Time','Flux linkage'],layered_wall:['First layer thickness','Interface temperature']
});
export function observationAxisLabel(label,english){
 const text=String(label??'').replaceAll('U_C','U(C)');
 if(!english)return text;
 return text.replace('m nóng','Hot mass').replace('T cân bằng','Equilibrium T').replace('R tải','Load R').replace('V chìm / V','Submerged V / V');
}
export function observationNumber(value,locale='vi-VN',axis=false){
 if(!Number.isFinite(value))return '—';
 const a=Math.abs(value);
 if(a!==0&&(a>=1e4||a<.001))return scientificNumber(value,{locale,digits:axis?1:4,compact:axis});
 return new Intl.NumberFormat(locale,{maximumSignificantDigits:axis?3:5}).format(value);
}
