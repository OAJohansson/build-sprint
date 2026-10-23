# Ears v1 validation, 23 Oct 2026 (data-evals)

Graded by `data-evals` from files only; the runs happened in the owner's Chrome and were not re-run.

- **Results:** `docs/products/07-six-am/evals-runs/2026-10-23-validation-export.json` (10 analyses,
  exported 16:17 UTC) and `2026-10-23-model-spike.md` (60 s spike runs, 3-track queue run).
- **Reference calls and match sets:** kickoff-source Appendix B; `evals.md` "Genre match sets (L19)",
  used as written.
- **Reference BPMs (L35):** sourced from public listings **before the export was opened**, then
  locked. Track 7 was locked as "proxy, not counted" before seeing its result.

## Dataset

10 tracks (the Appendix B validation set), one analysis each: 4 × 30 s snippets at about 20/40/60/80 %
(track 1 is a 30 s SoundCloud SNIP preview, 1 × 30 s from 0 s). No held-back cases. That is too few
for a stable estimate: each track moves a score by 10 points.

## Reference BPMs (sourced first)

| # | Track | Ref BPM | Source | Ref key (source) | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Hard Reset – Redemption (Extended Mix) | 122 | Beatport track 16744774 (Extended Mix, La Pyramide, 7:09; matches the SoundCloud upload's 7:09 and label) | Gb major | Original Mix also listed at 122 (F# minor) |
| 2 | Knober, Jaime Soeiro – Realize | 128 | Beatport track 17588668 (Original Mix, 303Lovers, Tech House) | Bb minor | |
| 3 | Kolter – Symphony No. 5 | none | Free download; not on Beatport/Tunebat; SoundCloud description empty | – | unsourced |
| 4 | Retrouve – Music Is The Answer (Edit) | none | Free download (Hypeddit, no BPM); SoundCloud description empty. Double You 2000 "Music (Is the Answer)" ~126.8 is a different track | – | unsourced |
| 5 | Cărbune Adrian – Lost in The Loop (Deibys Marquez) | 123 | Tunebat (Deibys Marquez – Lost in The Loop; Spotify-derived, algorithmic) | G major (Tunebat) | weaker source (database, not label) |
| 6 | Pupa Nas T x FOVOS – Work (Edit) | 152 | Beatport release 6953487 (Work Edit extended, Disorder, 4:19; matches SoundCloud 4:19; linked from the SoundCloud description) | Ab major | |
| 7 | KI/KI – What's a Girl to Do (KI/KI Remix) | proxy 146 | Beatport release 5379647 "What's a Girl to Do in '25 (Extended)" (Disorder, 4:29; Tunebat also 146) | Bb minor (Beatport) / Ab major (Tunebat) | the analysed upload is an *unreleased* 3:33 version; a different version, so **not counted** |
| 8 | Dubspinna – What's A Girl To Do (Festival Remix) | none | No listing for the remix; the Fatima Yamaha original is 120 (Beatport), not usable for a remix | – | unsourced |
| 9 | Mason Flint – It Just Won't Do (Remix) | 126 | DJ pools: rpool.id ("The Mash Up, 126 BPM, 6A"), djpoolrecords.com (126) | G minor (6A) | |
| 10 | MikeQ – Alien Superstar (MikeQ x DJ Fade Remix) | none | SoundCloud description has no tempo; no database listing found | – | unsourced |

Sourced and counted: tracks 1, 2, 5, 6, 9 (n = 5).

## Per-track results

Top-2 = the export's `genres[0..1]` (Discogs styles, `Electronic---` dropped). Match = top-1 or top-2 in
the L19 match set. BPM pass = within ±2 of the reference, or the reference equals the app's
alternative and `bpmAmbiguous` is true.

