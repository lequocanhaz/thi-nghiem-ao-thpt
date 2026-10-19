"""Render the supplied scanned textbooks without removing or changing page content."""
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path
import argparse
import hashlib
import io
import json

import fitz
from PIL import Image

BOOKS = [
    (10, 'SGK VL 10.pdf', 1, False, [('Mở đầu', 6), ('Động học', 20), ('Động lực học', 55), ('Năng lượng, công, công suất', 90), ('Động lượng', 109), ('Chuyển động tròn', 119), ('Biến dạng của vật rắn. Áp suất chất lỏng', 127)]),
    (11, 'SGK VL 11.pdf', 2, True, [('Dao động', 5), ('Sóng', 31), ('Điện trường', 60), ('Dòng điện. Mạch điện', 90)]),
    (12, 'sach-giao-khoa-vat-li-12-ket-noi-tri-thuc-voi-cuoc-song.pdf', 2, True, [('Vật lí nhiệt', 5), ('Khí lí tưởng', 33), ('Từ trường', 55), ('Vật lí hạt nhân', 90)]),
]


def render_page(args):
    source, destination, page_index = args
    with fitz.open(source) as doc:
        page = doc[page_index]
        scale = 1600 / page.rect.height
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)
        path = Path(destination) / f'{page_index + 1:03}.webp'
        buffer = io.BytesIO()
        image.save(buffer, 'WEBP', quality=80, method=5)
        data = buffer.getvalue()
        if len(data) < 1000 or data[:4] != b'RIFF':
            raise RuntimeError(f'Invalid rendered page: {path}')
        temporary = path.with_suffix('.tmp')
        temporary.write_bytes(data)
        temporary.replace(path)
        if page_index == 0:
            image.thumbnail((340, 480), Image.Resampling.LANCZOS)
            image.save(Path(destination) / 'cover.webp', 'WEBP', quality=85, method=5)
        return path.stat().st_size


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    records, provenance, jobs = [], [], []
    lesson_source = json.loads((root / 'sources' / 'textbook-lessons-v44.json').read_text())
    lessons_by_grade = {b['grade']: b for b in lesson_source['books']}
    for grade, name, offset, sample, chapters in BOOKS:
        source = Path(args.input) / name
        destination = root / 'dist' / 'books' / str(grade)
        destination.mkdir(parents=True, exist_ok=True)
        with fitz.open(source) as doc:
            count = len(doc)
            ratio = doc[0].rect.width / doc[0].rect.height
        records.append(dict(grade=grade, title=f'Vật lí {grade}', series='Kết nối tri thức với cuộc sống', pages=count, ratio=ratio, sample=sample, printedOffset=offset, chapters=[dict(title=t, page=p + offset, printedPage=p) for t, p in chapters]))
        record = records[-1]
        record['contentsPage'] = lessons_by_grade[grade]['contentsPage']
        record['lessons'] = [dict(**lesson, page=lesson['printedPage'] + offset) for lesson in lessons_by_grade[grade]['lessons']]
        provenance.append(dict(grade=grade, filename=name, sha256=hashlib.sha256(source.read_bytes()).hexdigest(), pages=count, sourceBytes=source.stat().st_size, sample=sample, rendering='Every supplied page retained in order, full page at 1600 px height; WebP quality 80. No OCR or removal of watermarks.'))
        jobs.extend((str(source), str(destination), n) for n in range(count))
    with ProcessPoolExecutor(max_workers=6) as pool:
        sizes = list(pool.map(render_page, jobs))
    (root / 'dist' / 'books' / 'catalog.json').write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    (root / 'sources' / 'textbooks-v40.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(books=len(records), pages=len(sizes), bytes=sum(sizes))))


if __name__ == '__main__':
    main()
