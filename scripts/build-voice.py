"""Render the project's own Vietnamese text with Piper/VAIS-1000. Requires piper-tts 1.3 and ffmpeg."""
import argparse, concurrent.futures, hashlib, json, os, pathlib, subprocess, time, wave
import numpy as np
from piper.voice import PiperVoice
from piper.config import SynthesisConfig
from onnxruntime import InferenceSession, SessionOptions
parser=argparse.ArgumentParser();parser.add_argument('--jobs',required=True);parser.add_argument('--model',required=True);parser.add_argument('--out',required=True);parser.add_argument('--workers',type=int,default=2);args=parser.parse_args()
OUT=pathlib.Path(args.out);OUT.mkdir(parents=True,exist_ok=True);groups=json.loads(pathlib.Path(args.jobs).read_text());MODEL=args.model
voice=None

def init():
 global voice
 voice=PiperVoice.load(MODEL)
 options=SessionOptions();options.intra_op_num_threads=1;options.inter_op_num_threads=1
 voice.session=InferenceSession(MODEL,sess_options=options,providers=['CPUExecutionProvider'])

def render(group):
 global voice
 key=group['id'];signature=hashlib.sha256(json.dumps(group,ensure_ascii=False).encode()).hexdigest();meta=OUT/(key+'.json');mp3=OUT/(key+'.mp3')
 if meta.exists() and mp3.exists() and mp3.stat().st_size>1000:
  old=json.loads(meta.read_text())
  if old.get('signature')==signature:return old
 started=time.monotonic();parts=[];offset=0;segments={};sr=voice.config.sample_rate
 for item in group['segments']:
  chunks=list(voice.synthesize(item['text'],SynthesisConfig(length_scale=1.03,noise_scale=.5,noise_w_scale=.6,normalize_audio=True)))
  samples=np.concatenate([chunk.audio_int16_array for chunk in chunks]) if chunks else np.zeros(int(sr*.1),dtype=np.int16)
  # Keep a small silent gap between sections; cue boundaries refer to the uncompressed PCM timeline.
  start=offset/sr;parts.append(samples);offset+=len(samples);segments[item['key']]=[round(start,5),round(offset/sr,5)];gap=np.zeros(int(sr*.2),dtype=np.int16);parts.append(gap);offset+=len(gap)
 wav=OUT/(key+'.wav')
 with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(np.concatenate(parts).tobytes())
 temporary=OUT/(key+'.tmp.mp3')
 subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','40k','-ar',str(sr),'-write_xing','1',str(temporary)],stdin=subprocess.DEVNULL,capture_output=True,check=True)
 if temporary.stat().st_size<1000:raise RuntimeError('Incomplete MP3: '+key)
 os.replace(temporary,mp3)
 wav.unlink();result={'id':key,'src':'audio/vi/'+key+'.mp3','duration':round(offset/sr,5),'segments':segments,'signature':signature};meta.write_text(json.dumps(result,ensure_ascii=False));print(key,round(offset/sr,1),'s',round(time.monotonic()-started,2),'CPU-s',flush=True);return result

if __name__=='__main__':
 with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers,initializer=init) as pool:results=list(pool.map(render,groups))
 index={r['id']:{k:v for k,v in r.items() if k not in ('id','signature')} for r in results};(OUT/'index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')));print('COMPLETE',len(index),'groups',flush=True)
