"""Decode packaged narration and check duration/cue audibility, not subjective pronunciation."""
import concurrent.futures,hashlib,json,pathlib,subprocess,numpy as np
root=pathlib.Path(__file__).resolve().parents[1];text=(root/'dist/voice-index.js').read_text();index=json.loads(text[len('export const voiceIndex='):].strip().rstrip(';'))
def check(item):
 key,meta=item;file=root/'dist'/meta['src'];pcm=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-f','s16le','-ac','1','-ar','24000','-']);x=np.frombuffer(pcm,dtype='<i2').astype(np.float64);duration=len(x)/24000
 assert abs(meta['duration']-duration)<.16,(key,meta['duration'],duration)
 rms=[]
 for name,(start,end) in meta['segments'].items():
  assert start>=0 and end>start and start<duration,(key,name,'bounds')
  segment=x[round(start*24000):min(len(x),round(end*24000))];value=float(np.sqrt(np.mean(segment**2)));assert np.isfinite(value) and value>30,(key,name,'silent',value);rms.append(value)
 return {'id':key,'duration':duration,'cues':len(rms),'minRms':round(min(rms),2),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(check,index.items()))
assert len(results)==301;out={'files':301,'duration':sum(r['duration'] for r in results),'cues':sum(r['cues'] for r in results),'minRms':min(r['minRms'] for r in results),'results':results};(root/'checks/audio-audit-v13.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in out.items() if k!='results'}));print('PASS full decoding, durations and non-silent cue regions. This does not verify pronunciation or playback on an actual device.')
