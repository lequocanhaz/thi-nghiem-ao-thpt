import {formulaMarkup} from './workspace.js?v=54';
import {getLocale} from './i18n.js?v=54';
import {englishStudy} from './english-study.js?v=56';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function englishLessonMarkup(e){
 const l=englishStudy(e);
 return '<article class="lesson-content" data-lesson="'+esc(e.id)+'" lang="en-US">'+
 '<h2>Learning objective</h2><p>'+esc(l.goal)+'</p>'+
 '<p class="lesson-scope">'+esc(l.scope)+'</p>'+
 '<details><summary>Prior knowledge</summary><p>'+esc(l.prerequisite)+'</p></details>'+
 '<h2>Physical principle</h2><p>'+esc(l.explanation)+'</p>'+formulaMarkup(e)+
 '<h2>Plan an investigation</h2><dl class="lesson-variables"><dt>Independent variable</dt><dd>'+esc(l.controlLabel)+(l.controlUnit?' ('+esc(l.controlUnit)+')':'')+'</dd><dt>Controlled variables</dt><dd>'+esc(l.fixed.join(' · '))+'</dd></dl>'+
 '<button class="button secondary" data-action="lesson-control">Go to the selected control</button>'+
 '<h2>Procedure</h2><ol>'+
 '<li>Predict the direction of change before adjusting the input. Record the assumptions.</li>'+
 '<li>'+esc(l.investigation)+'</li>'+
 '<li>Record several states with SI units. Reject states outside the model domain.</li>'+
 '<li>Plot results, compare the trend to the model relation, and consider measurement resolution.</li>'+
 '<li>Write a conclusion supported by the numerical results; include one model limitation.</li></ol>'+
 '<p class="lesson-evidence">'+esc(l.evidence)+'</p>'+
 '<h2>Common pitfall</h2><p>'+esc(l.misconception)+'</p>'+
 '<h2>Check your understanding</h2><p class="lesson-question">'+esc(l.question)+'</p>'+
 '<button class="quiet-button" data-panel="tasks">Write a response →</button>'+
 '<details class="lesson-solution"><summary>Interpretation guide</summary><p>'+esc(l.answer)+'</p></details>'+
 '<h2>Reference formula</h2><p>'+esc(l.formula)+'</p>'+
 '<h2>Sources and scope</h2><p>'+esc(l.sourceScope)+'</p>'+
 '<ul>'+l.references.map(source=>'<li><a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(source.publisher)+' — '+esc(source.title)+'</a></li>').join('')+'</ul>'+
 '<details class="lesson-language-note"><summary>About this English guide</summary><p>'+esc(l.notes)+'</p></details>'+
 '</article>';
}

export function lessonGuideMarkup(e){
 if(getLocale()==='en-US')return englishLessonMarkup(e);
 const lesson=e.lesson;
 if(!lesson)return `<div class="lesson-status" role="status" aria-live="polite">Đang mở bài học…</div><h2>Mục tiêu thí nghiệm</h2><p>${esc(e.subtitle||e.description)}</p><h2>Các bước thực hiện</h2><ol>${e.tasks.map(task=>`<li>${esc(task)}</li>`).join('')}</ol>${formulaMarkup(e)}<p>${esc(e.limit)}</p>`;
 return `<article class="lesson-content" data-lesson="${esc(e.id)}"><h2>Mục tiêu thí nghiệm</h2><p>${esc(lesson.goal)}</p><p class="lesson-scope">${esc(lesson.scope)}</p><details><summary>Kiến thức cần chuẩn bị</summary><p>${esc(lesson.prerequisite)}</p></details><h2>Hiểu hiện tượng</h2><p>${esc(lesson.explanation)}</p>${formulaMarkup(e)}<h2>Thiết kế khảo sát</h2><dl class="lesson-variables"><dt>Biến khảo sát chính</dt><dd>${esc(lesson.controlLabel)}${lesson.controlUnit?' ('+esc(lesson.controlUnit)+')':''}</dd><dt>Ghi rõ các đại lượng giữ cố định</dt><dd>${esc(lesson.fixed.join(' · ')||'Các điều kiện ban đầu nêu trong quy trình.')}</dd></dl><button class="button secondary" data-action="lesson-control">Đến biến khảo sát</button><h2>Các bước thực hiện</h2><ol><li>Viết dự đoán trước khi đổi điều kiện: đại lượng nào đổi, đổi theo hướng nào và vì sao?</li><li>${esc(lesson.investigation)}</li><li>Ghi các trạng thái vào bảng; ghi kèm đơn vị và điều kiện. Chỉ dùng các điểm thuộc miền mô hình hợp lệ.</li><li>Đối chiếu bảng và đồ thị với quan hệ trong bài; phân biệt thay đổi một biến với thay đổi nhiều điều kiện.</li><li>Viết kết luận có bằng chứng và nêu ít nhất một giới hạn áp dụng.</li></ol><p class="lesson-evidence">${esc(lesson.evidence)}</p><h2>Điểm dễ nhầm</h2><p>${esc(lesson.misconception)}</p><h2>Tự kiểm tra và vận dụng</h2><p class="lesson-question">${esc(lesson.question)}</p><p>Hãy tự trả lời trong Sổ tay trước khi đối chiếu.</p><button class="quiet-button" data-panel="tasks">Viết giải thích →</button><details class="lesson-solution"><summary>Đối chiếu lời giải</summary><p>${esc(lesson.answer)}</p><p>Kiểm tra câu trả lời của bạn: có đúng quan hệ, điều kiện giữ cố định, đơn vị và giới hạn mô hình không?</p></details><h2>Điều kiện mô hình</h2><p>${esc(e.limit)}</p><details class="lesson-references"><summary>Nguồn đối chiếu</summary><p>${esc(lesson.sourceScope)}</p><ul>${lesson.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.publisher)} — ${esc(source.title)}</a></li>`).join('')}</ul></details><p class="lesson-audio-note">Thuyết minh âm thanh giữ bản ghi mô hình hiện có; phần bài soạn và lời giải mới ở dạng văn bản.</p></article>`;
}
export function lessonSummaryMarkup(e){if(getLocale()==='en-US'&&e.lesson){const l=englishStudy(e);return `<section class="lesson-summary" lang="en-US"><h3>Learning objective</h3><p>${esc(l.goal)}</p><p>${esc(l.investigation)}</p><button class="button secondary" data-panel="theory">Read the study guide and check your understanding →</button></section>`;}return e.lesson?`<section class="lesson-summary"><h3>Mục tiêu bài học</h3><p>${esc(e.lesson.goal)}</p><p>${esc(e.lesson.investigation)}</p><button class="button secondary" data-panel="theory">Đọc bài học và tự kiểm tra →</button></section>`:'';}
