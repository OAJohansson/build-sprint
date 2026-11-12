# User test notes (in progress): Six AM Make drums, 2026-11-12

Working notes, saved after each scenario so a network drop loses nothing. The final report replaces this file.

Setup: sandbox dev server :3017 (ACCESS_CODE=test-code, in-memory), own Chrome profile over CDP with Deck auto-select, `?quiet=1` (parts silenced on the Mac; the Deck still plays aloud for capture). Maps PUT for Lost in the Loop (123.02 BPM, origin 1.407 s, G major) and Mason Flint remix (126.05, 0.11 s, G minor); section bounds are approximations. 1440 × 900.

## M-S1 Make my own drums from a loop I love: pass (with a long wait)
- Taps: Drop 1 section (1) → Make (2) → Drums (3) → Play (4). Ready 41.6 s after Play (16-bar default loop: tapping a section loops "first 16 bars").
- Countdown honest (body said 37 s at 2 s, ready at ~40 s), but two countdowns disagree: header "filling the loop… 6 s" while the body says "36 s"; the header one ends at 10 s while the body still counts (05-wait-3s).
- Play button jumps sideways as the header text changes (x 950 Listen → 584 Make → 434 while filling → 591 ready).
- Rows: kick 51, clap 28, hats 74 hits, gold marks; bars 17–19 empty kick (probably the track). Picking a row: preset, knobs, mentor line and Save label change; nothing moves (all y identical, 07, 08).
- "Suggested" pill is greyed and disabled after ticks auto-placed; looks like a button that does nothing.
Shots: 01–08.
