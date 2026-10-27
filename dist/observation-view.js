// Read analytical relation data from a renderer without importing WebGL on home.
// Keep charts outside the apparatus so text stays horizontal and readable.
import {foundationAxisLabels,observationAxisLabel,observationNumber} from './observation-labels.js?v=65';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const states=new WeakMap();
const finite=Number.isFinite;
const imageNames={vi:{real:'Ảnh thật',virtual:'Ảnh ảo',infinite:'Ảnh ở vô cực',none:'Không có ảnh hữu hạn',afocal:'Hệ không tiêu'},en:{real:'Real image',virtual:'Virtual image',infinite:'Image at infinity',none:'No finite image',afocal:'Afocal system'}};
export function updateOpticsObservation(host,data,locale='vi-VN'){
 if(!host||!data)return false;
 const lang=locale==='en-US'?'en':'vi',en=lang==='en',old=states.get(host);
 const notes=data.notes?.[lang]||[],legend=data.legend||[],values=data.values||[];
 const imageKind=data.image?.afocal?'afocal':data.image?.kind;
 const title=en?'Understand the ray diagram':'Hiểu sơ đồ tia sáng';
 const content=JSON.stringify([data.id,locale,notes,legend,values,imageKind]);
 host.hidden=false;host.setAttribute('aria-label',title);
 if(old?.optics===content)return true;
 const disclosure=host.querySelector('.observation-details'),open=old&&disclosure?disclosure.hasAttribute('open'):true;
 host.innerHTML=`<details class="observation-details" ${open?'open':''}><summary>${title}</summary><div class="observation-content">
  ${imageKind&&imageKind!=='none'&&imageNames[lang][imageKind]?`<p class="observation-title">${imageNames[lang][imageKind]}</p>`:''}
  <ul class="optics-legend">${legend.map(item=>`<li><span class="optics-line optics-line-${['incident','reflected','refracted','virtual','axis','inside','emergent'].includes(item.kind)?item.kind:'axis'} ${item.dashed?'optics-line-dashed':''}" style="--ray-color:${/^#[0-9a-f]{6}$/i.test(item.color||'')?item.color:'#66788e'}" aria-hidden="true"></span>${esc(item.labels?.[lang]||item.kind)}</li>`).join('')}</ul>
  <ul class="optics-notes">${notes.map(note=>`<li>${esc(note)}</li>`).join('')}</ul>
  ${values.length?`<dl class="optics-values">${values.map(v=>`<div><dt>${esc(v.label?.[lang]||v.key)}</dt><dd>${esc(v.value===null?'—':observationNumber(v.value,locale))} ${esc(v.unit||'')}</dd></div>`).join('')}</dl>`:''}
 </div></details>`;
 states.set(host,{optics:content});return true;
}
export function readObservation(group,id,english=false){
 if(!group||!id)return null;
 const core=group.getObjectByName('concept-'+id+'-plot')?.userData.observation;
 if(core)return core;
 const foundation=group.getObjectByName('foundation-concept-'+id)?.userData.foundationConcept;
 if(foundation&&typeof foundation==='object')return {
  ...foundation.range,xLabel:(english?foundationAxisLabels[id]?.[0]||foundation.inputKey:foundation.inputLabel)+' ('+(foundation.xUnit||'1')+')',
  yLabel:(english?foundationAxisLabels[id]?.[1]||foundation.outputKey:foundation.outputLabel)+' ('+(foundation.yUnit||'1')+')',
  title:english?'Controlled relationship':'Quan hệ khi giữ các biến khác không đổi',
  points:foundation.points,current:foundation.current,kind:foundation.plotKind,excludedInputs:foundation.excludedInputs
 };
 const panel=group.getObjectByName('discovery-concept-'+id),relation=panel?.userData.relation,current=panel?.userData.current;
 if(relation)return{...relation,xmin:relation.min,xmax:relation.max,title:english?relation.en:relation.title,points:relation.samples,current:current?[current.x,current.y]:null,kind:'continuous'};
 return null;
}
export function relationPaths(points,project,discrete=false){
 let path='',circles='',newSegment=true;
 for(const source of points||[]){
  const point=Array.isArray(source)?source:source?[source.x,source.y]:null;
  if(!point||!point.every(finite)){newSegment=true;continue;}
  const [x,y]=project(point);
  if(discrete)circles+=`<circle cx="${x}" cy="${y}" r="2.5"/>`;
  else{path+=(newSegment?'M':'L')+x+' '+y+' ';newSegment=false;}
 }
 return{path,circles};
}
export function updateObservation(host,group,id,locale='vi-VN'){
 if(!host)return;
 const optics=group?.userData?.opticsObservation;
 if(optics?.id===id){updateOpticsObservation(host,optics,locale);return;}
 const en=locale==='en-US',source=readObservation(group,id,en),data=source?{...source,xLabel:observationAxisLabel(source.xLabel,en),yLabel:observationAxisLabel(source.yLabel,en)}:null;
 if(!data||![data.xmin,data.xmax,data.ymin,data.ymax].every(finite)||data.xmax<=data.xmin||data.ymax<=data.ymin){host.hidden=true;return;}
 host.hidden=false;host.setAttribute('aria-label',en?'Observe a theoretical relationship':'Quan sát quan hệ lý thuyết');
 const old=states.get(host),number=x=>observationNumber(x,locale),tick=x=>observationNumber(x,locale,true);
 const measured=Number(host.clientWidth),width=Math.max(260,Math.min(1000,Number.isFinite(measured)&&measured>0?measured-32:600)),height=224,left=72,right=18,top=20,bottom=48;
 const project=p=>[left+(p[0]-data.xmin)/(data.xmax-data.xmin)*(width-left-right),height-bottom-(p[1]-data.ymin)/(data.ymax-data.ymin)*(height-top-bottom)];
 const signature=JSON.stringify([id,locale,width,data.xmin,data.xmax,data.ymin,data.ymax,data.xLabel,data.yLabel,data.title]);
 if(!old||old.signature!==signature||old.points!==data.points){
  const disclosure=host.querySelector('.observation-details'),open=old&&disclosure?disclosure.hasAttribute('open'):true;
  const valuesOpen=old?host.querySelector('.observation-values')?.open===true:false;
  const paths=relationPaths(data.points,project,data.kind==='discrete-points'),zero=project([data.xmin,0])[1];
  const rows=(data.points||[]).map(p=>Array.isArray(p)?p:p?[p.x,p.y]:null).filter(p=>p&&p.every(finite));
  const rowMarkup=()=>rows.map(p=>`<tr><td>${esc(number(p[0]))}</td><td>${esc(number(p[1]))}</td></tr>`).join('');
  host.innerHTML=`<details class="observation-details" ${open?'open':''}><summary>${en?'Observe the relationship':'Quan sát quan hệ'}</summary><div class="observation-content"><p class="observation-title">${esc(data.title)}</p>
   <p class="observation-key"><span><i class="theory-key"></i>${en?'Analytical prediction':'Đường lý thuyết'}</span><span><i class="current-key"></i>${en?'Current state':'Trạng thái hiện tại'}</span></p>
   <svg class="observation-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="observationPlotTitle observationPlotDescription"><title id="observationPlotTitle">${esc(data.yLabel)} — ${esc(data.xLabel)}</title><desc id="observationPlotDescription">${en?'The blue prediction keeps other parameters fixed. The orange point shows the current model output. Numeric values are available below.':'Đường màu xanh giữ các tham số khác cố định. Điểm màu cam là kết quả mô hình hiện tại. Các giá trị số nằm bên dưới.'}</desc>
    <path class="observation-axes" d="M${left} ${top}V${height-bottom}H${width-right}"/>
    ${zero>=top&&zero<=height-bottom?`<path class="observation-zero" d="M${left} ${zero}H${width-right}"/>`:''}
    <path class="observation-curve" d="${paths.path}"/><g class="observation-samples">${paths.circles}</g><circle class="observation-current" r="5" hidden/>
    <g class="observation-ticks"><text x="${left-8}" y="${top+5}" text-anchor="end">${esc(tick(data.ymax))}</text><text x="${left-8}" y="${height-bottom}" text-anchor="end">${esc(tick(data.ymin))}</text><text x="${left}" y="${height-bottom+20}">${esc(tick(data.xmin))}</text><text x="${width-right}" y="${height-bottom+20}" text-anchor="end">${esc(tick(data.xmax))}</text></g>
   </svg><div class="observation-axis-labels"><p>y: ${esc(data.yLabel)}</p><p>x: ${esc(data.xLabel)}</p></div><p class="observation-current-value"></p>
   <details class="observation-values" ${valuesOpen?'open':''}><summary>${en?'View theoretical values':'Xem giá trị lý thuyết'} (${rows.length})</summary><table><thead><tr><th scope="col">${esc(data.xLabel)}</th><th scope="col">${esc(data.yLabel)}</th></tr></thead><tbody>${valuesOpen?rowMarkup():''}</tbody></table></details>
   <p class="observation-note">${en?'Calculated from the ideal model; these are not recorded measurements.':'Tính từ mô hình lý tưởng; đây không phải các điểm đo đã ghi.'}${data.excludedInputs?.length?' '+esc((en?'Undefined input, curve split at: ':'Mô hình không xác định, đường đứt tại: ')+data.excludedInputs.map(number).join(', ')):''}</p></div></details>`;
  const values=host.querySelector('.observation-values');values.addEventListener('toggle',()=>{if(values.open&&!values.querySelector('tbody').childElementCount)values.querySelector('tbody').innerHTML=rowMarkup();});
  states.set(host,{signature,points:data.points});
 }
 const current=data.current,visible=current?.every(finite)&&current[0]>=data.xmin&&current[0]<=data.xmax&&current[1]>=data.ymin&&current[1]<=data.ymax;
 const marker=host.querySelector('.observation-current');marker.toggleAttribute('hidden',!visible);marker.style.display=visible?'':'none';
 if(visible){const [x,y]=project(current);marker.setAttribute('cx',x);marker.setAttribute('cy',y);}
 const text=current?.every(finite)?`${en?'Current':'Hiện tại'}: x = ${number(current[0])}; y = ${number(current[1])}${visible?'':en?' (outside chart range)':' (ngoài miền đồ thị)'}`:(en?'No finite model value at this state.':'Không có giá trị mô hình hữu hạn tại trạng thái này.');
 const output=host.querySelector('.observation-current-value');if(output.textContent!==text)output.textContent=text;
}
