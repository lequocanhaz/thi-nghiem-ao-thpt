// Explicit live evaluation only. Uses the same public endpoint/quota as the website.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {assistantEndpoint} from '../dist/ai-config.js';
const cases=JSON.parse(readFileSync(new URL('./physics-tutor-cases.json',import.meta.url)));
const ids=process.argv.slice(2);if(!ids.length)throw Error('Chọn 1–3 mã tình huống trong physics-tutor-cases.json; mỗi ca dùng một lượt API thật.');
const selected=ids.map(id=>{const c=cases.find(c=>c.id===id);if(!c)throw Error('Mã không hợp lệ: '+id);return c;});if(selected.length>3)throw Error('Tối đa 3 ca mỗi lần, giữ hạn mức 4 lượt/phút.');
const file=new URL('./tutor-live-v27.json',import.meta.url);const report=existsSync(file)?JSON.parse(readFileSync(file)): {endpoint:assistantEndpoint,method:'Live HTTP requests from Node; not browser/device QA. Expected facts require human review, no universal accuracy claim.',results:[]};
for(const c of selected){
 const start=Date.now();const response=await fetch(assistantEndpoint,{method:'POST',headers:{Origin:'https://lequocanhaz.github.io','Content-Type':'application/json'},signal:AbortSignal.timeout(55000),body:JSON.stringify({question:c.question,timeZone:'Asia/Ho_Chi_Minh',context:{id:'ohm',title:'Định luật Ohm',parameters:[{key:'u',value:6,unit:'V'},{key:'r',value:3,unit:'Ω'}],catalog:{totalExperiments:300}},history:[]})});
 const payload=await response.json();const entry={id:c.id,area:c.area,question:c.question,expected:c.review,status:response.status,durationMs:Date.now()-start,at:new Date().toISOString(),answer:payload.answer||null,error:payload.error||null,review:'pending'};
 report.results.push(entry);writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(entry));if(!response.ok)process.exitCode=1;
}
