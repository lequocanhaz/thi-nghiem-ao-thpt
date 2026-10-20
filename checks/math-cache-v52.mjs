import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import katex from 'katex';
import {mathMarkup,typesetMath} from '../dist/math.js';
import {formulaMarkup} from '../dist/workspace.js';
import {formulaCatalog} from '../dist/formula-catalog.js';
import {experiments} from '../dist/experiments.js';

const {document}=parseHTML('<html><body></body></html>');
let calls=[];
function engine(){calls=[];globalThis.katex={render:katex.render,renderToString(tex,options){calls.push({tex,options});return katex.renderToString(tex,options);}};}
function render(tex,display=false){const host=document.createElement('div');host.innerHTML=mathMarkup(tex,display);typesetMath(host);return host;}
engine();
const first=render(String.raw`\dfrac12`),second=render(String.raw`\dfrac12`);assert.equal(calls.length,1,'Identical formulas reuse rendered HTML');assert.equal(first.innerHTML,second.innerHTML);assert.ok(second.querySelector('math'),'Cached output retains accessible MathML');
render(String.raw`\dfrac12`,true);assert.equal(calls.length,2,'Inline/display must use separate cache entries');
for(const {options}of calls){assert.equal(options.trust,false);assert.equal(options.maxExpand,1000);assert.equal(options.output,'htmlAndMathml');}
const count=calls.length;typesetMath(first);assert.equal(calls.length,count,'Already-rendered nodes are not typeset again');
engine();render(String.raw`\dfrac12`);assert.equal(calls.length,1,'Replacing the math engine invalidates prior HTML');
engine();for(let i=0;i<129;i++)render('x_{'+i+'}');assert.equal(calls.length,129);render('x_{128}');assert.equal(calls.length,129,'A recently inserted entry remains cached');render('x_{0}');assert.equal(calls.length,130,'Old entries are evicted beyond the 128-entry bound');
engine();
for(const tex of [String.raw`\href{javascript:alert(1)}{click}`,String.raw`\htmlClass{injected}{x}`,String.raw`\includegraphics{https://example.org/track.png}`]){
 for(let repeat=0;repeat<2;repeat++){const host=render(tex);assert.equal(host.querySelector('a,img,script,[onclick],.injected'),null,'Untrusted TeX cannot create active HTML, including on cache hits');}
}
assert.equal(calls.length,3,'Safe engine output is reused for rejected trust commands');
const unsafe='<img src=x onerror=alert(1)>',escaped=render(unsafe);assert.equal(escaped.querySelector('img,script,[onerror]'),null,'Provider text cannot become HTML');
const invalid=String.raw`\frac{`;const before=calls.length;
for(let i=0;i<2;i++){const host=render(invalid),node=host.querySelector('.math-tex');assert.equal(node.dataset.mathRendered,'error');assert.equal(node.textContent,invalid,'Invalid TeX keeps readable source');}
assert.equal(calls.length,before+2,'Failed typesetting does not poison the HTML cache');
engine();
assert.equal(experiments.length,300);assert.deepEqual(Object.keys(formulaCatalog).sort(),experiments.map(e=>e.id).sort(),'Typesetting sidecar covers exactly the scientific catalog');
for(const e of experiments){const host=document.createElement('div');host.innerHTML=formulaMarkup(e);assert.equal(typesetMath(host),1,e.id+' typesets with actual KaTeX');assert.equal(host.querySelector('.math-tex').dataset.mathRendered,'true');assert.ok(host.querySelector('.katex math'),e.id+' retains accessible engine MathML');assert.ok(host.querySelector('.formula-fallback'),e.id+' preserves plain-text fallback');}
delete globalThis.katex;
console.log('PASS v52 math: real renderToString cache reuse, display/engine isolation, bounded eviction, trust:false security on cache hits, invalid-TeX recovery and all 300 formula sidecars.');
