// Render scientific notation as a readable 10 with a superscript exponent.
// The result is plain text, so it works in HTML, SVG, canvas and copy/paste.
const exponentGlyphs = Object.freeze({
 '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'⁺'
});
const superscript = exponent => [...String(exponent)].map(c => exponentGlyphs[c] ?? c).join('');

export function scientificNumber(value,{locale='vi-VN',digits=2,compact=false}={}){
 if(!Number.isFinite(value))return '—';
 const decimals=Math.min(12,Math.max(0,Math.trunc(digits)));
 let [mantissa,exponent]=value.toExponential(decimals).split('e');
 if(compact)mantissa=mantissa.replace(/(?:\.0+|(\.\d*?)0+)$/,(match,prefix)=>prefix||'');
 if(locale==='vi-VN')mantissa=mantissa.replace('.',',');
 return `${mantissa}${compact?'×':' × '}10${superscript(Number(exponent))}`;
}
