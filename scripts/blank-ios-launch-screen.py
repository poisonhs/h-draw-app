#!/usr/bin/env python3
import re
import sys
from pathlib import Path


project_dir = Path(sys.argv[1]).resolve()
files = list(project_dir.rglob("LaunchScreen*.storyboard"))
if not files:
    raise SystemExit("No LaunchScreen storyboard was found")

for path in files:
    text = path.read_text(encoding="utf-8")
    text = re.sub(
        r'(<imageView\b[^>]*)(>)',
        lambda m: m.group(1) + ('' if "hidden=" in m.group(1) else ' hidden="YES"') + m.group(2),
        text,
    )
    text = re.sub(r'hidden="YES" text="H-DRAW"', 'text="H-DRAW"', text)
    text = re.sub(r'text="(?:HBuilder Hello|HBuilder 你好)"', 'text="H-DRAW"', text)
    text = text.replace('pointSize="20"', 'pointSize="36"').replace('pointSize="25"', 'pointSize="36"')
    path.write_text(text, encoding="utf-8")
    print(f"Blanked {path}")
