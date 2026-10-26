# AI loops bake-off: Stable Audio vs Lyria (S4, A10)

Generation run by the engineer on 25 Oct 2026 (local time). **Not graded here**: data-evals
grades key, tempo, loop and quality from the files (X4, X5). The winner is logged by the PM.

## API facts (checked from the official docs, 25 Oct 2026)

### Stability AI: Stable Audio

Sources: [API reference overview](https://docs.stability.ai/api-reference),
[Stable Audio 2.5 text-to-audio](https://docs.stability.ai/api-reference/stable-audio-2/text-to-audio),
[Stable Audio 3.0 text-to-audio](https://docs.stability.ai/api-reference/stable-audio/text-to-audio),
[Fetch audio result](https://docs.stability.ai/api-reference/audio-results/fetch-audio-result),
[Pricing](https://docs.stability.ai/pricing), [Release notes](https://docs.stability.ai/release-notes)
(Stable Audio 3.0 API released 20 May 2026). The old `platform.stability.ai/docs` URLs now
redirect to `docs.stability.ai`.

- **Auth:** `Authorization: Bearer <key>`; base `https://api.stability.ai`; body
  `multipart/form-data`. Rate limit 150 requests / 10 s.
- **Stable Audio 2.5** (`model=stable-audio-2.5`): `POST /v2beta/audio/stable-audio-2/text-to-audio`,
  **synchronous**. `accept: audio/*` returns the bytes (headers `seed`, `finish-reason`,
  `x-request-id`); `application/json` returns base64. Parameters: `prompt` (required, ≤ 10,000
  chars), `duration` 1–190 s (default 190), `seed` 0–4294967294, `steps` 4–8 (default 8),
  `cfg_scale` 1–25 (default 1 for 2.5), `output_format` `mp3` | `wav` (default mp3).
  **No BPM or key parameters**: tempo and key go in the prompt.
- **Stable Audio 3.0** (`model=stable-audio-3`): `POST /v2beta/audio/stable-audio/text-to-audio`,
  **asynchronous**: returns `{ id }`, then poll `GET /v2beta/audio/results/{id}` (202 in progress,
  200 with the audio; results kept 24 h). `duration` 1–380 s, `steps` 4–8, same other parameters.
- **Price:** flat **8 credits per successful generation** for both 2.5 and 3.0; 1 credit = $0.01,
  so **$0.08 per loop**. Failed generations aren't charged. (Stable Audio 2.0 is 17 + 0.06 × steps
  credits, ≈ 20.) A free `GET /v1/user/balance` returns the credit balance, used here to check the
  real charge.

### Google: Lyria via the Gemini API

Sources: [Music generation (Lyria 3.5 / Lyria 3 Clip)](https://ai.google.dev/gemini-api/docs/music-generation),
[Lyria 3 Clip Preview model page](https://ai.google.dev/gemini-api/docs/models/lyria-3-clip-preview),
[Lyria 3.5 model page](https://ai.google.dev/gemini-api/docs/models/lyria-3.5),
[Lyria RealTime](https://ai.google.dev/gemini-api/docs/realtime-music-generation),
[Lyria prompt guide](https://ai.google.dev/gemini-api/docs/lyria-prompt-guide),
[Interactions overview](https://ai.google.dev/gemini-api/docs/interactions-overview),
[Pricing](https://ai.google.dev/gemini-api/docs/pricing).

- **Two APIs.** (1) **Request/response** through the Interactions API:
  `POST https://generativelanguage.googleapis.com/v1beta/interactions`, header `x-goog-api-key`,
  JSON `{ model, input }`; the answer's `steps[]` hold `model_output` blocks with `audio` (base64)
  and `text` (lyrics / structure; `<instrumental>` for ours). (2) **Lyria RealTime**
  (`lyria-realtime-exp`, experimental): a WebSocket stream of 48 kHz 16-bit stereo PCM.
- **Models our key can use** (from `GET /v1beta/models`, 25 Oct): `lyria-3-clip-preview`,
  `lyria-3-pro-preview`, `lyria-3.5`, `lyria-realtime-exp`. (`lyria-3.5-clip-preview` is documented
  but not listed for our key, and has no published price.)
- **lyria-3-clip-preview:** always a **30-second** clip, **MP3** (192 kbps, 44.1 kHz stereo in our
  files). **No BPM, key, duration or seed parameters**: everything goes in the prompt; results vary
  between calls. Instrumental by asking for it. SynthID watermark on all audio. **$0.04 per request**
  (paid tier; no free tier). `lyria-3.5`: full songs (minutes), $0.08, can return WAV.
- **Lyria RealTime** is the only Lyria with real controls: `bpm` 60–200, `scale` (12 enum values,
  each a relative major/minor pair, e.g. `A_FLAT_MAJOR_F_MINOR`), `density`, `brightness`,
  `only_bass_and_drums`, `seed`. No published price; experimental. Not used here (see decisions).
- Interactions are stored for 55 days by default (paid tier); we send `store: false`.

## What was run

`node scripts/loops-bakeoff.mjs --out <scratchpad>/bakeoff` (from `apps/07-six-am`), using the
app's own adapters (`src/lib/server/ai-loops/`) and prompt builder (`src/lib/ai-loops/prompt.ts`).
The same five prompts on each service; the requested values were fixed in the script before any
result was heard:

| # | Style words | BPM | Key | Bars | Seconds asked |
| --- | --- | --- | --- | --- | --- |
| 1 | Deep House | 120 | A minor | 8 | 16.0 |
| 2 | Tech House | 124 | F minor | 8 | 15.48 |
| 3 | Disco, House | 126 | C major | 4 | 7.62 |
| 4 | Techno | 128 | D# minor | 8 | 15.0 |
| 5 | Trance | 145 | G minor | 8 | 13.24 |

Prompt shape (#2): *"Tech House bass loop. Solo bassline only: no drums, no percussion, no chords,
no vocals. 124 BPM, in F minor, 8 bars of 4/4, a seamless loop that repeats cleanly. Tight, groovy,
clean studio mix."* Lyria gets one extra line, because its clip is always 30 s: *"The 8-bar phrase
repeats, unchanged, for the whole clip."*

Variants: **Stable Audio 2.5** (WAV, `duration` = the loop's exact length, seed 42), **Lyria 3
Clip** (MP3, 30 s, no seed), and **Stable Audio 3.0** as a third column (same price as 2.5, the
newest model, async). Files and the manifest are outside the repo (generated audio is never
committed): `<scratchpad>/bakeoff/{stability,lyria,stability-3}/NN.{wav,mp3}` and
`<scratchpad>/bakeoff/manifest.json`.

## Numbers from the run (not quality)

| Service | Model | Loops OK | Format | Length | Median time | Cost per loop | Cost (5) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stable Audio 2.5 | `stable-audio-2.5` | 5/5 | WAV 44.1 kHz stereo | as asked | 3.5 s | $0.08 | $0.40 |
| Lyria 3 Clip | `lyria-3-clip-preview` | 5/5 | MP3 192 kbps | 30 s always | 13.2 s | $0.04 | $0.20 |
| Stable Audio 3.0 | `stable-audio-3` | 5/5 | WAV 44.1 kHz stereo | as asked | 3.3 s | $0.08 | $0.40 |

**Cost check (X5 evidence):** the Stability balance went 525 → 517 for the single probe loop and
517 → 437 over the run (read a minute later; the immediate read lagged one charge): 88 credits for
11 loops = **exactly 8 credits ($0.08) per loop**, matching the shown estimate. Lyria has no balance
API; its cost is the published $0.04 per request (the response's `usage` only reports tokens:
72 in, 315 out).

**Total spend:** $1.12 ($0.12 probe: one Stable Audio 2.5 and one Lyria loop to check the response
shapes, plus $1.00 for the run). No failures, no retries.

## For data-evals

- Grade X4 per service: key (or relative) and tempo within ±1 BPM on ≥ 4 of 5. Lyria's files are
  30 s with the phrase repeated; grade the whole clip or its first `bars`.
- The manifest has, per file: prompt, requested BPM / key / scale / bars / seconds, provider,
  model, seconds taken, cost and response metadata (seed, request id, Lyria usage).

## Fix pass and re-run (bakeoff-2, after L124)

Fixes from the grading (`2026-10-25-ai-loops-grading.md`), built by the engineer and not graded here:

1. **Length:** Stable Audio returns `floor(duration)` whole seconds, so the adapter now asks for
   `ceil(seconds + 0.05)`. `finishLoop` (`src/lib/ai-loops/wav.ts`, shared by the route and the
   script) parses the 16-bit PCM WAV and trims it to exactly `round(bars × 240 / bpm × 44100)`
   frames.
2. **Seam:** the 20 ms of audio that followed the loop end is crossfaded (linearly) into the
   head, so sample 0 continues from the last sample. When there's no tail to use, both ends get a
   3 ms fade instead. In this run every file had a tail and got the crossfade.
3. **Mode wording ("B"):** the key is now spelled out, with the root, the seven notes and the
   third. For example: *"in D# minor: a dark natural-minor bassline rooted on D#, using only the
   notes D# F F# G# A# B C# (minor third F#, no major third)"*. Wording A (the first run) was
   *"in D# minor"*. Seed 42 is shared with the first run, so files `NN-s42` are the direct A/B
   against `bakeoff/stability/NN.wav`. Seed 7 is a second sample.
4. **Lyria:** off by default. It is used only with `LOOPS_PROVIDER=lyria` or `LOOPS_FALLBACK=lyria`.
   It is **not trimmed**: decoding MP3 on the server would need a dependency, so it stays at 30 s
   with its ~50 ms MP3 padding (marked as a `shortcut:`). **Stable Audio 3.0 was removed** from the
   adapter and the script.

Run: `node scripts/loops-bakeoff.mjs --out <scratchpad>/bakeoff-2 --seeds 42,7 --max-usd 1.2`.
The same 5 prompts × seeds 42 and 7 on Stable Audio 2.5 gave 10 of 10 OK. Every file was trimmed
from the whole second it came back as (17/16/8/16/14 s) to the exact bar length (16 / 15.4839 /
7.619 / 15 / 13.2414 s), with the crossfade seam. Median time 2.9 s. Cost: **$0.80**, and the
Stability balance went 429 → 349, 80 credits = 8 per loop (read 20 s after the run). Files are in
`<scratchpad>/bakeoff-2/stability/NN-s{42,7}.wav`, with `manifest.json` (each item has `finish`:
raw and trimmed seconds, and the seam method).

## Checked draws (bakeoff-3, after L126)

The server now checks every draw and draws again until one passes, at most `MAX_DRAWS = 3`.
Each draw goes through generate → `finishLoop` (exact length, seam) → `checkLoop`
(`src/lib/ai-loops/check.ts`) → `drawLoop` (`src/lib/server/ai-loops/draws.ts`). If none pass,
the best-scoring draw is kept with `checked: false` and what was measured. Every paid draw counts
towards the daily cap, and the shown cost is the sum of the draws.

- **Tempo:** the app's own Ears estimator (onset autocorrelation) on 16 kHz mono (windowed-sinc
  resample). It's the estimator data-evals grades with. On tempo = within ±1 BPM of the request, so
  half, double and 3:2 reads fail.
- **Key:** bass-range peak chroma (30–400 Hz, 16384-point frames, each frame normalised) against
  Krumhansl–Kessler profiles. In key = the same key or its relative major/minor.
- **Unit tests** on synthetic sine bass lines: `src/lib/ai-loops/check.test.ts`.
- **Agreement check (not a grade):** on the 10 bakeoff-2 files, `checkLoop` reproduces the
  re-grade's tempo and bass-key readings on 10/10.

Run: `node --import ./scripts/ts-resolve.mjs scripts/loops-draws.mjs --out <scratchpad>/bakeoff-3`.
It used the script path because another session's `next dev` holds this app folder, and Next
allows one dev server per folder. The script runs the same `drawLoop` and the same Stable Audio 2.5
adapter as the route, with the same 18 s timeout. It made the 5 requests once each, starting from
seed 42:

| # | Request | Draws | Kept loop (measured by the server) | Checked | Cost |
| --- | --- | --- | --- | --- | --- |
| 1 | 120 A minor 8 bars | 1 | 120 BPM, A minor | pass | $0.08 |
| 2 | 124 F minor 8 bars | 2 (draw 1 read C major) | 124 BPM, F minor | pass | $0.16 |
| 3 | 126 C major 4 bars | 1 | 126 BPM, C major | pass | $0.08 |
| 4 | 128 D# minor 8 bars | 1 | 128.2 BPM, D# minor | pass | $0.08 |
| 5 | 145 G minor 8 bars | 3 (72.5 G min; 145 A# min; 145.3 F# maj) | best: 72.5 BPM, G minor | **none passed** | $0.24 |

That is 8 draws and **$0.64**. The Stability balance went 349 → 285 = 64 credits = 8 per draw.
The files and `manifest.json` (every draw's seed, time, cost and measured values) are in
`<scratchpad>/bakeoff-3/`.
