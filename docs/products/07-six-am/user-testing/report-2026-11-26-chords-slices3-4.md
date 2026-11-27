# User test: Six AM, Phase 6 slice 2 re-check, slices 3 and 4, 2026-11-26

**Persona:** the owner, Phase 6 update · **Method:** simulated (agent), own Chrome over CDP · **Build:** 34ea170, sandbox from a temporary app copy · Saved by the PM; shots in `shots-2026-11-26-chords-s3s4/`.

## Scores (H13 bar ≥ 4)
| Job | Score | Why |
| --- | --- | --- |
| Edit a note | 4 | Group Reset and "your notes (≈ G)" remove the traps |
| Move a chord | 4 | Drag, push, reasons and the timing score work; arrows move one step only, hits 24 px |
| Why it fits | 2 | Fallback answer leads with numerals (I7, i7, V), "borrowed", chained colons; spells B♭ as A♯; marker says "isn't set up on the server" |
| Save and find it in the Studio | 3 | Saves, lands, persists (30/30 events match); but the drawer shows C7 / Cm7 for Make's G7 / Gm7 (moved to the track's key) |
| The lead | 3 | Fix in 2 taps, save exact; but selecting a note collapses the grid, cells 35 × 12 px, Lost's lead not off |

## Slice 2 re-check
S2-1, S2-2, S2-5, S2-6, S2-7, S2-8 fixed · S2-3 partly (hits 24 px, slots 26 × 30) · S2-4 partly (arrows move one step, focus drops) · CS1-12 partly ("Fsus4" clipped to "Fsus" in 27 px half-bar tiles).

## Slice 3
"Why it fits" answers at once offline (1 tap). Example, bar 69: "G7 is the I7 of G major (its first chord): a stepping stone: the V (fifth chord) of C, so it pulls toward C, not home. F is outside the key…". Studio: My sounds → drag onto Chords lane (2 actions), 8-bar block; drawer lists C7 ×7, "C7 (your notes)", Cm7 with one line "saved in G major at 123 BPM; plays in the track's key and tempo"; a drawer change survived a reload.

## Slice 4 (Mason 17–24; the seed has no Dubspinna map)
Chords filled 21 s after Play, lead ready 2 s later (Basic Pitch read 1.2 s; the model load was likely cached). 30 notes, stray F6 notes on bars 22 and 24. Planted A4 at bar 19 fixed to G4 in 2 taps; lead closeness stayed 37. Shorter / Longer / Remove and "Notes outside the key" work. Save, reload, load: all 8 bars identical (1 run). Lost 69–76: lead not off (32 notes, no "Play anyway").

## New issues
| ID | Severity | What happened |
| --- | --- | --- |
| L-1 | major | Selecting a lead note renders Shorter / Longer / Remove as 132 px pills; the grid shrinks and the notes are hidden |
| L-2 | major | Lost 69–76 lead not off |
| L-3 | minor | Lead cells 35 × 12 px; repeated same-pitch notes merge visually |
| L-4 | minor | Lead closeness ignores note fixes |
| W-1 | major | "Why it fits" fallback full of theory words, chained colons, A♯ for B♭ |
| ST-1 | major | Studio drawer shows track-key names (C7) for Make's G7 |
| N-1 | polish | At 720 px the timing move buttons sit half under A/B |
| N-2 | polish | Mason loop label says "first 16 bars" for an 8-bar loop |
