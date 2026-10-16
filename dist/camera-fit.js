import * as T from './vendor/three.module.min.js';

// Bounds belong to the visible apparatus, not the surrounding studio or hidden parts.
export function apparatusBounds(group){
 const bounds=new T.Box3();if(!group)return bounds;
 group.updateMatrixWorld(true);
 const visit=node=>{
  if(!node.visible||node.userData.stageBase)return;
  const material=Array.isArray(node.material)?node.material:[node.material];
  if(node.geometry&&material.some(m=>m&&m.visible!==false&&(m.opacity??1)>.01)){
   let local;
   if(node.isInstancedMesh){node.computeBoundingBox();local=node.boundingBox;}
   else{node.geometry.computeBoundingBox();local=node.geometry.boundingBox;}
   if(local&&!local.isEmpty()){
    const world=local.clone().applyMatrix4(node.matrixWorld);
    if([...world.min.toArray(),...world.max.toArray()].every(Number.isFinite))bounds.union(world);
   }
  }
  for(const child of node.children)visit(child);
 };visit(group);return bounds;
}

export function frameApparatus(camera,controls,group,margin=.86){
 const bounds=apparatusBounds(group);if(bounds.isEmpty())return false;
 const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const direction=camera.position.clone().sub(controls.target).normalize();
 if(direction.lengthSq()<.5)direction.set(7,4.6,8).normalize();
 camera.position.copy(center).add(direction);camera.lookAt(center);camera.updateMatrixWorld(true);
 const right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion);
 const tanY=Math.tan(T.MathUtils.degToRad(camera.getEffectiveFOV())/2),tanX=tanY*Math.max(.1,camera.aspect);
 let distance=4;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
  const p=new T.Vector3(x,y,z).sub(center),depth=p.dot(direction);
  distance=Math.max(distance,Math.abs(p.dot(right))/(tanX*margin)+depth,Math.abs(p.dot(up))/(tanY*margin)+depth);
 }
 controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);
 controls.maxDistance=Math.max(22,distance*2);controls.minDistance=Math.min(4,distance*.4);
 camera.far=Math.max(100,distance+size.length()*2);camera.updateProjectionMatrix();camera.lookAt(center);controls.update();
 return true;
}
