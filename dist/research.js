import {scientificNumber} from './number-format.js?v=66';
const transforms={linear:x=>x,square:x=>x*x,inverse:x=>x===0?NaN:1/x,inverseSquare:x=>x===0?NaN:1/(x*x),log:x=>x>0?Math.log(x):NaN};
export const fitModels=[{key:'linear',label:'Tuyến tính',symbol:'x'},{key:'square',label:'Bậc hai',symbol:'x²'},{key:'inverse',label:'Nghịch đảo',symbol:'1/x'},{key:'inverseSquare',label:'Nghịch đảo bình phương',symbol:'1/x²'},{key:'log',label:'Logarit',symbol:'ln(x/x₀)'}];

// Ordinary least squares in z=f(x). Residuals and goodness of fit remain in y units.
// These estimates describe the fit to simulated states, not instrument uncertainty.
export function fitModel(input,kind='linear'){
  const transform=transforms[kind];if(!transform)return null;
  const points=input.filter(p=>p.length===2&&p.every(v=>typeof v==='number'&&Number.isFinite(v))&&Number.isFinite(transform(p[0])));
  const n=points.length;if(n<3)return null;
  const z=points.map(p=>transform(p[0])),mz=z.reduce((a,v)=>a+v,0)/n,my=points.reduce((a,p)=>a+p[1],0)/n;
  const szz=z.reduce((a,v)=>a+(v-mz)**2,0),span=Math.max(...z)-Math.min(...z);
  if(span===0||!Number.isFinite(szz)||szz===0)return null;
  const slope=z.reduce((a,v,i)=>a+(v-mz)*(points[i][1]-my),0)/szz,intercept=my-slope*mz;
  if(!Number.isFinite(slope)||!Number.isFinite(intercept))return null;
  const predict=x=>slope*transform(x)+intercept,residuals=points.map(([x,y])=>[x,y-predict(x)]);
  const sse=residuals.reduce((a,p)=>a+p[1]**2,0),sst=points.reduce((a,p)=>a+(p[1]-my)**2,0);
  const variance=sse/(n-2),rmse=Math.sqrt(sse/n),r2=sst===0?null:1-sse/sst;
  const slopeSE=Math.sqrt(variance/szz),interceptSE=Math.sqrt(variance*(1/n+mz*mz/szz));
  const xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0]));
  const curve=Array.from({length:161},(_,i)=>{const x=xmin+(xmax-xmin)*i/160;return [x,predict(x)];});
  // Split reciprocal branches at zero instead of drawing across a singularity.
  if(kind==='inverse'||kind==='inverseSquare')for(let i=1;i<curve.length;i++)if(curve[i-1][0]<0&&curve[i][0]>=0)curve[i]=[curve[i][0],NaN];
  return {kind,slope,intercept,r2,rmse,slopeSE,interceptSE,n,excluded:input.length-n,points,residuals,curve};
}

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(v)?(Math.abs(v)>1e6||(v!==0&&Math.abs(v)<.0001)?scientificNumber(v,{digits:3}):v.toLocaleString('vi-VN',{maximumSignificantDigits:5})):'—';
export function residualSvg(fit){
  if(!fit)return '';
  const w=420,h=190,m={l:74,r:20,t:20,b:42},xs=fit.residuals.map(p=>p[0]);
  let min=Math.min(...xs),max=Math.max(...xs);if(min===max)max=min+1;
  const range=Math.max(...fit.residuals.map(p=>Math.abs(p[1])),Math.max(...fit.points.map(p=>Math.abs(p[1])))*1e-10,1e-15)*1.2;
  const xx=x=>m.l+(x-min)/(max-min)*(w-m.l-m.r),yy=y=>(h-m.b+m.t)/2-y/range*(h-m.t-m.b)/2;
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Phần dư y trừ giá trị khớp theo x"><path d="M${m.l} ${m.t}v${h-m.t-m.b}h${w-m.l-m.r}" fill="none" stroke="#c7d4dd"/><path d="M${m.l} ${yy(0)}H${w-m.r}" stroke="#758b98" stroke-dasharray="5 4"/><text x="${m.l-10}" y="${yy(0)+5}" text-anchor="end">0</text><text x="${m.l-10}" y="${yy(range)+5}" text-anchor="end">${num(range)}</text><text x="${m.l-10}" y="${yy(-range)+5}" text-anchor="end">${num(-range)}</text>${fit.residuals.map(([x,y])=>`<circle cx="${xx(x)}" cy="${yy(y)}" r="4" fill="#bd6539"/>`).join('')}<text x="${m.l}" y="${h-14}">${num(min)}</text><text x="${w-m.r}" y="${h-14}" text-anchor="end">${num(max)}</text><text x="${w/2}" y="${h-14}" text-anchor="middle">x</text></svg>`;
}
export function fitSummary(fit){
  if(!fit)return '<p class="analysis-empty">Thu ít nhất 3 điểm với x thay đổi để khớp mô hình.</p>';
  const f=fitModels.find(m=>m.key===fit.kind);
  return `<div class="fit-equation">y = ${num(fit.slope)}·${f.symbol} ${fit.intercept<0?'−':'+'} ${num(Math.abs(fit.intercept))}</div><div class="fit-metrics"><span><small>R²</small><b>${num(fit.r2)}</b></span><span><small>RMSE</small><b>${num(fit.rmse)}</b></span><span><small>Điểm khớp</small><b>${fit.n}</b></span></div><details class="fit-details"><summary>Hệ số & phần dư</summary><div class="coefficient-table"><span>a ± SE</span><b>${num(fit.slope)} ± ${num(fit.slopeSE)}</b><span>b ± SE</span><b>${num(fit.intercept)} ± ${num(fit.interceptSE)}</b></div><div class="residual-heading">Phần dư · y − ŷ</div><div class="residual-plot">${residualSvg(fit)}</div><p>Bình phương tối thiểu thường; chưa xét bất định trục x. SE là sai số chuẩn của phép khớp, không phải sai số dụng cụ. R² không xác định khi y không đổi. ${fit.kind==='log'?'x₀ = 1 theo đơn vị trục x. ' :''}${fit.kind==='inverseSquare'?'Khớp tuyến tính theo 1/x²: y = a/x² + b. Khi x là khoảng cách, chỉ dùng x > 0. Với một điện tích nguồn điểm cố định, giữ điện tích nguồn không đổi; với lực Coulomb, giữ cả điện tích chịu lực. Không mặc định áp dụng cho trường tổng hợp nhiều nguồn. Phép khớp không thay thế kiểm chứng thực nghiệm. ':''} ${fit.excluded?`${fit.excluded} điểm bị loại: ${['inverse','inverseSquare'].includes(fit.kind)?'x = 0 hoặc số liệu không hữu hạn':fit.kind==='log'?'x ≤ 0':'số liệu không hữu hạn'}.`:''} <a href="https://www.itl.nist.gov/div898/handbook/pmd/section4/pmd441.htm" target="_blank" rel="noopener noreferrer">Phương pháp phần dư · NIST ↗</a></p></details>`;
}
export function reportMarkup({experiment,state,rows,config,fit,audit='',notes,graph,sources,date}){
  const headers=experiment.headers,params=experiment.params.filter(p=>p.key!=='t');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(experiment.shortTitle)} · Phiếu khảo sát</title><style>body{font:16px/1.65 system-ui,sans-serif;color:#193140;max-width:1080px;margin:48px auto;padding:0 24px}h1{font-size:40px;line-height:1.2;letter-spacing:-.04em}h2{margin-top:32px;font-size:22px}.meta{color:#54707b}.label{font-size:12px;text-transform:uppercase;letter-spacing:.15em;color:#347260}.conditions{display:flex;flex-wrap:wrap;gap:10px}.conditions span{padding:8px 12px;background:#f0f5f3;border:1px solid #dae5df;border-radius:5px}table{border-collapse:collapse;width:100%;font-size:13px;white-space:nowrap}td,th{padding:8px;border:1px solid #dce3e7;text-align:right}th{background:#f0f4f5}.scroll{overflow:auto}svg{width:100%;max-height:370px}svg text{font:17px system-ui;fill:#456575}.fit-metrics{display:flex;gap:30px}.fit-metrics small{display:block;color:#54707b}.fit-equation{font-size:23px}.fit-details{margin-top:18px}.coefficient-table{display:grid;grid-template-columns:110px 1fr}.residual-plot{max-width:650px}.notes{white-space:pre-wrap}button{padding:10px 16px;font:inherit;background:#193140;color:white;border:0;cursor:pointer}.print{position:fixed;right:24px;top:20px}a{color:#276858}@media print{.print{display:none}body{margin:0;padding:0}details{display:block}h2,table,svg{break-inside:avoid}}</style></head><body><button class="print" onclick="window.print()">In / Lưu PDF</button><p class="label">Vật lí Lab / Phiếu khảo sát</p><h1>${escape(experiment.shortTitle)}</h1><p class="meta">${escape(date)} · ${escape(experiment.topic)} · Lớp ${experiment.grade} · ${rows.length} trạng thái</p><p>Số liệu được tính từ mô hình mô phỏng, không phải phép đo thực. Các tham số dưới đây là trạng thái cuối; tệp phiên JSON lưu thiết lập của từng dòng.</p><h2>Điều kiện khảo sát</h2><div class="conditions">${params.map(p=>`<span>${escape(p.label)}: <b>${num(state[p.key])} ${escape(p.unit)}</b></span>`).join('')}<span>t = ${num(state.t||0)} s</span></div><p>${escape(experiment.limit)}</p><h2>Quan hệ mô hình</h2><p>${escape(experiment.formula)}</p>${graph?`<h2>Đồ thị · ${escape(config.graphMode==='measured'?'Các trạng thái đã ghi':'Mô hình')}</h2>${graph}`:''}${fit?`<h2>Khớp dữ liệu</h2><p>x: ${escape(headers[config.graphX])} · y: ${escape(headers[config.graphY])}</p>${fitSummary(fit).replace('<details class="fit-details">','<details class="fit-details" open>')}${audit?`<p>${escape(audit)}</p>`:''}`:''}<h2>Bảng số liệu</h2><div class="scroll"><table><thead><tr><th>Lần</th>${headers.map(h=>`<th>${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td>${r.values.map(v=>`<td>${typeof v==='number'?num(v):escape(v===null?'—':v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><h2>Nhận xét</h2><p class="notes">${escape(notes||'Chưa có ghi chép.')}</p><h2>Nguồn đối chiếu</h2><ul>${sources.map(r=>`<li><a href="${escape(r.url)}">${escape(r.publisher)} · ${escape(r.title)}</a></li>`).join('')}</ul></body></html>`;
}
