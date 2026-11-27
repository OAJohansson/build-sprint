# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Owner review, contact sheet | Looks childish and too simple; the lanes idea doesn't make sense ("you just click?"). Expects a timeline to see what plays when, e.g. drums and bass for a while, then add another sound | fixed |
| 2 | Owner review, contact sheet | The Turntable frame stood out as "kind of cool" | fixed |
| 3 | Owner review, contact sheet 2 | Picks 04 Record shop, 05 Turntable and 07 '80s drum machine: the warmer colours | fixed |
| 4 | Owner review, prototypes | Prefers the crate along the bottom of the screen (as in Drum machine); move it there in Record shop and Turntable too | fixed |
| 5 | Owner review, prototypes | Likes the colour palettes of Drum machine and Record shop, but the crate design of Turntable (deck plus list); use that crate in the other two | fixed |
| 6 | Design critic, rounds 1–2 (6/10, 6/10) | Brown-on-brown; serif everywhere; solid blocks swamp the dark; waveforms as wallpaper; decorative deck; noisy crate dots; weak drag ghost; five styles in the transport | fixed (deck kept, see 7) |
| 7 | Owner review, critic's take | Prefers the critic's take, but keep the vinyl player bottom left | fixed |
| 9 | Owner, new loops | An error message while trying the sounds. Cause: "Cannot read properties of undefined (reading 'bars')": a sound engine started before the new loops were added (the dev server swaps code into an open page) didn't know them, and the error repeated every 25 ms. Dev-only, but the scheduler now skips anything it can't play and reports it once | fixed |
| 8 | Owner, first listen | "Sounds great." But no visible way to remove a loop from the timeline (only select + Delete, which isn't discoverable); wants press and hold → a bin appears → drag onto it to remove | fixed |
| 10 | Design critic, built view (7/10) | Gold means too many things; titles truncate at 1280; strip repeats BPM and shows "Tags House · House" (bug); "differs" reads as an error; demo player box looks unfinished; empty state hides the table shape | fixed (re-checked 24 Oct) |
| 11 | User test 23 Oct, finding 1 (major) | Half-time BPM: copy and Set Studio use 72.5 where the card says "72.5 or 145.0" | fixed (re-checked 24 Oct) |
| 12 | User test, finding 2 (major) | Muted text below 4.5:1 contrast (worst 2.44:1) | fixed (re-checked 24 Oct) |
| 13 | User test, finding 3 (major) | Model download failed once with a raw JSON error; no size shown at first | fixed (re-checked 24 Oct) |
| 14 | User test, findings 4–7, 9–11 (minor) | Prompt missing confidence/differs/playlists; quiet not-listening cue, no Retry; no title tooltip or filter; guide vanishes before Enable listening; jargon; small buttons; jitter | fixed (re-checked 24 Oct) |
| 15 | Owner, 23 Oct | Wanted to add a second URL to the list; pasting replaces the list instead of adding to it | fixed (re-checked 24 Oct) |
| 16 | User test, value | Mark a track as filed into a playlist; "31 / 56 placed" progress | parked (backlog) |
| 17 | User re-test 24 Oct, N1–N6 (minor/polish) | Half-time big number vs button; step 2 hint lost after a second paste; download hang needs a timeout; copy only top 3 styles; "model" jargon cut off; Camelot cell tooltip | fixed |
| 18 | Design critic after fix pass (7/10) | % not aligned down the column; hover invisible (3rd critic); BPM–Key gutter; ghost rows in the empty state; duplicated toolbar banner | fixed (final score pending) |
| 19 | Design critic, v1.1 (7/10) | Native genre select looks un-Six AM; filter placeholder cut, BPM boxes read "– – –"; my genre clipped in strip and column; owner labels should look different from model output (colour, casing); Track title clipped at 1280 | fixed (re-checked 24 Oct) |
| 20 | User test v1.1 (4/5), F1–F9 | Strip stays on a filtered-out track; typed vs suggested genre variants split; genre cell 16 px; toast over filters; empty "No genre yet" message; BPM accepts letters; select too narrow at 1280; stale option; strip jumps | fixed (re-checked 24 Oct) |
| 21 | User test Mentor 24 Oct (F1–F13) | General-view overflow; jargon in ear training; jobs hidden behind "/"; listen-next links mostly not track pages and slow; edited profile line not visibly used; split reasons; long answers; library facts labelled profile; setup half-save; early 401s; small link targets | fixed (re-check pending) |
| 22 | Design critic, built Mentor panel (6/10; setup 5, settings 6) | Explain restates the strip's numbers and runs long; source legend reprinted per answer in shifting order; cost in the header; groups name bug; 1280 widths; teach is a wall; setup shows the draft twice; My taste doesn't look editable | fixed (re-check pending) |
| 23 | Design critic, final Mentor panel (6/10; Settings 7) | Source markers faint and key scrolls away; taste-setup nag repeated in answers; Explain padded; footer stack; header double truncation; listen-next tag layout | partly in the last fix pass (key pinned, nag once, Explain 2–3 sentences, header, link tags); footer kept for job visibility |
| 24 | Owner review of PR 79 + critic clutter check (6/10) + Web Interface Guidelines | Too much going on (L85–L93 done); then: long answers and help list, loops block, leftover labels/dividers, mono prose, Settings amber counters and "Run setup"; focus loss, unlabelled pick buttons, silent new answers, light-mode scrollbars | fixed (re-test pending) |
| 25 | Final critic, simplified Mentor (6/10; Settings 4/10) | Answers still long and number-heavy; source line wording ("general knowledge"); double confirmation toast; help lists commands; focus ring; Settings layout | last subtraction pass |
| 26 | Design critic, cleanup slice (one critic, scorecard): Analyse 8 → 9/10, Mentor panel 8 → 9/10 | Round 1: gold-looking marks (differs, 30s, ×½), half-word player note, dim questions, button quotes; also asked to drop Also/Tone, the help line, repeated source lines and the likelihood label. Round 2 left: two % headers, actions vs statuses in one grey, toolbar wrap with the Mentor open, Mentor button highlight | round 1 cheap points done; owner-decided items kept (L87, L90, NF5); rest to the backlog |
| 27 | User test, cleanup re-check (A 5, B 4, C 3, D 4) | D1 saved tracks open at bar 37; C1 "this track" follows the conversation, not a newly selected row; B1 Cancel cut off; D2 "Saved" contrast; B2 filter jump; see `user-testing/report-2026-10-25-cleanup.md` | B1, B2, D2 fixed; D1, C1 to the backlog |
| 28 | Design critic, map (one critic, scorecard): 7 → 8 → 9/10 | Header CTA and gold metadata, tall lanes, repeated estimate disclaimers, section starts, two listening indicators, Mentor chrome; then composition, notch | fixed (T55–T58); the gold Start kept (T56) |
| 29 | Design critic, sound drawer: 6 → 8/10 | Prose under knobs, overflow, truncated patterns, far actions, cost ×3, meter sliders; then Mentor strip moves the timeline, cost form per state, slider width, red cap message, edit note, clip labels | round 1 fixed (T67); round 2 in the fix pass |
| 30 | User test Phase 3 (1: 4, 2: 2, 3: 5, 4: 4, 5: 3); `user-testing/report-2026-10-26-phase3.md` | F1–F12 (AI loop overwrites and replaces, cost surprise, Explain recites numbers, can't hear a section, listen wait/Stop, history jargon, add at markers, Analyse list) | fixed (T93), re-test |
| 31 | User re-check Phase 3 (5 / 4 / 5 / 4 / 4); `user-testing/report-2026-10-26-phase3-recheck.md` | F1–F12 hold; N1 off-key loop auto-placed, N2 list shows requested key, N3 knob advice vs shared knobs, N4 capture error wording | last fix pass |
| 32 | User re-check after the owner's review (4 / – / 4 / 4 / 4), real capture; `user-testing/report-2026-10-26-owner-review-recheck.md` | N1 mid-track "outro" ×5, N2 Add as a new sound overwrites, N3 drum slivers, N4 M+S lit, N5 dimmed labels | fixed (T93), re-test |
| 33 | Final check at 56a3ad6 (jobs 1, 3, 4 = 4), real capture | N1–N5 pass; lit S letterless, selected block hidden on silenced lanes, Add-as-new-sound placement unstated, drums through the breakdown | last small pass |
| 34 | User test, follow-up PR (Studio 4, Play all 4); `user-testing/report-2026-10-26-followup.md` | M1 changing a block's preset then Add as a new sound loses the original; minors (strip truncation, end-of-list message, no key on a blank track, Pad pattern name, keyboard hints, knob value) | fixed (T93), re-test |

## Lab S1 user test (26 Oct, `user-testing/report-2026-10-26-lab-s1.md`)

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| LS1-1 | major | Only Drums shows sub-layers; Bass, Other, Vocals are flat and "Other" isn't explained | hints fixed (T93); real sub-layers → backlog |
| LS1-2 | major | "Breakdown" (49–76) looped 49–64 without saying so | fixed (T93), re-test |
| LS1-3 | major | Closing the Deck stops silently; Play then catches up 34 s and resumes 27 s late | fixed (T93), re-test |
| LS1-4 | minor | 6–7 s silence on every jump, resume and loop stop | fixed (L182, L183), re-test |
| LS1-5 | minor | Chord row nearly empty before listening, blank cells unexplained | fixed (T93), re-test |
| LS1-6 | minor | Hear/mute icons only on hover, nothing hints they exist | fixed (T93), re-test |
| LS1-7 | minor | Download ETA started at 159 s, took 30 s | fixed (T93), re-test |
| LS1-8 | minor | Reload: back to 0:00 and "Deck off" with the Deck open | fixed (T93), re-test |
| LS1-9 | minor | Hit areas 24 px (guardrail 28 px) | fixed (T93), re-test |
| LS1-10 | polish | Two chips truncate the title hard | fixed (T93), re-test |
| LS1-11 | polish | "Section 1/2" names | fixed (T93), re-test |

## Lab S1 re-test (26 Oct, `user-testing/report-2026-10-26-lab-s1-retest.md`): jobs 3 / 4

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| LS1-3 | major | Reopening a closed Deck: 35 s wait, resumes 26 s late | fixed (L186, T95), re-test |
| LS1-N1 | major | Lanes come from the full-mix estimate and miss parts the separation plays (vocals in bars 12–20) | fixed (L186, T95), re-test |
| LS1-N2 | minor | Catching-up seconds don't count down | fixed (L186, T95), re-test |
| LS1-N3 | minor | Resume after pause stutters (2.7 s, 2.8 s gap) | fixed (L186, T95), re-test |
| LS1-N4 | minor | Loop's first passes freeze at the wrap 4–6 s | fixed (L186, T95), re-test |
| LS1-N6 | polish | "Not heard yet" hyphen 2.28:1; "← All tracks" 18 px tall | fixed (L186, T95), re-test |

## Lab S1+S2 test (26 Oct, `user-testing/report-2026-10-26-lab-s1s2.md`): jobs 4 / 4 / 3

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| LS2-M1 | major | Card thread 150 px, nested scrolls, answers cut after 3 lines | fixed (L187, L188, T96), re-test |
| LS2-M2 | minor | Hit areas < 28 px: dots, "+ Ask", bar tag, Send, Make link | fixed (L187, L188, T96), re-test |
| LS2-M3 | minor | Outside a loop the Mentor uses the full-mix estimate, not the heard lanes | fixed (L187, L188, T96), re-test |
| LS2-M4 | minor | Hovering a dot shows nothing visible | fixed (L187, L188, T96), re-test |
| LS2-M5 | polish | Jargon (Hz, "minor third"); "can't hear tone, only pitch…" implies hearing | fixed (L187, L188, T96), re-test |
| LS1-N7 | minor | Heard Drums merges the kick/hats rows | fixed (L187, L188, T96), re-test |
| LS1-N6 | polish | "Not heard yet" hyphen still dim | fixed (T96) |

## Lab S2 re-test (26 Oct): job 3 = 3

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| LS2-M1 | major | Card still opens low: thread 97–107 px at 1440×900 (1–2 lines); room above | fixed (T97), re-test |
| LS2-N8 | minor | Drums' previously heard bars reset to estimates after the band change | fixed (T97) |
| LS2-M6 | minor | At unheard bars the answer pads with chord guesses; should say "loop bars X–Y to see it" | fixed (T97) |
| LS2-M7 | polish | "4.5 note starts a bar" → "4–5 notes a bar" | fixed (T97) |

## Lab S2 re-check 2 (26 Oct): job 3 = 4 (pass)

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| LS2-N9 | minor | Heard-bar answers can run 4 long sentences and call unheard bars a "gap" | open (S3 brief) |
| LS2-N10 | minor | The beside card can cover the bars its answer describes | open (S3 brief) |
| LS2-N11 | polish | "+ Ask about the other here", "What's the vocals doing here?" | open (S3 brief) |

## Lab S3+S4 test (26 Oct, `user-testing/report-2026-10-26-lab-s3s4.md`): jobs 4 / 3

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| S5-1 | major | Rename after Save isn't saved; Save stays disabled | fixed (T101), re-test |
| S3-1 | major | A/B below the fold at a 734 px page | fixed (T101), re-test |
| S5-2 | major | No trace of saved sounds in the Lab after a reload | fixed (T101), re-test |
| S3-2 | minor | Suggest settings spins 9 s, no visible change when ticks are current | fixed (T101), re-test |
| S3-3 | minor | Make rail titled "at bar 41" but shows the whole thread | fixed (T101), re-test |
| S3-4 | minor | Drums in Make: no route to the bass | fixed (T101), re-test |
| S3-5 | polish | Knob step 0.01; cut Mentor sentence; loop strip shows a block, not the notes | fixed (T101), re-test |

## Lab S3+S4 re-check (26 Oct): jobs 4 / 4 (pass)

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| S3-N1 | minor | Saved sounds look dead until the loop is read (37 s), nothing says why | fixed (T103); S3-N2 shown by unit test, re-check on a loop with a gap |
| S3-N2 | minor | Mine's 4-bar pattern repeats over the 16-bar loop, so it may play where the original bass is silent | fixed (T103); S3-N2 shown by unit test, re-check on a loop with a gap |
| S3-N4 | polish | "Make a bass instead" and sound names 15–16 px tall | fixed (T103); S3-N2 shown by unit test, re-check on a loop with a gap |
| S3-N3 | polish | A garbled test name in the sandbox library | sandbox data, no fix |

## S5 Studio lanes test (26 Oct, `user-testing/report-2026-10-26-studio-s5.md`): jobs 4 / 4

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| S5-1 | blocker | Undo/redo not saved: an undone lane removal is lost after a reload | fixed (L206, T108), re-test |
| S5-2 | major | Removing a lane with blocks has no confirmation or toast | fixed (L206, T108), re-test |
| S5-3 | minor | Hit areas < 28 px in the lane header, fold, + Add lane | fixed (L206, T108), re-test |
| S5-4 | minor | Contrast 3.0:1 on crate meta, ruler numbers, counts | fixed (L206, T108), re-test |
| S5-5 | minor | Crate shows ~1¼ rows of My sounds | fixed (L206, T108), re-test |
| S5-6 | minor | Block drawer sliders unlabelled, unlike the Lab's knobs | fixed (L206, T108), re-test |
| S5-7 | polish | Hear-only and mute lit together on one lane | fixed (L206, T108), re-test |

## S5 re-check (26 Oct): job 5b = 3; undo passes

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| S5-9 | blocker | Dragging a block reflows the timeline (the remove bin appears, lanes shrink 1,220 → 393 px), so blocks land 20+ bars off and cut their neighbours | fixed (L207, T109), re-test |
| S5-3b | minor | Still < 28 px: Mute clickable 16 px tall (covered), sliders 20 px, + Add lane 26, fold 22 | fixed (L207, T109), re-test |
| S5-6 | minor | Drawer sliders not re-checked (no library block on the re-seeded tracks) | re-check |

## S5 last re-check (26 Oct): job 5b = 4 (pass)

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| S5-10 | minor | A 1-bar overlap trims 8 bars off the neighbour (the overwrite rule trims by whole loop passes) | backlog |

## Phase 5 drums slice, data-evals (28 Oct): Z1, Z2, Z5 fail on real tracks

Details: `evals-runs/2026-10-28-drums-slice.md`.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| D-F1 | major | Kicks read 16–48 ms late on Mason Flint (timed at the low-band peak; the pitch sweep reaches 30–120 Hz late); Mine and saved kicks inherit it | fixed (f83b733), re-graded 12 Nov |
| D-F2 | major | Offbeat open hats read as claps (strong 1–3 kHz passes the clap gates); 31–32 extra claps per loop | fixed (f83b733), re-graded 12 Nov |
| D-F3 | major | Grid phase flips between reads (−49.6 vs +43.3 ms); saved rows land a 16th late | fixed (f83b733), re-graded 12 Nov |
| D-F4 | major | Default Studio track: the one Drums lane takes the whole family, so a dropped clap replaced the kick block | fixed (f83b733), re-graded 12 Nov |
| D-F5 | minor | A/B level within 1 dB on 40/45 (worst −2.37 LU); LUFS match clamped to within 0.9 dB of RMS | fixed (f83b733), re-graded 12 Nov |
| D-F6 | minor | A noise build reads as 46 faint kicks, not marked doubtful | fixed (f83b733), re-graded 12 Nov |
| D-F7 | minor | Kick Suggest moves an independent measure further away on 7 of 9 loops | fixed (f83b733), re-graded 12 Nov |
| D-F8 | minor | Countdown says "5 s" about 1 s before ready | fixed (f83b733), re-graded 12 Nov |
| D-P1 | minor | In Drums the preset, Suggest, A/B and score sit 126–138 px lower than in Bass; A/B and score below the fold at 1440×741 | fixed (f83b733), re-graded 12 Nov |

## Drums re-grade (data-evals, 12 Nov): Z1, Z2, Z5–Z9 pass

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| D-R1 | minor | Flammed claps (first burst 10–13 ms before the kick) timed 8–13 ms late; Lost 21–28 alone 85 % found, 81 % labels | fixed (eed3ce3); D-R1 to confirm on the real loop |
| D-R2 | minor | At 1440×741 in Drums, the A/B and score are ~15 px under the sticky save bar | fixed (eed3ce3); D-R1 to confirm on the real loop |
| D-R3 | — | 16-bar loops can't be live in 35 s (L232: bar is ≤ 8 bars; honest countdown for longer) | decided |
| D-R4 | minor | First countdown figure 1.8–4.6 s too high | fixed (eed3ce3); D-R1 to confirm on the real loop |
| D-R5 | minor | 6–7 Mason pickup/filtered kicks per loop missed, 2 read as hats on step 15 | backlog |

## Drums user test (user-tester, 12 Nov): M-S1 4, M-S2 3, M-S3 4, M-S4 3, M-S5 5

Report: `user-testing/report-2026-11-12-drums.md`.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| U1 | major | One closeness score barely moves for clap or hats (mostly the kick) | fixed (47281c0, ad2b749) |
| U2 | major | An "off" row's reason only in a tooltip | fixed (47281c0, ad2b749) |
| U3 | major | "Play anyway" can't be undone | fixed (47281c0, ad2b749) |
| U4 | minor | Mentor gives tips for a row that is off | fixed (47281c0, ad2b749) |
| U5 | minor | Knob words too coarse (Decay "1/2" before and after a drag) | fixed (47281c0, ad2b749) |
| U6 | minor | Two countdowns disagree (header vs panel) | fixed (47281c0, ad2b749) |
| U7 | minor | A clap dropped on the Drums lane does nothing, silently | fixed (47281c0, ad2b749) |
| U8 | minor | Automatic names describe the wrong sound | fixed (47281c0, ad2b749) |
| U9 | polish | Play button moves sideways as the header text changes | fixed (47281c0, ad2b749) |
| U10 | polish | Greyed "Suggested" pill looks clickable | fixed (47281c0, ad2b749) |
| U11 | polish | Lane label cut to "Claps & sn…"; each drop opens the drawer | fixed (47281c0, ad2b749) |

## Drums re-check (user-tester, 12 Nov): M-S2 4, M-S4 4; U6–U11 fixed

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| N1 | major | Regression from U9: with a long title the Lab header no longer wraps; root 1,602 px wide, "Make" clipped, "Deck on" off screen | fixed (ed9b3e1) |
| N2 | minor | Clap row stays at 22–23/100 with every knob on its tick; only another preset reaches 36 | fixed (ed9b3e1) |
| N3 | minor | An off row still shows a score | fixed (ed9b3e1) |
| N4 | polish | Picking the already-chosen preset doesn't reset its knobs | fixed (ed9b3e1) |

## Melody slice, data-evals (12 Nov): Z3 and Z7 fail; Z4–Z6, Z8, Z9, Z12 pass

Details: `evals-runs/2026-11-12-melody-slice.md`.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| M-F1 | major | Default Studio track: the Chords lane takes Lead and Pads; a dropped lead replaced the chord block (melody version of D-F4) | fixed (cb2e3d4–7f282d8), re-check pending |
| M-F2 | major | Z3: struck stabs read as long held notes (G3 one 6.5 s note); the 7th mostly missed; 27 % pitch classes by onset on Lost 69–76 | fixed (cb2e3d4–7f282d8), re-check pending |
| M-F3 | minor | "B · Mine" enabled when every row is off; plays silence | fixed (cb2e3d4–7f282d8), re-check pending |
| M-F4 | minor | Doubtful verdict flips between two reads of the same loop (repeat-share on its threshold) | fixed (cb2e3d4–7f282d8), re-check pending |
| M-F5 | minor | A monophonic lead with no chords (Mason) is read into Chords; Lead row on 2 of 10 loops | fixed (cb2e3d4–7f282d8), re-check pending |
| D-R1 | minor | Flammed claps still 9–11 ms late on Lost 21–28 (12/15 within 10 ms) | backlog (L244) |

## Melody re-grade and FX first grade (data-evals, 13 Nov)

Details: `evals-runs/2026-11-13-melody-fx.md`. Melody: Z7 and M-F3 now pass; Z3, M-F4, M-F5 still fail on real tracks. FX: timing, pitch, save/reload, layout pass.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| MR-1 | major | Regression: the re-strike split makes the clean G7 stab loop "doubtful" (held pad rule) in 3 of 4 reads | next phase (L247) |
| MR-2 | major | Mason's riff partials form 2–5-note "chords", so it never becomes Lead | next phase (L247) |
| MR-3 | major | Z3 on the real separated part still 35–37 % (bar 70 %); the 7th found on 6 of 53 stabs | next phase (L247) |
| FX-R1 | minor | Impact verdict flips on a borderline jump between reads | fixed (04ec937–b3ceb95) |
| FX-R2 | major | FX rows longer than ~4 bars can't be saved (parser wants 1/2/4-bar patterns) | fixed (04ec937–b3ceb95) |
| FX-R3 | minor | Lost 73–80: B about 1.0–1.1 dB quieter than A (gating vs a silent bar the riser fills) | borderline: −1.01 dB bed on, −0.96 bed off (12b82e9); owner A/B at the final review |
| FX-R4 | polish | Drop note says "Shortened" when a block is split in two | fixed (04ec937–b3ceb95) |

## Final re-test (user-tester, 13 Nov): M-S9 4, M-S10 1, M-S1 4, M-S3 5, M-S5 5

Report: `user-testing/report-2026-11-13-final.md`.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| FN1 | blocker | Mentor in Make returns an error (502): the new F7 rule rejects answers that open with "I can't hear…" twice; two model calls per question, nothing back | fixed (c76da0e) |
| FN2 | minor | A 5-bar riser from bar 52 labelled "bars 51–56", label left of the shape | fixed (c76da0e) |
| FN3 | polish | Bass still shows the disabled "Suggested" pill | left as is (P2: Bass unchanged) |
| FN4 | polish | "Ticks placed" doesn't line up with the Mentor text on the Hats row | fixed (c76da0e) |
| FN5 | polish | Melody tab (off) still offers "Ask about the melody" | fixed (c76da0e) |
| FN6 | polish | Seed script reports the key from its own shell, not the server's | fixed (c76da0e) |

## Design critic on the built room (13 Nov): 7/10 (round 2 was 8)

clutter 1 · hierarchy 2 · legibility 1 · feel 2 · copy 1. Legibility drop is the build meeting real 16-bar data.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| C1 | major | 16-bar strips: hits are 1 px hairlines, hats a smear; 170 px hole right of the lit lane's strip | fixed (c76da0e) |
| C2 | major | Row off said four times; overlay on the strip under the playhead | fixed (c76da0e) |
| C3 | minor | Off-row marks look like a real pattern, so "bleed" reads untrue | fixed (c76da0e) |
| C4 | minor | Bare unitless numbers after knob words ("soft · 25"), small low-contrast value text | fixed (c76da0e) |
| C5 | minor | "Ticks placed" floats at a different x per lane | fixed (c76da0e) |
| C6 | minor | Melody placeholder link is gold (reserved); Melody tab needs a "next" tag like Vocals' "not yet" | fixed (c76da0e) |
| C7 | polish | FX name field clips mid-word; "Mentor:" casing differs | fixed (c76da0e) |

### Phase 6 slice 1 user test (26 Nov, `user-testing/report-2026-11-26-chords-slice1.md`)

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| CS1-1 | major | Chord closeness stuck at 14/100 whatever is picked | fixed (80db130 T182; 4ae77d0 T190): the notes half is now an F-score (what the track plays that Mine covers × what Mine plays that the track has), so G7 98 vs G 86 and one bar changed moves it (97.4 → 95.8) on the Lost re-render; the sound half moves only with preset and knobs, by design |
| CS1-2 | major | Real read of Lost 69–76 flags no bar unsure; the "?" never shows | fixed (80db130, T181): unsure when score < 0.9 or the loop's clear weakest, capped at a third |
| CS1-3 | major | Half-bar chord names drawn at 5 px | fixed (80db130, T183): ≥ 11 px, breaks root / type over two lines, full name in the bar heading |
| CS1-4 | minor | After the fill the track plays, not Make's chords | fixed (80db130, T184): A/B goes to B · Mine when the read is done |
| CS1-5 | minor | Build loops 65–76; graders' loop is 69–76 (test plan note only) | noted |
| CS1-6 | minor | "All N bars" checkbox small, vanishes with one bar left, stays off | fixed (80db130, T184): twins by Make's guess or Mine's chord (stable), on again per bar, 44 px target |
| CS1-7 | minor | 1280 × 720: More chords' last row and "Fewer chords" under A/B | fixed (80db130 T184; 4ae77d0 T191): More's cards scroll into view clear of the A/B bar when it opens |
| CS1-8 | minor | Bass tab's chord strip (G) disagrees with Melody (G7) | fixed (80db130, T185): the strip shows the Melody read for this loop when there is one, else 'chords est.' with an 'older estimate' tooltip |
| CS1-9 | polish | Edited bars look the same as Make's | fixed (80db130, T183): a small teal mark on a tile you picked; tooltip names Make's read |

Re-check of CS1 (26 Nov): CS1-3, 4, 6, 8, 9 fixed; CS1-1 partly (G and G7 score the same, sound half never moves); CS1-7 partly (More's last row still under A/B at 720 px); CS1-2 accepted on the 65–76 and 77–84 reads (today's 69–76 read has no weak cell; PM call). H14 3 taps, job 4/5.

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| CS1-10 | major | "All N bars" groups by the current name, so a pick can overwrite a bar Make heard differently (bar 76 Gm7 lost) | fixed (4ae77d0, T189): bars grouped by Make's guess; "Make's guess" gives each bar back its own guess |
| CS1-11 | minor | After a single-bar edit the box names a group the open bar isn't in | fixed (4ae77d0, T189): the count and name are the open bar's group (bars sharing its Make's guess) |
| CS1-12 | polish | Half-bar names wrap ("D / sus4") and get clipped by beat marks | fixed (4ae77d0, T191): one line, 11 px with tighter tracking on half-bar tiles, no beat marks there |
| CS1-13 | polish | Card mood lines truncate at 4 per row on 1280 | fixed (4ae77d0, T191): moods wrap to two lines; cards grow to fit |

### Phase 6 slice 2 user test (26 Nov, `user-testing/report-2026-11-26-chords-slice2.md`)

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| S2-1 | major | Group edits but single-bar Reset; ≈ 19 taps back to Make's | fixed (661a574, T201): with All ticked the button reads "↺ Reset N bars" and resets the group's notes and times; "Make's guess" restores times too |
| S2-2 | major | Closeness ignores timing | fixed (661a574, T202): the notes half is half pitch match, half an onset F-score against the read events; the chords score shows one decimal |
| S2-3 | minor | Timing targets too small | fixed (661a574, T203): strip 32 px, 16th slots ≥ 24 px wide on desktop, presets and moves 32 px |
| S2-4 | minor | No drag or arrow keys on hits | fixed (661a574, T203): drag a hit along the 16ths (pointer events); ← / → move the selected hit |
| S2-5 | minor | "Longer" disabled without a reason | fixed (661a574, T203): Longer pushes the hits after it; a disabled move says why in its title |
| S2-6 | minor | Your sounds below the preset menu's fold | fixed (661a574, T204): Your sounds first in the preset menu when there are any |
| S2-7 | polish | Chord row scrolls out of view at 720 px | fixed (661a574, T204): the rows (chord tiles, lead) are sticky at the top of the room |
| S2-8 | polish | "G, in Mine" while Mine plays G + A | fixed (661a574, T204): a card with the same name as your own notes reads "your notes (≈ G)", no ✓ |
| S2-9 | minor | At 390 px the Lab has no narrow layout, the chords panel can't be reached (pre-existing Lab limit; backlog) | noted |

### Phase 6 slices 3–4 user test (26 Nov, `user-testing/report-2026-11-26-chords-slices3-4.md`)

S2 re-check: S2-1, 2, 5, 6, 7, 8 fixed; S2-3, S2-4, CS1-12 partly (reopened below).

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| L-1 | major | Selecting a lead note collapses the grid | fixed (d91c6ea, T207): Shorter / Longer / Remove a fixed 32 px row, always in place; the grid keeps its height |
| L-2 | major | Lost 69–76 lead not off | re-checks at ae7ab3e and cc140dd: still on (the live line is the stab's bottom G2, chordTop 0.06–0.16); fixed again (f0408c0, T213): any voice of the chord counts, and a line under C3 is off; needs a live re-check |
| L-3 | minor | Lead cells too small; same-pitch notes merge | fixed (d91c6ea, T207): cells 20 px tall; a note's first 16th has a divider |
| L-4 | minor | Lead closeness ignores note fixes | fixed (d91c6ea, T209): lead closeness counts its notes (pitch and onset) against the read line |
| W-1 | major | "Why it fits" fallback uses numerals and theory words; A♯ for B♭ | fixed (d91c6ea, T205): two plain sentences, no numerals or theory words; notes spelled by the chord (B♭); marker "Six AM's own answer (the Mentor is offline)"; [theory] lines ask the model for the same style |
| ST-1 | major | Studio drawer names chords in the track's key, not Make's | fixed (d91c6ea, T206, L264): each bar "C7 · was G7", line "Moved from G major to this track's key" |
| S2-3b | minor | Hits 24 px, slots 26 × 30 | re-check: hits 30 px (the strip's border); fixed (cc140dd, T212): strip 40 px, hits 32 px |
| S2-4b | minor | Arrow keys move one step, focus drops | fixed (d91c6ea, T210): hits keep a stable key, so focus stays while arrow keys move them |
| CS1-12b | polish | "Fsus4" clipped in half-bar tiles | fixed (d91c6ea, T210): half-bar names shrink to 10 px and read "Fs4"; full name in the heading and aria-label |
| N-1 | polish | Timing move buttons under A/B at 720 px | fixed (d91c6ea, T210): picking a hit scrolls the moves into view above A/B |
| N-2 | polish | Loop label "first 16 bars" for 8 bars | fixed (d91c6ea, T210): the label counts the loop's bars ("first 8 bars"); it was a fixed "16" |

### Phase 6 slices 1–2 app-behaviour grade (26 Nov, `evals-runs/2026-11-26-chords-slices1-2.md`)

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| S-1 | major | Two stabs in one 16th merge on save (Lost 69–76 bar 8: 124 of 128 notes, 30 chords saved where Make played 31); H9 partial | fixed (008cf37, T211): double hits merge in Mine; the save keeps the repeat only when lossless, else the whole loop as played; tested |

### Phase 6 final data-evals pass (26 Nov, `evals-runs/2026-11-26-chords-final.md`)

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| LD-1 | major | Loading a saved lead into Make sets every note's offset to 0 and marks all 8 bars edited (H9 lead partial) | fixed (61974fd, T214): grids keep offset, length and strength; a loaded lead is its own layer, not "edited"; test saved == loaded |
| LD-2 | minor | Mason's lead on at first read, off after reload 4/4 | fixed (61974fd, T216): cause found headlessly in the top-line path (the split stops finding the riff as its own row when pad leaks in); a top line alone no longer switches the lead off; T208's DSP read removed; every guard in `makeLead().guards`; needs a live re-check |
| TH-1 | minor | Em in G minor read ♭vii, should be vi | fixed (61974fd, T215): raised 6th and 7th first in minor; Em in G minor = vi, borrowed from G major |
| TH-2 | polish | ♭VI in A♭ spelled E G♯ B | fixed (61974fd, T215): roots spelled by the numeral's letter: F♭ A♭ C♭ |
| TH-3 | major | Live re-check: on a key stored as "G#" (Dubspinna) every chord spelled in sharps (B♭m read A♯m, D♭ C♯), a regression from T215; TH-2 only fixed for "Ab" | fixed (97f459f, T218): one shared normaliser (`conventionalKey`) before any spelling; G# major = A♭ major, D# minor = E♭ minor; the Lab header and the note names agree; tested |

## Owner final review, Phase 6 (27 Nov)

| ID | Severity | What happened | Status |
| --- | --- | --- | --- |
| OR6-1 | minor | Listen shows Drums, Bass, Other, Vocals; Make shows Bass, Drums, Melody, FX, Vocals ("not yet"). "Other" doesn't say it becomes Melody and FX | open: rename to "Melody & FX" proposed, owner to decide |
| OR6-2 | major | Owner's goal is break down → remake each part → save → rebuild the whole song in the Studio. Make works one looped section at a time and the Studio has no guided rebuild of the original's sections | open: proposed as Phase 7's first job (rebuild the song, then make it yours) |
| OR6-3 | major | Phase 5 owner check "drums close by ear": not close with any preset. Hats play hits the original doesn't have. Cause: three synth rows (909-style voices, not samples); every high sound (shakers, percussion, bleed) lands on Hats; no way to remove a hit or mute a row unless Make flagged it | open: options to the owner (fix-by-ear pattern editing, more rows, a real one-shot sample kit) |
| OR6-4 | good | Phase 5 owner check, FX A/B: the FX sound quite similar to the original drops | pass (owner's ear) |
| OR6-5 | major | In Make (Bass, Drums, Melody, FX) you can't click on the timeline to jump back to a spot; you have to listen through. The Studio has this | open: Phase 7 |
| U7-1 | major | Slice 1 user test: shelf hides 1–5 sounds per row at 1440 (all 3 sampled basses) and ~half at 1280 × 720, no cue | fixed (51764e2, re-check) |
| U7-2 | minor | Sound description cut with "…" for 43 of 60 drum sounds | open: slice 1 fix |
| U7-3 | minor | Drum knob values in Hz / dB / ms / st | fixed |
| U7-4 | minor | Mentor knob tips read contradictory ("Length down to longer") | open: slice 1 fix |
| U7-5 | minor | Sticky A/B covers the "Try X" tip and half of Suggest at 1440 | fixed (drums); bass hint half under A/B at 1440 → in the shelf round |
| U7-6 | polish | "Shaker-like" family in Closed hat; sounds named like their family | open: slice 1 fix |
| U7-7 | polish | Bass lines name the source (tonejs-instruments) | open: slice 1 fix |
| D7-1 | major | W4 fail: bass Drive, Sub, Weight, Wobble move their feature too little (bars in L282) | mostly fixed (51764e2): 124/128; D7-9, D7-10 left |
| D7-2 | minor | Pitch drop reaches only 4.0–4.5 st on 7 presets | fixed (6.7–8.1 st) |
| D7-3 | minor | Round sub's Tone barely moves (Phase 4 preset, golden hash) | accepted (L282) |
| D7-4 | polish | Shortest closed hats can't get 2× longer | accepted (L283) |
| D7-5 | polish | Drive adds little on saturated recordings | accepted (L283) |
| D7-6 | toil | "Suggest for hats" / "closeness · hats" on the Closed hat row | open: slice 1 fix |
| D7-7 | risk | tonejs-instruments' recordings' origin not stated | accepted (L283), viability risk |
| D7-8 | check | W12 timings were on localhost; re-check first taps on the preview | open: final review |
| D7-9 | minor | Regression: Tone on Pure sine moves brightness 1.87× (was 2.12×) after the Weight change | fixed (2.52×) |
| D7-10 | minor | Wobble < 2× on organ-click, fm-glass, filtered-saw | pass on the eval's measure (L284); owner listens at the final review |
| U7-8 | polish | Sound chips 22 px tall (under 24 px) and the last line brushes A/B at 1280 × 720 | open: shelf round |
| U7-9 | polish | Description still cut at 1280 where it shares a row with the knobs | open: shelf round |
| CR2-1 | major | Critic, built slice 2 6/10: steps too thin on 8-bar loops (show 4 bars at a time while fixing) | fixed (L289, L290) |
| CR2-2 | major | Critic: sound strip cut by the sticky A/B row (one bottom bar as designed) | fixed |
| CR2-3 | minor | Critic: "in Drop 2 · bar 77" vs "Looping Build, bars 76–83"; "— / 100" on ear rows; note wraps; save bar repeats itself; done-state wording | open: slice 2 fix |
| U7-10 | major | Drum steps too thin to tap (4.6 / 3.3 px) | fixed |
| U7-11 | major | Edits gone after reload; loading a saved row doesn't restore its hits | fixed |
| U7-12 | minor | A row Make read nothing on has no line and isn't counted | fixed |
| U7-13 | major | Drums ruler jump 2–3 sixteenths late | fixed |
| U7-14 | minor | No repeat-bar for offbeat patterns | fixed |
| U7-15 | minor | Bass jump only on a thin strip, few bar labels | mostly fixed (Bass labels sparse) |
| U7-16 | minor | Save per row only | backlog |
| U7-17 | polish | Old synth drum knobs show A1 / ms | fixed |
| U7-18 | polish | Zero-state wording | fixed |
| D7-11 | major | W6 fail: saving a row on a second loop can rename the first loop's saved sound (`last[row]` not cleared on loop change); 3 of 25 saves | fixed (71aa3f4) |
| D7-12 | major | W5 fail: open-hat reader 44 % / 31 %; retuning won't pass | decided: reader off (L287) |
| D7-13 | minor | Clap / snare bodies land on Closed hat (0–83 % of the row per loop) | accepted for now: fixable by ear; backlog |
| D7-14 | check | W5b needs the owner's ear | open: final review |
| D7-15 | polish | Hat onsets a median 18 ms early vs the grader's attack | backlog |
| D7-16 | note | Separation not deterministic between captures (5 vs 9 open hats on one loop) | known (Phase 4 Demucs) |
| U7-19 | minor | After a reload a hit that's new in the re-read shows as "you took out" | fixed (re-checked) |
| U7-20 | polish | Page buttons "76 | 80" don't read as pages; reason cut at 1440 with the shelf open | fixed (a19debe) |
| CR3-1 | minor | Critic slice 3 9/10: count wording ("0 to fill" vs "all filled"); pads offered in Chords unexplained; "Make one in Make" dead end; bar ranges missing on columns that fit | fixed (0465af1) |
| U7-21 | minor | "Rebuild this song" link hard to find (critic agrees) | fixed (0465af1) |
| U7-22 | minor | Measured-empty vs unmeasured vs empty slots look the same | fixed (0465af1) |
| U7-23 | polish | Bar ranges drop on narrow sections | fixed (0465af1) |
| U7-24 | polish | Empty strip band after the first fill | fixed (6b0950f) |
| U7-25 | polish | Part names cut | fixed (0465af1) |
| D7-17 | minor | After a reload, untouched steps follow the new reading, so an edited loop can play hits the owner never heard (kick 27 → 30) | fixed (72e06b8); re-check with slice 4 |
| D7-18 | check | Rebuild hints only graded on the seed's idealised curves; check on a real map | open: final review |
| CR4-1 | minor | Critic slice 4 9/10: measured-empty cells read as black blocks; ruler "Rebuild this song →" reads as an outro note; transport nudges with the bar label width; "Playing the original" too dim; Deck says "for the Lab"; strip "key G" | open: final polish |
| U7-26 | minor | Studio Play shows ▶ while the original plays | open: final polish |
| U7-27 | minor | Empty-lane Make link doesn't carry the section's bars | open: final polish |
| U7-28 | polish | Ruler link hides Outro's bar number | open: final polish (link removed, CR4-1) |
| U7-29 | polish | No way to start the rebuild from an arbitrary bar | open: final polish |

