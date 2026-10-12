# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Audit (web-design-guidelines) | Today had no `<h1>`; "Noted" relief message not announced (no live region); sheets let scroll chain to the page (no `overscroll-behavior: contain`); headings not balanced | fixed |
| 2 | Audit | Placeholders without `…`, buttons not in Title Case | won't do (house style: sentence case, clean-and-minimal) |
| 3 | break-ui | On a 320×700 phone, the plant pushed "Took a dose" and "How was today?" below the fold; worst on days with a relief question and the appointment card | fixed: plant capped at 30% of the screen, 18% when a card shows |
| 4 | break-ui | "How was today?" wrapped at 320px and crushed its subtitle | fixed |
| 5 | break-ui | Wrong plurals: "1 puffs", "1 capsules" | fixed |
| 6 | break-ui | Day detail: long medicine names made time, name and relief wrap into each other | fixed: time · name (truncated) · relief grid |
| 7 | break-ui | Long doctor's name wrapped the Journey card to 3 lines and broke "Summary ›" | fixed: name truncates, link never wraps |
| 8 | break-ui | First summary with no earlier period read "– → moderate · Not enough yet" | fixed: "Mostly moderate", no trend |
| 9 | break-ui | The check-in had no note field, though the brief requires one (requirement 4); only the demo had notes | fixed: optional note, 500 characters |
| 10 | break-ui | Long medicine names took 4 lines each in the dose sheet | fixed: clamped to 2 lines |
| 11 | User test F1 (major) | When an appointment date passes (or moves), Mallow rolls over silently: summary resets to "0 of 3 days logged", countdown vanishes, no prompt for the next date | fixed (owner chose "ask on Today"): nothing rolls over by itself; Today asks "Did your appointment on … happen?" (Yes → next date or "Not booked yet"; It moved → new date) |
| 12 | User test F2 (major) | Relief confirmation named the wrong dose ("this morning's dose" for a 20:42 dose; "Last night" for yesterday morning) | fixed: "Yesterday at 21:30…", "Noted: your 21:30 dose…" |
| 13 | User test F3 (major) | Relief question only appeared after a reload; resuming the tab or home-screen app didn't count as reopening | fixed: re-checked whenever the app becomes visible |
| 14 | User test F4 (major) | Doses and relief ratings can't be edited or deleted; past days can't be filled in | fixed (owner chose full editing): tap any dose to change medicine, amount, time or relief, or delete it; any past day in the calendar can get a check-in or a dose |
| 15 | User test F5 | Grade words rounded ties up ("Mostly moderate" for 9 mild + 9 moderate days) | fixed: "Mild to moderate" when an average sits between two grades |
| 16 | User test F6 | Summary lacks medicine names, as-needed use and the dates it compares against | fixed: a line per medicine (usual amount, doses, days used) and "Compared with …" |
| 17 | User test F7 | Save stays disabled with no reason until every symptom is answered | fixed: button says "2 to go" |
| 18 | User test F8 | Calendar shows one month of one symptom; no "since you started" view; mild shade too faint | mild shade darkened; progress strip parked in backlog |
| 19 | User test F9, F10, contrast | "1 days logged"; 28 px demo band; faint text at 3.06:1 | fixed: plural, 44 px band, faint text darkened to ≥4.5:1 |
