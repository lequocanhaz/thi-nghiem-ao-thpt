import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {experiments,initialState} from '../dist/experiments.js';
import {evaluate} from '../dist/models.js';
import {graphFor} from '../dist/graphs.js';
import {plotGrid} from '../dist/plot-grid.js';
import {LabAssistant} from '../dist/assistant.js';

let charts=0;
for(const e of experiments){
 const state=initialState(e),g=graphFor(e,state,evaluate(e.id,state),{},[]);
 for(const width of [220,264,300,390,560,900])for(const height of [260,380]){
  const plot=plotGrid(g,width,height),{document}=parseHTML('<svg>'+plot.markup+'</svg>');
  assert.equal(plot.w,width);assert.equal(plot.h,height);
  assert.ok(plot.pw>55&&plot.ph>55,e.id+' usable plot at '+width+'×'+height);
  assert.ok(!/NaN|Infinity|undefined/.test(plot.markup),e.id+' finite chart');
  assert.ok(Math.abs(plot.xx(g.xmin)-plot.m.l)<1e-7);assert.ok(Math.abs(plot.yy(g.ymax)-plot.m.t)<1e-7);
  const titles=[...document.querySelectorAll('.plot-axis-title')];assert.equal(titles.length,2);
  assert.equal([...titles[0].querySelectorAll('tspan')].map(n=>n.textContent).join(' '),g.xLabel);
  assert.equal([...titles[1].querySelectorAll('tspan')].map(n=>n.textContent).join(' '),g.yLabel);
  if(width<440)assert.equal(titles[1].hasAttribute('transform'),false,'Narrow charts place the y label above the plot');
  for(const tick of document.querySelectorAll('.plot-tick')){
   const x=Number(tick.getAttribute('x')),y=Number(tick.getAttribute('y'));
   assert.ok(x>=0&&x<=width&&y>=0&&y<=height,e.id+' tick anchor stays inside chart');
  }
  charts++;
 }
}
const escaped=plotGrid({xmin:0,xmax:1,ymin:0,ymax:1,xLabel:'<img src=x>',yLabel:'A & B'},264,380);
assert.equal(parseHTML('<svg>'+escaped.markup+'</svg>').document.querySelector('img'),null);

const {document}=parseHTML('<body><button id="openAssistant"></button></body>');
let context={id:'ohm',title:'Định luật Ohm'},sent,resolve;
const chat=new LabAssistant({document,getContext:()=>context,coarsePointer:()=>true,endpoint:'https://fixture.invalid/chat',fetcher:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({answer:'Đã nhận.'});}});
let inputFocus=0,headingFocus=0;chat.input.focus=()=>inputFocus++;chat.q('#aiTitle').focus=()=>headingFocus++;
chat.open();assert.equal(inputFocus,0,'Opening on touch does not request the software keyboard');assert.equal(headingFocus,1);
assert.equal(chat.q('.ai-context').textContent,'Định luật Ohm');chat.input.value='Nháp riêng bài điện';
context={id:'library',title:'Thư viện'};chat.refreshContext();assert.equal(chat.input.value,'');assert.equal(chat.q('.ai-context').textContent,'Thư viện thí nghiệm');
chat.input.value='Tìm bài dao động';await chat.send();assert.equal(sent.context.id,'library');assert.equal(sent.question,'Tìm bài dao động');
context={id:'ohm',title:'Định luật Ohm'};chat.refreshContext();assert.equal(chat.input.value,'Nháp riêng bài điện');
chat.fetcher=()=>new Promise(r=>resolve=r);const pending=chat.send();context={id:'wave',title:'Sóng cơ'};chat.refreshContext();resolve(Response.json({error:'Bận'},{status:503}));await pending;
assert.equal(chat.input.value,'');assert.equal(chat.q('.ai-context').textContent,'Sóng cơ');assert.match(chat.status.textContent,/bài trước/);
context={id:'ohm',title:'Định luật Ohm'};chat.refreshContext();assert.equal(chat.input.value,'Nháp riêng bài điện');
chat.coarsePointer=()=>false;chat.open();assert.equal(inputFocus,1,'Desktop still focuses the question field');
console.log('PASS v34:',charts,'responsive catalog charts; unmodified domains; wrapped/escaped labels; touch focus; context/draft isolation; late errors stay associated with the previous activity. DOM/geometry checks, no browser pixels.');
