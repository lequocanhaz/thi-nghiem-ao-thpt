#!/usr/bin/env python3
"""Export Quanh Lab previews from the actual browser LabScene, never AI imagery.

Run a static server for dist first, then:
  python3 scripts/generate-thumbnails-v65.py --base http://127.0.0.1:4173/

Requires Python Playwright and Chromium. The capture page is fulfilled in memory;
no production HTML or scientific module is modified. Defaults use one reusable
WebGL renderer, 640x400, iso view, thumbnail mode and the original default state
at t=min(0.3*duration,1.5) for experiments exposing time. Failures are recorded,
not replaced with invented graphics. Existing output files require --overwrite.
"""
import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HARNESS='''<!doctype html><html><head><meta charset="utf-8"></head><body><script type="module">
import {LabScene} from './scene3d.js?v=65';
import {experiments,initialState} from './experiments.js?v=59';
import {evaluate,duration} from './models.js?v=54';
import {apparatusBounds,boundsInView} from './camera-fit.js?v=43';
import * as T from './vendor/three.module.min.js';
const renderer=new LabScene();
renderer.renderer.setPixelRatio(1);renderer.renderer.shadowMap.enabled=false;
renderer.renderer.setSize(640,400,false);renderer.camera.aspect=640/400;renderer.camera.updateProjectionMatrix();
const config={mode:3,capMode:'charge',thumbnail:true,switches:{lines:true,connections:true,components:true,resultant:true,parallelogram:true,axes:false,vectors:true,trajectory:true}};
const safe=value=>JSON.parse(JSON.stringify(value));
window.captureCatalog=experiments.map(e=>({id:e.id,title:e.shortTitle,grade:e.grade,topic:e.topic}));
window.captureOne=async id=>{
 const e=experiments.find(e=>e.id===id);if(!e)throw Error('Unknown experiment '+id);
 const state={...initialState(e),t:0};let data=evaluate(e.id,state,config);
 if(data?.domainValid===false)throw Error('Default state outside physical domain: '+JSON.stringify(data));
 if(e.params.some(p=>p.key==='t'))state.t=Math.min(duration(e,state,data)*.3,1.5);
 data=evaluate(e.id,state,config);
 if(data?.domainValid===false)throw Error('Capture state outside physical domain: '+JSON.stringify(data));
 renderer.update(e.id,state,data,config);renderer.view('iso');
 renderer.capture();
 const image=renderer.renderer.domElement.toDataURL('image/webp',.86);
 if(!image.startsWith('data:image/webp;base64,'))throw Error('WebP encoding unavailable');
 const bounds=renderer.model.visibleBounds||apparatusBounds(renderer.model.group);
 const projected=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])projected.push(new T.Vector3(x,y,z).project(renderer.camera));
 return {image,state:safe(state),config:safe(config),domainValid:data?.domainValid!==false,
  camera:{kind:renderer.camera.type,position:renderer.camera.position.toArray(),target:renderer.controls.target.toArray(),fov:renderer.camera.fov,aspect:renderer.camera.aspect,zoom:renderer.camera.zoom},
  framing:{boundsInView:boundsInView(renderer.camera,bounds,.98),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},projectedWidth:Math.max(...projected.map(p=>p.x))-Math.min(...projected.map(p=>p.x)),projectedHeight:Math.max(...projected.map(p=>p.y))-Math.min(...projected.map(p=>p.y))},
  renderer:{calls:renderer.renderer.info.render.calls,triangles:renderer.renderer.info.render.triangles,geometries:renderer.renderer.info.memory.geometries,textures:renderer.renderer.info.memory.textures}};
};
const gl=renderer.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
window.captureEngine={webglVersion:gl.getParameter(gl.VERSION),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
window.disposeCapture=()=>renderer.dispose();window.captureReady=true;
</script></body></html>'''

def sha(data):return hashlib.sha256(data).hexdigest()

