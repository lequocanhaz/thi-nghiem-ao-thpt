import {i18n,dictionaries} from './i18n.js?v=54';
import {mountLanguagePill} from './language-pill.js?v=59';
import {experiments} from './experiments.js?v=59';
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
for(const e of experiments){const guide=englishStudy(e);if(!translations.has(e.topic))pair(e.topic,englishTopic(e.topic));pair(e.description,guide.explanation);pair(e.description.split(/(?<=[.!?])\s/)[0],guide.explanation);if(e.subtitle)pair(e.subtitle,guide.investigation);(e.params||[]).forEach((p,i)=>pair(p.label,englishParameter(p,i)));}
for(const [vi,en] of [
 ['Quan sát hiện tượng. Đo đạc và giải thích.','Observe phenomena. Measure and explain.'],
 ['300 thí nghiệm tương tác · Vật lí lớp 10–12','300 interactive experiments · Physics grades 10–12'],
 ['Thêm bộ lọc','More filters'],['Mức độ','Level'],
 ['Tìm định luật Ohm, điện trường, con lắc…','Find Ohm’s law, electric fields, pendulums…'],
 ['Giới thiệu','About'],['Danh mục đầy đủ','Full catalog'],
 ['Thí nghiệm','Experiments'],['Vật Lí','Physics'],['Vật lí','Physics'],['Thư viện thí nghiệm','Experiment library'],
 ['Vật lí 10','Physics 10'],['Vật lí 11','Physics 11'],['Vật lí 12','Physics 12'],
 ['Bìa Vật lí 10','Physics 10 book cover'],['Bìa Vật lí 11','Physics 11 book cover'],['Bìa Vật lí 12','Physics 12 book cover'],
 ['Kết nối tri thức','Connecting Knowledge'],['Đọc sách','Read textbook'],
 ['Xem tất cả ↗','View all ↗'],['Sách giáo khoa','Textbooks'],
 ['Môn học','Subject'],['Bộ sách','Textbook series'],['Xóa từ khóa','Clear search'],
 ['Phím tắt tìm kiếm','Search shortcut'],['Trang thí nghiệm','Experiment pages'],
 ['Lựa chọn nhanh','Quick navigation'],['Mở nhanh thí nghiệm','Open featured experiments'],
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

// Navigation, simulation panels, measurement workflows and accessibility labels.
for(const [vi,en] of [
 ['Đang mở không gian…','Opening the simulation…'],['Con lắc','Pendulum'],['Mạch điện','Electric circuit'],
 ['Lăng kính','Prism'],['Xem tất cả','View all'],['Chủ đề SGK','Textbook topic'],
 ['Sắp xếp','Sort'],['Tên A → Z','Name A → Z'],['Bỏ lọc','Clear filters'],
 ['Tuyến khảo sát','Investigation pathways'],['Học theo một mạch kiến thức','Follow one knowledge pathway'],
 ['3D · Tương tác','3D · Interactive'],['Đã khảo sát','Completed'],
 ['Đổi thí nghiệm','Change experiment'],['Phiên','Session'],
 ['Tải bản sao phiên','Download session backup'],['Mở phiên từ tệp','Open session file'],
 ['Khám phá','Explore'],['Phân tích','Analysis'],['Trình chiếu','Present'],
 ['Thông số','Parameters'],['Dữ liệu & ghi chép','Data and notes'],
 ['Dữ liệu','Data'],['Tùy chọn bố cục','Layout options'],['Hướng dẫn & giọng đọc','Help and speech'],
 ['Khôi phục bố cục','Restore layout'],['Nghe hướng dẫn','Listen to instructions'],
 ['Thoát trình chiếu','Exit presentation'],['Công cụ','Tools'],['Trục','Axes'],['Lưới','Grid'],
 ['Đồ họa nhẹ','Simplified graphics'],['Đang dựng mô hình…','Rendering model…'],
 ['Hướng dẫn thí nghiệm','Experiment guide'],['Bài học','Lesson'],
 ['Bật tương tác 3D','Enable 3D interaction'],
 ['Kéo nền để xoay · Kéo điểm màu để điều chỉnh','Drag to rotate · Drag handles to adjust'],
 ['Không gian ×10','Workspace ×10'],['Vừa mô hình','Fit model'],
 ['Biến tương tác','Interactive parameter'],['Nhập số','Enter value'],['Thiết lập','Settings'],
 ['Đọc số đo','Read measurements'],['Nghe âm','Play sound'],['Giọng đọc','Speech voice'],
 ['Thí nghiệm trước','Previous experiment'],['Thí nghiệm tiếp theo','Next experiment'],
 ['CÂU HỎI KHẢO SÁT','INVESTIGATION QUESTION'],['Giả thuyết của bạn','Your hypothesis'],
 ['Tự đánh dấu bước đã làm · lưu trên thiết bị này','Mark your completed steps · saved on this device'],
 ['Thử một thiết lập','Try a configuration'],['Viết giải thích','Write an explanation'],
 ['Chưa tải được mô hình','Unable to load the model'],
 ['Thông số và bảng đo vẫn được giữ.','Parameters and measurements were preserved.'],
 ['Đang tải công cụ 3D:','Loading 3D tools:'],['Thử lại 3D','Retry 3D'],
 ['Chi tiết','Details'],['Chọn bài để điều chỉnh và xem số liệu.','Choose an experiment to edit inputs and view data.'],
 ['Xem tất cả thí nghiệm','View all experiments'],['Khoảng thanh trượt','Slider range'],
 ['Áp dụng khoảng','Apply range'],['Toàn miền','Full domain'],
 ['Khung 3D đang bị gián đoạn. Bạn vẫn có thể điều chỉnh, xem đồ thị và ghi số liệu.','3D rendering was interrupted. You can still adjust inputs, inspect graphs and record measurements.'],
 ['A đã lưu ↔ B hiện tại','Saved A ↔ Current B'],['Về A','Restore A'],['Đổi A/B','Swap A/B'],
 ['Bảng trạng thái','State table'],['Các trạng thái đã ghi của','Recorded states for'],
 ['Nhấn Ghi điểm để lưu số liệu đang quan sát.','Press Record to save the current reading.'],
 ['Tải phiên','Download session'],['Mở phiên','Open session'],
 ['Từ dữ liệu đến kết luận','From data to conclusions'],['Nhận xét của bạn','Your interpretation'],
 ['Tải ghi chép','Download notes'],['Khớp mô hình','Fit model'],
 ['Dạng quan hệ','Relationship type'],['Khôi phục bảng vừa xóa','Restore deleted table'],
 ['Chưa có số liệu.','No measurements recorded.'],
 ['Ghi điểm đầu tiên','Record the first point'],['Hiệu ứng giao diện','Interface effects'],
 ['Chất lượng 3D','3D quality'],['Cao · bóng đổ mịn','High · smooth shadows'],
 ['Nhẹ · tiết kiệm máy','Light · reduced resource usage'],['Cỡ chữ','Text size'],
 ['Rất lớn','Extra large'],['Nguồn học liệu','Learning resources'],
 ['Nguồn giọng đọc tiếng Việt','Vietnamese speech sources'],
 ['Giáo trình & tài liệu quốc tế','International textbooks and readings'],
 ['Nguồn theo thí nghiệm','Sources by experiment'],['Biến quét','Sweep variable'],
 ['Số trạng thái','Number of states'],['Giữ cố định:','Hold constant:'],
 ['Thu số liệu','Collect data'],['Bắt đầu với chuyển động thẳng đều','Start with uniform linear motion'],
 ['Sao chép đường dẫn','Copy link'],['Tải thông tin lỗi','Download diagnostics'],
 ['Câu hỏi của bạn','Your question'],['Tối đa 2 ảnh/lượt','Up to 2 images per message'],
 ['Bạn muốn khám phá điều gì?','What would you like to explore?'],
 ['Gửi câu hỏi, ảnh bài tập hoặc đồ thị.','Ask a question, or send a problem or graph image.'],
 ['Gửi ↑','Send ↑'],['Dừng','Stop'],['Gần đây','Recently viewed'],
 ['Lớp','Grade'],['Toàn màn hình','Fullscreen'],['Nghe thuyết minh mô hình','Listen to the simulation narration'],
 ['Một trang','One page'],['Hai trang','Two pages'],
 ['Chưa có thí nghiệm đã lưu','No saved experiments'],
 ['Chưa tìm thấy thí nghiệm phù hợp','No matching experiments'],
 ['Những bài bạn mở sẽ xuất hiện ở đây.','Previously opened experiments will appear here.'],
 ['Bấm ngôi sao trên một thí nghiệm để lưu vào đây.','Select the star on an experiment to save it here.'],
 ['Thử từ khóa ngắn hơn hoặc bỏ bớt bộ lọc.','Try a shorter search or fewer filters.'],
 ['Số liệu được tính từ mô hình. Các giả định nằm trong tab Mô hình.','Readouts are calculated by the model. See its assumptions under the Model tab.']
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
const rootSelectors=['.header','#main','#dialog','#aiAssistant','#toast','footer'];
const blocked='script,style,noscript,textarea,code,pre,svg,canvas,.math-tex,.ai-messages,.ai-compose,.lesson-content p,.lesson-content li,.lesson-content dd,.lesson-content .lesson-scope,.notes-area,.source-cards p';
function eligible(element){
 return !!element&&!element.closest(blocked);
}
// Only the homepage headline uses this reordered English phrase.
const bannerSegments=new Map([['HỆ THỐNG THÍ NGHIỆM','VIRTUAL PHYSICS'],['VẬT LÍ ẢO','EXPERIMENT SYSTEM']]);
export function translateBannerHeading(source){
 const value=String(source).trim();
 return bannerSegments.has(value)?String(source).replace(value,bannerSegments.get(value)):translateShort(source);
}
function translateText(node,english){
 if(!eligible(node.parentElement))return;
 const current=node.nodeValue||'';
 const saved=originals.get(node);
 const source=saved&&current===saved.output?saved.source:current;
 const result=english?(node.parentElement?.closest('#bannerTitle')?translateBannerHeading(source):translateShort(source)):source;
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
function syncLocalePage(){
 const english=getLocale()==='en-US';
 document.documentElement.lang=english?'en-US':'vi';
 const labId=(location.hash.match(/^#lab\/([^?]+)/)||[])[1];const current=experiments.find(e=>e.id===labId);document.title=english?(current?englishStudy(current).title+' · Quanh Lab':'Quanh Lab · Experiment library'):(current?current.shortTitle+' · Quanh Lab':'Quanh Lab · Thư viện thí nghiệm');
 const description=document.querySelector('meta[name="description"]');if(description)description.content=current?(english?englishStudy(current).explanation:current.description):(english?'Explore 300 interactive high-school physics experiments. Adjust parameters, record measurements, analyze graphs and read Vietnamese textbooks.':'300 thí nghiệm Vật lí THPT tương tác. Điều chỉnh tham số, ghi số liệu, phân tích đồ thị và đọc sách Vật lí lớp 10–12.');
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
function localizeAll(){
 syncLocalePage();
 const english=getLocale()==='en-US';
 for(const selector of rootSelectors)visit(document.querySelector(selector),english);
}
// Simulation readouts change often. Translate only changed subtrees rather than
// walking every control, card, lesson and chat panel on each animation update.
const pendingTranslations=new Set();
function observeUpdates(){
 observer?.disconnect();pendingTranslations.clear();
 if(getLocale()!=='en-US')return;
 observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
   if(mutation.type==='characterData'){
    const saved=originals.get(mutation.target);
    if(saved&&mutation.target.nodeValue===saved.output)continue;
    if(eligible(mutation.target.parentElement))pendingTranslations.add(mutation.target);
   }else{
    for(const node of mutation.addedNodes)if(node.nodeType===1?eligible(node):eligible(node.parentElement))pendingTranslations.add(node);
   }
  }
  if(scheduled||!pendingTranslations.size)return;
  scheduled=true;
  requestAnimationFrame(()=>{
   scheduled=false;
   if(getLocale()!=='en-US'){pendingTranslations.clear();return;}
   const nodes=[...pendingTranslations];pendingTranslations.clear();
   for(const node of nodes){
    if(!node.isConnected||nodes.some(parent=>parent!==node&&parent.nodeType===1&&parent.contains(node)))continue;
    if(node.nodeType===3)translateText(node,true);
    else if(node.nodeType===1)visit(node,true);
   }
   syncLocalePage();
  });
 });
 for(const selector of rootSelectors){const target=document.querySelector(selector);if(target)observer.observe(target,{subtree:true,childList:true,characterData:true});}
}
export function installLanguageUI(){
 const nav=document.querySelector('.header nav');
 if(!nav)return;
 mountLanguagePill(nav,{
  id:'quanhLanguage',
  before:nav.querySelector('[data-action="settings"]'),
  onChange(locale){
   document.documentElement.lang=locale;
   document.dispatchEvent(new CustomEvent('quanh-locale-change',{detail:{locale}}));
   localizeAll();
   observeUpdates();
  }
 });
 if(!document.getElementById('qlLanguageGuidanceStyles')){
  const style=document.createElement('style');
  style.id='qlLanguageGuidanceStyles';
  style.textContent='.language-guidance{margin:.4rem 1.25rem;padding:.45rem .7rem;border-left:3px solid #476b94;font-size:.82rem;line-height:1.4;color:inherit}';
  document.head.append(style);
 }
 localizeAll();
 observeUpdates();
}
