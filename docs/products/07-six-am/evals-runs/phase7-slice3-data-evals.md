# Phase 7 slice 3, "Rebuild the song": data-evals, 27 Nov 2026

This run grades W9, W11 and W13, plus a W6 regression check after a19debe. The code is a8f4d39:
0c2f2ff plus docs, and the same app code as dad5c58. I graded only and changed no product code.

**Result.** W9, W11 and W13 pass, and so does the W6 regression check.

One finding is the PM's to weigh (D7-17). Since a19debe, Make stores only the owner's own taps.
So after a reload the steps the owner didn't edit follow the new reading, and the loop can differ
from what was heard and saved before.

## Setup

- **Server:** a detached copy of a8f4d39 in my scratchpad, as a dev server on :3027
  (`ACCESS_CODE=test-code`, in-memory store, empty Supabase and AI keys).
- **Seed:** `sandbox-seed.mjs --base http://localhost:3027`. It gives 3 maps with per-section
  layer curves (Mason, Lost, and the worst-case map with 10 sections) and 11 saved parts.
- **Browser:** my own Chrome over CDP at 1440 × 900, with a network logger on every page, popup and
  worker.
- **Hooks used:** `window.__sixamRebuild`, `__sixamEngine.devSchedule()`, and for W6 a
  "drums-render" capture (numbers only).
- **Cleanup:** the profile and the grading copy were deleted afterwards.
- **A caveat on the hints:** the seed's layer curves are sandbox values (about 0.85 where a section
  has a layer, about 0.1 where it doesn't), not measurements. So the hint check proves the rule is
  applied, not that hints are right on a real map.

## W9: rebuild layout (bar: section starts = the map's bars 100 %; 0 starter blocks; every section shows the original's parts)

| Map | Sections | Starts = map's bars | Contiguous, covers every bar | Blocks on open | Hints vs the Lab's drawing | Hints vs raw curve ≥ 0.6 |
| --- | --- | --- | --- | --- | --- | --- |
| Mason | 8/8 | 1, 17, 33, 41, 57, 65, 73, 97: **8/8** | yes, 108 bars | **0** | **40/40** | 40/40 |
| Lost | 6/6 | 1, 17, 41, 65, 77, 93: **6/6** | yes, 101 bars | **0** | **30/30** | 30/30 |
| Worst case | 10/10 | 1, 17, 25, 29, 61, 77, 81, 85, 113, 117: **10/10** | yes, 128 bars | **0** | **50/50** | 50/50 |

**Hints.**
- **How I checked:** per section × measured layer (kick, hats, bass, chords, vocals), I counted
  the bars the Lab draws solid (`clips` "likely") and compared "≥ 50 %" (L292) with the section's
  `has`. I also checked against the raw curve ≥ `LIKELY`.
- **Result:** 120/120 agree.
- **Lanes the map doesn't measure** (Claps, Percussion, Pads, Lead, FX) show no hint: 40/40,
  30/30 and 50/50 slots read "empty, add a part".
- **What each slot says** matches the model on all 240 slots: "has kick", "the original has no
  kick here; add a part", or "has vocals · not yet" (vocals aren't counted as to fill).

**Fill**, on Mason, picking a slot and then a saved part:

| Fill | Section | Block | Scheduled |
| --- | --- | --- | --- |
| 1-bar kick | Drop 1 (17–32) | 17 + 16 | 16 passes, steps 256–496 |
| 2-bar hats | Drop 1 | 17 + 16 | 8 passes |
| 4-bar bassline | Groove (33–40) | 33 + 8 | 2 passes, steps 512 and 576 |
| 1-bar shaker | Build (65–72) | | 8 passes |
| 8-bar chord stabs | Outro, 12 bars | 97 + 12 | one full pass at step 1536 (length 128) and **one cut pass at 1664 (length 64), ending at bar 109 = the section's end** |

No pass was scheduled outside its section; 36 entries in all.

**Leave empty:** leaving Drop 2 · Kick ("has kick") empty took the total to-fill count from 19 to
18 and Drop 2's from 4 to 3. The slot reads "Drop 2, Kick: left empty", and Undo is offered.

**Phase 3 template retired:** `lib/map/template.ts` and its test are deleted. No source file
references the template or the "Start a track from this" entry point. R8b's comments say the
rebuild link replaces it.

**Verdict: Pass.**

## W11: old tracks and sounds unchanged

- **Suite:** `pnpm -F 07-six-am test`, **643/643** (63 files). `bass-golden.test.ts` is unchanged.
- **Old sounds:** my 88 cross-version renders of old saved sounds (synth drums in the Studio and
  Make, melody, FX, Phase 4 basses) are **88/88 identical** to the Phase 6 base (0b30aae).
