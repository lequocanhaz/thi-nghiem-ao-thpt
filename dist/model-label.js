import * as T from './vendor/three.module.min.js';

// Text overlays share the scene background. Only glyphs are painted into the texture.
export function modelLabel(group,text,position,options={}){
 if(options.labels===false)return null;
 const {width=512,height=112,fontSize=35,scale=[2.1,.46]}=options;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
 sprite.position.copy(position);sprite.scale.set(scale[0],scale[1],1);sprite.renderOrder=940;
 sprite.userData.modelLabel=true;
 sprite.userData.setText=value=>{
  const next=String(value??'');if(sprite.userData.text===next)return;
  sprite.userData.text=next;
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#000000';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 ${fontSize}px "Product Sans", Arial`;
  const measured=ctx.measureText?.(next)?.width||0;
  if(measured>width-24)ctx.font=`400 ${Math.max(14,Math.floor(fontSize*(width-24)/measured))}px "Product Sans", Arial`;
  ctx.fillText(next,width/2,height/2,width-16);texture.needsUpdate=true;
 };
 sprite.userData.setText(text);group?.add(sprite);return sprite;
}
