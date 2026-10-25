// One gesture owns one pointer. Vertical scrolling and native pinch zoom remain native.
export function bindBookTouch(stage,{canStart,begin,move,finish},host=window){
 let gesture=null;
 const reset=()=>{const old=gesture;gesture=null;if(old&&stage.hasPointerCapture?.(old.id))stage.releasePointerCapture(old.id);};
 const cancel=()=>{const turning=gesture?.direction;reset();if(turning)finish(false);};
 const down=e=>{
  if(gesture){if(e.pointerId!==gesture.id)cancel();return;}
  if(e.isPrimary===false||e.button>0||!canStart()||!e.target.closest('.paper-stack'))return;
  gesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:e.timeStamp,width:stage.querySelector('.paper-page')?.getBoundingClientRect().width||stage.clientWidth,progress:0,velocity:0,direction:0};
 };
 const drag=e=>{
  const g=gesture;if(!g||g.id!==e.pointerId)return;
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(!g.direction){
   if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)*1.15){reset();return;}
   if(Math.abs(dx)<12||Math.abs(dx)<Math.abs(dy)*1.25)return;
   g.direction=dx<0?1:-1;
   if(begin(g.direction)===false){reset();return;}
   try{stage.setPointerCapture?.(g.id);}catch{}
  }
  if(e.cancelable)e.preventDefault();
  const elapsed=e.timeStamp-g.lastTime;
  if(elapsed>0)g.velocity=(g.lastX-e.clientX)*g.direction/elapsed;
  g.lastX=e.clientX;g.lastTime=e.timeStamp;
  g.progress=Math.max(0,Math.min(1,-dx*g.direction/Math.max(1,g.width*.8)));
  move(g.progress);
 };
 const up=e=>{
  const g=gesture;if(!g||g.id!==e.pointerId)return;
  // A pause before releasing must not count as a fast flick.
  const velocity=e.timeStamp-g.lastTime<120?g.velocity:0;
  const commit=g.progress>=.28||(g.progress>.1&&velocity>.55);
  reset();if(g.direction)finish(commit);
 };
 if(host.PointerEvent){
  stage.addEventListener('pointerdown',down);
  stage.addEventListener('pointermove',drag,{passive:false});
  host.addEventListener('pointerup',up);
  stage.addEventListener('pointercancel',e=>{if(e.pointerId===gesture?.id)cancel();});
  // Touch starts with implicit capture on the image. Its capture-loss event bubbles
  // when the stage takes ownership; only loss from the stage itself cancels the turn.
  stage.addEventListener('lostpointercapture',e=>{if(e.target===stage&&e.pointerId===gesture?.id)cancel();});
 }else{
  const event=(e,t)=>({pointerId:t.identifier,clientX:t.clientX,clientY:t.clientY,target:e.target,timeStamp:e.timeStamp,cancelable:e.cancelable,preventDefault:()=>e.preventDefault()});
  stage.addEventListener('touchstart',e=>{if(e.touches.length!==1){cancel();return;}down(event(e,e.touches[0]));},{passive:true});
  stage.addEventListener('touchmove',e=>{if(e.touches.length!==1){cancel();return;}drag(event(e,e.touches[0]));},{passive:false});
  host.addEventListener('touchend',e=>{for(const t of e.changedTouches)up(event(e,t));});
  stage.addEventListener('touchcancel',cancel);
 }
 return {reset,cancel};
}
