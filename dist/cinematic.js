export const POSTER_URL=new URL('./images/cinematic-space.webp',import.meta.url).href;
export const POSTER_SIZE={width:1672,height:941};
export function renderDimensions(width,height,{resolution='adaptive',quality='high',pixelRatio=1}={}){
 if(resolution==='fullhd')return {width:1920,height:1080};
 const w=Math.max(1,Number.isFinite(width)?width:1),h=Math.max(1,Number.isFinite(height)?height:1),scale=Math.min(quality==='low'?1:Math.max(1,pixelRatio),1920/w,1080/h);
 return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))};
}
export function cinematicPose(time=0,spread=.35,pointer={x:0,y:0}){
 const finite=(v,d=0)=>Number.isFinite(v)?v:d,s=Math.max(0,Math.min(1,finite(spread,.35)));
 return {clock:finite(time),roll:(s-.35)*.12,strength:.3+s*.7,x:Math.max(-1,Math.min(1,finite(pointer.x))),y:Math.max(-1,Math.min(1,finite(pointer.y)))};
}
export const cinematicVertex=`varying vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
export const cinematicFragment=`precision highp float;
 varying vec2 screenUV;uniform sampler2D poster;uniform vec2 resolution;uniform vec2 pointer;
 uniform float clock;uniform float roll;uniform float strength;uniform float ready;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 float fbm(vec2 p){return noise(p)*.55+noise(p*2.03)*.28+noise(p*4.11)*.12;}
 void main(){
  if(ready<.5)discard;
  float aspect=resolution.x/resolution.y;float imageAspect=1672.0/941.0;
  vec2 q=screenUV-.5;q.x*=aspect;float a=roll+pointer.x*.018;float c=cos(a),s=sin(a);q=mat2(c,-s,s,c)*q;q.x/=aspect;
  float zoom=.97/(abs(c)+abs(s)*max(aspect,1.0/aspect));vec2 uv=q*zoom+.5;float sx=min(1.,aspect/imageAspect),sy=min(1.,imageAspect/aspect);uv=(uv-.5)*vec2(sx,sy)+vec2(.5+(aspect<1.0?.27:.16)*(1.-sx),.5);
  vec2 fromHole=(uv-vec2(.706,.595))*vec2(imageAspect,1.);float radius=length(fromHole);
  vec3 base=texture2D(poster,uv).rgb;
  float warmth=smoothstep(.14,.52,base.r-base.b*.35);float gas=warmth*smoothstep(.125,.21,radius);
  float t=clock*.045;float n=fbm(uv*24.0+vec2(-t,t*.17));
  vec2 flow=vec2(n-.5,noise(uv*37.0-vec2(t*.3,t))-.5)*.007*gas*strength;
  float depth=mix(.0018,.009,1.-smoothstep(.12,.8,radius));
  uv+=flow+pointer*depth;
  vec3 color=texture2D(poster,clamp(uv,.001,.999)).rgb;
  float filament=sin(uv.x*145.0+uv.y*97.0-clock*.65+fbm(uv*46.0)*8.0);
  color*=1.+gas*strength*(filament*.025+sin(clock*.22+radius*27.0)*.016);
  float blue=max(0.,color.b-color.r);color+=vec3(.007,.013,.02)*blue*sin(clock*.1);
  gl_FragColor=vec4(color,1.0);
  #include <colorspace_fragment>
 }`;
