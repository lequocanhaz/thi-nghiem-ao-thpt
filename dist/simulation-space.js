// Linear workspace dimensions and camera travel are ten times the original studio.
// This changes the view, never a physical parameter or its unit mapping.
export const SPACE_FACTOR=10;
export const STUDIO_SIZE=18*SPACE_FACTOR;
export const STUDIO_DIVISIONS=36*SPACE_FACTOR;
export const FLOOR_SIZE=35*SPACE_FACTOR;
export const MIN_SPACE_ZOOM=.25/SPACE_FACTOR;
export function axisExtent(baseline,needed){
 if(!Number.isFinite(needed)||needed*1.08<=baseline)return baseline;
 const target=Math.max(baseline,Number.isFinite(needed)?needed*1.08:baseline);
 const step=10**Math.floor(Math.log10(target))/2;
 return Math.ceil(target/step)*step;
}
