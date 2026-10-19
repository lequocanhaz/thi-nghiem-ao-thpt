/** Export all current Quanh Lab experiment IDs into a safe thumbnail production manifest. */
import fs from 'node:fs';
import {experiments} from '../dist/experiments.js';
if(experiments.length!==300)throw new Error('Expected 300 experiments, received '+experiments.length);
const curated=new Set(['electric','ohm','capacitor','oscillation','wave','interference','prism','pendulum','energy','boyle']);
const seen=new Set();
const suggestedScene=e=>{
 const str=(e.title+' '+(e.description||'')).toLowerCase();
 if(/điện trường|điện tích|coulomb/.test(str))return 'field-lines';
 if(/mạch|định luật ôm|ohm|điện trở/.test(str))return 'circuit';
 if(/giao thoa/.test(str))return 'interference';
 if(/sóng|bước sóng/.test(str))return 'wave';
 if(/lăng kính|khúc xạ|tán sắc|ánh sáng/.test(str))return 'optics';
 if(/dao động|lò xo|con lắc/.test(str))return 'oscillation';
 if(/khí|piston|pít tông|boyle/.test(str))return 'gas';
 if(/lực|chuyển động|cơ năng|gia tốc/.test(str))return 'mechanics';
 return e.topic||'';
};
const rows=experiments.map((e,i)=>{
 if(!e.id||seen.has(e.id))throw new Error('Duplicate or invalid ID: '+e.id);
 seen.add(e.id); const id=e.id;
 return {sequence:i+1,id,title:e.title,shortTitle:e.shortTitle||e.title,grade:e.grade,topic:e.topic,description:e.description||'',suggestedIllustration:suggestedScene(e),fileSvg:'images/svg/'+id+'.svg',fileWebp:'images/webp/'+id+'.webp',status:curated.has(id)?'template-ready':'needs-review',illustrationReviewed:false,physicsReviewed:false,sgkMapping:{KNTT:null,CTST:null,CD:null,status:'not-verified'}};
});
const doc={schemaVersion:1,catalogCount:300,reviewedCount:0,note:'Templates are not yet scientifically reviewed; no SGK lesson number is asserted.',experiments:rows};
fs.writeFileSync('thumbnail-manifest.json',JSON.stringify(doc,null,2)+'\n');
const fields=['sequence','id','title','grade','topic','suggestedIllustration','status','fileSvg','fileWebp','illustrationReviewed','physicsReviewed'];
const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
fs.writeFileSync('thumbnail-catalog.csv',[fields.join(','),...rows.map(r=>fields.map(key=>q(r[key])).join(','))].join('\n')+'\n');
console.log('OK:',rows.length,'unique experiments; 10 candidate templates and',rows.length-curated.size,'awaiting specialized diagrams.');
