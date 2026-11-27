# Phase 7 design round 2: critic report (27 Nov)

One `design-critic`, screenshots only, fixed five-point scorecard (clutter, hierarchy, legibility, feel, copy).

| Direction | Score | Reads as | Biggest gap |
| --- | --- | --- | --- |
| 02 Shelf | 6/10 (1·1·1·2·1) | a drum machine with a drawer of sounds; then a wall of section cards | Rebuild is cards in cards, not bar for bar (no bar axis, no playhead, lane names repeated) |
| 04 Side list | 6/10 (1·1·1·1·2) | a drum grid squeezed beside a reading list; then a proper arrangement grid | The permanent list shrinks the 64 steps to ~10 px, too small to tap |
| 10 Table | 5/10 (0·1·1·1·2) | a spreadsheet of drum sounds; then a form for one section | Densest screen; the rebuild gives up the song's shape |

**Critic's build:** Shelf for moments 1–2 (with Side list's highlighted row, the current sound under each row name, and its "the loop sounds thinner than the original" sentence); Side list's grid for the rebuild (header part-lists and "+" signs removed, Table's "has kick / none here" wording).

**Shared fixes:** the Deck-closed sentence must not push the controls; Original should look unavailable when the Deck is closed; "Make heard / can't hear" reads as jargon ("Six AM can't hear…"); the rebuild screens leave 40–50 % empty with 11–12 px type.

**PM note:** the critic flagged the closeness score, the name field and the looping chip as "not asked for"; they are the live Make room's (Phase 5–6) and stay. "Sound credits" stays (L272).

Full per-direction gaps are in the session transcript; the numbered gaps above are the ones the next round fixes.

## Round 3 (final hybrid, 285e28e): 8/10

Scorecard: clutter 1 · hierarchy 2 · legibility 1 · feel 2 · copy 2. Closed: every round-2 gap except the per-lane "M" and the playhead over labels. Open (sent to the designer as round 3b): narrow sections in the worst case, four kinds of empty with no key ("none here" boxes, "has vocals" lost "not yet"), single-letter M / S, cramped row sub-labels at 1280, the broken playhead line, and the Deck strip pushing the grid down.

## Round 3b (16e2c44): 9/10

Scorecard: clutter 2 · hierarchy 2 · legibility 1 · feel 2 · copy 2. All round-3 gaps closed or mostly closed. Left for the build (critic: no further design round): the worst-case rebuild grid runs under the right panel with no scroll cue; "Breakdow…" and bare "2" / "0" counts on narrow sections; the Ride "Your turn" line crowds the shelf at 1280; blank cells' hover / focus outline to check in the build; the reserved strip is an empty band when it has nothing to say.

## Built shelf, slice 1 fix round (51764e2): 5/10

The wrapped chip lines fit all 20 sounds but lost the grouping (families start mid-line, label and names blur, repeated feel words, "closer" twice, dense at 1280). Critic's fix: a fixed family label column with sounds to its right, families in two columns; 8 px before the first chip; hide repeated feel words; ≥ 22 px pitch and ≥ 11 px labels at 1280; "closer" once. Sent to the engineer.

## Built shelf after the critic's fix (c7e4ef5): 9/10

Clutter 2 · hierarchy 2 · legibility 2 · feel 2 · copy 1. Left (small, folded into slice 2): the "closer" hint named different sounds on two loads; patchy feel words at 1440 (use the 1280 treatment); balance columns by sound count; brighter family labels; bass knobs and Mentor line clear of the bottom bar at 1280.

## Built slice 2 (0a63c04): 6/10

Clutter 1 · hierarchy 2 · legibility 1 · feel 1 · copy 1. Gaps: steps ~7 px (1440) / ~5 px (1280) on 8-bar loops — show 4 bars at a time while fixing (the approved ~17 px); the sound strip cut by the sticky A/B row (one bottom bar as designed); section label contradicts the loop chip ("in Drop 2" vs "Looping Build, bars 76–83"); "— / 100" closeness on ear rows; empty-row note wraps; save bar says the same thing three times; done state wording.

## Built slice 2 after fixes (0d5a9d5): 8/10

Clutter 1 · hierarchy 2 · legibility 2 · feel 2 · copy 1. Left: page buttons "76 80" need to read as pages; the three-row empty sentence is cut; rail back with the shelf open (steps 12 / 9 px); header repeats the bars; "Copy bar" line shifts rows; disabled Save gives no reason; Bass at 1280 keeps the tag line and hides knob values.

## Built slice 3 (0c2f2ff): 9/10

Clutter 2 · hierarchy 2 · legibility 2 · feel 2 · copy 1. Left (copy, no design round): one count phrase everywhere ("0 to fill" vs "all filled" over a left-empty slot); say "chords and pads fit here" where pads are offered; "Build one in Make → Melody" as a link; bar ranges on every column that fits them; the "Rebuild this song" entry link easy to miss (next to Listen / Make or outlined button); worst case loses proportions (acceptable).
