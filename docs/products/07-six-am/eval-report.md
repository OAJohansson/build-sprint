# Eval report: Six AM, Ears v1 (Founder mode, 23–24 Oct)

The PM's report of what the graders found (decision 0026). The builders' own opinions are not in
it. Graders: `user-tester` (2 runs), `design-critic` (a fresh critic each round, screenshots only),
`data-evals` (on the owner's real runs). The owner-only checks are the owner's and not here.

**Preview:** https://six-2w5o1oc9a-mimirswell.vercel.app/analyse (behind Vercel login) · **Branch:**
`claude/07-six-am-ears-f5f6a6`

## Summary

| Area | Bar | Result |
| --- | --- | --- |
| Riskiest assumption: tab capture hears the embedded player | non-silent audio | **pass** (owner's Chrome: 87% audible, peak -10.5 dBFS) |
| Riskiest assumption: Discogs-EffNet gives sensible genres | ≥ 7/10 in the match set | **pass, exactly 7/10**; plain "House" tops 6/10 (5/10 without L19's House allowance) |
| BPM | ≥ 8/10 within ±2 or flagged | **5/5 on tracks with a public reference**; 4 unsourced, 1 proxy that would pass; 8/10 can't be shown |
| End to end on the 10 tracks | 10/10 without errors | **pass** |
| No audio stored or uploaded | 0 / 0 | **pass** (code read + storage and network in the user test) |
| Time | ≤ 10 s after listening, ≤ 2½ min per track | **pass** (≤ 4.9 s inferred; 123.5–124.9 s per track) except the first run ever: ~3:10 in the simulated test, because of the one-time 18 MB model download through the dev proxy |
| User test | every top job ≥ 4, no blocker or major open | **pass** (4, 4, 5; Studio guardrail 5) |
| Design | design-critic ≥ 9/10 | **fail: 7/10** (see below) |
| Build hygiene | lint, test, build | **pass** (82 tests); `checks` on the PR |

## Requirements

Run by: UT = user-tester, DE = data-evals, O = owner's real runs (Chrome 154).

| # | Result | Evidence |
| --- | --- | --- |
| F1 URL parsing | pass | unit tests (track, set, `?si=`, `utm_`, `?in=`, m./www., short links, junk); UT: junk and profile links show a message |
| F2 Widget API | pass | UT: load, play, seek, events drive the UI; O: queue runs |
| F3 Tab capture to memory | pass | O: Step 0 spike PASS; video track stopped at once |
| F4 16 kHz, mel, EffNet in a worker | pass, with a note | O: 10/10 analysed. The check's wording ("sums to a distribution") is wrong for a multi-label model; the % are per-style likelihoods (L36), now labelled so |
| F5 Style names | pass, with a gap | unit tests; no test walks all 400 classes (DE) |
| F6 BPM, key, energy, brightness | pass | O: all four on every track; DE: key agrees with public keys on 4/5 |
| F7 Audio discarded | pass | DE code read: no MediaRecorder; Blob only for the CSV/JSON export; all fetches are GETs; UT: storage 3 text keys + the model file, IndexedDB/OPFS empty, no Six AM uploads |
| F8 Results local, export | pass | UT: reload keeps the list; CSV and JSON checked field by field |
| F9 Copy for Claude | pass | UT: copy = card for every field; adds confidence, "differs", the owner's playlists, "each style's own likelihood" |
| F10 Set Studio BPM | pass | UT: Studio shows 145 and plays at 143.9 measured |
| F11 Queue | pass | O: 3 tracks, then 7, unattended; UT: survives reload, resumes after Enable listening |
| NF1 Privacy | pass | as F7 |
| NF2 Speed, off main thread | pass (inferred) | inference in a Web Worker; ≤ 4.9 s after listening (DE, from timestamps); no performance trace taken |
| NF3 Lazy model, cached, size shown | pass | UT: "18 MB" after 0.5 s; cached on the 2nd run (0.1 s); retries and a Retry button |
| NF4 Chrome only | pass | UT: missing `getDisplayMedia` shows "Needs desktop Chrome" |
| NF5 Probabilities | pass | UT, critic: % on every style, "likelihoods" |
| NF6 Licence flagged | pass | `apps/07-six-am/README.md` |
| NF7 Six AM look | partly | critic 7/10, "already feels like Six AM" |
| US1 Load SoundCloud | pass, with gaps | widget ready 4.5 s; 25-track public set listed in 8.8 s; *B b baaangers* is 404 on SoundCloud (private or removed), so the 56-track check wasn't run; no geo-blocked track to test |
| US2 Enable listening | pass | UT (stubbed): no audio, refusal and Stop sharing each show a message with Retry |
| US3 Analyse | pass | O: 4 × 30 s at 20/40/60/80%; preview track analysed on its 30 s and labelled |
| US4 Compare with tags | pass | "differs" marker with tooltip |
| US5 Ask Claude | pass | as F9 |
| US6 Use the BPM | pass | as F10 |
| US7 Keep results | pass | as F8 |
| US8 Queue a playlist | partly | Analyse all on a 25-track public set queued all of them; a full playlist run in real Chrome was not done |

## Design

Fresh critic each round, screenshots only, against "rekordbox in the Six AM warehouse: run through a
playlist and each track's facts line up in calm, precise, scannable columns".

| Round | Score |
| --- | --- |
| 3 directions | A 6, B 6.5, **C Deck 7.5** (picked, L24; owner confirmed, L25) |
| Prototype rounds 2–5 | 7, 8, 8, 7 (loop stopped, L28) |
| Built view, then 2 fix passes | 7, 7, **7 (final)** |

**The ≥ 9/10 bar is not met.** Every critic kept the table, the gold BPM, the energy blocks, the
Camelot key and the detail strip with its four snippets. Each new critic found new gaps rather than
re-checking old ones. The final one asks for: one toolbar instead of three stacked bars; one place
for the listening state; wider Style columns with Track capped; a quieter in-row "Analyse"; shorter
empty-state copy. They are listed in `backlog.md` and not done.

## Validation (data-evals, owner's 10-track run)

Full table: `apps/07-six-am/evals/validation-2026-10-23.md`.

| # | Track | Reference | Top-2 | Match | BPM (ref) |
| --- | --- | --- | --- | --- | --- |
| 1 | Hard Reset – Redemption (30 s preview) | Progressive house | Techno, Deep Techno | no | 122.0 (122) pass |
| 2 | Knober, Jaime Soeiro – Realize | Tech house | Techno, Minimal Techno | yes | 128.2 (128) pass |
| 3 | Kolter – Symphony No. 5 | Jackin'/tech house | House, Deep House | no | 127.1 (none) |
| 4 | Retrouve – Music Is The Answer | Deep NY house | House, Tech House | yes | 128.1 (none) |
| 5 | Cărbune Adrian – Lost in The Loop | Jazzy deep house | House, Deep House | yes | 123.0 (123) pass |
| 6 | FOVOS – Work (Edit) | Hard bounce | Hard House, Trance | yes | 151.8 (152) pass |
| 7 | KI/KI – What's a Girl to Do | Hard trance | Trance, Hard Trance | yes | 145.8 (proxy 146) |
| 8 | Dubspinna – Festival Remix | Melodic house | House, Deep House | no | 125.0 (none) |
| 9 | Mason Flint – It Just Won't Do | Tech house | House, Tech House | yes | 126.0 (126) pass |
| 10 | MikeQ – Alien Superstar | Ballroom | House, Bassline | yes (House) | 128.1 (none) |

What it means: Ears is reliable for BPM, the hard end (trance, hard house) and house vs techno.
For the house sub-genres the owner cares most about (deep, jackin', melodic, ballroom) it mostly
says "House": a hint, not a call. Track 8 didn't hear past its Deep House tag. Track 1 was a
30 s preview, likely the DJ intro. Not tested: stability (no repeat run), one 10-track queue (it
ran in two batches).

## Guardrails

| Guardrail | Result |
| --- | --- |
| No audio stored or uploaded | 0 storage paths, 0 uploads (code read, storage and network) |
| Readable text | worst 4.91:1 (selected row number); disabled Export 3.78:1 (exempt) |
| Correct data | copy and export = card, field by field |
| Studio unbroken | loads, plays at a set tempo, saves through a reload |
| Desktop | works at 1440 × 900 and 1280 × 800 |

## Decision log

`decisions.md`: L0–L40 and T1–T19. The ones that mattered most:
- **L15:** Step 0 PASS, no fallback.
- **L16:** 30 s previews detected and labelled.
- **L18:** models through a same-origin rewrite, because Essentia's host has no CORS.
- **L19, L36:** raw Discogs styles; % is each style's own likelihood.
- **L22:** no essentia.js (it's AGPL); mel and features in plain TS.
- **L26, L27:** the owner's 4 × 30 s snippets and the queue in the MVP.
- **L28:** design loop stopped.
- **L32:** Studio tempo is per device, not per track.
- **L39:** one BPM lead on every surface.

Provisional calls for the owner to review: L37/L39 (Set Studio picks the reading in 90–160 BPM) and L38 ("Clear list" also deletes stored results).

## What I skipped or couldn't check

- **Design:** the ≥ 9/10 bar (7/10 final).
- **Stability:** a repeat run of the same track.
- **One queue:** a single 10-track run (it ran as two batches).
- **Large playlist:** the 56-track listing, because *B b baaangers* is 404.
- **Untested cases:**
  - a geo-blocked track
  - a 15 s model-download stall
  - pausing the player mid-snippet
  - a performance trace for NF2
- **Preview:** the model download through Vercel's rewrite, because the preview is behind Vercel's login and only the owner's browser can open it.
- **Speed on first use:** S1's first-ever run is over 2½ min on a slow connection, because of the one-time 18 MB download.
- **Shortcuts** (`grep -r "shortcut:" apps/07-six-am`):
  - `?demo=1` sample data
  - BPM and key by simple signal maths
  - energy and brightness ranges
  - per-device tempo
  - hard-coded playlists in the Claude text
  - the skip-walk relies on undocumented widget behaviour

---

# Ears v1.1: my genre and filters (24 Oct)

Small slice after the v1 merge (L41). Graders: `user-tester` (2 runs), `design-critic` (fresh each
round).

| Check | Bar | Result |
| --- | --- | --- |
| F12 My genre (typed, picked, reload, Copy for Claude, CSV `my_genre`, JSON `myGenre`, clearing) | pass | **pass** (picking from Chrome's native list simulated by filling the field) |
| F13 Filters (BPM range incl. half/double tracks on either reading, genre All / used / No genre yet, combining, Clear filters, reload) | pass | **pass** |
| User test job "tag and find my tracks by my own genre and tempo" | ≥ 4/5, no blocker/major | **5/5** (4/5 before the fix pass), none open |
| Design critic | ≥ 9/10 | **fail: 7/10** (7 before and after the fix pass) |
| No audio stored | 0 | **pass** (only small JSON keys) |
| Contrast / hit areas of new controls | ≥ 4.5:1 / ≥ 28 px | **pass** (worst 4.59:1; smallest 52 × 28) |
| Build hygiene | lint, test, build | **pass** (94 tests); `checks` on the PR |

Decisions: L41–L44, T20–T25. L44 (a typed genre takes an existing spelling) is provisional.
Not done: per-genre counts and a tagged share, separate count of unavailable tracks in the empty
message, the critic's toolbar consolidation (all in the backlog); playing a filtered list (next).
