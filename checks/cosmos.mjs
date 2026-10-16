import assert from 'node:assert/strict';
import fs from 'node:fs';
import CSSOM from 'cssom';
import {cinematicPose,renderDimensions,POSTER_SIZE,cinematicVertex,cinematicFragment} from '../dist/cinematic.js';
import {T} from '../dist/geometry-kit.js';
for(const time of [-100,0,3,1e7,NaN,Infinity])for(const spread of [-100,0,.35,1,100,NaN,Infinity]){
 const pose=cinematicPose(time,spread,{x:Infinity,y:NaN});assert.ok(Object.values(pose).every(Number.isFinite));assert.ok(Math.abs(pose.x)<=1&&Math.abs(pose.y)<=1);
}
for(const [w,h]of [[360,780],[768,680],[1440,810],[3840,2160],[NaN,Infinity]])for(const quality of ['high','low'])for(const ratio of [1,2,3]){
 const size=renderDimensions(w,h,{quality,pixelRatio:ratio});assert.ok(size.width>0&&size.height>0&&size.width<=1920&&size.height<=1080);assert.deepEqual(renderDimensions(w,h,{resolution:'fullhd',quality,pixelRatio:ratio}),{width:1920,height:1080});
}
const image=fs.readFileSync(new URL('../dist/images/cinematic-space.webp',import.meta.url));assert.equal(image.toString('ascii',8,12),'WEBP');assert.equal(image.toString('ascii',12,16),'VP8 ');assert.deepEqual({width:image.readUInt16LE(26)&0x3fff,height:image.readUInt16LE(28)&0x3fff},POSTER_SIZE);assert.ok(image.length<500000,'poster stays below 500 KB');
assert.match(cinematicVertex,/gl_Position/);assert.match(cinematicFragment,/uniform sampler2D poster/);assert.ok(T.ShaderChunk.colorspace_fragment);assert.match(cinematicFragment,/#include <colorspace_fragment>/);
const css=fs.readFileSync(new URL('../dist/expansion.css',import.meta.url),'utf8');assert.ok(CSSOM.parse(css).cssRules.length>30);for(const width of [620,1000,1100])assert.ok(css.includes(`${width}px`));assert.match(css,/:fullscreen/);assert.match(css,/min-height:44px/);assert.match(css,/value-entry input\{width:160px/);assert.match(css,/data-data-expanded=true/);
console.log('PASS cinematic finite poses/resolution bounds, true 1920×1080 frame option, 1672×941 poster metadata, local asset budget and responsive CSS/shader contracts. Shader compilation and browser pixels are not tested.');
