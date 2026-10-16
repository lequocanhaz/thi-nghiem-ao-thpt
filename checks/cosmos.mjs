import assert from 'node:assert/strict';
import fs from 'node:fs';
import CSSOM from 'cssom';
import {parseHTML} from 'linkedom';
import {BannerScene} from '../dist/banner.js';
import {cosmosPose,seededStars} from '../dist/cosmos.js';
import {T,V} from '../dist/geometry-kit.js';

assert.deepEqual(seededStars(8),seededStars(8),'stable stars avoid reshuffling on resize');
for(const v of [-100,0,.35,1,100,NaN,Infinity])assert.ok(Object.values(cosmosPose(1,v)).every(Number.isFinite));
const{document,window}=parseHTML('<body><input id="bannerSpread" value="35"></body>');
globalThis.document=document;globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};
let strokes=0,points=0;
const check=(...a)=>{points++;assert.ok(a.every(Number.isFinite),'non-finite Canvas coordinates');};
const ctx={clearRect:check,fillRect:check,beginPath(){},arc:check,fill(){},stroke(){strokes++;},moveTo:check,lineTo:check,closePath(){},setLineDash(){},strokeRect:check,fillText(){},roundRect:check,measureText:s=>({width:s.length*18})};
window.HTMLCanvasElement.prototype.getContext=type=>type==='webgl2'?null:ctx;
let cases=0;
const before=console.error;console.error=()=>{};
try{
 for(const [width,height]of [[328,280],[360,280],[370,370],[768,440],[900,490]]){
  const host=document.createElement('div');document.body.append(host);Object.defineProperties(host,{clientWidth:{value:width},clientHeight:{value:height}});
  const scene=new BannerScene(host,{view:'cosmos',motion:true});assert.equal(scene.software,true);assert.equal(host.dataset.view,'cosmos');
  for(const spread of [0,.35,1])for(const time of [0,10,300]){
   scene.elapsed=time;scene.setSpread(spread);scene.loop((++cases)*200);scene.camera.updateMatrixWorld(true);
   scene.cosmos.focus.traverse(object=>{const p=object.geometry?.attributes.position;if(!p)return;for(let i=0;i<p.count;i++){const v=V().fromBufferAttribute(p,i).applyMatrix4(object.matrixWorld).project(scene.camera);assert.ok(Number.isFinite(v.x)&&Math.abs(v.x)<1&&Math.abs(v.y)<1,'cosmos geometry framing at '+width+' / '+spread);}});
  }
  scene.setMotion(false);const t=scene.elapsed;scene.loop(15000);assert.equal(scene.elapsed,t,'pause freezes time');
  const old=scene.spread;scene.onKey({key:'ArrowDown',preventDefault(){}});scene.loop(15200);assert.notEqual(scene.spread,old,'keyboard still operates while paused');
  scene.setView('instruments');assert.equal(scene.cosmos.group.visible,false);assert.equal(scene.model.group.visible,true);assert.equal(scene.elapsed,t,'switching scenes preserves time');
  scene.setView('cosmos');assert.equal(scene.model.group.visible,false);assert.equal(scene.cosmos.group.visible,true);assert.match(scene.canvas.getAttribute('aria-label'),/không theo tỉ lệ/);
  scene.setQuality('low');scene.loop(15400);scene.dispose();assert.equal(scene.disposed,true);host.remove();
 }
}finally{console.error=before;}
assert.ok(strokes>1000&&points>100000,'projected renderer actually draws the scene');
const css=fs.readFileSync(new URL('../dist/visual.css',import.meta.url),'utf8');assert.ok(CSSOM.parse(css).cssRules.length>100);
for(const width of [620,900,1200,1440])assert.ok(css.includes(`${width}px`));
assert.match(css,/prefers-reduced-motion/);assert.match(css,/touch-action:pan-y/);assert.match(css,/min-height:44px/);
console.log(`PASS orbital introduction: ${cases} projected camera/pose cases, ${points} finite Canvas commands; pause, scene changes, keyboard and cleanup. CSS parses with responsive rules. No browser pixels or GPU shader test.`);
