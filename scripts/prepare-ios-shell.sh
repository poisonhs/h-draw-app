#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SHELL_DIR="$ROOT/ios-shell"
RESOURCE_DIR="$ROOT/unpackage/dist/build/app-plus"

test -d "$SHELL_DIR" || { echo "ios-shell is missing; set IOS_SHELL_URL in the repository Variables" >&2; exit 1; }
test -d "$RESOURCE_DIR" || { echo "unpackage/dist/build/app-plus is missing; export a release app-plus build from HBuilderX first" >&2; exit 1; }

APP_ID="$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["appid"])' "$ROOT/manifest.json")"
TARGET="$(find "$SHELL_DIR" -path '*/__MACOSX/*' -prune -o -type d -path '*/Pandora/apps/*/www' -print -quit)"
if [ -z "$TARGET" ]; then
  echo "Could not find Pandora/apps/<name>/www in the iOS shell" >&2
  exit 1
fi

rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -R "$RESOURCE_DIR"/. "$TARGET"/

# Disable the runtime splash and keep the app label consistent in the bundled manifest.
python3 - "$TARGET/manifest.json" <<'PY'
import json
import sys

path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
splash = data.setdefault("plus", {}).setdefault("splashscreen", {})
splash.update({"alwaysShowBeforeRender": False, "waiting": False, "autoclose": True, "delay": 0})
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
PY

echo "Prepared $APP_ID resources at $TARGET"
