// Model B: l1/l2 are absolute perpendicular arms of vertical weight forces.
// World display distances use one common scale; tilt only illustrates the sign
// of the moment imbalance, not a time-integrated rotational trajectory.
export const LEVER_SCALE=1.3;
export function leverGeometry(state,netMoment){
 const angle=Math.max(-.22,Math.min(.22,netMoment*.012)),cos=Math.cos(angle),sin=Math.sin(angle);
 const arms=[-state.l1*LEVER_SCALE,state.l2*LEVER_SCALE],margin=.35,pivotY=1.7;
 const left=(arms[0]-margin)/cos,right=(arms[1]+margin)/cos;
 const loads=arms.map((x,i)=>{
  const scale=Math.max(.55,Math.min(1.4,.8*Math.cbrt(i?state.m2:state.m1))),height=.45*scale;
  // The cable meets the underside of the inclined beam, at the prescribed
  // horizontal moment arm. Loads hang vertically and remain upright.
  const y=pivotY+x*Math.tan(angle)-.06/cos,z=i?.3:-.3;
  return {x,z,attachmentY:y,weightY:y-.36-height/2,scale,height,localX:(x-.06*sin)/cos};
 });
 return {angle,pivotY,left,right,center:(left+right)/2,length:right-left,loads};
}
