import assert from 'node:assert/strict';
import fs from 'node:fs';
import CSSOM from 'cssom';
import {parse as parseSelector} from 'css-what';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {labMarkup,homeMarkup} from '../dist/views.js';
import {modelLabel} from '../dist/model-label.js';
import {withCoordinates} from '../dist/coordinates.js';
import {projectScene,drawProjection} from '../dist/software-scene.js';
import {LabAssistant} from '../dist/assistant.js';
import * as T from '../dist/vendor/three.module.min.js';

// Resolve actual CSS rules and specificity, without claiming browser layout or pixels.
const sheets=['app'].map(name=>CSSOM.parse(fs.readFileSync(new URL('../dist/'+name+'.css',import.meta.url),'utf8')));
const weight=tokens=>tokens.reduce((sum,t)=>sum+(t.type==='tag'?1:t.type==='attribute'?(t.name==='id'?100:10):t.type==='pseudo'?(Array.isArray(t.data)?Math.max(...t.data.map(weight)):10):0),0);
const rules=[];let order=0;
function collect(list,conditions=[]){for(const r of list){if(r.media){collect(r.cssRules,[...conditions,r.media.mediaText]);continue;}if(!r.selectorText)continue;
 for(const selector of r.selectorText.split(/,(?![^()]*\))/)){let specificity;try{specificity=Math.max(...parseSelector(selector).map(weight));}catch{continue;}rules.push({selector,style:r.style,specificity,conditions,order:order++});}}}
