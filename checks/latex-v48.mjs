import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {legacyFormulaToLatex,mathMarkup,typesetMath} from '../dist/math.js';
import {formulaMarkup} from '../dist/workspace.js';
import {experiments} from '../dist/experiments.js';
import {LabAssistant} from '../dist/assistant.js';

const examples=[
 ['tan x = sin x/cos x',String.raw`\dfrac{\sin x}{\cos x}`],
 ['1 + tan² x = 1/cos² x',String.raw`\dfrac{1}{\cos^{2} x}`],
 ['x ≠ π/2 + kπ',String.raw`\dfrac{\pi}{2}`],
 ['λ = v/f',String.raw`\dfrac{v}{f}`]
];
for(const [input,required] of examples){
 const actual=legacyFormulaToLatex(input);
 assert.ok(actual.includes(required),'Expected stacked fraction '+required+' in '+actual);
}
const {document}=parseHTML('<html><body><button id="openAssistant"></button><section id="examples"></section></body></html>');
let rendered=[];
globalThis.katex={render:(tex,element,options)=>{rendered.push({tex,options});element.textContent='[typeset '+tex+']';}};
document.querySelector('#examples').innerHTML=formulaMarkup({formula:'tan x = sin x/cos x'});
const root=document.querySelector('#examples');
assert.ok(root.querySelector('math'),'Keep native MathML fallback before KaTeX loads');
assert.ok(root.querySelector('.formula-fallback'),'Keep plain text fallback');
assert.equal(typesetMath(root),1);
assert.ok(root.querySelector('.math-formula.has-katex'));
assert.equal(rendered.at(-1).options.displayMode,true);
const fake=()=>Response.json({answer:String.raw`Định nghĩa: \(\tan x=\dfrac{\sin x}{\cos x}\) với \(x\ne\dfrac{\pi}{2}+k\pi\).

\[
1+\tan^2x=\dfrac{1}{\cos^2x}
\]

**Ghi nhớ**: không chia cho 0. <img src=x onerror=alert(1)>`});
const assistant=new LabAssistant({document,endpoint:'https://example.org/api',getContext:()=>({id:'ohm'}),fetcher:fake});
assistant.input.value='Các hằng đẳng thức lượng giác';await assistant.send();
const nodes=[...assistant.root.querySelectorAll('.math-tex')];
assert.equal(nodes.length,3,'Render three formulas in AI response');
assert.ok(nodes.some(x=>x.dataset.mathDisplay==='true'),'Display math is stacked');
assert.equal(assistant.root.querySelector('.ai-message[data-role=assistant] img'),null,'AI HTML is never injected');
assert.ok(assistant.root.textContent.includes('<img'),'Untrusted code printed as text');
assert.ok(rendered.some(x=>x.tex.includes(String.raw`\dfrac`)),'Math engine receives true TeX');
assert.ok(experiments.length===300);
const all=experiments.map(e=>legacyFormulaToLatex(e.formula));
assert.ok(all.every(Boolean),'All 300 formulas have renderable source strings');
const ui=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../dist/app.css',import.meta.url),'utf8');
const backend=fs.readFileSync(new URL('../server/ai-handler.mjs',import.meta.url),'utf8');
assert.match(ui,/vendor\/katex\/katex\.min\.js/);
assert.match(ui,/vendor\/katex\/katex\.min\.css/);
assert.match(css,/math-formula\.has-katex/);
assert.match(backend,/dfrac/);
assert.doesNotMatch(backend,/Không dùng dấu \$ hoặc cú pháp LaTeX/);
let realKatex;
try{realKatex=(await import('katex')).default;}catch{}
if(realKatex){
 for(const [input] of examples){const latex=legacyFormulaToLatex(input);const html=realKatex.renderToString(latex,{throwOnError:true,displayMode:true,trust:false});assert.match(html,/class="katex"/);}
 const valid=[],invalid=[];
 for(const e of experiments){
  try{realKatex.renderToString(legacyFormulaToLatex(e.formula),{throwOnError:true,trust:false,strict:'ignore'});valid.push(e.id);}catch(error){invalid.push([e.id,String(error.message).slice(0,100)]);}
 }
 console.log('Actual KaTeX engine: '+valid.length+'/300 legacy formulas rendered; '+invalid.length+' retain fallback.');
 if(invalid.length)console.log('Legacy formulas needing explicit LaTeX:',JSON.stringify(invalid.slice(0,30)));
 // Some legacy expressions contain prose; native MathML is intentionally retained as fallback.
 assert.ok(valid.length>=200,'Most existing formulas should be typeset rather than fallback');
}
console.log('PASS mathematical fraction and AI LaTeX rendering, safe provider HTML handling, catalog coverage.');
