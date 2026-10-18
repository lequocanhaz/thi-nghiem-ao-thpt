import * as T from './vendor/three.module.min.js';

// Text overlays share the scene background. Only glyphs are painted into the texture.
export function modelLabel(group,text,position,options={}){
 if(options.labels===false)return null;
 const {width=512,height=112,fontSize=35,fontWeight=400,pixelSize=0,pixelOffset=[0,0],scale=[2.1,.46]}=options;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
 sprite.position.copy(position);sprite.scale.set(scale[0],scale[1],1);sprite.renderOrder=940;
 sprite.userData.modelLabel=true;
 Object.assign(sprite.userData,{pixelSize,pixelOffset,fontSize,fontWeight,labelWidth:width,labelHeight:height,pixelAnchor:position.clone()});
 sprite.userData.setText=value=>{
  const next=String(value??'');if(sprite.userData.text===next)return;
  sprite.userData.text=next;
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#000000';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${fontWeight} ${fontSize}px "Manrope", Arial`;
  const measured=ctx.measureText?.(next)?.width||0;
  sprite.userData.labelTextWidth=Math.min(measured,width-24);
  if(measured>width-24)ctx.font=`${fontWeight} ${Math.max(14,Math.floor(fontSize*(width-24)/measured))}px "Manrope", Arial`;
  ctx.fillText(next,width/2,height/2,width-16);texture.needsUpdate=true;
 };
 sprite.userData.setText(text);group?.add(sprite);return sprite;
}

// Coordinate text has a readable CSS-pixel size at every zoom and viewport size.
export function sizeModelLabels(group,camera,viewportHeight){
 if(!group||!camera||!(viewportHeight>0))return;
 camera.updateMatrixWorld(true);group.updateMatrixWorld(true);
 const position=new T.Vector3(),right=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
 group.traverse(sprite=>{
  const u=sprite.userData;if(!u.modelLabel||!u.pixelSize)return;
  const anchor=sprite.parent.localToWorld(u.pixelAnchor.clone());position.copy(anchor).applyMatrix4(camera.matrixWorldInverse);
  const span=camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom:2*Math.max(.01,-position.z)*Math.tan(T.MathUtils.degToRad(camera.getEffectiveFOV())/2);
  const height=u.pixelSize*u.labelHeight/u.fontSize*span/viewportHeight;
  sprite.scale.set(height*u.labelWidth/u.labelHeight,height,1);
  position.copy(anchor).addScaledVector(right,u.pixelOffset[0]*span/viewportHeight).addScaledVector(up,-u.pixelOffset[1]*span/viewportHeight);
  const aspect=camera.aspect||(camera.right-camera.left)/(camera.top-camera.bottom),screen=position.clone().project(camera),xLimit=Math.max(.1,1-((u.labelTextWidth||u.text.length*u.fontSize*.65)*u.pixelSize/u.fontSize/2+8)*2/(viewportHeight*aspect)),yLimit=Math.max(.1,1-(u.pixelSize/2+8)*2/viewportHeight);
  position.addScaledVector(right,(T.MathUtils.clamp(screen.x,-xLimit,xLimit)-screen.x)*span*aspect/2).addScaledVector(up,(T.MathUtils.clamp(screen.y,-yLimit,yLimit)-screen.y)*span/2);
  sprite.position.copy(sprite.parent.worldToLocal(position));
  if(u.tickDelta){
   const first=anchor.clone().project(camera),next=sprite.parent.localToWorld(u.pixelAnchor.clone().add(u.tickDelta)).project(camera),aspect=camera.aspect||(camera.right-camera.left)/(camera.top-camera.bottom),gap=Math.hypot((next.x-first.x)*viewportHeight*aspect/2,(next.y-first.y)*viewportHeight/2),minimum=u.tickHorizontal?Math.max(32,u.text.length*u.pixelSize*.65+12):u.pixelSize*1.5,factor=Math.max(1,Math.ceil(minimum/Math.max(.01,gap)));
   const multiple=u.tickValue/(u.tickStep*factor);sprite.visible=Math.abs(multiple-Math.round(multiple))<1e-6;
  }
 });
}
