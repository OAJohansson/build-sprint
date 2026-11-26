#!/bin/bash
# Screenshots: three states per direction, plus the break-ui worst case into _src/checks. Usage: ./shoot.sh [prefix]
cd "$(dirname "$0")/.." || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot(){ "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,900 --virtual-time-budget=8000 --screenshot="$2" "file://$PWD/$1" >/dev/null 2>&1; echo "shot $2"; }
for f in P*.html; do b=${f%.html}; [ -z "$1" ] || [[ "$b" == $1* ]] || continue
  for s in 1 2 3; do shot "$f?state=$s" "$b-s$s.png"; done
  shot "$f?state=2&data=worst" "_src/checks/$b-worst-s2.png"
  shot "$f?state=3&idea=3&data=worst" "_src/checks/$b-worst-s3.png"
  shot "$f?state=3&idea=1&data=worst" "_src/checks/$b-worst-s3-idea1.png"
done
