# Test plan: Six AM

## How to run the app for testing

- Start: `pnpm -F 07-six-am dev` (port 3007, so it can run next to Folio on 3000). No keys
  needed; the MVP crate is bundled CC0 audio.
- Viewport: 1440 × 900 (laptop). The product is desktop-first; phone is out of scope.
- Seed data: first run = clear localStorage. Returning user = one saved recording of about a
  minute (a `seed` recording in the app's demo data, or record one in S2 and reload).
- Simulated parts: **the agent can't hear.** Browsers only allow sound after a click, which the
  agent's clicks satisfy, but it judges timing from what it can read: the playing state of each
  clip and the transport position (bar and beat), read in the page with JavaScript. Whether it
  *sounds* like house is the owner's call, in a real listen after each run.

## Scenarios

### S1 · First sound
- **Moment:** an evening at home, laptop and headphones, first time opening the app.
- **Task:** "I just want to hear something good."
- **Success:** something playing in ≤ 30 seconds and ≤ 2 clicks, with no tutorial and no settings.

### S2 · Build a track on the timeline
- **Moment:** same evening, 20 minutes in, playful.
- **Task:** "Start with a beat, bring in a bassline after a while, add chords, take the drums out
  for a bit, bring them back."
- **Success:** a timeline of ≥ 2 minutes with at least 4 loops from the crate, made without help,
  in ≤ 10 minutes. Every loop sits on a bar line (check the stored positions), and repeats are
  whole loop lengths.

### S3 · The club moves
- **Moment:** the groove is going and they want a moment of tension.
- **Task:** "Make it sound like it's coming from outside the club, then open it back up."
- **Success:** finds and uses the filter without help; the sound changes smoothly with no jumps
  (no sudden value changes in the filter's readout).

### S4 · Play it back
- **Moment:** later the same week, the app reopened after a reload.
- **Task:** "Play me what I made on Thursday."
- **Success:** the track is there and every loop is at the same bar with the same length as
  before the reload (compare the stored track before and after).

### S5 · Time passes (04 Mallow)
- **Moment:** a long track played on loop for 20 minutes; the tab sent to the background and
  brought back.
- **Task:** carry on playing and editing.
- **Success:** loops still start on their bars after the long run and the background tab; the
  playhead matches the sound and hasn't drifted or reset.

## Value questions

- Did it feel like *making* music or like playing someone else's track? (The riskiest assumption.)
- Which part of the crate or which control would they reach for every time? Which never?
- What's missing that would make them come back tomorrow: more sounds, more moves, humming?
- Would they play the track to a friend?

## Trust checks

- After S2, compare the stored track (each loop's bar and length) with what is on screen, one by one.
- Credits: every sound in the crate is listed with its CC0 source.
- Ask afterwards: "Did anything feel like it was chosen for you rather than by you?"

## Out of scope

Phone layout, humming (v2), Freesound search, export, sound quality beyond "does it play" (the
owner judges sound by ear).
