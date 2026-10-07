# Journey

How CrossFit Log got from idea to its current version: what happened, what was decided and why.
Newest last. Pull requests are in the `OAJohansson/build-sprint` repo.

## 6 Oct · Day 1

### Kick-off
- **Problem, in my words:** years of CrossFit without consistent tracking; Olympic lifts (cleans,
  snatches) never get logged. I want to talk instead of type.
- **First bet:** talk for 20 seconds after class, Claude turns it into structured lifts, one tap to
  save, per-movement history shows progress.

### MVP v1: voice log (PR #1)
- Browser dictation → Claude parses the note into lifts → review and edit → saved on the phone
  (localStorage). History tab and a per-movement "Progress" list with PBs.
- Deployed to Vercel at **crossfit-log.vercel.app**. Learned the deploy process along the way:
  importing the repo, giving the Vercel GitHub app access to the repo, setting the Root Directory
  to `apps/01-crossfit`, renaming the project and adding a domain.

### Paying for the AI step
- A Claude subscription can't power a deployed app; only an API key can. Considered hosting the
  app inside Claude instead, and chose Vercel + API key to learn the real deploy path.
- The public URL could run up costs, so the AI step needs an **access code**. Visitors get a free
  demo. A spend cap is set in the Anthropic console as a backstop. (PR #1 follow-up)

### First bug: dictation repeats words (PR #2)
- Saying "test again" became "testing testing testing…" on the phone. Fixed by rebuilding the text
  from all results instead of appending each one.

### "The MVP is quite poor": needs brainstorm
- The first build was centred on *logging*, but the real job is *knowing my numbers in class*
  ("coach says 70% of your 1RM and I never remember my PB").
- Refined needs, ranked: PB lookup in seconds → percentage maths → PB entry (including day one) →
  quick voice logging → weekly calendar → clean overview → minimal UI.
- Added: rep maxes (1RM/3RM/5RM), entering existing PBs on day one, a categorised movement list
  (Olympic, Strength, Gymnastics, KB & DB, Cardio, WODs), a PB celebration, WOD scores and
  benchmark WODs (Fran, Grace, Murph…), and data saved in a database.
- Parked: estimated 1RM, demo mode for recruiters, real accounts.
- **North star:** "Coach says 70% of your snatch, and I know what to load in 5 seconds."

### Design: three options, one chosen
- Three approaches on the [design canvas](https://claude.ai/artifact/244xnmDMMpHvigepL751qX):
  **A** numbers-first PB board, **B** journal-first with AI summary, **C** one box to ask or log.
- **Chosen:** A's PB board as home, plus B's AI review and PB celebration for logging. A clickable
  six-screen prototype was added to the canvas.

### Data: Supabase, single owner (decision 0005)
- A new free Supabase project (tidier than sharing the kids-app one). Only the server talks to it;
  the access code acts as the login. Real accounts are parked.

### v2: PB board (PR #3)
- PB board home, lift page with a percentage grid, PB entry by hand, voice or pick-from-list
  logging, AI review with NEW PB tags, celebration, calendar tab, Supabase storage.

## 7 Oct · Day 2

### Setting up Supabase, and two days of "it doesn't work"
- Step-by-step Supabase setup (project, tables via SQL, keys into Vercel).
- **Couldn't save a PB:** Vercel had the *publishable* key, which can read but not write.
- PR #4: the app detects that key up front and names database problems. Also, dictation still
  repeated on Chrome, so Android now listens one phrase at a time, plus a `?debug` view.
- **Feedback:** users must never see database or key errors. PR #5: everyone sees "Something went
  wrong. Please try again later."; the real reason goes to the Vercel logs (`[crossfit] …`).
- **The app wouldn't load** and "Try again" looked dead. It did retry, but failed instantly with an
  identical screen. PR #6: a visible "Trying again…", a "still not working" note, and a way back
  to the access-code screen. The Vercel log confirmed the publishable key; after swapping in the
  secret key, the app works.

### Review round 1
- Logged in [Feedback](#01-crossfit.feedback): empty-state copy, duplicate "Add PB" buttons, the
  app feeling PB-only, removing "your 70% is now" from the celebration, removing the kg toggle.

### Simulated user testing
- Built a reusable system (decision 0006): persona + scenario plan + a `user-tester` agent that
  uses the real app as the persona and reports on friction, value and progress.
- First run on CrossFit Log with **Sam**, a 32-year-old CrossFitter. See
  [User testing](#01-crossfit.testing).

### Wrap-up
- Triage rule: fix what shows wrong numbers or looks broken if it's quick; park the rest. Fixed in
  PR #7: rep-max PBs from working sets, percentages always on the 1RM, "510" → 5:10, training
  days instead of sessions, no 70% line, no kg toggle, one "Add PB" button, new empty-state copy.
- Parked with a "start here" note: the Progress section on Home (#9).
- Retro written; three process changes carried into the playbook for the next product.
- Status: **shipped**.

### Follow-up estimates and Progress designs
- Estimated four backlog items (my build time): Progress section 2–3 h, edit a saved session
  ~1.5 h, demo mode ~1.5 h, server-side transcription 2–3 h plus a second speech-to-text provider
  and its key. Suggested order: Progress → edit → demo; transcription only if phone dictation is
  still poor after the phrase-by-phrase fix.
- Three Progress designs on the design canvas: **P1** progress on Home above the PBs, **P2** a
  separate Progress tab with a one-line teaser on Home, **P3** a weekly recap and milestone
  timeline. Plus a lift page with a trend chart that works with any of them.

### Progress, editing and demo mode (PR #8)
- Owner feedback on P1: bars, "6 of 8 weeks at 3+" and a streak all show the same thing. Settled
  on one element: a **weekly-goal row** (8 weeks, filled when 3+ days, this week fills up) with
  the streak as the headline. It motivates, says what to do this week, and a missed week costs one
  pill rather than everything.
- Built P1: Home is "My training" with the weekly-goal row, "Moving up" (lifts with a mini chart
  and "+17.5 kg since…") and repeated benchmarks, then PBs. Each lift page has a trend chart of
  the top set per session against a dashed 1RM line.
- Edit a saved session from the calendar; the PBs it set are worked out again.
- Demo mode: "Try the demo" on the access-code screen loads eight weeks of sample training in the
  browser. Nothing is saved and the AI isn't called. The "Home" tab replaces "PBs".
- Transcription stays on hold until phone dictation has been tested.

### "This week" instead of the week pills (#19)
- Owner feedback: the 8 pills looked like one progress bar, and "Start a streak" (weeks) next to
  "1 of 3 days" (days) mixed two measures. New users also saw seven empty weeks before they'd even
  started.
- Replaced it with a **This week** card: three dots (one per training day needed), a hint such as
  "1 more day keeps your streak going", and the streak as a small badge once it's running. Looking
  back belongs in the calendar.

### Notebook restructure
- Each product now keeps everything in one place: journey, feedback, user testing, backlog,
  learnings and decisions, as sub-pages in this notebook.
