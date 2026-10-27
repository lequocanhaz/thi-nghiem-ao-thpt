import {scientificNumber} from './number-format.js?v=66';
// Shared numeric spacing for SVG charts and calibrated model grids.
export function tickStep(min,max,target=4){
 const raw=Math.abs(max-min)/target;if(!Number.isFinite(raw)||raw===0)return 1;
 const power=10**Math.floor(Math.log10(raw)),fraction=raw/power;
 return [1,2,2.5,5,10].find(n=>n>=fraction)*power;
}
export function tickValues(min,max,step){
 if(!Number.isFinite(min)||!Number.isFinite(max)||!(step>0)||!Number.isFinite(step))return [];
 const count=Math.min(100,Math.floor((max-min)/step+1e-8)+2),first=Math.ceil(min/step-1e-9);
 return Array.from({length:count},(_,i)=>(first+i)*step).filter(n=>n<=max+step*1e-8).map(n=>Math.abs(n)<step*1e-8?0:Number(n.toPrecision(12)));
}
export function tickText(value,step){
 if(value===0)return '0';
 if(Math.abs(value)>=1e5||Math.abs(value)<.001)return scientificNumber(value,{digits:1,compact:true});
 const digits=Math.min(8,Math.max(0,-Math.floor(Math.log10(step)))+(Math.abs(step/10**Math.floor(Math.log10(step))-2.5)<1e-8?1:0));
 return value.toLocaleString('vi-VN',{maximumFractionDigits:digits});
}
const escapeLabel=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function plotLabelLines(text,span){
 const limit=Math.max(8,Math.floor(span/10)),lines=[];let line='';
 for(const word of String(text??'').split(/\s+/).filter(Boolean)){
  if(line&&line.length+word.length+1>limit){lines.push(line);line='';}
  line+=(line?' ':'')+word;
 }
 if(line)lines.push(line);return lines.length?lines:[''];
}
export function plotGrid(g,w=560,h=360,enabled=true){
 w=Math.max(220,Math.round(w));h=Math.max(260,Math.round(h));
 const horizontalY=w<440,xLines=plotLabelLines(g.xLabel,w-24),yLines=plotLabelLines(g.yLabel,horizontalY?w-24:h-110);
 const yStep=tickStep(g.ymin,g.ymax,Math.max(2,Math.floor((h-100)/64))),ys=tickValues(g.ymin,g.ymax,yStep);
 const longest=Math.max(...ys.map(y=>tickText(y,yStep).length),3),m={l:Math.min(w*.45,Math.max(78,Math.min(124,34+longest*10))+(horizontalY?0:(yLines.length-1)*20)),r:30,t:horizontalY?22+yLines.length*21:28,b:62+(xLines.length-1)*21};
 const xStep=tickStep(g.xmin,g.xmax,Math.max(1,Math.floor((w-m.l-m.r)/100))),xs=tickValues(g.xmin,g.xmax,xStep);
 m.r=Math.min(w*.22,Math.max(m.r,...xs.map(x=>tickText(x,xStep).length*5+8)));
 const pw=w-m.l-m.r,ph=h-m.t-m.b;
 const xx=x=>m.l+(x-g.xmin)/(g.xmax-g.xmin)*pw,yy=y=>h-m.b-(y-g.ymin)/(g.ymax-g.ymin)*ph;
 const lines=(values,vertical)=>values.map(n=>`<path d="${vertical?'M'+xx(n)+' '+m.t+'v'+ph:'M'+m.l+' '+yy(n)+'h'+pw}"/>`).join('');
 const grid=enabled?`<g class="plot-grid-minor" fill="none" stroke="#e9edf4" stroke-width=".7">${lines(tickValues(g.xmin,g.xmax,xStep/5),true)}${lines(tickValues(g.ymin,g.ymax,yStep/5),false)}</g><g class="plot-grid-major" fill="none" stroke="#ccd6e5" stroke-width="1">${lines(xs,true)}${lines(ys,false)}</g>`:'';
 const labels=xs.map(x=>`<text class="plot-tick" x="${xx(x)}" y="${h-m.b+28}" text-anchor="middle">${tickText(x,xStep)}</text>`).join('')+ys.map(y=>`<text class="plot-tick" x="${m.l-14}" y="${yy(y)+6}" text-anchor="end">${tickText(y,yStep)}</text>`).join('');
 const axis=(lines,x,y,rotate=false)=>`<text class="plot-axis-title" x="${x}" y="${y}" text-anchor="middle"${rotate?` transform="rotate(-90 ${x} ${y})"`:''}>${lines.map((line,i)=>`<tspan x="${x}" dy="${i?21:0}">${escapeLabel(line)}</tspan>`).join('')}</text>`;
 const titles=axis(xLines,w/2,h-m.b+51)+(horizontalY?axis(yLines,w/2,20):axis(yLines,18,m.t+ph/2,true));
 return {w,h,m,pw,ph,xx,yy,xLines,yLines,markup:grid+labels+titles};
}
