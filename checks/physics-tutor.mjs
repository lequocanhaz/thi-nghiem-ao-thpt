import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {createAIHandler} from '../server/ai-handler.mjs';
import {LabAssistant} from '../dist/assistant.js';
const origin='https://lequocanhaz.github.io',env={AI_PROVIDER:'gemini',GEMINI_API_KEY:'synthetic-test-fixture'};
const now=()=>Date.parse('2026-10-17T17:30:45.000Z');
const req=data=>new Request('https://fixture.example/api/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
let calls=0,quotaCalls=0,last;
const h=createAIHandler({now,quotaCheck:async()=>{quotaCalls++;return true;},fetcher:async(url,options)=>{calls++;last=JSON.parse(options.body);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'Phản hồi tổng hợp phục vụ kiểm thử giao thức.'}]}}]});}});
for(const [question,zone,expectedTime,expectedDate] of [
 ['Mấy giờ rồi?','Asia/Ho_Chi_Minh','00:30:45','18/10/2026'],
 ['Bây giờ là mấy giờ?','UTC','17:30:45','17/10/2026'],
 ['Hôm nay là ngày mấy?','Asia/Tokyo','02:30:45','18/10/2026'],
 ['Mấy giờ ở Việt Nam?','America/New_York','00:30:45','18/10/2026'],
 ['HÔM NAY LÀ NGÀY MẤY?','UTC','17:30:45','17/10/2026'],
 ['Mấy giờ rồi','Invalid/Zone','00:30:45','18/10/2026'],
 ['Mấy giờ rồi',null,'00:30:45','18/10/2026'],
 ['Mấy giờ rồi','America/New_York','13:30:45','17/10/2026'],
 ['Mấy giờ rồi','Europe/London','18:30:45','17/10/2026'],
 ['Mấy giờ rồi','America/Los_Angeles','10:30:45','17/10/2026'],
 ['Mấy giờ rồi','Asia/Kolkata','23:00:45','17/10/2026'],
 ]){
 const before=calls,r=await h(req({question,timeZone:zone,context:{clock:'fake 1900-01-01'}}),env);assert.equal(r.status,200);
 const {answer}=await r.json();assert.ok(answer.includes(expectedTime),answer);assert.ok(answer.includes(expectedDate),answer);assert.equal(calls,before,'Exact clock questions must use server time, never inference');
}
assert.equal(quotaCalls,11,'Clock requests still obey public endpoint limits');
const cases=JSON.parse(readFileSync(new URL('./physics-tutor-cases.json',import.meta.url)));
for(const c of cases){
 const before=calls,r=await h(req({question:c.question,timeZone:'Asia/Ho_Chi_Minh',context:{id:'ohm',parameters:[{label:'Điện áp',value:6,unit:'V'}]},history:[{role:'user',content:'Tôi đang học đại học.'},{role:'assistant',content:'Bạn muốn khảo sát nội dung nào?'}]}),env);
 assert.equal(r.status,200);assert.equal(calls,before+1,c.id+' must reach model');
 assert.equal(last.contents.at(-1).parts[0].text.split('\n\n')[0],c.question);assert.equal(last.contents[1].role,'model');assert.match(last.contents.at(-1).parts[0].text,/Điện áp/);
 const prompt=last.systemInstruction.parts[0].text;
 for(const term of ['vật lí thống kê','lượng tử','thiên văn','ngoài Vật lí','Không giới hạn','thiếu dữ kiện','Không có công cụ duyệt web','Không có quyền đọc toàn bộ lịch sử ChatGPT','2026-10-17T17:30:45.000Z','18/10/2026','BIPM','NIST'])assert.ok(prompt.includes(term),term);
 assert.equal(last.generationConfig.maxOutputTokens,4096);assert.ok(!JSON.stringify(last).includes(env.GEMINI_API_KEY));
}
// A clock phrase in a long physics question, image, or place-specific question must not short-circuit inference.
for(const question of ['Sau 2 giờ vận tốc là bao nhiêu?','Mấy giờ ở Mỹ?','Mấy giờ ở Tokyo?','Giải thích tại sao đồng hồ chạy chậm gần lỗ đen.']){const before=calls;await h(req({question}),env);assert.equal(calls,before+1);}
const blocked=createAIHandler({now,quotaCheck:async()=>false,fetcher:()=>{throw Error('Must not infer');}});assert.equal((await blocked(req({question:'Mấy giờ rồi?'}),env)).status,429);
// Existing UI remains simple; the real device zone travels outside the lab context.
const {document}=parseHTML('<body><button id="openAssistant"></button></body>');let sent;
const chat=new LabAssistant({document,endpoint:'https://fixture.example/api/chat',getContext:()=>({id:'lab'}),fetcher:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({answer:'Kết quả mẫu'});}});
chat.input.value='Mấy giờ rồi?';await chat.send();assert.equal(sent.timeZone,Intl.DateTimeFormat().resolvedOptions().timeZone);assert.equal(sent.context.id,'lab');assert.equal(chat.q('#aiTitle').textContent,'Trợ lý AI');assert.equal(chat.root.querySelectorAll('button').length,3);

chat.fetcher=async()=>Response.json({answer:'**Kết quả:** I = 2 A; tốc độ $c$. Nguồn: https://www.bipm.org/en/measurement-units/si-defining-constants. **<img src=x onerror=alert(1)>** <script>alert(1)</script> javascript:alert(1)'});
chat.input.value='Nêu kết quả và nguồn';await chat.send();
assert.equal(chat.root.querySelectorAll('.ai-message img,.ai-message script').length,0);assert.ok(chat.root.querySelector('strong'));assert.equal(chat.root.querySelector('.ai-inline-math').textContent,'c');
const link=chat.root.querySelector('a');assert.equal(link.getAttribute('href'),'https://www.bipm.org/en/measurement-units/si-defining-constants');assert.equal(link.rel,'noopener noreferrer');assert.equal(chat.root.querySelectorAll('a').length,1);assert.match(chat.q('.ai-messages').textContent,/<script>/);
console.log(`PASS tutor contract: ${cases.length} topic requests preserve question/history/lab state; broad scope, reviewed constants/references, no fabricated browsing/memory; 11 timezone/date/DST/fallback cases use server clock; quota and simple UI retained. Provider mocked: this does not validate model knowledge.`);
