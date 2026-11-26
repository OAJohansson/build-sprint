# Chords in Make: final grading pass, 26 Nov 2026 (data-evals)

This is the last data-evals pass before the final review. I graded only and changed no product code.
Items 1–3 and 5 ran on a production build of ec050a9; item 4 (the lead) and item 6 (tests) were
re-run on 1f3f88a, the branch HEAD, which changed the lead (T212, T213) after ec050a9.

**Result.**
- **S-1 is fixed**, and H9 for chords passes 5/5.
- **H9 for the lead is partial:** the saved notes equal Mine's lead 4/4, but loading a saved lead back
  into Make snaps its notes to the 16th grid (LD-1).
- **H12 is partial:** 34 of 36 chord/key pairs fully right. Em in G minor gets the wrong numeral, and
  E in A♭ major is spelled with a G♯.
- **H4 (reported):** Mason 72.2 % found, 35.7 % wrong; Dubspinna 100 % found, 68.4 % wrong. The Lost
  lead is off at HEAD; at ec050a9 it was not.
- **H11 (0 bytes) and H10 (598/598 tests, golden hashes) pass.**

## Setup

- **Copy:** a detached worktree in my scratchpad, with its own `pnpm install`. It was first at
  ec050a9, then moved to 1f3f88a for the lead re-check and the tests.
- **Server:** production (`next build`, then `next start -p 3037`) with `SIXAM_MEMORY_STORE=1`, the
  empty Supabase env, `ACCESS_CODE=test-code`, and the AI keys empty (no paid calls; the Mentor
  answered offline). It reported `store: "memory"`.
- **Maps:** seeded with `sandbox-seed.mjs --base :3037`, plus the Dubspinna and Kolter maps from
  today's measured values.
- **Chrome:** my own (fresh profile, Deck auto-select). Pages opened with
  `?mode=make&make=melody&plant=1&quiet=1`; every loop was separated live.
- **Network:** a CDP logger on every page, iframe and worker.
- **Labels:** the blind lead labels for H4 are the fixture blocks in `2026-11-26-chords-spike.md`;
  the H12 truth is my own theory reading of each chord in its key.
- **C2:** numbers and names only, deleted after grading.

## Results

