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
| 19 | Design critic, v1.1 (7/10) | Native genre select looks un-Six AM; filter placeholder cut, BPM boxes read "– – –"; my genre clipped in strip and column; owner labels should look different from model output (colour, casing); Track title clipped at 1280 | open |
| 20 | User test v1.1 (4/5), F1–F9 | Strip stays on a filtered-out track; typed vs suggested genre variants split; genre cell 16 px; toast over filters; empty "No genre yet" message; BPM accepts letters; select too narrow at 1280; stale option; strip jumps | open |
