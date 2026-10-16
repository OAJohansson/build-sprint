#!/usr/bin/env bash
# Prints N random 32-character seed strings (default 3), one per line.
# Used by the design-session skill's Discover step: a model can't be random on request, so a real random
# input is what pushes each direction away from its defaults.
n="${1:-3}"
for _ in $(seq "$n"); do
  LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32
  echo
done
