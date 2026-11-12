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

## M-S2 Get my kick close to the original: struggle
- Kick: preset menu clear (4 presets with two-word tags, 09). Round 808 → closeness 81 → 47 and the Mentor says "Decay down, Tune up to A#1" (10). Score reacts to the kick: Tune off-tick 81→70; Decay drag 47→52.
- But the word under a knob often doesn't change when it moves (Decay "1/2" before and after; tick also reads "1/2" while the Mentor says "Decay down"), so I can't see I moved toward the tick (12).
- Clap and hats barely move the one score: clap knobs on the ticks 74, clap knobs at the opposite ends 73; hats tone + length toward ticks 79→80→80 (16, 17, 18). Following the Mentor's clap hint changes nothing I can see.
- Clap on ticks: Mentor flips to "You're on the gold ticks" (good, clear).
- A/B: A/B toggle and "Bass under both" work; the parts are silenced (`quiet=1`), so judged by eye only.
- Name: kick name stays "Deep kick" after switching to Round 808 (10); hats name follows the Length knob ("Closed hats") but its tags still say "open · 909" (19).
- 1440 × 741: A/B 625–664, save bar at 677: all visible (19). R2 fixed.
Shots: 09–19.

## M-S3 Keep the drums I like and use them: pass (one dead drop)
- Save per row: 3 saves + 2 row picks; each row shows "✓ saved" and the bar says "Saved as …" (20–22). API: 3 sounds, part drums, presets kick-deep-909 / clap-wide / hats-open-909.
- Auto names mislead: "Tight kick" while the preset is Deep 909 (and "Tight" is another preset); "Roomy clap" from a Room knob left high.
- Studio (1 tap): My sounds shows the 3 under "Lost in the Loop (O Deibys)" with Kick / Claps & snares / Hats (23).
- Kick dragged onto Drums lane lands at bar 33 and opens its drawer with its knobs and "plays at the track's tempo" (25). Need "← My sounds" to get the list back (extra tap each time).
- Clap dropped on the Drums lane: nothing happens, no message (27). While dragging, the lanes dim and a dashed "Drop here for a new Claps & snares lane" appears below the last lane (26). Dropped there: new lane, block at bar 25 (31). Hats the same (32).
- Reload: Drums / Claps & snares / Hats lanes and all 3 blocks still there (33). Lane label truncated "Claps & sn…".
- Studio is 124 BPM, sounds saved at 123: drawer says they play at the track's tempo (fine).
Shots: 20–33.

## M-S4 A breakdown with almost no drums: struggle
- Mason Flint remix, Breakdown (bars 57–64, 8 bars): 4 taps (Breakdown, Make, Drums, Play); ready 26.2 s after Play (34, 35).
- Kick row reads "Kick off" with dotted faint marks and a "Play anyway" link; bar says "This row is off in Mine". Clap and hats stay on (35).
- The why ("60 faint marks, probably the bass bleeding through: off in Mine") is only a hover tooltip on "Play anyway"; nothing on screen says why.
- The Mentor still coaches the off kick: "Tune up to F#2, Decay down to 1/8" (35), which contradicts "off".
- Play anyway: kick turns on, marks go solid, closeness 48 → 55 (37). No way back: the "off" state and any "turn off" control are gone.
- Header wraps for the long title (loop pill under Play); fine at 1440.
- Contrast: lowest measured text 3.71 (send arrow), small labels 5.56+; pre-ready knob values ~2.2:1 (dimmed on purpose), "off" 6.4, "Play anyway" 6.4.
Shots: 34–37.
