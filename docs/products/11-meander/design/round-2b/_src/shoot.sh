#!/bin/bash
# shoot.sh [prefix]  screenshots screens (1440x900) and brand boards (1440x810); check.sh reports collisions.
cd "$(dirname "$0")/.." || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in ${1:-}*-field.html ${1:-}*-thinker.html; do [ -f "$f" ] && "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,900 --virtual-time-budget=8000 --screenshot="${f%.html}.png" "file://$PWD/$f" >/dev/null 2>&1 && echo "shot ${f%.html}.png"; done
for f in ${1:-}*-brand.html; do [ -f "$f" ] && "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,810 --virtual-time-budget=8000 --screenshot="${f%.html}.png" "file://$PWD/$f" >/dev/null 2>&1 && echo "shot ${f%.html}.png"; done
if [ -z "$1" ] && [ -f contact-sheet.html ]; then "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1680,1420 --virtual-time-budget=8000 --screenshot=contact-sheet.png "file://$PWD/contact-sheet.html" >/dev/null 2>&1; echo "shot contact-sheet.png"; fi
