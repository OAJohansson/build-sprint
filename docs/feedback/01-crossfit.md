# CrossFit Log: review feedback

Running log of app-review feedback. Bugs that block reviewing get fixed straight away; everything
else waits here until the full review is done, then gets prioritised together.

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

## Round 1 (7 Oct)

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Bug | Adding a PB (Snatch 70 kg) fails with "Something went wrong saving or loading." | fixed in code: users see only "Something went wrong. Please try again later."; the real cause (wrong key type, missing tables, database error) goes to the Vercel logs. Confirm on the live app |
| 2 | Bug | Dictation in Chrome still repeats what I say over and over. | fixed in code: on Android, listens one phrase at a time. Confirm on a real phone (`?debug` shows raw events) |
| 3 | Copy | Empty-state line "Add them once and they're here when the coach says 70%" isn't descriptive enough. | open |
| 4 | UX | Two buttons do the same thing on the empty home screen: "Add PB" (top right) and "Add your first PB" (middle). | open |
| 5 | Product | The app reads as PB-only ("MY PBs" title, "PBs" tab). Its purpose is tracking training, PBs included. | open |
| 6 | Bug | App doesn't load ("Something went wrong") and "Try again" seems unclickable. | fixed the button: it retried but failed instantly with an identical screen. Now shows "Trying again…", says when it's still failing, and offers "Enter the access code again". The load failure itself is a server setting; the cause is in the Vercel logs (`[crossfit]`) |
| 7 | UX | The new-PB celebration says "Your 70% is now 50 kg". Not needed in the celebration; remove it. | open |
| 8 | UX | The "kg" unit toggle in the bottom navigation isn't needed. Keep everything in kg for now. | open |

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
