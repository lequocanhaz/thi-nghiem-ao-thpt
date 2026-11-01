import {englishParameter} from './english-study.js?v=56';
const version=1,maxText=6000;
const words={
 title:['Phiếu khảo sát của bạn','Your investigation'],intro:['Dự đoán → Chọn biến → Khảo sát → Ghi số liệu → Phân tích → Kết luận → Vận dụng','Predict → Choose variables → Investigate → Record → Analyse → Conclude → Apply'],
 privacy:['Chỉ lưu trên trình duyệt này. Không gửi cho AI hoặc giáo viên.','Saved in this browser only. Not sent to AI or a teacher.'],support:['Hiện gợi ý','Show prompts'],prediction:['1. Dự đoán','1. Predict'],predictionHint:['Đại lượng nào sẽ thay đổi, theo hướng nào? Vì sao?','Which quantity will change, in which direction, and why?'],variables:['2. Chọn biến','2. Choose variables'],independent:['Biến thay đổi','Variable to change'],controlled:['Các biến giữ cố định','Variables to hold constant'],choose:['Chọn một biến…','Choose a variable…'],none:['Bài này không có tham số điều chỉnh. Ghi các điều kiện khảo sát bên dưới.','This experiment has no adjustable parameters. Describe the conditions below.'],conditions:['Điều kiện và kế hoạch khảo sát','Conditions and investigation plan'],conditionsHint:['Nêu khoảng khảo sát, các trạng thái cần ghi và điều kiện giữ nguyên.','Describe the range, states to record, and conditions held fixed.'],investigate:['3–5. Khảo sát, ghi và phân tích','3–5. Investigate, record and analyse'],record:['Ghi trạng thái vào bảng đo','Record state in data table'],data:['Mở bảng đo và đồ thị','Open data and graph'],observations:['Bằng chứng và phân tích của bạn','Your evidence and analysis'],observationsHint:['Ghi ít nhất 5 trạng thái hoặc số lượt phù hợp với mô hình; dẫn ít nhất hai giá trị cùng đơn vị. Xu hướng có phù hợp dự đoán không?','Record at least 5 states or an appropriate number of trials; cite at least two values with units. Does the trend support your prediction?'],conclusion:['6. Ghi kết luận','6. Write a conclusion'],conclusionHint:['Kết luận bằng lời của bạn; nêu bằng chứng, điều kiện áp dụng và một giới hạn.','Use your own words; include evidence, conditions, and one limitation.'],application:['7. Vận dụng','7. Apply'],applicationHint:['Đề xuất một tình huống mới để thử kết luận và giải thích dự đoán của bạn.','Propose a new situation to test your conclusion and explain your prediction.'],export:['Xuất phiếu JSON','Export worksheet JSON'],saved:['Đã lưu trên trình duyệt này.','Saved in this browser.'],unavailable:['Không lưu được trên trình duyệt. Hãy xuất phiếu để giữ nội dung.','Browser storage is unavailable. Export the worksheet to keep your work.'],manual:['Phiếu do bạn tự viết; gợi ý không tự điền kết luận.','This is your own work; prompts never fill in a conclusion.']};
