import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {fitModel,fitModels,fitSummary,residualSvg,reportMarkup} from '../dist/research.js';
import {experiments,initialState} from '../dist/experiments.js';
import {tableGraph,sweepStates} from '../dist/analytics.js';
import {evaluate,duration} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
const close=(a,b,rel=1e-9)=>assert.ok(Math.abs(a-b)<rel*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const [kind,xs,fn,a,b] of [
 ['linear',[-2,-1,0,1,2,3],x=>3*x+2,3,2],
 ['square',[0,1,2,3,4],x=>2*x*x-1,2,-1],
 ['inverse',[1,2,4,8,10],x=>10/x+3,10,3],
 ['inverseSquare',[1,2,4,8,10],x=>12/(x*x)+3,12,3],
 ['log',[1,2,4,8,16],x=>2*Math.log(x)+1,2,1]
]){const fit=fitModel(xs.map(x=>[x,fn(x)]),kind);close(fit.slope,a);close(fit.intercept,b);close(fit.r2,1);assert.ok(fit.rmse<1e-12);assert.ok(fit.residuals.every(p=>Math.abs(p[1])<1e-12));assert.ok(!/NaN|undefined|Infinity/.test(fitSummary(fit)+residualSvg(fit)));}
// Independent hand-calculated regression; this must not mirror the implementation.
const noisy=fitModel([[0,1],[1,2],[2,2]]);close(noisy.slope,.5);close(noisy.intercept,7/6);close(noisy.r2,.75);close(noisy.rmse,Math.sqrt(1/18));close(noisy.slopeSE,Math.sqrt(1/12));
assert.equal(fitModel([[1,2],[1,3],[1,4]]),null);assert.equal(fitModel([[1,2],[2,3]]),null);assert.equal(fitModel([[0,4],[1,4],[2,4]]).r2,null);
assert.equal(fitModel([[0,1],[1,2],[2,3],[3,4]],'inverse').excluded,1);
assert.equal(fitModel([[-1,1],[0,1],[1,2],[2,3],[3,4]],'log').excluded,2);
assert.equal(fitModel([[1,2],[2,3],[3,4]],'unsupported'),null);
close(fitModel([[1e-12,2],[2e-12,4],[3e-12,6]]).slope,2e12);
const inverse=fitModel([[-2,-5],[-1,-10],[1,10],[2,5]],'inverse');assert.ok(inverse.curve.some(p=>!Number.isFinite(p[1])),'Never bridge inverse singularity');
assert.ok(fitModels.some(m=>m.key==='inverseSquare'&&m.symbol==='1/x²'));
const inverseSquare=fitModel([[-2,3],[-1,12],[1,12],[2,3],[3,4/3]],'inverseSquare');
close(inverseSquare.slope,12);close(inverseSquare.intercept,0);
assert.ok(inverseSquare.curve.some(p=>!Number.isFinite(p[1])),'Never bridge inverse-square singularity, including when zero falls between samples');
const inverseSquareExcluded=fitModel([[0,1],[-0,1],[NaN,1],[Infinity,1],[1,12],[2,3],[3,4/3]],'inverseSquare');
assert.equal(inverseSquareExcluded.excluded,4);assert.equal(inverseSquareExcluded.n,3);
assert.ok(fitSummary(inverseSquareExcluded).includes('x = 0 hoặc số liệu không hữu hạn'));
assert.equal(fitModel([[-1,1],[1,2],[-1,3]],'inverseSquare'),null,'Opposite signs alone do not vary 1/x²');
assert.equal(fitModel([[0,1],[1,12],[2,3]],'inverseSquare'),null,'At least three usable points are needed');
assert.equal(fitModel([[1e-200,1],[2e-200,2],[3e-200,3]],'inverseSquare'),null,'Reject nonfinite transformed domains');
const tinyInverseSquare=fitModel([[1e-6,5],[2e-6,2],[4e-6,1.25]],'inverseSquare');
assert.ok(Math.abs(tinyInverseSquare.slope/4e-12-1)<1e-12);close(tinyInverseSquare.intercept,1);

