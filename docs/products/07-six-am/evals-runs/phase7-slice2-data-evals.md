# Phase 7 slice 2: data-evals, 27 Nov 2026

This run grades W5, W5b, W6, W8, W11 and W13 (`evals.md`, Phase 7). The code is 98c16cf,
which has the same app code as 0a63c04 and d28368f. I graded only and changed no product code.

**Result.**
- **Pass:** W8, W11, W13.
- **Fail:**
  - **W5** (the open-hat reader): far from the bar on every threshold I tried. Retuning the three
    gates on my labels would not plausibly pass (D7-12).
  - **W6:** 4 of 5 loops. Saving on a second loop can rename the first loop's saved sound instead
    of saving the new one (D7-11).
- **Not agent-gradable:** **W5b.** The separated loops show no shaker or ride I could tell apart
  in the spectrogram; it goes to the owner's ear (D7-14).

## Setup

- **Server:** another grader's dev server was running from this worktree. So I served from a
  detached copy of 98c16cf in my scratchpad (own `pnpm install`), as a dev server on :3027 with
  `ACCESS_CODE=test-code`, an in-memory store, and empty Supabase and AI keys.
- **Maps:** Mason and Lost via `sandbox-seed.mjs --base http://localhost:3027`. Retrouvé (128 BPM,
  origin 0.151 s) and Dubspinna (125 BPM, origin 1.091 s) via `--maps`, using the values measured
  on 26 Nov.
- **Browser:** my own Chrome 158 profile over CDP, with Deck auto-select and `?quiet=1`. Every
  loop was separated live from the Deck. A network logger was on every page, popup and worker.
- **What I captured, numbers only (C2):**
  - **The loop Make reads:** an in-page wrapper on `Worker.postMessage` turned the
    "drums-read" message into derived numbers before it went to the worker: a 48-band log
    spectrogram (1024-point frames, 2.5 ms hop, dB) and three 1 ms band envelopes (5.6–16 kHz,
    0.7–2.8 kHz, 2.5–5.6 kHz). No PCM was kept.
  - **What plays:** "drums-render" messages (hit lists and which rows are on).
  - **Jump starts:** `AudioBufferSourceNode.start` calls.
- **Cleanup:** all derived envelopes and spectrogram images, the Chrome profile and the grading
  copy were deleted after scoring. Only per-hit numbers (times, durations, dB) remain in the
  scratchpad, including the held-out labels, which are not in this report.
- **Sandbox writes:** about 30 saved drum rows and 2 old-style hats sounds, in-memory only.

## W5: the open-hat reader on real loops (bar: ≥ 85 % of open hats read open, ≤ 15 % of closed read open, onsets ≤ 10 ms; ≥ 4 loops, ≥ 3 tracks, 1 held out)

**Loops.**
- 11 eight-bar loops were captured: Lost 77–84 and 21–28; Mason 81–88, 17–24 and 41–48; Retrouvé
  57–64, 89–96 and 113–120; Dubspinna 141–148, 57–64 and 105–112.
- The three Dubspinna loops read almost no drums (0–4 hats), so I dropped them. That leaves
  **8 loops from 3 tracks.**
- **Held out:** Retrouvé 113–120, chosen before scoring.

**How I labelled (my own, from the spectrogram and the 5.6–16 kHz envelope; not the reader's
features).** For each hat hit the reader found:
- **Peak:** the peak of the 5 ms-smoothed air-band envelope within −10…+20 ms.
- **T20:** time from the peak until the air band first falls 20 dB under it. It stops at the next
  hit of any row (kick, clap, hat).
- **Labels:**

  | Label | Rule |
  | --- | --- |
  | open | T20 ≥ 90 ms |
  | closed | T20 < 60 ms |
  | ambiguous (left out) | 60–90 ms |
  | clap leak (not a hat) | the 0.7–2.8 kHz body is ≥ 6 dB over the air |
  | faint (left out) | peak more than 35 dB under the loop's loudest |
  | unjudged (left out) | cut by the next hit before 90 ms |

