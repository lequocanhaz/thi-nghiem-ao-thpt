// Optional browser suite; use PLAYWRIGHT_MODULE for an installation outside the checkout.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
const base=process.env.QUANH_BASE_URL||'http://127.0.0.1:4173/';
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.goto(base,{waitUntil:'networkidle'});
console.log('HOME',await page.title(),await page.locator('.experiment-card').count(),errors);
assert.equal(await page.locator('.experiment-card').count(),24);
assert.equal(requests.some(u=>/scene3d|three.module|software-scene/.test(u)),false,'Home must not fetch WebGL modules');
await page.locator('#subjectFilter').selectOption('chemistry');assert.match(await page.locator('#resultCount').innerText(),/^0/);
await page.locator('#subjectFilter').selectOption('physics');await page.locator('#search').fill('định luật Ohm');assert.match(await page.locator('#cards').innerText(),/OHM/);
await page.goBack();await page.waitForTimeout(50);assert.equal(await page.locator('#search').inputValue(),'');
await page.locator('#search').fill('định luật Ohm');await page.locator('#cards .card-open').first().click();await page.waitForSelector('#visual canvas',{timeout:20000});
console.log('LAB',await page.locator('#rendererNotice').innerText(),errors);
await page.locator('[data-action=reset-camera]').click();await page.locator('.teaching-guide>summary').click();assert.match(await page.locator('.teaching-guide-content').innerText(),/Mục tiêu thí nghiệm/);await page.keyboard.press('Escape');assert.equal(await page.locator('.teaching-guide').getAttribute('open'),null);
await page.locator('[data-action=teacher-mode]').click();assert.equal(await page.locator('.header').isVisible(),false);assert.equal(await page.locator('[data-action=teacher-mode]').getAttribute('aria-pressed'),'true');
await page.screenshot({path:'/tmp/quanh-teacher-desktop.png'});
await page.keyboard.press('Escape');assert.equal(await page.locator('.header').isVisible(),true);
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Mobile page must not overflow horizontally');await page.screenshot({path:'/tmp/quanh-lab-mobile.png'});
await page.locator('.lab-breadcrumb a').click();await page.waitForSelector('#subjectFilter');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/tmp/quanh-library-mobile.png'});
assert.deepEqual(errors,[]);console.log('PASS Chromium library, lazy load, filters/history, real canvas, camera, teacher, guide, mobile width');


const delayedContext=await browser.newContext({viewport:{width:390,height:844}});const delayedPage=await delayedContext.newPage();const failureErrors=[];delayedPage.on('pageerror',e=>failureErrors.push(e.message));
let release;const gate=new Promise(resolve=>release=resolve);
await delayedPage.route('**/scene3d.js*',async route=>{await gate;await route.continue().catch(()=>{});});
await delayedPage.goto(base+'#lab/ohm');
await delayedPage.getByRole('button',{name:'Ghi điểm',exact:true}).click();const measured=await delayedPage.locator('[data-measurement-count]').first().innerText();
await delayedPage.getByText('Tải mô hình quá 15 giây.',{exact:false}).waitFor({timeout:22000});assert.equal(await delayedPage.locator('[data-measurement-count]').first().innerText(),measured);
release();await delayedPage.unroute('**/scene3d.js*');await delayedPage.locator('[data-action=retry-3d]').click();await delayedPage.waitForSelector('#visual canvas',{timeout:20000});assert.equal(await delayedPage.locator('[data-measurement-count]').first().innerText(),measured);
console.log('PASS browser delayed module timeout after 15s, retry, recorded data preserved');
await delayedContext.close();
const brokenContext=await browser.newContext();const brokenPage=await brokenContext.newPage();
await brokenPage.route('**/scene3d.js*',route=>route.abort());await brokenPage.goto(base+'#lab/ohm');
await brokenPage.getByRole('heading',{name:'Chưa tải được mô hình'}).waitFor();await brokenPage.getByRole('button',{name:'Ghi điểm',exact:true}).click();
await brokenPage.unroute('**/scene3d.js*');await brokenPage.locator('[data-action=retry-3d]').click();await brokenPage.waitForSelector('#visual canvas',{timeout:20000});assert.equal(await brokenPage.locator('[data-measurement-count]').first().innerText(),'1');await brokenContext.close();console.log('PASS real module network failure/reload retry retains saved measurements');
const offline=await browser.newContext();const fallback=await offline.newPage();fallback.on('pageerror',e=>failureErrors.push(e.message));
await fallback.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/.test(type))return null;return native.call(this,type,...args);};});
await fallback.goto(base+'#lab/energy');await fallback.waitForSelector('#visual canvas');await fallback.waitForFunction(()=>document.querySelector('#rendererNotice')?.textContent.includes('WebGL không khả dụng'));
assert.equal(await fallback.locator('[data-action=retry-3d]').count(),1);await fallback.getByRole('button',{name:'Ghi điểm',exact:true}).click();assert.equal(await fallback.locator('[data-measurement-count]').first().innerText(),'1');console.log('PASS browser WebGL unavailable uses actual Canvas2D, error notice/retry, numerical recording');
await offline.close();
const staticContext=await browser.newContext();const staticPage=await staticContext.newPage();await staticPage.route('**/app.js*',r=>r.abort());await staticPage.goto(base);await staticPage.getByRole('button',{name:'Thử lại',exact:true}).waitFor();assert.equal(await staticPage.locator('#library h1').innerText(),'Thư viện thí nghiệm');assert.equal(await staticPage.locator('#dialog').count(),1);assert.equal(await staticPage.locator('.startup-library a').count(),3);console.log('PASS browser app network failure retains static library, accessible dialog and retry');
assert.deepEqual(failureErrors,[]);
}finally{await browser.close();}
