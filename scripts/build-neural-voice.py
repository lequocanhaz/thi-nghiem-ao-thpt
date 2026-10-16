"""Create pre-rendered Vietnamese narration; the deployed site has no online TTS dependency.
Requires edge-tts 7.3.1 and ffmpeg. All boundary alignment must match before publication.
"""
import argparse,asyncio,hashlib,importlib,json,os,pathlib,re,subprocess,unicodedata,wave
import edge_tts
p=argparse.ArgumentParser();p.add_argument('--jobs',required=True);p.add_argument('--out',required=True);p.add_argument('--workers',type=int,default=2);p.add_argument('--limit',type=int);a=p.parse_args()
out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
if os.environ.get('SSL_CERT_FILE'):importlib.import_module('edge_tts.communicate')._SSL_CTX.load_verify_locations(cafile=os.environ['SSL_CERT_FILE'])
normalize=lambda s:re.sub(r'[\W_]+','',unicodedata.normalize('NFKC',s),flags=re.UNICODE).casefold()
async def render(group,sem):
 async with sem:
  key=group['id'];meta=out/(key+'.json');mp3=out/(key+'.mp3');signature=hashlib.sha256(json.dumps(group,ensure_ascii=False).encode()).hexdigest()
  if meta.exists() and mp3.exists():
   try:old=json.loads(meta.read_text())
   except (ValueError,OSError):old={}
   if old.get('signature')==signature and mp3.stat().st_size>1000:return old
  texts=[s['text'].strip().rstrip('.!?;')+'.' for s in group['segments']];text=' '.join(texts)
  for retry in range(4):
   try:
    audio=bytearray();words=[]
    tts=edge_tts.Communicate(text,'vi-VN-HoaiMyNeural',rate='-5%',boundary='WordBoundary',connect_timeout=12,receive_timeout=30)
    async for event in tts.stream():
     if event['type']=='audio':audio.extend(event['data'])
     elif event['type']=='WordBoundary':words.append(event)
    expected=''.join(map(normalize,texts));actual=''.join(normalize(w['text']) for w in words)
    if expected!=actual:
     mismatch=next((i for i,(x,y) in enumerate(zip(expected,actual)) if x!=y),min(len(expected),len(actual)))
     raise ValueError('Boundary mismatch '+key+' '+str(mismatch)+' '+expected[max(0,mismatch-10):mismatch+40]+' / '+actual[max(0,mismatch-10):mismatch+40])
    temp=out/(key+'.tmp.mp3');temp.write_bytes(audio)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(temp)]))
    subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(temp),'-f','null','-'],check=True,capture_output=True)
    segments={};wi=0;consumed=0;end=0
    for item,txt in zip(group['segments'],texts):
     end+=len(normalize(txt));first=wi
     while wi<len(words) and consumed<end:consumed+=len(normalize(words[wi]['text']));wi+=1
     if consumed!=end or first==wi:raise ValueError('Segment boundary mismatch '+key+'/'+item['key'])
     start=max(0,words[first]['offset']/1e7-.025);finish=min(duration,(words[wi-1]['offset']+words[wi-1]['duration'])/1e7+.045)
     if wi<len(words):finish=min(finish,words[wi]['offset']/1e7-.01)
     if not finish>start:raise ValueError('Invalid cue '+key)
     segments[item['key']]=[round(start,5),round(finish,5)]
    os.replace(temp,mp3);result={'id':key,'src':'audio/vi13/'+key+'.mp3','duration':duration,'segments':segments,'signature':signature};temp_meta=out/(key+'.tmp.json');temp_meta.write_text(json.dumps(result,ensure_ascii=False));os.replace(temp_meta,meta);print('PASS',key,len(audio),round(duration,2),flush=True);return result
   except Exception as error:
    print('RETRY',key,retry,str(error)[:300],flush=True)
    if retry==3:print('FAIL',key,str(error),flush=True);return {'id':key,'error':str(error)}
    await asyncio.sleep(1+retry*2)
async def main():
 groups=json.loads(pathlib.Path(a.jobs).read_text());groups=groups[:a.limit] if a.limit else groups
 work=[];common=next((g for g in groups if g['id']=='common'),None)
 for g in groups:
  if g['id']=='common':
   for i in range(0,len(g['segments']),16):work.append({'id':'common-part-'+str(i//16),'segments':g['segments'][i:i+16]})
  else:work.append(g)
 results=await asyncio.gather(*(render(g,async_sem) for g in work))
 failed=[r for r in results if 'error'in r]
 if common and not any(r['id'].startswith('common-part-') and 'error'in r for r in results):
  parts=sorted([r for r in results if r['id'].startswith('common-part-')],key=lambda r:int(r['id'].split('-')[-1]));pcm=bytearray();segments={}
  for part in parts:
   samples=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(out/(part['id']+'.mp3')),'-f','s16le','-ac','1','-ar','24000','-']);offset=len(pcm)/48000;part_duration=len(samples)/48000
   for k,(start,end) in part['segments'].items():segments[k]=[round(offset+start,5),round(offset+min(end,part_duration),5)]
   pcm.extend(samples);pcm.extend(bytes(2400))
  wav=out/'common-parts.wav'
  with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(pcm)
  subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','48k',str(out/'common.mp3')],check=True,capture_output=True);wav.unlink()
  combined={'id':'common','src':'audio/vi13/common.mp3','duration':len(pcm)/48000,'segments':segments,'signature':hashlib.sha256(json.dumps(common,ensure_ascii=False).encode()).hexdigest()};(out/'common.json').write_text(json.dumps(combined,ensure_ascii=False));results=[r for r in results if not r['id'].startswith('common-part-')]+[combined]
 index={r['id']:{k:v for k,v in r.items() if k not in ('id','signature')} for r in results if 'error'not in r};(out/'index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')));(out/'failures.json').write_text(json.dumps(failed,ensure_ascii=False,indent=2));print('COMPLETE',len(index),'FAILURES',len(failed),flush=True)
 if failed or len(index)!=len(groups):raise SystemExit(1)
async_sem=None
async def entry():
 global async_sem
 async_sem=asyncio.Semaphore(a.workers);await main()
asyncio.run(entry())
