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
| 20 | v2 critic round 1 (5/10) | Daily dots read as bands; green appointment dots; slider-like change marker; tall before box; two disagreeing day counts | fixed (dots only over 4 weeks, ink ticks, a step in the bar, short band, one count) |
| 21 | v2 critic round 2 (5/10) | Graph starts too far down; medicine rows hard to read; before marker looks like a widget | owner's calls: graph first, summary as a slim row, before band kept on the left; medicine rows reworked |
| 22 | v2 critic | Month calendar reads as a second, louder chart | owner kept it as "Your days" (where past days are edited); backlog item to revisit |
| 23 | v2 audit 1 | Medicine label ran off the screen at 320 px; truncation cut the amounts first | fixed: labels use the strip's full width, only the name is shortened |
| 24 | v2 audit 2 | One-day range drew "Today" twice (duplicate key) | fixed: ticks de-duplicated, one point shows only "Today" |
| 25 | v2 audit 3, 4 | 1–2 check-ins: blank graph but a verdict in the caption; one-point average pieces vanished | fixed: dots shown while check-ins are few, no plain line below 3 check-ins, one-point pieces drawn as dots |
| 26 | v2 audit 5, 6 | White 80% text on mauve 3.97:1; dots 2.44:1; as-needed bar 1.27:1 | fixed: full white, solid dots, as-needed bar in --ink-faint |
| 27 | v2 audit 7, 8 | Long unbroken names caused sideways scroll (relief prompt, Noted, readout, dose sheet) | fixed: overflow-wrap anywhere; checked at 320 px with a 63-character name |
| 28 | v2 audit 9, 11, 13, 14, 27 | Readout height jumped; odd screen-reader label; no keyboard scrubbing; live region chattered; picked day carried over | fixed: fixed-height readout, label reworded, arrow keys on the graph, no live region, chart keyed by symptom and range |
| 29 | v2 audit 16, 17 | Know dropped the as-needed rule for mixed medicines; three card lines steered towards a form ("flare-ups", "regular daily plan", "discreet") | fixed: rule shown; the three lines removed (guardrails win over the brief's background notes) |
| 30 | v2 audit 18, 20, 24, 25, 26, 31, 33 | Summary key by name; verdict from one check-in; plan row's spoken label; no confirmation after as-needed log; Noted hidden by relief prompt; empty boxes; "←" read aloud | fixed |
| 31 | v2 audit 12, 19 | Today's plan list gets long (3 medicines × 4 times); green "taken" tick reads as a judgement | open: owner's call |
| 32 | v2 audit 15, 21–23, 28–30, 32 | Focus in sheets and cards; calendar cells 36 px at 320; "None" days look empty; radio keys; very old stopped medicine stretches "since starting"; input max lengths | backlog |
| 33 | v2 time-passes test | "1 quick questions"; stale "Noted" after the plan day; Next against the field; the chart could fail to draw when the page opened in the background (ResizeObserver) | fixed |
| 34 | User test 20 Oct F1 (major, Priya) | Journey caption gives a level ("anxiety mostly quite. Before treatment: quite") so it reads as no change, while the line (2.21 → 1.54) and the Summary say "a little better"; the main signal only half met | decided (owner, 20 Oct): caption as then → now in the Summary's words ("Before treatment: quite. Last 4 weeks: a little to quite · a little better"), no date (a date next to the vape start invites a causal reading) |
| 35 | User test F5 | Summary card mixes two comparisons ("About the same" vs last stretch, "Now: better" vs before treatment) without saying which is which; Journey and Summary disagree on anxiety | decided (owner, 20 Oct): label both, "Since last visit: …" and "Since before treatment: …" |
| 36 | User test S1a (guardrail near miss) | Amount steppers start at values she didn't enter (oil 0.5 ml, vape 2 puffs; as-needed sheet preset 2 puffs) | decided (owner, 20 Oct): amounts start blank and are required; the as-needed sheet uses her own usual amount from My plan |
| 37 | User test S1b, F6 | "Last appointment" prefilled (28 days ago) and a new medicine's "Started" defaults to today: unnoticed, both write wrong history; setup takes only one medicine | decided (owner, 20 Oct): ask with rough quick picks (This week / About a month ago / About 3 months ago / Pick a date), skippable, no guessed date; setup ends with "Anything else on your plan?" Add another / That's all |
| 38 | User test F2 (downgraded: the agent reported a wrong-day dose; the code shows the 00:30 tick counts for last night as designed) | Between midnight and 04:00 the screen says "Mon 26 Oct · Your plan today" while showing last night's plan; the dose shows under Monday in Your days | open |
| 39 | User test F3, F7 | Worse is at the top of the graph (better = falling line); appointment ticks look like date ticks, so the vape start reads as "around 5 Sep" (actual 6 Sep) | open |
| 40 | User test F4 | Last night's relief question stays on Today all day, above tonight's dose | open |
| 41 | User test S1c | Only one condition can be picked (Priya has anxiety and sleep) | backlog |
| 42 | User test F8, F9, F10, S1d, S1e | Sam's note hint for every condition; "Logged now" before picking; "Noted" pushes the screen down 44 px; "tired today" on a before question; 40 px date fields | open (quick fixes) |
| 43 | User test value | Doctor would ask for puffs per week and whether drowsiness is on vape days; Priya wants "vape used 3–4 days a week since 6 Sep" under the strip | backlog |
