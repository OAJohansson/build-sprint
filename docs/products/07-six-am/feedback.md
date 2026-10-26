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
