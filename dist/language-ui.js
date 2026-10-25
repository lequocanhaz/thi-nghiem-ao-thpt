import {i18n,dictionaries} from './i18n.js?v=54';
import {experiments} from './experiments.js?v=54';
import {englishStudy,englishParameter,englishTopic} from './english-study.js?v=56';
import {messagePairs} from './locales/messages.js?v=54';
import {physicsGlossary} from './locales/glossary.js?v=54';

const translations=new Map();
function pair(vi,en){if(vi&&en&&vi!==en)translations.set(vi,en);}
for(const group of Object.values(messagePairs))for(const [vi,en] of Object.values(group))pair(vi,en);
for(const term of physicsGlossary)pair(term.vi,term.en);
for(const id of Object.keys(dictionaries['vi-VN'].experiments)){
 const vi=dictionaries['vi-VN'].experiments[id];
 const en=dictionaries['en-US'].experiments[id];
 pair(vi.title,en.title);pair(vi.shortTitle,en.shortTitle);
}
for(const e of experiments){const guide=englishStudy(e);pair(e.topic,englishTopic(e.topic));pair(e.description,guide.explanation);pair(e.description.split(/(?<=[.!?])\s/)[0],guide.explanation);if(e.subtitle)pair(e.subtitle,guide.investigation);(e.params||[]).forEach((p,i)=>pair(p.label,englishParameter(p,i)));}
for(const [vi,en] of [
 ['Thí nghiệm','Experiments'],['Vật Lí','Physics'],['Vật lí','Physics'],['Thư viện thí nghiệm','Experiment library'],
 ['Thư viện thí nghiệm ','Experiment library '],['Chọn thí nghiệm','Choose experiment'],
 ['Mở thí nghiệm','Open experiment'],['Xem trước','Preview'],['Chọn lớp học','Choose a grade'],
 ['Tất cả chủ đề','All topics'],['Mọi lớp','All grades'],['Mở rộng','Advanced'],['Nền tảng','Core'],
 ['Nền tảng THPT','High school core'],['Thí nghiệm gợi ý','Featured experiments'],
 ['Bài gần nhất','Recently viewed'],['Gần đây','Recent'],['Đã lưu','Saved'],
 ['Mục tiêu thí nghiệm','Experiment objectives'],['Các bước thực hiện','Procedure'],
 ['Kiến thức cần chuẩn bị','Prerequisites'],['Hiểu hiện tượng','Understand the phenomenon'],
 ['Thiết kế khảo sát','Plan an investigation'],['Biến khảo sát chính','Independent variable'],
 ['Ghi rõ các đại lượng giữ cố định','Controlled variables'],
 ['Đến biến khảo sát','Go to investigation variable'],['Điểm dễ nhầm','Common misconception'],
 ['Tự kiểm tra và vận dụng','Check your understanding'],['Đối chiếu lời giải','Check the solution'],
 ['Điều kiện mô hình','Model assumptions'],['Nguồn đối chiếu','References'],
 ['Quan hệ khảo sát','Investigated relationship'],['Ghi kết quả','Record results'],
 ['Thông số thí nghiệm','Experiment parameters'],['Tự điều chỉnh','Custom'],
 ['Mẫu thiết lập','Preset'],['Hiển thị','Display'],['Nhãn trong mô hình','Model labels'],
 ['Điểm kéo thông số','Parameter handles'],['Đường sức','Field lines'],
 ['Vectơ thành phần','Component vectors'],['Vectơ tổng','Resultant vector'],
 ['Đường nối','Connecting lines'],['Hình bình hành','Parallelogram'],
 ['Lưới tọa độ','Coordinate grid'],['Quan hệ đại lượng','Relationship between quantities'],
 ['Trạng thái đã ghi','Recorded states'],['Quét tham số','Parameter sweep'],
 ['Giọng tiếng Việt','Voice'],['Giọng đọc tiếng Việt','Speech voices'],['Tốc độ đọc','Speech rate'],
 ['Cài đặt','Settings'],['Nghe thử','Preview voice'],['Làm mới giọng','Refresh voices'],
 ['Dừng đọc','Stop speaking'],['Xong','Done'],['Đang chạy','Running'],['Sẵn sàng','Ready'],
 ['Đã kết thúc','Finished'],['Ngoài miền mô hình','Outside model domain'],
 ['Ghi điểm','Record point'],['Đồ thị','Graph'],['Bảng số liệu','Data table'],
 ['Số liệu','Measurements'],['Thuyết minh','Narration'],
 ['Chế độ tập trung','Focus mode'],['Trở về thư viện','Back to library'],
 ['Mô hình','Model'],['Nhiệm vụ','Tasks'],['Lí thuyết','Theory'],
 ['Bật hoặc tắt lưới của hệ trục','Toggle coordinate grid'],
 ['Đặt lại mô hình','Reset model'],['Chế độ trình chiếu','Presentation mode'],
 ['Tất cả bộ sách','All textbook series'],['Tất cả môn học','All subjects'],
 ['Tất cả mạch kiến thức','All curriculum topics'],
 ['Theo lộ trình','Curriculum order'],['Theo lớp','By grade'],
 ['Mọi mức độ','All levels'],['Tìm hiện tượng, dụng cụ, chủ đề…','Find an experiment, device, or topic…'],
 ['Ghi một trạng thái để bắt đầu đối chiếu','Record a state to start comparing'],
 ['Nghe thuyết minh mô hình','Listen to model narration'],
 ['Nghe gợi ý','Listen to a hint'],['Nghe mô tả','Listen to description'],
 ['Lưu tự động trên thiết bị','Saved automatically on this device'],
 ['Thư viện','Library'],['Tiến độ','Progress'],['Tổng quan','Overview'],
 ['Phân tích','Analysis'],['Đọc bài học và tự kiểm tra','Read and self-check']
])pair(vi,en);

