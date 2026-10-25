import {evaluate} from './models.js?v=54';
import {axisExtent,interferenceWindow} from './simulation-space.js?v=43';
import {trackLayout} from './track-layout.js?v=54';
const axis=(key,unit,scale,range)=>({key,unit,scale,range});
// World-to-physical mappings are taken from the corresponding apparatus builders.
// A display scale is not silently interpreted as metres.
const orientationIds=new Set('incline pendulum lever hooke collision magnetic lorentz solenoid vector_sum vector_components relative_motion gravitational_force orbit escape_speed kepler torque_angle rotational_inertia angular_accel rolling beam_supports three_strings collision_2d angular_momentum gyroscope rotating_planet elliptic_orbit binary_orbit tidal_gradient charged_ring charged_rod charged_disk charged_solid_sphere charged_plane equipotential_map three_charge_energy electric_work_paths dipole_torque uniform_field potential_point potential_pair loop_axis helmholtz_coils finite_solenoid toroid compass_coil velocity_selector mass_spectrometer cyclotron magnetic_helix em_plane_wave poynting_energy prism lens mirror reflection refraction tir ray_slab grating young diffraction polarization'.split(' '));
export function coordinateProfile(id,s={}){
 const x=(unit,scale,range)=>axis('x',unit,scale,range),y=(key,unit,scale,range)=>axis(key,unit,scale,range);
 const flight=['horizontal','projectile'].includes(id)&&Number.isFinite(s.v0)?evaluate(id,s):null;
 const track=trackLayout(id,s),water=interferenceWindow(s);
 const profiles={
  electric:{origin:[0,0,0],axes:[x('m',8,[-axisExtent(.3,Math.max(Math.abs(s.x1||0),Math.abs(s.x2||0),Math.abs(s.px||0))),axisExtent(.3,Math.max(Math.abs(s.x1||0),Math.abs(s.x2||0),Math.abs(s.px||0)))]),y('y','m',8,[-.25,.25]),axis('z','m',8,[-.25,.25])],plane:'front'},
  energy:{origin:[-1.7,.25,0],axes:[y('h','m',.2,[0,axisExtent(20,s.h0)])],plane:'front'},
  oscillation:{origin:[0,.62,0],axes:[x('cm',.12,[-axisExtent(10,Math.abs(s.a)),axisExtent(10,Math.abs(s.a))])],plane:'front'},
  damped:{origin:[0,.6,0],axes:[x('cm',.15,[-axisExtent(10,Math.abs(s.a)),axisExtent(10,Math.abs(s.a))])],plane:'front'},
  wave:{origin:[-3,1.3,0],axes:[x('m',1,[0,6]),y('u','cm',.7,[-axisExtent(1,Math.abs(s.a)),axisExtent(1,Math.abs(s.a))])],plane:'front'},
  standing:{origin:[-3,1.4,0],axes:[x('m',6/Math.max(.001,s.length||4),[0,s.length||4]),y('u','cm',.9,[-Math.max(.2,2*(s.a||.2)),Math.max(.2,2*(s.a||.2))])],plane:'front'},
  uniform:track&&{origin:[track.origin,.22,0],axes:[x('m',track.scale,track.range)],plane:'front'},
  acceleration:track&&{origin:[track.origin,.22,0],axes:[x('m',track.scale,track.range)],plane:'front'},
  newton:track&&{origin:[track.origin,.22,0],axes:[x('m',track.scale,track.range)],plane:'front'},
  horizontal:{origin:[-3,.35,0],axes:[x('m',.2,[0,axisExtent(30,flight?.range)]),y('y','m',.2,[0,axisExtent(20,s.h0)])],plane:'front'},
  projectile:{origin:[-3,.35,0],axes:[x('m',.48,[0,axisExtent(12,flight?.range)]),y('y','m',.48,[0,axisExtent(8,flight?.height)])],plane:'front'},
  circular:{origin:[0,.3,0],axes:[x('m',1,[-(s.radius||1.5),(s.radius||1.5)]),axis('z','m',1,[-(s.radius||1.5),(s.radius||1.5)])],plane:'top'},
  interference:{origin:[0,.65,-1.7],axes:[x('m',1,[-water.x,water.x]),axis('z','m',1,[0,water.z])],plane:'top'}
 };
 if(profiles[id])return {...profiles[id],metric:true,note:'Vạch chia theo đại lượng và đơn vị ghi trên từng trục. Tỉ lệ các trục có thể khác nhau.'};
 if(orientationIds.has(id))return {origin:[0,0,0],axes:[x('',1,[-2,2]),y('y','',1,[0,3]),axis('z','',1,[-2,2])],plane:'front',metric:false,note:'Trục định hướng của hình minh họa; không dùng chiều dài trên hình để đọc số đo.'};
 return null;
}
export function hasCoordinateGrid(profile){return !!profile&&profile.axes.length>1;}
