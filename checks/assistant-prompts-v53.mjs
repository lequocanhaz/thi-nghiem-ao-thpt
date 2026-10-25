import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {LabAssistant} from '../dist/assistant.js';
import {experiments,initialState} from '../dist/experiments.js';
import {libraryContext} from '../dist/assistant-context.js';

const {document}=parseHTML('<body><button id="openAssistant"></button></body>');
const catalog=libraryContext(experiments);
const contextFor=e=>({id:e.id,title:e.title,parameters:e.params.map(p=>({key:p.key,label:p.label,value:initialState(e)[p.key],unit:p.unit})),columns:e.headers});
let context=contextFor(experiments.find(e=>e.id==='ohm')),calls=0,submits=0,focuses=0;
const chat=new LabAssistant({document,getContext:()=>context,endpoint:'https://fixture.invalid/chat',fetcher:()=>{calls++;throw Error('Suggestions must never call transport');}});
chat.form.addEventListener('submit',()=>{submits++;});chat.input.focus=()=>{focuses++;};
const buttons=()=>[...chat.root.querySelectorAll('.ai-prompt')];
chat.open();assert.equal(buttons().length,3);assert.equal(chat.q('.ai-prompts').getAttribute('role'),'group');
for(const button of buttons()){assert.equal(button.type,'button');assert.match(button.getAttribute('aria-label'),/^Soạn câu hỏi: /);}
const attached={id:'ohm-image',name:'Đồ thị điện.png',url:'data:image/png;base64,fixture'};
chat.pictures().push(attached);chat.render();chat.input.value='Nháp gốc về điện';buttons()[1].click();
assert.ok(chat.input.value.startsWith('Nháp gốc về điện\n'),'A suggestion appends instead of replacing the existing draft');
assert.match(chat.input.value,/định luật Ohm/i);assert.match(chat.input.value,/Hiệu điện thế U/);assert.match(chat.input.value,/hiện tại 6 V/);
assert.equal(chat.pictures()[0],attached);assert.equal(chat.thread().length,0);assert.equal(calls,0);assert.equal(submits,0);assert.equal(chat.submit.disabled,false);assert.ok(focuses>0);
const ohmDraft=chat.input.value;
context=contextFor(experiments.find(e=>e.id==='wave'));chat.refreshContext();assert.equal(chat.input.value,'');assert.equal(chat.pictures().length,0);
assert.match(buttons()[1].textContent,/Biên độ A/);buttons()[2].click();assert.match(chat.input.value,/Sóng cơ/);assert.match(chat.input.value,/t \(s\)/);assert.match(chat.input.value,/độ dốc/);
chat.pictures().push({id:'wave-image',name:'Sóng.png',url:'data:image/png;base64,fixture'});const waveDraft=chat.input.value;
context=contextFor(experiments.find(e=>e.id==='ohm'));chat.refreshContext();assert.equal(chat.input.value,ohmDraft);assert.equal(chat.pictures()[0],attached);
context=contextFor(experiments.find(e=>e.id==='wave'));chat.refreshContext();assert.equal(chat.input.value,waveDraft);assert.equal(chat.pictures()[0].id,'wave-image');
// Parameters may change while the empty screen stays mounted. Read the current
// value at click time rather than retaining the value captured during render.
chat.input.value='';context.parameters[0].value=1.25;buttons()[1].click();assert.match(chat.input.value,/hiện tại 1.25 cm/);
chat.close();chat.open();assert.match(chat.input.value,/hiện tại 1.25 cm/);assert.equal(chat.pictures()[0].id,'wave-image');
// A button detached by navigation must not insert an old lesson's prompt.
const stale=buttons()[0];context=catalog;stale.click();assert.equal(chat.currentKey,'library');assert.equal(chat.input.value,'');assert.equal(chat.pictures().length,0);
assert.deepEqual(buttons().map(b=>b.textContent),['Tìm bài phù hợp','Lập kế hoạch khảo sát','Đọc đồ thị']);
for(const [index,pattern] of [/lớp nào/,/giữ các biến khác cố định/,/hai trục/].entries()){chat.input.value='';buttons()[index].click();assert.match(chat.input.value,pattern);}
// Dynamic titles/labels/column labels are plain text, including markup-looking
// strings. Neither rendering nor choosing a prompt creates executable nodes.
context={id:'unsafe-fixture',title:'<img src=x onerror=alert(1)>',parameters:[{key:'x',label:'<script>unsafe</script>',value:2,unit:'m'}],columns:['<svg onload=alert(1)>']};chat.refreshContext();
assert.match(buttons()[1].textContent,/<script>/);assert.equal(chat.q('.ai-prompts script'),null);assert.equal(chat.q('.ai-prompts svg'),null);buttons()[0].click();assert.match(chat.input.value,/<img src=x/);assert.equal(chat.q('.ai-messages img[src=x]'),null);
chat.input.value='x'.repeat(6000);buttons()[0].click();assert.equal(chat.input.value,'x'.repeat(6000));assert.match(chat.status.textContent,/6000/);
// All actual catalog contexts produce three relevant drafts without sending.
for(const experiment of experiments){context=contextFor(experiment);chat.refreshContext();assert.equal(buttons().length,3,experiment.id);chat.input.value='';buttons()[0].click();assert.ok(chat.input.value.includes(experiment.title),experiment.id);assert.ok(chat.input.value.length<=6000);assert.equal(chat.thread().length,0,experiment.id);}
assert.equal(calls,0);assert.equal(submits,0);
// Once conversation content exists, the welcome suggestions are not repeated.
chat.thread().push({role:'assistant',content:'Lời giải fixture'});chat.render();assert.equal(buttons().length,0);assert.match(chat.q('.ai-messages').textContent,/Lời giải fixture/);
// A disconnected assistant still lets the user prepare a question.
const offDoc=parseHTML('<body></body>').document;
const off=new LabAssistant({document:offDoc,getContext:()=>catalog,endpoint:'',fetcher:()=>{calls++;}});off.q('.ai-prompt').click();assert.ok(off.input.value);assert.equal(off.submit.disabled,true);assert.equal(calls,0);
console.log('PASS assistant v53: context prompts across 300 lessons and library; draft/image retention, click-time values, stale-route safety, plain text and length limits; zero submit/transport calls. DOM fixtures only.');
