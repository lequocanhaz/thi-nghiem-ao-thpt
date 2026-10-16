import {buildCosmos,drawCosmos} from './cosmos.js?v=15';
import {frameApparatus} from './camera-fit.js?v=14';
import {T,V,box} from './geometry-kit.js?v=14';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {buildLabModel} from './scene3d.js?v=14';
import {experiments,initialState} from './experiments.js?v=14';
import {evaluate,duration} from './models.js?v=14';
import {projectScene,drawProjection} from './software-scene.js?v=14';
// A composition of the actual apparatus, with no measurements invented for the banner.
export function buildBannerModel(){
 const group=new T.Group(),items=[];
 const layout=[['ohm',6.1,[0,-.65,.5],-.16],['pendulum',3.1,[-3.05,1.75,-.7],.16],['prism',3.2,[3.15,1.8,-1.4],-.3]];
 for(const[id,size,position,angle]of layout){const e=experiments.find(e=>e.id===id),state=initialState(e),config={hero:true,thumbnail:true,switches:{light:true,axes:false,vectors:false,labels:false,handles:false,trajectory:true}},model=buildLabModel(id,state,evaluate(id,state,config),{labels:false,config});
  const bounds=new T.Box3().setFromObject(model.group),center=bounds.getCenter(V()),span=bounds.getSize(V()),scale=size/Math.max(span.x,span.y,span.z),island=new T.Group();model.group.position.copy(center).multiplyScalar(-1);island.add(model.group);island.scale.setScalar(scale);island.position.set(...position);island.rotation.y=angle;group.add(island);items.push({id,e,state,config,model,island,baseY:position[1],baseX:position[0]});
 }
 // Thin, neutral plinths support the floating instruments; all remain introductory models.
 const plinth=box(group,6,.09,3.5,0xf0f5ff,0,-2.06,.2);plinth.rotation.y=-.16;
 return {group,items,update(time=0,motion=true,spread=.35){for(const item of items){const d=evaluate(item.id,item.state,item.config),max=duration(item.e,item.state,d);item.state.t=motion?(time*(item.e.timeScale||1))%max:0;item.model.update(item.state,evaluate(item.id,item.state,item.config),item.config);item.island.position.x=item.baseX*(.72+.4*spread);item.island.position.y=item.baseY*(.82+.22*spread)+(motion?.08*Math.sin(time*.6+item.baseY):0);}group.rotation.y=motion?.035*Math.sin(time*.15):0;}};
}
export class BannerScene{
 constructor(container,{motion=true,quality='high',view='instruments',onError=()=>{}}={}){
  Object.assign(this,{container,motion,quality,onError,elapsed:0,spread:.35,visible:true,dirty:true,pointer:{x:0,y:0},yaw:0});
  this.model=buildBannerModel();this.cosmos=buildCosmos({quality});this.scene=new T.Scene();this.scene.add(this.model.group,this.cosmos.group);
  this.camera=new T.PerspectiveCamera(35,1,.05,120);this.target=V(0,.15,0);this.camera.position.set(4,3.6,11.8);this.camera.lookAt(this.target);
  this.scene.add(new T.HemisphereLight(0xffffff,0x8bb3ef,2.8));const key=new T.DirectionalLight(0xffffff,4);key.position.set(2,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});key.shadow.bias=-.0003;key.shadow.normalBias=.025;this.scene.add(key);const rim=new T.DirectionalLight(0xc9e9ff,3);rim.position.set(-5,3,-4);this.scene.add(rim);
  try{
   this.webgl=new T.WebGLRenderer({alpha:true,antialias:quality!=='low',powerPreference:'low-power'});this.webgl.shadowMap.enabled=quality!=='low';this.webgl.shadowMap.type=T.PCFSoftShadowMap;this.webgl.outputColorSpace=T.SRGBColorSpace;this.webgl.toneMapping=T.ACESFilmicToneMapping;this.webgl.toneMappingExposure=1.12;
   this.pmrem=new T.PMREMGenerator(this.webgl);const room=new RoomEnvironment();try{this.env=this.pmrem.fromScene(room,.04);this.scene.environment=this.env.texture;}finally{room.dispose();}
   this.webgl.debug.onShaderError=()=>{throw Error('Banner shader unavailable');};this.canvas=this.webgl.domElement;
  }catch(error){this.fallback(error);}
  this.decorateCanvas();container.replaceChildren(this.canvas);
  this.onMove=e=>{if(e.pointerType==='touch')return;const r=container.getBoundingClientRect();if(!r.width||!r.height)return;if(this.dragging&&Number.isFinite(e.clientX))this.yaw=Math.max(-.6,Math.min(.6,this.dragging.yaw+(e.clientX-this.dragging.x)/r.width));if(this.motion){this.pointer.x=(e.clientX-r.left)/r.width-.5;this.pointer.y=(e.clientY-r.top)/r.height-.5;}this.dirty=true;};
  this.onLeave=()=>{this.pointer={x:0,y:0};this.dragging=null;this.dirty=true;};
  this.onDown=e=>{if(e.pointerType==='touch'||e.button>0)return;this.dragging={x:e.clientX,yaw:this.yaw};this.canvas.setPointerCapture?.(e.pointerId);};this.onUp=()=>{this.dragging=null;};
  this.onKey=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){this.yaw=0;this.setSpread(.35);}else if(e.key==='ArrowUp'||e.key==='ArrowDown')this.setSpread(this.spread+(e.key==='ArrowUp'?.05:-.05));else this.yaw=Math.max(-.6,Math.min(.6,this.yaw+(e.key==='ArrowLeft'?-.06:.06)));const range=document.querySelector('#bannerSpread');if(range)range.value=Math.round(this.spread*100);this.dirty=true;};
  for(const [name,handler]of [['pointermove',this.onMove],['pointerleave',this.onLeave],['pointerdown',this.onDown],['pointerup',this.onUp],['pointercancel',this.onUp],['keydown',this.onKey]])container.addEventListener(name,handler);
  this.onLost=e=>{e.preventDefault();this.fallback(Error('Banner context lost'));this.resize();};this.canvas.addEventListener('webglcontextlost',this.onLost);
  this.resizeObserver=globalThis.ResizeObserver?new ResizeObserver(()=>this.resize()):null;this.resizeObserver?.observe(container);
  this.intersection=globalThis.IntersectionObserver?new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.dirty=true;}):null;this.intersection?.observe(container);
  this.setView(view);this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
 }
 decorateCanvas(){this.canvas.className='banner-canvas';this.canvas.tabIndex=0;this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label',this.view==='cosmos'?'Không gian hấp dẫn: minh họa nghệ thuật ba chiều, không theo tỉ lệ. Phím trái phải đổi góc nhìn, lên xuống đổi độ nghiêng, Home khôi phục.':'Ba dụng cụ thí nghiệm: mạch điện, con lắc và lăng kính. Phím trái phải đổi góc nhìn, lên xuống tách mô hình.');this.canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Home');}
 fallback(error){this.canvas?.removeEventListener('webglcontextlost',this.onLost);this.webgl?.dispose();this.webgl=null;this.env?.dispose();this.pmrem?.dispose();this.env=null;this.pmrem=null;this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');if(!this.ctx)throw Error('Không dựng được mô hình giới thiệu');this.software=true;this.decorateCanvas();if(this.container?.isConnected)this.container.replaceChildren(this.canvas);if(this.onLost)this.canvas.addEventListener('webglcontextlost',this.onLost);this.onError(error);}
 setView(value){this.view=value==='cosmos'?'cosmos':'instruments';this.model.group.visible=this.view==='instruments';this.cosmos.group.visible=this.view==='cosmos';this.scene.background=new T.Color(this.view==='cosmos'?'#080d14':'#e8edf2');this.container.dataset.view=this.view;this.pointer={x:0,y:0};this.yaw=0;this.decorateCanvas();this.resize();}
 resize(){
  const width=this.container.clientWidth,height=this.container.clientHeight;if(!width||!height)return;this.width=width;this.height=height;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
  if(this.view==='cosmos'){this.target.set(0,0,0);const distance=5.8/Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*Math.max(1,1/this.camera.aspect);this.camera.position.set(0,.65,distance);this.camera.lookAt(this.target);}
  else{this.target.set(0,.15,0);this.camera.position.set(4,3.6,width/height<1.25?16.5:11.8);this.camera.lookAt(this.target);this.model.update(this.elapsed,true,1);frameApparatus(this.camera,{target:this.target,update:()=>{this.camera.lookAt(this.target);}},this.model.group,.87);this.model.update(this.elapsed,true,this.spread);}
  this.baseCamera=this.camera.position.clone();if(this.webgl){this.webgl.setPixelRatio(this.quality==='low'?1:Math.min(globalThis.devicePixelRatio||1,1.5));this.webgl.setSize(width,height,false);}else{this.canvas.width=width;this.canvas.height=height;}this.dirty=true;
 }
 setSpread(value){this.spread=Math.max(0,Math.min(1,Number.isFinite(value)?value:.35));this.manualSpread=true;this.dirty=true;}
 setScroll(value){if(this.manualSpread||!this.motion)return;this.spread=.35+.3*Math.max(0,Math.min(1,value));const input=document.querySelector('#bannerSpread');if(input)input.value=Math.round(this.spread*100);this.dirty=true;}
 setMotion(value){this.motion=!!value;this.pointer={x:0,y:0};this.dirty=true;}
 setQuality(value){this.quality=value;if(this.webgl)this.webgl.shadowMap.enabled=value!=='low';this.resize();}
 loop(now=0){
  if(this.disposed)return;const delta=this.last?Math.min(.08,(now-this.last)/1000):0;this.last=now;if(this.visible&&this.motion&&!document.hidden)this.elapsed+=delta;
  if(this.visible&&!document.hidden&&(this.motion||this.dirty)&&now-(this.lastPaint||0)>(this.software?80:this.quality==='low'?65:33)){
   const cosmic=this.view==='cosmos';this.camera.position.x=(this.baseCamera?.x??4)+this.pointer.x*(cosmic?.8:.6)+this.yaw*(cosmic?12:3);this.camera.position.y=(this.baseCamera?.y??3.6)+this.pointer.y*.35;this.camera.lookAt(this.target);
   if(cosmic)this.cosmos.update(this.elapsed,this.spread,this.camera);else this.model.update(this.elapsed,true,this.spread);
   try{if(this.webgl)this.webgl.render(this.scene,this.camera);else if(cosmic)drawCosmos(this.ctx,this.cosmos,this.camera,this.width||800,this.height||420,this.elapsed);else drawProjection(this.ctx,projectScene(this.model.group,this.camera,this.width||800,this.height||420,16000),this.width||800,this.height||420,'#e8edf2');this.dirty=false;this.lastPaint=now;}
   catch(error){if(this.webgl){this.fallback(error);this.resize();}else{this.onError(error);this.dirty=false;this.motion=false;}}
  }this.frame=requestAnimationFrame(this.loop);
 }
 dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver?.disconnect();this.intersection?.disconnect();for(const [name,handler]of [['pointermove',this.onMove],['pointerleave',this.onLeave],['pointerdown',this.onDown],['pointerup',this.onUp],['pointercancel',this.onUp],['keydown',this.onKey]])this.container.removeEventListener(name,handler);this.canvas.removeEventListener('webglcontextlost',this.onLost);this.model.group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){m?.map?.dispose();m?.dispose();}});this.cosmos.dispose();this.env?.dispose();this.pmrem?.dispose();this.webgl?.dispose();this.webgl?.forceContextLoss();}
}
