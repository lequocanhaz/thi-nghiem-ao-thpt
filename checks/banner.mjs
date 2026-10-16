import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {BannerScene} from '../dist/banner.js';
import {renderDimensions} from '../dist/cinematic.js';
const {document,window}=parseHTML('<body><input id="bannerSpread" value="35"><output id="bannerResolutionInfo"></output></body>');
globalThis.document=document;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
let draws=0,commands=0;
const finite=(...a)=>{commands++;assert.ok(a.every(Number.isFinite),'Canvas coordinates must be finite');};
const ctx={clearRect:finite,save(){},restore(){},translate:finite,rotate:finite,drawImage(image,...a){finite(...a);draws++;}};
window.HTMLCanvasElement.prototype.getContext=type=>type==='webgl2'?null:ctx;
const originalError=console.error;console.error=()=>{};
try{
 for(const [width,height]of [[328,780],[360,780],[768,680],[1440,810]]){
  const host=document.createElement('div');document.body.append(host);Object.defineProperties(host,{clientWidth:{value:width},clientHeight:{value:height}});host.getBoundingClientRect=()=>({left:0,top:0,width,height});
  let errors=0;const scene=new BannerScene(host,{onError:()=>errors++});assert.equal(scene.software,true);assert.equal(errors,1);assert.equal(host.querySelectorAll('canvas').length,1);scene.onPosterLoad();assert.equal(scene.posterReady,true);
  scene.loop(100);scene.loop(200);const elapsed=scene.elapsed;assert.ok(elapsed>0);scene.setMotion(false);scene.loop(400);assert.equal(scene.elapsed,elapsed);const spread=scene.spread;scene.setScroll(1);assert.equal(scene.spread,spread,'paused banner ignores scroll');scene.onKey({key:'ArrowUp',preventDefault(){}});assert.ok(scene.spread>spread,'keyboard works while motion is paused');scene.loop(600);
  scene.setResolution('fullhd');assert.deepEqual(scene.buffer,{width:1920,height:1080});assert.equal(scene.canvas.width,1920);assert.equal(scene.canvas.height,1080);assert.match(document.querySelector('#bannerResolutionInfo').textContent,/1920 × 1080/);
  scene.onDown({pointerType:'touch',button:0});assert.equal(scene.dragStart,undefined,'touch leaves page scrolling available');scene.onMove({pointerType:'touch',clientX:0,clientY:0});assert.equal(scene.pointer.x,0);
  scene.setQuality('low');assert.deepEqual(scene.buffer,{width:1920,height:1080},'explicit frame size is preserved in lightweight mode');scene.setResolution('adaptive');assert.deepEqual(scene.buffer,renderDimensions(width,height,{quality:'low'}));
  scene.setMotion(true);scene.visible=false;const before=scene.elapsed;scene.loop(800);assert.equal(scene.elapsed,before,'hidden banner does not advance');scene.visible=true;scene.loop(1000);assert.ok(scene.elapsed>before);scene.onKey({key:'Home',preventDefault(){}});assert.equal(scene.spread,.35);scene.dispose();assert.equal(scene.disposed,true);host.remove();
 }
}finally{console.error=originalError;}
assert.ok(draws>=12&&commands>30);
console.log(`PASS cinematic banner controller at four viewports: ${draws} image draws, finite Canvas arguments, Full HD buffers, pause/resume, keyboard, touch-scroll gating, offscreen pause and cleanup. Simulated Canvas; no browser or GPU rendering.`);
