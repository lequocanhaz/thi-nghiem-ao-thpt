const VIDEO_ROOT=new URL('./video/',import.meta.url);
export class BannerScene{
 constructor(container,{onError=()=>{},onState=()=>{}}={}){
  Object.assign(this,{container,onError,onState,motion:false,disposed:false,playToken:0,pending:null,lastLoad:0});
  const video=this.video=document.createElement('video');video.className='banner-video';video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=true;video.controls=false;video.preload='auto';video.disablePictureInPicture=true;video.disableRemotePlayback=true;video.poster=new URL('black-hole.webp',VIDEO_ROOT).href;
  for(const name of ['muted','playsinline','loop','autoplay','disablepictureinpicture','disableremoteplayback'])video.setAttribute(name,'');video.setAttribute('aria-hidden','true');video.tabIndex=-1;
  for(const [file,type]of [['black-hole.mp4','video/mp4'],['black-hole.webm','video/webm']]){const source=document.createElement('source');source.src=new URL(file,VIDEO_ROOT).href;source.type=type;video.append(source);}
  this.events=[['playing',()=>{this.motion=true;this.blocked=false;this.failed=false;this.notify();}],['pause',()=>{this.motion=false;this.notify();if(!document.hidden&&!this.disposed)this.reconcile();}],['ended',()=>this.reconcile()],['loadeddata',()=>this.reconcile()],['error',()=>{this.failed=true;this.motion=false;this.notify();this.onError(Error('Không tải được video nền'));}]];
  for(const [name,fn]of this.events)video.addEventListener(name,fn);container.replaceChildren(video);
  this.onVisibility=()=>{if(!document.hidden)this.reconcile();};
  this.onUser=()=>{if(this.disposed||!this.video.paused&&!this.failed)return;if(this.failed&&Date.now()-this.lastLoad>=5000){this.lastLoad=Date.now();this.failed=false;this.video.load();}this.reconcile();};
  document.addEventListener('visibilitychange',this.onVisibility);document.addEventListener('pointerdown',this.onUser,{capture:true,passive:true});document.addEventListener('keydown',this.onUser,{capture:true});
  this.reconcile();
 }
 notify(){if(this.disposed)return;this.container.dataset.playback=this.failed?'failed':this.motion?'playing':this.blocked?'blocked':'loading';this.onState({playing:this.motion,blocked:!!this.blocked,failed:!!this.failed});}
 reconcile(){
  if(this.disposed||document.hidden)return Promise.resolve();if(this.pending)return this.pending;
  if(!this.video.paused){this.motion=true;this.blocked=false;this.notify();return Promise.resolve();}
  const token=++this.playToken;let playback;try{playback=this.video.play();}catch(error){playback=Promise.reject(error);}
  this.pending=Promise.resolve(playback).then(()=>{if(this.disposed||token!==this.playToken)return;this.motion=!this.video.paused;this.blocked=false;},()=>{if(this.disposed||token!==this.playToken)return;this.motion=false;this.blocked=true;}).finally(()=>{if(token===this.playToken)this.pending=null;this.notify();});
  return this.pending;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.motion=false;++this.playToken;document.removeEventListener('visibilitychange',this.onVisibility);document.removeEventListener('pointerdown',this.onUser,true);document.removeEventListener('keydown',this.onUser,true);for(const [name,fn]of this.events)this.video.removeEventListener(name,fn);this.video.pause();this.video.removeAttribute('src');this.video.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));this.video.load();}
}
