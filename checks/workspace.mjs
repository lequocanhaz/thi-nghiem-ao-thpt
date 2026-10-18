import fs from 'node:fs';
import assert from 'node:assert/strict';
import CSSOM from 'cssom';
import {parseHTML} from 'linkedom';
import * as T from '../dist/vendor/three.module.min.js';
import {LabScene,pickDragTarget,buildLabModel} from '../dist/scene3d.js';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {tableGraph} from '../dist/analytics.js';
import {graphFor} from '../dist/graphs.js';
import {atEnd,pageWindow,layoutDefaults,cleanLayout,restorableRow,rowMatches,toolDescription,formulaMarkup} from '../dist/workspace.js';
import {labMarkup,homeMarkup} from '../dist/views.js';
const {document,window}=parseHTML('<html><body><main></main></body></html>');
globalThis.document=document;globalThis.matchMedia=()=>({matches:false});
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},roundRect(){},fill(){},stroke(){},measureText:s=>({width:s.length*18})});
assert.equal(cleanLayout(null).dockWidth,layoutDefaults.dockWidth);
assert.equal(cleanLayout({dockWidth:99999}).dockWidth,900);
assert.equal(cleanLayout({dockWidth:100}).dockWidth,360);
assert.equal(cleanLayout({chartHeight:'invalid'}).chartHeight,layoutDefaults.chartHeight);
assert.equal(cleanLayout({guidance:'false'}).guidance,false);
for(const e of experiments){
 const s=initialState(e),r={s,c:{mode:0,capMode:'charge'},d:evaluate(e.id,s)};
 assert.equal(restorableRow(e,r),true,e.id+' complete state');
 assert.equal(rowMatches(e,r,s,r.c),true);
 const missing=structuredClone(r);delete missing.s[e.params[0].key];assert.equal(restorableRow(e,missing),false,e.id+' incomplete state');
 const html=formulaMarkup(e);document.querySelector('main').innerHTML=html;assert.equal(document.querySelector('math').getAttribute('aria-label'),e.formula);assert.equal(document.querySelector('.formula-fallback').textContent,e.formula);
 assert.ok(toolDescription(e,s,'param:'+e.params.find(p=>p.key!=='t').key));
}
const ohm=experiments.find(e=>e.id==='ohm'),s=initialState(ohm),cfg={mode:0,capMode:'charge',switches:{handles:true}};
const rows=[0,null,6,12].map(u=>({values:[u,10,u===null?null:u/10],s:{...s,u:u??0},d:evaluate('ohm',{...s,u:u??0}),c:cfg}));
assert.deepEqual(tableGraph(ohm,rows,0,2).pointRows,[0,2,3]);
assert.deepEqual(graphFor(ohm,s,evaluate('ohm',s),cfg,rows.filter((r,i)=>i!==1)).pointRows,[0,1,2]);
// A hit in a hidden ancestor must never become a draggable target.
const root=new T.Group(),hidden=new T.Group(),handle=new T.Mesh(new T.BoxGeometry(1,1,1));handle.userData.drag='param:u';hidden.add(handle);root.add(hidden);hidden.visible=false;
assert.equal(pickDragTarget([{object:handle}],root),null);hidden.visible=true;assert.equal(pickDragTarget([{object:handle}],root).object,handle);
// Exercise real event handlers and projection offsets without a WebGL renderer.
const listeners=new Map(),canvas={style:{},addEventListener(k,fn){listeners.set(k,fn)},getBoundingClientRect:()=>({left:0,top:0,width:500,height:400}),focus(){},setPointerCapture(){},hasPointerCapture:()=>false};
let selected=null,dragged=null,hover=null;const stage=Object.create(LabScene.prototype);
Object.assign(stage,{renderer:{domElement:canvas},scene:new T.Scene(),controls:{enabled:true},model:{group:root},pointer:new T.Vector2(),camera:new T.PerspectiveCamera(),raycaster:{setFromCamera(){},intersectObjects:()=>[{object:handle}],ray:{intersectPlane:(plane,v)=>v.set(.25,.2,0)}},onSelect:key=>selected=key,onDrag:(key,p)=>dragged={key,p},onHover:value=>hover=value,id:'ohm',interaction:true});
root.updateMatrixWorld(true);stage.bindEvents();
const ev={clientX:250,clientY:200,button:0,pointerId:1,preventDefault(){},stopImmediatePropagation(){}};
listeners.get('pointermove')(ev);assert.equal(hover.key,'param:u');assert.ok(stage.hoverBox);
listeners.get('pointerdown')(ev);assert.equal(selected,'param:u');assert.equal(stage.controls.enabled,false);assert.ok(stage.drag.offset.distanceTo(new T.Vector3(-.25,-.2,0))<1e-8);
const activeDrag=stage.drag;listeners.get('pointerdown')({...ev,pointerId:2});assert.equal(stage.drag,activeDrag);listeners.get('pointermove')({...ev,pointerId:2});assert.equal(dragged,null);listeners.get('pointerup')({...ev,pointerId:2});assert.equal(stage.drag,activeDrag);listeners.get('pointermove')(ev);assert.equal(dragged.key,'param:u');assert.equal(dragged.p.x,0);listeners.get('pointerup')(ev);assert.equal(stage.drag,null);assert.equal(stage.controls.enabled,true);assert.equal(stage.hoverBox,null);
stage.setInteraction(false);assert.equal(canvas.style.touchAction,'pan-y');assert.equal(stage.controls.enabled,false);selected=null;listeners.get('pointerdown')(ev);assert.equal(selected,null);stage.setInteraction(true);assert.equal(canvas.style.touchAction,'none');
// Regression: rail and wave-driver cylinders used a color value as a height.
for(const id of ['oscillation','wave']){const e=experiments.find(e=>e.id===id),s=initialState(e),m=buildLabModel(id,s,evaluate(id,s),{labels:false,config:cfg});m.group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(m.group),size=b.getSize(new T.Vector3());assert.ok(Math.max(size.x,size.y,size.z)<25,id+' apparatus must fit the lab-scale drawing');m.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.()});}
console.log('PASS v9 pure state and geometry: 300 restoration schemas/MathML, filtered point indices, hidden hit rejection, real pointer handlers/offset/highlight cleanup, touch scroll gating and corrected cylinder bounds. No GPU rendering.');
// CSS cascade contracts at the requested widths. This is code inspection, not pixel layout.
const css=CSSOM.parse(['styles.css','interface.css','visual.css','expansion.css','refinement.css'].map(f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8')).join('\n'));
function mediaMatches(q,width,coarse=false){if(q.includes('pointer:coarse')||q.includes('pointer: coarse'))return coarse;if(q.includes('prefers-reduced-motion'))return false;let m;for(const x of q.matchAll(/(min|max)-width:\s*(\d+)px/g)){if(x[1]==='min'&&width<+x[2]||x[1]==='max'&&width>+x[2])return false;}return true;}
function rulesAt(rules,width,coarse){return rules.flatMap(r=>r.media?mediaMatches(r.media.mediaText,width,coarse)?rulesAt([...r.cssRules],width,coarse):[]:r.cssRules?[]:[r]);}
function specificity(s){return (s.match(/#[\w-]+/g)||[]).length*100+(s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g)||[]).length*10+(s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|:[\w-]+(?:\([^)]*\))?/g,'').match(/\b[a-zA-Z][\w-]*/g)||[]).length;}
function property(el,name,width,coarse=false){let value='',best=-1;for(const r of rulesAt([...css.cssRules],width,coarse)){if(!r.selectorText||!r.style.getPropertyValue(name))continue;for(const selector of r.selectorText.split(',')){let matches=false;try{matches=el.matches(selector.trim());}catch{}if(matches){const weight=specificity(selector)+(r.style.getPropertyPriority(name)?1e5:0);if(weight>=best){value=r.style.getPropertyValue(name);best=weight;}}}}return value;}
const prefs={favorites:[],recent:[],progress:{},layout:{...layoutDefaults}};
for(const width of [360,768,1440])for(const mode of ['explore','measure','present']){
 document.querySelector('main').innerHTML=labMarkup(ohm,{prefs,state:s,config:cfg,controls:'<div class="control-body"></div>',panel:'data',mode,experiments},()=>'<svg></svg>');const lab=document.querySelector('.lab');Object.assign(lab.dataset,{controlsCollapsed:'false',dockCollapsed:mode==='explore'?'true':'false',mobileControls:'false'});
 const controls=document.querySelector('.controls'),dock=document.querySelector('.research-dock'),work=document.querySelector('.experiment-work');
 assert.equal(work.parentElement,document.querySelector('.workspace'));assert.equal(controls.previousElementSibling.dataset.resize,'controlsWidth');assert.equal(dock.parentElement,work);assert.equal(dock.previousElementSibling.className,'instrument-zone');
 if(width===1440&&mode!=='present'){assert.equal(property(document.querySelector('.workspace'),'grid-template-columns',width),'minmax(0,1fr) 20px var(--controls-width,380px)');assert.equal(property(work,'display',width),'flex');assert.equal(property(work,'flex-direction',width),'column');assert.equal(property(controls,'position',width),'sticky');assert.equal(property(dock,'position',width),'static');}
 assert.equal(property(document.querySelector('.guide-disclosure'),'display',width),mode==='present'?'none':'');
 if(mode==='present')assert.equal(property(controls,'display',width),'none',`${width} ${mode} controls hidden`);
 else assert.equal(property(controls,'display',width),'flex');
 if(mode==='explore'||mode==='present')assert.equal(property(dock,'display',width),'none',`${width} ${mode} dock hidden`);
 if(width<=1100&&mode!=='present'){lab.dataset.mobileControls='true';assert.equal(property(controls,'display',width),'flex');assert.equal(property(controls,'position',width),'static');assert.equal(property(document.querySelector('.workspace'),'display',width),'flex');}
 assert.equal(property(document.querySelector('.control-body'),'overflow',width),width<=1100?'visible':'auto');
 assert.equal(property(document.querySelector('.visual'),'touch-action',width,true),'pan-y');
}
console.log('PASS v12 CSS + DOM structure contracts at 360/768/1440: right sticky parameters, analysis below apparatus, optional guide,  all three modes, hidden panels, visible inline parameters, independent controls scrolling and touch gating. Actual bounding boxes/screenshots are NOT tested.');
// v14 checks the code contracts for small-screen catalog navigation and input targets.
for(const width of [360,768,1440]){
 document.querySelector('main').innerHTML=homeMarkup(experiments,prefs,{search:'',grade:'all',topic:'all',filter:'all',pathFilter:null},()=>'<svg/>');
 const pageNumbers=document.createElement('div');pageNumbers.className='page-numbers';document.querySelector('#pagination').append(pageNumbers);
 const pageJump=document.createElement('label');pageJump.className='page-jump';document.querySelector('#pagination').append(pageJump);
 assert.equal(property(pageNumbers,'display',width),width<=800?'none':'flex');assert.equal(property(pageJump,'display',width),width<=800?'flex':'none');
 assert.equal(document.querySelector('.banner-copy>p'),null,'Redundant banner instructions removed');
 assert.ok(document.querySelector('.entry-heading [data-action="progress"]'),'progress stays accessible after reducing banner text');
 for(const selector of ['.grade-filters button','.search-clear','.banner-model-links a'])assert.ok(parseFloat(property(document.querySelector(selector),'min-height',width))>=44,selector+' target at '+width);
 document.querySelector('main').innerHTML=labMarkup(ohm,{prefs,state:s,config:cfg,controls:'<div class="control-body"></div>',panel:'data',mode:'measure',experiments},()=>'<svg/>');
 for(const selector of ['.mode-switch button','.direct-tools select','.back'])assert.ok(parseFloat(property(document.querySelector(selector),'min-height',width))>=44,selector+' target at '+width);
 const mini=document.querySelector('.speech-mini');assert.equal(property(mini,'display',width),'none','idle voice controls hidden');mini.removeAttribute('hidden');assert.equal(property(mini,'display',width),'flex');document.querySelector('.lab').dataset.layout='present';assert.equal(property(mini,'display',width),'flex','speech remains stoppable during presentation');
}
console.log('PASS v14 CSS contracts: native mobile page jump, compact mobile banner with progress retained, 44 px principal targets and non-overlay shared voice player. No bounding boxes or browser rendering.');

for(const max of [1e-15,1e-9,.02,10,1e8]){assert.equal(atEnd(0,max),false);assert.equal(atEnd(max/2,max),false);assert.equal(atEnd(max,max),true);}assert.equal(atEnd(NaN,1),false);assert.equal(atEnd(1,Infinity),false);for(let total=1;total<=50;total++)for(let page=1;page<=total;page++){const entries=pageWindow(page,total);assert.ok(entries.includes(page));assert.ok(entries.filter(Boolean).length<=7);assert.equal(new Set(entries.filter(Boolean)).size,entries.filter(Boolean).length);}
console.log('PASS relative time boundaries from femtoseconds to years and 1,275 pagination windows.');

// Black reading text on light surfaces; readable white copy on the video.
for(const width of [360,768,1440]){
 document.querySelector('main').innerHTML=homeMarkup(experiments,prefs,{search:'',grade:'all',topic:'all',filter:'all',pathFilter:null},()=>'<svg/>');
 assert.equal(document.querySelector('.banner-footer'),null);assert.equal(document.querySelector('.banner-copy .eyebrow'),null);assert.ok(!/NASA|Full HD|Phát video|Tạm dừng video/.test(document.querySelector('.main-banner').textContent));
 assert.equal(property(document.querySelector('.banner-resume'),'color',width),'#fff');assert.equal(property(document.querySelector('.banner-topline'),'color',width),'#fff');
 for(const className of ['parameter-note','analysis-caption','card-purpose','source-note']){const p=document.createElement('p');p.className=className;document.querySelector('main').append(p);const value=property(p,'color',width);assert.ok(value==='#000'||value==='var(--muted)',className+' black reading text');}
 assert.ok(parseFloat(property(document.querySelector('.banner-expand'),'min-height',width))>=44);
}
console.log('PASS v18 CSS/DOM contracts at 360/768/1440: clean banner, 44px fullscreen control, black reading copy and white video copy. No browser pixels.');
