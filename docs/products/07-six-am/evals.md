# Evals: Six AM, Ears v1

How the owner will judge the delivery (decision 0026). Written at kickoff, before any code, in
two parts that never live together:

- **Agent-checkable checks** (this file, `docs/products/07-six-am/evals.md`): the squad reads them,
  runs them and reports each with evidence in the eval report.
- **Owner-only checks**: kept **outside the repo**, never committed, never pasted into a session.
  The squad must never read them.

Whoever builds something never grades it: the checks below are run by `user-tester`,
`design-critic` and `data-evals`, not by the agent that built the thing. Checks marked **owner's
hands** need a real Chrome tab-share dialog and real SoundCloud audio: the owner clicks through the
picker, the grader reads the logs and screenshots.

---

## Part 1: agent-checkable checks

### Requirements (one pass/fail check per requirement in the kickoff pack)

| # | Requirement | Check (how to tell, on a fresh install) | Run by | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| F1 | Parse SoundCloud track and set URLs | Unit tests pass for track, set, `?si=`, `utm_`, `?in=`, short links, junk; junk input shows a message in the UI | data-evals (tests), user-tester (UI) | | test log, screenshot |
| F2 | Widget API drives playback | Load, play, pause, seek and `READY`/`PLAY`/`PAUSE`/`FINISH` each reflected in the UI | user-tester | | screenshot, console |
| F3 | Tab capture into an in-memory buffer | With tab audio shared, RMS of the captured stream is non-silent while the widget plays (owner's hands); the video track's `readyState` is `ended` straight after the grant | data-evals | | RMS log |
| F4 | 16 kHz mono, mel patches, EffNet inference in a worker, averaged | A captured window yields a ranked list of Discogs styles summing to a probability distribution; input rate logged as 16000 | data-evals | | log |
| F5 | Discogs style → display name | Unit test: `Electronic---Deep House` → *Deep House*, every one of the 400 styles maps to a name, unknown style falls back to its raw name | data-evals | | test log |
| F6 | BPM, key/scale, energy, brightness | All four shown for every validation track | data-evals | | validation table |
| F7 | Raw audio discarded, never stored or uploaded | After an analysis: localStorage, IndexedDB, Cache Storage and OPFS hold no audio-sized blobs or PCM arrays; network log has no outgoing request with an audio body or size > 100 kB (model downloads are inbound only) | data-evals | | storage dump, HAR summary |
| F8 | Results persisted locally; CSV/JSON export | Reload keeps the session list; CSV and JSON exports open and hold every row's fields | user-tester | | files, screenshot |
| F9 | Copy for Claude | Clipboard text matches the Appendix B template with every field filled (or explicitly "none") | user-tester | | clipboard text |
| F10 | Set Studio BPM | After the click, the Studio's tempo display shows the detected BPM and the transport plays at it | user-tester | | screenshot |
| NF1 | No audio stored, uploaded or downloadable | F7's check plus a code read: no `MediaRecorder`, no audio `Blob`/`File` creation, no download link for audio, no audio in any `fetch` body | data-evals | | grep output |
| NF2 | Result ≤ 10 s after the window ends; UI responsive | Timed on the validation runs (max ≤ 10 s); inference runs in a Web Worker (no long task > 200 ms on the main thread during inference) | data-evals | | timings, performance trace |
| NF3 | Lazy model load, cached, loading state, size shown first time | Model requests appear only on first Analyse; second run fetches them from cache; first run shows the loading state with the total size | user-tester | | network log, screenshot |
| NF4 | Chrome desktop only, others explained | In a non-Chromium browser (or with `getDisplayMedia` missing) the view explains Chrome is needed instead of failing | user-tester | | screenshot |
| NF5 | Genres as probabilities | Result card shows % on every genre; no copy states one genre as fact | user-tester, design-critic | | screenshot |
| NF6 | Licence flagged | App README states Essentia.js / Discogs-EffNet are AGPLv3 / non-commercial, revisit before public release | data-evals | | README line |
| NF7 | Existing Six AM look | design-critic judges the Analyse view against the Studio screenshots and the feel sentence | design-critic | | score |
| US1 | Load SoundCloud | Valid track URL: player ready ≤ 5 s; the *B b baaangers* set lists all 56 tracks; an invalid URL, a private track and a geo-blocked track each show a clear message | user-tester | | timings, screenshots |
| US2 | Enable listening | Instructions name "this tab" and "Share tab audio"; sharing without audio, or silent audio, shows a message with Retry; Chrome's Stop sharing returns the UI to "not listening" | user-tester (owner's hands for the dialog) | | screenshots |
| US3 | Analyse a track | Snippets taken at about 20/40/60/80% of the track (30 s each; a 30 s preview uses what plays); progress visible; Cancel stops it with nothing saved; result shows top 3 genres with %, BPM to 1 decimal, key + scale, energy and brightness as labels and bars; pausing the player pauses the analysis and resuming continues or restarts cleanly | user-tester | | screenshots |
| US4 | Compare with tags | Uploader genre tag shown next to the result when available; left out (not "undefined") when not | user-tester | | screenshot |
| US5 | Ask Claude | Copied text has title, uploader, URL, all results, uploader tags and the Appendix B prompt | user-tester | | clipboard text |
| US6 | Use the BPM | One click sets the Studio tempo (as F10) | user-tester | | screenshot |
| F11 | Queue | 3 tracks queued (and "Analyse all" on a playlist) are analysed one after another with no clicks; reload keeps the queue and it resumes after Enable listening | user-tester | | screenshots, log |
| US8 | Queue a playlist | Analyse all on a 5+ track playlist fills every row unattended | user-tester (owner's hands to start) | | screenshots |
| F12 | My genre per track | Type a genre on a row (free text) and pick a suggestion on another (Appendix A family names and genres already used appear); both survive a reload; both appear in Copy for Claude, the CSV and the JSON export; clearing the field removes it everywhere | user-tester | | screenshots, files |
| F13 | Filters | BPM range 120–126 shows only tracks with a reading in range; a 72.5/145 ambiguous track matches 140–150 and 70–75; my-genre filter offers All, each used genre and "No genre yet", each narrowing the table correctly; filters combine with each other and with the text filter; clearing restores the full list | user-tester | | screenshots |
| US7 | Keep my results | Every analysed track listed; list survives reload; exportable (as F8) | user-tester | | screenshot |

### Definition of done (from the brief)

| Check | Bar | Run by | Result |
| --- | --- | --- | --- |
| End to end on the 10 validation tracks (Appendix B) | 10 / 10 without errors | data-evals (owner's hands) | |
| Genre top-1 or top-2 agrees with the reference call | ≥ 7 / 10 | data-evals | |
| BPM within ±2 of reference, or half/double-time correctly flagged | ≥ 8 / 10 | data-evals | |
| No audio persisted or uploaded | storage and network clean (F7, NF1) | data-evals | |
| Result after listening ends | ≤ 10 s on every validation track; one track end to end ≤ 2½ min (owner, 23 Oct: was paste to result ≤ 90 s) | data-evals | |
| Validation run as one queue | all 10 tracks analysed in one queue without touching anything | data-evals (owner's hands to start) | |

### User test (from `user-testing/plan.md`, written by `discovery`)

| Scenario | Bar: time | Bar: taps | Bar: outcome | Result |
| --- | --- | --- | --- | --- |
| S1 What genre is this? Paste a track URL, enable listening, analyse | ≤ 2½ min | ≤ 6 | Result card with top 3 genres, BPM, key, energy, brightness | |
| S2 Where does this go? Copy for Claude from a result | ≤ 15 s | ≤ 2 | Clipboard holds the full prompt | |
| S3 Pick a track from the playlist and analyse it | ≤ 3 min | ≤ 8 | Right track analysed, added to the session list | |
| S4 Set the Studio to this BPM and open the Studio | ≤ 10 s | ≤ 2 | Studio at the detected tempo | |

Every top job scored ≥ 4/5 by `user-tester`, and no blocker or major finding left open.

### Design

- `design-critic` score **≥ 9/10** on the Analyse view, from screenshots only, against the kickoff
  pack's "feel in one sentence".
- No item from the kickoff pack's "Things to avoid" visible on any screen.

### AI and data (run by `data-evals`)

| Eval | Dataset | Metric | Bar | Result |
| --- | --- | --- | --- | --- |
| Genre agreement | 10 validation tracks (Appendix B) | Discogs top-1 or top-2 is in the track's match set (table below) | ≥ 7 / 10 | |
| Hears past the tag | Track 8 (Dubspinna, tagged Deep House) | Melodic house/progressive ranks above deep house | reported, not gated | |
| BPM | 10 validation tracks | ±2 BPM or half/double flagged | ≥ 8 / 10 | |
| Key | 10 validation tracks | Reported with key strength; no reference, so no bar | reported | |
| Stability | 1 track analysed twice | Same top-1 style and BPM within ±1 | same | |

#### Genre match sets (L19)

The model speaks Discogs styles; the reference calls use the owner's genre words. A track agrees
when its Discogs top-1 or top-2 is one of the styles below (all `Electronic---…`). Written before
any result was seen; changing a row after a run is not allowed. Plain "House" counts only where the
reference call is itself a house-lineage call with no Discogs equivalent.

| # | Track | Reference call | Match set |
| --- | --- | --- | --- |
| 1 | Hard Reset – Redemption (Extended Mix) | Progressive house | Progressive House, Progressive Trance |
| 2 | Knober, Jaime Soeiro – Realize | Tech house (minimal/deep tech lean) | Tech House, Minimal, Minimal Techno |
| 3 | Kolter – Symphony No. 5 | Jackin' / tech house | Tech House, Ghetto House, Garage House, UK Garage, Speed Garage |
| 4 | Retrouve – Music Is The Answer (Edit) | Roots / deep NY house | Deep House, Garage House, House |
| 5 | Cărbune Adrian – Lost in The Loop | Jazzy deep house | Deep House, House, Future Jazz, Acid Jazz |
| 6 | Pupa Nas T x FOVOS – Work (Edit) | Hard bounce / hard trance | Hard Trance, Hard House, Hardstyle, Jumpstyle, Hard Techno, Trance |
| 7 | KI/KI – What's a Girl to Do (KI/KI Remix) | Hard trance | Hard Trance, Trance, Hard House, Hard Techno, Acid |
| 8 | Dubspinna – What's A Girl To Do (Festival Remix) | Melodic house (tagged Deep House) | Progressive House, Progressive Trance, Techno, Trance (not Deep House: the test is whether it hears past the tag) |
| 9 | Mason Flint – It Just Won't Do (Remix) | Tech house | Tech House, Bassline |
| 10 | MikeQ – Alien Superstar (MikeQ x DJ Fade Remix) | Ballroom / vogue house | Ghetto House, Ghetto, Juke, House (Discogs has no ballroom style; closest available) |

### Guardrails (must not get worse; measured with a number)

| Guardrail | How measured | Bar | Result |
| --- | --- | --- | --- |
| No audio stored or uploaded | F7 storage and network check | 0 audio blobs, 0 audio uploads | |
| Readable text | contrast ratio, worst state | ≥ 4.5:1 | |
| Correct data | copied/exported values vs result card, field by field | 100% | |
| Studio unbroken | Studio loads, plays and saves a track as before | yes | |
| Desktop | works at 1280 × 800 and 1440 × 900 (phone is out of scope) | yes | |

### Build hygiene

- `pnpm -F 07-six-am build` and `pnpm -F 07-six-am lint` pass; `pnpm -F 07-six-am test` passes,
  including the kickoff pack's unit tests (URL parsing, style mapping, BPM normalisation).
- No secrets in the diff; every new key is in `.env.example` (Ears needs none).

Owner-only checks: Part 2 of `docs/operating-modes/evals-TEMPLATE.md`, kept outside the repo.

---

# Evals: Six AM Mentor (Phase 2)

Agreed by the owner on 24 Oct as listed (L53). Graders: `user-tester`, `design-critic`,
`data-evals`; never the builder. Owner-only checks live outside the repo.

| # | Eval | Bar | Run by | Result |
| --- | --- | --- | --- | --- |
| E1 | Mentor genre suggestion matches the reference call on the 10 Ears validation tracks (Appendix B), judged by a written rubric: the suggested genre names the same genre as the reference call (synonyms and the parent family count, e.g. "hard bounce" for hard trance; plain "house" does not count for a sub-genre call); rubric fixed before any run | ≥ 8/10 | data-evals | |
| E2 | Every answer cites sources (Ears measured / uploader tagged / web source / your taste profile / general knowledge); none claims to have heard the music | 100% of a sample of ≥ 20 answers across all jobs | data-evals | |
| E3 | Listen-next answers: no invented artists or tracks; links resolve | 0 invented in a sample of ≥ 10 answers; ≥ 90% of links resolve | data-evals | |
| E4 | After the setup step, the profile reasonably describes the playlist | grader rubric pass on ≥ 2 public playlists | data-evals | |
| E5 | The profile reflects tagging and corrections | each of 3 scripted actions shows up in the profile | data-evals | |
| E6 | Proposed genre groups are grounded in real shared traits; accept, rename and split work | every group's reason checks out against the tracks; all three actions work | data-evals + user-tester | |
| E7 | An answer arrives within 15 s | p90 ≤ 15 s over the sample | data-evals | |
| E8 | Shown cost within a few cents of real usage; 50/day warning appears and can be overruled | within $0.03 per day total; warning + Continue anyway work | data-evals + user-tester | |
| E9 | Nothing lost on reload or in another browser; no audio sent to Claude | reload + fresh browser profile keep everything; request bodies hold no audio | user-tester + data-evals | |
| E10 | User test: every job ≥ 4/5; design critic scores the panel against the feel | jobs ≥ 4/5; design **9/10 is a target, not a blocker**, reported as is | user-tester, design-critic | |

### Requirements M1–M16

One pass/fail per requirement in the Mentor kickoff (`kickoff.md`), run by the grader named there.

### Guardrails

| Guardrail | Bar |
| --- | --- |
| No audio stored, uploaded or sent to Claude | 0 |
| API key never in the browser bundle or responses | 0 occurrences |
| Ears and Studio unbroken (Analyse, queue, My genre, filters, Studio play/save) | yes |
| Readable text, hit areas | ≥ 4.5:1, ≥ 28 px |

### Build hygiene

`pnpm -F 07-six-am lint`, `test` (incl. the Mentor unit tests), `build` pass; every new key in
`.env.example`; `checks` green on the PR.

# Evals: Six AM Arrangement map, template and sounds (Phase 3)

Owner's evals from the 25 Oct kickoff (L104), part 1 (agent-checkable). Graders: `user-tester`,
`design-critic`, `data-evals`; never the builder. Test sandbox only. Owner-only checks live
outside the repo.

| # | Eval | Bar | Run by | Result |
| --- | --- | --- | --- | --- |
| X1 | Map sections within 4 bars of the reference sections; reference times sourced and committed before any result is seen | on most validation tracks (≥ 7 of 10 boundaries-sets, the roadmap's Phase 2 metric) | data-evals | |
| X2 | Template matches the map's tempo, key and length; markers on the map's bars | exact (tempo ±0.1, key equal, length equal) | data-evals | |
| X3 | Synths in key and on tempo: every note in the track's scale; note onsets on the grid at the track's tempo | 100% of notes; onsets within 5 ms | data-evals (offline render) | |
| X4 | AI loops in key and on tempo | key matches (or relative) and tempo within ±1 BPM on ≥ 4 of 5 generated loops; reported per service | data-evals | |
| X5 | AI cost shown matches the real usage | within a cent per loop, from the provider's published prices / usage | data-evals | |
| X6 | User test: every job ≥ 4/5 (test sandbox only) | jobs ≥ 4/5 | user-tester | |
| X7 | Design scorecard (one critic, five points) | **9/10 is a target, not a blocker**, reported as is | design-critic | |
| X8 | No audio stored or uploaded from streamed tracks (AI-generated loops are the owner's own files and may be stored) | 0 | data-evals (code + network) | |

### Requirements A1–A11

One pass/fail per requirement in the Phase 3 kickoff (`kickoff.md`), run by the grader named there.

### Guardrails

| Guardrail | Bar |
| --- | --- |
| No streamed audio stored, uploaded or sent anywhere | 0 |
| AI keys never in the browser bundle or responses | 0 occurrences |
| Ears, the Mentor and the Studio unbroken (Analyse, queue, My genre, Mentor chat, Studio play/save of existing tracks) | yes |
| Readable text, hit areas | ≥ 4.5:1, ≥ 28 px |

### Build hygiene

`pnpm -F 07-six-am lint`, `test`, `build` pass; every new key in `.env.example`; `checks` green on the PR.

# Evals: Six AM Lab (Phase 4)

Owner's evals from the 26 Oct kickoff (L147), revised with the agreed jobs (L153–L161), part 1
(agent-checkable). Graders: `user-tester`, `design-critic`, `data-evals`; never the builder. Test
sandbox only. Owner-only checks (by ear: is a soloed part useful; does my own sound feel inspired by
it; A/B feels fair) are in the owner's final review.

| # | Eval | Bar | Run by | Result |
| --- | --- | --- | --- | --- |
| Y1 | Separation faster than real time on the owner's Mac (Apple silicon, Chrome); measured ratio and delay reported | ratio > 1.0 sustained; delay a few seconds | data-evals | **pass**: 3.76× over a full track, 0 late, delay 5.51 s |
| Y2 | Original silent locally while parts play | `suppressLocalAudioPlayback` true, and the owner hears only Six AM | data-evals + owner | spike: pass (L151) |
| Y3 | Zero bytes of the original stored or uploaded, including patch matching and loops | 0 (storage, network, code read) | data-evals | **pass**: 0 (499 requests, storage, code read) |
| Y4 | Synth or AI sounds in key and on tempo | every synth note in scale, onsets ≤ 5 ms; AI key and tempo ±1 BPM on ≥ 4 of 5 | data-evals | **pass**: synth 619/619 in scale ≤ 2 ms; library blocks 141/141; AI 1 of 1 (capped) |
| Y5 | Library save and load (sound + loop linked, tags, name) survive a reload; Studio lane changes survive a reload | 5 of 5 each | data-evals | **pass** library 5/5; Studio lane changes 7/7 after reload; old tracks 301/301 offline + schedule spot-check identical |
| Y6 | User test: every job ≥ 4/5 (sandbox) | jobs 1–5 ≥ 4/5 | user-tester | |
| Y7 | Design scorecard (one critic, five points) | **9/10 is a target, not a blocker** | design-critic | |
| Y8 | Section loop is seamless and the playhead shows what you hear | no gap or click at the loop point (> 20 ms silence or a step > −30 dB); playhead within 0.5 s of the heard audio | data-evals | **pass**: 4 seams clean; playhead 20 ms live, 0 looping |
| Y9 | A/B is level-matched | original and mine within 1 dB RMS when switching | data-evals | **pass** 40/40 offline, live 4/4 within 0.01 dB (Reese 1.1 dB quieter in mono by design, T107) |
| Y10 | Patch matching suggests settings closer than the starting preset | on ≥ 3 of 5 parts, a measured feature distance (brightness, envelope, pitch) drops vs the preset | data-evals | **pass** 2 tracks, 40/40 pairs closer (58–100 %); kick-bleed extremes gone (pitch drop at max 1/40); floors remain (mono width, very short notes); Tone/Drive pinned on Acid line and Rubber pluck |

### Requirements B1–B11

One pass/fail per requirement in the Lab kickoff (`kickoff.md`), run by the grader named there.

### Guardrails

| Guardrail | Bar |
| --- | --- |
| No audio of a streamed original stored, uploaded or sent to any API | 0 |
| AI keys never in the browser bundle or responses | 0 occurrences |
| Ears, the Mentor, the map and the Studio unbroken (existing tracks open and play after the lane-model change) | yes |
| Readable text, hit areas | ≥ 4.5:1, ≥ 28 px |

### Build hygiene

`pnpm -F 07-six-am lint`, `test`, `build` pass; `checks` green on the PR.

# Evals: Six AM Make for every layer (Phase 5)

From the Phase 5 kickoff (27 Oct, L214–L220), part 1 (agent-checkable). Graders: `user-tester`,
`design-critic`, `data-evals`; never the builder. Test sandbox only (`ACCESS_CODE=test-code`,
in-memory store). Owner-only checks (by ear: does my kick/chords/FX feel inspired by the original;
is the A/B fair) are in the owner's final review.

Reading is measured against a ground truth the grader knows: test loops built from known patterns
and notes (crate loops and synth parts mixed, then separated by the Lab), plus a hand check on
2 real tracks.

| # | Eval | Bar | Run by | Result |
| --- | --- | --- | --- | --- |
| Z1 | Drum hits read on time | onsets within 10 ms of the truth; ≥ 90 % of hits found, ≤ 10 % extra | data-evals | **Pass** (drums re-grade 12 Nov): 95.4 % found, 2.7 % extra (5 real loops incl. 1 held out, 370 events); kicks 151/151 within 10 ms. 28 Oct: fail 85.1 / 25.6 |
| Z2 | Drum hits labelled right (kick / clap-snare / hats) | ≥ 85 % of found hits | data-evals | **Pass** (drums re-grade 12 Nov): 87.9 % pooled; Lost 21–28 81.2 % (flammed claps read late). 28 Oct: fail 63.3 % |
| Z3 | Melody/chord notes read | ≥ 70 % of note pitch classes per chord found; ≤ 20 % wrong notes; onsets within 30 ms | data-evals | **Fail** (melody slice, 12 Nov): real Lost 69–76 G7 stabs, 26.8 % pitch classes found by onset (75.1 % still sounding), wrong 4.2 %, onsets p95 14.6 ms; pooled 39.0 %; struck chords read as held notes, the 7th mostly missed (M-F2); **melody re-grade 13 Nov**: still fail, 36.9 / 35.3 % on Lost 69–76 with the 12 Nov labels; the stab loop is now marked doubtful in 3 of 4 reads (MR-1); **Basic Pitch 13 Nov**: fail, Lost 69–76 13.1–13.5 % (read as a G2 line), 77–84 57.7–61.3 %; BP only works on a worker's first read (BP-1) |
| Z4 | Every synth note in key and on tempo, every family | in scale, onsets ≤ 5 ms | data-evals | **Pass** (drums slice): 1,152/1,152 hits ≤ 0.98 ms of intended; kicks now on the attack (12 Nov); kick Tune not key-snapped (observation); **melody slice**: pass, 240/240 onsets ≤ 4.2 ms, 230/240 within 35 cents (10 over = measurement limit at G2 with heavy detune); **FX 13 Nov**: pass, sub drop on the root (0 c), dark fall and synth riser on root + 3/4 octaves |
| Z5 | A/B level-matched, every family | within 1 dB (perceived loudness) | data-evals | **Pass** (drums re-grade 12 Nov): 45/45 within 0.05 LU. 28 Oct: 40/45; **melody slice**: pass, 35/35 within 0.04 LU (B stays enabled and silent when every row is off, M-F3); **melody re-grade**: pass 30/30; **FX 13 Nov**: fail on Lost 73–80 (B −1.0 to −1.13 dB live), Mason within 0.1 dB; **Basic Pitch 13 Nov**: melody pass 30/30; FX Lost 73–80 still −1.05 / −0.99 dB (FX-R3); **FX-R3 re-measure 13 Nov (12b82e9)**: Lost 73–80 −1.01 dB (bed) / −0.96 dB (no bed), Mason +0.08 / +0.02: at the bar, borderline; drums spot 0.00 LU |
| Z6 | Suggest closer than the starting preset, drums (per row) and melody | measured distance drops on ≥ 3 of 5 loops | data-evals | **Pass** (drums re-grade 12 Nov): product distance 27/27; independent kick 6/8, clap 9/9, hats 7/9; **melody slice**: pass, product distance 7/7 rows; independent 5/7 (chords 3/5, lead 2/2); **melody re-grade**: pass, product 7/7, independent 5/7; **Basic Pitch 13 Nov**: pass, 5/5 product and independent |
| Z7 | Save and Studio drop: each family/row lands on its lane and survives a reload | 5 of 5 per family | data-evals | **Pass** (drums re-grade 12 Nov): 5/5 on Kick / Claps & snares / Hats after reload; on a default track clap/hats make their own lanes, kick block never replaced; **melody slice**: 5/5 on Chords / Pads / Lead when those lanes exist; **fail on a default track**: Lead and Pads land on Chords and replace its block (M-F1); **melody re-grade 13 Nov**: pass, 5/5 on a default track (Pads and Lead lanes created, Chords never replaced); **FX 13 Nov**: pass 5/5, reload identical (rows > 4 bars can't be saved, FX-R2) |
| Z8 | Bass unchanged: old saved sounds render sample-for-sample; bass flow passes Phase 4's Y4, Y9, Y10 | yes | data-evals | **Pass** (drums re-grade 12 Nov): 466/466 tests; Phase 4 Y4/Y9/Y10 offline identical at 077e188 and HEAD; **melody slice**: pass, 490/490 tests; Y4/Y9/Y10 identical; bass live OK after Melody took Mine |
| Z9 | Zero bytes of the original stored or uploaded | 0 (storage, network, code read) | data-evals | **Pass** (drums re-grade 12 Nov): 0 (2,326 requests, storage, code read); **melody slice**: pass, 0 (5,386 requests, storage, code read); **melody + FX 13 Nov**: pass, 0 (5,995 requests, storage, code read); **Basic Pitch 13 Nov**: pass, 0; model and tfjs from our own origin |
| Z10 | User test: jobs per slice ≥ 4/5 (sandbox) | ≥ 4/5 each | user-tester | **Pass except Mentor**: drums 4/4/5/4/5 after fixes, FX 4; Mentor in Make 1 (blocker fixed in code c76da0e, not re-run live: API usage limit) |
| Z11 | Design scorecard (one critic, five points) | **9/10 is a target, not a blocker** | design-critic | Round 2 8/10; built room 7/10 (16-bar density); polish C1–C7 since, not re-scored |
| Z12 | Make comes alive quickly per family | knobs live ≤ 35 s after entering on a playing loop, with a countdown | data-evals | **Partial** (drums re-grade 12 Nov): 0.8 s in memory, 18.7–21.5 s for 8 bars; 16-bar 35.5 s, cold Play 37.7 s (fill-bound); countdown later figures within −2.8…+0.5 s; **melody slice**: pass, 1.0 s in memory, 18.6–21.3 s for 8 bars, cold Play 21.3 s (default loop now 8 bars); countdown last figure within −1.6…+0.5 s; **FX 13 Nov**: partial, 8-bar loops 19.2–21.1 s; cold Play picks a 16-bar loop, 35.7–37.1 s; **Basic Pitch 13 Nov**: fail cold, 50.4 s (16-bar default loop + 10 s first model load); 1.5–2.8 s per later fresh read |

### Requirements P1–P10

One pass/fail per requirement in the Phase 5 kickoff (`kickoff.md`).

Drums slice (data-evals, 28 Oct, `evals-runs/2026-10-28-drums-slice.md`): P1 partial (controls shift 126–138 px vs Bass), P3 fail (reading), P6 pass, P7 pass (Z5 caveat), P8 pass, P9 partial (default-track drop), P10 pass.
Re-grade 12 Nov: P1 partial (A/B and score half under the save bar at 1440×741), P3 pass (reading meets Z1/Z2 pooled), P6 pass, P7 pass, P8 pass, P9 pass (default track makes Claps & snares / Hats lanes), P10 pass.
Melody slice (data-evals, 12 Nov, `evals-runs/2026-11-12-melody-slice.md`): P4 partial (reading fails Z3), P6 pass, P7 pass, P8 pass, P9 partial (default-track drop, M-F1). Drums re-check: D-R1 not fixed (3 of 15 claps 11 ms late on Lost 21–28), N1 pass.
13 Nov (`evals-runs/2026-11-13-melody-fx.md`): melody M-F1 and M-F3 fixed; M-F4 and M-F5 not fixed; P4 still partial. FX: P5 pass (timing, labels), P6 pass (no ticks without a clear measure, typical start offered), P7 fail (Lost 73–80 A/B, FX-R3), P9 pass with FX-R2 (rows > 4 bars can't be saved), P10 pass.
Basic Pitch grade (`evals-runs/2026-11-13-melody-basic-pitch.md`): Z3 misses the bar with Basic Pitch and with DSP; MR-2 and M-F4 pass with Basic Pitch; FX-R1 pass (3/3 stable); FX-R3 still about 1 dB. After 12b82e9: melody off (L247) confirmed, no melody read; FX-R3 −1.01 / −0.96 dB, borderline.

### Guardrails

| Guardrail | Bar |
| --- | --- |
| No audio of a streamed original stored, uploaded or sent to any API | 0 |
| AI keys never in the browser bundle or responses | 0 occurrences |
| Ears, Mentor, map, Studio and the bass Make flow unbroken | yes |
| Readable text, hit areas | ≥ 4.5:1, ≥ 28 px |

### Build hygiene

`pnpm -F 07-six-am lint`, `test`, `build` pass; `checks` green on the PR.

# Evals: Six AM Chords in Make (Phase 6)

From the Phase 6 kickoff (26 Nov, L248–L253), part 1 (agent-checkable). Graders: `data-evals`,
`user-tester`, `design-critic`; never the builder. Test sandbox only (`ACCESS_CODE=test-code`,
in-memory store). Owner-only checks (by ear: do my chords and lead sound like the track; is the
grid easy to fix by ear; one live Mentor answer) are in the owner's final review.

**Real data first (Phase 5 retro):** H1–H4 are graded on parts separated live in the browser from
real tracks (L250: Lost in the Loop, Kiki's "What's a Girl to Do" remix, Retrouvé "Music Is the
Answer", Mason Flint), labelled by data-evals from the spectrogram (the Phase 5 method, 95–100 %
on struck chords). At least 6 loops from at least 3 tracks, one held out from tuning. Synthetic
loops only guard regressions. **Spike gate:** H1 and H2 must pass before slice 1 is built; if they
don't after the time box, stop and ask the owner (L252).

Chord "type family" for H1: major (incl. 6, maj7, add9), minor (incl. m7, m9), dominant 7, sus,
diminished. A chord counts right when root and family match the label.

| # | Eval | Bar | Run by | Result |
| --- | --- | --- | --- | --- |
| H1 | Chord names read right per bar (spike gate) | ≥ 70 % of labelled bars root + family right; root alone ≥ 80 % | data-evals | **Fail** (spike, 26 Nov, `evals-runs/2026-11-26-chords-spike.md`): 9 real loops, 3 tracks (Lost, Retrouvé, Dubspinna for Kiki). A (DSP) root + family **36.8 %** (14/38), root 84.1 %; B (Basic Pitch) 42.1 %, root 69.3 %. Held out (Dubspinna 73–80): A 0 % / root 50 %, B 25 % / 50 %. A drops the 7th and the minor third (G7 → G, B♭m → B♭sus2: CH-1); **Re-grade A after fix round (L256, 7831547)**: pooled 9 loops **80.3 %** root + family, root 85.2 % (pass, but these loops fed the fixtures); **held out 25 % / root 50 % (fail)**; new: lead G over B♭m read as Gdim (CH-7); **Unseen loops (L259, `evals-runs/2026-11-26-chords-unseen.md`)**: A **pass**, 88.0 % root + family, root 92.0 % (25 cells, 4 new loops, 2 tracks incl. Kolter); with held out 75.9 % / 86.2 %; without the Dubspinna pad loop 72.7 % / 81.8 % (11 cells); **After d35fae4 (`evals-runs/2026-11-26-chords-slice1-reader.md`)**: A pass pooled, 84.9 % root + family, root 89.1 % (13 loops, 63 cells); held out still 25 % / 50 %; U-2 not fixed (Dubspinna 33–40 2/4 Fm); **Round 2 (c67c631, `evals-runs/2026-11-26-chords-slice1-reader-r2.md`)**: pass pooled, 82.5 % / root 87.0 %; held out 25 % / 50 %; U-2 still not fixed (2/4) |
| H2 | Chord times read right (spike gate) | ≥ 90 % of labelled chord onsets found within 30 ms, ≤ 15 % extra | data-evals | A **pass** (spike, 26 Nov, `evals-runs/2026-11-26-chords-spike.md`): 99.4 % found, 10.6 % extra (176 onsets, best shift 0 ms on every loop); held out 100 / 8.3 %. B **fail**: 70.5 % found, 23.9 % extra (misses Retrouvé's plucks, CH-4). Spike gate: neither reader passes H1 and H2; **Re-grade A after fix round (L256, 7831547)**: A pass, 98.9 % found, 11.8 % extra; held out 100 / 12.2 %. Gate: A passes in-sample, not on the held-out loop (owner call, L252); **Unseen loops (L259, `evals-runs/2026-11-26-chords-unseen.md`)**: A **pass**, 100 % found, 10.9 % extra (22 onsets, thin); with held out 100 / 11.7 %. Held pads and tremolo are struck many times (U-1). A passes H1 and H2 on unseen music, narrowly; **After d35fae4 (`evals-runs/2026-11-26-chords-slice1-reader.md`)**: A pass, 99.0 % found, 6.5 % extra (spike loops + Dubspinna 33–40); held out 100 / 5.3 %. New N-1: soft chord changes on pads start ~0.7 s late; **Round 2 (c67c631, `evals-runs/2026-11-26-chords-slice1-reader-r2.md`)**: pass, 98.5 % / 8.1 % (98.6 / 7.6 % with held out); 3 of 215 stabs turned held, none on Lost; N-1 fixed (11/11 changes at the line) |
| H3 | Held chords stay held | ≥ 80 % of labelled held chords (pads) played as one chord, not re-struck | data-evals | **Not gradable** (spike, 26 Nov, `evals-runs/2026-11-26-chords-spike.md`): every chord in the 10 loops is struck (decay median 179 ms); 1 held chord labelled, re-struck by A (3) and B (5). Reverse check passes: 0 struck chords read as held (A 0/193, B 0/135); **After d35fae4 (`evals-runs/2026-11-26-chords-slice1-reader.md`)**: **fail, 18 % (2/11)** on real pads (Kolter 61–68 2/4, Dubspinna 161–168 0/7): pads re-struck on swells and pump; **Round 2 (c67c631, `evals-runs/2026-11-26-chords-slice1-reader-r2.md`)**: **fail, 64 % (7/11)**: Kolter 4/4, Dubspinna 161–168 3/7 (re-struck on swells, E♭ split as B♭sus4) |
| H4 | Lead notes read (reported, not a ship gate: L249) | target ≥ 70 % of notes found (onset within 50 ms, right pitch), ≤ 20 % wrong, on ≥ 2 real riffs | data-evals | Reported (spike, 26 Nov, `evals-runs/2026-11-26-chords-spike.md`): Mason 17–24 and Dubspinna 105–112 (Kiki swapped). A 41.2 % found, 69.1 % wrong; **B 79.4 % found, 62.8 % wrong** (finds the Dubspinna line 15/16 but adds the stab tones). Both under the wrong-note target; **Final pass** (`evals-runs/2026-11-26-chords-final.md`): Basic Pitch at HEAD, Mason 72.2 % found / 35.7 % wrong, Dubspinna 100 % / 68.4 %; Lost 69–76 lead off at HEAD (on at ec050a9) |
| H5 | The right chord is one tap away | label among the guess + next 3 alternatives in ≥ 90 % of bars | data-evals | **Fail** (borderline for A) (spike, 26 Nov, `evals-runs/2026-11-26-chords-spike.md`): A 89.5 % (34/38), B 55.3 %; held out 50 % / 50 %; **Re-grade A after fix round (L256, 7831547)**: A 89.5 % (unchanged), held out 50 %; **Unseen loops (L259, `evals-runs/2026-11-26-chords-unseen.md`)**: A 96.0 % unseen, 89.7 % with held out; **After d35fae4 (`evals-runs/2026-11-26-chords-slice1-reader.md`)**: A 92.1 % pooled (pass), held out 75 %; **Round 2 (c67c631, `evals-runs/2026-11-26-chords-slice1-reader-r2.md`)**: 93.7 % pooled (pass), held out 50 % |
| H6 | Every played note in its chord and on time | 100 % of notes from the cell's chord; onsets ≤ 5 ms of the grid/read time | data-evals | **Pass** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): 297/297 notes in their cell's chord, 87/87 events at 0.0 ms from the read events (Lost, Dubspinna, Kolter) |
| H7 | A/B level-matched, Chords and Lead | within 1 dB (LUFS), drums under both on by default | data-evals | **Pass** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): 0.00 LU on 3/3 loops at the preset and with the ticks (product measure), bed on by default |
| H8 | Suggest closer than the starting preset | measured distance drops on ≥ 3 of 5 loops per row | data-evals | **Pass** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): chords row distance drops on 3/3 loops (12.3 → 6.2, 17.4 → 15.6, 36.4 → 8.6) |
| H9 | Edits survive: chord picks, note edits and moved times saved, dropped on Chords / Pads / Lead and reloaded | 5 of 5, rendering identical before and after | data-evals | **Partial** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): edits back in Make after reload 5/5, stored pattern identical 5/5; saved notes match Mine 3/5 (two hits in one 16th fold into one, S-1); **Final pass** (`evals-runs/2026-11-26-chords-final.md`): chords **pass**, saved = played 5/5, edits back after reload 5/5 (S-1 fixed); lead: saved = Mine 4/4, but loading it back into Make drops note offsets (LD-1): partial; **Re-check d4dfe6b** (`evals-runs/2026-11-26-chords-final.md`): lead **pass**, loaded lead = saved 2/2 (offsets kept, bars loaded not edited); LD-1 fixed |
| H10 | Nothing else broke | Bass, Drums, FX and Phase 5 melody sounds render sample for sample (golden hashes); Phase 5 Z7/Z8 still pass | data-evals | **Pass** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): 547/547 tests incl. bass golden hashes and drums sample-for-sample; synth sources unchanged; Bass/Drums/FX live and saving; **Final pass** (`evals-runs/2026-11-26-chords-final.md`): 598/598 tests at HEAD incl. bass golden; synth sources unchanged: pass |
| H11 | Zero bytes of the original stored or uploaded | 0 (storage, network, code read) | data-evals | **Pass** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): 0 (3,773 requests, no binary bodies, longest numeric array 235 = map levels; storage: access code and model cache only); **Final pass** (`evals-runs/2026-11-26-chords-final.md`): 0 over Make, Lead, Why it fits (offline) and the Studio (4,811 requests, no binary bodies): pass |
| H12 | Mentor's theory facts right | the chord's name, key and role (numeral, in or out of key) the server gives the model are right on 20 chord/key pairs incl. borrowed chords; unit-tested, no paid calls | data-evals | **Partial** **Final pass** (`evals-runs/2026-11-26-chords-final.md`): 34/36 pairs fully right; Em in G minor numeral ♭vii (should be vi), E in A♭ spelled E G♯ B; [theory] lines 60/60; offline answers plain 60/60; **Re-check d4dfe6b** (`evals-runs/2026-11-26-chords-final.md`): **fail**: TH-1 fixed (Em in G minor = vi); TH-2 only with key "Ab", the real map key "G#" still gives E G♯ B; new TH-3: on a "G#" map every chord and offline answer is spelled in sharps (A♯m, C♯, D♯m); **Re-check 7cf8c56** (`evals-runs/2026-11-26-chords-final.md`): **pass**, TH-2/TH-3 fixed live (Dubspinna in flats, F♭ A♭ C♭, key A♭ major); 36 pairs: facts 36/36, spelling 35/36 (E♭dim's fifth spelled A, minor); offline answers plain 61/61 |
| H13 | User test: jobs per slice ≥ 4/5 (sandbox) | ≥ 4/5 each (fix a planted wrong chord, edit a note, move a chord, save and find it in the Studio, the lead) | user-tester | |
| H14 | Fixing is quick | a planted wrong chord fixed in ≤ 3 taps when the right one is offered (tester gets the right name as text, it can't hear) | user-tester | **Pass** (hook count) (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): planted chord fixed in 2 taps on 3/3 loops |
| H15 | Design scorecard (one critic, five points) | 9/10 is a target, not a blocker | design-critic | |
| H16 | Make comes alive quickly | chords read ≤ 3 s after the loop is in memory; knobs live ≤ 35 s on 8-bar loops (L232) | data-evals | Read time (spike, 26 Nov, `evals-runs/2026-11-26-chords-spike.md`): A **pass**, 0.37–1.43 s (38/38); B 0.60–2.22 s on 28/29, **8.87 s** on the session's first B read (model load + first compile). Knobs-live half not checked (Melody off); **Re-grade A after fix round (L256, 7831547)**: A 0.38–0.61 s (20/20); **After d35fae4 (`evals-runs/2026-11-26-chords-slice1-reader.md`)**: A 0.39–0.98 s (28/28), production build; **Round 2 (c67c631, `evals-runs/2026-11-26-chords-slice1-reader-r2.md`)**: 0.43–1.03 s (28/28); **Slices 1–2** (slices 1–2, 42ada83, `evals-runs/2026-11-26-chords-slices1-2.md`): read ready 0.57–1.04 s after memory, Mine 0.88–1.25 s, knobs live ~21 s on 8-bar loops: pass |

Guardrails: originals never stored or sent (0); AI keys never in the bundle (0); Ears, Mentor,
map, Studio and Make for Bass/Drums/FX unbroken; text ≥ 4.5:1. Build hygiene:
`pnpm -F 07-six-am lint`, `test`, `build` pass; `checks` green on the PR.

# Evals: Six AM Rebuild the song (Phase 7)

From the Phase 7 kickoff (27 Nov, L265–L270), part 1 (agent-checkable). Graders: `user-tester`,
`design-critic`, `data-evals`; never the builder. Test sandbox only (`ACCESS_CODE=test-code`,
in-memory store). Owner-only checks (by ear: are the drums and bass now "recognisably the same";
does the range of sounds feel broad; does the rebuilt song feel like mine) are in the owner's
final review. A reader is graded on real separated loops before a slice is built on it.

| # | Eval | Bar | Run by | Result |
| --- | --- | --- | --- | --- |
| W1 | 20 starting sounds per row (Kick, Claps & snares, Closed hat, Open hat, Shaker / percussion, Ride, Bass), each with a family, a feel word and one line | 7 × 20; every family in the variety map has ≥ 1 | data-evals | **Pass** (slice 1, `evals-runs/phase7-slice1-data-evals.md`): 6 drum rows × 20 + bass 20; every map family covered (kick 9/9 … ride 5/5, bass 13/13); all 120 kit files shipped, Make wires Kick, Claps & snares, Closed hat and Bass |
| W2 | Breadth: no near-duplicates in a row | no pair within 10 % on both brightness (spectral centroid) and length (−20 dB decay); each row spans ≥ 3× in brightness and length. Bass presets measured on a fixed render: one C2 note, a 1/4-note gate, default knobs (L273) | data-evals | **Pass** (slice 1): 0 near pairs in 7 rows (closest 1.14–1.23×); brightness span 3.15× (open hat) to 57×, length span 3.15× (bass, fixed render) to 27×; measured values within 7.8 % of `kit-p7.ts`; **Re-grade 51764e2:** pass, 0 near pairs, bass length span 3.12×, names unique; **Re-grade 2 c7e4ef5:** pass, 0 near pairs, bass spans 29× / 3.12× |
| W3 | Licences: every shipped sample is CC0 or CC BY, with its source page, author and licence in `public/kits/LICENSES.md`; CC BY sounds credited in the app | 100 %; 0 files of unknown or non-redistributable licence | data-evals | **Pass** (slice 1): 138/138 files in `LICENSES.md` (128 CC0, 10 CC BY 3.0); 120/120 Freesound pages show CC0 live; tonejs-instruments README CC BY 3.0; credited in Make's "Sound credits" (upstream provenance of tonejs not stated, D7-7) |
| W4 | Knobs change the sound audibly: each knob, end to end, moves its feature | brightness ≥ 2×, length ≥ 2×, level ≥ 6 dB, pitch ≥ 5 semitones (per knob's job), on 5 sounds per row; sampled drum rows get Pitch, Length, Tone, Drive (L273) | data-evals | **Fail** (slice 1): sampled drums 118/120 (Pitch 30/30, Tone 30/30, Length 29/30 hat-tick 1.2×, Drive 29/30 kick-gabber +5.2 dB); bass Tone, Length, Pitch drop, Width 5/5 but Drive 2/5, Sub 1/5, Weight 2/5, Wobble 0/5 (D7-1–D7-5); **Re-grade 51764e2 (L282 bars, Phase 4 exempt):** fail, 4 of 128 bass checks miss: Tone 15/16 (sine-sub 1.87×, D7-9), Wobble 13/16 (organ-click 1.31×, fm-glass 1.38×, filtered-saw 1.28×, D7-10); Length, Pitch drop, Drive, Width, Sub, Weight 16/16; drums 118/120 (D7-4/D7-5 accepted); **Re-grade 2 c7e4ef5:** pass, new bass 16/16 on every knob (Tone 2.18–10.6×, Wobble 2.99–14.1× on the magnitude-weighted swing; 9/16 on the earlier power-weighted one, see run report), drums 118/120 with L283's accepted misses |
| W5b | Closed hat stops collecting other high sounds (OR6-3's cause) | on real loops with a shaker or ride, ≤ 20 % of Closed-hat hits are shaker / ride hits (labelled from the spectrogram); if it fails, accepted knowingly and the empty rows' message says Make may have put some on Closed hat (L273) | data-evals | **Not agent-gradable** (slice 2, `evals-runs/phase7-slice2-data-evals.md`): no ride-length hits and no trustworthy shaker label in separated spectrograms (D7-14) → owner by ear; measurable instead: clap bodies on Closed hat 0–83 % per loop (D7-13) |
| W5 | Open-hat reader on real loops: open hats told from closed | ≥ 85 % of open hats labelled open, ≤ 15 % of closed labelled open, onsets within 10 ms; ≥ 4 real loops from ≥ 3 tracks, 1 held out | data-evals | **Fail** (slice 2): 8 real loops, 3 tracks, Retrouvé 113–120 held out; open hats read open 72/164 (44 %, incl. 26 never on the hat row), closed read open 17/54 (31 %), onsets ≤ 10 ms 19/72; held out 3/13 and 3/26. Best retuned gates 53 % train / 8 % held out: retune not plausible, flip `READ_OPEN_HATS` (D7-12); **L287:** reader off (`READ_OPEN_HATS` false), Open hat filled by ear: recorded fail with the agreed fallback |
| W6 | Fix by ear: add, remove, mute, solo; what plays is what is saved | 5 / 5 edited loops: saved pattern = played pattern; mute and solo never saved as deleted hits | data-evals | **Fail** (slice 2): 4/5 loops saved = played; mute/solo 10/10 rows kept every hit; a second loop's save renamed the first loop's sound (3/25 saves; clap stored with the other loop's timing, 8.4 ms) (D7-11); **Re-grade (0d5a9d5):** pass, 5/5 loops, 20/20 rows saved = played (≤ 0.6 ms), mute/solo 10/10, same row on two loops saved as new sounds (0 PATCH, D7-11 fixed), edits identical after reload, saved row loads its hits; **slice 3 regression (a19debe):** pass, 8/8 rows saved = played, mute/solo kept, taps restored 10/10 after reload, old `played` entry loads 4/4 rows + mute; after a reload unedited steps follow the re-read (D7-17, PM call); **L294 re-check (slice 4 run):** pass, edited rows identical after reload on 2/2 loops, untouched Closed hat follows the re-read |
| W7 | Empty rows unmissable (R3b): Shaker and Ride say they're yours to fill; the loop shows how many rows are open | user-tester names every open row without help in 5 / 5 tries | user-tester | **Pass** (slice 2 re-check, 0d5a9d5): 5/5 (Open hat, Shaker, Ride named in ~3 s; count 3 → 2 → 0). First run 4/5 (an empty-read Open hat had no line, U7-12, fixed) |
| W8 | Click to jump in Bass, Drums, Melody, FX | play starts within one 16th of the clicked spot, 5 / 5 per family | data-evals | **Pass** (slice 2): 22/22 clicks (Drums 5, Bass 7, Melody 5, FX 5) start every part at exactly the clicked offset, 20 ms after the click (a 16th is 117 ms); **Re-grade (0d5a9d5):** pass, 21/21 (Drums bar buttons + ruler snap, Bass notes area, Melody, FX) start at the target ±0.5 ms, bar targets = the track's bar starts |
| W9 | Rebuild layout: the original's sections from its map, empty slots, hint per section | section starts = the map's bars, 100 %; 0 starter blocks; every section shows the original's parts | data-evals | **Pass** (slice 3, `evals-runs/phase7-slice3-data-evals.md`): section starts = the map's bars 24/24 on 3 maps (incl. worst case), contiguous, 0 blocks on open; hints = the Lab's drawing 120/120, unmeasured lanes no hint, slot wording 240/240; fill repeats and stops at the section end (8-bar part in a 12-bar Outro: one pass + a cut 4-bar pass); Leave empty takes the count down 19 → 18; template deleted. Hints checked on sandbox curves only (D7-18); **polish re-check (slice 4 run):** pass, the 14 measured-empty cells dimmed with no text (tooltip and aria say "The original has no … here"), heads "N to fill" ("none left" when narrow) |
| W10 | Compare: Original plays from the bar you're at through the Deck | Deck position within 150 ms of the bar's start, 5 / 5; back to Mine at the same bar; clear message when the Deck is closed | data-evals | **Pass** (slice 4, `evals-runs/phase7-slice4-data-evals.md`): Studio on the bar line, Original starts 7–12 ms from the bar's start, 5/5 (my 8 ms poll in the Deck; product landing `errMs` 12–16 ms, the fair measure; `errFirstPlayMs` 140–222 ms adds report lag); back to Mine within 0.03 bar 5/5; Deck closed → back to Mine, paused, clear message. Findings: plays from the playhead not the bar start (D7-19); a Deck on another song says "isn't open" (D7-20); cold first switch about 1 s late (D7-21) |
| W11 | Old sounds unchanged: Phase 4–6 saved sounds render sample for sample; old 3-row drum sounds open with Hats as Closed hat | 100 %; full test suite green | data-evals | **Pass** (slice 1): suite 618/618; bass golden unchanged; 88/88 old-sound renders (12 synth drums Studio + Make, 8 melody, 8 FX, 4 Phase 4 basses) hash-identical against the Phase 6 base; a saved `hats-closed-tick` opens on Closed hat with its knobs; **Re-grade 51764e2:** pass, 618/618, golden unchanged, 88/88 old renders identical; **Re-grade 2 c7e4ef5:** pass, 618/618, golden unchanged, 88/88 old renders identical; **slice 2:** pass, 633/633, 88/88 old renders identical, old `hats-closed-tick` and `hats-open-909` open on Closed hat; **slice 2 re-grade:** pass, 637/637, 88/88 identical, old hats sounds open on Closed hat; **slice 3:** pass, 643/643, 88/88 old renders identical, `parseDoc` on 2,000 random non-rebuild docs identical to the Phase 6 base; **slice 4:** pass, 652/652, 88/88 old renders and 2,000/2,000 `parseDoc` identical |
| W12 | Sample kit loads fast | a sound plays ≤ 300 ms after its first tap on a warm page; Make's drums ready no later than Phase 5's Z12 numbers (8-bar loop ≤ 21.5 s) | data-evals | **Pass** (slice 1, dev server): first tap 13–98 ms stopped (27), 150–173 ms playing (15); drums ready 19.2–19.8 s on six 8-bar drop loops (Z12 ≤ 21.5 s) |
| W13 | Zero bytes of the original stored or uploaded | 0 (storage, network, code read) | data-evals | **Pass** (slice 1): 0 binary bodies of 426 requests; saves 622 / 1,586 B (kit id, knobs, steps); storage holds the code, play position and model only; new code fetches only `/kits`; **slice 2:** pass, 0 binary bodies of 1,660 requests, saves ≤ 3.8 KB, no new fetch/storage; **slice 2 re-grade:** pass, 0 binary of 923 requests; localStorage edits = integer steps only (≤ 628 B per loop); **slice 3:** pass, 0 binary of 623 requests; the rebuild stores section names, bars, layer names and slot keys only; drum edits = tapped steps only; **slice 4:** pass, Deck channel = `seek{ms}`, `pause`, `state{url, title, pos, playing, durationMs, landed}` only (≤ 276 B, no arrays, 0 binary); 0 binary of 570 requests; rebuild adds `grid{bpm, originSec}` |
| W14 | User test: jobs per slice ≥ 4 / 5 (sandbox) | ≥ 4 / 5 each | user-tester | **Pass** with one exception: slice 1 find 4 / shape 4 (after fixes, both sizes); slice 2 rows-to-fill 5, add/remove 4, mute 4, jump 4 (after fixes; first run 2–3); slice 3 see 4, fill 5, come back 5, **way in 3** (before the outlined button; 4 on the slice 4 re-check); slice 4 compare 5, Deck closed 5, whole section 5 |
| W15 | Design scorecard (one critic, five points) | 9/10 is a target, not a blocker | design-critic | Round 2 (27 Nov): Shelf 6, Side list 6, Table 5; round 3 (final hybrid): 8; round 3b: **9**; built shelf 5 → **9** after the two-column fix (`design/p7-round2-critic.md`) |
| W16 | Listen's "Other" reads "Melody & FX" | yes | user-tester | **Pass** (slice 2): Listen reads "Melody & FX", nowhere "Other" |
