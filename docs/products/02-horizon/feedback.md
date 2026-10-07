# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

## Round 1: interface audit (`web-design-guidelines`), 7 Oct

Run while the simulated user test was in progress, against the live MVP (PR #15).

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Bug | **Countdown hard to read in the afternoon (R9).** White text on light blue measured 1.9:1 (target 4.5:1) when the sun is 16–20° up; the text colour was chosen from the sky as a whole, not the sky behind the text. | fixed: colour picked per area (top bar, countdown), day-sky tops a touch deeper, soft shadow under white text. Worst case now 4.3:1 (a few mid-blue moments) |
| 2 | Bug | "Sunrise" row sat on the pale part of the fade below the horizon. | fixed: the dark ground starts above the rows |
| 3 | Accessibility | The countdown was a live region, so screen readers would announce it every minute. | fixed: removed |
| 4 | Accessibility | Home screen had no heading. | fixed: hidden heading "Horizon: <place>" |
| 5 | Accessibility | Escape didn't close the search; search field had no name. | fixed |
| 6 | Motion | The sun's per-second glide ignored "reduce motion". | fixed |
| 7 | Polish | Buttons have press feedback but no hover state on desktop. | won't do: phone-first; hover adds little here |
| 8 | Copy | Vercel's rules want Title Case buttons. | won't do: sentence case is our style |