| # | Track | Reference call | Top-2 (activation) | Match | Ref BPM | App BPM (alt, relation) | BPM | Key (strength; runner-up) | Key vs public |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hard Reset – Redemption *(30 s preview)* | Progressive house | Techno .41, Deep Techno .33 | **no** | 122 (Beatport) | 122.0 (61, 1:2) | pass | C# major (.72; F# major .60) | differs (Gb = F# major is the runner-up) |
| 2 | Knober, Jaime Soeiro – Realize | Tech house (minimal lean) | Techno .40, Minimal Techno .31 | yes (Minimal Techno) | 128 (Beatport) | 128.2 (85.3, 2:3) | pass | A# minor (.76) | agrees (Bb minor) |
| 3 | Kolter – Symphony No. 5 | Jackin' / tech house | House .42, Deep House .16 | **no** (Tech House is 3rd, .15) | – | 127.1 (63.5, 1:2) | unsourced | G minor (.74) | – |
| 4 | Retrouve – Music Is The Answer | Roots / deep NY house | House .39, Tech House .29 | yes (House) | – | 128.1 (64, 1:2) | unsourced | A# major (.60) | – |
| 5 | Cărbune Adrian – Lost in The Loop | Jazzy deep house | House .39, Deep House .30 | yes (House, Deep House) | 123 (Tunebat) | 123.0 (61.5, 1:2) | pass | G major (.77) | agrees |
| 6 | Pupa Nas T x FOVOS – Work (Edit) | Hard bounce / hard trance | Hard House .16, Trance .13 | yes (both) | 152 (Beatport) | 151.8 (76, 1:2) | pass | G# major (.74) | agrees (Ab major) |
| 7 | KI/KI – What's a Girl to Do | Hard trance | Trance .33, Hard Trance .19 | yes (both) | proxy 146 | 145.8 (97.4, 2:3) | not counted (would pass) | F minor (.78; G# major .63) | relative of Tunebat's Ab major; differs from Beatport's Bb minor (other version) |
| 8 | Dubspinna – What's A Girl To Do | Melodic house (tagged Deep House) | House .40, Deep House .22 | **no** | – | 125.0 (62.5, 1:2) | unsourced | G# major (.70; A# minor .65) | – |
| 9 | Mason Flint – It Just Won't Do | Tech house | House .31, Tech House .27 | yes (Tech House) | 126 (DJ pools) | 126.0 (63, 1:2) | pass | G minor (.83) | agrees (6A) |
| 10 | MikeQ – Alien Superstar | Ballroom / vogue house | House .28, Bassline .21 | yes (House) | – | 128.1 (64, 1:2) | unsourced | F minor (.48, "unsure") | – |

None of the 10 has `bpmAmbiguous: true`; alternative ratios are 0.61–0.79 (flag threshold 0.80).

## Scores against the bars

| Eval | Metric | Bar | Result | Pass/fail |
| --- | --- | --- | --- | --- |
| Genre agreement | top-1/top-2 in L19 match set | ≥ 7/10 | **7/10** (2, 4, 5, 6, 7, 9, 10) | pass, exactly on the bar |
| Hears past the tag (track 8) | melodic/progressive above deep house | reported | **no**: House .40, Deep House .22; Progressive House not in the top 5 | reported (not gated) |
| BPM | ±2 or half/double correctly flagged | ≥ 8/10 | **5/5 sourced** (100 %); 4 unsourced, 1 proxy (would pass) | pass on the sourced tracks; 8/10 is not provable with 5 references |
| Key | reported with strength | reported | 10/10 with strength and runner-up; 4/5 agree with public keys (1 differs, its runner-up matches) | reported |
| Stability | same top-1, BPM ±1 on a repeat | same | **untested**: the 3 queue-run records are the same analyses as 3 of the 10 (identical numbers and timestamps), and re-analysing replaces a result (T4) | not run |
| End to end | 10/10 without errors | 10/10 | 10/10 records, all fields filled, 0 errors in the export | pass |
| One queue | all 10 in one queue | all 10 | **not shown**: two batches, 3 tracks 15:41–15:45 and 7 tracks 16:00–16:13 UTC | not evidenced |
| Result after listening | ≤ 10 s | max ≤ 10 s | ≤ 4.9 s upper bound (see timing) | pass (inferred) |
| Per track end to end | ≤ 2½ min | ≤ 150 s | 123.5–124.9 s (8 measurable tracks) | pass |

## Timing (from `analysedAt`)