def module_sources():
    # Exact static module graph used by the capture roots; URL cache queries are ignored.
    pending=[ROOT/'dist'/x for x in ['scene3d.js','experiments.js','models.js','camera-fit.js']]
    seen={}
    while pending:
        path=pending.pop().resolve()
        if path in seen:continue
        data=path.read_bytes();seen[path]=sha(data)
        source=data.decode('utf-8')
        for target in re.findall(r'(?:from\s*|import\s*)[\'\"]([^\'\"]+)[\'\"]',source):
            if target.startswith('.'):
                candidate=(path.parent/target.split('?')[0]).resolve()
                if candidate.suffix=='.js' and candidate.is_file():pending.append(candidate)
    return [{'path':str(path.relative_to(ROOT)),'sha256':value} for path,value in sorted(seen.items())]

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',default='http://127.0.0.1:4173/')
    parser.add_argument('--chromium',default='/usr/bin/chromium')
    parser.add_argument('--output',type=Path,default=ROOT/'dist/previews/v65')
    parser.add_argument('--overwrite',action='store_true')
    parser.add_argument('--ids',nargs='*',help='Optional diagnostic subset; full release requires 300 IDs.')
    args=parser.parse_args();out=args.output.resolve();out.mkdir(parents=True,exist_ok=True)
    if not args.overwrite and any(out.glob('*.webp')):parser.error('Output images exist; use --overwrite for an intentional re-export.')
    sources=module_sources();started=time.monotonic()
    commit=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,text=True,capture_output=True,check=True).stdout.strip()
    manifest={'schema':'quanh-lab.simulation-previews.v1','version':65,'createdAt':datetime.now(timezone.utc).isoformat(),'sourceCommit':commit,
      'provenance':'Actual Quanh Lab LabScene WebGL rendering; no AI images, substitutions or changes to equations/default scientific parameters.',
      'dimensions':{'width':640,'height':400},'format':'image/webp','quality':.86,
      'capture':{'renderer':'LabScene','view':'iso','pixelRatio':1,'shadows':False,'time':'min(duration * 0.3, 1.5) when a time parameter is present, otherwise 0','camera':'Existing LabScene.view(iso) and frameApparatus; no per-ID camera overrides.'},
      'generator':{'path':str(Path(__file__).relative_to(ROOT)),'sha256':sha(Path(__file__).read_bytes())},'sourceFiles':sources,'experiments':[],'errors':[]}
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=browser.new_page(viewport={'width':640,'height':400},device_scale_factor=1)
        page.set_default_timeout(60000)
        page.on('pageerror',lambda e:manifest['errors'].append({'scope':'page','error':str(e)}))
        harness_url=urljoin(args.base,'__quanh_capture_v62.html')
        page.route('**/__quanh_capture_v62.html',lambda route:route.fulfill(status=200,content_type='text/html',body=HARNESS))
        page.goto(harness_url);page.wait_for_function('window.captureReady===true',timeout=60000)
        manifest['engine']={'browser':'Chromium','version':browser.version,**page.evaluate('window.captureEngine')}
        catalog=page.evaluate('window.captureCatalog')
        if args.ids:catalog=[e for e in catalog if e['id'] in args.ids]
        for index,experiment in enumerate(catalog,1):
            identifier=experiment['id']
            try:
                capture=page.evaluate('(id)=>window.captureOne(id)',identifier)
                raw=base64.b64decode(capture.pop('image').split(',',1)[1],validate=True)
                if raw[:4]!=b'RIFF' or raw[8:12]!=b'WEBP':raise RuntimeError('Invalid WebP bytes')
                target=out/(identifier+'.webp');target.write_bytes(raw)
                manifest['experiments'].append({**experiment,'file':identifier+'.webp','sha256':sha(raw),'bytes':len(raw),'status':'captured',**capture})
            except Exception as error:
                item={**experiment,'status':'failed','error':str(error)};manifest['experiments'].append(item);manifest['errors'].append(item)
                print('FAILED',identifier,str(error)[:300],flush=True)
            if index%10==0 or index==len(catalog):
                print(f'CAPTURE {index}/{len(catalog)} elapsed={time.monotonic()-started:.1f}s errors={len(manifest["errors"])}',flush=True)
        page.evaluate('window.disposeCapture()');browser.close()
    manifest['durationSeconds']=round(time.monotonic()-started,3)
    manifest['complete']=len(catalog)==300 and len(manifest['experiments'])==300 and not manifest['errors']
    final_sources=module_sources();manifest['sourceStable']=sources==final_sources
    if not manifest['sourceStable']:manifest['errors'].append({'scope':'sources','error':'Scientific module graph changed during capture. Re-export required.'});manifest['complete']=False
    (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'FINISHED captured={sum(e["status"]=="captured" for e in manifest["experiments"])} complete={manifest["complete"]} sourceStable={manifest["sourceStable"]}',flush=True)
    return 0 if not manifest['errors'] else 1

if __name__=='__main__':sys.exit(main())
