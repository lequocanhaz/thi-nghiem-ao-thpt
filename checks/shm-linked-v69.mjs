import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {evaluate} from '../dist/models.js';
import {mountCircle,updateCircle} from '../dist/shm-circle.js';

// Independent geometry check: recover the diagram's scale and contacts from its
// actual SVG, then compare the cart against the authoritative oscillator engine.
const {document}=parseHTML('<section id="linked-fixture"></section>');
globalThis.document=document;
const host=document.querySelector('#linked-fixture');
mountCircle(host,()=>{},'en-US');
const $=selector=>host.querySelector(selector);
const attr=(node,name)=>{
 assert.ok(node?.hasAttribute(name),'Actual SVG attribute '+name);
 const value=Number(node.getAttribute(name));assert.ok(Number.isFinite(value));return value;
};
const close=(actual,expected,label,tolerance=1e-8)=>assert.ok(
 Number.isFinite(actual)&&Number.isFinite(expected)&&Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),
 `${label}: ${actual} != ${expected}`
);
const translate=node=>{
 const q=node.getAttribute('transform').match(/^translate\(\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)\s*\)$/);
 assert.ok(q,'Actual cart translation');return q.slice(1).map(Number);
};
const pathPoints=node=>{
 const d=node.getAttribute('d');assert.match(d,/^M\s/);assert.doesNotMatch(d,/[^ML\d\seE.,+\-]/);
 const values=d.match(/[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g).map(Number);
 assert.equal(values.length%2,0);return Array.from({length:values.length/2},(_,i)=>[values[2*i],values[2*i+1]]);
};
const outline=$('.shm-circle-outline'),radius=attr(outline,'r'),centerX=attr(outline,'cx');
const cart=$('[data-shm-cart]'),body=cart.querySelector('rect'),wheels=[...cart.querySelectorAll('circle')];
const wall=$('.shm-model-wall'),rail=$('.shm-model-rail');
const wallRight=attr(wall,'x')+attr(wall,'width');
const bodyLeft=attr(body,'x'),bodyRight=bodyLeft+attr(body,'width'),bodyTop=attr(body,'y'),bodyBottom=bodyTop+attr(body,'height');
const railLeft=Math.min(attr(rail,'x1'),attr(rail,'x2')),railRight=Math.max(attr(rail,'x1'),attr(rail,'x2')),railY=attr(rail,'y1');
assert.ok(radius>0&&bodyLeft<0&&bodyRight>0);
assert.equal(attr(rail,'y2'),railY,'Rail is horizontal');
const nodes=[$('.shm-circle-svg'),cart,$('[data-shm-spring]'),$('[data-shm-h]')];
let states=0,minClearance=Infinity,minSpringLength=Infinity,maxPositionError=0,maxDerivativeError=0;
function verify(state){
 const data=Object.freeze(evaluate('oscillation',state));
 const input=JSON.stringify({state,data});
 assert.equal(updateCircle(host,state,data,'en-US'),true);
 assert.equal(JSON.stringify({state,data}),input,'Presentation cannot mutate physical state or results');
 assert.deepEqual(nodes,[$('.shm-circle-svg'),$('[data-shm-cart]'),$('[data-shm-spring]'),$('[data-shm-h]')],'Keep the same SVG/cart/spring/H nodes');
 const [x,y]=translate(cart),h=$('[data-shm-h]'),m=$('[data-shm-m]');
 const expected=centerX+radius*data.x/state.a;
 maxPositionError=Math.max(maxPositionError,Math.abs(x-expected));
 close(x,expected,'Cart follows normalized engine displacement');
 close(x,attr(h,'cx'),'Cart and H have exactly the same horizontal coordinate');
 close(x,attr(m,'cx'),'M and its physical projection share an abscissa');
 const drop=$('[data-shm-model-drop]');
 close(attr(drop,'x1'),x,'Projection construction begins above cart');close(attr(drop,'x2'),x,'Projection remains vertical');
 close(attr(drop,'y1'),attr(h,'cy'),'Construction begins at H');close(attr(drop,'y2'),y+bodyTop,'Construction reaches top of mass');
 const points=pathPoints($('[data-shm-spring]'));
 close(points[0][0],wallRight,'Spring attaches to wall');close(points.at(-1)[0],x+bodyLeft,'Spring attaches to cart left face');
 close(points[0][1],y,'Spring anchor is at cart center height');close(points.at(-1)[1],y,'Spring cart attachment is at center height');
 for(let i=1;i<points.length;i++)assert.ok(points[i][0]>points[i-1][0],'Spring segments cannot turn backward or invert');
 const length=points.at(-1)[0]-points[0][0];assert.ok(length>0,'Spring length stays positive');minSpringLength=Math.min(minSpringLength,length);
 const clearance=x+bodyLeft-wallRight;assert.ok(clearance>0,'Cart never intersects the anchor');minClearance=Math.min(minClearance,clearance);
 assert.ok(x+bodyLeft>=railLeft&&x+bodyRight<=railRight,'Cart remains supported throughout its full excursion');
 for(const wheel of wheels){close(y+attr(wheel,'cy')+attr(wheel,'r'),railY,'Wheel contacts the rail');close(attr(wheel,'cy')-attr(wheel,'r'),bodyBottom,'Wheel meets the cart body');}
 assert.ok(x>=centerX-radius-1e-8&&x<=centerX+radius+1e-8,'Cart stays inside the ±A scale');
 states++;
 return x;
}
for(const a of [.1,5,50])for(const period of [.05,2,20]){
 for(let degree=0;degree<=360;degree+=2)verify(Object.freeze({a,period,t:degree/360*period}));
 for(const t of [19.999,20])verify(Object.freeze({a,period,t}));
 // Differentiate the actual rendered cart position; no circleState oracle.
 for(const fraction of [.037,.125,.211,.38,.63,.82,.963]){
  const t=fraction*period,h=period*1e-6;
  const x0=verify(Object.freeze({a,period,t:t-h}));
  const x1=verify(Object.freeze({a,period,t:t+h}));
  const actual=(x1-x0)/(2*h),expected=radius/a*evaluate('oscillation',{a,period,t}).v;
  const error=Math.abs(actual-expected)/Math.max(1,Math.abs(expected));maxDerivativeError=Math.max(maxDerivativeError,error);
  close(actual,expected,'Rendered cart velocity agrees with the measured velocity',1e-7);
 }
}
assert.match(host.textContent,/scales to ±A; measured values use cm/,'Normalized scaling is disclosed');
console.log('PASS linked SHM v69:',JSON.stringify({states,minClearance,minSpringLength,maxPositionError,maxDerivativeError,
 scope:'Actual SVG contacts, supported cart, normalized engine displacement and finite-difference velocity; Node/DOM only, not browser/device or aesthetic certification.'}));