- **Missed open hats:** air-band bursts that pass the "open" rule with no hat hit within 30 ms.
  They count as open hats not read open.
- **Onset:** the steepest 2 ms rise of the 1 ms air envelope in the 40 ms before the peak.
- **Spot check:** I looked at the spectrogram strips with the reader's marks for Lost 77, Mason 81,
  Retrouvé 89 and 113. Mason's offbeat hats ring about 230 ms, and the reader marks most of them
  closed.

| Loop | Hat hits read | Open (mine): found + missed | Read open | Closed read open | Ambiguous / unjudged / clap leak / faint | Onset ≤ 10 ms |
| --- | --- | --- | --- | --- | --- | --- |
| Lost 77–84 | 63 | 18 + 4 missed | 0/22 (0 %) | 0/9 | 15 / 5 / 13 / 3 | – |
| Lost 21–28 | 37 | 9 + 3 missed | 0/12 (0 %) | 0/0 | 16 / 0 / 5 / 7 | – |
| Mason 81–88 | 42 | 30 + 8 missed | 14/38 (37 %) | 0/0 | 1 / 4 / 6 / 1 | 6/14 |
| Mason 17–24 | 43 | 28 + 8 missed | 11/36 (31 %) | 0/0 | 3 / 4 / 6 / 2 | 1/11 |
| Mason 41–48 | 6 | 0 + 1 missed | 0/1 | 0/0 | 1 / 0 / 5 / 0 | – |
| Retrouvé 57–64 | 69 | 19 + 1 missed | 18/20 (90 %) | 11/21 (52 %) | 26 / 0 / 2 / 1 | 4/18 |
| Retrouvé 89–96 | 110 | 34 + 1 missed | 29/35 (83 %) | 6/24 (25 %) | 38 / 6 / 4 / 4 | 8/29 |
| **Pooled, 7 tuning loops** | 370 | 138 + 26 | **72/164 (44 %)** | **17/54 (31 %)** | | **19/72 (median 18 ms)** |
| **Held out, Retrouvé 113–120** | 98 | 12 + 1 | **3/13 (23 %)** | **3/26 (12 %)** | 38 / 3 / 19 / 0 | 1/3 |

**Verdict: Fail.** Open hats read open: 44 % (bar ≥ 85 %). Closed hats read open: 31 % (bar
≤ 15 %). Onsets within 10 ms: 19/72.

**Is the verdict robust to my thresholds?** Counting only hits the reader found:

| Open threshold | Closed threshold | Open read open | Closed read open |
| --- | --- | --- | --- |
| 70 ms | 50 ms | 51 % | 11 % |
| 80 ms | 60 ms | 52 % | 31 % |
| 110 ms | 60 ms | 60 % | 31 % |
| 150 ms | 60 ms | 66 % | 31 % |
| 90 ms | 40 ms | 52 % | 6 % |

No setting reaches 85 %.

**On the onsets:** the reader's hat times sit a median 18 ms before my attack point. That may be
partly my onset definition, because a separated noise burst has no single attack sample. The
verdict doesn't depend on it.

**Would retuning the gates pass? Not plausibly (D7-12).**
- **Search:** I tried every combination of `decayDb` −40…−5, `overFloorDb` −10…25 and `airDb`
  −30…20 on the 7 tuning loops, keeping closed-read-open ≤ 15 %.
- **Best on the tuning loops:** `{-40, 16, 2}`, 53 % of open hats read open at 13 % closed.
- **On the held-out loop:** 8 % open (1/13) at 4 % closed.
- **Overlap:** the reader's three features overlap heavily between my open and closed hats.
  Median `decayDb` −13 vs −17, `overFloorDb` 18 vs 12, `airDb` 5.8 vs 6.2.
- **Ceiling:** 26 of 164 open hats (16 %) never reach the hat row at all, which caps any gate
  setting at 84 % before a single error.
- **Recommendation:** set `READ_OPEN_HATS` off, as L268 and L286 provide. Open hat then starts as
  a row to fill by ear.

