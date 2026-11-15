#!/usr/bin/env bash
set -euo pipefail

# Automated Godot 4.x Web Export + itch.io ZIP builder for Linux/macOS
DIR="$(cd "$(dirname "$0")" && pwd)"
GODOT_BIN="${GODOT_BIN:-$(command -v godot4 || command -v godot || true)}"

if [[ -z "$GODOT_BIN" ]]; then
  echo "[ERROR] Godot 4 binary not found in PATH. Set GODOT_BIN=/path/to/godot4 and re-run."
  exit 1
fi

mkdir -p "$DIR/builds/web"
echo "Exporting Web preset using $GODOT_BIN..."
"$GODOT_BIN" --headless --path "$DIR" --export-release "Web" "$DIR/builds/web/index.html"

rm -f "$DIR/BOUNCEBACK-ITCH-IO.zip"
(cd "$DIR/builds/web" && zip -9 -r "$DIR/BOUNCEBACK-ITCH-IO.zip" .)

echo "Done! Generated $DIR/BOUNCEBACK-ITCH-IO.zip with index.html at root."
