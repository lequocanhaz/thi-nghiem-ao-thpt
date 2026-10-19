// Curriculum navigation is a topical index, not an assertion of exact lesson
// numbers in any of the three Vietnamese 2018 textbook series.
// Lesson-by-lesson mapping must be curated separately against book editions.
export const curriculumSections={
  10:{'Cơ học':'Chuyển động, lực và năng lượng','Chất lưu':'Áp suất và chất lưu'},
  11:{'Dao động':'Dao động','Sóng':'Sóng','Điện trường':'Điện trường','Dòng điện':'Dòng điện và mạch điện'},
  12:{'Vật lí nhiệt':'Vật lí nhiệt','Khí lí tưởng':'Khí lí tưởng','Điện từ':'Từ trường và cảm ứng điện từ','Hạt nhân':'Vật lí hạt nhân'}
};
export const curriculumKey=e=>e.grade+':'+e.topic;
export function curriculumMeta(e){
 const section=curriculumSections[e.grade]?.[e.topic];
 return {key:curriculumKey(e),label:section||e.topic,
  scope:section?(e.extra?'Mở rộng theo chủ đề':'Chủ đề chương trình 2018'):'Chủ đề bổ trợ / mở rộng'};
}
export function curriculumOptions(experiments,grade='all'){
 const groups=new Map();
 for(const e of experiments){
  if(grade!=='all'&&String(grade)!==String(e.grade))continue;
  const key=curriculumKey(e);
  if(!groups.has(key))groups.set(key,{key,grade:e.grade,label:curriculumMeta(e).label,count:0});
  groups.get(key).count++;
 }
 return [...groups.values()].sort((a,b)=>a.grade-b.grade||a.label.localeCompare(b.label,'vi'));
}
export function interactionTags(e){
 const adjustable=e.params?.some(p=>p.key!=='t');
 const temporal=e.params?.some(p=>p.key==='t');
 const process=e.static&&!e.visualOnly;
 const tags=[temporal?'Mô phỏng diễn biến':process?'Quy trình khảo sát':'Thao tác mô hình'];
 if(adjustable)tags.push('Điều chỉnh & đo');
 return tags;
}