## W5b: Closed hat collecting shaker or ride (bar: ≤ 20 %, labelled from the spectrogram)

**Not agent-gradable (D7-14).**
- No hit on the Closed hat row rang ≥ 300 ms with its body under its air, so I see no ride wash on
  these 3 tracks.
- A shaker-like rule (rise ≥ 15 ms, T20 < 150 ms) flags 0–67 % per loop (Retrouvé 89: 29/43).
  But separation smears attacks, and I couldn't confirm a shaker by eye in the strips. I don't
  trust that rule as a label.
- **What is measurable is clap leak (D7-13).** These are hits whose 0.7–2.8 kHz body is ≥ 6 dB
  over their air: Lost 77 13/58 (22 %), Lost 21 5/37, Mason 81 2/22, Mason 17 1/23, Mason 41 5/6,
  Retrouvé 57 0/14, Retrouvé 89 1/43, Retrouvé 113 18/75 (24 %).
- **Suggestion:** an owner check by ear, under L273's accepted-knowingly wording.

## W6: fix by ear, saved = played (bar: 5/5 edited loops; mute and solo never saved as deleted)

**Procedure on each loop:**
- Edits through `__sixamMake.tapStep`:
  - kick: remove a read hit, add one on an empty step;
  - clap: add one, remove one;
  - closed hat: add one, remove one (the add was skipped on Mason, which had no free step on my
    list);
  - Shaker / percussion: four new hits.
- I then captured the "drums-render" message: what Mine actually plays.
- **Mute and solo:** I muted Closed hat and soloed Claps. The render then had kick, hat, open hat
  and perc off. In that state I saved Closed hat and Kick. Then I undid both and saved Claps,
  Shaker / percussion and Open hat.
- **Comparison:** each saved sound (`GET /api/sounds`) was expanded over the loop and compared,
  step by step, with the unmuted render.

