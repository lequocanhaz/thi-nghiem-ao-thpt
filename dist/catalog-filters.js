export const subjects=[['physics','Vật lí'],['chemistry','Hóa học'],['biology','Sinh học']];
export const bookSeries=[['ket-noi','Kết nối tri thức'],['chan-troi','Chân trời sáng tạo'],['canh-dieu','Cánh diều']];
// The current catalog is physics. Book-series membership requires an explicit mapping.
export const subjectOf=e=>e.subject||'physics';
export const seriesOf=e=>Array.isArray(e.bookSeries)?e.bookSeries:[];
export function matchesCatalog(e,subject,series){return (subject==='all'||subjectOf(e)===subject)&&(series==='all'||seriesOf(e).includes(series));}
export function readCatalogURL(search){
 const q=new URLSearchParams(search);
 return {search:(q.get('q')||'').slice(0,200),grade:['10','11','12'].includes(q.get('grade'))?q.get('grade'):'all',subject:subjects.some(([v])=>v===q.get('subject'))?q.get('subject'):'all',series:bookSeries.some(([v])=>v===q.get('series'))?q.get('series'):'all'};
}