const fields=['prediction','conditions','observations','conclusion','application'];
export function inquiryStorageKey(id){return 'quanh-inquiry-v72:'+id;}
export function normalizeInquiry(value,experiment){
 const raw=value&&typeof value==='object'?value:{},keys=new Set((experiment.params||[]).map(p=>p.key));
 const state={version,experimentId:experiment.id,independent:keys.has(raw.independent)?raw.independent:'',controlled:[],support:raw.support!==false};
 state.controlled=Array.isArray(raw.controlled)?[...new Set(raw.controlled.filter(k=>keys.has(k)&&k!==state.independent))]:[];
 for(const f of fields)state[f]=typeof raw[f]==='string'?raw[f].slice(0,maxText):'';
 return state;
}
let counter=0;
export function mountInquiry(host,experiment,options={}){
 if(!host)return null;
 const doc=options.document||host.ownerDocument,uid='inquiry-'+(++counter),params=experiment.params||[];
 let storage=options.storage,locale=options.locale||doc.documentElement.lang||'vi-VN',storageOK=true,destroyed=false;
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storageOK=false;}}
 let loaded;try{const text=storage?.getItem(inquiryStorageKey(experiment.id));loaded=text?JSON.parse(text):null;}catch{storageOK=false;}
 let state=normalizeInquiry(loaded,experiment);
 const en=()=>locale.toLowerCase().startsWith('en'),t=k=>words[k][en()?1:0];
 const make=(tag,parent,className)=>{const node=doc.createElement(tag);if(className)node.className=className;parent?.append(node);return node;};
 const text=(tag,key,parent,className)=>{const node=make(tag,parent,className);node.dataset.inquiryText=key;return node;};
 const root=make('details',host,'inquiry-workbook');root.dataset.experiment=experiment.id;
 text('summary','title',root);
 const body=make('div',root,'inquiry-body');text('p','intro',body,'inquiry-sequence');text('p','privacy',body,'inquiry-privacy');
 const toggleLabel=make('label',body,'inquiry-support'),toggle=make('input',toggleLabel);toggle.type='checkbox';toggle.checked=state.support;text('span','support',toggleLabel);
 const form=make('div',body,'inquiry-fields'),inputs={};
 const part=(name)=>{const details=make('details',form,'inquiry-step');text('summary',name,details);return make('div',details,'inquiry-step-body');};
 const area=(name,parent)=>{const label=text('label',name,parent);const input=make('textarea',parent);input.id=uid+'-'+name;label.htmlFor=input.id;input.name=name;input.maxLength=maxText;input.rows=3;input.value=state[name];input.dataset.inquiryField=name;input.dataset.inquiryPlaceholder=name+'Hint';inputs[name]=input;return input;};
 area('prediction',part('prediction'));
 const variables=part('variables'),selectLabel=text('label','independent',variables),select=make('select',variables);select.id=uid+'-variable';selectLabel.htmlFor=select.id;select.dataset.inquiryField='independent';
 const emptyOption=make('option',select);emptyOption.value='';emptyOption.dataset.inquiryText='choose';
 const optionNodes=params.map((param,index)=>{const option=make('option',select);option.value=param.key;return {param,index,option};});
 for(const option of select.options)option.removeAttribute('selected');Array.from(select.options).find(option=>option.value===state.independent)?.setAttribute('selected','');
 const fixed=make('fieldset',variables);text('legend','controlled',fixed);
 const checks=params.map((param,index)=>{const label=make('label',fixed,'inquiry-controlled');const input=make('input',label);input.type='checkbox';input.value=param.key;input.checked=state.controlled.includes(param.key);input.dataset.inquiryControlled=param.key;const span=make('span',label);return {param,index,input,span};});
 if(!params.length){select.disabled=true;fixed.hidden=true;text('p','none',variables);}
 area('conditions',variables);
 const investigation=part('investigate'),actions=make('div',investigation,'inquiry-actions');
 const record=text('button','record',actions);record.type='button';record.hidden=typeof options.onRecord!=='function';
 const data=text('button','data',actions);data.type='button';data.hidden=typeof options.onShowData!=='function';
 area('observations',investigation);area('conclusion',part('conclusion'));area('application',part('application'));
 text('p','manual',body,'inquiry-privacy');const exportButton=text('button','export',body,'inquiry-export');exportButton.type='button';
 const status=make('p',body,'inquiry-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 function sync(){for(const check of checks){check.input.disabled=check.param.key===state.independent;if(check.input.disabled)check.input.checked=false;}root.dataset.support=String(state.support);}
 function language(){root.lang=en()?'en-US':'vi-VN';for(const node of root.querySelectorAll('[data-inquiry-text]'))node.textContent=t(node.dataset.inquiryText);for(const node of root.querySelectorAll('[data-inquiry-placeholder]'))node.placeholder=state.support?t(node.dataset.inquiryPlaceholder):'';for(const {param,index,option} of optionNodes)option.textContent=(en()?englishParameter(param,index):param.label)+(param.unit?' ('+param.unit+')':'');for(const {param,index,span} of checks)span.textContent=(en()?englishParameter(param,index):param.label)+(param.unit?' ('+param.unit+')':'');const message=t(storageOK?'saved':'unavailable');if(status.textContent!==message)status.textContent=message;}
 function save(){if(destroyed)return;state=normalizeInquiry({...state,...Object.fromEntries(fields.map(f=>[f,inputs[f].value])),independent:select.value,controlled:checks.filter(c=>c.input.checked&&!c.input.disabled).map(c=>c.param.key),support:toggle.checked},experiment);try{if(!storage)throw Error();storage.setItem(inquiryStorageKey(experiment.id),JSON.stringify(state));storageOK=true;}catch{storageOK=false;}sync();language();}
 const onChange=()=>{sync();save();};
 form.addEventListener('input',save);form.addEventListener('change',onChange);toggle.addEventListener('change',save);
 function exportData(){save();const snapshot=options.getParameters?.(),rows=options.getRows?.();return {format:'quanh-lab-investigation',version,experimentId:experiment.id,exportedAt:new Date().toISOString(),worksheet:{...state,controlled:[...state.controlled]},...(snapshot&&typeof snapshot==='object'?{currentParameters:{...snapshot}}:{}),...(Array.isArray(rows)?{recordedData:rows}:{}),note:'Student-authored work; not graded or scientifically certified.'};}
 function download(){const payload=JSON.stringify(exportData(),null,2),view=doc.defaultView||globalThis;if(typeof view.Blob!=='function'||typeof view.URL?.createObjectURL!=='function')return;const url=view.URL.createObjectURL(new view.Blob([payload],{type:'application/json'}));const a=make('a',doc.body);a.href=url;a.download='quanh-lab-'+experiment.id+'-investigation.json';a.click();a.remove();setTimeout(()=>view.URL.revokeObjectURL(url),0);}
 function doRecord(){options.onRecord?.();}function showData(){options.onShowData?.();}
 record.addEventListener('click',doRecord);data.addEventListener('click',showData);exportButton.addEventListener('click',download);
 sync();language();
 return {root,setLocale(value){locale=value||'vi-VN';language();},refresh:sync,exportData,destroy(){save();destroyed=true;form.removeEventListener('input',save);form.removeEventListener('change',onChange);toggle.removeEventListener('change',save);record.removeEventListener('click',doRecord);data.removeEventListener('click',showData);exportButton.removeEventListener('click',download);root.remove();}};
}
