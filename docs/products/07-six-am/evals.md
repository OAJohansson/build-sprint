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
