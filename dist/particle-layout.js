// These are graphical samples, not hard-sphere collision/pressure solvers.
// Their display radius never participates in pV=nRT or molecular rms speed.
export const PARTICLE_DISPLAY_RADIUS=.075;
export const reflectedPhase=x=>{const f=((x%2)+2)%2;return f>1?2-f:f;};
export function gasDisplayLayout(volume){
 const width=volume*.5,radius=Math.min(PARTICLE_DISPLAY_RADIUS,width*.18);
 return {width,radius,xSpan:Math.max(0,width-2*radius),yMin:.1+radius,ySpan:2.5-2*radius,zSpan:2-2*radius};
}
export function boyleDisplayLayout(volume){
 const width=volume*.5,capThickness=Math.min(.12,width*.25),innerLeft=-2.5+capThickness/2,innerRight=-2.5+width-capThickness/2;
 const radius=Math.min(PARTICLE_DISPLAY_RADIUS,(innerRight-innerLeft)*.18);
 return {width,capThickness,innerLeft,innerRight,radius,xMin:innerLeft+radius,xSpan:Math.max(0,innerRight-innerLeft-2*radius),radialMax:.88-radius};
}
