// Quanh Lab mathematical typography. KaTeX is bundled locally into GitHub Pages
// during deployment: no AI output is interpreted as executable HTML.
const greek={
 'α':'\\alpha','β':'\\beta','γ':'\\gamma','δ':'\\delta','Δ':'\\Delta','ε':'\\varepsilon',
 'θ':'\\theta','λ':'\\lambda','μ':'\\mu','ν':'\\nu','ξ':'\\xi','π':'\\pi','ρ':'\\rho',
 'σ':'\\sigma','τ':'\\tau','φ':'\\varphi','Φ':'\\Phi','ω':'\\omega','Ω':'\\Omega',
 '∞':'\\infty','∈':'\\in','∉':'\\notin','≠':'\\ne','≤':'\\leq','≥':'\\geq',
 '≈':'\\approx','×':'\\times','·':'\\cdot','±':'\\pm','√':'\\sqrt',
 '∑':'\\sum','∫':'\\int','∂':'\\partial','∇':'\\nabla','→':'\\to','⇒':'\\Rightarrow'
};
const sup=Object.fromEntries([... '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ⁿ'].map((v,i)=>[v,[...'0123456789+-()n'][i]]));
const sub=Object.fromEntries([... '₀₁₂₃₄₅₆₇₈₉₊₋'].map((v,i)=>[v,[...'0123456789+-'][i]]));
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=String.raw`(?:\\(?:sin|cos|tan|cot|ln|log)\s*[a-zA-Z](?:\^\{[^{}]+\})?|(?:\\[a-zA-Z]+|[a-zA-Z0-9])(?:_\{[^{}]+\})?(?:\^\{[^{}]+\})?)`;
const frac=new RegExp('('+base+')\\s*\\/\\s*('+base+')','g');

/** Convert legacy Unicode school formulas to renderable LaTeX without changing their meaning.
 *  Complex authored formulas should use explicit LaTeX (\\frac, \\sqrt, etc).
 */
export function legacyFormulaToLatex(value){
 let s=String(value??'').trim();
 if(!s)return '';
 s=s.replace(/½/g,String.raw`\frac{1}{2}`)
    .replace(/¼/g,String.raw`\frac{1}{4}`)
    .replace(/¾/g,String.raw`\frac{3}{4}`)
    .replace(/−/g,'-')
    .replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁽⁾ⁿ]+)/g,m=>'^{' + [...m].map(c=>sup[c]).join('') + '}')
    .replace(/([₀₁₂₃₄₅₆₇₈₉₊₋]+)/g,m=>'_{' + [...m].map(c=>sub[c]).join('') + '}')
    .replace(/[αβγδΔεθλμνξπρστφΦωΩ∞∈∉≠≤≥≈×·±√∑∫∂∇→⇒]/g,c=>greek[c]||c)
    .replace(/(?<!\\)\b(sin|cos|tan|cot|ln|log|exp)\b/g,'\\$1 ')
    .replace(/(?<!\\)\b(sqrt)\b/g,'\\sqrt ')
    .replace(frac,(all,num,den)=>'\\dfrac{' +num.trim()+'}{'+den.trim()+'}');
 return s;
}

export function mathMarkup(tex,display=false){
 const value=String(tex??'').trim();
 return '<span class="math-tex'+(display?' math-block':'')+'" data-math-tex="'+escapeHtml(value)+'" data-math-display="'+(display?'true':'false')+'">'+escapeHtml(value)+'</span>';
}
export function typesetMath(root=globalThis.document){
 const katex=globalThis.katex;
 if(!root||typeof katex?.render!=='function')return 0;
 const nodes=[...(root.matches?.('.math-tex')?[root]:[]),...(root.querySelectorAll?.('.math-tex')||[])];
 let count=0;
 for(const node of nodes){
  if(node.dataset.mathRendered==='true')continue;
  const tex=node.getAttribute('data-math-tex')||node.textContent||'';
  if(!tex.trim())continue;
  try{
   katex.render(tex,node,{displayMode:node.dataset.mathDisplay==='true',
    throwOnError:true,trust:false,strict:'ignore',output:'htmlAndMathml',maxExpand:1000});
   node.dataset.mathRendered='true';
   node.closest?.('.math-formula')?.classList.add('has-katex');
   count++;
  }catch{
   // Never inject raw provider HTML; preserve readable escaped formula text.
   node.dataset.mathRendered='error';
  }
 }
 return count;
}
let installed=false;
export function installMathObserver(root=globalThis.document){
 if(installed||!root?.body)return;
 installed=true;
 typesetMath(root);
 if(typeof globalThis.MutationObserver!=='function')return;
 const observer=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes){
   if(node.nodeType===1&&(node.matches?.('.math-tex')||node.querySelector?.('.math-tex')))typesetMath(node);
  }
 });
 observer.observe(root.body,{childList:true,subtree:true});
}
