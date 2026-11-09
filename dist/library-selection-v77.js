// A reversible presentation selection. The scientific catalog, legacy URLs and
// saved sessions remain intact. Selection is not a certification of every model.
export const mainExperimentIds=Object.freeze([
 'energy','uniform','acceleration','horizontal','newton','incline','collision','circular','lever','hooke','friction',
 'oscillation','pendulum','damped','resonance','wave','interference','standing','sound',
 'electric','ohm','capacitor','series','parallel','joule','resistivity','internalresistance',
 'reflection','refraction','lens','young','boyle','gas','calorimetry','phasechange',
 'magnetic','induction','solenoid','ac','decay'
]);
const mainIds=new Set(mainExperimentIds);
export const isMainExperiment=id=>mainIds.has(id);
export const readCollection=search=>new URLSearchParams(search).get('collection')==='archive'?'archive':'main';
export function collectionEntries(experiments,collection='main',personal=false){
 return personal?experiments:experiments.filter(e=>isMainExperiment(e.id)===(collection!=='archive'));
}
// Related investigations have distinct objectives; they are not literal copies.
const related={spring_period:'oscillation',oscillator_energy:'oscillation',potential_point:'electric',string_speed:'wave',string_resonance:'standing',standing_phase:'standing'};
const circuitIds=new Set(['potentiometer','voltage_divider','kirchhoff_loop','diode_model','meter_loading','max_power','battery_series','battery_parallel']);
export const selectionCopy=Object.freeze([
 ['Thư viện chính','Main library'],['Kho bổ trợ','Supplementary collection'],['Chọn bộ thí nghiệm','Choose a collection'],
 ['Bài bổ trợ','Supplementary investigation'],['Cần hoàn thiện','Needs improvement'],
 ['Thí nghiệm chính · Vật lí lớp 10–12','Main experiments · Physics grades 10–12'],
 ['Các bài có mục tiêu khác nhau để bắt đầu quan sát và đo đạc.','Distinct investigations to start observing and measuring.'],
 ['Bài chuyên đề và mô hình đang hoàn thiện. Xem giới hạn từng bài trước khi dùng.','Specialized investigations and models in development. Read each model’s limitations before use.'],
 ['Bao gồm bài trong cả hai bộ; các bài đã lưu vẫn được giữ.','Includes both collections; previously saved investigations are retained.'],
 ['Tìm trong kho bổ trợ','Search the supplementary collection'],['Về thư viện chính','Back to the main library'],
 ['Bài nhập môn liên quan','Related introductory investigation'],
 ['Bài này nằm ngoài bộ thí nghiệm nhập môn đang được ưu tiên.','This investigation is outside the currently prioritized introductory collection.'],
 ['Bài này khảo sát một quan hệ riêng, bổ sung cho bài nhập môn liên quan.','This investigation explores a distinct relationship that complements the related introductory investigation.'],
 ['Hình hiện dùng chung mạch nguồn–điện trở–đồng hồ, chưa thể hiện đủ linh kiện hoặc cách mắc của bài này.','The current shared source–resistor–meter diagram does not fully depict this investigation’s components or connections.'],
 ['Hình hạt hiện chưa biểu diễn bước sóng de Broglie; không dùng kích thước cụm hạt để suy ra bước sóng.','The current particle picture does not depict the de Broglie wavelength; do not infer wavelength from cluster size.'],
 ['Chưa xử lý đầy đủ miền điện trở phụ âm. Không dùng mô hình này để thiết kế vôn kế khi điện áp chọn nhỏ hơn điện áp toàn thang điện kế.','The negative series-resistance domain is not fully handled. Do not use this model to design a voltmeter below the galvanometer full-scale voltage.']
]);
export function selectionText(text,locale='vi-VN'){
 return locale==='en-US'?(selectionCopy.find(([vi])=>vi===text)?.[1]||text):text;
}
const reasons={
 circuit:'Hình hiện dùng chung mạch nguồn–điện trở–đồng hồ, chưa thể hiện đủ linh kiện hoặc cách mắc của bài này.',
 debroglie:'Hình hạt hiện chưa biểu diễn bước sóng de Broglie; không dùng kích thước cụm hạt để suy ra bước sóng.',
 voltmeter:'Chưa xử lý đầy đủ miền điện trở phụ âm. Không dùng mô hình này để thiết kế vôn kế khi điện áp chọn nhỏ hơn điện áp toàn thang điện kế.',
 related:'Bài này khảo sát một quan hệ riêng, bổ sung cho bài nhập môn liên quan.',
 specialized:'Bài này nằm ngoài bộ thí nghiệm nhập môn đang được ưu tiên.'
};
export function selectionInfo(id){
 if(isMainExperiment(id))return {kind:'main'};
 if(circuitIds.has(id))return {kind:'needs-work',reason:reasons.circuit};
 if(id==='debroglie')return {kind:'needs-work',reason:reasons.debroglie};
 if(id==='voltmeter_design')return {kind:'needs-work',reason:reasons.voltmeter};
 return {kind:'supplementary',primary:related[id],reason:related[id]?reasons.related:reasons.specialized};
}