for(const sheet of sheets)collect(sheet.cssRules);
function media(query,v){return query.split(',').some(part=>{if(/print/.test(part))return false;for(const [,bound,axis,n]of part.matchAll(/(min|max)-(width|height)\s*:\s*(\d+)px/g)){if(bound==='min'&&v[axis]<+n||bound==='max'&&v[axis]>+n)return false;}if(/pointer\s*:\s*coarse/.test(part)&&!v.coarse)return false;if(/pointer\s*:\s*fine/.test(part)&&v.coarse)return false;if(/prefers-reduced-motion\s*:\s*reduce/.test(part)&&!v.reduce)return false;return true;});}
const propertyRules=new Map();
function style(node,key,v){if(!propertyRules.has(key))propertyRules.set(key,rules.filter(r=>r.style.getPropertyValue(key)));let winner;for(const r of propertyRules.get(key)){const value=r.style.getPropertyValue(key);if(!value||!r.conditions.every(c=>media(c,v)))continue;let matches=false;try{matches=node.matches(r.selector);}catch{}if(!matches)continue;const rank=(r.style.getPropertyPriority(key)==='important'?1e12:0)+r.specificity*10000+r.order;if(!winner||rank>=winner.rank)winner={value,rank};}return winner?.value||'';}
const index=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const {document,window}=parseHTML(index);globalThis.document=document;
const prefs={favorites:[],recent:[],progress:{},layout:{dataExpanded:true,guidance:false}},config={viewMode:'3d',viewPlane:'front',switches:{axes:true,labels:false}};
const control='<div class="control-heading"><h2>Thông số</h2></div><div class="control-body"><div class="parameter"><label class="value-entry"><input type="number"></label></div></div>';
let layouts=0;
for(const width of [360,390,620,768,1024,1440]){
 const v={width,height:width<700?780:900,coarse:width<1100};
 document.querySelector('#main').innerHTML=homeMarkup(experiments,prefs,{search:'',grade:'all',topic:'all',filter:'all'},()=> '');
 assert.equal(style(document.querySelector('.header'),'height',v),'auto','Header must accommodate wrapped navigation at '+width);
 assert.equal(style(document.querySelector('.banner-copy'),'width',v),'auto','No 100%-width banner offset overflowing at '+width);
 assert.equal(style(document.body,'font-family',v),"Inter,'Segoe UI',sans-serif");assert.equal(style(document.querySelector('#bannerTitle'),'font-weight',v),'750');assert.equal(style(document.querySelector('#libraryTitle'),'font-weight',v),'750');
 const strong=document.createElement('strong');document.body.append(strong);assert.equal(style(strong,'font-weight',v),'700');strong.remove();
 if(width<=1100)assert.equal(style(document.querySelector('.header'),'position',v),'relative','Header must not obscure mobile model');
 for(const e of experiments){
  document.querySelector('#main').innerHTML=labMarkup(e,{prefs,state:initialState(e),config,controls:control,panel:'data',mode:'explore',staticMode:e.static,experiments},()=> '');
  const workspace=document.querySelector('.workspace');
  assert.equal(style(workspace,'display',v),width<=1100?'flex':'grid',e.id+' workspace '+width);
  assert.equal(style(document.querySelector('.instrument-zone'),'min-width',v),'0',e.id+' shrinkable model column');
  if(width<=1100){const body=document.querySelector('.control-body');assert.equal(style(body,'overflow',v),'auto');assert.ok(style(body,'max-height',v).includes('56svh'));}
  if(width<=800){assert.equal(style(document.querySelector('.direct-tools'),'display',v),'grid');assert.equal(style(document.querySelector('#dragKey'),'font-size',v),'16px');}
  document.querySelector('#play').hidden=true;assert.equal(style(document.querySelector('#play'),'display',v),'none',e.id+' hidden static controls');
  layouts++;
 }
}
// Shared responsive modes must not leave fixed drawers or stale grid tracks.
for(const width of [360,768,1024,1440]){
 const v={width,height:800,coarse:width<1100};
 document.querySelector('#main').innerHTML=labMarkup(experiments[0],{prefs,state:initialState(experiments[0]),config,controls:control,panel:'data',mode:'explore',staticMode:false,experiments},()=> '');
 const lab=document.querySelector('.lab'),controls=document.querySelector('.controls');
 lab.setAttribute('data-controls-collapsed','true');assert.equal(style(controls,'display',v),'none');lab.removeAttribute('data-controls-collapsed');
 lab.setAttribute('data-layout','present');assert.equal(style(controls,'display',v),'none');assert.equal(style(document.querySelector('.direct-tools'),'display',v),'none');
 lab.setAttribute('data-layout','measure');assert.equal(style(controls,'display',v),'flex');assert.ok(style(document.querySelector('.workspace'),'grid-template-columns',v).includes('minmax(0,1fr)'));
 if(width<=1100){assert.equal(style(controls,'position',v),'relative');assert.equal(style(document.querySelector('.controls-resizer'),'display',v),'none');}
 const visual=document.querySelector('.visual');assert.equal(style(visual,'min-width',v),'0');
 assert.equal(style(document.querySelector('#time'),'min-width',v),'0');
}
// The texture stays transparent on initial paint and numeric updates.
const paints=[];window.HTMLCanvasElement.prototype.getContext=function(){return {clearRect(){paints.push('clear')},measureText:()=>({width:100}),fillText(text){paints.push({text,color:this.fillStyle,font:this.font})},fillRect(){throw Error('Opaque label background')},fill(){throw Error('Label background fill')},stroke(){throw Error('Label border')}};};
const group=new T.Group(),sprite=modelLabel(group,'x (m)',new T.Vector3());sprite.userData.setText('0,25');
assert.equal(sprite.material.transparent,true);assert.equal(sprite.material.depthWrite,false);assert.equal(sprite.material.depthTest,false);
assert.ok(paints.filter(p=>p.text).every(p=>p.color==='#000000'&&p.font.startsWith('400 ')));
const model=withCoordinates({group:new T.Group(),update(){}},'projectile',{},null,{config:{switches:{axes:true}}});
const camera=new T.OrthographicCamera(-8,8,6,-6,.01,100);camera.position.set(0,2,20);camera.lookAt(0,2,0);camera.updateProjectionMatrix();
const items=projectScene(model.group,camera,360,300);assert.ok(items.some(p=>p.kind==='text'));assert.ok(items.filter(p=>p.kind==='text').every(p=>p.color==='#000000'));
let background=0,text=0;drawProjection({clearRect(){},fillRect(){background++},fillText(){text++},beginPath(){},moveTo(){},lineTo(){},stroke(){},setLineDash(){},closePath(){},fill(){}},items,360,300);assert.equal(background,1,'Only one scene background, no label rectangles');assert.ok(text>0);
// Mobile keyboard and visual viewport pan: visible bounds rather than layout viewport height.
const listeners=new Map(),viewport={height:780,offsetTop:0,addEventListener:(name,fn)=>listeners.set(name,fn)};
const chat=new LabAssistant({document,viewport,endpoint:'https://example.invalid/chat'});chat.open();assert.equal(chat.root.style.getPropertyValue('--chat-height'),'764px');
chat.input.value='Bản nháp được giữ';viewport.height=360;viewport.offsetTop=120;listeners.get('resize')();assert.equal(chat.root.style.getPropertyValue('--chat-height'),'344px');assert.equal(chat.root.style.getPropertyValue('--chat-top'),'128px');
viewport.height=780;viewport.offsetTop=0;listeners.get('scroll')();assert.equal(chat.root.style.getPropertyValue('--chat-top'),'8px');assert.equal(chat.input.value,'Bản nháp được giữ');chat.close();assert.equal(chat.root.hidden,true);
const report={catalogExperiments:experiments.length,cssCascadeCases:layouts,widths:[360,390,620,768,1024,1440],transparentBlackLabels:true,keyboardViewport:true,note:'CSS cascade, DOM and CPU projection checks only; no browser rendering, touch hardware or iOS Safari device test.'};
fs.writeFileSync(new URL('./mobile-audit-v33.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log('PASS',JSON.stringify(report));
