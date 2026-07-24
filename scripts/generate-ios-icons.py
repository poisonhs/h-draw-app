#!/usr/bin/env python3
import json
import subprocess
import sys
from pathlib import Path


source = Path(sys.argv[1]).resolve()
project_dir = Path(sys.argv[2]).resolve()
icon_sets = [p for p in project_dir.rglob("*.appiconset") if "__MACOSX" not in p.parts and "Pods" not in p.parts]
if not icon_sets:
    raise SystemExit("No iOS AppIcon asset set was found")

icon_set = icon_sets[0]
contents_path = icon_set / "Contents.json"
if contents_path.exists():
    contents = json.loads(contents_path.read_text(encoding="utf-8"))
else:
    contents = {
        "images": [
            {"idiom": "iphone", "size": "20x20", "scale": "2x"},
            {"idiom": "iphone", "size": "20x20", "scale": "3x"},
            {"idiom": "iphone", "size": "29x29", "scale": "2x"},
            {"idiom": "iphone", "size": "29x29", "scale": "3x"},
            {"idiom": "iphone", "size": "40x40", "scale": "2x"},
            {"idiom": "iphone", "size": "40x40", "scale": "3x"},
            {"idiom": "iphone", "size": "60x60", "scale": "2x"},
            {"idiom": "iphone", "size": "60x60", "scale": "3x"},
            {"idiom": "ipad", "size": "20x20", "scale": "1x"},
            {"idiom": "ipad", "size": "20x20", "scale": "2x"},
            {"idiom": "ipad", "size": "29x29", "scale": "1x"},
            {"idiom": "ipad", "size": "29x29", "scale": "2x"},
            {"idiom": "ipad", "size": "40x40", "scale": "1x"},
            {"idiom": "ipad", "size": "40x40", "scale": "2x"},
            {"idiom": "ipad", "size": "76x76", "scale": "1x"},
            {"idiom": "ipad", "size": "76x76", "scale": "2x"},
            {"idiom": "ipad", "size": "83.5x83.5", "scale": "2x"},
            {"idiom": "ios-marketing", "size": "1024x1024", "scale": "1x"},
        ],
        "info": {"author": "xcode", "version": 1},
    }

for old_icon in icon_set.glob("*.png"):
    old_icon.unlink()

for index, image in enumerate(contents.get("images", [])):
    size = image.get("size")
    scale = image.get("scale", "1x")
    if not size:
        continue
    points = float(size.split("x", 1)[0])
    multiplier = float(scale.rstrip("x"))
    pixels = round(points * multiplier)
    filename = f"h-draw-{index}-{pixels}.png"
    subprocess.run(
        ["sips", "-z", str(pixels), str(pixels), str(source), "--out", str(icon_set / filename)],
        check=True,
        stdout=subprocess.DEVNULL,
    )
    image["filename"] = filename

contents_path.write_text(json.dumps(contents, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Generated iOS icons in {icon_set} from {source.name}")
