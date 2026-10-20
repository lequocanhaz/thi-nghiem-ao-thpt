// Optional benchmark: Chromium SwiftShader + optional CPU slowdown, not physical mobile FPS.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/workspace/.quanh-qa/node_modules/playwright/index.mjs');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.QUANH_BASE_URL||'http://127.0.0.1:4173/';const results=[];
try{
 for(const scenario of [{name:'electric-source',id:'electric',cpu:1},{name:'electric-probe',id:'electric',cpu:1,mode:3,key:'px'},{name:'wave',id:'wave',cpu:1},{name:'wave-dpr2',id:'wave',cpu:1,dpr:2},{name:'electric-source-cpu4',id:'electric',cpu:4}]){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:scenario.dpr||1}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));if(scenario.cpu>1)await(await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate',{rate:scenario.cpu});
  await page.goto(base+'#lab/'+scenario.id);await page.waitForSelector('#visual canvas',{timeout:30000});if(scenario.mode!==undefined)await page.locator(`[data-electric-mode="${scenario.mode}"]`).click();if(scenario.key)await page.locator('#dragKey').selectOption(scenario.key);
  await page.evaluate(()=>document.querySelector('[data-panel=data]').click());
  await page.evaluate(async()=>{
   const resources=performance.getEntriesByType('resource').filter(e=>/\/scene3d\.js\?/.test(e.name));const url=(resources.find(e=>e.name.includes('attempt='))||resources[0])?.name;assertURL(url);function assertURL(u){if(!u)throw Error('Scene module not found');}const {LabScene}=await import(url);const update=LabScene.prototype.update;
   window.__perf={updates:[],renders:0,dom:{meters:0,graph:0,play:0},longTasks:[],raf:[],recording:false};
   LabScene.prototype.update=function(...args){const p=window.__perf,start=performance.now(),before=this.model;
    if(!this.__renderInstrumented){this.__renderInstrumented=true;p.pixelRatio=this.renderer.getPixelRatio();const render=this.renderer.render.bind(this.renderer);this.renderer.render=(...a)=>{if(p.recording)p.renders++;return render(...a);};}
    try{return update.apply(this,args);}finally{if(p.recording)p.updates.push({ms:performance.now()-start,rebuilt:before!==this.model});}
   };
   for(const [selector,key]of [['#readouts','meters'],['#graph','graph'],['#play','play']]){const node=document.querySelector(selector);if(node)new MutationObserver(records=>{if(window.__perf.recording)window.__perf.dom[key]+=records.filter(r=>r.type==='childList').length;}).observe(node,{childList:true});}
   new PerformanceObserver(list=>{if(window.__perf.recording)window.__perf.longTasks.push(...list.getEntries().map(e=>e.duration));}).observe({type:'longtask',buffered:false});
   let previous;const sample=now=>{if(window.__perf.recording&&previous)window.__perf.raf.push(now-previous);previous=now;requestAnimationFrame(sample);};requestAnimationFrame(sample);
  });
  // Include data-panel drawing in the workload; it must keep real rows and points.
  await page.getByRole('button',{name:'Chạy',exact:true}).click();await page.waitForTimeout(500);await page.evaluate(()=>{window.__perf.recording=true;window.__perf.started=performance.now();});await page.waitForTimeout(2500);
  const data=await page.evaluate(()=>{const p=window.__perf;p.recording=false;return {...p,elapsed:performance.now()-p.started};});await page.locator('#play').click();assert.deepEqual(errors,[]);assert.ok(data.updates.length>0);
  const percentile=(a,q)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*q))]:null;
  if(process.env.QUANH_PERF_ASSERT==='1'){assert.equal(data.updates.filter(e=>e.rebuilt).length,0,scenario.name+' must retain model');assert.equal(data.dom.meters,0,'Readout nodes retained');assert.equal(data.dom.play,0,'Play button nodes retained');if(scenario.id==='wave')assert.equal(data.dom.graph,0,'Graph SVG retained for unchanged recorded series');}
  const result={...scenario,elapsedMs:data.elapsed,updates:data.updates.length,rebuilds:data.updates.filter(e=>e.rebuilt).length,updateMedianMs:percentile(data.updates.map(e=>e.ms),.5),updateP95Ms:percentile(data.updates.map(e=>e.ms),.95),renders:data.renders,pixelRatio:data.pixelRatio,domReplacements:data.dom,rafMedianMs:percentile(data.raf,.5),rafP95Ms:percentile(data.raf,.95),longTasks:data.longTasks.length};results.push(result);console.log(JSON.stringify(result));await context.close();
 }
 fs.writeFileSync(process.argv[2]||'/tmp/quanh-performance-v52.json',JSON.stringify({scope:'Chromium headless SwiftShader, 390×844 viewport; optional CPU4 slowdown is synthetic. Shared-host timings vary; not real-device FPS.',results},null,2));
}finally{await browser.close();}
