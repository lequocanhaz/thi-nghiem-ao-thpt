import {text as a} from './batch-01.js?v=50';
import {text as b} from './batch-02.js?v=50';
import {text as c} from './batch-03.js?v=50';
import {text as d} from './batch-04.js?v=50';
import {text as e} from './batch-05.js?v=50';
import {text as f} from './batch-06.js?v=50';
import {text as g} from './batch-07.js?v=50';
import {text as h} from './batch-08.js?v=50';
import {text as i} from './batch-09.js?v=50';
import {text as j} from './batch-10.js?v=50';
import {references,lessonReferences} from './references.js?v=50';
import {formulaOverrides} from './formulas.js?v=50';
export const lessonVersion='50.1';
export const lessons={};
for(const line of [a,b,c,d,e,f,g,h,i,j].join('\n').trim().split('\n').filter(line=>line.trim())){
 const parts=line.split('|');
 if(parts.length!==7)throw Error('Invalid lesson row: '+parts[0]);
 const [id,goal,explanation,investigation,misconception,question,answer]=parts;
 if(lessons[id])throw Error('Duplicate lesson: '+id);
 lessons[id]=Object.freeze({id,version:lessonVersion,goal,explanation,investigation,misconception,question,answer});
}
const timed=new Set('energy oscillation capacitor uniform acceleration joule induction decay damped phasechange lc_oscillator rl_response newton_cooling oscillator_energy phase_difference beat standing_phase reflection_wave wave_packet coupled_pendulums large_pendulum torsion_pendulum u_tube_oscillation parametric_oscillation duffing van_der_pol rc_meter_loading two_stage_rc rlc_free rc_square flyback_diode half_rectifier bridge_rectifier magnetic_braking coil_entering_field mutual_induction convection_radiation transient_heat_bar brownian_motion decay_chain'.split(' '));
const controls={wave:'f',electric:'px',ohm:'u',horizontal:'v0',projectile:'angle',incline:'angle',collision:'e',circular:'v',lever:'l1',hooke:'m',pendulum:'length',resonance:'f',interference:'probeX',standing:'mode',sound:'f',series:'r1',parallel:'r1',magnetic:'angle',lens:'distance',mirror:'distance',metacentric:'width',newton_cradle:'input'};
const prerequisiteByTopic={
 'Cơ học':'Vectơ, quy ước chiều dương; phân biệt lực, vận tốc và gia tốc.',
 'Dao động':'Chu kì, tần số, pha; bảo toàn năng lượng và lực phục hồi.',
 'Sóng':'Chu kì và bước sóng; chồng chất li độ, pha và điều kiện biên.',
 'Điện trường':'Điện tích có dấu, vectơ điện trường, điện thế và năng lượng.',
 'Dòng điện':'Hiệu điện thế, dòng quy ước; bảo toàn điện tích và năng lượng.',
 'Điện từ':'Vectơ từ trường, lực từ, từ thông và quy tắc về dấu.',
 'Chất lưu':'Khối lượng riêng, áp suất, lực đẩy và cân bằng năng lượng.',
 'Quang học':'Góc theo pháp tuyến; phân biệt mô hình tia và mô hình sóng.',
 'Khí lí tưởng':'Nhiệt độ kelvin, lượng chất, áp suất tuyệt đối và điều kiện giữ cố định.',
 'Vật lí nhiệt':'Nhiệt độ, nhiệt lượng, nội năng và quy ước dấu của công.',
 'Hạt nhân':'Bảo toàn năng lượng, điện tích; xác suất, kỳ vọng và số đếm.',
 'Vật lí hiện đại':'Năng lượng, động lượng, đơn vị eV; phân biệt mô hình cổ điển và lượng tử.'
};
export function compileLesson(experiment){
 const authored=lessons[experiment.id];if(!authored)throw Error('Missing lesson '+experiment.id);
 const controlKey=controls[experiment.id]||(timed.has(experiment.id)&&experiment.params.some(p=>p.key==='t')?'t':experiment.params.find(p=>p.key!=='t')?.key);
 const control=experiment.params.find(p=>p.key===controlKey);
 if(!control)throw Error('Missing lesson control '+experiment.id);
 const fixed=experiment.params.filter(p=>p.key!==controlKey&&p.key!=='t').map(p=>p.label);
 const refs=(lessonReferences[experiment.id]||[]).map(id=>({...references[id],id,kind:'Đối chiếu nguyên lý và điều kiện áp dụng'}));
 if(!refs.length)throw Error('Missing lesson references '+experiment.id);
 return Object.freeze({...authored,formulaLatex:formulaOverrides[experiment.id]?.latex,formulaText:formulaOverrides[experiment.id]?.text,controlKey,controlLabel:control.label,controlUnit:control.unit||'',fixed,prerequisite:prerequisiteByTopic[experiment.topic],sources:refs,scope:experiment.extra?'Bài mở rộng: cần kiến thức bổ trợ; chưa khẳng định đối chiếu từng tiết SGK.':'Bài nền tảng theo phân loại hiện có; đối chiếu SGK cụ thể cần bản đồ bài học riêng.',evidence:'Các trạng thái được tính từ mô hình. Việc số liệu khớp công thức không là một phép kiểm chứng thực nghiệm độc lập; không dùng kích thước hoặc tốc độ hình minh họa để thay số đọc.',sourceScope:'Nguồn dùng đối chiếu nguyên lý nền. Quy trình và câu hỏi được biên soạn cho mô hình này; các biến thể phải được xét cùng giả định ghi trong bài.'});
}
