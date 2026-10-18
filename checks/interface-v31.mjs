import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {tickStep,tickValues,tickText,plotGrid} from '../dist/plot-grid.js';
import {withCoordinates,coordinateProfile,hasCoordinateGrid} from '../dist/coordinates.js';
import {sizeModelLabels} from '../dist/model-label.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {graphFor} from '../dist/graphs.js';
import {projectScene} from '../dist/software-scene.js';

const {document,window}=parseHTML('<body/>');globalThis.document=document;
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillText(){},measureText:s=>({width:s.length*20})});
assert.deepEqual(tickValues(-.3,.3,.1),[-.3,-.2,-.1,0,.1,.2,.3]);
assert.equal(tickText(.025,.025),'0,025');assert.equal(tickText(1e-8,1e-8),'1,0e-8');
assert.equal(tickText(0,.5),'0');
let charts=0;
for(const e of experiments){
 const s=initialState(e),g=graphFor(e,s,evaluate(e.id,s),{},[]),on=plotGrid(g),off=plotGrid(g,560,360,false);
 assert.ok(!/NaN|Infinity|undefined/.test(on.markup),e.id+' finite SVG');
 assert.ok(on.markup.includes('plot-grid-major')&&on.markup.includes('plot-grid-minor'),e.id+' both grid densities');
 assert.ok(!off.markup.includes('<path')&&off.markup.includes('plot-tick'),e.id+' hiding grid preserves numeric labels');
 assert.ok(Math.abs(on.xx(g.xmin)-on.m.l)<1e-7&&Math.abs(on.yy(g.ymax)-on.m.t)<1e-7,e.id+' original data domain is preserved');
 const ticks=tickValues(g.ymin,g.ymax,tickStep(g.ymin,g.ymax));assert.equal(new Set(ticks.map(v=>tickText(v,tickStep(g.ymin,g.ymax)))).size,ticks.length,e.id+' distinct numeric labels');charts++;
}
const cfg={viewMode:'2d',viewPlane:'front',switches:{axes:true,grid:true}},model=withCoordinates({group:new T.Group(),update(){}},'wave',{},null,{config:cfg});
assert.ok(hasCoordinateGrid(coordinateProfile('wave')));assert.ok(!hasCoordinateGrid(coordinateProfile('uniform')));
let grid=model.group.children[0].children.find(o=>o.userData.coordinateGrid);
assert.ok(grid);const plane=grid.children.find(o=>o.visible);assert.equal(plane.userData.gridPlane,'front');
// Physical wave grid spans x=0..6 m and u=-1..1 cm; it is not a metre-square overlay.
plane.children.forEach(line=>{const positions=line.geometry.attributes.position;for(let i=0;i<positions.count;i++){assert.ok(positions.getX(i)>=-3.00001&&positions.getX(i)<=3.00001);assert.ok(positions.getY(i)>=.59999&&positions.getY(i)<=2.00001);}});
let sizes=0;
for(const height of [300,480,900])for(const flat of [false,true])for(const zoom of [1,2]){
 const camera=flat?new T.OrthographicCamera(-5,5,4,-4,.01,100):new T.PerspectiveCamera(40,1,.01,100);
 camera.position.set(0,1,14);camera.zoom=zoom;camera.lookAt(0,1,0);camera.updateProjectionMatrix();
 sizeModelLabels(model.group,camera,height);model.group.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 model.group.traverse(o=>{if(!o.userData.pixelSize)return;const u=o.userData,p=o.getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse),span=flat?(camera.top-camera.bottom)/zoom:2*(-p.z)*Math.tan(T.MathUtils.degToRad(camera.getEffectiveFOV())/2),fontPixels=o.scale.y/span*height*u.fontSize/u.labelHeight;assert.ok(Math.abs(fontPixels-16)<1e-6,'16px coordinate text across resize/projection/zoom');sizes++;});
 const text=projectScene(model.group,camera,600,height).filter(p=>p.kind==='text');assert.ok(text.length>0);assert.ok(text.every(p=>p.fontSize===16&&p.fontWeight===600));
}
const smallCamera=new T.OrthographicCamera(-4.36,4.36,4,-4,.01,100);smallCamera.aspect=360/330;smallCamera.position.set(0,1.3,14);smallCamera.lookAt(0,1.3,0);smallCamera.updateProjectionMatrix();
const smallText=projectScene(model.group,smallCamera,360,330).filter(p=>p.kind==='text');
assert.ok(smallText.some(p=>p.text==='1')&&smallText.some(p=>p.text==='-1'));assert.ok(!smallText.some(p=>p.text==='0,5'),'reduce label density when sixteen-pixel numbers would overlap');
model.group.traverse(o=>{const u=o.userData;if(!u.pixelSize||!o.visible)return;const p=o.getWorldPosition(new T.Vector3()).project(smallCamera),x=(p.x+1)*180,half=u.labelTextWidth*u.pixelSize/u.fontSize/2;assert.ok(x-half>=7.9&&x+half<=352.1,'axis title and glyphs remain inside the narrow viewport');});
model.update({},null,{...cfg,switches:{axes:true,grid:false}});assert.ok(!model.group.children[0].children.some(o=>o.userData.coordinateGrid),'grid can be removed without removing axes');
const css=readFileSync(new URL('../dist/studio.css',import.meta.url),'utf8');assert.ok(!css.includes('font-weight:400!important;}\nbody .primary-heading'),'no blanket override defeating semantic bold');
const report={charts,coordinateLabelSizeCases:sizes,coordinateFontPixels:16,gridUnits:'physical mappings preserved',scope:'Numeric/SVG/CPU geometry checks; no browser pixels or real device testing.'};
writeFileSync(new URL('./interface-audit-v31.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('PASS v31 interface',JSON.stringify(report));
