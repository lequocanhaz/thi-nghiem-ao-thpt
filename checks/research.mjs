import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {fitModel,fitSummary,residualSvg,reportMarkup} from '../dist/research.js';
import {experiments,initialState} from '../dist/experiments.js';
import {tableGraph,sweepStates} from '../dist/analytics.js';
import {evaluate,duration} from '../dist/models.js';
import {tableValues} from '../dist/measurements.js';
const close=(a,b,rel=1e-9)=>assert.ok(Math.abs(a-b)<rel*Math.max(1,Math.abs(b)),`${a} != ${b}`);
for(const [kind,xs,fn,a,b] of [
 ['linear',[-2,-1,0,1,2,3],x=>3*x+2,3,2],
 ['square',[0,1,2,3,4],x=>2*x*x-1,2,-1],
 ['inverse',[1,2,4,8,10],x=>10/x+3,10,3],
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
const wrong=fitModel([1,2,3,4,5].map(x=>[x,8/x]),'linear');assert.ok(wrong.rmse>.3);assert.ok(wrong.residuals.some(p=>p[1]<0)&&wrong.residuals.some(p=>p[1]>0));
const e=experiments.find(e=>e.id==='boyle'),s=initialState(e),states=sweepStates(e,s,'v',2,10,10),rows=states.map(ss=>({values:tableValues(e.id,ss,evaluate(e.id,ss))}));
const g=tableGraph(e,rows,0,1,'inverse');close(g.regression.slope,evaluate(e.id,s).pv);assert.equal(g.regression.n,10);
const report=reportMarkup({experiment:e,state:s,rows,config:{graphMode:'measured',graphX:0,graphY:1},fit:g.regression,audit:'Biến khác cũng thay đổi',notes:'<script>alert(1)</script> & dữ liệu',graph:'<svg viewBox="0 0 1 1"></svg>',sources:[{publisher:'OpenStax',title:'Boyle',url:'https://openstax.org/'}],date:'14/10/2026'});
assert.ok(report.includes('&lt;script&gt;'));assert.ok(!report.includes('<script>'));assert.ok(report.includes('Biến khác cũng thay đổi'));assert.ok(report.includes('không phải phép đo thực'));assert.ok(report.includes('window.print()'));
const {document}=parseHTML(report);assert.equal(document.querySelectorAll('tbody tr').length,10);assert.ok(document.querySelector('details[open]'));assert.ok(document.querySelector('.residual-plot svg'));assert.ok(document.querySelector('a[href="https://openstax.org/"]'));
const phase=experiments.find(e=>e.id==='phasechange'),ps={...initialState(phase),power:100};assert.ok(duration(phase,ps,evaluate(phase.id,ps))>10);
console.log('PASS four independent analytic fits, hand-calculated noisy OLS, standard error, RMSE, constant-y undefined R², tiny x scales, excluded domains, inverse singularity, Boyle recovery, escaped printable report and dynamic time duration.');
