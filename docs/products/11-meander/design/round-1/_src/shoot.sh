#!/bin/bash
# Screenshot every direction (1440x1130: the 900 screen plus the brand strip) and the contact sheet.
cd "$(dirname "$0")/.." || exit 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in ${1:-[0-9][0-9]-*.html}; do
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1440,1130 --virtual-time-budget=6000 --screenshot="${f%.html}.png" "file://$PWD/$f" >/dev/null 2>&1
  echo "shot ${f%.html}.png"
done
if [ -z "$1" ]; then
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1840,1000 --virtual-time-budget=6000 --screenshot=contact-sheet.png "file://$PWD/contact-sheet.html" >/dev/null 2>&1
  echo "shot contact-sheet.png"
fi
