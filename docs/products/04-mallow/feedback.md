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
