import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {BannerScene} from '../dist/banner.js';
const {document,window}=parseHTML('<body><div id="host"></div><button data-action="banner-motion"></button><output id="bannerResolutionInfo"></output><span id="bannerStatus"></span></body>');globalThis.document=document;
let reject=false,plays=0,pauses=0,loads=0,visible,observed=false;
globalThis.IntersectionObserver=class{constructor(callback){visible=callback;}observe(){observed=true;}disconnect(){observed=false;}};
const create=document.createElement.bind(document);document.createElement=name=>{const el=create(name);if(name==='video'){el.paused=true;el.videoWidth=1920;el.videoHeight=1080;el.play=async()=>{plays++;if(reject)throw Error('autoplay blocked');el.paused=false;el.dispatchEvent(new window.Event('playing'));};el.pause=()=>{pauses++;el.paused=true;el.dispatchEvent(new window.Event('pause'));};el.load=()=>{loads++;};}return el;};
const host=document.querySelector('#host'),scene=new BannerScene(host,{motion:true});await Promise.resolve();assert.equal(plays,1);assert.equal(scene.motion,true);assert.equal(observed,true);assert.ok(scene.video.muted&&scene.video.loop&&scene.video.playsInline);assert.equal(host.querySelectorAll('source').length,2);assert.match(scene.video.poster,/black-hole.webp/);assert.match(document.querySelector('#bannerResolutionInfo').textContent,/1920 × 1080/);
await scene.setMotion(false);assert.equal(scene.motion,false);assert.equal(scene.wantedMotion,false);assert.equal(scene.video.paused,true);
reject=true;await scene.setMotion(true);assert.equal(scene.motion,false);assert.equal(scene.blocked,true);assert.match(document.querySelector('#bannerStatus').textContent,/chặn tự phát/);assert.equal(document.querySelector('button').textContent,'Phát video');
reject=false;await scene.setMotion(true);assert.equal(scene.motion,true);assert.equal(scene.blocked,false);assert.equal(document.querySelector('button').textContent,'Tạm dừng video');
visible([{isIntersecting:false}]);await Promise.resolve();assert.equal(scene.motion,false);visible([{isIntersecting:true}]);await Promise.resolve();assert.equal(scene.motion,true);
scene.video.dispatchEvent(new window.Event('error'));assert.equal(scene.failed,true);assert.equal(scene.motion,false);assert.match(document.querySelector('button').textContent,/Thử lại/);await scene.setMotion(true);assert.equal(loads,1);assert.equal(scene.motion,true);
scene.setSpread(1);assert.equal(scene.video.style.transform,'scale(1.25)');scene.setSpread(-100);assert.equal(scene.video.style.transform,'scale(1)');
scene.dispose();assert.equal(observed,false);assert.equal(scene.video.paused,true);assert.equal(loads,2);assert.ok(pauses>=3);assert.ok([...scene.video.querySelectorAll('source')].every(s=>!s.hasAttribute('src')));
// A play promise that resolves late must not resume a subsequently paused controller.
let resolve;const other=new BannerScene(host,{motion:false});other.video.play=()=>new Promise(r=>resolve=r);const pending=other.setMotion(true);await other.setMotion(false);resolve();await pending;assert.equal(other.motion,false);other.dispose();
console.log('PASS real video controller state: muted inline sources, autoplay rejection, retry, play/pause, offscreen suspension, zoom and cleanup. Mock media events; no browser autoplay test.');