export const getLocale=()=>i18n.getLocale();
export const englishTitle=id=>dictionaries['en-US'].experiments[id]?.shortTitle||id;
export function translateShort(source){
 if(typeof source!=='string')return source;
 const value=source.trim();
 if(translations.has(value))return source.replace(value,translations.get(value));
 if(/^Lớp (10|11|12)$/.test(value))return source.replace(value,'Grade '+value.slice(4));
 if(/^Lớp (10|11|12) · Mở rộng$/.test(value))return source.replace(value,'Grade '+value.slice(4,6)+' · Advanced');
 if(/^\d+ thí nghiệm$/.test(value))return source.replace(value,value.replace('thí nghiệm','experiments'));
 if(/^← Thư viện$/.test(value))return source.replace(value,'← Library');
 return source;
}
const originals=new WeakMap();
let observer;
let scheduled=false;
const rootSelectors=['.header','#main','#dialog','#aiAssistant','#toast'];
const blocked='script,style,noscript,textarea,code,pre,svg,canvas,.math-tex,.ai-messages,.ai-compose,.lesson-content p,.lesson-content li,.lesson-content dd,.lesson-content .lesson-scope,.notes-area,.source-cards p';
function eligible(element){
 return !!element&&!element.closest(blocked);
}
function translateText(node,english){
 if(!eligible(node.parentElement))return;
 const current=node.nodeValue||'';
 const saved=originals.get(node);
 const source=saved&&current===saved.output?saved.source:current;
 const result=english?translateShort(source):source;
 if(result!==current)node.nodeValue=result;
 if(english&&result!==source)originals.set(node,{source,output:result});
 else originals.delete(node);
}
function translateElement(element,english){
 if(!element||element.nodeType!==1)return;
 if(!eligible(element))return;
 for(const attr of ['aria-label','title','placeholder']){
  if(!element.hasAttribute(attr))continue;
  const name='data-quanh-original-'+attr;
  const source=element.getAttribute(name)||element.getAttribute(attr);
  if(english){
   const value=translateShort(source);
   if(value!==source){element.setAttribute(name,source);element.setAttribute(attr,value);}
  }else if(element.hasAttribute(name)){
   element.setAttribute(attr,element.getAttribute(name));element.removeAttribute(name);
  }
 }
}
function visit(container,english){
 if(!container)return;
 const walker=document.createTreeWalker(container,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 if(container.nodeType===1)translateElement(container,english);
 while(walker.nextNode()){
  const node=walker.currentNode;
  if(node.nodeType===3)translateText(node,english);
  else translateElement(node,english);
 }
}
function localizeAll(){
 const english=getLocale()==='en-US';
 document.documentElement.lang=english?'en-US':'vi';
 const labId=(location.hash.match(/^#lab\/([^?]+)/)||[])[1];const current=experiments.find(e=>e.id===labId);document.title=english?(current?englishStudy(current).title+' · Quanh Lab':'Quanh Lab · Experiment library'):(current?current.shortTitle+' · Quanh Lab':'Quanh Lab · Thư viện thí nghiệm');
 for(const selector of rootSelectors)visit(document.querySelector(selector),english);
 const lab=document.querySelector('.lab');
 let guidance=lab?.querySelector('.language-guidance');
 if(!english){guidance?.remove();return;}
 if(lab&&!guidance){
  guidance=document.createElement('p');
  guidance.className='language-guidance';
  guidance.setAttribute('lang','en-US');
  guidance.textContent='English study guides are provided for all 300 models. These are original model-based explanations, not certified line-by-line translations of the Vietnamese lesson texts.';
  const heading=lab.querySelector('.lab-heading');
  heading?.insertAdjacentElement('afterend',guidance);
 }
}
function observeUpdates(){
 observer?.disconnect();
 if(getLocale()!=='en-US')return;
 observer=new MutationObserver(mutations=>{
  if(mutations.every(m=>m.type==='characterData'&&originals.has(m.target)&&m.target.nodeValue===originals.get(m.target).output))return;
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;localizeAll();});
 });
 for(const selector of rootSelectors){const target=document.querySelector(selector);if(target)observer.observe(target,{subtree:true,childList:true,characterData:true});}
}
export function installLanguageUI(){
 const nav=document.querySelector('.header nav');
 if(!nav||document.getElementById('quanhLanguage'))return;
 const label=document.createElement('label');
 label.className='quanh-language';
 label.setAttribute('aria-label','Language / Ngôn ngữ');
 label.innerHTML='<span class="sr-only">Ngôn ngữ / Language</span><select id="quanhLanguage" aria-label="Ngôn ngữ / Language"><option value="vi-VN">🇻🇳 VI</option><option value="en-US">🇺🇸 EN</option></select>';
 nav.insertBefore(label,nav.querySelector('[data-action="settings"]'));
 const select=label.querySelector('select');
 select.value=getLocale();
 select.addEventListener('change',()=>{
  if(!['vi-VN','en-US'].includes(select.value))return;
  i18n.setLocale(select.value);
  document.dispatchEvent(new CustomEvent('quanh-locale-change',{detail:{locale:select.value}}));
  localizeAll();
  observeUpdates();
 });
 const css=document.createElement('style');
 css.textContent='.quanh-language{display:inline-flex;align-items:center;margin:0 .25rem}.quanh-language select{border:1px solid #b9c3cf;border-radius:8px;background:var(--surface,#fff);color:inherit;padding:.35rem .3rem;font:inherit;max-width:6rem}.language-guidance{margin:.4rem 1.25rem;padding:.45rem .7rem;border-left:3px solid #476b94;font-size:.82rem;line-height:1.4;color:inherit}@media(max-width:600px){.quanh-language{margin:0}.quanh-language select{font-size:12px;padding:.2rem}}';
 document.head.append(css);
 localizeAll();
 observeUpdates();
}