The export has no timing fields (the worker's `featuresMs`/`inferenceMs` are not persisted), so
timing comes from gaps between consecutive results in the queue: each gap covers the next track's
load, 4 seeks, 120 s of listening and the analysis.

| Track | Gap to previous result |
| --- | --- |
| KI/KI | 124.5 s |
| Cărbune | 124.4 s |
| Knober | 123.5 s |
| Kolter | 123.5 s |
| Retrouve | 124.8 s |
| Dubspinna | 124.0 s |
| Mason Flint | 124.9 s |
| MikeQ | 124.4 s |

FOVOS and Hard Reset are the first of their batch (no previous result). Max 124.9 s ≤ 150 s.
Everything that is not listening (load, seeks, features, inference, combine) fits in ≤ 4.9 s per
track, so the result-after-listening time is ≤ 4.9 s, inferred, not measured directly. The model
spike recorded features ~90 ms and inference ~600 ms per 60 s window, consistent with that. First
run model download (76.7 s in the spike) is not part of these numbers (model from cache).

## Track 1 (30 s preview)

`preview: true`, `analysedSeconds: 30`, one snippet from 0 ms, `heardSeconds: 30`. The UI labels it
("30s" marker in the row, "Heard · 30 s preview only" in the deck) and Copy for Claude adds
"30 s preview only" (`analyse-view.tsx` lines 380 and 460, `claude-text.ts` line 37). BPM 122.0
matches Beatport exactly. Genre missed (Techno/Deep Techno): the preview is the first 30 s of a
7-minute extended mix, likely the DJ intro, which is the same failure L26 fixed for full tracks.

## No-audio guardrail (F7, NF1): code read

- `grep -rn "MediaRecorder"` over `src` and `public`: only a comment saying it is not used.
- `new Blob` / `createObjectURL`: once, in `src/lib/ears/export.ts` `saveFile`, for the CSV/JSON
  text built from the stored measurements. No audio Blob or File anywhere.
- `fetch`: three calls. `ears.worker.ts` downloads the model and its metadata (GET, inbound);
  `widget.ts` GETs SoundCloud oEmbed (URL only); `lib/api.ts` is the Studio's API, imported only by
  `studio.tsx`. No `XMLHttpRequest`, `sendBeacon` or `WebSocket`. No request carries a body from Ears.
- Storage: `localStorage` through `useLocalStorage` for the queue (URLs, titles, status), results
  (`EarsAnalysis`: numbers and metadata) and the loaded source; Cache API `ears-models-v1` holds
  the model file only (T1). No IndexedDB, no OPFS (`navigator.storage`/`getDirectory`).
- Audio path: `capture.ts` connects the tab stream to the `pcm-tap` worklet only (not to the
  speakers); 16 kHz PCM is *transferred* to the worker (`ears-client.ts` line 55) and reduced to
  statistics (`EarsSnippetStats`: onset autocorrelation, 12-bin chroma, mean activations, sums); the
  PCM is dropped after each snippet (L30).
- Export JSON: 26 kB for 10 tracks; longest array 14 items (uploader tags); no numeric array longer
  than 16 anywhere. No audio-like data.

Result: **0 audio storage paths, 0 audio uploads** in the code; export clean. Not checked: the
runtime storage dump and network log (F7's live half), because that needs the owner's Chrome.

## Unit tests

`pnpm -F 07-six-am test`: 12 files, 82 tests, all pass (24 Oct). The kickoff's three are there:
`soundcloud-url.test.ts` (track, set, `?si=`, `utm_`, `?in=`, short links, junk), `styles.test.ts`
(name mapping, fallback), `bpm.test.ts` (half/double normalisation, alternatives). Gap: no test
walks all 400 model classes (F5's "every one of the 400 styles maps").

## Things to flag

1. **House collapse.** Plain House is top-1 on 6 of 10 tracks (3, 4, 5, 8, 9, 10), across jackin',
   deep NY, jazzy, melodic and ballroom calls. Two of the 7 genre passes (4 and 10) count only
   because L19 allows plain House there; without that allowance the score is 5/10. The model
   separates the hard end well (6, 7) and gets tech house only as runner-up.
2. **Activations are not a distribution.** The `p` values are independent per-style activations:
   the top 5 sum to 0.65–1.38 (Retrouve 1.35, Knober 1.38). F4's check ("a ranked list summing to a
   probability distribution") fails as written, and "House 39 %" reads as a share when it is not.
   NF5 (shown as %, never certain) is unaffected, but the meaning of the % should be decided.
3. **BPM is strong but thinly referenced.** 5/5 within ±0.2 BPM; every snippet within ±0.1 of the
   combined value. Only half the set has a reference, and track 5's is a database estimate.
4. **Stability and the one-queue run are untested.** The only repeat of a track is the FOVOS
   60 s spike run (old estimator, first window): 101.3 BPM and top-1 Donk then, 151.8 and Hard
   House now. That is a method change, not a stability test.
5. **Low key confidence on track 10** (0.48, shown as "unsure"); track 1's key differs from
   Beatport (runner-up matches), on a 30 s preview.
