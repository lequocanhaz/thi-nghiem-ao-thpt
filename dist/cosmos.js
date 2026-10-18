import {T,V} from './geometry-kit.js?v=32';

// An artistic, non-metric introduction. No output from this scene is used as lab data.
const TAU=Math.PI*2;
export function seededStars(count=680){
 let seed=7391;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 return Array.from({length:count},()=>({x:(random()-.5)*42,y:(random()-.5)*28,z:-5-random()*26,size:.3+random()*.85,alpha:.2+random()*.65}));
}
export function cosmosPose(time=0,spread=.35){
 const t=Number.isFinite(time)?time:0,s=Math.max(0,Math.min(1,Number.isFinite(spread)?spread:.35));
 return {tilt:.12+s*.62,turn:.08*Math.sin(t*.08),phase:t*.09,orbit:4.9};
}
const diskVertex=`varying vec2 ringPoint;
 void main(){ringPoint=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const diskFragment=`precision highp float;
 varying vec2 ringPoint;uniform float clock;uniform float gain;
 void main(){
  float r=length(ringPoint);float a=atan(ringPoint.y,ringPoint.x);
  float p=(r-1.46)/3.2;
  float edges=smoothstep(0.0,.06,p)*(1.0-smoothstep(.54,1.0,p));
  float bands=.64+.17*sin(r*80.0+sin(a*4.0+clock*.18)*1.1)+.1*sin(r*153.0-a*9.0-clock*.2);
  float spiral=.84+.16*sin(a*8.0-r*11.0+clock*.3);
  float energy=pow(max(0.0,1.0-p),1.9);
  vec3 warm=mix(vec3(.42,.12,.035),vec3(1.0,.56,.19),energy);
  warm=mix(warm,vec3(1.0,.91,.7),pow(energy,4.0)*.78);
  float nearSide=.85+.15*cos(a);
  gl_FragColor=vec4(warm*bands*spiral*gain,edges*(.26+energy*.68)*nearSide);
 }`;

export function buildCosmos({quality='high'}={}){
 const group=new T.Group(),focus=new T.Group(),disk=new T.Group(),stars=seededStars(quality==='low'?220:680);
 group.add(focus);focus.add(disk);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(stars.flatMap(s=>[s.x,s.y,s.z]),3));
 const field=new T.Points(geometry,new T.PointsMaterial({color:0xb3bed0,size:.032,transparent:true,opacity:.65,depthWrite:false,sizeAttenuation:true}));group.add(field);
 const accretion=new T.Mesh(new T.RingGeometry(1.46,4.66,192,12),new T.ShaderMaterial({vertexShader:diskVertex,fragmentShader:diskFragment,uniforms:{clock:{value:0},gain:{value:1.8}},side:T.DoubleSide,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));
 accretion.rotation.x=-Math.PI/2;disk.add(accretion);
 const horizon=new T.Mesh(new T.SphereGeometry(1.3,64,40),new T.MeshBasicMaterial({color:0x020407}));focus.add(horizon);
 const halo=new T.Group();focus.add(halo);
 for(const [r,width,alpha]of [[1.335,.016,.92],[1.36,.035,.25],[1.4,.065,.065]]){
  const ring=new T.Mesh(new T.TorusGeometry(r,width,8,160),new T.MeshBasicMaterial({color:0xffcd8e,transparent:true,opacity:alpha,depthWrite:false,blending:T.AdditiveBlending}));halo.add(ring);
 }
 // Light bent over the silhouette: deliberately illustrative rather than a ray-traced spacetime.
 const arch=new T.Mesh(new T.TorusGeometry(1.53,.044,8,160,Math.PI),new T.MeshBasicMaterial({color:0xffdcac,transparent:true,opacity:.68,depthWrite:false,blending:T.AdditiveBlending}));arch.position.z=-.2;focus.add(arch);
 const orbitGeometry=new T.BufferGeometry().setFromPoints(Array.from({length:161},(_,i)=>V(Math.cos(i/160*TAU)*4.9,0,Math.sin(i/160*TAU)*4.9)));
 disk.add(new T.Line(orbitGeometry,new T.LineBasicMaterial({color:0x839aa8,transparent:true,opacity:.18})));
 const planet=new T.Mesh(new T.SphereGeometry(.12,24,16),new T.MeshStandardMaterial({color:0x86a8bb,metalness:.28,roughness:.65}));disk.add(planet);
 const light=new T.PointLight(0xffc17d,38,20,2);light.position.set(0,2,3);group.add(light);
 let pose=cosmosPose();
 return {group,focus,disk,horizon,halo,planet,stars,
  update(time=0,spread=.35,camera){pose=cosmosPose(time,spread);disk.rotation.x=pose.tilt;disk.rotation.z=-.09;focus.rotation.y=pose.turn;planet.position.set(Math.cos(pose.phase)*pose.orbit,.08,Math.sin(pose.phase)*pose.orbit);accretion.material.uniforms.clock.value=time;halo.quaternion.copy(camera?.quaternion||new T.Quaternion());group.updateMatrixWorld(true);},
  dispose(){group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});},
 };
}

// The lightweight renderer projects the same inclined disk and orbit in 3D.
// It is also available when a browser does not provide a usable WebGL context.
export function drawCosmos(ctx,model,camera,width,height,time=0){
 if(!ctx||!width||!height)return;
 camera.updateMatrixWorld(true);model.group.updateMatrixWorld(true);
 const point=(x,y,z,object)=>{const v=V(x,y,z);if(object)v.applyMatrix4(object.matrixWorld);v.project(camera);return [(v.x+1)*width/2,(1-v.y)*height/2];};
 ctx.clearRect(0,0,width,height);ctx.fillStyle='#080d14';ctx.fillRect(0,0,width,height);
 for(const s of model.stars){const [x,y]=point(s.x,s.y,s.z);if(x<0||x>width||y<0||y>height)continue;ctx.fillStyle=`rgba(190,207,221,${s.alpha})`;ctx.beginPath();ctx.arc(x,y,s.size,0,TAU);ctx.fill();}
 const center=point(0,0,0,model.focus),edge=point(1.3,0,0,model.focus),radius=Math.abs(edge[0]-center[0]);
 const strokeRing=(r,start,end,opacity,index)=>{
  ctx.beginPath();for(let i=0;i<=100;i++){const angle=start+(end-start)*i/100,p=point(Math.cos(angle)*r,0,Math.sin(angle)*r,model.disk);i?ctx.lineTo(...p):ctx.moveTo(...p);}
  const energy=Math.pow(1-(r-1.46)/3.2,1.7),flicker=.86+.14*Math.sin(index*2.1-time*.22);
  ctx.strokeStyle=`rgba(${Math.round(187+68*energy)},${Math.round(78+142*energy)},${Math.round(30+128*energy)},${opacity*flicker})`;ctx.lineWidth=Math.max(.45,radius*.016);ctx.stroke();
 };
 const steps=ctx.createRadialGradient?115:55;
 for(let i=steps;i>=0;i--)strokeRing(1.46+i/steps*3.2,Math.PI,TAU,.14+.64*(1-i/steps),i);
 // The arc behind the horizon suggests the deflection of light without pretending to measure it.
 if(ctx.save)ctx.save();ctx.strokeStyle='rgba(255,209,151,.6)';ctx.lineWidth=Math.max(1,radius*.043);ctx.beginPath();ctx.arc(center[0],center[1],radius*1.19,Math.PI,TAU);ctx.stroke();if(ctx.restore)ctx.restore();
 ctx.fillStyle='#020407';ctx.beginPath();ctx.arc(center[0],center[1],radius,0,TAU);ctx.fill();
 for(const [scale,alpha,lw]of [[1.07,.08,.1],[1.035,.22,.045],[1.02,.9,.012]]){ctx.strokeStyle=`rgba(255,210,153,${alpha})`;ctx.lineWidth=Math.max(.65,radius*lw);ctx.beginPath();ctx.arc(...center,radius*scale,0,TAU);ctx.stroke();}
 for(let i=steps;i>=0;i--)strokeRing(1.46+i/steps*3.2,0,Math.PI,.1+.75*(1-i/steps),i);
 ctx.strokeStyle='rgba(161,188,203,.24)';ctx.lineWidth=.6;ctx.beginPath();for(let i=0;i<=140;i++){const a=i/140*TAU,p=point(Math.cos(a)*4.9,0,Math.sin(a)*4.9,model.disk);i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.stroke();
 const planet=point(0,0,0,model.planet);ctx.fillStyle='#c5d8df';ctx.beginPath();ctx.arc(...planet,Math.max(1.5,radius*.065),0,TAU);ctx.fill();
}
