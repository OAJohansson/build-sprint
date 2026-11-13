#!/bin/bash
# check.sh <file.html>  prints thread/label collisions, label overlaps, off-screen labels and clipped overflow.
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in "$@"; do echo "== $f"; "$CH" --headless=new --disable-gpu --window-size=1440,900 --virtual-time-budget=8000 --dump-dom "file://$(cd "$(dirname "$f")" && pwd)/$(basename "$f")#check" 2>/dev/null | sed -n '/CHECK/,/END/p' | sed 's/<[^>]*>//g'; done
