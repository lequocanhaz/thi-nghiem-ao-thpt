import * as T from './vendor/three.module.min.js';
import {apparatusBounds} from './camera-fit.js?v=43';

// Every apparatus gets a work surface that grows with its occupied space.
// The surface is excluded from camera fitting and never changes a measurement.
export function withModelWorkspace(model,options={}){
 if(options.thumbnail||options.hero||options.config?.thumbnail||options.config?.hero)return model;
 // Replace the small decorative benches; retaining them cuts through negative displacements.
 model.group.traverse(node=>{if(node.userData.stageBase)node.visible=false;});
 const deck=new T.Mesh(new T.BoxGeometry(1,.16,1),new T.MeshStandardMaterial({color:0xf0f3ef,roughness:.88,metalness:.04}));
 deck.name='expanded-workspace';deck.userData.stageBase=true;deck.receiveShadow=true;model.group.add(deck);
 const footprint=new T.Box3(),original=model.update;
 const sync=()=>{
  const bounds=apparatusBounds(model.group);model.visibleBounds=bounds;
  if(bounds.isEmpty())return;
  footprint.union(bounds);const center=footprint.getCenter(new T.Vector3()),size=footprint.getSize(new T.Vector3());
  deck.scale.set(Math.max(18,size.x+3),1,Math.max(12,size.z+3));
  const floor=Math.min(0,footprint.min.y-.12);
  deck.position.set(center.x,floor-.08,center.z);model.workspaceFloor=floor;
 };
 model.update=(s,d,c={})=>{original(s,d,c);sync();};sync();return model;
}
