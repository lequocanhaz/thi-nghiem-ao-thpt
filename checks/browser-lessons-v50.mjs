// Optional real-browser checks; PLAYWRIGHT_MODULE may point outside this checkout.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.QUANH_BASE_URL||'http://127.0.0.1:4173/';
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto(base,{waitUntil:'networkidle'});assert.equal(requests.some(u=>/lessons\/catalog|batch-\d+/.test(u)),false,'Home does not load editorial catalog');
 for(const id of ['ohm','refraction','vector_sum','string_speed','hydraulic_press','metacentric','duffing','rc_meter_loading','fabry_perot','poisson_counting','resonance','rlc_free','electron_bragg','newton_cradle']){
  console.log('LESSON',id);await page.goto(base+'#lab/'+id);await page.waitForSelector(`.teaching-guide-content [data-lesson="${id}"]`,{state:'attached'});await page.waitForSelector('#visual canvas');
  if(!await page.locator('.teaching-guide').evaluate(e=>e.open))await page.locator('.teaching-guide>summary').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.teaching-guide-content .math-tex')].every(e=>e.dataset.mathRendered==='true'));
  const display=page.locator('.teaching-guide-content .math-tex').first();assert.ok(await display.locator('.katex math').count(),id+' retains MathML');if((await display.getAttribute('data-math-tex')).includes('\\dfrac'))assert.ok(await display.locator('mfrac').count(),id+' displays stacked fractions');
  for(const svg of await display.locator('.katex svg').all()){assert.equal(await svg.evaluate(e=>getComputedStyle(e).maxWidth),'none','KaTeX stretchy SVG must not inherit global max-width');assert.notEqual(await svg.evaluate(e=>getComputedStyle(e).fill),'none','Radical/vector SVG must not inherit toolbar icon fill:none');}
  const lesson=page.locator('.teaching-guide-content .lesson-content');assert.ok((await lesson.locator('.lesson-question').innerText()).length>20);assert.equal(await lesson.locator('.lesson-solution').evaluate(e=>e.open),false);
  await lesson.locator('.lesson-solution>summary').focus();await page.keyboard.press('Enter');assert.equal(await lesson.locator('.lesson-solution').evaluate(e=>e.open),true);await page.keyboard.press('Enter');
  assert.ok(await lesson.locator('.lesson-references a').count());
  await page.getByRole('button',{name:'Ghi điểm',exact:true}).click();
  const before=await page.evaluate(id=>JSON.parse(localStorage.getItem('thpt-lab-v1'))[id],id);
  await lesson.locator('[data-action=lesson-control]').click();
  const after=await page.evaluate(id=>JSON.parse(localStorage.getItem('thpt-lab-v1'))[id],id);assert.deepEqual(after.state,before.state,id+' selecting control preserves parameters');assert.deepEqual(after.rows,before.rows);
  if(id==='metacentric'){
   assert.equal(await page.locator('#dragKey').inputValue(),'width');assert.equal(after.config.processKey,'width');
   await page.getByRole('button',{name:'Chạy',exact:true}).click();await page.waitForTimeout(150);await page.getByRole('button',{name:'Tạm dừng',exact:true}).click();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('thpt-lab-v1')).metacentric.config.process.key),'width');
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('.teaching-guide>summary').click();await page.locator('.teaching-guide>summary').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/tmp/quanh-v50-lesson-mobile.png'});await context.close();
 // A late lesson must not replace the learner's in-progress note or prediction.
 const delayed=await browser.newContext();const late=await delayed.newPage();late.on('pageerror',e=>errors.push(e.message));let release;const gate=new Promise(resolve=>release=resolve);
 await late.route('**/lessons/catalog.js*',async r=>{await gate;await r.continue().catch(()=>{});});await late.goto(base+'#lab/ohm');
 await late.waitForSelector('[data-panel=tasks]',{state:'attached'});await late.evaluate(()=>document.querySelector('[data-panel=tasks]').click());await late.locator('#notes').fill('Lưu nhận xét U và R; không ghi đè khi bài tải xong.');
 release();await late.waitForSelector('[data-lesson=ohm]',{state:'attached'});assert.equal(await late.locator('#notes').inputValue(),'Lưu nhận xét U và R; không ghi đè khi bài tải xong.');
 await late.evaluate(()=>document.querySelector('[data-panel=discover]').click());await late.locator('#prediction').fill('Dự đoán: tăng U, giữ R thì I tăng.');
 await late.goto(base+'#lab/metacentric');await late.waitForSelector('[data-lesson=metacentric]',{state:'attached'});await late.goto(base+'#lab/ohm');await late.waitForSelector('[data-lesson=ohm]',{state:'attached'});
 assert.equal(await late.locator('#prediction').inputValue(),'Dự đoán: tăng U, giữ R thì I tăng.');assert.equal(await late.locator('[data-lesson=metacentric]').count(),0);
 await delayed.close();
 const broken=await browser.newContext();const failed=await broken.newPage();failed.on('pageerror',e=>errors.push(e.message));await failed.route('**/lessons/batch-01.js*',r=>r.abort());await failed.goto(base+'#lab/ohm');await failed.waitForSelector('[data-action=retry-lesson]',{state:'attached'});await failed.getByRole('button',{name:'Ghi điểm',exact:true}).click();
 await failed.unroute('**/lessons/batch-01.js*');await failed.evaluate(()=>document.querySelector('[data-action=retry-lesson]').click());await failed.waitForSelector('[data-lesson=ohm]',{state:'attached'});assert.equal(await failed.locator('[data-measurement-count]').first().innerText(),'1');await broken.close();
 assert.deepEqual(errors,[]);console.log('PASS Chromium v50: lazy editorial load, 14 representative lessons with actual KaTeX, keyboard solutions, operational controls, metacentric playback, mobile width, late loading preserves notes/predictions, route isolation, network failure/retry retains data.');
}finally{await browser.close();}
