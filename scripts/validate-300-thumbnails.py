#!/usr/bin/env python3
"""Validate and compress Quanh Lab's 300 uniquely identified science illustrations."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageStat
import cairosvg, csv, io, json, hashlib, math, sys
ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'dist/images/thumbnails-2d'
MANIFEST=FOLDER/'manifest.json'
def main():
    data=json.loads(MANIFEST.read_text(encoding='utf8'))
    entries=data['images']
    if len(entries)!=300 or len({x['id'] for x in entries})!=300:
        raise RuntimeError('300 unique experiment IDs are required')
    by_hash={}; collisions=[]; defects=[]
    stats=[]
    for idx,e in enumerate(entries,1):
        svg_file=FOLDER/(e['id']+'.svg')
        webp_file=FOLDER/(e['id']+'.webp')
        try:
            raw=svg_file.read_bytes()
            if raw.count(b'<svg')!=1 or len(raw)<1400:
                raise ValueError('bad SVG')
            png=cairosvg.svg2png(bytestring=raw,output_width=960,output_height=600)
            with Image.open(io.BytesIO(png)) as img:
                if img.size!=(960,600):
                    raise ValueError('wrong dimensions '+str(img.size))
                rgb=img.convert('RGB')
                thumb=rgb.resize((96,60))
                st=ImageStat.Stat(thumb)
                color_difference=sum(st.stddev)/3
                if color_difference<4:
                    raise ValueError('excessively blank illustration '+str(color_difference))
                key=hashlib.sha256(rgb.tobytes()).hexdigest()
                if key in by_hash:
                    collisions.append((by_hash[key],e['id']))
                else:
                    by_hash[key]=e['id']
                rgb.save(webp_file,'WEBP',quality=86,method=5)
                if webp_file.stat().st_size<3500:
                    raise ValueError('truncated/low-information WebP')
                stats.append({'id':e['id'],'title':e['title'],'topic':e['topic'],
                              'grade':e['grade'],'bytes':webp_file.stat().st_size,
                              'contrast':round(color_difference,2)})
        except Exception as error:
            defects.append((e['id'],str(error)))
        if idx%50==0:print(f'Validated {idx}/300; failures={len(defects)}, duplicates={len(collisions)}',flush=True)
    if stats:
        cell_w,cell_h=240,167
        count=30; previews=entries[::max(1,len(entries)//count)][:count]
        cols=5; rows=math.ceil(len(previews)/cols)
        sheet=Image.new('RGB',(cols*cell_w,rows*cell_h),'#ffffff')
        d=ImageDraw.Draw(sheet)
        for j,e in enumerate(previews):
            p=FOLDER/(e['id']+'.webp')
            if not p.exists():continue
            with Image.open(p) as im:
                cell=im.convert('RGB').resize((240,150))
            x=(j%cols)*cell_w;y=(j//cols)*cell_h
            sheet.paste(cell,(x,y))
            d.text((x+5,y+150),e['id'][:32],fill='#174c81')
        sheet.save(FOLDER/'contact-sheet.jpg',quality=90)
    with open(FOLDER/'validation.csv','w',encoding='utf-8',newline='') as out:
        w=csv.DictWriter(out,fieldnames=['id','title','topic','grade','bytes','contrast']);w.writeheader();w.writerows(stats)
    data['renderedCount']=len(stats);data['duplicateImagePairs']=collisions;data['errors']=defects
    data['scienceReview']='pending per-experiment physics review (not a certification)'
    MANIFEST.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('FINAL: '+str(len(stats))+' WebP images, '+str(len(collisions))+' bytewise visual duplicates, '+str(len(defects))+' failures',flush=True)
    if collisions:print('DUPLICATES:',collisions[:35],file=sys.stderr)
    if defects:print('ERRORS:',defects[:35],file=sys.stderr)
    if len(stats)!=300 or len(collisions) or defects:raise SystemExit(1)
if __name__=='__main__':main()
