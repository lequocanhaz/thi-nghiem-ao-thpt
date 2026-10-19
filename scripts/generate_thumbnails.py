#!/usr/bin/env python3
"""Render honest static physics thumbnails from the Quanh Lab simulation engine.

Examples:
  python scripts/generate_thumbnails.py --sample
  python scripts/generate_thumbnails.py --all
  python scripts/generate_thumbnails.py --start 10 --count 10
  python scripts/generate_thumbnails.py --ids electric,ohm,capacitor
Requires: pip install playwright Pillow; local Chrome or Chromium.
"""
import argparse
import base64
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import os
from pathlib import Path
import shutil
import sys
import threading
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
OUT = DIST / "images" / "thumbnails"
DEMO = ["electric", "ohm", "capacitor", "oscillation", "wave",
        "interference", "prism", "pendulum", "energy", "boyle"]

def chrome_path():
    for candidate in [os.environ.get("CHROME_PATH"), "google-chrome-stable",
                      "google-chrome", "chromium", "chromium-browser", "chrome"]:
        if candidate and (shutil.which(candidate) or Path(candidate).exists()):
            return shutil.which(candidate) or candidate
    for candidate in [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                      r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"]:
        if Path(candidate).exists():
            return candidate
    raise RuntimeError("Chrome/Chromium not found. Set CHROME_PATH.")

def validate_and_save(image_uri, output):
    if not isinstance(image_uri, str) or not image_uri.startswith("data:image/png;base64,"):
        raise ValueError("Invalid PNG data URI")
    data = base64.b64decode(image_uri.split(",", 1)[1], validate=True)
    with Image.open(io.BytesIO(data)) as source:
        if source.size != (960, 600):
            raise ValueError(f"Unexpected resolution: {source.size}")
        rgb = source.convert("RGB")
        small = rgb.resize((80, 50))
        occupied = sum(1 for r, g, b in small.getdata() if min(r, g, b) < 235)
        variance = sum(ImageStat.Stat(small).stddev) / 3
        if occupied < 35 or variance < 5:
            raise ValueError(f"Blank/low-information image ({occupied} pixels; contrast {variance:.1f})")
        output.parent.mkdir(parents=True, exist_ok=True)
        rgb.save(output, "WEBP", quality=86, method=5)
        return {"nonWhitePixels": occupied, "contrast": round(variance, 1),
                "bytes": output.stat().st_size}

def main():
    p = argparse.ArgumentParser()
    selection = p.add_mutually_exclusive_group()
    selection.add_argument("--sample", action="store_true", help="Ten reviewed representative experiments (default)")
    selection.add_argument("--all", action="store_true", help="Every experiment, in existing catalog order")
    selection.add_argument("--ids", help="Comma-separated experiment IDs")
    selection.add_argument("--start", type=int, help="0-indexed catalog offset")
    p.add_argument("--count", type=int, default=10, help="Batch size for --start, ignored for --all")
    p.add_argument("--force", action="store_true", help="Re-render existing files")
    p.add_argument("--software", action="store_true", help="Use 2D software renderer only")
    args = p.parse_args()

    class SilentHandler(SimpleHTTPRequestHandler):
        def log_message(self, format, *params):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SilentHandler, directory=str(DIST)))
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    manifest_file = OUT / "manifest.json"
    old = json.loads(manifest_file.read_text(encoding="utf-8")) if manifest_file.exists() else {}
    records = dict(old.get("images", {}))

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True, executable_path=chrome_path(),
                args=["--no-sandbox", "--disable-dev-shm-usage",
                      "--enable-webgl", "--enable-unsafe-swiftshader",
                      "--use-gl=angle", "--use-angle=swiftshader"])
            context = browser.new_context(viewport={"width": 960, "height": 600},
                                          device_scale_factor=1, reduced_motion="reduce")
            page = context.new_page()
            page.on("pageerror", lambda e: print("PAGE ERROR:", str(e)[:300], file=sys.stderr))
            page.goto(f"http://127.0.0.1:{server.server_address[1]}/thumbnail-export.html",
                      wait_until="domcontentloaded", timeout=30000)
            page.wait_for_function("window.THUMBNAIL_EXPORT_READY === true", timeout=90000)
            catalog = page.evaluate("window.listLabExperiments()")
            if len(catalog) != 300:
                raise ValueError(f"Expected 300 experiments; found {len(catalog)}.")
            by_id = {exp["id"]: exp for exp in catalog}
            if args.all:
                selected = catalog
            elif args.ids:
                ids = [part.strip() for part in args.ids.split(",") if part.strip()]
                missing = [id for id in ids if id not in by_id]
                if missing:
                    raise ValueError(f"Unknown IDs: {missing}")
                selected = [by_id[id] for id in ids]
            elif args.start is not None:
                selected = catalog[args.start:args.start + args.count]
            else:
                selected = [by_id[id] for id in DEMO if id in by_id]
                if len(selected) != len(DEMO):
                    raise ValueError("Representative ID missing from catalog.")

            print(f"Quanh Lab catalog: {len(catalog)} experiments; selected {len(selected)}.", flush=True)
            failed = []
            for i, exp in enumerate(selected, 1):
                id = exp["id"]
                path = OUT / f"{id}.webp"
                if path.exists() and not args.force:
                    print(f"[{i}/{len(selected)}] SKIP {id}: already exists", flush=True)
                    continue
                for method in (["software"] if args.software else ["webgl", "software"]):
                    try:
                        result = page.evaluate(
                            "async (arg) => await window.renderLabThumbnail(arg.id,arg.method)",
                            {"id": id, "method": method})
                        quality = validate_and_save(result["image"], path)
                        records[id] = {"id": id, "title": exp["title"], "grade": exp["grade"],
                                       "topic": exp["topic"], "path": f"images/thumbnails/{id}.webp",
                                       "renderer": result["renderer"], **quality}
                        print(f"[{i}/{len(selected)}] OK {id} [{result['renderer']}] "
                              f"{quality['bytes']//1024} KB", flush=True)
                        break
                    except Exception as exc:
                        print(f"[{i}/{len(selected)}] {id} {method} failed: {exc}", file=sys.stderr, flush=True)
                else:
                    failed.append(id)
            OUT.mkdir(parents=True, exist_ok=True)
            manifest = {"version": 1, "source": "Quanh Lab model renderer",
                        "dimensions": [960, 600], "catalogCount": len(catalog),
                        "images": records, "failed": failed}
            manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            browser.close()
            print(f"Complete: {len(records)} saved images, {len(failed)} failures.", flush=True)
            if failed:
                sys.exit(1)
    finally:
        server.shutdown()
        server.server_close()

if __name__ == "__main__":
    main()
