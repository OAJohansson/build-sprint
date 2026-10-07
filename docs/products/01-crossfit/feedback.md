# CrossFit Log: review feedback

Running log of review feedback: my own reviews and simulated user tests. Bugs that block reviewing
get fixed straight away; everything else waits here until the full review is done, then gets
prioritised together.

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

## Wrap-up (7 Oct)

Triage rule before moving to the next product: fix anything that shows wrong numbers or looks
broken if it's quick; park the rest with a clear note. 11 fixed, 7 parked (in [Backlog](#01-crossfit.backlog)).

## Round 1 (7 Oct)

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Bug | Adding a PB (Snatch 70 kg) fails with "Something went wrong saving or loading." | fixed: the real cause was a publishable key in Vercel; swapped for the secret key, confirmed working |
| 2 | Bug | Dictation in Chrome still repeats what I say over and over. | fixed in code (phrase-by-phrase on Android); **confirm on a real phone** |
| 3 | Copy | Empty-state line "Add them once and they're here when the coach says 70%" isn't descriptive enough. | fixed: "Know your numbers" + "Add the PBs you already know. Next time the coach says “70% of your 1RM”, you’ll see the weight straight away." |
| 4 | UX | Two buttons do the same thing on the empty home screen: "Add PB" (top right) and "Add your first PB" (middle). | fixed: top-right "Add PB" only appears once the first PB exists |
| 5 | Product | The app reads as PB-only ("MY PBs" title, "PBs" tab). Its purpose is tracking training, PBs included. | parked: solved by #9 (progress at the top of Home) |
| 6 | Bug | App doesn't load ("Something went wrong") and "Try again" seems unclickable. | fixed: visible "Trying again…", "still not working" note, way back to the code screen |
| 7 | UX | The new-PB celebration says "Your 70% is now 50 kg". Not needed in the celebration; remove it. | fixed: removed |
| 8 | UX | The "kg" unit toggle in the bottom navigation isn't needed. Keep everything in kg for now. | fixed: removed, kg only |

## Round 2: simulated user test (7 Oct)

From the [user test with Sam](#01-crossfit.testing). F-numbers refer to that report.

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 9 | Product | **No way to see progress (F6).** Only history lists; no trend, no "+X kg since", no weekly consistency. Job "see I'm progressing" scored 2/5; "Am I getting stronger?" failed. Suggested: a Progress section on Home with a consistency strip, lift changes and benchmark changes. | parked: **start here next time** (see Backlog) |
| 10 | Bug | **Working sets become rep-max PBs (F2).** 5 × 3 @ 90 is recorded as a 3RM, so the board and its percentages show numbers that aren't real maxes. | fixed: only a single set counts as a rep max |
| 11 | Bug | **Percentages silently switch base (F3).** With no 1RM record, percentages use a 2RM/3RM even when a heavier single is logged, so the coach's 75% comes out about 10 kg light. | fixed: percentages always use the 1RM; without one, the app says so |
| 12 | Bug | **"510" saves Fran as 8:30 (F1).** Time field has a text keyboard and no preview; digits without a colon are read as seconds. | fixed: number keypad, "510" reads as 5:10, preview before saving |
| 13 | UX | **Saved sessions can't be edited (F4)**: only deleted. No way to fix one weight or move a session to another date. | parked |
| 14 | Bug | **Sessions vs training days (F5).** Logging twice in one day counts as 2 sessions, so "this week" is wrong. | fixed: home and calendar count training days |
| 15 | UX | **Note hidden while checking (F7).** "What you said" is collapsed on Check & save, which makes AI mistakes harder to spot. | parked |
| 16 | Bug | **Calendar week count cut at month edges (F8)**; "×3" is cryptic; the day panel doesn't change with the month. | parked (week column now says "3d" instead of "×3") |
| 17 | UX | **Day-one PBs dated today (F9)**, and each saved PB goes to the lift page instead of letting you add the next one. | parked |
| 18 | Copy | **Database-ish words (F10):** "first record", "added", "from a session"; a lift appears twice in history; empty filter says "Nothing matches “”". | parked |

### Options to discuss later

**#3 Empty-state copy.** Headline and line ideas:
- "Know your numbers" / "Add the PBs you already know. Next time the coach says '70% of your 1RM', you'll see the weight straight away."
- "Your PBs, ready in class" / "Add a lift once and get its 50–90% weights worked out for you."
- "Start with what you've already lifted" / "Snatch, clean & jerk, back squat, Fran. Add your bests and the app does the percentage maths."

**#4 Duplicate add buttons.**
- A: Hide the top-right "Add PB" until the first PB exists; the empty state owns the action.
- B: Keep only the top-right button; the empty state just points to it.
- C: Turn top-right into a small "+" icon and keep the big empty-state button as the obvious first step.
- D: Move "Add PB" next to "Log class" in the bottom bar (one place for all adding).

**#5 More than PBs.**
- A: Home becomes an overview: this week, last session, then PBs. Title "CrossFit Log"; tabs Home / Calendar / PBs.
- B: Rename the tab and title to "Lifts" or "Progress", so PBs are one part of each movement's page.
- C: Make the last logged session the first thing on Home, with PBs below.
