import {T} from './geometry-kit.js?v=14';
import {POSTER_URL,POSTER_SIZE,renderDimensions,cinematicPose,cinematicVertex,cinematicFragment} from './cinematic.js?v=16';
// Image-based cinematic scene, with live GPU light-flow and depth parallax.
// This is artistic artwork, not a relativistic experiment or a measured spacetime.
export class BannerScene{
 constructor(container,{motion=true,quality='high',resolution='adaptive',onError=()=>{}}={}){
  Object.assign(this,{container,motion,quality,resolution,onError,elapsed:0,spread:.35,pointer:{x:0,y:0},visible:true,dirty:true});
  this.canvas=document.createElement('canvas');this.poster=document.createElement('img');this.poster.decoding='async';this.poster.alt='';
  this.onPosterLoad=()=>{this.posterReady=true;if(this.material){this.texture=new T.Texture(this.poster);this.texture.colorSpace=T.SRGBColorSpace;this.texture.needsUpdate=true;this.material.uniforms.poster.value=this.texture;this.material.uniforms.ready.value=1;}this.dirty=true;};
  this.onPosterError=()=>{this.posterFailed=true;this.onError(Error('Không tải được ảnh nền không gian'));};this.poster.addEventListener('load',this.onPosterLoad);this.poster.addEventListener('error',this.onPosterError);
  try{
   this.webgl=new T.WebGLRenderer({canvas:this.canvas,alpha:true,antialias:false,powerPreference:'low-power'});this.webgl.outputColorSpace=T.SRGBColorSpace;
   this.scene=new T.Scene();this.camera=new T.Camera();this.material=new T.ShaderMaterial({vertexShader:cinematicVertex,fragmentShader:cinematicFragment,transparent:true,depthTest:false,depthWrite:false,uniforms:{poster:{value:null},resolution:{value:new T.Vector2(1,1)},pointer:{value:new T.Vector2()},clock:{value:0},roll:{value:0},strength:{value:.5},ready:{value:0}}});
   this.geometry=new T.PlaneGeometry(2,2);this.scene.add(new T.Mesh(this.geometry,this.material));this.webgl.debug.onShaderError=()=>{throw Error('Không dựng được hiệu ứng ánh sáng');};
  }catch(error){this.fallback(error);}
  this.decorate();container.replaceChildren(this.canvas);this.poster.src=POSTER_URL;
  this.onMove=e=>{if(e.pointerType==='touch')return;const r=container.getBoundingClientRect();if(!r.width||!r.height)return;if(this.dragStart){this.pointer.x=Math.max(-1,Math.min(1,this.dragStart.p+(e.clientX-this.dragStart.x)/r.width*2));}else if(this.motion){this.pointer.x=((e.clientX-r.left)/r.width-.5)*.6;this.pointer.y=((e.clientY-r.top)/r.height-.5)*.5;}this.dirty=true;};
  this.onDown=e=>{if(e.pointerType==='touch'||e.button>0)return;this.dragStart={x:e.clientX,p:this.pointer.x};this.canvas.setPointerCapture?.(e.pointerId);};this.onUp=()=>{this.dragStart=null;};this.onLeave=()=>{this.dragStart=null;this.pointer={x:0,y:0};this.dirty=true;};
  this.onKey=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){this.pointer={x:0,y:0};this.setSpread(.35);}else if(e.key==='ArrowUp'||e.key==='ArrowDown'){this.setSpread(this.spread+(e.key==='ArrowUp'?.05:-.05));}else this.pointer.x=Math.max(-1,Math.min(1,this.pointer.x+(e.key==='ArrowLeft'?-.1:.1)));const input=document.querySelector('#bannerSpread');if(input)input.value=Math.round(this.spread*100);this.dirty=true;};
  this.onLost=e=>{e.preventDefault();this.fallback(Error('Mất ngữ cảnh đồ họa'));this.resize();};
  this.events=[['pointermove',this.onMove],['pointerdown',this.onDown],['pointerup',this.onUp],['pointercancel',this.onUp],['pointerleave',this.onLeave],['keydown',this.onKey]];for(const [event,fn]of this.events)container.addEventListener(event,fn);this.canvas.addEventListener('webglcontextlost',this.onLost);
  this.resizeObserver=globalThis.ResizeObserver?new ResizeObserver(()=>this.resize()):null;this.resizeObserver?.observe(container);this.intersection=globalThis.IntersectionObserver?new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.dirty=true;}):null;this.intersection?.observe(container);
  this.resize();this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
 }
 decorate(){this.canvas.className='banner-canvas cinematic-canvas';this.canvas.tabIndex=0;this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Cảnh không gian điện ảnh: hố đen, vòng sáng và viền khí quyển hành tinh. Minh họa nghệ thuật. Mũi tên đổi góc cảnh; Home khôi phục.');this.canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Home');}
 fallback(error){this.canvas?.removeEventListener('webglcontextlost',this.onLost);this.webgl?.dispose();this.webgl=null;this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');this.software=true;this.decorate();if(this.container?.isConnected)this.container.replaceChildren(this.canvas);if(this.onLost)this.canvas.addEventListener('webglcontextlost',this.onLost);this.onError(error);}
 resize(){const width=this.container.clientWidth,height=this.container.clientHeight;if(!width||!height)return;this.width=width;this.height=height;const d=renderDimensions(width,height,{resolution:this.resolution,quality:this.quality,pixelRatio:globalThis.devicePixelRatio||1});this.buffer=d;if(this.webgl){this.webgl.setPixelRatio(1);this.webgl.setSize(d.width,d.height,false);this.material.uniforms.resolution.value.set(d.width,d.height);}else{this.canvas.width=d.width;this.canvas.height=d.height;}this.dirty=true;const info=document.querySelector('#bannerResolutionInfo');if(info)info.textContent=`${d.width} × ${d.height} px`;}
 setSpread(value){this.spread=Math.max(0,Math.min(1,Number.isFinite(value)?value:.35));this.manualSpread=true;this.dirty=true;}
 setScroll(value){if(this.manualSpread||!this.motion)return;this.spread=.35+.12*Math.max(0,Math.min(1,value));this.dirty=true;}
 setMotion(value){this.motion=!!value;this.pointer={x:0,y:0};this.dirty=true;}
 setQuality(value){this.quality=value==='low'?'low':'high';this.resize();}
 setResolution(value){this.resolution=value==='fullhd'?'fullhd':'adaptive';this.resize();}
 drawLightweight(pose){
  const c=this.ctx,w=this.buffer.width,h=this.buffer.height;if(!c)return;c.clearRect(0,0,w,h);if(!this.posterReady)return;
  const angle=pose.roll+pose.x*.018,cover=Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle))*Math.max(w/h,h/w);
  const sx=POSTER_SIZE.width,sy=POSTER_SIZE.height,scale=Math.max(w/sx,h/sy)*1.035*cover,dw=sx*scale,dh=sy*scale,x=(w-dw)*(w/h<1?.77:.66)+pose.x*dw*.004,y=(h-dh)*.5+pose.y*dh*.003;
  c.save();c.translate(w/2,h/2);c.rotate(angle);c.drawImage(this.poster,x-w/2,y-h/2,dw,dh);c.restore();
 }
 loop(now=0){if(this.disposed)return;const dt=this.last?Math.min(.08,(now-this.last)/1000):0;this.last=now;if(this.motion&&this.visible&&!document.hidden)this.elapsed+=dt;
  if(this.visible&&!document.hidden&&(this.motion||this.dirty)&&now-(this.lastPaint||0)>(this.software?80:this.quality==='low'?65:33)){
   const pose=cinematicPose(this.elapsed,this.spread,this.pointer);
   try{if(this.webgl){const u=this.material.uniforms;u.clock.value=pose.clock;u.roll.value=pose.roll;u.strength.value=pose.strength;u.pointer.value.set(pose.x,pose.y);this.webgl.render(this.scene,this.camera);}else this.drawLightweight({...pose,x:pose.x+(this.motion?.2*Math.sin(this.elapsed*.08):0)});this.dirty=false;this.lastPaint=now;}catch(error){if(this.webgl){this.fallback(error);this.resize();}else{this.motion=false;this.onError(error);}}}
  this.frame=requestAnimationFrame(this.loop);
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver?.disconnect();this.intersection?.disconnect();for(const [event,fn]of this.events)this.container.removeEventListener(event,fn);this.poster.removeEventListener('load',this.onPosterLoad);this.poster.removeEventListener('error',this.onPosterError);this.canvas.removeEventListener('webglcontextlost',this.onLost);this.texture?.dispose();this.material?.dispose();this.geometry?.dispose();this.webgl?.dispose();this.webgl?.forceContextLoss();}
}
