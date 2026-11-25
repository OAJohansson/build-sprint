#!/bin/bash
cd "$(dirname "$0")/.." || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot(){ "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=${4:-1} --window-size=$2,$3 --virtual-time-budget=8000 --screenshot="${1%.html}.png" "file://$PWD/$1" >/dev/null 2>&1; echo "shot ${1%.html}.png"; }
for f in field-existentialism thinker-beauvoir copied theme-open your-thread field-stoicism first-visit worst-case; do [ -z "$1" ] || [ "$1" = "$f" ] && shot $f.html 1440 900; done
[ -z "$1" ] && [ -f brand.html ] && shot brand.html 1440 810
[ -z "$1" ] && [ -f phone.html ] && shot phone.html 390 844 2
[ -z "$1" ] && [ -f contact-sheet.html ] && shot contact-sheet.html 1680 1620
