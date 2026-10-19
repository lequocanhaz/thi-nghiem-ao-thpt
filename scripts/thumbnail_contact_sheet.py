#!/usr/bin/env python3
"""Light contact-sheet export; thumbnails remain image-only without labels/UI."""
from pathlib import Path
import json
import math
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
directory=ROOT/'dist'/'images'/'thumbnails'
manifest=json.loads((directory/'manifest.json').read_text(encoding='utf8'))
rows=list(manifest['images'].values())
if not rows:
    raise RuntimeError('No thumbnails have been exported')
columns=3
thumb_w,thumb_h=390,244
label_h,gap,padding=52,18,24
tile_h=thumb_h+label_h
width=padding*2+columns*thumb_w+(columns-1)*gap
height=padding*2+math.ceil(len(rows)/columns)*tile_h+(math.ceil(len(rows)/columns)-1)*gap
result=Image.new('RGB',(width,height),'#f7f9fc')
draw=ImageDraw.Draw(result)
try:
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
except OSError:
    font=ImageFont.load_default()
for i,item in enumerate(rows):
    x=padding+(i%columns)*(thumb_w+gap)
    y=padding+(i//columns)*(tile_h+gap)
    with Image.open(directory/(item['id']+'.webp')) as raw:
        picture=raw.convert('RGB').resize((thumb_w,thumb_h),Image.Resampling.LANCZOS)
    result.paste(picture,(x,y))
    draw.rounded_rectangle((x,y+thumb_h,x+thumb_w,y+tile_h),radius=8,fill='white')
    title=f"{i+1:02d}. {item['title']}"
    draw.text((x+12,y+thumb_h+12),title[:47],font=font,fill='#152536')
result.save(ROOT/'thumbnail-contact-sheet.jpg',quality=85,optimize=True)
print('Contact sheet:',ROOT/'thumbnail-contact-sheet.jpg',len(rows),'thumbnails')