| Eval | Bar | Measured | Result |
| --- | --- | --- | --- |
| **S-1** (T211) | no two events of a cell within a 16th; saved = played | Lost 69–76: **28** events on this separation copy (not 30; the count follows the copy), **0** pairs within a 16th. Saved, then unpacked round the loop: **112/112 notes equal `played`** (step, pitch, offset to 0.01). Dubspinna 57–64: 49 events, 0 pairs, 163/163 equal | **Fixed** |
| **H9 chords**, the 5-save set | 5 of 5, rendering identical | Lost a2 and b, Dubspinna a, Kolter a and b. Each has a chord pick and a note edit, plus a moved hit or the "short" timing preset; 2 are on the Pad preset. **Saved, unpacked = Mine's played: 5/5** (113, 120, 159, 24 and 33 notes; was 3/5). **After reload, re-separation and menu load: 5/5** edits back (names, notes, edited times, checked by place). The stored pattern is identical 5/5 | **Pass** |
| **H9 lead** | 5 of 5 (3 runs asked) | Mason 17–24: a note placed on bars 1, 2, 3 (ec050a9) and 6 (HEAD), then the lead saved. **Saved notes = Mine's lead: 4/4** (30, 31, 32 and 34 notes, offsets included). The stored pattern is identical after reload 4/4. **Loaded back into Make: steps and pitches 4/4, but every note's sub-16th offset is set to 0** (21–28 of 30–34 notes move by up to half a 16th), and all 8 bars become "edited" (LD-1) | **Partial** |
| **H12** theory facts | right on 20 chord/key pairs incl. borrowed | **36 distinct pairs** (60 reads of `chordFacts()`): Lost in G major, Dubspinna in A♭ major, Mason in G minor, 13 read bars plus 23 picks. **`numeral`, `inKey`, `borrowed`, `role` right on 35/36**: Em in G minor reads **♭vii** (it is the raised 6th, vi, borrowed from G major; `inKey`, `borrowed` and `role` are right). **Spelling right on 35/36**: E in A♭ major is ♭VI but spelled **E G♯ B** (by its own ♭ rule it would be F♭ A♭ C♭). `[theory]` lines in `labFacts`: 60/60. **Offline answers 60/60 plain**: no numerals, no "borrowed", "stepping stone" or "tonic", B♭ not A♯ (the only ♯ is Gmaj7's F♯, which is right). Why it fits in the UI (offline): "Gm is a minor chord, darker and softer. It's home in this key…", labelled "Six AM's own answer (the Mentor is offline)" | **Partial** (34/36 fully right) |
| **H4** lead read (reported) | target ≥ 70 % found, ≤ 20 % wrong | Basic Pitch at HEAD, best shift within ±40 ms. **Mason 17–24: 72.2 % found (13/18), 35.7 % wrong (10/28)**, shift −36 ms (spike: 66.7 / 33.3 %). **Dubspinna 105–112: 100 % found (16/16, any octave), 68.4 % wrong (39/57)** (spike: 93.8 / 74.6 %). Wrong-note target missed on both | Reported |
| Lost 69–76 lead off | off | **At HEAD (1f3f88a): off**, "Too low for a lead: mostly under C3, where the chords and bass are, off in Mine" (31 notes read, all but a few G2). **At ec050a9: on** (30 notes, 25 of them G2). Mason's riff stays on | **Pass at HEAD** |
| **H11** zero bytes of the original | 0 | Make (chords and Lead row), Why it fits offline, and the Studio (opened, played, sounds listed): **4,811 requests** over two logs, 276 with a body, none binary, no WebSocket frames. Bodies went only to `POST /api/sounds` (≤ 10 KB, longest numeric array 6), `PUT /api/maps` (≤ 13.5 KB; 235 = per-bar map levels), `POST /api/mentor` (2 × ≤ 1.7 KB, text), `PUT /api/tracks` (2 × ≤ 0.7 KB) and SoundCloud's widget telemetry. **Storage:** the access code only; the model cache; IndexedDB and OPFS empty | **Pass** (0) |
| **H10** nothing else broke | golden hashes and tests | **598/598 tests** (61 files) at HEAD, 593/593 at ec050a9, including `bass-golden` and the drums' sample-for-sample test. The poly, FX and drum synth sources are unchanged since the Phase 6 base 55e3e9e | **Pass** |

Read times along the way: the chords are ready 0.6–1.0 s after the loop is in memory, and the lead
read takes 1.1–1.4 s (Basic Pitch).

## Failures

- **LD-1. Loading a saved lead into Make drops its timing.**
  - The saved lead keeps each note's offset (for example 16: G4 +0.10 of a 16th).
  - Loading it from the Lead row's menu puts every note on the 16th (offset 0) and marks all 8 bars
    edited. Make then plays a quantised copy of what was saved.
  - The Studio is unaffected: it plays the stored pattern, which is identical.
  - Repro: Mason 17–24, Lead row, place a note, save the lead, reload, re-loop, load it from the
    menu. Compare `makeLead().notes[].off` before and after.
- **LD-2 (observation). The lead's on/off verdict varies between separations.** Mason's lead read
  "on" on its first read on each of the 2 pages, and "off" right after reload on 4/4 reloads, before
  the saved sound was loaded.
- **TH-1. Em in G minor: numeral ♭vii, should be vi.**
  - `numeralOf` tries a flattened step (iv + 1) before a raised one, so the raised 6th of a minor key
    reads as a ♭7th.
  - The Mentor gets this numeral; the offline answer has none.
- **TH-2. E in A♭ major is ♭VI but spelled E G♯ B.** The flat table has no F♭, so a ♭VI on F♭ falls
  back to sharps. It's rare (a tritone-away borrowed chord), but it is the one sharp in a flat key.

## What wasn't checked

- By ear.
- Dragging the saved sounds onto Studio lanes (the Studio was opened and played).
- The Mentor online (keys empty by design).
- H9 lead beyond Mason.

Cost: $0. Time: two builds of about 1.5 min each; loops filled in about 20 s each.

## Re-check after LD/TH fixes (61974fd, d4dfe6b)

Same method: a detached copy at d4dfe6b, a production build on :3037, sandbox only
(`SIXAM_MEMORY_STORE=1`, keys empty), live separation, my own Chrome.

| Check | Expected | Measured | Result |
| --- | --- | --- | --- |
| **LD-1** loaded lead keeps its timing (Mason 17–24, 2 runs) | `notes[].off` = saved; loaded bars `edited: false`, `loaded: true` | I placed a note on bar 8 (run 1) and bar 1 (run 2), saved, reloaded, refilled and loaded from the menu. **Loaded notes = saved pattern: 33/33 and 30/30** (step, pitch, offset to 0.01). The same notes as Mine's lead before the save, 2/2. All 8 bars `edited: false, loaded: true`; the lead is on after loading | **Fixed** |
| **LD-2** Mason lead stays on over 4 reloads | on 4/4 | **On 4/4** (28, 28, 28 and 31 notes). Guards each time: `topLine false, phase5 false, chordTone false (share 0), low false, medianMidi 67` | **Fixed** |
| Lost 69–76 lead | off | **Off**: "Too low for a lead…". Guards: `topLine false, phase5 false, chordTone false (share 0.09), low true, medianMidi 43`, 33 notes | Pass |
| **TH-1** Em in G minor | vi, borrowed | `chordFacts()` on Mason: **vi**, borrowed from G major, role borrowed, E G B, outside E and B | **Fixed** |
| **TH-2** ♭VI in A♭ | F♭ A♭ C♭ | Only when the key is spelled "Ab": `chordFacts({ key: "Ab", … "Fb" })` gives **F♭: F♭ A♭ C♭**. On the real Dubspinna map, whose key is stored as **"G#"** (as Listen-and-map writes it), the in-app `chordFacts()` still gives **E: E G♯ B** for both "E" and "Fb" | **Not fixed in the app** |
| **TH-3 (new regression)** sharps for a "G#" key | B♭ not A♯ | On the Dubspinna map (key "G#", shown as "A♭ major"), every chord is now spelled with sharps:<br>- B♭m → **A♯m (A♯ C♯ E♯)**<br>- D♭ → **C♯ (C♯ E♯ G♯)**<br>- D♭maj7 → **C♯maj7 … B♯**<br>- E♭m → **D♯m**<br>- G♭ → **F♯**<br>The offline answers say "A♯m is a minor chord…" and "C♯ with an added B♯". At ec050a9 the same map gave B♭m, D♭, E♭ and G♭. Lost (G) and Mason (G minor) are unaffected | **Fail** |
| **H10** test suite | green | **602/602** (61 files), including `bass-golden` | Pass |

**TH-3 repro:** Dubspinna 57–64 in Melody, open any bar, then `__sixamLab.chordFacts()`. Facts and
`offline` are spelled in sharps under "A♭ major". The fix most likely spells by the key's written
name ("G#") instead of its usual name (A♭). The key name is already normalised for the label but
not for the spelling.

Cost $0. The copy was removed and the server stopped.