- **`parseDoc` on non-rebuild docs:**
  - **Method:** 2,000 seeded random docs, varying bars, bpm, key, markers, analysis id, catalogue
    and library sounds, and region lengths (whole passes and cut ones). Each was parsed by the
    Phase 6 base and by HEAD.
  - **Result:** **2,000/2,000 identical** (281 accepted, 1,719 rejected by both).
  - **Cut passes:** the new rule that lets a block end mid-pass only applies when `doc.rebuild` is
    present; on other docs a cut pass is still rejected.
- **Old 3-row drum sounds:** not re-checked in the browser this round. They last opened on Closed
  hat at 0d5a9d5, and a19debe has touched `make-drums.tsx` since; the suite's R9 test passes.
- **Verdict: Pass.**

## W13: zero bytes of the original stored or sent; the rebuild stores names, bars and layer names only

- **Rebuild doc** (the stored Mason rebuild, 6.9 KB):
  - `doc.rebuild` holds `mapId`, `sections[{name, start, bars, has: [layer names]}]` and `left`
    (slot keys).
  - Besides that the doc has the ordinary track fields: regions, lanes, markers, and the owner's
    own saved parts with preset, knobs and step pattern.
  - It has no numeric arrays.
- **Network:** 623 requests, 34 with a body, **0 binary**.
  - `PUT /api/tracks` ≤ 6.9 KB, with no numeric arrays.
  - `PUT /api/maps` ≤ 7.1 KB (longest array 101, per-bar levels).
  - `POST /api/sounds` ≤ 3.5 KB.
  - SoundCloud widget telemetry; WebSockets only Next's dev HMR.
- **Storage:**
  - localStorage holds the code, `07-six-am:last` (the open track id) and the drum edit keys.
    Those are now `{edits: {row: {added: [steps], removed: [steps]}}, left, mute}` (146–179 bytes).
  - IndexedDB and OPFS are empty; Cache Storage holds only the separation model.
- **Code read:** no new fetch or storage calls in slice 3.
- **Verdict: Pass (0).**

## W6 regression check after a19debe (the edit store holds the owner's taps)

- **Lost 77–84 and Lost 21–28:** the same edits as before (kick −1/+1, clap +1/−1, hat +1/−1,
  perc +4), mute Closed hat and solo Claps.
  - **Saved = played on 8/8 rows** (same steps, offsets ≤ 0.6 ms).
  - **Rows saved while muted or soloed out kept every hit** (4/4).
  - **0 `PATCH`, 8 `POST`**: each loop gets its own sounds.
- **After a reload**, with a new Deck capture and a re-read: **the owner's taps are honoured
  10/10 on both loops.** Every added step is there and every removed step is gone.
- **Old-shape edit still loads:**
  - I wrote a v1 `played` entry by hand for Lost 29–36 (kick +3, first clap removed, perc
    2·6·10·14, `mute: ["hat"]`).
  - After a reload, **all 4 rows equal the stored steps.** Closed hat reads muted and Mine renders
    it off.
  - The entry was rewritten in the new `edits` shape (kick added [3], clap removed [0], perc added).
- **Verdict: Pass.**

**D7-17 (PM's call, from a19debe / U7-19).** After the reload, rows the owner didn't edit follow
the new reading:
- Lost 77–84: kick 27 → 30 hits, Closed hat 60 → 62.
- Lost 21–28: Closed hat 37 → 36.

The separation isn't deterministic between captures (D7-16). So a loop can play hits after a
reload that weren't in the version the owner heard and saved. In the slice 2 fix round, with the
`played` shape, all 6 rows came back identical.

This is the trade-off a19debe chose: a hit a re-read newly hears shows as heard. Each save still
stores exactly what plays at that moment. If the owner expects "my loop comes back as I left it",
keep the played steps alongside the taps.

## Findings

| # | Eval | Finding |
| --- | --- | --- |
| D7-17 | W6 | After a reload, unedited steps follow the new reading (Lost 77–84: kick 27 → 30, hat 60 → 62), so the loop can differ from the one heard and saved. The owner's taps are kept 10/10. This is the design choice in a19debe; the PM decides whether "comes back as I left it" matters more |
| D7-18 | W9 | Hints are verified only on the seed's idealised curves (sandbox values). A real map's "maybe" bars next to "likely" ones are drawn solid by `clips` and so count toward "has". Worth a look on a real map at the final review |
| – | W9 | Two Fill cases weren't checked: a map whose first section starts after bar 1 (a shortcut in `rebuildSections`), and a song over 512 bars. Neither is in the seed |

## Not checked

- The rebuild with real (non-seed) map curves.
- Playing the cut final pass by ear: only the schedule was checked.
- Old 3-row drum sounds in the browser at this commit.
- Compare/Deck (slice 4).

## Cost and time

- No paid API calls.
- Browser session about 35 min.
- Unit suite 30 s; cross-version hashing and parseDoc fuzz under 10 s each.