| Loop | Rows compared | Saved steps = played steps | Saved while muted / solo-excluded | Max offset gap |
| --- | --- | --- | --- | --- |
| Lost 77–84 | 5 | 5/5 | hat 51/51, kick 27/27 hits kept | 0.6 ms (rounding) |
| Lost 21–28 | 5 | 5/5 steps, **but the clap carries Lost 77's timing and velocities** | hat 38/38, kick 32/32 | **8.4 ms**; velocity 0.78 saved vs 1.0 played |
| Mason 81–88 | 5 | 5/5 | hat 21/21, kick 29/29 | 0.6 ms |
| Mason 17–24 | 5 | 5/5 (perc was a rename of Mason 81's, identical) | hat 23/23, kick 29/29 | 0.6 ms |
| Retrouvé 89–96 | 5 | 5/5 | hat 39/39, kick 28/28 | 0.6 ms |

**Verdict: Fail, 4/5 loops.** Mute and solo pass: 10/10 rows saved while muted or soloed out kept
every hit.

**D7-11. Save renames the previous loop's sound instead of saving this one.**
- **How it happens:** `last[row]` isn't cleared when the loop changes. Saving a row whose sound
  and step list match the previous loop's saved row becomes `patchSound` (a rename) of that older
  sound.
- **Effect:** the new loop's timing and velocities are never stored, and the first loop's sound
  loses its name.
- **Frequency:** 3 of 25 saves (lost-21 clap and perc, mason-17 perc). The store holds 22 sounds
  where 25 were expected, and 3 have `updatedAt` ≠ `createdAt`.
- **Why it matters:** claps on 2 and 4 make identical step lists across loops common.
- **Repro:** save the clap on Lost 77–84, set the loop to Lost 21–28 on the same page, save the
  clap again. The second save sends `PATCH`.

## W8: click to jump (bar: play starts within one 16th of the clicked spot, 5/5 per family)

**Clicks** (real clicks on the UI):
- **Drums:** the ruler's step buttons.
- **Bass:** its 2 bar buttons plus 5 clicks on the bar strip.
- **Melody and FX:** bar buttons.
- All on Retrouvé 89–96 in memory.

**Measure:** I logged every `AudioBufferSourceNode.start` call. The four part sources start at
offset = clicked spot − loop start, **exactly (0 ms)**, on **22/22** jumps (Drums 5, Bass 7,
Melody 5, FX 5). They start 20 ms after the click handler; a 16th is 117 ms. On the strip, the
clicked pixel and the target differed by 5–10 ms (one pixel ≈ 22 ms).

**Product's own measure:** `startErrMs` read −7 to −31 ms. It reads `heardMs` on a 150 ms timer,
so it is coarser than the start log.

**Verdict: Pass.**

## W11: old sounds unchanged

- **Suite:** `pnpm -F 07-six-am test`, **633/633** (63 files). `bass-golden.test.ts` is unchanged
  since slice 1; `drums-make.test.ts` gained tests (R9).
- **Cross-version check:** my 88 renders of old saved sounds are **88/88 identical** to the Phase 6
  base: 12 synth drums in the Studio and in Make, 8 melody, 8 FX, the 4 Phase 4 basses.
- **Browser:** two saved Phase 5-style sounds, `hats-closed-tick` and `hats-open-909`. Each shows
  under "Your sounds" on Closed hat and opens on the Closed hat row with its own Tone, Length and
  Width. The header reads "Closed hat · Closed tick · saved" and "Closed hat · Open 909 · saved".
- **Verdict: Pass.**

## W13: zero bytes of the original stored or sent

- **Network:** 1,660 requests from every page, popup and worker; 69 had a body, **0 binary**.
  - `PUT /api/maps` ≤ 13.5 KB; the longest numeric array is 235, Dubspinna's per-bar levels.
  - `POST /api/sounds` ≤ 3.8 KB, with no numeric arrays: an 8-bar step pattern.
  - `PATCH /api/sounds` 33 B: the D7-11 renames.
  - SoundCloud's widget telemetry.
  - WebSockets: only Next's dev HMR socket.
- **Storage:** localStorage holds the access code; sessionStorage holds the play position and
  Next's dev debug channel. IndexedDB and OPFS are empty; Cache Storage holds only the separation
  model.
- **Code read** (bb7bea0 to HEAD): no new `fetch` or storage calls. The worker read message only
  gains the `openHats` flag.
- **Verdict: Pass (0).**

## Findings

| # | Eval | Finding |
| --- | --- | --- |
| D7-11 | W6 | A save on a second loop renames the first loop's saved row when the sound and step list match (`last[row]` survives a loop change). 3/25 saves; the saved clap kept the other loop's timing (8.4 ms) and velocities |
| D7-12 | W5 | The open-hat reader: 44 % of open hats read open (bar 85 %), 31 % of closed read open (bar 15 %), held-out 23 % / 12 %. Retuned gates reach 53 % on the tuning loops and 8 % held out, and 16 % of open hats never reach the hat row. Recommendation: `READ_OPEN_HATS` off |
| D7-13 | W5b, OR6-3 | Clap and snare bodies land on Closed hat: 0–83 % of the row per loop, 22–24 % on Lost 77 and Retrouvé 113 |
| D7-14 | W5b | Shaker and ride on Closed hat can't be labelled reliably from separated spectrograms (no ride-length hits; the shaker rule isn't trustworthy). Owner check by ear |
| D7-15 | W5 | Reader hat onsets are a median 18 ms before my attack point (19/72 within 10 ms). Partly definitional; re-check if the reader is kept |
| D7-16 | obs. | The same loop reads differently on another capture (Lost 77–84: 5 then 9 open hats). Separation isn't deterministic between loads, which also affects saved rows |
| – | setup | My Dubspinna map gave three loops with almost no drums (map offset or sections). That's my seeding, not the product |

## Cost and time

- No paid API calls.
- Browser session about 75 min: 11 loops captured for W5, 5 edited loops for W6, 22 jumps.
- Unit suite 30 s; hashing 3 s.
