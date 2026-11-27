#!/bin/bash
# Screenshots every direction (1440x900), the checks, then the contact sheet. Usage: ./shoot.sh [slug-prefix]
cd "$(dirname "$0")/.." || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot(){ "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=$2,$3 --virtual-time-budget=8000 --screenshot="${1%.html}.png" "file://$PWD/$1" >/dev/null 2>&1; echo "shot ${1%.html}.png"; }
for f in [0-9]*.html _src/checks/*.html; do b=$(basename "$f"); [ -z "$1" ] || [[ "$b" == $1* ]] && shot "$f" 1440 900; done
shot contact-sheet.html 1760 3160