// Independent reference values: Q=4 nC in vacuum, E=kQ/r²; F=qE for |q|=4 nC.
// Literal values and coefficients avoid deriving expectations through the model under test.
const electric=experiments.find(e=>e.id==='electric'),electricBase={...initialState(electric),q1:4,q2:-4,q0:1,x1:-.2,y1:0,z1:0,y2:0,z2:0,py:0,pz:0};
const reference=[[.05,14380.08286768,.00005752033147072],[.1,3595.02071692,.00001438008286768],[.2,898.75517923,.00000359502071692],[.4,224.6887948075,.00000089875517923]];
const relative=(actual,expected)=>assert.ok(Math.abs(actual/expected-1)<1e-10,`${actual} != ${expected} (relative)`);
for(const mode of [0,1]){
 const config={mode},electricRows=reference.map(([r,expectedE,expectedF])=>{const position=electricBase.x1+r,ss={...electricBase,x2:position,px:position},d=evaluate('electric',ss,config);
  relative(d.r1,r);relative(d.magnitude,mode===1?expectedE:expectedF);assert.equal(d.unit,mode===1?'N/C':'N');
  const reversed=evaluate('electric',{...ss,q2:4,q0:-1},config);relative(reversed.magnitude,d.magnitude);
  if(mode===0)relative(reversed.x,-d.x);else relative(reversed.x,d.x);
  return {values:tableValues('electric',ss,d,config),s:ss,d,c:config};
 });
 const electricGraph=tableGraph(electric,electricRows,4,6,'inverseSquare',config),fit=electricGraph.regression;
 relative(fit.slope,mode===1?35.9502071692:1.438008286768e-7);assert.ok(Math.abs(fit.intercept)<(mode===1?1e-9:1e-16));close(fit.r2,1);assert.equal(fit.n,4);
 assert.ok(fitSummary(fit).includes('Khớp tuyến tính theo 1/x²'));
 assert.ok(fitSummary(fit).includes('không thay thế kiểm chứng thực nghiệm'));
}
assert.equal(evaluate('electric',{...electricBase,px:-.19},{mode:1}),null,'Point-charge exclusion radius remains enforced');
relative(evaluate('electric',{...electricBase,px:-.18},{mode:1}).magnitude,89875.517923);
assert.ok(fitModel(reference.map(([r,e])=>[r,e]),'inverse').rmse>100,'1/r is not the point-field distance law');
const wrong=fitModel([1,2,3,4,5].map(x=>[x,8/x]),'linear');assert.ok(wrong.rmse>.3);assert.ok(wrong.residuals.some(p=>p[1]<0)&&wrong.residuals.some(p=>p[1]>0));
const e=experiments.find(e=>e.id==='boyle'),s=initialState(e),states=sweepStates(e,s,'v',2,10,10),rows=states.map(ss=>({values:tableValues(e.id,ss,evaluate(e.id,ss))}));
const g=tableGraph(e,rows,0,1,'inverse');close(g.regression.slope,evaluate(e.id,s).pv);assert.equal(g.regression.n,10);
const report=reportMarkup({experiment:e,state:s,rows,config:{graphMode:'measured',graphX:0,graphY:1},fit:g.regression,audit:'Biến khác cũng thay đổi',notes:'<script>alert(1)</script> & dữ liệu',graph:'<svg viewBox="0 0 1 1"></svg>',sources:[{publisher:'OpenStax',title:'Boyle',url:'https://openstax.org/'}],date:'14/10/2026'});
assert.ok(report.includes('&lt;script&gt;'));assert.ok(!report.includes('<script>'));assert.ok(report.includes('Biến khác cũng thay đổi'));assert.ok(report.includes('không phải phép đo thực'));assert.ok(report.includes('window.print()'));
const {document}=parseHTML(report);assert.equal(document.querySelectorAll('tbody tr').length,10);assert.ok(document.querySelector('details[open]'));assert.ok(document.querySelector('.residual-plot svg'));assert.ok(document.querySelector('a[href="https://openstax.org/"]'));
const phase=experiments.find(e=>e.id==='phasechange'),ps={...initialState(phase),power:100};assert.ok(duration(phase,ps,evaluate(phase.id,ps))>10);
console.log('PASS five independent analytic fits; inverse-square E/Coulomb reference values, signs, units, fixed-charge coefficients and point-source exclusion; reciprocal singularities and domains; hand-calculated noisy OLS, standard error, RMSE, constant-y undefined R², tiny x scales, Boyle recovery, escaped printable report and dynamic time duration. Node numeric/DOM checks only.');
