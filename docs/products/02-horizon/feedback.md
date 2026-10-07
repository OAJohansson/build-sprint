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

## Round 2: simulated user test with Noor, 7 Oct

From the [user test](#02-horizon.testing). F-numbers refer to that report. It ran against the
live MVP before round 1's fixes, so F1 was already fixed. Blockers (wrong data, looks broken)
fixed straight away; the rest to prioritise together.

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 9 | Bug | **Text unreadable on daytime and golden skies (F1):** 1.7–2.6:1. | fixed in #1 |
| 10 | Bug | **Reopened on yesterday's searched city (F2):** "9:24 until sunset" for Lisbon while in Bali. Wrong data for the main job. | fixed: if location worked before, the app always reopens there; searched places stay one tap away |
| 11 | Bug | **Tomorrow's countdown over today's times (F7):** "until sunrise tomorrow" above today's sunrise; evening golden hour shown before dawn. | fixed: rows show the day of the next event with a "Tomorrow" label; before sunrise the row is "Golden light until 06:27" |
| 12 | Bug | **Sun covers the digits at midday (F6).** | fixed: the sun fades while it passes behind the countdown |
| 13 | Requirement | **Polar days don't say what's next (F8, R8).** | fixed: "No sunset today · Next sunset 27 Jul". Note: suncalc's strict definition (top edge, refraction) ends Tromsø's midnight sun on 26–27 Jul; commonly cited is 22 Jul |
| 14 | UX | **Dead end after refusing location (F9):** no close button, no hint. | fixed: close button; "allow location in your browser's settings" |
| 15 | Product | **The sunset moment falls flat (F3):** "0:01" for a minute, then straight to "11:47 until sunrise tomorrow". Job 3 (the ritual). | open |
| 16 | Design | **Tokyo Tower looks like the Eiffel Tower (F4).** | open |
| 17 | Design | **Landmark too small for a sense of place, and invisible at night (F5).** The known cost of Arc. | open |
| 18 | UX | **"1:30" has no units; place button 36 px, top of screen (F10).** | open |
| 19 | Product | **A "This week" strip:** sunset times for the next 7 days and the trend, for evening planning. | open |
| 20 | Process | **Automatic contrast check in the test harness**, so the readability guardrail gets a number every run. | open |
