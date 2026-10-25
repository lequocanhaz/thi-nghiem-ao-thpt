// Presentation preferences are separate from the experiment's physical state.
export const VISUAL_STORAGE_KEY='quanh-visual-v1';
export const VISUAL_MODES=Object.freeze([
 {value:'standard',label:'Tiêu chuẩn'},
 {value:'high-contrast',label:'Tương phản cao'},
 {value:'classroom',label:'Trình chiếu lớp học'},
 {value:'reduced-motion',label:'Giảm chuyển động phụ'}
]);
const modes=new Set(VISUAL_MODES.map(mode=>mode.value));
const inherited={labels:null,grid:null,trajectory:null};
export function visualPreset(mode='standard'){
 const safe=modes.has(mode)?mode:'standard';
 return {mode:safe,contrast:safe==='high-contrast'||safe==='classroom'?'high':'standard',reducedMotion:safe==='reduced-motion',...inherited,...(safe==='classroom'?{labels:true,grid:false}:{})};
}
export function normalizeVisualSettings(value={}){
 const input=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const next=visualPreset(input.mode);
 if(input.contrast==='high'||input.contrast==='standard')next.contrast=input.contrast;
 if(typeof input.reducedMotion==='boolean')next.reducedMotion=input.reducedMotion;
 for(const key of Object.keys(inherited))if(input[key]===null||typeof input[key]==='boolean')next[key]=input[key];
 return next;
}
export function loadVisualSettings(storage){
 try{return normalizeVisualSettings(JSON.parse(storage?.getItem(VISUAL_STORAGE_KEY)||'{}'));}
 catch{return visualPreset();}
}
export function saveVisualSettings(storage,value){
 try{storage?.setItem(VISUAL_STORAGE_KEY,JSON.stringify(normalizeVisualSettings(value)));return !!storage;}
 catch{return false;}
}
export function updateVisualSetting(current,key,value){
 if(key==='mode')return visualPreset(value);
 const next=normalizeVisualSettings(current);
 if(key==='contrast'&&(value==='standard'||value==='high'))next.contrast=value;
 if(key==='reducedMotion'&&typeof value==='boolean')next.reducedMotion=value;
 if(Object.hasOwn(inherited,key))next[key]=value==='inherit'?null:value==='on'?true:value==='off'?false:next[key];
 return next;
}
export function visualRenderConfig(config={},settings={},context={}){
 const visual=normalizeVisualSettings(settings),switches={...config.switches};
 for(const key of Object.keys(inherited))if(visual[key]!==null)switches[key]=visual[key];
 const teacherMode=!!context.presentation||visual.mode==='classroom';
 if(teacherMode)switches.labels=true;
 return {...config,switches,teacherMode,motion:visual.reducedMotion?false:context.motion!==false,visualContrast:visual.contrast};
}
export function applyVisualAppearance(host,settings={}){
 if(!host)return;
 const visual=normalizeVisualSettings(settings);
 host.dataset.visualContrast=visual.contrast;
 host.dataset.visualMode=visual.mode;
 host.classList.toggle('visual-reduced-motion',visual.reducedMotion);
}
const selected=(value,expected)=>value===expected?' selected':'';
const switchOptions=value=>`<option value="inherit"${selected(value,null)}>Theo thiết lập bài</option><option value="on"${selected(value,true)}>Hiện</option><option value="off"${selected(value,false)}>Ẩn</option>`;
export function visualSettingsMarkup(settings={}){
 const visual=normalizeVisualSettings(settings);
 return `<details class="visual-settings"><summary>Hiển thị</summary><div class="visual-settings-panel" role="group" aria-label="Thiết lập hiển thị mô hình"><label class="visual-setting-row" for="visualMode"><span>Chế độ quan sát</span><select id="visualMode" data-visual-setting="mode">${VISUAL_MODES.map(mode=>`<option value="${mode.value}"${selected(visual.mode,mode.value)}>${mode.label}</option>`).join('')}</select></label><label class="visual-setting-row" for="visualContrast"><span>Tương phản giao diện</span><select id="visualContrast" data-visual-setting="contrast"><option value="standard"${selected(visual.contrast,'standard')}>Tiêu chuẩn</option><option value="high"${selected(visual.contrast,'high')}>Cao</option></select></label>${[['labels','Nhãn mô hình'],['grid','Lưới hệ trục'],['trajectory','Quỹ đạo / tia phụ']].map(([key,label])=>`<label class="visual-setting-row" for="visual-${key}"><span>${label}</span><select id="visual-${key}" data-visual-setting="${key}">${switchOptions(visual[key])}</select></label>`).join('')}<label class="visual-setting-check"><input type="checkbox" data-visual-setting="reducedMotion"${visual.reducedMotion?' checked':''}><span>Giảm chuyển động phụ</span></label><p class="visual-settings-note">Tùy chọn hiển thị giữ nguyên thông số và số liệu. Quỹ đạo áp dụng cho các bài có đường phụ; mô phỏng vẫn chạy khi giảm chuyển động.</p><output class="visual-settings-status" role="status" aria-live="polite"></output></div></details>`;
}
export function syncVisualSettings(root,settings={}){
 const visual=normalizeVisualSettings(settings);
 for(const input of root?.querySelectorAll?.('[data-visual-setting]')||[]){
  const key=input.dataset.visualSetting,value=visual[key];
  if(input.type==='checkbox')input.checked=value===true;
  else input.value=Object.hasOwn(inherited,key)?value===null?'inherit':value?'on':'off':value;
 }
}
