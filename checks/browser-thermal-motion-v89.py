from pathlib import Path
source=Path('checks/browser-thermal-v87.py').read_text();exec(compile(source[:source.index('\nCASES=')],'checks/browser-thermal-v87.py','exec'))
node="""import{createState,applyAction,validateState}from'./dist/l3/thermal-physics.js';import{initialPositions}from'./dist/l3/thermal-apparatus.js';import{newSession,newTrial,serializeSession,parseSession}from'./dist/l3/data-notebook.js';let s={...createState('ice'),apparatusGeometryVersion:'thermal.geometry.v2'};s=applyAction(s,{actionType:'place-vessel',payloadSI:{placed:true}}).state;const q=newSession('ice');newTrial(q,'ice',{});q.physicalState=s;q.apparatusState={positions:{...initialPositions(s),cup:{x:300,y:250}},cupAngleRad:0,camera:null,geometryVersion:'thermal.geometry.v2'};const raw=serializeSession(q);parseSession(raw,{activity:'ice',validateState:s=>validateState(s).valid});process.stdout.write(raw);"""
fixture=json.loads(subprocess.check_output(['node','--input-type=module','-e',node],text=True));before=source_hashes();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for two in [False,True]:
  b=Bench(browser,'ice',force_2d=two,preloaded=fixture);p=b.page;stage=p.locator('#l3Stage' if two else '#l3ThreeCanvas');stage.scroll_into_view_if_needed();b.select('stirrer');p.wait_for_timeout(200)
  def screen(x,y):
   if not two:return b.screen(x,y)
   return stage.evaluate('(s,p)=>{const q=s.createSVGPoint();q.x=p.x;q.y=p.y;const a=q.matrixTransform(s.getScreenCTM());return{x:a.x,y:a.y}}',{'x':x,'y':y})
  start=screen(780,340);p.mouse.move(start['x'],start['y']);p.mouse.down();points=[screen(775+4*math.sin(i*math.pi/12),340) for i in range(120)]
  stats=stage.evaluate('''(node,points)=>{const times=[],counts={hiddenSvgWrites:0,svgWrites:0,notebookMutations:0,stageMutations:0},svg=document.querySelector('#l3Stage'),original=Element.prototype.setAttribute,observer=new MutationObserver(records=>{for(const r of records){if(svg.contains(r.target)){counts.svgWrites++;if(svg.hasAttribute('hidden'))counts.hiddenSvgWrites++;}if(document.querySelector('#l3Notebook').contains(r.target))counts.notebookMutations++;counts.stageMutations++;}});observer.observe(document.querySelector('.l3-pilot'),{subtree:true,attributes:true,childList:true,characterData:true});const began=performance.now();for(const q of points){const start=performance.now();node.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,cancelable:true,pointerId:1,pointerType:'mouse',isPrimary:true,button:0,buttons:1,clientX:q.x,clientY:q.y}));times.push(performance.now()-start);}const dispatchMs=performance.now()-began;const records=observer.takeRecords();for(const r of records){if(svg.contains(r.target)){counts.svgWrites++;if(svg.hasAttribute('hidden'))counts.hiddenSvgWrites++;}if(document.querySelector('#l3Notebook').contains(r.target))counts.notebookMutations++;counts.stageMutations++;}observer.disconnect();times.sort((a,b)=>a-b);return{inputSamples:points.length,dispatchMs,p50Ms:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],maxMs:Math.max(...times),counts};}''',points)
  p.mouse.up();p.wait_for_timeout(1100);s=b.session();stats.update({'view':'2d' if two else'3d','lastPosition':s['apparatusState']['positions']['stirrer'],'expectedFinalCanonicalX':775+4*math.sin(119*math.pi/12),'pageErrors':b.errors[:]});assert abs(stats['lastPosition']['x']-stats['expectedFinalCanonicalX'])<1e-3,stats
  b.select('cup');stage.scroll_into_view_if_needed();start=screen(300,250);end=screen(350,250);p.mouse.move(start['x'],start['y']);p.mouse.down();p.mouse.move(end['x'],end['y']);p.mouse.up();p.wait_for_timeout(1100);state=b.session();stats['wallOvershoot']={'startX':300,'requestedX':350,'acceptedX':state['apparatusState']['positions']['cup']['x'],'status':p.locator('#l3Status').inner_text()};results.append(stats);print(json.dumps(stats,ensure_ascii=False),flush=True);b.close()
 version=browser.version;browser.close()
after=source_hashes();assert before==after
(out/'report.json').write_text(json.dumps({'browserVersion':version,'scope':'Actual native mouse down/up with a synchronous PointerEvent move burst; CPU/DOM pressure signal, not hardware FPS or user P95 latency.','results':results,'sourceBefore':before,'sourceAfter':after,'sourceStable':True},ensure_ascii=False,indent=2)+'\n')

if args.only!='before':
 assert results[0]['counts']['hiddenSvgWrites']==0,results[0]
 assert results[0]['counts']['stageMutations']<200,results[0]
 assert results[1]['counts']['svgWrites']<200,results[1]
 for result in results:assert 300.5<result['wallOvershoot']['acceptedX']<350,result
 print('PASS v89: coalesced rendering, no hidden SVG writes, final pointer pose retained, contact progress without wall crossing.')
